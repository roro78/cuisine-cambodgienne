<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/publication-gap-audit.php';
function phaseCheck(bool $condition,string $name):void {
    if(!$condition)throw new RuntimeException('C4C3B_'.$name);
}
function phaseDelete(string $path):void {
    if(!is_dir($path))return;
    foreach(scandir($path)?:[] as $name){
        if($name==='.'||$name==='..')continue;
        $p=$path.'/'.$name;
        if(is_dir($p)&&!is_link($p))phaseDelete($p);else unlink($p);
    }
    rmdir($path);
}
$dist=realpath($argv[1]??'');
phaseCheck(is_string($dist),'DIST_REQUIRED');
$feed=json_decode(file_get_contents($dist.'/social-feed.json'),true,64,JSON_THROW_ON_ERROR);
$catalog=cmsSourceList($feed);
$recipeId=null;
foreach($catalog as $id=>$page){
    if($page['kind']==='recette'){$recipeId=$id;break;}
}
phaseCheck(is_string($recipeId),'PUBLISHED_RECIPE');
$slug=substr($recipeId,strlen('recette:'));
$dir=sys_get_temp_dir().'/cdc-c4c3b-'.bin2hex(random_bytes(8));
phaseCheck(mkdir($dir,0700),'PRIVATE_DIR');
try{
    $names=['Installer','Préparer','Assembler','Maîtriser','Rectifier','Terminer'];
    $phases=[];
    foreach($names as $title)
        $phases[]=['title'=>$title,'learning'=>'Apprendre : '.$title];
    $input=[
        'kind'=>'atelier','title'=>'Atelier inédit avec phases C4C3B',
        'angle'=>'Respect du déroulé sans générer un MP3',
        'summary'=>'Étude pédagogique privée et non validée',
        'research_note'=>'SECRET_C4C3B_RESEARCH_NOT_PUBLIC',
        'target_date'=>'','state'=>'draft',
        'fields'=>[
            'intro'=>'Présentation','learningGoal'=>'Apprendre chaque geste',
            'finalPreparation'=>'Produit fini à valider','portionLabel'=>'Selon recette',
            'beforeStarting'=>"Préparer\nVérifier",'equipment'=>"Spatule\nSaladier",
            'phases'=>$phases
        ],
        'atelier_reference'=>['version'=>'1','recipeSlug'=>$slug]
    ];
    $v1=cmsCreationSave($dir,$input,$catalog,0);
    $v1File=cmsCreationDir($dir).'/'.$v1['id'].'.0001.json';
    $sha=hash_file('sha256',$v1File);
    phaseCheck(cmsAtelierBlueprintPreflight($v1,$catalog)['phase_details_complete']===false,
        'MISSING_DETAILS_NOT_READY');
    $details=['version'=>'1','recipeSlug'=>$slug,
        'catalogFingerprint'=>$v1['atelier_reference']['catalogFingerprint'],
        'phases'=>[]];
    foreach(cmsAtelierPhaseIds() as $i=>$id){
        $details['phases'][]=[
            'index'=>(string)$i,'id'=>$id,
            'sourceTitle'=>$names[$i],
            'sourceLearning'=>'Apprendre : '.$names[$i],
            'minutes'=>'5','ingredientNames'=>$i===0?'':"riz\nlégumes",
            'actions'=>"Préparer avec méthode\nContrôler le geste",
            'observe'=>'Aspect observé','check'=>'Contrôle qualité',
            'mistake'=>'Erreur possible','recovery'=>'Corriger le geste',
            'safety'=>'Vérifier la sécurité et les allergènes',
            'pausePrompt'=>'Faire pause avant de continuer'
        ];
    }
    $input['atelier_phase_details']=$details;
    $v2=cmsCreationSave($dir,$input,$catalog,1,$v1['id']);
    phaseCheck($v2['version']===2&&$v2['reviewed']===false
        &&count($v2['atelier_phase_details']['phases'])===6
        &&$v2['atelier_phase_details']['phases'][0]['id']==='installer'
        &&$v2['atelier_phase_details']['phases'][5]['id']==='terminer'
        &&$v2['atelier_phase_details']['phases'][1]['actions']===
            ['Préparer avec méthode','Contrôler le geste']
        &&cmsAtelierPhaseDetailsComplete($v2['atelier_phase_details']),
        'SIX_ENRICHED_PHASES');
    $gate=cmsAtelierBlueprintPreflight($v2,$catalog);
    phaseCheck($gate['phase_details_complete']===true
        &&$gate['ready_for_scripts_drafting']===true
        &&$gate['stable_phase_ids_ready']===false
        &&$gate['seven_audio_scripts_approved']===false
        &&$gate['canonical_recipe_details_revalidated']===false
        &&$gate['publication_ready']===false,
        'CORAL_GATE_UNPUBLISHED');
    phaseCheck(!str_contains(json_encode($gate,JSON_THROW_ON_ERROR),'SECRET_C4C3B'),
        'PRIVATE_NOT_PROJECTED');
    unset($input['atelier_phase_details']);
    $v3=cmsCreationSave($dir,$input,$catalog,2,$v1['id']);
    phaseCheck($v3['atelier_phase_details']===$v2['atelier_phase_details']
        &&hash_file('sha256',$v1File)===$sha,'LEGACY_EDITOR_AND_IMMUTABLE');
    $input['fields']['phases'][0]['title']='Titre modifié par IA';
    try{cmsCreationSave($dir,$input,$catalog,3,$v1['id']);
        throw new RuntimeException('ACCEPTED_STALE_PHASE');
    }catch(InvalidArgumentException $e){
        phaseCheck($e->getMessage()==='ATELIER_PHASE_SOURCE_CHANGED','CHANGED_TITLE_BLOCKED');
    }
    $input['fields']['phases'][0]['title']=$names[0];
    $bad=$input;$bad['atelier_phase_details']=$details;
    $bad['atelier_phase_details']['phases'][0]['minutes']='250';
    try{cmsCreationSave($dir,$bad,$catalog,3,$v1['id']);
        throw new RuntimeException('ACCEPTED_250_MINUTES');
    }catch(InvalidArgumentException $e){
        phaseCheck($e->getMessage()==='ATELIER_PHASE_MINUTES','DURATION_LIMIT');
    }
    $bad=$input;$bad['atelier_phase_details']=$details;
    $bad['atelier_phase_details']['phases'][0]['id']='preparer';
    try{cmsCreationSave($dir,$bad,$catalog,3,$v1['id']);
        throw new RuntimeException('ACCEPTED_REASSIGNMENT');
    }catch(InvalidArgumentException $e){
        phaseCheck($e->getMessage()==='ATELIER_PHASE_ID','PHASE_ID_FIXED');
    }
    $bad=$input;$bad['atelier_phase_details']=$details;
    $bad['atelier_phase_details']['phases'][0]['publication_ready']=true;
    try{cmsCreationSave($dir,$bad,$catalog,3,$v1['id']);
        throw new RuntimeException('ACCEPTED_FORGED_APPROVAL');
    }catch(InvalidArgumentException $e){
        phaseCheck($e->getMessage()==='ATELIER_PHASE_SCHEMA','FORGED_APPROVAL_REJECTED');
    }
    $bad=$input;$bad['atelier_phase_details']=$details;
    $bad['atelier_phase_details']['phases'][5]['index']='0';
    try{cmsCreationSave($dir,$bad,$catalog,3,$v1['id']);
        throw new RuntimeException('ACCEPTED_DUPLICATE_ID');
    }catch(InvalidArgumentException $e){
        phaseCheck($e->getMessage()==='ATELIER_PHASE_DUPLICATE','DUPLICATE_INDEX_REJECTED');
    }
    $changed=$catalog;
    $changed[$recipeId]['fingerprint']='aaaaaaaaaaaaaaaa';
    if($changed[$recipeId]['fingerprint']===$details['catalogFingerprint'])
        $changed[$recipeId]['fingerprint']='bbbbbbbbbbbbbbbb';
    try{cmsCreationSave($dir,$input,$changed,3,$v1['id']);
        throw new RuntimeException('ACCEPTED_STALE_RECIPE');
    }catch(InvalidArgumentException $e){
        phaseCheck($e->getMessage()==='ATELIER_REFERENCE_CHANGED'
            ||$e->getMessage()==='ATELIER_PHASE_SOURCE_CHANGED',
            'RECIPE_CHANGED_BLOCKED');
    }
    phaseCheck(count(cmsCreationVersions(cmsCreationDir($dir),$v1['id']))===3,
        'INVALID_WRITES_BLOCKED');
    $html=cmsAtelierPhaseDetailsHtml([
        'recipeSlug'=>$slug,'catalogFingerprint'=>$details['catalogFingerprint'],
        'phases'=>[['index'=>0,'sourceTitle'=>$names[0],
            'sourceLearning'=>'Apprendre : '.$names[0],
            'observe'=>'<script>alert(1)</script>']]],
        $v3['fields'],$v3['atelier_reference']);
    phaseCheck(str_contains($html,'&lt;script&gt;')
        &&!str_contains($html,'<script>')
        &&str_contains($html,'name="atelier_phase_details[phases][0][observe]"'),
        'SIX_PHASE_HTML_ESCAPED');
    $posted=cmsCreationPosted(['kind'=>'atelier','atelier_phase_details'=>$details]);
    phaseCheck($posted['atelier_phase_details']===$details
        &&!array_key_exists('atelier_phase_details',
            cmsAiContentSchema('atelier')['properties']),
        'C2_SCHEMA_AND_SNAPSHOT');
    $ui=file_get_contents(__DIR__.'/../../public/gestion-contenus/index.php');
    phaseCheck(is_string($ui)
        &&str_contains($ui,'cmsAtelierPhaseDetailsHtml')
        &&str_contains($ui,'phase_details_complete'),
        'IN_STUDIO_COMMON');
    echo "CMS_ATELIER_PHASE_DETAILS_C4C3B_PASS ".
        json_encode(['six_phase_ids'=>true,'source_locked'=>true,
            'real_catalog'=>true,'audio_approved'=>false,'publication'=>false],
            JSON_THROW_ON_ERROR)."\n";
}finally{phaseDelete($dir);}
