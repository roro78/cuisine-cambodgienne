<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/public/gestion-social/https-readonly.php';

$endpoint = 'https://kljbnfjxwloiodwlbrrz.supabase.co/functions/v1/cuisine-social-readonly';
$base = [
    'social_readonly_https_enabled' => true,
    'social_readonly_https_endpoint' => $endpoint,
    'social_readonly_https_token' => str_repeat('A', 48),
];

function mustReject(array $cfg, string $status = 'draft', int $page = 1, ?string $id = null): void
{
    try {
        socialHttpsReadOnly($cfg, $status, $page, $id);
        throw new LogicException('Invalid request should have failed before network');
    } catch (RuntimeException $expected) {
        // Reject invalid input before cURL, and never fall back to anonymous REST.
    }
}

mustReject(array_replace($base, ['social_readonly_https_endpoint' => 'https://example.com/']));
mustReject(array_replace($base, ['social_readonly_https_endpoint' => $endpoint . '/../']));
mustReject(array_replace($base, ['social_readonly_https_token' => 'short']));
mustReject(array_replace($base, ['social_readonly_https_token' => "A\r\nInjected: true"]));
mustReject($base, 'unexpected');
mustReject($base, 'draft', 0);
mustReject($base, 'draft', 100001);
mustReject($base, 'draft', 1, '0');
mustReject($base, 'draft', 1, '9223372036854775808');
echo "social-https-readonly negative-input checks PASS\n";

function ensure(bool $condition): void { if (!$condition) throw new LogicException('HTTPS reader contract failed'); }
$row = ['id'=>'1','source_id'=>'recette:fixture','source_fingerprint'=>str_repeat('a',16),
    'source_snapshot'=>'{"title":"Private fixture"}','scheduled_date'=>'2026-11-03',
    'facebook_caption'=>'Private FB','instagram_caption'=>'Private IG','image_url'=>'https://www.cuisine-du-cambodge.com/social-assets/fixture.jpg',
    'status'=>'draft','fb_state'=>'pending','ig_state'=>'pending','human_decision'=>null,'human_note'=>null,
    'decided_at'=>null,'approved_at'=>null,'published_at'=>null,'facebook_post_id'=>null,'instagram_post_id'=>null,'instagram_container_id'=>null];
$payload = ['contract'=>'cdc-social-readonly-v1','readonly'=>true,'rows'=>[$row],'counts'=>['draft'=>51],
    'target'=>null,'history'=>[],'history_overflow'=>false];
$calls = [];
$transport = static function(string $url,string $token) use (&$calls,$payload): array {
    $calls[]=$url;
    ensure($token === str_repeat('A',48));
    return ['status'=>200,'content_type'=>'application/json; charset=utf-8','body'=>json_encode($payload,JSON_THROW_ON_ERROR)];
};
$received=socialHttpsReadOnly($base,'draft',2,null,$transport);
ensure($received['rows'][0]['source_snapshot']===$row['source_snapshot']);
ensure(str_ends_with($calls[0],'?status=draft&page=2'));
foreach ([[],['social_readonly_https_enabled'=>false],['social_readonly_https_enabled'=>'true']] as $override) {
    $off=$override?array_replace($base,$override):array_diff_key($base,['social_readonly_https_enabled'=>1]);
    try { socialHttpsReadOnly($off,'draft',1,null,static function(){throw new LogicException('Disabled reader reached transport');});throw new LogicException('Disabled reader accepted'); }
    catch(RuntimeException $expected) {}
}
function rejectResponse(array $cfg,array $response,string $status='draft',?string $id=null): void {
    try {socialHttpsReadOnly($cfg,$status,1,$id,static fn()=>$response);throw new LogicException('Unsafe response accepted');}
    catch(RuntimeException $e){ensure($e->getMessage()==='Private HTTPS reader unavailable');}
}
foreach ([301,302,401,403,429,500,503] as $status)
    rejectResponse($base,['status'=>$status,'content_type'=>'application/json','body'=>json_encode($payload)]);
rejectResponse($base,['status'=>200,'content_type'=>'text/html','body'=>'private secret']);
rejectResponse($base,['status'=>200,'content_type'=>'application/json','body'=>'private secret']);
rejectResponse($base,['status'=>200,'content_type'=>'application/json','body'=>str_repeat('a',1600001)]);
foreach (['contract'=>'wrong','readonly'=>false,'rows'=>array_fill(0,51,$row),'counts'=>['draft'=>'51'],
          'history_overflow'=>true,'target'=>$row] as $key=>$value) {
    $bad=$payload;$bad[$key]=$value;
    rejectResponse($base,['status'=>200,'content_type'=>'application/json','body'=>json_encode($bad)]);
}
foreach ([array_replace($row,['id'=>1]),array_replace($row,['status'=>'published']),
          array_diff_key($row,['source_snapshot'=>1]),array_replace($row,['unexpected_secret'=>'never accepted'])] as $badRow) {
    $bad=$payload;$bad['rows']=[$badRow];
    rejectResponse($base,['status'=>200,'content_type'=>'application/json','body'=>json_encode($bad)]);
}
$target=$row;unset($target['source_snapshot'],$target['human_note']);
$targetPayload=$payload;$targetPayload['target']=$target;
$targetTransport=static fn()=>['status'=>200,'content_type'=>'application/json','body'=>json_encode($targetPayload)];
ensure(socialHttpsReadOnly($base,'draft',1,'1',$targetTransport)['target']['id']==='1');
rejectResponse($base,$targetTransport(),'draft','2');
$source=$payload;$source['rows']=[];$source['history']=[['source_id'=>'recette:fixture','source_fingerprint'=>str_repeat('a',16),'status'=>'draft']];
$sourceTransport=static fn()=>['status'=>200,'content_type'=>'application/json','body'=>json_encode($source)];
ensure(count(socialHttpsReadOnly($base,'sources',1,null,$sourceTransport)['history'])===1);
try {socialHttpsReadOnly($base,'draft',1,null,static function(){throw new RuntimeException('private-token-must-not-escape');});throw new LogicException('Network failure accepted');}
catch(RuntimeException $e){ensure($e->getMessage()==='Private HTTPS reader unavailable');}
echo "social-https-readonly response, pagination, target binding and failure checks PASS\n";
