<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/lib.php';
function ensure(bool $condition,string $message):void{
    if(!$condition)throw new RuntimeException('CMS_GUIDED_REAL_DATA_'.$message);
}
$dist=realpath($argv[1]??'');
if(!$dist || !is_dir($dist))throw new RuntimeException('DIST_MISSING');
function jsonFile(string $folder,string $name):array {
    $raw=file_get_contents($folder.'/'.$name);
    if(!is_string($raw))throw new RuntimeException('JSON_MISSING_'.$name);
    $data=json_decode($raw,true,64,JSON_THROW_ON_ERROR);
    if(!is_array($data))throw new RuntimeException('JSON_INVALID_'.$name);
    return $data;
}
$catalog=cmsSourceList(jsonFile($dist,'social-feed.json'));
$canon=cmsCanonicalSourceList(jsonFile($dist,'editorial-source-index.json'),$catalog);
$guides=cmsGuidedSourceList(jsonFile($dist,'editorial-guided-fields.json'),$canon);
ensure(count($catalog)===35 && count($canon)===35 && count($guides)===35,'INCOMPLETE_FAMILY');
// Simulate POST serialization faithfully (HTML excludes only protected row metadata).
function postValue(mixed $value):mixed {
    if(is_array($value)){
        $out=[];
        foreach($value as $name=>$v){
            if(in_array($name,['id','scalable'],true))continue;
            $out[$name]=postValue($v);
        }
        return $out;
    }
    if(is_bool($value))throw new RuntimeException('UNEXPECTED_BOOLEAN');
    return (string)$value;
}
$kinds=[];
foreach($guides as $id=>$entry){
    $model=$entry['model'];
    $kinds[$model]=($kinds[$model]??0)+1;
    $form=postValue($entry['fields']);
    $json=cmsBuildGuidedPatch($entry,$form);
    $patch=json_decode($json,true,64,JSON_THROW_ON_ERROR);
    ensure($patch['schema_version']===1 && count($patch)===count($entry['fields'])+1,'PATCH_MISSING_'.$id);
    foreach($entry['fields'] as $key=>$value)
        ensure(array_key_exists($key,$patch),'FIELD_MISSING_'.$id.'_'.$key);
    $html=cmsGuidedHtml('guided',$entry['fields'],'Fiche');
    ensure(str_contains($html,'name="guided['),'HTML_INPUT_MISSING_'.$id);
    ensure(!str_contains($html,'audioScript'),'AUDIO_LEAK_'.$id);
    $preview=cmsGuidedPreviewHtml('fiche',$patch);
    ensure(str_contains($preview,'preview-fields'),'HUMAN_PREVIEW_MISSING_'.$id);
    ensure(!str_contains($preview,'audioScript'),'PREVIEW_AUDIO_LEAK_'.$id);
}
// Mobile usability regression: no truncated single-line workshop text.
$mobile=cmsGuidedHtml('guided[finalPreparation]',
    'Des assiettes de Bai Sach Chrouk avec porc entierement cuit et riz jasmin chaud.',
    'finalPreparation');
ensure(str_contains($mobile,'<textarea'),'MOBILE_LONG_TEXT_CLIPPED');
$initial=cmsGuidedHtml('guided[beforeStarting]',
    ['Indiquez le nombre de personnes à table.', 'Préparez les pickles et la sauce.'],
    'beforeStarting');
ensure(str_contains($initial,'Indiquez le nombre de personnes à table.'),
    'COLLAPSED_LABEL_GENERIC');
ensure(!str_contains($initial,'Préparation initiale 1</summary>'),
    'COLLAPSED_LABEL_UNHELPFUL');
$unsafe=cmsGuidedHtml('guided[beforeStarting]',
    ['<img src=x onerror=alert(1)>'], 'beforeStarting');
ensure(!str_contains($unsafe,'<img'),'COLLAPSED_LABEL_HTML_INJECTION');
$unsafePreview=cmsGuidedPreviewHtml('fiche',
    ['intro'=>'<script>alert(1)</script>', 'steps'=>[['title'=>'A',
        'text'=>'Texte de test']]]);
ensure(!str_contains($unsafePreview,'<script>') && str_contains($unsafePreview,'&lt;script&gt;'),
    'PREVIEW_HTML_INJECTION');

// Server filters: category, search, review statuses, stale record.
$fake=[
    'recette:amok-trey'=>['id'=>'recette:amok-trey','title'=>'Amok Trey','summary'=>'Poisson au coco','kind'=>'recette','fingerprint'=>str_repeat('a',16)],
    'culture:riz'=>['id'=>'culture:riz','title'=>'Le riz','summary'=>'Cultures et rizières','kind'=>'culture','fingerprint'=>str_repeat('b',16)],
    'atelier:samlor-machu'=>['id'=>'atelier:samlor-machu','title'=>'Samlor Mâchu','summary'=>'Tamarin','kind'=>'atelier','fingerprint'=>str_repeat('c',16)]
];
$drafts=[
    'recette:amok-trey'=>['state'=>'draft','source_fingerprint'=>str_repeat('a',16)],
    'atelier:samlor-machu'=>['state'=>'review','source_fingerprint'=>str_repeat('f',16)]
];
ensure(count(cmsFilterCatalog($fake,$drafts,'recette','','all'))===1,'KIND_FILTER');
ensure(count(cmsFilterCatalog($fake,$drafts,'all','poisson','all'))===1,'SUMMARY_FILTER');
ensure(count(cmsFilterCatalog($fake,$drafts,'all','RIZ','all'))===1,'CASE_FILTER');
ensure(count(cmsFilterCatalog($fake,$drafts,'all','','without'))===1,'WITHOUT_FILTER');
ensure(count(cmsFilterCatalog($fake,$drafts,'all','','draft'))===1,'DRAFT_FILTER');
ensure(count(cmsFilterCatalog($fake,$drafts,'all','','review'))===1,'REVIEW_FILTER');
ensure(count(cmsFilterCatalog($fake,$drafts,'all','','stale'))===1,'STALE_FILTER');
if(function_exists('iconv')||function_exists('transliterator_transliterate'))
  ensure(count(cmsFilterCatalog($fake,$drafts,'all','MACHU','all'))===1,'ACCENT_FILTER');
echo 'CMS_GUIDED_REAL_DATA_PASS '.json_encode(['total'=>count($guides),'models'=>$kinds])."\n";
