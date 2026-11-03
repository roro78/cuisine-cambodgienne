# Préparer le MP3 depuis l'atelier — pré-brouillon de sept textes (3 novembre 2026)

## Décision et périmètre

Une seule expérience dans le **Studio existant**. Depuis une fiche atelier, `Préparer le MP3` rejoint le brouillon lié. Dès que le brouillon d'atelier est **enregistré**, que la recette canonique est liée et que les **six phases détaillées** sont complètes, une action `Préparer les sept textes à relire` propose un texte pour l'introduction et chacun des six chapitres.

Cette première étape ne génère **aucun MP3**, n'appelle **aucune IA, aucune API externe et aucun service TTS**. Le propriétaire doit réviser les textes préparés et cliquer séparément sur `Enregistrer une nouvelle version privée`. Les visas humains déjà existants restent obligatoires, puis les autres gates Coral V2 doivent être qualifiés avant toute génération audio. La validation des sept textes n'autorise pas le TTS à elle seule.

## D'où viennent les textes ?

Seules les **données déjà enregistrées** du même brouillon sont utilisées :

- Introduction : objectif pédagogique, préparation finale, portion et préparatifs.
- Chaque phase : titre, objectif, durée prévue, gestes, observation, contrôle, sécurité, erreur, correction et consigne de pause.

Le texte reprend explicitement les libellés source, **sans prétendre les réécrire en narration définitive**. Les formulations génériques de liaison ne sont ni des quantités culinaires inventées ni un résultat de vérification d'allergènes. Les champs doivent rester sous revue humaine. Ce premier pré-brouillon est déterministe et local (PHP lors de l'affichage de la page, puis insertion en JavaScript dans le formulaire déjà authentifié).

La proposition est liée au SHA-256 du contrat `cdc-workshop-narration-binding-v1` existant. Une recette ou une phase périmée empêche l'action ; la sauvegarde refuse toujours une empreinte source obsolète. La génération refuse également les narrations trop longues plutôt que de les tronquer silencieusement.

## Préservation impérative

- Aucun texte préexistant ou aucune note de relecture n'est écrasé. La proposition n'est visible que si les sept champs de narration et leurs notes sont vides et si la source enregistrée est valide.
- Une modification non enregistrée des champs du Studio empêche l'insertion : il faut sauvegarder la version de référence et relancer l'action.
- Les sept suggestions sont insérées **dans le navigateur seulement** ; tant que le bouton d'enregistrement existant n'a pas été utilisé, aucune écriture de brouillon n'a lieu.
- Pas de visa ajouté, de changement de statut « publié », de workflow n8n, de Facebook/Instagram, de table PostgreSQL, d'API externe, de génération de voix, ni de remplacement des six MP3 Coral publiés.
- La page reste celle du Studio V3/V4 existant : pas de seconde interface Coral.

## Recette de la PR

Test de `cmsAtelierAudioTextSuggestions` sur une vraie création d'atelier avec recette liée et six phases C4C3B complètes. Vérifier la présence des sept textes source-liés, la sécurité/les gestes repris, l'absence d'accord audio, l'absence de nouvelle version avant enregistrement, le refus sur source incomplète et la non-suggestion quand un texte préexiste.

Vérifier également les contrôles HTTP/session/CSRF et les scripts du Studio mobile avec la CI actuelle PHP 8.3/8.4, Astro et navigateur synthétique. Une réussite CI ne constitue **pas** une réception en production sur OVH.

## Suite distincte

1. Après fusion et sauvegarde OVH vérifiée, livrer exclusivement les fichiers PHP du Studio nécessaires à cette UX, dans le paquet de livraison isolé actualisé, et tester sur Android.
2. Qualifier une vraie génération *audio* à partir des sept narrations approuvées avec les référentiels `docs/ateliers/REFERENTIEL-ATELIER-CUISINE-ET-MP3.md` et `docs/ateliers/REFERENTIEL-NARRATION-IMMERSIVE-V2.md`. Conserver un consentement humain spécifique `Valider et générer` seulement quand tous les contrôles de droits, de sécurité, de durée, de navigation et de sortie média auront été démontrés.
3. Toujours sauvegarder les MP3 publiés et utiliser des chemins versionnés sans écrasement.

**Non inclus :** le mot de passe PostgreSQL, Supabase Edge, les PR #196/#197, et les publications sociales.
