// Programme 21.9 — essai NAVIGATEUR RÉEL de « Modifier avec l'IA et historique » (Chrome piloté par Playwright). Hors de `npm test`.
// Usage : NODE_PATH=<dossier>/node_modules node tests/manuel/regen-ui-smoke.js <dossier de sortie>   (captures dans <sortie>/shots, résultats dans <sortie>/ui-results.json)
const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const ROOT = path.join(__dirname, "..", "..");
const { startServer, loginInstructor } = require(path.join(ROOT, "tests/helpers"));
const { TEST_KEY } = require(path.join(ROOT, "tests/marketing-helpers"));
const { chromium } = require("playwright-core");
const OUT = process.argv[2]; fs.mkdirSync(`${OUT}/shots`, { recursive: true });
(async () => {
  const api = http.createServer((req, res) => { let b = ""; req.on("data", (d) => (b += d)); req.on("end", () => { res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ id: "m", type: "message", role: "assistant", model: "x", content: [{ type: "text", text: JSON.stringify({ variants: ["Nos activités."] }) }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 5, output_tokens: 5 } })); }); });
  await new Promise((r) => api.listen(0, "127.0.0.1", r));
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ANTHROPIC_API_KEY: "sk-ant-test", ANTHROPIC_BASE_URL: `http://127.0.0.1:${api.address().port}` });
  const boss = await loginInstructor(srv), db = srv.db();
  const site = Number((await boss.post("/marketing/site-web/sites", { name: "Site Alpha" })).location.match(/sites\/(\d+)/)[1]);
  await boss.post("/marketing/pages", { name: "Accueil", site_id: site, kind: "page" });
  const pid = db.prepare("SELECT id, draft FROM mk_landing_pages WHERE name = 'Accueil'").get(); const d = pid.draft ? JSON.parse(pid.draft) : {};
  d.sections = [{ id: "sechero1", type: "hero", title: "Bienvenue", subtitle: "Un sous-titre long", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "", style: { padding: "lg", background: "primary" } }, { id: "secfeat1", type: "features", title: "Nos services", intro: "Ce que nous faisons", columns: 3, items: [{ title: "Conception", text: "Des plans" }] }];
  db.prepare("UPDATE mk_landing_pages SET draft = ?, revision = revision + 1 WHERE id = ?").run(JSON.stringify(d), pid.id);
  const cookies = [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base }));
  const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const results = []; const check = (n, ok, x = "") => { results.push({ name: n, ok: Boolean(ok), extra: x }); console.log((ok ? "OK  " : "KO  ") + n + (x ? " — " + x : "")); };
  try {
    for (const vp of [{ w: 1280, h: 860, t: "desktop" }, { w: 390, h: 800, t: "mobile" }]) {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } }); await ctx.addCookies(cookies);
      const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
      await page.goto(`${srv.base}/marketing/site-web/sites/${site}/regeneration`); await page.waitForSelector("#rg-form");
      await page.waitForFunction(() => document.querySelectorAll("#rg-page option").length > 1, null, { timeout: 15000 });
      check(`[${vp.t}] liste des pages chargée (identifiants)`, true);
      await page.selectOption("#rg-page", { index: 1 }); await page.waitForFunction(() => document.querySelectorAll("#rg-section option").length > 1);
      await page.selectOption("#rg-section", "sechero1");
      await page.fill("#rg-text", vp.t === "desktop" ? "Change uniquement le fond de cette section en sombre" : "Change uniquement le fond de cette section en accent"); await page.click('#rg-form button[type="submit"]'); await page.waitForSelector("#rg-proposal .rg-card");
      check(`[${vp.t}] proposition avec avant/après, périmètre et impact`, (await page.content()).includes("Impact faible") && (await page.locator(".rg-ba").count()) >= 1);
      await page.screenshot({ path: `${OUT}/shots/21-9-proposition-${vp.t}.png` });
      await page.click('[data-act="apply"]'); await page.waitForFunction(() => /Brouillon mis à jour/.test(document.querySelector("#rg-status").textContent), null, { timeout: 15000 });
      check(`[${vp.t}] application au brouillon confirmée par le serveur`, true);
      await page.click("#rg-t-hist"); await page.waitForSelector("#rg-ops .rg-card"); await page.waitForSelector("#rg-snaps table");
      check(`[${vp.t}] historique et versions listés`, (await page.locator("#rg-ops .rg-card").count()) >= 1 && (await page.locator('[data-snap="cmp"]').count()) >= 1);
      await page.locator('[data-snap="cmp"]').first().click(); await page.waitForSelector("#rg-compare .rg-card");
      check(`[${vp.t}] comparaison avec l'état actuel affichée`, true);
      await page.screenshot({ path: `${OUT}/shots/21-9-historique-${vp.t}.png` });
      await page.click("#rg-t-prot"); await page.selectOption("#rg-prot-page", { index: 1 }); await page.waitForSelector("#rg-prot table");
      if (vp.t === "mobile") { await page.locator('[data-prot="locked"]').nth(1).click(); await page.waitForFunction(() => /Protection mise à jour/.test(document.querySelector("#rg-status").textContent)); check(`[${vp.t}] verrouillage posé (côté serveur)`, (await page.content()).includes("Verrouillé")); }
      await page.screenshot({ path: `${OUT}/shots/21-9-protection-${vp.t}.png` });
      check(`[${vp.t}] aucun débordement horizontal`, (await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1);
      check(`[${vp.t}] aucune erreur JavaScript`, errors.length === 0, errors.slice(0, 2).join(" | "));
      await ctx.close();
    }
  } catch (e) { check("exécution sans exception", false, String(e).slice(0, 300)); }
  await browser.close(); await srv.stop(); api.close(); fs.writeFileSync(`${OUT}/ui-results.json`, JSON.stringify(results, null, 1)); process.exit(results.every((r) => r.ok) ? 0 : 1);
})();
