export interface GlossaryEntry {
  slug: string;
  term: string;
  short: string;
  href?: string;
}

export const glossaryEntries: GlossaryEntry[] = [
  {
    slug: 'kroeung',
    term: 'Kroeung',
    short: 'Pâte fraîche d’aromates pilés — souvent citronnelle, galanga, curcuma, combava, ail et échalote — qui sert de base à de nombreux plats khmers.',
    href: '/ingredients/kroeung/'
  },
  {
    slug: 'prahok',
    term: 'Prahok',
    short: 'Condiment cambodgien de poisson fermenté, très salin et umami. Il s’utilise en petite quantité pour donner de la profondeur ou devient parfois un élément central du plat.',
    href: '/ingredients/prahok/'
  },
  {
    slug: 'poivre-de-kampot',
    term: 'Poivre de Kampot',
    short: 'Poivre cultivé dans la région de Kampot, au Cambodge. Selon sa maturité, il peut être vif, floral, fruité ou très chaud.',
    href: '/ingredients/poivre-de-kampot/'
  },
  {
    slug: 'combava',
    term: 'Combava',
    short: 'Agrume extrêmement parfumé. On utilise surtout son zeste et ses feuilles pour apporter une note citronnée, verte et très persistante.'
  },
  {
    slug: 'galanga',
    term: 'Galanga',
    short: 'Rhizome aromatique proche du gingembre, mais plus boisé, camphré et citronné. Il apporte de la fraîcheur et du relief aux pâtes aromatiques.'
  },
  {
    slug: 'amok',
    term: 'Amok',
    short: 'Préparation cambodgienne douce et parfumée, souvent à base de poisson, kroeung et lait de coco, cuite doucement jusqu’à obtenir une texture liée et moelleuse.',
    href: '/recettes/amok-trey/'
  },
  {
    slug: 'citronnelle',
    term: 'Citronnelle',
    short: 'Tige très aromatique aux notes citronnées et végétales. Le cœur tendre est finement émincé puis pilé dans le kroeung ou infusé dans les bouillons.'
  },
  {
    slug: 'curcuma',
    term: 'Curcuma frais',
    short: 'Rhizome terreux, poivré et légèrement amer. Il colore le kroeung jaune et apporte une profondeur différente de celle du curcuma en poudre.'
  },
  {
    slug: 'tamarin',
    term: 'Tamarin',
    short: 'Pulpe de fruit acidulée, ronde et légèrement sucrée. Elle sert à donner de la profondeur aux sauces, soupes et préparations aigres-douces.',
    href: '/ingredients/tamarin/'
  },
  {
    slug: 'sucre-de-palme',
    term: 'Sucre de palme',
    short: 'Sucre à la douceur plus ronde que le sucre blanc, avec des notes de caramel léger. Il sert à équilibrer sel, acidité et fermentation.'
  },
  {
    slug: 'lait-de-coco',
    term: 'Lait de coco',
    short: 'Liquide riche et doux utilisé pour arrondir les pâtes aromatiques, lier certaines sauces et apporter de l’onctuosité à l’amok et aux currys.'
  },
  {
    slug: 'feuille-de-bananier',
    term: 'Feuille de bananier',
    short: 'Feuille souple utilisée comme support, papillote ou petit contenant. Chauffée brièvement, elle devient plus souple et développe un parfum végétal discret.'
  },
  {
    slug: 'sauce-de-poisson',
    term: 'Sauce de poisson',
    short: 'Assaisonnement fermenté, salin et umami. Quelques cuillerées suffisent souvent pour renforcer la profondeur d’une sauce ou d’une marinade.'
  },
  {
    slug: 'basilic-thai',
    term: 'Basilic thaï',
    short: 'Herbe au parfum anisé et épicé, ajoutée en fin de cuisson pour garder sa fraîcheur. Elle apporte un contraste vif aux plats riches ou coco.'
  },
  {
    slug: 'riz-jasmin',
    term: 'Riz jasmin',
    short: 'Riz parfumé à grain long, doux et floral, souvent servi pour accompagner les plats en sauce, les sautés et les préparations au coco.'
  }
];

export function getGlossaryEntries(slugs: string[]) {
  return glossaryEntries.filter((entry) => slugs.includes(entry.slug));
}
