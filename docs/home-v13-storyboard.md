# Home V13 — storyboard technique

## Socle réutilisé

- `src/pages/index.astro` conserve le contenu HTML indexable, les cinq images adaptatives et la structure éditoriale de la Home.
- `src/scripts/storytelling.ts` reste l’unique propriétaire du film principal : canvas, progression, transitions et `ScrollTrigger`.
- `src/scripts/motion.ts` reste propriétaire des animations globales et de la section « Aujourd’hui » ; les objets culinaires du film lui sont retirés pour éviter deux timelines concurrentes.
- `HomeCulinaryTrail.astro` est réutilisé dans le viewport du film au lieu d’être posé en décoration dans la section suivante.

## Timeline du film

Le film reste épinglé visuellement par son stage sticky sur environ `500svh` desktop et `450svh` mobile. Un unique `ScrollTrigger` scrubé pilote une progression normalisée de 0 à 1.

| Progression | Chapitre | Image / transition | Texte | Objet narratif |
| --- | --- | --- | --- | --- |
| 0–20 % | Mortier | zoom très lent, handoff organique vers le marché | titre puis texte | feuille en amorce du passage |
| 20–40 % | Frais | pan subtil, wipe végétal | lignes révélées successivement | feuille traverse le premier plan |
| 40–60 % | Kroeung | ouverture circulaire et rapprochement | titre, corps | citronnelle converge vers le mortier |
| 60–80 % | Kampot | rythme ralenti, montée verticale | titre masqué puis corps | grappe de poivre en profondeur |
| 80–100 % | Amok | cadrage resserré, lumière chaude | titre, description, CTA en dernier | vapeur à trajectoires décalées |

Chaque chapitre garde une phase de respiration avant son handoff. Les changements de scène restent réversibles lorsque l’utilisateur remonte la page.

## Sections après le film

- « Aujourd’hui » conserve les trois entrées et leurs images : le scrub différencie l’arrivée du texte, du numéro et du masque image ; le hover anime seulement l’image et le soulignement.
- La finale Amok ralentit le zoom et la copie en scrub ; la vapeur est scrollée et non animée en permanence hors viewport.
- En `prefers-reduced-motion`, le film garde ses cinq scènes et ses textes : transitions fondues, objets statiques associés à leur chapitre, aucun contenu masqué.

## QA prévue

- Desktop : 1440 × 900.
- Mobile : 390 × 844 et 430 × 932.
- Réduction de mouvement : même contenu, contrôle de lisibilité et d’overflow.
- Contrôles automatiques : `npm run check`, `npm run test:motion`, `npm run build`, puis audit Playwright des positions de scroll et captures de chapitres.
