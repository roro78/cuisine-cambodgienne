export interface RecipeIngredient {
  quantity?: number;
  unit?: string;
  name: string;
  note?: string;
  group?: string;
  scalable?: boolean;
}

export interface RecipeStep {
  title: string;
  text: string;
  duration?: string;
  cue?: string;
  mistake?: string;
}

export interface RecipeFaq {
  question: string;
  answer: string;
}

export interface Recipe {
  slug: string;
  title: string;
  khmerName?: string;
  intro: string;
  description: string;
  context: string;
  baseServings: number;
  servingsLabel?: string;
  prepTime: string;
  cookTime: string;
  difficulty: 'Facile' | 'Intermédiaire' | 'Avancé';
  category: 'Plat principal' | 'Soupe' | 'Street food' | 'Dessert' | 'Base aromatique' | 'Accompagnement';
  moment?: string;
  location?: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  keyPoints?: string[];
  notes?: string[];
  substitutions?: string[];
  equipment?: string[];
  faqs?: RecipeFaq[];
  relatedIngredients?: string[];
  tags: string[];
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageWidths?: number[];
  visualTone?: 'river' | 'market' | 'pepper' | 'coconut' | 'herbs' | 'fire' | 'rice' | 'sunset';
}

export const recipes: Recipe[] = [
  {
    slug: 'amok-trey',
    title: 'Amok Trey',
    khmerName: 'អាម៉ុកត្រី',
    intro: 'Poisson, coco et cuisson douce : une recette emblématique à apprendre tranquillement.',
    description: 'Une version accessible de l’amok de poisson pour comprendre l’équilibre entre aromates, lait de coco et cuisson vapeur.',
    context: 'L’amok se rencontre sous différentes formes selon les familles. Ici, on travaille surtout la texture : une base parfumée, un poisson tendre et une cuisson douce.',
    baseServings: 4,
    prepTime: '30 min',
    cookTime: '25 min',
    difficulty: 'Intermédiaire',
    category: 'Plat principal',
    moment: 'Repas à partager',
    ingredients: [
      { quantity: 600, unit: 'g', name: 'poisson blanc ferme', group: 'Base' },
      { quantity: 250, unit: 'ml', name: 'lait de coco', group: 'Base' },
      { quantity: 3, unit: 'c. à soupe', name: 'kroeung jaune', group: 'Base' },
      { quantity: 2, name: 'œufs', group: 'Base' },
      { quantity: 1, unit: 'c. à soupe', name: 'sauce de poisson', group: 'Assaisonnement' },
      { quantity: 1, unit: 'c. à café', name: 'sucre de palme', group: 'Assaisonnement' },
      { name: 'Feuilles de combava finement émincées', group: 'Finition', scalable: false },
      { name: 'Basilic thaï ou basilic asiatique', group: 'Finition', scalable: false }
    ],
    steps: [
      { title: 'Préparer la base', text: 'Mélangez le kroeung avec le lait de coco jusqu’à obtenir une préparation homogène.', cue: 'La base doit être lisse, très parfumée et sans gros morceaux fibreux.' },
      { title: 'Assaisonner', text: 'Ajoutez sauce de poisson, sucre puis œufs battus. Goûtez avant d’ajouter le poisson.', mistake: 'Ajouter le poisson avant d’avoir corrigé l’assaisonnement rend les ajustements plus difficiles.' },
      { title: 'Ajouter le poisson', text: 'Coupez le poisson en morceaux réguliers puis incorporez-le délicatement.', cue: 'Les morceaux doivent rester entiers et bien enrobés.' },
      { title: 'Cuire doucement', text: 'Répartissez dans des ramequins puis cuisez à la vapeur.', duration: '18–25 min', cue: 'Le centre doit être pris mais encore souple.', mistake: 'Une vapeur trop forte resserre la texture et dessèche le poisson.' },
      { title: 'Finir et servir', text: 'Ajoutez les herbes fraîches et un peu de lait de coco juste avant de servir.' }
    ],
    keyPoints: ['Cuisson douce', 'Goûter la base avant le poisson', 'Arrêter dès que la texture est prise'],
    substitutions: ['À défaut de sucre de palme, utilisez un peu de sucre roux.', 'Un basilic doux peut dépanner si le basilic asiatique est introuvable.'],
    equipment: ['Panier vapeur ou grande casserole avec grille', '4 ramequins'],
    faqs: [
      { question: 'Pourquoi mon amok devient-il sec ?', answer: 'La cuisson est probablement trop forte ou trop longue. Arrêtez dès que le centre est juste pris.' },
      { question: 'Peut-on préparer la base à l’avance ?', answer: 'Oui. La base aromatique peut être préparée quelques heures à l’avance et gardée au frais.' }
    ],
    relatedIngredients: ['kroeung'],
    tags: ['poisson', 'coco', 'classique', 'vapeur'],
    image: '/images/cuisine/amok-1600.webp',
    imageAlt: 'Amok cambodgien servi dans une feuille de bananier avec du riz',
    imageWidth: 3888,
    imageHeight: 2592,
    imageWidths: [480, 800, 1200, 1600],
    visualTone: 'river'
  },
  {
    slug: 'lok-lak',
    title: 'Lok Lak',
    intro: 'Bœuf sauté, poivre et citron vert : une recette rapide qui se joue surtout à la poêle.',
    description: 'Le lok lak repose sur une saisie vive, une sauce courte et un condiment citron vert-poivre.',
    context: 'C’est une excellente recette pour débuter : peu d’ingrédients, mais des repères de cuisson très concrets.',
    baseServings: 4,
    prepTime: '20 min',
    cookTime: '10 min',
    difficulty: 'Facile',
    category: 'Plat principal',
    moment: 'Dîner rapide',
    ingredients: [
      { quantity: 600, unit: 'g', name: 'bœuf tendre', group: 'Bœuf' },
      { quantity: 2, unit: 'c. à soupe', name: 'sauce soja', group: 'Marinade' },
      { quantity: 1, unit: 'c. à soupe', name: 'sauce d’huître', group: 'Marinade' },
      { quantity: 1, unit: 'c. à café', name: 'sucre', group: 'Marinade' },
      { quantity: 1, name: 'gousse d’ail', group: 'Marinade' },
      { quantity: 2, name: 'citrons verts', group: 'Condiment' },
      { quantity: 2, unit: 'c. à café', name: 'poivre noir de Kampot fraîchement moulu', group: 'Condiment' },
      { name: 'Tomate, concombre et salade', group: 'Service', scalable: false }
    ],
    steps: [
      { title: 'Tout préparer avant la poêle', text: 'Coupez le bœuf en cubes, mélangez la marinade et préparez les crudités.', cue: 'Quand la poêle chauffe, tout doit déjà être à portée de main.' },
      { title: 'Préparer le condiment', text: 'Mélangez jus de citron vert et poivre fraîchement moulu.', cue: 'Il doit être franchement acidulé et poivré.' },
      { title: 'Saisir le bœuf', text: 'Faites chauffer la poêle très fort puis saisissez le bœuf en deux fournées.', duration: '2–3 min par fournée', cue: 'La viande colore rapidement sans baigner dans son jus.', mistake: 'Surcharger la poêle fait chuter la température et la viande bouillit.' },
      { title: 'Glacer rapidement', text: 'Ajoutez la marinade en fin de cuisson et mélangez quelques secondes.' },
      { title: 'Servir immédiatement', text: 'Servez avec crudités et condiment citron-poivre.' }
    ],
    keyPoints: ['Poêle très chaude', 'Deux petites fournées', 'Sauce seulement en fin de cuisson'],
    substitutions: ['Une bonne sauce soja classique convient.', 'Un poivre noir fraîchement moulu fonctionne si vous n’avez pas de poivre de Kampot.'],
    equipment: ['Grande poêle ou wok'],
    faqs: [
      { question: 'Pourquoi le bœuf rend-il de l’eau ?', answer: 'La poêle n’est pas assez chaude ou elle est trop chargée. Cuisez en petites quantités.' },
      { question: 'Puis-je préparer la marinade à l’avance ?', answer: 'Oui, mais gardez la viande marinée peu de temps pour conserver une texture nette.' }
    ],
    relatedIngredients: ['poivre-de-kampot'],
    tags: ['bœuf', 'rapide', 'poivre', 'citron vert'],
    image: '/images/cuisine/lok-lak-800.webp',
    imageAlt: 'Lok lak cambodgien au bœuf accompagné de crudités',
    imageWidth: 800,
    imageHeight: 716,
    imageWidths: [480, 800],
    visualTone: 'fire'
  },
  {
    slug: 'kroeung-jaune',
    title: 'Kroeung jaune',
    intro: 'Une pâte aromatique de citronnelle, galanga, curcuma et combava.',
    description: 'Une base utile pour apprendre comment les aromates cambodgiens se construisent au mortier.',
    context: 'Le kroeung est une famille de pâtes aromatiques, pas une formule unique. Cette version met en avant le curcuma.',
    baseServings: 1,
    servingsLabel: 'petit pot',
    prepTime: '25 min',
    cookTime: '0 min',
    difficulty: 'Intermédiaire',
    category: 'Base aromatique',
    moment: 'Préparation de base',
    ingredients: [
      { quantity: 4, name: 'tiges de citronnelle' },
      { quantity: 30, unit: 'g', name: 'galanga' },
      { quantity: 20, unit: 'g', name: 'curcuma frais' },
      { quantity: 1, unit: 'c. à café', name: 'zeste de combava' },
      { quantity: 3, name: 'gousses d’ail' },
      { quantity: 2, name: 'échalotes' }
    ],
    steps: [
      { title: 'Émincer très finement', text: 'Coupez citronnelle, galanga, curcuma, ail et échalotes aussi finement que possible.', cue: 'Plus la coupe est fine, moins le mortier devra lutter contre les fibres.' },
      { title: 'Commencer par les fibres', text: 'Pilez d’abord citronnelle et galanga.', duration: '5–8 min' },
      { title: 'Ajouter le reste', text: 'Ajoutez curcuma, combava, ail puis échalotes progressivement.', cue: 'La pâte devient humide, compacte et très parfumée.' },
      { title: 'Finir la texture', text: 'Continuez jusqu’à ne presque plus sentir de gros morceaux sous le pilon.' }
    ],
    keyPoints: ['Couper fin avant de piler', 'Commencer par les ingrédients les plus fibreux'],
    substitutions: ['Un petit mixeur peut dépanner : mixez par impulsions sans ajouter beaucoup d’eau.'],
    equipment: ['Mortier et pilon ou petit mixeur'],
    faqs: [
      { question: 'Pourquoi mon kroeung reste-t-il fibreux ?', answer: 'Les morceaux de citronnelle et galanga sont probablement trop gros. Émincez-les plus finement avant de piler.' }
    ],
    relatedIngredients: ['kroeung'],
    tags: ['base', 'aromates', 'citronnelle', 'curcuma'],
    image: '/images/cuisine/kroeung-1600.webp',
    imageAlt: 'Kroeung cambodgien et aromates',
    imageWidth: 5184,
    imageHeight: 3456,
    imageWidths: [480, 800, 1200, 1600],
    visualTone: 'herbs'
  },
  {
    slug: 'bai-sach-chrouk',
    title: 'Bai Sach Chrouk',
    intro: 'Porc grillé ou poêlé, riz chaud et pickles : un petit-déjeuner cambodgien très accessible.',
    description: 'Une version domestique du bai sach chrouk, centrée sur une marinade douce-salée et une cuisson bien caramélisée.',
    context: 'Le contraste important est simple : porc chaud, riz, fraîcheur acidulée des légumes et jus de cuisson.',
    baseServings: 4,
    prepTime: '25 min',
    cookTime: '20 min',
    difficulty: 'Facile',
    category: 'Plat principal',
    moment: 'Petit-déjeuner ou déjeuner',
    ingredients: [
      { quantity: 600, unit: 'g', name: 'échine ou filet de porc en tranches fines', group: 'Porc' },
      { quantity: 2, unit: 'c. à soupe', name: 'sauce soja', group: 'Marinade' },
      { quantity: 1, unit: 'c. à soupe', name: 'sauce de poisson', group: 'Marinade' },
      { quantity: 1, unit: 'c. à soupe', name: 'sucre roux', group: 'Marinade' },
      { quantity: 2, name: 'gousses d’ail', group: 'Marinade' },
      { quantity: 320, unit: 'g', name: 'riz jasmin cru', group: 'Service' },
      { name: 'Concombre et carotte en pickles', group: 'Service', scalable: false }
    ],
    steps: [
      { title: 'Mariner le porc', text: 'Mélangez les ingrédients de marinade puis enrobez les tranches de porc.', duration: '15 min minimum' },
      { title: 'Cuire le riz', text: 'Rincez puis cuisez le riz pendant que le porc marine.' },
      { title: 'Caraméliser', text: 'Grillez ou poêlez le porc à feu vif jusqu’à obtenir des bords bien colorés.', cue: 'Les bords doivent légèrement caraméliser.', mistake: 'Une poêle tiède donne un porc pâle et humide.' },
      { title: 'Assembler', text: 'Servez porc, riz et pickles ensemble.' }
    ],
    keyPoints: ['Tranches fines', 'Cuisson vive', 'Toujours ajouter une note fraîche et acidulée'],
    substitutions: ['Le filet de porc fonctionne, mais surveillez davantage la cuisson pour éviter qu’il sèche.'],
    equipment: ['Poêle, plancha ou gril'],
    faqs: [{ question: 'Peut-on préparer le porc la veille ?', answer: 'Oui, vous pouvez le mariner la veille et le cuire au dernier moment.' }],
    tags: ['porc', 'riz', 'facile', 'petit-déjeuner'],
    visualTone: 'rice'
  },
  {
    slug: 'kuy-teav',
    title: 'Kuy Teav',
    intro: 'Bouillon clair, nouilles de riz, herbes et garnitures : un bol complet à composer à table.',
    description: 'Une version accessible du kuy teav, pensée pour comprendre le bouillon, les nouilles et les garnitures fraîches.',
    context: 'Le bol est intéressant parce qu’il se termine à table : chacun ajuste herbes, citron vert et condiments.',
    baseServings: 4,
    prepTime: '30 min',
    cookTime: '45 min',
    difficulty: 'Intermédiaire',
    category: 'Soupe',
    moment: 'Petit-déjeuner ou déjeuner',
    ingredients: [
      { quantity: 1.4, unit: 'l', name: 'bouillon de volaille ou de porc', group: 'Bouillon' },
      { quantity: 300, unit: 'g', name: 'nouilles de riz', group: 'Bol' },
      { quantity: 300, unit: 'g', name: 'porc haché ou émincé', group: 'Garniture' },
      { quantity: 2, unit: 'c. à soupe', name: 'sauce de poisson', group: 'Bouillon' },
      { quantity: 1, unit: 'c. à café', name: 'sucre', group: 'Bouillon' },
      { name: 'Coriandre, ciboule, pousses de soja', group: 'Finition', scalable: false },
      { quantity: 2, name: 'citrons verts', group: 'Finition' }
    ],
    steps: [
      { title: 'Assaisonner le bouillon', text: 'Faites frémir le bouillon avec sauce de poisson et sucre.', cue: 'Le bouillon doit être savoureux mais rester clair et léger.' },
      { title: 'Cuire la garniture', text: 'Faites cuire le porc séparément ou directement dans un peu de bouillon.' },
      { title: 'Cuire les nouilles', text: 'Préparez les nouilles selon leur épaisseur puis égouttez-les soigneusement.', mistake: 'Les laisser attendre dans l’eau chaude les rend molles.' },
      { title: 'Monter les bols', text: 'Répartissez nouilles et porc, puis versez le bouillon brûlant.' },
      { title: 'Finir à table', text: 'Ajoutez herbes, pousses de soja et citron vert au dernier moment.' }
    ],
    keyPoints: ['Bouillon frémissant, pas bouillant à gros bouillons', 'Nouilles cuites à part', 'Herbes ajoutées au dernier moment'],
    substitutions: ['Un bon bouillon maison ou peu salé du commerce convient pour commencer.'],
    equipment: ['Grande casserole', 'Passoire'],
    faqs: [{ question: 'Pourquoi mes nouilles deviennent-elles molles ?', answer: 'Elles ont trop attendu dans l’eau chaude. Cuisez-les juste avant de monter les bols.' }],
    tags: ['soupe', 'nouilles', 'bouillon', 'street food'],
    visualTone: 'river'
  },
  {
    slug: 'num-banh-chok',
    title: 'Num Banh Chok',
    intro: 'Nouilles de riz, sauce parfumée et beaucoup d’herbes fraîches.',
    description: 'Une version accessible des nouilles khmères, avec une sauce aromatique et une grande place laissée aux herbes et crudités.',
    context: 'Le plaisir vient du contraste entre nouilles souples, sauce chaude et garnitures très fraîches.',
    baseServings: 4,
    prepTime: '35 min',
    cookTime: '35 min',
    difficulty: 'Intermédiaire',
    category: 'Plat principal',
    moment: 'Déjeuner',
    ingredients: [
      { quantity: 350, unit: 'g', name: 'nouilles de riz', group: 'Nouilles' },
      { quantity: 400, unit: 'g', name: 'poisson blanc', group: 'Sauce' },
      { quantity: 400, unit: 'ml', name: 'lait de coco', group: 'Sauce' },
      { quantity: 2, unit: 'c. à soupe', name: 'kroeung jaune', group: 'Sauce' },
      { quantity: 1, unit: 'c. à soupe', name: 'sauce de poisson', group: 'Sauce' },
      { name: 'Concombre, haricots verts fins, herbes fraîches', group: 'Garniture', scalable: false }
    ],
    steps: [
      { title: 'Cuire le poisson', text: 'Pochez doucement le poisson puis émiettez-le.' },
      { title: 'Construire la sauce', text: 'Faites revenir doucement le kroeung, ajoutez coco puis poisson émietté.' },
      { title: 'Ajuster', text: 'Assaisonnez avec la sauce de poisson et un peu d’eau si nécessaire.', cue: 'La sauce doit napper sans être trop épaisse.' },
      { title: 'Préparer les nouilles', text: 'Cuisez puis rincez brièvement les nouilles pour arrêter la cuisson.' },
      { title: 'Servir avec beaucoup de fraîcheur', text: 'Versez la sauce chaude sur les nouilles et ajoutez les garnitures crues.' }
    ],
    keyPoints: ['Sauce parfumée mais fluide', 'Garnitures très fraîches'],
    substitutions: ['Vous pouvez utiliser des herbes faciles à trouver : coriandre, menthe, basilic.'],
    equipment: ['Casserole', 'Grande passoire'],
    faqs: [{ question: 'La sauce peut-elle être préparée à l’avance ?', answer: 'Oui. Réchauffez-la doucement et préparez les nouilles au dernier moment.' }],
    tags: ['nouilles', 'poisson', 'herbes', 'classique'],
    visualTone: 'herbs'
  },
  {
    slug: 'num-pang',
    title: 'Num Pang',
    intro: 'Pain croustillant, garniture salée, pickles et herbes : la street food la plus facile à refaire chez soi.',
    description: 'Un sandwich cambodgien inspiré des usages locaux du pain, avec garniture, pickles et herbes fraîches.',
    context: 'Ce qui compte surtout est le contraste : pain croustillant, garniture riche, légumes acidulés et herbes fraîches.',
    baseServings: 4,
    prepTime: '20 min',
    cookTime: '10 min',
    difficulty: 'Facile',
    category: 'Street food',
    moment: 'Déjeuner rapide',
    ingredients: [
      { quantity: 4, name: 'petites baguettes', group: 'Pain' },
      { quantity: 400, unit: 'g', name: 'porc rôti ou poulet grillé', group: 'Garniture' },
      { quantity: 2, unit: 'c. à soupe', name: 'mayonnaise', group: 'Sauce' },
      { quantity: 1, unit: 'c. à soupe', name: 'sauce soja', group: 'Sauce' },
      { name: 'Carotte et concombre en pickles', group: 'Fraîcheur', scalable: false },
      { name: 'Coriandre fraîche', group: 'Fraîcheur', scalable: false },
      { quantity: 1, name: 'piment frais', group: 'Option', scalable: false }
    ],
    steps: [
      { title: 'Réchauffer le pain', text: 'Passez les baguettes quelques minutes au four pour retrouver une croûte nette.' },
      { title: 'Préparer la garniture', text: 'Réchauffez la viande et mélangez la sauce.' },
      { title: 'Monter sans détremper', text: 'Tartinez légèrement, ajoutez la viande puis les pickles bien égouttés.', mistake: 'Des pickles trop humides ramollissent le pain.' },
      { title: 'Finir aux herbes', text: 'Ajoutez coriandre et piment juste avant de servir.' }
    ],
    keyPoints: ['Pain chaud', 'Pickles bien égouttés', 'Herbes au dernier moment'],
    substitutions: ['Poulet grillé, porc rôti ou tofu ferme fonctionnent très bien.'],
    equipment: ['Four ou grille-pain'],
    faqs: [{ question: 'Peut-on préparer les sandwichs à l’avance ?', answer: 'Mieux vaut préparer les éléments à l’avance et assembler juste avant de manger.' }],
    tags: ['street food', 'rapide', 'sandwich', 'porc'],
    visualTone: 'market'
  },
  {
    slug: 'samlor-machu',
    title: 'Samlor Machu',
    intro: 'Une soupe aigre et légère où l’acidité doit réveiller, pas dominer.',
    description: 'Une soupe cambodgienne aigre dans une version accessible, centrée sur l’équilibre entre bouillon, acidité et herbes.',
    context: 'Ce type de soupe se comprend en goûtant : l’acidité se construit progressivement plutôt qu’en versant tout d’un coup.',
    baseServings: 4,
    prepTime: '20 min',
    cookTime: '30 min',
    difficulty: 'Facile',
    category: 'Soupe',
    moment: 'Repas familial',
    ingredients: [
      { quantity: 1.2, unit: 'l', name: 'bouillon léger', group: 'Bouillon' },
      { quantity: 400, unit: 'g', name: 'poisson ou poulet', group: 'Garniture' },
      { quantity: 2, unit: 'c. à soupe', name: 'tamarin dilué', group: 'Acidité' },
      { quantity: 1, unit: 'c. à soupe', name: 'sauce de poisson', group: 'Assaisonnement' },
      { quantity: 1, unit: 'c. à café', name: 'sucre', group: 'Assaisonnement' },
      { name: 'Tomate, ananas ou légumes de saison', group: 'Garniture', scalable: false },
      { name: 'Herbes fraîches', group: 'Finition', scalable: false }
    ],
    steps: [
      { title: 'Faire frémir le bouillon', text: 'Portez le bouillon à petit frémissement.' },
      { title: 'Cuire la garniture', text: 'Ajoutez viande ou poisson puis les légumes selon leur temps de cuisson.' },
      { title: 'Construire l’acidité', text: 'Ajoutez le tamarin petit à petit en goûtant entre chaque ajout.', cue: 'La soupe doit être vive mais encore agréable à boire.' },
      { title: 'Équilibrer', text: 'Ajoutez sauce de poisson et sucre pour arrondir sans masquer l’acidité.' },
      { title: 'Finir aux herbes', text: 'Coupez le feu puis ajoutez les herbes fraîches.' }
    ],
    keyPoints: ['Ajouter le tamarin progressivement', 'Goûter à chaque correction'],
    substitutions: ['Le citron vert peut compléter l’acidité, mais le tamarin donne une rondeur différente.'],
    equipment: ['Grande casserole'],
    faqs: [{ question: 'Ma soupe est trop acide, que faire ?', answer: 'Ajoutez un peu de bouillon puis corrigez avec une petite quantité de sucre et de sauce de poisson.' }],
    relatedIngredients: ['tamarin'],
    tags: ['soupe', 'tamarin', 'poisson', 'familial'],
    visualTone: 'sunset'
  },
  {
    slug: 'prahok-ktis',
    title: 'Prahok Ktis',
    intro: 'Porc, coco, aromates et prahok : un plat puissant servi avec beaucoup de légumes frais.',
    description: 'Une version accessible du prahok ktis, équilibrée par le lait de coco et servie comme dip avec des crudités.',
    context: 'Le prahok est intense. Ici, l’objectif est de l’utiliser par petites touches et de construire l’équilibre autour de lui.',
    baseServings: 4,
    prepTime: '25 min',
    cookTime: '25 min',
    difficulty: 'Intermédiaire',
    category: 'Accompagnement',
    moment: 'Table à partager',
    ingredients: [
      { quantity: 400, unit: 'g', name: 'porc haché', group: 'Base' },
      { quantity: 250, unit: 'ml', name: 'lait de coco', group: 'Base' },
      { quantity: 1, unit: 'c. à soupe', name: 'prahok', group: 'Assaisonnement' },
      { quantity: 1, unit: 'c. à soupe', name: 'kroeung jaune', group: 'Aromates' },
      { quantity: 1, unit: 'c. à café', name: 'sucre de palme ou sucre roux', group: 'Assaisonnement' },
      { name: 'Concombre, chou, haricots longs ou crudités', group: 'Service', scalable: false }
    ],
    steps: [
      { title: 'Faire revenir les aromates', text: 'Faites chauffer doucement le kroeung dans un peu de coco.' },
      { title: 'Cuire le porc', text: 'Ajoutez le porc et émiettez-le finement.' },
      { title: 'Ajouter le prahok progressivement', text: 'Ajoutez-en d’abord une partie, goûtez, puis ajustez.', mistake: 'Tout ajouter d’un coup peut rendre le plat excessivement salé et puissant.' },
      { title: 'Lier avec le coco', text: 'Ajoutez le reste du lait de coco et laissez épaissir doucement.' },
      { title: 'Servir avec du croquant', text: 'Servez tiède avec beaucoup de crudités.' }
    ],
    keyPoints: ['Prahok ajouté progressivement', 'Toujours servir avec une grande part de légumes frais'],
    substitutions: ['Si vous découvrez le prahok, commencez avec une quantité plus faible et augmentez au prochain essai.'],
    equipment: ['Poêle ou casserole large'],
    faqs: [{ question: 'Le goût est trop fort, comment corriger ?', answer: 'Ajoutez un peu de coco et servez avec davantage de crudités. Évitez de compenser avec beaucoup de sucre.' }],
    relatedIngredients: ['prahok', 'kroeung'],
    tags: ['prahok', 'porc', 'coco', 'partage'],
    image: '/images/cuisine/prahok-1600.webp',
    imageAlt: 'Préparation cambodgienne à base de prahok',
    imageWidth: 1600,
    imageHeight: 1067,
    imageWidths: [480, 800, 1200, 1600],
    visualTone: 'coconut'
  },
  {
    slug: 'chek-ktis',
    title: 'Chek Ktis',
    intro: 'Bananes, lait de coco et une pointe de sel : un dessert très simple à servir tiède.',
    description: 'Un dessert cambodgien accessible à base de bananes et de lait de coco.',
    context: 'Peu d’ingrédients, mais un bon équilibre : coco crémeux, banane encore entière et juste assez de sucre.',
    baseServings: 4,
    prepTime: '10 min',
    cookTime: '15 min',
    difficulty: 'Facile',
    category: 'Dessert',
    moment: 'Dessert ou goûter',
    ingredients: [
      { quantity: 4, name: 'bananes pas trop mûres', group: 'Fruit' },
      { quantity: 400, unit: 'ml', name: 'lait de coco', group: 'Crème' },
      { quantity: 2, unit: 'c. à soupe', name: 'sucre de palme ou sucre roux', group: 'Crème' },
      { quantity: 1, unit: 'pincée', name: 'sel', group: 'Crème', scalable: false },
      { name: 'Graines de sésame grillées, facultatif', group: 'Finition', scalable: false }
    ],
    steps: [
      { title: 'Chauffer le coco', text: 'Faites chauffer doucement lait de coco, sucre et sel sans faire bouillir fortement.' },
      { title: 'Ajouter les bananes', text: 'Coupez les bananes en gros morceaux puis ajoutez-les.' },
      { title: 'Cuire doucement', text: 'Laissez frémir quelques minutes.', duration: '8–10 min', cue: 'Les bananes doivent être tendres mais garder leur forme.', mistake: 'Une cuisson trop longue transforme les bananes en purée.' },
      { title: 'Servir tiède', text: 'Servez avec un peu de sésame grillé si vous aimez.' }
    ],
    keyPoints: ['Bananes pas trop mûres', 'Frémissement doux'],
    substitutions: ['Du sucre roux fonctionne très bien si vous n’avez pas de sucre de palme.'],
    equipment: ['Petite casserole'],
    faqs: [{ question: 'Peut-on le servir froid ?', answer: 'Oui, mais la texture du coco est souvent plus agréable tiède.' }],
    tags: ['dessert', 'banane', 'coco', 'facile'],
    visualTone: 'coconut'
  }
];

export function getRecipe(slug: string) {
  return recipes.find((recipe) => recipe.slug === slug);
}

export function getServingsLabel(recipe: Recipe, servings = recipe.baseServings) {
  if (recipe.servingsLabel) return recipe.servingsLabel;
  return `${servings} personne${servings > 1 ? 's' : ''}`;
}

export function ingredientText(ingredient: RecipeIngredient) {
  const prefix = [ingredient.quantity, ingredient.unit].filter(Boolean).join(' ');
  return [prefix, ingredient.name, ingredient.note].filter(Boolean).join(' ');
}
