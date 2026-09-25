export interface IngredientGuide {
  slug: string;
  title: string;
  intro: string;
  role: string;
  profile: string[];
  uses: string[];
  tips: string[];
  buying: string[];
  storage: string[];
  pairings: string[];
  mistakes: string[];
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
    intro: 'La base aromatique qui donne sa profondeur à de nombreux plats khmers : citronnelle, galanga, curcuma, combava et alliacées pilés jusqu’à former une pâte très parfumée.',
    role: 'Le kroeung n’est pas un simple mélange d’épices. C’est une technique : les aromates frais sont découpés finement puis pilés pour libérer leurs huiles, casser les fibres et créer une pâte qui va parfumer toute la cuisson. La recette varie selon le plat, mais la logique reste la même : construire le parfum avant d’ajouter les ingrédients principaux.',
    profile: [
      'Citronnelle : fraîche, citronnée et végétale',
      'Galanga : boisé, camphré et légèrement poivré',
      'Curcuma frais : terreux, chaud et colorant',
      'Combava : très citronné, presque floral',
      'Ail et échalote : douceur, rondeur et liaison'
    ],
    uses: [
      'Amok de poisson et préparations vapeur',
      'Currys et plats mijotés',
      'Cha kroeung et sautés parfumés',
      'Marinades de viande ou de poisson',
      'Soupes et bouillons aromatiques'
    ],
    tips: [
      'Émincer très finement les ingrédients fibreux avant de piler.',
      'Commencer par citronnelle et galanga, puis ajouter les ingrédients plus tendres.',
      'Au mixeur, travailler par impulsions et ajouter le moins de liquide possible.',
      'Goûter la pâte : elle doit sentir fort avant même la cuisson.'
    ],
    buying: [
      'Choisir une citronnelle ferme, claire et lourde, sans partie molle.',
      'Privilégier le galanga frais quand il est disponible : il doit être ferme et parfumé.',
      'Pour le combava, utiliser surtout le zeste ou les feuilles ; le parfum doit être net dès qu’on les froisse.'
    ],
    storage: [
      'Conserver le kroeung frais 3 à 4 jours au réfrigérateur dans un récipient bien fermé.',
      'Le congeler en petites portions pour pouvoir prélever uniquement la quantité nécessaire.',
      'Les aromates entiers se conservent mieux non lavés et protégés de l’humidité.'
    ],
    pairings: [
      'Poisson blanc + lait de coco + feuilles de combava',
      'Poulet + aubergine + basilic',
      'Bœuf sauté + légumes croquants',
      'Bouillons + tamarin + herbes fraîches'
    ],
    mistakes: [
      'Ajouter trop d’eau au mixeur et obtenir une purée diluée.',
      'Laisser de gros morceaux de citronnelle fibreuse.',
      'Cuire la pâte trop brutalement avant qu’elle n’ait libéré ses parfums.'
    ],
    image: '/images/cuisine/kroeung-1600.webp',
    imageAlt: 'Plat cambodgien parfumé au kroeung',
    imageWidth: 5184,
    imageHeight: 3456,
    imageWidths: [480, 800, 1200, 1600]
  },
  {
    slug: 'poivre-de-kampot',
    title: 'Poivre de Kampot',
    intro: 'Un produit de terroir cambodgien à utiliser comme un véritable ingrédient : vert et végétal, noir et chaud, rouge plus mûr, blanc plus direct.',
    role: 'Le poivre de Kampot peut structurer un plat à lui seul. Il ne sert pas seulement à relever : sa fraîcheur, sa chaleur et ses notes aromatiques peuvent accompagner une sauce au citron vert, un crabe, une viande saisie ou simplement finir une assiette au dernier moment.',
    profile: [
      'Vert frais : végétal, vif et très aromatique',
      'Noir : chaud, puissant et long en bouche',
      'Rouge : mûr, fruité et plus rond',
      'Blanc : direct, fin et plus sec'
    ],
    uses: [
      'Lok lak et condiment citron vert-poivre',
      'Crabe, crevettes et fruits de mer',
      'Viandes grillées ou saisies',
      'Sauces courtes au citron vert',
      'Finition sur légumes rôtis ou œufs'
    ],
    tips: [
      'Moudre ou concasser juste avant de servir.',
      'Ajouter une partie du poivre en fin de cuisson pour préserver son nez.',
      'Avec le poivre vert frais, cuisiner les grappes entières ou légèrement écrasées.',
      'Goûter avant de saler davantage : la sauce d’accompagnement peut déjà être très assaisonnée.'
    ],
    buying: [
      'Rechercher la mention d’origine Kampot et un producteur ou conditionneur identifiable.',
      'Les grains secs doivent être entiers, très odorants et non poussiéreux.',
      'Le poivre vert frais doit rester souple, bien vert et sans grains desséchés.'
    ],
    storage: [
      'Conserver le poivre sec entier dans un contenant opaque et hermétique.',
      'Éviter la chaleur et la lumière qui font perdre les arômes volatils.',
      'Le poivre vert frais se garde peu de temps au réfrigérateur ; l’utiliser rapidement.'
    ],
    pairings: [
      'Citron vert + bœuf saisi',
      'Crabe + ail + poivre vert',
      'Crevettes + sauce courte',
      'Œufs + herbes fraîches'
    ],
    mistakes: [
      'Acheter du poivre déjà moulu et perdre une grande partie de son parfum.',
      'Le cuire trop longtemps dans une sauce lourde.',
      'Utiliser la même quantité de poivre vert frais et de poivre noir sec sans goûter.'
    ],
    image: '/images/cuisine/kampot-1600.webp',
    imageAlt: 'Grappes de poivre vert de Kampot sur le plant',
    imageWidth: 6000,
    imageHeight: 4000,
    imageWidths: [480, 800, 1200, 1600]
  },
  {
    slug: 'tamarin',
    title: 'Tamarin',
    intro: 'Une acidité ronde, fruitée et profonde qui permet de construire l’équilibre d’une sauce ou d’une soupe sans donner la même fraîcheur tranchante qu’un citron.',
    role: 'Le tamarin apporte une acidité qui reste longtemps en bouche. C’est un bon outil pour équilibrer une préparation riche, un bouillon ou une sauce aigre-douce : on l’ajoute progressivement, puis on ajuste sucre, sel et umami autour de lui.',
    profile: [
      'Acidité ronde et persistante',
      'Notes fruitées et légèrement confites',
      'Douceur naturelle variable selon les produits',
      'Couleur brun ambré après dilution'
    ],
    uses: [
      'Soupes acidulées',
      'Sauces pour poisson ou fruits de mer',
      'Préparations aigres-douces',
      'Marinades',
      'Condiments avec sucre de palme et sauce de poisson'
    ],
    tips: [
      'Diluer la pulpe dans de l’eau chaude puis filtrer graines et fibres.',
      'Ajouter peu à peu : l’acidité monte rapidement.',
      'Équilibrer avec sucre de palme plutôt qu’avec beaucoup de sucre blanc.',
      'Toujours regoûter après réduction, car l’acidité se concentre.'
    ],
    buying: [
      'La pulpe compacte est pratique et permet de doser la concentration.',
      'Vérifier la liste d’ingrédients : certaines pâtes prêtes à l’emploi contiennent déjà sucre ou sel.',
      'Une pulpe naturelle doit sentir le fruit acidulé, sans arôme artificiel dominant.'
    ],
    storage: [
      'La pulpe compacte se conserve longtemps au sec une fois bien emballée.',
      'Une eau de tamarin préparée maison se conserve quelques jours au réfrigérateur.',
      'Congeler l’extrait en petits glaçons pour un dosage rapide.'
    ],
    pairings: [
      'Poisson + herbes fraîches',
      'Crevettes + sucre de palme',
      'Bouillon + tomate + aromates',
      'Sauce de poisson + piment + ail'
    ],
    mistakes: [
      'Verser trop d’extrait d’un coup.',
      'Confondre acidité et fraîcheur : le citron vert ne produit pas le même résultat.',
      'Oublier que la concentration varie beaucoup d’une pâte de tamarin à l’autre.'
    ],
    image: '/images/cuisine/tamarind-1600.webp',
    imageAlt: 'Gousses de tamarin ouvertes et entières',
    imageWidth: 2304,
    imageHeight: 1268,
    imageWidths: [480, 800, 1200, 1600]
  },
  {
    slug: 'prahok',
    title: 'Prahok',
    intro: 'Un condiment de poisson fermenté puissant, salin et très umami, essentiel pour comprendre une partie de la profondeur aromatique de la cuisine khmère.',
    role: 'Le prahok apporte fermentation, sel et longueur en bouche. Son intensité varie selon les produits et les préparations. On peut l’utiliser comme assaisonnement dans un plat, le cuire dans une sauce ou le travailler au centre d’une préparation comme le prahok ktis.',
    profile: [
      'Très umami',
      'Salin et fermenté',
      'Arôme puissant cru',
      'Goût plus rond une fois intégré à une préparation cuite'
    ],
    uses: [
      'Sauces et dips avec légumes',
      'Prahok ktis au porc et au lait de coco',
      'Soupes et plats mijotés',
      'Assaisonnement de farces ou préparations traditionnelles',
      'Petites quantités dans des sauces pour renforcer l’umami'
    ],
    tips: [
      'Commencer par une petite quantité puis goûter.',
      'Réduire le sel ou la sauce de poisson tant que le dosage final de prahok n’est pas fixé.',
      'Le chauffer dans une préparation adoucit son impact aromatique.',
      'Associer avec herbes, agrumes et légumes frais pour créer du contraste.'
    ],
    buying: [
      'Choisir un produit clairement étiqueté et destiné à l’usage culinaire.',
      'Comparer la texture et la salinité : certains prahok sont très concentrés.',
      'Pour une première découverte, privilégier une préparation où il est cuit et associé à d’autres ingrédients.'
    ],
    storage: [
      'Après ouverture, suivre les indications du fabricant et conserver au froid quand c’est demandé.',
      'Utiliser toujours un ustensile propre pour éviter les contaminations croisées.',
      'Fermer soigneusement le contenant : son parfum est puissant.'
    ],
    pairings: [
      'Porc + lait de coco + légumes crus',
      'Aubergine + herbes fraîches',
      'Citronnelle + combava + piment',
      'Concombre, chou et crudités croquantes'
    ],
    mistakes: [
      'Le doser comme une sauce de poisson classique.',
      'Ajouter du sel avant d’avoir goûté la préparation finale.',
      'Le juger uniquement sur son odeur crue au lieu de voir son rôle dans le plat.'
    ],
    image: '/images/cuisine/prahok-1600.webp',
    imageAlt: 'Prahok ktis cambodgien servi avec des légumes',
    imageWidth: 3000,
    imageHeight: 4000,
    imageWidths: [480, 800, 1200, 1600]
  }
];
