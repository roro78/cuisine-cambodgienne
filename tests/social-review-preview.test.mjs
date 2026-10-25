import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';

test('ten ready-to-review cards contain real inlined square JPEGs and checked captions',async()=>{
  const html=await readFile(new URL('../artifacts/social-editorial-review.html',import.meta.url),'utf8');
  const found=html.match(/<script type="application\/json" id="review-payload">([\s\S]*?)<\/script>/);
  assert.ok(found,'self contained embedded review data is required');
  const entries=JSON.parse(found[1]);
  assert.equal(entries.length,5);
  assert.deepEqual(entries.map(x=>x.id),[
    'ingredient:kroeung','recette:amok-trey','culture:le-riz-symbole-de-vie-au-cambodge','culture:comprendre-le-kroeung','culture:construire-repas-cambodgien'
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
  // Regression for mobile mockup: do not render the 1080px media as an enormous page image.
  assert.match(html,/data-scale="compact"/);
  assert.match(html,/data-scale="feed"/);
  assert.match(html,/body\[data-scale="compact"\] \.card \{width:min\(100%,300px\)/);
  assert.match(html,/body\[data-scale="feed"\] \.card \{width:min\(100%,370px\)/);
  assert.match(html,/object-fit:contain/,'Main feed must preserve the square source without CSS cropping');
  assert.match(html,/grid-crop img \{height:96px;width:72px;aspect-ratio:3\/4;object-fit:cover/);
  assert.match(html,/Facebook displays copy before the photo; Instagram normally shows it below/);
  assert.match(html,/simulation_only_no_publication/);
  assert.doesNotMatch(html,/<img[^>]+src=["']https?:/i);
  assert.doesNotMatch(html,/<script[^>]+src=/i);
  assert.doesNotMatch(html,/\bfetch\s*\(/);
  assert.doesNotMatch(html,/\bXMLHttpRequest\b/);
  assert.doesNotMatch(html,/\blocalStorage\b/);
});