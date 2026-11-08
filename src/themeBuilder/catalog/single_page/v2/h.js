// Aides de la bibliothèque « Page individuelle » v2 : 100 concepts écrits un par un, chacun avec SA PROPRE identité graphique en valeurs FIXES
// (couleurs en hexadécimal, polices de la bibliothèque locale « font.<id> », rayons, boutons) : jamais les jetons ni la charte du site, jamais ceux de l'administration.
// Règles : un seul {{post.title}} en H1, un seul postcontent (le contenu propre de la page vient s'y placer), aucun élément d'article, aucune donnée inventée
// (prix, noms, citations, adresses, dates = consignes entre crochets), aucun positionnement absolu, aucune image factice.
const TITLE = "{{post.title}}";
const PRESET = {
  light: { radius: "10px", btnRadius: "8px", shadow: "none", weight: "700", caps: "none", track: "0px", bw: "1px", pad: "16px", gap: "24px", btn: "solid", rule: "single" },
  brand: { radius: "14px", btnRadius: "999px", shadow: "md", weight: "800", caps: "none", track: "0px", bw: "0px", pad: "18px", gap: "28px", btn: "solid", rule: "none" },
  dark: { radius: "12px", btnRadius: "10px", shadow: "lg", weight: "700", caps: "none", track: "0px", bw: "1px", pad: "16px", gap: "24px", btn: "outline", rule: "single" },
  edit: { radius: "0px", btnRadius: "0px", shadow: "none", weight: "700", caps: "uppercase", track: "1.5px", bw: "2px", pad: "20px", gap: "32px", btn: "solid", rule: "double" },
  soft: { radius: "28px", btnRadius: "999px", shadow: "md", weight: "600", caps: "none", track: "0px", bw: "0px", pad: "24px", gap: "20px", btn: "solid", rule: "none" },
};
// Identité d'un modèle : [clé, libellé, ambiance, fond, texte, discret, alterné, accent, texte sur accent, filet, police du texte, police des titres, surcharges]
const ID = ([key, label, mood, bg, fg, mute, alt, accent, onAccent, line, font, head, over]) => ({ key, label, bg, fg, mute, alt, accent, onAccent, line, ink: fg, onInk: bg, ...PRESET[mood], font, head, mood, ...(over || {}) });
// Portée de l'identité : les variables --kw-* (celles que lisent TOUS les composants : icônes, minuteries, cartes, boutons…) sont redéfinies sur la racine de chaque section du modèle avec les valeurs FIXES de son identité.
// Le site n'est donc jamais lu à l'intérieur du modèle. Pour le laisser suivre la charte du site, il suffit de retirer ce CSS de portée (réglage « CSS » de la racine) ; l'identité reste décrite dans le catalogue.
const { stackOf } = require("../../../../utils/fontLibrary");
const scopeCss = (S) => [
  `--kw-primary:${S.accent}`, `--lp-accent:${S.accent}`, `--lp-on-accent:${S.onAccent}`, `--lp-text:${S.fg}`, `--lp-bg:${S.bg}`, `--lp-div:${S.line}`, `--kw-secondary:${S.fg}`, `--kw-accent:${S.accent}`, `--kw-background:${S.bg}`, `--kw-surface:${S.alt}`, `--kw-text:${S.fg}`, `--kw-muted:${S.mute}`,
  "--kw-success:#15803d", "--kw-warning:#a16207", "--kw-error:#b91c1c", `--kw-on-primary:${S.onAccent}`, `--kw-on-accent:${S.onAccent}`,
  `--kw-font-heading:${stackOf(S.head)}`, `--kw-font-body:${stackOf(S.font)}`, `--kw-font-button:${stackOf(S.font)}`, `--kw-font-link:${stackOf(S.font)}`,
  `--kw-radius-button:${S.btnRadius}`, `--kw-radius-card:${S.radius}`, `--kw-radius-field:${S.btnRadius}`, `--kw-radius-md:${S.radius}`, `--kw-radius-lg:${S.radius}`,
  `--kw-border:${S.bw === "0px" ? "0px" : S.bw} solid ${S.line}`,
].join(";");
const scoped = (k, node) => { node.css = scopeCss(k.S); return node; };
// Couleurs dérivées d'une direction artistique (fond, texte, accent) : texte discret, fond alterné, filet, texte sur accent ; l'accent est rapproché du texte jusqu'à rester visible sur le fond
const hx = (n) => `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return hx(((x[0] + (y[0] - x[0]) * t) << 16) | ((x[1] + (y[1] - x[1]) * t) << 8) | (x[2] + (y[2] - x[2]) * t)); };
const lum = (h) => { const c = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const MOOD = { L: "light", D: "dark", B: "brand", E: "edit", S: "soft" };
const ID2 = ([n, , m, label, bg0, fg0, ac0, head, font]) => {
  // fond et texte : si même le noir ou le blanc purs n'atteignent pas 7:1 sur ce fond intermédiaire, le fond est éclairci ou assombri jusqu'au contraste voulu
  let bg = bg0, fg = fg0, t = 0; const dark = lum(bg) <= 0.18 || (lum(bg) < 0.3 && ratio("#ffffff", bg) >= ratio("#000000", bg));
  while (ratio(fg, bg) < 7.2 && t < 1) { t += 0.1; fg = mix(fg0, dark ? "#ffffff" : "#000000", t); }
  t = 0; while (ratio(fg, bg) < 7.2 && t < 1) { t += 0.05; bg = mix(bg0, dark ? "#000000" : "#ffffff", t); }
  let mute = mix(fg, bg, 0.28); t = 0.28; while (ratio(mute, bg) < 4.6 && t > 0) { t -= 0.04; mute = mix(fg, bg, Math.max(t, 0)); }
  const alt = mix(bg, fg, 0.07), line = mix(bg, fg, 0.18);
  let accent = ac0; t = 0; while (ratio(accent, bg) < 3.2 && ratio(accent, alt) < 3.2 && t < 1) { t += 0.1; accent = mix(ac0, fg, t); }
  const onAccent = ratio("#ffffff", accent) >= ratio("#111111", accent) ? "#ffffff" : "#111111";
  let acc2 = accent; t = 0; while (ratio(onAccent, acc2) < 4.6 && t < 1) { t += 0.1; acc2 = mix(accent, onAccent === "#ffffff" ? "#000000" : "#ffffff", t); }
  return ID([`c${n}`, label, MOOD[m], bg, fg, mute, alt, acc2, onAccent, line, font, head]);
};
const DIR = require("./directions");
const dir = (n) => ID2(DIR.find((r) => r[0] === n));
const L = (skin, key, label, tags, desc, build) => ({ key, label, tags, desc, skin: skin.key, skinDef: skin, build });
const p = (t) => `<p>${t}</p>`;
const NARROW = (max) => ({ maxWidth: max, marginLeft: "auto", marginRight: "auto", width: "100%" });
const SOC = [{ network: "facebook", url: "https://www.facebook.com/" }, { network: "linkedin", url: "https://www.linkedin.com/" }];
const px = (n) => `${n}px`;
// Tout élément porte la police et la couleur de l'identité du modèle (jamais celles du site) ; les widgets composés reçoivent aussi leurs couleurs d'accent
const own = (k, st = {}) => ({ color: k.S.fg, fontFamily: k.S.font, ...st });
const W = (k, type, props = {}, st = {}, t, m) => k.W(type, props, own(k, st), t, m);
const H1 = (k, size, st = {}) => k.H(TITLE, "1", { fontSize: px(size), lineHeight: 1.1, fontFamily: k.S.head, ...st }, { fontSize: px(Math.round(size * 0.78)) }, { fontSize: px(Math.max(28, Math.round(size * 0.58))) });
const content = (k, st = {}) => W(k, "postcontent", {}, st);
const desc = (k, st = {}) => k.dyn("post.excerpt", { fontSize: "19px", color: k.S.mute, ...st });
const sect = (k, kids, max = "1100px", st = {}) => scoped(k, k.section(kids, { ...NARROW(max), fontFamily: k.S.font, ...st }));
const band = (k, kids, st = {}) => scoped(k, k.band([k.inner(kids, { justifyContent: "center" })], { fontFamily: k.S.font, ...st }));
const head = (k, t, sub) => [k.H(t, "2", { fontFamily: k.S.head }), ...(sub ? [k.T(p(sub), { color: k.S.mute })] : [])];
const box = (k, icon, title, text) => W(k, "iconbox", { icon, title, text: p(text), titleLevel: "3", position: "top", size: "32" });
const boxes = (k, n, rows) => k.grid(n, rows.map(([i, t, x]) => box(k, i, t, x)));
const cards = (k, n, rows) => k.grid(n, rows.map(([i, t, x]) => k.card([box(k, i, t, x)])));
const steps = (k, rows) => W(k, "timeline", { items: rows.map(([d, t, x]) => ({ date: d, title: t, text: p(x) })) });
const faq = (k, n = 4) => W(k, "accordion", { items: Array.from({ length: n }, (_, i) => ({ q: `[Question ${i + 1} : écrivez-la comme votre public la formule]`, a: "[Rédigez la réponse : elle doit venir de vous, avec vos propres mots.]" })) });
const tabs = (k, titles) => W(k, "tabs", { items: titles.map((t) => ({ title: t, text: p("[Décrivez ce point en deux ou trois phrases.]") })) });
const person = (k, role) => W(k, "profilecard", { name: "[Nom et prénom]", role, bio: "[Deux phrases de présentation, rédigées avec la personne.]", align: "center" });
const plan = (k, name, hl) => W(k, "pricing", { title: name, price: "[Prix à renseigner]", period: "[période]", description: "[À qui s'adresse cette offre]", features: ["[Avantage 1]", "[Avantage 2]", "[Avantage 3]"], buttonLabel: "Choisir", link: "/contact", highlighted: Boolean(hl) });
const quote = (k) => W(k, "testimonial", { text: "[Citation réelle d'une personne, publiée avec son accord.]", name: "[Nom de la personne]", role: "[Fonction, organisation]" });
const note = (k, tone, title, text) => W(k, "alert", { tone, title, text });
const toc = (k, st = {}) => W(k, "toc", { title: "Sur cette page", depth: "3", numbered: true }, st);
const contactCard = (k, title) => k.card([k.H(title, "3", { fontFamily: k.S.head }), k.T(p("[Indiquez vos horaires et la manière de vous joindre.]"), { color: k.S.mute }), k.B("Écrire un message", "/contact"), k.row([k.social(SOC)])]);
const map = (k, h = 320) => W(k, "map", { address: "[Adresse ou lieu à renseigner]", zoom: 14, height: h, title: "Plan d'accès" });
// formulaire RÉEL du site s'il existe ; sinon un encart de contact (aucune fausse saisie)
const form = (k, env, heading, intro, button) => (env && env.formId ? W(k, "signupform", { formId: env.formId, heading, intro, button }, { width: "100%" }) : contactCard(k, heading));
const cta = (k, title, text, label = "Nous écrire") => W(k, "cta", { skin: "classic", title, titleTag: "h2", text: `[${text}]`, buttonLabel: label, link: "/contact", align: "center" });
const counter = (k, label) => W(k, "counter", { value: 0, label: `[${label}]`, suffix: "", prefix: "", duration: 1500 });
// Emplacement de visuel : une carte à hauteur réservée dont la consigne dit quoi y placer ; l'auteur la remplace par son image, sa galerie ou sa vidéo (aucune image factice n'est jamais fournie)
const slot = (k, label = "Visuel", height = 220) => k.card([k.T(p(`[${label} : remplacez cette zone par votre contenu]`), { color: k.S.mute, textAlign: "center" })], { minHeight: `${height}px`, justifyContent: "center", alignItems: "center", width: "100%" });
const marquee = (k, words) => W(k, "marquee", { items: words.map((text) => ({ text })), speed: "normal", direction: "left", separator: "•", pauseHover: true, label: "Informations défilantes" });
module.exports = { slot, dir, ID2, scopeCss, scoped, ID, L, W, TITLE, p, NARROW, SOC, px, own, H1, content, desc, sect, band, head, box, boxes, cards, steps, faq, tabs, person, plan, quote, note, toc, contactCard, map, form, cta, counter, marquee };
