# 06 — Système de styles

_Vérifié le 2026-10-10._

## Réglages du site (Site Settings) — confirmé
Source : https://elementor.com/help/site-settings/ (article lu). Accès : logo Elementor → Réglages du site, ou Ctrl/Cmd+K.
- **Design System** : Couleurs globales (Primaire, Secondaire, Texte, Accent + couleurs personnalisées) ; Polices globales (mêmes quatre styles typographiques + nouveaux styles).
- **Theme Style** : Typographie, Boutons, Images, Champs de formulaire, En-tête et pied de page.
- **Paramètres** : Identité du site (nom, description, logo, favicon) ; Arrière-plan (site, mobile) ; **Mise en page** (polices génériques par défaut, largeur de contenu, espacement par défaut des widgets, modèle de page par défaut) ; Lightbox (images, galeries, carrousels, vidéos) ; Transitions de page ; CSS personnalisé ; Réglages supplémentaires.
- Points de rupture, écart, tailles d'image : **non mentionnés** dans le texte lu (les points de rupture sont documentés ailleurs, voir 08).

## Styles par widget — confirmé (voir 04)
Typographie, couleurs, bordure/rayon, ombre, filtres CSS, opacité, état Normal/Survol, contour et ombre du texte, modes de fusion.

## Éditeur V4 : classes et états — confirmé (recherche, sources de blog/aide)
- Chaque élément a une **classe locale** (priorité maximale, non supprimable) ; les **classes globales** sont nommées, réutilisables ; modifier une classe globale met à jour tous ses usages. Le Class Manager renomme, supprime, réordonne.
- **États** (survol, focus, actif) sont portés par la classe ; états propres aux Tabs (« Selected » ajouté en 3.34).
- **Variables** (3.31+) : la variable définit la valeur, la classe définit la portée ; Variables Manager ; tailles variables (3.32, Pro) ; conversion de styles locaux en classes globales (3.32).
- Synchronisation des variables V4 avec les couleurs/polices globales v3 : possible pour couleurs et typographie seulement.
- Permissions : les administrateurs créent/modifient les variables ; les autres rôles les appliquent seulement.

## Non vérifié
Priorité exacte entre classes (ordre de cascade), « Réinitialiser le style » (existence confirmée dans le menu contextuel, comportement non lu), CSS généré (fichiers par page ?), mise en cache.
