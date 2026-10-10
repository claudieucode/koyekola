// Banc d'essai de performance de l'éditeur KOLAKISA (lecture seule : aucun fichier de production modifié).
// Usage : node bench.js [20,100,300,400]
const path = require("path");
const fs = require("fs");
const REPO = path.join(__dirname, "..", "..", "..");
const { chromium } = require("playwright-core");
const { startServer, loginInstructor } = require(path.join(REPO, "tests/helpers"));
const { TEST_KEY } = require(path.join(REPO, "tests/marketing-helpers"));
const CHROME = (process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
const SIZES = (process.argv[2] || "20,100,300,400").split(",").map(Number);
const OUT = process.argv[3] || path.join(__dirname, "results.json");

// Document de N éléments environ : sections libres > conteneur > titres / textes / boutons
function makeContent(target) {
  let n = 0, k = 0;
  const id = () => "n" + String(++k).padStart(11, "0");
  const sections = [];
  const leaf = (i) => {
    n++;
    if (i % 3 === 0) return { id: id(), type: "heading", props: { text: "Titre numéro " + i, level: "2" } };
    if (i % 3 === 1) return { id: id(), type: "text", props: { html: "<p>Paragraphe numéro " + i + " avec un peu de texte pour occuper de la place dans la page.</p>" } };
    return { id: id(), type: "button", props: { label: "Bouton " + i, url: "/catalogue", variant: "primary" } };
  };
  let i = 0;
  while (n < target) {
    const boxes = [];
    n += 1; // section
    for (let b = 0; b < 4 && n < target; b++) {
      const kids = [];
      n += 1; // conteneur
      for (let j = 0; j < 7 && n < target + 6; j++) kids.push(leaf(i++));
      boxes.push({ id: id(), type: "container", props: {}, children: kids });
    }
    sections.push({ id: id(), type: "layout", children: boxes });
  }
  return { sections, count: n };
}

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const p95 = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * 0.95))] : null; };
const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);

async function runSize(srv, boss, browser, target) {
  const res = { target };
  const context = await browser.newContext({ viewport: { width: 1500, height: 900 } });
  await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push("console: " + m.text()); });

  const pageId = Number((await boss.post("/marketing/pages", { name: "Perf " + target })).location.match(/(\d+)$/)[1]);
  const revision = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
  const { sections, count } = makeContent(target);
  res.nodes = count;
  const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: { sections } }, headers: { Origin: srv.base } });
  if (put.status !== 200) throw new Error("PUT brouillon " + put.status + " " + JSON.stringify(put.body || put.text).slice(0, 300));

  // Instruments injectés avant le chargement : fetch journalisé, tâches longues, évènements lents
  await page.addInitScript(() => {
    window.__net = [];
    const of = window.fetch;
    window.fetch = function (url, opts) {
      const t0 = performance.now();
      const reqBytes = opts && opts.body ? String(opts.body).length : 0;
      return of.apply(this, arguments).then((r) => {
        const c = r.clone();
        c.text().then((t) => window.__net.push({ url: String(url), method: (opts && opts.method) || "GET", reqBytes, resBytes: t.length, ms: performance.now() - t0, at: t0 }));
        return r;
      });
    };
    window.__long = [];
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push({ d: e.duration, at: e.startTime }))).observe({ type: "longtask", buffered: true }); } catch (e) { /* */ }
    window.__ev = [];
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__ev.push({ n: e.name, d: e.duration, delay: e.processingStart - e.startTime, proc: e.processingEnd - e.processingStart }))).observe({ type: "event", durationThreshold: 16, buffered: true }); } catch (e) { /* */ }
  });

  const t0 = Date.now();
  await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
  await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 60000 });
  res.openMs = Date.now() - t0;
  await page.waitForTimeout(1500);
  res.open = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const f = document.querySelector("[data-pb-frame]");
    return {
      domContentLoaded: nav.domContentLoadedEventEnd, load: nav.loadEventEnd,
      domNodesMain: document.getElementsByTagName("*").length,
      domNodesFrame: f.contentDocument.getElementsByTagName("*").length,
      heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576 * 10) / 10 : null,
      longTasks: window.__long.length, longTaskTotalMs: Math.round(window.__long.reduce((s, x) => s + x.d, 0)),
      longTaskMax: Math.round(Math.max(0, ...window.__long.map((x) => x.d))),
      net: window.__net.map((x) => ({ url: x.url.replace(/^.*\/marketing/, "/marketing"), ms: Math.round(x.ms), res: x.resBytes })),
    };
  });
  res.cssBytesFrame = await page.evaluate(() => [...document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("style")].reduce((s, e) => s + e.textContent.length, 0));
  res.jsResources = await page.evaluate(() => performance.getEntriesByType("resource").filter((r) => /\.(js|css)(\?|$)/.test(r.name)).map((r) => ({ n: r.name.split("/").pop().split("?")[0], b: r.transferSize || r.encodedBodySize || 0, ms: Math.round(r.duration) })).sort((a, b) => b.b - a.b).slice(0, 8));

  // ---- helpers évalués dans la page ----
  const ids = await page.evaluate(() => [...document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("[data-node-id]")].map((e) => e.getAttribute("data-node-id")));
  const sample = (k) => { const out = []; for (let i = 0; i < k; i++) out.push(ids[Math.floor((i + 1) * ids.length / (k + 1))]); return out; };
  const resetLogs = () => page.evaluate(() => { window.__net.length = 0; window.__long.length = 0; window.__ev.length = 0; });
  const readLogs = () => page.evaluate(() => ({
    net: window.__net.map((x) => ({ url: x.url.replace(/^.*\/marketing\/pages\/\d+/, ""), method: x.method, req: x.reqBytes, res: x.resBytes, ms: Math.round(x.ms) })),
    long: window.__long.map((x) => Math.round(x.d)),
    ev: window.__ev.map((x) => ({ n: x.n, d: Math.round(x.d), delay: Math.round(x.delay), proc: Math.round(x.proc) })),
  }));

  // 1) SÉLECTION par clic dans le canevas : coût synchrone (gestionnaire) puis jusqu'à l'image suivante
  res.select = await page.evaluate(async (list) => {
    const f = document.querySelector("[data-pb-frame]"), doc = f.contentDocument;
    const frameTick = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(performance.now()))));
    const sync = [], paint = [];
    for (const id of list) {
      const el = doc.querySelector('[data-node-id="' + id + '"]');
      await frameTick();
      const t = performance.now();
      el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: f.contentWindow }));
      const t1 = performance.now();
      const t2 = await frameTick();
      sync.push(t1 - t); paint.push(t2 - t);
    }
    return { sync, paint };
  }, sample(12));
  // 2) DÉSÉLECTION
  res.deselect = await page.evaluate(async () => {
    const frameTick = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(performance.now()))));
    const f = document.querySelector("[data-pb-frame]");
    const sync = [], paint = [];
    for (let i = 0; i < 6; i++) {
      const el = f.contentDocument.querySelectorAll("[data-node-id]")[i + 3];
      el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: f.contentWindow }));
      await frameTick();
      const b = document.querySelector('[aria-label="Désélectionner"]');
      const t = performance.now(); b.click(); const t1 = performance.now(); const t2 = await frameTick();
      sync.push(t1 - t); paint.push(t2 - t);
    }
    return { sync, paint };
  });
  // 3) SURVOL : coût de 200 mousemove (règles actives et inactives)
  res.hover = {};
  for (const rulers of [false, true]) {
    if (rulers) await page.click('[data-pb-toggle="rulers"]');
    res.hover[rulers ? "rulers" : "norulers"] = await page.evaluate(async () => {
      const f = document.querySelector("[data-pb-frame]"), doc = f.contentDocument;
      const tick = () => new Promise((r) => requestAnimationFrame(() => r(performance.now())));
      const costs = [], frames = [];
      let last = await tick();
      for (let i = 0; i < 120; i++) {
        const t = performance.now();
        doc.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 100 + i * 7, clientY: 120 + (i % 40) * 8, view: f.contentWindow }));
        costs.push(performance.now() - t);
        const now = await tick(); frames.push(now - last); last = now;
      }
      return { perEventMs: costs, frameMs: frames };
    });
    if (rulers) await page.click('[data-pb-toggle="rulers"]');
  }
  // 4) MODIFICATION D'UNE PROPRIÉTÉ via l'inspecteur : un titre, onglet Style, taille de police
  const heads = await page.evaluate(() => [...document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("h2[data-node-id]")].map((e) => e.getAttribute("data-node-id")));
  const H = heads[Math.floor(heads.length / 3)];
  await page.evaluate((id) => { const f = document.querySelector("[data-pb-frame]"); f.contentDocument.querySelector('[data-node-id="' + id + '"]').dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: f.contentWindow })); }, H);
  await page.waitForTimeout(300);
  await page.locator("[data-pb-inspector] [role='tab']", { hasText: "Style" }).first().click();
  await page.evaluate(() => document.querySelectorAll("[data-pb-inspector] details").forEach((d) => { d.open = true; }));
  const openAll = () => page.evaluate(() => document.querySelectorAll("[data-pb-inspector] details").forEach((d) => { d.open = true; }));
  const field = page.locator('[data-pb-inspector] .pb-prop[data-prop="fontSize"] input.pb-len-num');
  await field.waitFor({ timeout: 10000 });
  await page.waitForTimeout(2500); // laisse l'enregistrement automatique et les rendus se terminer
  await resetLogs();
  await field.click();
  await page.keyboard.press("Meta+A");
  await page.keyboard.type("30");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(2500);
  res.styleOnce = await readLogs();
  // latence de bout en bout : touche → texte réellement modifié dans le canevas
  res.styleLatency = [];
  for (let i = 0; i < 6; i++) {
    const want = 31 + i;
    await page.evaluate((id) => { window.__t0 = null; document.addEventListener("keydown", () => { if (window.__t0 === null) window.__t0 = performance.now(); }, { once: true, capture: true }); }, H);
    if (!(await field.count())) { res.debug = await page.evaluate(() => ({ tab: document.querySelector("[data-pb-inspector] [aria-selected=true]")?.textContent, html: document.querySelector("[data-pb-inspector]").innerText.slice(0, 300) })); throw new Error("champ disparu iter " + i + " " + JSON.stringify(res.debug)); }
    await openAll(); await field.focus();
    await page.keyboard.press("ArrowUp");
    const ms = await page.evaluate(async ({ id, want }) => {
      const f = document.querySelector("[data-pb-frame]");
      const end = performance.now() + 4000;
      return new Promise((resolve) => {
        const chk = () => {
          const el = f.contentDocument.querySelector('[data-node-id="' + id + '"]');
          const fs = el ? parseFloat(f.contentWindow.getComputedStyle(el).fontSize) : 0;
          if (fs >= want || performance.now() > end) resolve({ ms: performance.now() - window.__t0, fs });
          else requestAnimationFrame(chk);
        };
        chk();
      });
    }, { id: H, want });
    res.styleLatency.push(ms.ms);
    await page.waitForTimeout(400);
  }
  // 5) RAFALE : 40 pressions de ▲ en continu (équivalent d'un curseur qu'on fait glisser)
  await page.waitForTimeout(1500);
  await resetLogs();
  const tb = Date.now();
  await openAll(); await field.focus();
  for (let i = 0; i < 40; i++) await page.keyboard.press("ArrowUp");
  res.burstKeyMs = Date.now() - tb;
  await page.waitForTimeout(3000);
  res.burst = await readLogs();
  res.burstBackupBytes = await page.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.startsWith("pb-backup-")); return k ? localStorage.getItem(k).length : 0; });
  // coût mesuré du backup() + snapshot() (sérialisations complètes du document), appelés à chaque changement
  res.serialize = await page.evaluate(() => {
    const ls = localStorage; const k = "perf-probe";
    const doc = JSON.parse(document.getElementById("pb-boot").textContent);
    const content = { sections: doc.content ? doc.content.sections : (doc.page && doc.page.working ? doc.page.working.sections : []) };
    const s = JSON.stringify(content);
    const t = performance.now(); for (let i = 0; i < 20; i++) JSON.stringify(JSON.parse(s)); const clone = (performance.now() - t) / 20;
    const t2 = performance.now(); for (let i = 0; i < 20; i++) { try { ls.setItem(k, s); } catch (e) { /* */ } } const write = (performance.now() - t2) / 20;
    ls.removeItem(k);
    return { bytes: s.length, cloneMs: clone, stringifyAndStoreMs: write };
  });
  // 6) REDIMENSIONNEMENT par la poignée (souris réelle simulée, une image par déplacement)
  await page.evaluate((id) => { const f = document.querySelector("[data-pb-frame]"); f.contentDocument.querySelector('[data-node-id="' + id + '"]').dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: f.contentWindow })); }, ids[Math.floor(ids.length / 2) + 1]);
  await page.waitForTimeout(600);
  await resetLogs();
  res.resize = await page.evaluate(async () => {
    const f = document.querySelector("[data-pb-frame]"), doc = f.contentDocument, w = f.contentWindow;
    const tick = () => new Promise((r) => requestAnimationFrame(() => r(performance.now())));
    const hd = doc.querySelector(".pb-handle-e");
    if (!hd) return { error: "poignée introuvable" };
    const b = hd.getBoundingClientRect();
    const x0 = b.left + b.width / 2, y0 = b.top + b.height / 2;
    const ev = (type, x, y, tgt) => (tgt || doc).dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, view: w }));
    await tick();
    const t0 = performance.now();
    ev("mousedown", x0, y0, hd);
    const start = performance.now() - t0;
    const frames = [], work = [];
    let last = await tick();
    for (let i = 1; i <= 60; i++) {
      const t = performance.now();
      ev("mousemove", x0 - i * 2, y0);
      work.push(performance.now() - t);
      const now = await tick(); frames.push(now - last); last = now;
    }
    const tu = performance.now();
    ev("mouseup", x0 - 120, y0);
    const up = performance.now() - tu;
    return { startMs: start, upMs: up, frameMs: frames, moveSyncMs: work };
  });
  await page.waitForTimeout(2500);
  res.resizeNet = (await readLogs()).net;
  // 7) ZOOM
  res.zoom = await page.evaluate(async () => {
    const tick = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(performance.now()))));
    const out = {};
    for (const [name, sel] of [["plus", '[data-pb-zoom="+"]'], ["plus2", '[data-pb-zoom="+"]'], ["minus", '[data-pb-zoom="-"]'], ["minus2", '[data-pb-zoom="-"]'], ["minus3", '[data-pb-zoom="-"]'], ["fit", '[data-pb-zoom="fit"]'], ["100", '[data-pb-zoom="100"]']]) {
      await tick();
      const b = document.querySelector(sel);
      const t = performance.now(); b.click(); const t1 = performance.now(); const t2 = await tick();
      out[name] = { sync: t1 - t, paint: t2 - t };
    }
    return out;
  });
  // 8) ANNULER / RÉTABLIR (plusieurs étapes d'historique ont été créées plus haut)
  await page.waitForTimeout(1500);
  await resetLogs();
  res.undoRedo = await page.evaluate(async () => {
    const tick = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(performance.now()))));
    const out = { undo: [], redo: [] };
    for (let i = 0; i < 4; i++) { const b = document.querySelector("[data-pb-undo]"); await tick(); const t = performance.now(); b.click(); const t1 = performance.now(); const t2 = await tick(); out.undo.push({ sync: t1 - t, paint: t2 - t }); }
    for (let i = 0; i < 4; i++) { const b = document.querySelector("[data-pb-redo]"); await tick(); const t = performance.now(); b.click(); const t1 = performance.now(); const t2 = await tick(); out.redo.push({ sync: t1 - t, paint: t2 - t }); }
    return out;
  });
  await page.waitForTimeout(2500);
  // 9) PANNEAUX : Structure fermer/ouvrir ; onglets de l'inspecteur
  res.panels = await page.evaluate(async () => {
    const tick = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(performance.now()))));
    const out = {};
    const b = document.querySelector("[data-pb-layers-open]");
    for (const name of ["structureClose", "structureOpen"]) { await tick(); const t = performance.now(); b.click(); const t1 = performance.now(); const t2 = await tick(); out[name] = { sync: t1 - t, paint: t2 - t }; }
    const tabs = [...document.querySelectorAll("[data-pb-inspector] [role='tab']")];
    out.tabs = [];
    for (const tb of tabs.concat(tabs[0])) { await tick(); const t = performance.now(); tb.click(); const t1 = performance.now(); const t2 = await tick(); out.tabs.push({ name: tb.textContent, sync: t1 - t, paint: t2 - t }); }
    return out;
  });
  // 10) ENREGISTREMENT : taille de la charge utile et durée serveur
  await page.evaluate((id) => { const f = document.querySelector("[data-pb-frame]"); f.contentDocument.querySelector('[data-node-id="' + id + '"]').dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: f.contentWindow })); }, H);
  await page.waitForTimeout(500);
  await page.locator("[data-pb-inspector] [role='tab']", { hasText: "Style" }).first().click();
  await openAll();
  await page.waitForTimeout(2500);
  await resetLogs();
  await field.focus(); await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(3500);
  res.save = (await readLogs()).net;
  res.events = (await readLogs()).ev;
  res.errors = errors;
  res.heapEndMB = await page.evaluate(() => Math.round(performance.memory.usedJSHeapSize / 1048576 * 10) / 10);
  res.domEnd = await page.evaluate(() => ({ main: document.getElementsByTagName("*").length, frame: document.querySelector("[data-pb-frame]").contentDocument.getElementsByTagName("*").length }));
  await context.close();
  return res;
}

(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--enable-precise-memory-info"] });
  const all = [];
  try {
    for (const n of SIZES) {
      console.log("== taille", n);
      try { all.push(await runSize(srv, boss, browser, n)); } catch (e) { console.log("échec", n, e.message); all.push({ target: n, failure: e.message }); }
      fs.writeFileSync(OUT, JSON.stringify(all, null, 1));
    }
  } finally { await browser.close(); await srv.stop(); }
  const sum = (r) => r.failure ? r.failure : { nodes: r.nodes, openMs: r.openMs, selectSync: r1(median(r.select.sync)), selectPaint: r1(median(r.select.paint)), styleLatencyMed: r1(median(r.styleLatency)), burstRender: r.burst.net.filter((x) => /rendu/.test(x.url)).length, burstSave: r.burst.net.filter((x) => /brouillon/.test(x.url)).length };
  console.log(JSON.stringify(all.map(sum), null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
