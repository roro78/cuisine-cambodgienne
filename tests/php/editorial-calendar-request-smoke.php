<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/lib.php';
function requireCalendarRequest(bool $ok,string $marker):void {
    if(!$ok)throw new RuntimeException('CALENDAR_REQUEST_TEST_'.$marker);
}
/** Execute the actual page's filter block; no auth, feed, network or private IO. */
function calendarRequestInit(string $source,array $query):array {
    $start=strpos($source,'if($calendarMode){');
    $end=strpos($source,'if(mbLen($q)');
    requireCalendarRequest($start!==false && $end!==false && $end>$start,
        'PAGE_FILTER_BLOCK_MISSING');
    $block=substr($source,$start,$end-$start);
    $previous=$_GET;
    $_GET=$query;
    $calendarMode=true;$calendarMonth=gmdate('Y-m');
    $calendarKind='all';$calendarStatus='all';$error='';
    // A legacy missing-key warning is counted but its message is never emitted.
    $warnings=0;
    set_error_handler(static function()use(&$warnings):bool{++$warnings;return true;});
    try{
        http_response_code(200);
        eval($block); // Trusted, checked-in PHP source block only; test harness.
        return [$calendarMonth,$calendarKind,$calendarStatus,$warnings];
    }finally{
        restore_error_handler();$_GET=$previous;
    }
}
if(isset($argv[1])){
    // Optional, pinned pre-fix source supplied by CI for before/after evidence.
    $before=file_get_contents($argv[1]);
    requireCalendarRequest(is_string($before),'PRE_FIX_SOURCE_MISSING');
    [$month,$kind,$status,$warnings]=calendarRequestInit($before,['calendar'=>'1']);
    requireCalendarRequest($status===null && $warnings===1,'PRE_FIX_NOT_REPRODUCED');
    $caught=null;
    try{cmsCalendarPlan([],$month,$kind,$status);}catch(TypeError $e){$caught=$e;}
    requireCalendarRequest($caught instanceof TypeError,'PRE_FIX_NOT_TYPE_ERROR');
    echo "CMS_CALENDAR_PRE_FIX_TYPE_ERROR_REPRODUCED\n";
    exit;
}
$source=file_get_contents(__DIR__.'/../../public/gestion-contenus/index.php');
requireCalendarRequest(is_string($source),'PAGE_SOURCE_MISSING');
foreach([
    [['calendar'=>'1'],'all'],
    [['calendar'=>'1','month'=>'2026-11'],'all'],
    [['calendar'=>'1','calendar_kind'=>'culture'],'all'],
    [['calendar'=>'1','calendar_status'=>'all'],'all'],
    [['calendar'=>'1','calendar_status'=>'draft'],'draft'],
    [['calendar'=>'1','calendar_status'=>'review'],'review'],
    [['calendar'=>'1','calendar_status'=>null],'all'],
    [['calendar'=>'1','calendar_status'=>[]],'all'],
    [['calendar'=>'1','calendar_status'=>false],'all'],
    [['calendar'=>'1','calendar_status'=>123],'all'],
    [['calendar'=>'1','calendar_status'=>'obsolete'],'all']
] as [$query,$expected]){
    [$month,$kind,$status,$warnings]=calendarRequestInit($source,$query);
    requireCalendarRequest($status===$expected && $warnings===0,'STATUS_DEFAULT');
    requireCalendarRequest(cmsCalendarPlan([],$month,$kind,$status)['total']===0,
        'EMPTY_CALENDAR_REQUEST');
}
echo "CMS_CALENDAR_REQUEST_DEFAULTS_PASS\n";
