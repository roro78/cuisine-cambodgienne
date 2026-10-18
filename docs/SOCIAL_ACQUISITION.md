# Cuisine du Cambodge — acquisition organique n8n (pilotage humain)

## Etat de livraison et règle de sécurité

**Fichiers versionnés = préparation, pas activation du service.** Tout export n8n est `active:false`. Ce dépôt n'a aucun accès implicite au runtime n8n, aux tokens Meta ou à Resend. Ne jamais activer les trois workflows sans les gates ci-dessous et un essai sur les comptes Cuisine réels. **Zéro publication sans validation de l'e-mail.**

Architecture réutilisée : VPS OVH ORVEKIO, n8n (`https://n8n.orvekio.com`), Ollama `llama3.2:latest`, Resend existant et PostgreSQL. Les composants COMMON d'AhoraGO/MiHecho restent **credential-free**, mais leurs orchestrations métiers ne sont ni modifiées ni utilisées pour publier Cuisine. Le stockage `cuisine_social`, les tokens Meta et le destinataire de validation sont dédiés à Cuisine.

## Livrables

- `src/data/socialCatalog.ts` : extraction déterministe du site depuis recettes, ingrédients, culture, ateliers et techniques ; les nouveautés ajoutées à ces collections sont automatiquement intégrées **après le prochain déploiement du site**.
- `/social-feed.json` : catalogue public statique de sujets et faits sourcés sur le site, empreinte éditoriale pour repérer les mises à jour. N'inclut aucune donnée privée.
- `scripts/build-social-assets.mjs` : conversion automatique des médias du site en JPEG carré, compatible avec les publications Instagram, sans générer de fausses images. Les ateliers sans image propre sont dans le flux, mais exclus de la sélection pour un post simultané Facebook+Instagram.
- `automation/n8n/schema.sql` : file et états de publication isolés, clé unique par jour et état séparé par plateforme.
- `automation/n8n/01-drafts-email-approval.json` : calendrier journalier, lecture des sources, sélection avec priorité aux articles nouveaux/modifiés, génération locale Ollama, validation technique, stockage de brouillon, e-mail Resend, formulaire n8n en deux étapes **POST** et sauvegarde de l'approbation, du refus ou d'une demande de modification commentée. Une demande de modification reste non publiable et son commentaire est conservé pour la reprise éditoriale.
- `automation/n8n/02-publish-approved.json` : un seul envoi par jour depuis la file approuvée, claim atomique, publication Facebook et création de conteneur Instagram ; identifiants enregistrés immédiatement.
- `automation/n8n/03-reconcile-instagram.json` : vérifie si le média Instagram est prêt avant l'envoi final ; jamais de soumission répétée automatiquement après état ambigu.

## Ligne éditoriale et horaires (première hypothèse)

- 7 idées/semaine, chacune adaptée en deux textes (Facebook explicatif avec lien UTM, Instagram plus visuel avec mention du site).
- Catégories privilégiées : recettes, techniques, ingrédients, culture, ateliers. La répartition est une hypothèse à comparer au trafic réel, pas une promesse de portée.
- Création et demande de validation à **07:00 Europe/Paris** ; publication de **1 post par jour par plateforme à partir de 12:00** uniquement si une approbation est déjà enregistrée. Une validation tardive conduit au créneau journalier suivant ; pas de rattrapage en rafale.
- Publication exclusivement organique. Aucun DM automatisé, aucune promotion commerciale forcée.
- Une source peut revenir dans la rotation avec un nouvel angle, mais un nouveau contenu obtient une priorité élevée. Le tableau `posts` conserve dates, versions, statuts et identifiants des publications.
- Un nouvel atelier sans photo ne doit pas être publié avec une photo de plat qui pourrait faire croire à une démonstration réelle.

## Pré-requis à configurer hors Git (gates obligatoires)

1. Créer un **compte de base de données PostgreSQL Cuisine distinct** et appliquer `schema.sql`. Ne pas utiliser la base interne n8n comme base métier partagée ; créer un rôle dédié avec permissions limitées. Le schéma dédié est une deuxième barrière, pas une alternative à l'isolation des identifiants.
2. Importer les trois JSON dans **le runtime n8n existant**, **inactifs**, en vérifiant que 1 a les trois sources (site, Ollama, Resend), et que les 2/3 ont des credentials Meta *Cuisine du Cambodge* uniquement.
3. Dans 01, paramétrer `Resend - Cuisine` (Header Auth `Authorization: Bearer <token>`), remplacer `CONFIGURER_DOMAINE_VERIFIE` par le domaine expéditeur vérifié dans Resend et `CONFIGURER_EMAIL_VALIDATION` par l'adresse autorisée. **Ne pas** commiter ces données personnelles, secrets, ni access tokens.
4. Dans 02/03, remplacer `CONFIGURER_FACEBOOK_PAGE_ID` et `CONFIGURER_INSTAGRAM_USER_ID` par les bons identifiants **Cuisine**, pas ceux d'AhoraGO. Relier des credentials `Meta Facebook Page - Cuisine` et `Meta Instagram - Cuisine` distincts, avec droits d'édition/publication adaptés. Vérifier le type **Instagram professionnel** relié à la Page et les permissions Meta effectives. Ne jamais réutiliser les tokens de pages AhoraGO.
5. Confirmer la génération du flux et des JPEG après mise en ligne : `https://www.cuisine-du-cambodge.com/social-feed.json`, `https://www.cuisine-du-cambodge.com/social-assets/<type>-<slug>.jpg`. Les JPEG doivent être publics, accessibles à Meta en HTTPS, conformes aux formats/tailles et publiables au regard des droits d'auteur.
6. Configurer l'URL publique des webhooks n8n (`WEBHOOK_URL=https://n8n.orvekio.com/`) pour le formulaire de validation. Vérifier HTTPS/Traefik, la signature des liens `resumeFormUrl`, et l'expiration à 72 h. La simple **visite GET** de l'e-mail ne valide rien ; la décision est soumise dans un formulaire.
7. Tester le parcours complet **sans publication réelle** : feed -> prompt -> JSON -> brouillon -> Resend -> validation/refus -> transitions PostgreSQL. Vérifier les erreurs et la non-activation sur rejet/absence de réponse.
8. Lancer 02/03 sur **une seule publication explicitement approuvée** après revue visuelle du texte, des droits de la photo et des deux comptes ; vérifier les identifiants Meta, les URL publiques, et l'absence de doublons sur un second passage. Tester le cas où Facebook réussit mais Instagram échoue : intervention manuelle, pas nouveau post Facebook.
9. Faire une sauvegarde de la base et des workflows hors VPS, déclencher les trois schedules seulement après tests E2E ; ajouter une alerte erreurs n8n et une revue hebdomadaire de la file.

## Sécurité / idempotence

- Le `Save draft` utilise `ON CONFLICT DO NOTHING` : pas deux e-mails pour le même créneau si le même déclencheur repart.
- La publication est impossible sans `status=approved` enregistré après validation explicite. Un refus, une demande de modification ou un délai dépassé laisse le contenu non publiable.
- Les appels Meta sont précédés d'un **claim atomique PostgreSQL** (`FOR UPDATE SKIP LOCKED`) mettant les états en cours de soumission. En cas de crash entre appel externe et écriture de l'ID Meta, le workflow **ne retente jamais automatiquement** : vérifier le compte et réparer manuellement l'état. Le risque de livraison bloquée est préférable aux doublons.
- Un résultat de génération incorrect, des données manquantes ou une erreur de conversion bloque le brouillon. Le contrôle `claimsUsed` vérifie la provenance déclarée, mais **ne prouve pas que chaque affirmation IA est vraie** ; une revue humaine reste obligatoire.
- Ne jamais stocker de tokens Meta, clé Resend ou mot de passe en fichiers JSON, Git ou champs visibles des workflows.
- Pas de partage de credential entre les produits. Les contenus et médias sont issus de Cuisine ; la copie d'une image depuis le site n'est pas en soi une preuve de droit de republication.

## Mesure sans surinterprétation

- UTM Facebook : `utm_source=facebook&utm_medium=organic_social&utm_campaign=cuisine_organique`; Instagram : lien du profil à paramétrer avec les UTM Instagram. Les liens en légende IG ne sont pas cliquables.
- Indicateurs hebdomadaires : nombre de posts effectivement publiés, portée/impressions, visites référentes GA4 ou outil analytics respectueux de la vie privée, engagement/enregistrements, clics réels vers recettes/ateliers. Pas de coût d'acquisition calculé sans conversion fiable.
- Après 3–4 semaines, ajuster le rythme si les contenus deviennent répétitifs ou les validations trop lourdes ; l'objectif reste la découverte du site, pas l'atteinte aveugle de 14 posts hebdomadaires.

## Risques connus à lever avant activation

- **Statut du compte Instagram Cuisine non vérifié** (une Page Facebook ne suffit pas, IG doit être professionnel et autorisé).
- Accès n8n/VPS non vérifié depuis le dépôt : les exports ne prouvent pas que les credentials et la version n8n les exécutent sans adaptation.
- Identifiants Meta et expéditeur/destinataire Resend non configurés dans les exports (marqueurs volontaires).
- Les champs et versions n8n des `Wait/Form` et `HTTP Request` doivent être validés dans **l'instance installée** par une exécution réelle.
- Les photos existantes doivent recevoir un accord de republication lors de la validation éditoriale.
- Si le flux est mis à jour entre génération et publication, le post approuvé contient un instantané ; si l'article a changé de manière matérielle, refuser l'ancien brouillon.

## Références techniques

- Workflows réutilisables de l'organisation : `roro78/ahorago/automation/n8n/`, `docs/N8N_ORVEKIO_RUNTIME.md` ; ne pas modifier/activer ces workflows pour Cuisine.
- n8n, approbation avec Wait : https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/
- Meta Instagram API pour comptes professionnels : https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
- Meta /n8n : une publication Instagram utilise `/{ig-user-id}/media` puis `/{ig-user-id}/media_publish` et doit attendre que le conteneur soit prêt.
