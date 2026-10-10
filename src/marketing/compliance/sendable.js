// Fragment SQL « joignable » : la version EN MASSE de isSendable() (consent.js). Un seul endroit décrit la règle pour les
// segments, l'audience d'une campagne et son aperçu ; un test vérifie qu'elle donne exactement les mêmes contacts que isSendable().
//   fiche active · abonné · adresse absente de la liste de suppression · dernière preuve de consentement = « donné »
//   · (liste ciblée) non désinscrit de cette liste · (catégorie) catégorie non refusée
function sendableSql(alias = "c", { listId, category } = {}) {
  const a = alias;
  const parts = [
    `${a}.record_status = 'active'`,  // fiche archivée, inactive ou fusionnée : jamais de marketing (Contact Core, palier 15)
    `${a}.status = 'subscribed'`,
    `NOT EXISTS (SELECT 1 FROM mk_suppressions s WHERE s.organization_id = ${a}.organization_id AND s.email = ${a}.email)`,
    `(SELECT k.action FROM mk_consents k WHERE k.contact_id = ${a}.id AND k.organization_id = ${a}.organization_id AND k.purpose = 'marketing' ORDER BY k.id DESC LIMIT 1) = 'granted'`,
  ];
  const params = [];
  if (listId !== undefined && listId !== null) {
    parts.push(`NOT EXISTS (SELECT 1 FROM mk_unsubscribes u WHERE u.contact_id = ${a}.id AND u.organization_id = ${a}.organization_id AND u.scope = 'list' AND u.list_id = ?)`);
    params.push(listId);
  }
  if (typeof category === "string" && category !== "") {
    parts.push(`NOT EXISTS (SELECT 1 FROM mk_contact_preferences p JOIN mk_preference_categories g ON g.id = p.category_id WHERE p.contact_id = ${a}.id AND p.organization_id = ${a}.organization_id AND p.subscribed = 0 AND g.key = ?)`);
    params.push(category);
  }
  return { sql: parts.join(" AND "), params };
}

module.exports = { sendableSql };
