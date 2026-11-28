# #121 — Distribution des images sociales, incident du 28 novembre 2026

## Synchronisation du correctif effectivement publié

Source de réception : https://github.com/roro78/cuisine-cambodgienne/issues/121#issuecomment-7238681071

Le workflow 02 publié sous la version a14e8351-63f5-4fc2-8a6e-8fd98996758f utilise deux expressions identiques à celles du rapport. Elles routent 11 JPEG approuvés vers le commit immuable 93ffd3eea5e0724af226263f8c69571d769cb153, puis contrôlent le SHA-256 avant les écritures Meta. Facebook conserve l'URL et la légende approuvées. Le routage ne change ni l'approbation, ni les réservations, ni les horaires, ni les workflows 01/03. Il ne faut pas réimporter cet export de dépôt sur l'instance active : les paramètres et credentials du runtime sont spécifiques à l'installation.

Les tests hors réseau vérifient les 11 chemins, les chemins hors liste, la conservation de la légende et les contrôles d'intégrité. L'exécution réelle de Lok Lak a réussi après reprise Instagram uniquement ; aucun rejeu n'est autorisé. Le prochain passage automatique de 02 reste à réceptionner.

## Limites

Le miroir GitHub est un contournement opérationnel, pas un service média qualifié pour l'exploitation durable. Le HTTP 429 a été reproduit avec le profil Meta-ExternalAgent mais la réponse exacte de midi et la règle OVH en cause ne sont pas prouvées. Les images hors liste, notamment Kep v2, ne bénéficient pas du miroir. Ne pas étendre le regex par simple ajout de noms ni remplacer par une URL de branche mutable.

## Lot suivant : distribution générique (non déployé)

1. Examiner les journaux et la configuration OVH ; déterminer si la règle peut être corrigée de manière ciblée, sans affaiblir les protections du site. Qualifier les possibilités de distribution déjà présentes sur Orvekio (isolation stricte des autres projets). Comparer coût, disponibilité, capacité, quotas et conditions d'usage. Ne pas créer de nouvel abonnement ni utiliser GitHub comme CDN permanent par défaut.
2. Choisir un hôte HTTPS public stable, dédié au périmètre Cuisine du Cambodge, et une URL immuable adressée par SHA-256. Un média doit être déclaré éligible seulement après contrôle des droits, JPEG, dimensions, empreinte et récupération externe. Aucun proxy générique d'URL arbitraire, aucune exposition d'un stockage privé.
3. Enregistrer la provenance et le transport média dans les métadonnées vérifiées (de préférence droits/instantané scellés). Conserver le contrat des anciennes approbations ; une modification du contenu ou des droits impose une nouvelle validation. Vérifier que le fichier envoyé à Meta correspond au digest approuvé. Ne pas faire confiance à une URL fournie librement par Ollama.
4. Supprimer la liste figée seulement après recette d'au moins un nouveau JPEG hors liste (sans publication de test non approuvée). Vérifier l'accès depuis une source extérieure, y compris les restrictions de robots, en-têtes MIME, redirections, expiration, indisponibilité, fichier altéré, URL hors périmètre. Une sonde ne garantit pas la récupération par Meta ; observer le prochain cycle autorisé.
5. Pour les erreurs Instagram après Facebook, distinguer rejet de création explicite et résultat ambigu. Ne reprendre que si la réservation exclusive, l'approbation scellée et l'absence de doublon sont établies. Aucun rejeu Facebook. En cas d'incertitude, revue manuelle. Tester l'idempotence, les écritures concurrentes et l'échec après une réponse Meta.

Ne pas publier Kep v2 ou Lok Lak pour la recette. Ne pas modifier le runtime partagé avant comparaison exacte des versions et sauvegarde/restauration vérifiée. Le présent lot n'installe aucun composant, ne crée aucune publication et ne déclenche aucun workflow.
