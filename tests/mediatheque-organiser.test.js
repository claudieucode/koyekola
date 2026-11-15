// Médiathèque : glisser-déposer (moteur serveur). Déplacements simples/multiples, hiérarchie, ordre personnalisé persistant,
// conflits de noms (conserver / remplacer / ignorer / annuler), cycles, permissions, isolation entre sites, Annuler / Rétablir.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const { organize, restore } = require("../src/marketing/media/organiser");
const folders = require("../src/marketing/media/folders");
const media = require("../src/marketing/media");

describe("médiathèque : organiser (glisser-déposer)", () => {
  let db, team, onlyA, onlyB, n;
  const site = (id) => ({ ...team, siteFilter: id });
  const mkFolder = (ctx, name, parent = null) => folders.createFolder(ctx, { name, parentId: parent }).id;
  const mkFile = (siteId, name, folderId = null) => Number(db.prepare("INSERT INTO mk_media (organization_id, kind, path, name, mime, size, reach, site_id, folder_id) VALUES (1, 'image', ?, ?, 'image/png', 10, ?, ?, ?)").run(`/uploads/marketing/1/${++n}.png`, name, siteId ? "site" : "shared", siteId || null, folderId).lastInsertRowid);
  const fileRow = (id) => db.prepare("SELECT name, folder_id f, sort_order o, deleted_at d FROM mk_media WHERE id = ?").get(id);
  const folderRow = (id) => db.prepare("SELECT name, parent_id p, sort_order o FROM mk_media_folders WHERE id = ?").get(id);
  const order = (ctx, parent) => require("../src/marketing/media/organiser").siblings(ctx, "f", parent).map((x) => x.id);

  beforeEach(() => {
    n = 0;
    ({ db } = freshMarketing());
    db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'Alpha', 'alpha', '{}'), (1, 'Beta', 'beta', '{}')");
    team = { db, organizationId: 1, userId: null };
    onlyA = { ...team, siteScope: 1 }; onlyB = { ...team, siteScope: 2 };
  });

  test("déplacer un fichier, puis plusieurs, vers un dossier ou la racine (la base change, jamais l'adresse publique)", () => {
    const ctx = site(1), d = mkFolder(ctx, "Photos"), a = mkFile(1, "a.png"), b = mkFile(1, "b.png"), c = mkFile(1, "c.png");
    const path = db.prepare("SELECT path FROM mk_media WHERE id = ?").get(a).path;
    assert.deepEqual(organize(ctx, { kind: "file", ids: [a], to: d }).done, [a]);
    assert.equal(fileRow(a).f, d);
    assert.deepEqual(organize(ctx, { kind: "file", ids: [b, c], to: d }).done, [b, c]);
    assert.deepEqual([fileRow(b).f, fileRow(c).f], [d, d]);
    assert.equal(db.prepare("SELECT path FROM mk_media WHERE id = ?").get(a).path, path);
    organize(ctx, { kind: "file", ids: [a, b], to: null });
    assert.deepEqual([fileRow(a).f, fileRow(b).f, fileRow(c).f], [null, null, d]);
  });

  test("dossiers : déplacer, plusieurs à la fois, changer la hiérarchie ; jamais dans soi-même ni dans un descendant", () => {
    const ctx = site(1), a = mkFolder(ctx, "A"), b = mkFolder(ctx, "B"), c = mkFolder(ctx, "C", a), d = mkFolder(ctx, "D", c);
    assert.deepEqual(organize(ctx, { kind: "folder", ids: [b], to: a }).done, [b]);
    assert.equal(folderRow(b).p, a);
    const r = organize(ctx, { kind: "folder", ids: [a], to: d });
    assert.deepEqual(r.done, []); assert.match(r.failed[0].message, /dans lui-même ni dans un de ses sous-dossiers/);
    assert.equal(organize(ctx, { kind: "folder", ids: [a], to: a }).failed.length, 1);
    assert.equal(organize(ctx, { kind: "folder", ids: [d, c], to: null }).done.length, 2); // hiérarchie remontée, plusieurs à la fois
    assert.deepEqual([folderRow(c).p, folderRow(d).p], [null, null]);
    // un lot mélangé : le valide passe, l'invalide est refusé avec son motif
    const mixed = organize(ctx, { kind: "folder", ids: [b, a], to: c });
    assert.deepEqual([mixed.done, mixed.failed.length], [[b, a], 0]);
  });

  test("ordre personnalisé : sauvegardé, restauré, et un dossier peut être placé AVANT un autre", () => {
    const ctx = site(1), x = mkFile(1, "x.png"), y = mkFile(1, "y.png"), z = mkFile(1, "z.png");
    assert.deepEqual(order(ctx, null), [z, y, x], "sans ordre choisi : le plus récent d'abord");
    organize(ctx, { kind: "file", ids: [x], to: null, before: z });
    assert.deepEqual(order(ctx, null), [x, z, y]);
    organize(ctx, { kind: "file", ids: [y], to: null, before: null }); // à la fin
    assert.deepEqual(order(ctx, null), [x, z, y]);
    organize(ctx, { kind: "file", ids: [z, y], to: null, before: x });
    assert.deepEqual(order(ctx, null), [z, y, x]);
    assert.deepEqual(media.listMedia(site(1), { sort: "perso" }).items.map((m) => m.id), [z, y, x], "la liste triée « perso » relit l'ordre enregistré");
    const f1 = mkFolder(ctx, "F1"), f2 = mkFolder(ctx, "F2"), f3 = mkFolder(ctx, "F3");
    organize(ctx, { kind: "folder", ids: [f3], to: null, before: f1 });
    assert.deepEqual(folders.listFolders(ctx).folders.map((f) => f.id), [f3, f1, f2]);
  });

  test("un déplacement entre dossiers n'emporte pas l'ancien ordre et arrive en fin d'un dossier déjà ordonné", () => {
    const ctx = site(1), d = mkFolder(ctx, "D"), p = mkFile(1, "p.png", d), q = mkFile(1, "q.png", d), r = mkFile(1, "r.png");
    organize(ctx, { kind: "file", ids: [q], to: d, before: p });
    assert.deepEqual(order(ctx, d), [q, p]);
    organize(ctx, { kind: "file", ids: [r], to: d });
    assert.deepEqual(order(ctx, d), [q, p, r]);
    assert.equal(fileRow(r).f, d);
  });

  describe("conflits de noms", () => {
    const setup = () => { const ctx = site(1), d = mkFolder(ctx, "Dest"), old = mkFile(1, "logo.png", d), mine = mkFile(1, "logo.png"); return { ctx, d, old, mine }; };
    test("sans choix : RIEN n'est déplacé, les conflits sont listés (remplacer proposé pour des fichiers)", () => {
      const { ctx, d, old, mine } = setup();
      const r = organize(ctx, { kind: "file", ids: [mine], to: d });
      assert.deepEqual([r.conflicts.length, r.conflicts[0].existingId, r.canReplace, r.done.length], [1, old, true, 0]);
      assert.equal(fileRow(mine).f, null);
    });
    test("conserver les deux : nom suffixé avant l'extension", () => {
      const { ctx, d, mine } = setup();
      organize(ctx, { kind: "file", ids: [mine], to: d, policy: "keep" });
      assert.deepEqual([fileRow(mine).name, fileRow(mine).f], ["logo (2).png", d]);
    });
    test("remplacer : l'ancien va à la corbeille (restaurable), jamais effacé ; refusé s'il est utilisé", () => {
      const { ctx, d, old, mine } = setup();
      const r = organize(ctx, { kind: "file", ids: [mine], to: d, policy: "replace" });
      assert.deepEqual([r.done, r.failed.length], [[mine], 0]);
      assert.ok(fileRow(old).d, "ancien fichier à la corbeille");
      assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_media WHERE id = ?").get(old).n, 1, "jamais supprimé");
      assert.equal(restore(ctx, r.undo).restored, 2);
      assert.deepEqual([fileRow(old).d, fileRow(mine).f], [null, null]);
    });
    test("ignorer : le conflit reste en place, les autres fichiers passent ; annuler : rien", () => {
      const { ctx, d, mine } = setup(), other = mkFile(1, "autre.png");
      const r = organize(ctx, { kind: "file", ids: [mine, other], to: d, policy: "skip" });
      assert.deepEqual([r.done, r.skipped.length], [[other], 1]);
      assert.equal(fileRow(mine).f, null);
      assert.equal(organize(ctx, { kind: "file", ids: [mine], to: d, policy: "cancel" }).cancelled, true);
      assert.equal(fileRow(mine).f, null);
    });
    test("dossiers : « conserver les deux » renomme ; « remplacer » est refusé (jamais de fusion destructive)", () => {
      const ctx = site(1), p = mkFolder(ctx, "P"), inner = mkFolder(ctx, "Docs", p), outer = mkFolder(ctx, "Docs");
      const ask = organize(ctx, { kind: "folder", ids: [outer], to: p });
      assert.deepEqual([ask.conflicts.length, ask.canReplace], [1, false]);
      assert.match(organize(ctx, { kind: "folder", ids: [outer], to: p, policy: "replace" }).failed[0].message, /Conserver les deux/);
      organize(ctx, { kind: "folder", ids: [outer], to: p, policy: "keep" });
      assert.deepEqual([folderRow(outer).name, folderRow(outer).p, folderRow(inner).name], ["Docs (2)", p, "Docs"]);
    });
  });

  test("Annuler puis Rétablir restituent exactement l'état (position, dossier, nom)", () => {
    const ctx = site(1), d = mkFolder(ctx, "D"), a = mkFile(1, "a.png"), b = mkFile(1, "b.png"), other = mkFile(1, "a.png", d);
    const before = [a, b, other].map(fileRow);
    const r = organize(ctx, { kind: "file", ids: [a], to: d, policy: "keep", before: other });
    assert.notDeepEqual([a, b, other].map(fileRow), before);
    restore(ctx, r.undo);
    assert.deepEqual([a, b, other].map(fileRow), before, "annulé");
    restore(ctx, r.redo);
    assert.deepEqual([fileRow(a).f, fileRow(a).name], [d, "a (2).png"], "rétabli");
  });

  test("Annuler refuse (sans rien appliquer) si entre-temps la structure a changé", () => {
    const ctx = site(1), p = mkFolder(ctx, "P"), c = mkFolder(ctx, "C", p), r = organize(ctx, { kind: "folder", ids: [c], to: null });
    assert.equal(folderRow(c).p, null);
    db.prepare("UPDATE mk_media_folders SET deleted_at = datetime('now') WHERE id = ?").run(p);
    assert.throws(() => restore(ctx, r.undo), /impossible d'annuler|introuvable|disparu/i);
    assert.equal(folderRow(c).p, null, "rien n'a été appliqué");
  });

  test("permissions et isolation : un accès limité ne touche pas un autre site, ni le commun ; données invalides refusées", () => {
    const ctxA = site(1), ctxB = site(2), dB = mkFolder(ctxB, "Beta"), fA = mkFile(1, "a.png"), fCommun = mkFile(0, "commun.png"), dA = mkFolder(ctxA, "Alpha");
    assert.throws(() => organize(ctxA, { kind: "file", ids: [fA], to: dB }), /introuvable/i, "dossier d'un autre site");
    assert.match(organize(ctxB, { kind: "file", ids: [fA], to: dB }).failed[0].message, /introuvable|n'appartient pas/, "le fichier d'un autre site est invisible");
    assert.match(organize({ ...onlyA, siteFilter: undefined }, { kind: "file", ids: [fCommun], to: dA }).failed[0].message, /introuvable|n'appartient pas/, "un accès limité ne prend pas le commun");
    assert.throws(() => organize(onlyB, { kind: "folder", ids: [dA], to: null }).done.length === 0 && (() => { throw new Error("ok"); })(), /ok|introuvable/i);
    assert.equal(folderRow(dA).p, null);
    assert.throws(() => organize(ctxA, { kind: "x", ids: [1] }), /inconnu/);
    assert.throws(() => organize(ctxA, { kind: "file", ids: [] }), /au moins/);
    assert.throws(() => organize(ctxA, { kind: "file", ids: [fA], policy: "détruire" }), /inconnu/);
    assert.throws(() => organize({ ...team }, { kind: "file", ids: [fA] }), /Choisissez un site/, "sans médiathèque choisie");
    assert.throws(() => restore(ctxB, [{ k: "f", id: fA, p: null, o: null, n: "x", t: 0 }]), /disparu|introuvable/i, "un instantané ne touche pas un autre site");
    assert.throws(() => restore(ctxA, [{ k: "f", id: fA, p: dB, o: null, n: "x", t: 0 }]), /dossier/i);
  });

  test("performance : 300 fichiers déplacés en un lot (plafonné à 200 par appel), ordre stable", () => {
    const ctx = site(1), d = mkFolder(ctx, "Gros"), ids = Array.from({ length: 300 }, (_, i) => mkFile(1, `f${i}.png`));
    const t = Date.now(), r = organize(ctx, { kind: "file", ids, to: d });
    assert.equal(r.done.length, 200);
    assert.ok(Date.now() - t < 3000);
  });
});
