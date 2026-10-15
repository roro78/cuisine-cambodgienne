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
  beforeYouStart?: string;
  prepHeading?: string;
  servingTip?: string;
  servingHeading?: string;
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
    beforeYouStart: 'Préparez les ramequins et le panier vapeur avant de mélanger la base. Rectifiez l’assaisonnement tant que la préparation ne contient ni œufs ni poisson crus.',
    prepHeading: 'Préparer la vapeur avant le mélange',
    servingTip: 'Servez chaud avec du riz jasmin et les herbes fraîches ajoutées au dernier moment. Vérifiez que le poisson et les œufs sont complètement cuits.',
    servingHeading: 'Du riz chaud et un amok bien parfumé',
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
    beforeYouStart: 'Lavez les crudités et préparez le condiment citron-poivre avant de chauffer la poêle : la viande devra être servie dès qu’elle est cuite.',
    prepHeading: 'Tout préparer avant la première saisie',
    servingTip: 'Apportez le bœuf bien chaud, avec les crudités fraîches et le condiment à part pour que chacun dose l’acidité.',
    servingHeading: 'Le citron et le poivre à côté du bœuf',
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
      { title: 'Glacer rapidement', text: 'Ajoutez la marinade en fin de cuisson et mélangez quelques secondes.', cue: 'La sauce enrobe le bœuf sans former une grande quantité de jus dans la poêle.' },
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
    image: '/images/cuisine/v17-lok-lak-genere.webp',
    imageAlt: 'Illustration culinaire générée d’un Lok Lak au bœuf saisi, servi avec crudités et sauce poivre-citron',
    imageWidth: 1448,
    imageHeight: 1086,
    imageWidths: [],
    visualTone: 'fire'
  },
  {
    slug: 'kroeung-jaune',
    title: 'Kroeung jaune',
    intro: 'Une pâte aromatique de citronnelle, galanga, curcuma et combava.',
    description: 'Une pâte fraîche de citronnelle, galanga, curcuma et combava, préparée au mortier pour libérer tout le parfum des aromates.',
    context: 'Il existe plusieurs sortes de kroeung. Cette version, bien jaune grâce au curcuma, est idéale pour apprendre le geste du mortier.',
    beforeYouStart: 'Préparez tous les aromates en petits morceaux et gardez une spatule à portée de main pour ramener la pâte au centre du mortier.',
    prepHeading: 'Au mortier, tout commence par la coupe',
    servingTip: 'Cette pâte sert à parfumer d’autres préparations, notamment l’amok. Ce n’est pas un plat à servir seul.',
    servingHeading: 'Une pâte pour parfumer la suite',
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
      { title: 'Finir la texture', text: 'Continuez jusqu’à ne presque plus sentir de gros morceaux sous le pilon.', cue: 'La pâte se tient et les longues fibres deviennent difficiles à distinguer.' }
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
    beforeYouStart: 'Profitez du temps de marinade pour lancer le riz et préparer les légumes croquants : tout pourra arriver chaud à table.',
    prepHeading: 'Le riz cuit pendant la marinade',
    servingTip: 'Disposez les fines tranches de porc sur le riz fumant, avec les pickles bien frais à côté pour apporter du contraste.',
    servingHeading: 'Du porc caramélisé et des pickles frais',
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
      { title: 'Mariner le porc', text: 'Mélangez les ingrédients de marinade puis enrobez les tranches de porc.', duration: '15 min minimum', cue: 'Les tranches sont enrobées d’une fine couche de marinade.' },
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
    beforeYouStart: 'Préparez les herbes, le citron vert et les bols pendant que le bouillon frémit. Gardez les nouilles à part jusqu’au dernier moment.',
    prepHeading: 'Garder les herbes à part',
    servingTip: 'Versez le bouillon très chaud sur les nouilles et le porc entièrement cuit, puis laissez chacun ajouter herbes et citron vert.',
    servingHeading: 'Un bol que chacun termine à son goût',
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
      { title: 'Cuire la garniture', text: 'Faites cuire le porc séparément ou directement dans un peu de bouillon.', cue: 'Le porc doit être entièrement cuit avant d’être réparti dans les bols.' },
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
    beforeYouStart: 'Lavez et égouttez les herbes et les légumes avant de préparer la sauce ; ces garnitures resteront fraîches jusqu’au service.',
    prepHeading: 'La fraîcheur se prépare d’abord',
    servingTip: 'Versez la sauce chaude au poisson bien cuit sur les nouilles, puis terminez avec les herbes et les crudités pour garder leur croquant.',
    servingHeading: 'La sauce chaude, les herbes à la fin',
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
      { title: 'Cuire le poisson', text: 'Pochez doucement le poisson puis émiettez-le.', cue: 'Le poisson est complètement cuit et se défait facilement en morceaux.' },
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
    image: '/images/cuisine/v17-nom-banh-chok-genere.webp',
    imageAlt: 'Illustration culinaire générée de Num Banh Chok aux nouilles de riz, sauce parfumée, crudités et herbes fraîches',
    imageWidth: 1448,
    imageHeight: 1086,
    imageWidths: [],
    visualTone: 'herbs'
  },
  {
    slug: 'num-pang',
    title: 'Num Pang',
    intro: 'Une petite baguette croustillante, une garniture généreuse, des pickles et beaucoup d’herbes fraîches.',
    description: 'Un sandwich cambodgien frais et croustillant, garni de viande, de pickles et de coriandre.',
    context: 'Pour qu’il soit vraiment bon, il faut garder le pain croustillant, les pickles bien égouttés et les herbes fraîches jusqu’au dernier moment.',
    beforeYouStart: 'Égouttez soigneusement les pickles, préparez la coriandre et la sauce, puis réchauffez les baguettes juste avant de garnir.',
    prepHeading: 'Des pickles bien égouttés',
    servingTip: 'Servez aussitôt après le montage : la croûte reste croustillante et les légumes conservent leur fraîcheur.',
    servingHeading: 'Un sandwich à croquer sans attendre',
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
      { title: 'Monter sans détremper', text: 'Tartinez légèrement, ajoutez la viande puis les pickles bien égouttés.', cue: 'La mie reste légère et la croûte craquante.', mistake: 'Des pickles trop humides ramollissent le pain.' },
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
    beforeYouStart: 'Diluez le tamarin dans un petit bol et gardez un peu de bouillon nature pour corriger l’acidité si nécessaire.',
    prepHeading: 'Le tamarin à portée de main',
    servingTip: 'Servez la soupe bien chaude avec du riz. Attendez que le poisson ou le poulet soit entièrement cuit avant de goûter pour ajuster le bouillon.',
    servingHeading: 'Une soupe acidulée avec du riz',
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
      { title: 'Cuire la garniture', text: 'Ajoutez viande ou poisson puis les légumes selon leur temps de cuisson.', cue: 'Le poisson ou le poulet doit être complètement cuit avant de goûter et de corriger le bouillon.' },
      { title: 'Ajouter le tamarin petit à petit', text: 'Quand le poisson ou le poulet et les légumes sont cuits, ajoutez le tamarin en plusieurs fois et goûtez le bouillon entre chaque ajout.', cue: 'La soupe doit être acidulée et fraîche, sans devenir trop forte.' },
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
    beforeYouStart: 'Lavez et découpez les crudités avant de démarrer la cuisson ; elles apporteront le croquant qui équilibre cette préparation riche.',
    prepHeading: 'Préparer les crudités en premier',
    servingTip: 'Servez tiède dans un bol entouré de crudités. Ne goûtez et ne rectifiez l’assaisonnement qu’après cuisson complète du porc.',
    servingHeading: 'Un peu de crémeux, beaucoup de croquant',
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
      { title: 'Ajouter le lait de coco', text: 'Versez le reste du lait de coco et laissez épaissir doucement.', cue: 'La préparation reste crémeuse et assez épaisse pour être prise avec un morceau de légume.' },
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
    imageHeight: 2133,
    imageWidths: [480, 800, 1200, 1600],
    visualTone: 'coconut'
  },
  {
    slug: 'chek-ktis',
    title: 'Chek Ktis',
    intro: 'Bananes, lait de coco et une pointe de sel : un dessert très simple à servir tiède.',
    description: 'Un dessert cambodgien accessible à base de bananes et de lait de coco.',
    context: 'Avec peu d’ingrédients, tout se joue sur la cuisson : un coco crémeux, des bananes encore entières et juste assez de sucre.',
    beforeYouStart: 'Choisissez des bananes encore fermes et préparez le lait de coco, le sucre et la casserole avant de couper les fruits.',
    prepHeading: 'Choisir des bananes encore fermes',
    servingTip: 'Servez tiède en petits bols, avec un peu de sésame grillé si vous aimez : les bananes doivent encore tenir en morceaux.',
    servingHeading: 'Le lait de coco, à savourer tiède',
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
      { title: 'Chauffer le coco', text: 'Faites chauffer doucement lait de coco, sucre et sel sans faire bouillir fortement.', cue: 'De petites bulles apparaissent au bord de la casserole sans gros bouillons.' },
      { title: 'Ajouter les bananes', text: 'Coupez les bananes en gros morceaux puis ajoutez-les.' },
      { title: 'Cuire doucement', text: 'Laissez frémir quelques minutes.', duration: '8–10 min', cue: 'Les bananes doivent être tendres mais garder leur forme.', mistake: 'Une cuisson trop longue transforme les bananes en purée.' },
      { title: 'Servir tiède', text: 'Servez avec un peu de sésame grillé si vous aimez.' }
    ],
    keyPoints: ['Bananes pas trop mûres', 'Frémissement doux'],
    substitutions: ['Du sucre roux fonctionne très bien si vous n’avez pas de sucre de palme.'],
    equipment: ['Petite casserole'],
    faqs: [{ question: 'Peut-on le servir froid ?', answer: 'Oui, mais la texture du coco est souvent plus agréable tiède.' }],
    tags: ['dessert', 'banane', 'coco', 'facile'],
    image: '/images/cuisine/v17-chek-ktis-960.jpg',
    imageAlt: 'Chek Ktis, bananes tendres servies dans un lait de coco parfumé',
    imageWidth: 960,
    imageHeight: 640,
    visualTone: 'coconut'
  },

  {
    slug: 'samlor-kako',
    title: 'Samlor Kako',
    khmerName: 'សម្លកកូរ',
    intro: 'Une soupe khmère généreuse où les légumes, le poisson, le riz grillé et les aromates mijotent ensemble.',
    description: 'Samlor Kako : une soupe cambodgienne traditionnelle au poisson, légumes variés, kroeung et riz grillé, expliquée étape par étape.',
    context: 'La composition du samlor kako varie d’une famille à l’autre. Cette version accessible met à l’honneur le poisson, des légumes de saison, la pâte kroeung et le riz grillé qui donne de la tenue au bouillon.',
    beforeYouStart: 'Lavez et découpez tous les légumes avant d’allumer le feu. Gardez le poisson au froid jusqu’au moment de l’incorporer.',
    prepHeading: 'Préparer les légumes avant le bouillon',
    servingTip: 'Servez bien chaud dans de grands bols, avec du riz jasmin. Le poisson doit être entièrement cuit et se détacher facilement.',
    servingHeading: 'Une soupe généreuse à partager',
    baseServings: 4,
    prepTime: '30 min',
    cookTime: '35 min',
    difficulty: 'Intermédiaire',
    category: 'Soupe',
    moment: 'Repas familial',
    ingredients: [
      { quantity: 500, unit: 'g', name: 'poisson blanc ferme sans arêtes, en gros morceaux', group: 'Protéine' },
      { quantity: 250, unit: 'g', name: 'potiron ou courge, en cubes', group: 'Légumes' },
      { quantity: 150, unit: 'g', name: 'haricots longs ou haricots verts', group: 'Légumes' },
      { quantity: 150, unit: 'g', name: 'aubergine asiatique ou aubergine classique', group: 'Légumes' },
      { quantity: 100, unit: 'g', name: 'épinards ou feuilles vertes tendres', group: 'Légumes' },
      { quantity: 3, unit: 'c. à soupe', name: 'kroeung jaune', group: 'Bouillon' },
      { quantity: 2, unit: 'c. à soupe', name: 'riz cru', group: 'Bouillon' },
      { quantity: 1.2, unit: 'l', name: 'eau ou bouillon léger non salé', group: 'Bouillon' },
      { quantity: 1, unit: 'c. à soupe', name: 'sauce de poisson, à ajuster', group: 'Assaisonnement' },
      { name: 'Feuilles de basilic asiatique ou coriandre', group: 'Finition', scalable: false }
    ],
    steps: [
      { title: 'Griller le riz', text: 'Dans une poêle sèche, faites blondir le riz en remuant puis laissez refroidir et réduisez en poudre assez fine.', duration: '5–7 min', cue: 'Le riz sent légèrement la noisette et ne doit pas brûler.', mistake: 'Un riz noirci apporte de l’amertume.' },
      { title: 'Réveiller les aromates', text: 'Faites chauffer le kroeung dans une grande casserole avec quelques cuillerées d’eau pendant une minute.', cue: 'Les aromates parfument la vapeur sans attacher au fond.' },
      { title: 'Construire le bouillon', text: 'Versez l’eau ou le bouillon, ajoutez la courge, l’aubergine et les haricots puis laissez frémir.', duration: '15 min', cue: 'Les légumes commencent à s’attendrir mais gardent leur forme.' },
      { title: 'Cuire le poisson', text: 'Ajoutez le poisson, laissez frémir doucement jusqu’à cuisson complète, puis incorporez le riz grillé moulu.', duration: '8–12 min', cue: 'Le poisson est opaque et se détache facilement.', mistake: 'Une forte ébullition casse les morceaux de poisson.' },
      { title: 'Finir les légumes et assaisonner', text: 'Ajoutez les feuilles vertes pour deux minutes, assaisonnez à la sauce de poisson et servez avec les herbes.', cue: 'Le bouillon est légèrement lié et les légumes restent distincts.' }
    ],
    keyPoints: ['Riz grillé pour lier le bouillon', 'Légumes ajoutés selon leur temps de cuisson', 'Poisson entièrement cuit'],
    substitutions: ['Le potiron peut être remplacé par de la courgette, ajoutée plus tard pour ne pas fondre.', 'Un bouillon de légumes léger convient si vous n’avez pas de bouillon de poisson.'],
    equipment: ['Grande casserole', 'Poêle sèche', 'Mortier ou petit moulin'],
    faqs: [
      { question: 'Peut-on préparer le samlor kako à l’avance ?', answer: 'Oui, préparez le bouillon et les légumes à l’avance, puis cuisez le poisson au dernier moment pour préserver sa texture.' },
      { question: 'Pourquoi ajouter du riz grillé ?', answer: 'Le riz grillé moulu parfume légèrement la soupe et donne de la consistance au bouillon.' }
    ],
    relatedIngredients: ['kroeung', 'citronnelle'],
    tags: ['soupe', 'poisson', 'légumes', 'kroeung', 'repas familial'],
    visualTone: 'herbs'
  },
  {
    slug: 'cha-kroeung',
    title: 'Cha Kroeung',
    khmerName: 'ឆាគ្រឿង',
    intro: 'Un sauté khmer vif et parfumé où le kroeung dore autour de fines tranches de poulet et de haricots croquants.',
    description: 'Cha Kroeung : poulet sauté aux aromates khmers, citronnelle, galanga, curcuma et haricots, avec les bons gestes de cuisson.',
    context: 'Cha signifie sauté et kroeung désigne un mélange d’aromates pilés. Cette version au poulet privilégie une poêle bien chaude et une pâte aromatique préparée avant la cuisson.',
    beforeYouStart: 'Émincez le poulet et préparez les haricots. Assaisonnez et mesurez tous les ingrédients avant de chauffer le wok.',
    prepHeading: 'Tout préparer avant de saisir',
    servingTip: 'Servez aussitôt avec du riz jasmin. Le poulet doit être entièrement cuit, sans centre rosé.',
    servingHeading: 'Un sauté chaud et parfumé',
    baseServings: 4,
    prepTime: '25 min',
    cookTime: '15 min',
    difficulty: 'Facile',
    category: 'Plat principal',
    moment: 'Repas rapide',
    ingredients: [
      { quantity: 600, unit: 'g', name: 'blanc ou haut de cuisse de poulet désossé, émincé', group: 'Poulet' },
      { quantity: 4, unit: 'c. à soupe', name: 'kroeung jaune', group: 'Aromates' },
      { quantity: 200, unit: 'g', name: 'haricots longs ou haricots verts', group: 'Légumes' },
      { quantity: 1, name: 'oignon émincé', group: 'Légumes' },
      { quantity: 2, unit: 'c. à soupe', name: 'huile neutre', group: 'Cuisson' },
      { quantity: 1, unit: 'c. à soupe', name: 'sauce de poisson', group: 'Assaisonnement' },
      { quantity: 1, unit: 'c. à café', name: 'sucre de palme ou sucre roux', group: 'Assaisonnement' },
      { quantity: 2, unit: 'c. à soupe', name: 'eau', group: 'Assaisonnement' },
      { name: 'Feuilles de combava finement ciselées, facultatif', group: 'Finition', scalable: false },
      { name: 'Riz jasmin cuit pour accompagner', group: 'Service', scalable: false }
    ],
    steps: [
      { title: 'Préparer la mise en place', text: 'Émincez le poulet de manière régulière, coupez les haricots et mélangez sauce de poisson, sucre et eau.', cue: 'Tous les ingrédients sont prêts : la cuisson sera rapide.' },
      { title: 'Faire parfumer le kroeung', text: 'Chauffez une grande poêle ou un wok avec l’huile, ajoutez le kroeung et remuez brièvement.', duration: '1–2 min', cue: 'La pâte dégage son parfum sans brunir fortement.', mistake: 'Une pâte brûlée devient amère : réduisez le feu si elle accroche.' },
      { title: 'Saisir le poulet', text: 'Ajoutez le poulet en deux fournées si nécessaire et faites sauter jusqu’à ce que la surface soit colorée.', duration: '5–7 min', cue: 'Les morceaux sont saisis sans rendre trop de jus.' },
      { title: 'Ajouter les légumes', text: 'Ajoutez l’oignon et les haricots puis versez le mélange d’assaisonnement. Continuez jusqu’à ce que le poulet soit entièrement cuit.', duration: '5–6 min', cue: 'Les haricots restent légèrement croquants ; aucune chair rosée ne subsiste.' },
      { title: 'Servir', text: 'Parsemez éventuellement de feuilles de combava et servez immédiatement avec le riz.', cue: 'La sauce nappe légèrement le poulet sans noyer le sauté.' }
    ],
    keyPoints: ['Kroeung parfumé sans brûler', 'Cuisson vive en petites fournées', 'Poulet entièrement cuit'],
    substitutions: ['Du tofu ferme peut remplacer le poulet : faites-le bien dorer avant de l’enrober de kroeung.', 'Utilisez des haricots verts classiques si les haricots longs sont introuvables.'],
    equipment: ['Wok ou grande poêle', 'Spatule'],
    faqs: [
      { question: 'Faut-il ajouter du lait de coco ?', answer: 'Pas dans cette version sautée : le kroeung, la sauce de poisson et le jus de cuisson suffisent à enrober les ingrédients.' },
      { question: 'Peut-on préparer le kroeung à l’avance ?', answer: 'Oui, la pâte aromatique peut être préparée à l’avance et conservée au frais selon les règles habituelles d’hygiène.' }
    ],
    relatedIngredients: ['kroeung', 'citronnelle', 'galanga'],
    tags: ['poulet', 'sauté', 'kroeung', 'citronnelle', 'facile'],
    visualTone: 'fire'
  },
  {
    slug: 'num-plae-ai',
    title: 'Num Plae Ai',
    khmerName: 'នំផ្លែអាយ',
    intro: 'De petites boulettes de riz gluant au cœur de sucre de palme fondu, roulées dans la noix de coco.',
    description: 'Num Plae Ai : douceur traditionnelle khmère à base de farine de riz gluant, sucre de palme et noix de coco, avec méthode pas à pas.',
    context: 'Ces bouchées très appréciées se préparent avec une pâte souple de riz gluant qui enveloppe un petit morceau de sucre de palme. Cette recette privilégie une petite taille pour une cuisson homogène.',
    beforeYouStart: 'Coupez le sucre de palme en tout petits morceaux, préparez le coco râpé et une grande assiette propre avant de façonner les boulettes.',
    prepHeading: 'Former de petites bouchées régulières',
    servingTip: 'Laissez tiédir quelques minutes : le cœur de sucre peut être très chaud à la sortie de l’eau. Servez le jour même.',
    servingHeading: 'Un cœur fondant sous la noix de coco',
    baseServings: 4,
    servingsLabel: '16 à 20 bouchées',
    prepTime: '25 min',
    cookTime: '10 min',
    difficulty: 'Intermédiaire',
    category: 'Dessert',
    moment: 'Douceurs à partager',
    ingredients: [
      { quantity: 220, unit: 'g', name: 'farine de riz gluant', group: 'Pâte' },
      { quantity: 160, unit: 'ml', name: 'eau tiède environ, à ajuster', group: 'Pâte' },
      { quantity: 1, unit: 'pincée', name: 'sel fin', group: 'Pâte' },
      { quantity: 90, unit: 'g', name: 'sucre de palme en petits morceaux', group: 'Cœur' },
      { quantity: 120, unit: 'g', name: 'noix de coco fraîche râpée ou coco râpé réhydraté', group: 'Enrobage' },
      { name: 'Quelques gouttes d’extrait de pandan, facultatif', group: 'Pâte', scalable: false }
    ],
    steps: [
      { title: 'Pétrir une pâte souple', text: 'Mélangez farine de riz gluant, sel et eau progressivement. Pétrissez jusqu’à obtenir une pâte souple qui ne craquelle presque pas.', cue: 'Elle se roule facilement sans coller excessivement.' },
      { title: 'Former les boulettes', text: 'Divisez la pâte en 16 à 20 portions. Aplatissez chaque portion, glissez au centre un petit cube de sucre de palme et refermez parfaitement.', cue: 'Le sucre est totalement enveloppé, sans fissure.', mistake: 'Une fermeture imparfaite laisse fuir le sucre dans l’eau de cuisson.' },
      { title: 'Pocher', text: 'Plongez les boulettes par petites quantités dans une grande casserole d’eau frémissante. Attendez qu’elles remontent, puis prolongez légèrement la cuisson.', duration: '5–7 min par fournée', cue: 'Les boulettes flottent et la pâte paraît cuite et souple.' },
      { title: 'Enrober de coco', text: 'Égouttez-les avec une écumoire puis roulez délicatement les bouchées dans la noix de coco râpée.', cue: 'Le coco adhère à une surface encore légèrement humide.' },
      { title: 'Laisser tiédir', text: 'Laissez reposer quelques minutes avant de déguster pour éviter de vous brûler avec le cœur sucré.', cue: 'Les bouchées sont tièdes et se tiennent bien.' }
    ],
    keyPoints: ['Farine de riz gluant, et non farine de riz ordinaire', 'Bien fermer chaque boulette', 'Laisser refroidir le sucre fondu avant de croquer'],
    substitutions: ['Du sucre de canne brun compact peut dépanner, même si le goût sera différent.', 'La noix de coco sèche peut être légèrement humidifiée si elle est trop friable.'],
    equipment: ['Casserole', 'Écumoire', 'Grand saladier'],
    faqs: [
      { question: 'Peut-on utiliser de la farine de riz classique ?', answer: 'Non : seule la farine de riz gluant apporte la texture souple et élastique nécessaire.' },
      { question: 'Pourquoi les boulettes se percent-elles ?', answer: 'La pâte est parfois trop sèche ou le sucre est trop gros. Assouplissez la pâte et formez des boulettes bien fermées.' }
    ],
    tags: ['dessert', 'riz gluant', 'sucre de palme', 'coco', 'bouchées'],
    image: '/images/cuisine/v17-num-plae-ai-641.jpg',
    imageAlt: 'Num Plae Ai, boulettes de riz gluant cambodgiennes roulées dans la noix de coco',
    imageWidth: 641,
    imageHeight: 427,
    visualTone: 'coconut'
  },
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
