<?php
declare(strict_types=1);
/**
 * Pure, read-only private narrative export. Never call this file as an HTTP
 * endpoint: the authenticated Studio owns session, CSRF and version checks.
 * The result includes ONLY the seven saved texts, not notes, secrets or media.
 */
if (isset($_SERVER['SCRIPT_FILENAME'])
    && realpath((string)$_SERVER['SCRIPT_FILENAME'])===__FILE__) {
    http_response_code(404);
    exit;
}
function cmsAtelierNarrationsExport(array $record): array {
    $id=$record['id']??null;
    $version=$record['version']??null;
    $slug=$record['slug']??null;
    $title=$record['title']??null;
    if (($record['kind']??null)!=='atelier'
        || !cmsCreationId($id)
        || !is_int($version)||$version<1||$version>9999
        || !is_string($slug)||!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D',$slug)
        || !is_string($title)||trim($title)===''||mbLen($title)>180
        || !preg_match('//u',$title))
        throw new InvalidArgumentException('ATELIER_NARRATIONS_EXPORT_IDENTITY');

    $chapters=$record['atelier_scripts']['chapters']??null;
    if (!is_array($chapters)||!array_is_list($chapters)||count($chapters)!==7)
        throw new InvalidArgumentException('ATELIER_NARRATIONS_EXPORT_INCOMPLETE');

    $labels=['Introduction','Installer','Préparer','Assembler',
        'Maîtriser','Rectifier','Terminer'];
    $lines=[
        'CUISINE DU CAMBODGE — NARRATIONS DE L’ATELIER',
        'Atelier : '.$title,
        'Version sauvegardée : v'.$version,
        'Statut : copie destinée à la relecture, sans approbation ni autorisation MP3.',
        'Les textes ci-dessous reproduisent la version enregistrée dans le Studio.',
        ''
    ];
    $fingerprints=[];
    foreach (cmsAtelierScriptIds() as $index=>$expectedId) {
        $row=$chapters[$index]??null;
        $rawIndex=is_array($row)?($row['index']??null):null;
        $text=is_array($row)?($row['text']??null):null;
        if (!is_array($row)||($row['id']??null)!==$expectedId
            ||(!is_string($rawIndex)&&!is_int($rawIndex))
            ||(string)$rawIndex!==(string)$index
            ||!is_string($text)||mbLen($text)<120||mbLen($text)>7000
            ||!preg_match('//u',$text)||str_contains($text,"\0"))
            throw new InvalidArgumentException('ATELIER_NARRATIONS_EXPORT_INCOMPLETE');
        $lines[]='=== '.($index+1).'/7 — '.$labels[$index].' ===';
        $lines[]=$text;
        $lines[]='';
        $fingerprints[]=$expectedId.' : '.hash('sha256',$text);
    }
    $lines[]='EMPREINTES SHA-256 DES TEXTES EXACTS';
    foreach ($fingerprints as $fingerprint)$lines[]=$fingerprint;
    $lines[]='';
    $body=implode("\n",$lines);
    $recipeSlug=$record['atelier_reference']['recipeSlug']??null;
    $filenameSlug=is_string($recipeSlug)
        &&preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D',$recipeSlug)
        ?$recipeSlug:$slug;
    return [
        'filename'=>'atelier-'.$filenameSlug.'-7-narrations-v'.$version.'.txt',
        'content'=>$body
    ];
}
