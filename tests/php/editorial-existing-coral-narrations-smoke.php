<?php
declare(strict_types=1);
$dist=realpath($argv[1]??'');
if(!is_string($dist)||!is_file($dist.'/gestion-contenus/atelier-narrations.json'))
    throw new RuntimeException('CORAL_SNAPSHOT_MISSING');
require_once $dist.'/gestion-contenus/lib.php';
$raw=file_get_contents($dist.'/gestion-contenus/atelier-narrations.json');
$data=json_decode((string)$raw,true,32,JSON_THROW_ON_ERROR);
if(count($data['items']??[])!==6)throw new RuntimeException('CORAL_SNAPSHOT_COUNT');
$canonical=[];
foreach($data['items'] as $item)
    $canonical[$item['id']]=['fingerprint'=>$item['canonicalFingerprint']];
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
echo "CMS_EXISTING_CORAL_NARRATIONS_PASS 6 source workshops, 7 chapters each, no TTS\n";
