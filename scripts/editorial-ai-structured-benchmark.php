<?php
declare(strict_types=1);
/**
 * P1C-C3 — CLI bridge for the exact C2 S1 schema.
 *
 * No provider calls, writes to the CMS, approval or publication.
 *   php scripts/editorial-ai-structured-benchmark.php request recette dist
 *   php scripts/editorial-ai-structured-benchmark.php validate recette candidate.json
 *
 * The "request" command prints only the public editorial index projection plus
 * explicitly synthetic test facts. Do not use this CLI with private fixtures.
 */
require_once __DIR__.'/../public/gestion-contenus/lib.php';

$mode=$argv[1]??'';
$kind=$argv[2]??'';
$arg=$argv[3]??'';
if(PHP_SAPI!=='cli'||count($argv)!==4||!isset(cmsCreationKinds()[$kind])
    || !in_array($mode,['request','validate'],true)||!is_string($arg)||$arg===''){
    fwrite(STDERR,"BENCH_USAGE\n");
    exit(2);
}

try {
    if($mode==='validate'){
        $path=realpath($arg);
        if($path===false||!is_file($path)||is_link($path)
            || filesize($path)===false||filesize($path)>30000)
            throw new RuntimeException('INVALID_INPUT');
        $raw=file_get_contents($path);
        if(!is_string($raw))throw new RuntimeException('INVALID_INPUT');
        try {
            $candidate=cmsAiContentCandidate($kind,$raw);
            $result=['scope'=>'S1','kind'=>$kind,'schema_valid'=>true,
                'human_review_required'=>$candidate['requires_human_review'],
                'publication_ready'=>$candidate['publication_ready'],
                'field_count'=>count($candidate['fields'])];
            echo json_encode($result,JSON_THROW_ON_ERROR)."\n";
            exit(0);
        }catch(Throwable $error){
            // Never echo a provider response, private field or raw exception.
            echo json_encode(['scope'=>'S1','kind'=>$kind,'schema_valid'=>false,
                'error'=>'AI_CONTENT_RESPONSE'],JSON_THROW_ON_ERROR)."\n";
            exit(1);
        }
    }

    $dist=realpath($arg);
    if($dist===false||!is_dir($dist))throw new RuntimeException('DIST_MISSING');
    $read=static function(string $file)use($dist):array{
        $path=$dist.'/'.$file;
        if(is_link($path)||!is_file($path)||filesize($path)>5000000)
            throw new RuntimeException('INDEX_INVALID');
        $data=json_decode((string)file_get_contents($path),true,64,JSON_THROW_ON_ERROR);
        if(!is_array($data))throw new RuntimeException('INDEX_INVALID');
        return $data;
    };
    $catalog=cmsSourceList($read('social-feed.json'));
    $canonical=cmsCanonicalSourceList($read('editorial-source-index.json'),$catalog);
    $guided=cmsGuidedSourceList($read('editorial-guided-fields.json'),$canonical);
    cmsAssertGuidedCoverage($guided,$canonical);

    $fixtures=json_decode((string)file_get_contents(
        __DIR__.'/../tests/fixtures/editorial-ollama-benchmark.json'),true,16,JSON_THROW_ON_ERROR);
    if(!is_array($fixtures)||count($fixtures)!==5)
        throw new RuntimeException('FIXTURES_INVALID');
    $fixture=null;
    foreach($fixtures as $item){
        if(($item['kind']??null)===$kind){$fixture=$item;break;}
    }
    if(!is_array($fixture)||!is_array($fixture['verified_facts']??null)
        || !is_array($fixture['checks']??null))
        throw new RuntimeException('FIXTURES_INVALID');

    $reference='';
    if($kind==='atelier'){
        foreach($canonical as $id=>$source){
            if(($source['model']??null)==='recipes'){$reference=$id;break;}
        }
        if($reference==='')throw new RuntimeException('RECIPE_MISSING');
    }
    $context="TEST SYNTHÉTIQUE UNIQUEMENT. Aucun fait supplémentaire établi.\n"
        ."Faits autorisés : ".implode(' ; ',$fixture['verified_facts'])."\n"
        ."Points à vérifier : ".implode(' ; ',$fixture['checks']);
    $request=cmsAiContentRequest([
        'kind'=>$kind,'title'=>$fixture['title'],'angle'=>$fixture['angle'],
        'objective'=>$fixture['objective'],'context'=>$context,
        'reference_id'=>$reference,'semantic_review'=>'1'
    ],$catalog,$canonical,$guided);
    // The same request limits used by C2. No provider details or credentials.
    $request['timeout_seconds']=20;
    $request['max_output_tokens']=6000;
    $request['response_max_bytes']=30000;
    echo json_encode($request,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES
        |JSON_THROW_ON_ERROR)."\n";
}catch(Throwable $error){
    fwrite(STDERR,"BENCH_REQUEST_FAILED\n");
    exit(2);
}
