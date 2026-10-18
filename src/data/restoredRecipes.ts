export interface RestoredRecipe {
  slug: string;
  title: string;
  kicker: string;
  description: string;
  intro: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  ingredients: string[];
  steps: { title: string; text: string }[];
  tips: string[];
  sources: { label: string; url: string }[];
  image?: string;
  imageAlt?: string;
  imageCaption?: string;
  imageWidth?: number;
  imageHeight?: number;
}

/**
 * Fiches de récupération SEO : recettes réécrites d'après des sources historiques.
 * Séparées des 13 fiches classiques : aucune fausse photographie de plat et
 * aucun changement aux contrats ou modèles des recettes déjà publiées.
 */
export const restoredRecipes: RestoredRecipe[] = [
  {
    slug: 'curry-poulet-khmer',
    title: 'Curry de poulet khmer au lait de coco et au tamarin',
    kicker: 'Recette historique retrouvée',
    description: 'Curry cambodgien au poulet, lait de coco, citronnelle, galanga et tamarin : ingrédients précis et préparation étape par étape.',
    intro: 'Une version familiale d’un curry khmer parfumé, reconstituée à partir d’une ancienne recette du site encore citée sur Internet. Les proportions et les gestes sont explicités pour pouvoir la cuisiner sans ambiguïté.',
    servings: '4 à 5 personnes',
    prepTime: '35 min (dont 30 min de marinade)',
    cookTime: '45 min environ',
    ingredients: [
      '1 poulet d’environ 1,2 à 1,5 kg, découpé en morceaux',
      '4 c. à soupe de jus de tamarin filtré, sans noyaux ni fibres',
      '400 ml de lait de coco non sucré (quantité indicative ajoutée pour cette version)',
      '8 petites échalotes pelées',
      '1 tige de citronnelle, partie tendre émincée',
      '4 cm de galanga pelé, en fines lamelles',
      '4 cm de gingembre frais pelé',
      '2 cm de curcuma frais pelé, ou 1 c. à café de curcuma en poudre',
      '2 c. à café de graines de coriandre légèrement torréfiées',
      '2 feuilles de combava (sans leur nervure centrale)',
      '1 petit piment rouge épépiné, facultatif (à doser selon le goût)',
      '1 c. à café de sel fin, à rectifier en fin de cuisson',
      '1 feuille de curcuma facultative, si disponible',
      'Riz jasmin cuit, pour servir'
    ],
    steps: [
      { title: 'Faire mariner le poulet', text: 'Déposez les morceaux de poulet dans un plat. Versez les quatre cuillères à soupe de jus de tamarin filtré, mélangez, couvrez puis laissez reposer 30 minutes au réfrigérateur. Ne réutilisez pas la marinade crue comme sauce de service.' },
      { title: 'Préparer la pâte aromatique', text: 'Émincez la partie tendre de la citronnelle, les échalotes, le galanga, le gingembre et le curcuma. Pilez ou mixez-les avec les graines de coriandre torréfiées et le piment facultatif. Ajoutez deux cuillères à soupe du lait de coco prélevées sur les 400 ml si la pâte est trop sèche. La texture doit être épaisse et régulière.' },
      { title: 'Développer les parfums', text: 'Dans une cocotte, faites chauffer la pâte aromatique à feu moyen-doux pendant deux à trois minutes, en remuant et en ajoutant une cuillerée d’eau si elle attache. Incorporez les feuilles de combava, la feuille de curcuma facultative et le reste du lait de coco.' },
      { title: 'Cuire doucement le curry', text: 'Portez à petit frémissement, ajoutez les morceaux de poulet avec leur marinade et le sel. Couvrez partiellement, puis laissez cuire doucement environ 35 à 45 minutes en remuant de temps en temps. Prolongez si nécessaire : la chair doit être cuite à cœur (74 °C dans la partie la plus épaisse, sans toucher l’os).' },
      { title: 'Ajuster et servir', text: 'Goûtez la sauce uniquement lorsque le poulet est entièrement cuit. Rectifiez le sel et, au besoin, détendez avec un peu d’eau chaude. Servez avec le riz jasmin. La sauce doit rester parfumée et nappante, sans bouillir fortement.' }
    ],
    tips: [
      'La recette d’époque ne précisait pas le volume de lait de coco : 400 ml constitue une adaptation culinaire et non une transcription littérale.',
      'La source d’époque mentionnait six à huit piments rouges : cette version commence plus doucement, avec la possibilité d’en rajouter.',
      'L’amok de poisson est un autre plat : ce curry mérite sa propre page et sa propre redirection.'
    ],
    sources: [
      { label: 'Pays du Sourire — reproduction de l’ancienne recette « Poulet curry à la khmère »', url: 'https://paysdusourire.wifeo.com/cuisine-cambodgienne.php' },
      { label: 'Cuisine du Cambodge — préparer un kroeung jaune', url: 'https://www.cuisine-du-cambodge.com/recettes/kroeung-jaune/' }
    ],
    image: '/images/cuisine/kroeung-1600.webp',
    imageAlt: 'Ingrédients aromatiques d’un kroeung cambodgien au mortier, et non photographie du curry terminé',
    imageCaption: 'Photo des aromates utilisés en cuisine cambodgienne ; le plat final n’est pas représenté.'
  },
  {
    slug: 'nom-krob-totim',
    title: 'Nom Krob Totim : châtaignes d’eau et perles de tapioca au coco',
    kicker: 'Dessert historique retrouvé',
    description: 'Dessert Nom Krob Totim : châtaignes d’eau enrobées de fécule de tapioca, lait de coco et glace pilée. Recette expliquée pas à pas.',
    intro: 'Des cubes croquants de châtaigne d’eau, enveloppés d’une fine couche translucide de tapioca, servis dans un lait de coco sucré et très frais. Cette recette est une adaptation explicite de la préparation citée en 2017 sur le Routard.',
    servings: '4 petites coupes',
    prepTime: '25 min',
    cookTime: '10 min',
    ingredients: [
      '8 à 10 châtaignes d’eau entières, fraîches ou en conserve rincées (environ 120 g égouttés)',
      '70 g de fécule de tapioca (farine de tapioca, et non perles déjà formées)',
      '200 ml de lait de coco non sucré',
      '200 ml d’eau pour le sirop, plus une casserole d’eau pour pocher les cubes',
      '70 g de sucre (à adapter au goût)',
      'Quelques gouttes de colorant alimentaire rouge, facultatif',
      'Glace pilée, à ajouter au moment du service'
    ],
    steps: [
      { title: 'Découper les châtaignes d’eau', text: 'Égouttez et rincez les châtaignes d’eau si elles sont en conserve. Coupez-les en petits cubes réguliers d’environ un centimètre. Elles doivent rester croquantes.' },
      { title: 'Colorer si souhaité', text: 'Mettez les cubes dans un bol avec un peu d’eau froide et quelques gouttes de colorant rouge alimentaire. Mélangez et laissez reposer dix minutes, puis égouttez soigneusement. Sans colorant, la recette fonctionne aussi.' },
      { title: 'Enrober de tapioca', text: 'Versez la fécule de tapioca dans une assiette creuse. Roulez les cubes égouttés dedans pour les recouvrir de tous côtés. Secouez délicatement l’excédent : il faut une pellicule régulière, pas de gros paquets de farine.' },
      { title: 'Pocher les perles', text: 'Faites bouillir une casserole d’eau. Plongez les cubes en plusieurs petites fournées pour éviter qu’ils ne collent. Lorsqu’ils remontent et que leur enrobage est devenu translucide, poursuivez une à deux minutes, puis transférez-les à l’écumoire dans un bol d’eau froide et égouttez.' },
      { title: 'Préparer le lait de coco sucré', text: 'Portez les 200 ml d’eau du sirop avec les 70 g de sucre à un léger frémissement jusqu’à dissolution complète. Hors du feu, incorporez les 200 ml de lait de coco. Laissez refroidir et réfrigérez avant le service.' },
      { title: 'Dresser juste avant dégustation', text: 'Répartissez les cubes de châtaignes d’eau enrobés de tapioca dans quatre coupes. Versez le lait de coco sucré bien froid et ajoutez un peu de glace pilée. Servez immédiatement pour garder le contraste entre le croquant et le frais.' }
    ],
    tips: [
      'Ne confondez pas ce dessert avec les boulettes de riz gluant Num Plae Ai : les ingrédients et la texture sont différents.',
      'La préparation de 2017 prévoyait deux châtaignes d’eau et davantage de sucre ; les quantités sont rééquilibrées ici pour quatre coupes réellement servables.',
      'Le dessert possède des variantes dans plusieurs cuisines d’Asie du Sud-Est ; il ne faut pas lui attribuer une origine cambodgienne exclusive sans preuve.'
    ],
    sources: [
      { label: 'Le Routard — discussion du 30 mai 2017 citant l’ancienne recette', url: 'https://www.routard.com/forums/t/recherche-nom-dun-dessert/177773' },
      { label: 'Provence Town — recette Nom Krob Totim publiée le 26 octobre 2017', url: 'https://provencetown.wordpress.com/category/recettes/' }
    ]
  },
  {
    slug: 'samla-mchou-yuon',
    title: 'Samla M’Chou Yuon : soupe acidulée au poisson, à la tomate et à l’ananas',
    kicker: 'Une variante retrouvée',
    description: 'Préparer Samla M’Chou Yuon, une soupe cambodgienne acidulée au poisson, tamarin, tomate et ananas, avec des repères clairs de cuisson.',
    intro: 'Cette variante de soupe acidulée associe poisson, tamarin, tomate, ananas et herbes. Son ancien nom apparaît encore dans des publications qui renvoyaient vers Cuisine du Cambodge. Elle possède des gestes et une garniture distincts de notre recette de base Samlor Machu.',
    servings: '4 petits bols',
    prepTime: '20 min',
    cookTime: '20 min',
    ingredients: [
      '400 g de poisson blanc ferme sans arêtes, coupé en morceaux épais',
      '100 g d’ananas frais, en petits morceaux',
      '1 tomate mûre, découpée en quartiers',
      '1 litre d’eau',
      '2 c. à soupe de jus de tamarin filtré, puis davantage si nécessaire',
      '1 gousse d’ail finement hachée',
      '1 c. à soupe d’huile végétale neutre',
      '1 c. à soupe de sauce de poisson',
      '2 c. à café de sucre',
      '1 pincée de sel, à rectifier',
      '100 g de tiges de nénuphar comestibles (prolit) préparées, facultatif ; à défaut, ne pas remplacer par une plante aquatique non identifiée',
      'Une poignée d’herbes fraîches : coriandre longue et ma-om si disponibles, ou coriandre fraîche'
    ],
    steps: [
      { title: 'Préparer fruits, poisson et herbes', text: 'Vérifiez que le poisson est sans arêtes, puis détaillez-le en morceaux réguliers. Coupez la tomate en quartiers et l’ananas en dés. Lavez les herbes. Si vous disposez de tiges de nénuphar comestibles de provenance alimentaire sûre, coupez-les en tronçons de cinq centimètres.' },
      { title: 'Saisir l’ail et le poisson', text: 'Dans une poêle, faites chauffer la cuillerée d’huile. Ajoutez l’ail et remuez brièvement sans le brûler. Déposez ensuite le poisson et faites-le colorer légèrement sur une face. Il finira de cuire dans la soupe : ne goûtez pas encore le bouillon.' },
      { title: 'Construire le bouillon acidulé', text: 'Dans une casserole, portez le litre d’eau au frémissement avec deux cuillères à soupe de jus de tamarin filtré, le sucre et la pincée de sel. Transférez délicatement le poisson et l’ail dans le bouillon, puis versez la cuillerée de sauce de poisson.' },
      { title: 'Cuire la garniture', text: 'Ajoutez les tiges comestibles facultatives et laissez frémir cinq minutes. Incorporez ensuite la tomate et l’ananas, puis cuisez encore quelques minutes à petit frémissement jusqu’à ce que le poisson soit entièrement cuit et que la tomate commence à s’attendrir.' },
      { title: 'Équilibrer et parfumer', text: 'Une fois le poisson cuit, goûtez le bouillon. Corrigez l’acidité par petites touches de tamarin ou adoucissez avec un peu d’eau. Hors du feu, ajoutez les herbes fraîches ciselées et servez immédiatement avec du riz.' }
    ],
    tips: [
      'Le Samlor Machu est une famille de soupes acidulées ; cette variante se distingue par le poisson, la tomate, l’ananas et les herbes spécifiques.',
      'Le terme « Yuon » est présent dans des appellations culinaires historiques, mais peut être perçu comme offensant selon le contexte. Nous le conservons ici pour identifier précisément la recette ancienne, sans l’employer pour désigner des personnes.',
      'Certains textes anciens parlent de « tiges de lotus » ; la source culinaire consultée précise qu’il s’agit dans cette préparation de tiges de nénuphar (prolit), et non d’un lotus. On peut les omettre si leur identification n’est pas certaine.',
      'Pour une version très accessible sans saisie préalable du poisson, consultez aussi notre recette Samlor Machu.'
    ],
    sources: [
      { label: 'Phnomenon (2006) — Samla Machou Yuon, recette et précisions sur les tiges aquatiques', url: 'https://www.phnomenon.com/index.php/cambodian-food/recipes/samla-machou-yuon-the-y-word/' },
      { label: 'Provence Town (2017) — soupe Samla M’Chou Yuon', url: 'https://provencetown.wordpress.com/category/recettes/' },
      { label: 'Cuisine du Cambodge — recette plus générale Samlor Machu', url: 'https://www.cuisine-du-cambodge.com/recettes/samlor-machu/' }
    ],
    image: '/images/cuisine/v18-samlor-machu.webp',
    imageAlt: 'Illustration d’une soupe acidulée cambodgienne au poisson, ananas, tomate et herbes (version proche)',
    imageCaption: 'Photo d’une soupe acidulée proche ; illustration culinaire, pas photographie spécifique de cette variante.',
    imageWidth: 717,
    imageHeight: 724
  }
];
