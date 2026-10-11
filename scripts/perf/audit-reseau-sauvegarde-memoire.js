#!/usr/bin/env node
// Mesures ciblées pour l'audit de performance : (1) coût de la copie locale (localStorage) et de la sérialisation du document ; (2) requêtes réseau déclenchées
// par une interaction (nombre et poids) ; (3) fuite mémoire : écouteurs, nœuds DOM et tas JS après des cycles répétés. Aucune instrumentation dans le produit.
//   NODE_PATH=<playwright-core> node scripts/perf/audit-reseau-sauvegarde-memoire.js [--sizes=100,400] [--json=fichier]
const fs = require("fs");
const os = require("os");
const { startServer, loginInstructor } = require("../../tests/helpers");
const { TEST_KEY } = require("../../tests/marketing-helpers");
const { chromium } = require("playwright-core");
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split("=")[1] : d; };
const SIZES = arg("sizes", "100,400").split(",").map(Number);
const JSON_OUT = arg("json", "");
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bench = fs.readFileSync(require("path").join(__dirname, "bench-page-builder.js"), "utf8");
const makeContent = new Function(`${bench.slice(bench.indexOf("function makeContent(total) {"), bench.indexOf("async function main() {"))}; return makeContent;`)();
const med = (xs) => { const s = xs.slice().sort((a, b) => a - b); return s.length ? +s[Math.floor(s.length / 2)].toFixed(2) : 0; };

(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--js-flags=--expose-gc"] });
  const out = { config: { cpus: os.cpus().length, model: os.cpus()[0].model, chrome: browser.version(), load: os.loadavg().map((x) => +x.toFixed(2)), date: new Date().toISOString() }, sizes: {} };
  console.log(`# Audit réseau / sauvegarde / mémoire (${out.config.date}) — charge ${out.config.load.join(" ")}`);
  for (const size of SIZES) {
    const { sections, nodes } = makeContent(size);
    const pageId = Number((await boss.post("/marketing/pages", { name: `Audit ${size}` })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections } }, headers: { Origin: srv.base } });
    if (put.status !== 200) throw new Error("page refusée");
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page); await cdp.send("Performance.enable"); await cdp.send("HeapProfiler.enable");
    const reqs = [];
    page.on("request", (r) => { if (/\/marketing\/pages\/\d+\/(rendu|brouillon)$/.test(r.url())) reqs.push({ t: Date.now(), m: r.method(), u: r.url().split("/").pop(), bytes: (r.postData() || "").length }); });
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 120000 });
    await sleep(2000);
    const res = { nodes };
    // (1) coût de la copie locale : sérialisation du document réel + écriture dans localStorage (ce que fait backup() à CHAQUE modification)
    res.copieLocale = await page.evaluate(() => {
      // le VRAI document : celui que le serveur a transmis à l'éditeur (bloc JSON « pb-boot »), sérialisé et écrit comme le fait backup()
      const boot = JSON.parse(document.getElementById("pb-boot").textContent);
      const doc = { sections: boot.content.sections, title: boot.content.title, theme: boot.content.theme, seo: boot.content.seo };
      const key = "pb-audit-copie"; const t = []; let len = 0;
      for (let i = 0; i < 30; i++) { const a = performance.now(); const s = JSON.stringify({ at: Date.now(), revision: 1, content: doc }); const b = performance.now(); localStorage.setItem(key, s); const c = performance.now(); len = s.length; t.push([b - a, c - b]); }
      localStorage.removeItem(key);
      const med = (xs) => { const q = xs.slice().sort((x, y) => x - y); return +q[Math.floor(q.length / 2)].toFixed(2); };
      const snap = []; for (let i = 0; i < 10; i++) { const a = performance.now(); JSON.stringify({ sections: doc.sections, title: doc.title, theme: doc.theme, seo: doc.seo, selection: [] }); snap.push(performance.now() - a); }
      return { octets: len, serialiserMs: med(t.map((x) => x[0])), ecrireMs: med(t.map((x) => x[1])), instantaneHistoriqueMs: med(snap) };
    });
    // poids du document réellement envoyé à chaque rendu / enregistrement : lu sur le premier enregistrement réel
    reqs.length = 0;
    const heading = await page.evaluate(() => { const r = [...document.querySelectorAll("[data-pb-layers] .pb-node[data-id]")].find((n) => /^hd/.test(n.getAttribute("data-id"))); return r ? r.getAttribute("data-id") : null; });
    await page.evaluate((id) => document.querySelector(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).click(), heading); await sleep(500);
    // (2) réseau : un changement de valeur ; 30 événements d'un curseur (la saisie de 8 caractères a été mesurée à part, à la main : 1 rendu + 1 enregistrement)
    const net = async (name, run) => { reqs.length = 0; await run(); await sleep(2500); const r = reqs.slice(); res[name] = { rendu: r.filter((x) => x.u === "rendu").length, enregistrements: r.filter((x) => x.u === "brouillon").length, octetsRendu: med(r.filter((x) => x.u === "rendu").map((x) => x.bytes)), octetsEnreg: med(r.filter((x) => x.u === "brouillon").map((x) => x.bytes)) }; };
    await net("reseauChangementUnique", async () => { await page.evaluate(() => { const t = [...document.querySelectorAll(".pb-inspector [role=tab]")].find((x) => /^Style/.test(x.textContent.trim())); if (t) t.click(); document.querySelectorAll(".pb-inspector details.pb-acc").forEach((d) => { d.open = true; }); }); await sleep(300); await page.evaluate(() => { const f = document.querySelector('.pb-inspector .pb-style-field[data-prop="opacity"] input:not([type=range])'); f.focus(); f.value = "0.9"; f.dispatchEvent(new Event("input", { bubbles: true })); f.dispatchEvent(new Event("change", { bubbles: true })); f.blur(); }); });
    await net("reseauCurseur30", async () => { await page.evaluate(async () => { const r = document.querySelector('.pb-inspector .pb-style-field[data-prop="opacity"] input[type=range]'); for (let i = 0; i <= 30; i++) { r.value = String(0.2 + i * 0.02); r.dispatchEvent(new Event("input", { bubbles: true })); await new Promise((x) => requestAnimationFrame(x)); } r.dispatchEvent(new Event("change", { bubbles: true })); }); });
    // (3) mémoire : 5 séries de 20 cycles « sélectionner / désélectionner / ouvrir-fermer la Structure / zoom » ; mesure après nettoyage du tas
    const snap = async () => { await cdp.send("HeapProfiler.collectGarbage"); await sleep(300); const m = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value])); return { ecouteurs: m.JSEventListeners, noeuds: m.Nodes, tasMo: +(m.JSHeapUsedSize / 1048576).toFixed(2), documents: m.Documents }; };
    const ids = await page.$$eval("[data-pb-layers] .pb-node[data-id] > .pb-row-item", (els) => els.map((e) => e.parentElement.getAttribute("data-id")));
    res.memoire = [await snap()];
    const mod = process.platform === "darwin" ? "Meta" : "Control";
    for (let round = 0; round < 8; round++) {
      for (let i = 0; i < 20; i++) {
        await page.evaluate((id) => document.querySelector(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).click(), ids[(i * 7) % ids.length]);
        await sleep(40); await page.keyboard.press("Escape"); await sleep(30);
        if (i % 5 === 0) { await page.locator("[data-pb-layers-open]").first().click(); await sleep(60); await page.locator("[data-pb-layers-open]").first().click(); await sleep(60); await page.keyboard.press(`${mod}+=`); await page.keyboard.press(`${mod}+-`); }
      }
      res.memoire.push(await snap());
    }
    out.sizes[size] = res;
    console.log(`\n## ${size} éléments (${nodes})\ncopie locale : ${res.copieLocale.octets} octets, sérialiser ${res.copieLocale.serialiserMs} ms + écrire ${res.copieLocale.ecrireMs} ms (par modification) ; instantané d'historique ${res.copieLocale.instantaneHistoriqueMs} ms`);
    for (const k of ["reseauChangementUnique", "reseauCurseur30"]) console.log(`${k}: ${res[k].rendu} rendus (${res[k].octetsRendu} octets chacun), ${res[k].enregistrements} enregistrements (${res[k].octetsEnreg} octets)`);
    console.log("mémoire après nettoyage (écouteurs / nœuds / tas Mo / documents) :", res.memoire.map((m) => `${m.ecouteurs}/${m.noeuds}/${m.tasMo}/${m.documents}`).join("  →  "));
    await ctx.close();
  }
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 1));
  await browser.close(); await srv.stop(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
