# Couverture des widgets KOLAKISA par le système de « parties » stylables

*Généré depuis le registre réel (`parts.js` + `NODE_TYPES`) — 92 types : **74 avec parties**, **18 à racine seule (justifiés)**. Test garde-fou : `tests/widgets-parts-couverture.test.js`.*

## Architecture (rappel)
Chaque widget déclare ses composants internes UNE FOIS dans `src/marketing/pages/parts.js` (`label`, `select`, `groups`, `states`). Les données sont enregistrées dans `node.parts[<partie>].styles[écran]` / `.states[état]` ; validation par la grammaire fermée (`normalizeParts`), CSS écrit par `pageCss()` (`.kw-node.kw-n-<id> <select>`), sélecteur de partie dans l’onglet Style (`styleSet`). Détail : `KOLAKISA_WIDGET_STYLE_ARCHITECTURE.md`.

## Intégrer un nouveau widget
1. Déclarer le widget (`NODE_TYPES`, `registerWidget`) et son gabarit EJS avec des classes de rôle stables.
2. Ajouter ses composants dans `PARTS` (ou, si la racine est le seul élément visible, une justification dans `ROOT_ONLY`).
3. Lancer `node --test tests/widgets-parts-couverture.test.js tests/widgets-parts.test.js` : un widget sans parties ni justification fait échouer le test ; chaque partie est vérifiée (validation, aller-retour export/import/duplication, CSS par écran).
Aucun changement de l’éditeur, de `pageCss()` ni de l’historique n’est nécessaire.

## Règles de cascade et responsive
Défauts du thème (`landing.css`) → styles du site → classe globale → réglage de la partie → écran plus étroit (tablette ≤ 1023 px, mobile ≤ 767 px, héritage vers le bas) → état (survol / focus / clic, un jeu par état). Spécificité garantie par `.kw-node.kw-n-<id>`, sans `!important`.

## Matrice par widget et par composant
| Widget | Composants personnalisables (parties) | États |
|---|---|---|
| `list` | Élément de la liste | — |
| `quote` | Texte de la citation, Auteur | — |
| `code` | Numéros de ligne | — |
| `image` | Image, Légende | hover |
| `gallery` | Vignette, Image, Légende | hover |
| `video` | Cadre du lecteur, Vidéo (fichier) | — |
| `audio` | Légende, Lecteur | — |
| `button` | Icône | — |
| `accordion` | Question + réponse, Question, Réponse | hover, focus |
| `tabs` | Barre d'onglets, Onglet, Contenu d'un onglet | hover, focus |
| `timeline` | Étape, Date, Titre, Texte | — |
| `progress` | Libellé et valeur, Piste, Barre | — |
| `menu` | Liste, Lien, Bouton mobile | hover, focus |
| `carousel` | Diapositive, Image, Flèches, Points | hover, focus |
| `toggle` | Titre, Contenu | hover, focus |
| `alert` | Icône, Titre, Texte | — |
| `counter` | Nombre, Libellé | — |
| `testimonial` | Étoiles, Citation, Auteur, Fonction, Photo | — |
| `pricing` | Étiquette, Nom de l'offre, Prix, Description, Liste des avantages, Bouton | hover, focus |
| `breadcrumb` | Liste, Liens, Page courante | hover, focus |
| `social` | Icône | hover, focus |
| `sharebuttons` | Bouton | hover, focus |
| `modal` | Bouton d'ouverture, En-tête, Titre, Contenu, Pied, Bouton fermer | hover, focus |
| `embed` | Contenu intégré | — |
| `iconlist` | Icône, Ligne, Lien | hover, focus |
| `tooltip` | Déclencheur, Infobulle | hover, focus |
| `hotspot` | Point, Carte | hover |
| `posts` | Carte, Image, Corps de la carte, Date, Titre, Extrait | hover |
| `courselist` | Carte, Image, Corps de la carte, Titre, Sous-titre, Prix, Bouton | hover, focus |
| `search` | Champ, Bouton | hover, focus |
| `account` | Lien du compte, Lien du panier, Pastille du panier | hover, focus |
| `table` | Légende, Cellules d'en-tête, Cellules, Lignes du corps, Cellules du pied | hover |
| `countdown` | Bloc de temps | — |
| `course` | Image, Contenu, Titre, Sous-titre, Prix, Bouton | hover, focus |
| `sitelogo` | Image, Texte | — |
| `postcontent` | Intertitres (H2), Intertitres (H3), Paragraphes, Liens, Images, Citations | hover, focus |
| `catfilter` | Liste, Catégories, Catégorie active, Compteur | hover, focus |
| `sitetitle` | Lien | hover, focus |
| `addtocart` | Prix, Bouton | hover, focus |
| `courserating` | Étoiles, Note, Nombre d'avis | — |
| `animatedheading` | Mot animé | — |
| `flipbox` | Face avant, Face arrière, Titres, Textes | — |
| `pricelist` | Ligne, Intitulé, Prix, Description | hover |
| `toc` | Titre, Liste, Lien | hover, focus |
| `readingprogress` | Barre, Remplissage | — |
| `signupform` | Titre, Introduction, Bouton d'envoi | hover, focus |
| `map` | Carte | — |
| `imagebox` | Image, Titre, Texte | hover |
| `iconbox` | Icône, Titre, Texte | — |
| `rating` | Titre, Étoiles, Étoiles vides, Étoiles pleines, Valeur | — |
| `slides` | Image, Voile, Bloc de texte, Titre, Texte, Bouton, Flèches, Points | hover, focus |
| `testimonialcarousel` | Diapositive, Étoiles, Citation, Nom, Fonction, Photo, Flèches, Points | hover, focus |
| `mediacarousel` | Image, Légende, Flèches, Points | hover, focus |
| `cart` | Titre, Panier vide, Ligne, Image, Nom, Prix, Total, Bouton de commande, Lien « modifier » | hover, focus |
| `cta` | Image, Contenu, Titre, Description, Bouton, Bandeau | hover, focus |
| `facebookbutton` | Bouton | — |
| `facebookembed` | Cadre | — |
| `floatingbutton` | Bouton | hover, focus |
| `linkinbio` | Photo, Nom, Texte, Lien, Icône du lien | hover, focus |
| `lottie` | Animation | — |
| `profilecard` | Photo, Nom, Fonction, Texte | — |
| `readmore` | Début du texte, Suite du texte, Lien « lire la suite » | hover, focus |
| `querylist` | Élément, Image, Titre de la liste, Titre d'un élément, Informations, Date, Extrait, Compteur | hover, focus |
| `postmeta` | Information | — |
| `postterms` | Libellé, Catégorie / étiquette | hover, focus |
| `postnav` | Lien, Sens (précédent / suivant), Titre, Image | hover, focus |
| `authorbox` | Titre, Photo, Nom, Texte, Lien | hover, focus |
| `archiveinfo` | Titre, Description, Nombre de résultats | — |
| `postcomments` | Titre, Commentaire, Avatar, Auteur et date, Texte | — |
| `cmsmenu` | Liste, Lien | hover, focus |
| `minicart` | Icône, Libellé, Pastille | — |
| `sitemap` | Groupe, Titre du groupe, Liste de liens, Lien | hover, focus |
| `smartlink` | Bouton | hover, focus |
| `videoplaylist` | Lecteur, Nom de la playlist, Vidéo de la liste | hover, focus |

## Widgets à racine seule (justification documentée)
| Widget | Justification |
|---|---|
| `container` | conteneur : ses enfants sont de vrais nœuds |
| `columns` | conteneur : enfants = nœuds |
| `column` | conteneur : enfants = nœuds |
| `grid` | conteneur : enfants = nœuds |
| `stack` | conteneur : enfants = nœuds |
| `group` | conteneur : enfants = nœuds |
| `spacer` | élément vide : la racine est l'espace |
| `divider` | la racine est le trait (couleur, épaisseur, style par la racine) |
| `heading` | la racine est le titre |
| `text` | la racine est le paragraphe (ses balises internes héritent de la typographie) |
| `badge` | la racine est l'étiquette |
| `link` | la racine est le lien |
| `html` | contenu libre signé : pas de structure connue |
| `dyntext` | la racine est le texte dynamique |
| `copyright` | la racine est le paragraphe |
| `icon` | la racine est l'icône |
| `menuanchor` | ancre invisible : aucun rendu public |
| `textpath` | texte sur un tracé SVG : propriétés CSS de boîte sans effet sur les sous-éléments SVG |

## Résultats des tests
Voir la section « Validation » ci-dessous (complétée après la suite complète).

## Validation (2026-10-31)
- Tests des parties : `widgets-parts`, `widgets-parts-regression` (sortie identique à l'octet sans partie), `widgets-contrat`, `widgets-parts-couverture` — tous verts.
- Suite complète (`npm test`, exécutée seule) : 5407 tests, 5376 réussis, 3 ignorés, 12 en échec — tous hors périmètre de cette livraison et indépendants de `parts.js` :
  migrations 090/091 et 075/079 (numérotation après fusion avec `main`), index des clés étrangères, classes orphelines `mk-ar-add` / `col-site` / `pb-back-sites` (barre d'administration),
  registre de navigation, portée des routes, lanceur de recette prod (Node ≥ 22). À traiter séparément.
- Limite connue : états (survol, focus, clic) non déclinés par écran, comme pour la racine.
