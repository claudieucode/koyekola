// Déclencheurs d'automatisation venant des visites (Site Web, Tunnels — phase 10). Seulement pour un CONTACT CONNU
// dont le navigateur a accepté la mesure d'audience (les visites anonymes ne déclenchent rien : il n'y a personne à qui
// écrire). Une visite donne au plus un événement par page et par visite (clé d'idempotence), et « tunnel terminé » au
// plus une fois par contact et par tunnel.
//  - page.visited        { pageId, pageName, page }
//  - funnel.step_reached { funnelId, funnelName, stepId, stepName, step } (tunnels actifs)
//  - funnel.completed    { funnelId, funnelName } quand la page est la dernière étape du tunnel
const { emit } = require("../audience/shared");

function emitVisitEvents(ctx, { contactId, sessionId, pageViews }) {
  if (!ctx.bus || !Number.isInteger(contactId) || !Array.isArray(pageViews) || !pageViews.length) return 0;
  const contact = ctx.db.prepare("SELECT id, email FROM mk_contacts WHERE id = ? AND organization_id = ?").get(contactId, ctx.organizationId);
  if (!contact) return 0;
  const pageOf = ctx.db.prepare("SELECT id, name, slug FROM mk_landing_pages WHERE id = ? AND organization_id = ?");
  const stepsOf = ctx.db.prepare(`SELECT s.id, s.name, s.position, f.id AS funnel_id, f.name AS funnel_name,
      (SELECT MAX(x.position) FROM mk_funnel_steps x WHERE x.funnel_id = f.id) AS last_position
    FROM mk_funnel_steps s JOIN mk_funnels f ON f.id = s.funnel_id WHERE s.page_id = ? AND f.status = 'active' AND f.organization_id = ?`);
  let n = 0;
  for (const v of pageViews) {
    const page = pageOf.get(v.pageId, ctx.organizationId);
    if (!page) continue;
    emit(ctx, "page.visited", { contact, source: "site", idempotencyKey: `page.visited:${contact.id}:${page.id}:${sessionId}`, metadata: { pageId: String(page.id), pageName: page.name, page: `/p/${page.slug}` } });
    n += 1;
    for (const s of stepsOf.all(page.id, ctx.organizationId)) {
      emit(ctx, "funnel.step_reached", { contact, source: "site", idempotencyKey: `funnel.step_reached:${contact.id}:${s.id}:${sessionId}`,
        metadata: { funnelId: String(s.funnel_id), funnelName: s.funnel_name, stepId: String(s.id), stepName: s.name, step: s.position } });
      n += 1;
      if (s.position === s.last_position) {
        emit(ctx, "funnel.completed", { contact, source: "site", idempotencyKey: `funnel.completed:${contact.id}:${s.funnel_id}`, metadata: { funnelId: String(s.funnel_id), funnelName: s.funnel_name } });
        n += 1;
      }
    }
  }
  return n;
}

module.exports = { emitVisitEvents };
