// Contenu Facebook intégré (comme « Facebook Embed » et « Facebook Page » d'Elementor) : une publication, une vidéo ou le fil d'une page, affiché dans un cadre
// officiel de Facebook (aucune clé, aucun script de notre côté). L'adresse doit être une adresse https de facebook.com ; le cadre est reconstruit et encodé ici.
const HOST = /^(?:www\.|m\.|web\.)?facebook\.com$|^fb\.watch$/i;
const KINDS = { post: "Publication", video: "Vidéo", page: "Page (fil d'actualité)" };
module.exports = {
  type: "facebookembed", label: "Contenu Facebook", group: "social", icon: "share2", version: 1, style: "box", status: "operational",
  description: "Une publication, une vidéo ou le fil d'une page Facebook",
  keywords: "facebook publication post video page fil actualite embed integrer reseau social",
  dependencies: ["Le visiteur doit pouvoir charger www.facebook.com (le cadre est servi par Facebook) ; en Europe, il peut demander d'accepter les cookies"],
  schema: [
    { key: "kind", kind: "select", label: "Type de contenu", options: Object.entries(KINDS), default: "page" },
    { key: "url", kind: "text", label: "Adresse Facebook (https://www.facebook.com/…)", max: 500, required: true, default: "https://www.facebook.com/facebook" },
    { key: "title", kind: "text", label: "Titre du cadre (lu par les lecteurs d'écran)", max: 100, required: true, default: "Contenu Facebook" },
    { key: "tabs", kind: "select", label: "Page : afficher", options: [["timeline", "Publications"], ["events", "Événements"], ["messages", "Messages"]], default: "timeline" },
    { key: "height", kind: "number", label: "Hauteur du cadre (px)", min: 200, max: 1000, integer: true, default: 500 },
    { key: "showText", kind: "bool", label: "Publication / vidéo : afficher le texte", default: true },
    { key: "smallHeader", kind: "bool", label: "Page : en-tête réduit", default: false },
    { key: "cover", kind: "bool", label: "Page : afficher l'image de couverture", default: true },
  ],
  validate(p, at) {
    let u; try { u = new URL(p.url); } catch { u = null; }
    if (!u || u.protocol !== "https:" || !HOST.test(u.hostname) || /[\s"'<>`\\]/.test(p.url)) throw new Error(`${at} : adresse https:// de facebook.com attendue (ex. https://www.facebook.com/votrepage).`);
  },
  data(ctx, p) {
    const E = encodeURIComponent, base = "https://www.facebook.com/plugins/";
    const src = p.kind === "page" ? `${base}page.php?href=${E(p.url)}&tabs=${p.tabs}&width=500&height=${p.height}&small_header=${p.smallHeader}&adapt_container_width=true&hide_cover=${!p.cover}&show_facepile=false`
      : p.kind === "video" ? `${base}video.php?href=${E(p.url)}&show_text=${p.showText}&width=500`
      : `${base}post.php?href=${E(p.url)}&show_text=${p.showText}&width=500`;
    return { src, height: p.kind === "page" ? p.height : Math.min(p.height, 700) };
  },
};
