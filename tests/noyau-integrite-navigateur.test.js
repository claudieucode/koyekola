// Noyau de l'éditeur dans un VRAI navigateur : duplication, suppression, annulation, sélection et identifiants.
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
async function until(check, { timeout = 12000, every = 100, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}

describe("noyau : opérations sur le document (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, page, errors, id;
  const row = () => srv.db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const doc = () => JSON.parse(row().draft);
  const all = () => { const out = []; const w = (l) => (l || []).forEach((x) => { out.push(x); w(x.children); }); w(doc().sections); return out; };
  const open = async () => {
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 15000 });
    await wait(500);
  };
  const pick = async (nid) => { await page.locator(`[data-pb-layers] .pb-node[data-id="${nid}"] > .pb-row-item`).click(); await wait(250); };
  const saved = (check, what) => until(() => { const d = doc(); return check(d) ? d : null; }, { what, timeout: 12000 });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    id = Number((await boss.post("/marketing/pages", { name: "Noyau navigateur", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = row().revision;
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: "Noyau", sections: [{ id: "sect00000001", type: "layout", children: [
      { id: "cont00000001", type: "container", children: [
        { id: "btn000000001", type: "button", props: { label: "Afficher", url: "/catalogue", variant: "primary" }, interactions: [{ trigger: "click", action: "show", target: "head00000001" }, { trigger: "click", action: "toggle", target: "head00000002" }] },
        { id: "head00000001", type: "heading", props: { text: "Cible interne", level: "2" }, startHidden: true },
      ] },
      { id: "head00000002", type: "heading", props: { text: "Cible externe", level: "2" } },
    ] }] } } });
    assert.equal(r.status, 200, r.text);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await open();
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("dupliquer un conteneur : identifiants neufs et uniques, interactions redirigées vers les copies (interne) ou conservées (externe)", async () => {
    await pick("cont00000001");
    await page.keyboard.press("Control+d");
    const d = await saved((x) => x.sections[0].children.length === 3, "copie enregistrée");
    const ids = all().map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length, "aucun identifiant en double");
    const copy = d.sections[0].children[1];
    assert.notEqual(copy.id, "cont00000001");
    const btn = copy.children.find((x) => x.type === "button"), head = copy.children.find((x) => x.type === "heading");
    assert.equal(btn.interactions[0].target, head.id, "l'interaction de la copie vise le titre de la copie");
    assert.equal(btn.interactions[1].target, "head00000002", "une cible extérieure à la copie reste la même");
    const orig = d.sections[0].children[0].children.find((x) => x.type === "button");
    assert.equal(orig.interactions[0].target, "head00000001", "l'original n'est pas touché");
  });

  test("supprimer une cible retire les interactions qui la visent ; annuler les rétablit ; la sélection est cohérente", async () => {
    await pick("head00000002");
    await page.keyboard.press("Delete");
    await saved((x) => !all().some((y) => y.id === "head00000002"), "cible supprimée");
    const refs = () => all().flatMap((x) => (x.interactions || []).map((i) => i.target));
    assert.ok(!refs().includes("head00000002"), "plus aucune interaction vers l'élément supprimé");
    assert.ok(all().filter((x) => x.type === "button").every((b) => (b.interactions || []).length >= 1), "les autres interactions sont intactes");
    await page.keyboard.press("Control+z");
    await saved((x) => all().some((y) => y.id === "head00000002"), "annulation enregistrée");
    assert.ok(refs().includes("head00000002"), "l'annulation rétablit l'élément ET ses interactions");
    await page.keyboard.press("Control+Shift+z");
    await saved((x) => !all().some((y) => y.id === "head00000002"), "rétablissement enregistré");
    assert.ok(!refs().includes("head00000002"));
    await page.keyboard.press("Control+z");
    await saved((x) => all().some((y) => y.id === "head00000002"), "annulation finale");
  });

  test("modifier un réglage garde la sélection et ne change aucun identifiant ; après rechargement tout est identique", async () => {
    const before = all().map((x) => x.id);
    await pick("head00000002");
    const tab = page.locator('[data-pb-inspector] [role="tab"]:text-is("Contenu")').first();
    if (await tab.count()) await tab.click();
    const input = page.locator('[data-pb-inspector] .pb-field:has(label:text-is("Texte")) input, [data-pb-inspector] .pb-field:has(label:text-is("Texte")) textarea').first();
    await input.fill("Titre modifié"); await input.blur();
    await saved(() => all().find((x) => x.id === "head00000002").props.text === "Titre modifié", "texte enregistré");
    assert.ok(await page.locator('[data-pb-layers] .pb-node[data-id="head00000002"] > .pb-row-item.is-selected').count(), "toujours sélectionné");
    assert.deepEqual(all().map((x) => x.id), before, "aucun identifiant modifié");
    const snap = JSON.stringify(doc());
    await open();
    assert.equal(JSON.stringify(doc()), snap, "ouvrir l'éditeur ne modifie pas le brouillon");
    assert.deepEqual(errors, []);
  });
});
