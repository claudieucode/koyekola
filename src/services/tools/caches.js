// Caches du CMS (palier 13) : seuls existent ceux qui existent vraiment (en mémoire, dans ce processus). Chacun peut être inspecté
// (chargé ? combien d'entrées ?) et invalidé séparément ; ils se rechargent seuls à la demande suivante, sans perte de données.
// Aucun « tout vider » aveugle : « tout invalider » demande confirmation, annonce son effet, et se limite à ces caches.
const REGISTRY = [
  { key: "seo-settings", label: "Réglages SEO", detail: "Modèles de titres, organisation, image de partage (lus dans la base).", info: () => require("../../seo/settings").cacheInfo(), reset: () => require("../../seo/settings").resetCache() },
  { key: "redirects", label: "Redirections", detail: "Table des redirections actives appliquées avant chaque page.", info: () => require("../../seo/redirects").cacheInfo(), reset: () => require("../../seo/redirects").invalidate() },
  { key: "domains", label: "Domaines des sites", detail: "Correspondance domaine → site (rafraîchie toutes les 5 s).", info: () => require("../urls").cacheInfo(), reset: () => require("../urls").invalidateSites() },
  { key: "roles", label: "Rôles et permissions", detail: "Définition des rôles de l'équipe.", info: () => require("../cmsAccess").cacheInfo(), reset: () => require("../cmsAccess").invalidate() },
  { key: "comments-settings", label: "Réglages des commentaires", detail: "Modération, limites, ouverture par défaut.", info: () => ({ loaded: true, entries: null }), reset: () => require("../comments").resetCache() },
  { key: "image-probe", label: "Dimensions des images (SEO)", detail: "Existence et taille des images de partage.", info: () => require("../../seo/images").cacheInfo(), reset: () => require("../../seo/images").resetCache() },
  { key: "assets", label: "Versions des fichiers CSS / JS", detail: "Empreinte ajoutée aux adresses des fichiers statiques.", info: () => require("../../utils/assets").cacheInfo(), reset: () => require("../../utils/assets").resetCache() },
];
const byKey = (k) => REGISTRY.find((c) => c.key === k);

function inspect() {
  return REGISTRY.map((c) => { let info; try { info = c.info(); } catch (e) { info = { loaded: false, entries: null, error: true }; } return { key: c.key, label: c.label, detail: c.detail, loaded: Boolean(info.loaded), entries: info.entries, error: Boolean(info.error) }; });
}
function invalidate(key) {
  const c = byKey(key);
  if (!c) throw new Error("Cache inconnu.");
  c.reset();
  return { key, label: c.label };
}
const invalidateAll = () => REGISTRY.map((c) => invalidate(c.key));

module.exports = { REGISTRY, inspect, invalidate, invalidateAll };
