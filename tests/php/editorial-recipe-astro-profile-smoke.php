<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/publication-gap-audit.php';
require_once __DIR__.'/fixtures/editorial-ai-content.php';
function recipeProfileCheck(bool $ok,string $code):void{
    if(!$ok)throw new RuntimeException('C4B1_'.$code);
}
function recipeProfileCleanup(string $dir):void{
    if(!is_dir($dir))return;
    foreach(scandir($dir)?:[] as $name){
        if($name==='.'||$name==='..')continue;
        $path=$dir.'/'.$name;
        if(is_dir($path)&&!is_link($path))recipeProfileCleanup($path);
        else unlink($path);
    }
    rmdir($dir);
}
$private=sys_get_temp_dir().'/cdc-recipe-profile-'.bin2hex(random_bytes(8));
recipeProfileCheck(mkdir($private,0700),'ROOT');
try{
    $posted=[
        'kind'=>'recette','title'=>'Recette C4B1 témoin distincte',
        'angle'=>'Structure et métadonnées à corriger',
        'summary'=>'Brouillon synthétique sans publication',
        'research_note'=>'Données privées hors rendu public',
        'target_date'=>'','state'=>'draft',
        'fields'=>[
            'intro'=>'Introduction de travail','description'=>'Description SEO à vérifier',
            'context'=>'Contexte à vérifier','baseServings'=>'4',
            'prepTime'=>'15 min','cookTime'=>'10 min',
            'ingredients'=>[['quantity'=>'250','unit'=>'g','name'=>'Riz']],
            'steps'=>[['title'=>'Étape 1','text'=>'Rincer le riz puis suivre la recette vérifiée.']],
            'equipment'=>'Casserole'
        ]
    ];
    $v1=cmsCreationSave($private,$posted,[],0);
    recipeProfileCheck(!array_key_exists('recipe_astro',$v1),'LEGACY_NO_AUTOFILL');
    recipeProfileCheck(cmsAstroPublicationGapReport($v1)['recipe_astro_profile_complete']===false,
        'LEGACY_GAP');
    $dir=cmsCreationDir($private);$v1file=$dir.'/'.$v1['id'].'.0001.json';
    $hash=hash_file('sha256',$v1file);
    // The Studio submits an empty profile on an ordinary new recipe.
    $empty=cmsRecipeAstroProfileClean(['version'=>'1','difficulty'=>'',
        'category'=>'','tags'=>'']);
    recipeProfileCheck($empty['tags']===[] && !cmsRecipeAstroProfileComplete($empty),
        'EMPTY_RECIPE_STILL_DRAFTABLE');
    $profile=['version'=>'1','difficulty'=>'Intermédiaire',
        'category'=>'Accompagnement','tags'=>"riz\naccompagnement"];
    $posted['recipe_astro']=$profile;
    $v2=cmsCreationSave($private,$posted,[],1,$v1['id']);
    recipeProfileCheck($v2['version']===2 && $v2['recipe_astro']['version']===1
        && $v2['recipe_astro']['tags']===['riz','accompagnement']
        && $v2['recipe_astro']['difficulty']==='Intermédiaire'
        && $v2['origin']==='manual' && $v2['reviewed']===false,
        'VERSIONED_PROFILE');
    recipeProfileCheck(hash_file('sha256',$v1file)===$hash
        && !isset(cmsCreationRead($dir,$v1['id'],1)['recipe_astro']),
        'IMMUTABLE_VERSION_1');
    $gap=cmsAstroPublicationGapReport($v2);
    recipeProfileCheck($gap['recipe_astro_profile_complete']===true
        && $gap['publication_ready']===false,'NEVER_PUBLISH');
    $html=cmsRecipeAstroProfileHtml(['difficulty'=>'Intermédiaire',
        'category'=>'Accompagnement','tags'=>"<script>alert(1)</script>"]);
    recipeProfileCheck(str_contains($html,'name="recipe_astro[tags]"')
        && str_contains($html,'&lt;script&gt;')
        && !str_contains($html,'<script>'),'SAFE_FORM_HTML');
    $posted['recipe_astro']=null;
    $v3=cmsCreationSave($private,$posted,[],2,$v1['id']);
    recipeProfileCheck($v3['recipe_astro']===$v2['recipe_astro']
        && $v3['version']===3,'OLD_EDITOR_RETAINS_PROFILE');
    $bad=$posted;
    $bad['recipe_astro']=$profile;
    $bad['recipe_astro']['difficulty']='Difficulté inventée';
    try{
        cmsCreationSave($private,$bad,[],3,$v1['id']);
        throw new RuntimeException('ACCEPTED_UNKNOWN_DIFFICULTY');
    }catch(InvalidArgumentException $e){
        recipeProfileCheck($e->getMessage()==='RECIPE_ASTRO_PROFILE','REJECT_ENUM');
    }
    $bad['recipe_astro']=$profile;
    $bad['recipe_astro']['publication_ready']=true;
    try{
        cmsCreationSave($private,$bad,[],3,$v1['id']);
        throw new RuntimeException('ACCEPTED_FORGED_FIELD');
    }catch(InvalidArgumentException $e){
        recipeProfileCheck($e->getMessage()==='RECIPE_ASTRO_PROFILE','REJECT_FORGED_APPROVAL');
    }
    $bad['recipe_astro']=$profile;
    $bad['recipe_astro']['tags']="riz\nRIZ";
    try{
        cmsCreationSave($private,$bad,[],3,$v1['id']);
        throw new RuntimeException('ACCEPTED_DUPLICATE_TAGS');
    }catch(InvalidArgumentException $e){
        recipeProfileCheck($e->getMessage()==='RECIPE_ASTRO_TAGS','REJECT_DUPLICATE_TAGS');
    }
    recipeProfileCheck(count(cmsCreationVersions($dir,$v1['id']))===3,'INVALID_NO_NEW_VERSION');
    $candidate=cmsAiContentCandidate('recette',json_encode(contentFixture('recette'),
        JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR));
    recipeProfileCheck(!array_key_exists('recipe_astro',$candidate)
        && !array_key_exists('recipe_astro',cmsAiContentSchema('recette')['properties']),
        'AI_CORE_CONTRACT_UNCHANGED');
    $postedCopy=cmsCreationPosted(['kind'=>'recette','recipe_astro'=>$profile]);
    recipeProfileCheck($postedCopy['recipe_astro']===$profile,'C2_FORM_SNAPSHOT');
    echo 'CMS_RECIPE_ASTRO_PROFILE_C4B1_PASS '.json_encode([
        'profile_versions'=>3,'legacy_preserved'=>true,
        'ai_contract_changed'=>false,'publication_authorized'=>false],
        JSON_THROW_ON_ERROR)."\n";
}finally{
    recipeProfileCleanup($private);
}
