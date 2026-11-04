# Qualification API Coral — 4 novembre 2026

Suite du ticket #205. Aucun déploiement ni TTS.

## Exécution réelle sur le VPS

Copie isolée `/tmp/cdc-api205`, base `ce6ffbed013df864ba963b4d61afcbf05d173f81`, Node 22.23.3 ; dépendances déjà présentes réutilisées. La copie précédente `/tmp/cdc-perf205` est conservée.

`node scripts/qualify-coral-external-text.mjs --dry-run` : PASS, 38 740 octets pour Luna et 38 743 pour Terra, sortie maximale 1 800 tokens, réservation totale 0,052517 USD (0,004774 + 0,047743). Le plafond utilisateur de 1 EUR reste un plafond, pas une cible.

La première exécution `--run` a refusé localement le format de la variable secrète : aucune requête à ce stade. Après diagnostic non divulgateur d'une inversion de casse à l'entrée KVM et correction temporaire, l'exécution réelle a retourné **NO_GO, QUAL_API_HTTP_401**, une seule tentative Luna, durée observée 0,4 s. Aucun candidat ni second appel modèle. L'authentification API reste refusée ; aucune qualité éditoriale, latence de génération ou facture n'est démontrée.

Le registre et `comparison-report.json` sont conservés sous le dossier privé de qualification prévu par le script, hors webroot. Ne pas supprimer ni réinitialiser les marqueurs pour réessayer. La réservation de la tentative reste consommée conservatoirement. Une nouvelle authentification et une décision explicite sur la reprise du protocole sont nécessaires avant toute nouvelle émission. Aucune valeur de secret n'est consignée.

## Correctif de non-régression de la file

La revue de #212 signalait que `openai-coral` remplaçait le fournisseur de toute la file alors qu'il n'accepte que le contrat Coral. Les créations éditoriales C2 étaient donc condamnées à échouer après activation.

Le worker conserve désormais Ollama pour C2 et route uniquement les requêtes Coral validées vers le fournisseur externe. Les erreurs externes ne provoquent aucune bascule silencieuse ni requête supplémentaire. Les gates, budgets et mécanismes durables restent inchangés.

Vérification locale : `node --test tests/editorial-ai-job-gateway.test.mjs tests/coral-external-job-provider.test.mjs` : 12 tests réussis. Nouveau test : les cinq familles C2 et Coral réussissent dans une même file durable avec fournisseurs simulés distincts ; contrat invalide refusé avant dispatch ; erreur externe sans fallback ; absence de double dispatch. Ce résultat est un test technique simulé, pas une qualification du modèle.

## Suite bloquée

Authentification API valide, qualification culinaire réelle, route Traefik authentifiée, raccordement des nouveaux ateliers au déclencheur explicite TTS après visas, réception audio privée puis écoute humaine. Le consentement de qualification texte ne vaut pas consentement TTS. Conserver les MP3 historiques et #205 ouvert.
