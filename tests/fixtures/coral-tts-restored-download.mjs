/** Independent recovery from CI transport. Only known synthetic archives; no actual backup key. */
import {readFile,readdir,chmod,writeFile} from 'node:fs/promises';import {join,resolve,basename} from 'node:path';
import {restoreCoralMedia} from '../../scripts/coral-media-backup.mjs';import {privateAudioDigest} from '../../scripts/coral-tts-audio.mjs';
const base=resolve(process.env.TTS_LONG_EVIDENCE_DIR||'');if(!process.env.TTS_LONG_EVIDENCE_DIR)throw Error('FIXTURE_ONLY');
async function roots(p,depth=0){if(depth>4)return [];try{await readFile(join(p,'summary.json'));return [p];}catch{}const rows=[];for(const d of await readdir(p,{withFileTypes:true}))if(d.isDirectory()&&!d.isSymbolicLink())rows.push(...await roots(join(p,d.name),depth+1));return rows;}
let count=0;for(const root of await roots(base)){
 if(!basename(root).startsWith('cdc-coral-load-'))throw Error('FIXTURE_ONLY');const summary=JSON.parse(await readFile(join(root,'summary.json'),'utf8'));
 if(summary.provider_calls_paid!==0||summary.manifest?.provider!=='simulated-tone-v1'||summary.manifest?.simulated!==true)throw Error('FIXTURE_ONLY');
 const archive=join(root,'synthetic-media-v1.enc');await chmod(root,0o700);await chmod(archive,0o600); // artifact transports do not retain Unix modes
 if((await privateAudioDigest(archive,64000000)).sha256!==summary.media_restore.backup.archive_sha256)throw Error('FIXTURE_ARCHIVE_HASH');
 const proof=await restoreCoralMedia({archive,target:join(root,'restored-download-audio'),key:Buffer.alloc(32,17),reviewed:true});
 if(proof.mp3_sha256!==summary.manifest.sha256)throw Error('FIXTURE_RESTORE_HASH');await writeFile(join(root,'download-restore-proof.json'),JSON.stringify(proof,null,2),{mode:0o600,flag:'wx'});count++;
}if(count!==2)throw Error('FIXTURE_COUNT');console.log(JSON.stringify({independent_download_restores:count,paid_calls:0}));
