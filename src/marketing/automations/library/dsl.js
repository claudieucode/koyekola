// Outils d'écriture des parcours de la bibliothèque : e-mails, SMS, conditions et enchaînement des étapes.
// Un parcours est une DONNÉE (aucune logique) : le moteur d'automatisations existant l'exécute tel quel. Ces outils
// évitent seulement les erreurs de numérotation : les sauts sont écrits avec des repères (« @nom »), convertis en
// numéros d'étapes à la définition. La validation réelle reste celle du moteur (steps.js#validateSteps), rejouée par
// les tests sur CHAQUE parcours.
const HELLO = '{{contact.first_name | default:"cher(e) membre"}}';

// ---------- E-mails : titre, texte (« {h} » = salutation personnalisée), bouton ----------
// cta : [libellé, cible] — cible : « catalogue » (adresse du site), « espace » (Mes formations), « formation »
// (page de la formation de l'événement), « accès » (espace de l'élève).
const mail = (name, subject, preheader, title, text, cta, extra = {}) => ({ name, subject, preheader, title, text, cta, ...extra });

function ctaUrl(target, base) {
  switch (target) {
    case "catalogue": return `${base}/catalogue`;
    case "espace": return `${base}/mes-cours`;
    case "formation": return "{{event.course_url}}";
    case "accès": return "{{event.learn_url}}";
    default: return target;
  }
}

function emailBlocks(e, base) {
  const blocks = [{ type: "heading", text: e.title.replace(/\{h\}/g, HELLO), level: 1 }];
  blocks.push({ type: "text", markdown: e.text.replace(/\{h\}/g, HELLO) });
  if (e.cta) blocks.push({ type: "button", label: e.cta[0], url: ctaUrl(e.cta[1], base), align: "left" });
  return blocks;
}

// SMS : seuls {{prenom}} et {{nom}} existent ; texte sans « ê, â, î, ô, û, ç, œ… » (alphabet GSM-7 : 160 caractères par SMS)
const sms = (name, body) => ({ name, body });
const smsBody = (s, base) => s.body.replace(/\{catalogue\}/g, `${base}/catalogue`).replace(/\{espace\}/g, `${base}/mes-cours`);

// ---------- Conditions « segment » (moteur de segments existant) ----------
const rule = (field, cmp, value) => (value === undefined ? { field, cmp } : { field, cmp, value });
const all = (...rules) => ({ op: "and", rules });
const happened = (event, days) => all(rule(`event:${event}`, "within_days", days));
const notWithin = (event, days) => all(rule(`event:${event}`, "not_within_days", days));
const never = (event) => all(rule(`event:${event}`, "never"));
const atLeast = (event, n) => all(rule(`event:${event}`, "at_least", n));
const spentAtLeast = (euros) => all(rule("lms_spent", "gte", euros));
const hasBought = () => all(rule("lms_spent", "not_empty"));
const isSubscribed = () => all(rule("status", "eq", "subscribed"));
// Règles limitées à LA formation choisie à l'utilisation : le repère « @formation » devient son identifiant (journeys.js#instantiate)
const COURSE = "@formation";
const forCourse = (field, cmp, value) => ({ ...rule(field, cmp, value), course: COURSE });
const happenedForCourse = (event, days) => all(forCourse(`event:${event}`, "within_days", days));
const notWithinForCourse = (event, days) => all(forCourse(`event:${event}`, "not_within_days", days));
const neverForCourse = (event) => all(forCourse(`event:${event}`, "never"));
const atLeastForCourse = (event, n) => all(forCourse(`event:${event}`, "at_least", n));

// ---------- Étapes ----------
// yes / no : « @repère », « exit » (sortie du parcours) ou « next » (étape suivante)
const step = {
  email: (i, id) => ({ type: "email", email: i, id }),
  sms: (i, id) => ({ type: "sms", sms: i, id }),
  wait: (amount, unit, id) => ({ type: "wait", amount, unit, id }),
  waitFor: (event, amount, unit, id) => ({ type: "wait_for_event", event, amount, unit, id }),
  seg: (definition, yes, no, id) => ({ type: "condition", check: "segment", definition, onTrue: yes, onFalse: no, id }),
  opened: (ref, yes, no, id) => ({ type: "condition", check: "opened", ref, onTrue: yes, onFalse: no, id }),
  clicked: (ref, yes, no, id) => ({ type: "condition", check: "clicked", ref, onTrue: yes, onFalse: no, id }),
  split: (percentage, a, b, id) => ({ type: "split", percentage, onA: a, onB: b, id }),
  tag: (tag, id) => ({ type: "add_tag", tag, id }),
  untag: (tag, id) => ({ type: "remove_tag", tag, id }),
  removeFromList: (id) => ({ type: "remove_from_list", listId: "@liste", id }), // la liste est choisie à l'utilisation
  end: (id) => ({ type: "end", id }),
};

// Convertit les repères en numéros d'étapes (saut, référence d'e-mail) ; retire les repères.
function flow(nodes) {
  const at = new Map();
  nodes.forEach((n, i) => { if (n.id) { if (at.has(n.id)) throw new Error(`Repère « ${n.id} » défini deux fois.`); at.set(n.id, i); } });
  const target = (v, where) => {
    if (typeof v === "string" && v.startsWith("@")) {
      if (!at.has(v.slice(1))) throw new Error(`Repère inconnu « ${v} » (${where}).`);
      return at.get(v.slice(1));
    }
    return v;
  };
  return nodes.map((n, i) => {
    const out = { ...n };
    delete out.id;
    for (const key of ["onTrue", "onFalse", "onA", "onB", "next", "ref"]) if (out[key] !== undefined) out[key] = target(out[key], `étape ${i + 1}`);
    return out;
  });
}

// Texte de l'étape « retirer de la liste » : l'identifiant de la liste est posé à l'utilisation (voir library/index.js)
const LIST_PLACEHOLDER = "@liste";

module.exports = { HELLO, mail, sms, emailBlocks, smsBody, ctaUrl, rule, all, forCourse, happened, notWithin, never, atLeast, spentAtLeast, hasBought, isSubscribed, COURSE, happenedForCourse, notWithinForCourse, neverForCourse, atLeastForCourse, step, flow, LIST_PLACEHOLDER };
