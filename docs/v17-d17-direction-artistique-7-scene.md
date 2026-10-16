# V17 — D17 : du site animé à la direction artistique immersive

**Date : 15 octobre 2026.** Direction à réaliser, distincte de D16. PR #49 draft. Aucune réception ou déploiement implicite.

## Diagnostic sans complaisance

La V17 D16 avait des titres déplacés via GSAP et une bonne chaîne QA, mais peu d'interactions entre objets et scènes. Les masques étaient limités et les images secondaires, notamment les desserts, apparaissaient comme des cartes 4:3. Une animation `opacity/translate` ne constitue pas un concept de direction artistique. L'expérience doit raconter les gestes, les parfums et les cultures culinaires du Cambodge, sans caricature ni surenchère.

## Références de travail

- https://buckssauce.com/
- https://www.eathungrytiger.com/
- https://www.cravburgers.shop/
- https://grail-app.com/ (ambition de finition et sobriété des transitions).

**Ne pas copier les identités, les contenus ou les trajectoires exactes.** Transformer les mécanismes en une narration culinaire propre au Cambodge.

## Sept mises en scène distinctes — critères de réception

| Acte | Intention artistique | Transformation visuelle qui doit réellement avoir lieu | Réception |
| --- | --- | --- | --- |
| 1. Amok | Invitation gourmande, sujet photographique monumental | Photographie et ornements se révèlent en profondeur. Le texte d'accroche reste lisible immédiatement ; pas de long loader. | Plat et titre dominent ; aucun effet de carte. |
| 2. Marché | Traverser la vie des étals | Couche photographique profonde ; premier plan ouvre l'espace. Une citronnelle émerge et amorce le parcours inter-scènes. | Visuellement différent d'un zoom et d'un fondu. |
| 3. Ingrédients | Nature morte en construction | Les ingrédients photographiques et botaniques convergent sans collisions autour du titre ; la citronnelle venue du marché trouve sa place. | Le visiteur distingue l'ordre de composition et le rôle des éléments. |
| 4. Mortier | Le geste culinaire | Rythme du pilon, apparition progressive du kroeung et absorption de la citronnelle ; titre secondaire à l'action. | Le geste prime sur les mots. Pas d'animation pseudo-documentaire mensongère si seules des photos sont disponibles. |
| 5. Tablée | Partage et générosité | Un détail de plat conduit à une vue d'ensemble, la table se construit par variation d'échelle/masque. | Ne pas empiler des photographies rectangulaires. |
| 6. Desserts | Surprise et douceur | **Faire disparaître la carte photo 4:3** ; photographie sur toute la scène avec une révélation radiale organique, typographie intégrée et contraste lisible. | Photo sans cadre, impact gourmand immédiat, legible desktop/mobile. |
| 7. Angkor | Émotion et respiration | Lumière/paysage révélés progressivement ; conclusion paisible sans tout faire voler. | Une scène contemplative après une séquence dynamique. |

### Fil rouge transversal

Une **citronnelle** traverse le marché, la nature morte et le mortier. Un seul élément DOM décoratif réutilise le SVG déjà versionné `/images/brand/v17-lemongrass.svg`. Sur desktop, positionnement viewport continu suivi par GSAP ScrollTrigger pendant plusieurs sections ; sur mobile, simplification nécessaire pour garantir lisibilité et fluidité. L'objet est masqué sans JavaScript et au mouvement réduit. Pas de nouveau produit IA ni de ressource réseau supplémentaire.

### Système d'effets — pas de répétition mécanique

- Photographie pleine scène, iris/masque, profondeur, objet mobile transversal, perspective et plans parallaxes.
- Mix volontaire de séquences très actives et de pauses contemplatives.
- Le texte n'est pas obligé d'entrer/sortir dans chaque section : il sert le récit et la lisibilité.
- Une séquence épinglée peut être envisagée uniquement pour le mortier si le testing UX le justifie (pas de pin automatique).
- Mobile : composition réellement dédiée, défilement tactile natif, réduction des couches à faible valeur.
- Personnes sensibles : `prefers-reduced-motion` neutralise animations; sans JS la composition reste entière; pas de changement de charte graphique.

## Exécution séquencée

**D17-A** : desserts plein cadre + masque radiaire et citronnelle voyageuse 2→4 ; QA de ces deux mécaniques sur le même build.

**D17-B** : compositions véritablement interactives marché→palette→mortier, effet de geste; valider le flux et le rythme, pas uniquement la présence de tweens.

**D17-C** : nouvelle chorégraphie Amok, tablée, finale ; accentuer la dramaturgie de 7 actes.

**D17-D** : revue artistique globale et optimisation réelle. Exiger une vidéo longue sans coupure, séquences focus, captures avant/milieu/après, tests manuels clavier/tactile/réduction du mouvement et CI. Les métriques CI ne remplacent pas l'appréciation artistique.

## Définition de fini

Pas de `PASS` artistique tant que les sept scènes ne sont pas visuellement distinctes et raccordées, et qu'une comparaison directe avec les trois références ne démontre pas un niveau de finition convaincant. **PR #49 reste draft ; pas de merge ni d'OVH avant autorisation explicite.**
