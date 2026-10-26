# Cuisine du Cambodge — objectifs et pilotage back-office/social
**État au 26 octobre 2026.** Ce document est le point de reprise prioritaire de la PR #129.
**Objectif utilisateur :** faire croître le trafic qualifié et une communauté autour du Cambodge, grâce à une production éditoriale authentique, originale et cohérente, puis une diffusion Facebook/Instagram pilotée depuis un dashboard privé sur Android.

## Principe non négociable
Une publication = une version exacte du contenu, une photo et des légendes validées humainement, une seule réservation d'envoi, puis au plus une publication par réseau. Toute réponse Meta/Resend ambiguë devient **revue manuelle**, jamais réémission automatique. Ne jamais créer de recette, atelier ou carnet en doublon. Ne pas modifier les textes éditoriaux historiques sans accord.

## Feuille de route avec critères de réception (PASS ≠ production)

| Jalon | Fonction attendue | Statut au 26/10 | Critère pour passer à la suite |
|---|---|---|---|
| A — socle privé | Connexion PHP, filtres, prévisualisations FB/IG, historique décisions, mobile | Code + CI PASS / OVH non testé | PHP pdo_pgsql+TLS sur OVH, rôle SQL lecteur RLS, essai Android réel |
| B — validation unique | 3 choix via un circuit n8n Wait authentifié, 72 h, même version du brouillon | Scripts Basic Auth prêts / runtime non migré / boutons absents | Test GET/POST 401/OK en environnement isolé, version verrouillée, double-clic refusé |
| C — réserve e-mail | Une seule demande Resend par brouillon, état ambigu bloqué, référence traçable | Table en prod, réservation historique #1 incohérente, workflow 01 sans réservation | Pré-réservation transactionnelle + branche « non réservé → STOP », 409/timeout gérés ; pas de deuxième envoi |
| D — publication réelle | FB puis IG, protections Meta, contrôles doublons et identifiants | Workflows exportés/inactifs | Une publication neuve validée, vérifiée sur les deux réseaux, jamais rejouée |
| E — statistiques/communauté | clics UTM, trafic site, réactions, commentaires, réponse IA avec validation humaine | Non intégré | Données réconciliées, métriques attribuées, réponse non publiée sans accord |
| F — studio éditorial IA | calendrier média, actualité, recettes typiques, ateliers MP3, carnets et images uniques | Vision validée, éléments partiels au catalogue | Création → recherche doublons → validation éditoriale → mise en ligne → campagne traçable |

## Avancement vérifié aujourd'hui
- [x] PR #129 unique et brouillon, historique des correctifs sur GitHub.
- [x] 85/85 tests Node et tests natifs PHP/PostgreSQL PASS lors de la dernière validation publiée ; confirmer le nouvel état CI après tout changement.
- [x] Workflow 01 : snapshot verrouillé dans SQL après décision humaine (export préparé, pas runtime).
- [x] Scripts GET-only / migration Basic Auth à double confirmation, sauvegarde privée (non exécutés).
- [x] Schéma de la table `validation_dispatches` réconcilié avec la structure live en lecture seule.
- [ ] **Bloquant :** n8n runtime/credentials/Wait réels non reçus.
- [ ] **Bloquant :** lecteur `cuisine_social_viewer` absent du Supabase prod ; pdo_pgsql depuis OVH non prouvé.
- [ ] **Bloquant :** réservation post #1 `reserved` malgré statut `published` ; Meta et Resend non réconciliés.
- [ ] **Bloquant :** workflow 01 fait directement `POST https://api.resend.com/emails` ; pas de réservation préalable et pas de `Idempotency-Key` actuellement.
- [ ] Boutons dashboard et édition des posts non implémentés (le dashboard reste consultation uniquement).
- [ ] Aucune activation de workflow, nouveau mail ou publication depuis ce chantier.

## Ce jalon GitHub : RLS multi-brouillons REVIEW ONLY
La production Supabase comporte actuellement seulement deux policies de réservation pour `post_id=1`. Le script `automation/n8n/sql/social-validation-dispatch-policy-REVIEW.sql` prépare, **sans application production**, des policies réservées au rôle `cuisine_n8n`, garantissant que la clé d'idempotence est dérivée du BIGINT exact et que seul un post réellement à l'état `draft` peut être réservé ; UPDATE/DELETE ne sont pas accordés.
Les tests PostgreSQL 17 jetables prouvent : état historique #1 conservé, brouillon #3 réservé une seule fois, mauvaises clés et brouillons approuvés refusés, lecteur privé exclu.
**Attention :** cette migration n'est pas à appliquer seule : le workflow 01 n'utilise pas encore les réservations et doit être refactoré en parallèle, en tenant compte des reprises `Wait` déjà envoyées. La déduplication Resend limitée à 24 h ne protège pas les relances après 72 h.

## Ordre des prochaines actions
**1.** Terminer sécurité/readiness P0 sans ouvrir les publications : audit n8n GET-only, Wait en attente, credential Basic Auth dédié, OVH PHP/TLS, état réel Resend/Meta pour Kroeung.

**2.** Sur clone isolé, implémenter réservation atomique **avant** l'appel Resend du workflow 01 et tests coupure après réservation, double clic, HTTP 409, réponse inconnue, et lien Wait expiré. Ne jamais considérer un `reserved` comme preuve d'e-mail envoyé.

**3.** Unifier les décisions « Approuver / Modifier / Refuser » avec le Wait authentifié. Le dashboard ne doit pas écrire `posts` directement. Prévoir versioning des brouillons et des actions, audit humain et UI Android.

**4.** Recetter 01 → 02 → 03 avec un nouveau post, sans utiliser le post historique. Réconcilier chaque ID Facebook/Instagram ; autoriser publication réelle seulement après réception complète.

**5.** Étendre à la génération de contenus originaux et à l'acquisition : calendriers, nouvelles recettes testées, culture sans doublons de format, images variées, MP3 d'ateliers, UTM et KPIs de trafic.

## Pilotage et responsabilités
Les migrations SQL REVIEW et n8n ne sont pas des commandes de production. L'opérateur doit conserver les credentials dans n8n/OVH et vérifier l'absence de Wait en cours ; aucune clé/API ne doit figurer dans le chat. Les tests CI ne prouvent pas la connectivité OVH ni le comportement réel de Meta/Resend. **Statut global : chantier en développement, P0 de bout en bout non reçu.**

## Jalon technique validé — 26 octobre 2026

La [CI #40301687770](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40301687770) est **SUCCESS** :
**85/85 tests Node PASS**, essais HTTP PHP natifs PASS, permissions RLS du portail PASS,
intégrité post-approbation PostgreSQL 17 PASS et nouveau test
`SOCIAL_MULTI_DRAFT_DISPATCH_RLS_PASS`.

La migration en revue `automation/n8n/sql/social-validation-dispatch-policy-REVIEW.sql`
a été **exécutée exclusivement sur une base PostgreSQL 17 jetable**. Elle remplace dans ce
clone les politiques de réservation limitées à `post_id=1` par un contrat multi-brouillons
strict pour `cuisine_n8n`. Les tests couvrent la réservation d'un nouveau brouillon,
l'unicité, l'interdiction d'une réservation à mauvais identifiant, l'interdiction de réserver
un brouillon déjà décidé, le refus d'UPDATE et l'absence de lecture pour le rôle dashboard.
La réservation historique `draft-1` est conservée. Le test tient compte des trous possibles
dans les identifiants BIGINT.

**Important : ce nouveau SQL ne doit PAS encore être appliqué sur Supabase.**
L'export du workflow 01 conserve le chemin direct
`Enregistrer le brouillon → Brouillon inséré ? → Envoyer la demande de validation Resend`
sans nœud de réservation ; l'automatisation n'est pas sécurisée contre les envois
répétés après relance. La migration RLS ne change aucun workflow n8n.

## Objectifs de réception mesurables

| Priorité | Résultat final attendu | Preuve exigée |
|---|---|---|
| P0 — sécurité | Aucun envoi Meta ou Resend sans vérification humaine de la version exacte ; aucun double envoi ; accès privé protégé | Tests concurrence, rejeu, délai de 72 h, panne réseau et rapprochement fournisseur, puis essai réel contrôlé |
| P0 — dashboard | Depuis Android : voir l'image/légendes, demander une modification, refuser ou approuver sans confusion | Les trois décisions exécutées de bout en bout vers **le même Wait n8n**, sans deuxième chemin SQL |
| P0 — production | Une nouvelle publication explicitement validée est publiée **une seule fois** sur FB et IG | IDs vérifiés sur les plateformes, aucun doublon, rollback manuel testé |
| P1 — production éditoriale | Créer une recette, un carnet culturel ou un atelier MP3 réellement nouveau, cohérent sur toutes les pages et réseaux | Recherche d'antériorité, relecture culinaire, images distinctes, narration synchronisée, approbation avant diffusion |
| P2 — acquisition | Chaque publication renvoie vers la page canonique, avec attribution du trafic et suivi de communauté | UTMs contrôlés, tableau de bord des clics/visites/réactions/commentaires et réponse assistée avec validation humaine |

La cadence de publication et les objectifs chiffrés de trafic seront proposés **après**
un premier cycle de mesures réelles ; ne pas les inventer avant la réception de l'analytics.

### Définition de « chantier terminé »

**Un fonctionnement complet constaté, pas seulement une CI verte :** au moins un nouveau
contenu original sans doublon ; validation privée sur Android ; prise en compte d'une
révision et d'un refus ; approbation verrouillée ; réservations Resend fiables ; publication
unique FB/IG ; liens vers le site traçables ; retour d'expérience éditorial consigné.
Les contenus historiques doivent être préservés. Un audit positif de l'ancien post Kroeung
est une condition séparée, jamais un prétexte pour le republier.
