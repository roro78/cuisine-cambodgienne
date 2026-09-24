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
    short: 'Nom générique d’une famille de pâtes fraîches d’herbes, de racines et d’épices qui forment la base aromatique de nombreux plats khmers.',
    culinaryUse: 'On le pile ou on le mixe très finement avant de le faire revenir, de le diluer dans du lait de coco ou de l’utiliser en marinade.',
    cue: 'Le bon repère : une pâte humide, très parfumée, où la citronnelle ne reste pas fibreuse.',
    href: '/ingredients/kroeung/'
  },
  {
    slug: 'prahok',
    term: 'Prahok',
    short: 'Pâte de poisson salé et fermenté, profondément umami, utilisée comme condiment, assaisonnement ou base de préparations cambodgiennes.',
    culinaryUse: 'Une petite quantité peut renforcer une soupe, un dip ou un plat mijoté ; certaines recettes en font au contraire un élément central.',
    cue: 'Commencer petit : son sel et sa fermentation doivent soutenir le plat, pas effacer les autres parfums.',
    href: '/ingredients/prahok/'
  },
  {
    slug: 'poivre-de-kampot',
    term: 'Poivre de Kampot',
    short: 'Poivre protégé par indication géographique, lié aux zones de production de Kampot et Kep au Cambodge.',
    culinaryUse: 'Il se travaille en grains verts frais, noirs, rouges ou blancs selon le profil recherché, souvent avec fruits de mer, viandes et citron vert.',
    cue: 'Moudre au dernier moment pour préserver la fraîcheur aromatique.',
    href: '/ingredients/poivre-de-kampot/'
  },
  {
    slug: 'combava',
    term: 'Combava',
    short: 'Agrume très aromatique dont on utilise surtout le zeste et les feuilles pour leur parfum citronné, floral et légèrement amer.',
    culinaryUse: 'Le zeste entre dans certains kroeung ; les feuilles finement émincées ou infusées parfument currys, amok et soupes.',
    cue: 'Le zeste blanc est très amer : prélever surtout la partie verte.'
  },
  {
    slug: 'galanga',
    term: 'Galanga',
    short: 'Rhizome de la même grande famille aromatique que le gingembre, mais au parfum plus camphré, boisé et citronné.',
    culinaryUse: 'Il entre dans les pâtes aromatiques et les bouillons, souvent avec citronnelle, curcuma et combava.',
    cue: 'Il est plus ferme que le gingembre : l’émincer très finement avant de le piler.'
  },
  {
    slug: 'citronnelle',
    term: 'Citronnelle',
    short: 'Tige aromatique fraîche, citronnée et végétale, essentielle dans de nombreuses bases khmères.',
    culinaryUse: 'On utilise surtout la partie tendre de la base, émincée très finement pour le kroeung ou écrasée pour parfumer bouillons et cuissons.',
    cue: 'Retirer les couches sèches et garder le cœur pâle et tendre.'
  },
  {
    slug: 'curcuma',
    term: 'Curcuma',
    short: 'Rhizome jaune-orangé qui apporte couleur, notes terreuses et une légère amertume aux pâtes aromatiques.',
    culinaryUse: 'Frais, il est souvent pilé dans le kroeung jaune ; en poudre, il dépanne mais donne un profil plus sec.',
    cue: 'Une petite quantité suffit : trop de curcuma peut dominer par son amertume.'
  },
  {
    slug: 'tamarin',
    term: 'Tamarin',
    short: 'Pulpe de fruit acidulée et fruitée, utilisée pour apporter une acidité ronde et profonde.',
    culinaryUse: 'On la dilue souvent dans de l’eau chaude puis on la filtre avant de l’ajouter aux sauces, soupes et préparations aigres-douces.',
    cue: 'Ajouter progressivement : son acidité doit équilibrer, pas rendre le plat agressif.',
    href: '/ingredients/tamarin/'
  },
  {
    slug: 'sucre-de-palme',
    term: 'Sucre de palme',
    short: 'Sucre brun aux notes caramélisées utilisé pour arrondir l’acidité, le sel et la fermentation.',
    culinaryUse: 'On l’emploie en petite quantité dans sauces, marinades, currys et desserts.',
    cue: 'L’objectif est souvent l’équilibre, pas une sensation franchement sucrée.'
  },
  {
    slug: 'lait-de-coco',
    term: 'Lait de coco',
    short: 'Liquide riche extrait de la chair de coco, utilisé pour apporter rondeur, texture et douceur.',
    culinaryUse: 'Il entre notamment dans des currys, sauces et certaines versions d’amok.',
    cue: 'Une cuisson trop forte peut alourdir ou séparer la sauce : préférer une chaleur maîtrisée.'
  },
  {
    slug: 'amok',
    term: 'Amok',
    short: 'Préparation cambodgienne parfumée au kroeung, souvent à base de poisson, liée avec œuf et lait de coco puis cuite doucement.',
    culinaryUse: 'L’amok est moins liquide qu’un curry : on recherche une texture prise mais souple.',
    cue: 'Le poisson doit rester tendre et le parfum du kroeung rester net.',
    href: '/recettes/amok-trey/'
  },
  {
    slug: 'num-banh-chok',
    term: 'Num banh chok',
    short: 'Nouilles de riz fermenté et plat de nouilles populaire au Cambodge, souvent servi avec une sauce ou un bouillon parfumé et de nombreuses herbes.',
    culinaryUse: 'C’est un excellent exemple de cuisine cambodgienne où nouilles, sauce, herbes fraîches et textures végétales se répondent.',
    cue: 'Le contraste entre nouilles souples, sauce parfumée et végétaux frais fait partie du plaisir.'
  },
  {
    slug: 'bobor',
    term: 'Bobor',
    short: 'Bouillie de riz cambodgienne proche du congee, servie avec des garnitures variables.',
    culinaryUse: 'Elle peut être très simple ou enrichie de viande, poisson, herbes, ail frit et condiments.',
    cue: 'La texture doit être souple et réconfortante, le riz ayant libéré une partie de son amidon.'
  },
  {
    slug: 'sang-vak',
    term: 'Sang vak',
    short: 'Préparation de poisson fermenté pilé, servie avec nouilles, légumes de saison et feuilles pour composer des bouchées.',
    culinaryUse: 'Elle illustre l’importance des fermentations, des herbes et des crudités dans l’équilibre de nombreux repas khmers.',
    cue: 'Le fermenté gagne à être accompagné de fraîcheur et de croquant.'
  }
];

export function getGlossaryEntries(slugs: string[]) {
  return glossaryEntries.filter((entry) => slugs.includes(entry.slug));
}
