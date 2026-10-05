// Bloc « formation du catalogue » : l'instantané (titre, prix, adresse, image) est PRIS dans le catalogue à l'enregistrement
// puis conservé dans le modèle. La compilation (blocks.js) n'a donc jamais besoin du LMS : un envoi de 100 000 messages n'en
// dépend pas, et un prix modifié plus tard ne change pas un e-mail déjà rédigé (sauf « actualiser » explicite).
const { MarketingError } = require("../errors");
const { getCourse, listPosts } = require("../bridge/catalog");

const fail = (message) => new MarketingError("invalid_template", message);

function snapshotOf(course, base) {
  const image = course.thumbnail_path ? (/^https?:\/\//i.test(course.thumbnail_path) ? course.thumbnail_path : `${base}${course.thumbnail_path.startsWith("/") ? "" : "/"}${course.thumbnail_path}`) : "";
  return { id: course.id, title: course.title, subtitle: course.subtitle || "", priceCents: course.price_cents || 0, url: `${base}/cours/${encodeURIComponent(course.slug)}`, image };
}

// Renvoie les blocs avec l'instantané ajouté ou rafraîchi. N'écrit rien. Un instantané dont l'identifiant ne correspond pas
// à la formation choisie (ou forgé côté client) n'est jamais cru : il est rechargé depuis le catalogue.
function resolveCourseBlocks(ctx, blocks) {
  if (!Array.isArray(blocks)) return blocks;
  return blocks.map((block) => {
    if (!block || typeof block !== "object" || block.type !== "course") return block;
    const keep = block.snapshot && typeof block.snapshot === "object" && block.snapshot.id === block.courseId && block.refresh !== true;
    if (keep) return block;
    const course = getCourse(ctx, block.courseId);
    if (!course) throw fail("Bloc « formation » : choisissez une formation publiée du catalogue (introuvable ou non publiée).");
    const base = String(ctx.baseUrl || "").replace(/\/+$/, "");
    if (!base) throw fail("Bloc « formation » : l'adresse publique du site (SITE_URL) est nécessaire pour construire le lien de la formation.");
    return { ...block, snapshot: snapshotOf(course, base) };
  });
}

// Bloc « Articles » : les derniers articles publiés du blog, pris en instantané à l'enregistrement (comme une formation) ;
// « refresh » les relit. Dans une campagne RSS, l'instantané est remplacé à chaque envoi par les NOUVEAUX articles.
function resolvePostBlocks(ctx, blocks) {
  if (!Array.isArray(blocks)) return blocks;
  return blocks.map((block) => {
    if (!block || typeof block !== "object" || block.type !== "posts") return block;
    if (Array.isArray(block.items) && block.items.length && block.refresh !== true) return block;
    const count = Number.isInteger(block.count) && block.count >= 1 && block.count <= 10 ? block.count : 3;
    const items = listPosts(ctx, { limit: count }).map(({ title, url, excerpt, image, date }) => ({ title, url, excerpt, image, date }));
    const { refresh, ...rest } = block;
    return { ...rest, items };
  });
}
// Bloc « Sondage » : adresse, titre et première question relus dans le sondage à chaque enregistrement (un sondage
// renommé ou une adresse modifiée sont repris) ; un sondage supprimé est signalé.
function resolveSurveyBlocks(ctx, blocks) {
  if (!Array.isArray(blocks)) return blocks;
  return blocks.map((block) => {
    if (!block || typeof block !== "object" || block.type !== "survey") return block;
    const id = Number(block.surveyId);
    const survey = Number.isInteger(id) ? ctx.db.prepare("SELECT id, slug, title, questions FROM mk_surveys WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null;
    if (!survey) throw fail("Bloc « Sondage » : choisissez un sondage existant.");
    const base = String(ctx.baseUrl || "").replace(/\/+$/, "");
    if (!base) throw fail("Bloc « Sondage » : l'adresse publique du site (SITE_URL) est nécessaire pour construire le lien.");
    const q = JSON.parse(survey.questions || "[]")[0];
    const first = q && (q.type === "single" || q.type === "range") ? { type: q.type, text: q.text, ...(q.type === "single" ? { options: q.options.map((o) => o.label) } : { scale: q.scale }) } : null;
    return { ...block, surveyId: id, snapshot: { id, url: `${base}/sondage/${survey.slug}`, title: survey.title, ...(first ? { first } : {}) } };
  });
}
// Les instantanés (formations, articles, sondages), dans l'ordre où le serveur les prépare avant compilation
const resolveSiteBlocks = (ctx, blocks) => resolveSurveyBlocks(ctx, resolvePostBlocks(ctx, resolveCourseBlocks(ctx, blocks)));

module.exports = { resolveCourseBlocks, resolvePostBlocks, resolveSurveyBlocks, resolveSiteBlocks };
