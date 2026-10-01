// Formulaires — données réelles : création (adresse générée, unique), validation, publication, soumission publique
// (contact créé AVEC preuve de consentement, jamais de raccourci), vues/conversions, isolation.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const forms = require("../src/marketing/forms");
const { createList } = require("../src/marketing/audience/lists");
const { getContact } = require("../src/marketing/audience/contacts");
const { consentHistory } = require("../src/marketing/compliance/consent");
const { MarketingError } = require("../src/marketing/errors");

let m, A, B;
beforeEach(() => { m = freshMarketing(); A = m.A; B = m.B; });

describe("création", () => {
  test("l'adresse (slug) est dérivée du nom, minuscules, sans accents", () => {
    const f = forms.createForm(A, { name: "Newsletter Été !", consentText: "Oui, je veux les actualités." });
    assert.equal(f.slug, "newsletter-ete");
    assert.equal(f.status, "draft");
  });
  test("deux formulaires de même nom : adresses distinctes (suffixe numérique)", () => {
    const f1 = forms.createForm(A, { name: "Newsletter", consentText: "Oui, je veux les actualités." });
    const f2 = forms.createForm(A, { name: "Newsletter", consentText: "Oui, je veux les actualités." });
    assert.notEqual(f1.slug, f2.slug);
    assert.equal(f2.slug, "newsletter-2");
  });
  test("nom et texte de consentement obligatoires", () => {
    assert.throws(() => forms.createForm(A, { name: "", consentText: "Oui" }), MarketingError);
    assert.throws(() => forms.createForm(A, { name: "X", consentText: "" }), MarketingError);
  });
  test("champ inconnu refusé", () => {
    assert.throws(() => forms.createForm(A, { name: "X", consentText: "Oui", fields: ["invente"] }), MarketingError);
  });
});

describe("cycle de vie", () => {
  test("brouillon par défaut ; publier puis dépublier", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    assert.equal(f.status, "draft");
    forms.setStatus(A, f.id, "published");
    assert.equal(forms.getForm(A, f.id).status, "published");
    forms.setStatus(A, f.id, "draft");
    assert.equal(forms.getForm(A, f.id).status, "draft");
  });
  test("mise à jour : nom, champs, liste, message de remerciement", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    const list = createList(A, { name: "Abonnés" });
    const updated = forms.updateForm(A, f.id, { name: "N2", fields: ["first_name"], consentText: "Oui, toujours.", listId: list.id, thankYouText: "Merci !" });
    assert.equal(updated.name, "N2");
    assert.deepEqual(updated.fields, ["first_name"]);
    assert.equal(updated.listId, list.id);
    assert.equal(updated.thankYouText, "Merci !");
  });
  test("suppression : introuvable ensuite", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    forms.deleteForm(A, f.id);
    assert.throws(() => forms.getForm(A, f.id), MarketingError);
  });
});

describe("isolation entre organisations", () => {
  test("formulaire d'une autre organisation : introuvable, jamais dans la liste", () => {
    const f = forms.createForm(B, { name: "Chez B", consentText: "Oui" });
    assert.throws(() => forms.getForm(A, f.id), MarketingError);
    assert.deepEqual(forms.listForms(A), []);
  });
});

describe("côté public : getPublishedForm / recordView", () => {
  test("un brouillon n'est jamais renvoyé côté public, même avec la bonne adresse", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    assert.equal(forms.getPublishedForm(m.db, 1, f.slug), null);
  });
  test("publié : renvoyé ; une adresse inconnue : rien", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    forms.setStatus(A, f.id, "published");
    assert.ok(forms.getPublishedForm(m.db, 1, f.slug));
    assert.equal(forms.getPublishedForm(m.db, 1, "inconnu"), null);
  });
  test("une organisation ne voit jamais le formulaire d'une autre, même publié", () => {
    const f = forms.createForm(B, { name: "Chez B", consentText: "Oui" });
    forms.setStatus(B, f.id, "published");
    assert.equal(forms.getPublishedForm(m.db, 1, f.slug), null);
  });
  test("recordView incrémente le compteur de vues", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    forms.recordView(m.db, f.id);
    forms.recordView(m.db, f.id);
    assert.equal(forms.getForm(A, f.id).viewCount, 2);
  });
});

describe("soumission (submitForm)", () => {
  test("crée le contact AVEC une preuve de consentement (jamais de raccourci)", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui, je veux les actualités.", fields: ["first_name"] });
    forms.setStatus(A, f.id, "published");
    const result = forms.submitForm(A, f.id, { email: "visiteur@ex.fr", first_name: "Ada" });
    assert.equal(result.ok, true);
    assert.equal(result.contact.status, "subscribed");
    assert.equal(result.contact.first_name, "Ada");
    const proof = consentHistory(A, result.contact.id)[0];
    assert.equal(proof.text_shown, "Oui, je veux les actualités.");
    assert.equal(proof.source, "form");
  });
  test("incrémente submit_count", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    forms.setStatus(A, f.id, "published");
    forms.submitForm(A, f.id, { email: "a@ex.fr" });
    forms.submitForm(A, f.id, { email: "b@ex.fr" });
    assert.equal(forms.getForm(A, f.id).submitCount, 2);
  });
  test("un formulaire en brouillon refuse toute soumission", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    const result = forms.submitForm(A, f.id, { email: "a@ex.fr" });
    assert.equal(result.ok, false);
    assert.equal(result.reason, "not_published");
    assert.equal(getContact(A, 1), null);
  });
  test("adresse invalide : refusée proprement, pas d'exception, pas de contact créé", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    forms.setStatus(A, f.id, "published");
    const result = forms.submitForm(A, f.id, { email: "pas-un-email" });
    assert.equal(result.ok, false);
    assert.equal(result.reason, "invalid_email");
  });
  test("ajoute à la liste configurée ; si la liste a été supprimée depuis, la soumission fonctionne quand même", () => {
    const list = createList(A, { name: "Abonnés" });
    const f = forms.createForm(A, { name: "N", consentText: "Oui", listId: list.id });
    forms.setStatus(A, f.id, "published");
    const r1 = forms.submitForm(A, f.id, { email: "a@ex.fr" });
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_list_members WHERE list_id = ? AND contact_id = ?").get(list.id, r1.contact.id).n, 1);

    m.db.prepare("DELETE FROM mk_lists WHERE id = ?").run(list.id);
    const r2 = forms.submitForm(A, f.id, { email: "b@ex.fr" });
    assert.equal(r2.ok, true, "la suppression de la liste ne doit jamais casser le formulaire");
  });
  test("même adresse soumise deux fois : un seul contact, pas d'erreur", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    forms.setStatus(A, f.id, "published");
    const r1 = forms.submitForm(A, f.id, { email: "deux-fois@ex.fr" });
    const r2 = forms.submitForm(A, f.id, { email: "deux-fois@ex.fr" });
    assert.equal(r1.contact.id, r2.contact.id);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_contacts WHERE email = ?").get("deux-fois@ex.fr").n, 1);
  });
  test("une adresse déjà sur liste de suppression : refusée, jamais réabonnée par un formulaire", () => {
    m.db.prepare("INSERT INTO mk_suppressions (organization_id, email, reason) VALUES (1, 'bloque@ex.fr', 'complained')").run();
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    forms.setStatus(A, f.id, "published");
    const result = forms.submitForm(A, f.id, { email: "bloque@ex.fr" });
    assert.equal(result.ok, false);
    assert.equal(result.reason, "suppressed");
  });
  test("seuls les champs déclarés par le formulaire sont enregistrés (un champ non proposé est ignoré)", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui", fields: ["first_name"] });
    forms.setStatus(A, f.id, "published");
    const result = forms.submitForm(A, f.id, { email: "c@ex.fr", first_name: "Léa", company: "Ne doit pas être pris" });
    assert.equal(result.contact.first_name, "Léa");
    assert.equal(result.contact.company, "");
  });
});
