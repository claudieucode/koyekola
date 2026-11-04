// Contrôle visuel par lots des 100 en-têtes du Theme Builder (aperçu réel du catalogue) : 3 largeurs (1280 / 820 / 390 px), capture + mesures
// (débordement horizontal, chevauchements, éléments hors écran, contraste WCAG < 3), puis 5 vraies pages publiées (collant qui colle, superposé, sous-menu au survol, menu mobile).
// Usage : node scripts/audit-entetes.js <dossier de sortie> [clé-de-modèle,clé…]   (LIVE_ONLY=1 : seulement les pages publiées)
// Prérequis : playwright-core (non installé par défaut : `npm i --no-save playwright-core`) et Chrome (CHROME_PATH). Le démarrage du serveur de test peut dépasser 2 min : TEST_START_TIMEOUT_MS=900000.
const path = require("path"), fs = require("fs");
const REPO = path.join(__dirname, "..");
const { startServer, loginInstructor } = require(path.join(REPO, "tests/helpers"));
let chromium; try { ({ chromium } = require("playwright-core")); } catch { console.error("playwright-core absent : npm i --no-save playwright-core"); process.exit(2); }
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const Catalog = require(path.join(REPO, "src/themeBuilder/catalog"));
const { TEST_KEY } = require(path.join(REPO, "tests/marketing-helpers"));

const OUT = process.argv[2] || path.join(require("os").tmpdir(), "audit-entetes");
const ONLY = process.argv[3] ? process.argv[3].split(",") : null;
const VPS = [["desktop", 1280, 800], ["tablette", 820, 900], ["mobile", 390, 800]];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const site = Number((await boss.post("/marketing/site-web/sites", { name: "Audit" })).location.match(/sites\/(\d+)/)[1]);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const report = [];
  const entries = process.env.LIVE_ONLY ? [] : Catalog.entries("header").filter((e) => !ONLY || ONLY.includes(e.layoutId) || ONLY.includes(e.key));
  for (const [vname, w, h] of VPS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    await ctx.addCookies([...boss.cookies].map(([n, v]) => ({ name: n, value: v, url: srv.base })));
    const pg = await ctx.newPage();
    for (const e of entries) {
      const url = `${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme/api/bibliotheque/header/${e.key}/apercu`;
      const r = { key: e.key, name: e.name, vp: vname };
      try {
        await pg.goto(url, { waitUntil: "load" });
        const m = await pg.evaluate(() => {
          const root = document.querySelector(".kw-theme-part");
          if (!root) return { missing: true };
          const vis = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 1 && r.height > 1 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0"; };
          const SEL = "a,button,img,input,p,span,h1,h2,h3,svg";
          const leaves = [...root.querySelectorAll(SEL)].filter((el) => vis(el) && !(el.parentElement && el.parentElement.closest(SEL) && root.contains(el.parentElement.closest(SEL))));
          const rects = leaves.map((el) => { const r = el.getBoundingClientRect(); return { t: el.tagName, x: r.left, y: r.top, w: r.width, h: r.height, txt: (el.textContent || "").trim().slice(0, 24) }; });
          const overlaps = [];
          for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
            const a = rects[i], b = rects[j];
            const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
            if (ox > 3 && oy > 3) overlaps.push(`${a.t}"${a.txt}"×${b.t}"${b.txt}"`);
          }
          const out = rects.filter((r) => r.x < -1 || r.x + r.w > innerWidth + 1).map((r) => `${r.t}"${r.txt}"`);
          // Contraste texte / fond (WCAG) : couleur du texte contre le premier fond opaque trouvé en remontant ; fond blanc de la page sinon
          const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(",").map((x) => parseFloat(x)); return { r, g, b, a }; };
          const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
          const bgOf = (el) => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0.85) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
          const low = [];
          for (const el of root.querySelectorAll("a,button,p,span,h1,h2,h3,label")) {
            if (!vis(el) || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
            const fg = parse(getComputedStyle(el).color), bg = bgOf(el); if (!fg) continue;
            const L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
            if (ratio < 3) low.push(`${(el.textContent || "").trim().slice(0, 18)} ${ratio.toFixed(1)}`);
          }
          const rb = root.getBoundingClientRect();
          return { low: low.slice(0, 4), scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, height: Math.round(rb.height), top: Math.round(rb.top), items: rects.length, overlaps: overlaps.slice(0, 4), outside: out.slice(0, 4),
            logo: !!root.querySelector("img, .lp-sitelogo, [class*='logo']"), menu: !!root.querySelector("nav, [class*='menu']") };
        });
        Object.assign(r, m);
        await pg.screenshot({ path: path.join(OUT, `${e.key}.${vname}.png`), clip: { x: 0, y: 0, width: w, height: Math.min(h, Math.max(90, (m.height || 90) + 30)) } });
      } catch (err) { r.error = String(err.message).slice(0, 160); }
      report.push(r);
    }
    await ctx.close();
  }

  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 1));
  // ── Phase 2 : vraies pages publiées (collant, superposé, sous-menu, menu mobile) ──────────────────────────────────────────────────────────────────────────────
  const live = [];
  const R = "/marketing/site-web", origin = { Origin: srv.base };
  const db = srv.db();
  const CASES = [["plain", "classique-logo-menu-bouton.clair"], ["sticky", "collant-classique.clair"], ["glass", "saas-verre-depoli.clair"], ["overlay", "superpose-classique.nuit"], ["sticky2", "collant-deux-rangees.marque"]];
  let L = null;
  const setup = async () => {
    const sid = Number((await boss.post(`${R}/sites`, { name: "Live" })).location.match(/sites\/(\d+)/)[1]);
    const created = await boss.post(`${R}/navigation/menus?site=${sid}`, { name: "Principal" });
    const mid = Number(created.location.match(/menus\/(\d+)|menu=(\d+)/).slice(1).find(Boolean));
    const rev = db.prepare("SELECT revision FROM nav_menus WHERE id = ?").get(mid).revision;
    const items = [{ type: "custom", label: "Accueil", url: "/" }, { type: "custom", label: "Services", url: "/x", children: [{ type: "custom", label: "Conseil", url: "/c" }, { type: "custom", label: "Suivi", url: "/s" }] }, { type: "custom", label: "Contact", url: "/contact" }];
    await boss.request(`${R}/navigation/menus/${mid}/enregistrer?site=${sid}`, { method: "POST", json: { revision: rev, status: "published", items }, headers: origin });
    db.prepare("DELETE FROM nav_locations WHERE site_id IS ? AND location = ?").run(sid, "header"); db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, ?, ?)").run(sid, "header", mid);
    const cp = await boss.post("/marketing/pages", { name: "Longue", site_id: sid, kind: "page", template: "", ouvrir: "editeur" });
    const pm0 = String(cp.location || "").match(/pages\/(\d+)/); if (!pm0) throw new Error("page ? " + cp.status + " " + cp.location);
    const pid = Number(pm0[1]);
    const prev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pid).revision;
    const secs = [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", props: { full: true }, styles: { desktop: { minHeight: "700px", backgroundColor: "#1e293b", color: "#ffffff", paddingTop: "140px" } }, children: [{ id: "head00000001", type: "heading", props: { text: "VISUEL D'OUVERTURE", level: "1" } }] }, { id: "cont00000002", type: "container", styles: { desktop: { minHeight: "2400px" } }, children: [{ id: "head00000002", type: "heading", props: { text: "CORPS", level: "2" } }] }] }];
    await boss.request(`/marketing/pages/${pid}/brouillon`, { method: "PUT", headers: origin, json: { revision: prev, content: { title: "Longue", sections: secs } } });
    await boss.request(`/marketing/pages/${pid}/publier.json`, { method: "POST", json: {}, headers: origin });
    return { sid, slug: db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pid).slug };
  };
  for (const [mode, key] of (ONLY ? [] : CASES)) {
    if (!L) L = await setup();
    const { sid, slug } = L;
    const T = `${R}/sites/${sid}/constructeur-de-theme`;
    const used = await boss.request(`${T}/api/bibliotheque/utiliser`, { method: "POST", json: { type: "header", key }, headers: origin });
    const tpl = JSON.parse(used.text).template;
    const pub = await boss.request(`${T}/api/modeles/${tpl.id}/publier`, { method: "POST", json: { replace: true }, headers: origin });
    const sv = { status: 200 }, sv2 = { status: 200 }, pb = { status: 200 };
    const r = { mode, key, statuts: [used.status, pub.status] };
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const pg = await ctx.newPage();
    await pg.goto(`${srv.base}/p/${slug}`, { waitUntil: "load" });
    const rect = () => pg.evaluate(() => { const h = document.querySelector(".lp-site-header"); if (!h) return null; const r = h.getBoundingClientRect(); const first = document.querySelector("[class*='lp-block-layout']:not(.lp-site-header)"); const c = first ? first.getBoundingClientRect() : null; return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), contentTop: c ? Math.round(c.top) : null, pos: getComputedStyle(h).position, kidPos: h.firstElementChild ? getComputedStyle(h.firstElementChild).position : null }; });
    r.top0 = await rect();
    await pg.screenshot({ path: path.join(OUT, `live-${mode}.top.png`), clip: { x: 0, y: 0, width: 1280, height: 400 } });
    await pg.evaluate(() => window.scrollTo(0, 1500)); await pg.waitForTimeout(300);
    r.scrolled = await rect();
    await pg.screenshot({ path: path.join(OUT, `live-${mode}.scrolled.png`), clip: { x: 0, y: 0, width: 1280, height: 200 } });
    await pg.evaluate(() => window.scrollTo(0, 0));
    // sous-menu : survol de « Services »
    const svc = pg.locator(".lp-site-header >> text=Services").first();
    if (await svc.count()) { await svc.hover(); await pg.waitForTimeout(250); r.submenu = await pg.evaluate(() => { const a = [...document.querySelectorAll(".lp-site-header a")].find((x) => /Conseil/.test(x.textContent)); if (!a) return "absent"; const b = a.getBoundingClientRect(), cs = getComputedStyle(a); return b.width > 0 && b.height > 0 && cs.visibility !== "hidden" ? "visible" : "caché"; }); await pg.screenshot({ path: path.join(OUT, `live-${mode}.submenu.png`), clip: { x: 0, y: 0, width: 1280, height: 320 } }); } else r.submenu = "pas de Services";
    await ctx.close();
    // mobile : bouton de menu
    const cm = await browser.newContext({ viewport: { width: 390, height: 800 } });
    const pm = await cm.newPage(); await pm.goto(`${srv.base}/p/${slug}`, { waitUntil: "load" });
    r.mobile = await pm.evaluate(() => { const h = document.querySelector(".lp-site-header"); const btn = h && h.querySelector("button[aria-expanded], .kw-menu-toggle, [class*='toggle']"); return { scrollW: document.documentElement.scrollWidth, toggle: !!btn, toggleVisible: btn ? btn.getBoundingClientRect().width > 0 : false }; });
    await pm.screenshot({ path: path.join(OUT, `live-${mode}.mobile.png`), clip: { x: 0, y: 0, width: 390, height: 300 } });
    const tg = pm.locator(".lp-site-header button[aria-expanded]").first();
    if (await tg.count()) { await tg.click(); await pm.waitForTimeout(300); r.mobile.opened = await pm.evaluate(() => { const a = [...document.querySelectorAll(".lp-site-header a")].find((x) => /Contact/.test(x.textContent)); return !!a && a.getBoundingClientRect().height > 0; }); await pm.screenshot({ path: path.join(OUT, `live-${mode}.mobile-open.png`), clip: { x: 0, y: 0, width: 390, height: 400 } }); }
    await cm.close();
    live.push(r);
  }
  fs.writeFileSync(path.join(OUT, "live.json"), JSON.stringify(live, null, 1));
  console.log("LIVE", JSON.stringify(live));
  await browser.close(); await srv.stop();
  const bad = report.filter((r) => (r.low && r.low.length && !r.key.startsWith("superpose-")) || r.error || r.missing || r.scrollW > r.clientW + 1 || (r.overlaps && r.overlaps.length) || (r.outside && r.outside.length));
  console.log(`total ${report.length} · défauts ${bad.length}`);
  for (const b of bad) console.log(b.vp, b.key, b.error || b.missing ? "ERR/MISSING" : "", b.scrollW > b.clientW + 1 ? `overflow ${b.scrollW}>${b.clientW}` : "", (b.overlaps || []).join(" ; "), (b.outside || []).join(" ; "), (b.low || []).length && !b.key.startsWith("superpose-") ? "contraste: " + b.low.join(" | ") : "");
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
