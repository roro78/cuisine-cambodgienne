<?php
declare(strict_types=1);
require_once __DIR__.'/../../public/gestion-contenus/lib.php';

function cultureBindingAssert(bool $ok,string $label): void {
    if(!$ok)throw new RuntimeException($label);
}
function cultureBindingReject(callable $operation,string $code): void {
    try{$operation();}
    catch(InvalidArgumentException|RuntimeException $e){
        cultureBindingAssert($e->getMessage()===$code,$code.': '.$e->getMessage());
        return;
    }
    throw new RuntimeException('Accepted unexpectedly: '.$code);
}

$root=sys_get_temp_dir().'/cdc-culture-binding-'.bin2hex(random_bytes(8));
if(!mkdir($root,0700))throw new RuntimeException('TEST_STORE');
try{
    $draftId='c-99d5dc4bf5fc6f7aafaddd82';
    $sourceId='culture:sucre-de-palme-kampong-speu';
    $title='Sucre de palme au Cambodge, les gestes des producteurs de Kampong Speu';
    $published=json_decode(file_get_contents(__DIR__.'/fixtures/studio-kampong-speu-publication-v5.json'),
        true,32,JSON_THROW_ON_ERROR);
    $catalog=[$sourceId=>['id'=>$sourceId,'kind'=>'culture','title'=>$title,
        'url'=>'https://www.cuisine-du-cambodge.com/culture/sucre-de-palme-kampong-speu/',
        'fingerprint'=>'5fd2075fb35f5ba7']];
    $canonical=[$sourceId=>['id'=>$sourceId,'kind'=>'culture','model'=>'culture',
        'fingerprint'=>'237a5bca999a2e593cb6158b2cbfcd1161291a97e607a67c3c7575d036214d12']];
    $v5=['kind'=>'culture','title'=>$title,'angle'=>'Documenter la récolte','summary'=>'Brouillon privé.',
        'fields'=>['intro'=>$published['intro'],'sections'=>array_map(
            static fn(array $row):array=>['title'=>$row['title'],'paragraphs'=>implode("\n\n",$row['paragraphs'])],
            $published['sections'])]];
    $other=['kind'=>'culture','title'=>'Un autre Carnet','angle'=>'Autre projet'];
    $otherId=cmsCreationSave($root,$other,[],0)['id'];
    $v1=cmsCreationSave($root,array_replace($v5,['fields'=>[]]),[],0);
    for($version=1;$version<5;$version++)cmsCreationSave($root,$v5,[],$version,$v1['id']);

    // In production the registered ID comes from the existing private store.
    // Reproduce its five immutable files without copying any private data.
    $dir=cmsCreationDir($root);
    $versions=[];
    for($version=1;$version<=5;$version++){
        $old=$dir.'/'.$v1['id'].'.'.sprintf('%04d',$version).'.json';
        $path=$dir.'/'.$draftId.'.'.sprintf('%04d',$version).'.json';
        $row=json_decode(file_get_contents($old),true,32,JSON_THROW_ON_ERROR);
        $row['id']=$draftId;
        $versions[$path]=json_encode($row,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
        file_put_contents($path,$versions[$path]);
        unlink($old);
    }

    $v6=$v5;
    $v6['fields']['intro']='Introduction révisée.';
    $save=static fn(array $post,int $expected=5,?string $id='',
        ?array $feed=null,?array $index=null):array=>
        cmsCreationSave($root,$post,$feed??$catalog,$expected,$id===''?$draftId:$id,null,null,null,$index??$canonical);
    cultureBindingReject(fn()=>$save($v6,0,null),'CREATION_DUPLICATE');
    cultureBindingReject(fn()=>$save($v6,1,$otherId),'CREATION_DUPLICATE');
    cultureBindingReject(fn()=>$save($v6+['source_binding'=>['source_id'=>$sourceId]]),'STUDIO_BINDING_SERVER_ONLY');
    cultureBindingReject(fn()=>$save($v6,4),'CREATION_CONFLICT');
    cultureBindingReject(fn()=>$save(array_replace($v6,['title'=>'Autre identité'])),'STUDIO_SOURCE_INVALID');

    $wrongSource=$catalog;
    $wrongSource[$sourceId]['url']='https://www.cuisine-du-cambodge.com/culture/autre-fiche/';
    cultureBindingReject(fn()=>$save($v6,5,$draftId,$wrongSource),'STUDIO_SOURCE_STALE');
    $wrongIndex=$canonical;
    $wrongIndex[$sourceId]['fingerprint']=str_repeat('f',64);
    cultureBindingReject(fn()=>$save($v6,5,$draftId,$catalog,$wrongIndex),'STUDIO_SOURCE_STALE');
    $decoyId='culture:autre-fiche';
    $sameTitle=$catalog+[$decoyId=>array_replace($catalog[$sourceId],['id'=>$decoyId])];
    cultureBindingReject(fn()=>$save($v6,5,$draftId,$sameTitle),'CREATION_DUPLICATE');

    $privateConflict=cmsCreationSave($root,array_replace($other,['title'=>'Sucre de palme Kampong Speu']),[],0);
    cultureBindingReject(fn()=>$save($v6),'CREATION_DUPLICATE');
    cmsCreationSave($root,array_replace($other,['title'=>'Projet indépendant']),[],1,$privateConflict['id']);

    $anchorPath=$dir.'/'.$draftId.'.0005.json';
    $wrongAnchor=cmsCreationRead($dir,$draftId,5);
    $wrongAnchor['fields']['intro']='Un autre texte sous le même titre.';
    file_put_contents($anchorPath,json_encode($wrongAnchor,JSON_THROW_ON_ERROR));
    cultureBindingReject(fn()=>$save($v6),'STUDIO_SOURCE_INVALID');
    file_put_contents($anchorPath,$versions[$anchorPath]);

    $saved=$save($v6);
    cultureBindingAssert($saved['id']===$draftId && $saved['version']===6
        && $saved['state']==='draft' && $saved['reviewed']===false && $saved['target_date']===null
        && $saved['fields']['intro']===$v6['fields']['intro'],'PRIVATE_REVISION');
    cultureBindingAssert(cmsCreationRead($dir,$draftId,6)===$saved,'REOPEN_V6');
    cultureBindingAssert(cmsCreationVersions($dir,$draftId)===[6,5,4,3,2,1],'VERSION_CHAIN');
    foreach($versions as $path=>$bytes)cultureBindingAssert(file_get_contents($path)===$bytes,'IMMUTABLE_HISTORY');
    $binding=$saved['source_binding'];
    cultureBindingAssert($binding['draft_id']===$draftId && $binding['source_id']===$sourceId,'PERSISTED_BINDING');
    $forged=array_replace($binding,['source_id'=>$decoyId]);
    cultureBindingReject(fn()=>$save($v6+['source_binding'=>$forged],6),'STUDIO_BINDING_SERVER_ONLY');
    cultureBindingReject(fn()=>cmsCreationSave($root,$v6,$catalog,6,$draftId,null,null,$forged,$canonical),
        'STUDIO_SOURCE_INVALID');
    cultureBindingReject(fn()=>$save($v6,6,$draftId,[$decoyId=>$sameTitle[$decoyId]],[]),'STUDIO_SOURCE_STALE');
    cultureBindingReject(fn()=>$save($v6,5),'CREATION_CONFLICT');

    // After the public V6 replaces V5, the proven identity still points to
    // the same page. The proof of the original publication remains immutable.
    $catalog[$sourceId]['fingerprint']=str_repeat('2',16);
    $canonical[$sourceId]['fingerprint']=str_repeat('2',64);
    $v7=$save($v6,6,$draftId,$catalog,$canonical);
    cultureBindingAssert($v7['version']===7 && $v7['source_binding']===$binding,'SAME_ID_AFTER_PUBLICATION');
    echo "EDITORIAL_STUDIO_CULTURE_BINDING_PASS\n";
}finally{
    foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root,FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST) as $entry){
        if($entry->isDir())rmdir($entry->getPathname());else unlink($entry->getPathname());
    }
    rmdir($root);
}
