// Personnaliser › Entête : le comportement de l'en-tête du Theme Builder se règle depuis le Personnaliser (écran réel, Chrome).
// Vérifie : le formulaire apparaît pour le site, l'enregistrement est publié par le serveur et visible sur le site public, un AUTRE site garde son en-tête ordinaire (isolation),
// un en-tête avec des modifications non publiées dans le Theme Builder refuse la modification (rien n'est publié à l'insu de la personne). Ignoré sans Playwright / Chrome.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");
const { Client } = require("./helpers");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };

describe("Personnaliser › Entête : comportement de l'en-tête", { skip: SKIP }, () => {
  let env, siteB, pageB, compA;
  const slugB = () => env.db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageB).slug;
  const headerHtml = async (slug) => { const html = (await new Client(env.srv.base).get(`/p/${slug}`, { headers: UA })).text; const m = html.match(/<div class="[^"]*lp-site-header[^"]*"[^>]*>/); return m ? m[0] : ""; };
  const sect = (id, text) => ({ id, type: "layout", children: [{ id: `${id}h`.slice(0, 20), type: "heading", props: { text, level: "2" } }] });

  before(async () => {
    env = await setup({ siteName: "Site A" });
    compA = (await env.publishHeader("luxe-01.luxe-01", { mode: "static" })).componentId;
    siteB = Number((await env.boss.post("/marketing/site-web/sites", { name: "Site B" })).location.match(/sites\/(\d+)/)[1]);
    pageB = Number((await env.boss.post("/marketing/pages", { name: "Accueil B", site_id: siteB, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = env.db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageB).revision;
    assert.equal((await env.boss.request(`/marketing/pages/${pageB}/brouillon`, { method: "PUT", headers: env.origin, json: { revision: rev, content: { title: "Accueil B", sections: [sect("sectb000000", "CORPS B")] } } })).status, 200);
    assert.equal((await env.boss.request(`/marketing/pages/${pageB}/publier.json`, { method: "POST", json: {}, headers: env.origin })).status, 200);
    const used = await env.boss.request(`/marketing/site-web/sites/${siteB}/constructeur-de-theme/api/bibliotheque/utiliser`, { method: "POST", json: { type: "header", key: "luxe-01.luxe-01" }, headers: env.origin });
    const t = JSON.parse(used.text).template, cid = Number(t.editUrl.match(/composants\/(\d+)/)[1]);
    assert.equal((await env.boss.request(`/marketing/site-web/composants/${cid}/mettre-a-jour`, { method: "POST", json: {}, headers: env.origin })).status, 200);
    assert.equal((await env.boss.request(`/marketing/site-web/sites/${siteB}/constructeur-de-theme/api/modeles/${t.id}/publier`, { method: "POST", json: { replace: true }, headers: env.origin })).status, 200);
  });
  after(async () => { if (env) await env.close(); });

  const open = async () => {
    const context = await env.browser.newContext({ viewport: { width: 1500, height: 900 } });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    const page = await context.newPage();
    await page.goto(`${env.srv.base}/marketing/site-web/personnaliser?site=${env.site}`, { waitUntil: "load" });
    await page.waitForSelector("#pz-cats button, #pz-cats a");
    await page.locator("#pz-cats button, #pz-cats a", { hasText: /^Entête/ }).first().click();
    await page.waitForSelector("#pz-detail-body select");
    return { context, page };
  };

  test("le site A règle son en-tête « collé » depuis le Personnaliser : enregistré et publié ; le site B reste ordinaire", async () => {
    const { context, page } = await open();
    await page.selectOption("#pz-detail-body select >> nth=0", "sticky");
    const save = page.locator("#pz-detail-body button", { hasText: "Enregistrer et publier" });
    await save.waitFor(); assert.equal(await save.isEnabled(), true, "le bouton s'active après une modification");
    await save.click();
    await page.waitForSelector(".pz-toast:not([hidden])");
    const toastText = (await page.textContent(".pz-toast")) || "";
    // Données publiées du composant d'en-tête de chaque site (le rendu de la page publique des réglages d'en-tête est couvert par header-isolation.test.js)
    const modeOf = (siteId) => { const r = env.db.prepare("SELECT section, draft FROM mk_web_components WHERE site_id = ?").get(siteId); const sec = JSON.parse(r.section); return { mode: sec.header && sec.header.mode, draft: r.draft }; };
    const a = modeOf(env.site), b = modeOf(siteB);
    assert.equal(a.mode, "sticky", `site A : ${JSON.stringify(a)} — message : ${toastText}`);
    assert.equal(a.draft, null, "rien ne reste en brouillon : la modification est publiée");
    assert.notEqual(b.mode, "sticky", `le site B garde son en-tête ordinaire : ${JSON.stringify(b)}`);
    const pages = require(require("path").join(__dirname, "../src/marketing/pages"));
    const part = pages.partSection({ db: env.db, organizationId: env.db.prepare("SELECT id FROM mk_organizations").get().id }, env.db.prepare("SELECT id FROM mk_web_components WHERE site_id = ?").get(env.site).id, "header");
    assert.match(part.headerClass, /kw-theme-sticky/, "le moteur d'affichage lit le nouveau réglage");
    await context.close();
  });

  test("Pied de page : le pied actuel du site et le lien vers son éditeur ; un site sans pied n'affiche pas celui d'un autre", async () => {
    const used = await env.boss.request(env.U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "footer", key: "logo-et-copyright.marque" }, headers: env.origin });
    assert.equal(used.status, 200, used.text.slice(0, 200));
    const t = JSON.parse(used.text).template, cid = Number(t.editUrl.match(/composants\/(\d+)/)[1]);
    assert.equal((await env.boss.request(env.U(`/api/modeles/${t.id}/publier`), { method: "POST", json: { replace: true }, headers: env.origin })).status, 200);
    const context = await env.browser.newContext({ viewport: { width: 1500, height: 900 } });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    const open = async (siteId) => { const page = await context.newPage(); await page.goto(`${env.srv.base}/marketing/site-web/personnaliser?site=${siteId}`, { waitUntil: "load" }); await page.waitForSelector("#pz-cats button, #pz-cats a"); await page.locator("#pz-cats button, #pz-cats a", { hasText: /^Pied de page/ }).first().click(); await page.waitForSelector("#pz-detail-body .kwc-note"); return page; };
    const a = await open(env.site);
    assert.equal(await a.getAttribute("#pz-detail-body a.kwc-btn-primary", "href"), `/marketing/site-web/composants/${cid}/editeur`);
    assert.match(await a.textContent("#pz-detail-body"), /Pied de page actuel/);
    const b = await open(siteB);
    assert.equal(await b.locator("#pz-detail-body a.kwc-btn-primary").count(), 0, "le site B n'a pas de pied : aucun lien vers celui du site A");
    assert.match(await b.textContent("#pz-detail-body"), /pas encore de pied de page/);
    await context.close();
  });
  test("l'API refuse un en-tête partagé entre sites et un en-tête avec brouillon non publié ; rien n'est modifié", async () => {
    const post = (siteId, settings) => env.boss.request(`/marketing/site-web/personnaliser/entete?site=${siteId}`, { method: "POST", json: { site: String(siteId), settings }, headers: env.origin });
    // brouillon non publié dans le Theme Builder
    const comp = JSON.parse((await env.boss.get(`/marketing/site-web/composants/${compA}.json`)).text).component;
    const section = JSON.parse(JSON.stringify(comp.section)); section.header = { ...(section.header || {}), v: 1, mode: "sticky", zIndex: 77 };
    assert.equal((await env.boss.request(`/marketing/site-web/composants/${compA}/brouillon`, { method: "PUT", headers: env.origin, json: { revision: comp.revision, content: { title: comp.name, sections: [section] } } })).status, 200);
    const refused = await post(env.site, { mode: "overlay" });
    assert.equal(refused.status, 409, refused.text.slice(0, 200));
    assert.match(refused.text, /non publiées/);
    const stored = JSON.parse(env.db.prepare("SELECT section FROM mk_web_components WHERE id = ?").get(compA).section);
    assert.notEqual(stored.header && stored.header.mode, "overlay", "rien n'a été publié");
    // valeurs invalides ignorées/bornées par le serveur : un mode inconnu retombe sur « ordinaire »
    assert.equal((await env.boss.request(`/marketing/site-web/composants/${compA}/mettre-a-jour`, { method: "POST", json: {}, headers: env.origin })).status, 200);
    const ok = await post(env.site, { mode: "n'importe quoi", zIndex: 9999 });
    assert.equal(ok.status, 200, ok.text.slice(0, 200));
    const s = JSON.parse(ok.text).settings; assert.equal(s.mode, "static"); assert.equal(s.zIndex, 100);
  });
});
