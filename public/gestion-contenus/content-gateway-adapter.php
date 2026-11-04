<?php
declare(strict_types=1);
// Include-only optional transport. No request, secret or workflow on inclusion.
if(isset($_SERVER['SCRIPT_FILENAME'])&&realpath((string)$_SERVER['SCRIPT_FILENAME'])===__FILE__){
    http_response_code(404);exit;
}
function cmsAiContentGatewayConfig(string $endpoint,string $token): void {
    $url=parse_url($endpoint);
    if(!is_array($url)||($url['scheme']??null)!=='https'||($url['host']??null)!=='n8n.orvekio.com'
        || isset($url['port'])||isset($url['user'])||isset($url['pass'])||isset($url['query'])||isset($url['fragment'])
        || !preg_match('~^/webhook/[a-zA-Z0-9_-]{8,100}$~D',$url['path']??'')
        || strlen($token)<32||strlen($token)>512||!preg_match('/^[\x21-\x7e]+$/D',$token))
        throw new RuntimeException('AI_CONTENT_GATEWAY_CONFIG');
}
/** Fixed HTTPS host, no redirect, verified TLS, 5s connect/20s total, 30KB body. */
function cmsAiContentGatewayCurl(string $endpoint,string $body,string $token): string {
    cmsAiContentGatewayConfig($endpoint,$token);
    if(strlen($body)>90000||!function_exists('curl_init'))
        throw new RuntimeException('AI_CONTENT_GATEWAY_UNAVAILABLE');
    $curl=curl_init($endpoint);
    if($curl===false)throw new RuntimeException('AI_CONTENT_GATEWAY_UNAVAILABLE');
    $raw='';
    try{
        curl_setopt_array($curl,[
            CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>$body,CURLOPT_FOLLOWLOCATION=>false,
            CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,
            CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>20,CURLOPT_NOSIGNAL=>true,
            CURLOPT_HTTPHEADER=>['Content-Type: application/json','Accept: application/json','Authorization: Bearer '.$token],
            CURLOPT_WRITEFUNCTION=>static function($handle,string $chunk)use(&$raw):int{
                if(strlen($raw)+strlen($chunk)>30000)return 0;
                $raw.=$chunk;return strlen($chunk);
            }
        ]);
        if(defined('CURLOPT_PROTOCOLS_STR'))curl_setopt($curl,constant('CURLOPT_PROTOCOLS_STR'),'https');
        elseif(defined('CURLOPT_PROTOCOLS'))curl_setopt($curl,CURLOPT_PROTOCOLS,CURLPROTO_HTTPS);
        $ok=curl_exec($curl);$status=(int)curl_getinfo($curl,CURLINFO_RESPONSE_CODE);
        if($ok!==true||$status!==200||$raw==='')throw new RuntimeException('AI_CONTENT_GATEWAY_HTTP');
        return $raw;
    }finally{curl_close($curl);}
}
/** Optional future authenticated n8n gateway, NOT an existing/activated webhook.
 * The injected test transport is available only to PHP test code, never POST.
 */
function cmsAiContentGatewayCall(array $request,string $endpoint,string $token,?callable $testTransport=null): string {
    cmsAiContentGatewayConfig($endpoint,$token);
    if(($request['contract']??null)!=='cdc-editorial-ai-content-request-v1'
        || ($request['timeout_seconds']??null)!==20||($request['response_max_bytes']??null)!==30000
        || ($request['max_output_tokens']??null)!==6000)
        throw new RuntimeException('AI_CONTENT_GATEWAY_CONFIG');
    $body=json_encode($request,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
    if(strlen($body)>90000)throw new RuntimeException('AI_CONTENT_GATEWAY_CONFIG');
    try{$raw=$testTransport!==null?$testTransport($endpoint,$body,$token):cmsAiContentGatewayCurl($endpoint,$body,$token);}
    catch(Throwable $e){throw new RuntimeException('AI_CONTENT_GATEWAY_HTTP');}
    if(!is_string($raw)||strlen($raw)>30000)throw new RuntimeException('AI_CONTENT_GATEWAY_RESPONSE');
    return $raw;
}
function cmsAiContentGatewayAdapter(string $endpoint,string $token): Closure {
    cmsAiContentGatewayConfig($endpoint,$token);
    return static fn(array $request):string=>cmsAiContentGatewayCall($request,$endpoint,$token);
}
/** Short authenticated job operations; the existing synchronous timeout stays 20 s. */
function cmsAiContentJobTransport(string $base,string $token,string $id,?array $request=null,?callable $test=null): array {
    if($base!=='https://n8n.orvekio.com/editorial-ai/v1/jobs'||!preg_match('/^[0-9a-f]{48}$/D',$id)
        ||strlen($token)<32||strlen($token)>512||!preg_match('/^[\x21-\x7e]+$/D',$token))throw new RuntimeException('AI_CONTENT_GATEWAY_CONFIG');
    $body=$request===null?null:json_encode($request,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
    if($body!==null&&strlen($body)>90000)throw new RuntimeException('AI_CONTENT_GATEWAY_CONFIG');
    if($test!==null)$raw=$test($base.'/'.$id,$body,$token);
    else{
        if(!function_exists('curl_init'))throw new RuntimeException('AI_CONTENT_GATEWAY_UNAVAILABLE');
        $raw='';$curl=curl_init($base.'/'.$id);
        if($curl===false)throw new RuntimeException('AI_CONTENT_GATEWAY_UNAVAILABLE');
        try{
            curl_setopt_array($curl,[CURLOPT_CUSTOMREQUEST=>$body===null?'GET':'PUT',CURLOPT_FOLLOWLOCATION=>false,
                CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_CONNECTTIMEOUT=>3,CURLOPT_TIMEOUT=>10,
                CURLOPT_HTTPHEADER=>['Content-Type: application/json','Accept: application/json','Authorization: Bearer '.$token],
                CURLOPT_WRITEFUNCTION=>static function($c,string $part)use(&$raw):int{
                    if(strlen($raw)+strlen($part)>120000)return 0;$raw.=$part;return strlen($part);
                }]);
            if($body!==null)curl_setopt($curl,CURLOPT_POSTFIELDS,$body);
            if(defined('CURLOPT_PROTOCOLS_STR'))curl_setopt($curl,constant('CURLOPT_PROTOCOLS_STR'),'https');
            elseif(defined('CURLOPT_PROTOCOLS'))curl_setopt($curl,CURLOPT_PROTOCOLS,CURLPROTO_HTTPS);
            if(curl_exec($curl)!==true||!in_array((int)curl_getinfo($curl,CURLINFO_RESPONSE_CODE),[200,202],true))throw new RuntimeException('AI_CONTENT_GATEWAY_HTTP');
        }finally{curl_close($curl);}
    }
    if(!is_string($raw)||strlen($raw)>120000)throw new RuntimeException('AI_CONTENT_GATEWAY_RESPONSE');
    try{$a=json_decode($raw,true,12,JSON_THROW_ON_ERROR);}catch(Throwable $e){throw new RuntimeException('AI_CONTENT_GATEWAY_RESPONSE');}
    if(!is_array($a)||($a['id']??null)!==$id||!in_array($a['status']??null,['queued','running','succeeded','failed'],true)
        ||array_diff(array_keys($a),['id','status','result'])
        ||(($a['status']??null)==='succeeded'&&(!is_string($a['result']??null)||strlen($a['result'])>60000)))throw new RuntimeException('AI_CONTENT_GATEWAY_RESPONSE');
    return $a;
}
function cmsAiContentJobAdapters(string $base,string $token): array {
    if($base!=='https://n8n.orvekio.com/editorial-ai/v1/jobs'||strlen($token)<32||strlen($token)>512||!preg_match('/^[\x21-\x7e]+$/D',$token))throw new RuntimeException('AI_CONTENT_GATEWAY_CONFIG');
    return ['submit'=>static fn(array $r,string $id):array=>cmsAiContentJobTransport($base,$token,$id,$r),
        'poll'=>static fn(string $id):array=>cmsAiContentJobTransport($base,$token,$id)];
}
