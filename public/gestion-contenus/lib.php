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
            || isset($url['user']) || isset($url['pass']) || isset($url['port'])
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

/**
 * Read-only full-content revision index. Contains hashes ONLY, never prose
 * or internal source references; independent from n8n's social fingerprint.
 */
function cmsCanonicalSourceList(array $index,array $catalog): array {
    if(($index['product']??null)!=='cuisine-du-cambodge'
        || ($index['schemaVersion']??null)!==1
        || ($index['digest']??null)!=='sha256-full-astro-record-v1'
        || !is_array($index['items']??null) || count($index['items'])>250
        || count($index['items'])!==count($catalog))
        throw new UnexpectedValueException('CANONICAL_INDEX');
    $models=['recette'=>['recipes','restoredRecipes'],
        'culture'=>['culture'],'atelier'=>['workshops','cookingWorkshopGuides'],
        'ingredient'=>['ingredients'],'technique'=>['recipeTechniques']];
    $out=[];
    foreach($index['items'] as $item){
        if(!is_array($item) || count($item)!==4)throw new UnexpectedValueException('CANONICAL_ITEM');
        $id=cmsId($item['id']??null);
        $kind=$item['kind']??null;
        $model=$item['model']??null;
        $fingerprint=$item['fingerprint']??null;
        if(!$id || !isset($catalog[$id]) || isset($out[$id])
            || !is_string($kind) || $catalog[$id]['kind']!==$kind
            || !is_string($model) || !in_array($model,$models[$kind]??[],true)
            || !is_string($fingerprint) || !preg_match('/^[a-f0-9]{64}$/D',$fingerprint))
            throw new UnexpectedValueException('CANONICAL_ITEM');
        $out[$id]=['id'=>$id,'kind'=>$kind,'model'=>$model,'fingerprint'=>$fingerprint];
    }
    if(count($out)!==count($catalog))throw new UnexpectedValueException('CANONICAL_MISSING');
    return $out;
}

function mbLen(string $s): int {
    return function_exists('mb_strlen') ? mb_strlen($s,'UTF-8') : strlen($s);
}
function cmsFetchPublicIndex(string $name): ?array {
    if(!in_array($name,['social-feed.json','editorial-source-index.json'],true))return null;
    if (!function_exists('curl_init')) return null;
    $c=curl_init('https://www.cuisine-du-cambodge.com/'.$name);
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
function cmsGetFeed(): ?array { return cmsFetchPublicIndex('social-feed.json'); }
function cmsGetEditorialIndex(): ?array { return cmsFetchPublicIndex('editorial-source-index.json'); }

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

/**
 * P0B: validate typed edit *proposals* against current Astro data shapes.
 * A patch is intentionally partial, never an authoritative replacement.
 * In particular it never edits MP3, media paths, slugs or source references.
 */
function cmsPatchText(mixed $value,int $max=2000): string {
    if (!is_string($value) || trim($value)==='' || strlen($value)>$max*4
        || !preg_match('//u',$value) || str_contains($value,"\0")
        || mbLen($value)>$max) throw new InvalidArgumentException('STRUCTURE_TEXT');
    return trim($value);
}
function cmsPatchRows(mixed $rows,array $required,array $optional=[],int $maxRows=40): array {
    if(!is_array($rows) || !array_is_list($rows) || count($rows)<1
        || count($rows)>$maxRows)throw new InvalidArgumentException('STRUCTURE_ROWS');
    $out=[];
    foreach($rows as $row){
        if(!is_array($row) || array_is_list($row) || count($row)>count($required)+count($optional)
            || array_diff(array_keys($row),array_merge($required,$optional))
            || array_diff($required,array_keys($row)))
            throw new InvalidArgumentException('STRUCTURE_ROW');
        $clean=[];
        foreach($row as $key=>$value){
            if($key==='minutes'){
                if(!is_int($value) || $value<0 || $value>240)throw new InvalidArgumentException('STRUCTURE_MINUTES');
                $clean[$key]=$value;
            }elseif($key==='actions' || $key==='paragraphs'){
                $clean[$key]=cmsPatchTextList($value,18,3000);
            }else{
                $clean[$key]=cmsPatchText($value,$key==='audioScript'?9000:3000);
            }
        }
        $out[]=$clean;
    }
    return $out;
}
function cmsPatchTextList(mixed $list,int $maxItems=40,int $maxText=2000): array {
    if(!is_array($list) || !array_is_list($list) || count($list)<1
        || count($list)>$maxItems)throw new InvalidArgumentException('STRUCTURE_LIST');
    return array_map(static fn(mixed $v):string=>cmsPatchText($v,$maxText),$list);
}
function cmsValidateStructuredDraft(string $kind,mixed $raw): ?array {
    if($raw===null || $raw==='')return null;
    if(!is_string($raw) || strlen($raw)>20000 || !preg_match('//u',$raw))
        throw new InvalidArgumentException('STRUCTURE_SIZE');
    try{$patch=json_decode($raw,true,24,JSON_THROW_ON_ERROR);}
    catch(JsonException $e){throw new InvalidArgumentException('STRUCTURE_JSON');}
    if(!is_array($patch) || array_is_list($patch) || ($patch['schema_version']??null)!==1)
        throw new InvalidArgumentException('STRUCTURE_SCHEMA');
    $schemas=[
        'recette'=>['ingredients','steps','baseServings','prepTime','cookTime'],
        'culture'=>['sections'],
        'atelier'=>['steps','phases','prepare','outcomes'],
        'ingredient'=>['deepDive','uses','tips'],
        'technique'=>['supplies','steps','alternatives']
    ];
    if(!isset($schemas[$kind]) || count($patch)<2
       || array_diff(array_keys($patch),array_merge(['schema_version'],$schemas[$kind])))
        throw new InvalidArgumentException('STRUCTURE_FIELDS');
    $clean=['schema_version'=>1];
    foreach($patch as $key=>$value){
        if($key==='schema_version')continue;
        if($key==='baseServings'){
            if(!is_int($value) || $value<1 || $value>100)throw new InvalidArgumentException('STRUCTURE_SERVINGS');
            $clean[$key]=$value;
        }elseif(in_array($key,['prepTime','cookTime'],true)){
            $clean[$key]=cmsPatchText($value,100);
        }elseif($key==='ingredients'){
            if(!is_array($value) || !array_is_list($value) || count($value)<1
                || count($value)>60)throw new InvalidArgumentException('STRUCTURE_INGREDIENTS');
            $rows=[];
            $format=null;
            foreach($value as $one){
                $current=is_string($one)?'restored':(is_array($one)?'detailed':'invalid');
                if($format!==null && $format!==$current)throw new InvalidArgumentException('STRUCTURE_INGREDIENT_FORMAT');
                $format=$current;
                if($current==='restored'){$rows[]=cmsPatchText($one,450);continue;}
                if($current!=='detailed' || array_is_list($one) || !isset($one['name'])
                    || array_diff(array_keys($one),['name','quantity','unit','note','group','scalable']))
                    throw new InvalidArgumentException('STRUCTURE_INGREDIENT_ROW');
                $item=['name'=>cmsPatchText($one['name'],200)];
                foreach(['unit','note','group'] as $field){
                    if(array_key_exists($field,$one))$item[$field]=cmsPatchText($one[$field],170);
                }
                if(array_key_exists('quantity',$one)){
                    $quantity=$one['quantity'];
                    if(!is_int($quantity) && !is_float($quantity))throw new InvalidArgumentException('STRUCTURE_QUANTITY');
                    if(!is_finite((float)$quantity) || $quantity<=0 || $quantity>100000)throw new InvalidArgumentException('STRUCTURE_QUANTITY');
                    $item['quantity']=$quantity;
                }
                if(array_key_exists('scalable',$one)){
                    if(!is_bool($one['scalable']))throw new InvalidArgumentException('STRUCTURE_SCALABLE');
                    $item['scalable']=$one['scalable'];
                }
                $rows[]=$item;
            }
            $clean[$key]=$rows;
        }elseif($key==='sections'){
            $clean[$key]=cmsPatchRows($value,['title','paragraphs'],[],25);
        }elseif($key==='steps'){
            $clean[$key]=$kind==='atelier'
                ?cmsPatchRows($value,['title','action','observe','cue','success'],['mistake'],40)
                :cmsPatchRows($value,['title','text'],
                    $kind==='recette'?['duration','cue','mistake']:[],50);
        }elseif($key==='phases'){
            // Approved audio assets are NEVER overwritten by a script proposal.
            $clean[$key]=cmsPatchRows($value,['id','title','minutes','actions','observe','check','learning','audioScript'],
                ['mistake','recovery','pausePrompt','safety'],10);
            $ids=array_column($clean[$key],'id');
            if(count($ids)!==count(array_unique($ids))
                || count(array_filter($ids,static fn(string $id):bool=>
                    (bool)preg_match('/^[a-z][a-z0-9-]{0,60}$/D',$id)))!==count($ids))
                throw new InvalidArgumentException('STRUCTURE_PHASE_IDS');
        }elseif($key==='alternatives'){
            $clean[$key]=cmsPatchRows($value,['title','text'],[],30);
        }else{
            $clean[$key]=cmsPatchTextList($value);
        }
    }
    return $clean;
}

function cmsCleanFields(array $input,string $kind): array {
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
    $out['structure']=cmsValidateStructuredDraft($kind,$input['structure_json']??'');
    return $out;
}
/**
 * Locked optimistic, append-only local revision. No publication side effects.
 * Source fingerprint must match the snapshot the operator started from.
 */
function cmsSave(string $private,array $source,array $fields,int $expected,string $fingerprint,?array $canonical=null,?string $expectedCanonical=null): array {
    $id=$source['id']??null;
    if (!cmsId($id) || !preg_match('/^[a-f0-9]{16}$/D',$fingerprint)
        || !hash_equals($source['fingerprint']??'', $fingerprint)
        || $expected<0 || $expected>=9999)throw new RuntimeException('CONFLICT');
    $fields=cmsCleanFields($fields,(string)($source['kind']??''));
    if(is_array($fields['structure'])){
        if(!is_array($canonical) || ($canonical['id']??null)!==$id
            || ($canonical['kind']??null)!==($source['kind']??null)
            || !is_string($canonical['fingerprint']??null)
            || !preg_match('/^[a-f0-9]{64}$/D',$canonical['fingerprint'])
            || !is_string($expectedCanonical)
            || !hash_equals($canonical['fingerprint'],$expectedCanonical))
            throw new RuntimeException('CANONICAL_STALE_OR_MISSING');
        $fields['canonical_fingerprint']=$canonical['fingerprint'];
        $fields['canonical_model']=$canonical['model'];
    }

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
        if($prev && is_array($prev['structure']??null)){
            if(!is_array($fields['structure']))throw new RuntimeException('STRUCTURE_DROP_BLOCKED');
            if(!is_string($prev['canonical_fingerprint']??null)
                || !hash_equals($prev['canonical_fingerprint'],$fields['canonical_fingerprint']))
                throw new RuntimeException('CANONICAL_CHANGED_OR_LEGACY');
        }

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
