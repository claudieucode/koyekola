// Disponibilité des actions d'un scénario : calculée sur l'ÉTAT RÉEL de l'organisation (fournisseurs d'e-mails et de SMS),
// jamais déclarée. Une action qui attend une connexion est « connection_required » avec la raison ; une fois la connexion
// réglée, elle devient « available ». Les parcours « natifs » reposent sur des événements que KOLAKISA émet réellement.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const registry = require("../src/marketing/automations/actions");
const { checkCapability, CAPABILITIES } = require("../src/marketing/automations/actions/capabilities");
const { TRIGGERS } = require("../src/marketing/automations/catalog");
const library = require("../src/marketing/automations/library");

let m, A;
beforeEach(() => { m = freshMarketing(); A = m.ctx(1); });
const state = (type) => registry.describeActions(A).find((a) => a.type === type).availability;

describe("connexions requises par les actions", () => {
  test("par défaut (fournisseurs « console », aucun webhook) : e-mail, SMS et webhook demandent une connexion, avec la raison ; le reste est disponible", () => {
    const all = registry.describeActions(A);
    const needing = all.filter((a) => a.availability.state === "connection_required").map((a) => a.type).sort();
    assert.deepEqual(needing, ["email", "sms", "webhook_call"]);
    assert.match(state("email").reasons[0].detail, /console|aucun fournisseur/);
    assert.equal(state("email").reasons[0].fix, "Réglages d'envoi");
    assert.equal(state("sms").reasons[0].fix, "SMS → Réglages");
    for (const a of all.filter((x) => !["email", "sms", "webhook_call"].includes(x.type))) assert.equal(a.availability.state, "available", `${a.type} : aucune connexion requise`);
  });

  test("e-mail : fournisseur choisi mais expéditeur manquant → toujours « connexion requise », puis disponible une fois l'expéditeur réglé", () => {
    A.settings.set(1, "email.provider", "smtp");
    assert.equal(state("email").state, "connection_required");
    assert.match(state("email").reasons[0].detail, /expédition manquante/);
    A.settings.set(1, "email.from", "KOLAKISA <contact@exemple.fr>");
    assert.equal(state("email").state, "available");
    assert.equal(state("email").reasons[0].ok, true);
  });

  test("SMS : chaque élément manquant est nommé ; disponible seulement quand fournisseur, expéditeur et identifiants sont réglés", () => {
    A.settings.set(1, "sms.provider", "twilio");
    assert.match(state("sms").reasons[0].detail, /expéditeur manquant/);
    A.settings.set(1, "sms.sender", "KOLAKISA");
    assert.match(state("sms").reasons[0].detail, /identifiants/);
    A.settings.set(1, "sms.account_sid", "AC00000000000000000000000000000000");
    A.settings.set(1, "sms.auth_token", "jeton");
    assert.equal(state("sms").state, "available");
  });

  test("la disponibilité d'une organisation ne dépend pas d'une autre", () => {
    A.settings.set(1, "email.provider", "smtp"); A.settings.set(1, "email.from", "a@exemple.fr");
    assert.equal(registry.describeActions(m.ctx(1)).find((a) => a.type === "email").availability.state, "available");
    assert.equal(registry.describeActions(m.ctx(2)).find((a) => a.type === "email").availability.state, "connection_required");
  });

  test("sans contexte : seulement l'identité des actions (aucune disponibilité inventée)", () => {
    for (const a of registry.describeActions()) assert.equal(a.availability, undefined);
  });

  test("une connexion illisible ou inconnue compte comme manquante, jamais comme réglée", () => {
    assert.equal(checkCapability({}, "sms_provider").ok, false);
    assert.equal(checkCapability(A, "inconnue").ok, false);
    assert.deepEqual(Object.keys(CAPABILITIES).sort(), ["email_provider", "sms_provider", "webhook_endpoint"]);
  });

  test("toute connexion citée par une action existe", () => {
    for (const a of registry.listActions()) for (const key of a.requires) assert.ok(CAPABILITIES[key], `${a.type} : connexion « ${key} » inconnue`);
  });
});

describe("parcours natifs : fondés sur des événements réellement émis", () => {
  const NATIVE = ["formation-consultee-sans-achat-natif", "panier-ajoute-sans-achat-natif", "commande-commencee-sans-achat-natif", "progression-50-pourcent", "progression-90-pourcent"];

  test("chaque parcours natif est « prêt », déclenché par un événement du catalogue, sans configuration à faire côté site", () => {
    const { evaluate } = require("../src/marketing/automations/library/availability");
    for (const key of NATIVE) {
      const j = library.EXTRA.find((x) => x.key === key);
      assert.ok(j, `${key} présent`);
      assert.ok(Object.hasOwn(TRIGGERS, j.trigger.event), `${key} : déclencheur « ${j.trigger.event} » du catalogue`);
      assert.equal(j.needs, undefined, `${key} : aucun événement à envoyer par le site`);
      assert.equal(evaluate(j, { smsReady: false }).status, "ready", key);
    }
  });

  test("ces événements sont réellement émis par le code (suivi des visiteurs, pont du LMS)", () => {
    const fs = require("node:fs"), path = require("node:path");
    const src = ["visitors/triggers.js", "bridge/events.js"].map((f) => fs.readFileSync(path.join(__dirname, "..", "src", "marketing", f), "utf8")).join("\n");
    for (const name of ["lms.course_viewed", "lms.cart_added", "lms.checkout_started"]) assert.ok(src.includes(name), `${name} émis par visitors/triggers.js`);
    assert.match(src, /lms\.course_progress_\$\{m\}/, "paliers de progression émis par bridge/events.js");
    assert.deepEqual([10, 50, 90].map((p) => Object.hasOwn(TRIGGERS, `lms.course_progress_${p}`)), [true, true, true]);
  });

  test("le registre « non disponibles » ne prétend plus qu'un événement existant n'existe pas", () => {
    const u = require("../src/marketing/automations/library/unavailable");
    assert.equal(u.find((x) => x.key === "ajout-au-panier"), undefined, "l'ajout au panier a maintenant son parcours natif");
    for (const key of ["visite-page-site", "visites-repetees-site"]) assert.doesNotMatch(u.find((x) => x.key === key).unavailable, /aucun événement de visite n'existe|n'enregistre pas les pages vues/);
    assert.match(u.find((x) => x.key === "progression-paliers").unavailable, /10 %, 50 % et 90 %/);
  });
});
