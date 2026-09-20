export interface IngredientGuide {
  slug: string;
  title: string;
  intro: string;
  role: string;
  profile: string[];
  uses: string[];
  tips: string[];
}

export const ingredientGuides: IngredientGuide[] = [
  {
    slug: 'kroeung',
    title: 'Kroeung',
    intro: 'La base aromatique qui donne sa profondeur à de nombreux plats khmers.',
    role: 'Le kroeung est une pâte fraîche d’aromates pilés. Sa composition varie selon les préparations, mais la logique reste la même : construire une base parfumée avant la cuisson.',
    profile: ['Citronnelle', 'Galanga', 'Curcuma', 'Combava', 'Ail et échalote'],
    uses: ['Amok', 'Soupes et currys', 'Marinades', 'Grillades'],
    tips: ['Émincer finement avant de piler.', 'Travailler les ingrédients les plus fibreux en premier.', 'Éviter d’ajouter trop de liquide au mixeur.']
  },
  {
    slug: 'poivre-de-kampot',
    title: 'Poivre de Kampot',
    intro: 'Un produit de terroir cambodgien à utiliser comme un véritable ingrédient, pas seulement comme un assaisonnement.',
    role: 'Selon sa maturité et son traitement, le poivre de Kampot développe des profils très différents. Fraîcheur, chaleur et longueur aromatique peuvent devenir une composante centrale du plat.',
    profile: ['Noir : puissant et chaud', 'Rouge : plus mûr et fruité', 'Blanc : fin et direct', 'Vert frais : végétal et vif'],
    uses: ['Lok lak', 'Crabe et fruits de mer', 'Sauces au citron vert', 'Viandes grillées'],
    tips: ['Moudre au dernier moment.', 'Éviter une cuisson longue pour préserver les arômes.', 'Comparer plusieurs maturités sur un même plat.']
  },
  {
    slug: 'tamarin',
    title: 'Tamarin',
    intro: 'Une acidité ronde et fruitée qui permet de construire l’équilibre d’une sauce ou d’une soupe.',
    role: 'Le tamarin apporte une acidité moins tranchante que le citron. Il est utile quand on cherche profondeur et longueur plutôt qu’une simple note fraîche.',
    profile: ['Acidulé', 'Fruité', 'Légèrement sucré'],
    uses: ['Soupes', 'Sauces', 'Poissons', 'Préparations aigres-douces'],
    tips: ['Diluer la pulpe puis filtrer.', 'Ajouter progressivement et goûter.', 'Équilibrer avec sucre, sel et umami.']
  },
  {
    slug: 'prahok',
    title: 'Prahok',
    intro: 'Un condiment fermenté puissant, essentiel pour comprendre une partie de la cuisine khmère.',
    role: 'Le prahok apporte sel, fermentation et profondeur. Son usage dépend fortement du plat et du dosage ; il gagne à être expliqué dans son contexte plutôt que résumé à son odeur.',
    profile: ['Salin', 'Fermenté', 'Très umami'],
    uses: ['Sauces et dips', 'Soupes', 'Plats mijotés', 'Assaisonnement de préparations traditionnelles'],
    tips: ['Commencer par une petite quantité.', 'Tenir compte de sa salinité avant d’ajouter d’autres sauces.', 'Choisir un produit adapté à l’usage prévu.']
  }
];
