<?php
declare(strict_types=1);
// Private include-only Coral V2 contract. Reuses existing editorial job engine.
if(isset($_SERVER['SCRIPT_FILENAME'])
  &&realpath((string)$_SERVER['SCRIPT_FILENAME'])===__FILE__){
  http_response_code(404);exit;
}
function cmsCoralSettings(array $cfg): ?array {
  $s=cmsAiContentSettings($cfg);
  return $s!==null&&$s['mode']==='async'
    &&($cfg['editorial_ai_content']['coral_v2_qualified']??false)===true?$s:null;
}
function cmsCoralPolicy(): array {
  $path=__DIR__.'/coral-v2-contract.json';
  if(is_link($path)||!is_file($path)||filesize($path)>80000)
    throw new RuntimeException('CORAL_POLICY_MISSING');
  try{$data=json_decode((string)file_get_contents($path),true,10,JSON_THROW_ON_ERROR);}
  catch(Throwable $e){throw new RuntimeException('CORAL_POLICY_MISSING');}
  if(($data['contract']??'')!=='cdc-coral-v2-complete-policy-v1')
    throw new RuntimeException('CORAL_POLICY_MISSING');
  foreach(['structure','narration'] as $k){
    $d=$data[$k]??[];
    if(!is_string($d['text']??null)||!is_string($d['sha256']??null)
      ||!hash_equals(hash('sha256',$d['text']),$d['sha256']))
      throw new RuntimeException('CORAL_POLICY_INVALID');
  }
  return $data;
}
function cmsCoralSchema(): array {
  return ['type'=>'object','additionalProperties'=>false,
   'required'=>['chapters'],'properties'=>['chapters'=>[
    'type'=>'array','minItems'=>7,'maxItems'=>7,
    'items'=>['type'=>'object','additionalProperties'=>false,
     'required'=>['id','text'],'properties'=>[
      'id'=>['type'=>'string','enum'=>cmsAtelierScriptIds()],
      'text'=>['type'=>'string','minLength'=>300,'maxLength'=>7000]]]]]];
}
function cmsCoralRequest(array $draft,array $catalog,array $canonical,array $guided): array {
  if(($draft['kind']??null)!=='atelier'
    ||!cmsCreationId($draft['id']??null)||!is_int($draft['version']??null))
    throw new InvalidArgumentException('CORAL_SAVED_REQUIRED');
  // An explicitly linked PRIVATE draft can start a new text proposal.
  // The relationship is server-owned and must still match the current public
  // workshop; historical scripts, MP3 and prior visas are NEVER imported.
  if(array_key_exists('source_binding',$draft)){
    $binding=$draft['source_binding'];
    if(!is_array($binding)
       ||!cmsStudioBindingCurrent($binding,$catalog,$canonical))
      throw new InvalidArgumentException('CORAL_SOURCE_STALE');
    $sourceId=$binding['source_id'];
    if(($canonical[$sourceId]['model']??null)!=='cookingWorkshopGuides'
       ||($guided[$sourceId]['model']??null)!=='cookingWorkshopGuides'
       ||($guided[$sourceId]['fingerprint']??null)!==($canonical[$sourceId]['fingerprint']??null))
      throw new InvalidArgumentException('CORAL_SOURCE_STALE');
  }
  $fields=$draft['fields']??null;$ref=$draft['atelier_reference']??null;
  $phases=$draft['atelier_phase_details']??null;
  if(!is_array($fields)||!is_array($ref)||!is_array($phases))
    throw new InvalidArgumentException('CORAL_SOURCE_INCOMPLETE');
  $digest=cmsAtelierScriptSourceDigest($fields,$ref,$phases);
  if($digest===''||!cmsAtelierPhaseDetailsComplete($phases))
    throw new InvalidArgumentException('CORAL_SOURCE_INCOMPLETE');
  foreach(($draft['atelier_scripts']['chapters']??[]) as $item)
    if(is_array($item)&&(trim((string)($item['text']??''))!==''
      ||trim((string)($item['editorNote']??''))!==''))
      throw new InvalidArgumentException('CORAL_SCRIPT_EXISTS');
  $id='recette:'.($ref['recipeSlug']??'');
  $c=$canonical[$id]??[];$g=$guided[$id]??[];
  if(($catalog[$id]['fingerprint']??null)!==($ref['catalogFingerprint']??null)
    ||($c['model']??null)!=='recipes'||($g['fingerprint']??null)!==($c['fingerprint']??null)
    ||!preg_match('/^[a-f0-9]{64}$/D',$c['fingerprint']??'')
    ||!is_array($g['fields']['ingredients']??null)
    ||!is_array($g['fields']['steps']??null))
    throw new InvalidArgumentException('CORAL_RECIPE_STALE');
  $p=cmsCoralPolicy();
  $r=['contract'=>'cdc-coral-v2-script-request-v1',
    'scope'=>'workshop-seven-spoken-scripts-v1',
    'creation_id'=>$draft['id'],'creation_version'=>$draft['version'],
    'binding_digest'=>$digest,'canonical_fingerprint'=>$c['fingerprint'],
    'atelier'=>['title'=>$draft['title'],'fields'=>$fields,
      'phases'=>$phases['phases'],'recipeSlug'=>$ref['recipeSlug']],
    'reference'=>['id'=>$id,'recipe_fields'=>$g['fields']],
    'referentials'=>['structure'=>$p['structure'],'narration'=>$p['narration']],
    'response_schema'=>cmsCoralSchema(),
    'timeout_seconds'=>20,'response_max_bytes'=>30000,'max_output_tokens'=>6000];
  if(strlen(json_encode($r,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR))>90000)
    throw new RuntimeException('CORAL_REQUEST_OVERSIZE');
  return $r;
}

/** Strict server acceptance of the model candidate; this is NOT a visa. */
function cmsCoralCandidate(array $request,mixed $wire): array {
  if(!is_string($wire)||strlen($wire)>30000)
    throw new InvalidArgumentException('CORAL_RESPONSE');
  try{$out=json_decode($wire,true,12,JSON_THROW_ON_ERROR);}
  catch(Throwable $e){throw new InvalidArgumentException('CORAL_RESPONSE');}
  if(!is_array($out)||array_keys($out)!==['chapters']
    ||!is_array($out['chapters'])||count($out['chapters'])!==7)
    throw new InvalidArgumentException('CORAL_CHAPTERS');
  $chapters=[];
  foreach(cmsAtelierScriptIds() as $i=>$id){
    $row=$out['chapters'][$i]??null;
    if(!is_array($row)||count($row)!==2
       ||array_diff(array_keys($row),['id','text'])
       ||($row['id']??null)!==$id)
      throw new InvalidArgumentException('CORAL_CHAPTERS');
    $text=cmsCreationText($row['text']??null,7000);
    if(mbLen($text)<($i===0?300:400)
      ||preg_match('/(?<!\p{L})(?:fabriqu\p{L}*|fabrication\p{L}*|constru\p{L}*|chantier\p{L}*|maçonnerie|bétonnage|poste)(?!\p{L})/iu',$text)
      ||preg_match('/\b(?:monter|montez|montage|assembler|assemblez)\s+(?:les|des|du|d.un)\s+bols?\b/iu',$text)
      ||preg_match('/(?<![\p{L}\p{N}])\d+(?:[.,]\d+)?\s*(?:kg|g|grammes?|ml|cl|litres?|tomates?|oignons?|oeufs?|œufs?|portions?)\b/iu',$text)
      ||preg_match('/(?:^|\n)\s*(?:[-*]|\d+[.)])\s/u',$text)
      ||preg_match('/(?:je vous vois|je vous entends|je sais que vous avez fini)/iu',$text))
      throw new InvalidArgumentException('CORAL_LEXICON_OR_VOICE');
    $chapters[]=['index'=>$i,'id'=>$id,'text'=>$text,
      'editorNote'=>'Texte proposé par le moteur éditorial sous contrat Coral V2. Vérifier chaque geste, ingrédient, précaution et source. Aucun visa ni MP3.'];
  }
  return ['version'=>1,'bindingDigest'=>$request['binding_digest'],'chapters'=>$chapters];
}
/** Existing C2 asynchronous submit/poll endpoint, same quota and token,
 * separate typed contract. No second model service; never auto-retry. */
function cmsCoralStart(array $draft,array $catalog,array $canonical,array $guided,
  string $private,array $settings): array {
  if(($settings['mode']??null)!=='async'||!is_callable($settings['submit']??null))
    throw new RuntimeException('CORAL_DISABLED');
  $request=cmsCoralRequest($draft,$catalog,$canonical,$guided);
  cmsAiBriefReserve($private,$settings['max_attempts_per_day']);
  $token=bin2hex(random_bytes(24));
  $job=['token'=>$token,'expires_at'=>time()+1800,'status'=>'submission_unknown',
    'creation_id'=>$draft['id'],'creation_version'=>$draft['version'],
    'binding_digest'=>$request['binding_digest'],'request'=>$request];
  try{$ack=($settings['submit'])($request,$token);}
  catch(Throwable $e){return $job;}
  if(!is_array($ack)||($ack['id']??null)!==$token
     ||!in_array($ack['status']??null,['queued','running','succeeded'],true))
     throw new RuntimeException('CORAL_PROVIDER');
  $job['status']=$ack['status']==='succeeded'?'queued':$ack['status'];
  return $job;
}
function cmsCoralPoll(array &$job,array $draft,array $settings,array $canonical,array $catalog=[]): ?array {
  // Refuse a result if the published workshop changed during generation.
  if(array_key_exists('source_binding',$draft)){
    if(!is_array($draft['source_binding'])
      ||!cmsStudioBindingCurrent($draft['source_binding'],$catalog,$canonical))
      throw new RuntimeException('CORAL_SOURCE_STALE');
  }
  if(($job['creation_id']??null)!==($draft['id']??null)
    ||($job['creation_version']??null)!==($draft['version']??null)
    ||($job['expires_at']??0)<time()||($job['status']??null)==='failed'
    ||($job['binding_digest']??null)!==cmsAtelierScriptSourceDigest(
      $draft['fields'],$draft['atelier_reference'],$draft['atelier_phase_details']))
    throw new RuntimeException('CORAL_STALE');
  $recipeId='recette:'.($draft['atelier_reference']['recipeSlug']??'');
  if(($canonical[$recipeId]['fingerprint']??null)!==($job['request']['canonical_fingerprint']??null))
    throw new RuntimeException('CORAL_CANONICAL_STALE');
  if(($settings['mode']??null)!=='async'||!is_callable($settings['poll']??null))
    throw new RuntimeException('CORAL_DISABLED');
  try{$answer=($settings['poll'])($job['token']);}
  catch(Throwable $e){throw new RuntimeException('CORAL_PROVIDER');}
  if(!is_array($answer)||($answer['id']??null)!==$job['token'])
    throw new RuntimeException('CORAL_PROVIDER');
  if(in_array($answer['status']??null,['queued','running'],true)){
    $job['status']=$answer['status'];return null;
  }
  if(($answer['status']??null)!=='succeeded'){
    $job['status']='failed';throw new RuntimeException('CORAL_PROVIDER');
  }
  try{return cmsCoralCandidate($job['request'],$answer['result']??null);}
  catch(Throwable $e){$job['status']='failed';throw $e;}
}
