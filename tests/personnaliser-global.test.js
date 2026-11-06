// KOLAKISA — Nouveau personnalisateur, rubrique « Global » (Typographie, Couleurs, Conteneur, Boutons) : modèle de données validé, CSS généré (variables, responsive,
// priorité), écran, aperçu en direct, brouillon, publication, réinitialisation, isolation par site, site principal. Vraies routes, vraie base.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const gs = require("../src/marketing/pages/globalStyles");
const tokensLib = require("../src/marketing/pages/tokens");

describe("réglages globaux : modèle de données et CSS", () => {
  test("aucun réglage = aucune règle, et des jetons identiques (le design du thème reste intact)", () => {
    assert.equal(gs.globalCss(gs.defaults(), "site"), "");
    assert.equal(gs.globalCss(gs.defaults(), "principal"), "");
    assert.equal(tokensLib.normalizeTokens({ global: gs.defaults() }).global, undefined, "des réglages vides ne sont pas enregistrés");
    assert.equal(Object.hasOwn(tokensLib.normalizeTokens({}), "global"), false);
  });
  test("validation stricte : nombres bornés, listes fermées, couleurs valides, polices connues, sections connues", () => {
    const bad = (g, re) => assert.throws(() => gs.normalizeGlobal(g, { strict: true }), re);
    bad({ typography: { h1: { size: 500 } } }, /Titre H1 : taille/);
    bad({ typography: { h2: { transform: "x" } } }, /casse/);
    bad({ typography: { body: { color: "red;}body{display:none" } } }, /couleur/);
    bad({ typography: { headingFont: { family: "font.nexiste-pas" } } }, /police inconnue/i);
    bad({ typography: { h3: { weight: 555 } } }, /graisse/);
    bad({ colors: { accent: "javascript:alert(1)" } }, /couleur/);
    bad({ colors: { paletteKey: "nexiste-pas" } }, /Palette/);
    bad({ container: { layout: "diagonal" } }, /Mise en page/);
    bad({ container: { width: { d: 99999 } } }, /Largeur du conteneur/);
    bad({ buttons: { primary: { radius: { d: { t: -3 } } } } }, /rayon de bordure/);
    bad({ buttons: { secondary: { borderStyle: "groove" } } }, /style de bordure/);
    assert.throws(() => gs.normalizeSection("autre", {}, { strict: true }), /inconnue/);
    // hors mode strict, une valeur refusée est simplement ignorée (jamais écrite dans une feuille de style)
    assert.equal(gs.normalizeGlobal({ typography: { h1: { size: 500 } } }).typography.h1.size, null);
  });
  test("typographie : variables du thème, détails, tablette et mobile en surcharge (le bureau n'est jamais écrasé)", () => {
    const g = gs.normalizeGlobal({ typography: { h1: { size: 50, ls: 0.02, transform: "uppercase", tablet: { size: 36 }, mobile: { size: 28, lh: 1.1 } }, bodyFont: { size: 18, weight: 500 }, paragraphMargin: { value: 1.5, unit: "em" } } }, { strict: true });
    const css = gs.globalCss(g, "site");
    const [desktop, rest] = css.split("@media (max-width: 1023px)");
    assert.ok(desktop.includes("--kw-h1-size:50px") && desktop.includes("--kw-body-size:18px") && desktop.includes("--kw-body-weight:500"));
    assert.ok(desktop.includes("letter-spacing:0.02em") && desktop.includes("text-transform:uppercase") && desktop.includes("margin-block-end:1.5em"));
    assert.ok(!desktop.includes("36px") && !desktop.includes("28px"), "les valeurs tablette et mobile ne sont pas dans les règles de l'ordinateur");
    const [tablet, mobile] = rest.split("@media (max-width: 767px)");
    assert.ok(tablet.includes("--kw-h1-size:36px") && tablet.includes("font-size:36px") && !tablet.includes("28px"));
    assert.ok(mobile.includes("--kw-h1-size:28px") && mobile.includes("--kw-h1-lh:1.1"));
  });
  test("six pré-réglages de polices réellement différents ; quatre palettes distinctes ; six styles de boutons distincts", () => {
    assert.equal(gs.TYPE_PRESETS.length, 6);
    assert.equal(new Set(gs.TYPE_PRESETS.map((p) => `${p.heading}|${p.body}`)).size, 6);
    for (const p of gs.TYPE_PRESETS) { const css = gs.globalCss(gs.normalizeGlobal({ typography: { preset: p.id } }, { strict: true }), "site"); assert.ok(css.includes("--kw-font-heading:") && css.includes("--kw-font-body:"), p.id); }
    assert.deepEqual(gs.PALETTES.map((p) => p.key), ["default", "oak", "viola", "dark"]);
    assert.equal(new Set(gs.PALETTES.map((p) => p.colors.join(","))).size, 4);
    assert.ok(gs.PALETTES.every((p) => p.colors.length === 9 && p.colors.every((c) => /^#[0-9a-f]{6}$/.test(c))));
    assert.equal(gs.BUTTON_PRESETS.length, 6);
    assert.equal(new Set(gs.BUTTON_PRESETS.map((p) => `${p.radius}|${p.outline}`)).size, 6);
  });
  test("couleurs : une palette choisie alimente les variables du site ; une couleur supprimée libère ses références ; couleur du site et transparence acceptées", () => {
    const viola = gs.PALETTES.find((p) => p.key === "viola").colors;
    const css = gs.globalCss(gs.normalizeGlobal({ colors: { paletteKey: "viola" } }, { strict: true }), "site");
    assert.ok(css.includes(`--kw-primary:${viola[0]}`) && css.includes(`--kw-text:${viola[3]}`) && css.includes(`--kw-background:${viola[5]}`) && css.includes(`--kw-surface:${viola[4]}`), css);
    const palette = viola.slice(0, 4).map((hex, i) => ({ id: `p${i}`, name: `C${i}`, hex }));
    const kept = gs.normalizeGlobal({ colors: { paletteKey: "custom", palette, accent: "p:p1" } }, { strict: true }).colors;
    assert.equal(kept.accent, "p:p1");
    const dropped = gs.normalizeGlobal({ colors: { paletteKey: "custom", palette: palette.filter((c) => c.id !== "p1"), accent: "p:p1" } }, { strict: true }).colors;
    assert.equal(dropped.accent, "", "la référence à une couleur supprimée retourne à l'héritage");
    assert.throws(() => gs.normalizeGlobal({ colors: { palette: [{ id: "p1", name: "", hex: "#fff" }] } }, { strict: true }), /palette invalide/);
    const ok = gs.globalCss(gs.normalizeGlobal({ buttons: { primary: { normal: { bg: "token:primary", color: "#ffffff80", border: "transparent" } } } }, { strict: true }), "site");
    assert.ok(ok.includes("background:var(--kw-primary)") && ok.includes("color:#ffffff80") && ok.includes("border-color:transparent"));
  });
  test("conteneur : largeurs par écran, mise en page, style encadré ; la structure des pages n'est pas modifiée (aucune règle sur le contenu)", () => {
    const css = gs.globalCss(gs.normalizeGlobal({ container: { layout: "boxed", style: "boxed", width: { d: 1200, t: 900, m: 600 }, narrow: { d: 750 }, padX: { d: 24, m: 12 } } }, { strict: true }), "site");
    assert.ok(css.includes("max-width:1200px") && css.includes("max-width:750px") && css.includes("padding-inline:24px"));
    const tab = css.split("@media (max-width: 1023px)")[1].split("@media (max-width: 767px)")[0];
    assert.ok(tab.includes("max-width:900px") && !tab.includes("1200"));
    assert.ok(css.split("@media (max-width: 767px)")[1].includes("max-width:600px"));
    assert.ok(/\.lp-main\)\{[^}]*background:/.test(css), "style encadré : fond du contenu");
    const full = gs.globalCss(gs.normalizeGlobal({ container: { layout: "full" } }, { strict: true }), "site");
    assert.ok(full.includes("max-width:none"));
  });
  test("boutons : principal et secondaire distincts, états, côtés indépendants, responsive", () => {
    const g = gs.normalizeGlobal({ buttons: { primary: { normal: { bg: "#112233" }, hover: { bg: "#223344" }, padding: { d: { t: 15, r: 30, b: 15, l: 30 }, m: { t: 10, r: 20, b: 10, l: 20 } }, radius: { d: { t: 999, r: 999, b: 999, l: 999 } } }, secondary: { normal: { color: "#445566" } } } }, { strict: true });
    const css = gs.globalCss(g, "site");
    assert.ok(css.includes(".kw-btn-primary, .lp-btn):hover{background:#223344}") || css.includes("background:#223344"));
    assert.ok(css.includes("padding:15px 30px 15px 30px") && css.includes("border-radius:999px 999px 999px 999px"));
    assert.ok(css.split("@media (max-width: 767px)")[1].includes("padding:10px 20px 10px 20px"));
    assert.ok(css.includes(".kw-btn-outline, .kw-btn-ghost") && css.includes("color:#445566"), "le secondaire cible les boutons contour et fantôme");
    assert.ok(!/\.kw-btn-outline[^{]*\{[^}]*#112233/.test(css), "les couleurs du principal ne passent pas au secondaire");
  });
  test("aucune valeur libre dans une feuille de style : chevrons retirés, sélecteurs fixes", () => {
    const css = gs.globalCss(gs.normalizeGlobal({ typography: { h1: { color: "#123456" } }, colors: { palette: [{ id: "p1", name: "<b>x</b>", hex: "#123456" }] } }), "site");
    assert.ok(!css.includes("<") && !css.includes(">"));
  });
});

describe("personnalisateur Global : écran, aperçu, brouillon, publication, isolation", () => {
  let srv, boss, db, orgId, S1, S2;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const PZ = "/marketing/site-web/personnaliser", API = "/marketing/site-web/styles"; // l'écran vient de PZ ; aperçu, brouillon et publication passent par le moteur commun (API)
  const json = (r) => { try { return JSON.parse(r.text); } catch { return null; } };
  const bootOf = (html) => JSON.parse(html.match(/<script type="application\/json" id="pz-boot">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, "<"));
  const post = (path, site, body) => boss.postJson(`${API}${path}${site ? `?site=${site}` : ""}`, { site: site ? String(site) : "", ...body });
  const mkSite = (name) => {
    const tokens = tokensLib.normalizeTokens({});
    const id = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, ?)").run(orgId, name, name.toLowerCase(), JSON.stringify(tokens)).lastInsertRowid);
    const sections = [{ id: "sect00000001", type: "layout", children: [
      { id: "hd0000000001", type: "heading", props: { text: "Titre de test", level: 1 } }, { id: "tx0000000001", type: "text", props: { html: "<p>Un paragraphe avec un <a href=\"/blog\">lien</a>.</p>" } },
      { id: "bt0000000001", type: "button", props: { label: "Bouton principal", url: "/catalogue", variant: "primary" } }, { id: "bt0000000002", type: "button", props: { label: "Bouton secondaire", url: "/catalogue", variant: "outline" } }] }];
    const page = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, 'Accueil', ?, 'published', 'page', ?, datetime('now'))").run(orgId, `Accueil ${name}`, `g-${name.toLowerCase()}`, JSON.stringify(sections), id).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(page, id);
    return id;
  };
  const tokensOf = (id) => JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", id).tokens);
  const pub = (slug) => boss.get(`/p/${slug}`);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    S1 = mkSite("Alpha"); S2 = mkSite("Beta");
  });
  after(() => { db.close(); return srv.stop(); });

  test("l'écran : la catégorie Global propose Typographie, Couleurs, Conteneur, Boutons ; l'ancien écran n'existe plus", async () => {
    const r = await boss.get(`${PZ}?site=${S1}`);
    assert.equal(r.status, 200);
    assert.match(r.text, /id="pz-app"/);
    assert.match(r.text, /Masquer les contrôles/);
    assert.match(r.text, /data-device="desktop"/);
    for (const old of ["kwc-top-c", "kwc-selbar", "data-sites-only", "kwc-sidefoot"]) assert.ok(!r.text.includes(old), `reste de l'ancien écran : ${old}`);
    const b = bootOf(r.text);
    const gp = b.panels.find((p) => p.id === "global");
    assert.deepEqual(gp.controls.map((c) => c.id), ["tokens.global.typography", "tokens.global.colors", "tokens.global.container", "tokens.global.buttons"]);
    assert.equal(b.global.typePresets.length, 6);
    assert.equal(b.global.palettes.length, 4);
    assert.equal(b.global.buttonPresets.length, 6);
    assert.ok(gp.controls.every((c) => b.values[c.id] && b.live[c.id]), "valeurs normalisées fournies pour chaque ensemble");
    assert.ok(b.global.base.type.h1.size > 0 && b.global.base.sizes.content > 0, "valeurs d'origine fournies à l'écran");
  });
  test("aperçu en direct : le CSS recalculé contient les réglages ; rien n'est publié ; valeurs invalides et réglages inconnus refusés", async () => {
    const typo = { ...gs.defaults().typography, h1: { ...gs.defaults().typography.h1, size: 52, tablet: { size: 38, lh: null, ls: null } }, bodyFont: { ...gs.defaults().typography.bodyFont, size: 19 } };
    const r = json(await post("/rendu", S1, { changes: { "tokens.global.typography": typo } }));
    assert.ok(r.ok && r.structural === false);
    assert.ok(r.assets.theme.includes("--kw-h1-size:52px") && r.assets.theme.includes("--kw-body-size:19px") && r.assets.theme.includes("@media (max-width: 1023px)"));
    assert.ok(!(await pub("g-alpha")).text.includes("--kw-h1-size:52px"), "la page publique ne change pas avant publication");
    const badTypo = { ...typo, h1: { ...typo.h1, size: 9999 } };
    assert.equal((await post("/rendu", S1, { changes: { "tokens.global.typography": badTypo } })).status, 422);
    assert.equal((await post("/rendu", S1, { changes: { "tokens.global.inconnu": {} } })).status, 422);
    assert.equal((await post("/rendu", S1, { changes: { "tokens.global.colors": "rouge" } })).status, 422);
  });
  test("brouillon → publication → site public ; l'autre site reste intact ; réglages enregistrés par site", async () => {
    const d = gs.defaults();
    const changes = {
      "tokens.global.typography": { ...d.typography, h2: { ...d.typography.h2, size: 33, weight: 600 }, underlineLinks: true },
      "tokens.global.colors": { ...d.colors, paletteKey: "oak", palette: gs.PALETTES[1].colors.map((hex, i) => ({ id: `p${i}`, name: gs.PALETTES[1].label + i, hex })) },
      "tokens.global.container": { ...d.container, layout: "boxed", width: { d: 1100, t: 900, m: null } },
      "tokens.global.buttons": { ...d.buttons, primary: { ...d.buttons.primary, normal: { color: "#ffffff", bg: "#112233", border: "" }, radius: { ...d.buttons.primary.radius, linked: true, d: { t: 999, r: 999, b: 999, l: 999 } } } },
    };
    const dr = json(await post("/brouillon", S1, { changes }));
    assert.ok(dr.ok || dr.draft, JSON.stringify(dr));
    const st = bootOf((await boss.get(`${PZ}?site=${S1}`)).text);
    assert.equal(st.changes["tokens.global.typography"].h2.size, 33, "le brouillon est rechargé");
    assert.equal(st.values["tokens.global.container"].width.d, 1100);
    const pubr = json(await post("/publier", S1, { rev: dr.draft.rev }));
    assert.ok(pubr.ok, JSON.stringify(pubr));
    const t = tokensOf(S1);
    assert.equal(t.global.typography.h2.size, 33); assert.equal(t.global.colors.paletteKey, "oak"); assert.equal(t.global.container.width.d, 1100); assert.equal(t.global.buttons.primary.normal.bg, "#112233");
    const html = (await pub("g-alpha")).text;
    assert.ok(html.includes("--kw-h2-size:") && html.includes("max-width:1100px") && html.includes("#112233") && html.includes("border-radius:999px 999px 999px 999px"), "CSS publié");
    assert.ok(html.includes(`--kw-primary:${gs.PALETTES[1].colors[0]}`), "couleur d'accentuation de la palette");
    const other = (await pub("g-beta")).text;
    assert.ok(!other.includes("max-width:1100px") && !other.includes("#112233") && !other.includes("--kw-h2-size:33px"), "l'autre site n'est pas touché");
    assert.equal(tokensOf(S2).global, undefined);
  });
  test("réinitialisation : revenir aux valeurs vides publie le design d'origine (CSS et données retirés)", async () => {
    const st = bootOf((await boss.get(`${PZ}?site=${S1}`)).text);
    const d = gs.defaults();
    const dr = json(await post("/brouillon", S1, { changes: { "tokens.global.typography": d.typography, "tokens.global.colors": d.colors, "tokens.global.container": d.container, "tokens.global.buttons": d.buttons }, rev: st.draft.rev }));
    const r = json(await post("/publier", S1, { rev: dr.draft ? dr.draft.rev : 0 }));
    assert.ok(r.ok, JSON.stringify(r));
    assert.equal(tokensOf(S1).global, undefined, "plus aucun réglage global");
    const html = (await pub("g-alpha")).text;
    assert.ok(!html.includes("max-width:1100px") && !html.includes("#112233"));
  });
  test("site principal : l'aperçu reçoit les réglages globaux dans la feuille de l'apparence", async () => {
    const d = gs.defaults();
    const r = json(await post("/rendu", null, { changes: { "tokens.global.container": { ...d.container, width: { d: 1000, t: null, m: null } }, "tokens.global.buttons": { ...d.buttons, primary: { ...d.buttons.primary, normal: { color: "", bg: "#445566", border: "" } } } } }));
    assert.ok(r.ok, JSON.stringify(r));
    assert.ok(r.assets.appearanceCss.includes("max-width:1000px") && r.assets.appearanceCss.includes("#445566"));
  });
  test("polices : seules les familles réellement choisies sont chargées par la page publique (@font-face), les autres jamais", async () => {
    const d = gs.defaults();
    const dr = json(await post("/brouillon", S1, { changes: { "tokens.global.typography": { ...d.typography, headingFont: { family: "font.poppins", weight: 700 }, bodyFont: { ...d.typography.bodyFont, family: "font.roboto" } } } }));
    const r = json(await post("/publier", S1, { rev: dr.draft.rev }));
    assert.ok(r.ok, JSON.stringify(r));
    const html = (await pub("g-alpha")).text;
    assert.ok(html.includes("--kw-font-heading:") && /Poppins/.test(html) && /Roboto/.test(html), "polices choisies présentes");
    const faces = (html.match(/@font-face\s*\{[^}]*\}/g) || []).join("\n");
    assert.match(faces, /Poppins/, "@font-face de la police des titres");
    assert.match(faces, /Roboto/, "@font-face de la police du corps");
    assert.ok(!/Open Sans/.test(faces) && !/Lora/.test(faces), "aucune police non utilisée n'est chargée");
    // retour à l'origine
    const back = json(await post("/brouillon", S1, { changes: { "tokens.global.typography": d.typography } }));
    assert.ok((json(await post("/publier", S1, { rev: back.draft.rev }))).ok);
  });
});
