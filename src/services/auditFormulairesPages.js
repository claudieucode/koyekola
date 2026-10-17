// Audit LECTURE SEULE des références page × formulaire entre sites (R7 lot 3) : combien de pages référencent un formulaire d'un AUTRE site (le site principal compte comme un site).
// Résultats AGRÉGÉS (nombres) — jamais un nom de page, un titre ni un contenu. Ouvre le fichier en lecture seule, refuse la base vivante de l'application, n'écrit rien.
// Sert à décider du traitement des références historiques AVANT toute correction (aucune page n'est modifiée, supprimée ni republiée par cet outil ni par le lot R7-3).
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const ids = (text) => new Set([...String(text || "").matchAll(/"formId"\s*:\s*"?(\d+)"?(?![0-9])/g)].map((m) => Number(m[1])));

function auditDb(db) {
  const forms = new Map(db.prepare("SELECT id, site_id FROM mk_forms").all().map((f) => [f.id, f.site_id ?? null]));
  const pages = db.prepare("SELECT id, site_id, status, form_id, sections, draft, archived_at FROM mk_landing_pages").all();
  const out = { pages: pages.length, pages_avec_formulaire: 0, references_autre_site: { reglage_page: 0, widget_contenu: 0 }, pages_concernees: 0, pages_concernees_en_ligne: 0, formulaires_inconnus: 0, par_situation: { site_vers_principal: 0, principal_vers_site: 0, site_vers_autre_site: 0 } };
  for (const p of pages) {
    const mine = p.site_id ?? null;
    let bad = false, any = false;
    const kind = (formSite) => (mine !== null && formSite === null ? "site_vers_principal" : mine === null ? "principal_vers_site" : "site_vers_autre_site");
    if (Number.isInteger(p.form_id)) {
      any = true;
      if (!forms.has(p.form_id)) out.formulaires_inconnus += 1;
      else if (forms.get(p.form_id) !== mine) { bad = true; out.references_autre_site.reglage_page += 1; out.par_situation[kind(forms.get(p.form_id))] += 1; }
    }
    for (const id of new Set([...ids(p.sections), ...ids(p.draft)])) {
      any = true;
      if (!forms.has(id)) out.formulaires_inconnus += 1;
      else if (forms.get(id) !== mine) { bad = true; out.references_autre_site.widget_contenu += 1; out.par_situation[kind(forms.get(id))] += 1; }
    }
    if (any) out.pages_avec_formulaire += 1;
    if (bad) { out.pages_concernees += 1; if (p.status === "published" && !p.archived_at) out.pages_concernees_en_ligne += 1; }
  }
  return out;
}

function audit(dbPath, { allowLive = false } = {}) {
  const file = path.resolve(dbPath);
  if (!fs.existsSync(file)) return { status: "refus", reason: "Fichier introuvable." };
  if (!allowLive && path.resolve(require("../config/paths").dbFile) === file) return { status: "refus", reason: "Ceci est la base de l'application : l'audit se fait sur une COPIE." };
  const db = new DatabaseSync(file, { readOnly: true });
  try { return { status: "ok", ...auditDb(db) }; } finally { db.close(); }
}
module.exports = { audit, auditDb };
