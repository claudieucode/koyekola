// Programme 22.9 — parité visuelle et poids transférés, minification activée / désactivée (Chrome réel). Hors `npm test`.
// Usage : NODE_PATH=<dossier>/node_modules node tests/manuel/perf-minify-parity.js <dossier de sortie>
const path = require("node:path"); const fs = require("node:fs"); const crypto = require("node:crypto");
const ROOT = path.join(__dirname, "..", "..");
const { startServer, loginInstructor } = require(path.join(ROOT, "tests/helpers"));
const { TEST_KEY } = require(path.join(ROOT, "tests/marketing-helpers"));
const { chromium } = require("playwright-core");
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const node = (id, type, props) => ({ id, type, props, styles: { desktop: {}, tablet: {}, mobile: {} }, children: [] });
async function run(minify) {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", KOLAKISA_MINIFY: minify ? "1" : "0" });
  const boss = await loginInstructor(srv), db = srv.db();
  const site = Number((await boss.post("/marketing/site-web/sites", { name: "Parité" })).location.match(/sites\/(\d+)/)[1]);
  await boss.post("/marketing/pages", { name: "P", site_id: site, kind: "page" });
  const p = db.prepare("SELECT id, slug, revision FROM mk_landing_pages WHERE name = 'P'").get();
  fs.mkdirSync(path.join(srv.dir, "uploads/thumbnails"), { recursive: true }); fs.copyFileSync(path.join(ROOT, "public/img/accueil/etude-1-800.jpg"), path.join(srv.dir, "uploads/thumbnails/p-1.jpg"));
  const sections = [{ type: "layout", id: "parity00001", children: [node("parh00001", "heading", { text: "Titre de parité", level: 1 }), node("pari00001", "image", { src: "/uploads/thumbnails/p-1.jpg", alt: "Image" }), node("part00001", "text", { html: "<p>Texte de parité.</p>" }), node("parb00001", "button", { label: "Bouton", url: "/" }),
    node("parc00001", "accordion", { items: [{ title: "Question", text: "Réponse" }] })] }];
  await boss.request(`/marketing/pages/${p.id}/brouillon`, { method: "PUT", json: { revision: p.revision, content: { sections, title: "P", description: "" } } });
  await boss.post(`/marketing/pages/${p.id}/publier.json`, {});
  const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const out = { minify, shots: {}, errors: [], transfer: {} };
  try {
    for (const [name, vp] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 800 }]]) {
      const ctx = await browser.newContext({ viewport: vp }); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page); await cdp.send("Network.enable"); await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      const sizes = {}; cdp.on("Network.loadingFinished", (e) => { sizes[e.requestId] = e.encodedDataLength; }); const urls = {}; cdp.on("Network.requestWillBeSent", (e) => { urls[e.requestId] = e.request.url; });
      page.on("pageerror", (e) => out.errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error" && !/favicon/.test(m.text())) out.errors.push(m.text()); });
      await page.goto(`${srv.base}/p/${p.slug}`, { waitUntil: "networkidle" }); await page.addStyleTag({ content: "*{animation:none!important;transition:none!important}" }); await page.waitForTimeout(500);
      const buf = await page.screenshot({ fullPage: true }); out.shots[name] = crypto.createHash("sha1").update(buf).digest("hex"); fs.writeFileSync(path.join(OUT, `parity-${minify ? "min" : "orig"}-${name}.png`), buf);
      if (name === "desktop") for (const [id, u] of Object.entries(urls)) if (/\/(css|js)\/(landing|kw-effects|visitor)\.(css|js)/.test(u)) out.transfer[u.replace(/^.*\/(css|js)\//, "$1/").split("?")[0]] = sizes[id];
      await ctx.close();
    }
  } finally { await browser.close(); db.close(); await srv.stop(); }
  return out;
}
(async () => {
  const a = await run(false), b = await run(true);
  const sum = (o) => Object.values(o.transfer).reduce((x, y) => x + y, 0);
  const res = { identiqueDesktop: a.shots.desktop === b.shots.desktop, identiqueMobile: a.shots.mobile === b.shots.mobile, erreursOriginal: a.errors, erreursMinifie: b.errors, transfertOriginal: a.transfer, transfertMinifie: b.transfer, totalOriginal: sum(a), totalMinifie: sum(b) };
  fs.writeFileSync(path.join(OUT, "perf-minify-parity.json"), JSON.stringify(res, null, 2)); console.log(JSON.stringify(res, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
