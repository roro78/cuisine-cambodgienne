<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/lib.php';
function contentCheck(bool $ok,string $why):void {
    if(!$ok)throw new RuntimeException('AI_CONTENT_TEST_'.$why);
}
function contentFails(callable $fn,string $code='AI_CONTENT_RESPONSE'):void {
    $caught=null;try{$fn();}catch(Throwable $e){$caught=$e;}
    contentCheck($caught!==null&&$caught->getMessage()===$code,'EXPECTED_'.$code);
}
function contentJson(mixed $value):string {
    return json_encode($value,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
}
function contentFixture(string $kind):array {
    $fields=[
        'recette'=>['intro'=>'Introduction témoin','description'=>'Description témoin',
            'context'=>'Contexte à vérifier','baseServings'=>4,'prepTime'=>'À vérifier',
            'cookTime'=>'À vérifier','ingredients'=>[
                ['quantity'=>'','unit'=>'','name'=>'Ingrédient témoin']],
            'steps'=>[['title'=>'Étape témoin','text'=>'Utiliser l’ingrédient témoin.']],
            'equipment'=>[]],
        'culture'=>['eyebrow'=>'Mémoire','intro'=>'Introduction documentaire témoin',
            'seoDescription'=>'Description témoin','readingTime'=>'À vérifier',
            'sections'=>[['title'=>'Section témoin','paragraphs'=>['Premier paragraphe.','Second paragraphe.']]]],
        'atelier'=>['intro'=>'Présentation témoin','learningGoal'=>'Objectif à vérifier',
            'finalPreparation'=>'Résultat à vérifier','portionLabel'=>'Selon la recette source',
            'beforeStarting'=>['Consulter la recette.'],'equipment'=>['Matériel de la recette.'],
            'phases'=>array_map(static fn(string $id):array=>[
                'title'=>'Phase '.$id,'learning'=>'Objectif à vérifier pour '.$id],
                ['installer','preparer','assembler','maitriser','rectifier','terminer'])],
        'ingredient'=>['intro'=>'Introduction témoin','seoDescription'=>'Description témoin',
            'role'=>'Rôle à vérifier','deepDive'=>['Contexte à vérifier.'],
            'profile'=>['Profil à vérifier.'],'uses'=>['Usage à vérifier.'],
            'tips'=>['Conseil à vérifier.'],'choose'=>['Choix à vérifier.'],
            'keep'=>['Conservation à vérifier.'],'pairings'=>['Accord à vérifier.'],
            'mistakes'=>['Erreur à vérifier.'],'seoKeywords'=>['Terme témoin']],
        'technique'=>['description'=>'Description témoin','introduction'=>'Introduction témoin',
            'preparation'=>'À vérifier','yieldLabel'=>'À vérifier','supplies'=>['Matériel témoin'],
            'steps'=>[['title'=>'Geste témoin','text'=>'Repère à vérifier.']],
            'alternatives'=>[['title'=>'Alternative témoin','text'=>'À vérifier.']],
            'questions'=>[['question'=>'Question témoin ?','answer'=>'Réponse à vérifier.']]]
    ];
    return ['title'=>'Candidat témoin '.$kind,'angle'=>'Angle à vérifier',
        'summary'=>'<script>Texte synthétique</script>',
        'research_note'=>'PRIVATE_RESEARCH_NOT_FOR_PUBLIC_PREVIEW','fields'=>$fields[$kind]];
}
$root=realpath($argv[1]??'');contentCheck(is_string($root),'DIST_REQUIRED');
$read=static fn(string $file):array=>json_decode(file_get_contents($root.'/'.$file),true,64,JSON_THROW_ON_ERROR);
$catalog=cmsSourceList($read('social-feed.json'));
$canonical=cmsCanonicalSourceList($read('editorial-source-index.json'),$catalog);
$guided=cmsGuidedSourceList($read('editorial-guided-fields.json'),$canonical);
cmsAssertGuidedCoverage($guided,$canonical);
$recipe='';foreach($canonical as $id=>$item)if($item['model']==='recipes'){$recipe=$id;break;}
contentCheck($recipe!=='','REAL_RECIPE_REQUIRED');
foreach(cmsCreationKinds() as $kind=>$label){
    $input=['kind'=>$kind,'title'=>'Projet synthétique '.$kind,'angle'=>'Angle à vérifier',
        'objective'=>'Objectif à vérifier','context'=>'ONLY_EXPLICIT_CONTEXT',
        'reference_id'=>$kind==='atelier'?$recipe:'','semantic_review'=>'1'];
    $request=cmsAiContentRequest($input,$catalog,$canonical,$guided);
    contentCheck($request['scope']==='creation-form-core-v1','SCOPE');
    $schema=$request['response_schema'];
    contentCheck(array_keys($schema['properties']['fields']['properties'])===
        array_keys(cmsCreationSchema()[$kind]),'ONE_FORM_SCHEMA');
    contentCheck($schema['additionalProperties']===false,'CLOSED_ROOT');
    contentCheck($schema['properties']['fields']['additionalProperties']===false,'CLOSED_FIELDS');
    $fixture=contentFixture($kind);
    $candidate=cmsAiContentCandidate($kind,contentJson($fixture));
    contentCheck($candidate['publication_ready']===false
        &&$candidate['requires_human_review']===true,'NO_APPROVAL');
    foreach(['id','version','state','origin','ai_brief','target_date','channels'] as $key)
        contentCheck(!array_key_exists($key,$candidate),'NO_STORAGE_AUTHORITY_'.$key);
    contentCheck(cmsCreationCleanFields($kind,$candidate['form_fields'])===$candidate['fields'],
        'COMMON_VALIDATOR_PARITY');
    $html=cmsCreationFormHtml($kind,$candidate['fields']);
    $preview=cmsGuidedPreviewHtml('fields',$candidate['fields']);
    contentCheck(str_contains($html,'name="fields['),'COMMON_FORM');
    contentCheck(!str_contains($preview,'PRIVATE_RESEARCH_NOT_FOR_PUBLIC_PREVIEW'),'PRIVATE_NOT_IN_FIELDS');
    $xss=$fixture;$first=array_key_first($xss['fields']);$xss['fields'][$first]='<script>unsafe</script>';
    $escaped=cmsAiContentCandidate($kind,contentJson($xss));
    contentCheck(!str_contains(cmsCreationFormHtml($kind,$escaped['fields']),'<script>unsafe'), 'FORM_XSS');
    contentCheck(str_contains(cmsGuidedPreviewHtml('fields',$escaped['fields']),'&lt;script&gt;'),'PREVIEW_XSS');
    // The model cannot set identity, approval, sources, media or private state.
    foreach(['state'=>'published','reviewed'=>true,'origin'=>'manual','audioScript'=>'hidden',
        'image'=>'/image.jpg','sources'=>[]] as $key=>$extra){
        $bad=$fixture;$bad[$key]=$extra;
        contentFails(static fn()=>cmsAiContentCandidate($kind,contentJson($bad)));
        $bad=$fixture;$bad['fields'][$key]=$extra;
        contentFails(static fn()=>cmsAiContentCandidate($kind,contentJson($bad)));
    }
    foreach(array_keys($fixture['fields']) as $key){
        $bad=$fixture;unset($bad['fields'][$key]);
        contentFails(static fn()=>cmsAiContentCandidate($kind,contentJson($bad)));
    }
    $bad=$fixture;$bad['fields']=(object)[];
    contentFails(static fn()=>cmsAiContentCandidate($kind,contentJson($bad)));
    $bad=$fixture;$bad['angle']=false;
    contentFails(static fn()=>cmsAiContentCandidate($kind,contentJson($bad)));
    $bad=$fixture;$bad['summary']="  \n ";
    contentFails(static fn()=>cmsAiContentCandidate($kind,contentJson($bad)));
    $bad=$fixture;$bad['title']="Hidden\x01control";
    contentFails(static fn()=>cmsAiContentCandidate($kind,contentJson($bad)));
}
$recipeFixture=contentFixture('recette');
foreach(['4',4.5,0,101,null,true] as $portions){
    $bad=$recipeFixture;$bad['fields']['baseServings']=$portions;
    contentFails(static fn()=>cmsAiContentCandidate('recette',contentJson($bad)));
}
foreach([[],(object)[],['name'=>'Only a name'],['quantity'=>'','unit'=>'','name'=>'Name','scalable'=>false]] as $row){
    $bad=$recipeFixture;$bad['fields']['ingredients']=[$row];
    contentFails(static fn()=>cmsAiContentCandidate('recette',contentJson($bad)));
}
$bad=$recipeFixture;$bad['fields']['equipment']=['One line' . "\n" . 'A hidden extra item'];
contentFails(static fn()=>cmsAiContentCandidate('recette',contentJson($bad)));
$bad=$recipeFixture;$bad['fields']['equipment']=array_fill(0,10,str_repeat('a',1000));
contentFails(static fn()=>cmsAiContentCandidate('recette',contentJson($bad)));
$bad=$recipeFixture;$bad['fields']['steps']=array_fill(0,26,['title'=>'Title','text'=>'Text']);
contentFails(static fn()=>cmsAiContentCandidate('recette',contentJson($bad)));
$bad=contentFixture('culture');$bad['fields']['sections'][0]['paragraphs']="Not an array";
contentFails(static fn()=>cmsAiContentCandidate('culture',contentJson($bad)));
$bad=contentFixture('culture');$bad['fields']['sections'][0]['paragraphs']=["One\n\nTwo"];
contentFails(static fn()=>cmsAiContentCandidate('culture',contentJson($bad)));
foreach([5,7] as $count){
    $bad=contentFixture('atelier');$bad['fields']['phases']=array_fill(0,$count,['title'=>'Phase','learning'=>'Goal']);
    contentFails(static fn()=>cmsAiContentCandidate('atelier',contentJson($bad)));
}
foreach(['not json','[]','{}',str_repeat(' ',60001),"\xff",null,[]] as $bad)
    contentFails(static fn()=>cmsAiContentCandidate('recette',$bad));
// Canonical recipe data, not an excerpt or arbitrary source, is mandatory for workshops.
$input=['kind'=>'atelier','title'=>'Atelier témoin','angle'=>'Angle','objective'=>'Objectif',
    'reference_id'=>$recipe,'semantic_review'=>'1'];
contentFails(static fn()=>cmsAiContentRequest($input,$catalog),'AI_CONTENT_REFERENCE');
$badGuided=$guided;$badGuided[$recipe]['fingerprint']=str_repeat('f',64);
contentFails(static fn()=>cmsAiContentRequest($input,$catalog,$canonical,$badGuided),'AI_CONTENT_REFERENCE');
$badGuided=$guided;$badGuided[$recipe]['fields']['audioScript']='PRIVATE_AUDIO_MUST_NOT_LEAVE';
contentFails(static fn()=>cmsAiContentRequest($input,$catalog,$canonical,$badGuided),'AI_CONTENT_REFERENCE');
$badCanonical=$canonical;$badCanonical[$recipe]['model']='restoredRecipes';
contentFails(static fn()=>cmsAiContentRequest($input,$catalog,$badCanonical,$guided),'AI_CONTENT_REFERENCE');
$request=cmsAiContentRequest($input,$catalog,$canonical,$guided);
contentCheck($request['reference']['recipe_fields']['ingredients']===$guided[$recipe]['fields']['ingredients'],
    'CANONICAL_INGREDIENTS');
contentCheck($request['reference']['fingerprint']===$canonical[$recipe]['fingerprint'],'SOURCE_TRACE');
$badCatalog=$catalog;$badCatalog[$recipe]['private_secret']='PRIVATE_CONFIG_MUST_NOT_LEAVE';
$badGuided=$guided;$badGuided[$recipe]['unrelated_private']='PRIVATE_DRAFT_MUST_NOT_LEAVE';
$request=cmsAiContentRequest($input,$badCatalog,$canonical,$badGuided);
contentCheck(!str_contains(contentJson($request),'MUST_NOT_LEAVE'),'NO_WHOLE_OBJECT_EXPORT');
foreach(['sources','audioScript','audioUrl','review','image'] as $key)
    contentCheck(!array_key_exists($key,$request['reference']['recipe_fields']),'PUBLIC_REFERENCE_ALLOWLIST');
$input['semantic_review']='0';
contentFails(static fn()=>cmsAiContentRequest($input,$catalog,$canonical,$guided),'AI_BRIEF_REVIEW_REQUIRED');
echo 'CMS_AI_CONTENT_CONTRACT_OFFLINE_PASS '.contentJson([
    'families'=>count(cmsCreationKinds()),'realProviderCalls'=>0,'savedCandidates'=>0,
    'humanApproval'=>false,'scope'=>'creation-form-core-v1'])."\n";
