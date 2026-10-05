// Parcours tout prêts (équivalent des « Pre-built journeys » / modèles de flux de Mailchimp) : un parcours complet —
// déclencheur, attentes, conditions, étiquettes et e-mails rédigés — créé en un clic, EN BROUILLON, dans l'éditeur
// d'automatisations habituel. Rien n'est envoyé tant qu'il n'est pas relu puis activé (contrôle avant activation inchangé).
// Chaque parcours n'utilise que des événements que KOLAKISA émet réellement (pont LMS, audience) et des étapes du moteur
// existant ; ceux qui demanderaient une donnée que le site n'enregistre pas sont affichés avec la raison, sans bouton.
const { MarketingError } = require("../errors");
const { transaction } = require("../db/tx");
const { audit } = require("../audience/shared");
const templates = require("../templates");
const service = require("./service");
const { TRIGGERS } = require("./catalog");

const HELLO = '{{contact.first_name | default:"cher(e) membre"}}';
const GROUPS = [
  ["welcome", "Accueillir les nouveaux contacts"],
  ["nurture", "Accompagner les élèves"],
  ["reengage", "Réengager"],
  ["commerce", "E-commerce"],
];
// Condition « l'événement est survenu (ou non) dans les N derniers jours » — moteur de segments existant
const happened = (event, days) => ({ op: "and", rules: [{ field: `event:${event}`, cmp: "within_days", value: days }] });
const never = (event) => ({ op: "and", rules: [{ field: `event:${event}`, cmp: "never" }] });

// Les liens vers le site sont des variables d'automatisation (adresse réelle calculée à l'envoi) ou, pour le catalogue,
// l'adresse publique du site connue à la création (SITE_URL) : jamais un lien d'exemple à remplacer.
const catalogUrl = (base) => `${base}/catalogue`;

const JOURNEYS = [
  {
    key: "bienvenue-abonnes", group: "welcome", kind: "marketing",
    label: "Bienvenue aux nouveaux abonnés",
    objective: "Accueillir chaque nouvel abonné et lui faire découvrir vos formations.",
    description: "Un e-mail de bienvenue dès l'abonnement, la découverte des formations deux jours plus tard, puis selon sa réaction : une étiquette « engagé » s'il a cliqué, sinon un dernier e-mail pour l'aider à choisir.",
    trigger: { event: "contact.subscribed" },
    note: "Se déclenche à chaque nouvel abonnement avec consentement (formulaire, case cochée à l'inscription, import avec preuve).",
    emails: (base) => [
      { name: "Bienvenue", subject: "Bienvenue chez {{org.name}}", preheader: "Merci de votre inscription", blocks: [
        { type: "heading", text: `Bienvenue, ${HELLO}`, level: 1 },
        { type: "text", markdown: "Merci de vous être abonné(e). Vous recevrez nos nouvelles formations, nos conseils et nos offres — sans excès, et vous pouvez vous désabonner à tout moment." },
        { type: "button", label: "Découvrir les formations", url: catalogUrl(base), align: "left" },
      ] },
      { name: "Découvrir les formations", subject: "Par où commencer ?", preheader: "Nos formations pour bien démarrer", blocks: [
        { type: "heading", text: "Trouvez la formation qui vous correspond", level: 1 },
        { type: "text", markdown: `Bonjour ${HELLO}, toutes nos formations se suivent à votre rythme, en vidéo, avec des exercices et un certificat à la fin.` },
        { type: "list", style: "checks", items: ["Des leçons courtes, à suivre quand vous voulez", "Un accès à vie à la formation", "Un certificat de réussite"] },
        { type: "button", label: "Voir le catalogue", url: catalogUrl(base), align: "left" },
      ] },
      { name: "Aide au choix", subject: "Besoin d'aide pour choisir ?", preheader: "Répondez simplement à cet e-mail", blocks: [
        { type: "heading", text: "Une question avant de vous lancer ?", level: 1 },
        { type: "text", markdown: `${HELLO}, si vous hésitez entre plusieurs formations, répondez simplement à cet e-mail : nous vous conseillerons.` },
        { type: "button", label: "Parcourir les formations", url: catalogUrl(base), align: "left" },
      ] },
    ],
    steps: [
      { type: "email", email: 0 },                                      // 0
      { type: "wait", amount: 2, unit: "days" },                         // 1
      { type: "email", email: 1 },                                      // 2
      { type: "wait", amount: 3, unit: "days" },                         // 3
      { type: "condition", check: "clicked", ref: 2, onTrue: 5, onFalse: 7 }, // 4
      { type: "add_tag", tag: "engagé" },                               // 5
      { type: "end" },                                                  // 6
      { type: "email", email: 2 },                                      // 7
      { type: "end" },                                                  // 8
    ],
  },
  {
    key: "bienvenue-eleves", group: "welcome", kind: "marketing",
    label: "Bienvenue aux nouveaux élèves",
    objective: "Transformer un nouveau compte en premier élève inscrit.",
    description: "Un e-mail de bienvenue à la création du compte ; trois jours plus tard, s'il ne s'est inscrit à aucune formation, un e-mail l'aide à choisir la première.",
    trigger: { event: "lms.user_registered" },
    note: "Parcours marketing : seuls les comptes qui ont accepté de recevoir des e-mails (case cochée à l'inscription) le reçoivent.",
    emails: (base) => [
      { name: "Bienvenue", subject: "Bienvenue sur {{org.name}}", preheader: "Votre compte est prêt", blocks: [
        { type: "heading", text: `Bienvenue, ${HELLO}`, level: 1 },
        { type: "text", markdown: "Votre compte est prêt. Vous retrouverez toutes vos formations et votre progression dans votre espace." },
        { type: "button", label: "Accéder à mon espace", url: "{{event.learn_url}}", align: "left" },
      ] },
      { name: "Première formation", subject: "Choisissez votre première formation", preheader: "Commencez quand vous voulez", blocks: [
        { type: "heading", text: "Prêt(e) à commencer ?", level: 1 },
        { type: "text", markdown: `${HELLO}, vous n'avez pas encore choisi de formation. Parcourez le catalogue : chaque fiche présente le programme et une leçon gratuite.` },
        { type: "button", label: "Choisir une formation", url: catalogUrl(base), align: "left" },
      ] },
    ],
    steps: [
      { type: "email", email: 0 },
      { type: "wait", amount: 3, unit: "days" },
      { type: "condition", check: "segment", definition: never("lms.course_enrolled"), onTrue: 3, onFalse: "exit" },
      { type: "email", email: 1 },
      { type: "end" },
    ],
  },
  {
    key: "suivi-achat", group: "nurture", kind: "transactional",
    label: "Suivi après achat",
    objective: "Aider chaque acheteur à démarrer réellement sa formation.",
    description: "Un e-mail de remerciement avec l'accès à la formation ; si aucune leçon n'est terminée dans les trois jours, un e-mail propose de l'aide pour démarrer.",
    trigger: { event: "lms.order_completed" },
    note: "Transactionnel (lié à l'achat, sans contenu promotionnel) : envoyé à chaque acheteur. La vérification « leçon terminée » porte sur toutes ses formations.",
    emails: () => [
      { name: "Merci", kind: "transactional", subject: "Merci pour votre achat", preheader: "Votre formation vous attend", blocks: [
        { type: "heading", text: `Merci ${HELLO}`, level: 1 },
        { type: "text", markdown: "Votre commande **n° {{event.order_id}}** (**{{event.order_total}}**) est confirmée. Votre formation est disponible dès maintenant." },
        { type: "button", label: "Commencer ma formation", url: "{{event.learn_url}}", align: "left" },
      ] },
      { name: "Aide au démarrage", kind: "transactional", subject: "Besoin d'aide pour démarrer ?", preheader: "Quelques conseils pour bien commencer", blocks: [
        { type: "heading", text: "Bien démarrer votre formation", level: 1 },
        { type: "text", markdown: `${HELLO}, vous n'avez pas encore terminé de leçon. Commencez par la première : elle ne prend que quelques minutes. Une question ? Répondez à cet e-mail.` },
        { type: "button", label: "Reprendre ma formation", url: "{{event.learn_url}}", align: "left" },
      ] },
    ],
    steps: [
      { type: "email", email: 0 },
      { type: "wait_for_event", event: "lms.lesson_completed", amount: 3, unit: "days" },
      { type: "condition", check: "segment", definition: happened("lms.lesson_completed", 3), onTrue: "exit", onFalse: 3 },
      { type: "email", email: 1 },
      { type: "end" },
    ],
  },
  {
    key: "encourager-demarrage", group: "nurture", kind: "transactional",
    label: "Encourager le démarrage",
    objective: "Relancer les élèves inscrits qui n'ont pas commencé.",
    description: "Après une inscription à une formation (gratuite ou payante), attend la première leçon terminée ; sans activité au bout de 3 jours, un rappel ; puis un second rappel 7 jours plus tard si rien n'a bougé.",
    trigger: { event: "lms.course_enrolled" },
    note: "Une inscription payante déclenche aussi « Suivi après achat » : activez l'un ou l'autre pour éviter deux relances proches.",
    emails: () => [
      { name: "Première leçon", kind: "transactional", subject: "Votre première leçon vous attend", preheader: "{{event.course_title}}", blocks: [
        { type: "heading", text: "On commence ?", level: 1 },
        { type: "text", markdown: `${HELLO}, vous êtes inscrit(e) à **{{event.course_title}}** mais vous n'avez pas encore commencé. La première leçon ne prend que quelques minutes.` },
        { type: "button", label: "Commencer la formation", url: "{{event.course_url}}", align: "left" },
      ] },
      { name: "Reprise", kind: "transactional", subject: "Reprenez votre formation", preheader: "{{event.course_title}}", blocks: [
        { type: "heading", text: "Votre formation vous attend toujours", level: 1 },
        { type: "text", markdown: `${HELLO}, **{{event.course_title}}** est toujours disponible dans votre espace. Un petit pas aujourd'hui suffit pour reprendre le rythme.` },
        { type: "button", label: "Reprendre", url: "{{event.learn_url}}", align: "left" },
      ] },
    ],
    steps: [
      { type: "wait_for_event", event: "lms.lesson_completed", amount: 3, unit: "days" },
      { type: "condition", check: "segment", definition: happened("lms.lesson_completed", 3), onTrue: "exit", onFalse: 2 },
      { type: "email", email: 0 },
      { type: "wait", amount: 7, unit: "days" },
      { type: "condition", check: "segment", definition: happened("lms.lesson_completed", 7), onTrue: "exit", onFalse: 5 },
      { type: "email", email: 1 },
      { type: "end" },
    ],
  },
  {
    key: "formation-terminee", group: "nurture", kind: "transactional",
    label: "Félicitations et avis",
    objective: "Féliciter les élèves qui terminent et recueillir leurs avis.",
    description: "Un e-mail de félicitations dès la formation terminée ; trois jours plus tard, s'il n'a pas encore publié d'avis, une demande d'avis avec le lien direct.",
    trigger: { event: "lms.course_completed" },
    note: "Transactionnel : lié à la formation suivie, sans contenu promotionnel.",
    emails: () => [
      { name: "Félicitations", kind: "transactional", subject: "Félicitations, formation terminée", preheader: "{{event.course_title}}", blocks: [
        { type: "heading", text: `Bravo ${HELLO}`, level: 1, align: "center" },
        { type: "text", markdown: "Vous avez terminé **{{event.course_title}}**. Votre certificat est disponible dans votre espace." },
        { type: "button", label: "Voir mes formations", url: "{{event.learn_url}}", align: "center" },
      ] },
      { name: "Demande d'avis", kind: "transactional", subject: "Votre avis sur {{event.course_title}}", preheader: "Une minute pour aider les futurs élèves", blocks: [
        { type: "heading", text: "Qu'avez-vous pensé de la formation ?", level: 1 },
        { type: "text", markdown: `${HELLO}, votre avis aide les futurs élèves à choisir et nous aide à améliorer **{{event.course_title}}**. Cela prend une minute.` },
        { type: "button", label: "Donner mon avis", url: "{{event.course_url}}", align: "left" },
      ] },
    ],
    steps: [
      { type: "email", email: 0 },
      { type: "wait", amount: 3, unit: "days" },
      { type: "condition", check: "segment", definition: happened("lms.review_posted", 3), onTrue: "exit", onFalse: 3 },
      { type: "email", email: 1 },
      { type: "end" },
    ],
  },
  {
    key: "relance-favori", group: "reengage", kind: "marketing",
    label: "Relance après un favori",
    objective: "Convertir l'intérêt (une formation mise en favori) en achat.",
    description: "Quand un élève met une formation en favori, attend deux jours ; s'il n'a rien acheté entre-temps, un e-mail lui rappelle cette formation avec le lien direct.",
    trigger: { event: "lms.favorite_added" },
    note: "Parcours marketing (abonnés uniquement). La vérification « achat » porte sur tout achat récent, quelle que soit la formation.",
    emails: () => [
      { name: "Formation favorite", subject: "Toujours intéressé(e) par {{event.course_title}} ?", preheader: "Votre formation favorite vous attend", blocks: [
        { type: "heading", text: "Votre formation favorite vous attend", level: 1 },
        { type: "text", markdown: `${HELLO}, vous avez mis **{{event.course_title}}** en favori. Consultez le programme et la leçon gratuite pour vous décider.` },
        { type: "button", label: "Voir la formation", url: "{{event.course_url}}", align: "left" },
      ] },
    ],
    steps: [
      { type: "wait_for_event", event: "lms.order_completed", amount: 2, unit: "days" },
      { type: "condition", check: "segment", definition: happened("lms.order_completed", 2), onTrue: "exit", onFalse: 2 },
      { type: "email", email: 0 },
      { type: "end" },
    ],
  },
  {
    key: "reconquete", group: "reengage", kind: "marketing",
    label: "Reconquérir les contacts inactifs",
    objective: "Réveiller les abonnés qui n'ouvrent plus vos e-mails, puis identifier ceux qui restent inactifs.",
    description: "Démarre quand vous ajoutez l'étiquette « a-relancer » à un contact. Un premier e-mail ; s'il est ouvert, le contact est étiqueté « réactivé ». Sinon un dernier e-mail ; sans ouverture 7 jours plus tard, il est étiqueté « inactif » (à exclure ensuite de vos envois).",
    trigger: { event: "tag.added", filter: { key: "tag", value: "a-relancer" } },
    note: "Pour le lancer : créez un segment (par exemple « dernière ouverture il y a plus de 90 jours ») et ajoutez l'étiquette « a-relancer » à ses contacts. L'étiquette est retirée à la fin du parcours.",
    emails: (base) => [
      { name: "Vous nous manquez", subject: "Vous nous manquez", preheader: "Voici ce que vous avez manqué", blocks: [
        { type: "heading", text: "Cela fait un moment !", level: 1 },
        { type: "text", markdown: `${HELLO}, de nouvelles formations et de nouveaux conseils vous attendent. Jetez un œil à ce qui a changé.` },
        { type: "button", label: "Voir les nouveautés", url: catalogUrl(base), align: "left" },
      ] },
      { name: "Dernier message", subject: "Souhaitez-vous continuer à nous lire ?", preheader: "Sans réponse, nous vous écrirons moins", blocks: [
        { type: "heading", text: "On continue ensemble ?", level: 1 },
        { type: "text", markdown: `${HELLO}, nous ne voulons pas encombrer votre boîte. Si nos e-mails ne vous intéressent plus, vous pouvez vous désabonner en bas de ce message ; sinon, ouvrez simplement nos prochains envois.` },
        { type: "button", label: "Voir les formations", url: catalogUrl(base), align: "left" },
      ] },
    ],
    steps: [
      { type: "email", email: 0 },                                       // 0
      { type: "wait", amount: 5, unit: "days" },                          // 1
      { type: "condition", check: "opened", ref: 0, onTrue: 3, onFalse: 6 }, // 2
      { type: "remove_tag", tag: "a-relancer" },                          // 3
      { type: "add_tag", tag: "réactivé" },                               // 4
      { type: "end" },                                                   // 5
      { type: "email", email: 1 },                                       // 6
      { type: "wait", amount: 7, unit: "days" },                          // 7
      { type: "condition", check: "opened", ref: 6, onTrue: 9, onFalse: 12 }, // 8
      { type: "remove_tag", tag: "a-relancer" },                          // 9
      { type: "add_tag", tag: "réactivé" },                               // 10
      { type: "end" },                                                   // 11
      { type: "remove_tag", tag: "a-relancer" },                          // 12
      { type: "add_tag", tag: "inactif" },                                // 13
      { type: "end" },                                                   // 14
    ],
  },
  // Parcours de Mailchimp qui demandent une donnée que KOLAKISA n'enregistre pas : affichés avec la raison, jamais créés
  {
    key: "panier-abandonne", group: "commerce", label: "Panier abandonné",
    objective: "Relancer les visiteurs qui ont ajouté une formation au panier sans acheter.",
    unavailable: "Le panier de KOLAKISA est gardé dans la session du navigateur, sans être enregistré sur le serveur : aucun événement « ajout au panier » n'existe pour déclencher ce parcours. En attendant, « Relance après un favori » couvre le même besoin à partir des favoris.",
  },
  {
    key: "anniversaire", group: "welcome", label: "Anniversaire",
    objective: "Souhaiter l'anniversaire de vos contacts.",
    unavailable: "Les automatisations de KOLAKISA démarrent sur un événement, pas encore sur une date enregistrée dans la fiche du contact.",
  },
  // SMS seulement (aucun e-mail) : textes sans « ê, ç, œ… » pour rester à 160 caractères par SMS (alphabet GSM-7)
  {
    key: "bienvenue-sms", group: "welcome", label: "Bienvenue aux abonnés SMS", kind: "marketing",
    objective: "Accueillir par SMS les nouveaux abonnés SMS.",
    description: "Démarre quand un contact accepte les SMS (case SMS d'un formulaire, centre de préférences, réponse START). Un SMS de bienvenue tout de suite, puis 3 jours plus tard un SMS vers le catalogue. Seuls les contacts avec un accord SMS prouvé le reçoivent ; la mention « STOP SMS » est ajoutée à chaque message.",
    trigger: { event: "contact.sms_subscribed", filter: {} },
    note: "Pour le remplir : ajoutez une case « accepter les SMS » à un formulaire (Formulaires → votre formulaire). Les SMS respectent les heures de silence et le plafond quotidien des réglages SMS.",
    emails: () => [],
    sms: (base) => [
      { name: "Bienvenue", body: "Bonjour {{prenom|à vous}}, merci d'avoir accepté les SMS de KOLAKISA ! Vous recevrez ici nos nouvelles formations et nos offres." },
      { name: "Catalogue", body: `{{prenom|Bonjour}}, envie d'apprendre quelque chose de nouveau ? Découvrez nos formations : ${catalogUrl(base)}` },
    ],
    steps: [
      { type: "sms", sms: 0 },
      { type: "wait", amount: 3, unit: "days" },
      { type: "sms", sms: 1 },
    ],
  },
];

const byKey = (key) => JOURNEYS.find((j) => j.key === key) || null;
const STEP_COUNT = (j) => (j.steps || []).filter((s) => s.type === "email").length;

// Description lisible d'une étape (aperçu avant création) : uniquement des informations réelles du parcours
function describeStep(j, s, i, emails) {
  const unit = { minutes: "minute(s)", hours: "heure(s)", days: "jour(s)" };
  const target = (t) => (t === "exit" ? "fin du parcours" : t === "next" || t === undefined ? "étape suivante" : `étape ${t + 1}`);
  switch (s.type) {
    case "email": return { icon: "mail", text: `Envoyer l'e-mail « ${emails[s.email].subject.replace(/\{\{[^}]*\}\}/g, "…")} »` };
    case "sms": return { icon: "smartphone", text: `Envoyer le SMS « ${j.sms("https://votre-site")[s.sms].name} »` };
    case "wait": return { icon: "clock", text: `Attendre ${s.amount} ${unit[s.unit]}` };
    case "wait_for_event": return { icon: "clock", text: `Attendre « ${(TRIGGERS[s.event] || { label: s.event }).label} » (${s.amount} ${unit[s.unit]} au plus)` };
    case "condition": {
      const what = s.check === "clicked" ? `A cliqué dans l'e-mail de l'étape ${s.ref + 1} ?` : s.check === "opened" ? `A ouvert l'e-mail de l'étape ${s.ref + 1} ?` : conditionText(s.definition);
      return { icon: "gitBranch", text: `${what} Oui → ${target(s.onTrue)} · Non → ${target(s.onFalse)}` };
    }
    case "add_tag": return { icon: "tag", text: `Ajouter l'étiquette « ${s.tag} »` };
    case "remove_tag": return { icon: "tag", text: `Retirer l'étiquette « ${s.tag} »` };
    case "end": return { icon: "stopCircle", text: "Fin du parcours" };
    default: return { icon: "zap", text: s.type };
  }
}
function conditionText(def) {
  const r = def.rules[0];
  const label = (TRIGGERS[r.field.slice(6)] || { label: r.field }).label.replace(/^Un(e)? /, "").toLowerCase();
  return r.cmp === "never" ? `N'a jamais eu « ${label} » ?` : `« ${label} » dans les ${r.value} derniers jours ?`;
}

// Catalogue pour l'interface : groupes, parcours disponibles (avec aperçu) et indisponibles (avec la raison)
function journeyLibrary() {
  return GROUPS.map(([key, label]) => ({
    key, label,
    items: JOURNEYS.filter((j) => j.group === key).map((j) => summary(j)),
  })).filter((g) => g.items.length);
}
function summary(j) {
  if (j.unavailable) return { key: j.key, label: j.label, objective: j.objective, unavailable: j.unavailable };
  const emails = j.emails("https://votre-site");
  return {
    key: j.key, label: j.label, objective: j.objective, description: j.description, note: j.note, kind: j.kind,
    trigger: { ...j.trigger, label: (TRIGGERS[j.trigger.event] || { label: j.trigger.event }).label },
    emailCount: STEP_COUNT(j), stepCount: j.steps.length,
    steps: j.steps.map((s, i) => ({ n: i + 1, ...describeStep(j, s, i, emails) })),
    emails: emails.map((e) => ({ name: e.name, subject: e.subject, preheader: e.preheader })),
    sms: j.sms ? j.sms("https://votre-site").map((m) => ({ name: m.name, body: m.body })) : [],
  };
}

// Nom libre : « Base », sinon « Base (2) », « Base (3) »… (les noms de modèles et de scénarios sont uniques)
function freeName(ctx, table, base) {
  const taken = (name) => Boolean(ctx.db.prepare(`SELECT 1 FROM ${table} WHERE organization_id = ? AND name = ? COLLATE NOCASE`).get(ctx.organizationId, name));
  if (!taken(base)) return base;
  for (let n = 2; n < 1000; n++) if (!taken(`${base} (${n})`)) return `${base} (${n})`;
  throw new MarketingError("duplicate", "Trop de copies de ce parcours : renommez ou supprimez les anciennes.");
}

// Crée les modèles d'e-mails et le scénario (brouillon), tout ou rien. Renvoie le scénario créé.
function createJourney(ctx, key) {
  const j = byKey(key);
  if (!j) throw new MarketingError("not_found", "Parcours introuvable.");
  if (j.unavailable) throw new MarketingError("invalid_state", `Ce parcours n'est pas disponible : ${j.unavailable}`);
  const base = String(ctx.baseUrl || "").replace(/\/+$/, "") || "https://exemple.invalid";
  return transaction(ctx.db, () => {
    const automationName = freeName(ctx, "mk_automations", `Parcours · ${j.label}`);
    const suffix = automationName.slice(`Parcours · ${j.label}`.length); // « (2) » si le parcours a déjà été créé
    const ids = j.emails(base).map((e, i) => templates.createTemplate(ctx, {
      name: freeName(ctx, "mk_templates", `${j.label}${suffix} — ${i + 1}. ${e.name}`),
      kind: e.kind || j.kind, category: j.kind === "transactional" ? "transactional" : j.group === "welcome" ? "welcome" : j.group === "reengage" ? "reengage" : "general",
      subject: e.subject, preheader: e.preheader, blocks: e.blocks,
    }).id);
    const texts = j.sms ? j.sms(base) : [];
    const steps = j.steps.map((s) => (s.type === "email" ? { type: "email", templateId: ids[s.email] } : s.type === "sms" ? { type: "sms", body: texts[s.sms].body, trackClicks: true } : s));
    const automation = service.createAutomation(ctx, { name: automationName, kind: j.kind, triggers: [j.trigger], steps });
    audit(ctx, "automation.journey_created", "automation", automation.id, { journey: j.key, templates: ids.length });
    return automation;
  });
}

module.exports = { JOURNEYS, GROUPS, journeyLibrary, createJourney, byKey, summary };
