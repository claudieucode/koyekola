// Coût réel de l'édition des widgets dans l'éditeur (Chrome) selon la taille de la page : durée d'insertion, de sélection, de mise à jour d'un réglage,
// d'enregistrement, nombre de requêtes réseau pendant une série de modifications, mémoire après de nombreux ajouts/suppressions.
// Les mesures sont imprimées (lignes « MESURE ») ; les seuils sont volontairement larges (machine lente, charge variable) : ils détectent une dérive
// grossière, pas une régression fine. Les durées dépendent de la charge de la machine au moment du test.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const nodes = require("../src/marketing/pages/nodes");
const { startServer, loginInstructor } = require("./helpers");
const { creatable, OVER, EXTRA } = require("./widgets-helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Pages de tailles différentes, faites de vrais widgets du catalogue (rotation sur tous les types créables)
const mixed = (n) => Array.from({ length: n }, (_, i) => {
  const t = creatable.filter((x) => x !== "container" && !nodes.NODE_TYPES[x].container)[i % 70] || "heading";
  const b = nodes.PALETTE[t].blank();
  return { id: `pf${String(i).padStart(10, "0")}`, type: t, props: { ...(b.props || {}), ...(OVER[t] || {}) }, ...(t === "menuanchor" ? { anchor: `ancre-${i}` } : EXTRA[t] || {}) };
});
const SIZES = [["petite (10 widgets)", 10], ["moyenne (60 widgets)", 60], ["grande (200 widgets)", 200], ["très grande (380 widgets)", 380]];
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

describe("coût de l'édition des widgets selon la taille de la page (Chrome réel)", { skip: SKIP }, () => {
  let srv, boss, browser, context;
  const results = {};
  // Le canevas remplace son cadre à chaque rendu (double tampon) : pendant l'échange l'élément peut manquer un instant ; on relit donc à chaque fois.
  const FRAME = `(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body ? f.contentDocument : null; })()`;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  });
  after(async () => {
    if (browser) await browser.close(); if (srv) await srv.stop();
    if (process.env.MESURES_SORTIE) fs.writeFileSync(process.env.MESURES_SORTIE, JSON.stringify(results, null, 2));
  });

  for (const [label, count] of SIZES) {
    test(`page ${label} : insertion, sélection, réglage, enregistrement, requêtes`, { timeout: 300000 }, async () => {
      const db = srv.db();
      const id = Number((await boss.post("/marketing/pages", { name: "Perf " + count, template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
      const kids = mixed(count - 1).concat([{ id: "target0000001", type: "heading", props: { text: "Titre cible", level: 2 } }]);
      const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision, content: { title: "Perf", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: kids }] }] } }, headers: { Origin: srv.base } });
      assert.equal(put.status, 200, put.text.slice(0, 200));
      const page = await context.newPage();
      const errors = [], requests = [], rendu = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("response", (r) => { if (/\/rendu$/.test(r.url())) rendu.push(`${Date.now() - t0}:${r.status()}`); });
      page.on("request", (r) => { if (/\/marketing\/pages\/\d+\//.test(r.url()) && r.method() !== "GET") requests.push(`${r.method()} ${r.url().replace(/.*\/pages\/\d+/, "")}`); });
      const t0 = Date.now();
      await page.addInitScript(() => { window.__removed = []; const orig = Element.prototype.remove; Element.prototype.remove = function () { if (this.tagName === 'IFRAME') window.__removed.push({ t: Math.round(performance.now()), attr: this.hasAttribute('data-pb-frame'), vis: this.style.visibility, stack: String(new Error().stack).split('\n').slice(2, 5).map((x) => x.trim().replace(/.*\//, '')).join(' < ') }); return orig.call(this); }; });
      await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
      await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && window.__pb; }, null, { timeout: 60000 });
      const open = Date.now() - t0; await wait(800);
      const m = { ouverture: open };

      // sélection : clic sur la ligne de la structure → sélection mise à jour
      const sel = [];
      for (let i = 0; i < 5; i++) {
        const nid = i % 2 ? "target0000001" : kids[Math.min(i, kids.length - 1)].id;
        const row = page.locator(`[data-pb-layers] .pb-node[data-id="${nid}"] > .pb-row-item`).first();
        await row.scrollIntoViewIfNeeded().catch(() => {});
        const t = await page.evaluate(async (nid) => { const el = document.querySelector(`[data-pb-layers] .pb-node[data-id="${nid}"] > .pb-row-item`); const s = performance.now(); el.click(); while (!window.__pb.selection().includes(nid)) await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r)); return performance.now() - s; }, nid);
        sel.push(t);
      }
      m.selection_ms = Math.round(median(sel));

      // insertion : clic dans la bibliothèque → nouvel élément dans le document
      const ins = [];
      await page.evaluate(() => { const b = document.querySelector("#pb-tab-elements"); if (b) b.click(); });
      await page.locator("[data-pb-el-search]").fill("Texte"); await wait(200);
      for (let i = 0; i < 5; i++) {
        const t = await page.evaluate(async () => { const n = JSON.stringify(window.__pb.content()).length; const b = document.querySelector('.pb-pal-item[data-widget="text"]'); const s = performance.now(); b.click(); while (JSON.stringify(window.__pb.content()).length === n) await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r)); return performance.now() - s; });
        ins.push(t); await wait(150);
      }
      m.insertion_ms = Math.round(median(ins));

      // réglage : saisie dans le champ « texte » du titre → texte visible dans le canevas
      await page.locator(`[data-pb-layers] .pb-node[data-id="target0000001"] > .pb-row-item`).first().click(); await wait(300);
      const upd = [];
      for (let i = 0; i < 6; i++) {
        const txt = `Valeur ${i} ${Date.now() % 1000}`;
        const t = await page.evaluate(async (txt) => {
          const f = [...document.querySelectorAll("[data-pb-inspector] textarea, [data-pb-inspector] input[type=text]")].find((e) => /Titre cible|Valeur/.test(e.value));
          if (!f) return -1;
          const s = performance.now(); f.value = txt; f.dispatchEvent(new Event("input", { bubbles: true }));
          // le canevas peut remplacer son document (double tampon) : on le relit à chaque image
          const seen = () => { const f = document.querySelector("[data-pb-frame]"), d = f && f.contentDocument; return !!(d && d.body && (d.body.textContent || "").includes(txt)); };
          while (!seen()) { if (performance.now() - s > 5000) return -2; await new Promise((r) => requestAnimationFrame(r)); }
          return performance.now() - s;
        }, txt);
        assert.ok(t >= 0, `réglage ${i} : champ ou rendu introuvable (${t}) ; sélection : ${await page.evaluate(() => JSON.stringify(window.__pb.selection()))} ; texte du titre dans le canevas : ${await page.evaluate(() => { const f = document.querySelector('[data-pb-frame]'), d = f && f.contentDocument, e = d && d.querySelector('.kw-n-target0000001'); return e ? e.textContent : 'élément absent'; })} ; état du canevas : ${await page.evaluate(() => JSON.stringify([...document.querySelectorAll('[data-pb-frame]')].map((f) => ({ prêt: f.contentDocument && f.contentDocument.readyState, élémentsDuCanevas: f.contentDocument ? f.contentDocument.querySelectorAll('[class*=kw-n-]').length : -1, cible: !!(f.contentDocument && f.contentDocument.querySelector('.kw-n-target0000001')) }))))} ; cadres : ${await page.evaluate(() => JSON.stringify([...document.querySelectorAll('iframe')].map((f) => f.outerHTML.slice(0, 160).replace(/srcdoc="[^"]*"/, 'srcdoc=…') + ' | visibilité=' + f.style.visibility + ' | parent=' + (f.parentElement && f.parentElement.className))))} ; page rechargée ? ${await page.evaluate(() => JSON.stringify({ perf: performance.getEntriesByType('navigation').length, url: location.href.slice(-30), titre: document.title.slice(0, 40) }))} ; iframes retirés : ${await page.evaluate(() => JSON.stringify(window.__removed))} ; requêtes d'aperçu : ${JSON.stringify(rendu)} ; éléments dans la page : ${await page.evaluate(() => { let n = 0; const w = (l) => (l || []).forEach((x) => { n++; w(x.children); }); w(window.__pb.content().sections); return n; })} ; message de l'éditeur : « ${await page.evaluate(() => { const t = document.querySelector('[data-pb-toast]'); return t ? t.textContent.trim() : ''; })} » ; modèle : ${await page.evaluate(() => { const f = (l) => { for (const n of l || []) { if (n.id === 'target0000001') return n; const r = f(n.children); if (r) return r; } return null; }; const n = f(window.__pb.content().sections); return n && n.props.text; })}`);
        upd.push(t); await wait(100);
      }
      m.reglage_ms = Math.round(median(upd));

      // requêtes pendant la série de réglages ci-dessus (rafale de 6 modifications en ~1 s) : doit rester bas grâce à l'attente avant enregistrement
      await page.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 20000 });
      m.requetes_serie = requests.length; m.requetes_rendu = requests.filter((r) => /rendu/.test(r)).length; m.requetes_enregistrement = requests.filter((r) => /brouillon/.test(r)).length;

      // enregistrement : durée d'une requête d'enregistrement du brouillon complet
      const save = await page.evaluate(async () => { const s = performance.now(); const b = document.querySelector("[data-pb-save], [data-pb-save-now]"); return { found: !!b, t: performance.now() - s }; });
      const timings = [];
      for (let i = 0; i < 3; i++) {
        const rp = page.waitForResponse((r) => /\/brouillon$/.test(r.url()) && r.request().method() === "PUT", { timeout: 20000 });
        const s = Date.now();
        await page.evaluate(() => { const f = [...document.querySelectorAll("[data-pb-inspector] textarea, [data-pb-inspector] input[type=text]")][0]; f.value = f.value + "."; f.dispatchEvent(new Event("input", { bubbles: true })); });
        await rp; timings.push(Date.now() - s);
      }
      m.enregistrement_ms = Math.round(median(timings)); m.enregistrement_note = "inclut l'attente d'inactivité avant l'envoi";
      m.noeuds_dom_canevas = await page.waitForFunction(`(() => { const d = ${FRAME}; return d ? d.querySelectorAll("*").length : 0; })()`, null, { timeout: 10000 }).then((h) => h.jsonValue());
      m.erreurs = errors.length;
      results[label] = m;
      console.log("MESURE", label, JSON.stringify(m));
      assert.deepEqual(errors, []);
      assert.ok(m.selection_ms < 2500 && m.insertion_ms < 4000 && m.reglage_ms < 3000, `dérive grossière : ${JSON.stringify(m)}`);
      assert.ok(m.requetes_enregistrement <= 3, `trop d'enregistrements pour une rafale de 6 réglages : ${m.requetes_enregistrement}`);
      await page.close();
    });
  }

  test("mémoire : 150 ajouts / suppressions de widgets ne font pas grossir durablement la mémoire de l'éditeur", { timeout: 600000 }, async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Mémoire", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => window.__pb && (() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); })(), null, { timeout: 60000 });
    await wait(800);
    await page.evaluate(() => { const b = document.querySelector("#pb-tab-elements"); if (b) b.click(); });
    await page.locator("[data-pb-el-search]").fill("Texte"); await wait(200);
    const heap = async () => { await cdp.send("HeapProfiler.collectGarbage"); await cdp.send("HeapProfiler.collectGarbage"); return (await page.evaluate(() => performance.memory.usedJSHeapSize)) / 1048576; };
    const cycle = async (n) => { for (let i = 0; i < n; i++) { await page.evaluate(() => document.querySelector('.pb-pal-item[data-widget="text"]').click()); await wait(40); await page.keyboard.press("Delete"); await wait(40); } };
    await cycle(20); const a = await heap();
    await cycle(150); const b = await heap();
    results.memoire = { apres_20_cycles_Mo: Math.round(a * 10) / 10, apres_170_cycles_Mo: Math.round(b * 10) / 10 };
    console.log("MESURE mémoire", JSON.stringify(results.memoire));
    assert.ok(b - a < 25, `la mémoire grossit de ${(b - a).toFixed(1)} Mo en 150 cycles`);
    await page.close();
  });
});
