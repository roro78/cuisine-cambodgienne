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
