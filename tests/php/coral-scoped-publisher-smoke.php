<?php
declare(strict_types=1);
require __DIR__.'/../../public/gestion-contenus/coral-scoped-publisher.php';
function ok(bool $condition,string $why): void {if(!$condition)throw new RuntimeException('TEST_'.$why);}
function denied(callable $f,string $why): void {
    try {$f();}catch(RuntimeException|InvalidArgumentException $e) {return;}
    throw new RuntimeException('TEST_FAIL_OPEN_'.$why);
}
function destroy(string $dir): void {
    if (!is_dir($dir))return;
    foreach (scandir($dir)?:[] as $name) {
        if ($name==='.'||$name==='..')continue;
        $path=$dir.'/'.$name;
        if (is_dir($path)&&!is_link($path))destroy($path);else unlink($path);
    }
    rmdir($dir);
}
$root=sys_get_temp_dir().'/cms-coral-scoped-'.bin2hex(random_bytes(8));
$private=$root.'/private';$web=$root.'/www';
mkdir($root,0700);mkdir($private,0700);mkdir($web,0700);
$audio='ID3'.str_repeat('X',2045);$audioHash=hash('sha256',$audio);
$audioPath='audio/workshops/atelier-pratique-amok-trey/atelier-coral-'.substr($audioHash,0,12).'.mp3';
$paths=[$audioPath,'apprendre/pratique/amok-trey/index.html',
    'recettes/amok-trey/index.html','apprendre/index.html','sitemap.xml'];
$data=[
    $paths[0]=>$audio,
    $paths[1]=>'<html><audio src="/'.$audioPath.'"></audio><a href="/recettes/amok-trey/">recette</a></html>',
    $paths[2]=>'<html><a href="/apprendre/pratique/amok-trey/">atelier</a></html>',
    $paths[3]=>'<html><a href="/apprendre/pratique/amok-trey/">atelier</a></html>',
    $paths[4]=>'<loc>https://www.cuisine-du-cambodge.com/apprendre/pratique/amok-trey/</loc>'
];
$original=[
    $paths[0]=>null,$paths[1]=>null,
    $paths[2]=>'<html>old recipe</html>',
    $paths[3]=>'<html>old catalogue</html>',
    $paths[4]=>'<sitemap>old</sitemap>'
];
foreach ($original as $path=>$bytes) if ($bytes!==null) {
    $file=$web.'/'.$path;if (!is_dir(dirname($file)))mkdir(dirname($file),0700,true);
    file_put_contents($file,$bytes);
}
$preconditions=[];
foreach ($original as $path=>$bytes)$preconditions[$path]=$bytes===null?null:hash('sha256',$bytes);
function stage(string $private,string $job,array $paths,array $data,string $audioHash): string {
    $dir=$private.'/bundle-'.$job;
    mkdir($dir,0700);
    $files=[];
    foreach ($paths as $path) {
        $target=$dir.'/'.$path;
        if (!is_dir(dirname($target)))mkdir(dirname($target),0700,true);
        file_put_contents($target,$data[$path]);
        $files[]=['path'=>$path,'bytes'=>strlen($data[$path]),
            'sha256'=>hash('sha256',$data[$path]),'action'=>'add-or-scoped-replace'];
    }
    $manifest=[
        'contract'=>'cdc-coral-scoped-astro-bundle-v1',
        'creationId'=>'c-'.str_repeat('1',24),'creationVersion'=>4,
        'requestId'=>$job,'recipeSlug'=>'amok-trey','publicSlug'=>'amok-trey',
        'audioSha256'=>$audioHash,'deployable'=>false,'published'=>false,
        'sourceCommitVerified'=>true,'nativeBlueprintVerified'=>true,'mediaRightsVerified'=>true,
        'files'=>$files
    ];
    file_put_contents($dir.'/BUNDLE-MANIFEST-PRIVE.json',json_encode($manifest,JSON_THROW_ON_ERROR));
    return $dir;
}
try {
    $job=str_repeat('2',48);
    $dir=stage($private,$job,$paths,$data,$audioHash);
    $calls=0;
    denied(fn()=>cmsCoralPublishBundle($private,$web,$dir,$preconditions,
        static fn($m)=>false),'AUTH');
    foreach($original as $path=>$before)
        ok(($before===null?!file_exists($web.'/'.$path):
            file_get_contents($web.'/'.$path)===$before),'DENY_NO_WRITES');
    $bad=$preconditions;$bad[$paths[2]]=str_repeat('a',64);
    denied(fn()=>cmsCoralPublishBundle($private,$web,$dir,$bad,
        static fn($m)=>true),'EXPECTED_LIVE');
    $fault=static function(int $i) {if($i===2)throw new RuntimeException('INJECTED_FAILURE');};
    denied(fn()=>cmsCoralPublishBundle($private,$web,$dir,$preconditions,
        static fn($m)=>true,$fault),'ROLLBACK');
    foreach($original as $path=>$before)
        ok(($before===null?!file_exists($web.'/'.$path):
            file_get_contents($web.'/'.$path)===$before),'ROLLBACK_RESTORES_ALL');
    ok(is_file($private.'/coral-scoped-releases/'.$job.'/before-write.json'),'BACKUP_RECORDED');
    denied(fn()=>cmsCoralPublishBundle($private,$web,$dir,$preconditions,
        static fn($m)=>true),'NO_REPLAY_AFTER_FAILED_ATTEMPT');
    $job2=str_repeat('3',48);$dir2=stage($private,$job2,$paths,$data,$audioHash);
    $authorizations=0;
    $receipt=cmsCoralPublishBundle($private,$web,$dir2,$preconditions,
        static function($m)use(&$authorizations):bool{
            $authorizations++;return $m['creationVersion']===4;
        });
    ok($authorizations===2,'AUTH_TWICE');
    ok($receipt['fileCount']===5&&!$receipt['httpReceptionVerified'],'LOCAL_ONLY');
    foreach($data as $path=>$bytes)
        ok(file_get_contents($web.'/'.$path)===$bytes,'LIVE_FILE_SHA');
    foreach($original as $path=>$before)if($before!==null)
        ok(file_get_contents($receipt['backupDir'].'/'.$path)===$before,'PRIVATE_BACKUP_SHA');
    $outside=$root.'/outside.txt';file_put_contents($outside,'unchanged');
    denied(fn()=>cmsCoralPublishBundle($private,$web,$dir2,$preconditions,
        static fn($m)=>true),'NO_OVERWRITE');
    ok(file_get_contents($outside)==='unchanged','NO_ESCAPE');
    echo "CORAL_SCOPED_OVH_PUBLISH_OFFLINE_PASS\n";
} finally {destroy($root);}
