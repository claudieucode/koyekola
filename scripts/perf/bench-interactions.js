#!/usr/bin/env node
// Banc COMPLÉMENTAIRE du Page Builder : interactions absentes de bench-page-builder.js (survol, désélection, insertion, redimensionnement, zoom, déplacement
// de la vue, ouverture / fermeture de panneaux, curseur) avec, par interaction : intervalles entre images (rAF), tâches longues (Long Tasks API), latence des
// événements (Event Timing), et compteurs du moteur du navigateur (CDP Performance.getMetrics : mises en page, recalculs de style, durées) — de quoi repérer
// les mises en page forcées en rafale. Aucune instrumentation dans le produit.
//   NODE_PATH=<playwright-core> node scripts/perf/bench-interactions.js [--sizes=20,100,300,400] [--json=fichier]
// À indiquer avec les résultats : machine, charge (uptime). Les pages de plus de 400 éléments sont refusées par le produit (limite MAX_NODES).
const fs = require("fs");
const os = require("os");
const { startServer, loginInstructor } = require("../../tests/helpers");
const { TEST_KEY } = require("../../tests/marketing-helpers");
const { chromium } = require("playwright-core");
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split("=")[1] : d; };
const SIZES = arg("sizes", "20,100,300,400").split(",").map(Number);
const JSON_OUT = arg("json", "");
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function makeContent(total) {
  let n = 0, sid = 0;
  const id = (p) => `${p}${String(++n).padStart(9, "0")}`.slice(0, 12);
  const leaf = (i) => {
    const k = i % 6;
    if (k === 0) return { id: id("hd"), type: "heading", props: { text: `Titre ${i}`, level: 3 }, styles: { desktop: { color: "#10222f", fontWeight: "700" }, mobile: { fontSize: "20px" } } };
    if (k === 1) return { id: id("tx"), type: "text", props: { html: `<p>Paragraphe ${i} : <strong>texte</strong> de démonstration avec un <a href="/blog">lien</a> et assez de mots pour occuper une ligne.</p>` } };
    if (k === 2) return { id: id("bt"), type: "button", props: { label: `Bouton ${i}`, url: "/catalogue", variant: "primary" } };
    if (k === 3) return { id: id("im"), type: "image", props: { src: "https://localhost:9/x.jpg", alt: `Image ${i}` } };
    if (k === 4) return { id: id("li"), type: "list", props: { items: ["Un", "Deux", "Trois"], ordered: false } };
    return { id: id("tx"), type: "text", props: { html: `<p>Note ${i}</p>` }, styles: { desktop: { paddingTop: "8px", paddingBottom: "8px" } } };
  };
  const boxes = [];
  let made = 0;
  while (made < total) {
    // une boîte de 8 éléments (conteneur + 4 feuilles + une grille de 3)
    const box = { id: id("cn"), type: "container", styles: { desktop: { paddingTop: "16px", paddingBottom: "16px", backgroundColor: "#f3f8fc" } }, children: [] };
    made++;
    for (let i = 0; i < 4 && made < total; i++) { box.children.push(leaf(made)); made++; }
    if (made + 4 <= total) { const grid = { id: id("gd"), type: "grid", styles: { desktop: { columns: 3, gap: "12px" } }, children: [] }; made++; for (let i = 0; i < 3 && made < total; i++) { grid.children.push(leaf(made)); made++; } box.children.push(grid); }
    boxes.push(box);
  }
  // au plus 25 sections libres (limite du produit : 30)
  const per = Math.ceil(boxes.length / 25), sections = [];
  for (let i = 0; i < boxes.length; i += per) sections.push({ id: `sect${String(++sid).padStart(8, "0")}`, type: "layout", children: boxes.slice(i, i + per) });
  return { sections, nodes: made };
}


const REC = `(() => {
  window.__rec = { frames: [], longs: [], ev: [], on: false };
  let last = 0;
  const tick = (t) => { if (window.__rec.on) { if (last) window.__rec.frames.push(t - last); last = t; } else last = 0; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  try { new PerformanceObserver((l) => { if (window.__rec.on) l.getEntries().forEach((e) => window.__rec.longs.push(e.duration)); }).observe({ type: "longtask", buffered: false }); } catch (e) {}
  try { new PerformanceObserver((l) => { if (window.__rec.on) l.getEntries().forEach((e) => window.__rec.ev.push({ n: e.name, d: e.duration, delay: e.processingStart - e.startTime })); }).observe({ type: "event", durationThreshold: 16, buffered: false }); } catch (e) {}
})()`;
const q = (xs, p) => { const s = xs.slice().sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; };
const r1 = (x) => +x.toFixed(1);

async function main() {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const out = { config: { os: `${os.type()} ${os.release()}`, cpus: os.cpus().length, model: os.cpus()[0].model, chrome: browser.version(), load: os.loadavg().map((x) => +x.toFixed(2)), date: new Date().toISOString() }, sizes: {} };
  console.log(`# Banc d'interactions (${out.config.date}) — ${out.config.model} ×${out.config.cpus}, Chrome ${out.config.chrome}, charge ${out.config.load.join(" ")}`);
  for (const size of SIZES) {
    const { sections, nodes } = makeContent(size);
    const pageId = Number((await boss.post("/marketing/pages", { name: `Interactions ${size}` })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections } }, headers: { Origin: srv.base } });
    if (put.status !== 200) throw new Error(`page de ${size} refusée : ${put.text.slice(0, 160)}`);
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page); await cdp.send("Performance.enable");
    const metrics = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 120000 });
    await page.evaluate(REC); await sleep(1500);
    const res = { nodes };
    // enregistre une interaction : intervalles d'images, tâches longues, événements, compteurs du moteur (par interaction)
    const record = async (name, run, per = 1) => {
      try {
        await page.evaluate(() => { window.__rec.frames = []; window.__rec.longs = []; window.__rec.ev = []; window.__rec.on = true; });
        const m0 = await metrics(); const t0 = Date.now();
        await run();
        await sleep(120);
        const m1 = await metrics();
        const r = await page.evaluate(() => { window.__rec.on = false; return { f: window.__rec.frames, l: window.__rec.longs, e: window.__rec.ev }; });
        const d = (k) => (m1[k] - m0[k]);
        res[name] = {
          duree: Date.now() - t0, images: r.f.length, imagePire: r1(Math.max(0, ...r.f)), imageP95: r1(q(r.f, 0.95)), lentes33: r.f.filter((x) => x > 33.4).length, lentes50: r.f.filter((x) => x > 50).length,
          tachesLongues: r.l.length, tachesLonguesMs: r1(r.l.reduce((a, b) => a + b, 0)), tacheLonguePire: r1(Math.max(0, ...r.l)),
          evenementPire: r1(Math.max(0, ...r.e.map((x) => x.d))), retardEntreePire: r1(Math.max(0, ...r.e.map((x) => x.delay))),
          miseEnPage: r1(d("LayoutCount") / per), recalculStyle: r1(d("RecalcStyleCount") / per), miseEnPageMs: r1(d("LayoutDuration") * 1000 / per), recalculMs: r1(d("RecalcStyleDuration") * 1000 / per), scriptMs: r1(d("ScriptDuration") * 1000 / per),
        };
      } catch (e) { res[name] = { erreur: String(e.message).slice(0, 120) }; }
    };
    const fb = async () => { const b = await page.locator("[data-pb-frame]").boundingBox(); return b; };
    const ids = await page.$$eval("[data-pb-layers] .pb-node[data-id] > .pb-row-item", (els) => els.map((e) => e.parentElement.getAttribute("data-id")));
    // 1. survol : 40 déplacements de souris sur le canevas (aucun clic)
    await record("survol", async () => { const b = await fb(); for (let i = 0; i < 40; i++) { await page.mouse.move(b.x + 100 + (i * 17) % (b.width - 200), b.y + 60 + (i * 23) % (b.height - 120)); await sleep(12); } }, 40);
    // 2. sélection par clic dans le canevas (12 clics) puis désélection (Échap)
    await record("selectionCanevas", async () => { const b = await fb(); for (let i = 0; i < 12; i++) { await page.mouse.click(b.x + 120 + (i * 83) % (b.width - 240), b.y + 80 + (i * 61) % (b.height - 160)); await sleep(40); } }, 12);
    await record("deselection", async () => { for (let i = 0; i < 6; i++) { await page.evaluate((id) => document.querySelector(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).click(), ids[Math.floor(ids.length / 2)]); await sleep(60); await page.keyboard.press("Escape"); await sleep(60); } }, 6);
    // 3. ouverture / fermeture des panneaux : Structure (bascule) et Inspecteur (sélection / désélection déjà couverte) — 6 cycles
    await record("panneauStructure", async () => { for (let i = 0; i < 6; i++) { await page.locator("[data-pb-layers-open]").first().click(); await sleep(120); } }, 6);
    // 4. insertion d'un widget depuis la bibliothèque (clic) : 5 insertions
    await record("insertion", async () => { for (let i = 0; i < 5; i++) { await page.evaluate(() => { const b = document.querySelector('.pb-pal-item[data-widget="text"]'); if (b) b.click(); }); await sleep(450); } }, 5);
    // 5. zoom : Ctrl/⌘ + et − (8 pas)
    const mod = process.platform === "darwin" ? "Meta" : "Control";
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await record("zoom", async () => { for (let i = 0; i < 4; i++) { await page.keyboard.press(`${mod}+=`); await sleep(150); } for (let i = 0; i < 4; i++) { await page.keyboard.press(`${mod}+-`); await sleep(150); } await page.keyboard.press(`${mod}+0`); }, 9);
    // 6. déplacement de la vue (outil main : touche H, glisser) puis défilement du canevas
    await record("deplacementVue", async () => { await page.keyboard.press("h"); const b = await fb(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); for (let i = 0; i < 30; i++) await page.mouse.move(b.x + b.width / 2 - i * 6, b.y + b.height / 2 - i * 9); await page.mouse.up(); await page.keyboard.press("v"); }, 30);
    await record("defilement", async () => { await page.evaluate(async () => { const w = document.querySelector("[data-pb-frame]").contentWindow; for (let i = 0; i < 60; i++) { w.scrollTo(0, i * 40); await new Promise((r) => requestAnimationFrame(r)); } w.scrollTo(0, 0); }); }, 60);
    // 7. redimensionnement : poignée du coin d'un conteneur sélectionné (30 déplacements)
    const cont = ids.find((x) => /^cn/.test(x));
    await page.evaluate((id) => document.querySelector(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).click(), cont); await sleep(500);
    await record("redimensionnement", async () => { const h = await page.frameLocator("[data-pb-frame]").locator(".pb-handle-se").first().boundingBox(); if (!h) throw new Error("poignée absente"); await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await page.mouse.down(); for (let i = 1; i <= 30; i++) await page.mouse.move(h.x + h.width / 2 - i * 3, h.y + h.height / 2 + i * 2); await page.mouse.up(); }, 30);
    // 8. curseur : déplacement du curseur d'opacité (30 événements « input » du curseur, comme une souris qui glisse)
    await record("curseur", async () => {
      const ok = await page.evaluate(async () => {
        const t = [...document.querySelectorAll(".pb-inspector [role=tab]")].find((x) => /^Style/.test(x.textContent.trim())); if (t) t.click();
        document.querySelectorAll(".pb-inspector details.pb-acc").forEach((d) => { d.open = true; });
        await new Promise((r) => setTimeout(r, 300));
        const r = document.querySelector('.pb-inspector .pb-style-field[data-prop="opacity"] input[type=range]') || document.querySelector(".pb-inspector input[type=range]");
        if (!r) return false;
        for (let i = 0; i <= 30; i++) { r.value = String(0.2 + i * 0.02); r.dispatchEvent(new Event("input", { bubbles: true })); await new Promise((x) => requestAnimationFrame(x)); }
        r.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      });
      if (!ok) throw new Error("curseur absent");
    }, 31);
    out.sizes[size] = res;
    const keys = Object.keys(res).filter((k) => k !== "nodes");
    console.log(`\n## ${size} éléments`);
    for (const k of keys) { const v = res[k]; console.log(v.erreur ? `${k}: ${v.erreur}` : `${k}: pire image ${v.imagePire} ms · p95 ${v.imageP95} · images > 33 ms : ${v.lentes33} · tâches longues ${v.tachesLongues} (${v.tachesLonguesMs} ms) · événement pire ${v.evenementPire} ms · par action : ${v.miseEnPage} mises en page (${v.miseEnPageMs} ms), ${v.recalculStyle} recalculs de style (${v.recalculMs} ms), script ${v.scriptMs} ms`); }
    await ctx.close();
  }
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 1));
  await browser.close(); await srv.stop(); process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
