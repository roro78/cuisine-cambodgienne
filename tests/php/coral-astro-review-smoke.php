<?php
declare(strict_types=1);
/** Synthetic Studio human media/QA review; no provider or OVH call. */
$root=sys_get_temp_dir().'/cdc-astro-review-'.bin2hex(random_bytes(8));
$private=$root.'/private';$webroot=$root.'/public';
mkdir($private.'/creations',0700,true);
mkdir($webroot.'/images/cuisine',0700,true);
$image='/images/cuisine/atelier-example.webp';
file_put_contents($webroot.$image,str_repeat('WEBP',48));
$record=['id'=>'c-'.str_repeat('3',24),'version'=>4,'slug'=>'amok-trey','kind'=>'atelier'];
$request=['creation_id'=>$record['id'],'creation_version'=>4,
  'request_id'=>str_repeat('e',48),'binding_sha256'=>str_repeat('c',64)];
$manifest=['sha256'=>str_repeat('a',64)];
$authority=true;$listened=true;$listenSha=str_repeat('b',64);
function cmsCreationId(mixed $value): ?string {
 return is_string($value)&&preg_match('/^c-[a-f0-9]{24}$/D',$value)?$value:null;
}
function cmsCreationDir(string $private): string {return $private.'/creations';}
function mbLen(string $s): int {return mb_strlen($s);}
function cmsEsc(string $s): string {return htmlspecialchars($s,ENT_QUOTES,'UTF-8');}
$selectedVersion=null;
function cmsVisualDirectory(string $private,string $id): string {return $private.'/visuals/'.$id;}
function cmsVisualSelected(string $dir,array $record): ?int {return $GLOBALS['selectedVersion'];}
function cmsVisualAsset(string $dir,string $id,int $version,string $variant): array {
 // Synthetic WebP extended header. Production bytes are checked by cmsVisualAsset.
 $header='VP8X'.pack('V',10).str_repeat("\0",4).substr(pack('V',1199),0,3).substr(pack('V',799),0,3);
 return ['bytes'=>'RIFF'.pack('V',strlen($header)+4).'WEBP'.$header,'mime'=>'image/webp'];
}
function cmsCoralRealSpeechApprovedRequest($private,$record,$catalog,$canonical,$guided):array {
 global $request,$authority;
 if(!$authority)throw new RuntimeException('STUDIO_RIGHTS_REVOKED');
 return $request;
}
function cmsCoralRealSpeechListeningApproved($private,$record,$manifest,$catalog,$canonical,$guided):bool {
 global $listened,$authority;
 return $listened&&$authority;
}
function cmsCoralTtsJournal($dir,$id,$kind):array {
 global $listenSha;
 if($kind!=='real-listening')throw new RuntimeException('JOURNAL_KIND');
 return ['events'=>[],'last_hash'=>$listenSha];
}
function cmsCoralRealSpeechObserve($private,$id,$job,$settings,$catalog,$canonical,$guided):array {
 global $manifest;return ['status'=>'succeeded','manifest'=>$manifest];
}
function cmsCoralRealSpeechAudio($private,$id,$job,$settings,$catalog,$canonical,$guided):string {
 return 'ID3'.str_repeat('P',2045);
}
function cmsCoralTtsLocked($private,$id,callable $callback):mixed {
 global $record;return $callback(cmsCreationDir($private),$record);
}
function cmsCoralTtsWrite(string $filename,array $record):void {
 $bytes=json_encode($record,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
 $fp=fopen($filename,'x');
 if(!$fp)throw new RuntimeException('WRITE');
 fwrite($fp,$bytes);fclose($fp);
}
require __DIR__.'/../../public/gestion-contenus/coral-astro-review.php';
function ok(bool $x,string $name):void {if(!$x)throw new RuntimeException('TEST_'.$name);}
function refused(callable $call,string $name):void {
 try{$call();}catch(Throwable $e){return;}
 throw new RuntimeException('TEST_FAIL_OPEN_'.$name);
}
function clean(string $dir):void {
 foreach(scandir($dir)?:[] as $entry){
  if($entry==='.'||$entry==='..')continue;
  $path=$dir.'/'.$entry;if(is_dir($path)&&!is_link($path))clean($path);
  else unlink($path);
 }
 rmdir($dir);
}
try{
 $form=[
 'difficulty'=>'Intermédiaire',
 'safety'=>"Vérifier la température du poisson avant dégustation.\nNe pas toucher le panier vapeur brûlant.",
 'allergen_status'=>'declared','allergens'=>"Poisson\nNoix de coco",
 'finished_image'=>$image,
 'artwork_evidence'=>'Photographie inventée pour les tests : droit de réutilisation vérifié.',
 'device_mobile'=>'Test synthétique sur téléphone tactile : sept repères et pause vérifiés.',
 'device_desktop'=>'Test synthétique sur ordinateur : lecture et reprise vérifiées.',
 'culinary_evidence'=>'Contrôle fictif des ingrédients, quantités et températures du poisson.',
 'editorial_evidence'=>'Contrôle fictif des six étapes, narration et orthographe finale.',
 'checks'=>[
   'recipe'=>'1','editorial'=>'1','culinary'=>'1','image'=>'1','rights'=>'1',
   'audio'=>'1','mobile'=>'1','desktop'=>'1','owner'=>'1'
 ]
 ];
 $formHtml=cmsCoralAstroReviewPanel($private,$record,$request,$manifest,
      [],[],[],'synthetic-csrf','?new=1&amp;cid='.$record['id'],$webroot);
 ok(str_contains($formHtml,'name="astro_review_action"')
      &&str_contains($formHtml,'name="astro_review[finished_image]"')
      &&str_contains($formHtml,'name="astro_review[checks][mobile]"')
      &&str_contains($formHtml,'synthetic-csrf'),'REVIEW_FORM_RENDERED');
 $profile=cmsCoralAstroReviewProfile($record,$request,$manifest,$form,$webroot);
 ok($profile['contract']==='cdc-coral-studio-reviewed-blueprint-v1','CONTRACT');
 ok($profile['media']['finishedPreparationImage']===$image,'IMAGE');
 ok($profile['review']['mobileValidated']===true,'MOBILE');
 ok($profile['creationVersion']===4,'VERSION');
 ok(cmsCoralAstroReviewCurrent($private,$record,$manifest,[],[],[],$webroot)===null,'NOT_PREAPPROVED');
 $order=$form;$order['checks']=array_reverse($form['checks'],true);
 refused(fn()=>cmsCoralAstroReviewProfile($record,$request,$manifest,$order,$webroot),'CHECK_ORDER');
 $noRights=$form;unset($noRights['checks']['rights']);
 refused(fn()=>cmsCoralAstroReviewProfile($record,$request,$manifest,$noRights,$webroot),'RIGHTS');
 $noDevice=$form;$noDevice['device_mobile']='non fait';
 refused(fn()=>cmsCoralAstroReviewProfile($record,$request,$manifest,$noDevice,$webroot),'MOBILE_REQUIRED');
 $outside=$form;$outside['finished_image']='/images/cuisine/../../config.php';
 refused(fn()=>cmsCoralAstroReviewProfile($record,$request,$manifest,$outside,$webroot),'PATH_TRAVERSAL');
 $noAllergens=$form;$noAllergens['allergen_status']='none';
 refused(fn()=>cmsCoralAstroReviewProfile($record,$request,$manifest,$noAllergens,$webroot),'ALLERGEN_CONTRADICTION');
 $note='Validation synthétique par le propriétaire, non applicable à un vrai atelier.';
 $approved=cmsCoralAstroReviewAction($private,$record,$request['request_id'],'approve',
   $form,$note,true,true,[],[],[],[],$webroot);
 ok($approved['event']===1,'APPROVAL');
 ok(cmsCoralAstroReviewCurrent($private,$record,$manifest,[],[],[],$webroot)!==null,'CURRENT');
 $approvedHtml=cmsCoralAstroReviewPanel($private,$record,$request,$manifest,
       [],[],[],'synthetic-csrf','?new=1&amp;cid='.$record['id'],$webroot);
 ok(str_contains($approvedHtml,'data-astro-review-status="approved"')
      &&str_contains($approvedHtml,'astro_review_profile=')
      &&str_contains($approvedHtml,'value="revoke"')
      &&!str_contains($approvedHtml,'name="astro_review[finished_image]"'),
      'REVIEW_REVOKE_AND_PRIVATE_EXPORT_RENDERED');
 file_put_contents($webroot.$image,str_repeat('EDITED',32));
 ok(cmsCoralAstroReviewCurrent($private,$record,$manifest,[],[],[],$webroot)===null,
     'VISUAL_IMAGE_CONTENT_CHANGED');
 file_put_contents($webroot.$image,str_repeat('WEBP',48));
 ok(cmsCoralAstroReviewCurrent($private,$record,$manifest,[],[],[],$webroot)!==null,
     'SAME_IMAGE_RESTORED');
 refused(fn()=>cmsCoralAstroReviewAction($private,$record,$request['request_id'],'approve',
   $form,$note,true,true,[],[],[],[],$webroot),'DUPLICATE');
 ok(cmsCoralAstroReviewCurrent($private,$record,
   ['sha256'=>str_repeat('f',64)],[],[],[],$webroot)===null,'AUDIO_SHA_STALE');
 $stale=$record;$stale['version']=5;
 ok(cmsCoralAstroReviewCurrent($private,$stale,$manifest,[],[],[],$webroot)===null,'DRAFT_STALE');
 $listened=false;
 ok(cmsCoralAstroReviewCurrent($private,$record,$manifest,[],[],[],$webroot)===null,'AUDIO_REVOKED');
 $listened=true;$listenSha=str_repeat('d',64);
 ok(cmsCoralAstroReviewCurrent($private,$record,$manifest,[],[],[],$webroot)===null,'LISTENING_REAPPROVAL_REQUIRES_NEW_ASTRO_REVIEW');
 $listenSha=str_repeat('b',64);
 $authority=false;
 refused(fn()=>cmsCoralAstroReviewCurrent($private,$record,$manifest,[],[],[],$webroot),'SOURCE_REVOKED');
 $authority=true;
 $revoked=cmsCoralAstroReviewAction($private,$record,$request['request_id'],'revoke',
  [],$note,true,true,[],[],[],[],$webroot);
 ok($revoked['action']==='revoke','REVOCATION');
 ok(cmsCoralAstroReviewCurrent($private,$record,$manifest,[],[],[],$webroot)===null,'REVOKED');
 cmsCoralAstroReviewAction($private,$record,$request['request_id'],'approve',
   $form,$note,true,true,[],[],[],[],$webroot);
 ok(cmsCoralAstroReviewCurrent($private,$record,$manifest,[],[],[],$webroot)!==null,'REAPPROVED');
 cmsCoralAstroReviewAction($private,$record,$request['request_id'],'revoke',
   [],$note,true,true,[],[],[],[],$webroot);
 $privateForm=$form;$privateForm['image_source']='private';unset($privateForm['finished_image']);
 refused(fn()=>cmsCoralAstroReviewProfile($record,$request,$manifest,$privateForm,$webroot,$private),'NO_PRIVATE_SELECTION');
 $selectedVersion=2;
 $privateApproval=cmsCoralAstroReviewAction($private,$record,$request['request_id'],'approve',
   $privateForm,$note,true,true,[],[],[],[],$webroot);
 $profile=$privateApproval['profile'];
 ok($profile['privateVisualVersion']===2&&!file_exists($webroot.$profile['media']['finishedPreparationImage']),'STILL_PRIVATE');
 ok(cmsCoralAstroReviewCurrent($private,$record,$manifest,[],[],[],$webroot)===$profile,'PRIVATE_APPROVAL_VALID');
 $selectedVersion=3;
 ok(cmsCoralAstroReviewCurrent($private,$record,$manifest,[],[],[],$webroot)===null,'REPLACEMENT_REQUIRES_REAPPROVAL');
 $events=cmsCoralAstroReviewJournal(cmsCreationDir($private),$record['id'])['events'];
 ok(count($events)===5,'APPEND_ONLY');
 ok($events[1]['previous_event_sha256']===hash_file('sha256',
   cmsCreationDir($private).'/coral-astro-review-'.$record['id'].'.0001.json'),'CHAIN');
 file_put_contents(cmsCreationDir($private).'/coral-astro-review-'.$record['id'].'.0002.json','{}');
 refused(fn()=>cmsCoralAstroReviewCurrent($private,$record,$manifest,[],[],[],$webroot),'CORRUPT_EVENT');
 echo "CORAL_STUDIO_NATIVE_ASTRO_REVIEW_OFFLINE_PASS\n";
} finally{clean($root);}
