export interface CultureArticle {
  slug: string;
  title: string;
  eyebrow: string;
  intro: string;
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
  }
];
