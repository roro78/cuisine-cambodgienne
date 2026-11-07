<?php
declare(strict_types=1);
// Private include-only Coral V2 contract. Reuses existing editorial job engine.
if(isset($_SERVER['SCRIPT_FILENAME'])
  &&realpath((string)$_SERVER['SCRIPT_FILENAME'])===__FILE__){
  http_response_code(404);exit;
}
function cmsCoralSettings(array $cfg): ?array {
  $s=cmsAiContentSettings($cfg);
  if($s===null||$s['mode']!=='async'||($cfg['editorial_ai_content']['coral_v2_qualified']??false)!==true)return null;
  $s['workshop_complete_qualified']=($cfg['editorial_ai_content']['workshop_complete_qualified']??false)===true;
  if($s['workshop_complete_qualified']){
    $s['workshop_creation_id']=$cfg['editorial_ai_content']['workshop_creation_id']??null;
    $s['workshop_recipe_sha256']=$cfg['editorial_ai_content']['workshop_recipe_sha256']??null;
    $expires=$cfg['editorial_ai_content']['workshop_expires_at']??null;
    $s['workshop_expires_at']=is_string($expires)?strtotime($expires):false;
    if(!cmsCreationId($s['workshop_creation_id'])||!is_string($s['workshop_recipe_sha256'])
      ||!preg_match('/^[a-f0-9]{64}$/D',$s['workshop_recipe_sha256'])
      ||!is_string($expires)||!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/D',$expires)
      ||$s['workshop_expires_at']<=time()||$s['workshop_expires_at']>time()+172800
      ||gmdate('Y-m',(int)$s['workshop_expires_at'])!==gmdate('Y-m'))throw new RuntimeException('CORAL_WORKSHOP_SCOPE');
    $s['workshop_research']=cmsCoralWorkshopResearch($cfg['editorial_ai_content']['workshop_research']??null,$s['workshop_recipe_sha256']);
    $s['workshop_excluded_creation_ids']=$cfg['editorial_ai_content']['workshop_excluded_creation_ids']??[];
    if(!is_array($s['workshop_excluded_creation_ids'])||!array_is_list($s['workshop_excluded_creation_ids'])
      ||count($s['workshop_excluded_creation_ids'])>250)throw new RuntimeException('CORAL_WORKSHOP_SCOPE');
    foreach($s['workshop_excluded_creation_ids'] as $id)if(!cmsCreationId($id))throw new RuntimeException('CORAL_WORKSHOP_SCOPE');
  }
  return $s;
}

/** Optional AUDIO simulation, independent from text provider flags. Never a paid adapter. */
function cmsCoralTtsSettings(array $cfg): ?array {
  $s=$cfg['editorial_tts']??null;
  if(!is_array($s)||($s['enabled']??false)!==true||($s['test_only']??false)!==true
     ||($s['mode']??null)!=='simulated')return null;
  foreach(['submit','poll','resume','artifact'] as $op)
    if(!is_callable($s[$op]??null))return null;
  return $s;
}
function cmsCoralTtsRead(string $file): array {
  if(is_link($file)||!is_file($file)||filesize($file)>120000
    ||(PHP_OS_FAMILY!=='Windows'&&(fileperms($file)&0077)!==0))
    throw new RuntimeException('TTS_PRIVATE_STORE');
  $raw=file_get_contents($file);
  if(!is_string($raw))throw new RuntimeException('TTS_PRIVATE_STORE');
  $r=json_decode($raw,true,32,JSON_THROW_ON_ERROR);
  if(!is_array($r))throw new RuntimeException('TTS_PRIVATE_STORE');return $r;
}
function cmsCoralTtsWrite(string $file,array $r): void {
  if(is_link($file)||file_exists($file))throw new RuntimeException('TTS_STORE_CONFLICT');
  $json=json_encode($r,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
  $tmp=tempnam(dirname($file),'tts-private-');
  if($tmp===false)throw new RuntimeException('TTS_PRIVATE_STORE');
  try{
    if(!chmod($tmp,0600)||file_put_contents($tmp,$json,LOCK_EX)!==strlen($json)
      ||!rename($tmp,$file))throw new RuntimeException('TTS_PRIVATE_STORE');
  }finally{if(is_file($tmp))unlink($tmp);}
}
function cmsCoralTtsLocked(string $private,string $id,callable $op): mixed {
  if(!cmsCreationId($id))throw new InvalidArgumentException('TTS_CREATION_ID');
  $dir=cmsCreationDir($private);$file=$dir.'/catalog.lock';
  if(is_link($file))throw new RuntimeException('TTS_LOCK');
  $h=fopen($file,'c');if(!$h||!flock($h,LOCK_EX))throw new RuntimeException('TTS_LOCK');
  try{if(!chmod($file,0600))throw new RuntimeException('TTS_LOCK');
    $record=cmsCreationRead($dir,$id);if(!$record)throw new RuntimeException('TTS_DRAFT_MISSING');
    return $op($dir,$record);
  }finally{flock($h,LOCK_UN);fclose($h);}
}
function cmsCoralTtsBinding(array $record,array $catalog,array $canonical,array $guided): array {
  if(isset($record['source_binding'])&&!cmsStudioBindingCurrent($record['source_binding'],$catalog,$canonical))
    throw new RuntimeException('TTS_SOURCE_STALE');
  $c=cmsAtelierCulinaryContext($record,$catalog,$canonical,$guided);
  return ['recipe_sha256'=>$c['recipe_sha256'],'binding_sha256'=>hash('sha256',json_encode([
    $record['id'],$record['version'],$c,hash('sha256',json_encode($record,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR))
  ],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR))];
}
/** Compatible append-only human journal, never imported into content drafts. */
function cmsCoralTtsJournal(string $dir,string $id,string $kind): array {
  if(!cmsCreationId($id)||!in_array($kind,['rights','listening'],true))throw new RuntimeException('TTS_JOURNAL_ID');
  $events=[];$previous='';$files=glob($dir.'/tts-'.$kind.'-'.$id.'.*.json');
  if(!is_array($files)||count($files)>9998)throw new RuntimeException('TTS_JOURNAL_STORE');
  foreach($files as $file){
    $r=cmsCoralTtsRead($file);$keys=['contract','creation_id','creation_version','event','action',
      'binding_sha256','voice','provider','checks','artifact_sha256','note','reviewer','reviewed_at','previous_event_sha256'];
    if(count($r)!==count($keys)||array_diff(array_keys($r),$keys)
      ||$r['contract']!=='cdc-coral-tts-'.$kind.'-v1'||$r['creation_id']!==$id
      ||$r['event']!==count($events)+1||!is_int($r['creation_version'])||$r['creation_version']<1
      ||basename($file)!=='tts-'.$kind.'-'.$id.'.'.sprintf('%04d',$r['event']).'.json'
      ||!in_array($r['action'],['approve','revoke'],true)||!preg_match('/^[a-f0-9]{64}$/D',$r['binding_sha256'])
      ||$r['voice']!=='test-tone'||$r['provider']!=='simulated-tone-v1'||!is_array($r['checks'])
      ||$r['checks']!==($r['action']==='approve'?($kind==='rights'?['voice','content','private_audio']:['full_listening','chapter_order']):[])
      ||!is_string($r['artifact_sha256'])||($kind==='rights'?$r['artifact_sha256']!=='':!preg_match('/^[a-f0-9]{64}$/D',$r['artifact_sha256']))
      ||!is_string($r['note'])||mbLen($r['note'])<20||mbLen($r['note'])>900
      ||$r['reviewer']!=='authenticated-cms-owner'
      ||!is_string($r['reviewed_at'])||!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/D',$r['reviewed_at'])
      ||$r['previous_event_sha256']!==$previous)throw new RuntimeException('TTS_JOURNAL_CORRUPT');
    $events[]=$r;$previous=hash_file('sha256',$file);
  }
  return ['events'=>$events,'last_hash'=>$previous];
}
function cmsCoralTtsDecision(string $private,string $id,int $expected,string $kind,string $action,
  array $checks,string $note,bool $confirmed,bool $authenticated,array $catalog,array $canonical,array $guided,
  string $artifactSha=''): array {
  if(!$authenticated||!$confirmed)throw new RuntimeException('TTS_HUMAN_CONFIRM_REQUIRED');
  $required=$kind==='rights'?['voice','content','private_audio']:['full_listening','chapter_order'];
  if(!in_array($kind,['rights','listening'],true)||!in_array($action,['approve','revoke'],true)
    ||($action==='approve'?(array_keys($checks)!==$required||array_values($checks)!==array_fill(0,count($required),'1')):$checks!==[]))
    throw new InvalidArgumentException('TTS_RIGHTS_CHECKS');
  $note=cmsCreationText($note,900);if(mbLen($note)<20)throw new InvalidArgumentException('TTS_HUMAN_NOTE');
  if(($kind==='rights'&&$artifactSha!=='')||($kind==='listening'&&!preg_match('/^[a-f0-9]{64}$/D',$artifactSha)))throw new InvalidArgumentException('TTS_ARTIFACT');
  return cmsCoralTtsLocked($private,$id,static function($dir,$record)use($id,$expected,$kind,$action,$checks,$note,$catalog,$canonical,$guided,$artifactSha){
    if($record['version']!==$expected)throw new RuntimeException('TTS_VERSION_STALE');
    $binding=cmsCoralTtsBinding($record,$catalog,$canonical,$guided);$j=cmsCoralTtsJournal($dir,$id,$kind);$n=count($j['events'])+1;
    if($n>9998)throw new RuntimeException('TTS_JOURNAL_CAPACITY');
    $r=['contract'=>'cdc-coral-tts-'.$kind.'-v1','creation_id'=>$id,'creation_version'=>$expected,
      'event'=>$n,'action'=>$action,'binding_sha256'=>$binding['binding_sha256'],'voice'=>'test-tone','provider'=>'simulated-tone-v1',
      'checks'=>$action==='approve'?array_keys($checks):[],'artifact_sha256'=>$artifactSha,
      'note'=>$note,'reviewer'=>'authenticated-cms-owner','reviewed_at'=>gmdate('Y-m-d\TH:i:s\Z'),'previous_event_sha256'=>$j['last_hash']];
    cmsCoralTtsWrite($dir.'/tts-'.$kind.'-'.$id.'.'.sprintf('%04d',$n).'.json',$r);return $r;
  });
}
function cmsCoralTtsRequest(string $private,array $record,array $catalog,array $canonical,array $guided): array {
  $dir=cmsCreationDir($private);$saved=cmsCreationRead($dir,$record['id']??'');
  if(!$saved||$saved!==$record)throw new RuntimeException('TTS_VERSION_STALE');
  $gate=cmsCoralTtsPreproductionGate(cmsAtelierCoralPrereception($private,$record,$catalog,$canonical,$guided));
  if(!$gate['text_and_culinary_reviews_complete'])throw new RuntimeException('TTS_REVIEWS_REQUIRED');
  $binding=cmsCoralTtsBinding($record,$catalog,$canonical,$guided);$rights=cmsCoralTtsJournal($dir,$record['id'],'rights');
  $last=$rights['events']?end($rights['events']):null;
  if(!$last||$last['action']!=='approve'||$last['creation_version']!==$record['version']
    ||$last['binding_sha256']!==$binding['binding_sha256'])throw new RuntimeException('TTS_RIGHTS_REQUIRED');
  $chapters=[];foreach($record['atelier_scripts']['chapters'] as $c)$chapters[]=['id'=>$c['id'],'text'=>$c['text'],'sha256'=>hash('sha256',$c['text'])];
  $reviews=hash('sha256',cmsAtelierVisaJournal($dir,$record['id'])['last_hash'].cmsAtelierCulinaryJournal($dir,$record['id'])['last_hash']);
  $r=['contract'=>'cdc-coral-private-tts-request-v1','creation_id'=>$record['id'],'creation_version'=>$record['version'],
    'binding_sha256'=>$binding['binding_sha256'],'recipe_sha256'=>$binding['recipe_sha256'],'chapters'=>$chapters,
    'voice'=>'test-tone','provider'=>'simulated-tone-v1','rights_sha256'=>$rights['last_hash'],'reviews_sha256'=>$reviews,
    'reserve_microusd'=>7000];
  $r['request_id']=substr(hash('sha256',implode("\n",array_merge([$r['creation_id'],(string)$r['creation_version'],
    $r['binding_sha256'],$r['recipe_sha256']],array_column($chapters,'sha256'),[$r['voice'],$r['rights_sha256'],$reviews,$r['provider']]))),0,48);
  return $r;
}
/** Must be called by a trusted worker authority callback before EACH fragment and finalization. */
function cmsCoralTtsAuthorize(string $private,array $request,array $catalog,array $canonical,array $guided): bool {
  try{$record=cmsCreationRead(cmsCreationDir($private),$request['creation_id']??'');
    return $record!==null&&cmsCoralTtsRequest($private,$record,$catalog,$canonical,$guided)===$request;
  }catch(Throwable $e){return false;}
}
/** Read-only machine check on the SAME Studio entry point; no session/CSRF bypass for edits. */
function cmsCoralTtsAuthorityToken(string $private,array $cfg): string {
  $s=$cfg['editorial_tts_authority']??null;
  if(!is_array($s)||($s['enabled']??false)!==true||($s['qualified']??false)!==true
    ||!is_string($s['token_file']??null))throw new RuntimeException('TTS_AUTHORITY_DISABLED');
  $file=$s['token_file'];$dir=realpath($private);
  if($dir===false||is_link($private)||is_link($file)||!is_file($file)||realpath(dirname($file))!==$dir
    ||filesize($file)>128||filesize($file)<64
    ||(PHP_OS_FAMILY!=='Windows'&&((fileperms($file)&0077)!==0||(fileperms($private)&0077)!==0
      ||fileowner($file)!==fileowner($private))))throw new RuntimeException('TTS_AUTHORITY_SECRET');
  $token=file_get_contents($file);
  if(!is_string($token))throw new RuntimeException('TTS_AUTHORITY_SECRET');
  $token=preg_replace('/\r?\n$/D','',$token);
  if(!is_string($token)||!preg_match('/^[a-f0-9]{64}$/D',$token))throw new RuntimeException('TTS_AUTHORITY_SECRET');
  return $token;
}
function cmsCoralTtsAuthorityRate(string $private): void {
  $path=$private.'/tts-authority-rate.json';
  if(is_link($path))throw new RuntimeException('TTS_AUTHORITY_LIMIT');
  $h=fopen($path,'c+');if(!$h||!flock($h,LOCK_EX|LOCK_NB))throw new RuntimeException('TTS_AUTHORITY_LIMIT');
  try{
    $stat=fstat($h);if(!$stat||$stat['size']>4096)throw new RuntimeException('TTS_AUTHORITY_LIMIT');
    $raw=stream_get_contents($h);$times=json_decode($raw===''?'[]':$raw,true,4,JSON_THROW_ON_ERROR);
    if(!is_array($times)||!array_is_list($times)||count($times)>120
      ||count(array_filter($times,'is_int'))!==count($times))throw new RuntimeException('TTS_AUTHORITY_LIMIT');
    $now=time();$times=array_values(array_filter($times,static fn($t)=>$t>=$now-60&&$t<=$now));
    if(count($times)>=120)throw new RuntimeException('TTS_AUTHORITY_LIMIT');
    $times[]=$now;$json=json_encode($times,JSON_THROW_ON_ERROR);
    if(!chmod($path,0600)||!rewind($h)||!ftruncate($h,0)||fwrite($h,$json)!==strlen($json)||!fflush($h))
      throw new RuntimeException('TTS_AUTHORITY_LIMIT');
  }finally{flock($h,LOCK_UN);fclose($h);}
}
function cmsCoralTtsAuthorityProjection(array $r): array {
  $out=[];foreach(['contract','creation_id','creation_version','binding_sha256','recipe_sha256','chapters','voice','provider',
    'rights_sha256','reviews_sha256','reserve_microusd','request_id'] as $key)$out[$key]=$r[$key];
  $out['chapters']=array_map(static fn($c)=>['id'=>$c['id'],'sha256'=>$c['sha256']],$r['chapters']);return $out;
}
function cmsCoralTtsAuthoritySelectorValid(array $r): bool {
  $keys=['contract','creation_id','creation_version','binding_sha256','recipe_sha256','chapters','voice','provider',
    'rights_sha256','reviews_sha256','reserve_microusd','request_id'];
  if(count($r)!==12||array_diff($keys,array_keys($r))||($r['contract']??null)!=='cdc-coral-private-tts-request-v1'
    ||cmsCreationId($r['creation_id']??null)===null||!is_int($r['creation_version']??null)||$r['creation_version']<1||$r['creation_version']>9999
    ||($r['voice']??null)!=='test-tone'||($r['provider']??null)!=='simulated-tone-v1'||($r['reserve_microusd']??null)!==7000
    ||!is_array($r['chapters']??null)||!array_is_list($r['chapters'])||count($r['chapters'])!==7)return false;
  foreach(['binding_sha256','recipe_sha256','rights_sha256','reviews_sha256'] as $key)
    if(!is_string($r[$key])||!preg_match('/^[a-f0-9]{64}$/D',$r[$key]))return false;
  foreach(cmsAtelierScriptIds() as $i=>$id){$c=$r['chapters'][$i];
    if(!is_array($c)||count($c)!==2||($c['id']??null)!==$id||!is_string($c['sha256']??null)||!preg_match('/^[a-f0-9]{64}$/D',$c['sha256']))return false;
  }
  $expected=substr(hash('sha256',implode("\n",array_merge([$r['creation_id'],(string)$r['creation_version'],$r['binding_sha256'],$r['recipe_sha256']],
    array_column($r['chapters'],'sha256'),[$r['voice'],$r['rights_sha256'],$r['reviews_sha256'],$r['provider']]))),0,48);
  return is_string($r['request_id'])&&hash_equals($expected,$r['request_id']);
}
function cmsCoralTtsAuthorityCheck(string $private,array $cfg,string $method,string $bearer,string $contentType,
  string $body,array $catalog,array $canonical,array $guided): array {
  try{$token=cmsCoralTtsAuthorityToken($private,$cfg);}catch(Throwable $e){return [404,['error'=>'TTS_AUTHORITY_UNAVAILABLE']];}
  if($method!=='POST')return [405,['error'=>'TTS_AUTHORITY_METHOD']];
  if(!hash_equals('Bearer '.$token,$bearer))return [401,['error'=>'TTS_AUTHORITY_UNAUTHORIZED']];
  try{
    cmsCoralTtsAuthorityRate($private);
    if(strlen($body)>6000||!preg_match('~^application/json(?:;\s*charset=utf-8)?$~iD',$contentType))
      return [422,['error'=>'TTS_AUTHORITY_REQUEST']];
    $q=json_decode($body,true,20,JSON_THROW_ON_ERROR);
    if(!is_array($q)||count($q)!==3||($q['contract']??null)!=='cdc-coral-tts-authority-check-v1'
      ||!is_string($q['challenge']??null)||!preg_match('/^[a-f0-9]{64}$/D',$q['challenge'])
      ||!is_array($q['request']??null))return [422,['error'=>'TTS_AUTHORITY_REQUEST']];
    $r=$q['request'];$allowed=false;if(!cmsCoralTtsAuthoritySelectorValid($r))return [422,['error'=>'TTS_AUTHORITY_REQUEST']];
    // The request is a selector, NEVER an authorization. Rebuild from CURRENT server journals.
    $id=cmsCreationId($r['creation_id']??null);$job=$r['request_id']??'';
    if($id!==null&&is_string($job)&&preg_match('/^[a-f0-9]{48}$/D',$job)){
      try{
        $allowed=cmsCoralTtsLocked($private,$id,static function($dir,$record)use($private,$id,$job,$r,$catalog,$canonical,$guided){
          $current=cmsCoralTtsRequest($private,$record,$catalog,$canonical,$guided);
          // This immutable server record exists only after the human generation confirmation.
          $confirmed=cmsCoralTtsStoredRequest($private,$id,$job);
          return $confirmed===$current&&cmsCoralTtsAuthorityProjection($current)===cmsCoralTtsAuthorityProjection($r);
        });
      }catch(Throwable $e){$allowed=false;}
    }
    return [200,['contract'=>'cdc-coral-tts-authority-check-v1','challenge'=>$q['challenge'],
      'request_id'=>is_string($job)&&preg_match('/^[a-f0-9]{48}$/D',$job)?$job:'','authorized'=>$allowed]];
  }catch(Throwable $e){return [503,['error'=>'TTS_AUTHORITY_UNAVAILABLE']];}
}
function cmsCoralTtsStoredRequest(string $private,string $id,string $job): array {
  if(!cmsCreationId($id)||!preg_match('/^[a-f0-9]{48}$/D',$job))throw new RuntimeException('TTS_JOB_ID');
  $r=cmsCoralTtsRead(cmsCreationDir($private).'/tts-request-'.$job.'.json');
  if(($r['creation_id']??null)!==$id||($r['request_id']??null)!==$job)throw new RuntimeException('TTS_JOB_ID');return $r;
}
function cmsCoralTtsSubmit(string $private,string $id,int $version,bool $confirmed,bool $authenticated,
  array $settings,array $catalog,array $canonical,array $guided): string {
  if(!$confirmed||!$authenticated||cmsCoralTtsSettings(['editorial_tts'=>$settings])===null)throw new RuntimeException('TTS_DISABLED');
  $r=cmsCoralTtsLocked($private,$id,static function($dir,$record)use($private,$version,$catalog,$canonical,$guided){
    if($record['version']!==$version)throw new RuntimeException('TTS_VERSION_STALE');
    $r=cmsCoralTtsRequest($private,$record,$catalog,$canonical,$guided);$file=$dir.'/tts-request-'.$r['request_id'].'.json';
    if(file_exists($file)){if(cmsCoralTtsRead($file)!==$r)throw new RuntimeException('TTS_JOB_CONFLICT');}
    else cmsCoralTtsWrite($file,$r);return $r;
  });
  try{$s=($settings['submit'])($r,$r['request_id']);
    if(($s['id']??null)!==$r['request_id'])throw new RuntimeException('TTS_ACK');
  }catch(Throwable $e){throw new RuntimeException('TTS_ACK_UNKNOWN_NO_AUTO_RETRY');}
  return $r['request_id'];
}
function cmsCoralTtsObserve(string $private,string $id,string $job,array $settings,array $catalog,array $canonical,array $guided): array {
  $r=cmsCoralTtsStoredRequest($private,$id,$job);
  if(!cmsCoralTtsAuthorize($private,$r,$catalog,$canonical,$guided))throw new RuntimeException('TTS_AUTHORIZATION_STALE');
  try{$s=($settings['poll'])($job);}catch(Throwable $e){throw new RuntimeException('TTS_STATUS_UNAVAILABLE');}
  if(($s['id']??null)!==$job||!in_array($s['status']??null,['queued','running','interrupted','uncertain','succeeded'],true)
    ||!is_int($s['completed_chapters']??null)||$s['completed_chapters']<0||$s['completed_chapters']>7)throw new RuntimeException('TTS_STATUS_INVALID');
  if($s['status']==='succeeded'){
    $m=json_decode($s['result']??'',true,32,JSON_THROW_ON_ERROR);
    if(!is_array($m)||($m['contract']??null)!=='cdc-coral-private-tts-result-v1'||($m['request_id']??null)!==$job||($m['binding_sha256']??null)!==$r['binding_sha256']
      ||!preg_match('/^[a-f0-9]{64}$/D',$m['sha256']??'')||($m['format']??null)!=='mp3'||($m['simulated']??null)!==true
      ||!is_numeric($m['duration']??null)||$m['duration']<=0||$m['duration']>7200
      ||!is_int($m['bytes']??null)||$m['bytes']<1||$m['bytes']>32000000||count($m['chapters']??[])!==7)
      throw new RuntimeException('TTS_RESULT_INVALID');
    $previous=0.0;foreach(cmsAtelierScriptIds() as $i=>$chapter){$c=$m['chapters'][$i];
      if(($c['id']??null)!==$chapter||!is_numeric($c['start']??null)||!is_numeric($c['end']??null)
        ||abs($c['start']-$previous)>0.002||$c['end']<=$c['start']||$c['end']>$m['duration']+0.15)throw new RuntimeException('TTS_CHAPTERS_INVALID');
      $previous=(float)$c['end'];}
    $s['manifest']=$m;
  }
  return $s;
}
function cmsCoralTtsResume(string $private,string $id,int $version,string $job,bool $confirmed,array $settings,
  array $catalog,array $canonical,array $guided): void {
  if(!$confirmed||cmsCoralTtsSettings(['editorial_tts'=>$settings])===null)throw new RuntimeException('TTS_CONFIRM_REQUIRED');
  $record=cmsCreationRead(cmsCreationDir($private),$id);
  if(!$record||$record['version']!==$version)throw new RuntimeException('TTS_VERSION_STALE');
  $r=cmsCoralTtsStoredRequest($private,$id,$job);
  if(!cmsCoralTtsAuthorize($private,$r,$catalog,$canonical,$guided))throw new RuntimeException('TTS_AUTHORIZATION_STALE');
  try{($settings['resume'])($job);}catch(Throwable $e){throw new RuntimeException('TTS_RESUME_REFUSED');}
}
function cmsCoralTtsAudio(string $private,string $id,string $job,array $settings,array $catalog,array $canonical,array $guided): string {
  $s=cmsCoralTtsObserve($private,$id,$job,$settings,$catalog,$canonical,$guided);
  if($s['status']!=='succeeded')throw new RuntimeException('TTS_AUDIO_UNAVAILABLE');
  try{$bytes=($settings['artifact'])($job);}catch(Throwable $e){throw new RuntimeException('TTS_AUDIO_UNAVAILABLE');}
  if(!is_string($bytes)||strlen($bytes)!==$s['manifest']['bytes']
    ||!hash_equals($s['manifest']['sha256'],hash('sha256',$bytes)))throw new RuntimeException('TTS_AUDIO_INTEGRITY');
  return $bytes;
}
/** Same bounded single-range protocol as worker; never replaces authorization or SHA validation. */
function cmsCoralTtsByteRange(?string $header,int $length): array {
  if($header===null)return [200,0,$length-1];
  if(strlen($header)>80||!preg_match('/^bytes=(\d*)-(\d*)$/D',$header,$m)||($m[1]===''&&$m[2]===''))return [416,0,-1];
  $a=$m[1]===''?null:filter_var(ltrim($m[1],'0')?:'0',FILTER_VALIDATE_INT,['options'=>['min_range'=>0]]);
  $b=$m[2]===''?null:filter_var(ltrim($m[2],'0')?:'0',FILTER_VALIDATE_INT,['options'=>['min_range'=>0]]);
  if($a===false||$b===false||($a!==null&&$a>9007199254740991)||($b!==null&&$b>9007199254740991))return [416,0,-1];
  if($a===null)return $b>0?[206,max(0,$length-$b),$length-1]:[416,0,-1];
  if($a>=$length||($b!==null&&$b<$a))return [416,0,-1];
  return [206,$a,$b===null?$length-1:min($b,$length-1)];
}
function cmsCoralTtsListeningAction(string $private,string $id,int $version,string $job,string $action,array $checks,
  string $note,bool $confirmed,bool $authenticated,array $settings,array $catalog,array $canonical,array $guided): void {
  $s=cmsCoralTtsObserve($private,$id,$job,$settings,$catalog,$canonical,$guided);
  if($s['status']!=='succeeded')throw new RuntimeException('TTS_AUDIO_UNAVAILABLE');
  cmsCoralTtsAudio($private,$id,$job,$settings,$catalog,$canonical,$guided);
  cmsCoralTtsDecision($private,$id,$version,'listening',$action,$checks,$note,$confirmed,$authenticated,
    $catalog,$canonical,$guided,$s['manifest']['sha256']);
}
function cmsCoralTtsPanel(string $private,?array $record,array $catalog,array $canonical,array $guided,string $csrf,?array $settings,string $filtersUrl=''): string {
  if(!$record||($record['kind']??null)!=='atelier'||$settings===null)return '';
  $id=$record['id'];$version=$record['version'];$dir=cmsCreationDir($private);
  $base='?new=1&amp;cid='.cmsEsc($id).($filtersUrl!==''?'&amp;'.cmsEsc($filtersUrl):'');$binding=null;$ready=null;$rights=null;
  try{$binding=cmsCoralTtsBinding($record,$catalog,$canonical,$guided);$rights=cmsCoralTtsJournal($dir,$id,'rights');}catch(Throwable $e){}
  try{$ready=cmsCoralTtsRequest($private,$record,$catalog,$canonical,$guided);}catch(Throwable $e){}
  $hidden='<input type="hidden" name="csrf" value="'.cmsEsc($csrf).'">'
    .'<input type="hidden" name="creation_id" value="'.cmsEsc($id).'">'
    .'<input type="hidden" name="expected_version" value="'.$version.'">';
  $html='<section id="cms-tts" data-coral-tts-panel><h2>Audio privé — simulation technique</h2>'
    .'<p>Signal audio de test, pas une voix Coral. Aucun appel payant et aucune publication.</p>'
    .'<p>Voix : signal test-tone. Réservation simulée : 0,007 USD au maximum ; coût fournisseur réel : 0 USD.</p>';
  try{$gate=cmsAtelierCoralPrereception($private,$record,$catalog,$canonical,$guided);
    $html.='<p>Textes visés : '.(int)$gate['human_text_visas_count'].'/7. Revue culinaire : '
      .(($gate['checks'][4]['complete']??false)?'active':'manquante').'.</p>';
  }catch(Throwable $e){$html.='<p>Contrôles indisponibles : génération bloquée.</p>';}
  if($binding!==null){
    $last=$rights['events']?end($rights['events']):null;
    $active=$last&&$last['action']==='approve'&&$last['creation_version']===$version&&$last['binding_sha256']===$binding['binding_sha256'];
    $html.='<form method="post" class="stack" action="'.$base.'#cms-tts">'.$hidden;
    if(!$active)foreach(['voice'=>'Je peux utiliser le signal vocal de test choisi.',
      'content'=>'Je dispose des droits nécessaires sur ces textes et contenus.',
      'private_audio'=>'J’autorise une version audio privée de cette version exacte.'] as $k=>$label)
      $html.='<label><input type="checkbox" name="tts_checks['.$k.']" value="1" required> '.cmsEsc($label).'</label>';
    $html.='<label>Note de décision<textarea name="tts_note" minlength="20" maxlength="900" required></textarea></label>'
      .'<label><input type="checkbox" name="tts_confirm" value="1" required> Je confirme personnellement cette décision pour cette version.</label>'
      .'<button name="tts_action" value="'.($active?'revoke_rights':'approve_rights').'">'
      .($active?'Révoquer les droits audio':'Enregistrer les droits audio privés').'</button></form>';
  }
  $job=null;$state=null;$paths=glob($dir.'/tts-request-*.json');
  if(!is_array($paths)||count($paths)>250)throw new RuntimeException('TTS_REQUEST_CAPACITY');
  foreach($paths as $p){$r=cmsCoralTtsRead($p);
    if(($r['creation_id']??null)===$id&&($r['creation_version']??null)===$version
      &&($ready===null||$r['request_id']===$ready['request_id']))$job=$r['request_id'];}
  if($job!==null){
    try{$state=cmsCoralTtsObserve($private,$id,$job,$settings,$catalog,$canonical,$guided);}catch(Throwable $e){}
    $labels=['queued'=>'Génération demandée — en attente','running'=>'Génération en cours','interrupted'=>'Génération interrompue',
      'uncertain'=>'Génération interrompue — réponse incertaine, aucun nouvel essai','succeeded'=>'MP3 prêt pour écoute'];
    $html.='<p data-tts-status>'.cmsEsc($labels[$state['status']??'']??'Suivi indisponible ou autorisation périmée : aucun renvoi automatique.').'</p>';
    if($state!==null)$html.='<p>Chapitres terminés : '.(int)$state['completed_chapters'].'/7.</p>';
    $html.='<a href="'.$base.'#cms-tts">Actualiser le suivi sans relancer</a>';
    if(($state['status']??null)==='interrupted')$html.='<form method="post" action="'.$base.'#cms-tts">'.$hidden
      .'<input type="hidden" name="tts_job" value="'.cmsEsc($job).'">'
      .'<label><input type="checkbox" name="tts_confirm" value="1" required> Reprendre uniquement les fragments vérifiables manquants.</label>'
      .'<button name="tts_action" value="resume">Reprendre la génération interrompue</button></form>';
    if(($state['status']??null)==='succeeded'){
      $html.='<audio controls preload="metadata" src="?new=1&amp;cid='.cmsEsc($id).'&amp;tts_file='.cmsEsc($job).'"></audio><ol>';
      foreach($state['manifest']['chapters'] as $c)$html.='<li>'.cmsEsc($c['id']).' : '.cmsEsc((string)$c['start']).'–'.cmsEsc((string)$c['end']).' s</li>';
      $html.='</ol>';$journal=cmsCoralTtsJournal($dir,$id,'listening');$last=$journal['events']?end($journal['events']):null;
      $approved=$last&&$last['action']==='approve'&&$last['creation_version']===$version
        &&$last['binding_sha256']===($binding['binding_sha256']??null)&&$last['artifact_sha256']===$state['manifest']['sha256'];
      if($approved)$html.='<p data-tts-approved>MP3 approuvé — contrôle technique privé de cette simulation uniquement, sans publication.</p>';
      $html.='<form method="post" class="stack" action="'.$base.'#cms-tts">'.$hidden
        .'<input type="hidden" name="tts_job" value="'.cmsEsc($job).'">';
      if(!$approved)foreach(['full_listening'=>'J’ai écouté intégralement le fichier de test exact.',
        'chapter_order'=>'J’ai vérifié les sept chapitres de ce fichier.'] as $k=>$label)
        $html.='<label><input type="checkbox" name="tts_checks['.$k.']" value="1" required> '.cmsEsc($label).'</label>';
      $html.='<label>Note d’écoute<textarea name="tts_note" minlength="20" maxlength="900" required></textarea></label>'
        .'<label><input type="checkbox" name="tts_confirm" value="1" required> Décision personnelle, distincte de toute publication.</label>'
        .'<button name="tts_action" value="'.($approved?'revoke_audio':'approve_audio').'">'
        .($approved?'Révoquer cette approbation audio':'Approuver ce MP3 de test').'</button></form>';
    }
  }else{
    $html.='<form method="post" action="'.$base.'#cms-tts">'.$hidden;
    if($ready!==null)$html.='<label><input type="checkbox" name="tts_confirm" value="1" required> Je confirme la génération privée simulée de cette version et la réservation affichée.</label>';
    $html.='<button name="tts_action" value="generate"'.($ready===null?' disabled aria-disabled="true"':'').'>Valider et générer le MP3</button></form>';
    $html.='<p data-tts-readiness>'.($ready===null?'Autorisations incomplètes.':'Prêt pour génération — confirmation requise.').'</p>';
    if($ready===null)$html.='<p>Manquent les sept visas actifs, la revue culinaire, les droits ou une source complète et courante.</p>';
  }
  return $html.'<p>Publication non autorisée. Aucun remplacement des anciens MP3. La publication reste une décision distincte et indisponible ici.</p></section>';
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
/** Complete private proposal, same form/queue, separately qualified and closed by default. */
function cmsCoralNextWorkshop(array $creations,array $catalog,array $settings): array {
  cmsCalendarPlan($creations,gmdate('Y-m'));$eligible=[];$dated=[];
  $excluded=$settings['workshop_excluded_creation_ids']??[];
  foreach($creations as $r){
    if($r['kind']!=='atelier'||isset($r['source_binding'])||in_array($r['id'],$excluded,true))continue;
    try{cmsCreationDuplicateCheck('atelier',$r['slug'],$catalog,[],$r['id']);}
    catch(InvalidArgumentException $e){if($e->getMessage()==='CREATION_DUPLICATE')continue;throw $e;}
    $eligible[$r['id']]=$r;if(($r['target_date']??null)!==null)$dated[]=$r;
  }
  usort($dated,static fn(array $a,array $b):int=>strcmp($a['target_date'],$b['target_date'])?:strcmp($a['id'],$b['id']));
  $r=$dated[0]??($eligible[$settings['workshop_creation_id']??'']??null);
  if(!is_array($r)||$r['id']!==($settings['workshop_creation_id']??null))throw new RuntimeException('CORAL_WORKSHOP_PRIORITY_NOT_AUTHORIZED');
  foreach($r['atelier_scripts']['chapters']??[] as $chapter)
    if(trim((string)($chapter['text']??''))!=='')throw new RuntimeException('CORAL_WORKSHOP_ALREADY_PREPARED');
  $slug=$r['atelier_reference']['recipeSlug']??'';
  if($slug==='')throw new RuntimeException('CORAL_RECIPE_STALE');
  foreach($eligible as $other)if($other['id']!==$r['id']&&($other['atelier_reference']['recipeSlug']??'')===$slug)
    throw new RuntimeException('CORAL_WORKSHOP_DUPLICATE_SOURCE');
  cmsCreationDuplicateCheck('atelier',$r['slug'],$catalog,$eligible,$r['id']);
  return $r; // Selection only; no save, provider, scheduling or approval.
}
function cmsCoralWorkshopInputDigest(array $draft): string {
  return hash('sha256',json_encode([$draft['id']??null,$draft['version']??null,$draft['title']??null,
    $draft['angle']??null,$draft['fields']??null,$draft['atelier_reference']??null],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR));
}
function cmsCoralWorkshopSchema(): array {
  $text=static fn(int $max,int $min=1):array=>['type'=>'string','minLength'=>$min,'maxLength'=>$max];
  $list=static fn(array $item,int $min,int $max):array=>['type'=>'array','items'=>$item,'minItems'=>$min,'maxItems'=>$max];
  $object=static fn(array $props):array=>['type'=>'object','properties'=>$props,'required'=>array_keys($props),'additionalProperties'=>false];
  $form=cmsAiContentSchema('atelier')['properties']['fields'];
  $form['properties']['beforeStarting']['maxItems']=10;
  $phase=$object(['id'=>['type'=>'string','minLength'=>1,'maxLength'=>16,'enum'=>cmsAtelierPhaseIds()],
    'minutes'=>['type'=>'integer','minimum'=>1,'maximum'=>240],
    'ingredientNames'=>$list($text(200),1,20),'actions'=>$list($text(500),1,4),
    'observe'=>$text(600),'check'=>$text(600),'mistake'=>$text(600),'recovery'=>$text(600),
    'safety'=>$text(600),'pausePrompt'=>$text(400)]);
  return $object(['summary'=>$text(200),'research_note'=>$text(2000),
    'profile'=>$object(['difficulty'=>['type'=>'string','minLength'=>1,'maxLength'=>20,'enum'=>['Facile','Intermédiaire','Avancé']],
      'practicalMinutes'=>['type'=>'integer','minimum'=>1,'maximum'=>600],
      'waitingNote'=>$text(500,0),'allergens'=>$list($text(80),0,12),'safety'=>$list($text(500),1,8)]),
    'fields'=>$form,
    'phase_details'=>$list($phase,6,6),
    'chapters'=>$list($object(['id'=>['type'=>'string','minLength'=>1,'maxLength'=>16,'enum'=>cmsAtelierScriptIds()],
      'text'=>$text(1800,300)]),7,7)]);
}
function cmsCoralWorkshopResearch(mixed $raw,string $recipeSha): array {
  if(!is_array($raw)||array_keys($raw)!==['recipe_sha256','verified_at','sources','cooking_test_performed']
    ||($raw['recipe_sha256']??null)!==$recipeSha||($raw['cooking_test_performed']??null)!==false
    ||!is_string($raw['verified_at']??null)||!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$raw['verified_at'])
    ||!is_array($raw['sources']??null)||count($raw['sources'])<2||count($raw['sources'])>5)throw new InvalidArgumentException('CORAL_WORKSHOP_RESEARCH');
  $date=$raw['verified_at'];
  if(!checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4))||$date>gmdate('Y-m-d'))throw new InvalidArgumentException('CORAL_WORKSHOP_RESEARCH');
  $hosts=[];
  foreach($raw['sources'] as $s){
    if(!is_array($s)||array_keys($s)!==['title','url','note'])throw new InvalidArgumentException('CORAL_WORKSHOP_RESEARCH');
    foreach(['title'=>180,'url'=>500,'note'=>2000] as $key=>$max)
      if(!is_string($s[$key])||cmsCreationText($s[$key],$max)==='')throw new InvalidArgumentException('CORAL_WORKSHOP_RESEARCH');
    $u=parse_url($s['url']);
    if(!is_array($u)||($u['scheme']??null)!=='https'||empty($u['host'])||isset($u['user'])||isset($u['pass'])
      ||isset($u['query'])||isset($u['fragment'])||preg_match('/[\x00-\x20\x7f]/',$s['url']))throw new InvalidArgumentException('CORAL_WORKSHOP_RESEARCH');
    $hosts[$u['host']]=true;
  }
  if(count($hosts)<2||strlen(json_encode($raw,JSON_THROW_ON_ERROR))>10000)throw new InvalidArgumentException('CORAL_WORKSHOP_RESEARCH');
  return $raw;
}
function cmsCoralWorkshopRequest(array $draft,array $catalog,array $canonical,array $guided,array $research=[]): array {
  if(($draft['kind']??null)!=='atelier'||!cmsCreationId($draft['id']??null)
    ||!is_int($draft['version']??null)||isset($draft['source_binding']))throw new InvalidArgumentException('CORAL_WORKSHOP_SAVED_PRIVATE_REQUIRED');
  foreach($draft['atelier_scripts']['chapters']??[] as $c)
    if(trim((string)($c['text']??''))!==''||trim((string)($c['editorNote']??''))!=='')throw new InvalidArgumentException('CORAL_SCRIPT_EXISTS');
  $ref=cmsAtelierReferenceClean($draft['atelier_reference']??null,$catalog);$id='recette:'.($ref['recipeSlug']??'');
  $c=$canonical[$id]??[];$g=$guided[$id]??[];
  if(($c['model']??null)!=='recipes'||($g['model']??null)!=='recipes'
    ||!preg_match('/^[a-f0-9]{64}$/D',$c['fingerprint']??'')
    ||($g['fingerprint']??null)!==$c['fingerprint']||!is_array($g['fields']['ingredients']??null)
    ||!is_array($g['fields']['steps']??null))throw new InvalidArgumentException('CORAL_RECIPE_STALE');
  $formFields=$draft['fields']??[];
  foreach(cmsCreationSchema()['atelier'] as $key=>$spec){
    if($spec[1]!=='list'||!is_array($formFields[$key]??null))continue;
    foreach($formFields[$key] as $line)if(!is_string($line))throw new InvalidArgumentException('CORAL_SOURCE_INCOMPLETE');
    $formFields[$key]=implode("\n",$formFields[$key]);
  }
  $fields=cmsCreationCleanFields('atelier',$formFields);$policy=cmsCoralPolicy();
  $brief=['kind'=>'atelier','title'=>$draft['title'],'angle'=>$draft['angle'],
    'objective'=>$fields['learningGoal']?:$draft['title'],'context'=>$draft['summary']??'','reference_id'=>$id];
  $r=['contract'=>'cdc-coral-v2-workshop-request-v1','scope'=>'workshop-complete-draft-v1',
    'creation_id'=>$draft['id'],'creation_version'=>$draft['version'],'binding_digest'=>cmsCoralWorkshopInputDigest($draft),
    'canonical_fingerprint'=>$c['fingerprint'],'brief'=>$brief,
    'atelier'=>['title'=>$draft['title'],'fields'=>$fields,'recipeSlug'=>$ref['recipeSlug']],
    'reference'=>['id'=>$id,'recipe_fields'=>$g['fields']],
    'culinary_evidence'=>cmsCoralWorkshopResearch($research,$c['fingerprint']),
    'referentials'=>['structure'=>$policy['structure'],'narration'=>$policy['narration']],
    'response_schema'=>cmsCoralWorkshopSchema(),'timeout_seconds'=>20,'response_max_bytes'=>30000,'max_output_tokens'=>6000];
  if(strlen(json_encode($r,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR))>90000)throw new RuntimeException('CORAL_REQUEST_OVERSIZE');
  return $r;
}
function cmsCoralWorkshopCandidate(array $request,mixed $wire,array $settings,array $catalog): array {
  if(!is_string($wire)||strlen($wire)>30000)throw new InvalidArgumentException('CORAL_RESPONSE');
  try{$out=cmsAiContentValue(json_decode($wire,false,16,JSON_THROW_ON_ERROR),cmsCoralWorkshopSchema());}
  catch(Throwable $e){throw new InvalidArgumentException('CORAL_RESPONSE');}
  $profile=$out['profile'];
  if(!in_array($profile['difficulty'],['Facile','Intermédiaire','Avancé'],true)
    ||array_sum(array_column($out['phase_details'],'minutes'))!==$profile['practicalMinutes']
    ||($request['atelier']['recipeSlug']==='amok-trey'&&array_diff(['poisson','œuf'],$profile['allergens'])))
    throw new InvalidArgumentException('CORAL_WORKSHOP_PROFILE');
  // Explicit projection into the EXISTING editable public preparation list.
  // The typed profile remains traceable in the private provider output/hash.
  $form=$out['fields'];$prefix=['Niveau proposé : '.$profile['difficulty'],
    'Durée de travail estimée : '.$profile['practicalMinutes'].' minutes — à vérifier à la relecture.',
    'Allergènes à vérifier : '.($profile['allergens']?implode(', ',$profile['allergens']):'vérifier la recette et les étiquettes des ingrédients').'.'];
  if($profile['waitingNote']!=='')$prefix[]=$profile['waitingNote'];
  $form['beforeStarting']=array_merge($prefix,$profile['safety'],$form['beforeStarting']);
  $core=['title'=>$request['brief']['title'],'angle'=>$request['brief']['angle'],
    'summary'=>$out['summary'],'research_note'=>$out['research_note'],'fields'=>$form];
  $candidate=cmsAiContentCandidate('atelier',json_encode($core,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR));
  $ref=cmsAtelierReferenceClean(['version'=>1,'recipeSlug'=>$request['atelier']['recipeSlug']],$catalog);
  $known=array_column($request['reference']['recipe_fields']['ingredients'],'name');$used=[];$phases=[];
  foreach(cmsAtelierPhaseIds() as $i=>$id){
    $p=$out['phase_details'][$i];
    if($p['id']!==$id||array_diff($p['ingredientNames'],$known))throw new InvalidArgumentException('CORAL_WORKSHOP_INGREDIENTS');
    if($i>0)$used=array_merge($used,$p['ingredientNames']);
    $phases[]=array_merge(['index'=>$i,'sourceTitle'=>$candidate['fields']['phases'][$i]['title'],
      'sourceLearning'=>$candidate['fields']['phases'][$i]['learning']],$p);
  }
  if(array_diff($known,$used))throw new InvalidArgumentException('CORAL_WORKSHOP_INGREDIENTS');
  $details=cmsAtelierPhaseDetailsClean(['version'=>1,'recipeSlug'=>$ref['recipeSlug'],
    'catalogFingerprint'=>$ref['catalogFingerprint'],'phases'=>$phases],$candidate['fields'],$ref);
  if(!cmsAtelierPhaseDetailsComplete($details))throw new InvalidArgumentException('CORAL_SOURCE_INCOMPLETE');
  $public=json_encode([$candidate['title'],$candidate['summary'],$candidate['fields'],$details],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
  if(preg_match('/(?<!\p{L})(?:fabriqu\p{L}*|fabrication\p{L}*|constru\p{L}*|chantier\p{L}*|poste)(?!\p{L})/iu',$public))throw new InvalidArgumentException('CORAL_LEXICON_OR_VOICE');
  $scriptsRequest=$request;$scriptsRequest['binding_digest']=cmsAtelierScriptSourceDigest($candidate['fields'],$ref,$details);
  $scripts=cmsCoralCandidate($scriptsRequest,json_encode(['chapters'=>$out['chapters']],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR));
  $metadata=cmsAiContentMetadata(['contract'=>'cdc-editorial-ai-content-provenance-v1','kind'=>'atelier',
    'provider_label'=>$settings['provider_label'],'model_label'=>$settings['model_label'],
    'generated_at'=>gmdate('Y-m-d\TH:i:s\Z'),'request_contract'=>$request['contract'],'scope'=>$request['scope'],
    'brief_id'=>$request['creation_id'],'brief_version'=>$request['creation_version'],
    'brief_digest'=>hash('sha256',json_encode($request['brief'],JSON_THROW_ON_ERROR)),
    'input_title'=>$request['brief']['title'],'reference_id'=>$request['reference']['id'],
    'reference_fingerprint'=>$request['canonical_fingerprint'],'transmission_confirmed'=>true,
    'proposal'=>$core,'workshop_output_sha256'=>hash('sha256',$wire)]);
  return ['candidate'=>$candidate,'metadata'=>$metadata,'supplement'=>[
    'atelier_reference'=>$ref,'atelier_phase_details'=>$details,'atelier_scripts'=>$scripts]];
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
  $complete=($settings['workshop_complete_qualified']??false)===true
    &&!cmsAtelierPhaseDetailsComplete($draft['atelier_phase_details']??null);
  $request=$complete?cmsCoralWorkshopRequest($draft,$catalog,$canonical,$guided,$settings['workshop_research']??[]):cmsCoralRequest($draft,$catalog,$canonical,$guided);
  if(($settings['workshop_complete_qualified']??false)===true){
    if(($settings['workshop_creation_id']??null)!==$draft['id']
      ||($settings['workshop_recipe_sha256']??null)!==$request['canonical_fingerprint']
      ||($settings['workshop_expires_at']??0)<=time())throw new RuntimeException('CORAL_WORKSHOP_SCOPE');
    cmsAiContentPreflight($private,'atelier',$draft['title'],$catalog,$draft['id'],$draft['version']);
  }
  $provider=$settings['provider_label']??'';$model=$settings['model_label']??'';
  $key=hash('sha256',json_encode([$request,$draft['id'],$draft['version'],$provider,$model],JSON_THROW_ON_ERROR));
  $token=substr($key,0,48);
  return cmsAiContentJobLocked($private,$token,static function(?array $entry,string $path)use($private,$settings,$request,$draft,$provider,$model,$key,$token):array{
    if($entry!==null){
      $j=$entry['job'];
      if(($entry['fingerprint']??null)!==$key||isset($entry['save_attempt'])
        ||($j['request']??null)!==$request||($j['creation_id']??null)!==$draft['id']
        ||($j['creation_version']??null)!==$draft['version']
        ||($j['provider_label']??null)!==$provider||($j['model_label']??null)!==$model
        ||!in_array($j['status']??null,['queued','running','submission_unknown'],true))
        throw new RuntimeException('CORAL_JOB_REVIEW_REQUIRED');
      $j['expires_at']=time()+1800;return $j; // refresh observation, NEVER submit
    }
    cmsAiBriefReserve($private,$settings['max_attempts_per_day']);
    $job=['token'=>$token,'expires_at'=>time()+1800,'status'=>'submission_unknown',
      'creation_id'=>$draft['id'],'creation_version'=>$draft['version'],
      'expected_version'=>$draft['version'],
      'binding_digest'=>$request['binding_digest'],'request'=>$request,
      'provider_label'=>$provider,'model_label'=>$model];
    $entry=['contract'=>'cdc-editorial-submission-v1','fingerprint'=>$key,'job'=>$job];
    cmsAiContentJobWrite($path,$entry);
    try{$ack=($settings['submit'])($request,$token);}
    catch(Throwable $e){return $job;}
    if(!is_array($ack)||($ack['id']??null)!==$token
       ||!in_array($ack['status']??null,['queued','running','succeeded'],true))return $job;
    $job['status']=$ack['status']==='succeeded'?'queued':$ack['status'];
    $entry['job']=$job;cmsAiContentJobWrite($path,$entry);return $job;
  });
}
function cmsCoralPoll(array &$job,array $draft,array $settings,array $canonical,array $catalog=[]): ?array {
  $complete=($job['request']['contract']??null)==='cdc-coral-v2-workshop-request-v1';
  // Refuse a result if the published workshop changed during generation.
  if(array_key_exists('source_binding',$draft)){
    if(!is_array($draft['source_binding'])
      ||!cmsStudioBindingCurrent($draft['source_binding'],$catalog,$canonical))
      throw new RuntimeException('CORAL_SOURCE_STALE');
  }
  if(($job['creation_id']??null)!==($draft['id']??null)
    ||($job['creation_version']??null)!==($draft['version']??null)
    ||($job['expires_at']??0)<time()||($job['status']??null)==='failed'
    ||($job['binding_digest']??null)!==($complete?cmsCoralWorkshopInputDigest($draft):cmsAtelierScriptSourceDigest(
      $draft['fields'],$draft['atelier_reference'],$draft['atelier_phase_details'])))
    throw new RuntimeException('CORAL_STALE');
  $recipeId='recette:'.($draft['atelier_reference']['recipeSlug']??'');
  if(($canonical[$recipeId]['fingerprint']??null)!==($job['request']['canonical_fingerprint']??null))
    throw new RuntimeException('CORAL_CANONICAL_STALE');
  if(($settings['mode']??null)!=='async'||!is_callable($settings['poll']??null))
    throw new RuntimeException('CORAL_DISABLED');
  if($complete&&($settings['workshop_complete_qualified']??false)!==true)throw new RuntimeException('CORAL_DISABLED');
  if(($settings['workshop_complete_qualified']??false)===true&&(($settings['workshop_creation_id']??null)!==$draft['id']
    ||($settings['workshop_recipe_sha256']??null)!==($job['request']['canonical_fingerprint']??null)
    ||($settings['workshop_expires_at']??0)<=time()))throw new RuntimeException('CORAL_WORKSHOP_SCOPE');
  if($complete&&cmsCoralWorkshopResearch($settings['workshop_research']??null,$job['request']['canonical_fingerprint'])!==$job['request']['culinary_evidence'])throw new RuntimeException('CORAL_WORKSHOP_RESEARCH');
  foreach(['provider_label','model_label'] as $k)
    if(isset($job[$k])&&$job[$k]!==($settings[$k]??''))throw new RuntimeException('CORAL_PROVIDER_CHANGED');
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
  try{return $complete?cmsCoralWorkshopCandidate($job['request'],$answer['result']??null,$settings,$catalog):cmsCoralCandidate($job['request'],$answer['result']??null);}
  catch(Throwable $e){$job['status']='failed';throw $e;}
}
