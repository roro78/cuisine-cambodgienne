<?php
declare(strict_types=1);
// Synthetic loopback fixture only. No live sessions, credentials or providers.
$base=realpath($argv[1]??'');$dist=realpath($argv[2]??'');
if(!is_string($base)||!is_string($dist)||!str_starts_with(basename($base),'cdc-studio-browser-'))
    throw new RuntimeException('FIXTURE_PATH');
$repo=dirname(__DIR__,3);$public=$base.'/site/public/gestion-contenus';
mkdir($public,0700,true);mkdir($base.'/sessions',0700);
$private=$base.'/.cuisine-asset-portal';mkdir($private,0700);
foreach(['social-feed.json','editorial-source-index.json','editorial-guided-fields.json'] as $name)
    copy($dist.'/'.$name,$base.'/'.$name);
foreach(['index.php','publication-gap-audit.php'] as $name)
    copy($repo.'/public/gestion-contenus/'.$name,$public.'/'.$name);
$lib=file_get_contents($repo.'/public/gestion-contenus/lib.php');
foreach(['cmsGetFeed','cmsGetEditorialIndex','cmsGetGuidedFields'] as $fn)
    $lib=str_replace('function '.$fn.'(','function fixtureOriginal'.$fn.'(',$lib);
// Windows cannot model POSIX permission bits. Linux CI exercises real 0700/0600
// checks; the Windows-only temporary copy permits UI testing, not permission proof.
if(PHP_OS_FAMILY==='Windows'){
    $lib=str_replace('fileperms(','studioFixturePermissions(',$lib);
    $lib.="\nfunction studioFixturePermissions(string \$p):int{return fileperms(\$p)&~0077;}\n";
}
file_put_contents($public.'/lib.php',$lib);
require_once $public.'/lib.php';
$catalog=cmsSourceList(json_decode(file_get_contents($base.'/social-feed.json'),true));
$canonical=cmsCanonicalSourceList(json_decode(file_get_contents($base.'/editorial-source-index.json'),true),$catalog);
$guided=cmsGuidedSourceList(json_decode(file_get_contents($base.'/editorial-guided-fields.json'),true),$canonical);
$workshop=null;
foreach($catalog as $id=>$source){
    if($source['kind']==='atelier'&&str_contains($id,'bai-sach-chrouk')){$workshop=$source;break;}
}
if($workshop===null)throw new RuntimeException('FIXTURE_WORKSHOP');
$id=$workshop['id'];
cmsSave($private,$workshop,['title'=>$workshop['title'],'summary'=>$workshop['summary'],
    'editorial_text'=>'PRIVATE_HISTORY_ONLY','editor_note'=>'Version historique à conserver',
    'state'=>'draft','structure_json'=>json_encode(['schema_version'=>1]+$guided[$id]['fields'],JSON_THROW_ON_ERROR)],
    0,$workshop['fingerprint'],$canonical[$id],$canonical[$id]['fingerprint']);
cmsCreationSave($private,['kind'=>'recette','title'=>'Projet synthétique de calendrier pour tests',
    'angle'=>'Test de calendrier privé','summary'=>'Essai local','fields'=>[],'state'=>'draft'],$catalog,0);
file_put_contents($private.'/config.php','<?php return '.var_export([
    'admin_user'=>'fixture-admin','password_hash'=>password_hash('synthetic-login-only',PASSWORD_DEFAULT)
],true).';');chmod($private.'/config.php',0600);
$router= <<<'PHP'
<?php
$_SERVER['HTTPS']='on';
session_save_path(__DIR__.'/sessions');
function cmsGetFeed():?array{return json_decode(file_get_contents(__DIR__.'/social-feed.json'),true);}
function cmsGetEditorialIndex():?array{return json_decode(file_get_contents(__DIR__.'/editorial-source-index.json'),true);}
function cmsGetGuidedFields():?array{return json_decode(file_get_contents(__DIR__.'/editorial-guided-fields.json'),true);}
require __DIR__.'/site/public/gestion-contenus/index.php';
PHP;
file_put_contents($base.'/router.php',$router);
echo json_encode(['id'=>$id,'legacy'=>cmsDraftDir($private).'/'.cmsKey($id).'.0001.json',
    'categories'=>array_map(static fn(string $kind):string=>array_values(array_filter(
        array_keys($catalog),static fn(string $id):bool=>str_starts_with($id,$kind.':')))[0],
        ['recette','culture','ingredient','technique'])],JSON_THROW_ON_ERROR);
