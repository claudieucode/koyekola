// Aides communes aux tests du Header Builder (navigateur) : site de test, page publiée, en-tête du catalogue publié avec des réglages écrits comme l'éditeur les écrit.
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const sect = (id, text) => ({ id, type: "layout", children: [{ id: `${id}h`.slice(0, 20), type: "heading", props: { text, level: "2" } }] });

async function setup({ siteName = "Site en-tête" } = {}) {
  const env = { srv: null, boss: null, db: null, browser: null, site: 0, pageId: 0, errors: [], origin: { Origin: "" } };
  env.srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  env.origin.Origin = env.srv.base; env.boss = await loginInstructor(env.srv); env.db = env.srv.db();
  env.site = Number((await env.boss.post("/marketing/site-web/sites", { name: siteName })).location.match(/sites\/(\d+)/)[1]);
  env.pageId = Number((await env.boss.post("/marketing/pages", { name: "Accueil", site_id: env.site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
  const rev = env.db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(env.pageId).revision;
  assert.equal((await env.boss.request(`/marketing/pages/${env.pageId}/brouillon`, { method: "PUT", headers: env.origin, json: { revision: rev, content: { title: "Accueil", sections: [sect("sect00000001", "CORPS DE PAGE")] } } })).status, 200);
  assert.equal((await env.boss.request(`/marketing/pages/${env.pageId}/publier.json`, { method: "POST", json: {}, headers: env.origin })).status, 200);
  env.browser = await chromium.launch({ executablePath: CHROME, headless: true });
  env.U = (p = "") => `/marketing/site-web/sites/${env.site}/constructeur-de-theme${p}`;
  env.slug = () => env.db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(env.pageId).slug;
  // Publie un en-tête du catalogue : `header` = bloc de réglages ; `mutate(section)` = retouche libre du document avant publication
  env.publishHeader = async (key, header, mutate) => {
    const used = await env.boss.request(env.U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key }, headers: env.origin });
    assert.equal(used.status, 200, used.text.slice(0, 200));
    const t = JSON.parse(used.text).template, cid = Number(t.editUrl.match(/composants\/(\d+)/)[1]);
    const comp = JSON.parse((await env.boss.get(`/marketing/site-web/composants/${cid}.json`)).text).component;
    const section = JSON.parse(JSON.stringify(comp.draft || comp.section));
    if (header) section.header = header; if (mutate) mutate(section);
    const put = await env.boss.request(`/marketing/site-web/composants/${cid}/brouillon`, { method: "PUT", headers: env.origin, json: { revision: comp.revision, content: { title: comp.name, sections: [section] } } });
    assert.equal(put.status, 200, put.text.slice(0, 300));
    assert.equal((await env.boss.request(`/marketing/site-web/composants/${cid}/mettre-a-jour`, { method: "POST", json: {}, headers: env.origin })).status, 200);
    const pub = await env.boss.request(env.U(`/api/modeles/${t.id}/publier`), { method: "POST", json: { replace: true }, headers: env.origin });
    assert.equal(pub.status, 200, pub.text.slice(0, 300));
    return { template: t, componentId: cid };
  };
  // Page publiée du site, vue par un visiteur (sans cookie)
  env.visit = async (opts = {}) => {
    const context = await env.browser.newContext({ viewport: opts.viewport || { width: 1280, height: 800 }, reducedMotion: opts.reducedMotion || "no-preference" });
    const page = await context.newPage(); context.setDefaultTimeout(15000);
    page.on("pageerror", (e) => env.errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) env.errors.push(`console : ${m.text().slice(0, 200)}`); });
    await page.goto(`${env.srv.base}/p/${env.slug()}`); await page.waitForSelector(".lp-site-header");
    if (opts.tall !== false) await page.addStyleTag({ content: "body, .lp-main{min-height:4000px}" });
    return { context, page };
  };
  env.close = async () => { if (env.browser) await env.browser.close(); if (env.db) env.db.close(); if (env.srv) await env.srv.stop(); };
  return env;
}
module.exports = { setup, SKIP, chromium, CHROME };
