<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/lib.php';
require_once __DIR__.'/../../public/gestion-contenus/openai-brief-adapter.php';
function checkOpenAi(bool $ok,string $marker):void {
    if(!$ok)throw new RuntimeException('CMS_OPENAI_BRIEF_TEST_'.$marker);
}
function openAiRejects(callable $fn,string $code):void {
    $caught=null;
    try{$fn();}catch(Throwable $e){$caught=$e;}
    checkOpenAi($caught instanceof RuntimeException && $caught->getMessage()===$code,
        'REJECTED_'.$code);
}
$apiKey='sk-SYNTHETIC_DO_NOT_USE_1234567890';
foreach(array_keys(cmsCreationKinds()) as $kind){
    $input=[
        'contract'=>'cdc-editorial-ai-brief-request-v1',
        'kind'=>$kind,'title'=>'Sujet de travail','angle'=>'Angle spécifique',
        'objective'=>'Question du lecteur','context'=>'Contexte soumis expressément',
        'reference'=>null,'max_output_tokens'=>1200,'timeout_seconds'=>20
    ];
    $reply=['title'=>'Proposition','angle'=>'Angle utile',
        'summary'=>'Résumé à relire','research_note'=>'Source à contrôler'];
    $replyJson=json_encode($reply,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
    $fakeResponse=json_encode(['status'=>'completed','output'=>[
        ['type'=>'message','role'=>'assistant','content'=>[
            ['type'=>'output_text','text'=>$replyJson]
        ]]
    ]],JSON_THROW_ON_ERROR);
    $called=0;
    $fake=static function(string $endpoint,string $body,string $secret)
        use(&$called,$apiKey,$kind,$fakeResponse):string {
        ++$called;
        checkOpenAi($endpoint==='https://api.openai.com/v1/responses','FIXED_ENDPOINT');
        checkOpenAi($secret===$apiKey,'SECRET_ONLY_IN_TRANSPORT');
        checkOpenAi(!str_contains($body,$apiKey) && !str_contains($body,'private_secret'),
            'SECRET_NOT_IN_BODY');
        $payload=json_decode($body,true,15,JSON_THROW_ON_ERROR);
        checkOpenAi($payload['store']===false,'NO_RESPONSE_STORAGE');
        checkOpenAi($payload['max_output_tokens']===1200,'OUTPUT_BUDGET');
        checkOpenAi($payload['text']['format']['strict']===true,'STRICT_OUTPUT');
        checkOpenAi($payload['text']['format']['schema']['additionalProperties']===false,
            'NO_EXTRA_OUTPUT');
        checkOpenAi(count($payload['text']['format']['schema']['required'])===4,
            'FOUR_FIELDS');
        checkOpenAi(!isset($payload['tools']) && !isset($payload['previous_response_id']),
            'NO_TOOLS_OR_THREAD');
        $sent=json_decode($payload['input'][0]['content'][0]['text'],true,5,JSON_THROW_ON_ERROR);
        checkOpenAi($sent['famille']===$kind && count($sent)===6,
            'ONLY_EXPLICIT_BRIEF_AND_PUBLIC_REFERENCE');
        return $fakeResponse;
    };
    $response=cmsOpenAiBriefOpenAi($input,$apiKey,'gpt-6-luna',$fake);
    checkOpenAi($response===$replyJson && $called===1,'VALID_RESULT');
    checkOpenAi(is_callable(cmsOpenAiBriefAdapter($apiKey,'gpt-6-luna')),
        'EXISTING_ADAPTER_CONTRACT');
    openAiRejects(static fn()=>cmsOpenAiBriefOpenAi($input,'bad','gpt-6-luna',$fake),
        'AI_BRIEF_PROVIDER_CONFIG');
    openAiRejects(static fn()=>cmsOpenAiBriefOpenAi($input,$apiKey,'bad model!',$fake),
        'AI_BRIEF_PROVIDER_CONFIG');
    foreach([
        ['status'=>'incomplete','output'=>[]],
        ['status'=>'completed','output'=>[]],
        ['status'=>'completed','output'=>[
            ['type'=>'message','role'=>'assistant','content'=>[['type'=>'refusal','refusal'=>'No']]]]],
        ['status'=>'completed','output'=>[
            ['type'=>'message','role'=>'assistant','content'=>[
                ['type'=>'output_text','text'=>'{}'],['type'=>'output_text','text'=>'{}']]]]]
    ] as $invalid){
        $bad=json_encode($invalid,JSON_THROW_ON_ERROR);
        openAiRejects(static fn()=>cmsOpenAiBriefOpenAi($input,$apiKey,'gpt-6-luna',
            static fn()=> $bad),'AI_BRIEF_PROVIDER_RESPONSE');
    }
    openAiRejects(static fn()=>cmsOpenAiBriefOpenAi($input,$apiKey,'gpt-6-luna',
        static function():never {throw new RuntimeException('PRIVATE_API_KEY_MSG');}),
        'AI_BRIEF_PROVIDER_HTTP');
}
echo 'CMS_OPENAI_BRIEF_OFFLINE_PASS 5 families / realProviderCalls:0'."\n";
