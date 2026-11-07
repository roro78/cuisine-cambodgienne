<?php
declare(strict_types=1);
// Separate CLI process, entirely synthetic transport. No secret or provider.
require_once __DIR__.'/../../../public/gestion-contenus/lib.php';
$private=$argv[1];$dist=$argv[2];
$read=static fn(string $n):array=>json_decode((string)file_get_contents($dist.'/'.$n),true,64,JSON_THROW_ON_ERROR);
$catalog=cmsSourceList($read('social-feed.json'));
$canonical=cmsCanonicalSourceList($read('editorial-source-index.json'),$catalog);
$guided=cmsGuidedSourceList($read('editorial-guided-fields.json'),$canonical);
$input=json_decode((string)file_get_contents($private.'/input.json'),true,64,JSON_THROW_ON_ERROR);
$cfg=['editorial_ai_content'=>['enabled'=>true,'qualified'=>true,'mode'=>'async',
    'provider_label'=>'synthetic-provider','model_label'=>'synthetic-model','max_attempts_per_day'=>1,
    'submit'=>static function(array $r,string $id)use($private):array{
        $journal=$private.'/editorial-drafts/ai-content-jobs/'.$id.'.json';
        $entry=json_decode((string)file_get_contents($journal),true,64,JSON_THROW_ON_ERROR);
        if(($entry['job']['status']??null)!=='submission_unknown')throw new RuntimeException('MISSING_INTENT');
        file_put_contents($private.'/calls.txt',$id."\n",FILE_APPEND|LOCK_EX);chmod($private.'/calls.txt',0600);
        usleep(100000);return ['id'=>$id,'status'=>'queued'];
    },'poll'=>static fn(string $id):array=>['id'=>$id,'status'=>'running']]];
$job=cmsAiContentAsyncStart($private,$input,$catalog,$cfg,$canonical,$guided);
echo json_encode(['token'=>$job['token'],'status'=>$job['status']],JSON_THROW_ON_ERROR);
