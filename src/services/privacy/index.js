// KOLAKISA CMS → Confidentialité : guide de politique extensible.
// Chaque module (formulaires, commentaires, comptes…) DÉCLARE ses recommandations dans un fichier de ./modules : il exporte
// { id, title, source, order, detect(env), intro, collects[], verify[], document[], link(env) }. Ce fichier-ci ne contient aucune règle propre à un module :
// il charge les déclarations, interroge leur détection (faits vérifiables dans la base, jamais supposés) et assemble le guide.
//   detect(env) → { status: "detected" | "not_detected" | "general", facts: ["…"] }   (un échec de détection = « à confirmer », jamais « rien collecté »)
// Aucune fonction ici ne détecte ce que fait un service EXTERNE : cela reste à confirmer par le propriétaire (dit clairement dans l'écran).
const fs = require("node:fs");
const path = require("node:path");

const registry = [];
function register(mod) {
  if (!mod || typeof mod.id !== "string" || !mod.title) throw new Error("Module de confidentialité invalide (id et title obligatoires).");
  if (registry.some((m) => m.id === mod.id)) throw new Error(`Module de confidentialité déjà déclaré : ${mod.id}`);
  registry.push({ order: 100, source: "Kolakisa", intro: "", collects: [], verify: [], document: [], detect: () => ({ status: "general", facts: [] }), link: () => null, ...mod });
}
const dir = path.join(__dirname, "modules");
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".js")).sort()) register(require(path.join(dir, file)));

// Environnement de détection : le site vient du serveur (jamais d'un corps de requête) ; `q` = « ?site= » à reporter dans les liens
function envOf({ db, organizationId, siteId, can }) {
  const q = siteId ? `?site=${siteId}` : "";
  const BASE = "/marketing/site-web";
  return {
    db, organizationId, siteId: siteId ?? null, main: !siteId, can: can || (() => true), q, BASE,
    settings: `${BASE}/parametres`, // + /<groupe>
    count(sql, ...params) { return Number(db.prepare(sql).get(...params).n) || 0; },
  };
}

// Guide complet pour un site : sections dans l'ordre, chacune avec son statut de détection RÉEL
function guide(input) {
  const env = envOf(input);
  return registry.slice().sort((a, b) => a.order - b.order).map((m) => {
    let det;
    try { det = m.detect(env) || { status: "general", facts: [] }; } catch { det = { status: "unknown", facts: [] }; }
    const link = (() => { try { return m.link(env); } catch { return null; } })();
    return {
      id: m.id, title: m.title, source: m.source, intro: m.intro, collects: m.collects, verify: m.verify, document: m.document,
      status: det.status, facts: det.facts || [], link,
    };
  });
}

// Modèle initial de la page : sections Kolakisa (bandeau + textes). AUCUNE valeur inventée : tout ce que le système ne connaît pas est un champ « [À compléter : …] ».
// Les faits détectés ne sont cités que comme points À CONFIRMER, jamais comme engagements.
function template(input) {
  const g = guide(input);
  const detected = g.filter((m) => m.status === "detected" && m.id !== "general");
  const block = (title, lines) => ({ type: "text", markdown: `## ${title}\n\n${lines.join("\n\n")}` });
  const todo = (what) => `[À compléter : ${what}]`;
  const confirm = detected.length
    ? ["Fonctionnalités détectées dans Kolakisa pour ce site — à confirmer et à décrire ci-dessous avant publication :", ...detected.map((m) => `- ${m.title} : ${m.facts.join(" ; ")}`).slice(0, 12)].join("\n")
    : "Aucune fonctionnalité collectant des données n'a été détectée automatiquement dans Kolakisa pour ce site. Cela ne dit rien des services externes : confirmez les pratiques réelles du site.";
  return [
    { type: "hero", title: "Politique de confidentialité", subtitle: `Dernière mise à jour : ${todo("date")}` },
    { type: "text", markdown: "> **Modèle à compléter avant publication.** Supprimez ce message, remplacez chaque « [À compléter] » par les informations réelles du site et vérifiez que le texte reflète vos pratiques et les obligations qui s'appliquent à vous. Ce modèle n'est pas un avis juridique." },
    block("Qui sommes-nous ?", [`Le site est édité par ${todo("nom de l'organisation ou de la personne responsable")}.`, `Adresse : ${todo("adresse postale")}. Contact pour toute question sur vos données : ${todo("adresse e-mail ou formulaire de contact")}.`]),
    block("Quelles informations collectons-nous ?", [confirm, `Catégories de données réellement collectées : ${todo("par exemple identité, coordonnées, messages, données de navigation — à confirmer")}.`]),
    block("Pourquoi les utilisons-nous ?", [`Finalités : ${todo("pour chaque catégorie de données, à quoi elle sert")}.`, `Base juridique, si elle s'applique à vous : ${todo("à confirmer")}.`]),
    block("Formulaires, comptes et messages", [`Décrivez les données demandées dans vos formulaires, comptes ou messages, et ce qu'il en advient : ${todo("à confirmer")}.`]),
    block("Cookies et outils de mesure", [`Cookies et technologies similaires utilisés par le site : ${todo("liste, rôle et durée, à confirmer")}.`, `Outils de mesure d'audience : ${todo("nom des outils réellement utilisés, ou « aucun »")}.`]),
    block("Services externes", [`Prestataires qui reçoivent des données (hébergement, e-mail, paiement, vidéo, cartes, réseaux sociaux…) : ${todo("nom, finalité et pays, à confirmer")}.`]),
    block("Combien de temps conservons-nous vos informations ?", [`Durées de conservation : ${todo("par catégorie de données")}.`]),
    block("Vos droits", [`Droits que vous reconnaissez aux personnes (accès, rectification, effacement, opposition…) selon les règles qui s'appliquent à vous : ${todo("à confirmer")}.`, `Comment les exercer : ${todo("adresse ou procédure")}.`]),
    block("Sécurité", [`Mesures de protection mises en œuvre : ${todo("décrivez uniquement ce que vous appliquez réellement")}.`]),
    block("Contact", [`Pour toute question : ${todo("coordonnées")}.`]),
  ];
}

// Page déjà dédiée à la politique (nom évocateur) — sert à éviter les doublons silencieux et à signaler « un brouillon est disponible »
const NAME_RE = /confidentialit|vie priv|privacy|donn[ée]es personnelles/i;

module.exports = { register, guide, template, envOf, NAME_RE, registry };
