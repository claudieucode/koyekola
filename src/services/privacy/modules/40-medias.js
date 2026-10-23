// Médiathèque : fichiers envoyés (organisation)
module.exports = {
  id: "media", title: "Médias et contenus intégrés", source: "Kolakisa — Médias", order: 40,
  intro: "Les fichiers envoyés et les contenus intégrés (vidéos, cartes…) peuvent contenir des données sur des personnes ou être servis par un tiers.",
  collects: ["Fichiers envoyés et leurs métadonnées", "Adresse IP du visiteur transmise à un service d'hébergement de vidéo ou de carte intégré"],
  verify: ["Si des photos montrent des personnes identifiables et si vous avez leur accord.", "Si des métadonnées (lieu, appareil) sont présentes dans les fichiers publiés.", "Quels contenus intégrés chargent un service externe, et lequel."],
  document: ["Les services tiers qui diffusent des contenus intégrés.", "La procédure pour faire retirer une image."],
  detect(env) {
    const files = env.count("SELECT COUNT(*) AS n FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL", env.organizationId);
    const rows = env.db.prepare("SELECT sections FROM mk_landing_pages WHERE organization_id = ? AND site_id IS ? AND status = 'published' AND archived_at IS NULL LIMIT 500").all(env.organizationId, env.siteId);
    const embeds = (node) => (Array.isArray(node) ? node.reduce((a, x) => a + embeds(x), 0) : node && typeof node === "object" ? (/^(embed|video)$/.test(node.type) ? 1 : 0) + Object.values(node).reduce((a, x) => a + embeds(x), 0) : 0);
    let pagesWith = 0;
    for (const r of rows) { try { if (embeds(JSON.parse(r.sections))) pagesWith++; } catch { /* page illisible : ignorée */ } }
    const facts = [];
    if (files) facts.push(`${files} fichier${files > 1 ? "s" : ""} dans la médiathèque`);
    if (pagesWith) facts.push(`${pagesWith} page${pagesWith > 1 ? "s" : ""} publiée${pagesWith > 1 ? "s" : ""} avec une vidéo ou un contenu intégré`);
    return facts.length ? { status: "detected", facts } : { status: "not_detected", facts: [] };
  },
  link: (env) => ({ label: "Médiathèque", href: env.main ? `${env.BASE}/mediatheque` : `${env.BASE}/sites/${env.siteId}/medias` }),
};
