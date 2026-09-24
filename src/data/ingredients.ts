export interface IngredientGuide {
  slug: string;
  title: string;
  intro: string;
  role: string;
  profile: string[];
  uses: string[];
  tips: string[];
  choose: string[];
  keep: string[];
  pairings: string[];
  mistakes: string[];
  seoDescription: string;
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
    intro: 'La base aromatique qui donne sa profondeur à de nombreux plats khmers : fraîche, fibreuse, citronnée, chaude et très parfumée.',
    role: 'Le kroeung est une famille de pâtes fraîches d’aromates pilés. La recette change selon le plat, mais la logique reste la même : réduire les fibres, libérer les huiles aromatiques puis construire une base capable de parfumer toute la préparation.',
    profile: ['Citronnelle fraîche et végétale', 'Galanga camphré et boisé', 'Curcuma terreux et chaud', 'Combava citronné et floral', 'Ail et échalote pour la rondeur'],
    uses: ['Amok et currys', 'Soupes parfumées', 'Marinades de viande ou de poisson', 'Grillades et sautés'],
    tips: ['Émincer très finement avant de piler.', 'Commencer par les ingrédients les plus fibreux.', 'Piler jusqu’à ne presque plus distinguer les morceaux.', 'Au mixeur, ajouter le moins de liquide possible.'],
    choose: ['Privilégier une citronnelle ferme et fraîche.', 'Choisir du galanga dense, sans zones molles.', 'Utiliser un curcuma frais bien coloré quand il est disponible.', 'Le zeste de combava doit être très parfumé, sans excès de partie blanche.'],
    keep: ['Le kroeung frais se garde quelques jours au réfrigérateur dans un contenant hermétique.', 'Pour une conservation plus longue, le congeler en petites portions.', 'Les aromates entiers se conservent mieux que la pâte déjà pilée.'],
    pairings: ['Poisson blanc et fruits de mer', 'Poulet et porc', 'Lait de coco', 'Prahok et sauce de poisson', 'Herbes fraîches et feuilles de combava'],
    mistakes: ['Laisser de gros morceaux de citronnelle.', 'Diluer excessivement au mixeur.', 'Faire brûler la pâte à feu trop vif.', 'Chercher une recette unique alors que le kroeung varie selon les plats.'],
    seoDescription: 'Comprendre le kroeung cambodgien : ingrédients, goût, méthode au mortier, usages, conservation et erreurs à éviter pour réussir cette base de la cuisine khmère.',
    image: '/images/cuisine/kroeung-1600.webp',
    imageAlt: 'Préparation cambodgienne parfumée au kroeung',
    imageWidth: 5184,
    imageHeight: 3456,
    imageWidths: [480, 800, 1200, 1600]
  },
  {
    slug: 'poivre-de-kampot',
    title: 'Poivre de Kampot',
    intro: 'Un poivre de terroir cambodgien à utiliser comme un ingrédient à part entière : floral, chaud, végétal ou fruité selon sa maturité.',
    role: 'Le Poivre de Kampot est lié à une indication géographique protégée. Vert frais, noir, rouge ou blanc, il offre des profils différents et peut devenir le fil conducteur d’une sauce, d’un plat de fruits de mer ou d’une viande saisie.',
    profile: ['Noir : chaud, intense et aromatique', 'Rouge : mûr, plus fruité et rond', 'Blanc : net, fin et direct', 'Vert frais : végétal, croquant et très vif'],
    uses: ['Lok lak', 'Crabe, crevettes et fruits de mer', 'Condiment citron vert-poivre', 'Viandes grillées et sauces courtes'],
    tips: ['Moudre au dernier moment.', 'Ajouter une partie du poivre en fin de cuisson.', 'Goûter les maturités séparément.', 'Avec du poivre vert frais, privilégier une cuisson courte.'],
    choose: ['Préférer des grains entiers très aromatiques.', 'Vérifier l’origine et la mention Kampot sur le produit.', 'Pour le vert frais, rechercher des grappes fermes et bien colorées.', 'Éviter les poudres éventées si le poivre doit être central dans le plat.'],
    keep: ['Conserver les grains secs à l’abri de la lumière et de l’humidité.', 'Ne moudre que la quantité nécessaire.', 'Le poivre vert frais doit être utilisé rapidement ou conservé selon les recommandations du producteur.'],
    pairings: ['Citron vert', 'Crabe et fruits de mer', 'Bœuf', 'Ail', 'Sauces salées-acidulées'],
    mistakes: ['Le faire cuire trop longtemps.', 'Le réduire en poudre longtemps à l’avance.', 'Confondre force piquante et complexité aromatique.', 'En mettre tellement que le reste du plat disparaît.'],
    seoDescription: 'Poivre de Kampot : différences entre vert, noir, rouge et blanc, usages en cuisine cambodgienne, conservation, accords et conseils pour préserver ses arômes.',
    image: '/images/cuisine/kampot-1600.webp',
    imageAlt: 'Grappes de poivre vert de Kampot sur le plant',
    imageWidth: 6000,
    imageHeight: 4000,
    imageWidths: [480, 800, 1200, 1600]
  },
  {
    slug: 'tamarin',
    title: 'Tamarin',
    intro: 'Une acidité ronde, fruitée et profonde qui aide à équilibrer sauces, soupes et plats aigres-doux sans la vivacité tranchante du citron.',
    role: 'Le tamarin apporte une acidité complexe, légèrement fruitée et parfois douce. En cuisine, il sert moins à « rendre acide » qu’à donner de la longueur et à équilibrer sucre, sel, fermentation et richesse.',
    profile: ['Acidulé sans être citronné', 'Fruité et sombre', 'Légèrement sucré selon le produit', 'Long en bouche'],
    uses: ['Soupes et bouillons', 'Sauces aigres-douces', 'Poissons', 'Dips et condiments'],
    tips: ['Diluer la pulpe dans de l’eau tiède.', 'Malaxer puis filtrer pour retirer fibres et graines.', 'Ajouter par petites quantités et goûter.', 'Rééquilibrer avec sucre, sel et umami.'],
    choose: ['Une pâte de tamarin sans sucre ajouté donne plus de contrôle.', 'La pulpe en bloc permet de préparer une eau de tamarin fraîche.', 'Éviter les concentrés très sucrés si la recette demande une acidité nette.'],
    keep: ['La pâte industrielle se conserve selon l’étiquette après ouverture.', 'Une eau de tamarin maison se garde peu de temps au réfrigérateur.', 'La pulpe sèche ou en bloc se conserve dans un emballage bien fermé.'],
    pairings: ['Poisson et fruits de mer', 'Sucre de palme', 'Prahok ou sauce de poisson', 'Ail et échalote', 'Herbes fraîches'],
    mistakes: ['Verser toute l’acidité d’un coup.', 'Utiliser un concentré sucré sans adapter le reste.', 'Chercher le même profil qu’un citron vert.', 'Oublier que la cuisson peut adoucir la perception acide.'],
    seoDescription: 'Tamarin en cuisine cambodgienne : goût, préparation de la pulpe, dosage, accords, conservation et conseils pour équilibrer les saveurs khmères.',
    image: '/images/cuisine/tamarind-1600.webp',
    imageAlt: 'Gousses de tamarin ouvertes et entières',
    imageWidth: 2304,
    imageHeight: 1268,
    imageWidths: [480, 800, 1200, 1600]
  },
  {
    slug: 'prahok',
    title: 'Prahok',
    intro: 'Une pâte de poisson salé et fermenté, puissante et profondément umami, essentielle pour comprendre une partie de la cuisine khmère.',
    role: 'Le prahok est une fermentation de poisson utilisée comme assaisonnement, condiment ou composante principale. Son rôle est d’apporter sel, profondeur et longueur : bien dosé, il donne du relief sans forcément dominer le plat.',
    profile: ['Très umami', 'Salin', 'Fermenté', 'Puissant au nez', 'Long et savoureux en bouche'],
    uses: ['Dips et sauces à légumes', 'Soupes', 'Plats mijotés', 'Préparations grillées ou cuites en feuille'],
    tips: ['Commencer par une petite quantité.', 'Goûter avant d’ajouter d’autres produits salés.', 'Le cuire ou le diluer selon la recette.', 'Associer sa puissance à des herbes et légumes frais.'],
    choose: ['Choisir un produit étiqueté clairement et adapté à l’usage culinaire.', 'La texture, le niveau de sel et la fermentation peuvent varier fortement.', 'Pour découvrir le prahok, commencer par une préparation où il est mélangé à d’autres ingrédients.'],
    keep: ['Respecter les conditions de conservation du fabricant après ouverture.', 'Utiliser une cuillère propre à chaque prélèvement.', 'Fermer soigneusement le contenant pour préserver le produit et limiter les odeurs dans le réfrigérateur.'],
    pairings: ['Crudités croquantes', 'Herbes fraîches', 'Citronnelle et kroeung', 'Porc ou poisson', 'Riz blanc'],
    mistakes: ['Le juger uniquement à son odeur brute.', 'Ajouter du sel sans tenir compte de sa salinité.', 'Le surdoser dès la première utilisation.', 'Le substituer automatiquement par de la sauce de poisson : le profil n’est pas le même.'],
    seoDescription: 'Prahok cambodgien : goût, fermentation, usages, dosage, conservation et accords pour comprendre cette pâte de poisson essentielle à la cuisine khmère.',
    image: '/images/cuisine/prahok-1600.webp',
    imageAlt: 'Prahok ktis cambodgien servi avec des légumes',
    imageWidth: 3000,
    imageHeight: 4000,
    imageWidths: [480, 800, 1200, 1600]
  }
];
