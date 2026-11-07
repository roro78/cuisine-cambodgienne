# Studio Coral V2 — clôture de réception technique (6 novembre 2026)

**STATUT REÇU / GO** : le Studio PHP sur OVH mutualisé et son parcours authentifié ont été testés et reçus, **génération désactivée**.

Source de preuve : [ticket #205, dernier rapport de réception](https://github.com/roro78/cuisine-cambodgienne/issues/205#issuecomment-6685255339), actualisé le 6 novembre 2026. Commit exact livré : [PR #220](https://github.com/roro78/cuisine-cambodgienne/pull/220) `8c2698f5998bbba384d16d485d292d009f5fa0cd`. Les PR #218, #219 et #220 restent ouvertes : un code non fusionné peut déjà être en service sur OVH.

## Périmètre terminé

- Paquet CMS de 10 chemins comparé, 6 fichiers différents livrés par SFTP, empreintes SHA-256 relues sur OVH ; configuration privée et adaptations existantes conservées.
- Connexion administrateur réelle HTTPS, CSRF invalide rejeté (403), protections des modules privés (403).
- Dashboard **Créer / Mes contenus / Publications / Calendrier**, catalogue et calendrier : écrans authentifiés PASS.
- Atelier fictif privé : recette canonique, six phases et détails enregistrés ; 4 versions retrouvées ; sept champs de narration modifiables ; visas prématurés refusés.
- Atelier déjà publié : brouillon lié existant rouvert, anciens textes en lecture seule, aucun second brouillon.
- Six MP3 et huit fichiers de données historiques inchangés ; autres conteneurs et worker inchangés.
- Chrome sur site réel à 390 et 1400/1440 px PASS ; **pas de test Android physique**.
- Transport PHP web → HTTPS → Traefik → Coral PASS : [preuve #205](https://github.com/roro78/cuisine-cambodgienne/issues/205#issuecomment-6671809617).
- Quatre workflows GitHub SUCCESS au SHA exact : [CI](https://github.com/roro78/cuisine-cambodgienne/actions/runs/42128837373), [PHP](https://github.com/roro78/cuisine-cambodgienne/actions/runs/42128847454), [bundle OVH](https://github.com/roro78/cuisine-cambodgienne/actions/runs/42128847387), [Coral isolé](https://github.com/roro78/cuisine-cambodgienne/actions/runs/42128847384).

Le brouillon **« TEST TECHNIQUE CORAL — NE PAS PUBLIER »** et ses quatre versions restent privés et ne doivent pas être recyclés, effacés ni publiés automatiquement. Le rapport détaillé et le rollback ciblé sont conservés localement.

## Règle permanente pour tous les agents

**Ne pas recommencer** le raccordement réseau, l'installation du worker, les sauvegardes OneDrive, les tests de transfert des secrets ni la réception Studio **du même SHA**, sans incident observé ou changement de périmètre. Un contrôle déjà documenté est une preuve réutilisable, pas une tâche à répéter.

**Réouvrir uniquement en présence** d'une régression reproductible, d'une modification de version/environnement, d'un changement de sécurité ou d'un incident de données. Tout nouveau déploiement conserve sa propre comparaison des fichiers concernés et son rollback ciblé ; la clôture n'annule pas ces garanties.

## Périmètre NON reçu

1. Génération IA du contenu d'atelier et préparation automatique des **sept narrations** : désactivées et non qualifiées.
2. Synthèse vocale, MP3, coût réel, durée réelle, écoute humaine et publication : **non développés / non autorisés sur ce parcours**.
3. Vue Publications reçue **comme écran seulement** ; Supabase et réseaux sociaux non qualifiés ici.
4. Les réglages `enabled=false`, `qualified=false`, `coral_v2_qualified=false` ont été contrôlés après recette. **Aucun appel OpenAI, TTS, publication ni nouveau MP3.**

**Suite produit :** atelier et recette validés → six phases complètes → sept narrations éditées/relues → sept visas humains + visa culinaire → droits et coûts vérifiés → décision spécifique de génération → MP3 privé → écoute et réception audio → publication distincte. Ne pas utiliser les conditions *post-génération* (écoute, durée, navigation du MP3) comme prérequis impossible à remplir avant la première synthèse.
