<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/lib.php';
function requireCreation(bool $pass,string $why):void {
    if(!$pass)throw new RuntimeException('CREATION_SMOKE_'.$why);
}
$root=realpath($argv[1]??'');
if(!$root)throw new RuntimeException('DIST_REQUIRED');
$feed=json_decode(file_get_contents($root.'/social-feed.json'),true,32,JSON_THROW_ON_ERROR);
$published=cmsSourceList($feed);
requireCreation(count($published)>20,'REAL_CATALOG_MISSING');
$base=sys_get_temp_dir().'/cdc-new-content-'.bin2hex(random_bytes(8));
if(!mkdir($base,0700))throw new RuntimeException('TEMP_FAILED');
function createInput(string $kind,string $title):array{
    $fields=[];
    foreach(cmsCreationSchema()[$kind] as $key=>$spec){
        if($spec[1]==='rows'){
            $row=[];
            foreach($spec[2] as $k=>$label)$row[$k]='Valeur '.$k;
            if(isset($row['paragraphs']))$row['paragraphs']="Premier paragraphe.\n\nSecond paragraphe.";
            if(isset($row['quantity']))$row['quantity']='500';
            $fields[$key]=[$row];
        }elseif($spec[1]==='list'){
            $fields[$key]="Première ligne\nDeuxième ligne";
        }else $fields[$key]=$key==='baseServings'?'4':'Texte pédagogique complet';
    }
    return [
      'kind'=>$kind,'title'=>$title,'angle'=>'Angle éditorial unique pour cette page',
      'summary'=>'Résumé de la page préparée.','fields'=>$fields,
      'research_note'=>'Vérification de travail privée, ne jamais publier',
      'target_date'=>'2026-11-12','state'=>'draft'
    ];
}
function cleanupCreation(string $folder):void {
    if(!is_dir($folder))return;
    foreach(scandir($folder)?:[] as $name){
        if($name==='.'||$name==='..')continue;
        $path=$folder.'/'.$name;
        if(is_dir($path))cleanupCreation($path);
        else unlink($path);
    }
    rmdir($folder);
}
try{
    $dir=cmsCreationDir($base);
    $first=null;
    $count=0;
    foreach(cmsCreationKinds() as $kind=>$name){
        $posted=createInput($kind,'Nouvelle page témoin '.$name);
        $record=cmsCreationSave($base,$posted,$published,0);
        $count++;
        requireCreation($record['version']===1 && $record['kind']===$kind,'SAVE_'.$kind);
        requireCreation($record['origin']==='manual','NO_AUTOPUBLISH_'.$kind);
        requireCreation($record['reviewed']===false,'NO_APPROVAL_'.$kind);
        requireCreation($record['state']==='draft','DRAFT_ONLY_'.$kind);
        requireCreation(cmsCreationRead($dir,$record['id'])===$record,'READ_'.$kind);
        requireCreation(cmsCreationReady($kind,$record['fields'],$record['summary']),
            'FIELDS_'.$kind);
        $html=cmsCreationFormHtml($kind,$record['fields']);
        requireCreation(str_contains($html,'name="fields['),'SHARED_FORM_'.$kind);
        requireCreation(!str_contains($html,'audioScript'),'MP3_EXPOSED_'.$kind);
        $preview=cmsGuidedPreviewHtml('fiche',$record['fields']);
        requireCreation(str_contains($preview,'preview-fields'),'PREVIEW_'.$kind);
        $posted['state']='review';
        $version2=cmsCreationSave($base,$posted,$published,1,$record['id']);
        requireCreation($version2['version']===2 && $version2['state']==='review',
            'REVIEW_'.$kind);
        requireCreation(cmsCreationRead($dir,$record['id'],1)['state']==='draft',
            'HISTORY_MUTATED_'.$kind);
        $conflict=false;
        try{cmsCreationSave($base,$posted,$published,1,$record['id']);}
        catch(RuntimeException $e){$conflict=$e->getMessage()==='CREATION_CONFLICT';}
        requireCreation($conflict,'CONCURRENT_VERSION_ACCEPTED_'.$kind);
        $duplicate=false;
        try{cmsCreationSave($base,$posted,$published,0);}
        catch(InvalidArgumentException $e){$duplicate=$e->getMessage()==='CREATION_DUPLICATE';}
        requireCreation($duplicate,'PLANNED_DUPLICATE_ACCEPTED_'.$kind);
        if($first===null)$first=$record;
    }
    requireCreation(count(cmsCreationList($dir))===$count,'PLANNED_CATALOG');
    // Calendar must accept actual append-only draft records, not only synthetic fixtures.
    $calendar=cmsCalendarPlan(cmsCreationList($dir),'2026-11');
    requireCreation($calendar['total']===$count
        && $calendar['month_count']===$count
        && $calendar['undated_count']===0,
        'REAL_PERSISTED_DRAFTS_CALENDAR');
    // Block published content title of the SAME kind; preserve complementary cultural angles.
    $publishedRecipe=null;
    foreach($published as $page)if($page['kind']==='recette'){$publishedRecipe=$page;break;}
    requireCreation(is_array($publishedRecipe),'PUBLISHED_RECIPES');
    $blocked=false;
    try{
        cmsCreationSave($base,createInput('recette',$publishedRecipe['title']),$published,0);
    }catch(InvalidArgumentException $e){$blocked=$e->getMessage()==='CREATION_DUPLICATE';}
    requireCreation($blocked,'PUBLISHED_DUPLICATE_ACCEPTED');
    $cultural=createInput('culture',$publishedRecipe['title']);
    $ok=cmsCreationSave($base,$cultural,$published,0);
    requireCreation($ok['kind']==='culture','CROSS_FAMILY_BLOCKED');
    $incomplete=createInput('recette','Projet encore incomplet');
    $incomplete['fields']=[];
    $draft=cmsCreationSave($base,$incomplete,$published,0);
    requireCreation($draft['state']==='draft','INCOMPLETE_DRAFT_BLOCKED');
    $incomplete['state']='review';
    $reject=false;
    try{cmsCreationSave($base,$incomplete,$published,1,$draft['id']);}
    catch(InvalidArgumentException $e){$reject=$e->getMessage()==='CREATION_INCOMPLETE';}
    requireCreation($reject,'INCOMPLETE_REVIEW_ACCEPTED');
    $xss=cmsCreationFormHtml('culture',[
        'intro'=>'<img src=x onerror=alert(1)>',
        'sections'=>[['title'=>'<script>alert(1)</script>',
          'paragraphs'=>['Paragraphe propre']]]
    ]);
    requireCreation(!str_contains($xss,'<img')&&!str_contains($xss,'<script')
        && str_contains($xss,'&lt;script&gt;'),'HTML_XSS');
    requireCreation(!is_file($root.'/gestion-contenus/new-content.json'),
        'PUBLIC_PRIVATE_MIXUP');
    echo 'CMS_CREATION_MANUAL_PASS '.json_encode([
        'families'=>$count,'catalog'=>count($published),
        'privateVersions'=>2,'duplicateGuards'=>2,
        'humanReviewRequired'=>true],JSON_THROW_ON_ERROR)."\n";
}finally{cleanupCreation($base);}
