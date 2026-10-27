<?php
declare(strict_types=1);
require __DIR__.'/../../public/gestion-contenus/lib.php';
function check(bool $ok,string $msg):void {if(!$ok)throw new RuntimeException($msg);}
$base=sys_get_temp_dir().'/cdc-cms-'.bin2hex(random_bytes(8));
mkdir($base,0700);
try{
  $items=[];$kinds=['recette','culture','atelier','ingredient','technique'];
  foreach($kinds as $kind){
    $slug=$kind.'-test';$route=match($kind){
      'culture'=>'culture','atelier'=>'apprendre',
      'ingredient'=>'ingredients','technique'=>'techniques',default=>'recettes'
    };
    $items[]=['id'=>$kind.':'.$slug,'kind'=>$kind,'title'=>'Titre '.$kind,
      'summary'=>'Résumé '.$kind,
      'url'=>'https://www.cuisine-du-cambodge.com/'.$route.'/'.$slug.'/',
      'fingerprint'=>'aaaaaaaaaaaaaaaa','imageUrl'=>null];
  }
  $feed=['schemaVersion'=>1,'product'=>'cuisine-du-cambodge','items'=>$items];
  $sourceList=cmsSourceList($feed);
  check(count($sourceList)===5,'Catalogue de cinq types incomplet');
  $id='recette:recette-test';
  check(cmsId('../traversal')===null,'Path traversal non rejeté');
  $dir=cmsDraftDir($base);
  check((fileperms($dir)&0077)===0,'Brouillons privés trop accessibles');
  check(cmsVersions($dir,$id)===[],'Version fantôme');
  $source=$sourceList[$id];
  $data=['title'=>'Titre proposé','summary'=>'Résumé proposé',
    'editorial_text'=>"Texte\navec <script>alert(1)</script>",
    'editor_note'=>'À relire','state'=>'draft'];
  $one=cmsSave($base,$source,$data,0,'aaaaaaaaaaaaaaaa');
  check($one['version']===1,'Première version non créée');
  check(cmsReadVersion($dir,$id,1)['title']==='Titre proposé','Lecture version 1');
  check(str_contains(cmsEsc('<script>'),'&lt;script&gt;'),'Échappement HTML');
  $conflict=false;
  try{cmsSave($base,$source,$data,0,'aaaaaaaaaaaaaaaa');}
  catch(RuntimeException $e){$conflict=$e->getMessage()==='CONFLICT';}
  check($conflict,'Écrasement concurrent possible');
  $modified=$source;$modified['fingerprint']='bbbbbbbbbbbbbbbb';
  $stale=false;
  try{cmsSave($base,$modified,$data,1,'bbbbbbbbbbbbbbbb');}
  catch(RuntimeException $e){$stale=$e->getMessage()==='SOURCE_CHANGED';}
  check($stale,'Modification de source non détectée');
  $data['state']='review';$data['title']='Deuxième version';
  $two=cmsSave($base,$source,$data,1,'aaaaaaaaaaaaaaaa');
  check($two['version']===2,'Deuxième version non créée');
  check(cmsVersions($dir,$id)===[2,1],'Historique désordonné');
  check(cmsReadVersion($dir,$id,1)['title']==='Titre proposé','Version originale modifiée');
  foreach(['published','deleted'] as $forbidden){
    $bad=$data;$bad['state']=$forbidden;
    $rejected=false;
    try{cmsSave($base,$source,$bad,2,'aaaaaaaaaaaaaaaa');}
    catch(InvalidArgumentException $e){$rejected=true;}
    check($rejected,'Publication directe autorisée');
  }
  $bad=$feed;$bad['items'][1]['id']=$id;
  try{cmsSourceList($bad);throw new RuntimeException('Doublon accepté');}
  catch(UnexpectedValueException $e){}
  $bad=$feed;$bad['items'][0]['url']='https://attacker.example/recettes/a/';
  try{cmsSourceList($bad);throw new RuntimeException('Hôte tiers accepté');}
  catch(UnexpectedValueException $e){}
  $bad=$feed;$bad['items'][0]['url']='https://evil@www.cuisine-du-cambodge.com/recettes/a/';
  try{cmsSourceList($bad);throw new RuntimeException('Utilisateur dans URL accepté');}
  catch(UnexpectedValueException $e){}

  // P0B: real Astro-shaped proposed patches (no writes to public content).
  $recipePatch=['schema_version'=>1,'baseServings'=>4,
    'ingredients'=>[['quantity'=>250,'unit'=>'ml','name'=>'lait de coco']],
    'steps'=>[['title'=>'Mélanger','text'=>'Mélanger les ingrédients avant cuisson.']]];
  $p=cmsValidateStructuredDraft('recette',json_encode($recipePatch,JSON_THROW_ON_ERROR));
  check($p['baseServings']===4 && count($p['steps'])===1,'Recette structurée rejetée');
  $restored=cmsValidateStructuredDraft('recette',
    '{"schema_version":1,"ingredients":["200 ml de lait de coco"]}');
  check($restored['ingredients'][0]==='200 ml de lait de coco','Recette historique rejetée');
  $culture=cmsValidateStructuredDraft('culture',
    '{"schema_version":1,"sections":[{"title":"Le riz","paragraphs":["Texte culturel."]}]}');
  check($culture['sections'][0]['title']==='Le riz','Carnet structuré rejeté');
  $atelier=cmsValidateStructuredDraft('atelier',json_encode(['schema_version'=>1,
    'phases'=>[['id'=>'preparer','title'=>'Préparer','minutes'=>4,
      'actions'=>['Préparer le mortier'],'observe'=>'Texture homogène',
      'check'=>'Tous les ingrédients sont prêts','learning'=>'Reconnaître la texture',
      'audioScript'=>'Texte proposé, aucun MP3 écrasé.']]],
    JSON_THROW_ON_ERROR));
  check(count($atelier['phases'])===1,'Phase atelier rejetée');
  foreach([
    ['recette','{"schema_version":1,"mp3_path":"/secret"}'],
    ['recette','{"schema_version":1,"ingredients":[{"name":"poisson","quantity":-1}]}'],
    ['atelier','{"schema_version":1,"phases":[{"id":"../bad","title":"X","minutes":1,"actions":["Go"],"observe":"X","check":"X","learning":"X","audioScript":"X"}]}'],
    ['culture','{"schema_version":1,"sections":[{"title":"X","paragraphs":[]}]}'],
    ['technique','{"schema_version":1,"steps":[{"title":"X","text":""}]}']
  ] as [$kind,$invalid]){
    $blocked=false;
    try{cmsValidateStructuredDraft($kind,$invalid);}
    catch(InvalidArgumentException $e){$blocked=true;}
    check($blocked,'Structure dangereuse acceptée pour '.$kind);
  }
  $structuredFields=$data;
  $structuredFields['structure_json']=json_encode($recipePatch,JSON_THROW_ON_ERROR);
  $canonEntries=[];
  $models=['recette'=>'recipes','culture'=>'culture','atelier'=>'workshops',
           'ingredient'=>'ingredients','technique'=>'recipeTechniques'];
  foreach($sourceList as $src){
    $canonEntries[]=['id'=>$src['id'],'kind'=>$src['kind'],
      'model'=>$models[$src['kind']],'fingerprint'=>str_repeat('a',64)];
  }
  $canon=cmsCanonicalSourceList(['product'=>'cuisine-du-cambodge',
    'schemaVersion'=>1,'digest'=>'sha256-full-astro-record-v1',
    'items'=>$canonEntries],$sourceList);
  check(count($canon)===5,'Index canonique incomplet');
  $missingCanonical=false;
  try{cmsSave($base,$source,$structuredFields,2,'aaaaaaaaaaaaaaaa');}
  catch(RuntimeException $e){$missingCanonical=$e->getMessage()==='CANONICAL_STALE_OR_MISSING';}
  check($missingCanonical,'Édition structurée autorisée sans index complet');
  $staleCanonical=false;
  try{cmsSave($base,$source,$structuredFields,2,'aaaaaaaaaaaaaaaa',
       $canon[$id],str_repeat('b',64));}
  catch(RuntimeException $e){$staleCanonical=$e->getMessage()==='CANONICAL_STALE_OR_MISSING';}
  check($staleCanonical,'Empreinte complète périmée acceptée');
  $third=cmsSave($base,$source,$structuredFields,2,'aaaaaaaaaaaaaaaa',
    $canon[$id],str_repeat('a',64));
  check(($third['structure']['schema_version']??0)===1 && $third['version']===3,
    'La proposition structurée ne se sauvegarde pas');
  check((cmsReadVersion($dir,$id,1)['structure']??null)===null,
    'Ancienne version modifiée par la proposition structurée');
  check(($third['canonical_fingerprint']??null)===str_repeat('a',64),
    'Empreinte de la vraie fiche Astro non mémorisée');
  $changed=$canon[$id];$changed['fingerprint']=str_repeat('b',64);
  $changedBlocked=false;
  try{cmsSave($base,$source,$structuredFields,3,'aaaaaaaaaaaaaaaa',
    $changed,str_repeat('b',64));}
  catch(RuntimeException $e){$changedBlocked=$e->getMessage()==='CANONICAL_CHANGED_OR_LEGACY';}
  check($changedBlocked,'Modification des ingrédients/MP3 Astro non détectée');
  $dropBlocked=false;
  try{cmsSave($base,$source,$data,3,'aaaaaaaaaaaaaaaa');}
  catch(RuntimeException $e){$dropBlocked=$e->getMessage()==='STRUCTURE_DROP_BLOCKED';}
  check($dropBlocked,'Effacement silencieux d’une proposition structurée accepté');
  $duplicates=$canonEntries;$duplicates[1]['id']=$duplicates[0]['id'];
  $rejectedDuplicate=false;
  try{cmsCanonicalSourceList(['product'=>'cuisine-du-cambodge',
    'schemaVersion'=>1,'digest'=>'sha256-full-astro-record-v1',
    'items'=>$duplicates],$sourceList);}
  catch(UnexpectedValueException $e){$rejectedDuplicate=true;}
  check($rejectedDuplicate,'Index canonique avec doublons accepté');
  $fourth=cmsSave($base,$source,$structuredFields,3,'aaaaaaaaaaaaaaaa',
    $canon[$id],str_repeat('a',64));
  check($fourth['version']===4 && cmsVersions($dir,$id)===[4,3,2,1],
    'Révision structurée autorisée échouée');
  check(count(glob($dir.'/*.json'))===4,'Publication involontaire');

  // Guided form: only edit specific rows, preserve inaccessible media/metadata.
  $guidedRecipe=['id'=>$id,'model'=>'recipes','editable'=>true,
    'fingerprint'=>str_repeat('a',64),
    'fields'=>['baseServings'=>4,'prepTime'=>'30 min','cookTime'=>'25 min',
      'ingredients'=>[
        ['quantity'=>600,'unit'=>'g','name'=>'poisson','group'=>'Base','scalable'=>false],
        ['quantity'=>250,'unit'=>'ml','name'=>'coco','note'=>'sans sucre']
      ],
      'steps'=>[['title'=>'Préparer','text'=>'Avant la cuisson','cue'=>'Base homogène']]]];
  $guidedWorkshop=['id'=>'atelier:atelier-test','model'=>'workshops','editable'=>true,
    'fingerprint'=>str_repeat('a',64),
    'fields'=>['steps'=>[['title'=>'Mortier','action'=>'Piler doucement',
       'observe'=>'La texture','cue'=>'Pâte fine','success'=>'Arômes libérés']]]];
  $guide=cmsGuidedSourceList(['product'=>'cuisine-du-cambodge',
    'schemaVersion'=>1,'dataContract'=>'approved-public-form-fields-v1',
    'items'=>[$guidedRecipe,$guidedWorkshop]],$canon);
  check(count($guide)===2,'Formulaire guidé absent');
  $input=['baseServings'=>'4','prepTime'=>'35 min','cookTime'=>'25 min',
    'ingredients'=>[
      ['quantity'=>'650','unit'=>'g','name'=>'poisson blanc'],
      ['quantity'=>'250,5','unit'=>'ml','name'=>'lait coco']
    ],
    'steps'=>[['title'=>'Préparer','text'=>'Mélanger avant cuisson',
      'cue'=>'La base est homogène']]];
  $json=cmsBuildGuidedPatch($guide[$id],$input);
  $parsed=json_decode($json,true,20,JSON_THROW_ON_ERROR);
  check($parsed['ingredients'][0]['quantity']===650
     && $parsed['ingredients'][1]['quantity']===250.5,
     'Modification quantité mobile non reconnue');
  check($parsed['ingredients'][0]['scalable']===false
     && $parsed['ingredients'][0]['group']==='Base'
     && $parsed['ingredients'][1]['note']==='sans sucre',
     'Champs non édités supprimés');
  check($parsed['steps'][0]['cue']==='La base est homogène',
     'Repère de recette perdu');
  $badForm=$input;
  $badForm['ingredients'][0]['evil']='secret';
  $blocked=false;
  try{cmsBuildGuidedPatch($guide[$id],$badForm);}
  catch(InvalidArgumentException $e){$blocked=true;}
  check($blocked,'Modification hors formulaire acceptée');
  $badForm=$input;
  array_pop($badForm['ingredients']);
  $blocked=false;
  try{cmsBuildGuidedPatch($guide[$id],$badForm);}
  catch(InvalidArgumentException $e){$blocked=true;}
  check($blocked,'Suppression de ligne autorisée');
  $badFeed=$guidedRecipe;$badFeed['fingerprint']=str_repeat('b',64);
  $blocked=false;
  try{cmsGuidedSourceList(['product'=>'cuisine-du-cambodge','schemaVersion'=>1,
     'dataContract'=>'approved-public-form-fields-v1','items'=>[$badFeed]],$canon);}
  catch(UnexpectedValueException $e){$blocked=true;}
  check($blocked,'Ancien formulaire source accepté');
  $workshopInput=['steps'=>[['title'=>'Mortier','action'=>'Piler',
    'observe'=>'Pâte','cue'=>'Texture fine','success'=>'Pâte prête']]];
  $workshopPatch=cmsBuildGuidedPatch($guide['atelier:atelier-test'],$workshopInput);
  check(json_decode($workshopPatch,true,10,JSON_THROW_ON_ERROR)['steps'][0]['action']==='Piler',
    'Atelier visuel non validé');
  $readOnly=['id'=>'atelier:atelier-test','model'=>'cookingWorkshopGuides',
     'editable'=>false,'fingerprint'=>str_repeat('a',64),
     'fields'=>['phases'=>[['id'=>'preparer','title'=>'Avant','learning'=>'Le geste']]]];
  $blocked=false;
  try{cmsBuildGuidedPatch($readOnly,['phases'=>[]]);}
  catch(InvalidArgumentException $e){$blocked=true;}
  check($blocked,'Atelier audio modifiable sans contrôle');

  // Review export: authenticated caller has supplied the current canonical
  // metadata and the immutable reviewed revision, never GitHub credentials.
  $reviewRequest=cmsBuildReviewedRecipeRequest($source,$canon[$id],$fourth,4);
  check(($reviewRequest['contract']??null)==='cuisine-cms-recipe-patch-v1'
     && ($reviewRequest['source_model']??null)==='recipes'
     && ($reviewRequest['review_version']??null)===4
     && ($reviewRequest['publication']??null)==='none'
     && ($reviewRequest['changes']['ingredients'][0]['name']??null)==='lait de coco',
     'Export de brouillon relu invalide');
  $bad=$fourth;$bad['state']='draft';$blocked=false;
  try{cmsBuildReviewedRecipeRequest($source,$canon[$id],$bad,4);}
  catch(RuntimeException $e){$blocked=true;}
  check($blocked,'Export non relu autorisé');
  $bad=$fourth;$bad['canonical_fingerprint']=str_repeat('b',64);$blocked=false;
  try{cmsBuildReviewedRecipeRequest($source,$canon[$id],$bad,4);}
  catch(RuntimeException $e){$blocked=true;}
  check($blocked,'Export sur recette modifiée autorisé');
  $blocked=false;
  try{cmsBuildReviewedRecipeRequest($source,$canon[$id],$fourth,3);}
  catch(RuntimeException $e){$blocked=true;}
  check($blocked,'Export d’une mauvaise version autorisé');
  $badCanon=$canon[$id];$badCanon['model']='cookingWorkshopGuides';$blocked=false;
  try{cmsBuildReviewedRecipeRequest($source,$badCanon,$fourth,4);}
  catch(RuntimeException $e){$blocked=true;}
  check($blocked,'Export recette vers atelier autorisé');

  echo "CMS_PRIVATE_DRAFTS_APPEND_ONLY_PASS\n";
}finally{
  if(is_dir($base.'/editorial-drafts')){
    foreach(glob($base.'/editorial-drafts/*')?:[] as $file)unlink($file);
    rmdir($base.'/editorial-drafts');
  }
  rmdir($base);
}
