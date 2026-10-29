<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/publication-gap-audit.php';
function auditCheck(bool $ok,string $label):void {
    if(!$ok)throw new RuntimeException('C4C3E_'.$label);
}
function auditFail(callable $fn,string $code):void {
    try{$fn();throw new RuntimeException('UNEXPECTED_ACCEPT');}
    catch(InvalidArgumentException|RuntimeException $e){
        auditCheck($e->getMessage()===$code,'REJECT_'.$code);
    }
}
$dist=realpath($argv[1]??'');
auditCheck(is_string($dist),'DIST');
$read=static fn(string $name):array=>json_decode(
    file_get_contents($dist.'/'.$name),true,64,JSON_THROW_ON_ERROR);
$catalog=cmsSourceList($read('social-feed.json'));
$canonical=cmsCanonicalSourceList($read('editorial-source-index.json'),$catalog);
$guided=cmsGuidedSourceList($read('editorial-guided-fields.json'),$canonical);
cmsAssertGuidedCoverage($guided,$canonical);
$recipeId=null;
foreach($canonical as $id=>$meta){
    if($meta['model']==='recipes'
        &&count($guided[$id]['fields']['ingredients']??[])>0){
        $recipeId=$id;break;
    }
}
auditCheck(is_string($recipeId),'REAL_RECIPE');
$slug=substr($recipeId,8);
$first=$guided[$recipeId]['fields']['ingredients'][0]['name']??null;
auditCheck(is_string($first)&&$first!=='','REAL_INGREDIENT');
$record=[
    'kind'=>'atelier','research_note'=>'PRIVATE_RESEARCH_NOT_PUBLIC',
    'atelier_reference'=>['version'=>1,'recipeSlug'=>$slug,
        'catalogFingerprint'=>$catalog[$recipeId]['fingerprint']],
    'atelier_phase_details'=>['phases'=>[
        ['ingredientNames'=>[$first,'unknown synthetic item']]
    ]]
];
$report=cmsAtelierCanonicalRecipeAudit($record,$catalog,$canonical,$guided);
auditCheck($report['recipe_id']===$recipeId
    &&$report['canonical_sha256']===$canonical[$recipeId]['fingerprint']
    &&$report['canonical_servings']===$guided[$recipeId]['fields']['baseServings']
    &&count($report['canonical_ingredients'])===
        count($guided[$recipeId]['fields']['ingredients'])
    &&$report['phase_ingredient_mentions']===2
    &&$report['phase_ingredient_not_exact']===['unknown synthetic item']
    &&$report['model_supported_for_quantity_review']===true
    &&$report['requires_human_recipe_review']===true
    &&$report['canonical_recipe_details_revalidated']===false
    &&$report['audio_approved']===false
    &&$report['publication_ready']===false,'REAL_DATA_NOT_APPROVAL');
auditCheck(!str_contains(json_encode($report,JSON_THROW_ON_ERROR),
    'PRIVATE_RESEARCH_NOT_PUBLIC'),'PRIVATE_DATA_NOT_EXPORTED');
$broken=$canonical;$broken[$recipeId]['fingerprint']=str_repeat('0',64);
auditFail(static fn()=>cmsAtelierCanonicalRecipeAudit($record,$catalog,$broken,$guided),
    'ATELIER_RECIPE_AUDIT_SOURCE');
$missing=$guided;unset($missing[$recipeId]);
auditFail(static fn()=>cmsAtelierCanonicalRecipeAudit($record,$catalog,$canonical,$missing),
    'ATELIER_RECIPE_AUDIT_SOURCE');
$bad=$record;$bad['atelier_reference']['recipeSlug']='invented-slug';
auditFail(static fn()=>cmsAtelierCanonicalRecipeAudit($bad,$catalog,$canonical,$guided),
    'ATELIER_REFERENCE_NOT_PUBLISHED');
$bad=$record;$bad['kind']='culture';
auditFail(static fn()=>cmsAtelierCanonicalRecipeAudit($bad,$catalog,$canonical,$guided),
    'ATELIER_RECIPE_AUDIT_KIND');
$legacy=null;
foreach($canonical as $id=>$meta){
    if($meta['model']==='restoredRecipes'){$legacy=$id;break;}
}
if($legacy!==null){
    $historical=$record;
    $historical['atelier_reference']['recipeSlug']=substr($legacy,8);
    $historical['atelier_reference']['catalogFingerprint']=$catalog[$legacy]['fingerprint'];
    $legacyReport=cmsAtelierCanonicalRecipeAudit($historical,$catalog,$canonical,$guided);
    auditCheck($legacyReport['canonical_servings']===null
        &&$legacyReport['model_supported_for_quantity_review']===false
        &&$legacyReport['publication_ready']===false,'LEGACY_NO_INVENTED_DOSES');
}
$ui=file_get_contents(__DIR__.'/../../public/gestion-contenus/index.php');
auditCheck(is_string($ui)
    &&str_contains($ui,"if(isset(\$_GET['recipe_audit']))")
    &&str_contains($ui,'cmsGetGuidedFields()')
    &&str_contains($ui,'cmsAssertGuidedCoverage')
    &&str_contains($ui,'data-atelier-recipe-audit')
    &&str_contains($ui,"cmsEsc(\$item['name'])"),
    'PRIVATE_ON_DEMAND_UI');
echo "CMS_CANONICAL_RECIPE_AUDIT_C4C3E_PASS ".
    json_encode(['sha256'=>true,'real_recipe'=>true,'legacy_safe'=>true,
        'publish'=>false,'audio'=>false],JSON_THROW_ON_ERROR)."\n";
