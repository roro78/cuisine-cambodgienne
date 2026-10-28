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
    if(!in_array($name,['social-feed.json','editorial-source-index.json','editorial-guided-fields.json'],true))return null;
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
/**
 * Approved public subset. The matching full-record fingerprint is mandatory;
 * mismatching/partial deployments fail closed for guided forms.
 */

/** Verified public editor manifest; all proposed fields already appear on public pages. */
function cmsGuidedSourceList(array $payload,array $canonical): array {
    if(($payload['product']??null)!=='cuisine-du-cambodge'
       || ($payload['schemaVersion']??null)!==1
       || ($payload['dataContract']??null)!=='approved-public-form-fields-v2'
       || !is_array($payload['items']??null)
       || !array_is_list($payload['items']) || count($payload['items'])>250)
        throw new UnexpectedValueException('GUIDED_FEED');
    $models=[
        'recette'=>['recipes','restoredRecipes'],
        'atelier'=>['workshops','cookingWorkshopGuides'],
        'culture'=>['culture'],'ingredient'=>['ingredients'],
        'technique'=>['recipeTechniques']
    ];
    $allowed=[
        'recipes'=>['intro','description','context','beforeYouStart','prepHeading',
            'servingTip','servingHeading','servingsLabel','moment','location','keyPoints',
            'notes','substitutions','equipment','faqs','baseServings','prepTime',
            'cookTime','ingredients','steps'],
        'restoredRecipes'=>['kicker','description','intro','servings','imageCaption',
            'tips','prepTime','cookTime','ingredients','steps'],
        'culture'=>['eyebrow','intro','seoDescription','readingTime','sections'],
        'ingredients'=>['intro','seoDescription','role','deepDive','profile','uses',
            'tips','choose','keep','pairings','mistakes','seoKeywords'],
        'recipeTechniques'=>['description','introduction','preparation','yieldLabel',
            'supplies','steps','alternatives','questions'],
        'workshops'=>['steps'],
        'cookingWorkshopGuides'=>['finalPreparation','learningGoal','portionLabel',
            'beforeStarting','equipment','phases']
    ];
    $items=[];
    foreach($payload['items'] as $item){
        if(!is_array($item) || !cmsId($item['id']??null)
           || isset($items[$item['id']]) || !isset($canonical[$item['id']])
           || ($item['editable']??null)!==true
           || !is_string($item['model']??null)
           || !is_string($item['fingerprint']??null)
           || !is_array($item['fields']??null)
           || !hash_equals($canonical[$item['id']]['fingerprint'],$item['fingerprint'])
           || $canonical[$item['id']]['model']!==$item['model'])
            throw new UnexpectedValueException('GUIDED_SOURCE');
        $kind=explode(':',$item['id'],2)[0];
        if(!in_array($item['model'],$models[$kind]??[],true))
            throw new UnexpectedValueException('GUIDED_TYPE');
        $fields=$item['fields'];
        if(!count($fields) || array_diff(array_keys($fields),$allowed[$item['model']]??[]))
            throw new UnexpectedValueException('GUIDED_FIELDS');
        try{
            cmsValidateStructuredDraft($kind,json_encode(
                ['schema_version'=>1]+$fields,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR));
        }catch(Throwable $e){throw new UnexpectedValueException('GUIDED_FIELDS');}
        $items[$item['id']]=$item;
    }
    return $items;
}
/**
 * Lock the global Studio template for every catalogued page, present and future.
 * A newly registered content without a typed guided projection is a broken
 * deployment, not permission to silently serve a second, JSON-only interface.
 * This is checked in CI and again when the authenticated editor loads.
 */
function cmsAssertGuidedCoverage(array $guided,array $canonical): void {
    if(count($guided)!==count($canonical)
       || array_diff(array_keys($canonical),array_keys($guided))
       || array_diff(array_keys($guided),array_keys($canonical)))
        throw new UnexpectedValueException('GUIDED_COVERAGE_INCOMPLETE');
}
function cmsGetGuidedFields(): ?array {
    return cmsFetchPublicIndex('editorial-guided-fields.json');
}
/** Recursive exactly-shaped proposal; metadata id and scalable stay immutable. */
function cmsGuidedConvert(mixed $original,mixed $received,string $key='',int $depth=0): mixed {
    if($depth>7)throw new InvalidArgumentException('STRUCTURE_GUIDED_DEPTH');
    if(is_string($original))return cmsPatchText($received,9000);
    if(is_int($original) || is_float($original)){
        if(!is_string($received) || !preg_match('/^[0-9]{1,6}(?:[,.][0-9]{1,3})?$/D',trim($received)))
            throw new InvalidArgumentException('STRUCTURE_GUIDED_NUMBER');
        $n=(float)str_replace(',','.',trim($received));
        if($n<=0 || $n>100000 || ($key==='baseServings' && ($n>100 || floor($n)!==$n)))
            throw new InvalidArgumentException('STRUCTURE_GUIDED_NUMBER');
        return floor($n)===$n?(int)$n:$n;
    }
    if(is_bool($original))return $original;
    if(!is_array($original) || !is_array($received))
        throw new InvalidArgumentException('STRUCTURE_GUIDED_SHAPE');
    if(array_is_list($original)){
        if(!array_is_list($received) || count($original)!==count($received))
            throw new InvalidArgumentException('STRUCTURE_GUIDED_ROWS');
        $out=[];
        foreach($original as $i=>$row)$out[]=cmsGuidedConvert($row,$received[$i],$key,$depth+1);
        return $out;
    }
    $editable=array_values(array_filter(array_keys($original),
        static fn(string $name):bool=>!in_array($name,['id','scalable'],true)));
    // PHP's JSON validator canonicalizes associative key order.
    // A saved revision must remain editable, but added/missing keys are rejected.
    if(count($received)!==count($editable)
       || array_diff(array_keys($received),$editable)
       || array_diff($editable,array_keys($received)))
        throw new InvalidArgumentException('STRUCTURE_GUIDED_KEYS');
    $row=$original;
    foreach($editable as $name)
        $row[$name]=cmsGuidedConvert($original[$name],$received[$name],$name,$depth+1);
    return $row;
}
function cmsBuildGuidedPatch(array $entry,mixed $post): string {
    if(($entry['editable']??false)!==true || !is_array($post)
       || !isset($entry['fields']) || !is_array($entry['fields']))
        throw new InvalidArgumentException('STRUCTURE_GUIDED');
    $encoded=json_encode($post,JSON_THROW_ON_ERROR);
    if(strlen($encoded)>90000)throw new InvalidArgumentException('STRUCTURE_GUIDED_SIZE');
    $original=$entry['fields'];
    if(count($post)!==count($original)
       || array_diff(array_keys($post),array_keys($original))
       || array_diff(array_keys($original),array_keys($post)))
        throw new InvalidArgumentException('STRUCTURE_GUIDED_KEYS');
    $patch=['schema_version'=>1];
    foreach($original as $key=>$value)
        $patch[$key]=cmsGuidedConvert($value,$post[$key],$key);
    $json=json_encode($patch,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
    cmsValidateStructuredDraft(explode(':',$entry['id'],2)[0],$json);
    return $json;
}

function cmsGuidedLabel(string $name): string {
    $labels=[
       'intro'=>'Introduction','description'=>'Description','context'=>'Contexte',
       'eyebrow'=>'Rubrique','seoDescription'=>'Description SEO','readingTime'=>'Temps de lecture',
       'role'=>'Rôle culinaire','deepDive'=>'Pour approfondir','profile'=>'Profil aromatique',
       'uses'=>'Utilisations','tips'=>'Conseils','choose'=>'Bien choisir','keep'=>'Conservation',
       'pairings'=>'Accords','mistakes'=>'Erreurs à éviter','seoKeywords'=>'Mots-clés SEO',
       'sections'=>'Sections du Carnet','paragraphs'=>'Paragraphes','steps'=>'Étapes',
       'ingredients'=>'Ingrédients','baseServings'=>'Nombre de portions',
       'prepTime'=>'Durée de préparation','cookTime'=>'Durée de cuisson',
       'name'=>'Nom','unit'=>'Unité','quantity'=>'Quantité','title'=>'Titre',
       'text'=>'Texte','duration'=>'Durée','cue'=>'Repère','mistake'=>'Erreur à éviter',
       'scalable'=>'Quantité ajustable (protégée)','group'=>'Groupe','note'=>'Note',
       'beforeYouStart'=>'Avant de commencer','prepHeading'=>'Titre préparation',
       'servingTip'=>'Conseil de service','servingHeading'=>'Titre service',
       'servingsLabel'=>'Libellé des portions','servings'=>'Portions',
       'moment'=>'Moment','location'=>'Région','keyPoints'=>'Points clés',
       'notes'=>'Notes','substitutions'=>'Substitutions','equipment'=>'Matériel',
       'faqs'=>'Questions fréquentes','question'=>'Question','answer'=>'Réponse',
       'kicker'=>'Surtitre','imageCaption'=>'Légende photo','supplies'=>'Fournitures',
       'alternatives'=>'Alternatives','questions'=>'Questions fréquentes',
       'preparation'=>'Préparation','introduction'=>'Introduction',
       'yieldLabel'=>'Rendement','finalPreparation'=>'Résultat final',
       'learningGoal'=>'Objectif pédagogique','portionLabel'=>'Libellé des portions',
       'beforeStarting'=>'Préparation initiale','phases'=>'Chapitres de l’atelier',
       'id'=>'Identifiant protégé','learning'=>'À retenir','action'=>'Action',
       'observe'=>'Observation','success'=>'Résultat attendu'
    ];
    return $labels[$name]??ucfirst($name);
}
/** HTML escaping on every field and name; no script needed on Android. */
/** A useful short excerpt in each collapsed mobile section, including string lists. */
function cmsGuidedRowTitle(mixed $row,int $index,string $key): string {
    $candidate=is_string($row)?$row:null;
    if(is_array($row)){
        foreach(['title','name','question','action','text','learning'] as $field){
            if(is_string($row[$field]??null) && trim($row[$field])!==''){
                $candidate=$row[$field];break;
            }
        }
    }
    if(is_string($candidate) && trim($candidate)!==''){
        $candidate=trim(preg_replace('/\\s+/u',' ',$candidate)??$candidate);
        if(mbLen($candidate)>82){
            $candidate=(function_exists('mb_substr')
                ?mb_substr($candidate,0,79,'UTF-8'):substr($candidate,0,79)).'…';
        }
        return $candidate;
    }
    return cmsGuidedLabel($key).' '.($index+1);
}
function cmsGuidedHtml(string $name,mixed $value,string $key,int $depth=0): string {
    if($depth>7)throw new UnexpectedValueException('GUIDED_DEPTH');
    $title=cmsEsc(cmsGuidedLabel($key));
    $safeName=cmsEsc($name);
    if(is_string($value)){
        $safe=cmsEsc($value);
        $limit=9000;
        // Only truly short metadata belongs in a one-line field. Long prose
        // was clipped on Android, even when the original text was under 135 chars.
        $compact=in_array($key,['unit','prepTime','cookTime','readingTime',
            'quantity','name','group','location','moment','servings',
            'servingsLabel','portionLabel','yieldLabel'],true)
            && mbLen($value)<=48 && !str_contains($value,"\\n");
        if($compact)
            return '<label>'.$title.'<input name="'.$safeName.'" required maxlength="'.$limit
                .'" value="'.$safe.'"></label>';
        $rows=mbLen($value)>220?4:2;
        return '<label class="guided-text">'.$title.'<textarea name="'.$safeName
            .'" required maxlength="'.$limit.'" rows="'.$rows.'">'.$safe.'</textarea></label>';
    }
    if(is_int($value) || is_float($value)){
        return '<label>'.$title.'<input name="'.$safeName.'" required inputmode="decimal"'
          .' value="'.cmsEsc((string)$value).'"></label>';
    }
    if(is_bool($value))return '<p class="small muted">'.$title.': '.($value?'Oui':'Non')
        .' — paramètre protégé</p>';
    if(!is_array($value))throw new UnexpectedValueException('GUIDED_VALUE');
    $html='';
    if(array_is_list($value)){
        $html='<div class="guided-collection"><h3>'.$title.' ('.count($value).')</h3>';
        foreach($value as $i=>$row){
            $suffix='['.(int)$i.']';
            $rowTitle=cmsEsc(cmsGuidedRowTitle($row,(int)$i,$key));
            $html.='<details class="guided-group"><summary>'.$rowTitle.'</summary><div class="stack">'
                .cmsGuidedHtml($name.$suffix,$row,$key,$depth+1).'</div></details>';
        }
        return $html.'</div>';
    }
    $html='<div class="stack guided-row-fields">';
    foreach($value as $child=>$one){
        if(in_array($child,['id','scalable'],true)){
            $html.='<p class="small muted">'.cmsEsc(cmsGuidedLabel((string)$child)).': '
                .cmsEsc(is_bool($one)?($one?'Oui':'Non'):(string)$one).' — protégé</p>';
            continue;
        }
        $html.=cmsGuidedHtml($name.'['.$child.']',$one,(string)$child,$depth+1);
    }
    return $html.'</div>';
}
/** Accessible, HTML-escaped human review of draft fields. Never raw JSON by default. */
function cmsGuidedPreviewHtml(string $key,mixed $value,int $depth=0): string {
    if($depth>8)throw new UnexpectedValueException('PREVIEW_DEPTH');
    if(is_string($value) || is_int($value) || is_float($value))
        return '<p class="preview-text">'.cmsEsc((string)$value).'</p>';
    if(is_bool($value))return '<p>'.($value?'Oui':'Non').'</p>';
    if(!is_array($value))return '';
    if(array_is_list($value)){
        $html='<ol class="preview-list">';
        foreach($value as $row){
            $html.='<li>';
            if(is_array($row) && is_string($row['title']??null))
                $html.='<strong>'.cmsEsc($row['title']).'</strong>';
            $html.=cmsGuidedPreviewHtml(is_array($row)?'row':$key,$row,$depth+1).'</li>';
        }
        return $html.'</ol>';
    }
    $html='<div class="preview-fields">';
    foreach($value as $field=>$v){
        if(in_array($field,['schema_version','id','scalable'],true))continue;
        if($field==='title' && $key==='row')continue;
        $html.='<div class="preview-entry"><h4>'.cmsEsc(cmsGuidedLabel((string)$field)).'</h4>'
            .cmsGuidedPreviewHtml(is_array($v)&&array_is_list($v)?(string)$field:'row',
                $v,$depth+1).'</div>';
    }
    return $html.'</div>';
}

/** Deterministic GET filters; no JavaScript dependency. */
function cmsSearchText(string $text): string {
    $text=trim(function_exists('mb_strtolower') ? mb_strtolower($text,'UTF-8') : strtolower($text));
    if(function_exists('transliterator_transliterate')){
        $fold=transliterator_transliterate('NFD; [:Nonspacing Mark:] Remove; NFC',$text);
        if(is_string($fold))return $fold;
    }
    if(function_exists('iconv')){
        $fold=iconv('UTF-8','ASCII//TRANSLIT//IGNORE',$text);
        if(is_string($fold))return strtolower($fold);
    }
    return $text;
}
function cmsFilterCatalog(array $catalog,array $latestById,string $kind,string $q,string $status): array {
    if(!in_array($kind,['all','recette','culture','atelier','ingredient','technique'],true))$kind='all';
    if(!in_array($status,['all','without','draft','review','stale'],true))$status='all';
    $needle=cmsSearchText($q);
    $shown=[];
    foreach($catalog as $src){
        if($kind!=='all' && $src['kind']!==$kind)continue;
        $draft=$latestById[$src['id']]??null;
        $stale=is_array($draft) && is_string($draft['source_fingerprint']??null)
            && !hash_equals($src['fingerprint'],$draft['source_fingerprint']);
        if($status==='without' && $draft!==null)continue;
        if($status==='draft' && ($draft['state']??null)!=='draft')continue;
        if($status==='review' && ($draft['state']??null)!=='review')continue;
        if($status==='stale' && !$stale)continue;
        $hay=cmsSearchText($src['title'].' '.$src['id'].' '.$src['summary']);
        if($needle!=='' && !str_contains($hay,$needle))continue;
        $shown[]=$src;
    }
    return $shown;
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
    if (!is_file($path) || is_link($path) || filesize($path)>90000)throw new RuntimeException('VERSION_INVALID');
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
    if(!is_string($raw) || strlen($raw)>80000 || !preg_match('//u',$raw))
        throw new InvalidArgumentException('STRUCTURE_SIZE');
    try{$patch=json_decode($raw,true,24,JSON_THROW_ON_ERROR);}
    catch(JsonException $e){throw new InvalidArgumentException('STRUCTURE_JSON');}
    if(!is_array($patch) || array_is_list($patch) || ($patch['schema_version']??null)!==1)
        throw new InvalidArgumentException('STRUCTURE_SCHEMA');
    $schemas=[
        'recette'=>['ingredients','steps','baseServings','prepTime','cookTime',
            'intro','description','context','beforeYouStart','prepHeading','servingTip',
            'servingHeading','servingsLabel','moment','location','keyPoints','notes',
            'substitutions','equipment','faqs','kicker','servings','imageCaption','tips'],
        'culture'=>['sections','eyebrow','intro','seoDescription','readingTime'],
        'atelier'=>['steps','phases','prepare','outcomes','finalPreparation','learningGoal',
            'portionLabel','beforeStarting','equipment'],
        'ingredient'=>['deepDive','uses','tips','intro','seoDescription','role',
            'profile','choose','keep','pairings','mistakes','seoKeywords'],
        'technique'=>['supplies','steps','alternatives','description','introduction',
            'preparation','yieldLabel','questions']
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
            // Approved MP3 and narrated script remain protected. Only short
            // pedagogical labels/learning may be proposed by the guided editor.
            $guided=isset($value[0]) && is_array($value[0])
                && !array_diff(array_keys($value[0]),['id','title','learning']);
            $clean[$key]=$guided
                ?cmsPatchRows($value,['id','title','learning'],[],10)
                :cmsPatchRows($value,['id','title','minutes','actions','observe','check','learning','audioScript'],
                  ['mistake','recovery','pausePrompt','safety'],10);
            $ids=array_column($clean[$key],'id');
            if(count($ids)!==count(array_unique($ids))
                || count(array_filter($ids,static fn(string $id):bool=>
                    (bool)preg_match('/^[a-z][a-z0-9-]{0,60}$/D',$id)))!==count($ids))
                throw new InvalidArgumentException('STRUCTURE_PHASE_IDS');
        }elseif($key==='alternatives'){
            $clean[$key]=cmsPatchRows($value,['title','text'],[],30);
        }elseif(in_array($key,['questions','faqs'],true)){
            $clean[$key]=cmsPatchRows($value,['question','answer'],[],30);
        }elseif(in_array($key,['intro','description','context','beforeYouStart',
            'prepHeading','servingTip','servingHeading','servingsLabel','moment',
            'location','kicker','servings','imageCaption','eyebrow','seoDescription',
            'readingTime','finalPreparation','learningGoal','portionLabel','role',
            'preparation','introduction','yieldLabel'],true)){
            $clean[$key]=cmsPatchText($value,9000);
        }else{
            $clean[$key]=cmsPatchTextList($value,60,9000);
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
 * Export a deliberately narrow, review-only request. No GitHub token, external
 * request or production write. Recipe source content is independently checked
 * against both public feed and canonical full-record index before export.
 *
 * A downloaded request is NOT an approval credential. It still requires a
 * source-pinned patch and human review of the resulting GitHub diff.
 */
function cmsBuildReviewedRecipeRequest(array $source,?array $canonical,array $draft,int $expectedVersion): array {
    if(($source['kind']??null)!=='recette'
        || !cmsId($source['id']??null)
        || !is_array($canonical)
        || ($canonical['id']??null)!==$source['id']
        || ($canonical['kind']??null)!=='recette'
        || !in_array($canonical['model']??null,['recipes','restoredRecipes'],true)
        || !is_string($canonical['fingerprint']??null)
        || !preg_match('/^[0-9a-f]{64}$/D',$canonical['fingerprint'])
        || ($draft['source_id']??null)!==$source['id']
        || ($draft['state']??null)!=='review'
        || ($draft['version']??null)!==$expectedVersion
        || !is_int($expectedVersion) || $expectedVersion<1
        || ($draft['schema_version']??null)!==1
        || !is_string($draft['source_fingerprint']??null)
        || !hash_equals($source['fingerprint'],$draft['source_fingerprint'])
        || !is_string($draft['canonical_fingerprint']??null)
        || !hash_equals($canonical['fingerprint'],$draft['canonical_fingerprint'])
        || ($draft['canonical_model']??null)!==$canonical['model']
        || !is_array($draft['structure']??null))
        throw new RuntimeException('REVIEW_EXPORT_BLOCKED');
    $raw=json_encode($draft['structure'],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
    $patch=cmsValidateStructuredDraft('recette',$raw);
    if(!is_array($patch) || count($patch)<2)
        throw new RuntimeException('REVIEW_NO_CHANGES');
    return [
        'contract'=>'cuisine-cms-recipe-patch-v1',
        'source_id'=>$source['id'],
        'source_model'=>$canonical['model'],
        'source_path'=>$canonical['model']==='recipes'
            ?'src/data/recipes.ts':'src/data/restoredRecipes.ts',
        'canonical_sha256'=>$canonical['fingerprint'],
        'social_fingerprint'=>$source['fingerprint'],
        'review_version'=>$expectedVersion,
        'changes'=>$patch,
        'publication'=>'none',
    ];
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
        if (!is_string($json) || strlen($json)>90000)throw new RuntimeException('VERSION_TOO_LARGE');
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


/**
 * P1B: private creation of NEW editorial content in the same Studio.
 * The typed form is shared between all five families; it does not publish,
 * create Astro source files, upload assets, generate audio, or call an AI API.
 */
function cmsCreationSchema(): array {
    return [
      'recette'=>[
        'intro'=>['Introduction','long'],'description'=>['Description SEO','long'],
        'context'=>['Contexte culinaire','long'],'baseServings'=>['Nombre de portions','short'],
        'prepTime'=>['Préparation','short'],'cookTime'=>['Cuisson','short'],
        'ingredients'=>['Ingrédients','rows',['quantity'=>'Quantité','unit'=>'Unité','name'=>'Ingrédient']],
        'steps'=>['Étapes','rows',['title'=>'Titre de l’étape','text'=>'Explication complète']],
        'equipment'=>['Matériel','list']
      ],
      'culture'=>[
        'eyebrow'=>['Rubrique','short'],'intro'=>['Introduction','long'],
        'seoDescription'=>['Description SEO','long'],'readingTime'=>['Temps de lecture','short'],
        'sections'=>['Sections du Carnet','rows',
          ['title'=>'Titre de la section','paragraphs'=>'Paragraphes (séparer par une ligne vide)']]
      ],
      'atelier'=>[
        'intro'=>['Présentation','long'],'learningGoal'=>['Objectif pédagogique','long'],
        'finalPreparation'=>['Résultat final','long'],'portionLabel'=>['Portions ou participants','short'],
        'beforeStarting'=>['Préparation initiale','list'],'equipment'=>['Matériel','list'],
        'phases'=>['Chapitres pédagogiques','rows',
          ['title'=>'Titre du chapitre','learning'=>'Apprentissage visé']]
      ],
      'ingredient'=>[
        'intro'=>['Introduction','long'],'seoDescription'=>['Description SEO','long'],
        'role'=>['Rôle culinaire','long'],'deepDive'=>['À approfondir','list'],
        'profile'=>['Profil aromatique','list'],'uses'=>['Utilisations','list'],
        'tips'=>['Conseils','list'],'choose'=>['Bien choisir','list'],
        'keep'=>['Conservation','list'],'pairings'=>['Accords','list'],
        'mistakes'=>['Erreurs à éviter','list'],'seoKeywords'=>['Mots-clés SEO','list']
      ],
      'technique'=>[
        'description'=>['Description SEO','long'],'introduction'=>['Introduction','long'],
        'preparation'=>['Temps de préparation','short'],'yieldLabel'=>['Rendement','short'],
        'supplies'=>['Matériel et ingrédients','list'],
        'steps'=>['Étapes','rows',['title'=>'Titre','text'=>'Action et repères']],
        'alternatives'=>['Alternatives','rows',['title'=>'Variante','text'=>'Description']],
        'questions'=>['Questions fréquentes','rows',['question'=>'Question','answer'=>'Réponse']]
      ]
    ];
}
function cmsCreationKinds(): array {
    return ['recette'=>'Recette','atelier'=>'Atelier','culture'=>'Carnet culturel',
        'ingredient'=>'Fiche ingrédient','technique'=>'Fiche technique'];
}
function cmsCreationText(mixed $raw,int $max=7000): string {
    if(!is_string($raw) || strlen($raw)>$max*4
       || !preg_match('//u',$raw) || str_contains($raw,"\0"))
        throw new InvalidArgumentException('CREATION_TEXT');
    $text=trim(str_replace(["\r\n","\r"],"\n",$raw));
    if(mbLen($text)>$max)throw new InvalidArgumentException('CREATION_TEXT');
    return $text;
}
function cmsCreationSlug(string $title): string {
    $value=trim($title);
    if(function_exists('transliterator_transliterate')){
        $fold=transliterator_transliterate('Any-Latin; Latin-ASCII',$value);
        if(is_string($fold))$value=$fold;
    }elseif(function_exists('iconv')){
        $fold=iconv('UTF-8','ASCII//TRANSLIT//IGNORE',$value);
        if(is_string($fold))$value=$fold;
    }
    $value=strtolower($value);
    $value=trim((string)preg_replace('/[^a-z0-9]+/','-',$value),'-');
    if($value==='' || strlen($value)>100)
        throw new InvalidArgumentException('CREATION_SLUG');
    return $value;
}
function cmsCreationCleanFields(string $kind,mixed $raw): array {
    $schema=cmsCreationSchema()[$kind]??null;
    if(!$schema || !is_array($raw) || ($raw!==[] && array_is_list($raw))
       || array_diff(array_keys($raw),array_keys($schema)))
        throw new InvalidArgumentException('CREATION_SCHEMA');
    $out=[];
    foreach($schema as $name=>$spec){
        $type=$spec[1];
        $value=$raw[$name]??($type==='rows'?[]:'');
        if($type==='short' || $type==='long'){
            $out[$name]=cmsCreationText($value,$type==='short'?300:7000);
        }elseif($type==='list'){
            $text=cmsCreationText($value,9000);
            $list=preg_split('/\n+/u',$text);
            $out[$name]=array_values(array_filter(array_map('trim',$list?:[]),
                static fn(string $s):bool=>$s!==''));
            if(count($out[$name])>40
               || array_filter($out[$name],static fn(string $s):bool=>mbLen($s)>1500))
                throw new InvalidArgumentException('CREATION_LIST');
        }elseif($type==='rows'){
            if(!is_array($value) || count($value)>25)
                throw new InvalidArgumentException('CREATION_ROWS');
            $rows=[];
            foreach($value as $row){
                if(!is_array($row)||array_is_list($row)
                   || array_diff(array_keys($row),array_keys($spec[2])))
                    throw new InvalidArgumentException('CREATION_ROW');
                $clean=[];
                foreach($spec[2] as $key=>$label)
                    $clean[$key]=cmsCreationText($row[$key]??'',5000);
                if(count(array_filter($clean,static fn(string $v):bool=>$v!==''))===0)
                    continue;
                // One row may be incomplete while working in a private draft.
                if(array_key_exists('paragraphs',$clean)){
                    $paragraphs=preg_split('/\n\s*\n/u',$clean['paragraphs']);
                    $clean['paragraphs']=array_values(array_filter(array_map('trim',
                        $paragraphs?:[]),static fn(string $v):bool=>$v!==''));
                }
                $rows[]=$clean;
            }
            $out[$name]=$rows;
        }
    }
    return $out;
}
function cmsCreationReady(string $kind,array $fields,string $summary): bool {
    if($summary==='' || !isset(cmsCreationSchema()[$kind]))return false;
    foreach(cmsCreationSchema()[$kind] as $name=>$spec){
        $value=$fields[$name]??null;
        if($spec[1]==='short' || $spec[1]==='long'){
            // All scalar fields in each native model are required for review,
            // except the optional recipe equipment list.
            if(!is_string($value) || $value==='')return false;
        }elseif($spec[1]==='list'){
            if($name==='equipment' && $kind==='recette')continue;
            if(!is_array($value)||count($value)<1)return false;
        }elseif($spec[1]==='rows'){
            if(!is_array($value)||count($value)<1)return false;
            foreach($value as $row){
                foreach($spec[2] as $key=>$label){
                    if($key==='quantity' || $key==='unit')continue;
                    if(!isset($row[$key]) || $row[$key]==='' || $row[$key]===[])return false;
                }
            }
        }
    }
    if($kind==='recette'){
        $portions=$fields['baseServings']??'';
        if(!ctype_digit((string)$portions) || (int)$portions<1 || (int)$portions>100)return false;
    }
    return true;
}
function cmsCreationDir(string $private): string {
    $base=cmsDraftDir($private);
    $dir=$base.'/new-content';
    if(!is_dir($dir) && !@mkdir($dir,0700))throw new RuntimeException('CREATION_STORE');
    if(is_link($dir)||!is_dir($dir)||!is_writable($dir)
       || (fileperms($dir)&0077)!==0)throw new RuntimeException('CREATION_STORE');
    return $dir;
}
function cmsCreationId(mixed $id): ?string {
    return is_string($id)&&preg_match('/^c-[0-9a-f]{24}$/D',$id)?$id:null;
}
function cmsCreationVersions(string $dir,string $id): array {
    if(!cmsCreationId($id))throw new RuntimeException('CREATION_ID');
    $paths=glob($dir.'/'.$id.'.*.json');
    if(!is_array($paths)||count($paths)>9999)throw new RuntimeException('CREATION_FILES');
    $versions=[];
    foreach($paths as $path){
        if(is_link($path)||!is_file($path)
           || !preg_match('/^'.preg_quote($id,'/').'\.([0-9]{4})\.json$/D',
              basename($path),$m))throw new RuntimeException('CREATION_FILES');
        $versions[]=(int)$m[1];
    }
    rsort($versions,SORT_NUMERIC);
    if($versions && ($versions[count($versions)-1]!==1 || count($versions)!==$versions[0]))
        throw new RuntimeException('CREATION_GAP');
    return $versions;
}
function cmsCreationRead(string $dir,string $id,?int $version=null): ?array {
    if(!cmsCreationId($id))return null;
    $versions=cmsCreationVersions($dir,$id);
    $version=$version??($versions[0]??null);
    if($version===null)return null;
    if(!in_array($version,$versions,true))return null;
    $path=$dir.'/'.$id.'.'.sprintf('%04d',$version).'.json';
    if(is_link($path)||!is_file($path)||filesize($path)>100000)
        throw new RuntimeException('CREATION_FILE');
    $raw=file_get_contents($path);
    if(!is_string($raw))throw new RuntimeException('CREATION_FILE');
    $data=json_decode($raw,true,32,JSON_THROW_ON_ERROR);
    if(!is_array($data)||($data['id']??null)!==$id||($data['version']??null)!==$version)
        throw new RuntimeException('CREATION_FILE');
    return $data;
}
function cmsCreationList(string $dir): array {
    $paths=glob($dir.'/c-*.0001.json');
    if(!is_array($paths)||count($paths)>250)throw new RuntimeException('CREATION_CAPACITY');
    $out=[];
    foreach($paths as $path){
        $id=substr(basename($path),0,-10); // remove ".0001.json"
        if(!cmsCreationId($id)||is_link($path))throw new RuntimeException('CREATION_FILE');
        $record=cmsCreationRead($dir,$id);
        if(!$record)throw new RuntimeException('CREATION_FILE');
        $out[$id]=$record;
    }
    uasort($out,static fn(array $a,array $b):int=>
        strcmp((string)$b['recorded_at'],(string)$a['recorded_at']));
    return $out;
}
function cmsCreationDuplicateCheck(string $kind,string $slug,
    array $catalog,array $proposals,?string $self): array {
    $similar=[];
    foreach(array_merge(array_values($catalog),array_values($proposals)) as $item){
        if(($item['kind']??null)!==$kind || ($item['id']??null)===$self)continue;
        $existingSlug=(string)($item['slug']??'');
        if($existingSlug===''){
            $id=(string)($item['id']??'');
            $existingSlug=str_contains($id,':')?explode(':',$id,2)[1]:'';
        }
        try{$titleSlug=cmsCreationSlug((string)($item['title']??''));}
        catch(Throwable $e){$titleSlug='';}
        if($existingSlug===$slug || $titleSlug===$slug)
            throw new InvalidArgumentException('CREATION_DUPLICATE');
        $left=array_unique(explode('-',$slug));
        $right=array_unique(explode('-',$titleSlug));
        $score=count(array_intersect($left,$right))
            /max(1,max(count($left),count($right)));
        if($score>=0.65)$similar[]=['title'=>(string)$item['title'],'score'=>$score];
    }
    return $similar;
}
function cmsCreationSave(string $private,array $posted,array $catalog,
    int $expected,?string $id=null): array {
    if($id!==null && !cmsCreationId($id))throw new InvalidArgumentException('CREATION_ID');
    $kind=cmsCreationText($posted['kind']??'',30);
    if(!isset(cmsCreationKinds()[$kind]))throw new InvalidArgumentException('CREATION_KIND');
    $title=cmsCreationText($posted['title']??'',180);
    $angle=cmsCreationText($posted['angle']??'',700);
    $summary=cmsCreationText($posted['summary']??'',2000);
    $note=cmsCreationText($posted['research_note']??'',3000);
    $date=cmsCreationText($posted['target_date']??'',12);
    $state=cmsCreationText($posted['state']??'draft',12);
    if($title===''||$angle===''||!in_array($state,['draft','review'],true)
       || ($date!=='' && (!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$date)
         || !checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4)))))
        throw new InvalidArgumentException('CREATION_FIELDS');
    $fields=cmsCreationCleanFields($kind,$posted['fields']??[]);
    if($state==='review' && !cmsCreationReady($kind,$fields,$summary))
        throw new InvalidArgumentException('CREATION_INCOMPLETE');
    $slug=cmsCreationSlug($title);
    $dir=cmsCreationDir($private);
    $lockPath=$dir.'/catalog.lock';
    if(is_link($lockPath))throw new RuntimeException('CREATION_LOCK');
    $lock=fopen($lockPath,'c');
    if(!$lock || !flock($lock,LOCK_EX))throw new RuntimeException('CREATION_LOCK');
    try{
        if(!@chmod($lockPath,0600))throw new RuntimeException('CREATION_LOCK');
        $all=cmsCreationList($dir);
        $previous=$id===null?null:($all[$id]??null);
        if($id!==null && !$previous)throw new RuntimeException('CREATION_NOT_FOUND');
        if($id===null && $expected!==0)throw new RuntimeException('CREATION_CONFLICT');
        if($previous && ($previous['version']!==$expected
            || $previous['kind']!==$kind))
            throw new RuntimeException('CREATION_CONFLICT');
        $similar=cmsCreationDuplicateCheck($kind,$slug,$catalog,$all,$id);
        $id=$id??'c-'.bin2hex(random_bytes(12));
        if($previous===null && isset($all[$id]))throw new RuntimeException('CREATION_CONFLICT');
        $version=$expected+1;
        $record=[
            'contract'=>'cdc-editorial-new-content-v1',
            'id'=>$id,'kind'=>$kind,'origin'=>'manual','title'=>$title,
            'slug'=>$slug,'angle'=>$angle,'summary'=>$summary,'fields'=>$fields,
            'research_note'=>$note,'target_date'=>$date===''?null:$date,
            'channels'=>['site'],'state'=>$state,'reviewed'=>false,
            'similar_titles'=>$similar,'version'=>$version,
            'recorded_at'=>gmdate('Y-m-d\TH:i:s\Z')
        ];
        $json=json_encode($record,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
        if(strlen($json)>100000)throw new InvalidArgumentException('CREATION_SIZE');
        $path=$dir.'/'.$id.'.'.sprintf('%04d',$version).'.json';
        if(file_exists($path)||is_link($path))throw new RuntimeException('CREATION_CONFLICT');
        $temp=tempnam($dir,'new-');
        if($temp===false)throw new RuntimeException('CREATION_STORE');
        try{
            if(is_link($temp)||!chmod($temp,0600)
                || file_put_contents($temp,$json,LOCK_EX)!==strlen($json)
                || !rename($temp,$path))
                throw new RuntimeException('CREATION_STORE');
        }finally{if(is_file($temp))@unlink($temp);}
        return $record;
    }finally{flock($lock,LOCK_UN);fclose($lock);}
}
function cmsCreationFormHtml(string $kind,array $values=[]): string {
    $schema=cmsCreationSchema()[$kind]??null;
    if(!$schema)throw new InvalidArgumentException('CREATION_KIND');
    $html='';
    foreach($schema as $field=>$spec){
        [$label,$type]=$spec;
        $name=cmsEsc($field);
        $label=cmsEsc($label);
        $value=$values[$field]??null;
        if($type==='rows'){
            $rows=is_array($value)&&$value?array_values($value):[[]];
            $html.='<fieldset class="create-collection"><legend>'.$label.'</legend>'
                .'<div class="create-rows" data-create-rows="'.$name.'">';
            foreach($rows as $i=>$row){
                $html.='<div class="create-row" data-create-row><strong>Élément '
                    .((int)$i+1).'</strong>';
                foreach($spec[2] as $key=>$lbl){
                    $text=$row[$key]??'';
                    if(is_array($text))$text=implode("\n\n",$text);
                    $html.='<label>'.cmsEsc($lbl).'<textarea rows="3" maxlength="5000"'
                        .' name="fields['.$name.']['.$i.']['.cmsEsc($key).']">'
                        .cmsEsc((string)$text).'</textarea></label>';
                }
                $html.='<button type="button" class="secondary" data-create-remove>'
                    .'Retirer cet élément</button></div>';
            }
            $html.='</div><button type="button" class="secondary" data-create-add="'
                .$name.'">Ajouter un élément</button></fieldset>';
        }elseif($type==='list'){
            $text=is_array($value)?implode("\n",$value):(string)($value??'');
            $html.='<label>'.$label.' <span class="small muted">(une ligne par élément)</span>'
                .'<textarea name="fields['.$name.']" rows="4" maxlength="9000">'
                .cmsEsc($text).'</textarea></label>';
        }else{
            $html.='<label>'.$label.'<textarea name="fields['.$name.']" rows="'
                .($type==='short'?'2':'4').'" maxlength="'
                .($type==='short'?'300':'7000').'">'
                .cmsEsc((string)($value??'')).'</textarea></label>';
        }
    }
    return $html;
}


/**
 * Private content calendar, derived exclusively from the latest saved revision
 * of each new-content draft. It plans work; it does NOT schedule execution.
 * A planned date or "review" status never authorizes Meta / n8n / site publish.
 */
function cmsCalendarMonth(mixed $value): string {
    if(!is_string($value) || !preg_match('/^(20[2-9][0-9])-(0[1-9]|1[0-2])$/D',$value))
        throw new InvalidArgumentException('CALENDAR_MONTH_INVALID');
    return $value;
}
function cmsCalendarPlan(array $creations,string $month,
    string $kind='all',string $status='all'): array {
    cmsCalendarMonth($month);
    if($kind!=='all' && !array_key_exists($kind,cmsCreationKinds()))
        throw new InvalidArgumentException('CALENDAR_KIND');
    if(!in_array($status,['all','draft','review'],true))
        throw new InvalidArgumentException('CALENDAR_STATUS');
    $days=[];$undated=[];$other=[];$count=0;
    foreach($creations as $item){
        if(!is_array($item) || !cmsCreationId($item['id']??null)
           || !isset(cmsCreationKinds()[$item['kind']??''])
           || !in_array($item['state']??null,['draft','review'],true)
           || !is_string($item['title']??null)
           || mbLen($item['title'])>180)
            throw new RuntimeException('CALENDAR_CORRUPT_DRAFT');
        if($kind!=='all' && $item['kind']!==$kind)continue;
        if($status!=='all' && $item['state']!==$status)continue;
        $date=$item['target_date']??null;
        if($date!==null && (!is_string($date)
            || !preg_match('/^(20[2-9][0-9])-(0[1-9]|1[0-2])-([0-3][0-9])$/D',$date)
            || !checkdate((int)substr($date,5,2),(int)substr($date,8,2),
                (int)substr($date,0,4))))
            throw new RuntimeException('CALENDAR_CORRUPT_DATE');
        ++$count;
        if($date===null)$undated[]=$item;
        elseif(substr($date,0,7)===$month)$days[$date][]=$item;
        else $other[]=$item;
    }
    ksort($days,SORT_STRING);
    foreach($days as &$list)usort($list,static fn(array $a,array $b):int=>
        strcmp($a['title'],$b['title']));unset($list);
    foreach([&$undated,&$other] as &$list)
        usort($list,static fn(array $a,array $b):int=>
            strcmp((string)$a['title'],(string)$b['title']));
    unset($list);
    return ['month'=>$month,'days'=>$days,'undated'=>$undated,'other'=>$other,
       'total'=>$count,'month_count'=>array_sum(array_map('count',$days)),
       'undated_count'=>count($undated)];
}
