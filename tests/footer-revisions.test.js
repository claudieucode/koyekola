process.env.FOOTER_V2 = "0"; // ces tests décrivent l'ANCIEN catalogue (100 modèles ft-*) : on active l'interrupteur de secours. La bibliothèque v2 est testée par footer-v2-*.test.js.
// Pied de page (chantier E) — révisions, historique, retour au modèle d'origine, protection contre la perte.
// Partie 1 (sans serveur) : comparaison, déduplication, fusion des enregistrements rapprochés, plafond (la dernière publication reste), listes sans document.
// Partie 2 (serveur réel) : révision à l'enregistrement et à la publication, restauration en brouillon sans toucher le public, comparaison, retour au modèle d'origine,
//   archivage / récupération / suppression, isolation entre deux sites, droits, avertissement de fermeture.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const Rev = require("../src/themeBuilder/revisions");
const Catalog = require("../src/themeBuilder/catalog");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const sec = (...texts) => ({ type: "layout", children: texts.map((t, i) => ({ id: `w${i}`, type: "heading", props: { text: t, level: "2" } })) });

describe("Comparaison simple (sans serveur)", () => {
  test("ajouts, retraits et modifications comptés par élément", () => {
    const a = sec("A", "B", "C"), b = JSON.parse(JSON.stringify(a));
    assert.deepEqual([Rev.diff(a, b).added, Rev.diff(a, b).removed, Rev.diff(a, b).modified], [0, 0, 0]);
    b.children[0].props.text = "A2"; b.children.splice(1, 1); b.children.push({ id: "n1", type: "button", props: { text: "x" } }, { id: "n2", type: "text", props: {} });
    const d = Rev.diff(a, b);
    assert.deepEqual([d.added, d.removed, d.modified], [2, 1, 1]);
    assert.deepEqual(d.details.added.sort(), ["button", "text"]);
  });
  test("l'empreinte ne dépend pas de l'ordre des clés", () => {
    assert.equal(Rev.hashOf({ a: 1, b: { c: 2, d: 3 } }), Rev.hashOf({ b: { d: 3, c: 2 }, a: 1 }));
    assert.notEqual(Rev.hashOf(sec("A")), Rev.hashOf(sec("B")));
  });
});

describe("Pied de page — révisions sur serveur réel", () => {
  let srv, boss, db, S1, S2, reader;
  const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (p, body, c = boss) => c.request(p, { method: "POST", json: body || {} });
  const json = (r) => JSON.parse(r.text);
  const sect = (id, text) => ({ id, type: "layout", children: [{ id: `${id}h`.slice(0, 20), type: "heading", props: { text, level: "2" } }] });
  const ctx = () => ({ db, organizationId: db.prepare("SELECT organization_id o FROM mk_tb_templates LIMIT 1").get().o, userId: null });
  const footer = async (site, name) => json(await post(U(site, "/api/modeles"), { type: "footer", name })).template;
  const saveDraft = async (t, ...texts) => {
    const rev = db.prepare("SELECT revision FROM mk_web_components WHERE id = ?").get(t.sourceId).revision;
    const r = await boss.request(`/marketing/site-web/composants/${t.sourceId}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: "t", sections: [{ id: "sect00000001", type: "layout", children: texts.map((x, i) => ({ id: `wid0000000${i}`, type: "heading", props: { text: x, level: "2" } })) }] } } });
    assert.equal(r.status, 200, r.text.slice(0, 200));
  };
  const publish = (site, t, body) => post(U(site, `/api/modeles/${t.id}/publier`), { strict: true, scope: "site", replace: true, ...body });
  const revs = async (site, t, q = "") => json(await boss.get(U(site, `/api/modeles/${t.id}/revisions${q}`)));
  const back = (t) => db.prepare("UPDATE mk_tb_revisions SET created_at = datetime('now', '-10 minutes') WHERE component_id = ?").run(t.sourceId); // vieillit les révisions : plus de fusion
  const liveHtml = async (t) => { const c = db.prepare("SELECT section FROM mk_web_components WHERE id = ?").get(t.sourceId); return c.section; };
  const draftCol = (t) => db.prepare("SELECT draft FROM mk_web_components WHERE id = ?").get(t.sourceId).draft;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    S1 = await mk("Site Un"); S2 = await mk("Site Deux");
    reader = await newStudent(srv);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("révision créée à l'enregistrement du brouillon ; deux enregistrements rapprochés = une seule ; un contenu identique n'ajoute rien", async () => {
    const t = await footer(S1, "Pied historique");
    await saveDraft(t, "V1");
    let l = await revs(S1, t);
    assert.equal(l.revisions.length, 1); assert.equal(l.revisions[0].kind, "draft");
    await saveDraft(t, "V1 bis"); // moins de 60 s, même auteur : fusionné
    l = await revs(S1, t); assert.equal(l.revisions.length, 1);
    await saveDraft(t, "V1 bis"); // identique : rien
    assert.equal((await revs(S1, t)).revisions.length, 1);
    back(t); await saveDraft(t, "V2");
    l = await revs(S1, t); assert.equal(l.revisions.length, 2);
    assert.match(l.revisions[0].summary, /modifié/); assert.ok(l.revisions[0].createdAt);
    assert.equal(l.revisions[0].isCurrentDraftContent, true);
  });

  test("la liste ne contient JAMAIS le document entier, et se pagine", async () => {
    const t = await footer(S1, "Pied pagination");
    for (let i = 0; i < 6; i += 1) { await saveDraft(t, `P${i}`); back(t); }
    const p1 = await boss.get(U(S1, `/api/modeles/${t.id}/revisions?limite=4`)); const j = json(p1);
    assert.equal(j.revisions.length, 4); assert.ok(j.next, "page suivante");
    assert.ok(!p1.text.includes('"section"') && !p1.text.includes("heading"), "aucun document dans la liste");
    const p2 = json(await boss.get(U(S1, `/api/modeles/${t.id}/revisions?limite=4&avant=${j.next}`)));
    assert.equal(p2.revisions.length, 2); assert.equal(p2.next, null);
  });

  test("révision créée à la publication ; la version en ligne reste intacte quand on enregistre un brouillon", async () => {
    const t = await footer(S1, "Pied publication");
    await saveDraft(t, "EN-LIGNE-1");
    const r = await publish(S1, t, {}); assert.equal(r.status, 200, r.text.slice(0, 200));
    let l = await revs(S1, t); assert.equal(l.revisions[0].kind, "publish");
    const live = await liveHtml(t); assert.match(live, /EN-LIGNE-1/);
    back(t); await saveDraft(t, "BROUILLON-2");
    assert.equal(await liveHtml(t), live, "enregistrer un brouillon ne change pas la version diffusée");
    l = await revs(S1, t); assert.deepEqual(l.revisions.map((x) => x.kind), ["draft", "publish", "draft"]);
  });

  test("aperçu d'une révision : éléments par type et aperçu filaire, sans document", async () => {
    const t = await footer(S1, "Pied aperçu"); await saveDraft(t, "A", "B");
    const id = (await revs(S1, t)).revisions[0].id;
    const r = await boss.get(U(S1, `/api/modeles/${t.id}/revisions/${id}/apercu`)); assert.equal(r.status, 200);
    const j = json(r); assert.equal(j.widgets, 2); assert.equal(j.types.heading, 2); assert.match(j.thumb, /^<svg/);
  });

  test("restaurer une révision = nouveau brouillon + sécurité avant ; la version publiée ne bouge pas", async () => {
    const t = await footer(S1, "Pied restauration");
    await saveDraft(t, "ANCIEN"); back(t);
    const first = (await revs(S1, t)).revisions[0].id;
    assert.equal((await publish(S1, t, {})).status, 200); back(t);
    await saveDraft(t, "NOUVEAU", "EN PLUS"); back(t);
    const live = await liveHtml(t);
    const r = await post(U(S1, `/api/modeles/${t.id}/revisions/${first}/restaurer`));
    assert.equal(r.status, 200, r.text.slice(0, 200)); assert.equal(json(r).published, false);
    assert.match(draftCol(t), /ANCIEN/); assert.doesNotMatch(draftCol(t), /NOUVEAU/);
    assert.equal(await liveHtml(t), live, "version diffusée inchangée");
    assert.equal(db.prepare("SELECT status FROM mk_tb_templates WHERE id = ?").get(t.id).status, "published", "toujours publié, aucune mise hors ligne");
    const list = (await revs(S1, t)).revisions;
    assert.equal(list[0].kind, "restore");
    const before = list.find((x) => x.kind === "draft" && x.summary.includes("ajouté")); // l'état d'avant est déjà dans l'historique : récupérable
    assert.equal((await post(U(S1, `/api/modeles/${t.id}/revisions/${before.id}/restaurer`))).status, 200); assert.match(draftCol(t), /NOUVEAU/);
    // brouillon jamais enregistré dans l'historique (écrit hors éditeur) : une révision de SÉCURITÉ est créée automatiquement avant la restauration
    db.prepare("UPDATE mk_web_components SET draft = ? WHERE id = ?").run(JSON.stringify(sect("sect00000077", "HORS-HISTORIQUE")), t.sourceId);
    assert.equal((await post(U(S1, `/api/modeles/${t.id}/revisions/${first}/restaurer`))).status, 200);
    const safety = (await revs(S1, t)).revisions.find((x) => x.kind === "safety"); assert.ok(safety, "révision de sécurité");
    assert.equal((await post(U(S1, `/api/modeles/${t.id}/revisions/${safety.id}/restaurer`))).status, 200); assert.match(draftCol(t), /HORS-HISTORIQUE/);
  });

  test("comparaison : ajoutés / retirés / modifiés entre deux révisions et avec le brouillon actuel", async () => {
    const t = await footer(S1, "Pied comparaison");
    await saveDraft(t, "A", "B"); back(t); await saveDraft(t, "A2", "B", "C"); back(t);
    const [newer, older] = (await revs(S1, t)).revisions;
    const c = json(await boss.get(U(S1, `/api/modeles/${t.id}/revisions/comparer?a=${older.id}&b=${newer.id}`))).comparison;
    assert.deepEqual([c.added, c.removed, c.modified, c.identical], [1, 0, 1, false]);
    const same = json(await boss.get(U(S1, `/api/modeles/${t.id}/revisions/comparer?a=${newer.id}&b=draft`))).comparison;
    assert.equal(same.identical, true);
    assert.equal((await boss.get(U(S1, `/api/modeles/${t.id}/revisions/comparer?a=999999&b=draft`))).status, 404);
  });

  test("plafond : les plus anciennes partent, la dernière publication reste toujours", async () => {
    const t = await footer(S1, "Pied plafond"); await saveDraft(t, "BASE");
    assert.equal((await publish(S1, t, {})).status, 200);
    const pubId = (await revs(S1, t)).revisions.find((x) => x.kind === "publish").id;
    const c = ctx();
    for (let i = 0; i < Rev.MAX + 15; i += 1) Rev.record(c, t.sourceId, "safety", sec(`S${i}`));
    const n = db.prepare("SELECT COUNT(*) c FROM mk_tb_revisions WHERE component_id = ?").get(t.sourceId).c;
    assert.equal(n, Rev.MAX);
    assert.ok(db.prepare("SELECT 1 FROM mk_tb_revisions WHERE id = ?").get(pubId), "la dernière publication est conservée");
    assert.ok(db.prepare("SELECT 1 FROM mk_tb_revisions WHERE component_id = ? AND section LIKE '%S%' ORDER BY id DESC LIMIT 1").get(t.sourceId));
  });

  test("retour au modèle d'origine : bouton visible, brouillon recréé depuis le catalogue, sécurité avant, rien publié", async () => {
    const key = "ft-corporate-01-grande-marque-volets"; // un modèle de la bibliothèque actuelle (les anciens identifiants ne sont plus listés)
    assert.ok(Catalog.entries("footer").some((e) => e.key === key));
    const used = json(await post(U(S1, "/api/bibliotheque/utiliser"), { type: "footer", key })).template;
    assert.equal(used.origin.key, key, "la fiche annonce le modèle d'origine");
    const light = json(await boss.get(U(S1, "/api/modeles?leger=1"))).templates.find((x) => x.id === used.id);
    assert.equal(light.origin.key, key);
    await saveDraft(used, "MODIFIÉ PAR MOI"); back(used);
    assert.equal((await publish(S1, used, {})).status, 200); back(used);
    await saveDraft(used, "AUTRE CHANGEMENT"); back(used);
    const live = await liveHtml(used);
    const r = await post(U(S1, `/api/modeles/${used.id}/revenir-au-modele`));
    assert.equal(r.status, 200, r.text.slice(0, 300)); assert.equal(json(r).original.key, key);
    const d = JSON.parse(draftCol(used));
    assert.doesNotMatch(JSON.stringify(d), /AUTRE CHANGEMENT/); assert.ok(d.children.length >= 1);
    assert.equal(await liveHtml(used), live, "version en ligne inchangée");
    const kinds = (await revs(S1, used)).revisions.map((x) => x.kind);
    assert.equal(kinds[0], "restore");
    const prev = (await revs(S1, used)).revisions.find((x) => x.kind === "draft"); // l'état d'avant le retour est dans l'historique
    assert.equal((await post(U(S1, `/api/modeles/${used.id}/revisions/${prev.id}/restaurer`))).status, 200);
    assert.match(draftCol(used), /AUTRE CHANGEMENT/, "le retour est annulable");
    db.prepare("UPDATE mk_web_components SET draft = ? WHERE id = ?").run(JSON.stringify(sect("sect00000078", "NON-ENREGISTRE")), used.sourceId);
    assert.equal((await post(U(S1, `/api/modeles/${used.id}/revenir-au-modele`))).status, 200);
    const safety = (await revs(S1, used)).revisions.find((x) => x.kind === "safety"); assert.ok(safety, "sécurité automatique avant le retour");
    assert.equal((await post(U(S1, `/api/modeles/${used.id}/revisions/${safety.id}/restaurer`))).status, 200); assert.match(draftCol(used), /NON-ENREGISTRE/);
    const plain = await footer(S1, "Pied fait main");
    assert.equal(plain.origin, null);
    assert.equal((await post(U(S1, `/api/modeles/${plain.id}/revenir-au-modele`))).status, 422, "pas de modèle d'origine : refusé clairement");
  });

  test("suppression : il faut archiver d'abord (corbeille), l'archive se récupère, la suppression garde le document et l'historique", async () => {
    const t = await footer(S1, "Pied corbeille"); await saveDraft(t, "A GARDER");
    assert.equal((await post(U(S1, `/api/modeles/${t.id}/supprimer`))).status, 409, "pas de suppression directe");
    assert.equal((await post(U(S1, `/api/modeles/${t.id}/archiver`))).status, 200);
    assert.equal((await post(U(S1, `/api/modeles/${t.id}/restaurer`))).status, 200, "récupération possible");
    assert.equal(db.prepare("SELECT status FROM mk_tb_templates WHERE id = ?").get(t.id).status, "draft");
    assert.equal((await post(U(S1, `/api/modeles/${t.id}/archiver`))).status, 200);
    const n = (await revs(S1, t)).total;
    assert.equal((await post(U(S1, `/api/modeles/${t.id}/revisions/${(await revs(S1, t)).revisions[0].id}/restaurer`))).status, 409, "pas de restauration sur un modèle archivé");
    assert.equal((await post(U(S1, `/api/modeles/${t.id}/supprimer`))).status, 200);
    assert.ok(db.prepare("SELECT 1 FROM mk_web_components WHERE id = ?").get(t.sourceId), "le document reste");
    assert.equal(db.prepare("SELECT COUNT(*) c FROM mk_tb_revisions WHERE component_id = ?").get(t.sourceId).c, n, "l'historique reste");
  });

  test("isolation : un autre site ne voit ni ne restaure les révisions de ce pied", async () => {
    const t = await footer(S1, "Pied privé"); await saveDraft(t, "SECRET");
    const id = (await revs(S1, t)).revisions[0].id;
    for (const [m, p] of [["get", `/api/modeles/${t.id}/revisions`], ["get", `/api/modeles/${t.id}/revisions/${id}/apercu`], ["get", `/api/modeles/${t.id}/revisions/comparer?a=${id}&b=draft`]]) assert.equal((await boss[m](U(S2, p))).status, 404, p);
    assert.equal((await post(U(S2, `/api/modeles/${t.id}/revisions/${id}/restaurer`))).status, 404);
    assert.equal((await post(U(S2, `/api/modeles/${t.id}/revenir-au-modele`))).status, 404);
    const other = await footer(S2, "Pied site deux"); await saveDraft(other, "AUTRE");
    assert.equal((await boss.get(U(S2, `/api/modeles/${other.id}/revisions/${id}/apercu`))).status, 404, "une révision d'un autre pied n'est pas lisible");
  });

  test("droits : un compte sans droit n'a accès à rien ; les autres types de modèles n'ont pas d'historique", async () => {
    const t = await footer(S1, "Pied droits"); await saveDraft(t, "D");
    const id = (await revs(S1, t)).revisions[0].id;
    const a = await reader.get(U(S1, `/api/modeles/${t.id}/revisions`)); assert.ok([401, 403, 302].includes(a.status), String(a.status));
    const b = await reader.request(U(S1, `/api/modeles/${t.id}/revisions/${id}/restaurer`), { method: "POST", json: {} }); assert.ok([401, 403, 302].includes(b.status), String(b.status));
    const hdr = json(await post(U(S1, "/api/modeles"), { type: "header", name: "En-tête test" })).template;
    assert.equal((await boss.get(U(S1, `/api/modeles/${hdr.id}/revisions`))).status, 422);
    const rev0 = db.prepare("SELECT revision FROM mk_web_components WHERE id = ?").get(hdr.sourceId).revision;
    const r = await boss.request(`/marketing/site-web/composants/${hdr.sourceId}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev0, content: { title: "t", sections: [sect("sect00000009", "ENTETE")] } } });
    assert.equal(r.status, 200);
    assert.equal(db.prepare("SELECT COUNT(*) c FROM mk_tb_revisions WHERE component_id = ?").get(hdr.sourceId).c, 0, "aucune révision pour un en-tête");
  });

  test("avertissement à la fermeture : l'éditeur de composants et le Theme Builder gardent leur garde « non enregistré »", () => {
    const ed = fs.readFileSync(path.join(__dirname, "../public/js/marketing-editor.js"), "utf8");
    assert.match(ed, /beforeunload/);
    const tb = fs.readFileSync(path.join(__dirname, "../public/js/theme-builder.js"), "utf8");
    assert.match(tb, /beforeunload/); assert.match(tb, /Historique des révisions/); assert.match(tb, /Supprimer définitivement/);
  });
});
