export interface Recipe {
  slug: string;
  title: string;
  khmerName?: string;
  intro: string;
  description: string;
  context: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  difficulty: 'Facile' | 'Intermédiaire' | 'Avancé';
  ingredients: string[];
  steps: string[];
  keyPoints?: string[];
  notes?: string[];
  relatedIngredients?: string[];
  tags: string[];
  image: string;
  imageAlt: string;
}

export const recipes: Recipe[] = [
  {
    slug: 'amok-trey',
    title: 'Amok Trey',
    khmerName: 'អាម៉ុកត្រី',
    intro: 'Poisson, kroeung, lait de coco et cuisson douce : un grand classique de la cuisine cambodgienne.',
    description: 'Une version accessible de l’amok de poisson, pensée pour comprendre l’équilibre entre aromates, coco et texture sans perdre l’esprit du plat.',
    context: 'L’amok existe sous différentes formes et proportions selon les familles et les habitudes. Ici, l’objectif est surtout de comprendre sa logique : une base de kroeung, une texture liée et une cuisson douce qui laisse les aromates s’exprimer.',
    servings: '4 personnes',
    prepTime: '30 min',
    cookTime: '25 min',
    difficulty: 'Intermédiaire',
    ingredients: [
      '600 g de poisson blanc ferme',
      '250 ml de lait de coco',
      '3 c. à soupe de kroeung jaune',
      '2 œufs',
      '1 c. à soupe de sauce de poisson',
      '1 c. à café de sucre de palme',
      'Feuilles de combava finement émincées',
      'Basilic thaï ou basilic asiatique'
    ],
    steps: [
      'Mélanger le kroeung avec le lait de coco jusqu’à obtenir une base homogène.',
      'Ajouter la sauce de poisson, le sucre puis les œufs battus.',
      'Incorporer délicatement le poisson coupé en morceaux.',
      'Répartir dans des ramequins ou paniers adaptés à la vapeur.',
      'Cuire doucement à la vapeur jusqu’à ce que la préparation soit prise mais encore moelleuse.',
      'Terminer avec les herbes fraîches et un filet de lait de coco.'
    ],
    keyPoints: [
      'Piler ou mixer le kroeung assez finement pour qu’il parfume toute la préparation.',
      'Garder une cuisson douce : une chaleur trop forte resserre rapidement la texture.',
      'Goûter la base avant d’ajouter le poisson afin d’ajuster sel, sucre et intensité aromatique.'
    ],
    notes: [
      'Le résultat doit rester souple et parfumé, pas sec.',
      'Le kroeung peut être préparé à l’avance et conservé au frais dans un contenant hermétique.'
    ],
    relatedIngredients: ['kroeung'],
    tags: ['poisson', 'kroeung', 'lait de coco', 'classique'],
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Fish_Amok-_Khmer_specialty.jpg?width=1600',
    imageAlt: 'Amok cambodgien servi dans une feuille de bananier avec du riz'
  },
  {
    slug: 'lok-lak',
    title: 'Lok Lak',
    intro: 'Bœuf sauté, poivre et citron vert : un plat rapide qui repose sur la cuisson et l’assaisonnement.',
    description: 'Le lok lak joue sur le contraste entre viande saisie, sauce courte, fraîcheur des crudités et condiment poivré-acidulé.',
    context: 'Le point clé n’est pas une longue liste d’ingrédients mais la maîtrise de la saisie. Le bœuf doit colorer rapidement sans cuire dans son jus, puis être servi aussitôt.',
    servings: '4 personnes',
    prepTime: '20 min',
    cookTime: '10 min',
    difficulty: 'Facile',
    ingredients: [
      '600 g de bœuf tendre',
      '2 c. à soupe de sauce soja',
      '1 c. à soupe de sauce d’huître',
      '1 c. à café de sucre',
      '1 gousse d’ail',
      'Poivre noir de Kampot',
      '2 citrons verts',
      'Tomate, concombre et salade pour servir'
    ],
    steps: [
      'Couper le bœuf en cubes réguliers et l’assaisonner brièvement.',
      'Préparer le condiment avec jus de citron vert et poivre fraîchement moulu.',
      'Saisir le bœuf à feu vif en petites quantités pour bien le colorer.',
      'Ajouter la sauce en fin de cuisson et enrober rapidement.',
      'Servir immédiatement avec les crudités et le condiment au poivre.'
    ],
    keyPoints: [
      'Ne pas surcharger la poêle.',
      'Préparer le condiment avant de lancer la cuisson.',
      'Servir immédiatement pour préserver la texture du bœuf.'
    ],
    notes: ['La réussite dépend surtout d’une poêle très chaude et d’une cuisson courte.'],
    relatedIngredients: ['poivre-de-kampot'],
    tags: ['bœuf', 'poivre de Kampot', 'rapide'],
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Cambodian_Lok_Lak.jpg?width=1600',
    imageAlt: 'Lok lak cambodgien au bœuf accompagné de crudités'
  },
  {
    slug: 'kroeung-jaune',
    title: 'Kroeung jaune',
    intro: 'La pâte aromatique qui structure de nombreuses préparations khmères.',
    description: 'Citronnelle, galanga, curcuma et combava forment une base aromatique fraîche à piler progressivement pour obtenir une pâte fine et parfumée.',
    context: 'Le kroeung est moins une recette figée qu’une famille de pâtes aromatiques. La version jaune met particulièrement en avant le curcuma et sert de base à plusieurs préparations.',
    servings: '1 petit pot',
    prepTime: '25 min',
    cookTime: '0 min',
    difficulty: 'Intermédiaire',
    ingredients: [
      '4 tiges de citronnelle',
      '30 g de galanga',
      '20 g de curcuma frais',
      'Zeste de combava',
      '3 gousses d’ail',
      '2 échalotes'
    ],
    steps: [
      'Émincer très finement tous les ingrédients durs.',
      'Commencer par piler la citronnelle et le galanga.',
      'Ajouter progressivement le curcuma, le combava, l’ail puis les échalotes.',
      'Continuer jusqu’à obtenir une pâte homogène et humide.',
      'Utiliser immédiatement ou conserver dans un récipient hermétique au réfrigérateur.'
    ],
    keyPoints: [
      'Couper finement avant de piler réduit fortement le temps de travail.',
      'Commencer par les fibres les plus dures permet d’obtenir une pâte plus homogène.',
      'Au mixeur, éviter d’ajouter trop de liquide : il modifierait la concentration et la texture.'
    ],
    notes: ['Un mortier donne une texture plus intéressante, mais un mixeur peut dépanner en ajoutant le moins de liquide possible.'],
    relatedIngredients: ['kroeung'],
    tags: ['base', 'aromates', 'citronnelle', 'curcuma'],
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Cha_kroeung.jpg?width=1600',
    imageAlt: 'Plat cambodgien cha kroeung préparé avec une base aromatique kroeung'
  }
];

export function getRecipe(slug: string) {
  return recipes.find((recipe) => recipe.slug === slug);
}
