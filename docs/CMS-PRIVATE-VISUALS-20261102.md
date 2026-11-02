# Visuels privés dans Créer — lot distinct

## Portée réelle

Le formulaire partagé des cinq familles permet de préparer une demande à partir de la dernière version enregistrée, de la corriger, de demander une génération, de voir les aperçus site/social, de générer un remplacement et de valider humainement une proposition. L’IA texte n’est pas impliquée. Aucun actif public, fichier Astro, MP3, workflow social ou branche GitHub d’images n’est écrit.

Le code est préparé et testé, **pas activé sur OVH**. Les tests utilisent un fournisseur synthétique et de vrais encodages GD. Ils ne prouvent ni une génération OpenAI réelle, ni la disponibilité d’un compte, ni les droits d’une image réelle. Aucun appel payant ou modèle réel lancé dans ce lot.

## Audit et fournisseur retenu à qualifier

- `cmsVisualBriefDraft` reste le contrat de brief commun. `cmsCreationSchema` et `cmsCreationCleanFields` filtrent les champs autorisés ; notes documentaires, provenance IA antérieure, `source_binding` et scripts audio ne sont pas transmis.
- `gestion-visuels` existant est un portail d’import vers une branche GitHub. Il n’est pas réutilisé comme stockage du générateur privé : cela publierait des fichiers hors du périmètre demandé.
- Le catalogue social utilise un JPEG 1080 × 1080. Les composants du site utilisent des images responsive, avec cadrages propres à leurs gabarits. Le lot conserve un PNG 1536 × 1024, prépare des WebP 480/800/1200 sans déformer le ratio et un JPEG social 1080 × 1080 avec extension photographique douce autour d’un premier plan lisible. Aucune image existante n’est transformée.
- L’Ollama installé expose seulement `llama3.2:latest`. Le GET de ses modèles et les essais S1 texte ne prouvent aucune capacité de génération d’images.
- Fournisseur technique retenu : **API Images OpenAI**, modèle configuré `gpt-image-2.5-flare` par défaut, ou `gpt-image-2.5-sunburst` autorisé explicitement. La [documentation officielle de génération d’images](https://developers.openai.com/api/docs/guides/image-generation) décrit la génération et l’édition ; le présent adaptateur utilise uniquement la génération. Corriger la demande puis régénérer crée une nouvelle proposition, sans réécrire l’original.
- Aucun accès privé, budget monétaire ou résultat réel de ce fournisseur n’est attesté. Une vérification d’organisation peut être requise par le fournisseur. Les conditions de compte et les droits doivent être vérifiés avant qualification ; ne pas supposer qu’une clé ou une licence existe.

## Garde-fous

Le module est désactivé par défaut. `editorial_visuals` exige simultanément `enabled: true`, `qualified: true`, un callable serveur, les labels serveur et GD avec WebP/JPEG. Le modèle et la clé restent hors navigateur et dépôt. Le transport optionnel `visual-provider-adapter.php` est include-only et bloqué en HTTP par Apache.

Transport réel prévu : HTTPS vers `https://api.openai.com/v1/images/generations` uniquement, TLS vérifié, aucune redirection, connexion 5 s, total 120 s, réponse bornée à 12 Mo, PNG décodé au plus 8 Mo, dimensions exactes 1536 × 1024 avant décodage GD. Une requête, une image, qualité low ; intention de session à usage unique, aucun retry automatique. Tout callable alternatif doit lui-même imposer ses limites réseau, le wrapper ne pouvant interrompre un callable bloqué.

Authentification/CSRF existants et consentement explicite à transmettre la demande, le titre et les champs culinaires. Seule une création déjà enregistrée peut recevoir un média. Une modification concurrente du brouillon ou une version visuelle périmée est refusée. Les visuels de recettes et ateliers restent des concepts illustrés, jamais la preuve d’un plat réellement cuisiné ; aucune photo documentaire fictive autorisée.

Le quota utilise le même registre verrouillé que les briefs/textes : maximum deux tentatives par 24 h pour ce module, limite plus stricte éventuelle du texte, intervalle 60 s ; un échec reste consommé. Une allocation mensuelle globale est désormais obligatoire : `reserve_usd_cents_per_attempt` et `max_reserved_usd_cents_per_month`, entiers en cents USD, sans valeur par défaut. Une réservation verrouillée précède chaque appel ; un échec ne la rembourse pas. Le registre privé `editorial-drafts/visual-budget.json` conserve les réservations. Cette allocation repose sur une estimation conservatrice à valider avec les tarifs du modèle ; ce n’est pas une mesure des factures ni une garantie de plafond côté fournisseur. Sans budget configuré, le module reste indisponible. Aucun budget de production n’a été configuré.

Stockage : `editorial-visuals/<id-création>/v-0001/` hors webroot, répertoires 0700 et fichiers 0600. Images et métadonnées sont écrites dans un dossier temporaire privé, puis renommées sous verrou. Le manifeste conserve fournisseur/modèle configurés, date, brief, droits déclarés, version du média, ID/version/SHA-256 du brouillon et empreintes des images. Aucun secret ni réponse brute du fournisseur.

La validation humaine ajoute `approval.json` sans écrasement, statut `approved_private_only`, `publication_authorized: false`. Un remplacement crée v2 et n’hérite pas du visa v1. Les anciennes versions liées au même brouillon peuvent être relues et validées, puis choisies avec « Sélectionner cette version privée ». Cette action écrit un événement immuable `selection-0001.json`, sous verrou et contrôle de concurrence. Toute modification du brouillon invalide visas et sélection ; aucun choix n’est déduit d’un GET ou d’une nouvelle génération. Le flux HTTP des images est authentifié, borné à cinq variantes autorisées et vérifie leurs empreintes ; aucune URL publique d’asset n’est créée.

## Tests et livraison

Le smoke PHP `editorial-private-visuals-smoke.php` vérifie consentement, protection documentaire, quota, référence au brouillon, formats GD réels, permissions, versions immuables, relecture humaine, conflit, invalidation et fichier altéré. Il utilise un fournisseur synthétique, sans requête réseau. PHP 8.3 et 8.4 Linux exécutent la source non modifiée avec GD en CI. Sous Windows, une copie temporaire applique uniquement le shim de permissions documenté pour les tests ; ce n’est pas une preuve POSIX.

La recette navigateur locale utilise un fournisseur synthétique activé uniquement dans sa fixture : saisie/correction de la demande, génération, aperçu privé des deux formats et validation humaine. Le mode manuel, les cinq familles, l’historique et le calendrier restent couverts.

Après fusion/CI et réception séparée du dashboard, de Publications et du texte : préparer un paquet visuel distinct avec `gestion-contenus/index.php`, `lib.php`, `.htaccess` et l’adaptateur optionnel qualifié. La configuration privée reste séparée et n’est jamais exportée. Sauvegarde et lecture SHA-256 avant/après, puis vraie recette privée et humaine indispensables avant activation. Aucun déploiement de ce lot dans cette PR et aucune activation automatique de `qualified`.
