/**
 * Production-only Coral API secret loader. Reads a private Docker Compose
 * secret mounted in the existing Orvekio worker; never from a shell argument,
 * interactive terminal input, GitHub, Studio PHP, or another site's backend.
 *
 * Compose grants the secret ONLY to the Coral job service.
 * The file must be mounted as a regular, non-writable secret at this path.
 */
import {readPrivateRuntimeSecret} from './private-runtime-secret.mjs';

export const CORAL_OPENAI_SECRET_PATH='/run/secrets/cdc_coral_openai_key';

export function readCoralOpenAISecret(secretPath=CORAL_OPENAI_SECRET_PATH){
  return readPrivateRuntimeSecret(secretPath,{minBytes:22,maxBytes:512,
    unavailable:'CORAL_OPENAI_SECRET_UNAVAILABLE',invalid:'CORAL_OPENAI_SECRET_INVALID',
    validate:key=>/^sk-[A-Za-z0-9_-]{18,}$/.test(key)&&key.length<=510});
}
