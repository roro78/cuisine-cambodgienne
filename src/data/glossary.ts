export interface GlossaryEntry {
  slug: string;
  term: string;
  short: string;
  href?: string;
  family?: 'Base aromatique' | 'Herbe & racine' | 'Condiment' | 'Cuisson & plat' | 'Produit';
}

export const glossaryEntries: GlossaryEntry[] = [
  {
    slug: 'kroeung',
    term: 'Kroeung',
    short: 'Famille de pâtes fraîches d’aromates pilés. Citronnelle, galanga, curcuma, combava, ail et échalote peuvent s’y retrouver selon le plat.',
    href: '/ingredients/kroeung/',
    family: 'Base aromatique'
  },
  {
    slug: 'prahok',
    term: 'Prahok',
    short: 'Préparation cambodgienne de poisson fermenté, salée et très umami. Elle s’utilise comme assaisonnement, dans des sauces ou comme composante forte d’un plat.',
    href: '/ingredients/prahok/',
    family: 'Condiment'
  },
  {
    slug: 'poivre-de-kampot',
    term: 'Poivre de Kampot',
    short: 'Poivre cultivé dans la région de Kampot. Selon sa maturité, il peut être vif, floral, fruité ou plus profond.',
    href: '/ingredients/poivre-de-kampot/',
    family: 'Produit'
  },
  {
    slug: 'tamarin',
    term: 'Tamarin',
    short: 'Pulpe acidulée et fruitée utilisée pour apporter une acidité ronde aux soupes, sauces et préparations aigres-douces.',
    href: '/ingredients/tamarin/',
    family: 'Produit'
  },
  {
    slug: 'citronnelle',
    term: 'Citronnelle',
    short: 'Tige aromatique fraîche, citronnée et légèrement végétale. Le cœur tendre se hache ou se pile très finement dans les kroeung et marinades.',
    family: 'Herbe & racine'
  },
  {
    slug: 'galanga',
    term: 'Galanga',
    short: 'Rhizome aromatique plus ferme et plus camphré que le gingembre, avec des notes citronnées et poivrées.',
    family: 'Herbe & racine'
  },
  {
    slug: 'curcuma',
    term: 'Curcuma frais',
    short: 'Rhizome terreux, chaud et légèrement amer qui apporte couleur et profondeur à certaines pâtes de kroeung.',
    family: 'Herbe & racine'
  },
  {
    slug: 'combava',
    term: 'Combava',
    short: 'Agrume très parfumé. Le zeste et les feuilles apportent une note verte, citronnée et très persistante.',
    family: 'Herbe & racine'
  },
  {
    slug: 'sucre-de-palme',
    term: 'Sucre de palme',
    short: 'Sucre aux notes caramélisées utilisé pour arrondir l’acidité, le piment et les saveurs salées sans donner une sensation simplement sucrée.',
    family: 'Condiment'
  },
  {
    slug: 'sauce-poisson',
    term: 'Sauce de poisson',
    short: 'Condiment liquide salé et fermenté utilisé pour assaisonner, renforcer l’umami et équilibrer une sauce ou une marinade.',
    family: 'Condiment'
  },
  {
    slug: 'lait-de-coco',
    term: 'Lait de coco',
    short: 'Liquide onctueux extrait de la chair de coco. Il apporte rondeur, matière et douceur aux currys et à l’amok.',
    family: 'Produit'
  },
  {
    slug: 'feuille-bananier',
    term: 'Feuille de bananier',
    short: 'Feuille utilisée comme contenant ou enveloppe de cuisson et de service. Elle ne se mange pas mais participe à la présentation et à la cuisson douce.',
    family: 'Cuisson & plat'
  },
  {
    slug: 'amok',
    term: 'Amok',
    short: 'Préparation cambodgienne parfumée au kroeung, souvent au poisson, liée avec coco et œuf puis cuite doucement jusqu’à une texture souple.',
    href: '/recettes/amok-trey/',
    family: 'Cuisson & plat'
  },
  {
    slug: 'lok-lak',
    term: 'Lok Lak',
    short: 'Plat de bœuf rapidement saisi, servi avec crudités et un condiment acidulé au poivre. La réussite tient surtout à la cuisson vive.',
    href: '/recettes/lok-lak/',
    family: 'Cuisson & plat'
  },
  {
    slug: 'basilic-asiatique',
    term: 'Basilic asiatique',
    short: 'Herbe fraîche aux notes anisées ou épicées selon la variété. Elle s’ajoute souvent en fin de cuisson pour garder son parfum.',
    family: 'Herbe & racine'
  },
  {
    slug: 'riz-jasmin',
    term: 'Riz jasmin',
    short: 'Riz long parfumé servi avec de nombreux plats. Sa texture légère absorbe sauces et jus sans prendre le dessus sur les aromates.',
    family: 'Produit'
  }
];

export function getGlossaryEntries(slugs: string[]) {
  return glossaryEntries.filter((entry) => slugs.includes(entry.slug));
}
