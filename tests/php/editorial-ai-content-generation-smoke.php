<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/lib.php';
require_once __DIR__.'/../../public/gestion-contenus/content-gateway-adapter.php';
require_once __DIR__.'/fixtures/editorial-ai-content.php';
if(($argv[1]??'')==='--quota-child'){
    try{cmsAiBriefReserve($argv[2],2,1700000000);exit(0);}
    catch(Throwable $e){exit($e->getMessage()==='AI_BRIEF_LIMIT'?2:3);}
}
function c2Check(bool $ok,string $why):void {if(!$ok)throw new RuntimeException('C2_TEST_'.$why);}
function c2Json(mixed $v):string {return json_encode($v,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);}
function c2Fail(callable $fn,string $code):void {
    $error=null;try{$fn();}catch(Throwable $e){$error=$e;}
    c2Check($error!==null&&$error->getMessage()===$code,'EXPECTED_'.$code);
}
function c2Remove(string $path):void {
    foreach(scandir($path)?:[] as $name){
        if($name==='.'||$name==='..')continue;$file=$path.'/'.$name;
        if(is_dir($file)&&!is_link($file))c2Remove($file);else unlink($file);
    }rmdir($path);
}
function c2Config(callable $adapter):array {
    return ['secret'=>'PRIVATE_CONFIG_NOT_FOR_PROVIDER',
        'editorial_ai_content'=>['enabled'=>true,'provider_label'=>'synthetic-provider',
            'model_label'=>'synthetic-model','max_attempts_per_day'=>2,'adapter'=>$adapter],
        'editorial_ai_briefs'=>['enabled'=>true,'model_label'=>'synthetic-brief',
            'max_attempts_per_day'=>4,'adapter'=>static fn():string=>'UNEXPECTED_BRIEF_CALL']];
}
function c2Input(string $kind,string $recipe):array {
    return ['kind'=>$kind,'title'=>'Sujet inédit témoin '.$kind,'angle'=>'Angle distinct à vérifier',
        'objective'=>'Objectif témoin','context'=>'EXPLICIT_CONTEXT_ONLY',
        'reference_id'=>$kind==='atelier'?$recipe:'','semantic_review'=>'1','transmission_review'=>'1'];
}
$dist=realpath($argv[1]??'');c2Check(is_string($dist),'DIST');
$read=static fn(string $name):array=>json_decode(file_get_contents($dist.'/'.$name),true,64,JSON_THROW_ON_ERROR);
$catalog=cmsSourceList($read('social-feed.json'));
$canonical=cmsCanonicalSourceList($read('editorial-source-index.json'),$catalog);
$guided=cmsGuidedSourceList($read('editorial-guided-fields.json'),$canonical);
cmsAssertGuidedCoverage($guided,$canonical);
$recipe='';foreach($canonical as $id=>$item)if($item['model']==='recipes'){$recipe=$id;break;}
c2Check($recipe!=='','REAL_RECIPE');
$base=sys_get_temp_dir().'/cdc-content-c2-'.bin2hex(random_bytes(8));c2Check(mkdir($base,0700),'TEMP');
$fresh=static function(string $label)use($base):string{
    $dir=$base.'/'.$label;c2Check(mkdir($dir,0700),'TEMP_CHILD');return $dir;
};
try{
    c2Check(cmsAiContentSettings([])===null,'DEFAULT_OFF');
    c2Fail(static fn()=>cmsAiContentSettings(['editorial_ai_content'=>['enabled'=>true]]),'AI_CONTENT_UNAVAILABLE');
    $calls=0;
    foreach(cmsCreationKinds() as $kind=>$label){
        $private=$fresh($kind);$input=c2Input($kind,$recipe);
        $manual=['kind'=>$kind,'title'=>$input['title'],'angle'=>'Intention humaine',
            'summary'=>'Résumé humain','research_note'=>'PRIVATE_PRIOR_NOTES','fields'=>[],
            'target_date'=>'','state'=>'draft'];
        $old=cmsCreationSave($private,$manual,$catalog,0);
        $dir=cmsCreationDir($private);$oldPath=$dir.'/'.$old['id'].'.0001.json';
        $oldHash=hash_file('sha256',$oldPath);
        $cfg=c2Config(static function(array $request)use($kind,&$calls):string{
            ++$calls;$encoded=c2Json($request);
            c2Check(!str_contains($encoded,'PRIVATE_PRIOR_NOTES')&&!str_contains($encoded,'PRIVATE_CONFIG_NOT_FOR_PROVIDER'),'NO_LEAK');
            c2Check($request['response_max_bytes']===30000&&$request['timeout_seconds']===20
                &&$request['max_output_tokens']===6000,'BOUNDS');
            return c2Json(contentFixture($kind));
        });
        c2Check(cmsAiContentSettings($cfg)['max_attempts_per_day']===2
            &&cmsAiBriefSettings($cfg)['max_attempts_per_day']===2,'STRICTEST_SHARED_LIMIT');
        $pending=cmsAiContentGenerate($private,$input,$catalog,$cfg,$canonical,$guided,$old['id'],1);
        c2Check(cmsCreationVersions($dir,$old['id'])===[1]&&hash_file('sha256',$oldPath)===$oldHash,'NO_AUTO_SAVE');
        c2Check($pending['metadata']['brief_id']===$old['id']&&$pending['metadata']['brief_version']===1,'BRIEF_TRACE');
        c2Check(!str_contains(c2Json($pending['metadata']),'EXPLICIT_CONTEXT_ONLY'),'NO_UNNEEDED_CONTEXT_COPY');
        $session=['ai_content_pending'=>[$pending['token']=>$pending]];
        c2Check(cmsAiContentPending($session,$pending['token'])===$pending,'SESSION_LOOKUP');
        c2Fail(static fn()=>cmsAiContentPending([],$pending['token']),'AI_CONTENT_SESSION');
        $expired=$pending;$expired['expires_at']=time()-1;
        c2Fail(static fn()=>cmsAiContentPending(['ai_content_pending'=>[$expired['token']=>$expired]],$expired['token']),'AI_CONTENT_SESSION');
        $posted=$manual;
        foreach(['title','angle','summary','research_note'] as $key)$posted[$key]=$pending['candidate'][$key];
        $posted['fields']=$pending['candidate']['form_fields'];
        $first=array_key_first(cmsCreationSchema()[$kind]);
        $posted['fields'][$first]='Correction humaine <script>à échapper</script>';
        $posted['origin']='manual';$posted['ai_content']=['provider_label'=>'FORGED_BROWSER_PROVIDER'];
        $saved=cmsAiContentSave($private,$posted,$catalog,1,$old['id'],$pending,$canonical);
        c2Check($saved['version']===2&&$saved['origin']==='ai'&&$saved['state']==='draft'
            &&$saved['reviewed']===false&&$saved['channels']===['site']&&$saved['target_date']===null,'DRAFT_ONLY');
        c2Check($saved['ai_content']['provider_label']==='synthetic-provider'
            &&$saved['ai_content']['proposal']['fields'][$first]!==$saved['fields'][$first],'SERVER_PROVENANCE_AND_PROPOSAL');
        c2Check(in_array('fields.'.$first,$saved['ai_content_edits'],true),'HUMAN_EDITS');
        c2Check(hash_file('sha256',$oldPath)===$oldHash&&(fileperms($oldPath)&0077)===0,'OLD_IMMUTABLE_PRIVATE');
        $savedHash=hash_file('sha256',$dir.'/'.$old['id'].'.0002.json');
        $v3=cmsCreationSave($private,$posted,$catalog,2,$old['id']);
        c2Check($v3['ai_content']===$saved['ai_content']&&$v3['origin']==='ai','MANUAL_REVISION_KEEPS_PROVENANCE');
        c2Check(hash_file('sha256',$dir.'/'.$old['id'].'.0002.json')===$savedHash,'V2_IMMUTABLE');
        c2Fail(static fn()=>cmsAiContentSave($private,$posted,$catalog,1,$old['id'],$pending,$canonical),'CREATION_CONFLICT');
        c2Fail(static fn()=>cmsAiContentSave($private,$posted,$catalog,3,$old['id'],$pending,$canonical),'AI_CONTENT_SESSION');
        $briefInput=$input;unset($briefInput['transmission_review']);$briefInput['title']='Autre sujet de brief '.$kind;
        c2Fail(static fn()=>cmsAiBriefGenerate($private,$briefInput,$catalog,$cfg),'AI_BRIEF_LIMIT');
        c2Check(cmsCreationRead($dir,$old['id'])['version']===3,'NO_QUOTA_SAVE');
        if($kind==='atelier'){
            $changed=$canonical;$changed[$recipe]['fingerprint']=str_repeat('e',64);
            c2Fail(static fn()=>cmsAiContentSave($private,$posted,$catalog,1,$old['id'],$pending,$changed),'AI_CONTENT_REFERENCE_CHANGED');
        }
        // A completely new candidate also needs an explicit save and gets v1.
        $newPrivate=$fresh('new-'.$kind);$pending=cmsAiContentGenerate($newPrivate,$input,$catalog,$cfg,$canonical,$guided);
        c2Check(cmsCreationList(cmsCreationDir($newPrivate))===[],'NEW_NO_AUTO_SAVE');
        $new=cmsAiContentSave($newPrivate,$posted,$catalog,0,null,$pending,$canonical);
        c2Check($new['version']===1&&$new['origin']==='ai','NEW_EXPLICIT_SAVE');
    }
    c2Check($calls===10,'ONE_CALL_PER_GENERATION');
    $once=['ai_content_intent'=>str_repeat('a',48)];cmsAiContentIntent($once,str_repeat('a',48));
    c2Fail(static function()use(&$once){cmsAiContentIntent($once,str_repeat('a',48));},'AI_CONTENT_INTENT');
    $private=$fresh('invalid');$input=c2Input('recette',$recipe);$noCalls=0;
    $cfg=c2Config(static function()use(&$noCalls):string{++$noCalls;return c2Json(contentFixture('recette'));});
    $bad=$input;$bad['transmission_review']='0';
    c2Fail(static fn()=>cmsAiContentGenerate($private,$bad,$catalog,$cfg,$canonical,$guided),'AI_CONTENT_RIGHTS_REQUIRED');
    $bad=$input;$bad['semantic_review']='0';
    c2Fail(static fn()=>cmsAiContentGenerate($private,$bad,$catalog,$cfg,$canonical,$guided),'AI_BRIEF_REVIEW_REQUIRED');
    $bad=$input;$bad['adapter']='untrusted';
    c2Fail(static fn()=>cmsAiContentGenerate($private,$bad,$catalog,$cfg,$canonical,$guided),'AI_BRIEF_INPUT');
    $bad=$input;$bad['title']=$catalog[$recipe]['title'];
    c2Fail(static fn()=>cmsAiContentGenerate($private,$bad,$catalog,$cfg,$canonical,$guided),'CREATION_DUPLICATE');
    c2Check($noCalls===0&&!file_exists(cmsDraftDir($private).'/ai-brief-attempts.json'),'PRECALL_NO_SPEND');
    foreach(['throw','invalid-json','oversize'] as $mode){
        $private=$fresh('failure-'.$mode);$attempts=0;
        $cfg=c2Config(static function()use($mode,&$attempts):string{
            ++$attempts;if($mode==='throw')throw new RuntimeException('PRIVATE_RAW_PROVIDER_ERROR');
            return $mode==='invalid-json'?'not json':str_repeat('x',30001);
        });
        c2Fail(static fn()=>cmsAiContentGenerate($private,$input,$catalog,$cfg,$canonical,$guided),
            $mode==='throw'?'AI_CONTENT_PROVIDER':'AI_CONTENT_RESPONSE');
        c2Fail(static fn()=>cmsAiContentGenerate($private,$input,$catalog,$cfg,$canonical,$guided),'AI_BRIEF_LIMIT');
        c2Check($attempts===1&&cmsCreationList(cmsCreationDir($private))===[],'FAILURE_NO_RETRY_OR_SAVE');
    }
    // Concurrent change while the provider is running: reject the stale brief.
    $private=$fresh('race-version');
    $brief=cmsCreationSave($private,['kind'=>'recette','title'=>$input['title'],'angle'=>'Angle','fields'=>[]],$catalog,0);
    $cfg=c2Config(static function()use($private,$brief,$catalog):string{
        cmsCreationSave($private,['kind'=>'recette','title'=>$brief['title'],'angle'=>'Nouvelle intention','fields'=>[]],$catalog,1,$brief['id']);
        return c2Json(contentFixture('recette'));
    });
    c2Fail(static fn()=>cmsAiContentGenerate($private,$input,$catalog,$cfg,$canonical,$guided,$brief['id'],1),'CREATION_CONFLICT');
    // Different title returned by the model must still collide after the call.
    $private=$fresh('race-duplicate');
    $cfg=c2Config(static function()use($private,$catalog):string{
        $v=contentFixture('recette');cmsCreationSave($private,['kind'=>'recette','title'=>$v['title'],'angle'=>'Autre intention','fields'=>[]],$catalog,0);
        return c2Json($v);
    });
    c2Fail(static fn()=>cmsAiContentGenerate($private,$input,$catalog,$cfg,$canonical,$guided),'CREATION_DUPLICATE');
    // Shared quota in two real PHP processes: only one reservation wins cooldown.
    $private=$fresh('race-quota');cmsDraftDir($private);$processes=[];
    for($i=0;$i<2;$i++){
        $pipes=[];$proc=proc_open([PHP_BINARY,__FILE__,'--quota-child',$private],[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes);
        c2Check(is_resource($proc),'QUOTA_PROCESS');fclose($pipes[0]);$processes[]=[$proc,$pipes];
    }
    $codes=[];foreach($processes as [$proc,$pipes]){
        $out=stream_get_contents($pipes[1]);$err=stream_get_contents($pipes[2]);fclose($pipes[1]);fclose($pipes[2]);
        c2Check($out===''&&$err==='','QUOTA_NO_PRIVATE_LOG');$codes[]=proc_close($proc);
    }
    sort($codes);c2Check($codes===[0,2],'CONCURRENT_RESERVATION');
    $ledger=cmsDraftDir($private).'/ai-brief-attempts.json';
    c2Check(count(json_decode(file_get_contents($ledger),true))===1&&(fileperms($ledger)&0077)===0,'SHARED_LEDGER');
    $gateway='https://n8n.orvekio.com/webhook/synthetic-test-only';$token=str_repeat('A',40);
    $request=cmsAiContentRequest($input,$catalog,$canonical,$guided);
    $request['timeout_seconds']=20;$request['max_output_tokens']=6000;$request['response_max_bytes']=30000;
    $httpCalls=0;
    $result=cmsAiContentGatewayCall($request,$gateway,$token,static function($url,$body,$key)use(&$httpCalls,$token):string{
        ++$httpCalls;c2Check($key===$token&&!str_contains($body,$token),'BEARER_OUTSIDE_PAYLOAD');
        return c2Json(contentFixture('recette'));
    });
    c2Check($httpCalls===1&&cmsAiContentCandidate('recette',$result)['publication_ready']===false,'MOCK_GATEWAY');
    foreach(['http://n8n.orvekio.com/webhook/synthetic-test-only','https://evil.test/webhook/synthetic-test-only',
        'https://n8n.orvekio.com:11434/webhook/synthetic-test-only',$gateway.'?token=forbidden'] as $url)
        c2Fail(static fn()=>cmsAiContentGatewayConfig($url,$token),'AI_CONTENT_GATEWAY_CONFIG');
    $visual=cmsVisualBriefDraft('culture',['medium'=>'ai_illustration','subject'=>'Sujet témoin']);
    c2Check($visual['validation']==='pending','VISUAL_NO_APPROVAL');
    c2Fail(static fn()=>cmsVisualBriefDraft('culture',['medium'=>'ai_illustration','validation'=>'approved']),'VISUAL_BRIEF');
    echo 'CMS_AI_CONTENT_GENERATION_OFFLINE_PASS '.c2Json(['families'=>5,'realProviderCalls'=>0,
        'explicitSaveRequired'=>true,'sharedQuotaProcesses'=>2,'humanApproval'=>false])."\n";
}finally{c2Remove($base);}
