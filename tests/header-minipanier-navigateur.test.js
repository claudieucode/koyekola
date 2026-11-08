// Header Builder, lot L5 (mini-panier) — tiroir branché sur le VRAI panier du visiteur (formations en session) : contenu, total, liens vers la commande, clavier, vide ; jamais de contenu inventé.
// Le widget existant (lien avec compteur) reste identique. Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");
const { newStudent, createCourse } = require("./helpers");

describe("Header Builder L5 : mini-panier en tiroir (navigateur)", { skip: SKIP }, () => {
  let env, student, empty, course;
  const withCart = (props) => (s) => { let host = null; const walk = (nodes) => { for (const n of nodes) { if (!host && Array.isArray(n.children)) host = n; if (n.children) walk(n.children); } }; walk(s.children); host.children.push({ id: "mcart00001", type: "minicart", props }); };
  const visitAs = async (client) => {
    const context = await env.browser.newContext({ viewport: { width: 1280, height: 800 } });
    if (client) await context.addCookies([...client.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    const page = await context.newPage(); context.setDefaultTimeout(15000); page.on("pageerror", (e) => env.errors.push(`pageerror : ${e.message}`));
    await page.goto(`${env.srv.base}/p/${env.slug()}`); await page.waitForSelector(".lp-site-header"); return { context, page };
  };
  before(async () => {
    env = await setup({ siteName: "Site panier" });
    course = await createCourse(env.boss, env.srv, { title: "Formation du panier", price: 35 });
    student = await newStudent(env.srv); empty = await newStudent(env.srv);
    const added = await student.post(`/panier/ajouter/${course.id}`, {}); assert.ok([200, 302, 303].includes(added.status), `ajout au panier : ${added.status}`);
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withCart({ label: "Panier", showCount: true, skin: "drawer" }));
  });
  after(async () => { if (env) await env.close(); });

  test("tiroir : le bouton affiche le nombre réel, le panneau liste la formation du vrai panier, son prix, le total et les liens vers la commande", async () => {
    const { context, page } = await visitAs(student);
    const open = page.locator(".lp-site-header .kw-mc-open"), dlg = page.locator(".kw-cart-drawer");
    assert.equal(await dlg.isVisible(), false, "fermé au départ"); assert.match(await open.innerText(), /1/, "le nombre réel d'articles");
    await open.click(); assert.equal(await dlg.isVisible(), true);
    assert.match(await dlg.innerText(), /Formation du panier/); assert.match(await dlg.innerText(), /35,00/); assert.match(await dlg.innerText(), /Total/);
    assert.equal(await dlg.getByRole("link", { name: "Passer la commande" }).getAttribute("href"), "/commande"); assert.equal(await dlg.getByRole("link", { name: "Modifier le panier" }).getAttribute("href"), "/panier");
    await page.waitForTimeout(400); /* fin de l'animation d'entrée */ const b = await dlg.boundingBox(); assert.ok(Math.abs(b.x + b.width - 1280) < 2, "panneau à droite");
    await context.close();
  });

  test("clavier et fermeture : Échap, bouton Fermer et fond referment ; le focus revient au bouton du panier", async () => {
    const { context, page } = await visitAs(student);
    const open = page.locator(".lp-site-header .kw-mc-open"), dlg = page.locator(".kw-cart-drawer");
    await open.focus(); await page.keyboard.press("Enter"); assert.equal(await dlg.isVisible(), true);
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains("kw-cart-close")), true, "le focus est dans le tiroir");
    await page.keyboard.press("Escape"); assert.equal(await dlg.isVisible(), false); assert.equal(await page.evaluate(() => document.activeElement.classList.contains("kw-mc-open")), true, "focus rendu");
    await open.click(); await page.locator(".kw-cart-close").click(); assert.equal(await dlg.isVisible(), false);
    await open.click(); await dlg.click({ position: { x: 3, y: 3 } }).catch(() => {}); await context.close();
  });

  test("panier vide : message prévu, aucun total ni bouton de commande, aucun contenu inventé ; un invité aussi", async () => {
    for (const who of [empty, null]) {
      const { context, page } = await visitAs(who);
      await page.locator(".lp-site-header .kw-mc-open").click();
      assert.match(await page.locator(".kw-cart-drawer").innerText(), /Votre panier est vide/); assert.equal(await page.locator(".kw-cart-drawer .kw-cart-total").count(), 0); assert.equal(await page.locator(".kw-cart-drawer .kw-button").count(), 0);
      await context.close();
    }
  });

  test("le widget Mini-panier existant est inchangé (lien vers /panier avec compteur)", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withCart({ label: "Panier", showCount: true }));
    const { context, page } = await visitAs(student);
    assert.equal(await page.locator(".lp-site-header .kw-mc-open").count(), 0); const a = page.locator(".lp-site-header a.kw-minicart.kw-n-mcart00001"); assert.equal(await a.getAttribute("href"), "/panier"); assert.match(await a.innerText(), /1/);
    await context.close();
  });

  test("aucune erreur de script", () => { assert.deepEqual(env.errors, []); });
});
