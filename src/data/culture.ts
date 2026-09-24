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
    intro: 'Pourquoi ce poivre n’est pas seulement une épice prestigieuse : son nom, ses méthodes de production et ses profils aromatiques sont liés à un terroir précis du sud du Cambodge.',
    seoDescription: 'Poivre de Kampot : histoire de l’indication géographique, terroir, poivre vert, noir, rouge et blanc, et usages dans la cuisine cambodgienne.',
    readingTime: '5 min',
    sections: [
      {
        title: 'Un nom protégé, pas un simple style de poivre',
        paragraphs: [
          'Le Poivre de Kampot est une indication géographique cambodgienne. Son identité ne repose donc pas seulement sur une variété de poivre : elle associe une origine, des pratiques de production et un cahier des charges.',
          'Cette protection permet de distinguer le produit des poivres génériques et rattache directement le goût à un territoire de Kampot et Kep.'
        ]
      },
      {
        title: 'Vert, noir, rouge, blanc : quatre façons de le goûter',
        paragraphs: [
          'Le poivre vert frais conserve un caractère végétal et vif. Le noir développe davantage de chaleur et de puissance, le rouge provient de baies plus mûres et offre un profil plus rond, tandis que le blanc est plus direct et épuré.',
          'En cuisine, ces différences permettent de choisir le poivre comme on choisirait un ingrédient principal : en fonction de la sauce, de la cuisson et de la texture du produit.'
        ]
      },
      {
        title: 'Avec le crabe, le bœuf ou simplement du citron vert',
        paragraphs: [
          'Le guide gastronomique officiel du Cambodge cite notamment l’association du poivre avec les produits de la mer. À Kampot et Kep, le dialogue entre poivre et fruits de mer est particulièrement emblématique.',
          'À la maison, un condiment très simple au citron vert et au poivre fraîchement moulu permet déjà de comprendre sa longueur aromatique.'
        ]
      }
    ],
    image: '/images/cuisine/kampot-1600.webp',
    imageAlt: 'Grappes de poivre vert de Kampot sur le plant',
    imageWidth: 6000,
    imageHeight: 4000,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'OMPI — Enregistrement international du Poivre de Kampot', url: 'https://www.wipo.int/ipdl/jsp/data.jsp?KEY=NOTIF_7076_IG-1152.pdf&SOURCE=LISBON&TYPE=PDF' },
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: tourismGuide }
    ]
  },
  {
    slug: 'comprendre-le-kroeung',
    title: 'Kroeung : comprendre une famille de pâtes aromatiques',
    eyebrow: 'Gestes',
    intro: 'Le kroeung n’est pas une seule recette figée. C’est une famille de pâtes d’herbes, de racines et d’épices qui forme l’ossature aromatique de nombreux plats khmers.',
    seoDescription: 'Comprendre le kroeung cambodgien : citronnelle, galanga, curcuma, combava, variantes jaunes, rouges ou vertes et importance du travail au mortier.',
    readingTime: '6 min',
    sections: [
      {
        title: 'Une base, plusieurs expressions',
        paragraphs: [
          'Le terme kroeung désigne différentes pâtes aromatiques utilisées comme fondation. Citronnelle, galanga, curcuma, combava, ail ou échalote reviennent souvent, mais les proportions et les ajouts changent avec le plat.',
          'Le guide gastronomique du Ministère du Tourisme évoque notamment des kroeung jaunes, rouges et verts, le jaune étant décrit comme particulièrement important et largement utilisé.'
        ]
      },
      {
        title: 'Le geste transforme les ingrédients',
        paragraphs: [
          'Couper finement puis piler progressivement n’est pas une formalité. Le travail mécanique casse les fibres de citronnelle, écrase les rhizomes et libère les huiles aromatiques.',
          'Une pâte encore très fibreuse donnera des bouchées agressives. Une pâte suffisamment travaillée parfume au contraire toute la sauce de manière homogène.'
        ]
      },
      {
        title: 'Apprendre à le sentir plutôt qu’à suivre une formule',
        paragraphs: [
          'Un bon repère est l’odeur : le mélange doit devenir plus intense et plus unifié à mesure que l’on pile. On ne devrait plus sentir chaque ingrédient comme un morceau séparé.',
          'C’est aussi pour cela que deux familles peuvent préparer des kroeung différents tout en partageant la même logique culinaire.'
        ]
      }
    ],
    image: '/images/cuisine/kroeung-1600.webp',
    imageAlt: 'Préparation cambodgienne à base de kroeung et aromates',
    imageWidth: 5184,
    imageHeight: 3456,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: tourismGuide }
    ]
  },
  {
    slug: 'comprendre-amok',
    title: 'Amok : comprendre la texture avant de suivre la recette',
    eyebrow: 'Plats',
    intro: 'L’amok de poisson associe kroeung, poisson, œuf et cuisson douce. Ce qui le distingue surtout, c’est une texture liée, moelleuse et parfumée plutôt qu’un curry liquide.',
    seoDescription: 'Amok cambodgien : origine, rôle du kroeung, texture, cuisson vapeur et repères pour réussir un amok trei moelleux et parfumé.',
    readingTime: '5 min',
    sections: [
      {
        title: 'Un plat emblématique, mais pas une formule unique',
        paragraphs: [
          'Le guide gastronomique officiel du Cambodge présente l’amok comme un plat célèbre, associé à une tradition royale, dans lequel poisson et œuf sont parfumés au kroeung puis cuits à la vapeur.',
          'Dans la pratique, les recettes varient. Ce qui compte pour le cuisinier est de comprendre la structure commune plutôt que de chercher une seule proportion universelle.'
        ]
      },
      {
        title: 'Le kroeung donne la direction, le coco arrondit',
        paragraphs: [
          'Le kroeung apporte la structure aromatique : citronnelle, rhizomes, agrumes et épices. Le lait de coco apporte de la rondeur et aide à envelopper le poisson.',
          'L’équilibre se joue avant la cuisson. Une base trop salée ou trop sucrée le restera une fois le poisson ajouté.'
        ]
      },
      {
        title: 'La vapeur doit prendre sans assécher',
        paragraphs: [
          'La préparation doit se tenir, mais rester souple. Une chaleur trop forte resserre les protéines et donne rapidement une texture sèche.',
          'Le bon repère est une surface prise, un cœur encore moelleux et un poisson qui se détache sans devenir cotonneux.'
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
    slug: 'prahok-fermentation',
    title: 'Prahok : pourquoi la fermentation compte autant',
    eyebrow: 'Fermentations',
    intro: 'Le prahok est une pâte de poisson salé et fermenté. Derrière son parfum puissant se trouve surtout une technique de conservation devenue un marqueur profond du goût khmer.',
    seoDescription: 'Prahok cambodgien : fermentation du poisson, rôle umami, usages culinaires et manière de l’équilibrer avec herbes, légumes et riz.',
    readingTime: '6 min',
    sections: [
      {
        title: 'Conserver le poisson et concentrer le goût',
        paragraphs: [
          'Le Ministère du Tourisme décrit le prahok comme une pâte de poisson fermenté née d’une logique de conservation des protéines. Le salage et la fermentation transforment le poisson et développent une forte intensité savoureuse.',
          'Cette fonction historique explique pourquoi il est à la fois aliment conservé et assaisonnement.'
        ]
      },
      {
        title: 'Un assaisonnement, pas seulement une odeur',
        paragraphs: [
          'Goûté seul, le prahok peut être très puissant. Dans un plat, son rôle peut être beaucoup plus subtil : renforcer le sel, l’umami et la profondeur sans forcément devenir identifiable au premier coup de fourchette.',
          'Certaines préparations le mettent néanmoins au centre, notamment des dips ou des cuissons en feuille.'
        ]
      },
      {
        title: 'La fraîcheur fait partie de l’équilibre',
        paragraphs: [
          'Crudités, herbes, riz et légumes croquants ne sont pas des garnitures décoratives : ils donnent de la fraîcheur face à la fermentation et au sel.',
          'C’est une bonne porte d’entrée pour découvrir le prahok : le goûter dans une préparation complète plutôt que directement à la cuillère.'
        ]
      }
    ],
    image: '/images/cuisine/prahok-1600.webp',
    imageAlt: 'Préparation cambodgienne au prahok servie avec des légumes',
    imageWidth: 3000,
    imageHeight: 4000,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: tourismGuide },
      { label: 'Ministère du Tourisme — street food à Siem Reap', url: 'https://tourismcambodia.org/public/official-activities/tantalising-street-food-in-siem-reap' }
    ]
  },
  {
    slug: 'marches-herbes-cuisine-khmere',
    title: 'Marchés, herbes et fraîcheur : pourquoi la cuisine khmère est si verte',
    eyebrow: 'Marchés',
    intro: 'Herbes, tiges, feuilles, fleurs et racines occupent une place immense dans les marchés cambodgiens. Cette abondance végétale explique une partie de la fraîcheur de la cuisine.',
    seoDescription: 'Herbes, feuilles, racines et marchés au Cambodge : comprendre la place du végétal et de la fraîcheur dans la cuisine khmère.',
    readingTime: '5 min',
    sections: [
      {
        title: 'Le marché comme garde-manger vivant',
        paragraphs: [
          'Le guide gastronomique officiel décrit des marchés riches en herbes, basilics, légumes aquatiques, fleurs et racines. Cette diversité végétale n’est pas séparée de la cuisine : elle est disponible au quotidien et se retrouve dans les soupes, salades, currys et accompagnements.',
          'Le goût final dépend donc souvent autant de ce qui est ajouté cru au dernier moment que de ce qui a mijoté.'
        ]
      },
      {
        title: 'Des racines pour construire, des feuilles pour réveiller',
        paragraphs: [
          'Les racines et tiges comme le galanga ou la citronnelle servent à bâtir les bases aromatiques. Les herbes et feuilles fraîches interviennent souvent plus tard pour apporter fraîcheur, amertume légère ou parfum.',
          'Cette succession crée des plats qui peuvent être riches tout en restant très aromatiques.'
        ]
      },
      {
        title: 'Croquant, chaud, frais : le contraste comme principe',
        paragraphs: [
          'Un plat peut réunir une sauce chaude, du riz, une fermentation intense et des légumes crus. Ce contraste de températures et de textures fait partie du plaisir.',
          'Pour reproduire cette sensation chez soi, il faut penser le repas dans son ensemble plutôt que concentrer toute la saveur dans la casserole.'
        ]
      }
    ],
    image: '/images/cuisine/kep-market-1600.webp',
    imageAlt: 'Marché cambodgien avec produits frais et étals',
    imageWidth: 5184,
    imageHeight: 3456,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: tourismGuide }
    ]
  },
  {
    slug: 'transmission-cuisine-khmere',
    title: 'Transmettre la cuisine khmère : recettes, mémoire et gestes',
    eyebrow: 'Transmission',
    intro: 'Une cuisine ne se transmet pas seulement par des listes d’ingrédients. Elle passe par des gestes, des repères sensoriels et une mémoire familiale que plusieurs cuisiniers cherchent aujourd’hui à documenter.',
    seoDescription: 'Transmission de la cuisine khmère : mémoire des recettes, gestes familiaux, impact de l’histoire cambodgienne et travail actuel de documentation culinaire.',
    readingTime: '7 min',
    sections: [
      {
        title: 'Quand la recette n’est pas écrite',
        paragraphs: [
          'Le guide gastronomique du Ministère du Tourisme rapporte le travail de cuisiniers cambodgiens qui collectent et écrivent des recettes autrefois transmises surtout oralement.',
          'Le défi est concret : une personne expérimentée peut cuisiner avec « un peu de ceci » et reconnaître la bonne texture sans mesure, alors qu’un lecteur a besoin de repères plus explicites.'
        ]
      },
      {
        title: 'L’histoire a aussi interrompu des transmissions',
        paragraphs: [
          'Le même guide rappelle que la période des Khmers rouges a profondément bouleversé la société cambodgienne, les familles et la transmission de pratiques culinaires. Des recettes et des savoir-faire ont été perdus avec les personnes qui les détenaient.',
          'Parler de cuisine cambodgienne aujourd’hui suppose donc de reconnaître cette histoire sans réduire la cuisine à cette rupture.'
        ]
      },
      {
        title: 'Écrire sans figer',
        paragraphs: [
          'Documenter une recette ne signifie pas décider qu’une seule version est « la bonne ». Les ingrédients disponibles, les familles et les régions font varier les pratiques.',
          'Un bon travail de transmission doit plutôt expliquer ce qui compte : le geste, l’équilibre, la texture recherchée et les possibilités de variation.'
        ]
      }
    ],
    image: '/images/cuisine/kroeung-1600.webp',
    imageAlt: 'Préparation d’une base aromatique cambodgienne illustrant la transmission des gestes',
    imageWidth: 5184,
    imageHeight: 3456,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: tourismGuide }
    ]
  }
];
