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

const tourismGuide = 'https://tourismcambodia.org/public/index.php/official-activities/new-beginnings-a-gourmet-guide-to-cambodia';

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
        title: 'Vert, noir, rouge, blanc : quatre lectures du même poivre',
        paragraphs: [
          'Le stade de maturité et le traitement changent profondément le profil aromatique. Le vert frais est végétal et juteux ; le noir développe davantage de chaleur ; le rouge est plus mûr et fruité ; le blanc se montre plus direct.',
          'En cuisine, cette diversité permet de choisir le poivre comme on choisirait une herbe ou une acidité. Le geste le plus simple reste souvent le meilleur : moudre au dernier moment pour conserver les parfums.'
        ]
      },
      {
        title: 'Kampot, Kep et les produits de la mer',
        paragraphs: [
          'Dans le sud du Cambodge, le poivre est naturellement associé aux produits de la mer et notamment aux préparations de crabe. Cette proximité entre terroir, marché et cuisine explique pourquoi le poivre peut devenir le cœur d’un plat.',
          'À la maison, on peut retrouver cette logique avec un poisson, des crevettes ou un bœuf sauté : peu d’ingrédients, une cuisson juste, puis le poivre ajouté suffisamment tard pour rester expressif.'
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
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: tourismGuide }
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
          'Le terme kroeung désigne différentes pâtes d’herbes, de racines et d’épices utilisées comme fondation aromatique. Citronnelle, galanga, curcuma, combava, ail ou échalote peuvent entrer dans leur composition selon le plat.',
          'La couleur et le profil aromatique changent avec les ingrédients dominants. L’important est donc moins de chercher une formule unique que de comprendre la logique de construction.'
        ]
      },
      {
        title: 'Le geste compte autant que la liste',
        paragraphs: [
          'Couper finement puis piler progressivement modifie la texture et permet aux fibres et aux huiles aromatiques de se mélanger intimement. Les ingrédients les plus durs sont généralement travaillés avant les plus tendres.',
          'Cette étape explique pourquoi le kroeung est autant une technique de base qu’un mélange d’ingrédients. Une pâte bien travaillée parfume le plat de façon homogène et évite les fibres désagréables en bouche.'
        ]
      },
      {
        title: 'Sentir avant de cuire',
        paragraphs: [
          'Un bon repère consiste à sentir la pâte avant qu’elle ne touche la casserole. La citronnelle doit être nette, le galanga présent sans dominer et le combava rester précis.',
          'Après cuisson, les notes les plus vives s’arrondissent. C’est ce passage du frais au chaud qui donne au kroeung sa profondeur et permet de comprendre pourquoi il structure autant de plats.'
        ]
      }
    ],
    image: '/images/cuisine/kroeung-1600.webp',
    imageAlt: 'Plat cambodgien préparé avec du kroeung',
    imageWidth: 5184,
    imageHeight: 3456,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — glossaire gastronomique', url: tourismGuide }
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
          'Dans l’amok de poisson, le kroeung construit la base aromatique, le lait de coco arrondit l’ensemble et la cuisson douce permet à la préparation de prendre sans devenir sèche.',
          'Le résultat attendu n’est pas celui d’un curry très liquide : la préparation doit garder une texture souple, presque tremblante, qui enrobe le poisson.'
        ]
      },
      {
        title: 'Pourquoi la vapeur change tout',
        paragraphs: [
          'Une chaleur douce et régulière aide les œufs et le coco à lier la préparation progressivement. Une cuisson trop forte resserre rapidement la texture et peut séparer les matières grasses.',
          'La vapeur est donc moins un effet spectaculaire qu’un outil de précision : elle permet d’obtenir une cuisson régulière jusque dans les portions épaisses.'
        ]
      },
      {
        title: 'Ce qu’il faut retenir en cuisine',
        paragraphs: [
          'Goûter la base avant d’ajouter le poisson, travailler un kroeung assez fin et arrêter la cuisson dès que la préparation est prise sont trois repères simples pour progresser.',
          'Les variantes sont nombreuses ; comprendre cette architecture permet d’ajuster la recette plus intelligemment que de suivre une liste au gramme près.'
        ]
      }
    ],
    image: '/images/cuisine/amok-alt-1600.webp',
    imageAlt: 'Portions d’amok trei cambodgien présentées dans des feuilles',
    imageWidth: 1836,
    imageHeight: 4080,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: tourismGuide }
    ]
  },
  {
    slug: 'kep-marche-crabe-poivre',
    title: 'Kep : quand le marché rencontre le poivre et la mer',
    eyebrow: 'Marchés',
    intro: 'À Kep, produits de la mer, marché et poivre de Kampot racontent une cuisine qui naît d’abord de ce qui est frais et disponible.',
    sections: [
      {
        title: 'Le marché comme point de départ',
        paragraphs: [
          'Dans une cuisine fortement liée aux produits frais, le marché n’est pas seulement un lieu d’achat : il décide souvent de ce que l’on va cuisiner. Poissons, crustacés, herbes, fruits et légumes imposent leur saison et leur qualité.',
          'Cette logique encourage des cuissons courtes et des assaisonnements précis. Quand le produit est bon, il n’a pas besoin d’être noyé sous une sauce compliquée.'
        ]
      },
      {
        title: 'Crabe et poivre : une association devenue emblématique',
        paragraphs: [
          'La région de Kep est connue pour ses produits de la mer et sa proximité avec Kampot. L’association du crabe avec le poivre frais résume bien cette cuisine : un produit principal identifiable et un condiment local très expressif.',
          'Le même principe fonctionne à la maison avec crevettes ou poisson : cuire juste, garder le jus du produit et ajouter le poivre suffisamment tard pour qu’il reste vivant.'
        ]
      },
      {
        title: 'Ce que l’on peut apprendre de cette cuisine',
        paragraphs: [
          'Acheter moins d’ingrédients mais les choisir mieux change la façon de cuisiner. On commence par le produit, puis on construit autour de lui l’acidité, le sel, les aromates et la chaleur.',
          'C’est une bonne porte d’entrée dans la cuisine cambodgienne : apprendre à observer et goûter avant de chercher des recettes de plus en plus complexes.'
        ]
      }
    ],
    image: '/images/cuisine/kep-market-1600.webp',
    imageAlt: 'Marché de Kep au Cambodge avec produits frais',
    imageWidth: 1600,
    imageHeight: 1067,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: tourismGuide },
      { label: 'OMPI — Poivre de Kampot', url: 'https://www.wipo.int/fr/web/lisbon-system/w/news/2021/news_0001' }
    ]
  },
  {
    slug: 'prahok-fermentation-umami',
    title: 'Prahok : comprendre la fermentation et l’umami',
    eyebrow: 'Fermentation',
    intro: 'Le prahok est souvent présenté uniquement comme un condiment très puissant. En cuisine, son intérêt est surtout la profondeur salée et fermentée qu’il apporte.',
    sections: [
      {
        title: 'Une saveur qui dépasse l’odeur',
        paragraphs: [
          'À l’ouverture, le prahok peut sembler impressionnant. Mais son rôle culinaire apparaît surtout quand il est dosé dans un ensemble : il renforce la profondeur et donne une sensation de plat plus complet.',
          'La cuisson arrondit certaines notes et permet à la fermentation de se fondre avec coco, aromates, légumes ou viande.'
        ]
      },
      {
        title: 'Le dosage comme apprentissage',
        paragraphs: [
          'Le prahok n’a pas une salinité identique d’un produit à l’autre. Le meilleur réflexe consiste donc à commencer par une quantité modeste, goûter, puis décider si le plat a réellement besoin de plus.',
          'Cette méthode évite l’erreur la plus fréquente : ajouter prahok, sauce de poisson et sel sans tenir compte de leur rôle commun.'
        ]
      },
      {
        title: 'Avec quoi le découvrir',
        paragraphs: [
          'Pour apprivoiser le prahok, les légumes crus ou croquants, les sauces à base de coco et les préparations mijotées sont de bons terrains d’apprentissage.',
          'Le contraste entre fraîcheur végétale et fermentation puissante rend son intérêt beaucoup plus évident que lorsqu’on le goûte seul.'
        ]
      }
    ],
    image: '/images/cuisine/prahok-1600.webp',
    imageAlt: 'Prahok ktis servi avec des légumes',
    imageWidth: 3000,
    imageHeight: 4000,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: tourismGuide }
    ]
  },
  {
    slug: 'construire-repas-cambodgien',
    title: 'Comment se construit un repas cambodgien',
    eyebrow: 'À table',
    intro: 'Riz, plat principal, légumes, herbes, sauces et condiments : comprendre la table aide à cuisiner des recettes qui fonctionnent ensemble.',
    sections: [
      {
        title: 'Le riz comme point d’équilibre',
        paragraphs: [
          'Le riz n’est pas un simple accompagnement neutre. Il absorbe les sauces, calme le sel ou le piment et permet de passer d’une bouchée très parfumée à une autre plus douce.',
          'Penser le riz avec le plat aide à mieux doser les assaisonnements : une sauce destinée à être mangée avec du riz peut sembler trop intense si on la goûte seule.'
        ]
      },
      {
        title: 'Contraster plutôt que tout répéter',
        paragraphs: [
          'Un repas devient plus intéressant quand les éléments ne racontent pas tous la même chose. Un plat chaud et riche peut être accompagné de crudités, d’herbes fraîches ou d’un condiment acide.',
          'Cette alternance de chaud, frais, doux, salé et acidulé donne du rythme à la table et évite la sensation de lourdeur.'
        ]
      },
      {
        title: 'Composer à la maison',
        paragraphs: [
          'Pour commencer simplement : un riz jasmin, un plat principal comme le lok lak ou l’amok, des légumes frais et un condiment suffisent. Inutile de multiplier les préparations.',
          'L’objectif est de créer plusieurs bouchées possibles : un peu de riz, davantage de sauce, une herbe fraîche, un trait d’acidité. C’est cette liberté qui rend le repas vivant.'
        ]
      }
    ],
    image: '/images/cuisine/amok-1600.webp',
    imageAlt: 'Repas cambodgien avec amok, riz et feuilles de bananier',
    imageWidth: 3888,
    imageHeight: 2592,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: tourismGuide }
    ]
  }
];
