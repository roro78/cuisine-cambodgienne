<?php
declare(strict_types=1);
/**
 * Real Coral voice: existing OVH Studio -> authenticated HTTPS job gateway.
 * No secrets in the client, no direct PHP/OpenAI call and no repeated submit.
 */
if(isset($_SERVER['SCRIPT_FILENAME'])&&realpath((string)$_SERVER['SCRIPT_FILENAME'])===__FILE__){
  http_response_code(404);exit;
}
function cmsCoralRealSpeechSettings(array $cfg,string $private): ?array {
  $s=$cfg['editorial_real_speech']??null;
  if(!is_array($s)||($s['enabled']??false)!==true)return null;
  if(($s['qualified']??false)!==true||($s['budget_verified']??false)!==true
    ||($s['base']??null)!=='https://n8n.orvekio.com/editorial-ai/v1/jobs')
    throw new RuntimeException('REAL_TTS_DISABLED');
  $file=$s['token_file']??null;
  if(!is_string($file)||is_link($file)||!is_file($file)||realpath(dirname($file))!==realpath($private)
    ||(PHP_OS_FAMILY!=='Windows'&&((fileperms($file)&0077)!==0||fileowner($file)!==fileowner($private))))
    throw new RuntimeException('REAL_TTS_TOKEN');
  $raw=file_get_contents($file);
  if(!is_string($raw)||strlen($raw)<32||strlen($raw)>513)throw new RuntimeException('REAL_TTS_TOKEN');
  $token=rtrim($raw,"\r\n");
  if(!preg_match('/^[\x21-\x7e]{32,512}$/D',$token))throw new RuntimeException('REAL_TTS_TOKEN');
  return ['base'=>$s['base'],'token'=>$token];
}
function cmsCoralRealSpeechTransport(array $settings,string $job,string $verb,?array $request=null): array|string {
  if(!preg_match('/^[a-f0-9]{48}$/D',$job)
    ||($settings['base']??null)!=='https://n8n.orvekio.com/editorial-ai/v1/jobs'
    ||!in_array($verb,['submit','poll','audio','preview','resume'],true)||!function_exists('curl_init'))
    throw new RuntimeException('REAL_TTS_GATEWAY');
  $body=$request===null?null:json_encode($request,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
  if(($verb==='submit')!==($body!==null)||($body!==null&&strlen($body)>90000))
    throw new RuntimeException('REAL_TTS_REQUEST');
  $url=$settings['base'].'/'.$job.(in_array($verb,['audio','preview','resume'],true)?'/'.$verb:'');
  $curl=curl_init($url);if($curl===false)throw new RuntimeException('REAL_TTS_GATEWAY');
  $raw='';$max=in_array($verb,['audio','preview'],true)?32000000:150000;
  try {
    curl_setopt_array($curl,[
      CURLOPT_CUSTOMREQUEST=>$verb==='submit'?'PUT':($verb==='resume'?'POST':'GET'),
      CURLOPT_FOLLOWLOCATION=>false,CURLOPT_SSL_VERIFYPEER=>true,
      CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_CONNECTTIMEOUT=>4,
      CURLOPT_TIMEOUT=>$verb==='audio'?40:12,
      CURLOPT_HTTPHEADER=>[
        'Authorization: Bearer '.$settings['token'],
        'Accept: '.($verb==='audio'?'audio/mpeg':($verb==='preview'?'audio/wav':'application/json')),
        'Content-Type: application/json','Cache-Control: no-store'
      ],
      CURLOPT_WRITEFUNCTION=>static function($c,string $bytes)use(&$raw,$max):int{
        if(strlen($raw)+strlen($bytes)>$max)return 0;
        $raw.=$bytes;return strlen($bytes);
      }
    ]);
    if($body!==null)curl_setopt($curl,CURLOPT_POSTFIELDS,$body);
    if(defined('CURLOPT_PROTOCOLS_STR'))curl_setopt($curl,constant('CURLOPT_PROTOCOLS_STR'),'https');
    elseif(defined('CURLOPT_PROTOCOLS'))curl_setopt($curl,CURLOPT_PROTOCOLS,CURLPROTO_HTTPS);
    $ok=curl_exec($curl);$code=(int)curl_getinfo($curl,CURLINFO_RESPONSE_CODE);
    $mime=(string)curl_getinfo($curl,CURLINFO_CONTENT_TYPE);
    if($ok!==true||!in_array($code,in_array($verb,['submit','resume'],true)?[200,202]:[200],true))
      throw new RuntimeException('REAL_TTS_GATEWAY_UNCERTAIN');
    if($verb==='audio'||$verb==='preview'){
      $mimeExpected=$verb==='preview'?'~^audio/(wav|x-wav)(?:;|$)~i':'~^audio/(mpeg|mp3)(?:;|$)~i';
      if(strlen($raw)<48||!preg_match($mimeExpected,$mime))
        throw new RuntimeException('REAL_TTS_MP3');
      return $raw;
    }
    if(strlen($raw)>120000||!str_starts_with(strtolower($mime),'application/json'))
      throw new RuntimeException('REAL_TTS_RESPONSE');
    $state=json_decode($raw,true,24,JSON_THROW_ON_ERROR);
    if(!is_array($state)||($state['id']??null)!==$job
      ||!in_array($state['status']??null,['queued','running','awaiting_preview_approval','interrupted','uncertain','succeeded'],true))
      throw new RuntimeException('REAL_TTS_RESPONSE');
    return $state;
  }finally{curl_close($curl);}
}
function cmsCoralRealSpeechRequestStored(string $private,string $id,string $job): array {
  if(!preg_match('/^c-[a-f0-9]{24}$/D',$id)||!preg_match('/^[a-f0-9]{48}$/D',$job))
    throw new RuntimeException('REAL_TTS_JOB');
  $r=cmsCoralTtsRead(cmsCreationDir($private).'/real-tts-request-'.$job.'.json');
  if(($r['request_id']??null)!==$job||($r['creation_id']??null)!==$id)
    throw new RuntimeException('REAL_TTS_JOB');
  return $r;
}
function cmsCoralRealSpeechStart(
  string $private,array $record,array $settings,
  array $catalog,array $canonical,array $guided
): string {
  $r=cmsCoralRealSpeechApprovedRequest($private,$record,$catalog,$canonical,$guided);
  $job=$r['request_id'];$id=$r['creation_id'];
  $previous=false;
  cmsCoralTtsLocked($private,$id,static function($dir,$saved)use($private,$r,$job,&$previous):void{
    if($saved['version']!==$r['creation_version'])
      throw new RuntimeException('REAL_TTS_STALE');
    $file=$dir.'/real-tts-request-'.$job.'.json';
    if(file_exists($file)){
      if(cmsCoralTtsRead($file)!==$r)throw new RuntimeException('REAL_TTS_CONFLICT');
      $previous=true;return;
    }
    cmsCoralTtsWrite($file,$r); // Irreversible intent BEFORE network.
  });
  if($previous)return $job; // Do not resend after an unknown paid request.
  try {
    $ack=cmsCoralRealSpeechTransport($settings,$job,'submit',$r);
    if(!is_array($ack)||$ack['id']!==$job)throw new RuntimeException('REAL_TTS_ACK');
  }catch(Throwable $e){
    // The same job ID remains for safe GET polling; no automatic PUT retry.
  }
  return $job;
}
function cmsCoralRealSpeechObserve(
 string $private,string $id,string $job,array $settings,
 array $catalog,array $canonical,array $guided
): array {
  $r=cmsCoralRealSpeechRequestStored($private,$id,$job);
  $record=cmsCreationRead(cmsCreationDir($private),$id);
  if(!is_array($record)||cmsCoralRealSpeechApprovedRequest($private,$record,$catalog,$canonical,$guided)!==$r)
    throw new RuntimeException('REAL_TTS_AUTHORITY');
  $state=cmsCoralRealSpeechTransport($settings,$job,'poll');
  if(!is_array($state))throw new RuntimeException('REAL_TTS_STATE');
  if($state['status']==='succeeded'){
    $m=json_decode($state['result']??'',true,32,JSON_THROW_ON_ERROR);
    if(!is_array($m)||($m['contract']??null)!=='cdc-coral-real-speech-result-v1'
      ||($m['request_id']??null)!==$job||($m['binding_sha256']??null)!==$r['binding_sha256']
      ||($m['voice']??null)!=='coral'||($m['model']??null)!=='gpt-4o-mini-tts'
      ||($m['speed']??null)!==0.93||($m['simulated']??true)!==false
      ||($m['format']??null)!=='mp3'||!preg_match('/^[a-f0-9]{64}$/D',$m['sha256']??'')
      ||!is_int($m['bytes']??null)||$m['bytes']<1024||$m['bytes']>32000000
      ||!is_array($m['chapters']??null)||count($m['chapters'])!==7)
      throw new RuntimeException('REAL_TTS_RESULT');
    $state['manifest']=$m;
  }
  return $state;
}
function cmsCoralRealSpeechAudio(
 string $private,string $id,string $job,array $settings,
 array $catalog,array $canonical,array $guided
): string {
  $state=cmsCoralRealSpeechObserve($private,$id,$job,$settings,$catalog,$canonical,$guided);
  if($state['status']!=='succeeded')throw new RuntimeException('REAL_TTS_NOT_READY');
  $bytes=cmsCoralRealSpeechTransport($settings,$job,'audio');
  if(!is_string($bytes)||strlen($bytes)!==$state['manifest']['bytes']
    ||!hash_equals($state['manifest']['sha256'],hash('sha256',$bytes)))
    throw new RuntimeException('REAL_TTS_SHA');
  return $bytes;
}

function cmsCoralRealSpeechPreview(
 string $private,string $id,string $job,array $settings,
 array $catalog,array $canonical,array $guided
): string {
  $state=cmsCoralRealSpeechObserve($private,$id,$job,$settings,$catalog,$canonical,$guided);
  if(!in_array($state['status'],['awaiting_preview_approval','interrupted','succeeded'],true))
    throw new RuntimeException('REAL_TTS_PREVIEW_NOT_READY');
  $bytes=cmsCoralRealSpeechTransport($settings,$job,'preview');
  if(!is_string($bytes)||strlen($bytes)<48
    ||substr($bytes,0,4)!=='RIFF'||substr($bytes,8,4)!=='WAVE')
    throw new RuntimeException('REAL_TTS_PREVIEW_WAV');
  return $bytes;
}
/** Human preview approval is a separate, one-shot Studio action. */
function cmsCoralRealSpeechApprovePreview(
 string $private,array $record,string $job,array $settings,
 array $catalog,array $canonical,array $guided
): void {
  $r=cmsCoralRealSpeechApprovedRequest($private,$record,$catalog,$canonical,$guided);
  if($r['request_id']!==$job)throw new RuntimeException('REAL_TTS_JOB');
  $s=cmsCoralRealSpeechObserve($private,$record['id'],$job,$settings,$catalog,$canonical,$guided);
  if(($s['status']??'')!=='awaiting_preview_approval')
    throw new RuntimeException('REAL_TTS_PREVIEW_NOT_READY');
  $previous=false;
  cmsCoralTtsLocked($private,$record['id'],static function($dir,$saved)use($record,$job,&$previous):void{
    if($saved['version']!==$record['version'])throw new RuntimeException('REAL_TTS_STALE');
    $file=$dir.'/real-tts-preview-approval-'.$job.'.json';
    if(file_exists($file)){$previous=true;return;}
    cmsCoralTtsWrite($file,['request_id'=>$job,'creation_version'=>$record['version'],'approved_at'=>gmdate('c')]);
  });
  if($previous)return; // Unknown POST outcome: never issue a duplicate resume.
  cmsCoralRealSpeechTransport($settings,$job,'resume');
}

/** One-click real generation; texts and bearer never appear in browser markup. */
function cmsCoralRealSpeechProductionPanel(
 string $private,array $record,array $catalog,array $canonical,array $guided,
 string $csrf,array $settings,string $filtersUrl=''
): string {
 $id=$record['id'];$version=$record['version'];
 $url='?new=1&amp;cid='.cmsEsc($id).($filtersUrl!==''?'&amp;'.cmsEsc($filtersUrl):'');
 $request=cmsCoralRealSpeechApprovedRequest($private,$record,$catalog,$canonical,$guided);
 $job=$request['request_id'];$recorded=false;
 $path=cmsCreationDir($private).'/real-tts-request-'.$job.'.json';
 if(file_exists($path)) {
   $saved=cmsCoralRealSpeechRequestStored($private,$id,$job);
   if($saved!==$request)throw new RuntimeException('REAL_TTS_VERSION');
   $recorded=true;
 }
 $html='<section data-real-speech-production><h3>MP3 Coral de cet atelier</h3>';
 if(!$recorded) {
   $html.='<form method="post" class="stack" action="'.$url.'#cms-real-tts">'
     .'<input type="hidden" name="csrf" value="'.cmsEsc($csrf).'">'
     .'<input type="hidden" name="creation_id" value="'.cmsEsc($id).'">'
     .'<input type="hidden" name="expected_version" value="'.(int)$version.'">'
     .'<label><input type="checkbox" name="tts_confirm" value="1" required> '
     .'Je confirme une seule préécoute privée Coral et la réservation maximale de 0,75 USD. La suite nécessite mon accord après écoute.</label>'
     .'<button type="submit" name="tts_action" value="generate_real">Préparer la préécoute Coral</button></form>';
 }else{
   $html.='<p>Génération enregistrée, identifiant '.cmsEsc(substr($job,0,12)).'…</p>';
   try{
     $s=cmsCoralRealSpeechObserve($private,$id,$job,$settings,$catalog,$canonical,$guided);
     $labels=['queued'=>'En attente','running'=>'Génération audio en cours',
       'awaiting_preview_approval'=>'Préécoute prête : écoute et accord nécessaires',
       'interrupted'=>'Interrompue : contrôle nécessaire','uncertain'=>'Résultat de dépense incertain : aucun renvoi automatique',
       'succeeded'=>'MP3 réel généré, en attente de validation et publication'];
     $html.='<p data-real-speech-status="'.cmsEsc($s['status']).'">'
       .cmsEsc($labels[$s['status']]??'Suivi indisponible').'</p>';
     $html.='<p>Chapitres terminés : '.(int)($s['completed_chapters']??0).' / 7</p>';
     if($s['status']==='awaiting_preview_approval'){
       $preview='?new=1&amp;cid='.cmsEsc($id).'&amp;tts_real_preview='.cmsEsc($job);
       $html.='<p>Écoute privée du premier fragment de l’introduction :</p>'
         .'<audio controls preload="metadata" src="'.$preview.'"></audio>'
         .'<form method="post" class="stack" action="'.$url.'#cms-real-tts">'
         .'<input type="hidden" name="csrf" value="'.cmsEsc($csrf).'">'
         .'<input type="hidden" name="creation_id" value="'.cmsEsc($id).'">'
         .'<input type="hidden" name="expected_version" value="'.(int)$version.'">'
         .'<input type="hidden" name="tts_job" value="'.cmsEsc($job).'">'
         .'<label><input type="checkbox" name="tts_confirm" value="1" required> '
         .'J’ai écouté et validé la préécoute Coral ; j’autorise la suite de la génération des sept chapitres.</label>'
         .'<button type="submit" name="tts_action" value="approve_real_preview">Valider la préécoute et poursuivre</button></form>';
     }
     if($s['status']==='succeeded'){
       $src='?new=1&amp;cid='.cmsEsc($id).'&amp;tts_real_audio='.cmsEsc($job);
       $html.='<audio controls preload="metadata" src="'.$src.'"></audio>'
         .'<p><a href="'.$src.'">Écouter ou enregistrer le MP3 généré</a></p>'
         .'<p>La mise en ligne publique reste distincte de la génération.</p>';
     }
   }catch(Throwable $e){
     $html.='<p>Suivi indisponible ou accusé inconnu. Aucun appel facturable ne sera relancé automatiquement.</p>';
   }
 }
 return $html.'</section>';
}
