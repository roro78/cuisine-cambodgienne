<?php
declare(strict_types=1);
/**
 * Machine-authenticated scoped Coral bundle intake on the EXISTING OVH Studio.
 * Include-only. Streams exact five public artifacts into a private directory;
 * cannot publish, start speech, approve content, or access private narrations.
 * A separate token and explicit server configuration are mandatory.
 */
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath((string)$_SERVER['SCRIPT_FILENAME']) === __FILE__) {
    http_response_code(404); exit;
}
require_once __DIR__.'/coral-scoped-publisher.php';
function cmsCoralStageFail(string $code): never {
    throw new RuntimeException('CORAL_STAGE_'.$code);
}
function cmsCoralStageToken(string $private,array $cfg): string {
    if (($cfg['coral_scoped_staging_enabled']??false)!==true)
        cmsCoralStageFail('DISABLED');
    $file=$cfg['coral_scoped_staging_token_file']??null;
    if (!is_string($file)||is_link($file)||!is_file($file)||
        realpath(dirname($file))!==realpath($private)||
        (PHP_OS_FAMILY!=='Windows'&&
          (((fileperms($file)&0077)!==0)||fileowner($file)!==fileowner($private))))
        cmsCoralStageFail('SECRET_LOCATION');
    $value=@file_get_contents($file);
    if (!is_string($value))cmsCoralStageFail('SECRET_READ');
    $token=rtrim($value,"\r\n");
    if (!preg_match('/^[a-f0-9]{64}$/D',$token))cmsCoralStageFail('SECRET_FORMAT');
    return $token;
}
function cmsCoralStageAuthenticate(string $private,array $cfg,string $bearer): void {
    $secret=cmsCoralStageToken($private,$cfg);
    if (!hash_equals('Bearer '.$secret,$bearer))cmsCoralStageFail('AUTH');
}
function cmsCoralStageRoot(string $private): string {
    cmsCoralPublishSecureDir($private,false);
    $root=realpath($private);
    if (!$root)cmsCoralStageFail('PRIVATE_ROOT');
    $staging=$root.'/coral-scoped-staging';
    cmsCoralPublishSecureDir($staging,true);
    return $staging;
}
function cmsCoralStageLoad(string $folder): array {
    $file=$folder.'/stage.json';
    if (is_link($file)||!is_file($file)||filesize($file)>64000)
        cmsCoralStageFail('STATE_MISSING');
    $state=json_decode((string)file_get_contents($file),true,24,JSON_THROW_ON_ERROR);
    if (!is_array($state)||($state['contract']??null)!=='cdc-coral-ovh-staging-state-v1'||
        !is_array($state['manifest']??null)||!is_array($state['preconditions']??null)||
        !is_bool($state['sealed']??null))cmsCoralStageFail('STATE_FORMAT');
    return $state;
}
function cmsCoralStageStore(string $file,array $state,bool $new=false): void {
    $data=json_encode($state,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
    if (strlen($data)>64000)cmsCoralStageFail('STATE_SIZE');
    // Stage state is written under the per-job LOCK and atomically replaced.
    $temp=$file.'.'.bin2hex(random_bytes(8)).'.tmp';
    if (@file_put_contents($temp,$data,LOCK_EX)!==strlen($data)||
        !@chmod($temp,0600)||!@rename($temp,$file)) {
        @unlink($temp);cmsCoralStageFail('STATE_WRITE');
    }
}
function cmsCoralStageInventory(string $webroot,array $paths): array {
    cmsCoralPublishSecureDir($webroot,false);
    $root=realpath($webroot);
    if (!$root)cmsCoralStageFail('WEBROOT');
    $result=[];
    foreach($paths as $i=>$path){
        $file=cmsCoralPublishTarget($root,$path);
        $existing=is_file($file);
        // Publishing a new workshop must never overwrite a previous workshop
        // or its immutable audio. Shared recipe/catalogue/sitemap must exist.
        if (($i<2&&$existing)||($i>=2&&!$existing))
            cmsCoralStageFail('TARGET_INVENTORY');
        $result[$path]=$existing?cmsCoralPublishDigest($file,32000000)['sha256']:null;
    }
    return $result;
}
function cmsCoralStageReady(string $private,string $job): array {
    if (!preg_match('/^[a-f0-9]{48}$/D',$job))cmsCoralStageFail('REQUEST_ID');
    $folder=cmsCoralStageRoot($private).'/'.$job;
    if(is_link($folder)||!is_dir($folder))cmsCoralStageFail('NOT_STAGED');
    $state=cmsCoralStageLoad($folder);
    if (!$state['sealed']||($state['manifest']['requestId']??null)!==$job)
        cmsCoralStageFail('NOT_SEALED');
    $bundle=$folder.'/bundle';
    if (is_link($bundle)||!is_dir($bundle))cmsCoralStageFail('BUNDLE');
    $actual=cmsCoralPublishDigest($bundle.'/BUNDLE-MANIFEST-PRIVE.json',64000);
    if ($actual['sha256']!==($state['manifestSha256']??null))
        cmsCoralStageFail('MANIFEST_CHANGED');
    $expected=cmsCoralPublishManifest($state['manifest'],$state['preconditions']);
    foreach($expected as $path){
        $actual=cmsCoralPublishDigest(cmsCoralPublishTarget($bundle,$path),32000000);
        $entry=$state['manifest']['files'][array_search($path,$expected,true)];
        if ($actual['sha256']!==$entry['sha256']||$actual['bytes']!==$entry['bytes'])
            cmsCoralStageFail('BUNDLE_CHANGED');
    }
    return ['bundle'=>$bundle,'manifest'=>$state['manifest'],
      'preconditions'=>$state['preconditions']];
}
/** Idempotent begin/chunk/seal: no upload can silently change a sealed lot. */
function cmsCoralStageOperation(string $private,string $webroot,array $request): array {
    if (($request['contract']??null)!=='cdc-coral-ovh-staging-v1'||
        !in_array($request['op']??null,['begin','append','seal'],true)||
        !preg_match('/^[a-f0-9]{48}$/D',(string)($request['requestId']??'')))
        cmsCoralStageFail('REQUEST');
    $job=$request['requestId'];$op=$request['op'];
    $root=cmsCoralStageRoot($private);
    $folder=$root.'/'.$job;
    if (is_link($folder))cmsCoralStageFail('SYMLINK');
    if (!is_dir($folder)) {
        if($op!=='begin')cmsCoralStageFail('UNKNOWN_JOB');
        $existing=glob($root.'/'.str_repeat('?',48),GLOB_ONLYDIR);
        if(is_array($existing)&&count($existing)>=24)cmsCoralStageFail('CAPACITY');
        cmsCoralPublishSecureDir($folder,true);
    }
    $lock=@fopen($folder.'/lock','c');
    if (!$lock||!flock($lock,LOCK_EX))cmsCoralStageFail('LOCK');
    try {
        if ($op==='begin') {
            if (!is_array($request['manifest']??null)||
                count(array_diff(array_keys($request),['contract','op','requestId','manifest']))>0)
                cmsCoralStageFail('BEGIN');
            $manifest=$request['manifest'];
            if (($manifest['requestId']??null)!==$job||
                ($manifest['builderContract']??null)!=='cdc-coral-private-verified-astro-builder-v1'||
                !preg_match('/^[a-f0-9]{40}$/D',(string)($manifest['sourceCommit']??''))||
                !preg_match('/^[a-f0-9]{64}$/D',(string)($manifest['mediaImageSha256']??''))||
                !preg_match('/^[a-f0-9]{64}$/D',(string)($manifest['workshopSourceSha256']??'')))
                cmsCoralStageFail('BUILD_PROVENANCE');
            $files=$manifest['files']??null;
            if(!is_array($files))cmsCoralStageFail('FILES');
            $preconditions=[];
            foreach($files as $entry){
                if(!is_array($entry)||!is_string($entry['path']??null))
                    cmsCoralStageFail('FILE_ENTRY');
                $preconditions[$entry['path']]=null;
            }
            $paths=cmsCoralPublishManifest($manifest,$preconditions);
            $baseline=$manifest['baseSha256']??null;
            if(!is_array($baseline)||array_keys($baseline)!==array_slice($paths,2))
                cmsCoralStageFail('BASELINE');
            foreach($baseline as $hash)
                if(!is_string($hash)||!preg_match('/^[a-f0-9]{64}$/D',$hash))
                    cmsCoralStageFail('BASELINE');
            $prior=$folder.'/stage.json';
            if(is_file($prior)) {
                $old=cmsCoralStageLoad($folder);
                if($old['manifest']!==$manifest)cmsCoralStageFail('CONFLICT');
                return ['requestId'=>$job,'stage'=>$old['sealed']?'sealed':'receiving'];
            }
            $inventory=cmsCoralStageInventory($webroot,$paths);
            if(array_slice($inventory,2)!==$baseline)cmsCoralStageFail('LIVE_CHANGED');
            $bundle=$folder.'/bundle';
            cmsCoralPublishSecureDir($bundle,true);
            $bytes=json_encode($manifest,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
            if(strlen($bytes)>64000)cmsCoralStageFail('MANIFEST_SIZE');
            $manifestPath=$bundle.'/BUNDLE-MANIFEST-PRIVE.json';
            if(@file_put_contents($manifestPath,$bytes,LOCK_EX)!==strlen($bytes)||
                !@chmod($manifestPath,0600))cmsCoralStageFail('MANIFEST_WRITE');
            cmsCoralStageStore($prior,['contract'=>'cdc-coral-ovh-staging-state-v1',
              'manifest'=>$manifest,'manifestSha256'=>hash('sha256',$bytes),
              'preconditions'=>$inventory,'sealed'=>false]);
            return ['requestId'=>$job,'stage'=>'receiving'];
        }
        $state=cmsCoralStageLoad($folder);
        if (($state['manifest']['requestId']??null)!==$job)
            cmsCoralStageFail('STATE_JOB');
        $files=$state['manifest']['files'];
        if($op==='append') {
            if($state['sealed'])cmsCoralStageFail('SEALED');
            $name=$request['path']??null;
            if(!is_string($name)||!is_int($request['offset']??null)||
                $request['offset']<0||!is_string($request['payloadB64']??null)||
                !is_string($request['chunkSha256']??null)||
                count(array_diff(array_keys($request),
                    ['contract','op','requestId','path','offset','payloadB64','chunkSha256']))>0)
                cmsCoralStageFail('CHUNK_REQUEST');
            $entry=null;
            foreach($files as $file)if($file['path']===$name){$entry=$file;break;}
            if(!$entry)cmsCoralStageFail('CHUNK_PATH');
            $chunk=base64_decode($request['payloadB64'],true);
            if(!is_string($chunk)||strlen($chunk)<1||strlen($chunk)>262144||
                strlen($chunk)+$request['offset']>$entry['bytes']||
                !preg_match('/^[a-f0-9]{64}$/D',$request['chunkSha256'])||
                !hash_equals($request['chunkSha256'],hash('sha256',$chunk)))
                cmsCoralStageFail('CHUNK_SHA');
            $target=cmsCoralPublishTarget($folder.'/bundle',$name);
            cmsCoralPublishSecureDir(dirname($target),true);
            $size=is_file($target)?filesize($target):0;
            if(!is_int($size)||$size>$entry['bytes'])cmsCoralStageFail('CHUNK_STATE');
            $offset=$request['offset'];
            if($offset>$size)cmsCoralStageFail('CHUNK_GAP');
            if($offset<$size){
                // Check the complete or partial prefix already recorded before
                // appending the remainder of a chunk interrupted during write.
                $existing=min(strlen($chunk),$size-$offset);
                $fp=@fopen($target,'rb');
                if(!$fp)cmsCoralStageFail('CHUNK_REPLAY_OPEN');
                try{
                    if(fseek($fp,$offset)!==0||fread($fp,$existing)!==substr($chunk,0,$existing))
                        cmsCoralStageFail('CHUNK_CONFLICT');
                }finally{fclose($fp);}
                $remaining=substr($chunk,$existing);
            }else $remaining=$chunk;
            if($remaining!==''){
                $fp=@fopen($target,'ab');
                if(!$fp)cmsCoralStageFail('CHUNK_OPEN');
                try{
                    if(!@chmod($target,0600)||fwrite($fp,$remaining)!==strlen($remaining)||
                       !fflush($fp))cmsCoralStageFail('CHUNK_WRITE');
                }finally{fclose($fp);}
            }
            return ['requestId'=>$job,'stage'=>'receiving',
              'path'=>$name,'offset'=>$request['offset']+strlen($chunk)];
        }
        if(count(array_diff(array_keys($request),['contract','op','requestId']))>0)
            cmsCoralStageFail('SEAL_REQUEST');
        if($state['sealed'])return ['requestId'=>$job,'stage'=>'sealed'];
        $paths=cmsCoralPublishManifest($state['manifest'],$state['preconditions']);
        if(cmsCoralStageInventory($webroot,$paths)!==$state['preconditions'])
            cmsCoralStageFail('LIVE_CHANGED');
        foreach($paths as $name){
            $entry=$files[array_search($name,$paths,true)];
            $actual=cmsCoralPublishDigest(
                cmsCoralPublishTarget($folder.'/bundle',$name),32000000);
            if($actual['bytes']!==$entry['bytes']||$actual['sha256']!==$entry['sha256'])
                cmsCoralStageFail('INCOMPLETE');
        }
        $mp3=$folder.'/bundle/'.$paths[0];
        $header=@file_get_contents($mp3,false,null,0,3);
        if($header!=='ID3')cmsCoralStageFail('MP3_HEADER');
        $page=(string)file_get_contents($folder.'/bundle/'.$paths[1]);
        $recipe=(string)file_get_contents($folder.'/bundle/'.$paths[2]);
        $catalogue=(string)file_get_contents($folder.'/bundle/'.$paths[3]);
        $sitemap=(string)file_get_contents($folder.'/bundle/'.$paths[4]);
        $url='/apprendre/pratique/'.$state['manifest']['publicSlug'].'/';
        if(!str_contains($page,'/'.$paths[0])||
           !str_contains($page,'/recettes/'.$state['manifest']['recipeSlug'].'/')||
           !str_contains($recipe,$url)||!str_contains($catalogue,$url)||
           !str_contains($sitemap,$url))cmsCoralStageFail('PUBLIC_LINKS');
        // Only these five files will be deployed. Shared Astro assets must
        // already exist in the active document root.
        preg_match_all('~/_astro/[A-Za-z0-9_.-]+\.(?:css|m?js)\b~',$page.$recipe.$catalogue,$assets);
        foreach(array_unique($assets[0]) as $asset)
            if(!is_file(cmsCoralPublishTarget((string)realpath($webroot),substr($asset,1))))
                cmsCoralStageFail('SHARED_ASSET_MISSING');
        $state['sealed']=true;
        cmsCoralStageStore($folder.'/stage.json',$state);
        return ['requestId'=>$job,'stage'=>'sealed'];
    } finally {flock($lock,LOCK_UN);fclose($lock);}
}
