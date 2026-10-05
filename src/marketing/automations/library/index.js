// Bibliothèque de parcours tout prêts : assemblage des familles, métadonnées de classement (catégories, audiences,
// objectifs, canaux) et normalisation. Les parcours sont des DONNÉES gelées (Object.freeze récursif) : ni l'aperçu, ni
// « Utiliser ce parcours », ni aucune page ne peut modifier un modèle ; une instance en est toujours une copie.
const { emailBlocks, smsBody } = require("./dsl");

const GROUPS = [
  ["welcome", "Bienvenue"],
  ["nurture", "Accompagner les élèves"],
  ["courses", "Formations"],
  ["commerce", "Achats et e-commerce"],
  ["loyalty", "Fidélisation"],
  ["reengage", "Réengagement"],
  ["engagement", "Engagement e-mail"],
  ["leads", "Prospects et nurturing"],
  ["feedback", "Avis et retours"],
  ["dates", "Dates et anniversaires"],
  ["sms", "SMS"],
  ["site", "Comportement sur le site"],
  ["support", "Support"],
];
const AUDIENCES = { contacts: "Tous les contacts", abonnes: "Abonnés", eleves: "Élèves", clients: "Clients", prospects: "Prospects" };
const GOALS = {
  accueillir: "Accueillir", activer: "Activer les élèves", convertir: "Convertir", fideliser: "Fidéliser", retenir: "Retenir",
  reengager: "Réengager", avis: "Recueillir des avis", qualifier: "Qualifier les contacts",
};
const CHANNELS = { email: "E-mail", sms: "SMS", email_sms: "E-mail + SMS" };

const FAMILIES = [require("./welcome"), require("./courses"), require("./commerce"), require("./reengage"), require("./leads"), require("./sms"), require("./site"), require("./unavailable")];

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const v of Object.values(value)) deepFreeze(v); }
  return value;
}

// Définition « données » → parcours utilisable par journeys.js (e-mails et SMS construits à la demande, avec l'adresse du site)
function normalize(def) {
  if (def.unavailable) return deepFreeze({ ...def });
  const mails = def.emails || [];
  const texts = def.sms || [];
  const out = {
    ...def,
    emails: (base) => mails.map((e) => ({ name: e.name, subject: e.subject, preheader: e.preheader, ...(e.kind ? { kind: e.kind } : {}), blocks: emailBlocks(e, base) })),
    ...(texts.length ? { sms: (base) => texts.map((s) => ({ name: s.name, body: smsBody(s, base) })) } : {}),
  };
  return deepFreeze(out);
}

const EXTRA = FAMILIES.flat().map(normalize);
const seen = new Set();
for (const j of EXTRA) {
  if (seen.has(j.key)) throw new Error(`Parcours « ${j.key} » défini deux fois.`);
  seen.add(j.key);
  if (!GROUPS.some(([k]) => k === j.group)) throw new Error(`Parcours « ${j.key} » : catégorie « ${j.group} » inconnue.`);
  if (!AUDIENCES[j.audience]) throw new Error(`Parcours « ${j.key} » : audience « ${j.audience} » inconnue.`);
  if (!GOALS[j.goal]) throw new Error(`Parcours « ${j.key} » : objectif « ${j.goal} » inconnu.`);
}

// Parcours historiques (journeys.js) : mêmes filtres que les nouveaux, sans toucher à leur définition
const LEGACY_META = {
  "bienvenue-abonnes": { audience: "abonnes", goal: "accueillir", keywords: ["newsletter", "abonnement", "bienvenue"] },
  "bienvenue-eleves": { audience: "eleves", goal: "accueillir", keywords: ["compte", "inscription", "nouveaux élèves"] },
  "suivi-achat": { audience: "clients", goal: "activer", keywords: ["achat", "commande", "démarrage", "onboarding pédagogique"] },
  "encourager-demarrage": { audience: "eleves", goal: "activer", keywords: ["inscrit mais n'a pas commencé", "relance", "démarrage", "formation non commencée"] },
  "formation-terminee": { audience: "eleves", goal: "avis", keywords: ["félicitations", "avis", "formation terminée", "certification"] },
  "relance-favori": { audience: "eleves", goal: "convertir", keywords: ["favori", "relance", "intérêt"] },
  "reconquete": { audience: "abonnes", goal: "reengager", keywords: ["inactif", "réengagement", "réactivation", "win-back", "aucun clic"] },
  "bienvenue-sms": { audience: "abonnes", goal: "accueillir", group: "sms", keywords: ["sms", "bienvenue"] },
  "panier-abandonne": { audience: "prospects", goal: "convertir", blocked: "tracking", group: "site", keywords: ["panier", "abandon", "e-commerce"] },
  "anniversaire": { audience: "contacts", goal: "fideliser", blocked: "unavailable", group: "dates", keywords: ["anniversaire", "date de naissance", "date"] },
};

const channelOf = (j) => {
  const steps = j.steps || [];
  const sms = steps.some((s) => s.type === "sms");
  const email = steps.some((s) => s.type === "email");
  return sms && email ? "email_sms" : sms ? "sms" : "email";
};

module.exports = { GROUPS, AUDIENCES, GOALS, CHANNELS, EXTRA, LEGACY_META, channelOf, deepFreeze };
