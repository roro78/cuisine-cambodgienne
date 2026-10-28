<?php
declare(strict_types=1);
// Real PHP HTTP/session/controller test. Only public-index reads and the model
// adapter are replaced in a TEMPORARY copy. HTTPS is simulated on loopback.
require_once __DIR__.'/../../public/gestion-contenus/lib.php';
require_once __DIR__.'/fixtures/editorial-ai-content.php';
function httpCheck(bool $ok,string $why):void {if(!$ok)throw new RuntimeException('C2_HTTP_'.$why);}
function httpRemove(string $dir):void {
    foreach(scandir($dir)?:[] as $name){if($name==='.'||$name==='..')continue;
        $p=$dir.'/'.$name;if(is_dir($p)&&!is_link($p))httpRemove($p);else unlink($p);
    }rmdir($dir);
}
function httpHidden(string $html,string $name):string {
    httpCheck((bool)preg_match('/name="'.preg_quote($name,'/').'" value="([^"]*)"/',$html,$m),'HIDDEN_'.$name);
    return html_entity_decode($m[1],ENT_QUOTES,'UTF-8');
}
$dist=realpath($argv[1]??'');httpCheck(is_string($dist),'DIST');
$base=sys_get_temp_dir().'/cdc-content-http-'.bin2hex(random_bytes(8));
httpCheck(mkdir($base,0700),'TEMP');$server=null;$pipes=[];
try{
    $public=$base.'/site/public/gestion-contenus';mkdir($public,0700,true);
    $private=$base.'/.cuisine-asset-portal';mkdir($private,0700);mkdir($base.'/sessions',0700);
    foreach(['social-feed.json','editorial-source-index.json','editorial-guided-fields.json'] as $name)
        copy($dist.'/'.$name,$base.'/'.$name);
    copy(__DIR__.'/fixtures/editorial-ai-content.php',$base.'/fixture.php');
    copy(__DIR__.'/../../public/gestion-contenus/index.php',$public.'/index.php');
    $lib=file_get_contents(__DIR__.'/../../public/gestion-contenus/lib.php');
    foreach(['cmsGetFeed','cmsGetEditorialIndex','cmsGetGuidedFields'] as $fn)
        $lib=str_replace('function '.$fn.'(','function fixtureOriginal'.$fn.'(',$lib);
    file_put_contents($public.'/lib.php',$lib);
    $cfg= <<<'PHP'
<?php
return ['admin_user'=>'fixture-admin','password_hash'=>__HASH__,
    'editorial_ai_content'=>['enabled'=>true,'provider_label'=>'synthetic-http',
        'model_label'=>'synthetic-http-model','max_attempts_per_day'=>5,
        'adapter'=>static function(array $request):string{
            $base=$GLOBALS['fixtureRoot'];$json=json_encode($request);
            if(str_contains($json,'PRIVATE_NEVER_SENT')||str_contains($json,'PREVIOUS_INPUT_MUST_SURVIVE'))
                throw new RuntimeException('PRIVATE_INPUT_LEAK');
            file_put_contents($base.'/calls.txt',(string)((int)file_get_contents($base.'/calls.txt')+1));
            if($request['brief']['context']==='NETWORK_FAIL')throw new RuntimeException('SENSITIVE_PROVIDER_ERROR');
            if($request['brief']['context']==='BAD_JSON')return 'broken json';
            return json_encode(contentFixture('recette'),JSON_THROW_ON_ERROR);
        }]];
PHP;
    $cfg=str_replace('__HASH__',var_export(password_hash('synthetic-login-only',PASSWORD_DEFAULT),true),$cfg);
    file_put_contents($private.'/config.php',$cfg);chmod($private.'/config.php',0600);
    file_put_contents($base.'/calls.txt','0');
    $router= <<<'PHP'
<?php
$GLOBALS['fixtureRoot']=__DIR__;
$_SERVER['HTTPS']='on';
session_save_path(__DIR__.'/sessions');
require_once __DIR__.'/fixture.php';
function cmsGetFeed():?array{return json_decode(file_get_contents(__DIR__.'/social-feed.json'),true);}
function cmsGetEditorialIndex():?array{return json_decode(file_get_contents(__DIR__.'/editorial-source-index.json'),true);}
function cmsGetGuidedFields():?array{return json_decode(file_get_contents(__DIR__.'/editorial-guided-fields.json'),true);}
require __DIR__.'/site/public/gestion-contenus/index.php';
PHP;
    file_put_contents($base.'/router.php',$router);
    $socket=stream_socket_server('tcp://127.0.0.1:0',$errno,$errstr);
    httpCheck(is_resource($socket),'PORT');$address=stream_socket_get_name($socket,false);fclose($socket);
    $server=proc_open([PHP_BINARY,'-S',$address,$base.'/router.php'],
        [0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes,$base);
    httpCheck(is_resource($server),'SERVER');fclose($pipes[0]);
    $origin='http://'.$address;$cookie='';
    $request=static function(string $path,?array $post=null)use($origin,&$cookie):array{
        $headers=['Connection: close'];if($cookie!=='')$headers[]='Cookie: '.$cookie;
        if($post!==null)$headers[]='Content-Type: application/x-www-form-urlencoded';
        $options=['method'=>$post===null?'GET':'POST','header'=>implode("\r\n",$headers),
            'ignore_errors'=>true,'follow_location'=>0,'timeout'=>5];
        if($post!==null)$options['content']=http_build_query($post);
        $body=@file_get_contents($origin.$path,false,stream_context_create(['http'=>$options]));
        $status=0;$location='';
        foreach($http_response_header??[] as $line){
            if(preg_match('~^HTTP/\S+ (\d+)~',$line,$m))$status=(int)$m[1];
            if(preg_match('/^Set-Cookie: (CDC_EDITORIAL_CMS=[A-Za-z0-9,-]+)/i',$line,$m))$cookie=$m[1];
            if(str_starts_with($line,'Location: '))$location=substr($line,10);
        }
        return [$status,is_string($body)?$body:'',$location];
    };
    $first=[0,'',''];for($i=0;$i<40;$i++){$first=$request('/gestion-contenus/');if($first[0]!==0)break;usleep(50000);}
    httpCheck($first[0]===200&&str_contains($first[1],'Connexion administrateur'),'ANONYMOUS_LOGIN_ONLY');
    $csrf=httpHidden($first[1],'csrf');
    [$status]=$request('/gestion-contenus/?new=1',['csrf'=>$csrf,'ai_content_generate'=>'1']);
    httpCheck($status===200&&(int)file_get_contents($base.'/calls.txt')===0,'ANONYMOUS_NO_GENERATION');
    [$status]=$request('/gestion-contenus/',['csrf'=>$csrf,'login'=>'1','username'=>'fixture-admin','password'=>'synthetic-login-only']);
    httpCheck($status===200,'LOGIN');
    [$status,$html]=$request('/gestion-contenus/?new=1&kind=recette');
    $csrf=httpHidden($html,'csrf');$intent=httpHidden($html,'ai_content_request_token');
    $fixture=cmsAiContentCandidate('recette',json_encode(contentFixture('recette'),JSON_THROW_ON_ERROR));
    $post=['csrf'=>$csrf,'ai_content_generate'=>'1','ai_content_request_token'=>$intent,
        'creation_id'=>'','expected_version'=>'0','kind'=>'recette','title'=>'Sujet HTTP distinct',
        'angle'=>'Angle HTTP à vérifier','objective'=>'Objectif HTTP','context'=>'Contexte explicite',
        'reference_id'=>'','semantic_review'=>'1','transmission_review'=>'1','summary'=>'SUMMARY_MUST_SURVIVE',
        'research_note'=>'PRIVATE_NEVER_SENT','fields'=>$fixture['form_fields'],'state'=>'draft','target_date'=>''];
    $post['fields']['intro']='PREVIOUS_INPUT_MUST_SURVIVE';
    $bad=$post;$bad['csrf']='invalid';[$status]=$request('/gestion-contenus/?new=1',$bad);
    httpCheck($status===403&&(int)file_get_contents($base.'/calls.txt')===0,'CSRF_BEFORE_PROVIDER');
    $bad=$post;$bad['create_save']='1';[$status]=$request('/gestion-contenus/?new=1',$bad);
    httpCheck($status===422&&(int)file_get_contents($base.'/calls.txt')===0,'AMBIGUOUS_ACTION_NO_CALL');
    // The rejected combined action rendered a fresh intent; acquire that form.
    [, $html]=$request('/gestion-contenus/?new=1');$post['ai_content_request_token']=httpHidden($html,'ai_content_request_token');
    [$status,,$location]=$request('/gestion-contenus/?new=1',$post);
    httpCheck($status===303&&str_contains($location,'candidate='),'GENERATION_PRG');
    httpCheck((glob($private.'/editorial-drafts/new-content/c-*.json')?:[])===[],'NO_AUTOMATIC_DRAFT');
    [$status,$html]=$request('/gestion-contenus/'.$location);
    httpCheck($status===200&&str_contains($html,'Proposition générée')&&substr_count($html,'id="cms-new-editor"')===1,'COMMON_EDITOR_CANDIDATE');
    $candidateToken=httpHidden($html,'candidate_token');
    [$status]=$request('/gestion-contenus/?new=1',$post);
    httpCheck($status===503&&(int)file_get_contents($base.'/calls.txt')===1,'REPLAY_NO_PROVIDER_CALL');
    $discard=$post;unset($discard['ai_content_generate']);
    $discard['ai_content_discard']='1';$discard['candidate_token']=$candidateToken;
    [$status,$html]=$request('/gestion-contenus/?new=1',$discard);
    httpCheck($status===200&&str_contains($html,'saisie précédente est restaurée')
        &&str_contains($html,'PREVIOUS_INPUT_MUST_SURVIVE')
        &&(glob($private.'/editorial-drafts/new-content/c-*.json')?:[])===[],'DISCARD_RESTORES_INPUT');
    $post['ai_content_request_token']=httpHidden($html,'ai_content_request_token');
    // Reset the isolated fixture ledger to exercise the next explicit action.
    file_put_contents($private.'/editorial-drafts/ai-brief-attempts.json','[]');
    [$status,,$location]=$request('/gestion-contenus/?new=1',$post);
    httpCheck($status===303,'GENERATE_AFTER_DISCARD');
    [, $html]=$request('/gestion-contenus/'.$location);$candidateToken=httpHidden($html,'candidate_token');
    $save=['csrf'=>$csrf,'create_save'=>'1','candidate_token'=>$candidateToken,'kind'=>'recette',
        'creation_id'=>'','expected_version'=>'0','title'=>$fixture['title'],'angle'=>$fixture['angle'],
        'summary'=>$fixture['summary'],'research_note'=>$fixture['research_note'],
        'fields'=>$fixture['form_fields'],'state'=>'draft','target_date'=>''];
    $save['fields']['intro']='Correction HTTP humaine';
    [$status]=$request('/gestion-contenus/?new=1',$save);httpCheck($status===303,'EXPLICIT_SAVE');
    $files=glob($private.'/editorial-drafts/new-content/c-*.json');httpCheck(count($files)===1,'ONE_SAVED_VERSION');
    $record=json_decode(file_get_contents($files[0]),true);$hash=hash_file('sha256',$files[0]);
    httpCheck($record['origin']==='ai'&&$record['reviewed']===false&&$record['state']==='draft'
        &&in_array('fields.intro',$record['ai_content_edits'],true),'PROVENANCE_HUMAN_EDITS');
    [$status]=$request('/gestion-contenus/?new=1',$save);
    httpCheck($status===409&&count(glob($private.'/editorial-drafts/new-content/c-*.json'))===1,'NO_DOUBLE_SAVE');
    foreach(['BAD_JSON','NETWORK_FAIL'] as $mode){
        // Reset only the isolated fixture ledger, never a production quota.
        file_put_contents($private.'/editorial-drafts/ai-brief-attempts.json','[]');
        [, $html]=$request('/gestion-contenus/?new=1');$post['ai_content_request_token']=httpHidden($html,'ai_content_request_token');
        $post['context']=$mode;
        [$status,$html]=$request('/gestion-contenus/?new=1',$post);
        httpCheck(in_array($status,[422,503],true)&&str_contains($html,'SUMMARY_MUST_SURVIVE')
            &&str_contains($html,'PREVIOUS_INPUT_MUST_SURVIVE')&&!str_contains($html,'SENSITIVE_PROVIDER_ERROR'),'FAILURE_PRESERVES_FORM');
        httpCheck(hash_file('sha256',$files[0])===$hash,'FAILURE_PRESERVES_VERSIONS');
    }
    file_put_contents($private.'/config.php',str_replace("'enabled'=>true","'enabled'=>false",$cfg));
    [, $html]=$request('/gestion-contenus/?new=1');
    httpCheck(str_contains($html,'La génération structurée est indisponible'),'DISABLED_NOTICE');
    $manual=$save;unset($manual['candidate_token']);$manual['title']='Création manuelle HTTP distincte';$manual['fields']=[];
    [$status]=$request('/gestion-contenus/?new=1',$manual);
    httpCheck($status===303&&count(glob($private.'/editorial-drafts/new-content/c-*.json'))===2,'DISABLED_MANUAL_WORKS');
    echo "CMS_AI_CONTENT_CONTROLLER_HTTP_PASS {\"csrf\":true,\"session\":true,\"explicitSave\":true,\"realProviderCalls\":0,\"https\":\"simulated_loopback\"}\n";
}finally{
    if(is_resource($server)){proc_terminate($server);foreach([1,2] as $i)if(isset($pipes[$i])&&is_resource($pipes[$i]))fclose($pipes[$i]);proc_close($server);}
    httpRemove($base);
}
