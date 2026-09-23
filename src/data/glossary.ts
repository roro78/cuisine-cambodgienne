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
    short: 'Pâte fraîche d’aromates pilés — souvent citronnelle, galanga, curcuma et combava — utilisée comme base de nombreux plats khmers.',
    href: '/ingredients/kroeung/'
  },
  {
    slug: 'prahok',
    term: 'Prahok',
    short: 'Condiment cambodgien de poisson fermenté, salin et très umami, utilisé en petite quantité ou comme élément central de certaines préparations.',
    href: '/ingredients/prahok/'
  },
  {
    slug: 'poivre-de-kampot',
    term: 'Poivre de Kampot',
    short: 'Poivre cultivé dans la région de Kampot, au Cambodge, recherché pour sa fraîcheur, sa chaleur et sa longueur aromatique.',
    href: '/ingredients/poivre-de-kampot/'
  },
  {
    slug: 'combava',
    term: 'Combava',
    short: 'Agrume très parfumé dont le zeste et les feuilles apportent une note fraîche, vive et citronnée.',
  },
  {
    slug: 'galanga',
    term: 'Galanga',
    short: 'Rhizome aromatique proche du gingembre, plus camphré et citronné, très présent dans les pâtes aromatiques d’Asie du Sud-Est.',
  },
  {
    slug: 'amok',
    term: 'Amok',
    short: 'Préparation cambodgienne douce et parfumée, souvent à base de poisson, kroeung et lait de coco, cuite doucement ou à la vapeur.',
    href: '/recettes/amok-trey/'
  }
];

export function getGlossaryEntries(slugs: string[]) {
  return glossaryEntries.filter((entry) => slugs.includes(entry.slug));
}
