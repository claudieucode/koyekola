// Description lisible d'un parcours (aperçu) : texte de chaque étape, durée, et modèle du schéma (nœuds + sorties).
// Lecture seule : tout provient de la définition du parcours, rien n'est écrit ni inventé.
const { TRIGGERS } = require("../catalog");
const { UNITS } = require("../steps");

const UNIT_LABEL = { minutes: "minute(s)", hours: "heure(s)", days: "jour(s)" };
const NOUN = {
  "lms.user_registered": "création de compte", "lms.order_completed": "commande", "lms.course_enrolled": "inscription à une formation",
  "lms.lesson_completed": "leçon terminée", "lms.course_completed": "formation terminée", "lms.review_posted": "avis publié", "lms.favorite_added": "formation mise en favori",
};
const noun = (event) => NOUN[event] || (TRIGGERS[event] ? TRIGGERS[event].label.toLowerCase() : event);
const clean = (text) => String(text || "").replace(/\{\{[^}]*\}\}/g, "…").replace(/\s+/g, " ").trim();
const target = (t, i) => (t === "exit" ? "exit" : t === undefined || t === "next" || t === "continue" ? i + 1 : t);

// « a eu lieu / n'a pas eu lieu » : une règle de segment, en français
function ruleText(rule) {
  const f = String(rule.field);
  if (f.startsWith("event:")) {
    const n = noun(f.slice(6)) + (rule.course !== undefined ? " pour cette formation" : "");
    switch (rule.cmp) {
      case "within_days": return `${n} dans les ${rule.value} derniers jours`;
      case "not_within_days": return `aucune ${n} depuis ${rule.value} jours`;
      case "never": return `jamais de ${n}`;
      case "happened": return `au moins une ${n}`;
      case "at_least": return `au moins ${rule.value} ${n}${rule.value > 1 ? "s" : ""}`;
      default: return `${n} (${rule.cmp})`;
    }
  }
  if (f === "lms_spent") return rule.cmp === "not_empty" ? "a déjà acheté" : rule.cmp === "gte" ? `a dépensé au moins ${rule.value} €` : `montant dépensé ${rule.cmp} ${rule.value} €`;
  if (f === "status") return rule.value === "subscribed" ? "est abonné" : `statut « ${rule.value} »`;
  if (f === "tag") return `${rule.cmp === "has" ? "a" : "n'a pas"} l'étiquette « ${rule.value} »`;
  return `${f} ${rule.cmp}`;
}
const conditionText = (def) => ((def && def.rules) || []).map(ruleText).join(` ${def && def.op === "or" ? "OU" : "ET"} `);

function whenText(s) {
  if (s.check === "clicked") return `A cliqué dans l'e-mail de l'étape ${s.ref + 1} ?`;
  if (s.check === "opened") return `A ouvert l'e-mail de l'étape ${s.ref + 1} ?`;
  const t = conditionText(s.definition);
  return `${t.charAt(0).toUpperCase()}${t.slice(1)} ?`;
}

function describeStep(j, s, emails, texts) {
  switch (s.type) {
    case "email": return { icon: "mail", kind: "email", text: `Envoyer l'e-mail « ${clean(emails[s.email].subject)} »` };
    case "sms": return { icon: "smartphone", kind: "sms", text: `Envoyer le SMS « ${texts[s.sms].name} »` };
    case "wait": return { icon: "clock", kind: "wait", text: `Attendre ${s.amount} ${UNIT_LABEL[s.unit]}` };
    case "wait_for_event": return { icon: "clock", kind: "wait", text: `Attendre « ${(TRIGGERS[s.event] || { label: s.event }).label} » (${s.amount} ${UNIT_LABEL[s.unit]} au plus)` };
    case "condition": return { icon: "gitBranch", kind: "condition", text: whenText(s) };
    case "split": return { icon: "gitBranch", kind: "condition", text: `Tirage au sort : ${s.percentage} % vers le chemin A, ${100 - s.percentage} % vers le chemin B` };
    case "add_tag": return { icon: "tag", kind: "action", text: `Ajouter l'étiquette « ${s.tag} »` };
    case "remove_tag": return { icon: "tag", kind: "action", text: `Retirer l'étiquette « ${s.tag} »` };
    case "add_to_list": return { icon: "list", kind: "action", text: "Ajouter à la liste choisie" };
    case "remove_from_list": return { icon: "list", kind: "action", text: "Retirer de la liste choisie" };
    case "update_field": return { icon: "edit", kind: "action", text: `Mettre à jour le champ « ${s.field} »` };
    case "adjust_score": return { icon: "trendingUp", kind: "action", text: s.mode === "set" ? `Définir le score à ${s.points}` : `${s.mode === "add" ? "Ajouter" : "Retirer"} ${s.points} point${s.points > 1 ? "s" : ""} de score` };
    case "add_note": return { icon: "stickyNote", kind: "action", text: "Ajouter une note sur la fiche du contact" };
    case "end": return { icon: "stopCircle", kind: "end", text: "Fin du parcours" };
    default: return { icon: "zap", kind: "action", text: s.type };
  }
}

// Durée maximale d'un parcours (en jours) : chemin le plus long, attentes additionnées (les sauts sont tous vers l'avant)
function durationDays(steps) {
  const memo = new Map();
  const days = (s) => ((s.type === "wait" || s.type === "wait_for_event") ? (s.amount * UNITS[s.unit]) / 86400000 : 0);
  const best = (i) => {
    if (i >= steps.length) return 0;
    if (memo.has(i)) return memo.get(i);
    const s = steps[i];
    const outs = [];
    if (s.type === "end") { memo.set(i, 0); return 0; }
    if (s.type === "condition") outs.push(target(s.onTrue, i), target(s.onFalse, i));
    else if (s.type === "split") outs.push(target(s.onA, i), target(s.onB, i));
    else outs.push(target(s.next, i));
    const value = days(s) + Math.max(0, ...outs.map((t) => (t === "exit" ? 0 : best(t))));
    memo.set(i, value);
    return value;
  };
  return Math.round(best(0) * 10) / 10;
}

const dayLabel = (d) => (d < 1 ? "moins d'un jour" : d === 1 ? "1 jour" : `${Number.isInteger(d) ? d : Math.ceil(d)} jours`);

// Modèle du schéma : un nœud par étape, avec ses sorties (condition : Oui / Non ; tirage : A / B ; sinon « ensuite »)
function flowModel(j, emails, texts) {
  const steps = j.steps;
  const nodes = steps.map((s, i) => {
    const d = describeStep(j, s, emails, texts);
    const goto = (t) => (t === "exit" || t >= steps.length ? { exit: true, text: "Fin du parcours" } : { n: t + 1, text: describeStep(j, steps[t], emails, texts).text });
    const node = { n: i + 1, type: s.type, kind: d.kind, icon: d.icon, text: d.text, exits: [], jump: null };
    if (s.type === "condition") node.exits = [{ label: "Oui", ...goto(target(s.onTrue, i)) }, { label: "Non", ...goto(target(s.onFalse, i)) }];
    else if (s.type === "split") node.exits = [{ label: "A", ...goto(target(s.onA, i)) }, { label: "B", ...goto(target(s.onB, i)) }];
    else if (s.type !== "end" && s.next !== undefined && target(s.next, i) !== i + 1) node.jump = goto(target(s.next, i));
    return node;
  });
  return nodes;
}

module.exports = { describeStep, conditionText, ruleText, durationDays, dayLabel, flowModel, clean };
