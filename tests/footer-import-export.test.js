// Footer Builder (chantier G) : export / import / duplication des pieds de page.
// Aller-retour, fichiers piégés ou malformés, brouillon, conflit de nom, isolation entre sites, archive de plusieurs pieds, duplication, droits (serveur réel).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const TB = require("../src/themeBuilder");
const { store, portable } = TB;

const layout = (kids) => ({ type: "layout", children: kids });
const heading = (id, text) => ({ id, type: "heading", props: { text, level: "2" } });
const button = (id, label, url) => ({ id, type: "button", props: { label, url } });
const footerDoc = () => layout([
  { id: "colsaaaa0001", type: "columns", children: [
    { id: "colbbbb0001", type: "column", children: [heading("hhhh00000001", "Contact {{business.city}}"), button("bbbb00000001", "Appeler", "tel:+33123456789"), button("bbbb00000002", "Écrire", "mailto:a@b.fr")] },
    { id: "colbbbb0002", type: "column", children: [{ id: "tttt00000001", type: "text", props: { html: "<p>Merci</p>" } }] },
  ] },
]);
const widgetTypes = (sec) => { const o = []; const w = (l) => (l || []).forEach((n) => { o.push(n.type); w(n.children); }); w(sec.children); return o; };
const mkFooter = (A, siteId, name, doc = footerDoc()) => { const t = store.create(A, siteId, { type: "footer", name }); pages.saveComponentDraft(A, t.sourceId, doc); return store.get(A, siteId, t.id); };
const docOf = (A, t) => { const c = pages.getComponent(A, t.sourceId); return c.draft || c.section; };

describe("pieds de page : export / import (service)", () => {
  const { A, B } = freshMarketing();
  const s1 = pages.createSite(A, { name: "Site Un" }), s2 = pages.createSite(A, { name: "Site Deux" }), sB = pages.createSite(B, { name: "Autre org" });

  test("aller-retour : le pied importé est équivalent, en brouillon, sans condition, identifiants régénérés, site courant", () => {
    const t = mkFooter(A, s1.id, "Pied principal");
    const exp = portable.exportTemplate(A, s1.id, t.id);
    assert.equal(exp.format, "kolakisa-footer-template@1"); assert.equal(exp.formatVersion, 1); assert.equal(exp.template.conditions, undefined);
    const raw = JSON.stringify(exp);
    assert.ok(!raw.includes(String(s1.name)) && !/organization|site_id|siteId/.test(raw), "aucun identifiant du site d'origine");
    assert.ok(raw.includes("{{business.city}}"), "étiquettes dynamiques conservées");
    const imp = portable.importPackage(A, s2.id, JSON.parse(raw)).templates[0];
    assert.equal(imp.status, "draft"); assert.equal(imp.siteId, s2.id); assert.equal(imp.type, "footer"); assert.deepEqual(imp.conditions, { include: [], exclude: [] });
    assert.equal(pages.getComponent(A, imp.sourceId).site_id, s2.id);
    const a = docOf(A, t), b = docOf(A, imp);
    assert.deepEqual(widgetTypes(b), widgetTypes(a));
    const ids = (x) => JSON.stringify(x).match(/"id":"[a-z0-9]+"/g).sort();
    assert.notDeepEqual(ids(a), ids(b)); assert.equal(ids(a).filter((i) => ids(b).includes(i)).length, 0, "tous les identifiants changent");
    assert.match(JSON.stringify(b), /tel:\+33123456789/); assert.match(JSON.stringify(b), /mailto:a@b\.fr/);
  });
  test("l'export prend la copie de travail et les conditions seulement sur demande (identifiants du site retirés)", () => {
    const t = store.create(A, s1.id, { type: "footer", name: "Avec conditions", conditions: { include: [{ kind: "page", ids: [3] }, { kind: "post", category: ["Actu"] }] } });
    pages.saveComponentDraft(A, t.sourceId, layout([heading("hhhh00000009", "Brouillon")]));
    const sans = portable.exportTemplate(A, s1.id, t.id), avec = portable.exportTemplate(A, s1.id, t.id, { conditions: true });
    assert.match(JSON.stringify(sans.document), /Brouillon/); assert.equal(sans.template.conditions, undefined);
    assert.ok(avec.template.conditions); assert.ok(!JSON.stringify(avec).includes('"ids"')); assert.ok(avec.notes.some((n) => /identifiants/.test(n)));
    const imp = portable.importPackage(A, s2.id, avec).templates[0]; assert.equal(imp.status, "draft"); assert.ok(imp.conditions.include.length >= 1);
  });
  test("médias : références listées, rien d'embarqué ; formulaire du site retiré", () => {
    const doc = layout([{ id: "iiii00000001", type: "image", props: { src: `/uploads/marketing/${A.organizationId}/site-${s1.id}/logo.png`, alt: "Logo" } }, { id: "iiii00000002", type: "image", props: { src: "https://cdn.exemple.fr/x.png", alt: "X" } }]);
    const t = mkFooter(A, s1.id, "Avec images", doc);
    const exp = portable.exportTemplate(A, s1.id, t.id);
    assert.deepEqual(exp.media.map((m) => m.origin).sort(), ["externe", "mediatheque"]); assert.ok(exp.notes.some((n) => /SANS/.test(n)));
    assert.ok(!/data:image|base64/.test(JSON.stringify(exp)));
    const pv = portable.previewImport(A, s2.id, exp); assert.ok(pv.warnings.some((w) => /autre site de votre organisation/.test(w)));
  });
  test("image d'une AUTRE organisation : vidée à l'import (avertissement), pas de fuite", () => {
    const t = mkFooter(A, s1.id, "Pied photo");
    const exp = JSON.parse(JSON.stringify(portable.exportTemplate(A, s1.id, t.id)));
    exp.document.section.children.push({ id: "zzzz00000001", type: "text", props: { html: "<p>ok</p>" } }, { id: "zzzz00000002", type: "image", props: { src: "/uploads/marketing/99999/site-1/secret.png", alt: "S" } });
    const pv = portable.previewImport(A, s2.id, exp);
    assert.ok(pv.warnings.some((w) => /autre organisation/.test(w)));
    const imp = portable.importPackage(A, s2.id, exp).templates[0];
    assert.ok(!JSON.stringify(docOf(A, imp)).includes("99999"));
  });
  test("fichiers invalides : refus clair, rien de créé", () => {
    const base = portable.exportTemplate(A, s1.id, store.list(A, s1.id, { type: "footer" })[0].id);
    const n0 = store.list(A, s2.id).length;
    const cases = [
      ["null", null, /reconnu/], ["tableau", [], /reconnu/], ["texte non JSON", "{pas du json", /JSON valide/], ["autre format", { format: "zzz" }, /reconnu/],
      ["version inconnue", { ...base, format: "kolakisa-footer-template@2" }, /Version 2/],
      ["trop gros", { ...base, junk: "x".repeat(2_100_000) }, /volumineux/],
      ["pas un pied", { ...base, template: { ...base.template, type: "header" } }, /pied de page/],
      ["document absent", { ...base, document: {} }, /document/i],
      ["section non layout", { ...base, document: { kind: "component", section: { type: "script" } } }, /mise en page/],
      ["lot vide", { format: "kolakisa-footer-bundle@1", templates: [] }, /aucun pied/],
      ["lot avec intrus", { format: "kolakisa-footer-bundle@1", templates: [{ format: "x" }] }, /pas un pied/],
      ["conditions invalides", { ...base, template: { ...base.template, conditions: { include: [{ kind: "custom", id: "x" }] } } }, /Conditions invalides/],
    ];
    for (const [label, bad, re] of cases) {
      assert.throws(() => portable.previewImport(A, s2.id, bad), (e) => re.test(e.message) && e.code === "invalid_field", label);
      assert.throws(() => portable.importPackage(A, s2.id, bad), re, label);
    }
    assert.equal(store.list(A, s2.id).length, n0);
  });
  test("contenu piégé : widget inconnu retiré, javascript:/data: supprimés, scripts retirés, HTML nettoyé, tel:/mailto: gardés", () => {
    const base = JSON.parse(JSON.stringify(portable.exportTemplate(A, s1.id, store.list(A, s1.id, { type: "footer" })[0].id)));
    base.document.section = layout([
      { id: "aaaa00000001", type: "widgetfantome", props: {} },
      button("aaaa00000002", "Piège", "javascript:alert(1)"),
      button("aaaa00000003", "Piège data", "data:text/html;base64,PHNjcmlwdD4="),
      button("aaaa00000004", "Appel", "tel:+33123456789"),
      heading("aaaa00000005", "Titre<script>alert(1)</script> propre"),
      { id: "aaaa00000006", type: "text", props: { html: "<p onclick=\"x()\">Salut<script>1</script><a href=\"javascript:x\">lien</a></p>" } },
      { id: "aaaa00000007", type: "image", props: { src: "javascript:alert(1)", alt: "x" } },
    ]);
    const pv = portable.previewImport(A, s2.id, base);
    assert.deepEqual(pv.items[0].unknown, ["widgetfantome"]);
    assert.ok(pv.warnings.some((w) => /widgetfantome/.test(w)) && pv.warnings.some((w) => /dangereux/.test(w)) && pv.warnings.some((w) => /code actif/.test(w)));
    const imp = portable.importPackage(A, s2.id, base).templates[0], out = JSON.stringify(docOf(A, imp));
    assert.ok(!/javascript:|data:text|<script|onclick|widgetfantome/i.test(out), out);
    assert.match(out, /tel:\+33123456789/); assert.match(out, /Salut/); assert.equal(imp.status, "draft");
    assert.deepEqual(widgetTypes(docOf(A, imp)), ["button", "heading", "text"]);
  });
  test("trop d'éléments ou imbrication profonde : refus propre, jamais de plantage", () => {
    const base = JSON.parse(JSON.stringify(portable.exportTemplate(A, s1.id, store.list(A, s1.id, { type: "footer" })[0].id)));
    base.document.section = layout(Array.from({ length: 1600 }, (_, i) => heading("m" + String(i).padStart(10, "0"), "x")));
    assert.throws(() => portable.importPackage(A, s2.id, base), /trop d'éléments/);
    let deep = { id: "dddd00000000", type: "container", children: [] }; const root = deep;
    for (let i = 1; i < 40; i++) { const n = { id: "dddd" + String(i).padStart(8, "0"), type: "container", children: [] }; deep.children.push(n); deep = n; }
    base.document.section = layout([root]);
    assert.throws(() => portable.importPackage(A, s2.id, base), /profond/);
  });
  test("conflit de nom : « Copie de … » ; interactions suivent les nouveaux identifiants", () => {
    const t = mkFooter(A, s1.id, "Pied unique");
    const exp = portable.exportTemplate(A, s1.id, t.id);
    const i1 = portable.importPackage(A, s1.id, exp).templates[0], i2 = portable.importPackage(A, s1.id, exp).templates[0];
    assert.equal(i1.name, "Copie de Pied unique"); assert.equal(i2.name, "Copie de Pied unique (2)");
    const doc = layout([{ id: "xxxx00000001", type: "heading", props: { text: "A", level: "2" }, interactions: [{ trigger: "click", action: "toggle", target: "xxxx00000002" }] }, { id: "xxxx00000002", type: "text", props: { html: "<p>B</p>" } }]);
    const e2 = JSON.parse(JSON.stringify(exp)); e2.document.section = doc;
    const imp = portable.importPackage(A, s2.id, e2).templates[0], d = docOf(A, imp);
    assert.ok(d.children[0].interactions && d.children[0].interactions.length === 1, "interaction conservée");
    assert.equal(d.children[0].interactions[0].target, d.children[1].id); assert.notEqual(d.children[1].id, "xxxx00000002");
  });
  test("isolation : un pied importé n'apparaît que dans le site cible ; autre organisation et site inconnu refusés", () => {
    const t = mkFooter(A, s1.id, "Isolé");
    const exp = portable.exportTemplate(A, s1.id, t.id);
    const before1 = store.list(A, s1.id).length;
    const imp = portable.importPackage(A, s2.id, exp).templates[0];
    assert.equal(store.list(A, s1.id).length, before1); assert.ok(store.list(A, s2.id).some((x) => x.id === imp.id));
    assert.throws(() => store.get(A, s1.id, imp.id), /introuvable/);
    assert.throws(() => portable.exportTemplate(A, s2.id, t.id), /introuvable/);
    assert.throws(() => portable.importPackage(A, 999999, exp), /Site introuvable/);
    assert.throws(() => portable.importPackage(B, s2.id, exp), /Site introuvable/);
    assert.throws(() => portable.exportTemplate(B, sB.id, t.id), /introuvable/);
  });
  test("export de plusieurs pieds (archive) puis import en lot ; sélection par numéros ; lot atomique", () => {
    const { A: C } = freshMarketing();
    const a = pages.createSite(C, { name: "Source" }), b = pages.createSite(C, { name: "Cible" });
    const f1 = mkFooter(C, a.id, "Pied 1"), f2 = mkFooter(C, a.id, "Pied 2", layout([heading("hhhh00000077", "Deux")]));
    store.create(C, a.id, { type: "header", name: "Pas un pied" });
    const all = portable.exportFooters(C, a.id, []); assert.equal(all.format, "kolakisa-footer-bundle@1"); assert.equal(all.count, 2);
    assert.equal(portable.exportFooters(C, a.id, [f2.id]).count, 1);
    assert.throws(() => portable.exportFooters(C, a.id, [store.list(C, a.id, { type: "header" })[0].id]), /pas un pied/);
    const pv = portable.previewImport(C, b.id, all); assert.equal(pv.items.length, 2); assert.equal(pv.bundle, true);
    const r = portable.importPackage(C, b.id, all); assert.equal(r.templates.length, 2); assert.ok(r.templates.every((t) => t.status === "draft" && t.siteId === b.id));
    const bad = JSON.parse(JSON.stringify(all)); bad.templates[1].document.section = { type: "zzz" };
    const n = store.list(C, b.id).length; assert.throws(() => portable.importPackage(C, b.id, bad)); assert.equal(store.list(C, b.id).length, n, "rien d'importé si un pied est refusé");
    void f1;
  });
  test("duplication : copie en brouillon de la copie de travail, sans conditions, nom « Copie de … », document distinct", () => {
    const t = store.create(A, s1.id, { type: "footer", name: "À dupliquer", conditions: { include: [{ kind: "page" }] } });
    pages.saveComponentDraft(A, t.sourceId, layout([heading("hhhh00000055", "Travail")]));
    const d = portable.duplicateTemplate(A, s1.id, t.id);
    assert.equal(d.name, "Copie de À dupliquer"); assert.equal(d.status, "draft"); assert.deepEqual(d.conditions, { include: [], exclude: [] });
    assert.notEqual(d.sourceId, t.sourceId); assert.match(JSON.stringify(docOf(A, d)), /Travail/); assert.equal(d.siteId, s1.id);
    const h = store.create(A, s1.id, { type: "header", name: "H" }); assert.equal(portable.duplicateTemplate(A, s1.id, h.id).type, "header");
  });
  test("rétro-compatibilité : l'ancien format kolakisa-theme-template@1 d'un pied reste importable", () => {
    const t = mkFooter(A, s1.id, "Ancien format");
    const exp = portable.exportTemplate(A, s1.id, t.id);
    const old = { format: portable.FORMAT, exportedAt: exp.exportedAt, template: { type: "footer", name: "Ancien", conditions: { include: [], exclude: [] } }, document: { kind: "component", section: exp.document.section } };
    const imp = portable.importTemplate(A, s2.id, old); assert.equal(imp.status, "draft"); assert.equal(imp.type, "footer");
  });
});

describe("pieds de page : import / export (serveur réel, droits)", () => {
  const { startServer, loginInstructor, newStudent } = require("./helpers");
  let srv, db, boss, reader, A, B;
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (c, path, body) => c.request(path, { method: "POST", json: body || {} });
  const json = (r) => JSON.parse(r.text);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo"); reader = await newStudent(srv);
  });
  after(async () => { db.close(); await srv.stop(); });
  test("export, aperçu, import (A → B), lot, duplication ; fichier malformé = 422 clair ; sans droit refusé", async () => {
    const t1 = json(await post(boss, U(A, "/api/modeles"), { type: "footer", name: "Pied A" })).template;
    const t2 = json(await post(boss, U(A, "/api/modeles"), { type: "footer", name: "Pied A2" })).template;
    const ex = await boss.get(U(A, `/api/modeles/${t1.id}/export.json`)); assert.equal(ex.status, 200);
    const file = JSON.parse(ex.text); assert.equal(file.format, "kolakisa-footer-template@1");
    const pv = await post(boss, U(B, "/api/importer-apercu"), { payload: file }); assert.equal(pv.status, 200); assert.equal(json(pv).preview.items.length, 1);
    assert.equal(db.prepare("SELECT COUNT(*) c FROM mk_tb_templates WHERE site_id = ?").get(B).c, 0, "l'aperçu n'écrit rien");
    const im = await post(boss, U(B, "/api/importer"), { payload: file }); assert.equal(im.status, 200, im.text.slice(0, 200)); assert.equal(json(im).template.status, "draft");
    assert.equal(db.prepare("SELECT site_id FROM mk_tb_templates WHERE id = ?").get(json(im).template.id).site_id, B);
    const lot = await boss.get(U(A, "/api/modeles/export-lot.json")); assert.equal(lot.status, 200); assert.equal(JSON.parse(lot.text).count, 2);
    const lot1 = await boss.get(U(A, `/api/modeles/export-lot.json?ids=${t2.id}`)); assert.equal(JSON.parse(lot1.text).count, 1);
    assert.equal((await post(boss, U(B, "/api/importer"), { payload: JSON.parse(lot.text) })).status, 200);
    const dup = await post(boss, U(A, `/api/modeles/${t1.id}/dupliquer`)); assert.equal(dup.status, 200); assert.match(json(dup).template.name, /^Copie de/);
    for (const bad of [{ payload: "n'importe quoi" }, { payload: { format: "kolakisa-footer-template@9" } }, {}]) { const r = await post(boss, U(B, "/api/importer"), bad); assert.equal(r.status, 422, r.text.slice(0, 120)); assert.ok(json(r).error); }
    assert.equal((await post(boss, U(B, "/api/importer"), { payload: file })).status, 200);
    assert.notEqual((await post(reader, U(B, "/api/importer"), { payload: file })).status, 200);
    assert.notEqual((await reader.get(U(A, `/api/modeles/${t1.id}/export.json`))).status, 200);
    assert.equal((await boss.get(U(B, `/api/modeles/${t1.id}/export.json`))).status, 404, "un pied d'un autre site n'est pas exportable par ce site");
  });
});
