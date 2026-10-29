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
