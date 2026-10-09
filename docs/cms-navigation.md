# KOLAKISA CMS — Palier 7 : moteur de navigation

## Principe
Aucun système de menu n'existait pour le site public (en-tête et pied de page codés dans `views/partials/`). Le moteur est donc nouveau, mais **sans rien casser** :
sans menu affecté à un emplacement, l'en-tête et le pied de page d'origine s'affichent exactement comme avant.
Le moteur est indépendant de l'apparence : il fournit un menu à un emplacement (`navigation.forLocation`) ou par identifiant (`navigation.forMenu`) à qui le demande
(en-tête, pied de page, futur éditeur du site, widget du Page Builder, menus contextuels, méga-menu).

## Modèle (base principale, `src/config/database.js`)
- `nav_menus` : id, site_id (vide = site public principal), name, slug, description, status (published | draft), created_by, dates.
- `nav_items` : id, menu_id, parent_id, position, type (page | article | category | tag | home | custom), object_id, url (liens personnalisés seulement),
  label (vide = titre de la ressource), status (published | hidden), new_tab, rel, icon, visibility (all | guests | members), description, media_id, meta (JSON) — les 4 derniers préparent icônes, images (Médiathèque) et méga-menu.
- `nav_locations` : site_id, location (header | footer | mobile), menu_id — un menu par emplacement et par site.
Un élément qui vise une ressource garde `type` + `object_id`, jamais son adresse : l'URL est recalculée à chaque rendu (slug modifié = lien toujours bon).

## Résolveurs (registre extensible `TYPES`)
page → `/p/<slug>` (mk_landing_pages) · article → `/blog/<slug>` · catégorie / étiquette → `taxonomy.urlOf` · accueil → `/` · lien personnalisé : `/chemin`, `#ancre`, `/page#ancre`, `https://…`, `mailto:`, `tel:` (liste blanche ; `javascript:`, `data:`, `//hôte` refusés).
États d'une ressource : ok · non publiée · à la corbeille · introuvable. Sur le site, un lien dont la ressource n'est pas « ok » n'est jamais affiché (ni lien mort) ; dans l'administration il est signalé et réparable (remplacer la destination, ou retirer). Rien n'est supprimé en silence.

## Hiérarchie et ordre
3 niveaux au plus, 300 éléments par menu. Ordre = `position` renumérotée 0..n par fratrie dans une transaction (SAVEPOINT). Un élément ne peut jamais devenir son propre descendant (déplacement refusé ; structure envoyée au glisser-déposer validée : mêmes éléments, aucun doublon, pas de boucle, profondeur ≤ 3, tout ou rien).
Retirer un élément fait remonter ses sous-éléments (déclencheur SQL). Supprimer un menu supprime ses éléments et libère ses emplacements, jamais les pages/articles/catégories.

## Interface (CMS → Navigation, aussi Apparence → Menus)
Liste des menus (éléments, liens à réparer, emplacements), affectation des emplacements, éditeur : ajout par recherche serveur (pas de chargement massif), lien personnalisé, accueil, modification (texte différent du titre de la ressource, destination, nouvel onglet, rel, masqué, visibilité), réorganisation par boutons (formulaires, sans JavaScript) et par glisser-déposer (persisté), duplication (copie en brouillon), suppression avec confirmation, import « à partir du site actuel ».

## Site public
En-tête : le menu remplace Catégories/Catalogue/Blog (les liens de compte restent). Mobile : un menu mobile distinct, sinon celui de l'en-tête, dans le tiroir existant. Pied de page : un élément avec sous-éléments = une colonne, les éléments seuls = colonne « Liens ».
Accessibilité : lien + bouton de sous-menu (`aria-expanded`, `aria-controls`, libellé), Entrée/Espace, Échap ferme et rend le focus, sortie du focus ferme, `aria-current="page"`, cibles de 44 px au tactile, nouvel onglet annoncé aux lecteurs d'écran. `public/js/site-nav.js` (chargé seulement si un menu est affecté).

## Droits
`navigation.read` (lecteur) · `navigation.write` (éditeur : menus et éléments) · `navigation.publish` (administrateur : affecter un emplacement = publier sur le site) · `navigation.delete` (administrateur : supprimer un menu).

## Cache
Aucun cache : le rendu lit la base à chaque requête (≈ 2 requêtes + 1 par type de ressource utilisé) ; tout changement est visible immédiatement. Événements émis (`events` de `src/services/navigation.js`) : menu.created / updated / deleted / assigned, items.changed.

## Préparé, non implémenté
Méga-menu (description, icône, media_id, meta existent) · menus de sites du Page Builder (`site_id` + `forLocation(…, { siteId })`, non branché dans les pages) · emplacements supplémentaires (`registerLocation`) · types d'éléments supplémentaires (`registerType`) · règles de visibilité par rôle · éditeur d'icône dans l'interface.
