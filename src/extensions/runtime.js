// Moteur d'exécution : garde serveur des pages PUBLIQUES et de l'espace de gestion d'une extension.
// Le site est toujours déduit du DOMAINE résolu côté serveur (req.kwSite), jamais d'un paramètre de la requête. Aucun code d'extension n'est chargé ici : seules les expressions du manifeste sont comparées,
// et seulement quand le chemin appartient à une extension (les autres requêtes ne coûtent rien de plus qu'un test d'expressions).
const registry = require("./registry");
const state = require("./state");

const NOT_FOUND = "Cette page n'existe pas ou n'est plus en ligne.";

// Domaine d'un site : si le chemin relève d'une extension non activée pour CE site → « introuvable » (404). Domaine du site principal : jamais refusé.
function publicGuard(db) {
  return (req, res, next) => {
    const site = req.kwSite;
    if (!site) return next();
    const ext = registry.load().ownerOfPath("public", req.path);
    if (!ext) return next();
    const siteId = Number(site.id);
    let row = null;
    try { row = Number.isInteger(siteId) ? db.prepare("SELECT organization_id FROM mk_sites WHERE id = ? AND deleted_at IS NULL").get(siteId) : null; } catch { row = null; }
    if (row && state.isEnabled(db, row.organization_id, siteId, ext)) return next();
    res.status(404);
    return typeof res.render === "function" ? res.render("error", { message: NOT_FOUND }) : res.end(NOT_FOUND);
  };
}
module.exports = { publicGuard, NOT_FOUND };
