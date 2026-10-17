/**
 * V21 — Lessons are not recipes. Each atelier teaches one transferable skill.
 * The visual module is explicitly chosen for the skill, never inferred from the ingredient list.
 * No invented tasting measurements or unrecorded demonstration videos.
 */
export type WorkshopLearningKind = 'texture' | 'taste' | 'heat' | 'timing' | 'broth' | 'table';
export interface WorkshopStage {
  /** A short instruction that makes the pupil do something observable. */
  mission: string;
  /** Question to answer before reading the explanation. */
  question: string;
  /** An observable criterion, not an arbitrary duration or score. */
  criterion: string;
}
export interface WorkshopLearning {
  kind: WorkshopLearningKind;
  insight: string;
  evidenceTitle: string;
  evidenceIntro: string;
  experiments: [string, string, string];
  stages: [WorkshopStage, WorkshopStage, WorkshopStage, WorkshopStage];
  transfer: string;
}
export const workshopLearning: Record<string, WorkshopLearning> = {
  'piler-aromates-au-mortier': {
    kind: 'texture',
    insight: 'Le mortier ne mélange pas seulement les aromates : il écrase leurs fibres et transforme leur texture.',
    evidenceTitle: 'La texture raconte le geste',
    evidenceIntro: 'Comparez la pâte à mi-parcours et la pâte finale. Regardez les fibres, la liaison et la régularité, sans supposer qu’un nombre de coups suffit.',
    experiments: [
      'Écrasez un petit morceau de citronnelle épais, puis un morceau émincé fin : lequel cède le mieux ?',
      'Mettez de côté une noisette de pâte à mi-parcours pour une comparaison réelle.',
      'Comparez les deux échantillons : fibres visibles, cohésion au pincement et parfum dégagé.'
    ],
    stages: [
      {mission:'Préparez deux tailles de coupe et écrasez-les séparément.',question:'Laquelle résiste le moins au pilon ?',criterion:'Les fibres sont assez courtes pour se laisser broyer sans s’enrouler.'},
      {mission:'Commencez par une petite quantité d’aromates fermes.',question:'À quel moment les morceaux cessent-ils de rebondir ?',criterion:'Le contenu commence à former une masse dense plutôt que des fragments isolés.'},
      {mission:'Ramenez la pâte vers le centre et continuez à écraser.',question:'Que devient la matière quand vous la pincez ?',criterion:'La pâte se lie, les fibres paraissent plus fines, sans ajout excessif d’eau.'},
      {mission:'Placez côte à côte vos deux échantillons.',question:'Pouvez-vous justifier visuellement le moment d’arrêt ?',criterion:'La pâte finale paraît plus régulière et tient mieux au pincement.'}
    ],
    transfer:'Cette texture sert de base pour le kroeung et aide à comprendre pourquoi certaines préparations aromatiques restent granuleuses.'
  },
  'equilibrer-une-sauce': {
    kind: 'taste',
    insight: 'On ne corrige pas un goût au hasard : on compare plusieurs versions à partir d’une même base.',
    evidenceTitle: 'Un seul changement à la fois',
    evidenceIntro: 'L’acidité, la douceur et le salé ne s’ajoutent pas en bloc. Chaque bol devient une expérience que vous pouvez goûter et décrire.',
    experiments: [
      'Goûtez la base témoin et décrivez-la en quelques mots, sans chercher à la corriger.',
      'Préparez trois variantes : une acide, une douce et une légèrement plus salée. Gardez le témoin intact.',
      'Goûtez à nouveau dans un ordre différent ; expliquez quelle correction améliore votre objectif.'
    ],
    stages: [
      {mission:'Préparez plusieurs portions identiques.',question:'Que percevez-vous dans le bol témoin ?',criterion:'Vous pouvez décrire la base avant toute correction.'},
      {mission:'Changez un seul axe de goût par bol.',question:'Quelle différence attribuez-vous à chaque ajout ?',criterion:'Les variantes restent comparables car une seule variable change.'},
      {mission:'Reprenez la variante la plus pertinente, très progressivement.',question:'L’équilibre s’améliore-t-il vraiment ?',criterion:'La correction renforce le plat sans prendre toute la place.'},
      {mission:'Mélangez la position des bols et goûtez sans connaître les ajouts.',question:'Retrouvez-vous votre préférence ?',criterion:'Votre appréciation reste fondée sur le goût, pas sur le nom du bol.'}
    ],
    transfer:'Ce raisonnement peut servir pour une sauce de lok lak comme pour l’assaisonnement final d’une soupe.'
  },
  'saisir-viande-poele': {
    kind: 'heat',
    insight: 'La coloration se lit dans le contact avec la poêle, l’espace disponible et l’humidité qui s’échappe.',
    evidenceTitle: 'Saisir ou laisser cuire dans le jus ?',
    evidenceIntro: 'Deux configurations montrent des comportements différents. Le schéma illustre l’occupation de la surface ; il ne remplace pas une vérification de la cuisson à cœur.',
    experiments: [
      'Sur une poêle adaptée, comparez une petite fournée avec une fournée plus chargée.',
      'Écoutez le grésillement et observez l’apparition de vapeur ou de jus, sans approcher le visage.',
      'Comparez la coloration obtenue et notez le rôle de l’espace entre les morceaux.'
    ],
    stages: [
      {mission:'Séchez la surface de la viande et adaptez la chauffe au type de poêle.',question:'Qu’observez-vous au premier contact ?',criterion:'La surface réagit sans accumulation immédiate de liquide.'},
      {mission:'Réalisez une seconde fournée plus chargée.',question:'La vapeur et les jus évoluent-ils ?',criterion:'Vous constatez pourquoi une surcharge freine la coloration.'},
      {mission:'Ajoutez la sauce seulement après coloration de la nouvelle fournée.',question:'La surface dorée reste-t-elle perceptible ?',criterion:'Le glaçage intervient après la saisie, pas à sa place.'},
      {mission:'Retirez au bon moment et vérifiez une cuisson adaptée à la viande.',question:'Qu’est-ce qui relève de la coloration et de la cuisson sûre ?',criterion:'Vous distinguez une surface dorée d’une garantie de cuisson à cœur.'}
    ],
    transfer:'La maîtrise de la saisie peut être réutilisée pour le lok lak ou d’autres viandes sautées.'
  },
  'fraicheur-herbes-agrumes': {
    kind: 'timing',
    insight: 'Herbes, jus et zestes n’agissent ni sur le même registre ni au même moment.',
    evidenceTitle: 'Le moment change la sensation',
    evidenceIntro: 'Goûtez trois versions d’une même bouchée. La fraîcheur n’est pas une décoration : c’est un contraste que vous pouvez doser.',
    experiments: [
      'Conservez une bouchée sans finition pour référence.',
      'Comparez une feuille fraîche, quelques gouttes de jus et une pincée de zeste séparément.',
      'Ajoutez la finition choisie juste avant de servir et notez ce qui reste le plus net.'
    ],
    stages: [
      {mission:'Goûtez une portion sans aucune finition.',question:'Manque-t-il vraiment du relief ?',criterion:'Vous connaissez le goût de départ.'},
      {mission:'Ajoutez une seule herbe fraîche.',question:'Le plat reste-t-il reconnaissable ?',criterion:'Le parfum complète sans masquer.'},
      {mission:'Essayez jus et zeste dans des bouchées distinctes.',question:'Lequel modifie surtout l’acidité, lequel surtout l’arôme ?',criterion:'Vous distinguez ces deux effets.'},
      {mission:'Assemblez la finition préférée au dernier moment.',question:'L’herbe garde-t-elle sa présence et sa texture ?',criterion:'La finition reste fraîche, lisible et équilibrée.'}
    ],
    transfer:'Essayez cette lecture sur les garnitures d’un kuy teav ou d’un num banh chok.'
  },
  'bouillon-leger-savoureux': {
    kind: 'broth',
    insight: 'Une réduction concentre plusieurs saveurs à la fois : avant de saler, il faut goûter.',
    evidenceTitle: 'Deux dégustations, une décision',
    evidenceIntro: 'Réservez un échantillon de départ. Comparez-le au bouillon légèrement réduit après refroidissement à température de dégustation.',
    experiments: [
      'Prélevez un petit bol avant réduction et laissez-le refroidir suffisamment pour goûter.',
      'Réduisez modérément le bouillon puis prélevez un second échantillon, refroidi lui aussi.',
      'Comparez intensité aromatique et salinité avant de décider si un ajout est nécessaire.'
    ],
    stages: [
      {mission:'Goûtez un échantillon témoin de bouillon.',question:'Quels arômes et quel niveau de sel percevez-vous ?',criterion:'Vous disposez d’un point de départ nommé.'},
      {mission:'Laissez réduire légèrement sans saler davantage.',question:'L’intensité perçue change-t-elle ?',criterion:'Vous attribuez le changement à la concentration, pas à un ajout.'},
      {mission:'Décidez si le défaut est salé, aromatique ou lié à la fraîcheur.',question:'Quelle seule modification serait utile ?',criterion:'Vous évitez de corriger automatiquement par du sel.'},
      {mission:'Hors du feu, essayez une finition aromatique sur une portion.',question:'La note fraîche reste-t-elle identifiable ?',criterion:'Le bouillon demeure équilibré et agréable à boire.'}
    ],
    transfer:'Ce diagnostic fonctionne pour un kuy teav, mais aussi pour des soupes plus acidulées.'
  },
  'composer-repas-cambodgien': {
    kind: 'table',
    insight: 'Une table équilibrée se compose de fonctions complémentaires, pas d’une accumulation de recettes.',
    evidenceTitle: 'Quatre rôles, plusieurs bouchées',
    evidenceIntro: 'Organisez la table autour d’une base, d’un plat chaud, d’une fraîcheur et d’un condiment séparé. C’est un schéma de composition, pas une règle fixe.',
    experiments: [
      'Composez une bouchée avec le riz et le plat chaud : que domine-t-elle ?',
      'Ajoutez une note végétale ou acidulée et comparez la sensation.',
      'Variez le condiment sur une seule bouchée pour comprendre pourquoi il reste à part.'
    ],
    stages: [
      {mission:'Choisissez une base neutre à partager.',question:'Accompagne-t-elle les autres plats sans les concurrencer ?',criterion:'La base structure le repas.'},
      {mission:'Ajoutez un plat chaud qui apporte la richesse.',question:'Est-il nécessaire d’ajouter un second plat aussi riche ?',criterion:'Le cœur du repas reste lisible.'},
      {mission:'Introduisez une note croquante, fraîche ou acidulée.',question:'Que change-t-elle dans la bouchée ?',criterion:'Le contraste réveille sans démultiplier les préparations.'},
      {mission:'Placez le condiment à part et testez plusieurs bouchées.',question:'Chacun peut-il ajuster selon son goût ?',criterion:'La table offre plusieurs équilibres sans imposer le même dosage.'}
    ],
    transfer:'Vous pouvez composer une table différente avec la même logique : les plats changent, les fonctions se complètent.'
  }
};

export function getWorkshopLearning(slug: string): WorkshopLearning | undefined {
  return workshopLearning[slug];
}
