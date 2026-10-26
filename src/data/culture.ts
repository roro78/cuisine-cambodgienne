export interface CultureArticle {
  slug: string;
  title: string;
  eyebrow: string;
  intro: string;
  seoDescription: string;
  readingTime: string;
  sections: { title: string; paragraphs: string[] }[];
  sources: { label: string; url: string }[];
  image: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  imageWidths: number[];
  /** Illustration locale approuvée pour le catalogue social; distincte de la photo documentaire du carnet. */
  socialImage?: string;
  /** Rôle du visuel social : une photographie historique n'est pas une illustration. */
  socialImageRole?: 'article' | 'illustration';
  gallery?: { image: string; imageAlt: string; caption: string; credit: string; source: string; width: number; height: number }[];
}

const tourismGuide = 'https://tourismcambodia.org/public/index.php/official-activities/new-beginnings-a-gourmet-guide-to-cambodia';

export const cultureArticles: CultureArticle[] = [
  {
    slug: 'le-riz-symbole-de-vie-au-cambodge',
    title: 'Le riz, au cœur de la vie cambodgienne',
    eyebrow: 'Vie quotidienne',
    intro: 'Dans une maison de village, sur une table de Phnom Penh ou au bord d’une rizière, le riz est bien davantage qu’un accompagnement : il nourrit, rassemble et fait vivre. Découvrons le riz cambodgien, de ses variétés parfumées aux plats du quotidien.',
    seoDescription: 'Le riz au cœur de la vie cambodgienne : rizières, familles, fêtes, variétés et première place partagée du Phka Rumduol au concours mondial 2025.',
    readingTime: '5 min',
    sections: [
      {
        title: 'Le riz, au cœur du quotidien cambodgien',
        paragraphs: [
          'Au Cambodge, le riz se retrouve dans des cuisines très différentes, chez les familles modestes comme dans les grandes maisons, sur les marchés, dans les cantines et au restaurant. La quantité, la variété, les plats servis autour de lui et les habitudes de table peuvent changer selon les moyens et les régions. Mais le riz demeure un point de rencontre.',
          'On le prépare souvent nature, puis on l’accompagne de poisson, d’une soupe, de légumes, d’œufs, de viande, de condiments ou d’un plat mijoté. Son goût discret n’est pas un défaut : il permet aux autres saveurs de s’exprimer. Un petit plat très relevé prend une autre dimension lorsqu’il est partagé avec du riz chaud.',
          'Le riz est une culture vivrière majeure du Cambodge. C’est à la fois une composante essentielle de l’alimentation et un produit agricole qui fait vivre de nombreuses familles. Il serait pourtant faux de réduire tous les repas cambodgiens à une assiette identique : les habitudes et les ressources varient.'
        ]
      },
      {
        title: 'Du petit déjeuner au dîner : mille façons de manger du riz',
        paragraphs: [
          'Le matin, le riz peut prendre la forme d’un bai sach chrouk, avec du porc grillé, ou d’un bobor, une bouillie de riz servie chaude et agrémentée selon les goûts. Au déjeuner ou au dîner, il accompagne volontiers un amok, un curry, un lok lak ou du poisson préparé simplement.',
          'Il existe aussi des plats où le riz change complètement de texture : riz sauté, riz gluant pour certaines douceurs, grains grillés ou aplatis. On le transforme en farine, en galettes ou en nouilles de riz, comme celles du num banh chok. Le riz se mange donc en grains, mais il entre aussi dans une multitude de préparations.',
          'Dans bien des repas, le riz garde sa place dans un bol ou une assiette et les autres mets se partagent à côté. Ailleurs, il est intégré à la préparation elle-même. Cette diversité raconte autant la vie des familles que l’inventivité des cuisines de rue et des marchés.'
        ]
      },
      {
        title: 'Derrière chaque bol, une saison et le travail des rizières',
        paragraphs: [
          'Les paysages rizicoles sont indissociables de nombreuses régions cambodgiennes, notamment les plaines irriguées par les pluies de mousson et les grands bassins fluviaux. Selon les zones, les agriculteurs sèment ou repiquent, surveillent l’eau, entretiennent les parcelles, puis récoltent, sèchent et conservent le paddy : le grain encore entouré de son enveloppe.',
          'Une récolte dépend de la pluie, de l’accès à l’eau, des semences, des coûts et du travail disponible. Le riz est donc également une question de revenus, de sécurité alimentaire et de conditions de vie. Des récoltes abondantes n’impliquent pas automatiquement une bonne rémunération pour chaque producteur.',
          'Sur le marché, on achète du riz blanchi, parfois complet ou gluant ; derrière ces sacs se trouvent des variétés, des territoires et des choix de culture. Parler du riz cambodgien, c’est aussi parler des personnes qui le produisent.'
        ]
      },
      {
        title: 'Qu’appelle-t-on « riz cambodgien » ?',
        paragraphs: [
          'Il n’existe pas un seul riz cambodgien. Le pays cultive différents types de riz : des grains longs parfumés, des riz blancs plus courants, du riz gluant et d’autres variétés adaptées aux terres et aux saisons. Leur parfum, leur texture et leur tenue à la cuisson ne sont pas identiques.',
          'Le Phka Rumduol, souvent cité sous l’orthographe Phka Romdoul, est une variété cambodgienne de riz parfumé. Le nom commercial Malys Angkor est associé à ce riz de qualité destiné notamment aux marchés d’exportation. Il ne faut pas confondre le nom de la variété, le nom utilisé sur le marché et l’ensemble des riz produits au Cambodge.',
          'Sur les marchés, le mot « jasmin » peut désigner des riz parfumés venant de pays différents. La provenance et les appellations commerciales ne se confondent pas avec une variété cultivée sur un territoire particulier. Le développement des filières d’exportation a aussi donné au riz cambodgien une visibilité nouvelle au-delà des frontières.'
        ]
      },
      {
        title: 'Un riz récompensé sept fois au niveau mondial',
        paragraphs: [
          'En novembre 2025, lors de la World Rice Conference organisée à Phnom Penh par The Rice Trader, le Malys Angkor cambodgien (variété Phka Rumduol) a partagé la première place du concours « World’s Best Rice 2025 » avec le riz vietnamien ST25. Il s’agissait de la septième distinction remportée par un riz cambodgien dans ce concours, après 2012, 2013, 2014, 2018, 2022 et 2024.',
          'Ce prix valorise un riz parfumé, la qualité du grain et le savoir-faire de la filière. Ce n’est pas un classement permanent de tous les riz vendus dans le monde : il s’agit d’une récompense attribuée dans le cadre d’un concours professionnel annuel.',
          'La reconnaissance internationale est réelle, mais le véritable enjeu reste aussi très concret : produire une qualité régulière, préserver les terres et permettre aux agriculteurs de vivre convenablement de leur travail.'
        ]
      },
      {
        title: 'Le riz dans les fêtes, les gestes et la transmission',
        paragraphs: [
          'La culture du riz dépasse la cuisine. La préparation des champs et les récoltes rythment certaines activités rurales, tandis que des savoir-faire se transmettent entre générations. Les usages changent selon les régions, les familles et les époques : il n’y a pas une seule tradition uniforme.',
          'La période de la fête de l’Eau, Bon Om Touk, réunit plusieurs célébrations, dont les salutations à la lune, Sampeah Preah Khe, et l’Ok Ambok. Cette dernière est associée au riz grillé puis aplati, souvent consommé avec de la banane ou de la noix de coco. Ces traditions relient les rythmes agricoles, la gratitude pour les récoltes et les moments de rassemblement, avec des pratiques variables selon les lieux.'
        ]
      },
      {
        title: 'Des rizières aux marchés, une filière qui relie les territoires',
        paragraphs: [
          'Après la récolte, le riz traverse encore plusieurs métiers avant d’arriver dans les maisons. Il faut transporter le paddy, le sécher et le transformer, puis le distribuer vers des marchés ou des commerces. Les riziculteurs, les transporteurs, les rizeries et les vendeurs appartiennent ainsi à une même histoire économique.',
          'La valeur produite dans cette filière ne se répartit pas nécessairement de façon égale. Entre le coût du travail agricole, les risques liés à la météo et les prix de vente, chaque acteur fait face à des contraintes différentes. La notoriété internationale d’une variété ne garantit pas, à elle seule, une amélioration du revenu de chaque famille qui cultive du riz.',
          'Le riz cambodgien est donc à la fois un aliment familier, un paysage agricole, un produit échangé et un patrimoine vivant. De la rizière aux villes et aux marchés d’exportation, son histoire relie des personnes qui ne partagent pas toutes la même table mais dépendent, chacune à leur manière, de cette culture.'
        ]
      }
    ],
    socialImage: '/images/cuisine/v17-khmer-table-1280.webp',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Cambodia%27s_rice_fields.jpg/1280px-Cambodia%27s_rice_fields.jpg',
    imageAlt: 'Rizières verdoyantes près de Siem Reap, au Cambodge, avec des palmiers à l’horizon',
    imageWidth: 1280,
    imageHeight: 720,
    imageWidths: [],
    gallery: [
      {
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Cambodian_farmers_planting_rice.jpg/1280px-Cambodian_farmers_planting_rice.jpg',
        imageAlt: 'Agriculteurs cambodgiens repiquant des jeunes plants de riz dans une rizière inondée',
        caption: 'Dans les rizières, le repiquage demande du temps et un travail collectif.',
        credit: 'Brad Collis · CC BY 2.0',
        source: 'https://commons.wikimedia.org/wiki/File:Cambodian_farmers_planting_rice.jpg',
        width: 1280,
        height: 851
      },
      {
        image: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Cambodia_rice.jpg',
        imageAlt: 'Épis de riz en croissance photographiés au Cambodge, au premier plan',
        caption: 'Avant d’être un grain dans le bol, le riz grandit sur une plante que cultivent les familles agricoles.',
        credit: 'Chhoukkosal · CC BY-SA 4.0 · photographie recadrée à l’affichage',
        source: 'https://commons.wikimedia.org/wiki/File:Cambodia_rice.jpg',
        width: 960,
        height: 1280
      },
      {
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Ak_Ambok.jpg/960px-Ak_Ambok.jpg',
        imageAlt: 'Ambok cambodgien dans un plat, accompagné de bananes et de noix de coco',
        caption: 'L’ambok, riz aplati associé aux moments de fête, ici servi avec de la banane et de la noix de coco.',
        credit: 'Willuconquer · CC BY-SA 4.0',
        source: 'https://commons.wikimedia.org/wiki/File:Ak_Ambok.jpg',
        width: 960,
        height: 1280
      }
    ],
    sources: [
      { label: 'FAO — Le riz et les moyens de subsistance au Cambodge', url: 'https://www.fao.org/hand-in-hand/previous-editions/hih-IF-2024/cambodia/en' },
      { label: 'FAO — Agriculture et alimentation au Cambodge', url: 'https://www.fao.org/cambodia/our-office/cambodia-at-a-glance/en' },
      { label: 'Agence Kampuchea Presse (9 novembre 2025) — Malys Angkor primé pour la septième fois', url: 'https://www.akp.gov.kh/fr/post/detail/352733' },
      { label: 'Vietnam News Agency (10 novembre 2025) — Le titre 2025 partagé avec le riz vietnamien ST25', url: 'https://vietnam.vnanet.vn/french/tin-van/le-riz-vietnamien-st25-sacre-trois-fois-meilleur-riz-du-monde-414190.html' },
      { label: 'Agence Kampuchea Presse (5 janvier 2026) — Riz Phka Rumduol et exportations', url: 'https://akp.gov.kh/fr/post/detail/358182' },
      { label: 'Ang Choulean — entretien sur les origines de la fête de l’Eau et l’Ok Ambok (novembre 2025)', url: 'https://cambodianess.com/index.php/article/exploring-the-roots-of-the-water-festival' },
      { label: 'Agence Kampuchea Presse — fête de l’Eau et Ok Ambok (3 novembre 2025)', url: 'https://www.akp.gov.kh/fr/post/detail/352424' }
    ]
  },
  {
    slug: 'poivre-de-kampot',
    title: 'Le poivre de Kampot, de la plantation à la table',
    eyebrow: 'Terroirs et marchés',
    intro: 'Un grain de poivre paraît minuscule dans une assiette. Pourtant, dans le sud du Cambodge, celui de Kampot raconte tout un territoire : des terres cultivées, des lianes qu\'il faut accompagner au fil des saisons et un travail attentif jusqu\'au tri des grains. Derrière le nom « poivre de Kampot », il n\'y a pas seulement une réputation gastronomique. Il y a une origine protégée, des savoir-faire et des producteurs dont le travail donne sa valeur au produit.  Pour le comprendre, il faut donc quitter un instant le moulin à poivre et regarder ce qui se passe avant que les grains n\'arrivent en cuisine.',
    seoDescription: 'Au sud du Cambodge, découvrez le terroir du poivre de Kampot : les plantations, le travail des producteurs, la récolte et une origine géographique protégée.',
    readingTime: '5 min',
    sections: [
      {
        title: 'Un nom qui désigne un territoire',
        paragraphs: [
          'Kampot et Kep se trouvent dans le sud du Cambodge, non loin du golfe de Thaïlande. C\'est dans une aire géographique délimitée de ces deux provinces que peut être produit le poivre portant le nom protégé de Kampot. Ce nom n\'est pas une simple manière de dire « poivre cultivé au Cambodge ».',
          'La proximité de la côte contribue aux conditions climatiques de cette région. Les caractéristiques des terres et la gestion de l\'eau entrent également en jeu. Mais le terroir ne fait pas tout : cultiver une plante au bon endroit ne suffit pas, à lui seul, pour obtenir un poivre de Kampot reconnu. Les producteurs doivent aussi respecter des règles de culture et de préparation précises.',
          'Cette distinction compte pour la personne qui achète le produit. Deux poivres peuvent être cultivés dans le même pays sans porter le même nom d\'origine ni répondre aux mêmes exigences.'
        ]
      },
      {
        title: 'Une liane qui demande des soins',
        paragraphs: [
          'Le poivre vient d\'une plante grimpante, Piper nigrum. Elle pousse en s\'appuyant sur un support. Une plantation n\'est donc pas un champ de grains déjà prêts à sécher : c\'est un ensemble de pieds qu\'il faut établir, nourrir, arroser et entretenir au cours de l\'année.',
          'Dans les plantations de Kampot, la gestion de l\'eau est essentielle. Pendant la saison des pluies, les parcelles doivent pouvoir évacuer l\'excès d\'humidité ; pendant la saison sèche, les poivriers ont besoin d\'être irrigués. Le soin apporté au sol est tout aussi important. Le cahier des charges prévoit des pratiques de fertilisation spécifiques et exclut les engrais chimiques.',
          'Le travail agricole ne se résume donc pas à cueillir quelques grappes. La qualité se prépare en amont, sur des mois de surveillance, et reste exposée aux contraintes de la météo comme aux coûts de production.'
        ]
      },
      {
        title: 'Des variétés et des gestes à préserver',
        paragraphs: [
          'Les poivriers admis pour le poivre de Kampot appartiennent à deux variétés locales désignées Kamchay et Lampong, cette dernière étant également appelée Belantoeung. Ces noms ne doivent pas être confondus avec les quatre couleurs sous lesquelles le poivre est commercialisé.',
          'Pour multiplier les plants, les agriculteurs utilisent notamment des boutures de poivrier. L\'entretien des parcelles, la conduite des tiges et la surveillance des grappes demandent ensuite des gestes répétés. Certains savoir-faire se transmettent entre producteurs, mais il serait abusif de prétendre que toutes les fermes suivent exactement le même rythme ou la même organisation familiale.',
          'Ce qui les rassemble est plus concret : le respect d\'un produit défini, d\'une aire de production et de pratiques contrôlées. La transmission ne se limite pas au récit du passé ; elle se retrouve dans le travail de la plantation.'
        ]
      },
      {
        title: 'Ce que racontent les couleurs des grains',
        paragraphs: [
          'Vert, noir, rouge et blanc ne désignent pas quatre plantes sans rapport. Ils correspondent surtout au moment de la récolte et au traitement des baies.',
          'Le poivre vert provient de grappes cueillies alors que les fruits sont encore jeunes. Le noir est obtenu à partir de grains récoltés à un stade plus avancé, puis séchés. Le rouge vient de baies arrivées à maturité et séchées. Pour obtenir le blanc, on travaille des baies mûres afin d\'en retirer leur enveloppe extérieure.',
          'La transformation change l\'aspect et les usages du poivre. Mais cette diversité ne doit pas masquer ce que les quatre formes ont en commun : elles résultent d\'une culture située dans la même région de production et de méthodes de préparation encadrées. Ces couleurs renvoient aux gestes agricoles et aux choix de préparation ; les usages en cuisine varient ensuite selon les plats et les familles.'
        ]
      },
      {
        title: 'Après la récolte, le travail continue',
        paragraphs: [
          'Une fois les grappes cueillies, le poivre n\'est pas encore prêt à être vendu. Selon le produit recherché, les grains passent par différentes étapes de préparation : séparation, séchage ou traitement adapté, tri et conditionnement. La rigueur de ces étapes contribue à préserver les caractéristiques recherchées et à écarter les grains qui ne répondent pas aux critères attendus.',
          'Ce travail est moins visible que la plantation, mais il occupe une place importante dans l\'histoire du produit. La maturité de la baie ne se décide pas au moment où l\'on ouvre un sachet : elle a déjà guidé la récolte. Et la présentation finale dépend ensuite de la manière dont le poivre a été préparé.',
          'Il serait trompeur de décrire ici une journée type de récolte comme si nous avions suivi une exploitation particulière. Les pratiques peuvent différer d\'une ferme à l\'autre dans le cadre des exigences communes.'
        ]
      },
      {
        title: 'Pourquoi l\'origine du poivre de Kampot est protégée',
        paragraphs: [
          'Le nom « poivre de Kampot » bénéficie d\'une protection en tant qu\'indication géographique. Cette protection vise à empêcher qu\'un poivre sans lien avec l\'aire et les méthodes reconnues profite indûment de sa réputation.',
          'Les règles ne portent pas seulement sur la carte. Elles encadrent aussi la production et la traçabilité. Une association de producteurs et d\'opérateurs participe au respect du cahier des charges et au suivi du produit. La reconnaissance internationale a renforcé la visibilité du poivre de Kampot, tout en rendant plus importante la lutte contre les imitations.',
          'Cette protection ne garantit pas que chaque récolte sera identique, ni qu\'un poivre protégé correspondra automatiquement aux goûts de tous. Elle donne plutôt au nom une signification vérifiable : une origine, des pratiques et des contrôles.'
        ]
      },
      {
        title: 'De Kampot à Kep, puis à la table',
        paragraphs: [
          'Dans cette partie du Cambodge, le poivre n\'est pas séparé des autres produits du territoire. À Kep, sur le littoral, son association avec le crabe est devenue particulièrement connue. Ce rapprochement entre ce qui vient de la mer et ce qui pousse dans les terres permet de comprendre pourquoi un ingrédient peut être lié à la cuisine d\'une région entière.',
          'Pour autant, le poivre de Kampot ne sert pas seulement à accompagner le crabe. Il trouve sa place dans différents plats où l\'on veut souligner un parfum, relever une bouchée ou terminer un assaisonnement. Le choix entre vert, noir, rouge et blanc appartient ensuite à la cuisine, au produit disponible et au résultat recherché.',
          'Ce que l\'on retient d\'une plantation ne tient finalement pas en un seul adjectif de dégustation. Il y a une plante, un climat, du travail et des règles communes derrière chaque grain. C\'est ce lien entre le lieu et les personnes qui donne toute sa portée au nom « poivre de Kampot ».'
        ]
      }
    ],
    image: '/images/cuisine/kampot-1600.webp',
    imageAlt: 'Grappes de poivre vert de Kampot sur le plant',
    imageWidth: 1600,
    imageHeight: 1067,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'OMPI — Indication géographique du poivre de Kampot (18 janvier 2021)', url: 'https://www.wipo.int/fr/web/lisbon-system/w/news/2021/news_0001' },
      { label: 'FAO — Filière et terroir du poivre de Kampot (1er septembre 2022)', url: 'https://www.fao.org/one-country-one-priority-product/asia-pacific/good-practices/detail/cambodia-s-kampot-pepper/en' },
      { label: 'Association des producteurs KPPA — Pratiques de production', url: 'https://www.kampotpepper-kppa.com/fr/production/' },
      { label: 'Cambodia IP — Cahier des charges officiel du poivre de Kampot', url: 'https://www.cambodiaip.gov.kh/wp-content/uploads/DocResources/962f66de-749b-40ae-aa6b-632f8b3c06c2_c848dcff-d931-496b-95b4-377ee747b45a-en.pdf' }
    ]
  },
  {
    slug: 'comprendre-le-kroeung',
    title: 'Le kroeung, une mémoire de la cuisine khmère',
    eyebrow: 'Mémoire culinaire',
    intro: 'Qu\'est-ce qui fait qu\'un parfum devient un souvenir de pays ? Dans la cuisine cambodgienne, le mot kroeung désigne une famille de préparations aromatiques. Il revient dans des plats différents, des cuisines de famille aux tables de restaurant. Pourtant, son intérêt culturel ne se résume pas à la manière dont on le prépare. Le kroeung raconte aussi ce qui se transmet d\'une génération à l\'autre, ce qui change quand on quitte son pays et ce que des cuisiniers cherchent aujourd\'hui à préserver. Cette histoire mérite d\'être racontée sans transformer une tradition vivante en recette officielle, ni prétendre connaître un acte de naissance que les documents disponibles ne permettent pas d\'établir.',
    seoDescription: 'Au-delà des recettes, le kroeung raconte une part du patrimoine culinaire cambodgien : mémoire des familles, bouleversements du XXe siècle et transmission dans la diaspora.',
    readingTime: '4 min',
    sections: [
      {
        title: 'Un repère de la cuisine khmère, pas un plat unique',
        paragraphs: [
          'Dans les cuisines cambodgiennes, le kroeung traverse plusieurs familles de plats. Il est présent dans certaines soupes, dans des préparations de poisson et dans des plats mijotés ou sautés. On le décrit souvent comme l\'une des bases de la cuisine khmère, mais le terme ne correspond pas à un plat servi à lui seul.',
          'Cette place particulière aide à comprendre pourquoi le kroeung peut devenir un marqueur de mémoire. Un plat peut changer d\'une maison à l\'autre tout en conservant un parfum que l\'on reconnaît. Ce n\'est pas l\'identité parfaite de chaque préparation qui compte : c\'est la continuité d\'un répertoire culinaire que l\'on partage, réinterprète et parfois retrouve après des années.',
          'Les cultures voisines utilisent elles aussi des préparations aromatiques apparentées. Reconnaître ces parentés n\'efface pas la place du kroeung dans la cuisine cambodgienne. Cela évite simplement de présenter toute ressemblance comme une preuve d\'emprunt direct, ou toute différence comme une origine exclusivement khmère.'
        ]
      },
      {
        title: 'Une origine qu\'il faut raconter avec prudence',
        paragraphs: [
          'Il serait tentant de faire remonter le kroeung aux cuisines du grand empire d\'Angkor, puis de dérouler une tradition ininterrompue jusqu\'à nos jours. Une telle chronologie aurait une belle allure. Elle demanderait pourtant des preuves précises : textes datés, usages identifiables et descriptions suffisamment détaillées pour reconnaître la préparation dont on parle aujourd\'hui.',
          'Aucune date certaine ne peut être avancée ici pour l\'apparition du kroeung sous sa forme actuelle. Le fait que la cuisine khmère possède une histoire ancienne ne démontre pas qu\'une préparation contemporaine existait à l\'identique il y a plusieurs siècles.',
          'C\'est aussi cela, raconter un patrimoine avec sérieux : accepter ses zones d\'ombre. L\'absence d\'une date fondatrice ne rend pas la tradition moins importante. Elle rappelle qu\'une culture culinaire ne se conserve pas seulement dans les livres, mais aussi dans les habitudes, les paroles et les repas.'
        ]
      },
      {
        title: 'Quand l\'histoire récente a bouleversé les cuisines',
        paragraphs: [
          'Entre 1975 et 1979, le régime des Khmers rouges a profondément bouleversé la vie de la population cambodgienne. La violence, les déplacements forcés et les pertes humaines ont touché les familles et de nombreux aspects de la transmission culturelle. Les décennies de conflit et de reconstruction ont prolongé ces ruptures.',
          'La cuisine n\'a pas été épargnée. Les repas quotidiens, la disponibilité des produits et les possibilités d\'apprendre auprès de proches ont été affectés. Réduire cette histoire à l\'idée que toutes les recettes auraient disparu serait néanmoins faux : des pratiques et des mémoires ont continué d\'exister, au Cambodge comme dans les communautés établies à l\'étranger.',
          'Le kroeung n\'est pas, à lui seul, le symbole de ces épreuves. Il appartient plutôt à un ensemble plus large de goûts et de préparations que certaines familles ont maintenus ou retrouvés. Pour raconter cette continuité, il faut regarder aussi bien ce qui a été perdu que ce qui a pu être transmis.'
        ]
      },
      {
        title: 'Dans l\'exil, un parfum peut rappeler le pays',
        paragraphs: [
          'À partir de la fin des années 1970, des Cambodgiens ont trouvé refuge dans d\'autres pays, notamment aux États-Unis et en France. L\'expérience de l\'exil a profondément varié d\'une famille à l\'autre, mais l\'alimentation a parfois constitué un lien concret avec le pays quitté.',
          'Des récits contemporains de descendants de réfugiés cambodgiens décrivent le parfum du kroeung comme un souvenir des repas préparés par leurs parents. Des saveurs autrefois perçues comme différentes de celles de l\'école ou du voisinage peuvent prendre, à l\'âge adulte, une autre valeur : celle d\'une histoire familiale dont on souhaite garder quelque chose.',
          'Il ne s\'agit pas d\'attribuer le même souvenir à toute une diaspora. Certains ont appris en observant leurs proches, d\'autres ont découvert plus tard des plats de leur enfance, et d\'autres encore connaissent peu ces préparations. Ce que ces trajectoires montrent, c\'est qu\'un aliment peut relier l\'intime à une histoire collective sans résumer à lui seul cette histoire.'
        ]
      },
      {
        title: 'Préserver la cuisine sans la figer',
        paragraphs: [
          'Aujourd\'hui, des cuisinières, des cuisiniers et des auteurs cambodgiens s\'attachent à raconter, documenter et faire connaître leur patrimoine culinaire. Cette démarche prend plusieurs formes : recueillir des souvenirs, écrire des livres, retrouver des plats moins connus ou montrer la diversité des façons de manger selon les territoires.',
          'Leur travail soulève une question importante : comment conserver une mémoire sans transformer une version particulière en vérité définitive ? Le mot « traditionnel » ne signifie pas que tout le monde cuisine de la même manière. Une préparation peut évoluer avec les saisons, les migrations, les moyens disponibles et les goûts d\'une génération.',
          'Le kroeung trouve sa place dans ce récit : non comme une leçon à reproduire exactement, mais comme l\'un des fils qui relient les repas du présent à des histoires familiales et collectives. C\'est cette dimension humaine qui relève des Carnets. Les parfums transmis de génération en génération ne se résument pas à une série de gestes.'
        ]
      }
    ],
    image: '/images/cuisine/carnet-kroeung-memoire-1536.webp',
    imageAlt: 'Scène illustrative de deux générations autour de la mémoire culinaire cambodgienne, avec des aromates sur une table',
    imageWidth: 1536,
    imageHeight: 1024,
    imageWidths: [480, 800, 1200, 1536],
    socialImage: '/images/cuisine/carnet-kroeung-memoire-1536.webp',
    socialImageRole: 'illustration',
    sources: [
      { label: 'Journal of Ethnic Foods (2019) — place du kroeung dans le répertoire khmer', url: 'https://link.springer.com/article/10.1186/s42779-019-0027-1' },
      { label: 'Mekong Review (mai 2018) — histoire récente et transmission de la cuisine cambodgienne', url: 'https://mekongreview.com/eating-amok/' },
      { label: 'Tenement Museum — témoignage diaspora Kroeung: The Taste of Home', url: 'https://yourstory.tenement.org/stories/kroeung/' },
      { label: 'Saveros Pou (1992) — étude du vocabulaire culinaire khmer, sans preuve directe de l’origine du kroeung', url: 'https://angkordatabase.asia/publications/khmer-cuisine-vocabulary' }
    ]
  },
  {
    slug: 'comprendre-amok',
    title: 'L’amok, entre patrimoine et tables d’aujourd’hui',
    eyebrow: 'Mémoire culinaire',
    intro: 'L’amok de poisson est devenu l’un des plats les plus reconnaissables de la cuisine cambodgienne. Il apparaît dans les récits de voyage, sur les tables de restaurants khmers et dans des livres qui souhaitent faire connaître cette cuisine. Mais l’amok n’a pas toujours la même place selon qu’on le découvre pour la première fois ou qu’on le connaît depuis longtemps. Derrière sa présentation souvent associée aux feuilles de bananier, il y a aussi des questions de mémoire, d’occasions particulières et de représentation du pays. Son histoire ne peut pas se réduire à une origine royale affirmée sans preuve, ni à une version unique que toutes les familles reproduiraient.',
    seoDescription: 'L’amok de poisson raconte plus qu’une recette : fêtes, feuilles de bananier, récits d’origine royale, restaurants et diaspora cambodgienne, entre tradition et changements.',
    readingTime: '4 min',
    sections: [
      {
        title: 'Quand un plat devient un emblème',
        paragraphs: [
          'Certains plats finissent par représenter un pays aux yeux des visiteurs. L’amok, et particulièrement l’amok trey au poisson, occupe cette place dans de nombreux récits consacrés à la cuisine cambodgienne. Sa présence répétée dans les restaurants et les ouvrages de gastronomie a contribué à en faire un symbole immédiatement reconnaissable.',
          'Cette célébrité ne signifie pas qu’il serait le repas le plus courant dans tous les foyers. Elle raconte plutôt ce qu’une société, ses restaurateurs et ses observateurs choisissent de montrer lorsqu’il s’agit de présenter sa cuisine. D’autres plats de riz, de nouilles, de soupe ou de légumes tiennent une place tout aussi importante dans la vie quotidienne.',
          'Le fait de reconnaître l’amok comme un emblème ne doit donc pas effacer la diversité des repas cambodgiens. Il peut être une porte d’entrée vers le patrimoine, sans en devenir l’unique définition.'
        ]
      },
      {
        title: 'À la table des grandes occasions',
        paragraphs: [
          'Des cuisinières cambodgiennes décrivent l’amok comme une préparation que l’on retrouve volontiers lors de certaines célébrations, réceptions ou réunions importantes. Pour Kethana Dunnett, restauratrice cambodgienne, l’amok n’est pas nécessairement un plat de tous les jours : il peut marquer un moment que l’on souhaite partager.',
          'Ce témoignage éclaire une dimension moins visible dans les menus destinés aux touristes : la différence entre un plat célèbre et un plat quotidien. À une table de fête, le temps qu’on lui consacre et la manière de le présenter peuvent lui donner une place particulière. Dans un restaurant, le même nom peut au contraire apparaître au menu chaque jour.',
          'Il ne serait pas exact d’en déduire que toutes les familles servent l’amok à chaque cérémonie ou qu’il possède partout la même fonction rituelle. Les habitudes varient. Ce qui importe est cette coexistence entre une mémoire des occasions spéciales et une présence désormais familière dans la restauration.'
        ]
      },
      {
        title: 'La feuille de bananier, une image qui voyage',
        paragraphs: [
          'L’amok est souvent photographié dans de petites corbeilles de feuilles de bananier. Cette présentation contribue fortement à son identité visuelle : un contenant végétal qui encadre le plat et qui rappelle un usage culinaire plus large des feuilles dans la région.',
          'Pourtant, toutes les versions d’amok ne se ressemblent pas. Certains cuisiniers le présentent autrement ; les feuilles de bananier peuvent être remplacées par d’autres récipients selon les circonstances. Une cheffe cambodgienne contemporaine propose elle-même plusieurs modes de service possibles.',
          'La feuille de bananier est ainsi devenue un élément important de la représentation publique de l’amok sans constituer une preuve d’authenticité exclusive. Pour un Carnet culturel, observer les images et la manière dont elles circulent est plus intéressant que d’expliquer comment plier une corbeille en feuille de bananier.'
        ]
      },
      {
        title: 'Une origine royale souvent racontée, pas démontrée',
        paragraphs: [
          'On rencontre fréquemment l’idée selon laquelle l’amok aurait été préparé pour la cour royale du Cambodge depuis l’époque d’Angkor. Cette histoire est reprise dans des présentations gastronomiques et son association à la royauté continue de marquer l’imaginaire du plat.',
          'Être présenté comme royal ne démontre pas une naissance à la cour d’Angkor. Aucune recette historique datée ni description ancienne suffisamment précise n’a été établie ici pour confirmer la création de l’amok actuel à cette époque. Les ressemblances avec des préparations régionales ne permettent pas davantage de déterminer à elles seules une origine ou un emprunt.',
          'Il est donc plus juste de parler d’un récit d’origine largement diffusé, tout en reconnaissant l’absence de certitude historique. Le patrimoine culinaire a besoin de mémoire ; il ne gagne rien à transformer une hypothèse séduisante en fait établi.'
        ]
      },
      {
        title: 'D’un restaurant à l’autre, plusieurs amoks',
        paragraphs: [
          'Le nom amok rassemble aujourd’hui des présentations et des interprétations différentes. Le poisson reste au cœur des formes les plus connues, mais certaines cartes de restaurant proposent aussi d’autres produits. Cette diversité reflète des usages variés et parfois des adaptations destinées à des clientèles différentes.',
          'Au début du XXIe siècle, plusieurs interprétations de l’amok coexistaient déjà au Cambodge et suscitaient des discussions parmi les cuisiniers. Les goûts, les produits disponibles, l’idée de ce qui fait un amok et les attentes des convives influencent la manière dont il est présenté.',
          'Cela ne signifie pas que toutes les interprétations sont indifférenciées ou qu’il n’existe plus de repères communs. C’est plutôt un rappel : une tradition culinaire vit à travers des personnes qui font des choix, et non comme une photographie figée d’un plat idéal.'
        ]
      },
      {
        title: 'Un nom qui traverse aussi les frontières',
        paragraphs: [
          'L’amok ne reste pas seulement dans les restaurants du Cambodge. En mai 1990, il figurait déjà sur la carte d’un restaurant cambodgien à Long Beach, en Californie, dans une scène culinaire animée notamment par les communautés installées aux États-Unis.',
          'La présence d’un plat à l’étranger ne résume pas l’expérience de l’exil ni la totalité des pratiques de la diaspora. Elle montre néanmoins que les restaurants sont aussi des lieux où l’on transmet, transforme et présente une cuisine à des convives qui ne partagent pas tous la même histoire familiale.',
          'Des chefs cambodgiens contemporains continuent aujourd’hui de revendiquer et de réinterpréter l’amok dans leurs livres et leurs restaurants. Entre plats d’occasion, mémoire des cuisines du pays et découverte à l’étranger, son parcours raconte finalement une chose simple : les traditions n’ont pas besoin d’être immobiles pour rester importantes.'
        ]
      }
    ],
    image: '/images/cuisine/amok-1600.webp',
    imageAlt: 'Amok de poisson servi dans des feuilles de bananier avec du riz, sur une table de restaurant',
    imageWidth: 1600,
    imageHeight: 1067,
    imageWidths: [480, 800, 1200, 1600],
    socialImage: '/images/cuisine/amok-alt-1600.webp',
    socialImageRole: 'article',
    sources: [
      { label: 'Audrey Gillan, National Geographic Traveller UK (octobre 2017) — occasions et représentations de l’amok', url: 'https://www.audreygillan.com/archives/cambodia-the-art-of-amok' },
      { label: 'Ambassade du Cambodge à Londres (février 2022) — récit de tradition royale', url: 'https://www.cambodiaembassyuk.org/fish-amok-recipe/' },
      { label: 'Chef Nak — présentation et adaptations contemporaines de l’amok', url: 'https://www.chefnak.com/cambodian-fish-amok' },
      { label: 'Phil Lees (mai 2007) — discussions sur les versions de l’amok', url: 'https://www.phnomenon.com/index.php/cambodian-food/meta/amokalypse-now-byline-ahoy/' },
      { label: 'Los Angeles Times (mai 1990) — amok dans un restaurant cambodgien à Long Beach', url: 'https://www.latimes.com/archives/la-xpm-1990-05-13-ca-276-story.html' },
      { label: 'ARTE (décembre 2025) — poisson amok et gastronomie contemporaine', url: 'https://www.arte.tv/fr/videos/119582-140-A/voyage-en-cuisine/' }
    ]
  },
  {
    slug: 'kep-marche-crabe-poivre',
    title: 'Kep, au marché des crabes, entre mer et poivre',
    eyebrow: 'Terroirs et marchés',
    intro: 'À Kep, le marché aux crabes relie deux paysages du sud du Cambodge : la côte où vivent les pêcheurs et les terres voisines où pousse le poivre de Kampot. Le même lieu concentre les arrivages, la vente de produits de la mer et les cuisines qui leur donnent une autre vie. C\'est ce voisinage entre l\'eau, les étals et les assiettes qui a rendu Kep reconnaissable bien au-delà de sa taille.  Le crabe y occupe une place particulière. Mais pour raconter ce marché sans le réduire à une carte postale gourmande, il faut aussi parler des personnes qui en dépendent et de la nécessité de préserver les ressources dont elles vivent.',
    seoDescription: 'À Kep, au sud du Cambodge, découvrez le marché aux crabes, la pêche côtière, l’association au poivre de Kampot et les enjeux de préservation de la mer.',
    readingTime: '5 min',
    sections: [
      {
        title: 'Kep, une ville tournée vers la mer',
        paragraphs: [
          'Kep se trouve sur la côte méridionale du Cambodge, près de Kampot et du golfe de Thaïlande. Sa réputation balnéaire est ancienne, mais elle ne résume pas les activités de la ville. La pêche et la vente de produits marins y tiennent également une place visible, en particulier autour du marché connu sous le nom de Psar Kdam, le marché aux crabes.',
          'La proximité de Kampot compte dans cette géographie culinaire. En peu de distance, on passe des terres agricoles au bord de mer. Il serait pourtant trompeur de faire comme si toute l\'économie de Kep reposait sur un seul plat ou comme si chaque repas local était nécessairement composé de crabe.',
          'Le marché est un bon point de départ pour comprendre le lieu : il relie des métiers différents sans les confondre. Entre le produit encore vivant, le commerce, la préparation et le service, plusieurs personnes interviennent avant qu\'une spécialité arrive à table.'
        ]
      },
      {
        title: 'De la pêche à l\'étal',
        paragraphs: [
          'Les crabes nageurs bleus font partie des ressources marines recherchées le long des côtes cambodgiennes. Ils constituent une source de revenu importante pour certaines communautés de pêcheurs. Leur présence dans les marchés de Kep rappelle qu\'un produit réputé dépend d\'abord du travail effectué en mer.',
          'À proximité du marché, des paniers et des casiers servent à conserver ou à présenter une partie des prises. Des vendeuses et des vendeurs participent au tri, à la vente et parfois à l\'organisation de la préparation. Leur rôle ne doit pas être effacé derrière le mot « spécialité » : le commerce côtier repose sur des compétences concrètes et sur des échanges avec les pêcheurs.',
          'Les formes de vente, les arrivages et la disponibilité peuvent varier. Plutôt que de décrire des horaires, un prix ou une journée de pêche que nous n\'avons pas observés, retenons ce que l\'on peut établir : le marché fait le lien entre des ressources marines, des métiers et les personnes venues se fournir ou manger.'
        ]
      },
      {
        title: 'Pourquoi le crabe est devenu l\'image de Kep',
        paragraphs: [
          'Le crabe occupe une place singulière dans la représentation de Kep. On le retrouve dans les descriptions du marché, dans les assiettes associées à la ville et jusque dans ses images touristiques. Cette notoriété peut donner l\'impression d\'une tradition immuable, alors que les habitudes de consommation et les possibilités de pêche évoluent.',
          'Le nom courant de « crabe bleu » désigne ici les crabes nageurs présents dans les eaux côtières. Il faut rester prudent avec les appellations commerciales : elles peuvent mélanger plusieurs dénominations et ne remplacent pas une identification précise de l\'espèce lorsqu\'elle est nécessaire.',
          'Ce qui rend le marché intéressant ne tient pas seulement à la couleur d\'une carapace. C\'est la continuité entre le produit de la mer, le travail des personnes qui le vendent et la cuisine pratiquée sur place. Cette continuité n\'empêche ni les changements économiques ni les tensions sur la ressource.'
        ]
      },
      {
        title: 'Le poivre de Kampot rencontre le crabe',
        paragraphs: [
          'Parmi les associations culinaires de la région, celle du crabe avec du poivre vert frais de Kampot est particulièrement connue. Le contraste a du sens : la chair délicate du crustacé et le parfum végétal, vif, du poivre racontent deux activités voisines, la pêche d\'un côté et l\'agriculture de l\'autre.',
          'Cette rencontre ne signifie pas que les producteurs de poivre et les pêcheurs pratiquent les mêmes métiers, ni que tous les crabes servis à Kep sont nécessairement pêchés dans les eaux les plus proches. Elle illustre plutôt la manière dont la cuisine peut rapprocher plusieurs produits d\'un territoire.',
          'Pour comprendre comment le poivre est cultivé, récolté et protégé par une indication géographique, il faut se tourner vers le Carnet consacré à Kampot. Ici, l\'intérêt est ailleurs : dans la rencontre entre ce qui arrive du littoral et ce que les terres voisines apportent à l\'assaisonnement.'
        ]
      },
      {
        title: 'La mer n\'est pas une ressource infinie',
        paragraphs: [
          'La renommée du crabe de Kep pose aussi une question moins souvent racontée : comment continuer à vivre de cette pêche lorsque la pression sur la ressource augmente ? Des travaux menés depuis plusieurs années dans la région documentent les difficultés de gestion des stocks de crabes et la nécessité de protéger les habitats côtiers.',
          'En 2026, des opérations de restauration des populations de crabes nageurs ont été soutenues dans des communautés de pêche de Kep et de Kampot. Elles s\'inscrivent dans un ensemble plus vaste d\'initiatives pour renforcer la résilience des moyens de subsistance face aux changements environnementaux.',
          'Ces actions ne prouvent pas, à elles seules, que les populations de crabes sont désormais rétablies ou que chaque capture vendue au marché est durable. Elles montrent en revanche que la préservation des ressources est devenue un enjeu concret, pour le milieu marin comme pour les personnes dont la pêche constitue une source de revenus.'
        ]
      },
      {
        title: 'Ce que le marché raconte de la cuisine cambodgienne',
        paragraphs: [
          'À Kep, le marché ne vend pas uniquement du crabe. D\'autres poissons et produits de la mer y ont leur place, aux côtés de condiments et de préparations qui répondent à des usages variés. Regarder cet ensemble évite de résumer la cuisine côtière à une seule recette devenue célèbre.',
          'Le poivre rappelle les fermes de Kampot ; les paniers de produits marins évoquent le travail des pêcheurs ; les étals mettent en contact vendeurs, cuisiniers, habitants et voyageurs. Mais ce lieu n\'est pas un décor figé. Il dépend des saisons, des ressources et des choix collectifs sur la manière de continuer à pêcher.',
          'Si le marché aux crabes de Kep mérite un Carnet, c\'est précisément parce qu\'il ne raconte pas seulement une saveur. Il donne à voir comment une spécialité relie la mer, les terres, des métiers et des questions d\'avenir.'
        ]
      }
    ],
    image: '/images/cuisine/kep-crab-market-1280.webp',
    imageAlt: 'Étals et visiteurs sous les auvents colorés du marché de Kep, au Cambodge',
    imageWidth: 1280,
    imageHeight: 960,
    imageWidths: [480, 800, 1200, 1280],
    /** Visuel existant inchangé pour préserver le catalogue social ; à remplacer avant publication de C05. */
    socialImage: '/images/cuisine/kep-market-1600.webp',
    socialImageRole: 'article',
    sources: [
      { label: 'SEAFDEC — Filière et pêche du crabe nageur à Kep (juin 2020)', url: 'https://repository.seafdec.or.th/handle/20.500.12067/1471' },
      { label: 'FAO — Restauration des stocks de crabe à Kep et Kampot (15 juin 2026)', url: 'https://www.fao.org/cambodia/news/detail/850-000-blue-swimming-crablets-released-in-kampot-to-support-coastal-fisheries-and-climate-resilience/en' },
      { label: 'SEAFDEC — Gestion communautaire de la pêche à Angkaol', url: 'https://repository.seafdec.org/handle/20.500.12066/6449' },
      { label: 'OMPI — Poivre de Kampot et indication géographique', url: 'https://www.wipo.int/fr/web/lisbon-system/w/news/2021/news_0001' }
    ]
  },
  {
    slug: 'prahok-fermentation-umami',
    title: 'Prahok, quand la pêche devient patrimoine',
    eyebrow: 'Mémoire culinaire',
    intro: 'Au Cambodge, le prahok est bien plus qu\'un goût reconnaissable. Cette pâte de poisson fermenté relie les tables à une histoire de rivières, de villages et de saisons de pêche. Derrière un aliment conservé pour durer, il y a des générations de travail et une façon de vivre avec les variations de l\'eau.  Le prahok raconte aussi des réalités contemporaines : les revenus tirés du poisson, la place des femmes dans sa transformation, les échanges entre campagnes et villes, et les inquiétudes devant des ressources moins accessibles. C\'est cette histoire humaine et collective qui mérite sa place dans les Carnets, loin d\'un mode d\'emploi de fermentation.',
    seoDescription: 'Au Cambodge, le prahok raconte le rythme du Tonlé Sap, le travail des communautés de pêche, les échanges avec les villages et la transmission d’un patrimoine menacé.',
    readingTime: '4 min',
    sections: [
      {
        title: 'Le Tonlé Sap, un paysage qui change avec les saisons',
        paragraphs: [
          'Au centre du Cambodge, le lac Tonlé Sap est lié au Mékong par un système d\'eaux dont le mouvement varie fortement au cours de l\'année. Pendant la saison des pluies, l\'eau gagne les plaines et les zones inondées. Lorsque les niveaux redescendent, le paysage se transforme encore et les poissons se déplacent avec ces changements.',
          'Cette alternance rythme depuis longtemps la vie des communautés riveraines. On ne pêche pas partout de la même manière ni aux mêmes moments, et les activités de nombreuses familles ont dû composer avec la disponibilité saisonnière des poissons d\'eau douce.',
          'Le prahok appartient à ce paysage. Il rappelle qu\'une ressource abondante à certaines périodes peut devenir plus rare à d\'autres. Mais le Tonlé Sap n\'est pas la seule région du Cambodge où l\'on connaît ce produit : son histoire s\'étend au-delà des rives du lac, par les déplacements de personnes et les échanges de marchandises.'
        ]
      },
      {
        title: 'Quand le poisson reliait les villages aux rivières',
        paragraphs: [
          'Dans des récits historiques sur les campagnes cambodgiennes, la période des pêches importantes était aussi une période de mouvement. Des familles venant de régions éloignées rejoignaient les rivières ou les marchés pour obtenir du poisson, parfois en échangeant du riz. Ces voyages reliaient des territoires agricoles à des lieux de pêche.',
          'La conservation du poisson permettait d\'étendre la présence de cette ressource au-delà de la période où les prises étaient les plus importantes. La pâte de poisson fermenté est ainsi devenue une composante durable du paysage alimentaire, particulièrement là où l\'accès régulier au poisson frais pouvait varier selon les saisons et les distances.',
          'Les moyens de transport, les marchés et la distribution ont depuis changé ces relations. Il serait trompeur de décrire tous les villages actuels comme s\'ils suivaient encore un même trajet ancien. Ce qui demeure, c\'est le lien entre le produit, la géographie et l\'organisation économique des échanges.'
        ]
      },
      {
        title: 'Des savoirs et des revenus portés par des productrices',
        paragraphs: [
          'Autour du Tonlé Sap, la transformation du poisson représente aussi une activité professionnelle. Dans certaines communautés étudiées, de nombreuses femmes y jouent un rôle central : elles organisent le travail, achètent des prises, vendent le produit fini et composent avec les besoins de leur foyer.',
          'Leur savoir-faire ne se réduit pas à une tâche domestique. Pour certaines, produire du prahok signifie exercer un métier, gagner un revenu et maintenir une compétence acquise auprès de proches. La qualité de ce qu\'elles proposent fait aussi partie de leur réputation professionnelle.',
          'Cette réalité ne doit pas devenir un cliché selon lequel toutes les Cambodgiennes prépareraient le prahok ou seraient responsables de transmettre seules la cuisine du pays. Les parcours sont différents d\'un village à l\'autre, et la place des femmes dans ces métiers dépend aussi des possibilités économiques et de l\'histoire de chaque famille.'
        ]
      },
      {
        title: 'Un produit de terroirs, de marchés et de goûts différents',
        paragraphs: [
          'Le prahok n\'est pas une préparation strictement identique dans tous les foyers et sur tous les marchés. Selon les territoires, les poissons disponibles et les préférences locales, on rencontre des formes et des caractères distincts. Cette diversité donne au produit une valeur qui dépasse l\'idée d\'un simple assaisonnement standardisé.',
          'Les circuits de vente relient les pêcheurs, les personnes chargées de la transformation, les commerçants et les familles qui achètent le prahok. Les marchés des villes accueillent ainsi des productions venues d\'autres régions. Les évolutions des transports ont modifié la manière dont ces produits circulent.',
          'Il y a dans ces échanges une histoire de savoirs, de réputations et de choix de consommation. Pour certaines familles, la préférence pour un prahok particulier peut rappeler une région ou une habitude familière. Ces attachements ne sont pas mesurables à l\'échelle d\'un pays entier, mais ils éclairent ce qu\'un aliment peut représenter au-delà de sa fonction dans une assiette.'
        ]
      },
      {
        title: 'Préserver le prahok, c\'est aussi préserver une ressource',
        paragraphs: [
          'Les communautés de pêche du Tonlé Sap sont confrontées à des changements environnementaux et économiques. Dans certaines zones étudiées, la disponibilité de petits poissons a diminué ou leur accès est devenu plus coûteux. Les productrices de prahok doivent alors s\'adapter, parfois en réduisant leur activité ou en cherchant d\'autres revenus.',
          'Une autre tension apparaît lorsque des petits poissons autrefois destinés à l\'alimentation humaine sont utilisés pour nourrir des poissons d\'élevage. Ce déplacement de la demande pose une question de partage des ressources, notamment pour les ménages qui dépendent encore du poisson accessible localement.',
          'Aucune de ces observations ne suffit à annoncer la disparition du prahok dans tout le Cambodge. Elles montrent plutôt que préserver une tradition culinaire ne consiste pas seulement à en répéter le nom : il faut aussi regarder les conditions de vie et l\'environnement des personnes qui la rendent possible.'
        ]
      },
      {
        title: 'Une mémoire vivante, pas une recette figée',
        paragraphs: [
          'Parler du prahok uniquement par son odeur ferait passer à côté de l\'essentiel. Il est lié à l\'histoire alimentaire de nombreuses familles et à des activités qui ont évolué au gré des saisons, des marchés et des déplacements. Sa place dans la culture cambodgienne est aussi celle d\'un produit sur lequel des personnes ont bâti une compétence et parfois leur métier.',
          'Cette histoire ne se limite ni à une époque lointaine ni à une seule façon de manger. Les usages, les formes et les circuits de vente changent. Certaines familles continuent de produire du prahok ; d\'autres l\'achètent ou l\'utilisent occasionnellement. La diversité ne contredit pas le patrimoine : elle en fait partie.',
          'C\'est pourquoi ce Carnet parle d\'abord des eaux du Tonlé Sap, des échanges entre villages et du travail de celles et ceux qui vivent de la pêche. Ce sont les personnes, les paysages et les savoirs transmis entre générations que le prahok nous invite à comprendre.'
        ]
      }
    ],
    image: '/images/cuisine/carnet-prahok-tonle-sap-1536.webp',
    imageAlt: 'Scène illustrative de pêcheurs, vendeuses et embarcations dans un village lacustre inspiré du Tonlé Sap',
    imageWidth: 1536,
    imageHeight: 1024,
    imageWidths: [480, 800, 1200, 1536],
    socialImage: '/images/cuisine/prahok-1600.webp',
    socialImageRole: 'article',
    sources: [
      { label: 'LeGrand, Borarin et Young (mai 2020) — Tonlé Sap, culture et conservation du poisson', url: 'https://link.springer.com/article/10.1186/s42779-019-0027-1' },
      { label: 'Food and Foodways (2025) — femmes productrices et enjeux sociaux du prahok', url: 'https://doi.org/10.1080/07409710.2025.2564492' },
      { label: 'Regional Environmental Change (octobre 2026) — petits poissons entre alimentation et élevage', url: 'https://link.springer.com/article/10.1007/s10113-026-02706-8' },
      { label: 'FAO — profil des pêches et produits transformés au Cambodge', url: 'https://www.fao.org/fishery/facp/KHM/en' }
    ]
  },
  {
    slug: 'construire-repas-cambodgien',
    title: 'À la table cambodgienne, ce que partager veut dire',
    eyebrow: 'Vie quotidienne',
    intro: 'Il existe des histoires que l\'on comprend simplement en regardant une table. Au Cambodge, le riz accompagne de nombreux repas et plusieurs personnes mangent souvent des plats placés au centre. Ce geste ordinaire — prendre sa part d\'un plat commun — raconte parfois autant de choses sur les relations familiales qu\'une recette célèbre.  Mais la table cambodgienne n\'a pas une forme unique. Elle change selon les lieux, les moyens, les générations, les horaires de travail et les personnes présentes. Parler du repas partagé, c\'est donc moins expliquer ce que chacun devrait servir que regarder ce que manger ensemble peut signifier.',
    seoDescription: 'Au Cambodge, le repas partagé raconte la famille, la place du riz, les plats communs et la solidarité du quotidien, des maisons aux quartiers des villes.',
    readingTime: '4 min',
    sections: [
      {
        title: 'Le riz et le mot qui dit le repas',
        paragraphs: [
          'Au Cambodge, le riz est si central dans l\'alimentation que la question « as-tu mangé ? » peut se dire en faisant référence au fait d\'avoir mangé du riz. Cette association dépasse la simple description d\'un féculent : elle montre comment un aliment ordinaire peut devenir une manière de parler du repas lui-même.',
          'Ce lien ne signifie pas que chaque Cambodgien mange du riz à tous les repas, ni que le riz a toujours occupé la même place dans toutes les régions et à toutes les époques. Il rappelle plutôt la profondeur de son inscription dans les habitudes et dans le langage du quotidien.',
          'Pour comprendre sa place dans les paysages agricoles, les marchés, les variétés et les fêtes, un autre Carnet lui est consacré. Ici, le sujet est la présence du riz autour des personnes : non pas comment le cuire, mais comment il s\'inscrit dans un moment partagé.'
        ]
      },
      {
        title: 'Plusieurs plats au milieu, des parts différentes',
        paragraphs: [
          'Dans de nombreuses maisons, les mets peuvent être disposés en commun tandis que chacun reçoit son riz dans un bol ou une assiette. Une soupe, un plat de poisson, des légumes ou un accompagnement peuvent alors circuler entre les convives sans que les portions soient identiques.',
          'Cette forme de service n\'est pas un modèle à reproduire pour avoir une table « authentique ». Elle offre surtout un aperçu des relations entre les personnes présentes. Le fait de se servir dans un même plat oblige à être attentif aux autres, à leur faim et à ce qui reste.',
          'Les repas individuels existent aussi, notamment dans la restauration rapide, les déplacements ou certaines situations de travail. La diversité des façons de manger rappelle qu\'un usage fréquent ne doit pas devenir une règle imposée à toutes les familles cambodgiennes.'
        ]
      },
      {
        title: 'Un repas peut aussi être une manière de prendre soin',
        paragraphs: [
          'Partager un plat ne veut pas seulement dire manger simultanément. Au sein d\'un foyer, les gestes liés aux repas peuvent exprimer le souci que quelqu\'un ait suffisamment à manger, qu\'un enfant soit servi, qu\'une personne âgée ait ce dont elle a besoin ou qu\'un visiteur soit accueilli.',
          'Dans des situations de ressources limitées, cette attention prend une dimension très concrète. Les possibilités de manger ensemble dépendent aussi du budget, du temps disponible, des trajets et du travail de chacun. Il n\'y a pas lieu d\'idéaliser toutes les tables comme si elles étaient toujours abondantes et joyeuses.',
          'L\'histoire sociale d\'un repas tient dans ces écarts entre le désir de recevoir et les contraintes de la vie quotidienne. Les manières de partager peuvent être chaleureuses, pratiques, parfois difficiles. Elles ne donnent pas pour autant une mesure simple de l\'affection au sein d\'une famille.'
        ]
      },
      {
        title: 'La solidarité peut dépasser la maison',
        paragraphs: [
          'Dans certains quartiers urbains du Cambodge, lorsque des familles peinent à disposer de nourriture en quantité suffisante, l\'entraide peut passer par un bol de riz, de soupe ou de fruits envoyé à des voisins. Une invitation à manger peut aussi devenir un soutien discret et concret.',
          'Ces pratiques ont été documentées dans des communautés confrontées à la précarité. Elles ne doivent pas être transformées en portrait universel du pays, ni en image romantique de la pauvreté. Une solidarité réelle peut coexister avec des difficultés importantes pour se nourrir suffisamment.',
          'Elles montrent néanmoins que l\'alimentation peut avoir une fonction sociale qui dépasse la famille proche. Partager un repas, même modeste, peut être une manière d\'entretenir un lien, de rendre service ou de faire une place à quelqu\'un.'
        ]
      },
      {
        title: 'Des tables qui changent avec la vie',
        paragraphs: [
          'La table d\'une famille rurale n\'est pas forcément celle d\'un appartement urbain, d\'un restaurant de quartier ou d\'un foyer installé depuis longtemps à l\'étranger. Les horaires des enfants, les déplacements, la taille du logement et les moyens disponibles font évoluer le moment du repas.',
          'Des cuisinières et des cuisiniers cambodgiens parlent volontiers de la convivialité des plats disposés au centre. D\'autres expériences montrent des repas pris rapidement, séparément ou hors du domicile. Ces réalités ne se contredisent pas : elles appartiennent toutes à la vie contemporaine.',
          'La présentation d\'une table peut également se transformer lorsque l\'on reçoit des amis, qu\'une fête réunit des proches ou que des générations se retrouvent. Cela ne veut pas dire qu\'il existe un protocole identique d\'une province à l\'autre. Les usages sont autant des histoires familiales que des habitudes collectives.'
        ]
      },
      {
        title: 'Le partage comme mémoire du quotidien',
        paragraphs: [
          'Les aliments célèbres attirent souvent le regard, mais les gestes ordinaires racontent aussi le Cambodge : la place gardée autour d\'une table, un bol qu\'on rapproche, un plat que plusieurs personnes goûtent, une assiette réservée à quelqu\'un qui rentre plus tard.',
          'Il ne faut pas transformer ces images en scènes inventées d\'un repas observé. Ce sont des façons possibles de comprendre une pratique sociale, pas le récit d\'une famille que nous aurions rencontrée. Le Carnet s\'intéresse à ce que le partage peut signifier, sans prétendre parler au nom de tous.',
          'C\'est peut-être là l\'une des différences les plus importantes entre un Carnet et une recette. La recette décrit une préparation ; le Carnet invite à réfléchir aux personnes qui se retrouvent autour d\'elle, à ce qu\'elles échangent et à la manière dont les repas prennent une place dans leurs vies.'
        ]
      }
    ],
    image: '/images/cuisine/v19-table-partage-desktop-1440.webp',
    imageAlt: 'Illustration éditoriale de convives partageant des plats et du riz autour d’une table',
    imageWidth: 1440,
    imageHeight: 810,
    imageWidths: [800, 1200, 1440],
    socialImage: '/images/cuisine/v19-table-partage-desktop-1440.webp',
    socialImageRole: 'illustration',
    sources: [
      { label: 'Chef Nak — guide des tables et repas cambodgiens', url: 'https://www.chefnak.com/cambodian-cuisine-guide' },
      { label: 'Recherche en santé publique — enquête qualitative sur les choix alimentaires des familles', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13499906/' },
      { label: 'Environment and Urbanization (2019) — entraide alimentaire entre voisins en situation urbaine précaire', url: 'https://journals.sagepub.com/doi/10.1177/0956247819863246' },
      { label: 'Étude méthodologique — quantification des plats partagés et des portions', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9545030/' }
    ]
  }
];
