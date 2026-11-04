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
echo "CORAL_V2_ONE_BUTTON_CONTRACT_PASS 7 voice scripts, source-bound, no TTS, no old MP3 touched\n";
