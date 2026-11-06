# Bilan de sécurité — TTS simulé Coral V2

Périmètre : code et tests isolés de la PR dépendante de #222. Aucun changement OVH, Orvekio, clé, MP3 historique, base ou sauvegarde réelle. La réception technique Studio reste acquise.

| Risque | Contrôle implémenté | Vérification |
|---|---|---|
| Texte présent pris pour un consentement | Version sauvegardée relue, sept visas et revue culinaire issus des journaux existants | Tests PHP positifs et négatifs |
| Droits fabriqués depuis le navigateur | Action authentifiée, CSRF, trois cases explicites et note ; journal privé chaîné, version/liaison/voix/fournisseur | Absence de confirmation/authentification, droits incomplets, falsification et corruption refusés |
| Ancienne autorisation réutilisée | Empreinte de fiche complète, recette actuelle, sept SHA ; nouveau contrôle serveur avant chaque chapitre/finalisation/lecture | Texte modifié pendant le traitement et droits/visa révoqués |
| Double coût après double clic ou deux workers | Identité déterministe, fichier de demande immuable, démarrage exclusif et verrou interprocessus de reprise | Soumissions et workers concurrents, reprise d'un worker encore vivant refusée |
| Réponse incertaine répétée | Intention durable avant fournisseur, reçu après octets mesurés ; absence de reçu = incertain non rejouable | Erreur fournisseur et reprise explicite refusée sans nouvel appel |
| Reprise d'une piste erronée | SHA du texte et du WAV, format réel et durée vérifiés à chaque reprise | Fragment altéré refusé sans écrasement ; reprise dans de nouveaux processus |
| Budget dépassé | Réservation commune préalable, plafonds quotidien/mensuel, verrou partagé ; réserve jamais remboursée sur supposition | Plafonds bloquants avant premier appel, coût simulé clairement distinct de toute facture |
| Médias ou journaux publics | Répertoire de tâche existant, 0700/0600 Linux ; audio derrière session CMS et Bearer worker | Refus HTTP sans jeton/session, permissions Linux, lecture après révocation refusée |
| Commande ou chemin arbitraire | `execFile` sans shell, noms internes fixes/empreintes, options FFmpeg/FFprobe bornées | Signature/codecs, taille/durée, décodage intégral et ordre des chapitres |
| FFmpeg accède au réseau | Protocoles limités à `file,pipe`, timeout et allocation bornés | Tests audio réels hors réseau |
| Ancien MP3 écrasé | Nouveau fichier privé nommé par SHA, écriture exclusive et aucun chemin public en entrée | Fichier historique témoin préservé ; aucun diff des MP3 du dépôt |
| Secret dans les erreurs | Codes whitelistés ; aucune clé requise, journal humain/note non transmis au fournisseur | Exception contenant un faux secret jamais retrouvée dans l'état retourné |
| Approbation automatique/publication implicite | Écoute privée versionnée liée au SHA, action humaine distincte ; génération n'approuve jamais ni ne publie | Manifeste avec `audio_approved=false`, `publication_ready=false` et journal d'écoute séparé |

Le callback d'autorité est du code serveur injecté, jamais une permission contenue dans le JSON. La fixture le relie aux vrais lecteurs de journaux PHP, uniquement sur un stockage temporaire. Le transport d'autorité entre les deux hôtes de production, l'image avec outils audio, le budget fournisseur, les droits de la vraie voix et l'écoute réelle ne sont **pas qualifiés** et ne sont pas activés.

Un verrou abandonné bloque jusqu'à revue ; aucun déverrouillage aveugle. Un fragment incertain ne peut pas être repris par un simple bouton. Les réservations conservatrices peuvent nécessiter une réconciliation humaine. Il n'existe aucune promesse de plafond de facturation OpenAI fondée sur le seul registre applicatif.

Les tests d'approbation sont fictifs et explicitement isolés ; ils ne constituent pas une validation humaine réelle de contenu culinaire ou de voix. Aucun compte de service, permission ou clé n'est créé. La configuration payante documentaire reste inexécutable et désactivée.

Verdict : **GO pour tests simulés isolés ; NO-GO pour fournisseur réel et déploiement de ce parcours.**
