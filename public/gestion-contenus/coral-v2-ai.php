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
    $labels=['queued'=>'En attente','running'=>'Génération en cours','interrupted'=>'Génération interrompue',
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
    if($ready===null)$html.='<p>Manquent les sept visas actifs, la revue culinaire, les droits ou une source complète et courante.</p>';
  }
  return $html.'<p>Aucun remplacement des anciens MP3. La publication reste une décision distincte et indisponible ici.</p></section>';
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
