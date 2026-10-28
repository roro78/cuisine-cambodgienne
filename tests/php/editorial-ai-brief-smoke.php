<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/lib.php';
function aiCheck(bool $ok,string $why):void {if(!$ok)throw new RuntimeException('AI_BRIEF_TEST_'.$why);}
function aiFails(callable $fn,string $code):void {
    $caught=null;try{$fn();}catch(Throwable $e){$caught=$e;}
    aiCheck($caught!==null && $caught->getMessage()===$code,'EXPECTED_'.$code);
}
function aiRemove(string $dir):void {
    foreach(scandir($dir)?:[] as $name){
        if($name==='.'||$name==='..')continue;
        $path=$dir.'/'.$name;
        if(is_dir($path)&&!is_link($path))aiRemove($path);else unlink($path);
    }
    rmdir($dir);
}
function aiInput(string $kind,string $title,string $recipe):array {
    return ['kind'=>$kind,'title'=>$title,'angle'=>'Un angle nouveau à vérifier',
        'objective'=>'Répondre à une question précise du lecteur',
        'context'=>'CONTEXTE_EXPLICITE','reference_id'=>$kind==='atelier'?$recipe:'',
        'semantic_review'=>'1'];
}
function aiResponse(string $title):string {
    return json_encode(['title'=>$title,'angle'=>'Un angle proposé à vérifier',
        'summary'=>'<script>PRIVATE_SYNTHETIC_TEXT</script>',
        'research_note'=>'Faits et sources à vérifier avant toute publication.'],JSON_THROW_ON_ERROR);
}
function aiConfig(callable $adapter):array {
    return ['private_secret'=>'CONFIG_SECRET_MUST_NOT_LEAVE',
        'editorial_ai_briefs'=>['enabled'=>true,'adapter'=>$adapter,
            'model_label'=>'fixture-only','max_attempts_per_day'=>3]];
}
$root=realpath($argv[1]??'');aiCheck(is_string($root),'DIST_REQUIRED');
$catalog=cmsSourceList(json_decode(file_get_contents($root.'/social-feed.json'),true,32,JSON_THROW_ON_ERROR));
$recipe='';foreach($catalog as $id=>$page)if($page['kind']==='recette'){$recipe=$id;break;}
aiCheck($recipe!=='','REAL_RECIPES_REQUIRED');
$base=sys_get_temp_dir().'/cdc-ai-brief-'.bin2hex(random_bytes(8));
aiCheck(mkdir($base,0700),'TEMP');
$fresh=static function(string $name)use($base):string{
    $path=$base.'/'.$name;aiCheck(mkdir($path,0700),'TEMP_CHILD');return $path;
};
try{
    aiCheck(cmsAiBriefSettings([])===null,'DEFAULT_ENABLED');
    aiFails(static fn()=>cmsAiBriefSettings(['editorial_ai_briefs'=>['enabled'=>true]]),
        'AI_BRIEF_UNAVAILABLE');
    $invalidCfg=aiConfig(static fn():string=>'');
    $invalidCfg['editorial_ai_briefs']['max_attempts_per_day']=6;
    aiFails(static fn()=>cmsAiBriefSettings($invalidCfg),'AI_BRIEF_UNAVAILABLE');
    $calls=0;
    foreach(cmsCreationKinds() as $kind=>$label){
        $private=$fresh($kind);
        $input=aiInput($kind,'Projet IA témoin '.$kind,$recipe);
        $manual=['kind'=>$kind,'title'=>'Projet confidentiel antérieur '.$kind,
            'angle'=>'Une autre intention','summary'=>'Résumé privé','fields'=>[],
            'research_note'=>'PRIVATE_EXISTING_RESEARCH','target_date'=>'','state'=>'draft'];
        $old=cmsCreationSave($private,$manual,$catalog,0);
        $dir=cmsCreationDir($private);
        $oldFile=$dir.'/'.$old['id'].'.0001.json';$hash=hash_file('sha256',$oldFile);
        $cfg=aiConfig(static function(array $request)use(&$calls,$input,$kind):string{
            ++$calls;$json=json_encode($request,JSON_THROW_ON_ERROR);
            aiCheck(!str_contains($json,'CONFIG_SECRET_MUST_NOT_LEAVE')
                && !str_contains($json,'PRIVATE_EXISTING_RESEARCH')
                && !str_contains($json,'Projet confidentiel antérieur'),'PRIVATE_CONTEXT_SENT');
            aiCheck($request['kind']===$kind && $request['max_output_tokens']===1200
                && $request['timeout_seconds']===20,'SERVER_BUDGET');
            if($kind==='atelier')aiCheck(array_keys($request['reference'])===
                ['id','kind','title','summary'],'REFERENCE_OVEREXPORTED');
            return aiResponse($input['title'].' proposition');
        });
        $record=cmsAiBriefGenerate($private,$input,$catalog,$cfg);
        aiCheck($record['origin']==='ai' && $record['state']==='draft'
            && $record['reviewed']===false && $record['channels']===['site']
            && $record['target_date']===null,'NO_APPROVAL_OR_PUBLICATION');
        aiCheck($record['ai_brief']['idea_review_confirmed']===true
            && $record['ai_brief']['objective']===$input['objective'],'PROVENANCE');
        aiCheck(!cmsCreationReady($kind,$record['fields'],$record['summary']),
            'BRIEF_MISTAKEN_FOR_FULL_CONTENT');
        aiCheck(str_contains(cmsCreationFormHtml($kind,$record['fields']),'name="fields['),
            'SHARED_FORM');
        $preview=cmsGuidedPreviewHtml('fiche',['summary'=>$record['summary']]);
        aiCheck(!str_contains($preview,'<script>')&&str_contains($preview,'&lt;script&gt;'),
            'RESPONSE_XSS');
        $posted=['kind'=>$kind,'title'=>$record['title'],'angle'=>$record['angle'],
            'summary'=>$record['summary'],'research_note'=>$record['research_note'],
            'target_date'=>'','state'=>'draft','fields'=>[], 'origin'=>'manual'];
        $v2=cmsCreationSave($private,$posted,$catalog,1,$record['id']);
        aiCheck($v2['origin']==='ai' && $v2['ai_brief']===$record['ai_brief']
            && cmsCreationRead($dir,$record['id'],1)===$record,'PROVENANCE_OR_HISTORY_LOST');
        aiCheck(hash_file('sha256',$oldFile)===$hash,'OLD_DRAFT_CHANGED');
        aiCheck(cmsCalendarPlan(cmsCreationList($dir),'2026-11')['undated_count']===2,
            'SHARED_CALENDAR');
        $before=$calls;
        aiFails(static fn()=>cmsAiBriefGenerate($private,$input,$catalog,$cfg),'CREATION_DUPLICATE');
        aiCheck($calls===$before,'ORIGINAL_SUBJECT_REGENERATED');
        $quota=$private.'/editorial-drafts/ai-brief-attempts.json';
        aiCheck((fileperms($quota)&0077)===0,'QUOTA_PERMISSIONS');
    }
    aiCheck($calls===count(cmsCreationKinds()),'FAMILY_COVERAGE');
    $private=$fresh('input-guards');$input=aiInput('recette','Idée originale de test',$recipe);
    $invoked=0;$cfg=aiConfig(static function()use(&$invoked):string{++$invoked;return aiResponse('Sortie');});
    aiFails(static fn()=>cmsAiBriefGenerate($private,$input,$catalog,[]),'AI_BRIEF_UNAVAILABLE');
    $bad=$input;unset($bad['semantic_review']);
    aiFails(static fn()=>cmsAiBriefGenerate($private,$bad,$catalog,$cfg),'AI_BRIEF_REVIEW_REQUIRED');
    $bad=$input;$bad['title']=$catalog[$recipe]['title'];
    aiFails(static fn()=>cmsAiBriefGenerate($private,$bad,$catalog,$cfg),'CREATION_DUPLICATE');
    $bad=$input;$bad['origin']='ai';
    aiFails(static fn()=>cmsAiBriefGenerate($private,$bad,$catalog,$cfg),'AI_BRIEF_INPUT');
    $bad=aiInput('atelier','Atelier sans source',$recipe);$bad['reference_id']='';
    aiFails(static fn()=>cmsAiBriefGenerate($private,$bad,$catalog,$cfg),'AI_BRIEF_REFERENCE');
    aiCheck($invoked===0 && !is_file($private.'/editorial-drafts/ai-brief-attempts.json'),
        'REJECTED_INPUT_SPENT_BUDGET');
    $spoof=cmsCreationSave($private,['kind'=>'recette','title'=>'Origine envoyée par navigateur',
        'angle'=>'Angle','summary'=>'Résumé','fields'=>[],'research_note'=>'',
        'target_date'=>'','state'=>'draft','origin'=>'ai','ai_brief'=>['fake'=>true]],$catalog,0);
    aiCheck($spoof['origin']==='manual' && !isset($spoof['ai_brief']),'POST_PROVENANCE_TRUSTED');
    $private=$fresh('similar-input');
    $input=aiInput('recette','Projet IA témoin recette',$recipe);
    $near='Projet IA témoin nouvelle recette';
    cmsCreationSave($private,['kind'=>'recette','title'=>$near,'angle'=>'Autre angle',
        'summary'=>'Résumé','fields'=>[],'research_note'=>'','target_date'=>'','state'=>'draft'],$catalog,0);
    $cfg=aiConfig(static fn():string=>aiResponse('Une proposition au titre différent'));
    $record=cmsAiBriefGenerate($private,$input,$catalog,$cfg);
    aiCheck(in_array($near,array_column($record['similar_titles'],'title'),true),
        'INPUT_SIMILARITY_WARNING_LOST');
    $input=aiInput('recette','Idée originale de test',$recipe);
    foreach(['not-json','[]',json_encode(['title'=>'Faux','origin'=>'approved']),
        str_repeat('a',16001),json_encode(['title'=>[],'angle'=>'a','summary'=>'b','research_note'=>'c'])]
        as $i=>$invalid){
        $private=$fresh('response-'.$i);
        $cfg=aiConfig(static fn(array $request):string=>$invalid);
        aiFails(static fn()=>cmsAiBriefGenerate($private,$input,$catalog,$cfg),'AI_BRIEF_RESPONSE');
        aiCheck(cmsCreationList(cmsCreationDir($private))===[],'INVALID_RESPONSE_SAVED');
    }
    $private=$fresh('provider-failure');$invoked=0;
    $cfg=aiConfig(static function()use(&$invoked):string{
        ++$invoked;throw new RuntimeException('SECRET_PROVIDER_MESSAGE');
    });
    aiFails(static fn()=>cmsAiBriefGenerate($private,$input,$catalog,$cfg),'AI_BRIEF_PROVIDER');
    aiFails(static fn()=>cmsAiBriefGenerate($private,$input,$catalog,$cfg),'AI_BRIEF_LIMIT');
    aiCheck($invoked===1,'FAILURE_RETRIED');
    $private=$fresh('quota');
    cmsAiBriefReserve($private,3,1000000);
    aiFails(static fn()=>cmsAiBriefReserve($private,3,1000059),'AI_BRIEF_LIMIT');
    cmsAiBriefReserve($private,3,1000060);cmsAiBriefReserve($private,3,1000120);
    aiFails(static fn()=>cmsAiBriefReserve($private,3,1000180),'AI_BRIEF_LIMIT');
    cmsAiBriefReserve($private,3,1086401);
    file_put_contents($private.'/editorial-drafts/ai-brief-attempts.json','corrupt');
    aiFails(static fn()=>cmsAiBriefReserve($private,3,1086461),'AI_BRIEF_STORE');
    $private=$fresh('race');
    $cfg=aiConfig(static function()use($private,$input,$catalog):string{
        cmsCreationSave($private,['kind'=>'recette','title'=>$input['title'],
            'angle'=>'Projet créé pendant la génération','summary'=>'Résumé',
            'fields'=>[],'research_note'=>'','target_date'=>'','state'=>'draft'],$catalog,0);
        return aiResponse('Un titre proposé différent');
    });
    aiFails(static fn()=>cmsAiBriefGenerate($private,$input,$catalog,$cfg),'CREATION_DUPLICATE');
    aiCheck(count(cmsCreationList(cmsCreationDir($private)))===1,'RACE_DUPLICATE_SAVED');
    echo 'CMS_AI_BRIEFS_OFFLINE_PASS '.json_encode(['families'=>count(cmsCreationKinds()),
        'realProviderCalls'=>0,'humanApproval'=>false],JSON_THROW_ON_ERROR)."\n";
}finally{aiRemove($base);}
