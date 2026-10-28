<?php
declare(strict_types=1);
require_once __DIR__.'/fixtures/editorial-ai-content.php';
function s1Assert(bool $ok,string $reason):void {
    if(!$ok)throw new RuntimeException('S1_BENCH_'.$reason);
}
$dist=realpath($argv[1]??'');
s1Assert($dist!==false&&is_dir($dist),'DIST_REQUIRED');
$cli=realpath(__DIR__.'/../../scripts/editorial-ai-structured-benchmark.php');
s1Assert($cli!==false,'CLI_MISSING');
$run=static function(array $args)use($cli):array {
    $pipes=[];
    $proc=proc_open(array_merge([PHP_BINARY,$cli],$args),[
        0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes);
    s1Assert(is_resource($proc),'PROC');
    fclose($pipes[0]);
    $stdout=stream_get_contents($pipes[1]);
    $stderr=stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    return [proc_close($proc),$stdout,$stderr];
};
$file=tempnam(sys_get_temp_dir(),'cdc-s1-');
s1Assert(is_string($file),'TEMP');
try{
    s1Assert(chmod($file,0600),'PERMISSIONS');
    $kinds=['recette','culture','atelier','ingredient','technique'];
    foreach($kinds as $kind){
        [$code,$out,$err]=$run(['request',$kind,$dist]);
        s1Assert($code===0&&$err===''&&strlen($out)<90000,'REQUEST_'.$kind);
        $request=json_decode($out,true,32,JSON_THROW_ON_ERROR);
        s1Assert(($request['contract']??null)==='cdc-editorial-ai-content-request-v1'
            && ($request['scope']??null)==='creation-form-core-v1'
            && ($request['brief']['kind']??null)===$kind
            && ($request['timeout_seconds']??null)===20
            && ($request['max_output_tokens']??null)===6000
            && ($request['response_max_bytes']??null)===30000
            && is_array($request['response_schema']['properties']['fields']??null)
            && !str_contains($out,'PRIVATE_CONFIG_NOT_FOR_PROVIDER'),'CONTRACT_'.$kind);
        if($kind==='atelier'){
            s1Assert(($request['reference']['kind']??null)==='recette'
                && isset($request['reference']['recipe_fields']['ingredients'])
                && strlen($request['reference']['fingerprint']??'')===64,
                'ATELIER_CANONICAL_SOURCE');
        }else{
            s1Assert($request['reference']===null,'OTHER_REFERENCE_'.$kind);
        }
        file_put_contents($file,json_encode(contentFixture($kind),
            JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR));
        [$code,$out,$err]=$run(['validate',$kind,$file]);
        $validation=json_decode($out,true,8,JSON_THROW_ON_ERROR);
        s1Assert($code===0&&$err===''&&$validation['schema_valid']===true
            && $validation['human_review_required']===true
            && $validation['publication_ready']===false,'VALID_'.$kind);
    }
    $bad=contentFixture('recette');
    $bad['publication_ready']=true;
    file_put_contents($file,json_encode($bad,JSON_THROW_ON_ERROR));
    [$code,$out,$err]=$run(['validate','recette',$file]);
    $result=json_decode($out,true,8,JSON_THROW_ON_ERROR);
    s1Assert($code===1&&$err===''&&($result['error']??null)==='AI_CONTENT_RESPONSE'
        && ($result['schema_valid']??null)===false
        && !str_contains($out,'publication_ready'),'NO_FORGED_APPROVAL');
    file_put_contents($file,'INVALID_PRIVATE_RESPONSE');
    [$code,$out,$err]=$run(['validate','culture',$file]);
    s1Assert($code===1&&str_contains($out,'"schema_valid":false')
        && !str_contains($out,'INVALID_PRIVATE_RESPONSE'),'NO_RAW_LEAK');
    [$code,$out,$err]=$run([]);
    s1Assert($code===2&&$out===''&&str_contains($err,'BENCH_USAGE'),'DEFAULT_NO_RUN');
    echo 'CMS_S1_BENCHMARK_BRIDGE_PASS '.json_encode([
        'families'=>count($kinds),'provider_calls'=>0,
        'private_saves'=>0,'astro_s2_validated'=>false],JSON_THROW_ON_ERROR)."\n";
}finally{
    if(is_file($file))unlink($file);
}
