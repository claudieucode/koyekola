// Widgets ajoutés par la mission « widgets Elementor » (Stripe Button, PayPal Button, Sidebar) : réglages validés côté serveur (liste blanche de domaines), rendu sur la PAGE PUBLIÉE dans un vrai
// Chrome, contrôles qui changent réellement le rendu, sécurité (lien déguisé refusé, aucun script externe), et zone « Colonne latérale » réellement affichée. Ignoré (avec la raison) sans Chrome.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("boutons Stripe / PayPal et barre latérale (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, page, id, slug, errors = [];
  const db = () => srv.db();
  const row = () => { const d = db(); const r = d.prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id); d.close(); return r; };
  const put = (children) => boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: row().revision, content: { title: "Paiement", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children } ] }] } } });
  const open = async () => { assert.equal((await boss.post(`/marketing/pages/${id}/publier.json`, {})).status, 200); await page.goto(`${srv.base}/p/${slug}`); };
  const node = (n, type, props) => ({ id: `node0000000${n}`, type, props });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    id = Number((await boss.post("/marketing/pages", { name: "Paiement", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const d = db(); slug = d.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug; d.close();
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("request", (r) => { if (!r.url().startsWith(srv.base) && !r.url().startsWith("data:")) errors.push(`requête externe : ${r.url()}`); });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("Stripe : lien de paiement hébergé accepté ; contrôles (texte, taille, largeur, mention, cadenas, onglet) changent le rendu", async () => {
    const props = { link: "https://buy.stripe.com/test_abc123", label: "Réserver ma place", size: "lg", align: "center", fullWidth: true, showIcon: false, note: "Carte bancaire, 3D Secure", newTab: false };
    const r = await put([node(1, "stripebutton", props)]); assert.equal(r.status, 200, r.text);
    await open();
    const a = page.locator("a.kw-pay-btn");
    assert.equal(await a.getAttribute("href"), "https://buy.stripe.com/test_abc123");
    assert.equal(await page.locator(".kw-pay-label").innerText(), "Réserver ma place");
    assert.equal(await page.locator(".kw-pay-note").innerText(), "Carte bancaire, 3D Secure");
    assert.equal(await page.locator(".kw-pay-icon").count(), 0, "cadenas masqué");
    assert.equal(await a.getAttribute("target"), null, "même onglet");
    assert.match(await a.getAttribute("rel"), /noopener/);
    const w = await page.evaluate(() => { const e = document.querySelector(".kw-pay-btn"), p = e.parentElement; return [e.getBoundingClientRect().width, p.getBoundingClientRect().width]; });
    assert.ok(w[0] >= w[1] - 1, `pleine largeur (${w[0]} / ${w[1]})`);
    // autre jeu de réglages : petit, à gauche, avec cadenas, nouvel onglet, sans mention
    assert.equal((await put([node(1, "stripebutton", { ...props, size: "sm", fullWidth: false, showIcon: true, note: "", newTab: true })])).status, 200);
    await open();
    assert.equal(await page.locator(".kw-pay-icon").count(), 1); assert.equal(await page.locator(".kw-pay-note").count(), 0);
    assert.equal(await page.locator("a.kw-pay-btn").getAttribute("target"), "_blank");
    assert.ok((await page.locator("a.kw-pay-btn").boundingBox()).width < 400, "bouton au contenu");
    assert.deepEqual(errors, [], "aucune erreur ni requête externe");
  });

  test("PayPal : PayPal.me et pages PayPal acceptés ; styles de la racine et de la partie « Bouton » appliqués à la publication", async () => {
    let r = await put([node(2, "paypalbutton", { link: "https://paypal.me/kolakisa", label: "Faire un don", size: "md", align: "right", fullWidth: false, showIcon: true, note: "", newTab: true })]); assert.equal(r.status, 200, r.text);
    r = await put([{ ...node(2, "paypalbutton", { link: "https://www.paypal.com/donate/?hosted_button_id=ABC", label: "Don", size: "md", align: "left", fullWidth: false, showIcon: true, note: "Merci !", newTab: true }), styles: { desktop: { marginTop: "30px" } }, parts: { button: { styles: { desktop: { backgroundColor: "#112233", borderRadius: "30px" } } } } }]);
    assert.equal(r.status, 200, r.text);
    await open();
    assert.equal(await page.locator("a.kw-pay-btn").getAttribute("href"), "https://www.paypal.com/donate/?hosted_button_id=ABC");
    const css = await page.evaluate(() => { const b = getComputedStyle(document.querySelector(".kw-pay-btn")); return [b.backgroundColor, b.borderRadius]; });
    assert.equal(css[0], "rgb(17, 34, 51)"); assert.equal(css[1], "30px", "partie « Bouton » stylée");
    assert.deepEqual(errors, []);
  });

  test("sécurité : un lien qui n'est pas un vrai lien de paiement est REFUSÉ (domaine déguisé, http, identifiants, javascript:, autre prestataire)", async () => {
    const bad = ["https://buy.stripe.com.evil.example/x", "http://buy.stripe.com/x", "https://user:pw@buy.stripe.com/x", "javascript:alert(1)", "https://example.com/pay", "https://stripe.com/", "https://evil.example/?u=buy.stripe.com/x"];
    for (const link of bad) { const r = await put([node(1, "stripebutton", { link, label: "Payer" })]); assert.equal(r.status, 422, `Stripe doit refuser ${link} (${r.status})`); assert.match(r.text, /lien de paiement Stripe attendu|Lien|adresse/i); }
    const badPp = ["https://paypal.com.evil.example/donate", "https://www.paypal.com/signin", "https://www.paypal.com/", "https://paypal.me/", "http://paypal.me/x", "https://example.com/paypal.me/x"];
    for (const link of badPp) { const r = await put([node(2, "paypalbutton", { link, label: "Payer" })]); assert.equal(r.status, 422, `PayPal doit refuser ${link} (${r.status})`); }
  });

  test("barre latérale : affiche les blocs actifs de la zone « Colonne latérale » du site, rien de visible sans bloc", async () => {
    assert.equal((await put([node(3, "sidebar", { label: "Colonne" })])).status, 200);
    await open();
    assert.equal(await page.locator('[role="complementary"][aria-label="Colonne"]').count(), 1);
    assert.equal(await page.locator(".kw-sidebar-empty").isVisible().catch(() => false), false, "pas de message sur la page publique");
    const d = db(); const layout = { zones: { sidebar: [{ id: "blocksidebar01", type: "paragraph", settings: { text: "Bloc de la colonne latérale", align: "left", className: "" }, active: true }], "footer-1": [], "footer-2": [] }, inactive: [] };
    d.prepare("INSERT INTO cms_widget_layouts (site_id, layout, revision) VALUES (NULL, ?, 1)").run(JSON.stringify(layout)); d.close();
    await page.reload();
    assert.match(await page.locator('[role="complementary"][aria-label="Colonne"]').innerText(), /Bloc de la colonne latérale/);
    assert.deepEqual(errors, []);
  });
});
