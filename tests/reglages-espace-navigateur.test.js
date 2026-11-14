// RÉGLAGES (Général, Connecteurs, Confidentialité) en vrai Chrome : occupation de l'espace à plusieurs largeurs, aucun débordement horizontal, deux colonnes seulement sur grand écran.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { launch, SKIP } = require("./helpers-chrome-cdp");

describe("Réglages : occupation de l'espace (navigateur)", { skip: SKIP }, () => {
  let srv, boss, chrome, site;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    site = Number(String((await boss.post("/marketing/site-web/sites", { name: "Espace réglages" })).location).match(/sites\/(\d+)/)[1]);
    chrome = await launch();
  });
  after(async () => { if (chrome) await chrome.close(); await srv.stop(); });
  const cookies = () => [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base }));
  const PAGES = [["general", "general", ".mk-sg"], ["connecteurs", "connecteurs", ".mk-cn"], ["confidentialite", "confidentialite", ".mk-pv"]];
  for (const [nom, , sel] of PAGES) {
    test(`${nom} : pas de débordement, largeur utile selon l'écran`, async () => {
      const out = {};
      for (const w of [390, 1024, 1440, 1920, 2560]) {
        const page = await chrome.newPage({ width: w, height: 1000, cookies: cookies() });
        const url = `/marketing/site-web/parametres/${PAGES.find((p) => p[0] === nom)[1]}?site=${site}`;
        await page.goto(`${srv.base}${url}`);
        const m = await page.evaluate((s) => { const e = document.querySelector(s); const r = e && e.getBoundingClientRect(); const c = document.querySelector(".mk-content, main"); const cr = c.getBoundingClientRect(); return { found: !!e, w: r ? Math.round(r.width) : 0, area: Math.round(cr.width), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }; }, sel);
        if (process.env.ESPACE_SHOTS) require("node:fs").writeFileSync(`${process.env.ESPACE_SHOTS}/${nom}-${w}.png`, await page.screenshot());
        await page.close();
        out[w] = m;
        assert.ok(m.found, `${nom}@${w} : bloc ${sel} présent`);
        assert.ok(m.overflow <= 0, `${nom}@${w} : débordement horizontal ${m.overflow}px`);
        if (w >= 1440) assert.ok(m.w >= Math.min(m.area - 60, 1100), `${nom}@${w} : contenu trop étroit (${m.w}px sur ${m.area}px)`);
      }
      console.log(nom, JSON.stringify(out));
    });
  }
});
