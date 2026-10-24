// Composition des thèmes complets : un langage compact qui produit de VRAIES sections libres du Page Builder (arbres d'éléments du registre nodes.js, validés par le moteur,
// entièrement modifiables dans l'éditeur). Chaque variante est une MISE EN PAGE différente (pas une couleur différente) ; un thème choisit ses variantes, ses textes et ses
// jetons (palette, polices, rayons) dans sa fiche (specs/). Aucun HTML, CSS ni script libre : seulement des éléments et des styles de la grammaire fermée du moteur.
//
// Un bloc d'une fiche = [variante, paramètres]. Les variantes (en-têtes « head:*», bandeaux « hero:* », contenus « feat:* », preuve « proof:* », galeries « gal:* », tarifs,
// questions, appels à l'action « cta:* », contact, pieds de page « foot:* », pages éditoriales) sont déclarées dans BLOCKS ci-dessous.

// ---------- éléments ----------
const S = (d, t, m) => ({ styles: { desktop: d, ...(t ? { tablet: t } : {}), ...(m ? { mobile: m } : {}) } });
const el = (type, props, children, styles) => ({ type, ...(props ? { props } : {}), ...(children ? { children } : {}), ...(styles ? S(...[].concat(styles)) : {}) });
const px = (n) => `${n}px`;
const H = (text, level = "2", d = {}, t, m) => el("heading", { text, level: String(level) }, null, [d, t, m]);
const P = (html, d = {}, t, m) => el("text", { html: /^</.test(html) ? html : `<p>${html}</p>` }, null, [d, t, m]);
const BTN = (label, url = "/contact", variant = "primary", d = {}, extra = {}) => el("button", { label, url, variant, ...extra }, null, [d]);
const IMG = (src, alt, d = {}, t, m, extra = {}) => el("image", { src, alt, ...extra }, null, [{ width: "100%", ...d }, t, m]);
const ICON = (name, size = "32", d = {}) => el("icon", { name, size: String(size) }, null, [d]);
const BADGE = (text, tone = "primary") => el("badge", { text, tone });
const stack = (children, d = {}, t, m) => el("stack", null, children, [d, t, m]);
const group = (children, d = {}, t, m) => el("group", null, children, [{ display: "flex", flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: "12px", ...d }, t, m]);
const grid = (n, children, d = {}, tn, mn) => el("grid", null, children, [{ columns: n, gap: "24px", ...d }, { columns: Math.min(n, 2), ...(tn || {}) }, { columns: 1, ...(mn || {}) }]);
const cols = (a, b, ratio = [1, 1], d = {}, mobile = {}) => el("columns", null, [a, b].map((kids, i) => el("column", null, kids, [{ flexGrow: ratio[i], flexBasis: "0px", justifyContent: "center", ...(i ? {} : {}) }])), [{ gap: "56px", alignItems: "center", ...d }, { gap: "32px" }, { gap: "24px", ...mobile }]);
const rule = (d = {}) => el("divider", null, null, [d]);
const eyebrow = (c, text, d = {}) => text ? el("text", { html: `<p>${esc(text)}</p>` }, null, [{ fontSize: "13px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", color: "token:primary", ...d }]) : null;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const compact = (list) => list.filter(Boolean);

// ---------- contexte d'un thème ----------
const SCALE = { s: [44, 34, 28], m: [56, 40, 32], l: [68, 46, 34], xl: [84, 56, 38] };
const PAD = { tight: [56, 40], normal: [88, 56], airy: [124, 72] };

function makeContext(spec) {
  const dna = { scale: "m", pad: "normal", align: "left", shape: "soft", ...(spec.dna || {}) };
  const [h1, h1t, h1m] = SCALE[dna.scale] || SCALE.m, [pad, padm] = PAD[dna.pad] || PAD.normal;
  return {
    key: spec.key, name: spec.name, brand: spec.brand || spec.name, dna, pad, padm, h1, h1t, h1m,
    art: (slot) => `/themes-art/${spec.key}/${slot}.svg`,
    menu: (spec.menu || []).map(([label, url]) => ({ label, url })),
    cta: spec.cta || ["Nous contacter", "/contact"],
    center: dna.align === "center",
    radius: dna.shape === "sharp" ? "0px" : dna.shape === "pill" ? "28px" : "14px",
    contact: spec.contact || {}, social: spec.social || ["facebook", "instagram", "linkedin"],
  };
}

// Bande pleine largeur au fond choisi, contenu centré : la bande déborde de la colonne de la page jusqu'aux bords de l'écran (largeur 100 % de l'écran, retour au centre),
// et son contenu est posé dans une pile de largeur maximale centrée (les marges en pourcentage de la bande, elles, se calculent sur la colonne de la page : on ne s'en sert pas).
function band(c, children, o = {}) {
  const { bg, color, padY = c.pad, padX = 24, maxWidth = "1180px", gap = 28, align, image, overlay, gradient, minHeight, id, border, shadow, extra = {} } = o;
  const outer = { position: "relative", width: "100vw", maxWidth: "100vw", left: "50%", marginLeft: "-50vw", paddingTop: px(padY), paddingBottom: px(padY), gap: "0px",
    ...(bg ? { backgroundColor: bg } : {}), ...(color ? { color } : {}), ...(minHeight ? { minHeight, justifyContent: "center" } : {}),
    ...(image ? { backgroundImage: { src: image }, backgroundSize: "cover", backgroundPosition: "center" } : {}), ...(overlay ? { overlay: { color: overlay } } : {}), ...(gradient ? { gradient } : {}),
    ...(border ? { borderBottomWidth: "1px", borderStyle: "solid", borderColor: border } : {}), ...(shadow ? { boxShadow: shadow } : {}), ...extra };
  const t = { paddingTop: px(Math.round(padY * 0.7)), paddingBottom: px(Math.round(padY * 0.7)) };
  const m = { paddingTop: px(Math.round(padY * 0.55)), paddingBottom: px(Math.round(padY * 0.55)), ...(minHeight ? { minHeight: "0" } : {}) };
  const inner = { width: "100%", maxWidth, marginLeft: "auto", marginRight: "auto", paddingLeft: px(padX), paddingRight: px(padX), gap: px(gap), ...(align ? { alignItems: align } : {}) };
  return { type: "layout", children: [{ type: "container", ...(id ? { props: { anchor: id } } : {}), children: [stack(compact(children), inner, { paddingLeft: "20px", paddingRight: "20px" }, { paddingLeft: "20px", paddingRight: "20px" })], ...S(outer, t, m) }] };
}
const center = (c) => (c.center ? { textAlign: "center" } : {});
const sectionTitle = (c, o) => compact([eyebrow(c, o.eyebrow, center(c)), H(o.title, "2", { fontSize: "40px", ...center(c) }, { fontSize: "34px" }, { fontSize: "28px" }), o.intro ? P(o.intro, { fontSize: "18px", color: "token:muted", maxWidth: "640px", ...(c.center ? { textAlign: "center", marginLeft: "auto", marginRight: "auto" } : {}) }) : null]);
const cardStyle = (c, extra = {}) => ({ paddingTop: "28px", paddingRight: "28px", paddingBottom: "28px", paddingLeft: "28px", borderRadius: c.radius, backgroundColor: "token:surface", boxShadow: "sm", borderWidth: "1px", borderStyle: "solid", borderColor: "token:muted-line", ...extra });
// Les jetons de couleur du moteur n'ont pas de « trait » : bordure discrète par transparence
const LINE = "#7f7f7f33";
const cardBox = (c, kids, extra = {}) => stack(kids, { ...cardStyle(c, extra), borderColor: LINE });

// ---------- en-têtes ----------
const nav = (c, extra = {}) => el("menu", { label: "Navigation principale", source: "manual", items: c.menu, ...extra }, null, [{ gap: "28px", fontSize: "15px", fontWeight: "600" }]);
const logo = (c, d = {}) => el("sitelogo", { height: 44, link: true }, null, [{ fontWeight: "800", fontSize: "22px", ...d }]);
const ctaBtn = (c, d = {}) => BTN(c.cta[0], c.cta[1], "primary", { fontSize: "15px", ...d });

const HEADS = {
  bar: (c, p = {}) => [band(c, [group([logo(c), group([nav(c), ...(p.noCta ? [] : [ctaBtn(c)])], { gap: "28px" })], { justifyContent: "space-between", flexWrap: "wrap" })], { padY: 18, bg: "token:surface", border: LINE, gap: 0 })],
  center: (c) => [band(c, [stack([logo(c, { fontSize: "30px", textAlign: "center" }), nav(c, {}), ], { alignItems: "center", gap: "14px" })], { padY: 24, bg: "token:background", border: LINE, gap: 0 })],
  split: (c) => { const h = Math.ceil(c.menu.length / 2); return [band(c, [group([el("menu", { label: "Navigation (gauche)", source: "manual", items: c.menu.slice(0, h) }, null, [{ gap: "24px" }]), logo(c, { fontSize: "28px", letterSpacing: "0.08em", textTransform: "uppercase" }), el("menu", { label: "Navigation (droite)", source: "manual", items: c.menu.slice(h) }, null, [{ gap: "24px" }])], { justifyContent: "space-between" })], { padY: 22, bg: "token:background", border: LINE, gap: 0 })]; },
  minimal: (c) => [band(c, [group([logo(c), nav(c, {})], { justifyContent: "space-between" })], { padY: 20, gap: 0, extra: { borderBottomWidth: "0px" } })],
  topbar: (c, p = {}) => [band(c, [group([P(p.info || `${c.contact.phone || ""}${c.contact.phone && c.contact.email ? " · " : ""}${c.contact.email || ""}`, { fontSize: "13px", color: "token:on-primary" }), P(p.note || "", { fontSize: "13px", color: "token:on-primary", opacity: 0.85 })], { justifyContent: "space-between" })], { padY: 8, bg: "token:secondary", gap: 0 }), ...HEADS.bar(c)],
  float: (c) => [band(c, [group([logo(c), nav(c, {}), ctaBtn(c, { borderRadius: "999px" })], { justifyContent: "space-between", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "26px", paddingRight: "14px", borderRadius: "999px", backgroundColor: "token:surface", boxShadow: "lg", borderWidth: "1px", borderStyle: "solid", borderColor: LINE })], { padY: 18, bg: "token:background", gap: 0 })],
  masthead: (c, p = {}) => [band(c, [P(p.dateline || "", { fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase", textAlign: "center", color: "token:muted" }), el("sitelogo", { height: 56, link: true }, null, [{ textAlign: "center", fontSize: "52px", fontWeight: "800", letterSpacing: "-0.02em" }, { fontSize: "40px" }, { fontSize: "34px" }]), rule({ borderWidth: "2px" }), group([nav(c, {})], { justifyContent: "center" })], { padY: 26, bg: "token:background", gap: 12 })],
  dark: (c) => [band(c, [group([logo(c, { color: "token:on-primary" }), group([nav(c, {}), ctaBtn(c, { backgroundColor: "token:accent", color: "token:on-accent" })], { gap: "28px" })], { justifyContent: "space-between" })], { padY: 18, bg: "token:secondary", color: "token:on-primary", gap: 0, extra: { borderBottomWidth: "4px", borderStyle: "solid", borderColor: "token:accent" } })],
  side: (c) => [band(c, [group([group([logo(c), P(c.contact.tagline || "", { fontSize: "13px", color: "token:muted", maxWidth: "260px" })], { gap: "22px" }), nav(c, {})], { justifyContent: "space-between" })], { padY: 18, bg: "token:surface", gap: 0, border: LINE })],
};

// ---------- bandeaux d'accueil ----------
const cta1 = (c, p, d = {}) => p.cta ? BTN(p.cta[0], p.cta[1], "primary", { fontSize: "17px", ...d }, { size: "lg" }) : null;
const cta2 = (c, p, d = {}) => p.cta2 ? BTN(p.cta2[0], p.cta2[1], "outline", { fontSize: "17px", ...d }, { size: "lg" }) : null;
const ctas = (c, p, d = {}) => group(compact([cta1(c, p), cta2(c, p)]), { gap: "14px", ...(c.center ? { justifyContent: "center" } : {}), ...d });
const heroText = (c, p, color) => compact([eyebrow(c, p.eyebrow, { ...(color ? { color } : {}), ...center(c) }), H(p.title, "1", { fontSize: px(c.h1), lineHeight: 1.04, letterSpacing: "-0.02em", ...(color ? { color } : {}), ...center(c) }, { fontSize: px(c.h1t) }, { fontSize: px(c.h1m) }), P(p.sub, { fontSize: "20px", lineHeight: 1.55, maxWidth: "620px", ...(color ? { color } : { color: "token:muted" }), ...(c.center ? { textAlign: "center", marginLeft: "auto", marginRight: "auto" } : {}) }, { fontSize: "18px" }), ctas(c, p)]);
const statsRow = (c, items, color) => group(items.map(([v, l]) => stack([H(v, "3", { fontSize: "34px", fontWeight: "800", ...(color ? { color } : { color: "token:primary" }) }), P(l, { fontSize: "14px", ...(color ? { color } : { color: "token:muted" }) })], { gap: "2px" })), { gap: "40px", marginTop: "12px" });

const HEROES = {
  split: (c, p) => [band(c, [cols(heroText(c, p), [IMG(c.art(p.image || "hero"), p.alt || p.title, { borderRadius: c.radius, aspectRatio: "4/3", objectFit: "cover" })], [1, 1])], { padY: c.pad })],
  "split-left": (c, p) => [band(c, [cols([IMG(c.art(p.image || "hero"), p.alt || p.title, { borderRadius: c.radius, aspectRatio: "3/4", objectFit: "cover" })], heroText(c, p), [1, 1])], { padY: c.pad })],
  center: (c, p) => [band(c, [...heroText(c, p), p.stats ? statsRow(c, p.stats) : null], { padY: c.pad + 16, align: "center", bg: "token:background", extra: { textAlign: "center" } })],
  cover: (c, p) => [band(c, [stack(heroText(c, p, "#ffffff"), { maxWidth: "760px", gap: "22px", ...(c.center ? { alignItems: "center", marginLeft: "auto", marginRight: "auto" } : {}) })], { padY: c.pad + 40, image: c.art(p.image || "hero"), overlay: p.overlay || "#00000066", minHeight: "620px", color: "#ffffff", align: c.center ? "center" : "flex-start" })],
  gradient: (c, p) => [band(c, [stack([...heroText(c, p, "token:on-primary"), p.stats ? statsRow(c, p.stats, "token:on-primary") : null], { maxWidth: "780px", gap: "22px", ...(c.center ? { alignItems: "center", marginLeft: "auto", marginRight: "auto" } : {}) })], { padY: c.pad + 32, gradient: { from: "token:primary", to: "token:secondary", angle: p.angle || 135 }, minHeight: "560px" })],
  editorial: (c, p) => [band(c, [rule({ borderWidth: "3px" }), group([P(p.eyebrow || "", { fontSize: "13px", letterSpacing: "0.2em", textTransform: "uppercase" }), P(p.kicker || "", { fontSize: "13px", color: "token:muted" })], { justifyContent: "space-between" }), H(p.title, "1", { fontSize: px(c.h1 + 24), lineHeight: 0.98, letterSpacing: "-0.035em" }, { fontSize: px(c.h1t + 6) }, { fontSize: px(c.h1m + 2) }), cols([P(p.sub, { fontSize: "21px", lineHeight: 1.5 })], [ctas(c, p)], [2, 1], { alignItems: "flex-start" }), IMG(c.art(p.image || "wide"), p.alt || p.title, { aspectRatio: "21/9", objectFit: "cover", borderRadius: c.radius })], { padY: c.pad - 16, gap: 26 })],
  framed: (c, p) => [band(c, [cols([stack(heroText(c, p), { paddingTop: "48px", paddingBottom: "48px", paddingLeft: "48px", paddingRight: "48px", backgroundColor: "token:surface", borderRadius: c.radius, boxShadow: "xl", gap: "20px" })], [IMG(c.art(p.image || "hero"), p.alt || p.title, { aspectRatio: "1/1", objectFit: "cover", borderRadius: c.radius })], [1, 1])], { padY: c.pad, image: undefined, gradient: { from: "token:background", to: "token:surface", angle: 160 } })],
  stacked: (c, p) => [band(c, [...heroText(c, p), IMG(c.art(p.image || "wide"), p.alt || p.title, { aspectRatio: "21/9", objectFit: "cover", borderRadius: c.radius, boxShadow: "lg" }), p.stats ? group(p.stats.map(([v, l]) => stack([H(v, "3", { fontSize: "30px", color: "token:primary" }), P(l, { fontSize: "14px", color: "token:muted" })], { gap: "2px" })), { gap: "56px", justifyContent: c.center ? "center" : "flex-start" }) : null], { padY: c.pad, align: c.center ? "center" : undefined })],
  bleed: (c, p) => [band(c, [cols(heroText(c, p, "token:on-primary"), [IMG(c.art(p.image || "hero"), p.alt || p.title, { aspectRatio: "3/4", objectFit: "cover", borderRadius: c.radius })], [3, 2])], { padY: c.pad, bg: "token:secondary", color: "token:on-primary" })],
  poster: (c, p) => [band(c, [H(p.title, "1", { fontSize: px(c.h1 + 40), lineHeight: 0.92, letterSpacing: "-0.04em", textTransform: "uppercase", textAlign: "center", color: "token:on-primary" }, { fontSize: px(c.h1t + 10) }, { fontSize: px(c.h1m + 4) }), P(p.sub, { fontSize: "20px", textAlign: "center", color: "token:on-primary", maxWidth: "640px", marginLeft: "auto", marginRight: "auto" }), group(compact([cta1(c, p, { backgroundColor: "token:accent", color: "token:on-accent" }), cta2(c, p, { color: "token:on-primary", borderColor: "token:on-primary" })]), { justifyContent: "center" })], { padY: c.pad + 40, bg: "token:primary", minHeight: "560px", align: "center" })],
};

// ---------- contenus : services, avantages ----------
const items = (p) => p.items || [];
const FEATS = {
  cards: (c, p) => [band(c, [...sectionTitle(c, p), grid(Math.min(4, items(p).length), items(p).map((it, i) => cardBox(c, compact([it.icon ? ICON(it.icon, "32", { color: "token:primary" }) : null, H(it.t, "3", { fontSize: "21px" }), P(it.x, { color: "token:muted" })]))))], { bg: p.bg })],
  rows: (c, p) => [band(c, [...sectionTitle(c, p), ...items(p).map((it, i) => stack([rule(), cols(compact([P(String(i + 1).padStart(2, "0"), { fontSize: "14px", fontWeight: "700", color: "token:primary" }), H(it.t, "3", { fontSize: "26px" })]), [P(it.x, { fontSize: "18px", color: "token:muted" })], [1, 2], { alignItems: "flex-start" })], { gap: "16px" }))], { bg: p.bg })],
  numbered: (c, p) => [band(c, [...sectionTitle(c, p), grid(3, items(p).map((it, i) => stack([H(String(i + 1), "2", { fontSize: "72px", fontWeight: "800", color: "token:accent", lineHeight: 1 }), H(it.t, "3", { fontSize: "22px" }), P(it.x, { color: "token:muted" })], { gap: "10px" })))], { bg: p.bg })],
  alt: (c, p) => [band(c, [...sectionTitle(c, p), ...items(p).map((it, i) => { const text = compact([H(it.t, "3", { fontSize: "28px" }), P(it.x, { fontSize: "18px", color: "token:muted" }), it.link ? BTN(it.link[0], it.link[1], "outline") : null]), pic = [IMG(c.art(`card-${i + 1}`), it.t, { aspectRatio: "4/3", objectFit: "cover", borderRadius: c.radius })]; return i % 2 ? cols(pic, text, [1, 1]) : cols(text, pic, [1, 1]); })], { bg: p.bg, gap: 48 })],
  icons: (c, p) => [band(c, [...sectionTitle(c, p), grid(Math.min(3, items(p).length), items(p).map((it) => el("iconbox", { icon: it.icon || "star", title: it.t, text: it.x, titleLevel: "3", position: "left", size: "48" })))], { bg: p.bg })],
  bento: (c, p) => { const [a, ...rest] = items(p); return [band(c, [...sectionTitle(c, p), cols([cardBox(c, [ICON(a.icon || "star", "40", { color: "token:primary" }), H(a.t, "2", { fontSize: "34px" }), P(a.x, { fontSize: "18px", color: "token:muted" })], { minHeight: "360px", justifyContent: "flex-end", backgroundColor: "token:surface" })], rest.slice(0, 2).map((it) => cardBox(c, [H(it.t, "3", { fontSize: "21px" }), P(it.x, { color: "token:muted" })], { marginBottom: "16px" })), [3, 2], { alignItems: "stretch" })], { bg: p.bg })]; },
  strips: (c, p) => [band(c, [...sectionTitle(c, p), ...items(p).map((it) => group([group([ICON(it.icon || "check", "28", { color: "token:primary" }), H(it.t, "3", { fontSize: "22px" })], { gap: "16px", flexBasis: "320px" }), P(it.x, { color: "token:muted", flexGrow: 1, flexBasis: "320px" })], { justifyContent: "space-between", paddingTop: "22px", paddingBottom: "22px", borderTopWidth: "1px", borderStyle: "solid", borderColor: LINE, gap: "24px" }))], { bg: p.bg, gap: 0 })],
  tabs: (c, p) => [band(c, [...sectionTitle(c, p), el("container", { mode: "tabs", tabsLook: "pills" }, items(p).map((it) => el("container", { name: it.t }, [cols(compact([H(it.t, "3", { fontSize: "26px" }), P(it.x, { fontSize: "18px", color: "token:muted" }), it.link ? BTN(it.link[0], it.link[1], "outline") : null]), [IMG(c.art(`card-${(items(p).indexOf(it) % 4) + 1}`), it.t, { aspectRatio: "4/3", objectFit: "cover", borderRadius: c.radius })], [1, 1])])))], { bg: p.bg })],
  pricelist: (c, p) => [band(c, [...sectionTitle(c, p), el("pricelist", { items: items(p).map((it) => ({ title: it.t, price: it.price || "Sur devis", description: it.x || "" })) })], { bg: p.bg, maxWidth: "820px" })],
  accordion: (c, p) => [band(c, [...sectionTitle(c, p), el("accordion", { items: items(p).map((it) => ({ q: it.t, a: it.x })) })], { bg: p.bg, maxWidth: "860px" })],
  steps: (c, p) => [band(c, [...sectionTitle(c, p), el("timeline", { items: items(p).map((it, i) => ({ date: it.d || `Étape ${i + 1}`, title: it.t, text: it.x })) })], { bg: p.bg, maxWidth: "860px" })],
  checks: (c, p) => [band(c, [cols(compact([...sectionTitle(c, p), p.cta ? BTN(p.cta[0], p.cta[1]) : null]), [el("iconlist", { items: items(p).map((it) => ({ text: it.t, icon: it.icon || "check" })), divider: true, iconColor: "token:primary" })], [1, 1])], { bg: p.bg })],
};

// ---------- preuve ----------
const PROOF = {
  quotes: (c, p) => [band(c, [...sectionTitle(c, p), grid(Math.min(3, items(p).length), items(p).map((it, i) => el("testimonial", { text: it.q, name: it.n, role: it.r || "Témoignage de démonstration", avatar: c.art(`avatar-${i + 1}`), avatarPos: "left", rating: 5 })))], { bg: p.bg })],
  big: (c, p) => { const it = items(p)[0]; return [band(c, [el("text", { html: `<p>« ${esc(it.q)} »</p>` }, null, [{ fontSize: "34px", lineHeight: 1.3, fontWeight: "600", textAlign: "center", maxWidth: "860px", marginLeft: "auto", marginRight: "auto" }, { fontSize: "28px" }, { fontSize: "24px" }]), P(`<strong>${esc(it.n)}</strong> — ${esc(it.r || "Témoignage de démonstration")}`, { textAlign: "center", color: "token:muted" })], { bg: p.bg || "token:surface", align: "center" })]; },
  stats: (c, p) => [band(c, [...(p.title ? sectionTitle(c, p) : []), grid(items(p).length, items(p).map(([v, l]) => stack([H(v, "2", { fontSize: "52px", fontWeight: "800", color: "token:primary", textAlign: "center" }, { fontSize: "44px" }), P(l, { textAlign: "center", color: "token:muted" })], { gap: "4px" })))], { bg: p.bg || "token:surface" })],
  statsbar: (c, p) => [band(c, [grid(items(p).length, items(p).map(([v, l]) => stack([H(v, "3", { fontSize: "40px", color: "token:on-primary", textAlign: "center" }), P(l, { textAlign: "center", color: "token:on-primary", opacity: 0.85 })], { gap: "2px" })))], { padY: 48, bg: "token:primary" })],
  team: (c, p) => [band(c, [...sectionTitle(c, p), grid(Math.min(4, items(p).length), items(p).map((it, i) => stack([IMG(c.art(`portrait-${(i * 2 + 1) % 24 || 1}`), it.n || "Portrait", { aspectRatio: "3/4", objectFit: "cover", borderRadius: c.radius }), H(it.n, "3", { fontSize: "20px" }), P(it.r, { color: "token:muted", fontSize: "15px" })], { gap: "8px" })))], { bg: p.bg })],
  logos: (c, p) => [band(c, [P(p.title || "Ils nous font confiance", { textAlign: "center", fontSize: "13px", letterSpacing: "0.16em", textTransform: "uppercase", color: "token:muted" }), group(items(p).map((n) => H(n, "4", { fontSize: "22px", fontWeight: "800", opacity: 0.55, letterSpacing: "0.04em" })), { justifyContent: "center", gap: "48px" })], { padY: 44, bg: p.bg })],
};

// ---------- galeries et portfolios ----------
const GAL = {
  grid: (c, p) => [band(c, [...sectionTitle(c, p), el("gallery", { images: items(p).map((it, i) => ({ src: c.art(`card-${i + 1}`), alt: it.t, caption: it.t })), columns: 3, ratio: "4/3" })], { bg: p.bg })],
  masonry: (c, p) => [band(c, [...sectionTitle(c, p), el("gallery", { images: items(p).map((it, i) => ({ src: c.art(i % 3 === 1 ? `portrait-${i + 2}` : `card-${i + 2}`), alt: it.t, caption: it.t })), masonry: true, columns: 3 })], { bg: p.bg })],
  cards: (c, p) => [band(c, [...sectionTitle(c, p), grid(3, items(p).map((it, i) => stack([IMG(c.art(`card-${i + 1}`), it.t, { aspectRatio: "4/3", objectFit: "cover", borderRadius: c.radius }), BADGE(it.tag || "Réalisation"), H(it.t, "3", { fontSize: "21px" }), P(it.x || "", { color: "token:muted" })], { gap: "10px" })))], { bg: p.bg })],
  carousel: (c, p) => [band(c, [...sectionTitle(c, p), el("carousel", { images: items(p).map((it, i) => ({ src: c.art(`wide-${i + 1}`), alt: it.t, caption: it.t })), autoplay: false })], { bg: p.bg })],
  wall: (c, p) => [band(c, [grid(2, items(p).slice(0, 4).map((it, i) => IMG(c.art(`square-${i + 1}`), it.t, { aspectRatio: "1/1", objectFit: "cover", borderRadius: c.radius })), { gap: "14px" })], { bg: p.bg, padY: 40, padX: 0, gap: 0 })],
  products: (c, p) => [band(c, [...sectionTitle(c, p), grid(4, items(p).map((it, i) => stack([IMG(c.art(`square-${i + 1}`), it.t, { aspectRatio: "1/1", objectFit: "cover", borderRadius: c.radius }), group([H(it.t, "4", { fontSize: "17px" }), P(it.price || "", { fontWeight: "700", color: "token:primary" })], { justifyContent: "space-between", flexWrap: "nowrap" }), P(it.x || "", { fontSize: "14px", color: "token:muted" })], { gap: "8px" })), { gap: "28px" })], { bg: p.bg })],
};

// ---------- tarifs, appels à l'action, contact ----------
const PRICING = {
  tiers: (c, p) => [band(c, [...sectionTitle(c, p), grid(items(p).length, items(p).map((it, i) => el("pricing", { title: it.t, price: it.price, period: it.period || "", description: it.x || "", features: it.f || [], ctaLabel: it.cta || "Choisir", ctaUrl: it.url || "/contact", highlight: Boolean(it.hl), badge: it.hl ? "Le plus choisi" : "" })))], { bg: p.bg })],
};
const CTAS = {
  band: (c, p) => [band(c, [H(p.title, "2", { fontSize: "40px", color: "token:on-primary", ...center(c) }, { fontSize: "32px" }, { fontSize: "28px" }), p.sub ? P(p.sub, { color: "token:on-primary", fontSize: "18px", maxWidth: "620px", ...(c.center ? { textAlign: "center", marginLeft: "auto", marginRight: "auto" } : {}) }) : null, group([BTN(p.cta[0], p.cta[1], "primary", { backgroundColor: "token:accent", color: "token:on-accent" }, { size: "lg" })], c.center ? { justifyContent: "center" } : {})], { bg: "token:primary", padY: c.pad - 16 })],
  split: (c, p) => [band(c, [cols(compact([H(p.title, "2", { fontSize: "38px" }), p.sub ? P(p.sub, { fontSize: "18px", color: "token:muted" }) : null]), [group([BTN(p.cta[0], p.cta[1], "primary", {}, { size: "lg" }), p.cta2 ? BTN(p.cta2[0], p.cta2[1], "outline", {}, { size: "lg" }) : null].filter(Boolean), { justifyContent: "flex-end" })], [3, 2])], { bg: p.bg || "token:surface", padY: 64, border: LINE })],
  image: (c, p) => [band(c, [stack(compact([H(p.title, "2", { fontSize: "42px", color: "#ffffff", textAlign: "center" }, { fontSize: "34px" }), p.sub ? P(p.sub, { color: "#ffffff", textAlign: "center", fontSize: "18px" }) : null, group([BTN(p.cta[0], p.cta[1], "primary", { backgroundColor: "token:accent", color: "token:on-accent" }, { size: "lg" })], { justifyContent: "center" })]), { alignItems: "center", gap: "18px", maxWidth: "700px", marginLeft: "auto", marginRight: "auto" })], { image: c.art("banner"), overlay: "#0000006b", padY: 96 })],
  card: (c, p) => [band(c, [stack(compact([H(p.title, "2", { fontSize: "34px", textAlign: "center" }), p.sub ? P(p.sub, { textAlign: "center", color: "token:muted" }) : null, group([BTN(p.cta[0], p.cta[1], "primary", {}, { size: "lg" })], { justifyContent: "center" })]), { ...cardStyle(c, { paddingTop: "56px", paddingBottom: "56px", paddingLeft: "40px", paddingRight: "40px", boxShadow: "lg" }), borderColor: LINE, gap: "16px", alignItems: "center" })], { padY: 72, bg: p.bg })],
};
const contactLines = (c, p) => compact([p.address || c.contact.address ? ["mapPin", p.address || c.contact.address] : null, p.phone || c.contact.phone ? ["smartphone", p.phone || c.contact.phone] : null, p.email || c.contact.email ? ["mail", p.email || c.contact.email] : null, p.hours || c.contact.hours ? ["clock", p.hours || c.contact.hours] : null]).map(([icon, text]) => ({ icon, text }));
const CONTACT = {
  info: (c, p) => [band(c, [cols(compact([...sectionTitle(c, { ...p, title: p.title || "Contact" }), el("iconlist", { items: contactLines(c, p), iconColor: "token:primary" }), p.cta ? BTN(p.cta[0], p.cta[1]) : null]), [cardBox(c, [H(p.formTitle || "Écrivez-nous", "3", { fontSize: "24px" }), P(p.formIntro || "Décrivez votre besoin : nous vous répondons sous un jour ouvré.", { color: "token:muted" }), P(`Ou par e-mail : <strong>${esc(p.email || c.contact.email || "contact@exemple.fr")}</strong>`, { color: "token:muted" })])], [1, 1], { alignItems: "flex-start" })], { bg: p.bg }), { type: "form", heading: p.formTitle || "Écrivez-nous", intro: p.formIntro || "" }],
  map: (c, p) => [band(c, [...sectionTitle(c, { ...p, title: p.title || "Nous trouver" }), cols([el("iconlist", { items: contactLines(c, p), iconColor: "token:primary" })], [el("map", { address: p.mapAddress || p.address || c.contact.address || "Paris, France", zoom: 14, height: 360 })], [1, 2])], { bg: p.bg })],
  cards: (c, p) => [band(c, [...sectionTitle(c, { ...p, title: p.title || "Contact" }), grid(Math.max(1, contactLines(c, p).length), contactLines(c, p).map((l) => cardBox(c, [ICON(l.icon, "32", { color: "token:primary" }), P(l.text, { fontWeight: "600" })])))], { bg: p.bg }), { type: "form", heading: p.formTitle || "Écrivez-nous", intro: p.formIntro || "" }],
};

// ---------- pieds de page ----------
const social = (c, d = {}) => el("social", { items: c.social.map((n) => ({ network: n, url: `https://${n}.com/` })), size: "32", shape: "circle", label: "Nos réseaux" }, null, [d]);
const FOOT = {
  columns: (c, p = {}) => [band(c, [grid(4, [stack([logo(c, { color: "token:on-primary" }), P(p.about || c.contact.tagline || "", { color: "token:on-primary", opacity: 0.8, fontSize: "15px" })], { gap: "12px" }), ...(p.cols || []).slice(0, 2).map((col) => stack([H(col[0], "4", { fontSize: "15px", color: "token:on-primary", textTransform: "uppercase", letterSpacing: "0.1em" }), el("list", { items: col.slice(1) }, null, [{ color: "token:on-primary", opacity: 0.85, fontSize: "15px" }])], { gap: "10px" })), stack([H("Contact", "4", { fontSize: "15px", color: "token:on-primary", textTransform: "uppercase", letterSpacing: "0.1em" }), P([c.contact.address, c.contact.phone, c.contact.email].filter(Boolean).join("<br>") || "—", { color: "token:on-primary", opacity: 0.85, fontSize: "15px" }), social(c)], { gap: "10px" })]), rule({ borderColor: "#ffffff33" }), el("copyright", { owner: c.brand, text: "Tous droits réservés. Site de démonstration." }, null, [{ color: "token:on-primary", opacity: 0.7, fontSize: "14px" }])], { bg: "token:secondary", padY: 64, color: "token:on-primary" })],
  simple: (c) => [band(c, [group([logo(c), nav(c, {})], { justifyContent: "space-between" }), rule(), group([el("copyright", { owner: c.brand, text: "Tous droits réservés. Site de démonstration." }, null, [{ color: "token:muted", fontSize: "14px" }]), social(c)], { justifyContent: "space-between" })], { padY: 44, bg: "token:surface", gap: 20 })],
  center: (c, p = {}) => [band(c, [logo(c, { textAlign: "center", fontSize: "26px" }), group([nav(c, {})], { justifyContent: "center" }), social(c, { textAlign: "center" }), el("copyright", { owner: c.brand, text: "Tous droits réservés. Site de démonstration." }, null, [{ textAlign: "center", color: "token:muted", fontSize: "14px" }])], { padY: 56, bg: "token:background", align: "center", gap: 18, extra: { textAlign: "center" } })],
  big: (c, p = {}) => [band(c, [H(p.title || c.brand, "2", { fontSize: "96px", fontWeight: "800", letterSpacing: "-0.04em", color: "token:on-primary", lineHeight: 1 }, { fontSize: "64px" }, { fontSize: "42px" }), group([nav(c, {}), social(c)], { justifyContent: "space-between" }), el("copyright", { owner: c.brand, text: "Tous droits réservés. Site de démonstration." }, null, [{ color: "token:on-primary", opacity: 0.7, fontSize: "14px" }])], { bg: "token:primary", padY: 72, color: "token:on-primary", gap: 28 })],
  newsletter: (c, p = {}) => [band(c, [cols(compact([H(p.title || "Restez informé", "3", { fontSize: "28px", color: "token:on-primary" }), P(p.sub || "", { color: "token:on-primary", opacity: 0.85 })]), [group([BTN(p.button || "Nous écrire", "/contact", "primary", { backgroundColor: "token:accent", color: "token:on-accent" }, { size: "lg" })], { justifyContent: "flex-end" })], [1, 1]), rule({ borderColor: "#ffffff33" }), group([el("copyright", { owner: c.brand, text: "Tous droits réservés. Site de démonstration." }, null, [{ color: "token:on-primary", opacity: 0.7, fontSize: "14px" }]), nav(c, {})], { justifyContent: "space-between" })], { bg: "token:secondary", color: "token:on-primary", padY: 64, gap: 28 })],
  line: (c) => [band(c, [group([el("copyright", { owner: c.brand, text: "Tous droits réservés. Site de démonstration." }, null, [{ color: "token:muted", fontSize: "14px" }]), nav(c, {})], { justifyContent: "space-between" })], { padY: 26, bg: "token:background", gap: 0, extra: { borderTopWidth: "1px", borderStyle: "solid", borderColor: LINE } })],
};

// ---------- pages éditoriales et dynamiques ----------
const MISC = {
  text: (c, p) => [band(c, [...sectionTitle(c, p), ...(p.paras || []).map((x) => P(x, { fontSize: "19px", lineHeight: 1.7 }))], { maxWidth: "820px", bg: p.bg })],
  story: (c, p) => [band(c, [cols(compact([...sectionTitle(c, p), ...(p.paras || []).map((x) => P(x, { fontSize: "18px", color: "token:muted" }))]), [IMG(c.art(p.image || "portrait-1"), p.title, { aspectRatio: "3/4", objectFit: "cover", borderRadius: c.radius })], [3, 2], { alignItems: "flex-start" })], { bg: p.bg })],
  pagehead: (c, p) => [band(c, [el("breadcrumb", { items: [{ label: "Accueil", url: "/" }, { label: p.title }], separator: "chevron" }), H(p.title, "1", { fontSize: px(Math.round(c.h1 * 0.85)), letterSpacing: "-0.02em", ...center(c) }, { fontSize: px(Math.round(c.h1t * 0.85)) }, { fontSize: px(Math.round(c.h1m * 0.9)) }), p.sub ? P(p.sub, { fontSize: "20px", color: "token:muted", maxWidth: "680px", ...(c.center ? { textAlign: "center", marginLeft: "auto", marginRight: "auto" } : {}) }) : null], { padY: Math.round(c.pad * 0.8), bg: p.bg || "token:surface", border: LINE })],
  posts: (c, p) => [band(c, [...sectionTitle(c, { ...p, title: p.title || "Actualités" }), el("posts", { count: p.count || 6, layout: p.layout || "grid", showExcerpt: true, showDate: true, showImage: true, empty: "Les articles publiés apparaîtront ici." })], { bg: p.bg })],
  courses: (c, p) => [band(c, [...sectionTitle(c, { ...p, title: p.title || "Nos formations" }), el("courselist", { count: p.count || 3, sort: "recent", showPrice: true, cta: "Découvrir", empty: "Les formations publiées apparaîtront ici." })], { bg: p.bg })],
  search: (c, p) => [band(c, [...sectionTitle(c, { ...p, title: p.title || "Rechercher" }), el("search", { placeholder: "Rechercher sur le site…" })], { bg: p.bg, maxWidth: "720px" })],
  notfound: (c, p) => [band(c, [H("404", "1", { fontSize: "120px", fontWeight: "800", textAlign: "center", color: "token:primary", lineHeight: 1 }), H(p.title || "Cette page est introuvable", "2", { fontSize: "34px", textAlign: "center" }), P(p.sub || "L'adresse a peut-être changé. Retournez à l'accueil ou lancez une recherche.", { textAlign: "center", color: "token:muted" }), group([BTN("Retour à l'accueil", "/", "primary")], { justifyContent: "center" })], { padY: 120, align: "center" })],
  hours: (c, p) => [band(c, [...sectionTitle(c, p), el("table", { header: true, rows: p.rows })], { maxWidth: "720px", bg: p.bg })],
  quote: (c, p) => [band(c, [el("text", { html: `<p>« ${esc(p.text)} »</p>` }, null, [{ fontSize: "30px", lineHeight: 1.35, fontStyle: "italic", textAlign: "center", maxWidth: "820px", marginLeft: "auto", marginRight: "auto" }]), P(p.by || "", { textAlign: "center", color: "token:muted" })], { bg: p.bg || "token:background", align: "center" })],
  marquee: (c, p) => [band(c, [group(items(p).map((t) => P(t, { fontSize: "15px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase" })), { justifyContent: "space-around", gap: "24px" })], { padY: 20, bg: "token:accent", color: "token:on-accent", gap: 0 })],
  empty: (c, p) => [band(c, [ICON(p.icon || "search", "48", { color: "token:muted", textAlign: "center" }), H(p.title || "Aucun résultat", "3", { textAlign: "center" }), P(p.sub || "Essayez avec d'autres mots, ou parcourez les rubriques du site.", { textAlign: "center", color: "token:muted" })], { padY: 72, align: "center" })],
};


// ---------- variantes complémentaires (secteurs : boutique, immobilier, restaurant, événement, formation) ----------
Object.assign(HEROES, {
  collage: (c, p) => [band(c, [cols(heroText(c, p), [grid(2, [IMG(c.art("square-1"), p.alt || p.title, { aspectRatio: "1/1", objectFit: "cover", borderRadius: c.radius }), IMG(c.art("square-2"), p.alt || p.title, { aspectRatio: "1/1", objectFit: "cover", borderRadius: c.radius, marginTop: "36px" }), IMG(c.art("square-3"), p.alt || p.title, { aspectRatio: "1/1", objectFit: "cover", borderRadius: c.radius, marginTop: "-36px" }), IMG(c.art("square-4"), p.alt || p.title, { aspectRatio: "1/1", objectFit: "cover", borderRadius: c.radius })], { gap: "14px" })], [1, 1])], { padY: c.pad })],
  minimal: (c, p) => [band(c, [rule({ borderWidth: "2px", width: "72px" }), ...heroText(c, p)], { padY: c.pad + 24, maxWidth: "980px", gap: 26 })],
  search: (c, p) => [band(c, [stack(compact([...heroText(c, p, "#ffffff"), el("search", { placeholder: p.placeholder || "Rechercher…" }, null, [{ maxWidth: "560px", ...(c.center ? { marginLeft: "auto", marginRight: "auto" } : {}) }])]), { maxWidth: "860px", gap: "22px", ...(c.center ? { alignItems: "center", marginLeft: "auto", marginRight: "auto" } : {}) })], { padY: c.pad + 40, image: c.art(p.image || "hero"), overlay: p.overlay || "#0000006b", minHeight: "560px", color: "#ffffff" })],
  countdown: (c, p) => [band(c, [stack(compact([...heroText(c, p, "token:on-primary"), el("countdown", { until: p.until || "2030-06-01T18:00:00+02:00", endText: "L'événement a commencé." }, null, [{ ...(c.center ? { alignSelf: "center" } : {}) }])]), { maxWidth: "820px", gap: "22px", ...(c.center ? { alignItems: "center", marginLeft: "auto", marginRight: "auto" } : {}) })], { padY: c.pad + 32, gradient: { from: "token:secondary", to: "token:primary", angle: 160 }, minHeight: "560px" })],
});
Object.assign(FEATS, {
  "grid-icons": (c, p) => [band(c, [...sectionTitle(c, p), grid(Math.min(4, items(p).length), items(p).map((it) => stack([ICON(it.icon || "star", "36", { color: "token:primary" }), H(it.t, "3", { fontSize: "19px" }), P(it.x, { color: "token:muted", fontSize: "15px" })], { gap: "10px" })), { gap: "36px" })], { bg: p.bg })],
  compare: (c, p) => [band(c, [...sectionTitle(c, p), el("table", { header: true, striped: true, rows: p.rows })], { bg: p.bg, maxWidth: "980px" })],
  list2: (c, p) => [band(c, [...sectionTitle(c, p), cols([el("iconlist", { items: items(p).slice(0, Math.ceil(items(p).length / 2)).map((it) => ({ text: it.t, icon: it.icon || "check" })), iconColor: "token:primary" })], [el("iconlist", { items: items(p).slice(Math.ceil(items(p).length / 2)).map((it) => ({ text: it.t, icon: it.icon || "check" })), iconColor: "token:primary" })], [1, 1])], { bg: p.bg })],
});
Object.assign(GAL, {
  featured: (c, p) => { const [a, ...rest] = items(p); return [band(c, [...sectionTitle(c, p), cols([IMG(c.art("card-1"), a.t, { aspectRatio: "3/4", objectFit: "cover", borderRadius: c.radius })], [stack(rest.slice(0, 3).map((it, i) => stack([IMG(c.art(`card-${i + 2}`), it.t, { aspectRatio: "16/9", objectFit: "cover", borderRadius: c.radius }), H(it.t, "4", { fontSize: "17px" })], { gap: "8px" })), { gap: "18px" })], [3, 2], { alignItems: "flex-start" })], { bg: p.bg })]; },
  strip: (c, p) => [band(c, [P(p.title || "", { textAlign: "center", fontSize: "13px", letterSpacing: "0.16em", textTransform: "uppercase", color: "token:muted" }), grid(5, items(p).slice(0, 5).map((it, i) => IMG(c.art(`square-${i + 3}`), it.t, { aspectRatio: "1/1", objectFit: "cover", borderRadius: c.radius })), { gap: "10px" }, { columns: 3 }, { columns: 2 })], { bg: p.bg, padY: 56 })],
  listings: (c, p) => [band(c, [...sectionTitle(c, p), grid(3, items(p).map((it, i) => stack([IMG(c.art(`card-${i + 1}`), it.t, { aspectRatio: "4/3", objectFit: "cover", borderRadius: c.radius }), group([BADGE(it.tag || "À vendre"), P(it.price || "", { fontWeight: "800", fontSize: "20px", color: "token:primary" })], { justifyContent: "space-between" }), H(it.t, "3", { fontSize: "20px" }), P(it.x || "", { color: "token:muted", fontSize: "15px" })], { gap: "10px" })))], { bg: p.bg })],
  coursecards: (c, p) => [band(c, [...sectionTitle(c, p), grid(3, items(p).map((it, i) => cardBox(c, [IMG(c.art(`card-${i + 1}`), it.t, { aspectRatio: "16/9", objectFit: "cover", borderRadius: c.radius }), group([BADGE(it.tag || "Débutant", "neutral"), P(it.price || "", { fontWeight: "800", color: "token:primary" })], { justifyContent: "space-between" }), H(it.t, "3", { fontSize: "20px" }), P(it.x || "", { color: "token:muted", fontSize: "15px" }), BTN(it.cta || "Voir la formation", it.url || "/contact", "outline")], { gap: "12px", paddingTop: "16px", paddingBottom: "22px", paddingLeft: "16px", paddingRight: "16px" })))], { bg: p.bg })],
});
Object.assign(MISC, {
  product: (c, p) => [band(c, [cols([IMG(c.art("square-1"), p.title, { aspectRatio: "1/1", objectFit: "cover", borderRadius: c.radius }), grid(3, [2, 3, 4].map((n) => IMG(c.art(`square-${n}`), p.title, { aspectRatio: "1/1", objectFit: "cover", borderRadius: c.radius })), { gap: "10px" })].slice(0, 1), compact([eyebrow(c, p.eyebrow), H(p.title, "1", { fontSize: "40px", letterSpacing: "-0.01em" }), P(p.price || "", { fontSize: "28px", fontWeight: "800", color: "token:primary" }), P(p.text || "", { fontSize: "18px", color: "token:muted" }), el("iconlist", { items: (p.points || []).map((x) => ({ text: x, icon: "check" })), iconColor: "token:primary" }), group([BTN(p.cta || "Commander", p.url || "/contact", "primary", {}, { size: "lg" }), BTN(p.cta2 || "Poser une question", "/contact", "outline", {}, { size: "lg" })]), p.note ? P(p.note, { fontSize: "13px", color: "token:muted" }) : null]), [1, 1], { alignItems: "flex-start" })], { bg: p.bg })],
  article: (c, p) => [band(c, [BADGE(p.tag || "Article"), H(p.title, "1", { fontSize: px(Math.round(c.h1 * 0.8)), letterSpacing: "-0.02em" }, { fontSize: px(Math.round(c.h1t * 0.8)) }, { fontSize: px(Math.round(c.h1m * 0.9)) }), P(p.meta || "", { color: "token:muted", fontSize: "14px" }), IMG(c.art("wide"), p.title, { aspectRatio: "21/9", objectFit: "cover", borderRadius: c.radius }), ...(p.paras || []).map((x, i) => P(x, { fontSize: "19px", lineHeight: 1.75 }, undefined, undefined)), el("quote", { text: p.quote || "", author: p.by || "" }, null, [{ fontSize: "24px" }])].filter((n) => !(n.type === "quote" && !n.props.text)), { maxWidth: "820px", bg: p.bg, gap: 22 })],
  menu: (c, p) => [band(c, [...sectionTitle(c, p), cols([stack(compact([H(p.left[0], "3", { fontSize: "26px" }), el("pricelist", { items: p.left[1].map((it) => ({ title: it.t, price: it.price || "", description: it.x || "" })) })]), { gap: "14px" })], [stack(compact([H(p.right[0], "3", { fontSize: "26px" }), el("pricelist", { items: p.right[1].map((it) => ({ title: it.t, price: it.price || "", description: it.x || "" })) })]), { gap: "14px" })], [1, 1], { alignItems: "flex-start" })], { bg: p.bg })],
  schedule: (c, p) => [band(c, [...sectionTitle(c, p), el("timeline", { items: items(p).map((it) => ({ date: it.d || "", title: it.t, text: it.x || "" })) })], { bg: p.bg, maxWidth: "860px" })],
  faq: (c, p) => [band(c, [...sectionTitle(c, { ...p, title: p.title || "Questions fréquentes" }), el("accordion", { items: items(p).map((it) => ({ q: it.t, a: it.x })) })], { bg: p.bg, maxWidth: "860px" })],
  tiers: (c, p) => PRICING.tiers(c, p),
});

const BLOCKS = {};
const register = (prefix, table) => { for (const [k, fn] of Object.entries(table)) BLOCKS[`${prefix}:${k}`] = fn; };
register("head", HEADS); register("hero", HEROES); register("feat", FEATS); register("proof", PROOF); register("gal", GAL);
register("price", PRICING); register("cta", CTAS); register("contact", CONTACT); register("foot", FOOT); register("misc", MISC);

// Une page = suite de blocs [variante, paramètres] → sections libres
function buildPage(c, blocks) {
  const out = [];
  for (const b of blocks) {
    const [name, params = {}] = Array.isArray(b) ? b : [b];
    const fn = BLOCKS[name];
    if (!fn) throw new Error(`Variante inconnue : ${name}`);
    out.push(...fn(c, params));
  }
  // La colonne de page ajoute un retrait en haut et en bas (.lp-main) : la première et la dernière bande le reprennent pour toucher les bords
  const box = (sec) => (sec && sec.type === "layout" && sec.children && sec.children[0] && sec.children[0].styles) || null;
  const first = box(out[0]), last = box(out[out.length - 1]);
  if (first) { first.desktop.marginTop = "-32px"; first.mobile = { ...(first.mobile || {}), marginTop: "-20px" }; }
  if (last) { last.desktop.marginBottom = "-48px"; last.mobile = { ...(last.mobile || {}), marginBottom: "-48px" }; }
  return out;
}

module.exports = { makeContext, buildPage, BLOCKS, el, S };
