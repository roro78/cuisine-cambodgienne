<?php
declare(strict_types=1);
function contentFixture(string $kind):array {
    $fields=[
        'recette'=>['intro'=>'Introduction témoin','description'=>'Description témoin',
            'context'=>'Contexte à vérifier','baseServings'=>4,'prepTime'=>'À vérifier',
            'cookTime'=>'À vérifier','ingredients'=>[
                ['quantity'=>'','unit'=>'','name'=>'Ingrédient témoin']],
            'steps'=>[['title'=>'Étape témoin','text'=>'Utiliser l’ingrédient témoin.']],
            'equipment'=>[]],
        'culture'=>['eyebrow'=>'Mémoire','intro'=>'Introduction documentaire témoin',
            'seoDescription'=>'Description témoin','readingTime'=>'À vérifier',
            'sections'=>[['title'=>'Section témoin','paragraphs'=>['Premier paragraphe.','Second paragraphe.']]]],
        'atelier'=>['intro'=>'Présentation témoin','learningGoal'=>'Objectif à vérifier',
            'finalPreparation'=>'Résultat à vérifier','portionLabel'=>'Selon la recette source',
            'beforeStarting'=>['Consulter la recette.'],'equipment'=>['Matériel de la recette.'],
            'phases'=>array_map(static fn(string $id):array=>[
                'title'=>'Phase '.$id,'learning'=>'Objectif à vérifier pour '.$id],
                ['installer','preparer','assembler','maitriser','rectifier','terminer'])],
        'ingredient'=>['intro'=>'Introduction témoin','seoDescription'=>'Description témoin',
            'role'=>'Rôle à vérifier','deepDive'=>['Contexte à vérifier.'],
            'profile'=>['Profil à vérifier.'],'uses'=>['Usage à vérifier.'],
            'tips'=>['Conseil à vérifier.'],'choose'=>['Choix à vérifier.'],
            'keep'=>['Conservation à vérifier.'],'pairings'=>['Accord à vérifier.'],
            'mistakes'=>['Erreur à vérifier.'],'seoKeywords'=>['Terme témoin']],
        'technique'=>['description'=>'Description témoin','introduction'=>'Introduction témoin',
            'preparation'=>'À vérifier','yieldLabel'=>'À vérifier','supplies'=>['Matériel témoin'],
            'steps'=>[['title'=>'Geste témoin','text'=>'Repère à vérifier.']],
            'alternatives'=>[['title'=>'Alternative témoin','text'=>'À vérifier.']],
            'questions'=>[['question'=>'Question témoin ?','answer'=>'Réponse à vérifier.']]]
    ];
    return ['title'=>'Candidat témoin '.$kind,'angle'=>'Angle à vérifier',
        'summary'=>'<script>Texte synthétique</script>',
        'research_note'=>'PRIVATE_RESEARCH_NOT_FOR_PUBLIC_PREVIEW','fields'=>$fields[$kind]];
}
