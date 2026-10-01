// Bloc « formation du catalogue » : l'instantané (titre, prix, adresse, image) est PRIS dans le catalogue à l'enregistrement
// puis conservé dans le modèle. La compilation (blocks.js) n'a donc jamais besoin du LMS : un envoi de 100 000 messages n'en
// dépend pas, et un prix modifié plus tard ne change pas un e-mail déjà rédigé (sauf « actualiser » explicite).
const { MarketingError } = require("../errors");
const { getCourse } = require("../bridge/catalog");

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

module.exports = { resolveCourseBlocks };
