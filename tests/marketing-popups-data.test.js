// Pop-ups (jalon M5 — Capture, partie 2) — données : réglages validés et bornés, un seul pop-up actif à la fois,
// isolation entre organisations. Pas de nouvel objet : ce sont des colonnes de mk_forms, testées via forms/index.js.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const forms = require("../src/marketing/forms");

let m, A, B;
beforeEach(() => { m = freshMarketing(); A = m.A; B = m.B; });

describe("réglages par défaut", () => {
  test("un formulaire créé n'est pas un pop-up (il faut l'activer explicitement)", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    assert.equal(f.popupEnabled, false);
    assert.equal(f.popupTrigger, "delay");
    assert.equal(f.popupTriggerValue, 8);
    assert.equal(f.popupFrequencyDays, 7);
  });
});

describe("mise à jour des réglages", () => {
  test("active le pop-up avec un déclencheur au défilement", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    const updated = forms.updateForm(A, f.id, { name: "N", consentText: "Oui", fields: [], popupEnabled: true, popupTrigger: "scroll", popupTriggerValue: 40, popupFrequencyDays: 14 });
    assert.equal(updated.popupEnabled, true);
    assert.equal(updated.popupTrigger, "scroll");
    assert.equal(updated.popupTriggerValue, 40);
    assert.equal(updated.popupFrequencyDays, 14);
  });
  test("déclencheur inconnu : retombe sur « delay » plutôt que d'échouer (réglage secondaire, jamais bloquant)", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    const updated = forms.updateForm(A, f.id, { name: "N", consentText: "Oui", fields: [], popupTrigger: "invente-un-truc" });
    assert.equal(updated.popupTrigger, "delay");
  });
  test("valeur de déclencheur hors bornes : retombe sur le défaut du déclencheur choisi", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    const tropGrand = forms.updateForm(A, f.id, { name: "N", consentText: "Oui", fields: [], popupTrigger: "delay", popupTriggerValue: 99999 });
    assert.equal(tropGrand.popupTriggerValue, 8);
    const negatif = forms.updateForm(A, f.id, { name: "N", consentText: "Oui", fields: [], popupTrigger: "scroll", popupTriggerValue: -5 });
    assert.equal(negatif.popupTriggerValue, 50);
  });
  test("fréquence hors bornes (0 ou > 90) : retombe sur 7 jours", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    const zero = forms.updateForm(A, f.id, { name: "N", consentText: "Oui", fields: [], popupFrequencyDays: 0 });
    assert.equal(zero.popupFrequencyDays, 7);
    const enorme = forms.updateForm(A, f.id, { name: "N", consentText: "Oui", fields: [], popupFrequencyDays: 400 });
    assert.equal(enorme.popupFrequencyDays, 7);
  });
  test("désactiver un pop-up actif", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    forms.updateForm(A, f.id, { name: "N", consentText: "Oui", fields: [], popupEnabled: true });
    const off = forms.updateForm(A, f.id, { name: "N", consentText: "Oui", fields: [], popupEnabled: false });
    assert.equal(off.popupEnabled, false);
  });
});

describe("getActivePopup (utilisé par la page JSON publique)", () => {
  test("rien si aucun formulaire n'a le pop-up activé", () => {
    forms.createForm(A, { name: "N", consentText: "Oui" });
    assert.equal(forms.getActivePopup(m.db, 1), null);
  });
  test("un formulaire pop-up en brouillon n'est jamais actif", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    forms.updateForm(A, f.id, { name: "N", consentText: "Oui", fields: [], popupEnabled: true });
    assert.equal(forms.getActivePopup(m.db, 1), null, "il faut aussi le publier");
  });
  test("publié ET pop-up activé : actif", () => {
    const f = forms.createForm(A, { name: "N", consentText: "Oui" });
    forms.updateForm(A, f.id, { name: "N", consentText: "Oui", fields: [], popupEnabled: true, popupTrigger: "exit" });
    forms.setStatus(A, f.id, "published");
    const active = forms.getActivePopup(m.db, 1);
    assert.equal(active.slug, f.slug);
    assert.equal(active.popupTrigger, "exit");
  });
  test("un seul pop-up actif à la fois : le plus récemment modifié gagne", () => {
    const f1 = forms.createForm(A, { name: "Premier", consentText: "Oui" });
    forms.updateForm(A, f1.id, { name: "Premier", consentText: "Oui", fields: [], popupEnabled: true });
    forms.setStatus(A, f1.id, "published");
    const f2 = forms.createForm(A, { name: "Second", consentText: "Oui" });
    forms.updateForm(A, f2.id, { name: "Second", consentText: "Oui", fields: [], popupEnabled: true });
    forms.setStatus(A, f2.id, "published");
    assert.equal(forms.getActivePopup(m.db, 1).slug, f2.slug, "le plus récemment mis à jour (f2 modifié après f1)");
  });
  test("isolation : le pop-up d'une autre organisation n'apparaît jamais", () => {
    const f = forms.createForm(B, { name: "Chez B", consentText: "Oui" });
    forms.updateForm(B, f.id, { name: "Chez B", consentText: "Oui", fields: [], popupEnabled: true });
    forms.setStatus(B, f.id, "published");
    assert.equal(forms.getActivePopup(m.db, 1), null);
  });
});
