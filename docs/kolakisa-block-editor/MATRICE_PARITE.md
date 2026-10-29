# Matrice de parité — éditeur d'articles Kolakisa vs Gutenberg (WordPress 7.1.3 / plugin 24.2.0)

**Version 3 (après le chantier « parité complète »).** Statuts : COMPLET (fonction présente **et** couverte par un test exécuté) · COMPLET (variante sûre) (fonction présente et testée, avec une divergence **voulue** et expliquée) · PARTIEL (présent, avec un écart précisé) · VISUEL SEULEMENT · ABSENT · BLOQUÉ · NON APPLICABLE (sans objet pour Kolakisa, raison donnée) · À VÉRIFIER.
Règle de la mission appliquée : **aucune ligne n'est COMPLET sur la seule inspection du code**. La colonne « Preuve » nomme le fichier de test ; « n/a » = aucune preuve, donc jamais COMPLET.
Les tests nommés « navigateur » tournent dans un vrai Chrome (Playwright) ; `FF` tourne dans un vrai Firefox 153 (WebDriver BiDi).

Abréviations : **P0** `editeur-blocs-p0-integrite` · **NAV** `editeur-blocs-navigateur` · **P1** `editeur-blocs-p1-navigateur` · **NB** `editeur-blocs-nouveaux-blocs` · **SUP** `editeur-blocs-supports` · **REG** `editeur-blocs-registre` · **RS** `editeur-blocs-reutilisables-sites` · **NOTES** `editeur-blocs-notes` · **LIM** `editeur-blocs-limites` · **A11Y** `editeur-blocs-a11y-perf-navigateur` · **STY** `editeur-blocs-styles-communs` · **RB** `editeur-blocs-reglages-blocs` · **INT** `editeur-blocs-integrations` · **WID** `editeur-blocs-widgets` · **WIDN** `editeur-blocs-widgets-navigateur` · **NB2** `editeur-blocs-nouveaux-blocs-2` · **RSS** `editeur-blocs-flux-rss` · **GUT** `editeur-blocs-editeur-gutenberg` · **MEN** `editeur-blocs-mentions` · **PAG** `editeur-blocs-pages` · **FF** `editeur-blocs-firefox`.

Principe de sécurité des « variantes sûres » : aucun style libre, aucune classe libre, aucun code libre sauf le bloc HTML personnalisé (signé, réservé au compte créateur). Toute valeur est choisie dans une liste fermée ou une couleur `#rrggbb` validée, des deux côtés (éditeur et serveur).

## A. Blocs (registre officiel : 120 `block.json`, dont blocs système)

| Famille Gutenberg | Équivalent Kolakisa | Initial | **Final** | Preuve | Remarque |
|---|---|---|---|---|---|
| core/paragraph, heading | StarterKit + réglages communs | PARTIEL | **COMPLET (variante sûre)** | STY, SUP, NB, P1 | ancre, classes `kb-x-`, lettrine, teinte, alignement, **interligne, graisse, style, espacement des lettres, casse, décoration, colonnes de texte, retrait, sens d'écriture, police, taille, couleurs libres, marges** ; tailles et valeurs en listes fermées (pas de valeur numérique libre) |
| core/list, list-item | bulletList / orderedList | PARTIEL | **COMPLET** | RB, NB, P1 | départ, décroissant, imbrication, **style de numérotation et de puce** |
| core/quote, pullquote | blockquote + `pullquote` | PARTIEL | **COMPLET** | RB, NB, P1 | **champ « citation » séparé** (rendu en `<cite>`), variantes, citation mise en avant |
| core/code | codeBlock | PARTIEL | **COMPLET** | NB, REG | |
| core/preformatted, verse | `kbPreformatted`, `kbVerse` | ABSENT | **COMPLET** | NB, P1 | **mise en forme en ligne permise** (gras, italique, lien…) |
| core/table | TableKit | PARTIEL | **COMPLET** | RB, NB, P1 | légende, lignes alternées, en-tête, **pied de tableau (`<tfoot>`) et disposition fixe** |
| core/separator | horizontalRule | PARTIEL | **COMPLET** | STY, NB | variantes, **couleur** |
| core/more | `kbMore` | ABSENT | **COMPLET** | NB, P1 | extrait automatique |
| core/nextpage | `kbNextPage` (+ `kbPageBreak` pour l'impression) | PARTIEL | **COMPLET** | WID, WIDN | **vraie pagination** : `?page=N`, navigation, sommaire par page, adresse canonique par page, notes de bas de page par page |
| core/html (HTML personnalisé) | `kbHtml` | ABSENT | **COMPLET (variante sûre)** | WID, WIDN, PAG | **seul bloc à code libre** : réservé au compte créateur, **signé** (HMAC-SHA-256 sur la clé du serveur) ; un code injecté en base, modifié ou envoyé par une autre personne n'est jamais restitué ; aperçu isolé et sans script dans l'éditeur ; absent des flux et du texte brut |
| core/freeform (Classique) | — | NON APPLICABLE | **NON APPLICABLE** | — | pas d'éditeur TinyMCE ; Markdown hérité converti |
| core/image | `kbImage` | PARTIEL | **COMPLET** | RB, STY, NB, P1, GUT | légende, alt, lien (dont « lier au fichier »), ratio, largeur, variantes, ajustement, WebP (`srcset`), **lightbox accessible**, **recadrage + rotation 90°**, **filtre** (noir et blanc, sépia, duotone bleu nuit, chaud) |
| core/gallery | `kbGallery` | PARTIEL | **COMPLET** | RB, P1 | lien par image, **images à leur proportion**, **lightbox avec flèches** |
| core/audio | `kbAudio` | PARTIEL | **COMPLET** | RB | **boucle, préchargement, lecture automatique** (avec avertissement : bloquée par la plupart des navigateurs) |
| core/video | `kbVideo` | PARTIEL | **COMPLET** | RB, NB, P1 | affiche, lecture automatique (muette), boucle, commandes, sous-titres WebVTT, **préchargement** |
| core/file | `kbFile` | ABSENT | **COMPLET** | RB, NB, P1 | téléversement, formats sûrs, **aperçu PDF intégré** |
| core/cover | `kbCover` | ABSENT | **COMPLET** | RB, NB, P1 | voile, hauteur, **point focal, parallaxe, teinte, voile en dégradé, position du texte (9 cases)** |
| core/media-text | `kbMediaText` | ABSENT | **COMPLET** | RB, NB, P1 | côté, **7 largeurs, alignement vertical, image rognée, empilement réglable** |
| core/embed (≈ 33 fournisseurs) | `kbEmbed` | PARTIEL | **PARTIEL** | INT, FF | **30 services** (YouTube, Vimeo, Google Maps + 27 : Spotify, SoundCloud, Dailymotion, Loom, TED, X, Instagram, Facebook, TikTok, Pinterest, Reddit, Imgur, Giphy, CodePen, Mixcloud, Scribd, Issuu, Kickstarter, Animoto, Pocket Casts, VideoPress, Wistia, Streamable, Apple Podcasts, Apple Music, Deezer, Google Docs/Sheets/Slides/Forms), adresse **reconstruite** par le serveur, cadre isolé (`sandbox`), collage d'une adresse = lecteur. Écart : les services qui exigent une requête serveur « oEmbed » (Flickr, Tumblr, Bluesky, Speaker Deck…) restent des liens — une requête sortante à chaque affichage est un risque non pris |
| core/group (+ Row/Stack/Grid) | `kbGroup` | PARTIEL | **COMPLET** | RB, P1 | fond, marges, bordure, largeur, carte, **variations Ligne / Pile / Grille** (justification, alignement, colonnes) |
| core/columns, column | `kbColumns` | PARTIEL | **COMPLET** | RB, P1 | présets, empilement réglable, **largeurs libres (5–95 %) et alignement vertical par colonne** |
| core/buttons, button | `kbButtons`, `kbButton` | PARTIEL | **COMPLET** | STY, P1 | couleurs, taille, coins, largeur, **dégradé, ombre** |
| core/spacer | `kbSpacer` | PARTIEL | **COMPLET** | RB | 4 tailles + mobile, **hauteur libre 8–499 px** |
| core/details | `kbAccordion` | PARTIEL | **COMPLET** | NB, P1 | ouvert par défaut |
| Widgets : archives, calendar, categories, latest-posts, latest-comments, page-list, rss, search, social-links, tag-cloud, table-of-contents, breadcrumbs | `kbArchives`, `kbCalendar`, `kbCategories`, `kbLatest`, `kbComments`, `kbPageList`, `kbRss`, `kbSearch`, `kbSocial`, `kbTags`, `kbToc`, `kbBreadcrumbs` | NON APPLICABLE | **COMPLET** | WID, WIDN, RSS, NB2 | **12 blocs rendus par le serveur à l'affichage, limités au site de l'article (isolation testée)** ; flux RSS : lecture mise en cache, jamais d'attente réseau à l'affichage, protection contre les requêtes vers l'intérieur (SSRF) testée |
| core/form (+ input, submit) | `kbForm` | NON APPLICABLE | **PARTIEL** | WID | **intègre un formulaire publié dans Marketing** (champs, anti-robot, consentement, double confirmation, preuve de consentement : tout vient de Marketing) ; limité aux formulaires du site de l'article. Écart voulu : **pas de constructeur de champs dans l'article** (un second moteur de formulaires contournerait les protections de Marketing) |
| core/math | `kbMath` | ABSENT | **COMPLET** | NB2 | LaTeX (sous-ensemble courant : fractions, racines, exposants, indices, sommes, intégrales, limites, grec, matrices, `\text`) → **MathML** par un convertisseur sans dépendance, liste fermée d'éléments (testé avec des saisies piégées), annotation TeX pour les lecteurs d'écran, formule dessinée dans Chrome et Firefox |
| core/icon | `kbIcon` | ABSENT | **COMPLET (variante sûre)** | NB2 | 59 icônes du jeu d'icônes du site (liste fermée), taille, couleur, texte alternatif facultatif ; pas de bibliothèque d'icônes externe |
| core/playlist (+ track) | `kbPlaylist` | ABSENT | **COMPLET** | NB2 | fichiers audio téléversés seulement, 30 pistes, titre et artiste, réordonnables |
| core/accordion (+ item, heading, panel) | `kbAccordionGroup` | ABSENT | **COMPLET** | NB2, FF | plusieurs éléments, **un seul ouvert à la fois** (attribut `name` natif des `<details>`) ; (`kbAccordion` = un élément seul, `kbFaq` = questions avec données structurées) |
| core/tabs (+ tab-list, tab-panels, tab) | `kbTabs` | ABSENT | **COMPLET** | NB2 | vrais onglets (rôles ARIA, flèches, Début, Fin, lien d'ancre vers un onglet masqué) ; **sans JavaScript : sections titrées** (contenu indexable) |
| footnotes | `kbFootnote` (nœud en ligne) | NON APPLICABLE | **COMPLET** | WID, WIDN, FF | numérotation automatique, liste en fin d'article (ou de page) avec lien de retour, modification au clic |
| core/shortcode | — | NON APPLICABLE | **NON APPLICABLE** | — | pas de codes courts : exécuteraient du code |
| Blocs de gabarit (query, post-*, navigation, comments, avatar, login, site-*…) | gabarits de thème (Apparence) | NON APPLICABLE | **NON APPLICABLE** | — | le blog est rendu côté serveur par ses gabarits ; ces blocs construisent les gabarits, pas le contenu d'un article |
| Blocs spécifiques Kolakisa (encadré ×8, CTA, FAQ, étapes, comparaison, formation, newsletter) | natifs | PARTIEL | **COMPLET** | REG, P1 | sans équivalent Gutenberg |
| core/block (motif synchronisé) | `kbReusable` | PARTIEL | **COMPLET** | RS | rattaché à un site, historique restaurable |
| core/missing (bloc inconnu) | rapport + « Modifier en HTML » | ABSENT | **PARTIEL** | P0 (D11), GUT | le texte est conservé et **signalé** ; le contenu retiré à l'enregistrement n'est pas conservé ; un bloc se modifie en HTML (relu par le schéma) |

## B. Interface et commandes

| Fonction Gutenberg | Initial | **Final** | Preuve | Remarque |
|---|---|---|---|---|
| Barre supérieure, état d'enregistrement | PARTIEL | **COMPLET** | NAV | |
| Annuler / Rétablir | PARTIEL | **COMPLET** | P1 | |
| Outil d'insertion : catalogue, recherche, récents, favoris, médias, **aperçu au survol** | PARTIEL | **COMPLET** | P1, GUT | aperçu du bloc tel qu'il sera inséré, sans rien modifier |
| Onglet Modèles (13), glisser depuis l'outil | ABSENT | **COMPLET** | P1 | |
| Insertion rapide « / » | PARTIEL | **COMPLET** | P1 | liste défilante (40 résultats), navigation clavier |
| Barre d'outils du bloc, déplacer, options | PARTIEL | **COMPLET** | P1 | |
| Transformer un bloc en un autre | PARTIEL | **COMPLET** | P1, GUT | texte ↔ préformaté ↔ vers ↔ liste ↔ citation, liste → paragraphes, citation → paragraphes, image → couverture / galerie / média et texte, couverture → image + texte, média et texte → image / groupe, groupe → colonnes, détails → groupe, boutons séparés, lire la suite ↔ page suivante, encadrés. Conversions de Gutenberg sans objet (blocs absents) non reprises |
| Dupliquer, supprimer, insérer avant/après, déplacer | PARTIEL | **COMPLET** | P1 | |
| Copier / couper / coller des blocs | PARTIEL | **COMPLET** | GUT | un groupe copié se colle en entier, couper puis coller |
| Grouper / Dégrouper, copier / coller les styles, renommer, masquer | ABSENT | **COMPLET** | P1 | |
| Verrouillage | PARTIEL | **COMPLET** | P1, GUT | **trois verrous séparés** (contenu, déplacement, suppression), avec ou sans les blocs internes ; blocs imbriqués protégés |
| Vue en liste | PARTIEL | **COMPLET** | P1, GUT | Maj+clic, glisser-déposer, clavier, **replier / déplier, Alt+clic = replier les autres, tout replier** |
| Plan du document | PARTIEL | **COMPLET** | GUT, A11Y | |
| Sélection multiple de blocs | ABSENT | **COMPLET** | P1, GUT | Maj+flèches, Maj+clic liste, **lasso à la souris** |
| Glisser-déposer de blocs | PARTIEL | **COMPLET** | P1 | |
| Palette de commandes | PARTIEL | **COMPLET** | P1 | commandes de bloc, insertion, zoom, guide… |
| Raccourcis clavier + aide | PARTIEL | **COMPLET** | P1, GUT | **ajoutés** : `[[` (lien interne), Ctrl+Maj+Espace (insécable), Ctrl+Maj+0 (zoom arrière), `` `code` `` testé |
| Modes : code, concentration, barre fixe, sans distraction, plein écran | PARTIEL | **COMPLET** | P1 | |
| **Zoom arrière** (vue d'ensemble de la page) | ABSENT | **COMPLET** | GUT, FF | |
| **Fil d'Ariane du bloc** (Document › Groupe › Paragraphe) | ABSENT | **COMPLET** | GUT, A11Y | |
| **Modifier un bloc en HTML** | ABSENT | **COMPLET** | GUT | code relu par le schéma ; script retiré ; annulable |
| **Guide de bienvenue** | ABSENT | **COMPLET** | GUT | 4 écrans, depuis le menu ⋮ et la palette ; invitation discrète à la première visite |
| Aperçu par appareil | PARTIEL | **COMPLET** | P1 | + fenêtre d'aperçu exact du site |
| Notes (commentaires de travail) | ABSENT | **COMPLET** | NOTES, MEN, P1 | fils, réponses, résolution, suppression, pastille, isolation par site, **mentions `@nom`** (saisie assistée, jamais un compte étranger à l'article) |
| Recherche / remplacement | À VÉRIFIER | **COMPLET** | GUT | compteur, un par un / tout, bloc verrouillé épargné |
| Préférences de l'éditeur | PARTIEL | **COMPLET** | tests existants | |
| Mode Document, IA, espace SEO, corbeille de blocs | SANS ÉQUIVALENT | **SANS ÉQUIVALENT** | tests existants | non-régression : suite éditeur verte |

## C. Réglages de bloc (block supports)

| Support Gutenberg | Initial | **Final** | Preuve | Remarque |
|---|---|---|---|---|
| anchor | ABSENT | **COMPLET** | SUP, P1 | `id` validé, unique |
| customClassName | ABSENT | **COMPLET (variante sûre)** | SUP, P1 | classes `kb-x-` uniquement, 5 au plus |
| color (texte, fond, lien, bordure) | PARTIEL | **COMPLET** | STY | couleurs **libres** `#rrggbb` (variables CSS, jamais de style libre) |
| color : dégradé | PARTIEL | **PARTIEL** | STY | 6 dégradés prédéfinis aux couleurs du site ; pas de dégradé libre |
| filter (duotone) | ABSENT | **COMPLET (variante sûre)** | STY, RB | 4 filtres CSS fixes |
| typography | PARTIEL | **COMPLET (variante sûre)** | STY | 11 réglages ; tailles / interlignes / graisses en listes fermées |
| spacing (marge, padding, gap) | PARTIEL | **COMPLET (variante sûre)** | STY | 6 côtés + espace entre blocs internes, 6 tailles |
| dimensions / position | ABSENT | **COMPLET (variante sûre)** | STY | hauteur minimale, largeur maximale, largeur, proportions, alignement large / pleine largeur / flottant, position fixe en haut ; **pas** de position absolue ni de valeur libre : incompatibles avec le rendu responsive |
| border / shadow | PARTIEL | **COMPLET (variante sûre)** | STY | épaisseur, trait, côtés, couleur, coins, 5 ombres |
| align | PARTIEL | **COMPLET** | STY | |
| visibilité par appareil | ABSENT | **COMPLET** | NB, P1 | |
| styles de bloc / variations | ABSENT | **COMPLET (variante sûre)** | NB, P1 | listes fermées par bloc ; pas d'API `registerBlockStyle` tierce (NON APPLICABLE) |
| `theme.json` | NON APPLICABLE | **NON APPLICABLE** | — | jetons du site (`mk_sites.tokens`) |

## D. Document, publication, persistance, pages

| Fonction | Initial | **Final** | Preuve |
|---|---|---|---|
| Brouillon / publication / planification | PARTIEL | **COMPLET** | P0 |
| Autosave, modifications non enregistrées, conflits | PARTIEL | **COMPLET** | P0, NAV |
| Création de brouillon dans le bon site, doublons | À CORRIGER | **COMPLET** | P0, NAV |
| Révisions + restauration | PARTIEL | **COMPLET** | P0 |
| Isolation multi-sites : blocs réutilisables, widgets, notes, mentions | PARTIEL | **COMPLET** | RS, WID, NOTES, MEN |
| Médiathèque du blog, rôle « formateur » | PARTIEL | **PARTIEL** | décision produit n° 4 en attente (compte créateur seul : risque faible) |
| Blocs inconnus / pertes silencieuses | PARTIEL | **PARTIEL** | P0 (D11) : le contenu retiré est signalé, pas conservé |
| **Éditeur de blocs pour les pages** (page « À propos ») | BLOQUÉ | **COMPLET** | PAG | éditeur complet (blocs, versions, aperçu avec la mise en page de la page) ; la page **n'est jamais un article** (absente du blog, des flux, du plan du site et de toutes les listes ; aucune action d'article ne l'atteint) ; retour au texte simple sans perte |
| Garde-fous (D13) | À CORRIGER | **COMPLET** | LIM |
| Modèles d'article, boîtes méta | ABSENT | **NON APPLICABLE** | — | les gabarits de thème se règlent dans Apparence ; pas de champs personnalisés dans un article |

## E. API / extensibilité

| Fonction | Initial | **Final** | Preuve | Remarque |
|---|---|---|---|---|
| Registre central de blocs | ABSENT | **COMPLET** | REG | + descriptions partagées : styles (`blockStyles`), widgets (`dynamicBlocks`), services d'intégration (`embedProviders`) |
| API d'extension tierce (plugins) | ABSENT | **NON APPLICABLE** | — | pas de système de plugins : le registre interne en tient lieu |
| Dépréciations / migrations versionnées | ABSENT | **PARTIEL** | REG | version de schéma suivie (3) ; aucune migration de contenu n'a été nécessaire (les anciens blocs restent lisibles) : le mécanisme n'est pas simulé |
| Diagnostic | ABSENT | **COMPLET** | REG | |
| Filtres/hooks, SlotFill | NON APPLICABLE | **NON APPLICABLE** | — | |

## F. Accessibilité, navigateurs, performance

| Fonction | **Final** | Preuve | Remarque |
|---|---|---|---|
| Noms accessibles, libellés, identifiants, onglets ARIA | **COMPLET** (règles vérifiées) | A11Y : 0 défaut sur les écrans de l'éditeur **et** sur les écrans ajoutés (réglages de style, 11 widgets, verrouillage, guide, HTML, notes, fil d'Ariane, aperçu) | audit automatisé de règles précises, pas un audit WCAG complet |
| Clavier | **COMPLET** | A11Y, P1, GUT | |
| **Lecteurs d'écran réels** (VoiceOver, NVDA) | **PARTIEL** | — | **non testés** : aucun n'est pilotable ici |
| Chrome | **COMPLET** | toute la suite | |
| **Firefox 153** | **COMPLET (fumée)** | FF | éditeur sans erreur JS, aller-retour de 9 réglages, frappe/annulation au clavier réel, zoom, lightbox publique ; **le reste de la suite navigateur n'y est pas rejoué** |
| **Safari** | **PARTIEL** | — | **non testé** (aucun moyen de le piloter ici) |
| Performance : 800 blocs | **COMPLET** | A11Y : ≈ 0,2 s, frappe médiane ≈ 11 ms | |
| i18n | **PARTIEL** | — | interface entièrement en français (choix produit : pas de couche de traduction) |
