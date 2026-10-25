# Revue éditoriale sociale — mode Android, hors ligne

### Objectif
Contrôler les JPEG sociaux **réels** (1080 × 1080) et six légendes de prévisualisation (3 sujets × Facebook/Instagram), **sans publication** ni activation n8n et sans déploiement du site OVH.

### Mode d'emploi Android
1. Ouvrir la dernière exécution GitHub Actions **CI** terminée avec succès sur la branche de la PR de prévisualisation (ou sur main après intégration).
2. Dans **Artifacts**, télécharger **cuisine-social-preview-six-posts** (ZIP).
3. Extraire l'archive sur Android et ouvrir **social-editorial-review.html** dans Chrome ou un navigateur local. Une fois extrait, **aucune connexion n'est nécessaire** : les JPEG sont inclus dans la page.
4. Filtrer « Les 6 », « Facebook » ou « Instagram ». Examiner séparément Kroeung, Amok Trey et le carnet du riz. Cocher les validations pour chaque carte, saisir les remarques et utiliser « Exporter mon avis (.json) ».
5. Joindre le retour JSON à la conversation ou transmettre des captures des cartes. La revue n'active pas la publication.

### Propriétés
- Images : assets JPEG **réellement générés par Sharp** à partir des photos existantes. Si une image ou un format manque, la CI échoue. Pas de placeholder ni de photo IA ajoutée.
- Textes : sortie du **fallback déterministe réel** du nœud \`Vérifier et cadrer les textes\`, exécuté hors réseau. Ce n'est **pas** une réponse Ollama en production et ce n'est **pas** une capture réelle de l'interface Facebook ou Instagram.
- Page : un seul fichier HTML autosuffisant, sans police ni script distant, aucun tracking, aucun appel réseau.
- Boutons « Validée » et « Exporter » : données **locales dans le navigateur** ; aucun PUT/POST/GET, aucune écriture base et aucune modification n8n.
- Confidentialité : cet aperçu n'est **pas hébergé** sur www.cuisine-du-cambodge.com. Il est livré comme artefact de CI GitHub (l'accès au téléchargement dépend de la visibilité et des règles d'accès du dépôt ; ce n'est pas un espace privé garanti par GitHub).
- La page inclut des liens canoniques dans les **textes simulés** : un éventuel clic volontaire sur un lien n'est pas nécessaire pour consulter la revue.

### Gates avant mise en service
1. Recadrages photographiques acceptés sur mobile, sujet réellement représenté (attention à l'asset d'illustration du carnet de riz).
2. Légendes Facebook + Instagram validées sur les 3 sujets.
3. Déploiement OVH **manuel** des nouveaux JPEG, vérification HTTP 200 des URLs sources.
4. Dry-run **GET-only** du synchroniseur n8n, vérification de l'empreinte exacte de chaque prédécesseur ; aucune application si différence inconnue.
5. Application n8n sous autorisation distincte, sans activer les workflows, puis tests contrôlés.

**Le ticket #121 ne se ferme qu'après revue et vérifications.**

## Correction du 25 octobre — cadrage du produit

Les premières captures mobiles montrent que le 4:5 + Sharp `attention` agrandissait et coupait le sujet. La correction affiche désormais une image **carrée** plus courte, avec une vue centrale nette (1080×840) et une extension photographique douce, sans bandes beige ni zoom vertical. Les vues changées sont : Kroeung au mortier, pas un panier d'aromates vu de côté ; Amok Trey complet dans son panier de feuilles. Aucune nouvelle photographie n'est fabriquée et les fiches du site restent inchangées. Ne pas approuver le carnet du riz avant un véritable visuel pertinent.
