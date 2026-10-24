// OUTILS → ADMIN NOTES (ADMIN-NOTES-01) : création, lecture, modification, suppression, validation, sécurité, permissions, isolation entre sites.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const O = "/marketing/site-web/outils";
let srv, boss, db, orgId, siteA, siteB;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const qs = (id) => (id ? `?site=${id}` : "");
const rows = (siteId) => db.prepare("SELECT * FROM mk_admin_notes WHERE site_id IS ? ORDER BY id").all(siteId ?? null);
async function newSite(name) { const r = await boss.post("/marketing/site-web/sites", { name }); return Number(String(r.location).match(/sites\/(\d+)/)[1]); }
async function member(role) {
  const c = await newStudent(srv);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, one("SELECT id FROM users WHERE email = ?", c.email).id, role);
  return c;
}
async function guestOf(siteId, role = "admin") {
  const c = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, one("SELECT id FROM users WHERE email = ?", c.email).id, role);
  return c;
}
const add = (client, siteId, title, body) => client.post(`${O}/notes${qs(siteId)}`, { title, body, ...(siteId ? { site: String(siteId) } : {}) });
const page = async (client, siteId, extra = "") => (await client.get(`${O}/notes${qs(siteId)}${extra ? (siteId ? "&" : "?") + extra : ""}`));
const unescaped = (html) => html.replace(/&#34;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  siteA = await newSite("Notes Site A");
  siteB = await newSite("Notes Site B");
});
after(() => srv.stop());

describe("migration et navigation", () => {
  test("la migration 103 a créé la table et son index ; aucune note de démonstration", () => {
    assert.ok(one("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'mk_admin_notes'"));
    assert.ok(one("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_mk_admin_notes_scope'"));
    assert.ok(one("SELECT version FROM schema_migrations WHERE version = '103'"));
    assert.equal(one("SELECT COUNT(*) n FROM mk_admin_notes").n, 0);
  });
  test("l'entrée « Admin Notes » est dans Outils (site principal et site), active sur son écran, sans toucher aux autres", async () => {
    const main = await boss.get(`/marketing/site-web/outils/notes`);
    assert.equal(main.status, 200);
    assert.match(main.text, /<title>Admin Notes/);
    assert.match(main.text, /href="\/marketing\/site-web\/outils\/notes"[^>]*>[^<]*(<[^>]+>[^<]*)*Admin Notes/);
    const inSite = await boss.get(`/marketing/site-web/sites/${siteA}/outils/notes`);
    assert.equal(inSite.status, 200, "ouvert dans le cadre du site");
    for (const p of ["", "/importer", "/exporter", "/diagnostic", "/maintenance", "/cache", "/contenu", "/systeme", "/logs"]) assert.equal((await boss.get(`${O}${p}`)).status, 200, p);
  });
});

describe("création", () => {
  test("création valide : enregistrée, confirmation, champs vidés, auteur et date, paragraphes conservés", async () => {
    const body = "Premier paragraphe.\n\nDeuxième paragraphe avec accents : é è ê ç — 日本語 — ñ.\n- point un\n- point deux";
    const r = await add(boss, siteA, "  Ma première   note  ", body);
    assert.equal(r.status, 302);
    const n = rows(siteA);
    assert.equal(n.length, 1);
    assert.equal(n[0].title, "Ma première note");
    assert.equal(n[0].body, body);
    assert.equal(n[0].organization_id, orgId);
    assert.ok(n[0].author_id && n[0].created_at && n[0].updated_at === null);
    const html = (await page(boss, siteA)).text;
    assert.match(html, /Note ajoutée\./);
    assert.ok(unescaped(html).includes("Deuxième paragraphe avec accents : é è ê ç — 日本語 — ñ."));
    assert.match(html, /<input id="nt-title"[^>]*value=""/);
    assert.match(html, /Notes existantes <span class="mk-sub">\(1\)/);
  });
  test("titre vide, contenu vide ou espaces seuls : refusés (422), saisie conservée, rien d'enregistré", async () => {
    const before = rows(siteA).length;
    const t = await add(boss, siteA, "   ", "contenu conservé");
    assert.equal(t.status, 422);
    assert.match(t.text, /Le titre est obligatoire\./);
    assert.ok(t.text.includes("contenu conservé"));
    const b = await add(boss, siteA, "Titre conservé", " \n\t ");
    assert.equal(b.status, 422);
    assert.match(b.text, /Le contenu est obligatoire\./);
    assert.match(b.text, /value="Titre conservé"/);
    const both = await add(boss, siteA, "", "");
    assert.equal(both.status, 422);
    assert.equal(rows(siteA).length, before);
  });
  test("données trop longues : refusées avec le nombre de caractères ; la limite exacte est acceptée", async () => {
    const before = rows(siteA).length;
    const t = await add(boss, siteA, "x".repeat(201), "ok");
    assert.equal(t.status, 422);
    assert.match(t.text, /ne peut pas dépasser 200 caractères \(201 saisis\)/);
    const b = await add(boss, siteA, "ok", "y".repeat(20001));
    assert.equal(b.status, 422);
    assert.match(b.text, /20000 caractères/);
    assert.equal(rows(siteA).length, before);
    assert.equal((await add(boss, siteA, "x".repeat(200), "y".repeat(20000))).status, 302);
    assert.equal(rows(siteA).length, before + 1);
  });
  test("contenu malveillant : stocké en texte, jamais interprété (échappé à l'affichage)", async () => {
    const evil = `<script>window.__pwn=1</script><img src=x onerror="alert(1)"> {{7*7}} <%= 1 %> ' OR 1=1 --`;
    assert.equal((await add(boss, siteB, `<b>gras</b> "titre"`, evil)).status, 302);
    const html = (await page(boss, siteB)).text;
    assert.ok(!html.includes("<script>window.__pwn"), "script non interprété");
    assert.ok(!html.includes('<img src=x onerror'), "balise non interprétée");
    assert.ok(html.includes("&lt;script&gt;window.__pwn=1&lt;/script&gt;"));
    assert.ok(html.includes("&lt;b&gt;gras&lt;/b&gt;"));
    assert.equal(rows(siteB)[0].body, evil, "le texte saisi est conservé tel quel (texte brut)");
    assert.ok(one("SELECT COUNT(*) n FROM mk_admin_notes").n >= 1, "requête paramétrée : table intacte");
  });
  test("caractères de contrôle et séparateurs de ligne : nettoyés", async () => {
    await add(boss, siteB, "Contrôle\u0000\u0007", "ligne1\r\nligne2 ligne3\u0000");
    const n = rows(siteB).at(-1);
    assert.equal(n.title, "Contrôle");
    assert.equal(n.body, "ligne1\nligne2\nligne3");
  });
  test("double soumission accidentelle : une seule note créée", async () => {
    const before = rows(siteA).length;
    const [x, y] = await Promise.all([add(boss, siteA, "Double", "même contenu"), add(boss, siteA, "Double", "même contenu")]);
    assert.equal(x.status, 302); assert.equal(y.status, 302);
    assert.equal(rows(siteA).length, before + 1);
    assert.match((await page(boss, siteA)).text, /pas été ajoutée une seconde fois|Note ajoutée/);
  });
  test("échec du stockage : message d'échec (500), saisie conservée, aucune note créée, jamais présenté comme un succès", async () => {
    const before = rows(siteA).length;
    db.exec("CREATE TRIGGER nt_test_fail BEFORE INSERT ON mk_admin_notes BEGIN SELECT RAISE(ABORT, 'disque plein'); END;");
    try {
      const r = await add(boss, siteA, "Titre à garder", "Corps à garder");
      assert.equal(r.status, 500);
      assert.match(r.text, /rien n'a été enregistré|rien n&#39;a été enregistré/);
      assert.match(r.text, /value="Titre à garder"/);
      assert.ok(r.text.includes("Corps à garder"));
      assert.ok(!/Note ajoutée\./.test(r.text));
      assert.ok(!r.text.includes("disque plein"), "aucun détail technique divulgué");
    } finally { db.exec("DROP TRIGGER nt_test_fail"); }
    assert.equal(rows(siteA).length, before);
  });
});

describe("consultation", () => {
  test("site sans note : état vide utile ; ordre décroissant ; pagination", async () => {
    const empty = await newSite("Notes Site Vide");
    const r = await page(boss, empty);
    assert.match(r.text, /Aucune note pour ce site/);
    for (let i = 1; i <= 23; i++) db.prepare("INSERT INTO mk_admin_notes (organization_id, site_id, title, body, author_id, created_at) VALUES (?, ?, ?, ?, 1, datetime('now', ?))").run(orgId, empty, `Note ${String(i).padStart(2, "0")}`, `corps ${i}`, `-${100 - i} minutes`);
    const p1 = (await page(boss, empty)).text;
    const titles1 = [...p1.matchAll(/<h3>(Note \d+)<\/h3>/g)].map((m) => m[1]);
    assert.equal(titles1.length, 20);
    assert.equal(titles1[0], "Note 23", "la plus récente d'abord");
    assert.equal(titles1.at(-1), "Note 04");
    assert.match(p1, /Page 1 sur 2/);
    const p2 = (await page(boss, empty, "page=2")).text;
    assert.deepEqual([...p2.matchAll(/<h3>(Note \d+)<\/h3>/g)].map((m) => m[1]), ["Note 03", "Note 02", "Note 01"]);
    assert.equal((await page(boss, empty, "page=999")).status, 200, "page hors limites ramenée à la dernière");
    assert.equal((await page(boss, empty, "page=abc")).status, 200);
  });
  test("note longue : contenu intégral dans la page, retours à la ligne conservés (pre-wrap)", async () => {
    const long = Array.from({ length: 60 }, (_, i) => `Ligne ${i + 1} ${"mot ".repeat(15)}`).join("\n");
    await add(boss, siteB, "Très longue", long);
    const html = unescaped((await page(boss, siteB)).text);
    assert.ok(html.includes("Ligne 60 mot"));
    assert.ok(html.includes("Ligne 1 mot mot"));
    assert.match(require("node:fs").readFileSync("public/css/cms.css", "utf8"), /\.mk-nt-body \{ white-space: pre-wrap/);
  });
});

describe("modification et suppression", () => {
  let id;
  before(async () => { await add(boss, siteA, "À modifier", "Version initiale"); id = rows(siteA).find((n) => n.title === "À modifier").id; });
  test("ouverture en édition puis enregistrement : titre et contenu changés, date de modification posée, auteur de la modification", async () => {
    const edit = await page(boss, siteA, `modifier=${id}`);
    assert.match(edit.text, new RegExp(`action="[^"]*/notes/${id}/modifier`));
    assert.ok(edit.text.includes("Version initiale"));
    const r = await boss.post(`${O}/notes/${id}/modifier${qs(siteA)}`, { site: String(siteA), title: "Modifiée", body: "Nouvelle version\n\nsur deux paragraphes" });
    assert.equal(r.status, 302);
    const n = db.prepare("SELECT * FROM mk_admin_notes WHERE id = ?").get(id);
    assert.equal(n.title, "Modifiée");
    assert.equal(n.body, "Nouvelle version\n\nsur deux paragraphes");
    assert.ok(n.updated_at && n.updated_by);
    assert.match((await page(boss, siteA)).text, /modifiée le/);
  });
  test("annulation de la modification : la version enregistrée est intacte (lien « Annuler », aucune écriture)", async () => {
    const before = JSON.stringify(db.prepare("SELECT * FROM mk_admin_notes WHERE id = ?").get(id));
    const edit = await page(boss, siteA, `modifier=${id}`);
    assert.match(edit.text, new RegExp(`href="[^"]*/notes[^"]*#note-${id}"[^>]*>Annuler`));
    await page(boss, siteA);
    assert.equal(JSON.stringify(db.prepare("SELECT * FROM mk_admin_notes WHERE id = ?").get(id)), before);
  });
  test("modification invalide : refusée (422), saisie conservée, note inchangée ; note inexistante : message, rien créé", async () => {
    const before = JSON.stringify(db.prepare("SELECT * FROM mk_admin_notes WHERE id = ?").get(id));
    const r = await boss.post(`${O}/notes/${id}/modifier${qs(siteA)}`, { site: String(siteA), title: "", body: "brouillon perdu ?" });
    assert.equal(r.status, 422);
    assert.ok(r.text.includes("brouillon perdu ?"));
    assert.equal(JSON.stringify(db.prepare("SELECT * FROM mk_admin_notes WHERE id = ?").get(id)), before);
    const count = one("SELECT COUNT(*) n FROM mk_admin_notes").n;
    const ghost = await boss.post(`${O}/notes/987654/modifier${qs(siteA)}`, { site: String(siteA), title: "x", body: "y" });
    assert.equal(ghost.status, 302);
    assert.equal(one("SELECT COUNT(*) n FROM mk_admin_notes").n, count);
    assert.match((await page(boss, siteA)).text, /n'existe pas|n&#39;existe pas/);
  });
  test("suppression : demande de confirmation nommant la note ; annuler la conserve ; sans confirmation rien n'est supprimé", async () => {
    const conf = await page(boss, siteA, `supprimer=${id}`);
    assert.match(conf.text, /Supprimer cette note \?/);
    assert.match(conf.text, /« <strong>Modifiée<\/strong> »/);
    assert.match(conf.text, new RegExp(`href="[^"]*/notes[^"]*"[^>]*>Annuler`));
    const noConfirm = await boss.post(`${O}/notes/${id}/supprimer${qs(siteA)}`, { site: String(siteA) });
    assert.equal(noConfirm.status, 302);
    assert.match(noConfirm.location, /supprimer=/);
    assert.ok(db.prepare("SELECT 1 FROM mk_admin_notes WHERE id = ?").get(id), "toujours présente");
  });
  test("suppression confirmée : seule la note ciblée disparaît, message de réussite ; seconde suppression : échec explicite", async () => {
    const others = one("SELECT COUNT(*) n FROM mk_admin_notes WHERE id <> ?", id).n;
    const r = await boss.post(`${O}/notes/${id}/supprimer${qs(siteA)}`, { site: String(siteA), confirm: "1" });
    assert.equal(r.status, 302);
    assert.equal(db.prepare("SELECT 1 FROM mk_admin_notes WHERE id = ?").get(id), undefined);
    assert.equal(one("SELECT COUNT(*) n FROM mk_admin_notes WHERE id <> ?", id).n, others);
    assert.match((await page(boss, siteA)).text, /Note supprimée\./);
    await boss.post(`${O}/notes/${id}/supprimer${qs(siteA)}`, { site: String(siteA), confirm: "1" });
    const again = (await page(boss, siteA)).text;
    assert.match(again, /n'existe pas|n&#39;existe pas/);
    assert.ok(!/Note supprimée\./.test(again), "une erreur n'est jamais présentée comme un succès");
  });
});

describe("permissions et isolation", () => {
  let noteA, noteB;
  before(async () => {
    await add(boss, siteA, "Secrète A", "contenu privé du site A");
    noteA = rows(siteA).find((n) => n.title === "Secrète A").id;
    await add(boss, siteB, "Secrète B", "contenu privé du site B");
    noteB = rows(siteB).find((n) => n.title === "Secrète B").id;
  });
  test("une note du site A n'apparaît jamais dans le site B (ni dans le site principal), et inversement", async () => {
    const a = (await page(boss, siteA)).text, b = (await page(boss, siteB)).text, main = (await page(boss, null)).text;
    assert.ok(a.includes("Secrète A") && !a.includes("Secrète B"));
    assert.ok(b.includes("Secrète B") && !b.includes("Secrète A"));
    assert.ok(!main.includes("Secrète A") && !main.includes("Secrète B"));
    assert.ok(!(await boss.get(`/marketing/site-web/sites/${siteB}/outils/notes`)).text.includes("Secrète A"));
  });
  test("modifier ou supprimer une note d'un autre site en changeant l'identifiant : sans effet", async () => {
    const snap = JSON.stringify(rows(siteA)) + JSON.stringify(rows(siteB));
    await boss.post(`${O}/notes/${noteA}/modifier${qs(siteB)}`, { site: String(siteB), title: "PIRATÉ", body: "PIRATÉ" });
    await boss.post(`${O}/notes/${noteA}/supprimer${qs(siteB)}`, { site: String(siteB), confirm: "1" });
    await boss.post(`${O}/notes/${noteB}/modifier${qs(siteA)}`, { site: String(siteA), title: "PIRATÉ", body: "PIRATÉ" });
    await boss.post(`${O}/notes/${noteB}/supprimer`, { confirm: "1" });
    assert.equal(JSON.stringify(rows(siteA)) + JSON.stringify(rows(siteB)), snap);
    assert.ok(!(await page(boss, siteB, `modifier=${noteA}`)).text.includes("contenu privé du site A"), "l'édition d'une note étrangère n'affiche rien");
    assert.ok(!(await page(boss, siteB, `supprimer=${noteA}`)).text.includes("Secrète A"));
  });
  test("anonyme : renvoyé vers la connexion ; lecteur et éditeur : 403 (notes réservées aux administrateurs)", async () => {
    const anon = new Client(srv.base);
    const g = await anon.get(`${O}/notes`);
    assert.equal(g.status, 302); assert.match(g.location, /connexion/);
    assert.equal((await anon.post(`${O}/notes`, { title: "a", body: "b" })).status, 302);
    for (const role of ["viewer", "editor"]) {
      const c = await member(role);
      assert.equal((await c.get(`${O}/notes`)).status, 403, role);
      assert.equal((await c.post(`${O}/notes`, { title: "a", body: "b" })).status, 403, role);
      assert.equal((await c.post(`${O}/notes/${noteA}/modifier`, { title: "a", body: "b" })).status, 403, role);
      assert.equal((await c.post(`${O}/notes/${noteA}/supprimer`, { confirm: "1" })).status, 403, role);
    }
    const admin = await member("admin");
    assert.equal((await admin.get(`${O}/notes`)).status, 200);
  });
  test("droits distincts : un rôle qui peut voir sans créer / modifier / supprimer ne voit pas les boutons et est refusé par le serveur", async () => {
    const orgsMod = require("../src/marketing/organizations");
    assert.deepEqual(["notes.view", "notes.create", "notes.edit", "notes.delete"].map((k) => orgsMod.PERMISSIONS[k]), ["admin", "admin", "admin", "admin"]);
    const access = require("../src/services/cmsAccess");
    for (const k of ["notes.view", "notes.create", "notes.edit", "notes.delete"]) assert.ok(access.ASSIGNABLE.includes(k), k);
    const r = await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Lecteur de notes", description: "test", perm: "tools.view,notes.view" });
    const role = one("SELECT key FROM mk_roles WHERE name = 'Lecteur de notes'");
    assert.ok(role, `rôle créé (${r.status})`);
    const c = await newStudent(srv);
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, one("SELECT id FROM users WHERE email = ?", c.email).id, role.key);
    const html = (await c.get(`${O}/notes${qs(siteA)}`)).text;
    assert.equal((await c.get(`${O}/notes${qs(siteA)}`)).status, 200);
    assert.ok(html.includes("Secrète A"));
    assert.ok(!html.includes("Ajouter la note") && !/>Modifier</.test(html) && !/>Supprimer</.test(html), "aucun bouton sans le droit");
    assert.equal((await c.post(`${O}/notes${qs(siteA)}`, { site: String(siteA), title: "a", body: "b" })).status, 403);
    assert.equal((await c.post(`${O}/notes/${noteA}/modifier${qs(siteA)}`, { site: String(siteA), title: "a", body: "b" })).status, 403);
    assert.equal((await c.post(`${O}/notes/${noteA}/supprimer${qs(siteA)}`, { site: String(siteA), confirm: "1" })).status, 403);
    assert.ok(db.prepare("SELECT 1 FROM mk_admin_notes WHERE id = ?").get(noteA));
  });
  test("accès limité au site B : ses notes seulement ; site A et site principal refusés ; écriture dans B possible", async () => {
    const g = await guestOf(siteB);
    const mine = await g.get(`${O}/notes${qs(siteB)}`);
    assert.equal(mine.status, 200);
    assert.ok(mine.text.includes("Secrète B") && !mine.text.includes("Secrète A"));
    for (const p of [`${O}/notes${qs(siteA)}`, `${O}/notes`]) { const r = await g.get(p); assert.ok([302, 403, 404].includes(r.status) && !r.text.includes("Secrète A"), `${p} → ${r.status}`); }
    const before = rows(siteA).length;
    const w = await g.post(`${O}/notes${qs(siteA)}`, { site: String(siteA), title: "intrus", body: "intrus" });
    assert.ok([302, 403, 404].includes(w.status));
    assert.equal(rows(siteA).length, before);
    assert.equal((await g.post(`${O}/notes${qs(siteB)}`, { site: String(siteB), title: "Invité B", body: "écrit par un compte limité" })).status, 302);
    assert.ok(rows(siteB).some((n) => n.title === "Invité B"));
    const dels = await g.post(`${O}/notes/${noteA}/supprimer${qs(siteB)}`, { site: String(siteB), confirm: "1" });
    assert.ok(db.prepare("SELECT 1 FROM mk_admin_notes WHERE id = ?").get(noteA), `la note A survit (${dels.status})`);
  });
  test("protection CSRF : un envoi venant d'un autre site est refusé", async () => {
    const before = rows(siteA).length;
    const r = await boss.request(`${O}/notes${qs(siteA)}`, { method: "POST", form: { site: String(siteA), title: "csrf", body: "csrf" }, headers: { Origin: "https://evil.example", Referer: "https://evil.example/x" } });
    assert.ok([400, 403].includes(r.status), `statut ${r.status}`);
    assert.equal(rows(siteA).length, before);
  });
  test("le contenu des notes n'apparaît ni dans le journal d'activité ni dans les journaux d'audit", async () => {
    const logs = JSON.stringify(db.prepare("SELECT * FROM audit_log").all()) + JSON.stringify(db.prepare("SELECT * FROM mk_audit_logs").all());
    assert.ok(!logs.includes("contenu privé du site A") && !logs.includes("Secrète A"));
    assert.match(logs, /note_create/);
  });
  test("création de site : aucune note héritée d'un autre site", async () => {
    const fresh = await newSite("Notes Site Neuf");
    assert.equal(rows(fresh).length, 0);
    assert.match((await page(boss, fresh)).text, /Aucune note pour ce site/);
  });
});

describe("service (unitaire, base de test dédiée)", () => {
  test("validation : normalisation du titre et du contenu", () => {
    const notes = require("../src/services/adminNotes");
    const v = notes.validate({ title: "  A \t b\n", body: "x  \n\n\n\n\n\ny" });
    assert.equal(v.title, "A b");
    assert.equal(v.body, "x\n\n\ny");
    assert.equal(notes.validate({ title: "", body: "" }).ok, false);
    assert.throws(() => notes.list(0, null), /Organisation invalide/);
    assert.throws(() => notes.list(1, "abc"), /Site invalide/);
  });
});
