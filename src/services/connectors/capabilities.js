// CONTRATS des capacités que les connecteurs exposent aux modules de Kolakisa. Une capacité = un nom stable, des ENTRÉES validées, une SORTIE normalisée (le même résultat quel que soit le fournisseur)
// et des erreurs prévisibles (ConnectorError). Aucune capacité n'est déclarée tant qu'un adaptateur ne l'implémente pas RÉELLEMENT.
const { ConnectorError } = require("./errors");

const bad = (m) => new ConnectorError("bad_request", m);
const text = (v, label, { min = 0, max }) => {
  if (typeof v !== "string") throw bad(`${label} : un texte est attendu.`);
  const t = v.replace(/\u0000/g, "");
  if (t.trim().length < min) throw bad(`${label} : obligatoire.`);
  if (t.length > max) throw bad(`${label} : ${max} caractères au plus.`);
  return t;
};

const CAPABILITIES = Object.freeze({
  "text.generate": {
    label: "Génération de texte", category: "ai",
    description: "Produit un texte à partir d'une consigne (et d'un cadrage facultatif).",
    validateInput(input = {}) {
      const maxTokens = input.maxTokens === undefined ? 1024 : Number(input.maxTokens);
      if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 4096) throw bad("maxTokens : un entier entre 1 et 4096 est attendu.");
      return { prompt: text(input.prompt, "prompt", { min: 1, max: 20000 }), system: input.system === undefined ? "" : text(input.system, "system", { max: 4000 }), maxTokens };
    },
    validateOutput(out) {
      if (!out || typeof out.text !== "string") throw new ConnectorError("invalid_response", "Le fournisseur n'a renvoyé aucun texte.");
      const usage = out.usage && Number.isFinite(out.usage.inputTokens) && Number.isFinite(out.usage.outputTokens) ? { inputTokens: out.usage.inputTokens, outputTokens: out.usage.outputTokens } : null;
      return { text: out.text.slice(0, 100000), model: String(out.model || "").slice(0, 120), usage };
    },
  },
});
module.exports = { CAPABILITIES };
