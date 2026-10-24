// Contact marketing (fiche, consentements, envois, statistiques) via le moteur existant `audience.deleteContact`, et événements rattachés à l'adresse seule.
// Isolation : une fiche rattachée à PLUSIEURS sites n'est jamais effacée depuis l'un d'eux ; la liste de suppression est conservée (la désinscription doit rester respectée).
const { count, all } = require("./_kit");
const email = (s) => s.email || "";

function contactsOf(env, s) {
  const rows = all(env.db, `SELECT c.id FROM mk_contacts c WHERE c.organization_id = ? AND c.merged_into_id IS NULL AND (c.email = ? OR c.id IN (SELECT contact_id FROM mk_contact_aliases WHERE organization_id = c.organization_id AND email = ?) OR (c.lms_user_id IS NOT NULL AND c.lms_user_id = ?))`, env.organizationId, email(s), email(s), s.userId ?? -1);
  const mine = [], shared = [], elsewhere = [];
  for (const { id } of rows) {
    const links = all(env.db, "SELECT site_id FROM mk_contact_sites WHERE organization_id = ? AND contact_id = ?", env.organizationId, id).map((l) => l.site_id);
    if (env.siteId === null) (links.length ? elsewhere : mine).push(id);
    else if (!links.includes(env.siteId)) continue;
    else (links.every((x) => x === env.siteId) ? mine : shared).push(id);
  }
  return { mine, shared, elsewhere };
}
const eventsWhere = "organization_id = ? AND email = ? AND site_id IS ?";
const retainedOf = (env, s, c) => [
  { label: "Liste de suppression (désinscriptions)", count: count(env.db, "SELECT COUNT(*) n FROM mk_suppressions WHERE organization_id = ? AND email = ?", env.organizationId, email(s)), reason: "Conservée pour ne plus jamais écrire à cette adresse : l'effacer permettrait de la recontacter." },
].filter((x) => x.count > 0);
const manualOf = (c) => [
  c.shared.length ? { label: "Fiche partagée avec d'autres sites", count: c.shared.length, reason: "Elle est rattachée à plusieurs sites : un site ne peut pas l'effacer seul. Effacez-la depuis chacun de ces sites ou depuis le site principal." } : null,
  c.elsewhere.length ? { label: "Fiche rattachée à un ou plusieurs sites", count: c.elsewhere.length, reason: "Cette demande concerne le site principal : la fiche appartient à d'autres sites et se traite depuis eux." } : null,
].filter(Boolean);

module.exports = {
  id: "marketing", order: 50, scope: "any",
  title: "Contact marketing",
  description: "Fiche de contact, consentements, historique d'envois, réponses de formulaires et fichiers envoyés, événements liés à l'adresse.",
  categories: ["Fiche de contact", "Consentements", "Réponses de formulaires", "Événements"],
  preview(env, s) {
    const c = contactsOf(env, s);
    return { erase: c.mine.length, anonymize: count(env.db, `SELECT COUNT(*) n FROM mk_events WHERE ${eventsWhere}`, env.organizationId, email(s), env.siteId), retained: retainedOf(env, s, c), manual: manualOf(c) };
  },
  run(env, s, state, { limit }) {
    const c = contactsOf(env, s);
    let erased = 0;
    if (c.mine.length) {
      const audience = require("../../../marketing/audience");
      for (const id of c.mine.slice(0, limit)) { if (audience.deleteContact({ ...env.ctx, userId: null }, id, { suppress: false })) erased += 1; }
      if (c.mine.length > limit) return { done: false, erased, anonymized: 0 };
    }
    const ev = Number(env.db.prepare(`UPDATE mk_events SET email = NULL, metadata = '{}' WHERE ${eventsWhere}`).run(env.organizationId, email(s), env.siteId).changes) || 0;
    return { done: true, erased, anonymized: ev, outcome: { retained: retainedOf(env, s, c), manual: manualOf(c) } };
  },
};
