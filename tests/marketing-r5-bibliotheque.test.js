// Marketing R5 (2/3) — bibliothèque de modèles par catégories, catégorie d'un modèle, recherche, usages.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { Parser } = require("htmlparser2");
const { freshMarketing } = require("./marketing-helpers");
const templates = require("../src/marketing/templates");
const { STARTERS } = require("../src/marketing/templates/starters");
const library = require("../src/marketing/templates/library");

let m, A, B;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const blockOf = (over = {}) => ({ subject: "Objet", blocks: [{ type: "text", markdown: "Bonjour" }], ...over });
const make = (name, over = {}) => templates.createTemplate(A, { name, ...blockOf(), ...over });
const names = (rows) => rows.map((t) => t.name);

function dangerous(html) {
  const found = [];
  const parser = new Parser({
    onopentag(name, attribs) {
      if (["script", "iframe", "object", "embed", "form", "link", "base"].includes(name)) found.push(name);
      for (const [k, v] of Object.entries(attribs)) if (/^on/i.test(k) || (["href", "src"].includes(k) && !/^(https:\/\/|mailto:|tel:)/i.test(v))) found.push(`${k}=${v}`);
    },
  });
  parser.write(html); parser.end();
  return found;
}

beforeEach(() => { m = freshMarketing(); A = m.A; B = m.B; });

describe("modèles de départ : qualité de la bibliothèque", () => {
  test("au moins douze modèles, chacun avec libellé, description et catégorie connue ; libellés uniques", () => {
    const entries = Object.entries(STARTERS);
    assert.ok(entries.length >= 12, `${entries.length} modèles seulement`);
    const cats = new Set(library.CATEGORIES.map((c) => c.key));
    for (const [key, s] of entries) {
      assert.match(key, /^[a-z][a-z0-9_]*$/, key);
      assert.ok(s.label && s.description, key);
      assert.ok(cats.has(s.category), `${key} : catégorie ${s.category}`);
    }
    assert.equal(new Set(entries.map(([, s]) => s.label)).size, entries.length, "libellés en double");
  });
  test("chaque modèle est valide, prêt à l'envoi, sans erreur ni conseil de délivrabilité évitable", () => {
    for (const [key, s] of Object.entries(STARTERS)) {
      const t = templates.createTemplate(A, { ...s.template, name: key });
      const r = templates.templateReadiness(A, t.id);
      assert.equal(r.ready, true, `${key} : ${JSON.stringify(r.errors)}`);
      const avoidable = r.warnings.filter((w) => ["variable_no_default", "subject_long", "subject_caps", "subject_exclamation", "button_contrast", "image_only", "many_links"].includes(w.code));
      assert.deepEqual(avoidable.map((w) => w.code), [], key);
      assert.ok(s.template.subject && s.template.preheader, `${key} : objet et préheader attendus`);
    }
  });
  test("aucun modèle ne contient d'adresse réelle : uniquement des exemples remplaçables (exemple.fr) ni de HTML libre", () => {
    for (const [key, s] of Object.entries(STARTERS)) {
      const json = JSON.stringify(s.template);
      const urls = json.match(/https?:\/\/[^"\s\\]+/g) || [];
      for (const u of urls) assert.match(u, /^https:\/\/exemple\.fr/, `${key} : ${u}`);
      assert.doesNotMatch(json, /<script|<iframe|onerror=/i, key);
      assert.ok(!s.template.blocks.some((b) => /html|iframe|embed/.test(b.type)), key);
    }
  });
  test("la bibliothèque met en valeur les nouveaux blocs (citation, liste, réseaux sociaux, vidéo)", () => {
    const used = new Set(Object.values(STARTERS).flatMap((s) => s.template.blocks.map((b) => b.type)));
    for (const t of ["quote", "list", "social", "video", "columns", "button", "heading", "text"]) assert.ok(used.has(t), t);
  });
  test("modèles transactionnels : type transactionnel déclaré, variables d'événement, aucun lien de désinscription imposé", () => {
    const tx = Object.entries(STARTERS).filter(([, s]) => s.category === "transactional");
    assert.ok(tx.length >= 3);
    for (const [key, s] of tx) {
      assert.equal(s.template.kind, "transactional", key);
      assert.match(JSON.stringify(s.template), /\{\{event\./, `${key} : variable d'événement attendue`);
    }
  });
});

describe("bibliothèque groupée par catégories", () => {
  test("catégories dans l'ordre annoncé, uniquement celles qui ont des modèles, libellés en français", () => {
    const lib = library.starterLibrary();
    assert.ok(lib.length >= 5);
    const order = library.CATEGORIES.map((c) => c.key);
    assert.deepEqual(lib.map((g) => g.category.key), order.filter((k) => lib.some((g) => g.category.key === k)));
    for (const g of lib) {
      assert.ok(g.category.label && !g.category.label.includes("_"));
      assert.ok(g.starters.length >= 1);
    }
  });
  test("chaque modèle apparaît une seule fois, avec ses types de blocs (pour l'aperçu en cartes)", () => {
    const all = library.starterLibrary().flatMap((g) => g.starters);
    assert.equal(all.length, Object.keys(STARTERS).length);
    assert.equal(new Set(all.map((s) => s.key)).size, all.length);
    for (const s of all) {
      assert.deepEqual(Object.keys(s).sort(), ["blockTypes", "category", "description", "key", "kind", "label"]);
      assert.ok(s.blockTypes.length >= 2);
    }
  });
  test("le modèle « Message simple » reste disponible (compatibilité) et « Lettre d'information » aussi", () => {
    for (const key of ["blank", "newsletter", "course"]) assert.ok(STARTERS[key], key);
  });
});

describe("aperçu d'un modèle de départ", () => {
  test("HTML complet rendu avec des données d'exemple, sans rien écrire", () => {
    const before = m.db.prepare("SELECT COUNT(*) n FROM mk_templates").get().n;
    for (const key of Object.keys(STARTERS)) {
      const p = library.previewStarter(A, key);
      assert.match(p.html, /^<!DOCTYPE html>/, key);
      assert.ok(p.subject, key);
      assert.deepEqual(dangerous(p.html), [], key);
    }
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_templates").get().n, before);
  });
  test("modèle inconnu : erreur claire", () => {
    assert.equal(code(() => library.previewStarter(A, "inexistant")), "not_found");
    assert.equal(code(() => library.previewStarter(A, "__proto__")), "not_found");
    assert.equal(code(() => library.previewStarter(A, "constructor")), "not_found");
  });
});

describe("catégorie d'un modèle enregistré", () => {
  test("création avec catégorie ; par défaut aucune ; catégorie inconnue refusée", () => {
    assert.equal(make("A", { category: "promo" }).category, "promo");
    assert.equal(make("B").category, "");
    assert.equal(code(() => make("C", { category: "nimporte" })), "invalid_field");
    assert.equal(code(() => make("D", { category: 5 })), "invalid_field");
  });
  test("modification, conservée à la duplication, à la restauration et retirée avec une chaîne vide", () => {
    const t = make("Base", { category: "welcome" });
    assert.equal(templates.updateTemplate(A, t.id, { category: "promo" }).category, "promo");
    assert.equal(templates.updateTemplate(A, t.id, { subject: "Autre" }).category, "promo", "non touchée si absente du patch");
    assert.equal(templates.duplicateTemplate(A, t.id).category, "promo");
    const v = templates.listVersions(A, t.id)[0].version;
    const restored = templates.restoreVersion(A, t.id, v);
    assert.ok(["welcome", "promo"].includes(restored.category));
    assert.equal(templates.updateTemplate(A, t.id, { category: "" }).category, "");
    assert.equal(code(() => templates.updateTemplate(A, t.id, { category: "zzz" })), "invalid_field");
  });
  test("la catégorie ne change pas le contenu compilé ni la version d'un modèle sans catégorie ancienne", () => {
    const t = make("Sans", {});
    assert.equal(templates.getTemplate(A, t.id).category, "");
    assert.match(templates.renderTemplate(A, t.id, null).html, /Bonjour/);
  });
});

describe("recherche et filtres de la liste", () => {
  beforeEach(() => {
    make("Bienvenue élèves", { category: "welcome", subject: "Bonjour et bienvenue" });
    make("Promo été", { category: "promo", subject: "Offre de l'été" });
    make("Newsletter mars", { category: "newsletter" });
    make("Sans catégorie");
    make("Confirmation", { kind: "transactional", category: "transactional", subject: "Votre commande" });
  });
  test("recherche dans le nom ET l'objet, sans casse, caractères spéciaux littéraux", () => {
    assert.deepEqual(names(templates.searchTemplates(A, { q: "PROMO" })), ["Promo été"]);
    assert.deepEqual(names(templates.searchTemplates(A, { q: "commande" })), ["Confirmation"]);
    assert.equal(templates.searchTemplates(A, { q: "%" }).length, 0);
    assert.equal(templates.searchTemplates(A, { q: "_" }).length, 0);
  });
  test("filtre par catégorie, y compris « aucune » ; catégorie inconnue = pas de filtre", () => {
    assert.deepEqual(names(templates.searchTemplates(A, { category: "welcome" })), ["Bienvenue élèves"]);
    assert.deepEqual(names(templates.searchTemplates(A, { category: "none" })), ["Sans catégorie"]);
    assert.equal(templates.searchTemplates(A, { category: "inconnue" }).length, 5);
  });
  test("filtre par type", () => {
    assert.deepEqual(names(templates.searchTemplates(A, { kind: "transactional" })), ["Confirmation"]);
    assert.equal(templates.searchTemplates(A, { kind: "marketing" }).length, 4);
    assert.equal(templates.searchTemplates(A, { kind: "zzz" }).length, 5);
  });
  test("tri par nom (liste blanche) ; par défaut, les plus récemment modifiés d'abord", () => {
    assert.deepEqual(names(templates.searchTemplates(A, {}, { sort: "name", dir: "asc" })), ["Bienvenue élèves", "Confirmation", "Newsletter mars", "Promo été", "Sans catégorie"]);
    assert.deepEqual(names(templates.searchTemplates(A, {}, { sort: "name", dir: "desc" }))[0], "Sans catégorie");
    for (const sort of ["zzz", "id; DROP TABLE mk_templates", "name DESC, 1"]) assert.equal(templates.searchTemplates(A, {}, { sort }).length, 5);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_templates").get().n, 5);
  });
  test("effectifs par catégorie pour les onglets", () => {
    assert.deepEqual(templates.templateCategoryCounts(A), { all: 5, none: 1, welcome: 1, promo: 1, newsletter: 1, transactional: 1 });
  });
  test("chaque ligne porte catégorie, type, objet, nombre de blocs, date et nombre d'usages", () => {
    const row = templates.searchTemplates(A, { q: "Promo" })[0];
    assert.deepEqual(Object.keys(row).sort(), ["blockCount", "category", "created_at", "id", "kind", "name", "subject", "updated_at", "usedBy", "version"].sort());
    assert.equal(row.blockCount, 1);
  });
  test("usages : campagnes qui utilisent le modèle (les campagnes système des scénarios ne comptent pas)", () => {
    const t = templates.searchTemplates(A, { q: "Promo" })[0];
    const ins = (name, kind) => m.db.prepare("INSERT INTO mk_campaigns (organization_id, name, template_id, target_type, target_id, kind) VALUES (1, ?, ?, 'list', 1, ?)").run(name, t.id, kind);
    ins("C1", "campaign"); ins("C2", "campaign"); ins("Sys", "automation");
    assert.equal(templates.searchTemplates(A, { q: "Promo" })[0].usedBy, 2);
    assert.equal(templates.searchTemplates(A, { q: "Newsletter" })[0].usedBy, 0);
  });
  test("isolation entre organisations", () => {
    templates.createTemplate(B, { name: "Chez B", subject: "S", blocks: [{ type: "text", markdown: "x" }], category: "promo" });
    assert.ok(!names(templates.searchTemplates(A, {})).includes("Chez B"));
    assert.equal(templates.templateCategoryCounts(A).all, 5);
    assert.equal(templates.templateCategoryCounts(B).all, 1);
  });
});
