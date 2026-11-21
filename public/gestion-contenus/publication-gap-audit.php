<?php
declare(strict_types=1);
/**
 * C4-A: an informative, FAIL-CLOSED Astro/Coral completion gate for PRIVATE
 * newly-created drafts. It does not convert records, approve or publish them.
 *
 * The creation-form-core-v1 fields are not full native Astro records. Keep
 * this inventory aligned with src/data/*.ts and atelier-recette-guides/*.json.
 */
if(isset($_SERVER['SCRIPT_FILENAME'])
   && realpath((string)$_SERVER['SCRIPT_FILENAME'])===__FILE__){
    http_response_code(404);exit;
}
require_once __DIR__.'/lib.php';

function cmsAstroPublicationCoverage(): array {
    return [
        'recette'=>[
            'model'=>'src/data/recipes.ts · Recipe',
            'not_covered'=>[
                'profil recette Astro C4B1 à compléter ou vérifier : difficulty / category / tags',
                'ingredients.quantity typé en nombre, note, group, scalable',
                'steps.duration, cue, mistake et cohérence ingrédients/gestes',
                'keyPoints, substitutions, FAQ et liens utiles selon le sujet',
                'image, imageAlt, dimensions et formats lorsque le média est validé'
            ],
            'gates'=>['Relecture culinaire et sécurité alimentaire',
                'Droits, fidélité et cadrage des images']
        ],
        'culture'=>[
            'model'=>'src/data/culture.ts · CultureArticle',
            'not_covered'=>[
                'sources documentaires structurées et vérifiées',
                'image, imageAlt, imageWidth, imageHeight, imageWidths',
                'galerie, crédits et contexte des médias si nécessaires'
            ],
            'gates'=>['Contrôle documentaire et provenance des affirmations',
                'Droits photographiques, crédits et distinction des illustrations IA']
        ],
        'atelier'=>[
            'model'=>'src/data/atelier-recette-guides/*.json · cooking-workshop',
            'not_covered'=>[
                'sourceRecipeSlug, empreinte de recette et portions canoniques',
                'difficulty, duration, recipeIngredients, safety et sources',
                'six phases avec ID stable, minutes, actions, observations, contrôle, erreurs et corrections',
                'sept scripts (introduction + six phases) et chaîne audio Coral V2',
                'audio, media, review et releaseAuthorization du blueprint'
            ],
            'gates'=>['Validation humaine de la recette canonique et de la pédagogie',
                'Sécurité alimentaire, allergènes et vérification des gestes',
                'Approbation écrite des scripts, génération Coral et écoute humaine']
        ],
        'ingredient'=>[
            'model'=>'src/data/ingredients.ts · IngredientGuide',
            'not_covered'=>[
                'image, imageAlt, imageWidth, imageHeight, imageWidths',
                'justification documentaire des conseils sensibles et substitutions'
            ],
            'gates'=>['Vérification des faits, conservation et absence de promesses médicales',
                'Droits et identification fidèle de l’ingrédient photographié']
        ],
        'technique'=>[
            'model'=>'src/data/recipeTechniques.ts · RecipeTechniqueGuide',
            'not_covered'=>[
                'recipeSlugs et éventuel workshopSlug validés',
                'image, imageAlt, imageWidth, imageHeight',
                'contrôles des gestes, substitutions et sécurité documentés'
            ],
            'gates'=>['Relecture des gestes et des précautions',
                'Liens canoniques et droits du visuel pédagogique']
        ]
    ];
}

/**
 * No state, saved origin, reviewed flag, generated JSON or caller input can
 * turn this diagnostic into a publication authorization. This function is
 * read-only and deliberately has NO "approve" operation.
 */

/**
 * C4B2 read-only TYPED projection from a saved private recipe into the
 * minimal native Recipe shape. Never writes Astro, marks approval or publishes.
 * No media, research notes, provider metadata or secrets are projected.
 */
function cmsRecipeAstroDraftProjection(array $record): array {
    if(($record['kind']??null)!=='recette'
        || !is_array($record['fields']??null)
        || !is_string($record['summary']??null)
        || !cmsCreationReady('recette',$record['fields'],$record['summary'])
        || !cmsRecipeAstroProfileComplete($record['recipe_astro']??null))
        throw new InvalidArgumentException('RECIPE_PROJECTION_INCOMPLETE');
    $profile=cmsRecipeAstroProfileClean($record['recipe_astro']);
    $fields=$record['fields'];
    if(!is_string($record['slug']??null)
        || !is_string($record['title']??null)
        || cmsCreationSlug($record['title'])!==$record['slug'])
        throw new InvalidArgumentException('RECIPE_PROJECTION_IDENTITY');
    // Optional human-only detail rows, source-bound and revalidated here.
    $details=cmsRecipeAstroDetailsClean($record['recipe_astro_details']??null,$fields);
    $ingredientMeta=[];$stepMeta=[];
    foreach(($details['ingredients']??[]) as $item)$ingredientMeta[$item['index']]=$item;
    foreach(($details['steps']??[]) as $item)$stepMeta[$item['index']]=$item;
    $ingredients=[];$review=[];
    foreach($fields['ingredients'] as $index=>$row){
        if(!is_array($row))throw new InvalidArgumentException('RECIPE_PROJECTION_INGREDIENT');
        $name=cmsCreationText($row['name']??null,5000);
        $unit=cmsCreationText($row['unit']??null,100);
        $rawQuantity=cmsCreationText($row['quantity']??null,100);
        if($name==='')throw new InvalidArgumentException('RECIPE_PROJECTION_INGREDIENT');
        $entry=['name'=>$name];
        if($rawQuantity===''){
            $review[]='Quantité de l’ingrédient '.($index+1).' à vérifier';
        }else{
            if(!preg_match('/^[0-9]{1,6}(?:[.,][0-9]{1,3})?$/D',$rawQuantity))
                throw new InvalidArgumentException('RECIPE_PROJECTION_QUANTITY');
            $number=(float)str_replace(',','.',$rawQuantity);
            if(!is_finite($number)||$number<=0||$number>100000)
                throw new InvalidArgumentException('RECIPE_PROJECTION_QUANTITY');
            $entry['quantity']=floor($number)===$number?(int)$number:$number;
        }
        if($unit!=='')$entry['unit']=$unit;
        if(isset($ingredientMeta[$index])){
            $meta=$ingredientMeta[$index];
            foreach(['note','group'] as $key)
                if($meta[$key]!=='')$entry[$key]=$meta[$key];
            if($meta['scalable']!=='')$entry['scalable']=$meta['scalable']==='yes';
        }
        $ingredients[]=$entry;
    }
    $steps=[];
    foreach($fields['steps'] as $index=>$step){
        if(!is_array($step)||!is_string($step['title']??null)
            || !is_string($step['text']??null)
            || trim($step['title'])===''||trim($step['text'])==='')
            throw new InvalidArgumentException('RECIPE_PROJECTION_STEP');
        $entry=['title'=>$step['title'],'text'=>$step['text']];
        if(isset($stepMeta[$index])){
            foreach(['duration','cue','mistake'] as $key)
                if($stepMeta[$index][$key]!=='')$entry[$key]=$stepMeta[$index][$key];
        }
        $steps[]=$entry;
    }
    if(!is_array($fields['equipment']??null))
        throw new InvalidArgumentException('RECIPE_PROJECTION_EQUIPMENT');
    $recipe=[
        'slug'=>$record['slug'],'title'=>$record['title'],
        'intro'=>$fields['intro'],'description'=>$fields['description'],
        'context'=>$fields['context'],'baseServings'=>(int)$fields['baseServings'],
        'prepTime'=>$fields['prepTime'],'cookTime'=>$fields['cookTime'],
        'difficulty'=>$profile['difficulty'],'category'=>$profile['category'],
        'ingredients'=>$ingredients,'steps'=>$steps,
        'equipment'=>$fields['equipment'],'tags'=>$profile['tags']
    ];
    $review[]='Vérifier les étapes et sous-préparations avec les quantités de la recette';
    $review[]='Compléter les liens, les repères culinaires et les visuels autorisés';
    $review[]='Réception éditoriale et publication explicitement interdites à ce stade';
    return [
        'contract'=>'cdc-editorial-recipe-astro-projection-v1',
        'native_model'=>'src/data/recipes.ts · Recipe',
        'source_version'=>$record['version']??null,
        'draft'=>$recipe,'review_points'=>$review,
        'requires_human_review'=>true,'publication_ready'=>false
    ];
}


/**
 * A read-only cultural structural draft. The public CultureArticle currently
 * requires media and sources, so this is NEVER a publishable object.
 * Internal evidence and links must not cross this boundary.
 */
function cmsCultureAstroDraftProjection(array $record): array {
    if(($record['kind']??null)!=='culture'
        || !is_array($record['fields']??null)
        || !is_string($record['summary']??null)
        || !cmsCreationReady('culture',$record['fields'],$record['summary']))
        throw new InvalidArgumentException('CULTURE_PROJECTION_INCOMPLETE');
    if(!is_string($record['slug']??null)
        || !is_string($record['title']??null)
        || cmsCreationSlug($record['title'])!==$record['slug'])
        throw new InvalidArgumentException('CULTURE_PROJECTION_IDENTITY');
    $fields=$record['fields'];
    $sections=[];
    foreach($fields['sections'] as $row){
        if(!is_array($row)||!is_string($row['title']??null)
            ||!is_array($row['paragraphs']??null)
            ||trim($row['title'])===''||$row['paragraphs']===[])
            throw new InvalidArgumentException('CULTURE_PROJECTION_SECTION');
        $paras=[];
        foreach($row['paragraphs'] as $paragraph){
            if(!is_string($paragraph)||trim($paragraph)==='')
                throw new InvalidArgumentException('CULTURE_PROJECTION_SECTION');
            $paras[]=$paragraph;
        }
        $sections[]=['title'=>$row['title'],'paragraphs'=>$paras];
    }
    // No sources, image, source URL, private claim, note or approval is exported.
    return [
        'contract'=>'cdc-editorial-culture-astro-draft-v1',
        'native_model'=>'src/data/culture.ts · CultureArticle',
        'source_version'=>$record['version']??null,
        'draft'=>[
            'slug'=>$record['slug'],'title'=>$record['title'],
            'eyebrow'=>$fields['eyebrow'],'intro'=>$fields['intro'],
            'seoDescription'=>$fields['seoDescription'],
            'readingTime'=>$fields['readingTime'],'sections'=>$sections
        ],
        'pending_gates'=>[
            'Vérifier manuellement les faits et nuances dans le dossier privé',
            'Valider médias, droits et légendes avant toute conversion complète',
            'Ne pas afficher de bibliographie ni de sources de recherche sur la page'
        ],
        'requires_human_review'=>true,'publication_ready'=>false
    ];
}


/**
 * C4C2: structural projections, NOT full native records. Public media,
 * rights, researched private notes and AI provenance are deliberately absent.
 */
function cmsIngredientAstroDraftProjection(array $record): array {
    if(($record['kind']??null)!=='ingredient'
        ||!is_array($record['fields']??null)
        ||!is_string($record['summary']??null)
        ||!cmsCreationReady('ingredient',$record['fields'],$record['summary']))
        throw new InvalidArgumentException('INGREDIENT_PROJECTION_INCOMPLETE');
    if(!is_string($record['title']??null)
        ||($record['slug']??null)!==cmsCreationSlug($record['title']))
        throw new InvalidArgumentException('INGREDIENT_PROJECTION_IDENTITY');
    $fields=$record['fields'];
    $scalar=['intro','seoDescription','role'];
    $lists=['deepDive','profile','uses','tips','choose','keep','pairings','mistakes','seoKeywords'];
    $draft=['slug'=>$record['slug'],'title'=>$record['title']];
    foreach($scalar as $key){
        if(!is_string($fields[$key]??null)||trim($fields[$key])==='')
            throw new InvalidArgumentException('INGREDIENT_PROJECTION_FIELDS');
        $draft[$key]=$fields[$key];
    }
    foreach($lists as $key){
        if(!is_array($fields[$key]??null)||!array_is_list($fields[$key])
            ||count($fields[$key])<1||count($fields[$key])>40)
            throw new InvalidArgumentException('INGREDIENT_PROJECTION_LIST');
        foreach($fields[$key] as $text)
            if(!is_string($text)||trim($text)==='')
                throw new InvalidArgumentException('INGREDIENT_PROJECTION_LIST');
        $draft[$key]=$fields[$key];
    }
    return ['contract'=>'cdc-editorial-ingredient-astro-draft-v1',
        'native_model'=>'src/data/ingredients.ts · IngredientGuide',
        'source_version'=>$record['version']??null,'draft'=>$draft,
        'pending_gates'=>[
            'Vérifier les conseils de choix, conservation et substitutions',
            'Contrôler les photographies, droits, texte alternatif et dimensions',
            'Valider les faits et l’absence de promesses médicales'
        ],
        'requires_human_review'=>true,'publication_ready'=>false];
}
function cmsTechniqueAstroDraftProjection(array $record): array {
    if(($record['kind']??null)!=='technique'
        ||!is_array($record['fields']??null)
        ||!is_string($record['summary']??null)
        ||!cmsCreationReady('technique',$record['fields'],$record['summary']))
        throw new InvalidArgumentException('TECHNIQUE_PROJECTION_INCOMPLETE');
    if(!is_string($record['title']??null)
        ||($record['slug']??null)!==cmsCreationSlug($record['title']))
        throw new InvalidArgumentException('TECHNIQUE_PROJECTION_IDENTITY');
    $fields=$record['fields'];
    $draft=['slug'=>$record['slug'],'title'=>$record['title']];
    foreach(['description','introduction','preparation','yieldLabel'] as $key){
        if(!is_string($fields[$key]??null)||trim($fields[$key])==='')
            throw new InvalidArgumentException('TECHNIQUE_PROJECTION_FIELDS');
        $draft[$key]=$fields[$key];
    }
    if(!is_array($fields['supplies']??null)||!array_is_list($fields['supplies']))
        throw new InvalidArgumentException('TECHNIQUE_PROJECTION_SUPPLIES');
    $draft['supplies']=$fields['supplies'];
    foreach(['steps'=>['title','text'],'alternatives'=>['title','text'],
        'questions'=>['question','answer']] as $name=>$required){
        $rows=$fields[$name]??null;
        if(!is_array($rows)||!array_is_list($rows)||count($rows)<1)
            throw new InvalidArgumentException('TECHNIQUE_PROJECTION_ROWS');
        foreach($rows as $row)
            if(!is_array($row)||array_diff(array_keys($row),$required)
                ||!is_string($row[$required[0]]??null)
                ||!is_string($row[$required[1]]??null)
                ||trim($row[$required[0]])===''||trim($row[$required[1]])==='')
                throw new InvalidArgumentException('TECHNIQUE_PROJECTION_ROWS');
        $draft[$name]=$rows;
    }
    $links=cmsTechniqueLinksClean($record['technique_links']??null);
    $draft['recipeSlugs']=$links['recipeSlugs']??[];
    if(($links['workshopSlug']??'')!=='')$draft['workshopSlug']=$links['workshopSlug'];
    return ['contract'=>'cdc-editorial-technique-astro-draft-v1',
        'native_model'=>'src/data/recipeTechniques.ts · RecipeTechniqueGuide',
        'source_version'=>$record['version']??null,'draft'=>$draft,
        'pending_gates'=>[
            'Revalider les liens et empreintes du catalogue à la publication',
            'Vérifier la sécurité des gestes et les alternatives',
            'Contrôler le visuel, les droits et la cohérence culinaire'
        ],
        'requires_human_review'=>true,'publication_ready'=>false];
}


/**
 * Workshop preparatory gate. Core six chapter titles are not six fully
 * realized V2 phases; seven scripts and all release approvals are ABSENT.
 * A C2 AI reference must match the separately selected human reference.
 */
function cmsAtelierBlueprintPreflight(array $record,array $catalog): array {
    if(($record['kind']??null)!=='atelier')
        throw new InvalidArgumentException('ATELIER_BLUEPRINT_KIND');
    $source=cmsAtelierReferenceClean($record['atelier_reference']??null,$catalog);
    $ref=$source!==null&&$source['recipeSlug']!=='';
    $fields=$record['fields']??[];
    $summary=$record['summary']??null;
    $core=is_array($fields)&&is_string($summary)
        &&cmsCreationReady('atelier',$fields,$summary);
    $phases=is_array($fields['phases']??null)?$fields['phases']:[];
    $seen=[];$six=count($phases)===6;
    foreach($phases as $phase){
        $title=is_array($phase)&&is_string($phase['title']??null)
            ?trim($phase['title']):'';
        $learning=is_array($phase)&&is_string($phase['learning']??null)
            ?trim($phase['learning']):'';
        $key=function_exists('mb_strtolower')?mb_strtolower($title,'UTF-8')
            :strtolower($title);
        if($title===''||$learning===''||isset($seen[$key]))$six=false;
        $seen[$key]=true;
    }
    $meta=$record['ai_content']??null;
    $aiReferenceConsistent=!is_array($meta)
        ||!is_string($meta['reference_id']??null)
        ||$meta['reference_id']===''
        ||($ref&&$meta['reference_id']==='recette:'.$source['recipeSlug']);
    $details=cmsAtelierPhaseDetailsClean(
        $record['atelier_phase_details']??null,is_array($fields)?$fields:[],$source);
    $detailsReady=cmsAtelierPhaseDetailsComplete($details);
    $scriptDraft=cmsAtelierScriptsClean($record['atelier_scripts']??null,
        is_array($fields)?$fields:[],$source,$details);
    $scriptsReady=cmsAtelierScriptsDraftComplete($scriptDraft);
    return [
        'contract'=>'cdc-editorial-workshop-blueprint-preflight-v1',
        'source_version'=>$record['version']??null,
        'form_core_complete'=>$core,'phase_count'=>count($phases),
        'six_distinct_phases'=>$six,
        'canonical_reference_checked'=>$ref,
        'ai_recipe_reference_consistent'=>$aiReferenceConsistent,
        'ready_for_blueprint_enrichment'=>$core&&$six&&$ref&&$aiReferenceConsistent,
        'phase_details_complete'=>$detailsReady,
        'script_draft_count'=>count($scriptDraft['chapters']??[]),
        'seven_scripts_drafted'=>$scriptsReady,
        'ready_for_audio_review'=>$scriptsReady&&$core&&$six&&$ref&&$aiReferenceConsistent&&$detailsReady,
        'ready_for_scripts_drafting'=>$core&&$six&&$ref&&$aiReferenceConsistent&&$detailsReady,
        // C4C3B stores the six stable phase IDs and human additions,
        // but NEVER validates actual recipe quantities or scripts.
        // C2 core holds a learning goal per chapter, NOT stable IDs,
        // validated recipeIngredients or audio-script approvals.
        'stable_phase_ids_ready'=>false,'seven_audio_scripts_approved'=>false,
        'canonical_recipe_details_revalidated'=>false,
        'requires_human_review'=>true,'publication_ready'=>false
    ];
}


/**
 * C4C3D: append-only private, server-created human TEXT visa journal.
 * A visa is scoped to one saved creation revision, exactly one chapter text,
 * and the complete narrative-source digest. No TTS or publication authority.
 * Caller MUST already be authenticated with the Studio CSRF gate.
 */
function cmsAtelierVisaJournal(string $dir,string $id): array {
    if(!cmsCreationId($id))throw new InvalidArgumentException('ATELIER_VISA_ID');
    $paths=glob($dir.'/script-visa-'.$id.'.*.json');
    if(!is_array($paths)||count($paths)>9998)throw new RuntimeException('ATELIER_VISA_STORE');
    $entries=[];$previousHash='';
    foreach($paths as $path){
        if(is_link($path)||!is_file($path)||filesize($path)>2000
            ||!preg_match('/^script-visa-'.preg_quote($id,'/').'\\.([0-9]{4})\\.json$/D',
                basename($path),$match))throw new RuntimeException('ATELIER_VISA_STORE');
        $num=(int)$match[1];
        if($num!==count($entries)+1)throw new RuntimeException('ATELIER_VISA_GAP');
        $raw=file_get_contents($path);
        if(!is_string($raw))throw new RuntimeException('ATELIER_VISA_STORE');
        $entry=json_decode($raw,true,16,JSON_THROW_ON_ERROR);
        $keys=['contract','creation_id','event','creation_version','chapter',
            'action','text_sha256','binding_sha256','reviewed_at',
            'reviewer','previous_event_sha256'];
        if(!is_array($entry)||count($entry)!==count($keys)
            ||array_diff(array_keys($entry),$keys)
            ||($entry['contract']??null)!=='cdc-coral-human-text-visa-v1'
            ||($entry['creation_id']??null)!==$id
            ||($entry['event']??null)!==$num
            ||!is_int($entry['creation_version']??null)
            ||$entry['creation_version']<1||$entry['creation_version']>9999
            ||!in_array($entry['chapter']??null,cmsAtelierScriptIds(),true)
            ||!in_array($entry['action']??null,['approve','revoke'],true)
            ||!is_string($entry['text_sha256']??null)
            ||!preg_match('/^[a-f0-9]{64}$/D',$entry['text_sha256'])
            ||!is_string($entry['binding_sha256']??null)
            ||!preg_match('/^[a-f0-9]{64}$/D',$entry['binding_sha256'])
            ||($entry['reviewer']??null)!=='authenticated-cms-owner'
            ||!is_string($entry['reviewed_at']??null)
            ||!preg_match('/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/D',
                $entry['reviewed_at'])
            ||($entry['previous_event_sha256']??null)!==$previousHash)
            throw new RuntimeException('ATELIER_VISA_CORRUPT');
        $entries[]=$entry;$previousHash=hash('sha256',$raw);
    }
    return ['events'=>$entries,'last_hash'=>$previousHash];
}
function cmsAtelierVisaStatus(string $dir,array $record,array $catalog): array {
    if(($record['kind']??null)!=='atelier'
        ||!cmsCreationId($record['id']??null))
        throw new InvalidArgumentException('ATELIER_VISA_ID');
    $events=cmsAtelierVisaJournal($dir,$record['id'])['events'];
    $last=[];
    foreach($events as $event)$last[$event['chapter']]=$event;
    $approved=[];$count=0;
    try{
        $gate=cmsAtelierBlueprintPreflight($record,$catalog);
        $valid=($gate['ready_for_audio_review']??false)===true;
        $scripts=$record['atelier_scripts']??[];
        $binding=$scripts['bindingDigest']??'';
    }catch(Throwable $e){$valid=false;$scripts=[];$binding='';}
    foreach(cmsAtelierScriptIds() as $i=>$id){
        $row=$scripts['chapters'][$i]??null;
        $event=$last[$id]??null;
        $matches=$valid && is_array($row)
            &&($row['id']??null)===$id
            &&is_string($row['text']??null)
            &&is_array($event)&&$event['action']==='approve'
            &&$event['creation_version']===($record['version']??null)
            &&$event['binding_sha256']===$binding
            &&hash_equals($event['text_sha256'],hash('sha256',$row['text']));
        $approved[$id]=$matches;
        if($matches)$count++;
    }
    return ['contract'=>'cdc-coral-human-text-visa-status-v1',
        'approved_text_count'=>$count,'all_seven_texts_reviewed'=>$count===7,
        'by_chapter'=>$approved,'event_count'=>count($events),
        'authorizes_tts'=>false,'audio_approved'=>false,'publication_ready'=>false];
}
function cmsAtelierVisaAction(string $private,string $id,int $version,
    string $chapter,string $action,bool $confirmed,bool $authenticated,
    array $catalog): array {
    if(!$authenticated)throw new RuntimeException('ATELIER_VISA_AUTH');
    if(!$confirmed)throw new InvalidArgumentException('ATELIER_VISA_CONFIRM');
    if(!cmsCreationId($id)||$version<1||$version>9998
        ||!in_array($chapter,cmsAtelierScriptIds(),true)
        ||!in_array($action,['approve','revoke'],true))
        throw new InvalidArgumentException('ATELIER_VISA_INPUT');
    $dir=cmsCreationDir($private);
    // Serialize visae against all edits and concurrent approvals of this CMS.
    $lockPath=$dir.'/catalog.lock';
    if(is_link($lockPath))throw new RuntimeException('ATELIER_VISA_LOCK');
    $handle=fopen($lockPath,'c');
    if(!$handle||!flock($handle,LOCK_EX))throw new RuntimeException('ATELIER_VISA_LOCK');
    try{
        if(!@chmod($lockPath,0600))throw new RuntimeException('ATELIER_VISA_LOCK');
        $record=cmsCreationRead($dir,$id);
        if(!$record||($record['kind']??null)!=='atelier'
            ||$record['version']!==$version)
            throw new RuntimeException('ATELIER_VISA_CONFLICT');
        $gate=cmsAtelierBlueprintPreflight($record,$catalog);
        if(($gate['ready_for_audio_review']??false)!==true)
            throw new InvalidArgumentException('ATELIER_VISA_NOT_READY');
        $script=$record['atelier_scripts']??[];
        $idx=array_search($chapter,cmsAtelierScriptIds(),true);
        $row=$script['chapters'][$idx]??null;
        if(!is_array($row)||($row['id']??null)!==$chapter
            ||!is_string($row['text']??null))
            throw new InvalidArgumentException('ATELIER_VISA_CHAPTER');
        $status=cmsAtelierVisaStatus($dir,$record,$catalog);
        if(($status['by_chapter'][$chapter]??false)===($action==='approve'))
            throw new InvalidArgumentException('ATELIER_VISA_ALREADY_SET');
        $journal=cmsAtelierVisaJournal($dir,$id);
        $num=count($journal['events'])+1;
        if($num>9998)throw new RuntimeException('ATELIER_VISA_CAPACITY');
        $event=[
            'contract'=>'cdc-coral-human-text-visa-v1',
            'creation_id'=>$id,'event'=>$num,
            'creation_version'=>$record['version'],
            'chapter'=>$chapter,'action'=>$action,
            'text_sha256'=>hash('sha256',$row['text']),
            'binding_sha256'=>$script['bindingDigest'],
            'reviewed_at'=>gmdate('Y-m-d\\TH:i:s\\Z'),
            'reviewer'=>'authenticated-cms-owner',
            'previous_event_sha256'=>$journal['last_hash']
        ];
        $json=json_encode($event,JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
        $target=$dir.'/script-visa-'.$id.'.'.sprintf('%04d',$num).'.json';
        if(file_exists($target)||is_link($target))
            throw new RuntimeException('ATELIER_VISA_CONFLICT');
        $temp=tempnam($dir,'visa-');
        if($temp===false)throw new RuntimeException('ATELIER_VISA_STORE');
        try{
            if(is_link($temp)||!@chmod($temp,0600)
                ||file_put_contents($temp,$json,LOCK_EX)!==strlen($json)
                ||!rename($temp,$target))
                throw new RuntimeException('ATELIER_VISA_STORE');
        }finally{if(is_file($temp))@unlink($temp);}
        return $event;
    }finally{flock($handle,LOCK_UN);fclose($handle);}
}


/**
 * C4C3E - On-demand READ-ONLY comparison with the real canonical recipe SHA256
 * and the public guided projection. No human approval is inferred from it.
 * Only the current already-published source can be used as a reference.
 */
function cmsAtelierCanonicalRecipeAudit(array $record,array $catalog,
    array $canonical,array $guided): array {
    if(($record['kind']??null)!=='atelier')
        throw new InvalidArgumentException('ATELIER_RECIPE_AUDIT_KIND');
    $reference=cmsAtelierReferenceClean($record['atelier_reference']??null,$catalog);
    if($reference===null||$reference['recipeSlug']==='')
        throw new InvalidArgumentException('ATELIER_RECIPE_AUDIT_REFERENCE');
    $id='recette:'.$reference['recipeSlug'];
    $source=$canonical[$id]??null;
    $entry=$guided[$id]??null;
    if(!is_array($source)||!is_array($entry)
        ||($source['id']??null)!==$id
        ||($source['kind']??null)!=='recette'
        ||!is_string($source['fingerprint']??null)
        ||!preg_match('/^[a-f0-9]{64}$/D',$source['fingerprint'])
        ||($entry['id']??null)!==$id
        ||($entry['fingerprint']??null)!==$source['fingerprint']
        ||($entry['model']??null)!==($source['model']??null))
        throw new InvalidArgumentException('ATELIER_RECIPE_AUDIT_SOURCE');
    $model=$source['model'];
    $fields=$entry['fields']??[];
    $supported=$model==='recipes'
        &&is_array($fields)
        &&is_int($fields['baseServings']??null)
        &&$fields['baseServings']>0
        &&is_array($fields['ingredients']??null)
        &&array_is_list($fields['ingredients'])
        &&count($fields['ingredients'])>0;
    $rows=[];
    if($supported){
        foreach($fields['ingredients'] as $ingredient){
            if(!is_array($ingredient)
                ||!is_string($ingredient['name']??null)
                ||trim($ingredient['name'])===''
                ||isset($ingredient['quantity'])
                    &&!is_numeric($ingredient['quantity']))
                throw new InvalidArgumentException('ATELIER_RECIPE_AUDIT_INGREDIENT');
            $rows[]=[
                'name'=>$ingredient['name'],
                'quantity'=>$ingredient['quantity']??null,
                'unit'=>is_string($ingredient['unit']??null)
                    ?$ingredient['unit']:''
            ];
        }
    }
    $names=[];
    foreach($rows as $row){
        $normal=preg_replace('/\s+/u',' ',trim($row['name']));
        if(!is_string($normal))throw new InvalidArgumentException('ATELIER_RECIPE_AUDIT_INGREDIENT');
        $names[function_exists('mb_strtolower')
            ?mb_strtolower($normal,'UTF-8'):strtolower($normal)]=true;
    }
    $mentioned=[];$notExact=[];
    foreach($record['atelier_phase_details']['phases']??[] as $phase){
        foreach($phase['ingredientNames']??[] as $name){
            if(!is_string($name)||trim($name)==='')
                throw new InvalidArgumentException('ATELIER_RECIPE_AUDIT_PHASE');
            $normalized=preg_replace('/\s+/u',' ',trim($name));
            if(!is_string($normalized))throw new InvalidArgumentException('ATELIER_RECIPE_AUDIT_PHASE');
            $key=function_exists('mb_strtolower')
                ?mb_strtolower($normalized,'UTF-8'):strtolower($normalized);
            if(isset($mentioned[$key]))continue;
            $mentioned[$key]=true;
            if(!isset($names[$key]))$notExact[]=$name;
        }
    }
    // Legacy restoredRecipes need an explicit adapter: no invented servings.
    return [
        'contract'=>'cdc-editorial-atelier-recipe-audit-v1',
        'recipe_id'=>$id,'recipe_model'=>$model,
        'canonical_sha256'=>$source['fingerprint'],
        'canonical_servings'=>$supported?$fields['baseServings']:null,
        'canonical_ingredients'=>$rows,
        'phase_ingredient_mentions'=>count($mentioned),
        'phase_ingredient_not_exact'=>$notExact,
        'model_supported_for_quantity_review'=>$supported,
        'ingredient_names_exact_match_only'=>true,
        'requires_human_recipe_review'=>true,
        'canonical_recipe_details_revalidated'=>false,
        'audio_approved'=>false,'publication_ready'=>false
    ];
}


/**
 * C4C3F: independent HUMAN culinary attestation. It is an append-only
 * documentation of a review, not a determination that food is safe.
 * A changing recipe SHA256, phase digest or creation version invalidates it.
 * It can NEVER authorize TTS, existing MP3 replacement or publication.
 */
function cmsAtelierCulinaryChecks(): array {
    return ['servings','quantities','allergens','gestures'];
}
function cmsAtelierCulinaryContext(array $record,array $catalog,
    array $canonical,array $guided): array {
    $audit=cmsAtelierCanonicalRecipeAudit($record,$catalog,$canonical,$guided);
    if(($audit['model_supported_for_quantity_review']??false)!==true
        ||($audit['canonical_servings']??0)<1
        ||count($audit['canonical_ingredients']??[])<1)
        throw new InvalidArgumentException('ATELIER_CULINARY_UNSUPPORTED');
    $gate=cmsAtelierBlueprintPreflight($record,$catalog);
    if(($gate['ready_for_audio_review']??false)!==true)
        throw new InvalidArgumentException('ATELIER_CULINARY_NOT_READY');
    $binding=$record['atelier_scripts']['bindingDigest']??null;
    if(!is_string($binding)||!preg_match('/^[a-f0-9]{64}$/D',$binding))
        throw new InvalidArgumentException('ATELIER_CULINARY_NOT_READY');
    return [
        'recipe_id'=>$audit['recipe_id'],
        'recipe_sha256'=>$audit['canonical_sha256'],
        'script_binding_sha256'=>$binding,
        'base_servings'=>$audit['canonical_servings'],
        'ingredient_count'=>count($audit['canonical_ingredients'])
    ];
}
function cmsAtelierCulinaryJournal(string $dir,string $id): array {
    if(!cmsCreationId($id))throw new InvalidArgumentException('ATELIER_CULINARY_ID');
    $files=glob($dir.'/culinary-visa-'.$id.'.*.json');
    if(!is_array($files)||count($files)>9998)
        throw new RuntimeException('ATELIER_CULINARY_STORE');
    $events=[];$previous='';
    foreach($files as $file){
        if(is_link($file)||!is_file($file)||filesize($file)>4000
            ||!preg_match('/^culinary-visa-'.preg_quote($id,'/').'\\.([0-9]{4})\\.json$/D',
                basename($file),$match))
            throw new RuntimeException('ATELIER_CULINARY_STORE');
        $raw=file_get_contents($file);
        if(!is_string($raw))throw new RuntimeException('ATELIER_CULINARY_STORE');
        $row=json_decode($raw,true,16,JSON_THROW_ON_ERROR);
        $allowed=['contract','creation_id','event','creation_version','action',
            'recipe_id','recipe_sha256','script_binding_sha256','base_servings',
            'ingredient_count','checks','note','reviewer','reviewed_at',
            'previous_event_sha256'];
        if(!is_array($row)||count($row)!==count($allowed)
            ||array_diff(array_keys($row),$allowed)
            ||($row['contract']??null)!=='cdc-coral-human-culinary-visa-v1'
            ||($row['creation_id']??null)!==$id
            ||($row['event']??null)!==count($events)+1
            ||(int)$match[1]!==$row['event']
            ||!is_int($row['creation_version']??null)
            ||$row['creation_version']<1||$row['creation_version']>9999
            ||!in_array($row['action']??null,['approve','revoke'],true)
            ||!is_string($row['recipe_id']??null)
            ||!preg_match('/^recette:[a-z0-9]+(?:-[a-z0-9]+)*$/D',$row['recipe_id'])
            ||!is_string($row['recipe_sha256']??null)
            ||!preg_match('/^[0-9a-f]{64}$/D',$row['recipe_sha256'])
            ||!is_string($row['script_binding_sha256']??null)
            ||!preg_match('/^[0-9a-f]{64}$/D',$row['script_binding_sha256'])
            ||!is_int($row['base_servings']??null)
            ||$row['base_servings']<1||$row['base_servings']>100
            ||!is_int($row['ingredient_count']??null)
            ||$row['ingredient_count']<1||$row['ingredient_count']>100
            ||($row['checks']??null)!==(
                $row['action']==='approve'?cmsAtelierCulinaryChecks():[])
            ||!is_string($row['note']??null)
            ||mbLen($row['note'])<20||mbLen($row['note'])>900
            ||($row['reviewer']??null)!=='authenticated-cms-owner'
            ||!is_string($row['reviewed_at']??null)
            ||!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/D',
                $row['reviewed_at'])
            ||($row['previous_event_sha256']??null)!==$previous)
            throw new RuntimeException('ATELIER_CULINARY_CORRUPT');
        $events[]=$row;$previous=hash('sha256',$raw);
    }
    return ['events'=>$events,'last_hash'=>$previous];
}
function cmsAtelierCulinaryStatus(string $dir,array $record,array $catalog,
    array $canonical,array $guided): array {
    if(!cmsCreationId($record['id']??null))
        throw new InvalidArgumentException('ATELIER_CULINARY_ID');
    $journal=cmsAtelierCulinaryJournal($dir,$record['id']);
    $last=$journal['events']?end($journal['events']):null;
    // Current source is mandatory even for STATUS. Unavailable source =>
    // fail-closed to the UI; never assume a past review remains valid.
    $context=cmsAtelierCulinaryContext($record,$catalog,$canonical,$guided);
    $approved=is_array($last)&&($last['action']??null)==='approve'
        &&($last['creation_version']??null)===($record['version']??null)
        &&($last['recipe_id']??null)===$context['recipe_id']
        &&hash_equals($context['recipe_sha256'],$last['recipe_sha256'])
        &&hash_equals($context['script_binding_sha256'],$last['script_binding_sha256'])
        &&$last['base_servings']===$context['base_servings']
        &&$last['ingredient_count']===$context['ingredient_count'];
    return [
        'contract'=>'cdc-coral-human-culinary-visa-status-v1',
        'human_culinary_review_recorded'=>$approved,
        'review_event_count'=>count($journal['events']),
        'canonical_sha256'=>$context['recipe_sha256'],
        'source_version'=>$record['version'],
        'authorizes_tts'=>false,'audio_approved'=>false,'publication_ready'=>false
    ];
}
function cmsAtelierCulinaryAction(string $private,string $id,int $expected,
    string $action,mixed $checks,mixed $note,bool $confirmed,bool $authenticated,
    array $catalog,array $canonical,array $guided): array {
    if(!$authenticated)throw new RuntimeException('ATELIER_CULINARY_AUTH');
    if(!$confirmed)throw new InvalidArgumentException('ATELIER_CULINARY_CONFIRM');
    if(!cmsCreationId($id)||$expected<1||$expected>9998
        ||!in_array($action,['approve','revoke'],true))
        throw new InvalidArgumentException('ATELIER_CULINARY_INPUT');
    if($action==='approve' && (!is_array($checks)
        ||array_keys($checks)!==cmsAtelierCulinaryChecks()
        ||array_values($checks)!==['1','1','1','1']))
        throw new InvalidArgumentException('ATELIER_CULINARY_CHECKS');
    if($action==='revoke' && $checks!==[])
        throw new InvalidArgumentException('ATELIER_CULINARY_CHECKS');
    $note=cmsCreationText($note,900);
    if(mbLen($note)<20)throw new InvalidArgumentException('ATELIER_CULINARY_NOTE');
    $dir=cmsCreationDir($private);
    $lockPath=$dir.'/catalog.lock';
    if(is_link($lockPath))throw new RuntimeException('ATELIER_CULINARY_LOCK');
    $handle=fopen($lockPath,'c');
    if(!$handle||!flock($handle,LOCK_EX))
        throw new RuntimeException('ATELIER_CULINARY_LOCK');
    try{
        if(!@chmod($lockPath,0600))
            throw new RuntimeException('ATELIER_CULINARY_LOCK');
        $record=cmsCreationRead($dir,$id);
        if(!$record||($record['kind']??null)!=='atelier'
            ||$record['version']!==$expected)
            throw new RuntimeException('ATELIER_CULINARY_CONFLICT');
        $status=cmsAtelierCulinaryStatus($dir,$record,$catalog,$canonical,$guided);
        if($status['human_culinary_review_recorded']===($action==='approve'))
            throw new InvalidArgumentException('ATELIER_CULINARY_ALREADY_SET');
        $context=cmsAtelierCulinaryContext($record,$catalog,$canonical,$guided);
        $journal=cmsAtelierCulinaryJournal($dir,$id);
        $num=count($journal['events'])+1;
        if($num>9998)throw new RuntimeException('ATELIER_CULINARY_CAPACITY');
        $row=[
            'contract'=>'cdc-coral-human-culinary-visa-v1',
            'creation_id'=>$id,'event'=>$num,
            'creation_version'=>$record['version'],
            'action'=>$action,'recipe_id'=>$context['recipe_id'],
            'recipe_sha256'=>$context['recipe_sha256'],
            'script_binding_sha256'=>$context['script_binding_sha256'],
            'base_servings'=>$context['base_servings'],
            'ingredient_count'=>$context['ingredient_count'],
            'checks'=>$action==='approve'?cmsAtelierCulinaryChecks():[],
            'note'=>$note,
            'reviewer'=>'authenticated-cms-owner',
            'reviewed_at'=>gmdate('Y-m-d\TH:i:s\Z'),
            'previous_event_sha256'=>$journal['last_hash']
        ];
        $json=json_encode($row,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
        $target=$dir.'/culinary-visa-'.$id.'.'.sprintf('%04d',$num).'.json';
        if(file_exists($target)||is_link($target))
            throw new RuntimeException('ATELIER_CULINARY_CONFLICT');
        $temp=tempnam($dir,'culinary-');
        if($temp===false)throw new RuntimeException('ATELIER_CULINARY_STORE');
        try{
            if(is_link($temp)||!@chmod($temp,0600)
                ||file_put_contents($temp,$json,LOCK_EX)!==strlen($json)
                ||!rename($temp,$target))
                throw new RuntimeException('ATELIER_CULINARY_STORE');
        }finally{if(is_file($temp))@unlink($temp);}
        return $row;
    }finally{flock($handle,LOCK_UN);fclose($handle);}
}



/**
 * FINAL CROSS-REVIEW after all seven scripts: deterministic internal checks
 * and a separately documented human comparison against two fetched external sources.
 * This audit itself does not fetch, rewrite, call a provider, generate audio or publish.
 * A difference between culinary sources is never automatically called an error.
 */
function cmsCoralFinalAudit(array $record,array $catalog,array $canonical,array $guided): array {
    if(($record['kind']??null)!=='atelier'||!cmsCreationId($record['id']??null))
        throw new InvalidArgumentException('CORAL_FINAL_KIND');
    $issues=[];$warnings=[];$recipeSha=null;$related=[];
    try{
        $gate=cmsAtelierBlueprintPreflight($record,$catalog);
        if(($gate['ready_for_audio_review']??false)!==true)
            $issues[]=['code'=>'INCOMPLETE_WORKSHOP','chapter'=>null,
                'finding'=>'Recette liée, six phases ou sept narrations incomplètes.',
                'suggestion'=>'Corriger le brouillon privé avant la relecture finale.'];
        $recipe=cmsAtelierCanonicalRecipeAudit($record,$catalog,$canonical,$guided);
        $recipeSha=$recipe['canonical_sha256'];
        if(($recipe['model_supported_for_quantity_review']??false)!==true)
            $issues[]=['code'=>'CANONICAL_NOT_COMPARABLE','chapter'=>null,
                'finding'=>'La recette source ne permet pas de contrôler ses quantités.',
                'suggestion'=>'Compléter et valider la source canonique, sans inventer de portions.'];
        foreach($recipe['phase_ingredient_not_exact']??[] as $name)
            $issues[]=['code'=>'INGREDIENT_UNMATCHED','chapter'=>null,
                'finding'=>'Ingrédient de phase absent sous ce nom dans la recette : '.$name,
                'suggestion'=>'Corriger la phase si elle diverge ; une variante exige une décision sur la fiche, sans changer la recette publiée.'];
        if(($recipe['model_supported_for_quantity_review']??false)===true){
            $used=[];foreach($record['atelier_phase_details']['phases']??[] as $phase)
                foreach($phase['ingredientNames']??[] as $name)
                    if(is_string($name)){
                        $key=trim($name);
                        $used[function_exists('mb_strtolower')?mb_strtolower($key,'UTF-8'):strtolower($key)]=true;
                    }
            foreach($recipe['canonical_ingredients'] as $ingredient)
                if(!isset($used[function_exists('mb_strtolower')
                    ?mb_strtolower(trim($ingredient['name']),'UTF-8'):strtolower(trim($ingredient['name']))]))
                    $issues[]=['code'=>'INGREDIENT_NOT_USED','chapter'=>null,
                        'finding'=>'Ingrédient canonique absent des phases : '.$ingredient['name'],
                        'suggestion'=>'Indiquer où et comment cet ingrédient est utilisé, ou soumettre la variante à une décision éditoriale.'];
        }
    }catch(Throwable $e){
        $issues[]=['code'=>'SOURCE_UNAVAILABLE','chapter'=>null,
            'finding'=>'Références de recette ou phases impossibles à vérifier.',
            'suggestion'=>'Restaurer les index canoniques et corriger la fiche source.'];
    }
    // Pilot Amok also binds the published cultural and ingredient pages: a
    // source change invalidates the final digest, while regional variants stay human decisions.
    if(($recipe['recipe_id']??null)==='recette:amok-trey'){
        foreach(['culture:comprendre-amok','ingredient:kroeung'] as $id){
            $source=$canonical[$id]??null;$entry=$guided[$id]??null;
            if(!is_array($source)||!is_array($entry)
                ||($source['fingerprint']??null)!==($entry['fingerprint']??null)
                ||!preg_match('/^[a-f0-9]{64}$/D',(string)($source['fingerprint']??''))){
                $issues[]=['code'=>'RELATED_SITE_SOURCE_MISSING','chapter'=>null,
                    'finding'=>'Fiche culinaire connexe introuvable ou empreinte divergente : '.$id,
                    'suggestion'=>'Rétablir les index publics cohérents avant la validation finale.'];
                continue;
            }
            $fields=$entry['fields']??[];
            $ok=$id==='culture:comprendre-amok'
                ?is_array($fields)&&preg_match('/feuilles? de bananier/iu',json_encode($fields,JSON_UNESCAPED_UNICODE))===1
                :is_array($fields)&&in_array('Amok',$fields['uses']??[],true)
                    &&in_array('Poisson blanc',$fields['pairings']??[],true)
                    &&in_array('Lait de coco',$fields['pairings']??[],true);
            if(!$ok)$issues[]=['code'=>'RELATED_SITE_FACT_CHANGED','chapter'=>null,
                'finding'=>'Le lien culinaire avec la fiche '.$id.' doit être revérifié.',
                'suggestion'=>'Comparer la fiche publiée et l’atelier avant un nouveau visa.'];
            $related[]=['id'=>$id,'sha256'=>$source['fingerprint'],'facts_checked'=>$ok];
        }
    }
    $chapters=$record['atelier_scripts']['chapters']??[];
    if(!is_array($chapters)||count($chapters)!==7)
        $issues[]=['code'=>'SEVEN_SCRIPTS_REQUIRED','chapter'=>null,
            'finding'=>'Les sept textes doivent exister avant le contrôle final.',
            'suggestion'=>'Terminer les textes dans le brouillon privé.'];
    else foreach(cmsAtelierScriptIds() as $i=>$id){
        $c=$chapters[$i]??null;$text=is_array($c)?($c['text']??null):null;
        if(!is_string($text)||($c['id']??null)!==$id||mbLen($text)<120){
            $issues[]=['code'=>'SCRIPT_MISSING','chapter'=>$id,
                'finding'=>'Narration manquante, incomplète ou désordonnée.',
                'suggestion'=>'Restaurer la narration correspondante.'];
            continue;
        }
        $patterns=[
            // An indefinite singular container ("au centre d'un ramequin")
            // identifies a sample, not a fixed yield or number of servings.
            'FIXED_SERVINGS'=>'~(?<![\p{L}\p{N}])(?:(?:\d+|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze)\s+(?:petits?\s+|grands?\s+)?(?:ramequins?|assiettes?|portions?|convives?|personnes?|bols?)|(?:un|une)\s+(?:convives?|personnes?))\b~iu',
            'FIXED_INGREDIENT_QUANTITY'=>'~(?<![\p{L}\p{N}])(?:(?:\d+(?:[,.]\d+|/\d+)?|[¼½¾]|une?|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)\s*(?:g|kg|ml|cl|l|grammes?|millilitres?|centilitres?|litres?|cuillerées?|cuillères?\s+à\s+(?:soupe|café)|c\.\s*à\s*(?:soupe|café)|œufs?|oeufs?)\b|la\s+cuillerée\s+(?:prévue|réservée))~iu'
        ];
        foreach($patterns as $code=>$regex){
            if(preg_match($regex,$text,$hit,PREG_OFFSET_CAPTURE)===1){
                $passage=$hit[0][0];$replacement=null;
                if($code==='FIXED_SERVINGS'){
                    if(preg_match('/ramequins?$/iu',$passage))$replacement='vos ramequins';
                    elseif(preg_match('/assiettes?$/iu',$passage))$replacement='vos assiettes';
                    elseif(preg_match('/bols?$/iu',$passage))$replacement='vos bols';
                    elseif(preg_match('/portions?$/iu',$passage))$replacement='les portions indiquées sur la fiche';
                    elseif(preg_match('/convives?|personnes?$/iu',$passage))$replacement='vos convives';
                }
                $issues[]=['code'=>$code,'chapter'=>$id,'passage'=>$passage,
                    'finding'=>'Valeur chiffrée potentiellement liée aux convives : '.$hit[0][0],
                    'suggestion'=>'Remplacer par une consigne renvoyant aux quantités de la fiche ; préserver les repères techniques invariants.',
                    'proposed_correction'=>$replacement];
            }
        }
        if(preg_match('~(?<!\p{L})(?:fabriqu\p{L}*|fabrication\p{L}*|constru\p{L}*|chantier|poste)(?!\p{L})~iu',$text)===1)
            $issues[]=['code'=>'LEXICON','chapter'=>$id,
                'finding'=>'Vocabulaire interdit dans la narration.',
                'suggestion'=>'Employer le lexique culinaire du référentiel.'];
        if(($recipe['recipe_id']??null)==='recette:amok-trey'
            &&preg_match('/(?:seule vraie recette|unique façon traditionnelle|origine royale (?:prouvée|démontrée))/iu',$text,$hit)===1)
            $issues[]=['code'=>'AMOK_HISTORY_UNSUPPORTED','chapter'=>$id,
                'passage'=>$hit[0],
                'finding'=>'Affirmation historique ou exclusivité contredite par le Carnet Amok.',
                'suggestion'=>'Présenter la version de la fiche comme un choix parmi plusieurs variantes documentées.'];
    }
    foreach($issues as &$issue){
        $issue['location']=$issue['chapter']===null?'atelier et recette':'atelier_scripts.chapters.'.$issue['chapter'].'.text';
        $issue['passage']=$issue['passage']??$issue['finding'];
        $issue['reference']=$recipeSha??'recette canonique indisponible';
        $issue['severity']='bloquant';
        $issue['proposed_correction']=$issue['proposed_correction']??null;
    }unset($issue);
    $digest=hash('sha256',json_encode([
        'contract'=>'cdc-coral-final-cross-audit-v1',
        'id'=>$record['id'],'version'=>$record['version']??null,
        'recipe_sha256'=>$recipeSha,'related_site_sources'=>$related,
        'title'=>$record['title']??null,'summary'=>$record['summary']??null,
        'fields'=>$record['fields']??null,'reference'=>$record['atelier_reference']??null,
        'phases'=>$record['atelier_phase_details']??null,
        'scripts'=>$record['atelier_scripts']??null
    ],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR));
    return ['contract'=>'cdc-coral-final-cross-audit-v1',
        'creation_id'=>$record['id'],'creation_version'=>$record['version']??null,
        'recipe_sha256'=>$recipeSha,'related_site_sources'=>$related,'digest'=>$digest,
        'blocking'=>$issues,'warnings'=>$warnings,
        'automated_checks_pass'=>count($issues)===0,
        // Claims about cultural authenticity / safety need a human judgment.
        'external_sources_independently_verified'=>false,
        'corrections_automatically_applied'=>false,'tts_authorized'=>false];
}
function cmsCoralFinalSources(mixed $sources): array {
    if(!is_array($sources)||!array_is_list($sources)||count($sources)!==2)
        throw new InvalidArgumentException('CORAL_FINAL_SOURCES');
    $out=[];$hosts=[];$catalog=cmsCoralFinalSourceCatalog();
    foreach($sources as $source){
        if(!is_array($source)||array_keys($source)!==['title','url','note'])
            throw new InvalidArgumentException('CORAL_FINAL_SOURCES');
        $row=[];
        foreach(['title'=>180,'url'=>500,'note'=>900] as $key=>$max){
            $value=cmsCreationText($source[$key]??null,$max);
            if($value===''||($key==='note'&&mbLen($value)<30))
                throw new InvalidArgumentException('CORAL_FINAL_SOURCES');
            $row[$key]=$value;
        }
        $url=parse_url($row['url']);
        if(!is_array($url)||($url['scheme']??null)!=='https'
           ||empty($url['host'])||isset($url['user'])||isset($url['pass'])
           ||isset($url['query'])||isset($url['fragment'])
           ||preg_match('/[\x00-\x20\x7f]/',$row['url']))
            throw new InvalidArgumentException('CORAL_FINAL_SOURCES');
        $hosts[strtolower($url['host'])]=true;$out[]=$row;
        if(!isset($catalog[$row['url']])||$row['title']!==$catalog[$row['url']]['title'])
            throw new InvalidArgumentException('CORAL_FINAL_SOURCES');
    }
    if(count($hosts)!==2)throw new InvalidArgumentException('CORAL_FINAL_SOURCES');
    return $out;
}
/** Only these two editorially identified Amok pages may be fetched by the Studio. */
function cmsCoralFinalSourceCatalog(): array {
    return [
        'https://chefnak.squarespace.com/cambodian-fish-amok'=>[
            'title'=>'Chef Nak — Cambodian Fish Amok','author'=>'Chef Nak',
            'source_id'=>'chef-nak-amok','method'=>'vapeur douce, crème de coco et œufs',
            'variant'=>'Poisson et coco en quantités différentes ; cuisson vapeur de 10 + 2 minutes dans des coupes de bananier.'],
        'https://www.cambodiaembassyuk.org/fish-amok-recipe/'=>[
            'title'=>'Eleven One Kitchen — Ambassade du Cambodge','author'=>'Soklim Srun / Eleven One Kitchen',
            'source_id'=>'embassy-eleven-one-amok','method'=>'variante poêlée ; note sur la variante vapeur avec œuf',
            'variant'=>'Poisson, lait de coco et kroeung dosés différemment ; la méthode détaillée est poêlée, la note décrit aussi la vapeur.']
    ];
}
/** Fixed URL, public IPv4 pin, TLS verification, no proxy/redirect and bounded body. */
function cmsCoralFinalHttpFetch(string $url): array {
    if(!isset(cmsCoralFinalSourceCatalog()[$url])||!function_exists('curl_init'))
        throw new RuntimeException('CORAL_FINAL_FETCH_UNAVAILABLE');
    $host=parse_url($url,PHP_URL_HOST);
    if(!is_string($host)||$host==='')throw new RuntimeException('CORAL_FINAL_FETCH_UNAVAILABLE');
    $ips=gethostbynamel($host);
    if(!is_array($ips)||$ips===[])throw new RuntimeException('CORAL_FINAL_FETCH_UNAVAILABLE');
    foreach($ips as $ip)if(!filter_var($ip,FILTER_VALIDATE_IP,FILTER_FLAG_IPV4|FILTER_FLAG_NO_PRIV_RANGE|FILTER_FLAG_NO_RES_RANGE))
        throw new RuntimeException('CORAL_FINAL_FETCH_UNAVAILABLE');
    $ch=curl_init($url);if($ch===false)throw new RuntimeException('CORAL_FINAL_FETCH_UNAVAILABLE');
    $body='';
    try{
        curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>false,CURLOPT_FOLLOWLOCATION=>false,
            CURLOPT_MAXREDIRS=>0,CURLOPT_CONNECTTIMEOUT=>4,CURLOPT_TIMEOUT=>10,
            CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,
            CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,CURLOPT_REDIR_PROTOCOLS=>CURLPROTO_HTTPS,
            CURLOPT_PROXY=>'',CURLOPT_NOPROXY=>'*',CURLOPT_USERAGENT=>'CuisineDuCambodge-CoralAudit/1.0',
            CURLOPT_RESOLVE=>[$host.':443:'.$ips[0]],
            CURLOPT_WRITEFUNCTION=>static function($handle,string $chunk)use(&$body):int{
                if(strlen($body)+strlen($chunk)>524288)return 0;
                $body.=$chunk;return strlen($chunk);
            }]);
        if(curl_exec($ch)!==true||curl_errno($ch)!==0)
            throw new RuntimeException('CORAL_FINAL_FETCH_UNAVAILABLE');
        $status=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);
        $type=(string)curl_getinfo($ch,CURLINFO_CONTENT_TYPE);
        if($status!==200||!preg_match('~^text/html(?:;|$)~i',$type)||strlen($body)<500)
            throw new RuntimeException('CORAL_FINAL_FETCH_UNAVAILABLE');
        return ['status'=>$status,'content_type'=>$type,'body'=>$body];
    }finally{curl_close($ch);}
}
/** External statements are derived from fetched bytes, never from POST claims. */
function cmsCoralFinalEvidence(mixed $sources,?callable $fetcher=null): array {
    $rows=cmsCoralFinalSources($sources);$catalog=cmsCoralFinalSourceCatalog();$seen=[];
    foreach($rows as &$row){
        $response=($fetcher??'cmsCoralFinalHttpFetch')($row['url']);
        if(!is_array($response)||($response['status']??null)!==200
            ||!preg_match('~^text/html(?:;|$)~i',(string)($response['content_type']??''))
            ||!is_string($response['body']??null)
            ||strlen($response['body'])<500||strlen($response['body'])>524288)
            throw new RuntimeException('CORAL_FINAL_FETCH_UNAVAILABLE');
        $raw=$response['body'];
        $clean=preg_replace('~<(?:script|style|template|noscript)\b[^>]*>.*?</(?:script|style|template|noscript)>~is',' ',$raw);
        if(!is_string($clean))throw new RuntimeException('CORAL_FINAL_FETCH_UNAVAILABLE');
        $plain=preg_replace('~<[^>]*>~',' ',$clean);
        if(!is_string($plain))throw new RuntimeException('CORAL_FINAL_FETCH_UNAVAILABLE');
        $text=html_entity_decode($plain,ENT_QUOTES|ENT_HTML5,'UTF-8');
        $text=preg_replace('/\s+/u',' ',$text);
        if(!is_string($text)||!preg_match('~fish\s+amok|amok\s+fish~iu',$text))
            throw new RuntimeException('CORAL_FINAL_SOURCE_UNRELATED');
        $patterns=['fish'=>'~\bfish\b~iu','coconut'=>'~\bcoconut\b~iu',
            'kroeung'=>'~\b(?:kroeung|kreoung)\b~iu','steam'=>'~\bsteam(?:ed|ing)?\b~iu'];
        $observed=[];foreach($patterns as $term=>$pattern){
            if(!preg_match($pattern,$text))throw new RuntimeException('CORAL_FINAL_SOURCE_UNRELATED');
            $observed[]=$term;
        }
        $meta=$catalog[$row['url']];$seen[$meta['source_id']]=true;
        $required=$meta['source_id']==='chef-nak-amok'
            ?['~\b1\s*kg\s+fish\b~iu','~\b320\s*g\s+coconut\b~iu','~\bsteam\s+for\s+10\s+minutes\b~iu','~\bsteam\s+2\s+more\s+minutes\b~iu']
            :['~\b0[.,]25\s*kg\s+fish\b~iu','~\b70\s*ml\s+coconut\b~iu','~\bfry\s+them\b~iu','~\bto\s+be\s+steamed\b~iu'];
        foreach($required as $pattern)if(!preg_match($pattern,$text))
            throw new RuntimeException('CORAL_FINAL_SOURCE_CHANGED');
        $row['evidence']=['source_id'=>$meta['source_id'],'author'=>$meta['author'],
            'retrieved_at'=>gmdate('Y-m-d\TH:i:s\Z'),'content_sha256'=>hash('sha256',$raw),
            'observed_terms'=>$observed,'method'=>$meta['method'],'variant'=>$meta['variant']];
    }unset($row);
    if(count($seen)!==2)throw new RuntimeException('CORAL_FINAL_SOURCES');
    return $rows;
}
function cmsCoralFinalEvidenceCurrent(array $sources,bool $fresh=true): bool {
    try{
        if(count($sources)!==2)return false;$catalog=cmsCoralFinalSourceCatalog();$seen=[];
        foreach($sources as $row){
            if(!is_array($row)||array_keys($row)!==['title','url','note','evidence'])return false;
        }
        foreach($sources as $row){
            $e=$row['evidence'];$meta=$catalog[$row['url']]??null;
            if(!is_array($e)||array_keys($e)!==['source_id','author','retrieved_at','content_sha256','observed_terms','method','variant']
                ||!is_array($meta)||$e['source_id']!==$meta['source_id']||$e['author']!==$meta['author']
                ||$e['method']!==$meta['method']||$e['variant']!==$meta['variant']
                ||$e['observed_terms']!==['fish','coconut','kroeung','steam']
                ||!is_string($e['content_sha256'])||!preg_match('/^[a-f0-9]{64}$/D',$e['content_sha256']))return false;
            $then=strtotime((string)$e['retrieved_at']);
            if($then===false||$then>time()+30||($fresh&&$then<time()-3600))return false;
            $seen[$e['source_id']]=true;
        }
        cmsCoralFinalSources(array_map(static fn($r)=>array_intersect_key($r,array_flip(['title','url','note'])),$sources));
        return count($seen)===2;
    }catch(Throwable $e){return false;}
}
function cmsCoralFinalJournal(string $dir,string $id): array {
    if(!cmsCreationId($id))throw new InvalidArgumentException('CORAL_FINAL_ID');
    $files=glob($dir.'/final-review-'.$id.'.*.json');
    if(!is_array($files)||count($files)>9998)throw new RuntimeException('CORAL_FINAL_STORE');
    $events=[];$previous='';
    foreach($files as $path){
        if(is_link($path)||!is_file($path)||filesize($path)>9000
            ||(PHP_OS_FAMILY!=='Windows'&&(fileperms($path)&0077)!==0))
            throw new RuntimeException('CORAL_FINAL_STORE');
        $raw=file_get_contents($path);if(!is_string($raw))throw new RuntimeException('CORAL_FINAL_STORE');
        $r=json_decode($raw,true,24,JSON_THROW_ON_ERROR);
        $keys=['contract','creation_id','event','creation_version','action','audit_digest','recipe_sha256',
            'sources','note','reviewer','reviewed_at','previous_event_sha256'];
        if(!is_array($r)||count($r)!==count($keys)||array_diff(array_keys($r),$keys)
            ||($r['contract']??null)!=='cdc-coral-final-human-review-v1'
            ||($r['creation_id']??null)!==$id||($r['event']??null)!==count($events)+1
            ||basename($path)!=='final-review-'.$id.'.'.sprintf('%04d',$r['event']).'.json'
            ||!is_int($r['creation_version']??null)||$r['creation_version']<1
            ||!in_array($r['action']??null,['approve','revoke'],true)
            ||!is_string($r['audit_digest']??null)||!preg_match('/^[a-f0-9]{64}$/D',$r['audit_digest'])
            ||!is_string($r['recipe_sha256']??null)||!preg_match('/^[a-f0-9]{64}$/D',$r['recipe_sha256'])
            ||!is_array($r['sources']??null)
            ||($r['action']==='approve' ? !cmsCoralFinalEvidenceCurrent($r['sources'],false) : $r['sources']!==[])
            ||!is_string($r['note']??null)||mbLen($r['note'])<50||mbLen($r['note'])>900
            ||($r['reviewer']??null)!=='authenticated-cms-owner'
            ||!is_string($r['reviewed_at']??null)
            ||!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/D',$r['reviewed_at'])
            ||($r['previous_event_sha256']??null)!==$previous)
            throw new RuntimeException('CORAL_FINAL_CORRUPT');
        $events[]=$r;$previous=hash('sha256',$raw);
    }
    return ['events'=>$events,'last_hash'=>$previous];
}
function cmsCoralFinalStatus(string $private,array $record,array $catalog,array $canonical,array $guided): array {
    $report=cmsCoralFinalAudit($record,$catalog,$canonical,$guided);
    $events=cmsCoralFinalJournal(cmsCreationDir($private),$record['id'])['events'];
    $last=$events?end($events):null;
    $approved=is_array($last)&&$last['action']==='approve'
        &&$last['creation_version']===$record['version']
        &&hash_equals($report['digest'],$last['audit_digest'])
        &&$report['recipe_sha256']!==null
        &&hash_equals($report['recipe_sha256'],$last['recipe_sha256'])
        &&$report['automated_checks_pass']
        &&cmsCoralFinalEvidenceCurrent($last['sources']);
    // Existing seven per-text visas and culinary attestation remain mandatory.
    try{
        $texts=cmsAtelierVisaStatus(cmsCreationDir($private),$record,$catalog);
        $culinary=cmsAtelierCulinaryStatus(cmsCreationDir($private),$record,$catalog,$canonical,$guided);
        $approved=$approved&&$texts['all_seven_texts_reviewed']===true
            &&$culinary['human_culinary_review_recorded']===true;
    }catch(Throwable $e){$approved=false;}
    return ['contract'=>'cdc-coral-final-review-status-v1','approved'=>$approved,
        'report'=>$report,'review_event_count'=>count($events),
        'sources'=>$approved?$last['sources']:[],
        'tts_authorized'=>false,'publication_ready'=>false];
}
function cmsCoralFinalAction(string $private,string $id,int $version,string $action,mixed $sources,mixed $note,
    bool $confirmed,bool $authenticated,array $catalog,array $canonical,array $guided,
    ?callable $fetcher=null): array {
    if(!$authenticated||!$confirmed)throw new RuntimeException('CORAL_FINAL_AUTH');
    if(!cmsCreationId($id)||$version<1||!in_array($action,['approve','revoke'],true))
        throw new InvalidArgumentException('CORAL_FINAL_INPUT');
    $sourceRows=$action==='approve'?cmsCoralFinalSources($sources):[];
    $note=cmsCreationText($note,900);
    if(mbLen($note)<50)throw new InvalidArgumentException('CORAL_FINAL_NOTE');
    $dir=cmsCreationDir($private);$lock=$dir.'/catalog.lock';
    if(is_link($lock))throw new RuntimeException('CORAL_FINAL_LOCK');
    $handle=fopen($lock,'c');if(!$handle||!flock($handle,LOCK_EX))throw new RuntimeException('CORAL_FINAL_LOCK');
    try{
        if(!chmod($lock,0600))throw new RuntimeException('CORAL_FINAL_LOCK');
        $record=cmsCreationRead($dir,$id);
        if(!$record||$record['version']!==$version||($record['kind']??null)!=='atelier')
            throw new RuntimeException('CORAL_FINAL_VERSION_STALE');
        $current=cmsCoralFinalStatus($private,$record,$catalog,$canonical,$guided);
        if($current['approved']===($action==='approve'))
            throw new RuntimeException('CORAL_FINAL_ALREADY_SET');
        if($action==='approve'){
            if(!$current['report']['automated_checks_pass']
                ||$current['report']['recipe_sha256']===null)
                throw new RuntimeException('CORAL_FINAL_BLOCKING');
            $texts=cmsAtelierVisaStatus($dir,$record,$catalog);
            $culinary=cmsAtelierCulinaryStatus($dir,$record,$catalog,$canonical,$guided);
            if(!$texts['all_seven_texts_reviewed']||!$culinary['human_culinary_review_recorded'])
                throw new RuntimeException('CORAL_FINAL_REVIEWS_REQUIRED');
            $sourceRows=cmsCoralFinalEvidence($sourceRows,$fetcher);
        }
        $journal=cmsCoralFinalJournal($dir,$id);
        $n=count($journal['events'])+1;if($n>9998)throw new RuntimeException('CORAL_FINAL_CAPACITY');
        $report=$current['report'];
        $row=['contract'=>'cdc-coral-final-human-review-v1',
            'creation_id'=>$id,'event'=>$n,'creation_version'=>$version,'action'=>$action,
            'audit_digest'=>$report['digest'],'recipe_sha256'=>$report['recipe_sha256'],
            'sources'=>$sourceRows,'note'=>$note,'reviewer'=>'authenticated-cms-owner',
            'reviewed_at'=>gmdate('Y-m-d\TH:i:s\Z'),
            'previous_event_sha256'=>$journal['last_hash']];
        if($row['recipe_sha256']===null)throw new RuntimeException('CORAL_FINAL_SOURCE');
        $json=json_encode($row,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
        $target=$dir.'/final-review-'.$id.'.'.sprintf('%04d',$n).'.json';
        if(file_exists($target)||is_link($target))throw new RuntimeException('CORAL_FINAL_CONFLICT');
        $temp=tempnam($dir,'final-');if($temp===false)throw new RuntimeException('CORAL_FINAL_STORE');
        try{if(!chmod($temp,0600)||file_put_contents($temp,$json,LOCK_EX)!==strlen($json)
            ||!rename($temp,$target))throw new RuntimeException('CORAL_FINAL_STORE');
        }finally{if(is_file($temp))unlink($temp);}
        return $row;
    }finally{flock($handle,LOCK_UN);fclose($handle);}
}
/** A human may accept a narrow deterministic suggestion, edit it, or reject it. */
function cmsCoralFinalCorrection(string $private,string $id,int $version,string $code,
    ?string $chapter,string $passage,string $action,mixed $replacement,mixed $note,
    bool $confirmed,bool $authenticated,array $catalog,array $canonical,array $guided): array {
    if(!$authenticated||!$confirmed)throw new RuntimeException('CORAL_CORRECTION_AUTH');
    if(!cmsCreationId($id)||$version<1||!in_array($action,['accept','modify','reject'],true)
        ||!preg_match('/^[A-Z_]{4,50}$/D',$code)||mbLen($passage)<1||mbLen($passage)>300)
        throw new InvalidArgumentException('CORAL_CORRECTION_INPUT');
    $note=cmsCreationText($note,600);
    if(mbLen($note)<20)throw new InvalidArgumentException('CORAL_CORRECTION_NOTE');
    $dir=cmsCreationDir($private);$record=cmsCreationRead($dir,$id);
    if(!$record||$record['version']!==$version)throw new RuntimeException('CORAL_CORRECTION_STALE');
    $audit=cmsCoralFinalAudit($record,$catalog,$canonical,$guided);$issue=null;
    foreach($audit['blocking'] as $item)
        if($item['code']===$code&&$item['chapter']===$chapter&&$item['passage']===$passage){$issue=$item;break;}
    if($issue===null)throw new RuntimeException('CORAL_CORRECTION_STALE');
    if($action==='reject'){
        $lock=$dir.'/catalog.lock';if(is_link($lock))throw new RuntimeException('CORAL_CORRECTION_STORE');
        $h=fopen($lock,'c');if(!$h||!flock($h,LOCK_EX))throw new RuntimeException('CORAL_CORRECTION_STORE');
        try{
            if(cmsCreationRead($dir,$id)['version']!==$version)throw new RuntimeException('CORAL_CORRECTION_STALE');
            $prefix=$dir.'/final-correction-'.$id.'.';$files=glob($prefix.'*.json');
            if(!is_array($files)||count($files)>=9998)throw new RuntimeException('CORAL_CORRECTION_STORE');
            $previous='';foreach($files as $i=>$file){
                if(basename($file)!=='final-correction-'.$id.'.'.sprintf('%04d',$i+1).'.json'
                    ||is_link($file)||filesize($file)>2000
                    ||(PHP_OS_FAMILY!=='Windows'&&(fileperms($file)&0077)!==0))
                    throw new RuntimeException('CORAL_CORRECTION_STORE');
                $row=json_decode(file_get_contents($file),true,16,JSON_THROW_ON_ERROR);
                if(!is_array($row)||($row['previous_sha256']??null)!==$previous)
                    throw new RuntimeException('CORAL_CORRECTION_STORE');
                $previous=hash_file('sha256',$file);
            }
            $n=count($files)+1;$row=['contract'=>'cdc-coral-final-correction-rejection-v1',
                'creation_id'=>$id,'version'=>$version,'audit_digest'=>$audit['digest'],
                'code'=>$code,'chapter'=>$chapter,'passage_sha256'=>hash('sha256',$passage),
                'note'=>$note,'at'=>gmdate('Y-m-d\TH:i:s\Z'),'previous_sha256'=>$previous];
            $json=json_encode($row,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
            $target=$prefix.sprintf('%04d',$n).'.json';
            if(file_exists($target)||is_link($target))throw new RuntimeException('CORAL_CORRECTION_STORE');
            $tmp=tempnam($dir,'correction-');if($tmp===false)throw new RuntimeException('CORAL_CORRECTION_STORE');
            try{if(!chmod($tmp,0600)||file_put_contents($tmp,$json,LOCK_EX)!==strlen($json)
                ||!rename($tmp,$target))throw new RuntimeException('CORAL_CORRECTION_STORE');
            }finally{if(is_file($tmp))unlink($tmp);}
            return ['action'=>'reject','version'=>$version,'remaining_blocker'=>$code];
        }finally{flock($h,LOCK_UN);fclose($h);}
    }
    if($chapter===null||$issue['proposed_correction']===null)
        throw new RuntimeException('CORAL_CORRECTION_MANUAL_REQUIRED');
    $new=$action==='accept'?$issue['proposed_correction']:cmsCreationText($replacement,300);
    if($new===''||$new===$passage||str_contains($new,'<')||str_contains($new,'>'))
        throw new InvalidArgumentException('CORAL_CORRECTION_INPUT');
    $scripts=$record['atelier_scripts'];$found=false;
    foreach($scripts['chapters'] as &$entry){
        if($entry['id']!==$chapter)continue;
        if(substr_count($entry['text'],$passage)!==1)throw new RuntimeException('CORAL_CORRECTION_AMBIGUOUS');
        $entry['text']=str_replace($passage,$new,$entry['text']);$found=true;break;
    }unset($entry);
    if(!$found)throw new RuntimeException('CORAL_CORRECTION_STALE');
    $trace='Correction finale explicite : '.$code.' / '.$chapter.' ; motif : '.$note;
    $research=trim($record['research_note']."\n".$trace);
    if(mbLen($research)>3000)throw new RuntimeException('CORAL_CORRECTION_NOTE_CAPACITY');
    // cmsCreationSave accepts the shared form's newline text for list fields;
    // stored records contain arrays. Reconstruct only those form values.
    $fields=$record['fields'];
    foreach(cmsCreationSchema()['atelier'] as $field=>$spec)
        if($spec[1]==='list'&&is_array($fields[$field]??null))
            $fields[$field]=implode("\n",$fields[$field]);
    $posted=['kind'=>'atelier','title'=>$record['title'],'angle'=>$record['angle'],
        'summary'=>$record['summary'],'research_note'=>$research,
        'target_date'=>$record['target_date']??'','state'=>'draft','fields'=>$fields,
        'atelier_reference'=>$record['atelier_reference'],
        'atelier_phase_details'=>$record['atelier_phase_details'],'atelier_scripts'=>$scripts];
    $saved=cmsCreationSave($private,$posted,$catalog,$version,$id,null,null,null,$canonical);
    return ['action'=>$action,'version'=>$saved['version'],'reviewed'=>$saved['reviewed'],
        'before'=>$passage,'after'=>$new,'new_audit'=>cmsCoralFinalAudit($saved,$catalog,$canonical,$guided)];
}

/**
 * C4C3G — single read-only private Coral V2 pre-reception dossier.
 * Caller MUST supply canonical+guided indexes validated against the actual
 * public build. No media, TTS, publication or new approvals are generated.
 * Any source or journal inconsistency is a BLOCKER, never a green gate.
 */
function cmsAtelierCoralPrereception(string $private,array $record,array $catalog,
    array $canonical,array $guided): array {
    if(($record['kind']??null)!=='atelier'
       ||!cmsCreationId($record['id']??null))
        throw new InvalidArgumentException('CORAL_PRERECEPTION_KIND');
    $id=$record['id'];
    $dir=cmsCreationDir($private);
    $gate=null;$recipe=null;$textVisas=null;$culinary=null;
    $issues=[];$sourceValid=false;
    try{
        $gate=cmsAtelierBlueprintPreflight($record,$catalog);
    }catch(Throwable $e){$issues[]='Structure pédagogique ou recette liée incohérente.';}
    try{
        $recipe=cmsAtelierCanonicalRecipeAudit($record,$catalog,$canonical,$guided);
        $sourceValid=($recipe['model_supported_for_quantity_review']??false)===true;
        if(!$sourceValid)$issues[]='Modèle historique : doses canoniques non comparables.';
    }catch(Throwable $e){
        $issues[]='Recette Astro publiée et empreinte complète indisponibles.';
    }
    try{$textVisas=cmsAtelierVisaStatus($dir,$record,$catalog);}
    catch(Throwable $e){$issues[]='Journal privé des sept visas inaccessible ou corrompu.';}
    if($sourceValid && $gate!==null){
        try{$culinary=cmsAtelierCulinaryStatus(
            $dir,$record,$catalog,$canonical,$guided);}
        catch(Throwable $e){
            $issues[]='Visa culinaire absent de cette source, invalide ou inaccessible.';
        }
    }
    $stable=cmsAtelierScriptIds();
    $phases=is_array($record['atelier_phase_details']['phases']??null)
        ?$record['atelier_phase_details']['phases']:[];
    $scripts=is_array($record['atelier_scripts']['chapters']??null)
        ?$record['atelier_scripts']['chapters']:[];
    $chapters=[];$phaseMinutes=0;
    foreach($stable as $index=>$scriptId){
        $script=$scripts[$index]??null;
        $scriptMatches=is_array($script)
            &&($script['id']??null)===$scriptId
            &&($script['index']??null)===$index
            &&is_string($script['text']??null);
        $length=$scriptMatches?mbLen($script['text']):0;
        $plannedMinutes=null;
        if($index>0){
            $phase=$phases[$index-1]??null;
            if(is_array($phase)&&($phase['id']??null)===$scriptId
                &&is_scalar($phase['minutes']??null)
                &&preg_match('/^(?:[1-9][0-9]{0,2})$/D',(string)$phase['minutes'])
                &&(int)$phase['minutes']<=240){
                $plannedMinutes=(int)$phase['minutes'];
                $phaseMinutes+=$plannedMinutes;
            }
        }
        $chapters[]=[
            'index'=>$index,'id'=>$scriptId,
            'script_characters'=>$length,
            'script_drafted'=>$length>=120,
            'text_approved'=>($textVisas['by_chapter'][$scriptId]??false)===true,
            'planned_activity_minutes'=>$plannedMinutes,
            // Timings of actual Coral audio are never computed from text.
            'coral_mp3_verified'=>false,
            'audio_timing_verified'=>false,
            'pause_sync_mobile_verified'=>false
        ];
    }
    $summary=[
        'canonical_source'=>($sourceValid &&$gate!==null
            &&($gate['canonical_reference_checked']??false)===true),
        'six_phases'=>($gate['phase_details_complete']??false)===true
            &&($gate['six_distinct_phases']??false)===true,
        'seven_drafts'=>($gate['seven_scripts_drafted']??false)===true,
        'seven_human_text_visas'=>($textVisas['all_seven_texts_reviewed']??false)===true,
        'human_culinary_visa'=>($culinary['human_culinary_review_recorded']??false)===true,
        'media_rights_verified'=>false,
        'seven_coral_mp3_verified'=>false,
        'audio_durations_verified'=>false,
        'mobile_pause_sync_verified'=>false
    ];
    $labels=[
        'canonical_source'=>'Recette Astro et empreinte SHA256',
        'six_phases'=>'Six phases culinaires complètes',
        'seven_drafts'=>'Sept scripts narratifs complets',
        'seven_human_text_visas'=>'Sept visas humains des textes',
        'human_culinary_visa'=>'Visa de cohérence culinaire humain',
        'media_rights_verified'=>'Droits des médias et de la voix',
        'seven_coral_mp3_verified'=>'Sept MP3 Coral reçus et écoutés',
        'audio_durations_verified'=>'Durées audio réellement mesurées',
        'mobile_pause_sync_verified'=>'Pauses, chapitres et scroll testés sur mobile'
    ];
    $checks=[];
    foreach($summary as $name=>$ok)$checks[]=[
        'id'=>$name,'label'=>$labels[$name],
        'complete'=>$ok,'status'=>$ok?'checked':'blocked'
    ];
    $approvedCount=(int)($textVisas['approved_text_count']??0);
    return [
        'contract'=>'cdc-coral-private-prereception-v1',
        'creation_id'=>$id,'creation_version'=>$record['version']??null,
        'canonical_recipe_sha256'=>$sourceValid
            ?$recipe['canonical_sha256']:null,
        'checks'=>$checks,'check_count'=>count($checks),
        'completed_checks'=>count(array_filter($summary)),
        'chapters'=>$chapters,'chapters_count'=>count($chapters),
        'human_text_visas_count'=>$approvedCount,
        'total_planned_activity_minutes'=>$phaseMinutes,
        'blocking_notes'=>$issues,
        // Media delivery, audio production and publication remain separate.
        'tts_authorized'=>false,'ready_for_audio_production'=>false,
        'seven_audio_scripts_approved'=>false,
        'publication_ready'=>false,'export_enabled'=>false
    ];
}

/**
 * Separation of PRE-generation checks from POST-generation MP3 acceptance.
 * This is a READ-ONLY UI/protocol projection: no entitlement, consent,
 * quota, reservation, TTS request or file write can originate here.
 * No caller-supplied flag may turn it into authorization.
 */
function cmsCoralTtsPreproductionGate(array $receipt): array {
    $ids=['canonical_source','six_phases','seven_drafts',
        'seven_human_text_visas','human_culinary_visa',
        'media_rights_verified','seven_coral_mp3_verified',
        'audio_durations_verified','mobile_pause_sync_verified'];
    if(($receipt['contract']??null)!=='cdc-coral-private-prereception-v1'
        ||($receipt['check_count']??null)!==9
        ||!is_array($receipt['checks']??null)
        ||count($receipt['checks'])!==9
        ||!is_int($receipt['creation_version']??null)
        ||($receipt['creation_version']??0)<1
        ||($receipt['tts_authorized']??null)!==false)
        throw new InvalidArgumentException('CORAL_TTS_PREFLIGHT_INVALID');
    $status=[];
    foreach($receipt['checks'] as $i=>$item){
        if(!is_array($item)||($item['id']??null)!==$ids[$i]
            ||!is_bool($item['complete']??null)
            ||($item['status']??null)!==($item['complete']?'checked':'blocked'))
            throw new InvalidArgumentException('CORAL_TTS_PREFLIGHT_INVALID');
        $status[$ids[$i]]=$item['complete'];
    }
    // These five conditions are necessary, NEVER sufficient, for TTS.
    $contentChecks=array_slice($status,0,5,true);
    $textReady=!in_array(false,$contentChecks,true);
    $checks=$contentChecks+[
        // No private, versioned human rights decision exists in the Studio yet.
        'voice_and_media_rights_recorded'=>false,
        // Model/voice, provider, limits and true costs are not qualified.
        'tts_provider_qualified'=>false,
        'budget_and_idempotency_verified'=>false,
        // A separate intentional, authenticated user confirmation is missing.
        'generation_confirmed'=>false
    ];
    return [
        'contract'=>'cdc-coral-tts-preproduction-gate-v1',
        'creation_version'=>$receipt['creation_version'],
        'text_and_culinary_reviews_complete'=>$textReady,
        'checks'=>$checks,
        'blocking_ids'=>array_keys(array_filter($checks,static fn(bool $ok):bool=>!$ok)),
        // Invariants until a *different*, audited action owns TTS submission.
        'launch_available'=>false,'tts_authorized'=>false,
        'audio_generated'=>false,'publication_ready'=>false
    ];
}

function cmsAstroPublicationGapReport(array $record): array {
    $kind=$record['kind']??null;
    $coverage=cmsAstroPublicationCoverage();
    if(!is_string($kind)||!isset($coverage[$kind]))
        throw new InvalidArgumentException('ASTRO_GAP_KIND');

    $coreReady=false;
    if(is_array($record['fields']??null) && is_string($record['summary']??null)){
        try{
            // Saved records already contain normalized arrays, not POST textarea strings.
            $coreReady=cmsCreationReady($kind,$record['fields'],$record['summary']);
        }catch(Throwable $ignored){$coreReady=false;}
    }
    $model=$coverage[$kind];
    $cultureEvidence=$kind==='culture'
        ?cmsCultureEvidenceClean($record['culture_evidence']??null):null;
    $cultureCount=count($cultureEvidence['items']??[]);
    $techniqueLinks=$kind==='technique'
        ?cmsTechniqueLinksClean($record['technique_links']??null):null;
    $cultureChecked=count(array_filter($cultureEvidence['items']??[],
        static fn(array $item):bool=>$item['status']==='checked'));
    $profileComplete=$kind==='recette'
        ?cmsRecipeAstroProfileComplete($record['recipe_astro']??null):null;
    $remaining=$model['not_covered'];
    if($profileComplete===true){
        $remaining=array_values(array_filter($remaining,
            static fn(string $gap):bool=>!str_starts_with($gap,'profil recette Astro C4B1')));
    }
    return [
        'contract'=>'cdc-editorial-astro-gap-v1',
        'scope'=>'creation-form-core-v1',
        'kind'=>$kind,
        'native_model'=>$model['model'],
        'form_core_complete'=>$coreReady,
        'recipe_astro_profile_complete'=>$profileComplete,
        'culture_evidence_count'=>$kind==='culture'?$cultureCount:null,
        'technique_recipe_links_count'=>$kind==='technique'?count($techniqueLinks['recipeSlugs']??[]):null,
        'culture_claims_marked_checked'=>$kind==='culture'?$cultureChecked:null,
        'not_covered'=>$remaining,
        'pending_gates'=>array_merge($model['gates'],[
            'Validation éditoriale humaine distincte du statut draft/review',
            'Conversion typée Astro, CI et aperçu fidèle mobile/ordinateur',
            'Autorisation explicite de publication du site'
        ]),
        'publication_ready'=>false
    ];
}
