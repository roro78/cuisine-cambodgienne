# Coral V2 — Parcours unique « atelier → narration → MP3 »

**Décision produit du 6 novembre 2026.** Le Studio est le point d'entrée commun à la création manuelle et à la création assistée par IA. Le guide vocal est **facultatif** : ne jamais le créer implicitement lors de l'enregistrement d'un atelier.

## 1. Atelier d'abord : source unique et vérifiable

Dans **Créer → Atelier** (ou depuis une fiche publiée via son brouillon lié), l'utilisateur rédige manuellement ou demande à l'IA une proposition *dans les champs de la même fiche* :

1. Sélection d'une **recette canonique** valide, ingrédients et portions, anti-doublon.
2. Création du contenu de l'atelier (objectif, matériel, durée, sécurité alimentaire, gestes).
3. Définition des **six phases pratiques**, contrôlables et exécutables, selon `REFERENTIEL-ATELIER-CUISINE-ET-MP3.md`.
4. Révision éditoriale et culinaire humaine ; provenance et sources internes documentées.
5. Enregistrement en **brouillon privé versionné**, jamais publication automatique.

L'IA qui génère une proposition de contenu et l'IA qui propose les sept textes parlés sont **deux opérations différentes**. L'actuel fournisseur de création de contenu peut seulement fournir un plan : ne jamais conclure de cette sortie qu'un atelier est complet ou prêt à être narré. Les autres champs restent à valider.

## 2. Sept narrations, seulement depuis la version enregistrée

Le bouton **« Préparer les 7 narrations »** remplace le libellé trompeur « Préparer le MP3 ».

Contrat de préparation existant : `cmsCoralRequest()` dans `coral-v2-ai.php` reprend les champs validés de la fiche atelier enregistrée, la **recette canonique associée**, ses **six phases détaillées**, les référentiels Coral V2 (structure + narration), ainsi que leurs empreintes de source. La sortie est **sept textes proposés**, introduction + `installer/preparer/assembler/maitriser/rectifier/terminer`.

- Pas d'appel à partir des modifications non enregistrées.
- Pas de remplacement de scripts existants.
- Une modification de la recette/du contenu invalide les candidats et les visas anciens.
- La proposition demeure privée et doit être corrigée, enregistrée puis visée explicitement.
- Les narrations doivent guider l'élève, pas réciter les instructions affichées. Les quantités variables selon les portions ne sont **pas** dites dans le MP3.
- Références : `REFERENTIEL-NARRATION-IMMERSIVE-V2.md`, `cmsCoralCandidate()`, audits culinaires humains.
- L'interface active ce bouton **uniquement si** le fournisseur est qualifié et la fiche enregistrée. Un bouton désactivé n'est pas une preuve de fonction activable en production.

**Cas des ateliers publiés corrigé dans cette PR :** `cmsCoralRequest()` accepte désormais un brouillon privé `source_binding` lorsque sa relation serveur correspond toujours exactement à l'atelier public courant (catalogue, empreinte canonique, modèle guidé). Les sept nouveaux textes proviennent de la **recette choisie et des six phases enregistrées** dans cette version privée, jamais d'anciens MP3, scripts ou visas. Si la fiche publiée change pendant l'attente, `cmsCoralPoll()` refuse le résultat sans relancer l'appel. Un script déjà rempli empêche tout remplacement. Aucun TTS n'est autorisé.

## 3. Le vrai MP3 seulement après visa

**« Valider et générer le MP3 » est une fonction cible, pas un bouton opérationnel aujourd'hui.**

Pour l'activer dans la *même fiche* à terme :

1. Sept narrations complètes, visées humainement et rattachées exactement à la version pédagogique.
2. Revue culinaire distincte, droits médias/voix, sécurité et référentiel vérifiés.
3. Afficher les conséquences de la demande, estimation de coût et confirmation explicite.
4. Déclencher la synthèse Coral **une seule fois**, en fragments reprenables après vérification des artefacts réels, puis assembler **un MP3 final par atelier avec sept chapitres** et timestamps mesurés, plutôt que créer sept MP3 publics.
5. Écoute humaine complète du véritable MP3, puis QA mobile/desktop et publication **autorisée séparément**.
6. Une correction de script invalide le lien vers l'audio précédent ; **préserver les anciens scripts, MP3 et URL**, aucune substitution silencieuse.

Les preuves du raccordement HTTPS Studio → Traefik → Coral (ticket #205) valident **seulement le transport** : le serveur OVH n'a pas reçu les versions du Studio, le fournisseur OpenAI/TTS reste fermé. Avant tout traitement réel : livraison PHP ciblée, tests authentifiés, puis activation distincte du provider et du futur TTS. Aucun appel facturable n'est autorisé par ce document.

## 4. Réception métier

Tester sans régresser le Studio unique et ses quatre entrées :

| Parcours | Résultat attendu |
| --- | --- |
| Atelier manuel | Fiche complète, version enregistrée, 6 phases, sans MP3 |
| Atelier assisté IA | Proposition dans **les mêmes champs**, corrections et sauvegarde humaine |
| Préparation narration | Sept textes privés liés au SHA de la fiche et de sa recette ; aucun audio |
| Modification d'atelier | Verrouillage des narrations/visas périmés, préservation de l'historique |
| Atelier déjà publié | Reprise d'un brouillon lié, protection des MP3 ; identifier le trou de génération avant de l'activer |
| Synthèse MP3 | Indisponible jusqu'au vrai développement, visa, budget et accord explicite |
| Publication | Aucune publication automatique à la sauvegarde ni à la génération |

## 5. Livraison

Le correctif UX de cette PR ne modifie **que le code source GitHub** et ses tests : aucune livraison OVH, aucun changement de paramètres, aucun appel API ou TTS, aucun remplacement des MP3. Le Studio réellement en ligne doit être rapproché avec le code courant (`index.php`, `lib.php`, `coral-v2-ai.php` absent selon le ticket #205), ses fichiers privés et ses dépendances avant tout paquet SFTP.
