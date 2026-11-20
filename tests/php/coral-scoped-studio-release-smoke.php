<?php
declare(strict_types=1);
require __DIR__.'/../../public/gestion-contenus/coral-scoped-studio-release.php';
function cmsCreationDir(string $p): string {return $p.'/drafts';}
function cmsCreationRead(string $p,string $id): ?array {
    return $GLOBALS['current_record']??null;
}
function cmsCoralRealSpeechReleaseIntent(
 string $p,array $r,string $job,array $settings,array $catalog,
 array $canonical,array $guided
): array {
    if($GLOBALS['revoked']??false)throw new RuntimeException('REVOKED');
    return $GLOBALS['approved_intent'];
}
function cmsCoralRealSpeechObserve(
 string $p,string $id,string $job,array $settings,array $catalog,
 array $canonical,array $guided
): array {
    return $GLOBALS['worker_state'];
}
function cmsCoralAstroReviewCurrent(
 string $p,array $r,array $m,array $catalog,array $canonical,array $guided
): ?array {
    return ($GLOBALS['revoked']??false)?null:$GLOBALS['review_profile'];
}
function assertPublish(bool $pass,string $why): void {
    if(!$pass)throw new RuntimeException('FAIL_'.$why);
}
function denyPublish(callable $fn,string $why): void {
    try{$fn();}catch(RuntimeException|InvalidArgumentException $e){return;}
    throw new RuntimeException('FAIL_OPEN_'.$why);
}
function removePublishDir(string $root): void {
    if(!is_dir($root))return;
    foreach(scandir($root)?:[] as $name){
        if($name==='.'||$name==='..')continue;
        $file=$root.'/'.$name;
        if(is_dir($file)&&!is_link($file))removePublishDir($file);
        else unlink($file);
    }
    rmdir($root);
}
$root=sys_get_temp_dir().'/coral-studio-publish-'.bin2hex(random_bytes(8));
$private=$root.'/private';$web=$root.'/public';
mkdir($root,0700);mkdir($private,0700);mkdir($web,0700);
$job=str_repeat('b',48);$id='c-'.str_repeat('c',24);
$mp3='ID3'.str_repeat('S',4096);$audioSha=hash('sha256',$mp3);
$slug='fresh-workshop';$recipe='test-recipe';
$audio='audio/workshops/atelier-pratique-'.$slug.'/atelier-coral-'.substr($audioSha,0,12).'.mp3';
$paths=[$audio,'apprendre/pratique/'.$slug.'/index.html',
 'recettes/'.$recipe.'/index.html','apprendre/index.html','sitemap.xml'];
$publicUrl='/apprendre/pratique/'.$slug.'/';
$data=[
 $audio=>$mp3,
 $paths[1]=>'<html><audio src="/'.$audio.'"></audio><a href="/recettes/'.$recipe.'/">Recette</a></html>',
 $paths[2]=>'<html><a href="'.$publicUrl.'">Voir</a></html>',
 $paths[3]=>'<html><a href="'.$publicUrl.'">Voir</a></html>',
 $paths[4]=>'<loc>https://www.cuisine-du-cambodge.com'.$publicUrl.'</loc>'
];
foreach(array_slice($paths,2) as $p){
 $file=$web.'/'.$p; if(!is_dir(dirname($file)))mkdir(dirname($file),0700,true);
 file_put_contents($file,'OLD '.basename($p));
}
$baseline=[];
foreach(array_slice($paths,2) as $path)$baseline[$path]=hash_file('sha256',$web.'/'.$path);
$manifest=['contract'=>'cdc-coral-scoped-astro-bundle-v1','baseSha256'=>$baseline,
 'creationId'=>$id,'creationVersion'=>3,'requestId'=>$job,
 'recipeSlug'=>$recipe,'publicSlug'=>$slug,'audioSha256'=>$audioSha,
 'sourceCommit'=>str_repeat('a',40),'sourceCommitVerified'=>true,
 'nativeBlueprintVerified'=>true,'mediaRightsVerified'=>true,
 'mediaImageSha256'=>str_repeat('d',64),
 'bindingSha256'=>str_repeat('e',64),
 'builderContract'=>'cdc-coral-private-verified-astro-builder-v1',
 'deployable'=>false,'published'=>false,
 'files'=>array_map(static fn($p)=>['path'=>$p,'bytes'=>strlen($data[$p]),
  'sha256'=>hash('sha256',$data[$p]),'action'=>'add-or-scoped-replace'],$paths)];
$cfg=['coral_scoped_publish_enabled'=>true,'coral_scoped_staging_enabled'=>true,
 'coral_scoped_restore_qualified'=>true,
 'coral_scoped_source_commit'=>str_repeat('a',40)];
$current=['id'=>$id,'version'=>3,'kind'=>'atelier'];
$GLOBALS['current_record']=$current;
$GLOBALS['approved_intent']=['creation_id'=>$id,'creation_version'=>3,
 'request_id'=>$job,'binding_sha256'=>$manifest['bindingSha256'],
 'mp3_sha256'=>$audioSha,'recipe_slug'=>$recipe,'candidate_public_slug'=>$slug];
$GLOBALS['worker_state']=['status'=>'succeeded','release_staged'=>true,
 'build_inputs_staged'=>true,'manifest'=>['sha256'=>$audioSha]];
$GLOBALS['review_profile']=['visualSha256'=>$manifest['mediaImageSha256']];
try{
 assertPublish(!cmsCoralStudioPublishEnabled([]),'DEFAULT_NO_PUBLISH');
 assertPublish(cmsCoralStudioPublishEnabled($cfg),'EXPLICIT_FLAGS');
 assertPublish(cmsCoralStudioPublishAssert(
  $private,$current,$job,$manifest,$cfg,[],[],[],[]),'CURRENT_APPROVAL');
 $bad=$manifest;$bad['mediaImageSha256']=str_repeat('f',64);
 assertPublish(!cmsCoralStudioPublishAssert(
  $private,$current,$job,$bad,$cfg,[],[],[],[]),'IMAGE_SHA_GATE');
 $bad=$manifest;$bad['sourceCommit']=str_repeat('f',40);
 assertPublish(!cmsCoralStudioPublishAssert(
  $private,$current,$job,$bad,$cfg,[],[],[],[]),'SOURCE_COMMIT_GATE');
 $GLOBALS['revoked']=true;
 denyPublish(fn()=>cmsCoralStudioPublish(
   $private,$web,$current,$job,true,true,$cfg,[],[],[],[]),'NO_BUNDLE_OR_REVOKED');
 assertPublish(!cmsCoralStudioPublishAssert(
  $private,$current,$job,$manifest,$cfg,[],[],[],[]),'REVOKED');
 $GLOBALS['revoked']=false;
 // Build a legitimate staged bundle through the same bounded intake.
 $base=['contract'=>'cdc-coral-ovh-staging-v1','requestId'=>$job];
 cmsCoralStageOperation($private,$web,$base+['op'=>'begin','manifest'=>$manifest]);
 foreach($data as $path=>$content){
  $packet=$base+['op'=>'append','path'=>$path,'offset'=>0,
   'payloadB64'=>base64_encode($content),
   'chunkSha256'=>hash('sha256',$content)];
  cmsCoralStageOperation($private,$web,$packet);
 }
 cmsCoralStageOperation($private,$web,$base+['op'=>'seal']);
 $GLOBALS['revoked']=true;
 denyPublish(fn()=>cmsCoralStudioPublish(
   $private,$web,$current,$job,true,true,$cfg,[],[],[],[]),'REVOKED_BEFORE_WRITE');
 foreach(array_slice($paths,2) as $path)
   assertPublish(file_get_contents($web.'/'.$path)==='OLD '.basename($path),
     'REVOCATION_PRESERVES_EXISTING');
 $GLOBALS['revoked']=false;
 denyPublish(fn()=>cmsCoralStudioPublish(
   $private,$web,$current,$job,false,true,$cfg,[],[],[],[]),'NO_SESSION');
 denyPublish(fn()=>cmsCoralStudioPublish(
   $private,$web,$current,$job,true,false,$cfg,[],[],[],[]),'NO_CONFIRMATION');
 $receipt=cmsCoralStudioPublish(
   $private,$web,$current,$job,true,true,$cfg,[],[],[],[]);
 assertPublish($receipt['fileCount']===5,'SCOPE');
 foreach($data as $path=>$content)
   assertPublish(file_get_contents($web.'/'.$path)===$content,'FIVE_FILES_ONLY');
 assertPublish(is_file($receipt['backupDir'].'/before-write.json'),'BACKUP');
 assertPublish($receipt['httpReceptionVerified']===false,'LIVE_HTTP_NOT_PRETENDED');
 $restoreConfig=['coral_scoped_restore_qualified'=>true];
 $panel=cmsCoralStudioRestorePanel($private,$current,'csrf-fixture',$restoreConfig);
 assertPublish(str_contains($panel,'Restaurer la version précédente'),'COMMITTED_RESTORE_PANEL');
 denyPublish(fn()=>cmsCoralStudioRecover(
  $private,$web,$job,'c-'.str_repeat('f',24),true,true,$restoreConfig),'WRONG_CREATION');
 $restored=cmsCoralStudioRecover(
  $private,$web,$job,$current['id'],true,true,$restoreConfig);
 assertPublish(($restored['restored']??false)===true,'COMMITTED_RESTORE');
 foreach($baseline as $path=>$sha)
  assertPublish(hash_file('sha256',$web.'/'.$path)===$sha,'RESTORED_SHA');
 assertPublish(!file_exists($web.'/'.$paths[0])&&!file_exists($web.'/'.$paths[1]),'RESTORED_ADDITIONS');
 denyPublish(fn()=>cmsCoralStudioPublish(
   $private,$web,$current,$job,true,true,$cfg,[],[],[],[]),'NO_REPLAY');
 echo "CORAL_STUDIO_SCOPED_PUBLISH_OFFLINE_PASS\n";
} finally {removePublishDir($root);}
