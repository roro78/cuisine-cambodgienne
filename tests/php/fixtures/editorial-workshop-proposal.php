<?php
declare(strict_types=1);
require_once __DIR__.'/editorial-ai-content.php';
function completeWorkshopFixture(string $dist):array{
 if(!function_exists('cmsCoralWorkshopRequest')){
  // Production sources need the real generated policy beside their include.
  // Assemble that existing layout in an isolated test directory, not webroot.
  $runtime=sys_get_temp_dir().'/cdc-complete-contract-'.bin2hex(random_bytes(8));mkdir($runtime,0700);
  foreach(['lib.php','coral-v2-ai.php'] as $name)copy(__DIR__.'/../../../public/gestion-contenus/'.$name,$runtime.'/'.$name);
  if(PHP_OS_FAMILY==='Windows'){
   // Test-only copy, same convention as the existing browser fixture. Real
   // POSIX permission evidence is supplied by Linux PHP CI, never Windows.
   $lib=(string)file_get_contents($runtime.'/lib.php');$lib=str_replace('fileperms(','completeFixturePermissions(',$lib);
   $lib.="\nfunction completeFixturePermissions(string \$p):int{return fileperms(\$p)&~0077;}\n";
   file_put_contents($runtime.'/lib.php',$lib);
  }
  copy($dist.'/gestion-contenus/coral-v2-contract.json',$runtime.'/coral-v2-contract.json');
  register_shutdown_function(static function()use($runtime):void{
   foreach(['lib.php','coral-v2-ai.php','coral-v2-contract.json'] as $name)if(is_file($runtime.'/'.$name))unlink($runtime.'/'.$name);
   if(is_dir($runtime))rmdir($runtime);
  });
  if(!function_exists('cmsCreationSave'))require_once $runtime.'/lib.php';
  require_once $runtime.'/coral-v2-ai.php';
 }
 $read=static fn(string $n):array=>json_decode((string)file_get_contents($dist.'/'.$n),true,64,JSON_THROW_ON_ERROR);
 $catalog=cmsSourceList($read('social-feed.json'));$canonical=cmsCanonicalSourceList($read('editorial-source-index.json'),$catalog);
 $guided=cmsGuidedSourceList($read('editorial-guided-fields.json'),$canonical);
 $slug='amok-trey';$id='recette:'.$slug;
 $draft=['id'=>'c-'.str_repeat('b',24),'version'=>1,'kind'=>'atelier','title'=>'Atelier fictif de qualification complète',
  'angle'=>'Angle synthétique à vérifier','summary'=>'Brief fictif, aucune production réelle',
  'research_note'=>'PRIVATE_DRAFT_NOTE_DO_NOT_TRANSMIT','fields'=>cmsCreationCleanFields('atelier',[]),
  'atelier_reference'=>cmsAtelierReferenceClean(['version'=>1,'recipeSlug'=>$slug],$catalog)];
 $research=['recipe_sha256'=>$canonical[$id]['fingerprint'],'verified_at'=>gmdate('Y-m-d'),
  'sources'=>[['title'=>'Source fictive A','url'=>'https://a.example.invalid/recipe','note'=>'Jeu de test, aucune vérification culinaire réelle.'],
   ['title'=>'Source fictive B','url'=>'https://b.example.invalid/recipe','note'=>'Jeu de test, aucune vérification culinaire réelle.']],
  'cooking_test_performed'=>false];
 $request=cmsCoralWorkshopRequest($draft,$catalog,$canonical,$guided,$research);
 $base=contentFixture('atelier');$phase=['summary'=>'Proposition fictive pour tests isolés.',
  'research_note'=>'Preuve synthétique uniquement',
  'profile'=>['difficulty'=>'Intermédiaire','practicalMinutes'=>30,'waitingNote'=>'Temps fictifs non validés.',
    'allergens'=>['poisson','œuf'],'safety'=>['Précaution fictive pour test isolé.']],
  'fields'=>$base['fields'],'phase_details'=>[]];
 foreach(cmsAtelierPhaseIds() as $phaseId)$phase['phase_details'][]=['id'=>$phaseId,'minutes'=>5,
  'ingredientNames'=>array_column($guided[$id]['fields']['ingredients'],'name'),
  'actions'=>['Geste fictif pour vérifier le contrat de stockage.'],
  'observe'=>'Repère synthétique','check'=>'Contrôle synthétique','mistake'=>'Erreur synthétique',
  'recovery'=>'Correction synthétique','safety'=>'Précaution synthétique','pausePrompt'=>'Pause fictive pour le test.'];
 $voice=str_repeat('Nous allons cuisiner tranquillement. Observez la texture, ajustez le geste avec précaution et prenez le temps de reconnaître le résultat avant de poursuivre. ',4);
 $chapters=array_map(static fn(string $chapterId):array=>['id'=>$chapterId,'text'=>$voice],cmsAtelierScriptIds());
 return compact('draft','request','phase','chapters','catalog','canonical','guided','research');
}
if(realpath((string)($_SERVER['SCRIPT_FILENAME']??''))===__FILE__){
 $f=completeWorkshopFixture($argv[1]);echo json_encode(array_intersect_key($f,array_flip(['request','phase','chapters'])),JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
}
