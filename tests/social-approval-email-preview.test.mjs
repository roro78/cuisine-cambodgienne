import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Tests the actual n8n Resend expression. No Resend, n8n, Meta or DB calls.
const workflow=JSON.parse(readFileSync(new URL('../automation/n8n/01-drafts-email-approval.json',import.meta.url),'utf8'));
const find=name=>{
  const matches=workflow.nodes.filter(n=>n.name===name);
  assert.equal(matches.length,1);
  return matches[0];
};
const email=find('Envoyer la demande de validation Resend');
const expression=email.parameters.body;
assert.ok(expression.startsWith('={{')&&expression.endsWith('}}'));
const source={title:'Amok Trey',url:'https://www.cuisine-du-cambodge.com/recettes/amok-trey/'};
const post={
  source,
  imageUrl:'https://www.cuisine-du-cambodge.com/social-assets/recette-amok-trey.jpg',
  facebookCaption:'Découvrir le plat\nUn poisson tendre & parfumé à la vapeur.',
  instagramCaption:'Cuisinons ensemble !\nUne recette pleine de saveurs.',
  scheduledDate:'2026-10-26',
};
const formUrl='https://n8n.orvekio.com/form-waiting/123-abc?token=signed&part=2';
const render=(p=post,url=formUrl)=>JSON.parse(vm.runInNewContext(expression.slice(3,-2),{
  $:name=>{
    assert.equal(name,'Vérifier et cadrer les textes');
    return {first:()=>({json:p})};
  },
  $execution:{resumeFormUrl:url}
},{timeout:1000}));
test('visual approval remains a single email and a single human Wait form',()=>{
  assert.equal(workflow.active,false);
  assert.equal(workflow.nodes.length,12);
  assert.equal(email.type,'n8n-nodes-base.httpRequest');
  assert.equal(email.parameters.url,'https://api.resend.com/emails');
  const wait=find('Attendre une décision via formulaire');
  assert.equal(wait.parameters.resume,'form');
  assert.equal(wait.parameters.limitWaitTime,true);
  assert.equal(wait.parameters.resumeAmount,72);
  assert.deepEqual(Array.from(wait.parameters.formFields.values[0].fieldOptions.values,v=>v.option),
    ['Approuver','Demander une modification','Refuser']);
  assert.equal(workflow.connections[email.name].main[0][0].node,wait.name);
});
test('both networks use precisely the source image and separately formatted captions',()=>{
  const body=render();
  assert.match(body.html,/Facebook/);
  assert.match(body.html,/Instagram/);
  assert.equal((body.html.match(/social-assets\/recette-amok-trey\.jpg/g)||[]).length,2);
  assert.match(body.html,/width="220"/);
  assert.match(body.html,/1080 × 1080/);
  assert.ok(body.html.includes('Un poisson tendre &amp; parfumé'));
  assert.ok(body.html.includes('Cuisinons ensemble'));
  assert.equal(body.html.includes('Un poisson tendre & parfumé'),false);
  assert.match(body.html,/recettes\/amok-trey\//);
  assert.ok(body.text.includes(post.facebookCaption));
  assert.ok(body.text.includes(post.instagramCaption));
  assert.ok(body.text.includes(formUrl));
});
test('approval is POST-only in Wait form, an email link cannot approve',()=>{
  const body=render();
  assert.match(body.html,/consulter les aperçus ne publie rien/);
  assert.ok(body.html.includes('Examiner et donner ma décision'));
  assert.equal(body.html.includes('mailto:'),false);
  assert.doesNotMatch(body.html,/<form|<script|onerror\s*=|onclick\s*=/i);
  assert.match(find('Persister la décision humaine').parameters.query,/status='draft'/);
});
test('HTML escapes title, captions and approval URL query parameters',()=>{
  const body=render({...post,source:{...source,title:'Amok <img src=x onerror=alert(1)> & test'},
    facebookCaption:'Cuisine <b>douce</b> & parfumée\nPlat préféré.'});
  assert.ok(body.html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(body.html.includes('Cuisine &lt;b&gt;douce&lt;/b&gt; &amp; parfumée'));
  assert.ok(body.html.includes('?token=signed&amp;part=2'));
  assert.doesNotMatch(body.html,/<img src=x onerror=/);
});
test('fail-closed on invalid photo, destination and form domain',()=>{
  assert.throws(()=>render({...post,imageUrl:'https://malicious.example/pic.jpg'}),/approval_preview_bad_image/);
  assert.throws(()=>render({...post,source:{...source,url:'https://evil.example/recette/'}}),/approval_preview_bad_destination/);
  assert.throws(()=>render(post,'http://n8n.orvekio.com/form-waiting/1'),/approval_preview_bad_resume_link/);
  assert.throws(()=>render(post,'https://evil.example/form-waiting/1'),/approval_preview_bad_resume_link/);
  assert.throws(()=>render({...post,instagramCaption:''}),/approval_preview_incomplete_post/);
});
test('the rendered email contains no tokens or unexpected remote tracking domains',()=>{
  const body=render();
  assert.deepEqual(Array.from(body.to),['CONFIGURER_EMAIL_VALIDATION']);
  assert.ok(body.from.includes('CONFIGURER_DOMAINE_VERIFIE'),
    'GitHub export keeps private runtime address configuration out of git');
  assert.doesNotMatch(body.html,/utm_source|pixel|facebook\.com\/tr|javascript:/i);
});
