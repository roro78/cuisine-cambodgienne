# Coral V2 — contrôle final Amok, preuve avant livraison (8 novembre 2026)

## Périmètre

PR #228, Studio PHP partagé. Aucun nouveau CMS, moteur, MP3 ou contenu public. Les opérations de production et les appels payants restent exclus de cette preuve.

## Correction ciblée

- Le panneau de contrôle final s'ouvre depuis son lien et reste accessible dans le groupe avancé.
- Le serveur contrôle la recette canonique (SHA256), les six phases, les sept narrations et deux fiches culinaires publiées liées à Amok. Leurs empreintes entrent dans le digest du visa.
- Deux URL éditoriales fixes sont récupérées côté serveur : [Chef Nak](https://chefnak.squarespace.com/cambodian-fish-amok) et [Eleven One Kitchen, relayé par l'ambassade du Cambodge](https://www.cambodiaembassyuk.org/fish-amok-recipe/). HTTPS, destination fixe, résolution IPv4 publique, épinglage de l'IP, TLS, absence de redirection et de proxy, délais et taille bornés. Les octets consultés sont empreintés et datés ; le corps HTML n'est pas enregistré. Les différences de proportions et de cuisson sont présentées comme variantes à juger, jamais comme erreurs automatiques.
- Une anomalie de nombre fixe de récipients propose une substitution explicite. Accepter ou modifier crée une nouvelle version privée via le formulaire partagé et invalide les visas. Rejeter laisse le blocage et écrit une décision privée chaînée. Les autres anomalies exigent une correction manuelle.
- Le visa final est journalisé, révocable, lié à la version, à la recette et aux fiches connexes. Il expire pour l'autorisation TTS quand la preuve externe dépasse une heure. Le serveur vérifie encore les sept visas de texte et l'attestation culinaire avant toute demande TTS et à chaque fragment de la simulation.

## Preuves réellement obtenues

- Sur copie locale du brouillon réel Amok v2 : recette canonique de 4 portions, empreinte `67277bfaf88761c9ad5d5a79d1375052302192bb21eabd4ad98812fda26283b5`, deux fiches connexes liées, une anomalie bloquante `FIXED_SERVINGS` dans le chapitre `rectifier`. Aucun changement du brouillon original.
- Depuis le PHP CLI OVH, les deux pages autorisées ont répondu HTTPS 200 avec validation des marqueurs culinaires. Empreintes des corps consultés : Chef Nak `8269b8b7c7b80d1cc246c39a9768ea7e62b5fddd292b9464dc74f47f810ce9d2`, ambassade `44468e92c8216f6434b56e61c81dcc49fb5ce8198719ac64631f07a7eb41f815` (7 novembre 2026 à 21:24 UTC). Cette sonde en mémoire n'était pas un déploiement.
- Suite isolée PHP/navigateur Coral finale : 5/5, dont parcours navigateur avec largeur 360, 390 et 1440 px. Contrats Studio/Coral/conservation : 13/13. Contrats sociaux hors ligne : 19/19. Lint PHP des deux modules : PASS. `astro check` : zéro erreur et zéro avertissement ; build Astro : 48 pages. La CI du SHA exact reste à confirmer.
- Test direct `editorial-coral-culinary-review-smoke.php` sous Windows : non concluant, car le répertoire temporaire Windows est refusé par le garde-fou `STORE_INSECURE`. La CI Linux doit exécuter ce test ; ne pas compter l'essai Windows comme un PASS.

## Limites et conditions avant production

- Les contrôles déterministes ciblent surtout Amok. Ils ne prouvent pas à eux seuls l'exactitude de chaque geste, temps, allergène ou récit culturel ; la relecture culinaire humaine reste requise.
- Le résultat initial `FIXED_SERVINGS` du brouillon v2 est réévalué dans l'addendum ci-dessous. Les sept textes, la revue culinaire et le visa final doivent toujours être approuvés par l'humain avant toute génération audio. Aucun ancien MP3 n'est modifié.
- La preuve OVH ci-dessus valide la sortie HTTPS du PHP CLI, pas le parcours authentifié du Studio après livraison. Exiger CI verte sur le SHA exact, sauvegarde hors webroot/restauration contrôlée, diff et empreintes des fichiers distants, accord distinct de livraison, réception mobile et ordinateur, puis rollback ciblé si nécessaire.
- La fusion de code et le transfert OVH demandent deux décisions distinctes selon `docs/OVH-DEPLOYMENT-RUNBOOK.md`. Aucun vrai TTS, fournisseur payant, publication ou changement du calendrier social n'est autorisé ici.

## Addendum de réception mobile

La capture du propriétaire a révélé que `FIXED_SERVINGS` sur « un ramequin » était un faux positif : la narration dit « mesurez au centre d’un ramequin », ce qui désigne un point de mesure. Ne pas accepter la substitution « vos ramequins ». Le correctif ciblé exclut le récipient singulier indéfini du contrôle de rendement, tout en conservant le blocage des nombres pluriels et de « une personne ». Sur une copie du brouillon Amok v2, le contrôle automatique corrigé ne signale plus de bloquant ; cela ne remplace pas les visas culinaires et éditoriaux humains.
