<?php
declare(strict_types=1);
require __DIR__ . '/../../public/gestion-social/catalog-readonly.php';
function ensure(bool $ok,string $msg): void {if(!$ok)throw new RuntimeException($msg);}
$source=static fn(string $id,string $kind,string $fp,?string $img):array => [
  'id'=>$id,'kind'=>$kind,'title'=>'Titre de '.$id,
  'fingerprint'=>$fp,'url'=>'https://www.cuisine-du-cambodge.com/'.
     ($kind==='culture'?'culture':($kind==='atelier'?'apprendre':'recettes')).'/'.substr($id,strlen($kind)+1).'/',
  'imageUrl'=>$img
];
$image='https://www.cuisine-du-cambodge.com/social-assets/recette-new.jpg';
$a='aaaaaaaaaaaaaaaa';$b='bbbbbbbbbbbbbbbb';
$feed=['schemaVersion'=>1,'product'=>'cuisine-du-cambodge','items'=>[
  $source('recette:new','recette',$a,$image),
  $source('culture:changed','culture',$b,$image),
  $source('atelier:missing','atelier',$a,null),
  $source('recette:seen','recette',$b,$image)
]];
$history=['culture:changed'=>['fingerprint'=>$a,'status'=>'published'],
          'recette:seen'=>['fingerprint'=>$b,'status'=>'draft']];
$result=socialCatalogCandidates($feed,$history);
ensure(array_column($result,'state')===['available','changed','missing_image','seen'],'Classification/order mismatch');
ensure($result[0]['id']==='recette:new','Fresh source not ranked first');
ensure($result[0]['image_url']===$image,'Validated JPEG not returned for thumbnail');
ensure($result[1]['image_url']===$image,'Changed source thumbnail was lost');
ensure($result[2]['image_url']===null,'Missing image must never become a thumbnail');
ensure($result[1]['previous_status']==='published','History status lost');
ensure($result[3]['previous_status']==='draft','Pending post incorrectly considered new');
// Ineligible/foreign images are never rendered even if a valid source ID exists.
$badMedia=$feed;
$badMedia['items'][0]['imageUrl']='https://attacker.test/hijack.jpg';
$noMedia=socialCatalogCandidates($badMedia,$history);
$noMediaIndex=array_search('recette:new',array_column($noMedia,'id'),true);
ensure($noMediaIndex!==false && $noMedia[$noMediaIndex]['state']==='missing_image'
    && $noMedia[$noMediaIndex]['image_url']===null,
  'Untrusted remote thumbnail was accepted');
foreach ([
  static function(&$f){$f['schemaVersion']=99;},
  static function(&$f){$f['items'][0]['url']='https://attacker.test/recettes/new/';},
  static function(&$f){$f['items'][0]['imageUrl']='http://attacker.test/fake.jpg';$f['items'][0]['id']='culture:new';},
  static function(&$f){$f['items'][0]['id']=$f['items'][1]['id'];},
  static function(&$f){$f['items'][0]['fingerprint']='NOT-SHA';}
] as $tamper) {
  $modified=$feed;$tamper($modified);
  $thrown=false;try{socialCatalogCandidates($modified,$history);}catch(UnexpectedValueException $e){$thrown=true;}
  // The unknown photo is simply ineligible; altered id-kind must be rejected.
  ensure($thrown,'Untrusted feed mutation was accepted');
}
echo "SOCIAL_CATALOG_DISCOVERY_READONLY_PASS\n";
