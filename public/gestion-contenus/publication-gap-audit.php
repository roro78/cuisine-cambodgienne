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
