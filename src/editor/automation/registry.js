// Registre central des étapes d'un scénario : LA source de vérité de la palette (libellé, description, catégorie,
// icône, mots-clés), des blocs du canevas (icône, résumé, « Non configuré ») et de la configuration (titre, valeurs
// d'insertion, contrôle). Les types sont ceux du moteur (src/marketing/automations/steps.js) ; libellés partagés avec
// le serveur via utils/stepLabels.js. Ajouter une étape = l'ajouter ici + son éditeur dans stepEditors.js + le moteur.
import { STEP_LABELS } from "../../utils/stepLabels";
import { UNITS, CHECKS, FIELD_LABELS, validate } from "./stepEditors";

export const CATEGORIES = [["trigger", "Déclencheur"], ["communication", "Communication"], ["temps", "Temps"], ["logique", "Logique"], ["contact", "Contact"], ["fin", "Fin"]];

const unitLabel = (u) => (UNITS.find((x) => x[0] === u) || [null, u])[1];
const plural = (n, unit) => (n === 1 && /s$/.test(unit) ? unit.slice(0, -1) : unit); // « 1 jour », « 2 jours »

// make() : valeurs à l'insertion — rien n'est choisi à la place de la personne (pas de « premier modèle » imposé) ;
// seules les étapes qui ont une valeur par défaut évidente et sans risque en ont une (attente d'un jour, tirage 50/50).
export const ACTIONS = {
  trigger: { category: "trigger", icon: "zap", tone: "trigger", description: "Ce qui fait entrer un contact dans le scénario", title: "Configurer le déclencheur" },
  email: { category: "communication", icon: "mail", description: "Un modèle de votre bibliothèque", keywords: "email mail courriel message envoi", title: "Configurer : Envoyer un e-mail", make: (ctx) => ({ templateId: null, trackClicks: ctx.a.kind === "marketing" }) },
  sms: { category: "communication", icon: "smartphone", description: "Aux contacts qui ont accepté les SMS", keywords: "sms texto mobile telephone message", title: "Configurer : Envoyer un SMS", make: () => ({ body: "", trackClicks: true }) },
  wait: { category: "temps", icon: "clock", description: "Une durée fixe avant la suite", keywords: "attente attendre delai pause duree", title: "Configurer : Attendre", make: () => ({ amount: 1, unit: "days" }) },
  wait_for_event: { category: "temps", icon: "calendarClock", description: "Un événement, avec un délai maximal", keywords: "attente attendre evenement delai jusqu", title: "Configurer : Attendre jusqu'à", make: () => ({ event: "", amount: 7, unit: "days" }) },
  condition: { category: "logique", icon: "gitBranch", tone: "branch", description: "Deux chemins : oui / non", keywords: "si segment branche ouvert clic critere", title: "Configurer : Condition", make: () => ({ check: "segment", definition: null, _segmentId: null }) },
  split: { category: "logique", icon: "shuffle", tone: "branch", description: "Deux chemins tirés au sort : A / B", keywords: "test ab aleatoire hasard pourcentage branche tirage", title: "Configurer : Tirage aléatoire", make: () => ({ percentage: 50 }) },
  update_field: { category: "contact", icon: "userPen", description: "Prénom, société, propriété…", keywords: "champ modifier propriete contact mettre a jour", title: "Configurer : Mettre à jour un champ", make: () => ({ field: "", value: "" }) },
  add_tag: { category: "contact", icon: "tagPlus", description: "Étiquette existante ou nouvelle", keywords: "tag etiquette ajouter", title: "Configurer : Ajouter une étiquette", make: () => ({ tag: "" }) },
  remove_tag: { category: "contact", icon: "tagMinus", description: "Retire une étiquette du contact", keywords: "tag etiquette enlever retirer supprimer", title: "Configurer : Retirer une étiquette", make: () => ({ tag: "" }) },
  add_to_list: { category: "contact", icon: "listPlus", description: "Inscrit le contact à une liste", keywords: "liste abonnement ajouter inscrire", title: "Configurer : Ajouter à une liste", make: () => ({ listId: null }) },
  remove_from_list: { category: "contact", icon: "listMinus", description: "Désinscrit le contact d'une liste", keywords: "liste enlever desabonnement retirer", title: "Configurer : Retirer d'une liste", make: () => ({ listId: null }) },
  end: { category: "fin", icon: "stopCircle", tone: "end", description: "Le passage du contact s'arrête", keywords: "fin terminer stop sortie", make: () => ({}) },
};
Object.keys(ACTIONS).forEach((type) => { ACTIONS[type].type = type; ACTIONS[type].label = STEP_LABELS[type] || type; });
// Disponibilité réelle de chaque action (envoyée par le serveur : connexion requise ou non), rattachée à sa définition
export function setAvailability(list) {
  (Array.isArray(list) ? list : []).forEach((a) => { if (a && Object.hasOwn(ACTIONS, a.type) && a.availability) ACTIONS[a.type].availability = a.availability; });
}
export const action = (type) => ACTIONS[type] || { type, label: STEP_LABELS[type] || type, icon: "help", category: "contact", description: "" };
export const insertable = () => Object.values(ACTIONS).filter((x) => x.make);
export const configurable = (type) => type !== "end" && Object.hasOwn(ACTIONS, type);

// Étape réglée ? (mêmes règles que la configuration ; le serveur reste juge à l'enregistrement)
export function isConfigured(type, ctx, d) {
  if (!configurable(type)) return true;
  if (type === "trigger") return validate("trigger", ctx, { name: ctx.a.name, triggers: Array.isArray(d.triggers) && d.triggers.length ? d.triggers : [{ event: d.triggerEvent, filter: d.triggerFilter || {} }] }).length === 0;
  return validate(type, ctx, d).length === 0;
}

// Résumé affiché sur le bloc : toujours tiré des données réellement enregistrées dans le nœud
export function summary(type, ctx, d) {
  const data = ctx.data;
  if (type === "trigger") {
    const list = Array.isArray(d.triggers) && d.triggers.length ? d.triggers : [{ event: d.triggerEvent, filter: d.triggerFilter }];
    const t = data.triggers[list[0].event];
    const base = (t ? t.label : list[0].event || "Déclencheur à choisir") + (list[0].filter && list[0].filter.value ? ` · ${list[0].filter.value}` : "");
    return base + (list.length > 1 ? ` (+ ${list.length - 1} autre${list.length > 2 ? "s" : ""})` : "");
  }
  if (type === "end") return "Fin du passage";
  if (!isConfigured(type, ctx, d)) return "Non configuré";
  switch (type) {
    case "email": { const tpl = data.templates.find((x) => x.id === d.templateId); return tpl ? tpl.name : "Modèle introuvable"; }
    case "sms": { const t = String(d.body).replace(/\s+/g, " "); return t.length > 60 ? `${t.slice(0, 57)}…` : t; }
    case "wait": return `${d.amount} ${plural(d.amount, unitLabel(d.unit))}`;
    case "wait_for_event": return `${d.event} (${d.amount} ${plural(d.amount, unitLabel(d.unit))} au plus)`;
    case "split": return `A ${d.percentage} % · B ${100 - d.percentage} %`;
    case "update_field": {
      const label = d.field.indexOf("property:") === 0 ? `Propriété « ${d.field.slice(9)} »` : FIELD_LABELS[d.field] || d.field;
      return `${label} = ${d.value ? `« ${d.value} »` : "(vide)"}`;
    }
    case "condition": {
      if (d.check === "segment") {
        if (d._segmentId != null) { const seg = data.segments.find((s) => s.id === d._segmentId); return `Segment : ${seg ? seg.name : "—"}`; }
        const n = d.definition.rules.length;
        return `${n} critère${n > 1 ? "s" : ""} (${d.definition.op === "or" ? "OU" : "ET"})`;
      }
      return `Le contact ${(CHECKS.find((c) => c[0] === d.check) || [null, d.check])[1]}`;
    }
    case "add_tag": case "remove_tag": return `« ${d.tag} »`;
    case "add_to_list": case "remove_from_list": { const l = data.lists.find((x) => x.id === d.listId); return l ? l.name : "Liste introuvable"; }
    default: return "";
  }
}
