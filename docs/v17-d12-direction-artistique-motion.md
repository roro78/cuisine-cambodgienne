# Cuisine du Cambodge — V17 D12 : direction artistique du mouvement

**Cadrage actualisé : 14 octobre 2026.** Document d'exécution sur la branche de la [PR #49](https://github.com/roro78/cuisine-cambodgienne/pull/49). **Statut : implémenté en candidate, recette CI et réception humaine non acquises.** La maquette de référence reste `voyage_culinaire_au_cambodge.png`, SHA-256 `f775e6f3a483479f4a2d095406593d3d5dc354213b80d2a99839c6f23f4ddc71`, décrite par la [PR #46](https://github.com/roro78/cuisine-cambodgienne/pull/46).

## Décisions non négociables

- **Conserver la palette actuelle** (ivoire chaud, vert profond, orange corail et jaune). Aucune recolorisation dans D12.
- **Sept actes desktop plein écran volontaires** : minimum de hauteur d'écran utile, non une hauteur fixe bloquant le zoom ou le texte. Sur mobile, la hauteur dépend du contenu.
- **Conserver les compositions de la maquette** : hero à gauche/Amok à droite ; marché texte à droite ; palette centrée ; gestes centre-droit ; repas centré ; desserts gauche ; finale centrée.
- **Pas de pin ni de scroll hijacking**. GSAP/ScrollTrigger suit le scroll natif, jamais son remplaçant. Rien d'essentiel ne dépend du JS : animation désactivée, réduction du mouvement, clavier et lecteur d'écran gardent tout le contenu.
- **Aucun merge ni déploiement OVH sans réception artistique explicite**. `main` et `ovh-production` ne doivent pas être modifiés par le lot D12.

## Nouvelle dramaturgie du scroll : scène par scène

| Acte | Rôle | Effet D12 proposé et implémenté | Réception nécessaire |
| --- | --- | --- | --- |
| 1. Amok | Accroche immédiate, plat personnage principal | Lent rééquilibrage de la photographie, aucun masquage du H1 ni du CTA | Gros plan gourmand et raccord ivoire fidèles à la maquette, lisibilité hero |
| 2. Marché | Entrée dans un univers vivant | Plan photographique plus profond ; titre, phrase et invitation avancent depuis la droite | Marché toujours plein cadre, texte contrasté, aucune bande pleine ajoutée |
| 3. Palette | Pause olfactive, respiration | Aromates convergents de plusieurs directions, titre central révélé doucement | Photographies et illustrations non répétitives, composition asymétrique |
| 4. Gestes | Dimension humaine et savoir-faire | Zoom lent du geste, apparition de la copie depuis la droite, contrepoint du kroeung | Vrai geste compréhensible et proportions de la photo contrôlées |
| 5. Tablée | Point culminant collectif | Profondeur de la table et titres révélés en trois battements | Table immersive ; pas de vignette, lisibilité sur photographie |
| 6. Desserts | Contrepoint léger et gourmand | Déplacement optique doux, copie entrant depuis la gauche | Une composition dominante, desserts différenciés et crédibles |
| 7. Finale | Invitation émotionnelle | Paysage au ralenti et titres/CTA centrés en progression verticale | Finale distincte, boutons accessibles et absence d'effet de fermeture brutal |

Les raccords organiques entre actes bougent discrètement ; ils ne doivent ni ralentir le défilement ni ajouter de scène vide. Les titres restent perceptibles pendant les entrées (opacité initiale de 0,86 ; déplacements transform uniquement, sans changement de géométrie). Au défilement mobile, amplitudes réduites ; aucune animation de la photographie LCP de l'Amok.

## Gate D12 — à prouver, pas à supposer

- [ ] `npm run check` / build / contrat V17 / tests historiques : CI PASS sur HEAD exact.
- [ ] Chromium neuf résolutions : 320, 360, 390, 430, 640, 768, 1024, 1440, 1920 px.
- [ ] Des titres changent réellement de transform/opacité entre entrée et stabilisation ; texte toujours perceptible. Capture vidéo continue 390 et 1440 px.
- [ ] Sans JS et `prefers-reduced-motion: reduce` : tous les titres, images et CTA disponibles, aucun contenu masqué.
- [ ] Sur mobile : scroll tactile naturel, aucune saccade gênante ni déclenchement trop tardif ; contrôle physique non remplacé par Chromium.
- [ ] Sur desktop : présence plein écran de chaque acte, sans `height:100vh` rigide qui coupe le contenu à 200 %.
- [ ] Vérifier lisibilité des textes photographiques, visualiser les raccords et le rythme de l'ensemble **face à la maquette validée** ; réception humaine explicitement requise.
- [ ] Lighthouse / LCP / CLS / a11y / SEO mesurés sur la candidate puis sur la production après éventuel accord. Ne pas présenter les scores de labo comme des Core Web Vitals terrain.
- [ ] Licences et nature documentaire ou illustrative des médias toujours correctes.

## Suite de la direction artistique

**D13 — Fidélité des images et de leur place.** Comparer planche approuvée et captures des sept actes côte à côte : proportion et appétence de l'Amok, vie du marché, richesse des ingrédients, authenticité du geste, photographie gourmande de la tablée, variété des desserts, atmosphère de la finale. Ne remplacer un média qu'avec licence et qualification adaptées.

**D14 — Réception du mouvement.** Visionner les deux vidéos de scroll en entier, contrôler le rythme in/settle/out, les frictions tactiles, les images immobiles/no-JS/reduced-motion et le focus clavier. Ajuster les paramètres de mouvement seulement en fonction d'écarts observés.

**D15 — Finition et autorisation.** Ajuster cadrages, tailles et composition, puis faire valider les sept écrans et transitions par le commanditaire avant toute promotion de la PR #49 et toute publication OVH.

**Gouvernance :** D12 peut être techniquement PASS et artistiquement FAIL. Les deux verdicts sont suivis séparément.
