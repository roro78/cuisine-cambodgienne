<?php
declare(strict_types=1);
/** Pure fake private Studio evidence; no production data, network or OpenAI. */
$phaseIds=['intro','installer','preparer','assembler','maitriser','rectifier','terminer'];
$chapters=[];foreach($phaseIds as $i=>$id){
  $chapters[]=['id'=>$id,'text'=>str_repeat('Texte fictif sur un plat, jamais publié. ',14)];
}
$record=['id'=>'c-'.str_repeat('1',24),'version'=>4,
  'atelier_scripts'=>['chapters'=>$chapters]];
$ready=['text_visas_count'=>7,'culinary_review_current'=>true,
  'final_review_current'=>true,'rights_current'=>true,'voice'=>'coral',
  'provider'=>'openai-speech-coral-093-v1'];
$binding=['binding_sha256'=>str_repeat('a',64),'recipe_sha256'=>str_repeat('b',64)];
$rightEvent=['action'=>'approve','creation_version'=>4,'binding_sha256'=>$binding['binding_sha256'],
  'voice'=>'coral','provider'=>'openai-speech-coral-093-v1'];
$rightJournal=['events'=>[$rightEvent],'last_hash'=>str_repeat('c',64)];
function cmsCreationRead($dir,$id){global $record;return $id===$record['id']?$record:null;}
function cmsCreationDir($private){return $private.'/creations';}
function cmsCoralRealTtsReadiness($p,$r,$a,$b,$c){global $ready;return $ready;}
function cmsCoralTtsJournal($d,$id,$kind){global $rightJournal;
  if($kind!=='voice-rights')throw new RuntimeException('WRONG_RIGHTS');
  return $rightJournal;
}
function cmsCoralTtsBinding($r,$a,$b,$c){global $binding;return $binding;}
function cmsAtelierScriptIds(){global $phaseIds;return $phaseIds;}
function cmsAtelierVisaJournal($d,$id){return ['last_hash'=>str_repeat('d',64)];}
function cmsAtelierCulinaryJournal($d,$id){return ['last_hash'=>str_repeat('e',64)];}
require __DIR__.'/../../public/gestion-contenus/coral-real-speech-request.php';
function check($b,$message){if(!$b)throw new RuntimeException($message);}
function fails($fn,$message){
  $failed=false;try{$fn();}catch(RuntimeException $e){$failed=true;}
  check($failed,$message);
}
$p=cmsCoralRealSpeechApprovedRequest('/private',$record,[],[],[]);
check($p['contract']==='cdc-coral-private-speech-request-v1','CONTRACT');
check($p['voice']==='coral'&&$p['speed_milli']===930,'VOICE');
check($p['max_spend_microusd']===1000000,'CAP');
check(count($p['chapters'])===7,'SEVEN');
check($p['chapters'][0]['sha256']===hash('sha256',$chapters[0]['text']),'EXACT_SHA');
check(preg_match('/^[a-f0-9]{48}$/D',$p['request_id'])===1,'ID');
$auth=cmsCoralRealSpeechAuthorityProjection($p);
check(!isset($auth['chapters'][0]['text']),'PRIVATE_NO_TEXT');
check($auth['request_id']===$p['request_id'],'AUTH_ID');
$previous=$rightJournal;
$rightJournal['events'][0]['action']='revoke';
fails(static fn()=>cmsCoralRealSpeechApprovedRequest('/private',$record,[],[],[]),'REVOKED');
$rightJournal=$previous;
$ready['final_review_current']=false;
fails(static fn()=>cmsCoralRealSpeechApprovedRequest('/private',$record,[],[],[]),'FINAL_VETO');
$ready['final_review_current']=true;
$stale=$record;$stale['version']=5;
fails(static fn()=>cmsCoralRealSpeechApprovedRequest('/private',$stale,[],[],[]),'STALE_VERSION');
echo "CORAL_REAL_SPEECH_STUDIO_SOURCE_OFFLINE_PASS\n";
