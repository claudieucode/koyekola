// Programme 21.5 — AI Design Generator. Pur : palettes, typographie, jetons, validation. Service : base en mémoire + IA simulée. Web : vrai serveur (brouillon du personnalisateur natif).
// Aucun appel réseau, aucun coût ; rien n'est jamais publié par le générateur.
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const pages = require("../src/marketing/pages");
const aiCore = require("../src/services/aiCore");
const tokensLib = require("../src/marketing/pages/tokens");
const settingsLib = require("../src/marketing/pages/siteSettings");
const dg = require("../src/designGen");
const { analyzer, design } = dg;
const color = require("../src/designGen/color");
const typo = require("../src/designGen/typography");
const gen = require("../src/pageGen");

const IMMO = "Je veux un site immobilier élégant, avec une apparence premium, un bleu marine profond, des espaces généreux, une typographie moderne et de grandes photographies.";
const SHOP = "Je veux une boutique de vêtements moderne, dynamique, avec un design minimaliste, des couleurs sobres et une présentation élégante des produits.";
const build = (text, category = "") => { const d = analyzer.analyze({ text, category }); return { d, ds: design.build(d) }; };
const hueOf = (hex) => color.hexToHsl(hex)[0];

describe("couleurs (E)", () => {
  test("contrastes WCAG : valeurs de référence", () => {
    assert.equal(Math.round(color.ratio("#000000", "#ffffff")), 21); assert.equal(color.ratio("#777777", "#777777"), 1);
    assert.equal(color.onColor("#ffffff"), "#0b1620"); assert.equal(color.onColor("#0b2a40"), "#ffffff");
  });
  test("toutes les ambiances × 12 teintes : chaque paire utile atteint AA ; texte ≥ 7", () => {
    for (const mood of Object.keys(color.MOODS)) for (let h = 0; h < 360; h += 30) {
      const p = color.palette(h, mood), bad = color.audit(p).filter((c) => !c.ok);
      assert.deepEqual(bad, [], `${mood}/${h}`);
      assert.ok(color.ratio(p.text, p.background) >= 7, `${mood}/${h} texte`);
      for (const k of ["primary", "secondary", "accent", "background", "surface", "text", "muted", "success", "warning", "error", "border", "link"]) assert.match(p[k], /^#[0-9a-f]{6}$/, k);
    }
  });
  test("pas de saturation excessive sans justification (primaire ≤ 80 %)", () => {
    for (const mood of Object.keys(color.MOODS)) assert.ok(color.hexToHsl(color.palette(215, mood).primary)[1] <= 80, mood);
  });
  test("un design aux contrastes dégradés est rejeté par le moteur de validation (L)", () => {
    const { ds } = build(IMMO);
    const bad = JSON.parse(JSON.stringify(ds)); bad.palette.text = bad.palette.background;
    const r = design.validate(bad);
    assert.equal(r.ok, false); assert.match(r.errors[0], /Contraste insuffisant/);
  });
});

describe("analyse du brief (A, B, C, D)", () => {
  test("A. corporate : ambiance, teinte, polices neutres", () => {
    const d = analyzer.analyze({ text: "site d'entreprise sérieux pour un cabinet de conseil, bleu", category: "entreprise" });
    assert.equal(d.mood, "corporate"); assert.equal(d.fontPair, "neutre");
    const ps = design.proposals(d); assert.ok(ps.length >= 2); assert.ok(ps.every((p) => p.report.ok));
  });
  test("exemple de la mission (immobilier premium) : bleu marine profond, espaces généreux, polices classiques, photos fortes", () => {
    const { d, ds } = build(IMMO, "immobilier");
    assert.deepEqual([d.mood, d.density, d.imagery, d.fontPair], ["luxe", "aeree", "forte", "classique"]);
    assert.ok(Math.abs(hueOf(ds.palette.primary) - 222) < 12); assert.ok(color.hexToHsl(ds.palette.primary)[2] < 25, "bleu profond");
    assert.ok(ds.spacing.xl >= 72); assert.equal(ds.sectionStyles.hero.padding, "xl");
  });
  test("B. boutique de vêtements : minimaliste sobre, jamais d'accent agressif", () => {
    const { d, ds } = build(SHOP, "boutique");
    assert.equal(d.mood, "minimaliste"); assert.ok(color.hexToHsl(ds.palette.primary)[1] < 25, "couleurs sobres");
    assert.equal(design.build({ ...d, mood: "ecommerce" }).components.cards.shadow, "md");
  });
  test("C. portfolio créatif : formes arrondies, ambiance créative, alternatives distinctes", () => {
    const d = analyzer.analyze({ text: "portfolio d'un photographe, créatif et audacieux", category: "portfolio" });
    assert.equal(d.mood, "creatif"); assert.equal(d.roundness, "arrondi");
    const ps = design.proposals(d); assert.equal(new Set(ps.map((p) => p.design.direction.mood)).size, ps.length);
    assert.ok(ps[0].design.radius.card > 14);
  });
  test("D. éducatif : hiérarchie typographique stricte, texte ≥ 16 px, interligne confortable", () => {
    const { ds } = build("plateforme de formation en ligne pour apprendre", "formation");
    const s = ds.typography.sizes;
    assert.ok(s.h1 > s.h2 && s.h2 > s.h3 && s.h3 > s.h4 && s.h4 >= s.h5 && s.h5 >= s.h6);
    assert.ok(s.body >= 16 && ds.typography.lineHeights.body >= 1.6); assert.ok(ds.responsive.mobile.body >= 16);
  });
  test("brief vide : refusé ; accents et casse ignorés", async () => {
    assert.equal(analyzer.analyze({ text: "ÉLÉGANT PREMIUM" }).mood, "luxe");
    const m = freshMarketing(), A = m.ctx(1), sid = pages.createSite(A, { name: "S" }).id;
    await assert.rejects(dg.generate(A, sid, { text: "  " }), /Décrivez/);
  });
});

describe("typographie (F)", () => {
  test("polices = celles du moteur ; échelle décroissante ; une police inconnue ou une hiérarchie inversée est détectée", () => {
    for (const pair of Object.keys(typo.PAIRS)) {
      const t = typo.plan({ mood: "corporate", density: "equilibree", fontPair: pair });
      assert.deepEqual(typo.check(t), [], pair);
      for (const k of Object.values(t.fonts)) assert.ok(Object.hasOwn(tokensLib.FONTS, k), k);
    }
    const t = typo.plan({ mood: "corporate", density: "equilibree", fontPair: "neutre" });
    assert.match(typo.check({ ...t, fonts: { ...t.fonts, heading: "papyrus" } })[0], /indisponible/);
    assert.match(typo.check({ ...t, sizes: { ...t.sizes, h2: 90 } }).join(" "), /Hiérarchie inversée/);
    assert.match(typo.check({ ...t, sizes: { ...t.sizes, body: 12 } }).join(" "), /16 px/);
  });
});

describe("jetons, composants, responsive, cohérence (G, H, I, J)", () => {
  const { ds } = build(IMMO, "immobilier");
  const changes = design.toChanges(ds);
  test("G. les réglages passent les normaliseurs STRICTS du moteur et restent dans des chemins connus", () => {
    assert.equal(design.validate(ds, changes).ok, true);
    assert.ok(Object.keys(changes).every((p) => /^(tokens\.(colors|link|border|fonts|type|space|radius|shadow|sizes|buttons|forms|images)|settings\.(layout|responsive))\./.test(p)), "aucun chemin inconnu");
    assert.ok(changes["tokens.colors.primary"] && changes["tokens.fonts.heading"] && changes["tokens.space.xl"]);
    const tk = JSON.parse(JSON.stringify(tokensLib.DEFAULT_TOKENS)); tk.colors.primary = changes["tokens.colors.primary"];
    assert.equal(tokensLib.normalizeTokens(tk, { strict: true }).colors.primary, changes["tokens.colors.primary"]);
  });
  test("H. composants : bouton lisible à tous les états, champs de formulaire visibles (≥ 3:1), focus = primaire, cartes arrondies selon la direction", () => {
    const p = ds.palette;
    for (const [bg, fg] of [["tokens.buttons.normal.bg", "tokens.buttons.normal.color"], ["tokens.buttons.hover.bg", "tokens.buttons.hover.color"], ["tokens.buttons.active.bg", "tokens.buttons.active.color"]]) assert.ok(color.ratio(changes[bg], changes[fg]) >= 4.5, bg);
    assert.ok(color.ratio(changes["tokens.forms.borderColor"], changes["tokens.forms.bg"]) >= 3);
    assert.equal(changes["tokens.forms.focusColor"], p.primary); assert.equal(changes["tokens.radius.card"], ds.radius.card);
    assert.ok(changes["tokens.sizes.buttonHeight"] >= 44, "cible tactile");
  });
  test("I. responsive : le titre diminue du bureau au mobile, texte mobile 16 px, points de rupture natifs intacts", () => {
    const r = ds.responsive;
    assert.ok(ds.typography.sizes.h1 > r.tablet.h1 && r.tablet.h1 > r.mobile.h1 && r.mobile.h1 >= 26);
    assert.equal(r.mobile.body, 16); assert.ok(r.mobile.gutter <= r.tablet.gutter);
    assert.ok(r.mobile.spaceXl < ds.spacing.xl, "pas une simple réduction homothétique : espacements recalculés");
    assert.ok(!Object.keys(changes).some((p) => /breakpoints/.test(p)), "pas de second système de points de rupture");
    const st = settingsLib.normalizeSettings({ responsive: { tablet: r.tablet, mobile: r.mobile }, layout: { contentWidth: ds.layout.contentWidth, containerWidth: ds.layout.containerWidth, gutter: ds.layout.gutter } }, { strict: true });
    assert.equal(st.responsive.mobile.h1, r.mobile.h1);
  });
  test("J. cohérence : les 3 variantes modifient exactement les mêmes réglages (une structure, des variantes) ; styles de sections dans l'énumération native", () => {
    const ps = design.proposals(analyzer.analyze({ text: IMMO, category: "immobilier" }));
    const paths = (p) => Object.keys(p.changes).sort().join();
    assert.ok(ps.length >= 2 && ps.every((p) => paths(p) === paths(ps[0])));
    const S = require("../src/marketing/pages/sections").STYLE;
    for (const p of ps) for (const grp of Object.values(p.design.sectionStyles)) for (const [k, v] of Object.entries(grp)) if (S[k]) assert.ok(S[k].includes(v), `${k}=${v}`);
  });
});

describe("service : IA simulée, isolation, protection (L, M, N)", () => {
  let m, A, sid;
  beforeEach(() => { m = freshMarketing(); A = m.ctx(1); sid = pages.createSite(A, { name: "Design" }).id; });
  after(() => aiCore.setClientForTests(null));
  const fakeAi = (reply) => aiCore.setClientForTests({ beta: { messages: { create: async (r) => ({ stop_reason: "end_turn", model: r.model, usage: { output_tokens: 8 }, content: [{ type: "text", text: JSON.stringify(reply(r)) }] }) } } });

  test("proposition enregistrée, relue, isolée par site ; aucun réglage du site modifié", async () => {
    const before = A.db.prepare("SELECT tokens FROM mk_sites WHERE id = ?").get(sid).tokens;
    const run = await dg.generate(A, sid, { text: IMMO, category: "immobilier" });
    assert.equal(run.status, "proposed"); assert.ok(run.proposals.length >= 2);
    assert.equal(A.db.prepare("SELECT tokens FROM mk_sites WHERE id = ?").get(sid).tokens, before, "générer ne touche à rien (régression)");
    const other = pages.createSite(A, { name: "Autre" }).id;
    const L = m.ctx(1, { siteScope: sid });
    assert.equal(dg.getRun(L, sid, run.id).id, run.id);
    assert.throws(() => dg.getRun(L, other, run.id), (e) => e.code === "not_found");
    assert.throws(() => dg.getRun(A, other, run.id), (e) => e.code === "not_found", "la proposition du site 1 n'est pas lisible depuis le site 2");
    await assert.rejects(dg.generate(L, other, { text: IMMO }), (e) => e.code === "not_found");
  });
  test("L. l'IA ne choisit que dans des listes : valeurs hors liste ignorées, propriétés supplémentaires sans effet, jamais de couleur libre", async () => {
    fakeAi(() => ({ mood: "gothique", hue: "abc", density: "aeree", roundness: "carré", fontPair: "comic", css: "body{display:none}", primary: "#ff0000" }));
    const run = await dg.generate(A, sid, { text: "site sérieux", category: "entreprise" }, { useAi: true });
    assert.ok(run.brief.notes.length >= 3);
    assert.equal(run.brief.direction.mood, "corporate"); assert.equal(run.brief.direction.density, "aeree");
    assert.ok(run.proposals.every((p) => p.report.ok));
    assert.ok(!JSON.stringify(run.proposals).includes("display:none") && !JSON.stringify(run.proposals).includes("#ff0000"));
    fakeAi(() => ({ mood: "tech", hue: 270, density: "compacte", roundness: "arrondi", fontPair: "moderne" }));
    const ok = await dg.generate(A, sid, { text: "x", category: "entreprise" }, { useAi: true });
    assert.equal(ok.brief.direction.mood, "tech"); assert.equal(ok.brief.direction.hue, 270);
  });
  test("N. quota de l'IA centrale respecté ; sans clé : indisponible ; sans IA la génération reste possible", async () => {
    let calls = 0; fakeAi(() => { calls += 1; return { mood: "tech", hue: 200, density: "equilibree", roundness: "doux", fontPair: "neutre" }; });
    A.settings.set(1, "ai.daily_limit", 1);
    await dg.generate(A, sid, { text: "x", category: "blog" }, { useAi: true });
    await assert.rejects(dg.generate(A, sid, { text: "x", category: "blog" }, { useAi: true }), (e) => e.code === "quota");
    assert.equal(calls, 1);
    assert.ok((await dg.generate(A, sid, { text: "x", category: "blog" })).proposals.length >= 2);
    aiCore.setClientForTests(null); const saved = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY;
    try { await assert.rejects(dg.generate(m.ctx(1), sid, { text: "x" }, { useAi: true }), (e) => e.code === "quota" || e.code === "not_configured"); } finally { if (saved) process.env.ANTHROPIC_API_KEY = saved; }
  });
  test("J'. les pages générées suivent la direction appliquée (composition transmise au Page Generator)", async () => {
    const run = await dg.generate(A, sid, { text: IMMO, category: "immobilier" });
    const chosen = run.proposals[0];
    A.db.prepare("UPDATE mk_design_runs SET status = 'applied', chosen = ? WHERE id = ?").run(chosen.key, run.id);
    const layout = dg.appliedLayout(A, sid);
    assert.deepEqual(layout, chosen.design.sectionStyles);
    const plan = { version: 1, site: { name: "S" }, pages: ["Accueil Z", "Contact Z"].map((n) => ({ name: n, type: "autre", sections: [{ kind: "hero", title: n }, { kind: "services" }] })) };
    const g = await gen.generate(A, sid, plan, { layout });
    const heroes = g.result.pages.map((p) => JSON.stringify(p.sections[0].style));
    assert.equal(new Set(heroes).size, 1, "même style de bandeau sur toutes les pages");
    assert.equal(g.result.pages[0].sections[0].style.padding, chosen.design.sectionStyles.hero.padding);
    assert.equal(g.result.pages[0].sections[0].style.align, chosen.design.sectionStyles.hero.align);
    const without = await gen.generate(A, sid, plan);
    assert.notEqual(JSON.stringify(without.result.pages[0].sections[0].style), heroes[0], "sans direction : style par défaut");
  });
});

describe("web : brouillon du personnalisateur natif, protection, annulation, isolation", () => {
  let srv, boss, db, A, B, adminA, viewerA, adminB;
  const G = (id, rest = "") => `/marketing/site-web/sites/${id}/direction-artistique${rest}`;
  const idOf = (c) => db.prepare("SELECT id FROM users WHERE email = ?").get(c.email).id;
  const draft = (site) => { const r = db.prepare("SELECT changes, rev FROM cms_customizer_drafts WHERE site_id = ?").get(site); return r ? { changes: JSON.parse(r.changes), rev: r.rev } : null; };
  const live = (site) => JSON.parse(db.prepare("SELECT tokens FROM mk_sites WHERE id = ?").get(site).tokens);
  const run = async (client, site, brief = IMMO, category = "immobilier") => { const r = await client.post(G(site, "/generer"), { brief, category }); const m = /direction-artistique\/(\d+)/.exec(r.location || ""); return m ? Number(m[1]) : null; };
  before(async () => {
    srv = await startServer({ SITE_URL: "https://kolakisa.test" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (n) => { await boss.post("/marketing/site-web/sites", { name: n }); return db.prepare("SELECT id FROM mk_sites WHERE name = ?").get(n).id; };
    A = await mk("Design A"); B = await mk("Design B");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    adminA = await member(A, "admin"); viewerA = await member(A, "viewer"); adminB = await member(B, "admin");
  });
  after(() => { db.close(); return srv.stop(); });

  test("G. écran, 3 directions avec aperçu, comparaison, application dans le BROUILLON (rien en ligne), réglages acceptés par le personnalisateur réel", async () => {
    assert.match((await boss.get(G(A))).text, /Votre brief/);
    const rid = await run(boss, A); assert.ok(rid);
    const view = await boss.get(G(A, `/${rid}`));
    assert.equal(view.status, 200); assert.match(view.text, /A — Luxe/); assert.match(view.text, /conformes \(AA\)/);
    assert.match((await boss.get(G(A, `/${rid}?variante=a`))).text, /Avant \/ après/);
    const liveBefore = JSON.stringify(live(A));
    const ap = await boss.post(G(A, `/${rid}/appliquer`), { variante: "a" });
    assert.equal(ap.status, 302);
    const d = draft(A);
    assert.ok(d && d.changes["tokens.colors.primary"] && d.changes["tokens.fonts.heading"] && d.changes["settings.responsive.mobile.h1"], "dans le brouillon du personnalisateur");
    assert.equal(JSON.stringify(live(A)), liveBefore, "le site publié n'a pas changé : rien n'est publié");
    const cust = await boss.get(`/marketing/site-web/personnaliser?site=${A}`);
    assert.equal(cust.status, 200, "le personnalisateur natif ouvre le brouillon");
    assert.equal(db.prepare("SELECT status FROM mk_design_runs WHERE id = ?").get(rid).status, "applied");
  });
  test("K. réglage manuel protégé : conservé par défaut, remplacé seulement sur demande ; réglages en attente du brouillon conservés", async () => {
    const site = (await (async () => { await boss.post("/marketing/site-web/sites", { name: "Design K" }); return db.prepare("SELECT id FROM mk_sites WHERE name = 'Design K'").get().id; })());
    const t = live(site); t.colors.primary = "#123456"; db.prepare("UPDATE mk_sites SET tokens = ? WHERE id = ?").run(JSON.stringify(t), site);
    db.prepare("INSERT INTO cms_customizer_drafts (site_id, changes, rev, base_rev, updated_by) VALUES (?, ?, 1, 0, 1)").run(site, JSON.stringify({ "tokens.colors.accent": "#abcdef" }));
    const rid = await run(boss, site);
    const cmp = await boss.get(G(site, `/${rid}?variante=a`));
    assert.match(cmp.text, /protégé\(s\)/); assert.match(cmp.text, /Remplacer \(réglage à vous\)/);
    await boss.post(G(site, `/${rid}/appliquer`), { variante: "a" });
    let d = draft(site);
    assert.equal(d.changes["tokens.colors.accent"], "#abcdef", "réglage en attente conservé");
    assert.equal(d.changes["tokens.colors.primary"], undefined, "réglage manuel publié conservé (primaire #123456)");
    assert.ok(d.changes["tokens.fonts.heading"], "le reste est appliqué");
    const rid2 = await run(boss, site);
    await boss.post(G(site, `/${rid2}/appliquer`), { variante: "a", remplacer: ["tokens.colors.primary"] });
    d = draft(site);
    assert.ok(d.changes["tokens.colors.primary"] && d.changes["tokens.colors.primary"] !== "#123456", "remplacé sur demande explicite");
    assert.equal(d.changes["tokens.colors.accent"], "#abcdef", "toujours conservé");
  });
  test("annulation : le brouillon retrouve son état ; refusée si le brouillon a changé depuis", async () => {
    await boss.post("/marketing/site-web/sites", { name: "Design U" });
    const site = db.prepare("SELECT id FROM mk_sites WHERE name = 'Design U'").get().id;
    const rid = await run(boss, site);
    await boss.post(G(site, `/${rid}/appliquer`), { variante: "b" });
    assert.ok(draft(site));
    await boss.post(G(site, `/${rid}/annuler`), {});
    assert.equal(draft(site), null, "retour à l'état d'avant (aucun brouillon)");
    assert.equal(db.prepare("SELECT status FROM mk_design_runs WHERE id = ?").get(rid).status, "undone");
    const rid2 = await run(boss, site);
    await boss.post(G(site, `/${rid2}/appliquer`), { variante: "a" });
    db.prepare("UPDATE cms_customizer_drafts SET rev = rev + 1 WHERE site_id = ?").run(site);
    await boss.post(G(site, `/${rid2}/annuler`), {});
    assert.ok(draft(site), "brouillon modifié depuis : annulation refusée, rien écrasé");
    assert.equal(db.prepare("SELECT status FROM mk_design_runs WHERE id = ?").get(rid2).status, "applied");
  });
  test("variante inconnue, proposition altérée (contraste dégradé) ou brief vide : refus, aucun brouillon", async () => {
    await boss.post("/marketing/site-web/sites", { name: "Design X" });
    const site = db.prepare("SELECT id FROM mk_sites WHERE name = 'Design X'").get().id;
    assert.equal(await run(boss, site, "   ", ""), null, "brief vide refusé");
    const rid = await run(boss, site);
    await boss.post(G(site, `/${rid}/appliquer`), { variante: "z" });
    assert.equal(draft(site), null);
    const props = JSON.parse(db.prepare("SELECT proposals FROM mk_design_runs WHERE id = ?").get(rid).proposals);
    props[0].design.palette.text = props[0].design.palette.background;
    db.prepare("UPDATE mk_design_runs SET proposals = ? WHERE id = ?").run(JSON.stringify(props), rid);
    await boss.post(G(site, `/${rid}/appliquer`), { variante: props[0].key });
    assert.equal(draft(site), null, "design altéré : jamais appliqué");
  });
  test("M. isolation et droits : site B inaccessible depuis A, lecteur sans écriture, anonyme renvoyé à la connexion", async () => {
    const rid = await run(boss, A);
    assert.equal((await adminA.get(G(A))).status, 200);
    for (const p of [G(B), G(B, `/${rid}`), G(A, `/${rid}`).replace(`/${A}/`, `/${B}/`)]) assert.ok([403, 404].includes((await adminA.get(p)).status), p);
    assert.ok([403, 404].includes((await adminB.get(G(A, `/${rid}`))).status));
    const before = db.prepare("SELECT COUNT(*) n FROM mk_design_runs").get().n;
    await adminA.post(G(B, "/generer"), { brief: IMMO }); await viewerA.post(G(A, "/generer"), { brief: IMMO });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_design_runs").get().n, before);
    const dB = draft(B);
    await adminA.post(G(B, `/${rid}/appliquer`), { variante: "a" }); await viewerA.post(G(A, `/${rid}/appliquer`), { variante: "a" });
    assert.deepEqual(draft(B), dB, "le style du site B n'a pas bougé");
    const anon = await new Client(srv.base).get(G(A)); assert.equal(anon.status, 302); assert.match(anon.location, /connexion/);
  });
  test("N. régression : le générateur de pages suit la direction appliquée au site", async () => {
    await boss.post("/marketing/site-web/sites", { name: "Design P" });
    const site = db.prepare("SELECT id FROM mk_sites WHERE name = 'Design P'").get().id;
    const rid = await run(boss, site);
    await boss.post(G(site, `/${rid}/appliquer`), { variante: "a" });
    const plan = JSON.stringify({ version: 1, site: { name: "P" }, pages: [{ name: "Page Design P", type: "autre", sections: [{ kind: "hero", title: "Bonjour" }, { kind: "text", text: "Texte" }] }] });
    const r = await boss.post(`/marketing/site-web/sites/${site}/generateur/generer`, { plan });
    const gid = Number(/generateur\/(\d+)/.exec(r.location)[1]);
    await boss.post(`/marketing/site-web/sites/${site}/generateur/${gid}/appliquer`, { "strategie_page-design-p": "create" });
    const row = db.prepare("SELECT id FROM mk_landing_pages WHERE name = 'Page Design P'").get();
    const secs = JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(row.id).draft).sections;
    assert.equal(secs[0].style.padding, "xl"); assert.equal(secs[0].style.align, "left");
    assert.equal((await boss.get(`/marketing/pages/${row.id}/editeur`)).status, 200, "la page reste modifiable dans l'éditeur");
  });
});
