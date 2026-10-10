# KOLAKISA — Audit des propriétés de l'éditeur (LOT 0 + LOT 1)

Date : 2026-10-10 · Dépôt : `main` (commit `b30f35f` + audit). **Aucun code de l'éditeur n'a été modifié pour cet audit** ; seuls des scripts de mesure (hors dépôt) et ce document.

## 1. Ce qui a réellement été exécuté (preuves)
| # | Vérification | Méthode | Résultat |
|---|---|---|---|
| 1 | Validation, enregistrement, relecture et **publication** des **88 propriétés de style** (`STYLE_PROPS`) | Script Node + vrai serveur : un conteneur reçoit les 88 valeurs sur 4 contextes (ordinateur, tablette, mobile, survol) ; `PUT` du brouillon, relecture en base, publication, lecture de la page `/p/<slug>` | 88 / 88 acceptées ; **0 perdue** à l'enregistrement ; **0 absente** de la page publiée ; règles `@media` tablette et mobile et `:hover` présentes |
| 2 | Chaîne canevas ↔ publication | Lecture du code : `pageNodes.pageCss` n'a qu'un seul point d'appel (`src/marketing/landing/index.js:324`) | Le canevas et la page publiée utilisent **le même générateur de CSS** (conclusion tirée du code ; non comparée pixel à pixel) |
| 3 | Panneaux réels de **78 des 86 widgets** | Chrome réel : un exemplaire de chaque widget inséré, sélectionné, onglets Contenu / Style / Avancé ouverts, contrôles comptés (accordéons ouverts) | voir §4 |
| 4 | Capacités déclarées par type | Lecture de `INSPECTORS` (71 entrées explicites) et du registre serveur (`editorSpec`, `PARTS`) | voir §4 |
| 5 | Unités acceptées par le serveur ou proposées par l'interface | Script (`STYLE_PROPS[k].check`) + lecture de `UNITS` | voir §5 |
| 6 | États (survol / focus / actif) pour un titre | Script (`normalizeNode` + `pageCss`) | acceptés et publiés pour **tout** widget (`:hover{color:…}` généré) |

**Non exécuté** : insertion à vide de 8 widgets qui exigent un contenu existant (`video`, `audio`, `embed`, `course`, `addtocart`, `courserating`, `signupform`, `menuanchor`) → leur panneau n'a pas été compté (colonnes « — »). Annuler / rétablir et rechargement n'ont **pas** été rejoués pour les 88 propriétés : ils reposent sur `change()` générique (instantané JSON), couvert par les tests existants (329 fichiers de tests, dont `editeur-conformite-widgets`, `page-builder-modele`, `controles-numeriques-navigateur`, `editeur-styles-globaux-navigateur`).

## 2. Cartographie (A)
86 types de widgets (serveur `NODE_TYPES`) : structure 8, texte 11, média 10, interaction 15, marketing 27, contenu dynamique 10, formations 3, avancé 2. 47 types exposent des **parties** stylables (`parts.js`) ; tous déclarent la capacité `responsive`.
Modèle : `node = { id, type, props, styles: { desktop, tablet, mobile }, states: { hover, focus, active }, parts, classes, css, attrs, motion, … }`.
88 propriétés de style (groupes : mise en page 24, dimensions 9, espacements 8, typographie 13, couleur 2, bordure 12, effets 6, position 7, média 3, fond 4) **plus** des propriétés composées : dégradé, image de fond, voile, filtre (flou, luminosité, contraste, niveaux de gris, saturation, sépia, teinte), ombre personnalisée (avec « interne »), masque, transformation.

## 3. Mécanismes déjà fonctionnels à préserver (B / C)
| Domaine | État | Remarque |
|---|---|---|
| Modèle de propriétés partagé (`STYLE_PROPS`, `check` / `out`) | **B** | un seul registre, validation et sortie CSS côté serveur |
| Écriture unique (`setStyles` → `change` → `styleSet(écran, état)`) | **B** | l'inspecteur et les poignées du canevas passent par là |
| Responsive : 3 écrans, héritage ordinateur → tablette → mobile | **B** | vérifié sur 88 propriétés (publication) |
| Valeurs du site (`token:…`) : couleurs, espacements, rayons, tailles de texte | **B** | références conservées |
| Styles globaux (classes), copier / coller le style (fusion), couleurs globales | **B** | |
| Polices : gestionnaire unique, 1 775 familles, chargement à la demande | **B** | |
| Contrôles numériques unifiés (saisie, ▲▼, glisser, curseur, unités) | **B** | |
| Moteur d'accordéons, historique par transactions, sauvegarde différée 1 s | **B** | |
| Manipulation directe (écart, marge intérieure, survol, main, zoom 400 %) | **B** (nouveau) | |

## 4. Matrice par widget (LOT 1) — mesurée dans l'interface
Colonnes : nombre de contrôles dans l'onglet Contenu (ou Général) / Style / Avancé (ou Interactions), accordéons ouverts ; groupes de l'onglet Style (Mise = mise en page, Dim = dimensions, Esp = espacements, Typo, Coul, Fond, Bord, Eff = effets, Pos = position, CSS) ; états de survol disponibles **dans l'interface** ; nombre de parties stylables ; gap.

| Widget | Catégorie | Contenu | Style | Avancé | Groupes Style | États UI | Parties | Gap | Mesuré en UI | Remarques automatiques |
|---|---|---|---|---|---|---|---|---|---|---|
| container | Structure | 12 | 67 | 35 | Fond Bord CSS Coul Eff Mise Pos Dim Esp | oui | 0 | oui | oui |  |
| columns | Structure | 10 | 67 | 35 | Fond Bord CSS Coul Eff Mise Pos Dim Esp | oui | 0 | oui | oui |  |
| column | Structure | 8 | 71 | 35 | Fond Bord CSS Coul Eff Mise Pos Dim Esp | oui | 0 | oui | oui |  |
| grid | Structure | 11 | 72 | 35 | Fond Bord CSS Coul Eff Mise Pos Dim Esp | oui | 0 | oui | oui |  |
| stack | Structure | 10 | 67 | 35 | Fond Bord CSS Coul Eff Mise Pos Dim Esp | oui | 0 | oui | oui |  |
| group | Structure | 10 | 67 | 35 | Fond Bord CSS Coul Eff Mise Pos Dim Esp | oui | 0 | oui | oui |  |
| spacer | Structure | 1 | 18 | 27 | Dim Esp | non | 0 | — | oui |  |
| divider | Structure | 4 | 30 | 55 | Bord Dim Esp Typo | non | 0 | — | oui |  |
| heading | Texte | 4 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 0 | — | oui |  |
| text | Texte | 0 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 0 | — | oui | contenu édité dans la page seulement |
| list | Texte | 2 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 0 | — | oui |  |
| quote | Texte | 2 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 0 | — | oui |  |
| code | Texte | 2 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 0 | — | oui |  |
| image | Média | 5 | 50 | 56 | Bord Eff Mise Média Dim Esp | oui | 0 | — | oui |  |
| gallery | Média | 8 | 44 | 56 | Bord Eff Mise Dim Esp | non | 3 | oui | oui |  |
| video | Média | — | — | — | Mise Dim Esp Bord Eff | non | 0 | — | non (prérequis) |  |
| audio | Média | — | — | — | Mise Dim Esp Bord Eff | non | 0 | — | non (prérequis) |  |
| button | Interaction | 7 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | oui | 0 | — | oui |  |
| link | Interaction | 3 | 27 | 55 | Mise Esp Typo | oui | 0 | — | oui | sans dimensions |
| accordion | Interaction | 6 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 3 | — | oui |  |
| tabs | Interaction | 7 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 3 | — | oui |  |
| badge | Texte | 2 | 24 | 55 | Bord Mise Esp Typo | non | 0 | — | oui | sans dimensions |
| timeline | Texte | 6 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 4 | — | oui |  |
| progress | Marketing | 4 | 25 | 55 | Mise Dim Esp Typo | non | 3 | — | oui |  |
| menu | Interaction | 7 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | oui | 3 | — | oui |  |
| carousel | Média | 8 | 41 | 55 | Bord Eff Mise Dim Esp | non | 4 | — | oui |  |
| toggle | Interaction | 3 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 2 | — | oui |  |
| alert | Texte | 4 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 3 | — | oui |  |
| counter | Marketing | 6 | 47 | 55 | Eff Mise Dim Esp Typo | non | 2 | — | oui |  |
| testimonial | Marketing | 4 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | oui | 5 | — | oui |  |
| pricing | Marketing | 9 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | oui | 6 | — | oui |  |
| breadcrumb | Interaction | 5 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 0 | — | oui |  |
| social | Interaction | 5 | 28 | 55 | Coul Eff Mise Esp | non | 1 | — | oui | sans dimensions |
| sharebuttons | Interaction | 9 | 28 | 55 | Coul Eff Mise Esp | non | 1 | — | oui | sans dimensions |
| modal | Interaction | 8 | 16 | 27 | Mise Esp | non | 6 | — | oui | sans dimensions |
| html | Avancé | 1 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 0 | — | oui |  |
| embed | Avancé | — | — | — | Mise Dim Esp Bord Eff | non | 0 | — | non (prérequis) |  |
| iconlist | Texte | 6 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 3 | — | oui |  |
| tooltip | Interaction | 3 | 27 | 55 | Mise Esp Typo | non | 2 | — | oui | sans dimensions |
| hotspot | Média | 5 | 41 | 56 | Bord Eff Mise Dim Esp | non | 2 | — | oui |  |
| posts | Contenu dynamique | 7 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 6 | — | oui |  |
| courselist | Contenu dynamique | 6 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 7 | — | oui |  |
| search | Contenu dynamique | 3 | 22 | 55 | Mise Dim Esp | non | 0 | — | oui |  |
| account | Contenu dynamique | 4 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | oui | 3 | — | oui |  |
| dyntext | Contenu dynamique | 5 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 0 | — | oui |  |
| table | Texte | 9 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 0 | — | oui |  |
| countdown | Marketing | 2 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 1 | — | oui |  |
| course | Formations | — | — | — | Mise Dim Fond Esp Bord Eff | oui | 0 | — | non (prérequis) |  |
| sitelogo | Contenu dynamique | 2 | 28 | 55 | Eff Mise Esp | non | 2 | — | oui | sans dimensions |
| postcontent | Contenu dynamique | 0 | 41 | 55 | Bord Eff Mise Dim Esp | non | 0 | — | oui | contenu édité dans la page seulement |
| catfilter | Contenu dynamique | 3 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 0 | — | oui |  |
| sitetitle | Contenu dynamique | 2 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 0 | — | oui |  |
| copyright | Contenu dynamique | 2 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 0 | — | oui |  |
| addtocart | Formations | — | — | — | Mise Esp Eff | non | 0 | — | non (prérequis) |  |
| courserating | Formations | — | — | — | Mise Typo Coul Dim Esp Fond Bord Eff | non | 0 | — | non (prérequis) |  |
| animatedheading | Texte | 6 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 0 | — | oui |  |
| flipbox | Interaction | 9 | 49 | 55 | Bord Eff Mise Dim Esp Typo | non | 4 | — | oui |  |
| pricelist | Marketing | 4 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 4 | — | oui |  |
| toc | Interaction | 3 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 3 | — | oui |  |
| readingprogress | Interaction | 2 | 0 | 55 | Coul | non | 2 | — | oui | sans dimensions, sans espacement |
| signupform | Marketing | — | — | — | Mise Typo Coul Dim Esp Fond Bord Eff | non | 3 | — | non (prérequis) |  |
| map | Média | 4 | 38 | 55 | Bord Eff Dim Esp | non | 0 | — | oui |  |
| imagebox | Média | 7 | 52 | 56 | Fond Bord Eff Mise Dim Esp Typo | non | 3 | — | oui |  |
| iconbox | Média | 8 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 3 | — | oui |  |
| rating | Marketing | 4 | 19 | 55 | Mise Esp Typo | non | 5 | — | oui | sans dimensions |
| menuanchor | Interaction | — | — | — | défaut | non | 0 | — | non (prérequis) |  |
| icon | Média | 4 | 20 | 55 | Coul Mise Dim Esp | oui | 0 | — | oui |  |
| slides | Marketing | 17 | 53 | 55 | Fond Bord Coul Eff Mise Dim Esp | non | 8 | — | oui |  |
| testimonialcarousel | Marketing | 13 | 53 | 55 | Fond Bord Coul Eff Mise Dim Esp | non | 8 | — | oui |  |
| mediacarousel | Marketing | 9 | 53 | 55 | Fond Bord Coul Eff Mise Dim Esp | non | 4 | — | oui |  |
| cart | Marketing | 6 | 53 | 55 | Fond Bord Coul Eff Mise Dim Esp | non | 9 | — | oui |  |
| facebookbutton | Marketing | 6 | 53 | 55 | Fond Bord Coul Eff Mise Dim Esp | non | 0 | — | oui |  |
| linkinbio | Marketing | 11 | 53 | 55 | Fond Bord Coul Eff Mise Dim Esp | non | 5 | — | oui |  |
| lottie | Marketing | 7 | 53 | 55 | Fond Bord Coul Eff Mise Dim Esp | non | 0 | — | oui |  |
| profilecard | Marketing | 6 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 4 | — | oui |  |
| readmore | Marketing | 5 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 3 | — | oui |  |
| querylist | Marketing | 14 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 8 | — | oui |  |
| postmeta | Marketing | 9 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 1 | — | oui |  |
| postterms | Marketing | 3 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 2 | — | oui |  |
| postnav | Marketing | 4 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 4 | — | oui |  |
| authorbox | Marketing | 5 | 53 | 55 | Fond Bord Coul Eff Mise Dim Esp | non | 5 | — | oui |  |
| archiveinfo | Marketing | 4 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 3 | — | oui |  |
| postcomments | Marketing | 1 | 53 | 55 | Fond Bord Coul Eff Mise Dim Esp | non | 5 | — | oui |  |
| cmsmenu | Marketing | 4 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 2 | — | oui |  |
| minicart | Marketing | 3 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 3 | — | oui |  |
| textpath | Marketing | 6 | 52 | 55 | Fond Bord Eff Mise Dim Esp Typo | non | 0 | — | oui |  |

Moyenne mesurée (78 widgets) : **5,6** contrôles de contenu, **47,2** dans Style, **52,8** dans Avancé (tous accordéons ouverts) — voir risque d'encombrement au §7.

## 5. Unités
Le serveur (`len`) accepte **px, %, rem, em, vw, vh** pour **toutes** les propriétés de longueur (largeur, hauteur, minimum, maximum, écart, marges, rayon, bordure, décalages…). L'interface en propose moins, par choix :
- `width` : px % rem vw + mots-clés (pas `em`, `vh`) ; `height` : px % rem vh + mots-clés (pas `em`, `vw`) ; `minHeight` / `maxHeight` : sans `em` ; `gap`, `rowGap`, `columnGap` : px rem em % (pas `vw`, `vh`) ; `padding*` : px % rem em ; `margin*` : px % rem em auto ; `borderWidth` : px seulement ; `borderRadius` : px % rem.
- **Défaut de validation (D, mineur)** : le serveur accepte `%` pour une épaisseur de bordure (`border-width:10%` est un CSS invalide, ignoré par le navigateur). Seul un document écrit à la main ou via l'API peut le produire (l'interface ne l'offre pas).

## 6. Lacunes confirmées (D / C / E)
| # | Lacune | Preuve | Classe |
|---|---|---|---|
| L1 | **États survol / focus / clic : disponibles dans l'interface pour 15 types seulement** (conteneurs, colonnes, grille, menu, compte, témoignage, offre, image, bouton, lien, icône, formation), alors que le serveur les accepte et les publie pour **tous** les widgets | `INSPECTORS[type].states` = 15 ; `normalizeNode` + `pageCss` pour un titre → `:hover{color:#00ff00}` | **C** (le moteur sait, l'interface ne l'offre pas) |
| L2 | Widget **Texte** : 0 contrôle de contenu dans l'inspecteur (le texte se modifie dans la page) | comptage UI | **F** à étudier (peut être voulu) |
| L3 | **Typographie absente de 29 widgets** de l'interface, dont les conteneurs : impossible de poser une taille / police héritée par les enfants depuis un conteneur | liste §4 (colonne Style, sans « Typo ») ; le serveur accepte ces propriétés sur tout nœud | **C** |
| L4 | **Dimensions absentes** de 9 petits widgets (lien, badge, réseaux, partage, fenêtre modale, infobulle, logo du site, progression de lecture, évaluation) ; **espacements absents** de la progression de lecture | comptage UI | **F** (la fenêtre modale en particulier : largeur du panneau) |
| L5 | **Propriétés CSS sans équivalent** dans le registre : `white-space`, `overflow-wrap` / `word-break`, `text-overflow`, `visibility`, `cursor`, `pointer-events`, `outline`, `mix-blend-mode`, `overflow-x` / `overflow-y` séparés, `grid-auto-rows` / `grid-auto-columns`, couleur et style de bordure par côté, `inset` | absence dans les clés de `STYLE_PROPS` (88) et des formes composées | **A** (absentes) — certaines sont atteignables par la capacité « CSS personnalisé » |
| L6 | **Écrans : 3 fixes** (ordinateur, tablette, mobile). Les seuils (px) se règlent par site mais on ne peut pas ajouter d'écran (portable, grand écran) | `BREAKPOINTS` (3 entrées) ; commentaire du code : « la liste peut s'allonger » | **C** |
| L7 | Unités du serveur plus riches que celles de l'interface (§5) | script | **C** |
| L8 | Validation permissive (`%` sur une épaisseur de bordure) | script | **D** (mineur) |
| L9 | **Panneaux denses** : en moyenne 47 contrôles dans Style et 53 dans Avancé (accordéons ouverts) | comptage UI | **E** |
| L10 | Zoom limité à 200 % (corrigé : 400 %) | code | résolu |
| L11 | 8 widgets non insérables à vide (prérequis) : audit UI incomplet | §1 | limite de l'audit |

## 7. Performance (E)
Mesures disponibles (voir `docs/perf-page-builder.md` et `KOLAKISA_CANVAS_INTERACTION_PERFORMANCE.md`) : sélection (inspecteur compris) 29-43 ms de 20 à 400 éléments ; frappe → canevas 80-576 ms (goulot : rendu serveur) ; gestes (curseur, glisser, redimensionner, poignées) : image médiane 16,7 ms, 0 à 1 image > 50 ms ; défilement 61 images/s. **Non mesuré aujourd'hui** : temps d'affichage de l'onglet Style d'un conteneur (79 contrôles) — à mesurer au LOT 8 avant toute action.

## 8. Risques de régression (F)
- Toute nouvelle propriété touche `STYLE_PROPS` (serveur) **et** `UNITS` / `INSPECTORS` (client) : les deux doivent évoluer ensemble, sinon contrôle sans effet ou effet sans contrôle (la conformité des widgets est testée, pas celle de chaque propriété).
- Ouvrir les états à tous les widgets multiplie le CSS publié et le nombre de contrôles (encombrement, L9).
- Ajouter des propriétés à `STYLE_PROPS` change la validation de pages existantes (rien ne doit devenir invalide).
- Le panneau Avancé est déjà long : tout ajout doit passer par un regroupement, pas par plus de lignes.

## 9. Cinq améliorations prioritaires
1. **Offrir les états (survol, focus, clic) à tous les widgets qui ont du sens** (texte, titre, image, bouton déjà fait…) : le moteur est prêt, il manque l'interface (L1). Impact élevé, risque faible.
2. **Typographie héritée sur les conteneurs et sections** (taille, police, couleur du texte) (L3).
3. **Compléter le registre CSS par lots sûrs** : `white-space`, `overflow-wrap`, `text-overflow`, `visibility`, `cursor`, `outline`, `mix-blend-mode`, `overflow-x/y`, `grid-auto-*` — avec validation, sortie CSS, contrôle, test de publication (L5).
4. **Aligner les unités de l'interface sur celles du rendu** là où c'est utile (largeur / hauteur en `em`, `vh`, `vw` selon la propriété) et durcir la validation des unités invalides (L7, L8).
5. **Écrans configurables** (ajouter « portable » / « grand écran ») et **réduire l'encombrement du panneau Avancé** (L6, L9).

## 10. Plan par lots (H) et tests (I)
| Lot | Contenu | Tests à écrire / exécuter |
|---|---|---|
| 2 | Architecture : définir pour chaque propriété **une seule déclaration** (serveur) dont l'interface déduit le contrôle, l'unité et les widgets concernés ; compatibilité : aucune migration, propriétés ajoutées en option | test de cohérence serveur ↔ interface (toute clé de `STYLE_PROPS` a un contrôle ou une raison documentée) |
| 3 | Fondations : validation des unités, propriétés manquantes du registre | pour chaque nouvelle propriété : valeurs limites, enregistrement, rechargement, publication (modèle du script §1) |
| 4 | États pour tous les widgets pertinents | Chrome : réglage, canevas, enregistrement, rechargement, annuler / rétablir, publication (survol) |
| 5 | Conteneurs : typographie héritée, hiérarchie parent / enfant | interactions entre propriétés (gap + direction, largeur + largeur maximale) |
| 6 | Styles et états globaux (références conservées) | test des références `token:` après modification du site |
| 7 | Ergonomie du panneau Avancé | mesure du temps d'affichage avant / après, comptage de contrôles |
| 8 | Performance : mesurer d'abord l'onglet Style des conteneurs | bancs existants + nouvelle mesure |
| 9 | Validation finale + mise à jour de ce document | passe complète, publication, responsive |

## 11. Statut de validation
Aucune amélioration n'est implémentée à ce stade. Toute valeur de ce document marquée « mesuré » a été produite par les scripts décrits au §1 ; le reste est une lecture de code signalée comme telle.


## 12. Suite réalisée (2026-10-10, après validation du plan) — état des lacunes
| # | Lacune | Résultat | Preuve |
|---|---|---|---|
| L1 | États (survol) limités à 15 types | **Corrigé** : l'état « Survol » est ouvert à tous les widgets qui ont un aspect réglable (hors espace, progression de lecture, modale, infobulle, contenus intégrés, médias lus, carrousel / galerie, logo, composant, formulaire, section libre) ; réglé dans l'état (le style normal reste intact), publié (`:hover`), relu au rechargement | `tests/editeur-etats-typographie-navigateur.test.js` (titre, liste, badge ; espace = aucun état) |
| L3 | Typographie absente des conteneurs | **Corrigé** : section Typographie sur section libre, conteneur, colonnes, colonne, pile, groupe ; les enfants héritent (vérifié sur le canevas, enregistré, publié) | même test |
| L5 | 16 propriétés CSS absentes | **Ajoutées** : `white-space`, `text-wrap`, `overflow-wrap`, `text-overflow`, `visibility`, `cursor`, `pointer-events`, `mix-blend-mode`, `overflow-x`, `overflow-y`, contour (style, épaisseur, couleur, décalage), `grid-auto-rows`, `grid-auto-columns` → registre : **104 propriétés** ; contrôle dans l'inspecteur (typographie, effets, bordure, grille), canevas, enregistrement, rechargement, publication ordinateur / tablette / mobile / survol | `tests/proprietes-style-completes.test.js` (5 tests serveur) + test navigateur (retour à la ligne, curseur, fusion, contour) |
| L7 | Unités du rendu non offertes | **Partiellement corrigé** : `em` ajouté aux dimensions (largeur, hauteur, minimum, maximum) | lecture du code + tests existants |
| L8 | Validation permissive (`%` sur une épaisseur) | **Corrigé** : refusé pour les 5 épaisseurs de bordure et le contour (px, rem, em, 0 acceptés) | test serveur |
| L2 | Texte : aucun contrôle de contenu dans l'inspecteur | **Non modifié** : édition dans la page (voulu) | — |
| L4 | 9 petits widgets sans dimensions | **Non modifié** : à étudier au cas par cas (la modale en particulier) | — |
| L6 | Écrans fixes (3) | **Non fait** : demande un chantier (modèle de données, rendu, aperçu) | — |
| L9 | Panneaux denses (Avancé) | **Non fait** : aucune restructuration ; attention : ce lot ajoute quelques contrôles (typographie des conteneurs, 6 effets, contour) | — |

Limites connues : le contour de **sélection** de l'éditeur utilise aussi `outline` : le contour réglé par l'auteur est invisible dans le canevas tant que l'élément est sélectionné (il apparaît dès qu'on le désélectionne et il est publié) ; `text-overflow: ellipsis` demande « Jamais » (retour à la ligne) et « Masqué » (débordement) pour agir — indiqué dans le libellé.
