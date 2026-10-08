// Connexions dont une action peut dépendre (fournisseur d'e-mails, fournisseur SMS…). Chaque connexion est vérifiée sur l'ÉTAT RÉEL
// de l'organisation (réglages enregistrés), jamais déclarée : une action qui en dépend est affichée « Connexion requise » tant
// qu'elle manque. Source unique : la disponibilité des parcours (library/availability.js) utilise la même vérification SMS.
const { getSendingConfig } = require("../../sending/config");
const { getSmsConfig } = require("../../sms/config");

// check(ctx) → { ok, detail } ; fix : où la régler dans l'interface
const CAPABILITIES = {
  email_provider: {
    label: "Fournisseur d'e-mails", fix: "Réglages d'envoi",
    check(ctx) {
      const c = getSendingConfig(ctx);
      if (c.provider === "console") return { ok: false, detail: "aucun fournisseur choisi : les e-mails ne partent pas (mode « console »)" };
      if (!c.from) return { ok: false, detail: "adresse d'expédition manquante" };
      return { ok: true, detail: "réglé" };
    },
  },
  sms_provider: {
    label: "Fournisseur SMS", fix: "SMS → Réglages",
    check(ctx) {
      const c = getSmsConfig(ctx);
      if (c.provider === "console") return { ok: false, detail: "aucun fournisseur choisi : les SMS ne partent pas (mode « console »)" };
      if (!c.sender) return { ok: false, detail: "expéditeur manquant" };
      if (!c.accountSid || !c.authTokenSet) return { ok: false, detail: "identifiants du compte manquants" };
      return { ok: true, detail: "réglé" };
    },
  },
};

// Une connexion illisible (réglages absents, base indisponible) compte comme manquante : jamais « réglée » par défaut
function checkCapability(ctx, key) {
  const def = CAPABILITIES[key];
  if (!def) return { key, label: key, ok: false, detail: "connexion inconnue", fix: "" };
  let result;
  try { result = def.check(ctx); } catch { result = { ok: false, detail: "état illisible" }; }
  return { key, label: def.label, ok: Boolean(result.ok), detail: result.detail, fix: def.fix };
}

module.exports = { CAPABILITIES, checkCapability };
