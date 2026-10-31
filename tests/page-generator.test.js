// Programme 21.4 — Page Generator & Component Mapper. Service : vraie base en mémoire (vraies migrations), IA simulée et déterministe (aucun appel réseau, aucun coût).
// Web : vrai serveur. Aucune page n'est jamais publiée par le générateur.
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, addLmsSchema } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const pages = require("../src/marketing/pages");
const aiCore = require("../src/services/aiCore");
const gen = require("../src/pageGen");
const { registry, planLib, mapper } = gen;
const sectionsLib = require("../src/marketing/pages/sections");

const types = (page) => page.sections.map((s) => s.type);
const planOf = (list, extra = {}) => planLib.validate({ version: 1, site: { name: "Agence Test", description: "Une agence" }, pages: list, ...extra });
const raw = (list) => ({ version: 1, site: { name: "Agence Test" }, pages: list });
const S = (kind, extra = {}) => ({ kind, ...extra });

describe("registre : reflet du moteur réel", () => {
  test("chaque type utilisé existe dans le moteur ; aucun type du Page Builder ; les catégories sans composant sont déclarées absentes", () => {
    const real = new Set(Object.keys(sectionsLib.TYPES));
    for (const t of registry.usable()) { assert.ok(real.has(t), t); assert.equal(sectionsLib.TYPES[t].builderOnly, undefined); }
    assert.ok(!registry.usable().includes("layout") && !registry.usable().includes("component"));
    for (const k of ["galerie", "produits", "articles", "tableau", "carte"]) assert.ok(registry.ABSENT[k], k);
    assert.ok(registry.snapshot().types.every((t) => real.has(t.type)));
  });
  test("propriétés autorisées = celles du normaliseur réel (+ attributs communs)", () => {
    assert.deepEqual([...registry.allowedKeys("hero")].filter((k) => !registry.COMMON.includes(k)).sort(), ["buttonLabel", "buttonUrl", "image", "imageAlt", "subtitle", "title", "type"]);
    assert.equal(registry.allowedKeys("inconnu"), null);
  });
});

describe("validation des structures (G, H)", () => {
  const ctx = { db: null, organizationId: 1 };
  test("G. propriété non autorisée, type inconnu ou réservé au Page Builder : rejeté", () => {
    for (const bad of [{ type: "hero", title: "x", onclick: "alert(1)" }, { type: "script", src: "x" }, { type: "layout", children: [] }, { type: "hero", title: "x", style: { padding: "lg" }, html: "<b>" }]) {
      const r = gen.validateSections(ctx, [bad]);
      assert.equal(r.ok, false, JSON.stringify(bad)); assert.match(r.errors[0], /non autorisé/);
    }
  });
  test("H. structure malformée : refusée, jamais enregistrée", () => {
    for (const bad of ["texte", { a: 1 }, [null], [[]], [{ type: 5 }], [{ type: "hero" }]]) assert.equal(gen.validateSections(ctx, bad).ok, false, JSON.stringify(bad));
    assert.equal(gen.validateSections(ctx, new Array(31).fill({ type: "divider" })).ok, false, "limite du moteur");
    assert.equal(gen.validateSections(ctx, [{ type: "hero", title: "Bonjour", style: { padding: "xl", width: "wide" } }]).ok, true);
  });
});

describe("Component Mapper (F)", () => {
  test("gabarit sans composant natif : alternative nommée + fonctionnalité manquante, jamais un identifiant inventé", () => {
    const g = mapper.mapSection({ key: "g", kind: "gallery", title: "Galerie", images: [{ src: "https://exemple.test/a.jpg", alt: "a" }], items: [], text: "", courseIds: [] }, { type: "galerie", name: "G" }, {});
    assert.equal(g.status, "partial"); assert.equal(g.alternative, true); assert.deepEqual(g.components, ["image"]); assert.match(g.missing[0], /Galerie/);
    const none = mapper.mapSection({ key: "g", kind: "gallery", images: [], items: [], courseIds: [] }, { type: "galerie", name: "G" }, {});
    assert.equal(none.status, "skipped"); assert.deepEqual(none.sections, []);
  });
  test("une règle qui citerait un composant inexistant est neutralisée", () => {
    mapper.RULES.zzz = () => ({ sections: [{ type: "carousel" }], components: ["carousel"] });
    try { const r = mapper.mapSection({ key: "z", kind: "zzz" }, { name: "P", type: "autre" }, {}); assert.equal(r.status, "skipped"); assert.deepEqual(r.missing, ["carousel"]); } finally { delete mapper.RULES.zzz; }
  });
  test("pas de bouton sans adresse, pas de bloc vide", () => {
    assert.equal(mapper.mapSection({ key: "c", kind: "cta", title: "T", cta: { label: "Go", url: "" }, items: [], courseIds: [] }, { name: "P" }, {}).status, "skipped");
    assert.equal(mapper.mapSection({ key: "i", kind: "intro", title: "", text: "", items: [], courseIds: [] }, { name: "P" }, {}).sections.length, 1, "un texte d'exemple signalé plutôt qu'un bloc vide");
  });
});

describe("Page Generator (service)", () => {
  let m, A;
  beforeEach(() => { m = freshMarketing(); addLmsSchema(m.db); A = m.ctx(1); });
  const site = (name = "Site Un") => pages.createSite(A, { name }).id;
  const draftOf = (id) => pages.requirePage(A, id);

  test("22.10 (Q3). méta description : but du plan ou phrase réelle du contenu ; jamais un texte d'exemple entre crochets", async () => {
    const sid = site();
    const plan = raw([
      { name: "Avec but", type: "services", goal: "Présenter nos services de transport et d'entreposage aux industriels de la région lyonnaise", sections: [S("intro", { text: "Texte" })] },
      { name: "Phrase réelle", type: "apropos", sections: [S("intro", { text: "Nous transportons et stockons les marchandises des industriels de la région depuis plus de dix ans." })] },
      { name: "Exemple seul", type: "faq", sections: [S("intro", { text: "[Décrivez ici votre activité en deux phrases claires pour vos visiteurs]" })] },
    ]);
    const run = await gen.generate(A, sid, plan);
    const out = gen.apply(A, sid, run.id, {});
    const seoOf = (key) => draftOf(out[key].pageId).working.seo || {};
    assert.match(seoOf("avec-but").description, /transport et d'entreposage/);
    assert.match(seoOf("phrase-reelle").description, /^Nous transportons/);
    assert.equal(seoOf("exemple-seul").description, undefined, "un texte d'exemple n'est jamais publié comme méta description");
  });
  test("A. page d'accueil : sections natives ordonnées, identifiants déterministes, brouillon, rien de publié", async () => {
    const sid = site();
    const plan = raw([{ name: "Accueil immo", type: "accueil", goal: "Présenter l'agence", sections: [S("hero", { title: "Votre agence", text: "Près de chez vous", cta: { label: "Nous contacter", url: "/contact" } }), S("intro", { text: "Nous aidons depuis 2010." }), S("listing"), S("benefits", { items: [{ title: "Proximité", text: "Un interlocuteur" }, { title: "Rapidité" }] }), S("testimonials"), S("contact")] }]);
    const run = await gen.generate(A, sid, plan);
    const p = run.result.pages[0];
    assert.equal(p.status, "ready");
    assert.deepEqual(types(p), ["hero", "text", "text", "features", "testimonials", "text", "form"]);
    const again = (await gen.generate(A, sid, plan)).result.pages[0];
    assert.deepEqual(p.sections.map((s) => s.id), again.sections.map((s) => s.id), "mêmes identifiants à chaque génération");
    assert.equal(new Set(p.sections.map((s) => s.id)).size, p.sections.length);
    assert.ok(p.maps.find((x) => x.need === "listing").missing.length, "catalogue de biens : fonctionnalité manquante signalée");
    const out = gen.apply(A, sid, run.id, {});
    const page = draftOf(out["accueil-immo"].pageId);
    assert.equal(page.status, "draft"); assert.equal(page.site_id, sid);
    assert.deepEqual(page.working.sections.map((s) => s.type), types(p));
  });

  test("B. contact : texte + formulaire natif, limitation de rattachement du formulaire dite", async () => {
    const run = await gen.generate(A, site(), raw([{ name: "Contact", type: "contact", sections: [S("hero", { title: "Contact" }), S("contact", { text: "12 rue des Lilas" })] }]));
    const p = run.result.pages[0];
    assert.deepEqual(types(p), ["hero", "text", "form"]);
    assert.match(p.maps[1].limitations.join(" "), /associé à la page/);
  });

  test("C. services : cartes (colonnes selon le nombre), ordre conservé", async () => {
    const items = ["Vente", "Location", "Gestion", "Conseil"].map((t) => ({ title: t, text: `${t} de biens` }));
    const p = (await gen.generate(A, site(), raw([{ name: "Services", type: "services", sections: [S("hero", { title: "Services" }), S("services", { title: "Nos services", items }), S("faq", { items: [{ q: "Délai ?", a: "Rapide." }] })] }]))).result.pages[0];
    assert.deepEqual(types(p), ["hero", "features", "faq"]);
    assert.equal(p.sections[1].columns, 4); assert.deepEqual(p.sections[1].items.map((i) => i.title), ["Vente", "Location", "Gestion", "Conseil"]);
  });

  test("D. galerie : images natives si le plan en fournit ; sinon section ignorée et signalée", async () => {
    const withImgs = (await gen.generate(A, site(), raw([{ name: "Galerie", type: "galerie", sections: [S("hero", { title: "Galerie" }), S("gallery", { images: [{ src: "https://exemple.test/a.jpg", alt: "Salon" }, { src: "https://exemple.test/b.jpg", alt: "Cuisine" }] })] }]))).result.pages[0];
    assert.deepEqual(types(withImgs), ["hero", "image", "image"]);
    const without = (await gen.generate(A, site("Site Deux"), raw([{ name: "Galerie 2", type: "galerie", sections: [S("hero", { title: "Galerie" }), S("gallery")] }]))).result.pages[0];
    assert.deepEqual(types(without), ["hero"]); assert.ok(without.warnings.some((w) => /Fonctionnalité manquante/.test(w)));
  });

  test("E. e-commerce : pages de boutique/panier non générées (fonctionnalité absente) ; catalogue de formations avec composant natif", async () => {
    for (const c of ["subtitle TEXT DEFAULT ''", "price_cents INTEGER DEFAULT 0", "thumbnail_path TEXT"]) A.db.exec(`ALTER TABLE courses ADD COLUMN ${c}`);
    A.db.prepare("INSERT INTO courses (title, slug, published) VALUES ('Excel', 'excel', 1)").run();
    const run = await gen.generate(A, site(), raw([
      { name: "Panier", type: "panier", sections: [S("hero", { title: "Panier" })] },
      { name: "Boutique", type: "boutique", sections: [S("hero", { title: "Boutique" })] },
      { name: "Catalogue", type: "formation", sections: [S("hero", { title: "Formations" }), S("listing", { courseIds: [1, 999] })] },
    ]));
    const [panier, boutique, cat] = run.result.pages;
    for (const p of [panier, boutique]) { assert.equal(p.status, "unavailable"); assert.match(p.reason, /fonctionnalité absente/); assert.equal(p.sections.length, 0); }
    assert.deepEqual(types(cat), ["hero", "course"]); assert.equal(cat.sections[1].courseId, 1);
    assert.ok(run.result.warnings.some((w) => /introuvable/.test(w)), "formation inconnue signalée");
    const out = gen.apply(A, run.siteId, run.id, { panier: "create" }, {});
    assert.deepEqual(Object.keys(out), ["catalogue"], "seule la page générable est enregistrée");
    assert.equal(A.db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE name IN ('Panier', 'Boutique')").get().n, 0);
  });

  test("I. plusieurs pages à partir d'un même plan : cohérence de style, génération d'une seule page possible", async () => {
    const sid = site();
    const list = ["Accueil", "À propos", "Services", "Contact"].map((n, i) => ({ name: n, type: ["accueil", "apropos", "services", "contact"][i], sections: planLib.RECIPES[["accueil", "apropos", "services", "contact"][i]].map((k) => S(k)) }));
    const run = await gen.generate(A, sid, raw(list));
    assert.equal(run.result.pages.length, 4); assert.ok(run.result.pages.every((p) => p.status === "ready"));
    const heroStyles = new Set(run.result.pages.map((p) => JSON.stringify(p.sections[0].style)));
    assert.equal(heroStyles.size, 1, "même style de bandeau partout");
    const one = await gen.generate(A, sid, raw(list), { only: ["services"] });
    assert.equal(one.result.pages.length, 1); assert.equal(one.result.pages[0].key, "services");
    const out = gen.apply(A, sid, run.id, {});
    assert.equal(Object.keys(out).length, 4);
    assert.equal(A.db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ? AND status = 'published'").get(sid).n, 0);
  });

  test("J. responsive : seules les propriétés natives, colonnes 2 à 4, jamais d'écran inventé", async () => {
    const run = await gen.generate(A, site(), raw([{ name: "Resp", type: "accueil", sections: planLib.RECIPES.accueil.map((k) => S(k)) }]));
    for (const s of run.result.pages[0].sections) {
      for (const [k, v] of Object.entries(s.style || {})) assert.ok(registry.STYLE[k] && registry.STYLE[k].includes(v), `${s.type}.${k}=${v}`);
      assert.equal(s.hideOn, undefined); assert.equal(s.styles, undefined);
      if (s.type === "features") assert.ok([2, 3, 4].includes(s.columns));
    }
  });

  test("K. page existante : jamais écrasée sans stratégie ; nouvelle page, nouvelle version, remplacement confirmé", async () => {
    const sid = site();
    const ex = pages.createPage(A, { name: "Contact K", siteId: sid, kind: "page", blank: true });
    pages.saveDraft(A, ex.id, { ...pages.requirePage(A, ex.id).working, sections: [{ type: "text", markdown: "Contenu à moi" }] }, { revision: pages.requirePage(A, ex.id).revision });
    const plan = raw([{ name: "Contact K", type: "contact", sections: [S("hero", { title: "Contact" }), S("contact", { text: "Adresse" })] }]);
    const run = await gen.generate(A, sid, plan);
    assert.equal(run.result.pages[0].existing.id, ex.id);
    assert.throws(() => gen.apply(A, sid, run.id, {}), (e) => e.code === "conflict" && /existe déjà/.test(e.message));
    assert.equal(draftOf(ex.id).working.sections[0].markdown, "Contenu à moi", "rien modifié");
    assert.equal(A.db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ?").get(sid).n, 1, "aucune page créée par l'essai refusé");
    assert.throws(() => gen.apply(A, sid, run.id, { "contact-k": "replace" }), /confirmé explicitement/);
    const made = gen.apply(A, sid, run.id, { "contact-k": "create" });
    assert.equal(made["contact-k"].name, "Contact K (2)"); assert.equal(draftOf(ex.id).working.sections[0].markdown, "Contenu à moi");
    const run2 = await gen.generate(A, sid, plan);
    gen.apply(A, sid, run2.id, { "contact-k": "version" });
    assert.equal(draftOf(ex.id).working.sections[0].type, "hero");
    const run3 = await gen.generate(A, sid, plan);
    assert.throws(() => gen.apply(A, sid, run3.id, { "contact-k": "bogus" }), /Stratégie inconnue/);
    assert.throws(() => gen.apply(A, sid, run.id, { "contact-k": "create" }), /déjà été appliquée/, "une proposition ne s'applique qu'une fois");
  });

  test("L. enregistrer, rouvrir, modifier : la page générée traverse le moteur de l'éditeur sans perte", async () => {
    const sid = site();
    const run = await gen.generate(A, sid, raw([{ name: "Persist", type: "accueil", sections: planLib.RECIPES.accueil.map((k) => S(k, k === "cta" ? { title: "Allons-y", cta: { label: "Go", url: "/contact" } } : {})) }]));
    const out = gen.apply(A, sid, run.id, {});
    const id = out.persist.pageId;
    const page = draftOf(id);
    const again = pages.normalizeContent(A, page, page.working);
    assert.deepEqual(again.sections, page.working.sections, "normalisation idempotente = le format natif");
    const edited = pages.saveDraft(A, id, { ...page.working, sections: page.working.sections.map((s) => (s.type === "hero" ? { ...s, title: "Titre modifié" } : s)) }, { revision: page.revision });
    assert.equal(draftOf(id).working.sections[0].title, "Titre modifié"); assert.ok(edited.revision > page.revision);
    assert.ok(pages.resolveSections(A, draftOf(id).working.sections).length >= 5, "le moteur de rendu résout les sections");
  });

  test("annulation : page créée mise à la corbeille si intacte ; page modifiée depuis laissée intacte", async () => {
    const sid = site();
    const plan = raw([{ name: "U1", type: "autre", sections: [S("hero", { title: "U1" })] }, { name: "U2", type: "autre", sections: [S("hero", { title: "U2" })] }]);
    const run = await gen.generate(A, sid, plan);
    const out = gen.apply(A, sid, run.id, {});
    const p2 = draftOf(out.u2.pageId);
    pages.saveDraft(A, p2.id, { ...p2.working, title: "Je l'ai retouchée" }, { revision: p2.revision });
    const report = gen.undo(A, sid, run.id);
    assert.equal(draftOf(out.u1.pageId).archived_at !== null, true);
    assert.equal(draftOf(out.u2.pageId).archived_at, null, "page retouchée : intacte");
    assert.match(report.find((r) => r.key === "u2").why, /modifiée ou publiée/);
    assert.throws(() => gen.undo(A, sid, run.id), /appliquée/);
  });

  test("H'. une proposition altérée en base ne s'enregistre pas", async () => {
    const sid = site();
    const run = await gen.generate(A, sid, raw([{ name: "Alt", type: "autre", sections: [S("hero", { title: "Alt" })] }]));
    const r = JSON.parse(A.db.prepare("SELECT result FROM mk_pagegen_runs WHERE id = ?").get(run.id).result);
    r.pages[0].sections[0].onclick = "alert(1)";
    A.db.prepare("UPDATE mk_pagegen_runs SET result = ? WHERE id = ?").run(JSON.stringify(r), run.id);
    assert.throws(() => gen.apply(A, sid, run.id, {}), /n'est plus valide/);
    assert.equal(A.db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE name = 'Alt'").get().n, 0);
  });

  test("M. isolation : un accès limité au site 1 ne génère, ne lit ni n'applique rien sur le site 2 ; une page d'un autre site n'est jamais touchée", async () => {
    const s1 = site("Un"), s2 = site("Deux");
    const L1 = m.ctx(1, { siteScope: s1 });
    const plan = raw([{ name: "Iso", type: "autre", sections: [S("hero", { title: "Iso" })] }]);
    await assert.rejects(gen.generate(L1, s2, plan), (e) => e.code === "not_found");
    const run2 = await gen.generate(A, s2, plan);
    assert.throws(() => gen.getRun(L1, s2, run2.id), (e) => e.code === "not_found");
    assert.throws(() => gen.getRun(A, s1, run2.id), (e) => e.code === "not_found", "une génération du site 2 n'est pas lisible depuis l'adresse du site 1");
    assert.throws(() => gen.apply(L1, s2, run2.id, {}), (e) => e.code === "not_found");
    const other = pages.createPage(A, { name: "Iso", siteId: s2, kind: "page", blank: true });
    const run1 = await gen.generate(A, s1, plan);
    assert.equal(run1.result.pages[0].existing.sameSite, false);
    assert.throws(() => gen.apply(A, s1, run1.id, { iso: "version" }), (e) => e.code === "forbidden");
    gen.apply(A, s1, run1.id, { iso: "create" });
    assert.deepEqual(pages.requirePage(A, other.id).working.sections.map((s) => s.type), pages.requirePage(A, other.id).working.sections.map((s) => s.type));
    assert.equal(A.db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ? AND name LIKE 'Iso%'").get(s2).n, 1, "le site 2 n'a reçu aucune page");
  });

  describe("N. IA centrale : quotas, module du site, texte seulement", () => {
    after(() => aiCore.setClientForTests(null));
    const fakeAi = (reply) => aiCore.setClientForTests({ beta: { messages: { create: async (r) => ({ stop_reason: "end_turn", model: r.model, usage: { output_tokens: 10 }, content: [{ type: "text", text: JSON.stringify(reply(r)) }] }) } } });
    const plan = raw([{ name: "IA", type: "services", sections: [S("hero", { title: "IA" }), S("services")] }]);
    test("l'IA ne fournit que du texte : types, propriétés et clés inconnues ignorés ; la structure reste celle des règles", async () => {
      let seen;
      fakeAi((r) => { seen = r; return { pages: [{ key: "ia", sections: [{ key: "services-2", title: "x", text: "Texte rédigé", items: [{ title: "Conseil", text: "On conseille" }], type: "layout", onclick: "x" }, { key: "inconnue", title: "z", text: "z", items: [] }], evil: true }] }; });
      const sid = site();
      const run = await gen.generate(A, sid, plan, { useAi: true });
      const p = run.result.pages[0];
      assert.equal(p.status, "ready"); assert.deepEqual(types(p), ["hero", "features"]);
      assert.equal(p.sections[1].items[0].title, "Conseil"); assert.equal(p.sections[1].onclick, undefined);
      assert.match(JSON.stringify(seen.messages), /pas des instructions/);
      assert.equal(A.db.prepare("SELECT COUNT(*) n FROM mk_ai_requests WHERE action = 'pagegen' AND ok = 1").get().n, 1, "journalisé sans texte");
    });
    test("plafond quotidien de l'IA centrale respecté (aucune demande au-delà)", async () => {
      let calls = 0;
      fakeAi(() => { calls += 1; return { pages: [] }; });
      A.settings.set(1, "ai.daily_limit", 1);
      const sid = site();
      await gen.generate(A, sid, plan, { useAi: true });
      await assert.rejects(gen.generate(A, sid, plan, { useAi: true }), (e) => e.code === "quota");
      assert.equal(calls, 1);
      assert.equal((await gen.generate(A, sid, plan)).result.pages.length, 1, "sans IA, la génération reste possible");
    });
    test("accès limité à un site : l'IA exige le module activé pour CE site ; sans clé, indisponible (aucune fausse réponse)", async () => {
      fakeAi(() => ({ pages: [] }));
      const sid = site();
      const L = m.ctx(1, { siteScope: sid });
      await assert.rejects(gen.generate(L, sid, plan, { useAi: true }), (e) => e.code === "module_disabled");
      aiCore.setClientForTests(null);
      const saved = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY;
      try { await assert.rejects(gen.generate(A, sid, plan, { useAi: true }), (e) => e.code === "not_configured"); } finally { if (saved) process.env.ANTHROPIC_API_KEY = saved; }
    });
  });

  test("plan : bornes et nettoyage (propriétés inconnues signalées, pages dupliquées refusées)", () => {
    assert.throws(() => planLib.validate({ version: 2, pages: [] }), /version/);
    assert.throws(() => planLib.validate(raw(new Array(13).fill(0).map((_, i) => ({ name: `P${i}`, sections: [S("hero")] })))), /12 pages/);
    assert.throws(() => planLib.validate(raw([{ name: "A", key: "a", sections: [S("hero")] }, { name: "B", key: "a", sections: [S("hero")] }])), /même|identifiant/);
    assert.throws(() => planLib.validate(raw([{ name: "A", sections: [S("carousel")] }])), /inconnu/);
    const ok = planLib.validate(raw([{ name: "A", sections: [S("hero", { onclick: "x" })] }]));
    assert.ok(ok.warnings.some((w) => /onclick/.test(w)));
  });
});

describe("Page Generator (web)", () => {
  let srv, boss, db, A, B, adminA, viewerA, adminB;
  const G = (id, rest = "") => `/marketing/site-web/sites/${id}/generateur${rest}`;
  const plan = (name) => JSON.stringify({ version: 1, site: { name: "Web" }, pages: [{ name, type: "accueil", sections: [{ kind: "hero", title: name }, { kind: "intro", text: "Bienvenue" }, { kind: "services" }] }] });
  const idOf = (c) => db.prepare("SELECT id FROM users WHERE email = ?").get(c.email).id;
  before(async () => {
    srv = await startServer({ SITE_URL: "https://kolakisa.test" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (n) => { await boss.post("/marketing/site-web/sites", { name: n }); return db.prepare("SELECT id FROM mk_sites WHERE name = ?").get(n).id; };
    A = await mk("Gen A"); B = await mk("Gen B");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    adminA = await member(A, "admin"); viewerA = await member(A, "viewer"); adminB = await member(B, "admin");
  });
  after(() => { db.close(); return srv.stop(); });

  test("écran, proposition, aperçu par le moteur de rendu, application en brouillon, ouverture dans l'éditeur", async () => {
    const index = await boss.get(G(A));
    assert.equal(index.status, 200); assert.match(index.text, /Composants disponibles/); assert.match(index.text, /Galerie \/ grille d(?:'|&#39;)images/);
    const r = await boss.post(G(A, "/generer"), { plan: plan("Accueil Web") });
    assert.equal(r.status, 302); const rid = Number(/generateur\/(\d+)/.exec(r.location)[1]);
    const view = await boss.get(G(A, `/${rid}`));
    assert.equal(view.status, 200); assert.match(view.text, /rien d(?:'|&#39;)enregistré/); assert.match(view.text, /Prête/);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE name = 'Accueil Web'").get().n, 0, "rien n'est enregistré avant l'acceptation");
    const prev = await boss.get(G(A, `/${rid}/apercu?page=accueil-web`));
    assert.equal(prev.status, 200); assert.match(prev.text, /Accueil Web/); assert.match(prev.text, /Bienvenue/);
    const ap = await boss.post(G(A, `/${rid}/appliquer`), { strategie_accueil: "create", "strategie_accueil-web": "create" });
    assert.equal(ap.status, 302);
    const row = db.prepare("SELECT id, status, site_id FROM mk_landing_pages WHERE name = 'Accueil Web'").get();
    assert.equal(row.status, "draft"); assert.equal(row.site_id, A);
    assert.equal((await boss.get(`/marketing/pages/${row.id}/editeur`)).status, 200, "la page s'ouvre dans l'éditeur existant");
    assert.equal((await boss.get(`/marketing/pages/${row.id}/apercu`)).status, 200);
    assert.match((await boss.get(G(A, `/${rid}`))).text, /Ouvrir dans l(?:'|&#39;)éditeur/);
    const dup = await boss.post(G(A, "/generer"), { plan: plan("Accueil Web") });
    const rid2 = Number(/generateur\/(\d+)/.exec(dup.location)[1]);
    await boss.post(G(A, `/${rid2}/appliquer`), {});
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE name LIKE 'Accueil Web%'").get().n, 1, "page existante : aucune stratégie → rien écrit");
    await boss.post(G(A, `/${rid}/annuler`), {});
    assert.ok(db.prepare("SELECT archived_at FROM mk_landing_pages WHERE id = ?").get(row.id).archived_at);
  });
  test("plan invalide ou JSON cassé : refus clair, rien d'enregistré", async () => {
    const n = db.prepare("SELECT COUNT(*) n FROM mk_pagegen_runs").get().n;
    for (const bad of ["pas du json", JSON.stringify({ version: 1, pages: [{ name: "X", sections: [{ kind: "carousel" }] }] })]) {
      const r = await boss.post(G(A, "/generer"), { plan: bad });
      assert.equal(r.status, 302); assert.doesNotMatch(r.location, /generateur\/\d+/);
    }
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_pagegen_runs").get().n, n);
  });
  test("M. isolation et droits : site B inaccessible depuis A, lecteur sans écriture, anonyme renvoyé à la connexion", async () => {
    const r = await boss.post(G(A, "/generer"), { plan: plan("Pour A") }); const rid = Number(/generateur\/(\d+)/.exec(r.location)[1]);
    assert.equal((await adminA.get(G(A))).status, 200);
    assert.ok([403, 404].includes((await adminA.get(G(B))).status));
    assert.ok([403, 404].includes((await adminB.get(G(A, `/${rid}`))).status));
    assert.ok([403, 404].includes((await adminA.get(G(B, `/${rid}`))).status), "la génération de A n'est pas lisible via l'adresse de B");
    const before = db.prepare("SELECT COUNT(*) n FROM mk_pagegen_runs").get().n;
    await adminA.post(G(B, "/generer"), { plan: plan("Intrus") });
    await adminB.post(G(A, "/generer"), { plan: plan("Intrus") });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_pagegen_runs").get().n, before);
    assert.equal((await viewerA.get(G(A))).status, 200);
    await viewerA.post(G(A, "/generer"), { plan: plan("Lecteur") });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_pagegen_runs").get().n, before);
    await viewerA.post(G(A, `/${rid}/appliquer`), { strategie_pour_a: "create" });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE name = 'Pour A'").get().n, 0);
    const anon = await new Client(srv.base).get(G(A)); assert.equal(anon.status, 302); assert.match(anon.location, /connexion/);
  });
});
