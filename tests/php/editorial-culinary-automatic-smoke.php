<?php
declare(strict_types=1);
// Pure deterministic regressions: no private store, visa, network or provider.
require_once dirname(__DIR__,2).'/public/gestion-contenus/lib.php';
require_once dirname(__DIR__,2).'/public/gestion-contenus/publication-gap-audit.php';
$recipe=['baseServings'=>4,'prepTime'=>'30 min','cookTime'=>'25 min',
    'ingredients'=>[['name'=>'poisson','quantity'=>600,'unit'=>'g'],['name'=>'œufs','quantity'=>2]],'steps'=>[]];
$record=['kind'=>'atelier','fields'=>['beforeStarting'=>['Allergènes de cette version : poisson et œufs.']],
    'atelier_phase_details'=>['phases'=>[['ingredientNames'=>['poisson','œufs'],'minutes'=>55]]],
    'atelier_scripts'=>['chapters'=>[['id'=>'rectifier','text'=>'Visez 72 °C à cœur.']]]];
$assert=static function(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);};
$codes=static fn(array $r):array=>array_column($r['findings'],'code');
$passed=[];
foreach(['Visez 50 °C.','Visez au moins 50 degrés Celsius.','Atteindre 62,9 °C.',
    'Visez cinquante degrés Celsius.','Visez au moins soixante-dix degrés à cœur.',
    'Objectif de soixante-dix virgule neuf degrés Celsius.',
    'Atteindre soixante‑deux degrés Celsius.','Visez moins cinq degrés Celsius.'] as $text){
    $r=$record;$r['atelier_scripts']['chapters'][0]['text']=$text;
    $report=cmsCulinaryAutomaticAudit($r,$recipe);
    $assert($report['checks']['safety']==='bloquant'&&in_array('CORE_TEMPERATURE_TOO_LOW',$codes($report),true),
        'INSUFFICIENT_TEMPERATURE_NOT_BLOCKED: '.$text);
}
$passed[]='DIGITS_WORDS_DECIMALS_AND_HYPHENS_BLOCK_UNSAFE_TARGETS';
foreach(['Visez 72 °C.','Visez au moins soixante-douze degrés Celsius au cœur.',
    'Atteindre soixante et onze virgule un degrés.','Objectif de quatre-vingts degrés Celsius.',
    'Visez septante-deux degrés.'] as $text){
    $r=$record;$r['atelier_scripts']['chapters'][0]['text']=$text;
    $assert(cmsCulinaryAutomaticAudit($r,$recipe)['checks']['safety']==='conforme','SAFE_TARGET_FALSE_POSITIVE: '.$text);
}
$r=$record;$r['atelier_scripts']['chapters'][0]['text']='Visez 72 °C puis visez cinquante degrés Celsius.';
$assert(in_array('CORE_TEMPERATURE_TOO_LOW',$codes(cmsCulinaryAutomaticAudit($r,$recipe)),true),'SECOND_TEMPERATURE_IGNORED');
$r=$record;$r['atelier_scripts']['chapters'][0]['text']='Gardez le poisson au froid à 4 °C. Visez soixante-douze degrés à cœur.';
$assert(cmsCulinaryAutomaticAudit($r,$recipe)['checks']['safety']==='conforme','STORAGE_TEMPERATURE_IS_NOT_CORE_TARGET');
$passed[]='ALL_TARGETS_CHECKED_WITHOUT_CONFUSING_COLD_STORAGE';
$text='Versez 250 ml de lait, puis 3 c. à soupe de pâte et 2 œufs. Cuisez 18 à 25 minutes à 72 °C.';
$withDoses=$recipe;$withDoses['steps']=[['text'=>$text]];
$contract=['steps'=>[['index'=>0,'sourceText'=>$text,'anchors'=>['250 ml']]]];
$changed=['kind'=>'recette','fields'=>$withDoses];
$report=cmsCulinaryAutomaticAudit($changed,$recipe,$contract);
$unbound=array_values(array_filter($report['findings'],static fn($f)=>$f['code']==='INSTRUCTION_QUANTITY_BINDING_REQUIRED'));
$assert(array_column($unbound,'passage')===['3 c. à soupe','2 œufs'],'PARTIALLY_BOUND_STEP_HIDES_OTHER_DOSES');
$assert(array_column($unbound,'severity')===['bloquant','bloquant'],'NEW_UNBOUND_DOSES_NOT_BLOCKING');
$assert($unbound[0]['location']!==$unbound[1]['location'],'QUANTITY_LOCATIONS_NOT_DISTINCT');
$contract['steps'][0]['anchors']=['250 ml','3 c. à soupe','2 œufs'];
$assert(!in_array('INSTRUCTION_QUANTITY_BINDING_REQUIRED',$codes(cmsCulinaryAutomaticAudit($changed,$recipe,$contract)),true),'FULLY_BOUND_STEP_FALSE_POSITIVE');
$repeated=$recipe;$repeated['steps']=[['text'=>'Versez 250 ml puis encore 250 ml.']];
$contract=['steps'=>[['index'=>0,'sourceText'=>$repeated['steps'][0]['text'],'anchors'=>['250 ml']]]];
$report=cmsCulinaryAutomaticAudit(['kind'=>'recette','fields'=>$repeated],$recipe,$contract);
$assert(count(array_filter($report['findings'],static fn($f)=>$f['code']==='INSTRUCTION_QUANTITY_BINDING_REQUIRED'))===2,'AMBIGUOUS_REPEATED_ANCHOR_TRUSTED');
$passed[]='EVERY_QUANTITY_CHECKED_IN_PARTIALLY_BOUND_AND_REPEATED_STEPS';
// Names in ingredients, prose, equipment or spoken text are NOT declarations.
$r=$record;$r['fields']=['ingredients'=>$recipe['ingredients'],'intro'=>'poisson et œufs',
    'equipment'=>['Allergènes : poisson et œufs.'],'beforeStarting'=>['Préparer le poisson et les œufs.']];
$r['atelier_scripts']['chapters'][0]['text']='Cette recette contient du poisson et des œufs. Visez 72 °C.';
$report=cmsCulinaryAutomaticAudit($r,$recipe);
$missing=array_filter($report['findings'],static fn($f)=>$f['code']==='ALLERGEN_DECLARATION_MISSING');
$assert(count($missing)===2,'INGREDIENT_OR_ARBITRARY_PROSE_ACCEPTED_AS_ALLERGEN_DECLARATION');
foreach(['beforeStarting','beforeYouStart','notes'] as $key){
    $declared=$r;$declared['fields'][$key]=['Allergènes : poisson et œufs.'];
    $assert(!in_array('ALLERGEN_DECLARATION_MISSING',$codes(cmsCulinaryAutomaticAudit($declared,$recipe)),true),'LABELLED_PREPARATION_DECLARATION_REJECTED: '.$key);
}
$r['atelier_phase_details']['phases'][0]['safety']='Allergènes : poisson et œufs.';
$assert(!in_array('ALLERGEN_DECLARATION_MISSING',$codes(cmsCulinaryAutomaticAudit($r,$recipe)),true),'SAFETY_DECLARATION_REJECTED');
$r['atelier_phase_details']['phases'][0]['safety']='Allergènes : poisson.';
$report=cmsCulinaryAutomaticAudit($r,$recipe);
$missing=array_values(array_filter($report['findings'],static fn($f)=>$f['code']==='ALLERGEN_DECLARATION_MISSING'));
$assert(count($missing)===1&&$missing[0]['passage']==='œufs','PARTIAL_DECLARATION_HIDES_MISSING_EGG');
$r['fields']['beforeStarting']=['Allergènes : sans œufs, poisson.'];
$assert(cmsCulinaryAutomaticAudit($r,$recipe)['checks']['safety']==='bloquant','FALSE_ALLERGEN_FREE_CLAIM_ALLOWED');
$r['fields']['beforeStarting']=[];$r['atelier_phase_details']['phases'][0]['safety']='Allergènes : poisson, sans œufs.';
$assert(cmsCulinaryAutomaticAudit($r,$recipe)['checks']['safety']==='bloquant','FALSE_SAFETY_ALLERGEN_FREE_CLAIM_ALLOWED');
$passed[]='EXPLICIT_ALLERGEN_DECLARATIONS_REQUIRED_AND_CONTRADICTIONS_BLOCKED';
echo 'CULINARY_AUTOMATIC_REGRESSIONS_PASS '.json_encode($passed,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)."\n";
