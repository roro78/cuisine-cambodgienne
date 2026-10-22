# Six ateliers de cuisine cambodgienne — plan de pilotage et clôture

> **SOURCE DE VÉRITÉ DU CHANTIER ATELIERS — mise à jour le 22 octobre 2026.**  
> Ce fichier fait foi pour la reprise dans une autre conversation. Les anciennes instructions de conversion, plus bas, sont conservées comme **archives** et ne doivent plus être exécutées.  
> **Statut : TERMINÉ ET PUBLIÉ** (livraison technique ; réception tactile sur appareil réel non consignée).  
> Périmètre : les six ateliers pratiques gratuits, leurs MP3, leur interface et leur migration SEO. **Ne pas confondre avec** le [plan Carnets](../carnets/PLAN-REFONTE-CARNETS.md), la publication Meta/n8n ou le pilote Sauce tamarin.

## Clôture opérationnelle — 22 octobre 2026

**Objectif atteint :** remplacer les six anciennes fiches de gestes par **six ateliers réellement réalisables**, avec ingrédients quantifiés, préparation finale, six grandes phases, conseils de réussite, une narration MP3 validée en sept chapitres (introduction + six phases) et une expérience mobile adaptée à la cuisine. La validation du propriétaire a été accordée ; la publication ne requiert pas la preuve d'un essai culinaire à domicile.

| Atelier publié | URL |
| --- | --- |
| Kroeung jaune | `/apprendre/pratique/kroeung-jaune/` |
| Lok Lak | `/apprendre/pratique/lok-lak-de-la-poele-a-l-assiette/` |
| Samlor Machu | `/apprendre/pratique/samlor-machu-soupe-acidulee-guidee/` |
| Num Banh Chok | `/apprendre/pratique/num-banh-chok-sauce-et-herbes-fraiches/` |
| Kuy Teav | `/apprendre/pratique/kuy-teav-bouillon-et-nouilles/` |
| Bai Sach Chrouk | `/apprendre/pratique/bai-sach-chrouk-porc-riz-et-pickles/` |

### Livrables et jalons réalisés

| Jalons | État | Preuve |
| --- | --- | --- |
| Refonte éditoriale et substitution atomique des six anciennes pages | **TERMINÉ** | [PR #92](https://github.com/roro78/cuisine-cambodgienne/pull/92), fusionnée |
| Six MP3 Coral approuvés à l'écoute, sans nouvelle synthèse ; sept chapitres par atelier | **TERMINÉ** | Intégrité MP3 et durée vérifiées par CI ; fichiers statiques conservés |
| Visuels existants réutilisés, quantités sans « 2 » redondant, libellé « Temps à prévoir » | **TERMINÉ** | [PR #93](https://github.com/roro78/cuisine-cambodgienne/pull/93), fusionnée |
| Mini-lecteur fixe en bas sur mobile, panneau coulissant chapitres/paroles, bloc desktop conservé | **TERMINÉ** | [PR #93](https://github.com/roro78/cuisine-cambodgienne/pull/93) et tests navigateur |
| Défilement automatique de la page vers la grande phase suivante pendant le MP3 ; respect du scroll manuel | **TERMINÉ** | [PR #94](https://github.com/roro78/cuisine-cambodgienne/pull/94), fusionnée |
| Sélection d'un chapitre → déplacement vers la bonne section, même si suivi auto désactivé ; MP3 repositionné | **TERMINÉ** | [PR #95](https://github.com/roro78/cuisine-cambodgienne/pull/95), fusionnée |
| Anciennes URL redirigées (301), sitemap et navigation mis à jour, 11 MP3 remplacés écartés du *build* OVH | **TERMINÉ** | [Suivi SEO](./MIGRATION-SIX-ATELIERS-SEO-SOCIAL.md) ; tests de bascule |
| Validation technique finale et publication du dernier correctif | **PASS / PUBLIÉ** | [CI `main` : 52 contrôles PASS](https://github.com/roro78/cuisine-cambodgienne/actions/runs/39671058506) ; [publication OVH SUCCESS](https://github.com/roro78/cuisine-cambodgienne/actions/runs/39671732543) |

### Traçabilité de la dernière publication

- **Commit fusionné de la PR #95 :** `b490c177b6d87648fd707545137184901af10c57`.
- **Commit source publié :** `b828d0a83b12a339ecc0cb174999a8f140896102`.
- **Branche construite `ovh-production` :** `44fc99b94586b14dbd31bfa6f2833c06a1a0928a` (message `deploy: b828d0a83b12a339ecc0cb174999a8f140896102`).
- **Workflow de publication :** [GitHub Actions #39671732543](https://github.com/roro78/cuisine-cambodgienne/actions/runs/39671732543), terminé avec succès.
- **Constat sur le domaine public :** pages Lok Lak et Kroeung accessibles en HTTP 200, HTML et script du lecteur publiés ; **cela ne remplace pas** la vérification du SHA réellement présent dans le dossier SSH d'OVH.
- **À retenir :** cette mise à jour des documents de pilotage **ne déclenche aucun nouveau déploiement**, ne modifie aucun MP3, aucune recette historique ni aucun workflow social.

### Résiduel non bloquant — ne pas rouvrir le chantier sans anomalie démontrée

- [ ] **Retour d'usage Android réel, facultatif :** sélectionner un chapitre, contrôler le glissement vers sa grande section, poursuivre l'écoute, défiler manuellement puis réactiver le suivi. Tests Chromium automatisés PASS ; aucune réception tactile personnelle n'a été consignée.
- [ ] **Exploitation OVH, au besoin :** confirmer séparément le HEAD du répertoire SSH réellement servi et documenter un retour arrière ; le succès d'Actions atteste d'abord de la branche statique.
- [ ] **SEO, suivi dans la durée :** observer la réindexation et les 301 dans Search Console ; ne pas confondre délai de Google et anomalie de migration.
- [ ] **Traçabilité des droits des images :** les visuels ont été approuvés par le propriétaire ; aucune attestation juridique supplémentaire n'est prétendue.

**Aucune action ouverte bloquante** pour la refonte des six ateliers gratuits. Les sujets distincts — *Sauce tamarin* (ancien pilote PR #88), Carnets, réseaux sociaux/n8n et éventuelles offres commerciales — restent dans leurs propres chantiers. Les fichiers MP3 historiques exclus de la publication ne sont pas automatiquement supprimés du dépôt source : toute purge future doit vérifier les références et être expressément autorisée.

## Comment reprendre ce dossier dans une autre conversation

1. Consulter cette section puis [le suivi SEO](./MIGRATION-SIX-ATELIERS-SEO-SOCIAL.md).
2. En cas de bug utilisateur, reproduire sur l'atelier concerné et vérifier le lecteur **commun aux six** avant tout correctif ciblé.
3. Ne pas régénérer les MP3 ni modifier les recettes originales ; ne pas confondre CI, branche `ovh-production` et dossier SSH servi.
4. Après toute nouvelle modification de ce chantier : noter le numéro de PR, la validation, le SHA publié et le statut ci-dessus. Aucun chantier ne doit être rouvert à partir des anciens statuts ci-dessous.

---

## Annexe historique — plan initial de conversion (ARCHIVÉ, non exécutable)

Le texte conservé ci-après constitue **l'état initial de préparation**, antérieur à la mise en production des six ateliers. Ses impératifs « à faire », « ne pas publier », « MP3 à produire » et ses statuts de PR ne correspondent plus à l'état actuel. Pour toute décision nouvelle, se référer exclusivement au **statut opérationnel du 22 octobre 2026** ci-dessus.

<details>
<summary>Afficher la feuille de route historique</summary>

### Requalification des six anciennes fiches — feuille de route

**Ne pas modifier les six articles d'origine ni leurs MP3 tant que les nouvelles pages ne sont pas prêtes.**
La référence à appliquer est \`docs/ateliers/REFERENTIEL-ATELIER-CUISINE-ET-MP3.md\`.

## Analyse du point de départ

Les six pages actuelles disposent d'un descriptif de geste et de quatre étapes, d'un champ « matériel à préparer » et d'un renvoi final vers une recette ; elles ne garantissent pas que l'élève puisse faire une recette de A à Z avec les ingrédients affichés. Les pistes MP3 Coral historiques à cinq chapitres décrivent les gestes. Ces contenus doivent être conservés comme archives/capsules pendant la migration, et ne doivent pas recevoir un faux statut « atelier complet ».

## Ordre de conversion recommandé

| Ordre | Ancienne fiche | Recette source existante | Préparation attendue | Vérification spécifique |
|---|---|---|---|---|
| 1 | Mortier | kroeung-jaune | 1 petit pot de kroeung jaune | Ingrédients exacts et texture de la pâte ; pas de dégustation de la pâte comme plat. |
| 2 | Saisie de viande | lok-lak | Lok Lak complet avec condiment | Bœuf suffisamment cuit, marinade ajoutée au bon moment, petite fournée. |
| 3 | Herbes/agrumes | num-banh-chok | Nouilles, sauce et garnitures terminées | Poisson entièrement cuit ; eau nécessaire à sa cuisson ; garnitures propres. |
| 4 | Bouillon | kuy-teav | Soupe de nouilles complète | Origine du bouillon, cuisson complète du porc et des nouilles, herbes ajoutées au service. |
| 5 | Équilibre | samlor-machu | Soupe acidulée complète | Doser tamarin après cuisson de la garniture ; vérifier sécurité de la dégustation. |
| 6 | Table | bai-sach-chrouk | Porc grillé, riz et pickles | Pickles déjà prêts ou lien vers une vraie préparation préalable ; cuisson du porc. |

**Atelier Sauce tamarin (PR #88)** : pilote séparé déjà composé d'une recette et d'un nouveau MP3 de sept chapitres. Il reste à finaliser sa fiche recette indépendante, son image finale, et les validations d'écoute. Ne pas régénérer ce MP3 pour l'adapter au contrat ; vérifier plutôt sa conformité éditoriale et décider d'une retouche seulement si la critique acoustique l'exige.

## Chaque migration est autonome

1. Créer un nouveau fichier de conception JSON en reprenant l'exemple du référentiel.
2. Lier exactement une fiche recette existante ; réutiliser les ingrédients et quantités, puis ajouter uniquement les consommables spécifiques à une expérience.
3. Valider six phases complètes (pas quatre simples astuces), et leurs repères de réussite et de correction.
4. Produire hors ligne le storyboard de sept chapitres ; éditer les scripts **avant** toute génération payante.
5. Vérifier textes, image de plat fini, sécurité, audio, mobile/desktop et passage sans MP3, puis demander revue.
6. Mettre en production seulement après approbation de la refonte, sans toucher aux autres branches/PR.

**Ne pas mélanger le présent référentiel avec la PR #88, la PR #87, les workflows n8n ou la publication Meta.**

</details>
