# C4C3G — Tableau Coral privé de pré-réception et livraison OVH contrôlée

29 octobre 2026. Ce jalon rassemble les contrôles existants
**sans** synthétiser une voix, enregistrer un MP3 ou publier une page.

## Fonctionnement

Ouvrir une **fiche atelier déjà enregistrée** dans le Studio partagé,
puis utiliser « Calculer le tableau de pré-réception ».
Les index canoniques sont demandés au serveur **seulement au clic**
(aucun appel IA). Le résultat comporte neuf lignes distinctes :

1. recette Astro publiée et empreinte SHA256 intégrale ;
2. six phases humaines complètes et distinctes ;
3. sept scripts narratifs complets ;
4. sept visas humains de texte pour la version de ce brouillon ;
5. visa humain culinaire lié à la recette publiée et à la version ;
6. droits des médias et de la voix ;
7. réception et écoute des sept MP3 Coral réels ;
8. mesures des durées audio réelles ;
9. essais mobiles des pauses, chapitres, scroll et synchronisation.

Les cinq premières lignes s'appuient sur C4C3A–F ; les **quatre
dernières restent toujours bloquées**, car il n'existe pas ici de
réception prouvée des médias ni d'autorisation de diffusion.
Un bilan peut donc afficher au mieux 5/9, sans jamais être « prêt à
générer un audio ». Une validation de texte ou culinaire reste révocable.

Le tableau détaille les sept IDs immuables :
`intro`, `installer`, `preparer`, `assembler`, `maitriser`,
`rectifier`, `terminer`.
Les minutes indiquées viennent des six phases pédagogiques ;
**ce ne sont pas des durées de MP3**, et l'introduction n'a pas de durée
d'activité. Les scripts et visas sont dérivés du brouillon privé ;
les sources documentaires, notes d'édition et contenus privés restent
hors du rapport de synthèse. La page est HTTPS, authentifiée et noindex.
En cas de perte de source ou de journal, aucun feu vert n'est inventé.

**Invariants** :
`tts_authorized=false`,
`ready_for_audio_production=false`,
`seven_audio_scripts_approved=false`,
`publication_ready=false`, `export_enabled=false`.
Pas de TTS réel, pas de retouche des MP3 historiques.

## Livraison OVH : correction du paquet CMS

Le paquet isolé devait impérativement être corrigé : `index.php`
fait `require_once` de **`publication-gap-audit.php`**. Les six fichiers
historiques n'étaient donc plus un ensemble déployable complet.

Le **nouveau paquet compte sept fichiers**, exactement :

- À la racine du site : `social-feed.json`,
  `editorial-source-index.json`, `editorial-guided-fields.json`.
- Dans `/gestion-contenus/` : `index.php`, `lib.php`,
  `publication-gap-audit.php`, `.htaccess`.

Le `.htaccess` interdit les accès HTTP directs aux deux modules PHP
internes. Le contrôle anonyme en ligne vérifie leur refus et la
protection de la page de connexion, **sans mots de passe ni POST**.
Le contrôle de paquet local échoue si le septième fichier manque ou
si la protection Apache n'est pas déclarée.

### Procédure manuelle, sans publication automatique

1. Vérifier que la CI du **SHA exact de main** est verte.
2. Créer le paquet isolé depuis le workflow GitHub
   `cms-ovh-reception.yml` (workflow_dispatch sur main).
   Récupérer l'artifact `cms-ovh-scoped-release`, avec manifeste SHA256.
3. Sur OVH, relever le chemin de la **vraie racine web** et sauvegarder
   chacun des sept fichiers présents et leurs permissions ;
   garder le dossier des brouillons et `config.php` hors webroot.
4. Vérifier le manifeste et transférer **exclusivement** les sept
   fichiers. Ne pas envoyer le README ni le manifeste dans la racine
   web, ni remplacer le site entier, ses médias ou ses MP3.
5. En lecture seule, tester :
   `node scripts/check-cms-ovh-readiness.mjs --url https://www.cuisine-du-cambodge.com/`.
   Le verdict attendu est `CMS_OVH_RECEPTION_PASS`.
6. Sur Android connecté au Studio : ouvrir un brouillon d'atelier,
   vérifier la comparaison avec la recette, les sept visas et le
   tableau C4C3G. Ne **pas** consigner de visa sans vraie revue humaine.
7. En cas d'erreur : restaurer uniquement les **sept** fichiers
   sauvegardés, garder le stockage privé intact et bloquer tout
   déclenchement de génération/publication.

**La réussite de la CI et la préparation du paquet ne signifient pas
qu'il a été transféré sur OVH.** Le workflow de publication statique
`deploy-ovh.yml` pousse une branche `ovh-production` ; il ne copie pas
à lui seul ces fichiers sur le serveur. Ne pas l'utiliser comme preuve
de réception du Studio.

## Réception automatisée

- `tests/php/editorial-coral-culinary-review-smoke.php` teste le
  tableau sur une vraie recette Astro et un atelier à six phases/sept
  scripts, sans visa, après sept visas, après revue culinaire, après
  nouvelle version et avec journal corrompu.
- `tests/cms-ovh-reception.test.mjs` vérifie la création du paquet
  de **sept fichiers** et l'interdiction HTTP des modules internes.
- CI Astro/Node + PHP 8.3/8.4 et non-régression navigateur requises.
