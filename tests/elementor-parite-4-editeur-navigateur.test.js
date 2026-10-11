// Parité Elementor, partie 5 : les NOUVEAUX réglages sont atteignables et enregistrent la bonne valeur depuis l'inspecteur de l'éditeur (Chrome réel).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 10000, every = 80, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}

describe("parité Elementor : réglages dans l'inspecteur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, page, errors, id;
  const db = () => srv.db();
  const row = () => db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const doc = () => JSON.parse(row().draft);
  const node = (nid) => { let f = null; const walk = (l) => (l || []).forEach((n) => { if (n.id === nid) f = n; walk(n.children); }); walk(doc().sections); return f; };
  const open = async () => {
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 15000 });
    await wait(500);
  };
  const pick = async (nid) => { await page.locator(`[data-pb-layers] .pb-node[data-id="${nid}"] > .pb-row-item`).click(); await wait(250); };
  const openAll = () => page.locator("[data-pb-inspector] details").evaluateAll((ds) => ds.forEach((d) => { d.open = true; }));
  const field = (label) => page.locator(`[data-pb-inspector] .pb-field:has(label:text-is("${label}"))`).first();
  const tab = (name) => page.locator(`[data-pb-inspector] [role="tab"]:text-is("${name}")`).first().click();
  const check = (label) => page.locator(`[data-pb-inspector] label:has-text("${label}") input[type=checkbox]`).first();

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const created = await boss.post("/marketing/pages", { name: "Inspecteur 4", template: "", ouvrir: "editeur" });
    id = Number(created.location.match(/pages\/(\d+)/)[1]);
    const rev = row().revision;
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { title: "Inspecteur 4", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
      { id: "head00000001", type: "heading", props: { text: "Titre", level: "2" } },
      { id: "modl00000001", type: "modal", props: { buttonLabel: "Ouvrir", title: "Fenêtre", text: "Contenu" } },
      { id: "text00000001", type: "text", props: { html: "<p>Texte</p>" } },
      { id: "ctdw00000001", type: "countdown", props: { until: new Date(Date.now() + 86400000).toISOString() } },
      { id: "cont00000002", type: "container", styles: { desktop: { gradient: { from: "#112233", to: "#445566", angle: 90 } } }, children: [] },
    ] }] }] } } });
    assert.equal(r.status, 200, r.text);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await open();
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("titre : balise HTML (paragraphe)", async () => {
    await pick("head00000001"); await tab("Contenu"); await openAll();
    await field("Balise HTML").locator("select").selectOption("p");
    await until(() => node("head00000001").props.tag === "p", { what: "balise enregistrée" });
    await field("Balise HTML").locator("select").selectOption("");
    await until(() => node("head00000001").props.tag === undefined, { what: "balise retirée" });
  });

  test("fenêtre : ouverture automatique (déclencheur, délai, fréquence, fermeture, verrou)", async () => {
    await pick("modl00000001"); await tab("Contenu"); await openAll();
    await field("Quand ouvrir la fenêtre").locator("select").selectOption("load");
    await until(() => node("modl00000001").props.auto === "load", { what: "déclencheur" });
    assert.equal(node("modl00000001").props.freq, "session");
    await page.locator('[data-pb-inspector] .pb-field:has(label:has-text("Délai avant ouverture")) input').first().waitFor({ timeout: 6000 });
    await field("Fréquence").locator("select").selectOption("once");
    await until(() => node("modl00000001").props.freq === "once", { what: "fréquence" });
    await check("Empêcher la fermeture").check();
    await until(() => node("modl00000001").props.lock === true, { what: "verrou" });
    await field("Quand ouvrir la fenêtre").locator("select").selectOption("");
    await until(() => node("modl00000001").props.auto === undefined && node("modl00000001").props.lock === undefined, { what: "retour au clic seul" });
  });

  test("texte : sens d'écriture ; conteneur : accordéon, dégradé à couleur supplémentaire", async () => {
    await pick("text00000001"); await tab("Style"); await openAll();
    assert.ok(await page.locator('[data-pb-inspector] [data-prop="direction"]').count() >= 1, "contrôle « Sens d'écriture » présent");
    await pick("cont00000001"); await tab("Général"); await openAll();
    await field("Affichage des éléments à l'intérieur").locator("select").selectOption("accordion");
    await until(() => node("cont00000001").props && node("cont00000001").props.mode === "accordion", { what: "mode accordéon" });
    await check("Un seul volet ouvert").check();
    await until(() => node("cont00000001").props.accSingle === true, { what: "un seul volet" });
    await field("Affichage des éléments à l'intérieur").locator("select").selectOption("");
    await until(() => node("cont00000001").props.mode === undefined && node("cont00000001").props.accSingle === undefined, { what: "retour normal" });
    await pick("cont00000002"); await tab("Style"); await openAll();
    await page.getByRole("button", { name: "Ajouter une couleur au dégradé" }).first().click();
    await until(() => ((node("cont00000002").styles.desktop.gradient || {}).extra || []).length === 1, { what: "couleur supplémentaire" });
    assert.ok(await page.getByText("Filtres de l'arrière-plan (verre dépoli)").count() >= 1, "bloc verre dépoli");
    assert.ok(await page.getByText("Découpe du fond").count() >= 1, "découpe du fond");
  });

  test("compte à rebours : mode, fin, unités ; conditions d'affichage ET / OU", async () => {
    await pick("ctdw00000001"); await tab("Contenu"); await openAll();
    await field("Mode").locator("select").selectOption("evergreen");
    await until(() => node("ctdw00000001").props.mode === "evergreen" && node("ctdw00000001").props.minutes === 60, { what: "minuteur par visiteur" });
    await field("À la fin").locator("select").selectOption("redirect");
    await until(() => node("ctdw00000001").props.expire === "redirect" && node("ctdw00000001").props.redirectUrl === "/", { what: "redirection" });
    await check("Afficher : Jours").uncheck();
    await until(() => (node("ctdw00000001").props.hideUnits || []).includes("days"), { what: "jours masqués" });
    // conditions : texte
    await pick("text00000001"); await tab("Avancé"); await openAll();
    await field("Afficher à").locator("select").selectOption("known");
    await until(() => (node("text00000001").audience || {}).who === "known", { what: "condition principale" });
    await page.getByRole("button", { name: "Ajouter une condition (ET)" }).first().click();
    await until(() => ((node("text00000001").audience || {}).and || []).length === 1, { what: "condition ET" });
    await page.getByRole("button", { name: "Ajouter un autre groupe (OU)" }).first().click();
    await until(() => ((node("text00000001").audience || {}).or || []).length === 1, { what: "groupe OU" });
    await page.getByRole("button", { name: "Retirer cette condition" }).first().click();
    await until(() => !((node("text00000001").audience || {}).and || []).length, { what: "condition ET retirée" });
  });

  test("page : magnétisme de défilement", async () => {
    await page.locator("#pb-tab-page").click();
    const sel = page.locator('[data-pb-page-settings] .pb-field:has(label:text-is("Accrocher les sections")) select').first();
    await sel.waitFor({ timeout: 8000 });
    await sel.selectOption("center");
    await until(() => ((doc().theme || {}).scrollSnap || {}).position === "center", { what: "magnétisme enregistré" });
  });

  test("aucune erreur de script", () => { assert.deepEqual(errors, []); });
});
