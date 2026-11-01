// Barre latérale (comme « Sidebar » d'Elementor) : affiche, où vous le placez, les blocs de la zone « Colonne latérale principale » réglée dans Apparence → Widgets du site.
// Rien n'est dupliqué : le contenu vient de la même zone que celle du blog ; sans bloc actif, le widget n'affiche rien (message dans l'éditeur seulement).
module.exports = {
  type: "sidebar", label: "Barre latérale", group: "site", icon: "layout", version: 1, style: "box", status: "operational",
  description: "Affiche les blocs de la colonne latérale réglée dans Apparence → Widgets",
  keywords: "barre laterale sidebar colonne zone widgets apparence blocs",
  schema: [
    { key: "label", kind: "text", label: "Nom de la zone (lu par les lecteurs d'écran)", max: 60, required: true, default: "Barre latérale" },
  ],
  data(ctx, p, env) {
    const siteId = env && env.page && Number.isInteger(env.page.site_id) && env.page.site_id > 0 ? env.page.site_id : null;
    let html = "";
    try { html = require("../../../services/widgets").renderZone(siteId, "sidebar"); } catch { html = ""; }
    return { html };
  },
};
