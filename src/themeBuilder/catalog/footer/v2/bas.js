// BAS DE PAGE VARIÉ des pieds v2. Remarque du propriétaire : « le bas est répété et identique pour chaque pied ».
// Deux zones, toutes deux présentées autrement d'un modèle à l'autre (combinaison UNIQUE par modèle, 8 × 6 × 8 = 384 ≥ 265 modèles) :
//  1. la LIGNE DU MODÈLE (© et mentions légales : rangée « copyright + bizlegal » et le filet qui la précède) : 8 mises en page (S) × 6 filets (R) ;
//  2. la BARRE DE LA PLATEFORME (« nom · Cookies · Confidentialité », ajoutée sous le pied) : 8 présentations (P), pilotées par des jetons --ft-legal-* sur la racine du pied (CSS : landing.css).
// Le plan d'un modèle dépend UNIQUEMENT de son numéro (ft2-NNN) : stable, sans état. Un modèle peut le fixer lui-même avec `bas: { s, r, p }` (indices).
const NB_S = 8, NB_R = 8, NB_P = 9, TOTAL = NB_S * NB_R * NB_P;

const numeroDe = (id) => Number((/^ft2-(\d+)/.exec(String(id)) || [])[1]) || 0;
// 97 est premier avec 576 : n ↦ n·97 mod 384 est injective sur 0..383, donc deux modèles (numéros différents < 512) n'ont jamais le même plan
function planDe(id, force) {
  const c = force || ((numeroDe(id) * 97) % TOTAL);
  const s = force && force.s !== undefined ? force.s : c % NB_S;
  return { s: force && force.s !== undefined ? force.s : s, r: force && force.r !== undefined ? force.r : Math.floor(c / NB_S) % NB_R, p: force && force.p !== undefined ? force.p : Math.floor(c / (NB_S * NB_R)) % NB_P };
}
const planUnique = (id, force) => { const c = (numeroDe(id) * 97) % TOTAL; return force && typeof force === "object" ? planDe(id, force) : planDe(id, c); };

// Barre de la plateforme : jetons --ft-legal-* (valeurs sûres : voir footerFrontier.normalizeVars)
const BARRES = [
  {},                                                                                                                                            // P0 : rendu historique (centré, filet fin)
  { "--ft-legal-justify": "flex-start", "--ft-legal-align": "left", "--ft-legal-pad": "18px 48px 22px" },                                      // P1 : à gauche
  { "--ft-legal-justify": "flex-end", "--ft-legal-align": "right", "--ft-legal-pad": "18px 48px 22px" },                                       // P2 : à droite
  { "--ft-legal-justify": "space-between", "--ft-legal-sep": "none", "--ft-legal-pad": "20px 48px 24px", "--ft-legal-gap": "10px 28px" },      // P3 : noms écartés aux deux bords, sans séparateur
  { "--ft-legal-dir": "column", "--ft-legal-items": "center", "--ft-legal-sep": "none", "--ft-legal-gap": "2px", "--ft-legal-pad": "18px 20px 24px" }, // P4 : empilée, centrée
  { "--ft-legal-case": "uppercase", "--ft-legal-track": "0.14em", "--ft-legal-size": "11px", "--ft-legal-pad": "18px 20px 22px" },            // P5 : capitales espacées, centrée
  { "--ft-legal-case": "uppercase", "--ft-legal-track": "0.1em", "--ft-legal-size": "11px", "--ft-legal-justify": "flex-start", "--ft-legal-align": "left", "--ft-legal-pad": "18px 48px 22px", "--ft-legal-rule": "3px solid rgba(127, 127, 127, .35)" }, // P6 : capitales à gauche, filet épais
  { "--ft-legal-rule": "0 solid transparent", "--ft-legal-pad": "30px 20px 38px", "--ft-legal-opacity": "0.75", "--ft-legal-size": "12px", "--ft-legal-track": "0.04em" }, // P7 : sans filet, très aéré
  { "--ft-legal-justify": "center", "--ft-legal-pad": "26px 20px 30px", "--ft-legal-case": "uppercase", "--ft-legal-track": "0.18em", "--ft-legal-size": "10px", "--ft-legal-rule": "2px solid rgba(127, 127, 127, .5)" }, // P8 : capitales très espacées, filet marqué
];

// Parcours : parent de chaque nœud « copyright »
function trouveBas(arbre) {
  let hit = null;
  const marche = (n, parent) => { if (!n || hit) return; if (n.type === "copyright" && parent) { hit = { parent: parent.n, grand: parent.p, enfant: n }; return; } for (const c of n.children || []) marche(c, { n, p: parent && parent.n }); };
  for (const r of arbre) marche(r, null);
  if (!hit) return null;
  // grand-parent réel : le conteneur qui contient le parent
  const cherche = (n) => { for (const c of n.children || []) { if (c === hit.parent) return n; const x = cherche(c); if (x) return x; } return null; };
  for (const r of arbre) { const g = cherche(r); if (g) { hit.grand = g; break; } }
  return hit;
}
const st = (n) => (n.styles = n.styles || {}, n.styles.desktop = n.styles.desktop || {});
const hex6 = (c) => (/^#[0-9a-f]{6}/i.test(String(c || "")) ? String(c).slice(0, 7) : "#888888");

function appliquerLigne(arbre, plan, S) {
  const h = trouveBas(arbre);
  if (!h) return false;
  const P = h.parent, d = st(P), kids = P.children || [];
  const couleur = hex6((st(h.enfant) || {}).color);
  const texte = (f) => kids.forEach((c) => f(st(c)));
  switch (plan.s) {
    case 1: Object.assign(d, { justifyContent: "center", flexDirection: "row" }); texte((x) => { x.textAlign = "center"; }); break;
    case 2: Object.assign(d, { flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }); texte((x) => { x.textAlign = "center"; }); break;
    case 3: Object.assign(d, { justifyContent: "flex-end", flexDirection: "row" }); break;
    case 4: Object.assign(d, { flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start", gap: "6px" }); break;
    case 5: P.children = [...kids].reverse(); break;
    case 6: texte((x) => { x.textTransform = "uppercase"; x.letterSpacing = "0.14em"; x.fontSize = "11px"; }); break;
    case 7: Object.assign(d, { borderStyle: "solid", borderWidth: "1px", borderColor: `${couleur}55`, borderRadius: "0px", paddingTop: "14px", paddingBottom: "14px", paddingLeft: "18px", paddingRight: "18px" }); break;
    default: break;                                                                 // S0 : rangée d'origine
  }
  // Filet qui précède la rangée (frère immédiat) : épaisseur, style, couleur ; jamais supprimé (le widget déclaré doit rester présent)
  const fr = (h.grand && h.grand.children) || [], i = fr.indexOf(P), div = i > 0 && fr[i - 1] && fr[i - 1].type === "divider" ? fr[i - 1] : null;
  if (div) {
    const v = st(div), accent = hex6(S && S.accent);
    if (plan.r === 1) Object.assign(v, { borderTopWidth: "3px", borderColor: accent });
    else if (plan.r === 2) Object.assign(v, { borderStyle: "dashed", borderTopWidth: "1px" });
    else if (plan.r === 3) Object.assign(v, { borderStyle: "double", borderTopWidth: "5px" });
    else if (plan.r === 4) Object.assign(v, { borderTopWidth: "0px", marginBottom: "10px" });
    else if (plan.r === 5) Object.assign(v, { width: "64px", borderTopWidth: "4px", borderColor: accent });
    else if (plan.r === 6) Object.assign(v, { borderStyle: "dotted", borderTopWidth: "3px" });
    else if (plan.r === 7) Object.assign(v, { width: "140px", borderTopWidth: "2px", borderColor: accent, marginBottom: "6px" });
  }
  return true;
}

// Applique le plan à l'arbre construit ; renvoie { arbre, plan, ftVars } (ftVars : jetons --ft-legal-* à ajouter aux jetons du modèle)
function appliquerBas(arbre, id, S, force) {
  const plan = planUnique(id, force);
  appliquerLigne(arbre, plan, S);
  return { arbre, plan };
}
const varsBarre = (id, force) => ({ ...BARRES[planUnique(id, force).p] });

module.exports = { appliquerBas, varsBarre, planUnique, trouveBas, NB_S, NB_R, NB_P, TOTAL, BARRES, numeroDe };
