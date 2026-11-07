<?php
declare(strict_types=1);
require_once __DIR__.'/fixtures/editorial-workshop-proposal.php';
function completeCheck(bool $v,string $s):void{if(!$v)throw new RuntimeException('COMPLETE_WORKSHOP_'.$s);}
function completeReject(callable $f,string $code):void{try{$f();}catch(Throwable $e){completeCheck($e->getMessage()===$code,'EXPECTED_'.$code);return;}throw new RuntimeException('UNEXPECTED_ACCEPT_'.$code);}
$f=completeWorkshopFixture($argv[1]);extract($f);
$private=sys_get_temp_dir().'/cdc-complete-'.bin2hex(random_bytes(8));mkdir($private,0700);
$remove=static function(string $dir)use(&$remove,$private):void{
 if($dir!==$private&&!str_starts_with($dir,$private.'/'))throw new RuntimeException('CLEANUP_SCOPE');
 foreach(scandir($dir)?:[] as $n){if($n==='.'||$n==='..')continue;$p=$dir.'/'.$n;if(is_dir($p)&&!is_link($p))$remove($p);else unlink($p);}rmdir($dir);
};
try{
 $saved=cmsCreationSave($private,['kind'=>'atelier','title'=>$draft['title'],'angle'=>$draft['angle'],
  'state'=>'draft','fields'=>[],'atelier_reference'=>$draft['atelier_reference']],$catalog,0);
 $calls=0;$settings=['mode'=>'async','max_attempts_per_day'=>5,'provider_label'=>'synthetic-provider',
  'model_label'=>'synthetic-model','workshop_complete_qualified'=>true,'workshop_creation_id'=>$saved['id'],
  'workshop_recipe_sha256'=>$canonical['recette:amok-trey']['fingerprint'],'workshop_expires_at'=>time()+3600,
  'workshop_research'=>$research,
  'submit'=>static function(array $r,string $id)use(&$calls):array{++$calls;return ['id'=>$id,'status'=>'queued'];},
  'poll'=>static fn(string $id):array=>['id'=>$id,'status'=>'succeeded','result'=>json_encode([...$phase,'chapters'=>$chapters],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]];
 $all=[$saved['id']=>$saved];completeCheck(cmsCoralNextWorkshop($all,$catalog,$settings)['id']===$saved['id'],'CALENDAR_REUSES_EXISTING_ID');
 $published=$saved;$published['id']='c-'.str_repeat('c',24);$published['source_binding']=['source_id'=>'atelier:published'];$published['target_date']=gmdate('Y-m-d',time()+86400);
 completeCheck(cmsCoralNextWorkshop([...$all,$published['id']=>$published],$catalog,$settings)['id']===$saved['id'],'PUBLISHED_DATE_PRESERVED');
 $technical=$published;unset($technical['source_binding']);$technical['id']='c-'.str_repeat('d',24);$technical['title']='Qualification privée';$technical['slug']='qualification-privee';
 $scoped=$settings;$scoped['workshop_excluded_creation_ids']=[$technical['id']];
 completeCheck(cmsCoralNextWorkshop([...$all,$technical['id']=>$technical],$catalog,$scoped)['id']===$saved['id'],'EXPLICIT_QUARANTINE');
 completeReject(fn()=>cmsCoralNextWorkshop([...$all,$technical['id']=>$technical],$catalog,$settings),'CORAL_WORKSHOP_PRIORITY_NOT_AUTHORIZED');
 $job=cmsCoralStart($saved,$catalog,$canonical,$guided,$private,$settings);
 $same=cmsCoralStart($saved,$catalog,$canonical,$guided,$private,$settings);
 completeCheck($job['token']===$same['token']&&$calls===1,'ONE_SCOPED_JOB');
 $wrong=$settings;$wrong['workshop_creation_id']='c-'.str_repeat('a',24);
 completeReject(fn()=>cmsCoralStart($saved,$catalog,$canonical,$guided,$private,$wrong),'CORAL_WORKSHOP_SCOPE');
 $expired=$settings;$expired['workshop_expires_at']=time()-1;
 completeReject(fn()=>cmsCoralStart($saved,$catalog,$canonical,$guided,$private,$expired),'CORAL_WORKSHOP_SCOPE');
 $proposal=cmsCoralPoll($job,$saved,$settings,$canonical,$catalog);
 completeCheck(cmsAtelierPhaseDetailsComplete($proposal['supplement']['atelier_phase_details']),'SIX_COMPLETE_PHASES');
 completeCheck(cmsAtelierScriptsDraftComplete($proposal['supplement']['atelier_scripts']),'SEVEN_DRAFT_SCRIPTS');
 completeCheck(str_contains(implode(' ', $proposal['candidate']['fields']['beforeStarting']),'Allergènes à vérifier : poisson, œuf.'),'EDITABLE_ALLERGEN_PROJECTION');
 completeCheck($proposal['metadata']['scope']==='workshop-complete-draft-v1','EXACT_PROVENANCE_SCOPE');
 completeCheck(cmsCreationRead(cmsCreationDir($private),$saved['id'])['version']===1,'NO_AUTOSAVE');
 $candidate=$proposal['candidate'];
 $posted=['kind'=>'atelier','title'=>$candidate['title'],'angle'=>$candidate['angle'],'summary'=>$candidate['summary'],
  'research_note'=>$candidate['research_note'],'fields'=>$candidate['form_fields'],'state'=>'draft',...$proposal['supplement']];
 $pending=['creation_id'=>$saved['id'],'expected_version'=>1,'expires_at'=>time()+1800,
  'metadata'=>$proposal['metadata'],'async_job_token'=>$job['token']];
 $v2=cmsAiContentSave($private,$posted,$catalog,1,$saved['id'],$pending,$canonical);
 completeCheck($v2['version']===2&&$v2['id']===$saved['id']&&$v2['origin']==='ai'&&$v2['reviewed']===false,'COMMON_VERSIONED_PRIVATE_SAVE');
 completeCheck(cmsAtelierScriptsDraftComplete($v2['atelier_scripts']),'SCRIPT_BINDING_SURVIVES_SAVE');
 completeCheck(cmsCreationRead(cmsCreationDir($private),$saved['id'],1)===$saved,'ORIGINAL_UNCHANGED');
 $again=cmsAiContentSave($private,$posted,$catalog,1,$saved['id'],$pending,$canonical);
 completeCheck($again===$v2,'IDEMPOTENT_SAVE');
 completeReject(fn()=>cmsCoralNextWorkshop([$v2['id']=>$v2],$catalog,$settings),'CORAL_WORKSHOP_ALREADY_PREPARED');
 $bad=$phase;$bad['phase_details'][0]['ingredientNames']=['Invented ingredient'];
 completeReject(fn()=>cmsCoralWorkshopCandidate($job['request'],json_encode([...$bad,'chapters'=>$chapters]),$settings,$catalog),'CORAL_WORKSHOP_INGREDIENTS');
 $bad=$proposal['metadata'];$bad['approved']=true;
 completeReject(fn()=>cmsAiContentMetadata($bad),'AI_CONTENT_PROVENANCE');
 echo "COMPLETE_WORKSHOP_OFFLINE_PASS common private form/save, source-bound 6 phases + 7 texts, 1 job, no approval, realProviderCalls=0\n";
}finally{$remove($private);}
