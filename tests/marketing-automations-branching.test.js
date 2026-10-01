// Automatisations — embranchements réels (demandé explicitement par l'utilisateur) : une condition peut désormais
// envoyer vers DEUX suites différentes (pas seulement « continuer » ou « sortir »), et vérifier si un e-mail
// précédent de CE passage a été ouvert ou cliqué — pas seulement l'appartenance à un segment.
//
// Fait constaté en écrivant ces tests (pas seulement un détail de test — cela vaut en production) : le moteur
// enchaîne les étapes SANS s'arrêter tant qu'aucune n'attend (voir engine.js, la boucle `for (guard...)`). Une
// condition placée juste après un e-mail, sans attente entre les deux, s'évalue donc DANS LE MÊME PASSAGE que
// l'envoi — avant que quiconque ait matériellement pu ouvrir ou cliquer. Elle vaudrait toujours « non ». C'est
// pourquoi chaque scénario ci-dessous insère une attente (« fenêtre d'observation ») entre l'envoi et la
// vérification, absente du schéma d'origine mais nécessaire pour qu'il fonctionne comme voulu.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY, T0, quiet } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const templates = require("../src/marketing/templates");
const auto = require("../src/marketing/automations");
const { createProvider } = require("../src/marketing/sending/providers");
const { recordOpen } = require("../src/marketing/sending/tracking");

let m, A, tpl, provider;
const DAY = 86400000;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const contact = (email) => audience.upsertContact(A, { email }).contact;
const event = (name, c) => ({ id: Math.floor(Math.random() * 1e9), organizationId: 1, name, contactId: c.id, email: c.email, metadata: {} });
const runOf = (c) => m.db.prepare("SELECT * FROM mk_automation_runs WHERE contact_id = ?").get(c.id);
const step = (c, opts = {}) => auto.runAutomation(A, runOf(c).id, { provider, now: T0, ...opts });
const messageOf = (campaignId, contactId) => m.db.prepare("SELECT * FROM mk_messages WHERE campaign_id = ? AND contact_id = ?").get(campaignId, contactId);

// Le diagramme demandé : nouveau contact → attendre 1 jour → e-mail « Bienvenue » → l'a-t-il ouvert ? → oui : e-mail
// A · non : e-mail B. AVEC UN AJOUT DÉLIBÉRÉ absent du schéma d'origine : une attente entre l'envoi et la vérification.
// Sans elle, la condition s'évalue dans le MÊME passage que l'envoi (le moteur enchaîne les étapes tant qu'aucune
// n'attend), donc avant que quiconque ait pu matériellement ouvrir l'e-mail : elle vaudrait toujours « non ». Ce
// n'est pas une limite du moteur ici, c'est physique — corrigé en ajoutant une fenêtre d'observation (voir le résumé).
function welcomeAutomation(over = {}) {
  const a = auto.createAutomation(A, {
    name: "Bienvenue avec branchement", kind: "transactional", triggerEvent: "lms.user_registered",
    steps: [
      { type: "wait", amount: 1, unit: "days" }, // 0
      { type: "email", templateId: tpl.id }, // 1 — « Bienvenue »
      { type: "wait", amount: 3, unit: "days" }, // 2 — fenêtre d'observation avant de vérifier l'ouverture
      { type: "condition", check: "opened", ref: 1, onTrue: 4, onFalse: 6 }, // 3
      { type: "email", templateId: tpl.id }, // 4 — e-mail A (ouvert)
      { type: "end" }, // 5
      { type: "email", templateId: tpl.id }, // 6 — e-mail B (pas ouvert)
    ],
    ...over,
  });
  auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
  return a;
}

beforeEach(() => {
  m = freshMarketing(); A = m.A;
  templates.setOrgAddress(A, "12 rue des Écoles, Paris");
  tpl = templates.createTemplate(A, { name: "Bienvenue transac", kind: "transactional", subject: "Bienvenue", blocks: [{ type: "text", markdown: "Bonjour !" }] });
  provider = createProvider({ provider: "console" }, { log: quiet });
});

describe("validation", () => {
  const bad = (steps) => code(() => auto.createAutomation(A, { name: `X${Math.random()}`, kind: "transactional", triggerEvent: "lms.user_registered", steps }));

  test("check inconnu refusé", () => {
    assert.equal(bad([{ type: "email", templateId: tpl.id }, { type: "condition", check: "deviné", ref: 0 }]), "invalid_automation");
  });
  test("« opened »/« clicked » sans référence valide vers un e-mail antérieur : refusé", () => {
    assert.equal(bad([{ type: "condition", check: "opened", ref: 0 }]), "invalid_automation", "aucune étape 0 n'existe encore avant elle-même");
    assert.equal(bad([{ type: "wait", amount: 1, unit: "days" }, { type: "condition", check: "opened", ref: 0 }]), "invalid_automation", "l'étape 0 n'est pas un e-mail");
    assert.equal(bad([{ type: "email", templateId: tpl.id }, { type: "wait", amount: 1, unit: "days" }, { type: "condition", check: "opened", ref: 5 }]), "invalid_automation", "l'étape 5 n'existe pas");
    assert.equal(bad([{ type: "email", templateId: tpl.id }, { type: "email", templateId: tpl.id }, { type: "condition", check: "opened", ref: 1 }]), null, "l'étape 1 EST un e-mail : valide");
  });
  test("onTrue/onFalse : « next », « exit », ou le numéro d'une étape PLUS LOIN — jamais un texte libre, ni soi-même, ni en arrière", () => {
    assert.equal(bad([{ type: "email", templateId: tpl.id }, { type: "condition", check: "opened", ref: 0, onTrue: "peut-être" }]), "invalid_automation");
    assert.equal(bad([{ type: "email", templateId: tpl.id }, { type: "condition", check: "opened", ref: 0, onFalse: 99 }]), "invalid_automation", "l'étape 99 n'existe pas");
    assert.equal(bad([{ type: "email", templateId: tpl.id }, { type: "condition", check: "opened", ref: 0, onTrue: 1 }]), "invalid_automation", "l'étape 1, c'est la condition elle-même");
    assert.equal(bad([{ type: "email", templateId: tpl.id }, { type: "condition", check: "opened", ref: 0, onTrue: 0 }, { type: "end" }]), "invalid_automation", "l'étape 0 est AVANT la condition : un saut arrière créerait une boucle");
    assert.equal(bad([{ type: "email", templateId: tpl.id }, { type: "condition", check: "opened", ref: 0, onTrue: "exit" }, { type: "end" }]), null);
  });
  test("le diagramme exact demandé est accepté tel quel", () => {
    assert.doesNotThrow(() => welcomeAutomation());
  });
});

describe("exécution du diagramme demandé (attendre → e-mail → attendre → ouvert ? → A ou B)", () => {
  test("e-mail ouvert pendant la fenêtre d'observation → e-mail A envoyé, jamais B", async () => {
    welcomeAutomation();
    const c = contact("ouvre@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));

    await step(c); // étape 0 : attendre 1 jour (planifie le réveil, n'envoie rien)
    assert.equal(provider.sent.length, 0);

    await step(c, { now: T0 + DAY }); // étape 1 : envoie « Bienvenue », puis étape 2 : attendre 3 jours (même passage)
    assert.equal(provider.sent.length, 1);
    assert.equal(runOf(c).status, "running");

    // La personne ouvre l'e-mail PENDANT la fenêtre d'observation (entre les deux appels ci-dessus et ci-dessous)
    const welcomeCampaignId = JSON.parse(m.db.prepare("SELECT active_steps FROM mk_automations WHERE id = ?").get(auto.listAutomations(A)[0].id).active_steps)[1].campaignId;
    const message = messageOf(welcomeCampaignId, c.id);
    recordOpen({ db: m.db, organizationId: 1, now: () => T0 }, { messageId: message.id, userAgent: "Mozilla/5.0", at: T0 + DAY + 1000 });

    await step(c, { now: T0 + 4 * DAY }); // étape 3 : condition « ouvert ? » (vraie) → étape 4 : e-mail A → étape 5 : fin, tout dans ce même appel

    assert.equal(provider.sent.length, 2, "Bienvenue + A, jamais B");
    assert.equal(runOf(c).status, "completed");
    const run = runOf(c);
    const detail = m.db.prepare("SELECT detail FROM mk_automation_log WHERE run_id = ? AND action = 'condition'").get(run.id).detail;
    assert.match(detail, /vraie/);
  });

  test("e-mail jamais ouvert (fenêtre d'observation écoulée) → e-mail B envoyé, jamais A", async () => {
    welcomeAutomation();
    const c = contact("ignore@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    await step(c);
    await step(c, { now: T0 + DAY }); // « Bienvenue » envoyé, jamais ouvert
    await step(c, { now: T0 + 4 * DAY }); // condition : fausse → étape 6 (e-mail B), dans le même appel

    assert.equal(provider.sent.length, 2, "Bienvenue + B, jamais A");
    assert.equal(runOf(c).status, "completed");
  });

  test("isolation entre passages : l'ouverture d'UN AUTRE contact ne fait jamais dévier celui-ci", async () => {
    welcomeAutomation();
    const c1 = contact("c1@ex.fr");
    const c2 = contact("c2@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c1));
    auto.onEvent(A, event("lms.user_registered", c2));
    await step(c1); await step(c2);
    await step(c1, { now: T0 + DAY }); await step(c2, { now: T0 + DAY }); // « Bienvenue » envoyé aux deux, fenêtre d'observation démarrée

    const welcomeCampaignId = JSON.parse(m.db.prepare("SELECT active_steps FROM mk_automations").get().active_steps)[1].campaignId;
    // Seul c1 ouvre son e-mail
    recordOpen({ db: m.db, organizationId: 1, now: () => T0 }, { messageId: messageOf(welcomeCampaignId, c1.id).id, userAgent: "Mozilla/5.0", at: T0 + DAY + 500 });

    await step(c1, { now: T0 + 4 * DAY }); // condition vraie pour c1 → e-mail A
    await step(c2, { now: T0 + 4 * DAY }); // condition fausse pour c2 → e-mail B

    assert.equal(provider.sent.length, 4, "Bienvenue×2 + A (c1) + B (c2)");
    // Les 3 étapes d'e-mail partagent ici le même modèle (donc le même objet) : on distingue les branches par
    // campagne système, pas par le texte du message.
    const frozen = JSON.parse(m.db.prepare("SELECT active_steps FROM mk_automations").get().active_steps);
    const [campaignA, campaignB] = [frozen[4].campaignId, frozen[6].campaignId];
    assert.ok(messageOf(campaignA, c1.id), "c1 (a ouvert) a reçu l'e-mail A");
    assert.equal(messageOf(campaignA, c2.id), undefined, "c2 n'a jamais reçu l'e-mail A");
    assert.ok(messageOf(campaignB, c2.id), "c2 (n'a pas ouvert) a reçu l'e-mail B");
    assert.equal(messageOf(campaignB, c1.id), undefined, "c1 n'a jamais reçu l'e-mail B");
  });
});

describe("condition « clicked »", () => {
  test("suit le même mécanisme que « opened », avec les clics", async () => {
    // Une attente sépare l'envoi de la vérification : sans elle, la condition s'évaluerait dans le même passage
    // que l'envoi, avant que quiconque ait pu cliquer (voir la remarque en tête de fichier).
    const a = auto.createAutomation(A, {
      name: "Clic", kind: "transactional", triggerEvent: "lms.user_registered",
      steps: [
        { type: "email", templateId: tpl.id }, // 0
        { type: "wait", amount: 1, unit: "days" }, // 1 — fenêtre d'observation
        { type: "condition", check: "clicked", ref: 0, onTrue: "exit", onFalse: "next" }, // 2
        { type: "add_tag", tag: "n-a-pas-clique" }, // 3
      ],
    });
    auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
    const c = contact("clique@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    await step(c); // envoie l'e-mail, puis attend 1 jour (même passage)
    const campaignId = JSON.parse(m.db.prepare("SELECT active_steps FROM mk_automations WHERE id = ?").get(a.id).active_steps)[0].campaignId;
    const message = messageOf(campaignId, c.id);
    // Simule un clic directement (le vrai tunnel HTTP passe par sending/tracking.js#recordClick, déjà testé ailleurs) :
    // seul le compteur lu par la condition nous intéresse ici.
    m.db.prepare("UPDATE mk_messages SET click_count = 1 WHERE id = ?").run(message.id);
    await step(c, { now: T0 + DAY }); // réveil : condition « cliqué ? » (vraie) → sortie
    assert.equal(runOf(c).status, "exited", "a cliqué → sort directement (onTrue: exit)");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_contact_tags WHERE contact_id = ?").get(c.id).n, 0, "l'étiquette « n-a-pas-clique » n'a jamais été posée");
  });
});

// L'éditeur graphique (canvas) permet à deux embranchements de reconverger sur N'IMPORTE QUELLE étape, pas
// seulement après une condition (ex. deux e-mails différents qui ramènent tous les deux vers la même étiquette).
// Le moteur doit donc accepter un saut explicite sur une étape ORDINAIRE, pas seulement sur une condition.
describe("saut explicite (\"next\") sur une étape ordinaire — nécessaire pour l'éditeur graphique", () => {
  test("une étape « e-mail » peut sauter vers une étape plus loin que la suivante", async () => {
    const a = auto.createAutomation(A, {
      name: "Saut simple", kind: "transactional", triggerEvent: "lms.user_registered",
      steps: [
        { type: "email", templateId: tpl.id, next: 2 }, // 0 : saute l'étape 1
        { type: "add_tag", tag: "jamais-pose" }, // 1
        { type: "add_tag", tag: "toujours-pose" }, // 2
      ],
    });
    auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
    const c = contact("saut@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    await step(c);
    assert.equal(runOf(c).status, "completed");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_contact_tags t JOIN mk_tags g ON g.id = t.tag_id WHERE t.contact_id = ? AND g.name = 'jamais-pose'").get(c.id).n, 0);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_contact_tags t JOIN mk_tags g ON g.id = t.tag_id WHERE t.contact_id = ? AND g.name = 'toujours-pose'").get(c.id).n, 1);
  });
  test("deux branches d'une condition peuvent reconverger sur la MÊME étape ordinaire (pas seulement via « Fin »)", async () => {
    // A (étape 1) et B (étape 3) pointent tous deux, via « next », vers l'étiquette commune (étape 4)
    const a = auto.createAutomation(A, {
      name: "Reconvergence", kind: "transactional", triggerEvent: "lms.user_registered",
      steps: [
        { type: "condition", check: "segment", definition: { op: "and", rules: [{ field: "tag", cmp: "has", value: "vip" }] }, onTrue: 1, onFalse: 3 }, // 0
        { type: "add_tag", tag: "branche-a", next: 4 }, // 1
        { type: "end" }, // 2 (jamais atteinte : la branche A saute par-dessus)
        { type: "add_tag", tag: "branche-b", next: 4 }, // 3
        { type: "add_tag", tag: "reconverge" }, // 4
      ],
    });
    auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
    const vip = contact("vip@ex.fr"); audience.tagContact(A, vip.id, "vip");
    const autre = contact("autre@ex.fr");
    auto.onEvent(A, event("lms.user_registered", vip));
    auto.onEvent(A, event("lms.user_registered", autre));
    await step(vip); await step(autre);
    const hasTag = (c, name) => m.db.prepare("SELECT COUNT(*) n FROM mk_contact_tags t JOIN mk_tags g ON g.id = t.tag_id WHERE t.contact_id = ? AND g.name = ?").get(c.id, name).n === 1;
    assert.ok(hasTag(vip, "branche-a") && hasTag(vip, "reconverge") && !hasTag(vip, "branche-b"));
    assert.ok(hasTag(autre, "branche-b") && hasTag(autre, "reconverge") && !hasTag(autre, "branche-a"));
    assert.equal(runOf(vip).status, "completed");
    assert.equal(runOf(autre).status, "completed");
  });
  test("« next: exit » sur une étape ordinaire sort immédiatement du scénario", async () => {
    const a = auto.createAutomation(A, {
      name: "Sortie directe", kind: "transactional", triggerEvent: "lms.user_registered",
      steps: [{ type: "add_tag", tag: "avant", next: "exit" }, { type: "add_tag", tag: "jamais" }],
    });
    auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
    const c = contact("sortie@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    await step(c);
    assert.equal(runOf(c).status, "exited");
  });
  test("saut en arrière refusé à la validation (empêche une boucle infinie)", () => {
    assert.equal(
      code(() => auto.createAutomation(A, { name: "Boucle", kind: "transactional", triggerEvent: "lms.user_registered", steps: [{ type: "add_tag", tag: "a" }, { type: "add_tag", tag: "b", next: 0 }] })),
      "invalid_automation"
    );
  });
});
