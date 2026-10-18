export type WorkshopLevel = 'Débutant' | 'Intermédiaire' | 'Tous niveaux';
export type WorkshopIcon = 'prep' | 'taste' | 'cook' | 'servings';

export interface WorkshopStep {
  title: string;
  action: string;
  observe: string;
  cue: string;
  mistake?: string;
  success: string;
}

export interface Workshop {
  slug: string;
  n: string;
  icon: WorkshopIcon;
  eyebrow: string;
  title: string;
  duration: string;
  level: WorkshopLevel;
  objective: string;
  intro: string;
  outcomes: string[];
  prepare: string[];
  experiments: string[];
  takeaway: string;
  steps: WorkshopStep[];
  relatedRecipes: string[];
  glossarySlugs?: string[];
}

export const workshops: Workshop[] = [
  {
    slug: 'piler-aromates-au-mortier',
    n: '01',
    icon: 'prep',
    eyebrow: 'Le mortier',
    title: 'Bien piler les aromates au mortier',
    duration: '45 min',
    level: 'Débutant',
    objective: 'Voir comment le mortier transforme des aromates frais en une pâte fine et parfumée.',
    intro: 'Ici, le but n’est pas de suivre une recette complète. Vous allez comparer les textures, sentir les parfums qui se libèrent et apprendre à reconnaître le moment où les aromates forment enfin une pâte homogène.',
    outcomes: [
      'Préparer les aromates pour éviter de lutter inutilement contre les fibres.',
      'Comprendre dans quel ordre les piler.',
      'Reconnaître une pâte assez fine sans dépendre d’un minuteur.'
    ],
    prepare: [
      'Pour cet exercice : 1 cœur tendre de citronnelle, 10 g de galanga, 10 g de curcuma frais, 1 gousse d’ail et 1 petite échalote, épluchés puis coupés très finement.',
      'Un mortier, un pilon et une petite cuillère pour ramener la pâte au centre.',
      'Une petite assiette pour comparer les textures au fil de l’atelier.'
    ],
    experiments: [
      'Sentir une tige de citronnelle entière, puis coupée très finement.',
      'Comparer la résistance du galanga et du curcuma sous le pilon.',
      'Piler par petites quantités et observer le moment où les parfums commencent à se fondre.'
    ],
    takeaway: 'Vous saurez quand arrêter de piler : la pâte doit être souple, homogène et très parfumée.',
    steps: [
      {
        title: 'Couper avant de piler',
        action: 'Émincez très finement les ingrédients les plus fibreux avant de les mettre dans le mortier.',
        observe: 'Comparez un morceau épais avec un morceau fin : le second cède beaucoup plus vite sous le pilon.',
        cue: 'Les morceaux ne doivent plus former de longues fibres difficiles à écraser.',
        mistake: 'Mettre de gros morceaux directement dans le mortier rallonge le travail et laisse une pâte irrégulière.',
        success: 'Vous obtenez de petits morceaux réguliers qui commencent déjà à libérer leur parfum.'
      },
      {
        title: 'Commencer par les plus résistants',
        action: 'Pilez d’abord les ingrédients fermes et fibreux, puis ajoutez progressivement les plus tendres.',
        observe: 'La texture passe de morceaux distincts à une masse plus compacte.',
        cue: 'Le pilon ne rebondit presque plus sur de gros fragments.',
        success: 'La base devient dense et commence à se tenir.'
      },
      {
        title: 'Chercher la pâte, pas la vitesse',
        action: 'Continuez à piler en ramenant régulièrement la préparation vers le centre du mortier.',
        observe: 'Les couleurs et les parfums se mélangent tandis que les fibres deviennent moins visibles.',
        cue: 'Quand vous pincez une petite quantité, la pâte reste liée au lieu de se séparer en morceaux.',
        mistake: 'Ajouter beaucoup d’eau pour aller plus vite dilue la pâte au lieu de l’affiner.',
        success: 'La préparation est souple, humide et homogène.'
      },
      {
        title: 'Comparer avant et après',
        action: 'Mettez côte à côte une petite quantité prélevée à mi-parcours et la pâte terminée.',
        observe: 'Comparez finesse, odeur et tenue entre les deux.',
        cue: 'La version finale doit être nettement plus liée et plus régulière.',
        success: 'Vous pouvez expliquer visuellement pourquoi la pâte finale est prête.'
      }
    ],
    relatedRecipes: ['kroeung-jaune', 'amok-trey'],
    glossarySlugs: ['kroeung', 'citronnelle', 'galanga', 'curcuma', 'combava']
  },
  {
    slug: 'equilibrer-une-sauce',
    n: '02',
    icon: 'taste',
    eyebrow: 'L’équilibre',
    title: 'Trouver le bon équilibre en goûtant',
    duration: '30 min',
    level: 'Débutant',
    objective: 'Savoir goûter une sauce et décider si elle a besoin d’un peu de sel, de sucre ou d’acidité.',
    intro: 'Vous allez comparer plusieurs petits bols de sauce pour comprendre le rôle du sel, du sucre et du tamarin. Le but : apprendre à rectifier l’assaisonnement sans tout ajouter d’un coup.',
    outcomes: [
      'Ne changer qu’un seul ingrédient à la fois.',
      'Comparer deux corrections au lieu de tout ajouter ensemble.',
      'S’arrêter dès que la sauce est à votre goût.'
    ],
    prepare: [
      'Quatre petits bols identiques.',
      'Préparez une base sans produit cru : mélangez 120 ml d’eau avec ½ c. à café de sauce de poisson. Versez 30 ml de cette base dans chacun des quatre bols.',
      'Pour trois essais séparés : du jus de citron vert ou du jus de tamarin filtré, 1 petite pincée de sucre et 1 petite pincée de sel. Gardez le quatrième bol sans ajout.'
    ],
    experiments: [
      'Préparer quatre bols de sauce identiques et ne changer qu’un ingrédient par bol.',
      'Ajouter le tamarin peu à peu et goûter comment l’acidité réveille la sauce.',
      'Comparer une correction au sucre avec une correction au sel sans toucher au reste.'
    ],
    takeaway: 'Vous apprendrez à corriger une sauce petit à petit, sans tout ajouter en même temps.',
    steps: [
      {
        title: 'Créer un point de départ',
        action: 'Répartissez exactement la même base dans plusieurs petits bols.',
        observe: 'Goûtez-les avant toute correction pour mémoriser le point de départ.',
        cue: 'Les bols doivent avoir le même goût avant l’expérience.',
        success: 'Vous avez une référence claire pour comparer chaque modification.'
      },
      {
        title: 'Changer une seule chose',
        action: 'Ajoutez un peu d’acidité dans un bol, un peu de douceur dans un autre et un peu de salé dans un troisième.',
        observe: 'Goûtez immédiatement après chaque ajout.',
        cue: 'Vous devez pouvoir dire si chaque ajout rend la sauce plus salée, plus douce ou plus acide.',
        mistake: 'Modifier plusieurs éléments en même temps empêche de savoir ce qui a réellement amélioré la sauce.',
        success: 'Vous identifiez plus facilement le rôle de chaque correction.'
      },
      {
        title: 'Corriger par petites touches',
        action: 'Choisissez le bol le plus prometteur et poursuivez avec de très petites quantités.',
        observe: 'Le goût doit être agréable, sans excès de sel, de sucre ou d’acidité.',
        cue: 'La correction suivante devient de moins en moins nécessaire.',
        success: 'Vous savez vous arrêter avant de surcorriger.'
      },
      {
        title: 'Refaire sans regarder les bols',
        action: 'Mélangez les bols et regoûtez-les dans un ordre différent.',
        observe: 'Cherchez celui qui vous paraît le plus équilibré sans vous fier à ce que vous avez ajouté.',
        cue: 'Votre préférence reste cohérente même sans connaître la correction.',
        success: 'Votre palais commence à guider la décision plutôt que la recette.'
      }
    ],
    relatedRecipes: ['lok-lak', 'samlor-machu', 'prahok-ktis'],
    glossarySlugs: ['tamarin', 'prahok', 'sauce-poisson']
  },
  {
    slug: 'saisir-viande-poele',
    n: '03',
    icon: 'cook',
    eyebrow: 'Le feu',
    title: 'Bien saisir la viande à la poêle',
    duration: '35 min',
    level: 'Débutant',
    objective: 'Comprendre pourquoi une poêle bien chaude donne une viande dorée et juteuse au lieu de la faire cuire dans son jus.',
    intro: 'Le but est de voir la différence entre saisir et simplement cuire. Vous allez jouer sur la quantité dans la poêle, la chaleur et le moment où la sauce entre en scène.',
    outcomes: [
      'Reconnaître une poêle suffisamment chaude.',
      'Comprendre pourquoi les petites fournées colorent mieux.',
      'Ajouter la sauce au bon moment sans perdre la coloration.'
    ],
    prepare: [
      'Une grande poêle ou un wok.',
      '450 g de bœuf à poêler, en morceaux de taille identique : 100 g pour le premier essai, 250 g pour comparer une poêle plus chargée et 100 g pour l’essai final.',
      '1 c. à soupe d’huile neutre, répartie entre les essais, et 1 c. à café de sauce soja à verser seulement sur la dernière fournée une fois la viande dorée.'
    ],
    experiments: [
      'Comparer une petite quantité et une poêle surchargée.',
      'Observer le bruit, la vapeur et la coloration pendant les trente premières secondes.',
      'Ajouter une sauce seulement après coloration et regarder la différence.'
    ],
    takeaway: 'Vous saurez reconnaître une poêle assez chaude en observant la coloration, le bruit et la vapeur.',
    steps: [
      {
        title: 'Chauffer avant de charger',
        action: 'Faites chauffer la poêle vide, puis ajoutez seulement une petite quantité de viande.',
        observe: 'Écoutez le contact avec la poêle et regardez si la surface commence rapidement à colorer.',
        cue: 'La viande saisit franchement sans baigner immédiatement dans du liquide.',
        success: 'La première face colore avant que beaucoup de jus ne s’accumule.'
      },
      {
        title: 'Comparer avec une poêle trop pleine',
        action: 'Faites un second essai avec davantage de morceaux en même temps.',
        observe: 'Regardez la quantité de vapeur et de liquide qui apparaît.',
        cue: 'Si la poêle se remplit de jus, la coloration ralentit nettement.',
        mistake: 'Remuer en permanence empêche aussi une face de rester assez longtemps au contact de la poêle.',
        success: 'La différence entre saisir et cuire dans le jus devient évidente.'
      },
      {
        title: 'Laisser colorer avant la sauce',
        action: 'Sur une nouvelle petite fournée, attendez la coloration avant d’ajouter la sauce.',
        observe: 'La sauce enrobe alors une surface déjà dorée.',
        cue: 'La coloration reste visible sous le glaçage.',
        success: 'La viande garde une surface dorée et brillante.'
      },
      {
        title: 'Arrêter au bon moment',
        action: 'Retirez la viande dès qu’elle est cuite selon la coupe utilisée.',
        observe: 'La poêle continue de transmettre beaucoup de chaleur même après la dernière seconde de cuisson active.',
        cue: 'La viande ne doit pas rester inutilement dans la poêle chaude.',
        success: 'Vous contrôlez mieux la coloration sans prolonger la cuisson.'
      }
    ],
    relatedRecipes: ['lok-lak', 'bai-sach-chrouk'],
    glossarySlugs: ['lok-lak', 'poivre-de-kampot']
  },
  {
    slug: 'fraicheur-herbes-agrumes',
    n: '04',
    icon: 'taste',
    eyebrow: 'Les herbes',
    title: 'Ajouter de la fraîcheur au bon moment',
    duration: '25 min',
    level: 'Débutant',
    objective: 'Voir comment les herbes, les agrumes et les crudités rendent un plat plus frais et plus vivant.',
    intro: 'Cet atelier consiste à comparer la même bouchée avec ou sans finition fraîche. Vous apprendrez surtout à doser et à choisir le bon moment pour ajouter herbes et agrumes.',
    outcomes: [
      'Comparer l’effet d’une herbe fraîche et d’un agrume.',
      'Préserver parfum et texture en ajoutant certains éléments au dernier moment.',
      'Éviter qu’une finition fraîche masque complètement le reste du plat.'
    ],
    prepare: [
      'Quelques feuilles de coriandre et de menthe lavées et bien égouttées.',
      '1 citron vert lavé : utilisez son jus et un peu de zeste vert, sans la peau blanche amère.',
      'Une petite portion d’un plat déjà cuit, sans herbes ni citron, pour pouvoir comparer.'
    ],
    experiments: [
      'Goûter une même bouchée sans herbe, puis avec coriandre ou menthe.',
      'Comparer le jus de citron vert, son zeste et quelques herbes fraîches : ils n’apportent pas le même parfum.',
      'Ajouter la fraîcheur à la fin pour préserver parfum et croquant.'
    ],
    takeaway: 'Vous saurez quand ajouter les herbes et les agrumes pour garder tout leur parfum.',
    steps: [
      {
        title: 'Goûter sans finition',
        action: 'Commencez par une bouchée sans herbe ni agrume.',
        observe: 'Mémorisez la richesse, le sel et la longueur en bouche.',
        cue: 'Vous devez pouvoir décrire ce qui manque avant d’ajouter quoi que ce soit.',
        success: 'Vous avez une référence claire.'
      },
      {
        title: 'Ajouter une herbe seule',
        action: 'Ajoutez une petite quantité d’herbe fraîche à la bouchée suivante.',
        observe: 'Goûtez et dites si le plat paraît plus frais ou plus acidulé.',
        cue: 'L’herbe doit compléter la bouchée sans devenir le seul goût perceptible.',
        success: 'La bouchée paraît plus fraîche tout en restant reconnaissable.'
      },
      {
        title: 'Comparer jus et zeste',
        action: 'Testez séparément une petite touche de jus puis de zeste.',
        observe: 'Le jus agit surtout sur l’acidité tandis que le zeste agit fortement sur le parfum.',
        cue: 'Les deux essais ne doivent pas produire exactement la même impression.',
        mistake: 'Ajouter une grosse quantité d’un coup rend la comparaison difficile.',
        success: 'Vous distinguez le rôle de chaque finition.'
      },
      {
        title: 'Finir juste avant de servir',
        action: 'Assemblez la combinaison que vous préférez au dernier moment.',
        observe: 'Regardez la tenue des herbes et des éléments croquants.',
        cue: 'La finition reste vive et nette.',
        success: 'Vous obtenez une bouchée plus fraîche sans perdre l’équilibre du plat.'
      }
    ],
    relatedRecipes: ['kuy-teav', 'num-banh-chok', 'lok-lak'],
    glossarySlugs: ['combava', 'citronnelle']
  },
  {
    slug: 'bouillon-leger-savoureux',
    n: '05',
    icon: 'cook',
    eyebrow: 'Le bouillon',
    title: 'Préparer un bouillon léger et savoureux',
    duration: '50 min',
    level: 'Intermédiaire',
    objective: 'Préparer un bouillon clair, parfumé et agréable à boire, sans le charger inutilement.',
    intro: 'Cet atelier de dégustation commence avec un bouillon déjà préparé, et non avec de l’eau ou des os crus. Comparez son goût avant et après une courte réduction, puis assaisonnez progressivement et ajoutez les notes fraîches à la fin.',
    outcomes: [
      'Comparer un bouillon avant et après concentration.',
      'Assaisonner progressivement plutôt qu’en une seule fois.',
      'Garder le parfum des herbes jusqu’au moment de servir.'
    ],
    prepare: [
      '400 ml de bouillon de volaille ou de légumes déjà préparé, filtré et peu salé, maison ou prêt à l’emploi. La fabrication du bouillon n’est pas comprise dans les 50 minutes de cet exercice.',
      'Deux petites tasses pour comparer les échantillons tiédis, une cuillère propre et un peu de sauce de poisson ou de sel pour rectifier uniquement après la réduction.',
      '2 brins de coriandre ou 1 petite ciboule et 1 quartier de citron vert, à ajouter uniquement hors du feu.'
    ],
    experiments: [
      'Goûter le bouillon avant et après réduction pour sentir la concentration.',
      'Ajouter les éléments salés progressivement plutôt qu’en début de cuisson.',
      'Finir avec herbes et agrumes hors du feu pour préserver les notes fraîches.'
    ],
    takeaway: 'Vous saurez renforcer le goût d’un bouillon sans le rendre trop salé ni trop lourd.',
    steps: [
      {
        title: 'Goûter avant de réduire',
        action: 'Prélevez une cuillerée de bouillon avant de poursuivre la cuisson.',
        observe: 'Goûtez le bouillon : est-il déjà salé et suffisamment parfumé ?',
        cue: 'Souvenez-vous de ce goût : en réduisant, le bouillon deviendra plus corsé et peut-être plus salé.',
        success: 'Vous avez un point de comparaison fiable.'
      },
      {
        title: 'Faire réduire avant de saler',
        action: 'Laissez réduire légèrement avant de faire la correction finale en sel.',
        observe: 'Goûtez régulièrement plutôt que d’attendre la fin.',
        cue: 'Le bouillon est plus parfumé sans être trop salé.',
        mistake: 'Saler fortement dès le départ peut devenir difficile à corriger après réduction.',
        success: 'Vous contrôlez la concentration sans perdre l’équilibre.'
      },
      {
        title: 'Clarifier ce qui manque',
        action: 'Avant tout nouvel ajout, décidez si le bouillon manque réellement de sel, de parfum ou de fraîcheur.',
        observe: 'Chaque défaut appelle une correction différente.',
        cue: 'Vous pouvez nommer le problème avant de toucher à l’assaisonnement.',
        success: 'Les ajustements deviennent plus précis.'
      },
      {
        title: 'Ajouter la fraîcheur hors du feu',
        action: 'Coupez le feu puis ajoutez les herbes ou agrumes choisis.',
        observe: 'Le parfum reste plus net que lors d’une longue cuisson.',
        cue: 'La finition doit se sentir dès que le bol approche du nez.',
        success: 'Le bouillon reste léger tout en paraissant plus aromatique.'
      }
    ],
    relatedRecipes: ['kuy-teav', 'samlor-machu'],
    glossarySlugs: ['sauce-poisson', 'citronnelle', 'combava']
  },
  {
    slug: 'composer-repas-cambodgien',
    n: '06',
    icon: 'servings',
    eyebrow: 'La table',
    title: 'Composer un repas simple et généreux',
    duration: '20 min',
    level: 'Tous niveaux',
    objective: 'Associer riz, plat chaud, légumes, herbes et condiments pour préparer un repas équilibré à partager.',
    intro: 'Pas besoin de préparer six plats différents : apprenez à associer du riz, un plat chaud, des légumes frais et un condiment pour un repas cambodgien à partager.',
    outcomes: [
      'Commencer le repas avec du riz à partager.',
      'Éviter d’accumuler plusieurs éléments très riches.',
      'Créer des bouchées différentes avec les mêmes préparations.'
    ],
    prepare: [
      'Un bol de riz jasmin déjà cuit et maintenu au chaud, à partager entre deux personnes.',
      'Un plat chaud déjà entièrement cuit, par exemple un lok lak au bœuf ou un amok de poisson.',
      'Quelques tranches de concombre lavé et des feuilles de coriandre, ou des pickles de carotte-concombre déjà préparés.',
      'Un petit bol de condiment citron vert-poivre, ou de sauce de poisson diluée, à doser individuellement.'
    ],
    experiments: [
      'Partir du riz et ajouter un seul élément riche.',
      'Ajouter ensuite une fraîcheur végétale ou acide.',
      'Tester plusieurs bouchées en variant sauce, herbes et condiment.'
    ],
    takeaway: 'Vous verrez qu’avec quelques préparations bien choisies, chacun peut composer des bouchées différentes à table.',
    steps: [
      {
        title: 'Commencer par la base',
        action: 'Placez le riz ou la base choisie au centre de la composition.',
        observe: 'Elle doit accompagner les autres éléments sans rivaliser avec eux.',
        cue: 'Vous pouvez déjà imaginer plusieurs bouchées différentes autour de cette base.',
        success: 'Le repas possède un point d’ancrage simple.'
      },
      {
        title: 'Ajouter un plat chaud principal',
        action: 'Choisissez un plat qui apporte l’essentiel de la richesse ou de la sauce.',
        observe: 'Évitez d’ajouter immédiatement un second élément aussi riche.',
        cue: 'Chaque plat a sa place et le repas n’est pas trop chargé.',
        success: 'Le plat chaud apporte le caractère sans saturer l’ensemble.'
      },
      {
        title: 'Ajouter des légumes ou des herbes fraîches',
        action: 'Ajoutez un élément cru, herbacé, croquant ou acidulé.',
        observe: 'Goûtez une bouchée avec puis sans cet élément.',
        cue: 'Les légumes et les herbes apportent de la fraîcheur à la bouchée.',
        success: 'Le repas gagne en variété sans nécessiter un autre plat complet.'
      },
      {
        title: 'Laisser le condiment à part',
        action: 'Servez le condiment séparément et testez plusieurs dosages.',
        observe: 'Chaque personne peut ajuster une bouchée sans modifier tout le plat.',
        cue: 'Le condiment améliore une bouchée mais reste facultatif.',
        success: 'La table permet plusieurs équilibres à partir des mêmes préparations.'
      }
    ],
    relatedRecipes: ['amok-trey', 'lok-lak', 'bai-sach-chrouk', 'prahok-ktis'],
    glossarySlugs: ['riz-jasmin', 'amok', 'lok-lak']
  }
];

export function getWorkshopsForRecipe(recipeSlug: string) {
  return workshops.filter((workshop) => workshop.relatedRecipes.includes(recipeSlug));
}
