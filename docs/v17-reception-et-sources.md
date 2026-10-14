# V17 — Dossier de réception, sources et portes de mise en production

**Établi le 14 octobre 2026.** Référence : [PR #47](https://github.com/roro78/cuisine-cambodgienne/pull/47), branche `feat/v17-accueil-reconstruction`.

> **Statut : preview technique fonctionnelle ; autorisation de publication non acquise.** Un succès de CI n'est ni une validation esthétique, ni un test Safari/VoiceOver, ni une mesure de performance d'utilisateurs réels.

## Identité et couverture

- Maquette canonique : `voyage_culinaire_au_cambodge.png`, 974 × 1615 px ; empreinte **déclarée** dans le plan D0 : `f775e6f3a483479f4a2d095406593d3d5dc354213b80d2a99839c6f23f4ddc71`. La source a été retrouvée visuellement dans la bibliothèque du projet, mais **aucun fichier binaire à cette empreinte n'est encore présent dans ce dépôt**. Il reste à l'y importer puis à recalculer et confronter SHA-256.
- Sept scènes de preview : hero Amok, marché, palette d'aromates, mortier, table commune, desserts, finale Angkor ; vrais liens vers recettes, ingrédients, glossaire, ateliers et culture.
- Les images générées par IA (hero Amok, tablée, desserts ; visuels des fiches Lok Lak / Num Banh Chok) sont **annoncées comme illustrations**, pas comme reportages ni preuves d'authenticité culinaire.
- Site public `/` inchangé, preview `/v17-accueil-preview/` en `noindex`, absente du sitemap et du menu principal ; aucun merge ni déploiement OVH.

## Sourcing des photographies de la preview

La présente liste est une vérification des **pages source et licences indiquées**, pas un avis juridique global ni une vérification exhaustive des droits de tiers éventuellement représentés.

| Média ou usage | Origine / auteur | Licence annoncée sur la page d'origine | Source et indication |
| --- | --- | --- | --- |
| `v17-market-live-1800.jpg` — marché | Radosław Botev / Fundacja Nomos | CC BY 3.0 PL | [Marché de Phnom Penh](https://commons.wikimedia.org/wiki/File:Market_in_Phnom_Penh.jpg), photographie réduite |
| `v17-fruit-market-960.jpg` — photo distincte | McKay Savage | CC BY 2.0 | [Fruits vendus sur un marché entre Phnom Penh et Siem Reap](https://commons.wikimedia.org/wiki/File:Cambodia_08_-_038_-_fruit_at_the_market_(3198828515).jpg), photo distincte et redimensionnée |
| `v17-galangal-1000.jpg` | Liza Daly | Domaine public, dédié par l'auteur | [Galangal](https://commons.wikimedia.org/wiki/File:Galangal.jpg) |
| `v17-chili-450.png` | Spicy Anonymous | CC0 1.0 | [Piment rouge](https://commons.wikimedia.org/wiki/File:Red_Chili_Pepper_PNG.png), variante réduite |
| `v17-mortar-hands-1600.jpg` | Filipp Romanovski | Pexels License | [Mains et mortier](https://www.pexels.com/photo/woman-hands-holding-mortar-21937648/), **illustration générique ; ne documente pas une préparation khmère** |
| `v17-kroeung-final.jpg` | Trilinguist | CC BY-SA 3.0 | [Pâte de kroeung rouge](https://commons.wikimedia.org/wiki/File:Red_Kroeung_Paste.jpg), prise de vue distincte |
| `v17-angkor-sunset-1600.jpg` | Radek Kucharski | CC BY 2.0 | [Angkor Wat Reflection](https://commons.wikimedia.org/wiki/File:Angkor_Wat_Reflection_(46810498612).jpg), version réduite et cadrage CSS |
| `kampot-1600.webp` | Thalias (inventaire existant) | CC BY-SA 4.0 selon crédits existants | [Kampot Pepper](https://commons.wikimedia.org/wiki/File:Kampot_Pepper.jpg) ; fichier déjà utilisé avant V17, voir `/credits-photos/` |

**Important :** conserver auteur, URL de provenance, lien de licence et mention des transformations pour toute photographie CC BY / CC BY-SA. Les trois illustrations de cuisine générées par IA sont distinctement signalées dans les `alt`, légendes ou indications de scène. Les végétaux et ornements SVG spécifiques à V17 sont présentés comme des illustrations, pas des photos.

## Gates exécutés et preuves

- Vérifications Astro/TypeScript, contrats hérités, navigation des recettes et pages, build : GitHub Actions de la PR #47.
- Navigateur Chromium : largeur 320, 360, 390, 430, 640, 768, 1024, 1440 et 1920 px ; no-JS et reduced motion sur mobile, navigation clavier, menu et liens, absence de débordement, chargement des images, cibles tactiles et contrastes des CTA à fond uni.
- Le run Chromium produit des captures intégrales, des scènes isolées (hero, marché, palette, mortier, tablée et desserts), et des vidéos scroll en desktop/mobile.
- La télémétrie JSON Chromium distingue désormais les mesures **au chargement initial** des observations après défilement automatisé. Ces mesures n'établissent **aucun score Lighthouse terrain** ni compatibilité Safari.
- Un échec de CI, même purement visuel ou de test, doit être corrigé **avant** la réception.

## Vérifications qui restent humainement nécessaires

1. **Maquette** : déposer `docs/references/v17-accueil-maquette-validee.png` avec les octets exacts du fichier approuvé, contrôler le SHA-256 déclaré, puis recevoir la composition avec le commanditaire à partir des captures réelles. Ne pas inventer une image « identique » ni valider une reconstruction approximative.
2. **Navigateurs et accessibilité** : test manuel Safari sur iPhone/macOS et VoiceOver ou NVDA, zoom 200 % réel, contrastes photo/texte au-delà des CTA pleins. Un test Chromium de largeur 640 px est seulement un proxy de reflow, pas une validation de zoom réel.
3. **Performance** : audit Lighthouse en mode mobile avec conditions publiées, puis mesure LCP, CLS, INP réels après publication. La CI actuelle n'en tient pas lieu.
4. **Droits** : dernier contrôle de la totalité des médias et, si nécessaire, des conditions Pexels et des effets d'une adaptation CC BY-SA ; relire les crédits visibles avant publication.
5. **Release D8** : après **validation explicite du rendu**, remplacer seulement le contenu d'accueil public avec mécanisme de retour arrière, relancer les régressions, fusionner selon procédure GitHub, puis déployer manuellement OVH **sur autorisation explicite**. Vérifier l'accueil public, canoniques, sitemap, crédits et 404 après déploiement.

## Règle de sécurité et retour arrière

Ne jamais déployer en production sur le simple état « CI PASS ». Archiver le commit actuellement en production avant intervention et suivre la procédure de publication OVH déjà utilisée ; ne pas supposer une connexion automatique GitHub–OVH fonctionnelle. Aucune donnée réelle, atelier ou recette existante ne doit être supprimé ou renommé silencieusement.
