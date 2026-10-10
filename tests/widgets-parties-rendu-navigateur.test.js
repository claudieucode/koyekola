// Chaque partie déclarée par le registre s'applique réellement dans la page rendue (vrai Chrome) : pour chaque widget à parties, un réglage-test
// autorisé est écrit dans la partie, la page d'aperçu est ouverte et le style calculé de la zone ciblée est lu. Les parties qui ne s'affichent pas
// sur une page nue (images sans fichier, formation sans catalogue…) sont listées explicitement : tout autre silence fait échouer le test.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const n = require("../src/marketing/pages/nodes");
const { PARTS } = require("../src/marketing/pages/parts");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

// Réglage-test autorisé pour une partie (premier groupe qui l'autorise) → [propriété, valeur, propriété CSS, valeur calculée attendue]
function probe(def) {
  const g = def.groups, ok = (grp, key) => g[grp] === true || (Array.isArray(g[grp]) && g[grp].includes(key));
  if (ok("typography", "fontStyle")) return ["fontStyle", "italic", "fontStyle", "italic"];
  if (ok("color", "color")) return ["color", "#0a0b0c", "color", "rgb(10, 11, 12)"];
  if (ok("background", "backgroundColor")) return ["backgroundColor", "#0a0b0c", "backgroundColor", "rgb(10, 11, 12)"];
  if (ok("spacing", "marginTop")) return ["marginTop", "7px", "marginTop", "7px"];
  return ["height", "13px", "height", "13px"];
}
// Parties qui ne s'affichent pas sur une page nue d'essai (contenu réel nécessaire) — vérifiées par le test de contrat des gabarits
const NEEDS_CONTENT = new Set(["posts.image", "courselist.*", "testimonial.avatar", "gallery.*", "imagebox.*", "iconbox.media", "signupform.*"]);
const CONTENT_REQUIRED = new Set(["gallery", "imagebox", "signupform"]);
const skipPart = (t, k) => NEEDS_CONTENT.has(`${t}.${k}`) || NEEDS_CONTENT.has(`${t}.*`);

describe("parties : application réelle dans la page rendue (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, pages = {};
  const H = { ctx: {}, imageUrl: (v) => String(v || ""), linkUrl: (v) => String(v || ""), iconNames: n.iconNames() };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    srv.db().prepare("INSERT INTO posts (slug, title, excerpt, published, published_at, status) VALUES ('a1', 'Article', 'Résumé.', 1, datetime('now'), 'published')").run();
    for (const type of Object.keys(PARTS)) {
      const parts = {};
      for (const [key, def] of Object.entries(PARTS[type])) { const [prop, value] = probe(def); parts[key] = { styles: { desktop: { [prop]: value } } }; }
      const blank = n.PALETTE[type].blank();
      // éléments facultatifs absents du contenu de départ : on les renseigne pour que la zone existe
      const extra = { testimonial: { rating: 5, role: "Directrice" }, pricing: { badge: "Populaire", description: "Une description." }, pricelist: { items: [{ title: "Café", price: "3 €", text: "Un espresso." }] } }[type];
      if (extra) blank.props = { ...blank.props, ...extra };
      const id = Number((await boss.post("/marketing/pages", { name: `Parties ${type}` })).location.match(/(\d+)$/)[1]);
      const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
      const content = { sections: [{ id: "sect0000001", type: "layout", children: [{ id: "node0000001", type, ...blank, parts }] }] };
      const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } });
      pages[type] = { id, status: r.status, text: r.text };
    }
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("chaque partie déclarée est enregistrable et s'applique à sa zone dans l'aperçu", async () => {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const missing = [], wrong = [], checked = [];
    for (const [type, defs] of Object.entries(PARTS)) {
      const info = pages[type];
      if (CONTENT_REQUIRED.has(type)) { assert.equal(info.status, 422, `${type} exige un contenu réel`); continue; } // refusé proprement sans contenu : couvert par le contrat des gabarits
      assert.equal(info.status, 200, `${type} : enregistrement refusé : ${info.text.slice(0, 200)}`);
      const page = await ctx.newPage();
      await page.goto(`${srv.base}/marketing/pages/${info.id}/apercu`);
      for (const [key, def] of Object.entries(defs)) {
        const [, , cssProp, expected] = probe(def);
        const got = await page.evaluate(({ id, select, cssProp }) => { const e = document.querySelector(`.kw-n-${id} ${select}`) || document.querySelector(select); return e ? getComputedStyle(e)[cssProp] : null; }, { id: "node0000001", select: def.select, cssProp });
        if (got === null) { if (!skipPart(type, key)) missing.push(`${type}.${key}`); continue; }
        if (got !== expected) wrong.push(`${type}.${key} : ${got} ≠ ${expected}`); else checked.push(`${type}.${key}`);
      }
      await page.close();
    }
    await ctx.close();
    assert.deepEqual(wrong, [], "parties dont le réglage n'atteint pas la zone");
    assert.deepEqual(missing, [], "parties introuvables dans la page rendue (sélecteur ou gabarit à corriger)");
    assert.ok(checked.length >= 30, `parties vérifiées : ${checked.length}`);
  });
});
