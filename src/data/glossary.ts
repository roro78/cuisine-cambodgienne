export interface GlossaryEntry {
  slug: string;
  term: string;
  short: string;
  culinaryUse?: string;
  cue?: string;
  href?: string;
}

export const glossaryEntries: GlossaryEntry[] = [
  {
    slug: 'kroeung',
    term: 'Kroeung',
    short: 'Pâte fraîche d’aromates pilés — souvent citronnelle, galanga, curcuma, combava, ail et échalote — qui sert de base à de nombreux plats khmers.',
    culinaryUse: 'Base aromatique pour amok, currys, marinades et sautés.',
    cue: 'Au nez, la citronnelle et le combava doivent ressortir avant la cuisson.',
    href: '/ingredients/kroeung/'
  },
  {
    slug: 'prahok',
    term: 'Prahok',
    short: 'Condiment cambodgien de poisson fermenté, très salin et umami. Il s’utilise en petite quantité pour donner de la profondeur ou devient parfois un élément central du plat.',
    culinaryUse: 'À doser dans les sauces, soupes, dips et plats mijotés pour apporter de l’umami.',
    cue: 'Son odeur crue est puissante ; en cuisson, le goût devient plus rond.',
    href: '/ingredients/prahok/'
  },
  {
    slug: 'poivre-de-kampot',
    term: 'Poivre de Kampot',
    short: 'Poivre cultivé dans la région de Kampot, au Cambodge. Selon sa maturité, il peut être vif, floral, fruité ou très chaud.',
    culinaryUse: 'À concasser au dernier moment sur viandes, fruits de mer, sauces citronnées et œufs.',
    cue: 'Le parfum doit être net dès l’ouverture du contenant.',
    href: '/ingredients/poivre-de-kampot/'
  },
  {
    slug: 'combava',
    term: 'Combava',
    short: 'Agrume extrêmement parfumé. On utilise surtout son zeste et ses feuilles pour apporter une note citronnée, verte et très persistante.'
    culinaryUse: 'Zeste et feuilles parfument kroeung, currys et bouillons.',
    cue: 'Une petite quantité suffit : le parfum est immédiatement citronné et floral.',
  },
  {
    slug: 'galanga',
    term: 'Galanga',
    short: 'Rhizome aromatique proche du gingembre, mais plus boisé, camphré et citronné. Il apporte de la fraîcheur et du relief aux pâtes aromatiques.'
    culinaryUse: 'À piler dans le kroeung ou à infuser dans les bouillons.',
    cue: 'Plus boisé et camphré que le gingembre.',
  },
  {
    slug: 'amok',
    term: 'Amok',
    short: 'Préparation cambodgienne douce et parfumée, souvent à base de poisson, kroeung et lait de coco, cuite doucement jusqu’à obtenir une texture liée et moelleuse.',
    culinaryUse: 'Préparation idéale pour apprendre l’équilibre kroeung, coco et cuisson vapeur.',
    cue: 'La texture finale doit être prise mais souple, jamais sèche.',
    href: '/recettes/amok-trey/'
  },
  {
    slug: 'citronnelle',
    term: 'Citronnelle',
    short: 'Tige très aromatique aux notes citronnées et végétales. Le cœur tendre est finement émincé puis pilé dans le kroeung ou infusé dans les bouillons.'
    culinaryUse: 'À émincer très finement pour le kroeung, ou à écraser pour parfumer un bouillon.',
    cue: 'Chercher un parfum citronné très frais et une tige ferme.',
  },
  {
    slug: 'curcuma',
    term: 'Curcuma frais',
    short: 'Rhizome terreux, poivré et légèrement amer. Il colore le kroeung jaune et apporte une profondeur différente de celle du curcuma en poudre.'
    culinaryUse: 'À piler frais dans les pâtes aromatiques ou à utiliser avec parcimonie en poudre.',
    cue: 'Le frais doit sentir la terre, le poivre et les agrumes légers.',
  },
  {
    slug: 'tamarin',
    term: 'Tamarin',
    short: 'Pulpe de fruit acidulée, ronde et légèrement sucrée. Elle sert à donner de la profondeur aux sauces, soupes et préparations aigres-douces.',
    culinaryUse: 'À diluer puis filtrer pour les soupes, sauces et équilibres aigres-doux.',
    cue: 'L’acidité est ronde et fruitée, moins tranchante qu’un citron vert.',
    href: '/ingredients/tamarin/'
  },
  {
    slug: 'sucre-de-palme',
    term: 'Sucre de palme',
    short: 'Sucre à la douceur plus ronde que le sucre blanc, avec des notes de caramel léger. Il sert à équilibrer sel, acidité et fermentation.'
    culinaryUse: 'À utiliser pour équilibrer acidité, fermentation et sauces salées.',
    cue: 'La douceur est plus ronde et légèrement caramélisée.',
  },
  {
    slug: 'lait-de-coco',
    term: 'Lait de coco',
    short: 'Liquide riche et doux utilisé pour arrondir les pâtes aromatiques, lier certaines sauces et apporter de l’onctuosité à l’amok et aux currys.'
    culinaryUse: 'Pour arrondir un kroeung, lier une sauce et donner du moelleux à l’amok.',
    cue: 'Un bon lait de coco doit rester crémeux sans goût métallique.',
  },
  {
    slug: 'feuille-de-bananier',
    term: 'Feuille de bananier',
    short: 'Feuille souple utilisée comme support, papillote ou petit contenant. Chauffée brièvement, elle devient plus souple et développe un parfum végétal discret.'
    culinaryUse: 'À chauffer brièvement pour la rendre souple avant pliage ou cuisson vapeur.',
    cue: 'La feuille devient brillante et souple quand elle est prête à être pliée.',
  },
  {
    slug: 'sauce-de-poisson',
    term: 'Sauce de poisson',
    short: 'Assaisonnement fermenté, salin et umami. Quelques cuillerées suffisent souvent pour renforcer la profondeur d’une sauce ou d’une marinade.'
    culinaryUse: 'Quelques cuillerées suffisent dans une marinade, une sauce ou un bouillon.',
    cue: 'Chercher un goût salin et umami, sans lourdeur sucrée.',
  },
  {
    slug: 'basilic-thai',
    term: 'Basilic thaï',
    short: 'Herbe au parfum anisé et épicé, ajoutée en fin de cuisson pour garder sa fraîcheur. Elle apporte un contraste vif aux plats riches ou coco.'
    culinaryUse: 'À ajouter en fin de cuisson pour préserver son parfum.',
    cue: 'Les feuilles froissées libèrent une note anisée caractéristique.',
  },
  {
    slug: 'riz-jasmin',
    term: 'Riz jasmin',
    short: 'Riz parfumé à grain long, doux et floral, souvent servi pour accompagner les plats en sauce, les sautés et les préparations au coco.'
    culinaryUse: 'Accompagnement naturel des plats en sauce, sautés et currys.',
    cue: 'Le grain doit rester distinct, souple et légèrement parfumé.',
  }
];

export function getGlossaryEntries(slugs: string[]) {
  return glossaryEntries.filter((entry) => slugs.includes(entry.slug));
}
