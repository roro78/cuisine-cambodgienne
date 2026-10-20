/**
 * Pilote autonome. Aucune modification des six leçons historiques.
 * Recette de base vérifiée par référence publiée. Médias et MP3 encore en attente.
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
  recipeNote: string;
  recipeSource: { status: 'source_verified'; title: string; url: string; checkedAt: string; crossCheckUrls: string[]; scope: string };
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
  portions: 'Environ 2 petites portions, après quatre coupelles de dégustation',
  recipeNote: 'La sauce de base reprend les proportions publiées par Cambodia Recipe (2023) : deux cuillères à soupe de pulpe de tamarin, 80 ml d’eau, deux cuillères à soupe de sucre et deux de sauce de poisson. L’ail et le piment sont facultatifs. Les petites réserves de sel, de sucre et d’eau, la filtration et les quatre bols de comparaison sont des ajouts pédagogiques pour pouvoir réellement goûter et rectifier la sauce.',
  recipeSource: {
    status: 'source_verified',
    title: 'Cambodia Recipe — Tamarind Sauce',
    url: 'https://cambodiarecipe.com/tamarind-sauce/',
    checkedAt: '2026-10-19',
    crossCheckUrls: [
      'https://cambokitchen.wordpress.com/2014/02/03/sweet-sour-tamarind-sauce-teuk-umpul-tum/',
      'https://www.cambodianess.com/article/how-to-make-trei-toek-ampil-tumdeep-fried-fish-with-tamarind-sauce',
      'https://www.eater.com/22502726/grilled-fish-recipe-chinchakriya-un-cambodian-food-pop-up'
    ],
    scope: 'Les ingrédients et les proportions de la sauce de base sont sourcés. Le filtrage facultatif, les petites réserves d’assaisonnement et d’eau, ainsi que les quatre coupelles, sont nos ajouts pédagogiques. Aucun essai gustatif indépendant ni enregistrement vocal terminé n’est revendiqué.'
  },
  historyUrl: '/apprendre/equilibrer-une-sauce/',
  ingredientUrl: '/ingredients/tamarin/',
  relatedRecipeUrls: ['/recettes/samlor-machu/', '/recettes/lok-lak/'],
  image: '/images/cuisine/tamarind-1600.webp',
  imageAlt: 'Gousses de tamarin, ingrédient principal de la préparation ; cette photographie ne représente pas la sauce finale.',
  equipment: ['1 bol résistant à la chaleur et 1 cuillère', '1 passoire fine et 1 récipient gradué', '1 petite casserole', '4 coupelles identiques, 4 cuillères propres et 1 petite cuillère de mesure', '1 récipient propre pour la sauce terminée', '3 petites coupelles pour les réserves de sucre, sauce de poisson et eau'],
  ingredients: [
    { id: 'tamarin', label: 'Pulpe de tamarin nature dénoyautée, non sucrée', quantity: '2 c. à soupe', purpose: 'Fournir le goût fruité et acidulé' },
    { id: 'eau', label: 'Eau potable', quantity: '80 ml pour la recette + 15 ml à part, si besoin', purpose: 'Détendre la pulpe avec 80 ml ; réserver jusqu’à 15 ml supplémentaires uniquement si la sauce finale doit être diluée' },
    { id: 'sucre', label: 'Sucre de palme râpé, ou sucre roux', quantity: '2 c. à soupe rases + 1 c. à café en réserve', purpose: 'Deux cuillères pour la sauce de base ; une cuillère à café supplémentaire pour les essais et corrections successives' },
    { id: 'poisson', label: 'Sauce de poisson', quantity: '30 ml pour la base + 5 ml en réserve', purpose: '30 ml (deux cuillères à soupe) dans la sauce de base ; 5 ml supplémentaires à garder dans une coupelle pour les essais et les corrections', allergen: 'Poisson' },
    { id: 'ail', label: 'Ail, facultatif', quantity: '2 gousses', purpose: 'Parfumer une variante de la sauce' },
    { id: 'piment', label: 'Petits piments frais, facultatifs', quantity: '2 petits piments', purpose: 'Relever la sauce selon les goûts' }
  ],
  steps: [
    {
      id: 'extraire',
      title: 'Délayer la pulpe de tamarin',
      minutes: 5,
      ingredients: ['tamarin', 'eau'],
      instructions: [
        'Mesurez deux cuillères à soupe de pulpe de tamarin nature sans noyaux, et non un concentré déjà sucré.',
        'Versez 80 ml d’eau potable dans une petite casserole et émiettez la pulpe dans ce liquide.',
        'Mélangez à la cuillère pour disperser la pulpe dans l’eau avant de commencer la cuisson.'
      ],
      check: 'Le tamarin se disperse dans l’eau et la colore ; vous ne voyez plus de gros morceaux secs.',
      tip: 'Une cuillère de mesure de 15 ml est plus reproductible qu’une cuillère de table ordinaire.',
      recovery: 'Si la pulpe reste en blocs, écrasez doucement à la cuillère dans l’eau tiède sans diluer excessivement.',
      narrationDraft: 'Mesurez deux cuillères à soupe de pulpe de tamarin dénoyautée. Ajoutez-la à quatre-vingts millilitres d’eau dans une petite casserole, puis écrasez les morceaux pour la délayer.'
    },
    {
      id: 'filtrer',
      title: 'Faire frémir et retirer les fibres si nécessaire',
      minutes: 5,
      ingredients: ['tamarin', 'eau'],
      instructions: [
        'Chauffez la casserole en remuant jusqu’à l’apparition de petites bulles ; la pulpe doit se mélanger à l’eau.',
        'Si de grosses fibres demeurent, passez le mélange dans une passoire fine en appuyant doucement, puis reversez le jus dans la casserole.',
        'Prélevez une cuillère à café, soit environ 5 ml, de jus de tamarin non assaisonné dans une coupelle propre et laissez-le tiédir ; cette réserve servira aux essais puis, si nécessaire, à la correction finale.'
      ],
      check: 'Le jus est homogène ; une petite portion acide non assaisonnée a été mise de côté.',
      tip: 'La source chauffe directement le tamarin dans l’eau. La filtration facultative est une adaptation de l’atelier pour éviter les fibres dans les coupelles.',
      recovery: 'Si le jus s’est trop évaporé, un très petit appoint d’eau est possible, en sachant qu’il modifie la concentration de la recette.',
      narrationDraft: 'Faites chauffer en remuant jusqu’aux petites bulles. Filtrez seulement si des fibres gênantes subsistent. Gardez une cuillère à café de jus de tamarin non assaisonné pour l’exercice de dégustation.'
    },
    {
      id: 'base',
      title: 'Assaisonner et laisser tiédir',
      minutes: 4,
      ingredients: ['sucre', 'poisson', 'ail', 'piment'],
      instructions: [
        'Dans la casserole, ajoutez deux cuillères à soupe rases de sucre de palme ou de sucre roux et 30 ml (deux cuillères à soupe) de sauce de poisson ; gardez séparément le sucre et les 5 ml de sauce de poisson supplémentaires prévus pour les essais.',
        'Si vous choisissez la variante parfumée, pelez et écrasez deux gousses d’ail, puis émincez jusqu’à deux petits piments ; incorporez-les immédiatement dans la casserole. Pour bien comparer les goûts, vous pouvez aussi laisser cette première sauce sans ail ni piment.',
        'Remuez à feu doux jusqu’à dissolution complète du sucre. Si vous avez ajouté l’ail ou le piment, maintenez un léger frémissement pendant une à deux minutes. Retirez du feu et laissez réellement tiédir avant toute dégustation, même si cela prend plus de temps que les minutes de gestes indiquées.'
      ],
      check: 'Le sucre est dissous et la sauce tiédie se goûte sans risque de brûlure.',
      tip: 'Pour distinguer plus facilement l’acidité, la douceur et le salé, essayez d’abord la sauce sans ail ni piment. Préparez vos petites réserves séparément avant de répartir les coupelles.',
      recovery: 'Si le goût semble très concentré, attendez que la sauce soit tiède pour le vérifier avant de la modifier.',
      narrationDraft: 'Ajoutez à la casserole deux cuillères à soupe de sucre et trente millilitres de sauce de poisson. Gardez un peu de chaque assaisonnement à part pour les corrections. Si vous choisissez l’ail et le piment, incorporez-les à la casserole et maintenez un petit frémissement une à deux minutes. Retirez du feu et laissez la sauce tiédir avant de goûter.'
    },
    {
      id: 'comparer',
      title: 'Comparer quatre équilibres',
      minutes: 7,
      ingredients: ['tamarin', 'sucre', 'poisson'],
      instructions: [
        'Versez 10 ml de sauce tiédie dans chacune de quatre coupelles identiques, puis conservez le reste dans un récipient propre.',
        'Laissez la première coupelle inchangée : ce sera le témoin pour comprendre les autres versions.',
        'Dans la deuxième, ajoutez deux ou trois gouttes du jus de tamarin réservé ; dans la troisième, une pincée du sucre réservé ; dans la quatrième, deux ou trois gouttes des 5 ml de sauce de poisson supplémentaire.',
        'Remuez avec des cuillères distinctes, puis goûtez sans vous brûler et comparez acidité, douceur et salé à la coupelle témoin.'
      ],
      check: 'Vous savez nommer le goût qui ressort davantage dans chacune des coupelles modifiées.',
      tip: 'Les quatre coupelles sont une expérience pédagogique ajoutée à la recette publiée, et non une étape revendiquée par son auteur.',
      recovery: 'Si une correction ne se distingue pas, regoûtez le témoin avant de faire des ajouts supplémentaires.',
      narrationDraft: 'Versez dix millilitres de sauce tiédie dans chacune des quatre coupelles. Gardez la première nature : elle est votre témoin. Dans la deuxième, versez deux ou trois gouttes du jus de tamarin réservé ; dans la troisième, une pincée de sucre ; dans la quatrième, deux ou trois gouttes de sauce de poisson prélevées sur la réserve. Mélangez avec des cuillères propres, puis comparez sans vous brûler.'
    },
    {
      id: 'finaliser',
      title: 'Corriger la sauce principale',
      minutes: 5,
      ingredients: ['tamarin', 'sucre', 'poisson', 'eau'],
      instructions: [
        'Reprenez la sauce restée proprement dans le récipient principal, sans y reverser aucune des coupelles déjà goûtées.',
        'Pour plus d’acidité, utilisez quelques gouttes du jus de tamarin encore réservé ; pour adoucir, une pincée de sucre gardé à part ; pour renforcer le salé, une ou deux gouttes de sauce de poisson prélevées sur les 5 ml supplémentaires.',
        'Remuez et regoûtez après chaque correction avec une cuillère propre ; si l’ensemble reste trop intense, ajoutez une cuillère à café (5 ml) d’eau supplémentaire à la fois, sans dépasser d’emblée les 15 ml préparés à part. Cette eau ne fait pas partie des 80 ml de la recette de base.'
      ],
      check: 'La sauce garde une saveur de tamarin identifiable et l’équilibre vous plaît avec son accompagnement.',
      tip: 'La recette source conseille de rectifier le sucré et le salé, sans imposer un équilibre identique à toutes les personnes.',
      recovery: 'Si vous avez trop salé, évitez de masquer ce défaut avec beaucoup de sucre ; corrigez plutôt la concentration.',
      narrationDraft: 'Reprenez la sauce propre, sans y reverser les coupelles déjà goûtées. Corrigez une seule chose à la fois : quelques gouttes du jus de tamarin réservé, une pincée de sucre ou une goutte de sauce de poisson en réserve. Si la sauce est trop concentrée, ajoutez une cuillère à café d’eau supplémentaire, mélangez, puis regoûtez. Le total de départ reste bien quatre-vingts millilitres d’eau.'
    },
    {
      id: 'servir',
      title: 'Servir et conserver',
      minutes: 2,
      ingredients: [],
      instructions: [
        'Versez la sauce terminée dans un petit bol propre et servez-la comme condiment avec du poisson grillé ou frit déjà cuit.',
        'Conservez les coupelles de dégustation à part et n’utilisez pas de cuillère déjà portée à la bouche dans la sauce principale.',
        'Placez rapidement les restes de sauce non goûtée dans un récipient fermé au réfrigérateur et consommez-les de préférence dans les 24 heures. Cette durée courte est notre précaution pour cet atelier et ne vient pas de la recette citée.'
      ],
      check: 'Vous obtenez une sauce cambodgienne au tamarin de base sourcée, puis personnalisée selon le goût.',
      tip: 'La sauce paraît différente seule ou avec un morceau de poisson ; vérifiez son équilibre sur le plat.',
      recovery: 'Si la sauce est trop puissante pour le plat, servez-la séparément et laissez chacun doser.',
      narrationDraft: 'La sauce est prête. Versez-la dans un bol propre et servez-la avec du poisson déjà cuit. Gardez les coupelles de dégustation séparées et placez rapidement les éventuels restes au frais.'
    }
  ],
  serving: 'À utiliser comme condiment avec du poisson grillé ou frit. La version à quatre coupelles est une adaptation pédagogique ajoutée à la recette publiée.',
  safety: [
    'Contient du poisson via la sauce de poisson. Vérifiez les allergies des convives.',
    'N’utilisez pas de produits crus nécessitant une cuisson comme base de dégustation.',
    'Goûtez la sauce tiédie et non brûlante ; utilisez des cuillères propres.',
    'Conservez séparément les portions de dégustation et la sauce principale.',
    'La durée de 24 heures au réfrigérateur est une précaution de l’atelier, distincte de la recette source ; ne conservez pas les coupelles déjà goûtées pour un repas ultérieur.'
  ]
};
