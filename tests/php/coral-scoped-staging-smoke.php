<?php
declare(strict_types=1);
require __DIR__.'/../../public/gestion-contenus/coral-scoped-staging.php';
function stageOk(bool $condition,string $reason): void {
    if(!$condition)throw new RuntimeException('TEST_'.$reason);
}
function stageDenied(callable $check,string $reason): void {
    try{$check();}catch(RuntimeException|InvalidArgumentException $e){return;}
    throw new RuntimeException('TEST_FAIL_OPEN_'.$reason);
}
function stageDestroy(string $dir): void {
    if(!is_dir($dir))return;
    foreach(scandir($dir)?:[] as $name){
        if($name==='.'||$name==='..')continue;
        $p=$dir.'/'.$name;
        if(is_dir($p)&&!is_link($p))stageDestroy($p);else unlink($p);
    }
    rmdir($dir);
}
$root=sys_get_temp_dir().'/coral-stage-smoke-'.bin2hex(random_bytes(8));
$private=$root.'/private';$web=$root.'/web';
mkdir($root,0700);mkdir($private,0700);mkdir($web,0700);
$job=str_repeat('a',48);
$mp3='ID3'.str_repeat('P',4096);
$audioSha=hash('sha256',$mp3);
$slug='new-workshop';
$mp3Path='audio/workshops/atelier-pratique-'.$slug.'/atelier-coral-'.substr($audioSha,0,12).'.mp3';
$paths=[$mp3Path,'apprendre/pratique/'.$slug.'/index.html',
    'recettes/amok-trey/index.html','apprendre/index.html','sitemap.xml'];
$files=[
    $paths[0]=>$mp3,
    $paths[1]=>'<html><audio src="/'.$mp3Path.'"></audio><a href="/recettes/amok-trey/">Recette</a></html>',
    $paths[2]=>'<html><a href="/apprendre/pratique/'.$slug.'/">Atelier</a></html>',
    $paths[3]=>'<html><a href="/apprendre/pratique/'.$slug.'/">Atelier</a></html>',
    $paths[4]=>'<loc>https://www.cuisine-du-cambodge.com/apprendre/pratique/'.$slug.'/</loc>'
];
foreach(array_slice($paths,2) as $path){
    $target=$web.'/'.$path;
    if(!is_dir(dirname($target)))mkdir(dirname($target),0700,true);
    file_put_contents($target,'OLD '.basename($path));
}
$manifest=['contract'=>'cdc-coral-scoped-astro-bundle-v1',
    'creationId'=>'c-'.str_repeat('c',24),'creationVersion'=>4,
    'requestId'=>$job,'recipeSlug'=>'amok-trey','publicSlug'=>$slug,
    'audioSha256'=>$audioSha,'sourceCommit'=>str_repeat('c',40),
    'sourceCommitVerified'=>true,'nativeBlueprintVerified'=>true,
    'mediaRightsVerified'=>true,'mediaImageSha256'=>str_repeat('b',64),
    'builderContract'=>'cdc-coral-private-verified-astro-builder-v1',
    'deployable'=>false,'published'=>false,
    'files'=>array_map(static fn($p)=>[
        'path'=>$p,'bytes'=>strlen($files[$p]),
        'sha256'=>hash('sha256',$files[$p]),'action'=>'add-or-scoped-replace'
    ],$paths)];
$envelope=['contract'=>'cdc-coral-ovh-staging-v1','requestId'=>$job];
try {
    $token=str_repeat('d',64);
    $tokenFile=$private.'/coral-stage-token';
    file_put_contents($tokenFile,$token."\n");chmod($tokenFile,0600);
    $cfg=['coral_scoped_staging_enabled'=>true,
        'coral_scoped_staging_token_file'=>$tokenFile];
    cmsCoralStageAuthenticate($private,$cfg,'Bearer '.$token);
    stageDenied(fn()=>cmsCoralStageAuthenticate($private,$cfg,'Bearer '.str_repeat('0',64)),
        'TOKEN_DENIED');
    $begin=$envelope+['op'=>'begin','manifest'=>$manifest];
    $res=cmsCoralStageOperation($private,$web,$begin);
    stageOk($res['stage']==='receiving','BEGIN');
    stageOk(cmsCoralStageOperation($private,$web,$begin)['stage']==='receiving',
        'BEGIN_IDEMPOTENT');
    stageDenied(fn()=>cmsCoralStageOperation($private,$web,$envelope+
        ['op'=>'begin','manifest'=>array_replace($manifest,['audioSha256'=>str_repeat('f',64)])]),
        'CONFLICTING_MANIFEST');
    foreach($files as $path=>$bytes){
        $cursor=0;
        while($cursor<strlen($bytes)){
            $chunk=substr($bytes,$cursor,1024);
            $send=$envelope+['op'=>'append','path'=>$path,'offset'=>$cursor,
                'chunkSha256'=>hash('sha256',$chunk),
                'payloadB64'=>base64_encode($chunk)];
            $ack=cmsCoralStageOperation($private,$web,$send);
            stageOk($ack['offset']===$cursor+strlen($chunk),'CHUNK_ACK');
            stageOk(cmsCoralStageOperation($private,$web,$send)['offset']===$ack['offset'],
                'CHUNK_IDEMPOTENT');
            stageDenied(fn()=>cmsCoralStageOperation($private,$web,
                array_replace($send,['payloadB64'=>base64_encode(str_repeat('X',strlen($chunk)))])),
                'CHUNK_TAMPER');
            $cursor+=strlen($chunk);
        }
    }
    $seal=$envelope+['op'=>'seal'];
    stageOk(cmsCoralStageOperation($private,$web,$seal)['stage']==='sealed','SEAL');
    stageOk(cmsCoralStageOperation($private,$web,$seal)['stage']==='sealed',
        'SEAL_IDEMPOTENT');
    stageDenied(fn()=>cmsCoralStageOperation($private,$web,
        $envelope+['op'=>'append','path'=>$paths[0],'offset'=>0,
        'chunkSha256'=>hash('sha256','P'),'payloadB64'=>base64_encode('P')]),'SEALED_WRITE');
    $ready=cmsCoralStageReady($private,$job);
    stageOk($ready['manifest']['requestId']===$job,'READY');
    stageOk($ready['preconditions'][$paths[0]]===null&&
        $ready['preconditions'][$paths[2]]===hash('sha256','OLD index.html'),
        'LIVE_SNAPSHOT');
    foreach($paths as $path){
        if($path===$paths[0]||$path===$paths[1])
            stageOk(!file_exists($web.'/'.$path),'NO_PUBLIC_AUDIO_OR_PAGE');
        else stageOk(file_get_contents($web.'/'.$path)==='OLD '.basename($path),
            'SHARED_PUBLIC_UNCHANGED');
    }
    stageDenied(fn()=>cmsCoralStageOperation($private,$web,$envelope+
        ['op'=>'begin','manifest'=>array_replace($manifest,['publicSlug'=>'other'])]),
        'SEALED_MANIFEST');
    echo "CORAL_OVH_PRIVATE_STAGING_OFFLINE_PASS\n";
} finally {stageDestroy($root);}
