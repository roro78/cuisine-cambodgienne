<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/publication-gap-audit.php';
function nativeCheck(bool $ok,string $label):void {
    if(!$ok)throw new RuntimeException('C4C2_'.$label);
}
function nativeCleanup(string $dir):void {
    if(!is_dir($dir))return;
    foreach(scandir($dir)?:[] as $name){
        if($name==='.'||$name==='..')continue;
        $p=$dir.'/'.$name;
        if(is_dir($p)&&!is_link($p))nativeCleanup($p);else unlink($p);
    }
    rmdir($dir);
}
function nativeInput(string $kind,string $title):array {
    $fields=[];
    foreach(cmsCreationSchema()[$kind] as $name=>$spec){
        if($spec[1]==='rows'){
            $row=[];
            foreach($spec[2] as $key=>$label)$row[$key]='Contenu test '.$key;
            $fields[$name]=[$row];
        }elseif($spec[1]==='list'){
            $fields[$name]="Ligne éditoriale première\nLigne éditoriale seconde";
        }else $fields[$name]='Contenu à relire '.$name;
    }
    return ['kind'=>$kind,'title'=>$title,'angle'=>'Sujet distinct à relire',
        'summary'=>'Résumé interne à contrôler','research_note'=>'SECRET_RESEARCH_ONLY_C4C2',
        'target_date'=>'','state'=>'draft','fields'=>$fields];
}
$private=sys_get_temp_dir().'/cdc-native-c4c2-'.bin2hex(random_bytes(8));
nativeCheck(mkdir($private,0700),'PRIVATE_DIR');
try{
    $ingredient=nativeInput('ingredient','Fiche ingrédient pilote C4C2');
    $v1=cmsCreationSave($private,$ingredient,[],0);
    $projected=cmsIngredientAstroDraftProjection($v1);
    $draft=$projected['draft'];
    nativeCheck($projected['contract']==='cdc-editorial-ingredient-astro-draft-v1'
        && $projected['requires_human_review']===true
        && $projected['publication_ready']===false
        && count($draft['deepDive'])===2
        && count($draft['seoKeywords'])===2
        && $draft['intro']==='Contenu à relire intro'
        && !isset($draft['image'])
        && !isset($draft['imageWidth']), 'INGREDIENT_MODEL_WITHOUT_MEDIA');
    nativeCheck(!str_contains(json_encode($projected,JSON_THROW_ON_ERROR),
        'SECRET_RESEARCH_ONLY_C4C2'),'INGREDIENT_PRIVATE_NOT_EXPORTED');
    $old=nativeInput('technique','Fiche technique pilote C4C2');
    $catalog=[
        'recette:kuy-teav'=>['id'=>'recette:kuy-teav','kind'=>'recette',
            'slug'=>'kuy-teav','title'=>'Soupe témoin'],
        'atelier:bouillon-leger-savoureux'=>[
            'id'=>'atelier:bouillon-leger-savoureux','kind'=>'atelier',
            'slug'=>'bouillon-leger-savoureux','title'=>'Atelier témoin']
    ];
    $v2=cmsCreationSave($private,$old,$catalog,0);
    nativeCheck(!isset($v2['technique_links']),'LEGACY_DRAFT_ACCEPTED');
    $legacyHash=hash_file('sha256',cmsCreationDir($private).'/'.$v2['id'].'.0001.json');
    $old['technique_links']=['version'=>'1','recipeSlugs'=>"kuy-teav",
        'workshopSlug'=>'bouillon-leger-savoureux'];
    $v3=cmsCreationSave($private,$old,$catalog,1,$v2['id']);
    $proj=cmsTechniqueAstroDraftProjection($v3);
    nativeCheck($v3['version']===2
        && $v3['technique_links']['recipeSlugs']===['kuy-teav']
        && $proj['draft']['recipeSlugs']===['kuy-teav']
        && $proj['draft']['workshopSlug']==='bouillon-leger-savoureux'
        && $proj['publication_ready']===false
        && !isset($proj['draft']['image'])
        && count($proj['draft']['questions'])===1,'TECHNIQUE_VALID_CANONICAL_LINKS');
    nativeCheck(!str_contains(json_encode($proj,JSON_THROW_ON_ERROR),
        'SECRET_RESEARCH_ONLY_C4C2'),'TECHNIQUE_PRIVATE_NOT_EXPORTED');
    $gap=cmsAstroPublicationGapReport($v3);
    nativeCheck($gap['publication_ready']===false
        && $gap['technique_recipe_links_count']===1,'GAP_FAIL_CLOSED');
    $oldVersion=$v3;
    unset($old['technique_links']);
    $v4=cmsCreationSave($private,$old,$catalog,2,$v2['id']);
    nativeCheck($v4['technique_links']===$v3['technique_links']
        && hash_file('sha256',cmsCreationDir($private).'/'.$v2['id'].'.0001.json')
            ===$legacyHash,'OLDER_EDITOR_PRESERVES_LINKS_AND_HISTORY');
    $bad=$old;
    $bad['technique_links']=['version'=>'1','recipeSlugs'=>"not-published",
        'workshopSlug'=>''];
    try{
        cmsCreationSave($private,$bad,$catalog,3,$v2['id']);
        throw new RuntimeException('ACCEPTED_UNKNOWN_RECIPE');
    }catch(InvalidArgumentException $e){
        nativeCheck($e->getMessage()==='TECHNIQUE_LINKS_NOT_PUBLISHED',
            'UNPUBLISHED_RECIPE_BLOCKED');
    }
    $bad['technique_links']=['version'=>'1','recipeSlugs'=>"kuy-teav",
        'workshopSlug'=>'invented-workshop'];
    try{
        cmsCreationSave($private,$bad,$catalog,3,$v2['id']);
        throw new RuntimeException('ACCEPTED_UNKNOWN_WORKSHOP');
    }catch(InvalidArgumentException $e){
        nativeCheck($e->getMessage()==='TECHNIQUE_LINKS_NOT_PUBLISHED',
            'UNPUBLISHED_WORKSHOP_BLOCKED');
    }
    $bad['technique_links']=['version'=>'1',
        'recipeSlugs'=>"kuy-teav\nkuy-teav",'workshopSlug'=>''];
    try{
        cmsCreationSave($private,$bad,$catalog,3,$v2['id']);
        throw new RuntimeException('ACCEPTED_DUPLICATE_RECIPE');
    }catch(InvalidArgumentException $e){
        nativeCheck($e->getMessage()==='TECHNIQUE_LINKS_RECIPE',
            'DUPLICATES_BLOCKED');
    }
    $bad['technique_links']=['version'=>'1','recipeSlugs'=>[],
        'workshopSlug'=>'','publication_ready'=>true];
    try{
        cmsCreationSave($private,$bad,$catalog,3,$v2['id']);
        throw new RuntimeException('ACCEPTED_FORGED_APPROVAL');
    }catch(InvalidArgumentException $e){
        nativeCheck($e->getMessage()==='TECHNIQUE_LINKS_SCHEMA',
            'FORGED_APPROVAL_BLOCKED');
    }
    nativeCheck(count(cmsCreationVersions(cmsCreationDir($private),$v2['id']))===3,
        'INVALID_NO_REVISION');
    $forged=$v3;$forged['publication_ready']=true;$forged['reviewed']=true;
    nativeCheck(cmsTechniqueAstroDraftProjection($forged)['publication_ready']===false,
        'APPROVAL_IGNORE');
    $html=cmsTechniqueLinksHtml([
        'recipeSlugs'=>["<script>alert(1)</script>"],'workshopSlug'=>''
    ]);
    nativeCheck(str_contains($html,'&lt;script&gt;')
        && !str_contains($html,'<script>')
        && str_contains($html,'name="technique_links[recipeSlugs]"'),
        'STUDIO_HTML_ESCAPED');
    $posted=cmsCreationPosted(['kind'=>'technique','technique_links'=>$v3['technique_links']]);
    nativeCheck($posted['technique_links']===$v3['technique_links']
        && !array_key_exists('technique_links',
            cmsAiContentSchema('technique')['properties']), 'C2_UNCHANGED');
    $source=file_get_contents(__DIR__.'/../../public/gestion-contenus/index.php');
    nativeCheck(is_string($source)
        && str_contains($source,'cmsTechniqueLinksHtml')
        && str_contains($source,'cmsIngredientAstroDraftProjection($creation)')
        && str_contains($source,'cmsTechniqueAstroDraftProjection($creation)'),
        'SAME_STUDIO');
    echo "CMS_INGREDIENT_TECHNIQUE_ASTRO_C4C2_PASS ".
        json_encode(['private_versions'=>3,'families'=>2,
            'publication_authorized'=>false,'realProviderCalls'=>0],
            JSON_THROW_ON_ERROR)."\n";
}finally{nativeCleanup($private);}
