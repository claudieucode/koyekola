// Chantier F : le catalogue des 100 pieds de page utilise les widgets « Pied de page » (données d'entreprise) au lieu de textes figés.
// Partie 1 (sans serveur) : chaque modèle se construit, passe la grammaire, s'insère, rend VIDE de données d'entreprise sans trou ni fausse donnée, et rend les vraies données quand elles existent ;
//   aucun lien mort ; contraste WCAG AA CALCULÉ (texte, survol, focus) ; états survol/focus définis ; zones cliquables de 44 px sur mobile ; aucune colonne ni rangée faite uniquement de widgets de données.
// Partie 2 (serveur réel) : aperçu et vignette = même document, un seul <footer> à la publication, avec et sans données d'entreprise, et sans script dans l'aperçu de la bibliothèque.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ejs = require("ejs");
const http = require("node:http");
const { freshMarketing, TEST_KEY } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const landing = require("../src/marketing/landing");
const business = require("../src/marketing/pages/business");
const Catalog = require("../src/themeBuilder/catalog");
const { useTemplate } = require("../src/themeBuilder/catalog/use");
const Kit = require("../src/themeBuilder/catalog/footer/kit-conception");
const Footer = require("../src/themeBuilder/catalog/footer");
const { icon } = require("../src/utils/icons");
const { startServer, loginInstructor } = require("./helpers");

const all = Catalog.entries("footer");
const walk = (nodes, fn, parents = []) => { for (const n of nodes || []) { fn(n, parents); if (n && n.children) walk(n.children, fn, [...parents, n]); } };
const section = (key) => Catalog.build("footer", key).section;
const typesOf = (key) => { const o = []; walk(section(key).children, (n) => o.push(n.type)); return o; };
const DATA = ["bizcontact", "bizphone", "bizemail", "bizhours", "bizlegal", "bizpayments", "bizdelivery", "bizfields"];
const FIXED_ROUTES = ["/contact", "/cookies", "/faq", "/connexion", "/inscription", "/catalogue", "/boutique", "/blog"];

// Données d'entreprise complètes (aucune relation avec un vrai site)
const PROFILE = {
  legalName: "Atelier Soleil", address: { street: "12 rue des Lilas", postalCode: "75011", city: "Paris", country: "France" },
  phones: [{ label: "Boutique", number: "+33 1 23 45 67 89" }], email: "contact@atelier-soleil.fr",
  hours: { days: { tue: { ranges: [{ open: "09:00", close: "18:00" }] }, wed: { ranges: [{ open: "09:00", close: "18:00" }] } }, exceptions: [], note: "" },
  legal: { form: "SARL", capital: "10 000 €", registrations: [{ label: "SIRET", value: "123 456 789 00012" }] },
  legalPages: { notice: "/mentions-legales", privacy: "/confidentialite", terms: "/cgv" },
  payments: ["card", "transfer"], delivery: { text: "Livraison sous 3 jours.", returns: "Retours sous 14 jours." },
};

// ── Calcul WCAG ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const hex = (h) => { let x = String(h).slice(1); if (x.length === 3) x = x.split("").map((c) => c + c).join(""); const n = [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)); return { r: n[0], g: n[1], b: n[2], a: x.length === 8 ? parseInt(x.slice(6, 8), 16) / 255 : 1 }; };
const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const isHex = (c) => typeof c === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c);
const TEXTUAL = new Set(["text", "heading", "link", "button", "copyright", "menu", "iconlist", "dyntext", "minicart", "toggle", "account", "bizcontact", "bizhours", "bizlegal", "bizpayments", "bizdelivery", "bizphone", "bizemail", "bizfields", "backtotop", "signupform", "sitetitle"]);
// Parcourt un pied et renvoie les mesures { key, type, kind, ratio } : texte normal, survol et focus (4,5:1 exigé partout, y compris pour les gros textes)
function contrastReport(doc) {
  const out = [];
  const go = (n, bg, col, parentBg = bg) => {
    const d = (n.styles && n.styles.desktop) || {};
    if (isHex(d.backgroundColor)) bg = over(hex(d.backgroundColor), bg);
    if (isHex(d.color)) col = hex(d.color);
    const here = { bg, col };
    if (TEXTUAL.has(n.type) && col) out.push({ type: n.type, kind: "texte", ratio: ratio(over(col, bg), bg), fg: d.color, bg: d.backgroundColor });
    const hv = n.states && n.states.hover;
    if (hv && (hv.color || hv.backgroundColor)) {
      const hbg = isHex(hv.backgroundColor) ? over(hex(hv.backgroundColor), bg) : bg, hfg = isHex(hv.color) ? hex(hv.color) : col;
      if (hfg) out.push({ type: n.type, kind: "survol", ratio: ratio(over(hfg, hbg), hbg) });
    }
    const pl = n.parts && n.parts.link && n.parts.link.states && n.parts.link.states.hover;
    if (pl && isHex(pl.color)) out.push({ type: n.type, kind: "survol (partie)", ratio: ratio(hex(pl.color), bg) });
    const fo = n.states && n.states.focus;
    if (fo && isHex(fo.outlineColor)) out.push({ type: n.type, kind: "focus", ratio: ratio(hex(fo.outlineColor), parentBg) }); // le contour est dessiné HORS du bouton : il se mesure sur le fond du parent
    for (const c of n.children || []) go(c, here.bg, here.col, here.bg);
  };
  go(doc, { r: 255, g: 255, b: 255, a: 1 }, null);
  return out;
}

// ── Rendu avec les vrais gabarits ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let m, A, SITE_EMPTY, SITE_FULL, seq = 0;
async function renderModel(key, siteId) {
  const doc = JSON.parse(JSON.stringify(section(key)));
  const p = pages.createPage(A, { name: `R ${++seq}`, kind: "page", site_id: siteId });
  const saved = pages.saveDraft(A, p.id, { sections: [doc] }, { revision: pages.getPage(A, p.id).revision }).content.sections;
  const vm = landing.viewModel(A, { id: p.id, slug: p.slug, site_id: siteId, sections: saved, title: "t", scope: { now: new Date("2026-11-10T08:00:00Z") } });
  let html = "";
  for (const n of vm.sections[0].children) html += await ejs.renderFile(path.join(__dirname, "../views/marketing-public/_node.ejs"), { n, isBuilder: false, href: (u) => u, depth: 0, icon, page: { slug: p.slug }, preview: false, asset: (x) => x, formToken: "t" });
  return { html, saved };
}

describe("Catalogue des pieds : widgets de données d'entreprise (sans serveur)", () => {
  before(() => {
    m = freshMarketing(); A = m.ctx(1);
    SITE_EMPTY = pages.createSite(A, { name: "Boulangerie vide" }).id;
    SITE_FULL = pages.createSite(A, { name: "Boulangerie pleine" }).id;
    business.save(m.db, 1, SITE_FULL, PROFILE);
  });

  test("le total réel est 100 nouveaux modèles listés en 15 familles ; identifiants ft-… uniques ; plus aucun ancien dans la liste (ils restent ouvrables par alias)", () => {
    assert.equal(all.length, 100);
    assert.equal(new Set(all.map((e) => e.key)).size, 100);
    assert.ok(all.every((e) => /^ft-/.test(e.key) && !e.legacy));
    assert.equal(Footer.families.length, 15);
    assert.equal(new Set(all.map((e) => e.layoutKey)).size, 15);
    assert.equal(Footer.layouts.length, 100);
    assert.equal(Footer.anciensListes, 0);
  });

  test("chaque modèle se construit, valide la grammaire du Page Builder, s'insère et garde ses états (survol, focus) après l'enregistrement", () => {
    const site = pages.createSite(A, { name: "Insertion" }).id;
    for (const e of all) {
      const doc = JSON.parse(JSON.stringify(section(e.key)));
      const c = pages.createComponent(A, { name: `F ${e.key}`, section: doc, siteId: site, kind: "standard" });
      const saved = pages.getComponent(A, c.id).section;
      let states = 0; walk(saved.children, (n) => { if (n.states && n.states.hover) states += 1; if (n.parts && ((n.parts.link && n.parts.link.states && n.parts.link.states.hover) || (n.parts.button && n.parts.button.states && n.parts.button.states.hover))) states += 1; });
      const wanted = typesOf(e.key).filter((t) => ["link", "button", "menu", "account", "minicart", "social", "bizcontact", "bizphone", "bizemail", "bizlegal", "backtotop"].includes(t)).length;
      assert.ok(states >= wanted, `${e.key} : états survol conservés ${states}/${wanted}`);
    }
    const u = useTemplate(A, site, "footer", all[7].key);
    assert.equal(u.type, "footer");
  });

  test("la bibliothèque utilise les widgets « Pied de page » (coordonnées, téléphone, e-mail, horaires, légal, paiements, livraison, retour en haut, copyright automatique) là où c'est pertinent", () => {
    const parFamille = (fam, type) => all.filter((e) => e.layoutKey === fam && typesOf(e.key).includes(type)).length;
    const total = (type) => all.filter((e) => typesOf(e.key).includes(type)).length;
    assert.ok(total("bizcontact") >= 30, `coordonnées : ${total("bizcontact")}`);
    assert.ok(total("bizhours") >= 20, `horaires : ${total("bizhours")}`);
    assert.ok(total("bizphone") >= 5 && total("bizemail") >= 5, "téléphone et e-mail cliquables");
    assert.ok(total("bizlegal") >= 80, `liens et informations légales : ${total("bizlegal")}`);
    assert.ok(total("backtotop") >= 30, `retour en haut : ${total("backtotop")}`);
    assert.ok(total("bizpayments") >= 5 && total("bizdelivery") >= 2, "paiements et livraison");
    assert.ok(parFamille("ecommerce", "bizpayments") >= 3, "e-commerce : paiements");
    assert.ok(parFamille("services", "bizcontact") >= 4 && parFamille("institutionnels", "bizcontact") >= 4, "services et institutionnels : coordonnées");
    assert.equal(total("copyright"), 100, "un copyright automatique dans CHAQUE modèle");
    // copyright automatique : le propriétaire vient de la raison sociale (vide = nom du site) ; jamais d'année écrite à la main
    for (const e of all) walk(section(e.key).children, (n) => { if (n.type === "copyright") { assert.equal(n.props.owner, "{{business.legalname}}", e.key); assert.ok(!/\b(19|20)\d\d\b/.test(n.props.text), `${e.key} : année figée`); } });
    // plus aucun faux texte de coordonnées
    for (const e of all) walk(section(e.key).children, (n) => assert.notEqual(n.type, "iconlist", `${e.key} : liste d'icônes figée`));
    assert.ok(!/Votre adresse(?! e-mail| sert)/.test(JSON.stringify(all.map((e) => section(e.key)))), "texte « Votre adresse… » figé (seuls le libellé de champ « Votre adresse e-mail » et la phrase « Votre adresse sert… » sont admis)");
  });

  test("aucune colonne ou zone d'une rangée en colonnes n'est faite UNIQUEMENT de widgets de données : un élément permanent (ou le titre d'un volet d'accordéon) évite tout trou quand le site n'a rien renseigné", () => {
    const feuilles = (n, o = []) => { if (!n.children || !n.children.length) o.push(n.type); else n.children.forEach((c) => feuilles(c, o)); return o; };
    for (const e of all) for (const bande of (section(e.key).children[0] || {}).children || []) {
      const inner = (bande.children || [])[0]; if (!inner) continue;
      const d = (inner.styles && inner.styles.desktop) || {};
      if (d.flexDirection === "column" || (inner.children || []).length < 2) continue; // pile centrée ou zone unique : un élément absent ne laisse aucun trou
      for (const col of inner.children || []) {
        if (col.name) continue; // volet d'accordéon : son titre est toujours affiché
        assert.ok(!feuilles(col).every((t) => DATA.includes(t)), `${e.key} : colonne faite seulement de ${[...new Set(feuilles(col))].join("/")}`);
      }
    }
  });

  test("SANS données d'entreprise : aucun widget de données n'écrit quoi que ce soit, aucun lien tel:/mailto:, copyright au nom du site, pas de bloc vide ni de texte d'aide", async () => {
    for (const e of all) {
      const { html } = await renderModel(e.key, SITE_EMPTY);
      const sansEtatHonnete = html.replace(/(kw-emailsub-missing[^>]*>\s*)<p class="kw-biz-title"/g, '$1<p class="titre"'); // la lettre d'information sans formulaire affiche son état honnête « non configuré » (voulu) : ce n'est pas une donnée d'entreprise
      assert.ok(!/kw-biz-/.test(sansEtatHonnete), `${e.key} : un widget de données affiche quelque chose sans donnée`);
      assert.ok(!/href="(tel|mailto):/.test(html), `${e.key} : lien tel:/mailto:`);
      assert.ok(!/class="[^"]*kw-bizlegal/.test(html) && !/class="[^"]*kw-bizcontact/.test(html), `${e.key} : enveloppe vide`);
      assert.match(html, /© 2026 Boulangerie vide\. Tous droits réservés\./, `${e.key} : copyright automatique`);
      assert.ok(!/\{\{|\}\}/.test(html), `${e.key} : étiquette non résolue`);
      assert.ok(!/Votre (adresse(?! e-mail| sert)|numéro)/.test(html), `${e.key} : faux texte`);
    }
  });

  test("AVEC les données d'entreprise : coordonnées cliquables, horaires, paiements, livraison, légal et copyright à la raison sociale, sans étiquette brute", async () => {
    for (const e of all) {
      const types = typesOf(e.key), { html } = await renderModel(e.key, SITE_FULL);
      assert.match(html, /© 2026 Atelier Soleil\. Tous droits réservés\./, `${e.key} : copyright`);
      assert.ok(!/\{\{|\}\}/.test(html), `${e.key} : étiquette non résolue`);
      if (types.includes("bizcontact")) { assert.match(html, /href="tel:\+33123456789"/, `${e.key} : téléphone`); assert.match(html, /href="mailto:contact@atelier-soleil\.fr"/, `${e.key} : e-mail`); assert.match(html, /12 rue des Lilas/, `${e.key} : adresse`); }
      if (types.includes("bizphone")) assert.match(html, /href="tel:\+33123456789"/, `${e.key} : téléphone seul`);
      if (types.includes("bizemail")) assert.match(html, /href="mailto:/, `${e.key} : e-mail seul`);
      if (types.includes("bizhours")) assert.match(html, /Horaires d(’|')ouverture|kw-biz-hours/, `${e.key} : horaires`);
      if (types.includes("bizpayments")) assert.match(html, /Carte bancaire/, `${e.key} : paiements`);
      if (types.includes("bizdelivery")) assert.match(html, /Livraison sous 3 jours/, `${e.key} : livraison`);
      let pagesLegales = false; walk(section(e.key).children, (n) => { if (n.type === "bizlegal" && n.props.showPages) pagesLegales = true; });
      if (pagesLegales) assert.match(html, /href="\/mentions-legales"/, `${e.key} : pages légales`);
      if (types.includes("backtotop")) assert.match(html, /href="#"[^>]*aria-label="Retour en haut"/, `${e.key} : retour en haut`);
    }
  });

  test("aucun lien mort : seules des pages de la plateforme existantes, des réseaux génériques, des tel:/mailto: construits par les widgets ; rien de vide, d'ancre fantôme ni de http://", () => {
    // chaque page de la liste existe vraiment dans les routes de la plateforme
    const routes = fs.readdirSync(path.join(__dirname, "../src/routes")).map((f) => fs.readFileSync(path.join(__dirname, "../src/routes", f), "utf8")).join("\n") + fs.readFileSync(path.join(__dirname, "../src/marketing/web/shopPublic.js"), "utf8").replace(/base = "\/boutique"|"\/boutique/g, '"/boutique"');
    for (const r of FIXED_ROUTES) assert.ok(routes.includes(`"${r}"`) || routes.includes(`"${r}/`) || routes.includes(`'${r}'`), `route ${r} introuvable dans src/routes`);
    for (const e of all) walk(section(e.key).children, (n) => {
      // adresses admises : pages réelles de la plateforme (Kit.LIENS_PLATEFORME), ancre « # », adresses d'EXEMPLE https://exemple.fr|org/… (marquées exemple dans le modèle), réseaux et boutiques d'applications en https
      if (n.type === "link" || n.type === "button") { assert.ok(Kit.LIENS_PLATEFORME.includes(n.props.url) || /^https:\/\/(exemple\.(fr|org)|[a-z0-9.-]+\.[a-z]{2,})\/[a-z0-9\-\/._]*$/.test(n.props.url) || n.props.url === "#" || /^(mailto:[^\s@]+@[^\s@]+\.[a-z]{2,}|tel:\+?[0-9 ]+)$/.test(n.props.url), `${e.key} : adresse « ${n.props.url} »`); assert.ok(n.props.label && n.props.label.trim().length >= 2, `${e.key} : lien sans libellé`); }
      if (n.type === "social") for (const it of n.props.items) assert.match(it.url, /^(https:\/\/[a-z0-9.-]+\.[a-z]{2,}\/[a-z0-9\-\/._@]*|mailto:[^\s@]+@[^\s@]+\.[a-z]{2,}|\/)$/, e.key);
    });
  });

  test("contraste WCAG AA CALCULÉ pour les 100 modèles (donc toutes les identités utilisées) : texte, survol et focus ≥ 4,5:1", () => {
    const skins = new Set(), fails = []; let measures = 0;
    for (const e of all) {
      skins.add(e.skinKey);
      for (const r of contrastReport(section(e.key))) { measures += 1; if (r.ratio < 4.5) fails.push(`${e.key} ${r.type} ${r.kind} ${r.ratio.toFixed(2)} (${r.fg || ""} sur ${r.bg || "fond"})`); }
    }
    assert.ok(skins.size >= 20, `identités mesurées : ${skins.size}`);
    assert.ok(measures > 800, `mesures : ${measures}`);
    assert.deepEqual(fails, [], `${fails.length} contraste(s) sous 4,5:1 : ${fails.slice(0, 8).join(" | ")}`);
  });

  test("identités : texte et texte secondaire sur le fond, texte sur le fond alterné, texte du bouton plein : ≥ 4,5:1 dans CHAQUE identité (le texte secondaire sur fond alterné est corrigé à la construction, mesuré dans le test précédent)", () => {
    const fails = [];
    for (const s of Footer.skins) {
      const bg = hex(s.bg), alt = over(hex(s.alt), bg);
      for (const [name, fg, back] of [["texte/fond", s.fg, bg], ["texte/alterné", s.fg, alt], ["secondaire/fond", s.mute, bg], ["bouton plein", s.onAccent, hex(s.accent)]]) {
        if (!isHex(fg)) continue;
        const r = ratio(over(hex(fg), back), back);
                if (r < 4.5) fails.push(`${s.key} ${name} ${r.toFixed(2)}`);
      }
    }
    assert.deepEqual(fails, [], fails.join(" | "));
  });

  test("zones cliquables de 44 px sur mobile : tout lien, bouton, menu, compte, panier, réseau, coordonnée cliquable et retour en haut porte un réglage mobile de 44 px", () => {
    for (const e of all) walk(section(e.key).children, (n) => {
      const mob = (n.styles && n.styles.mobile) || {}, link = n.parts && n.parts.link && n.parts.link.styles && n.parts.link.styles.mobile;
      if (["link", "button", "minicart"].includes(n.type)) assert.equal(mob.minHeight, "44px", `${e.key} : ${n.type}`);
      if (["menu", "account"].includes(n.type)) assert.equal(link.paddingTop, "12px", `${e.key} : ${n.type}`);
      if (n.type === "social") assert.ok(link.width === "44px" && link.height === "44px", `${e.key} : réseaux`);
      if (["bizcontact", "bizphone", "bizemail", "bizlegal"].includes(n.type)) assert.equal(link.paddingTop, "14px", `${e.key} : ${n.type}`);
      if (n.type === "backtotop") assert.equal(n.parts.button.styles.mobile.height, "44px", `${e.key} : retour en haut`);
      if (n.type === "sitetitle") assert.ok(Math.round(parseInt(n.styles.desktop.fontSize, 10) * 1.2) + 2 * parseInt((n.parts && n.parts.link && n.parts.link.styles && n.parts.link.styles.mobile && n.parts.link.styles.mobile.paddingTop) || "0", 10) >= 44, `${e.key} : titre du site`);
      if (n.type === "sitelogo") assert.ok(!(n.props.height < 44) || n.parts.image.styles.mobile.height === "44px", `${e.key} : logo`);
    });
  });

  test("états au survol et au focus : tout lien, bouton, menu et réseau en a ; le focus est un contour visible (jamais supprimé)", () => {
    for (const e of all) walk(section(e.key).children, (n) => {
      const st = n.states || (n.parts && ((n.parts.link && n.parts.link.states) || (n.parts.button && n.parts.button.states)));
      if (["link", "button", "menu", "account", "minicart", "social", "bizcontact", "bizphone", "bizemail", "bizlegal", "backtotop"].includes(n.type)) {
        assert.ok(st && st.hover && st.focus, `${e.key} : ${n.type} sans états`);
        assert.equal(st.focus.outlineStyle, "solid"); assert.ok(parseInt(st.focus.outlineWidth, 10) >= 2, "contour de focus trop fin");
      }
    });
  });

  test("ordre de tabulation logique : aucun tabindex positif ni élément retiré de la navigation au clavier ; l'ordre du document suit l'ordre visuel (pas de ‘order’ ni d'inversion de colonne)", () => {
    for (const e of all) walk(section(e.key).children, (n) => {
      const d = (n.styles && n.styles.desktop) || {};
      assert.equal(n.props && n.props.tabindex, undefined, e.key);
      assert.ok(d.order === undefined, `${e.key} : propriété order`);
      assert.ok(!/reverse/.test(String(d.flexDirection || "")), `${e.key} : inversion ${d.flexDirection}`);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const hostReq = (srv, host, p) => {
  const u = new URL(srv.base);
  return new Promise((resolve, reject) => {
    const r = http.request({ host: u.hostname, port: u.port, path: p, method: "GET", headers: { Host: host, "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" } }, (resp) => { let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text })); });
    r.on("error", reject); r.end();
  });
};
describe("Catalogue des pieds : aperçu, vignette et publication (serveur réel)", () => {
  let srv, boss, db, site, A2, B2;
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (p = "", s = site) => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (p, body) => boss.request(p, { method: "POST", json: body || {}, headers: ORIGIN() });
  const setDomain = async (s, url) => { const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${s}/reglages.json`)).text); return boss.request(`/marketing/site-web/sites/${s}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: ORIGIN() }); };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Catalogue F" })).location.match(/sites\/(\d+)/)[1]);
    await boss.post("/marketing/pages", { name: "Accueil", site_id: site, kind: "page" });
    const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    const mk = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
    A2 = mk("Site sans données", "sans-donnees"); B2 = mk("Site avec données", "avec-donnees");
    for (const [s, host] of [[A2, "https://sans.test"], [B2, "https://avec.test"]]) {
      const home = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind, indexable) VALUES (?, ?, ?, 'Accueil', 'published', ?, datetime('now'), 'page', 1)").run(org, `Accueil ${s}`, `accueil-${s}`, s).lastInsertRowid);
      db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(home, s);
      assert.equal((await setDomain(s, host)).status, 200);
    }
    business.save(db, org, B2, PROFILE);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("les 100 aperçus et vignettes : 200, un seul pied, copyright, AUCUN script dans la vignette (l'aperçu ne charge que landing.js), même document pour l'aperçu et la vignette", async () => {
    const shape = (h) => (h.match(/kw-(sitelogo|sitetitle|menu|search|account|minicart|button|link|social|copyright|map|signup|querylist|courselist|toggle|dyntext|bizcontact|bizhours|bizlegal|bizpayments|bizdelivery|bizphone|bizemail|backtotop)\b/g) || []).join(",");
    for (const e of all) {
      const a = await boss.get(U(`/api/bibliotheque/footer/${e.key}/apercu`)), v = await boss.get(U(`/api/bibliotheque/footer/${e.key}/vignette`));
      for (const [kind, r] of [["apercu", a], ["vignette", v]]) {
        assert.equal(r.status, 200, `${e.key} ${kind}`);
        // La vignette n'a AUCUN script ; l'aperçu complet charge seulement le script de la page (/js/landing.js : accordéons mobiles, comme sur un site publié)
        const scripts = r.text.match(/<script\b[^>]*>/gi) || [];
        if (kind === "vignette") assert.equal(scripts.length, 0, `${e.key} vignette : script`);
        else assert.ok(scripts.length === 1 && /src="[^"]*\/js\/landing\.js[^"]*"/.test(scripts[0]), `${e.key} apercu : seul /js/landing.js attendu, trouvé ${scripts.join(" ")}`);
        assert.equal((r.text.match(/kw-theme-footer\b/g) || []).length, 1, `${e.key} ${kind} : un seul pied`);
        assert.ok(!/kw-biz-/.test(r.text.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/(kw-emailsub-missing[^>]*>\s*)<p class="kw-biz-title"/g, '$1<p class="titre"')), `${e.key} ${kind} : donnée d'entreprise inventée dans l'aperçu`);
        assert.ok((r.text.match(/<footer\b/g) || []).length <= 1, `${e.key} ${kind} : plusieurs <footer>`);
        assert.match(r.text, /©/, `${e.key} ${kind}`);
      }
      assert.equal(shape(v.text), shape(a.text), `${e.key} : aperçu ≠ vignette`);
    }
  });

  test("« Utiliser ce modèle » : la copie contient les mêmes widgets que le modèle du catalogue, pour un échantillon de chaque famille", async () => {
    for (const fam of Footer.families) {
      const e = all.find((x) => x.layoutKey === fam.key && typesOf(x.key).some((t) => DATA.includes(t)));
      if (!e) continue;
      const t = JSON.parse((await post(U("/api/bibliotheque/utiliser"), { type: "footer", key: e.key })).text).template;
      const comp = { section: JSON.parse(db.prepare("SELECT section FROM mk_web_components WHERE id = ?").get(t.sourceId).section) };
      const used = []; walk(comp.section.children, (n) => used.push(n.type));
      assert.deepEqual(used, typesOf(e.key), `${e.key} : la copie diffère du catalogue`);
    }
  });

  test("site publié : un seul <footer> par page, SANS données (aucun trou, pas de tel:/mailto:) puis AVEC données (coordonnées cliquables, copyright à la raison sociale)", async () => {
    const keys = ["ft-services-05-domicile-zone-horaires", "ft-ecommerce-01-mega-enseigne", "ft-corporate-07-affiche-noir-et-or", "ft-minimalistes-05-cartouche-centre"];
    for (const k of keys) assert.ok(all.some((e) => e.key === k), k);
    for (const [s, host, full] of [[A2, "sans.test", false], [B2, "avec.test", true]]) {
      for (const [i, key] of keys.entries()) {
        const t = JSON.parse((await post(U("/api/bibliotheque/utiliser", s), { type: "footer", key })).text).template;
        assert.equal((await post(U(`/api/modeles/${t.id}/publier`, s), { replace: i > 0 })).status, 200, key);
        for (const p of ["/blog", "/introuvable-xyz"]) {
          const r = await hostReq(srv, host, p);
          assert.equal((r.text.match(/<footer\b/g) || []).length, 1, `${key} ${p} : un seul <footer>`);
          assert.equal((r.text.match(/class="[^"]*kw-theme-footer[^"]*"/g) || []).length, 1, `${key} ${p} : un seul pied du Theme Builder`);
          assert.match(r.text, full ? /© \d{4} Atelier Soleil/ : /© \d{4} Site sans données/, `${key} ${p} : copyright`);
          if (full && i === 0) { assert.match(r.text, /href="tel:\+33123456789"/); assert.match(r.text, /href="mailto:contact@atelier-soleil\.fr"/); }
          if (!full) assert.ok(!/href="(tel|mailto):/.test(r.text.split("<footer")[1] || ""), `${key} ${p} : lien tel:/mailto: sans donnée`);
        }
      }
    }
  });
});
