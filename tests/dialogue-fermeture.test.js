// Fermeture d'une boîte de dialogue (VRAI Chrome) : pendant l'animation de sortie (160 ms) la fenêtre n'est plus « :modal » mais reste affichée ;
// elle doit rester CENTRÉE (cause d'un flash en haut à gauche quand le centrage ne valait que pour :modal). Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Boîtes de dialogue : pas de flash à la fermeture", { skip: SKIP }, () => {
  let env, context;
  before(async () => {
    env = await setup({ siteName: "Site fermeture" });
    context = await env.browser.newContext({ viewport: { width: 1400, height: 900 } });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    context.setDefaultTimeout(20000);
  });
  after(async () => { if (context) await context.close(); if (env) await env.close(); });

  const cases = [
    ["redirections du site (« Ajouter une redirection »)", () => `/marketing/site-web/sites/${env.site}/redirections`, "[data-rd-new]", "#rd-new"],
    ["redirections globales (« Ajouter une redirection »)", () => "/marketing/site-web/redirections", "[data-ur-new]", "#ur-form"],
  ];
  for (const [name, url, opener, dlg] of cases) {
    test(`${name} : centrée à chaque image de la fermeture, croix comme Échap`, async () => {
      const page = await context.newPage();
      for (const how of ["croix", "echap"]) {
        await page.goto(env.srv.base + url()); await page.waitForSelector(opener);
        await page.click(opener); await page.waitForSelector(`${dlg}[open]`);
        await page.waitForTimeout(400); // fin de l'animation d'ouverture
        const frames = await page.evaluate(([sel, how]) => new Promise((res) => {
          const d = document.querySelector(sel), out = [];
          const t0 = performance.now();
          const tick = () => { const b = d.getBoundingClientRect(), cs = getComputedStyle(d);
            if (cs.display !== "none") out.push({ open: d.open, cx: Math.round(b.left + b.width / 2), vx: Math.round(innerWidth / 2), top: Math.round(b.top) });
            if (performance.now() - t0 < 450) requestAnimationFrame(tick); else res(out); };
          if (how === "croix") d.querySelector(".mk-dialog-close").click(); else d.dispatchEvent(new Event("cancel", { cancelable: true })), d.close();
          tick();
        }), [dlg, how]);
        assert.ok(frames.length > 0, `${how} : aucune image mesurée`);
        for (const f of frames) {
          assert.ok(Math.abs(f.cx - f.vx) <= 2, `${how} : image hors centre (centre ${f.cx} px au lieu de ${f.vx}, open=${f.open})`);
          assert.ok(f.top > 4, `${how} : fenêtre collée en haut (top=${f.top}, open=${f.open})`);
        }
        assert.equal(await page.evaluate((s) => document.querySelector(s).open, dlg), false, `${how} : fermée`);
      }
      await page.close();
    });
  }
});
