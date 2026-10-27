# Inventaire de l'interface de l'éditeur de blocs WordPress (Gutenberg)

Date de vérification : 2026-10-27. Version documentaire observée : pages WordPress.org mises à jour jusqu'à WordPress 7.1 (sept.-oct. 2026) ; code source consulté sur la branche `trunk` de https://github.com/WordPress/gutenberg.

Convention : chaque section cite son URL source. Les éléments marqués « (code) » proviennent du dépôt GitHub, ceux marqués « (mémoire) » viennent de connaissances générales non rechargées pendant cette session (voir « Points non vérifiés »).

---

## 1. Vue d'ensemble de l'espace de travail

Source : https://wordpress.org/documentation/article/wordpress-block-editor/

L'espace de travail comporte trois zones : barre supérieure, barre latérale (réglages document / bloc), zone de contenu (canevas). L'éditeur s'ouvre par défaut en plein écran (mode « Fullscreen »). Accès : Articles > Ajouter, Pages > Ajouter.

---

## 2. Barre supérieure (top toolbar)

Source : https://wordpress.org/documentation/article/wordpress-block-editor/ (numérotation de la page, WP 6.8+ / 7.x)

| # | Élément | Emplacement | Déclencheur | Comportement | Conditions |
|---|---|---|---|---|---|
| 1 | Voir les articles / pages (icône W ou icône du site) | Extrême gauche | Clic | Quitte l'éditeur vers la liste des articles/pages ; invite à enregistrer ou quitter si des changements existent | Affiche l'icône du site si disponible |
| 2 | Bascule de l'inserteur de blocs (+) | Gauche | Clic | Affiche/masque l'inserteur global | Masqué en mode « sans distraction » (sauf commande `/`) |
| 3 | Annuler / Rétablir | Gauche | Clic ou Ctrl/Cmd+Z, Ctrl/Cmd+Maj+Z | Annule ou rétablit la dernière action | — |
| 4 | Aperçu du document (Document Overview) | Gauche | Clic ou Maj+Alt+O (Win) / Ctrl+Alt+O (Mac) | Ouvre un panneau à deux onglets : Vue en liste et Plan (Outline) | — |
| 5 | Palette de commandes | Centre (champ) | Clic sur le champ, Ctrl/Cmd+K | Voir section 9 | Indisponible dans certains environnements (voir note section 9) |
| 6 | Enregistrer le brouillon / Enregistré | Droite | Clic ou Ctrl/Cmd+S | Enregistre un brouillon ; le libellé passe à « Enregistré » | Masqué une fois publié |
| 7 | Voir (View) | Droite | Clic | Menu d'aperçu appareils, « Aperçu dans un nouvel onglet » et édition responsive (voir section 8) | — |
| 8 | Réglages (icône engrenage) | Droite | Clic ou Ctrl/Cmd+Maj+, | Affiche/masque la barre latérale (onglets document et bloc) | — |
| 9 | Publier | Droite | Clic | Rend le contenu public | Étape de pré-publication optionnelle (préférence « Include pre-publish checklist ») |
| 10 | Options (trois points) | Extrême droite | Clic | Menu Options (section 7) | — |
| 11 | Voir l'article / la page | Droite | Clic | Ouvre le front-end dans un nouvel onglet | Seulement après publication |

Mode « barre d'outils du haut » : le contenu de la barre d'outils du bloc est épinglé dans la barre supérieure (section 10).

Bouton Zoom arrière (Zoom out) : près de la bascule des réglages ; visible seulement si « Afficher le modèle » (Show template) est actif dans l'aperçu (section 10).

Source complémentaire (code, libellés de notifications d'enregistrement) : https://github.com/WordPress/gutenberg/tree/trunk/packages/editor/src/store/utils

---

## 3. Inserteur global et contextuel

Source : https://wordpress.org/documentation/article/adding-a-new-block/ et https://wordpress.org/documentation/article/work-with-blocks/

### 3.1 Inserteur global (bouton + de la barre supérieure)

- Emplacement : panneau latéral gauche, ouvert depuis la barre supérieure.
- Onglets : Blocs, Modèles (patterns, avec « Explorer tous les modèles » qui ouvre une fenêtre plus large), Média (images utilisées + Openverse, bouton vers la médiathèque), et un onglet « Synced patterns » (icône) si des modèles synchronisés existent.
- Comportement : survol d'un bloc = description et aperçu ; clic ou glisser-déposer pour insérer ; champ de recherche en haut ; catégories (Texte, Média, Design, Widgets, Thème, Embeds ; selon source : Layout) ; blocs les plus utilisés en haut selon la préférence « Show most used blocks ».
- Répertoire de blocs : si la recherche ne trouve rien dans les blocs installés, WordPress interroge le répertoire de blocs tiers et propose l'installation du plugin.
- Conditions : la recherche dans le répertoire n'est disponible que pour les utilisateurs autorisés à installer des plugins.

### 3.2 Inserteurs contextuels

| Mécanisme | Emplacement | Déclencheur | Comportement |
|---|---|---|---|
| Bouton + à droite d'un bloc vide | Dans le canevas | Clic (cliquer d'abord sur le texte indicatif si absent) | Modale des blocs les plus utilisés + « Parcourir tout » |
| Bouton + entre deux blocs | Dans le canevas | Survol de l'espace entre blocs (ligne bleue + icône) | Même modale, insertion à cet endroit |
| Commande barre oblique `/` | Dans un paragraphe vide | Taper `/` + nom (ex. `/image`) | Liste de suggestions filtrée au fil de la frappe ; marche aussi pour les modèles synchronisés |
| Menu Options du bloc : Ajouter avant / après | Barre d'outils du bloc, menu trois points | Clic ; Ctrl+Alt+T / Ctrl+Alt+Y (Win), Cmd+Alt+T / Cmd+Alt+Y (Mac) | Crée une ligne vide avant/après le bloc |
| Bouton + dans un bloc conteneur (Groupe, Rangée, Pile) | En bas à droite du conteneur | Clic | Insère dans le conteneur |
| Touche Entrée dans un bloc | Dans le bloc | Entrée | Crée un nouveau paragraphe vide |

Mode « sans distraction » : seule la commande `/` permet d'insérer d'autres blocs que le paragraphe (source : https://wordpress.org/documentation/article/distraction-free-mode/).

---

## 4. Barre d'outils du bloc

Source : https://wordpress.org/documentation/article/working-with-blocks/

- Emplacement : flottante au-dessus du bloc sélectionné ; ou épinglée sous la barre supérieure en mode « Top toolbar ».
- Déclencheur : sélection d'un bloc. Focus clavier : Alt+F10 (Win) / Option+F10 (Mac) (« Navigate to the nearest toolbar »).
- Contrôles communs : Transformer en (type du bloc actuel), poignée de glissement (six points), flèches monter/descendre, Aligner (largeurs « large » et « pleine » selon thème), Plus d'options (trois points verticaux).
- Contrôles de justification : dans la barre, la barre latérale ou les deux (ex. bloc Boutons).
- Contrôles propres au bloc (ex. Image : lien, rogner, remplacer, filtre duotone, légende).
- Format de texte inline (gras, italique, lien, etc.) : voir raccourcis section 11.
- Préférence d'accessibilité « Show button text labels » : remplace les icônes par du texte dans la barre du haut et la barre du bloc.
- Conditions : le contenu varie selon bloc, thème et contexte ; certains éléments disparaissent si le bloc est verrouillé (mouvement) ou en mode « contenu seul ».

### 4.1 Menu « Plus d'options » du bloc

Source : https://wordpress.org/documentation/article/more-options/

| Entrée | Comportement | Conditions |
|---|---|---|
| Copier | Copie le bloc dans le presse-papiers (collable ailleurs, y compris dans un autre article) | — |
| Couper | Copie puis retire | — |
| Dupliquer | Clone sous l'original | Ctrl/Cmd+Maj+D |
| Ajouter avant / Ajouter après | Insère une ligne vide | — |
| Modifier en HTML | Édite le balisage du bloc ; « Edit visually » pour revenir | Désactivé si `supports.html: false`. Le bloc peut devenir non reconnu selon les modifications |
| Copier les styles / Coller les styles | Copie tous les réglages de style ; collage via Ctrl/Cmd+Alt+V sur un bloc de même type | Peut demander la permission du presse-papiers du navigateur |
| Verrouiller / Déverrouiller | Cases « Lock movement » et « Lock removal », puis Appliquer | Sur un Groupe : option d'appliquer le verrou aux blocs imbriqués. Désactivé si `supports.lock: false` |
| Renommer | Nom personnalisé du bloc (affiché en Vue en liste) | `supports.renaming` (vrai par défaut). Raccourci Ctrl/Cmd+Alt+R (code) |
| Masquer | Ouvre la modale de visibilité : « Omit from published content » ou masquage par appareil (desktop/tablet/mobile) | WP 6.9 (masquage), WP 7.0 (par appareil). Raccourci Ctrl/Cmd+Maj+H. `supports.visibility` |
| Créer un modèle (pattern) | Nom + option « Synced » | `supports.reusable` |
| Grouper / Dégrouper | Enveloppe dans un bloc Groupe ; Ctrl/Cmd+G pour plusieurs blocs | Ctrl+G ne groupe pas un bloc unique |
| Supprimer | Retire le bloc ; Maj+Alt+Z (Win) / Ctrl+Alt+Z (Mac) | Désactivé si verrou « removal » |
| Ajouter une note (Add note) | Annotation attachée au bloc | Présent dans le menu de la Vue en liste (WP 7.x) ; raccourci Ctrl/Cmd+Alt+M (code) |

Sources pour « Masquer » : https://wordpress.org/documentation/article/work-with-blocks/ (section Hide a block). Le raccourci de rename, de visibilité et de note vient du code : https://github.com/WordPress/gutenberg/blob/trunk/packages/block-editor/src/components/keyboard-shortcuts/index.ts et https://github.com/WordPress/gutenberg/blob/trunk/packages/editor/src/components/global-keyboard-shortcuts/register-shortcuts.jsx

---

## 5. Panneaux Document et Bloc (barre latérale)

Source : https://wordpress.org/documentation/article/page-post-settings-sidebar/ ; https://wordpress.org/documentation/article/work-with-blocks/

Ouverture : icône engrenage (haut droite) ou Ctrl/Cmd+Maj+,. Deux onglets : Article / Page / [nom du type de contenu personnalisé] (en Site Editor : Modèle) et Bloc.

### 5.1 Onglet Document (Article/Page)

| Panneau | Contenu | Conditions |
|---|---|---|
| Image mise en avant | Définir, remplacer, retirer ; dépôt par glisser | Selon le type de contenu |
| Extrait | Texte libre ; vide = 55 premiers mots générés | Types avec extraits |
| Discussion | Commentaires ouverts, pings/trackbacks | Pings : articles seulement |
| Format de l'article | Liste des formats | Seulement articles et certains thèmes |
| Parent / Ordre | Hiérarchie des pages | Types hiérarchiques (Pages) |
| Catégories | Cases, ajout d'une catégorie avec parent | Articles |
| Étiquettes | Saisie + Entrée, auto-complétion, « Most Used » | Articles par défaut |
| Statut | Brouillon, Attente de relecture, Privé, Planifié, Publié, Protégé par mot de passe, Sticky | « Pending » indisponible après publication |
| Publication | Calendrier / heure / « Now » | Respecte le réglage « La semaine commence le » |
| Slug (permalien) | Modifiable une fois sauvegardé en brouillon | Indisponible si permaliens « Plain » |
| Auteur | Liste déroulante | Selon permissions |
| Modèle | Choix du modèle, « Edit template », « Add template » | Thèmes à blocs ; options absentes pour le rôle Éditeur |
| Révisions | Nombre cliquable ouvrant l'écran des révisions | Voir le fichier PERSISTANCE_ET_COMPATIBILITE.md |
| Mettre à la corbeille | Après premier enregistrement | Reste 30 jours par défaut |

Les panneaux affichés se personnalisent via Préférences > Document settings. En Site Editor, la barre latérale liste les parties de modèle (Areas), propose « Clear customizations » (menu trois points) et la section Avancé (titre, zone, élément HTML, classes CSS).

### 5.2 Onglet Bloc

- Ouverture : sélectionner un bloc ; si la barre latérale est fermée, l'ouvrir avec l'engrenage.
- Sous-onglets : Réglages (Settings), Styles (si le bloc en a : variations de style), parfois Avancé.
- Panneaux : description du bloc, couleur, typographie, dimensions (marge, remplissage, espacement de bloc), bordure et ombre, mise en page, avancé (ancre HTML, classe(s) CSS supplémentaire(s)).
- Menu trois points de chaque panneau : afficher/masquer des contrôles, « Reset » (un réglage) / « Reset all » (tout le panneau).
- Aperçu des styles de bloc : survol d'un bouton de style = aperçu, clic = application.
- Conditions : les contrôles dépendent des `supports` du bloc et du `theme.json` (voir REGLAGES_ET_TRANSFORMATIONS.md).

---

## 6. Vue en liste (List View) et Plan du document (Outline)

Source : https://wordpress.org/documentation/article/list-view/

- Emplacement : panneau latéral gauche, ouvert par le bouton « Document Overview ». Reste ouvert tant qu'on ne le ferme pas (croix ou re-clic). Option de préférence « Always open list view ».
- Vue en liste : arbre de tous les blocs. Clic sur un nom = sélection du bloc ; Échap = désélection ; Maj+clic = sélection multiple ; glisser-déposer dans le panneau (pas dans le canevas pour cette interaction) ; flèche pour replier/déplier ; Alt+L / Option+L = replier tous les autres groupes.
- Menu trois points par bloc : Copier, Couper, Dupliquer, Ajouter avant, Ajouter après, Ajouter une note, Copier les styles, Coller les styles, Grouper, Dégrouper, Verrouiller, Déverrouiller, Renommer, Masquer, Créer un modèle, Supprimer.
- Indicateurs : icône cadenas si verrouillé ; icône œil si masqué (tooltip « Block is hidden ») ; aperçus d'images pour Image et Galerie ; ancre HTML affichée ; modèles synchronisés surlignés en violet avec bouton « Edit original ».
- Onglet Plan (Outline) : nombre de caractères, nombre de mots, temps de lecture, structure des titres (et d'après la page principale : nombre de paragraphes et de blocs).

---

## 7. Menu Options (trois points)

Source : https://wordpress.org/documentation/article/wordpress-block-editor/ (section More options) ; https://wordpress.org/documentation/article/preferences-overview/

| Section | Entrées | Effet |
|---|---|---|
| Vue (View) | Top toolbar ; Distraction free ; Spotlight mode ; Fullscreen mode | Voir section 10 |
| Éditeur | Visual editor / Code editor | Bascule Ctrl+Maj+Alt+M (Win), Maj+Alt+Cmd+M (Mac) |
| Outils | Gérer les modèles ; Raccourcis clavier ; Guide de bienvenue ; Copier tout le contenu ; Aide | Raccourcis : fenêtre section 11 |
| Préférences | Ouvre la fenêtre Préférences | Section 13 |

Remarque : la page indique que « Tools » a été retiré de la barre supérieure en juillet 2025 ; ce menu est son pendant.

---

## 8. Aperçu appareils (Voir / View)

Source : https://wordpress.org/documentation/article/how-to-use-the-preview-function/ (mise à jour 2026-08-19, WP 7.1)

- Emplacement : bouton « Voir » dans la barre supérieure (éditeur d'articles et Site Editor).
- Menu : Desktop, Tablet, Mobile (largeurs prédéfinies du canevas) ; « Preview in new tab » (éditeur d'articles) ou « View site » (Site Editor) ; « Responsive editing » quand disponible.
- Comportement : le canevas est redimensionnable. Après avoir choisi Tablet ou Mobile, des poignées apparaissent de chaque côté ; le glisser met à jour le préréglage actif. En Desktop pleine largeur, les poignées peuvent ne pas être visibles.
- Conditions : l'édition responsive n'est proposée que pour les styles de blocs qui la gèrent.

---

## 9. Palette de commandes (Ctrl/Cmd+K)

Sources : https://wordpress.org/documentation/article/site-editor-command-palette/ ; https://developer.wordpress.org/block-editor/reference-guides/packages/packages-commands/

- Déclencheur : Ctrl+K (Win/Linux) ou Cmd+K (Mac), clic sur le champ central de la barre supérieure, clic sur le titre dans le Site Editor, icône de recherche dans la barre d'admin (WP 7.1).
- Portée : toutes les pages d'administration, Site Editor et éditeur d'articles/pages ; absente sur le front-end.
- Commandes de l'éditeur listées par la doc : Modifier le modèle, Retour à la page, Réinitialiser modèle / partie de modèle / styles, Supprimer modèle, Basculer panneau des réglages, Basculer l'inspecteur de bloc, Basculer mode Spotlight / sans distraction / barre d'outils du haut / plein écran / vue en liste, Ouvrir ou quitter l'éditeur de code, Préférences, Raccourcis clavier, Afficher/masquer le fil d'Ariane, Personnaliser le CSS, Révisions de styles, Ouvrir les styles, Voir le site, Voir modèles et parties de modèle, Menus de navigation, Renommer/Dupliquer/Gérer les modèles, Aller à l'éditeur de site, Ajouter une page ; navigation « Go to » vers les écrans d'admin (Tableau de bord, Articles, Média, Pages, Commentaires, Apparence, Extensions, Utilisateurs, Outils, Réglages et leurs sous-pages) ; recherche d'articles, pages, modèles et parties de modèle par titre. La visibilité du bloc est aussi pilotable depuis la palette (page Work with blocks).
- API d'extension : champs `name`, `label`, `icon`, `callback(close)`, `category` (`command`, `view`, `edit`, `action`), `context`, `keywords` ; hooks `useCommand`, `useCommands`, `useCommandLoader` (commandes dynamiques) ; contextes `site-editor`, `entity-edit`, `block-selection-edit` (les commandes contextuelles passent en premier).
- Condition : le raccourci n'est pas disponible dans certains environnements (ticket Gutenberg #51737 cité par la doc).

---

## 10. Modes d'affichage et d'édition

| Mode | Activation | Effet | Source |
|---|---|---|---|
| Spotlight (concentration) | Options > Vue > Spotlight mode ; palette | Tous les blocs grisés sauf celui en cours | https://wordpress.org/documentation/article/preferences-overview/ |
| Sans distraction (Distraction free) | Options > Vue ; Ctrl+Maj+\ (Win) / Cmd+Maj+\ (Mac) | Ferme les barres latérales, masque la barre du haut (réapparaît au survol du haut), retire beaucoup de boutons, masque les + d'insertion et la barre d'outils du bloc ; insertion d'autres blocs uniquement par `/` ; choix mémorisé dans le stockage local du navigateur | https://wordpress.org/documentation/article/distraction-free-mode/ |
| Plein écran (Fullscreen) | Options > Vue ; Ctrl+Maj+Alt+F / Maj+Alt+Cmd+F | Masque l'interface d'administration | https://wordpress.org/documentation/article/wordpress-block-editor/ |
| Barre d'outils du haut (Top toolbar) | Options > Vue | Barre d'outils du bloc épinglée sous la barre supérieure | https://wordpress.org/documentation/article/work-with-blocks/ |
| Éditeur visuel / Éditeur de code | Options > Éditeur ; Ctrl+Maj+Alt+M | Le mode code affiche tout le contenu en HTML avec délimiteurs de blocs | https://wordpress.org/documentation/article/wordpress-block-editor/ |
| Zoom arrière (Zoom out) | Bouton près des réglages ; Ctrl+Maj+0 / Cmd+Maj+0 | Vue condensée de la structure de la page ; icône visible seulement si « Show template » est actif sur un thème à blocs ; entrée automatique après insertion d'un modèle dans un modèle du Site Editor | https://wordpress.org/documentation/article/zoom-out-view/ |
| Éditer comme blocs / design | Échap pour « Finish editing a design » (code `stop-editing-as-blocks`) | Sortie d'une édition ciblée | code : https://github.com/WordPress/gutenberg/blob/trunk/packages/block-editor/src/components/keyboard-shortcuts/index.ts |
| Utiliser les styles du thème | Préférences > Appearance | Retire les styles du thème dans le canevas si désactivé | https://wordpress.org/documentation/article/preferences-overview/ |

Les modes peuvent se combiner (la doc cite Fullscreen et Spotlight avec Distraction free).

---

## 11. Fenêtre des raccourcis clavier et table complète par OS

Sources : https://wordpress.org/documentation/article/block-editor-keyboard-shortcuts/ (mise à jour 2026-09-14) ; code : https://github.com/WordPress/gutenberg/blob/trunk/packages/editor/src/components/global-keyboard-shortcuts/register-shortcuts.jsx , https://github.com/WordPress/gutenberg/blob/trunk/packages/block-editor/src/components/keyboard-shortcuts/index.ts , https://github.com/WordPress/gutenberg/blob/trunk/packages/editor/src/components/keyboard-shortcut-help-modal/config.js , https://github.com/WordPress/gutenberg/blob/trunk/packages/edit-post/src/components/keyboard-shortcuts/index.js

Fenêtre d'aide : Maj+Alt+H (Win/Linux) ou Ctrl+Option+H (Mac) ; aussi Options > Outils > Raccourcis clavier. Les raccourcis sont regroupés en Global, Sélection, Bloc, Mise en forme du texte (et Transformer, Vue en liste, blocs spécifiques dans la doc).

Alias de modificateurs du code (paquet `@wordpress/keycodes`, valeurs mémoire) : `primary` = Ctrl (Win) / Cmd (Mac) ; `primaryShift` = primary+Maj ; `primaryAlt` = primary+Alt ; `secondary` = Ctrl+Maj+Alt (Win) / Maj+Alt+Cmd (Mac) ; `access` = Maj+Alt (Win) / Ctrl+Alt (Mac).

### 11.1 Globaux

| Action | Windows / Linux | Mac |
|---|---|---|
| Basculer éditeur visuel / de code | Ctrl+Maj+Alt+M | Maj+Alt+Cmd+M |
| Plein écran | Ctrl+Maj+Alt+F | Maj+Alt+Cmd+F |
| Ouvrir la vue en liste | Maj+Alt+O | Ctrl+Alt+O |
| Afficher/masquer le panneau de réglages | Ctrl+Maj+, | Maj+Cmd+, |
| Mode sans distraction | Ctrl+Maj+\ | Cmd+Maj+\ |
| Région suivante de l'éditeur | Ctrl+` ou Maj+Alt+N | Ctrl+` ou Ctrl+Alt+N |
| Région précédente | Ctrl+Maj+` ou Maj+Alt+P | Ctrl+Maj+` ou Ctrl+Alt+P |
| Barre d'outils la plus proche | Alt+F10 | Option+F10 |
| Enregistrer | Ctrl+S | Cmd+S |
| Annuler | Ctrl+Z | Cmd+Z |
| Rétablir | Ctrl+Maj+Z (ou Ctrl+Y) | Maj+Cmd+Z |
| Zoom arrière (bascule) | Ctrl+Maj+0 | Maj+Cmd+0 |
| Ouvrir la palette de commandes | Ctrl+K | Cmd+K |
| Afficher les raccourcis | Maj+Alt+H | Ctrl+Option+H |
| Ajouter une note | Ctrl+Alt+M (code, `primaryAlt+m`) | Cmd+Alt+M |

Remarque : Ctrl+Y est confirmé par la doc comme alias Windows et par le code (alias de rétablissement).

### 11.2 Sélection

| Action | Win/Linux | Mac |
|---|---|---|
| Tout sélectionner (texte du bloc, puis bloc parent ou tous les blocs) | Ctrl+A | Cmd+A |
| Effacer la sélection | Échap | Échap |
| Désélectionner les blocs | Échap deux fois | Échap deux fois |
| Étendre la sélection de texte à plusieurs blocs | Maj+flèches (code `multi-text-selection`) | idem |
| Sélection multiple de blocs | Maj+clic, glisser | idem |

### 11.3 Bloc

| Action | Win/Linux | Mac |
|---|---|---|
| Dupliquer | Ctrl+Maj+D | Maj+Cmd+D |
| Supprimer le(s) bloc(s) | Maj+Alt+Z | Ctrl+Alt+Z |
| Insérer avant | Ctrl+Alt+T | Alt+Cmd+T |
| Insérer après | Ctrl+Alt+Y | Alt+Cmd+Y |
| Supprimer une sélection multiple | Suppr / Retour arrière | idem |
| Monter | Ctrl+Maj+Alt+T | Maj+Alt+Cmd+T |
| Descendre | Ctrl+Maj+Alt+Y | Maj+Alt+Cmd+Y |
| Grouper les blocs sélectionnés | Ctrl+G | Cmd+G |
| Changer le type après un nouveau paragraphe | `/` | `/` |
| Coller les styles | Ctrl+Alt+V | Cmd+Alt+V |
| Copier / Couper / Coller blocs | Ctrl+C / X / V | Cmd+C / X / V |
| Renommer le bloc | Ctrl+Alt+R (code) | Cmd+Alt+R |
| Afficher/masquer le bloc | Ctrl+Maj+H | Maj+Cmd+H |
| Lien vers articles/pages existants | `[[` | `[[` |

Remarque : la page WordPress.org donne pour « Descendre » sur Mac `⌥ + ⌘ + ⇧ + Y` dans le texte et `⇧ + ⌥ + ⌘ + Y` dans le tableau ; ce sont les mêmes touches, ordre différent.

### 11.4 Mise en forme du texte

| Action | Win/Linux | Mac |
|---|---|---|
| Gras | Ctrl+B | Cmd+B |
| Italique | Ctrl+I | Cmd+I |
| Lien | Ctrl+K | Cmd+K |
| Retirer le lien | Ctrl+Maj+K | Maj+Cmd+K |
| Souligné | Ctrl+U | Cmd+U |
| Code en ligne | Ctrl+Alt+X (doc) ; Maj+Alt+X (code, `access+x`) | Cmd+Alt+X (doc) ; Ctrl+Alt+X (code) |
| Barré | Maj+Alt+D (code `access+d`) | Ctrl+Alt+D (code) |
| Espace insécable | Ctrl+Maj+Espace (code) | Cmd+Maj+Espace |
| Backtick (`) sur texte sélectionné | convertit en code en ligne (doc) | idem |

Incohérence relevée : pour le code en ligne, la doc WordPress.org et le fichier de configuration du code ne donnent pas la même combinaison. Voir « Points non vérifiés ».

### 11.5 Transformer des blocs (texte)

| Action | Win/Linux | Mac |
|---|---|---|
| Paragraphe ou titre en titre de niveau 1 à 6 | Maj+Alt+1 à 6 | Cmd+Alt+1 à 6 (doc) ; Ctrl+Alt+1-6 (code, `access`) |
| Titre en paragraphe | Maj+Alt+0 | Cmd+Alt+0 (doc) ; Ctrl+Alt+0 ou 7 (code) |

### 11.6 Vue en liste et blocs spécifiques

| Action | Win/Linux | Mac |
|---|---|---|
| Replier tous les autres éléments | Alt+L | Option+L |
| Bloc Icônes sociales : naviguer entre icônes | non précisé par la page (cellule vide) | non précisé |

---

## 12. Notifications

Sources : https://developer.wordpress.org/block-editor/reference-guides/packages/packages-notices/ ; code https://github.com/WordPress/gutenberg/blob/trunk/packages/editor/src/store/utils/notice-builder.js ; https://github.com/WordPress/gutenberg/tree/trunk/packages/editor/src/components/editor-notices

- Emplacement : notices « inline » en haut du canevas (type `default`) ; « snackbar » en bas à gauche (les trois dernières, type `snackbar`).
- Magasin : `core/notices` (`createSuccessNotice`, `removeNotice`, contexte via la prop `context`, défaut `default`).
- Messages observés dans le code : « Draft saved. », « Media updated. », « View Preview » / lien de vue, messages de réussite par statut (publié, privé, planifié), « Trashing failed », trois messages d'échec d'autosave (échec général, aucune réponse, hors ligne).
- Composants associés listés dans le dépôt : `autosave-monitor`, `autosave-retry`, `local-autosave-monitor`, `post-locked-modal`, `template-validation-notice`, `block-removal-warnings`.
- Conditions : un échec d'autosave déclenche un décompte vers la nouvelle tentative (code `ScheduledAutosaveMonitor`).

---

## 13. Préférences

Source : https://wordpress.org/documentation/article/preferences-overview/ (mise à jour 2025-11-25)

Accès : Options (trois points) > Préférences. Magasin : `core/preferences` (persistance côté utilisateur ; voir API_ET_EXTENSIBILITE.md).

| Onglet | Option | Effet |
|---|---|---|
| Général > Interface | Always open list view | Vue en liste ouverte à chaque ouverture |
| | Show block breadcrumbs | Fil d'Ariane en bas de l'éditeur (sélection du parent) |
| | Allow right-click contextual menus | Menu contextuel |
| | Show starter patterns | Modale de modèles de départ à la création d'une page |
| Général > Document settings | Cases par panneau | Masque/affiche les panneaux de la barre latérale |
| Général > Publishing | Include pre-publish checklist | Étape de revue avant publication (visibilité, date, catégories, étiquettes) |
| Général > Advanced | Zones supplémentaires | Non détaillé |
| Appearance | Top toolbar | Barre d'outils du bloc en haut |
| | Distraction free | Voir section 10 |
| | Spotlight mode | Voir section 10 |
| | Use theme styles | Canevas stylé comme le thème |
| Accessibility | Contain text cursor inside block | Garde le curseur dans le bloc (lecteurs d'écran) |
| | Show button text labels | Texte à la place des icônes |
| Blocks | Show most used blocks | Section « Most used » dans l'inserteur |
| | Liste de blocs avec cases | Masquer/afficher des blocs dans l'inserteur, compteur de blocs masqués et bouton « Reset » |

Le Site Editor a des Général et Blocs plus réduits.

---

## Points non vérifiés

- Les intitulés exacts de l'interface en français n'ont pas été vérifiés : les libellés sont repris de la documentation anglaise.
- Combinaisons du code en ligne, du barré, des titres 1 à 6 sur Mac : la documentation WordPress.org (Cmd+Alt+X, Cmd+Alt+1-6) et le fichier source (`access+x`, `access+1-6`, soit Ctrl+Alt sur Mac) divergent ; non tranché par un test dans l'éditeur.
- Valeurs précises des alias de modificateurs (`primary`, `secondary`, `access`) : issues de ma connaissance du paquet `@wordpress/keycodes`, non rechargées.
- Raccourcis de renommage (Ctrl/Cmd+Alt+R), de visibilité (Ctrl/Cmd+Maj+H, confirmé par la doc) et de note (Ctrl/Cmd+Alt+M) : lus dans `trunk`, pas dans la documentation utilisateur ; ils peuvent différer de la version de WordPress installée.
- Menu « Add note » dans la Vue en liste : listé par la doc ; absent du menu documenté sur la page « More options » ; conditions d'apparition inconnues.
- Contenu exact des sections « Advanced » des préférences, du Guide de bienvenue et des raccourcis du bloc Icônes sociales (cellule vide dans la page).
- Position exacte (gauche/droite, ordre) des boutons de la barre supérieure en WP 7.1 : fondée sur le texte et la numérotation de la page, pas sur les captures.
- Clic droit contextuel : seule l'option de préférence est citée, son contenu n'est pas documenté.
- Aucun test de l'interface réelle n'a été fait ; tout vient de la documentation et du dépôt.
- Les raccourcis de la palette « disponible partout » (barre d'admin WP 7.1) sont décrits par la doc mais non vérifiés sur une installation.
