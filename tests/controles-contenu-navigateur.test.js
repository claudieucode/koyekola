// Réglages de CONTENU des éléments (listes, cases, champs texte) dans un VRAI navigateur : chaque contrôle de l'inspecteur est actionné,
// puis le document enregistré est relu. Garanties vérifiées :
//   * un choix de liste / une case / une saisie modifie le document (ou est refusé par le serveur AVEC un message qui nomme le problème) ;
//   * rien d'autre que l'élément concerné ne change ;
//   * après rechargement de l'éditeur, le contrôle affiche la valeur choisie (persistance) ;
//   * aucune erreur de script.
// Jeu représentatif par défaut ; CONTENU_COMPLET=1 parcourt les 79 types instanciables (≈ 50 min sur une machine lente).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { editorSpec } = require("../src/marketing/pages/nodes");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Contenu de départ valide par type (les éléments à image, vidéo ou formation exigent une valeur de départ)
const OVER = { image: { src: "https://example.com/a.jpg", alt: "a" }, imagebox: { src: "https://example.com/a.jpg", title: "Titre" }, video: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Une vidéo" } };
const REPRESENTATIFS = ["heading", "text", "button", "link", "image", "alert", "accordion", "divider", "iconbox", "cta", "slides", "pricing", "countdown", "tabs", "badge", "progress"];
// Valeurs d'essai à ne pas inventer au hasard : certains champs n'acceptent qu'une forme précise (refus attendu AVEC message)
const isLinkLabel = (l) => /lien|adresse|url|href|source|image|vid|src|ancre|fichier/i.test(l);

describe("réglages de contenu des éléments (inspecteur réel, Chrome)", { skip: SKIP }, () => {
  let srv, boss, browser, page, errors, id, lastPut = null;
  const row = () => srv.db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const find = (nodes, nid) => { for (const n of nodes || []) { if (n.id === nid) return n; const f = find(n.children, nid); if (f) return f; } return null; };
  const doc = () => JSON.parse(row().draft || row().sections).sections;
  const snap = (nid) => JSON.stringify(find(doc(), nid));
  const others = (nid) => JSON.stringify(doc().map((s) => ({ ...s, children: (s.children || []).filter((c) => c.id !== nid) })));
  const types = editorSpec().types.filter((t) => process.env.CONTENU_COMPLET ? true : REPRESENTATIFS.includes(t.type));

  const open = async () => {
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 30000 });
    await wait(700);
  };
  const choose = async (nid) => {
    await page.locator(`[data-pb-layers] .pb-node[data-id="${nid}"] > .pb-row-item`).first().click({ timeout: 8000 }); await wait(250);
    const tabs = await page.$$eval("[data-pb-inspector] [role=tab]", (e) => e.map((x) => x.textContent));
    const first = tabs.find((x) => !/^(Style|Avancé|Interactions)$/.test(x)) || tabs[0];
    await page.locator("[data-pb-inspector] [role=tab]", { hasText: new RegExp(`^${first}$`) }).click(); await wait(150);
    for (let i = 0; i < 2; i++) { await page.$$eval("[data-pb-inspector] details", (ds) => ds.forEach((d) => { d.open = true; })); await wait(150); }
  };
  // Message visible pour l'utilisateur : refus du serveur (422) ou message de l'éditeur (bandeau d'erreur)
  const said = async () => lastPut || (await page.evaluate(() => { const t = document.querySelector("[data-pb-toast]"); return t && !t.hidden ? t.textContent.trim() : ""; }));
  const changed = async (nid, before, ms = 2800) => { const end = Date.now() + ms; while (Date.now() < end) { await wait(120); if (snap(nid) !== before) return true; } return false; };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    id = Number((await boss.post("/marketing/pages", { name: "Contenu", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const kids = types.map((t, i) => ({ id: `wid${String(i).padStart(9, "0")}`, type: t.type, props: { ...(t.blank.props || {}), ...(OVER[t.type] || {}) }, ...(t.container ? { children: [] } : {}) }));
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: row().revision, content: { title: "Contenu", sections: [{ id: "sect00000001", type: "layout", children: kids }] } } });
    assert.equal(r.status, 200, r.text);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("response", async (r) => { if (/\/brouillon$/.test(r.url()) && r.request().method() === "PUT") lastPut = r.status() === 200 ? null : `${r.status()} ${(await r.text().catch(() => "")).slice(0, 200)}`; });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  const SEL = "[data-pb-inspector] select:not(.pb-len-unit):not(.pb-prop-select)";
  const CHK = "[data-pb-inspector] input[type=checkbox]";
  const TXT = "[data-pb-inspector] .pb-field input[type=text]:not(.pb-len-num):not(.pb-prop-text):not(.pb-cpop-hex), [data-pb-inspector] .pb-field textarea";

  for (const [i, t] of types.entries()) {
    test(`${t.label} (${t.type}) : chaque liste, case et champ modifie le document, sans toucher au reste, et la valeur survit au rechargement`, { timeout: 300000 }, async () => {
      const nid = `wid${String(i).padStart(9, "0")}`;
      const problems = [];
      await open(); await choose(nid);
      const outside = others(nid);
      let persisted = null; // un réglage modifié, relu après rechargement : { kind, index, value }

      // --- listes : chaque option doit modifier le document, ou être refusée AVEC un message du serveur
      const nSel = await page.locator(SEL).count();
      for (let k = 0; k < nSel; k++) {
        const info = await page.locator(SEL).nth(k).evaluate((e) => ({ opts: [...e.options].map((o) => o.value), label: ((e.labels && e.labels[0] && e.labels[0].textContent) || e.getAttribute("aria-label") || "").trim(), cur: e.value, dis: e.disabled }));
        if (info.dis) continue;
        for (const v of info.opts.slice(0, 7)) {
          if (v === info.cur) continue;
          const b = snap(nid); lastPut = null;
          await page.locator(SEL).nth(k).selectOption(v);
          if (!(await changed(nid, b))) {
            if (!(await said())) problems.push(`liste « ${info.label} » : option « ${v} » sans effet ET sans aucun message`);
            await open(); await choose(nid); break;
          }
          assert.equal(others(nid), outside, `liste « ${info.label} » : un autre élément a changé`);
          if (!persisted) persisted = { kind: "select", index: k, value: v, label: info.label };
          await wait(200);
          if ((await page.locator(SEL).count()) > k) { await page.locator(SEL).nth(k).selectOption(info.cur); await wait(350); }
        }
      }
      // --- cases
      const nChk = await page.locator(CHK).count();
      for (let k = 0; k < nChk; k++) {
        const c = page.locator(CHK).nth(k);
        if (await c.isDisabled() || !(await c.isVisible())) continue;
        const label = (await c.evaluate((e) => (e.closest("label") || {}).textContent || e.getAttribute("aria-label") || "")).trim();
        const b = snap(nid); lastPut = null;
        await c.click({ force: true });
        if (!(await changed(nid, b))) {
          // Les cases « https:// seulement » n'ont d'effet que pour une adresse sécurisée : refus documenté, vérifié par controles-coherence
          if (!(await said()) && !/https:\/\//.test(label)) problems.push(`case « ${label} » sans effet ET sans aucun message`);
          await open(); await choose(nid); continue;
        }
        assert.equal(others(nid), outside, `case « ${label} » : un autre élément a changé`);
        if (!persisted) persisted = { kind: "check", index: k, value: await page.locator(CHK).nth(k).isChecked(), label };
        await wait(200);
        if ((await page.locator(CHK).count()) > k) { await page.locator(CHK).nth(k).click({ force: true }).catch(() => {}); await wait(350); }
      }
      // --- persistance : rechargement de l'éditeur, le contrôle montre la valeur choisie (avant les champs texte : une adresse saisie retire légitimement la case « agrandir au clic »)
      if (persisted && !lastPut) {
        await open(); await choose(nid);
        if (persisted.kind === "select") {
          const now = await page.locator(SEL).nth(persisted.index).inputValue();
          // la liste a été remise à sa valeur d'origine à la fin du parcours : on la re-choisit puis on recharge
          await page.locator(SEL).nth(persisted.index).selectOption(persisted.value);
          const b = snap(nid); await changed(nid, b, 2500); await wait(900);
          await open(); await choose(nid);
          assert.equal(await page.locator(SEL).nth(persisted.index).inputValue(), persisted.value, `liste « ${persisted.label} » : valeur choisie perdue au rechargement (affiche « ${now} » avant)`);
        } else {
          const c = page.locator(CHK).nth(persisted.index);
          const target = persisted.value;
          if ((await c.isChecked()) !== target) { const b = snap(nid); await c.click({ force: true }); await changed(nid, b, 2500); await wait(900); }
          await open(); await choose(nid);
          assert.equal(await page.locator(CHK).nth(persisted.index).isChecked(), target, `case « ${persisted.label} » : état perdu au rechargement`);
        }
      }
      // --- champs texte
      const nTx = await page.locator(TXT).count();
      for (let k = 0; k < nTx; k++) {
        const e = page.locator(TXT).nth(k);
        if (await e.isDisabled() || !(await e.isVisible()) || !(await e.isEditable())) continue;
        const info = await e.evaluate((x) => ({ label: ((x.labels && x.labels[0] && x.labels[0].textContent) || x.getAttribute("aria-label") || x.placeholder || "").trim(), area: x.tagName === "TEXTAREA" }));
        const link = isLinkLabel(info.label);
        const val = link ? "/essai-zq" : info.area ? "Essai zq\nAutre zq" : "Essai zq";
        const b = snap(nid); lastPut = null;
        try { await e.fill(val, { timeout: 4000 }); } catch { problems.push(`champ « ${info.label} » : non saisissable`); continue; }
        await e.press("Tab").catch(() => {});
        if (!(await changed(nid, b))) {
          if (!(await said())) problems.push(`champ « ${info.label} » : saisie « ${val.replace(/\n/g, " / ")} » sans effet ET sans aucun message`);
          await open(); await choose(nid); continue;
        }
        assert.equal(others(nid), outside, `champ « ${info.label} » : un autre élément a changé`);
      }
      assert.deepEqual(problems, [], `${t.type} : contrôles sans effet silencieux`);
      assert.deepEqual(errors, [], "erreurs de script");

    });
  }
});
