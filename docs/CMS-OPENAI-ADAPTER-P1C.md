# Transport OpenAI optionnel — briefs P1C-B

**28 octobre 2026. Code d'intégration prêt pour une recette contrôlée ; non activé sur OVH.**
Le Studio unique garde son flux de génération `cmsAiBriefGenerate` et ses garde-fous
(quota global, validation serveur, anti-doublons, versions privées, contrôle humain).
Le fichier `public/gestion-contenus/openai-brief-adapter.php` est un **adaptateur
facultatif**, sans configuration ni clé dans GitHub. Il ne modifie pas `index.php`.

## Contrat et sécurité

- API fixe : `POST https://api.openai.com/v1/responses`, sans redirection, TLS vérifié,
  délai de connexion de 5 s, délai total de 20 s, taille de réponse plafonnée à 64 Kio.
- `store: false`, sortie JSON Schema stricte à quatre champs, `max_output_tokens: 1200`.
  **Le stockage désactivé ne garantit pas l'absence de traitements ou journaux techniques
  chez le fournisseur ; voir ses règles contractuelles.**
- Seuls le sujet, l'angle, l'objectif, le contexte **saisi pour cet appel** et une éventuelle
  référence publique explicitement choisie partent vers le modèle. Pas d'autres brouillons,
  comptes, sessions, empreintes, mots de passe, notes privées antérieures ni secrets.
- Réponse refusée si statut incomplet, refus, ambiguïté ou format incorrect.
  `cmsAiBriefGenerate` réapplique ensuite son validateur, les bornes en caractères,
  l'anti-doublon et la sauvegarde privée en `draft` seulement.
- Aucune relance HTTP ni activation par défaut ; quota consommé même sur échec.
  L'appel peut être **facturé par le fournisseur** malgré l'échec côté Studio.
- Les tests `editorial-openai-brief-smoke.php` utilisent un transport injecté **simulé**.
  Ils ne prouvent ni connectivité OVH, ni facturation, ni succès réel, ni qualité historique.

## Préparation privée (sans mettre le secret dans Git)

Le fichier existant `.cuisine-asset-portal/config.php` doit **conserver**
`admin_user` et `password_hash`. Pour activer le transport ultérieurement, un
opérateur habilité, après sauvegarde, peut importer l'adaptateur PHP dans ce fichier
et ajouter `editorial_ai_briefs` au tableau de configuration déjà présent.

Exemple indicatif pour l'emplacement OVH du site **à vérifier** :

```php
require_once dirname(__DIR__).'/cdc2017/gestion-contenus/openai-brief-adapter.php';
$model = 'MODELE_API_VERIFIE';
$apiKey = trim((string) file_get_contents(__DIR__.'/openai-api-key.txt'));
$cfg['editorial_ai_briefs'] = [
    'enabled' => false, // Ne basculer sur true qu'après recette autorisée.
    'model_label' => $model,
    'max_attempts_per_day' => 2,
    'adapter' => cmsOpenAiBriefAdapter($apiKey, $model),
];
// return $cfg; à l'emplacement de retour déjà prévu dans le config.php existant.
```

La clé ne doit exister que dans un secret privé hors webroot, accessible par PHP et
protégé par les permissions adaptées (par exemple `0600`) ; ne pas la mettre dans
le navigateur, la PR, un fichier public ou un message de chat. Contrôler le chemin
réel avant toute modification. Ne jamais écraser le `config.php` par cet exemple.
Le compte API, les autorisations de modèle et les plafonds de dépenses sont distincts
d'un abonnement ChatGPT.

## Recette OVH obligatoire avant activation

1. Vérifier le déploiement **cohérent** des fichiers P1C et de l'adaptateur ;
   confirmer la syntaxe PHP 8.4 et l'extension cURL sur OVH.
2. Valider l'identifiant de modèle disponible pour **ce compte API**, son tarif,
   son plafond budgétaire et l'autorisation de transmettre le seul contexte saisi.
3. Avec permission de l'opérateur, activer temporairement, quota 1–2 et dépenses
   plafonnées côté fournisseur, puis lancer **une seule proposition non sensible**.
4. Contrôler un brouillon `origin: ai`, `state: draft`, `reviewed: false`,
   version 1, sans date automatique ni publication ; examiner titre, sources et qualité.
5. Vérifier un doublon rejeté **avant** l'appel, un échec sans relance, le retour à
   l'éditeur manuel, les logs expurgés et le quota persistant.
6. Désactiver de nouveau jusqu'à validation éditoriale et accord de mise en service.

**État actuel :** contrat du transport et tests simulés, pas de clé/API réelle
utilisée, pas de déploiement OVH, pas d'activation, pas de génération des champs
métier complets, d'image, de MP3 ni de publication.
