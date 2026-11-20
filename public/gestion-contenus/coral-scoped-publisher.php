<?php
declare(strict_types=1);
/**
 * Same-host OVH publisher for an already approved, private Coral Astro bundle.
 * NOT a standalone HTTP endpoint. No credentials, SSH, GitHub or paid TTS.
 *
 * Deployment is deliberately not wired to the Studio UI before bundle delivery
 * and authenticated human release confirmation can be proven end-to-end.
 */
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath((string) $_SERVER['SCRIPT_FILENAME']) === __FILE__) {
    http_response_code(404);
    exit;
}
function cmsCoralPublishFail(string $code): never {
    throw new RuntimeException('CORAL_PUBLISH_'.$code);
}
function cmsCoralPublishDigest(string $file, int $limit): array {
    if (is_link($file) || !is_file($file)) cmsCoralPublishFail('NOT_A_FILE');
    $size = filesize($file);
    if (!is_int($size) || $size < 1 || $size > $limit) cmsCoralPublishFail('SIZE');
    $hash = hash_file('sha256', $file);
    if (!is_string($hash) || !preg_match('/^[a-f0-9]{64}$/D', $hash)) cmsCoralPublishFail('HASH');
    return ['bytes'=>$size,'sha256'=>$hash];
}
function cmsCoralPublishSecureDir(string $path, bool $create): void {
    if (is_link($path)) cmsCoralPublishFail('SYMLINK_DIR');
    if ($create && !is_dir($path) && !@mkdir($path,0700,true)) cmsCoralPublishFail('DIR_CREATE');
    if (!is_dir($path) || is_link($path)) cmsCoralPublishFail('DIR_MISSING');
}
function cmsCoralPublishTarget(string $root, string $relative): string {
    if ($relative === '' || str_contains($relative,'\\') || str_starts_with($relative,'/')
        || preg_match('~(?:^|/)(?:\\.|\\.\\.|)(?:/|$)~D',$relative))
        cmsCoralPublishFail('PATH');
    $parts = explode('/',$relative);
    $at = $root;
    foreach (array_slice($parts,0,-1) as $part) {
        if ($part === '' || str_starts_with($part,'.')) cmsCoralPublishFail('PATH');
        $at .= '/'.$part;
        if (is_link($at) || (file_exists($at) && !is_dir($at))) cmsCoralPublishFail('PARENT');
    }
    $file = $root.'/'.$relative;
    if (is_link($file) || (file_exists($file) && !is_file($file))) cmsCoralPublishFail('TARGET');
    return $file;
}
function cmsCoralPublishManifest(array $manifest, array $preconditions): array {
    if (($manifest['contract']??null)!=='cdc-coral-scoped-astro-bundle-v1'
        || !preg_match('/^[a-f0-9]{48}$/D',(string)($manifest['requestId']??''))
        || !preg_match('/^c-[a-f0-9]{24}$/D',(string)($manifest['creationId']??''))
        || !preg_match('/^[a-f0-9]{64}$/D',(string)($manifest['audioSha256']??''))
        || ($manifest['deployable']??true)!==false
        || ($manifest['published']??true)!==false
        || ($manifest['sourceCommitVerified']??false)!==true
        || ($manifest['nativeBlueprintVerified']??false)!==true
        || ($manifest['mediaRightsVerified']??false)!==true
        || !is_array($manifest['files']??null)
        || count($manifest['files'])!==5) cmsCoralPublishFail('MANIFEST');
    $paths=[];$files=$manifest['files'];
    foreach ($files as $entry) {
        if (!is_array($entry) || !is_string($entry['path']??null)
            || !preg_match('/^[a-f0-9]{64}$/D',(string)($entry['sha256']??''))
            || !is_int($entry['bytes']??null) || $entry['bytes']<1
            || $entry['bytes']>32000000
            || ($entry['action']??null)!=='add-or-scoped-replace')
            cmsCoralPublishFail('FILE_ENTRY');
        $name=$entry['path'];
        if (isset($paths[$name])) cmsCoralPublishFail('DUPLICATE');
        $paths[$name]=$entry;
    }
    $recipe=$manifest['recipeSlug']??null;$slug=$manifest['publicSlug']??null;
    if (!is_string($recipe)||!preg_match('/^[a-z0-9][a-z0-9-]{2,99}$/D',$recipe)
        ||!is_string($slug)||!preg_match('/^[a-z0-9][a-z0-9-]{2,99}$/D',$slug))
        cmsCoralPublishFail('SLUG');
    $audioName='audio/workshops/atelier-pratique-'.$slug.'/atelier-coral-'.
        substr($manifest['audioSha256'],0,12).'.mp3';
    $expected=[$audioName,'apprendre/pratique/'.$slug.'/index.html',
        'recettes/'.$recipe.'/index.html','apprendre/index.html','sitemap.xml'];
    if (array_keys($paths)!==$expected || $files[0]['sha256']!==$manifest['audioSha256'])
        cmsCoralPublishFail('SCOPE');
    if (array_keys($preconditions)!==$expected) cmsCoralPublishFail('PRECONDITION_NAMES');
    foreach ($preconditions as $value) if ($value!==null
        && (!is_string($value)||!preg_match('/^[a-f0-9]{64}$/D',$value)))
        cmsCoralPublishFail('PRECONDITION_HASH');
    return $expected;
}
/**
 * Pure same-host operation: stages must already exist OFF the webroot.
 *
 * $authorize is an authenticated, fail-closed Studio callback, invoked twice.
 * $fault is a TEST-ONLY callback: production callers must omit it.
 * The returned receipt is NOT an external HTTP reception test.
 */
function cmsCoralPublishBundle(
    string $private, string $webroot, string $bundle, array $expectedLive,
    callable $authorize, ?callable $fault = null
): array {
    cmsCoralPublishSecureDir($private,false);
    cmsCoralPublishSecureDir($webroot,false);
    $realPrivate=realpath($private);$realWeb=realpath($webroot);
    if (!$realPrivate || !$realWeb || $realPrivate===$realWeb
        || str_starts_with($realPrivate,$realWeb.'/'))
        cmsCoralPublishFail('BACKUP_MUST_BE_PRIVATE');
    $realBundle=realpath($bundle);
    if (!$realBundle || !is_dir($bundle) || is_link($bundle)
        || !str_starts_with($realBundle,$realPrivate.'/'))
        cmsCoralPublishFail('PRIVATE_BUNDLE_REQUIRED');
    $manifestPath=$realBundle.'/BUNDLE-MANIFEST-PRIVE.json';
    $raw=@file_get_contents($manifestPath);
    if (!is_string($raw) || strlen($raw)>64000) cmsCoralPublishFail('MANIFEST_BYTES');
    $manifest=json_decode($raw,true,24,JSON_THROW_ON_ERROR);
    if (!is_array($manifest)) cmsCoralPublishFail('MANIFEST_FORMAT');
    $names=cmsCoralPublishManifest($manifest,$expectedLive);
    $request=$manifest['requestId'];
    $releases=$realPrivate.'/coral-scoped-releases';
    cmsCoralPublishSecureDir($releases,true);
    $lock=@fopen($releases.'/publish.lock','c');
    if (!$lock || !flock($lock,LOCK_EX)) cmsCoralPublishFail('LOCK');
    $backupDir=$releases.'/'.$request;
    $installed=[];
    try {
        // The authorization callback MUST check a fresh Studio journal,
        // MP3 hash, current audio approval and owner publication consent.
        if ($authorize($manifest)!==true) cmsCoralPublishFail('AUTHORITY');
        if (file_exists($backupDir) || is_link($backupDir)) cmsCoralPublishFail('REPLAY');
        $payload=[];$previous=[];
        foreach ($names as $name) {
            $source=cmsCoralPublishTarget($realBundle,$name);
            $actual=cmsCoralPublishDigest($source,32000000);
            $meta=$manifest['files'][array_search($name,$names,true)];
            if ($actual['sha256']!==$meta['sha256'] || $actual['bytes']!==$meta['bytes'])
                cmsCoralPublishFail('STAGED_SHA');
            $target=cmsCoralPublishTarget($realWeb,$name);
            $present=is_file($target);
            $current=$present?cmsCoralPublishDigest($target,32000000):null;
            if (($current['sha256']??null) !== $expectedLive[$name]) cmsCoralPublishFail('LIVE_CHANGED');
            $payload[$name]=$source;$previous[$name]=$current;
        }
        cmsCoralPublishSecureDir($backupDir,true);
        $backups=[];
        foreach ($names as $name) {
            $before=$previous[$name];
            if ($before!==null) {
                $save=$backupDir.'/'.$name;
                cmsCoralPublishSecureDir(dirname($save),true);
                if (!@copy($realWeb.'/'.$name,$save)) cmsCoralPublishFail('BACKUP');
                if (cmsCoralPublishDigest($save,32000000)!==$before) cmsCoralPublishFail('BACKUP_SHA');
                $backups[$name]=$before;
            } else $backups[$name]=null;
        }
        $json=json_encode(['contract'=>'cdc-coral-ovh-before-write-v1',
            'requestId'=>$request,'previous'=>$backups,
            'expected'=>$manifest['files']],JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES);
        if (@file_put_contents($backupDir.'/before-write.json',$json,LOCK_EX)!==strlen($json))
            cmsCoralPublishFail('BACKUP_RECORD');
        // Independent second authorization check under the same publish lock.
        if ($authorize($manifest)!==true) cmsCoralPublishFail('AUTHORITY_CHANGED');
        try {
            foreach ($names as $index=>$name) {
                $dest=cmsCoralPublishTarget($realWeb,$name);
                $parent=dirname($dest);
                if (!is_dir($parent)) {
                    cmsCoralPublishSecureDir($parent,true);
                }
                $temp=$dest.'.coral-'.bin2hex(random_bytes(12)).'.pending';
                if (!@copy($payload[$name],$temp)) cmsCoralPublishFail('STAGE_TEMP');
                try {
                    $expected=$manifest['files'][$index];
                    if (cmsCoralPublishDigest($temp,32000000)['sha256']!==$expected['sha256'])
                        cmsCoralPublishFail('STAGE_TEMP_SHA');
                    // Include target in rollback set BEFORE the atomic rename.
                    $installed[]=$name;
                    if (!@rename($temp,$dest)) cmsCoralPublishFail('RENAME');
                    if (cmsCoralPublishDigest($dest,32000000)['sha256']!==$expected['sha256'])
                        cmsCoralPublishFail('POST_SHA');
                } finally {
                    if (is_file($temp)) @unlink($temp);
                }
                if ($fault!==null) $fault($index,$name);
            }
        $receipt=['contract'=>'cdc-coral-ovh-local-receipt-v1',
            'requestId'=>$request,'fileCount'=>5,'liveSha256'=>array_map(
                static fn($e)=>$e['sha256'],$manifest['files']),
            'backupDir'=>$backupDir,'httpReceptionVerified'=>false,
            'rollbackTestedOnLiveServer'=>false];
        $json=json_encode($receipt,JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES);
        if (@file_put_contents($backupDir.'/receipt.json',$json,LOCK_EX)!==strlen($json))
            cmsCoralPublishFail('RECEIPT_WRITE');
        return $receipt;
        } catch (Throwable $error) {
            $failures=[];
            foreach (array_reverse($installed) as $name) {
                $dest=$realWeb.'/'.$name;
                if ($backups[$name]===null) {
                    if (is_file($dest) && !@unlink($dest)) $failures[]=$name;
                } else {
                    $temp=$dest.'.coral-rollback-'.bin2hex(random_bytes(8));
                    if (!@copy($backupDir.'/'.$name,$temp) || !@rename($temp,$dest)
                        || cmsCoralPublishDigest($dest,32000000)!==$backups[$name])
                        $failures[]=$name;
                }
            }
            if ($failures) cmsCoralPublishFail('ROLLBACK_FAILED');
            throw $error;
        }
    } finally {
        flock($lock,LOCK_UN);fclose($lock);
    }
}
