// Priorité des règles dans un VRAI navigateur : pour chacune des propriétés de style (valeur d'essai valide), sur cinq types d'éléments
// (conteneur, titre, bouton, image, texte), la valeur publiée par l'auteur est celle que le navigateur applique réellement. Le test force la
// même déclaration en `!important` sur l'élément : si le style calculé change, une règle du thème / du site écrasait le réglage de l'auteur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { STYLE_PROPS, editorSpec } = require("../src/marketing/pages/nodes");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : priorité CSS non exécutée sur cette machine" : false;
const spec = editorSpec();
const sample = (k) => {
  const p = spec.styleProps.find((x) => x.key === k);
  if (p.options) { const o = p.options.map((x) => x[0]); return o[Math.min(1, o.length - 1)]; }
  if (p.kind === "color") return "#12ab34";
  for (const v of ["2", "12px", "40%", "1.5", "300", "2fr 1fr", "3", "5", "8"]) if (STYLE_PROPS[k].check(v) !== null) return STYLE_PROPS[k].check(v);
  return null;
};
const KEYS = Object.keys(STYLE_PROPS).filter((k) => sample(k) !== null);
const node = (type, i, k) => {
  const id = `${type.slice(0, 3)}${String(i).padStart(8, "0")}`;
  const base = { container: { props: {}, children: [] }, heading: { props: { text: `T${i}`, level: "2" } }, button: { props: { label: `B${i}`, url: "/x", variant: "primary" } }, image: { props: { src: "https://example.com/a.jpg", alt: "a" } }, text: { props: { html: "<p>x</p>" } } }[type];
  return { id, type, ...base, styles: { desktop: { [k]: sample(k) } } };
};

describe("priorité des règles CSS : le réglage de l'auteur l'emporte sur le thème (Chrome réel)", { skip: SKIP }, () => {
  let srv, boss, browser, ctx;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  for (const type of ["container", "heading", "button", "image", "text"]) {
    test(`${type} : ${KEYS.length} propriétés, une par élément, toutes appliquées telles que publiées`, { timeout: 240000 }, async () => {
      const id = Number((await boss.post("/marketing/pages", { name: `Priorité ${type}`, template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
      const row = () => srv.db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
      const kids = KEYS.map((k, i) => node(type, i, k));
      const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: row().revision, content: { title: "Priorité", sections: [{ id: "sect00000001", type: "layout", children: kids }] } } });
      assert.equal(r.status, 200, r.text);
      assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
      const page = await ctx.newPage();
      try {
        await page.goto(`${srv.base}/p/${row().slug}`);
        const items = kids.map((n, i) => { const k = KEYS[i], v = STYLE_PROPS[k].check(sample(k)); return { id: n.id, k, css: STYLE_PROPS[k].css, out: String(STYLE_PROPS[k].out ? STYLE_PROPS[k].out(v) : v) }; });
        const bad = await page.evaluate(({ items }) => {
          const bad = [];
          for (const it of items) {
            const el = document.querySelector(`.kw-n-${it.id}`);
            if (!el) { bad.push(`${it.k} : élément absent de la page publiée`); continue; }
            const before = getComputedStyle(el).getPropertyValue(it.css);
            el.style.setProperty(it.css, it.out, "important");
            const after = getComputedStyle(el).getPropertyValue(it.css);
            el.style.removeProperty(it.css);
            if (before !== after) bad.push(`${it.k} (${it.css}) : appliqué « ${before} », attendu « ${after} »`);
          }
          return bad;
        }, { items });
        assert.deepEqual(bad, [], `${type} : règles écrasées par le thème`);
      } finally { await page.close(); }
    });
  }
});
