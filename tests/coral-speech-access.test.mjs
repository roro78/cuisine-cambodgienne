import test from 'node:test';
import assert from 'node:assert/strict';
import {probeCoralSpeechAccess} from '../scripts/coral-audio-image-preflight.mjs';

const model='gpt-4o-mini-tts';
const readSecret=()=> 'fixture-only';

test('probes the historical model and Coral endpoint without sending synthesizable input',async()=>{
  const calls=[];
  const result=await probeCoralSpeechAccess({readSecret,fetcher:async(url,options)=>{
    calls.push({url,options});
    if(calls.length===1)return Response.json({id:model});
    return Response.json({error:{code:'missing_required_parameter',param:'input'}},{status:400});
  }});
  assert.deepEqual(calls.map(({url})=>url),[
    'https://api.openai.com/v1/models/'+model,'https://api.openai.com/v1/audio/speech',
  ]);
  assert.equal(calls[1].options.method,'POST');
  assert.deepEqual(JSON.parse(calls[1].options.body),{model,voice:'coral'});
  assert.ok(calls.every(({options})=>options.redirect==='error'&&options.signal instanceof AbortSignal));
  assert.deepEqual(result,{model_http:200,speech_http:400,access_confirmed:true,voice_qualified:false});
});

test('model denial prevents a Speech request, and a Speech denial never qualifies access',async()=>{
  const denied=await probeCoralSpeechAccess({readSecret,fetcher:async url=>{
    assert.ok(url.endsWith('/models/'+model));
    return Response.json({error:{code:'model_not_found'}},{status:404});
  }});
  assert.deepEqual(denied,{model_http:404,speech_http:null,access_confirmed:false,voice_qualified:false});
  const speechDenied=await probeCoralSpeechAccess({readSecret,fetcher:async url=>
    url.endsWith('/models/'+model)?Response.json({id:model}):new Response(null,{status:403})});
  assert.deepEqual(speechDenied,{model_http:200,speech_http:403,access_confirmed:false,voice_qualified:false});
});

test('transport failures never expose the credential or qualify the voice',async()=>{
  await assert.rejects(probeCoralSpeechAccess({readSecret,fetcher:async()=>{
    throw Error('diagnostics containing '+readSecret());
  }}),{message:'CORAL_SPEECH_ACCESS_CHECK_FAILED'});
});
