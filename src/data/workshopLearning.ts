/**
 * V21 — Lessons are not recipes. Each atelier teaches one transferable skill.
 * The visual module is explicitly chosen for the skill, never inferred from the ingredient list.
 * No invented tasting measurements or unrecorded demonstration videos.
 */
export type WorkshopLearningKind = 'texture' | 'taste' | 'heat' | 'timing' | 'broth' | 'table';
export interface WorkshopStage {
  /** A short instruction that makes the pupil do something observable. */
  mission: string;
  /** Question to answer before reading the explanation. */
  question: string;
  /** An observable criterion, not an arbitrary duration or score. */
  criterion: string;
}
export interface WorkshopLearning {
  kind: WorkshopLearningKind;
  insight: string;
  evidenceTitle: string;
  evidenceIntro: string;
  experiments: [string, string, string];
  stages: [WorkshopStage, WorkshopStage, WorkshopStage, WorkshopStage];
  transfer: string;
}
export const workshopLearning: Record<string, WorkshopLearning> = {
  'piler-aromates-au-mortier': {
    kind: 'texture',
    insight: 'Le mortier ne mélange pas seulement les aromates : il écrase leurs fibres et transforme leur texture.',
    evidenceTitle: 'Du morceau à la pâte',
    evidenceIntro: 'Comparez la pâte à mi-parcours et la pâte finale. Observez les morceaux encore visibles, puis la pâte qui devient plus fine et plus souple. Le bon moment pour arrêter dépend de ce que vous voyez et sentez.',
    experiments: [
      'Écrasez un petit morceau de citronnelle épais, puis un morceau émincé fin : lequel cède le mieux ?',
      'Mettez de côté une noisette de pâte à mi-parcours pour une comparaison réelle.',
      'Comparez les deux portions : reste-t-il des fibres ? La pâte tient-elle entre vos doigts ? Son parfum est-il plus présent ?'
    ],
    stages: [
      {mission:'Préparez deux tailles de coupe et écrasez-les séparément.',question:'Laquelle résiste le moins au pilon ?',criterion:'Les fibres sont assez courtes pour se laisser broyer sans s’enrouler.'},
      {mission:'Commencez par une petite quantité d’aromates fermes.',question:'À quel moment les morceaux cessent-ils de rebondir ?',criterion:'Les morceaux commencent à se rejoindre pour former une pâte.'},
      {mission:'Ramenez la pâte vers le centre et continuez à écraser.',question:'La pâte se tient-elle quand vous en pincez un peu ?',criterion:'La pâte tient ensemble et les morceaux de citronnelle deviennent moins visibles, sans avoir besoin d’ajouter de l’eau.'},
      {mission:'Placez côte à côte vos deux échantillons.',question:'Qu’est-ce qui vous montre que la pâte est prête ?',criterion:'La pâte finale paraît plus régulière et tient mieux au pincement.'}
    ],
    transfer:'Vous saurez mieux préparer un kroeung fin et parfumé, notamment pour l’amok de poisson.'
  },
  'equilibrer-une-sauce': {
    kind: 'taste',
    insight: 'Pour réussir une sauce, commencez par la goûter. Ensuite, ajoutez un peu d’acidité, de sucre ou de sel, mais jamais tout à la fois.',
    evidenceTitle: 'Goûter avant de corriger',
    evidenceIntro: 'Répartissez la même sauce dans plusieurs bols. Vous pourrez comparer ce que changent quelques gouttes de citron, un peu de sucre ou de sel.',
    experiments: [
      'Goûtez la sauce nature et dites ce que vous ressentez : trop salée, trop douce ou trop acide ?',
      'Préparez trois variantes : une acide, une douce et une légèrement plus salée. Gardez un bol sans ajout pour comparer.',
      'Goûtez les bols dans un autre ordre. Lequel préférez-vous et pourquoi ?'
    ],
    stages: [
      {mission:'Préparez plusieurs portions identiques.',question:'Quel goût a la sauce avant tout ajout ?',criterion:'Vous savez dire ce qui manque, ou ce qui domine déjà.'},
      {mission:'Ajoutez un peu de citron dans un bol, de sucre dans un autre et de sel dans le troisième.',question:'Qu’a changé chaque ingrédient dans le goût ?',criterion:'Vous pouvez reconnaître l’effet de chaque ingrédient, car vous n’en avez ajouté qu’un par bol.'},
      {mission:'Choisissez la sauce que vous préférez et rectifiez son assaisonnement petit à petit.',question:'La sauce est-elle meilleure après cet ajout ?',criterion:'La sauce reste agréable : ni le sel, ni le sucre, ni l’acidité ne prennent le dessus.'},
      {mission:'Mélangez la position des bols et goûtez sans connaître les ajouts.',question:'Retrouvez-vous votre préférence ?',criterion:'Vous retrouvez votre sauce préférée même sans savoir ce qu’elle contient.'}
    ],
    transfer:'Vous pourrez doser plus facilement la sauce du lok lak ou l’assaisonnement d’une soupe.'
  },
  'saisir-viande-poele': {
    kind: 'heat',
    insight: 'Pour bien dorer la viande, il faut une poêle suffisamment chaude et assez de place entre les morceaux.',
    evidenceTitle: 'Saisir ou laisser cuire dans le jus ?',
    evidenceIntro: 'Comparez une poêle peu remplie et une poêle trop chargée. Regardez où le jus s’accumule et comment la viande colore. Vérifiez toujours la cuisson à cœur selon le type de viande.',
    experiments: [
      'Dans une poêle adaptée, faites cuire quelques morceaux, puis une seconde fournée plus chargée.',
      'Écoutez le grésillement et observez l’apparition de vapeur ou de jus, sans approcher le visage.',
      'Comparez la coloration obtenue et notez le rôle de l’espace entre les morceaux.'
    ],
    stages: [
      {mission:'Séchez la surface de la viande et adaptez la chauffe au type de poêle.',question:'Qu’observez-vous au premier contact ?',criterion:'La viande grésille et ne baigne pas aussitôt dans son jus.'},
      {mission:'Réalisez une seconde fournée plus chargée.',question:'Y a-t-il davantage de vapeur ou de jus dans la poêle ?',criterion:'Vous voyez qu’une poêle trop remplie dore moins bien la viande.'},
      {mission:'Ajoutez la sauce seulement après coloration de la nouvelle fournée.',question:'La viande reste-t-elle bien dorée une fois la sauce ajoutée ?',criterion:'Ajoutez la sauce après avoir doré la viande, pour bien l’enrober.'},
      {mission:'Retirez au bon moment et vérifiez une cuisson adaptée à la viande.',question:'La viande est-elle cuite à cœur, et pas seulement dorée dehors ?',criterion:'Vous savez qu’une belle couleur ne suffit pas à garantir une cuisson sûre.'}
    ],
    transfer:'La maîtrise de la saisie peut être réutilisée pour le lok lak ou d’autres viandes sautées.'
  },
  'fraicheur-herbes-agrumes': {
    kind: 'timing',
    insight: 'Les herbes fraîches, le jus de citron et son zeste ne donnent pas le même goût. Le moment où vous les ajoutez compte aussi.',
    evidenceTitle: 'Quand ajouter les herbes et les agrumes ?',
    evidenceIntro: 'Goûtez une bouchée nature, une avec des herbes et une avec un peu de citron vert. Vous sentirez comment chaque ajout change le plat.',
    experiments: [
      'Gardez une bouchée sans herbes ni citron pour comparer.',
      'Comparez une feuille fraîche, quelques gouttes de jus et une pincée de zeste séparément.',
      'Ajoutez les herbes ou le citron juste avant de servir, puis goûtez à nouveau.'
    ],
    stages: [
      {mission:'Goûtez une portion sans aucune finition.',question:'Le plat a-t-il besoin d’un parfum ou d’un peu d’acidité ?',criterion:'Vous connaissez le goût de départ.'},
      {mission:'Ajoutez une seule herbe fraîche.',question:'Le plat reste-t-il reconnaissable ?',criterion:'Vous sentez les herbes, mais aussi le goût du plat.'},
      {mission:'Essayez jus et zeste dans des bouchées distinctes.',question:'Lequel modifie surtout l’acidité, lequel surtout l’arôme ?',criterion:'Vous distinguez ces deux effets.'},
      {mission:'Assemblez la finition préférée au dernier moment.',question:'L’herbe garde-t-elle sa présence et sa texture ?',criterion:'Les herbes gardent leur goût frais sans couvrir les autres saveurs.'}
    ],
    transfer:'Vous pourrez mieux doser les herbes et le citron vert sur un kuy teav ou un num banh chok.'
  },
  'bouillon-leger-savoureux': {
    kind: 'broth',
    insight: 'Quand un bouillon réduit, son goût devient plus fort et le sel se concentre aussi. Goûtez avant d’en rajouter.',
    evidenceTitle: 'Goûter le bouillon avant et après',
    evidenceIntro: 'Prélevez un petit bol de bouillon, faites réduire le reste quelques minutes, puis comparez les deux une fois refroidis.',
    experiments: [
      'Prélevez un petit bol avant réduction et laissez-le refroidir suffisamment pour goûter.',
      'Réduisez modérément le bouillon puis prélevez un second échantillon, refroidi lui aussi.',
      'Comparez le parfum et le sel des deux bols avant de rectifier l’assaisonnement.'
    ],
    stages: [
      {mission:'Goûtez une petite portion de bouillon avant de le faire réduire.',question:'Quels arômes et quel niveau de sel percevez-vous ?',criterion:'Vous savez quel goût avait le bouillon avant la réduction.'},
      {mission:'Laissez réduire légèrement sans saler davantage.',question:'Le bouillon a-t-il davantage de goût ?',criterion:'Vous constatez que le goût se renforce même sans ajouter d’assaisonnement.'},
      {mission:'Demandez-vous si le bouillon manque de sel, d’aromates ou d’une touche de fraîcheur.',question:'Quel ingrédient ajouteriez-vous, en petite quantité ?',criterion:'Vous évitez de corriger automatiquement par du sel.'},
      {mission:'Hors du feu, essayez une finition aromatique sur une portion.',question:'Sentez-vous encore les herbes ou le citron vert ?',criterion:'Le bouillon est parfumé sans devenir trop salé.'}
    ],
    transfer:'Vous pourrez utiliser ce réflexe pour préparer un kuy teav ou d’autres soupes cambodgiennes.'
  },
  'composer-repas-cambodgien': {
    kind: 'table',
    insight: 'Pour composer un repas cambodgien, associez du riz, un plat chaud, quelques légumes frais et un condiment à part. Inutile de multiplier les préparations.',
    evidenceTitle: 'Composer un repas qui se partage',
    evidenceIntro: 'Placez le riz au centre, ajoutez un plat chaud, des légumes ou des herbes fraîches, puis un condiment. Chaque convive pourra composer sa bouchée.',
    experiments: [
      'Goûtez un peu de riz avec le plat chaud : lequel des deux goûts domine ?',
      'Ajoutez quelques légumes frais ou un peu de citron vert : que change cette bouchée ?',
      'Variez le condiment sur une seule bouchée pour comprendre pourquoi il reste à part.'
    ],
    stages: [
      {mission:'Commencez par un plat de riz à partager.',question:'Le riz accompagne-t-il bien les autres plats ?',criterion:'Le riz permet de déguster les autres plats ensemble.'},
      {mission:'Ajoutez un plat chaud : une viande sautée, du poisson ou un plat en sauce.',question:'Avez-vous vraiment besoin d’un deuxième plat copieux ?',criterion:'Le repas est généreux, sans être trop chargé.'},
      {mission:'Servez quelques légumes croquants, des herbes ou un condiment acidulé.',question:'La bouchée paraît-elle plus fraîche ?',criterion:'Quelques légumes ou herbes suffisent à changer la bouchée.'},
      {mission:'Placez le condiment à part et testez plusieurs bouchées.',question:'Chacun peut-il ajuster selon son goût ?',criterion:'Chacun peut ajouter le condiment selon ses goûts.'}
    ],
    transfer:'La prochaine fois, changez les plats : gardez le riz, un plat chaud et un peu de fraîcheur pour un repas simple à partager.'
  }
};

export function getWorkshopLearning(slug: string): WorkshopLearning | undefined {
  return workshopLearning[slug];
}
