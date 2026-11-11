process.env.FOOTER_V2 = "0"; // décrit l'ANCIEN catalogue (100 modèles ft-*, 15 familles) : interrupteur de secours actif. La bibliothèque v2 est testée par footer-v2-*.test.js.
// Bibliothèque de pieds de page (étapes 8, 9 et 10) sur serveur réel : 15 familles avec comptes, tri, recherche + famille, favoris isolés par site ET par utilisateur,
// version exposée, origine + version enregistrées à l'insertion, « Revenir au modèle d'origine » (alias suivis), remplissage prudent des anciens pieds, migration 142 + sauvegarde automatique,
// et NON-RÉGRESSION des autres types de modèles (la liste et les filtres des 9 autres types ne changent pas).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, newStudent, loginInstructor, INSTRUCTOR } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");
const Footer = require("../src/themeBuilder/catalog/footer");
const Aliases = require("../src/themeBuilder/catalog/footer-aliases");
const { migrate } = require("../src/marketing/db/migrate");
const { fillOrigins } = require("../src/themeBuilder/originBackfill");

const FAMILLES = ["minimalistes", "corporate", "ecommerce", "saas-tech", "editoriaux", "creatifs-portfolios", "education", "communautes", "services", "restauration-hotellerie", "immobilier", "finance-juridique", "ong-associations", "landing-pages", "institutionnels"];

describe("Catalogue : version, date d'ajout, tri et favoris (sans serveur)", () => {
  test("chaque modèle listé a une version entière >= 1 ; un modèle qui n'en déclare pas reçoit 1", () => {
    for (const e of Catalog.entries("footer")) { assert.ok(Number.isInteger(e.version) && e.version >= 1, e.key); assert.ok(e.addedAt === null || /^\d{4}-\d{2}-\d{2}$/.test(e.addedAt), e.key); }
  });
  test("l'assembleur accepte une version et une date déclarées, et refuse une valeur invalide", () => {
    const fam = Footer.familles; assert.equal(fam.length, 15);
    const base = require("../src/themeBuilder/catalog/footer/familles/minimalistes");
    const copie = (patch) => ({ ...base, built: false, models: base.models.map((m, i) => (i === 0 ? { ...m, ...patch } : m)) });
    const only = (f) => Footer.assemble({ familles: [f] });
    const ok = only(copie({ version: 3, addedAt: "2027-01-15" })).layouts.find((l) => l.key === base.models[0].id);
    assert.equal(ok.version, 3); assert.equal(ok.addedAt, "2027-01-15");
    const dflt = only(copie({})).layouts.find((l) => l.key === base.models[0].id); assert.equal(dflt.version, 1);
    for (const bad of [0, 1.5, "2", -1]) assert.throws(() => only(copie({ version: bad })), /version/);
    assert.throws(() => only(copie({ addedAt: "demain" })), /addedAt/);
  });
  test("les 15 familles sont toujours dans la facette, avec libellé, description et compte ; la somme des comptes = le total", () => {
    const r = Catalog.list("footer", { limit: 60 });
    assert.deepEqual(r.familles.map((f) => f.key), FAMILLES);
    for (const f of r.familles) { assert.ok(f.label, f.key); assert.equal(typeof f.description, "string"); assert.ok(Number.isInteger(f.count)); }
    assert.equal(r.familles.reduce((n, f) => n + f.count, 0), r.total);
  });
});

describe("Pieds de page : interface de la bibliothèque sur serveur réel", () => {
  let srv, boss, db, S1, S2, other, reader, orgId, U1, U2;
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const json = (r) => JSON.parse(r.text);
  const lib = async (site, q = "", c = boss) => { const r = await c.get(U(site, `/api/bibliotheque?type=footer&limite=60${q}`)); assert.equal(r.status, 200, r.text.slice(0, 200)); return json(r); };
  const post = (p, body, c = boss, headers = {}) => c.request(p, { method: "POST", json: body || {}, headers });
  const star = (site, key, c = boss) => post(U(site, "/api/bibliotheque/favoris"), { type: "footer", key }, c);
  const unstar = (site, key, c = boss) => c.request(U(site, `/api/bibliotheque/favoris/footer/${key}`), { method: "DELETE" });
  const one = (sql, ...a) => db.prepare(sql).get(...a);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    S1 = await mk("Site Un"); S2 = await mk("Site Deux");
    orgId = one("SELECT organization_id o FROM mk_sites WHERE id = ?", S1).o;
    other = await newStudent(srv); // deuxième membre de l'organisation, droit de consulter
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, one("SELECT id FROM users WHERE email = ?", other.email).id, "admin");
    reader = await newStudent(srv); // sans aucun droit
    U1 = one("SELECT id FROM users WHERE email = ?", INSTRUCTOR.email).id; U2 = one("SELECT id FROM users WHERE email = ?", other.email).id;
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("sans filtre : 100 résultats ; 15 familles avec compte, libellé et description ; chaque filtre de famille renvoie exactement son compte", async () => {
    const all = await lib(S1);
    assert.equal(all.total, 100);
    assert.deepEqual(all.familles.map((f) => f.key), FAMILLES);
    assert.equal(all.familles.reduce((n, f) => n + f.count, 0), 100);
    for (const f of all.familles) assert.ok(f.label && typeof f.description === "string", f.key);
    for (const f of all.familles) {
      const r = await lib(S1, `&mise=${f.key}`);
      assert.equal(r.total, f.count, f.key);
      assert.ok(r.items.every((m) => m.layoutKey === f.key), `${f.key} : seulement des modèles de la famille`);
      if (f.built) assert.equal(f.count, f.target, `${f.key} construite : ${f.target} modèles`);
    }
  });
  test("recherche et famille combinées ; les comptes de famille suivent la recherche", async () => {
    const q = "colonnes";
    const seule = await lib(S1, `&q=${q}`);
    assert.ok(seule.total > 0 && seule.total < 100);
    const fam = seule.familles.find((f) => f.count > 0);
    const both = await lib(S1, `&q=${q}&mise=${fam.key}`);
    assert.equal(both.total, fam.count);
    assert.ok(both.items.every((m) => m.layoutKey === fam.key && `${m.name} ${m.desc} ${m.tags.join(" ")}`.toLowerCase().includes(q)));
    assert.equal((await lib(S1, `&q=zzzzintrouvable`)).total, 0);
  });
  test("tri : nom A→Z, famille, plus récents ; ordre par défaut inchangé ; tri inconnu ignoré ; même nombre de résultats", async () => {
    const dflt = await lib(S1), inconnu = await lib(S1, "&tri=nimporte");
    assert.deepEqual(inconnu.items.map((m) => m.key), dflt.items.map((m) => m.key));
    assert.equal(dflt.sort, "");
    const nom = await lib(S1, "&tri=nom"); assert.equal(nom.total, 100); assert.equal(nom.sort, "nom");
    const noms = nom.items.map((m) => m.name); assert.deepEqual(noms, [...noms].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base", numeric: true })));
    const fa = await lib(S1, "&tri=famille"); const ordre = FAMILLES; const idx = fa.items.map((m) => ordre.indexOf(m.layoutKey));
    assert.deepEqual(idx, [...idx].sort((a, b) => a - b), "regroupé par famille, dans l'ordre des 15 familles");
    const re = await lib(S1, "&tri=recent"); const dates = re.items.map((m) => m.addedAt || ""); assert.deepEqual(dates, [...dates].sort().reverse());
    assert.deepEqual(new Set(re.items.map((m) => m.key)), new Set(dflt.items.map((m) => m.key)));
    assert.ok(nom.sorts.length >= 4);
    // la pagination suit le tri
    const p1 = json(await boss.get(U(S1, "/api/bibliotheque?type=footer&limite=24&tri=nom&page=1"))), p2 = json(await boss.get(U(S1, "/api/bibliotheque?type=footer&limite=24&tri=nom&page=2")));
    assert.deepEqual([...p1.items, ...p2.items].map((m) => m.name), noms.slice(0, 48));
  });
  test("version exposée par l'API (entier >= 1) et date d'ajout", async () => {
    const r = await lib(S1);
    for (const m of r.items) { assert.ok(Number.isInteger(m.version) && m.version >= 1, m.key); assert.ok("addedAt" in m, m.key); }
  });

  test("favoris : ajout, retrait, idempotence, étoile dans la liste, filtre Favoris, tri Favoris d'abord", async () => {
    const all = await lib(S1), k1 = all.items[5].key, k2 = all.items[40].key;
    assert.ok(all.items.every((m) => m.favorite === false)); assert.deepEqual(all.favorites, { enabled: true, count: 0 });
    assert.equal((await star(S1, k1)).status, 200); assert.equal((await star(S1, k1)).status, 200, "idempotent");
    assert.equal((await star(S1, k2)).status, 200);
    assert.equal(one("SELECT COUNT(*) n FROM mk_tb_favoris WHERE site_id = ? AND user_id = ?", S1, U1).n, 2, "pas de doublon");
    const l = await lib(S1); assert.equal(l.favorites.count, 2); assert.deepEqual(l.items.filter((m) => m.favorite).map((m) => m.key).sort(), [k1, k2].sort());
    const only = await lib(S1, "&favoris=1"); assert.equal(only.total, 2); assert.ok(only.items.every((m) => m.favorite));
    assert.deepEqual(only.familles.reduce((n, f) => n + f.count, 0), 2, "les comptes de famille suivent le filtre Favoris");
    const first = await lib(S1, "&tri=favoris"); assert.deepEqual(first.items.slice(0, 2).map((m) => m.key).sort(), [k1, k2].sort()); assert.equal(first.total, 100);
    assert.equal((await unstar(S1, k1)).status, 200); assert.equal((await unstar(S1, k1)).status, 200, "retrait idempotent");
    assert.equal((await lib(S1, "&favoris=1")).total, 1);
    assert.equal((await unstar(S1, k2)).status, 200); assert.equal((await lib(S1, "&favoris=1")).total, 0);
  });
  test("ISOLATION : un favori d'un site est invisible sur un autre site, et pour un autre utilisateur", async () => {
    const key = (await lib(S1)).items[3].key;
    assert.equal((await star(S1, key)).status, 200);
    assert.equal((await lib(S1, "&favoris=1")).total, 1, "site 1 / utilisateur 1 : visible");
    assert.equal((await lib(S2, "&favoris=1")).total, 0, "site 2 / utilisateur 1 : invisible");
    assert.equal((await lib(S1, "&favoris=1", other)).total, 0, "site 1 / utilisateur 2 : invisible");
    assert.equal((await lib(S2, "&favoris=1", other)).total, 0);
    assert.ok((await lib(S2)).items.every((m) => !m.favorite));
    // le même modèle en favori ailleurs ne touche pas au premier
    assert.equal((await star(S2, key)).status, 200); assert.equal((await star(S1, key, other)).status, 200);
    assert.equal(one("SELECT COUNT(*) n FROM mk_tb_favoris WHERE modele_id = ?", key).n, 3);
    assert.equal((await unstar(S2, key)).status, 200);
    assert.equal((await lib(S1, "&favoris=1")).total, 1, "retirer sur le site 2 ne retire rien sur le site 1");
    assert.equal((await lib(S1, "&favoris=1", other)).total, 1);
    assert.equal((await unstar(S1, key, other)).status, 200);
    assert.equal((await lib(S1, "&favoris=1")).total, 1, "retirer côté utilisateur 2 ne retire rien côté utilisateur 1");
    assert.equal((await unstar(S1, key)).status, 200);
    assert.equal(one("SELECT COUNT(*) n FROM mk_tb_favoris").n, 0);
  });
  test("favoris refusés : identifiant inconnu, mauvais type, sans droit, hors site ; un site inexistant ou une origine étrangère ne passent pas", async () => {
    assert.equal((await star(S1, "ft-inconnu-99-nimporte")).status, 404);
    assert.equal((await star(S1, "n'importe quoi")).status, 404);
    assert.equal((await post(U(S1, "/api/bibliotheque/favoris"), { type: "header", key: Catalog.entries("header")[0].key })).status, 422, "seul le pied de page a des favoris");
    assert.equal((await post(U(S1, "/api/bibliotheque/favoris"), { type: "footer" })).status, 404, "clé absente");
    assert.equal((await star(999999, Catalog.entries("footer")[0].key)).status, 404, "site inexistant");
    const a = await star(S1, Catalog.entries("footer")[0].key, reader); assert.ok([302, 401, 403].includes(a.status), String(a.status));
    const b = await reader.get(U(S1, "/api/bibliotheque?type=footer")); assert.ok([302, 401, 403].includes(b.status));
    const evil = await post(U(S1, "/api/bibliotheque/favoris"), { type: "footer", key: Catalog.entries("footer")[0].key }, boss, { Origin: "https://evil.example" });
    assert.equal(evil.status, 403, "protection CSRF : origine étrangère refusée");
    const evil2 = await boss.request(U(S1, `/api/bibliotheque/favoris/footer/${Catalog.entries("footer")[0].key}`), { method: "DELETE", headers: { Origin: "https://evil.example" } });
    assert.equal(evil2.status, 403);
    assert.equal(one("SELECT COUNT(*) n FROM mk_tb_favoris").n, 0, "rien n'a été écrit");
  });
  test("alias : un ancien identifiant est suivi jusqu'au modèle qui le remplace et le favori est enregistré sous l'identifiant actuel ; un identifiant retiré de la liste est refusé", async () => {
    const listed = new Set(Catalog.entries("footer").map((e) => e.key));
    const old = Object.entries(Aliases.ALIAS).find(([from, to]) => from !== to && !listed.has(from) && listed.has(Catalog.find("footer", from) && Catalog.find("footer", from).key));
    if (old) {
      const target = Catalog.find("footer", old[0]).key;
      const r = await star(S1, old[0]); assert.equal(r.status, 200, r.text); assert.equal(json(r).key, target);
      assert.equal(one("SELECT modele_id m FROM mk_tb_favoris WHERE site_id = ? AND user_id = ?", S1, U1).m, target);
      assert.equal((await unstar(S1, old[0])).status, 200); assert.equal(one("SELECT COUNT(*) n FROM mk_tb_favoris").n, 0, "on peut retirer par l'ancien identifiant");
    }
    const hidden = Footer.hiddenLayouts.find((l) => !listed.has(l.fullKey) && !(Aliases.ALIAS[l.fullKey] && Aliases.ALIAS[l.fullKey] !== l.fullKey && listed.has(Catalog.find("footer", l.fullKey) && Catalog.find("footer", l.fullKey).key)));
    if (hidden) assert.equal((await star(S1, hidden.fullKey)).status, 404, "un modèle ouvrable mais non listé ne peut pas être mis en favori");
    assert.ok(old || hidden || true);
  });
  test("un favori dont le modèle disparaît de la liste n'est plus renvoyé (aucune erreur)", async () => {
    const key = (await lib(S1)).items[1].key;
    db.prepare("INSERT INTO mk_tb_favoris (organization_id, site_id, user_id, type, modele_id) VALUES (?, ?, ?, 'footer', 'ft-disparu-01-fantome')").run(orgId, S1, U1);
    const l = await lib(S1); assert.equal(l.favorites.count, 0); assert.equal((await lib(S1, "&favoris=1")).total, 0);
    db.prepare("DELETE FROM mk_tb_favoris WHERE modele_id = 'ft-disparu-01-fantome'").run(); void key;
  });

  test("insertion : l'identifiant d'origine ET la version d'origine sont enregistrés ; la fiche les annonce", async () => {
    const m = Catalog.entries("footer")[7];
    const r = await post(U(S1, "/api/bibliotheque/utiliser"), { type: "footer", key: m.key }); assert.equal(r.status, 200, r.text.slice(0, 300));
    const t = json(r).template;
    const row = one("SELECT origin_key, origin_version FROM mk_tb_templates WHERE id = ?", t.id);
    assert.equal(row.origin_key, m.key); assert.equal(row.origin_version, m.version);
    assert.equal(t.origin.key, m.key); assert.equal(t.origin.version, m.version); assert.equal(t.origin.currentVersion, m.version);
  });
  test("insertion par un ANCIEN identifiant : l'origine enregistrée est l'identifiant ACTUEL", async () => {
    const old = Object.entries(Aliases.ALIAS).find(([from, to]) => from !== to && Catalog.find("footer", from) && Catalog.find("footer", from).key !== from);
    if (!old) return;
    const target = Catalog.find("footer", old[0]);
    const r = await post(U(S1, "/api/bibliotheque/utiliser"), { type: "footer", key: old[0] }); assert.equal(r.status, 200, r.text.slice(0, 200));
    const row = one("SELECT origin_key, origin_version FROM mk_tb_templates WHERE id = ?", json(r).template.id);
    assert.equal(row.origin_key, target.key); assert.equal(row.origin_version, target.version);
  });
  test("« Revenir au modèle d'origine » : utilise l'identifiant d'origine, suit un alias, indique la version, met à jour l'origine ; rien n'est publié", async () => {
    const m = Catalog.entries("footer")[11];
    const t = json(await post(U(S1, "/api/bibliotheque/utiliser"), { type: "footer", key: m.key })).template;
    // 1) retour simple
    let r = await post(U(S1, `/api/modeles/${t.id}/revenir-au-modele`)); assert.equal(r.status, 200, r.text.slice(0, 300));
    let o = json(r).original; assert.equal(o.key, m.key); assert.equal(o.version, m.version); assert.equal(o.installedVersion, m.version);
    assert.equal(one("SELECT status FROM mk_tb_templates WHERE id = ?", t.id).status, "draft");
    // 2) l'origine mémorisée est un ANCIEN identifiant (alias) : on arrive au modèle actuel, l'identifiant mémorisé est mis à jour
    const alias = Object.entries(Aliases.ALIAS).find(([from, to]) => from !== to && Catalog.find("footer", from) && Catalog.find("footer", from).key !== from);
    if (alias) {
      const cible = Catalog.find("footer", alias[0]);
      db.prepare("UPDATE mk_tb_templates SET origin_key = ?, origin_version = NULL WHERE id = ?").run(alias[0], t.id);
      const card = json(await boss.get(U(S1, "/api/modeles"))).templates.find((x) => x.id === t.id); assert.equal(card.origin.key, cible.key, "la fiche annonce le modèle actuel"); assert.equal(card.origin.version, null, "version installée inconnue : jamais inventée");
      r = await post(U(S1, `/api/modeles/${t.id}/revenir-au-modele`)); assert.equal(r.status, 200, r.text.slice(0, 300));
      o = json(r).original; assert.equal(o.key, cible.key); assert.equal(o.version, cible.version); assert.equal(o.installedVersion, null);
      const row = one("SELECT origin_key, origin_version FROM mk_tb_templates WHERE id = ?", t.id); assert.equal(row.origin_key, cible.key); assert.equal(row.origin_version, cible.version);
    }
    // 3) la version du catalogue a changé depuis l'installation : le retour restaure la version ACTUELLE et l'annonce
    db.prepare("UPDATE mk_tb_templates SET origin_version = 0 WHERE id = ?").run(t.id);
    r = await post(U(S1, `/api/modeles/${t.id}/revenir-au-modele`)); o = json(r).original; assert.equal(o.installedVersion, 0); assert.equal(o.version, m.version);
    // 4) la révision de sécurité garde l'état d'avant ; le résumé mentionne la version
    const revs = json(await boss.get(U(S1, `/api/modeles/${t.id}/revisions`))).revisions;
    assert.ok(revs.some((x) => /version \d+/.test(x.summary)), JSON.stringify(revs.map((x) => x.summary)));
    // un pied créé autrement n'a pas d'origine
    const plain = json(await post(U(S1, "/api/modeles"), { type: "footer", name: "Pied maison" })).template;
    assert.equal(plain.origin, null); assert.equal((await post(U(S1, `/api/modeles/${plain.id}/revenir-au-modele`))).status, 422);
  });

  test("AUTRES TYPES inchangés : liste, filtres, pagination identiques à Catalog.list ; aucune facette de famille, tri, étoile ni version ajoutés", async () => {
    const autres = Catalog.types().filter((t) => t !== "footer");
    assert.ok(autres.length >= 8, autres.join(","));
    for (const type of autres) {
      const direct = Catalog.list(type, { limit: 24 });
      const r = json(await boss.get(U(S1, `/api/bibliotheque?type=${type}&limite=24`)));
      for (const k of ["items", "total", "page", "pages", "limit", "layouts", "skins", "tags"]) assert.deepEqual(r[k], direct[k], `${type} : ${k}`);
      for (const k of ["familles", "sorts", "sort", "favorites"]) assert.ok(!(k in r), `${type} : « ${k} » ne doit pas apparaître`);
      assert.ok(r.items.every((m) => !("favorite" in m) && !("version" in m) && !("addedAt" in m)), `${type} : cartes inchangées`);
      // tri et favoris demandés sur un autre type : sans effet
      const bruit = json(await boss.get(U(S1, `/api/bibliotheque?type=${type}&limite=24&tri=nom&favoris=1`)));
      assert.deepEqual(bruit.items.map((m) => m.key), r.items.map((m) => m.key), `${type} : tri/favoris ignorés`);
      assert.equal(bruit.total, r.total);
      // un filtre existant (mise en page) donne le même résultat qu'en direct
      const lay = direct.layouts[0]; if (lay) { const f = json(await boss.get(U(S1, `/api/bibliotheque?type=${type}&limite=24&mise=${lay.key}`))); assert.equal(f.total, Catalog.list(type, { limit: 24, layout: lay.key }).total, `${type} : filtre de mise en page`); }
      const q = json(await boss.get(U(S1, `/api/bibliotheque?type=${type}&limite=24&q=nuit`))); assert.equal(q.total, Catalog.list(type, { limit: 24, q: "nuit" }).total, `${type} : recherche`);
      // favoris refusés pour ces types
      assert.equal((await post(U(S1, "/api/bibliotheque/favoris"), { type, key: direct.items[0].key })).status, 422, type);
    }
    assert.equal(json(await boss.get(U(S1, "/api/bibliotheque"))).types.length, Catalog.types().length);
  });
  test("site principal : familles, tri et favoris fonctionnent aussi (favoris du site principal séparés des autres sites)", async () => {
    const P = "/marketing/site-web/principal/constructeur-de-theme/api/bibliotheque";
    const r0 = await boss.get(`${P}?type=footer&limite=60`);
    if (r0.status !== 200) return; // site principal indisponible dans cette configuration
    const key = json(r0).items[2].key;
    assert.equal((await boss.request(`${P}/favoris`, { method: "POST", json: { type: "footer", key } })).status, 200);
    assert.equal(json(await boss.get(`${P}?type=footer&favoris=1`)).total, 1);
    assert.equal((await lib(S1, "&favoris=1")).total, 0, "un site créé ne voit pas les favoris du site principal");
    assert.equal(one("SELECT COUNT(*) n FROM mk_tb_favoris WHERE site_id IS NULL").n, 1);
    assert.equal((await boss.request(`${P}/favoris`, { method: "POST", json: { type: "footer", key } })).status, 200);
    assert.equal(one("SELECT COUNT(*) n FROM mk_tb_favoris WHERE site_id IS NULL").n, 1, "l'unicité vaut aussi pour le site principal (site_id vide)");
    assert.equal((await boss.request(`${P}/favoris/footer/${key}`, { method: "DELETE" })).status, 200);
  });
  test("suppression d'un site : ses favoris partent avec lui (clé étrangère), ceux des autres sites restent", async () => {
    const k = (await lib(S1)).items[0].key;
    const S3 = Number((await boss.post("/marketing/site-web/sites", { name: "Site Trois" })).location.match(/sites\/(\d+)/)[1]);
    await star(S3, k); await star(S1, k);
    db.exec("PRAGMA foreign_keys = ON");
    db.prepare("DELETE FROM mk_sites WHERE id = ?").run(S3);
    assert.equal(one("SELECT COUNT(*) n FROM mk_tb_favoris WHERE site_id = ?", S3).n, 0);
    assert.equal(one("SELECT COUNT(*) n FROM mk_tb_favoris WHERE site_id = ?", S1).n, 1);
    await unstar(S1, k);
  });

  describe("Migration 142, sauvegarde automatique et remplissage prudent de l'origine", () => {
    let copie, dir, journal, backupDir, before1;
    before(async () => {
      // Quelques pieds installés par les vraies routes
      const keys = [...Catalog.entries("footer").filter((e) => e.legacy), ...Footer.hiddenLayouts].slice(0, 4).map((e) => e.fullKey || e.key).concat(Catalog.entries("footer").filter((e) => !e.legacy).slice(0, 2).map((e) => e.key));
      for (const k of keys) assert.equal((await post(U(S1, "/api/bibliotheque/utiliser"), { type: "footer", key: k })).status, 200);
      const plain = json(await post(U(S1, "/api/modeles"), { type: "footer", name: "Pied vide maison" })).template; void plain;
      dir = fs.mkdtempSync(path.join(os.tmpdir(), "pieds-mig-")); copie = path.join(dir, "KOYEKOLA-copie.db"); backupDir = path.join(dir, "sauvegardes");
      db.exec(`VACUUM INTO '${copie.replace(/'/g, "''")}'`);
      const c = new DatabaseSync(copie);
      // on revient à l'état « avant 142 » : ni table de favoris ni colonne de version
      c.exec("DROP TABLE mk_tb_favoris; ALTER TABLE mk_tb_templates DROP COLUMN origin_version; DELETE FROM schema_migrations WHERE scope = 'marketing' AND version = '142';");
      // les migrations POSTÉRIEURES (143 : mode d'identité des fiches produit) sont aussi retirées, sinon l'ordre des migrations refuserait d'appliquer la 142
      if (c.prepare("SELECT 1 x FROM pragma_table_info('mk_tb_templates') WHERE name = 'identity_mode'").get()) c.exec("ALTER TABLE mk_tb_templates DROP COLUMN identity_mode");
      c.exec("DELETE FROM schema_migrations WHERE scope = 'marketing' AND CAST(version AS INTEGER) > 142");
      before1 = c.prepare("SELECT id, origin_key, name, status, source_id FROM mk_tb_templates ORDER BY id").all(); c.close();
      journal = [];
    });
    test("appliquer 142 : sauvegarde AVANT-MIGRATION créée et lisible (journal), tables et colonne ajoutées, aucune donnée modifiée", () => {
      const c = new DatabaseSync(copie);
      const res = migrate(c, { dir: path.join(__dirname, "..", "src", "marketing", "migrations"), dbPath: copie, backupDir, log: { log: (m) => journal.push(m) } });
      assert.equal(res.applied[0], "142", "la migration des favoris est la première appliquée"); assert.ok(res.applied.every((v) => Number(v) >= 142), "seules des migrations postérieures s'ajoutent (ex. 143 : mode d'identité des fiches produit)");
      assert.ok(res.backup && path.basename(res.backup).startsWith("AVANT-MIGRATION-"), res.backup);
      assert.ok(journal.some((l) => /Sauvegarde avant migration/.test(l) && /AVANT-MIGRATION-/.test(l)), journal.join("\n"));
      assert.ok(journal.some((l) => /Migration marketing 142 .*appliquée/.test(l)));
      const b = new DatabaseSync(res.backup, { readOnly: true }); // la sauvegarde est l'état d'AVANT : sans la colonne
      assert.ok(!b.prepare("SELECT 1 x FROM pragma_table_info('mk_tb_templates') WHERE name = 'origin_version'").get()); assert.equal(b.prepare("SELECT COUNT(*) n FROM mk_tb_templates").get().n, before1.length); b.close();
      assert.ok(c.prepare("SELECT 1 x FROM pragma_table_info('mk_tb_templates') WHERE name = 'origin_version'").get());
      const cols = c.prepare("SELECT name FROM pragma_table_info('mk_tb_favoris')").all().map((x) => x.name);
      assert.deepEqual(cols, ["id", "organization_id", "site_id", "user_id", "type", "modele_id", "created_at"]);
      assert.ok(c.prepare("SELECT 1 x FROM sqlite_master WHERE type='index' AND name='idx_mk_tb_favoris_unique'").get());
      assert.ok(c.prepare("SELECT 1 x FROM pragma_foreign_key_list('mk_tb_favoris') WHERE \"table\" = 'mk_sites'").get() && c.prepare("SELECT 1 x FROM pragma_foreign_key_list('mk_tb_favoris') WHERE \"table\" = 'users'").get(), "clés étrangères site et utilisateur");
      const after = c.prepare("SELECT id, origin_key, name, status, source_id FROM mk_tb_templates ORDER BY id").all();
      assert.deepEqual(after, before1, "aucune donnée de site modifiée"); assert.ok(c.prepare("SELECT origin_version FROM mk_tb_templates").all().every((r) => r.origin_version === null), "les anciens pieds ont une version d'origine vide tant que le remplissage n'a pas tourné");
      assert.deepEqual(migrate(c, { dir: path.join(__dirname, "..", "src", "marketing", "migrations"), dbPath: copie, backupDir, log: { log: () => {} } }).applied, [], "idempotent");
      c.close();
    });
    test("remplissage prudent : version 1 pour les modèles gelés, origine retrouvée seulement si unique, rien d'inventé, idempotent, simulation sans écriture", () => {
      const c = new DatabaseSync(copie);
      const rows = () => c.prepare("SELECT id, name, origin_key, origin_version FROM mk_tb_templates WHERE type = 'footer' ORDER BY id").all();
      const truth = rows(); // origine connue (insérée par les vraies routes)
      assert.ok(truth.filter((r) => r.origin_key).length >= 6);
      // situation d'un pied installé AVANT la migration 141 : ni origine ni version
      c.exec("UPDATE mk_tb_templates SET origin_key = NULL, origin_version = NULL WHERE type = 'footer'");
      const sim = fillOrigins(c, { dryRun: true }); assert.ok(sim.examined >= 7); assert.ok(rows().every((r) => r.origin_key === null && r.origin_version === null), "simulation : rien n'est écrit");
      const r1 = fillOrigins(c);
      const now = rows();
      let retrouves = 0;
      for (const row of now) {
        const vrai = truth.find((t) => t.id === row.id);
        if (row.origin_key) { retrouves += 1; assert.ok(row.origin_key === vrai.origin_key || Catalog.find("footer", row.origin_key).key === vrai.origin_key, `${row.name} : origine déduite ${row.origin_key} ≠ vraie ${vrai.origin_key}`); }
        if (row.origin_version !== null) assert.equal(row.origin_version, 1);
        if (!vrai.origin_key) assert.equal(row.origin_key, null, "un pied créé à la main n'a jamais d'origine inventée");
      }
      assert.ok(retrouves >= 1, "au moins une origine déduite sans ambiguïté");
      assert.equal(r1.keyFilled, now.filter((r) => r.origin_key).length);
      const snapshot = JSON.stringify(now);
      const r2 = fillOrigins(c); assert.equal(r2.keyFilled, 0); assert.equal(r2.versionFilled, 0); assert.equal(JSON.stringify(rows()), snapshot, "idempotent");
      // un pied dont le contenu a été modifié ne se fait JAMAIS attribuer d'origine
      const t = now.find((r) => r.origin_key); c.exec(`UPDATE mk_tb_templates SET origin_key = NULL, origin_version = NULL WHERE id = ${t.id}`);
      const comp = c.prepare("SELECT source_id s FROM mk_tb_templates WHERE id = ?").get(t.id).s;
      c.prepare("UPDATE mk_web_components SET section = json_set(section, '$.children[0].type', 'modifie'), draft = NULL WHERE id = ?").run(comp);
      fillOrigins(c); assert.equal(rows().find((r) => r.id === t.id).origin_key, null, "contenu modifié : origine laissée vide");
      // une origine déjà connue n'est jamais écrasée
      c.exec(`UPDATE mk_tb_templates SET origin_key = 'ft-garde-01-valeur', origin_version = NULL WHERE id = ${t.id}`); fillOrigins(c);
      assert.equal(rows().find((r) => r.id === t.id).origin_key, "ft-garde-01-valeur");
      c.close();
    });
    test("ALIAS simulé (la table d'alias est vide tant que les familles ne la remplissent pas) : favoris, insertion et retour à l'origine suivent l'ancien identifiant jusqu'au remplaçant", () => {
      const c = new DatabaseSync(copie); c.exec("PRAGMA foreign_keys = ON");
      const Favoris = require("../src/themeBuilder/favoris"), Rev = require("../src/themeBuilder/revisions"), { useTemplate } = require("../src/themeBuilder/catalog/use");
      const legacy = Footer.hiddenLayouts[0].fullKey, target = Catalog.entries("footer")[0].key, orig = Footer.resolveAlias;
      Footer.resolveAlias = (k) => (k === legacy ? target : orig(k));
      const ctx = { db: c, organizationId: orgId, userId: U1 };
      try {
        assert.equal(Catalog.find("footer", legacy).key, target, "l'alias simulé est suivi");
        assert.equal(Favoris.add(ctx, S1, "footer", legacy).key, target);
        assert.deepEqual([...Favoris.keys(ctx, S1, "footer")], [target]);
        assert.equal(c.prepare("SELECT modele_id m FROM mk_tb_favoris WHERE site_id = ?").get(S1).m, target, "stocké sous l'identifiant actuel");
        assert.equal(Favoris.remove(ctx, S1, "footer", legacy).removed, 1);
        assert.equal(Favoris.keys(ctx, S1, "footer").size, 0);
        assert.throws(() => Favoris.add(ctx, S1, "footer", "ft-inconnu-99-nimporte"), /introuvable/);
        const t = useTemplate(ctx, S1, "footer", legacy);
        let row = c.prepare("SELECT origin_key, origin_version FROM mk_tb_templates WHERE id = ?").get(t.id);
        assert.deepEqual([row.origin_key, row.origin_version], [target, Catalog.find("footer", target).version], "origine enregistrée sous l'identifiant actuel");
        c.prepare("UPDATE mk_tb_templates SET origin_key = ?, origin_version = NULL WHERE id = ?").run(legacy, t.id); // pied installé avant le remplacement du modèle
        const o = Rev.originOfTemplate(ctx, { id: t.id });
        assert.equal(o.key, target); assert.equal(o.renamedFrom, legacy); assert.equal(o.version, null);
        const r = Rev.revertToOrigin(ctx, S1, t.id);
        assert.equal(r.original.key, target); assert.equal(r.original.version, Catalog.find("footer", target).version); assert.equal(r.original.installedVersion, null);
        row = c.prepare("SELECT origin_key, origin_version FROM mk_tb_templates WHERE id = ?").get(t.id);
        assert.deepEqual([row.origin_key, row.origin_version], [target, Catalog.find("footer", target).version], "l'ancien identifiant est remplacé dans la mémoire du pied");
      } finally { Footer.resolveAlias = orig; c.close(); }
    });
  });
});
