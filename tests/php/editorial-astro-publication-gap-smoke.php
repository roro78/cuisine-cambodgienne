<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/publication-gap-audit.php';
require_once __DIR__.'/fixtures/editorial-ai-content.php';
function gapAssert(bool $condition,string $name):void {
    if(!$condition)throw new RuntimeException('ASTRO_GAP_TEST_'.$name);
}
$required=[
    'recette'=>['difficulty','category','tags'],
    'culture'=>['sources','imageWidth','imageWidths'],
    'atelier'=>['sourceRecipeSlug','recipeIngredients','audio','releaseAuthorization'],
    'ingredient'=>['imageWidth','imageWidths'],
    'technique'=>['recipeSlugs','imageAlt']
];
gapAssert(count(cmsAstroPublicationCoverage())===5,'FIVE_FAMILIES');
foreach($required as $kind=>$terms){
    $candidate=cmsAiContentCandidate($kind,json_encode(
        contentFixture($kind),JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR));
    $record=['kind'=>$kind,'summary'=>$candidate['summary'],
        'fields'=>$candidate['fields'],'state'=>'review',
        'reviewed'=>true,'publication_ready'=>true,'origin'=>'ai'];
    $report=cmsAstroPublicationGapReport($record);
    gapAssert($report['contract']==='cdc-editorial-astro-gap-v1'
        && $report['scope']==='creation-form-core-v1'
        && $report['kind']===$kind
        && $report['form_core_complete']===true
        && $report['publication_ready']===false,'FAIL_CLOSED_'.$kind);
    $label=implode(' ',$report['not_covered']);
    foreach($terms as $term)
        gapAssert(str_contains($label,$term),'MISSING_'.strtoupper($kind).'_'.$term);
    gapAssert(count($report['pending_gates'])>=3
        && str_contains(implode(' ',$report['pending_gates']),'publication'),
        'HUMAN_GATE_'.$kind);
    $record['fields']=[];
    $incomplete=cmsAstroPublicationGapReport($record);
    gapAssert($incomplete['form_core_complete']===false
        && $incomplete['publication_ready']===false,'INCOMPLETE_'.$kind);
}
try{
    cmsAstroPublicationGapReport(['kind'=>'unknown']);
    throw new RuntimeException('TEST_NOT_THROWN');
}catch(InvalidArgumentException $e){
    gapAssert($e->getMessage()==='ASTRO_GAP_KIND','UNKNOWN_KIND');
}
$ui=file_get_contents(__DIR__.'/../../public/gestion-contenus/index.php');
gapAssert(is_string($ui)
    && str_contains($ui,"require_once __DIR__.'/publication-gap-audit.php';")
    && str_contains($ui,'data-astro-publication-gap')
    && str_contains($ui,'cmsAstroPublicationGapReport($creation)'),
    'IN_STUDIO_COMMON_PREVIEW');
echo 'CMS_ASTRO_PUBLICATION_GAP_PASS '.json_encode([
    'families'=>5,'publication_authorized'=>false,
    'full_astro_generation'=>false,'coral_v2_generated'=>false],
    JSON_THROW_ON_ERROR)."\n";
