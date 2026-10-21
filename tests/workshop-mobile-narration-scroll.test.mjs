import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const audio=readFileSync('src/components/CookingWorkshopAudio.astro','utf8');
test('Mobile narrative text scroll follows the actual audio chapter timeline, with manual opt-out',()=>{
  assert.equal((audio.match(/<audio src=/g)||[]).length,1,'One approved MP3 shared by desktop and mobile');
  assert.match(audio,/data-cooking-mobile-transcript-scroll/);
  assert.match(audio,/data-cooking-mobile-transcript-follow/);
  assert.match(audio,/chapter\.endSec-chapter\.startSec/);
  assert.match(audio,/Math\.min\(1,\(audio\.currentTime-chapter\.startSec\)\/duration\)/);
  assert.match(audio,/transcriptScroll\.scrollTop=max\*fraction/);
  assert.match(audio,/transcriptScroll\?\.addEventListener\('touchmove',stopTranscriptFollowing/);
  assert.match(audio,/transcriptScroll\?\.addEventListener\('wheel',stopTranscriptFollowing/);
  assert.match(audio,/updateTranscriptScroll\(\)/);
});
test('Large-step page follow is a separate user decision that closes the mobile sheet',()=>{
  assert.match(audio,/mobileFollow\?\.addEventListener\('click'/);
  assert.match(audio,/mobileViewport\.matches && !manualFollowChoice/);
  assert.match(audio,/manualFollowChoice=true/);
  assert.match(audio,/audio\?\.addEventListener\('play'/);
  assert.match(audio,/if\(following&&mobileViewport\.matches\)closeMobileSheet\(\)/);
  assert.match(audio,/if\(following\)scrollToChapter\(index\)/);
  assert.match(audio,/window\.addEventListener\('wheel',stopFollowing/);
  assert.match(audio,/window\.addEventListener\('touchmove'/);
  assert.match(audio,/prefersReducedMotion\.matches\?'auto':'smooth'/);
});
test('Mobile chapter highlight and spoken text auto-follow do not modify original MP3s or desktop interface',()=>{
  assert.match(audio,/mobileChapterButtons\.forEach/);
  assert.match(audio,/\[aria-current="true"\]/);
  assert.match(audio,/@media\(max-width:760px\)/);
  assert.match(audio,/guided-cooking-audio>\.guided-cooking-audio-head/);
  assert.doesNotMatch(audio,/speechSynthesis|fetch\('https:/);
});
