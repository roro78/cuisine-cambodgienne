<?php
declare(strict_types=1);
$dist=realpath($argv[1]??'');
if(!is_string($dist)||!is_file($dist.'/gestion-contenus/atelier-narrations.json'))
    throw new RuntimeException('CORAL_SNAPSHOT_MISSING');
require_once $dist.'/gestion-contenus/lib.php';
$raw=file_get_contents($dist.'/gestion-contenus/atelier-narrations.json');
$data=json_decode((string)$raw,true,32,JSON_THROW_ON_ERROR);
// The list of released workshops is not a constant. It now includes Amok Trey.
// Compare the private snapshot against the independently built canonical index,
// so a missing/duplicate workshop or stale fingerprint still fails closed.
$indexPath=$dist.'/editorial-source-index.json';
if(!is_file($indexPath))throw new RuntimeException('CORAL_CANONICAL_INDEX_MISSING');
$index=json_decode((string)file_get_contents($indexPath),true,32,JSON_THROW_ON_ERROR);
if(($index['digest']??null)!=='sha256-full-astro-record-v1'
    ||!is_array($index['items']??null))
    throw new RuntimeException('CORAL_CANONICAL_INDEX_INVALID');
$expected=[];
foreach($index['items'] as $entry){
    if(!is_array($entry)||($entry['model']??null)!=='cookingWorkshopGuides')continue;
    $id=$entry['id']??null;$fingerprint=$entry['fingerprint']??null;
    if(!is_string($id)||!str_starts_with($id,'atelier:')
        ||!is_string($fingerprint)||!preg_match('/^[a-f0-9]{64}$/D',$fingerprint)
        ||array_key_exists($id,$expected))
        throw new RuntimeException('CORAL_CANONICAL_INDEX_INVALID');
    $expected[$id]=$fingerprint;
}
if(($data['contract']??null)!=='cdc-workshop-existing-coral-narrations-v1'
    ||($data['schemaVersion']??null)!==1
    ||!is_array($data['items']??null)||count($expected)===0
    ||count($data['items'])!==count($expected))
    throw new RuntimeException('CORAL_SNAPSHOT_COUNT');
$canonical=[];
foreach($data['items'] as $item){
    $id=is_array($item)?($item['id']??null):null;
    if(!is_string($id)||!array_key_exists($id,$expected)
        ||array_key_exists($id,$canonical)
        ||($item['canonicalFingerprint']??null)!==$expected[$id])
        throw new RuntimeException('CORAL_SNAPSHOT_CANONICAL_MISMATCH');
    $canonical[$id]=['fingerprint'=>$expected[$id]];
}
foreach($data['items'] as $item){
    $binding=['contract'=>'cdc-studio-published-workshop-v1',
        'source_id'=>$item['id'],
        'canonical_fingerprint'=>$item['canonicalFingerprint']];
    $resolved=cmsStudioExistingCoralNarrations($binding,$canonical);
    if(!is_array($resolved)||count($resolved['chapters'])!==7)
        throw new RuntimeException('CORAL_PRIVATE_SOURCE_NOT_RESTORED');
    if($resolved['chapters'][0]['text']!==$item['chapters'][0]['text'])
        throw new RuntimeException('CORAL_SOURCE_CHANGED');
    $html=cmsStudioExistingCoralNarrationsHtml($resolved);
    if(substr_count($html,'data-existing-coral-chapter=')!==7
       ||!str_contains($html,'Écouter le MP3 existant')
       ||str_contains($html,'<script'))
        throw new RuntimeException('CORAL_PRIVATE_HTML_INVALID');
    $wrong=$binding;$wrong['canonical_fingerprint']=str_repeat('f',64);
    if(cmsStudioExistingCoralNarrations($wrong,$canonical)!==null)
        throw new RuntimeException('CORAL_STALE_DIGEST_ACCEPTED');
}
if(cmsStudioExistingCoralNarrations(null,$canonical)!==null)
    throw new RuntimeException('CORAL_NO_BINDING_ACCEPTED');
echo "CMS_EXISTING_CORAL_NARRATIONS_PASS ".count($canonical)." source workshops, 7 chapters each, no TTS\n";
