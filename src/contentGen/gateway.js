// Passerelle vers l'IA. Un « appel » = fonction (ctx, tâche, { prompt, schema, system, siteId, effort }) → données JSON. Deux branchements, JAMAIS de client fournisseur ici :
//  - legacy (défaut en production aujourd'hui) : `ai.call` — module « ia » du site, plafond quotidien d'organisation, clé du connecteur, journal sans texte ;
//  - viaCore : Kolakisa AI Core (src/ai) — routage, quotas par site/module, coût estimé. Le Core n'est pas encore branché en production (cf. docs 21.2) : ce branchement est prêt et testé, activé par l'appelant.
// Les tâches sont DISTINCTES (content.page, content.revise, content.translate, content.seo) pour permettre un modèle adapté à chacune dans le routage du Core.
const TASKS = Object.freeze(["page", "revise", "translate", "seo"]);
function legacy() {
  const ai = require("../marketing/ai");
  return (ctx, task, o) => ai.call(ctx, `content_${task}`, o);
}
function viaCore(core, actorOf) {
  return async (ctx, task, { prompt, schema, system, siteId }) => {
    const res = await core.execute(actorOf(ctx), { module: "content", task: `content.${task}`, siteId: Number.isInteger(siteId) ? siteId : null, system, messages: [{ role: "user", content: prompt }], responseFormat: { type: "json", schema }, maxOutputTokens: 8000 });
    if (!res || !res.data || typeof res.data !== "object") { const e = new Error("Réponse de l'IA illisible."); e.code = "format"; throw e; }
    return res.data;
  };
}
module.exports = { TASKS, legacy, viaCore };
