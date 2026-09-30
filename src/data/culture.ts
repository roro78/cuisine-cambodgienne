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

const tourismGuide = 'https://tourismcambodia.org/public/index.php/official-activities/new-beginnings-a-gourmet-guide-to-cambodia';

export const cultureArticles: CultureArticle[] = [
  {
    slug: 'poivre-de-kampot',
    title: 'Poivre de Kampot : un produit lié à son territoire',
    eyebrow: 'Territoires',
    intro: 'Comprendre pourquoi le poivre de Kampot est plus qu’un simple assaisonnement : son nom, son origine et ses usages sont liés à un territoire précis du sud du Cambodge.',
    seoDescription: 'Poivre de Kampot : origine, indication géographique, profils vert, noir, rouge et blanc, usages avec le crabe, les produits de la mer et le lok lak.',
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
        title: 'Vert, noir, rouge, blanc : quatre façons de le découvrir',
        paragraphs: [
          'Le stade de maturité et le traitement changent profondément le profil aromatique. Le vert frais est végétal et juteux ; le noir développe davantage de chaleur ; le rouge est plus mûr et fruité ; le blanc se montre plus direct.',
          'En cuisine, chaque maturité apporte quelque chose de différent. Le plus simple est souvent le meilleur : choisir le poivre selon le plat et le moudre au dernier moment pour garder tout son parfum.'
        ]
      },
      {
        title: 'Kampot, Kep et les produits de la mer',
        paragraphs: [
          'Dans le sud du Cambodge, le poivre accompagne naturellement les produits de la mer, notamment le crabe. À Kep et Kampot, cette association est devenue emblématique : peu d’ingrédients, mais des produits très parfumés et très frais.',
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
    seoDescription: 'Kroeung cambodgien : comprendre cette famille de pâtes aromatiques, le rôle de la citronnelle, du galanga, du curcuma et du combava et le geste du mortier.',
    readingTime: '6 min',
    sections: [
      {
        title: 'Une même famille, plusieurs recettes',
        paragraphs: [
          'Le terme kroeung désigne différentes pâtes d’herbes, de racines et d’épices utilisées comme fondation aromatique. Citronnelle, galanga, curcuma, combava, ail ou échalote peuvent entrer dans leur composition selon le plat.',
          'La couleur et le parfum changent selon les ingrédients utilisés. Il n’existe donc pas une seule formule à apprendre par cœur : mieux vaut comprendre le rôle de chaque aromate et ajuster selon le plat.'
        ]
      },
      {
        title: 'Le geste compte autant que la liste',
        paragraphs: [
          'Couper finement puis piler progressivement modifie la texture et permet aux fibres et aux huiles aromatiques de se mélanger intimement. Les ingrédients les plus durs sont généralement travaillés avant les plus tendres.',
          'C’est pour cela que le geste compte autant que les ingrédients. Un kroeung bien pilé parfume le plat de façon régulière et évite de retrouver des fibres trop dures en bouche.'
        ]
      },
      {
        title: 'Sentir avant de cuire',
        paragraphs: [
          'Un bon repère consiste à sentir la pâte avant qu’elle ne touche la casserole. La citronnelle doit être nette, le galanga présent sans dominer et le combava rester précis.',
          'À la cuisson, les parfums deviennent plus doux et se mêlent davantage. C’est ce qui donne au kroeung cette saveur chaude, fraîche et très reconnaissable dans de nombreux plats.'
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
    title: 'Amok : comprendre ce qui fait sa texture et son parfum',
    eyebrow: 'Plats',
    intro: 'L’amok repose sur quelques éléments simples : un kroeung parfumé, du lait de coco et une cuisson douce qui garde le poisson tendre.',
    seoDescription: 'Amok cambodgien : comprendre le rôle du kroeung, du lait de coco et de la cuisson vapeur pour réussir une texture liée, parfumée et encore souple.',
    readingTime: '5 min',
    sections: [
      {
        title: 'Une préparation liée et parfumée',
        paragraphs: [
          'Dans l’amok de poisson, le kroeung apporte les parfums, le lait de coco donne de l’onctuosité et la cuisson douce permet à la préparation de prendre sans dessécher le poisson.',
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
          'Les variantes sont nombreuses. Une fois que l’on comprend la texture recherchée et l’équilibre des saveurs, on peut adapter la recette beaucoup plus facilement.'
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
    intro: 'À Kep, le marché, les produits de la mer et le poivre de Kampot donnent envie de cuisiner simplement, avec ce qui est frais et plein de goût.',
    seoDescription: 'Kep au Cambodge : marché, crabe, produits de la mer et poivre de Kampot, pour comprendre une cuisine fondée sur la fraîcheur, le terroir et les cuissons courtes.',
    readingTime: '5 min',
    sections: [
      {
        title: 'Le marché comme point de départ',
        paragraphs: [
          'Quand on cuisine avec des produits frais, le marché donne souvent l’idée du repas. Poissons, crustacés, herbes, fruits et légumes changent selon la saison et les arrivages.',
          'Cela donne envie de cuisiner simplement : une cuisson juste, quelques aromates et un assaisonnement bien dosé suffisent souvent quand le produit est bon.'
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
          'Choisir de bons produits change tout. Ensuite, il suffit d’ajuster le sel, l’acidité, les aromates et la cuisson pour les mettre en valeur.',
          'C’est une belle façon de découvrir la cuisine cambodgienne : commencer par regarder, sentir et goûter avant de vouloir compliquer les recettes.'
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
    seoDescription: 'Prahok cambodgien : fermentation, umami, dosage et usages culinaires pour comprendre ce condiment essentiel de la cuisine khmère au-delà de son odeur.',
    readingTime: '5 min',
    sections: [
      {
        title: 'Une saveur qui dépasse l’odeur',
        paragraphs: [
          'À l’ouverture, le prahok peut impressionner par son odeur. En petite quantité dans un plat, il apporte surtout du sel, de l’umami et une saveur fermentée qui donne beaucoup de caractère.',
          'À la cuisson, son goût devient plus doux et se mêle mieux au coco, aux aromates, aux légumes ou à la viande.'
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
          'Pour découvrir le prahok, commencez avec des légumes croquants, une sauce au coco ou un plat mijoté : ce sont des associations faciles à apprécier.',
          'La fraîcheur des légumes et des herbes équilibre très bien son goût fermenté, surtout quand on n’a pas l’habitude de le manger.'
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
    seoDescription: 'Comment composer un repas cambodgien : rôle du riz, plats chauds, légumes, herbes, sauces et condiments pour construire une table équilibrée et gourmande.',
    readingTime: '5 min',
    sections: [
      {
        title: 'Le riz comme point d’équilibre',
        paragraphs: [
          'Le riz n’est pas un simple accompagnement neutre. Il absorbe les sauces, calme le sel ou le piment et permet de passer d’une bouchée très parfumée à une autre plus douce.',
          'Penser le riz avec le plat aide à mieux doser les assaisonnements : une sauce destinée à être mangée avec du riz peut sembler trop intense si on la goûte seule.'
        ]
      },
      {
        title: 'Associer des goûts et des textures différents',
        paragraphs: [
          'Un repas est plus agréable quand les plats se complètent. Un plat chaud et généreux peut être servi avec des crudités, des herbes fraîches ou un condiment acidulé.',
          'Passer d’une bouchée chaude à quelque chose de frais, de doux à acidulé, rend le repas plus léger et donne envie de goûter à tout.'
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
