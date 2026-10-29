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
$catalog=cmsSourceList($feed);$recipe='';
foreach($catalog as $id=>$item)if($item['kind']==='recette'){$recipe=substr($id,8);break;}
visaAssert($recipe!=='','REAL_PUBLISHED_RECIPE');
$root=sys_get_temp_dir().'/cdc-c4c3d-'.bin2hex(random_bytes(8));
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
    $v4=cmsCreationSave($root,$posted,$catalog,3,$id);
    $after=cmsAtelierVisaStatus($dir,$v4,$catalog);
    visaAssert($after['approved_text_count']===0
        &&$after['all_seven_texts_reviewed']===false
        &&count(cmsAtelierVisaJournal($dir,$id)['events'])===9,
        'ANY_NEW_VERSION_INVALIDATES_VISAS');
    visaFail(static fn()=>cmsAtelierVisaAction(
        $root,$id,3,'intro','approve',true,true,$catalog),'ATELIER_VISA_CONFLICT');
    // No browser-supplied approval or model output is part of the C2 contract.
    $fake=$posted;$fake['atelier_visas']=[
        'intro'=>['approved'=>true,'text_sha256'=>str_repeat('0',64)]];
    $v5=cmsCreationSave($root,$fake,$catalog,4,$id);
    visaAssert(!isset($v5['atelier_visas'])
        &&cmsAtelierVisaStatus($dir,$v5,$catalog)['approved_text_count']===0
        &&!array_key_exists('atelier_visas',
            cmsAiContentSchema('atelier')['properties']),'MODEL_FORGERY_IGNORED');
    $html=file_get_contents(__DIR__.'/../../public/gestion-contenus/index.php');
    visaAssert(is_string($html)&&str_contains($html,'cmsAtelierVisaAction')
        &&str_contains($html,'review_confirm')
        &&str_contains($html,'$_SESSION[\'csrf\']')
        &&str_contains($html,'data-coral-human-visas')
        &&str_contains($html,'Révoquer ce visa'),'AUTHENTICATED_STUDIO_UI');
    $last=end(glob($dir.'/script-visa-'.$id.'.*.json'));
    // Journal corruption must fail closed, never silently produce a green visa.
    $paths=glob($dir.'/script-visa-'.$id.'.*.json');
    $last=$paths[count($paths)-1];
    $data=json_decode(file_get_contents($last),true);
    $data['previous_event_sha256']=str_repeat('0',64);
    file_put_contents($last,json_encode($data,JSON_THROW_ON_ERROR));
    visaFail(static fn()=>cmsAtelierVisaStatus($dir,$v5,$catalog),
        'ATELIER_VISA_CORRUPT');
    echo "CMS_CORAL_HUMAN_VISA_C4C3D_PASS ".
        json_encode(['authenticated'=>true,'csrf_gate_controller'=>true,
            'seven_per_text_approvals'=>true,'revocation_audited'=>true,
            'new_version_invalidates'=>true,'tts'=>false,'publication'=>false],
            JSON_THROW_ON_ERROR)."\n";
}finally{visaRemove($root);}
