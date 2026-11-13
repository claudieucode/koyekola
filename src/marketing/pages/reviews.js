// Demande de validation d'une page (table mk_page_reviews, migration 145) : qui ne peut pas publier demande à un éditeur de relire ; publier la page retire la demande.
// L'organisation vient de ctx (jamais d'une saisie) ; une demande est propre à UNE page de CETTE organisation.
const clean = (s) => String(s || "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, 300);
const pageRow = (ctx, pageId) => ctx.db.prepare("SELECT id, status, site_id FROM mk_landing_pages WHERE id = ? AND organization_id = ?").get(Number(pageId), ctx.organizationId);

function request(ctx, pageId, note) {
  const p = pageRow(ctx, pageId);
  if (!p) return { ok: false, error: "Page introuvable." };
  ctx.db.prepare("INSERT INTO mk_page_reviews (page_id, organization_id, requested_by, note) VALUES (?, ?, ?, ?) ON CONFLICT(page_id) DO UPDATE SET requested_by = excluded.requested_by, requested_at = datetime('now'), note = excluded.note")
    .run(p.id, ctx.organizationId, ctx.userId ?? null, clean(note));
  return { ok: true };
}
function clear(ctx, pageId) {
  return ctx.db.prepare("DELETE FROM mk_page_reviews WHERE page_id = ? AND organization_id = ?").run(Number(pageId), ctx.organizationId).changes > 0;
}
const get = (ctx, pageId) => ctx.db.prepare("SELECT r.page_id, r.requested_at, r.note, u.username AS by_name FROM mk_page_reviews r LEFT JOIN users u ON u.id = r.requested_by WHERE r.page_id = ? AND r.organization_id = ?").get(Number(pageId), ctx.organizationId) || null;
// Pages en attente (organisation entière), les plus anciennes d'abord
const pending = (ctx) => ctx.db.prepare("SELECT r.page_id, r.requested_at, r.note, u.username AS by_name FROM mk_page_reviews r LEFT JOIN users u ON u.id = r.requested_by WHERE r.organization_id = ? ORDER BY r.requested_at").all(ctx.organizationId);
module.exports = { request, clear, get, pending };
