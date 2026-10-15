// Formats de mise en page dans l'éditeur (Chrome réel, vrai serveur) : création guidée depuis la fenêtre « Nouvelle page », réglages de la page,
// largeur fluide plafonnée (ordinateur / tablette / mobile), verrouillage refusé à l'écran ET par le serveur, déverrouillage explicite, persistance.
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
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "cont00000001", type: "container", children: [{ id: "head00000001", type: "heading", props: { text: "Titre", level: 1 } }], styles: { desktop: { backgroundColor: "#eeeeee", paddingTop: "20px", paddingBottom: "20px" } } },
  { id: "text00000001", type: "text", props: { html: "<p>Un paragraphe</p>" } },
] }] };

describe("formats de mise en page (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, pageId, errors;
  const db = () => srv.db();
  const row = () => db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(pageId);
  const draft = () => JSON.parse(row().draft);
  const layout = () => (draft().theme || {}).layout;
  const saved = () => until(() => page.evaluate(() => /Enregistré|Tout est enregistré/.test(document.querySelector("[data-pb-save]").textContent)), { what: "enregistrement", every: 100 });
  const open = async () => {
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(600);
  };
  const width = (id) => page.evaluate((i) => document.querySelector("[data-pb-frame]").contentDocument.querySelector(`[data-node-id="${i}"]`).getBoundingClientRect().width, id);
  const pageTab = async () => { await page.locator("#pb-tab-page").click(); await wait(300); };
  const fieldFor = (label) => page.locator(`[data-pb-page-settings] .pb-field:has(> label:text-is("${label}"))`);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("« Nouvelle page » : conception libre ou guidée ; le choix guidé verrouillé est enregistré et appliqué au canevas", async () => {
    await page.goto(`${srv.base}/marketing/pages#nouvelle`);
    await page.locator("#nouvelle").waitFor({ state: "visible" });
    assert.equal(await page.locator('#nouvelle [name="layoutMode"]').count(), 2);
    assert.equal(await page.locator('#nouvelle [name="layoutMode"][value="free"]').isChecked(), true, "libre par défaut");
    await page.locator("#lp-name").fill("Page guidée");
    await page.locator('#nouvelle [name="layoutMode"][value="guided"]').check();
    await page.locator("#lp-format").selectOption("compact");
    await page.locator('#nouvelle [name="layoutLocked"]').check();
    await Promise.all([page.waitForURL(/\/editeur/), page.locator('#nouvelle button[type="submit"]').click()]);
    pageId = Number(page.url().match(/pages\/(\d+)/)[1]);
    assert.deepEqual(JSON.parse(row().theme).layout, { mode: "guided", format: "compact", maxWidth: 960, gutter: 24, locked: true });
    const rev = row().revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { ...CONTENT, theme: JSON.parse(row().theme) } }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    await open();
    assert.equal(Math.round(await width("cont00000001")), 960, "ordinateur : plafonné à 960 px");
  });

  test("largeur fluide : tablette et mobile suivent l'écran moins les marges (pas de largeur fixe)", async () => {
    await page.locator('.pb-top .pb-devices [data-device="tablet"]').click(); await wait(500);
    assert.equal(Math.round(await width("cont00000001")), 820 - 48);
    await page.locator('.pb-top .pb-devices [data-device="mobile"]').click(); await wait(500);
    assert.equal(Math.round(await width("cont00000001")), 390 - 48);
    await page.locator('.pb-top .pb-devices [data-device="desktop"]').click(); await wait(300);
  });

  test("réglages de la page : format affiché, verrouillé ; Conception et Format désactivés tant que verrouillé", async () => {
    await pageTab();
    await fieldFor("Conception").waitFor();
    assert.equal(await fieldFor("Conception").locator("select").inputValue(), "guided");
    assert.equal(await fieldFor("Conception").locator("select").isDisabled(), true);
    assert.equal(await fieldFor("Format").locator("select").isDisabled(), true);
    assert.equal(await page.locator("[data-pb-page-settings] .pb-check", { hasText: "Verrouiller le format" }).locator("input").isChecked(), true);
  });

  test("verrouillé : la largeur d'un élément de premier niveau est refusée à l'écran ; un texte reste modifiable", async () => {
    await page.locator('[data-pb-layers] .pb-node[data-id="cont00000001"] > .pb-row-item').click(); await wait(500);
    assert.match(await page.locator("[data-pb-inspector]").innerText(), /Format verrouillé/);
    const t = page.locator("[data-pb-inspector] .pb-insp-tabs").getByRole("tab", { name: "Style" });
    if (await t.count()) await t.click();
    await page.evaluate(() => document.querySelectorAll("[data-pb-inspector] details.pb-acc").forEach((d) => { d.open = true; }));
    await wait(300);
    const w = page.locator('[data-pb-inspector] [data-prop="width"] input').first();
    await w.scrollIntoViewIfNeeded();
    await w.fill("500"); await w.press("Enter"); await wait(500);
    assert.match(await page.locator("[data-pb-toast]").innerText(), /Format verrouillé/);
    assert.equal(Math.round(await width("cont00000001")), 960);
    await wait(1500);
    assert.equal(JSON.stringify(draft().sections).includes('"width"'), false, "rien d'écrit côté serveur");
  });

  test("le serveur refuse aussi (autre voie que l'interface), avec un message clair", async () => {
    const d = draft();
    d.sections[0].children[0].styles.desktop.width = "500px";
    const r = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: row().revision, content: d }, headers: { Origin: srv.base } });
    assert.equal(r.status, 422);
    assert.match(JSON.parse(r.text).error.message, /Format verrouillé/);
  });

  test("déverrouiller (action explicite, enregistrée) → la largeur devient réglable ; relu après rechargement", async () => {
    await pageTab();
    await page.locator("[data-pb-page-settings] .pb-check", { hasText: "Verrouiller le format" }).locator("input").uncheck();
    await until(() => layout() && layout().locked === false, { what: "déverrouillage enregistré" });
    await open();
    await pageTab();
    assert.equal(await fieldFor("Format").locator("select").isDisabled(), false);
    await fieldFor("Format").locator("select").selectOption("large");
    await until(() => layout() && layout().format === "large" && layout().maxWidth === 1440, { what: "nouveau format enregistré" });
    await wait(500);
    const w = await width("cont00000001");
    assert.ok(w >= 960 && w <= 1440, `largeur ${w}`);
    assert.ok(await page.evaluate(() => [...document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("style")].some((x) => x.textContent.includes("1440px"))), "le canevas applique le plafond du nouveau format");
  });

  test("retour à la conception libre : le format disparaît, la page reste intacte", async () => {
    await pageTab();
    await fieldFor("Conception").locator("select").selectOption("free");
    await until(() => layout() === undefined, { what: "conception libre enregistrée" });
    assert.equal(draft().sections[0].children.length, 2);
  });

  // Régression : les sections « typées » d'un gabarit (bandeau, texte, liste, FAQ…) sont rendues dans `div.lp-block`. Le format ne les atteignait pas :
  // `.lp-main` perdait son padding et le texte touchait le bord de l'écran (0 px). Mesuré ici dans l'éditeur ET dans l'aperçu, sur 3 largeurs.
  test("gabarit en conception guidée : les blocs typés respectent la largeur du format et gardent des marges latérales (éditeur et aperçu)", async () => {
    const res = await boss.request("/marketing/pages", { method: "POST", form: { name: "Gabarit guidé", ouvrir: "editeur", template: "vente", layoutMode: "guided", layoutFormat: "standard" }, headers: { Origin: srv.base } });
    const id = Number(res.location.match(/pages\/(\d+)/)[1]);
    // Mesure : chaque bloc de premier niveau (hors en-tête / pied du site) et chaque texte, dans la page ou l'iframe `target`
    const measure = (target) => target.evaluate(() => {
      const main = document.querySelector(".lp-main");
      const blocks = [...main.children].filter((b) => b.classList.contains("lp-block") && !b.classList.contains("lp-site-part"));
      const edge = [...main.querySelectorAll("h1,h2,h3,p,li,a.lp-btn")].filter((e) => !e.closest(".lp-preview-bar,.kw-add") && e.getBoundingClientRect().width > 0)
        .map((e) => Math.min(e.getBoundingClientRect().left, innerWidth - e.getBoundingClientRect().right));
      return { vw: innerWidth, n: blocks.length, widths: blocks.map((b) => Math.round(b.getBoundingClientRect().width)), minEdge: Math.round(Math.min(...edge)), overflow: document.documentElement.scrollWidth - innerWidth };
    });
    const check = (m, where) => {
      assert.ok(m.n >= 5, `${where} : blocs trouvés (${m.n})`);
      const want = Math.min(m.vw - 48, 1200);
      for (const w of m.widths) assert.equal(w, want, `${where} : largeur d'un bloc (${w}) = format (${want}) à ${m.vw} px`);
      assert.ok(m.minEdge >= 24, `${where} : un texte est à ${m.minEdge} px du bord (marge latérale du format : 24 px) à ${m.vw} px`);
      assert.equal(m.overflow, 0, `${where} : pas de débordement horizontal`);
    };
    const pv = await context.newPage();
    for (const w of [1440, 820, 390]) {
      await pv.setViewportSize({ width: w, height: 900 });
      await pv.goto(`${srv.base}/marketing/pages/${id}/apercu`); await wait(400);
      check(await measure(pv), `aperçu ${w}`);
    }
    await pv.close();
    const ed = await context.newPage();
    await ed.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await ed.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector(".lp-block"); });
    await wait(600);
    for (const dev of ["desktop", "tablet", "mobile"]) {
      await ed.locator(`.pb-top .pb-devices [data-device="${dev}"]`).click(); await wait(600);
      check(await measure(await (await ed.$("[data-pb-frame]")).contentFrame()), `éditeur ${dev}`);
    }
    await ed.close();
  });

  test("bloc pleine largeur : le fond reste pleine largeur, le texte suit la colonne du format (guidé) ou l'ancienne colonne (libre)", async () => {
    const mk = async (mode) => {
      const res = await boss.request("/marketing/pages", { method: "POST", form: { name: "Pleine " + mode, ouvrir: "editeur", template: "vente", layoutMode: mode, layoutFormat: "standard" }, headers: { Origin: srv.base } });
      const id = Number(res.location.match(/pages\/(\d+)/)[1]);
      const r = db().prepare("SELECT draft, sections, theme, revision FROM mk_landing_pages WHERE id = ?").get(id);
      const raw = JSON.parse(r.draft || r.sections), c = raw.sections ? raw : { sections: raw };
      c.sections[0].style = { ...(c.sections[0].style || {}), width: "full", background: "dark" };
      const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: r.revision, content: { ...c, theme: JSON.parse(r.theme || "{}") } }, headers: { Origin: srv.base } });
      assert.equal(put.status, 200, put.text.slice(0, 200));
      return id;
    };
    const pv = await context.newPage();
    await pv.setViewportSize({ width: 1440, height: 900 });
    const read = async (id) => { await pv.goto(`${srv.base}/marketing/pages/${id}/apercu`); return pv.evaluate(() => { const b = document.querySelector(".lp-block-hero").getBoundingClientRect(), t = document.querySelector(".lp-block-hero h1").getBoundingClientRect(); return { bl: Math.round(b.left), br: Math.round(b.right), tl: Math.round(t.left), tr: Math.round(t.right) }; }); };
    const guided = await read(await mk("guided"));
    assert.deepEqual(guided, { bl: 0, br: 1440, tl: 120, tr: 1320 }, "guidé : fond pleine largeur, texte sur la colonne du format (1200 px)");
    const free = await read(await mk("free"));
    assert.deepEqual(free, { bl: 0, br: 1440, tl: 340, tr: 1100 }, "libre : comportement historique inchangé (colonne de 760 px)");
    await pv.close();
  });

  test("aucune erreur de script", () => { assert.deepEqual(errors, []); });
});
