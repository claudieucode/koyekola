// Audit dans le VRAI éditeur (Chrome) : pour des modèles de la bibliothèque (en-têtes / pieds de page), on sélectionne chaque bouton, lien, titre, texte et menu,
// on change sa couleur puis sa police avec le panneau « Style » (comme un utilisateur), et on mesure le style calculé du texte visible dans le canevas.
// Usage : node scripts/audit-editeur-modeles.js <sortie.json> ; STEP=n (un modèle sur n), TYPES=header,footer
const path = require("path"), fs = require("fs");
const REPO = path.join(__dirname, "..");
const { startServer, loginInstructor } = require(path.join(REPO, "tests/helpers"));
const { TEST_KEY } = require(path.join(REPO, "tests/marketing-helpers"));
const { chromium } = require("playwright-core");
const Catalog = require(path.join(REPO, "src/themeBuilder/catalog"));
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const STEP = Number(process.env.STEP || 12), TYPES = (process.env.TYPES || "header,footer").split(",");
const KINDS = new Set((process.env.KINDS || "button,link,heading,text,menu,copyright").split(","));
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv), db = srv.db(); const O = { Origin: srv.base };
  const site = Number((await boss.post("/marketing/site-web/sites", { name: "Audit éditeur" })).location.match(/sites\/(\d+)/)[1]);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  const hp = Number((await boss.post("/marketing/pages", { name: "Accueil", site_id: String(site) })).location.match(/pages\/(\d+)/)[1]);
  await boss.request(`/marketing/pages/${hp}/publier.json`, { method: "POST", json: {}, headers: O });
  const homeSlug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(hp).slug;
  const out = []; let nodesTested = 0;
  for (const type of TYPES) {
    const entries = Catalog.entries(type).filter((_, i) => i % STEP === 0);
    for (const e of entries) {
      const r = await boss.request(`/marketing/site-web/sites/${site}/constructeur-de-theme/api/bibliotheque/utiliser`, { method: "POST", json: { type, key: e.key }, headers: O });
      if (r.status !== 200) { out.push({ type, key: e.key, err: "utiliser " + r.status }); continue; }
      const t = JSON.parse(r.text).template;
      const p = await ctx.newPage();
      try {
        await p.goto(`${srv.base}/marketing/site-web/composants/${t.sourceId}/editeur`);
        await p.waitForFunction(() => window.__pb, null, { timeout: 60000 }); await p.waitForTimeout(1200);
        const list = await p.evaluate((k) => { const f = document.querySelector("[data-pb-frame]").contentDocument; const seen = []; for (const el of f.querySelectorAll("[class*='kw-n-']")) { const m = (el.className.match(/kw-n-(\S+)/) || [])[1]; const ty = [...el.classList].find((c) => /^kw-(button|link|heading|text|menu|copyright|account|minicart|search|social|sitetitle|sitelogo|iconlist|dyntext|toggle|querylist)$/.test(c)); if (m && ty && k.includes(ty.slice(3)) && !seen.find((s) => s.id === m)) seen.push({ id: m, kind: ty.slice(3) }); } return seen; }, [...KINDS]);
        const done = [];
        for (const n of list) {
          nodesTested++;
          const sel = p.locator(`[data-pb-layers] .pb-node[data-id="${n.id}"] > .pb-row-item`).first();
          await sel.scrollIntoViewIfNeeded().catch(() => {}); await sel.click({ timeout: 6000 }).catch(() => {});
          await p.locator("[data-pb-inspector] [role=tab]", { hasText: /Style/ }).first().click({ timeout: 4000 }).catch(() => {}); await p.waitForTimeout(250);
          const res = { type, key: e.key, kind: n.kind, id: n.id };
          const read = () => p.evaluate((id) => { const el = document.querySelector("[data-pb-frame]").contentDocument.querySelector(".kw-n-" + id); if (!el) return null; const leaves = [...el.querySelectorAll("*")].filter((x) => !x.children.length && x.textContent.trim()); const leaf = leaves[0] || el; const c = getComputedStyle(leaf); const all = leaves.length ? leaves : [el]; return { color: c.color, font: c.fontFamily, allColors: all.map((x) => getComputedStyle(x).color), allFonts: all.map((x) => getComputedStyle(x).fontFamily) }; }, n.id);
          // couleur
          try {
            await p.locator('[data-pb-inspector] [data-prop="color"] .pb-color-btn').first().click({ timeout: 4000 });
            const hx = p.locator(".pb-cpop-hex"); await hx.fill("#ff0066", { timeout: 3000 }); await hx.press("Enter"); await p.waitForTimeout(500);
            await p.locator('[data-pb-inspector] [data-prop="color"] .pb-color-btn').first().click({ timeout: 3000 }).catch(() => {}); // referme la fenêtre
            const m = await read(); res.couleur = m && m.allColors.every((c) => c === "rgb(255, 0, 102)") ? "ok" : "KO " + JSON.stringify(m && m.allColors.slice(0, 3));
          } catch (er) { res.couleur = "ui: " + String(er.message).split("\n")[0].slice(0, 80); }
          // police
          try {
            await p.locator('[data-pb-inspector] [data-prop="fontFamily"] .kf-btn').first().click({ timeout: 4000 });
            await p.locator(".kf-search").fill("Lora"); await p.waitForTimeout(350);
            await p.locator(".kf-row", { hasText: /^Lora/ }).first().click({ timeout: 3000 }); await p.waitForTimeout(500);
            const m = await read(); res.police = m && m.allFonts.every((f) => /lora/i.test(f)) ? "ok" : "KO " + JSON.stringify(m && m.allFonts.slice(0, 3));
          } catch (er) { res.police = "ui: " + String(er.message).split("\n")[0].slice(0, 80); }
          out.push(res); done.push(n);
        }
        // publication depuis l'éditeur puis lecture du site public
        await p.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 20000 }).catch(() => {});
        const pub = await p.locator("[data-pb-publish]").isVisible().catch(() => false);
        if (pub) { await p.locator("[data-pb-publish]").click(); await p.waitForFunction(() => /publié, à jour/.test(document.querySelector("[data-pb-status]").textContent), null, { timeout: 30000 }).catch(() => {}); }
        const pubTpl = await boss.request(`/marketing/site-web/sites/${site}/constructeur-de-theme/api/modeles/${t.id}/publier`, { method: "POST", json: {}, headers: O });
        const pg = await ctx.newPage(); await pg.goto(`${srv.base}/p/${homeSlug}`, { waitUntil: "load" }); await pg.waitForTimeout(300);
        const pubRes = await pg.evaluate((ids) => ids.map((id) => { const el = document.querySelector(".kw-n-" + id); if (!el) return { id, absent: true }; const leaves = [...el.querySelectorAll("*")].filter((x) => !x.children.length && x.textContent.trim()); const all = leaves.length ? leaves : [el]; return { id, colors: all.map((x) => getComputedStyle(x).color), fonts: all.map((x) => getComputedStyle(x).fontFamily) }; }), done.map((d) => d.id));
        await pg.close();
        for (const d of done) { const x = pubRes.find((q) => q.id === d.id); const row = out.find((o) => o.id === d.id && o.key === e.key); row.public = !x || x.absent ? "absent" : (x.colors.every((c) => c === "rgb(255, 0, 102)") && x.fonts.every((f) => /lora/i.test(f)) ? "ok" : "KO " + JSON.stringify([x.colors[0], x.fonts[0]])); }
        await boss.request(`/marketing/site-web/sites/${site}/constructeur-de-theme/api/modeles/${t.id}/archiver`, { method: "POST", json: {}, headers: O });
      } catch (er) { out.push({ type, key: e.key, err: String(er.message).split("\n")[0].slice(0, 120) }); }
      await p.close();
    }
  }
  await browser.close(); db.close(); await srv.stop();
  fs.writeFileSync(process.argv[2] || ".audit-editeur.json", JSON.stringify(out, null, 1));
  const ko = out.filter((o) => o.err || /^KO/.test(o.couleur || "") || /^KO/.test(o.police || "") || /^(KO|absent)/.test(o.public || ""));
  console.log(`éléments ${nodesTested}, mesures ${out.length}, anomalies ${ko.length}`);
  const g = {}; for (const o of ko) { const k = `${o.type}/${o.kind || "-"} couleur=${(o.couleur || "").slice(0, 3)} police=${(o.police || "").slice(0, 3)} public=${(o.public || "").slice(0, 6)} ${o.err || ""}`; g[k] = (g[k] || 0) + 1; } console.log(g);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
