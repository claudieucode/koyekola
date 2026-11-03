// Mise en place d'un état « ancien système » (en-tête / pied choisis à l'ancienne, exceptions par page, variantes) pour les tests de repli du Theme Builder.
// Les écrans autonomes qui le faisaient (routes /entete/creer, /entete/variante, /entete/pages, /parties) n'existent plus : on appelle directement le service, comme le faisaient ces routes.
const pages = require("../src/marketing/pages");
const STARTER_HEADER = () => ({ type: "layout", children: [{ type: "container", props: { full: true }, styles: { desktop: { display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: "16px", paddingTop: "16px", paddingBottom: "16px", paddingLeft: "24px", paddingRight: "24px" }, mobile: { flexDirection: "column", gap: "8px" } }, children: [{ type: "sitelogo", props: { height: 40 } }, { type: "sitetitle", props: { tag: "p", link: true } }] }] });
function ctxFor(srv, siteId) {
  const db = srv.db(), row = db.prepare("SELECT organization_id FROM mk_sites WHERE id = ?").get(siteId);
  return { db, organizationId: row.organization_id, userId: null, bus: { emit() {}, on() {} }, settings: null, baseUrl: "https://k.test" };
}
// Renvoie { status } comme les anciennes routes (302 = traité, y compris un refus signalé par message)
function legacyPost(srv, path, body = {}) {
  const m = String(path).match(/sites\/(\d+)\/(entete\/creer|entete\/variante|entete\/pages\/(\d+)|parties)$/);
  if (!m) throw new Error(`Action historique inconnue : ${path}`);
  const siteId = Number(m[1]), ctx = ctxFor(srv, siteId), site = pages.getSite(ctx, siteId), num = (v) => (v === "" || v == null ? null : Number(v));
  try {
    if (m[2] === "entete/creer") {
      if (site.header_component_id) throw new Error("Ce site a déjà un en-tête.");
      let name = "En-tête principal", n = 1;
      while (ctx.db.prepare("SELECT 1 FROM mk_web_components WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, name)) { n += 1; name = `En-tête principal ${n}`; }
      const c = pages.createComponent(ctx, { name, section: STARTER_HEADER(), siteId });
      pages.setSiteParts(ctx, siteId, { header: c.id, footer: site.footer_component_id });
    } else if (m[2] === "entete/variante") pages.createHeaderVariant(ctx, siteId, { name: body.name });
    else if (m[3]) {
      const choice = String(body.choice || "inherit"), mode = choice === "none" ? "none" : choice.startsWith("variant:") ? "variant" : "inherit";
      pages.setPageHeader(ctx, Number(m[3]), { mode, componentId: mode === "variant" ? Number(choice.slice(8)) : null });
    } else pages.setSiteParts(ctx, siteId, { header: num(body.header), footer: num(body.footer) });
  } catch { /* comme l'ancienne route : le refus est signalé, rien n'est écrit */ }
  return { status: 302 };
}
module.exports = { legacyPost };
