// Contrôle visuel par lots des 100 archives produits du Theme Builder (aperçu réel du catalogue) : 3 largeurs (1280 / 820 / 390 px), capture + mesures
// (débordement horizontal, chevauchements, éléments hors écran, contraste WCAG < 3, cartes d'une même rangée de largeur égale, images au bon format),
// puis une passe INTERACTIVE sur la vraie page /boutique (modèle du catalogue appliqué par le moteur) : filtres par l'interface, tri, pagination, ajout au panier.
// Usage : node scripts/audit-archives-produits.js <dossier de sortie> [clé-de-modèle,clé…]   (LIVE_ONLY=1 : seulement la passe interactive)
// Prérequis : playwright-core (`npm i --no-save playwright-core`) et Chrome (CHROME_PATH). Le démarrage du serveur de test peut dépasser 2 min : TEST_START_TIMEOUT_MS=900000.
const path = require("path"), fs = require("fs");
const REPO = path.join(__dirname, "..");
const { startServer, loginInstructor } = require(path.join(REPO, "tests/helpers"));
let chromium; try { ({ chromium } = require("playwright-core")); } catch { console.error("playwright-core absent : npm i --no-save playwright-core"); process.exit(2); }
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const Catalog = require(path.join(REPO, "src/themeBuilder/catalog"));
const { TEST_KEY } = require(path.join(REPO, "tests/marketing-helpers"));
const catalog = require(path.join(REPO, "src/marketing/shop/catalog"));
const shopStore = require(path.join(REPO, "src/marketing/shop/store"));
const themeTemplates = require(path.join(REPO, "src/marketing/pages/themeTemplates"));
const tctx = (d) => ({ db: d, organizationId: 1, settings: require(path.join(REPO, "src/marketing/settings")).createSettings(d, { encryptionKey: TEST_KEY }) });

const OUT = process.argv[2] || path.join(require("os").tmpdir(), "audit-archives");
const ONLY = process.argv[3] ? process.argv[3].split(",") : null;
const VPS = [["desktop", 1280, 900], ["tablette", 820, 1000], ["mobile", 390, 900]];

// Mesures exécutées dans la page (aperçu de la bibliothèque OU page publiée) ; root = racine du contenu
function measure(rootSel) {
  const root = document.querySelector(rootSel);
  if (!root) return { missing: true };
  const vis = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 1 && r.height > 1 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0"; };
  const SEL = "a,button,img,input,select,p,span,h1,h2,h3,svg,label";
  const leaves = [...root.querySelectorAll(SEL)].filter((el) => vis(el) && !(el.parentElement && el.parentElement.closest(SEL) && root.contains(el.parentElement.closest(SEL))));
  const rects = leaves.map((el) => { const r = el.getBoundingClientRect(); return { t: el.tagName, x: r.left, y: r.top, w: r.width, h: r.height, txt: (el.textContent || "").trim().slice(0, 22), cls: String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).slice(0, 24) }; });
  const overlaps = [];
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    // la pastille posée sur l'image est voulue
    if (/kw-pg-badge/.test(a.cls + b.cls)) continue;
    const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (ox > 3 && oy > 3) overlaps.push(`${a.t}"${a.txt}"×${b.t}"${b.txt}"`);
  }
  const outside = rects.filter((r) => r.x < -1 || r.x + r.w > innerWidth + 1).map((r) => `${r.t}"${r.txt}"`);
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(",").map((x) => parseFloat(x)); return { r, g, b, a }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const bgOf = (el) => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0.85) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
  const low = [];
  for (const el of root.querySelectorAll("a,button,p,span,h1,h2,h3,label,strong,s")) {
    if (!vis(el) || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const fg = parse(getComputedStyle(el).color), bg = bgOf(el); if (!fg) continue;
    const L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const op = parseFloat(getComputedStyle(el).opacity);
    if (ratio < 3 && !(el.matches(".kw-pg-old") && ratio > 2.2)) low.push(`${(el.textContent || "").trim().slice(0, 18)} ${ratio.toFixed(1)} op${op}`);
  }
  // grille : toutes les cartes d'une même rangée ont la même largeur, et une image au format demandé
  const gridIssues = [];
  for (const g of root.querySelectorAll(".kw-pg-grid")) {
    const cards = [...g.querySelectorAll(".kw-pg-card")].filter(vis);
    const rows = new Map();
    for (const c of cards) { const r = c.getBoundingClientRect(); const k = Math.round(r.top / 10); (rows.get(k) || rows.set(k, []).get(k)).push(r); }
    for (const rs of rows.values()) if (rs.length > 1) { const ws = rs.map((r) => r.width); if (Math.max(...ws) - Math.min(...ws) > 2) gridIssues.push(`largeurs inégales ${ws.map(Math.round).join("/")}`); }
    for (const c of cards.slice(0, 3)) { const im = c.querySelector(".kw-pg-img"); if (im) { const r = im.getBoundingClientRect(); if (r.height < 20) gridIssues.push("image écrasée"); } }
  }
  const rb = root.getBoundingClientRect();
  return { low: low.slice(0, 4), scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, height: Math.round(rb.height), items: rects.length, cards: root.querySelectorAll(".kw-pg-card").length,
    overlaps: overlaps.slice(0, 4), outside: outside.slice(0, 4), gridIssues: gridIssues.slice(0, 3) };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const site = Number((await boss.post("/marketing/site-web/sites", { name: "Audit" })).location.match(/sites\/(\d+)/)[1]);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const report = [];
  const entries = process.env.LIVE_ONLY ? [] : Catalog.entries("product_archive").filter((e) => !ONLY || ONLY.includes(e.layoutId) || ONLY.includes(e.key));
  for (const [vname, w, h] of VPS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    await ctx.addCookies([...boss.cookies].map(([n, v]) => ({ name: n, value: v, url: srv.base })));
    const pg = await ctx.newPage();
    for (const e of entries) {
      const url = `${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme/api/bibliotheque/product_archive/${e.key}/apercu`;
      const r = { key: e.key, name: e.name, vp: vname };
      try {
        await pg.goto(url, { waitUntil: "load" });
        Object.assign(r, await pg.evaluate(measure, ".kw-theme-template"));
        await pg.screenshot({ path: path.join(OUT, `${e.key}.${vname}.png`), fullPage: false });
      } catch (err) { r.error = String(err.message).slice(0, 160); }
      report.push(r);
    }
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 1));

  // ── Phase 2 : la vraie page /boutique (site principal), modèle du catalogue appliqué par le moteur ───────────────────────────────────────────────────────────────────────────────
  const live = [];
  const db = srv.db(), origin = { Origin: srv.base };
  const sh = { db, organizationId: 1, siteId: null };
  shopStore.saveSettings(sh, { enabled: 1, payment_methods: ["manual"] });
  const cats = { chaises: catalog.saveCategory(sh, { name: "Chaises" }), tables: catalog.saveCategory(sh, { name: "Tables" }) };
  const mk = (o) => catalog.createProduct(sh, { status: "published", ...o });
  for (let i = 1; i <= 26; i++) mk({ name: `Article ${String(i).padStart(2, "0")}`, price_cents: 1000 * i, short_description: "Description courte de l'article.", category_ids: [i % 2 ? cats.chaises : cats.tables], is_featured: i % 9 === 0 ? 1 : 0, ...(i % 6 === 0 ? { sale_price_cents: 500 * i } : {}) });
  mk({ name: "Article épuisé", price_cents: 7000, manage_stock: 1, stock_qty: 0 });
  const bag = mk({ name: "Sac à variantes", type: "variable", price_cents: 3000, attributes: [{ name: "Taille", values: ["S", "M"] }] });
  catalog.saveVariant(sh, bag, { options: { Taille: "S" }, stock_qty: 5 });
  let current = null;
  const publish = async (layoutId) => {
    const e = Catalog.entries("product_archive").find((x) => x.layoutId === layoutId);
    for (const t of themeTemplates.list ? themeTemplates.list(tctx(db)) : []) { try { themeTemplates.remove(tctx(db), t.id); } catch { /* aucun */ } }
    const created = await boss.post("/marketing/pages", { name: `Modèle ${layoutId}`, kind: "page", template: "", ouvrir: "editeur" });
    const pid = Number(created.location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pid).revision;
    await boss.request(`/marketing/pages/${pid}/brouillon`, { method: "PUT", headers: origin, json: { revision: rev, content: { title: layoutId, sections: Catalog.build("product_archive", e.key).sections } } });
    await boss.request(`/marketing/pages/${pid}/publier.json`, { method: "POST", json: {}, headers: origin });
    themeTemplates.add(tctx(db), { type: "product_archive", pageId: pid });
    current = e.key;
  };
  for (const layoutId of ["filtres-colonne-collante", "outils-ajout-rapide", "liste-description-panier", "barre-collante", "secteur-mode-femme"]) {
    if (ONLY && !ONLY.includes(layoutId) && !process.env.LIVE_ONLY) continue;
    await publish(layoutId);
    const r = { layoutId, key: current };
    for (const [vname, w, h] of VPS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const pg = await ctx.newPage();
      await pg.goto(`${srv.base}/boutique`, { waitUntil: "load" });
      r[vname] = await pg.evaluate(measure, ".lp-main");
      await pg.screenshot({ path: path.join(OUT, `live-${layoutId}.${vname}.png`), fullPage: vname === "desktop" });
      if (vname === "desktop") {
        // tri par l'interface (formulaire), pagination par clic, ajout au panier par clic
        const sort = pg.locator("select[name=tri]").first();
        if (await sort.count()) {
          await sort.selectOption("price_desc");
          await Promise.all([pg.waitForNavigation({ waitUntil: "load" }), pg.locator("form.kw-sf button[type=submit]").first().click()]);
          r.sortUrl = pg.url().replace(srv.base, "");
          r.firstAfterSort = await pg.locator(".kw-pg-name").first().textContent();
        }
        await pg.goto(`${srv.base}/boutique`, { waitUntil: "load" });
        const next = pg.locator(".kw-pg-pager a[rel=next]").first();
        if (await next.count()) { await Promise.all([pg.waitForNavigation({ waitUntil: "load" }), next.click()]); r.pageUrl = pg.url().replace(srv.base, ""); r.pageCards = await pg.locator(".kw-pg-card").count(); }
        await pg.goto(`${srv.base}/boutique`, { waitUntil: "load" });
        const add = pg.locator("form[data-sh-add] button[type=submit]").first();
        if (await add.count()) { await add.click(); await pg.waitForFunction(() => { const m = document.querySelector("form[data-sh-add] [data-sh-msg]"); return m && m.textContent.trim(); }, null, { timeout: 8000 }).catch(() => {}); r.addMsg = await pg.locator("form[data-sh-add] [data-sh-msg]").first().textContent(); r.cartCount = JSON.parse((await pg.evaluate(async () => (await fetch("/boutique/panier.json")).text()))).count; }
        // filtres collants : la colonne reste visible après défilement
        const stickyEl = pg.locator("[style*='sticky'], .kw-n-sticky").first();
        r.scroll = await pg.evaluate(() => { window.scrollTo(0, 900); const f = document.querySelector("form.kw-sf"); const rc = f && f.getBoundingClientRect(); return rc ? { top: Math.round(rc.top), bottom: Math.round(rc.bottom), vh: innerHeight } : null; });
        await pg.screenshot({ path: path.join(OUT, `live-${layoutId}.scrolled.png`) });
        void stickyEl;
      }
      await ctx.close();
    }
    live.push(r);
  }
  fs.writeFileSync(path.join(OUT, "live.json"), JSON.stringify(live, null, 1));
  console.log("LIVE", JSON.stringify(live.map((l) => ({ layoutId: l.layoutId, sortUrl: l.sortUrl, firstAfterSort: l.firstAfterSort && l.firstAfterSort.trim(), pageUrl: l.pageUrl, pageCards: l.pageCards, addMsg: l.addMsg && l.addMsg.trim(), cartCount: l.cartCount, scroll: l.scroll, overflowMobile: l.mobile && l.mobile.scrollW > l.mobile.clientW + 1, desktop: l.desktop && { overlaps: l.desktop.overlaps, grid: l.desktop.gridIssues, low: l.desktop.low } }))));
  await browser.close(); await srv.stop();
  const bad = report.filter((r) => r.error || r.missing || (r.low && r.low.length) || r.scrollW > r.clientW + 1 || (r.overlaps && r.overlaps.length) || (r.outside && r.outside.length) || (r.gridIssues && r.gridIssues.length) || !r.cards);
  console.log(`total ${report.length} · défauts ${bad.length}`);
  for (const b of bad) console.log(b.vp, b.key, b.error || b.missing ? "ERR/MISSING" : "", !b.cards ? "aucune carte" : "", b.scrollW > b.clientW + 1 ? `overflow ${b.scrollW}>${b.clientW}` : "", (b.overlaps || []).join(" ; "), (b.outside || []).join(" ; "), (b.gridIssues || []).join(" ; "), (b.low || []).join(" ; "));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
