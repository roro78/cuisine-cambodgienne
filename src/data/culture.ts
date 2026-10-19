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
  gallery?: { image: string; imageAlt: string; caption: string; credit: string; source: string; width: number; height: number }[];
}

const tourismGuide = 'https://tourismcambodia.org/public/index.php/official-activities/new-beginnings-a-gourmet-guide-to-cambodia';

export const cultureArticles: CultureArticle[] = [
  {
    slug: 'le-riz-symbole-de-vie-au-cambodge',
    title: 'Le riz au Cambodge : la vie quotidienne, les rizières et un savoir-faire primé',
    eyebrow: 'Terres, familles et saveurs',
    intro: 'Dans une maison de village, sur une table de Phnom Penh ou au bord d’une rizière, le riz est bien davantage qu’un accompagnement : il nourrit, rassemble et fait vivre. Découvrons le riz cambodgien, de ses variétés parfumées aux plats du quotidien.',
    seoDescription: 'Le riz au Cambodge : place dans la vie quotidienne, riz parfumé Phka Rumduol et Malys Angkor primé en 2025, rizières, fêtes, plats au riz et savoir-faire paysan.',
    readingTime: '9 min',
    sections: [
      {
        title: 'Le riz, au cœur du quotidien cambodgien',
        paragraphs: [
          'Au Cambodge, le riz se retrouve dans des cuisines très différentes, chez les familles modestes comme dans les grandes maisons, sur les marchés, dans les cantines et au restaurant. La quantité, la variété, les plats servis autour de lui et les habitudes de table peuvent changer selon les moyens et les régions. Mais le riz demeure un point de rencontre.',
          'On le prépare souvent nature, puis on l’accompagne de poisson, d’une soupe, de légumes, d’œufs, de viande, de condiments ou d’un plat mijoté. Son goût discret n’est pas un défaut : il permet aux autres saveurs de s’exprimer. Un petit plat très relevé prend une autre dimension lorsqu’il est partagé avec du riz chaud.',
          'La FAO présente le riz comme une culture vivrière majeure du Cambodge. C’est à la fois une composante essentielle de l’alimentation et un produit agricole qui fait vivre de nombreuses familles. Il serait pourtant faux de réduire tous les repas cambodgiens à une assiette identique : les habitudes et les ressources varient.'
        ]
      },
      {
        title: 'Du petit déjeuner au dîner : mille façons de manger du riz',
        paragraphs: [
          'Le matin, le riz peut prendre la forme d’un bai sach chrouk, avec du porc grillé, ou d’un bobor, une bouillie de riz servie chaude et agrémentée selon les goûts. Au déjeuner ou au dîner, il accompagne volontiers un amok, un curry, un lok lak ou du poisson préparé simplement.',
          'Il existe aussi des plats où le riz change complètement de texture : riz sauté, riz gluant pour certaines douceurs, grains grillés ou aplatis. On le transforme en farine, en galettes ou en nouilles de riz, comme celles du num banh chok. Le riz se mange donc en grains, mais il entre aussi dans une multitude de préparations.',
          'Cuisiner cambodgien ne signifie pas recouvrir systématiquement le riz de sauce. Il peut rester bien distinct dans le bol : on alterne les bouchées et chacun dose les accompagnements à sa manière.'
        ]
      },
      {
        title: 'Derrière chaque bol, une saison et le travail des rizières',
        paragraphs: [
          'Les paysages rizicoles sont indissociables de nombreuses régions cambodgiennes, notamment les plaines irriguées par les pluies de mousson et les grands bassins fluviaux. Selon les zones, les agriculteurs sèment ou repiquent, surveillent l’eau, entretiennent les parcelles, puis récoltent, sèchent et conservent le paddy : le grain encore entouré de son enveloppe.',
          'Une récolte dépend de la pluie, de l’accès à l’eau, des semences, des coûts et du travail disponible. Le riz est donc également une question de revenus, de sécurité alimentaire et de conditions de vie. Des récoltes abondantes n’impliquent pas automatiquement une bonne rémunération pour chaque producteur.',
          'Sur le marché, on achète du riz blanchi, parfois complet ou gluant ; derrière ces sacs se trouvent des variétés, des territoires et des choix de culture. Parler du riz cambodgien, c’est aussi parler des personnes qui le produisent.'
        ]
      },
      {
        title: 'Qu’appelle-t-on « riz cambodgien » ?',
        paragraphs: [
          'Il n’existe pas un seul riz cambodgien. Le pays cultive différents types de riz : des grains longs parfumés, des riz blancs plus courants, du riz gluant et d’autres variétés adaptées aux terres et aux saisons. Leur parfum, leur texture et leur tenue à la cuisson ne sont pas identiques.',
          'Le Phka Rumduol, souvent cité sous l’orthographe Phka Romdoul, est une variété cambodgienne de riz parfumé. Le nom commercial Malys Angkor est associé à ce riz de qualité destiné notamment aux marchés d’exportation. Il ne faut pas confondre le nom de la variété, le nom utilisé sur le marché et l’ensemble des riz produits au Cambodge.',
          'Pour cuisiner, on choisira un riz parfumé à grains longs pour accompagner une sauce ou un poisson, ou un riz gluant lorsque la recette réclame cette texture. Acheter un paquet étiqueté « jasmin » ne garantit pas à lui seul une origine cambodgienne : vérifiez l’étiquette et la provenance.'
        ]
      },
      {
        title: 'Un riz récompensé sept fois au niveau mondial',
        paragraphs: [
          'En novembre 2025, lors de la World Rice Conference organisée à Phnom Penh par The Rice Trader, le Malys Angkor cambodgien (variété Phka Rumduol) a reçu le titre « World’s Best Rice 2025 ». Selon l’agence de presse cambodgienne AKP et la Fédération cambodgienne du riz, c’était la septième distinction remportée par un riz cambodgien dans ce concours, après 2012, 2013, 2014, 2018, 2022 et 2024.',
          'Ce prix valorise un riz parfumé, la qualité du grain et le savoir-faire de la filière. Ce n’est pas un classement permanent de tous les riz vendus dans le monde : il s’agit d’une récompense attribuée dans le cadre d’un concours professionnel annuel.',
          'La reconnaissance internationale est réelle, mais le véritable enjeu reste aussi très concret : produire une qualité régulière, préserver les terres et permettre aux agriculteurs de vivre convenablement de leur travail.'
        ]
      },
      {
        title: 'Le riz dans les fêtes, les gestes et la transmission',
        paragraphs: [
          'La culture du riz dépasse la cuisine. La préparation des champs et les récoltes rythment certaines activités rurales, tandis que des savoir-faire se transmettent entre générations. Les usages changent selon les régions, les familles et les époques : il n’y a pas une seule tradition uniforme.',
          'Lors de la fête de l’Eau, Bon Om Touk, l’ambok — du riz pilé ou aplati, souvent associé à la noix de coco et à la banane — rappelle que le grain peut être transformé pour des moments particuliers. Le riz relie ici le repas, le geste et la mémoire collective.'
        ]
      },
      {
        title: 'Comment découvrir le riz cambodgien chez soi ?',
        paragraphs: [
          'Commencez par comparer deux riz : un riz parfumé cambodgien clairement identifié et un riz blanc courant. Faites-les cuire séparément selon les indications de leurs emballages, sans sauce, puis sentez-les et observez leur tenue. Le parfum et la texture comptent autant que la blancheur du grain.',
          'Servez le riz avec un amok de poisson, un lok lak, un bai sach chrouk ou une soupe. Préparez aussi un petit bol de légumes frais ou de condiments : les convives pourront construire des bouchées différentes sans multiplier les plats.',
          'Pour passer de l’histoire à la pratique, retrouvez notre atelier consacré à la composition d’un repas cambodgien. Le riz y devient le point de départ de l’assiette, pas un simple détail posé à côté.'
        ]
      }
    ],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Cambodia%27s_rice_fields.jpg/1280px-Cambodia%27s_rice_fields.jpg',
    imageAlt: 'Rizières verdoyantes près de Siem Reap, au Cambodge, avec des palmiers à l’horizon',
    imageWidth: 1280,
    imageHeight: 720,
    imageWidths: [],
    gallery: [
      {
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Cambodian_farmers_planting_rice.jpg/1280px-Cambodian_farmers_planting_rice.jpg',
        imageAlt: 'Agriculteurs cambodgiens repiquant des jeunes plants de riz dans une rizière inondée',
        caption: 'Dans les rizières, le repiquage demande du temps et un travail collectif.',
        credit: 'Brad Collis · CC BY 2.0',
        source: 'https://commons.wikimedia.org/wiki/File:Cambodian_farmers_planting_rice.jpg',
        width: 1280,
        height: 851
      },
      {
        image: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Cambodia_rice.jpg',
        imageAlt: 'Épis de riz en croissance photographiés au Cambodge, au premier plan',
        caption: 'Avant d’être un grain dans le bol, le riz grandit sur une plante que cultivent les familles agricoles.',
        credit: 'Chhoukkosal · CC BY-SA 4.0 · photographie recadrée à l’affichage',
        source: 'https://commons.wikimedia.org/wiki/File:Cambodia_rice.jpg',
        width: 960,
        height: 1280
      },
      {
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Ak_Ambok.jpg/960px-Ak_Ambok.jpg',
        imageAlt: 'Ambok cambodgien dans un plat, accompagné de bananes et de noix de coco',
        caption: 'L’ambok, riz aplati associé aux moments de fête, ici servi avec de la banane et de la noix de coco.',
        credit: 'Willuconquer · CC BY-SA 4.0',
        source: 'https://commons.wikimedia.org/wiki/File:Ak_Ambok.jpg',
        width: 960,
        height: 1280
      }
    ],
    sources: [
      { label: 'FAO — Le riz et les moyens de subsistance au Cambodge', url: 'https://www.fao.org/hand-in-hand/previous-editions/hih-IF-2024/cambodia/en' },
      { label: 'FAO — Agriculture et alimentation au Cambodge', url: 'https://www.fao.org/cambodia/our-office/cambodia-at-a-glance/en' },
      { label: 'Agence Kampuchea Presse (9 novembre 2025) — Malys Angkor primé pour la septième fois', url: 'https://www.akp.gov.kh/fr/post/detail/352733' },
      { label: 'Agence Kampuchea Presse (5 janvier 2026) — Riz Phka Rumduol et exportations', url: 'https://akp.gov.kh/fr/post/detail/358182' },
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
