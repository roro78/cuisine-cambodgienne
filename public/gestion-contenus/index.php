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
header("Content-Security-Policy: default-src 'none'; style-src 'nonce-{$nonce}'; img-src https://www.cuisine-du-cambodge.com; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
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
$catalog=[];$dir='';$selected=null;$latest=null;$versions=[];$display=null;$latestById=[];$staleDraft=false;
$kind=(string)($_GET['kind']??'all');
if(!in_array($kind,['all','recette','culture','atelier','ingredient','technique'],true))$kind='all';
$q=is_string($_GET['q']??null)?trim($_GET['q']):'';
if(mbLen($q)>80 || preg_match('/[\x00-\x1f\x7f]/',$q) || !preg_match('//u',$q))$q='';
if($auth){
    try{
        $data=cmsGetFeed();
        if($data===null)throw new RuntimeException('CATALOG_UNAVAILABLE');
        $catalog=cmsSourceList($data);
        $dir=cmsDraftDir($private);
    }catch(Throwable $e){cmsUnavailable();}
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
    if($method==='POST' && isset($_POST['save'])){
        if(!$selected){http_response_code(422);$error='Contenu inexistant dans le catalogue.';}
        else {
            $expected=filter_var($_POST['expected_version']??null,FILTER_VALIDATE_INT,
                ['options'=>['min_range'=>0,'max_range'=>9998]]);
            if($expected===false){http_response_code(422);$error='Version du brouillon invalide.';}
            else {
                try{
                    cmsSave($private,$selected,[
                        'title'=>$_POST['title']??null,
                        'summary'=>$_POST['summary']??null,
                        'editorial_text'=>$_POST['editorial_text']??null,
                        'editor_note'=>$_POST['editor_note']??null,
                        'state'=>$_POST['state']??null
                    ],$expected,(string)($_POST['source_fingerprint']??''));
                    header('Location: ?id='.rawurlencode($id).'&saved=1',true,303);exit;
                }catch(InvalidArgumentException $e){
                    http_response_code(422);$error='Champs manquants ou trop longs.';
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
$shown=[];
if($auth){
    foreach($catalog as $src){
        if($kind!=='all' && $src['kind']!==$kind)continue;
        if($q!==''){
            $hay=$src['title'].' '.$src['id'];
            if(function_exists('mb_stripos')){
                if(mb_stripos($hay,$q,0,'UTF-8')===false)continue;
            }elseif(stripos($hay,$q)===false)continue;
        }
        $shown[]=$src;
    }
}
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
<?php if($selected): ?>
<p><a href="?">Retour à la bibliothèque</a> · <a href="<?= cmsEsc($selected['url']) ?>" target="_blank"
 rel="noopener noreferrer">Consulter la page actuellement publiée</a></p>
<section><span class="badge"><?= cmsEsc($kindLabels[$selected['kind']]??'Contenu') ?></span>
<h2><?= cmsEsc($selected['title']) ?></h2>
<p class="small muted">Identifiant stable : <?= cmsEsc($selected['id']) ?> · Empreinte de la source :
<code><?= cmsEsc($selected['fingerprint']) ?></code></p>
<p class="summary"><strong>Présentation actuellement utilisée par le catalogue social :</strong>
<?= cmsEsc($selected['summary']) ?></p></section>
<div class="grid">
<section>
<h2><?= $latest?'Modifier la proposition (version '.(int)$latest['version'].')':'Créer une proposition' ?></h2>
<p class="small muted">Texte proposé uniquement : les données complètes d'Astro, les ingrédients,
les étapes culinaires et les MP3 ne seront pas remplacés par cette saisie.</p>
<?php if($staleDraft): ?><p class="note" role="alert">
La page d'origine a changé depuis cette proposition. Nouvelle sauvegarde bloquée pour éviter
d'écraser une version récente. Comparer la source et reprendre le travail après relecture.
</p><?php endif; ?>
<form method="post" class="stack">
<input type="hidden" name="csrf" value="<?= cmsEsc($_SESSION['csrf']) ?>">
<input type="hidden" name="source_id" value="<?= cmsEsc($selected['id']) ?>">
<input type="hidden" name="source_fingerprint" value="<?= cmsEsc($selected['fingerprint']) ?>">
<input type="hidden" name="expected_version" value="<?= $latest?(int)$latest['version']:0 ?>">
<label>Titre proposé<input name="title" required maxlength="180"
 value="<?= cmsEsc($latest['title']??$selected['title']) ?>"></label>
<label>Résumé proposé<textarea name="summary" maxlength="1500" rows="4"><?= cmsEsc($latest['summary']??$selected['summary']) ?></textarea></label>
<label>Texte éditorial proposé<textarea name="editorial_text" maxlength="12000" rows="12"
 placeholder="Préparer une proposition de réécriture, sans remplacer automatiquement la recette."><?= cmsEsc($latest['editorial_text']??'') ?></textarea></label>
<label>Note pour la relecture<textarea name="editor_note" maxlength="2000" rows="3"><?= cmsEsc($latest['editor_note']??'') ?></textarea></label>
<label>État privé du brouillon
<select name="state">
<option value="draft"<?= ($latest['state']??'draft')==='draft'?' selected':'' ?>>Brouillon de travail</option>
<option value="review"<?= ($latest['state']??'draft')==='review'?' selected':'' ?>>Prêt pour relecture (non publié)</option>
</select></label>
<div class="actions"><button name="save" value="1"<?= $staleDraft?' disabled':'' ?>>Enregistrer une nouvelle version</button></div>
</form>
</section>
<section><h2>Aperçu de la version enregistrée</h2>
<?php if(isset($_GET['saved'])): ?><p class="notice" role="status">Nouvelle version privée enregistrée.</p><?php endif; ?>
<?php if(!$display): ?><p class="muted">Aucune version enregistrée. Complète puis sauvegarde le formulaire.</p>
<?php else: ?>
<p class="small">Version <?= (int)$display['version'] ?> ·
<?= cmsEsc($display['recorded_at']) ?> ·
<?= $display['state']==='review'?'Prêt pour relecture':'Brouillon' ?></p>
<h3><?= cmsEsc($display['title']) ?></h3>
<p class="preview-text"><?= cmsEsc($display['summary']) ?></p>
<div class="preview-text"><?= cmsEsc($display['editorial_text']) ?></div>
<?php if($display['editor_note']!==''): ?>
<h3>Note de relecture</h3><p class="preview-text"><?= cmsEsc($display['editor_note']) ?></p>
<?php endif; ?>
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
<form method="get" class="toolbar">
<label>Catégorie<select name="kind">
<?php foreach(['all'=>'Toutes','recette'=>'Recettes','culture'=>'Carnets',
'atelier'=>'Ateliers','ingredient'=>'Ingrédients','technique'=>'Techniques'] as $value=>$label): ?>
<option value="<?= cmsEsc($value) ?>"<?= $kind===$value?' selected':'' ?>><?= cmsEsc($label) ?></option>
<?php endforeach; ?>
</select></label>
<label>Rechercher<input type="search" name="q" maxlength="80" value="<?= cmsEsc($q) ?>" placeholder="Ex. Amok"></label>
<button type="submit">Filtrer</button><a href="?">Effacer les filtres</a>
</form>
<p class="small" role="status"><?= count($shown) ?> résultat(s) sur <?= count($catalog) ?></p>
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
<a href="?id=<?= rawurlencode($src['id']) ?>"><?= $prev?'Voir et modifier le brouillon':'Préparer un brouillon' ?></a>
</div></article>
<?php endforeach; ?>
</div>
<?php if(!$shown): ?><p>Aucun contenu trouvé.</p><?php endif; ?>
</section>
<?php endif; ?>
<?php endif; ?>
</main></body></html>
