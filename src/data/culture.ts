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
    slug: 'le-riz-symbole-de-vie-au-cambodge',
    title: 'Le riz au Cambodge : une place au centre de la vie quotidienne',
    eyebrow: 'Cultures et paysages',
    intro: 'Dans les rizières comme à table, le riz accompagne le quotidien cambodgien. Comprendre sa place aide aussi à comprendre les plats qui l’entourent.',
    seoDescription: 'Le riz au Cambodge : aliment de base, travail des rizières, saisons et traditions autour des récoltes, avec les sources de la FAO et de l’UNESCO.',
    readingTime: '6 min',
    sections: [
      {
        title: 'Un aliment de base, bien plus qu’une garniture',
        paragraphs: [
          'Au Cambodge, le riz est au cœur de l’alimentation. La FAO le décrit comme un aliment de base, mais aussi comme une ressource essentielle pour les revenus de nombreux foyers agricoles. Son importance se voit à la fois dans les paysages, les activités rurales et les repas de chaque jour.',
          'À table, le riz sert de point d’équilibre : il accompagne les currys, les soupes, les viandes sautées et les condiments. Il permet de doser chaque bouchée, surtout lorsqu’un plat est très parfumé, pimenté ou salé.'
        ]
      },
      {
        title: 'Le rythme des rizières et des saisons',
        paragraphs: [
          'Une grande partie de la riziculture cambodgienne dépend de la saison des pluies. La FAO suit chaque année les récoltes, les conditions météorologiques et les volumes produits : ces variations ont des conséquences concrètes pour les agriculteurs et l’approvisionnement.',
          'Le riz ne raconte donc pas seulement un geste de cuisine. Il relie des terres agricoles, un climat, des variétés cultivées et le travail de nombreuses familles. La façon de cultiver change selon les régions et l’accès à l’eau.'
        ]
      },
      {
        title: 'Des traditions liées aux récoltes',
        paragraphs: [
          'Les rizières ont aussi une dimension sociale et culturelle. L’UNESCO documente, notamment au Cambodge, des jeux rituels associés aux cultures rizicoles et au début d’un nouveau cycle agricole. Ces pratiques sont liées au souhait de bonnes récoltes et à la cohésion des communautés.',
          'Il serait réducteur d’en déduire que chaque famille ou chaque village célèbre le riz de la même façon. Les pratiques diffèrent selon les lieux et les générations ; elles rappellent surtout que l’agriculture et la vie collective se rencontrent au-delà du repas.'
        ]
      },
      {
        title: 'Comprendre le riz pour mieux cuisiner cambodgien',
        paragraphs: [
          'Pour commencer chez soi, un riz jasmin bien cuit et servi chaud suffit déjà à transformer un plat. Il absorbe une sauce, tempère un condiment relevé et laisse de la place aux herbes fraîches, aux légumes et aux préparations mijotées.',
          'Avec un amok, une soupe acidulée ou un curry, pensez au riz dès le début de la préparation : l’assaisonnement d’un plat destiné à être dégusté avec du riz peut sembler intense si on le goûte seul.'
        ]
      }
    ],
    image: '/images/cuisine/v17-table-meal-1600.jpg',
    imageAlt: 'Table cambodgienne avec riz, plats chauds et accompagnements',
    imageWidth: 1600,
    imageHeight: 1067,
    imageWidths: [1600],
    sources: [
      { label: 'FAO (2024) — Le riz, culture alimentaire et ressource économique au Cambodge', url: 'https://www.fao.org/hand-in-hand/previous-editions/hih-IF-2024/cambodia/en' },
      { label: 'FAO (2026) — Situation des récoltes et du riz au Cambodge', url: 'https://www.fao.org/giews/countrybrief/country.jsp?code=KHM&lang=fr' },
      { label: 'UNESCO (2015) — Jeux rituels liés aux cultures rizicoles', url: 'https://ich.unesco.org/en/RL/tugging-rituals-and-games-01080' }
    ]
  },
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
          'La maturité et la façon dont le poivre est préparé changent nettement son goût. Le vert frais est végétal et juteux ; le noir est plus chaud ; le rouge plus mûr et fruité ; le blanc plus franc.',
          'En cuisine, chaque maturité apporte quelque chose de différent. Le plus simple est souvent le meilleur : choisir le poivre selon le plat et le moudre au dernier moment pour garder tout son parfum.'
        ]
      },
      {
        title: 'Kampot, Kep et les produits de la mer',
        paragraphs: [
          'Dans le sud du Cambodge, le poivre accompagne naturellement les produits de la mer, notamment le crabe. À Kep et Kampot, cette association est devenue emblématique : peu d’ingrédients, mais des produits très parfumés et très frais.',
          'À la maison, on peut faire la même chose avec un poisson, des crevettes ou un bœuf sauté : peu d’ingrédients, une cuisson juste et le poivre ajouté assez tard pour garder tout son parfum.'
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
          'Le terme kroeung désigne différentes pâtes d’herbes, de racines et d’épices qui servent de base parfumée à de nombreux plats. Citronnelle, galanga, curcuma, combava, ail ou échalote peuvent entrer dans leur composition selon la recette.',
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
          'La vapeur permet surtout une cuisson douce et régulière, même lorsque la préparation est assez épaisse.'
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
    imageHeight: 1334,
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
    intro: 'Le prahok est souvent présenté comme un condiment très puissant. Bien dosé, il apporte surtout du sel, de l’umami et ce goût fermenté si particulier.',
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
    title: 'L’art de composer un repas cambodgien',
    eyebrow: 'À table',
    intro: 'Riz, plat principal, légumes, herbes, sauces et condiments : comprendre la table aide à cuisiner des recettes qui fonctionnent ensemble.',
    seoDescription: 'Comment composer un repas cambodgien : rôle du riz, plats chauds, légumes, herbes, sauces et condiments pour préparer une table équilibrée et gourmande.',
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
    image: '/images/cuisine/v17-table-meal-1600.jpg',
    imageAlt: 'Table cambodgienne composée de plusieurs plats, riz, herbes et accompagnements',
    imageWidth: 1600,
    imageHeight: 1067,
    imageWidths: [1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: tourismGuide }
    ]
  }
];
