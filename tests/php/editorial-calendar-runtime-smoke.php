<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/lib.php';
function requireRuntime(bool $ok,string $marker):void {
    if(!$ok)throw new RuntimeException('CALENDAR_RUNTIME_TEST_'.$marker);
}
$missing=$argv[1]??null;
if($missing!==null){
    requireRuntime(in_array($missing,['array_sum','array_map','usort','ksort'],true),
        'UNSUPPORTED_FIXTURE');
    requireRuntime(!function_exists($missing),'FUNCTION_NOT_DISABLED');
    $caught=null;
    try{cmsCalendarPlan([],'2026-11');}catch(Throwable $error){$caught=$error;}
    requireRuntime($caught instanceof Error,'EMPTY_ENGINE_NOT_REPRODUCED');
    $diagnostic=cmsCalendarRuntimeDiagnostic($caught);
    requireRuntime(str_contains($diagnostic,'MISSING_'.strtoupper($missing).'_LIB_'),
        'MISSING_FUNCTION_NOT_IDENTIFIED');
    requireRuntime((bool)preg_match('/^[A-Z0-9_]+$/D',$diagnostic),'UNSAFE_DIAGNOSTIC');
    echo 'CMS_CALENDAR_RESTRICTED_RUNTIME_PASS '.strtoupper($missing)."\n";
    exit;
}
$private='PRIVATE_DRAFT_TITLE_'.bin2hex(random_bytes(8));
foreach([
    new Error($private),new TypeError('array_map(): '.$private),
    new ValueError('array_sum(): '.$private),
    new RuntimeException('/private/config.php '.$private)
] as $error){
    $safe=cmsCalendarRuntimeDiagnostic($error);
    requireRuntime(!str_contains($safe,$private) && !str_contains($safe,'config.php')
        && !str_contains($safe,__FILE__),'PRIVATE_MESSAGE_LEAK');
    requireRuntime((bool)preg_match('/^[A-Z0-9_]+$/D',$safe),'UNSAFE_VOCABULARY');
    requireRuntime(str_contains($safe,'OTHER_SOURCE'),'PRIVATE_PATH_EXPOSED');
}
requireRuntime(str_contains(cmsCalendarRuntimeDiagnostic(
    new Error('Call to undefined function array_sum()')),'MISSING_ARRAY_SUM'),
    'KNOWN_UNDEFINED_FUNCTION');
requireRuntime(str_contains(cmsCalendarRuntimeDiagnostic(
    new Error('Call to undefined function '.$private.'()')),'UNKNOWN'),
    'ARBITRARY_FUNCTION_EXPOSED');
requireRuntime(cmsCalendarPlan([],'2026-11')['total']===0,'NORMAL_ENGINE');
echo "CMS_CALENDAR_RUNTIME_DIAGNOSTICS_PASS\n";
