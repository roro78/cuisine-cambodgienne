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
        $ingredients[]=$entry;
    }
    $steps=[];
    foreach($fields['steps'] as $step){
        if(!is_array($step)||!is_string($step['title']??null)
            || !is_string($step['text']??null)
            || trim($step['title'])===''||trim($step['text'])==='')
            throw new InvalidArgumentException('RECIPE_PROJECTION_STEP');
        $steps[]=['title'=>$step['title'],'text'=>$step['text']];
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
        'not_covered'=>$remaining,
        'pending_gates'=>array_merge($model['gates'],[
            'Validation éditoriale humaine distincte du statut draft/review',
            'Conversion typée Astro, CI et aperçu fidèle mobile/ordinateur',
            'Autorisation explicite de publication du site'
        ]),
        'publication_ready'=>false
    ];
}
