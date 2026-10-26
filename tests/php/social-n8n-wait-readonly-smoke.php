<?php
declare(strict_types=1);
require __DIR__ . '/../../public/gestion-social/n8n-wait-readonly.php';
function existingWaitUrl(mixed $url): ?string {
    return is_string($url)&&preg_match(
        '~^https://n8n[.]orvekio[.]com/form-waiting/[0-9]+\?signature=[a-f0-9]{32}$~D',$url) ? $url:null;
}
function requireTrue(bool $ok,string $message):void {if(!$ok)throw new RuntimeException($message);}
$id='9007199254740993';$workflow='test_workflow_id';
$post=['id'=>$id,'status'=>'draft','human_decision'=>null,'source_id'=>'culture:riz',
  'source_fingerprint'=>'aaaaaaaaaaaaaaaa','scheduled_date'=>'2026-10-26',
  'facebook_caption'=>'FB caption','instagram_caption'=>'IG caption','image_url'=>'https://www.cuisine-du-cambodge.com/social-assets/culture-riz.jpg'];
$preview=['sourceId'=>$post['source_id'],'fingerprint'=>$post['source_fingerprint'],
 'scheduledDate'=>$post['scheduled_date'],'facebookCaption'=>$post['facebook_caption'],
 'instagramCaption'=>$post['instagram_caption'],'imageUrl'=>$post['image_url']];
$url='https://n8n.orvekio.com/form-waiting/123?signature=0123456789abcdef0123456789abcdef';
$execution=['workflowId'=>$workflow,'status'=>'waiting','data'=>['resultData'=>['runData'=>[
 'Enregistrer le brouillon'=>[['data'=>['main'=>[[['json'=>['id'=>$id]]]]]]],
 'Vérifier et cadrer les textes'=>[['data'=>['main'=>[[['json'=>$preview]]]]]],
 'Attendre une décision via formulaire'=>[['metadata'=>['resumeFormUrl'=>$url]]]
]]]];
requireTrue(socialPostId($id)===$id,'BIGINT string must remain exact');
requireTrue(socialPostId('9223372036854775808')===null,'Out-of-range BIGINT accepted');
requireTrue(socialExecutionWaitLinks([$execution],[$post],$workflow)===[$id=>$url],'Valid waiting form not matched');
foreach(['status','workflow','fingerprint','caption','post-status','post-id','signature','metadata','duplicate'] as $failure) {
  $items=[$execution];$row=$post;
  switch($failure){
    case 'status':$items[0]['status']='success';break;
    case 'workflow':$items[0]['workflowId']='another';break;
    case 'fingerprint':$items[0]['data']['resultData']['runData']['Vérifier et cadrer les textes'][0]['data']['main'][0][0]['json']['fingerprint']='bbbbbbbbbbbbbbbb';break;
    case 'caption':$items[0]['data']['resultData']['runData']['Vérifier et cadrer les textes'][0]['data']['main'][0][0]['json']['facebookCaption']='TAMPERED';break;
    case 'post-status':$row['status']='published';break;
    case 'post-id':$items[0]['data']['resultData']['runData']['Enregistrer le brouillon'][0]['data']['main'][0][0]['json']['id']='77';break;
    case 'signature':$items[0]['data']['resultData']['runData']['Attendre une décision via formulaire'][0]['metadata']['resumeFormUrl']='https://malicious.test/form-waiting/123';break;
    case 'metadata':$items[0]['data']['resultData']['runData']['Attendre une décision via formulaire'][0]['metadata']=[];break;
    case 'duplicate':$items[]=$items[0];break;
  }
  requireTrue(socialExecutionWaitLinks($items,[$row],$workflow)===[],'Unsafe mapping for '.$failure);
}
requireTrue(socialExistingN8nWaitLinks([],[$post])===null,'Missing config must not access n8n');

$cfg=['n8n_readonly_api_key'=>str_repeat('a',32),'n8n_social_workflow_id'=>$workflow];
$requests=[];
$workflowDefinition=['id'=>$workflow,'name'=>'Cuisine du Cambodge - 01 - Brouillon IA et validation email',
 'nodes'=>[['name'=>'Attendre une décision via formulaire',
            'type'=>'n8n-nodes-base.wait','parameters'=>['resume'=>'form']]]];
$detail=['id'=>'123']+$execution;
$reader=static function(string $requested,string $apiKey) use (&$requests,$workflowDefinition,$workflow,$detail):?array {
  $requests[]=$requested;
  requireTrue($apiKey===str_repeat('a',32),'Unexpected credential');
  if(str_contains($requested,'/workflows/'))return $workflowDefinition;
  if(str_contains($requested,'/executions?'))return ['data'=>[
    ['id'=>'123','workflowId'=>$workflow,'status'=>'waiting']
  ]];
  if(str_contains($requested,'/executions/123?includeData=true'))return $detail;
  throw new RuntimeException('Unexpected read URL');
};
requireTrue(socialExistingN8nWaitLinks($cfg,[$post],$reader)===[$id=>$url],
 'Split list/detail API GET did not find exact existing Wait form');
requireTrue(count($requests)===3,'Expected workflow, list and detailed execution GET');
requireTrue(!str_contains($requests[1],'includeData=true'),
 'Listing must avoid heavyweight execution payloads');
requireTrue(str_contains($requests[2],'/executions/123?includeData=true'),
 'Read full waiting execution only by ID');
foreach(['wrong-id','stale-status','redacted','truncated','duplicate','wrong-workflow'] as $flaw) {
 $badReader=static function(string $request,string $apiKey)use($reader,$flaw,$detail):?array{
  if(str_contains($request,'/executions?')){
   if($flaw==='truncated')return ['data'=>[
      ['id'=>'123','workflowId'=>'test_workflow_id','status'=>'waiting']
    ],'nextCursor'=>'more'];
   if($flaw==='duplicate')return ['data'=>[
     ['id'=>'123','workflowId'=>'test_workflow_id','status'=>'waiting'],
     ['id'=>'123','workflowId'=>'test_workflow_id','status'=>'waiting']
   ]];
  }
  if(str_contains($request,'/executions/123?includeData=true')){
    $d=$detail;
    if($flaw==='wrong-id')$d['id']='999';
    if($flaw==='stale-status')$d['status']='success';
    if($flaw==='redacted')unset($d['data']);
    if($flaw==='wrong-workflow')$d['workflowId']='foreign';
    return $d;
  }
  return $reader($request,$apiKey);
 };
 requireTrue(socialExistingN8nWaitLinks($cfg,[$post],$badReader)===null,
   'Fail-closed n8n API invariant violated: '.$flaw);
}

echo "SOCIAL_EXISTING_N8N_WAIT_READONLY_PASS\n";
