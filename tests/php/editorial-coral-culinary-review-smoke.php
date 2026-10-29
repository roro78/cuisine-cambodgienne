<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/publication-gap-audit.php';

function visaAssert(bool $ok,string $label): void {
    if(!$ok)throw new RuntimeException('C4C3D_'.$label);
}
function visaFail(callable $operation,string $code):void {
    try{$operation();throw new RuntimeException('VISA_UNEXPECTED_ACCEPT');}
    catch(InvalidArgumentException|RuntimeException $e){
        visaAssert($e->getMessage()===$code,'REJECT_'.$code);
    }
}
function visaRemove(string $dir):void {
    if(!is_dir($dir))return;
    foreach(scandir($dir)?:[] as $name){
        if($name==='.'||$name==='..')continue;
        $path=$dir.'/'.$name;
        if(is_dir($path)&&!is_link($path))visaRemove($path);else unlink($path);
    }
    rmdir($dir);
}
$dist=realpath($argv[1]??'');
visaAssert(is_string($dist),'BUILD_REQUIRED');
$feed=json_decode(file_get_contents($dist.'/social-feed.json'),true,64,JSON_THROW_ON_ERROR);
$catalog=cmsSourceList($feed);
$canon=json_decode(file_get_contents($dist.'/editorial-source-index.json'),true,64,JSON_THROW_ON_ERROR);
$canonical=cmsCanonicalSourceList($canon,$catalog);
$guided=cmsGuidedSourceList(json_decode(
    file_get_contents($dist.'/editorial-guided-fields.json'),true,64,JSON_THROW_ON_ERROR),
    $canonical);
cmsAssertGuidedCoverage($guided,$canonical);
$recipe='';
foreach($canonical as $id=>$item){
    if($item['model']==='recipes'&&count($guided[$id]['fields']['ingredients']??[])>0){
        $recipe=substr($id,8);break;
    }
}
visaAssert($recipe!=='','REAL_PUBLISHED_RECIPE');
$root=sys_get_temp_dir().'/cdc-c4c3f-'.bin2hex(random_bytes(8));
visaAssert(mkdir($root,0700),'TEMP');
try{
    $ids=cmsAtelierPhaseIds();$phases=[];
    foreach($ids as $id)$phases[]=['title'=>'Phase '.$id,'learning'=>'Apprendre '.$id];
    $posted=['kind'=>'atelier','title'=>'Projet de visa des narrations inédit',
        'angle'=>'Relecture documentée des narrations',
        'summary'=>'Contenu pilote non publiable','research_note'=>'SECRET_PRIVATE_NOT_EXPOSED',
        'state'=>'review','fields'=>[
            'intro'=>'Introduction à relire','learningGoal'=>'Comprendre les gestes',
            'finalPreparation'=>'Dégustation sous réserve','portionLabel'=>'Portions à vérifier',
            'beforeStarting'=>"Organiser\nContrôler",'equipment'=>"Spatule\nSaladier",
            'phases'=>$phases],
        'atelier_reference'=>['version'=>'1','recipeSlug'=>$recipe]];
    $v1=cmsCreationSave($root,$posted,$catalog,0);
    $id=$v1['id'];$src=$v1['atelier_reference'];$phaseRows=[];
    foreach($ids as $i=>$name){
        $phaseRows[]=['index'=>(string)$i,'id'=>$name,
            'sourceTitle'=>'Phase '.$name,'sourceLearning'=>'Apprendre '.$name,
            'minutes'=>'5','ingredientNames'=>"légumes\nriz",
            'actions'=>"Faire le geste\nObserver le résultat",
            'observe'=>'Observer la couleur','check'=>'Contrôler la texture',
            'mistake'=>'Erreurs fréquentes','recovery'=>'Reprendre sans risque',
            'safety'=>'Vérifier la température et les allergènes',
            'pausePrompt'=>'Mettre en pause'];
    }
    $posted['atelier_phase_details']=[
        'version'=>'1','recipeSlug'=>$recipe,
        'catalogFingerprint'=>$src['catalogFingerprint'],'phases'=>$phaseRows];
    $v2=cmsCreationSave($root,$posted,$catalog,1,$id);
    $digest=cmsAtelierScriptSourceDigest($v2['fields'],$v2['atelier_reference'],
        $v2['atelier_phase_details']);
    $rows=[];foreach(cmsAtelierScriptIds() as $i=>$name){
        $rows[]=['index'=>(string)$i,'id'=>$name,
            'text'=>str_repeat('Un geste à la fois et avec les précautions nécessaires. ',4)
                .'Narration '.$name,
            'editorNote'=>'Relecture interne '.$name];
    }
    $posted['atelier_scripts']=['version'=>'1','bindingDigest'=>$digest,'chapters'=>$rows];
    $v3=cmsCreationSave($root,$posted,$catalog,2,$id);
    visaAssert(cmsAtelierBlueprintPreflight($v3,$catalog)['ready_for_audio_review']===true,
        'PREFLIGHT');
    $dir=cmsCreationDir($root);
    $file=$dir.'/'.$id.'.0003.json';$hash=hash_file('sha256',$file);
    $initialPreflight=cmsAtelierCoralPrereception(
        $root,$v3,$catalog,$canonical,$guided);
    visaAssert($initialPreflight['contract']==='cdc-coral-private-prereception-v1'
        &&$initialPreflight['check_count']===9
        &&$initialPreflight['chapters_count']===7
        &&$initialPreflight['human_text_visas_count']===0
        &&$initialPreflight['canonical_recipe_sha256']
            ===$canonical['recette:'.$recipe]['fingerprint']
        &&$initialPreflight['total_planned_activity_minutes']===30
        &&$initialPreflight['completed_checks']===3
        &&$initialPreflight['tts_authorized']===false
        &&$initialPreflight['ready_for_audio_production']===false
        &&$initialPreflight['publication_ready']===false,
        'CORAL_PREFLIGHT_INIT');
    foreach($initialPreflight['chapters'] as $n=>$chapter){
        visaAssert($chapter['id']===cmsAtelierScriptIds()[$n]
            &&$chapter['script_drafted']===true
            &&$chapter['text_approved']===false
            &&$chapter['planned_activity_minutes']===($n?5:null)
            &&$chapter['coral_mp3_verified']===false
            &&$chapter['audio_timing_verified']===false
            &&$chapter['pause_sync_mobile_verified']===false,
            'CORAL_CHAPTER_'.$n);
    }
    visaAssert(!str_contains(json_encode($initialPreflight,JSON_THROW_ON_ERROR),
        'SECRET_PRIVATE_NOT_EXPOSED'),'NO_PRIVATE_RESEARCH_LEAK');
    $status=cmsAtelierVisaStatus($dir,$v3,$catalog);
    visaAssert($status['approved_text_count']===0
        &&$status['authorizes_tts']===false &&$status['publication_ready']===false,
        'INITIAL_NOT_APPROVED');
    visaFail(static fn()=>cmsAtelierVisaAction(
        $root,$id,3,'intro','approve',true,false,$catalog),'ATELIER_VISA_AUTH');
    visaFail(static fn()=>cmsAtelierVisaAction(
        $root,$id,3,'intro','approve',false,true,$catalog),'ATELIER_VISA_CONFIRM');
    visaFail(static fn()=>cmsAtelierVisaAction(
        $root,$id,2,'intro','approve',true,true,$catalog),'ATELIER_VISA_CONFLICT');
    visaFail(static fn()=>cmsAtelierVisaAction(
        $root,$id,3,'invented','approve',true,true,$catalog),'ATELIER_VISA_INPUT');
    visaAssert(cmsAtelierVisaJournal($dir,$id)['events']===[],
        'REJECTS_CREATE_NO_EVENTS');
    foreach(cmsAtelierScriptIds() as $chapter)
        cmsAtelierVisaAction($root,$id,3,$chapter,'approve',true,true,$catalog);
    $status=cmsAtelierVisaStatus($dir,$v3,$catalog);
    visaAssert($status['approved_text_count']===7
        &&$status['all_seven_texts_reviewed']===true
        &&$status['audio_approved']===false &&$status['authorizes_tts']===false
        &&$status['publication_ready']===false
        &&$status['event_count']===7,'SEVEN_TEXT_VISAS_ONLY');
    visaFail(static fn()=>cmsAtelierVisaAction(
        $root,$id,3,'intro','approve',true,true,$catalog),'ATELIER_VISA_ALREADY_SET');
    $oldHashes=[];
    foreach(glob($dir.'/script-visa-'.$id.'.*.json') as $p)
        $oldHashes[$p]=hash_file('sha256',$p);
    cmsAtelierVisaAction($root,$id,3,'intro','revoke',true,true,$catalog);
    $revoked=cmsAtelierVisaStatus($dir,$v3,$catalog);
    visaAssert($revoked['approved_text_count']===6
        &&$revoked['by_chapter']['intro']===false
        &&$revoked['event_count']===8,'REVOCATION_AUDITED');
    cmsAtelierVisaAction($root,$id,3,'intro','approve',true,true,$catalog);
    $again=cmsAtelierVisaStatus($dir,$v3,$catalog);
    visaAssert($again['approved_text_count']===7
        &&$again['event_count']===9,'REAPPROVAL_AUDITED');
    foreach($oldHashes as $p=>$old)
        visaAssert(hash_file('sha256',$p)===$old,'OLD_JOURNAL_IMMUTABLE');
    visaAssert(hash_file('sha256',$file)===$hash
        &&($v3['reviewed']??null)===false,'DRAFT_FILE_IMMUTABLE');

    $textsReady=cmsAtelierCoralPrereception($root,$v3,$catalog,$canonical,$guided);
    visaAssert($textsReady['human_text_visas_count']===7
        &&$textsReady['completed_checks']===4
        &&($textsReady['checks'][3]['complete']??null)===true
        &&($textsReady['checks'][4]['complete']??null)===false
        &&$textsReady['ready_for_audio_production']===false,
        'SEVEN_TEXT_VISAS_NO_CULINARY_APPROVAL');
    // C4C3F: the REAL canonical source and four explicit human checks.
    $recipeId='recette:'.$recipe;
    $culinary=cmsAtelierCulinaryContext($v3,$catalog,$canonical,$guided);
    visaAssert($culinary['recipe_sha256']===$canonical[$recipeId]['fingerprint']
        &&$culinary['base_servings']===$guided[$recipeId]['fields']['baseServings']
        &&$culinary['ingredient_count']===count($guided[$recipeId]['fields']['ingredients']),
        'FULL_RECIPE_SOURCE');
    $checks=['servings'=>'1','quantities'=>'1','allergens'=>'1','gestures'=>'1'];
    $note='Vérification manuelle des portions, quantités, allergènes et gestes de cuisson.';
    $act=static fn(string $verb,array $points,int $version=3,bool $auth=true,
        bool $confirmed=true)=>cmsAtelierCulinaryAction($root,$id,$version,
        $verb,$points,$note,$confirmed,$auth,$catalog,$canonical,$guided);
    $none=cmsAtelierCulinaryStatus($dir,$v3,$catalog,$canonical,$guided);
    visaAssert($none['human_culinary_review_recorded']===false
        &&$none['review_event_count']===0
        &&$none['audio_approved']===false
        &&$none['authorizes_tts']===false,'NONE_YET');
    visaFail(static fn()=>$act('approve',$checks,3,false),'ATELIER_CULINARY_AUTH');
    visaFail(static fn()=>$act('approve',$checks,3,true,false),
        'ATELIER_CULINARY_CONFIRM');
    visaFail(static fn()=>$act('approve',['servings'=>'1']),
        'ATELIER_CULINARY_CHECKS');
    visaFail(static fn()=>$act('approve',$checks,2),
        'ATELIER_CULINARY_CONFLICT');
    visaAssert(cmsAtelierCulinaryJournal($dir,$id)['events']===[],
        'INVALID_REQUEST_NO_EVENTS');
    $approvedEvent=$act('approve',$checks);
    $review=cmsAtelierCulinaryStatus($dir,$v3,$catalog,$canonical,$guided);
    visaAssert($approvedEvent['recipe_sha256']===$culinary['recipe_sha256']
        &&$approvedEvent['script_binding_sha256']===$digest
        &&$approvedEvent['checks']===cmsAtelierCulinaryChecks()
        &&$review['human_culinary_review_recorded']===true
        &&$review['review_event_count']===1
        &&$review['authorizes_tts']===false
        &&$review['publication_ready']===false,'HUMAN_REVIEW_NOT_TTS');
    $bothChecked=cmsAtelierCoralPrereception(
        $root,$v3,$catalog,$canonical,$guided);
    visaAssert($bothChecked['completed_checks']===5
        &&$bothChecked['human_text_visas_count']===7
        &&($bothChecked['checks'][4]['complete']??null)===true
        &&count(array_filter(array_slice($bothChecked['checks'],5),
            static fn(array $c):bool=>$c['complete']))===0
        &&$bothChecked['ready_for_audio_production']===false
        &&$bothChecked['tts_authorized']===false
        &&$bothChecked['seven_audio_scripts_approved']===false
        &&$bothChecked['export_enabled']===false,
        'NEVER_AUTO_AUTHORIZE_MP3');
    visaFail(static fn()=>$act('approve',$checks),'ATELIER_CULINARY_ALREADY_SET');
    visaFail(static fn()=>$act('revoke',$checks),'ATELIER_CULINARY_CHECKS');
    $firstFile=$dir.'/culinary-visa-'.$id.'.0001.json';
    $firstSha=hash_file('sha256',$firstFile);
    $revoke=$act('revoke',[]);
    $revoked=cmsAtelierCulinaryStatus($dir,$v3,$catalog,$canonical,$guided);
    visaAssert($revoke['checks']===[] &&$revoked['human_culinary_review_recorded']===false
        &&$revoked['review_event_count']===2
        &&hash_file('sha256',$firstFile)===$firstSha,'REVOKE_IMMUTABLE');
    $act('approve',$checks);
    visaAssert(cmsAtelierCulinaryStatus($dir,$v3,$catalog,$canonical,$guided)
        ['human_culinary_review_recorded']===true,'REAPPROVE');
    $wrongSource=$canonical;$wrongSource[$recipeId]['fingerprint']=str_repeat('0',64);
    visaFail(static fn()=>cmsAtelierCulinaryStatus(
        $dir,$v3,$catalog,$wrongSource,$guided),'ATELIER_RECIPE_AUDIT_SOURCE');
    $legacy=null;
    foreach($canonical as $k=>$v)if($v['model']==='restoredRecipes'){$legacy=$k;break;}
    if($legacy!==null){
        $old=$v3;
        $old['atelier_reference']=['version'=>1,'recipeSlug'=>substr($legacy,8),
            'catalogFingerprint'=>$catalog[$legacy]['fingerprint']];
        visaFail(static fn()=>cmsAtelierCulinaryContext(
            $old,$catalog,$canonical,$guided),'ATELIER_CULINARY_UNSUPPORTED');
    }

    $v4=cmsCreationSave($root,$posted,$catalog,3,$id);
    $newVersionPreflight=cmsAtelierCoralPrereception(
        $root,$v4,$catalog,$canonical,$guided);
    visaAssert($newVersionPreflight['human_text_visas_count']===0
        &&$newVersionPreflight['completed_checks']===3
        &&$newVersionPreflight['ready_for_audio_production']===false,
        'NEW_REVISION_INVALIDATES_DASHBOARD');
    $after=cmsAtelierVisaStatus($dir,$v4,$catalog);
    $culinaryAfter=cmsAtelierCulinaryStatus($dir,$v4,$catalog,$canonical,$guided);
    visaAssert($culinaryAfter['human_culinary_review_recorded']===false
        &&$culinaryAfter['review_event_count']===3,
        'NEW_VERSION_INVALIDATES_CULINARY');
    visaFail(static fn()=>$act('approve',$checks),'ATELIER_CULINARY_CONFLICT');
    visaAssert($after['approved_text_count']===0
        &&$after['all_seven_texts_reviewed']===false
        &&count(cmsAtelierVisaJournal($dir,$id)['events'])===9,
        'ANY_NEW_VERSION_INVALIDATES_VISAS');
    visaFail(static fn()=>cmsAtelierVisaAction(
        $root,$id,3,'intro','approve',true,true,$catalog),'ATELIER_VISA_CONFLICT');
    // No browser-supplied approval or model output is part of the C2 contract.
    $fake=$posted;$fake['atelier_visas']=[
        'intro'=>['approved'=>true,'text_sha256'=>str_repeat('0',64)]];
    $fake['culinary_visa']=['approved'=>true,'sha256'=>$culinary['recipe_sha256']];
    $v5=cmsCreationSave($root,$fake,$catalog,4,$id);
    visaAssert(!isset($v5['atelier_visas'])&&!isset($v5['culinary_visa'])
        &&cmsAtelierVisaStatus($dir,$v5,$catalog)['approved_text_count']===0
        &&!array_key_exists('atelier_visas',
            cmsAiContentSchema('atelier')['properties']),'MODEL_FORGERY_IGNORED');
    $html=file_get_contents(__DIR__.'/../../public/gestion-contenus/index.php');
    visaAssert(is_string($html)&&str_contains($html,'cmsAtelierVisaAction')
        &&str_contains($html,'review_confirm')
        &&str_contains($html,'$_SESSION[\'csrf\']')
        &&str_contains($html,'data-coral-human-visas')
        &&str_contains($html,'Révoquer ce visa'),'AUTHENTICATED_STUDIO_UI');
    // Journal corruption must fail closed, never silently produce a green visa.
    $paths=glob($dir.'/script-visa-'.$id.'.*.json');
    $last=$paths[count($paths)-1];
    $data=json_decode(file_get_contents($last),true);
    $data['previous_event_sha256']=str_repeat('0',64);
    file_put_contents($last,json_encode($data,JSON_THROW_ON_ERROR));
    visaFail(static fn()=>cmsAtelierVisaStatus($dir,$v5,$catalog),
        'ATELIER_VISA_CORRUPT');
    $damagedReport=cmsAtelierCoralPrereception(
        $root,$v5,$catalog,$canonical,$guided);
    visaAssert(($damagedReport['checks'][3]['complete']??null)===false
        &&count($damagedReport['blocking_notes'])>0
        &&$damagedReport['publication_ready']===false,
        'CORRUPT_JOURNAL_FAIL_CLOSED');
    // Independently corrupt the culinary audit chain.
    $culinaryFiles=glob($dir.'/culinary-visa-'.$id.'.*.json');
    $lastCulinary=$culinaryFiles[count($culinaryFiles)-1];
    $broken=json_decode(file_get_contents($lastCulinary),true,16,JSON_THROW_ON_ERROR);
    $broken['previous_event_sha256']=str_repeat('0',64);
    file_put_contents($lastCulinary,json_encode($broken,JSON_THROW_ON_ERROR));
    visaFail(static fn()=>cmsAtelierCulinaryJournal($dir,$id),
        'ATELIER_CULINARY_CORRUPT');
    $html=file_get_contents(__DIR__.'/../../public/gestion-contenus/index.php');
    visaAssert(str_contains($html,'cmsAtelierCulinaryAction')
        &&str_contains($html,'data-culinary-human-visa')
        &&str_contains($html,'culinary_checks[allergens]')
        &&str_contains($html,'cmsAssertGuidedCoverage'),'CULINARY_SAME_STUDIO');
    visaAssert(str_contains($html,'data-coral-prereception')
        &&str_contains($html,'coral_preflight=1')
        &&str_contains($html,'cmsAtelierCoralPrereception')
        &&str_contains($html,'Durée des activités prévues')
        &&!str_contains($html,'Télécharger un MP3 Coral'),
        'CORAL_READ_ONLY_UI');
    echo "CMS_CORAL_CULINARY_HUMAN_REVIEW_C4C3F_PASS ".

        json_encode(['authenticated'=>true,'csrf_gate_controller'=>true,
            'seven_per_text_approvals'=>true,'revocation_audited'=>true,
            'new_version_invalidates'=>true,'tts'=>false,'publication'=>false],
            JSON_THROW_ON_ERROR)."\n";
}finally{visaRemove($root);}
