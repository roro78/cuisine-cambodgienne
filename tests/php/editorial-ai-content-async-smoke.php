<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/lib.php';
require_once __DIR__.'/../../public/gestion-contenus/content-gateway-adapter.php';
require_once __DIR__.'/fixtures/editorial-ai-content.php';
function asyncCheck(bool $ok,string $why):void{if(!$ok)throw new RuntimeException('ASYNC_TEST_'.$why);}
function asyncReject(callable $fn,string $code):void{try{$fn();}catch(Throwable $e){asyncCheck($e->getMessage()===$code,$code);return;}throw new RuntimeException('ASYNC_ACCEPTED_'.$code);}
$dist=realpath($argv[1]??'');asyncCheck(is_string($dist),'DIST');
$read=static fn(string $n):array=>json_decode((string)file_get_contents($dist.'/'.$n),true,64,JSON_THROW_ON_ERROR);
$catalog=cmsSourceList($read('social-feed.json'));$canonical=cmsCanonicalSourceList($read('editorial-source-index.json'),$catalog);
$guided=cmsGuidedSourceList($read('editorial-guided-fields.json'),$canonical);
$recipe='';foreach($canonical as $id=>$v)if($v['model']==='recipes'){$recipe=$id;break;}
$base=sys_get_temp_dir().'/cdc-ai-async-'.bin2hex(random_bytes(8));mkdir($base,0700);
$remove=function(string $dir)use(&$remove,$base):void{
    if($dir!==$base&&!str_starts_with($dir,$base.'/'))throw new RuntimeException('CLEANUP_SCOPE');
    foreach(scandir($dir)?:[] as $n){if($n==='.'||$n==='..')continue;$p=$dir.'/'.$n;if(is_dir($p)&&!is_link($p))$remove($p);else unlink($p);}rmdir($dir);
};
try{
    $submits=0;$polls=0;
    foreach(array_keys(cmsCreationKinds()) as $kind){
        $private=$base.'/'.$kind;mkdir($private,0700);$phase='running';$sent=[];
        $cfg=['editorial_ai_content'=>['enabled'=>true,'qualified'=>true,'mode'=>'async','provider_label'=>'synthetic-provider','model_label'=>'synthetic-model','max_attempts_per_day'=>1,
            'submit'=>static function(array $r,string $id)use(&$submits,&$sent):array{++$submits;$sent=$r;return ['id'=>$id,'status'=>'queued'];},
            'poll'=>static function(string $id)use(&$polls,&$phase,$kind):array{++$polls;return $phase==='running'?['id'=>$id,'status'=>'running']:['id'=>$id,'status'=>'succeeded','result'=>json_encode(contentFixture($kind),JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)];}]];
        $input=['kind'=>$kind,'title'=>'Sujet asynchrone témoin '.$kind,'angle'=>'Angle à vérifier','objective'=>'Objectif témoin','context'=>'Contexte explicite seulement',
            'reference_id'=>$kind==='atelier'?$recipe:'','semantic_review'=>'1','transmission_review'=>'1'];
        $job=cmsAiContentAsyncStart($private,$input,$catalog,$cfg,$canonical,$guided);
        $expired=$job;$expired['expires_at']=time()-1;$pollsBefore=$polls;
        asyncReject(function()use($private,&$expired,$catalog,$cfg,$canonical){cmsAiContentAsyncPoll($private,$expired,$catalog,$cfg,$canonical);},'AI_CONTENT_SESSION');
        asyncCheck($polls===$pollsBefore,'EXPIRED_JOB_NO_PROVIDER_ACCESS');
        asyncCheck($job['status']==='queued'&&$sent['timeout_seconds']===20,'QUEUED_UNCHANGED_CONTRACT');
        asyncCheck(cmsCreationList(cmsCreationDir($private))===[],'NO_AUTOSAVE');
        asyncCheck(cmsAiContentAsyncPoll($private,$job,$catalog,$cfg,$canonical)===null,'RUNNING');
        asyncCheck(cmsAiContentAsyncPoll($private,$job,$catalog,$cfg,$canonical)===null,'REFRESH_READONLY');
        asyncCheck(count(json_decode((string)file_get_contents(cmsDraftDir($private).'/ai-brief-attempts.json'),true))===1,'ONE_QUOTA_RESERVATION');
        $resumed=cmsAiContentAsyncStart($private,$input,$catalog,$cfg,$canonical,$guided);
        asyncCheck($resumed['token']===$job['token']&&$submits===array_search($kind,array_keys(cmsCreationKinds()),true)+1,'SAME_ID_ACROSS_SESSIONS');
        $different=$input;$different['title'].=' autre';
        asyncReject(fn()=>cmsAiContentAsyncStart($private,$different,$catalog,$cfg,$canonical,$guided),'AI_BRIEF_LIMIT');
        $phase='succeeded';$pending=cmsAiContentAsyncPoll($private,$job,$catalog,$cfg,$canonical);
        asyncCheck($pending['metadata']['scope']==='creation-form-core-v1'&&!$pending['candidate']['publication_ready'],'SAME_C2_CANDIDATE');
        $posted=['kind'=>$kind,'title'=>$pending['candidate']['title'],'angle'=>$pending['candidate']['angle'],'summary'=>$pending['candidate']['summary'],
            'research_note'=>$pending['candidate']['research_note'],'fields'=>$pending['candidate']['form_fields'],'state'=>'draft'];
        $saved=cmsAiContentSave($private,$posted,$catalog,0,null,$pending,$canonical);
        asyncCheck($saved['version']===1&&$saved['origin']==='ai','EXPLICIT_COMMON_SAVE');
        $again=cmsAiContentSave($private,$posted,$catalog,0,null,$pending,$canonical);
        asyncCheck($again['id']===$saved['id']&&$again['version']===1,'REPLAY_SAVE_SAME_ID_VERSION');
        $renamed=$posted;$renamed['title'].=' concurrent';
        asyncReject(fn()=>cmsAiContentSave($private,$renamed,$catalog,0,null,$pending,$canonical),'AI_CONTENT_SAVE_UNCERTAIN');
    }
    asyncCheck($submits===5&&$polls===15,'ONE_SUBMISSION_PER_FAMILY');
    $once=['ai_content_intent'=>str_repeat('f',48)];cmsAiContentIntent($once,str_repeat('f',48));
    asyncReject(function()use(&$once){cmsAiContentIntent($once,str_repeat('f',48));},'AI_CONTENT_INTENT');
    $private=$base.'/failure';mkdir($private,0700);
    $attempts=0;
    $cfg['editorial_ai_content']['submit']=static function()use(&$attempts):array{++$attempts;throw new RuntimeException('PRIVATE_TRANSPORT_FAILURE');};
    $job=cmsAiContentAsyncStart($private,$input,$catalog,$cfg,$canonical,$guided);
    asyncCheck($job['status']==='submission_unknown','LOST_ACK_TRACKED_NOT_RESUBMITTED');
    $recovered=cmsAiContentAsyncStart($private,$input,$catalog,$cfg,$canonical,$guided);
    asyncCheck($recovered['token']===$job['token']&&$recovered['status']==='submission_unknown'&&$attempts===1,'LOST_SESSION_NO_SECOND_TRANSPORT');
    $journal=cmsDraftDir($private).'/ai-content-jobs/'.$job['token'].'.json';
    $entry=json_decode((string)file_get_contents($journal),true,64,JSON_THROW_ON_ERROR);
    $entry['job']['expires_at']=time()-100;file_put_contents($journal,json_encode($entry));
    $recovered=cmsAiContentAsyncStart($private,$input,$catalog,$cfg,$canonical,$guided);
    asyncCheck($recovered['expires_at']>time()&&$attempts===1,'POLL_WINDOW_REFRESH_ONLY');
    file_put_contents($journal,'broken');
    asyncReject(fn()=>cmsAiContentAsyncStart($private,$input,$catalog,$cfg,$canonical,$guided),'AI_CONTENT_JOB_STORE');
    asyncCheck($attempts===1,'CORRUPTION_NO_RESUBMISSION');
    file_put_contents($journal,json_encode($entry));
    $cfg['editorial_ai_content']['poll']=static fn(string $id):array=>['id'=>$id,'status'=>'failed'];
    asyncReject(function()use($private,&$job,$catalog,$cfg,$canonical){cmsAiContentAsyncPoll($private,$job,$catalog,$cfg,$canonical);},'AI_CONTENT_PROVIDER');
    asyncCheck($job['status']==='failed','TERMINAL_FAILURE');
    asyncReject(function()use($private,&$job,$catalog,$cfg,$canonical){cmsAiContentAsyncPoll($private,$job,$catalog,$cfg,$canonical);},'AI_CONTENT_SESSION');
    $invalid=$job;$invalid['status']='running';
    $cfg['editorial_ai_content']['poll']=static fn(string $id):array=>['id'=>$id,'status'=>'succeeded','result'=>'broken json'];
    asyncReject(function()use($private,&$invalid,$catalog,$cfg,$canonical){cmsAiContentAsyncPoll($private,$invalid,$catalog,$cfg,$canonical);},'AI_CONTENT_RESPONSE');
    asyncCheck($invalid['status']==='failed'&&cmsCreationList(cmsCreationDir($private))===[],'INVALID_RESULT_NEVER_SAVED');
    $url='https://n8n.orvekio.com/editorial-ai/v1/jobs';$token=str_repeat('s',48);$id=str_repeat('e',48);
    $a=cmsAiContentJobTransport($url,$token,$id,null,static fn()=>json_encode(['id'=>$id,'status'=>'running']));asyncCheck($a['status']==='running','TRANSPORT');
    asyncReject(fn()=>cmsAiContentJobTransport('http://ollama:11434',$token,$id),'AI_CONTENT_GATEWAY_CONFIG');
    asyncReject(fn()=>cmsAiContentJobTransport($url,$token,$id,null,static fn()=>json_encode(['id'=>$id,'status'=>'succeeded','result'=>str_repeat('x',30001)])),'AI_CONTENT_GATEWAY_RESPONSE');
    echo "CMS_AI_CONTENT_ASYNC_PASS five families, same C2 schema/provenance/save, shared quota, refresh, failed/lost-ack without resubmission; realProviderCalls=0\n";
}finally{$remove($base);}
