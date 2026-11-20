<?php
declare(strict_types=1);
/** Isolated, synthetic Coral MP3 listening journal; no server, money or real audio. */
$private=sys_get_temp_dir().'/cdc-real-listening-'.bin2hex(random_bytes(8));
$dir=$private.'/creations';
if(!mkdir($dir,0700,true))throw new RuntimeException('TEST_DIRECTORY');
$record=['id'=>'c-'.str_repeat('3',24),'version'=>4,'slug'=>'amok-trey','title'=>'Amok Trey'];
function cmsCreationId($id): ?string {
  return is_string($id)&&preg_match('/^c-[a-f0-9]{24}$/D',$id)?$id:null;
}
function cmsCreationDir($root): string {return $root.'/creations';}
function cmsCreationRead($folder,$id): ?array {
  global $record;return $record['id']===$id?$record:null;
}
function cmsCreationSlug(string $title): string {return $title==='Amok Trey'?'amok-trey':'unknown';}
function cmsCreationText($value,$max): string {
  if(!is_string($value)||mb_strlen($value)>$max)throw new InvalidArgumentException('TEXT');
  return trim($value);
}
function mbLen($value): int {return mb_strlen($value);}
function cmsAtelierCulinaryContext($r,$catalog,$canonical,$guided): array {
  // Fixed synthetic, verified recipe binding context for the genuine Coral
  // journal helper. Do not override cmsCoralTtsBinding itself.
  return ['recipe_sha256'=>str_repeat('d',64),'context'=>'fiction for offline tests'];
}
$rightsCurrent=true;
function cmsCoralRealSpeechApprovedRequest($root,$draft,$cat,$can,$guid): array {
  global $rightsCurrent,$record;
  if(!$rightsCurrent||$draft!==$record)throw new RuntimeException('RIGHTS_REVOKED_OR_STALE');
  return ['request_id'=>str_repeat('e',48)];
}
require __DIR__.'/../../public/gestion-contenus/coral-v2-ai.php';
require __DIR__.'/../../public/gestion-contenus/coral-real-speech-bridge.php';
function check($bool,$label): void {if(!$bool)throw new RuntimeException($label);}
function refused(callable $fn,$label): void {
  try{$fn();}catch(InvalidArgumentException|RuntimeException $e){return;}
  throw new RuntimeException('FAIL_OPEN_'.$label);
}
function cleanup($dir): void {
  foreach(glob($dir.'/*')?:[] as $path) {
    if(is_dir($path))cleanup($path);else unlink($path);
  }
  rmdir($dir);
}
try {
  $sha=str_repeat('a',64);
  $manifest=['sha256'=>$sha,'request_id'=>str_repeat('e',48)];
  $notes='Écoute synthétique complète : sept repères confirmés.';
  $checks=['full_listening'=>'1','chapter_order'=>'1'];
  check(!cmsCoralRealSpeechListeningApproved($private,$record,$manifest,[],[],[]),'UNAPPROVED');
  refused(static fn()=>cmsCoralTtsDecision($private,$record['id'],4,'real-listening','approve',
    ['chapter_order'=>'1','full_listening'=>'1'],$notes,true,true,[],[],[],$sha),'CHECK_ORDER');
  refused(static fn()=>cmsCoralTtsDecision($private,$record['id'],4,'real-listening','approve',
    $checks,'trop court',true,true,[],[],[],$sha),'NOTE_SHORT');
  refused(static fn()=>cmsCoralTtsDecision($private,$record['id'],4,'real-listening','approve',
    $checks,$notes,true,false,[],[],[],$sha),'AUTH_REQUIRED');
  $approved=cmsCoralTtsDecision($private,$record['id'],4,'real-listening','approve',
    $checks,$notes,true,true,[],[],[],$sha);
  check($approved['voice']==='coral'&&$approved['provider']==='openai-speech-coral-093-v1','HISTORICAL_PROFILE');
  check(cmsCoralRealSpeechListeningApproved($private,$record,$manifest,[],[],[]),'APPROVED');
  check(!cmsCoralRealSpeechListeningApproved($private,$record,
    ['sha256'=>$sha,'request_id'=>str_repeat('f',48)],[],[],[]),'OTHER_JOB');
  $rightsCurrent=false;
  check(!cmsCoralRealSpeechListeningApproved($private,$record,$manifest,[],[],[]),'RIGHTS_REVOKED');
  $rightsCurrent=true;
  check(!cmsCoralRealSpeechListeningApproved($private,$record,['sha256'=>str_repeat('b',64)],[],[],[]),'AUDIO_CHANGED');
  $stale=$record;$stale['version']=5;
  check(!cmsCoralRealSpeechListeningApproved($private,$stale,$manifest,[],[],[]),'VERSION_STALE');
  refused(static fn()=>cmsCoralTtsDecision($private,$record['id'],4,'real-listening','approve',
    $checks,$notes,true,true,[],[],[],$sha),'DUPLICATE');
  $revoked=cmsCoralTtsDecision($private,$record['id'],4,'real-listening','revoke',
    [],$notes,true,true,[],[],[],$sha);
  check($revoked['action']==='revoke','REVOKED_EVENT');
  check(!cmsCoralRealSpeechListeningApproved($private,$record,$manifest,[],[],[]),'REVOKED');
  $again=cmsCoralTtsDecision($private,$record['id'],4,'real-listening','approve',
    $checks,$notes,true,true,[],[],[],$sha);
  check($again['event']===3,'REAPPROVED_EVENT');
  $events=cmsCoralTtsJournal($dir,$record['id'],'real-listening')['events'];
  check(count($events)===3,'APPEND_ONLY');
  check($events[1]['previous_event_sha256']===hash_file('sha256',
    $dir.'/tts-real-listening-'.$record['id'].'.0001.json'),'CHAIN_HASH');
  // Public release has an independent, revocable human authorization.
  $releaseChecks=['reviewed_page'=>'1','audio_checksum'=>'1','publish_requested'=>'1'];
  $publicationArtifact=hash('sha256',$sha.'|'.cmsCoralTtsJournal(
    $dir,$record['id'],'real-listening')['last_hash']);
  $releaseNote='Publication synthétique : page et voix relues sans mise en ligne.';
  check(!cmsCoralRealSpeechPublicationApproved($private,$record,$manifest,[],[],[]),'NO_PUBLICATION_CONSENT');
  refused(static fn()=>cmsCoralTtsDecision($private,$record['id'],4,'real-publication','approve',
    ['audio_checksum'=>'1','reviewed_page'=>'1','publish_requested'=>'1'],
    $releaseNote,true,true,[],[],[],$publicationArtifact),'RELEASE_CHECK_ORDER');
  cmsCoralTtsDecision($private,$record['id'],4,'real-publication','approve',
    $releaseChecks,$releaseNote,true,true,[],[],[],$publicationArtifact);
  check(cmsCoralRealSpeechPublicationApproved($private,$record,$manifest,[],[],[]),'RELEASE_CONSENT');
  check(!cmsCoralRealSpeechPublicationApproved($private,$record,
    ['request_id'=>str_repeat('e',48),'sha256'=>str_repeat('b',64)],[],[],[]),'RELEASE_AUDIO_CHANGED');
  refused(static fn()=>cmsCoralTtsDecision($private,$record['id'],4,'real-publication','approve',
    $releaseChecks,$releaseNote,true,true,[],[],[],$publicationArtifact),'RELEASE_DOUBLE_CLICK');
  cmsCoralTtsDecision($private,$record['id'],4,'real-publication','revoke',
    [],$releaseNote,true,true,[],[],[],$publicationArtifact);
  check(!cmsCoralRealSpeechPublicationApproved($private,$record,$manifest,[],[],[]),'RELEASE_REVOKED');
  cmsCoralTtsDecision($private,$record['id'],4,'real-publication','approve',
    $releaseChecks,$releaseNote,true,true,[],[],[],$publicationArtifact);
  check(cmsCoralRealSpeechPublicationApproved($private,$record,$manifest,[],[],[]),'RELEASE_REAPPROVED');
  $rightsCurrent=false;
  check(!cmsCoralRealSpeechPublicationApproved($private,$record,$manifest,[],[],[]),'RELEASE_RIGHTS_REVOKED');
  $rightsCurrent=true;
  // Revoking full listening also invalidates independently approved publication.
  cmsCoralTtsDecision($private,$record['id'],4,'real-listening','revoke',
    [],$notes,true,true,[],[],[],$sha);
  check(!cmsCoralRealSpeechPublicationApproved($private,$record,$manifest,[],[],[]),'RELEASE_LISTENING_REVOKED');
  cmsCoralTtsDecision($private,$record['id'],4,'real-listening','approve',
    $checks,$notes,true,true,[],[],[],$sha);
  check(!cmsCoralRealSpeechPublicationApproved($private,$record,$manifest,[],[],[]),
    'OLD_RELEASE_MUST_NOT_RESURRECT_AFTER_LISTENING_REAPPROVAL');
  $newPublicationArtifact=hash('sha256',$sha.'|'.cmsCoralTtsJournal(
    $dir,$record['id'],'real-listening')['last_hash']);
  cmsCoralTtsDecision($private,$record['id'],4,'real-publication','approve',
    $releaseChecks,$releaseNote,true,true,[],[],[],$newPublicationArtifact);
  check(cmsCoralRealSpeechPublicationApproved($private,$record,$manifest,[],[],[]),
    'FRESH_RELEASE_APPROVAL_REQUIRED');
  // The release contract is strictly a no-text candidate; it cannot turn
  // a Studio approval into a live deploy authorization.
  $source=[
    'request_id'=>str_repeat('e',48),'creation_id'=>$record['id'],
    'creation_version'=>4,'binding_sha256'=>cmsCoralTtsBinding($record,[],[],[])['binding_sha256'],
    'recipe_sha256'=>str_repeat('c',64),
    'chapters'=>array_map(static fn($id)=>['id'=>$id,'text'=>str_repeat('private-text',20),
      'sha256'=>hash('sha256','synthetic-'.$id)],
      ['intro','installer','preparer','assembler','maitriser','rectifier','terminer'])
  ];
  $audioManifest=['sha256'=>$sha,'bytes'=>2048,'duration'=>70,
    'chapters'=>array_map(static fn($i,$id)=>['id'=>$id,'start'=>$i*10,'end'=>($i+1)*10],
      range(0,6),['intro','installer','preparer','assembler','maitriser','rectifier','terminer'])];
  $intent=cmsCoralRealSpeechReleaseEnvelope($source,$audioManifest,['recipeSlug'=>'amok-trey'],$record);
  check($intent['contract']==='cdc-coral-studio-release-intent-v1','RELEASE_CONTRACT');
  check($intent['candidate_public_slug']==='amok-trey'&&count($intent['chapters'])===7,'RELEASE_ROUTE');
  check($intent['publication_ready']===false&&$intent['deployment_triggered']===false,'NO_DEPLOY');
  check(!str_contains(json_encode($intent,JSON_THROW_ON_ERROR),'private-text'),'NO_TEXT_IN_RELEASE_INTENT');
  $wrongAudio=$audioManifest;$wrongAudio['chapters'][3]['id']='terminer';
  refused(static fn()=>cmsCoralRealSpeechReleaseEnvelope(
    $source,$wrongAudio,['recipeSlug'=>'amok-trey'],$record),'RELEASE_WRONG_CHAPTER');
  // Fail closed on a corrupt journal rather than falling back to a previous approval.
  file_put_contents($dir.'/tts-real-listening-'.$record['id'].'.0002.json','{}');
  refused(static fn()=>cmsCoralRealSpeechListeningApproved($private,$record,$manifest,[],[],[]),'CORRUPTED_CHAIN');
  echo "CORAL_REAL_LISTENING_OFFLINE_PASS\n";
} finally {
  cleanup($private);
}
