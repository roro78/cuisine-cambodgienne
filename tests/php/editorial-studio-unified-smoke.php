<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/publication-gap-audit.php';
function studioAssert(bool $ok,string $label):void {
    if(!$ok)throw new RuntimeException('STUDIO_'.$label);
}
function studioReject(callable $operation,string $code):void {
    try{$operation();throw new RuntimeException('UNEXPECTED_ACCEPT');}
    catch(InvalidArgumentException|RuntimeException $e){studioAssert($e->getMessage()===$code,$code);}
}
function studioRemove(string $dir):void {
    foreach(scandir($dir)?:[] as $name){
        if($name==='.'||$name==='..')continue;
        $p=$dir.'/'.$name;
        if(is_dir($p)&&!is_link($p))studioRemove($p);else unlink($p);
    }rmdir($dir);
}
$dist=realpath($argv[1]??'');studioAssert(is_string($dist),'BUILD_REQUIRED');
$catalog=cmsSourceList(json_decode(file_get_contents($dist.'/social-feed.json'),true,64,JSON_THROW_ON_ERROR));
$canonical=cmsCanonicalSourceList(json_decode(file_get_contents($dist.'/editorial-source-index.json'),true,64,JSON_THROW_ON_ERROR),$catalog);
$guided=cmsGuidedSourceList(json_decode(file_get_contents($dist.'/editorial-guided-fields.json'),true,64,JSON_THROW_ON_ERROR),$canonical);
cmsAssertGuidedCoverage($guided,$canonical);
// V4 is read-only, model-bound and fail-closed: a partial or foreign projection is refused.
$visualRecipeId=null;
foreach($guided as $candidateId=>$entry){
    if($entry['model']==='recipes'){$visualRecipeId=$candidateId;break;}
}
studioAssert(is_string($visualRecipeId),'VISUAL_RECIPE_AVAILABLE');
$visualBase=$guided[$visualRecipeId]['fields'];
$visualEdit=$visualBase;$visualEdit['intro'].=' — aperçu du brouillon';
$visualDiff=cmsStudioVisualChanges($visualBase,['schema_version'=>1]+$visualEdit);
studioAssert(count($visualDiff)===1
    && $visualDiff[0]['path']==='fields.intro'
    && $visualDiff[0]['to']===$visualEdit['intro'],'VISUAL_ONLY_CHANGED_FIELD');
studioAssert(cmsStudioVisualChanges($visualBase,$visualBase)===[],'VISUAL_NO_CHANGES');
studioAssert(cmsStudioVisualRoute($catalog[$visualRecipeId])!==null,'VISUAL_CANONICAL_ROUTE');
studioAssert(cmsStudioVisualRoute(['url'=>'https://evil.example/recettes/test/'])===null,'VISUAL_FOREIGN_ROUTE');
studioReject(fn()=>cmsStudioVisualChanges($visualBase,array_diff_key($visualBase,['intro'=>true])),'VISUAL_SHAPE');
if(isset($visualBase['ingredients'][0]['scalable'])){
    $forged=$visualBase;$forged['ingredients'][0]['scalable']=!$visualBase['ingredients'][0]['scalable'];
    studioReject(fn()=>cmsStudioVisualChanges($visualBase,$forged),'VISUAL_IMMUTABLE');
}
$root=sys_get_temp_dir().'/cdc-unified-'.bin2hex(random_bytes(8));mkdir($root,0700);
try{
    $count=0;
    foreach($catalog as $id=>$source){
        if($source['kind']!=='atelier'||$guided[$id]['model']!=='cookingWorkshopGuides')continue;
        $firstWorkshop=$firstWorkshop??$source;
        $count++;
        $legacyFields=['title'=>$source['title'],'summary'=>$source['summary'],
            'editorial_text'=>'PRIVATE_LEGACY_TEXT','editor_note'=>'PRIVATE_LEGACY_NOTE','state'=>'draft',
            'structure_json'=>json_encode(['schema_version'=>1]+$guided[$id]['fields'],JSON_THROW_ON_ERROR)];
        $v1=cmsSave($root,$source,$legacyFields,0,$source['fingerprint'],$canonical[$id],$canonical[$id]['fingerprint']);
        $path=cmsDraftDir($root).'/'.cmsKey($id).'.0001.json';$sha=hash_file('sha256',$path);
        $candidate=cmsStudioWorkshopCandidate($source,$canonical[$id],$guided[$id],$v1);
        studioAssert(!isset($candidate['atelier_scripts'],$candidate['atelier_reference']),'NO_INVENTED_SCRIPTS_OR_RECIPE');
        studioAssert(!str_contains(json_encode($candidate),'PRIVATE_LEGACY_'),'NOTES_REMAIN_IN_HISTORY');
        studioAssert(count($candidate['fields']['phases'])===6,'SIX_PHASE_TITLES');
        studioReject(fn()=>cmsStudioTransition($root,$source,$catalog,$canonical,$guided[$id],0),'CONFLICT');
        $bad=$guided[$id];$bad['fingerprint']=str_repeat('0',64);
        studioReject(fn()=>cmsStudioWorkshopCandidate($source,$canonical[$id],$bad,$v1),'STUDIO_MODEL_UNSUPPORTED');
        $stale=$v1;$stale['canonical_fingerprint']=str_repeat('0',64);
        studioReject(fn()=>cmsStudioWorkshopCandidate($source,$canonical[$id],$guided[$id],$stale),'STUDIO_SOURCE_STALE');
        $wrongId=$v1;$wrongId['structure']['phases'][0]['id']='terminer';
        studioReject(fn()=>cmsStudioWorkshopCandidate($source,$canonical[$id],$guided[$id],$wrongId),'STUDIO_LEGACY_METADATA');
        $extra=$v1;$extra['structure']['audioScript']='NEVER_IMPORT_AUDIO';
        studioReject(fn()=>cmsStudioWorkshopCandidate($source,$canonical[$id],$guided[$id],$extra),'STUDIO_LEGACY_SHAPE');
        $linked=cmsStudioTransition($root,$source,$catalog,$canonical,$guided[$id],1);
        studioAssert($linked['source_binding']['source_id']===$id,'SAME_PUBLIC_ID');
        studioAssert($linked['source_binding']['legacy_version']===1,'LEGACY_ANCHOR');
        studioAssert($sha===hash_file('sha256',$path),'HISTORY_BYTES_PRESERVED');
        studioAssert(cmsVersions(cmsDraftDir($root),$id)===[1],'NO_LEGACY_MIGRATION');
        studioReject(fn()=>cmsStudioTransition($root,$source,$catalog,$canonical,$guided[$id],1),'STUDIO_LINK_EXISTS');
        studioReject(fn()=>cmsSave($root,$source,$legacyFields,1,$source['fingerprint'],$canonical[$id],$canonical[$id]['fingerprint']),'STUDIO_LINK_EXISTS');
        $post=$candidate;unset($post['source_binding']);
        $v2=cmsCreationSave($root,$post,$catalog,1,$linked['id'],null,null,null,$canonical);
        studioAssert($v2['source_binding']===$linked['source_binding'],'BINDING_IMMUTABLE');
        studioReject(fn()=>cmsCreationSave($root,$post,$catalog,1,$linked['id'],null,null,null,$canonical),'CREATION_CONFLICT');
        $forged=$post;$forged['source_binding']=$linked['source_binding'];
        studioReject(fn()=>cmsCreationSave($root,$forged,$catalog,2,$linked['id'],null,null,null,$canonical),'STUDIO_BINDING_SERVER_ONLY');
        $changed=$canonical;$changed[$id]['fingerprint']=str_repeat('f',64);
        studioAssert(!cmsStudioBindingCurrent($v2['source_binding'],$catalog,$changed),'FULL_SOURCE_CHANGE');
        $status=cmsStudioCatalogDrafts([],[$v2['id']=>$v2],$catalog,$canonical);
        studioAssert($status[$id]['version']===2,'LIBRARY_LATEST_BOUND_VERSION');
        $staleStatus=cmsStudioCatalogDrafts([],[$v2['id']=>$v2],$catalog,$changed);
        studioAssert(count(cmsFilterCatalog($catalog,$staleStatus,'atelier','','stale'))===1,'LIBRARY_STALE_CANONICAL_FILTER');
        studioReject(fn()=>cmsCreationSave($root,$post,$catalog,2,$linked['id'],null,null,null,$changed),'STUDIO_SOURCE_STALE');
        studioAssert(cmsStudioLinkedDraft(cmsCreationList(cmsCreationDir($root)),$id)['id']===$linked['id'],'REOPEN');
        $check=cmsAtelierBlueprintPreflight($v2,$catalog);
        studioAssert(!$check['canonical_reference_checked']&&!$check['seven_scripts_drafted']&&!$check['publication_ready'],'NO_FAKE_READINESS');
        $scripts=cmsAtelierScriptsHtml(null,$v2['fields'],null,null);
        foreach(cmsAtelierScriptIds() as $i=>$chapter)
            studioAssert(str_contains($scripts,'name="atelier_scripts[chapters]['.$i.'][text]"'),'SEVEN_FIELDS_'.$chapter);
        studioAssert(cmsAtelierVisaStatus(cmsCreationDir($root),$v2,$catalog)['approved_text_count']===0,'NO_FAKE_VISAS');
        $duplicate=$catalog;$duplicate['atelier:another-published-identity']=$source;
        $duplicate['atelier:another-published-identity']['id']='atelier:another-published-identity';
        studioReject(fn()=>cmsCreationSave($root,$post,$duplicate,2,$linked['id'],null,null,null,$canonical),'CREATION_DUPLICATE');
    }
    studioAssert($count>0,'REAL_WORKSHOPS');
    $all=cmsCreationList(cmsCreationDir($root));
    $calendar=cmsCalendarPlan($all,gmdate('Y-m'));
    studioAssert($calendar['undated_count']===$count,'CALENDAR_PRESERVED');
    $empty=$root.'/no-history';mkdir($empty,0700);
    $id=$firstWorkshop['id'];
    $withoutHistory=cmsStudioTransition($empty,$firstWorkshop,$catalog,$canonical,$guided[$id],0);
    studioAssert($withoutHistory['source_binding']['legacy_version']===0
        &&$withoutHistory['source_binding']['legacy_sha256']===null,'NO_HISTORICAL_DRAFT_REQUIRED');
    foreach(cmsCreationKinds() as $kind=>$label){
        studioAssert(cmsCreationFormHtml($kind)!=='','ALL_FIVE_FORMS');
        studioAssert(str_contains(cmsStudioNavigationHtml(),'Ce qu’il reste à faire'),'COMMON_NAVIGATION');
    }
    echo 'UNIFIED_STUDIO_PASS '.$count." real workshops, immutable history, guarded transition and calendar\n";
}finally{studioRemove($root);}
