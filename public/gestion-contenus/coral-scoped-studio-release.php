<?php
declare(strict_types=1);
/**
 * Final human-controlled Studio -> scoped same-host publisher.
 * No second backend. This module is include-only; no standalone HTTP route.
 * All flags default false and PHP cannot turn them on itself.
 */
if(isset($_SERVER['SCRIPT_FILENAME'])&&realpath((string)$_SERVER['SCRIPT_FILENAME'])===__FILE__){
    http_response_code(404);exit;
}
require_once __DIR__.'/coral-scoped-staging.php';

function cmsCoralStudioPublishEnabled(array $cfg): bool {
    return ($cfg['coral_scoped_publish_enabled']??false)===true
       && ($cfg['coral_scoped_staging_enabled']??false)===true
       && ($cfg['coral_scoped_restore_qualified']??false)===true
       && is_string($cfg['coral_scoped_source_commit']??null)
       && preg_match('/^[a-f0-9]{40}$/D',$cfg['coral_scoped_source_commit'])===1;
}
function cmsCoralStudioPublishAssert(
    string $private,array $record,string $job,array $manifest,array $cfg,
    array $settings,array $catalog,array $canonical,array $guided
): bool {
    if(!cmsCoralStudioPublishEnabled($cfg)||
       ($manifest['contract']??null)!=='cdc-coral-scoped-astro-bundle-v1'||
       ($manifest['builderContract']??null)!=='cdc-coral-private-verified-astro-builder-v1'||
       ($manifest['sourceCommit']??null)!==$cfg['coral_scoped_source_commit']||
       ($manifest['requestId']??null)!==$job||
       ($manifest['creationId']??null)!==($record['id']??null)||
       ($manifest['creationVersion']??null)!==($record['version']??null))
       return false;
    // Current revision must still be the saved immutable revision from which
    // the builder prepared its five-file bundle.
    $current=cmsCreationRead(cmsCreationDir($private),$record['id']);
    if(!is_array($current)||$current!==$record)return false;
    // Recheck the existing HTTPS worker and current append-only human journals
    // each time the publisher asks for authority. This does NOT invoke TTS.
    try{
        $intent=cmsCoralRealSpeechReleaseIntent(
          $private,$current,$job,$settings,$catalog,$canonical,$guided);
        $state=cmsCoralRealSpeechObserve(
          $private,$current['id'],$job,$settings,$catalog,$canonical,$guided);
        if(($state['status']??null)!=='succeeded'||
           ($state['release_staged']??false)!==true||
           ($state['build_inputs_staged']??false)!==true||
           !is_array($state['manifest']??null))return false;
        $profile=cmsCoralAstroReviewCurrent(
          $private,$current,$state['manifest'],$catalog,$canonical,$guided);
    }catch(Throwable $e){return false;}
    if(!is_array($profile)||!is_string($profile['visualSha256']??null))return false;
    $slug=$intent['candidate_public_slug'];
    $id='atelier:'.$slug;
    $fingerprint=$manifest['workshopSourceSha256']??null;
    // The live Studio, canonical catalogue and social index must expose the
    // same public workshop identity before enabling the last public write.
    if(!is_string($fingerprint)||!preg_match('/^[a-f0-9]{64}$/D',$fingerprint)||
        ($catalog[$id]['url']??null)!=='https://www.cuisine-du-cambodge.com/apprendre/pratique/'.$slug.'/'||
        ($canonical[$id]['model']??null)!=='cookingWorkshopGuides'||
        ($guided[$id]['model']??null)!=='cookingWorkshopGuides'||
        ($canonical[$id]['fingerprint']??null)!==$fingerprint||
        ($guided[$id]['fingerprint']??null)!==$fingerprint)return false;
    // Compare exact SHA, source, audio, route and profile, not merely a job ID.
    return ($manifest['bindingSha256']??null)===$intent['binding_sha256']
        && ($manifest['audioSha256']??null)===$intent['mp3_sha256']
        && ($manifest['mediaImageSha256']??null)===$profile['visualSha256']
        && ($manifest['recipeSlug']??null)===$intent['recipe_slug']
        && ($manifest['publicSlug']??null)===$intent['candidate_public_slug']
        && ($manifest['files'][0]['sha256']??null)===$intent['mp3_sha256'];
}
/**
 * The ONLY authenticated Studio action that may write public files.
 * The endpoint is not enabled unless staged artifacts, source pin and
 * rollback qualification have been explicitly configured on OVH.
 */
function cmsCoralStudioPublish(
    string $private,string $webroot,array $record,string $job,
    bool $authenticated,bool $confirmed,array $cfg,array $settings,
    array $catalog,array $canonical,array $guided
): array {
    if(!$authenticated||!$confirmed||!preg_match('/^[a-f0-9]{48}$/D',$job)
       ||!cmsCoralStudioPublishEnabled($cfg))
        throw new RuntimeException('CORAL_STUDIO_PUBLISH_DISABLED');
    $ready=cmsCoralStageReady($private,$job);
    $manifest=$ready['manifest'];
    $authorize=static function(array $candidate)use(
      $private,$record,$job,$manifest,$cfg,$settings,$catalog,$canonical,$guided
    ): bool {
        if($candidate!==$manifest)return false;
        try{return cmsCoralStudioPublishAssert(
          $private,$record,$job,$candidate,$cfg,$settings,$catalog,$canonical,$guided);}
        catch(Throwable $e){return false;}
    };
    return cmsCoralPublishBundle(
      $private,$webroot,$ready['bundle'],$ready['preconditions'],$authorize);
}
/** Recovery is permitted after revocation: it only restores verified old bytes. */
function cmsCoralStudioRecover(
    string $private,string $webroot,string $job,string $creationId,
    bool $authenticated,bool $confirmed,array $cfg
): array {
    if(!$authenticated||!$confirmed||($cfg['coral_scoped_restore_qualified']??false)!==true
       ||!preg_match('/^[a-f0-9]{48}$/D',$job)||!preg_match('/^c-[a-f0-9]{24}$/D',$creationId))
        throw new RuntimeException('CORAL_RECOVERY_DISABLED');
    return cmsCoralPublishRecoverInterrupted($private,$webroot,$job,
        static fn(string $requested):bool=>$requested===$job,$creationId);
}

function cmsCoralStudioRestorePanel(string $private,array $record,string $csrf,array $cfg): string {
    if(($cfg['coral_scoped_restore_qualified']??false)!==true)return '';
    $latest=null;$lastTime=0;
    foreach(glob($private.'/coral-scoped-releases/'.str_repeat('?',48),GLOB_ONLYDIR)?:[] as $backup){
        $job=basename($backup);
        $journal=$backup.'/before-write.json';
        if(!preg_match('/^[a-f0-9]{48}$/D',$job)||is_link($backup)||is_link($journal)||
            !is_file($journal)||filesize($journal)>64000||
            is_file($backup.'/rolled-back.json')||is_file($backup.'/recovered.json'))continue;
        $state=json_decode((string)file_get_contents($journal),true);
        if(($state['creationId']??null)!==$record['id']||($state['requestId']??null)!==$job)continue;
        $time=(int)filemtime($journal);
        if($latest!==null&&$time<$lastTime)continue;
        $latest=$backup;$lastTime=$time;
    }
    if($latest===null)return '';
    $committed=is_file($latest.'/receipt.json');
    $id=cmsEsc($record['id']);
    return '<section data-coral-publish="'.($committed?'local-committed':'recovery-required').'">'
      .'<h4>'.($committed?'Fichiers installés':'Publication interrompue').'</h4>'
      .'<p>'.($committed?'Vérifiez la page et le lecteur depuis le site public.':
                        'Restaurez la sauvegarde avant de reprendre la publication.').'</p>'
      .'<form method="post" action="?new=1&amp;cid='.$id.'#cms-real-tts" class="stack">'
      .'<input type="hidden" name="csrf" value="'.cmsEsc($csrf).'">'
      .'<input type="hidden" name="creation_id" value="'.$id.'">'
      .'<input type="hidden" name="expected_version" value="'.(int)$record['version'].'">'
      .'<input type="hidden" name="tts_job" value="'.cmsEsc(basename($latest)).'">'
      .'<label><input type="checkbox" name="tts_confirm" value="1" required> '
      .'Je demande la restauration des fichiers précédents.</label>'
      .'<label><input type="checkbox" name="publish_restore_confirm" value="1" required> '
      .'Je confirme le retour à la version précédente.</label>'
      .'<button type="submit" name="tts_action" value="recover_real_publish">'
      .'Restaurer la version précédente</button></form></section>';
}

/** Adds one guarded action to the CURRENT Studio workshop, not a new CMS. */
function cmsCoralStudioPublishPanel(
    string $private,array $record,string $csrf,array $cfg,
    ?array $settings,array $catalog,array $canonical,array $guided
): string {
    $restore=cmsCoralStudioRestorePanel($private,$record,$csrf,$cfg);
    if($restore!=='')return $restore;
    if(!cmsCoralStudioPublishEnabled($cfg)||$settings===null)
        return '';
    try{
        $request=cmsCoralRealSpeechApprovedRequest(
            $private,$record,$catalog,$canonical,$guided);
        $job=$request['request_id'];
        $backup=$private.'/coral-scoped-releases/'.$job;
        if(is_dir($backup)&&!is_link($backup)){
            if(is_file($backup.'/rolled-back.json')||is_file($backup.'/recovered.json'))
                return '<p data-coral-publish="rolled-back">Publication annulée ; '
                    .'sauvegarde restaurée. Une nouvelle livraison contrôlée est requise.</p>';
            return '<p data-coral-publish="manual-recovery">Opération précédente '
                .'incomplète, contrôle technique nécessaire.</p>';
        }
        $ready=cmsCoralStageReady($private,$job);
        if(!cmsCoralStudioPublishAssert(
            $private,$record,$job,$ready['manifest'],$cfg,
            $settings,$catalog,$canonical,$guided))
            return '<p data-coral-publish="blocked">Vérifiez les validations, le lot privé et la présence de cet atelier dans les trois index éditoriaux.</p>';
        $id=cmsEsc($record['id']);$jobHtml=cmsEsc($job);
        $url='?new=1&amp;cid='.$id.'#cms-real-tts';
        return '<section id="cms-coral-scoped-publish" data-coral-publish="ready">'
          .'<h4>Publication ciblée de cet atelier</h4>'
          .'<p>Lot privé vérifié : un MP3 et quatre fichiers Astro. '
          .'La sauvegarde sera réalisée hors du dossier public avant remplacement.</p>'
          .'<form method="post" action="'.$url.'" class="stack">'
          .'<input type="hidden" name="csrf" value="'.cmsEsc($csrf).'">'
          .'<input type="hidden" name="creation_id" value="'.$id.'">'
          .'<input type="hidden" name="expected_version" value="'.(int)$record['version'].'">'
          .'<input type="hidden" name="tts_job" value="'.$jobHtml.'">'
          .'<label><input type="checkbox" name="tts_confirm" value="1" required>'
          .'Je demande expressément la mise en ligne du lot approuvé.</label>'
          .'<label><input type="checkbox" name="publish_confirm" value="1" required>'
          .'Je comprends que cette action remplace les fichiers publics ciblés.</label>'
          .'<button type="submit" name="tts_action" value="publish_real">Publier cet atelier</button>'
          .'</form></section>';
    }catch(Throwable $e){
        return '<p data-coral-publish="pending">Publication impossible tant que le lot '
          .'privé, les empreintes et les validations ne sont pas vérifiés.</p>';
    }
}
