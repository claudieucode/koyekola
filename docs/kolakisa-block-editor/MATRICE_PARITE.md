# Matrice de parité — éditeur d'articles Kolakisa vs Gutenberg (WordPress 7.1.3 / plugin 24.2.0)

Statuts : COMPLET (fonction présente **et** couverte par un test exécuté) · PARTIEL (présent, avec un écart précisé) · VISUEL SEULEMENT · ABSENT · BLOQUÉ · NON APPLICABLE · À VÉRIFIER.
Règle de la mission appliquée : **aucune ligne n'est COMPLET sur la seule inspection du code**. La colonne « Preuve » nomme le fichier de test ; « n/a » = aucune preuve, donc jamais COMPLET.
Sources de référence : `INVENTAIRE_BLOCS.md`, `INVENTAIRE_INTERFACE.md`, `REGLAGES_ET_TRANSFORMATIONS.md`, `API_ET_EXTENSIBILITE.md`, `PERSISTANCE_ET_COMPATIBILITE.md`. Les tests nommés « navigateur » tournent dans un vrai Chrome (Playwright).

Abréviations de tests : **P0** = `tests/editeur-blocs-p0-integrite.test.js` · **NAV** = `tests/editeur-blocs-navigateur.test.js` · **P1** = `tests/editeur-blocs-p1-navigateur.test.js` · **NB** = `tests/editeur-blocs-nouveaux-blocs.test.js` · **SUP** = `tests/editeur-blocs-supports.test.js` · **REG** = `tests/editeur-blocs-registre.test.js` · **RS** = `tests/editeur-blocs-reutilisables-sites.test.js` · **NOTES** = `tests/editeur-blocs-notes.test.js` · **LIM** = `tests/editeur-blocs-limites.test.js` · **A11Y** = `tests/editeur-blocs-a11y-perf-navigateur.test.js`.

## A. Blocs (registre officiel : 120 `block.json`, dont blocs système)

| Famille Gutenberg | Équivalent Kolakisa | Initial | **Final** | Preuve | Écart restant |
|---|---|---|---|---|---|
| core/paragraph, heading | StarterKit | PARTIEL | **PARTIEL** | SUP, NB, P1 | ancre ✔, classes ✔, lettrine ✔ (paragraphe), teinte de texte par jetons ✔, alignement ✔ ; **pas** d'interligne, de marges ni de couleur libre par bloc |
| core/list, list-item | bulletList / orderedList | PARTIEL | **PARTIEL** | NB, P1 | départ ✔, décroissant ✔, teinte ✔, imbrication ✔ ; pas de style de numérotation (a, i…) |
| core/quote, pullquote | blockquote + `pullquote` | PARTIEL | **PARTIEL** | NB, P1 | citation mise en avant ✔ (transformation), variante encadrée ✔ ; pas de champ « citation » séparé |
| core/code | codeBlock | PARTIEL | **COMPLET** | NB (CRLF normalisé), registre | — |
| core/preformatted, verse | `kbPreformatted`, `kbVerse` | ABSENT | **PARTIEL** | NB, P1 (aller-retour, Entrée) | texte brut : pas de mise en forme en ligne dans ces deux blocs |
| core/table | TableKit | PARTIEL | **PARTIEL** | NB, P1 | légende ✔, lignes alternées ✔, ligne d'en-tête ✔ ; pas de pied de tableau ni de largeur fixe |
| core/separator | horizontalRule | PARTIEL | **PARTIEL** | NB, P1 | variantes points / large / court ✔ ; pas de couleur |
| core/more | `kbMore` | ABSENT | **COMPLET** | NB (extrait automatique), P1 | — |
| core/nextpage | `kbPageBreak` | PARTIEL | **PARTIEL** | registre | sert à l'impression / PDF, ne découpe pas l'article en pages |
| core/html (HTML personnalisé) | — | ABSENT | **BLOQUÉ** | DECISIONS (DT-8) | décision produit : bloc refusé par sécurité tant qu'il n'est pas réservé aux administrateurs |
| core/freeform (Classique) | — | NON APPLICABLE | **NON APPLICABLE** | — | pas d'éditeur TinyMCE ; Markdown hérité converti |
| core/image | `kbImage` | PARTIEL | **PARTIEL** | NB, P1 | légende, alt, lien, ratio, largeur 25-100 % (33/66 ajoutés), variantes (arrondi, rond, ombre), versions WebP (`srcset`) ✔ ; pas de lightbox |
| core/gallery | `kbGallery` | PARTIEL | **PARTIEL** | P1 (aller-retour) | lien par image ✔ ; pas de recadrage par image |
| core/audio | `kbAudio` | PARTIEL | **PARTIEL** | registre | pas de lecture en boucle ni de `preload` réglable |
| core/video | `kbVideo` | PARTIEL | **PARTIEL** | NB, P1 | affiche, auto-lecture, muet, boucle, commandes, **sous-titres WebVTT** ✔ ; pas de `preload` réglable |
| core/file | `kbFile` | ABSENT | **PARTIEL** | NB (téléversement, refus des exécutables), P1 | pas d'aperçu intégré du PDF |
| core/cover | `kbCover` | ABSENT | **PARTIEL** | NB, P1 | voile 0-80 %, hauteur ; pas de point focal, de parallaxe ni de dégradé |
| core/media-text | `kbMediaText` | ABSENT | **PARTIEL** | NB, P1 | côté, largeur 33/50 ; pas d'alignement vertical |
| core/embed (33 fournisseurs) | `kbEmbed` | PARTIEL | **PARTIEL** | NB | YouTube, Vimeo, Google Maps, Spotify, SoundCloud, Dailymotion, Loom, TED (liste blanche, adresse reconstruite par le serveur) ; les autres adresses restent un lien |
| core/group (+ Row/Stack/Grid) | `kbGroup` | PARTIEL | **PARTIEL** | P1 | fond, marges, bordure, largeur, variante carte ✔ ; pas de variations Ligne / Pile / Grille |
| core/columns, column | `kbColumns` | PARTIEL | **PARTIEL** | P1 (aperçu mobile) | 2-4 colonnes, présets, empilement réglable ; largeur de colonne libre absente |
| core/buttons, button | `kbButtons`, `kbButton` | PARTIEL | **PARTIEL** | P1 | couleurs, taille, coins, largeur ; pas de dégradé ni d'ombre |
| core/spacer | `kbSpacer` | PARTIEL | **PARTIEL** | registre | 4 tailles + mobile ; pas de hauteur libre |
| core/details | `kbAccordion` | PARTIEL | **COMPLET** | NB, P1 | ouvert par défaut ✔ (toujours déplié dans l'éditeur, pour écrire dedans) |
| Blocs spécifiques Kolakisa (encadré ×8, CTA, FAQ, étapes, comparaison, formation, newsletter) | natifs | PARTIEL | **COMPLET** | REG, P1 (modèles : tous insérés et enregistrés sans perte) | sans équivalent Gutenberg |
| Blocs dynamiques (query, post-*, navigation, comments…) | — | NON APPLICABLE | **NON APPLICABLE** | — | le blog est rendu côté serveur (EJS) |
| core/block (motif synchronisé) | `kbReusable` | PARTIEL | **COMPLET** | RS, tests existants | rattaché à un site, historique restaurable, suppression sans réécriture muette |
| core/missing (bloc inconnu) | rapport + conservation du texte | ABSENT | **PARTIEL** | P0 (D11), diagnostic | le texte est conservé et signalé ; pas de « bloc brut » modifiable |

## B. Interface et commandes

| Fonction Gutenberg | Initial | **Final** | Preuve | Écart restant |
|---|---|---|---|---|
| Barre supérieure, état d'enregistrement | PARTIEL | **COMPLET** | NAV (D1, D4, D5) | — |
| Annuler / Rétablir (boutons désactivables) | PARTIEL | **COMPLET** | P1 | — |
| Outil d'insertion : catalogue, recherche, récents, favoris, médias | PARTIEL | **PARTIEL** | P1 | pas d'aperçu du bloc au survol |
| Outil d'insertion : onglet Modèles (13) | ABSENT | **COMPLET** | P1 (tous insérés + enregistrés sans perte) | — |
| Glisser un bloc depuis l'outil d'insertion | ABSENT | **COMPLET** | P1 | — |
| Insertion rapide « / » | PARTIEL | **PARTIEL** | — | plafond de résultats |
| Barre d'outils du bloc, déplacer, options | PARTIEL | **COMPLET** | P1 | — |
| Transformer un bloc en un autre | PARTIEL | **COMPLET** | P1 (paragraphe → encadré → groupe, annulable) | conversions courantes ; la table complète de Gutenberg n'est pas reprise (blocs sans équivalent) |
| Dupliquer, supprimer, insérer avant/après, monter/descendre | PARTIEL | **COMPLET** | P1 | — |
| Copier / couper / coller des blocs | PARTIEL | **PARTIEL** | — | presse-papiers interne et HTML |
| Grouper / Dégrouper (Ctrl+G) | ABSENT | **COMPLET** | P1 | — |
| Copier / coller les styles | ABSENT | **COMPLET** | P1 | — |
| Verrouillage | PARTIEL | **PARTIEL** | P1 (bloc imbriqué protégé) | un seul verrou (pas de verrous « déplacement » et « suppression » séparés) |
| Renommer un bloc | ABSENT | **COMPLET** | P1 | — |
| Masquer un bloc / masquer par appareil | PARTIEL | **COMPLET** | P1, NB | — |
| Vue en liste | PARTIEL | **PARTIEL** | P1 (Maj+clic, glisser-déposer, clavier) | pas de « replier tous les autres » |
| Plan du document | PARTIEL | **PARTIEL** | A11Y (écran balayé) | pas de test fonctionnel dédié |
| Sélection multiple de blocs | ABSENT | **PARTIEL** | P1 (Maj+flèches, Maj+clic liste, barre d'actions) | pas de sélection au lasso à la souris |
| Glisser-déposer de blocs | PARTIEL | **COMPLET** | P1 | — |
| Palette de commandes | PARTIEL | **COMPLET** | P1 (« Grouper » exécuté par la palette) | — |
| Raccourcis clavier + fenêtre d'aide | PARTIEL | **PARTIEL** | P1 | absents : zoom arrière (Ctrl+Maj+0), `[[` lien interne, espace insécable, backtick → code |
| Modes : code, concentration, barre fixe | PARTIEL | **COMPLET** | P1 | — |
| Mode sans distraction (Ctrl+Maj+\\) et plein écran navigateur | ABSENT | **COMPLET** | P1 | — |
| Aperçu par appareil (largeur de la zone d'écriture) | PARTIEL | **COMPLET** | P1 | + fenêtre d'aperçu exact du site |
| Notes (commentaires de travail par bloc ou article) | ABSENT | **PARTIEL** | NOTES, P1 | fils, réponses, résolution, suppression, pastille, isolation par site ; pas de mention `@personne` |
| Recherche / remplacement | COMPLET (propre à Kolakisa) | **À VÉRIFIER** | — | pas de test navigateur dédié |
| Mode Document, IA, espace SEO, corbeille de blocs | SANS ÉQUIVALENT | **SANS ÉQUIVALENT** | tests existants | non-régression : suite éditeur verte |

## C. Réglages de bloc (block supports)

| Support Gutenberg | Initial | **Final** | Preuve | Remarque |
|---|---|---|---|---|
| anchor (ancre HTML) | ABSENT | **COMPLET** | SUP, P1 | `id` validé, unique, jamais en collision avec les ancres des titres |
| customClassName | ABSENT | **COMPLET (variante sûre)** | SUP, P1 | classes préfixées `kb-x-` uniquement, 5 au maximum : divergence voulue de Gutenberg (pas de classe libre) |
| color (texte, fond, lien, dégradé) | PARTIEL | **PARTIEL** | NB | teinte du texte par jetons du site ; fond du groupe ; couleurs libres seulement sur le bouton |
| typography | PARTIEL | **PARTIEL** | — | lettrine, 4 tailles par sélection ; pas d'interligne ni de graisse par bloc |
| spacing (marge, padding, gap) | PARTIEL | **PARTIEL** | — | groupe, colonnes, espaceur |
| dimensions / position | ABSENT | **ABSENT** | — | non repris : incompatible avec le rendu responsive du site |
| border / shadow | PARTIEL | **PARTIEL** | NB | bouton, groupe (bordure, carte), image (ombre) |
| align | PARTIEL | **PARTIEL** | — | image, groupe |
| visibilité par appareil | ABSENT | **COMPLET** | NB, P1 | mobile, tablette, ordinateur |
| styles de bloc / variations | ABSENT | **PARTIEL** | NB, P1 | variantes à liste fermée par bloc ; pas d'API `registerBlockStyle` tierce |
| `theme.json` | NON APPLICABLE | **NON APPLICABLE** | — | jetons du site (`mk_sites.tokens`) |

## D. Document, publication, persistance

| Fonction | Initial | **Final** | Preuve |
|---|---|---|---|
| Brouillon / publication / planification | PARTIEL | **COMPLET** | P0 (D12 : promotion unique, révision « Publication ») |
| Autosave | PARTIEL | **COMPLET** | P0 (D2 : refus 413 au lieu de la troncature) |
| Modifications non enregistrées | PARTIEL | **COMPLET** | NAV (D1 dans Chrome) |
| Conflits de modification | PARTIEL | **COMPLET** | P0 (D3 : empreinte précise, autosave et restauration protégées) |
| Création de brouillon dans le bon site | À CORRIGER | **COMPLET** | P0, NAV (D4) |
| Doublon d'article autosave/enregistrement | À CORRIGER | **COMPLET** | NAV (D5 : échoue sans le correctif) |
| Révisions + restauration | PARTIEL | **COMPLET** | P0 (D10 : contenu restauré re-sanitisé) |
| Isolation multi-sites : blocs réutilisables | PARTIEL | **COMPLET** | RS (D7) |
| Isolation multi-sites : médiathèque du blog, rôle « formateur » | PARTIEL | **PARTIEL** | — | accessibles au seul compte créateur (D8, D9) : réévalué en risque faible, décision produit n° 4 en attente |
| Blocs inconnus / pertes silencieuses | PARTIEL | **PARTIEL** | P0 (D11 : rapport affiché), diagnostic | le contenu retiré est signalé, pas conservé |
| Image mise en avant, extrait, catégories, étiquettes, auteur, permalien | COMPLET | **COMPLET** | tests existants | — |
| Garde-fous (D13) : débit des brouillons, dimensions d'image réelles, sitemap | À CORRIGER | **COMPLET** | LIM |
| Modèles de page/article, boîtes méta | ABSENT | **ABSENT** | — | limite documentée ARTICLES-02 |

## E. API / extensibilité

| Fonction | Initial | **Final** | Preuve | Remarque |
|---|---|---|---|---|
| Registre central de blocs | ABSENT | **COMPLET** | REG | une description par bloc ; le test échoue si un bloc n'a qu'une moitié (nœud ou règle de sanitisation) ; verrouillage dérivé du registre |
| API d'extension tierce (plugins) | ABSENT | **NON APPLICABLE** | ARCHITECTURE_CIBLE | Kolakisa n'a pas de système de plugins : le registre interne en tient lieu |
| Dépréciations / migrations versionnées | ABSENT | **PARTIEL** | REG (version de schéma) | version de schéma suivie ; **aucune migration de contenu n'a été nécessaire** (les anciens blocs restent lisibles) : le mécanisme n'est pas simulé |
| Diagnostic | ABSENT | **COMPLET** | REG | version, usage réel par bloc, classes inconnues dans les articles |
| Filtres/hooks, SlotFill | NON APPLICABLE | **NON APPLICABLE** | — | |

## F. Accessibilité, i18n, performance

| Fonction | **Final** | Preuve | Remarque |
|---|---|---|---|
| Noms accessibles, libellés de champs, identifiants uniques, onglets ARIA | **COMPLET** (règles vérifiées) | A11Y : 0 défaut sur 19 écrans de l'éditeur | audit automatisé de règles précises, pas un audit WCAG complet |
| Clavier (vue en liste, menu, raccourcis) | **PARTIEL** | A11Y, P1 | lecteur d'écran non testé |
| Performance : 800 blocs | **COMPLET** | A11Y : chargement ≈ 0,2 s, frappe médiane ≈ 11 ms | mesuré dans Chrome headless |
| i18n | **PARTIEL** | — | interface entièrement en français (pas de couche de traduction) |
