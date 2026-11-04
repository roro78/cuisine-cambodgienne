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
  if(($draft['kind']??null)!=='atelier'||isset($draft['source_binding'])
    ||!cmsCreationId($draft['id']??null)||!is_int($draft['version']??null))
    throw new InvalidArgumentException('CORAL_SAVED_REQUIRED');
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
    'timeout_seconds'=>20,'response_max_bytes'=>60000,'max_output_tokens'=>6000];
  if(strlen(json_encode($r,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR))>90000)
    throw new RuntimeException('CORAL_REQUEST_OVERSIZE');
  return $r;
}
