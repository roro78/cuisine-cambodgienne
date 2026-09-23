export interface IngredientGuide {
  slug: string;
  title: string;
  intro: string;
  role: string;
  profile: string[];
  uses: string[];
  tips: string[];
  image: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  imageWidths: number[];
}

export const ingredientGuides: IngredientGuide[] = [
  {
    slug: 'kroeung',
    title: 'Kroeung',
    intro: 'La base aromatique qui donne sa profondeur à de nombreux plats khmers.',
    role: 'Le kroeung est une pâte fraîche d’aromates pilés. Sa composition varie selon les préparations, mais la logique reste la même : construire une base parfumée avant la cuisson.',
    profile: ['Citronnelle', 'Galanga', 'Curcuma', 'Combava', 'Ail et échalote'],
    uses: ['Amok', 'Soupes et currys', 'Marinades', 'Grillades'],
    tips: ['Émincer finement avant de piler.', 'Travailler les ingrédients les plus fibreux en premier.', 'Éviter d’ajouter trop de liquide au mixeur.'],
    image: '/images/cuisine/kroeung-1600.webp',
    imageAlt: 'Plat cambodgien parfumé au kroeung',
    imageWidth: 5184,
    imageHeight: 3456,
    imageWidths: [480, 800, 1200, 1600]
  },
  {
    slug: 'poivre-de-kampot',
    title: 'Poivre de Kampot',
    intro: 'Un produit de terroir cambodgien à utiliser comme un véritable ingrédient, pas seulement comme un assaisonnement.',
    role: 'Selon sa maturité et son traitement, le poivre de Kampot développe des profils très différents. Fraîcheur, chaleur et longueur aromatique peuvent devenir une composante centrale du plat.',
    profile: ['Noir : puissant et chaud', 'Rouge : plus mûr et fruité', 'Blanc : fin et direct', 'Vert frais : végétal et vif'],
    uses: ['Lok lak', 'Crabe et fruits de mer', 'Sauces au citron vert', 'Viandes grillées'],
    tips: ['Moudre au dernier moment.', 'Éviter une cuisson longue pour préserver les arômes.', 'Comparer plusieurs maturités sur un même plat.'],
    image: '/images/cuisine/kampot-1600.webp',
    imageAlt: 'Grappes de poivre vert de Kampot sur le plant',
    imageWidth: 6000,
    imageHeight: 4000,
    imageWidths: [480, 800, 1200, 1600]
  },
  {
    slug: 'tamarin',
    title: 'Tamarin',
    intro: 'Une acidité ronde et fruitée qui permet de construire l’équilibre d’une sauce ou d’une soupe.',
    role: 'Le tamarin apporte une acidité moins tranchante que le citron. Il est utile quand on cherche profondeur et longueur plutôt qu’une simple note fraîche.',
    profile: ['Acidulé', 'Fruité', 'Légèrement sucré'],
    uses: ['Soupes', 'Sauces', 'Poissons', 'Préparations aigres-douces'],
    tips: ['Diluer la pulpe puis filtrer.', 'Ajouter progressivement et goûter.', 'Équilibrer avec sucre, sel et umami.'],
    image: '/images/cuisine/tamarind-1600.webp',
    imageAlt: 'Gousses de tamarin ouvertes et entières',
    imageWidth: 2304,
    imageHeight: 1268,
    imageWidths: [480, 800, 1200, 1600]
  },
  {
    slug: 'prahok',
    title: 'Prahok',
    intro: 'Un condiment fermenté puissant, essentiel pour comprendre une partie de la cuisine khmère.',
    role: 'Le prahok apporte sel, fermentation et profondeur. Son usage dépend fortement du plat et du dosage ; il gagne à être expliqué dans son contexte plutôt que résumé à son odeur.',
    profile: ['Salin', 'Fermenté', 'Très umami'],
    uses: ['Sauces et dips', 'Soupes', 'Plats mijotés', 'Assaisonnement de préparations traditionnelles'],
    tips: ['Commencer par une petite quantité.', 'Tenir compte de sa salinité avant d’ajouter d’autres sauces.', 'Choisir un produit adapté à l’usage prévu.'],
    image: '/images/cuisine/prahok-1600.webp',
    imageAlt: 'Prahok ktis cambodgien servi avec des légumes',
    imageWidth: 3000,
    imageHeight: 4000,
    imageWidths: [480, 800, 1200, 1600]
  }
];
