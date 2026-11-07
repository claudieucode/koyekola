// Audit : pour des modèles réels de la bibliothèque (en-têtes / pieds de page), on règle couleur, fond et police sur CHAQUE bouton et lien, et on mesure le rendu réel dans Chrome.
const path = require("path"), fs = require("fs");
const REPO = path.join(__dirname, "..");
const { startServer, loginInstructor } = require(path.join(REPO, "tests/helpers"));
const { TEST_KEY } = require(path.join(REPO, "tests/marketing-helpers"));
const { chromium } = require("playwright-core");
const Catalog = require(path.join(REPO, "src/themeBuilder/catalog"));
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const STEP = Number(process.env.STEP || 7);
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv), db = srv.db(); const O = { Origin: srv.base };
  const site = Number((await boss.post("/marketing/site-web/sites", { name: "Audit boutons" })).location.match(/sites\/(\d+)/)[1]);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const fails = []; let n = 0, tested = 0;
  for (const type of ["header", "footer"]) {
    const entries = Catalog.entries(type).filter((_, i) => i % STEP === 0);
    for (const e of entries) {
      const r = await boss.request(`/marketing/site-web/sites/${site}/constructeur-de-theme/api/modeles`, { method: "POST", json: { type, name: "A " + e.key, catalogKey: e.key, key: e.key, conditions: {} }, headers: O });
      if (r.status !== 200) { fails.push({ type, key: e.key, err: "creation " + r.status + " " + r.text.slice(0, 120) }); continue; }
      const t = JSON.parse(r.text).template;
      const doc = JSON.parse(JSON.stringify(Catalog.build(type, e.key, {}).section));
      const targets = [];
      const walk = (x) => { for (const c of x.children || []) { if (["button", "link"].includes(c.type)) targets.push(c); walk(c); } };
      walk(doc);
      targets.forEach((c, i) => { c.id = `aud${String(i).padStart(3, "0")}00000`.slice(0, 12); c.styles = c.styles || {}; c.styles.desktop = { ...(c.styles.desktop || {}), color: "#ff0066", fontFamily: "font.lora", ...(c.type === "button" ? { backgroundColor: "#00aa55" } : {}) }; });
      const rr = await boss.request(`/marketing/site-web/composants/${t.sourceId}/rendu`, { method: "POST", json: { content: { title: "t", sections: [doc] } }, headers: O });
      if (rr.status !== 200) { fails.push({ type, key: e.key, err: "rendu " + rr.status }); continue; }
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const pg = await ctx.newPage();
      await pg.setContent(rr.text, { waitUntil: "load" }); await pg.waitForTimeout(150);
      const res = await pg.evaluate((ids) => ids.map((id) => { const el = document.querySelector(`.kw-n-${id}`); if (!el) return { id, absent: true }; const cs = getComputedStyle(el); const leaf = [...el.querySelectorAll("*")].filter((x) => x.children.length === 0 && x.textContent.trim()).concat(el.children.length ? [] : [el])[0] || el; const lc = getComputedStyle(leaf); return { id, tag: el.tagName, color: lc.color, font: lc.fontFamily, bg: cs.backgroundColor, rb: cs.color, rf: cs.fontFamily }; }), targets.map((c) => c.id));
      await ctx.close(); tested++;
      res.forEach((x, i) => { n++; const c = targets[i]; if (x.absent) return fails.push({ type, key: e.key, kind: c.type, err: "absent" }); const bad = []; if (x.color !== "rgb(255, 0, 102)") bad.push("couleur " + x.color); if (!/lora/i.test(x.font)) bad.push("police " + x.font); if (c.type === "button" && x.bg !== "rgb(0, 170, 85)") bad.push("fond " + x.bg); if (bad.length) fails.push({ type, key: e.key, kind: c.type, err: bad.join("; ") }); });
      await boss.request(`/marketing/site-web/sites/${site}/constructeur-de-theme/api/modeles/${t.id}/archiver`, { method: "POST", json: {}, headers: O });
    }
  }
  await browser.close(); db.close(); await srv.stop();
  fs.writeFileSync(process.argv[2] || ".audit-boutons.json", JSON.stringify(fails, null, 1));
  console.log(`modèles ${tested}, éléments ${n}, défauts ${fails.length}`);
  const g = {}; for (const f of fails) g[f.err.replace(/rgb\([^)]*\)/g, "X").slice(0, 70)] = (g[f.err.replace(/rgb\([^)]*\)/g, "X").slice(0, 70)] || 0) + 1; console.log(g);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
