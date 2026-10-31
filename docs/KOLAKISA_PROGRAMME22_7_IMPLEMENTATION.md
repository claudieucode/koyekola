# Programme 22.7 — Intelligence visuelle des images : mise en œuvre

Date : 2026-10-30 · Branche `feat/programme-22-7-image-intelligence` (depuis `origin/main` 35603ee2).

## 1. État initial (audit du code, avant développement)
Rien n'a été supposé d'après les anciens prompts : chaque ligne ci-dessous a été lue dans le code.

| Domaine | État réel | Fichier |
|---|---|---|
| Médiathèque | Complète : une médiathèque PAR site (`site-<id>`), corbeille, suppression définitive refusée tant qu'un contenu utilise le fichier, doublons par SHA-256, dossiers, filtres, fichiers volumineux (≥ 5 Mo) | `src/marketing/media/index.js`, `folders.js` |
| Envoi | Type lu dans le contenu (signature), JPEG/PNG/GIF/WebP/AVIF, vidéos MP4/WebM, audio, PDF/Office ; **SVG, HEIC, HTML, scripts refusés** ; 5 Mo par image ; nom aléatoire | `media/index.js` (`sniff`, `refuse`) |
| Variantes | WebP à la demande, 8 largeurs en liste blanche, jamais d'agrandissement, original conservé, protection « bombe de décompression » ; **pas d'AVIF généré** | `media/variants.js` |
| Rendu public | `srcset` / `sizes` et `loading="lazy"` émis par le moteur de pages | `views/marketing-public/_node.ejs` |
| Cadrage | `objectFit`, `objectPosition` (9 positions), `aspectRatio` (dont 16/9, 21/9) dans le moteur de pages ; point focal x/y enregistré dans les métadonnées | `pages/nodes.js`, `aiMedia/index.js` (`describe`) |
| ALT / métadonnées | ALT, légende, description, étiquettes, catégorie, licence, auteur ; « libre de droits » refusé sans source | `aiMedia/index.js` |
| Génération IA | Planificateur de consignes, fournisseurs `demo` (local) et `openai` (**jamais appelé en réel, non vérifié**), Google/Stability/BFL non intégrés ; dépense soumise à 3 autorisations | `src/aiMedia/*` |
| Analyse visuelle | **Aucune** (ni pixels, ni modèle de vision) | — |
| Sources externes | **Aucune** | — |
| 22.1 à 22.6 | 22.1 (audit), 22.3 (mises en page), 22.6 (contenu/SEO) présents sur `main` ; 22.2, 22.4, 22.5 absents. Constats 22.1 M1 (aucune image dans les sites générés), M3 (ALT « (image générée) »), M4 (pas de 16:9) toujours vrais | `docs/KOLAKISA_AI_MEDIA_QUALITY_AUDIT.md` |

## 2. Ce qui a été développé (module `src/imageIntel/`, aucune migration)
| Fichier | Rôle | Nature |
|---|---|---|
| `analyzer.js` | Analyse RÉELLE des pixels (sharp) : format, dimensions, poids, orientation, ratio, luminosité, contraste, saturation, teintes dominantes, netteté, point d'intérêt, côté calme, drapeaux de qualité | mesure |
| `brief.js` | Fiche de besoin visuel : secteur (11), rôle (9), facette (intérieur/extérieur…), côté du sujet et du texte, ratio, classe d'ALT, consigne ; propositions réellement différentes (4 angles) ; refus des portraits de témoignage | règles |
| `relevance.js` | Classement de candidats selon les métadonnées (+ pixels) ; non évaluable si aucune description | règles |
| `brand.js` | Correspondance teinte/ambiance ; cohérence d'un ensemble ; variété volontaire (portfolio) = information, pas avertissement | mesure + règles |
| `crop.js` | Recadrage non destructif : cover / contain / fill / none / custom, point focal (analysé ou manuel), région, positions natives, cadrage par appareil | calcul |
| `alt.js` | Classes informative / décorative / fonctionnelle / complexe ; proposition sans invention ; contrôle (longueur, préfixe, nom de fichier, bourrage, doublon) | règles |
| `licenses.js` | Catalogue de 11 sources (2 intégrées, 1 non vérifiée, 8 externes non intégrées) ; contrôle de licence ; import automatique refusé | documentation + règles |
| `optimize.js` | Conseils d'optimisation, dérivation WebP/JPEG/AVIF/PNG sans toucher l'original (refus : animation, transparence → JPEG), contrôle de SVG | calcul |
| `index.js` | Façade : `inspect`, `siteDiagnostic`, `recommend` ; cache mémoire ; isolation par site via `aiMedia.visibleMedia` | liaison |

Modifications de fichiers existants (3) : `aiMedia/index.js` (export de `visibleMedia`), `aiMedia/planner.js` (la consigne du bandeau précise le côté du sujet et du texte), `marketing/web/aiMedia.js` (4 routes de lecture : `diagnostic.json`, `medias/:id/analyse.json`, `recommandations.json`, `sources.json`).

## 3. Réutilisé, non dupliqué
Médiathèque (`saveUpload`, `mediaUsage`, `forSite`), variantes responsives, métadonnées et provenance de `aiMedia`, fournisseurs existants, contrôle d'accès (`forms.read`), AI Core.

## 4. Ce qui n'est PAS fait (voir `REMAINING_ISSUES`)
Aucune source externe connectée ; aucune interface graphique pour les nouvelles routes ; pas d'éditeur d'image (rotation, luminosité…) ; pas d'AVIF ; la génération de pages ne déclenche toujours pas la génération d'images ; aucun modèle de vision.
