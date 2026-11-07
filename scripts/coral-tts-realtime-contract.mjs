/** Inert Realtime adapter preparation. NO WebSocket, fetch, API key or production transport. */
import {pcmToWav,audioSha} from './coral-tts-audio.mjs';
import {coralUsageCostMicrousd} from './coral-tts-cost-plan.mjs';
export const CORAL_REALTIME_CANDIDATE=Object.freeze({model:'gpt-realtime-2.1-mini',voice:'coral',enabled:false,qualified:false,
 endpoint:'wss://api.openai.com/v1/realtime?model=gpt-realtime-2.1-mini',external_maximum_microusd:null});
export function createCoralRealtimeProvider(){throw Error('CORAL_REAL_PROVIDER_DISABLED');}
export function coralRealtimeResponseEvent(text,maxOutputTokens=4096){
 if(typeof text!=='string'||text.length<1||text.length>7000||!Number.isInteger(maxOutputTokens)||maxOutputTokens<1||maxOutputTokens>4096)
  throw Error('CORAL_REALTIME_INPUT');
 return {type:'response.create',response:{conversation:'none',output_modalities:['audio'],
  audio:{output:{format:{type:'audio/pcm',rate:24000},voice:'coral'}},max_output_tokens:maxOutputTokens,
  instructions:'Lis exactement le texte fourni, en français, sans commentaire, ajout ou résumé. La sortie est une narration synthétique privée.',
  tools:[],tool_choice:'none',input:[{type:'message',role:'user',content:[{type:'input_text',text}]}]}};
}
/** Only offline fixtures can exercise the decoder. Existing worker rejects this paid/unqualified kind. */
export function createCoralRealtimeContractHarness({testOnly=false,exchange,timeoutMs=1000,maxOutputTokens=4096}={}){
 if(testOnly!==true||typeof exchange!=='function'||!Number.isInteger(timeoutMs)||timeoutMs<20||timeoutMs>30000)
  throw Error('CORAL_REAL_PROVIDER_DISABLED');
 let last=null;
 return {kind:'openai-realtime-unqualified',paid:true,qualified:false,lastReceipt:()=>last,
  async synthesize({chapter}){
   const event=coralRealtimeResponseEvent(chapter?.text,maxOutputTokens);last=null;
   const abort=new AbortController();let timer,iterator;
   const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{abort.abort();reject(Error('TIMEOUT'));},timeoutMs);});
   try{
    const stream=await Promise.race([exchange({candidate:CORAL_REALTIME_CANDIDATE,event,signal:abort.signal}),deadline]);
    iterator=stream[Symbol.asyncIterator]();let id=null,audioDone=false,transcript=null,done=false,size=0,count=0,usage=null;
    const chunks=[];
    for(;;){
     const next=await Promise.race([iterator.next(),deadline]);if(next.done)break;
     const e=next.value;if(!e||typeof e.type!=='string'||++count>4096||done)throw Error('EVENT');
     if(e.type==='error')throw Error('PROVIDER');
     if(e.type==='response.created'){
      if(id||!/^resp_[a-zA-Z0-9_]{1,100}$/.test(e.response?.id||''))throw Error('ID');id=e.response.id;
     }else if(e.type==='response.output_audio.delta'){
      if(!id||e.response_id!==id||audioDone||typeof e.delta!=='string'||e.delta.length>1000000
       ||!e.delta.length||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(e.delta))throw Error('AUDIO');
      const b=Buffer.from(e.delta,'base64');if(b.length%2||b.toString('base64')!==e.delta)throw Error('PCM');
      size+=b.length;if(size+44>32000000)throw Error('SIZE');chunks.push(b);
     }else if(e.type==='response.output_audio.done'){
      if(!id||e.response_id!==id||audioDone||!size)throw Error('END');audioDone=true;
     }else if(e.type==='response.output_audio_transcript.done'){
      if(!id||e.response_id!==id||transcript!==null||typeof e.transcript!=='string'||e.transcript.length>7000)throw Error('TRANSCRIPT');
      transcript=e.transcript;
     }else if(e.type==='response.done'){
      if(!id||e.response?.id!==id||e.response.status!=='completed'||!audioDone||transcript===null
       ||transcript.replace(/\s+/g,' ').trim()!==chapter.text.replace(/\s+/g,' ').trim())throw Error('INCOMPLETE');
      usage=e.response.usage;const cost=coralUsageCostMicrousd(usage);
      if(usage.output_tokens>maxOutputTokens)throw Error('OUTPUT_LIMIT');
      // Persist counters only: never copy arbitrary provider fields into a durable receipt.
      usage={input_tokens:usage.input_tokens,output_tokens:usage.output_tokens,input_token_details:{text_tokens:usage.input_token_details.text_tokens,audio_tokens:0},
       output_token_details:{text_tokens:usage.output_token_details.text_tokens,audio_tokens:usage.output_token_details.audio_tokens}};
      last={response_id:id,model:CORAL_REALTIME_CANDIDATE.model,voice:'coral',usage,cost_microusd:cost,transcript_sha256:audioSha(transcript)};done=true;
     }else if(!['session.created','session.updated','conversation.item.added','conversation.item.done','response.output_item.added',
       'response.content_part.added','response.output_audio_transcript.delta','response.content_part.done','response.output_item.done','rate_limits.updated'].includes(e.type))throw Error('UNEXPECTED');
    }
    if(!done)throw Error('UNCERTAIN');return pcmToWav(Buffer.concat(chunks));
   }catch{last=null;throw Error('CORAL_REALTIME_UNCERTAIN_NO_RETRY');}
   finally{clearTimeout(timer);abort.abort();try{const closing=iterator?.return?.();closing?.catch?.(()=>{});}catch{}}
  }};
}
