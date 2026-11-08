<?php
declare(strict_types=1);
// CLI fixture ONLY. Never copy to webroot or point to a production private store.
$mode=$argv[1]??'';$root=realpath($argv[2]??'');$dist=realpath($argv[3]??'');
if(!is_string($root)||!str_starts_with(basename($root),'cdc-studio-browser-tts-')||!is_string($dist))throw new RuntimeException('TTS_FIXTURE_ROOT');
if($mode==='init'){
    $argv=[$argv[0],$root,$dist];ob_start();require __DIR__.'/editorial-studio-server.php';ob_end_clean();
    copy($dist.'/gestion-contenus/atelier-narrations.json',$root.'/site/public/gestion-contenus/atelier-narrations.json');
}
$private=$root.'/.cuisine-asset-portal';$public=$root.'/site/public/gestion-contenus';
require_once $public.'/publication-gap-audit.php';require_once $public.'/coral-v2-ai.php';
$catalog=cmsSourceList(json_decode(file_get_contents($root.'/social-feed.json'),true));
$canonical=cmsCanonicalSourceList(json_decode(file_get_contents($root.'/editorial-source-index.json'),true),$catalog);
$guided=cmsGuidedSourceList(json_decode(file_get_contents($root.'/editorial-guided-fields.json'),true),$canonical);
if($mode==='init'){
    $recipe=null;foreach($canonical as $id=>$c)if($c['model']==='recipes'){$recipe=substr($id,8);break;}
    $fixtureIngredients=array_map(static fn($r)=>$r['name'],$guided['recette:'.$recipe]['fields']['ingredients']);
    $phases=[];foreach(cmsAtelierPhaseIds() as $id)$phases[]=['title'=>'Phase test '.$id,'learning'=>'Objectif fictif '.$id];
    $posted=['kind'=>'atelier','title'=>'Simulation TTS privée '.bin2hex(random_bytes(5)),
      'angle'=>'Fixture technique hors production','summary'=>'Données fictives non publiables','state'=>'review',
      'fields'=>['intro'=>'Introduction fictive','learningGoal'=>'Test isolé','finalPreparation'=>'Audio simulé',
        'portionLabel'=>'Selon fiche','beforeStarting'=>"Test initial\nContrôle",'equipment'=>"Outil fictif",'phases'=>$phases],
      'atelier_reference'=>['version'=>'1','recipeSlug'=>$recipe]];
    $v=cmsCreationSave($private,$posted,$catalog,0);$id=$v['id'];$ref=$v['atelier_reference'];$rows=[];
    foreach(cmsAtelierPhaseIds() as $i=>$phase)$rows[]=['index'=>(string)$i,'id'=>$phase,
      'sourceTitle'=>$phases[$i]['title'],'sourceLearning'=>$phases[$i]['learning'],'minutes'=>'5',
      'ingredientNames'=>implode("\n",$fixtureIngredients),'actions'=>'Action fictive de test','observe'=>'Observation de test',
      'check'=>'Contrôle de test','mistake'=>'Erreur de test','recovery'=>'Correction de test','safety'=>'Précaution de test','pausePrompt'=>'Pause de test'];
    $posted['atelier_phase_details']=['version'=>'1','recipeSlug'=>$recipe,'catalogFingerprint'=>$ref['catalogFingerprint'],'phases'=>$rows];
    $v=cmsCreationSave($private,$posted,$catalog,1,$id);$scripts=[];
    foreach(cmsAtelierScriptIds() as $i=>$chapter)$scripts[]=['index'=>(string)$i,'id'=>$chapter,
      'text'=>str_repeat('Texte fictif de test technique, non destiné à une publication ou à un apprentissage culinaire. ',3).$chapter,'editorNote'=>'TEST ISOLÉ'];
    $posted['atelier_scripts']=['version'=>'1','bindingDigest'=>cmsAtelierScriptSourceDigest($v['fields'],$v['atelier_reference'],$v['atelier_phase_details']),'chapters'=>$scripts];
    $v=cmsCreationSave($private,$posted,$catalog,2,$id);
    foreach(cmsAtelierScriptIds() as $chapter)cmsAtelierVisaAction($private,$id,3,$chapter,'approve',true,true,$catalog);
    cmsAtelierCulinaryAction($private,$id,3,'approve',['servings'=>'1','quantities'=>'1','allergens'=>'1','gestures'=>'1'],
      'Validation fictive en fixture isolée, aucune cuisine ni production réelle.',true,true,$catalog,$canonical,$guided);
    // Final cross-check is an independent, post-script, human-sourced veto.
    // Synthetic domains and statements are isolated fixture data, never real evidence.
    $fakeSources=[
      ['title'=>'Chef Nak — Cambodian Fish Amok','url'=>'https://chefnak.squarespace.com/cambodian-fish-amok',
        'note'=>'Comparaison de test uniquement, sans visite externe réelle ni valeur culinaire.'],
      ['title'=>'Eleven One Kitchen — Ambassade du Cambodge','url'=>'https://www.cambodiaembassyuk.org/fish-amok-recipe/',
        'note'=>'Deuxième comparaison technique fictive, aucune validation publique ou réelle.']
    ];
    $fakeFetch=static fn(string $url):array=>['status'=>200,'content_type'=>'text/html',
      'body'=>'<html><body><h1>Fish Amok</h1>1 kg fish, 320 g coconut cream, steam for 10 minutes, steam 2 more minutes. 0.25kg fish, 70ml coconut milk, fry them, to be steamed. '.str_repeat('Synthetic fixture fish coconut kroeung steam. ',20).'</body></html>'];
    cmsCoralFinalAction($private,$id,3,'approve',$fakeSources,
      'Visa de fixture technique uniquement, sans valeur culinaire ni autorisation de dépenses.',true,true,
      $catalog,$canonical,$guided,$fakeFetch);
    file_put_contents($root.'/test-posted.json',json_encode($posted,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR));
    file_put_contents($root.'/test-id.txt',$id);
    echo json_encode(['id'=>$id,'version'=>3]);exit;
}
$id=trim(file_get_contents($root.'/test-id.txt'));$record=cmsCreationRead(cmsCreationDir($private),$id);
if($mode==='safety'){
    $passed=[];$check=static function(callable $f,string $code)use(&$passed):void{
        try{$f();throw new RuntimeException('UNEXPECTED_ALLOW');}
        catch(Throwable $e){if($e->getMessage()!==$code)throw $e;$passed[]=$code;}
    };
    $final=cmsCoralFinalStatus($private,$record,$catalog,$canonical,$guided);
    if(($final['approved']??false)!==true||!$final['report']['automated_checks_pass'])
      throw new RuntimeException('FINAL_REVIEW_FIXTURE_NOT_READY');
    $bad=$record;$bad['atelier_scripts']['chapters'][0]['text']='Préparez quatre ramequins. '.$bad['atelier_scripts']['chapters'][0]['text'];
    $badReport=cmsCoralFinalAudit($bad,$catalog,$canonical,$guided);
    if($badReport['automated_checks_pass']||!in_array('FIXED_SERVINGS',array_column($badReport['blocking'],'code'),true)
      ||cmsCoralFinalStatus($private,$bad,$catalog,$canonical,$guided)['approved'])
      throw new RuntimeException('FINAL_REVIEW_FIXED_SERVINGS_NOT_BLOCKED');
    $passed[]='FINAL_REVIEW_AND_PORTIONS_BLOCKED';
    try{
      cmsCoralFinalSources([
        ['title'=>'Source A','url'=>'https://example.org/a','note'=>'Source fictive uniquement pour le contrôle de domaine.'],
        ['title'=>'Source B','url'=>'https://example.org/b','note'=>'Autre source fictive, même hôte interdit pour le visa.']
      ]);
      throw new RuntimeException('DUPLICATE_SOURCES_WERE_ALLOWED');
    }catch(InvalidArgumentException $e){
      if($e->getMessage()!=='CORAL_FINAL_SOURCES')throw $e;
    }
    $passed[]='INDEPENDENT_EXTERNAL_SOURCE_DOMAINS_REQUIRED';
    $sourceRows=[
      ['title'=>'Chef Nak — Cambodian Fish Amok','url'=>'https://chefnak.squarespace.com/cambodian-fish-amok',
        'note'=>'Fixture synthétique : variation des quantités et de la vapeur à relire.'],
      ['title'=>'Eleven One Kitchen — Ambassade du Cambodge','url'=>'https://www.cambodiaembassyuk.org/fish-amok-recipe/',
        'note'=>'Fixture synthétique : variante poêlée et mention de vapeur à relire.']
    ];
    $check(static fn()=>cmsCoralFinalEvidence($sourceRows,static fn()=>[
      'status'=>302,'content_type'=>'text/html','body'=>str_repeat('Fish Amok fish coconut kroeung steam ',30)]),
      'CORAL_FINAL_FETCH_UNAVAILABLE');
    $check(static fn()=>cmsCoralFinalSources([
      ['title'=>'Chef Nak — Cambodian Fish Amok','url'=>'http://127.0.0.1/admin',
        'note'=>'Tentative de cible privée synthétique, interdite avant toute connexion.'],
      $sourceRows[1]]),'CORAL_FINAL_SOURCES');
    $check(static fn()=>cmsCoralFinalSources([
      ['title'=>'Chef Nak — Cambodian Fish Amok','url'=>'https://127.0.0.1/admin',
        'note'=>'Cible privée synthétique interdite avant toute connexion.'],
      $sourceRows[1]]),'CORAL_FINAL_SOURCES');
    $fixtureFetch=static fn(string $url):array=>['status'=>200,'content_type'=>'text/html',
      'body'=>'<html><body><h1>Fish Amok</h1>1 kg fish, 320 g coconut cream, steam for 10 minutes, steam 2 more minutes. 0.25kg fish, 70ml coconut milk, fry them, to be steamed. '.str_repeat('Synthetic fixture fish coconut kroeung steam. ',20).'</body></html>'];
    $evidence=cmsCoralFinalEvidence($sourceRows,$fixtureFetch);
    if(!cmsCoralFinalEvidenceCurrent($evidence))throw new RuntimeException('FRESH_SOURCE_EVIDENCE_REJECTED');
    $evidence[0]['evidence']['retrieved_at']='2020-01-01T00:00:00Z';
    if(cmsCoralFinalEvidenceCurrent($evidence))throw new RuntimeException('EXPIRED_SOURCE_EVIDENCE_ALLOWED');
    $passed[]='EXTERNAL_FETCH_FAILURE_PRIVATE_URL_AND_EXPIRED_EVIDENCE_REFUSED';
    $decision=static fn($checks,$confirm,$auth,$version=3)=>cmsCoralTtsDecision($private,$id,$version,'rights','approve',$checks,
      'Décision exclusivement fictive en fixture isolée.',$confirm,$auth,$catalog,$canonical,$guided);
    $all=['voice'=>'1','content'=>'1','private_audio'=>'1'];
    $check(static fn()=>$decision($all,true,false),'TTS_HUMAN_CONFIRM_REQUIRED');
    $check(static fn()=>$decision($all,false,true),'TTS_HUMAN_CONFIRM_REQUIRED');
    $check(static fn()=>$decision(['voice'=>'1'],true,true),'TTS_RIGHTS_CHECKS');
    $check(static fn()=>$decision($all,true,true,2),'TTS_VERSION_STALE');
    $decision($all,true,true);$r=cmsCoralTtsRequest($private,$record,$catalog,$canonical,$guided);
    if(!cmsCoralTtsAuthorize($private,$r,$catalog,$canonical,$guided))throw new RuntimeException('MISSING_VALID_AUTHORITY');
    $fake=$record;$fake['reviewed']=true;
    $check(static fn()=>cmsCoralTtsRequest($private,$fake,$catalog,$canonical,$guided),'TTS_VERSION_STALE');
    if(cmsCoralTtsSettings([])!==null||cmsCoralTtsSettings(['editorial_tts'=>['enabled'=>true,'test_only'=>true,'mode'=>'openai']])!==null)
      throw new RuntimeException('PAID_MODE_ALLOWED');
    $passed[]='DEFAULT_AND_PAID_MODE_CLOSED';
    $dir=cmsCreationDir($private);$file=$dir.'/tts-rights-'.$id.'.0001.json';$original=hash_file('sha256',$file);
    cmsCoralTtsDecision($private,$id,3,'rights','revoke',[],'Révocation fictive en fixture isolée uniquement.',true,true,$catalog,$canonical,$guided);
    if(hash_file('sha256',$file)!==$original||cmsCoralTtsAuthorize($private,$r,$catalog,$canonical,$guided))throw new RuntimeException('RIGHTS_REVOKE_FAILED');
    $passed[]='REVOCATION_AND_APPEND_ONLY';
    $row=json_decode(file_get_contents($file),true);$row['note'].=' Modification illégitime';file_put_contents($file,json_encode($row));
    $check(static fn()=>cmsCoralTtsJournal($dir,$id,'rights'),'TTS_JOURNAL_CORRUPT');
    $generic=$record;
    $generic['atelier_scripts']['chapters'][5]['text']='Avec un thermomètre propre, mesurez au centre d’un ramequin, sans toucher la céramique. '
      .$generic['atelier_scripts']['chapters'][5]['text'];
    foreach(cmsCoralFinalAudit($generic,$catalog,$canonical,$guided)['blocking'] as $item)
      if($item['code']==='FIXED_SERVINGS')throw new RuntimeException('GENERIC_SINGULAR_FALSE_POSITIVE');
    $passed[]='GENERIC_SINGULAR_CONTAINER_NOT_FIXED_SERVINGS';
    foreach(['Réservez 1 c. à soupe de lait de coco.',
        'Réservez 1/2 litre de lait de coco.',
        'Réservez ½ litre de lait de coco.',
        'Réservez la cuillerée prévue pour la finition.'] as $sentence){
      $quantity=$record;
      $quantity['atelier_scripts']['chapters'][1]['text']=$sentence.' '.$quantity['atelier_scripts']['chapters'][1]['text'];
      if(!in_array('FIXED_INGREDIENT_QUANTITY',array_column(cmsCoralFinalAudit($quantity,$catalog,$canonical,$guided)['blocking'],'code'),true))
        throw new RuntimeException('FIXED_VOICE_QUANTITY_NOT_BLOCKED');
    }
    $technical=$record;
    $technical['atelier_scripts']['chapters'][5]['text']='Contrôlez au centre d’un ramequin : au moins 72 °C. La cuisson indicative dure 18 à 25 minutes. '.$technical['atelier_scripts']['chapters'][5]['text'];
    foreach(cmsCoralFinalAudit($technical,$catalog,$canonical,$guided)['blocking'] as $item)
      if(in_array($item['code'],['FIXED_SERVINGS','FIXED_INGREDIENT_QUANTITY'],true))throw new RuntimeException('TECHNICAL_REFERENCE_FALSE_POSITIVE');
    $passed[]='VOICE_QUANTITIES_AND_INVARIANT_TECHNIQUE_DISTINGUISHED';
    $singlePerson=$record;
    $singlePerson['atelier_scripts']['chapters'][5]['text']='Cette recette est pour une personne. '
      .$singlePerson['atelier_scripts']['chapters'][5]['text'];
    $hasFixedPerson=false;
    foreach(cmsCoralFinalAudit($singlePerson,$catalog,$canonical,$guided)['blocking'] as $item)
      if($item['code']==='FIXED_SERVINGS')$hasFixedPerson=true;
    if(!$hasFixedPerson)throw new RuntimeException('FIXED_PERSON_NOT_BLOCKED');
    $passed[]='FIXED_PERSON_STILL_BLOCKED';
    $recipeFields=$guided['recette:'.$record['atelier_reference']['recipeSlug']]['fields'];
    $automatic=cmsCulinaryAutomaticAudit($record,$recipeFields);
    if(array_keys($automatic['checks'])!==['portions','ingredients','durations','narrations','safety'])throw new RuntimeException('FIVE_CHECKS_REQUIRED');
    foreach([1,2,4,8,12] as $n)if(!isset($automatic['portion_matrix'][$n]))throw new RuntimeException('PORTION_MATRIX_MISSING');
    $unsafe=$record;$unsafe['atelier_scripts']['chapters'][5]['text']='Visez 50 °C au cœur. '.$unsafe['atelier_scripts']['chapters'][5]['text'];
    $unsafeReport=cmsCoralFinalAudit($unsafe,$catalog,$canonical,$guided);
    if($unsafeReport['automated_checks_pass']||!in_array('CORE_TEMPERATURE_TOO_LOW',array_column($unsafeReport['blocking'],'code'),true))throw new RuntimeException('UNSAFE_CORE_TEMPERATURE_ALLOWED');
    $unsafe['atelier_scripts']['chapters'][5]['text']='Visez au moins cinquante degrés Celsius au cœur.';
    $unsafeReport=cmsCoralFinalAudit($unsafe,$catalog,$canonical,$guided);
    if($unsafeReport['automated_checks_pass']||!in_array('CORE_TEMPERATURE_TOO_LOW',array_column($unsafeReport['blocking'],'code'),true))throw new RuntimeException('SPELLED_UNSAFE_CORE_TEMPERATURE_ALLOWED');
    $passed[]='DIGIT_AND_SPELLED_TEMPERATURE_VETO_FINAL_AUDIT';
    $unknown=$record;$unknown['atelier_phase_details']['phases'][2]['ingredientNames'][]='ingr?dient ?tranger fictif';
    if(!in_array('UNMATCHED_PHASE_INGREDIENT',array_column(cmsCulinaryAutomaticAudit($unknown,$recipeFields)['findings'],'code'),true))throw new RuntimeException('UNKNOWN_INGREDIENT_ALLOWED');
    $recipeChange=['kind'=>'recette','fields'=>$recipeFields];$recipeChange['fields']['steps'][0]['text']='Ajoutez 800 ml de liquide.';
    $changedReport=cmsCulinaryAutomaticAudit($recipeChange,$recipeFields);
    if(!in_array('bloquant',array_column($changedReport['findings'],'severity'),true))throw new RuntimeException('CHANGED_FIXED_INSTRUCTION_ALLOWED');
    $fakeSourceRows=$sourceRows;
    $largeFetcher=static function(string $url)use($fixtureFetch):array{
      $r=$fixtureFetch($url);if(str_contains($url,'squarespace'))$r['body'].=str_repeat(' ',600000);return $r;
    };
    if(count(cmsCoralFinalEvidence($fakeSourceRows,$largeFetcher))!==2)throw new RuntimeException('BOUNDED_LARGE_CHEF_PAGE_REJECTED');
    $check(static fn()=>cmsCoralFinalEvidence($fakeSourceRows,static fn(string $url):array=>['status'=>200,'content_type'=>'text/html','body'=>str_repeat('x',1048577)]),'CORAL_FINAL_FETCH_UNAVAILABLE');
    $passed[]='FIVE_UNIVERSAL_CHECKS_AND_BOUNDED_SOURCES';

    $posted=json_decode(file_get_contents($root.'/test-posted.json'),true);
    $posted['atelier_scripts']['chapters'][0]['text']='Préparez quatre ramequins. '.$posted['atelier_scripts']['chapters'][0]['text'];
    $v4=cmsCreationSave($private,$posted,$catalog,3,$id);
    $oldPath=$dir.'/'.$id.'.0004.json';$oldSha=hash_file('sha256',$oldPath);
    $issue=null;foreach(cmsCoralFinalAudit($v4,$catalog,$canonical,$guided)['blocking'] as $item)
      if($item['code']==='FIXED_SERVINGS'){$issue=$item;break;}
    if(!$issue||$issue['passage']!=='quatre ramequins'||$issue['proposed_correction']!=='vos ramequins')
      throw new RuntimeException('CORRECTION_PROPOSAL_MISSING');
    $decision=cmsCoralFinalCorrection($private,$id,4,$issue['code'],$issue['chapter'],$issue['passage'],
      'reject',null,'Rejet fictif documenté ; le passage reste bloquant jusqu’à correction.',
      true,true,$catalog,$canonical,$guided);
    if($decision['version']!==4||cmsCreationRead($dir,$id)['version']!==4)
      throw new RuntimeException('CORRECTION_REJECTION_CHANGED_DRAFT');
    $fixed=cmsCoralFinalCorrection($private,$id,4,$issue['code'],$issue['chapter'],$issue['passage'],
      'accept',null,'Acceptation fictive de la formulation sans quantité de convives.',
      true,true,$catalog,$canonical,$guided);
    if($fixed['version']!==5||$fixed['reviewed']!==false||hash_file('sha256',$oldPath)!==$oldSha
      ||str_contains(cmsCreationRead($dir,$id)['atelier_scripts']['chapters'][0]['text'],'quatre ramequins')
      ||cmsCoralFinalStatus($private,cmsCreationRead($dir,$id),$catalog,$canonical,$guided)['approved'])
      throw new RuntimeException('CORRECTION_VERSION_OR_VISA');
    $passed[]='CORRECTION_REJECTION_VERSIONING_AND_VISA_INVALIDATION';
    echo json_encode(['passed'=>$passed]);exit;
}
if($mode==='authorize'){
    $request=json_decode(stream_get_contents(STDIN),true,32,JSON_THROW_ON_ERROR);
    echo json_encode(cmsCoralTtsAuthorize($private,$request,$catalog,$canonical,$guided));exit;
}
if($mode==='confirm'){
    $settings=['enabled'=>true,'test_only'=>true,'mode'=>'simulated','submit'=>static fn($r,$id)=>['id'=>$id],
      'poll'=>static fn()=>[],'resume'=>static fn()=>null,'artifact'=>static fn()=>''];
    cmsCoralTtsSubmit($private,$id,$record['version'],true,true,$settings,$catalog,$canonical,$guided);echo 'true';exit;
}
if($mode==='request'){
    echo json_encode(cmsCoralTtsRequest($private,$record,$catalog,$canonical,$guided),JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);exit;
}
if($mode==='rights'||$mode==='revoke-rights'){
    cmsCoralTtsDecision($private,$id,$record['version'],'rights',$mode==='rights'?'approve':'revoke',
      $mode==='rights'?['voice'=>'1','content'=>'1','private_audio'=>'1']:[],
      'Décision fictive de droits en environnement de test isolé.',true,true,$catalog,$canonical,$guided);
}elseif($mode==='revoke-final')cmsCoralFinalAction($private,$id,$record['version'],'revoke',[],
    'Révocation explicite du visa final de démonstration, aucun effet sur une recette réelle.',true,true,$catalog,$canonical,$guided);
elseif($mode==='revoke-visa')cmsAtelierVisaAction($private,$id,$record['version'],'intro','revoke',true,true,$catalog);
elseif($mode==='change-text'){
    $posted=json_decode(file_get_contents($root.'/test-posted.json'),true);$posted['atelier_scripts']['chapters'][0]['text'].=' Modification de test.';
    cmsCreationSave($private,$posted,$catalog,$record['version'],$id);
}elseif($mode==='change-recipe'){
    $path=$root.'/editorial-source-index.json';$data=json_decode(file_get_contents($path),true);
    $alter=static function(&$node)use(&$alter):void{
        if(!is_array($node))return;
        foreach($node as $key=>&$value){
            if(is_string($value)&&preg_match('/^[a-f0-9]{64}$/D',$value))$value=str_repeat('e',64);
            elseif(is_array($value))$alter($value);
        }
    };$alter($data);file_put_contents($path,json_encode($data,JSON_THROW_ON_ERROR));
}else throw new RuntimeException('TTS_FIXTURE_MODE');
echo 'true';
