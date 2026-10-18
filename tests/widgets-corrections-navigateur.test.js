// Régressions des défauts trouvés par l'audit du catalogue de widgets (mission 8), éprouvés dans l'éditeur réel (Chrome) :
//   D1  Code : « Lignes surlignées » illisible était perdu sans aucun message → refus expliqué, valeur précédente conservée ;
//   D2  Fil d'Ariane : un champ « Adresse » était proposé pour le dernier niveau alors que le serveur l'ignore → remplacé par une explication ;
//   D4  Ancre de menu : la copie (Ctrl+D, copier-coller) perdait son nom → le serveur refusait TOUT le brouillon (422) ; elle reçoit un nom unique ;
//   D3  Fenêtre, boîte retournable, offre tarifaire : texte du bouton seul (ou adresse seule) disparaissait sans un mot → message « texte ET adresse ».
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

describe("corrections du catalogue de widgets (éditeur réel, Chrome)", { skip: SKIP }, () => {
  let srv, boss, browser, page, id;
  const errors = [];
  const row = () => srv.db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const saved = (nid) => { const find = (l) => { for (const n of l || []) { if (n.id === nid) return n; const f = find(n.children); if (f) return f; } return null; }; return find(JSON.parse(row().draft || row().sections).sections); };
  const toast = () => page.evaluate(() => { const t = document.querySelector("[data-pb-toast]"); return t && !t.hidden ? t.textContent.trim() : ""; });
  const put = async (children) => { const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: row().revision, content: { title: "C", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children }] }] } }, headers: { Origin: srv.base } }); assert.equal(r.status, 200, r.text); };
  const open = async () => {
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && window.__pb; }, null, { timeout: 30000 });
    await wait(600);
  };
  const choose = async (nid) => {
    await page.locator(`[data-pb-layers] .pb-node[data-id="${nid}"] > .pb-row-item`).first().click({ timeout: 8000 }); await wait(250);
    const first = (await page.$$eval("[data-pb-inspector] [role=tab]", (e) => e.map((x) => x.textContent))).find((x) => !/^(Style|Avancé|Interactions)$/.test(x));
    if (first) await page.locator("[data-pb-inspector] [role=tab]", { hasText: new RegExp(`^${first}$`) }).click();
    await wait(150);
    await page.$$eval("[data-pb-inspector] details", (ds) => ds.forEach((d) => { d.open = true; })); await wait(150);
  };
  const field = (label) => page.locator("[data-pb-inspector] .pb-field", { hasText: label }).locator("input[type=text], textarea").first();

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    id = Number((await boss.post("/marketing/pages", { name: "Corrections", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    await put([
      { id: "code00000001", type: "code", props: { text: "a\nb\nc\nd\ne", highlight: "2" } },
      { id: "crumb0000001", type: "breadcrumb", props: { items: [{ label: "Accueil", url: "/" }, { label: "Cette page" }], separator: "chevron" } },
      { id: "anch00000001", type: "menuanchor", anchor: "tarifs" },
      { id: "flip00000001", type: "flipbox", props: { icon: "star", frontTitle: "Recto", frontText: "t", backTitle: "Verso", backText: "t", effect: "flip", height: 280 } },
      { id: "modal0000001", type: "modal", props: { buttonLabel: "Ouvrir", title: "Titre", text: "Contenu", variant: "outline", size: "md" } },
    ]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("D1 code : une saisie illisible dans « Lignes surlignées » est expliquée et n'efface pas la valeur ; une saisie valide est enregistrée", async () => {
    await open(); await choose("code00000001");
    const f = field("Lignes surlignées");
    await f.fill("Essai zq"); await f.press("Tab"); await wait(500);
    assert.match(await toast(), /Lignes surlignées.*numéros|plages/, "message affiché");
    await wait(1500);
    assert.equal(saved("code00000001").props.highlight, "2", "la valeur précédente est conservée");
    await choose("code00000001");
    assert.equal(await field("Lignes surlignées").inputValue(), "2", "le champ affiche de nouveau la valeur conservée");
    await field("Lignes surlignées").fill("2-3, 5"); await field("Lignes surlignées").press("Tab");
    await page.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 10000 });
    assert.equal(saved("code00000001").props.highlight, "2,3,5");
    // plage inversée ou trop longue : refusée de la même façon
    await field("Lignes surlignées").fill("5-2"); await field("Lignes surlignées").press("Tab"); await wait(500);
    assert.match(await toast(), /Lignes surlignées/);
  });

  test("D2 fil d'Ariane : pas de champ « Adresse » pour le dernier niveau (explication à la place) ; il apparaît quand un niveau est ajouté après", async () => {
    await open(); await choose("crumb0000001");
    const urlFields = () => page.locator("[data-pb-inspector] .pb-repeat-item", { hasText: "Adresse" }).count();
    const items = () => page.locator("[data-pb-inspector] .pb-repeat-item");
    assert.equal(await items().count(), 2);
    assert.equal(await items().nth(0).locator("label", { hasText: "Adresse" }).count(), 1, "le premier niveau a une adresse");
    assert.equal(await items().nth(1).locator("label", { hasText: "Adresse" }).count(), 0, "le dernier niveau n'en a pas");
    assert.match(await items().nth(1).innerText(), /page actuelle/);
    await page.locator("[data-pb-inspector] button", { hasText: /^Ajouter$/ }).first().click(); await wait(400);
    assert.equal(await items().count(), 3);
    assert.equal(await items().nth(1).locator("label", { hasText: "Adresse" }).count(), 1, "l'ancien dernier niveau reçoit un champ adresse");
    assert.equal(await items().nth(2).locator("label", { hasText: "Adresse" }).count(), 0);
    void urlFields;
  });

  test("D3 fenêtre : texte du bouton seul → message ; texte + adresse → bouton enregistré dans la fenêtre publiée", async () => {
    await open(); await choose("modal0000001");
    await field("Bouton dans la fenêtre").fill("Je m'inscris"); await field("Bouton dans la fenêtre").press("Tab"); await wait(400);
    assert.match(await toast(), /texte ET l'adresse/);
    assert.equal(saved("modal0000001").props.ctaUrl, undefined);
    await field("Son adresse").fill("/catalogue"); await field("Son adresse").press("Tab");
    await page.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 10000 });
    const p = saved("modal0000001").props;
    assert.deepEqual([p.ctaLabel, p.ctaUrl], ["Je m'inscris", "/catalogue"]);
    assert.deepEqual(errors, []);
  });

  test("D3 boîte retournable : même règle pour le bouton du verso", async () => {
    await open(); await choose("flip00000001");
    await field("Bouton du verso : texte").fill("Voir"); await field("Bouton du verso : texte").press("Tab"); await wait(400);
    assert.match(await toast(), /texte ET l'adresse/);
    await field("Bouton du verso : adresse").fill("/catalogue"); await field("Bouton du verso : adresse").press("Tab");
    await page.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 10000 });
    const p = saved("flip00000001").props;
    assert.deepEqual([p.ctaLabel, p.ctaUrl], ["Voir", "/catalogue"]);
  });

  test("D4 ancre de menu : dupliquer (Ctrl+D) donne à la copie un nom unique et le brouillon reste enregistrable", async () => {
    await open(); await choose("anch00000001");
    await page.keyboard.press("Control+d"); await wait(300);
    await page.keyboard.press("Control+d"); await wait(300);
    await page.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 15000 });
    const anchors = []; const walk = (l) => { for (const n of l || []) { if (n.type === "menuanchor") anchors.push(n.anchor); walk(n.children); } };
    walk(JSON.parse(row().draft || row().sections).sections);
    assert.equal(anchors.length, 3, "l'original et deux copies sont enregistrés sur le serveur");
    assert.equal(new Set(anchors).size, 3, `noms uniques : ${anchors.join(", ")}`);
    assert.ok(anchors.every((a) => /^[a-z][a-z0-9-]{0,39}$/.test(a)), `noms valides : ${anchors.join(", ")}`);
    assert.equal(anchors[0], "tarifs", "l'original garde son nom");
    assert.equal(await toast(), "", "aucun message d'erreur");
  });
});

// D5 (P1) — le canevas pouvait DISPARAÎTRE : quand un nouveau rendu arrivait pendant qu'un rechargement complet du cadre était encore en cours,
// l'éditeur retirait le cadre en attente (`swapping.remove()`) AVANT d'oublier qu'il attendait ; Chrome déclenchait alors son événement `load`
// pendant le retrait, ce qui « terminait » l'échange du cadre qu'on était en train de jeter : l'ancien cadre (le vrai canevas) était retiré, le jeté
// aussi, et il ne restait aucun canevas jusqu'au rechargement de l'éditeur. Observé sur une page chargée (380 widgets variés) dans la mesure de performance.
describe("D5 canevas : jamais sans cadre, même quand les rendus se chevauchent (éditeur réel, Chrome)", { skip: SKIP }, () => {
  let srv, boss, browser;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); browser = await chromium.launch({ executablePath: CHROME, headless: true }); });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("rendus qui se chevauchent pendant un rechargement complet du cadre : à la fin il reste exactement un cadre de canevas, qui affiche la page", { timeout: 300000 }, async () => {
    const db = srv.db();
    let totalDiscards = 0;
    for (let essai = 1; essai <= 3; essai++) {
      const id = Number((await boss.post("/marketing/pages", { name: "Canevas " + essai, template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
      // un accordéon (contenu interactif : chaque modification recharge le cadre en entier) et deux contenus externes (cadres dont le chargement est ralenti plus bas)
      const kids = [
        { id: "target0000001", type: "accordion", props: { items: [{ q: "Votre question ?", a: "La réponse." }] } },
        { id: "embed00000001", type: "embed", props: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Contenu intégré" } },
        { id: "video0000001a", type: "video", props: { url: "https://www.youtube.com/watch?v=9bZkp7q19f0", title: "Une vidéo" } },
      ];
      const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision, content: { title: "C", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: kids }] }] } }, headers: { Origin: srv.base } });
      assert.equal(r.status, 200, r.text.slice(0, 200));
      const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
      await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
      const page = await ctx.newPage();
      const errs = []; page.on("pageerror", (e) => errs.push(e.message));
      await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
      await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return window.__pb && f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 60000 });
      await wait(600);
      // Reproduit ce que Chrome fait nativement par intermittence : retirer un cadre dont le chargement est presque terminé déclenche son `load` PENDANT le retrait.
      // `discards` compte les cadres en attente réellement jetés (voir la limite connue plus bas).
      await page.evaluate(() => { window.__discards = 0; const orig = Element.prototype.remove; Element.prototype.remove = function () { if (this.tagName === "IFRAME" && this.style.visibility === "hidden") { window.__discards++; this.dispatchEvent(new Event("load")); } return orig.call(this); }; });
      await page.evaluate(() => document.querySelector('[data-pb-layers] .pb-node[data-id="target0000001"] > .pb-row-item').click()); await wait(500);
      // les contenus externes répondent lentement : le chargement du cadre de canevas, qui attend le leur, reste « en attente » assez longtemps pour que le rendu suivant arrive avant sa fin
      await page.route((url) => !url.href.startsWith(srv.base), async (route) => { await wait(1500); await route.abort().catch(() => {}); });
      for (let i = 0; i < 12; i++) {
        await page.evaluate((i) => { const f = [...document.querySelectorAll("[data-pb-inspector] textarea, [data-pb-inspector] input[type=text]")].find((e) => /Votre question|Valeur/.test(e.value)); f.value = "Valeur " + i; f.dispatchEvent(new Event("input", { bubbles: true })); }, i);
        await wait(90);
      }
      await page.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 30000 });
      await wait(4000); // laisse finir les rechargements en cours (les contenus externes sont ralentis)
      const state = await page.evaluate(() => { const fr = [...document.querySelectorAll("[data-pb-frame]")]; const d = fr[0] && fr[0].contentDocument; return { frames: fr.length, hasBody: !!(d && d.body), question: d && d.body ? (d.body.querySelector(".kw-n-target0000001 summary") || {}).textContent : null }; });
      const discards = await page.evaluate(() => window.__discards);
      await ctx.close();
      totalDiscards += discards;
      console.log(`# D5 essai ${essai} : ${discards} cadre(s) en attente jeté(s)`);
      assert.deepEqual(errs, [], `essai ${essai} : erreurs de script`);
      assert.equal(state.frames, 1, `essai ${essai} : cadres de canevas = ${state.frames}`);
      assert.equal(state.question, "Valeur 11", `essai ${essai} : le canevas n'affiche pas la dernière saisie (${JSON.stringify(state)})`);
    }
    // Limite connue : le chevauchement dépend du minutage de Chrome et n'est pas provoqué à coup sûr (souvent 0 cadre jeté ici). La preuve du défaut est la mesure de
    // performance (`widgets-performance-navigateur`, page de 380 widgets) où le canevas disparaissait environ une fois sur deux avant la correction ; ce test garde l'invariant.
    console.log(`# D5 : ${totalDiscards} cadre(s) en attente jeté(s) au total sur 3 essais`);
  });
});
