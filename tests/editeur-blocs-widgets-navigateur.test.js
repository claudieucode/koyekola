// KOLAKISA — widgets, notes de bas de page, pages multiples et HTML personnalisé dans l'éditeur (VRAI Chrome) : insertion par l'outil d'insertion, réglages, aller-retour.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("widgets et blocs spéciaux — éditeur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, errors;
  const open = async () => {
    const context = await browser.newContext({ viewport: { width: 1500, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await page.goto(`${srv.base}/formateur/blog/nouveau`);
    await page.waitForFunction(() => document.querySelector(".ProseMirror") && document.querySelector(".ProseMirror").editor);
    return page;
  };
  const load = (page, html) => page.evaluate((h) => { document.querySelector(".ProseMirror").editor.commands.setContent(h); return true; }, html);
  const html = (page) => page.evaluate(() => document.querySelector(".ProseMirror").editor.getHTML());
  const tops = (page) => page.evaluate(() => { const out = []; document.querySelector(".ProseMirror").editor.state.doc.forEach((n) => out.push({ type: n.type.name, attrs: n.attrs })); return out; });
  const insert = async (page, title) => {
    const search = page.locator('.wp-search[aria-label="Rechercher un bloc"]');
    if (!(await search.isVisible().catch(() => false))) await page.click("[data-toggle-inserter]");
    await search.fill(title);
    await page.locator(".wp-block-type", { hasText: title }).first().click();
  };
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); errors = []; browser = await chromium.launch({ executablePath: CHROME, headless: true }); });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("l'outil d'insertion propose les widgets, « Page suivante » et « HTML personnalisé » (créateur) ; chacun s'insère avec ses réglages par défaut", async () => {
    for (const [title, type] of [["Derniers articles", "kbLatest"], ["Sommaire", "kbToc"], ["Calendrier", "kbCalendar"], ["Nuage d'étiquettes", "kbTags"], ["Page suivante", "kbNextPage"], ["HTML personnalisé", "kbHtml"]]) {
      const fresh = await open();
      await load(fresh, "<p></p>");
      await fresh.evaluate(() => document.querySelector(".ProseMirror").editor.commands.focus("start"));
      await insert(fresh, title);
      assert.ok((await tops(fresh)).some((n) => n.type === type), `${title} : bloc ${type} inséré`);
      await fresh.context().close();
    }
    const page = await open();
    await load(page, "<p></p>");
    await insert(page, "Derniers articles");
    const latest = (await tops(page)).find((n) => n.type === "kbLatest");
    assert.deepEqual([latest.attrs.count, latest.attrs.view, latest.attrs.date], ["5", "list", "true"]);
    assert.deepEqual(errors, []);
    await page.context().close();
  });

  test("réglages d'un widget dans le panneau Bloc : nombre d'articles, présentation, catégorie, et aller-retour", async () => {
    const page = await open();
    await load(page, '<div class="kb-latest" data-count="5" data-view="list" data-date="true"></div>');
    await page.evaluate(() => document.querySelector(".ProseMirror").editor.commands.setNodeSelection(0));
    await page.click('[data-sidebar-tab="bloc"]');
    await page.mouse.move(1300, 500);
    await page.getByLabel("Nombre d'articles").fill("8");
    await page.getByLabel("Nombre d'articles").press("Tab");
    await page.getByLabel("Présentation").selectOption("grid");
    await page.getByLabel("Afficher l'image").check();
    await page.getByLabel("Seulement cette catégorie").fill("Marketing");
    await page.getByLabel("Seulement cette catégorie").press("Tab");
    const out = await html(page);
    for (const re of [/data-count="8"/, /data-view="grid"/, /data-image="true"/, /data-category="Marketing"/]) assert.match(out, re);
    // Valeur hors limites refusée côté éditeur
    await page.getByLabel("Nombre d'articles").fill("99");
    await page.getByLabel("Nombre d'articles").press("Tab");
    assert.match(await html(page), /data-count="8"/);
    await page.context().close();
  });

  test("notes de bas de page : ajoutées par « Plus », numérotées dans l'éditeur, modifiables au clic, enregistrées", async () => {
    const page = await open();
    await load(page, "<p>Un texte avec une note.</p><p>Et une autre note.</p>");
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setTextSelection(10); ed.view.focus(); });
    await page.getByRole("button", { name: "Plus" }).first().click().catch(async () => { await page.locator('[data-block-toolbar] button[aria-label*="Plus"], [data-top-toolbar] button[aria-label*="Plus"]').first().click(); });
    await page.getByRole("menuitem", { name: /Note de bas de page/ }).click();
    await page.getByLabel("Texte de la note").fill("Première note");
    await page.locator("dialog").getByRole("button", { name: "Enregistrer" }).click();
    await page.waitForSelector("dialog", { state: "detached" }); // la fenêtre se ferme avec une courte sortie animée
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; const size = ed.state.doc.content.size; ed.commands.setTextSelection(size - 3); });
    const out = await html(page);
    assert.match(out, /<sup class="kb-fn" data-note="Première note">/);
    assert.equal(await page.locator(".ProseMirror .kb-ed-footnote").count(), 1);
    assert.match(await page.locator(".ProseMirror .kb-ed-footnote").evaluate((el) => getComputedStyle(el, "::before").content), /counter\(kbfn\)/, "numérotation automatique dans l'éditeur");
    await page.fill("#post-title", "Titre"); // le focus quitte le texte : la barre d'outils flottante ne recouvre plus la note
    await page.locator(".ProseMirror .kb-ed-footnote").click();
    await page.getByLabel("Texte de la note").fill("Note corrigée");
    await page.locator("dialog").getByRole("button", { name: "Enregistrer" }).click();
    await page.waitForSelector("dialog", { state: "detached" }); // la fenêtre se ferme avec une courte sortie animée
    assert.match(await html(page), /data-note="Note corrigée"/);
    // aller-retour : le HTML enregistré redonne la même note
    await load(page, await html(page));
    assert.match(await html(page), /data-note="Note corrigée"/);
    assert.deepEqual(errors, []);
    await page.context().close();
  });

  test("HTML personnalisé : le code est édité dans le panneau, aperçu isolé sans scripts, aller-retour exact (accents, guillemets, scripts)", async () => {
    const page = await open();
    const code = '<p class="x">Été "ok" & \'oui\'</p><script>window.__kbTest = 1</script>';
    await page.evaluate((c) => document.querySelector(".ProseMirror").editor.commands.setContent([{ type: "kbHtml", attrs: { code: c } }, { type: "paragraph" }]), code);
    const stored = await html(page);
    assert.match(stored, /<div class="kb-html" data-code="[A-Za-z0-9_-]+"/);
    assert.doesNotMatch(stored, /<script/, "le code est encodé, jamais écrit comme balisage dans l'éditeur");
    await load(page, stored);
    assert.equal((await tops(page))[0].attrs.code, code);
    assert.equal(await page.evaluate(() => window.__kbTest), undefined, "le script ne s'exécute pas dans l'éditeur");
    assert.equal(await page.locator(".ProseMirror .kb-ed-html iframe").getAttribute("sandbox"), "");
    await page.evaluate(() => document.querySelector(".ProseMirror").editor.commands.setNodeSelection(0));
    await page.click('[data-sidebar-tab="bloc"]');
    await page.mouse.move(1300, 500);
    await page.getByLabel("Code HTML").fill("<b>Nouveau</b>");
    await page.waitForTimeout(600);
    assert.equal((await tops(page))[0].attrs.code, "<b>Nouveau</b>");
    await page.context().close();
  });

  test("enregistrement réel : un article avec HTML personnalisé, widget et note est enregistré par le créateur et publié intact", async () => {
    const page = await open();
    await page.fill("#post-title", "Article riche");
    await page.evaluate(() => document.querySelector(".ProseMirror").editor.commands.setContent([
      { type: "paragraph", content: [{ type: "text", text: "Texte" }, { type: "kbFootnote", attrs: { note: "Ma note" } }] },
      { type: "kbHtml", attrs: { code: '<p id="mien">Code</p>' } },
      { type: "kbLatest", attrs: { count: "3", view: "list", date: "true" } },
      { type: "kbNextPage" }, { type: "paragraph", content: [{ type: "text", text: "Suite" }] },
    ]));
    const body = await html(page);
    const fd = new FormData();
    for (const [k, v] of Object.entries({ content_format: "html", title: "Article riche", content: body, status: "published" })) fd.append(k, v);
    const saved = JSON.parse((await boss.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } })).text);
    const row = srv.db().prepare("SELECT content FROM posts WHERE id = ?").get(saved.id).content;
    for (const re of [/data-sig=/, /class="kb-fn" data-note="Ma note"/, /class="kb-latest" data-count="3"/, /class="kb-nextpage"/]) assert.match(row, re);
    const p1 = await (await fetch(`${srv.base}/blog/${saved.slug}`)).text();
    assert.match(p1, /<div class="kb-html-block"><p id="mien">Code<\/p><\/div>/);
    assert.match(p1, /Page 1 sur 2/);
    assert.match(await (await fetch(`${srv.base}/blog/${saved.slug}?page=2`)).text(), /Suite/);
    await page.context().close();
  });
});
