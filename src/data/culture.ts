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
    title: 'Le riz au Cambodge : la vie quotidienne, les rizières et un savoir-faire primé',
    eyebrow: 'Terres, familles et saveurs',
    intro: 'Dans une maison de village, sur une table de Phnom Penh ou au bord d’une rizière, le riz est bien davantage qu’un accompagnement : il nourrit, rassemble et fait vivre. Découvrons le riz cambodgien, de ses variétés parfumées aux plats du quotidien.',
    seoDescription: 'Le riz au Cambodge : place dans la vie quotidienne, riz parfumé Phka Rumduol et Malys Angkor primé en 2025, rizières, fêtes, plats au riz et savoir-faire paysan.',
    readingTime: '9 min',
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
          'Cuisiner cambodgien ne signifie pas recouvrir systématiquement le riz de sauce. Il peut rester bien distinct dans le bol : on alterne les bouchées et chacun dose les accompagnements à sa manière.'
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
          'Pour cuisiner, on choisira un riz parfumé à grains longs pour accompagner une sauce ou un poisson, ou un riz gluant lorsque la recette réclame cette texture. Acheter un paquet étiqueté « jasmin » ne garantit pas à lui seul une origine cambodgienne : vérifiez l’étiquette et la provenance.'
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
          'Lors de la fête de l’Eau, Bon Om Touk, l’ambok — du riz pilé ou aplati, souvent associé à la noix de coco et à la banane — rappelle que le grain peut être transformé pour des moments particuliers. Le riz relie ici le repas, le geste et la mémoire collective.'
        ]
      },
      {
        title: 'Comment découvrir le riz cambodgien chez soi ?',
        paragraphs: [
          'Commencez par comparer deux riz : un riz parfumé cambodgien clairement identifié et un riz blanc courant. Faites-les cuire séparément selon les indications de leurs emballages, sans sauce, puis sentez-les et observez leur tenue. Le parfum et la texture comptent autant que la blancheur du grain.',
          'Servez le riz avec un amok de poisson, un lok lak, un bai sach chrouk ou une soupe. Préparez aussi un petit bol de légumes frais ou de condiments : les convives pourront construire des bouchées différentes sans multiplier les plats.',
          'Pour passer de l’histoire à la pratique, retrouvez notre atelier consacré à la composition d’un repas cambodgien. Le riz y devient le point de départ de l’assiette, pas un simple détail posé à côté.'
        ]
      }
    ],
    socialImage: '/images/cuisine/v17-table-meal-1600.jpg',
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
      { label: 'UNESCO (2015) — Jeux rituels liés aux cultures rizicoles', url: 'https://ich.unesco.org/en/RL/tugging-rituals-and-games-01080' }
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
          'La transformation change l\'aspect et les usages du poivre. Mais cette diversité ne doit pas masquer ce que les quatre formes ont en commun : elles résultent d\'une culture située dans la même région de production et de méthodes de préparation encadrées. Pour comparer leurs parfums et savoir quand les employer, la fiche ingrédient sera plus utile qu\'une longue liste de recettes dans ce Carnet.'
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
    imageWidth: 6000,
    imageHeight: 4000,
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
    title: 'Kroeung : comprendre une famille de pâtes aromatiques',
    eyebrow: 'Gestes',
    intro: 'Le kroeung n’est pas une seule recette figée. C’est une famille de pâtes d’aromates qui forme la base de nombreux plats cambodgiens.',
    seoDescription: 'Kroeung cambodgien : comprendre cette famille de pâtes aromatiques, le rôle de la citronnelle, du galanga, du curcuma et du combava et le geste du mortier.',
    readingTime: '6 min',
    sections: [
      {
        title: 'Une même famille, plusieurs recettes',
        paragraphs: [
          'Le terme kroeung désigne différentes pâtes d’herbes, de racines et d’épices qui servent de base parfumée à de nombreux plats. Citronnelle, galanga, curcuma, combava, ail ou échalote peuvent entrer dans leur composition selon la recette.',
          'La couleur et le parfum changent selon les ingrédients utilisés. Il n’existe donc pas une seule formule à apprendre par cœur : mieux vaut comprendre le rôle de chaque aromate et ajuster selon le plat.'
        ]
      },
      {
        title: 'Le geste compte autant que la liste',
        paragraphs: [
          'Couper finement puis piler progressivement modifie la texture et permet aux fibres et aux huiles aromatiques de se mélanger intimement. Les ingrédients les plus durs sont généralement travaillés avant les plus tendres.',
          'C’est pour cela que le geste compte autant que les ingrédients. Un kroeung bien pilé parfume le plat de façon régulière et évite de retrouver des fibres trop dures en bouche.'
        ]
      },
      {
        title: 'Sentir avant de cuire',
        paragraphs: [
          'Un bon repère consiste à sentir la pâte avant qu’elle ne touche la casserole. La citronnelle doit être nette, le galanga présent sans dominer et le combava rester précis.',
          'À la cuisson, les parfums deviennent plus doux et se mêlent davantage. C’est ce qui donne au kroeung cette saveur chaude, fraîche et très reconnaissable dans de nombreux plats.'
        ]
      }
    ],
    image: '/images/cuisine/kroeung-1600.webp',
    imageAlt: 'Plat cambodgien préparé avec du kroeung',
    imageWidth: 5184,
    imageHeight: 3456,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — glossaire gastronomique', url: tourismGuide }
    ]
  },
  {
    slug: 'comprendre-amok',
    title: 'Amok : comprendre ce qui fait sa texture et son parfum',
    eyebrow: 'Plats',
    intro: 'L’amok repose sur quelques éléments simples : un kroeung parfumé, du lait de coco et une cuisson douce qui garde le poisson tendre.',
    seoDescription: 'Amok cambodgien : comprendre le rôle du kroeung, du lait de coco et de la cuisson vapeur pour réussir une texture liée, parfumée et encore souple.',
    readingTime: '5 min',
    sections: [
      {
        title: 'Une préparation liée et parfumée',
        paragraphs: [
          'Dans l’amok de poisson, le kroeung apporte les parfums, le lait de coco donne de l’onctuosité et la cuisson douce permet à la préparation de prendre sans dessécher le poisson.',
          'Le résultat attendu n’est pas celui d’un curry très liquide : la préparation doit garder une texture souple, presque tremblante, qui enrobe le poisson.'
        ]
      },
      {
        title: 'Pourquoi la vapeur change tout',
        paragraphs: [
          'Une chaleur douce et régulière aide les œufs et le coco à lier la préparation progressivement. Une cuisson trop forte resserre rapidement la texture et peut séparer les matières grasses.',
          'La vapeur permet surtout une cuisson douce et régulière, même lorsque la préparation est assez épaisse.'
        ]
      },
      {
        title: 'Ce qu’il faut retenir en cuisine',
        paragraphs: [
          'Goûter la base avant d’ajouter le poisson, travailler un kroeung assez fin et arrêter la cuisson dès que la préparation est prise sont trois repères simples pour progresser.',
          'Les variantes sont nombreuses. Une fois que l’on comprend la texture recherchée et l’équilibre des saveurs, on peut adapter la recette beaucoup plus facilement.'
        ]
      }
    ],
    image: '/images/cuisine/amok-alt-1600.webp',
    imageAlt: 'Portions d’amok trei cambodgien présentées dans des feuilles',
    imageWidth: 1836,
    imageHeight: 4080,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: tourismGuide }
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
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2d/Kep_Crab_Market.jpg/1280px-Kep_Crab_Market.jpg',
    imageAlt: 'Étals et visiteurs sous les auvents colorés du marché de Kep, au Cambodge',
    imageWidth: 1280,
    imageHeight: 960,
    imageWidths: [],
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
    title: 'Prahok : comprendre la fermentation et l’umami',
    eyebrow: 'Fermentation',
    intro: 'Le prahok est souvent présenté comme un condiment très puissant. Bien dosé, il apporte surtout du sel, de l’umami et ce goût fermenté si particulier.',
    seoDescription: 'Prahok cambodgien : fermentation, umami, dosage et usages culinaires pour comprendre ce condiment essentiel de la cuisine khmère au-delà de son odeur.',
    readingTime: '5 min',
    sections: [
      {
        title: 'Une saveur qui dépasse l’odeur',
        paragraphs: [
          'À l’ouverture, le prahok peut impressionner par son odeur. En petite quantité dans un plat, il apporte surtout du sel, de l’umami et une saveur fermentée qui donne beaucoup de caractère.',
          'À la cuisson, son goût devient plus doux et se mêle mieux au coco, aux aromates, aux légumes ou à la viande.'
        ]
      },
      {
        title: 'Le dosage comme apprentissage',
        paragraphs: [
          'Le prahok n’a pas une salinité identique d’un produit à l’autre. Le meilleur réflexe consiste donc à commencer par une quantité modeste, goûter, puis décider si le plat a réellement besoin de plus.',
          'Cette méthode évite l’erreur la plus fréquente : ajouter prahok, sauce de poisson et sel sans tenir compte de leur rôle commun.'
        ]
      },
      {
        title: 'Avec quoi le découvrir',
        paragraphs: [
          'Pour découvrir le prahok, commencez avec des légumes croquants, une sauce au coco ou un plat mijoté : ce sont des associations faciles à apprécier.',
          'La fraîcheur des légumes et des herbes équilibre très bien son goût fermenté, surtout quand on n’a pas l’habitude de le manger.'
        ]
      }
    ],
    image: '/images/cuisine/prahok-1600.webp',
    imageAlt: 'Prahok ktis servi avec des légumes',
    imageWidth: 3000,
    imageHeight: 4000,
    imageWidths: [480, 800, 1200, 1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: tourismGuide }
    ]
  },
  {
    slug: 'construire-repas-cambodgien',
    title: 'L’art de composer un repas cambodgien',
    eyebrow: 'À table',
    intro: 'Riz, plat principal, légumes, herbes, sauces et condiments : comprendre la table aide à cuisiner des recettes qui fonctionnent ensemble.',
    seoDescription: 'Comment composer un repas cambodgien : rôle du riz, plats chauds, légumes, herbes, sauces et condiments pour préparer une table équilibrée et gourmande.',
    readingTime: '5 min',
    sections: [
      {
        title: 'Le riz comme point d’équilibre',
        paragraphs: [
          'Le riz n’est pas un simple accompagnement neutre. Il absorbe les sauces, calme le sel ou le piment et permet de passer d’une bouchée très parfumée à une autre plus douce.',
          'Penser le riz avec le plat aide à mieux doser les assaisonnements : une sauce destinée à être mangée avec du riz peut sembler trop intense si on la goûte seule.'
        ]
      },
      {
        title: 'Associer des goûts et des textures différents',
        paragraphs: [
          'Un repas est plus agréable quand les plats se complètent. Un plat chaud et généreux peut être servi avec des crudités, des herbes fraîches ou un condiment acidulé.',
          'Passer d’une bouchée chaude à quelque chose de frais, de doux à acidulé, rend le repas plus léger et donne envie de goûter à tout.'
        ]
      },
      {
        title: 'Composer à la maison',
        paragraphs: [
          'Pour commencer simplement : un riz jasmin, un plat principal comme le lok lak ou l’amok, des légumes frais et un condiment suffisent. Inutile de multiplier les préparations.',
          'L’objectif est de créer plusieurs bouchées possibles : un peu de riz, davantage de sauce, une herbe fraîche, un trait d’acidité. C’est cette liberté qui rend le repas vivant.'
        ]
      }
    ],
    image: '/images/cuisine/v17-table-meal-1600.jpg',
    imageAlt: 'Table cambodgienne composée de plusieurs plats, riz, herbes et accompagnements',
    imageWidth: 1600,
    imageHeight: 1067,
    imageWidths: [1600],
    sources: [
      { label: 'Ministère du Tourisme du Cambodge — guide gastronomique', url: tourismGuide }
    ]
  }
];
