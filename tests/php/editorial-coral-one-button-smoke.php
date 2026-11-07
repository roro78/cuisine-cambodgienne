<?php
declare(strict_types=1);
$dist=realpath($argv[1]??'');
if(!is_string($dist)||!is_file($dist.'/gestion-contenus/coral-v2-contract.json'))
  throw new RuntimeException('CORAL_BUILD_REQUIRED');
require_once $dist.'/gestion-contenus/lib.php';
require_once $dist.'/gestion-contenus/coral-v2-ai.php';
function ck(bool $v,string $name):void{if(!$v)throw new RuntimeException('CORAL_TEST_'.$name);}
$feed=json_decode(file_get_contents($dist.'/social-feed.json'),true,64,JSON_THROW_ON_ERROR);
$catalog=cmsSourceList($feed);
$idx=json_decode(file_get_contents($dist.'/editorial-source-index.json'),true,64,JSON_THROW_ON_ERROR);
$canonical=cmsCanonicalSourceList($idx,$catalog);
$guidedPayload=json_decode(file_get_contents($dist.'/editorial-guided-fields.json'),true,64,JSON_THROW_ON_ERROR);
$guided=cmsGuidedSourceList($guidedPayload,$canonical);
$recipeId=null;
foreach($canonical as $id=>$item)if(($item['model']??null)==='recipes'){$recipeId=$id;break;}
ck(is_string($recipeId),'RECIPE_REQUIRED');
$phases=[];$head=[];
foreach(cmsAtelierPhaseIds() as $i=>$phaseId){
  $phases[]=['index'=>$i,'id'=>$phaseId,'sourceTitle'=>'Chapitre '.($i+1),
    'sourceLearning'=>'Apprendre le geste sans improvisation','minutes'=>'7',
    'ingredientNames'=>['Préparation canonique'],'actions'=>['Préparer les ingrédients de la fiche'],
    'observe'=>'Observer la texture','check'=>'Vérifier la cuisson adaptée',
    'mistake'=>'Ne pas maîtriser la chaleur','recovery'=>'Corriger progressivement',
    'safety'=>'Vérifier les risques alimentaires','pausePrompt'=>'Pause pendant le geste'];
  $head[]=['title'=>'Chapitre '.($i+1),'learning'=>'Apprendre le geste sans improvisation'];
}
$slug=explode(':',$recipeId,2)[1];
$draft=['id'=>'c-'.str_repeat('a',24),'version'=>2,'kind'=>'atelier',
  'title'=>'Atelier privé test Coral V2','fields'=>[
    'intro'=>'Bienvenue dans notre atelier de cuisine','learningGoal'=>'Réussir les gestes de cuisine',
    'finalPreparation'=>'Une préparation culinaire vérifiable','portionLabel'=>'Portions de la fiche',
    'phases'=>$head],
  'atelier_reference'=>['version'=>1,'recipeSlug'=>$slug,
    'catalogFingerprint'=>$catalog[$recipeId]['fingerprint']],
  'atelier_phase_details'=>['version'=>1,'recipeSlug'=>$slug,
    'catalogFingerprint'=>$catalog[$recipeId]['fingerprint'],'phases'=>$phases],
  'atelier_scripts'=>['version'=>1,'bindingDigest'=>'','chapters'=>[]]];
ck(cmsCoralSettings([])===null,'DEFAULT_DISABLED');
$request=cmsCoralRequest($draft,$catalog,$canonical,$guided);
ck($request['contract']==='cdc-coral-v2-script-request-v1'
  &&count($request['atelier']['phases'])===6
  &&strlen($request['referentials']['structure']['text'])>1000
  &&strlen($request['referentials']['narration']['text'])>1000,'REAL_REFERENTIALS');
$voice=str_repeat('Nous allons cuisiner tranquillement. Observez la texture, ajustez le geste avec précaution et prenez le temps de reconnaître le résultat avant de poursuivre. ',5);
$chapters=[];
foreach(cmsAtelierScriptIds() as $id)$chapters[]=['id'=>$id,'text'=>$voice];
$json=json_encode(['chapters'=>$chapters],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
$proposed=cmsCoralCandidate($request,$json);
ck(cmsAtelierScriptsDraftComplete($proposed)
  &&$proposed['bindingDigest']===$request['binding_digest']
  &&!isset($proposed['chapters'][0]['approved']),'DRAFT_NO_VISA');
foreach(['Construire une sauce','Fabriquer un plat','Notre chantier','Notre poste'] as $bad){
  $invalid=$chapters;$invalid[0]['text'].=' '.$bad.'.';
  try{cmsCoralCandidate($request,json_encode(['chapters'=>$invalid],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR));
    throw new RuntimeException('ACCEPTED_BTP');
  }catch(InvalidArgumentException $e){ck($e->getMessage()==='CORAL_LEXICON_OR_VOICE','BLOCK_BTP');}
}
$bad=$chapters;$bad[0]['text'].=' Ajoutez 450 g de viande.';
try{cmsCoralCandidate($request,json_encode(['chapters'=>$bad],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR));
  throw new RuntimeException('ACCEPTED_AMOUNT');
}catch(InvalidArgumentException $e){ck($e->getMessage()==='CORAL_LEXICON_OR_VOICE','BLOCK_VARIABLE_QUANTITY');}
$bad=$chapters;$bad[6]['id']='installer';
try{cmsCoralCandidate($request,json_encode(['chapters'=>$bad],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR));
  throw new RuntimeException('ACCEPTED_PHASE');
}catch(InvalidArgumentException $e){ck($e->getMessage()==='CORAL_CHAPTERS','BLOCK_PHASE');}
$dirty=$draft;$dirty['atelier_scripts']['chapters']=[['text'=>'Ancienne narration à conserver']];
try{cmsCoralRequest($dirty,$catalog,$canonical,$guided);throw new RuntimeException('OVERWROTE_SCRIPT');}
catch(InvalidArgumentException $e){ck($e->getMessage()==='CORAL_SCRIPT_EXISTS','PRESERVE_EXISTING');}
$dirty=$draft;$dirty['atelier_reference']['catalogFingerprint']=str_repeat('0',16);
try{cmsCoralRequest($dirty,$catalog,$canonical,$guided);throw new RuntimeException('STALE_RECIPE');}
catch(InvalidArgumentException $e){ck(in_array($e->getMessage(),['CORAL_RECIPE_STALE','CORAL_SOURCE_INCOMPLETE'],true),'SOURCE_STALE');}
// Published workshops can be revised only through an explicitly linked,
// append-only private draft whose canonical and catalog anchors remain current.
$workshopId=null;
foreach($canonical as $id=>$source){
  if(($source['model']??null)==='cookingWorkshopGuides'
    &&($catalog[$id]['kind']??null)==='atelier'
    &&($guided[$id]['model']??null)==='cookingWorkshopGuides'){
    $workshopId=$id;break;
  }
}
ck(is_string($workshopId),'PUBLISHED_WORKSHOP_REQUIRED');
$linked=$draft;
$linked['source_binding']=cmsStudioSourceBinding(
  $catalog[$workshopId],$canonical[$workshopId],0,null);
$linkedRequest=cmsCoralRequest($linked,$catalog,$canonical,$guided);
ck($linkedRequest['creation_id']===$draft['id']
  &&$linkedRequest['binding_digest']===$request['binding_digest']
  &&!isset($linkedRequest['source_binding']),
  'LINKED_DRAFT_SAME_PRIVATE_SCRIPT_CONTRACT');
$changedBinding=$linked;
$changedBinding['source_binding']['canonical_fingerprint']=str_repeat('f',64);
try{cmsCoralRequest($changedBinding,$catalog,$canonical,$guided);throw new RuntimeException('ACCEPTED_STALE_SOURCE');}
catch(InvalidArgumentException $e){ck($e->getMessage()==='CORAL_SOURCE_STALE','BLOCK_STALE_PUBLISHED_SOURCE');}
$changedFeed=$catalog;
$changedFeed[$workshopId]['fingerprint']=str_repeat('0',16);
try{cmsCoralRequest($linked,$changedFeed,$canonical,$guided);throw new RuntimeException('ACCEPTED_STALE_FEED');}
catch(InvalidArgumentException $e){ck($e->getMessage()==='CORAL_SOURCE_STALE','BLOCK_CHANGED_PUBLISHED_FEED');}
$linkedWithScripts=$linked;
$linkedWithScripts['atelier_scripts']['chapters']=[['text'=>'Historique protégé']];
try{cmsCoralRequest($linkedWithScripts,$catalog,$canonical,$guided);throw new RuntimeException('ACCEPTED_SCRIPT_REPLACE');}
catch(InvalidArgumentException $e){ck($e->getMessage()==='CORAL_SCRIPT_EXISTS','BLOCK_LINKED_SCRIPT_REPLACE');}
$temp=sys_get_temp_dir().'/cdc-coral-request-'.bin2hex(random_bytes(6));
ck(mkdir($temp,0700),'PRIVATE_DIR');
try{
  $submitCalls=0;$pollCalls=0;
  $settings=['mode'=>'async','max_attempts_per_day'=>5,
    'submit'=>static function(array $r,string $id)use(&$submitCalls):array{
      $submitCalls++;return ['id'=>$id,'status'=>'queued'];
    },
    'poll'=>static function(string $id)use(&$pollCalls,$json):array{
      $pollCalls++;return ['id'=>$id,'status'=>'succeeded','result'=>$json];
    }];
  $job=cmsCoralStart($draft,$catalog,$canonical,$guided,$temp,$settings);
  ck($submitCalls===1&&$job['status']==='queued','SINGLE_PROVIDER_SUBMIT');
  $same=cmsCoralStart($draft,$catalog,$canonical,$guided,$temp,$settings);
  ck($same['token']===$job['token']&&$submitCalls===1,'LOST_SESSION_SAME_CORAL_JOB');
  $result=cmsCoralPoll($job,$draft,$settings,$canonical);
  ck($pollCalls===1&&count($result['chapters'])===7&&$submitCalls===1,
    'POLL_RETURNS_HUMAN_DRAFT_NOT_SECOND_INFERENCE');
  // Independent private fixture: production enforces >=60 seconds between
  // two attempts for the SAME Studio owner. Do not weaken this safeguard.
  $linkedPrivate=$temp.'/linked';ck(mkdir($linkedPrivate,0700),'LINKED_PRIVATE_DIR');
  $linkedJob=cmsCoralStart($linked,$catalog,$canonical,$guided,$linkedPrivate,$settings);
  $linkedResult=cmsCoralPoll($linkedJob,$linked,$settings,$canonical,$catalog);
  ck(count($linkedResult['chapters'])===7&&$linkedResult['bindingDigest']===$request['binding_digest'],
    'LINKED_PUBLISHED_WORKSHOP_SEVEN_NEW_PRIVATE_SCRIPTS');
  try{
    cmsCoralPoll($linkedJob,$linked,$settings,$canonical,$changedFeed);
    throw new RuntimeException('ACCEPTED_STALE_POLL');
  }catch(RuntimeException $e){ck($e->getMessage()==='CORAL_SOURCE_STALE','POLL_REJECTS_CHANGED_PUBLISHED_SOURCE');}
  $stale=$canonical;$stale[$recipeId]['fingerprint']=str_repeat('f',64);
  try{cmsCoralPoll($job,$draft,$settings,$stale);throw new RuntimeException('ACCEPTED_NEW_RECIPE');}
  catch(RuntimeException $e){ck($e->getMessage()==='CORAL_CANONICAL_STALE','RECIPE_CHANGED_DURING_JOB');}
  $lost=$temp.'/lost';ck(mkdir($lost,0700),'LOST_ACK_PRIVATE');$calls=0;$fail=$settings;
  $fail['submit']=static function()use(&$calls):array{++$calls;throw new RuntimeException('SYNTHETIC_LOST_ACK');};
  $unknown=cmsCoralStart($draft,$catalog,$canonical,$guided,$lost,$fail);
  $again=cmsCoralStart($draft,$catalog,$canonical,$guided,$lost,$fail);
  ck($calls===1&&$unknown['token']===$again['token']&&$again['status']==='submission_unknown','CORAL_LOST_ACK_NO_REPLAY');
}finally{
  $remove=static function(string $dir)use(&$remove,$temp):void{
    if($dir!==$temp&&!str_starts_with($dir,$temp.'/'))throw new RuntimeException('TEST_CLEANUP_SCOPE');
    foreach(scandir($dir)?:[] as $n){if($n==='.'||$n==='..')continue;$p=$dir.'/'.$n;
      if(is_dir($p)&&!is_link($p))$remove($p);else unlink($p);}
    rmdir($dir);
  };
  $remove($temp);
}
echo "CORAL_V2_ONE_BUTTON_CONTRACT_PASS 7 voice scripts, source-bound, no TTS, no old MP3 touched\n";
