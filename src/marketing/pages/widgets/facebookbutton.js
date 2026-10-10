// Bouton Facebook « J'aime » / « Recommander » : module officiel de Facebook affiché dans un cadre (aucune clé, aucun script de notre côté).
// L'adresse ciblée est reconstruite et encodée à l'affichage ; elle doit être une adresse https complète (page, article, site).
module.exports = {
  type: "facebookbutton", label: "Bouton Facebook", group: "social", icon: "share2", version: 1, style: "box", status: "operational",
  description: "Bouton « J'aime » ou « Recommander » (module officiel Facebook)",
  keywords: "facebook bouton j'aime like recommander partager social",
  dependencies: ["Le visiteur doit pouvoir charger www.facebook.com (le module est servi par Facebook)"],
  schema: [
    { key: "url", kind: "text", label: "Adresse à aimer (https://…)", max: 500, required: true, default: "https://www.facebook.com/" },
    { key: "action", kind: "select", label: "Action", options: [["like", "J'aime"], ["recommend", "Recommander"]], default: "like" },
    { key: "layout", kind: "select", label: "Présentation", options: [["button_count", "Bouton avec compteur"], ["button", "Bouton seul"], ["box_count", "Compteur au-dessus"], ["standard", "Standard (avec visages)"]], default: "button_count" },
    { key: "size", kind: "select", label: "Taille", options: [["small", "Petite"], ["large", "Grande"]], default: "large" },
    { key: "share", kind: "bool", label: "Ajouter un bouton « Partager »", default: false },
    { key: "align", kind: "select", label: "Alignement", options: [["left", "À gauche"], ["center", "Centré"], ["right", "À droite"]], default: "left" },
  ],
  validate(p, at) {
    let u; try { u = new URL(p.url); } catch { u = null; }
    if (!u || u.protocol !== "https:" || !u.hostname.includes(".") || /[\s"'<>]/.test(p.url)) throw new Error(`${at} : adresse https:// complète attendue (ex. https://www.facebook.com/kolakisa).`);
  },
  data(ctx, p) {
    const h = { standard: 80, button_count: 28, box_count: 65, button: 28 }[p.layout] || 28;
    const w = { standard: 450, button_count: 150, box_count: 100, button: 100 }[p.layout] || 150;
    const q = `href=${encodeURIComponent(p.url)}&layout=${p.layout}&action=${p.action}&size=${p.size}&share=${p.share ? "true" : "false"}&show_faces=false&width=${w}&height=${h + (p.size === "large" ? 12 : 0)}`;
    return { src: `https://www.facebook.com/plugins/like.php?${q}`, width: p.share ? w + 80 : w, height: h + (p.size === "large" ? 12 : 0) };
  },
};
