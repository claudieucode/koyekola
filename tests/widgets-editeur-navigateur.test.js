// Cycle de vie de CHAQUE widget de la bibliothèque dans l'éditeur réel (Chrome) : insertion par un clic dans la bibliothèque, identifiant valide
// et unique, sélection, duplication (identifiants neufs, contenu identique), annulation / rétablissement, suppression sans toucher aux voisins,
// enregistrement serveur identique à l'éditeur, rechargement identique. Les éléments qui demandent un choix à l'insertion (image, formation…)
// passent par une boîte de dialogue : ils sont couverts par leurs tests propres (voir docs/KOLAKISA_WIDGETS_FUNCTIONAL_MATRIX.md).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const nodes = require("../src/marketing/pages/nodes");
const { startServer, loginInstructor } = require("./helpers");
const { NEEDS_DATA, OVER, EXTRA } = require("./widgets-helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const types = Object.keys(nodes.NODE_TYPES).filter((t) => nodes.PALETTE[t] && !nodes.PALETTE[t].asks);
// Éléments qui demandent un choix à l'insertion : ajoutés ici avec un contenu réaliste (comme le ferait la boîte de dialogue), puis éprouvés de la même façon
const asked = Object.keys(nodes.NODE_TYPES).filter((t) => nodes.PALETTE[t] && nodes.PALETTE[t].asks && !NEEDS_DATA.has(t));

describe("cycle de vie de chaque widget dans l'éditeur (Chrome réel)", { skip: SKIP }, () => {
  let srv, boss, browser, page, id;
  const errors = [];
  const row = () => srv.db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const walk = (list, fn) => { for (const n of list || []) { fn(n); walk(n.children, fn); } };
  const flat = (content) => { const out = []; walk(content.sections, (n) => out.push(n)); return out; };
  const doc = () => page.evaluate(() => window.__pb.content());
  // une copie reçoit de nouveaux identifiants et un nouveau nom d'ancre (une ancre est unique dans la page) : le reste est identique
  const strip = (n) => JSON.stringify(n, (k, v) => (k === "id" || k === "anchor" ? undefined : v));

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    id = Number((await boss.post("/marketing/pages", { name: "Cycle", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  const open = async () => {
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && window.__pb; }, null, { timeout: 30000 });
    await wait(600);
  };
  const settle = async () => { await page.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 15000 }); };
  const pick = async (nid) => { await page.locator(`[data-pb-layers] .pb-node[data-id="${nid}"] > .pb-row-item`).first().click({ timeout: 8000 }); await wait(120); };
  const addFromLibrary = async (t) => {
    await page.evaluate(() => { const b = document.querySelector("#pb-tab-elements"); if (b) b.click(); });
    const search = page.locator("[data-pb-el-search]");
    await search.fill(nodes.NODE_TYPES[t].label); await wait(150);
    await page.locator(`.pb-pal-item[data-widget="${t}"]`).first().click({ timeout: 8000 });
    await wait(150);
  };

  test("insertion de chaque widget : un seul nouvel élément du bon type, identifiant valide et unique, sélectionné", { timeout: 900000 }, async () => {
    await open();
    for (const t of types) {
      const before = await doc(); const ids = new Set(flat(before).map((n) => n.id));
      await addFromLibrary(t);
      const after = await doc(); const fresh = flat(after).filter((n) => !ids.has(n.id));
      const mine = fresh.filter((n) => n.type === t);
      assert.equal(mine.length, 1, `${t} : ${mine.length} élément(s) du type créé(s) (nouveaux : ${fresh.map((n) => n.type).join(", ")})`);
      assert.match(mine[0].id, /^[a-z0-9]{12}$/, `${t} : identifiant invalide ${mine[0].id}`);
      const all = flat(after).map((n) => n.id); assert.equal(new Set(all).size, all.length, `${t} : identifiants en double après insertion`);
      assert.deepEqual(await page.evaluate(() => window.__pb.selection()), [mine[0].id], `${t} : le nouvel élément n'est pas sélectionné`);
    }
    await settle();
    const saved = JSON.parse(row().draft || row().sections);
    assert.deepEqual(flat(saved).map((n) => n.type), flat(await doc()).map((n) => n.type), "le serveur a enregistré les mêmes éléments, dans le même ordre");
    assert.deepEqual(errors, []);
  });

  test("rechargement : tous les widgets reviennent à l'identique", { timeout: 120000 }, async () => {
    const before = await doc();
    await open();
    // le serveur complète chaque élément avec ses valeurs par défaut (ex. épaisseur d'un séparateur) : rien de ce qui était réglé ne doit disparaître ni changer
    const subset = (x, y, path) => {
      if (x && typeof x === "object") {
        assert.ok(y && typeof y === "object", `${path} : disparu au rechargement`);
        if (Array.isArray(x)) { assert.equal(y.length, x.length, `${path} : longueur`); x.forEach((v, i) => subset(v, y[i], `${path}[${i}]`)); } else for (const k of Object.keys(x)) subset(x[k], y[k], `${path}.${k}`);
      } else if (typeof x === "string" && /^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(x)) assert.equal(Date.parse(y), Date.parse(x), `${path} : date changée au rechargement`); // même instant, écriture normalisée
      else assert.equal(y, x, `${path} : valeur changée au rechargement`);
    };
    const after = await doc();
    subset(before, after, "page");
    assert.deepEqual(flat(after).map((n) => n.id), flat(before).map((n) => n.id), "mêmes éléments, même ordre");
    assert.deepEqual(after, JSON.parse(row().draft || row().sections), "l'éditeur affiche exactement le brouillon du serveur");
  });

  test("duplication, annulation, rétablissement et suppression de chaque widget : identifiants neufs, contenu identique, voisins intacts", { timeout: 1200000 }, async () => {
    await settle().catch(() => {});
    const draft = JSON.parse(row().draft || row().sections);
    const holder = flat(draft).find((n) => n.type === "container" && Array.isArray(n.children));
    asked.forEach((t, i) => { const b = nodes.PALETTE[t].blank(); holder.children.push({ id: `ask${String(i).padStart(9, "0")}`, type: t, props: { ...(b.props || {}), ...(OVER[t] || {}) }, ...(EXTRA[t] || {}) }); });
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: row().revision, content: draft }, headers: { Origin: srv.base } });
    assert.equal(r.status, 200, r.text.slice(0, 300));
    await open();
    const start = await doc();
    const total = flat(start).length;
    const targets = flat(start).filter((n) => (types.includes(n.type) || asked.includes(n.type)) && n.type !== "container");
    assert.ok(targets.length >= types.length + asked.length - 1, `${targets.length} éléments à éprouver`);
    assert.ok(asked.every((t) => targets.some((n) => n.type === t)), "les éléments à choix sont présents");
    for (const t of targets) {
      await pick(t.id);
      const base = await doc(); const baseIds = flat(base).map((n) => n.id);
      await page.keyboard.press("Control+d"); await wait(150);
      const dup = await doc(); const ids = flat(dup).map((n) => n.id);
      assert.equal(new Set(ids).size, ids.length, `${t.type} : identifiants en double après duplication`);
      const created = flat(dup).filter((n) => !baseIds.includes(n.id));
      assert.ok(created.length >= 1, `${t.type} : rien n'a été dupliqué`);
      const copy = created.find((n) => n.type === t.type);
      assert.ok(copy, `${t.type} : la copie n'est pas du même type`);
      assert.equal(strip(copy), strip(flat(base).find((n) => n.id === t.id)), `${t.type} : la copie diffère de l'original`);
      if (t.type === "menuanchor") { assert.ok(copy.anchor && copy.anchor !== t.anchor && /^[a-z][a-z0-9-]{0,39}$/.test(copy.anchor), `ancre de la copie invalide : ${copy.anchor}`); }
      await page.keyboard.press("Control+z"); await wait(150);
      assert.equal(flat(await doc()).length, total, `${t.type} : annuler ne retire pas la copie`);
      await page.keyboard.press("Control+Shift+z"); await wait(150);
      assert.equal(flat(await doc()).length, total + created.length, `${t.type} : rétablir ne remet pas la copie`);
      // suppression de la copie sélectionnée : l'original et les voisins restent
      await page.keyboard.press("Delete"); await wait(150);
      const gone = await doc();
      assert.deepEqual(flat(gone).map((n) => n.id), baseIds, `${t.type} : la suppression a touché autre chose que la copie`);
    }
    await settle();
    assert.deepEqual(flat(JSON.parse(row().draft || row().sections)).map((n) => n.id), flat(await doc()).map((n) => n.id));
    assert.deepEqual(errors, []);
  });
});
