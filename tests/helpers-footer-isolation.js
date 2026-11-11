// Aides des tests de la frontière de pied (indépendance graphique du pied de page) : relevé de styles calculés par élément, comparaison « un changement ne compte que s'il est visible »,
// et les 9 changements du site du scénario (couleurs, polices, échelle de texte, réglages « Global », boutons/champs/rayons, 4 thèmes).
// Le relevé est exécuté DANS Chrome (la fonction est sérialisée : aucune variable extérieure).
const assert = require("node:assert/strict");

// ---------- relevé (exécuté dans la page) ----------
function snapshot(arg) {
  const D = document, W = window;
  const P = ["color", "backgroundColor", "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform", "textDecorationLine", "fontStyle", "borderTopColor", "borderTopWidth", "borderTopStyle", "borderBottomColor", "borderBottomWidth", "borderTopLeftRadius", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "marginTop", "marginBottom", "rowGap", "columnGap", "boxShadow", "opacity", "fill", "backgroundImage"];
  const els = [];
  const walk = (e) => { els.push(e); for (const c of e.children) walk(c); };
  for (const sel of arg.roots) for (const r of D.querySelectorAll(sel)) walk(r);
  const kindOf = (e) => { const c = [...e.classList].filter((x) => /^kw-/.test(x) && !/^kw-n-/.test(x) && x !== "kw-node" && x !== "kw-full"); return c.length ? c.slice(0, 2).join(".") : e.tagName.toLowerCase(); };
  const out = [];
  for (const e of els) {
    const cs = W.getComputedStyle(e), r = e.getBoundingClientRect();
    const vis = r.width > 0 && r.height > 0 && cs.display !== "none" && cs.visibility !== "hidden";
    const o = { k: kindOf(e), t: e.tagName.toLowerCase(), txt: [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) ? 1 : 0, ctl: /^(input|button|select|textarea|svg|img|path)$/.test(e.tagName.toLowerCase()) ? 1 : 0, v: vis ? 1 : 0, s: {}, g: { width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10 } };
    for (const p of P) o.s[p] = cs[p];
    out.push(o);
  }
  return { n: els.length, els: out };
}
const TEXTP = new Set(["color", "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform", "textDecorationLine", "fontStyle"]);
const alpha0 = (c) => /rgba\(.*,\s*0\)$/.test(c) || c === "transparent";
function relevant(e, f, p) {
  if (TEXTP.has(p)) return e.txt || e.ctl;
  if (p === "fill") return e.t === "svg" || e.t === "path";
  if (/^border(Top|Bottom)Color$/.test(p)) return parseFloat(e.s[p.replace("Color", "Width")]) > 0 || parseFloat(f.s[p.replace("Color", "Width")]) > 0;
  if (p === "backgroundColor") return !(alpha0(e.s[p]) && alpha0(f.s[p]));
  if (p === "borderTopLeftRadius") return !alpha0(e.s.backgroundColor) || parseFloat(e.s.borderTopWidth) > 0 || e.ctl;
  return true;
}
// x = référence, y = comparé (même structure) → { pairs: nombre de propriétés visibles qui changent, els, geom, structural, props }
function diff(x, y, { ignore = [] } = {}) {
  if (!x || !y) return { missing: true, pairs: 1e9 };
  if (x.n !== y.n) return { structural: [x.n, y.n], pairs: 1e9 };
  let pairs = 0, els = 0, geom = 0; const props = {};
  x.els.forEach((e, i) => {
    if (!e.v) return;
    const f = y.els[i]; let ch = false;
    for (const p of Object.keys(e.s)) if (e.s[p] !== f.s[p] && relevant(e, f, p) && !ignore.includes(`${i}|${p}`)) { pairs++; ch = true; const k = `${e.k}|${p}`; props[k] = props[k] || { n: 0, ex: [e.s[p], f.s[p]] }; props[k].n++; }
    if (ch) els++;
    if (Math.abs(e.g.width - f.g.width) > 1) geom++;
  });
  return { pairs, els, geom, props, rootW: [x.els[0] && x.els[0].g.width, y.els[0] && y.els[0].g.width] };
}
const summary = (d) => (d.structural ? `structure ${d.structural.join("→")}` : d.missing ? "absent" : `${d.pairs} propriété(s) sur ${d.els} élément(s) : ${Object.entries(d.props).slice(0, 5).map(([k, v]) => `${k} ${v.ex[0]} → ${v.ex[1]}`).join(" ; ")}`);

// ---------- changements du site (les mêmes que l'audit) ----------
const NAVY = { primary: "#0b2545", secondary: "#13315c", accent: "#ffb703", background: "#0a1a33", surface: "#12284a", text: "#e8eef7", muted: "#9db2d0" };
const STATES = {
  C: { colors: { primary: "#e11d48", secondary: "#16a34a", accent: "#111111", background: "#ffffff", surface: "#fde68a", text: "#111111", muted: "#444444" } },
  F: { fonts: { heading: "georgia", body: "mono", button: "mono", link: "georgia" } },
  T: { type: { h1: { size: 64, weight: 300, lineHeight: 1.6 }, h2: { size: 48, weight: 300, lineHeight: 1.6 }, h3: { size: 36, weight: 300, lineHeight: 1.6 }, h4: { size: 30, weight: 300, lineHeight: 1.6 }, h5: { size: 26, weight: 300 }, h6: { size: 22, weight: 300 }, body: { size: 22, weight: 700, lineHeight: 1.9 }, caption: { size: 20, weight: 700 }, button: { size: 22, weight: 300 } } },
  G: { global: { colors: { accent: "#e11d48", secondary: "#16a34a", highlight: "#111111", text: "#111111", siteBg: "#ffffff", contentBg: "#fde68a", link: "#ff0000", headings: "#00aa00", textSecondary: "#555555" }, typography: { headingFont: { family: "georgia" }, bodyFont: { family: "mono", size: 22, color: "#ff00ff", weight: 700 }, link: { family: "georgia", color: "#ff0000", underline: "always" }, h3: { family: "mono", size: 40, weight: 300, color: "#00aaff" } }, buttons: { primary: { normal: { bg: "#ff00ff", color: "#00ff00", border: "#0000ff" }, radius: { d: { t: 40, r: 40, b: 40, l: 40 } }, font: { family: "georgia", size: 24, weight: 300 } }, secondary: { normal: { bg: "#ffff00", color: "#ff0000", border: "#0000ff" } } } } },
  R: { radius: { sm: 0, md: 40, lg: 40, button: 40, field: 30, card: 0 }, shadow: { card: "lg", button: "lg" }, border: { width: 4, color: "#ff00ff" }, buttons: { paddingY: 30, paddingX: 50, borderWidth: 5, normal: { bg: "#ff00ff", color: "#00ff00", border: "#0000ff" } }, link: { color: "#ff0000", underline: "always" }, forms: { bg: "#ffff00", color: "#000000", borderColor: "#ff0000", borderWidth: 4, radius: 30 }, images: { radius: 40 }, sizes: { buttonHeight: 80, fieldHeight: 70 }, space: { xs: 20, sm: 30, md: 40, lg: 60, xl: 90, xxl: 120 } },
};
const PACKS = ["maille", "noir", "sape", "volt"];

// ---------- un site de test : page d'accueil + contenu, jetons marine, en-tête publié ----------
async function makeSite(srv, boss, name = "Site isolation", { header = true } = {}) {
  const db = srv.db();
  const json = (r) => JSON.parse(r.text);
  const S = Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
  const pageId = Number((await boss.post("/marketing/pages", { name: `Accueil ${name}`, site_id: S, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
  const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
  const corps = { id: "sect00000001", type: "layout", children: [
    { id: "head00000001", type: "heading", props: { text: "CORPS-DE-PAGE", level: "2" } },
    { id: "text00000001", type: "text", props: { html: "<p>Texte du contenu avec un <a href='/x'>lien</a>.</p>" } },
    { id: "butt00000001", type: "button", props: { label: "Bouton contenu", url: "/y", variant: "primary" } }] };
  assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: "Accueil", sections: [corps] } } })).status, 200);
  assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
  db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pageId, S);
  const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
  const U = (p = "") => `/marketing/site-web/sites/${S}/constructeur-de-theme${p}`;
  const api = {
    S, pageId, slug, U, db, json, url: `${srv.base}/p/${slug}`,
    async getSettings() { return json(await boss.get(`/marketing/site-web/sites/${S}/reglages.json`)); },
    async putSettings(patch) { const cur = await api.getSettings(); const r = await boss.request(`/marketing/site-web/sites/${S}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: cur.settings, ...patch }, headers: { Origin: srv.base } }); assert.equal(r.status, 200, "réglages " + r.text.slice(0, 300)); return json(r); },
    async setTokens(patch) {
      const cur = await api.getSettings(); const t = JSON.parse(JSON.stringify(cur.tokens));
      for (const [k, v] of Object.entries(patch)) t[k] = (v && typeof v === "object" && !Array.isArray(v) && t[k] && typeof t[k] === "object") ? { ...t[k], ...v } : v;
      const r = await boss.request(`/marketing/site-web/sites/${S}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: t, settings: cur.settings }, headers: { Origin: srv.base } });
      assert.equal(r.status, 200, "setTokens " + r.text.slice(0, 300));
    },
    // Insère un modèle de la bibliothèque, l'applique au mode demandé (legacy | solo | site) et le publie
    async footer(key, mode = "legacy") {
      const used = await boss.request(U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "footer", key }, headers: { Origin: srv.base } });
      assert.equal(used.status, 200, `${key} : ${used.text.slice(0, 200)}`);
      const t = json(used).template;
      if (mode !== "legacy") { const m = await boss.request(U(`/api/modeles/${t.id}/apparence-pied`), { method: "POST", json: { mode }, headers: { Origin: srv.base } }); assert.equal(m.status, 200, `${key} mode : ${m.text.slice(0, 200)}`); }
      const pub = await boss.request(U(`/api/modeles/${t.id}/publier`), { method: "POST", json: { strict: true, scope: "site", replace: true }, headers: { Origin: srv.base } });
      assert.equal(pub.status, 200, `${key} publication : ${pub.text.slice(0, 200)}`);
      return t;
    },
    async setMode(t, mode, { publish = true } = {}) {
      const m = await boss.request(U(`/api/modeles/${t.id}/apparence-pied`), { method: "POST", json: { mode }, headers: { Origin: srv.base } }); assert.equal(m.status, 200, m.text.slice(0, 200));
      if (publish) { const pub = await boss.request(U(`/api/modeles/${t.id}/publier`), { method: "POST", json: { strict: true, scope: "site", replace: true }, headers: { Origin: srv.base } }); assert.equal(pub.status, 200, pub.text.slice(0, 200)); }
    },
    async unpublish(t) { const r = await boss.request(U(`/api/modeles/${t.id}/depublier`), { method: "POST", json: {}, headers: { Origin: srv.base } }); assert.equal(r.status, 200, r.text.slice(0, 200)); },
    // Activer deux fois de suite le même thème ne fait rien (le site le croit déjà actif) : on passe d'abord par un autre
    async activatePack(key) {
      const go = async (k) => { await boss.post("/marketing/site-web/themes/installer", { key: k, site: String(S) }); await boss.post(`/marketing/site-web/themes/${k}/activer`, { site: String(S) }); };
      if (api.lastPack === key) await go(key === "maille" ? "noir" : "maille");
      await go(key); api.lastPack = key;
    },
  };
  if (header) {
    const Catalog = require("../src/themeBuilder/catalog");
    const hu = await boss.request(U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key: Catalog.entries("header")[0].key }, headers: { Origin: srv.base } });
    const ht = json(hu).template;
    await boss.request(U(`/api/modeles/${ht.id}/publier`), { method: "POST", json: { strict: true, scope: "site", replace: true }, headers: { Origin: srv.base } });
    api.headerTemplate = ht;
  }
  return api;
}
// Termine les animations en cours avant un relevé (sinon de fausses différences : images intermédiaires de transitions)
const settle = async (page) => { await page.evaluate("document.getAnimations().forEach(a=>{try{a.finish()}catch(e){}})"); await new Promise((r) => setTimeout(r, 120)); await page.evaluate("document.getAnimations().forEach(a=>{try{a.finish()}catch(e){}})"); };
const ROOTS = { foot: ["footer[data-kw-footer]"], head: [".lp-site-header"], body: [".lp-block:not(.lp-site-part)"] };
async function grab(page, url, roots = ROOTS) {
  await page.goto(url); await settle(page);
  const o = {};
  for (const [k, sel] of Object.entries(roots)) o[k] = await page.evaluate(snapshot, { roots: sel });
  o.extra = await page.evaluate(() => ({ footers: document.querySelectorAll("footer").length, insideMain: !!document.querySelector("main footer, .lp-main footer"), headers: document.querySelectorAll("header").length, sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  return o;
}

module.exports = { snapshot, diff, summary, NAVY, STATES, PACKS, makeSite, settle, grab, ROOTS };
