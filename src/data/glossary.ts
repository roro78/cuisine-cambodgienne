export interface GlossaryEntry {
  slug: string;
  term: string;
  short: string;
  href?: string;
  family?: 'Base aromatique' | 'Herbe & racine' | 'Condiment' | 'Cuisson & plat' | 'Produit';
  culinaryUse?: string;
  cue?: string;
}

export const glossaryEntries: GlossaryEntry[] = [
  {
    slug: 'kroeung',
    term: 'Kroeung',
    short: 'Famille de pâtes fraîches d’aromates pilés. Citronnelle, galanga, curcuma, combava, ail et échalote peuvent s’y retrouver selon le plat.',
    href: '/ingredients/kroeung/',
    family: 'Base aromatique',
    culinaryUse: 'Base des currys, marinades, soupes et de l’amok ; il se travaille avant la cuisson pour diffuser les huiles aromatiques.',
    cue: 'La pâte doit sentir frais et citronné avant même d’être chauffée.'
  },
  {
    slug: 'prahok',
    term: 'Prahok',
    short: 'Préparation cambodgienne de poisson fermenté, salée et très umami. Elle s’utilise comme assaisonnement, dans des sauces ou comme composante forte d’un plat.',
    href: '/ingredients/prahok/',
    family: 'Condiment',
    culinaryUse: 'À doser comme une source de sel et d’umami dans une sauce, une soupe ou une préparation mijotée.',
    cue: 'Commencer très petit : son intensité monte vite et sa salinité varie selon le produit.'
  },
  {
    slug: 'poivre-de-kampot',
    term: 'Poivre de Kampot',
    short: 'Poivre cultivé dans la région de Kampot. Selon sa maturité, il peut être vif, floral, fruité ou plus profond.',
    href: '/ingredients/poivre-de-kampot/',
    family: 'Produit',
    culinaryUse: 'À moudre au dernier moment, dans le lok lak, avec les produits de la mer ou dans un condiment au citron vert.',
    cue: 'Un bon poivre fraîchement moulu doit rester parfumé plusieurs secondes après la première chaleur.'
  },
  {
    slug: 'tamarin',
    term: 'Tamarin',
    short: 'Pulpe acidulée et fruitée utilisée pour apporter une acidité ronde aux soupes, sauces et préparations aigres-douces.',
    href: '/ingredients/tamarin/',
    family: 'Produit',
    culinaryUse: 'Diluer la pulpe, filtrer puis ajouter progressivement aux sauces et soupes pour construire l’acidité.',
    cue: 'L’acidité est plus ronde que celle du citron et laisse une légère note fruitée.'
  },
  {
    slug: 'citronnelle',
    term: 'Citronnelle',
    short: 'Tige aromatique fraîche, citronnée et légèrement végétale. Le cœur tendre se hache ou se pile très finement dans les kroeung et marinades.',
    family: 'Herbe & racine',
    culinaryUse: 'Retirer les couches externes dures, garder le cœur tendre et hacher très finement avant de piler.',
    cue: 'Le parfum doit être net, citronné et végétal, sans amertume fibreuse.'
  },
  {
    slug: 'galanga',
    term: 'Galanga',
    short: 'Rhizome aromatique plus ferme et plus camphré que le gingembre, avec des notes citronnées et poivrées.',
    family: 'Herbe & racine',
    culinaryUse: 'Le trancher très finement ou le piler avec la citronnelle dans les bases aromatiques.',
    cue: 'Plus résineux et camphré que le gingembre, avec une texture beaucoup plus ferme.'
  },
  {
    slug: 'curcuma',
    term: 'Curcuma frais',
    short: 'Rhizome terreux, chaud et légèrement amer qui apporte couleur et profondeur à certaines pâtes de kroeung.',
    family: 'Herbe & racine',
    culinaryUse: 'À piler dans certains kroeung pour apporter couleur, chaleur et une légère amertume.',
    cue: 'Le frais colore immédiatement les doigts et dégage une odeur terreuse plus vive que la poudre.'
  },
  {
    slug: 'combava',
    term: 'Combava',
    short: 'Agrume très parfumé. Le zeste et les feuilles apportent une note verte, citronnée et très persistante.',
    family: 'Herbe & racine',
    culinaryUse: 'Prélever très peu de zeste sans la partie blanche ; les feuilles se cisèlent très finement ou infusent.',
    cue: 'Une petite quantité suffit : son parfum vert et citronné doit rester en arrière-plan, pas dominer.'
  },
  {
    slug: 'sucre-de-palme',
    term: 'Sucre de palme',
    short: 'Sucre aux notes caramélisées utilisé pour arrondir l’acidité, le piment et les saveurs salées sans donner une sensation simplement sucrée.',
    family: 'Condiment',
    culinaryUse: 'À utiliser pour arrondir une sauce, équilibrer le tamarin ou calmer un condiment salé.',
    cue: 'Chercher une douceur caramélisée qui fond dans l’ensemble plutôt qu’un goût franchement sucré.'
  },
  {
    slug: 'sauce-poisson',
    term: 'Sauce de poisson',
    short: 'Condiment liquide salé et fermenté utilisé pour assaisonner, renforcer l’umami et équilibrer une sauce ou une marinade.',
    family: 'Condiment',
    culinaryUse: 'À ajouter par petites touches dans marinades, sauces et bases de cuisson comme source de sel et d’umami.',
    cue: 'Après ajout, le plat doit paraître plus profond et plus savoureux, pas sentir uniquement la sauce de poisson.'
  },
  {
    slug: 'lait-de-coco',
    term: 'Lait de coco',
    short: 'Liquide onctueux extrait de la chair de coco. Il apporte rondeur, matière et douceur aux currys et à l’amok.',
    family: 'Produit',
    culinaryUse: 'Dans l’amok et les currys, il apporte matière et douceur ; éviter de le faire bouillir brutalement trop longtemps.',
    cue: 'Un lait de coco riche donne une texture souple et satinée, pas aqueuse.'
  },
  {
    slug: 'feuille-bananier',
    term: 'Feuille de bananier',
    short: 'Feuille utilisée comme contenant ou enveloppe de cuisson et de service. Elle ne se mange pas mais participe à la présentation et à la cuisson douce.',
    family: 'Cuisson & plat',
    culinaryUse: 'Assouplir brièvement à la chaleur avant de plier pour former une coupe ou envelopper une préparation.',
    cue: 'La feuille devient plus souple et brillante quand elle est prête à être pliée.'
  },
  {
    slug: 'amok',
    term: 'Amok',
    short: 'Préparation cambodgienne parfumée au kroeung, souvent au poisson, liée avec coco et œuf puis cuite doucement jusqu’à une texture souple.',
    href: '/recettes/amok-trey/',
    family: 'Cuisson & plat',
    culinaryUse: 'Cuire doucement pour obtenir une préparation liée mais encore moelleuse ; servir avec du riz.',
    cue: 'La surface doit être prise sans devenir sèche, l’intérieur restant souple et parfumé.'
  },
  {
    slug: 'lok-lak',
    term: 'Lok Lak',
    short: 'Plat de bœuf rapidement saisi, servi avec crudités et un condiment acidulé au poivre. La réussite tient surtout à la cuisson vive.',
    href: '/recettes/lok-lak/',
    family: 'Cuisson & plat',
    culinaryUse: 'Saisir le bœuf en petites quantités à feu très vif puis servir immédiatement avec le condiment poivré-acidulé.',
    cue: 'Les cubes doivent être colorés dehors sans baigner dans leur jus.'
  },
  {
    slug: 'basilic-asiatique',
    term: 'Basilic asiatique',
    short: 'Herbe fraîche aux notes anisées ou épicées selon la variété. Elle s’ajoute souvent en fin de cuisson pour garder son parfum.',
    family: 'Herbe & racine',
    culinaryUse: 'Ajouter en fin de cuisson ou au service pour préserver les huiles aromatiques.',
    cue: 'Les feuilles doivent rester fraîches et très odorantes ; la chaleur prolongée les ternit vite.'
  },
  {
    slug: 'riz-jasmin',
    term: 'Riz jasmin',
    short: 'Riz long parfumé servi avec de nombreux plats. Sa texture légère absorbe sauces et jus sans prendre le dessus sur les aromates.',
    family: 'Produit',
    culinaryUse: 'Servir chaud pour absorber les sauces, jus et condiments sans masquer les aromates.',
    cue: 'Les grains doivent rester distincts, souples et légèrement parfumés.'
  }
];

export function getGlossaryEntries(slugs: string[]) {
  return glossaryEntries.filter((entry) => slugs.includes(entry.slug));
}
