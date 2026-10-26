<?php
declare(strict_types=1);
/**
 * Optional GET-ONLY connector to an existing n8n Workflow 01 waiting execution.
 * NO PATCH/POST and NO execution creation. Signed URL stays server-side
 * until an authenticated POST/CSRF handoff has revalidated draft/version.
 */
function socialPostId(mixed $value): ?string {
    if (is_int($value)) $value = (string)$value;
    if (!is_string($value) || !preg_match('/^[1-9][0-9]{0,18}$/D',$value))return null;
    return strlen($value)<19 || strcmp($value,'9223372036854775807')<=0 ? $value : null;
}
/**
 * A draft is eligible for a link ONLY if absolutely no decision or Meta
 * publication can already have started. Unknown/missing state fails closed.
 */
function socialIsUndecidedDraft(array $post): bool {
    if (socialPostId($post['id']??null)===null
        || ($post['status']??null)!=='draft'
        || ($post['fb_state']??null)!=='pending'
        || ($post['ig_state']??null)!=='pending')return false;
    foreach(['human_decision','decided_at','approved_at','published_at',
             'facebook_post_id','instagram_post_id','instagram_container_id'] as $field){
        if(!array_key_exists($field,$post) || $post[$field]!==null)return false;
    }
    return true;
}

function socialRunOutput(array $data,string $node): ?array {
    $value=$data[$node][0]['data']['main'][0][0]['json']??null;
    return is_array($value)?$value:null;
}
function socialExecutionWaitLinks(array $executions,array $posts,string $workflowId): array {
    $target=[];
    foreach($posts as $post){
        $id=socialPostId($post['id']??null);
        if($id===null || !socialIsUndecidedDraft($post))continue;
        if(isset($target[$id]))return []; // Duplicate DB identity: no redirects.
        $target[$id]=$post;
    }
    $matches=[];$ambiguous=[];
    foreach($executions as $execution){
        if(!is_array($execution) || (string)($execution['workflowId']??'')!==$workflowId
            || ($execution['status']??null)!=='waiting')continue;
        $run=$execution['data']['resultData']['runData']??null;
        if(!is_array($run))continue;
        $saved=socialRunOutput($run,'Enregistrer le brouillon');
        $prepared=socialRunOutput($run,'Vérifier et cadrer les textes');
        $waitMeta=$run['Attendre une décision via formulaire'][0]['metadata']??null;
        if(!$saved || !$prepared || !is_array($waitMeta))continue;
        $id=socialPostId($saved['id']??null);
        if($id===null || !isset($target[$id]))continue;
        $post=$target[$id];
        foreach([
            'sourceId'=>'source_id','fingerprint'=>'source_fingerprint',
            'scheduledDate'=>'scheduled_date','facebookCaption'=>'facebook_caption',
            'instagramCaption'=>'instagram_caption','imageUrl'=>'image_url'
        ] as $from=>$to){
            if(!is_string($prepared[$from]??null)
                || !hash_equals((string)$post[$to],$prepared[$from]))continue 2;
        }
        $url=existingWaitUrl($waitMeta['resumeFormUrl']??null);
        if($url===null)continue;
        // No guessing by post ID or catalog category. The actual Wait
        // metadata + exact frozen draft values prove this correspondence.
        if(isset($matches[$id])) {
            $ambiguous[$id]=true;
            unset($matches[$id]);
            continue;
        }
        if(!isset($ambiguous[$id]))$matches[$id]=$url;
    }
    return $matches;
}
function socialN8nGet(string $url,string $apiKey): ?array {
    if(!function_exists('curl_init'))return null;
    $ch=curl_init($url);
    if($ch===false)return null;
    $body='';
    curl_setopt_array($ch,[
        CURLOPT_HTTPGET=>true,CURLOPT_FOLLOWLOCATION=>false,
        CURLOPT_CONNECTTIMEOUT=>3,CURLOPT_TIMEOUT=>7,
        CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,
        CURLOPT_HTTPHEADER=>['Accept: application/json','X-N8N-API-KEY: '.$apiKey],
        CURLOPT_WRITEFUNCTION=>static function($handle,string $chunk)use(&$body):int{
            if(strlen($body)+strlen($chunk)>1048576)return 0;
            $body.=$chunk;return strlen($chunk);
        }
    ]);
    if(defined('CURLOPT_PROTOCOLS_STR'))curl_setopt($ch,constant('CURLOPT_PROTOCOLS_STR'),'https');
    elseif(defined('CURLOPT_PROTOCOLS'))curl_setopt($ch,CURLOPT_PROTOCOLS,CURLPROTO_HTTPS);
    $ok=curl_exec($ch);
    $status=curl_getinfo($ch,CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if($ok!==true || $status!==200 || $body==='')return null;
    try{
        $data=json_decode($body,true,64,JSON_THROW_ON_ERROR);
        return is_array($data)?$data:null;
    }catch(JsonException $e){return null;}
}
/** Returns null if not configured / API unavailable; never expose API key. */
function socialExistingN8nWaitLinks(array $cfg,array $posts,?callable $request=null): ?array {
    $request ??= 'socialN8nGet';
    $key=$cfg['n8n_readonly_api_key']??null;
    $id=$cfg['n8n_social_workflow_id']??null;
    if(!is_string($key)||strlen($key)<16||!is_string($id)
        ||!preg_match('/^[A-Za-z0-9_-]{1,120}$/D',$id))return null;
    if(count($posts)>50)return null;
    $api='https://n8n.orvekio.com/api/v1/';
    $workflow=$request($api.'workflows/'.rawurlencode($id),$key);
    if(!is_array($workflow)
        || (string)($workflow['id']??'')!==$id
        || ($workflow['name']??'')!=='Cuisine du Cambodge - 01 - Brouillon IA et validation email')
        return null;
    $nodes=$workflow['nodes']??null;
    if(!is_array($nodes))return null;
    $waitNodes=array_values(array_filter($nodes,static fn($n):bool=>
        is_array($n)&&($n['name']??'')==='Attendre une décision via formulaire'
        &&($n['type']??'')==='n8n-nodes-base.wait'
        &&($n['parameters']['resume']??'')==='form'));
    if(count($waitNodes)!==1)return null;
    // List endpoint yields lightweight records; saved runData and Wait metadata
    // must be retrieved from GET /executions/{id}?includeData=true instead.
    // Bound the workload: if the queue is larger than we can verify, refuse
    // EVERY direct link and preserve the existing e-mail validation path.
    $query=http_build_query(['workflowId'=>$id,'status'=>'waiting',
                             'limit'=>21],'','&',PHP_QUERY_RFC3986);
    $page=$request($api.'executions?'.$query,$key);
    if(!is_array($page)||!isset($page['data'])||!is_array($page['data'])
        ||count($page['data'])>20 || !empty($page['nextCursor']))return null;
    $details=[];
    $ids=[];
    foreach($page['data'] as $summary) {
        if(!is_array($summary) || (string)($summary['workflowId']??'')!==$id
            || ($summary['status']??null)!=='waiting')return null;
        $executionId=socialPostId($summary['id']??null);
        if($executionId===null || isset($ids[$executionId]))return null;
        $ids[$executionId]=true;
        $execution=$request($api.'executions/'.rawurlencode($executionId).'?includeData=true',$key);
        if(!is_array($execution) || socialPostId($execution['id']??null)!==$executionId
            || (string)($execution['workflowId']??'')!==$id
            || ($execution['status']??null)!=='waiting'
            || !is_array($execution['data']['resultData']['runData']??null))return null;
        $details[]=$execution;
    }
    return socialExecutionWaitLinks($details,$posts,$id);
}
