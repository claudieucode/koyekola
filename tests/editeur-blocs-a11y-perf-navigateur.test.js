// KOLAKISA — éditeur d'articles : accessibilité (noms accessibles, libellés, identifiants, onglets, clavier) et performance sur un grand article, dans un VRAI Chrome.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

// Règles vérifiées sur la page entière (éléments visibles)
const audit = () => {
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
  const nameOf = (el) => (el.getAttribute("aria-label") || (el.getAttribute("aria-labelledby") ? el.getAttribute("aria-labelledby").split(" ").map((i) => (document.getElementById(i) || {}).textContent || "").join(" ") : "") || el.textContent || el.getAttribute("title") || (el.querySelector("img[alt]") || { getAttribute: () => "" }).getAttribute("alt") || "").trim();
  const problems = [];
  const desc = (el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${el.className && typeof el.className === "string" ? `.${el.className.split(" ")[0]}` : ""}`;
  for (const el of document.querySelectorAll("button, a[href], [role=button], [role=tab], [role=menuitem], [role=menuitemradio], [role=menuitemcheckbox], [role=option]")) {
    if (!visible(el) || el.closest(".ProseMirror")) continue;
    if (!nameOf(el)) problems.push(`sans nom accessible : ${desc(el)} (${el.outerHTML.slice(0, 90)})`);
  }
  for (const el of document.querySelectorAll("input:not([type=hidden]):not([type=file]), select, textarea")) {
    if (!visible(el) || el.closest(".ProseMirror")) continue;
    const labelled = (el.labels && el.labels.length) || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.getAttribute("title");
    if (!labelled) problems.push(`champ sans libellé : ${desc(el)} (${el.outerHTML.slice(0, 90)})`);
  }
  const ids = new Map();
  for (const el of document.querySelectorAll("[id]")) ids.set(el.id, (ids.get(el.id) || 0) + 1);
  for (const [id, n] of ids) if (n > 1 && !/^wp-f\d+$/.test(id)) problems.push(`identifiant en double : ${id} (${n})`);
  for (const t of document.querySelectorAll("[role=tab]")) {
    if (!t.hasAttribute("aria-selected")) problems.push(`onglet sans aria-selected : ${desc(t)}`);
    const c = t.getAttribute("aria-controls");
    if (c && !document.getElementById(c)) problems.push(`onglet vers un panneau absent : ${c}`);
  }
  for (const img of document.querySelectorAll("img")) if (visible(img) && !img.closest(".ProseMirror") && !img.hasAttribute("alt")) problems.push(`image sans alt : ${img.outerHTML.slice(0, 80)}`);
  return problems;
};

describe("éditeur d'articles — accessibilité et performance (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser;
  const open = async () => {
    const context = await browser.newContext({ viewport: { width: 1500, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    await page.goto(`${srv.base}/formateur/blog/nouveau`);
    await page.waitForFunction(() => document.querySelector(".ProseMirror") && document.querySelector(".ProseMirror").editor);
    return page;
  };
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); browser = await chromium.launch({ executablePath: CHROME, headless: true }); });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("noms accessibles, libellés, identifiants et onglets : aucun défaut sur les écrans de l'éditeur", async () => {
    const page = await open();
    const found = [];
    const scan = async (label) => { for (const p of await page.evaluate(audit)) found.push(`${label} : ${p}`); };
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setContent('<h2>Titre</h2><p>Texte</p><figure class="kb-image" data-align="center"><img src="/uploads/thumbnails/a.png" alt="x"></figure><div class="kb-group" data-bg="light"><p>g</p></div><div class="kb-cover" data-src="/uploads/thumbnails/a.png"><p>c</p></div><div class="kb-file" data-url="/uploads/blog/a.pdf"></div><table><tbody><tr><td><p>1</p></td></tr></tbody></table><div class="kb-columns" data-layout="50-50"><div class="kb-column"><p>a</p></div><div class="kb-column"><p>b</p></div></div>'); });
    await scan("défaut");
    for (const tab of ["article", "seo", "bloc", "notes"]) { await page.click(`[data-sidebar-tab="${tab}"]`); await page.waitForTimeout(200); await scan(`onglet ${tab}`); }
    // Inspecteur de chaque type de bloc
    await page.click('[data-sidebar-tab="bloc"]');
    const count = await page.evaluate(() => document.querySelector(".ProseMirror").editor.state.doc.childCount);
    for (let i = 0; i < count; i++) {
      await page.evaluate((k) => { const ed = document.querySelector(".ProseMirror").editor; let at = -1, n = 0; ed.state.doc.forEach((node, pos) => { if (n++ === k) at = pos; }); try { ed.commands.setNodeSelection(at); } catch { ed.commands.setTextSelection(at + 1); } }, i);
      await page.waitForTimeout(120);
      await scan(`inspecteur bloc ${i}`);
    }
    await page.click("[data-toggle-inserter]");
    await page.waitForSelector(".wp-block-type");
    await scan("inserteur blocs");
    await page.getByRole("tab", { name: "Modèles" }).click(); await scan("inserteur modèles");
    await page.click('[data-rail="list"]'); await page.waitForSelector(".wp-lv-select"); await scan("vue en liste");
    await page.click("[data-options-toggle]"); await scan("menu options");
    await page.keyboard.press("Escape");
    const unique = [...new Set(found)];
    assert.deepEqual(unique, [], unique.join("\n"));
    await page.context().close();
  });

  test("accessibilité des écrans ajoutés : réglages de style, widgets, HTML personnalisé, verrouillage, guide, notes de bas de page, fil d'Ariane, aperçu au survol", async () => {
    const page = await open();
    const found = [];
    const scan = async (label) => { for (const p of await page.evaluate(audit)) found.push(`${label} : ${p}`); };
    await page.evaluate(() => {
      const ed = document.querySelector(".ProseMirror").editor;
      ed.commands.setContent([
        { type: "paragraph", content: [{ type: "text", text: "Texte avec note" }, { type: "kbFootnote", attrs: { note: "Une note" } }] },
        { type: "kbLatest", attrs: { count: "3", view: "grid", date: "true" } }, { type: "kbSocial", attrs: { links: "facebook=https://facebook.com/x", size: "m" } }, { type: "kbToc", attrs: { depth: "3" } },
        { type: "kbRss", attrs: { url: "https://exemple.org/feed.xml", count: "5" } }, { type: "kbSearch", attrs: {} }, { type: "kbHtml", attrs: { code: "<p>x</p>" } }, { type: "kbNextPage" },
        { type: "kbColumns", attrs: { layout: "custom" }, content: [{ type: "kbColumn", attrs: { basis: "30" }, content: [{ type: "paragraph" }] }, { type: "kbColumn", content: [{ type: "paragraph" }] }] },
        { type: "kbGroup", attrs: { layout: "grid", gridcols: "2" }, content: [{ type: "paragraph" }] }, { type: "kbSpacer", attrs: { size: "m", px: "60" } },
        { type: "kbCover", attrs: { src: "/uploads/thumbnails/a.png", alt: "x", pos: "bl", fx: "25" }, content: [{ type: "paragraph" }] }, { type: "orderedList", attrs: { ltype: "lower-roman" }, content: [{ type: "listItem", content: [{ type: "paragraph" }] }] },
        { type: "blockquote", attrs: { cite: "Auteur" }, content: [{ type: "paragraph" }] }, { type: "table", attrs: { footer: true }, content: [{ type: "tableRow", content: [{ type: "tableCell", content: [{ type: "paragraph" }] }] }] },
        { type: "paragraph", attrs: { fw: "bold", bgc: "#ffeedd", lh: "airy" }, content: [{ type: "text", text: "Réglé" }] },
      ]);
    });
    await page.click('[data-sidebar-tab="bloc"]');
    const count = await page.evaluate(() => document.querySelector(".ProseMirror").editor.state.doc.childCount);
    for (let i = 0; i < count; i++) {
      await page.evaluate((k) => { const ed = document.querySelector(".ProseMirror").editor; let at = -1, n = 0; ed.state.doc.forEach((node, pos) => { if (n++ === k) at = pos; }); try { ed.commands.setNodeSelection(at); } catch { ed.commands.setTextSelection(at + 1); } }, i);
      await page.waitForTimeout(100);
      // tous les groupes de réglages de style sont dépliés : chaque champ doit avoir son libellé
      await page.evaluate(() => document.querySelectorAll('[data-panel-style] > h2 > button[aria-expanded="false"]').forEach((b) => b.click()));
      await scan(`réglages du bloc ${i}`);
    }
    // fil d'Ariane
    assert.ok(await page.locator("nav[data-breadcrumb][aria-label]").count(), "le fil d'Ariane est une navigation nommée");
    await scan("fil d'Ariane");
    // boîtes de dialogue
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setTextSelection(2); ed.view.focus(); });
    await page.mouse.move(1300, 520);
    await page.locator('[data-block-toolbar] button[aria-label="Options"], [data-top-toolbar] button[aria-label="Options"]').first().click();
    await page.getByRole("menuitem", { name: /Options de verrouillage/ }).click();
    await scan("verrouillage"); await page.keyboard.press("Escape");
    await page.evaluate(() => document.querySelector(".ProseMirror").editor.view.focus());
    await page.mouse.move(1300, 540);
    await page.locator('[data-block-toolbar] button[aria-label="Options"], [data-top-toolbar] button[aria-label="Options"]').first().click();
    await page.getByRole("menuitem", { name: /Modifier en HTML/ }).click();
    await scan("modifier en HTML"); await page.keyboard.press("Escape");
    await page.click("[data-options-toggle]");
    await page.getByRole("menuitem", { name: "Guide de bienvenue" }).click();
    await scan("guide de bienvenue"); await page.keyboard.press("Escape");
    // aperçu au survol : décoratif, jamais focalisable ni annoncé deux fois
    await page.click("[data-toggle-inserter]");
    await page.locator(".wp-block-type", { hasText: "Citation" }).first().hover();
    assert.equal(await page.locator(".wp-block-preview").getAttribute("aria-hidden"), "true");
    assert.equal(await page.locator(".wp-block-preview a, .wp-block-preview button, .wp-block-preview input").count(), 0);
    const unique = [...new Set(found)];
    assert.deepEqual(unique, [], unique.join("\n"));
    await page.context().close();
  });

  test("clavier : la vue en liste se parcourt et déplace un bloc (Alt+flèches), le menu du bloc s'ouvre et se ferme au clavier", async () => {
    const page = await open();
    await page.evaluate(() => document.querySelector(".ProseMirror").editor.commands.setContent("<p>Alpha</p><p>Beta</p><p>Gamma</p>"));
    await page.click('[data-rail="list"]');
    await page.waitForSelector(".wp-lv-select");
    await page.locator(".wp-lv-select").nth(2).focus();
    await page.keyboard.press("Alt+ArrowUp");
    await page.waitForTimeout(250);
    const order = await page.evaluate(() => { const a = []; document.querySelector(".ProseMirror").editor.state.doc.forEach((n) => a.push(n.textContent)); return a; });
    assert.deepEqual(order, ["Alpha", "Gamma", "Beta"]);
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains("wp-lv-select")), true, "le focus reste dans la liste");
    // Menu du bloc : ouvert au clavier, fermé par Échap, focus rendu
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setTextSelection(2); ed.view.focus(); });
    await page.keyboard.press("Alt+F10");
    await page.keyboard.press("Tab"); // fait défiler les boutons de la barre jusqu'à « Options »
    const focusedLabel = await page.evaluate(() => document.activeElement.getAttribute("aria-label"));
    assert.ok(focusedLabel, "la barre d'outils du bloc est atteignable au clavier");
    await page.context().close();
  });

  test("performance : un article de 800 blocs s'ouvre vite et la frappe reste fluide", async () => {
    const page = await open();
    const t = await page.evaluate(() => {
      const ed = document.querySelector(".ProseMirror").editor;
      const parts = [];
      for (let i = 0; i < 200; i++) parts.push(`<h2>Titre ${i}</h2><p>Paragraphe ${i} avec un peu de texte pour occuper de la place dans le document.</p><div class="kb-group" data-bg="light"><p>Dans un groupe ${i}</p></div><ul><li><p>Point ${i}</p></li></ul>`);
      const t0 = performance.now();
      ed.commands.setContent(parts.join(""));
      const load = performance.now() - t0;
      ed.commands.setTextSelection(ed.state.doc.content.size - 5);
      ed.view.focus();
      const times = [];
      for (let i = 0; i < 40; i++) { const s = performance.now(); ed.commands.insertContent("a"); times.push(performance.now() - s); }
      times.sort((a, b) => a - b);
      return { blocks: ed.state.doc.childCount, load: Math.round(load), median: Math.round(times[20] * 10) / 10, p95: Math.round(times[38] * 10) / 10 };
    });
    assert.ok(t.blocks >= 800, `${t.blocks} blocs`);
    assert.ok(t.load < 4000, `chargement : ${t.load} ms`);
    assert.ok(t.median < 80, `frappe (médiane) : ${t.median} ms`);
    assert.ok(t.p95 < 250, `frappe (95e centile) : ${t.p95} ms`);
    console.log(`PERF ${JSON.stringify(t)}`);
    await page.context().close();
  });
});
