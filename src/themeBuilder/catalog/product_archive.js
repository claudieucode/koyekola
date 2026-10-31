// Catalogue « Boutique / catégorie » : 20 mises en page × 5 identités visuelles = 100 modèles. La grille suit la page (source « archive » : catégorie ?categorie= et recherche ?q=) ;
// filtres, recherche, mini-panier et promotions sont les widgets réels de la boutique. Aucun produit, prix ou stock inventé.
const L = (key, label, tags, desc, build) => ({ key, label, tags, desc, build });
const MAXW = { maxWidth: "1180px", width: "100%", marginLeft: "auto", marginRight: "auto" };
const wrap = (k, ch, st = {}) => k.section([k.col(ch, { ...MAXW, gap: k.S.gap })], st);
const info = (k, st = {}) => k.W("archiveinfo", { tag: "h1", showDescription: true, showCount: true, fallback: "Boutique" }, { color: k.S.fg, ...st });
const grid = (k, cols = "3", count = 12, extra = {}) => k.W("shopgrid", { source: "archive", count, columns: cols, orderby: "newest", showPrice: true, showImage: true, empty: "Aucun produit ne correspond à cette recherche.", ...extra });
const filters = (k, extra = {}) => k.W("shopfilters", { showCategory: true, showPrice: true, showStock: true, showSale: true, showSort: true, button: "Filtrer", ...extra });
const search = (k, st = {}) => k.W("shopsearch", { placeholder: "Rechercher un produit…", button: "Rechercher" }, st);
const mini = (k, st = {}) => k.W("minicart", { label: "Panier", showCount: true, hideEmpty: false }, { color: k.S.fg, fontWeight: "600", ...st });
const side = (k, ch, st = {}) => ({ type: "container", children: ch, styles: { desktop: { display: "flex", flexDirection: "column", gap: k.S.gap, flexBasis: "260px", flexShrink: 0, ...st }, mobile: { flexBasis: "100%" } } });
const mainCol = (k, ch) => ({ type: "container", children: ch, styles: { desktop: { display: "flex", flexDirection: "column", gap: k.S.gap, flexBasis: "0px", flexGrow: 1, minWidth: "0px" }, mobile: { flexBasis: "100%" } } });
const split = (k, a, b, st = {}) => k.row([a, b], { alignItems: "flex-start", flexWrap: "wrap", gap: "32px", ...st });
const feature = (k, source, count, cols, head) => k.col([k.H(head, "2"), k.W("shopgrid", { source, count, columns: cols, orderby: source === "featured" ? "featured" : "newest", showPrice: true, showImage: true })]);

module.exports = { type: "product_archive", kind: "page", layouts: [
  L("filtres-gauche", "Filtres à gauche", ["filtres", "latéral", "classique"], "Colonne de filtres à gauche, grille de produits à droite.", (k) => [wrap(k, [split(k, side(k, [filters(k)]), mainCol(k, [info(k), grid(k, "3")]))])]),
  L("filtres-droite", "Filtres à droite", ["filtres", "latéral"], "Grille à gauche, filtres dans une colonne à droite.", (k) => [wrap(k, [split(k, mainCol(k, [info(k), grid(k, "3")]), side(k, [filters(k)]))])]),
  L("filtres-haut", "Filtres en haut", ["filtres", "barre", "large"], "Titre, filtres sur une carte, puis grille à quatre colonnes.", (k) => [wrap(k, [info(k), k.card([filters(k)]), grid(k, "4")])]),
  L("recherche-vedette", "Recherche en vedette", ["recherche", "vedette"], "Grand champ de recherche de produits sous le titre.", (k) => [wrap(k, [info(k, { textAlign: "center" }), k.col([search(k)], { maxWidth: "620px", width: "100%", marginLeft: "auto", marginRight: "auto" }), grid(k, "3")])]),
  L("grille-2", "Grande vignette (2 colonnes)", ["grande grille", "visuel", "2 colonnes"], "Deux colonnes de grandes fiches produit.", (k) => [wrap(k, [info(k), grid(k, "2", 8)])]),
  L("grille-4", "Grille à 4 colonnes", ["grille", "4 colonnes", "catalogue"], "Catalogue à quatre colonnes.", (k) => [wrap(k, [info(k), grid(k, "4", 12)])]),
  L("grille-5", "Grille dense (5 colonnes)", ["dense", "5 colonnes", "grand catalogue"], "Cinq colonnes pour un grand catalogue.", (k) => [wrap(k, [info(k), grid(k, "5", 20, { orderby: "name" })])]),
  L("promos-dessus", "Promotions en tête", ["promotions", "mise en avant"], "Produits en promotion au-dessus du catalogue.", (k) => [wrap(k, [info(k), feature(k, "sale", 3, "3", "Nos promotions"), k.divider(), k.H("Tout le catalogue", "2"), grid(k, "3")])]),
  L("vedettes-dessus", "Produits vedettes en tête", ["vedette", "mise en avant"], "Produits mis en avant au-dessus de la liste.", (k) => [wrap(k, [info(k), feature(k, "featured", 4, "4", "À la une"), k.divider(), grid(k, "4")])]),
  L("bandeau-panier", "Bandeau avec mini-panier", ["panier", "bandeau", "boutique"], "Fine barre avec recherche et mini-panier au-dessus du catalogue.", (k) => [k.band([k.inner([search(k, { flexGrow: 1, maxWidth: "460px" }), mini(k)])], { paddingTop: "10px", paddingBottom: "10px", backgroundColor: k.S.alt }), wrap(k, [info(k), grid(k, "3")])]),
  L("panier-commande", "Panier et compte", ["panier", "compte", "commande"], "Liens panier, commande et compte client sous le titre.", (k) => [wrap(k, [info(k), k.W("shopcart", { cartLabel: "Panier", showCount: true, checkoutLabel: "Commander", accountLabel: "Mon compte" }), grid(k, "3")])]),
  L("bandeau-categorie", "Bandeau de catégorie", ["bandeau", "catégorie", "centré"], "Titre et description de la catégorie dans un bandeau pleine largeur.", (k) => [k.band([k.inner([info(k, { textAlign: "center", width: "100%" })], { justifyContent: "center" })], { paddingTop: "56px", paddingBottom: "56px", backgroundColor: k.S.alt }), wrap(k, [grid(k, "4")])]),
  L("editorial", "Éditorial", ["éditorial", "magazine", "sobre"], "Libellé, titre, filet puis deux grandes colonnes.", (k) => [wrap(k, [k.L("Boutique"), info(k, { fontSize: "44px" }), k.divider(), grid(k, "2", 8, { orderby: "featured" })])]),
  L("minimal", "Catalogue minimal", ["minimaliste", "sobre", "rapide"], "Titre et grille, rien d'autre.", (k) => [wrap(k, [info(k), grid(k, "3", 9)])]),
  L("recherche-filtres", "Recherche et filtres latéraux", ["recherche", "filtres", "complet"], "Recherche puis filtres dans la colonne latérale.", (k) => [wrap(k, [split(k, side(k, [search(k), filters(k)]), mainCol(k, [info(k), grid(k, "3")]))])]),
  L("double-mise-en-avant", "Promotions et vedettes", ["promotions", "vedette", "vitrine"], "Deux rangées de mise en avant avant le catalogue complet.", (k) => [wrap(k, [info(k), feature(k, "featured", 3, "3", "À la une"), feature(k, "sale", 3, "3", "En promotion"), k.divider(), grid(k, "3")])]),
  L("filtres-collants", "Filtres collants", ["filtres", "collant", "sticky"], "La colonne de filtres reste visible pendant le défilement.", (k) => [wrap(k, [split(k, side(k, [filters(k)], { position: "sticky", top: "24px" }), mainCol(k, [info(k), grid(k, "3", 12, { orderby: "price_asc" })]))])]),
  L("outils-en-ligne", "Outils en ligne", ["recherche", "panier", "compact"], "Recherche et mini-panier sur une ligne, puis titre et grille.", (k) => [wrap(k, [k.row([search(k, { flexGrow: 1 }), mini(k)], { justifyContent: "space-between" }), info(k), grid(k, "4")])]),
  L("carte-recherche", "Carte titre et recherche", ["carte", "recherche", "encadré"], "Titre et recherche dans une carte, grille dessous.", (k) => [wrap(k, [k.card([info(k), search(k)], { gap: "18px" }), grid(k, "4")])]),
  L("vitrine", "Vitrine complète", ["vitrine", "filtres", "vedette"], "Produits vedettes, filtres en haut, puis catalogue à quatre colonnes.", (k) => [wrap(k, [info(k, { textAlign: "center" }), feature(k, "featured", 3, "3", "Sélection"), k.card([filters(k)]), grid(k, "4", 16)])]),
] };
