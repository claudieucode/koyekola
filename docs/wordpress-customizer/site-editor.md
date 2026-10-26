# Éditeur de site (thèmes blocs)

## Conditions [Doc]
- Disponible **uniquement** avec un thème bloc (WP 5.9+). Un thème classique n'a pas l'éditeur de site ; il peut activer l'éditeur de modèles côté bloc-éditeur (page/article) seulement.
- Accès : Apparence → Éditeur. Menus principaux : Identité, Styles, Pages, Navigation, Compositions (patterns), Modèles. Palette de commandes (Cmd/Ctrl+K). [Doc]

## Barre supérieure [Doc]
Retour, insertion de blocs, annuler/rétablir, vue en liste (structure), palette de commandes, aperçu (y compris styles responsives par fenêtre), réglages, Styles, Enregistrer (liste des éléments modifiés : compositions synchronisées, menus, modèles, parties ; on peut tout enregistrer ou une partie ; prévient qu'un en-tête/pied s'applique à toutes les pages), Options (barre supérieure, mode focus, sans distraction, éditeur visuel/code, outils : **exporter** le thème en zip, raccourcis, préférences). Mode zoom arrière (vue condensée).

## Styles globaux [Doc : « Styles overview »]
- Portée : tout le site, indépendante du modèle édité ; prérequis thème bloc + WP 5.9.
- **Variations de styles** (6.0) : versions alternatives du thème (couleurs, polices, espacements, réglages de blocs) ; « Parcourir les styles ». **Variations couleurs / typographie** seules (6.6).
- **Typographie** : par élément (texte, liens, titres H1–H6, boutons) : famille avec aperçu, taille (préréglages S/M/L/XL/XXL ou valeur px/em/rem/vw/vh ; valeurs fluides min/max), graisse/style, interligne, espacement des lettres, décoration, orientation, casse.
- **Couleurs** : palette (Thème / Par défaut / Personnalisée), modification HEX/RGB/HSL, réinitialisation, ajout/suppression de couleurs ; dégradés (linéaire/radial, angle, points) ; couleurs des éléments : fond, texte, liens (+ survol), titres (par niveau), boutons.
- **Mise en page** : largeur du contenu et largeur « large » (px, %, em, rem, vw, vh), remplissage (4 côtés, lié/délié), espacement entre blocs, préréglages d'espacement du thème.
- **Arrière-plan** : image du site.
- **Blocs** : styles par type de bloc pour tout le site (bordure, rayon, marges, couleurs, polices, ombres : 4 préréglages Naturelle/Nette/Franche/Douce). Les blocs individuellement modifiés gardent leurs réglages ; « Avancé → Appliquer globalement » propage un style.
- **Style Book** : aperçu de tous les blocs. **Aperçu en direct** des changements (6.2).
- **CSS additionnel** : global (6.2) et par bloc (`propriété: valeur` sans sélecteur, ou règles avec `&`, `:hover`) ; conservé lors d'une mise à jour du thème, **effacé si on change de thème**. [Doc]
- **Révisions** et **réinitialisation** : menu « ⋯ » du panneau Styles. [Doc]
- Théorie : les valeurs viennent de `theme.json` (thème) et sont surchargées par les choix de l'utilisateur (stockés en base). [Connu — la page développeur « Global Settings and Styles » ne détaille pas ce mécanisme]

## Modèles [Doc : « Template editor »]
- Modèles de base : Accueil statique (Front Page), Accueil du blog, Toutes les archives, Pages, Article seul, Index (secours), 404, Recherche.
- Créer : Front Page, Pages (pour une page précise ou par défaut), archives auteur/catégorie/date/étiquette, **Article seul**, **modèle personnalisé** ; départ d'une composition existante ou de zéro.
- Une modification de modèle **met à jour toutes les pages/articles qui l'utilisent** et prime sur le fichier du thème.
- Assigner un modèle à **une** page/un article depuis la barre latérale de l'éditeur (n'affecte que celui-ci).
- Renommer/supprimer : **seulement** les modèles personnalisés créés par l'utilisateur. Réinitialiser (« Réinitialiser et effacer les personnalisations ») : seulement les modèles déjà modifiés.
- Hiérarchie : un modèle plus précis (catégorie, page précise) prime sur le général, sinon retombée sur Index. [Doc, formulations « secours »]

## Parties de modèles et compositions [Doc]
- **Partie de modèle** : zone structurelle réutilisable (en-tête, pied, barre latérale, autres), gérée sous « Compositions » ; réutilisable par plusieurs modèles ; création de parties personnalisées.
- **Composition (pattern)** : ensemble de blocs prédéfinis ; **composition synchronisée** (anciennement « bloc réutilisable ») : une modification se répercute partout où elle est utilisée. [Connu pour la formulation exacte de la synchronisation]
- **Navigation** : parcourir les menus et faire des modifications de base. **Pages** (6.3+) : modifier/créer des pages dans l'éditeur.

## Différences thème bloc / classique [Doc]
| | Thème bloc | Thème classique |
|---|---|---|
| Éditeur de site, Styles, modèles, parties | oui | non |
| Customizer | masqué sauf besoin d'une extension | oui |
| Widgets | remplacés par des blocs | zones de widgets |
| Menus | bloc Navigation | écran Menus + emplacements |
