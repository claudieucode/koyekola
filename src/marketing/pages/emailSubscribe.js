// Widget « Abonnement par e-mail » (pied de page) : il N'A PAS de logique d'inscription propre. Il réutilise un formulaire d'inscription RÉEL de l'espace Audience
// (mêmes champs de protection, même case de consentement, même enregistrement : route POST /p/<page>/inscription) et n'affiche que le champ e-mail + le bouton.
// Ce module choisit le formulaire : celui du réglage (formId), sinon le plus récent formulaire PUBLIÉ DU MÊME SITE dont rien d'autre que l'e-mail n'est obligatoire.
const forms = require("../forms");

// Un formulaire est « e-mail seul » si aucun autre champ, propriété ou fichier n'est obligatoire (sinon l'envoi serait refusé par le serveur)
function emailOnly(f) {
  const settings = f.fieldSettings || {};
  if (Object.values(settings).some((x) => x && x.required)) return false;
  if (f.fileField && f.fileField.enabled && f.fileField.required) return false;
  return true;
}
// ctx : { db, organizationId } ; page : la page affichée ({ site_id }) ; props : réglages du widget ({ formId })
function formFor(ctx, page, props) {
  const siteId = page && page.site_id ? page.site_id : null;
  let found = null;
  try {
    const id = Number(props && props.formId) || 0;
    if (id) found = forms.getForm(ctx, id);
    else {
      const rows = ctx.db.prepare("SELECT id FROM mk_forms WHERE organization_id = ? AND site_id IS ? AND status = 'published' ORDER BY id DESC LIMIT 25").all(ctx.organizationId, siteId);
      for (const r of rows) { const f = forms.getForm(ctx, r.id); if (emailOnly(f)) { found = f; break; } }
    }
  } catch { found = null; }
  // Jamais le formulaire d'un autre site, jamais un brouillon
  if (!found || found.status !== "published" || (found.siteId ?? null) !== siteId) return null;
  return found;
}
module.exports = { formFor, emailOnly };
