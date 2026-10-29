<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/publication-gap-audit.php';
function workshopPreflightCheck(bool $cond,string $code):void{
    if(!$cond)throw new RuntimeException('C4C3A_'.$code);
}
function workshopPreflightCleanup(string $dir):void{
    if(!is_dir($dir))return;
    foreach(scandir($dir)?:[] as $name){
        if($name==='.'||$name==='..')continue;
        $p=$dir.'/'.$name;
        if(is_dir($p)&&!is_link($p))workshopPreflightCleanup($p);else unlink($p);
    }
    rmdir($dir);
}
$dist=realpath($argv[1]??'');
workshopPreflightCheck(is_string($dist),'DIST_REQUIRED');
$feed=json_decode(file_get_contents($dist.'/social-feed.json'),true,64,JSON_THROW_ON_ERROR);
$catalog=cmsSourceList($feed);
$recipeId=null;
foreach($catalog as $id=>$page)if($page['kind']==='recette'){$recipeId=$id;break;}
workshopPreflightCheck(is_string($recipeId),'PUBLISHED_RECIPE_REQUIRED');
$slug=substr($recipeId,strlen('recette:'));
$root=sys_get_temp_dir().'/cdc-atelier-c4c3a-'.bin2hex(random_bytes(8));
workshopPreflightCheck(mkdir($root,0700),'TEMP');
try{
    $phases=[];
    foreach(['Installer','Préparer','Assembler','Maîtriser','Rectifier','Terminer'] as $title)
        $phases[]=['title'=>$title,'learning'=>'Comprendre la phase '.$title];
    $input=[
        'kind'=>'atelier','title'=>'Atelier test C4C3A indépendant',
        'angle'=>'Rattacher une recette du vrai catalogue sans modifier ses doses',
        'summary'=>'Brouillon pédagogique privé sans MP3',
        'research_note'=>'PRIVATE_WORKSHOP_NOTE_NEVER_PUBLIC',
        'target_date'=>'','state'=>'draft',
        'fields'=>[
            'intro'=>'Présentation de travail','learningGoal'=>'Apprendre avec précision',
            'finalPreparation'=>'Préparation non dégustée',
            'portionLabel'=>'Selon la recette source',
            'beforeStarting'=>"Laver les mains\nPréparer le matériel",
            'equipment'=>"Saladier\nCuillère",'phases'=>$phases
        ]
    ];
    $v1=cmsCreationSave($root,$input,$catalog,0);
    $p1=cmsAtelierBlueprintPreflight($v1,$catalog);
    workshopPreflightCheck($p1['phase_count']===6
        && $p1['six_distinct_phases']===true
        && $p1['canonical_reference_checked']===false
        && $p1['ready_for_blueprint_enrichment']===false
        && $p1['publication_ready']===false,'LEGACY_WITHOUT_SOURCE_NOT_READY');
    $path=cmsCreationDir($root).'/'.$v1['id'].'.0001.json';
    $sha=hash_file('sha256',$path);
    $input['atelier_reference']=['version'=>'1','recipeSlug'=>$slug];
    $v2=cmsCreationSave($root,$input,$catalog,1,$v1['id']);
    $ref=$v2['atelier_reference'];
    workshopPreflightCheck($ref['recipeSlug']===$slug
        && $ref['catalogFingerprint']===$catalog[$recipeId]['fingerprint']
        && $v2['reviewed']===false && $v2['version']===2,'SERVER_SOURCE_FINGERPRINT');
    $p2=cmsAtelierBlueprintPreflight($v2,$catalog);
    workshopPreflightCheck($p2['ready_for_blueprint_enrichment']===true
        && $p2['form_core_complete']===true
        && $p2['stable_phase_ids_ready']===false
        && $p2['seven_audio_scripts_approved']===false
        && $p2['canonical_recipe_details_revalidated']===false
        && $p2['publication_ready']===false,'SIX_PHASES_NOT_FULL_CORAL');
    $forged=$v2;
    $forged['publication_ready']=true;$forged['reviewed']=true;
    workshopPreflightCheck(cmsAtelierBlueprintPreflight($forged,$catalog)['publication_ready']===false,
        'FORGED_PUBLICATION_IGNORED');
    $mismatch=$v2;
    $mismatch['ai_content']=['reference_id'=>'recette:other-recipe'];
    $check=cmsAtelierBlueprintPreflight($mismatch,$catalog);
    workshopPreflightCheck($check['ai_recipe_reference_consistent']===false
        && $check['ready_for_blueprint_enrichment']===false,
        'MODEL_REFERENCE_MUST_MATCH');
    $duplicate=$v2;
    $duplicate['fields']['phases'][5]['title']=$duplicate['fields']['phases'][0]['title'];
    workshopPreflightCheck(cmsAtelierBlueprintPreflight($duplicate,$catalog)['six_distinct_phases']===false,
        'DUPLICATE_CHAPTER_BLOCKED');
    unset($input['atelier_reference']);
    $v3=cmsCreationSave($root,$input,$catalog,2,$v1['id']);
    workshopPreflightCheck($v3['atelier_reference']===$ref
        && hash_file('sha256',$path)===$sha,'LEGACY_EDITOR_RETAINS_REFERENCE');
    $bad=$input;$bad['atelier_reference']=['version'=>'1','recipeSlug'=>'invented'];
    try{cmsCreationSave($root,$bad,$catalog,3,$v1['id']);
        throw new RuntimeException('ACCEPTED_UNPUBLISHED_SOURCE');
    }catch(InvalidArgumentException $e){
        workshopPreflightCheck($e->getMessage()==='ATELIER_REFERENCE_NOT_PUBLISHED',
            'MISSING_RECIPE_REJECTED');
    }
    $bad['atelier_reference']=['version'=>'1','recipeSlug'=>$slug,
        'catalogFingerprint'=>'0000000000000000'];
    try{cmsCreationSave($root,$bad,$catalog,3,$v1['id']);
        throw new RuntimeException('ACCEPTED_FORGED_FINGERPRINT');
    }catch(InvalidArgumentException $e){
        workshopPreflightCheck($e->getMessage()==='ATELIER_REFERENCE_CHANGED',
            'FORGED_FINGERPRINT_REJECTED');
    }
    $changed=$catalog;$changed[$recipeId]['fingerprint']='aaaaaaaaaaaaaaaa';
    if($changed[$recipeId]['fingerprint']===$ref['catalogFingerprint'])
        $changed[$recipeId]['fingerprint']='bbbbbbbbbbbbbbbb';
    try{cmsCreationSave($root,$input,$changed,3,$v1['id']);
        throw new RuntimeException('ACCEPTED_STALE_REFERENCE');
    }catch(InvalidArgumentException $e){
        workshopPreflightCheck($e->getMessage()==='ATELIER_REFERENCE_CHANGED',
            'STALE_CANONICAL_SOURCE_REJECTED');
    }
    workshopPreflightCheck(count(cmsCreationVersions(cmsCreationDir($root),$v1['id']))===3,
        'INVALID_NO_VERSION');
    $html=cmsAtelierReferenceHtml(['recipeSlug'=>'<script>alert(1)</script>']);
    workshopPreflightCheck(str_contains($html,'&lt;script&gt;')
        && !str_contains($html,'<script>')
        && str_contains($html,'name="atelier_reference[recipeSlug]"'),
        'HTML_ESCAPED');
    $snapshot=cmsCreationPosted(['kind'=>'atelier','atelier_reference'=>$ref]);
    workshopPreflightCheck($snapshot['atelier_reference']===$ref
        && !array_key_exists('atelier_reference',
            cmsAiContentSchema('atelier')['properties']),
        'AI_CORE_UNCHANGED');
    $ui=file_get_contents(__DIR__.'/../../public/gestion-contenus/index.php');
    workshopPreflightCheck(str_contains($ui,'cmsAtelierReferenceHtml')
        && str_contains($ui,'cmsAtelierBlueprintPreflight($creation,$catalog)'),
        'SAME_STUDIO');
    echo "CMS_ATELIER_CANONICAL_PREFLIGHT_C4C3A_PASS ".
        json_encode(['real_catalog'=>true,'phases'=>6,
            'audio_scripts_approved'=>0,'publication_authorized'=>false],
            JSON_THROW_ON_ERROR)."\n";
}finally{workshopPreflightCleanup($root);}
