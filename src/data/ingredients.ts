export interface IngredientGuide {
  slug: string;
  title: string;
  intro: string;
  role: string;
  deepDive: string[];
  profile: string[];
  uses: string[];
  tips: string[];
  buying: string[];
  storage: string[];
  pairings: string[];
  avoid: string[];
  seoKeywords: string[];
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
    role: 'Le kroeung est une famille de pâtes fraîches d’aromates pilés. Il ne sert pas seulement à parfumer : il construit le fond du plat avant même que la cuisson commence.',
    deepDive: [
      'Un kroeung se construit par couches. Les ingrédients les plus fibreux — citronnelle, galanga — se travaillent d’abord, puis viennent curcuma, zeste de combava, ail et échalote. Cette progression aide à obtenir une pâte fine sans noyer les aromates.',
      'La texture compte autant que la liste des ingrédients. Une pâte trop grossière reste fibreuse en bouche ; une pâte trop diluée perd sa concentration. Au mortier, les huiles essentielles se libèrent progressivement et l’odeur devient plus ronde.',
      'Il existe plusieurs profils de kroeung. La version jaune met davantage en avant le curcuma ; d’autres préparations jouent sur les herbes, le piment ou les proportions de racines. Mieux vaut comprendre la logique que chercher une formule unique.'
    ],
    profile: ['Citronné et végétal', 'Chaud et terreux', 'Très aromatique', 'Frais avant cuisson', 'Plus rond après cuisson'],
    uses: ['Amok', 'Soupes et currys', 'Marinades', 'Grillades', 'Sautés parfumés'],
    tips: ['Émincer très finement avant de piler.', 'Travailler les ingrédients les plus fibreux en premier.', 'Au mixeur, ajouter le moins de liquide possible.', 'Goûter et sentir la pâte avant de cuire.'],
    buying: ['Privilégier des tiges de citronnelle fermes et non desséchées.', 'Choisir galanga et curcuma frais, fermes et sans zones molles.', 'Pour le combava, utiliser très peu de zeste et éviter le blanc amer.'],
    storage: ['Conserver 2 à 3 jours au réfrigérateur dans un contenant hermétique.', 'Congeler en petites portions pour disposer d’une base prête à cuisiner.', 'Éviter de le laisser longtemps à l’air : les parfums les plus volatils disparaissent vite.'],
    pairings: ['Poisson blanc', 'Poulet', 'Lait de coco', 'Basilic asiatique', 'Poivre', 'Légumes croquants'],
    avoid: ['Une pâte trop liquide.', 'Des morceaux de citronnelle trop gros.', 'Une cuisson très longue avant d’ajouter les autres ingrédients.'],
    seoKeywords: ['kroeung', 'kroeung cambodgien', 'pâte aromatique khmère', 'citronnelle galanga curcuma', 'base cuisine cambodgienne'],
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
    deepDive: [
      'Le poivre vert frais est végétal, vif et juteux. Le noir est plus chaud et structuré, le rouge plus mûr et fruité, le blanc plus direct. Ces profils permettent de choisir le poivre selon le plat plutôt que de l’utiliser automatiquement.',
      'Dans une recette comme le lok lak, le poivre fonctionne avec l’acidité du citron vert : la chaleur du poivre arrive d’abord, puis l’acidité rafraîchit la bouche. Sur les produits de la mer, quelques grains ou une mouture fraîche suffisent souvent.',
      'Le Poivre de Kampot bénéficie d’une protection liée à son origine et à son cahier des charges. Cette notion de terroir explique pourquoi il mérite d’être traité comme un produit à part entière.'
    ],
    profile: ['Noir : puissant et chaud', 'Rouge : plus mûr et fruité', 'Blanc : fin et direct', 'Vert frais : végétal et vif'],
    uses: ['Lok lak', 'Crabe et fruits de mer', 'Sauces au citron vert', 'Viandes grillées', 'Assaisonnement final'],
    tips: ['Moudre au dernier moment.', 'Éviter une cuisson longue pour préserver les arômes.', 'Comparer plusieurs maturités sur un même plat.', 'Commencer par peu : un poivre frais peut être très expressif.'],
    buying: ['Chercher une origine clairement indiquée et un emballage qui protège de l’humidité.', 'Pour les grains secs, privilégier des grains entiers plutôt qu’une poudre déjà moulue.', 'Le poivre vert frais doit rester ferme et bien coloré.'],
    storage: ['Conserver les grains secs au sec, à l’abri de la lumière et de la chaleur.', 'Moudre uniquement la quantité nécessaire.', 'Le poivre vert frais se conserve au réfrigérateur et doit être utilisé rapidement.'],
    pairings: ['Bœuf', 'Crabe', 'Crevettes', 'Citron vert', 'Ail', 'Sauces courtes'],
    avoid: ['Le poivre déjà moulu depuis longtemps.', 'Une cuisson prolongée qui écrase les notes florales.', 'Surcharger une sauce au point de masquer l’acidité et le produit principal.'],
    seoKeywords: ['poivre de Kampot', 'poivre cambodgien', 'poivre vert Kampot', 'lok lak poivre', 'épices Cambodge'],
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
    deepDive: [
      'La pulpe de tamarin se dilue généralement dans de l’eau tiède puis se filtre. On obtient un liquide brun acidulé que l’on ajoute progressivement, exactement comme on ajusterait du sel.',
      'Son intérêt est l’équilibre : avec du sucre de palme, du sel ou une sauce fermentée, il crée une acidité ample qui reste présente sans donner l’impression de boire du jus de citron.',
      'Dans les soupes et sauces, le tamarin gagne à être ajouté par étapes. Le goût évolue avec la réduction et les autres assaisonnements, il faut donc goûter plusieurs fois.'
    ],
    profile: ['Acidulé', 'Fruité', 'Légèrement sucré', 'Plus rond que le citron'],
    uses: ['Soupes', 'Sauces', 'Poissons', 'Préparations aigres-douces', 'Condiments'],
    tips: ['Diluer la pulpe puis filtrer.', 'Ajouter progressivement et goûter.', 'Équilibrer avec sucre, sel et umami.', 'Préparer un petit concentré plutôt que d’ajouter de gros morceaux directement.'],
    buying: ['La pulpe pressée sans trop d’additifs est pratique pour cuisiner.', 'Vérifier la liste d’ingrédients des concentrés : certains sont déjà sucrés ou salés.', 'Une pulpe sombre et souple se dose plus facilement qu’un bloc très sec.'],
    storage: ['Conserver la pulpe bien emballée au réfrigérateur après ouverture.', 'Le liquide dilué se garde seulement quelques jours au frais.', 'Congeler de petites portions si vous n’en utilisez qu’occasionnellement.'],
    pairings: ['Poisson', 'Crevettes', 'Sucre de palme', 'Sauce de poisson', 'Piment', 'Herbes fraîches'],
    avoid: ['Verser tout le tamarin d’un coup.', 'Utiliser un concentré sucré comme s’il s’agissait de pulpe nature.', 'Chercher une acidité aussi vive que celle du citron.'],
    seoKeywords: ['tamarin cuisine cambodgienne', 'pulpe de tamarin', 'sauce tamarin', 'acidité cuisine khmère'],
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
    deepDive: [
      'Le prahok est une préparation de poisson fermenté dont l’intensité varie selon le produit et l’usage. En cuisine, on peut l’utiliser en petite quantité comme source d’umami ou lui donner une place beaucoup plus centrale.',
      'Sa puissance aromatique change après cuisson. Dans une sauce ou un plat mijoté, les notes les plus agressives s’arrondissent et la profondeur salée se fond avec les autres ingrédients.',
      'Le bon réflexe est de le considérer comme un assaisonnement complet : avant d’ajouter sauce de poisson ou sel, il faut goûter. Une très petite quantité peut suffire à modifier toute la perception d’un plat.'
    ],
    profile: ['Salin', 'Fermenté', 'Très umami', 'Puissant cru', 'Plus rond après cuisson'],
    uses: ['Sauces et dips', 'Soupes', 'Plats mijotés', 'Assaisonnement', 'Préparations traditionnelles'],
    tips: ['Commencer par une petite quantité.', 'Tenir compte de sa salinité avant d’ajouter d’autres sauces.', 'Le faire cuire quand la recette le demande pour arrondir le profil.', 'Goûter avant tout nouvel ajout de sel.'],
    buying: ['Choisir un produit clairement étiqueté et adapté à l’usage prévu.', 'Vérifier la texture et la présence éventuelle d’assaisonnements déjà ajoutés.', 'Pour débuter, un produit homogène et facile à doser est plus simple à apprivoiser.'],
    storage: ['Conserver au réfrigérateur après ouverture.', 'Toujours utiliser un ustensile propre pour éviter les contaminations.', 'Fermer hermétiquement pour limiter les odeurs dans le réfrigérateur.'],
    pairings: ['Porc', 'Légumes croquants', 'Aubergine', 'Herbes fraîches', 'Lait de coco', 'Piment'],
    avoid: ['Ajouter du sel avant d’avoir goûté.', 'Le doser comme une sauce légère.', 'Réduire le prahok à son odeur : son intérêt est surtout la profondeur qu’il apporte au plat.'],
    seoKeywords: ['prahok', 'poisson fermenté cambodgien', 'condiment khmer', 'umami cambodgien', 'prahok cuisine'],
    image: '/images/cuisine/prahok-1600.webp',
    imageAlt: 'Prahok ktis cambodgien servi avec des légumes',
    imageWidth: 3000,
    imageHeight: 4000,
    imageWidths: [480, 800, 1200, 1600]
  }
];
