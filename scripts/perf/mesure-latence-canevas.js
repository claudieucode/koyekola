#!/usr/bin/env node
// Répartition du délai « frappe → canevas à jour » : requête de rendu (attente serveur + transfert, via Resource Timing), puis application dans le canevas.
// Mesures en navigateur réel, aucune instrumentation dans le produit.  NODE_PATH=<playwright-core> node scripts/perf/mesure-latence-canevas.js [--sizes=100,400] [--n=12]
const fs = require("fs");
const { startServer, loginInstructor } = require("../../tests/helpers");
const { TEST_KEY } = require("../../tests/marketing-helpers");
const { chromium } = require("playwright-core");
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split("=")[1] : d; };
const SIZES = arg("sizes", "100,400").split(",").map(Number), N = Number(arg("n", "12"));
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bench = fs.readFileSync(require("path").join(__dirname, "bench-page-builder.js"), "utf8");
const makeContent = new Function(`${bench.slice(bench.indexOf("function makeContent(total) {"), bench.indexOf("async function main() {"))}; return makeContent;`)();
const med = (xs) => { const s = xs.slice().sort((a, b) => a - b); return s.length ? +s[Math.floor(s.length / 2)].toFixed(1) : 0; };
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  for (const size of SIZES) {
    const { sections } = makeContent(size);
    const pageId = Number((await boss.post("/marketing/pages", { name: `Latence ${size}` })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections } }, headers: { Origin: srv.base } });
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage();
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 120000 });
    await sleep(1500);
    const heading = await page.evaluate(() => { const r = [...document.querySelectorAll("[data-pb-layers] .pb-node[data-id]")].find((n) => /^hd/.test(n.getAttribute("data-id"))); return r.getAttribute("data-id"); });
    await page.evaluate((id) => document.querySelector(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).click(), heading); await sleep(600);
    const rows = [];
    for (let i = 0; i < N; i++) {
      const r = await page.evaluate(async ([id, k]) => {
        performance.clearResourceTimings();
        const f = document.querySelector("[data-pb-inspector] input[type=text], [data-pb-inspector] textarea");
        const text = "zz" + k + Date.now().toString(36);
        const t0 = performance.now(); f.value = text; f.dispatchEvent(new Event("input", { bubbles: true }));
        let tCanvas = -1;
        while (performance.now() - t0 < 15000) { const el = document.querySelector("[data-pb-frame]").contentDocument.querySelector(`[data-node-id="${id}"]`); if (el && el.textContent.includes(text)) { tCanvas = performance.now() - t0; break; } await new Promise((x) => requestAnimationFrame(x)); }
        const e = performance.getEntriesByType("resource").filter((x) => /\/rendu$/.test(x.name)).pop();
        return { total: tCanvas, requete: e ? e.duration : -1, attente: e ? e.responseStart - e.requestStart : -1, envoi: e ? e.requestStart - e.startTime : -1, taille: e ? e.encodedBodySize : -1, debut: e ? e.startTime - t0 : -1, fin: e ? e.responseEnd - t0 : -1 };
      }, [heading, i]);
      rows.push(r); await sleep(500);
    }
    const g = (k) => med(rows.map((r) => r[k]));
    console.log(`## ${size} éléments (n=${N}) : total ${g("total")} ms = attente avant l'envoi ${g("debut")} + requête ${g("requete")} (dont attente du serveur ${g("attente")}) + application dans le canevas ${+(g("total") - g("fin")).toFixed(1)} · réponse ${g("taille")} octets`);
    // changement de valeur unique (champ « Opacité ») → canevas ; rafale de 8 frappes → nombre de requêtes de rendu
    const val = [];
    await page.evaluate(() => { const t = [...document.querySelectorAll(".pb-inspector [role=tab]")].find((x) => /^Style/.test(x.textContent.trim())); if (t) t.click(); document.querySelectorAll(".pb-inspector details.pb-acc").forEach((d) => { d.open = true; }); }); await sleep(400);
    for (let i = 0; i < N; i++) {
      const t = await page.evaluate(async ([id, k]) => {
        const f = document.querySelector('.pb-inspector .pb-style-field[data-prop="opacity"] input:not([type=range])'); const want = String(0.3 + (k % 6) * 0.1).slice(0, 4);
        const t0 = performance.now(); f.focus(); f.value = want; f.dispatchEvent(new Event("input", { bubbles: true })); f.dispatchEvent(new Event("change", { bubbles: true })); f.blur();
        while (performance.now() - t0 < 15000) { const el = document.querySelector("[data-pb-frame]").contentDocument.querySelector(`[data-node-id="${id}"]`); if (el && Math.abs(parseFloat(getComputedStyle(el).opacity) - parseFloat(want)) < 0.011) return performance.now() - t0; await new Promise((x) => requestAnimationFrame(x)); }
        return -1;
      }, [heading, i]);
      val.push(t); await sleep(500);
    }
    await page.evaluate(() => { const g = [...document.querySelectorAll(".pb-inspector [role=tab]")].find((x) => /^(général|contenu|content)/i.test(x.textContent.trim())); if (g) g.click(); }); await sleep(500);
    const hits = []; page.on("request", (r) => { if (/\/rendu$/.test(r.url())) hits.push(Date.now()); });
    const info = await page.evaluate(() => [...document.querySelectorAll("[data-pb-inspector] input[type=text], [data-pb-inspector] textarea")].map((e) => (e.closest(".pb-field") || e.parentElement).textContent.slice(0, 18) + "=" + e.value.slice(0, 10)));
    console.log("   champs texte :", JSON.stringify(info));
    await page.locator("[data-pb-inspector] input[type=text]").first().click(); await page.keyboard.type("abcdefgh", { delay: 60 }); await sleep(1500);
    console.log(`   valeur unique → canevas : ${med(val)} ms · rafale de 8 frappes : ${hits.length} requête(s) de rendu`);
    await ctx.close();
  }
  await browser.close(); await srv.stop(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
