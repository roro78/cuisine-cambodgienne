<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/publication-gap-audit.php';
function detailsAssert(bool $condition,string $code):void{
    if(!$condition)throw new RuntimeException('C4B3_'.$code);
}
function detailsCleanup(string $dir):void{
    if(!is_dir($dir))return;
    foreach(scandir($dir)?:[] as $name){
        if($name==='.'||$name==='..')continue;
        $p=$dir.'/'.$name;
        if(is_dir($p)&&!is_link($p))detailsCleanup($p);else unlink($p);
    }
    rmdir($dir);
}
$private=sys_get_temp_dir().'/cdc-recipe-details-'.bin2hex(random_bytes(8));
detailsAssert(mkdir($private,0700),'TEMP');
try{
    $posted=[
        'kind'=>'recette','title'=>'Test C4B3 métadonnées culinaires uniques',
        'angle'=>'Garder les détails attachés à leur source','summary'=>'Synthétique',
        'target_date'=>'','state'=>'draft',
        'research_note'=>'SECRET_PRIVATE_RESEARCH_C4B3',
        'recipe_astro'=>['version'=>'1','difficulty'=>'Facile',
            'category'=>'Accompagnement','tags'=>"riz\npréparation"],
        'fields'=>[
            'intro'=>'Introduction de test','description'=>'Description de travail',
            'context'=>'Contexte de travail','baseServings'=>'4',
            'prepTime'=>'5 min','cookTime'=>'15 min',
            'ingredients'=>[
                ['quantity'=>'250','unit'=>'g','name'=>'riz jasmin'],
                ['quantity'=>'0.5','unit'=>'l','name'=>'eau']],
            'steps'=>[
                ['title'=>'Rincer le riz','text'=>'Rincer à l’eau froide'],
                ['title'=>'Cuire le riz','text'=>'Suivre la quantité indiquée']],
            'equipment'=>"Casserole\nCouvercle"],
        'recipe_astro_details'=>[
            'version'=>'1',
            'ingredients'=>[
                ['index'=>'0','source_name'=>'riz jasmin',
                    'note'=>'Cru, à vérifier','group'=>'Base','scalable'=>'yes'],
                ['index'=>'1','source_name'=>'eau',
                    'note'=>'','group'=>'Cuisson','scalable'=>'no']],
            'steps'=>[
                ['index'=>'0','source_title'=>'Rincer le riz',
                    'duration'=>'2 min','cue'=>'Eau moins trouble','mistake'=>'Ne pas écraser'],
                ['index'=>'1','source_title'=>'Cuire le riz',
                    'duration'=>'','cue'=>'','mistake'=>'']]
        ]
    ];
    $v1=cmsCreationSave($private,$posted,[],0);
    $stored=$v1['recipe_astro_details'];
    detailsAssert($stored['version']===1
        && count($stored['ingredients'])===2
        && count($stored['steps'])===1,'PRIVATE_SPARSE_VERSION');
    $draft=cmsRecipeAstroDraftProjection($v1);
    detailsAssert($draft['publication_ready']===false
        && $draft['draft']['ingredients'][0]['note']==='Cru, à vérifier'
        && $draft['draft']['ingredients'][0]['group']==='Base'
        && $draft['draft']['ingredients'][0]['scalable']===true
        && $draft['draft']['ingredients'][1]['scalable']===false
        && $draft['draft']['steps'][0]['duration']==='2 min'
        && $draft['draft']['steps'][0]['cue']==='Eau moins trouble'
        && $draft['draft']['steps'][0]['mistake']==='Ne pas écraser'
        && !isset($draft['draft']['steps'][1]['duration']),'TYPED_PROJECTION');
    detailsAssert(!str_contains(json_encode($draft,JSON_THROW_ON_ERROR),'SECRET_PRIVATE_RESEARCH_C4B3'),
        'PRIVATE_NOT_EXPOSED');
    $dir=cmsCreationDir($private);
    $v1File=$dir.'/'.$v1['id'].'.0001.json';
    $hash=hash_file('sha256',$v1File);
    unset($posted['recipe_astro_details']);
    $v2=cmsCreationSave($private,$posted,[],1,$v1['id']);
    detailsAssert($v2['recipe_astro_details']===$stored && $v2['version']===2
        && hash_file('sha256',$v1File)===$hash,'LEGACY_CLIENT_AND_IMMUTABLE_HISTORY');
    $modified=$posted;
    $modified['fields']['ingredients'][0]['name']='nouveau riz';
    try{
        cmsCreationSave($private,$modified,[],2,$v1['id']);
        throw new RuntimeException('STALE_METADATA_WRITTEN');
    }catch(InvalidArgumentException $e){
        detailsAssert($e->getMessage()==='RECIPE_DETAILS_SOURCE_CHANGED',
            'STALE_INGREDIENT_BLOCKED');
    }
    detailsAssert(count(cmsCreationVersions($dir,$v1['id']))===2,'NO_STALE_REVISION');
    $bad=$posted;$bad['recipe_astro_details']=$stored;
    $bad['recipe_astro_details']['ingredients'][0]['scalable']='automatic';
    try{
        cmsCreationSave($private,$bad,[],2,$v1['id']);
        throw new RuntimeException('FORGED_ENUM');
    }catch(InvalidArgumentException $e){
        detailsAssert($e->getMessage()==='RECIPE_DETAILS_SCALABLE','INVALID_ENUM');
    }
    $bad=$posted;$bad['recipe_astro_details']=$stored;
    $bad['recipe_astro_details']['steps'][0]['publication_ready']=true;
    try{
        cmsCreationSave($private,$bad,[],2,$v1['id']);
        throw new RuntimeException('FORGED_APPROVAL');
    }catch(InvalidArgumentException $e){
        detailsAssert($e->getMessage()==='RECIPE_DETAILS_SCHEMA','FORGED_APPROVAL_REJECTED');
    }
    $html=cmsRecipeAstroDetailsHtml(['ingredients'=>[['index'=>0,
        'source_name'=>'riz jasmin','note'=>'<script>alert(1)</script>']]],
        $v2['fields']);
    detailsAssert(str_contains($html,'&lt;script&gt;')
        && !str_contains($html,'<script>')
        && str_contains($html,'name="recipe_astro_details[ingredients][0][note]"'),
        'ESCAPED_STUDIO_FORM');
    $snapshot=cmsCreationPosted(['kind'=>'recette','recipe_astro_details'=>$stored]);
    detailsAssert($snapshot['recipe_astro_details']===$stored
        && !array_key_exists('recipe_astro_details',
            cmsAiContentSchema('recette')['properties']),
        'C2_CONTRACT_AND_SNAPSHOT');
    echo 'CMS_RECIPE_ASTRO_DETAILS_C4B3_PASS '.json_encode([
        'source_bound'=>true,'private_versions_preserved'=>true,
        'publication_authorized'=>false,'provider_calls'=>0],JSON_THROW_ON_ERROR)."\n";
}finally{detailsCleanup($private);}
