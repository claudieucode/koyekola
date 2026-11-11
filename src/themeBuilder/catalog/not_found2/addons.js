// Compléments de récupération — blocs utiles à n'importe quelle page 404, composés dans l'identité du modèle. Un modèle en reçoit un à trois, choisis (et vérifiés) par le test de diversité :
// ils prolongent le parcours du visiteur (chercher, lire, acheter, apprendre, écrire) avec les VRAIES données du site ; jamais de contenu inventé.
const { posts, recent, popular, cats, courses, shop, draw } = require("./h");
const ART = require("./art");
const wrap = (k, title, node, st = {}) => k.col([title ? k.L(title, { fontSize: "13px", textTransform: "uppercase", letterSpacing: "2px" }) : null, node].filter(Boolean), { gap: "10px", width: "100%", marginTop: "28px", ...st });
const FAQ = [{ q: "Pourquoi cette page est-elle introuvable ?", a: "<p>L'adresse a peut-être été saisie avec une faute, la page a pu être déplacée ou supprimée, ou le lien qui vous a conduit ici est ancien.</p>" }, { q: "Que puis-je faire maintenant ?", a: "<p>Utilisez la recherche, retournez à l'accueil ou écrivez-nous : nous retrouverons ce que vous cherchiez.</p>" }];
const ADDONS = {
  recherche: (k) => wrap(k, "Chercher sur le site", k.search("site", { maxWidth: "520px", width: "100%" })),
  articles: (k) => wrap(k, "Derniers articles", posts(k, 3)),
  lus: (k) => wrap(k, null, popular(k, "Les plus lus", 4)),
  recents: (k) => wrap(k, null, recent(k, "À lire plutôt", 4)),
  categories: (k) => wrap(k, null, cats(k, "Parcourir par catégorie")),
  formations: (k) => wrap(k, "Formations récentes", courses(k, 3)),
  boutique: (k) => wrap(k, "À la boutique", shop(k, 4)),
  // Le widget d'abonnement exige un formulaire d'inscription PUBLIÉ du site : sans formulaire, rien n'est ajouté (jamais de modèle impossible à publier)
  abonnement: (k, env) => (env && env.formId ? wrap(k, null, k.W("emailsubscribe", { title: "Restez informé", button: "S'abonner", formId: env.formId }, { width: "100%", maxWidth: "460px" })) : null),
  faq: (k) => wrap(k, null, k.W("accordion", { items: FAQ, single: true, openFirst: false }, { width: "100%", maxWidth: "640px" })),
  bascule: (k) => wrap(k, null, k.W("toggle", { title: "Pourquoi voit-on cette page ?", text: "<p>Parce que l'adresse demandée ne correspond à aucune page du site : elle a pu être déplacée, renommée ou supprimée.</p>" }, { width: "100%", maxWidth: "640px" })),
  aide: (k) => wrap(k, null, k.W("modal", { buttonLabel: "Signaler un lien cassé", variant: "outline", title: "Signaler un problème", text: "<p>Dites-nous quelle adresse ne fonctionne pas et d'où vous venez : nous la rétablirons.</p>", ctaLabel: "Écrire au support", ctaUrl: "/contact" })),
  compte: (k) => wrap(k, null, k.account({ justifyContent: "flex-start" })),
  menu: (k) => wrap(k, "Naviguer", k.menu("header", {}, false)),
  liens: (k) => wrap(k, null, k.row([["Accueil", "/"], ["Blog", "/blog"], ["Catalogue", "/catalogue"], ["Contact", "/contact"]].map(([l, u]) => k.LINK(l, u, { fontFamily: k.S.font, textDecoration: "underline" })), { gap: "22px" })),
  contact: (k) => wrap(k, null, k.row([k.T("<p>Une question ?</p>", { fontSize: "15px" }), k.LINK("Écrivez-nous", "/contact", { fontFamily: k.S.font, textDecoration: "underline" })], { gap: "10px" })),
  ruban: (k) => k.W("marquee", { items: [{ text: "Page introuvable" }, { text: "Erreur 404" }, { text: "Revenez à l'accueil" }], speed: "slow", direction: "left", separator: "•" }, { color: k.S.mute, fontFamily: k.S.font, fontSize: "18px", width: "100%" }),
  machine: (k) => k.W("motiontypewriter", { prefix: "Essayez : ", phrases: [{ text: "la recherche" }, { text: "le blog" }, { text: "le contact" }], suffix: "", tag: "p", cursor: "bar" }, { color: k.S.fg, fontFamily: k.S.font, fontSize: "20px" }),
  aimant: (k) => k.W("motionmagneticbutton", { label: "Explorer le catalogue", link: "/catalogue", size: "md", align: "left" }, {}),
  relief: (k) => k.W("motiontiltcard", { title: "Un détour par le blog ?", titleTag: "h3", text: "Les derniers articles vous attendent.", linkLabel: "Lire le blog", link: "/blog" }, { maxWidth: "420px", width: "100%" }),
  icones: (k) => k.W("iconlist", { items: [{ text: "Accueil", icon: "home", link: "/" }, { text: "Rechercher", icon: "search", link: "/blog" }, { text: "Nous écrire", icon: "mail", link: "/contact" }, { text: "Mon compte", icon: "user", link: "/compte" }] }, { width: "100%" }),
  dessin: (k) => draw(k, ART.loupe, { alt: "Une loupe", width: 120, stroke: 3, color: k.S.accent }, { alignSelf: "flex-start" }),
  degrade: (k) => k.W("motiongradienttext", { text: "Retrouvons votre chemin", tag: "p", color: k.S.accent }, { fontSize: "26px", fontFamily: k.S.head, fontWeight: "700" }),
};

// Traitements du numéro 404 ajoutables en tête de section aux modèles qui n'en ont pas (N=6) : (N = code de l'axe « traitement du numéro »)
const num = (k, txt, st) => ({ type: "heading", props: { text: txt, level: "2", tag: "p" }, styles: { desktop: { fontWeight: "800", lineHeight: 0.85, ...st } } });
const NUMERALS = {
  pale: { N: 1, node: (k) => num(k, "404", { fontSize: "16vw", color: k.S.line, letterSpacing: "-0.04em", opacity: 0.55 }) },
  contour: { N: 11, node: (k) => num(k, "404", { fontSize: "13vw", color: "transparent", textStrokeWidth: "2px", textStrokeColor: k.S.accent, letterSpacing: "-0.02em" }) },
  discret: { N: 2, node: (k) => k.L("Erreur 404", { fontSize: "13px", letterSpacing: "3px", textTransform: "uppercase" }) },
  degrade: { N: 5, node: (k) => k.W("motiongradienttext", { text: "404", tag: "p", color: k.S.accent }, { fontSize: "11vw", fontWeight: "800", lineHeight: 0.9 }) },
  objet: { N: 3, node: (k) => k.row([num(k, "4", { fontSize: "9vw", color: k.S.fg }), { type: "container", children: [], styles: { desktop: { width: "7vw", height: "7vw", minWidth: "44px", minHeight: "44px", borderRadius: "50%", backgroundColor: k.S.accent, flexShrink: "0" } } }, num(k, "4", { fontSize: "9vw", color: k.S.fg })], { gap: "1vw", flexWrap: "nowrap", alignItems: "center" }) },
  pixel: { N: 9, node: (k) => num(k, "404", { fontSize: "8vw", fontFamily: "font.press-start-2p", color: k.S.accent, lineHeight: 1.1, fontWeight: "400" }) },
  code: { N: 10, node: (k) => k.T("<p>ERROR 404 // NOT_FOUND</p>", { fontFamily: "font.jetbrains-mono", fontSize: "14px", color: k.S.accent, letterSpacing: "2px" }) },
  anime: { N: 7, node: (k) => k.W("motionkinetictext", { lines: [{ text: "404", look: "outline" }], tag: "p", accent: "token:accent" }, { fontSize: "12vw", lineHeight: 0.9 }) },
};
module.exports = { ADDONS, NAMES: Object.keys(ADDONS), NUMERALS, NUM_NAMES: Object.keys(NUMERALS) };
