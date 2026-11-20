<?php
declare(strict_types=1);
/**
 * Existing Studio: human, version-bound native Astro supplement for Coral.
 * It never makes an OpenAI call, modifies a draft or publishes to OVH.
 * The protected file is required by index.php only, not an HTTP endpoint.
 */
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath((string)$_SERVER['SCRIPT_FILENAME'])===__FILE__) {
    http_response_code(404);exit;
}
function cmsCoralAstroReviewFail(string $code): never {
    throw new RuntimeException('CORAL_ASTRO_REVIEW_'.$code);
}
function cmsCoralAstroReviewText(mixed $value,int $min=20,int $max=900): string {
    if(!is_string($value)||!preg_match('//u',$value)
        ||str_contains($value,"\0")||mbLen($value)>$max)cmsCoralAstroReviewFail('TEXT');
    $text=trim($value);
    if(mbLen($text)<$min)cmsCoralAstroReviewFail('TEXT');
    return $text;
}
function cmsCoralAstroReviewLines(mixed $raw,int $min=1,int $max=12): array {
    if(!is_string($raw)||mbLen($raw)>2400)cmsCoralAstroReviewFail('LIST');
    $out=array_values(array_filter(array_map('trim',preg_split('/\r\n|\r|\n/u',$raw)?:[]),
        static fn($x)=>$x!==''));
    if(count($out)<$min||count($out)>$max)cmsCoralAstroReviewFail('LIST');
    foreach($out as $line)cmsCoralAstroReviewText($line,12,200);
    return $out;
}
function cmsCoralAstroReviewImage(string $webroot,mixed $url): string {
    if(!is_string($url)
        ||!preg_match('~^/images/cuisine/[a-z0-9-]{3,120}\\.webp$~D',$url))
        cmsCoralAstroReviewFail('IMAGE_PATH');
    $dir=realpath($webroot.'/images/cuisine');
    if($dir===false||!is_dir($dir))cmsCoralAstroReviewFail('IMAGE_DIRECTORY');
    $file=$webroot.$url;
    if(is_link($file)||!is_file($file)||realpath($file)!==$dir.'/'.basename($file))
        cmsCoralAstroReviewFail('IMAGE_MISSING');
    $size=filesize($file);
    if(!is_int($size)||$size<100||$size>8000000)cmsCoralAstroReviewFail('IMAGE_SIZE');
    return $url;
}
function cmsCoralAstroReviewProfile(
    array $record,array $request,array $manifest,array $form,string $webroot
): array {
    $keys=['difficulty','safety','allergen_status','allergens','finished_image',
       'artwork_evidence','device_mobile','device_desktop',
       'culinary_evidence','editorial_evidence','checks'];
    if(array_diff(array_keys($form),$keys))cmsCoralAstroReviewFail('FORM_KEYS');
    $expected=['recipe','editorial','culinary','image','rights','audio','mobile','desktop','owner'];
    $checks=$form['checks']??null;
    if(!is_array($checks)||array_keys($checks)!==$expected
       ||array_values($checks)!==array_fill(0,count($expected),'1'))
        cmsCoralAstroReviewFail('CHECKS');
    $difficulty=$form['difficulty']??null;
    if(!in_array($difficulty,['Facile','Intermédiaire','Avancé'],true))
        cmsCoralAstroReviewFail('DIFFICULTY');
    $allergenStatus=$form['allergen_status']??null;
    if(!in_array($allergenStatus,['none','declared'],true))
        cmsCoralAstroReviewFail('ALLERGENS');
    $allergenText=$form['allergens']??'';
    $allergens=$allergenStatus==='declared'
        ?cmsCoralAstroReviewLines($allergenText,1,12):[];
    if($allergenStatus==='none'&&trim((string)$allergenText)!=='')
        cmsCoralAstroReviewFail('ALLERGENS');
    $img=cmsCoralAstroReviewImage($webroot,$form['finished_image']??null);
    $mobile=cmsCoralAstroReviewText($form['device_mobile']??null,24);
    $desktop=cmsCoralAstroReviewText($form['device_desktop']??null,24);
    $culinary=cmsCoralAstroReviewText($form['culinary_evidence']??null,24);
    $editorial=cmsCoralAstroReviewText($form['editorial_evidence']??null,24);
    $rights=cmsCoralAstroReviewText($form['artwork_evidence']??null,24);
    if(($request['creation_id']??null)!==($record['id']??null)
       ||($request['creation_version']??null)!==($record['version']??null)
       ||!preg_match('/^[a-f0-9]{64}$/D',(string)($request['binding_sha256']??''))
       ||!preg_match('/^[a-f0-9]{64}$/D',(string)($manifest['sha256']??'')))
        cmsCoralAstroReviewFail('IDENTITY');
    return [
      'contract'=>'cdc-coral-studio-reviewed-blueprint-v1',
      'creationId'=>$record['id'],'creationVersion'=>$record['version'],
      'requestId'=>$request['request_id'],'bindingSha256'=>$request['binding_sha256'],
      'difficulty'=>$difficulty,'safety'=>cmsCoralAstroReviewLines($form['safety']??null,1,12),
      'allergens'=>['status'=>$allergenStatus,'items'=>$allergens],
      'media'=>['finishedPreparationImage'=>$img,'imageValidated'=>true,
          'rightsValidated'=>true,'stepImagePaths'=>[]],
      'artworkRightsEvidence'=>$rights,'deviceQaEvidence'=>'Mobile : '.$mobile.' ; Ordinateur : '.$desktop,
      'culinaryApprovalEvidence'=>$culinary,'editorialApprovalEvidence'=>$editorial,
      'approvedDate'=>gmdate('Y-m-d'),
      'review'=>['recipeValidated'=>true,'editorialValidated'=>true,
          'audioListeningValidated'=>true,'mobileValidated'=>true,
          'desktopValidated'=>true,'productionApproved'=>true]
    ];
}
/** Verifies all event hashes, event sequence and private source linkage. */
function cmsCoralAstroReviewJournal(string $dir,string $id): array {
    if(!cmsCreationId($id))cmsCoralAstroReviewFail('CREATION_ID');
    $files=glob($dir.'/coral-astro-review-'.$id.'.*.json');
    if(!is_array($files)||count($files)>9998)cmsCoralAstroReviewFail('JOURNAL');
    $events=[];$previous='';
    foreach($files as $file){
        if(is_link($file)||!is_file($file)||filesize($file)>12000
          ||basename($file)!=='coral-astro-review-'.$id.'.'.sprintf('%04d',count($events)+1).'.json')
          cmsCoralAstroReviewFail('JOURNAL_FILE');
        $row=json_decode((string)file_get_contents($file),true,24,JSON_THROW_ON_ERROR);
        $keys=['contract','creation_id','creation_version','event','action','request_id',
          'binding_sha256','mp3_sha256','listening_sha256','profile','note',
          'reviewer','reviewed_at','previous_event_sha256'];
        if(!is_array($row)||array_keys($row)!==$keys
          ||($row['contract']??null)!=='cdc-coral-astro-human-review-v1'
          ||$row['creation_id']!==$id||$row['event']!==count($events)+1
          ||!is_int($row['creation_version'])||$row['creation_version']<1
          ||!in_array($row['action'],['approve','revoke'],true)
          ||!preg_match('/^[a-f0-9]{48}$/D',(string)$row['request_id'])
          ||!preg_match('/^[a-f0-9]{64}$/D',(string)$row['binding_sha256'])
          ||!preg_match('/^[a-f0-9]{64}$/D',(string)$row['mp3_sha256'])
          ||!preg_match('/^[a-f0-9]{64}$/D',(string)$row['listening_sha256'])
          ||$row['action']==='revoke'&&$row['profile']!==null
          ||$row['action']==='approve'&&!is_array($row['profile'])
          ||!is_string($row['note'])||mbLen($row['note'])<20||mbLen($row['note'])>900
          ||$row['reviewer']!=='authenticated-cms-owner'
          ||!is_string($row['reviewed_at'])
          ||!preg_match('/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$/D',$row['reviewed_at'])
          ||$row['previous_event_sha256']!==$previous)
            cmsCoralAstroReviewFail('JOURNAL_CORRUPT');
        $events[]=$row;$previous=hash_file('sha256',$file);
    }
    return ['events'=>$events,'last_hash'=>$previous];
}
/** Returns null when there is no LIVE, version-and-audio-bound consent.
 * A corrupted journal throws and therefore blocks release, never falls back.
 */
function cmsCoralAstroReviewCurrent(
    string $private,array $record,array $manifest,
    array $catalog,array $canonical,array $guided
): ?array {
    $request=cmsCoralRealSpeechApprovedRequest($private,$record,$catalog,$canonical,$guided);
    if(!cmsCoralRealSpeechListeningApproved(
        $private,$record,$manifest,$catalog,$canonical,$guided))return null;
    $journal=cmsCoralAstroReviewJournal(cmsCreationDir($private),$record['id']);
    $last=$journal['events']?end($journal['events']):null;
    $listening=cmsCoralTtsJournal(cmsCreationDir($private),$record['id'],'real-listening');
    if(!is_array($last)||($last['action']??null)!=='approve'
       ||$last['creation_version']!==$record['version']
       ||!hash_equals($request['request_id'],$last['request_id'])
       ||!hash_equals($request['binding_sha256'],$last['binding_sha256'])
       ||!hash_equals($manifest['sha256'],$last['mp3_sha256'])
       ||!hash_equals($listening['last_hash'],$last['listening_sha256']))
        return null;
    $profile=$last['profile'];
    if(!is_array($profile)||$profile['creationId']!==$record['id']
       ||$profile['creationVersion']!==$record['version']
       ||$profile['requestId']!==$request['request_id']
       ||$profile['bindingSha256']!==$request['binding_sha256']
       ||($profile['media']['rightsValidated']??false)!==true
       ||($profile['review']['productionApproved']??false)!==true)
        cmsCoralAstroReviewFail('PROFILE_CORRUPT');
    // Existing public images cannot be silently replaced or removed.
    cmsCoralAstroReviewImage(dirname(__DIR__),$profile['media']['finishedPreparationImage']??null);
    return $profile;
}
function cmsCoralAstroReviewAction(
    string $private,array $record,string $job,string $action,array $form,string $note,
    bool $confirmed,bool $authenticated,array $settings,
    array $catalog,array $canonical,array $guided
): array {
    if(!$authenticated||!$confirmed||!in_array($action,['approve','revoke'],true))
        cmsCoralAstroReviewFail('AUTHENTICATION');
    $note=cmsCoralAstroReviewText($note,20,900);
    $request=cmsCoralRealSpeechApprovedRequest($private,$record,$catalog,$canonical,$guided);
    if(!hash_equals($request['request_id'],$job))cmsCoralAstroReviewFail('JOB');
    $state=cmsCoralRealSpeechObserve(
        $private,$record['id'],$job,$settings,$catalog,$canonical,$guided);
    $manifest=$state['manifest']??null;
    if(($state['status']??null)!=='succeeded'||!is_array($manifest))
        cmsCoralAstroReviewFail('AUDIO_NOT_READY');
    // Re-read the complete MP3 before declaring the matching human approval.
    cmsCoralRealSpeechAudio(
        $private,$record['id'],$job,$settings,$catalog,$canonical,$guided);
    if($action==='approve'&&!cmsCoralRealSpeechListeningApproved(
         $private,$record,$manifest,$catalog,$canonical,$guided))
         cmsCoralAstroReviewFail('LISTENING_REQUIRED');
    return cmsCoralTtsLocked($private,$record['id'],
      static function($dir,$latest)use($private,$record,$request,$job,$action,$form,
                                    $note,$catalog,$canonical,$guided,$manifest) {
        if($latest!==$record)cmsCoralAstroReviewFail('VERSION_STALE');
        $current=cmsCoralRealSpeechApprovedRequest(
          $private,$latest,$catalog,$canonical,$guided);
        if($current!==$request)cmsCoralAstroReviewFail('SOURCE_CHANGED');
        $journal=cmsCoralAstroReviewJournal($dir,$latest['id']);
        $last=$journal['events']?end($journal['events']):null;
        if($last&&$last['action']===$action&&$last['creation_version']===$latest['version']
           &&hash_equals($last['request_id'],$job)
           &&hash_equals($last['mp3_sha256'],$manifest['sha256']))
            cmsCoralAstroReviewFail('ALREADY_SET');
        $listen=cmsCoralTtsJournal($dir,$latest['id'],'real-listening');
        $profile=$action==='approve'
          ?cmsCoralAstroReviewProfile(
              $latest,$request,$manifest,$form,dirname(__DIR__)):null;
        $n=count($journal['events'])+1;
        if($n>9998)cmsCoralAstroReviewFail('CAPACITY');
        $row=['contract'=>'cdc-coral-astro-human-review-v1',
          'creation_id'=>$latest['id'],'creation_version'=>$latest['version'],
          'event'=>$n,'action'=>$action,'request_id'=>$job,
          'binding_sha256'=>$request['binding_sha256'],
          'mp3_sha256'=>$manifest['sha256'],'listening_sha256'=>$listen['last_hash'],
          'profile'=>$profile,'note'=>$note,
          'reviewer'=>'authenticated-cms-owner',
          'reviewed_at'=>gmdate('Y-m-d\TH:i:s\Z'),
          'previous_event_sha256'=>$journal['last_hash']];
        cmsCoralTtsWrite($dir.'/coral-astro-review-'.$latest['id'].'.'.
          sprintf('%04d',$n).'.json',$row);
        return $row;
      });
}
/** Only render while the current completed MP3 is available for inspection. */
function cmsCoralAstroReviewPanel(
    string $private,array $record,array $request,array $manifest,
    array $catalog,array $canonical,array $guided,string $csrf,string $url
): string {
    $profile=cmsCoralAstroReviewCurrent(
        $private,$record,$manifest,$catalog,$canonical,$guided);
    $id=cmsEsc($record['id']);$job=cmsEsc($request['request_id']);
    $html='<section id="cms-astro-review" data-astro-review><h4>Visuel, droits et contrôles avant publication</h4>'
      .'<p>Ce formulaire complète la fiche Astro native. '
      .'Les validations sont humaines, liées au MP3 exact et à cette version du brouillon. '
      .'Aucune génération ni publication n’en résulte.</p>';
    if($profile!==null)$html.='<p data-astro-review-status="approved">Revue enregistrée pour cette version.</p>';
    $html.='<form method="post" class="stack" action="'.$url.'#cms-astro-review">'
      .'<input type="hidden" name="csrf" value="'.cmsEsc($csrf).'">'
      .'<input type="hidden" name="creation_id" value="'.$id.'">'
      .'<input type="hidden" name="expected_version" value="'.(int)$record['version'].'">'
      .'<input type="hidden" name="tts_job" value="'.$job.'">';
    if($profile===null){
      $html.='<label>Difficulté<select name="astro_review[difficulty]" required>'
        .'<option value="">Choisir</option><option>Facile</option>'
        .'<option>Intermédiaire</option><option>Avancé</option></select></label>'
        .'<label>Consignes de sécurité (une par ligne)<textarea name="astro_review[safety]" required maxlength="2400"></textarea></label>'
        .'<label>Allergènes de la recette<select name="astro_review[allergen_status]" required>'
        .'<option value="">Choisir</option><option value="declared">Allergènes déclarés</option>'
        .'<option value="none">Aucun allergène identifié après contrôle</option></select></label>'
        .'<label>Allergènes (un par ligne si déclarés)<textarea name="astro_review[allergens]" maxlength="2400"></textarea></label>'
        .'<label>Illustration publique déjà autorisée (.webp, /images/cuisine/)'
        .'<input name="astro_review[finished_image]" required placeholder="/images/cuisine/exemple.webp"></label>'
        .'<label>Justificatif des droits d’utilisation du visuel'
        .'<textarea name="astro_review[artwork_evidence]" minlength="24" maxlength="900" required></textarea></label>'
        .'<label>Compte rendu du test sur téléphone physique (lecture, pause, chapitres)'
        .'<textarea name="astro_review[device_mobile]" minlength="24" maxlength="900" required></textarea></label>'
        .'<label>Compte rendu du test sur ordinateur (lecture, pause, chapitres)'
        .'<textarea name="astro_review[device_desktop]" minlength="24" maxlength="900" required></textarea></label>'
        .'<label>Contrôle culinaire de la recette et des quantités'
        .'<textarea name="astro_review[culinary_evidence]" minlength="24" maxlength="900" required></textarea></label>'
        .'<label>Relecture éditoriale des six phases et des sept textes'
        .'<textarea name="astro_review[editorial_evidence]" minlength="24" maxlength="900" required></textarea></label>';
      foreach([
        'recipe'=>'Recette et portions réellement contrôlées',
        'editorial'=>'Six phases et sept narrations relues',
        'culinary'=>'Sécurité culinaire et allergènes vérifiés',
        'image'=>'Image finale affichée et vérifiée',
        'rights'=>'Droits de diffusion de l’illustration vérifiés',
        'audio'=>'MP3 complet et sept repères vérifiés',
        'mobile'=>'Essais effectués sur téléphone physique',
        'desktop'=>'Essais effectués sur ordinateur',
        'owner'=>'Je demande la validation éditoriale de cet atelier'
      ] as $key=>$label)
        $html.='<label><input type="checkbox" name="astro_review[checks]['.$key.']" value="1" required> '
          .cmsEsc($label).'</label>';
    }
    $html.='<label>Note de validation ou motif de révocation'
      .'<textarea name="astro_review_note" minlength="20" maxlength="900" required></textarea></label>'
      .'<label><input type="checkbox" name="astro_review_confirm" value="1" required> '
      .($profile===null?'Je confirme mes contrôles réels et les droits déclarés.'
        :'Je confirme la révocation de cette validation.').'</label>'
      .'<button name="astro_review_action" value="'.($profile===null?'approve':'revoke').'">'
      .($profile===null?'Valider la fiche Astro et les visuels':'Révoquer la validation').'</button></form>';
    return $html.'</section>';
}
