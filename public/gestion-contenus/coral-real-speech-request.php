<?php
declare(strict_types=1);
/**
 * Real Coral Speech payload, built only from CURRENT private Studio evidence.
 * Not included in the live Studio: no HTTP call, key, consent or deployment.
 * Requires the voice-rights journal and final visa logic from PR #235.
 */
if(isset($_SERVER['SCRIPT_FILENAME']) && realpath((string)$_SERVER['SCRIPT_FILENAME'])===__FILE__){
  http_response_code(404);exit;
}
function cmsCoralRealSpeechApprovedRequest(
  string $private,array $record,array $catalog,array $canonical,array $guided
): array {
  if(!function_exists('cmsCoralRealTtsReadiness')
    ||!function_exists('cmsCoralTtsJournal')||!function_exists('cmsCoralTtsBinding')
    ||!function_exists('cmsAtelierScriptIds')||!function_exists('cmsAtelierVisaJournal')
    ||!function_exists('cmsAtelierCulinaryJournal')||!function_exists('cmsCreationDir'))
    throw new RuntimeException('REAL_SPEECH_STUDIO_NOT_READY');

  $saved=cmsCreationRead(cmsCreationDir($private),$record['id']??'');
  if(!$saved||$saved!==$record)throw new RuntimeException('REAL_SPEECH_STALE');

  $ready=cmsCoralRealTtsReadiness($private,$record,$catalog,$canonical,$guided);
  if(($ready['text_visas_count']??null)!==7
    ||($ready['culinary_review_current']??false)!==true
    ||($ready['final_review_current']??false)!==true
    ||($ready['rights_current']??false)!==true
    ||($ready['voice']??'')!=='coral'
    ||($ready['provider']??'')!=='openai-speech-coral-093-v1')
    throw new RuntimeException('REAL_SPEECH_HUMAN_APPROVAL_REQUIRED');

  $id=$record['id']??null;$version=$record['version']??null;
  if(!is_string($id)||!preg_match('/^c-[a-f0-9]{24}$/D',$id)
    ||!is_int($version)||$version<1||$version>9999)
    throw new RuntimeException('REAL_SPEECH_VERSION');

  $binding=cmsCoralTtsBinding($record,$catalog,$canonical,$guided);
  $dir=cmsCreationDir($private);
  $rights=cmsCoralTtsJournal($dir,$id,'voice-rights');
  $last=$rights['events']?end($rights['events']):null;
  if(!$last||($last['action']??null)!=='approve'
    ||($last['creation_version']??null)!==$version
    ||($last['binding_sha256']??null)!==$binding['binding_sha256']
    ||($last['voice']??null)!=='coral'
    ||($last['provider']??null)!=='openai-speech-coral-093-v1'
    ||!preg_match('/^[a-f0-9]{64}$/D',$rights['last_hash']??''))
    throw new RuntimeException('REAL_SPEECH_RIGHTS_STALE');

  $steps=cmsAtelierScriptIds();$source=$record['atelier_scripts']['chapters']??null;
  if(!is_array($source)||!array_is_list($source)||count($source)!==7
    ||!is_array($steps)||count($steps)!==7)
    throw new RuntimeException('REAL_SPEECH_CHAPTERS');
  $chapters=[];foreach($steps as $i=>$step){
    $c=$source[$i]??null;$s=$c['text']??null;
    if(!is_array($c)||($c['id']??null)!==$step||!is_string($s)
      ||!mb_check_encoding($s,'UTF-8')||mb_strlen($s,'UTF-8')<120
      ||mb_strlen($s,'UTF-8')>7000)
      throw new RuntimeException('REAL_SPEECH_CHAPTERS');
    $chapters[]=['id'=>$step,'text'=>$s,'sha256'=>hash('sha256',$s)];
  }
  $visas=cmsAtelierVisaJournal($dir,$id);
  $culinary=cmsAtelierCulinaryJournal($dir,$id);
  foreach([$binding['binding_sha256']??null,$binding['recipe_sha256']??null,
    $visas['last_hash']??null,$culinary['last_hash']??null] as $h)
    if(!is_string($h)||!preg_match('/^[a-f0-9]{64}$/D',$h))
      throw new RuntimeException('REAL_SPEECH_HASH');
  $reviews=hash('sha256',$visas['last_hash'].$culinary['last_hash']);
  $r=[
    'contract'=>'cdc-coral-private-speech-request-v1',
    'creation_id'=>$id,'creation_version'=>$version,
    'binding_sha256'=>$binding['binding_sha256'],
    'recipe_sha256'=>$binding['recipe_sha256'],
    'chapters'=>$chapters,'voice'=>'coral',
    'provider'=>'openai-speech-coral-093-v1','speed_milli'=>930,
    'rights_sha256'=>$rights['last_hash'],'reviews_sha256'=>$reviews,
    'max_spend_microusd'=>1000000
  ];
  $sourceKey=hash('sha256',implode("\n",array_merge([
    $r['creation_id'],(string)$r['creation_version'],
    $r['binding_sha256'],$r['recipe_sha256']
  ],array_column($chapters,'sha256'),[
    $r['voice'],$r['provider'],(string)$r['speed_milli']
  ])));
  $r['request_id']=substr(hash('sha256',implode("\n",[
    $sourceKey,$r['rights_sha256'],$r['reviews_sha256'],(string)$r['max_spend_microusd']
  ])),0,48);
  if(strlen(json_encode($r,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR))>90000)
    throw new RuntimeException('REAL_SPEECH_SIZE');
  return $r;
}
function cmsCoralRealSpeechAuthorityProjection(array $request): array {
  if(($request['contract']??null)!=='cdc-coral-private-speech-request-v1'
    ||!is_array($request['chapters']??null)||count($request['chapters'])!==7)
    throw new RuntimeException('REAL_SPEECH_CONTRACT');
  $out=$request;
  $out['chapters']=array_map(static function(array $c):array{
    if(!isset($c['id'],$c['sha256'])||!is_string($c['id'])||!is_string($c['sha256']))
      throw new RuntimeException('REAL_SPEECH_CHAPTERS');
    return ['id'=>$c['id'],'sha256'=>$c['sha256']];
  },$request['chapters']);
  return $out;
}

/**
 * Validates a no-text authority challenge against the current Studio
 * creation and the immutable human-submitted request.
 */
function cmsCoralRealSpeechAuthorityAllowed(
  string $private,array $selector,array $catalog,array $canonical,array $guided
): bool {
  try {
    $id=$selector['creation_id']??null;$job=$selector['request_id']??null;
    if(!is_string($id)||!preg_match('/^c-[a-f0-9]{24}$/D',$id)
      ||!is_string($job)||!preg_match('/^[a-f0-9]{48}$/D',$job))return false;
    $record=cmsCreationRead(cmsCreationDir($private),$id);
    if(!is_array($record))return false;
    $current=cmsCoralRealSpeechApprovedRequest($private,$record,$catalog,$canonical,$guided);
    $file=cmsCreationDir($private).'/real-tts-request-'.$job.'.json';
    $saved=cmsCoralTtsRead($file);
    if($saved!==$current)return false;
    return cmsCoralRealSpeechAuthorityProjection($current)===$selector;
  }catch(Throwable $e){return false;}
}
