/**
 * Pilote autonome. Aucune modification des six leçons historiques.
 * Statut "pilot_review": méthode éditoriale à vérifier en cuisine,
 * média final et piste Coral non encore validés.
 */
export type GuidedWorkshopStatus = 'pilot_review' | 'validated';
export interface GuidedIngredient {
  id: string;
  label: string;
  quantity: string;
  purpose: string;
  allergen?: string;
}
export interface GuidedStep {
  id: string;
  title: string;
  minutes: number;
  ingredients: string[];
  instructions: string[];
  check: string;
  tip: string;
  recovery: string;
  narrationDraft: string;
}
export interface GuidedWorkshop {
  id: string;
  slug: string;
  status: GuidedWorkshopStatus;
  title: string;
  description: string;
  promise: string;
  portions: string;
  prepMinutes: number;
  heatingMinutes: number;
  tastingMinutes: number;
  recipeNote: string;
  historyUrl: string;
  ingredientUrl: string;
  relatedRecipeUrls: string[];
  image: string;
  imageAlt: string;
  equipment: string[];
  ingredients: GuidedIngredient[];
  steps: GuidedStep[];
  serving: string;
  safety: string[];
}

export const tamarindGuidedWorkshop: GuidedWorkshop = {
  id: 'pratique:sauce-tamarin',
  slug: 'sauce-tamarin',
  status: 'pilot_review',
  title: 'Préparer et équilibrer une sauce au tamarin',
  description: 'Réaliser une sauce acidulée au tamarin, de la pulpe à la dégustation : quantités, filtrage, assaisonnement, quatre bols de comparaison et corrections progressives.',
  promise: 'Vous commencez avec de la pulpe de tamarin et repartez avec une sauce prête à servir, en ayant compris comment corriger son goût.',
  portions: '2 à 3 petites portions de condiment, selon le volume obtenu après filtrage et dégustation',
  prepMinutes: 15,
  heatingMinutes: 3,
  tastingMinutes: 12,
  recipeNote: 'Recette pédagogique originale à base de tamarin et de sauce de poisson ; elle illustre des équilibres présents dans la cuisine cambodgienne, sans prétendre être une sauce traditionnelle unique. Quantités de départ à valider par un essai culinaire indépendant avant publication.',
  historyUrl: '/apprendre/equilibrer-une-sauce/',
  ingredientUrl: '/ingredients/tamarin/',
  relatedRecipeUrls: ['/recettes/samlor-machu/', '/recettes/lok-lak/'],
  image: '/images/cuisine/tamarind-1600.webp',
  imageAlt: 'Gousses de tamarin, ingrédient principal de la préparation ; cette photographie ne représente pas la sauce finale.',
  equipment: ['1 bol résistant à la chaleur et 1 cuillère', '1 passoire fine et 1 récipient gradué', '1 petite casserole', '4 coupelles identiques et 4 cuillères propres', '1 récipient propre pour la sauce terminée'],
  ingredients: [
    { id: 'tamarin', label: 'Pulpe de tamarin nature, non sucrée et sans noyaux', quantity: '25 g', purpose: 'Créer la base fruitée et acidulée' },
    { id: 'eau', label: 'Eau potable tiède', quantity: '180 ml pour l’extraction, puis un appoint mesuré si nécessaire', purpose: 'Extraire les saveurs et calibrer le filtrat' },
    { id: 'sucre', label: 'Sucre de palme râpé (ou sucre blond)', quantity: '10 g, puis une petite pincée de réserve pour l’essai doux', purpose: 'Arrondir l’acidité' },
    { id: 'poisson', label: 'Sauce de poisson', quantity: '10 ml, puis quelques gouttes de réserve pour l’essai salé', purpose: 'Ajouter le salé et l’umami', allergen: 'Poisson' }
  ],
  steps: [
    {
      id: 'extraire',
      title: 'Assouplir et travailler la pulpe',
      minutes: 7,
      ingredients: ['tamarin', 'eau'],
      instructions: [
        'Pesez 25 g de pulpe nature. Placez-la dans un bol résistant à la chaleur.',
        'Versez 180 ml d’eau tiède (non brûlante) et laissez reposer 5 minutes.',
        'Écrasez doucement la pulpe à la cuillère pour disperser la chair dans l’eau. Il ne doit plus rester de gros morceaux non travaillés.'
      ],
      check: 'Le liquide devient brun et trouble ; les éventuelles fibres restent visibles.',
      tip: 'Une pâte concentrée déjà prête n’a pas la même force qu’une pulpe brute. Ne la substituez pas gramme pour gramme sans adapter cette recette.',
      recovery: 'Si la pulpe est encore très ferme, patientez deux minutes de plus et travaillez-la à nouveau ; inutile de faire bouillir.',
      narrationDraft: 'Commençons avec vingt-cinq grammes de pulpe de tamarin. Versez cent quatre-vingts millilitres d’eau tiède, laissez reposer cinq minutes, puis écrasez délicatement. Le jus doit devenir brun et la pulpe se détacher.'
    },
    {
      id: 'filtrer',
      title: 'Filtrer et mesurer le jus',
      minutes: 4,
      ingredients: ['tamarin', 'eau'],
      instructions: [
        'Passez le mélange dans une passoire fine au-dessus du récipient gradué. Pressez avec une cuillère sans forcer les fibres à travers la maille.',
        'Mesurez 150 ml de jus filtré. Si vous en avez moins, complétez avec un peu d’eau potable ; si vous en avez davantage, prélevez exactement 150 ml et gardez l’excédent à part.',
        'Réservez 10 ml de ce jus pour les futurs essais d’acidité. Gardez 140 ml pour préparer la base.'
      ],
      check: 'Vous disposez de 140 ml de base de tamarin sans fibres, et de 10 ml de jus réservé.',
      tip: 'Mesurer après filtration stabilise les proportions : une pulpe sèche retient parfois davantage d’eau.',
      recovery: 'Si le mélange reste fibreux, filtrez une seconde fois avant de mesurer.',
      narrationDraft: 'Filtrez la pulpe et appuyez doucement à la cuillère. Mesurez cent cinquante millilitres de jus, en complétant avec un peu d’eau si besoin. Réservez dix millilitres pour les essais et gardez cent quarante millilitres pour la sauce.'
    },
    {
      id: 'base',
      title: 'Préparer la sauce de départ',
      minutes: 3,
      ingredients: ['sucre', 'poisson', 'tamarin'],
      instructions: [
        'Versez les 140 ml de jus filtré dans une petite casserole.',
        'Ajoutez 10 g de sucre de palme puis 10 ml de sauce de poisson. Remuez sur feu doux pendant environ 2 à 3 minutes, uniquement pour dissoudre le sucre.',
        'Retirez du feu. Laissez tiédir suffisamment pour goûter sans risque de brûlure. Ne faites pas réduire fortement : cela modifierait l’équilibre de départ.'
      ],
      check: 'Le sucre est dissous ; la sauce est liquide, acidulée et légèrement sucrée-salée.',
      tip: 'La sauce de poisson est déjà salée. N’ajoutez pas de sel à cette étape.',
      recovery: 'Si la sauce semble trop concentrée, ajoutez une cuillère à café d’eau avant de poursuivre, en notant l’ajustement.',
      narrationDraft: 'Nous allons former notre sauce de départ. Dans la casserole, ajoutez le jus de tamarin, dix grammes de sucre et dix millilitres de sauce de poisson. Chauffez doucement deux à trois minutes pour dissoudre le sucre, puis laissez tiédir.'
    },
    {
      id: 'comparer',
      title: 'Comparer quatre équilibres',
      minutes: 7,
      ingredients: ['tamarin', 'sucre', 'poisson'],
      instructions: [
        'Versez 20 ml de sauce tiédie dans chacun de quatre bols identiques. Gardez le reste de la sauce séparément et proprement.',
        'Laissez le premier bol sans ajout : c’est le témoin.',
        'Dans le deuxième, ajoutez 1/4 de cuillère à café du jus de tamarin réservé ; dans le troisième, une petite pincée du sucre restant ; dans le quatrième, seulement 2 à 3 gouttes supplémentaires de sauce de poisson.',
        'Mélangez chaque bol avec une cuillère propre. Goûtez sans vous brûler, puis changez leur position et essayez de retrouver votre préféré.'
      ],
      check: 'Vous pouvez dire quel bol vous paraît plus acide, plus doux ou plus salé, et expliquer votre préférence.',
      tip: 'Un seul ajout par bol : sinon vous ne saurez plus ce qui a amélioré ou déséquilibré le goût.',
      recovery: 'Si un bol est trop fort, comparez-le au témoin ; ne tentez pas de sauver tous les bols en multipliant les corrections.',
      narrationDraft: 'Préparez quatre coupelles avec vingt millilitres de sauce chacune. Le premier bol reste tel quel. Ajoutez du tamarin dans le deuxième, une petite pincée de sucre dans le troisième et quelques gouttes de sauce de poisson dans le quatrième. Goûtez séparément et observez ce qui change.'
    },
    {
      id: 'finaliser',
      title: 'Ajuster la sauce principale',
      minutes: 5,
      ingredients: ['tamarin', 'sucre', 'poisson', 'eau'],
      instructions: [
        'Reprenez la sauce restée dans la casserole, sans reverser le contenu des quatre bols de dégustation.',
        'Goûtez une petite cuillerée propre. Si elle manque d’acidité, ajoutez quelques gouttes de jus réservé ; si elle est trop acide, testez une très petite pincée de sucre ; si elle manque de salé, ajoutez 1 ou 2 gouttes de sauce de poisson.',
        'Remuez et regoûtez après chaque correction. Si l’ensemble est trop intense, ajoutez un peu d’eau, une cuillère à café à la fois. Arrêtez dès que les saveurs se complètent.'
      ],
      check: 'Le tamarin reste identifiable sans dominer ; ni le sucre ni le salé ne prennent toute la place.',
      tip: 'Votre bol favori guide la direction à prendre, mais le goût final dépend aussi de l’aliment servi avec la sauce.',
      recovery: 'Si vous avez trop salé, ne rajoutez pas mécaniquement du sucre : diluez avec un peu de base non salée ou refaites une petite base.',
      narrationDraft: 'Revenons à la sauce principale, que nous avons gardée à part. Goûtez puis corrigez une seule chose à la fois : quelques gouttes de tamarin, une pincée de sucre ou une goutte de sauce de poisson. Remuez, regoûtez et arrêtez quand le goût vous plaît.'
    },
    {
      id: 'servir',
      title: 'Servir et conserver',
      minutes: 2,
      ingredients: [],
      instructions: [
        'Versez la sauce terminée dans un récipient propre. Servez-la comme petit condiment avec des aliments entièrement cuits ou des légumes prêts à consommer.',
        'Ne remettez pas dans la sauce principale les coupelles utilisées pour la dégustation. Évitez de tremper dans la sauce une cuillère déjà portée à la bouche.',
        'S’il en reste, réfrigérez rapidement dans un récipient fermé, dans les deux heures au maximum, et consommez de préférence sous 24 heures.'
      ],
      check: 'Vous obtenez un condiment prêt à servir et savez expliquer comment vous avez trouvé son équilibre.',
      tip: 'Goûtez la sauce avec une petite bouchée de l’accompagnement : l’équilibre peut sembler différent seule ou avec le plat.',
      recovery: 'Si le résultat ne vous plaît pas avec le plat, servez la sauce séparément pour que chacun dose à son goût.',
      narrationDraft: 'Votre sauce est prête. Versez-la dans un récipient propre, puis goûtez-la avec l’accompagnement choisi. Gardez les coupelles de dégustation séparées et placez rapidement les restes au frais. Bravo, vous savez maintenant préparer puis équilibrer une sauce au tamarin.'
    }
  ],
  serving: 'À utiliser en petite quantité comme sauce de dégustation avec du riz et un accompagnement cuit. Il ne s’agit pas d’une sauce universelle pour tous les plats au tamarin.',
  safety: [
    'Contient du poisson via la sauce de poisson. Vérifiez les allergies des convives.',
    'N’utilisez pas de produits crus nécessitant une cuisson comme base de dégustation.',
    'Goûtez la sauce tiédie et non brûlante ; utilisez des cuillères propres.',
    'Conservez séparément les portions de dégustation et la sauce principale.',
    'La conservation proposée est prudente et reste à valider pour la recette définitive.'
  ]
};
