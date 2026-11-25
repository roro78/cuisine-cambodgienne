<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/publication-gap-audit.php';

function carnetCheck(bool $ok,string $case):void{
    if(!$ok)throw new RuntimeException('C4C1_'.$case);
}
function carnetRemove(string $base):void{
    if(!is_dir($base))return;
    foreach(scandir($base)?:[] as $f){
        if($f==='.'||$f==='..')continue;
        $p=$base.'/'.$f;
        if(is_dir($p)&&!is_link($p))carnetRemove($p);else unlink($p);
    }
    rmdir($base);
}
$root=sys_get_temp_dir().'/cdc-culture-evidence-'.bin2hex(random_bytes(8));
carnetCheck(mkdir($root,0700),'MKDIR');
try{
    $input=[
        'kind'=>'culture','title'=>'Carnet documentaire C4C1 essai inédit',
        'angle'=>'Une enquête culturelle, pas une recette',
        'summary'=>'Synthèse documentaire de travail',
        'target_date'=>'','state'=>'draft',
        'research_note'=>'INTERNAL_RESEARCH_NOTE_NOT_FOR_PUBLIC_PROJECTION',
        'fields'=>[
            'eyebrow'=>'Vie quotidienne','intro'=>'Contexte culturel initial.',
            'seoDescription'=>'Description pour un futur Carnet.',
            'readingTime'=>'5 min',
            'sections'=>[
                ['title'=>'Transmission','paragraphs'=>
                    "Les gestes varient selon les familles.\n\nLa nuance est essentielle."],
                ['title'=>'Contexte','paragraphs'=>'Situation historique à vérifier.']
            ]
        ]
    ];
    $old=cmsCreationSave($root,$input,[],0);
    carnetCheck(!isset($old['culture_evidence']),'OLD_DRAFT_NO_EVIDENCE');
    $oldHash=hash_file('sha256',
        cmsCreationDir($root).'/'.$old['id'].'.0001.json');
    $input['culture_evidence']=[
        'version'=>'1','items'=>[
            ['claim'=>'Point culturel à vérifier',
                'source_label'=>'Publication interne de référence',
                'source_url'=>'https://example.org/recherche/intro',
                'status'=>'pending','checked_on'=>'','note'=>'Ne pas présenter comme un fait acquis'],
            ['claim'=>'Seconde affirmation vérifiée manuellement',
                'source_label'=>'Document synthétique de référence',
                'source_url'=>'https://example.edu/documents/fiche',
                'status'=>'checked','checked_on'=>'2026-10-29',
                'note'=>'Contrôle humain interne, pas autorisation éditoriale'],
            ['claim'=>'','source_label'=>'','source_url'=>'',
                'status'=>'pending','checked_on'=>'','note'=>'']
        ]];
    $v2=cmsCreationSave($root,$input,[],1,$old['id']);
    carnetCheck($v2['version']===2 && $v2['origin']==='manual'
        && $v2['reviewed']===false
        && count($v2['culture_evidence']['items'])===2,
        'PRIVATE_PERSISTENCE_AND_BLANK_SKIPPED');
    carnetCheck(hash_file('sha256',cmsCreationDir($root).'/'.$old['id'].'.0001.json')
        ===$oldHash && !isset(cmsCreationRead(cmsCreationDir($root),$old['id'],1)['culture_evidence']),
        'IMMUTABLE_HISTORY');
    // The new research action only prepares pending entries from a bounded
    // simulated Crossref response. No provider or real network is called here.
    $article=['type'=>'journal-article','DOI'=>'10.1234/example','title'=>['Weaving study in Cambodia'],
        'container-title'=>['Synthetic journal fixture'],'published'=>['date-parts'=>[[2026]]],
        'abstract'=>'<jats:p>Cambodian weaving is documented in this explicitly synthetic research example.</jats:p>'];
    $response=['status'=>'ok','message-type'=>'work-list','message'=>['items'=>[
        $article,array_replace($article,['DOI'=>'10.1234/EXAMPLE']),
        array_replace($article,['DOI'=>'invalid']),
        array_replace($article,['DOI'=>'10.1234/unrelated','title'=>['Weaving in Finland'],
            'abstract'=>'A completely unrelated weaving study in Finland.']),
        array_replace($article,['DOI'=>'10.1234/no-extract','abstract'=>'A long sentence about Cambodian weaving '.str_repeat('and context ',30).'ends here.'])
    ]]];
    $calls=0;
    $research=cmsCultureResearchFetch('weaving',static function(string $url)use($response,&$calls):string{
        $calls++;
        carnetCheck(str_starts_with($url,'https://api.crossref.org/works?')
            &&str_contains($url,'weaving%20Cambodia%20Khmer')&&!str_contains($url,'INTERNAL_RESEARCH_NOTE'),'RESEARCH_REQUEST_SCOPE');
        return json_encode($response,JSON_THROW_ON_ERROR);
    });
    carnetCheck($calls===1&&count($research)===2,'RESEARCH_RELEVANCE_AND_DUPLICATES');
    carnetCheck($research[0]['claim']==='Cambodian weaving is documented in this explicitly synthetic research example.'
        &&$research[0]['source_url']==='https://doi.org/10.1234/example'
        &&$research[0]['status']==='pending'&&$research[0]['checked_on']==='','RESEARCH_EXACT_EXCERPT_NOT_VERIFIED');
    carnetCheck(str_starts_with($research[1]['claim'],'Pertinence et faits à vérifier')
        &&$research[1]['status']==='pending','RESEARCH_NO_INVENTED_CLAIM');
    $merged=cmsCultureResearchMerge($v2['culture_evidence'],$research);
    carnetCheck($merged['added']===2&&array_slice($merged['dossier']['items'],0,2)===$v2['culture_evidence']['items']
        &&cmsCreationRead(cmsCreationDir($root),$old['id'])===$v2,'RESEARCH_NO_MUTATION');
    carnetCheck(cmsCultureResearchMerge($merged['dossier'],$research)['added']===0,'RESEARCH_REPLAY_NO_DUPLICATE');
    $blocked=false;
    try{cmsCultureEvidenceContext($merged['dossier']);}catch(RuntimeException $e){$blocked=$e->getMessage()==='AI_CONTENT_EVIDENCE_REQUIRED';}
    carnetCheck($blocked,'RESEARCH_PENDING_NEVER_FEEDS_GENERATION');
    $blocked=false;try{cmsCultureResearchFetch('https://example.org',static function():never{throw new Exception('unexpected call');});}
    catch(InvalidArgumentException $e){$blocked=true;}
    carnetCheck($blocked,'RESEARCH_NO_ARBITRARY_URL');
    $dossier=$v2['culture_evidence'];
    $blocked=false;
    try{cmsCultureEvidenceContext($dossier);}catch(RuntimeException $e){$blocked=$e->getMessage()==='AI_CONTENT_EVIDENCE_REQUIRED';}
    carnetCheck($blocked,'DOSSIER_INCOMPLETE_NO_CONTEXT');
    $dossier['items'][1]['claim']='Premier constat documentaire suffisamment précis pour le contrôle.';
    $dossier['items'][]=['claim'=>'Deuxième constat documentaire suffisamment précis à transmettre.',
        'source_label'=>'Libellé privé non transmis','source_url'=>'https://example.org/notice',
        'status'=>'checked','checked_on'=>'2026-11-25','note'=>'PRIVATE_NOTE_EXCLUDED'];
    $context=cmsCultureEvidenceContext($dossier);
    carnetCheck(str_contains($context,'Sources : https://example.edu/documents/fiche; https://example.org/notice')
        &&str_contains($context,'Faits autorisés : Premier constat')
        &&str_contains($context,'Correspondances : 1=1; 2=2')
        &&!str_contains($context,'Point culturel à vérifier')&&!str_contains($context,'PRIVATE_NOTE_EXCLUDED')
        &&!str_contains($context,'Libellé privé non transmis'),'DOSSIER_ONLY_CHECKED_CLAIMS');
    cmsAiContentRequireCultureDossier($context);
    $blocked=false;
    try{cmsAiContentRequireCultureDossier(str_replace('2=2','2=3',$context));}
    catch(RuntimeException $e){$blocked=$e->getMessage()==='AI_CONTENT_EVIDENCE_REQUIRED';}
    carnetCheck($blocked,'DOSSIER_ATTRIBUTION_BOUND_TO_SOURCES');

    $unsafe=$dossier;$unsafe['items'][2]['source_url']='https://example.org/notice?private=excluded';
    $blocked=false;
    try{cmsCultureEvidenceContext($unsafe);}catch(RuntimeException $e){$blocked=$e->getMessage()==='AI_CONTENT_EVIDENCE_REQUIRED';}
    carnetCheck($blocked,'DOSSIER_QUERY_REJECTED');
    $unsafe=$dossier;$unsafe['items'][2]['claim']='Un premier morceau; un autre morceau de fait.';
    $blocked=false;
    try{cmsCultureEvidenceContext($unsafe);}catch(RuntimeException $e){$blocked=$e->getMessage()==='AI_CONTENT_EVIDENCE_REQUIRED';}
    carnetCheck($blocked,'DOSSIER_DELIMITER_REJECTED');
    $photo=['caption'=>'Photo documentaire candidate à vérifier','source_url'=>'https://example.org/photo',
        'credit'=>'Auteur d’essai','licence'=>'Licence à contrôler','rights_evidence_url'=>'https://example.org/rights',
        'status'=>'checked_private','checked_on'=>'2026-11-25'];
    $ref=cmsVisualReferencesClean(['version'=>1,'items'=>[$photo]]);
    $photoInput=$input;$photoInput['title']='Autre sujet documentaire et visuel inédit';
    $photoInput['visual_references']=$ref;
    $photoDraft=cmsCreationSave($root,$photoInput,[],0);
    carnetCheck($photoDraft['visual_references']===$ref&&$photoDraft['reviewed']===false,'PHOTO_PRIVATE_RECORD');
    $photoProjection=json_encode(cmsCultureAstroDraftProjection($photoDraft),JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
    carnetCheck(!str_contains($photoProjection,'example.org/photo')&&!str_contains($photoProjection,'Auteur d’essai'),'PHOTO_EXCLUDED_FROM_PUBLIC');
    $photoHash=hash_file('sha256',cmsCreationDir($root).'/'.$photoDraft['id'].'.0001.json');
    unset($photoInput['visual_references']);
    $photoV2=cmsCreationSave($root,$photoInput,[],1,$photoDraft['id']);
    carnetCheck($photoV2['visual_references']===$ref&&hash_file('sha256',cmsCreationDir($root).'/'.$photoDraft['id'].'.0001.json')===$photoHash,'PHOTO_HISTORY_AND_LEGACY');
    foreach([['credit'=>''],['licence'=>''],['checked_on'=>'2026-02-30'],['source_url'=>'https://example.org/photo?token=test'],['rights_evidence_url'=>'http://example.org/rights']] as $bad){
        $unsafe=['version'=>1,'items'=>[array_replace($photo,$bad)]];$blocked=false;
        try{cmsVisualReferencesClean($unsafe);}catch(InvalidArgumentException $e){$blocked=str_starts_with($e->getMessage(),'VISUAL_REFERENCE_');}
        carnetCheck($blocked,'PHOTO_UNVERIFIED_NOT_CHECKED');
    }
    $unsafe=['version'=>1,'items'=>[$photo,$photo]];$blocked=false;
    try{cmsVisualReferencesClean($unsafe);}catch(InvalidArgumentException $e){$blocked=$e->getMessage()==='VISUAL_REFERENCE_DUPLICATE';}
    carnetCheck($blocked,'PHOTO_DUPLICATE');
    carnetCheck(!str_contains(cmsVisualReferencesHtml(['items'=>[array_replace($photo,['caption'=>'<script>test</script>'])]],'culture','Sujet'),'<script>'),'PHOTO_HTML_ESCAPED');
    $report=cmsAstroPublicationGapReport($v2);
    carnetCheck($report['culture_evidence_count']===2
        && $report['culture_claims_marked_checked']===1
        && $report['publication_ready']===false,
        'CULTURE_GAP_FAIL_CLOSED');
    $projection=cmsCultureAstroDraftProjection($v2);
    $public=json_encode($projection,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
    carnetCheck($projection['draft']['sections'][0]['paragraphs'][0]
        ==='Les gestes varient selon les familles.'
        && !isset($projection['draft']['sources'])
        && !isset($projection['draft']['culture_evidence'])
        && !isset($projection['draft']['image'])
        && $projection['requires_human_review']===true
        && $projection['publication_ready']===false,
        'CULTURE_STRUCTURAL_DRAFT');
    foreach(['example.org','example.edu','recherche/intro',
        'INTERNAL_RESEARCH_NOTE_NOT_FOR_PUBLIC_PROJECTION',
        'Publication interne de référence','Contrôle humain interne'] as $secret)
        carnetCheck(!str_contains($public,$secret),'NO_PRIVATE_DATA_IN_PROJECTION');
    $v2['publication_ready']=true;
    $v2['reviewed']=true;
    carnetCheck(cmsCultureAstroDraftProjection($v2)['publication_ready']===false,
        'FORGED_APPROVAL_NEVER_PUBLISHES');
    unset($input['culture_evidence']);
    $v3=cmsCreationSave($root,$input,[],2,$old['id']);
    carnetCheck($v3['culture_evidence']===$v2['culture_evidence']
        && $v3['version']===3,'OLD_CLIENT_RETENTION');
    $fail=static function(array $e,string $code)use($v3,$root,$input,$old):void{
        try{
            cmsCreationSave($root,array_replace($input,['culture_evidence'=>$e]),
                [],3,$old['id']);
            throw new RuntimeException('ACCEPTED_INVALID_'.$code);
        }catch(InvalidArgumentException $ex){
            carnetCheck(str_starts_with($ex->getMessage(),'CULTURE_EVIDENCE_'),
                'REJECT_'.$code);
        }
    };
    $data=$v2['culture_evidence'];
    $data['items'][0]['source_url']='http://example.org/not-https';
    $fail($data,'HTTP_SOURCE');
    $data=$v2['culture_evidence'];
    $data['items'][0]['source_url']='https://localhost/admin';
    $fail($data,'INTERNAL_SOURCE');
    $data=$v2['culture_evidence'];
    $data['items'][0]['status']='checked';
    $fail($data,'FAKE_VERIFIED_WITHOUT_DATE');
    $data=$v2['culture_evidence'];
    $data['items'][0]['publication_ready']=true;
    $fail($data,'FORGED_PUBLICATION_FIELD');
    $data=$v2['culture_evidence'];
    $data['items'][]=$data['items'][0];
    $fail($data,'DUPLICATE_SOURCE');
    $data=$v2['culture_evidence'];
    $data['items'][0]['checked_on']='2026-02-30';
    $fail($data,'BAD_DATE');
    carnetCheck(count(cmsCreationVersions(cmsCreationDir($root),$old['id']))===3,
        'FAILED_WRITES_NO_VERSION');
    $xss=cmsCultureEvidenceHtml(['items'=>[[
        'claim'=>'<script>alert(1)</script>','source_label'=>'',
        'source_url'=>'','status'=>'pending','checked_on'=>'','note'=>''
    ]]]);
    carnetCheck(str_contains($xss,'&lt;script&gt;')
        && !str_contains($xss,'<script>')
        && str_contains($xss,'name="culture_evidence[items][0][claim]"'),
        'ADMIN_HTML_ESCAPED');
    $posted=cmsCreationPosted(['kind'=>'culture',
        'culture_evidence'=>$v2['culture_evidence']]);
    carnetCheck($posted['culture_evidence']===$v2['culture_evidence']
        && !array_key_exists('culture_evidence',
            cmsAiContentSchema('culture')['properties']),
        'AI_C2_SCHEMA_UNCHANGED');
    $ui=file_get_contents(__DIR__.'/../../public/gestion-contenus/index.php');
    carnetCheck(is_string($ui)
        && str_contains($ui,'cmsCultureEvidenceHtml')
        && str_contains($ui,'data-culture-private-review')
        && str_contains($ui,'cmsCultureAstroDraftProjection($creation)'),
        'SAME_STUDIO');
    echo 'CMS_CULTURE_EVIDENCE_C4C1_PASS '.json_encode([
        'private_revisions'=>3,'checked_claims_not_publication'=>true,
        'culture_sources_leaked'=>false,'provider_calls'=>0],JSON_THROW_ON_ERROR)."\n";
}finally{carnetRemove($root);}
