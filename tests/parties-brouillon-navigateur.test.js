// Mission 9.1 — en-tête et pied de page dans l'éditeur réel (Chrome) : brouillon, rechargement, aperçu privé, « Mettre à jour », échecs.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
const idFrom = (l) => Number(l.match(/(?:pages|sites)\/(\d+)|(\d+)(?:#.*)?$/).slice(1).find(Boolean));
const section = (text) => ({ type: "layout", children: [{ type: "container", children: [{ id: "head00000001", type: "heading", props: { text, level: "2" } }] }] });

describe("brouillon et publication des parties de site dans l'éditeur réel (Chrome)", { skip: SKIP }, () => {
  let srv, boss, db, browser, context, siteId, pageId, parts;
  const errors = [];
  const json = (method, path, body) => boss.request(path, { method, json: body || {}, headers: { Origin: srv.base } });
  const rev = (cid) => db.prepare("SELECT revision FROM mk_web_components WHERE id = ?").get(cid).revision;
  const comp = (cid) => db.prepare("SELECT * FROM mk_web_components WHERE id = ?").get(cid);
  const live = async () => (await new Client(srv.base).get(`/p/${db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug}`, { headers: UA })).text;
  const newTab = async () => { const p = await context.newPage(); p.on("pageerror", (e) => errors.push(e.message)); return p; };
  const ready = async (p, cid) => {
    await p.goto(`${srv.base}/marketing/site-web/composants/${cid}/editeur`);
    await p.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && window.__pb; }, null, { timeout: 60000 });
    await wait(500);
  };
  const edit = async (p, text) => {
    await p.locator('[data-pb-layers] .pb-node[data-id="head00000001"] > .pb-row-item').first().click({ timeout: 8000 }); await wait(250);
    await p.locator("[data-pb-inspector] [role=tab]", { hasText: /^Contenu$/ }).click().catch(() => {});
    const f = p.locator("[data-pb-inspector] .pb-field", { hasText: "Texte" }).locator("input[type=text], textarea").first();
    await f.fill(text); await f.press("Tab");
  };
  const status = (p) => p.locator("[data-pb-status]").innerText();

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    db = srv.db();
    siteId = idFrom((await boss.post("/marketing/site-web/sites", { name: "Site navigateur" })).location);
    pageId = idFrom((await boss.post("/marketing/pages", { name: "Accueil", site_id: String(siteId) })).location);
    assert.equal((await json("POST", `/marketing/pages/${pageId}/publier.json`, {})).status, 200);
    await boss.post(`/marketing/site-web/sites/${siteId}/entete/creer`, {});
    const header = db.prepare("SELECT header_component_id FROM mk_sites WHERE id = ?").get(siteId).header_component_id;
    const footer = JSON.parse((await json("POST", "/marketing/site-web/composants", { name: "Pied navigateur", section: section("PIED-V1"), siteId: String(siteId) })).text).component;
    await boss.post(`/marketing/site-web/sites/${siteId}/parties`, { header: String(header), footer: String(footer.id) });
    await json("PUT", `/marketing/site-web/composants/${header}/brouillon`, { revision: rev(header), content: { sections: [section("ENTETE-V1")] } });
    await json("POST", `/marketing/site-web/composants/${header}/mettre-a-jour`, { revision: rev(header) });
    parts = { header, footer: footer.id };
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  for (const [role, label, what] of [["header", "ENTETE", "En-tête"], ["footer", "PIED", "Pied de page"]]) {
    test(`${what} : modifier → brouillon (public intact) → recharger → aperçu → « Mettre à jour » → public à jour`, { timeout: 180000 }, async () => {
      const cid = parts[role];
      const p = await newTab();
      await ready(p, cid);
      assert.match(await status(p), new RegExp(`${what} : publié, à jour`));
      assert.equal(await p.locator("[data-pb-publish]").isHidden(), true, "rien à publier tant qu'il n'y a pas de modification");
      await edit(p, `${label}-V2`);
      await p.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 15000 });
      assert.match(await status(p), /brouillon non publié/);
      assert.equal(await p.locator("[data-pb-publish]").innerText(), "Mettre à jour");
      const pub = await live();
      assert.match(pub, new RegExp(`${label}-V1`));
      assert.doesNotMatch(pub, new RegExp(`${label}-V2`), "enregistrer un brouillon ne change pas le site public");
      // rechargement : le brouillon est repris dans le canevas
      await ready(p, cid);
      assert.match(await p.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.body.innerText), new RegExp(`${label}-V2`));
      assert.match(await status(p), /brouillon non publié/);
      // aperçu privé : montre le brouillon dans le contexte du site
      await p.locator("[data-pb-preview]").click();
      const frame = p.frameLocator("[data-pb-preview-frame]");
      await frame.locator("body").waitFor({ timeout: 15000 });
      await p.waitForFunction((l) => { const f = document.querySelector("[data-pb-preview-frame]"); return f && f.contentDocument && f.contentDocument.body && new RegExp(l + "-V2").test(f.contentDocument.body.innerText); }, label, { timeout: 15000 });
      const inPreview = await p.evaluate(() => document.querySelector("[data-pb-preview-frame]").contentDocument.body.innerText);
      assert.doesNotMatch(inPreview, new RegExp(`${label}-V1`));
      assert.match(await live(), new RegExp(`${label}-V1`), "l'aperçu ne publie rien");
      await p.keyboard.press("Escape"); await wait(300);
      // publication explicite
      await p.locator("[data-pb-publish]").click();
      await p.waitForFunction((w) => new RegExp(w + " : publié, à jour").test(document.querySelector("[data-pb-status]").textContent), what, { timeout: 20000 });
      const after = await live();
      assert.match(after, new RegExp(`${label}-V2`));
      assert.doesNotMatch(after, new RegExp(`${label}-V1`));
      assert.equal(comp(cid).draft, null);
      assert.deepEqual(errors, []);
      await p.close();
    });
  }

  test("échecs de publication : session expirée et conflit 409 → message clair, brouillon conservé, site public inchangé ; ensuite la publication réussit", { timeout: 180000 }, async () => {
    const cid = parts.header;
    const p = await newTab();
    await ready(p, cid);
    await edit(p, "ENTETE-V3");
    await p.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 15000 });
    let mode = "401";
    await p.route((u) => /\/mettre-a-jour$/.test(u.pathname), async (route) => {
      if (mode === "401") return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: { code: "unauthorized", message: "Session expirée : reconnectez-vous." } }) });
      if (mode === "409") return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: { code: "conflict", message: "Ce composant a été modifié ailleurs (autre onglet ou autre personne) : rechargez-le avant de continuer, vos modifications n'ont pas été enregistrées." } }) });
      return route.continue();
    });
    const toastText = () => p.evaluate(() => { const t = document.querySelector("[data-pb-toast]"); return t && !t.hidden ? t.textContent.trim() : ""; });
    await p.locator("[data-pb-publish]").click();
    await p.waitForFunction(() => { const t = document.querySelector("[data-pb-toast]"); return t && !t.hidden && /expir|reconnect/i.test(t.textContent); }, null, { timeout: 10000 });
    assert.match(await status(p), /brouillon non publié/, "le brouillon reste signalé comme non publié");
    assert.match(await live(), /ENTETE-V2/); assert.doesNotMatch(await live(), /ENTETE-V3/);
    assert.match(comp(cid).draft, /ENTETE-V3/, "le brouillon est conservé sur le serveur");
    await wait(4500); mode = "409";
    await p.locator("[data-pb-publish]").click();
    await p.waitForFunction(() => { const t = document.querySelector("[data-pb-toast]"); return t && !t.hidden && /modifi.*ailleurs/i.test(t.textContent); }, null, { timeout: 10000 });
    assert.doesNotMatch(await live(), /ENTETE-V3/);
    assert.match(comp(cid).draft, /ENTETE-V3/);
    void toastText;
    await wait(4500); mode = "ok";
    await p.locator("[data-pb-publish]").click();
    await p.waitForFunction(() => /publié, à jour/.test(document.querySelector("[data-pb-status]").textContent), null, { timeout: 20000 });
    assert.match(await live(), /ENTETE-V3/);
    await p.close();
  });

  test("deux onglets sur le pied de page : le second est bloqué avec un message et n'écrase pas le brouillon du premier ; publier ne diffuse que la dernière révision confirmée", { timeout: 180000 }, async () => {
    const cid = parts.footer;
    const one = await newTab(), two = await newTab();
    await ready(one, cid); await ready(two, cid);
    await edit(one, "PIED-UN");
    await one.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 15000 });
    await edit(two, "PIED-DEUX");
    await two.waitForFunction(() => /ailleurs/.test(document.querySelector(".pb-save").textContent), null, { timeout: 20000 });
    assert.match(comp(cid).draft, /PIED-UN/); assert.doesNotMatch(comp(cid).draft, /PIED-DEUX/);
    assert.doesNotMatch(await live(), /PIED-UN|PIED-DEUX/);
    // le second onglet ne peut pas non plus publier : ses modifications ne sont pas enregistrées
    await two.locator("[data-pb-publish]").click().catch(() => {});
    await wait(1500);
    assert.doesNotMatch(await live(), /PIED-DEUX/);
    await one.locator("[data-pb-publish]").click();
    await one.waitForFunction(() => /publié, à jour/.test(document.querySelector("[data-pb-status]").textContent), null, { timeout: 20000 });
    assert.match(await live(), /PIED-UN/);
    await one.close(); await two.close();
  });
});
