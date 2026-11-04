# Qualification réelle Ollama / Coral V2 — 4 novembre 2026

## Périmètre et accès vérifiés

OVH Manager authentifié avec intervention du propriétaire ; console KVM connectée, session `debian` sur le VPS Orvekio identifié (distinct de l’hébergement mutualisé). Vérifications exécutées sur la machine : Debian GNU/Linux 12 (bookworm), Node.js v22.23.3, Ollama 0.13.3 ; modèle `llama3.2:latest`, ID `a80c4f17acd5`, taille affichée 2,0 Go.

Offre OVH : 4 vCPU, 8 Go de RAM, 75 Go de stockage. Relevé système avant essai : 7,6 Gio de RAM totale, 5,0 Gio utilisée, 545 Mio libre, 2,6 Gio disponible ; swap 2,0 Gio dont 214 Mio utilisés. Disque racine 74 Go dont 25 Go utilisés et 47 Go disponibles. Ces relevés ne sont pas des mesures de pic pendant l’inférence.

Le conteneur `ollama` n’a aucun port publié (`docker port ollama` ne retourne rien). Le processus Ollama écoute sur `127.0.0.1:11434` dans son espace réseau de conteneur. Les réseaux Docker incluent `n8n_default` et `web09-ollama`. Aucune configuration Docker/Traefik/pare-feu modifiée ; aucune preuve d’une route publique Ollama n’a été observée. Cette vérification ne remplace pas un audit exhaustif des routes du reverse proxy.

## Correctif avant essai

PR #209, commit `54d2b00d9dbd3b814849159418d787970478bfc3` : recette canonique complète et variante pédagogique fournies à chaque chapitre ; contrôles vocaux bloquants partagés entre sonde et fournisseur. Réutilisation du chargeur existant `loadCanonicalRecipes` et du moteur de tâches existant. Aucun nouveau Studio ni fournisseur audio.

La copie précédente du VPS était au correctif #187. Une nouvelle copie Git détachée a été préparée sous `/tmp/cdc-coral205`, avec dépendances locales. Cette préparation d’essai ne constitue aucun déploiement de service ou de site.

## Protocole réel

Depuis cette copie isolée, le processus Node de la sonde entre uniquement dans l’espace réseau du processus Ollama existant via `nsenter -n`. L’API appelée reste `http://127.0.0.1:11434`, privée au conteneur. Aucun port ouvert, aucun tunnel, aucun workflow n8n.

Commande exécutée une seule fois :

```sh
sudo -n nsenter -t 244581 -n node scripts/qualify-coral-ollama-direct.mjs --probe
```

Le PID est une observation ponctuelle, pas une configuration réutilisable sans vérification. La sonde demande un seul chapitre (`assembler`), 16 384 tokens de contexte, 1 250 tokens de sortie maximum, délai de 180 s, sans relance automatique. Les deux référentiels complets du dépôt sont chargés et empreintés, avec la recette canonique et sa variante déclarée ; aucun texte audio approuvé n’est fourni comme réponse cible.

## Chaîne MP3 contrôlée hors ligne

Le Studio possède le brouillon des sept textes, les visas humains et la revue culinaire, mais ne raccorde pas encore les nouveaux ateliers au déclenchement TTS. La passerelle historique `bridge-cooking-workshops-coral.mjs` cible le backend Render existant, voix `coral`, protège les pistes déjà présentes et exige recette, textes et empreinte approuvés. Elle est limitée aux six ateliers historiques ; le Lok Lak V2 approuvé reste verrouillé.

Contrôle d’intégrité réellement exécuté hors ligne : six MP3 historiques contrôlés (signature/empreintes/durées et manifestes) sans modification : kroeung 664,728 s ; Lok Lak 789,936 s ; Samlor Machu 663,744 s ; Num Banh Chok 620,976 s ; Kuy Teav 649,944 s ; Bai Sach Chrouk 665,664 s. `--plan` Lok Lak : sept chapitres, 27 sous-segments ; zéro appel TTS. Il ne s’agit pas d’une écoute humaine réalisée pendant cette mission.

La disponibilité du backend TTS et le transport authentifié Studio → service privé n’ont pas été testés par appel distant. Les workflows n8n ne sont pas nécessaires au dialogue direct avec Ollama. Le raccordement applicatif sûr reste une étape distincte ; ne pas activer `coral_v2_qualified`.

## Protection des existants

Aucun accès PostgreSQL/Supabase, aucune mutation de donnée éditoriale, aucun changement de workflow n8n, aucun MP3 créé/remplacé, aucun appel audio payant et aucun déploiement OVH.

## Résultat mesuré et décision

- Un seul appel réel au fournisseur pour le chapitre `assembler`.
- Durée murale enregistrée : **180 s**. Rapport : début `2026-11-04T10:00:28.435Z`, fin `2026-11-04T10:03:28.447Z` (11 h 00 à 11 h 03, heure de Paris).
- Erreur : **`The operation was aborted due to timeout`**.
- Résultat automatique : `NO_GO`, chapitre non conforme car aucun résultat reçu.
- Aucun texte retourné ni candidat enregistré ; débit tokens/s, nombre de tokens, temps de préremplissage et qualité culinaire non disponibles.
- Zéro appel TTS ; aucune relance ; essai complet de sept chapitres non lancé.

**Verdict : NO-GO pour cette configuration et ce protocole.** Un seul chapitre ne termine pas dans le budget de 180 s. L’essai ne démontre pas que le modèle est incapable de générer du français ou de cuisiner correctement : il ne permet simplement aucune validation qualitative ni aucun engagement sur le délai de sept narrations. Ne pas multiplier 180 s par sept pour présenter une durée réelle totale. La cause précise (préremplissage du contexte, ressources partagées, génération ou combinaison) reste à diagnostiquer ; aucune métrique de pic CPU/RAM n’a été recueillie pendant l’appel. Après l’échec, `docker stats --no-stream ollama` indique 0,00 % CPU et 3,952 Gio de mémoire ; le système indique 2,3 Gio de RAM disponible et 61 Mio de swap utilisé. Ce relevé après coup n’est pas une mesure de charge maximale.

## Validation du correctif, distincte du modèle

18 tests Node ciblés PASS ; contrôle lexical PASS ; sept blueprints (exemple compris) PASS ; `npm run check` sans erreur (23 hints préexistants), `npm run build` PASS. Ces vérifications sont hors fournisseur. La CI ciblée PR #209 est SUCCESS (run `41810896114`). La CI complète du commit de code `54d2b00` est SUCCESS (run `41810891192` : Astro et PHP 8.3/8.4). L’état de fusion est à lire dans la PR #209 ; aucune CI ne transforme le timeout en qualification réussie.
