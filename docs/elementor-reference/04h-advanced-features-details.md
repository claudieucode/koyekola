# 04h — Fonctions transversales lues en détail

_Articles lus le 2026-10-10._

## Conditions d'affichage — /help/show-and-hide-elements-on-a-page-display-conditions/
Paramètres de l'élément → Conditions d'affichage ; effet seulement après Enregistrer/Publier. **Groupes de conditions** : Pages (parent, auteur), Articles (catégories, étiquettes, date de modification, de publication, auteur), **Statut utilisateur** (connecté ou non, rôle, date d'inscription), **Date et heure** (jour de la semaine, heure, date courante — **heure du serveur, pas du visiteur**), Archives (modèles seulement), **Provenance (From URL)**. Aucune condition d'appareil. Logique **ET** dans un groupe, **OU** entre groupes ; plusieurs valeurs par condition. Limites : incompatible avec le cache avancé ; non appliquée sans enregistrer. Pro : **non confirmé**. Copier / effacer les conditions : menu contextuel (/help/copy-and-clear-display-conditions/, non lu).

## CSS personnalisé — /help/custom-css-in-elementor/
Trois niveaux : **site** (Réglages du site), **page** (Réglages de la page), **élément** (onglet Avancé). Le mot-clé `selector` désigne l'élément. **Pro confirmé.** Priorité : élément > page > site. Pour les utilisateurs qui connaissent le CSS ; l'IA peut en générer.

## Masques — /help/mask-option/
Interrupteur, formes prédéfinies (**Cercle, Fleur, Croquis, Triangle, Blob, Hexagone**), forme personnalisée (SVG), image de masque (PNG/SVG), ajustement (adapter, remplir, perso), position (9), répétition (aucune, répéter, X, Y, arrondi, espacé). Pro : non indiqué.

## Contour du texte — /help/text-stroke-feature/
Style → Titre → Contour du texte : épaisseur (px, em, rem), couleur (globale ou libre), réinitialisation. Pris en charge : Titre, Icon Box, Onglets, Accordéon, Text Path (et annoncé pour Posts, Titre animé, listes et tableaux de prix, Flip Box, CTA, carrousel de témoignages, compte à rebours).

## Séparateur de forme — /help/shape-divider/
En haut ou en bas d'une section/conteneur : forme, couleur, largeur, hauteur, retournement, « devant » (la liste des formes n'est pas donnée).

## Attributs personnalisés — /help/custom-attributes-pro/
v3 : une ligne `clé|valeur`, plusieurs valeurs séparées par un espace. V4 : onglet Général → Attribut, nom + valeur (étiquettes dynamiques). Les attributs `data-*`, ARIA, `rel`… sont acceptés ; **aucune liste d'attributs interdits n'est donnée** (voir sécurité côté KOLAKISA). **Pro confirmé.**

## Composants (V4) — /help/components-2/
Blocs réutilisables synchronisés sur tout le site avec modifications par instance. Création par clic droit « Créer un composant » (éléments **atomiques** uniquement). Insertion depuis l'onglet Composants ; édition du maître (toutes les instances changent) ; **propriétés exposées** (onglet Général seulement) ; les valeurs d'instance **survivent** aux mises à jour du maître ; « Détacher » ; publication seule ou avec la page ; suppression sans casser les instances ; groupes (vides seulement supprimables). **Pro** ; création / édition réservées aux administrateurs ; **pas de versions** documentées.

## Sélection multiple — /help/multi-select-feature/
Dans Structure, Cmd/Ctrl+clic pour ajouter ; actions : dupliquer, coller le style, supprimer.

## Favoris — /help/quickly-access-favorite-widgets/
Clic droit sur un widget → « Ajouter aux favoris » ; section Favoris en haut du panneau.

## Contrôle de fenêtre (Viewport) — /help/what-is-the-viewport-control/
Double curseur début/fin des effets de défilement, en % de la fenêtre (0 = l'élément entre en bas, 50 = milieu).

## Magnétisme de défilement (Scroll Snap) — /help/scroll-snap/
Réglages de la page → Avancé : position (haut, centre, bas), marge de défilement (px, pour un en-tête collant), arrêt (normal / toujours). **Pages seulement** (pas les modèles).

## Export / import des variables et classes — /help/how-to-export-and-import-variables-and-classes/
Inclus par défaut dans l'export du site ; export ciblé « classes et variables » en zip ; aucune limite documentée.
