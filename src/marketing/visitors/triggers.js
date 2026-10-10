// Déclencheurs d'automatisation venant des visites (Site Web, Tunnels — phase 10). Seulement pour un CONTACT CONNU
// dont le navigateur a accepté la mesure d'audience (les visites anonymes ne déclenchent rien : il n'y a personne à qui
// écrire). Une visite donne au plus un événement par page et par visite (clé d'idempotence), et « tunnel terminé » au
// plus une fois par contact et par tunnel.
//  - page.visited        { pageId, pageName, page }
//  - funnel.entered / funnel.step_reached / funnel.step.completed / funnel.completed : voir funnels/events.js (tunnels actifs)
const { emit } = require("../audience/shared");

function emitVisitEvents(ctx, { contactId, sessionId, pageViews }) {
  if (!ctx.bus || !Number.isInteger(contactId) || !Array.isArray(pageViews) || !pageViews.length) return 0;
  const contact = ctx.db.prepare("SELECT id, email FROM mk_contacts WHERE id = ? AND organization_id = ?").get(contactId, ctx.organizationId);
  if (!contact) return 0;
  const pageOf = ctx.db.prepare("SELECT id, name, slug FROM mk_landing_pages WHERE id = ? AND organization_id = ?");
  let n = 0;
  for (const v of pageViews) {
    const page = pageOf.get(v.pageId, ctx.organizationId);
    if (!page) continue;
    emit(ctx, "page.visited", { contact, source: "site", idempotencyKey: `page.visited:${contact.id}:${page.id}:${sessionId}`, metadata: { pageId: String(page.id), pageName: page.name, page: `/p/${page.slug}` } });
    n += 1 + emitStepEvents(ctx, contact, stepsWhere(ctx, "s.page_id = ?", page.id), sessionId);
  }
  return n;
}

// Étapes de tunnels actifs correspondant à une page (ou à une formation) : les événements « funnel.* » sont produits par funnels/events.js (palier 19)
const funnelEvents = require("../funnels/events");
const stepsWhere = funnelEvents.stepsWhere;
const emitStepEvents = (ctx, contact, steps, sessionId) => funnelEvents.emitJourney(ctx, contact, steps, { sessionId });

// E-commerce (phase 11), même règle (contact connu, mesure acceptée) : fiche formation consultée, ajout au panier,
// page de commande ouverte. L'achat lui-même est « lms.order_completed » (pont du LMS, sans dépendre du suivi).
//  - lms.course_viewed     { courseId, title, slug }  une fois par formation et par visite
//  - lms.cart_added        { courseId, title, slug }  une fois par formation et par visite
//  - lms.checkout_started  {}                         une fois par visite
function emitCommerceEvents(ctx, { contactId, sessionId, signals }) {
  if (!ctx.bus || !Number.isInteger(contactId) || !Array.isArray(signals) || !signals.length) return 0;
  const contact = ctx.db.prepare("SELECT id, email FROM mk_contacts WHERE id = ? AND organization_id = ?").get(contactId, ctx.organizationId);
  if (!contact) return 0;
  const { getCourse, getCourseBySlug } = require("../bridge/catalog");
  let n = 0;
  for (const s of signals) {
    if (s.kind === "checkout") {
      emit(ctx, "lms.checkout_started", { contact, source: "site", idempotencyKey: `lms.checkout_started:${contact.id}:${sessionId}`, metadata: {} });
      n += 1;
      continue;
    }
    const course = s.kind === "course" ? getCourseBySlug(ctx, s.key) : s.kind === "cart" ? getCourse(ctx, Number(s.key)) : null;
    if (!course) continue;
    const name = s.kind === "course" ? "lms.course_viewed" : "lms.cart_added";
    emit(ctx, name, { contact, source: "site", idempotencyKey: `${name}:${contact.id}:${course.id}:${sessionId}`, metadata: { courseId: course.id, title: course.title, slug: course.slug } });
    n += 1;
    // La fiche d'une formation est aussi l'étape « Formation » des tunnels qui y mènent
    if (s.kind === "course") n += emitStepEvents(ctx, contact, stepsWhere(ctx, "s.type = 'course' AND s.course_id = ?", course.id), sessionId);
  }
  return n;
}

module.exports = { emitVisitEvents, emitCommerceEvents };
