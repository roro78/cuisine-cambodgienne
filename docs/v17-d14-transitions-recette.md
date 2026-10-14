# V17 — D14 : chorégraphie des transitions et réception artistique

**État au 15 octobre 2026 : candidate D14 dans la PR #49, pas de publication.**
**Référence :** [maquette et plan directeur PR #46](https://github.com/roro78/cuisine-cambodgienne/blob/docs/v17-accueil-plan-directeur-valide/docs/v17-plan-directeur-accueil.md). Couleurs et sept chapitres plein écran inchangés.

## Intention de mise en scène

Les sept scènes doivent former **un voyage continu**, et non sept diapositives indépendantes. Chaque raccord doit changer de sensation sans ajouter de décor gratuit. D14 s'appuie sur les images existantes et sur GSAP ScrollTrigger, lié exclusivement au défilement naturel.

| Passage | Effet implémenté / proposé | Risque visuel à contrôler |
| --- | --- | --- |
| 1. Amok → marché | Le marché s'ouvre latéralement sur sa photographie plein cadre ; léger zoom indépendant de l'image. | Ne jamais recréer une bande verte permanente ni cacher le titre marché. |
| 2. Marché → palette | Raccord ivoire existant ; la composition botanique descend doucement vers sa place. | Conserver une respiration suffisante avant le titre et éviter l'accumulation d'ornements. |
| 3. Palette → mortier | Nouvelle courbe organique vert profond, animée par le scroll, qui annonce le plan photographique du geste. | Le raccord ne doit pas paraître être un bandeau artificiel ; respecter le contraste du mortier. |
| 4. Mortier → tablée | Raccord chaud préexistant ; la photographie de la tablée se découvre du haut vers le bas. | Aucun effet de carte rectangulaire ni variation de la couleur générale. |
| 5. Tablée → desserts | Nouvelle découpe ivoire claire, ample et asymétrique ; desserts révélés latéralement. | Ne pas rogner les fruits, les légendes ou la zone de CTA. |
| 6. Desserts → Angkor | Nouveau passage atmosphérique aux couleurs du coucher de soleil **déjà présent** sur le site ; ouverture progressive du paysage. | La finale doit rester solennelle, sans animation d'interface décorative. |

Trois nouveaux raccords SVG sont de **hauteur de document nulle** : ils superposent uniquement les bords de scènes, sans créer de nouvel écran ni détourner le scroll. Les trois raccords V17 historiques sont conservés.

## Contraintes de réalisation et d'accessibilité

- **Palette actuelle strictement inchangée.** Tous les aplats correspondent aux couleurs déjà utilisées dans les scènes concernées ; aucune nouvelle identité.
- Les scènes occupent volontairement au moins un écran sur desktop ; mobile adaptatif au contenu.
- Les titres, légendes, boutons, liens, en-tête et pieds de page demeurent dans le DOM et accessibles à tout instant.
- Les nouveaux raccords ont `aria-hidden="true"`, ne capturent aucun clic et ne prennent aucune hauteur verticale.
- Les masques GSAP ne s'appliquent **qu'aux médias décoratifs**, jamais à une section ou au texte.
- Aucun `pin`, aucun `ScrollSmoother`, aucune interception de roulette ou de doigt.
- Le HTML/CSS seul affiche la composition complète. `prefers-reduced-motion: reduce` ne déclenche aucune chorégraphie.
- Les captures fixes *pleine page* ne suffisent pas : il faut une **vidéo de défilement continu**, une **vidéo lente des six raccords**, et une lecture sur mobile réel avant réception graphique.

## Recette D14

### G0 — contrats et compilation
- [ ] `npm run check`, tests historiques, V17 contract, build et pages: PASS sur le HEAD exact.
- [ ] Trois nouveaux raccords présents dans le bon ordre, de hauteur nulle ; les trois raccords historiques toujours présents.
- [ ] Aucun changement de palette et aucun lien supprimé.

### G1 — navigateur desktop et mobile
- [ ] Captures et non-régression Chromium à 320 / 360 / 390 / 430 / 640 / 768 / 1024 / 1440 / 1920.
- [ ] À 1440 px, constater un changement réel de `clip-path` de la photographie de la tablée entre l'approche de la section et son entrée.
- [ ] Absence de scroll horizontal, texte rogné, overlay bloquant ou source d'image manquante.
- [ ] Toutes les sections lisibles avec JS désactivé, mouvement réduit et zoom navigateur.

### G2 — réception du mouvement
- [ ] Visionner et qualifier `v17-accueil-d14-transitions-1440.webm` et `v17-accueil-d14-transitions-390.webm` ainsi que les deux vidéos continues.
- [ ] Vérifier qu'aucune transition n'est trop rapide, mécanique, saccadée ou masquante ; correction si échec.
- [ ] Sur un **vrai téléphone tactile**, vérifier le scroll et la fluidité ; Chromium simulé n'est pas équivalent.
- [ ] Contrôler l'impact Lighthouse et les Web Vitals en **laboratoire** avant d'évoquer la performance de terrain.

### G3 — réception commanditaire / suite D15
- [ ] Comparer images, titres, proportions et rythme avec la maquette maître.
- [ ] **Validation artistique explicite** : l'approbation technique n'autorise pas la fusion de la PR ni la publication OVH.
- [ ] Suite D15 : recadrage et finition des détails visuels, ajustement des courbes et de la durée des animations à partir des constats vidéos, contrôle mobile physique.

**Statut de référence : D14 PRÉPARÉE, validation technique et artistique à compléter. Ne pas merger ni déployer.**
