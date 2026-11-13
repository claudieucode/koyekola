// KIT v2 des pieds de page « indépendants » : tout ce qu'il faut pour écrire UN modèle premium à partir d'une fiche de concept (docs/footer-v2/concepts/concepts.json),
// SANS second moteur : on étend le moteur existant (../moteur.js : finishNode, item, band, wrap…) et le kit de conception (../kit-conception.js : échelles, ambiances, constructeurs de rangées).
//
// Un modèle v2 est un objet déclaratif :
//   { id: "ft2-017-phrase-de-lancement", concept: "c-017-phrase-de-lancement", name, family, description, tags,
//     identity: identite({...}),              // palette + polices + rayons PROPRES au modèle (jamais ceux du site) ; fournit aussi les jetons --ft-* du pied
//     compose: (k, env, G) => [ G.racine(k, [ G.bande(k, [...]), G.bande(k, [...]) ]) ],   // composition libre avec les « gestes » ci-dessous
//     // ou, plus simple : structure: { rows: [C(), L(), T(), Z(), A()] } comme la bibliothèque actuelle
//     widgets: ["text", "emailsubscribe", ...] }  // types réellement utilisés (le test le vérifie)
// Le modèle est inséré en mode « solo » (indépendant du site) : couleurs, polices, rayons sont CEUX DU MODÈLE (hexadécimal et familles de la bibliothèque `font.<nom>`),
// jamais `token:…` ni `var(--kw-…)` ; les widgets partagés (abonnement e-mail…) lisent les jetons --ft-* posés sur la racine du pied (ftVars).
//
// Les « gestes » G.* renvoient des fonctions (k, env, center) → nœud, comme les éléments en fonction du kit de conception : ils s'utilisent dans une rangée du moteur OU directement
// dans compose() en les appelant (G.geant(...)(k, env)). Chaque geste applique la finition du moteur (états survol/focus, cibles de 44 px sur mobile).
const Kit = require("../kit-conception");
const Moteur = require("../moteur");
const { sty, compact } = require("../../kit");
const fontLib = require("../../../../utils/fontLibrary");
const { contrastOf, isHex6, legible } = Moteur;

// ── Polices ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Les 1 775 familles de la bibliothèque de la plateforme (public/fonts/library/, AUTO-HÉBERGÉES : aucune requête vers un site tiers) sont utilisables par leur identifiant « font.<nom-en-minuscules-avec-tirets> ».
// Les @font-face sont livrés avec la page (publique, aperçu, éditeur) pour les familles citées par le modèle ; la police du modèle ne dépend donc JAMAIS de celle du site.
// Limite : fichiers « latin » seulement (accents français inclus ; les flèches ↗ → et symboles hors Latin-1 retombent sur la police du système).
function police(id) {
  if (!/^font\.[a-z0-9-]+$/.test(String(id)) || !fontLib.byId(id)) throw new Error(`Police « ${id} » absente de la bibliothèque de la plateforme (utilisez une famille de public/fonts/library, ex. font.inter).`);
  return id;
}
const pile = (id) => fontLib.stackOf(police(id));

// ── Identité propre à un modèle ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Palette COMPLÈTE choisie par le modèle (fond, texte, texte discret, accent, surface) + polices + formes. Les contrastes AA (4,5:1) sont vérifiés à la création (erreur sinon),
// y compris le texte discret sur la surface. Renvoie un objet compatible avec le moteur (mêmes champs que les ambiances du kit) + `ftVars` (jetons --ft-* du pied).
function identite({ key, label, humeur = "dark", fond, texte, discret, accent, surface, surEncre, encre, police: corps, titres, rayon, rayonBouton, ombre, poids, casse, suivi, filet, remplissage, ecart, bouton, bordure, ligne }) {
  if (!/^[a-z0-9-]{3,40}$/.test(String(key))) throw new Error("identite : key attendue en minuscules/chiffres/tirets.");
  const base = Kit.ambiance({ key: `v2-${key}`, label, humeur, fond, texte, accent, alt: surface, ink: encre, police: police(corps), titres: police(titres || corps) });
  let S = { ...base };
  if (discret) S.mute = discret;
  if (ligne) S.line = ligne;
  if (surEncre) S.onInk = surEncre;
  S = legible(S); // le texte discret reste ≥ 4,5:1 sur le fond ET sur la surface
  const patch = { radius: rayon, btnRadius: rayonBouton, shadow: ombre, weight: poids, caps: casse, track: suivi, rule: filet, pad: remplissage, gap: ecart, btn: bouton, bw: bordure };
  for (const [k, v] of Object.entries(patch)) if (v !== undefined) S[k] = v;
  const defauts = Kit.verifierAmbiance(S);
  if (defauts.length) throw new Error(`Identité « ${key} » : contraste AA insuffisant (${defauts.map((d) => `${d.paire} ${d.ratio}`).join(", ")}).`);
  S.v2 = true;
  S.ftVars = ftVarsOf(S);
  return S;
}
// Jetons --ft-* posés sur la racine du pied (document.ftVars) : les widgets partagés (e-mail, contact, carte…) lisent ces valeurs, pas celles du site.
function ftVarsOf(S) {
  const v = {
    "--ft-bg": S.bg, "--ft-bg-alt": S.alt, "--ft-text": S.fg, "--ft-muted": S.mute, "--ft-accent": S.accent, "--ft-on-accent": S.onAccent,
    "--ft-req": contrastOf("#b42318", S.bg) >= 4.5 ? "#b42318" : contrastOf("#ffc9c0", S.bg) >= 4.5 ? "#ffc9c0" : S.fg, // astérisque « obligatoire » du formulaire : lisible sur le fond du modèle
    "--ft-font": pile(S.font), "--ft-font-head": pile(S.head), "--ft-radius": S.radius, "--ft-radius-btn": S.btnRadius,
  };
  for (const [k, x] of Object.entries(v)) if (!x) delete v[k];
  return v;
}

// ── Modèle v2 : validation immédiate, erreurs en clair ────────────────────────────────────────────────────────────────────────────────────────
const ID_V2 = /^ft2-\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const identifiantV2 = (numero, slug) => `ft2-${String(numero).padStart(3, "0")}-${slug}`;
function modeleV2(m, famille) {
  const w = `Modèle v2 « ${m && m.id} »`;
  if (!m || typeof m !== "object") throw new Error("Modèle v2 : objet attendu.");
  if (!ID_V2.test(m.id || "") || m.id.length > 80) throw new Error(`${w} : identifiant invalide (attendu ft2-<nnn>-<slug>, 80 caractères au plus).`);
  if (!/^c-\d{3}-/.test(m.concept || "") || m.concept.slice(2) !== m.id.slice(4)) throw new Error(`${w} : « concept » doit être l'identifiant de la fiche (c-<nnn>-<slug>) correspondant à ${m.id}.`);
  if (famille && m.family !== famille) throw new Error(`${w} : family « ${m.family} » ≠ famille du module « ${famille} ».`);
  if (!m.name || String(m.name).length > 80) throw new Error(`${w} : nom obligatoire (80 caractères au plus).`);
  if (!m.description || String(m.description).length > 280) throw new Error(`${w} : description obligatoire (280 caractères au plus).`);
  if (!Array.isArray(m.tags) || !m.tags.length) throw new Error(`${w} : au moins une étiquette.`);
  if (typeof m.compose !== "function" && !(m.structure && Array.isArray(m.structure.rows) && m.structure.rows.length)) throw new Error(`${w} : compose(k, env, G) ou structure.rows obligatoire.`);
  if (m.structure && m.structure.rows) m.structure.rows.forEach((r, i) => { if (!r || typeof r !== "object" || ["cols", "l", "t", "z", "acc"].filter((x) => r[x]).length !== 1) throw new Error(`${w}, rangée ${i + 1} : C(), L(), T(), Z() ou A() attendu.`); });
  if (!m.identity || !m.identity.v2 || !m.identity.ftVars) throw new Error(`${w} : identity doit venir de identite({...}) du kit v2.`);
  if (m.widgets !== undefined && !Array.isArray(m.widgets)) throw new Error(`${w} : widgets doit être une liste de types de widgets.`);
  return m;
}

// ── Finition commune d'un nœud construit à la main ──────────────────────────────────────────────────────────────────────────────────────────────
// Applique les états survol/focus, les cibles de 44 px sur mobile et la police (moteur), puis des états propres au geste. `etats` remplace/complète ceux du moteur.
function fini(k, n, etats) {
  Moteur.finishNode(k.S, n);
  if (etats) n.states = { ...(n.states || {}), ...etats };
  return n;
}
// Contour de focus visible (2 px, décalé de 3 px) dans la couleur voulue (accent par défaut)
const focus = (couleur) => ({ outlineStyle: "solid", outlineWidth: "2px", outlineColor: couleur, outlineOffset: "3px" });
const MOUVEMENT = 160; // ms : durée des transitions de survol (coupées sous « mouvement réduit » par la frontière de pied)

// ── Structure : racine, bande, colonnes ──────────────────────────────────────────────────────────────────────────────────────────────────────────
// racine(k, bandes) : le conteneur pleine largeur qui porte toutes les bandes (comme wrap() du moteur).
function racine(k, bandes) {
  return { type: "container", props: { full: true }, children: bandes, ...sty({ display: "flex", flexDirection: "column", gap: "0px", width: "100%" }) };
}
// bande(k, enfants, opts) : UNE bande pleine largeur (fond de bord à bord) dont le contenu est dans un conteneur centré.
//   opts : fond (hex, défaut S.bg) · degrade { from, to, angle, type } · padV [bureau, tablette, mobile] ("112px"…) · padB (marge BASSE, même forme ; défaut = padV : la ligne légale de la plateforme s'ajoute dessous, la réduire) · padH [bureau, tablette, mobile] · max ("1180px") · filetHaut { epaisseur, couleur }
//          colonne:true (contenu empilé) · gap · aligne · nom
function bande(k, enfants, o = {}) {
  const S = k.S, [pv, pt, pm] = o.padV || ["64px", "48px", "40px"], [bv, bt, bm] = o.padB || [pv, pt, pm], [hv, ht, hm] = o.padH || ["32px", "24px", "16px"];
  const inner = { type: "container", children: enfants, ...sty(compact({ display: "flex", flexDirection: o.colonne ? "column" : "row", alignItems: o.aligne || (o.colonne ? "stretch" : "flex-end"), justifyContent: "space-between", flexWrap: "wrap", ...gaps(o.gap || "32px"), maxWidth: o.max || "1280px", width: "100%", marginLeft: "auto", marginRight: "auto" }), undefined, o.innerMobile) };
  const dec = o.degrade ? { gradient: o.degrade } : {};
  const b = { type: "container", ...(o.nom ? { name: o.nom } : {}), props: { full: true }, children: [inner],
    ...sty(compact({ backgroundColor: o.fond || S.bg, color: o.couleur || S.fg, paddingTop: pv, paddingBottom: bv, paddingLeft: hv, paddingRight: hv, display: "flex", flexDirection: "column", alignItems: "stretch", gap: "0px", borderStyle: "solid", borderWidth: "0px",
      ...(o.filetHaut ? { borderTopWidth: o.filetHaut.epaisseur || "1px", borderColor: o.filetHaut.couleur || S.line } : {}), ...dec }),
      { paddingTop: pt, paddingBottom: bt, paddingLeft: ht, paddingRight: ht }, { paddingTop: pm, paddingBottom: bm, paddingLeft: hm, paddingRight: hm }) };
  return b;
}
// colonne(enfants, { poids, min, aligne, gap }) : colonne flexible (poids = part de largeur) ; passe à la ligne sous `min`
function colonne(k, enfants, o = {}) {
  return { type: "stack", children: enfants, ...sty(compact({ display: "flex", flexDirection: "column", ...gaps(o.gap || "16px"), flexBasis: o.base || "0px", flexGrow: o.poids ?? 1, flexShrink: 1, minWidth: o.min || "0px", alignItems: o.aligne || "flex-start", justifyContent: o.justifie, alignSelf: o.soi, ...(o.extra || {}) }), o.tablette, o.mobile) };
}
// ligne(enfants, opts) : rangée d'éléments (retour à la ligne permis)
function ligne(k, enfants, o = {}) {
  return k.row(enfants, compact({ ...gaps(o.gap || "12px"), alignItems: o.aligne || "center", justifyContent: o.justifie, flexWrap: o.pas_de_ligne ? "nowrap" : "wrap", width: o.largeur }), o.tablette, o.mobile);
}

// gaps("20px 48px") : écart « ligne colonne » → { rowGap, columnGap } (la grammaire du Page Builder refuse « gap: 20px 48px ») ; une seule valeur → { gap }
const gaps = (g) => { const [r, c] = String(g || "").trim().split(/\s+/); return c ? { rowGap: r, columnGap: c } : g ? { gap: r } : {}; };

// ── Gestes typographiques ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// texteFluide(html, { taille: [min, max] | "14px", tablette, mobile, lh, suivi, police, poids, couleur, casse, largeur, align }) : texte riche (accents de couleur par <span style="color:#…">, sauts <br>)
// dont la taille suit la largeur de l'écran (fluid:min-max entre 320 et 1440 px, bornée : jamais de débordement à 1920 px).
const tailleCss = (t) => (Array.isArray(t) ? `fluid:${t[0]}-${t[1]}` : t);
function texteFluide(html, o = {}) {
  return (k, env, center) => {
    const S = k.S, h = /^\s*</.test(html) ? html : `<p>${html}</p>`;
    const n = k.T(h, compact({ fontSize: tailleCss(o.taille), lineHeight: o.lh ?? 1.6, letterSpacing: o.suivi, fontFamily: o.police || S.font, fontWeight: o.poids, color: o.couleur || S.fg, textTransform: o.casse, maxWidth: o.largeur, overflowWrap: "break-word", textAlign: o.align || (center ? "center" : undefined), ...(center && o.largeur ? { marginLeft: "auto", marginRight: "auto" } : {}), ...(o.extra || {}) }),
      o.tablette ? compact({ fontSize: tailleCss(o.tablette.taille), lineHeight: o.tablette.lh }) : undefined, o.mobile ? compact({ fontSize: tailleCss(o.mobile.taille), lineHeight: o.mobile.lh }) : undefined);
    return n;
  };
}
// geant(html, { taille: [min, max], lh: 0.9, suivi: "-0.04em", police, poids }) : la phrase / le nom MONUMENTAL (contraste d'échelle avec les mentions de 12 px). Interligne serré par défaut.
function geant(html, o = {}) {
  return texteFluide(html, { taille: [48, 132], lh: 0.92, suivi: "-0.03em", poids: "800", ...o, police: o.police || undefined, extra: { margin: undefined, ...(o.extra || {}) } });
}
// libelle("Newsletter", { couleur }) : petit libellé en capitales espacées (12 px)
function libelle(texte, o = {}) {
  return (k, env, center) => k.T(`<p>${texte}</p>`, compact({ fontSize: "12px", lineHeight: 1.4, fontWeight: o.poids || "600", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, textAlign: center ? "center" : undefined }));
}
// phrase("Texte courant", { taille: 15, largeur: "420px", couleur }) : texte courant (interligne 1,6)
function phrase(texte, o = {}) {
  return (k, env, center) => k.T(`<p>${texte}</p>`, compact({ fontSize: `${o.taille || 15}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, maxWidth: o.largeur || "420px", fontWeight: o.poids, ...(center ? { textAlign: "center", marginLeft: "auto", marginRight: "auto" } : {}) }));
}
// filet({ largeur: "48px", epaisseur: "3px", couleur }) : trait court d'accent (ou pleine largeur avec largeur:"100%")
function filet(o = {}) {
  return (k, env, center) => k.divider({ width: o.largeur || "48px", borderColor: o.couleur || k.S.accent, borderTopWidth: o.epaisseur || "3px", marginTop: "0px", marginBottom: "0px", ...(center ? { marginLeft: "auto", marginRight: "auto" } : {}) });
}

// ── Liens : flèches, pilules, listes ───────────────────────────────────────────────────────────────────────────────────────────────────────────
// lienFleche("Instagram", "https://…", { symbole: "↗", taille: 15 }) : nom suivi d'une flèche ; le lien glisse de 4 px au survol / focus (état de survol dans le nœud : coupé sous « mouvement réduit »).
function lienFleche(label, url, o = {}) {
  return (k, env, center) => {
    const S = k.S, couleur = o.couleur || S.fg, hover = o.survol || S.accent;
    const n = k.LINK(`${label} ${o.symbole || "↗"}`, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "600", fontFamily: o.police || S.font, color: couleur, textDecoration: "none", transitionDuration: MOUVEMENT, display: "inline-flex", alignItems: "center", minHeight: "44px", letterSpacing: o.suivi }));
    return fini(k, n, { hover: { color: hover, transform: { x: 4 }, textDecoration: "underline" }, focus: focus(o.focus || S.accent) });
  };
}
// pilule("FAQ", "/faq", { fond, couleur, contour }) : lien en pilule de 44 px de haut
function pilule(label, url, o = {}) {
  return (k) => {
    const S = k.S, contour = o.contour === undefined ? S.line : o.contour;
    const n = k.LINK(label, url, compact({ fontSize: `${o.taille || 14}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, backgroundColor: o.fond, borderStyle: contour ? "solid" : undefined, borderWidth: contour ? "1.5px" : undefined, borderColor: contour || undefined, borderRadius: o.rayon || "999px", minHeight: "44px", display: "inline-flex", alignItems: "center", paddingLeft: "20px", paddingRight: "20px", textDecoration: "none", transitionDuration: MOUVEMENT }));
    return fini(k, n, { hover: { backgroundColor: o.survolFond || S.accent, color: o.survolCouleur || S.onAccent, borderColor: o.survolFond || S.accent, transform: { y: -2 }, textDecoration: "none" }, focus: focus(o.focus || S.accent) });
  };
}
// pilules([["Blog", "/blog"], …], opts) : rangée de pilules qui reviennent à la ligne
function pilules(liste, o = {}) {
  return (k, env, center) => k.row(liste.map(([l, u]) => pilule(l, u, o)(k)), { gap: o.gap || "10px", ...(center ? { justifyContent: "center" } : {}) });
}
// liens([["Libellé", "/page"], …], { taille, poids, pile }) : liens simples en colonne (ou en ligne avec pile:false) ; survol souligné + couleur d'accent si lisible
function liens(liste, o = {}) {
  return (k, env, center) => {
    const a = liste.map(([l, u]) => k.LINK(l, u, compact({ fontSize: `${o.taille || 14}px`, fontWeight: o.poids || "500", fontFamily: k.S.font, ...(center ? { textAlign: "center" } : {}) })));
    return o.pile === false ? k.row(a, { gap: "12px", columnGap: "24px", rowGap: "4px", ...(center ? { justifyContent: "center" } : {}) }) : k.col(a, { gap: "8px", alignItems: center ? "center" : "flex-start" });
  };
}
// indexNumerote([["01", "Libellé", "/page"], …], { taille: 22 }) : liste numérotée, numéro d'accent + lien en grand
function indexNumerote(liste, o = {}) {
  return (k, env, center) => k.col(liste.map(([num, l, u]) => k.row([
    k.T(`<p>${num}</p>`, { color: k.S.accent, fontSize: "12px", fontWeight: "700", letterSpacing: "0.1em", fontFamily: k.S.font, minWidth: "28px" }),
    k.LINK(l, u, { fontSize: `${o.taille || 20}px`, fontWeight: "600", fontFamily: k.S.head, lineHeight: 1.2 })], { gap: "10px", flexWrap: "nowrap", alignItems: "baseline" })), { gap: "6px", alignItems: center ? "center" : "flex-start" });
}
// boutons([libellé, url], [libellé, url]) : deux boutons côte à côte (plein + contour)
function boutons(a, b) {
  return (k, env, center) => k.row([k.B(a[0], a[1]), k.B(b[0], b[1], "outline", { borderColor: k.S.fg, color: k.S.fg })], { gap: "12px", alignItems: "center", ...(center ? { justifyContent: "center" } : {}) });
}
// pastille("Nouveau") / pastilles([...]) : étiquettes arrondies
function pastille(texte, o = {}) {
  return (k, env, center) => k.T(`<p><strong>${texte}</strong></p>`, compact({ fontSize: "12px", lineHeight: 1.3, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: k.S.font, color: o.couleur || k.S.onAccent, backgroundColor: o.fond || k.S.accent, borderRadius: "999px", paddingTop: "6px", paddingBottom: "6px", paddingLeft: "14px", paddingRight: "14px", alignSelf: center ? "center" : undefined }));
}
function pastilles(liste, o = {}) { return (k, env, center) => k.row(liste.map((t) => pastille(t, o)(k, env, center)), { gap: "8px", justifyContent: center ? "center" : "flex-start" }); }

// ── Blocs « expressifs » ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// chiffres([["12 000", "clients"], …], { taille: [32, 56] }) : bande de chiffres (grand nombre d'accent + légende). Les chiffres sont des EXEMPLES à remplacer : ne jamais en inventer en production.
function chiffres(liste, o = {}) {
  return (k, env, center) => k.row(liste.map(([n, t]) => k.col([k.T(`<p>${n}</p>`, { fontFamily: k.S.head, fontSize: tailleCss(o.taille || [32, 56]), lineHeight: 1, fontWeight: "800", color: o.couleur || k.S.accent }), k.T(`<p>${t}</p>`, { fontSize: "13px", color: k.S.mute, fontFamily: k.S.font })], { gap: "6px", flexGrow: 1, flexBasis: "0px", minWidth: "120px" })), { gap: "24px", alignItems: "flex-start", width: "100%", ...(center ? { justifyContent: "center", textAlign: "center" } : {}) });
}
// carte(enfants, { fond, rayon, remplissage, ombre, contour }) : carte « décollée » sur un aplat (fond propre, rayon, ombre)
function carte(enfants, o = {}) {
  return (k) => {
    const S = k.S, n = k.card(enfants.map((c) => (typeof c === "function" ? c(k) : c)), compact({ backgroundColor: o.fond || S.alt, borderRadius: o.rayon || S.radius, paddingTop: o.remplissage || "28px", paddingBottom: o.remplissage || "28px", paddingLeft: o.remplissage || "28px", paddingRight: o.remplissage || "28px", boxShadow: o.ombre || "lg", borderStyle: o.contour ? "solid" : undefined, borderWidth: o.contour ? "1px" : "0px", borderColor: o.contour, width: o.largeur, flexGrow: o.poids, gap: o.gap || "14px" }));
    return Moteur.finishNode(S, n);
  };
}
// cadre(enfants, { couleur, epaisseur, remplissage }) : cadre à filet (bordure franche, sans fond)
function cadre(enfants, o = {}) {
  return (k) => k.col(enfants.map((c) => (typeof c === "function" ? c(k) : c)), compact({ borderStyle: "solid", borderWidth: o.epaisseur || "1.5px", borderColor: o.couleur || k.S.fg, paddingTop: o.remplissage || "24px", paddingBottom: o.remplissage || "24px", paddingLeft: o.remplissage || "24px", paddingRight: o.remplissage || "24px", borderRadius: o.rayon || "0px", gap: "12px" }));
}
// nomRogne("ATELIER", { taille: [96, 320], visible: 0.72 }) : nom MONUMENTAL rogné en bas par le bord de la bande (la moitié basse des lettres disparaît). `visible` = part de la hauteur de ligne visible.
function nomRogne(texte, o = {}) {
  return (k) => {
    const S = k.S, [mn, mx] = o.taille || [96, 320];
    const t = k.T(`<p>${texte}</p>`, compact({ fontSize: `fluid:${Math.min(mn, 200)}-${Math.min(mx, 200)}`, lineHeight: 0.8, letterSpacing: o.suivi || "-0.04em", fontFamily: o.police || S.head, fontWeight: o.poids || "800", color: o.couleur || S.fg, textTransform: o.casse, marginBottom: `-${Math.round((1 - (o.visible || 0.72)) * 100)}px`, whiteSpace: undefined, overflowWrap: "anywhere" }));
    return { type: "container", children: [t], ...sty({ overflow: "hidden", width: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }) };
  };
}
// ruban(["Mot", "Mot"], { separateur: "✦", taille }) : ruban STATIQUE de mots séparés (aucun mouvement, jamais de débordement horizontal)
function ruban(mots, o = {}) {
  return (k, env, center) => k.T(`<p>${mots.join(` ${o.separateur || "✦"} `)}</p>`, compact({ fontSize: tailleCss(o.taille || [20, 44]), lineHeight: 1.1, letterSpacing: "0.02em", textTransform: "uppercase", fontFamily: o.police || k.S.head, color: o.couleur || k.S.fg, overflowWrap: "anywhere", textAlign: center ? "center" : undefined }));
}

// ── Widgets existants, habillés ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// abonnement({ titre, intro, bouton, champ, soulignement, ... }) : widget « Abonnement par e-mail » (emailsubscribe) habillé aux couleurs du modèle.
// SANS formulaire d'inscription publié : message « non configuré » élégant (cadre en pointillés), aucun faux champ, publication jamais bloquée.
function abonnement(o = {}) {
  return (k, env, center) => {
    const S = k.S, accent = o.accent || S.accent, texte = o.texte || S.fg;
    const n = k.W("emailsubscribe", { title: o.titre || "", intro: o.intro || "", button: o.bouton || "S'abonner", formId: 0, fields: "email", showWhenMissing: true, missingText: o.manque || "" },
      { width: "100%", maxWidth: o.largeur || "460px", color: texte, fontFamily: S.font, fontSize: "14px", ...(center ? { marginLeft: "auto", marginRight: "auto" } : {}) });
    const champ = { fontFamily: o.policeChamp || S.font, fontSize: o.tailleChamp || "18px", color: texte, backgroundColor: o.fondChamp || "transparent", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: o.soulignement || "3px", borderColor: accent, borderRadius: o.rayonChamp || "0px", height: "56px", width: "100%", paddingLeft: o.rembChamp || "0px", paddingRight: "12px" };
    const bouton = { fontFamily: S.font, fontSize: "15px", fontWeight: "700", color: S.onAccent, backgroundColor: accent, borderStyle: "solid", borderWidth: "0px", borderRadius: o.rayonBouton || "999px", minHeight: "56px", paddingLeft: "28px", paddingRight: "28px", transitionDuration: MOUVEMENT };
    n.parts = {
      title: { styles: { desktop: o.styleTitre || { fontFamily: S.font, color: S.mute, fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "6px" } } },
      intro: { styles: { desktop: { fontFamily: S.font, color: S.mute, fontSize: "15px", lineHeight: 1.6 } } },
      input: { styles: { desktop: champ, mobile: { height: "56px" } }, states: { focus: { outlineStyle: "solid", outlineWidth: "2px", outlineColor: accent, outlineOffset: "4px" } } },
      button: { styles: { desktop: bouton, mobile: { minHeight: "56px" } }, states: { hover: { backgroundColor: o.survolBouton || texte, color: o.survolTexte || S.bg }, focus: focus(texte) } },
      consent: { styles: { desktop: { fontFamily: S.font, color: o.consentCouleur || (o.texte ? o.texte : S.mute), fontSize: "13px" } } },
      missing: { styles: { desktop: { fontFamily: S.font, color: S.fg, fontSize: "15px", lineHeight: 1.5, fontStyle: "italic", paddingTop: "4px", paddingBottom: "4px" } } }, // la partie « message » n'accepte que texte et espacement (pas de bordure)
    };
    return n;
  };
}
// ligneLegale({ taille, sansCookies }) : copyright automatique (année + raison sociale des Données de l'entreprise) puis liens légaux (Cookies, Contact, pages légales renseignées) — jamais de lien mort
function ligneLegale(o = {}) {
  return (k, env, center) => {
    const S = k.S, taille = `${o.taille || 12}px`, couleur = o.couleur || S.mute;
    const copy = k.W("copyright", { owner: "{{business.legalname}}", text: "Tous droits réservés." }, { color: couleur, fontSize: taille, fontFamily: S.font, textAlign: center ? "center" : undefined });
    // sansCookies : seulement les pages légales renseignées (mentions, confidentialité, CGV) ; « Cookies » reste dans la ligne légale de la plateforme (ajoutée sous le pied) : pas de doublon, lien jamais perdu
    const lg = o.sansCookies ? k.W("bizlegal", { title: "", showName: false, showForm: false, showRegistrations: false, showPublisher: false, showHost: false, showPages: true, layout: "inline", hintMissing: true }, { color: S.fg, fontSize: taille, fontFamily: S.font }) : Moteur.item(k, `legallinks${o.pile ? ":stack" : ""}`, env, center);
    lg.styles.desktop = { ...(lg.styles.desktop || {}), fontSize: taille, color: o.liens || S.fg, fontFamily: S.font };
    if (o.sansCookies) Moteur.finishNode(S, lg); // cibles de 44 px sur mobile, états de focus
    return k.row([copy, lg], compact({ ...gaps("10px 28px"), alignItems: "center", justifyContent: center ? "center" : "space-between", width: "100%" }), undefined, { rowGap: "14px" });
  };
}
// reseauxTexte([["Instagram", "https://www.instagram.com/"], …], opts) : réseaux en NOMS suivis d'une flèche ↗ (adresses d'exemple à remplacer dans l'éditeur)
function reseauxTexte(liste, o = {}) {
  return (k, env, center) => k.row(liste.map(([l, u]) => lienFleche(l, u, o)(k, env, center)), { ...gaps("4px 22px"), alignItems: "center", ...(center ? { justifyContent: "center" } : {}) });
}
// code("nom:arg|a1|a2") : n'importe quel élément en texte du moteur (menu, contact, legallinks, socials…) fini par le moteur
const code = (c) => (k, env, center) => Moteur.item(k, c, env, center);
// cote([codes…]) : plusieurs éléments côte à côte
const cote = (codes) => (k, env, center) => k.row(codes.map((c) => Moteur.item(k, c, env, center)), { gap: "16px", ...(center ? { justifyContent: "center" } : {}) });
// resoudre(k, env, enfants) : accepte des nœuds, des codes en texte ou des gestes (fonctions) et renvoie des nœuds
const resoudre = (k, env, enfants, center) => enfants.map((c) => (typeof c === "function" ? c(k, env, center) : typeof c === "string" ? Moteur.item(k, c, env, center) : c));

const G = {
  // structure
  racine, bande, colonne, ligne, resoudre, gaps,
  // typographie
  texteFluide, geant, libelle, phrase, filet,
  // liens
  lienFleche, pilule, pilules, liens, indexNumerote, boutons, pastille, pastilles, reseauxTexte,
  // blocs
  chiffres, carte, cadre, nomRogne, ruban,
  // widgets existants
  abonnement, ligneLegale, code, cote,
  // utilitaires
  fini, focus, tailleCss, MOUVEMENT,
};

module.exports = { ...G, G, identite, ftVarsOf, police, pile, modeleV2, identifiantV2, ID_V2, contrastOf, isHex6, Kit, Moteur };
