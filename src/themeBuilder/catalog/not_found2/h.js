// Outils communs de la bibliothèque « Page 404 » : identités, messages, éléments récurrents. Aucun contenu inventé : liens vers pages standard, données réelles du site.
const { SKINS } = require("../kit");
const BASE = SKINS.find((s) => s.key === "clair");
const skin = (key, label, o) => ({ ...BASE, key, label, radius: "0px", btnRadius: "0px", shadow: "none", weight: "700", caps: "none", track: "0px", bw: "1px", pad: "16px", gap: "24px", btn: "outline", rule: "none", ...o });
const MSG = "Cette page est introuvable";
const WHY = "L'adresse a peut-être changé ou la page n'existe plus.";
// Texte décoratif : un <p> (jamais un deuxième h1) ; le sens est porté par le titre de niveau 1
const deco = (txt, st) => ({ type: "heading", props: { text: txt, level: "2", tag: "p" }, styles: { desktop: st } });
const stage = (k, children, st = {}, t, m) => k.section(children, { minHeight: "72vh", justifyContent: "center", ...st }, t, m);
// Lien dans la police de l'identité du modèle (le kit laisse la police du site)
const LK = (k, label, url, st = {}) => k.LINK(label, url, { fontFamily: k.S.font, ...st });
const U = (k, label, url, st = {}) => LK(k, label, url, { textDecoration: "underline", ...st });
// Forme géométrique native (conteneur sans contenu) : brique des illustrations « en aplats »
const shape = (w, h, bg, st = {}) => ({ type: "container", children: [], styles: { desktop: { width: w, height: h, backgroundColor: bg, flexShrink: "0", ...st } } });
// Widget natif avec réglages par défaut du moteur
const W = (k, type, props = {}, st = {}, t, m) => k.W(type, props, st, t, m);
// Illustration vectorielle originale (SVG « collé » du widget de dessin) : trait, pas de remplissage externe
const draw = (k, svg, o = {}, st = {}) => k.W("motionsvgdraw", { source: "custom", svg, alt: o.alt || "", strokeWidth: o.stroke || 3, width: o.width || 360, align: o.align || "center", cap: "round" }, { color: o.color || k.S.fg, width: "100%", maxWidth: `${o.width || 360}px`, ...st });
const NAV = [["Accueil", "/"], ["Blog", "/blog"], ["Catalogue", "/catalogue"], ["Contact", "/contact"]];
const navRow = (k, st = {}, lk = {}) => k.row(NAV.map(([l, u]) => U(k, l, u, lk)), { gap: "22px", ...st });
const posts = (k, n = 3, o = {}) => k.W("posts", { count: n, layout: "grid", showExcerpt: false, showDate: true, showImage: true, empty: "Les articles apparaîtront ici.", ...o }, { width: "100%" });
const recent = (k, title = "À lire plutôt", n = 4, o = {}) => k.W("querylist", { title, source: "posts", mode: "recent", count: n, layout: "list", showImage: false, showDate: true, empty: "Les articles apparaîtront ici.", ...o }, { width: "100%" });
const popular = (k, title = "Les plus lus", n = 5, o = {}) => k.W("querylist", { title, source: "posts", mode: "popular", count: n, layout: "list", showImage: false, showDate: true, empty: "Les articles apparaîtront ici.", ...o }, { width: "100%" });
const cats = (k, title = "Parcourir par catégorie", o = {}) => k.W("querylist", { title, source: "categories", mode: "popular", count: 12, layout: "inline", showCount: true, empty: "Les catégories apparaîtront ici.", ...o }, { width: "100%" });
const courses = (k, n = 3, o = {}) => k.W("courselist", { count: n, sort: "recent", showPrice: true, cta: "Découvrir", empty: "Les formations apparaîtront ici.", ...o }, { width: "100%" });
const shop = (k, n = 4, o = {}) => k.W("shopgrid", { count: n, columns: String(Math.min(n, 4)), source: "all", orderby: "newest", ...o }, { width: "100%" });
// Abonnement : le widget exige un formulaire d'inscription publié du site (env.formId) ; sans formulaire, repli sur un bouton vers la page de contact (le modèle reste publiable partout)
const subscribe = (k, env, props = {}, st = {}) => (env && env.formId ? k.W("emailsubscribe", { ...props, formId: env.formId }, st) : k.col([k.T("<p>" + (props.intro || "Une question, une idée ? Écrivez-nous.") + "</p>"), k.B("Nous écrire", "/contact", "solid", { alignSelf: "flex-start" })], { gap: "12px", ...st }));
module.exports = { subscribe, skin, MSG, WHY, deco, stage, LK, U, shape, W, draw, NAV, navRow, posts, recent, popular, cats, courses, shop };
