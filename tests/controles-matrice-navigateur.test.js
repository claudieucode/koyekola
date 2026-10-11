// Matrice des contrôles de style dans un VRAI navigateur : chaque réglage de l'inspecteur est piloté comme une personne le ferait
// (liste déroulante, boutons à icônes, champ numérique, nuancier), puis relu à quatre endroits :
//   1. le document enregistré (valeur validée par le serveur, SANS toucher aux autres réglages de l'élément) ;
//   2. le canevas (style calculé réel de l'élément dans l'iframe) ;
//   3. la page publiée (déclaration CSS générée) ;
//   4. l'état « vide » : effacer rend l'héritage (la clé disparaît du document).
// Les contrôles sont découverts dans l'inspecteur réel (attribut data-prop) puis rapprochés de STYLE_PROPS (la source de vérité du
// serveur) : un réglage du modèle sans aucun contrôle accessible, ou un contrôle sans propriété, fait échouer le test.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { STYLE_PROPS } = require("../src/marketing/pages/nodes");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : matrice des contrôles non exécutée sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 12000, every = 80, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}
const camel = (css) => css.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
// Bornes des nombres SANS unité, déduites du validateur du serveur lui-même (jamais recopiées à la main)
const { editorSpec } = require("../src/marketing/pages/nodes");
const NUMBER_KEYS = new Set(editorSpec().styleProps.filter((p) => p.kind === "number").map((p) => p.key));
const CANDIDATES = [-9999, -360, -100, -60, -20, -1, 0, 0.1, 0.5, 0.8, 1, 2, 3, 5, 6, 10, 12, 13, 20, 40, 300, 2000, 9999];
const boundsOf = (key) => { const ok = CANDIDATES.filter((v) => STYLE_PROPS[key].check(String(v)) !== null); return { min: Math.min(...ok), max: Math.max(...ok) }; };
const STRICT_INT = new Set([...NUMBER_KEYS].filter((k) => STYLE_PROPS[k].check("1.5") === null && boundsOf(k).max > 1.5));

// Éléments de la page d'essai : une grille (bordure, contour et fond image visibles : leurs réglages ne s'affichent qu'alors) avec des
// enfants de chaque famille, et un conteneur flex (réglages d'enfant de flex).
const NODES = {
  grid: "box000000001", head: "hed000000001", text: "txt000000001", button: "btn000000001", image: "img000000001", flex: "fbx000000001", flexChild: "fch000000001",
};
const content = () => ({ title: "Matrice", sections: [{ id: "sect00000001", type: "layout", children: [
  { id: NODES.grid, type: "container", props: {}, styles: { desktop: { display: "grid", borderStyle: "solid", outlineStyle: "solid", backgroundImage: { src: "https://example.com/fond.jpg" } } }, children: [
    { id: NODES.head, type: "heading", props: { text: "Un titre", level: "2" }, styles: { desktop: { backgroundColor: "#eeeeee" } } },
    { id: NODES.text, type: "text", props: { text: "Un paragraphe" } },
    { id: NODES.button, type: "button", props: { label: "Cliquer", url: "/catalogue", variant: "primary" } },
    { id: NODES.image, type: "image", props: { src: "https://example.com/a.jpg", alt: "a" } },
  ] },
  { id: NODES.flex, type: "container", props: {}, styles: { desktop: { display: "flex" } }, children: [
    { id: NODES.flexChild, type: "text", props: { text: "Enfant flex" } },
  ] },
] }] });

// Valeur d'essai valide par propriété numérique / longueur (jamais la même que la valeur par défaut)
const SAMPLE = {
  num: { lineHeight: "1.6", opacity: "0.4", zIndex: "7", columns: "3", flexGrow: "2", flexShrink: "1", order: "3", gridRows: "2", gridColumnSpan: "2", gridRowSpan: "2", gridColumnStart: "2", gridColumnEnd: "4", gridRowStart: "2", gridRowEnd: "3", backdropBlur: "6", transitionDuration: "300", columnCount: "2", lineClamp: "3" },
  len: "12",
};

describe("matrice des contrôles de style (inspecteur réel, Chrome)", { skip: SKIP }, () => {
  let srv, boss, browser, page, errors, id;
  const row = () => srv.db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const find = (nodes, nid) => { for (const n of nodes || []) { if (n.id === nid) return n; const f = find(n.children, nid); if (f) return f; } return null; };
  // Où lire les réglages : l'écran (styles.desktop / tablet / mobile / wide) ou l'état (states.hover…) actuellement édité
  let scope = { bag: "styles", name: "desktop" };
  const styleOf = (nid) => (((find(JSON.parse(row().draft).sections, nid) || {})[scope.bag]) || {})[scope.name] || {};
  const frameEval = (fn, arg) => page.evaluate(({ src, arg }) => { const f = document.querySelector("[data-pb-frame]"); return (0, eval)("(" + src + ")")(f.contentDocument, f.contentWindow, arg); }, { src: fn.toString(), arg });
  const computed = (nid, css) => frameEval((d, w, a) => { const e = d.querySelector(`[data-node-id="${a.nid}"]`); return e ? w.getComputedStyle(e).getPropertyValue(a.css) : null; }, { nid, css });
  // Règle CSS générée pour l'élément (même générateur que la page publiée) lue dans les feuilles de style du canevas
  const canvasRule = (nid) => frameEval((d, w, a) => [...d.querySelectorAll("style")].map((s) => s.textContent).join("\n").split("}").filter((r) => r.includes(`.kw-n-${a.nid}{`) && !r.includes("@media")).map((r) => r.slice(r.indexOf("{") + 1)).join(";"), { nid });
  // Page publiée : publier ENFIN (publier vide le brouillon et change la révision : à ne faire qu'en fin de parcours)
  const publishedRule = async (nid) => {
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    const html = (await boss.get(`/p/${row().slug}`)).text;
    const m = html.match(new RegExp(`\\.kw-n-${nid}\\{([^}]*)\\}`));
    return m ? m[1] : "";
  };

  const openEditor = async () => {
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 20000 });
    await wait(600);
  };
  const select = async (nid) => { await page.locator(`[data-pb-layers] .pb-node[data-id="${nid}"] > .pb-row-item`).click(); await wait(250); };
  // Ouvre toutes les sections de tous les onglets et renvoie, pour chaque réglage, l'onglet où il se trouve
  // Les sections ne se remplissent qu'à leur ouverture : ouvrir, attendre, rouvrir (sections imbriquées)
  const openAll = async () => { for (let i = 0; i < 2; i++) { await page.$$eval("[data-pb-inspector] details", (ds) => ds.forEach((d) => { d.open = true; })); await wait(220); } };
  const discover = async () => {
    const found = {};
    const tabs = await page.$$eval("[data-pb-inspector] [role=tab]", (e) => e.map((t) => t.textContent));
    for (const t of tabs) {
      await page.locator("[data-pb-inspector] [role=tab]", { hasText: new RegExp(`^${t}$`) }).click(); await wait(120);
      await openAll();
      for (const p of await page.$$eval("[data-pb-inspector] .pb-prop[data-prop]", (els) => els.map((e) => e.getAttribute("data-prop")))) if (!found[p]) found[p] = t;
    }
    return found;
  };
  const goTab = async (t) => { await page.locator("[data-pb-inspector] [role=tab]", { hasText: new RegExp(`^${t}$`) }).click(); await wait(100); await openAll(); };
  const prop = (key) => page.locator(`[data-pb-inspector] .pb-prop[data-prop="${key}"]`).first();

  // Types de contrôle rencontrés, par propriété et par élément : sert de rapport d'inventaire
  const inventory = {};
  const problems = [];

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    id = Number((await boss.post("/marketing/pages", { name: "Matrice contrôles", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: row().revision, content: content() } });
    assert.equal(r.status, 200, r.text);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await openEditor();
  });
  after(async () => {
    if (process.env.MATRICE_SORTIE) fs.writeFileSync(process.env.MATRICE_SORTIE, JSON.stringify({ inventory, problems }, null, 1));
    if (browser) await browser.close(); if (srv) await srv.stop();
  });

  // Pilote UN réglage ; renvoie une description de ce qui a été vérifié
  async function drive(nid, key, tab) {
    const p = STYLE_PROPS[key];
    await goTab(tab);
    const r = prop(key);
    const before = { ...styleOf(nid) };
    const unchanged = (except) => { const now = styleOf(nid); for (const k of new Set([...Object.keys(before), ...Object.keys(now)])) if (k !== except) assert.deepEqual(now[k], before[k], `${key} : le réglage « ${k} » a changé alors qu'on ne touchait qu'à « ${key} »`); };
    const tag = `${nid}/${key}`;
    const checkOutput = async (value, expectCss) => {
      if (scope.bag !== "styles" || scope.name !== "desktop") return; // les règles d'écran et d'état sont vérifiées par controles-coherence.test.js
      const css = await canvasRule(nid);
      // Placement dans la grille : début / fin / occupées s'écrivent en UNE déclaration « grid-column: début / fin » (jamais des déclarations qui s'écrasent)
      const axis = { gridColumnStart: "Column", gridColumnEnd: "Column", gridColumnSpan: "Column", gridRowStart: "Row", gridRowEnd: "Row", gridRowSpan: "Row" }[key];
      if (axis) {
        const st = styleOf(nid), start = st[`grid${axis}Start`], end = st[`grid${axis}End`], span = st[`grid${axis}Span`], prop = axis === "Column" ? "grid-column" : "grid-row";
        const expected = start !== undefined || end !== undefined ? `${prop}:${start ?? "auto"} / ${end !== undefined ? end : span !== undefined ? `span ${span}` : "auto"}` : `${prop}:span ${span}`;
        assert.ok(css.includes(expected), `${tag} : « ${expected} » absent du CSS généré (${css.slice(0, 200)})`);
        return;
      }
      const out = p.out ? p.out(value) : value;
      assert.ok(css.includes(`${p.css}:${out}`), `${tag} : « ${p.css}:${out} » absent du CSS généré (${css.slice(0, 200)})`);
      if (expectCss) {
        const c = await computed(nid, p.css);
        problems.push(...(c === null ? [`${tag} : élément absent du canevas`] : []));
      }
    };
    let kind = "?";
    const nSeg = await r.locator('button[role="radio"]').count();
    const selects = r.locator("select:not(.pb-len-unit)");
    const nSel = await selects.count();
    const num = r.locator("input.pb-len-num");
    const nNum = await num.count();
    const colorBtn = r.locator(".pb-color-btn");
    const nCol = await colorBtn.count();
    if (nSeg) {
      kind = "icônes";
      const values = await r.locator('button[role="radio"]').evaluateAll((bs) => bs.map((b) => b.dataset.value).filter(Boolean));
      assert.ok(values.length, `${tag} : boutons sans data-value`);
      for (const v of values) {
        await prop(key).locator(`button[role="radio"][data-value="${v}"]`).click();
        await until(() => styleOf(nid)[key] === p.check(v), { what: `${tag} = ${v}` });
        unchanged(key);
      }
      const last = values[values.length - 1];
      await checkOutput(p.check(last));
      await prop(key).locator(`button[role="radio"][data-value="${last}"]`).click(); // re-cliquer efface
      await until(() => styleOf(nid)[key] === undefined, { what: `${tag} effacé` });
      unchanged(key);
    } else if (nSel && !nNum) {
      kind = "liste";
      const opts = await selects.first().evaluate((s) => [...s.options].map((o) => o.value).filter(Boolean));
      assert.ok(opts.length, `${tag} : liste sans option`);
      for (const v of opts) {
        await selects.first().selectOption(v);
        await until(() => String(styleOf(nid)[key]) === String(p.check(v)), { what: `${tag} = ${v}` });
        unchanged(key);
      }
      await checkOutput(p.check(opts[opts.length - 1]));
      await prop(key).locator("select:not(.pb-len-unit)").first().selectOption("");
      await until(() => styleOf(nid)[key] === undefined, { what: `${tag} effacé` });
      unchanged(key);
    } else if (nNum) {
      kind = nSel ? "nombre+unité" : "nombre";
      const sample = SAMPLE.num[key] || SAMPLE.len;
      await num.first().fill(sample); await num.first().press("Enter");
      await until(() => styleOf(nid)[key] !== undefined, { what: `${tag} = ${sample}` });
      const saved = styleOf(nid)[key];
      assert.ok(String(saved).startsWith(String(Number(sample))), `${tag} : ${sample} saisi, ${saved} enregistré`);
      unchanged(key);
      await checkOutput(saved);
      // bornes du serveur (nombres sans unité) : le contrôle refuse ce qui est hors plage et accepte exactement les extrémités
      if (NUMBER_KEYS.has(key)) {
        const { min, max } = boundsOf(key);
        const field = () => prop(key).locator("input.pb-len-num").first();
        const typed = async (v) => { await field().fill(String(v)); await field().press("Enter"); await wait(450); };
        await typed(max + (Number.isInteger(max) ? 1 : 0.5)); // au-dessus du maximum du serveur
        assert.equal(styleOf(nid)[key], saved, `${tag} : ${max + 1} (au-dessus du maximum ${max}) n'est pas refusé par le contrôle`);
        await typed(min - 1);
        assert.equal(styleOf(nid)[key], saved, `${tag} : ${min - 1} (sous le minimum ${min}) n'est pas refusé par le contrôle`);
        if (STRICT_INT.has(key)) { await typed(Math.min(max, min + 1.5)); assert.equal(styleOf(nid)[key], saved, `${tag} : un nombre décimal est accepté alors que le serveur exige un entier`); }
        await typed(max);
        await until(() => String(styleOf(nid)[key]) === String(max), { what: `${tag} = maximum ${max}` });
        await typed(min);
        await until(() => String(styleOf(nid)[key]) === String(min), { what: `${tag} = minimum ${min}` });
        await typed(sample);
        await until(() => String(styleOf(nid)[key]) === String(saved), { what: `${tag} retour à ${sample}` });
      }
      // valeur invalide : refusée, rien ne change
      await prop(key).locator("input.pb-len-num").first().fill("abc"); await prop(key).locator("input.pb-len-num").first().press("Enter"); await wait(500);
      assert.equal(styleOf(nid)[key], saved, `${tag} : « abc » a modifié la valeur`);
      assert.ok(!/NaN|undefined/.test(JSON.stringify(styleOf(nid))), `${tag} : NaN / undefined enregistré`);
      // vide : efface (hérite)
      await prop(key).locator("input.pb-len-num").first().fill(""); await prop(key).locator("input.pb-len-num").first().press("Enter");
      await until(() => styleOf(nid)[key] === undefined, { what: `${tag} effacé par champ vide` });
      unchanged(key);
    } else if (nCol) {
      kind = "couleur";
      for (const hex of ["#12ab34", "#12ab3480"]) {
        await prop(key).locator(".pb-color-btn").first().click();
        const hexIn = page.locator(".pb-cpop-hex");
        await hexIn.fill(hex); await hexIn.press("Enter");
        await until(() => styleOf(nid)[key] === hex, { what: `${tag} = ${hex}` });
        unchanged(key);
        await page.keyboard.press("Escape"); await wait(150);
      }
      await checkOutput("#12ab3480");
      // jeton du site : la référence est conservée (pas remplacée par sa valeur)
      await prop(key).locator(".pb-color-btn").first().click();
      await page.locator('.pb-cpop-token[data-token="primary"]').click();
      await until(() => styleOf(nid)[key] === "token:primary", { what: `${tag} = jeton` });
      if (scope.name === "desktop" && scope.bag === "styles") assert.ok((await canvasRule(nid)).includes(`${p.css}:var(--kw-primary)`), `${tag} : la référence au jeton n'est pas écrite dans le CSS`);
      await page.keyboard.press("Escape"); await wait(150);
      await prop(key).locator(".pb-reset").first().click();
      await until(() => styleOf(nid)[key] === undefined, { what: `${tag} effacé par ↺` });
      unchanged(key);
    } else {
      kind = "autre";
    }
    return kind;
  }

  const TARGETS = [
    ["flexChild", "enfant d'un conteneur flex"], ["head", "titre"], ["button", "bouton"], ["image", "image"], ["grid", "conteneur grille"],
  ];
  for (const [name, label] of TARGETS) {
    test(`${label} : chaque réglage de l'inspecteur écrit la bonne propriété, sans toucher aux autres, et se retrouve dans le canevas et la page publiée`, { timeout: 900000 }, async () => {
      const nid = NODES[name];
      await select(nid);
      const found = await discover();
      // Les réglages posés par la fixture (display, bordure, contour) sont éprouvés en dernier : les effacer masque les réglages qui en dépendent
      const LAST = ["display", "borderStyle", "outlineStyle"];
      // La grille subit TOUS ses réglages ; les autres éléments rejouent les réglages pas encore vus + une série représentative de chaque
      // famille (un contrôle partagé est ainsi éprouvé dans plusieurs contextes). MATRICE_COMPLETE=1 : tout, partout (long : ~6 min par élément).
      const REP = ["fontSize", "fontWeight", "textAlign", "color", "backgroundColor", "opacity", "borderRadius", "borderWidth", "width", "lineHeight", "letterSpacing", "boxShadow", "zIndex", "alignSelf", "objectFit", "aspectRatio", "gap", "textTransform", "cursor", "transitionDuration"];
      const full = name === "grid" || Boolean(process.env.MATRICE_COMPLETE); // la grille passe EN DERNIER : ses réglages d'affichage effacés feraient disparaître ceux de ses enfants
      const keys = Object.keys(found).filter((k) => Object.hasOwn(STYLE_PROPS, k)).filter((k) => !process.env.MATRICE_CLES || process.env.MATRICE_CLES.split(",").includes(k)).filter((k) => full || !inventory[k] || REP.includes(k)).sort((a, b) => LAST.indexOf(a) - LAST.indexOf(b));
      assert.ok(Object.keys(found).length > 40, `${label} : seulement ${Object.keys(found).length} réglages trouvés`);
      const failures = [];
      for (const key of keys) {
        try {
          await select(nid);
          const kind = await drive(nid, key, found[key]);
          (inventory[key] = inventory[key] || {})[name] = kind;
        } catch (e) { failures.push(`${nid}/${key} : ${e.message.split("\n")[0]}`); await openEditor(); }
      }
      assert.deepEqual(failures, [], `réglages défaillants :\n${failures.join("\n")}`);
      assert.deepEqual(errors, [], "erreurs de script");
    });
  }

  test("écrans et états : un réglage posé sur Tablette, Mobile, Grand écran ou Survol va dans CETTE zone du document, jamais dans Ordinateur, et ↺ rend l'héritage", async () => {
    const nid = NODES.head;
    await openEditor(); await select(nid); await goTab("Style");
    const KEYS = ["fontSize", "textAlign", "fontWeight", "color", "opacity", "letterSpacing"];
    const found = await discover();
    const desktopBefore = JSON.stringify(styleOf(nid));
    for (const [bag, name, how] of [["styles", "tablet", () => page.locator('.pb-bp-seg button[data-device="tablet"]').click()], ["styles", "mobile", () => page.locator('.pb-bp-seg button[data-device="mobile"]').click()], ["styles", "wide", () => page.locator('.pb-bp-seg button[data-device="wide"]').click()], ["states", "hover", async () => { await page.locator('.pb-bp-seg button[data-device="desktop"]').click(); await page.locator(".pb-state-seg button", { hasText: /^Survol$/ }).click(); }]]) {
      await goTab("Style");
      await how(); await wait(300);
      scope = { bag, name };
      for (const key of KEYS) { await goTab(found[key]); await drive(nid, key, found[key]); }
      scope = { bag: "styles", name: "desktop" };
      assert.equal(JSON.stringify(styleOf(nid)), desktopBefore, `${name} : les réglages Ordinateur ont changé`);
      await page.locator(".pb-state-seg button", { hasText: /^Normal$/ }).click().catch(() => {});
      await page.locator('.pb-bp-seg button[data-device="desktop"]').click(); await wait(200);
    }
    assert.deepEqual(errors, [], "erreurs de script");
  });

  test("couleur : HEX, RGB, HSL et transparence sont compris et enregistrés en hexadécimal ; une saisie invalide est refusée et signalée sans rien changer ; ↺ rend l'héritage", async () => {
    const nid = NODES.head;
    await openEditor(); await select(nid); const found = await discover(); await goTab(found.color);
    const hexIn = () => page.locator(".pb-cpop-hex");
    const type = async (v) => { if (await page.locator(".pb-cpop:not([hidden])").count()) { await page.keyboard.press("Escape"); await wait(200); } await prop("color").locator(".pb-color-btn").first().click(); await hexIn().fill(v); await hexIn().press("Enter"); await wait(500); };
    await type("rgb(18, 171, 52)");
    await until(() => styleOf(nid).color === "#12ab34", { what: "rgb() → #12ab34" });
    await type("hsl(120, 50%, 50%)");
    await until(() => styleOf(nid).color === "#40bf40", { what: "hsl() → #40bf40" });
    await type("#fff");
    await until(() => styleOf(nid).color === "#ffffff", { what: "#fff → #ffffff" });
    await type("#00000080");
    await until(() => styleOf(nid).color === "#00000080", { what: "transparence conservée" });
    const before = JSON.stringify(styleOf(nid));
    await type("pas une couleur");
    assert.equal(await hexIn().getAttribute("aria-invalid"), "true", "le champ est signalé invalide");
    assert.match(await page.locator("[data-pb-toast]").innerText(), /Couleur/, "un message explique le format attendu");
    assert.equal(JSON.stringify(styleOf(nid)), before, "une saisie invalide ne change rien");
    await page.keyboard.press("Escape"); await wait(200);
    await prop("color").locator(".pb-reset").first().click();
    await until(() => styleOf(nid).color === undefined, { what: "↺ efface" });
    assert.deepEqual(errors, [], "erreurs de script");
  });

  test("police : un réglage historique et une famille de la bibliothèque s'écrivent, s'affichent dans le canevas et se rechargent ; choisir deux fois la même police ne la recharge pas", async () => {
    const nid = NODES.head;
    await openEditor(); await select(nid); await goTab("Style");
    const fontCss = [];
    const onReq = (q) => { if (/\/(polices|fonts)\/|fonts\.googleapis|font.*\.css|\.woff2?/i.test(q.url())) fontCss.push(q.url()); };
    page.on("request", onReq);
    const open = async () => { await prop("fontFamily").locator(".kf-btn").first().click(); await page.locator(".kf-panel .kf-pick").first().waitFor({ timeout: 8000 }); };
    // 1. famille de la bibliothèque : la première proposée
    await open();
    const first = page.locator(".kf-panel .kf-pick[data-font^='font.']").first();
    const fontId = await first.getAttribute("data-font");
    const famName = (await first.innerText()).trim().split("\n")[0].trim();
    await first.click();
    await until(() => styleOf(nid).fontFamily === fontId, { what: "famille de la bibliothèque enregistrée" });
    assert.match(fontId, /^font\./);
    assert.ok((await computed(nid, "font-family")).toLowerCase().includes(famName.toLowerCase()), `la police « ${famName} » n'est pas appliquée dans le canevas`);
    // 2. réglage historique du site (Avec empattements) : valeur courte enregistrée, pile de polices réelle dans le canevas
    await open();
    await page.locator(".kf-panel .kf-pick", { has: page.locator(".kf-name", { hasText: /^Avec empattements$/ }) }).first().click();
    await until(() => styleOf(nid).fontFamily === "serif", { what: "réglage historique enregistré" });
    assert.match(await computed(nid, "font-family"), /Georgia/);
    // rechargement : le sélecteur affiche la police enregistrée
    await openEditor(); await select(nid); await goTab("Style");
    assert.match(await prop("fontFamily").locator(".kf-btn").first().innerText(), /empattements/i);
    await open();
    await page.locator(`.kf-panel .kf-pick[data-font='${fontId}']`).first().click();
    await until(() => styleOf(nid).fontFamily === fontId, { what: "retour à la police de la bibliothèque" });
    // 3. le même choix répété dans la même page ne recharge pas les fichiers de CETTE police (les autres lignes de la liste se prévisualisent à la demande : normal)
    const slug = fontId.replace(/^font\./, "");
    const own = () => fontCss.filter((u) => u.includes(`/fonts/library/${slug}/`)).length;
    const n0 = own();
    for (let i = 0; i < 3; i++) { await open(); const again = page.locator(`.kf-panel .kf-pick[data-font='${fontId}']`).first(); if (await again.count()) await again.click(); else await page.keyboard.press("Escape"); await wait(300); }
    assert.ok(own() - n0 <= 1, `les fichiers de la police « ${slug} » sont redemandés ${own() - n0} fois pour le même choix`);
    page.off("request", onReq);
    assert.deepEqual(errors, [], "erreurs de script");
  });

  test("accessibilité : chaque contrôle de l'inspecteur a un nom (étiquette, aria-label, infobulle ou texte), aucun identifiant n'est en double, les zones cliquables ne sont pas minuscules", async () => {
    const problems = [];
    for (const [name] of TARGETS) {
      await select(NODES[name]);
      const found = await discover();
      for (const tab of new Set(Object.values(found))) {
        await goTab(tab);
        const bad = await page.evaluate(() => {
          const root = document.querySelector("[data-pb-inspector]"), out = [], ids = new Map();
          const nameOf = (e) => {
            const direct = (e.getAttribute("aria-label") || "").trim(); if (direct) return direct;
            const by = e.getAttribute("aria-labelledby"); if (by) { const t = by.split(/\s+/).map((i) => (document.getElementById(i) || {}).textContent || "").join(" ").trim(); if (t) return t; }
            if (e.labels && e.labels.length) { const t = [...e.labels].map((l) => l.textContent).join(" ").trim(); if (t) return t; }
            if (e.closest("label") && e.closest("label").textContent.trim()) return e.closest("label").textContent.trim();
            return (e.getAttribute("title") || e.getAttribute("data-tip") || (e.tagName === "BUTTON" ? e.textContent : "") || "").trim();
          };
          root.querySelectorAll("input,select,textarea,button,[role=radio],[role=slider],[role=switch]").forEach((e) => {
            if (e.type === "hidden" || e.closest("[hidden]") || getComputedStyle(e).visibility === "hidden" || !e.offsetParent && getComputedStyle(e).position !== "fixed") return;
            if (!nameOf(e)) out.push(`sans nom : <${e.tagName.toLowerCase()} class="${e.className}">`);
            const r = e.getBoundingClientRect();
            if (r.width && r.height && (r.width < 16 || r.height < 16) && e.type !== "range" && !e.closest(".pb-nstep")) out.push(`zone trop petite (${Math.round(r.width)}×${Math.round(r.height)}) : <${e.tagName.toLowerCase()} class="${e.className}"> ${nameOf(e)}`);
          });
          root.querySelectorAll("[id]").forEach((e) => ids.set(e.id, (ids.get(e.id) || 0) + 1));
          ids.forEach((n, id) => { if (n > 1) out.push(`identifiant en double : ${id}`); });
          return out;
        });
        bad.forEach((b) => problems.push(`${name}/${tab} : ${b}`));
      }
    }
    assert.deepEqual([...new Set(problems)], [], "défauts d'accessibilité");
  });

  test("couverture : chaque propriété du modèle a un contrôle accessible quelque part dans l'inspecteur (sauf exceptions documentées)", async () => {
    const reached = new Set(Object.keys(inventory));
    const missing = Object.keys(STYLE_PROPS).filter((k) => !reached.has(k));
    // Réglages atteints par un contrôle spécialisé (hors data-prop) — vérifiés par leurs propres tests
    const SPECIAL = new Set(["marginTop", "marginRight", "marginBottom", "marginLeft", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "fontFamily", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius", "columns", "gridTemplate", "gridRows", "gridRowsTemplate", "gridAutoRows", "gridAutoColumns", "gridAutoFlow", "justifyItems", "order", "flexGrow", "flexShrink", "flexBasis", "lineClamp"]);
    assert.deepEqual(missing.filter((k) => !SPECIAL.has(k)), [], "propriétés du modèle sans contrôle dans l'inspecteur");
  });
});
