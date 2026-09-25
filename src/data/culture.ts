export interface CultureArticle {
  slug: string;
  title: string;
  eyebrow: string;
  intro: string;
  seoDescription: string;
  readingTime: string;
  sections: { title: string; paragraphs: string[] }[];
  sources: { label: string; url: string }[];
  image: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  imageWidths: number[];
}

export const cultureArticles: CultureArticle[] = [
  {
    slug: 'poivre-de-kampot',
    title: 'Poivre de Kampot : un produit lié à son territoire',
    eyebrow: 'Territoires',
    intro: 'Comprendre pourquoi le poivre de Kampot est plus qu’un simple assaisonnement : son nom, son origine et ses usages sont liés à un territoire précis du sud du Cambodge.',
    seoDescription: 'Poivre de Kampot : origine, indication géographique, différences entre vert, noir, rouge et blanc, usages culinaires et lien avec Kep.',
    readingTime: '6 min',
    sections: [
      {
        title: 'Une indication géographique',
        paragraphs: [
          'Le nom « Poivre de Kampot » désigne un produit dont la réputation et les caractéristiques sont liées à son origine géographique. Le Cambodge l’a protégé comme indication géographique et il est aussi enregistré dans le système international de Lisbonne.',
          'Cette protection distingue le produit d’un poivre générique : l’origine, les méthodes de production et le cahier des charges font partie de son identité.'
        ]
      },
      {
        title: 'Vert, noir, rouge ou blanc',
        paragraphs: [
          'La couleur ne raconte pas seulement l’apparence du grain : elle correspond à une maturité et à un traitement différents. Le poivre vert frais est végétal et très vif, le noir plus chaud, le rouge plus mûr et fruité, le blanc plus direct.',
          'En cuisine, ces profils invitent à goûter le poivre comme on goûterait un ingrédient à part entière, plutôt que de le réduire à un simple geste de moulin.'
        ]
      },
      {
        title: 'Kampot, Kep et les produits de la mer',
        paragraphs: [
          'La proximité de Kampot et de Kep explique la présence fréquente du poivre aux côtés des produits de la mer dans les récits gastronomiques de la région.',
          'Le crabe au poivre vert est devenu l’une des associations les plus connues : le piquant frais du poivre répond à la douceur iodée du crabe sans demander une sauce lourde.'
        ]
      },
      {
        title: 'Comment le traiter à la maison',
        paragraphs: [
          'Le poivre sec gagne à être concassé au dernier moment. Une cuisson longue émousse son parfum ; il est souvent plus intéressant d’en ajouter une partie en fin de cuisson.',
          'Avec le poivre vert frais, on peut garder les grappes entières ou légèrement écraser les grains pour libérer leur parfum dans une sauce courte.'
        ]
      }
    ],
    image: '/images/cuisine/kampot-1600.webp',
    imageAlt: 'Grappes de poivre vert de Kampot sur le plant',
    imageWidth: 6000,
    imageHeight: 4000,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'OMPI — Système de Lisbonne et Poivre de Kampot', url: 'https://www.wipo.int/fr/web/lisbon-system/w/news/2021/news_0001' },
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: 'https://tourismcambodia.org/public/index.php/official-activities/new-beginnings-a-gourmet-guide-to-cambodia' }
    ]
  },
  {
    slug: 'comprendre-le-kroeung',
    title: 'Kroeung : comprendre une famille de pâtes aromatiques',
    eyebrow: 'Gestes',
    intro: 'Le kroeung n’est pas une seule recette figée. C’est une famille de pâtes d’aromates qui forme la base de nombreux plats cambodgiens.',
    seoDescription: 'Kroeung cambodgien : comprendre les aromates, le rôle du mortier, les différentes pâtes et les gestes essentiels de cette base de la cuisine khmère.',
    readingTime: '6 min',
    sections: [
      {
        title: 'Une base, plusieurs expressions',
        paragraphs: [
          'Le terme kroeung désigne différentes pâtes d’herbes et d’épices utilisées comme fondation aromatique. Citronnelle, galanga, curcuma, combava, ail ou échalote peuvent entrer dans leur composition selon le plat.',
          'La couleur et le profil aromatique changent avec les ingrédients dominants. L’important est donc moins de chercher une formule unique que de comprendre la logique de construction.'
        ]
      },
      {
        title: 'Le geste compte autant que la liste',
        paragraphs: [
          'Le fait de couper finement puis de piler progressivement modifie la texture et permet aux fibres et aux huiles aromatiques de se mélanger intimement.',
          'Cette étape explique pourquoi le kroeung est souvent traité comme une technique de base autant que comme un simple mélange d’ingrédients.'
        ]
      },
      {
        title: 'Pourquoi le mortier change le résultat',
        paragraphs: [
          'Le mortier écrase les fibres et les aromates au lieu de simplement les couper. Le parfum obtenu est plus lié, et la pâte garde une texture qui se mêle bien à la cuisson.',
          'Un mixeur reste possible à la maison, mais il vaut mieux travailler par impulsions et éviter de noyer la préparation dans de l’eau.'
        ]
      },
      {
        title: 'Apprendre à le reconnaître',
        paragraphs: [
          'Un kroeung prêt à cuisiner doit sentir très fort avant même de toucher la poêle. La citronnelle, le galanga et le combava doivent rester identifiables sans qu’un seul arôme écrase tous les autres.',
          'Cette lecture au nez est un bon exercice pour apprendre la cuisine khmère : on corrige la pâte avant la cuisson plutôt que d’essayer de rattraper le plat à la fin.'
        ]
      }
    ],
    image: '/images/cuisine/kroeung-1600.webp',
    imageAlt: 'Plat cambodgien préparé avec du kroeung',
    imageWidth: 5184,
    imageHeight: 3456,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — glossaire gastronomique', url: 'https://tourismcambodia.org/public/index.php/official-activities/new-beginnings-a-gourmet-guide-to-cambodia' }
    ]
  },
  {
    slug: 'comprendre-amok',
    title: 'Amok : comprendre la logique du plat',
    eyebrow: 'Plats',
    intro: 'Derrière le nom Amok se trouve une logique de cuisson douce, de kroeung et de texture liée qui aide à mieux réussir le plat.',
    seoDescription: 'Amok cambodgien : comprendre le rôle du kroeung, du lait de coco, de la vapeur et de la texture pour réussir ce plat emblématique.',
    readingTime: '5 min',
    sections: [
      {
        title: 'Une préparation liée et parfumée',
        paragraphs: [
          'Dans les descriptions culinaires cambodgiennes, l’amok de poisson associe poisson, œuf et kroeung avant une cuisson douce à la vapeur.',
          'Le résultat attendu n’est pas celui d’un curry très liquide : la préparation doit prendre tout en conservant une texture souple.'
        ]
      },
      {
        title: 'Le rôle de chaque élément',
        paragraphs: [
          'Le kroeung apporte la structure aromatique, le lait de coco arrondit l’ensemble et les œufs participent à la prise. Le poisson, lui, doit rester tendre.',
          'La feuille de bananier n’est pas qu’un décor lorsqu’elle sert de contenant : elle participe à la mise en scène du plat et supporte bien la cuisson vapeur.'
        ]
      },
      {
        title: 'La cuisson est le vrai point délicat',
        paragraphs: [
          'Une chaleur trop forte resserre la texture et peut sécher le poisson. Une vapeur régulière et douce permet d’obtenir une préparation prise mais encore moelleuse.',
          'Le bon repère n’est donc pas seulement un nombre de minutes : il faut regarder la texture au centre du ramequin ou du panier.'
        ]
      },
      {
        title: 'Ce qu’il faut retenir à la maison',
        paragraphs: [
          'Goûter la base avant d’ajouter le poisson permet d’ajuster sel, sucre et intensité du kroeung.',
          'Les variantes sont nombreuses ; comprendre cette architecture permet d’adapter la recette sans perdre l’équilibre entre aromates, coco et cuisson douce.'
        ]
      }
    ],
    image: '/images/cuisine/amok-alt-1600.webp',
    imageAlt: 'Portions d’amok trei cambodgien présentées dans des feuilles',
    imageWidth: 1836,
    imageHeight: 4080,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: 'https://tourismcambodia.org/public/index.php/official-activities/new-beginnings-a-gourmet-guide-to-cambodia' }
    ]
  },
  {
    slug: 'kep-crabe-poivre',
    title: 'Kep : quand le crabe rencontre le poivre vert',
    eyebrow: 'Kep & Kampot',
    intro: 'À Kep, la cuisine des produits de la mer rencontre naturellement le poivre de Kampot voisin : une association simple, vive et devenue emblématique.',
    seoDescription: 'Kep et le crabe au poivre vert : comprendre l’association entre produits de la mer et poivre de Kampot dans la cuisine côtière cambodgienne.',
    readingTime: '5 min',
    sections: [
      {
        title: 'Une cuisine tournée vers la mer',
        paragraphs: [
          'Kep est connue pour ses produits de la mer et son marché au crabe. Dans cette cuisine côtière, la fraîcheur du produit compte davantage qu’une accumulation de sauces.',
          'Le crabe, les crevettes et d’autres produits marins se prêtent bien aux cuissons courtes et aux assaisonnements aromatiques.'
        ]
      },
      {
        title: 'Pourquoi le poivre vert fonctionne si bien',
        paragraphs: [
          'Le poivre vert frais apporte à la fois chaleur, fraîcheur végétale et parfum. Il accompagne la douceur du crabe sans masquer son goût.',
          'Les grappes peuvent cuire directement dans la sauce ; certains grains s’écrasent alors légèrement et parfument l’ensemble.'
        ]
      },
      {
        title: 'Reproduire l’esprit du plat',
        paragraphs: [
          'À la maison, l’idée à retenir est celle d’une sauce courte : ail, matière grasse, poivre vert, un peu d’assaisonnement et une cuisson rapide.',
          'Si le poivre vert frais est introuvable, un bon poivre noir de Kampot fraîchement concassé donnera un résultat différent mais gardera la logique aromatique.'
        ]
      }
    ],
    image: '/images/cuisine/kep-market-1600.webp',
    imageAlt: 'Marché aux produits de la mer à Kep au Cambodge',
    imageWidth: 4608,
    imageHeight: 3072,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: 'https://tourismcambodia.org/public/index.php/official-activities/new-beginnings-a-gourmet-guide-to-cambodia' },
      { label: 'OMPI — Poivre de Kampot', url: 'https://www.wipo.int/fr/web/lisbon-system/w/news/2021/news_0001' }
    ]
  },
  {
    slug: 'marches-et-cuisine-cambodgienne',
    title: 'Marchés cambodgiens : comprendre la cuisine par les produits frais',
    eyebrow: 'Cuisine quotidienne',
    intro: 'Herbes, poissons, légumes, racines et condiments : regarder un marché aide à comprendre pourquoi la cuisine cambodgienne repose autant sur la fraîcheur et les préparations du jour.',
    seoDescription: 'Marchés cambodgiens : herbes fraîches, poissons, riz, légumes et condiments pour comprendre la logique quotidienne de la cuisine khmère.',
    readingTime: '5 min',
    sections: [
      {
        title: 'Les aromates sont au premier plan',
        paragraphs: [
          'Citronnelle, galanga, curcuma, feuilles parfumées, ail, échalotes et herbes fraîches reviennent dans de nombreuses préparations.',
          'Ces ingrédients sont souvent achetés en petites quantités et travaillés rapidement, ce qui explique l’importance du mortier, de la coupe fine et des préparations fraîches.'
        ]
      },
      {
        title: 'Poisson, riz et légumes structurent le repas',
        paragraphs: [
          'Les plats ne se pensent pas toujours comme une assiette unique. Riz, légumes, soupe, poisson, viande ou condiments peuvent se compléter sur la table.',
          'Cette logique aide à comprendre pourquoi certains plats sont très parfumés ou salins : ils sont destinés à être mangés avec du riz et d’autres éléments plus doux.'
        ]
      },
      {
        title: 'Observer avant de cuisiner',
        paragraphs: [
          'Pour apprendre, un bon réflexe consiste à regarder les textures et les familles d’ingrédients : frais, fermenté, acide, aromatique, coco, grillé ou vapeur.',
          'Cette lecture donne des repères plus utiles qu’une simple liste de recettes et aide à improviser ensuite avec ce que l’on trouve chez soi.'
        ]
      }
    ],
    image: '/images/cuisine/kep-market-1600.webp',
    imageAlt: 'Marché cambodgien avec produits frais et cuisine du quotidien',
    imageWidth: 4608,
    imageHeight: 3072,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: 'https://tourismcambodia.org/public/index.php/official-activities/new-beginnings-a-gourmet-guide-to-cambodia' }
    ]
  },
  {
    slug: 'prahok-fermentation',
    title: 'Prahok : la fermentation qui donne de la profondeur',
    eyebrow: 'Fermentation',
    intro: 'Le prahok est souvent résumé à son odeur. En cuisine, il faut surtout comprendre son rôle : sel, umami, fermentation et longueur en bouche.',
    seoDescription: 'Prahok cambodgien : comprendre le poisson fermenté, son rôle dans la cuisine khmère, son dosage, ses associations et la façon dont la cuisson transforme son goût.',
    readingTime: '5 min',
    sections: [
      {
        title: 'Un condiment, pas seulement une odeur',
        paragraphs: [
          'Le prahok est un produit de poisson fermenté utilisé dans différentes préparations cambodgiennes. Son intensité varie selon le produit, sa texture et la façon dont il est incorporé au plat.',
          'Cru, son parfum peut sembler très puissant. Mélangé à d’autres ingrédients et cuit, il devient plus rond et apporte surtout de la profondeur.'
        ]
      },
      {
        title: 'Sel, umami et fermentation',
        paragraphs: [
          'Le prahok remplit plusieurs fonctions à la fois : il sale, renforce l’umami et ajoute une note fermentée que l’on n’obtient pas avec une simple sauce salée.',
          'C’est pour cette raison qu’il vaut mieux doser les autres assaisonnements après l’avoir ajouté, et non avant.'
        ]
      },
      {
        title: 'Le contraste avec les éléments frais',
        paragraphs: [
          'Les préparations à base de prahok gagnent souvent à être accompagnées de légumes croquants, d’herbes ou d’agrumes. La fraîcheur équilibre sa richesse et rend le contraste plus lisible.',
          'Dans le prahok ktis, par exemple, le lait de coco et les légumes crus créent une opposition entre rondeur, fermentation et fraîcheur.'
        ]
      },
      {
        title: 'Comment l’aborder à la maison',
        paragraphs: [
          'Commencer par une petite quantité, chauffer la préparation et goûter avant de corriger. Le bon dosage n’est pas celui qui fait sentir le prahok seul, mais celui qui donne plus de profondeur à tout le plat.',
          'Pour une première découverte, une préparation cuite et associée au coco ou à des aromates est souvent plus facile à lire qu’un usage très brut.'
        ]
      }
    ],
    image: '/images/cuisine/prahok-1600.webp',
    imageAlt: 'Prahok ktis cambodgien servi avec des légumes frais',
    imageWidth: 3000,
    imageHeight: 4000,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: 'https://tourismcambodia.org/public/index.php/official-activities/new-beginnings-a-gourmet-guide-to-cambodia' }
    ]
  },
  {
    slug: 'marches-herbes-cuisine-khmere',
    title: 'Herbes, racines et marchés : là où commence le goût khmer',
    eyebrow: 'Produits frais',
    intro: 'Avant la casserole, il y a les bottes de citronnelle, le galanga, les feuilles parfumées, les légumes et les herbes : une cuisine qui commence par des produits très frais.',
    seoDescription: 'Herbes et marchés cambodgiens : citronnelle, galanga, combava, basilic, légumes et produits frais pour comprendre la construction des saveurs de la cuisine khmère.',
    readingTime: '5 min',
    sections: [
      {
        title: 'Une cuisine d’aromates frais',
        paragraphs: [
          'Une grande partie du parfum de la cuisine cambodgienne vient d’ingrédients frais : citronnelle, galanga, curcuma, feuilles de combava, ail, échalotes et herbes.',
          'Ils ne jouent pas le même rôle que des épices sèches. Leur eau, leurs fibres et leurs huiles aromatiques influencent à la fois la texture et le parfum.'
        ]
      },
      {
        title: 'Le marché comme garde-manger',
        paragraphs: [
          'Les marchés réunissent poissons, viandes, légumes, racines, fruits, herbes et condiments qui permettent de cuisiner rapidement avec ce qui est disponible.',
          'Observer ces produits aide à comprendre pourquoi de nombreuses recettes reposent sur des préparations fraîches plutôt que sur de longues listes d’épices sèches.'
        ]
      },
      {
        title: 'Couper, froisser, piler',
        paragraphs: [
          'Chaque aromate demande un geste différent : la citronnelle se coupe très finement, les feuilles se froissent ou s’émincent, les racines se pilent et les herbes s’ajoutent souvent à la fin.',
          'Apprendre ces gestes est une manière directe de comprendre le goût, car ils déterminent ce qui sera libéré pendant la cuisson.'
        ]
      },
      {
        title: 'Ce que cela change à la maison',
        paragraphs: [
          'Mieux vaut acheter peu d’aromates mais les utiliser très frais. Un petit kroeung préparé le jour même donnera souvent plus de caractère qu’une grande quantité de pâte aromatique conservée trop longtemps.',
          'Quand certains produits sont difficiles à trouver, l’objectif est de préserver la logique du plat : fraîcheur, équilibre et parfum, plutôt que de multiplier les substituts au hasard.'
        ]
      }
    ],
    image: '/images/cuisine/kep-market-1600.webp',
    imageAlt: 'Marché cambodgien et produits frais utilisés en cuisine khmère',
    imageWidth: 4608,
    imageHeight: 3072,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: 'https://tourismcambodia.org/public/index.php/official-activities/new-beginnings-a-gourmet-guide-to-cambodia' }
    ]
  }
];