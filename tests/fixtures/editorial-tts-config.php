<?php
// Appended ONLY to a synthetic private config by the isolated test harness.
$ttsPort=(int)file_get_contents($GLOBALS['fixtureRoot'].'/tts-port.txt');
if($ttsPort<1024||$ttsPort>65535)throw new RuntimeException('FIXTURE_PORT');
$ttsCall=static function(string $id,string $operation,?array $request=null)use($ttsPort):mixed{
    if(!preg_match('/^[a-f0-9]{48}$/D',$id)||!in_array($operation,['submit','poll','resume','artifact'],true))throw new RuntimeException('FIXTURE_OPERATION');
    $path='/editorial-ai/v1/jobs/'.$id.($operation==='resume'?'/resume':($operation==='artifact'?'/audio':''));
    $opts=['method'=>$operation==='submit'?'PUT':($operation==='resume'?'POST':'GET'),
      'header'=>"Content-Type: application/json\r\nAuthorization: Bearer ".str_repeat('synthetic-local-tts-',3),
      'timeout'=>15,'follow_location'=>0,'ignore_errors'=>true];
    if($request!==null)$opts['content']=json_encode($request,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
    $bytes=file_get_contents('http://127.0.0.1:'.$ttsPort.$path,false,stream_context_create(['http'=>$opts]),0,32000001);
    if(!is_string($bytes)||strlen($bytes)>32000000||!preg_match('~^HTTP/\S+ (?:200|202) ~',$http_response_header[0]??''))throw new RuntimeException('FIXTURE_HTTP');
    return $operation==='artifact'?$bytes:json_decode($bytes,true,32,JSON_THROW_ON_ERROR);
};
$cfg['editorial_tts']=['enabled'=>true,'test_only'=>true,'mode'=>'simulated',
  'submit'=>static fn(array $r,string $id):array=>$ttsCall($id,'submit',$r),
  'poll'=>static fn(string $id):array=>$ttsCall($id,'poll'),
  'resume'=>static fn(string $id):array=>$ttsCall($id,'resume'),
  'artifact'=>static fn(string $id):string=>$ttsCall($id,'artifact')];
// Local fixture transport only. Production has no such callback and uses guarded HTTPS.
$cfg['editorial_final_source_fetch']=static fn(string $url):array=>[
  'status'=>200,'content_type'=>'text/html; charset=UTF-8',
  'body'=>'<html><body><h1>Fish Amok</h1>1 kg fish, 320 g coconut cream, steam for 10 minutes, steam 2 more minutes. 0.25kg fish, 70ml coconut milk, fry them, to be steamed.<p>'.str_repeat(
    'Synthetic fixture only: fish, coconut, kroeung and steam are represented for a bounded source audit. ',12
  ).'</p></body></html>'
];
