// Marketing — bibliothèque de parcours tout prêts : chaque parcours « utilisable » est réellement créé, activé et exécuté par
// le moteur ; les parcours impossibles ne sont jamais utilisables ; aperçu et recherche ne modifient rien ; le modèle de la
// bibliothèque reste intact après utilisation ; favoris et récents fonctionnent.
const { test, describe, beforeEach, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY, T0, quiet } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const templates = require("../src/marketing/templates");
const auto = require("../src/marketing/automations");
const journeys = require("../src/marketing/automations/journeys");
const availability = require("../src/marketing/automations/library/availability");
const library = require("../src/marketing/automations/library");
const store = require("../src/marketing/automations/library/store");
const describe_ = require("../src/marketing/automations/library/describe");
const smsRender = require("../src/marketing/sms/render");
const sms = require("../src/marketing/sms");
const { createProvider } = require("../src/marketing/sending/providers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

const DAY = 86400000;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const usable = () => journeys.JOURNEYS.filter((j) => !j.unavailable);
let m, A, provider;

describe("bibliothèque : définitions", () => {
  test("clés uniques, champs complets, définitions gelées, noms professionnels", () => {
    const keys = journeys.JOURNEYS.map((j) => j.key);
    assert.equal(new Set(keys).size, keys.length, "aucune clé en double");
    assert.ok(usable().length >= 60, `au moins 60 parcours utilisables (${usable().length})`);
    for (const j of journeys.JOURNEYS) {
      assert.ok(j.label && j.label.length >= 12, `${j.key} : nom explicite`);
      assert.doesNotMatch(j.label, /^(automation|workflow|parcours client|test)\b/i, `${j.key} : nom générique`);
      assert.ok(j.objective, `${j.key} : objectif`);
      assert.ok(library.GROUPS.some(([k]) => k === j.group), `${j.key} : catégorie`);
      assert.ok(library.AUDIENCES[j.audience], `${j.key} : audience`);
      assert.ok(library.GOALS[j.goal], `${j.key} : objectif de classement`);
      assert.ok(Object.isFrozen(j), `${j.key} : définition gelée`);
      if (j.unavailable) {
        assert.ok(j.unavailable.length > 30, `${j.key} : raison explicite`);
        assert.ok(["tracking", "unavailable"].includes(j.blocked), `${j.key} : motif de blocage`);
        assert.equal(j.steps, undefined, `${j.key} : aucune étape inventée`);
      } else {
        assert.ok(j.description && j.note && j.trigger.event, `${j.key} : description, remarque, déclencheur`);
        assert.ok(Object.isFrozen(j.trigger) && Object.isFrozen(j.steps), `${j.key} : étapes gelées`);
      }
    }
  });

  test("contrôle structurel : chaque parcours utilisable respecte la grammaire du moteur (déclencheur, sauts, variables)", () => {
    for (const j of usable()) assert.deepEqual(availability.check(j), [], j.key);
  });

  test("le contrôle refuse bien les définitions invalides (il ne laisse rien passer)", () => {
    const base = usable().find((j) => j.key === "suivi-achat");
    const mutate = (patch) => availability.check({ ...base, ...patch });
    assert.ok(mutate({ trigger: { event: "Pas Valide" } }).length, "déclencheur invalide");
    assert.ok(mutate({ steps: [] }).length, "aucune étape");
    assert.ok(mutate({ steps: [{ type: "teleporter" }] }).length, "type d'étape inconnu");
    assert.ok(mutate({ steps: [{ type: "email", email: 0 }, { type: "condition", check: "segment", definition: { op: "and", rules: [{ field: "event:lms.order_completed", cmp: "never" }] }, onTrue: 0, onFalse: "exit" }] }).length, "saut en arrière");
    assert.ok(mutate({ steps: [{ type: "wait", amount: 400, unit: "days" }] }).length, "attente de plus d'un an");
    assert.ok(mutate({ steps: [{ type: "email", email: 0 }, { type: "end" }, { type: "email", email: 1 }] }).length, "étape jamais atteinte");
    assert.ok(mutate({ kind: "marketing", steps: [{ type: "sms", sms: 0 }] }).length, "SMS sans texte");
    const mail = (blocks) => () => [{ name: "x", subject: "Objet", preheader: "", kind: "transactional", blocks }];
    assert.ok(mutate({ emails: mail([{ type: "text", markdown: "{{event.numero_secret}}" }]) }).some((p) => /indisponible/.test(p)), "variable inconnue");
    assert.ok(availability.check({ ...usable().find((j) => j.key === "bienvenue-creation-compte"), emails: () => [{ name: "x", subject: "Objet", preheader: "", kind: "transactional", blocks: [{ type: "text", markdown: "{{event.order_total}}" }] }] }).length, "variable de commande sur un autre déclencheur");
  });

  test("SMS : alphabet GSM-7, un seul SMS facturé, balises connues", () => {
    let n = 0;
    for (const j of usable().filter((x) => x.sms)) for (const t of j.sms("https://k.test")) {
      n++;
      assert.deepEqual(smsRender.unknownTags(t.body), [], `${j.key} : balises`);
      const est = smsRender.estimateFor(t.body, { first_name: "Prénom", last_name: "Nom" }, { baseUrl: "https://k.test", trackClicks: true });
      assert.equal(est.encoding, "GSM-7", `${j.key} : caractères`);
      assert.equal(est.segments, 1, `${j.key} : un seul SMS`);
    }
    assert.ok(n >= 8);
  });

  test("aucun lien d'exemple, aucune promesse de remise, aucun avantage fictif dans les e-mails", () => {
    for (const j of usable()) for (const e of j.emails("https://k.test")) {
      const text = JSON.stringify(e);
      assert.doesNotMatch(text, /exemple\.(fr|invalid|test|com)|votre-site/, `${j.key} : lien d'exemple`);
      assert.doesNotMatch(text, /-\s?\d+\s?%|\d+\s?%\s+de réduction|code promo|offre limitée|gratuit pendant/i, `${j.key} : promesse non tenue`);
    }
  });

  test("aucune promesse sur le produit que l'on ne peut pas garantir (accompagnement, leçon gratuite pour chaque formation…)", () => {
    for (const j of usable().filter((x) => !library.LEGACY_META[x.key])) {
      const text = JSON.stringify([j.emails("https://k.test"), j.sms ? j.sms("https://k.test") : []]);
      assert.doesNotMatch(text, /accompagnement|leçons? gratuites?|première leçon est gratuite|chaque formation propose/i, `${j.key} : promesse non vérifiée`);
    }
  });

  test("durée et description de chaque étape : aucune étape sans texte, durée cohérente", () => {
    for (const j of usable()) {
      const emails = j.emails("https://k.test"), texts = j.sms ? j.sms("https://k.test") : [];
      for (const s of j.steps) assert.ok(describe_.describeStep(j, s, emails, texts).text.length > 3, `${j.key} : ${s.type}`);
      assert.ok(describe_.durationDays(j.steps) >= 0);
      assert.equal(describe_.flowModel(j, emails, texts).length, j.steps.length);
    }
    const welcome = journeys.byKey("bienvenue-serie-trois-emails");
    assert.equal(describe_.durationDays(welcome.steps), 7);
  });
});

describe("bibliothèque : disponibilité (jamais déclarée, toujours calculée)", () => {
  beforeEach(() => { m = freshMarketing(); A = m.A; });
  const verdicts = (env) => Object.fromEntries(journeys.JOURNEYS.map((j) => [j.key, availability.evaluate(j, env)]));

  test("statuts : prêt, transactionnel, à configurer, suivi nécessaire, non disponible — avec la raison", () => {
    const v = verdicts({ smsReady: true, workerOn: true });
    assert.equal(v["bienvenue-serie-trois-emails"].status, "ready");
    assert.equal(v["bienvenue-creation-compte"].status, "transactional");
    assert.equal(v["bienvenue-apres-formulaire"].status, "config", "liste à choisir");
    assert.equal(v["panier-abandonne-api"].status, "config", "événement à envoyer par le site");
    assert.equal(v["panier-abandonne"].status, "unavailable", "l'ajout au panier est suivi, pas l'abandon : voir le parcours natif");
    assert.equal(v["panier-ajoute-sans-achat-natif"].status, "ready", "événement natif : aucun envoi par le site");
    assert.equal(v["visite-page-site"].status, "unavailable", "la visite est suivie mais aucun parcours prêt n'est écrit");
    assert.equal(v["progression-paliers"].status, "unavailable");
    for (const j of journeys.JOURNEYS.filter((x) => x.unavailable)) {
      assert.equal(v[j.key].usable, false, `${j.key} : jamais utilisable`);
      assert.ok(v[j.key].missing[0], `${j.key} : raison affichée`);
    }
    for (const j of usable()) assert.equal(v[j.key].usable, true, j.key);
  });

  test("les SMS dépendent du fournisseur réellement réglé", () => {
    assert.equal(availability.evaluate(journeys.byKey("sms-remerciement-achat"), availability.environment(A)).status, "config");
    sms.saveSmsConfig(A, { provider: "twilio", sender: "KOLAKISA", accountSid: `AC${"1".repeat(32)}`, authToken: "t" });
    const env = availability.environment(A);
    assert.equal(env.smsReady, true);
    assert.equal(availability.evaluate(journeys.byKey("sms-remerciement-achat"), env).status, "ready");
    assert.equal(availability.evaluate(journeys.byKey("bienvenue-serie-trois-emails"), env).status, "ready", "un parcours e-mail n'en dépend pas");
  });

  test("les dépendances sont listées (déclencheur, modèles, SMS, planificateur)", () => {
    const req = availability.evaluate(journeys.byKey("sms-bienvenue-puis-email"), { smsReady: false, workerOn: false }).requirements;
    assert.ok(req.some((r) => /Déclencheur/.test(r.label) && r.ok === true));
    assert.ok(req.some((r) => /SMS/.test(r.label) && r.ok === false));
    assert.ok(req.some((r) => /Planificateur/.test(r.label) && r.ok === false));
  });

  test("répartition : tout parcours est classé, rien n'est marqué prêt sans validation", () => {
    const v = verdicts({ smsReady: false, workerOn: true });
    const by = {};
    for (const x of Object.values(v)) by[x.status] = (by[x.status] || 0) + 1;
    assert.equal(Object.values(by).reduce((a, b) => a + b, 0), journeys.JOURNEYS.length);
    assert.ok(by.ready >= 30 && by.transactional >= 8 && by.config >= 10 && by.tracking >= 1 && by.unavailable >= 8, JSON.stringify(by));
  });
});

describe("bibliothèque : utilisation, copie et exécution réelle", () => {
  beforeEach(() => {
    m = freshMarketing(); A = m.A;
    templates.setOrgAddress(A, "12 rue des Écoles, Paris");
    provider = createProvider({ provider: "console" }, { log: quiet });
    clock = T0;
    A.now = () => clock; // les conditions (segments) lisent l'horloge du contexte : elle suit le temps simulé
  });
  let clock = T0;
  const runOf = (c, automationId) => (automationId ? m.db.prepare("SELECT * FROM mk_automation_runs WHERE contact_id = ? AND automation_id = ?").get(c.id, automationId) : m.db.prepare("SELECT * FROM mk_automation_runs WHERE contact_id = ? ORDER BY id").get(c.id));
  const consenting = (email) => {
    const { contact } = audience.upsertContact(A, { email, first_name: "Awa" });
    compliance.recordConsent(A, contact.id, { source: "form", textShown: "Oui" });
    return contact;
  };
  const eventFor = (a, c) => {
    const t = a.triggers[0];
    const metadata = { courseId: 3, courseTitle: "Photo", title: "Photo", slug: "photo", courseSlug: "photo", lessonTitle: "Leçon 1", orderId: 1024, orderTotal: "49,00 €", items: [{ courseId: 3, title: "Photo" }] };
    if (t.filter && t.filter.key) metadata[t.filter.key] = t.filter.value;
    return { id: Math.floor(Math.random() * 1e9), organizationId: 1, name: t.event, contactId: c.id, email: c.email, metadata };
  };

  test("« Utiliser » copie le modèle : le modèle de la bibliothèque reste strictement identique", () => {
    const before = JSON.stringify(journeys.JOURNEYS);
    const listId = audience.createList(A, { name: "Formulaire" }).id;
    for (const j of usable()) journeys.createJourney(A, j.key, { listId, courseId: 3 });
    assert.equal(JSON.stringify(journeys.JOURNEYS), before, "aucun modèle modifié");
    assert.ok(Object.isFrozen(journeys.JOURNEYS[0]));
    // Modifier la copie ne touche pas le modèle
    const a = journeys.createJourney(A, "suivi-achat");
    auto.updateAutomation(A, a.id, { name: "Renommé" });
    assert.equal(journeys.byKey("suivi-achat").label, "Suivi après achat");
    assert.equal(JSON.stringify(journeys.JOURNEYS), before);
  });

  test("l'instance est une copie profonde : étapes, délais, conditions et actions identiques au modèle", () => {
    const j = journeys.byKey("client-fidele-trois-achats");
    const a = journeys.createJourney(A, j.key);
    assert.equal(a.steps.length, j.steps.length);
    assert.deepEqual(a.steps.map((s) => s.type), j.steps.map((s) => s.type));
    assert.deepEqual(a.steps.filter((s) => s.type === "wait_for_event").map((s) => [s.amount, s.unit]), j.steps.filter((s) => s.type === "wait_for_event").map((s) => [s.amount, s.unit]));
    assert.deepEqual(a.steps.filter((s) => s.type === "condition").map((s) => s.definition), j.steps.filter((s) => s.type === "condition").map((s) => s.definition));
    assert.equal(a.status, "draft");
    assert.notEqual(a.steps, j.steps);
  });

  test("parcours à liste : liste obligatoire et réelle, posée dans le déclencheur et les actions", () => {
    assert.equal(code(() => journeys.createJourney(A, "bienvenue-apres-formulaire")), "invalid_field", "liste non choisie");
    assert.equal(code(() => journeys.createJourney(A, "bienvenue-apres-formulaire", { listId: 999 })), "not_found", "liste inconnue");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_automations").get().n, 0, "rien créé en cas d'erreur");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_templates").get().n, 0, "aucun modèle orphelin");
    const list = audience.createList(A, { name: "Ma liste" });
    const a = journeys.createJourney(A, "bienvenue-apres-formulaire", { listId: list.id });
    assert.deepEqual(a.triggers[0], { event: "list.member_added", filter: { key: "listId", value: String(list.id) } });
    const clean = journeys.createJourney(A, "nettoyage-liste-inactifs", { listId: list.id });
    assert.ok(clean.steps.some((s) => s.type === "remove_from_list" && s.listId === list.id));
  });

  test("parcours d'une formation précise : formation obligatoire, posée dans le déclencheur ET dans les conditions", () => {
    assert.equal(code(() => journeys.createJourney(A, "inactivite-formation-choisie")), "invalid_field", "formation non choisie");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_automations").get().n, 0, "rien créé en cas d'erreur");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_templates").get().n, 0, "aucun modèle orphelin");
    const a = journeys.createJourney(A, "inactivite-formation-choisie", { courseId: 7 });
    assert.deepEqual(a.triggers[0], { event: "lms.lesson_completed", filter: { key: "courseId", value: "7" } });
    const cond = a.steps.find((s) => s.type === "condition");
    assert.equal(cond.definition.rules[0].course, 7, "la condition ne compte que les leçons de CETTE formation");
    assert.equal(JSON.stringify(journeys.byKey("inactivite-formation-choisie").steps).includes("@formation"), true, "le modèle garde son repère");
    assert.ok(availability.evaluate(journeys.byKey("inactivite-formation-choisie"), { smsReady: true }).missing.some((x) => /formation/i.test(x)));
  });

  test("isolation entre formations : seuls les élèves de la formation choisie entrent ; une leçon d'une autre formation ne compte pas", async () => {
    const act = (key, courseId) => { const a = journeys.createJourney(A, key, { courseId }); auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true }); return a; };
    const rec = (name, c, at, courseId, key) => m.db.prepare("INSERT INTO mk_events (organization_id, name, email, contact_id, source, occurred_at, metadata, idempotency_key, created_at) VALUES (1, ?, ?, ?, 'lms', ?, ?, ?, ?)").run(name, c.email, c.id, at, JSON.stringify({ courseId }), key, at);
    const a = act("inactivite-formation-choisie", 3);
    const ev = (c, courseId, id) => ({ id, organizationId: 1, name: "lms.lesson_completed", contactId: c.id, email: c.email, metadata: { courseId, courseTitle: "Photo", title: "Photo" } });
    const wrong = consenting("autre@ex.fr");
    assert.equal(auto.onEvent(A, ev(wrong, 4, 1)), 0, "leçon d'une autre formation : n'entre pas");
    const right = consenting("bon@ex.fr");
    assert.equal(auto.onEvent(A, ev(right, 3, 2)), 1, "leçon de la formation choisie : entre");
    // Il continue, mais dans une AUTRE formation : cela ne compte pas comme une reprise de la formation choisie
    const B = T0 + 20 * DAY;
    rec("lms.lesson_completed", right, T0, 3, "r1");
    rec("lms.lesson_completed", right, T0 + 10 * DAY, 4, "r2");
    clock = T0;
    const run = m.db.prepare("SELECT id FROM mk_automation_runs WHERE contact_id = ? AND automation_id = ?").get(right.id, a.id);
    await auto.runAutomation(A, run.id, { provider, now: T0 });
    clock = B;
    const sent = provider.sent.length;
    await auto.runAutomation(A, run.id, { provider, now: B });
    assert.equal(provider.sent.length, sent + 1, "rien dans la formation choisie depuis 14 jours : e-mail de reprise, malgré la leçon d'une autre formation");
    assert.match(provider.sent.at(-1).subject, /Reprenez Photo|Reprenez/);
  });

  test("parcours indisponibles : jamais créés (suivi nécessaire ou donnée absente)", () => {
    for (const j of journeys.JOURNEYS.filter((x) => x.unavailable)) assert.equal(code(() => journeys.createJourney(A, j.key)), "invalid_state", j.key);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_automations").get().n, 0);
  });

  test("EXÉCUTION : chaque parcours utilisable se déroule jusqu'au bout sans erreur (délais, conditions, sorties, journal)", async () => {
    const listId = audience.createList(A, { name: "Liste" }).id;
    let n = 0;
    for (const j of usable()) {
      clock += 400 * DAY; // le temps simulé ne revient jamais en arrière (la cadence d'envoi dépend de l'horloge)
      const a = journeys.createJourney(A, j.key, { listId, courseId: 3 });
      auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
      const c = consenting(`${j.key}@ex.fr`);
      assert.ok(auto.onEvent(A, eventFor(a, c)) >= 1, `${j.key} : le contact entre dans le parcours`);
      for (let i = 0; i < 80; i++) {
        const run = runOf(c, a.id);
        if (run.status !== "running") break;
        await auto.runAutomation(A, run.id, { provider, now: clock });
        clock += 370 * DAY;
      }
      const run = runOf(c, a.id);
      assert.ok(["completed", "exited"].includes(run.status), `${j.key} : statut final « ${run.status} » (${run.last_error || ""})`);
      // Une sortie volontaire garde sa raison (« condition », « split »…) ; toute autre valeur est une erreur d'exécution
      assert.ok(["", null, "condition", "split", "next"].includes(run.last_error), `${j.key} : aucune erreur (${run.last_error})`);
      const log = auto.runDetail(A, a.id, run.id);
      assert.ok(log, `${j.key} : journal d'exécution`);
      n++;
    }
    assert.ok(n >= 60);
  });

  test("EXÉCUTION, monde « actif » : le contact a tout fait (achats, leçons, avis…), ouvre et clique — les branches « oui » aussi vont au bout", async () => {
    const listId = audience.createList(A, { name: "Liste" }).id;
    const EVENTS = ["lms.user_registered", "lms.order_completed", "lms.course_enrolled", "lms.lesson_completed", "lms.course_completed", "lms.review_posted", "lms.favorite_added"];
    let paths = 0;
    for (const j of usable()) {
      clock += 400 * DAY;
      const a = journeys.createJourney(A, j.key, { listId, courseId: 3 });
      auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
      const c = consenting(`actif-${j.key}@ex.fr`);
      // l'activité du contact : chaque événement KOLAKISA, deux fois, et un montant dépensé
      EVENTS.forEach((name, i) => [1, 2, 3, 4, 5].forEach((n) => m.db.prepare("INSERT INTO mk_events (organization_id, name, email, contact_id, source, occurred_at, metadata, idempotency_key, created_at) VALUES (1, ?, ?, ?, 'lms', ?, ?, ?, ?)")
        .run(name, c.email, c.id, clock - n * 1000, JSON.stringify({ courseId: 3, items: [{ courseId: 3, title: "Photo", priceCents: 40000 }], totalCents: 40000 }), `${j.key}:${name}:${n}`, clock - n * 1000)));
      assert.ok(auto.onEvent(A, eventFor(a, c)) >= 1, `${j.key} : entrée`);
      for (let i = 0; i < 80; i++) {
        const run = runOf(c, a.id);
        if (run.status !== "running") break;
        await auto.runAutomation(A, run.id, { provider, now: clock });
        m.db.prepare("UPDATE mk_messages SET open_count = 1, click_count = 1 WHERE contact_id = ?").run(c.id); // il ouvre et clique chaque message reçu
        clock += 370 * DAY;
        // l'événement attendu survient (réveil anticipé), comme dans la réalité
        for (const name of EVENTS) auto.onEvent(A, { id: 5e8 + i, organizationId: 1, name, contactId: c.id, email: c.email, metadata: { courseId: 3 } });
      }
      const run = runOf(c, a.id);
      assert.ok(["completed", "exited"].includes(run.status), `${j.key} : statut final « ${run.status} » (${run.last_error || ""})`);
      assert.ok(["", null, "condition", "split", "next"].includes(run.last_error), `${j.key} : aucune erreur (${run.last_error})`);
      paths++;
    }
    assert.ok(paths >= 60);
  });

  test("EXÉCUTION : e-mails, étiquettes et sorties réels sur des cas précis", async () => {
    const step = async (c, now) => { clock = now; return auto.runAutomation(A, runOf(c).id, { provider, now }); };
    const act = (key, opts) => { const a = journeys.createJourney(A, key, opts); auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true }); return a; };

    // Série de 3 e-mails : un e-mail tout de suite, un à J+2, un à J+7
    const s = act("bienvenue-serie-trois-emails");
    const abonne = consenting("serie@ex.fr");
    auto.onEvent(A, eventFor(s, abonne));
    await step(abonne, T0); assert.equal(provider.sent.length, 1);
    await step(abonne, T0 + 2 * DAY); assert.equal(provider.sent.length, 2);
    await step(abonne, T0 + 7 * DAY); assert.equal(provider.sent.length, 3);
    assert.equal(runOf(abonne).status, "completed");

    // Remerciement après deuxième commande : rien à la première, e-mail et étiquette à la seconde
    // (l'horloge simulée ne revient jamais en arrière : chaque scénario part d'une date postérieure au précédent)
    const d = act("deuxieme-achat-remerciement");
    const client = consenting("client@ex.fr");
    const B1 = T0 + 30 * DAY;
    clock = B1;
    const record = (name, c, at, key) => m.db.prepare("INSERT INTO mk_events (organization_id, name, email, contact_id, source, occurred_at, metadata, idempotency_key, created_at) VALUES (1, ?, ?, ?, 'lms', ?, '{}', ?, ?)").run(name, c.email, c.id, at, key, at);
    const order = (n) => ({ id: n, organizationId: 1, name: "lms.order_completed", contactId: client.id, email: client.email, metadata: { orderId: n } });
    record("lms.order_completed", client, B1, "o1");
    auto.onEvent(A, order(1));
    const sentBefore = provider.sent.length;
    await step(client, B1);
    assert.equal(provider.sent.length, sentBefore, "première commande : aucun e-mail");
    record("lms.order_completed", client, B1 + 9 * DAY, "o2");
    clock = B1 + 9 * DAY;
    auto.onEvent(A, order(2)); // réveil anticipé de l'attente
    await step(client, B1 + 9 * DAY);
    assert.equal(provider.sent.length, sentBefore + 1, "deuxième commande : remerciement");
    assert.deepEqual(audience.tagsOf(A, client.id).map((t) => t.name), ["client-récurrent"]);
    assert.equal(d.kind, "marketing");

    // Élève inactif depuis 14 jours : e-mail seulement sans leçon terminée entre-temps
    act("eleve-arrete-14-jours");
    const idle = consenting("idle@ex.fr");
    const B2 = T0 + 90 * DAY;
    clock = B2;
    record("lms.lesson_completed", idle, B2, "l1");
    auto.onEvent(A, { id: 9001, organizationId: 1, name: "lms.lesson_completed", contactId: idle.id, email: idle.email, metadata: { courseTitle: "Photo", title: "Photo" } });
    const sent = provider.sent.length;
    await step(idle, B2);
    await step(idle, B2 + 15 * DAY);
    assert.equal(provider.sent.length, sent + 1, "aucune leçon depuis 14 jours : e-mail de reprise");
    assert.match(provider.sent.at(-1).subject, /Reprenez/);

    // Un élève qui a terminé une autre leçon entre-temps ne reçoit rien
    const busy = consenting("busy@ex.fr");
    const B3 = T0 + 150 * DAY;
    clock = B3;
    record("lms.lesson_completed", busy, B3, "l2");
    auto.onEvent(A, { id: 9003, organizationId: 1, name: "lms.lesson_completed", contactId: busy.id, email: busy.email, metadata: {} });
    const sent3 = provider.sent.length;
    await step(busy, B3);
    record("lms.lesson_completed", busy, B3 + 10 * DAY, "l3");
    await step(busy, B3 + 15 * DAY);
    assert.equal(provider.sent.length, sent3, "leçon terminée dans les 14 jours : rien n'est envoyé");
    assert.equal(runOf(busy).status, "exited");

    // Engagement : sans ouverture, l'abonné est étiqueté « peu-engagé »
    act("scoring-engagement");
    const quiet1 = consenting("peu@ex.fr");
    const B4 = T0 + 210 * DAY;
    clock = B4;
    auto.onEvent(A, { id: 9002, organizationId: 1, name: "contact.subscribed", contactId: quiet1.id, email: quiet1.email, metadata: {} });
    await step(quiet1, B4);
    await step(quiet1, B4 + 5 * DAY);
    assert.deepEqual(audience.tagsOf(A, quiet1.id).map((t) => t.name), ["peu-engagé"], "aucune ouverture : peu engagé");
  });

  test("consentement : un contact non abonné ne reçoit aucun parcours marketing ; le transactionnel part quand même", async () => {
    const act = (key) => { const a = journeys.createJourney(A, key); auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true }); return a; };
    act("bienvenue-serie-trois-emails");
    act("bienvenue-creation-compte");
    const { contact: c } = audience.upsertContact(A, { email: "sans@ex.fr", first_name: "Sans" });
    auto.onEvent(A, { id: 1, organizationId: 1, name: "contact.subscribed", contactId: c.id, email: c.email, metadata: {} });
    auto.onEvent(A, { id: 2, organizationId: 1, name: "lms.user_registered", contactId: c.id, email: c.email, metadata: {} });
    for (const run of m.db.prepare("SELECT id FROM mk_automation_runs WHERE contact_id = ? ORDER BY id").all(c.id)) await auto.runAutomation(A, run.id, { provider, now: T0 });
    assert.equal(provider.sent.length, 1, "seul l'e-mail de service est parti");
    assert.match(provider.sent[0].subject, /Votre compte est prêt/);
  });

  test("cycle de vie d'une instance : activation, pause, reprise, duplication, suppression", () => {
    const a = journeys.createJourney(A, "relance-client-30-60-90");
    auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
    assert.equal(auto.getAutomation(A, a.id).status, "active");
    auto.pauseAutomation(A, a.id);
    assert.equal(auto.getAutomation(A, a.id).status, "paused");
    auto.resumeAutomation(A, a.id);
    assert.equal(auto.getAutomation(A, a.id).status, "active");
    auto.pauseAutomation(A, a.id);
    const copy = auto.duplicateAutomation(A, a.id);
    assert.deepEqual(copy.steps.map((s) => s.type), a.steps.map((s) => s.type));
    auto.deleteAutomation(A, copy.id);
    assert.equal(auto.getAutomation(A, copy.id), null);
  });
});

describe("bibliothèque : favoris, récents, recherche, filtres (service)", () => {
  beforeEach(() => { m = freshMarketing(); A = m.A; });
  const browse = (query = {}, ctx = A) => journeys.browseLibrary(ctx, query, { workerOn: true });
  const keys = (r) => r.entries.map((e) => e.j.key);

  test("l'aperçu et la recherche ne modifient aucune donnée", () => {
    const tables = ["mk_automations", "mk_templates", "mk_journey_usage", "mk_journey_favorites", "mk_audit_logs", "mk_events"];
    const count = () => Object.fromEntries(tables.map((t) => [t, m.db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n]));
    const before = count();
    for (const j of journeys.JOURNEYS) { journeys.summary(j, { smsReady: false }); journeys.detailFor(A, j.key, { workerOn: true }); }
    browse({ q: "panier", statut: "tous" }); browse({ categorie: "sms" }); browse({ vue: "recents" });
    assert.deepEqual(count(), before);
  });

  test("par défaut : seuls les parcours utilisables ; « tous » ajoute ceux qui ne le sont pas, avec leur statut", () => {
    const def = browse();
    assert.ok(def.entries.every((e) => e.verdict.usable));
    assert.equal(def.total, usable().length);
    const all = browse({ statut: "tous" });
    assert.equal(all.total, journeys.JOURNEYS.length);
    assert.ok(all.entries.length <= 24, "chargement progressif");
    assert.equal(browse({ statut: "tracking" }).total, journeys.JOURNEYS.filter((j) => j.blocked === "tracking").length);
    assert.ok(browse({ statut: "unavailable" }).entries.every((e) => !e.verdict.usable));
  });

  test("recherche : nom, description, déclencheur, action, catégorie, canal, audience (accents et pluriels ignorés)", () => {
    const has = (q, key, opts = {}) => assert.ok(keys(browse({ q, statut: "tous", page: 9, ...opts })).includes(key), `« ${q} » doit trouver ${key}`);
    has("panier", "panier-abandonne-api");
    has("paniers", "panier-abandonne-api", {});
    has("etudiant", "bienvenue-eleves", {});
    has("élèves", "bienvenue-eleves");
    has("anniversaire", "anniversaire-inscription");
    has("achat", "suivi-achat");
    has("inactif", "eleve-arrete-14-jours");
    has("SMS", "sms-remerciement-achat");
    has("bienvenue", "sms-bienvenue-puis-email");
    has("formation", "formation-terminee-suite");
    has("etiquette", "client-a-risque", {});               // action « Ajouter l'étiquette »
    has("tirage", "test-ab-bienvenue");                    // étape « tirage au sort »
    has("Une commande est passée", "client-vip-depenses"); // déclencheur
    has("clients", "client-vip-depenses");                 // audience
    has("nurturing", "nurturing-30-jours");
    has("win-back", "client-dormant-six-mois");
    has("panie", "panier-abandonne-api");                  // frappe en cours
    assert.equal(browse({ q: "zzzqxjw" }).total, 0, "aucun résultat inventé");
    assert.ok(browse({ q: "bienvenue" }).entries[0].j.label.toLowerCase().includes("bienvenue"), "le nom pèse plus que la description");
  });

  test("filtres : catégorie, canal, objectif, déclencheur, audience, longueur, statut — combinables", () => {
    assert.ok(browse({ canal: "sms" }).entries.every((e) => e.channel === "sms"));
    assert.ok(browse({ canal: "email_sms" }).total >= 1);
    assert.ok(browse({ canal: "email" }).entries.every((e) => e.channel === "email"));
    assert.ok(browse({ categorie: "commerce" }).entries.every((e) => e.j.group === "commerce"));
    assert.ok(browse({ objectif: "avis" }).entries.every((e) => e.j.goal === "avis"));
    assert.ok(browse({ declencheur: "lms.order_completed" }).entries.every((e) => e.j.trigger.event === "lms.order_completed"));
    assert.ok(browse({ audience: "prospects" }).entries.every((e) => e.j.audience === "prospects"));
    assert.ok(browse({ etapes: "courts" }).entries.every((e) => e.stepCount <= 3));
    assert.ok(browse({ etapes: "longs" }).entries.every((e) => e.stepCount >= 8));
    assert.ok(browse({ statut: "config" }).entries.every((e) => e.verdict.status === "config"));
    const both = browse({ canal: "email", declencheur: "lms.order_completed", audience: "clients" });
    assert.ok(both.entries.every((e) => e.channel === "email" && e.j.trigger.event === "lms.order_completed" && e.j.audience === "clients"));
    assert.deepEqual(browse({ categorie: "inconnue", canal: "x", tri: "n'importe" }).q.categorie, "", "valeurs inconnues ignorées");
  });

  test("tri : nom, nombre d'étapes, durée ; pagination progressive", () => {
    const names = keys(browse({ tri: "nom", page: 5 })).map((k) => journeys.byKey(k).label);
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, "fr")));
    const steps = browse({ tri: "etapes", page: 5 }).entries.map((e) => e.stepCount);
    assert.deepEqual(steps, [...steps].sort((a, b) => a - b));
    const p1 = browse({}), p2 = browse({ page: 2 });
    assert.equal(p1.entries.length, 24);
    assert.ok(p1.hasMore && p2.entries.length > 24 && p2.entries.length <= 48);
    assert.deepEqual(keys(p2).slice(0, 24), keys(p1), "la page suivante prolonge la liste, sans la réordonner");
  });

  test("favoris : personnels, basculables, filtrés par « Mes favoris »", () => {
    assert.equal(store.toggleFavorite(A, "suivi-achat"), true);
    assert.equal(store.toggleFavorite(A, "bienvenue-sms"), true);
    assert.deepEqual(keys(browse({ vue: "favoris" })).sort(), ["bienvenue-sms", "suivi-achat"]);
    assert.equal(browse().counts.favorites, 2);
    const other = { ...A, userId: 8 };
    assert.equal(browse({ vue: "favoris" }, other).total, 0, "les favoris sont personnels");
    assert.equal(store.toggleFavorite(A, "suivi-achat"), false);
    assert.deepEqual(keys(browse({ vue: "favoris" })), ["bienvenue-sms"]);
  });

  test("récemment utilisés et compteur d'utilisation : alimentés par chaque création, dans l'ordre", () => {
    assert.equal(browse({ vue: "recents" }).total, 0);
    journeys.createJourney(A, "suivi-achat");
    journeys.createJourney(A, "relance-favori");
    journeys.createJourney(A, "suivi-achat");
    assert.deepEqual(keys(browse({ vue: "recents" })), ["suivi-achat", "relance-favori"]);
    assert.equal(store.usageCounts(A).get("suivi-achat"), 2);
    assert.equal(journeys.detailFor(A, "suivi-achat").uses, 2);
    assert.equal(keys(browse({ tri: "populaires" }))[0], "suivi-achat");
    assert.equal(browse().recentEntries.length, 2, "bandeau « Récemment utilisés » sur la vue par défaut");
    assert.equal(journeys.detailFor(A, "inconnu"), null);
  });
});

describe("bibliothèque : pages et droits", () => {
  let srv, boss;
  const member = async (role) => {
    const c = await newStudent(srv);
    srv.db().prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)").run(c.email, role);
    return c;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
  });
  after(() => srv.stop());
  const base = "/marketing/automatisations/parcours";
  const rows = () => srv.db();

  test("page : recherche, filtres, onglets, catégories, compteurs, cartes lisibles", async () => {
    const r = await boss.get(base);
    assert.equal(r.status, 200);
    assert.match(r.text, /Rechercher un parcours/);
    for (const label of ["Catégorie", "Canal", "Objectif", "Déclencheur", "Audience", "Statut", "Longueur", "Trier par"]) assert.match(r.text, new RegExp(`>${label}<`));
    assert.match(r.text, /Mes favoris/); assert.match(r.text, /Récemment utilisés/);
    assert.match(r.text, /Afficher plus de parcours/);
    assert.equal((r.text.match(/class="mk-lib-card mk-journey-card/g) || []).length, 24, "24 cartes par page");
    assert.match(r.text, /Prêt à utiliser/);
    assert.match(r.text, /Afficher aussi les \d+ parcours non disponibles/);
    assert.match(r.text, /marketing-journeys\.js/);
  });

  test("recherche et filtres par l'adresse (sans JavaScript) ; valeurs hostiles ignorées", async () => {
    const r = await boss.get(`${base}?q=panier&statut=tous`);
    assert.match(r.text, /Relance après un panier abandonné/);
    assert.match(r.text, /Relance après un ajout au panier/);
    const sms = await boss.get(`${base}?canal=sms`);
    assert.match(sms.text, /SMS de remerciement après un achat/);
    assert.doesNotMatch(sms.text, /Série de bienvenue en 3 e-mails/);
    const none = await boss.get(`${base}?q=zzzqxjw`);
    assert.match(none.text, /Aucun parcours ne correspond/);
    const hostile = await boss.get(`${base}?q=%3Cscript%3Ealert(1)%3C/script%3E&categorie=%27%20OR%201=1&page=-5`);
    assert.equal(hostile.status, 200);
    assert.doesNotMatch(hostile.text, /<script>alert\(1\)/);
    assert.equal((await boss.get(`${base}?page=2`)).status, 200);
  });

  test("aperçu : nom, objectif, déclencheur, étapes, délais, conditions, canaux, audience, règles d'arrêt, dépendances, schéma", async () => {
    const r = await boss.get(`${base}/relance-client-30-60-90`);
    assert.equal(r.status, 200);
    assert.match(r.text, /Relance d&#39;un client après 30, 60 et 90 jours|Relance d'un client après 30, 60 et 90 jours/);
    for (const part of ["Déclencheur", "Audience", "Canal", "Étapes", "Entrée et règles d&#39;arrêt|Entrée et règles d'arrêt", "Dépendances techniques", "Schéma du parcours", "Attendre 30 jour", "Prêt à utiliser", "durée maximale"]) assert.match(r.text, new RegExp(part));
    assert.match(r.text, /Oui/); assert.match(r.text, /Non/); assert.match(r.text, /href="#etape-\d+"/);
    assert.match(r.text, /Fin du parcours/);
    assert.match(r.text, /Utiliser ce parcours/);
    const ab = await boss.get(`${base}/test-ab-bienvenue`);
    assert.match(ab.text, /Tirage au sort/);
    const off = await boss.get(`${base}/progression-paliers`);
    assert.equal(off.status, 200);
    assert.match(off.text, /Pas encore disponible/);
    assert.doesNotMatch(off.text, /action="\/marketing\/automatisations\/parcours\/progression-paliers"/, "aucun bouton");
    const track = await boss.get(`${base}/visite-page-site`);
    assert.match(track.text, /Pas encore disponible/);
    assert.match(track.text, /Un contact visite une page/, "la raison cite le déclencheur qui existe");
    assert.equal((await boss.post(`${base}/progression-paliers`, {})).status, 302);
    assert.equal(rows().prepare("SELECT COUNT(*) n FROM mk_automations").get().n, 0, "POST sur un parcours impossible : rien créé");
  });

  test("aperçu : aucune mutation (ni scénario, ni modèle, ni historique)", async () => {
    const count = () => ({ a: rows().prepare("SELECT COUNT(*) n FROM mk_automations").get().n, t: rows().prepare("SELECT COUNT(*) n FROM mk_templates").get().n, u: rows().prepare("SELECT COUNT(*) n FROM mk_journey_usage").get().n });
    const before = count();
    for (const key of ["suivi-achat", "panier-abandonne-api", "sms-remerciement-achat", "bienvenue-apres-formulaire"]) assert.equal((await boss.get(`${base}/${key}`)).status, 200);
    assert.deepEqual(count(), before);
  });

  test("« Utiliser ce parcours » : brouillon ouvert dans l'éditeur ; modèle intact ; récent et compteur alimentés", async () => {
    const r = await boss.post(`${base}/vente-croisee-apres-achat`, {});
    assert.equal(r.status, 302);
    assert.match(r.location, /^\/marketing\/automatisations\/\d+$/);
    const page = await boss.get(r.location);
    assert.match(page.text, /Parcours créé en brouillon/);
    const a = rows().prepare("SELECT status FROM mk_automations WHERE name = 'Parcours · Vente croisée : compléter son apprentissage'").get();
    assert.equal(a.status, "draft");
    assert.equal(rows().prepare("SELECT COUNT(*) n FROM mk_messages").get().n, 0, "rien d'envoyé");
    const lib = await boss.get(`${base}?vue=recents`);
    assert.match(lib.text, /Vente croisée : compléter son apprentissage/);
    assert.match((await boss.get(`${base}/vente-croisee-apres-achat`)).text, /Utilisé 1 fois/);
  });

  test("parcours à liste : choix de la liste sur l'aperçu, refus sans liste, création avec liste", async () => {
    const page = await boss.get(`${base}/bienvenue-apres-formulaire`);
    assert.match(page.text, /Liste concernée/);
    assert.match(page.text, /À configurer avant l&#39;activation|À configurer avant l'activation/);
    const list = rows().prepare("INSERT INTO mk_lists (organization_id, name) VALUES (1, 'Formulaire contact')").run();
    const bad = await boss.post(`${base}/bienvenue-apres-formulaire`, {});
    assert.equal(bad.status, 302);
    assert.equal(bad.location, `${base}/bienvenue-apres-formulaire`, "retour sur l'aperçu avec le message");
    const ok = await boss.post(`${base}/bienvenue-apres-formulaire`, { liste: String(list.lastInsertRowid) });
    assert.match(ok.location, /^\/marketing\/automatisations\/\d+$/);
    const trig = JSON.parse(rows().prepare("SELECT triggers FROM mk_automations ORDER BY id DESC LIMIT 1").get().triggers);
    assert.equal(trig[0].filter.value, String(list.lastInsertRowid));
  });

  test("parcours d'une formation précise : sélecteur de formation, refus sans formation, création avec formation", async () => {
    const page = await boss.get(`${base}/inactivite-formation-choisie`);
    assert.match(page.text, /Formation concernée/);
    rows().prepare("INSERT INTO courses (instructor_id, title, slug, description, price_cents, level, published) VALUES (1, 'Photo pour débutants', 'photo-debutants', 'd', 1000, 'debutant', 1)").run();
    const courseId = rows().prepare("SELECT id FROM courses WHERE slug = 'photo-debutants'").get().id;
    assert.match((await boss.get(`${base}/inactivite-formation-choisie`)).text, /Photo pour débutants/);
    const bad = await boss.post(`${base}/inactivite-formation-choisie`, {});
    assert.equal(bad.location, `${base}/inactivite-formation-choisie`, "retour sur l'aperçu avec le message");
    const unknown = await boss.post(`${base}/inactivite-formation-choisie`, { formation: "99999" });
    assert.equal(unknown.location, `${base}/inactivite-formation-choisie`, "formation inconnue refusée");
    const ok = await boss.post(`${base}/inactivite-formation-choisie`, { formation: String(courseId) });
    assert.match(ok.location, /^\/marketing\/automatisations\/\d+$/);
    const trig = JSON.parse(rows().prepare("SELECT triggers FROM mk_automations ORDER BY id DESC LIMIT 1").get().triggers);
    assert.equal(trig[0].filter.value, String(courseId));
  });

  test("parcours à événement du site : consigne d'envoi à l'API affichée", async () => {
    const page = await boss.get(`${base}/panier-abandonne-api`);
    assert.match(page.text, /POST \/api\/v1\/events/);
    assert.match(page.text, /panier\.abandonne/);
    assert.match(page.text, /Nécessite une configuration/);
  });

  test("favoris par la page : ajout, retour sur la liste, filtre « Mes favoris »", async () => {
    const r = await boss.post(`${base}/suivi-achat/favori`, { retour: `${base}?canal=email` });
    assert.equal(r.status, 302);
    assert.equal(r.location, `${base}?canal=email`);
    const fav = await boss.get(`${base}?vue=favoris`);
    assert.match(fav.text, /Suivi après achat/);
    assert.match(fav.text, /Retirer des favoris/);
    const evil = await boss.post(`${base}/suivi-achat/favori`, { retour: "https://evil.example/" });
    assert.equal(evil.location, base, "pas de redirection vers un autre site");
    assert.equal((await boss.post(`${base}/inconnu/favori`, {})).status, 404);
    // La requête « evil » a basculé le favori (retiré) : la vue « Mes favoris » est vide, avec un message clair
    assert.match((await boss.get(`${base}?vue=favoris`)).text, /Aucun favori pour le moment/);
  });

  test("droits : un lecteur consulte et met en favori, ne crée rien ; un élève n'a pas accès", async () => {
    const viewer = await member("viewer");
    const page = await viewer.get(base);
    assert.equal(page.status, 200);
    assert.doesNotMatch(page.text, /Utiliser ce parcours<span/);
    assert.doesNotMatch(page.text, /Configurer et utiliser/);
    assert.equal((await viewer.post(`${base}/suivi-achat`, {})).status, 403);
    assert.equal((await viewer.post(`${base}/suivi-achat/favori`, {})).status, 302, "favori = préférence personnelle");
    const student = await newStudent(srv);
    assert.equal((await student.get(base)).status, 403);
    assert.equal((await student.post(`${base}/suivi-achat/favori`, {})).status, 403);
  });
});
