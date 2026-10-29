<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/publication-gap-audit.php';
function projectionAssert(bool $ok,string $code):void{
    if(!$ok)throw new RuntimeException('C4B2_'.$code);
}
function projectionCleanup(string $dir):void{
    if(!is_dir($dir))return;
    foreach(scandir($dir)?:[] as $name){
        if($name==='.'||$name==='..')continue;
        $path=$dir.'/'.$name;
        if(is_dir($path)&&!is_link($path))projectionCleanup($path);
        else unlink($path);
    }
    rmdir($dir);
}
$private=sys_get_temp_dir().'/cdc-recipe-projection-'.bin2hex(random_bytes(8));
projectionAssert(mkdir($private,0700),'TEMP');
try{
    $posted=['kind'=>'recette','title'=>'Recette projection C4B2 distincte',
        'angle'=>'Vérifier les nombres et leur correspondance',
        'summary'=>'Synthétique non publiable',
        'research_note'=>'SECRET_PRIVATE_NOTE_NOT_IN_ASTRO',
        'target_date'=>'','state'=>'draft',
        'recipe_astro'=>['version'=>'1','difficulty'=>'Facile',
            'category'=>'Accompagnement','tags'=>"riz\ntechnique"],
        'fields'=>[
            'intro'=>'Introduction testée','description'=>'Description provisoire',
            'context'=>'Contexte à relire','baseServings'=>'4',
            'prepTime'=>'10 min','cookTime'=>'20 min',
            'ingredients'=>[
                ['quantity'=>'250,5','unit'=>'g','name'=>'Riz'],
                ['quantity'=>'0.5','unit'=>'l','name'=>'Eau'],
                ['quantity'=>'','unit'=>'','name'=>'Herbes à doser']],
            'steps'=>[['title'=>'Rincer','text'=>'Rincer avant cuisson'],
                ['title'=>'Cuire','text'=>'Vérifier cuisson et quantité']],
            'equipment'=>"Casserole\nCouvercle"
        ]];
    $record=cmsCreationSave($private,$posted,[],0);
    $result=cmsRecipeAstroDraftProjection($record);
    $draft=$result['draft'];
    projectionAssert($result['contract']==='cdc-editorial-recipe-astro-projection-v1'
        && $result['publication_ready']===false
        && $result['requires_human_review']===true
        && $draft['baseServings']===4
        && $draft['ingredients'][0]['quantity']===250.5
        && $draft['ingredients'][1]['quantity']===0.5
        && !isset($draft['ingredients'][2]['quantity'])
        && $draft['difficulty']==='Facile'
        && $draft['category']==='Accompagnement'
        && $draft['tags']===['riz','technique'],
        'RECIPE_TYPED');
    projectionAssert(!str_contains(json_encode($result,JSON_THROW_ON_ERROR),
        'SECRET_PRIVATE_NOTE_NOT_IN_ASTRO')
        && !isset($draft['research_note']) && !isset($draft['image'])
        && !isset($draft['audio']), 'PRIVATE_AND_MEDIA_BOUNDARY');
    projectionAssert(count($result['review_points'])>=3
        && str_contains(implode(' ',$result['review_points']),'Quantité'),
        'MISSING_QUANTITY_FLAGGED');
    $forged=$record;$forged['publication_ready']=true;$forged['reviewed']=true;
    projectionAssert(cmsRecipeAstroDraftProjection($forged)['publication_ready']===false,
        'FORGED_APPROVAL_IGNORED');
    $bad=$record;$bad['fields']['ingredients'][0]['quantity']='1/2';
    try{
        cmsRecipeAstroDraftProjection($bad);
        throw new RuntimeException('INVALID_QUANTITY_ACCEPTED');
    }catch(InvalidArgumentException $e){
        projectionAssert($e->getMessage()==='RECIPE_PROJECTION_QUANTITY','INVALID_QUANTITY_REJECTED');
    }
    $bad=$record;unset($bad['recipe_astro']);
    try{
        cmsRecipeAstroDraftProjection($bad);
        throw new RuntimeException('INCOMPLETE_PROFILE_ACCEPTED');
    }catch(InvalidArgumentException $e){
        projectionAssert($e->getMessage()==='RECIPE_PROJECTION_INCOMPLETE','PROFILE_REQUIRED');
    }
    $html=file_get_contents(__DIR__.'/../../public/gestion-contenus/index.php');
    projectionAssert(is_string($html)
        && str_contains($html,'data-recipe-astro-projection')
        && str_contains($html,'cmsRecipeAstroDraftProjection($creation)')
        && !str_contains($html,'file_put_contents($recipeProjection'),
        'READ_ONLY_UI');
    echo 'CMS_RECIPE_ASTRO_PROJECTION_C4B2_PASS '.json_encode([
        'typed_projection'=>true,'real_provider_calls'=>0,
        'astro_file_written'=>false,'publication_authorized'=>false],JSON_THROW_ON_ERROR)."\n";
}finally{projectionCleanup($private);}
