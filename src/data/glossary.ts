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
    culinaryUse: 'On l’utilise dans les currys, marinades, soupes et amok. Il se prépare avant la cuisson pour bien libérer le parfum des aromates.',
    cue: 'La pâte doit sentir frais et citronné avant même d’être chauffée.'
  },
  {
    slug: 'prahok',
    term: 'Prahok',
    short: 'Préparation cambodgienne de poisson fermenté, salée et très umami. Elle s’utilise comme assaisonnement, dans des sauces ou comme composante forte d’un plat.',
    href: '/ingredients/prahok/',
    family: 'Condiment',
    culinaryUse: 'Ajoutez-en peu à peu dans une sauce, une soupe ou un plat mijoté : il apporte à la fois du sel et beaucoup d’umami.',
    cue: 'Commencez par une petite quantité : son goût est puissant et il peut être plus ou moins salé selon le produit.'
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
    culinaryUse: 'Diluez la pulpe, filtrez-la puis ajoutez-la petit à petit dans les sauces et les soupes jusqu’à obtenir l’acidité qui vous plaît.',
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
    short: 'Rhizome terreux, chaud et légèrement amer qui apporte sa belle couleur jaune et une saveur plus chaude à certains kroeung.',
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
    cue: 'Une petite quantité suffit : on doit sentir son parfum citronné sans qu’il couvre les autres aromates.'
  },
  {
    slug: 'sucre-de-palme',
    term: 'Sucre de palme',
    short: 'Sucre aux notes caramélisées utilisé pour arrondir l’acidité, le piment et les saveurs salées sans donner une sensation simplement sucrée.',
    family: 'Condiment',
    culinaryUse: 'Il adoucit une sauce trop vive, équilibre le tamarin et atténue un assaisonnement un peu trop salé.',
    cue: 'Le plat doit paraître plus rond, sans donner l’impression d’avoir simplement ajouté du sucre.'
  },
  {
    slug: 'sauce-poisson',
    term: 'Sauce de poisson',
    short: 'Condiment liquide salé et fermenté utilisé pour assaisonner, renforcer l’umami et équilibrer une sauce ou une marinade.',
    family: 'Condiment',
    culinaryUse: 'Ajoutez-la par petites touches dans les marinades, les sauces et les plats mijotés : elle sale et renforce le goût.',
    cue: 'Après l’ajout, le plat doit être plus savoureux sans goûter uniquement la sauce de poisson.'
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
