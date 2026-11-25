<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/lib.php';
function requireCalendar(bool $condition,string $marker): void {
    if(!$condition)throw new RuntimeException('CALENDAR_TEST_'.$marker);
}
function idea(string $id,string $kind,string $title,?string $date,
    string $state='draft'):array{
    return ['contract'=>'cdc-editorial-new-content-v1','id'=>$id,
        'kind'=>$kind,'title'=>$title,'target_date'=>$date,'state'=>$state,
        'version'=>1,'origin'=>'manual'];
}
$items=[
 'c-000000000000000000000001'=>idea('c-000000000000000000000001',
    'recette','Amok nouveau','2026-11-01'),
 'c-000000000000000000000002'=>idea('c-000000000000000000000002',
    'culture','Le marché local','2026-11-01','review'),
 'c-000000000000000000000003'=>idea('c-000000000000000000000003',
    'atelier','Un nouvel atelier',null),
 'c-000000000000000000000004'=>idea('c-000000000000000000000004',
    'ingredient','Le sucre de palme','2026-12-10','review'),
 'c-000000000000000000000005'=>idea('c-000000000000000000000005',
    'technique','Technique du mortier','2026-10-31')
];
requireCalendar(cmsCalendarMonth('2026-11')==='2026-11','MONTH');
requireCalendar(cmsCalendarMonth('2099-12')==='2099-12','YEAR_BOUNDARY');
foreach(['2026-00','2026-13','2026-1','<img>','2026-11-01','2019-11'] as $bad){
    $invalid=false;
    try{cmsCalendarMonth($bad);}catch(InvalidArgumentException $e){$invalid=true;}
    requireCalendar($invalid,'BAD_MONTH_'.$bad);
}
$empty=cmsCalendarPlan([],'2026-10');
requireCalendar($empty['total']===0 && $empty['month_count']===0
    && $empty['undated_count']===0 && $empty['days']===[],
    'FIRST_EMPTY_PRODUCTION_CALENDAR');
$nov=cmsCalendarPlan($items,'2026-11');
requireCalendar($nov['total']===5 && $nov['month_count']===2
    && $nov['undated_count']===1 && count($nov['other'])===2,'MONTH_TOTALS');
requireCalendar(array_keys($nov['days'])===['2026-11-01'],'DATE_INDEX');
requireCalendar($nov['days']['2026-11-01'][0]['title']==='Amok nouveau',
    'DATE_SORT');
requireCalendar(cmsCalendarPlan($items,'2026-11','culture')['month_count']===1,
    'KIND_FILTER');
requireCalendar(cmsCalendarPlan($items,'2026-11','recette','review')['total']===0,
    'STATE_FILTER');
requireCalendar(cmsCalendarPlan($items,'2026-11','all','review')['total']===2,
    'REVIEW_FILTER');
requireCalendar(cmsCalendarPlan($items,'2026-12')['month_count']===1,
    'OTHER_MONTH');
$incomplete=false;
try{cmsCalendarPlan($items,'2026-11','bogus');}
catch(InvalidArgumentException $e){$incomplete=true;}
requireCalendar($incomplete,'BAD_KIND');
$corrupt=$items;
$corrupt['c-000000000000000000000001']['target_date']='2026-11-31';
$blocked=false;
try{cmsCalendarPlan($corrupt,'2026-11');}
catch(RuntimeException $e){$blocked=$e->getMessage()==='CALENDAR_CORRUPT_DATE';}
requireCalendar($blocked,'CORRUPT_DATE');
$badDraft=$items;
$badDraft['c-000000000000000000000001']['state']='obsolete';
$blocked=false;
try{cmsCalendarPlan($badDraft,'2026-11');}
catch(RuntimeException $e){$blocked=$e->getMessage()==='CALENDAR_CORRUPT_DRAFT';}
requireCalendar($blocked,'CORRUPT_DRAFT');
// A corrupted record's kind must not trigger PHP 8.4 TypeError; it must be
// rejected as invalid private data without echoing the record's content.
foreach([[],['recette'],123,true,null] as $invalidKind){
    $typed=$items;
    $typed['c-000000000000000000000001']['kind']=$invalidKind;
    $blocked=false;
    try{cmsCalendarPlan($typed,'2026-11');}
    catch(RuntimeException $e){$blocked=$e->getMessage()==='CALENDAR_CORRUPT_DRAFT';}
    requireCalendar($blocked,'MALFORMED_KIND_GUARD');
}
foreach([[],true,123,'2026-02-29','2026-11-31','2026-11-00'] as $invalidDate){
    $typed=$items;
    $typed['c-000000000000000000000001']['target_date']=$invalidDate;
    $before=json_encode($typed,JSON_THROW_ON_ERROR);
    $blocked=false;
    try{cmsCalendarPlan($typed,'2026-11');}
    catch(RuntimeException $e){$blocked=$e->getMessage()==='CALENDAR_CORRUPT_DATE';}
    requireCalendar($blocked,'MALFORMED_DATE_GUARD');
    requireCalendar(json_encode($typed,JSON_THROW_ON_ERROR)===$before,
        'INVALID_RECORD_NOT_MUTATED');
}
$unsafe=$items;
$unsafe['c-000000000000000000000001']['title']='<script>alert(1)</script>';
$plan=cmsCalendarPlan($unsafe,'2026-11');
requireCalendar(str_contains(cmsEsc($plan['days']['2026-11-01'][0]['title']),
    '&lt;script&gt;'),'ESCAPED_TITLES');
// Schedule preview: existing dates are capacity, not permission to publish.
$scheduled=idea('c-000000000000000000000010','recette','Soupe de poisson','2026-11-30');
$review=idea('c-000000000000000000000011','culture','Les poteries de Kampong Chhnang',null,'review');
$ingredient=idea('c-000000000000000000000012','ingredient','Le galanga',null);
$culture=idea('c-000000000000000000000013','culture','La récolte du riz',null);
$duplicate=idea('c-000000000000000000000014','ingredient','Poivre de Kampot',null);
$bound=idea('c-000000000000000000000015','culture','Une fiche publique liée',null);
$bound['source_binding']=['source_id'=>'culture:fiche-liee'];
$unselected=idea('c-000000000000000000000016','atelier','Brouillon de test non sélectionné',null);
$near=idea('c-000000000000000000000017','technique','Préparer le porc caramélisé',null);
$existing=[['id'=>'ingredient:poivre-de-kampot','kind'=>'ingredient','title'=>'Poivre de Kampot'],
    ['id'=>'technique:porc-caramelise','kind'=>'technique','title'=>'Cuisiner le porc caramélisé']];
$records=[$scheduled,$review,$ingredient,$culture,$duplicate,$bound,$unselected,$near];
$selected=array_column([$scheduled,$review,$ingredient,$culture,$duplicate,$bound,$near],'id');
$before=json_encode($records,JSON_THROW_ON_ERROR);
$preview=cmsCalendarSuggest($records,$existing,$selected,'2026-11-30',2,2);
requireCalendar(array_column($preview['proposals'],'id')===[$review['id'],$ingredient['id'],$culture['id']],
    'PREVIEW_BALANCE_REVIEW_PRIORITY');
requireCalendar(array_column($preview['proposals'],'target_date')===['2026-12-03','2026-12-07','2026-12-10'],
    'PREVIEW_EXISTING_CAPACITY_YEAR_MONTH');
requireCalendar(array_column($preview['blocked'],'reason')===['already_dated','duplicate','published_binding','similar_title'],
    'PREVIEW_BLOCKED_IDENTITIES');
requireCalendar($preview['publication_authorized']===false&&$preview['remaining']===0
    &&json_encode($records,JSON_THROW_ON_ERROR)===$before,'PREVIEW_NO_MUTATION');
requireCalendar(cmsCalendarSuggest($records,$existing,$selected,'2026-11-30',1,1)['remaining']===3,
    'PREVIEW_FULL_WEEK');
requireCalendar(cmsCalendarSuggest($records,$existing,[],'2026-11-30',2,2)['proposals']===[],
    'PREVIEW_EXPLICIT_SELECTION');
foreach([
    [[$review['id'],$review['id']],'2026-11-30',2,2],
    [['c-000000000000000000000099'],'2026-11-30',2,2],
    [[$review['id']],'2026-12-01',2,2],
    [[$review['id']],'2026-11-30',7,2],
    [[$review['id']],'2026-11-30',2,3],
    [[[]],'2026-11-30',2,2],
] as [$ids,$start,$weeks,$cadence]){
    $rejected=false;
    try{cmsCalendarSuggest($records,$existing,$ids,$start,$weeks,$cadence);}
    catch(InvalidArgumentException $e){$rejected=$e->getMessage()==='CALENDAR_PREVIEW_INPUT';}
    requireCalendar($rejected,'PREVIEW_INVALID_INPUT');
}
// Grouped confirmation against real append-only private files.
$private=sys_get_temp_dir().'/cdc-calendar-'.bin2hex(random_bytes(8));
mkdir($private,0700);
try{
    $catalog=[];
    $form=['kind'=>'culture','title'=>'Projet culturel inédit','angle'=>'Origine à vérifier',
        'summary'=>'Dossier privé','research_note'=>'Source à vérifier','fields'=>[],
        'target_date'=>'','state'=>'draft'];
    $a=cmsCreationSave($private,$form,$catalog,0);
    $form['kind']='ingredient';$form['title']='Une fiche de fruit inédit';
    $b=cmsCreationSave($private,$form,$catalog,0);
    $dir=cmsCreationDir($private);
    $firstPath=$dir.'/'.$a['id'].'.0001.json';$secondPath=$dir.'/'.$b['id'].'.0001.json';
    $hashes=[hash_file('sha256',$firstPath),hash_file('sha256',$secondPath)];
    $ids=[$a['id'],$b['id']];$start='2026-11-30';
    $pending=cmsCalendarSuggest(cmsCreationList($dir),$catalog,$ids,$start,1,2)['proposals'];
    requireCalendar(count($pending)===2,'GROUP_PREVIEW');
    $tampered=$pending;$tampered[0]['target_date']='2026-12-02';
    foreach([$tampered,array_reverse($pending)] as $bad){
        $rejected=false;
        try{cmsCalendarApply($private,$catalog,$ids,$start,1,2,$bad);}
        catch(RuntimeException $e){$rejected=$e->getMessage()==='CALENDAR_CONFIRM_STALE';}
        requireCalendar($rejected,'GROUP_REJECT_CHANGED_PROPOSAL');
        requireCalendar(cmsCreationVersions($dir,$a['id'])===[1]
            &&cmsCreationVersions($dir,$b['id'])===[1],'GROUP_NO_PARTIAL_WRITE');
    }
    requireCalendar(cmsCalendarApply($private,$catalog,$ids,$start,1,2,$pending)===$pending,'GROUP_APPLY');
    foreach($pending as $proposal){
        $old=cmsCreationRead($dir,$proposal['id'],1);$new=cmsCreationRead($dir,$proposal['id']);
        requireCalendar($new['version']===2&&$new['target_date']===$proposal['target_date']
            &&$new['reviewed']===false,'GROUP_DATE_ONLY');
        foreach(['version','target_date','recorded_at'] as $key){unset($old[$key],$new[$key]);}
        requireCalendar($old===$new,'GROUP_PRESERVE_ALL_OTHER_FIELDS');
    }
    requireCalendar($hashes===[hash_file('sha256',$firstPath),hash_file('sha256',$secondPath)],'GROUP_OLD_BYTES');
    $rejected=false;
    try{cmsCalendarApply($private,$catalog,$ids,$start,1,2,$pending);}
    catch(RuntimeException $e){$rejected=$e->getMessage()==='CALENDAR_CONFIRM_STALE';}
    requireCalendar($rejected&&cmsCreationVersions($dir,$a['id'])===[2,1],'GROUP_REPLAY');
    $form['kind']='culture';$form['title']='Troisième sujet documentaire';
    $c=cmsCreationSave($private,$form,$catalog,0);
    $more=cmsCalendarSuggest(cmsCreationList($dir),$catalog,[$c['id']],$start,2,2)['proposals'];
    $form['summary']='Correction humaine concurrente';
    cmsCreationSave($private,$form,$catalog,1,$c['id']);
    $rejected=false;
    try{cmsCalendarApply($private,$catalog,[$c['id']],$start,2,2,$more);}
    catch(RuntimeException $e){$rejected=$e->getMessage()==='CALENDAR_CONFIRM_STALE';}
    requireCalendar($rejected&&cmsCreationRead($dir,$c['id'])['target_date']===null,'GROUP_EDIT_CONFLICT');
}finally{
    $iterator=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($private,FilesystemIterator::SKIP_DOTS),RecursiveIteratorIterator::CHILD_FIRST);
    foreach($iterator as $entry){if($entry->isDir())rmdir($entry->getPathname());else unlink($entry->getPathname());}
    rmdir($private);
}
// Catalogue discovery: five families, real source identities, no fabricated facts.
$topicCatalog=[];$topicCanonical=[];$topicGuides=[];
foreach([
    ['recette:amok-trey','recette','Amok Trey','recipes'],
    ['recette:lok-lak','recette','Lok Lak','recipes'],
    ['recette:soupe-inspiree','recette','Soupe inspirée','recipes'],
    ['ingredient:tamarin','ingredient','Tamarin','ingredients'],
    ['culture:comprendre-amok','culture','L’amok, entre patrimoine et tables','culture'],
    ['atelier:amok-trey','atelier','Atelier Amok Trey','cookingWorkshopGuides'],
] as [$id,$kind,$title,$model]){
    $fp=hash('sha256',$id);
    $topicCatalog[$id]=['id'=>$id,'kind'=>$kind,'title'=>$title,'url'=>'https://www.cuisine-du-cambodge.com/'.explode(':',$id)[1].'/'];
    $topicCanonical[$id]=['id'=>$id,'model'=>$model,'fingerprint'=>$fp];
    $topicGuides[$id]=['id'=>$id,'model'=>$model,'fingerprint'=>$fp,'fields'=>$kind==='recette'?
        ['ingredients'=>[['name'=>'Citronnelle'],['name'=>'Eau']],
         'steps'=>[['title'=>'Faire revenir les aromates']]]:[]];
}
$linkedDraft=idea('c-000000000000000000000020','atelier','Un atelier privé sans titre commun',null);
$linkedDraft['atelier_reference']=['recipeSlug'=>'lok-lak'];
$topicRecords=[$linkedDraft];
$input=json_encode([$topicCatalog,$topicCanonical,$topicGuides,$topicRecords],JSON_THROW_ON_ERROR);
$topics=cmsCalendarTopicSuggestions($topicCatalog,$topicCanonical,$topicGuides,$topicRecords);
requireCalendar($topics===cmsCalendarTopicSuggestions($topicCatalog,$topicCanonical,$topicGuides,$topicRecords),'TOPIC_DETERMINISTIC');
requireCalendar(count(array_unique(array_column($topics,'kind')))===5,'TOPIC_FIVE_FAMILIES');
requireCalendar(count($topics)<=10&&count(array_unique(array_column($topics,'id')))===count($topics),'TOPIC_BOUNDED');
foreach($topics as $topic){
    requireCalendar($topic['requires_human_review']===true&&$topic['publication_authorized']===false,'TOPIC_NO_AUTHORIZATION');
    foreach($topic['sources'] as $source)requireCalendar($source['fingerprint']===$topicCanonical[$source['id']]['fingerprint'],'TOPIC_REAL_SOURCE');
    if($topic['kind']==='atelier')requireCalendar($topic['sources'][0]['id']==='recette:soupe-inspiree','TOPIC_EXISTING_ATELIER');
    if($topic['kind']==='culture')requireCalendar(!str_contains($topic['title'],'Amok'),'TOPIC_CULTURE_VARIANT');
    if($topic['kind']==='ingredient')requireCalendar($topic['title']==='Citronnelle','TOPIC_RECURRENT_INGREDIENT');
    if($topic['kind']==='technique')requireCalendar(count($topic['sources'])===3,'TOPIC_RECURRENT_TECHNIQUE');
}
requireCalendar($input===json_encode([$topicCatalog,$topicCanonical,$topicGuides,$topicRecords],JSON_THROW_ON_ERROR),'TOPIC_NO_MUTATION');
$badGuides=$topicGuides;$badGuides['recette:amok-trey']['fingerprint']=str_repeat('0',64);
$rejected=false;
try{cmsCalendarTopicSuggestions($topicCatalog,$topicCanonical,$badGuides,$topicRecords);}
catch(RuntimeException $e){$rejected=$e->getMessage()==='TOPIC_SOURCE_INVALID';}
requireCalendar($rejected,'TOPIC_STALE_SOURCE');
$existingIngredient=idea('c-000000000000000000000021','ingredient','La citronnelle en cuisine',null);
$topics=cmsCalendarTopicSuggestions($topicCatalog,$topicCanonical,$topicGuides,[$linkedDraft,$existingIngredient]);
requireCalendar(!in_array('ingredient',array_column($topics,'kind'),true),'TOPIC_EXISTING_INGREDIENT');
echo "CMS_TOPIC_DISCOVERY_PASS\n";
echo "CMS_CALENDAR_PRIVATE_PASS\n";
