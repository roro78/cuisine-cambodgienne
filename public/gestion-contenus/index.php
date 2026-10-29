<?php
declare(strict_types=1);
/** Private editorial CMS P0: preview and immutable drafts only, no publishing. */
require_once __DIR__.'/lib.php';
require_once __DIR__.'/publication-gap-audit.php';
ini_set('display_errors','0');
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store, private, max-age=0');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
$nonce=base64_encode(random_bytes(18));
header("Content-Security-Policy: default-src 'none'; style-src 'nonce-{$nonce}'; script-src 'nonce-{$nonce}'; img-src https://www.cuisine-du-cambodge.com; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
function cmsUnavailable(): never { http_response_code(503);exit('Espace CMS privé indisponible.'); }
$https=(!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS'])!=='off')
    || (string)($_SERVER['SERVER_PORT']??'')==='443';
if(!$https){http_response_code(403);exit('HTTPS obligatoire.');}
$private=dirname(__DIR__,3).'/.cuisine-asset-portal';
$file=$private.'/config.php';
if (!is_dir($private) || is_link($private) || !is_file($file) || is_link($file))
    cmsUnavailable();
$cfg=require $file;
if(!is_array($cfg) || !is_string($cfg['admin_user']??null)
    || !is_string($cfg['password_hash']??null)
    || !(str_starts_with($cfg['password_hash'],'$2')
        || str_starts_with($cfg['password_hash'],'$argon')))cmsUnavailable();
session_name('CDC_EDITORIAL_CMS');
ini_set('session.use_strict_mode','1');
ini_set('session.use_only_cookies','1');
session_set_cookie_params([
    'lifetime'=>0,'path'=>'/gestion-contenus/',
    'secure'=>true,'httponly'=>true,'samesite'=>'Strict'
]);
session_start();
if(!is_string($_SESSION['csrf']??null))$_SESSION['csrf']=bin2hex(random_bytes(24));
if(isset($_SESSION['authenticated_at']) && time()-(int)$_SESSION['authenticated_at']>1800)
    unset($_SESSION['authenticated_at']);
$auth=isset($_SESSION['authenticated_at']);
$error='';
$notice='';
// Strict fail-closed login limiter outside the web root, no log of input secrets.
function cmsLoginAttempt(string $dir,string $ip,bool $failed=false): bool {
    $path=$dir.'/cms-login-'.hash('sha256',$ip).'.json';
    if(is_link($path))cmsUnavailable();
    $f=@fopen($path,'c+');
    if(!$f || !flock($f,LOCK_EX))cmsUnavailable();
    try {
        $stat=fstat($f);
        if(!$stat || $stat['size']>2048)cmsUnavailable();
        $raw=stream_get_contents($f);
        if($raw===false)cmsUnavailable();
        try{$times=json_decode($raw===''?'[]':$raw,true,10,JSON_THROW_ON_ERROR);}
        catch(JsonException $e){cmsUnavailable();}
        if(!is_array($times) || !array_is_list($times) || count($times)>5
            || count(array_filter($times,'is_int'))!==count($times))cmsUnavailable();
        $times=array_values(array_filter($times,static fn(int $t):bool=>$t>=time()-900 && $t<=time()));
        $blocked=count($times)>=5;
        if(!$blocked && $failed)$times[]=time();
        $json=json_encode($times,JSON_THROW_ON_ERROR);
        if(!rewind($f) || !ftruncate($f,0) || fwrite($f,$json)!==strlen($json)
            || !fflush($f) || !@chmod($path,0600))cmsUnavailable();
        return $blocked;
    } finally{flock($f,LOCK_UN);fclose($f);}
}
$method=(string)($_SERVER['REQUEST_METHOD']??'GET');
if($method==='POST'){
    if(!is_string($_POST['csrf']??null)
        || !hash_equals((string)$_SESSION['csrf'],$_POST['csrf'])){
        http_response_code(403);exit('Session expirée. Rechargez.');
    }
    if(isset($_POST['logout']) && $auth){
        $_SESSION=[];session_regenerate_id(true);
        $_SESSION['csrf']=bin2hex(random_bytes(24));$auth=false;
    }elseif(isset($_POST['login']) && !$auth){
        if(!is_writable($private))cmsUnavailable();
        $ip=(string)($_SERVER['REMOTE_ADDR']??'unknown');
        if(cmsLoginAttempt($private,$ip)){
            http_response_code(429);$error='Trop de tentatives. Réessayez dans 15 minutes.';
        }elseif(is_string($_POST['username']??null)
            && is_string($_POST['password']??null)
            && hash_equals($cfg['admin_user'],$_POST['username'])
            && password_verify($_POST['password'],$cfg['password_hash'])){
            session_regenerate_id(true);
            $_SESSION['authenticated_at']=time();$auth=true;
        }else{
            cmsLoginAttempt($private,$ip,true);$error='Identifiants incorrects.';
        }
    }
}
$catalog=[];$canonicalById=[];$selectedCanonical=null;$guidedSelected=null;$guidedEditable=false;$guidedValues=[];$editorMode='json';$dir='';$selected=null;$latest=null;$versions=[];$display=null;$latestById=[];$staleDraft=false;$guidedContractError=false;
$kind=(string)($_GET['kind']??'all');
if(!in_array($kind,['all','recette','culture','atelier','ingredient','technique'],true))$kind='all';
$q=is_string($_GET['q']??null)?trim($_GET['q']):'';
$status=(string)($_GET['status']??'all');
if(!in_array($status,['all','without','draft','review','stale'],true))$status='all';
$filters=['kind'=>$kind,'q'=>$q,'status'=>$status];
$filtersUrl=http_build_query($filters,'','&',PHP_QUERY_RFC3986);
// A new editorial idea is deliberately distinct from a published source ID.
// Both paths still use the SAME authenticated Studio and shared field renderer.
$newMode=isset($_GET['new']) || ($method==='POST'
    && (isset($_POST['create_save']) || isset($_POST['ai_brief_generate'])
        || isset($_POST['ai_content_generate']) || isset($_POST['ai_content_discard'])
        || isset($_POST['review_action']) || isset($_POST['culinary_action'])));
$createKind=is_string($_POST['kind']??null)?$_POST['kind']:
    (is_string($_GET['kind']??null)?$_GET['kind']:'recette');
if(!isset(cmsCreationKinds()[$createKind]))$createKind='recette';
$createForm=[];$creation=null;$creations=[];$createVersion=null;
$studioLinked=null;$studioSourceCurrent=true;$studioBoundSource=null;
$aiSettings=null;$aiInputForm=[];
$aiContentSettings=null;$aiContentInputForm=[];$pendingContent=null;
$calendarMode=!$newMode && isset($_GET['calendar']);
$calendarMonth=gmdate('Y-m');$calendarKind='all';$calendarStatus='all';
$calendarPlan=null;$calendarPrev='';$calendarNext='';$calendarError='';
$calendarRuntimeInfo='';$calendarFileHashes=[];
if($calendarMode){
    try{
        $calendarMonth=cmsCalendarMonth($_GET['month']??gmdate('Y-m'));
    }catch(InvalidArgumentException $e){
        http_response_code(422);$error='Mois invalide : utilisez AAAA-MM.';
        $calendarMonth=gmdate('Y-m');
    }
    $calendarKind=is_string($_GET['calendar_kind']??null)
        && isset(cmsCreationKinds()[$_GET['calendar_kind']])
        ? $_GET['calendar_kind']:'all';
    $calendarStatus=cmsCalendarStatus($_GET['calendar_status']??'all');
    $cursor=new DateTimeImmutable($calendarMonth.'-01',new DateTimeZone('UTC'));
    $calendarPrev=$cursor->modify('-1 month')->format('Y-m');
    $calendarNext=$cursor->modify('+1 month')->format('Y-m');
}
if(mbLen($q)>80 || preg_match('/[\x00-\x1f\x7f]/',$q) || !preg_match('//u',$q))$q='';
if($auth){
    try{
        $data=cmsGetFeed();
        if($data===null)throw new RuntimeException('CATALOG_UNAVAILABLE');
        $catalog=cmsSourceList($data);
        // A missing or malformed canonical index disables structured edits,
        // not legacy text-only draft preparation.
        try {
            $fullIndex=cmsGetEditorialIndex();
            if(is_array($fullIndex))$canonicalById=cmsCanonicalSourceList($fullIndex,$catalog);
        }catch(Throwable $e){ $canonicalById=[]; }
        $dir=cmsDraftDir($private);
    }catch(Throwable $e){cmsUnavailable();}
    // Separate append-only namespace for NEW pages; never mix with edits of
    // an already published source (which are SHA-locked to the canonical feed).
    try{
        $creationDir=cmsCreationDir($private);
        $creations=cmsCreationList($creationDir);
    }catch(Throwable $e){cmsUnavailable();}
    // A calendar is only a READ-ONLY view. A failure in its projection must not
    // hide the whole CMS or masquerade as an expired login. Fail closed for the
    // affected view, preserve all private drafts and report a safe diagnostic.
    if($calendarMode){
        try{
            if(!function_exists('cmsCalendarPlan'))
                throw new RuntimeException('CALENDAR_HELPER_MISSING');
            $calendarPlan=cmsCalendarPlan(
                $creations,$calendarMonth,$calendarKind,$calendarStatus);
        }catch(Throwable $e){
            // Only fixed, non-sensitive codes may reach the UI or the PHP log.
            // The exception message itself can contain private information and
            // must never be printed or logged; unmapped errors stay generic.
            $calendarErrors=[
                'CALENDAR_HELPER_MISSING'=>'CALENDAR_CODE_MISMATCH',
                'CALENDAR_CORRUPT_DRAFT'=>'CALENDAR_DRAFT_INVALID',
                'CALENDAR_CORRUPT_DATE'=>'CALENDAR_DATE_INVALID',
                'CALENDAR_MONTH_INVALID'=>'CALENDAR_FILTER_INVALID',
                'CALENDAR_KIND'=>'CALENDAR_FILTER_INVALID',
                'CALENDAR_STATUS'=>'CALENDAR_FILTER_INVALID'
            ];
            $calendarError=$calendarErrors[$e->getMessage()]??(
                $e instanceof Error?'CALENDAR_RUNTIME_ERROR':'CALENDAR_DATA_UNAVAILABLE');
            if($calendarError==='CALENDAR_RUNTIME_ERROR'){
                // Read-only control on empty input. Distinguishes a runtime
                // failure inherent to the calendar helper from one triggered
                // by records in the private catalogue. Never log raw errors.
                try{
                    cmsCalendarPlan([],$calendarMonth,$calendarKind,$calendarStatus);
                    $calendarError='CALENDAR_RECORD_RUNTIME_ERROR';
                }catch(Throwable $ignored){
                    $calendarError='CALENDAR_ENGINE_RUNTIME_ERROR';
                    try{
                        $calendarRuntimeInfo=function_exists('cmsCalendarRuntimeDiagnostic')
                            ?cmsCalendarRuntimeDiagnostic($ignored):'DIAGNOSTIC_HELPER_MISSING';
                    }catch(Throwable $diagnosticError){
                        $calendarRuntimeInfo='DIAGNOSTIC_UNAVAILABLE';
                    }
                }
            }
            // Disk fingerprints identify the two deployed public-code files,
            // not the private config or drafts, and do not certify OPcache.
            foreach(['index.php','lib.php'] as $calendarCodeFile){
                $digest=function_exists('hash_file')
                    ?@hash_file('sha256',__DIR__.'/'.$calendarCodeFile):false;
                $calendarFileHashes[$calendarCodeFile]=is_string($digest)
                    && preg_match('/^[a-f0-9]{64}$/D',$digest)?$digest:'UNAVAILABLE';
            }
            error_log('[CDC_CMS_CALENDAR] '.$calendarError.' '
                .($e instanceof UnexpectedValueException?'unexpected_value':
                  ($e instanceof Error?'php_error':'calendar_error'))
                .' '.$calendarRuntimeInfo);
            http_response_code(503);
        }
    }
    if($newMode){
        $cid=cmsCreationId($_POST['creation_id']??($_GET['cid']??null));
        if($cid!==null){
            if(!isset($creations[$cid])){http_response_code(404);$error='Brouillon de création introuvable.';}
            else{$creation=$creations[$cid];$createKind=$creation['kind'];}
        }
        if(isset($creation['source_binding'])){
            $studioSourceCurrent=cmsStudioBindingCurrent($creation['source_binding'],$catalog,$canonicalById);
            $studioBoundSource=$catalog[$creation['source_binding']['source_id']]??null;
        }
        $createForm=$creation??[];
        $createExpected=(int)($creation['version']??0);
        try{$aiSettings=cmsAiBriefSettings($cfg);}catch(Throwable $e){$aiSettings=null;}
        try{$aiContentSettings=cmsAiContentSettings($cfg);}catch(Throwable $e){$aiContentSettings=null;}
        $candidateToken=$_POST['candidate_token']??($_GET['candidate']??'');
        if($candidateToken!==''){
            try{
                $pendingContent=cmsAiContentPending($_SESSION,$candidateToken);
                if($pendingContent['creation_id']!==$cid
                    || $pendingContent['candidate']['kind']!==$createKind)
                    throw new RuntimeException('AI_CONTENT_SESSION');
                if($method!=='POST'){
                    $candidate=$pendingContent['candidate'];
                    foreach(['title','angle','summary','research_note','fields'] as $field)
                        $createForm[$field]=$candidate[$field];
                    $createForm['state']='draft';
                    // The human-only Astro recipe profile belongs to the form snapshot,
                    // never to the model response; preserve it across PRG.
                    if($createKind==='recette')
                        $createForm['recipe_astro']=$pendingContent['before_form']['recipe_astro']??null;
                    if($createKind==='recette')
                        $createForm['recipe_astro_details']=$pendingContent['before_form']['recipe_astro_details']??null;
                    if($createKind==='culture')
                        $createForm['culture_evidence']=$pendingContent['before_form']['culture_evidence']??null;
                    if($createKind==='technique')
                        $createForm['technique_links']=$pendingContent['before_form']['technique_links']??null;
                    if($createKind==='atelier')
                        $createForm['atelier_reference']=$pendingContent['before_form']['atelier_reference']??null;
                    if($createKind==='atelier')
                        $createForm['atelier_phase_details']=$pendingContent['before_form']['atelier_phase_details']??null;
                    if($createKind==='atelier')
                        $createForm['atelier_scripts']=$pendingContent['before_form']['atelier_scripts']??null;
                    // Keep an explicit human planning date; the model cannot set one.
                    $createForm['target_date']=$pendingContent['before_form']['target_date']??'';
                }
            }catch(Throwable $e){
                $pendingContent=null;http_response_code(409);
                $error='Proposition temporaire indisponible ou expirée. Le brouillon enregistré reste conservé.';
            }
        }
        if($method==='POST' && isset($_POST['culinary_action'])){
            try{
                if(!$studioSourceCurrent)throw new RuntimeException('STUDIO_SOURCE_STALE');
                if($creation===null || $createKind!=='atelier'
                    || count(array_intersect(['culinary_action','review_action',
                        'create_save','ai_brief_generate','ai_content_generate',
                        'ai_content_discard'],array_keys($_POST)))!==1)
                    throw new InvalidArgumentException('ATELIER_CULINARY_INPUT');
                $expected=filter_var($_POST['expected_version']??null,FILTER_VALIDATE_INT,
                    ['options'=>['min_range'=>1,'max_range'=>9998]]);
                if($expected===false || $canonicalById===[])
                    throw new InvalidArgumentException('ATELIER_CULINARY_INPUT');
                $guidedPayload=cmsGetGuidedFields();
                if(!is_array($guidedPayload))
                    throw new RuntimeException('ATELIER_CULINARY_UNAVAILABLE');
                $guidedCulinary=cmsGuidedSourceList($guidedPayload,$canonicalById);
                cmsAssertGuidedCoverage($guidedCulinary,$canonicalById);
                $action=is_string($_POST['culinary_action']??null)
                    ?$_POST['culinary_action']:'';
                cmsAtelierCulinaryAction($private,$creation['id'],$expected,
                    $action,$_POST['culinary_checks']??[],
                    $_POST['culinary_note']??null,
                    ($_POST['culinary_confirm']??null)==='1',
                    $auth,$catalog,$canonicalById,$guidedCulinary);
                header('Location: ?new=1&cid='.rawurlencode($creation['id'])
                    .'&'.$filtersUrl.'&recipe_audit=1&culinary_saved=1#canonical-review',true,303);
                exit;
            }catch(Throwable $e){
                $conflict=in_array($e->getMessage(),[
                    'ATELIER_CULINARY_CONFLICT','ATELIER_CULINARY_ALREADY_SET','STUDIO_SOURCE_STALE'],true);
                http_response_code($conflict?409:422);
                $error=$conflict
                    ?'La recette ou la version du brouillon a changé : rechargez la comparaison.'
                    :'Décision culinaire non enregistrée. Vérifiez la recette complète, les quatre confirmations et votre note.';
            }
        }
        if($method==='POST' && isset($_POST['review_action'])){
            try{
                if(!$studioSourceCurrent)throw new RuntimeException('STUDIO_SOURCE_STALE');
                if($creation===null||$createKind!=='atelier'
                    ||count(array_intersect(['review_action','create_save',
                        'ai_brief_generate','ai_content_generate','ai_content_discard',
                        'culinary_action'],
                        array_keys($_POST)))!==1)
                    throw new InvalidArgumentException('ATELIER_VISA_INPUT');
                $expected=filter_var($_POST['expected_version']??null,FILTER_VALIDATE_INT,
                    ['options'=>['min_range'=>1,'max_range'=>9998]]);
                if($expected===false)throw new InvalidArgumentException('ATELIER_VISA_INPUT');
                cmsAtelierVisaAction($private,$creation['id'],$expected,
                    is_string($_POST['review_chapter']??null)?$_POST['review_chapter']:'',
                    is_string($_POST['review_action']??null)?$_POST['review_action']:'',
                    ($_POST['review_confirm']??null)==='1',$auth,$catalog);
                header('Location: ?new=1&cid='.rawurlencode($creation['id'])
                    .'&'.$filtersUrl.'&visa_saved=1',true,303);
                exit;
            }catch(Throwable $e){
                $conflict=in_array($e->getMessage(),
                    ['ATELIER_VISA_CONFLICT','ATELIER_VISA_ALREADY_SET','STUDIO_SOURCE_STALE'],true);
                http_response_code($conflict?409:422);
                $error=$conflict
                    ?'La version ou le visa a changé. Rechargez la fiche pour vérifier l’état actuel.'
                    :'Visa non enregistré. Vérifiez la confirmation et la complétude des sept scripts enregistrés.';
            }
        }
        if($method==='POST' && !isset($_POST['review_action'])
            && !isset($_POST['culinary_action'])
            && (isset($_POST['ai_content_generate'])||isset($_POST['ai_content_discard']))){
            $contentPosted=cmsCreationPosted($_POST);
            $createForm=$contentPosted;
            foreach(['objective','context','reference_id'] as $field)
                $aiContentInputForm[$field]=is_string($_POST[$field]??null)
                    && strlen($_POST[$field])<=8000?$_POST[$field]:'';
            try{
                $actions=array_intersect(['ai_content_generate','ai_content_discard','ai_brief_generate','create_save'],array_keys($_POST));
                if(isset($creation['source_binding']))throw new RuntimeException('AI_CONTENT_UNAVAILABLE');
                if(count($actions)!==1)throw new InvalidArgumentException('AI_CONTENT_INPUT');
                if(isset($_POST['ai_content_discard'])){
                    $pending=cmsAiContentPending($_SESSION,$candidateToken);
                    if($pending['creation_id']!==$cid)throw new RuntimeException('AI_CONTENT_SESSION');
                    $createForm=$pending['before_form'];
                    unset($_SESSION['ai_content_pending'][$pending['token']]);
                    $pendingContent=null;$candidateToken='';
                    $notice='Proposition écartée ; votre saisie précédente est restaurée.';
                }else{
                    if($candidateToken!=='' || (($_POST['creation_id']??'')!==''&&$creation===null))
                        throw new InvalidArgumentException('AI_CONTENT_INPUT');
                    cmsAiContentIntent($_SESSION,$_POST['ai_content_request_token']??null);
                    cmsAiContentSessionRoom($_SESSION);
                    if($aiContentSettings===null)throw new RuntimeException('AI_CONTENT_UNAVAILABLE');
                    $expected=filter_var($_POST['expected_version']??null,FILTER_VALIDATE_INT,
                        ['options'=>['min_range'=>0,'max_range'=>9998]]);
                    if($expected===false)throw new InvalidArgumentException('AI_CONTENT_INPUT');
                    $createExpected=$expected;
                    // Validate the local form snapshot before calling; it is NOT sent.
                    cmsCreationCleanFields($createKind,$contentPosted['fields']);
                    if(strlen(json_encode($contentPosted,JSON_THROW_ON_ERROR))>100000)
                        throw new InvalidArgumentException('AI_CONTENT_INPUT');
                    $guidedFeed=cmsGetGuidedFields();
                    if(!is_array($guidedFeed))throw new RuntimeException('AI_CONTENT_REFERENCE');
                    $contentGuides=cmsGuidedSourceList($guidedFeed,$canonicalById);
                    cmsAssertGuidedCoverage($contentGuides,$canonicalById);
                    $raw=[];
                    foreach(['kind','title','angle','objective','context','reference_id','semantic_review','transmission_review'] as $field)
                        $raw[$field]=$_POST[$field]??'';
                    $pending=cmsAiContentGenerate($private,$raw,$catalog,$cfg,
                        $canonicalById,$contentGuides,$cid,$expected);
                    $pending['before_form']=$contentPosted;
                    $_SESSION['ai_content_pending'][$pending['token']]=$pending;
                    // Post/Redirect/Get prevents refresh from repeating a paid request.
                    header('Location: ?new=1&kind='.rawurlencode($createKind)
                        .($cid!==null?'&cid='.rawurlencode($cid):'')
                        .'&candidate='.$pending['token'],true,303);exit;
                }
            }catch(Throwable $e){
                $code=$e->getMessage();
                http_response_code($code==='AI_BRIEF_LIMIT'?429:
                    ($e instanceof InvalidArgumentException?422:503));
                $error=match($code){
                    'CREATION_DUPLICATE'=>'Ce sujet existe déjà : choisissez un autre angle ou enrichissez la fiche existante.',
                    'AI_BRIEF_LIMIT'=>'Limite de demandes atteinte. Votre saisie est conservée ; aucun nouvel appel automatique.',
                    'CREATION_CONFLICT'=>'Le brief a changé pendant la préparation. Votre saisie est conservée ; comparez les versions.',
                    'AI_CONTENT_RIGHTS_REQUIRED'=>'Confirmez le droit de transmettre les seules informations du brief.',
                    'AI_BRIEF_REVIEW_REQUIRED'=>'Vérifiez les doublons, variantes et intentions avant la génération.',
                    'AI_CONTENT_SESSION_FULL'=>'Trois propositions sont déjà en attente. Enregistrez ou écartez-en une avant de générer.',
                    default=>'Proposition indisponible ou demande invalide. Votre saisie est conservée. Aucun nouvel appel automatique ; la création manuelle reste disponible.'
                };
            }
        }
        if($method==='POST' && isset($_POST['ai_brief_generate'])
            && !isset($_POST['review_action']) && !isset($_POST['culinary_action'])){
            $aiPosted=[];
            foreach(['kind','title','angle','objective','context','reference_id','semantic_review'] as $field)
                $aiPosted[$field]=$_POST[$field]??'';
            foreach(['title'=>180,'angle'=>700,'objective'=>700,'context'=>2000,
                'reference_id'=>115] as $field=>$max)
                $aiInputForm[$field]=is_string($aiPosted[$field])
                    && strlen($aiPosted[$field])<=$max*4?$aiPosted[$field]:'';
            try{
                if($creation!==null || ($_POST['creation_id']??'')!==''
                    || isset($_POST['create_save'])||isset($_POST['ai_content_generate'])||isset($_POST['ai_content_discard']))
                    throw new InvalidArgumentException('AI_BRIEF_INPUT');
                $saved=cmsAiBriefGenerate($private,$aiPosted,$catalog,$cfg);
                header('Location: ?new=1&cid='.rawurlencode($saved['id'])
                    .'&saved_new=1',true,303);
                exit;
            }catch(InvalidArgumentException $e){
                http_response_code(422);
                $error=match($e->getMessage()){
                    'CREATION_DUPLICATE'=>'Ce sujet existe déjà dans cette catégorie. Enrichissez la fiche existante ou choisissez un autre sujet.',
                    'AI_BRIEF_REVIEW_REQUIRED'=>'Vérifiez les sujets existants, les variantes et l’angle éditorial avant de demander un brief.',
                    'AI_BRIEF_REFERENCE'=>'Choisissez une référence publiée valide ; un atelier doit partir d’une recette.',
                    default=>'Brief invalide : vérifiez le sujet, l’angle et l’objectif.'
                };
            }catch(Throwable $e){
                $limited=$e->getMessage()==='AI_BRIEF_LIMIT';
                http_response_code($limited?429:503);
                $error=$limited?'Limite de demandes atteinte. Réessayez plus tard.'
                    :'Le brief IA n’a pas été enregistré. Vérifiez les projets avant toute nouvelle tentative ; la création manuelle reste disponible.';
            }
        }
        if($method==='POST' && isset($_POST['create_save']) && !isset($_POST['ai_brief_generate'])
            && !isset($_POST['ai_content_generate']) && !isset($_POST['ai_content_discard'])
            && !isset($_POST['review_action']) && !isset($_POST['culinary_action'])){
            $expected=filter_var($_POST['expected_version']??null,FILTER_VALIDATE_INT,
                ['options'=>['min_range'=>0,'max_range'=>9998]]);
            if($expected===false){http_response_code(422);$error='Version invalide.';}
            else{
                $createExpected=$expected;
                try{
                    $posted=[
                        'kind'=>$_POST['kind']??null,
                        'title'=>$_POST['title']??null,
                        'angle'=>$_POST['angle']??null,
                        'summary'=>$_POST['summary']??null,
                        'research_note'=>$_POST['research_note']??null,
                        'target_date'=>$_POST['target_date']??null,
                        'state'=>$_POST['state']??null,
                        'fields'=>$_POST['fields']??null,
                        'recipe_astro'=>$_POST['recipe_astro']??null,
                        'recipe_astro_details'=>$_POST['recipe_astro_details']??null,
                        'culture_evidence'=>$_POST['culture_evidence']??null,
                        'technique_links'=>$_POST['technique_links']??null,
                        'atelier_reference'=>$_POST['atelier_reference']??null,
                        'atelier_phase_details'=>$_POST['atelier_phase_details']??null,
                        'atelier_scripts'=>$_POST['atelier_scripts']??null
                    ];
                    if($candidateToken!==''){
                        $pending=cmsAiContentPending($_SESSION,$candidateToken);
                        $saved=cmsAiContentSave($private,$posted,$catalog,$expected,$cid,$pending,$canonicalById);
                        unset($_SESSION['ai_content_pending'][$pending['token']]);
                    }else $saved=cmsCreationSave($private,$posted,$catalog,$expected,$cid,
                        null,null,null,$canonicalById);
                    header('Location: ?new=1&cid='.rawurlencode($saved['id'])
                        .'&'.$filtersUrl.'&saved_new=1',true,303);
                    exit;
                }catch(InvalidArgumentException $e){
                    http_response_code(422);
                    $error=$e->getMessage()==='CREATION_DUPLICATE'
                        ?'Cette catégorie possède déjà une fiche ou un projet avec le même titre ou identifiant.'
                        :($e->getMessage()==='CREATION_INCOMPLETE'
                            ?'Complétez les champs et les sections avant de demander la relecture.'
                            :'Saisie invalide : vérifiez le titre, la date et les champs.');
                    $createForm=$posted;
                }catch(Throwable $e){
                    http_response_code(409);
                    $error='Brouillon non enregistré : proposition expirée, référence modifiée, version dépassée ou stockage indisponible. Votre saisie est conservée ; comparez la dernière version avant de recharger.';
                    $createForm=$posted;
                }
            }
        }
        $_SESSION['ai_content_intent']=bin2hex(random_bytes(24));
        if($creation){
            $requested=filter_var($_GET['revision']??null,FILTER_VALIDATE_INT,
                ['options'=>['min_range'=>1,'max_range'=>9999]]);
            if($requested!==false)
                $createVersion=cmsCreationRead($creationDir,$creation['id'],$requested);
        }
    }
    // Source identity -> last private proposal, never the social status.
    try{
        foreach($catalog as $src){
            $revisions=cmsVersions($dir,$src['id']);
            if($revisions)$latestById[$src['id']]=cmsReadVersion($dir,$src['id'],$revisions[0]);
        }
    }catch(Throwable $e){cmsUnavailable();}
    // The feed is authoritative; unknown or removed IDs cannot be edited.
    $id=cmsId($_POST['source_id']??($_GET['id']??null));
    if($id!==null && isset($catalog[$id]))$selected=$catalog[$id];
    if($selected)$selectedCanonical=$canonicalById[$selected['id']]??null;
    if($selected && $selected['kind']==='atelier'){
        try{$studioLinked=cmsStudioLinkedDraft($creations,$selected['id']);}
        catch(Throwable $e){cmsUnavailable();}
        if($studioLinked!==null && !$newMode && $method==='GET'
            && !isset($_GET['history'])){
            header('Location: ?new=1&cid='.rawurlencode($studioLinked['id']).'&'.$filtersUrl,true,303);exit;
        }
    }
    if($selected && $selectedCanonical){
        try{
            $feed=cmsGetGuidedFields();
            if(is_array($feed)){
                $guides=cmsGuidedSourceList($feed,$canonicalById);
                cmsAssertGuidedCoverage($guides,$canonicalById);
                $guidedSelected=$guides[$selected['id']]??null;
            }
        }catch(Throwable $e){$guidedSelected=null;$guidedContractError=true;}
    }

    $guidedEditable=$guidedSelected!==null && ($guidedSelected['editable']??false)===true;
    if($guidedEditable){
        $guidedValues=$guidedSelected['fields'];
        if(isset($latestById[$selected['id']]['structure'])
           && is_array($latestById[$selected['id']]['structure'])){
            $patch=$latestById[$selected['id']]['structure'];
            $compatible=true;
            foreach($guidedValues as $key=>$value){
                if(!array_key_exists($key,$patch)
                   || (is_array($value) && (!is_array($patch[$key])
                   || count($patch[$key])!==count($value)))){$compatible=false;break;}
            }
            if($compatible)$guidedValues=array_replace($guidedValues,$patch);
            else $guidedEditable=false; // legacy partial JSON stays editable in advanced mode.
        }
    }
    $editorMode=$guidedEditable && ($_GET['mode']??'')!=='json'?'guided':'json';
    if($method==='POST' && isset($_POST['studio_transition'])){
        try{
            $expected=filter_var($_POST['expected_version']??null,FILTER_VALIDATE_INT,
                ['options'=>['min_range'=>0,'max_range'=>9998]]);
            if(!$selected||!$selectedCanonical||!$guidedSelected||$expected===false
                ||$studioLinked!==null||($_POST['transition_confirm']??null)!=='1'
                ||($_POST['source_fingerprint']??null)!==$selected['fingerprint']
                ||($_POST['canonical_fingerprint']??null)!==$selectedCanonical['fingerprint'])
                throw new RuntimeException('STUDIO_TRANSITION_BLOCKED');
            $saved=cmsStudioTransition($private,$selected,$catalog,$canonicalById,$guidedSelected,$expected);
            header('Location: ?new=1&cid='.rawurlencode($saved['id']).'&'.$filtersUrl.'&saved_new=1',true,303);exit;
        }catch(Throwable $e){
            http_response_code(409);
            $error='Transition non enregistrée : vérifiez la confirmation, la version et les sources actuelles. Les versions historiques sont conservées.';
        }
    }
    // Protected export of an already reviewed, immutable draft. No mutation.
    if($method==='POST' && isset($_POST['export_review'])){
        try {
            if(!$selected || !$selectedCanonical
                || !is_string($_POST['source_fingerprint']??null)
                || !hash_equals($selected['fingerprint'],$_POST['source_fingerprint'])
                || !is_string($_POST['canonical_fingerprint']??null)
                || !hash_equals($selectedCanonical['fingerprint'],$_POST['canonical_fingerprint']))
                throw new RuntimeException('REVIEW_EXPORT_BLOCKED');
            $versionsNow=cmsVersions($dir,$selected['id']);
            $latestVersion=$versionsNow[0]??0;
            $requestedVersion=filter_var($_POST['export_version']??null,FILTER_VALIDATE_INT,
                ['options'=>['min_range'=>1,'max_range'=>9999]]);
            if($requestedVersion===false || $requestedVersion!==$latestVersion)
                throw new RuntimeException('REVIEW_VERSION_STALE');
            $approvedDraft=cmsReadVersion($dir,$selected['id'],$latestVersion);
            if(!is_array($approvedDraft))throw new RuntimeException('REVIEW_MISSING');
            $request=cmsBuildReviewedRecipeRequest(
                $selected,$selectedCanonical,$approvedDraft,$latestVersion);
            $json=json_encode($request,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES
                |JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR)."\n";
            $slug=substr($selected['id'],strlen('recette:'));
            header('Content-Type: application/json; charset=UTF-8');
            header('Content-Disposition: attachment; filename="cms-recipe-'
                .$slug.'-v'.$latestVersion.'.json"');
            header('Cache-Control: no-store, private, max-age=0');
            echo $json;
            exit;
        }catch(Throwable $e){
            http_response_code(409);
            $error='Export refusé : version non validée, ancienne ou différente de la recette actuelle.';
        }
    }
    if($method==='POST' && isset($_POST['save'])){
        if(!$selected){http_response_code(422);$error='Contenu inexistant dans le catalogue.';}
        else {
            $expected=filter_var($_POST['expected_version']??null,FILTER_VALIDATE_INT,
                ['options'=>['min_range'=>0,'max_range'=>9998]]);
            if($expected===false){http_response_code(422);$error='Version du brouillon invalide.';}
            else {
                try{
                    $incomingStructure=($_POST['editor_mode']??'json')==='guided'
                        ?cmsBuildGuidedPatch($guidedSelected??[],$_POST['guided']??null)
                        :($_POST['structure_json']??'');
                    cmsSave($private,$selected,[
                        'title'=>$_POST['title']??null,
                        'summary'=>$_POST['summary']??null,
                        'editorial_text'=>$_POST['editorial_text']??null,
                        'editor_note'=>$_POST['editor_note']??null,
                        'state'=>$_POST['state']??null,
                        'structure_json'=>$incomingStructure
                    ],$expected,(string)($_POST['source_fingerprint']??''),$selectedCanonical,
                       is_string($_POST['canonical_fingerprint']??null)
                         ?$_POST['canonical_fingerprint']:null);
                    header('Location: ?id='.rawurlencode($id).'&'.$filtersUrl.'&saved=1',true,303);exit;
                }catch(InvalidArgumentException $e){
                    http_response_code(422);$error=str_starts_with($e->getMessage(),'STRUCTURE_')
                        ?'Structure invalide : vérifiez le JSON, le schéma 1 et les champs autorisés pour cette catégorie.'
                        :'Champs manquants ou trop longs.';
                    if(($_POST['editor_mode']??'')==='guided'
                       && isset($_POST['guided']) && is_array($_POST['guided']))
                        $guidedValues=$_POST['guided'];
                }catch(RuntimeException $e){
                    http_response_code(409);$error='Brouillon non enregistré : version dépassée, contenu source modifié ou stockage indisponible. Rechargez la page.';
                }
            }
        }
    }
    if($selected){
        try{
            $versions=cmsVersions($dir,$selected['id']);
            $latest=$versions ? cmsReadVersion($dir,$selected['id'],$versions[0]):null;
            $staleDraft=$latest && !hash_equals(
                $latest['source_fingerprint'],$selected['fingerprint']);
            if($latest && is_array($latest['structure']??null)
                && ($latest['canonical_fingerprint']??null)!==($selectedCanonical['fingerprint']??null))
                $staleDraft=true;
            $requested=filter_var($_GET['revision']??null,FILTER_VALIDATE_INT,
                ['options'=>['min_range'=>1,'max_range'=>9999]]);
            $display=($requested!==false && in_array($requested,$versions,true))
                ? cmsReadVersion($dir,$selected['id'],$requested):$latest;
        }catch(Throwable $e){cmsUnavailable();}
    }
}
$kindLabels=['recette'=>'Recette','culture'=>'Carnet','atelier'=>'Atelier',
    'ingredient'=>'Ingrédient','technique'=>'Technique'];
if($auth){
    try{$latestById=cmsStudioCatalogDrafts($latestById,$creations,$catalog,$canonicalById);}
    catch(Throwable $e){cmsUnavailable();}
}
$shown=$auth?cmsFilterCatalog($catalog,$latestById,$kind,$q,$status):[];
?>
<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Studio éditorial — Cuisine du Cambodge</title>
<style nonce="<?= cmsEsc($nonce) ?>">
:root{font-family:system-ui,-apple-system,sans-serif;color:#203228;background:#f6f4ec}
*{box-sizing:border-box}body{margin:0}main{max-width:1040px;margin:auto;padding:16px}
header{display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap}
h1{font-size:clamp(1.4rem,3.8vw,2rem);margin:20px 0 8px}h2{font-size:1.13rem;margin:10px 0}
a{color:#17663b}button,.btn{background:#17663b;color:white;border:0;border-radius:8px;
padding:11px 16px;font:inherit;cursor:pointer}.btn{text-decoration:none;display:inline-block}
button.secondary{background:#eef3eb;color:#203228;border:1px solid #d1dbcd}
input,select,textarea{font:inherit;padding:10px;border:1px solid #a7b3a6;
border-radius:7px;width:100%;background:white;color:#203228}
input[type=checkbox]{width:1.25rem;height:1.25rem;padding:0;vertical-align:middle;margin-right:8px}
textarea{resize:vertical;min-height:110px}
.create-collection{border:1px solid #d9ddd5;border-radius:10px;padding:12px;min-width:0}
.create-collection legend{font-weight:700;padding:0 5px}
.create-rows{display:grid;gap:12px;margin:12px 0}
.create-row{display:grid;gap:9px;border:1px solid #e0e5dc;border-radius:10px;
 padding:12px;background:#fcfcf8;min-width:0}
.create-row strong{color:#17663b}
.create-row button{justify-self:start}
.new-actions{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}
.create-meta{border-left:3px solid #d8a038;padding:10px 12px;background:#fff9e8}
.create-card{border:1px solid #d9ddd5;border-radius:10px;padding:12px;margin-bottom:10px}
.calendar-days{display:grid;gap:12px;margin:18px 0}
.calendar-day{border:1px solid #d9ddd5;border-radius:10px;padding:12px;min-width:0}
.calendar-day h3{margin:0 0 10px;font-size:1rem}
.calendar-items{display:grid;gap:9px}
.calendar-item{padding:10px;border-radius:8px;background:#f5f7ef;overflow-wrap:anywhere}
.calendar-item a{font-weight:700}
.calendar-item p{margin:5px 0 0}
.calendar-undated{border-left:3px solid #d8a038;padding:8px 12px}
.calendar-pagination{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
.calendar-summary{display:flex;flex-wrap:wrap;gap:14px;padding:12px 0}
.guided-text textarea{min-height:75px;line-height:1.5}
.guided-group summary{line-height:1.4;overflow-wrap:anywhere}
.preview-fields{display:grid;gap:8px}
.preview-entry{padding:8px 0;border-bottom:1px solid #e5e9e1;min-width:0}
.preview-entry h4{font-size:.89rem;margin:4px 0;color:#31503c}
.preview-entry p{margin:5px 0}
.preview-list{padding-left:24px;display:grid;gap:10px}
.preview-list li{padding:4px 0;overflow-wrap:anywhere}
.preview-list .preview-entry{padding:2px 0;border-bottom:0}
.preview-list .preview-entry h4{font-size:.8rem;margin:2px 0}
.preview-list .preview-fields{gap:3px}
.editor-shortcuts{display:flex;flex-wrap:wrap;gap:12px;margin:14px 0;font-size:.91rem}
#cms-preview,#cms-save,#cms-fields{scroll-margin-top:18px}
label{display:block;font-size:.9rem;font-weight:650}
label input,label textarea,label select{margin-top:5px;font-weight:400}
section,.panel{background:white;border:1px solid #d9ddd5;border-radius:13px;
padding:17px;margin:15px 0}
.notice{background:#fff5db;padding:13px;border-radius:8px}.muted{color:#56655c}
.small{font-size:.82rem}.toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:end}
.toolbar label{flex:1 1 180px}.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.card{display:flex;gap:12px;align-items:flex-start;padding:12px;border:1px solid #e0e5dc;
border-radius:9px;min-width:0}.card img{width:82px;height:82px;border-radius:8px;object-fit:cover}
.card-text{min-width:0;overflow-wrap:anywhere}
.badge{display:inline-block;background:#eff3e9;border-radius:16px;padding:4px 9px;font-size:.75rem}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:15px}
.stack{display:grid;gap:12px}.preview-text{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6}
nav.versions{display:flex;flex-wrap:wrap;gap:9px}
nav.versions a{padding:6px 9px;background:#edf4ea;border-radius:6px}
.summary{max-width:72ch}.actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.note{border-left:3px solid #d8a038;padding:9px 12px;background:#fff9e8}
.work-resume{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:16px;
 background:linear-gradient(115deg,#f0f7ec,#fffefa);border:1px solid #b9d2bc;
 border-left:5px solid #247448;border-radius:14px;padding:18px 20px;margin:16px 0 20px;
 box-shadow:0 5px 18px rgba(21,54,33,.06);scroll-margin-top:16px}
.work-resume h2{font-size:1.16rem;margin:4px 0 8px}.work-resume p{margin:4px 0;line-height:1.5;overflow-wrap:anywhere}
.work-resume__eyebrow{font-size:.78rem;font-weight:750;letter-spacing:.035em;color:#286347;text-transform:uppercase}
.work-resume__actions{display:flex;gap:9px;flex-wrap:wrap;align-items:center}
.work-resume__actions .btn,.work-resume__form button{min-height:44px;text-align:center;font-weight:650}
.work-resume__actions a:not(.btn){padding:10px 0}
.work-resume__form{display:grid;gap:10px;max-width:400px}
.work-resume__form label{font-size:.87rem;font-weight:500;line-height:1.5}
.work-resume__form input[type=checkbox]{margin-top:0}
.work-resume--warning{background:#fff9ed;border-color:#e6ce94;border-left-color:#ad7a18}
.work-resume--warning .work-resume__eyebrow{color:#765219}
@media(max-width:650px){.work-resume{grid-template-columns:1fr;padding:16px;gap:12px}
 .work-resume__actions,.work-resume__form{width:100%;max-width:none}
 .work-resume__actions .btn,.work-resume__form button{width:100%}}
.guided-group{border:1px solid #d9ddd5;border-radius:10px;padding:12px;margin:10px 0;background:#fcfcf9}
.guided-group summary{font-weight:700;cursor:pointer;padding:5px 0;color:#17663b}.guided-group[open] summary{margin-bottom:12px}
.guided-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.guided-wide{grid-column:1/-1}
.guided-row textarea{min-height:85px}.title-editor{min-height:74px}
.editorial-note{margin:0}.editorial-note summary{font-size:.93rem}
.preview-text{white-space:pre-wrap;overflow-wrap:anywhere}.guided-collection{padding:8px 0}.guided-row-fields{padding:6px}.guided-collection .guided-collection{padding-left:10px;border-left:2px solid #e3e8dc}
.guided-nav{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.coral-script-text{white-space:pre-wrap;overflow-wrap:anywhere;max-height:320px;overflow:auto;padding:12px;border:1px solid #e3e8dc;border-radius:8px}
.studio-quality{scroll-margin-top:18px} .create-row summary{cursor:pointer;padding:12px 0;overflow-wrap:anywhere} .create-row[open] summary{margin-bottom:12px} #cms-preview{max-width:850px;line-height:1.7} #cms-preview h3,#cms-preview h4{margin-top:1.5em} details input,details textarea,details select{max-width:100%;box-sizing:border-box} .editor-shortcuts{flex-wrap:wrap}.studio-save{position:sticky;bottom:0;background:#fcfcf9;padding:12px 0;border-top:1px solid #d9ddd5;z-index:2}
section,fieldset,.stack,.grid>*{min-width:0}code,pre{overflow-wrap:anywhere;white-space:pre-wrap}.editor-shortcuts a{min-height:44px;display:inline-flex;align-items:center}
@media(max-width:650px){.guided-row{grid-template-columns:1fr}.guided-wide{grid-column:1}}

@media(max-width:650px){.cards,.grid{grid-template-columns:1fr}.card img{width:72px;height:72px}}
</style></head><body><main>
<header><div><strong>Cuisine du Cambodge</strong> · Studio éditorial privé</div>
<?php if($auth): ?><form method="post"><input type="hidden" name="csrf" value="<?= cmsEsc($_SESSION['csrf']) ?>">
<button class="secondary" name="logout" value="1">Déconnexion</button></form><?php endif; ?></header>
<h1>Bibliothèque et brouillons éditoriaux</h1>
<p class="note">Version de préparation : <strong>les brouillons ne modifient pas le site publié</strong>.
Aucun déclenchement n8n, Facebook, Instagram ou e-mail depuis cet espace.</p>
<?php if($error!==''): ?><p class="notice" role="alert"><?= cmsEsc($error) ?></p><?php endif; ?>
<?php if($notice!==''): ?><p class="notice" role="status"><?= cmsEsc($notice) ?></p><?php endif; ?>
<?php if(!$auth): ?>
<section><h2>Connexion administrateur</h2>
<form method="post" class="stack">
<input type="hidden" name="csrf" value="<?= cmsEsc($_SESSION['csrf']) ?>">
<label>Identifiant<input name="username" autocomplete="username" required maxlength="100"></label>
<label>Mot de passe<input type="password" name="password" autocomplete="current-password" required></label>
<button name="login" value="1">Accéder au studio</button>
</form></section>
<?php else: ?>
<nav class="new-actions" aria-label="Actions éditoriales">
<a class="btn" href="?new=1">+ Nouveau contenu</a>
<a href="?calendar=1">Calendrier éditorial</a>
<a href="?">Bibliothèque des pages publiées</a>
</nav>
<section aria-label="Filtres de la bibliothèque"<?= ($newMode||$calendarMode)?' hidden':'' ?>>
<form method="get" action="" class="toolbar">
<label>Catégorie<select name="kind">
<?php foreach(['all'=>'Toutes les catégories','recette'=>'Recettes','culture'=>'Carnets',
'atelier'=>'Ateliers','ingredient'=>'Ingrédients','technique'=>'Techniques'] as $value=>$label): ?>
<option value="<?= cmsEsc($value) ?>"<?= $kind===$value?' selected':'' ?>><?= cmsEsc($label) ?></option>
<?php endforeach; ?></select></label>
<label>Rechercher<input type="search" name="q" maxlength="80" value="<?= cmsEsc($q) ?>"
 placeholder="Titre, ingrédient, sujet…" autocomplete="off"></label>
<label>Suivi des brouillons<select name="status">
<?php foreach(['all'=>'Tous','without'=>'Sans brouillon','draft'=>'Brouillons',
'review'=>'Prêts pour relecture','stale'=>'Source actualisée'] as $value=>$label): ?>
<option value="<?= cmsEsc($value) ?>"<?= $status===$value?' selected':'' ?>><?= cmsEsc($label) ?></option>
<?php endforeach; ?></select></label>
<button type="submit">Appliquer les filtres</button>
<a href="?">Tout afficher</a></form>
<p class="small muted" role="status"><?= count($shown) ?> résultat(s) sur <?= count($catalog) ?> contenus
 · Recherche et filtres côté serveur, sans JavaScript.</p>
</section>
<?php if($calendarMode): ?>
<section id="editorial-calendar" aria-label="Calendrier éditorial privé">
<span class="badge">Planification privée · aucune publication automatique</span>
<h2>Calendrier éditorial — <?= cmsEsc($calendarMonth) ?></h2>
<p class="small muted">Dates cibles des projets de nouvelles pages.
Elles ne déclenchent aucune publication sur le site, Facebook ou Instagram.</p>
<?php if($calendarError!==''): ?>
<p class="notice" role="alert">Impossible de charger ce calendrier :
<strong><?= cmsEsc($calendarError) ?></strong>. Les projets privés et leurs versions
restent conservés. Revenez à la <a href="?">bibliothèque</a> ; vérifiez
que les fichiers <code>index.php</code> et <code>lib.php</code> proviennent
de la même livraison. Le journal d'erreurs PHP conserve uniquement le code
de diagnostic, sans contenu privé.</p>
<details><summary>Référence technique pour le diagnostic</summary>
<?php if($calendarRuntimeInfo!==''): ?>
<p class="small preview-text"><code><?= cmsEsc($calendarRuntimeInfo) ?></code></p>
<?php endif; ?>
<p class="small">Empreintes des fichiers présents sur le serveur.
Elles ne prouvent pas que le cache PHP a été renouvelé.</p>
<?php foreach($calendarFileHashes as $calendarCodeFile=>$digest): ?>
<p class="small preview-text"><strong><?= cmsEsc($calendarCodeFile) ?></strong><br>
<code><?= cmsEsc($digest) ?></code></p>
<?php endforeach; ?>
</details>
<?php else: ?>
<form method="get" class="toolbar">
<input type="hidden" name="calendar" value="1">
<label>Mois<input type="month" name="month" min="2020-01" max="2099-12"
 value="<?= cmsEsc($calendarMonth) ?>"></label>
<label>Catégorie<select name="calendar_kind">
<option value="all">Toutes</option>
<?php foreach(cmsCreationKinds() as $value=>$label): ?>
<option value="<?= cmsEsc($value) ?>"<?= $calendarKind===$value?' selected':'' ?>><?= cmsEsc($label) ?></option>
<?php endforeach; ?>
</select></label>
<label>État<select name="calendar_status">
<option value="all"<?= $calendarStatus==='all'?' selected':'' ?>>Tous les brouillons</option>
<option value="draft"<?= $calendarStatus==='draft'?' selected':'' ?>>En rédaction</option>
<option value="review"<?= $calendarStatus==='review'?' selected':'' ?>>À relire</option>
</select></label>
<button type="submit">Filtrer le planning</button>
</form>
<div class="calendar-pagination">
<a href="?calendar=1&amp;month=<?= cmsEsc($calendarPrev) ?>&amp;calendar_kind=<?= cmsEsc($calendarKind) ?>&amp;calendar_status=<?= cmsEsc($calendarStatus) ?>">Mois précédent</a>
<a href="?calendar=1&amp;month=<?= cmsEsc($calendarNext) ?>&amp;calendar_kind=<?= cmsEsc($calendarKind) ?>&amp;calendar_status=<?= cmsEsc($calendarStatus) ?>">Mois suivant</a>
</div>
<div class="calendar-summary small" role="status">
<strong><?= (int)$calendarPlan['month_count'] ?> projet(s) ce mois</strong>
<span><?= (int)$calendarPlan['undated_count'] ?> sans date</span>
<span><?= (int)count($calendarPlan['other']) ?> hors du mois affiché</span>
</div>
<div class="calendar-days">
<?php foreach($calendarPlan['days'] as $date=>$items): ?>
<div class="calendar-day">
<h3><time datetime="<?= cmsEsc($date) ?>"><?= cmsEsc($date) ?></time>
 · <?= count($items) ?> projet(s)</h3>
<div class="calendar-items">
<?php foreach($items as $item): ?>
<div class="calendar-item">
<a href="?new=1&amp;cid=<?= cmsEsc($item['id']) ?>"><?= cmsEsc($item['title']) ?></a>
<span class="badge"><?= cmsEsc(cmsCreationKinds()[$item['kind']]) ?></span>
<p class="small"><?= $item['state']==='review'?'À relire':'En rédaction' ?>
 · v<?= (int)$item['version'] ?> · <?= cmsEsc($item['origin']) ?></p>
</div>
<?php endforeach; ?>
</div></div>
<?php endforeach; ?>
<?php if(!$calendarPlan['days']): ?>
<p class="muted">Aucun projet daté pour le mois sélectionné.</p>
<?php endif; ?>
</div>
<?php if($calendarPlan['undated']): ?>
<div class="calendar-undated">
<h3>À planifier — sans date cible</h3>
<?php foreach($calendarPlan['undated'] as $item): ?>
<p><a href="?new=1&amp;cid=<?= cmsEsc($item['id']) ?>"><?= cmsEsc($item['title']) ?></a>
 · <?= cmsEsc(cmsCreationKinds()[$item['kind']]) ?>
 · <?= $item['state']==='review'?'À relire':'En rédaction' ?></p>
<?php endforeach; ?>
</div>
<?php endif; ?>
<?php if($calendarPlan['other']): ?>
<details class="guided-group"><summary>Voir les projets datés hors du mois affiché
 (<?= count($calendarPlan['other']) ?>)</summary>
<?php foreach($calendarPlan['other'] as $item): ?>
<p><?= cmsEsc((string)$item['target_date']) ?> —
<a href="?new=1&amp;cid=<?= cmsEsc($item['id']) ?>"><?= cmsEsc($item['title']) ?></a>
</p>
<?php endforeach; ?>
</details>
<?php endif; ?>
<p class="note">Ce calendrier est un outil de planification éditoriale.
Aucune date, même pour une fiche à relire, n'autorise la mise en ligne.
L'IA, les créneaux Facebook/Instagram et les statistiques viendront dans des étapes ultérieures.</p>
<?php endif; ?>
</section>
<?php elseif($newMode): ?>
<p><a href="?<?= cmsEsc($filtersUrl) ?>">Retour à la bibliothèque (filtres conservés)</a></p>
<?php if($creation): ?>
<section id="cms-work-resume" class="work-resume<?= !$studioSourceCurrent?' work-resume--warning':'' ?>" data-work-resume>
<div>
<p class="work-resume__eyebrow"><?= !$studioSourceCurrent?'Source à vérifier':'Travail enregistré' ?> · version <?= (int)$creation['version'] ?></p>
<h2><?= !$studioSourceCurrent?'Brouillon conservé — modification suspendue':'Modifications en cours' ?></h2>
<p><strong><?= cmsEsc($creation['title']) ?></strong> · <?= $creation['state']==='review'?'À relire':'Brouillon de travail' ?>.
<?= !$studioSourceCurrent?'La fiche publiée a changé : la sauvegarde reste bloquée jusqu’à vérification.':'Reprenez votre travail là où vous l’avez enregistré, sans modifier le site publié.' ?></p>
</div>
<div class="work-resume__actions">
<?php if($studioSourceCurrent): ?>
<a class="btn" data-work-resume-action href="#cms-new-content">Reprendre les modifications</a>
<?php else: ?>
<a class="btn" data-work-resume-action href="#cms-preview">Consulter le brouillon conservé</a>
<?php endif; ?>
<a href="#cms-history">Voir l’historique</a>
</div></section>
<?php endif; ?>
<section>
<span class="badge"><?= isset($creation['source_binding'])?'Révision privée d’une fiche publiée':'Création privée' ?> · aucune publication</span>
<h2 id="cms-general"><?= isset($creation['source_binding'])?'Modifier la fiche publiée':($creation?'Modifier le brouillon de nouvelle page':'Créer un nouveau contenu') ?></h2>
<?= cmsStudioNavigationHtml(true,$createKind==='atelier') ?>
<?php if(isset($creation['source_binding'])): ?>
<p class="note">Ce brouillon reste lié à <strong><?= cmsEsc($studioBoundSource['title']??$creation['source_binding']['source_id']) ?></strong>.
Il prépare une révision de la même fiche ; aucune nouvelle page publique n’est créée.</p>
<p><a href="?id=<?= rawurlencode($creation['source_binding']['source_id']) ?>&amp;history=1&amp;<?= cmsEsc($filtersUrl) ?>#cms-history">Consulter les versions historiques de la fiche</a>
<?php if($studioBoundSource): ?> · <a href="<?= cmsEsc($studioBoundSource['url']) ?>" target="_blank" rel="noopener noreferrer">Consulter la page publiée</a><?php endif; ?></p>
<?php if(!$studioSourceCurrent): ?><p class="note" role="alert">La source publiée a changé ou son empreinte n’est plus vérifiable.
Sauvegardes et visas bloqués ; comparer les versions avant une nouvelle décision de reprise. Le brouillon privé reste conservé.</p><?php endif; ?>
<?php endif; ?>
<p class="small muted">Même Studio pour les cinq familles, sans JSON. Choisissez les champs
propres à la rubrique et sauvegardez : rien ne sera publié sur le site ni sur les réseaux.
Un brief IA prépare le sujet ; une proposition structurée remplit les champs de travail,
qui restent à vérifier avant tout enregistrement.</p>
<?php foreach(($_SESSION['ai_content_pending']??[]) as $waiting): ?>
<?php if($waiting['expires_at']<time())continue; ?>
<p class="small">Proposition temporaire :
<a href="?new=1&amp;kind=<?= cmsEsc($waiting['candidate']['kind']) ?>&amp;candidate=<?= cmsEsc($waiting['token']) ?><?= $waiting['creation_id']!==null?'&amp;cid='.cmsEsc($waiting['creation_id']):'' ?>"><?= cmsEsc($waiting['candidate']['title']) ?></a></p>
<?php endforeach; ?>
<?php if($pendingContent!==null): ?>
<div class="note" role="status"><strong>Proposition générée — non enregistrée.</strong>
<p>Relisez et corrigez les champs ci-dessous, puis enregistrez explicitement un brouillon.
Cette proposition temporaire est valable au plus 30 minutes, tant que cette session reste ouverte.
Elle reste à compléter et à vérifier avant toute publication.</p>
<p class="small"><?= cmsEsc($pendingContent['metadata']['provider_label']) ?> ·
<?= cmsEsc($pendingContent['metadata']['model_label']) ?> ·
<?= cmsEsc($pendingContent['metadata']['generated_at']) ?></p>
<?php foreach($pendingContent['similar_titles'] as $match): ?>
<p class="small">Sujet proche à examiner : <?= cmsEsc($match['title']) ?></p>
<?php endforeach; ?>
<details class="guided-group"><summary>Relire la proposition avant correction</summary>
<h3><?= cmsEsc($pendingContent['candidate']['title']) ?></h3>
<p class="preview-text"><?= cmsEsc($pendingContent['candidate']['summary']) ?></p>
<?= cmsGuidedPreviewHtml('fiche',$pendingContent['candidate']['fields']) ?>
</details></div>
<?php endif; ?>
<?php if(!$creation): ?>
<nav class="new-actions" aria-label="Catégorie de la nouvelle page">
<?php foreach(cmsCreationKinds() as $value=>$label): ?>
<a href="?new=1&amp;kind=<?= cmsEsc($value) ?>"
 <?= $createKind===$value?'aria-current="page"':'' ?>><?= cmsEsc($label) ?></a>
<?php endforeach; ?>
</nav>
<details class="guided-group"<?= $aiInputForm?' open':'' ?>>
<summary>Préparer un brief avec l’IA</summary>
<?php if($aiSettings!==null): ?>
<p class="small">La proposition sera enregistrée en brouillon privé dans le même formulaire.
Elle restera à vérifier et ne constituera pas un contenu complet ou approuvé.</p>
<form method="post" class="stack">
<input type="hidden" name="csrf" value="<?= cmsEsc($_SESSION['csrf']) ?>">
<input type="hidden" name="kind" value="<?= cmsEsc($createKind) ?>">
<?php foreach(['title'=>['Sujet ou titre',180],'angle'=>['Angle éditorial',700],
 'objective'=>['Besoin du lecteur et objectif',700],
 'context'=>['Informations complémentaires à transmettre à l’IA',2000]] as $field=>$spec): ?>
<label><?= cmsEsc($spec[0]) ?><textarea name="<?= cmsEsc($field) ?>" rows="3"
 maxlength="<?= (int)$spec[1] ?>"<?= $field==='context'?'':' required' ?>><?= cmsEsc($aiInputForm[$field]??'') ?></textarea></label>
<?php endforeach; ?>
<label>Contenu publié de référence<?= $createKind==='atelier'?' (recette obligatoire)':' (facultatif)' ?>
<select name="reference_id"<?= $createKind==='atelier'?' required':'' ?>>
<option value="">Choisir une référence</option>
<?php foreach($catalog as $reference): ?>
<?php if($createKind==='atelier' && $reference['kind']!=='recette')continue; ?>
<option value="<?= cmsEsc($reference['id']) ?>"<?= ($aiInputForm['reference_id']??'')===$reference['id']?' selected':'' ?>><?= cmsEsc($reference['title']) ?></option>
<?php endforeach; ?>
</select></label>
<label><input type="checkbox" name="semantic_review" value="1" required>
J’ai vérifié la bibliothèque et les projets privés, les variantes de noms et l’intention
du sujet. L’angle proposé apporte une différence utile.</label>
<p class="small muted">Seuls ce brief et la référence publique choisie seront transmis.
Une demande échouée peut compter dans la limite ; vérifiez les projets avant de relancer.</p>
<button name="ai_brief_generate" value="1">Générer un brief privé</button>
</form>
<?php else: ?>
<p class="small muted">L’assistance IA n’est pas disponible pour le moment.
Vous pouvez créer le contenu manuellement ci-dessous.</p>
<?php endif; ?>
</details>
<?php endif; ?>
<form method="post" class="stack" id="cms-new-editor" data-studio-edit>
<input type="hidden" name="csrf" value="<?= cmsEsc($_SESSION['csrf']) ?>">
<input type="hidden" name="creation_id" value="<?= cmsEsc($creation['id']??'') ?>">
<input type="hidden" name="expected_version" value="<?= (int)($pendingContent['expected_version']??$createExpected) ?>">
<input type="hidden" name="kind" value="<?= cmsEsc($createKind) ?>">
<?php if($pendingContent!==null): ?>
<input type="hidden" name="candidate_token" value="<?= cmsEsc($pendingContent['token']) ?>">
<?php elseif($candidateToken!==''): ?>
<input type="hidden" name="candidate_token" value="<?= cmsEsc(is_string($candidateToken)?$candidateToken:'invalid') ?>">
<?php endif; ?>
<label>Catégorie<input value="<?= cmsEsc(cmsCreationKinds()[$createKind]) ?>" disabled></label>
<label>Titre proposé<textarea name="title" rows="2" maxlength="180" required><?= cmsEsc((string)($createForm['title']??'')) ?></textarea></label>
<label>Angle éditorial — en quoi ce contenu est-il différent ?
<textarea name="angle" rows="3" maxlength="700" required><?= cmsEsc((string)($createForm['angle']??'')) ?></textarea></label>
<label>Résumé<textarea name="summary" rows="3" maxlength="2000"><?= cmsEsc((string)($createForm['summary']??'')) ?></textarea></label>
<div class="create-meta small">Les sujets identiques aux pages ou brouillons existants
de la même catégorie sont refusés. Les sujets proches sont signalés pour relecture.
Un Carnet culturel peut traiter l'histoire d'un plat sans répéter sa recette.</div>
<?php if($pendingContent===null && $candidateToken==='' && !isset($creation['source_binding'])): ?>
<details class="guided-group"<?= $aiContentInputForm?' open':'' ?>>
<summary>Générer une proposition structurée avec l’IA</summary>
<?php if($aiContentSettings!==null): ?>
<p class="small">Le titre et l’angle ci-dessus servent de brief. Les champs déjà saisis et
les notes privées ne sont pas transmis. Le résultat restera à relire et à enregistrer.</p>
<input type="hidden" name="ai_content_request_token" value="<?= cmsEsc($_SESSION['ai_content_intent']) ?>">
<label>Objectif pour le lecteur<textarea name="objective" maxlength="700" rows="3"><?= cmsEsc($aiContentInputForm['objective']??'') ?></textarea></label>
<label>Contexte à transmettre pour cette demande uniquement<textarea name="context" maxlength="2000" rows="3"><?= cmsEsc($aiContentInputForm['context']??'') ?></textarea></label>
<label>Référence publique<?= $createKind==='atelier'?' : recette structurée obligatoire':' (facultative)' ?>
<select name="reference_id"><option value="">Choisir une référence</option>
<?php foreach($catalog as $reference): ?>
<?php if($createKind==='atelier'&&($canonicalById[$reference['id']]['model']??null)!=='recipes')continue; ?>
<option value="<?= cmsEsc($reference['id']) ?>"<?= ($aiContentInputForm['reference_id']??'')===$reference['id']?' selected':'' ?>><?= cmsEsc($reference['title']) ?></option>
<?php endforeach; ?></select></label>
<label><input type="checkbox" name="semantic_review" value="1">
J’ai contrôlé les doublons, variantes de noms et intentions dans les pages et projets privés.</label>
<label><input type="checkbox" name="transmission_review" value="1">
J’ai le droit de transmettre les seules informations de ce brief et la référence publique choisie.</label>
<p class="small muted">Un échec compte dans le quota commun aux briefs. Aucune relance automatique.
Un atelier reçoit ici un plan de six phases ; la narration Coral reste une étape distincte.</p>
<button name="ai_content_generate" value="1">Générer une proposition à relire</button>
<p class="small" data-ai-content-status role="status" aria-live="polite"></p>
<?php else: ?>
<p class="small muted">La génération structurée est indisponible. Vous pouvez rédiger et enregistrer manuellement.</p>
<?php endif; ?></details>
<?php endif; ?>
<h3 id="cms-new-content">Modifier le contenu — <?= cmsEsc(cmsCreationKinds()[$createKind]) ?></h3>
<?= cmsCreationFormHtml($createKind,
    is_array($createForm['fields']??null)?$createForm['fields']:[]) ?>
<?php if($createKind==='recette'): ?>
<?= cmsRecipeAstroProfileHtml($createForm['recipe_astro']??null) ?>
<?= cmsRecipeAstroDetailsHtml($createForm['recipe_astro_details']??null,
    is_array($createForm['fields']??null)?$createForm['fields']:[]) ?>
<?php endif; ?>
<?php if($createKind==='culture'): ?>
<?= cmsCultureEvidenceHtml($createForm['culture_evidence']??null) ?>
<?php endif; ?>
<?php if($createKind==='technique'): ?>
<?= cmsTechniqueLinksHtml($createForm['technique_links']??null) ?>
<?php endif; ?>
<?php if($createKind==='atelier'): ?>
<?= cmsAtelierReferenceHtml($createForm['atelier_reference']??null,$catalog) ?>
<?= cmsAtelierPhaseDetailsHtml($createForm['atelier_phase_details']??null,
    is_array($createForm['fields']??null)?$createForm['fields']:[],
    $createForm['atelier_reference']??null) ?>
<?= cmsAtelierScriptsHtml($createForm['atelier_scripts']??null,
    is_array($createForm['fields']??null)?$createForm['fields']:[],
    $createForm['atelier_reference']??null,
    $createForm['atelier_phase_details']??null) ?>
<?php endif; ?>
<details class="guided-group"><summary>Notes et calendrier — facultatifs</summary>
<label>Notes de recherche privées (jamais publiées)
<textarea name="research_note" rows="3" maxlength="3000"><?= cmsEsc((string)($createForm['research_note']??'')) ?></textarea></label>
<label>Date cible du calendrier éditorial (facultative)
<input type="date" name="target_date" value="<?= cmsEsc((string)($createForm['target_date']??'')) ?>"></label>
</details>
<label>Statut<select name="state">
<option value="draft"<?= ($createForm['state']??'draft')==='draft'?' selected':'' ?>>Brouillon de travail</option>
<?php if($pendingContent===null): ?>
<option value="review"<?= ($createForm['state']??'draft')==='review'?' selected':'' ?>>Soumettre à relecture (non publié)</option>
<?php endif; ?>
</select></label>
<div class="studio-save" id="cms-new-save"><button name="create_save" value="1"<?= !$studioSourceCurrent?' disabled':'' ?>>Enregistrer une nouvelle version privée</button></div>
<?php if($pendingContent!==null): ?>
<button name="ai_content_discard" value="1" class="secondary" formnovalidate>Écarter la proposition et restaurer ma saisie</button>
<?php endif; ?>
</form></section>
<?php if($creation): ?>
<section id="cms-preview">
<h2>Aperçu du brouillon enregistré</h2>
<p class="small muted">Lecture simplifiée des champs enregistrés, sans reproduction du gabarit public, des images ni du lecteur audio.</p>
<?php if(isset($_GET['saved_new'])): ?>
<p role="status" class="notice">Nouvelle version privée enregistrée.</p>
<?php endif; ?>
<p class="small muted">Version <?= (int)$creation['version'] ?> ·
<?= cmsEsc($creation['recorded_at']) ?> ·
<?= $creation['state']==='review'?'Prêt pour relecture':'Brouillon' ?>
· <?= cmsEsc($creation['origin']) ?> · cible : <?= cmsEsc((string)($creation['target_date']??'non définie')) ?></p>
<?php if(isset($creation['ai_content'])): ?>
<p class="small muted">Proposition IA : <?= cmsEsc($creation['ai_content']['provider_label']) ?> ·
<?= cmsEsc($creation['ai_content']['model_label']) ?> · <?= cmsEsc($creation['ai_content']['generated_at']) ?>.
<?= count($creation['ai_content_edits']??[]) ?> champ(s) modifié(s) depuis la proposition. Validation humaine requise.</p>
<?php endif; ?>
<h3><?= cmsEsc($creation['title']) ?></h3>
<p><?= cmsEsc($creation['summary']) ?></p>
<p><strong>Angle :</strong> <?= cmsEsc($creation['angle']) ?></p>
<?= cmsGuidedPreviewHtml('fiche',$creation['fields']) ?>
</section><section id="cms-quality" class="studio-quality">
<h2>Ce qu’il reste à faire</h2>
<p>Relisez le contenu et enregistrez vos changements. Retrouvez ensuite cette version dans la bibliothèque.</p>
<?php if($creation['kind']==='atelier'): ?>
<p>Le guide audio est facultatif. Ces préparatifs audio ne bloquent pas l’enregistrement d’un brouillon sans narration.</p>
<ul data-studio-next-actions>
<li><?= ($creation['atelier_reference']['recipeSlug']??'')!==''?'Recette associée choisie : vérifiez les ingrédients et les portions.':'Choisissez la recette associée si vous souhaitez détailler les gestes ou préparer le guide.' ?></li>
<li><?= count($creation['fields']['phases']??[]) ?> étape(s) enregistrée(s). <a href="#cms-steps">Relire les consignes</a>.</li>
<li><?= cmsAtelierPhaseDetailsComplete($creation['atelier_phase_details']??null)?'Les gestes et points de contrôle sont renseignés ; ils restent à relire.':'Avant de rédiger le guide, complétez les gestes et points de contrôle des six étapes.' ?></li>
<li><a href="#cms-audio">Ouvrir les sept chapitres audio</a> pour voir les textes à rédiger ou à relire. Leur présence ne vaut pas approbation.</li>
</ul>
<?php endif; ?>
<?php if($creation['similar_titles']): ?><p class="note">Des sujets proches existent : examinez-les dans les contrôles ci-dessous avant de poursuivre.</p><?php endif; ?>
<details class="guided-group" data-studio-advanced><summary>Contrôles avancés — vérifications et validations complètes</summary>
<p class="small muted">Les contrôles concernent la version enregistrée. Enregistrez vos modifications avant de les évaluer.</p>
<?php if(!$studioSourceCurrent): ?>
<p class="note" role="alert">Contrôles et visas indisponibles : la source publiée ne correspond plus à ce brouillon.</p>
<?php elseif($creation['kind']==='atelier'): ?>
<?php $workshopCheck=null;
try{$workshopCheck=cmsAtelierBlueprintPreflight($creation,$catalog);}
catch(Throwable $ignored){$workshopCheck=null;} ?>
<details class="guided-group" data-atelier-blueprint-preflight>
<summary>Atelier Coral V2 — contrôles préalables privés</summary>
<?php if($workshopCheck!==null): ?>
<p class="small muted">Recette canonique reliée :
<strong><?= $workshopCheck['canonical_reference_checked']?'oui':'non' ?></strong>.
Six phases distinctes :
<strong><?= $workshopCheck['six_distinct_phases']?'oui':'non' ?></strong>.
Six phases détaillées :
<strong><?= $workshopCheck['phase_details_complete']?'oui':'non' ?></strong>.
Sept textes narratifs rédigés :
<strong><?= $workshopCheck['seven_scripts_drafted']?'oui':'non' ?></strong>.
Chapitres audio approuvés : <strong>non, visa humain requis</strong>.</p>
<?php else: ?>
<p class="small muted">Référence ou données incomplètes :
corriger le brouillon avant de préparer un blueprint.</p>
<?php endif; ?>
<p class="small muted">Aucun MP3, voix Coral, visuel ou droit
de publication n’est déduit de ce contrôle.</p>
</details>
<?php $visaStatus=null;
try{$visaStatus=cmsAtelierVisaStatus($creationDir,$creation,$catalog);}
catch(Throwable $ignored){$visaStatus=null;} ?>
<details class="guided-group" data-coral-human-visas>
<summary>Visa humain des sept textes — privé, sans génération audio</summary>
<p class="small muted">Validation explicite par chapitre et par version enregistrée.
Chaque visa est révocable. Toute nouvelle version de la fiche invalide les
visas précédents, même si les textes sont identiques. Un visa n’autorise
jamais à générer ou diffuser un MP3.</p>
<?php if(isset($_GET['visa_saved'])): ?>
<p class="notice" role="status">Décision humaine enregistrée dans le journal privé.</p>
<?php endif; ?>
<?php if($visaStatus===null): ?>
<p role="alert" class="small muted">Journal des visas indisponible.
Aucun visa ne peut être considéré comme valide.</p>
<?php else: ?>
<p class="small muted">Textes visés pour cette version :
<strong><?= (int)$visaStatus['approved_text_count'] ?>/7</strong>.
Autorisation audio : <strong>non</strong>. Publication : <strong>non</strong>.</p>
<?php $ready=$workshopCheck!==null
    &&($workshopCheck['ready_for_audio_review']??false)===true;
foreach(cmsAtelierScriptIds() as $i=>$chapterId):
$chapter=$creation['atelier_scripts']['chapters'][$i]??null;
$text=is_array($chapter)&&is_string($chapter['text']??null)?$chapter['text']:'';
$approved=($visaStatus['by_chapter'][$chapterId]??false)===true; ?>
<details class="guided-group">
<summary><?= cmsEsc($i===0?'Introduction':('Phase '.$i.' · '.$chapterId)) ?>
 — <?= $approved?'texte visé':'visa absent ou périmé' ?></summary>
<div class="coral-script-text"><?= cmsEsc($text!==''?$text:'Texte non rédigé.') ?></div>
<?php if($ready && $text!==''): ?>
<form method="post" action="?new=1&amp;cid=<?= rawurlencode($creation['id']) ?>&amp;<?= cmsEsc($filtersUrl) ?>">
<input type="hidden" name="csrf" value="<?= cmsEsc($_SESSION['csrf']) ?>">
<input type="hidden" name="creation_id" value="<?= cmsEsc($creation['id']) ?>">
<input type="hidden" name="expected_version" value="<?= (int)$creation['version'] ?>">
<input type="hidden" name="review_chapter" value="<?= cmsEsc($chapterId) ?>">
<label><input type="checkbox" name="review_confirm" value="1" required>
Je confirme avoir personnellement relu le texte affiché pour cette version
et compris que ce visa ne valide ni les doses, ni le MP3, ni la publication.</label>
<button type="submit" name="review_action"
 value="<?= $approved?'revoke':'approve' ?>">
<?= $approved?'Révoquer ce visa':'Valider ce texte uniquement' ?></button>
</form>
<?php else: ?>
<p class="small muted">Brouillon non prêt pour revue : enregistrer
les six phases complètes et les sept textes avant de viser ce chapitre.</p>
<?php endif; ?>
</details>
<?php endforeach; ?>
<?php endif; ?>
</details>
<?php $recipeAudit=null;$recipeAuditUnavailable=false;$culinaryStatus=null;
$coralPreflight=null;$coralPreflightUnavailable=false;
$culinaryStatusUnavailable=false;
if(isset($_GET['recipe_audit'])||isset($_GET['coral_preflight'])){
    try{
        if($canonicalById===[])throw new RuntimeException('CANONICAL_NOT_READY');
        $guidedPayload=cmsGetGuidedFields();
        if(!is_array($guidedPayload))throw new RuntimeException('GUIDED_NOT_READY');
        $guidedForAudit=cmsGuidedSourceList($guidedPayload,$canonicalById);
        cmsAssertGuidedCoverage($guidedForAudit,$canonicalById);
        $recipeAudit=cmsAtelierCanonicalRecipeAudit(
            $creation,$catalog,$canonicalById,$guidedForAudit);
        if(isset($_GET['coral_preflight'])){
            try{$coralPreflight=cmsAtelierCoralPrereception(
                $private,$creation,$catalog,$canonicalById,$guidedForAudit);}
            catch(Throwable $ignored){$coralPreflightUnavailable=true;}
        }
        if($recipeAudit['model_supported_for_quantity_review']){
            try{$culinaryStatus=cmsAtelierCulinaryStatus(
                $creationDir,$creation,$catalog,$canonicalById,$guidedForAudit);}
            catch(Throwable $ignored){$culinaryStatusUnavailable=true;}
        }
    }catch(Throwable $ignored){
        $recipeAuditUnavailable=true;
        if(isset($_GET['coral_preflight']))$coralPreflightUnavailable=true;
    }
} ?>
<details class="guided-group" id="canonical-review" data-atelier-recipe-audit
 <?= isset($_GET['recipe_audit'])?'open':'' ?>>
<summary>Comparer l’atelier à la recette canonique publiée — lecture seule</summary>
<p class="small muted">Cette comparaison récupère seulement à votre demande
les index publics déjà validés. Elle ne modifie ni l’atelier ni la recette,
et n'accorde aucun visa culinaire ou audio.</p>
<a href="?new=1&amp;cid=<?= rawurlencode($creation['id']) ?>&amp;<?= cmsEsc($filtersUrl) ?>&amp;recipe_audit=1#canonical-review">
Afficher les ingrédients et portions de la recette de référence</a>
<?php if($recipeAuditUnavailable): ?>
<p class="notice" role="alert">Index source indisponible ou incohérent.
Aucun rapprochement n’est validé. Contrôlez les index publics et réessayez.</p>
<?php elseif($recipeAudit!==null): ?>
<p class="small muted">Source : <?= cmsEsc($recipeAudit['recipe_id']) ?>.
Empreinte SHA256 complète :
<code class="coral-script-text"><?= cmsEsc($recipeAudit['canonical_sha256']) ?></code>.</p>
<?php if($recipeAudit['model_supported_for_quantity_review']): ?>
<p class="small muted">Nombre de portions canonique :
<strong><?= (int)$recipeAudit['canonical_servings'] ?></strong>.
Les quantités ci-dessous correspondent à cette base, pas aux portions
personnalisées d’un participant.</p>
<ul>
<?php foreach($recipeAudit['canonical_ingredients'] as $item): ?>
<li><?= cmsEsc($item['name']) ?> —
<?= cmsEsc($item['quantity']===null?'quantité non précisée':(string)$item['quantity']) ?>
<?= cmsEsc($item['unit']) ?></li>
<?php endforeach; ?>
</ul>
<?php else: ?>
<p class="small muted">Modèle de recette historique : contrôle chiffré
non disponible dans cet adaptateur. Vérification humaine indispensable.</p>
<?php endif; ?>
<p class="small muted"><?= (int)$recipeAudit['phase_ingredient_mentions'] ?>
nom(s) d’ingrédients mentionné(s) dans les phases.
Correspondances uniquement <strong>textuelles et exactes</strong> ;
les synonymes et dénominations culinaires doivent être contrôlés.</p>
<?php if($recipeAudit['phase_ingredient_not_exact']!==[]): ?>
<p class="small muted">Noms à rapprocher manuellement de la recette :
<?= cmsEsc(implode(' · ',$recipeAudit['phase_ingredient_not_exact'])) ?>.</p>
<?php endif; ?>
<p class="small muted">Le rapprochement ci-dessus n’est jamais une validation
automatique de la cuisine. Seul un contrôle humain explicite peut documenter
la revue des quantités, allergènes et gestes.</p>
<?php if($culinaryStatusUnavailable): ?>
<p class="notice" role="alert">Visa culinaire indisponible ou données
pédagogiques incomplètes. Aucune validation ne peut être considérée active.</p>
<?php elseif($culinaryStatus!==null): ?>
<?php $culinaryReviewed=$culinaryStatus['human_culinary_review_recorded']; ?>
<p class="small muted">Relecture culinaire humaine pour cette version :
<strong><?= $culinaryReviewed?'consignée':'absente ou périmée' ?></strong>.
Nombre de décisions conservées :
<?= (int)$culinaryStatus['review_event_count'] ?>.
Autorisation audio et publication : <strong>non</strong>.</p>
<?php if(isset($_GET['culinary_saved'])): ?>
<p class="notice" role="status">Décision culinaire enregistrée dans
le journal privé. Aucun traitement audio n’a été déclenché.</p>
<?php endif; ?>
<form method="post" action="?new=1&amp;cid=<?= rawurlencode($creation['id']) ?>&amp;<?= cmsEsc($filtersUrl) ?>&amp;recipe_audit=1#canonical-review"
 class="stack" data-culinary-human-visa>
<input type="hidden" name="csrf" value="<?= cmsEsc($_SESSION['csrf']) ?>">
<input type="hidden" name="creation_id" value="<?= cmsEsc($creation['id']) ?>">
<input type="hidden" name="expected_version" value="<?= (int)$creation['version'] ?>">
<?php if(!$culinaryReviewed): ?>
<p class="small muted">Cochez chaque point uniquement après
vérification réelle dans la recette publiée ET dans les six phases de
l’atelier. Les allergènes et températures ne sont pas certifiés par logiciel.</p>
<label><input type="checkbox" name="culinary_checks[servings]" value="1" required>
J’ai vérifié les portions et le rendement de la recette source.</label>
<label><input type="checkbox" name="culinary_checks[quantities]" value="1" required>
J’ai comparé ingrédients, quantités, unités et substitutions.</label>
<label><input type="checkbox" name="culinary_checks[allergens]" value="1" required>
J’ai contrôlé les allergènes et contaminations croisées possibles.</label>
<label><input type="checkbox" name="culinary_checks[gestures]" value="1" required>
J’ai relu les six phases, les gestes, les cuissons et la sécurité alimentaire.</label>
<?php endif; ?>
<label><?= $culinaryReviewed?'Motif de révocation':'Note de vérification (minimum 20 caractères)' ?>
<textarea name="culinary_note" rows="3" maxlength="900" minlength="20" required
 placeholder="Observations, contrôles effectués, points corrigés…"></textarea></label>
<label><input type="checkbox" name="culinary_confirm" value="1" required>
Je confirme personnellement cette décision, limitée à la version et
à l’empreinte de recette affichées ; elle ne déclenche aucun MP3.</label>
<button type="submit" name="culinary_action"
 value="<?= $culinaryReviewed?'revoke':'approve' ?>">
<?= $culinaryReviewed?'Révoquer la validation culinaire':'Consigner la revue culinaire' ?></button>
</form>
<?php else: ?>
<p class="small muted">La recette historique ne possède pas encore
l’adaptateur chiffré nécessaire à cette validation ; aucune
attestation culinaire ne peut être enregistrée automatiquement.</p>
<?php endif; ?>
<p class="small muted">Même avec les sept narrations visées et
la revue culinaire consignée, le TTS Coral, les MP3 et la publication
restent désactivés.</p>
<?php endif; ?>
</details>
<details class="guided-group" id="coral-preflight" data-coral-prereception
 <?= isset($_GET['coral_preflight'])?'open':'' ?>>
<summary>Tableau Coral V2 — neuf contrôles avant toute production audio</summary>
<p class="small muted">Dossier privé et non publiant. Ce tableau réunit les
visas des sept textes, la relecture culinaire et les exigences média/audio.
Il ne lance aucun service, ne traite aucun fichier MP3 et ne délivre aucune
autorisation de génération.</p>
<a href="?new=1&amp;cid=<?= rawurlencode($creation['id']) ?>&amp;<?= cmsEsc($filtersUrl) ?>&amp;coral_preflight=1#coral-preflight">
Calculer le tableau de pré-réception sur les données actuelles</a>
<?php if($coralPreflightUnavailable): ?>
<p class="notice" role="alert">Diagnostic indisponible : index public,
source de recette ou journal privé incohérent. Aucun accord audio possible.</p>
<?php elseif($coralPreflight!==null): ?>
<p class="small muted">Version <?= (int)$coralPreflight['creation_version'] ?>.
Contrôles documentés :
<strong><?= (int)$coralPreflight['completed_checks'] ?>/<?= (int)$coralPreflight['check_count'] ?></strong>.
Textes approuvés : <strong><?= (int)$coralPreflight['human_text_visas_count'] ?>/7</strong>.</p>
<ul>
<?php foreach($coralPreflight['checks'] as $item): ?>
<li><strong><?= $item['complete']?'Contrôlé':'Bloqué' ?></strong> —
<?= cmsEsc($item['label']) ?></li>
<?php endforeach; ?>
</ul>
<h3>Sept chapitres Coral — précontrôle, sans audio</h3>
<p class="small muted">Durée des activités prévues dans les six phases :
<?= (int)$coralPreflight['total_planned_activity_minutes'] ?> minute(s).
Ce n’est <strong>pas</strong> la durée réelle d’un MP3. L’introduction
ne possède pas de durée d’activité.</p>
<ol>
<?php foreach($coralPreflight['chapters'] as $chapter): ?>
<li><strong><?= cmsEsc($chapter['id']) ?></strong> :
<?= (int)$chapter['script_characters'] ?> caractère(s),
texte <?= $chapter['script_drafted']?'rédigé':'incomplet' ?>,
visa <?= $chapter['text_approved']?'actif':'absent' ?>,
<?php if($chapter['planned_activity_minutes']!==null): ?>
activité prévue <?= (int)$chapter['planned_activity_minutes'] ?> min ;
<?php else: ?>activité non minutée ;
<?php endif; ?>
MP3/écoute/pauses : <strong>non vérifiés</strong>.</li>
<?php endforeach; ?>
</ol>
<?php if($coralPreflight['blocking_notes']!==[]): ?>
<p class="small muted">Points de blocage :</p>
<ul><?php foreach($coralPreflight['blocking_notes'] as $note): ?>
<li><?= cmsEsc($note) ?></li><?php endforeach; ?></ul>
<?php endif; ?>
<p class="notice">Génération TTS : <strong>non autorisée</strong>.
Droits voix et images, sept MP3 réels, durées réelles, synchronisation
des pauses et navigation mobile doivent être réceptionnés séparément.
Aucun fichier existant n'est modifié.</p>
<?php endif; ?>
</details>
<?php endif; ?>
<?php if($creation['kind']==='ingredient' || $creation['kind']==='technique'): ?>
<?php $nativeProjection=null;
try{
    $nativeProjection=$creation['kind']==='ingredient'
        ?cmsIngredientAstroDraftProjection($creation)
        :cmsTechniqueAstroDraftProjection($creation);
}catch(Throwable $ignored){$nativeProjection=null;} ?>
<details class="guided-group" data-native-draft-projection>
<summary>Structure Astro privée — <?= cmsEsc(cmsCreationKinds()[$creation['kind']]) ?></summary>
<p class="small muted"><?= $nativeProjection!==null
    ?'Les champs éditoriaux sont structurés ; médias, droits et validation restent requis.'
    :'Champs du brouillon incomplets. Complétez le formulaire avant vérification.' ?></p>
<?php if($nativeProjection!==null): ?>
<p class="small muted">Publication autorisée : non. Aucune création de page
 ni modification d’un contenu publié.</p>
<?php endif; ?>
</details>
<?php endif; ?>
<?php if($creation['kind']==='culture'): ?>
<?php $carnetProjection=null;
try{$carnetProjection=cmsCultureAstroDraftProjection($creation);}
catch(Throwable $ignored){$carnetProjection=null;}
$carnetDossier=cmsCultureEvidenceClean($creation['culture_evidence']??null);
$carnetCount=count($carnetDossier['items']??[]); ?>
<details class="guided-group" data-culture-private-review>
<summary>Carnet : dossier documentaire privé (<?= (int)$carnetCount ?> vérification(s))</summary>
<p class="small muted">Ce dossier est exclusivement interne au Studio :
aucune référence documentaire n'est incluse dans la projection de page
publique. Les mentions « vérifié » ne sont pas une autorisation de publier.</p>
<p class="small muted">Projection culturelle :
<?= $carnetProjection!==null
  ?'structure de lecture préparée ; médias, droits et validation à compléter'
  :'champs de lecture incomplets ; poursuivez la rédaction' ?>.</p>
</details>
<?php endif; ?>
<?php if($creation['kind']==='recette'): ?>
<?php $recipeProjection=null;
try{$recipeProjection=cmsRecipeAstroDraftProjection($creation);}
catch(Throwable $ignored){$recipeProjection=null;}
$recipeProfile=$creation['recipe_astro']??null; ?>
<p class="small muted">Profil Astro complémentaire : <strong><?=
 cmsRecipeAstroProfileComplete($recipeProfile)
    ?'difficulté, catégorie et mots-clés renseignés'
    :'difficulté, catégorie ou mots-clés encore à compléter' ?></strong>.
Cela ne vaut pas validation d’une recette publiable.</p>
<?php if($recipeProjection!==null): ?>
<details class="guided-group" data-recipe-astro-projection>
<summary>Projection typée Recipe — contrôle technique privé</summary>
<p class="small muted">Une conversion non publiée a pu structurer
<?= count($recipeProjection['draft']['ingredients']) ?> ingrédient(s),
<?= count($recipeProjection['draft']['steps']) ?> étape(s) et
<?= count($recipeProjection['draft']['tags']) ?> mot(s)-clé(s).
Aucun média ni droit de publication n’est associé à cette projection.</p>
<ul><?php foreach($recipeProjection['review_points'] as $point): ?>
<li><?= cmsEsc($point) ?></li>
<?php endforeach; ?></ul>
</details>
<?php elseif(cmsRecipeAstroProfileComplete($recipeProfile)): ?>
<p class="small muted">Projection Recipe bloquée : corrigez les quantités,
les champs ou la structure de la recette avant une future prévisualisation.</p>
<?php endif; ?>
<?php endif; ?>
<?php if($creation['similar_titles']): ?>
<div class="note"><strong>Sujets proches à examiner :</strong>
<?php foreach($creation['similar_titles'] as $match): ?>
<p><?= cmsEsc($match['title']) ?></p><?php endforeach; ?></div>
<?php endif; ?>
</details>
</section><section id="cms-history">
<h2>Historique et publication</h2>
<?php if($createVersion): ?>
<h3>Version historique <?= (int)$createVersion['version'] ?></h3>
<p><?= cmsEsc($createVersion['title']) ?> — <?= cmsEsc($createVersion['recorded_at']) ?></p>
<?= cmsGuidedPreviewHtml('fiche',$createVersion['fields']) ?>
<?php if($createVersion['kind']==='atelier'): ?>
<details class="guided-group"><summary>Narrations de cette version historique — lecture seule</summary>
<?php foreach(($createVersion['atelier_scripts']['chapters']??[]) as $chapter): ?>
<h4><?= cmsEsc($chapter['id']) ?></h4><p class="preview-text"><?= cmsEsc($chapter['text']) ?></p>
<?php endforeach; ?></details>
<?php endif; ?>
<?php endif; ?>
<h3>Historique privé</h3><nav class="versions">
<?php foreach(cmsCreationVersions($creationDir,$creation['id']) as $v): ?>
<a href="?new=1&amp;cid=<?= cmsEsc($creation['id']) ?>&amp;<?= cmsEsc($filtersUrl) ?>&amp;revision=<?= (int)$v ?>#cms-history">Version <?= (int)$v ?></a>
<?php endforeach; ?></nav>
<?php $astroGap=cmsAstroPublicationGapReport($creation); ?>
<details class="guided-group" data-astro-publication-gap>
<summary>Écarts avec le modèle Astro — publication bloquée</summary>
<p class="small muted">Modèle cible : <?= cmsEsc($astroGap['native_model']) ?>.
Le formulaire actuel <?= $astroGap['form_core_complete']
    ?'couvre ses champs de travail':'contient encore des champs de travail incomplets' ?>,
mais <strong>ce brouillon ne constitue pas une page Astro prête à publier</strong>.</p>
<h3>Compléments non couverts par le formulaire</h3>
<ul><?php foreach($astroGap['not_covered'] as $gap): ?>
<li><?= cmsEsc($gap) ?></li>
<?php endforeach; ?></ul>
<h3>Contrôles et autorisations restants</h3>
<ul><?php foreach($astroGap['pending_gates'] as $gate): ?>
<li><?= cmsEsc($gate) ?></li>
<?php endforeach; ?></ul>
<p class="small muted">Ce diagnostic est indicatif et n’accorde aucun droit de publication.</p>
</details>
<p class="small muted">Ce brouillon ne crée pas encore de page publique.
La génération Astro et la publication feront l'objet d'un circuit séparé,
avec validation humaine et tests.</p>
</section>
<?php endif; ?>
<section><h2>Autres créations privées</h2>
<?php if(!$creations): ?><p>Aucun projet pour le moment.</p><?php endif; ?>
<?php foreach($creations as $item): ?>
<div class="create-card"><span class="badge"><?= cmsEsc(cmsCreationKinds()[$item['kind']]) ?></span>
<strong><?= cmsEsc($item['title']) ?></strong> · v<?= (int)$item['version'] ?>
· <?= $item['state']==='review'?'À relire':'Brouillon' ?>
<p><a href="?new=1&amp;cid=<?= cmsEsc($item['id']) ?>">Ouvrir ce projet</a></p></div>
<?php endforeach; ?>
</section>
<?php elseif($selected): ?>
<p><a href="?<?= cmsEsc($filtersUrl) ?>">Retour à la bibliothèque (filtres conservés)</a> · <a href="<?= cmsEsc($selected['url']) ?>" target="_blank"
 rel="noopener noreferrer">Consulter la page actuellement publiée</a></p>
<section id="cms-work-resume" class="work-resume<?= $staleDraft?' work-resume--warning':'' ?>" data-work-resume>
<div>
<p class="work-resume__eyebrow"><?= $staleDraft?'Version source à vérifier':($studioLinked!==null||$latest?'Travail déjà enregistré':'Commencer la modification') ?></p>
<h2><?= $staleDraft?'Modifications conservées — relecture nécessaire':($studioLinked!==null||$latest?'Modifications en cours':'Modifier ce contenu') ?></h2>
<p><strong><?= cmsEsc($selected['title']) ?></strong>.
<?php if($staleDraft): ?>
La source a changé : comparez les versions avant de poursuivre, sans écraser le brouillon.
<?php elseif($studioLinked!==null): ?>
Un brouillon de travail existe déjà pour cet atelier. Retrouvez vos modifications et son guide audio facultatif.
<?php elseif($selected['kind']==='atelier'): ?>
Préparez le brouillon de travail de cet atelier ; vos anciennes versions restent accessibles.
<?php elseif($latest): ?>
Votre proposition privée v<?= (int)$latest['version'] ?> est disponible. Elle n’a pas modifié le site publié.
<?php else: ?>
Modifiez la fiche et enregistrez une première version privée, sans modifier la page publiée.
<?php endif; ?></p>
</div>
<?php if($studioLinked!==null): ?>
<div class="work-resume__actions">
<a class="btn" data-work-resume-action href="?new=1&amp;cid=<?= cmsEsc($studioLinked['id']) ?>&amp;<?= cmsEsc($filtersUrl) ?>#cms-new-content">Reprendre le brouillon de travail</a>
<a href="#cms-history">Historique</a>
</div>
<?php elseif($selected['kind']==='atelier' && !$staleDraft): ?>
<?php if($selectedCanonical && $guidedSelected && $guidedSelected['model']==='cookingWorkshopGuides'): ?>
<form method="post" class="work-resume__form" data-studio-transition>
<input type="hidden" name="csrf" value="<?= cmsEsc($_SESSION['csrf']) ?>">
<input type="hidden" name="source_id" value="<?= cmsEsc($selected['id']) ?>">
<input type="hidden" name="source_fingerprint" value="<?= cmsEsc($selected['fingerprint']) ?>">
<input type="hidden" name="canonical_fingerprint" value="<?= cmsEsc($selectedCanonical['fingerprint']) ?>">
<input type="hidden" name="expected_version" value="<?= (int)($latest['version']??0) ?>">
<label><input type="checkbox" name="transition_confirm" value="1" required>
Je confirme la reprise de cette fiche dans un brouillon lié, en conservant l’historique.</label>
<button name="studio_transition" value="1">Ouvrir le brouillon de travail</button>
</form>
<?php else: ?><p class="note" role="status">Brouillon lié indisponible : la source ou le modèle doit être vérifié.</p><?php endif; ?>
<?php elseif($staleDraft): ?>
<div class="work-resume__actions"><a class="btn" data-work-resume-action href="#cms-history">Comparer les versions</a></div>
<?php else: ?>
<div class="work-resume__actions"><a class="btn" data-work-resume-action href="#cms-content"><?= $latest?'Reprendre mes modifications':'Modifier ce contenu' ?></a>
<a href="#cms-preview">Consulter l’aperçu</a></div>
<?php endif; ?>
</section>
<section id="cms-general"><span class="badge"><?= cmsEsc($kindLabels[$selected['kind']]??'Contenu') ?></span>
<h2><?= cmsEsc($selected['title']) ?></h2>
<details class="guided-group"><summary>Informations techniques de la fiche</summary><p class="small muted">Identifiant stable : <?= cmsEsc($selected['id']) ?> · Empreinte de la source :
<code><?= cmsEsc($selected['fingerprint']) ?></code></p></details>
<p class="summary"><strong>Présentation actuellement utilisée par le catalogue social :</strong>
<?= cmsEsc($selected['summary']) ?></p></section>
<?= cmsStudioNavigationHtml() ?>
<div class="grid">
<section>
<?php if($studioLinked===null): ?>
<h2><?= $latest?'Modifier la proposition (version '.(int)$latest['version'].')':'Créer une proposition' ?></h2>
<p class="small muted">Modifiez les champs de cette fiche ci-dessous. Chaque enregistrement crée
un brouillon privé : il ne modifie pas la page publiée, les médias ni les MP3.</p>
<?php if(!$selectedCanonical): ?>
<p class="note" role="status">L'index des versions complètes Astro n'est pas disponible sur ce serveur.
Vous pouvez préparer le texte d'une proposition, mais les changements structurés restent
bloqués jusqu'à la mise en place et la vérification de cet index.</p>
<?php else: ?>
<details class="guided-group"><summary>Protection de la version publiée</summary><p class="small muted">Version complète Astro protégée :
<code><?= cmsEsc(substr($selectedCanonical['fingerprint'],0,16)) ?></code>
(<?= cmsEsc($selectedCanonical['model']) ?>).
Toute modification de la fiche d'origine exige une nouvelle revue.</p></details>
<?php endif; ?>
<?php if($guidedContractError): ?>
<p class="note" role="alert">Les champs guidés de cette fiche sont momentanément
indisponibles : le manifeste éditorial ne correspond pas à toutes les pages publiées.
Une correction du modèle et une nouvelle réception technique sont nécessaires.
Les brouillons déjà enregistrés restent conservés.</p>
<?php endif; ?>
<?php if($staleDraft): ?><p class="note" role="alert">
La page d'origine a changé depuis cette proposition. Nouvelle sauvegarde bloquée pour éviter
d'écraser une version récente. Comparer la source et reprendre le travail après relecture.
</p><?php endif; ?>
<form method="post" class="stack" id="cms-fields" data-studio-edit>
<h3 id="cms-content">Contenu de la fiche</h3>
<input type="hidden" name="csrf" value="<?= cmsEsc($_SESSION['csrf']) ?>">
<input type="hidden" name="source_id" value="<?= cmsEsc($selected['id']) ?>">
<input type="hidden" name="source_fingerprint" value="<?= cmsEsc($selected['fingerprint']) ?>">
<input type="hidden" name="canonical_fingerprint"
 value="<?= cmsEsc($selectedCanonical['fingerprint']??'') ?>">
<input type="hidden" name="expected_version" value="<?= $latest?(int)$latest['version']:0 ?>">
<input type="hidden" name="editor_mode" value="<?= cmsEsc($editorMode) ?>">
<label>Titre proposé<textarea name="title" required maxlength="180" rows="2"
 class="title-editor"><?= cmsEsc($latest['title']??$selected['title']) ?></textarea></label>
<label>Résumé du catalogue (proposition)<textarea name="summary" maxlength="1500"
 rows="4"><?= cmsEsc($latest['summary']??$selected['summary']) ?></textarea></label>
<p class="small muted">Ce résumé présente la fiche dans le catalogue.
Les informations détaillées propres à chaque rubrique se modifient dans les champs guidés.</p>
<details class="guided-group editorial-note">
<summary>Texte éditorial proposé — consignes générales (facultatif)</summary>
<p class="small muted">Utilisez ce champ pour une proposition globale.
Pour modifier une étape ou un paragraphe existant, utilisez directement l'éditeur guidé.</p>
<label>Consignes de réécriture<textarea name="editorial_text" maxlength="12000" rows="5"
 placeholder="Facultatif : instructions pour une future relecture."><?= cmsEsc($latest['editorial_text']??'') ?></textarea></label>
</details>
<?php
$structureCurrent=is_array($latest['structure']??null)
    ? (string)json_encode($latest['structure'],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)
    : '';
$structureHints=[
 'recette'=>'Ingrédients (chaînes pour recettes historiques ou objets quantité/unité/nom), étapes titre/texte, temps et portions.',
 'culture'=>'Sections composées d’un titre et de paragraphes.',
 'atelier'=>'Étapes pédagogiques, phases avec actions et scripts proposés ; les MP3 en production restent inchangés.',
 'ingredient'=>'Paragraphes détaillés, usages et conseils.',
 'technique'=>'Fournitures, étapes et alternatives.'
];
?>
<?php if($guidedEditable && $editorMode==='guided'): ?>
<div class="guided-nav">
<strong>Éditeur guidé — <?= cmsEsc($kindLabels[$selected['kind']]??'Contenu') ?></strong>
<a href="?id=<?= rawurlencode($selected['id']) ?>&amp;mode=json">Mode avancé (JSON)</a>
</div>
<p class="small muted">Dépliez les sections pour modifier chaque paragraphe, étape ou conseil.
Les lignes existantes restent au même nombre et dans le même ordre, sans perte des métadonnées.
Les fiches canoniques et les médias ne changent pas tant que les propositions n'ont pas été approuvées.
Les narrations et MP3 Coral restent entièrement protégés.</p>
<?php foreach($guidedValues as $field=>$value): ?>
<?= cmsGuidedHtml('guided['.$field.']',$value,(string)$field) ?>
<?php endforeach; ?>
<?php else: ?>
<?php if($guidedEditable): ?>
<p class="small"><a href="?id=<?= rawurlencode($selected['id']) ?>">Utiliser l'éditeur guidé</a></p>
<?php elseif($guidedSelected && !$guidedSelected['editable']): ?>
<p class="note">Cet atelier utilise le parcours audio validé : les phases restent protégées.
Décrivez les changements souhaités dans le texte éditorial ou dans un brouillon avancé.
Aucune modification de script ou de MP3 n'est appliquée.</p>
<?php endif; ?>
<label>Mode expert — proposition structurée JSON (facultatif)
<textarea name="structure_json" maxlength="20000" rows="10"
 spellcheck="false"><?= cmsEsc($structureCurrent) ?></textarea></label>
<p class="small muted"><?= cmsEsc($structureHints[$selected['kind']]??'') ?>
Seuls les champs présents constituent une proposition de modification : les autres données de la fiche ne sont pas effacées.
La sauvegarde n'écrit aucun fichier Astro, média ou MP3. Pour une structure complète,
une relecture des modèles réels et une PR restent nécessaires.</p>
<?php endif; ?>
<label>Note pour la relecture<textarea name="editor_note" maxlength="2000" rows="3"><?= cmsEsc($latest['editor_note']??'') ?></textarea></label>
<label>État privé du brouillon
<select name="state">
<option value="draft"<?= ($latest['state']??'draft')==='draft'?' selected':'' ?>>Brouillon de travail</option>
<option value="review"<?= ($latest['state']??'draft')==='review'?' selected':'' ?>>Prêt pour relecture (non publié)</option>
</select></label>
<div id="cms-save" class="actions studio-save"><button name="save" value="1"<?= $staleDraft?' disabled':'' ?>>Enregistrer une nouvelle version</button></div>
</form>
<?php else: ?><h2 id="cms-content">Édition poursuivie dans le brouillon lié</h2>
<p id="cms-save"><a href="?new=1&amp;cid=<?= cmsEsc($studioLinked['id']) ?>">Ouvrir le formulaire et enregistrer une nouvelle version</a></p><?php endif; ?>
</section>
<section id="cms-preview"><h2>Aperçu du brouillon enregistré</h2>
<p class="small muted">Lecture simplifiée de la proposition sauvegardée, et non
prévisualisation exacte de la page publiée.</p>
<?php if(isset($_GET['saved'])): ?><p class="notice" role="status">Nouvelle version privée enregistrée.</p><?php endif; ?>
<?php if(!$display): ?><p class="muted">Aucune version enregistrée. Complète puis sauvegarde le formulaire.</p>
<?php else: ?>
<p class="small">Version <?= (int)$display['version'] ?> ·
<?= cmsEsc($display['recorded_at']) ?> ·
<?= $display['state']==='review'?'Prêt pour relecture':'Brouillon' ?></p>
<h3><?= cmsEsc($display['title']) ?></h3>
<p class="preview-text"><?= cmsEsc($display['summary']) ?></p>
<div class="preview-text"><?= cmsEsc($display['editorial_text']) ?></div>
<?php if(is_array($display['structure']??null)): ?>
<h3>Changements proposés dans la fiche</h3>
<?= cmsGuidedPreviewHtml('fiche',$display['structure']) ?>
<details class="guided-group">
<summary>Afficher le JSON technique (mode expert)</summary>
<pre class="preview-text"><?= cmsEsc((string)json_encode($display['structure'],
JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)) ?></pre>
</details>
<?php endif; ?>
<?php if($display['editor_note']!==''): ?>
<h3>Note de relecture</h3><p class="preview-text"><?= cmsEsc($display['editor_note']) ?></p>
<?php endif; ?>
<?php endif; ?>
<?php if($latest && $latest['state']==='review'
 && is_array($latest['structure']??null) && $selected['kind']==='recette'): ?>
<h3>Préparer une modification GitHub</h3>
<p class="small muted">Télécharge une demande de modification à partir de cette version
relue. Elle ne modifie ni GitHub ni le site : le fichier devra être contrôlé
contre la recette actuelle, puis appliqué sur une branche distincte avec
diff lisible et validation humaine. Un changement de fiche bloque l'export.</p>
<form method="post">
<input type="hidden" name="csrf" value="<?= cmsEsc($_SESSION['csrf']) ?>">
<input type="hidden" name="source_id" value="<?= cmsEsc($selected['id']) ?>">
<input type="hidden" name="source_fingerprint" value="<?= cmsEsc($selected['fingerprint']) ?>">
<input type="hidden" name="canonical_fingerprint"
 value="<?= cmsEsc($selectedCanonical['fingerprint']??'') ?>">
<input type="hidden" name="export_version" value="<?= (int)$latest['version'] ?>">
<button name="export_review" value="1"<?= $staleDraft || !$selectedCanonical?' disabled':'' ?>>
Télécharger la demande de modification (JSON)</button>
</form>
<?php endif; ?>
<div id="cms-history"><h3>Historique et publication</h3>
<?php if($versions): ?><h3>Historique immuable</h3><nav class="versions" aria-label="Versions du brouillon">
<?php foreach($versions as $v): ?>
<a href="?id=<?= rawurlencode($selected['id']) ?>&amp;history=1&amp;<?= cmsEsc($filtersUrl) ?>&amp;revision=<?= (int)$v ?>#cms-history">Version <?= (int)$v ?></a>
<?php endforeach; ?></nav>
<p class="small muted">Les anciennes versions restent consultables ; seule une nouvelle sauvegarde crée une version.</p><?php endif; ?>
</div>
</section>
</div>
<section id="cms-quality" class="studio-quality">
<h2>Ce qu’il reste à faire — <?= cmsEsc($kindLabels[$selected['kind']]) ?></h2>
<?php if($selected['kind']==='atelier'): ?>
<?php if($studioLinked!==null): ?>
<p class="note">Les modifications et le guide audio facultatif sont réunis dans le brouillon lié. Cet écran conserve les versions antérieures en lecture seule.</p>
<a class="btn" href="?new=1&amp;cid=<?= cmsEsc($studioLinked['id']) ?>&amp;<?= cmsEsc($filtersUrl) ?>#cms-quality">Modifier et contrôler l’atelier</a>
<?php else: ?>
<div data-coral-prereception>
<p class="note">Vous pouvez modifier le contenu de la fiche et enregistrer un brouillon privé. Pour détailler les étapes ou préparer un guide audio facultatif, ouvrez le brouillon de travail lié à cette fiche.</p>
<p>Les enregistrements audio déjà publiés sont conservés. Préparer un guide audio n’est pas nécessaire pour enregistrer vos modifications.</p>
<details class="guided-group"><summary>Contrôles avancés du guide audio — neuf vérifications</summary>
<ol><li>Recette canonique et empreinte SHA256</li><li>Six phases détaillées</li><li>Sept narrations complètes</li><li>Sept visas humains de texte</li><li>Validation culinaire humaine</li><li>Droits médias et voix</li><li>Écoute des sept MP3</li><li>Mesures des durées réelles</li><li>Navigation et synchronisation mobiles</li></ol>
<p>Textes attendus : <?= cmsEsc(implode(', ',cmsAtelierScriptIds())) ?>. Aucun visa ni état audio n’est repris automatiquement.</p>
</details></div>
<p class="small muted">La reprise du brouillon de travail se fait désormais en haut de cette fiche, sans créer plusieurs versions concurrentes.</p>
<a href="#cms-work-resume">Revenir aux modifications en cours</a>
<?php endif; ?>
<?php else: ?>
<ul><?php foreach(cmsAstroPublicationCoverage()[$selected['kind']]['gates'] as $gate): ?><li><?= cmsEsc($gate) ?></li><?php endforeach; ?></ul>
<p class="small muted">Comparer le brouillon enregistré à la fiche publiée et relire les modifications. Le statut « prêt pour relecture » ne constitue pas une validation humaine ni une autorisation de publication.</p>
<?php endif; ?></section>

<?php else: ?>
<section><h2>Contenus disponibles à la préparation</h2>
<p class="small muted"><?= count($catalog) ?> contenus reconnus dans le catalogue public actuel.
Cette liste n'est ni un calendrier ni une file de validation sociale.</p>
<div class="cards">
<?php foreach($shown as $src): ?>
<article class="card">
<?php if($src['image_url']): ?>
<img src="<?= cmsEsc($src['image_url']) ?>" width="82" height="82" loading="lazy" alt="">
<?php endif; ?>
<div class="card-text"><span class="badge"><?= cmsEsc($kindLabels[$src['kind']]??'Contenu') ?></span>
<h3><?= cmsEsc($src['title']) ?></h3>
<?php $prev=$latestById[$src['id']]??null; ?>
<?php if($prev): ?>
<p class="small"><span class="badge"><?= $prev['state']==='review'?'Prêt pour relecture':'Brouillon' ?>
· v<?= (int)$prev['version'] ?></span></p>
<?php if(!hash_equals($prev['source_fingerprint'],$src['fingerprint'])||($prev['studio_source_stale']??false)): ?>
<p class="small note">Source actualisée depuis le brouillon : relecture nécessaire.</p>
<?php endif; ?>
<?php endif; ?>
<?php $workLinked=$src['kind']==='atelier'?cmsStudioLinkedDraft($creations,$src['id']):null; ?>
<a class="btn" data-library-resume href="<?= $workLinked?'?new=1&amp;cid='.cmsEsc($workLinked['id']).'&amp;'.cmsEsc($filtersUrl):'?id='.rawurlencode($src['id']).'&amp;'.cmsEsc($filtersUrl) ?>"><?= $workLinked?'Reprendre le brouillon':($prev?'Voir mes modifications':'Modifier ce contenu') ?></a>
</div></article>
<?php endforeach; ?>
</div>
<?php if(!$shown): ?><p>Aucun contenu trouvé.</p><?php endif; ?>
</section>
<?php endif; ?>
<?php endif; ?>
<script nonce="<?= cmsEsc($nonce) ?>">
// Anchors keep all fields in the current document. Warn before a real page
// change (quality calculations/history) when an edit has not been saved.
document.querySelectorAll('.editor-shortcuts a, [data-studio-next-actions] a').forEach(link=>link.addEventListener('click',()=>{
  const target=document.querySelector(link.getAttribute('href'));
  if(target?.matches('details'))target.open=true;
  for(let parent=target?.parentElement;parent;parent=parent.parentElement){
    if(parent.matches('details'))parent.open=true;
  }
}));
document.addEventListener('input',event=>{
  if(!event.target.matches('[data-create-row] textarea[name$="[title]"]'))return;
  event.target.closest('[data-create-row]').querySelector('summary strong').textContent=event.target.value.trim()||'Sans titre';
});
let studioDirty=false;
document.querySelectorAll('[data-studio-edit]').forEach(form=>{
  form.addEventListener('input',()=>{studioDirty=true;});
  form.addEventListener('change',()=>{studioDirty=true;});
  form.addEventListener('submit',()=>{studioDirty=false;});
});
window.addEventListener('beforeunload',event=>{
  if(studioDirty){event.preventDefault();event.returnValue='';}
});
document.querySelector('[data-studio-transition]')?.addEventListener('submit',event=>{
  if(studioDirty){event.preventDefault();window.alert('Enregistrez les modifications de la fiche avant de préparer le brouillon lié.');}
});
document.querySelector('#cms-new-editor')?.addEventListener('submit',event=>{
  if(event.submitter?.name!=='ai_content_generate')return;
  if(event.currentTarget.dataset.generating==='1'){event.preventDefault();return;}
  event.currentTarget.dataset.generating='1';
  event.submitter.setAttribute('aria-disabled','true');
  const status=event.currentTarget.querySelector('[data-ai-content-status]');
  if(status)status.textContent='Génération en cours… Votre saisie reste dans ce formulaire.';
});
document.querySelectorAll('[data-create-add]').forEach(button=>{
  button.addEventListener('click',()=>{
    const target=button.dataset.createAdd;
    const container=document.querySelector('[data-create-rows="'+target+'"]');
    if(!container)return;
    const rows=container.querySelectorAll('[data-create-row]');
    if(!rows.length||rows.length>=25)return;
    const clone=rows[rows.length-1].cloneNode(true);
    const ids=[...container.querySelectorAll('textarea[name]')]
      .map(el=>el.name.match(/\[(\d+)\]\[/))
      .filter(Boolean).map(m=>Number(m[1]));
    const next=Math.max(-1,...ids)+1;
    clone.querySelectorAll('textarea').forEach(el=>{
      el.name=el.name.replace(/\[\d+\]\[/,'['+next+'][');
      el.value='';
    });
    clone.querySelector('strong').textContent='Nouvel élément';
    clone.open=true;studioDirty=true;
    container.append(clone);
  });
});
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-create-remove]');
  if(!button)return;
  const row=button.closest('[data-create-row]');
  const group=row?.parentElement;
  if(!row||!group)return;
  studioDirty=true;
  if(group.querySelectorAll('[data-create-row]').length>1)row.remove();
  else row.querySelectorAll('textarea').forEach(el=>{el.value='';});
});
</script>
</main></body></html>
