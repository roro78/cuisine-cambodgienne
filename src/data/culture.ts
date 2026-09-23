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
        title: 'En cuisine',
        paragraphs: [
          'Le poivre de Kampot se rencontre sous différentes maturités et préparations, avec des profils aromatiques distincts. Il peut être utilisé comme assaisonnement final, dans une sauce ou comme élément central d’un plat.',
          'La cuisine cambodgienne l’associe notamment aux produits de la mer, particulièrement dans la région de Kampot et Kep.'
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
        title: 'Ce qu’il faut retenir en cuisine',
        paragraphs: [
          'Le kroeung apporte la structure aromatique, le lait de coco arrondit l’ensemble et la cuisson douce évite de dessécher la préparation.',
          'Les variantes sont nombreuses ; comprendre cette architecture permet d’ajuster plus intelligemment la recette.'
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
  }
];
