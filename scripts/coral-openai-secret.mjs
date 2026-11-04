/**
 * Production-only Coral API secret loader. Reads a private Docker Compose
 * secret mounted in the existing Orvekio worker; never from a shell argument,
 * interactive terminal input, GitHub, Studio PHP, or another site's backend.
 *
 * Compose grants the secret ONLY to the Coral job service.
 * The file must be mounted as a regular, non-writable secret at this path.
 */
import {lstatSync,readFileSync} from 'node:fs';

export const CORAL_OPENAI_SECRET_PATH='/run/secrets/cdc_coral_openai_key';

export function readCoralOpenAISecret(secretPath=CORAL_OPENAI_SECRET_PATH){
  let info,raw;
  try{
    info=lstatSync(secretPath);
    if(!info.isFile()||info.isSymbolicLink()
      ||info.size<22||info.size>512
      ||(process.platform!=='win32'&&(info.mode&0o022)!==0))
      throw Error('INVALID_FILE');
    raw=readFileSync(secretPath,'utf8');
  }catch{
    // Never echo paths, content or system IO errors in app logs.
    throw Error('CORAL_OPENAI_SECRET_UNAVAILABLE');
  }
  const key=raw.replace(/\r?\n$/, '');
  // No silent trim: pasted whitespace or a damaged secret must not produce
  // another misleading API 401.
  if(!/^sk-[A-Za-z0-9_-]{18,}$/.test(key)||key.length>510)
    throw Error('CORAL_OPENAI_SECRET_INVALID');
  return key;
}
