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
$unsafe=$items;
$unsafe['c-000000000000000000000001']['title']='<script>alert(1)</script>';
$plan=cmsCalendarPlan($unsafe,'2026-11');
requireCalendar(str_contains(cmsEsc($plan['days']['2026-11-01'][0]['title']),
    '&lt;script&gt;'),'ESCAPED_TITLES');
echo "CMS_CALENDAR_PRIVATE_PASS\n";
