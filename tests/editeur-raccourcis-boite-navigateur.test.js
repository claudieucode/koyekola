// Éditeur — boîte de dialogue « Raccourcis clavier » : liste INCHANGÉE (20 raccourcis, même ordre), en-tête / liste / pied, touches en pastilles,
// alignement en grille, fermeture (×, Échap, fond, bouton), focus (piège, retour), thème, écrans étroits, mouvement réduit, aucune incidence
// sur le canevas, la structure et les raccourcis eux-mêmes. Chrome réel, vrai serveur.
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
async function until(check, { timeout = 8000, every = 50, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
  { id: "head00000001", type: "heading", props: { text: "Titre", level: 2 } },
] }] }] };
// La liste d'origine (avant la refonte de la boîte), dans l'ordre : rien ne doit être perdu, ajouté, ni modifié
const ORIGINAL = [["Ctrl/⌘ + S", "Enregistrer"], ["Ctrl/⌘ + Z / Maj + Z", "Annuler / rétablir"], ["Ctrl/⌘ + K", "Commandes et recherche"], ["Ctrl/⌘ + Maj + Y", "Afficher / masquer le panneau Structure"], ["Ctrl/⌘ + Maj + E", "Éditeur visuel / Éditeur en blocs"], ["Ctrl/⌘ + C / X / V", "Copier, couper, coller"], ["Ctrl/⌘ + Alt + C / V", "Copier / coller le style"], ["Ctrl/⌘ + Maj + V", "Coller le style (fusion : les autres réglages de la cible sont conservés)"], ["Ctrl/⌘ + D", "Dupliquer"], ["Suppr", "Supprimer"], ["Ctrl/⌘ + G / Maj + G", "Grouper / dissocier"], ["Ctrl/⌘ + Maj + H / L", "Masquer / verrouiller"], ["Alt + ↑ / ↓", "Monter / descendre"], ["Entrée", "Écrire dans le texte sélectionné"], ["Échap", "Désélectionner"], ["Ctrl/⌘ + + / − / 0", "Zoom"], ["Maj + 1", "Ajuster à l'écran"], ["R", "Règles"], ["V / H", "Sélection / main"], ["T / I / B", "Ajouter un texte, une image, un bouton"]];
const CONTRAST = `(a, b) => { const p = (c) => c.match(/[\\d.]+/g).slice(0, 3).map(Number); const L = (c) => { const v = p(c).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; }; const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }`;

describe("boîte « Raccourcis clavier » (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors;
  const dlg = () => page.locator("[data-pb-shortcuts]");
  const isOpen = () => page.evaluate(() => document.querySelector("[data-pb-shortcuts]").open);
  const openViaMenu = async () => { await page.locator("[data-pb-mainmenu]").click(); await page.locator(".pb-menu:not([hidden]) .pb-menu-item", { hasText: /^Raccourcis clavier/ }).first().click(); await until(isOpen, { what: "boîte ouverte" }); await wait(250); };
  const gone = async () => { await until(async () => !(await isOpen()), { what: "boîte fermée" }); await wait(250); assert.equal(await page.evaluate(() => document.querySelectorAll("dialog:modal").length), 0, "aucune boîte modale restante"); assert.equal(await page.evaluate(() => document.querySelectorAll("[inert]").length), 0, "rien n'est resté inerte (aucun overlay fantôme)"); };
  const contrast = (a, b) => page.evaluate(`(${CONTRAST})(${JSON.stringify(a)}, ${JSON.stringify(b)})`);
  // état du canevas, du défilement et de la structure : doit être strictement identique avant / après
  const world = () => page.evaluate(() => { const f = document.querySelector("[data-pb-frame]"), r = f.getBoundingClientRect(), w = document.querySelector("[data-pb-frame-wrap]").getBoundingClientRect(), tree = document.querySelector("[data-pb-layers]");
    return JSON.stringify({ frame: [r.left, r.top, r.width, r.height], wrap: [w.left, w.top, w.width, w.height], sy: f.contentWindow.scrollY, nodes: f.contentDocument.querySelectorAll("[data-node-id]").length, tree: tree.querySelectorAll(".pb-node").length, treeHtml: tree.innerHTML.length, insp: document.querySelector("[data-pb-inspector]").children.length }); });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const pageId = Number((await boss.post("/marketing/pages", { name: "Raccourcis" })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: CONTENT }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(500);
    await page.locator('[data-pb-layers] .pb-node[data-id="head00000001"] > .pb-row-item').click(); await wait(300);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("contenu : les 20 raccourcis, même ordre, mêmes touches et mêmes descriptions ; regroupés sans changer l'ordre ; structure en-tête / liste / pied accessible", async () => {
    await openViaMenu();
    const rows = await page.evaluate(() => [...document.querySelectorAll("[data-pb-shortcuts] .pb-sc-list dt")].map((dt) => [[...dt.childNodes].map((n) => n.dataset && n.dataset.k ? n.dataset.k : n.textContent).join(" ").replace(/\s+/g, " ").trim(), dt.nextElementSibling.textContent.trim()]));
    assert.deepEqual(rows, ORIGINAL, "liste fonctionnelle strictement conservée");
    assert.ok((await dlg().locator("section.pb-sc-group").count()) >= 4, "groupes");
    const titles = await dlg().locator(".pb-sc-group h3").allInnerTexts(); assert.ok(titles.length >= 4);
    // chaque touche est une pastille <kbd>, les « + » et « / » entre deux touches sont des séparateurs ; la touche « + » du zoom reste une touche
    const zoom = await page.evaluate(() => { const dt = [...document.querySelectorAll("[data-pb-shortcuts] .pb-sc-list dt")].find((d) => d.nextElementSibling.textContent === "Zoom"); return [...dt.children].map((c) => c.tagName + ":" + (c.dataset.k || c.textContent)).join("|"); });
    assert.equal(zoom, "KBD:Ctrl/⌘|SPAN:+|KBD:+|SPAN:/|KBD:−|SPAN:/|KBD:0");
    const a11y = await page.evaluate(() => { const d = document.querySelector("[data-pb-shortcuts]"); return { labelled: document.getElementById(d.getAttribute("aria-labelledby")).textContent, desc: document.getElementById(d.getAttribute("aria-describedby")).textContent, close: d.querySelector(".pb-sc-close").getAttribute("aria-label"), icon: Boolean(d.querySelector(".pb-sc-head svg")), x: Boolean(d.querySelector(".pb-sc-close svg")), foot: d.querySelector(".pb-sc-foot").textContent, modal: d.matches(":modal"), role: d.getAttribute("role"), ariaModal: d.getAttribute("aria-modal") }; });
    assert.equal(a11y.labelled, "Raccourcis clavier"); assert.match(a11y.desc, /Commandes disponibles dans l’éditeur/); assert.equal(a11y.close, "Fermer les raccourcis clavier"); assert.equal(a11y.role, "dialog"); assert.equal(a11y.ariaModal, "true"); assert.ok(a11y.icon && a11y.x, "icônes du système (SVG), pas de caractère ×"); assert.match(a11y.foot, /Échap/); assert.equal(a11y.modal, true);
    await page.keyboard.press("Escape"); await gone();
  });

  test("mise en page : touches et actions alignées par une vraie grille, pastilles compactes, liste défilante, bouton × compact et confortable", async () => {
    await openViaMenu();
    const g = await page.evaluate(() => { const d = document.querySelector("[data-pb-shortcuts]"), q = (s) => [...d.querySelectorAll(s)];
      const dtX = new Set(q(".pb-sc-list dt").map((e) => Math.round(e.getBoundingClientRect().left))), ddX = new Set(q(".pb-sc-list dd").map((e) => Math.round(e.getBoundingClientRect().left)));
      const key = d.querySelector(".pb-key").getBoundingClientRect(), x = d.querySelector(".pb-sc-close").getBoundingClientRect(), body = d.querySelector(".pb-sc-body"), r = d.getBoundingClientRect();
      const t = d.querySelector("h2").getBoundingClientRect(), xb = d.querySelector(".pb-sc-close").getBoundingClientRect();
      return { dtX: [...dtX], ddX: [...ddX], keyH: key.height, xW: x.width, xH: x.height, scroll: body.scrollHeight > body.clientHeight, w: r.width, h: r.height, ih: innerHeight, overflowX: body.scrollWidth - body.clientWidth, centered: Math.abs((t.top + t.height / 2) - (xb.top + xb.height / 2)) < 14, radius: parseFloat(getComputedStyle(d).borderTopLeftRadius), overscroll: getComputedStyle(body).overscrollBehaviorY }; });
    assert.equal(g.dtX.length, 1, `colonne des touches alignée (${g.dtX})`); assert.equal(g.ddX.length, 1, `colonne des actions alignée (${g.ddX})`);
    assert.ok(g.keyH >= 20 && g.keyH <= 24, `pastille compacte (${g.keyH})`); assert.ok(g.xW >= 28 && g.xW <= 34 && g.xH >= 28 && g.xH <= 34, `× ${g.xW}×${g.xH}`);
    assert.equal(g.scroll, true, "la liste défile dans la boîte"); assert.ok(g.w <= 700 && g.h <= g.ih - 24, "dimensions raisonnables"); assert.equal(g.overflowX, 0); assert.ok(g.centered, "× aligné avec le titre"); assert.ok(g.radius <= 10); assert.equal(g.overscroll, "contain");
    // défiler la liste ne fait pas défiler le canevas derrière
    const y0 = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentWindow.scrollY);
    await dlg().locator(".pb-sc-body").hover(); await page.mouse.wheel(0, 600); await wait(250);
    assert.ok(await dlg().locator(".pb-sc-body").evaluate((e) => e.scrollTop) > 0, "la liste a défilé");
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-frame]").contentWindow.scrollY), y0, "le canevas n'a pas bougé");
    await page.keyboard.press("Escape"); await gone();
  });

  test("fermeture : ×, Échap, clic sur le fond, bouton Fermer — sans overlay restant ; canevas, défilement, structure et inspecteur strictement inchangés ; focus rendu au menu", async () => {
    const before = await world();
    const closers = [["×", () => dlg().locator(".pb-sc-close").click()], ["Échap", () => page.keyboard.press("Escape")], ["fond", () => page.mouse.click(20, 900)], ["bouton Fermer", () => dlg().locator(".pb-sc-foot .btn").click()]];
    for (const [nom, fn] of closers) {
      await openViaMenu();
      assert.equal(await world(), before, `${nom} : ouvrir ne déplace rien`);
      await fn(); await gone();
      assert.equal(await world(), before, `${nom} : fermer ne déplace rien`);
      assert.equal(await page.evaluate(() => document.activeElement === document.querySelector("[data-pb-mainmenu]")), true, `${nom} : focus rendu au bouton du menu`);
    }
    // un clic DANS la boîte ne la ferme pas
    await openViaMenu(); await dlg().locator("h2").click(); await wait(150); assert.equal(await isOpen(), true); await page.keyboard.press("Escape"); await gone();
    assert.deepEqual(errors, []);
  });

  test("clavier : le focus entre dans la boîte, Tab / Maj+Tab y restent (piège natif), le focus est visible ; les raccourcis fonctionnent toujours après fermeture", async () => {
    await openViaMenu();
    const inside = () => page.evaluate(() => document.querySelector("[data-pb-shortcuts]").contains(document.activeElement));
    assert.equal(await inside(), true, "focus dans la boîte à l'ouverture");
    assert.equal(await page.evaluate(() => document.activeElement.matches("[data-sc-search]")), true, "le focus arrive directement dans la recherche");
    for (let i = 0; i < 6; i++) { await page.keyboard.press("Tab"); assert.equal(await inside(), true, `Tab ${i}`); }
    for (let i = 0; i < 6; i++) { await page.keyboard.press("Shift+Tab"); assert.equal(await inside(), true, `Maj+Tab ${i}`); }
    await dlg().locator(".pb-sc-close").focus();
    assert.notEqual(await dlg().locator(".pb-sc-close").evaluate((e) => getComputedStyle(e).boxShadow), "none", "focus visible sur ×");
    await page.keyboard.press("Enter"); await gone();
    // Ctrl+D (dupliquer) agit toujours sur l'élément sélectionné
    await page.locator('[data-pb-layers] .pb-node[data-id="head00000001"] > .pb-row-item').click(); await wait(300);
    const n0 = await page.evaluate(() => document.querySelectorAll("[data-pb-layers] .pb-node").length);
    await page.keyboard.press("Control+d");
    await until(async () => (await page.evaluate(() => document.querySelectorAll("[data-pb-layers] .pb-node").length)) === n0 + 1, { what: "Ctrl+D duplique" });
    await page.keyboard.press("Control+z"); await until(async () => (await page.evaluate(() => document.querySelectorAll("[data-pb-layers] .pb-node").length)) === n0, { what: "Ctrl+Z annule" });
  });

  test("thème : surface, texte, accent suivent les jetons --editor-* (clair, sombre, Navy, accent personnalisé), textes ≥ 4,5:1", async () => {
    await openViaMenu();
    for (const t of [{ nom: "clair", skin: "classic", dark: false }, { nom: "sombre", skin: "classic", dark: true }, { nom: "navy", skin: "navy", dark: true }, { nom: "accent orange", skin: "classic", dark: false, accent: "#c2410c", text: "#9a3412" }]) {
      await page.evaluate((x) => { const b = document.body; b.dataset.skin = x.skin; if (x.dark) b.dataset.palette = "dark"; else delete b.dataset.palette; ["--editor-accent", "--editor-accent-text"].forEach((k) => b.style.removeProperty(k)); if (x.accent) { b.style.setProperty("--editor-accent", x.accent); b.style.setProperty("--editor-accent-text", x.text); } }, t);
      await wait(200);
      const c = await page.evaluate(() => { const d = document.querySelector("[data-pb-shortcuts]"), cs = (s, p = "color") => getComputedStyle(d.querySelector(s))[p], tok = getComputedStyle(document.body);
        const probe = document.createElement("i"); probe.style.background = tok.getPropertyValue("--editor-card"); document.body.appendChild(probe); const card = getComputedStyle(probe).backgroundColor; probe.style.background = tok.getPropertyValue("--editor-accent-text"); const acc = getComputedStyle(probe).color === "" ? "" : getComputedStyle(probe).backgroundColor; probe.remove();
        return { bg: cs("h2", "backgroundColor") && getComputedStyle(d).backgroundColor, card, acc, title: cs("h2"), sub: cs(".pb-sc-titles p"), h3: cs("h3"), dd: cs("dd"), key: cs(".pb-key"), keyBg: cs(".pb-key", "backgroundColor"), icon: cs(".pb-sc-icon"), iconBg: cs(".pb-sc-icon", "backgroundColor"), hint: cs(".pb-sc-hint") }; });
      assert.equal(c.bg, c.card, `${t.nom} : surface = --editor-card`);
      if (t.accent) assert.equal(c.icon, c.acc, `${t.nom} : icône = accent du thème`);
      for (const [k, back] of [["title", c.bg], ["sub", c.bg], ["h3", c.bg], ["dd", c.bg], ["key", c.keyBg], ["hint", c.bg]]) assert.ok((await contrast(c[k], back)) >= 4.5, `${t.nom} : « ${k} » lisible (${(await contrast(c[k], back)).toFixed(2)}:1)`);
    }
    await page.evaluate(() => { const b = document.body; b.dataset.skin = "classic"; delete b.dataset.palette; b.style.removeProperty("--editor-accent"); b.style.removeProperty("--editor-accent-text"); });
    await page.keyboard.press("Escape"); await gone();
  });

  test("écrans étroits : entièrement visible, × accessible, sans défilement horizontal, une colonne sous 520 px, liste défilante", async () => {
    for (const [w, h, stacked] of [[1920, 1080, false], [1440, 900, false], [1280, 720, false], [1024, 768, false], [768, 1024, false], [480, 800, true], [375, 667, true]]) {
      await page.setViewportSize({ width: w, height: h }); await wait(350); await openViaMenu();
      const v = await page.evaluate(() => { const d = document.querySelector("[data-pb-shortcuts]"), r = d.getBoundingClientRect(), x = d.querySelector(".pb-sc-close").getBoundingClientRect(), b = d.querySelector(".pb-sc-body"), dt = d.querySelector(".pb-sc-list dt").getBoundingClientRect(), dd = d.querySelector(".pb-sc-list dd").getBoundingClientRect();
        return { l: r.left, r: r.right, t: r.top, bt: r.bottom, iw: innerWidth, ih: innerHeight, xin: x.left >= r.left && x.right <= r.right && x.top >= r.top, ox: b.scrollWidth - b.clientWidth, sc: b.scrollHeight > b.clientHeight, stacked: Math.abs(dt.left - dd.left) < 2 && dd.top >= dt.bottom - 1, side: dd.left > dt.right - 1 }; });
      assert.ok(v.l >= 0 && v.r <= v.iw && v.t >= 0 && v.bt <= v.ih, `${w} px : entièrement visible`); assert.ok(v.xin, `${w} px : × dans la boîte`); assert.equal(v.ox, 0, `${w} px : pas de défilement horizontal`); assert.ok(v.sc, `${w} px : liste défilante`);
      assert.equal(v.stacked, stacked, `${w} px : ${stacked ? "touches au-dessus de l'action" : "deux colonnes"}`);
      await page.keyboard.press("Escape"); await gone();
    }
    await page.setViewportSize({ width: 1600, height: 950 }); await wait(300);
    assert.deepEqual(errors, []);
  });

  test("animation, mouvement réduit, ouvertures répétées : pas de remontage, pas de résidu, pas d'erreur", async () => {
    await openViaMenu();
    assert.equal(await dlg().evaluate((d) => getComputedStyle(d).animationName), "kol-scale-in", "micro-animation commune des fenêtres de l'éditeur"); assert.ok(await dlg().evaluate((d) => parseFloat(getComputedStyle(d).animationDuration)) > 0);
    await page.keyboard.press("Escape"); await gone();
    await page.emulateMedia({ reducedMotion: "reduce" }); await openViaMenu();
    assert.ok(await dlg().evaluate((d) => parseFloat(getComputedStyle(d).animationDuration)) < 0.001, "mouvement réduit : durée d'animation quasi nulle (jetons à 0 ms)");
    await page.keyboard.press("Escape"); await gone(); await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.evaluate(() => { const d = document.querySelector("[data-pb-shortcuts]"); d.__garde = 1; window.__n = document.body.children.length; });
    const before = await world();
    for (let i = 0; i < 8; i++) { await openViaMenu(); await (i % 2 ? page.keyboard.press("Escape") : dlg().locator(".pb-sc-close").click()); await gone(); }
    assert.equal(await page.evaluate(() => !!document.querySelector("[data-pb-shortcuts]").__garde && document.body.children.length === window.__n), true, "même élément, aucun nœud ajouté (pas de remontage)");
    assert.equal(await world(), before);
    assert.deepEqual(errors, []);
  });

  test("recherche : instantanée, par action, par touche (« ctrl », « cmd », « ⌘ »), accents et casse ignorés, catégories vides masquées, surlignage discret, état vide, remise à zéro à la fermeture", async () => {
    await openViaMenu();
    const visible = () => page.evaluate(() => [...document.querySelectorAll("[data-pb-shortcuts] dd")].filter((d) => !d.hidden).map((d) => d.textContent));
    const groups = () => page.evaluate(() => [...document.querySelectorAll("[data-pb-shortcuts] .pb-sc-group")].filter((g) => !g.hidden).map((g) => g.querySelector("h3").textContent));
    const type = async (q) => { await dlg().locator("[data-sc-search]").fill(q); await wait(60); };
    assert.equal((await visible()).length, 20);
    await type("enregistrer"); assert.deepEqual(await visible(), ["Enregistrer"]); assert.deepEqual(await groups(), ["Général"], "les catégories sans résultat disparaissent");
    await type("ZOOM"); assert.deepEqual(await visible(), ["Zoom"]);
    await type("copier"); assert.deepEqual(await visible(), ["Copier, couper, coller", "Copier / coller le style"]);
    await type("echap"); assert.deepEqual(await visible(), ["Désélectionner"], "recherche par nom de touche, sans accent");
    const ctrl = await (async () => { await type("ctrl"); return visible(); })(); assert.equal(ctrl.length, ORIGINAL.filter((k) => k[0].includes("Ctrl/⌘")).length, "« ctrl » : tous les raccourcis qui utilisent Ctrl/⌘, et eux seuls"); assert.ok(ctrl.includes("Enregistrer") && !ctrl.includes("Règles"));
    await type("cmd"); assert.deepEqual(await visible(), ctrl, "« cmd » = « ctrl » (même touche)");
    await type("⌘"); assert.deepEqual(await visible(), ctrl);
    await type("maj z"); assert.deepEqual(await visible(), ["Annuler / rétablir"], "plusieurs mots : tous doivent correspondre");
    await type("enreg"); assert.equal(await dlg().locator("dd mark").first().textContent(), "Enreg", "surlignage de la partie trouvée");
    assert.match(await dlg().locator("[data-sc-status]").textContent(), /1 raccourci trouvé/);
    await type("zzzz");
    assert.equal((await visible()).length, 0); assert.equal(await dlg().locator("[data-sc-empty]").isVisible(), true);
    assert.match(await dlg().locator("[data-sc-empty]").innerText(), /Aucun raccourci trouvé[\s\S]*Essayez un autre terme\./);
    assert.equal(await dlg().locator(".pb-sc-cols").isVisible(), false);
    await page.keyboard.press("Escape"); await gone();
    await openViaMenu();
    assert.equal(await dlg().locator("[data-sc-search]").inputValue(), "", "recherche remise à zéro"); assert.equal((await visible()).length, 20);
    assert.equal(await page.evaluate(() => document.querySelectorAll("[data-pb-shortcuts] mark").length), 0);
    await page.keyboard.press("Escape"); await gone();
  });

  test("Ctrl/⌘ + K : boîte ouverte = place le curseur dans la recherche (la palette de commandes ne s'ouvre pas) ; boîte fermée = palette de commandes inchangée", async () => {
    await openViaMenu();
    await dlg().locator(".pb-sc-close").focus();
    await page.keyboard.press("Control+k");
    assert.equal(await page.evaluate(() => document.activeElement.matches("[data-sc-search]")), true, "focus dans la recherche");
    assert.equal(await page.evaluate(() => { const c = document.querySelector("[data-pb-command-dialog]"); return c ? c.open : false; }), false, "la palette ne s'ouvre pas par-dessus");
    await page.keyboard.press("Escape"); await gone();
    await page.keyboard.press("Control+k");
    await until(() => page.evaluate(() => { const c = document.querySelector("[data-pb-command-dialog]"); return c && c.open; }), { what: "palette ouverte quand la boîte est fermée" });
    await page.keyboard.press("Escape"); await wait(300);
  });

  test("plateforme : ⌘ ⌥ ⇧ sur Mac, Ctrl Alt Maj sur Windows / Linux ; recherche valable dans les deux cas ; aucune requête réseau, aucune erreur à l'ouverture", async () => {
    for (const [plat, expectKeys] of [["MacIntel", ["⌘", "⌥", "⇧"]], ["Win32", ["Ctrl", "Alt", "Maj"]]]) {
      const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 } });
      await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
      await ctx.addInitScript((pl) => { Object.defineProperty(Navigator.prototype, "platform", { get: () => pl }); Object.defineProperty(Navigator.prototype, "userAgentData", { get: () => undefined }); }, plat);
      const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message)); pg.on("console", (m) => { if (m.type() === "error" && !/favicon/.test(m.text())) errs.push(m.text()); });
      await pg.goto(page.url());
      await pg.waitForFunction(() => document.querySelector("[data-pb-frame]") && document.querySelector("[data-pb-frame]").contentDocument && document.querySelector("[data-pb-frame]").contentDocument.querySelector("[data-node-id]"));
      await wait(500);
      const reqs = []; pg.on("request", (r) => reqs.push(r.url()));
      const t0 = Date.now();
      await pg.evaluate(() => document.querySelector("[data-pb-shortcuts]").showModal());
      const open = await pg.evaluate(() => document.querySelector("[data-pb-shortcuts]").open); const dt = Date.now() - t0;
      assert.equal(open, true); assert.ok(dt < 1500, `ouverture rapide (${dt} ms, hors chargement)`);
      const keys = await pg.evaluate(() => [...new Set([...document.querySelectorAll("[data-pb-shortcuts] dt .pb-key")].map((k) => k.textContent))]);
      for (const k of expectKeys) assert.ok(keys.includes(k), `${plat} : touche « ${k} » affichée`);
      const wrong = plat === "MacIntel" ? ["Ctrl", "Alt", "Maj"] : ["⌘", "⌥", "⇧"]; for (const k of wrong) assert.ok(!keys.includes(k), `${plat} : « ${k} » absent`);
      await pg.locator("[data-sc-search]").fill("enregistrer"); await wait(60);
      assert.equal(await pg.evaluate(() => [...document.querySelectorAll("[data-pb-shortcuts] dd")].filter((d) => !d.hidden).length), 1);
      assert.deepEqual(reqs, [], "aucune requête réseau pour afficher ou chercher");
      assert.deepEqual(errs, [], "aucune erreur console");
      await ctx.close();
    }
  });
});
