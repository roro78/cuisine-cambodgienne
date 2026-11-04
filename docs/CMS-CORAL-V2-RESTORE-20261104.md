# Correction du Studio MP3 — réutiliser Coral V2 et les scripts historiques

## Diagnostic vérifié dans le dépôt

L'utilisateur a constaté en production sept zones de texte vides sur des ateliers pourtant déjà sonorisés.

**Source existante :** six fichiers `src/data/atelier-recette-guides/*.json` contiennent `audio.intro` + les six champs `phases[].audioScript` et un manifeste audio `audio.asset`. Les pistes V2/V3 sont déjà présentes sous `public/audio/workshops/`. Les six capsules techniques historiques sont une autre famille de contenus.

**Cause :** `cmsStudioWorkshopCandidate()` recopiez les seuls champs pédagogiques issus de `editorial-guided-fields.json`, qui exclut volontairement `audioScript`. Le nouveau brouillon `atelier_scripts` est donc vide. La PR #203 produisait un remplissage déterministe à partir des champs de phases, **non conforme** à la narration immersive Coral V2. Ce remplissage n'est plus affiché dans l'interface.

## Correction de réutilisation des anciens ateliers

- Nouveau fichier Astro `src/pages/gestion-contenus/atelier-narrations.json.ts` : compile un **instantané privé** des sept textes **réellement enregistrés**, de leur empreinte et de l'URL de la piste associée, directement depuis les six blueprints source, sans réécriture.
- Le fichier généré `gestion-contenus/atelier-narrations.json` est **strictement protégé par Apache**, refuse toute lecture HTTP directe. Il ne figure pas dans les index sociaux ou publics.
- Le Studio PHP lit cet instantané **sur le disque seulement après authentification**, et seulement lorsque les empreintes de la fiche publiée correspondent à la version du brouillon lié.
- Les sept chapitres et le MP3 source sont visibles en lecture seule. **Aucun ancien visa n'est réutilisé** pour autoriser une nouvelle génération, aucun MP3 n'est régénéré ni modifié.
- Le formulaire de brouillon privé conserve ses textes existants. Si les zones privées sont vides, elles ne sont plus présentées comme les seules narrations disponibles pour cet atelier.
- Le paquet manuel OVH contient désormais **huit fichiers** (les sept antérieurs + l'instantané JSON protégé). Sauvegarde vérifiée obligatoire avant transfert ; HTTPS / PHP / blocage Apache / hashes à contrôler.

## Ce qui n'est PAS encore terminé (ticket #205)

Pour les nouveaux ateliers, le parcours souhaité est : **« Préparer le MP3 »** (une seule action métier) → préparer de vrais scripts parlés complets via le moteur éditorial existant et ses protections → proposer les sept scripts à relecture → **« Valider et générer »** après approbation explicite et vérifications Coral V2 → synthèse par le backend Render existant, écoute et validation humaines.

Le texte déterministe de la PR #203 ne peut pas se substituer à cette génération. Il n'est plus présenté comme bouton de génération. Aucun appel IA n'est simulé, aucune nouvelle connexion Ollama/Render n'est affirmée active.

**Référentiels impératifs à réutiliser, sans inventer un autre cahier des charges :**
- `docs/ateliers/REFERENTIEL-ATELIER-CUISINE-ET-MP3.md`
- `docs/ateliers/REFERENTIEL-NARRATION-IMMERSIVE-V2.md`
- `docs/ateliers/scripts/lok-lak-coral-v2-preproduction.md` (étalon)

Le lexique culinaire interdit notamment « fabriquer », « construire », « chantier », « poste » (dire « plan de travail »). Vérifier le vocabulaire avec `scripts/check-culinary-lexicon.mjs`. L'IA ne doit ni inventer une quantité, ni lire des consignes sous forme de liste brute, ni changer silencieusement la recette canonique. Les visas humains, la sécurité alimentaire et les droits restent des prérequis bloquants.

## Tests et publication

- `tests/editorial-existing-coral-narrations.test.mjs` : couverture des six ateliers complets, du hash source des sept textes et des vrais MP3 présents dans le dépôt.
- `tests/php/editorial-existing-coral-narrations-smoke.php dist` : le PHP retrouve les sept scripts, conserve les versions et refuse une empreinte périmée.
- `tests/cms-ovh-reception.test.mjs` : le 8e fichier appartient strictement au paquet, Apache le bloque.
- **Aucun déploiement OVH** pendant cette PR. Pour installer ensuite via FileZilla, mettre à jour l'IDE local, refaire le build, sauvegarder les huit fichiers existants et transférer le lot atomiquement avec retour arrière. Ne jamais transférer le JSON sans .htaccess.
