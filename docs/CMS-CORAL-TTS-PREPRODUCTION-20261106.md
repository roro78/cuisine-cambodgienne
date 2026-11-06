# Coral V2 — chantier audio, jalon 1 : séparation pré-TTS et contrôle MP3

**6 novembre 2026 — PR de préparation sans appel facturable.** Dépend de [PR #220](https://github.com/roro78/cuisine-cambodgienne/pull/220), déjà reçue sur OVH au SHA `8c2698f5998bbba384d16d485d292d009f5fa0cd`, et de la [clôture technique](https://github.com/roro78/cuisine-cambodgienne/pull/221).

## Décision métier

**La source est un atelier enregistré, pas un bouton MP3 autonome.** Création manuelle ou IA puis validation d'une recette canonique et six phases ; génération/rédaction des sept scripts parlés ; visa individuel 7/7 ; visa culinaire sur la même version ; vérification des droits de la voix/médias, moteur TTS et budget ; confirmation explicite avant dépense ; production d'un audio privé et revue ; publication séparée.

La réception technique Studio PHP/Traefik/Coral est **CLOSE**, ne pas relancer l'installation. Le fournisseur de **textes IA** reste non qualifié, aucune soumission n'est permise. Les MP3 anciens restent immuables.

## Correctif de logique : deux portes différentes

### Avant synthèse : première porte

`cmsCoralTtsPreproductionGate()`, à partir du tableau serveur `cmsAtelierCoralPrereception()`, vérifie la provenance et les statuts de :

1. Recette source canonique et empreinte courante ;
2. Six phases pédagogiques complètes ;
3. Sept scripts texte enregistrés ;
4. Sept visas humains, version et texte exacts ;
5. Visa culinaire humain sur la recette canonique courante.

Il expose en outre quatre **blocages persistants** non contournables par un argument utilisateur :
- Droits sur la voix Coral et les médias **non encore attestés dans un journal privé** ;
- Fournisseur vocal et voix autorisés **non qualifiés** ;
- Budget de synthèse et idempotence **non qualifiés** ;
- Confirmation humaine de déclenchement pour une version fixe **non mise en œuvre**.

**Résultat garanti : `launch_available=false`, `tts_authorized=false`, `audio_generated=false`, `publication_ready=false`.** Le Studio présente **« Valider et générer le MP3 » uniquement comme bouton désactivé**, en distinguant clairement cette fonction de « Préparer les 7 narrations ». Aucun endpoint, commande, API ou permission de génération n'est ajouté.

### Après synthèse : seconde porte

Les conditions de réception des MP3 **ne sont pas des conditions préalables au tout premier MP3**. Elles doivent être contrôlées **après** génération, sur les octets réels : intégrité des fragments, durée audio réellement mesurée, assemblage final et chapitres, lecture complète, pauses et navigation mobile, droits et bon versionnement. Ne jamais marquer ces éléments PASS à partir du texte ou d'une simulation.

## Feuille de route bloquante avant un vrai clic TTS

1. Confirmer la source et la version, la liaison historique, les sept textes approuvés, et l'audit culinaire — aucun visa fabriqué ;
2. Définir, puis implémenter le journal humain des droits d'utilisation voix/médias, révocable, versionné, vérifié en lecture seule ;
3. Qualifier un fournisseur de synthèse vocal réellement accessible à Orvekio (voix autorisée, langue française, format, durée, latence, prix), vérifier les plafonds de facturation réels sans croire qu'un simple réglage de budget applicatif suffit ;
4. Définir contrat de demande et résultat, clé d'idempotence immuable atelier+version+7 hash de textes+voix, quotas, file durable, gestion d'incertitude et reprise de fragments, sans relance automatique en cas de statut inconnu ;
5. Conserver les fragments **privés, sans écraser les MP3 publiés**, assembler un MP3 unique avec sept chapitres et durées mesurées, distinguer « audio produit » de « audio approuvé » ;
6. Réception humaine d'écoute, suivi d'une décision séparée de publication ;
7. Test en sandbox avec faux fournisseur puis premier test facturable **après accord explicite du propriétaire** ; lancement opérationnel seulement après résultat observé.

## Test ajouté

`tests/php/editorial-coral-culinary-review-smoke.php` démontre que (a) sur sept textes sans visas le TTS reste verrouillé, (b) après visas 7/7 et visa culinaire la production reste verrouillée pour les quatre contrôles manquants, (c) des statuts de pré-réception forgés ou contradictoires sont refusés. Aucune synthèse ni nouveau média ne résulte de ces tests.

## État et livraison

Cette branche est **du code source non déployé**, en PR ciblée empilée sur #220. Elle ne modifie pas les paramètres `enabled=false`, `qualified=false`, `coral_v2_qualified=false`, les secrets, OVH, Orvekio, OneDrive ou les MP3.

**Prochaine implémentation** après ce premier jalon : journal de droits humains + véritable contrat TTS idempotent, en gardant le fournisseur désactivé jusqu'aux essais autorisés.
