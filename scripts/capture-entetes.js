#!/usr/bin/env node
// Capture réelle des en-têtes de la bibliothèque (aperçu serveur, Chrome) + planches-contact par secteur.
// usage : OUT=dossier node scripts/capture-entetes.js [secteur…]   (sans argument : tous)
const fs = require("fs"), path = require("path");
const { TEST_KEY } = require("../tests/marketing-helpers");
const { startServer, loginInstructor } = require("../tests/helpers");
const Catalog = require("../src/themeBuilder/catalog");
const { MODELS } = require("../src/themeBuilder/catalog/header"), { SECTORS } = require("../src/themeBuilder/catalog/header/models");
const { chromium } = require("playwright-core");
const sharp = require("sharp");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = process.env.OUT || "/private/tmp/claude-501/hd-shots";
(async () => {
  const only = process.argv.slice(2);
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db(); const org = db.prepare("SELECT id FROM mk_organizations").get().id;
  const A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site A', 'site-a', '{}')").run(org).lastInsertRowid);
  const b = await chromium.launch({ executablePath: CHROME, headless: true });
  // se connecter dans le navigateur : récupérer le cookie via un login HTTP serait long ; on réutilise le contexte du helper s'il l'expose
  const ctx = await b.newContext({ viewport: { width: 1280, height: 400 }, reducedMotion: "reduce" }); // l'aperçu joue les animations d'entrée : on capture l'état final
  await ctx.addCookies([...boss.cookies].map(([n, v]) => ({ name: n, value: v, url: srv.base })));
  const p = await ctx.newPage();
  const secs = SECTORS.filter((s) => !only.length || only.includes(s.key));
  for (const s of secs) {
    const rows = [];
    for (const m of MODELS.filter((x) => x.sector === s.key)) {
      const key = `${m.key}.${m.key}`;
      for (const [tag, w] of [["d", 1280], ["m", 390]]) {
        await p.setViewportSize({ width: w, height: 500 });
        await p.goto(`${srv.base}/marketing/site-web/sites/${A}/constructeur-de-theme/api/bibliotheque/header/${key}/apercu`, { waitUntil: "load" });
        await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(900);
        const box = await p.evaluate(() => { const el = document.querySelector(".kw-theme-header") || document.body, r = el.getBoundingClientRect(); const bottom = Math.max(r.bottom, ...[...el.querySelectorAll("*")].map((e) => e.getBoundingClientRect().bottom)); return { x: 0, y: Math.max(0, r.top), width: innerWidth, height: Math.min(Math.max(bottom - r.top + 4, 40), 300) }; }); // en-tête superposé : sa boîte peut être plus petite que son contenu
        const f = path.join(OUT, `${m.key}-${tag}.png`); fs.writeFileSync(f, await p.screenshot({ clip: box })); rows.push({ f, tag, m });
      }
    }
    // planche : 1 colonne de 10 lignes (desktop 1280 réduit à 960)
    const items = rows.filter((r) => r.tag === "d");
    const comp = await Promise.all(items.map(async (r) => ({ input: await sharp(r.f).resize({ width: 960 }).png().toBuffer(), meta: await sharp(r.f).resize({ width: 960 }).metadata() })));
    let y = 0; const layers = comp.map((c) => { const l = { input: c.input, top: y, left: 0 }; y += c.meta.height + 6; return l; });
    await sharp({ create: { width: 960, height: y, channels: 3, background: "#888" } }).composite(layers).png().toFile(path.join(OUT, `planche-${s.key}.png`));
    console.log("planche", s.key);
  }
  await b.close(); db.close(); await srv.stop(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
