// Marketing R2 (1/2) — contacts : recherche paginée et triée, filtres, actions groupées, export CSV, chronologie.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, T0 } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const { parseCsv } = require("../src/marketing/import/csv");

const DAY = 86_400_000;
const PROOF = { source: "form", textShown: "Oui, je veux recevoir la newsletter" };
const sqlDate = (ms) => new Date(ms).toISOString().slice(0, 19).replace("T", " ");
let m, A, B;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const add = (email, o = {}) => {
  const { contact } = audience.upsertContact(A, { email, first_name: o.first_name ?? "", last_name: o.last_name ?? "", company: o.company ?? "", source: o.source ?? "manual" });
  if (o.consent) compliance.recordConsent(A, contact.id, PROOF);
  if (o.created) m.db.prepare("UPDATE mk_contacts SET created_at = ? WHERE id = ?").run(sqlDate(o.created), contact.id);
  if (o.activity) m.db.prepare("UPDATE mk_contacts SET last_activity_at = ? WHERE id = ?").run(sqlDate(o.activity), contact.id);
  return contact;
};
const emails = (r) => r.rows.map((c) => c.email);

beforeEach(() => { m = freshMarketing(); A = m.A; B = m.B; });

describe("searchContacts : pagination", () => {
  beforeEach(() => { for (let i = 0; i < 60; i++) add(`c${String(i).padStart(2, "0")}@ex.fr`, { created: T0 - i * 1000 }); });
  test("pages numérotées : total, nombre de pages, dernière page partielle", () => {
    const p1 = audience.searchContacts(A, {}, { pageSize: 25 });
    assert.deepEqual([p1.total, p1.pages, p1.page, p1.rows.length, p1.pageSize], [60, 3, 1, 25, 25]);
    assert.equal(audience.searchContacts(A, {}, { pageSize: 25, page: 3 }).rows.length, 10);
  });
  test("aucun doublon ni oubli d'une page à l'autre", () => {
    const seen = [1, 2, 3].flatMap((page) => emails(audience.searchContacts(A, {}, { pageSize: 25, page })));
    assert.equal(seen.length, 60);
    assert.equal(new Set(seen).size, 60);
  });
  test("page hors bornes ramenée dans les bornes ; taille inconnue = 50 ; valeurs absurdes sans erreur", () => {
    assert.equal(audience.searchContacts(A, {}, { pageSize: 25, page: 99 }).page, 3);
    assert.equal(audience.searchContacts(A, {}, { pageSize: 25, page: -4 }).page, 1);
    assert.equal(audience.searchContacts(A, {}, { pageSize: 7 }).pageSize, 50);
    assert.equal(audience.searchContacts(A, {}, { pageSize: "abc", page: "x" }).page, 1);
    assert.deepEqual(audience.searchContacts(A, {}, { pageSize: 100 }).rows.length, 60);
  });
  test("aucun contact : une page vide, pas d'erreur", () => {
    const r = audience.searchContacts(B, {});
    assert.deepEqual([r.total, r.pages, r.page, r.rows.length], [0, 1, 1, 0]);
  });
});

describe("searchContacts : tri", () => {
  test("par défaut : les plus récemment ajoutés d'abord", () => {
    add("vieux@ex.fr", { created: T0 - 10 * DAY }); add("neuf@ex.fr", { created: T0 - DAY });
    assert.deepEqual(emails(audience.searchContacts(A, {})), ["neuf@ex.fr", "vieux@ex.fr"]);
  });
  test("e-mail croissant / décroissant, sans tenir compte de la casse", () => {
    add("b@ex.fr"); add("A@ex.fr"); add("c@ex.fr");
    assert.deepEqual(emails(audience.searchContacts(A, {}, { sort: "email", dir: "asc" })), ["a@ex.fr", "b@ex.fr", "c@ex.fr"]);
    assert.deepEqual(emails(audience.searchContacts(A, {}, { sort: "email", dir: "desc" })), ["c@ex.fr", "b@ex.fr", "a@ex.fr"]);
  });
  test("par nom : nom de famille puis prénom", () => {
    add("1@ex.fr", { first_name: "Zoé", last_name: "Adams" }); add("2@ex.fr", { first_name: "Abel", last_name: "Adams" }); add("3@ex.fr", { first_name: "Ida", last_name: "Bell" });
    assert.deepEqual(emails(audience.searchContacts(A, {}, { sort: "name", dir: "asc" })), ["2@ex.fr", "1@ex.fr", "3@ex.fr"]);
  });
  test("dernière activité : les contacts jamais actifs restent en fin de liste, dans les deux sens", () => {
    add("jamais@ex.fr"); add("hier@ex.fr", { activity: T0 - DAY }); add("avant@ex.fr", { activity: T0 - 5 * DAY });
    assert.deepEqual(emails(audience.searchContacts(A, {}, { sort: "activity", dir: "desc" })), ["hier@ex.fr", "avant@ex.fr", "jamais@ex.fr"]);
    assert.deepEqual(emails(audience.searchContacts(A, {}, { sort: "activity", dir: "asc" })), ["avant@ex.fr", "hier@ex.fr", "jamais@ex.fr"]);
  });
  test("par statut et par source", () => {
    add("a@ex.fr", { source: "import" }); add("b@ex.fr", { source: "form" }); add("c@ex.fr", { source: "manual", consent: true });
    assert.equal(audience.searchContacts(A, {}, { sort: "source", dir: "asc" }).rows[0].source, "form");
    assert.equal(audience.searchContacts(A, {}, { sort: "status", dir: "asc" }).rows[0].status, "subscribed");
  });
  test("colonne de tri inconnue ou tentative d'injection SQL : ignorée, tri par défaut", () => {
    add("a@ex.fr", { created: T0 - DAY }); add("b@ex.fr", { created: T0 });
    for (const sort of ["nimporte", "id; DROP TABLE mk_contacts", "email DESC, (SELECT 1)", undefined]) {
      assert.deepEqual(emails(audience.searchContacts(A, {}, { sort })), ["b@ex.fr", "a@ex.fr"], String(sort));
    }
    assert.equal(audience.countContacts(A, {}), 2);
  });
  test("le résultat rend le tri effectivement appliqué (pour les en-têtes de colonnes)", () => {
    assert.deepEqual([audience.searchContacts(A, {}, { sort: "email", dir: "asc" }).sort, audience.searchContacts(A, {}, { sort: "email", dir: "asc" }).dir], ["email", "asc"]);
    assert.deepEqual([audience.searchContacts(A, {}, { sort: "zzz" }).sort, audience.searchContacts(A, {}, { sort: "zzz" }).dir], ["created", "desc"]);
  });
  test("ex æquo : ordre stable (identifiant) pour ne jamais dupliquer entre deux pages", () => {
    for (let i = 0; i < 60; i++) add(`t${i}@ex.fr`, { first_name: "Même", created: T0 });
    for (const sort of ["name", "created", "status", "source", "activity"]) {
      const a = [1, 2, 3].flatMap((page) => emails(audience.searchContacts(A, {}, { sort, pageSize: 25, page })));
      assert.equal(a.length, 60, sort);
      assert.equal(new Set(a).size, 60, sort);
    }
  });
});

describe("searchContacts : filtres", () => {
  test("statut, source, recherche (e-mail, nom, société) et caractères spéciaux échappés", () => {
    add("awa@ex.fr", { first_name: "Awa", company: "Acme" }); add("100%@ex.fr", { source: "import" }); add("x@ex.fr", { consent: true });
    assert.deepEqual(emails(audience.searchContacts(A, { q: "acme" })), ["awa@ex.fr"]);
    assert.deepEqual(emails(audience.searchContacts(A, { q: "100%" })), ["100%@ex.fr"]);
    assert.equal(audience.searchContacts(A, { q: "%" }).total, 1, "« % » est cherché tel quel, pas comme un joker");
    assert.deepEqual(emails(audience.searchContacts(A, { source: "import" })), ["100%@ex.fr"]);
    assert.deepEqual(emails(audience.searchContacts(A, { status: "subscribed" })), ["x@ex.fr"]);
  });
  test("liste et étiquette", () => {
    const l = audience.createList(A, { name: "L" });
    const a = add("a@ex.fr"); add("b@ex.fr");
    audience.addToList(A, l.id, [a.id]); audience.tagContact(A, a.id, "vip");
    const tag = audience.listTags(A)[0];
    assert.deepEqual(emails(audience.searchContacts(A, { listId: l.id })), ["a@ex.fr"]);
    assert.deepEqual(emails(audience.searchContacts(A, { tagId: tag.id })), ["a@ex.fr"]);
  });
  test("« joignables » : exactement les contacts que isSendable accepte", () => {
    add("ok@ex.fr", { consent: true }); add("sans@ex.fr");
    const gone = add("desinscrit@ex.fr", { consent: true });
    compliance.unsubscribe(A, gone.id, { scope: "all", source: "admin" });
    const sendable = emails(audience.searchContacts(A, { sendable: true }));
    const expected = ["ok@ex.fr", "sans@ex.fr", "desinscrit@ex.fr"].filter((e) => compliance.isSendable(A, audience.findByEmail(A, e).id).ok);
    assert.deepEqual(sendable, expected);
    assert.deepEqual(sendable, ["ok@ex.fr"]);
  });
  test("ajoutés depuis N jours", () => {
    add("vieux@ex.fr", { created: T0 - 40 * DAY }); add("recent@ex.fr", { created: T0 - 3 * DAY });
    assert.deepEqual(emails(audience.searchContacts(A, { sinceDays: 30 })), ["recent@ex.fr"]);
    assert.equal(audience.searchContacts(A, { sinceDays: 90 }).total, 2);
    assert.equal(audience.searchContacts(A, { sinceDays: "abc" }).total, 2, "valeur invalide ignorée");
  });
  test("filtres combinés, total cohérent avec countContacts, isolation entre organisations", () => {
    add("a@ex.fr", { source: "import", consent: true }); add("b@ex.fr", { source: "import" });
    audience.upsertContact(B, { email: "a@ex.fr", source: "import" });
    const criteria = { source: "import", status: "subscribed" };
    assert.equal(audience.searchContacts(A, criteria).total, 1);
    assert.equal(audience.countContacts(A, criteria), 1);
    assert.equal(audience.searchContacts(B, { source: "import" }).total, 1);
  });
  test("statut inconnu : erreur claire (comme avant)", () => {
    assert.equal(code(() => audience.searchContacts(A, { status: "nimporte" })), "invalid_field");
  });
});

describe("étiquettes de plusieurs contacts en une requête", () => {
  test("tagsForContacts : une entrée par contact, triées par nom", () => {
    const a = add("a@ex.fr"), b = add("b@ex.fr"), c = add("c@ex.fr");
    audience.tagContact(A, a.id, "zèbre"); audience.tagContact(A, a.id, "Alpha"); audience.tagContact(A, b.id, "vip");
    const map = audience.tagsForContacts(A, [a.id, b.id, c.id]);
    assert.deepEqual(map.get(a.id).map((t) => t.name), ["Alpha", "zèbre"]);
    assert.deepEqual(map.get(b.id).map((t) => t.name), ["vip"]);
    assert.deepEqual(map.get(c.id) ?? [], []);
  });
  test("liste vide et autre organisation", () => {
    assert.equal(audience.tagsForContacts(A, []).size, 0);
    const other = audience.upsertContact(B, { email: "o@ex.fr" }).contact;
    audience.tagContact(B, other.id, "secret");
    assert.equal(audience.tagsForContacts(A, [other.id]).size, 0);
  });
});

describe("actions groupées", () => {
  let ids;
  beforeEach(() => { ids = ["a", "b", "c"].map((n) => add(`${n}@ex.fr`).id); });
  test("ajouter une étiquette : compte les contacts modifiés et ceux qui l'avaient déjà", () => {
    audience.tagContact(A, ids[0], "vip");
    const r = audience.bulkTag(A, ids, "vip");
    assert.deepEqual([r.processed, r.changed], [3, 2]);
    assert.equal(audience.tagsOf(A, ids[2]).length, 1);
  });
  test("retirer une étiquette", () => {
    audience.bulkTag(A, ids, "vip");
    const r = audience.bulkUntag(A, ids.slice(0, 2), "vip");
    assert.deepEqual([r.processed, r.changed], [2, 2]);
    assert.equal(audience.tagsOf(A, ids[0]).length, 0);
    assert.equal(audience.tagsOf(A, ids[2]).length, 1);
  });
  test("retirer une étiquette inexistante : rien ne change, pas d'erreur", () => {
    assert.deepEqual(audience.bulkUntag(A, ids, "fantome"), { processed: 3, changed: 0 });
  });
  test("tout ou rien : un identifiant inconnu annule toute l'opération", () => {
    assert.equal(code(() => audience.bulkTag(A, [...ids, 999999], "vip")), "not_found");
    assert.equal(audience.listTags(A).length, 0, "aucune étiquette créée, aucun contact modifié");
    assert.equal(audience.tagsOf(A, ids[0]).length, 0);
  });
  test("un contact d'une autre organisation est refusé", () => {
    const other = audience.upsertContact(B, { email: "o@ex.fr" }).contact;
    assert.equal(code(() => audience.bulkTag(A, [ids[0], other.id], "vip")), "not_found");
    assert.equal(audience.tagsOf(B, other.id).length, 0);
  });
  test("validation : sélection vide, trop grande, identifiants invalides, nom d'étiquette vide", () => {
    assert.equal(code(() => audience.bulkTag(A, [], "vip")), "invalid_field");
    assert.equal(code(() => audience.bulkTag(A, Array.from({ length: 201 }, (_, i) => i + 1), "vip")), "invalid_field");
    assert.equal(code(() => audience.bulkTag(A, ["1; DROP", 2], "vip")), "invalid_field");
    assert.equal(code(() => audience.bulkTag(A, ids, "  ")), "invalid_field");
    assert.equal(code(() => audience.bulkTag(A, "1,2", "vip")), "invalid_field");
  });
  test("doublons dans la sélection comptés une seule fois", () => {
    assert.deepEqual(audience.bulkTag(A, [ids[0], ids[0], ids[1]], "vip"), { processed: 2, changed: 2 });
  });
  test("l'action groupée n'accorde aucun consentement ni ne change le statut", () => {
    audience.bulkTag(A, ids, "vip");
    assert.ok(ids.every((id) => audience.getContact(A, id).status === "unknown"));
  });
});

describe("export CSV", () => {
  const run = (criteria = {}, opts = {}) => { const chunks = []; const n = audience.exportContacts(A, criteria, (c) => chunks.push(c), opts); return { n, text: chunks.join("") }; };
  test("en-tête français, une ligne par contact, étiquettes et listes regroupées", () => {
    const c = add("awa@ex.fr", { first_name: "Awa", last_name: "Koffi", company: "Acme", source: "import" });
    audience.tagContact(A, c.id, "vip"); audience.tagContact(A, c.id, "alpha");
    const l = audience.createList(A, { name: "Newsletter" }); audience.addToList(A, l.id, [c.id]);
    const { n, text } = run();
    assert.equal(n, 1);
    const rows = parseCsv(text.replace(/^﻿/, ""), {}).rows ?? parseCsv(text.replace(/^﻿/, ""), {});
    const flat = Array.isArray(rows) ? rows : rows.rows;
    assert.deepEqual(flat[0], ["E-mail", "Prénom", "Nom", "Téléphone", "Société", "Pays", "Langue", "Statut", "Source", "Ajouté le", "Étiquettes", "Listes"]);
    assert.equal(flat[1][0], "awa@ex.fr");
    assert.equal(flat[1][7], "unknown");
    assert.equal(flat[1][10], "alpha; vip");
    assert.equal(flat[1][11], "Newsletter");
  });
  test("le fichier commence par un BOM UTF-8 (accents corrects dans Excel)", () => {
    assert.ok(run().text.startsWith("﻿"));
  });
  test("injection de formule neutralisée (=, +, -, @) et guillemets échappés", () => {
    add("f@ex.fr", { first_name: "=HYPERLINK(\"http://x\")", last_name: "+cmd", company: 'Dupont "et fils", SA' });
    const { text } = run();
    assert.match(text, /'=HYPERLINK/);
    assert.match(text, /'\+cmd/);
    assert.match(text, /"Dupont ""et fils"", SA"/);
  });
  test("mêmes filtres que la liste ; autre organisation exclue", () => {
    add("a@ex.fr", { source: "import" }); add("b@ex.fr"); audience.upsertContact(B, { email: "c@ex.fr", source: "import" });
    const { n, text } = run({ source: "import" });
    assert.equal(n, 1);
    assert.match(text, /a@ex\.fr/);
    assert.doesNotMatch(text, /b@ex\.fr|c@ex\.fr/);
  });
  test("plusieurs lots : aucun contact perdu ni dupliqué", () => {
    for (let i = 0; i < 25; i++) add(`x${i}@ex.fr`);
    const { n, text } = run({}, { batchSize: 4 });
    assert.equal(n, 25);
    assert.equal((text.match(/x\d+@ex\.fr/g) || []).length, 25);
    assert.equal(new Set(text.match(/x\d+@ex\.fr/g)).size, 25);
  });
  test("l'export est journalisé (sans adresse e-mail) et compte les lignes", () => {
    add("a@ex.fr");
    run({}, {});
    const row = m.db.prepare("SELECT action, metadata FROM mk_audit_logs WHERE action = 'contacts.exported'").get();
    assert.ok(row);
    assert.doesNotMatch(row.metadata, /@/);
    assert.equal(JSON.parse(row.metadata).count, 1);
  });
  test("organisation vide : seulement l'en-tête", () => {
    const { n, text } = run();
    assert.equal(n, 0);
    assert.equal(text.trim().split(/\r?\n/).length, 1);
  });
});

describe("chronologie du contact", () => {
  test("contact neuf : une seule entrée (création)", () => {
    const c = add("a@ex.fr", { source: "import", created: T0 - DAY });
    const t = audience.contactTimeline(A, c.id);
    assert.equal(t.length, 1);
    assert.equal(t[0].type, "created");
    assert.match(t[0].text, /import/);
  });
  test("mélange des sources, du plus récent au plus ancien", () => {
    // Les preuves de consentement sont en lecture seule : leur date est « maintenant » ; les autres dates sont antérieures.
    const now = Date.now();
    const c = add("a@ex.fr", { created: now - 40 * DAY });
    compliance.recordConsent(A, c.id, PROOF);
    const l = audience.createList(A, { name: "Newsletter" }); audience.addToList(A, l.id, [c.id]);
    m.db.prepare("UPDATE mk_list_members SET added_at = ?").run(sqlDate(now - 30 * DAY));
    audience.tagContact(A, c.id, "vip");
    m.db.prepare("UPDATE mk_contact_tags SET created_at = ?").run(sqlDate(now - 20 * DAY));
    const t = audience.contactTimeline(A, c.id);
    assert.deepEqual(t.map((x) => x.type), ["consent", "tag", "list", "created"]);
    assert.deepEqual(t.map((x) => x.at), [...t.map((x) => x.at)].sort((a, b) => b - a));
    assert.match(t[0].text, /Consentement donné/);
    assert.match(t[1].text, /vip/);
    assert.match(t[2].text, /Newsletter/);
  });
  test("désinscription (tous les envois et par liste) et retrait de consentement", () => {
    const c = add("a@ex.fr", { consent: true });
    compliance.unsubscribe(A, c.id, { scope: "all", source: "admin" });
    const types = audience.contactTimeline(A, c.id).map((x) => x.type);
    assert.ok(types.includes("unsubscribe"));
  });
  test("e-mails : envoi, clic, rebond, avec le nom de la campagne", () => {
    const c = add("a@ex.fr", { created: T0 - 20 * DAY });
    const camp = Number(m.db.prepare("INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, status) VALUES (1, 'Lancement', 'list', 1, 'sent')").run().lastInsertRowid);
    m.db.prepare("INSERT INTO mk_messages (organization_id, campaign_id, contact_id, email, status, subject, sent_at, first_open_at, first_click_at, bounced_at) VALUES (1, ?, ?, 'a@ex.fr', 'bounced', 'Bienvenue', ?, ?, ?, ?)").run(camp, c.id, T0 - 5 * DAY, T0 - 4 * DAY, T0 - 3 * DAY, T0 - 2 * DAY);
    const t = audience.contactTimeline(A, c.id);
    assert.deepEqual(t.filter((x) => x.href).map((x) => x.type).sort(), ["bounce", "click", "message", "open"]);
    const sent = t.find((x) => x.type === "message");
    assert.match(sent.text, /Bienvenue/);
    assert.match(sent.text, /Lancement/);
    assert.equal(sent.href, `/marketing/campagnes/${camp}`);
    assert.match(t.find((x) => x.type === "open").text, /indicatif/);
  });
  test("scénarios : entrée, puis fin ou échec", () => {
    const c = add("a@ex.fr", { created: T0 - 20 * DAY });
    const a = Number(m.db.prepare("INSERT INTO mk_automations (organization_id, name, status, trigger_event) VALUES (1, 'Bienvenue', 'active', 'contact.created')").run().lastInsertRowid);
    m.db.prepare("INSERT INTO mk_automation_runs (organization_id, automation_id, contact_id, status, steps, wake_at, entered_at, finished_at) VALUES (1, ?, ?, 'completed', '[]', 0, ?, ?)").run(a, c.id, T0 - 10 * DAY, T0 - 9 * DAY);
    const t = audience.contactTimeline(A, c.id).filter((x) => x.type === "automation");
    assert.equal(t.length, 2);
    assert.match(t[0].text, /terminé/i);
    assert.match(t[1].text, /Entré/);
    assert.equal(t[0].href, `/marketing/automatisations/${a}`);
  });
  test("événements KOYEKOLA affichés ; ceux déjà représentés (création, étiquette, liste) ne sont pas doublés", () => {
    const c = add("a@ex.fr", { created: T0 - 20 * DAY });
    const ev = (name, at) => m.db.prepare("INSERT INTO mk_events (organization_id, name, email, contact_id, source, occurred_at, created_at) VALUES (1, ?, 'a@ex.fr', ?, 'lms', ?, ?)").run(name, c.id, at, at);
    ev("lms.order_completed", T0 - 6 * DAY); ev("contact.created", T0 - 20 * DAY); ev("tag.added", T0 - 7 * DAY); ev("x.inconnu", T0 - 8 * DAY);
    const t = audience.contactTimeline(A, c.id).filter((x) => x.type === "event");
    assert.deepEqual(t.map((x) => x.text.replace(/\.$/, "")), ["Une commande est passée", "x.inconnu"]);
  });
  test("limite respectée, autre contact et autre organisation exclus", () => {
    const c = add("a@ex.fr"), d = add("d@ex.fr");
    for (let i = 0; i < 15; i++) audience.tagContact(A, c.id, `t${i}`);
    audience.tagContact(A, d.id, "autre");
    assert.equal(audience.contactTimeline(A, c.id, { limit: 5 }).length, 5);
    assert.ok(!audience.contactTimeline(A, c.id, { limit: 50 }).some((x) => /autre/.test(x.text)));
    assert.equal(audience.contactTimeline(B, c.id).length, 0);
  });
  test("résumé : e-mails reçus, e-mails cliqués, scénarios en cours, dernière activité", () => {
    const c = add("a@ex.fr", { activity: T0 - DAY });
    const camp = Number(m.db.prepare("INSERT INTO mk_campaigns (organization_id, name, target_type, target_id) VALUES (1, 'C', 'list', 1)").run().lastInsertRowid);
    m.db.prepare("INSERT INTO mk_messages (organization_id, campaign_id, contact_id, email, status, sent_at, first_click_at) VALUES (1, ?, ?, 'a@ex.fr', 'sent', ?, ?)").run(camp, c.id, T0, T0);
    const camp2 = Number(m.db.prepare("INSERT INTO mk_campaigns (organization_id, name, target_type, target_id) VALUES (1, 'D', 'list', 1)").run().lastInsertRowid);
    m.db.prepare("INSERT INTO mk_messages (organization_id, campaign_id, contact_id, email, status) VALUES (1, ?, ?, 'a@ex.fr', 'pending')").run(camp2, c.id);
    const s = audience.contactSummary(A, c.id);
    assert.deepEqual([s.messages, s.clicked, s.runningAutomations], [1, 1, 0], "un message « pending » n'a pas été reçu");
    assert.equal(s.lastActivity, sqlDate(T0 - DAY));
  });
});
