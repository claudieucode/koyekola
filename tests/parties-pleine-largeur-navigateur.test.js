// En-tête et pied de page du Theme Builder avec la feuille commune des thèmes (packs/base.css) : le FOND traverse toute la largeur de la fenêtre à toutes les résolutions,
// sans défilement horizontal ; le contenu du corps de page garde sa colonne. Régression : base.css plafonnait ces parties à --pk-max (1280 px), laissant voir le fond de la page de chaque côté.
// Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { setup, SKIP } = require("./header-aides");

const BASE_CSS = fs.readFileSync(path.join(__dirname, "../src/marketing/themes/packs/base.css"), "utf8").replace(/&\[data-pk-motion[^\n]*/g, "");

describe("Parties globales (en-tête, pied) avec la base des thèmes : fond pleine largeur", { skip: SKIP }, () => {
  let env;
  before(async () => {
    env = await setup({ siteName: "Largeur des parties" });
    await env.publishHeader("luxe-01.luxe-01", null);
    const used = await env.boss.request(env.U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "footer", key: "logo-et-copyright.marque" }, headers: env.origin });
    assert.equal(used.status, 200, used.text.slice(0, 200));
    const t = JSON.parse(used.text).template;
    assert.equal((await env.boss.request(env.U(`/api/modeles/${t.id}/publier`), { method: "POST", json: { replace: true }, headers: env.origin })).status, 200);
  });
  after(async () => { if (env) await env.close(); });

  test("5 largeurs (375 à 2560 px) : l'en-tête et le pied occupent 100 % de la fenêtre, aucun débordement horizontal", async () => {
    for (const width of [375, 768, 1280, 1920, 2560]) {
      const { context, page } = await env.visit({ viewport: { width, height: 900 }, tall: false });
      await page.addStyleTag({ content: BASE_CSS });
      const m = await page.evaluate(() => {
        const box = (el) => { const b = el.getBoundingClientRect(); return { left: Math.round(b.left), width: Math.round(b.width) }; };
        return { vw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth, header: box(document.querySelector(".lp-site-header")), footer: box(document.querySelector(".lp-site-footer")), headers: document.querySelectorAll(".lp-site-header").length, footers: document.querySelectorAll(".lp-site-footer").length };
      });
      assert.deepEqual(m.header, { left: 0, width: m.vw }, `${width} px : en-tête ${JSON.stringify(m.header)}`);
      assert.deepEqual(m.footer, { left: 0, width: m.vw }, `${width} px : pied ${JSON.stringify(m.footer)}`);
      assert.equal(m.sw, m.vw, `${width} px : défilement horizontal (${m.sw} > ${m.vw})`);
      assert.equal(m.headers, 1, "un seul en-tête"); assert.equal(m.footers, 1, "un seul pied de page");
      await context.close();
    }
  });
});
