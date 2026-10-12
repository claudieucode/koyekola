// Interactions des widgets sur la PAGE PUBLIÉE dans un vrai Chrome : clic, clavier, états ARIA, valeurs affichées. Chaque widget interactif est publié
// avec un contenu réaliste, puis actionné comme le ferait un visiteur ; ce qui est affiché ET exposé aux lecteurs d'écran est relu.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

const IMG = (i) => ({ src: `https://example.com/${i}.jpg`, alt: `Image ${i}` });
const soon = (ms) => new Date(Date.now() + ms).toISOString();
const NODES = [
  { id: "accord000001", type: "accordion", props: { items: [{ q: "Première question ?", a: "Première réponse." }, { q: "Seconde question ?", a: "Seconde réponse." }] } },
  { id: "tabs00000001", type: "tabs", props: { items: [{ title: "Alpha", text: "Texte alpha." }, { title: "Beta", text: "Texte beta." }, { title: "Gamma", text: "Texte gamma." }] } },
  { id: "toggle000001", type: "toggle", props: { title: "Voir le détail", text: "Le détail caché." } },
  { id: "readmo000001", type: "readmore", props: { intro: "Résumé.", more: "Suite cachée du texte." } },
  { id: "modal0000001", type: "modal", props: { buttonLabel: "Ouvrir la fenêtre", title: "Titre de la fenêtre", text: "Contenu de la fenêtre." } },
  { id: "tooltip00001", type: "tooltip", props: { text: "Mot", tip: "Explication du mot.", position: "top" } },
  { id: "flipbox00001", type: "flipbox", props: { icon: "star", frontTitle: "Recto", frontText: "Texte recto", backTitle: "Verso", backText: "Texte verso", effect: "flip", height: 280 } },
  { id: "carous000001", type: "carousel", props: { images: [IMG(1), IMG(2), IMG(3)] } },
  { id: "gallery00001", type: "gallery", props: { images: [IMG(1), IMG(2)], lightbox: true } },
  { id: "hotspot00001", type: "hotspot", props: { src: "https://example.com/a.jpg", alt: "Plan", spots: [{ x: 30, y: 40, title: "Point A", text: "Détail A" }] } },
  { id: "countd000001", type: "countdown", props: { until: soon(3 * 24 * 3600 * 1000), endText: "Terminé." } },
  { id: "countp000001", type: "countdown", props: { until: "2020-01-01T10:00:00.000Z", endText: "Offre terminée." } },
  { id: "counter00001", type: "counter", props: { value: 250, label: "Élèves" } },
  { id: "search000001", type: "search", props: { target: "catalogue", placeholder: "Chercher…" } },
  { id: "heada0000001", type: "heading", props: { text: "Premier titre", level: 2 } },
  { id: "headb0000001", type: "heading", props: { text: "Second titre", level: 3 } },
  { id: "toc000000001", type: "toc", props: { title: "Sommaire", depth: "3" } },
  { id: "slides000001", type: "slides", props: { label: "Diaporama", slides: [{ image: "", title: "Un", text: "Premier", buttonLabel: "Lien", buttonUrl: "/", dark: 45 }, { image: "", title: "Deux", text: "Second", buttonLabel: "", buttonUrl: "", dark: 45 }] } },
  { id: "tcar00000001", type: "testimonialcarousel", props: { label: "Témoignages", items: [{ quote: "Très bien.", name: "Ana", role: "Élève", photo: "", stars: 5 }, { quote: "Excellent.", name: "Bob", role: "Élève", photo: "", stars: 4 }], dots: true, loop: false } },
  { id: "mcar00000001", type: "mediacarousel", props: { label: "Médias", items: [{ kind: "image", image: "https://example.com/a.jpg", alt: "a", caption: "" }, { kind: "image", image: "https://example.com/b.jpg", alt: "b", caption: "" }], dots: true, loop: false, autoplay: false, interval: 5 } },
  { id: "animh0000001", type: "animatedheading", props: { before: "Apprenez", words: ["Photoshop", "Illustrator", "Blender"], after: "à votre rythme", level: "2", effect: "fade", interval: 1200 } },
  { id: "share0000001", type: "sharebuttons", props: { networks: ["facebook", "x", "linkedin", "whatsapp"], size: "32", shape: "circle", label: "Partager cette page" } },
  { id: "anchor000001", type: "menuanchor", anchor: "tarifs" },
  { id: "toanch000001", type: "link", props: { label: "Aller aux tarifs", url: "#tarifs" } },
  { id: "readp0000001", type: "readingprogress", props: { position: "top", thickness: 4 } },
  { id: "tall00000001", type: "container", children: [], styles: { desktop: { minHeight: "2200px" } } },
  { id: "vplay0000001", type: "videoplaylist", props: { title: "Ma liste", videos: [{ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Un" }, { url: "https://www.youtube.com/watch?v=9bZkp7q19f0", title: "Deux" }] } },
];

describe("interactions des widgets sur la page publiée (Chrome réel)", { skip: SKIP }, () => {
  let srv, browser, context, url;
  const errors = [];
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    const boss = await loginInstructor(srv); const db = srv.db();
    const id = Number((await boss.post("/marketing/pages", { name: "Interactions" })).location.match(/(\d+)$/)[1]);
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision, content: { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: NODES }] }] } }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 300));
    const pub = await boss.postJson(`/marketing/pages/${id}/publier.json`, {});
    assert.equal(pub.status, 200, pub.text.slice(0, 300));
    url = `${srv.base}/p/${db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug}`;
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  const open = async () => {
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`script : ${e.message}`));
    await page.goto(url, { waitUntil: "load" });
    await page.waitForTimeout(500);
    return page;
  };
  const n = (id) => `.kw-n-${id}`;

  test("accordéon, bascule et « lire la suite » : le clic et le clavier ouvrent puis ferment", async () => {
    const page = await open();
    for (const id of ["accord000001", "toggle000001", "readmo000001"]) {
      const det = page.locator(`details${n(id)}, ${n(id)} details`).first();
      const d = det.locator("summary").first();
      assert.equal(await det.evaluate((e) => e.open), false, `${id} fermé au départ`);
      await d.click(); assert.equal(await det.evaluate((e) => e.open), true, `${id} : clic ouvre`);
      await d.click(); assert.equal(await det.evaluate((e) => e.open), false, `${id} : second clic ferme`);
      await d.focus(); await page.keyboard.press("Enter"); assert.equal(await det.evaluate((e) => e.open), true, `${id} : Entrée ouvre`);
      await page.keyboard.press("Space"); assert.equal(await det.evaluate((e) => e.open), false, `${id} : Espace ferme`);
    }
    await page.close();
  });

  test("onglets : rôles ARIA, clic, flèches, Début/Fin ; un seul panneau visible à la fois", async () => {
    const page = await open();
    const tabs = page.locator(`${n("tabs00000001")} [role=tab]`);
    assert.equal(await tabs.count(), 3);
    const state = () => page.evaluate((sel) => ({ sel: [...document.querySelectorAll(`${sel} [role=tab]`)].map((t) => t.getAttribute("aria-selected")), shown: [...document.querySelectorAll(`${sel} [role=tabpanel]`)].map((p) => !p.hidden) }), n("tabs00000001"));
    assert.deepEqual(await state(), { sel: ["true", "false", "false"], shown: [true, false, false] });
    await tabs.nth(1).click(); assert.deepEqual(await state(), { sel: ["false", "true", "false"], shown: [false, true, false] });
    await page.keyboard.press("ArrowRight"); assert.deepEqual((await state()).shown, [false, false, true], "flèche droite");
    await page.keyboard.press("ArrowRight"); assert.deepEqual((await state()).shown, [true, false, false], "flèche droite en fin de liste revient au début");
    await page.keyboard.press("End"); assert.deepEqual((await state()).shown, [false, false, true], "Fin");
    await page.keyboard.press("Home"); assert.deepEqual((await state()).shown, [true, false, false], "Début");
    // chaque onglet pointe vers son panneau
    const links = await page.evaluate((sel) => [...document.querySelectorAll(`${sel} [role=tab]`)].map((t) => { const p = document.getElementById(t.getAttribute("aria-controls")); return !!p && p.getAttribute("aria-labelledby") === t.id; }), n("tabs00000001"));
    assert.deepEqual(links, [true, true, true]);
    await page.close();
  });

  test("fenêtre modale : s'ouvre au clic, se ferme par le bouton, Échap et le clic hors cadre ; le focus revient au bouton", async () => {
    const page = await open();
    const opener = page.locator(`${n("modal0000001")} .kw-modal-open`);
    const dlg = page.locator(`${n("modal0000001")} dialog`);
    assert.equal(await dlg.evaluate((e) => e.open), false);
    await opener.click(); assert.equal(await dlg.evaluate((e) => e.open), true, "ouverte");
    assert.ok(await dlg.getAttribute("aria-labelledby"), "nommée");
    await page.locator(`${n("modal0000001")} [data-kw-modal-close]`).click(); assert.equal(await dlg.evaluate((e) => e.open), false, "fermée par le bouton");
    await opener.click(); await page.keyboard.press("Escape"); assert.equal(await dlg.evaluate((e) => e.open), false, "fermée par Échap");
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains("kw-modal-open")), true, "le focus revient au bouton d'ouverture");
    await opener.click(); await page.mouse.click(5, 5); assert.equal(await dlg.evaluate((e) => e.open), false, "fermée par le clic hors cadre");
    await page.close();
  });

  test("info-bulle : visible au survol et au focus clavier, cachée sinon ; reliée au déclencheur", async () => {
    const page = await open();
    const bubble = page.locator(`${n("tooltip00001")} .kw-tip-bubble`);
    const trigger = page.locator(`${n("tooltip00001")} .kw-tip-trigger`);
    const shown = () => bubble.evaluate((e) => { const s = getComputedStyle(e); return s.visibility !== "hidden" && Number(s.opacity) > 0.5 && s.display !== "none"; });
    assert.equal(await shown(), false, "cachée au départ");
    await trigger.hover(); await page.waitForTimeout(300); assert.equal(await shown(), true, "survol");
    await page.mouse.move(600, 700); await page.waitForTimeout(300); assert.equal(await shown(), false, "survol terminé");
    await trigger.focus(); await page.waitForTimeout(300); assert.equal(await shown(), true, "focus clavier");
    assert.equal(await trigger.getAttribute("aria-describedby"), await bubble.getAttribute("id"));
    await page.close();
  });

  test("boîte retournable : le survol, le focus et le clic montrent le verso", async () => {
    const page = await open();
    const box = page.locator(n("flipbox00001"));
    const flipped = () => box.evaluate((e) => { const inner = e.querySelector(".kw-flip-inner"); return getComputedStyle(inner).transform !== "none" && getComputedStyle(inner).transform !== "matrix(1, 0, 0, 1, 0, 0)" || e.classList.contains("is-flipped"); });
    assert.equal(await flipped(), false, "recto au départ");
    await box.hover(); await page.waitForTimeout(900); assert.equal(await flipped(), true, "survol");
    await page.mouse.move(600, 880); await page.waitForTimeout(900); assert.equal(await flipped(), false, "survol terminé");
    await box.focus(); await page.waitForTimeout(900); assert.equal(await flipped(), true, "focus clavier");
    await page.close();
  });

  test("carrousel d'images : suivant / précédent / points / clavier, boutons désactivés aux extrémités, position annoncée", async () => {
    const page = await open();
    const root = n("carous000001");
    const cur = () => page.evaluate((sel) => { const d = [...document.querySelectorAll(`${sel} .kw-carousel-dot`)]; return { dot: d.findIndex((x) => x.getAttribute("aria-current") === "true"), prev: document.querySelector(`${sel} .is-prev`).disabled, next: document.querySelector(`${sel} .is-next`).disabled }; }, root);
    assert.deepEqual(await cur(), { dot: 0, prev: true, next: false });
    await page.locator(`${root} .is-next`).click(); await page.waitForTimeout(700); assert.equal((await cur()).dot, 1, "suivant");
    await page.locator(`${root} .kw-carousel-dot`).nth(2).click(); await page.waitForTimeout(700); assert.deepEqual(await cur(), { dot: 2, prev: false, next: true }, "point 3 : suivant désactivé");
    await page.locator(`${root} .is-prev`).click(); await page.waitForTimeout(700); assert.equal((await cur()).dot, 1, "précédent");
    await page.locator(`${root} .kw-carousel-track`).focus(); await page.keyboard.press("ArrowRight"); await page.waitForTimeout(700); assert.equal((await cur()).dot, 2, "flèche droite au clavier");
    await page.close();
  });

  test("galerie avec agrandissement : un clic ouvre l'image en grand, Échap la ferme", async () => {
    const page = await open();
    const item = page.locator(`${n("gallery00001")} .kw-gallery-item`).first();
    assert.ok(await item.locator("a, button, [role=button]").count() || (await item.getAttribute("data-kw-lightbox")) !== null || await page.locator(`${n("gallery00001")}[data-kw-lightbox]`).count(), "les images sont cliquables (lien, bouton ou attribut d'agrandissement)");
    await item.locator("img").click({ force: true }); await page.waitForTimeout(500);
    const open1 = await page.evaluate(() => !!document.querySelector("dialog[open], .kw-lightbox, [data-kw-lightbox-open], .kw-lb"));
    assert.equal(open1, true, "l'image s'ouvre en grand");
    await page.keyboard.press("Escape"); await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => !!document.querySelector("dialog[open], .kw-lightbox.is-open, .kw-lb.is-open, [data-kw-lightbox-open]")), false, "Échap ferme");
    await page.close();
  });

  test("points d'intérêt : le bouton ouvre et ferme la carte et annonce son état", async () => {
    const page = await open();
    const dot = page.locator(`${n("hotspot00001")} .kw-spot-dot`).first();
    const card = page.locator(`${n("hotspot00001")} .kw-spot-card`).first();
    const vis = () => card.evaluate((e) => { const s = getComputedStyle(e); return s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.5; });
    assert.equal(await dot.getAttribute("aria-expanded"), "false"); assert.equal(await vis(), false);
    await dot.click(); await page.waitForTimeout(300);
    assert.equal(await dot.getAttribute("aria-expanded"), "true"); assert.equal(await vis(), true, "carte visible");
    await dot.click(); await page.waitForTimeout(300);
    assert.equal(await dot.getAttribute("aria-expanded"), "false"); assert.equal(await vis(), false, "carte refermée");
    await page.close();
  });

  test("compte à rebours : décompte qui avance ; date passée → message de fin, jamais de valeurs négatives", async () => {
    const page = await open();
    const secs = () => page.locator(`${n("countd000001")} .kw-countdown-unit strong`).last().innerText();
    const a = await secs(); await page.waitForTimeout(2200); const b = await secs();
    assert.notEqual(a, b, `le décompte n'avance pas (${a} → ${b})`);
    assert.equal(await page.locator(`${n("countd000001")} .kw-countdown-unit`).count(), 4);
    const texte = await page.locator(n("countp000001")).innerText();
    assert.match(texte, /Offre terminée\./); assert.doesNotMatch(texte, /-\d/);
    await page.close();
  });

  test("compteur : la valeur monte jusqu'à la valeur finale quand il devient visible", async () => {
    const page = await open();
    await page.locator(n("counter00001")).scrollIntoViewIfNeeded(); await page.waitForTimeout(2500);
    assert.equal((await page.locator(`${n("counter00001")} .kw-counter-value`).innerText()).replace(/\s| /g, ""), "250");
    await page.close();
  });

  test("recherche : la saisie envoie vers le catalogue avec le mot cherché", async () => {
    const page = await open();
    await page.locator(`${n("search000001")} input`).fill("photoshop");
    await Promise.all([page.waitForURL(/\/catalogue\?q=photoshop/, { timeout: 8000 }), page.locator(`${n("search000001")} input`).press("Enter")]);
    await page.close();
  });

  test("table des matières : liste les titres de la page, chaque lien mène à son titre", async () => {
    const page = await open();
    const links = await page.locator(`${n("toc000000001")} a`).evaluateAll((a) => a.map((x) => [x.textContent.trim(), x.getAttribute("href")]));
    assert.deepEqual(links.map((l) => l[0]), ["Premier titre", "Second titre"]);
    for (const [, href] of links) assert.equal(await page.locator(href).count(), 1, `la cible ${href} existe une seule fois`);
    await page.close();
  });

  test("playlist vidéo : choisir une vidéo change le lecteur et l'élément courant", async () => {
    const page = await open();
    const frame = page.locator(`${n("vplay0000001")} .kw-vp-frame`);
    const first = await frame.getAttribute("src");
    await page.locator(`${n("vplay0000001")} .kw-vp-item`).nth(1).click(); await page.waitForTimeout(400);
    assert.notEqual(await frame.getAttribute("src"), first, "le lecteur change");
    assert.equal(await page.locator(`${n("vplay0000001")} .kw-vp-item`).nth(1).getAttribute("class").then((c) => /is-current/.test(c)), true);
    await page.close();
  });

  test("diaporama, carrousel de témoignages et carrousel média : suivant / précédent / points, extrémités désactivées", async () => {
    const page = await open();
    for (const id of ["slides000001", "tcar00000001", "mcar00000001"]) {
      const root = n(id);
      const st = () => page.evaluate((sel) => { const d = [...document.querySelectorAll(`${sel} .kw-carousel-dot`)]; return { dot: d.findIndex((x) => x.getAttribute("aria-current") === "true"), prev: document.querySelector(`${sel} .is-prev`).disabled, next: document.querySelector(`${sel} .is-next`).disabled, n: d.length }; }, root);
      assert.deepEqual(await st(), { dot: 0, prev: true, next: false, n: 2 }, `${id} : départ`);
      await page.locator(`${root} .is-next`).click(); await page.waitForTimeout(700);
      assert.deepEqual(await st(), { dot: 1, prev: false, next: true, n: 2 }, `${id} : suivant`);
      await page.locator(`${root} .is-prev`).click(); await page.waitForTimeout(700);
      assert.equal((await st()).dot, 0, `${id} : précédent`);
      await page.locator(`${root} .kw-carousel-dot`).nth(1).click(); await page.waitForTimeout(700);
      assert.equal((await st()).dot, 1, `${id} : point 2`);
    }
    await page.close();
  });

  test("titre animé : le mot change tout seul ; le texte complet reste lisible pour les lecteurs d'écran", async () => {
    const page = await open();
    const word = () => page.locator(`${n("animh0000001")} .kw-rotate`).innerText();
    const seen = new Set([await word()]);
    for (let i = 0; i < 6; i++) { await page.waitForTimeout(700); seen.add(await word()); }
    assert.ok(seen.size >= 2, `le mot ne change pas : ${[...seen].join(", ")}`);
    assert.match(await page.locator(`${n("animh0000001")} .sr-only`).innerText(), /Apprenez/);
    await page.close();
  });

  test("boutons de partage : liens https sûrs, ouverts dans un nouvel onglet sans fuite (noopener), avec un nom par réseau", async () => {
    const page = await open();
    const links = await page.locator(`${n("share0000001")} a`).evaluateAll((a) => a.map((x) => ({ href: x.href, rel: x.rel, target: x.target, name: x.getAttribute("aria-label") })));
    assert.equal(links.length, 4);
    for (const l of links) { assert.match(l.href, /^https:\/\//); assert.equal(l.target, "_blank"); assert.match(l.rel, /noopener/); assert.ok(l.name, "nom accessible"); assert.ok(decodeURIComponent(l.href).includes("/p/"), "partage l'adresse de la page"); }
    await page.close();
  });

  test("ancre de menu : le lien « #tarifs » fait défiler jusqu'à l'ancre, une seule cible dans la page", async () => {
    const page = await open();
    assert.equal(await page.locator("#tarifs").count(), 1);
    await page.locator(`${n("toanch000001")}`).first().click(); await page.waitForTimeout(800);
    assert.match(page.url(), /#tarifs$/);
    const top = await page.evaluate(() => Math.round(document.getElementById("tarifs").getBoundingClientRect().top));
    assert.ok(top >= -2 && top < 400, `l'ancre est en haut de l'écran (top ${top})`);
    await page.close();
  });

  test("barre de lecture : son remplissage grandit avec le défilement, de 0 % à 100 %", async () => {
    const page = await open();
    // le remplissage se mesure à sa largeur réellement dessinée (la barre peut s'étendre par largeur ou par échelle)
    const w = () => page.locator(`${n("readp0000001")} .kw-readbar-fill`).evaluate((e) => e.getBoundingClientRect().width / e.parentElement.getBoundingClientRect().width);
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
    const a = await w();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(500);
    const b = await w();
    assert.ok(a < 0.05, `0 % en haut de page (${a})`); assert.ok(b > 0.95, `100 % en bas de page (${b})`);
    await page.close();
  });

  test("aucune erreur de script pendant tous ces parcours", () => { assert.deepEqual(errors, []); });
});
