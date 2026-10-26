<?php
declare(strict_types=1);
/**
 * Editorial CMS P0: private, append-only proposals.
 * NEVER changes Astro sources, GitHub, Supabase, Meta or n8n.
 */
function cmsEsc(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function cmsId(mixed $v): ?string {
    if (!is_string($v) || strlen($v)>115
        || !preg_match('/^(recette|culture|atelier|ingredient|technique):[a-z0-9][a-z0-9-]{0,100}$/D',$v))
        return null;
    return $v;
}
function cmsSourceList(array $feed): array {
    if (($feed['product']??null)!=='cuisine-du-cambodge' || ($feed['schemaVersion']??null)!==1
        || !is_array($feed['items']??null) || count($feed['items'])>250)
        throw new UnexpectedValueException('CATALOG_INVALID');
    $out=[];
    foreach ($feed['items'] as $i) {
        if (!is_array($i)) throw new UnexpectedValueException('CATALOG_ITEM');
        $id=cmsId($i['id']??null);
        if (!$id || isset($out[$id]) || !is_string($i['title']??null)
            || mbLen($i['title'])>180 || trim($i['title'])===''
            || !is_string($i['summary']??null) || mbLen($i['summary'])>2000
            || !is_string($i['fingerprint']??null)
            || !preg_match('/^[0-9a-f]{16}$/D',$i['fingerprint'])
            || !is_string($i['url']??null))throw new UnexpectedValueException('CATALOG_ITEM');
        $url=parse_url($i['url']);
        if (!is_array($url) || ($url['scheme']??null)!=='https'
            || ($url['host']??null)!=='www.cuisine-du-cambodge.com'
            || isset($url['user'],$url['pass']) || isset($url['port'])
            || isset($url['query']) || isset($url['fragment'])
            || !preg_match('~^/(recettes|culture|apprendre|ingredients|techniques)/[a-z0-9/-]+/?$~D', $url['path']??''))
            throw new UnexpectedValueException('CATALOG_URL');
        $kind=explode(':',$id,2)[0];
        if (($i['kind']??null)!==$kind)throw new UnexpectedValueException('CATALOG_KIND');
        $photo=$i['imageUrl']??null;
        if (!is_string($photo) || !preg_match('~^https://www[.]cuisine-du-cambodge[.]com/social-assets/[a-z0-9-]+[.]jpg$~D',$photo))
            $photo=null;
        // No external references or hidden editorial sources are mirrored into draft files.
        $out[$id]=[
            'id'=>$id,'kind'=>$kind,'title'=>$i['title'],'summary'=>$i['summary'],
            'fingerprint'=>$i['fingerprint'],'url'=>$i['url'],'image_url'=>$photo
        ];
    }
    ksort($out,SORT_STRING);
    return $out;
}
function mbLen(string $s): int {
    return function_exists('mb_strlen') ? mb_strlen($s,'UTF-8') : strlen($s);
}
function cmsGetFeed(): ?array {
    if (!function_exists('curl_init')) return null;
    $c=curl_init('https://www.cuisine-du-cambodge.com/social-feed.json');
    if ($c===false) return null;
    $raw='';
    curl_setopt_array($c,[
        CURLOPT_HTTPGET=>true, CURLOPT_FOLLOWLOCATION=>false,
        CURLOPT_SSL_VERIFYPEER=>true, CURLOPT_SSL_VERIFYHOST=>2,
        CURLOPT_CONNECTTIMEOUT=>3, CURLOPT_TIMEOUT=>7,
        CURLOPT_HTTPHEADER=>['Accept: application/json'],
        CURLOPT_WRITEFUNCTION=>static function($ch,string $chunk)use(&$raw):int {
            if(strlen($raw)+strlen($chunk)>524288)return 0;
            $raw.=$chunk;return strlen($chunk);
        }
    ]);
    if (defined('CURLOPT_PROTOCOLS_STR'))curl_setopt($c,constant('CURLOPT_PROTOCOLS_STR'),'https');
    elseif(defined('CURLOPT_PROTOCOLS'))curl_setopt($c,CURLOPT_PROTOCOLS,CURLPROTO_HTTPS);
    $ok=curl_exec($c);$status=(int)curl_getinfo($c,CURLINFO_RESPONSE_CODE);curl_close($c);
    if($ok!==true || $status!==200 || $raw==='')return null;
    try {
        $data=json_decode($raw,true,64,JSON_THROW_ON_ERROR);
        return is_array($data)?$data:null;
    } catch(JsonException $e) { return null; }
}
function cmsDraftDir(string $private): string {
    if (!is_dir($private) || is_link($private)) throw new RuntimeException('STORE_INACCESSIBLE');
    $dir=$private.'/editorial-drafts';
    if (!is_dir($dir) && !@mkdir($dir,0700)) throw new RuntimeException('STORE_INACCESSIBLE');
    if (is_link($dir) || !is_dir($dir) || !is_writable($dir)
        || (fileperms($dir)&0077)!==0) throw new RuntimeException('STORE_INSECURE');
    return $dir;
}
function cmsKey(string $id): string {
    if (!cmsId($id)) throw new InvalidArgumentException('ID');
    return hash('sha256',$id);
}
function cmsReadVersion(string $dir,string $id,int $version): ?array {
    if ($version<1 || $version>9999 || !is_dir($dir) || is_link($dir))return null;
    $path=$dir.'/'.cmsKey($id).'.'.sprintf('%04d',$version).'.json';
    if (!is_file($path) || is_link($path) || filesize($path)>30000)throw new RuntimeException('VERSION_INVALID');
    $raw=@file_get_contents($path);
    if (!is_string($raw))throw new RuntimeException('VERSION_INVALID');
    try { $v=json_decode($raw,true,32,JSON_THROW_ON_ERROR); }
    catch(JsonException $e){throw new RuntimeException('VERSION_INVALID');}
    if (!is_array($v) || ($v['source_id']??null)!==$id || ($v['version']??null)!==$version
        || !is_string($v['source_fingerprint']??null))throw new RuntimeException('VERSION_INVALID');
    return $v;
}
function cmsVersions(string $dir,string $id): array {
    if (!is_dir($dir) || is_link($dir))return [];
    $key=cmsKey($id);
    $files=glob($dir.'/'.$key.'.*.json');
    if ($files===false || count($files)>9999)throw new RuntimeException('VERSIONS_UNAVAILABLE');
    $versions=[];
    foreach ($files as $f) {
        if (is_link($f) || !is_file($f))throw new RuntimeException('VERSIONS_UNSAFE');
        if (!preg_match('/^'.preg_quote($key,'/').'\.([0-9]{4})\.json$/D',basename($f),$m))
            throw new RuntimeException('VERSIONS_UNSAFE');
        $v=(int)$m[1];
        if ($v<1 || $v>9999)throw new RuntimeException('VERSIONS_UNSAFE');
        $versions[]=$v;
    }
    rsort($versions,SORT_NUMERIC);
    if(count($versions)>1) {
        for($i=1;$i<count($versions);$i++)if($versions[$i]!==$versions[$i-1]-1)
            throw new RuntimeException('VERSIONS_GAP');
    }
    if($versions && min($versions)!==1)throw new RuntimeException('VERSIONS_GAP');
    return $versions;
}
function cmsCleanFields(array $input): array {
    $limits=['title'=>180,'summary'=>1500,'editorial_text'=>12000,'editor_note'=>2000];
    $out=[];
    foreach($limits as $key=>$max){
        $value=$input[$key]??null;
        if(!is_string($value) || strlen($value)>$max*4 || !preg_match('//u',$value)
            || str_contains($value,"\0"))throw new InvalidArgumentException('FIELD_INVALID');
        $value=trim(str_replace(["\r\n","\r"],"\n",$value));
        if(mbLen($value)>$max || ($key==='title' && $value===''))
            throw new InvalidArgumentException('FIELD_LIMIT');
        $out[$key]=$value;
    }
    $state=$input['state']??null;
    if(!in_array($state,['draft','review'],true))throw new InvalidArgumentException('STATE');
    $out['state']=$state;
    return $out;
}
/**
 * Locked optimistic, append-only local revision. No publication side effects.
 * Source fingerprint must match the snapshot the operator started from.
 */
function cmsSave(string $private,array $source,array $fields,int $expected,string $fingerprint): array {
    $id=$source['id']??null;
    if (!cmsId($id) || !preg_match('/^[a-f0-9]{16}$/D',$fingerprint)
        || !hash_equals($source['fingerprint']??'', $fingerprint)
        || $expected<0 || $expected>=9999)throw new RuntimeException('CONFLICT');
    $fields=cmsCleanFields($fields);
    $dir=cmsDraftDir($private);
    $key=cmsKey($id);
    $lockFile=$dir.'/'.$key.'.lock';
    if (is_link($lockFile))throw new RuntimeException('LOCK_UNSAFE');
    $handle=@fopen($lockFile,'c');
    if (!$handle || !flock($handle,LOCK_EX))throw new RuntimeException('LOCK_FAILED');
    try {
        @chmod($lockFile,0600);
        if (is_link($lockFile))throw new RuntimeException('LOCK_UNSAFE');
        $versions=cmsVersions($dir,$id);
        $head=$versions[0]??0;
        if ($head!==$expected)throw new RuntimeException('CONFLICT');
        $prev=$head ? cmsReadVersion($dir,$id,$head):null;
        if ($prev && !hash_equals($prev['source_fingerprint'],$source['fingerprint']))
            throw new RuntimeException('SOURCE_CHANGED');
        $version=$head+1;
        $v=array_merge($fields,[
            'schema_version'=>1,
            'source_id'=>$id,
            'source_url'=>$source['url'],
            'source_fingerprint'=>$source['fingerprint'],
            'version'=>$version,
            'recorded_at'=>gmdate('Y-m-d\TH:i:s\Z'),
        ]);
        $json=json_encode($v,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
        if (!is_string($json) || strlen($json)>25000)throw new RuntimeException('VERSION_TOO_LARGE');
        $tmp=tempnam($dir,$key.'.tmp-');
        if ($tmp===false)throw new RuntimeException('WRITE_FAILED');
        try {
            if (is_link($tmp) || !@chmod($tmp,0600))throw new RuntimeException('WRITE_FAILED');
            $f=@fopen($tmp,'wb');
            if (!$f)throw new RuntimeException('WRITE_FAILED');
            $w=fwrite($f,$json);$flushed=fflush($f);$closed=fclose($f);
            if($w!==strlen($json) || !$flushed || !$closed)throw new RuntimeException('WRITE_FAILED');
            $target=$dir.'/'.$key.'.'.sprintf('%04d',$version).'.json';
            if(file_exists($target) || is_link($target) || !rename($tmp,$target))
                throw new RuntimeException('CONFLICT');
            return $v;
        } finally { if(is_file($tmp))@unlink($tmp); }
    } finally { flock($handle,LOCK_UN);fclose($handle); }
}
