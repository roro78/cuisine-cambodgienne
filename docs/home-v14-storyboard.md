# Home V14 — Culinary Journey

## Objectif

Transformer la Home en expérience culinaire pilotée par le scroll, sans copier l’univers visuel de Grail. Grail reste uniquement une référence de rythme, profondeur, variété des scènes et niveau de finition.

La V14 refuse la logique V13 :

`grande photo → texte → grande photo → texte`

Chaque chapitre possède sa propre grammaire visuelle.

## Audit des assets existants

Le dépôt contient actuellement sept familles d’images réellement réutilisables :

- Amok
- Amok alternatif
- Lok Lak
- Marché de Kep
- Poivre de Kampot
- Prahok
- Tamarin

Les recettes structurées disponibles sont :

- Amok Trey
- Lok Lak
- Kroeung jaune

Décision V14 : ne pas utiliser le kroeung comme chapitre central de Home. Il reste disponible dans le reste du site.

## Parcours

### 00 — Découvrez la cuisine cambodgienne
Hero spatial : très grand titre, quatre cartes culinaires sur plusieurs plans, profondeur, rotation et dispersion au scroll.

### 01 — Les plats à découvrir
Trois grandes scènes coexistantes : Amok, Lok Lak, cuisine des marchés. Passage de l’une à l’autre par déplacement spatial, pas par slideshow.

### 02 — Les saveurs du Cambodge
Mots géants et images-ingrédients sur plusieurs plans. Les objets traversent l’écran avec vitesses, rotations, scale et blur différents.

### 03 — Street food & marchés
Scène signature : scroll vertical, travelling horizontal sur cinq zones. Le viewport reste visuellement stable pendant que les stands traversent l’écran.

### 04 — Au moins une fois
Ralentissement volontaire. Grandes cartes empilées, un sujet dominant à la fois.

### 05 — Facile à cuisiner chez soi
Retour pratique : Lok Lak comme porte d’entrée facile. Les principaux ingrédients apparaissent progressivement autour du plat.

### 06 — Vous avez envie de quoi ?
Zone interactive indépendante du scroll : Viande, Poisson, Rapide, Végétal. Accessibilité par rôles tab/tablist/tabpanel.

### 07 — À table au Cambodge
Climax émotionnel. Caméra simulée qui recule pour révéler plusieurs plats et éléments de table.

### 08 — Qu’est-ce qu’on cuisine aujourd’hui ?
Sortie du dispositif cinématique. Vraies cartes recettes et liens vers le reste du site.

## Mobile

La hiérarchie narrative est conservée :

- moins d’amplitude ;
- cartes plus petites ;
- marché horizontal conservé ;
- profondeur réduite ;
- interactions utilisables au toucher ;
- aucun masquage de contenu essentiel.

## Reduced motion

Même histoire, mais retour au flux naturel :

- aucune caméra simulée ;
- pas de travelling ;
- pas de rotation ;
- pas de parallaxe ;
- sections et cartes restent toutes accessibles ;
- interaction « Vous avez envie de quoi ? » conservée.

## Critères de refus

La V14 n’est pas acceptable si :

- elle ressemble encore à cinq photos plein écran avec du texte ;
- toutes les scènes utilisent la même mise en page ;
- le marché se comporte comme un carrousel banal ;
- les animations sont si faibles qu’elles sont invisibles ;
- le mobile est une version quasi statique et appauvrie ;
- la navigation vers les recettes devient secondaire face aux effets.

## Dette / prochaine banque d’assets

La structure est prête à intégrer ultérieurement davantage de photos sans refonte. Les gains visuels les plus importants viendront de :

- nouvelles recettes photographiées ;
- brochettes / soupes / nouilles ;
- fruits de marché ;
- table complète cambodgienne ;
- ingrédients détourés sous licence compatible.

La V14 actuelle n’invente aucun faux plat : elle compose uniquement avec les assets réellement présents dans le dépôt.
