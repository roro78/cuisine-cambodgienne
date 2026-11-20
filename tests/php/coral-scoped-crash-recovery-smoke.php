<?php
declare(strict_types=1);
require __DIR__.'/../../public/gestion-contenus/coral-scoped-publisher.php';
function recoveryOk(bool $ok,string $why): void {
    if(!$ok)throw new RuntimeException('TEST_'.$why);
}
function recoveryDenied(callable $fn,string $why): void {
    try{$fn();}catch(RuntimeException|InvalidArgumentException $e){return;}
    throw new RuntimeException('TEST_FAIL_OPEN_'.$why);
}
function recoveryDelete(string $dir): void {
    if(!is_dir($dir))return;
    foreach(scandir($dir)?:[] as $name){
        if($name==='.'||$name==='..')continue;
        $path=$dir.'/'.$name;
        if(is_dir($path)&&!is_link($path))recoveryDelete($path);
        else unlink($path);
    }
    rmdir($dir);
}
$root=sys_get_temp_dir().'/coral-crash-recovery-'.bin2hex(random_bytes(8));
$private=$root.'/private';$web=$root.'/web';
mkdir($root,0700);mkdir($private,0700);mkdir($web,0700);
$job=str_repeat('7',48);$slug='crash-safe-course';$recipe='amok-trey';
$mp3='ID3'.str_repeat('R',2100);$mp3Hash=hash('sha256',$mp3);
$audio='audio/workshops/atelier-pratique-'.$slug.'/atelier-coral-'.substr($mp3Hash,0,12).'.mp3';
$paths=[$audio,'apprendre/pratique/'.$slug.'/index.html',
 'recettes/'.$recipe.'/index.html','apprendre/index.html','sitemap.xml'];
$after=[$audio=>$mp3,$paths[1]=>'<html>new course</html>',
 $paths[2]=>'<html>new recipe</html>',$paths[3]=>'<html>new index</html>',
 $paths[4]=>'<xml>new sitemap</xml>'];
$before=[$audio=>null,$paths[1]=>null,
 $paths[2]=>'<html>old recipe</html>',$paths[3]=>'<html>old index</html>',
 $paths[4]=>'<xml>old sitemap</xml>'];
$release=$private.'/coral-scoped-releases';$backup=$release.'/'.$job;
mkdir($backup,0700,true);
$expected=[];
foreach($paths as $name){
    $expected[]=['path'=>$name,'bytes'=>strlen($after[$name]),
      'sha256'=>hash('sha256',$after[$name]),'action'=>'add-or-scoped-replace'];
    if($before[$name]!==null){
        $b=$backup.'/'.$name;
        if(!is_dir(dirname($b)))mkdir(dirname($b),0700,true);
        file_put_contents($b,$before[$name]);
        $live=$web.'/'.$name;
        if(!is_dir(dirname($live)))mkdir(dirname($live),0700,true);
        file_put_contents($live,$before[$name]);
    }
}
$previous=[];
foreach($before as $p=>$bytes)$previous[$p]=$bytes===null?null:hash('sha256',$bytes);
file_put_contents($backup.'/before-write.json',json_encode([
 'contract'=>'cdc-coral-ovh-before-write-v1','requestId'=>$job,
 'previous'=>$previous,'expected'=>$expected],JSON_THROW_ON_ERROR));
try{
 // Simulate a hard process crash after replacing only the first three paths.
 foreach(array_slice($paths,0,3) as $path){
    $target=$web.'/'.$path;
    if(!is_dir(dirname($target)))mkdir(dirname($target),0700,true);
    file_put_contents($target,$after[$path]);
 }
 // A foreign edit after a crash prevents any restoration, even partial.
 file_put_contents($web.'/'.$paths[3],'UNRELATED CHANGE');
 recoveryDenied(fn()=>cmsCoralPublishRecoverInterrupted(
   $private,$web,$job,static fn()=>true),'FOREIGN_EDIT');
 recoveryOk(file_get_contents($web.'/'.$paths[0])===$after[$paths[0]],'NO_PARTIAL_RECOVERY');
 file_put_contents($web.'/'.$paths[3],$before[$paths[3]]);
 recoveryDenied(fn()=>cmsCoralPublishRecoverInterrupted(
   $private,$web,$job,static fn()=>false),'AUTH_REQUIRED');
 $receipt=cmsCoralPublishRecoverInterrupted($private,$web,$job,static fn()=>true);
 recoveryOk($receipt['restored']===true&&!$receipt['httpReceptionVerified'],'RECOVERY');
 foreach($paths as $path){
   $target=$web.'/'.$path;
   recoveryOk($before[$path]===null?!file_exists($target):
     file_get_contents($target)===$before[$path],'EXACT_RESTORE');
 }
 recoveryOk(is_file($backup.'/recovered.json'),'RECOVERY_MARKER');
 recoveryOk(cmsCoralPublishRecoverInterrupted(
    $private,$web,$job,static fn()=>true)['alreadyRestored']===true,'IDEMPOTENT');
 echo "CORAL_OVH_CRASH_RECOVERY_OFFLINE_PASS\n";
} finally {recoveryDelete($root);}
