<?php
declare(strict_types=1);
/** Optional include-only Images API transport; never enabled by loading this file. */
if(isset($_SERVER['SCRIPT_FILENAME'])&&realpath((string)$_SERVER['SCRIPT_FILENAME'])===__FILE__){http_response_code(404);exit;}
function cmsVisualOpenAiAdapter(string $key,string $model='gpt-image-2.5-flare',?callable $observer=null): Closure {
    if(strlen($key)<24||strlen($key)>512||preg_match('/[\x00-\x20\x7f]/',$key)
        ||!in_array($model,['gpt-image-2.5-flare','gpt-image-2.5-sunburst','gpt-image-1-mini'],true))throw new RuntimeException('VISUAL_PROVIDER_CONFIG');
    return static function(array $request)use($key,$model,$observer):string {
        if(($request['contract']??null)!=='cdc-private-visual-request-v1'
            ||($request['size']??null)!=='1536x1024'||($request['output_format']??null)!=='png'
            ||!is_string($request['prompt']??null)||strlen($request['prompt'])>18000||!function_exists('curl_init'))
            throw new RuntimeException('VISUAL_PROVIDER_CONFIG');
        $body=json_encode(['model'=>$model,'n'=>1,'prompt'=>$request['prompt'],'size'=>'1536x1024',
            'quality'=>'low','output_format'=>'png'],JSON_THROW_ON_ERROR);
        $raw='';$curl=curl_init('https://api.openai.com/v1/images/generations');
        if($curl===false)throw new RuntimeException('VISUAL_PROVIDER_FAILED');
        try{
            curl_setopt_array($curl,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>$body,CURLOPT_FOLLOWLOCATION=>false,
                CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>120,
                CURLOPT_HTTPHEADER=>['Content-Type: application/json','Authorization: Bearer '.$key],
                CURLOPT_WRITEFUNCTION=>static function($c,string $chunk)use(&$raw):int{
                    if(strlen($raw)+strlen($chunk)>12000000)return 0;$raw.=$chunk;return strlen($chunk);
                }]);
            if(defined('CURLOPT_PROTOCOLS_STR'))curl_setopt($curl,constant('CURLOPT_PROTOCOLS_STR'),'https');
            elseif(defined('CURLOPT_PROTOCOLS'))curl_setopt($curl,CURLOPT_PROTOCOLS,CURLPROTO_HTTPS);
            $ok=curl_exec($curl);$status=(int)curl_getinfo($curl,CURLINFO_RESPONSE_CODE);
            if($ok!==true||$status!==200){
                $error=json_decode($raw,true);$code=$error['error']['code']??null;
                if($observer!==null)$observer(['http_status'=>$status,'transport_error'=>curl_errno($curl),
                    'error_code'=>is_string($code)&&preg_match('/^[a-zA-Z0-9_-]{1,80}$/D',$code)?$code:'PROVIDER_REJECTED']);
                throw new RuntimeException('VISUAL_PROVIDER_FAILED');
            }
        }finally{curl_close($curl);}
        try{$doc=json_decode($raw,true,16,JSON_THROW_ON_ERROR);}catch(Throwable $e){throw new RuntimeException('VISUAL_PROVIDER_FAILED');}
        if(!is_string($doc['data'][0]['b64_json']??null))throw new RuntimeException('VISUAL_PROVIDER_FAILED');
        $png=base64_decode($doc['data'][0]['b64_json'],true);
        if(!is_string($png)||strlen($png)>8000000)throw new RuntimeException('VISUAL_PROVIDER_FAILED');
        if($observer!==null){
            $usage=[];foreach(['input_tokens','output_tokens','total_tokens'] as $field)
                if(is_int($doc['usage'][$field]??null)&&$doc['usage'][$field]>=0)$usage[$field]=$doc['usage'][$field];
            foreach(['text_tokens','image_tokens'] as $field)
                if(is_int($doc['usage']['input_tokens_details'][$field]??null)&&$doc['usage']['input_tokens_details'][$field]>=0)
                    $usage['input_tokens_details'][$field]=$doc['usage']['input_tokens_details'][$field];
            $observer(['http_status'=>200,'usage'=>$usage]);
        }
        return $png;
    };
}
