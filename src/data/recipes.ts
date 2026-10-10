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
  glossarySlugs?: string[];
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
    intro: 'Un poisson tendre, du lait de coco et un kroeung très parfumé, cuits doucement à la vapeur.',
    description: 'Une recette d’amok de poisson accessible, crémeuse et parfumée, avec des repères simples pour réussir la cuisson vapeur.',
    context: 'L’amok varie selon les familles. Ici, on cherche surtout une texture souple et crémeuse, avec un poisson qui reste tendre et bien parfumé.',
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
      { title: 'Assaisonner', text: 'Ajoutez la sauce de poisson et le sucre, mélangez puis goûtez pour rectifier l’assaisonnement. Incorporez ensuite les œufs battus. Ne goûtez plus la préparation après l’ajout des œufs crus ni après celui du poisson cru.', mistake: 'Ne goûtez jamais la préparation après avoir ajouté les œufs ou le poisson crus.' },
      { title: 'Ajouter le poisson', text: 'Coupez le poisson en morceaux réguliers puis incorporez-le délicatement.', cue: 'Les morceaux doivent rester entiers et bien enrobés.' },
      { title: 'Cuire doucement', text: 'Répartissez dans des ramequins puis cuisez à la vapeur.', duration: '18–25 min', cue: 'Le centre doit être pris mais encore souple.', mistake: 'Une vapeur trop forte resserre la texture et dessèche le poisson.' },
      { title: 'Finir et servir', text: 'Ajoutez les herbes fraîches et un peu de lait de coco juste avant de servir.' }
    ],
    keyPoints: ['Cuisson douce', 'Rectifier l’assaisonnement avant les œufs et le poisson crus', 'Vérifier une cuisson complète avant de servir'],
    substitutions: ['À défaut de sucre de palme, utilisez un peu de sucre roux.', 'Un basilic doux peut dépanner si le basilic asiatique est introuvable.'],
    equipment: ['Panier vapeur ou grande casserole avec grille', '4 ramequins'],
    faqs: [
      { question: 'Pourquoi mon amok devient-il sec ?', answer: 'La cuisson est probablement trop forte ou trop longue. Privilégiez une vapeur douce, mais vérifiez que le poisson et les œufs sont complètement cuits avant de servir. Si nécessaire, poursuivez la cuisson.' },
      { question: 'Peut-on préparer la base à l’avance ?', answer: 'Oui. La base aromatique peut être préparée quelques heures à l’avance et gardée au frais.' }
    ],
    relatedIngredients: ['kroeung'],
    glossarySlugs: ['amok', 'kroeung', 'combava', 'lait-de-coco', 'sucre-de-palme'],
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
    intro: 'Du bœuf saisi à feu vif, du poivre fraîchement moulu et un condiment au citron vert.',
    description: 'Un lok lak rapide et gourmand, avec du bœuf bien doré et un condiment vif au citron vert et au poivre.',
    context: 'C’est une bonne recette pour débuter : peu d’ingrédients, une poêle très chaude et quelques repères faciles à observer.',
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
      { question: 'Puis-je préparer la marinade à l’avance ?', answer: 'Oui, mais évitez de laisser le bœuf mariner trop longtemps pour qu’il garde une texture agréable à la cuisson.' }
    ],
    relatedIngredients: ['poivre-de-kampot'],
    glossarySlugs: ['poivre-de-kampot', 'lok-lak'],
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
    description: 'Une pâte fraîche de citronnelle, galanga, curcuma et combava, préparée au mortier pour libérer tout le parfum des aromates.',
    context: 'Il existe plusieurs sortes de kroeung. Cette version, bien jaune grâce au curcuma, est idéale pour apprendre le geste du mortier.',
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
    glossarySlugs: ['kroeung', 'citronnelle', 'combava', 'galanga', 'curcuma'],
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
    intro: 'Du porc bien caramélisé, du riz chaud et des pickles croquants : un petit-déjeuner cambodgien simple et généreux.',
    description: 'Une version facile à faire à la maison, avec une marinade douce-salée et du porc bien doré sur les bords.',
    context: 'Le plaisir vient du contraste entre le porc chaud et caramélisé, le riz moelleux et les légumes frais et acidulés.',
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
    intro: 'Un grand bol de bouillon chaud, de nouilles de riz, de porc et d’herbes fraîches à ajouter au dernier moment.',
    description: 'Une version accessible du kuy teav, avec un bouillon léger, des nouilles de riz et beaucoup de garnitures fraîches.',
    context: 'Le bol se termine à table : chacun ajoute les herbes, le citron vert et les condiments selon ses envies.',
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
    intro: 'Des nouilles de riz souples, une sauce chaude au poisson et au kroeung, et une belle poignée d’herbes fraîches.',
    description: 'Une version accessible du num banh chok, avec une sauce parfumée au kroeung et beaucoup d’herbes et de crudités au moment de servir.',
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
      { title: 'Préparer la sauce', text: 'Faites revenir doucement le kroeung, ajoutez le lait de coco puis le poisson émietté.' },
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
    intro: 'Une petite baguette croustillante, une garniture généreuse, des pickles et beaucoup d’herbes fraîches.',
    description: 'Un sandwich cambodgien frais et croustillant, garni de viande, de pickles et de coriandre.',
    context: 'Pour qu’il soit vraiment bon, il faut garder le pain croustillant, les pickles bien égouttés et les herbes fraîches jusqu’au dernier moment.',
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
    intro: 'Une soupe légère, acidulée et parfumée, agréable à servir avec du riz et des herbes fraîches.',
    description: 'Une soupe cambodgienne acidulée, facile à ajuster en goûtant le bouillon au fur et à mesure.',
    context: 'Ajoutez le tamarin petit à petit et goûtez entre chaque ajout : la soupe doit rester fraîche et agréable, jamais agressive.',
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
      { title: 'Ajouter le tamarin petit à petit', text: 'Ajoutez le tamarin en plusieurs fois en goûtant entre chaque ajout.', cue: 'La soupe doit être acidulée et fraîche, sans devenir trop forte.' },
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
    intro: 'Porc, lait de coco, kroeung et prahok : une préparation onctueuse et très parfumée à partager avec des légumes frais.',
    description: 'Une version accessible du prahok ktis, adoucie par le lait de coco et servie tiède avec beaucoup de crudités.',
    context: 'Le prahok a beaucoup de caractère. Commencez par une petite quantité et ajustez l’assaisonnement seulement après cuisson complète de la préparation.',
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
      { title: 'Cuire le porc', text: 'Ajoutez le porc haché, émiettez-le finement et poursuivez la cuisson jusqu’à ce qu’il soit complètement cuit.' },
      { title: 'Ajouter le prahok progressivement', text: 'Ajoutez d’abord une partie du prahok et poursuivez la cuisson. Goûtez uniquement lorsque le porc et toute la préparation sont complètement cuits, puis ajustez.', mistake: 'Ne goûtez jamais une préparation contenant du porc cru ou insuffisamment cuit.' },
      { title: 'Ajouter le lait de coco', text: 'Versez le reste du lait de coco et laissez épaissir doucement.' },
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
    context: 'Avec peu d’ingrédients, tout se joue sur la cuisson : un coco crémeux, des bananes encore entières et juste assez de sucre.',
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
