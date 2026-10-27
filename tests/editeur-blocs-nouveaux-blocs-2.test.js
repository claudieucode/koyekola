// KOLAKISA — blocs ajoutés par le chantier « parité complète 2 » : Icône, Formule mathématique, Liste de lecture, Accordéon, Onglets, Fil d'Ariane.
// Règles du serveur, convertisseur LaTeX → MathML, puis insertion, réglages, aller-retour et comportement public dans un VRAI Chrome.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { sanitizeBlogHtml, renderBlogHtml } = require("../src/utils/blogHtml");
const { latexToMathML } = require("../src/shared/latexMath");
const { ICON_NAMES } = require("../src/shared/contentIcons");
const { ICONS } = require("../src/utils/icons");

describe("convertisseur LaTeX → MathML", () => {
  const ml = (latex) => latexToMathML(latex).mathml;
  test("fractions, racines, exposants, indices, sommes, intégrales, matrices, grec, texte", () => {
    assert.match(ml("\\frac{a+b}{c}"), /<mfrac><mrow><mi>a<\/mi><mo>\+<\/mo><mi>b<\/mi><\/mrow><mi>c<\/mi><\/mfrac>/);
    assert.match(ml("\\sqrt[3]{x}"), /<mroot><mi>x<\/mi><mn>3<\/mn><\/mroot>/);
    assert.match(ml("x^2+y_i"), /<msup><mi>x<\/mi><mn>2<\/mn><\/msup>.*<msub><mi>y<\/mi><mi>i<\/mi><\/msub>/);
    assert.match(ml("\\sum_{i=1}^{n} i"), /<munderover><mo largeop="true" movablelimits="true">∑<\/mo>/);
    assert.match(ml("\\int_0^\\infty e^{-x}\\,dx"), /<msubsup><mo largeop="true" movablelimits="true">∫<\/mo><mn>0<\/mn><mi>∞<\/mi><\/msubsup>/);
    assert.match(ml("\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}"), /<mtable><mtr><mtd><mi>a<\/mi><\/mtd><mtd><mi>b<\/mi><\/mtd><\/mtr><mtr><mtd><mi>c<\/mi><\/mtd><mtd><mi>d<\/mi><\/mtd><\/mtr><\/mtable>/);
    assert.match(ml("\\alpha \\leq \\beta"), /<mi>α<\/mi><mo>≤<\/mo><mi>β<\/mi>/);
    assert.match(ml("\\text{si } x>0"), /<mtext>si<\/mtext>/);
    assert.match(ml("\\mathbb{R}"), /<mi>ℝ<\/mi>/);
    assert.match(ml("\\left( \\frac{a}{b} \\right)"), /<mo stretchy="true">\(<\/mo><mfrac>/);
  });
  test("la sortie n'a que des éléments MathML d'une liste fermée : aucune balise, aucun attribut, aucun lien ne vient de la saisie", () => {
    const ALLOWED = new Set(["math", "semantics", "annotation", "mrow", "mi", "mn", "mo", "mtext", "mfrac", "msqrt", "mroot", "msup", "msub", "msubsup", "munder", "mover", "munderover", "mtable", "mtr", "mtd", "mstyle", "mspace"]);
    for (const evil of ["<script>alert(1)</script>", "<img src=x onerror=alert(1)>", "\\href{javascript:alert(1)}{x}", "\\url{https://evil}", "\\includegraphics{x}", "a\" onclick=\"x", "</annotation><script>1</script>", "\\begin{evil}x\\end{evil}", "{".repeat(5000), "\\frac".repeat(400)]) {
      const out = latexToMathML(evil).mathml;
      for (const tag of out.matchAll(/<\/?([a-z]+)/g)) assert.ok(ALLOWED.has(tag[1]), `élément inattendu <${tag[1]}> pour ${evil.slice(0, 30)}`);
      assert.doesNotMatch(out.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, ""), /<script|onerror|onclick|javascript:/i);
      assert.doesNotMatch(out, /<annotation[^>]*>[^<]*<(?!\/annotation)/, "le texte TeX est échappé dans l'annotation");
    }
  });
  test("formule vide refusée ; longueur limitée ; profondeur limitée (pas de plantage)", () => {
    assert.equal(latexToMathML("   ").ok, false);
    assert.ok(latexToMathML("x".repeat(5000)).mathml.length < 20000);
    const t0 = Date.now(); latexToMathML("^".repeat(2000) + "{".repeat(2000)); assert.ok(Date.now() - t0 < 1000);
  });
});

describe("nouveaux blocs — assainissement et rendu", () => {
  test("Icône : seuls les noms du jeu d'icônes sont dessinés, taille fermée, texte alternatif facultatif", () => {
    assert.ok(ICON_NAMES.every((n) => ICONS[n]), "chaque nom proposé existe dans le jeu d'icônes");
    const ok = renderBlogHtml(sanitizeBlogHtml('<div class="kb-icon" data-icon="star" data-size="xl" data-label="Étoile"></div>')).html;
    assert.match(ok, /<div class="kb-icon" data-size="xl" role="img" aria-label="Étoile"><svg [^>]*width="72"/);
    assert.doesNotMatch(renderBlogHtml(sanitizeBlogHtml('<div class="kb-icon" data-icon="star"></div>')).html, /role="img"/, "décorative sans texte alternatif");
    for (const bad of ["evil", "../x", "star;evil", "Star", ""]) assert.doesNotMatch(sanitizeBlogHtml(`<div class="kb-icon" data-icon="${bad}"></div>`), /kb-icon/, bad);
    assert.doesNotMatch(sanitizeBlogHtml('<div class="kb-icon" data-icon="star" data-size="giant"></div>'), /data-size/);
  });
  test("Formule : LaTeX conservé tel quel, rendu en MathML avec annotation TeX", () => {
    const h = renderBlogHtml(sanitizeBlogHtml('<div class="kb-math" data-latex="\\frac{a}{b}"></div>')).html;
    assert.match(h, /<div class="kb-math"><math xmlns="http:\/\/www\.w3\.org\/1998\/Math\/MathML" display="block"><semantics><mfrac>/);
    assert.match(h, /<annotation encoding="application\/x-tex">\\frac\{a\}\{b\}<\/annotation>/);
    assert.doesNotMatch(sanitizeBlogHtml('<div class="kb-math" data-latex="   "></div>'), /kb-math/);
  });
  test("Liste de lecture : seuls les fichiers audio téléversés, 30 pistes au plus, titres nettoyés", () => {
    const raw = ["/uploads/blog/a.mp3|Un titre|Une artiste", "https://evil.test/x.mp3|X|Y", "/uploads/blog/b.exe|X|Y", "/uploads/blog/c.wav||", ...Array.from({ length: 40 }, (_, i) => `/uploads/blog/p${i}.mp3|T${i}|`)].join("\n");
    const out = sanitizeBlogHtml(`<div class="kb-playlist" data-tracks="${raw}" data-title="Mes pistes"></div>`);
    assert.equal((out.match(/\/uploads\/blog\//g) || []).length, 30);
    assert.doesNotMatch(out, /evil|\.exe/);
    const h = renderBlogHtml(out).html;
    assert.match(h, /<figcaption>Mes pistes<\/figcaption>/); assert.match(h, /<span class="kb-playlist-title">Un titre<\/span> <span class="kb-playlist-artist">— Une artiste<\/span><audio src="\/uploads\/blog\/a\.mp3" controls preload="none">/);
    assert.doesNotMatch(sanitizeBlogHtml('<div class="kb-playlist" data-tracks="https://evil.test/x.mp3"></div>'), /kb-playlist/);
  });
  test("Accordéon : un seul élément ouvert à la fois (attribut name) si l'option est choisie", () => {
    const html = '<div class="kb-accordion-group" data-autoclose="true"><details class="kb-acc-item"><summary>A</summary><div class="kb-accordion-body"><p>1</p></div></details><details class="kb-acc-item"><summary>B</summary><div class="kb-accordion-body"><p>2</p></div></details></div>';
    const h = renderBlogHtml(sanitizeBlogHtml(html)).html;
    const names = [...h.matchAll(/<details class="kb-acc-item" name="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(names.length, 2); assert.equal(new Set(names).size, 1);
    assert.doesNotMatch(renderBlogHtml(sanitizeBlogHtml(html.replace(' data-autoclose="true"', ""))).html, /name=/);
  });
  test("Onglets : sections titrées sans JavaScript, identifiants uniques, un onglet seul n'est qu'un contenu", () => {
    const html = '<div class="kb-tabs"><div class="kb-tab" data-title="Un"><p>a</p></div><div class="kb-tab" data-title="Un"><p>b</p></div></div>';
    const h = renderBlogHtml(sanitizeBlogHtml(html)).html;
    assert.match(h, /<div class="kb-tabs" data-tabs="true"><section class="kb-tab-panel" id="onglet-un"><h3 class="kb-tab-title">Un<\/h3><p>a<\/p><\/section><section class="kb-tab-panel" id="onglet-un-2">/);
    assert.equal(renderBlogHtml(sanitizeBlogHtml('<div class="kb-tabs"><div class="kb-tab" data-title="Seul"><p>x</p></div></div>')).html, "<p>x</p>");
  });
  test("Fil d'Ariane : Accueil › Blog › catégories › article, dernier maillon sans lien", () => {
    const widgets = { breadcrumbs: ({ home }) => [...(home ? [{ name: "Accueil", url: "/" }] : []), { name: "Blog", url: "/blog" }, { name: "SEO", url: "/blog/categorie/seo" }, { name: "Mon <article>", url: "" }] };
    const h = renderBlogHtml(sanitizeBlogHtml('<div class="kb-breadcrumbs" data-home="true"></div>'), { widgets }).html;
    assert.match(h, /<ol><li><a href="\/">Accueil<\/a><\/li><li><a href="\/blog">Blog<\/a><\/li><li><a href="\/blog\/categorie\/seo">SEO<\/a><\/li><li aria-current="page">Mon &lt;article&gt;<\/li><\/ol>/);
    assert.doesNotMatch(renderBlogHtml(sanitizeBlogHtml('<div class="kb-breadcrumbs"></div>'), { widgets }).html, /Accueil/);
  });
});

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("nouveaux blocs — éditeur et site public (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, errors;
  const open = async (url = "/formateur/blog/nouveau") => {
    const context = await browser.newContext({ viewport: { width: 1500, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await page.goto(`${srv.base}${url}`);
    return page;
  };
  const editor = async (page) => { await page.waitForFunction(() => document.querySelector(".ProseMirror") && document.querySelector(".ProseMirror").editor); return page; };
  const load = (page, html) => page.evaluate((h) => { document.querySelector(".ProseMirror").editor.commands.setContent(h); return true; }, html);
  const html = (page) => page.evaluate(() => document.querySelector(".ProseMirror").editor.getHTML());
  const tops = (page) => page.evaluate(() => { const out = []; document.querySelector(".ProseMirror").editor.state.doc.forEach((n, pos) => out.push({ type: n.type.name, pos, text: n.textContent, attrs: n.attrs })); return out; });
  const selectNode = (page, i) => page.evaluate((k) => { const ed = document.querySelector(".ProseMirror").editor; let at = -1; let n = 0; ed.state.doc.forEach((_, pos) => { if (n++ === k) at = pos; }); ed.commands.setNodeSelection(at); ed.view.focus(); return at; }, i);
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); errors = []; browser = await chromium.launch({ executablePath: CHROME, headless: true }); });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("éditeur : les six blocs s'insèrent, se règlent dans le panneau Bloc et font l'aller-retour", async () => {
    const page = await editor(await open());
    for (const [title, type] of [["Icône", "kbIcon"], ["Formule mathématique", "kbMath"], ["Accordéon", "kbAccordionGroup"], ["Onglets", "kbTabs"], ["Fil d'Ariane", "kbBreadcrumbs"]]) {
      const fresh = await editor(await open());
      await load(fresh, "<p></p>");
      await fresh.evaluate(() => document.querySelector(".ProseMirror").editor.commands.focus("start"));
      await fresh.click("[data-toggle-inserter]");
      await fresh.locator('.wp-search[aria-label="Rechercher un bloc"]').fill(title);
      await fresh.locator(".wp-block-type", { hasText: title }).first().click();
      assert.ok((await tops(fresh)).some((n) => n.type === type), `${title} : ${type} inséré`);
      await fresh.context().close();
    }
    await load(page, '<div class="kb-icon" data-icon="star" data-size="m"></div><div class="kb-math" data-latex="E = mc^2"></div><div class="kb-tabs"><div class="kb-tab" data-title="Un"><p>a</p></div><div class="kb-tab" data-title="Deux"><p>b</p></div></div><div class="kb-accordion-group" data-autoclose="true"><details class="kb-acc-item"><summary>Q</summary><div class="kb-accordion-body"><p>R</p></div></details></div>');
    const out = await html(page);
    for (const re of [/data-icon="star"/, /data-latex="E = mc\^2"/, /class="kb-tab" data-title="Un"/, /data-autoclose="true"/, /class="kb-acc-item"/]) assert.match(out, re);
    // rendu réel dans l'éditeur : icône dessinée, formule en MathML, onglets étiquetés
    const dom = await page.evaluate(() => ({ svg: !!document.querySelector(".ProseMirror .kb-ed-icon svg"), math: !!document.querySelector(".ProseMirror .kb-ed-math math mfrac, .ProseMirror .kb-ed-math math msup"), tab: [...document.querySelectorAll(".ProseMirror .kb-ed-tab-label")].map((e) => e.textContent) }));
    assert.deepEqual(dom, { svg: true, math: true, tab: ["Onglet : Un", "Onglet : Deux"] });
    // inspecteur : icône
    await page.click('[data-sidebar-tab="bloc"]');
    await selectNode(page, 0); await page.mouse.move(1300, 520);
    await page.getByLabel("Icône", { exact: true }).selectOption("heart");
    await page.getByRole("group").getByRole("button", { name: "Grande", exact: true }).click();
    let t = (await tops(page))[0].attrs; assert.deepEqual([t.icon, t.size], ["heart", "l"]);
    // inspecteur : formule (modèle « Fraction » puis saisie)
    await selectNode(page, 1); await page.mouse.move(1300, 540);
    await page.getByRole("button", { name: "Fraction" }).click();
    await page.waitForTimeout(450);
    assert.match((await tops(page))[1].attrs.latex, /\\frac\{a\}\{b\}/);
    // inspecteur : onglets (renommer, ajouter, retirer)
    await selectNode(page, 2); await page.mouse.move(1300, 560);
    await page.getByLabel("Titre de l'onglet 1").fill("Premier"); await page.getByLabel("Titre de l'onglet 1").press("Tab");
    await page.getByRole("button", { name: "+ Ajouter un onglet" }).click();
    assert.equal(await page.evaluate(() => { let n = 0; document.querySelector(".ProseMirror").editor.state.doc.descendants((x) => { if (x.type.name === "kbTab") n++; return true; }); return n; }), 3);
    assert.match(await html(page), /data-title="Premier"/);
    await page.getByRole("button", { name: "Retirer l'onglet 3" }).click();
    assert.equal(await page.evaluate(() => { let n = 0; document.querySelector(".ProseMirror").editor.state.doc.descendants((x) => { if (x.type.name === "kbTab") n++; return true; }); return n; }), 2);
    assert.deepEqual(errors, []);
    await page.context().close();
  });

  test("site public : les onglets deviennent de vrais onglets (rôles, flèches, Début/Fin), l'accordéon est exclusif, la formule est en MathML, l'icône et la liste de lecture s'affichent", async () => {
    const content = '<div class="kb-icon" data-icon="star" data-label="Étoile"></div><div class="kb-math" data-latex="\\frac{a}{b}"></div><div class="kb-tabs"><div class="kb-tab" data-title="Premier"><p>Contenu un</p></div><div class="kb-tab" data-title="Deuxième"><p>Contenu deux</p></div><div class="kb-tab" data-title="Troisième"><p>Contenu trois</p></div></div><div class="kb-accordion-group" data-autoclose="true"><details class="kb-acc-item"><summary>Question A</summary><div class="kb-accordion-body"><p>Réponse A</p></div></details><details class="kb-acc-item"><summary>Question B</summary><div class="kb-accordion-body"><p>Réponse B</p></div></details></div><div class="kb-breadcrumbs" data-home="true"></div>';
    const fd = new FormData();
    for (const [k, v] of Object.entries({ content_format: "html", title: "Article nouveaux blocs", content, status: "published" })) fd.append(k, v);
    const saved = JSON.parse((await boss.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } })).text);
    const page = await open(`/blog/${saved.slug}`);
    await page.waitForSelector(".kb-tablist");
    const tabs = page.getByRole("tab");
    assert.equal(await tabs.count(), 3);
    assert.equal(await tabs.nth(0).getAttribute("aria-selected"), "true");
    assert.equal(await page.locator('[role="tabpanel"]:visible').count(), 1);
    await tabs.nth(0).focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await tabs.nth(1).getAttribute("aria-selected"), "true");
    assert.match(await page.locator('[role="tabpanel"]:visible').innerText(), /Contenu deux/);
    await page.keyboard.press("End"); assert.equal(await tabs.nth(2).getAttribute("aria-selected"), "true");
    await page.keyboard.press("Home"); assert.equal(await tabs.nth(0).getAttribute("aria-selected"), "true");
    await page.keyboard.press("ArrowLeft"); assert.equal(await tabs.nth(2).getAttribute("aria-selected"), "true", "retour à la fin");
    // formule : MathML réellement rendu (largeur > 0)
    assert.ok(await page.evaluate(() => { const m = document.querySelector(".kb-math math"); const r = m.getBoundingClientRect(); return r.width > 5 && r.height > 5; }), "la formule occupe de la place");
    // accordéon exclusif
    const details = page.locator(".kb-acc-item");
    await details.nth(0).locator("summary").click();
    await details.nth(1).locator("summary").click();
    assert.equal(await details.nth(0).evaluate((d) => d.open), false, "ouvrir B referme A");
    assert.equal(await details.nth(1).evaluate((d) => d.open), true);
    // icône et fil d'Ariane
    assert.ok(await page.locator('.kb-icon[role="img"][aria-label="Étoile"] svg').count());
    assert.match(await page.locator(".kb-breadcrumbs").innerText(), /Accueil\s*›?\s*Blog/);
    assert.deepEqual(errors, []);
    await page.context().close();
  });
});
