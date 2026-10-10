// IA Kolakisa dans l'éditeur (Chrome réel, vrai serveur, vrai SDK contre un faux serveur d'API local) :
// bouton, fenêtre / panneau sans perte d'état, proposition → aperçu → application en une étape, suppression à confirmer,
// analyse responsive (ordinateur intact), annotations reliées aux éléments réels et jamais enregistrées, absence de clé.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

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
  { id: "head00000001", type: "heading", props: { text: "Bienvenue", level: 1 }, styles: { desktop: { fontSize: "48px", width: "900px" } } },
  { id: "text00000001", type: "text", props: { html: "<p>Un paragraphe</p>" } },
] }] };
const op = (o) => ({ id: "", bp: "desktop", state: "normal", parent: "", index: 0, props: [], styles: [], node_json: "", title: "", description: "", why: "", ...o });

describe("IA Kolakisa dans l'éditeur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, pageId, errors, api, apiUrl, reply, prompts = [];
  const db = () => srv.db();
  const draft = () => JSON.parse(db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId).draft);
  const head = () => draft().sections[0].children[0];
  const cs = (id, prop) => page.evaluate(([i, p]) => { const e = document.querySelector("[data-pb-frame]").contentDocument.querySelector(`[data-node-id="${i}"]`); return e ? getComputedStyle(e)[p] : null; }, [id, prop]);
  const saved = () => until(() => page.evaluate(() => /Enregistré/.test(document.querySelector("[data-pb-save]").textContent)), { what: "enregistrement", every: 100 });
  const open = async () => {
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(600);
  };
  const dlg = () => page.locator("[data-pb-ai-dialog]");
  const openAi = async () => { if (!(await dlg().evaluate((d) => d.open))) await page.locator("[data-pb-ai]").click(); await until(() => dlg().evaluate((d) => d.open), { what: "fenêtre IA" }); };
  const ask = async (text) => { await page.locator('[data-pane="create"] textarea').fill(text); await page.locator("[data-pb-ai-send]").click(); };
  const reset = async () => { const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision; const r = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: CONTENT }, headers: { Origin: srv.base } }); assert.equal(r.status, 200); };

  before(async () => {
    api = http.createServer((req, res) => {
      let body = "";
      req.on("data", (d) => (body += d));
      req.on("end", () => {
        const r = JSON.parse(body || "{}");
        const prompt = (r.messages && r.messages[0] && r.messages[0].content) || "";
        prompts.push(String(prompt));
        const out = reply(String(prompt));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ id: "msg_t", type: "message", role: "assistant", model: r.model, content: [{ type: "text", text: JSON.stringify(out) }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 10, output_tokens: 20 } }));
      });
    });
    await new Promise((ok) => api.listen(0, "127.0.0.1", ok));
    apiUrl = `http://127.0.0.1:${api.address().port}`;
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ANTHROPIC_API_KEY: "sk-ant-test-factice", ANTHROPIC_BASE_URL: apiUrl });
    boss = await loginInstructor(srv);
    pageId = Number((await boss.post("/marketing/pages", { name: "IA" })).location.match(/(\d+)$/)[1]);
    await reset();
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await open();
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); if (api) api.close(); });

  test("un seul bouton « IA Kolakisa » ; grande fenêtre ↔ panneau sans perdre le texte saisi ; mode mémorisé", async () => {
    assert.equal(await page.locator("[data-pb-ai]").count(), 1);
    await openAi();
    assert.equal(await dlg().evaluate((d) => d.matches(":modal")), true);
    await page.locator('[data-pane="create"] textarea').fill("Texte en cours de saisie");
    await page.locator("[data-pb-ai-mode]").click();
    await until(() => dlg().evaluate((d) => d.open && !d.matches(":modal") && d.dataset.mode === "panel"), { what: "panneau latéral" });
    assert.equal(await page.locator('[data-pane="create"] textarea').inputValue(), "Texte en cours de saisie");
    // en panneau, la page reste utilisable : on peut cliquer dans l'éditeur
    assert.equal(await page.locator("[data-pb-undo]").isEnabled(), false);
    await page.reload(); await open();
    await page.locator("[data-pb-ai]").click();
    await until(() => dlg().evaluate((d) => d.open && d.dataset.mode === "panel"), { what: "mode mémorisé" });
    await page.locator("[data-pb-ai-mode]").click();
    await until(() => dlg().evaluate((d) => d.matches(":modal")));
    await dlg().evaluate((d) => d.close());
  });

  test("créer/modifier : proposition validée → aperçu SANS enregistrement → annulé → appliqué en UNE étape → annulable", async () => {
    await reset(); await open(); await openAi();
    reply = () => ({ summary: "Titre plus petit et paragraphe plus court", question: "", operations: [
      op({ op: "set_styles", id: "head00000001", styles: [{ prop: "fontSize", value: "36px" }], why: "plus lisible" }),
      op({ op: "set_props", id: "text00000001", props: [{ key: "html", value: "<p>Plus court</p>" }] }),
    ] });
    await ask("Rends le titre plus petit");
    await page.locator("[data-pb-ai-apply]").waitFor();
    assert.match(await page.locator(".pb-ai-changes").innerText(), /48px[\s\S]*36px/);
    // aperçu
    await page.locator("[data-pb-ai-preview]").click();
    await until(async () => (await cs("head00000001", "fontSize")) === "36px", { what: "aperçu sur le canevas" });
    await wait(1800);
    assert.equal(head().styles.desktop.fontSize, "48px", "l'aperçu ne doit rien enregistrer");
    await page.locator("[data-pb-ai-preview]").click();
    await until(async () => (await cs("head00000001", "fontSize")) === "48px", { what: "retour après aperçu" });
    // application
    await page.locator("[data-pb-ai-apply]").click();
    await until(async () => (await cs("head00000001", "fontSize")) === "36px");
    await saved();
    assert.equal(head().styles.desktop.fontSize, "36px");
    assert.match(JSON.stringify(draft()), /Plus court/);
    // une seule étape d'historique
    await dlg().evaluate((d) => d.close());
    await page.keyboard.press("Control+z");
    await until(async () => (await cs("head00000001", "fontSize")) === "48px", { what: "annulation en une étape" });
    assert.match(JSON.stringify(await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.body.innerText)), /Un paragraphe/);
    assert.equal(await page.locator("[data-pb-undo]").isDisabled(), true, "une seule étape à annuler");
  });

  test("rejet : la page ne change pas ; suppression : case de confirmation obligatoire", async () => {
    await reset(); await open(); await openAi();
    reply = () => ({ summary: "Retire le paragraphe", question: "", operations: [op({ op: "remove", id: "text00000001" })] });
    await ask("Supprime le paragraphe");
    await page.locator("[data-pb-ai-apply]").waitFor();
    assert.equal(await page.locator("[data-pb-ai-apply]").isDisabled(), true);
    await page.locator("[data-pb-ai-confirm]").check();
    assert.equal(await page.locator("[data-pb-ai-apply]").isDisabled(), false);
    await page.locator("[data-pb-ai-reject]").click();
    await wait(300);
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("[data-node-id]").length), 2);
  });

  test("question de clarification sans modification ; erreur du service affichée clairement", async () => {
    await reset(); await open(); await openAi();
    reply = () => ({ summary: "", question: "Quel bouton voulez-vous modifier ?", operations: [] });
    await ask("Change le bouton");
    await page.locator(".pb-ai-question").waitFor();
    reply = () => ({ summary: "", question: "", operations: [op({ op: "set_styles", id: "head00000001", styles: [{ prop: "fontSize", value: "énorme" }] })] });
    await ask("Agrandis");
    await page.locator(".pb-ai-error").waitFor();
    assert.match(await page.locator(".pb-ai-error").innerText(), /invalide/);
  });

  test("adapter : mesure réelle, corrections cochées, écrites SEULEMENT sur mobile ; ordinateur intact", async () => {
    await reset(); await open(); await openAi();
    await page.locator('.pb-ai-tab[data-tab="adapt"]').click();
    await page.locator("[data-pb-ai-analyse]").click();
    await page.locator(".pb-ai-rep").first().waitFor({ timeout: 15000 });
    const text = await page.locator(".pb-ai-report").innerText();
    assert.match(text, /Largeur fixe|Contenu plus large/);
    assert.equal(await page.evaluate(() => document.querySelector('.pb-top .pb-devices [aria-checked="true"]').dataset.device), "desktop", "l'écran de départ est restauré");
    await page.locator("[data-pb-ai-fixsel]").click();
    await page.locator("[data-pb-ai-apply]").waitFor();
    await page.locator("[data-pb-ai-apply]").click();
    await saved();
    const h = head();
    assert.equal(h.styles.desktop.width, "900px");
    assert.equal(h.styles.desktop.fontSize, "48px");
    assert.ok(h.styles.mobile && (h.styles.mobile.width === "100%" || h.styles.mobile.maxWidth === "100%"), JSON.stringify(h.styles));
  });

  test("corriger : annotation (rectangle) reliée à l'élément réel, mesures envoyées, correction appliquée, rien d'annotation n'est enregistré", async () => {
    await reset(); await open(); await openAi();
    await page.locator('.pb-ai-tab[data-tab="fix"]').click();
    await page.locator("[data-pb-ai-annot]").click();
    await page.locator("[data-pb-ai-canvas]").waitFor();
    const box = await page.evaluate(() => { const f = document.querySelector("[data-pb-frame]"); const e = f.contentDocument.querySelector('[data-node-id="head00000001"]'); const r = e.getBoundingClientRect(); const fr = f.getBoundingClientRect(); const k = fr.width / f.clientWidth; return { x: fr.left + (r.left + 10) * k, y: fr.top + (r.top + 5) * k, w: Math.max(30, (r.width - 20) * k), h: Math.max(20, (r.height - 10) * k) }; });
    await page.locator('[data-tool="rect"]').click();
    await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x + box.w / 2, box.y + box.h / 2, { steps: 4 }); await page.mouse.move(box.x + box.w, box.y + box.h, { steps: 4 }); await page.mouse.up();
    await page.locator('[data-pane="fix"] textarea').fill("Ce titre est trop grand");
    reply = () => ({ summary: "Titre réduit", question: "", operations: [op({ op: "set_styles", id: "head00000001", styles: [{ prop: "fontSize", value: "32px" }], why: "cause : taille de police de 48 px" })] });
    prompts.length = 0;
    await page.locator("[data-pb-ai-send-fix]").click();
    await page.locator("[data-pb-ai-apply]").waitFor();
    const sent = prompts[prompts.length - 1];
    assert.match(sent, /ANNOTATIONS[\s\S]*rect[\s\S]*head00000001/);
    assert.match(sent, /MESURES RÉELLES[\s\S]*head00000001[\s\S]*fontSize:48px/);
    await page.locator("[data-pb-ai-apply]").click();
    await saved();
    assert.equal(head().styles.desktop.fontSize, "32px");
    assert.equal(await page.locator("[data-pb-ai-canvas]").count(), 0, "les annotations disparaissent après application");
    assert.ok(!/annot|rect/i.test(JSON.stringify(draft().sections)), "aucune annotation dans la page");
  });

  test("annotations : crayon, flèche, cercle, texte, gomme, annuler, tout effacer", async () => {
    await reset(); await open(); await openAi();
    await page.locator('.pb-ai-tab[data-tab="fix"]').click();
    await page.locator("[data-pb-ai-annot]").click();
    const c = await page.locator("[data-pb-ai-canvas]").boundingBox();
    const n = () => page.evaluate(() => window.pbAi.state.annot.shapes.length);
    const drag = async (tool, a, b) => { await page.locator(`[data-tool="${tool}"]`).click(); await page.mouse.move(c.x + a[0], c.y + a[1]); await page.mouse.down(); await page.mouse.move(c.x + (a[0] + b[0]) / 2, c.y + (a[1] + b[1]) / 2, { steps: 3 }); await page.mouse.move(c.x + b[0], c.y + b[1], { steps: 3 }); await page.mouse.up(); };
    await drag("pen", [40, 40], [140, 80]);
    await drag("arrow", [200, 60], [300, 120]);
    await drag("circle", [320, 40], [420, 100]);
    await drag("rect", [450, 40], [550, 100]);
    assert.equal(await n(), 4);
    await page.locator('[data-tool="text"]').click();
    await page.mouse.click(c.x + 100, c.y + 200);
    await page.locator(".pb-ai-textbox").fill("ici"); await page.keyboard.press("Enter");
    assert.equal(await n(), 5);
    await page.locator('[data-tool="eraser"]').click();
    await page.mouse.click(c.x + 250, c.y + 90); // sur la flèche
    await page.mouse.move(c.x + 250, c.y + 90); await page.mouse.down(); await page.mouse.up();
    assert.equal(await n(), 4);
    await page.locator("[data-pb-ai-undo]").click();
    assert.equal(await n(), 3);
    await page.locator("[data-pb-ai-clear]").click();
    assert.equal(await n(), 0);
    await page.keyboard.press("Escape");
    await until(async () => (await page.locator("[data-pb-ai-canvas]").count()) === 0, { what: "sortie du mode annotation" });
  });

  test("aucune erreur de script pendant le parcours", () => { assert.deepEqual(errors, []); });
});

describe("IA Kolakisa : sans clé ANTHROPIC_API_KEY (serveur)", () => {
  let srv, boss, pageId;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ANTHROPIC_API_KEY: "" });
    boss = await loginInstructor(srv);
    pageId = Number((await boss.post("/marketing/pages", { name: "Sans clé" })).location.match(/(\d+)$/)[1]);
  });
  after(async () => { if (srv) await srv.stop(); });
  test("état « non configuré », proposition refusée (503), analyse responsive disponible", async () => {
    const st = await boss.request(`/marketing/pages/${pageId}/ia/etat`);
    assert.equal(JSON.parse(st.text).configured, false);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const p = await boss.request(`/marketing/pages/${pageId}/ia/proposer`, { method: "POST", json: { instruction: "Bonjour", revision: rev }, headers: { Origin: srv.base } });
    assert.equal(p.status, 503);
    assert.match(JSON.parse(p.text).error, /ANTHROPIC_API_KEY/);
    const r = await boss.request(`/marketing/pages/${pageId}/ia/responsive`, { method: "POST", json: { revision: rev, issues: [] }, headers: { Origin: srv.base } });
    assert.equal(r.status, 200);
  });

  test("permissions : une personne en lecture seule ne peut ni demander une proposition ni lancer la correction responsive", async () => {
    const c = await newStudent(srv);
    const u = srv.db().prepare("SELECT id FROM users WHERE email = ?").get(c.email);
    const org = srv.db().prepare("SELECT organization_id o FROM mk_landing_pages WHERE id = ?").get(pageId).o;
    srv.db().prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, 'viewer')").run(org, u.id);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const a = await c.request(`/marketing/pages/${pageId}/ia/proposer`, { method: "POST", json: { instruction: "x", revision: rev }, headers: { Origin: srv.base } });
    assert.equal(a.status, 403);
    const b = await c.request(`/marketing/pages/${pageId}/ia/responsive`, { method: "POST", json: { revision: rev, issues: [] }, headers: { Origin: srv.base } });
    assert.equal(b.status, 403);
  });
});
