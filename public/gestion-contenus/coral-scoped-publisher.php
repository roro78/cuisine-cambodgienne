<?php
declare(strict_types=1);
/**
 * Same-host OVH publisher for an already approved, private Coral Astro bundle.
 * NOT a standalone HTTP endpoint. No credentials, SSH, GitHub or paid TTS.
 *
 * Called by the Studio under explicit publication or restoration approval.
 */
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath((string) $_SERVER['SCRIPT_FILENAME']) === __FILE__) {
    http_response_code(404);
    exit;
}
function cmsCoralPublishFail(string $code): never {
    throw new RuntimeException('CORAL_PUBLISH_'.$code);
}
function cmsCoralPublishJournal(string $path, array $entry, string $error): void {
    $json=json_encode($entry,JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES);
    $temp=$path.'.'.bin2hex(random_bytes(8)).'.tmp';
    try {
        if (@file_put_contents($temp,$json,LOCK_EX)!==strlen($json)||
            !@chmod($temp,0600)||!@rename($temp,$path)) cmsCoralPublishFail($error);
    } finally { if (is_file($temp)) @unlink($temp); }
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
        || !in_array(count($manifest['files']),[5,9,10],true)) cmsCoralPublishFail('MANIFEST');
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
    if (!is_string($recipe)||$recipe==='amok-trey'||!preg_match('/^[a-z0-9][a-z0-9-]{2,99}$/D',$recipe)
        ||!is_string($slug)||!preg_match('/^[a-z0-9][a-z0-9-]{2,99}$/D',$slug))
        cmsCoralPublishFail('SLUG');
    $audioName='audio/workshops/atelier-pratique-'.$slug.'/atelier-coral-'.
        substr($manifest['audioSha256'],0,12).'.mp3';
    $expected=[$audioName,'apprendre/pratique/'.$slug.'/index.html',
        'recettes/'.$recipe.'/index.html','apprendre/index.html','sitemap.xml'];
    if(count($files)>=9)array_push($expected,'social-assets/atelier-'.$slug.'.jpg',
        'social-feed.json','editorial-source-index.json','editorial-guided-fields.json');
    if(count($files)===10){
        $hash=$manifest['mediaImageSha256']??null;
        if(!is_string($hash)||!preg_match('/^[a-f0-9]{64}$/D',$hash)
            ||$files[9]['sha256']!==$hash||$files[9]['bytes']>1048576)
            cmsCoralPublishFail('VISUAL_MANIFEST');
        $expected[]='images/cuisine/coral-'.$manifest['creationId'].'-'.$hash.'.webp';
        if(!array_key_exists($expected[9],$preconditions)||$preconditions[$expected[9]]!==null)
            cmsCoralPublishFail('VISUAL_ALREADY_EXISTS');
    }
    if (array_keys($paths)!==$expected || $files[0]['sha256']!==$manifest['audioSha256'])
        cmsCoralPublishFail('SCOPE');
    if (array_keys($preconditions)!==$expected) cmsCoralPublishFail('PRECONDITION_NAMES');
    foreach ($preconditions as $value) if ($value!==null
        && (!is_string($value)||!preg_match('/^[a-f0-9]{64}$/D',$value)))
        cmsCoralPublishFail('PRECONDITION_HASH');
    return $expected;
}
function cmsCoralPublishVisibilityGate(string $webroot,string $request,bool $recover,bool $privateVisual=false): string {
    $rules=$webroot.'/.htaccess';
    cmsCoralPublishDigest($rules,65536);
    $config=(string)file_get_contents($rules);
    if(!str_contains($config,'# CORAL_PUBLICATION_GATE_V1')
        ||($privateVisual&&(!str_contains($config,'images/cuisine/coral-c-[a-f0-9]{24}-[a-f0-9]{64}[.]webp')
            ||!str_contains($config,'[.]coral-[a-f0-9]{24}[.]pending$ - [R=404,L]'))))

        cmsCoralPublishFail('VISIBILITY_GATE_NOT_INSTALLED');
    $marker=$webroot.'/.coral-publication-in-progress';
    if(is_link($marker))cmsCoralPublishFail('VISIBILITY_GATE');
    if(is_file($marker)){
        if(!$recover||filesize($marker)!==48||file_get_contents($marker)!==$request)
            cmsCoralPublishFail('VISIBILITY_GATE_BUSY');
        return $marker;
    }
    // Atomically install a complete marker before any target can change.
    $temp=$webroot.'/.coral-gate-'.bin2hex(random_bytes(12));
    try{
        if(file_put_contents($temp,$request,LOCK_EX)!==48||!rename($temp,$marker))
            cmsCoralPublishFail('VISIBILITY_GATE');
    }finally{if(is_file($temp))@unlink($temp);}
    return $marker;
}
function cmsCoralPublishOpenVisibility(string $marker): void {
    if(!unlink($marker))cmsCoralPublishFail('VISIBILITY_GATE_RELEASE');
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
        || str_starts_with($realPrivate,rtrim($realWeb,DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR))
        cmsCoralPublishFail('BACKUP_MUST_BE_PRIVATE');
    $realBundle=realpath($bundle);
    if (!$realBundle || !is_dir($bundle) || is_link($bundle)
        || !str_starts_with($realBundle,rtrim($realPrivate,DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR))
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
        cmsCoralPublishJournal($backupDir.'/before-write.json',[
            'contract'=>'cdc-coral-ovh-before-write-v1','requestId'=>$request,
            'creationId'=>$manifest['creationId'],'previous'=>$expectedLive,
            'expected'=>$manifest['files']], 'BACKUP_RECORD');
        // Independent second authorization check under the same publish lock.
        if ($authorize($manifest)!==true) cmsCoralPublishFail('AUTHORITY_CHANGED');
        $gate=count($names)>=9?cmsCoralPublishVisibilityGate($realWeb,$request,false,count($names)===10):null;
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
            'requestId'=>$request,'fileCount'=>count($names),'liveSha256'=>array_map(
                static fn($e)=>$e['sha256'],$manifest['files']),
            'backupDir'=>$backupDir,'httpReceptionVerified'=>false,
            'rollbackTestedOnLiveServer'=>false];
        cmsCoralPublishJournal($backupDir.'/receipt.json',$receipt,'RECEIPT_WRITE');
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
            cmsCoralPublishJournal($backupDir.'/rolled-back.json',[
                'contract'=>'cdc-coral-ovh-rollback-v1','requestId'=>$request,'restored'=>true],
                'ROLLBACK_MARKER');
            if($gate!==null)cmsCoralPublishOpenVisibility($gate);
            throw $error;
        }
        if($gate!==null)cmsCoralPublishOpenVisibility($gate);
        return $receipt;
    } finally {
        flock($lock,LOCK_UN);fclose($lock);
    }
}

/**
 * Explicit crash recovery (never called automatically on ordinary GET).
 * Only a fresh authenticated Studio action may invoke this operation.
 * Restores PREVIOUS exact bytes from an off-webroot backup if, and only if,
 * every current file is still the previous or the intended released SHA.
 * A foreign modification causes a hard stop BEFORE touching any file.
 */
function cmsCoralPublishRecoverInterrupted(
    string $private,string $webroot,string $requestId,callable $authorize,
    ?string $creationId=null
): array {
    if(!preg_match('/^[a-f0-9]{48}$/D',$requestId))
        cmsCoralPublishFail('RECOVERY_ID');
    cmsCoralPublishSecureDir($private,false);
    cmsCoralPublishSecureDir($webroot,false);
    $realPrivate=realpath($private);$realWeb=realpath($webroot);
    if(!$realPrivate||!$realWeb||$realPrivate===$realWeb
        ||str_starts_with($realPrivate,rtrim($realWeb,DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR))
        cmsCoralPublishFail('RECOVERY_ROOT');
    $releases=$realPrivate.'/coral-scoped-releases';
    cmsCoralPublishSecureDir($releases,false);
    $backup=$releases.'/'.$requestId;
    cmsCoralPublishSecureDir($backup,false);
    $lock=@fopen($releases.'/publish.lock','c');
    if(!$lock||!flock($lock,LOCK_EX))cmsCoralPublishFail('RECOVERY_LOCK');
    try{
        if($authorize($requestId)!==true)cmsCoralPublishFail('RECOVERY_AUTH');
        if(is_file($backup.'/receipt.json')&&$creationId===null)
            cmsCoralPublishFail('RECOVERY_COMMITTED');
        $record=$backup.'/before-write.json';
        if(is_link($record)||!is_file($record)||filesize($record)>64000)
            cmsCoralPublishFail('RECOVERY_RECORD');
        $state=json_decode((string)file_get_contents($record),true,24,JSON_THROW_ON_ERROR);
        if(!is_array($state)||($state['contract']??null)!=='cdc-coral-ovh-before-write-v1'
            ||($state['requestId']??null)!==$requestId
            ||!is_array($state['previous']??null)
            ||!is_array($state['expected']??null)
            ||!in_array(count($state['expected']),[5,9,10],true)
            ||($creationId!==null&&($state['creationId']??null)!==$creationId))
            cmsCoralPublishFail('RECOVERY_DATA');
        if(is_file($backup.'/rolled-back.json')||is_file($backup.'/recovered.json')){
            $marker=$realWeb.'/.coral-publication-in-progress';
            if(count($state['expected'])>=9&&is_file($marker)&&!is_link($marker)
                &&filesize($marker)===48&&file_get_contents($marker)===$requestId)
                cmsCoralPublishOpenVisibility($marker);
            return ['requestId'=>$requestId,'restored'=>true,'alreadyRestored'=>true];
        }
        $files=$state['expected'];
        $names=array_column($files,'path');
        if(!in_array(count($names),[5,9,10],true)||!is_string($names[0]??null)
           ||!preg_match('~^audio/workshops/atelier-pratique-([a-z0-9-]+)/atelier-coral-([a-f0-9]{12})\\.mp3$~D',$names[0],$match)
           ||!preg_match('~^recettes/([a-z0-9-]+)/index\\.html$~D',(string)($names[2]??''),$recipeMatch))
            cmsCoralPublishFail('RECOVERY_PATHS');
        $manifest=['contract'=>'cdc-coral-scoped-astro-bundle-v1',
            'requestId'=>$requestId,'creationId'=>$state['creationId']??'c-'.str_repeat('0',24),
            'mediaImageSha256'=>$files[9]['sha256']??null,
            'audioSha256'=>$files[0]['sha256']??null,
            'recipeSlug'=>$recipeMatch[1],'publicSlug'=>$match[1],
            'deployable'=>false,'published'=>false,
            'sourceCommitVerified'=>true,'nativeBlueprintVerified'=>true,'mediaRightsVerified'=>true,
            'files'=>$files];
        // Earlier journals stored {bytes, sha256}; newer journals store the
        // already verified hash directly. In both cases, reread each backup.
        $previous=array_map(static fn($entry)=>is_array($entry)?
            ($entry['sha256']??false):$entry,$state['previous']);
        $names=cmsCoralPublishManifest($manifest,$previous);
        if(substr($manifest['audioSha256'],0,12)!==$match[2])
            cmsCoralPublishFail('RECOVERY_AUDIO');
        $current=[];
        foreach($names as $i=>$name){
            $target=cmsCoralPublishTarget($realWeb,$name);
            $now=is_file($target)?cmsCoralPublishDigest($target,32000000)['sha256']:null;
            $before=$previous[$name];
            if($now!==$before&&$now!==$files[$i]['sha256'])
                cmsCoralPublishFail('RECOVERY_FOREIGN_CHANGE');
            if($before!==null){
                $saved=cmsCoralPublishTarget($backup,$name);
                if(cmsCoralPublishDigest($saved,32000000)['sha256']!==$before)
                    cmsCoralPublishFail('RECOVERY_BACKUP_CHANGED');
            }
            $current[$name]=$now;
        }
        // All validation above has succeeded; each step is idempotent even
        // if PHP is forcibly killed partway through this recovery.
        $gate=count($names)>=9?cmsCoralPublishVisibilityGate($realWeb,$requestId,true,count($names)===10):null;
        foreach(array_reverse($names) as $name){
            if($current[$name]===$previous[$name])continue;
            $target=$realWeb.'/'.$name;
            $before=$previous[$name];
            if($before===null){
                if(!@unlink($target))cmsCoralPublishFail('RECOVERY_UNLINK');
            }else{
                $temp=$target.'.coral-recover-'.bin2hex(random_bytes(8));
                if(!@copy($backup.'/'.$name,$temp)||!@rename($temp,$target))
                    cmsCoralPublishFail('RECOVERY_RENAME');
            }
            if((is_file($target)?cmsCoralPublishDigest($target,32000000)['sha256']:null)
                !==$before)cmsCoralPublishFail('RECOVERY_SHA');
        }
        $result=['contract'=>'cdc-coral-ovh-recovery-v1',
            'requestId'=>$requestId,'restored'=>true,'alreadyRestored'=>false,
            'httpReceptionVerified'=>false];
        cmsCoralPublishJournal($backup.'/recovered.json',$result,'RECOVERY_MARKER');
        if($gate!==null)cmsCoralPublishOpenVisibility($gate);
        return $result;
    }finally{flock($lock,LOCK_UN);fclose($lock);}
}
