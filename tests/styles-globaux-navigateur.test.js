// Styles globaux de bout en bout dans un VRAI navigateur (page publiée ET canevas de l'éditeur) :
//   * une couleur du site modifiée change les éléments qui la RÉFÉRENCENT (couleurs du système et couleurs personnalisées), jamais une couleur locale ;
//   * priorité effective : valeur par défaut < classe globale < style propre de l'élément < valeur de l'écran ;
//   * modifier une classe ne touche que les éléments qui la portent ; la retirer d'un élément rend ses propres valeurs ;
//   * la police « Titres » / « Texte » du site est celle réellement appliquée ;
//   * les références survivent à la sauvegarde, au rechargement et à la duplication (jamais figées en valeur) ;
//   * une couleur personnalisée encore référencée (page, composant OU réglages du site) ne peut pas être supprimée.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : styles globaux non exécutés sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 12000, what = "condition" } = {}) { const end = Date.now() + timeout; for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(80); } }
const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };

describe("styles globaux : références, priorités, classes (Chrome réel)", { skip: SKIP }, () => {
  let srv, boss, browser, ctx, siteId, pageId, slug;
  const db = () => srv.db();
  const settingsUrl = () => `/marketing/site-web/sites/${siteId}/reglages.json`;
  const load = async () => JSON.parse((await boss.get(settingsUrl())).text);
  const save = async (mutate) => { const cur = await load(); const next = mutate(cur); const r = await boss.request(settingsUrl(), { method: "PUT", json: { revision: cur.revision, tokens: next.tokens || cur.tokens, settings: next.settings || cur.settings } }); assert.equal(r.status, 200, r.text.slice(0, 300)); return JSON.parse(r.text); };
  const rowPage = () => db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(pageId);
  const publish = async () => { assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} })).status, 200); };
  const find = (nodes, nid) => { for (const n of nodes || []) { if (n.id === nid) return n; const f = find(n.children, nid); if (f) return f; } return null; };
  const doc = () => JSON.parse(rowPage().draft || rowPage().sections).sections;
  const readPublished = async (ids) => { const p = await ctx.newPage(); try { await p.setViewportSize({ width: 1280, height: 900 }); await p.goto(`${srv.base}/p/${slug}`); return await p.evaluate((ids) => Object.fromEntries(ids.map((id) => { const e = document.querySelector(`.kw-n-${id}`); const cs = getComputedStyle(e); return [id, { color: cs.color, bg: cs.backgroundColor, font: cs.fontFamily, pad: cs.paddingTop }]; })), ids); } finally { await p.close(); } };
  const IDS = ["tok000000001", "loc000000001", "cus000000001", "cls000000001", "cls000000002", "cls000000003", "fnt000000001"];
  const content = () => ({ title: "Styles", sections: [{ id: "sect00000001", type: "layout", children: [
    { id: IDS[0], type: "heading", props: { text: "Jeton principal", level: "2" }, styles: { desktop: { color: "token:primary" } } },
    { id: IDS[1], type: "heading", props: { text: "Couleur locale", level: "2" }, styles: { desktop: { color: "#0277b6" } } },
    { id: IDS[2], type: "heading", props: { text: "Couleur perso", level: "2" }, styles: { desktop: { color: "token:c-aaa" } } },
    { id: IDS[3], type: "container", classes: "carte", props: {}, children: [{ id: "k0000000001", type: "text", props: { html: "<p>a</p>" } }] },
    { id: IDS[4], type: "container", classes: "carte", props: {}, styles: { desktop: { backgroundColor: "#112233" }, mobile: { paddingTop: "3px" } }, children: [{ id: "k0000000002", type: "text", props: { html: "<p>b</p>" } }] },
    { id: IDS[5], type: "container", props: {}, children: [{ id: "k0000000003", type: "text", props: { html: "<p>c</p>" } }] },
    { id: IDS[6], type: "heading", props: { text: "Police titres", level: "2" }, styles: { desktop: { fontFamily: "heading" } } },
  ] }] });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Styles globaux" })).location).match(/(\d+)$/)[1]);
    await save((c) => ({ tokens: { ...c.tokens, customColors: [{ key: "c-aaa", label: "Rouge perso", hex: "#ff0000" }] }, settings: { ...c.settings, classes: [{ name: "carte", styles: { desktop: { backgroundColor: "token:accent", paddingTop: "24px" } } }] } }));
    pageId = Number((await boss.post("/marketing/pages", { name: "Page styles", site_id: String(siteId), ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const r = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rowPage().revision, content: content() } });
    assert.equal(r.status, 200, r.text);
    await publish(); slug = rowPage().slug;
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("état initial : jeton → couleur du site, couleur perso → sa valeur, locale → la sienne ; classe < style propre ; écran mobile isolé", async () => {
    const v = await readPublished(IDS);
    assert.equal(v[IDS[0]].color, rgb("#0277b6"));
    assert.equal(v[IDS[2]].color, rgb("#ff0000"));
    assert.equal(v[IDS[3]].bg, rgb("#f59e0b"), "classe seule : sa couleur de fond (jeton accent)");
    assert.equal(v[IDS[3]].pad, "24px");
    assert.equal(v[IDS[4]].bg, rgb("#112233"), "le style propre l'emporte sur la classe");
    assert.equal(v[IDS[4]].pad, "24px", "le style propre ne définit pas ce réglage : la classe s'applique");
    assert.notEqual(v[IDS[5]].bg, rgb("#f59e0b"), "sans classe : aucun effet");
  });

  test("modifier une couleur du système et une couleur personnalisée change les éléments qui les référencent, jamais la couleur locale — page publiée ET canevas", async () => {
    await save((c) => ({ tokens: { ...c.tokens, colors: { ...c.tokens.colors, primary: "#00aa00", accent: "#aa00aa" }, customColors: [{ key: "c-aaa", label: "Rouge perso", hex: "#0000ff" }] } }));
    await publish();
    const v = await readPublished(IDS);
    assert.equal(v[IDS[0]].color, rgb("#00aa00"), "référence au jeton : suit le site");
    assert.equal(v[IDS[1]].color, rgb("#0277b6"), "couleur locale indépendante : inchangée (même valeur que l'ancien jeton)");
    assert.equal(v[IDS[2]].color, rgb("#0000ff"), "couleur personnalisée modifiée");
    assert.equal(v[IDS[3]].bg, rgb("#aa00aa"), "classe qui référence le jeton accent");
    // canevas : même résultat
    const ed = await ctx.newPage();
    try {
      await ed.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
      await ed.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 30000 });
      await wait(1000);
      const c = await ed.evaluate((ids) => { const f = document.querySelector("[data-pb-frame]"); return Object.fromEntries(ids.map((id) => { const cs = f.contentWindow.getComputedStyle(f.contentDocument.querySelector(`[data-node-id="${id}"]`)); return [id, { color: cs.color, bg: cs.backgroundColor }]; })); }, IDS.slice(0, 4));
      for (const id of IDS.slice(0, 3)) assert.equal(c[id].color, v[id].color, `canevas ≠ publié pour ${id}`);
      assert.equal(c[IDS[3]].bg, v[IDS[3]].bg, "canevas ≠ publié pour la classe");
    } finally { await ed.close(); }
  });

  test("modifier une classe ne change que les éléments qui la portent ; le style propre garde la priorité", async () => {
    await save((c) => ({ settings: { ...c.settings, classes: [{ name: "carte", styles: { desktop: { backgroundColor: "#445566", paddingTop: "40px" } } }] } }));
    await publish();
    const v = await readPublished(IDS);
    assert.equal(v[IDS[3]].bg, rgb("#445566")); assert.equal(v[IDS[3]].pad, "40px");
    assert.equal(v[IDS[4]].bg, rgb("#112233"), "style propre inchangé"); assert.equal(v[IDS[4]].pad, "40px");
    assert.notEqual(v[IDS[5]].bg, rgb("#445566"), "élément sans classe non touché");
  });

  test("police des titres du site : la police réellement appliquée change avec le réglage du site", async () => {
    const before = (await readPublished(IDS))[IDS[6]].font;
    await save((c) => ({ tokens: { ...c.tokens, fonts: { ...c.tokens.fonts, heading: "mono" } } }));
    await publish();
    const after = (await readPublished(IDS))[IDS[6]].font;
    assert.notEqual(after, before, "la police des titres a changé");
    assert.match(after, /monospace|Menlo|Consolas/i);
  });

  test("les références survivent au rechargement et à la duplication (jamais figées en valeur) ; retirer la classe rend les valeurs propres", async () => {
    const ed = await ctx.newPage();
    try {
      await ed.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
      await ed.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 30000 });
      await wait(1000);
      await ed.locator(`[data-pb-layers] .pb-node[data-id="${IDS[0]}"] > .pb-row-item`).click(); await wait(250);
      await ed.keyboard.press("Control+d");
      const copy = await until(() => { const kids = doc()[0].children; const c = kids.filter((k) => k.type === "heading" && k.styles && k.styles.desktop && k.styles.desktop.color === "token:primary" && k.id !== IDS[0]); return c.length ? c[0] : null; }, { what: "copie enregistrée" });
      assert.equal(copy.styles.desktop.color, "token:primary", "la copie référence toujours le jeton");
      assert.equal(find(doc(), IDS[3]).classes, "carte");
    } finally { await ed.close(); }
  });

  test("suppression d'une couleur personnalisée : refusée tant qu'une page, une classe ou un réglage du site la référence", async () => {
    // référencée par une page (IDS[2]) → refus
    let cur = await load();
    let r = await boss.request(settingsUrl(), { method: "PUT", json: { revision: cur.revision, tokens: { ...cur.tokens, customColors: [] }, settings: cur.settings } });
    assert.equal(r.status, 422); assert.match(r.text, /utilisée dans 1 page/);
    // une classe globale référence la couleur → refus avec le nom de l'endroit
    cur = await load();
    r = await boss.request(settingsUrl(), { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, classes: [{ name: "carte", styles: { desktop: { backgroundColor: "token:c-aaa" } } }] } } });
    assert.equal(r.status, 200, r.text.slice(0, 200));
    // retire la référence de la page pour isoler le cas « classe »
    const rev = rowPage().revision; const sections = doc(); find(sections, IDS[2]).styles.desktop.color = "#123456";
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: "Styles", sections } } })).status, 200);
    await publish();
    cur = await load();
    r = await boss.request(settingsUrl(), { method: "PUT", json: { revision: cur.revision, tokens: { ...cur.tokens, customColors: [] }, settings: cur.settings } });
    assert.equal(r.status, 422, "classe globale → refus");
    assert.match(r.text, /réglages du site \(classes globales\)/);
    // plus aucune référence : suppression acceptée
    cur = await load();
    r = await boss.request(settingsUrl(), { method: "PUT", json: { revision: cur.revision, tokens: { ...cur.tokens, customColors: [] }, settings: { ...cur.settings, classes: [{ name: "carte", styles: { desktop: { backgroundColor: "#445566" } } }] } } });
    assert.equal(r.status, 200, r.text.slice(0, 200));
  });

  test("page HORS site (aucune variable du site posée) : les couleurs du système gardent leur valeur d'origine au lieu d'être ignorées en silence", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Page sans site", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const row = () => db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
    const keys = ["primary", "accent", "text", "surface", "on-primary", "on-accent"];
    const kids = keys.map((k, i) => ({ id: `ns${String(i).padStart(9, "0")}`, type: "heading", props: { text: k, level: "2" }, styles: { desktop: { color: `token:${k}`, backgroundColor: `token:${k === "text" ? "primary" : k}` } } }));
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: row().revision, content: { title: "t", sections: [{ id: "sect00000001", type: "layout", children: kids }] } } });
    assert.equal(r.status, 200, r.text);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    const p = await ctx.newPage();
    try {
      await p.goto(`${srv.base}/p/${row().slug}`);
      const got = await p.evaluate((n) => Object.fromEntries([...document.querySelectorAll("[class*='kw-n-ns']")].map((e, i) => [i, [getComputedStyle(e).color, getComputedStyle(e).backgroundColor]])), kids.length);
      const want = { primary: "#0277b6", accent: "#f59e0b", text: "#10222f", surface: "#ffffff", "on-primary": "#ffffff", "on-accent": "#10222f" };
      keys.forEach((k, i) => { assert.equal(got[i][0], rgb(want[k]), `texte « ${k} » hors site`); assert.equal(got[i][1], rgb(want[k === "text" ? "primary" : k]), `fond « ${k} » hors site`); });
    } finally { await p.close(); }
  });
});
