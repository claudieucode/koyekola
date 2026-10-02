// Paramètres → Apparence : couleur de la barre de menu de gauche (Clair, Bleu foncé, Gris, Noir) ; le contenu reste blanc. Choix PERSONNEL : chaque membre
// de l'équipe a le sien (réglage « ui.theme.u<id> » de l'organisation) ; il ne change rien au site public.
const express = require("express");
const { attempt, need } = require("./kit");
const { MarketingError } = require("../errors");

// swatch : [fond du menu, entrée active, texte du menu, accent] — le contenu reste toujours blanc
const THEMES = [
  { key: "clair", label: "Clair", hint: "Le menu d'origine : blanc, accents bleus.", swatch: ["#ffffff", "#e0f2fe", "#0b2a40", "#0277b6"] },
  { key: "nuit", label: "Bleu foncé", hint: "Menu bleu nuit.", swatch: ["#0b2a40", "#17496c", "#f1f6fa", "#5cbdf5"] },
  { key: "gris", label: "Gris", hint: "Menu gris anthracite.", swatch: ["#2b2e33", "#41464d", "#f2f2f3", "#5cbdf5"] },
  { key: "noir", label: "Noir", hint: "Menu noir profond.", swatch: ["#0d0d0d", "#262626", "#f5f5f5", "#5cbdf5"] },
];
const KEYS = new Set(THEMES.map((t) => t.key));
const settingKey = (userId) => `ui.theme.u${userId}`;

// Thème de l'utilisateur ; « clair » par défaut ou si la valeur enregistrée est inconnue
function themeOf(settings, organizationId, userId) {
  try {
    const value = settings.get(organizationId, settingKey(userId), "clair");
    return KEYS.has(value) ? value : "clair";
  } catch {
    return "clair";
  }
}

function router() {
  const r = express.Router();
  r.get("/apparence", need("contacts.read"), (req, res) => {
    res.render("marketing/appearance", { title: "Apparence", active: "appearance", themes: THEMES, current: res.locals.mkTheme || "clair" });
  });
  r.post("/apparence", need("contacts.read"), (req, res, next) =>
    attempt(req, res, next, "/marketing/apparence", () => {
      const theme = String(req.body.theme ?? "");
      if (!KEYS.has(theme)) throw new MarketingError("invalid_field", "Thème inconnu.");
      const { ctx } = req.mk;
      ctx.settings.set(ctx.organizationId, settingKey(ctx.userId), theme);
      return `Apparence « ${THEMES.find((t) => t.key === theme).label} » appliquée.`;
    }));
  return r;
}

module.exports = { THEMES, themeOf, router };
