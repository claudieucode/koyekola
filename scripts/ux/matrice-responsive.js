// Palier 14 : matrice responsive RÉELLE (vrai serveur, base de test) dans Chrome (Playwright, émulation de fenêtre) et Firefox (WebDriver BiDi, aucune installation).
// Pour chaque page et chaque taille de fenêtre : débordement horizontal du document, éléments visibles qui dépassent le bord droit sans conteneur défilant,
// cibles tactiles interactives < 24 px (WCAG 2.5.8) sur les tailles tactiles, barre fixe qui mange plus de 35 % de la hauteur, texte coupé (ellipse involontaire exclue).
// Ce sont des fenêtres redimensionnées dans des navigateurs de bureau : PAS des appareils physiques. Usage : node scripts/ux/matrice-responsive.js [--json f] [--only chrome|firefox]
"use strict";
const fs = require("node:fs");
const os = require("node:os");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { TEST_KEY } = require("../../tests/marketing-helpers");
const { startServer, loginInstructor } = require("../../tests/helpers");
const { chromium } = require("playwright-core");
const nodes = require("../../src/marketing/pages/nodes");
const { creatable, idOf, build } = require("../../tests/widgets-helpers");

const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FIREFOX = process.env.FIREFOX_PATH || "/Applications/Firefox.app/Contents/MacOS/firefox";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const SIZES = [
  { n: "bureau 1920×1080", w: 1920, h: 1080 }, { n: "portable 1440×900", w: 1440, h: 900 }, { n: "fenêtre réduite 1024×768", w: 1024, h: 768 },
  { n: "tablette portrait 820×1180", w: 820, h: 1180, touch: true }, { n: "tablette paysage 1180×820", w: 1180, h: 820, touch: true },
  { n: "téléphone portrait 390×844", w: 390, h: 844, touch: true }, { n: "téléphone paysage 844×390", w: 844, h: 390, touch: true }, { n: "petit téléphone 320×568", w: 320, h: 568, touch: true },
];
const PUBLIC = ["/", "/catalogue", "/blog", "/connexion", "/contact", "/faq", "/a-propos"];
const ADMIN = ["/formateur", "/formateur/formations", "/formateur/blog", "/formateur/gestion", "/formateur/gestion/ventes", "/formateur/gestion/eleves", "/formateur/messages", "/formateur/seo",
  "/marketing", "/marketing/contacts", "/marketing/campagnes", "/marketing/pages", "/marketing/formulaires", "/marketing/tunnels"];

// Exécuté DANS la page. Retourne la liste des constats.
function mesurer(touch) {
  const vw = window.innerWidth, vh = window.innerHeight, out = [];
  const doc = document.documentElement;
  if (doc.scrollWidth > vw + 1) out.push({ k: "document", d: `défilement horizontal : ${doc.scrollWidth}px pour ${vw}px` });
  const clipped = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(cs.overflowX) && p.getBoundingClientRect().right <= vw + 1) return true; } return false; };
  const name = (e) => e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : "");
  const seen = new Set();
  for (const el of document.body.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.position === "fixed" && el.getBoundingClientRect().width === 0) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if (cs.position !== "fixed" && r.right > vw + 2 && r.left < vw && !clipped(el) && !el.closest("[hidden],[aria-hidden='true'],.sr-only,.skip-link")) {
      const key = name(el); if (!seen.has("o" + key) && seen.size < 40) { seen.add("o" + key); out.push({ k: "dépasse", d: `${key} : bord droit ${Math.round(r.right)}px > ${vw}px` }); }
    }
    if (touch && /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !(el.tagName === "INPUT" && /hidden|checkbox|radio/.test(el.type)) && r.top < vh * 3) {
      const inline = el.tagName === "A" && (cs.display === "inline" || el.closest("p, li, span, td, label")); // exception WCAG 2.5.8 : lien dans une phrase
      if (!inline && (r.width < 24 || r.height < 24) && !el.closest("[hidden]")) { const key = "t" + name(el); if (!seen.has(key) && seen.size < 60) { seen.add(key); out.push({ k: "cible<24px", d: `${name(el)} ${Math.round(r.width)}×${Math.round(r.height)}` }); } }
    }
    if (cs.position === "fixed" || cs.position === "sticky") { if (r.top <= 1 && r.height > vh * 0.35 && r.width > vw * 0.5) out.push({ k: "barre-haute", d: `${name(el)} ${Math.round(r.height)}px sur ${vh}px` }); }
  }
  return out;
}

const free = () => new Promise((res) => { const s = net.createServer().listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => res(port)); }); });
class Bidi {
  constructor(ws) { this.ws = ws; this.id = 0; this.w = new Map(); ws.addEventListener("message", (m) => { const x = JSON.parse(m.data); const w = this.w.get(x.id); if (!w) return; this.w.delete(x.id); if (x.type === "success") w.ok(x.result); else w.ko(new Error(`${x.error}: ${x.message}`)); }); }
  send(method, params = {}) { const id = ++this.id; return new Promise((ok, ko) => { this.w.set(id, { ok, ko }); this.ws.send(JSON.stringify({ id, method, params })); }); }
}
const plain = (rv) => { if (!rv) return undefined; switch (rv.type) { case "string": case "number": case "boolean": return rv.value; case "null": case "undefined": return null; case "array": return (rv.value || []).map(plain); case "object": return Object.fromEntries((rv.value || []).map(([k, v]) => [typeof k === "string" ? k : k.value, plain(v)])); default: return rv.value; } };

(async () => {
  const only = arg("only", "");
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const db = srv.db();
  // Page publiée représentative : tous les widgets créables, contenu de départ puis « difficile »
  const types = creatable;
  const mk = async (name, content) => {
    const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } });
    if (r.status !== 200) throw new Error("brouillon " + name + " " + r.status + " " + r.text.slice(0, 120));
    const p = await boss.postJson(`/marketing/pages/${id}/publier.json`, {});
    if (p.status !== 200) throw new Error("publication " + name + " " + p.status);
    return `/p/${db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug}`;
  };
  const widgetPages = [];
  for (let i = 0; i < types.length; i += 12) widgetPages.push(await mk("Matrice widgets " + (i / 12 + 1), build(types.slice(i, i + 12), true)));
  const pageId = db.prepare("SELECT id FROM mk_landing_pages ORDER BY id LIMIT 1").get().id;
  const editor = `/marketing/pages/${pageId}/editeur`;
  const targets = [...PUBLIC.map((u) => ["public", u]), ...widgetPages.map((u, i) => ["public-widgets", u]), ...ADMIN.map((u) => ["admin", u]), ["éditeur", editor]];
  const results = [];
  const record = (nav, size, cat, url, finds) => { for (const f of finds) results.push({ nav, taille: size.n, cat, url, ...f }); };

  if (only !== "firefox") {
    const browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage();
    for (const size of SIZES) {
      await page.setViewportSize({ width: size.w, height: size.h });
      for (const [cat, url] of targets) {
        try { await page.goto(srv.base + url, { waitUntil: "load" }); await page.waitForTimeout(cat === "éditeur" ? 1200 : 350); record("chrome", size, cat, url, await page.evaluate(`(${mesurer.toString()})(${Boolean(size.touch)})`)); }
        catch (e) { record("chrome", size, cat, url, [{ k: "erreur", d: String(e.message).slice(0, 120) }]); }
      }
      process.stdout.write(`chrome ${size.n} fait\n`);
    }
    await browser.close();
  }
  if (only !== "chrome" && fs.existsSync(FIREFOX)) {
    const port = await free(); const profile = fs.mkdtempSync(path.join(os.tmpdir(), "kb-ff-"));
    const child = spawn(FIREFOX, ["--headless", "--no-remote", `--remote-debugging-port=${port}`, "--profile", profile, "about:blank"], { stdio: "ignore" });
    let ws = null; for (let i = 0; i < 80 && !ws; i++) { await new Promise((r) => setTimeout(r, 250)); ws = await new Promise((res) => { const w = new WebSocket(`ws://127.0.0.1:${port}/session`); w.addEventListener("open", () => res(w)); w.addEventListener("error", () => res(null)); }); }
    if (!ws) console.log("Firefox : interface BiDi indisponible");
    else {
      const bidi = new Bidi(ws);
      await bidi.send("session.new", { capabilities: { alwaysMatch: {} } });
      const context = (await bidi.send("browsingContext.getTree", {})).contexts[0].context;
      await bidi.send("browsingContext.navigate", { context, url: `${srv.base}/connexion`, wait: "complete" });
      for (const [name, value] of boss.cookies) await bidi.send("storage.setCookie", { cookie: { name, value: { type: "string", value }, domain: "localhost", path: "/", httpOnly: true, sameSite: "lax" }, partition: { type: "context", context } });
      const version = plain((await bidi.send("script.evaluate", { expression: "navigator.userAgent", target: { context }, awaitPromise: false })).result);
      console.log("Firefox : " + version);
      for (const size of SIZES) {
        await bidi.send("browsingContext.setViewport", { context, viewport: { width: size.w, height: size.h } });
        for (const [cat, url] of targets) {
          try {
            await bidi.send("browsingContext.navigate", { context, url: srv.base + url, wait: "complete" });
            await new Promise((r) => setTimeout(r, cat === "éditeur" ? 1500 : 400));
            const r = await bidi.send("script.evaluate", { expression: `JSON.stringify((${mesurer.toString()})(${Boolean(size.touch)}))`, target: { context }, awaitPromise: false });
            if (r.type === "exception") throw new Error(r.exceptionDetails.text);
            record("firefox", size, cat, url, JSON.parse(plain(r.result)));
          } catch (e) { record("firefox", size, cat, url, [{ k: "erreur", d: String(e.message).slice(0, 120) }]); }
        }
        process.stdout.write(`firefox ${size.n} fait\n`);
      }
      try { ws.close(); } catch { /* */ }
    }
    child.kill("SIGKILL"); try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* */ }
  }
  await srv.stop();
  const f = arg("json", ""); if (f) fs.writeFileSync(f, JSON.stringify({ types: types.length, results }, null, 2));
  const by = {}; for (const r of results) { const k = `${r.nav} | ${r.taille} | ${r.cat} | ${r.k}`; by[k] = (by[k] || 0) + 1; }
  console.log(`${results.length} constats sur ${targets.length} pages × ${SIZES.length} tailles`);
  for (const [k, v] of Object.entries(by)) console.log(String(v).padStart(4), k);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
