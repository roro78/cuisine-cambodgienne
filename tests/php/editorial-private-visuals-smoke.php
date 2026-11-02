<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/lib.php';
require_once __DIR__.'/../../public/gestion-contenus/visual-provider-adapter.php';
function visualEnsure(bool $ok,string $code):void{if(!$ok)throw new RuntimeException('VISUAL_TEST_'.$code);}
function visualReject(callable $fn,string $code):void{
    try{$fn();throw new RuntimeException('VISUAL_TEST_ACCEPTED_'.$code);}
    catch(InvalidArgumentException|RuntimeException $e){visualEnsure($e->getMessage()===$code,$code.'_GOT_'.$e->getMessage());}
}
$dist=realpath($argv[1]??'');visualEnsure(is_string($dist),'BUILD');
visualEnsure(function_exists('imagewebp'),'GD_WEBP');
$catalog=cmsSourceList(json_decode((string)file_get_contents($dist.'/social-feed.json'),true,64,JSON_THROW_ON_ERROR));
$base=sys_get_temp_dir().'/cdc-visual-unit-'.bin2hex(random_bytes(8));mkdir($base,0700);
$cleanup=function(string $dir)use(&$cleanup,$base):void{
    visualEnsure($dir===$base||str_starts_with($dir,$base.'/'),'CLEANUP_SCOPE');
    foreach(scandir($dir)?:[] as $name){if($name==='.'||$name==='..')continue;$p=$dir.'/'.$name;
        if(is_dir($p)&&!is_link($p))$cleanup($p);else unlink($p);
    }rmdir($dir);
};
try{
    $image=imagecreatetruecolor(1536,1024);imagefill($image,0,0,imagecolorallocate($image,90,140,90));
    imagefilledrectangle($image,700,20,835,90,imagecolorallocate($image,230,30,30));
    ob_start();imagepng($image);$png=ob_get_clean();imagedestroy($image);visualEnsure(is_string($png),'PNG');
    $calls=0;$adapter=static function(array $request)use(&$calls,$png):string{
        $calls++;visualEnsure($request['contract']==='cdc-private-visual-request-v1','CONTRACT');
        visualEnsure(!str_contains($request['prompt'],'PRIVATE_RESEARCH'),'PRIVATE_NOTES_NOT_TRANSMITTED');return $png;
    };
    $intent=['visual_intent'=>str_repeat('a',48)];cmsVisualIntent($intent,str_repeat('a',48));
    visualReject(function()use(&$intent){cmsVisualIntent($intent,str_repeat('a',48));},'VISUAL_INTENT');
    visualEnsure(cmsVisualSettings([])===null,'DISABLED_DEFAULT');
    visualEnsure(cmsVisualOpenAiAdapter(str_repeat('x',32),'gpt-image-1-mini') instanceof Closure,'EXPLICIT_LOW_COST_IMAGE_MODEL');
    visualReject(fn()=>cmsVisualOpenAiAdapter(str_repeat('x',32),'llama3.2:latest'),'VISUAL_PROVIDER_CONFIG');
    visualEnsure(cmsVisualSettings(['editorial_visuals'=>['enabled'=>true,'qualified'=>false]])===null,'QUALIFICATION_GATE');
    $settings=cmsVisualSettings(['editorial_visuals'=>['enabled'=>true,'qualified'=>true,'adapter'=>$adapter,
        'provider_label'=>'synthetic-provider','model_label'=>'synthetic-model','max_attempts_per_day'=>2,
        'reserve_usd_cents_per_attempt'=>50,'max_reserved_usd_cents_per_month'=>300]]);
    $posted=['kind'=>'recette','title'=>'Projet visuel synthétique privé','summary'=>'Fixture locale uniquement',
        'angle'=>'Test du stockage de visuels','fields'=>[],'state'=>'draft','research_note'=>'PRIVATE_RESEARCH'];
    $draft=cmsCreationSave($base,$posted,$catalog,0);
    $input=['description'=>'Illustration de test synthétique pour valider le stockage privé.',
        'rights'=>'Droits synthétiques de test uniquement.','medium'=>'ai_illustration','transmit_confirm'=>'1'];
    visualReject(fn()=>cmsVisualGenerate($base,$draft,$input+[], $settings,1),'VISUAL_CONFLICT');
    $noConsent=$input;$noConsent['transmit_confirm']='0';
    visualReject(fn()=>cmsVisualGenerate($base,$draft,$noConsent,$settings,0),'VISUAL_CONSENT');
    $fakePhoto=$input;$fakePhoto['medium']='documentary_photo';
    visualReject(fn()=>cmsVisualGenerate($base,$draft,$fakePhoto,$settings,0),'VISUAL_BRIEF');
    $injected=$draft;$injected['fields']['audioScript']='PRIVATE_AUDIO';
    visualReject(fn()=>cmsVisualGenerate($base,$injected,$input,$settings,0),'VISUAL_FIELDS');
    visualEnsure($calls===0,'REFUSE_BEFORE_PROVIDER');
    $one=cmsVisualGenerate($base,$draft,$input,$settings,0);
    visualEnsure($calls===1&&$one['version']===1&&!$one['publication_authorized'],'FIRST_CANDIDATE');
    $dir=cmsVisualDirectory($base,$draft['id']);$originalHash=hash_file('sha256',$dir.'/v-0001/meta.json');
    foreach(['original'=>[1536,1024],'site480'=>[480,320],'site800'=>[800,533],'site1200'=>[1200,800],'social'=>[1080,1080]] as $variant=>$size){
        $asset=cmsVisualAsset($dir,$draft['id'],1,$variant);$info=getimagesizefromstring($asset['bytes']);
        visualEnsure([$info[0],$info[1]]===$size,'FORMAT_'.$variant);
        if($variant==='social'){
            $preview=imagecreatefromstring($asset['bytes']);$margin=imagecolorat($preview,540,50);imagedestroy($preview);
            visualEnsure((($margin>>16)&255)<120&&(($margin>>8)&255)>100,'NO_DUPLICATED_SUBJECT_IN_MARGIN');
        }
        visualEnsure((fileperms($dir.'/v-0001/'.$one['assets'][$variant]['name'])&0077)===0,'PRIVATE_MODE');
    }
    visualReject(fn()=>cmsVisualAsset($dir,$draft['id'],1,'../../config.php'),'VISUAL_ASSET');
    cmsVisualApprove($base,$draft,1,'Revue humaine synthétique des droits et cadrages.',true);
    visualEnsure(cmsVisualApproved($dir,$one,$draft),'PRIVATE_APPROVAL');
    cmsVisualSelect($base,$draft,1,1);
    visualEnsure(cmsVisualSelected($dir,$draft)===1,'EXPLICIT_SELECTION');
    $posted['summary']='Version corrigée synthétique';$next=cmsCreationSave($base,$posted,$catalog,1,$draft['id']);
    visualEnsure(!cmsVisualApproved($dir,$one,$next),'DRAFT_CHANGE_INVALIDATES');
    visualEnsure(cmsVisualSelected($dir,$next)===null,'DRAFT_CHANGE_INVALIDATES_SELECTION');
    visualReject(fn()=>cmsVisualApprove($base,$next,1,'Revue humaine synthétique.',true),'VISUAL_DRAFT_STALE');
    visualReject(fn()=>cmsVisualGenerate($base,$draft,$input,$settings,1),'VISUAL_DRAFT_STALE');
    visualEnsure($calls===1,'STALE_BEFORE_PROVIDER');
    file_put_contents(cmsDraftDir($base).'/ai-brief-attempts.json',json_encode([time()-61]));
    $two=cmsVisualGenerate($base,$next,$input,$settings,1);
    visualEnsure($two['version']===2&&$calls===2,'REPLACEMENT_NEW_VERSION');
    visualEnsure(hash_file('sha256',$dir.'/v-0001/meta.json')===$originalHash,'OLD_VERSION_IMMUTABLE');
    visualEnsure(!cmsVisualApproved($dir,$two,$next),'REPLACEMENT_NOT_AUTO_APPROVED');
    visualReject(fn()=>cmsVisualSelect($base,$next,2,2),'VISUAL_DRAFT_STALE');
    visualReject(fn()=>cmsVisualGenerate($base,$next,$input,$settings,2),'AI_BRIEF_LIMIT');
    visualEnsure($calls===2,'QUOTA_BEFORE_PROVIDER');
    file_put_contents(cmsDraftDir($base).'/ai-brief-attempts.json','[]');
    $failing=$settings;$failing['adapter']=static function(array $request):string{throw new RuntimeException('SYNTHETIC_PROVIDER_FAILURE');};
    visualReject(fn()=>cmsVisualGenerate($base,$next,$input,$failing,2),'VISUAL_PROVIDER_FAILED');
    visualEnsure(count(json_decode((string)file_get_contents(cmsDraftDir($base).'/ai-brief-attempts.json'),true))===1,'FAILURE_CONSUMED');
    $reservations=json_decode((string)file_get_contents(cmsDraftDir($base).'/visual-budget.json'),true);
    visualEnsure(count($reservations)===3,'FAILED_CALL_KEEPS_BUDGET_RESERVATION');
    $blocked=$settings;$blocked['max_reserved_usd_cents_per_month']=150;
    file_put_contents(cmsDraftDir($base).'/ai-brief-attempts.json','[]');
    visualReject(fn()=>cmsVisualGenerate($base,$next,$input,$blocked,2),'VISUAL_BUDGET');
    visualEnsure($calls===2,'MONTHLY_ALLOWANCE_BEFORE_PROVIDER');
    visualEnsure(cmsVisualLatest($dir,$draft['id'])['version']===2,'FAILED_REPLACEMENT_PRESERVES_IMAGE');
    file_put_contents(cmsDraftDir($base).'/ai-brief-attempts.json','[]');
    $concurrent=$settings;$concurrent['adapter']=static function(array $request)use($base,$posted,$catalog,$next,$png):string{
        $changed=$posted;$changed['summary']='Modification concurrente synthétique';
        cmsCreationSave($base,$changed,$catalog,2,$next['id']);return $png;
    };
    visualReject(fn()=>cmsVisualGenerate($base,$next,$input,$concurrent,2),'VISUAL_DRAFT_STALE');
    visualEnsure(cmsVisualLatest($dir,$draft['id'])['version']===2,'CONCURRENT_DRAFT_NOT_OVERWRITTEN');
    file_put_contents($dir.'/v-0002/social.jpg','tampered');
    visualReject(fn()=>cmsVisualAsset($dir,$draft['id'],2,'social'),'VISUAL_ASSET');
    foreach(array_keys(cmsCreationKinds()) as $kind){
        $brief=cmsVisualBriefDraft($kind,['subject'=>'Fixture','description'=>'Description synthétique','medium'=>'ai_illustration']);
        visualEnsure($brief['validation']==='pending','FIVE_FAMILY_BRIEF');
        $fields=cmsCreationCleanFields($kind,[]);
        visualEnsure(cmsVisualPublicFields(['kind'=>$kind,'fields'=>$fields])===$fields,'FIVE_FAMILY_PUBLIC_PROJECTION');
    }
    mkdir($base.'/selection-case',0700);$choiceBase=$base.'/selection-case';
    $choice=cmsCreationSave($choiceBase,$posted,$catalog,0);
    $v1=cmsVisualGenerate($choiceBase,$choice,$input,$settings,0);
    file_put_contents(cmsDraftDir($choiceBase).'/ai-brief-attempts.json',json_encode([time()-61]));
    $v2=cmsVisualGenerate($choiceBase,$choice,$input,$settings,1);
    cmsVisualApprove($choiceBase,$choice,1,'Revue explicite de la première version conservée.',true,2);
    cmsVisualSelect($choiceBase,$choice,1,2);
    $choiceDir=cmsVisualDirectory($choiceBase,$choice['id']);
    visualEnsure(cmsVisualSelected($choiceDir,$choice)===1,'OLDER_VERSION_SELECTABLE');
    visualReject(fn()=>cmsVisualSelect($choiceBase,$choice,1,1),'VISUAL_DRAFT_STALE');
    visualEnsure(!cmsVisualApproved($choiceDir,$v2,$choice),'OTHER_VERSION_NOT_APPROVED');
    echo "CMS_PRIVATE_VISUALS_PASS synthetic provider only; consent, five family brief, real GD formats, private versions, stale guards, human review, quota, tamper rejection; realProviderCalls=0\n";
}finally{$cleanup($base);}
