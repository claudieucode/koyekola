// Pieds de page : COMPORTEMENTS RÉELS dans un vrai Chrome (pilote CDP de tests/helpers-chrome-cdp.js), sur la PAGE PUBLIQUE d'un vrai serveur de test.
//  1) pour les 100 modèles : un seul <footer>, fond pleine largeur (390/1280/1920), contenu dans un conteneur aligné, aucun autre <footer>/<header> dans le pied, aucun défilement horizontal ;
//  2) pour TOUS les modèles à accordéon mobile (retrouvés par le code) : replié au départ, ouverture/fermeture souris et clavier, ARIA, cibles ≥ 44 px, contenu atteignable ; 820/1280 px = affichage normal ; sans JavaScript = contenu lisible ; mouvement réduit ;
//  3) APERÇU = PUBLIÉ : 20 modèles variés, aperçu de la bibliothèque et page publique mesurés aux mêmes largeurs.
// Variables facultatives : FOOTER_REPORT (fichier JSON de résultats), FOOTER_CAP_DIR (dossier de captures « comp-*.png »). Ignoré (avec la raison) si Chrome est absent.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Chrome = require("./helpers-chrome-cdp");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");

const walk = (list, fn) => { for (const n of list || []) { fn(n); if (n && n.children) walk(n.children, fn); } };
// Modèles à accordéon mobile, retrouvés par le code du modèle (jamais par une liste écrite à la main)
function accordionModels() {
  const out = [];
  for (const e of Catalog.entries("footer")) {
    const acc = [];
    walk(Catalog.build("footer", e.key, {}).section.children, (n) => { if (n.props && n.props.mode === "accordion" && n.props.accMobile) acc.push({ panels: (n.children || []).length, start: n.props.accStart, single: n.props.accSingle === true }); });
    if (acc.length) out.push({ key: e.key, family: e.layoutKey, acc });
  }
  return out;
}
const WIDTHS = [390, 820, 1280, 1920];

// Mesure exécutée DANS la page publique
function measurePublic() {
  const vw = document.documentElement.clientWidth, f = document.querySelector("footer");
  const out = { vw, footers: document.querySelectorAll("footer").length, marks: document.querySelectorAll('[data-kw-footer="1"]').length };
  if (!f) return out;
  const fr = f.getBoundingClientRect();
  out.left = fr.left; out.width = fr.width; out.height = fr.height;
  out.nested = f.querySelectorAll("footer,header,main,[role=banner],[role=contentinfo]").length;
  out.scrollW = document.documentElement.scrollWidth; out.bodyScrollW = document.body.scrollWidth;
  const bands = [...f.querySelectorAll(".kw-full")];
  out.bandsBad = bands.map((b) => { const r = b.getBoundingClientRect(); return { l: r.left, w: r.width }; }).filter((r) => Math.abs(r.l) > 1 || Math.abs(r.w - vw) > 1).length;
  out.bands = bands.length;
  // Fond : chaque bande pleine largeur a un fond effectif (le sien ou celui d'un parent, jusqu'au pied) ; une bande sans aucun fond laisse voir la page (signalé, pas forcément un défaut)
  // (le test par « elementFromPoint » aux bords de la fenêtre a été abandonné : après un défilement, Chrome sans fenêtre répond avec une image périmée)
  const eff = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; const m = c.match(/[\d.]+/g); if (m && (m.length < 4 || Number(m[3]) > 0.01)) return c; if (getComputedStyle(e).backgroundImage !== "none") return "image"; } return null; };
  const bad = bands.filter((b) => !eff(b)).length ? [`${bands.filter((b) => !eff(b)).length} bande(s) sans fond (la page se voit au travers)`] : [];
  out.bgBad = bad;
  // Contenu : chaque élément visible du pied reste dans la fenêtre ; marges gauche/droite du contenu de chaque bande
  let minL = 1e9, maxR = -1e9, outside = 0;
  for (const e of f.querySelectorAll("a,p,h1,h2,h3,h4,h5,h6,img,button,input,li,span,svg,label,select,textarea")) {
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const cs = getComputedStyle(e); if (cs.visibility === "hidden" || cs.display === "none") continue;
    if (r.left < -0.5 || r.right > vw + 0.5) outside++;
    minL = Math.min(minL, r.left); maxR = Math.max(maxR, r.right);
  }
  out.outside = outside; out.minL = minL; out.rightGap = vw - maxR;
  // conteneurs : le 1er enfant non pleine largeur de chaque bande a des marges gauche/droite égales
  const asym = [];
  for (const b of bands) { const inner = [...b.children].filter((c) => { const r = c.getBoundingClientRect(); return r.width > 0 && r.width < vw - 1; }); if (!inner.length) continue; const lo = Math.min(...inner.map((c) => c.getBoundingClientRect().left)), hi = Math.max(...inner.map((c) => c.getBoundingClientRect().right)); if (Math.abs(lo - (vw - hi)) > 2) asym.push([Math.round(lo), Math.round(vw - hi)]); }
  out.asym = asym;
  return out;
}

describe("Pieds de page : comportements réels dans Chrome", { skip: Chrome.SKIP }, () => {
  let srv, boss, db, chrome, S, slug, cookie;
  const report = { largeur: [], accordeon: [], apercu: [] };
  const issues = [];
  const bug = (id, msg) => issues.push(`${id} : ${msg}`);
  const U = (p = "") => `/marketing/site-web/sites/${S}/constructeur-de-theme${p}`;
  const json = (r) => JSON.parse(r.text);
  const shot = async (pg, name) => { if (process.env.FOOTER_CAP_DIR) { fs.mkdirSync(process.env.FOOTER_CAP_DIR, { recursive: true }); fs.writeFileSync(path.join(process.env.FOOTER_CAP_DIR, `comp-${name}.png`), await pg.screenshot()); } };
  async function publish(key) {
    const used = await boss.request(U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "footer", key }, headers: { Origin: srv.base } });
    assert.equal(used.status, 200, `${key} : ${used.text.slice(0, 200)}`);
    const t = json(used).template;
    const pub = await boss.request(U(`/api/modeles/${t.id}/publier`), { method: "POST", json: { strict: true, scope: "site", replace: true }, headers: { Origin: srv.base } });
    assert.equal(pub.status, 200, `${key} publication : ${pub.text.slice(0, 200)}`);
  }

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    S = Number((await boss.post("/marketing/site-web/sites", { name: "Site comportements" })).location.match(/sites\/(\d+)/)[1]);
    const pageId = Number((await boss.post("/marketing/pages", { name: "Accueil", site_id: S, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const corps = { id: "sect00000001", type: "layout", children: [{ id: "head00000001", type: "heading", props: { text: "CORPS-DE-PAGE", level: "2" } }] };
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: "Accueil", sections: [corps] } } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pageId, S);
    slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    cookie = [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base }));
    for (let i = 0; i < 4 && !chrome; i++) { try { chrome = await Chrome.launch(); } catch (e) { if (i === 3) throw e; await new Promise((r) => setTimeout(r, 3000)); } } // premier lancement parfois lent sur une machine chargée
  });
  after(async () => {
    if (process.env.FOOTER_REPORT) fs.writeFileSync(process.env.FOOTER_REPORT, JSON.stringify({ report, issues }, null, 1));
    if (chrome) await chrome.close(); if (db) db.close(); if (srv) await srv.stop();
  });

  test("100 modèles, page publique à 390 / 1280 / 1920 px : un seul <footer>, fond pleine largeur, contenu dans la fenêtre et centré, pas de défilement horizontal", async () => {
    const pages = {}; for (const w of [390, 1280, 1920]) pages[w] = await chrome.newPage({ width: w, height: 900 });
    const keys = Catalog.entries("footer").map((e) => e.key);
    assert.equal(keys.length, 100);
    for (const key of keys) {
      await publish(key);
      for (const w of [390, 1280, 1920]) {
        const pg = pages[w]; await pg.goto(`${srv.base}/p/${slug}`);
        const m = await pg.evaluate(measurePublic);
        report.largeur.push({ key, w, left: m.left, width: m.width, height: m.height, bands: m.bands, minL: m.minL, rightGap: m.rightGap });
        const id = `${key} @${w}`;
        if (m.footers !== 1) bug(id, `${m.footers} balises <footer>`);
        if (m.marks !== 1) bug(id, `${m.marks} repères data-kw-footer`);
        if (m.nested) bug(id, `${m.nested} <footer>/<header>/<main>/banner/contentinfo imbriqués dans le pied`);
        if (Math.abs(m.left) > 1 || Math.abs(m.width - m.vw) > 1) bug(id, `le pied ne couvre pas la largeur (x=${m.left}, largeur=${m.width}, fenêtre=${m.vw})`);
        if (m.bandsBad) bug(id, `${m.bandsBad}/${m.bands} bandes pas en pleine largeur`);
        if (m.bgBad && m.bgBad.length) report.largeur.push({ key, w, info: m.bgBad[0] });
        if (m.scrollW > m.vw + 1 || m.bodyScrollW > m.vw + 1) bug(id, `défilement horizontal (${m.scrollW} > ${m.vw})`);
        if (m.outside) bug(id, `${m.outside} éléments débordent de la fenêtre`);
        if (m.minL < (w === 390 ? 8 : 16)) bug(id, `contenu collé au bord gauche (${Math.round(m.minL)} px)`);
        if (m.asym && m.asym.length) bug(id, `conteneur non centré (marges ${JSON.stringify(m.asym[0])})`);
        assert.deepEqual(pg.errors, [], `${id} : erreurs JavaScript`);
      }
    }
    for (const w of Object.keys(pages)) await pages[w].close();
    const mine = issues.filter((x) => /@(390|1280|1920)/.test(x));
    assert.deepEqual(mine, [], `${mine.length} défauts :\n` + mine.slice(0, 40).join("\n"));
  });

  test("accordéon mobile : TOUS les modèles qui l'utilisent, sur la page publique (390 px replié/souris/clavier/ARIA/44 px ; 820 et 1280 px normal ; sans JavaScript lisible ; mouvement réduit)", async () => {
    const list = accordionModels();
    report.accordeonCount = list.length;
    assert.ok(list.length >= 20, `modèles à accordéon : ${list.length}`);
    const mob = await chrome.newPage({ width: 390, height: 800 }), t820 = await chrome.newPage({ width: 820, height: 900 }), big = await chrome.newPage({ width: 1280, height: 900 }), nojs = await chrome.newPage({ width: 390, height: 800 }), red = await chrome.newPage({ width: 390, height: 800 });
    await red.emulateMedia([{ name: "prefers-reduced-motion", value: "reduce" }]);
    const mine = [];
    const flag = (id, msg) => { mine.push(`${id} : ${msg}`); };
    for (const { key, acc } of list) {
      await publish(key);
      const url = `${srv.base}/p/${slug}`;
      const expectedHeads = acc.reduce((a, x) => a + x.panels, 0);
      const startsOpen = acc.some((x) => x.start === "all");
      // ── 390 px
      await mob.goto(url);
      await mob.waitFor(() => document.querySelectorAll(".kw-nacc-head").length > 0, "boutons créés").catch(() => {});
      const heads = await mob.evaluate(() => [...document.querySelectorAll(".kw-nacc-head")].map((b) => { const p = document.getElementById(b.getAttribute("aria-controls")); const r = b.getBoundingClientRect(); return { h: r.height, w: r.width, exp: b.getAttribute("aria-expanded"), ctl: Boolean(p), role: p && p.getAttribute("role"), hidden: p && p.hidden, label: b.textContent.trim(), tag: b.tagName, type: b.getAttribute("type") }; }));
      // Un volet qui ne contient que son titre (site sans menu ni coordonnées) n'a pas de bouton et reste masqué : jamais de bouton qui ouvre du vide
      const pan = await mob.evaluate(() => ({ all: document.querySelectorAll("footer .kw-nacc-panel").length, empty: document.querySelectorAll("footer .kw-nacc-panel[data-kw-empty]").length, emptyVisible: [...document.querySelectorAll("footer .kw-nacc-panel[data-kw-empty]")].filter((p) => p.getBoundingClientRect().height > 0).length }));
      if (pan.all !== expectedHeads) flag(key, `${pan.all} volets au lieu de ${expectedHeads}`);
      if (pan.emptyVisible) flag(key, `${pan.emptyVisible} volet(s) vide(s) encore visible(s)`);
      report.volets = report.volets || { total: 0, vides: 0 }; report.volets.total += pan.all; report.volets.vides += pan.empty;
      if (heads.length !== pan.all - pan.empty) flag(key, `${heads.length} boutons au lieu de ${pan.all - pan.empty} volets avec contenu`);
      for (const h of heads) {
        if (h.tag !== "BUTTON") flag(key, `titre « ${h.label} » n'est pas un <button>`);
        if (h.h < 44 || h.w < 44) flag(key, `cible trop petite pour « ${h.label} » : ${Math.round(h.w)}×${Math.round(h.h)}`);
        if (!h.ctl) flag(key, `aria-controls invalide pour « ${h.label} »`);
        if (h.role !== "region") flag(key, `volet de « ${h.label} » sans role=region`);
        if (!h.label) flag(key, "bouton sans texte");
        if (!startsOpen && (h.exp !== "false" || h.hidden !== true)) flag(key, `« ${h.label} » pas replié au départ (aria-expanded=${h.exp}, hidden=${h.hidden})`);
      }
      if (heads.length) {
        const first = await mob.evaluate(() => { const b = document.querySelector(".kw-nacc-head"); b.scrollIntoView({ block: "center" }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
        const was = heads[0].exp;
        await mob.mouseClick(first.x, first.y);
        await new Promise((r) => setTimeout(r, 150));
        const after1 = await mob.evaluate(() => { const b = document.querySelector(".kw-nacc-head"), p = document.getElementById(b.getAttribute("aria-controls")); return { exp: b.getAttribute("aria-expanded"), vis: !p.hidden && p.getBoundingClientRect().height > 0, txt: p.innerText.trim().length, sw: document.documentElement.scrollWidth }; });
        if (after1.exp === was) flag(key, "le clic ne change pas aria-expanded");
        if (was === "false" && (!after1.vis || after1.txt < 2)) flag(key, "volet ouvert mais contenu invisible/vide");
        if (after1.sw > 391) flag(key, `volet ouvert : défilement horizontal (${after1.sw})`);
        await mob.mouseClick(first.x, first.y); await new Promise((r) => setTimeout(r, 150));
        if ((await mob.evaluate(() => document.querySelector(".kw-nacc-head").getAttribute("aria-expanded"))) !== was) flag(key, "le second clic ne referme pas");
        // clavier : Tab depuis le haut de page jusqu'au 1er bouton ; focus visible ; Entrée puis Espace
        await mob.evaluate(() => { window.scrollTo(0, 0); document.activeElement && document.activeElement.blur(); });
        let reached = false;
        for (let i = 0; i < 120 && !reached; i++) { await mob.key("Tab"); reached = await mob.evaluate(() => document.activeElement && document.activeElement.classList.contains("kw-nacc-head")); }
        if (!reached) flag(key, "le bouton n'est pas atteignable à la touche Tab");
        else {
          const fv = await mob.evaluate(() => { const s = getComputedStyle(document.activeElement); return { outline: s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 1, shadow: s.boxShadow !== "none", fv: document.activeElement.matches(":focus-visible") }; });
          if (!fv.fv || !(fv.outline || fv.shadow)) flag(key, `focus non visible (${JSON.stringify(fv)})`);
          const e0 = await mob.evaluate(() => document.activeElement.getAttribute("aria-expanded"));
          await mob.pressActivation("Enter"); await new Promise((r) => setTimeout(r, 120));
          const e1 = await mob.evaluate(() => document.activeElement.getAttribute("aria-expanded"));
          if (e1 === e0) flag(key, "Entrée ne bascule pas le volet");
          await mob.pressActivation("Space"); await new Promise((r) => setTimeout(r, 120));
          const e2 = await mob.evaluate(() => document.activeElement.getAttribute("aria-expanded"));
          if (e2 !== e0) flag(key, `Espace ne bascule pas le volet (${e1} -> ${e2})`);
        }
        // contenu atteignable : chaque volet est ouvert l'un après l'autre (certains modèles n'en gardent qu'un d'ouvert à la fois) ; ses liens sont visibles, dans la fenêtre, sans défilement horizontal ;
        // un volet qui s'ouvre sur RIEN (site sans menu ni donnée) est signalé à part ([vide])
        const all = await mob.evaluate(() => {
          const out = { n: 0, off: 0, zero: 0, minH: 1e9, sw: 0, empty: [] };
          for (const b of document.querySelectorAll(".kw-nacc-head")) {
            if (b.getAttribute("aria-expanded") !== "true") b.click();
            const p = document.getElementById(b.getAttribute("aria-controls"));
            const items = [...p.querySelectorAll("a, button, input, select, textarea")].map((a) => a.getBoundingClientRect());
            out.n += items.length; out.off += items.filter((r) => r.width && (r.left < -0.5 || r.right > innerWidth + 0.5)).length; out.zero += items.filter((r) => !r.width || !r.height).length;
            if (items.length) out.minH = Math.min(out.minH, ...items.map((r) => r.height));
            if (p.hidden || p.getBoundingClientRect().height === 0) out.zero++;
            if (!p.innerText.trim().length && !p.querySelector("img,svg")) out.empty.push(b.textContent.trim());
            out.sw = Math.max(out.sw, document.documentElement.scrollWidth);
          }
          if (out.minH === 1e9) out.minH = 0;
          return out;
        });
        if (all.off) flag(key, `${all.off} éléments de volet hors fenêtre`);
        if (all.zero) flag(key, `${all.zero} éléments de volet de taille nulle une fois ouverts`);
        if (all.sw > 391) flag(key, `volets ouverts : défilement horizontal (${all.sw})`);
        for (const t of all.empty) flag(key, `[vide] le volet « ${t} » s'ouvre sur rien (site de test sans menu ni coordonnées)`);
        report.accordeon.push({ key, heads: heads.length, minHead: Math.min(...heads.map((h) => h.h)), links: all.n, minLinkH: all.minH });
        if (key === "ft-corporate-01-grande-marque-volets") { await mob.evaluate(() => { document.querySelector("footer").scrollIntoView(); }); await shot(mob, "accordeon-ouvert-390"); }
      }
      // ── 820 et 1280 px : affichage normal
      for (const [pg, w] of [[t820, 820], [big, 1280]]) {
        await pg.goto(url);
        const r = await pg.evaluate(() => ({ heads: document.querySelectorAll(".kw-nacc-head").length, enh: document.querySelectorAll(".kw-nacc.is-enhanced").length, hid: [...document.querySelectorAll("footer .kw-nacc-panel")].filter((p) => p.hidden || p.getBoundingClientRect().height === 0).length, sw: document.documentElement.scrollWidth, vw: innerWidth, t: [...document.querySelectorAll("footer .kw-nacc-panel")].map((p) => getComputedStyle(p, "::before").content).join("|") }));
        if (r.heads || r.enh) flag(key, `@${w} : accordéon actif (${r.heads} boutons)`);
        if (r.hid) flag(key, `@${w} : ${r.hid} volets masqués`);
        if (r.sw > r.vw + 1) flag(key, `@${w} : défilement horizontal`);
      }
      // ── sans JavaScript : la page publique sans ses <script> (feuilles de style conservées) ; tout est lisible, aucun bouton
      const html = (await (await fetch(url)).text()).replace(/<script\b[\s\S]*?<\/script>/gi, "").replace("<head>", `<head><base href="${srv.base}/">`);
      const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "kw-nojs-")), "page.html"); fs.writeFileSync(file, html);
      await nojs.goto("file://" + file);
      const nj = await nojs.evaluate(() => { const f = document.querySelector("footer"); return { heads: document.querySelectorAll(".kw-nacc-head").length, hid: [...f.querySelectorAll(".kw-nacc-panel")].filter((p) => p.hidden || p.getBoundingClientRect().height === 0).length, panels: f.querySelectorAll(".kw-nacc-panel").length, titles: [...f.querySelectorAll(".kw-nacc-panel")].filter((p) => (getComputedStyle(p, "::before").content || "").length > 2).length, sw: document.documentElement.scrollWidth }; });
      if (nj.heads || nj.hid) flag(key, `sans JavaScript : ${nj.hid} volets masqués, ${nj.heads} boutons`);
      if (nj.panels && nj.titles < nj.panels) flag(key, `sans JavaScript : ${nj.panels - nj.titles} volets sans titre de colonne`);
      if (nj.sw > 391) flag(key, "sans JavaScript : défilement horizontal");
      // ── mouvement réduit
      await red.goto(url);
      const mo = await red.evaluate(() => [...document.querySelectorAll("footer .kw-nacc-head, footer .kw-nacc-panel, footer .kw-nacc-head::after")].map((e) => { const s = getComputedStyle(e); return parseFloat(s.transitionDuration) + parseFloat(s.animationDuration || 0); }).filter((x) => x > 0).length);
      if (mo) flag(key, `mouvement réduit : ${mo} éléments gardent une transition ou animation`);
    }
    for (const p of [mob, t820, big, nojs, red]) await p.close();
    issues.push(...mine.map((x) => "[acc] " + x));
    assert.deepEqual(mine, [], `${mine.length} défauts d'accordéon sur ${list.length} modèles :\n` + mine.slice(0, 40).join("\n"));
  });

  test("APERÇU = PUBLIÉ : 20 modèles variés, aperçu de la bibliothèque et page publique aux mêmes largeurs (hauteur du pied, position et taille des blocs)", async () => {
    const all = Catalog.entries("footer");
    const fam = {}; for (const e of all) (fam[e.layoutKey] = fam[e.layoutKey] || []).push(e.key);
    const accKeys = accordionModels().map((x) => x.key), others = all.map((e) => e.key).filter((k) => !accKeys.includes(k));
    const sample = [];
    for (const f of Object.keys(fam)) { const k = fam[f].find((x) => !accKeys.includes(x)); if (k) sample.push(k); }  // 1 modèle SANS accordéon par famille (15)
    for (const i of [0, 7, 14, 21, 27]) if (sample.length < 20 && !sample.includes(accKeys[i])) sample.push(accKeys[i]); // + 5 modèles AVEC accordéon, répartis
    for (const k of others) if (sample.length < 20 && !sample.includes(k)) sample.push(k);
    assert.equal(new Set(sample).size, 20);
    const probe = () => {
      const root = document.querySelector("footer") || document.querySelector(".kw-theme-footer");
      const rr = root.getBoundingClientRect();
      /* les éléments non affichés (volet replié, « masquer sur mobile ») ont un rectangle nul dont la position n'a aucun sens : ils ne sont pas comparés (D8 : faux écart de 296 px) */ const nodes = [...root.querySelectorAll(".kw-node")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 || r.height > 0; }).map((e) => { const r = e.getBoundingClientRect(); const t = (e.className.match(/kw-(container|stack|text|heading|link|button|social|sitelogo|sitetitle|menu|copyright|emailsubscribe|emailsub|signup|search|divider|image|map|biz[a-z]+|shop[a-z]+|account|backtotop|html)\b/) || [])[0] || "?"; return { t, x: r.left - rr.left, y: r.top - rr.top, w: r.width, h: r.height }; });
      return { tag: root.tagName, lines: root.innerText.split("\n").map((x) => x.trim()).filter(Boolean), vis: root.innerText.replace(/\s+/g, " ").trim(), h: rr.height, w: rr.width, nodes, legal: Boolean(root.querySelector(".lp-foot")), heads: document.querySelectorAll(".kw-nacc-head").length, scripts: document.scripts.length, sw: document.documentElement.scrollWidth };
    };
    const rows = [], toggleBad = [];
    for (const w of [390, 820, 1280]) {
      const prev = await chrome.newPage({ width: w, height: 900, cookies: cookie }), pub = await chrome.newPage({ width: w, height: 900 });
      for (const key of sample) {
        await publish(key);
        await prev.goto(`${srv.base}${U(`/api/bibliotheque/footer/${key}/apercu`)}`); await new Promise((r) => setTimeout(r, 250));
        await pub.goto(`${srv.base}/p/${slug}`); await new Promise((r) => setTimeout(r, 250));
        // D6 : le menu d'EXEMPLE de la bibliothèque (nav[data-kw-sample], annoncé « (menu d'exemple) ») n'existe pas sur le site publié de test, qui n'a pas de menu : il est retiré de l'aperçu avant la mesure
        const samples = await prev.evaluate(() => { const l = [...document.querySelectorAll("nav[data-kw-sample]")]; const labelled = l.every((n) => getComputedStyle(n, "::after").content.includes("exemple")); l.forEach((n) => n.remove()); return { n: l.length, labelled }; });
        if (samples.n && !samples.labelled) issues.push(`[apercu] ${key} @${w} : menu d'exemple sans mention « exemple »`);
        const a = await prev.evaluate(probe), b = await pub.evaluate(probe);
        let maxD = 0, worst = "", typeDiff = a.nodes.length !== b.nodes.length;
        if (!typeDiff) a.nodes.forEach((n, i) => { const m = b.nodes[i]; if (n.t !== m.t) typeDiff = true; for (const k of ["x", "y", "w", "h"]) { const d = Math.abs(n[k] - m[k]); if (d > maxD) { maxD = d; worst = `${n.t}#${i}.${k}`; } } });
        // Correctif proposé (aperçu qui charge le même script que le site publié) : simulé ici en ajoutant landing.js à la page d'aperçu déjà ouverte
        let hFixed = null, headsFixed = null;
        if (a.heads !== b.heads) {
          await prev.evaluate(() => new Promise((ok) => { const sc = document.createElement("script"); sc.src = "/js/landing.js"; sc.onload = () => setTimeout(ok, 400); sc.onerror = ok; document.body.appendChild(sc); }));
          const a2 = await prev.evaluate(probe); hFixed = Math.round(a2.h); headsFixed = a2.heads;
        }
        // D1 : l'aperçu complet porte le script de la page : volets REPLIÉS au départ à 390 px, et le clic ouvre puis referme (comme sur le site publié)
        let previewToggle = null;
        if (w === 390 && a.heads > 0) {
          previewToggle = await prev.evaluate(() => { const hs = [...document.querySelectorAll(".kw-nacc-head")], b = hs[0]; const p = document.getElementById(b.getAttribute("aria-controls")); const start = hs.map((h) => h.getAttribute("aria-expanded")); b.click(); const open = b.getAttribute("aria-expanded") === "true" && !p.hidden; b.click(); const closed = b.getAttribute("aria-expanded") === "false" && p.hidden; return { allClosed: start.every((x) => x === "false"), open, closed }; });
          if (!previewToggle.allClosed || !previewToggle.open || !previewToggle.closed) toggleBad.push(`[apercu] ${key} @390 : accordéon de l'aperçu (replié au départ ${previewToggle.allClosed}, s'ouvre ${previewToggle.open}, se referme ${previewToggle.closed})`);
        }
        const prevOnly = a.lines.filter((x) => !b.lines.includes(x)), pubOnly = b.lines.filter((x) => !a.lines.includes(x));
        rows.push({ key, w, previewToggle, hFixed, headsFixed, prevOnly: prevOnly.slice(0, 6), pubOnly: pubOnly.slice(0, 6), hPrev: Math.round(a.h), hPub: Math.round(b.h), dh: Math.round(b.h - a.h), maxD: Math.round(maxD), worst, nodesPrev: a.nodes.length, nodesPub: b.nodes.length, typeDiff, headsPrev: a.heads, headsPub: b.heads, legalPub: b.legal, legalPrev: a.legal, tagPrev: a.tag, tagPub: b.tag, textSame: a.vis === b.vis });
        if (key === "ft-corporate-01-grande-marque-volets" && w === 390) { await prev.evaluate(() => (document.querySelector("footer") || document.querySelector(".kw-theme-footer")).scrollIntoView()); await shot(prev, "apercu-accordeon-390"); await pub.evaluate(() => document.querySelector("footer").scrollIntoView()); await shot(pub, "publie-accordeon-390"); }
      }
      await prev.close(); await pub.close();
    }
    report.apercu = rows; issues.push(...toggleBad); assert.deepEqual(toggleBad, [], toggleBad.join("\n"));
    const bad = rows.filter((r) => Math.abs(r.dh) > 3 || r.maxD > 3 || r.typeDiff || r.headsPrev !== r.headsPub);
    issues.push(...bad.map((r) => `[apercu] ${r.key} @${r.w} : hauteur aperçu ${r.hPrev} / publié ${r.hPub}, écart max de bloc ${r.maxD}px (${r.worst}), blocs ${r.nodesPrev}/${r.nodesPub}, boutons d'accordéon ${r.headsPrev}/${r.headsPub}${r.hFixed !== null ? `, avec le script ajouté : hauteur ${r.hFixed} et ${r.headsFixed} boutons` : ""}${r.prevOnly.length ? `, textes seulement dans l'aperçu : ${r.prevOnly.join(" / ")}` : ""}`));
    assert.equal(bad.length, 0, `${bad.length}/${rows.length} mesures aperçu ≠ publié :\n` + bad.slice(0, 30).map((r) => `${r.key} @${r.w} dh=${r.dh} maxD=${r.maxD} ${r.worst} blocs ${r.nodesPrev}/${r.nodesPub} acc ${r.headsPrev}/${r.headsPub} légal=${r.legalPub}`).join("\n"));
  });
});
