/** Offline default of the candidate image. Does not load config/secrets or start the gateway. */
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {createCoralRealtimeProvider} from './coral-tts-realtime-contract.mjs';
if(process.platform!=='linux'||process.getuid()!==1000)throw Error('AUDIO_CANDIDATE_USER');
let disabled=false;try{createCoralRealtimeProvider();}catch(e){disabled=e.message==='CORAL_REAL_PROVIDER_DISABLED';}if(!disabled)throw Error('AUDIO_CANDIDATE_PROVIDER');
const tools={};for(const name of ['ffmpeg','ffprobe'])tools[name]=(await promisify(execFile)(name,['-version'],{timeout:10000,maxBuffer:20000})).stdout.split('\n')[0];
console.log(JSON.stringify({contract:'cdc-coral-audio-image-preflight-v1',uid:process.getuid(),tools,real_provider_disabled:disabled,http_listener_started:false,secret_contents_read:false,provider_calls:0}));
