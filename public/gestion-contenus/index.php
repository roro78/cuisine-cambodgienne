<?php
declare(strict_types=1);
/** Private editorial CMS P0: preview and immutable drafts only, no publishing. */
require_once __DIR__.'/lib.php';
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
$newMode=isset($_GET['new']) || ($method==='POST' && isset($_POST['create_save']));
$createKind=is_string($_POST['kind']??null)?$_POST['kind']:
    (is_string($_GET['kind']??null)?$_GET['kind']:'recette');
if(!isset(cmsCreationKinds()[$createKind]))$createKind='recette';
$createForm=[];$creation=null;$creations=[];$createVersion=null;
$calendarMode=!$newMode && isset($_GET['calendar']);
$calendarMonth=gmdate('Y-m');$calendarKind='all';$calendarStatus='all';
$calendarPlan=null;$calendarPrev='';$calendarNext='';$calendarError='';
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
    $calendarStatus=in_array($_GET['calendar_status']??'all',
        ['all','draft','review'],true)?$_GET['calendar_status']:'all';
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
                }
            }
            error_log('[CDC_CMS_CALENDAR] '.$calendarError.' '
                .($e instanceof UnexpectedValueException?'unexpected_value':
                  ($e instanceof Error?'php_error':'calendar_error')));
            http_response_code(503);
        }
    }
    if($newMode){
        $cid=cmsCreationId($_POST['creation_id']??($_GET['cid']??null));
        if($cid!==null){
            if(!isset($creations[$cid])){http_response_code(404);$error='Brouillon de création introuvable.';}
            else{$creation=$creations[$cid];$createKind=$creation['kind'];}
        }
        $createForm=$creation??[];
        if($method==='POST' && isset($_POST['create_save'])){
            $expected=filter_var($_POST['expected_version']??null,FILTER_VALIDATE_INT,
                ['options'=>['min_range'=>0,'max_range'=>9998]]);
            if($expected===false){http_response_code(422);$error='Version invalide.';}
            else{
                try{
                    $posted=[
                        'kind'=>$_POST['kind']??null,
                        'title'=>$_POST['title']??null,
                        'angle'=>$_POST['angle']??null,
                        'summary'=>$_POST['summary']??null,
                        'research_note'=>$_POST['research_note']??null,
                        'target_date'=>$_POST['target_date']??null,
                        'state'=>$_POST['state']??null,
                        'fields'=>$_POST['fields']??null
                    ];
                    $saved=cmsCreationSave($private,$posted,$catalog,$expected,$cid);
                    header('Location: ?new=1&cid='.rawurlencode($saved['id'])
                        .'&saved_new=1',true,303);
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
                    $error='Brouillon non enregistré : version dépassée ou stockage indisponible. Rechargez la fiche.';
                    $createForm=$posted;
                }
            }
        }
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
            $requested=filter_var($_GET['revision']??null,FILTER_VALIDATE_INT,
                ['options'=>['min_range'=>1,'max_range'=>9999]]);
            $display=($requested!==false && in_array($requested,$versions,true))
                ? cmsReadVersion($dir,$selected['id'],$requested):$latest;
        }catch(Throwable $e){cmsUnavailable();}
    }
}
$kindLabels=['recette'=>'Recette','culture'=>'Carnet','atelier'=>'Atelier',
    'ingredient'=>'Ingrédient','technique'=>'Technique'];
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
.guided-group{border:1px solid #d9ddd5;border-radius:10px;padding:12px;margin:10px 0;background:#fcfcf9}
.guided-group summary{font-weight:700;cursor:pointer;padding:5px 0;color:#17663b}.guided-group[open] summary{margin-bottom:12px}
.guided-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.guided-wide{grid-column:1/-1}
.guided-row textarea{min-height:85px}.title-editor{min-height:74px}
.editorial-note{margin:0}.editorial-note summary{font-size:.93rem}
.preview-text{white-space:pre-wrap;overflow-wrap:anywhere}.guided-collection{padding:8px 0}.guided-row-fields{padding:6px}.guided-collection .guided-collection{padding-left:10px;border-left:2px solid #e3e8dc}
.guided-nav{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
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
<p><a href="?">Retour à la bibliothèque</a></p>
<section>
<span class="badge">Création privée · aucune publication</span>
<h2><?= $creation?'Modifier le brouillon de nouvelle page':'Créer un nouveau contenu' ?></h2>
<p class="small muted">Même Studio pour les cinq familles, sans JSON. Choisissez les champs
propres à la rubrique et sauvegardez : rien ne sera publié sur le site ni sur les réseaux.
Le bouton IA remplira ce même formulaire dans une phase ultérieure.</p>
<?php if(!$creation): ?>
<nav class="new-actions" aria-label="Catégorie de la nouvelle page">
<?php foreach(cmsCreationKinds() as $value=>$label): ?>
<a href="?new=1&amp;kind=<?= cmsEsc($value) ?>"
 <?= $createKind===$value?'aria-current="page"':'' ?>><?= cmsEsc($label) ?></a>
<?php endforeach; ?>
</nav>
<?php endif; ?>
<form method="post" class="stack" id="cms-new-editor">
<input type="hidden" name="csrf" value="<?= cmsEsc($_SESSION['csrf']) ?>">
<input type="hidden" name="creation_id" value="<?= cmsEsc($creation['id']??'') ?>">
<input type="hidden" name="expected_version" value="<?= (int)($creation['version']??0) ?>">
<input type="hidden" name="kind" value="<?= cmsEsc($createKind) ?>">
<label>Catégorie<input value="<?= cmsEsc(cmsCreationKinds()[$createKind]) ?>" disabled></label>
<label>Titre de la nouvelle page<textarea name="title" rows="2" maxlength="180" required><?= cmsEsc((string)($createForm['title']??'')) ?></textarea></label>
<label>Angle éditorial — en quoi ce contenu est-il différent ?
<textarea name="angle" rows="3" maxlength="700" required><?= cmsEsc((string)($createForm['angle']??'')) ?></textarea></label>
<label>Résumé<textarea name="summary" rows="3" maxlength="2000"><?= cmsEsc((string)($createForm['summary']??'')) ?></textarea></label>
<div class="create-meta small">Les sujets identiques aux pages ou brouillons existants
de la même catégorie sont refusés. Les sujets proches sont signalés pour relecture.
Un Carnet culturel peut traiter l'histoire d'un plat sans répéter sa recette.</div>
<h3>Contenu de la fiche — <?= cmsEsc(cmsCreationKinds()[$createKind]) ?></h3>
<?= cmsCreationFormHtml($createKind,
    is_array($createForm['fields']??null)?$createForm['fields']:[]) ?>
<label>Notes de recherche privées (jamais publiées)
<textarea name="research_note" rows="3" maxlength="3000"><?= cmsEsc((string)($createForm['research_note']??'')) ?></textarea></label>
<label>Date cible du calendrier éditorial (facultative)
<input type="date" name="target_date" value="<?= cmsEsc((string)($createForm['target_date']??'')) ?>"></label>
<label>Statut<select name="state">
<option value="draft"<?= ($createForm['state']??'draft')==='draft'?' selected':'' ?>>Brouillon de travail</option>
<option value="review"<?= ($createForm['state']??'draft')==='review'?' selected':'' ?>>Soumettre à relecture (non publié)</option>
</select></label>
<button name="create_save" value="1">Enregistrer une nouvelle version privée</button>
</form></section>
<?php if($creation): ?>
<section id="cms-preview">
<h2>Aperçu de la création</h2>
<?php if(isset($_GET['saved_new'])): ?>
<p role="status" class="notice">Nouvelle version privée enregistrée.</p>
<?php endif; ?>
<p class="small muted">Version <?= (int)$creation['version'] ?> ·
<?= cmsEsc($creation['recorded_at']) ?> ·
<?= $creation['state']==='review'?'Prêt pour relecture':'Brouillon' ?>
· <?= cmsEsc($creation['origin']) ?> · cible : <?= cmsEsc((string)($creation['target_date']??'non définie')) ?></p>
<h3><?= cmsEsc($creation['title']) ?></h3>
<p><?= cmsEsc($creation['summary']) ?></p>
<p><strong>Angle :</strong> <?= cmsEsc($creation['angle']) ?></p>
<?= cmsGuidedPreviewHtml('fiche',$creation['fields']) ?>
<?php if($creation['similar_titles']): ?>
<div class="note"><strong>Sujets proches à examiner :</strong>
<?php foreach($creation['similar_titles'] as $match): ?>
<p><?= cmsEsc($match['title']) ?></p><?php endforeach; ?></div>
<?php endif; ?>
<?php if($createVersion): ?>
<h3>Version historique <?= (int)$createVersion['version'] ?></h3>
<p><?= cmsEsc($createVersion['title']) ?> — <?= cmsEsc($createVersion['recorded_at']) ?></p>
<?= cmsGuidedPreviewHtml('fiche',$createVersion['fields']) ?>
<?php endif; ?>
<h3>Historique privé</h3><nav class="versions">
<?php foreach(cmsCreationVersions($creationDir,$creation['id']) as $v): ?>
<a href="?new=1&amp;cid=<?= cmsEsc($creation['id']) ?>&amp;revision=<?= (int)$v ?>">Version <?= (int)$v ?></a>
<?php endforeach; ?></nav>
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
<section><span class="badge"><?= cmsEsc($kindLabels[$selected['kind']]??'Contenu') ?></span>
<h2><?= cmsEsc($selected['title']) ?></h2>
<p class="small muted">Identifiant stable : <?= cmsEsc($selected['id']) ?> · Empreinte de la source :
<code><?= cmsEsc($selected['fingerprint']) ?></code></p>
<p class="summary"><strong>Présentation actuellement utilisée par le catalogue social :</strong>
<?= cmsEsc($selected['summary']) ?></p></section>
<nav class="editor-shortcuts" aria-label="Accès rapide à l'édition">
<a href="#cms-fields">Champs de la fiche</a>
<a href="#cms-save">Enregistrer</a>
<a href="#cms-preview">Dernier brouillon</a>
</nav>
<div class="grid">
<section>
<h2><?= $latest?'Modifier la proposition (version '.(int)$latest['version'].')':'Créer une proposition' ?></h2>
<p class="small muted">Modifiez les champs de cette fiche ci-dessous. Chaque enregistrement crée
un brouillon privé : il ne modifie pas la page publiée, les médias ni les MP3.</p>
<?php if(!$selectedCanonical): ?>
<p class="note" role="status">L'index des versions complètes Astro n'est pas disponible sur ce serveur.
Vous pouvez préparer le texte d'une proposition, mais les changements structurés restent
bloqués jusqu'à la mise en place et la vérification de cet index.</p>
<?php else: ?>
<p class="small muted">Version complète Astro protégée :
<code><?= cmsEsc(substr($selectedCanonical['fingerprint'],0,16)) ?></code>
(<?= cmsEsc($selectedCanonical['model']) ?>).
Toute modification de la fiche d'origine exige une nouvelle revue.</p>
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
<form method="post" class="stack" id="cms-fields">
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
<div id="cms-save" class="actions"><button name="save" value="1"<?= $staleDraft?' disabled':'' ?>>Enregistrer une nouvelle version</button></div>
</form>
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
<?php if($versions): ?><h3>Historique immuable</h3><nav class="versions" aria-label="Versions du brouillon">
<?php foreach($versions as $v): ?>
<a href="?id=<?= rawurlencode($selected['id']) ?>&amp;revision=<?= (int)$v ?>">Version <?= (int)$v ?></a>
<?php endforeach; ?></nav>
<p class="small muted">Les anciennes versions restent consultables ; seule une nouvelle sauvegarde crée une version.</p><?php endif; ?>
</section>
</div>
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
<?php if(!hash_equals($prev['source_fingerprint'],$src['fingerprint'])): ?>
<p class="small note">Source actualisée depuis le brouillon : relecture nécessaire.</p>
<?php endif; ?>
<?php endif; ?>
<a href="?id=<?= rawurlencode($src['id']) ?>&amp;<?= cmsEsc($filtersUrl) ?>"><?= $prev?'Voir et modifier le brouillon':'Préparer un brouillon' ?></a>
</div></article>
<?php endforeach; ?>
</div>
<?php if(!$shown): ?><p>Aucun contenu trouvé.</p><?php endif; ?>
</section>
<?php endif; ?>
<?php endif; ?>
<script nonce="<?= cmsEsc($nonce) ?>">
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
    clone.querySelector('strong').textContent='Élément '+(next+1);
    container.append(clone);
  });
});
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-create-remove]');
  if(!button)return;
  const row=button.closest('[data-create-row]');
  const group=row?.parentElement;
  if(!row||!group)return;
  if(group.querySelectorAll('[data-create-row]').length>1)row.remove();
  else row.querySelectorAll('textarea').forEach(el=>{el.value='';});
});
</script>
</main></body></html>
