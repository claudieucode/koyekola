// KOLAKISA — Personnalisation NATIVE ET SPÉCIFIQUE À CHAQUE THÈME : manifestes (un par thème de la bibliothèque), réglages mesurés, aperçu, brouillon, publication,
// isolation par site et par thème, conservation des réglages d'un thème quand on change de thème, bouton « Personnaliser le site ». Vraies routes, vraie base.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const cz = require("../src/marketing/themes/customization");
const lib = require("../src/marketing/themes/library");
const controls = cz.controls;

const KEYS = lib.allMeta().map((m) => m.key);

describe("manifestes de personnalisation : un par thème, mesuré, valide", () => {
  test(`les ${KEYS.length} thèmes ont chacun un manifeste valide, avec des réglages`, () => {
    assert.ok(KEYS.length >= 70);
    const problems = [];
    for (const k of KEYS) { const m = cz.manifestOf(k); const bad = cz.validate(m); if (bad.length) problems.push(`${k} : ${bad.join(" ; ")}`); if (!m.measured) problems.push(`${k} : effets non mesurés`); }
    assert.deepEqual(problems, []);
  });
  test("chaque manifeste propose ses propres options de thème, et seulement des réglages mesurés", () => {
    for (const k of KEYS) {
      const m = cz.manifestOf(k), spec = lib.specOf(k);
      const declared = (spec.options || []).map((o) => o.key).sort();
      const mine = (m.panels.find((p) => p.id === "theme") || { controls: [] }).controls.map((c) => c.optKey).sort();
      assert.deepEqual(mine, declared, `${k} : options du thème`);
      const measured = Object.keys((cz.effects().themes[k] || {}).controls || {});
      const generic = m.panels.filter((p) => p.id !== "theme").flatMap((p) => p.controls.map((c) => c.optKey));
      assert.deepEqual([...generic].sort(), controls.list.filter((c) => measured.includes(c.id)).map((c) => cz.controls.optKey(c.id)).sort(), `${k} : réglages génériques = réglages mesurés`);
    }
  });
  test("les thèmes n'ont pas tous les mêmes réglages (pas de panneau générique identique)", () => {
    const sigs = new Set(KEYS.map((k) => cz.manifestOf(k).panels.flatMap((p) => p.controls.map((c) => c.optKey)).sort().join(",")));
    assert.ok(sigs.size > KEYS.length * 0.6, `${sigs.size} jeux de réglages distincts sur ${KEYS.length} thèmes`);
  });
  test("aucun réglage choisi = aucune règle ; réglage choisi = règle confinée au thème ; valeur invalide refusée", () => {
    for (const k of KEYS) {
      assert.equal(cz.cssFor(k, {}), "");
      assert.equal(cz.cssFor(k, { "z-inconnu": "#ff0000" }), "");
      for (const pn of cz.manifestOf(k).panels) for (const c of pn.controls) {
        if (c.source !== "generic") continue;
        const good = c.kind === "color" ? "#123456" : c.kind === "number" ? String(c.max) : c.kind === "toggle" ? "on" : String(c.options[c.options.length - 1][0]);
        const css = cz.cssFor(k, { [c.optKey]: good });
        assert.ok(css.includes(`body[data-kw-pack="${k}"]`) && !css.includes("<"), `${k}/${c.optKey}`);
        const bad = c.kind === "color" ? "red;}body{display:none" : c.kind === "number" ? String(c.max + 1000) : c.kind === "toggle" ? "oui" : "x;}";
        assert.equal(cz.cssFor(k, { [c.optKey]: bad }), "", `${k}/${c.optKey} : valeur refusée`);
      }
    }
  });
  test("la valeur par défaut d'un réglage est celle du design d'origine : elle est refusée si elle sort des bornes", () => {
    for (const k of KEYS) for (const pn of cz.manifestOf(k).panels) for (const c of pn.controls) if (c.default !== "") assert.notEqual(cz.cleanValue(c, c.default), null, `${k}/${c.optKey} = ${c.default}`);
  });
});

describe("personnalisation d'un thème : aperçu, brouillon, publication, isolation, changement de thème", () => {
  let srv, boss, db, orgId, S1, S2, S3, P1, P2, P3;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const PZ = "/marketing/site-web/personnaliser";
  const bootOf = (html) => JSON.parse(html.match(/<script type="application\/json" id="kwc-boot">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, "<"));
  const json = (r) => { try { return JSON.parse(r.text); } catch { return null; } };
  const post = (path, site, body) => boss.postJson(`${PZ}${path}?site=${site}`, { site: String(site), ...body });
  const manifest = (k) => lib.manifests().find((x) => x.key === k);
  const mkSite = (name, key) => {
    const id = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, ?)").run(orgId, name, name.toLowerCase(), JSON.stringify(manifest(key).tokens)).lastInsertRowid);
    const sections = lib.pageSections(key, "accueil").map((x, i) => ({ ...x, id: x.id || `a${String(i).padStart(11, "0")}` }));
    const page = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, 'Accueil', ?, 'published', 'page', ?, datetime('now'))").run(orgId, `Accueil ${name}`, `p-${name.toLowerCase()}`, JSON.stringify(sections), id).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(page, id);
    return [id, page];
  };
  const pub = (slug) => boss.get(`/p/${slug}`);
  const tokensOf = (id) => JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", id).tokens);
  const firstGeneric = (k, kind) => cz.manifestOf(k).panels.flatMap((p) => p.controls).find((c) => c.source === "generic" && c.kind === kind);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    [S1, P1] = mkSite("Alpha", "abysse"); [S2, P2] = mkSite("Beta", "abysse"); [S3, P3] = mkSite("Gamma", "albergo");
    // Thème réellement installé et actif (comme après un clic sur « Activer ») : le site a ses jetons et sa ligne dans cms_themes
    for (const [s, k] of [[S1, "abysse"], [S2, "abysse"], [S3, "albergo"]]) {
      const i = await boss.post(`/marketing/site-web/themes/installer?site=${s}`, { site: String(s), key: k });
      assert.ok([200, 302, 303].includes(i.status), `installer ${k}: ${i.status}`);
      const a = await boss.post(`/marketing/site-web/themes/${k}/activer?site=${s}`, { site: String(s) });
      assert.ok([200, 302, 303].includes(a.status), `activer ${k}: ${a.status}`);
      assert.equal(one("SELECT theme_key FROM cms_themes WHERE site_id = ? AND active = 1", s).theme_key, k);
    }
  });
  after(() => { db.close(); return srv.stop(); });

  test("l'écran d'un site à thème propose les réglages DE CE THÈME, pas ceux d'un autre", async () => {
    const a = bootOf((await boss.get(`${PZ}?site=${S1}`)).text), g = bootOf((await boss.get(`${PZ}?site=${S3}`)).text);
    const ids = (b) => b.panels.flatMap((p) => p.controls.map((c) => c.id));
    assert.ok(a.panels.some((p) => p.id === "tp-theme"), "panneau « Spécifique au thème »");
    assert.ok(ids(a).includes("tokens.pack.options.bubbles"), "option propre à abysse");
    assert.ok(!ids(g).includes("tokens.pack.options.bubbles"), "albergo n'a pas l'option d'abysse");
    assert.notDeepEqual(ids(a), ids(g));
    for (const b of [a, g]) for (const id of ids(b).filter((i) => i.startsWith("tokens.pack.options.z-"))) assert.ok(controls.fromOptKey(id.slice("tokens.pack.options.".length)), id);
    // l'aperçu ne montre que des réglages mesurés : un réglage du moteur sans effet sur abysse n'est pas proposé
    const eff = cz.staticFor("abysse");
    const staticIds = ids(a).filter((i) => !i.startsWith("tokens.pack.") && i.startsWith("tokens."));
    for (const i of staticIds) assert.ok(eff.has(i), `${i} proposé sans effet mesuré`);
  });
  test("aperçu : un réglage de thème met à jour le CSS d'aperçu ; la page publique ne change pas avant publication", async () => {
    const c = firstGeneric("abysse", "color");
    const id = `tokens.pack.options.${c.optKey}`;
    const r = json(await post("/rendu", S1, { changes: { [id]: "#12ab34" } }));
    assert.ok(r.ok && r.assets.pack.cz.includes('body[data-kw-pack="abysse"]') && r.assets.pack.cz.includes("#12ab34"));
    assert.equal(r.structural, false);
    assert.ok(!(await pub("p-alpha")).text.includes("kw-pack-cz"), "pas de réglage en ligne avant publication");
    const o = json(await post("/rendu", S1, { changes: { "tokens.pack.options.accent": "#ff00aa" } }));
    assert.ok(o.assets.pack.vars.includes("--pk-accent:#ff00aa") && o.assets.pack.attr.includes('data-kw-pack="abysse"'));
  });
  test("réglage d'un AUTRE thème, valeur invalide, réglage inconnu : refusés", async () => {
    const foreign = firstGeneric("albergo", "color");
    const alb = cz.manifestOf("albergo").panels.flatMap((p) => p.controls).find((c) => c.source === "theme" && c.optKey === "brass");
    assert.equal((await post("/rendu", S1, { changes: { [`tokens.pack.options.${alb.optKey}`]: "#123456" } })).status, 422);
    void foreign;
    const c = firstGeneric("abysse", "number");
    assert.equal((await post("/rendu", S1, { changes: { [`tokens.pack.options.${c.optKey}`]: c.max + 999 } })).status, 422);
    assert.equal((await post("/rendu", S1, { changes: { "tokens.pack.options.z-nexiste-pas": "#123456" } })).status, 422);
    assert.equal((await post("/rendu", S1, { changes: { "tokens.pack.options.accent": "pas-une-couleur" } })).status, 422);
  });
  test("brouillon puis publication : le site public applique les réglages, l'autre site (même thème) reste intact", async () => {
    const c = firstGeneric("abysse", "color"), n = firstGeneric("abysse", "number");
    const changes = { [`tokens.pack.options.${c.optKey}`]: "#12ab34", [`tokens.pack.options.${n.optKey}`]: n.max, "tokens.pack.options.accent": "#ff00aa" };
    const d = json(await post("/brouillon", S1, { changes }));
    assert.ok(d.ok && d.draft.count === 3);
    assert.ok(!(await pub("p-alpha")).text.includes("kw-pack-cz"), "un brouillon n'est pas public");
    const p = json(await post("/publier", S1, { rev: d.draft.rev }));
    assert.ok(p.ok, JSON.stringify(p));
    const html = (await pub("p-alpha")).text;
    assert.ok(html.includes('id="kw-pack-cz"') && html.includes("#12ab34") && html.includes("--pk-accent:#ff00aa"));
    const saved = tokensOf(S1).pack.options;
    assert.equal(saved[c.optKey], "#12ab34"); assert.equal(saved.accent, "#ff00aa");
    assert.ok(!(await pub("p-beta")).text.includes("kw-pack-cz"), "site B (même thème) intact");
    assert.ok(!(await pub("p-gamma")).text.includes("#12ab34"), "site C intact");
    // rechargement : les valeurs sont celles enregistrées ; une valeur égale au défaut n'est plus un changement
    const boot = bootOf((await boss.get(`${PZ}?site=${S1}`)).text);
    assert.equal(boot.values[`tokens.pack.options.${c.optKey}`], "#12ab34");
    assert.equal(Object.keys(boot.changes).length, 0);
  });
  test("le thème actif garde ses réglages quand l'écran d'options du thème est enregistré", async () => {
    const themes = require("../src/marketing/../services/themes");
    void themes;
    const r = await boss.post(`/marketing/site-web/themes/abysse/options?site=${S1}`, { site: String(S1), opt_accent: "#00ffcc" });
    assert.ok([200, 302, 303].includes(r.status), String(r.status));
    const o = tokensOf(S1).pack.options;
    assert.equal(o.accent, "#00ffcc");
    assert.ok(Object.keys(o).some((k) => k.startsWith("z-")), "les réglages du personnalisateur ne sont pas effacés");
  });
  test("changer de thème dans le personnalisateur : essai dans l'aperçu, publication, et retour = réglages restaurés", async () => {
    const before = tokensOf(S1).pack.options;
    const d = json(await post("/brouillon", S1, { changes: { "theme.key": "albergo" } }));
    assert.ok(d.ok, JSON.stringify(d));
    // l'écran, ouvert sur ce brouillon, propose les réglages d'albergo
    const b = bootOf((await boss.get(`${PZ}?site=${S1}`)).text);
    const ids = b.panels.flatMap((p) => p.controls.map((c) => c.id));
    assert.ok(!ids.includes("tokens.pack.options.bubbles"), "plus les options d'abysse");
    assert.equal(b.values["theme.key"], "albergo");
    assert.equal(tokensOf(S1).pack.key, "abysse", "rien n'est publié avant « Publier »");
    const p = json(await post("/publier", S1, { rev: d.draft.rev }));
    assert.ok(p.ok, JSON.stringify(p));
    assert.equal(tokensOf(S1).pack.key, "albergo");
    assert.ok(!Object.keys(tokensOf(S1).pack.options).some((k) => k.startsWith("z-")), "le nouveau thème part de ses valeurs d'origine");
    const stash = one("SELECT options FROM cms_theme_settings WHERE site_id = ? AND theme_key = 'abysse'", S1);
    assert.deepEqual(JSON.parse(stash.options), before, "réglages d'abysse rangés, pas perdus");
    // retour à abysse : restaurés
    const d2 = json(await post("/brouillon", S1, { changes: { "theme.key": "abysse" } }));
    const p2 = json(await post("/publier", S1, { rev: d2.draft.rev }));
    assert.ok(p2.ok, JSON.stringify(p2));
    assert.deepEqual(tokensOf(S1).pack.options, before);
    assert.ok((await pub("p-alpha")).text.includes("#12ab34"), "le rendu public retrouve les réglages");
  });
  test("le bouton « Personnaliser le site » de l'aperçu d'un thème ouvre le personnalisateur du bon site et du bon thème", async () => {
    const r = await boss.get(`/marketing/site-web/themes/albergo/apercu?site=${S2}`);
    assert.equal(r.status, 200);
    const href = (r.text.match(/data-tp-customize href="([^"]+)"/) || [])[1];
    assert.ok(href && /Personnaliser le site/.test(r.text), "bouton présent");
    assert.equal(href.replace(/&amp;/g, "&"), `/marketing/site-web/personnaliser?site=${S2}&theme=albergo`);
    const z = await boss.get(href.replace(/&amp;/g, "&"));
    assert.equal(z.status, 200);
    const b = bootOf(z.text);
    assert.equal(b.siteId, S2);
    assert.equal(b.values["theme.key"], "albergo", "le thème montré est essayé dans le brouillon");
    assert.equal(tokensOf(S2).pack.key, "abysse", "rien de publié");
    assert.ok(b.panels.some((p) => p.id === "tp-theme") && !b.panels.flatMap((p) => p.controls.map((c) => c.id)).includes("tokens.pack.options.bubbles"));
  });
});
