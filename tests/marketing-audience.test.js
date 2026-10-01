// Marketing M1a — contacts, propriétés personnalisées, listes, étiquettes, isolation entre organisations.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");

let m, A, B;
beforeEach(() => { m = freshMarketing(); A = m.A; B = m.B; });
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };

describe("contacts", () => {
  test("création : e-mail normalisé, statut « unknown » (jamais abonné par défaut), événement émis", () => {
    const { contact, created } = audience.upsertContact(A, { email: "  Marie@Exemple.FR ", first_name: "Marie", country: "FR" });
    assert.equal(created, true);
    assert.equal(contact.email, "marie@exemple.fr");
    assert.equal(contact.status, "unknown");
    assert.equal(contact.first_name, "Marie");
    const ev = m.db.prepare("SELECT name, contact_id FROM mk_events WHERE organization_id = 1").all();
    assert.deepEqual(ev.map((e) => e.name), ["contact.created"]);
  });
  test("le statut fourni à la création est IGNORÉ : seul le module de conformité le change", () => {
    const { contact } = audience.upsertContact(A, { email: "a@b.fr", status: "subscribed" });
    assert.equal(contact.status, "unknown");
  });
  test("e-mail invalide refusé avec un code et une raison", () => {
    assert.equal(code(() => audience.upsertContact(A, { email: "pas-un-email" })), "invalid_email");
    assert.throws(() => audience.upsertContact(A, { email: "" }), /vide|absente/i);
  });
  test("upsert sur un e-mail existant : complète les champs vides, n'écrase pas, ne touche jamais au statut", () => {
    const { contact } = audience.upsertContact(A, { email: "a@b.fr", first_name: "Anne" });
    compliance.recordConsent(A, contact.id, { source: "form", textShown: "Je souhaite recevoir les actualités" });
    const again = audience.upsertContact(A, { email: "A@B.fr", first_name: "Autre", company: "Acme", status: "unknown" });
    assert.equal(again.created, false);
    assert.equal(again.contact.id, contact.id);
    assert.equal(again.contact.first_name, "Anne");
    assert.equal(again.contact.company, "Acme");
    assert.equal(again.contact.status, "subscribed");
  });
  test("createContact refuse un doublon (code duplicate)", () => {
    audience.createContact(A, { email: "a@b.fr" });
    assert.equal(code(() => audience.createContact(A, { email: "A@b.fr" })), "duplicate");
  });
  test("adresse en liste de suppression : le contact naît « suppressed »", () => {
    compliance.addSuppression(A, { email: "x@y.fr", reason: "manual" });
    assert.equal(audience.upsertContact(A, { email: "x@y.fr" }).contact.status, "suppressed");
  });
  test("champs bornés et nettoyés (longueur, types)", () => {
    const { contact } = audience.upsertContact(A, { email: "a@b.fr", first_name: "  Zoé  ", company: "x".repeat(500) });
    assert.equal(contact.first_name, "Zoé");
    assert.equal(contact.company.length, 200);
    assert.equal(code(() => audience.upsertContact(A, { email: "c@d.fr", first_name: { a: 1 } })), "invalid_field");
  });
  test("modification : champs modifiables seulement, pas l'e-mail ni le statut", () => {
    const { contact } = audience.upsertContact(A, { email: "a@b.fr" });
    const updated = audience.updateContact(A, contact.id, { first_name: "Léa", phone: "0601020304" });
    assert.equal(updated.first_name, "Léa");
    assert.equal(code(() => audience.updateContact(A, contact.id, { email: "z@z.fr" })), "immutable_field");
    assert.equal(code(() => audience.updateContact(A, contact.id, { status: "subscribed" })), "immutable_field");
    assert.equal(code(() => audience.updateContact(A, 9999, { first_name: "x" })), "not_found");
  });
  test("liste paginée par curseur, filtre par statut et recherche (les jokers LIKE sont neutralisés)", () => {
    for (let i = 1; i <= 7; i++) audience.upsertContact(A, { email: `u${i}@ex.fr`, first_name: i === 3 ? "Zed" : "N" });
    audience.upsertContact(A, { email: "100%@ex.fr" });
    const p1 = audience.listContacts(A, { limit: 5 });
    assert.equal(p1.rows.length, 5);
    assert.ok(p1.nextAfterId);
    const p2 = audience.listContacts(A, { limit: 5, afterId: p1.nextAfterId });
    assert.equal(p2.rows.length, 3);
    assert.equal(p2.nextAfterId, null);
    assert.deepEqual(audience.listContacts(A, { q: "zed" }).rows.map((r) => r.email), ["u3@ex.fr"]);
    assert.equal(audience.listContacts(A, { q: "%" }).rows.length, 1, "« % » cherche un pourcentage, pas tout");
    assert.equal(audience.listContacts(A, { status: "subscribed" }).rows.length, 0);
    assert.equal(audience.countContacts(A, {}), 8);
  });
  test("suppression d'un contact : ses listes, étiquettes, propriétés, consentements partent avec lui", () => {
    const { contact } = audience.upsertContact(A, { email: "a@b.fr" });
    const list = audience.createList(A, { name: "L" });
    audience.addToList(A, list.id, [contact.id]);
    audience.tagContact(A, contact.id, "vip");
    compliance.recordConsent(A, contact.id, { source: "form", textShown: "J'accepte" });
    assert.equal(audience.deleteContact(A, contact.id), true);
    for (const t of ["mk_list_members", "mk_contact_tags", "mk_consents", "mk_contact_property_values"]) {
      assert.equal(m.db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n, 0, t);
    }
    assert.equal(audience.deleteContact(A, contact.id), false);
  });
  test("suppression avec { suppress: true } : l'adresse reste bloquée (réimport impossible)", () => {
    const { contact } = audience.upsertContact(A, { email: "a@b.fr" });
    audience.deleteContact(A, contact.id, { suppress: true });
    assert.equal(audience.upsertContact(A, { email: "a@b.fr" }).contact.status, "suppressed");
  });
});

describe("propriétés personnalisées", () => {
  test("définition typée ; clé valide et unique ; noms réservés refusés", () => {
    audience.defineProperty(A, { key: "niveau", label: "Niveau", type: "select", options: ["débutant", "confirmé"] });
    assert.equal(code(() => audience.defineProperty(A, { key: "niveau", label: "x", type: "text" })), "duplicate");
    for (const key of ["Niveau", "1abc", "a-b", "email", "status", "first_name", "tags", ""]) {
      assert.equal(code(() => audience.defineProperty(A, { key, label: "x", type: "text" })), "invalid_property", key);
    }
    assert.equal(code(() => audience.defineProperty(A, { key: "ok", label: "x", type: "json" })), "invalid_property");
    assert.equal(code(() => audience.defineProperty(A, { key: "s", label: "x", type: "select", options: [] })), "invalid_property");
  });
  test("valeurs typées, validées, lues et retirées", () => {
    const { contact } = audience.upsertContact(A, { email: "a@b.fr" });
    for (const [key, type, options] of [["age", "number"], ["naissance", "date"], ["etudiant", "boolean"], ["ville", "text"], ["niveau", "select", ["a", "b"]]]) {
      audience.defineProperty(A, { key, label: key, type, options });
    }
    audience.setContactProperties(A, contact.id, { age: "34", naissance: "1990-02-28", etudiant: "oui", ville: "Lomé", niveau: "a" });
    assert.deepEqual(audience.getContactProperties(A, contact.id), { age: 34, naissance: "1990-02-28", etudiant: true, ville: "Lomé", niveau: "a" });
    assert.equal(code(() => audience.setContactProperties(A, contact.id, { age: "abc" })), "invalid_value");
    assert.equal(code(() => audience.setContactProperties(A, contact.id, { naissance: "2021-02-30" })), "invalid_value");
    assert.equal(code(() => audience.setContactProperties(A, contact.id, { etudiant: "peut-être" })), "invalid_value");
    assert.equal(code(() => audience.setContactProperties(A, contact.id, { niveau: "z" })), "invalid_value");
    assert.equal(code(() => audience.setContactProperties(A, contact.id, { inconnue: "1" })), "unknown_property");
    audience.setContactProperties(A, contact.id, { ville: "", age: null });
    assert.deepEqual(Object.keys(audience.getContactProperties(A, contact.id)).sort(), ["etudiant", "naissance", "niveau"]);
  });
  test("écriture atomique : une valeur invalide n'enregistre AUCUNE des autres", () => {
    const { contact } = audience.upsertContact(A, { email: "a@b.fr" });
    audience.defineProperty(A, { key: "ville", label: "Ville", type: "text" });
    audience.defineProperty(A, { key: "age", label: "Âge", type: "number" });
    assert.throws(() => audience.setContactProperties(A, contact.id, { ville: "Lomé", age: "x" }));
    assert.deepEqual(audience.getContactProperties(A, contact.id), {});
  });
  test("propriétés fournies à la création du contact", () => {
    audience.defineProperty(A, { key: "ville", label: "Ville", type: "text" });
    const { contact } = audience.upsertContact(A, { email: "a@b.fr", properties: { ville: "Kara" } });
    assert.deepEqual(audience.getContactProperties(A, contact.id), { ville: "Kara" });
  });
});

describe("listes", () => {
  test("création (nom unique sans tenir compte de la casse), ajout, retrait, comptage", () => {
    const l = audience.createList(A, { name: "Newsletter", description: "Mensuelle" });
    assert.equal(code(() => audience.createList(A, { name: "newsletter" })), "duplicate");
    const ids = ["a", "b", "c"].map((n) => audience.upsertContact(A, { email: `${n}@x.fr` }).contact.id);
    assert.deepEqual(audience.addToList(A, l.id, ids), { added: 3, alreadyMembers: 0 });
    assert.deepEqual(audience.addToList(A, l.id, ids.slice(0, 2)), { added: 0, alreadyMembers: 2 });
    assert.equal(audience.listLists(A)[0].member_count, 3);
    assert.equal(audience.removeFromList(A, l.id, [ids[0]]), 1);
    assert.equal(audience.listMembers(A, l.id).rows.length, 2);
  });
  test("être dans une liste NE donne AUCUN consentement", () => {
    const l = audience.createList(A, { name: "L" });
    const { contact } = audience.upsertContact(A, { email: "a@b.fr" });
    audience.addToList(A, l.id, [contact.id]);
    assert.equal(audience.getContact(A, contact.id).status, "unknown");
  });
  test("suppression d'une liste : les contacts restent", () => {
    const l = audience.createList(A, { name: "L" });
    const { contact } = audience.upsertContact(A, { email: "a@b.fr" });
    audience.addToList(A, l.id, [contact.id]);
    assert.equal(audience.deleteList(A, l.id), true);
    assert.ok(audience.getContact(A, contact.id));
  });
  test("liste ou contact introuvable : erreur claire", () => {
    const { contact } = audience.upsertContact(A, { email: "a@b.fr" });
    assert.equal(code(() => audience.addToList(A, 999, [contact.id])), "not_found");
    const l = audience.createList(A, { name: "L" });
    assert.equal(code(() => audience.addToList(A, l.id, [999])), "not_found");
  });
});

describe("étiquettes", () => {
  test("ajout (créée à la volée, insensible à la casse), retrait, comptage, liste", () => {
    const { contact } = audience.upsertContact(A, { email: "a@b.fr" });
    audience.tagContact(A, contact.id, "VIP");
    audience.tagContact(A, contact.id, "vip");
    audience.tagContact(A, contact.id, "Webinaire");
    assert.deepEqual(audience.tagsOf(A, contact.id).map((t) => t.name).sort(), ["VIP", "Webinaire"]);
    assert.equal(audience.listTags(A).find((t) => t.name === "VIP").contact_count, 1);
    assert.equal(audience.untagContact(A, contact.id, "vip"), true);
    assert.equal(audience.untagContact(A, contact.id, "vip"), false);
  });
  test("nom d'étiquette validé", () => {
    const { contact } = audience.upsertContact(A, { email: "a@b.fr" });
    assert.equal(code(() => audience.tagContact(A, contact.id, "   ")), "invalid_field");
    assert.equal(code(() => audience.tagContact(A, contact.id, "x".repeat(65))), "invalid_field");
  });
  test("filtre de la liste des contacts par étiquette et par liste", () => {
    const c1 = audience.upsertContact(A, { email: "a@b.fr" }).contact;
    const c2 = audience.upsertContact(A, { email: "c@d.fr" }).contact;
    audience.tagContact(A, c1.id, "vip");
    const l = audience.createList(A, { name: "L" });
    audience.addToList(A, l.id, [c2.id]);
    const tag = audience.listTags(A)[0];
    assert.deepEqual(audience.listContacts(A, { tagId: tag.id }).rows.map((r) => r.id), [c1.id]);
    assert.deepEqual(audience.listContacts(A, { listId: l.id }).rows.map((r) => r.id), [c2.id]);
  });
});

describe("isolation entre organisations", () => {
  test("même e-mail dans deux organisations : deux contacts distincts ; aucune fuite en lecture", () => {
    const a = audience.upsertContact(A, { email: "a@b.fr", first_name: "A" }).contact;
    const b = audience.upsertContact(B, { email: "a@b.fr", first_name: "B" }).contact;
    assert.notEqual(a.id, b.id);
    assert.equal(audience.getContact(B, a.id), null);
    assert.equal(audience.listContacts(B, {}).rows.length, 1);
    assert.equal(audience.findByEmail(B, "a@b.fr").first_name, "B");
  });
  test("aucune modification ni suppression, ni rattachement croisé, d'une organisation à l'autre", () => {
    const a = audience.upsertContact(A, { email: "a@b.fr" }).contact;
    const listB = audience.createList(B, { name: "LB" });
    assert.equal(code(() => audience.updateContact(B, a.id, { first_name: "pirate" })), "not_found");
    assert.equal(audience.deleteContact(B, a.id), false);
    assert.equal(code(() => audience.addToList(B, listB.id, [a.id])), "not_found");
    assert.equal(code(() => audience.tagContact(B, a.id, "x")), "not_found");
    assert.equal(audience.getContact(A, a.id).first_name, "");
  });
  test("la suppression est propre à l'organisation", () => {
    compliance.addSuppression(A, { email: "x@y.fr", reason: "manual" });
    assert.equal(audience.upsertContact(B, { email: "x@y.fr" }).contact.status, "unknown");
  });
});
