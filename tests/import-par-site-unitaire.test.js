// R8 lot 6D — import de contacts PAR SITE (service) : site attribué par le serveur, portée des imports, plafond, analyse obligatoire, doublons inter-sites SANS écriture ni fuite
// (demande de rattachement), listes du site, consentement, démarrage atomique, relances sans doublon, tâche de fond, journal, lignes rejetées. Bases en mémoire.
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const imports = require("../src/marketing/import");
const contactcore = require("../src/marketing/contactcore");
const requests = require("../src/marketing/contactcore/requests");

const code = (fn) => { try { fn(); } catch (e) { return e.code || e.message; } return null; };
const csv = (rows, header = "E-mail,Prénom") => `${header}\n${rows.join("\n")}\n`;
const MAP = ["email", "first_name"];
const prev = (ctx, text) => imports.previewImport(ctx, { filename: "c.csv", data: Buffer.from(text, "utf8") });

describe("import par site (service)", () => {
  let m, db, ORG, siteA, siteB, teamCtx, ctxA, ctxB, listA, listB, listCommon, X, Y, Z, one, all;
  const contact = (email) => one("SELECT * FROM mk_contacts WHERE email = ?", email);
  const tagsOf = (id) => all("SELECT t.name FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE ct.contact_id = ?", id).map((r) => r.name);
  before(() => {
    m = freshMarketing(); db = m.db; ORG = m.A.organizationId; teamCtx = m.A;
    one = (sql, ...a) => db.prepare(sql).get(...a); all = (sql, ...a) => db.prepare(sql).all(...a);
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(ORG, n, n.toLowerCase()).lastInsertRowid);
    siteA = site("Alpha"); siteB = site("Bravo");
    ctxA = { ...teamCtx, siteScope: siteA, can: () => true }; ctxB = { ...teamCtx, siteScope: siteB, can: () => true };
    const list = (name, s) => Number(db.prepare("INSERT INTO mk_lists (organization_id, name, site_id) VALUES (?, ?, ?)").run(ORG, name, s).lastInsertRowid);
    listA = list("Liste A", siteA); listB = list("Liste B", siteB); listCommon = list("Liste commune", null);
    X = contactcore.identify(teamCtx, { email: "x.bravo@ex.cd", first_name: "Original-X", source: "admin", siteId: siteB }, {}).contact.id;      // appartient au site B
    Y = contactcore.identify(teamCtx, { email: "y.alpha@ex.cd", first_name: "Original-Y", source: "admin", siteId: siteA }, {}).contact.id;      // appartient au site A
    Z = contactcore.identify(teamCtx, { email: "z.equipe@ex.cd", first_name: "Original-Z", source: "admin" }, {}).contact.id;                   // contact historique sans site
  });

  test("le site de l'import est celui du serveur (portée de l'appelant) ; rien dans le fichier ni les options ne le change ; l'équipe hors espace de site n'a pas de site", () => {
    const p = prev(ctxA, csv(["w.nouveau@ex.cd,Nouveau"], "E-mail,Prénom"));
    assert.equal(one("SELECT site_id FROM mk_imports WHERE id = ?", p.id).site_id, siteA);
    const analysis = imports.analyzeImport(ctxA, p.id, { mapping: MAP, options: { siteId: siteB, site_id: siteB } });   // un « siteId » reçu est ignoré
    assert.equal(analysis.willCreate, 1);
    assert.equal(one("SELECT site_id FROM mk_imports WHERE id = ?", p.id).site_id, siteA);
    const t = prev(teamCtx, csv(["t@ex.cd,T"])); assert.equal(one("SELECT site_id FROM mk_imports WHERE id = ?", t.id).site_id, null, "import d'équipe : aucun site");
    const inSpace = prev({ ...teamCtx, importSite: siteB }, csv(["u@ex.cd,U"])); assert.equal(one("SELECT site_id FROM mk_imports WHERE id = ?", inSpace.id).site_id, siteB, "équipe dans l'espace d'un site : ce site");
    assert.equal(code(() => prev({ ...teamCtx, importSite: 99999 }, csv(["v@ex.cd,V"]))), "not_found", "site inexistant refusé");
  });
  test("portée : un accès limité ne voit, n'analyse, ne lance, ne reprend ni ne télécharge que les imports de SON site ; l'équipe voit tout ; l'équipe d'un espace de site, celui de ce site", () => {
    const a = prev(ctxA, csv(["p1@ex.cd,P"])), b = prev(ctxB, csv(["p2@ex.cd,P"])), t = prev(teamCtx, csv(["p3@ex.cd,P"]));
    for (const [who, ctx, others] of [["A", ctxA, [b.id, t.id]], ["B", ctxB, [a.id, t.id]]]) {
      for (const id of others) {
        assert.equal(imports.getImport(ctx, id), null, `${who} : get`);
        assert.equal(code(() => imports.describeImport(ctx, id)), "not_found"); assert.equal(code(() => imports.analyzeImport(ctx, id, { mapping: MAP, options: {} })), "not_found");
        assert.equal(code(() => imports.startImport(ctx, id, { mapping: MAP, options: {} })), "not_found"); assert.equal(code(() => imports.runImportSlice(ctx, id)), "not_found");
        assert.equal(code(() => imports.resumeImport(ctx, id)), "not_found"); assert.equal(code(() => imports.rejectsCsv(ctx, id)), "not_found");
      }
      assert.ok(imports.listImports(ctx).every((r) => r.site_id === ctx.siteScope), `${who} : liste bornée`);
    }
    assert.ok(imports.getImport(teamCtx, a.id) && imports.getImport(teamCtx, b.id) && imports.getImport(teamCtx, t.id));
    assert.ok(imports.listImports(teamCtx).some((r) => r.site_id === null) && imports.listImports(teamCtx).some((r) => r.site_id === siteA));
    const space = { ...teamCtx, importSite: siteA };
    assert.ok(imports.getImport(space, a.id)); assert.equal(imports.getImport(space, b.id), null); assert.equal(imports.getImport(space, t.id), null, "l'import d'équipe n'est pas dans l'espace d'un site");
    assert.ok(imports.listImports(space).every((r) => r.site_id === siteA));
  });
  test("plafond de lignes d'un import de site (l'équipe hors site n'est pas concernée) ; fichier invalide refusé", () => {
    const big = csv(Array.from({ length: 5001 }, (_, i) => `gros${i}@ex.cd,G`));
    assert.equal(code(() => prev(ctxA, big)), "too_many_rows");
    assert.ok(prev(teamCtx, big).id, "hors site : comportement inchangé");
    assert.ok(prev(ctxA, csv(Array.from({ length: 5000 }, (_, i) => `ok${i}@ex.cd,G`))).id, "5 000 lignes : accepté");
    assert.equal(code(() => prev(ctxA, "E-mail\n")), "invalid_csv");
  });
  test("analyse à blanc OBLIGATOIRE pour un import de site : jamais de lancement sans analyse, ni après un changement de correspondance ou d'options ; l'import d'équipe garde son comportement", () => {
    const p = prev(ctxA, csv(["a1@ex.cd,A1"]));
    assert.equal(code(() => imports.startImport(ctxA, p.id, { mapping: MAP, options: {} })), "analysis_required");
    imports.analyzeImport(ctxA, p.id, { mapping: MAP, options: { updateExisting: "fill" } });
    assert.equal(code(() => imports.startImport(ctxA, p.id, { mapping: MAP, options: { updateExisting: "overwrite" } })), "analysis_required", "options modifiées");
    assert.equal(code(() => imports.startImport(ctxA, p.id, { mapping: ["email", "last_name"], options: { updateExisting: "fill" } })), "analysis_required", "correspondance modifiée");
    assert.equal(one("SELECT status FROM mk_imports WHERE id = ?", p.id).status, "previewed", "rien n'a démarré");
    imports.startImport(ctxA, p.id, { mapping: MAP, options: { updateExisting: "fill" } });
    assert.equal(code(() => imports.startImport(ctxA, p.id, { mapping: MAP, options: { updateExisting: "fill" } })), "invalid_state", "deuxième envoi : déjà démarré");
    const t = prev(teamCtx, csv(["t1@ex.cd,T1"])); assert.ok(imports.startImport(teamCtx, t.id, { mapping: MAP, options: {} }), "import d'équipe sans analyse : inchangé");
  });
  test("DOUBLONS INTER-SITES : une adresse d'un autre site ou de l'équipe n'est ni lue, ni modifiée, ni étiquetée, ni listée, ni abonnée ; le rapport ressemble à une création ; l'équipe reçoit une demande de rattachement", () => {
    const before = { x: { ...contact("x.bravo@ex.cd") }, z: { ...contact("z.equipe@ex.cd") } };
    const file = csv(["x.bravo@ex.cd,Pirate-X", "y.alpha@ex.cd,Maj-Y", "z.equipe@ex.cd,Pirate-Z", "w.nouveau2@ex.cd,Nouveau-W"]);
    const p = prev(ctxA, file);
    const options = { updateExisting: "overwrite", tag: "importe-alpha", listId: listA, consent: { declared: true, confirm: true, text: "Formulaire papier signé le 1er octobre" } };
    const an = imports.analyzeImport(ctxA, p.id, { mapping: MAP, options });
    assert.equal(an.willCreate, 3, "X et Z comptent comme des créations pour le demandeur"); assert.equal(an.willUpdate, 1);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_contact_requests").get().n, 0, "l'analyse n'écrit rien");
    imports.startImport(ctxA, p.id, { mapping: MAP, options });
    let r; do r = imports.runImportSlice(ctxA, p.id); while (!r.done);
    assert.deepEqual({ ...r.report }, { total: 4, created: 3, updated: 1, unchanged: 0, invalid: 0, duplicatesInFile: 0, suppressed: 0, subscribed: 2, blockedUnsubscribed: 0 }, "X et Z : aucune différence visible avec de vraies créations");
    for (const [e, id, name] of [["x.bravo@ex.cd", X, "Original-X"], ["z.equipe@ex.cd", Z, "Original-Z"]]) {
      const c = contact(e); assert.equal(c.first_name, name, `${e} : non modifié`); assert.equal(c.status, e === "x.bravo@ex.cd" ? before.x.status : before.z.status, `${e} : statut inchangé (aucun abonnement)`);
      assert.deepEqual(tagsOf(id), [], `${e} : non étiqueté`); assert.equal(one("SELECT COUNT(*) n FROM mk_list_members WHERE contact_id = ?", id).n, 0, `${e} : hors liste`);
      assert.equal(one("SELECT COUNT(*) n FROM mk_contact_sites WHERE contact_id = ? AND site_id = ?", id, siteA).n, 0, `${e} : aucun lien créé pour le site A`);
      assert.equal(one("SELECT COUNT(*) n FROM mk_consents WHERE contact_id = ?", id).n, 0, `${e} : aucun consentement`);
    }
    const y = contact("y.alpha@ex.cd"), w = contact("w.nouveau2@ex.cd");
    assert.equal(y.first_name, "Maj-Y"); assert.equal(w.first_name, "Nouveau-W"); assert.equal(w.origin_site_id, siteA, "le nouveau contact a le site de l'import pour origine");
    for (const id of [y.id, w.id]) { assert.deepEqual(tagsOf(id), ["importe-alpha"]); assert.equal(one("SELECT COUNT(*) n FROM mk_list_members WHERE contact_id = ? AND list_id = ?", id, listA).n, 1); }
    // demandes de rattachement : pour X et Z seulement, au nom du site A
    assert.deepEqual(all("SELECT email, site_id, status FROM mk_contact_requests ORDER BY email").map((q) => ({ ...q })), [{ email: "x.bravo@ex.cd", site_id: siteA, status: "pending" }, { email: "z.equipe@ex.cd", site_id: siteA, status: "pending" }]);
    assert.deepEqual(requests.listMine(ctxA).map((q) => [q.email, q.state]), [["z.equipe@ex.cd", "pending"], ["x.bravo@ex.cd", "pending"]], "le demandeur voit « en attente », jamais l'identité ni le site d'origine");
    assert.equal(imports.rejectsCsv(ctxA, p.id).includes("bravo"), false, "rien dans les lignes rejetées");
    // l'équipe accepte : lecture seule — un nouvel import n'écrit toujours rien
    const reqX = one("SELECT id FROM mk_contact_requests WHERE email = 'x.bravo@ex.cd'").id;
    requests.decide(teamCtx, reqX, "accept");
    const p2 = prev(ctxA, csv(["x.bravo@ex.cd,Pirate-X2"]));
    imports.analyzeImport(ctxA, p2.id, { mapping: MAP, options: { updateExisting: "overwrite" } }); imports.startImport(ctxA, p2.id, { mapping: MAP, options: { updateExisting: "overwrite" } });
    r = imports.runImportSlice(ctxA, p2.id); assert.equal(r.report.unchanged, 1); assert.equal(contact("x.bravo@ex.cd").first_name, "Original-X", "rattachement en lecture seule : aucune écriture");
  });
  test("listes : seule une liste du site de l'import est acceptée (ni commune, ni d'un autre site)", () => {
    const p = prev(ctxA, csv(["l1@ex.cd,L"]));
    for (const l of [listB, listCommon, 999999]) assert.equal(code(() => imports.analyzeImport(ctxA, p.id, { mapping: MAP, options: { listId: l } })), "not_found", `liste ${l}`);
    assert.ok(imports.analyzeImport(ctxA, p.id, { mapping: MAP, options: { listId: listA } }));
    const tb = prev({ ...teamCtx, importSite: siteB }, csv(["l2@ex.cd,L"])); assert.equal(code(() => imports.analyzeImport({ ...teamCtx, importSite: siteB }, tb.id, { mapping: MAP, options: { listId: listA } })), "not_found", "même règle pour l'équipe dans l'espace du site");
  });
  test("relances : un import terminé ne se relance pas ; réimporter le même fichier ne crée aucun doublon ; la tâche de fond respecte le site même lancée sans portée", () => {
    const f = csv(["r1@ex.cd,R1", "x.bravo@ex.cd,Encore-X"]);
    const run = (opts) => { const p = prev(ctxA, f); imports.analyzeImport(ctxA, p.id, { mapping: MAP, options: opts }); imports.startImport(ctxA, p.id, { mapping: MAP, options: opts }); let r; do r = imports.runImportSlice(ctxA, p.id); while (!r.done); return { p, r }; };
    const first = run({}); assert.equal(first.r.report.created, 1, "r1 créé"); assert.equal(first.r.report.unchanged, 1, "X est lisible (lien en lecture seule accepté plus haut) : jamais modifié");
    assert.equal(code(() => imports.startImport(ctxA, first.p.id, { mapping: MAP, options: {} })), "already_done");
    const second = run({}); assert.equal(second.r.report.created, 0, "rien n'est recréé"); assert.equal(second.r.report.unchanged, 2);
    assert.equal(one("SELECT COUNT(*) n FROM mk_contacts WHERE email = 'r1@ex.cd'").n, 1, "aucun doublon");
    assert.equal(contact("x.bravo@ex.cd").first_name, "Original-X");
    // tâche de fond : ctx de l'équipe sans portée, l'import porte son site
    const p = prev(ctxA, csv(["bg1@ex.cd,BG", "z.equipe@ex.cd,BG-Z"])); imports.analyzeImport(ctxA, p.id, { mapping: MAP, options: { updateExisting: "overwrite" } }); imports.startImport(ctxA, p.id, { mapping: MAP, options: { updateExisting: "overwrite" } });
    const handler = imports.jobHandlers({ db, bus: null }); return handler["import.run"]({ organizationId: ORG, importId: p.id, userId: 7 }).then(() => {
      assert.equal(one("SELECT status FROM mk_imports WHERE id = ?", p.id).status, "done"); assert.equal(contact("bg1@ex.cd").origin_site_id, siteA); assert.equal(contact("z.equipe@ex.cd").first_name, "Original-Z");
    });
  });
  test("journal : début et fin d'un import portent le site de l'import (même lancés par l'équipe), sans adresse e-mail ; lignes rejetées : droit « données sensibles » exigé", () => {
    const logs = all("SELECT action, site_id, metadata FROM mk_audit_logs WHERE action LIKE 'import.%' ORDER BY id");
    assert.ok(logs.some((l) => l.action === "import.started" && l.site_id === siteA) && logs.some((l) => l.action === "import.completed" && l.site_id === siteA));
    assert.ok(logs.filter((l) => l.site_id !== null).every((l) => !/@/.test(l.metadata)), "aucune adresse dans le journal");
    const bad = prev(ctxA, csv(["pas-un-email,Bad", "ok.rejets@ex.cd,Ok"])); imports.analyzeImport(ctxA, bad.id, { mapping: MAP, options: {} }); imports.startImport(ctxA, bad.id, { mapping: MAP, options: {} });
    let r; do r = imports.runImportSlice(ctxA, bad.id); while (!r.done);
    assert.equal(r.report.invalid, 1);
    assert.match(imports.rejectsCsv(ctxA, bad.id), /pas-un-email/);
    assert.equal(code(() => imports.rejectsCsv({ ...ctxA, can: (p) => p !== "contacts.view_sensitive" }, bad.id)), "forbidden");
    assert.equal(code(() => imports.rejectsCsv(ctxB, bad.id)), "not_found");
  });
});
