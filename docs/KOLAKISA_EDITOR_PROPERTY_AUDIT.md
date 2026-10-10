# KOLAKISA — Audit des propriétés de l'éditeur (LOT 0, lecture seule)

Date : 2026-10-10. **Aucun code n'a été modifié pour établir ce document.** Source : exécution de `src/marketing/pages/nodes.js` (registre des 86 types, 86 propriétés de style) et lecture des fiches d'inspecteur de `public/js/page-builder.js` (`INSPECTORS`). Les contrôles réellement affichés se vérifient aussi dans les tests existants (voir la matrice du système existant) ; cette page ne rejoue pas ces tests.
Légende des colonnes : ● groupe complet de contrôles · ≈N sous-ensemble de N propriétés · – absent de la fiche · ▢ élément conteneur.

## 1. Chaîne complète d'une propriété (vérifiée pour le modèle commun)

`contrôle (inspecteur)` → `setStyle / setStyles` (écran actif) → `change()` (historique, regroupement par clé) → arbre JSON (`styles.<écran>.<propriété>`, états `hover / focus / active`) → rendu serveur `POST …/rendu` + `patchCanvas` → enregistrement `PUT …/brouillon` (révision, détection de conflit) → rechargement (même arbre) → publication (CSS généré côté serveur, sans interface d'éditeur).
Une propriété n'existe que si le **serveur** la valide (`STYLE_PROPS`, `check`) : les 86 propriétés de style passent toutes par ce même chemin, donc la chaîne est la même pour toutes. Les **fiches** d'inspecteur décident seulement lesquelles sont proposées pour un type.

## 2. Propriétés de style connues du moteur (86)

| Groupe | Nb | Propriétés |
|---|---|---|
| Mise en page | 24 | display, flexDirection, flexWrap, justifyContent, alignItems, alignContent, alignSelf, justifySelf, order, gap, rowGap, columnGap, columns, gridTemplate, gridRows, gridRowsTemplate, gridAutoFlow, justifyItems, gridColumnSpan, gridRowSpan, gridColumnStart, gridColumnEnd, gridRowStart, gridRowEnd |
| Dimensions | 9 | width, height, minWidth, maxWidth, minHeight, maxHeight, flexGrow, flexShrink, flexBasis |
| Espacement | 8 | margin et padding × 4 côtés (marges négatives et « auto » autorisées, intérieur ≥ 0) |
| Typographie | 12 | fontFamily, fontSize, fontWeight, fontStyle, lineHeight, letterSpacing, wordSpacing, textIndent, textTransform, textAlign, textDecoration, textShadow |
| Couleurs | 2 | color, backgroundColor (références globales `token:…` possibles) |
| Fond | 4 | backgroundSize / Position / Repeat / Attachment (+ type Aucun / Couleur / Image / Dégradé dans l'inspecteur) |
| Bordure | 12 | épaisseur (globale + 4 côtés), style, couleur, rayon (global + 4 coins) |
| Effets | 5 | boxShadow, opacity, overflow, backdropBlur, transitionDuration (+ filtres et ombre détaillée dans l'inspecteur) |
| Position | 7 | position (normale, relative, collante, **absolue**, **fixe**), top/right/bottom/left, transformOrigin, zIndex |
| Média | 3 | objectFit, objectPosition, aspectRatio |

Capacités transversales (`capsOf`) : animations d'apparition (motion) 84/86, effets au défilement 84/86, effets à la souris 84/86, transformations 84/86, **position collante 6/86**, masques 5/86, attributs HTML et CSS personnalisé 86/86, réglages par écran 86/86. Masquage par écran (`hideOn`) et audience par élément : modèle commun.
Écrans : ordinateur (base), tablette (≤ 1023 px), mobile (≤ 767 px) — 3 écrans, non extensibles. États : survol, focus, clic.

## 3. Couverture des groupes de contrôles par type d'élément (86 types)

Nombre de types dont la fiche expose chaque groupe : Mise en page 62 · Typographie 41 · Couleurs 49 · Dimensions 76 · Espacement 85 · Fond 40 · Bordure 52 · Effets 55 · Média 1 (sur 86). **15 types** proposent les états survol / focus / clic.
**19 types n'ont pas de fiche propre** : ils reçoivent la fiche par défaut (Espacement + Dimensions seulement) : `slides, testimonialcarousel, mediacarousel, cart, facebookbutton, linkinbio, lottie, profilecard, readmore, querylist, postmeta, postterms, postnav, authorbox, archiveinfo, postcomments, cmsmenu, minicart, textpath`.
Le moteur accepte pourtant tous les styles pour ces types (validation et rendu génériques) : l'écart est dans la **fiche** d'inspecteur, pas dans le modèle.

| Type | Nom | Catégorie | Mise en page | Typographie | Couleurs | Dimensions | Espacement | Fond | Bordure | Effets | Média | États | Fiche |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `embed` | Contenu intégré | Avancé | ≈1 | – | – | ≈3 | ● | – | ● | ● | – | – | propre |
| `html` | HTML (sécurisé) | Avancé | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `addtocart` | Bouton d'achat | Commerce | ≈1 | – | – | – | ● | – | – | ≈1 | – | – | propre |
| `course` | Formation | Commerce | ≈1 | – | – | ≈3 | ● | ● | ● | ● | – | ● | propre |
| `courserating` | Avis de la formation | Commerce | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `account` | Compte du visiteur | Dynamique | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | ● | propre |
| `catfilter` | Filtre par catégorie | Dynamique | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `copyright` | Copyright | Dynamique | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `courselist` | Formations du catalogue | Dynamique | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `dyntext` | Texte dynamique | Dynamique | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `postcontent` | Contenu de l'article | Dynamique | ≈1 | – | – | ≈3 | ● | – | ● | ● | – | – | propre |
| `posts` | Derniers articles du blog | Dynamique | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `search` | Recherche | Dynamique | ≈1 | – | – | ≈3 | ● | – | – | – | – | – | propre |
| `sitelogo` | Logo du site | Dynamique | ≈1 | – | – | – | ● | – | – | ≈1 | – | – | propre |
| `sitetitle` | Titre du site | Dynamique | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `accordion` | Accordéon / FAQ | Interaction | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `breadcrumb` | Fil d'Ariane | Interaction | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `button` | Bouton | Interaction | ≈1 | ● | ● | ≈3 | ● | ● | ● | ● | – | ● | propre |
| `flipbox` | Boîte retournable | Interaction | ≈1 | ● | – | ≈3 | ● | – | ● | ≈2 | – | – | propre |
| `link` | Lien | Interaction | ≈1 | ● | ≈1 | – | ● | – | – | – | – | ● | propre |
| `menu` | Menu de navigation | Interaction | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | ● | propre |
| `menuanchor` | Ancre de menu | Interaction | – | – | – | ● | ● | – | – | – | – | – | propre |
| `modal` | Fenêtre (modale) | Interaction | ≈1 | – | – | – | ● | – | – | – | – | – | propre |
| `readingprogress` | Barre de lecture | Interaction | – | – | ≈1 | – | – | – | – | – | – | – | propre |
| `sharebuttons` | Boutons de partage | Interaction | ≈1 | – | ≈1 | – | ● | – | – | ≈1 | – | – | propre |
| `social` | Réseaux sociaux | Interaction | ≈1 | – | ≈1 | – | ● | – | – | ≈1 | – | – | propre |
| `tabs` | Onglets | Interaction | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `toc` | Table des matières | Interaction | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `toggle` | Bascule | Interaction | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `tooltip` | Infobulle | Interaction | ≈1 | ● | ● | – | ● | – | – | – | – | – | propre |
| `archiveinfo` | En-tête d'archive | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `authorbox` | Boîte auteur | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `cart` | Panier | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `cmsmenu` | Menu du CMS | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `countdown` | Compte à rebours | Marketing | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `counter` | Compteur | Marketing | ≈1 | ● | ● | ≈3 | ● | – | – | ≈2 | – | – | propre |
| `facebookbutton` | Bouton Facebook | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `linkinbio` | Lien en bio | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `lottie` | Animation Lottie | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `mediacarousel` | Carrousel média | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `minicart` | Mini-panier | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `postcomments` | Commentaires de l'article | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `postmeta` | Informations de l'article | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `postnav` | Article précédent / suivant | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `postterms` | Catégorie et étiquettes | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `pricelist` | Liste de prix | Marketing | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `pricing` | Offre tarifaire | Marketing | ≈1 | ● | ● | ≈3 | ● | ● | ● | ● | – | ● | propre |
| `profilecard` | Carte de profil | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `progress` | Barre de progression | Marketing | ≈1 | ≈2 | ≈1 | ≈3 | ● | – | – | – | – | – | propre |
| `querylist` | Liste dynamique | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `rating` | Évaluation | Marketing | ≈1 | ≈2 | ≈1 | – | ● | – | – | – | – | – | propre |
| `readmore` | Lire la suite | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `signupform` | Formulaire | Marketing | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `slides` | Diaporama | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `testimonial` | Témoignage | Marketing | ≈1 | ● | ● | ≈3 | ● | ● | ● | ● | – | ● | propre |
| `testimonialcarousel` | Carrousel de témoignages | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `textpath` | Texte sur un tracé | Marketing | – | – | – | ● | ● | – | – | – | – | – | **défaut** (Espacement + Dimensions) |
| `audio` | Audio | Média | ≈1 | – | – | ≈3 | ● | – | ● | ● | – | – | propre |
| `carousel` | Carrousel d'images | Média | ≈1 | – | – | ≈3 | ● | – | ● | ● | – | – | propre |
| `gallery` | Galerie | Média | ≈2 | – | – | ≈3 | ● | – | ● | ● | – | – | propre |
| `hotspot` | Image à points d'intérêt | Média | ≈1 | – | – | ≈3 | ● | – | ● | ● | – | – | propre |
| `icon` | Icône | Média | ≈1 | – | ≈1 | ≈2 | ● | – | – | – | – | ● | propre |
| `iconbox` | Boîte d'icône | Média | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `image` | Image | Média | ≈1 | – | – | ● | ● | – | ● | ● | ● | ● | propre |
| `imagebox` | Boîte d'image | Média | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `map` | Google Maps | Média | – | – | – | ≈3 | ● | – | ● | ≈2 | – | – | propre |
| `video` | Vidéo | Média | ≈1 | – | – | ≈3 | ● | – | ● | ● | – | – | propre |
| `column` ▢ | Colonne | Structure | ≈9 | – | ● | ● | ● | ● | ● | ● | – | ● | propre |
| `columns` ▢ | Colonnes | Structure | ≈9 | – | ● | ● | ● | ● | ● | ● | – | ● | propre |
| `container` ▢ | Conteneur | Structure | ≈9 | – | ● | ● | ● | ● | ● | ● | – | ● | propre |
| `divider` | Séparateur | Structure | – | ≈4 | ≈1 | ≈3 | ● | – | ● | – | – | – | propre |
| `grid` ▢ | Grille | Structure | ≈12 | – | ● | ● | ● | ● | ● | ● | – | ● | propre |
| `group` ▢ | Groupe | Structure | ≈9 | – | ● | ● | ● | ● | ● | ● | – | ● | propre |
| `spacer` | Espace | Structure | – | – | – | ≈1 | ● | – | – | – | – | – | propre |
| `stack` ▢ | Pile | Structure | ≈9 | – | ● | ● | ● | ● | ● | ● | – | ● | propre |
| `alert` | Alerte | Texte | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `animatedheading` | Titre animé | Texte | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `badge` | Badge | Texte | ≈1 | ≈4 | – | – | ● | – | ● | – | – | – | propre |
| `code` | Code (texte) | Texte | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `heading` | Titre | Texte | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `iconlist` | Liste d'icônes | Texte | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `list` | Liste | Texte | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `quote` | Citation | Texte | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `table` | Tableau | Texte | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `text` | Texte | Texte | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |
| `timeline` | Chronologie | Texte | ≈1 | ● | ● | ≈3 | ● | ● | ● | ≈4 | – | – | propre |

## 4. Conteneurs (`container`, `columns`, `column`, `grid`, `stack`, `group`)

| Famille demandée | État | Constat (fait vérifié) |
|---|---|---|
| Direction, retour inversé, justification, alignements, retour à la ligne, gap / rowGap / columnGap | **FONCTIONNEL** | fiche « Conteneur » : 9 propriétés de mise en page ; curseur d'écart ajouté aujourd'hui |
| Flex : grow / shrink / basis | **FONCTIONNEL** | dans le groupe Dimensions (flexGrow, flexShrink, flexBasis) |
| Ordre personnalisé | **FONCTIONNEL** | contrôle « Ordre » (premier / dernier / valeur) pour un enfant de conteneur flex ou grille |
| Grille | **FONCTIONNEL** | colonnes, lignes, gabarit, remplissage, placement par case |
| Dimensions width / min / max / height | **FONCTIONNEL MAIS LIMITÉ** | nombre + unité (px, %, em, rem, vw, vh) et « auto » ; **pas de `fit-content`, `min-content`, `max-content`, `clamp()` ni `calc()`** (le validateur `lengthOf` n'accepte que nombre + unité) |
| Marges / intérieur | **FONCTIONNEL** | blocs « Marge externe / interne », liaison indépendante, unités, négatif pour les marges, valeurs globales |
| Position, z-index | **FONCTIONNEL** | static / relative / sticky / absolute / fixed ; haut, droite, bas, gauche ; plan |
| Fond, bordure, rayon, ombre, opacité, débordement | **FONCTIONNEL** | groupes complets sur le conteneur |
| Transformations, transitions | **FONCTIONNEL MAIS LIMITÉ** | transformations : oui ; transitions : **une durée seule**, propriétés fixes (couleur, fond, bordure), **pas de choix d'accélération ni de propriété** |
| États | **PARTIEL** | survol et clic seulement pour le conteneur (`states: ["hover","active"]`) ; pas de focus |
| Responsive | **FONCTIONNEL** | toute propriété par écran ; héritage affiché en grisé ; masquage par écran |
| HTML sémantique / accessibilité | **FONCTIONNEL** | balise (section, header, footer, article, aside, nav), attributs HTML autorisés : `data-…`, `aria-…`, `title`, `role`, `lang` (10 au plus par élément) |
| Écrans personnalisés | **ABSENT** | 3 écrans fixes |

## 5. Sections / blocs

| Famille | État | Constat |
|---|---|---|
| Section libre (`section`) | **FONCTIONNEL** | mise en page (9 propriétés), dimensions, espacement, couleurs, fond, bordure, effets ; contient des éléments et conteneurs |
| Section prête (`legacy`), Formulaire (`form`), Composant (`component`) | **FONCTIONNEL MAIS LIMITÉ** | pas de mise en page ni de typographie dans la fiche (par conception : contenu préfabriqué) ; espacement, dimensions, couleurs, fond, bordure, effets présents ; le composant s'insère comme copie indépendante |
| Position / z-index d'une section | **FONCTIONNEL** | groupe « Position » commun à tous |
| Visibilité par écran | **FONCTIONNEL** | `hideOn` |
| Min / max hauteur | **FONCTIONNEL** | via Dimensions |

## 6. Écarts constatés (ne sont PAS des corrections faites)

1. **19 types sans fiche propre** (liste § 3) : pas de bordure, fond, effets ni typographie proposés, alors que le moteur les accepterait.
2. **États** : 15 types sur 86 ; focus seulement sur certains.
3. **Transitions** : durée unique, ni propriété ni accélération (le moteur d'animation, lui, a ses accélérations).
4. **Dimensions** : pas de mots-clés intrinsèques ni de `clamp()` / `calc()`.
5. **Écrans** : 3 écrans fixes (ni point de rupture ajoutable, ni mode grand écran).
6. **Documentation périmée** : `docs/editeur-pages-audit.md` dit encore que la position absolue est « refusée » ; le code l'accepte (absolue et fixe).
