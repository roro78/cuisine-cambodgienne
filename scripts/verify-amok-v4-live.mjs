#!/usr/bin/env node
/** Read-only live acceptance: no login, no OpenAI API and no mutation. */
const base='https://www.cuisine-du-cambodge.com';
const page=base+'/apprendre/pratique/amok-trey/';
const audio=base+'/audio/workshops/atelier-pratique-amok-trey/atelier-coral-v4.mp3';
const expected=11436672;
const fail=(message)=>{throw Error('AMOK_LIVE_NO_GO: '+message)};
try{
 const html=await fetch(page,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(html.status!==200||!html.headers.get('content-type')?.includes('text/html'))
   fail('ATELIER_HTML_HTTP_'+html.status);
 const body=await html.text();
 if(!body.includes('data-cooking-audio')||!body.includes('Amok Trey')||
    !body.includes('atelier-coral-v4.mp3'))
   fail('HTML_PLAYER_MISSING');
 const head=await fetch(audio,{method:'HEAD',redirect:'error',signal:AbortSignal.timeout(15000)});
 if(head.status!==200||!head.headers.get('content-type')?.includes('audio/mpeg'))
   fail('MP3_HEAD_HTTP_'+head.status);
 if(Number(head.headers.get('content-length'))!==expected)
   fail('MP3_CONTENT_LENGTH');
 const partial=await fetch(audio,{
  headers:{Range:'bytes=0-383'},redirect:'error',signal:AbortSignal.timeout(15000)
 });
 if(partial.status!==206||partial.headers.get('content-range')!==('bytes 0-383/'+expected))
   fail('MP3_RANGE_NOT_206');
 const data=Buffer.from(await partial.arrayBuffer());
 if(data.length!==384)fail('MP3_RANGE_LENGTH');
 console.log('AMOK_PROD_HTTP_PASS page=200 mp3=200 range=206');
 console.log('NAVIGATION_AND_FULL_ANDROID_DESKTOP_LISTENING_REMAIN_SEPARATE');
}catch(e){console.error(e.message);process.exitCode=1;}
