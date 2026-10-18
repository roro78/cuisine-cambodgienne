export interface RecipeTechniqueGuide {
  slug: string;
  title: string;
  description: string;
  introduction: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  imageAlt: string;
  preparation: string;
  yieldLabel: string;
  supplies: string[];
  steps: { title: string; text: string }[];
  alternatives: { title: string; text: string }[];
  questions: { question: string; answer: string }[];
  recipeSlugs: string[];
  workshopSlug?: string;
}

export const recipeTechniqueGuides: RecipeTechniqueGuide[] = [
  {
    slug: 'bouillon-leger-maison',
    title: 'Comment préparer un bouillon léger pour les soupes cambodgiennes ?',
    description: 'Bouillon de poulet ou de porc peu salé : proportions, cuisson, filtration et alternative végétale pour le kuy teav, le samlor machu et le samlor kako.',
    introduction: 'Dans une recette, « bouillon léger » veut dire un liquide parfumé, filtré, peu gras et peu salé. Voici une base maison simple : elle n’est pas une recette familiale cambodgienne unique, mais un point de départ précis pour les soupes du site.',
    image: '/images/cuisine/v18-kuy-teav.webp',
    imageWidth: 1200,
    imageHeight: 800,
    imageAlt: 'Bol de kuy teav, exemple de soupe préparée avec un bouillon',
    preparation: '15 min de préparation · 60 à 90 min de cuisson',
    yieldLabel: 'Environ 1,2 à 1,4 l de bouillon filtré',
    supplies: [
      '1,8 l d’eau froide',
      '500 g de carcasse de poulet ou d’os de porc (non assaisonnés)',
      '1 oignon moyen, pelé et coupé en deux',
      '2 échalotes, pelées et coupées en deux',
      '2 fines rondelles de gingembre, facultatives',
      'Aucun sel à ce stade : la sauce de poisson des recettes sale ensuite le bouillon'
    ],
    steps: [
      { title: 'Mettre les ingrédients dans la casserole', text: 'Placez les os de volaille ou de porc, l’oignon, les échalotes et éventuellement le gingembre dans une grande casserole. Ajoutez 1,8 l d’eau froide.' },
      { title: 'Chauffer puis écumer', text: 'Amenez doucement à frémissement. Retirez avec une écumoire la mousse qui se forme à la surface. Baissez le feu : quelques petites bulles suffisent, sans gros bouillons.' },
      { title: 'Laisser cuire sans forte ébullition', text: 'Laissez frémir 60 à 90 minutes, casserole partiellement couverte. Si le niveau baisse trop, ajoutez un peu d’eau chaude. Le liquide doit être parfumé mais pas concentré comme une sauce.' },
      { title: 'Filtrer et mesurer', text: 'Retirez les os et les aromates, puis filtrez le bouillon dans une passoire fine. Dégraissez la surface si nécessaire. Mesurez le volume et complétez avec de l’eau chaude pour obtenir la quantité demandée dans votre recette.' },
      { title: 'Assaisonner seulement dans la recette', text: 'Pour un kuy teav, prélevez 1,4 l ; pour un samlor machu ou un samlor kako, 1,2 l. Ajoutez sauce de poisson, sucre, tamarin ou kroeung uniquement selon les étapes de la recette choisie.' }
    ],
    alternatives: [
      { title: 'Sans viande : bouillon de légumes', text: 'Faites frémir 1,6 l d’eau avec 1 oignon, 1 carotte et quelques tiges de coriandre lavées pendant 30 à 40 minutes. Filtrez puis mesurez 1,2 l de liquide. Cette version convient aux préparations où le goût d’un bouillon animal n’est pas recherché.' },
      { title: 'Avec un bouillon prêt à l’emploi', text: 'Utilisez un bouillon peu salé et goûtez-le seul avant de commencer. Un concentré ou un cube se dilue selon la notice ; réduisez sa quantité si le goût est trop puissant. Ne rajoutez pas de sel avant la sauce de poisson.' }
    ],
    questions: [
      { question: 'Est-ce qu’un bouillon léger est simplement de l’eau ?', answer: 'Non. L’eau seule convient à certaines soupes, mais un bouillon léger contient des arômes extraits d’os ou de légumes. Il reste filtré et peu salé pour ne pas masquer le tamarin, les herbes ou le kroeung.' },
      { question: 'Pourquoi ne pas le saler dès le départ ?', answer: 'Les recettes utilisent souvent de la sauce de poisson et parfois du prahok. Saler avant leur ajout peut rendre le plat trop salé.' },
      { question: 'Puis-je le préparer la veille ?', answer: 'Oui. Après cuisson, faites-le refroidir rapidement dans de petits récipients et conservez-le au réfrigérateur. Réchauffez-le jusqu’à ce qu’il soit bien chaud avant de préparer la soupe.' }
    ],
    recipeSlugs: ['kuy-teav', 'samlor-machu', 'samlor-kako'],
    workshopSlug: 'bouillon-leger-savoureux'
  },
  {
    slug: 'pickles-carotte-concombre',
    title: 'Pickles rapides de carotte et de concombre : comment les préparer ?',
    description: 'Recette simple de pickles de carotte et concombre au vinaigre de riz : quantités exactes, découpe, temps de repos et utilisation dans le bai sach chrouk et le num pang.',
    introduction: 'Les pickles sont des légumes légèrement vinaigrés qui apportent du croquant et de la fraîcheur aux viandes grillées et aux sandwichs. Dans les recettes du site, « pickles » désigne cette préparation déjà égouttée, et non des légumes nature.',
    image: '/images/cuisine/v19-bai-sach-chrouk-1440.webp',
    imageWidth: 1440,
    imageHeight: 960,
    imageAlt: 'Bai sach chrouk servi avec des légumes croquants',
    preparation: '15 min de préparation · 30 min de repos minimum',
    yieldLabel: 'Environ 200 à 250 g de légumes marinés',
    supplies: [
      '1 carotte moyenne (environ 100 g)',
      '½ concombre (environ 120 g)',
      '120 ml de vinaigre de riz',
      '120 ml d’eau',
      '1 c. à soupe de sucre',
      '½ c. à café de sel'
    ],
    steps: [
      { title: 'Préparer les légumes', text: 'Lavez la carotte et le concombre. Pelez la carotte et coupez-la en fins bâtonnets. Coupez le demi-concombre en demi-rondelles fines ou en bâtonnets. Retirez le cœur très aqueux si nécessaire.' },
      { title: 'Dissoudre le sucre et le sel', text: 'Dans un bol propre, mélangez 120 ml de vinaigre de riz, 120 ml d’eau, 1 c. à soupe de sucre et ½ c. à café de sel jusqu’à dissolution.' },
      { title: 'Faire mariner au frais', text: 'Plongez les légumes dans le liquide, couvrez et placez au réfrigérateur pendant au moins 30 minutes. Remuez une fois pour répartir l’assaisonnement.' },
      { title: 'Égoutter avant de servir', text: 'Prélevez les légumes avec une fourchette ou une écumoire, puis égouttez-les soigneusement. Utilisez-en environ 200 g pour quatre assiettes de bai sach chrouk ou quatre num pang.' }
    ],
    alternatives: [
      { title: 'Goût moins acide', text: 'Augmentez légèrement la proportion d’eau dans le liquide de marinade, mais gardez les pickles au réfrigérateur. Ajustez le sucre à votre goût.' },
      { title: 'Préparation à l’avance', text: 'Ces pickles express sont prévus pour une consommation rapide, conservés au réfrigérateur dans un récipient propre. Ils ne sont pas une conserve stable à température ambiante.' }
    ],
    questions: [
      { question: 'Est-ce que les pickles doivent cuire ?', answer: 'Non. Dans cette version rapide, les légumes restent crus, lavés et coupés finement ; ils s’assouplissent au contact du vinaigre au réfrigérateur.' },
      { question: 'Peut-on les mettre encore mouillés dans une baguette ?', answer: 'Mieux vaut les égoutter juste avant de garnir le pain : l’excès de liquide ramollit la mie.' },
      { question: 'Peut-on remplacer le vinaigre de riz ?', answer: 'Un vinaigre de cidre doux convient aussi, mais son arôme sera différent. Évitez un vinaigre très fort utilisé pur.' }
    ],
    recipeSlugs: ['bai-sach-chrouk', 'num-pang']
  }
];

const guideBySlug = new Map(recipeTechniqueGuides.map((guide) => [guide.slug, guide]));

export const getRecipeTechniqueGuide = (slug: string): RecipeTechniqueGuide | undefined => guideBySlug.get(slug);
export const getTechniqueGuidesForRecipe = (recipeSlug: string): RecipeTechniqueGuide[] =>
  recipeTechniqueGuides.filter((guide) => guide.recipeSlugs.includes(recipeSlug));
