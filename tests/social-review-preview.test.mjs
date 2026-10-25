import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';

test('six ready-to-review cards contain real inlined square JPEGs and checked captions',async()=>{
  const html=await readFile(new URL('../artifacts/social-editorial-review.html',import.meta.url),'utf8');
  const found=html.match(/<script type="application\/json" id="review-payload">([\s\S]*?)<\/script>/);
  assert.ok(found,'self contained embedded review data is required');
  const entries=JSON.parse(found[1]);
  assert.equal(entries.length,3);
  assert.deepEqual(entries.map(x=>x.id),[
    'ingredient:kroeung','recette:amok-trey','culture:le-riz-symbole-de-vie-au-cambodge'
  ]);
  for(const post of entries){
    assert.match(post.imageData,/^data:image\/jpeg;base64,/);
    const data=Buffer.from(post.imageData.split(',')[1],'base64');
    assert.ok(data.length>10000,'real image bytes, not a placeholder');
    const info=await sharp(data).metadata();
    assert.equal(info.format,'jpeg');
    assert.equal(info.width,1080);
    assert.equal(info.height,1080);
    for(const [network,caption] of [['Facebook',post.facebookCaption],['Instagram',post.instagramCaption]]){
      assert.ok(caption.length>=90 && caption.length<=850,network+' caption length');
      assert.doesNotMatch(caption,/Dans notre catalogue|informations v[eé]rifi[eé]es|page associ[eé]e/i);
      assert.doesNotMatch(caption,/utm_source|utm_campaign|http:\/\/|graph\.facebook\.com/i);
    }
    assert.notEqual(post.facebookCaption,post.instagramCaption);
    assert.ok(post.facebookCaption.includes('https://www.cuisine-du-cambodge.com/'));
  }
  assert.match(html,/APERÇU HORS LIGNE/);
  assert.match(html,/Exporter mon avis/);
  assert.doesNotMatch(html,/<img[^>]+src=["']https?:/i);
  assert.doesNotMatch(html,/<script[^>]+src=/i);
  assert.doesNotMatch(html,/\bfetch\s*\(/);
  assert.doesNotMatch(html,/\bXMLHttpRequest\b/);
  assert.doesNotMatch(html,/\blocalStorage\b/);
});