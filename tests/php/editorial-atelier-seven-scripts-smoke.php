<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/publication-gap-audit.php';
function scriptCheck(bool $ok,string $name):void {
    if(!$ok)throw new RuntimeException('C4C3C_'.$name);
}
function scriptRemove(string $dir):void {
    if(!is_dir($dir))return;
    foreach(scandir($dir)?:[] as $f){
        if($f==='.'||$f==='..')continue;
        $p=$dir.'/'.$f;if(is_dir($p)&&!is_link($p))scriptRemove($p);else unlink($p);
    }
    rmdir($dir);
}
$dist=realpath($argv[1]??'');
scriptCheck(is_string($dist),'DIST_REQUIRED');
$feed=json_decode(file_get_contents($dist.'/social-feed.json'),true,64,JSON_THROW_ON_ERROR);
$catalog=cmsSourceList($feed);$recipeId=null;
foreach($catalog as $id=>$page){
    if($page['kind']==='recette'){$recipeId=$id;break;}
}
scriptCheck(is_string($recipeId),'PUBLISHED_RECIPE_REQUIRED');
$root=sys_get_temp_dir().'/cdc-seven-scripts-'.bin2hex(random_bytes(8));
scriptCheck(mkdir($root,0700),'TEMP');
try{
    $titles=['Installer','Préparer','Assembler','Maîtriser','Rectifier','Terminer'];
    $phases=[];foreach($titles as $t)$phases[]=['title'=>$t,'learning'=>'Apprendre '.$t];
    $posted=[
        'kind'=>'atelier','title'=>'Atelier privé des sept scripts C4C3C',
        'angle'=>'Narrer exactement les six gestes source',
        'summary'=>'Sept textes de travail non approuvés',
        'research_note'=>'PRIVATE_SCRIPT_RESEARCH_NOT_EXPOSED',
        'target_date'=>'','state'=>'draft',
        'fields'=>[
            'intro'=>'Bienvenue dans cette préparation guidée',
            'learningGoal'=>'Comprendre les gestes dans leur ordre',
            'finalPreparation'=>'Plat final à vérifier',
            'portionLabel'=>'Quantités de la recette canonique',
            'beforeStarting'=>"Préparer\nMesurer",'equipment'=>"Saladier\nSpatule",
            'phases'=>$phases],
        'atelier_reference'=>['version'=>'1',
            'recipeSlug'=>substr($recipeId,strlen('recette:'))]
    ];
    $v1=cmsCreationSave($root,$posted,$catalog,0);
    $sha=hash_file('sha256',
        cmsCreationDir($root).'/'.$v1['id'].'.0001.json');
    $phaseData=['version'=>'1','recipeSlug'=>$v1['atelier_reference']['recipeSlug'],
        'catalogFingerprint'=>$v1['atelier_reference']['catalogFingerprint'],
        'phases'=>[]];
    foreach(cmsAtelierPhaseIds() as $i=>$id){
        $phaseData['phases'][]=[
            'index'=>(string)$i,'id'=>$id,'sourceTitle'=>$titles[$i],
            'sourceLearning'=>'Apprendre '.$titles[$i],
            'minutes'=>'5','ingredientNames'=>"riz\nlégumes",
            'actions'=>"Faire le geste\nObserver le résultat",
            'observe'=>'Aspect à comparer','check'=>'Contrôler le résultat',
            'mistake'=>'Erreur classique','recovery'=>'Reprendre correctement',
            'safety'=>'Vérifier les risques et les allergènes',
            'pausePrompt'=>'Mettre en pause'
        ];
    }
    $posted['atelier_phase_details']=$phaseData;
    $v2=cmsCreationSave($root,$posted,$catalog,1,$v1['id']);
    $digest=cmsAtelierScriptSourceDigest(
        $v2['fields'],$v2['atelier_reference'],$v2['atelier_phase_details']);
    scriptCheck((bool)preg_match('/^[a-f0-9]{64}$/D',$digest),'SOURCE_DIGEST');
    scriptCheck(cmsAtelierBlueprintPreflight($v2,$catalog)['seven_scripts_drafted']===false,
        'SCRIPT_DRAFTS_NOT_INVENTED');
    $scripts=['version'=>'1','bindingDigest'=>$digest,'chapters'=>[]];
    foreach(cmsAtelierScriptIds() as $i=>$id){
        $scripts['chapters'][]=['index'=>(string)$i,'id'=>$id,
            'text'=>str_repeat('Nous avançons étape par étape avec prudence. ',4)
                .'Chapitre '.$id.'.',
            'editorNote'=>'PRIVATE_EDITOR_NOTE_'.$id];
    }
    $posted['atelier_scripts']=$scripts;
    $v3=cmsCreationSave($root,$posted,$catalog,2,$v1['id']);
    scriptCheck($v3['version']===3 && $v3['reviewed']===false
        &&count($v3['atelier_scripts']['chapters'])===7
        &&$v3['atelier_scripts']['chapters'][0]['id']==='intro'
        &&$v3['atelier_scripts']['chapters'][6]['id']==='terminer'
        &&cmsAtelierScriptsDraftComplete($v3['atelier_scripts']),
        'SEVEN_DISTINCT_DRAFTS');
    $gate=cmsAtelierBlueprintPreflight($v3,$catalog);
    scriptCheck($gate['script_draft_count']===7
        &&$gate['seven_scripts_drafted']===true
        &&$gate['ready_for_audio_review']===true
        &&$gate['seven_audio_scripts_approved']===false
        &&$gate['canonical_recipe_details_revalidated']===false
        &&$gate['publication_ready']===false,
        'DRAFTS_NOT_APPROVAL');
    $serialized=json_encode($gate,JSON_THROW_ON_ERROR);
    foreach(['PRIVATE_EDITOR_NOTE_','PRIVATE_SCRIPT_RESEARCH_NOT_EXPOSED'] as $s)
        scriptCheck(!str_contains($serialized,$s),'NO_PRIVATE_OUTPUT');
    unset($posted['atelier_scripts']);
    $v4=cmsCreationSave($root,$posted,$catalog,3,$v1['id']);
    scriptCheck($v4['atelier_scripts']===$v3['atelier_scripts']
        &&hash_file('sha256',cmsCreationDir($root).'/'.$v1['id'].'.0001.json')
            ===$sha,'OLD_CLIENT_IMMUTABLE');
    $changed=$posted;
    $changed['atelier_phase_details']['phases'][1]['check']='Nouveau contrôle gestuel';
    try{cmsCreationSave($root,$changed,$catalog,4,$v1['id']);
        throw new RuntimeException('ACCEPTED_STALE_TEXT');
    }catch(InvalidArgumentException $e){
        scriptCheck($e->getMessage()==='ATELIER_SCRIPTS_SOURCE_CHANGED',
            'STALENESS_ON_PHASE_CHANGE');
    }
    $changed=$posted;
    $changed['fields']['intro']='Nouvelle entrée du guide';
    try{cmsCreationSave($root,$changed,$catalog,4,$v1['id']);
        throw new RuntimeException('ACCEPTED_STALE_INTRO');
    }catch(InvalidArgumentException $e){
        scriptCheck($e->getMessage()==='ATELIER_SCRIPTS_SOURCE_CHANGED',
            'STALENESS_ON_INTRO_CHANGE');
    }
    $bad=$posted;$bad['atelier_scripts']=$scripts;
    $bad['atelier_scripts']['chapters'][1]['id']='intro';
    try{cmsCreationSave($root,$bad,$catalog,4,$v1['id']);
        throw new RuntimeException('ACCEPTED_ID_REASSIGNMENT');
    }catch(InvalidArgumentException $e){
        scriptCheck($e->getMessage()==='ATELIER_SCRIPTS_ID','FIXED_SCRIPT_ID');
    }
    $bad=$posted;$bad['atelier_scripts']=$scripts;
    $bad['atelier_scripts']['chapters'][0]['approved']=true;
    try{cmsCreationSave($root,$bad,$catalog,4,$v1['id']);
        throw new RuntimeException('ACCEPTED_FORGED_APPROVAL');
    }catch(InvalidArgumentException $e){
        scriptCheck($e->getMessage()==='ATELIER_SCRIPTS_SCHEMA',
            'NO_BROWSER_APPROVAL');
    }
    $bad=$posted;$bad['atelier_scripts']=$scripts;
    $bad['atelier_scripts']['chapters'][6]['index']='0';
    try{cmsCreationSave($root,$bad,$catalog,4,$v1['id']);
        throw new RuntimeException('ACCEPTED_DUPLICATE');
    }catch(InvalidArgumentException $e){
        scriptCheck($e->getMessage()==='ATELIER_SCRIPTS_DUPLICATE',
            'DUPLICATE_SCRIPT_BLOCKED');
    }
    $bad=$posted;$bad['atelier_scripts']=$scripts;
    $bad['atelier_scripts']['bindingDigest']=str_repeat('0',64);
    try{cmsCreationSave($root,$bad,$catalog,4,$v1['id']);
        throw new RuntimeException('ACCEPTED_WRONG_BINDING');
    }catch(InvalidArgumentException $e){
        scriptCheck($e->getMessage()==='ATELIER_SCRIPTS_SOURCE_CHANGED',
            'FORGED_DIGEST_BLOCKED');
    }
    scriptCheck(count(cmsCreationVersions(cmsCreationDir($root),$v1['id']))===4,
        'FAILED_WRITES_NO_VERSION');
    $htmlScripts=$scripts;
    $htmlScripts['chapters'][0]['text']='<script>alert(1)</script>';
    $html=cmsAtelierScriptsHtml($htmlScripts,$v4['fields'],
        $v4['atelier_reference'],$v4['atelier_phase_details']);
    scriptCheck(str_contains($html,'&lt;script&gt;')
        &&!str_contains($html,'<script>')
        &&str_contains($html,'name="atelier_scripts[chapters][0][text]"'),
        'HTML_ESCAPED');
    $stale=cmsAtelierScriptsHtml($v4['atelier_scripts'],
        array_merge($v4['fields'],['intro'=>'Autre introduction']),
        $v4['atelier_reference'],$v4['atelier_phase_details']);
    scriptCheck(str_contains($stale,'Les narrations existantes restent')
        &&str_contains($stale,'PRIVATE_EDITOR_NOTE_intro'),
        'STALE_SCRIPT_NOT_SILENTLY_ERASED');
    $snapshot=cmsCreationPosted(['kind'=>'atelier','atelier_scripts'=>$scripts]);
    scriptCheck($snapshot['atelier_scripts']===$scripts
        &&!array_key_exists('atelier_scripts',
            cmsAiContentSchema('atelier')['properties']),
        'C2_AI_SNAPSHOT_ISOLATED');
    $ui=file_get_contents(__DIR__.'/../../public/gestion-contenus/index.php');
    scriptCheck(str_contains($ui,'cmsAtelierScriptsHtml')
        &&str_contains($ui,'seven_scripts_drafted'),
        'SAME_STUDIO');
    echo "CMS_ATELIER_SEVEN_SCRIPTS_C4C3C_PASS ".
        json_encode(['chapters'=>7,'canonical_binding'=>true,
            'approval'=>false,'tts_calls'=>0,'publication'=>false],
            JSON_THROW_ON_ERROR)."\n";
}finally{scriptRemove($root);}
