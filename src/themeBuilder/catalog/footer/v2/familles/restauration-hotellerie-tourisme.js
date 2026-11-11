// Famille v2 « Restauration, hôtellerie et tourisme » — 8 modèles (concepts c-052 à c-059 de docs/footer-v2/CONCEPTS_100.md).
// Chaque modèle est INDÉPENDANT du site (solo) : ses couleurs en hexadécimal, ses polices de la bibliothèque, ses jetons --ft-*. Marques FICTIVES (texte modifiable dans l'éditeur).
// Aucune donnée inventée : adresse, téléphone, e-mail, horaires et « ouvert maintenant » viennent des widgets EXISTANTS (Données de l'entreprise), avec leur état vide explicite.
// Polices d'affichage testées à 150 px (méthode du guide, §5 bis, accents et « a », « e » regardés sur capture) : Caveat Brush, Marcellus, Outfit 700, Alegreya 800, Crimson Pro 600, EB Garamond 500,
// Albert Sans 800, Bebas Neue : rendu PROPRE (aucune encoche ni fente) ; Fraunces 700 et Cormorant Garamond 500 aussi propres.
const { modeleV2, identifiantV2, identite, G, Kit, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "restauration-hotellerie-tourisme";
const MS = G.MOUVEMENT;

// ── Aides locales ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// partie(widget, "row", { styles }, { états }) : habille UNE partie d'un widget (ses classes internes)
const partie = (n, cle, styles, etats, mobile) => Moteur.mergePart(n, cle, { styles: { desktop: styles, ...(mobile ? { mobile } : {}) }, ...(etats ? { states: etats } : {}) });
// petit libellé en capitales espacées
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.16em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }), o.tablette, o.mobile);
// texte courant / titre
const texte = (k, html, o = {}) => k.T(/^\s*</.test(html) ? html : `<p>${html}</p>`, compact({ fontSize: o.taille === undefined ? "15px" : (typeof o.taille === "number" ? `${o.taille}px` : o.taille), lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, fontWeight: o.poids, letterSpacing: o.suivi, textTransform: o.casse, textAlign: o.align, maxWidth: o.largeur, fontStyle: o.italique ? "italic" : undefined, ...(o.extra || {}) }), o.tablette, o.mobile);
// lien de texte fini par le moteur (états, 44 px sur mobile) puis états propres : survol, focus (contour 2 px)
function lien(k, label, url, o = {}) {
  const S = k.S;
  const n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.souligne ? "underline" : "none", display: "inline-flex", alignItems: "center", minHeight: o.h || "32px", paddingLeft: o.padH, paddingRight: o.padH, letterSpacing: o.suivi, textTransform: o.casse, lineHeight: o.lh || 1.3, transitionDuration: MS, ...(o.extra || {}) }));
  return G.fini(k, n, { hover: o.survol || { textDecoration: "underline", color: o.survolCouleur || o.couleur || S.fg }, focus: G.focus(o.focus || o.couleur || S.accent) });
}
const hr = (k, couleur, ep = "1px", style) => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: ep, ...(style ? { borderStyle: style } : {}), marginTop: "0px", marginBottom: "0px" });
// accordéon (volets repliables seulement ≤ 767 px ; colonnes ailleurs). panels : [{ title, w, codes:[(k, env) => nœud] }]
const accordeon = (k, env, panels, opts) => Moteur.item(k, Kit.accordeon(panels, opts || {}), env);
// volets en colonnes ÉGALES sur ordinateur (jamais de retour à la ligne), 3 par ligne sur tablette ; sur mobile : volets repliables
const accordeonEgal = (k, env, panels, flex = {}, tab = "30%") => {
  const n = accordeon(k, env, panels, { start: "none", min: "0px" });
  n.styles.desktop = { ...n.styles.desktop, flexWrap: "nowrap", alignItems: "flex-start", ...flex };
  n.styles.tablet = { ...(n.styles.tablet || {}), flexWrap: "wrap" };
  for (const v of n.children || []) { v.styles.desktop = { ...v.styles.desktop, flexBasis: "0px", flexGrow: 1, minWidth: "0px" }; v.styles.tablet = { ...(v.styles.tablet || {}), flexBasis: tab, flexGrow: 0 }; }
  return n;
};
// widgets de données habillés puis finis par le moteur
const horaires = (k, env, o = {}) => {
  const n = k.W("bizhours", { title: o.titre || "", showOpenNow: o.statut !== false, groupDays: true, showExceptions: o.exceptions !== false, showNote: o.note !== false, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, ...(o.extra || {}) });
  return Moteur.finishNode(k.S, n);
};
const coordonnees = (k, env, o = {}) => {
  const n = k.W("bizcontact", { title: "", showName: false, showAddress: o.adresse !== false, showPhone: o.tel !== false, showEmail: o.mail !== false, showIcons: o.icones !== false, layout: o.ligne ? "inline" : "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: o.lh });
  return Moteur.finishNode(k.S, n);
};
// widget e-mail habillé puis recoloré : patch = { titre, intro, champ, bouton, consent, manque, etatBouton, etatChamp } (styles desktop) et patchM (mobile)
function abo(k, env, o = {}, patch = {}, patchM = {}) {
  const n = G.abonnement(o)(k, env);
  const map = { titre: "title", intro: "intro", champ: "input", bouton: "button", consent: "consent", manque: "missing" };
  for (const [kk, pp] of Object.entries(map)) {
    if (patch[kk]) n.parts[pp].styles.desktop = { ...n.parts[pp].styles.desktop, ...patch[kk] };
    if (patchM[kk]) n.parts[pp].styles.mobile = { ...(n.parts[pp].styles.mobile || {}), ...patchM[kk] };
  }
  if (patch.etatBouton) n.parts.button.states = { ...n.parts.button.states, ...patch.etatBouton };
  if (patch.etatChamp) n.parts.input.states = { ...n.parts.input.states, ...patch.etatChamp };
  return n;
}
// Réseaux en icônes (disques de 44 px) aux couleurs du modèle : parties du widget « Réseaux sociaux »
function reseauxIcones(k, env, liste, o = {}) {
  const S = k.S, n = Moteur.item(k, `socials:${liste.join("+")}`, env);
  n.props.size = String(o.taille || 44); n.props.shape = o.forme || "circle";
  Moteur.mergePart(n, "link", { styles: { desktop: compact({ width: o.largeur, height: o.largeur, color: o.couleur || S.fg, backgroundColor: o.fond, borderStyle: o.contour ? "solid" : undefined, borderWidth: o.contour ? (o.epaisseur || "1.5px") : undefined, borderColor: o.contour, transitionDuration: MS }) },
    states: { hover: { backgroundColor: o.survolFond || S.accent, color: o.survolCouleur || S.onAccent, borderColor: o.survolFond || S.accent }, focus: G.focus(o.focus || S.accent) } });
  return n;
}
// liens séparés par un signe (les signes disparaissent sur mobile : les liens passent à la ligne proprement)
const separes = (k, liens, o = {}) => k.row(liens.flatMap((l, i) => (i ? [{ ...texte(k, o.signe || "·", { couleur: o.couleurSigne || k.S.mute, taille: 18, lh: 1, extra: { paddingLeft: "6px", paddingRight: "6px" } }), hideOn: ["mobile"] }, l] : [l])), { ...G.gaps(o.gap || "0px"), alignItems: "center", justifyContent: o.centre ? "center" : "flex-start", flexWrap: "wrap" }, undefined, { ...G.gaps("0px 20px") });
const RESEAUX = [["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["TikTok", "https://www.tiktok.com/"], ["YouTube", "https://www.youtube.com/"]];

const modeles = [];

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-052 « Bistro Ardoise » — bistro fictif « Chez Marthe ». Une vraie ARDOISE dans un cadre de bois : fond ardoise nuancé de traînées de craie, titres écrits à la craie (Caveat Brush, titres seulement),
// horaires lisibles (Mulish) dans le widget Horaires (vraies heures + « ouvert maintenant » calculé), adresse et tableau de liens à droite, filets de craie en tirets. Ardoise #262b29, craie #f3efe3, jaune d'œuf #f2c14e.
// Écart au concept : les points de conduite (jour ……… heure) ne sont pas réalisables sur le widget Horaires (la partie « ligne » n'accepte pas de bordure) : remplacés par une ligne de craie en tirets sous le titre et des lignes aérées.
// Texture de craie : traînées claires/sombres par dégradé à plusieurs paliers (aucune image).
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const ardoise = identite({
  key: "c052", label: "Ardoise, craie et jaune d'œuf", humeur: "dark",
  fond: "#262b29", texte: "#f3efe3", discret: "#c5c9be", accent: "#f2c14e", surface: "#2f3532",
  police: "font.mulish", titres: "font.caveat-brush", rayon: "6px", rayonBouton: "999px", ombre: "none", poids: "700", bordure: "0px", ligne: "#f3efe359",
});
modeles.push(modeleV2({
  id: identifiantV2(52, "bistro-ardoise"), concept: "c-052-bistro-ardoise", name: "Bistro ardoise", family: FAM,
  description: "Une vraie ardoise dans un cadre de bois : titres écrits à la craie, horaires du jour avec « ouvert maintenant » calculé sur vos vraies heures, adresse, lien de réservation et petit tableau de liens.",
  tags: ["restaurant", "bistro", "ardoise", "craie", "bois", "horaires", "manuscrit"],
  identity: ardoise,
  racine: { desktop: { backgroundColor: "#2f1f12", gap: "0px" } },
  widgets: ["text", "bizhours", "bizcontact", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, CRAIE = S.fg, JAUNE = S.accent, BOIS = "#7d5333", TIRETS = "#f3efe366";
    // 1 · le nom, à la craie : Caveat Brush 64 → 132 px, souligné d'un filet jaune
    const nom = G.geant("<p>Chez&nbsp;Marthe</p>", { taille: [64, 132], tablette: { taille: [88, 112] }, mobile: { taille: [64, 88] }, lh: 1, suivi: "0.01em", poids: "400", police: S.head, couleur: CRAIE, align: "center" })(k, env);
    const entete = k.col([caps(k, "Bistro de quartier", { couleur: JAUNE, extra: { textAlign: "center" } }), nom, G.filet({ largeur: "120px", epaisseur: "4px", couleur: JAUNE })(k, env, true)], { gap: "6px", alignItems: "center", width: "100%" });
    // 2 · colonne de gauche : l'ardoise des horaires (widget réel ; le titre disparaît avec le widget quand les horaires ne sont pas renseignés)
    const h = k.W("bizhours", { title: "Les horaires", showOpenNow: true, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: CRAIE, fontSize: "19px", fontFamily: S.font, width: "100%" });
    Moteur.finishNode(S, h);
    partie(h, "title", { fontFamily: S.head, fontSize: "44px", lineHeight: 1.05, fontWeight: "400", color: JAUNE, marginBottom: "12px" });
    partie(h, "status", { fontFamily: S.font, fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.14em", color: JAUNE, marginBottom: "14px" });
    partie(h, "row", { fontFamily: S.font, fontSize: "19px", fontWeight: "600", color: CRAIE, paddingTop: "7px", paddingBottom: "7px", columnGap: "28px" }, undefined, { fontSize: "17px" });
    partie(h, "exceptions", { color: S.mute, fontSize: "14px" });
    partie(h, "note", { color: S.mute, fontSize: "14px" });
    const reserver = G.lienFleche("Réserver une table", "/contact", { couleur: JAUNE, taille: 19, survol: S.fg, focus: JAUNE })(k, env);
    const mot = texte(k, "On vous garde une place.", { police: S.head, taille: "fluid:30-40", lh: 1.1, couleur: CRAIE, extra: { marginTop: "14px" } });
    const gauche = G.colonne(k, [h, mot, reserver], { poids: 6, min: "300px", gap: "10px", mobile: { flexBasis: "100%" } });
    // 3 · colonne de droite : adresse (widget réel), réservation, tableau de liens
    const c = k.W("bizcontact", { title: "Venir nous voir", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: true, layout: "stack" }, { color: CRAIE, fontSize: "17px", fontFamily: S.font, lineHeight: 1.5, width: "100%" });
    Moteur.finishNode(S, c);
    partie(c, "title", { fontFamily: S.head, fontSize: "44px", lineHeight: 1.05, fontWeight: "400", color: JAUNE, marginBottom: "12px" });
    partie(c, "icon", { color: JAUNE });
    partie(c, "link", { color: CRAIE }, { hover: { color: JAUNE }, focus: G.focus(JAUNE) });
    // tableau de liens : un seul niveau (rangée qui passe à la ligne, 2 cellules par ligne, filets de craie entre les cases)
    const cellule = (l, u, i) => lien(k, l, u, { taille: 16, poids: "700", couleur: CRAIE, survolCouleur: JAUNE, h: "48px", extra: { flexBasis: "50%", flexGrow: 0, flexShrink: 0, justifyContent: "center", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderColor: TIRETS, ...(i % 2 ? { borderLeftWidth: "1px" } : {}), ...(i > 1 ? { borderTopWidth: "1px" } : {}) } });
    const tableau = k.row([cellule("Le blog", "/blog", 0), cellule("Questions", "/faq", 1), cellule("Contact", "/contact", 2), cellule("Mon compte", "/connexion", 3)], { gap: "0px", width: "100%", maxWidth: "420px", borderStyle: "solid", borderWidth: "1px", borderColor: TIRETS, borderRadius: "6px", overflow: "hidden", alignItems: "stretch" });
    const droite = G.colonne(k, [c, tableau], { poids: 5, min: "300px", gap: "18px", extra: { borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "2px", borderColor: TIRETS, paddingLeft: "48px" }, tablette: { paddingLeft: "32px" }, mobile: { flexBasis: "100%", borderLeftWidth: "0px", paddingLeft: "0px", borderTopWidth: "2px", paddingTop: "28px" } });
    const colonnes = G.ligne(k, [gauche, droite], { gap: "36px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    // 4 · réseaux en liste de noms, séparés par des points (pas d'icônes)
    const points = RESEAUX.slice(0, 3).flatMap(([l, u], i) => (i ? [texte(k, "·", { couleur: S.mute, taille: 16, extra: { paddingLeft: "10px", paddingRight: "10px" } }), lien(k, l, u, { taille: 15, couleur: CRAIE, survolCouleur: JAUNE, poids: "700" })] : [lien(k, l, u, { taille: 15, couleur: CRAIE, survolCouleur: JAUNE, poids: "700" })]));
    const reseaux = G.ligne(k, [caps(k, "Suivez la craie", { couleur: S.mute }), k.row(points, { gap: "0px", alignItems: "center" })], { gap: "6px 20px", aligne: "center" });
    // 5 · l'ardoise : fond nuancé de traînées de craie, cadre de bois, ombre portée
    const planche = k.col([entete, hr(k, TIRETS, "2px", "dashed"), colonnes, hr(k, TIRETS, "2px", "dashed"), reseaux], {
      width: "100%", maxWidth: "1180px", marginLeft: "auto", marginRight: "auto", gap: "36px", color: CRAIE, backgroundColor: S.bg,
      gradient: { from: "#262b29", to: "#2c3330", angle: 168, extra: [{ color: "#2d3431", at: 14 }, { color: "#252a28", at: 31 }, { color: "#2e3532", at: 47 }, { color: "#242927", at: 66 }, { color: "#2b322f", at: 83 }] },
      borderStyle: "solid", borderWidth: "16px", borderColor: BOIS, borderRadius: "10px", shadow: { x: 0, y: 24, blur: 48, spread: -12, color: "#000000aa" },
      paddingTop: "56px", paddingBottom: "52px", paddingLeft: "64px", paddingRight: "64px",
    }, { paddingTop: "44px", paddingBottom: "40px", paddingLeft: "36px", paddingRight: "36px", borderWidth: "12px" }, { paddingTop: "32px", paddingBottom: "28px", paddingLeft: "18px", paddingRight: "18px", borderWidth: "8px", gap: "28px" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true, couleur: "#e4d6c3", liens: "#f3e9d8" })(k, env);
    const bande = G.bande(k, [planche, mentions], { colonne: true, gap: "28px", padV: ["56px", "44px", "28px"], padB: ["24px", "24px", "20px"], padH: ["32px", "24px", "10px"], fond: "#2f1f12", degrade: { from: "#4a3220", to: "#2f1f12", angle: 180 }, innerMobile: { rowGap: "22px" }, nom: "Ardoise" });
    return [G.racine(k, [bande])];
  },
}, FAM));
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-053 « Palace Annuaire » — groupe hôtelier fictif « Maison Altaïr ». Bleu nuit, ivoire, champagne. Le geste : un ANNUAIRE en cinq colonnes fines (pays, puis villes) sous un nom de marque aux lettres très espacées
// et un petit ornement (losange entre deux filets). Newsletter discrète sur une bande plus claire. Marcellus (titres) + Lato (texte).
// Villes et pays : textes d'EXEMPLE, modifiables dans l'éditeur (ce ne sont pas des liens : aucune page par établissement n'existe). Cinquième colonne = Coordonnées réelles (widget Données de l'entreprise).
// Écarts au concept : le sélecteur de langue et le widget « liste d'adresses » n'existent pas : omis (annuaire en texte, adresse du siège via le widget Coordonnées). Mobile : les colonnes deviennent des volets repliables (mécanisme du moteur).
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const altair = identite({
  key: "c053", label: "Bleu nuit, ivoire et champagne", humeur: "dark",
  fond: "#0f1b2d", texte: "#f4eee2", discret: "#b9c0cc", accent: "#d1b27a", surface: "#18273d",
  police: "font.lato", titres: "font.marcellus", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "0px", ligne: "#d1b27a55",
});
modeles.push(modeleV2({
  id: identifiantV2(53, "palace-annuaire"), concept: "c-053-palace-annuaire", name: "Palace annuaire", family: FAM,
  description: "Un groupe hôtelier en bleu nuit, ivoire et champagne : nom de marque aux lettres espacées, puis un annuaire en cinq colonnes (pays et villes), la lettre d'information et les coordonnées de la maison mère.",
  tags: ["hôtel", "palace", "annuaire", "bleu nuit", "champagne", "luxe", "newsletter"],
  identity: altair,
  racine: { desktop: { backgroundColor: "#0f1b2d", gap: "0px" } },
  widgets: ["text", "bizcontact", "emailsubscribe", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, IVOIRE = S.fg, CH = S.accent;
    // 1 · la marque : Marcellus, lettres très espacées ; au-dessus un libellé, en dessous un losange entre deux filets champagne
    const marque = texte(k, "<p>Maison Altaïr</p>", { police: S.head, taille: "fluid:34-76", lh: 1.05, couleur: IVOIRE, suivi: "0.2em", casse: "uppercase", align: "center", extra: { marginRight: "-0.2em" } });
    const filet = () => k.divider({ width: "96px", borderColor: CH, borderTopWidth: "1px", marginTop: "0px", marginBottom: "0px" });
    const losange = k.col([], { width: "9px", height: "9px", borderStyle: "solid", borderWidth: "1px", borderColor: CH, transform: { rotate: 45 }, flexShrink: 0 });
    const ornement = k.row([filet(), losange, filet()], { gap: "18px", alignItems: "center", justifyContent: "center", flexWrap: "nowrap" });
    const entete = k.col([caps(k, "Hôtels · Résidences · Maisons", { couleur: CH, suivi: "0.28em", extra: { textAlign: "center" } }), marque, ornement], { gap: "18px", alignItems: "center", width: "100%" });
    // 2 · l'annuaire : cinq colonnes égales (pays > villes) ; sous 768 px, volets repliables
    const ville = (t) => (k2) => texte(k2, t, { taille: 14, couleur: IVOIRE, lh: 1.4, casse: "uppercase", suivi: "0.16em", extra: { paddingTop: "6px", paddingBottom: "6px" } });
    const pays = (titre, villes) => ({ title: titre, w: 1, codes: villes.map(ville) });
    const contact = { title: "La maison mère", w: 1, codes: [(k2, e2) => { const n = coordonnees(k2, e2, { taille: 15, couleur: IVOIRE, lh: 1.5 }); partie(n, "icon", { color: CH }); partie(n, "link", { color: IVOIRE }, { hover: { color: CH }, focus: G.focus(CH) }); return n; }, (k2) => lien(k2, "Nous écrire", "/contact", { taille: 14, poids: "700", couleur: CH, casse: "uppercase", suivi: "0.14em", souligne: true, survolCouleur: IVOIRE, h: "44px" })] };
    const annuaire = accordeonEgal(k, env, [
      pays("France", ["Paris", "Lyon", "Bordeaux", "Courchevel", "Biarritz"]), pays("Italie", ["Rome", "Florence", "Venise", "Lac de Côme"]),
      pays("Espagne", ["Madrid", "Séville", "Majorque"]), pays("Maroc", ["Marrakech", "Essaouira"]), contact,
    ], { columnGap: "40px", width: "100%", justifyContent: "space-between" }, "29%");
    // le moteur refinit les éléments d'un volet (états de survol par défaut) : on repose ceux du modèle sur le widget Coordonnées une fois le volet construit
    const refaire = (list) => { for (const n of list || []) { if (n.type === "link") n.states = { hover: { color: IVOIRE, textDecoration: "underline" }, focus: G.focus(IVOIRE) }; if (n.type === "bizcontact") partie(n, "link", { color: IVOIRE }, { hover: { color: CH }, focus: G.focus(CH) }); refaire(n.children); } };
    refaire(annuaire.children);
    // le titre de colonne (ordinateur : pseudo-élément du volet ; mobile : bouton) hérite du conteneur : champagne, Lato, lettres un peu espacées
    annuaire.styles.desktop = { ...annuaire.styles.desktop, color: CH, fontFamily: S.font, letterSpacing: "0.06em" };
    for (const v of annuaire.children || []) v.styles.desktop = { ...v.styles.desktop, borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: S.line, paddingTop: "18px", gap: "4px" }, v.styles.mobile = { ...(v.styles.mobile || {}), borderTopWidth: "0px", paddingTop: "4px" };
    const haut = G.bande(k, [entete, annuaire], { colonne: true, gap: "64px", padV: ["104px", "80px", "56px"], padB: ["88px", "72px", "48px"], padH: ["56px", "40px", "20px"], fond: S.bg, innerMobile: { rowGap: "40px" }, degrade: { from: "#0f1b2d", to: "#12223a", angle: 180 }, nom: "Annuaire" });
    // 3 · la lettre discrète (champ à simple filet, flèche en bout) et les réseaux en texte, sur une bande plus claire
    const lettre = abo(k, env, { titre: "La lettre de la maison", intro: "Une lettre rare, des nouvelles des maisons.", bouton: "→", largeur: "460px", soulignement: "1px", accent: CH, texte: IVOIRE, tailleChamp: "17px", survolBouton: IVOIRE, survolTexte: S.bg },
      { titre: { fontFamily: S.head, fontSize: "20px", textTransform: "none", letterSpacing: "0.04em", color: IVOIRE, fontWeight: "400" }, bouton: { backgroundColor: "transparent", color: CH, borderWidth: "0px", paddingLeft: "12px", paddingRight: "0px", fontSize: "26px", fontWeight: "400", minHeight: "56px" }, etatBouton: { hover: { backgroundColor: "transparent", color: IVOIRE } } });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["LinkedIn", "https://www.linkedin.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 14, poids: "700", couleur: IVOIRE, survol: CH, suivi: "0.08em" })(k, env);
    const bas = G.ligne(k, [G.colonne(k, [lettre], { poids: 1, min: "280px", base: "420px" }), G.colonne(k, [caps(k, "Suivre la maison", { couleur: CH, suivi: "0.2em" }), reseaux], { poids: 0, base: "auto", min: "0px", gap: "10px", soi: "flex-end", aligne: "flex-start" })], { gap: "36px 64px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    const milieu = G.bande(k, [bas], { colonne: true, padV: ["56px", "48px", "44px"], padH: ["56px", "40px", "20px"], fond: S.alt, filetHaut: { epaisseur: "1px", couleur: S.line }, nom: "Lettre" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true, couleur: S.mute, liens: IVOIRE })(k, env);
    const pied = G.bande(k, [mentions], { colonne: true, padV: ["32px", "28px", "24px"], padB: ["20px", "20px", "16px"], padH: ["56px", "40px", "20px"], fond: S.bg });
    return [G.racine(k, [haut, milieu, pied])];
  },
}, FAM));
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-054 « Anse Turquoise » — resort fictif « Anse Bleue ». Turquoise profond, sable, or corail. Le geste : une grande CARTE SABLE décollée du bord, dont le haut est une ligne de vagues (festons) en deux nappes ;
// elle porte la marque, les liens, la lettre d'information en pilule, les coordonnées sur une ligne et les réseaux en disques ; les mentions restent sur le turquoise. Outfit (titres) + Urbanist (texte).
// Écart au concept : la photo optionnelle n'est pas posée (repli dégradé turquoise) ; les vagues sont des demi-ellipses CSS (aucun SVG, aucune image). Les couleurs de la carte (sable, brun) sont locales au bloc.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const anse = identite({
  key: "c054", label: "Turquoise, sable et or corail", humeur: "dark",
  fond: "#0e7490", texte: "#ffffff", discret: "#ddf3f8", accent: "#f4c27a", surface: "#0b6179",
  police: "font.urbanist", titres: "font.outfit", rayon: "36px", rayonBouton: "999px", ombre: "none", poids: "700", bordure: "0px", ligne: "#ffffff40",
});
modeles.push(modeleV2({
  id: identifiantV2(54, "anse-turquoise"), concept: "c-054-anse-turquoise", name: "Anse turquoise", family: FAM,
  description: "Un resort au bord de l'eau : une grande carte sable aux vagues en haut, posée sur un aplat turquoise. Marque, liens, lettre d'information en pilule, coordonnées d'une ligne et réseaux en disques ; les mentions restent sur le turquoise.",
  tags: ["resort", "plage", "carte décollée", "turquoise", "sable", "vagues", "newsletter"],
  identity: anse,
  racine: { desktop: { backgroundColor: "#0a5a70", gap: "0px" } },
  widgets: ["text", "emailsubscribe", "bizcontact", "social", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, SABLE = "#f6e7cb", BRUN = "#4a3418", MER = "#0b5f75", BRUN2 = "#7a5a2f";
    // 1 · les vagues : nappe du fond (turquoise plus clair, grandes ondes) puis nappe de sable (festons serrés) qui se raccorde à la carte
    const ondes = (n, hauteur, couleur, mobile) => k.row(Array.from({ length: n }, () => k.col([], { flexGrow: 1, flexBasis: "0px", height: hauteur, backgroundColor: couleur, borderTopLeftRadius: "100%", borderTopRightRadius: "100%" })), { gap: "0px", flexWrap: "nowrap", width: "100%", alignItems: "flex-end" }, undefined, mobile);
    const nappe1 = ondes(9, "44px", "#2a93ab", { }); nappe1.styles.desktop.marginBottom = "-30px"; nappe1.styles.mobile = { marginBottom: "-22px" };
    const nappe2 = ondes(18, "34px", SABLE); nappe2.styles.mobile = { };
    // 2 · la marque et les liens
    const marque = k.col([
      caps(k, "Resort &amp; spa", { couleur: BRUN2, suivi: "0.3em", extra: { textAlign: "center" } }),
      texte(k, "<p>Anse Bleue</p>", { police: S.head, taille: "fluid:48-104", lh: 1, couleur: MER, poids: "700", suivi: "-0.03em", align: "center" }),
    ], { gap: "8px", alignItems: "center", width: "100%" });
    const L = (l, u) => lien(k, l, u, { taille: 16, poids: "600", couleur: BRUN, survolCouleur: MER, focus: MER, h: "44px", padH: "4px" });
    const nav = separes(k, [L("Accueil", "/"), L("Le journal", "/blog"), L("Questions", "/faq"), L("Nous écrire", "/contact"), L("Mon espace", "/connexion")], { centre: true, couleurSigne: BRUN2 });
    // 3 · la lettre : champ en pilule blanche, bouton rond turquoise avec flèche
    const lettre = abo(k, env, { titre: "", intro: "Idées de séjours et temps calmes, sans spam.", bouton: "→", largeur: "520px", soulignement: "0px", fondChamp: "#ffffff", rembChamp: "24px", rayonChamp: "999px", accent: MER, texte: BRUN, tailleChamp: "17px", rayonBouton: "999px", survolBouton: BRUN, survolTexte: SABLE },
      { titre: { color: BRUN2 }, consent: { color: BRUN2 }, intro: { color: BRUN2, textAlign: "center", marginBottom: "12px" }, champ: { height: "56px", borderWidth: "1.5px", borderBottomWidth: "1.5px", borderColor: "#d9c49a" }, bouton: { width: "56px", minHeight: "56px", paddingLeft: "0px", paddingRight: "0px", fontSize: "26px", fontWeight: "500", color: "#ffffff", backgroundColor: MER }, manque: { color: BRUN, textAlign: "center" } }, { bouton: { width: "56px" } });
    lettre.styles.desktop = { ...lettre.styles.desktop, color: BRUN, marginLeft: "auto", marginRight: "auto" };
    // 4 · coordonnées d'une ligne et réseaux en disques de 44 px
    const coord = coordonnees(k, env, { ligne: true, taille: 15, couleur: BRUN });
    partie(coord, "icon", { color: MER }); partie(coord, "link", { color: BRUN }, { hover: { color: MER }, focus: G.focus(MER) });
    const disques = reseauxIcones(k, env, ["instagram", "facebook", "youtube"], { largeur: "44px", couleur: MER, contour: MER, survolFond: MER, survolCouleur: "#ffffff", focus: MER });
    const bas = G.ligne(k, [coord, disques], { gap: "18px 32px", aligne: "center", justifie: "space-between", largeur: "100%", tablette: { justifyContent: "center" }, mobile: { justifyContent: "center" } });
    const carte = k.col([marque, nav, lettre, hr(k, "#d9c49a"), bas], {
      backgroundColor: SABLE, color: BRUN, width: "100%", gap: "34px", alignItems: "center", borderBottomLeftRadius: "36px", borderBottomRightRadius: "36px", paddingTop: "40px", paddingBottom: "52px", paddingLeft: "64px", paddingRight: "64px", boxSizing: "border-box",
    }, { paddingLeft: "40px", paddingRight: "40px" }, { paddingTop: "20px", paddingBottom: "32px", paddingLeft: "20px", paddingRight: "20px", gap: "26px", borderBottomLeftRadius: "24px", borderBottomRightRadius: "24px" });
    const bloc = k.col([nappe1, nappe2, carte], { gap: "0px", width: "100%", maxWidth: "1180px", marginLeft: "auto", marginRight: "auto" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true, couleur: "#ddf3f8", liens: "#ffffff" })(k, env);
    const bande = G.bande(k, [bloc, mentions], { colonne: true, gap: "28px", padV: ["72px", "56px", "40px"], padB: ["24px", "24px", "20px"], padH: ["32px", "24px", "12px"], fond: "#0a5a70", degrade: { from: "#0e7490", to: "#0a5a70", angle: 180 }, innerMobile: { rowGap: "22px" }, nom: "Anse" });
    return [G.racine(k, [bande])];
  },
}, FAM));
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-055 « Heures du Four » — boulangerie fictive « Le Fournil de Jeanne ». Trois bandes de fonds différents : la croûte (brun foncé) porte le nom et la PASTILLE « ouvert / fermé » en forme de miche,
// calculée par le widget Horaires sur vos vraies heures (aucun faux message) ; la farine (crème) donne les heures et l'adresse ; la mie (sable) ne garde que trois liens et les mentions. Alegreya (titres) + Alegreya Sans (texte).
// Écart au concept : pas de texture de farine (aucune image) : seulement un dégradé chaud ; la pastille est le texte du widget Horaires (« ouvert maintenant » / « fermé actuellement ») : sans horaires renseignés, elle n'apparaît pas.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const fournil = identite({
  key: "c055", label: "Croûte, farine et braise", humeur: "light",
  fond: "#f3e3c3", texte: "#3a2412", discret: "#6b4a2c", accent: "#9a3a12", surface: "#e8d2a6",
  police: "font.alegreya-sans", titres: "font.alegreya", rayon: "28px", rayonBouton: "999px", ombre: "none", poids: "800", bordure: "0px", ligne: "#6b4a2c55",
});
modeles.push(modeleV2({
  id: identifiantV2(55, "heures-du-four"), concept: "c-055-heures-du-four", name: "Heures du four", family: FAM,
  description: "Une boulangerie en trois bandes : la croûte avec le nom et une pastille en forme de miche « ouvert maintenant » calculée sur vos vraies heures, la farine avec horaires et adresse, la mie avec trois liens.",
  tags: ["boulangerie", "statut ouvert", "horaires", "bandes", "croûte", "crème", "serif"],
  identity: fournil,
  racine: { desktop: { backgroundColor: "#e8d2a6", gap: "0px" } },
  widgets: ["text", "bizhours", "bizcontact", "social", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, CROUTE = "#3a2412", CREME = "#fff3dc", BRAISE = "#b5471b", ENCRE = S.fg, SABLE = S.alt;
    // 1 · la croûte : le nom en grand et la pastille-miche (widget Horaires : seul l'état du moment est gardé)
    const nom = k.col([caps(k, "Boulangerie · pâtisserie", { couleur: "#e8c48c", suivi: "0.24em" }), texte(k, "<p>Le Fournil<br>de Jeanne</p>", { police: S.head, taille: "fluid:44-104", lh: 0.98, couleur: CREME, poids: "800", suivi: "-0.02em" })], { gap: "14px" });
    const pastille = k.W("bizhours", { title: "En ce moment", showOpenNow: true, groupDays: true, showExceptions: false, showNote: false, closedLabel: "Fermé" }, { color: CREME, fontFamily: S.head, backgroundColor: BRAISE, borderTopLeftRadius: "160px", borderTopRightRadius: "160px", borderBottomLeftRadius: "70px", borderBottomRightRadius: "70px", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "48px", paddingRight: "48px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", boxSizing: "border-box", width: "100%" }, undefined, { paddingLeft: "24px", paddingRight: "24px", paddingTop: "32px", paddingBottom: "32px" });
    Moteur.finishNode(S, pastille);
    partie(pastille, "title", { fontFamily: S.font, fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.22em", color: CREME, marginBottom: "8px" });
    partie(pastille, "status", { fontFamily: S.head, fontSize: "fluid:26-46", lineHeight: 1.1, fontWeight: "800", color: CREME, marginBottom: "0px" });
    partie(pastille, "row", { display: "none" });
    const eclat = pastille;
    const r1 = G.bande(k, [G.colonne(k, [nom], { poids: 7, min: "300px", tablette: { flexBasis: "100%" } }), G.colonne(k, [eclat], { poids: 5, min: "280px", soi: "center", aligne: "stretch", base: "0px", tablette: { flexBasis: "100%" } })], { fond: CROUTE, degrade: { from: "#4a2f1a", to: "#352010", angle: 160 }, aligne: "center", gap: "36px 56px", padV: ["72px", "56px", "44px"], padH: ["56px", "40px", "20px"], nom: "Croûte" });
    // 2 · la farine : heures (widget réel) et adresse (widget réel)
    const h = k.W("bizhours", { title: "Les heures du four", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: ENCRE, fontSize: "19px", fontFamily: S.font, width: "100%" });
    Moteur.finishNode(S, h);
    partie(h, "title", { fontFamily: S.head, fontSize: "30px", fontWeight: "800", color: S.accent, marginBottom: "12px" });
    partie(h, "row", { fontSize: "19px", fontWeight: "600", color: ENCRE, paddingTop: "6px", paddingBottom: "6px", columnGap: "28px" });
    partie(h, "exceptions", { color: S.mute }); partie(h, "note", { color: S.mute, fontStyle: "italic" });
    const c = k.W("bizcontact", { title: "Au fournil", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: true, layout: "stack" }, { color: ENCRE, fontSize: "19px", fontFamily: S.font, lineHeight: 1.5, width: "100%" });
    Moteur.finishNode(S, c);
    partie(c, "title", { fontFamily: S.head, fontSize: "30px", fontWeight: "800", color: S.accent, marginBottom: "12px" });
    partie(c, "icon", { color: S.accent }); partie(c, "link", { color: ENCRE }, { hover: { color: S.accent }, focus: G.focus(S.accent) });
    const mot = texte(k, "<p>La mie, la croûte,<br>et le temps qu'il faut.</p>", { police: S.head, taille: "fluid:30-46", lh: 1.12, couleur: S.accent, poids: "700", italique: true });
    const r2 = G.bande(k, [G.colonne(k, [mot], { poids: 5, min: "300px", gap: "10px", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } }), G.colonne(k, [h], { poids: 4, min: "280px" }), G.colonne(k, [c], { poids: 3, min: "260px", extra: { borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "2px", borderColor: S.line, paddingLeft: "40px" }, tablette: { paddingLeft: "28px" }, mobile: { borderLeftWidth: "0px", paddingLeft: "0px", borderTopWidth: "2px", paddingTop: "28px" } })], { fond: S.bg, aligne: "flex-start", gap: "36px 48px", padV: ["72px", "56px", "44px"], padH: ["56px", "40px", "20px"], nom: "Farine" });
    // 3 · la mie : trois liens seulement, réseaux en disques, mentions
    const L = (l, u) => lien(k, l, u, { police: S.head, taille: 24, poids: "800", couleur: ENCRE, survolCouleur: S.accent, focus: S.accent, h: "44px", souligne: false });
    const liens = k.row([L("Nous écrire", "/contact"), L("Questions", "/faq"), L("Le journal", "/blog")], { ...G.gaps("4px 40px"), alignItems: "center" });
    const disques = reseauxIcones(k, env, ["instagram", "facebook"], { largeur: "44px", couleur: ENCRE, contour: ENCRE, survolFond: ENCRE, survolCouleur: SABLE, focus: ENCRE });
    const ligneBas = G.ligne(k, [liens, disques], { gap: "18px 40px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true, couleur: S.mute, liens: ENCRE })(k, env);
    const r3 = G.bande(k, [ligneBas, hr(k, S.line), mentions], { colonne: true, gap: "28px", fond: SABLE, padV: ["48px", "40px", "36px"], padB: ["24px", "24px", "20px"], padH: ["56px", "40px", "20px"], nom: "Mie" });
    return [G.racine(k, [r1, r2, r3])];
  },
}, FAM));
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-056 « Carte du Gîte » — gîte fictif « Les Genêts ». Lin, vert mousse, terre cuite. Le geste : la CARTE d'abord (la moitié du pied, cadre arrondi vert mousse), l'adresse réelle et trois lignes d'itinéraire à côté ;
// on trouve avant de lire. Une bande mousse en dessous porte les liens (volets sur mobile) et les mentions. Crimson Pro (titres) + Cabin (texte).
// Écart au concept : le widget Carte n'a qu'une adresse FIXE (il ne lit pas les Données de l'entreprise) : il montre « France » avec son titre « remplacez l'adresse par la vôtre » tant que l'adresse n'est pas saisie dans l'éditeur ;
// l'adresse réelle s'affiche à côté (widget Coordonnées). Les trois lignes d'itinéraire sont des phrases génériques (aucun fait inventé), à adapter. Carte tierce : le consentement est géré par le widget.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const genets = identite({
  key: "c056", label: "Lin, vert mousse et terre cuite", humeur: "light",
  fond: "#e9e2d0", texte: "#2d3a2a", discret: "#55624f", accent: "#8c4a2f", surface: "#d9cfb5",
  police: "font.cabin", titres: "font.crimson-pro", rayon: "22px", rayonBouton: "999px", ombre: "none", poids: "600", bordure: "0px", ligne: "#2d3a2a40",
});
modeles.push(modeleV2({
  id: identifiantV2(56, "carte-du-gite"), concept: "c-056-carte-du-gite", name: "Carte du gîte", family: FAM,
  description: "Un gîte où l'on trouve avant de lire : la carte occupe la moitié du pied dans un cadre arrondi, l'adresse réelle et trois lignes d'itinéraire à côté, puis une bande vert mousse avec les liens et les mentions.",
  tags: ["gîte", "carte", "adresse", "itinéraire", "lin", "vert mousse", "terre cuite"],
  identity: genets,
  racine: { desktop: { backgroundColor: "#2d3a2a", gap: "0px" } },
  widgets: ["map", "bizcontact", "text", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, MOUSSE = S.fg, TERRE = S.accent, LIN = S.bg, ARGILE = "#e9b99a";
    // 1 · la carte dans un cadre arrondi vert mousse (hauteur 380 px ; 240 px sur mobile)
    const carte = k.W("map", { address: "France", zoom: 5, height: 380, title: "Carte : remplacez l'adresse par la vôtre" }, { width: "100%", borderRadius: "26px", overflow: "hidden", borderStyle: "solid", borderWidth: "4px", borderColor: MOUSSE, backgroundColor: S.alt });
    partie(carte, "frame", { height: "380px", borderRadius: "22px", outlineStyle: "solid", outlineWidth: "3px", outlineColor: TERRE, outlineOffset: "3px" }, undefined, { height: "250px" });
    const gauche = G.colonne(k, [carte], { poids: 6, min: "300px", gap: "0px", mobile: { flexBasis: "100%" } });
    // 2 · à droite : le nom, l'adresse (widget réel), trois lignes d'itinéraire
    const nom = k.col([caps(k, "Gîte de charme", { couleur: TERRE, suivi: "0.22em" }), texte(k, "<p>Les Genêts</p>", { police: S.head, taille: "fluid:46-92", lh: 1, couleur: MOUSSE, poids: "700", suivi: "-0.02em" })], { gap: "6px" });
    const coord = coordonnees(k, env, { taille: 17, couleur: MOUSSE, lh: 1.5 });
    partie(coord, "icon", { color: TERRE }); partie(coord, "link", { color: MOUSSE }, { hover: { color: TERRE }, focus: G.focus(TERRE) });
    const etape = (titre, t) => k.col([caps(k, titre, { couleur: TERRE, suivi: "0.18em" }), texte(k, t, { taille: 16, couleur: MOUSSE, lh: 1.5 })], { gap: "2px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: S.line, paddingTop: "10px", width: "100%" });
    const itineraire = k.col([etape("En voiture", "Suivez le plan : l'adresse du gîte est pointée dessus."), etape("En train ou en bus", "Écrivez-nous, nous vous aidons à préparer le trajet."), etape("À pied ou à vélo", "Dites-nous quand vous arrivez, nous vous attendons.")], { gap: "10px", width: "100%" });
    const droite = G.colonne(k, [nom, coord, itineraire], { poids: 5, min: "300px", gap: "22px", mobile: { flexBasis: "100%" } });
    const r1 = G.bande(k, [G.ligne(k, [gauche, droite], { gap: "40px 64px", aligne: "center", justifie: "space-between", largeur: "100%" })], { colonne: true, fond: LIN, padV: ["88px", "64px", "48px"], padB: ["88px", "64px", "44px"], padH: ["56px", "40px", "20px"], nom: "Carte" });
    // 3 · la bande mousse : liens en colonnes (volets repliables sur mobile) puis mentions
    const lk = (l, u) => (k2) => lien(k2, l, u, { taille: 16, poids: "600", couleur: LIN, survolCouleur: ARGILE, focus: ARGILE, h: "36px" });
    const liens = accordeonEgal(k, env, [
      { title: "Le gîte", w: 1, codes: [lk("Accueil", "/"), lk("Le journal", "/blog"), lk("Questions fréquentes", "/faq")] },
      { title: "Pratique", w: 1, codes: [lk("Nous écrire", "/contact"), lk("Mon espace", "/connexion"), lk("Créer un compte", "/inscription")] },
      { title: "Nous suivre", w: 1, codes: RESEAUX.slice(0, 3).map(([l, u]) => (k2, e2) => G.lienFleche(l, u, { taille: 16, poids: "600", couleur: LIN, survol: ARGILE, focus: ARGILE })(k2, e2)) },
    ], { columnGap: "48px", width: "100%" }, "30%");
    liens.styles.desktop = { ...liens.styles.desktop, color: ARGILE, fontFamily: S.head, letterSpacing: "0.02em" };
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true, couleur: "#c9d2c1", liens: LIN })(k, env);
    const marque = G.colonne(k, [texte(k, "<p>Les Genêts</p>", { police: S.head, taille: "fluid:32-44", lh: 1.05, couleur: LIN, poids: "700" }), texte(k, "Gîte de charme. Écrivez-nous, nous répondons vite.", { taille: 15, couleur: "#c9d2c1", lh: 1.55, largeur: "260px" })], { poids: 0, base: "300px", min: "240px", gap: "10px", mobile: { flexBasis: "100%" } });
    const haut = G.ligne(k, [marque, G.colonne(k, [liens], { poids: 1, min: "0px", base: "0px", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } })], { gap: "36px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%", pas_de_ligne: false });
    const r2 = G.bande(k, [haut, hr(k, "#e9e2d040"), mentions], { colonne: true, gap: "36px", fond: MOUSSE, padV: ["64px", "52px", "40px"], padB: ["28px", "24px", "20px"], padH: ["56px", "40px", "20px"], nom: "Liens" });
    r2.styles.desktop.color = LIN; // la ligne légale de la plateforme reprend la couleur de texte de la dernière bande
    return [G.racine(k, [r1, r2])];
  },
}, FAM));

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-057 « Étiquette de Cave » — cave fictive « Clos Saint-Aubin ». Bordeaux profond, ivoire, or. Le geste : le pied EST une étiquette de bouteille : papier ivoire, double filet doré, cartouche ovale avec le nom et un millésime en chiffres romains,
// colonne unique de 460 px centrée sur le bordeaux. Mentions de santé publique (« L'abus d'alcool est dangereux », vente interdite aux mineurs) en bas de l'étiquette, comme sur une vraie bouteille. EB Garamond (titres) + Montserrat (texte).
// Le millésime « MMXXVI » et le nom sont des TEXTES D'EXEMPLE modifiables. Écart au concept : étiquette ivoire sur fond bordeaux (au lieu d'un texte ivoire sur fond bordeaux) : plus proche d'une vraie étiquette, mêmes couleurs.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const clos = identite({
  key: "c057", label: "Bordeaux, ivoire et or", humeur: "dark",
  fond: "#3a0f1c", texte: "#f6e9dd", discret: "#dcc3b2", accent: "#d9a441", surface: "#4a1727",
  police: "font.montserrat", titres: "font.eb-garamond", rayon: "2px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#d9a44166",
});
modeles.push(modeleV2({
  id: identifiantV2(57, "etiquette-de-cave"), concept: "c-057-etiquette-de-cave", name: "Étiquette de cave", family: FAM,
  description: "Le pied dessiné comme l'étiquette d'une bouteille : papier ivoire, double filet doré, cartouche ovale avec le nom et un millésime en chiffres romains, liens, lettre d'information et mentions de santé publique sur l'alcool.",
  tags: ["cave", "vin", "étiquette", "bordeaux", "ivoire", "or", "colonne étroite", "alcool"],
  identity: clos,
  racine: { desktop: { backgroundColor: "#2c0a15", gap: "0px" } },
  widgets: ["text", "emailsubscribe", "bizcontact", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, PAPIER = "#f6e9dd", ENCRE = "#3a0f1c", OR = "#8f6420", ENCRE2 = "#6b3a2c";
    // 1 · le cartouche ovale : double filet, nom en EB Garamond italique, millésime en chiffres romains
    const cartouche = k.col([
      caps(k, "Cave &amp; épicerie fine", { couleur: ENCRE2, suivi: "0.28em", taille: "11px", extra: { textAlign: "center" } }),
      texte(k, "<p>Clos<br>Saint-Aubin</p>", { police: S.head, taille: "fluid:34-48", lh: 1.05, couleur: ENCRE, poids: "500", italique: true, align: "center", suivi: "-0.01em" }),
      k.divider({ width: "56px", borderColor: OR, borderTopWidth: "1px", marginTop: "2px", marginBottom: "2px" }),
      caps(k, "Millésime MMXXVI", { couleur: ENCRE2, suivi: "0.24em", taille: "11px", extra: { textAlign: "center" } }),
    ], { alignItems: "center", justifyContent: "center", gap: "10px", width: "100%", maxWidth: "380px", minHeight: "270px", borderRadius: "50%", borderStyle: "double", borderWidth: "5px", borderColor: OR, boxSizing: "border-box", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "24px", paddingRight: "24px" }, undefined, { minHeight: "250px", paddingLeft: "12px", paddingRight: "12px" });
    // 2 · liens, lettre d'information (champ à simple filet, flèche en bout), coordonnées sur une ligne
    const L = (l, u) => lien(k, l, u, { taille: 12, poids: "600", couleur: ENCRE, survolCouleur: OR, focus: ENCRE, h: "44px", padH: "0px", casse: "uppercase", suivi: "0.06em" });
    const nav = separes(k, [L("Journal", "/blog"), L("Questions", "/faq"), L("Contact", "/contact"), L("Compte", "/connexion")], { centre: true, couleurSigne: ENCRE2 });
    const lettre = abo(k, env, { titre: "La lettre du clos", intro: "Quelques lignes, de temps en temps, sur la cave.", bouton: "→", largeur: "100%", soulignement: "1px", accent: ENCRE, texte: ENCRE, tailleChamp: "16px", survolBouton: OR, survolTexte: PAPIER },
      { titre: { fontFamily: S.head, fontSize: "24px", textTransform: "none", letterSpacing: "0", color: ENCRE, fontWeight: "500", fontStyle: "normal", textAlign: "center" }, intro: { color: ENCRE2, textAlign: "center", fontSize: "14px" }, champ: { borderColor: ENCRE, color: ENCRE }, bouton: { backgroundColor: "transparent", color: ENCRE, borderWidth: "0px", paddingLeft: "12px", paddingRight: "0px", fontSize: "26px", fontWeight: "400", minHeight: "56px" }, etatBouton: { hover: { backgroundColor: "transparent", color: OR } }, manque: { color: ENCRE, textAlign: "center" }, consent: { color: ENCRE2 } });
    lettre.styles.desktop = { ...lettre.styles.desktop, color: ENCRE };
    const coord = coordonnees(k, env, { ligne: true, taille: 13, couleur: ENCRE, icones: false });
    partie(coord, "link", { color: ENCRE }, { hover: { color: OR }, focus: G.focus(ENCRE) });
    coord.styles.desktop = { ...coord.styles.desktop, textAlign: "center" };
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"]], { taille: 13, poids: "600", couleur: ENCRE, survol: OR, focus: ENCRE })(k, env, true);
    // 3 · les mentions de santé publique, comme sur une vraie étiquette
    const alcool = k.col([texte(k, "L'abus d'alcool est dangereux pour la santé. À consommer avec modération.", { taille: 11, couleur: ENCRE, lh: 1.5, casse: "uppercase", suivi: "0.1em", align: "center", poids: "600" }), texte(k, "Vente interdite aux mineurs de moins de 18 ans.", { taille: 11, couleur: ENCRE2, lh: 1.5, casse: "uppercase", suivi: "0.1em", align: "center" })], { gap: "4px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#8f642066", paddingTop: "16px", width: "100%" });
    const trait = () => k.divider({ width: "100%", borderColor: "#8f642066", borderTopWidth: "1px", marginTop: "0px", marginBottom: "0px" });
    const interieur = k.col([cartouche, nav, trait(), lettre, coord, reseaux, alcool], { alignItems: "center", gap: "22px", width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "1px", borderColor: OR, paddingTop: "40px", paddingBottom: "32px", paddingLeft: "36px", paddingRight: "36px", color: ENCRE }, { paddingLeft: "28px", paddingRight: "28px" }, { paddingTop: "28px", paddingBottom: "24px", paddingLeft: "16px", paddingRight: "16px", gap: "18px" });
    const etiquette = k.col([interieur], { width: "100%", maxWidth: "460px", marginLeft: "auto", marginRight: "auto", backgroundColor: PAPIER, boxSizing: "border-box", padding: undefined, paddingTop: "10px", paddingBottom: "10px", paddingLeft: "10px", paddingRight: "10px", borderRadius: "2px", shadow: { x: 0, y: 28, blur: 56, spread: -20, color: "#000000cc" }, color: ENCRE }, undefined, { paddingTop: "8px", paddingBottom: "8px", paddingLeft: "8px", paddingRight: "8px" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true, couleur: "#dcc3b2", liens: "#f6e9dd" })(k, env, true);
    partie(mentions.children[1], "item", { justifyContent: "center" }); Object.assign(mentions.children[1].styles.desktop, { textAlign: "center", display: "flex", justifyContent: "center" });
    const bande = G.bande(k, [etiquette, mentions], { colonne: true, gap: "36px", padV: ["96px", "72px", "44px"], padB: ["28px", "24px", "20px"], padH: ["32px", "24px", "12px"], fond: "#2c0a15", degrade: { type: "radial", from: "#4a1727", to: "#2c0a15", angle: 0, toAt: 75 }, innerMobile: { rowGap: "28px" }, nom: "Étiquette" });
    return [G.racine(k, [bande])];
  },
}, FAM));
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-058 « Semaine en Frise » — office de tourisme fictif « Pays des Étangs ». Bleu ciel, blanc, bleu vif. Le geste : une FRISE de la semaine sous un grand titre et la date du jour (réelle), faite de tuiles blanches alimentées
// par la Liste dynamique du site (vos publications les plus récentes : jour, titre) ; puis un petit TABLEAU de liens (rubrique | lien), les coordonnées et la lettre d'information en pilule. Albert Sans (titres) + Epilogue (texte).
// Écarts au concept : il n'existe pas de flux d'événements dans la plateforme : la frise montre les dernières publications du blog (honnête), avec un message explicite quand il n'y en a pas encore (l'espace ne se masque pas tout seul) ;
// sur mobile, les tuiles s'empilent (pas de défilement horizontal : widget bandeau défilant à éviter). La date du jour est lue par le moteur (source « date du jour »), jamais écrite à la main.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const etangs = identite({
  key: "c058", label: "Bleu ciel, blanc et bleu vif", humeur: "light",
  fond: "#e6f4fa", texte: "#0b2a3c", discret: "#3c5a6e", accent: "#006aa6", surface: "#ffffff",
  police: "font.epilogue", titres: "font.albert-sans", rayon: "18px", rayonBouton: "999px", ombre: "none", poids: "700", bordure: "1px", ligne: "#0b2a3c33",
});
modeles.push(modeleV2({
  id: identifiantV2(58, "semaine-en-frise"), concept: "c-058-semaine-en-frise", name: "Semaine en frise", family: FAM,
  description: "Un office de tourisme en bleu ciel : barre de marque, grand titre avec la date du jour, frise de tuiles blanches alimentée par vos dernières publications, puis tableau de liens, coordonnées et lettre d'information en pilule.",
  tags: ["tourisme", "agenda", "frise", "tuiles", "bleu ciel", "tableau", "newsletter"],
  identity: etangs,
  racine: { desktop: { backgroundColor: "#e6f4fa", gap: "0px" } },
  widgets: ["querylist", "dyntext", "bizcontact", "emailsubscribe", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, MARINE = S.fg, BLEU = S.accent, BLANC = "#ffffff", FILET = "#bfe0ee";
    // 1 · la barre de marque (blanche, pleine largeur) : nom à gauche, accès à droite
    const marque = k.row([texte(k, "<p>Pays des Étangs</p>", { police: S.head, taille: "fluid:24-32", lh: 1, couleur: MARINE, poids: "800", suivi: "-0.01em" }), caps(k, "Office de tourisme", { couleur: S.mute, suivi: "0.18em", extra: { paddingTop: "4px" } })], { ...G.gaps("4px 16px"), alignItems: "baseline" });
    const acces = G.pilule("Mon espace", "/connexion", { contour: BLEU, couleur: BLEU, survolFond: BLEU, survolCouleur: BLANC, poids: "700" })(k);
    const barre = G.bande(k, [marque, acces], { fond: BLANC, aligne: "center", gap: "10px 24px", padV: ["18px", "16px", "12px"], padH: ["56px", "40px", "20px"], nom: "Marque" });
    // 2 · la frise : grand titre, date du jour (réelle), tuiles de la Liste dynamique
    const titre = k.col([caps(k, "Cette semaine", { couleur: BLEU, suivi: "0.2em" }), texte(k, "<p>Sept jours au<br>Pays des Étangs</p>", { police: S.head, taille: "fluid:38-84", lh: 1, couleur: MARINE, poids: "800", suivi: "-0.03em" })], { gap: "10px" });
    const dateTexte = { type: "dyntext", props: { source: "today", before: "", after: "", fallback: "", tag: "span" }, ...sty({ color: BLANC, fontFamily: S.head, fontSize: "fluid:24-36", fontWeight: "800", lineHeight: 1.1, letterSpacing: "-0.01em", display: "block" }) };
    const date = k.col([caps(k, "Aujourd'hui", { couleur: "#e6f4fa", suivi: "0.22em" }), dateTexte], { gap: "8px", backgroundColor: BLEU, borderRadius: "22px", paddingTop: "24px", paddingBottom: "26px", paddingLeft: "32px", paddingRight: "32px", alignSelf: "flex-end", maxWidth: "100%" }, undefined, { alignSelf: "stretch", paddingLeft: "22px", paddingRight: "22px" });
    const enTete = G.ligne(k, [titre, date], { gap: "20px 32px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    const frise = k.W("querylist", { title: "", source: "posts", mode: "recent", count: 6, layout: "cards", showImage: false, showExcerpt: false, showDate: true, showMeta: false, showCount: false, empty: "Les prochains rendez-vous du territoire apparaîtront ici dès leur publication." }, { width: "100%", color: MARINE, fontFamily: S.font });
    Moteur.finishNode(S, frise);
    partie(frise, "item", { backgroundColor: BLANC, borderStyle: "solid", borderWidth: "1px", borderTopWidth: "5px", borderColor: FILET, borderTopColor: BLEU, borderRadius: "18px", paddingTop: "20px", paddingBottom: "22px", paddingLeft: "20px", paddingRight: "20px" });
    partie(frise, "link", { fontFamily: S.head, fontSize: "21px", fontWeight: "800", lineHeight: 1.2, color: MARINE }, { hover: { color: BLEU }, focus: G.focus(BLEU) });
    partie(frise, "date", { fontFamily: S.font, fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.14em", color: BLEU, opacity: 1 });
    const plateau = k.col([frise], { width: "100%", backgroundColor: "#f4fbfe", borderStyle: "dashed", borderWidth: "1.5px", borderColor: "#7fb9d6", borderRadius: "24px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", boxSizing: "border-box" }, { paddingLeft: "20px", paddingRight: "20px" }, { paddingTop: "20px", paddingBottom: "20px", paddingLeft: "16px", paddingRight: "16px" });
    const fond = G.bande(k, [enTete, plateau], { colonne: true, gap: "40px", fond: S.bg, padV: ["72px", "56px", "40px"], padB: ["64px", "48px", "40px"], padH: ["56px", "40px", "20px"], nom: "Frise" });
    // 3 · tableau de liens, coordonnées, lettre en pilule
    const ligneTab = (rub, l, u, derniere) => k.row([caps(k, rub, { couleur: BLEU, suivi: "0.16em", extra: { width: "120px", flexShrink: 0 } }), lien(k, l, u, { taille: 16, poids: "700", couleur: MARINE, survolCouleur: BLEU, focus: BLEU, h: "44px", souligne: false })], { columnGap: "12px", alignItems: "center", flexWrap: "nowrap", width: "100%", paddingLeft: "16px", paddingRight: "16px", borderStyle: "solid", borderWidth: "0px", ...(derniere ? {} : { borderBottomWidth: "1px", borderColor: FILET }) });
    const tableau = k.col([ligneTab("Préparer", "Le journal", "/blog"), ligneTab("Pratique", "Questions fréquentes", "/faq"), ligneTab("Écrire", "Nous contacter", "/contact"), ligneTab("Compte", "Mon espace", "/connexion", true)], { gap: "0px", width: "100%", backgroundColor: BLANC, borderStyle: "solid", borderWidth: "1px", borderColor: FILET, borderRadius: "16px", overflow: "hidden" });
    const coord = k.W("bizcontact", { title: "Nous trouver", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: true, layout: "stack" }, { color: MARINE, fontSize: "15px", fontFamily: S.font, lineHeight: 1.5, width: "100%" });
    Moteur.finishNode(S, coord);
    partie(coord, "title", { fontFamily: S.font, fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.16em", color: BLEU, marginBottom: "12px" });
    partie(coord, "icon", { color: BLEU }); partie(coord, "link", { color: MARINE }, { hover: { color: BLEU }, focus: G.focus(BLEU) });
    const coordBloc = coord;
    const lettre = abo(k, env, { titre: "La lettre du pays", intro: "Les rendez-vous de la semaine, chaque semaine.", bouton: "Je m'abonne", largeur: "100%", soulignement: "0px", fondChamp: BLANC, rembChamp: "22px", rayonChamp: "999px", accent: BLEU, texte: MARINE, tailleChamp: "16px", survolBouton: MARINE, survolTexte: BLANC },
      { titre: { fontFamily: S.head, fontSize: "24px", textTransform: "none", letterSpacing: "-0.01em", color: MARINE, fontWeight: "800" }, intro: { color: S.mute }, champ: { height: "54px", borderWidth: "1.5px", borderBottomWidth: "1.5px", borderColor: FILET }, bouton: { minHeight: "54px", color: BLANC, backgroundColor: BLEU }, manque: { color: MARINE } });
    const colG = G.colonne(k, [tableau], { poids: 5, min: "300px", mobile: { flexBasis: "100%" } });
    const colM = G.colonne(k, [coordBloc], { poids: 3, min: "240px", mobile: { flexBasis: "100%" } });
    const colD = G.colonne(k, [lettre], { poids: 4, min: "280px", mobile: { flexBasis: "100%" } });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true, couleur: S.mute, liens: MARINE })(k, env);
    const bas = G.bande(k, [G.ligne(k, [colG, colM, colD], { gap: "36px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" }), hr(k, FILET), mentions], { colonne: true, gap: "36px", fond: S.bg, padV: ["8px", "8px", "8px"], padB: ["28px", "24px", "20px"], padH: ["56px", "40px", "20px"], nom: "Liens" });
    return [G.racine(k, [barre, fond, bas])];
  },
}, FAM));

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-059 « Commande en Grand » — burger de quartier fictif « Dalle ». Orange vif et brun noir. Le geste : un ÉNORME bouton « Commander » (Bebas Neue, jusqu'à 200 px) sur toute la largeur, brun noir sur orange ; dessous le
// numéro de téléphone en grand corps (widget Téléphone cliquable : lien tel:) et les horaires (widget réel) ; puis une bande brun noir avec les liens, les réseaux et les mentions. Bebas Neue (titres) + Karla (texte).
// Aucun faux délai ni promesse. Le bouton mène à la boutique de la plateforme (/boutique) : à remplacer par la page de commande du client dans l'éditeur. Sur mobile, le menu se replie derrière un bouton « Menu » (volet du moteur).
// Écart au concept : la flèche « → » n'existe pas dans Bebas Neue (police du système pour ce seul signe). Texte brun noir #1a0e00 sur orange #ff7a00 : contraste AA.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const dalle = identite({
  key: "c059", label: "Orange vif et brun noir", humeur: "light",
  fond: "#ff7a00", texte: "#1a0e00", discret: "#3a2000", accent: "#1a0e00", surface: "#ffb066",
  police: "font.karla", titres: "font.bebas-neue", rayon: "24px", rayonBouton: "24px", ombre: "none", poids: "700", bordure: "0px", ligne: "#1a0e0066",
});
modeles.push(modeleV2({
  id: identifiantV2(59, "commande-en-grand"), concept: "c-059-commande-en-grand", name: "Commande en grand", family: FAM,
  description: "Un burger de quartier tout en orange : un énorme bouton « Commander » sur toute la largeur, le téléphone en très grand corps, les horaires réels, puis une bande brun noir avec liens, réseaux et mentions. Menu replié sur mobile.",
  tags: ["burger", "commande", "bouton géant", "téléphone", "orange", "brun noir", "bebas neue"],
  identity: dalle,
  racine: { desktop: { backgroundColor: "#1a0e00", gap: "0px" } },
  widgets: ["text", "link", "bizphone", "bizhours", "social", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, NOIR = "#1a0e00", ORANGE = "#ff7a00", CREME = "#fff1e0", CLAIR = S.alt;
    // 1 · le nom et l'énorme bouton (un lien en bloc : Bebas Neue 72 → 200 px, flèche au bout)
    const nom = texte(k, "<p>Dalle</p>", { police: S.head, taille: "fluid:44-72", lh: 1, couleur: NOIR, suivi: "0.04em", casse: "uppercase" });
    const mot = caps(k, "Burgers de quartier", { couleur: NOIR, suivi: "0.22em" });
    const entete = G.ligne(k, [nom, mot], { gap: "4px 20px", aligne: "baseline", justifie: "space-between", largeur: "100%" });
    const geant = k.LINK("Commander →", "/boutique", { fontFamily: S.head, fontSize: "fluid:72-200", lineHeight: 0.92, fontWeight: "400", color: ORANGE, backgroundColor: NOIR, display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", boxSizing: "border-box", paddingTop: "34px", paddingBottom: "22px", paddingLeft: "44px", paddingRight: "44px", borderRadius: "28px", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.01em", transitionDuration: MS }, undefined);
    geant.styles.mobile = { fontSize: "58px", paddingTop: "24px", paddingBottom: "14px", paddingLeft: "20px", paddingRight: "20px", borderRadius: "20px", minHeight: "110px" };
    G.fini(k, geant, { hover: { backgroundColor: CREME, color: NOIR, textDecoration: "none" }, focus: { outlineStyle: "solid", outlineWidth: "4px", outlineColor: NOIR, outlineOffset: "5px" } });
    const r1 = G.bande(k, [entete, geant], { colonne: true, fond: ORANGE, gap: "28px", padV: ["56px", "44px", "32px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "16px"], nom: "Commander", innerMobile: { rowGap: "20px" } });
    // 2 · téléphone en grand corps (lien tel:) et horaires
    const tel = k.W("bizphone", { which: "1", prefix: "", showLabel: false, showIcon: false }, { color: NOIR, fontFamily: S.head, fontSize: "fluid:44-96", lineHeight: 1, letterSpacing: "0.02em" });
    Moteur.finishNode(S, tel);
    partie(tel, "link", { color: NOIR, fontFamily: S.head, fontSize: "fluid:44-96", lineHeight: 1, textDecoration: "none" }, { hover: { color: CREME, backgroundColor: NOIR }, focus: G.focus(NOIR) });
    const telBloc = G.colonne(k, [caps(k, "Une envie ? On décroche", { couleur: NOIR, suivi: "0.2em" }), tel], { poids: 6, min: "300px", gap: "8px", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } });
    const h = k.W("bizhours", { title: "Ouvert", showOpenNow: true, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: NOIR, fontSize: "17px", fontFamily: S.font, width: "100%" });
    Moteur.finishNode(S, h);
    partie(h, "title", { fontFamily: S.head, fontSize: "32px", fontWeight: "400", letterSpacing: "0.04em", color: NOIR, textTransform: "uppercase", marginBottom: "8px" });
    partie(h, "status", { fontFamily: S.font, fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.14em", color: NOIR });
    partie(h, "row", { fontWeight: "700", color: NOIR, paddingTop: "4px", paddingBottom: "4px", columnGap: "24px" });
    partie(h, "exceptions", { color: NOIR }); partie(h, "note", { color: NOIR });
    const hBloc = G.colonne(k, [h], { poids: 5, min: "280px", extra: { borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "3px", borderColor: NOIR, paddingLeft: "36px" }, tablette: { flexBasis: "100%", borderLeftWidth: "0px", paddingLeft: "0px", borderTopWidth: "3px", paddingTop: "24px" }, mobile: { flexBasis: "100%", borderLeftWidth: "0px", paddingLeft: "0px", borderTopWidth: "3px", paddingTop: "24px" } });
    const r2 = G.bande(k, [G.ligne(k, [telBloc, hBloc], { gap: "32px 48px", aligne: "center", justifie: "space-between", largeur: "100%" })], { colonne: true, fond: CLAIR, padV: ["56px", "44px", "36px"], padH: ["48px", "32px", "16px"], nom: "Téléphone" });
    // 3 · bande brun noir : liens (ligne sur ordinateur et tablette, volet « Menu » sur mobile), réseaux, mentions
    const lk = (l, u) => (k2) => lien(k2, l, u, { police: S.head, taille: 26, poids: "400", couleur: CREME, survolCouleur: ORANGE, focus: ORANGE, h: "44px", casse: "uppercase", suivi: "0.06em" });
    const liensLigne = k.row([lk("Nous écrire", "/contact")(k), lk("Questions", "/faq")(k), lk("Le journal", "/blog")(k), lk("Mon espace", "/connexion")(k)], { ...G.gaps("0px 36px"), alignItems: "center" });
    liensLigne.hideOn = ["mobile"];
    const menuMobile = accordeon(k, env, [{ title: "Menu", w: 1, codes: [lk("Nous écrire", "/contact"), lk("Questions", "/faq"), lk("Le journal", "/blog"), lk("Mon espace", "/connexion")] }], { start: "none", min: "0px" });
    menuMobile.hideOn = ["desktop", "tablet"];
    menuMobile.styles.desktop = { ...menuMobile.styles.desktop, color: ORANGE, fontFamily: S.head, fontSize: "30px", letterSpacing: "0.06em", textTransform: "uppercase", width: "100%" };
    const disques = reseauxIcones(k, env, ["instagram", "facebook", "tiktok"], { largeur: "44px", couleur: CREME, contour: CREME, survolFond: ORANGE, survolCouleur: NOIR, focus: ORANGE });
    const barre = G.ligne(k, [liensLigne, menuMobile, disques], { gap: "12px 40px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true, couleur: "#d9c3a8", liens: CREME })(k, env);
    const r3 = G.bande(k, [barre, hr(k, "#fff1e033"), mentions], { colonne: true, fond: NOIR, gap: "24px", padV: ["40px", "32px", "28px"], padB: ["24px", "24px", "20px"], padH: ["48px", "32px", "16px"], nom: "Liens" });
    r3.styles.desktop.color = CREME;
    return [G.racine(k, [r1, r2, r3])];
  },
}, FAM));
// @@MODELES

module.exports = {
  key: "restauration-hotellerie-tourisme", label: "Restauration, hôtellerie et tourisme", target: 8, built: true,
  description: "Restaurants, hôtels, gîtes et lieux de voyage : horaires, adresse, réservation et ambiance chaleureuse.",
  models: modeles,
};
