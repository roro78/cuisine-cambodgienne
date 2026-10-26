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
  check(count(glob($dir.'/*.json'))===2,'Publication involontaire');
  echo "CMS_PRIVATE_DRAFTS_APPEND_ONLY_PASS\n";
}finally{
  if(is_dir($base.'/editorial-drafts')){
    foreach(glob($base.'/editorial-drafts/*')?:[] as $file)unlink($file);
    rmdir($base.'/editorial-drafts');
  }
  rmdir($base);
}
