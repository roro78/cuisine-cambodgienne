# Réception — e-mail de validation sociale avec vrais aperçus
**25 octobre 2026. Branche de revue — aucun déclenchement Meta ni n8n.**

## Objectif P0 incrémental

Le workflow n8n 01 produit actuellement un courrier de validation en texte brut avec un lien vers son formulaire `Wait`. Le présent lot remplace **uniquement le corps de la demande Resend dans l'export GitHub** par une version qui fournit **HTML et texte brut** et conserve le même formulaire de confirmation.

### Parcours prévu
1. Brouillon inséré dans `cuisine_social.posts` (la branche `Brouillon inséré ?` reste obligatoire).
2. Resend envoie un e-mail avec deux cartes : Facebook et Instagram ; photo JPEG `social-assets/` réellement référencée par le catalogue, légende propre à chaque plateforme et page de destination.
3. L'image mesure au plus 220 px dans l'e-mail ; cela ne modifie pas le fichier réel **1080 × 1080**. La grille de profil Instagram et l'application Facebook peuvent recadrer autrement.
4. Le bouton **« Examiner et donner ma décision »** mène au formulaire `Wait` n8n existant, 72 heures. La simple ouverture de l'e-mail est sans effet. Choix exclusifs : Approuver / Demander une modification / Refuser.
5. La décision n'est enregistrée que par `Persister la décision humaine`. Les workflows 02/03 ne voient que les brouillons explicitement approuvés.

### Contrôles de sûreté
- Liens de destination et photos strictement limités au domaine du site ; URL de validation restreinte au domaine HTTPS `n8n.orvekio.com`.
- Tous les textes sont échappés dans le HTML ; liens d'approbation échappés sans altération du lien texte. Pas de JS, de pixel Meta, ni de tracking dans l'e-mail.
- `from` et `to` restent des **marqueurs de configuration dans l'export GitHub** ; ne jamais écraser l'expéditeur ou le destinataire Resend réellement configurés dans l'instance.
- Aucune publication, aucun appel HTTP, aucun e-mail envoyé depuis les tests. Les tests évaluent l'expression réellement présente dans l'export.
- Les trois workflows restent `active:false`, tous les IDs de nœuds et toutes les connexions restent inchangés.

### Points bloquants avant installation dans n8n
- **Le synchroniseur actuel `scripts/sync-cuisine-n8n-runtime.mjs` ne migre pas automatiquement le corps de cet e-mail** : c'est volontaire. Il faudrait une migration qui compare l'expression précédente exacte et préserve les adresses configurées, les IDs de credentials et les connexions, sans écraser de valeurs du runtime.
- Confirmer l'URL HTTPS retournée par `$execution.resumeFormUrl` sur l'instance réelle et ses règles d'expiration.
- Tester avec **un seul e-mail réel explicitement autorisé**, d'abord en brouillon contrôlé, sans activer les schedules ni 02/03.
- Vérifier la délivrabilité HTML et le blocage potentiel des images distantes par Gmail/Outlook. Un e-mail seul n'est pas encore le dashboard privé avec historique et édition.
- La validation sociale opérationnelle nécessite encore un backend sécurisé pour afficher les brouillons présents, modifier la version et rejouer l'approbation sans divulguer les URL temporaires.
- Les photos des trois sujets pilotes, particulièrement le carnet du riz, nécessitent validation humaine indépendante (PR #127).

**Statut de ce lot : code export et tests ajoutés ; aucun déploiement runtime, aucun essai Resend/Android réel vérifié.** La PR doit rester en brouillon tant que le raccordement sécurisé et les tests sont incomplets.
