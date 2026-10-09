// Bibliothèque de blocs de l'éditeur d'e-mails : registre (identifiants stables, catégories, recherche) et ensembles prêts à l'emploi.
// Chaque ensemble est compilé par le VRAI moteur (aperçu serveur) une fois ses adresses vides complétées : aucun bloc promis sans rendu.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const catalog = require("../src/marketing/templates/catalog");
const { TYPES } = require("../src/marketing/templates/blocks");
const { icon } = require("../src/utils/icons");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const names = (q) => catalog.search(q).map((e) => e.name);

describe("registre des blocs", () => {
  test("identifiants stables et uniques, catégories connues, icônes existantes", () => {
    const ids = catalog.ENTRIES.map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length);
    const cats = new Set(catalog.CATEGORIES.map(([k]) => k));
    for (const e of catalog.ENTRIES) {
      assert.match(e.id, /^email\.[a-z-]+$/);
      assert.ok(cats.has(e.category), `${e.id} : catégorie ${e.category}`);
      assert.ok(e.name && e.description && e.keywords, e.id);
      assert.ok(icon(e.icon, { size: 18 }).includes("<svg"), `${e.id} : icône ${e.icon}`);
    }
    assert.equal(catalog.CATEGORIES.length, 18);
  });
  test("les 16 types existants et les 3 ensembles d'origine sont tous conservés", () => {
    for (const t of TYPES) assert.ok(catalog.ENTRIES.some((e) => e.kind === "block" && e.key === t), `type ${t} absent du registre`);
    for (const k of ["gif", "cta", "offer"]) assert.ok(catalog.ENTRIES.some((e) => e.kind === "preset" && e.key === k), k);
  });
  test("chaque entrée « bloc » est un type du moteur ; chaque entrée « ensemble » a sa définition", () => {
    for (const e of catalog.ENTRIES) {
      if (e.kind === "block") assert.ok(TYPES.includes(e.key), e.id);
      else assert.equal(typeof catalog.PRESETS[e.key], "function", e.id);
    }
    for (const k of Object.keys(catalog.PRESETS)) assert.ok(catalog.ENTRIES.some((e) => e.kind === "preset" && e.key === k), `ensemble ${k} sans entrée`);
  });
  test("recherche : synonymes, accents, plusieurs mots, classement par nom", () => {
    assert.ok(names("photo").includes("Image"));
    assert.ok(names("achat").includes("Bouton") && names("achat").includes("Formation"));
    for (const n of ["Coupon", "Offre", "Promotion limitée"]) assert.ok(names("vente").includes(n), n);
    assert.equal(names("social")[0], "Réseaux sociaux");
    assert.ok(names("PRÉNOM").includes("Message personnalisé"));
    assert.ok(names("compte rebours").includes("Date limite"));
    assert.deepEqual(names("zzzxyz"), []);
    assert.equal(catalog.search("").length, catalog.ENTRIES.length);
  });
});

describe("le client lit ses ensembles dans le registre", () => {
  test("plus de définition en double : le script ne garde que le repli et les lit depuis data.presets", () => {
    const js = fs.readFileSync(require.resolve("../public/js/marketing-editor.js"), "utf8");
    assert.match(js, /data\.presets\[key\]/);
  });
});

describe("ensembles compilés par le moteur", () => {
  let srv, boss;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SMTP_HOST: "" });
    boss = await loginInstructor(srv);
  });
  after(() => srv && srv.stop());
  const fill = (blocks) => blocks.map((b, i) => ({ id: `p${i}`, ...b, ...(b.type === "image" ? { src: "https://exemple.fr/a.png", alt: "Illustration" } : {}), ...(b.url === "" ? { url: "https://exemple.fr/page" } : {}) }));
  for (const [key, make] of Object.entries(catalog.PRESETS)) {
    test(`ensemble « ${key} » : tous ses blocs se compilent et s'affichent`, async () => {
      const entry = catalog.ENTRIES.find((e) => e.key === key && e.kind === "preset");
      const template = { kind: entry.transactional ? "transactional" : "marketing", subject: "Essai", preheader: "Essai", blocks: fill(make()) };
      const r = await boss.postJson("/marketing/modeles/apercu", { template, mode: "preview" });
      assert.equal(r.status, 200, r.text.slice(0, 200));
      const j = JSON.parse(r.text);
      assert.deepEqual(j.blockErrors, [], JSON.stringify(j.blockErrors));
      assert.ok(j.html.includes("<table"), key);
      assert.doesNotMatch(j.html, /<script|<form|<iframe/i);
    });
  }
  test("l'éditeur affiche toutes les entrées du registre, groupées par catégorie, avec recherche et filtres", async () => {
    const id = Number((await boss.post("/marketing/modeles", { name: "Palette", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
    const page = (await boss.get(`/marketing/modeles/${id}`)).text;
    for (const e of catalog.ENTRIES) assert.ok(page.includes(`data-id="${e.id}"`), e.id);
    assert.match(page, /id="mk-palette-search"/);
    assert.match(page, /data-filter="ecommerce"/);
    assert.match(page, /data-filter="mine"/);
    assert.match(page, /id="mk-palette-mine"/);
  });
});

describe("blocs enregistrés (« Mes blocs ») : routes et validation", () => {
  let srv, boss;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SMTP_HOST: "" }); boss = await loginInstructor(srv); });
  after(() => srv && srv.stop());
  const post = (url, json) => boss.request(url, { method: "POST", json, headers: { Origin: srv.base } });
  test("création, doublon refusé, types inconnus refusés, identifiants retirés, suppression", async () => {
    const ok = await post("/marketing/modeles/blocs-enregistres", { name: "Mon bandeau", blocks: [{ id: "x1", type: "heading", text: "Salut", level: 2, align: "center" }, { id: "x2", type: "button", label: "Go", url: "https://exemple.fr" }] });
    assert.equal(ok.status, 201, ok.text);
    const saved = JSON.parse(ok.text).block;
    assert.deepEqual(saved.blocks.map((b) => b.type), ["heading", "button"]);
    assert.ok(saved.blocks.every((b) => !("id" in b)));
    assert.equal((await post("/marketing/modeles/blocs-enregistres", { name: "mon BANDEAU", blocks: [{ type: "divider" }] })).status, 400);
    assert.equal((await post("/marketing/modeles/blocs-enregistres", { name: "Piège", blocks: [{ type: "script", src: "x" }] })).status, 400);
    assert.equal((await post("/marketing/modeles/blocs-enregistres", { name: "", blocks: [{ type: "divider" }] })).status, 400);
    assert.equal((await post("/marketing/modeles/blocs-enregistres", { name: "Vide", blocks: [] })).status, 400);
    const id = Number((await boss.post("/marketing/modeles", { name: "Avec mes blocs", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
    assert.match((await boss.get(`/marketing/modeles/${id}`)).text, /Mon bandeau/);
    assert.equal((await post(`/marketing/modeles/blocs-enregistres/${saved.id}/supprimer`, {})).status, 200);
    assert.equal((await post(`/marketing/modeles/blocs-enregistres/${saved.id}/supprimer`, {})).status, 404);
    assert.doesNotMatch((await boss.get(`/marketing/modeles/${id}`)).text, /Mon bandeau/);
  });
});

describe("vérifications avant envoi (moteur)", () => {
  const { compileTemplate } = require("../src/marketing/templates/blocks");
  const ALLOW = (p) => /^(contact\.first_name|org\.name|unsubscribe_url)$/.test(p);
  const compile = (blocks) => compileTemplate({ kind: "marketing", subject: "S", preheader: "P", blocks }, { allowed: ALLOW });
  const refuses = (blocks, re) => assert.throws(() => compile(blocks), (e) => e.code === "invalid_template" && re.test(e.message));
  test("image sans texte alternatif, bouton sans adresse, adresse invalide, variable inconnue, bloc vide : refusés avec un message clair", () => {
    refuses([{ id: "a", type: "image", src: "https://exemple.fr/a.png", alt: "" }], /alternatif/);
    refuses([{ id: "a", type: "button", label: "Go", url: "" }], /adresse/i);
    refuses([{ id: "a", type: "button", label: "Go", url: "http://non-securise.fr" }], /https/);
    refuses([{ id: "a", type: "button", label: "Go", url: "javascript:alert(1)" }], /https/);
    refuses([{ id: "a", type: "text", html: "<p>Bonjour {{contact.inconnu}}</p>" }], /inconnu|variable/i);
    refuses([{ id: "a", type: "heading", text: "" }], /obligatoire|titre/i);
  });
});
