# Studio V4 — Aperçu de brouillon dans le gabarit public (premier lot)

## Constat

Les pages Astro du site sont statiques sur OVH. Le CMS PHP conserve les brouillons
dans des répertoires privés et ne possède pas de moteur de rendu Astro en direct.
La lecture structurée des champs du Studio UX V3 n'est donc pas une prévisualisation
de la véritable page publiée.

## Premier lot : comparaison visuelle contrôlée

Pour une **page déjà publiée** dont le brouillon a été enregistré et dont
les empreintes canoniques correspondent :

1. La page réelle est chargée dans un iframe **même origine**, isolé par sandbox
   (aucun script de la page publique n'est exécuté).
2. Une comparaison de champs de **forme strictement identique** identifie les
   textes enregistrés qui changent, sans écrire dans les sources ou les médias.
3. Seuls les anciens textes visibles et non ambigus peuvent être remplacés dans
   le DOM de cet iframe. On ne tente **aucune substitution approximative** :
   les nombres, libellés trop courts, fragments de texte et correspondances
   multiples sont refusés.
4. Si **une seule** substitution échoue, **aucune** n'est appliquée et le Studio
   affiche clairement que le rendu est celui de la page publiée, non le brouillon.
5. La liste détaillée des champs enregistrés reste consultable sous l'aperçu.

Un brouillon d'atelier publié passé dans le formulaire lié peut afficher les
modifications textuelles **compatibles** des champs déjà publics (objectif,
phases, matériel et préparation). Ses scripts audio, validations humaines,
notes privées et enrichissements n'ayant pas de correspondance dans le gabarit
public ne sont jamais présentés comme des médias publiés.

Une **nouvelle page** sans URL publiée ne peut pas utiliser ce mode : les
convertisseurs de données complets et le rendu Astro pré-publication restent
à construire. Le Studio affiche alors l'aperçu des champs enregistrés et
l'écart de publication déjà documenté.

## Contraintes et sécurité

- Uniquement la dernière version sauvegardée (ou une version historique lue).
  **Une saisie non enregistrée ne se reflète pas dans l'aperçu.**
- Vérification de la source et du contrat, refus des origines et routes inconnues.
- Même espace privé, authentification existante, aucune API ni écriture ajoutée.
- Iframe sans scripts et sans autorisation de navigation top-level.
- Le contenu public, ses photos, liens et styles restent la référence ;
  les interactions, vidéos, animations et MP3 ne constituent **pas** un aperçu
  fonctionnel de cette version.
- Un aperçu visuel n'autorise ni publication, ni transfert de MP3, ni génération
  audio/visuelle, ni changement de droits médias.
- Les données privées ne sont jamais adressées à la page publiée : seules les
  substitutions de texte dans le DOM sandboxé et dans la session du navigateur
  sont effectuées.

## Tests et livraison

- Smoke PHP : schéma exact, source étrangère rejetée, clé immuable interdite,
  champ modifié déterministe.
- Navigateur : authentification réelle en fixture, sauvegarde d'un texte de
  recette et injection strictement visuelle dans la **vraie page Astro construite**,
  sans modification du fichier publié ; parcours ateliers, versions, calendrier,
  360/390/768/1440 px préservés.
- CI avant et après fusion à vérifier avant toute livraison.

Le paquet OVH cible **uniquement**
`gestion-contenus/index.php` et `gestion-contenus/lib.php`.
Conserver une sauvegarde horodatée et les empreintes du serveur, transférer les
deux fichiers du **même commit**, puis vérifier leurs SHA256 distants et la
recette Android. Pas de transfert automatique.

## Limite produit assumée

Il ne s'agit **pas encore d'un rendu complet Astro d'un brouillon avant
publication**. Pour atteindre cela sans approximation, il faudra un moteur
de prévisualisation basé sur les mêmes données typées que les pages Astro,
une chaîne de build/preview privée et un contrôle de tous les assets.
Aucune approximation PHP reproduisant à la main les cinq templates ne doit
être confondue avec ce futur moteur.
