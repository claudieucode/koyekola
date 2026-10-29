// Palier 14 — responsive : défauts reproduits dans Chrome ET Firefox (fenêtres redimensionnées, pas des appareils physiques) puis corrigés.
//  R1 /blog : le formulaire de recherche dépassait de l'écran (min-width: auto = largeur intrinsèque du champ + bouton, 330 px dans 280 px) ;
//  R2 /marketing/pages : même cause (champ min-width 200 px + bouton) ; R3 champ de recherche de l'en-tête : cible de 18 px (le pill portait le padding) ;
//  R4 liens « Tout voir / Ouvrir » et « retour » du tableau de bord : 22 px de haut ; R5 pastilles du carrousel : 10×10 px (WCAG 2.5.8, 24 px).
// Plus : l'aperçu de l'éditeur (ordinateur, tablette, mobile) applique les mêmes règles @media que la page publiée, et changer d'appareil ne modifie pas les données.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const FIREFOX = process.env.FIREFOX_PATH || ["/Applications/Firefox.app/Contents/MacOS/firefox", "/usr/bin/firefox", "/usr/lib/firefox/firefox"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const WIDTHS = [320, 390, 768, 820, 1024];

const CAROUSEL = { sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "cont00000001", type: "container", children: [
    { id: "head00000001", type: "heading", props: { text: "Titre adaptatif", level: 2 }, styles: { desktop: { fontSize: "40px" }, tablet: { fontSize: "30px" }, mobile: { fontSize: "20px" } } },
    { id: "carr00000001", type: "carousel", props: { images: [{ src: "https://example.com/1.jpg", alt: "Un" }, { src: "https://example.com/2.jpg", alt: "Deux" }, { src: "https://example.com/3.jpg", alt: "Trois" }] } },
  ] }] }] };

// Mesure exécutée dans la page
const MESURE = `(() => {
  const vw = window.innerWidth, d = document.documentElement;
  const q = (s) => document.querySelector(s); const h = (s) => { const e = q(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
  return { vw, doc: d.scrollWidth, blog: (() => { const e = q(".blog-search"); return e ? Math.round(e.getBoundingClientRect().right) : null; })(), ar: (() => { const e = q(".mk-ar-search"); return e ? Math.round(e.getBoundingClientRect().right) : null; })(),
    hq: h("#header-q"), back: h(".g-back"), dots: [...document.querySelectorAll(".kw-carousel-dot")].map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }),
    fs: (() => { const e = q('[data-node-id="head00000001"], .kw-heading, h2'); return e ? getComputedStyle(e).fontSize : null; })() };
})()`;

describe("responsive : Chrome et Firefox (fenêtres redimensionnées)", { skip: SKIP }, () => {
  let srv, boss, browser, ctx, page, pageId, slug;
  let ff = null; // { send, context, ws, child, profile }
  const FF = process.env.PALIER14_SANS_FIREFOX ? null : FIREFOX;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    pageId = Number((await boss.post("/marketing/pages", { name: "Responsive" })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: CAROUSEL }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    assert.equal((await boss.postJson(`/marketing/pages/${pageId}/publier.json`, {})).status, 200);
    slug = srv.db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await ctx.newPage();
    if (FF && typeof WebSocket === "function") {
      const port = await new Promise((res) => { const s = net.createServer().listen(0, "127.0.0.1", () => { const { port: p } = s.address(); s.close(() => res(p)); }); });
      const profile = fs.mkdtempSync(path.join(os.tmpdir(), "kb-p14-"));
      const child = spawn(FF, ["--headless", "--no-remote", `--remote-debugging-port=${port}`, "--profile", profile, "about:blank"], { stdio: "ignore" });
      let ws = null;
      for (let i = 0; i < 80 && !ws; i++) { await wait(250); ws = await new Promise((res) => { const w = new WebSocket(`ws://127.0.0.1:${port}/session`); w.addEventListener("open", () => res(w)); w.addEventListener("error", () => res(null)); }); }
      if (ws) {
        let id = 0; const waiting = new Map();
        ws.addEventListener("message", (m) => { const x = JSON.parse(m.data); const w = waiting.get(x.id); if (w) { waiting.delete(x.id); x.type === "success" ? w.ok(x.result) : w.ko(new Error(x.error + " " + x.message)); } });
        const send = (method, params = {}) => new Promise((ok, ko) => { const i = ++id; waiting.set(i, { ok, ko }); ws.send(JSON.stringify({ id: i, method, params })); });
        await send("session.new", { capabilities: { alwaysMatch: {} } });
        const context = (await send("browsingContext.getTree", {})).contexts[0].context;
        await send("browsingContext.navigate", { context, url: `${srv.base}/connexion`, wait: "complete" });
        for (const [name, value] of boss.cookies) await send("storage.setCookie", { cookie: { name, value: { type: "string", value }, domain: "localhost", path: "/", httpOnly: true, sameSite: "lax" }, partition: { type: "context", context } });
        ff = { send, context, ws, child, profile };
      } else child.kill("SIGKILL");
    }
  });
  after(async () => {
    if (browser) await browser.close();
    if (ff) { try { ff.ws.close(); } catch { /* */ } ff.child.kill("SIGKILL"); try { fs.rmSync(ff.profile, { recursive: true, force: true }); } catch { /* */ } }
    if (srv) await srv.stop();
  });

  const plain = (rv) => { if (!rv) return undefined; if (rv.type === "string") return rv.value; return rv.value; };
  // Mesure la page `url` à la largeur `w` ; navigateur = "chrome" | "firefox"
  const measure = async (nav, url, w, h = 900) => {
    if (nav === "chrome") { await page.setViewportSize({ width: w, height: h }); await page.goto(srv.base + url, { waitUntil: "load" }); await wait(350); return page.evaluate(MESURE); }
    await ff.send("browsingContext.setViewport", { context: ff.context, viewport: { width: w, height: h } });
    await ff.send("browsingContext.navigate", { context: ff.context, url: srv.base + url, wait: "complete" }); await wait(450);
    const r = await ff.send("script.evaluate", { expression: `JSON.stringify(${MESURE})`, target: { context: ff.context }, awaitPromise: false });
    return JSON.parse(plain(r.result));
  };
  const navs = () => (ff ? ["chrome", "firefox"] : ["chrome"]);

  test("blog : la recherche et la page ne dépassent jamais la fenêtre (320 → 1024 px)", async () => {
    for (const nav of navs()) for (const w of WIDTHS) {
      const m = await measure(nav, "/blog", w);
      assert.ok(m.doc <= m.vw + 1, `${nav} ${w}px : la page déborde (${m.doc}px)`);
      assert.ok(m.blog <= m.vw, `${nav} ${w}px : le formulaire de recherche sort de la fenêtre (bord droit ${m.blog}px)`);
    }
  });

  test("administration (pages du site) : la recherche tient dans la fenêtre à 320 et 390 px", async () => {
    for (const w of [320, 390]) {
      const m = await measure("chrome", "/marketing/pages", w);
      assert.ok(m.doc <= m.vw + 1, `chrome ${w}px : la page déborde (${m.doc}px)`);
      if (m.ar !== null) assert.ok(m.ar <= m.vw, `chrome ${w}px : recherche hors fenêtre (${m.ar}px)`);
    }
    if (ff) { const m = await measure("firefox", "/marketing/pages", 320); assert.ok(m.doc <= m.vw + 1, `firefox 320px : la page déborde (${m.doc}px)`); if (m.ar !== null) assert.ok(m.ar <= m.vw, `firefox 320px : recherche hors fenêtre (${m.ar}px)`); }
  });

  test("cibles tactiles : champ de recherche de l'en-tête, liens du tableau de bord et pastilles du carrousel font au moins 24 px", async () => {
    for (const nav of navs()) {
      const e = await measure(nav, "/", 1180, 820);
      if (e.hq) assert.ok(e.hq[1] >= 24, `${nav} : champ de l'en-tête ${e.hq[1]}px de haut`);
      const g = await measure(nav, "/formateur/gestion", 390, 844);
      if (g.back) assert.ok(g.back[1] >= 24, `${nav} : lien retour ${g.back[1]}px de haut`);
      const c = await measure(nav, `/p/${slug}`, 390, 844);
      assert.ok(c.dots.length >= 3, `${nav} : pastilles du carrousel présentes`);
      for (const [dw, dh] of c.dots) assert.ok(dw >= 24 && dh >= 24, `${nav} : pastille ${dw}×${dh}px`);
    }
  });

  test("page publiée : la taille du titre suit les points de rupture (ordinateur 40, tablette 30, mobile 20) dans chaque navigateur", async () => {
    for (const nav of navs()) {
      const sizes = {};
      for (const w of [1440, 820, 390]) sizes[w] = (await measure(nav, `/p/${slug}`, w)).fs;
      assert.deepEqual(sizes, { 1440: "40px", 820: "30px", 390: "20px" }, nav);
    }
  });

  test("aperçu de l'éditeur : chaque appareil a la largeur annoncée, applique les mêmes règles que la page publiée, sans modifier les données", async () => {
    const before = srv.db().prepare("SELECT draft, revision FROM mk_landing_pages WHERE id = ?").get(pageId);
    await page.setViewportSize({ width: 1600, height: 950 });
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(700);
    const got = {};
    for (const [dev, wide, size] of [["desktop", null, "40px"], ["tablet", 820, "30px"], ["mobile", 390, "20px"]]) {
      await page.locator(`.pb-devices [data-device="${dev}"]`).click(); await wait(700);
      const r = await page.evaluate(() => { const f = document.querySelector("[data-pb-frame]"); const e = f.contentDocument.querySelector('[data-node-id="head00000001"]'); return { w: f.contentWindow.innerWidth, fs: getComputedStyle(e).fontSize }; });
      got[dev] = r;
      if (wide) assert.equal(r.w, wide, `${dev} : largeur du cadre`);
      assert.equal(r.fs, size, `${dev} : taille du titre dans l'aperçu = page publiée`);
    }
    assert.ok(got.desktop.w >= 1024 && got.desktop.w < 1920, `ordinateur : largeur du cadre ${got.desktop.w}`);
    await wait(1500);
    const after = srv.db().prepare("SELECT draft, revision FROM mk_landing_pages WHERE id = ?").get(pageId);
    assert.deepEqual(JSON.parse(after.draft), JSON.parse(before.draft), "changer d'appareil ne modifie pas le brouillon");
    assert.equal(after.revision, before.revision, "ni la révision");
  });
});
