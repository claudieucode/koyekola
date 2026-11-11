// Famille v2 « Culture et événementiel » — 6 modèles (concepts c-079 à c-084 de docs/footer-v2/CONCEPTS_100.md).
// Chaque modèle est INDÉPENDANT du site (solo) : ses couleurs en hexadécimal, ses polices de la bibliothèque, ses jetons --ft-*. Marques FICTIVES (texte modifiable dans l'éditeur).
// Honnêteté : AUCUNE date ni heure d'événement n'est présentée comme réelle ; les noms d'artistes, spectacles, séances, cotes et infos d'accès sont des EXEMPLES clairement signalés (« exemple », « à remplacer »).
// Adresse, téléphone, e-mail et horaires viennent des widgets EXISTANTS (Données de l'entreprise). Aucun compte à rebours, aucune rareté, aucun « presque complet ».
// Polices d'affichage testées à 150 px (méthode du guide §5 bis, accents regardés sur capture) : Anton, Cormorant Garamond 700, Gentium Plus, Onest 800, Libre Franklin 800, Overpass 800, Rubik Mono One,
// Bagel Fat One, League Gothic : rendu PROPRE. Écarts aux concepts : Rubik Mono One (c-079) → Anton (affiche plus lisible, noms longs) ; Cormorant SC (c-080) → Cormorant Garamond en capitales ; Bowlby One (c-082) → Bagel Fat One
// (Bowlby One est « craquelé » en grand corps).
const { modeleV2, identifiantV2, identite, G, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "culture-evenementiel";
const MS = G.MOUVEMENT;

// ── Aides locales ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const partie = (n, cle, styles, etats, mobile) => Moteur.mergePart(n, cle, { styles: { desktop: styles, ...(mobile ? { mobile } : {}) }, ...(etats ? { states: etats } : {}) });
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.16em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, textAlign: o.align, ...(o.extra || {}) }), o.tablette, o.mobile);
const texte = (k, html, o = {}) => k.T(/^\s*</.test(html) ? html : `<p>${html}</p>`, compact({ fontSize: o.taille === undefined ? "15px" : (typeof o.taille === "number" ? `${o.taille}px` : o.taille), lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, fontWeight: o.poids, letterSpacing: o.suivi, textTransform: o.casse, textAlign: o.align, maxWidth: o.largeur, fontStyle: o.italique ? "italic" : undefined, ...(o.extra || {}) }), o.tablette, o.mobile);
function lien(k, label, url, o = {}) {
  const S = k.S;
  const n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.souligne ? "underline" : "none", display: "inline-flex", alignItems: "center", minHeight: o.h || "44px", letterSpacing: o.suivi, textTransform: o.casse, lineHeight: o.lh || 1.3, transitionDuration: MS, ...(o.extra || {}) }));
  return G.fini(k, n, { hover: o.survol || { textDecoration: "underline", color: o.survolCouleur || o.couleur || S.fg }, focus: G.focus(o.focus || o.couleur || S.accent) });
}
const hr = (k, couleur, ep = "1px", style) => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: ep, ...(style ? { borderStyle: style } : {}), marginTop: "0px", marginBottom: "0px" });
const vide = (k, st, tab, mob) => k.col([], st, tab, mob); // petit bloc décoratif sans texte (perle, trait, pli de velours)
// widgets de données habillés, puis finis par le moteur
const coordonnees = (k, o = {}) => {
  const n = k.W("bizcontact", { title: o.titre || "", showName: false, showAddress: o.adresse !== false, showPhone: o.tel !== false, showEmail: o.mail !== false, showIcons: !!o.icones, layout: o.ligne ? "inline" : "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: o.lh || 1.55, width: "100%" });
  Moteur.finishNode(k.S, n);
  if (o.titre) partie(n, "title", o.styleTitre || { fontFamily: k.S.head, fontSize: "20px", color: o.couleurTitre || k.S.fg, marginBottom: "8px" });
  partie(n, "link", { color: o.couleurLien || o.couleur || k.S.fg }, { hover: { color: o.survol || o.couleur || k.S.fg, textDecoration: "underline" }, focus: G.focus(o.focus || k.S.accent) });
  if (o.couleurIcone) partie(n, "icon", { color: o.couleurIcone });
  return n;
};
function horaires(k, o = {}) {
  const S = k.S;
  const n = k.W("bizhours", { title: o.titre || "", showOpenNow: o.statut !== false, groupDays: true, showExceptions: o.exceptions !== false, showNote: o.note !== false, closedLabel: "Fermé" }, { color: o.couleur || S.fg, fontSize: `${o.taille || 15}px`, fontFamily: S.font, width: "100%" });
  Moteur.finishNode(S, n);
  if (o.titre) partie(n, "title", { fontFamily: o.policeTitre || S.head, fontSize: o.tailleTitre || "20px", fontWeight: o.poidsTitre || "400", color: o.couleurTitre || S.fg, marginBottom: "8px", textTransform: o.casseTitre });
  partie(n, "status", { fontFamily: S.font, fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.14em", color: o.couleurStatut || o.couleur || S.fg, marginBottom: "10px" });
  partie(n, "row", { fontFamily: S.font, fontSize: `${o.taille || 15}px`, color: o.couleur || S.fg, paddingTop: "4px", paddingBottom: "4px", columnGap: "20px" });
  partie(n, "exceptions", { color: o.couleurDiscret || S.mute, fontSize: "13px" });
  partie(n, "note", { color: o.couleurDiscret || S.mute, fontSize: "13px" });
  return n;
}
// widget e-mail habillé puis recoloré : patch = { titre, intro, champ, bouton, consent, manque, etatBouton } (styles desktop)
function abo(k, env, o = {}, patch = {}) {
  const n = G.abonnement(o)(k, env);
  const map = { titre: "title", intro: "intro", champ: "input", bouton: "button", consent: "consent", manque: "missing" };
  for (const [kk, pp] of Object.entries(map)) if (patch[kk]) n.parts[pp].styles.desktop = { ...n.parts[pp].styles.desktop, ...patch[kk] };
  if (patch.etatBouton) n.parts.button.states = { ...n.parts.button.states, ...patch.etatBouton };
  return n;
}
// Réseaux en icônes (carrés de 44 px) aux couleurs du modèle
function reseauxIcones(k, env, liste, o = {}) {
  const S = k.S, n = Moteur.item(k, `socials:${liste.join("+")}`, env);
  n.props.size = String(o.taille || 44); n.props.shape = o.forme || "square";
  Moteur.mergePart(n, "link", { styles: { desktop: compact({ color: o.couleur || S.fg, backgroundColor: o.fond, borderStyle: o.contour ? "solid" : undefined, borderWidth: o.contour ? "1px" : undefined, borderColor: o.contour, transitionDuration: MS }) },
    states: { hover: { backgroundColor: o.survolFond || S.accent, color: o.survolCouleur || S.onAccent, borderColor: o.survolFond || S.accent }, focus: G.focus(o.focus || S.accent) } });
  return n;
}
const RESEAUX = [["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"], ["Facebook", "https://www.facebook.com/"]];
// décor SVG (variantes large / étroite, masquées par écran ; aria-hidden, sans texte lisible)
const svgHtml = (k, large, etroit, st) => [
  { ...k.W("html", { html: large }, compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st })), hideOn: ["mobile"] },
  { ...k.W("html", { html: etroit }, compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st })), hideOn: ["desktop", "tablet"] },
];
const svg = (W, H, corps) => `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${corps}</svg>`;
const r1 = (n) => Math.round(n * 10) / 10;

const modeles = [];

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-079 « Affiche de festival » — festival fictif « Plein Phare ». Rose vif, noir, jaune. Le geste : une AFFICHE typographique : la programmation d'EXEMPLE en Anton, en pyramide de tailles (tête d'affiche à 196 px,
// puis 112, 60, 34), noms séparés par des points ronds ; dessous, une bande jaune coupée en DIAGONALE (dégradé à arrêts nets) porte la billetterie (bouton noir) et la lettre d'information ; une bande noire pour les liens et réseaux.
// Pas d'urgence factice : un seul bouton « Réserver ma place » vers la boutique du site. Noms d'artistes inventés. Work Sans (texte) + Anton (affiche).
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const pleinPhare = identite({
  key: "c079", label: "Rose vif, noir et jaune", humeur: "light",
  fond: "#f72585", texte: "#1a0010", discret: "#3d0024", accent: "#1a0010", surface: "#ffe600",
  police: "font.work-sans", titres: "font.anton", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#1a001066",
});
modeles.push(modeleV2({
  id: identifiantV2(79, "affiche-de-festival"), concept: "c-079-affiche-de-festival", name: "Affiche de festival", family: FAM,
  description: "Une vraie affiche de festival : programmation en lettres géantes de tailles décroissantes sur rose vif, bande jaune en diagonale pour la billetterie et la lettre d'information, bande noire pour les liens et les réseaux.",
  tags: ["festival", "musique", "affiche", "programmation", "billetterie", "rose", "jaune", "anton"],
  identity: pleinPhare,
  racine: { desktop: { backgroundColor: "#1a0010", gap: "0px" } },
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ROSE = "#f72585", NOIR = "#1a0010", JAUNE = "#ffe600", BLANC = "#ffffff";
    // 1 · l'affiche : quatre lignes en pyramide (Anton, capitales, centrées). Les noms ne se coupent jamais en leur milieu (espaces insécables)
    const aff = (html, taille, tab, mob, couleur, lh = 0.94) => G.texteFluide(html, { taille, tablette: { taille: tab }, mobile: { taille: mob }, lh, suivi: "0.005em", poids: "400", police: S.head, couleur: couleur || NOIR, casse: "uppercase", align: "center" })(k, env);
    const L1 = aff("Lune&nbsp;Verdier", [64, 196], [120, 150], "68px");
    const L2 = aff("Fanfare&nbsp;Cerise&nbsp;• Rayon&nbsp;Vert", [34, 112], [58, 84], "38px", BLANC, 1);
    const L3 = aff("Anaïs&nbsp;Boro&nbsp;• Sol&nbsp;Aubade&nbsp;• Les&nbsp;Hautes&nbsp;Marées", [22, 60], [32, 46], "27px", NOIR, 1.1);
    const L4 = aff("Tilda&nbsp;• Mamie&nbsp;Disco&nbsp;• Basile&nbsp;&amp;&nbsp;Co&nbsp;• Kiosque&nbsp;• DJ&nbsp;Mistral&nbsp;• Orchestre&nbsp;Pavé", [15, 32], [20, 28], "19px", NOIR, 1.3);
    const entete = G.ligne(k, [caps(k, "Plein Phare · le festival", { couleur: NOIR, poids: "800", suivi: "0.2em" }), caps(k, "Affiche d'exemple : remplacez les noms par votre programmation", { couleur: S.mute, suivi: "0.1em", poids: "600", extra: { textAlign: "right" }, mobile: { textAlign: "left" } })], { gap: "8px 32px", aligne: "baseline", justifie: "space-between", largeur: "100%" });
    const affiche = k.col([L1, L2, L3, L4], { gap: "6px", alignItems: "center", width: "100%" }, undefined, { gap: "8px" });
    const r1b = G.bande(k, [entete, hr(k, NOIR, "3px"), affiche], { colonne: true, fond: ROSE, gap: "28px", padV: ["72px", "56px", "40px"], padB: ["64px", "48px", "40px"], padH: ["48px", "32px", "16px"], nom: "Affiche", innerMobile: { rowGap: "22px" } });
    // 2 · bande jaune coupée en diagonale : billetterie (bouton noir) + lettre d'information
    const titre = G.geant("<p>Billetterie</p>", { taille: [56, 150], tablette: { taille: [96, 130] }, mobile: { taille: [60, 72] }, lh: 0.92, suivi: "0.005em", poids: "400", police: S.head, couleur: NOIR, casse: "uppercase" })(k, env);
    const bouton = k.LINK("Réserver ma place", "/boutique", { fontFamily: S.head, fontSize: "26px", fontWeight: "400", letterSpacing: "0.06em", textTransform: "uppercase", color: JAUNE, backgroundColor: NOIR, display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "64px", paddingLeft: "40px", paddingRight: "40px", textDecoration: "none", transitionDuration: MS });
    G.fini(k, bouton, { hover: { backgroundColor: ROSE, color: NOIR }, focus: { outlineStyle: "solid", outlineWidth: "3px", outlineColor: NOIR, outlineOffset: "4px" } });
    const mot = G.phrase("Les places se réservent ici, sur la billetterie du festival. Pas de compte à rebours, pas de pression.", { taille: 16, largeur: "440px", couleur: NOIR })(k, env);
    const gauche = G.colonne(k, [caps(k, "Billetterie officielle", { couleur: NOIR, suivi: "0.2em" }), titre, mot, bouton], { poids: 7, min: "300px", gap: "16px", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } });
    const lettre = abo(k, env, { titre: "La lettre du festival", intro: "Programmation et annonces, une fois de temps en temps.", bouton: "S'abonner", largeur: "460px", accent: NOIR, texte: NOIR, soulignement: "3px" }, { titre: { color: NOIR, fontWeight: "800" }, intro: { color: NOIR }, consent: { color: NOIR }, bouton: { fontFamily: S.head, fontWeight: "400", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: "20px", borderRadius: "0px", color: JAUNE }, etatBouton: { hover: { backgroundColor: ROSE, color: NOIR } } });
    const droite = G.colonne(k, [lettre], { poids: 5, min: "280px", soi: "flex-end", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } });
    const corps2 = G.ligne(k, [gauche, droite], { gap: "40px 64px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    const r2 = G.bande(k, [corps2], { colonne: true, fond: JAUNE, degrade: { from: ROSE, to: JAUNE, angle: 176, fromAt: 0, toAt: 100, extra: [{ color: ROSE, at: 9 }, { color: JAUNE, at: 9 }] }, padV: ["120px", "96px", "72px"], padB: ["72px", "56px", "48px"], padH: ["48px", "32px", "16px"], nom: "Billetterie", innerMobile: { rowGap: "28px" } });
    // 3 · bande noire : liens en capitales, réseaux en noms, mentions
    const liensNav = G.ligne(k, [["Programme", "/blog"], ["Infos pratiques", "/faq"], ["Contact", "/contact"], ["Mon compte", "/connexion"]].map(([l, u]) => lien(k, l, u, { police: S.head, taille: 24, poids: "400", couleur: BLANC, survolCouleur: ROSE, focus: ROSE, casse: "uppercase", suivi: "0.06em" })), { gap: "0px 36px", aligne: "center", justifie: "flex-start", largeur: "100%" });
    const reseaux = G.ligne(k, [caps(k, "Suivez-nous", { couleur: "#e9c9d8" }), ...RESEAUX.map(([l, u]) => lien(k, l, u, { taille: 15, poids: "700", couleur: BLANC, survolCouleur: ROSE, focus: ROSE }))], { gap: "0px 28px", aligne: "center" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true, couleur: "#e9c9d8", liens: BLANC })(k, env);
    const r3 = G.bande(k, [liensNav, reseaux, hr(k, "#ffffff33"), mentions], { colonne: true, fond: NOIR, gap: "20px", padV: ["48px", "40px", "32px"], padB: ["24px", "24px", "20px"], padH: ["48px", "32px", "16px"], nom: "Liens", innerMobile: { rowGap: "18px" } });
    r3.styles.desktop.color = BLANC;
    return [G.racine(k, [r1b, r2, r3])];
  },
}, FAM));

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-080 « Rideau de scène » — théâtre fictif « Théâtre de la Rotonde ». Bordeaux, or, ivoire. Le geste : un VRAI rideau de velours : deux drapés de plis (colonnes à dégradés d'ombre et de lumière) encadrent la scène,
// un lambrequin plissé à cordon d'or la couronne, et au centre la FRISE de la saison : une ligne d'or, cinq perles, cinq spectacles d'EXEMPLE (titres inventés, aucune date). Dessous : adresse (widget réel), trois liens,
// carte de lettre d'information, réseaux « ↗ ». Cormorant Garamond (capitales espacées) + Raleway. Les plis sont des dégradés CSS (pas de texte dessus) : aucune image.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const rotonde = identite({
  key: "c080", label: "Bordeaux, or et ivoire", humeur: "dark",
  fond: "#4a0e1a", texte: "#f8ebdd", discret: "#e1c6b8", accent: "#e8b04f", surface: "#5d1424",
  police: "font.raleway", titres: "font.cormorant-garamond", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#e8b04f66",
});
// plis de velours : une colonne = un dégradé horizontal (ombre, lumière, ombre, reflet) ; les colonnes voisines ne se répètent pas
const PLIS = [
  ["#2c060f", "#6e1a2f", "#350812", "#5a1424"], ["#33070f", "#7a1e34", "#3d0a15", "#63172a"], ["#2a050d", "#661629", "#310710", "#521120"],
  ["#36080f", "#74192e", "#400b16", "#5f162a"], ["#2d060e", "#6b1a2d", "#370913", "#581323"],
];
function drape(k, { largeur, tablette, mobile, miroir }) {
  const cols = (miroir ? PLIS.slice().reverse() : PLIS).map((t, i) => {
    const [a, b, c, d] = miroir ? [t[0], t[3], t[2], t[1]] : t;
    return vide(k, { flexBasis: "0px", flexGrow: [1, 1.5, 1.1, 1.6, 1.2][i % 5], alignSelf: "stretch", gradient: { from: a, to: a, angle: 90, fromAt: 0, toAt: 100, extra: [{ color: b, at: 30 }, { color: c, at: 55 }, { color: d, at: 80 }] } });
  });
  return k.row(cols, { gap: "0px", flexWrap: "nowrap", alignItems: "stretch", width: largeur, flexShrink: 0, flexGrow: 0, borderStyle: "solid", borderWidth: "0px", [miroir ? "borderRightWidth" : "borderLeftWidth"]: "0px", [miroir ? "borderLeftWidth" : "borderRightWidth"]: "3px", borderColor: "#e8b04f" }, { width: tablette }, { width: mobile });
}
modeles.push(modeleV2({
  id: identifiantV2(80, "rideau-de-scene"), concept: "c-080-rideau-de-scene", name: "Rideau de scène", family: FAM,
  description: "Un rideau de velours bordeaux qui s'ouvre sur la frise de la saison : cinq spectacles sur un fil d'or, adresse du théâtre, trois liens, carte de lettre d'information et réseaux. Capitales de style classique, or et ivoire.",
  tags: ["théâtre", "rideau", "velours", "bordeaux", "or", "saison", "frise", "serif"],
  identity: rotonde,
  racine: { desktop: { backgroundColor: "#2c060f", gap: "0px" } },
  widgets: ["sitetitle", "text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, OR = S.accent, IVOIRE = S.fg, SOMBRE = "#2c060f";
    // 1 · lambrequin : bande de plis couronnée d'un cordon d'or
    const lamb = k.row(Array.from({ length: 16 }, (_, i) => vide(k, { flexBasis: "0px", flexGrow: 1, height: "44px", gradient: { from: i % 2 ? "#33070f" : "#2a050d", to: i % 2 ? "#2a050d" : "#33070f", angle: 90, extra: [{ color: i % 2 ? "#6e1a2f" : "#5a1424", at: 50 }] } })), { gap: "0px", flexWrap: "nowrap", width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "4px", borderColor: OR, alignItems: "stretch" });
    // 2 · le nom (widget Titre du site), cordon d'or, mot d'accueil
    const nom = Moteur.finishNode(S, k.siteTitle({ fontFamily: S.head, fontSize: "fluid:30-68", fontWeight: "600", lineHeight: 1.05, letterSpacing: "0.1em", textTransform: "uppercase", color: IVOIRE, textAlign: "center", overflowWrap: "break-word" }));
    const cordon = k.row([vide(k, { flexBasis: "0px", flexGrow: 1, height: "1px", backgroundColor: OR }), vide(k, { width: "10px", height: "10px", borderRadius: "50%", backgroundColor: OR, flexShrink: 0 }), vide(k, { flexBasis: "0px", flexGrow: 1, height: "1px", backgroundColor: OR })], { gap: "14px", alignItems: "center", flexWrap: "nowrap", width: "100%", maxWidth: "420px", marginLeft: "auto", marginRight: "auto" });
    const accueil = k.col([caps(k, "Théâtre · saison d'exemple", { couleur: OR, align: "center", suivi: "0.28em" }), nom, cordon], { gap: "16px", alignItems: "center", width: "100%" });
    // 3 · la frise : cinq spectacles d'EXEMPLE sur un fil d'or (la ligne se prolonge d'une entrée à l'autre)
    const SPECTACLES = [["La Tempête des Marges", "Théâtre"], ["Nuit d'Orphée", "Danse"], ["Le Sixième Étage", "Comédie"], ["Mélodies du Soir", "Musique"], ["Contes pour Demain", "Jeune public"]];
    const entree = ([titre, genre]) => k.col([
      k.row([vide(k, { width: "11px", height: "11px", borderRadius: "50%", backgroundColor: OR, flexShrink: 0 }), vide(k, { flexBasis: "0px", flexGrow: 1, height: "1px", backgroundColor: OR })], { gap: "0px", alignItems: "center", flexWrap: "nowrap", width: "100%" }),
      caps(k, genre, { couleur: OR, suivi: "0.2em", extra: { paddingTop: "14px" } }),
      lien(k, titre, "/blog", { police: S.head, taille: 25, poids: "600", lh: 1.15, couleur: IVOIRE, survolCouleur: OR, h: "44px", extra: { paddingRight: "20px", alignItems: "flex-start" } }),
    ], { flexBasis: "17%", flexGrow: 1, flexShrink: 1, minWidth: "150px", gap: "0px", alignItems: "flex-start" }, { flexBasis: "30%" }, { flexBasis: "100%" });
    const legendeFrise = caps(k, "Prochains spectacles · exemples à remplacer", { couleur: S.mute, align: "center", extra: { width: "100%", paddingBottom: "4px" } });
    const bandeFrise = k.row([legendeFrise, ...SPECTACLES.map(entree)], { ...G.gaps("28px 0px"), alignItems: "flex-start", width: "100%", flexWrap: "wrap" });
    // 4 · infos : adresse réelle + réseaux, trois liens, carte de lettre d'information
    const adresse = coordonnees(k, { titre: "Venir au théâtre", taille: 15, couleur: IVOIRE, couleurLien: IVOIRE, survol: OR, styleTitre: { fontFamily: S.head, fontSize: "22px", fontWeight: "600", color: IVOIRE, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" } });
    const reseaux = G.reseauxTexte(RESEAUX, { taille: 14, couleur: IVOIRE, survol: OR })(k, env);
    const colAdresse = G.colonne(k, [adresse, reseaux], { poids: 4, min: "240px", gap: "10px", tablette: { flexBasis: "46%" }, mobile: { flexBasis: "100%" } });
    const troisLiens = k.col([["Billetterie et contact", "/contact"], ["Questions fréquentes", "/faq"], ["Mon compte", "/connexion"]].map(([l, u]) => lien(k, l, u, { taille: 15, couleur: IVOIRE, survolCouleur: OR, poids: "600" })), { gap: "0px" });
    const colLiens = G.colonne(k, [caps(k, "Le théâtre", { couleur: OR, suivi: "0.22em" }), troisLiens], { poids: 3, min: "200px", gap: "8px", tablette: { flexBasis: "46%" }, mobile: { flexBasis: "100%" } });
    const carte = k.col([abo(k, env, { titre: "Lettre d'information", intro: "Les nouveaux spectacles, directement dans votre boîte.", bouton: "S'abonner", largeur: "100%", accent: OR, texte: IVOIRE, soulignement: "1px", fondChamp: "transparent" }, { titre: { color: OR, fontFamily: S.head, fontSize: "22px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "600" }, intro: { color: S.mute, fontSize: "14px" }, bouton: { borderRadius: "0px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "13px" } })], { backgroundColor: S.alt, borderStyle: "solid", borderWidth: "1px", borderColor: "#e8b04f88", paddingTop: "26px", paddingBottom: "26px", paddingLeft: "26px", paddingRight: "26px", width: "100%", boxSizing: "border-box" }, undefined, { paddingLeft: "18px", paddingRight: "18px" });
    const colCarte = G.colonne(k, [carte], { poids: 5, min: "280px", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } });
    const infos = G.ligne(k, [colAdresse, colLiens, colCarte], { gap: "32px 40px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true, couleur: "#e1c6b8", liens: IVOIRE })(k, env, true);
    const centre = k.col([accueil, bandeFrise, hr(k, "#e8b04f55"), infos, mentions], { flexBasis: "0px", flexGrow: 1, minWidth: "0px", gap: "48px", paddingTop: "64px", paddingBottom: "36px", paddingLeft: "44px", paddingRight: "44px", boxSizing: "border-box", gradient: { type: "radial", from: "#6a1829", to: "#43091a", angle: 180, extra: [{ color: "#55101f", at: 60 }] } },
      { paddingLeft: "28px", paddingRight: "28px", paddingTop: "48px", gap: "40px" }, { paddingLeft: "18px", paddingRight: "14px", paddingTop: "36px", paddingBottom: "28px", gap: "36px" });
    const scene = k.row([drape(k, { largeur: "13%", tablette: "8%", mobile: "7%" }), centre, drape(k, { largeur: "13%", tablette: "8%", mobile: "7%", miroir: true })], { gap: "0px", flexWrap: "nowrap", alignItems: "stretch", width: "100%", backgroundColor: SOMBRE });
    const bande = { type: "container", props: { full: true }, children: [lamb, scene], ...sty({ display: "flex", flexDirection: "column", width: "100%", gap: "0px", backgroundColor: SOMBRE }) };
    return [G.racine(k, [bande])];
  },
}, FAM));

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-081 « Numéros d'inventaire » — musée fictif « Musée du Port ». Gris pierre et beige. Le geste : chaque lien du site est une PIÈCE DE COLLECTION : un registre d'inventaire à trois colonnes (cote, intitulé, section) aux
// filets fins, cotes en mono fin. Les cotes (A.1998.04…) sont INVENTÉES, clairement signalées « fictives, non officielles ». À gauche, la colonne marque : le nom en grand Gentium Plus, adresse et horaires réels (widgets),
// réseaux « ↗ ». Pas de logo, pas de lettre d'information (le lien Contact joue l'appel discret). Gentium Plus + Overpass, et IBM Plex Mono pour les cotes (troisième famille, minuscule).
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const musee = identite({
  key: "c081", label: "Gris pierre et beige", humeur: "dark",
  fond: "#2f2e2b", texte: "#f1eee6", discret: "#c4c0b4", accent: "#d4c5a0", surface: "#3b3a36",
  police: "font.overpass", titres: "font.gentium-plus", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "1px", ligne: "#d4c5a066",
});
modeles.push(modeleV2({
  id: identifiantV2(81, "numeros-d-inventaire"), concept: "c-081-numeros-d-inventaire", name: "Numéros d'inventaire", family: FAM,
  description: "Un musée en gris pierre et beige : les liens du site rangés comme un registre d'inventaire (cotes fictives en mono fin, intitulés en serif), grand nom à gauche, adresse et horaires réels, sans logo ni lettre d'information.",
  tags: ["musée", "inventaire", "registre", "cotes", "pierre", "beige", "serif", "mono"],
  identity: musee,
  racine: { desktop: { backgroundColor: "#2f2e2b", gap: "0px" } },
  widgets: ["text", "link", "bizcontact", "bizhours", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, PIERRE = S.accent, MONO = "font.ibm-plex-mono", SOUS = "#d4c5a066";
    // 1 · colonne marque : le nom (texte modifiable), cartel, adresse et horaires réels, réseaux
    const nom = G.geant("<p>Musée<br>du&nbsp;Port</p>", { taille: [52, 112], tablette: { taille: [72, 96] }, mobile: { taille: [52, 64] }, lh: 0.98, suivi: "-0.01em", poids: "400", police: S.head, couleur: S.fg })(k, env);
    const cartel = texte(k, "Collections, expositions et ateliers. Texte d'exemple : décrivez ici votre musée en deux lignes.", { taille: 14, lh: 1.6, couleur: S.mute, largeur: "320px" });
    const adresse = coordonnees(k, { taille: 15, couleur: S.fg, couleurLien: S.fg, survol: PIERRE, lh: 1.6 });
    const heures = horaires(k, { taille: 14, couleur: S.mute, couleurStatut: PIERRE, statut: true });
    const reseaux = G.reseauxTexte(RESEAUX.slice(0, 3), { taille: 14, couleur: S.fg, survol: PIERRE })(k, env);
    const marque = G.colonne(k, [caps(k, "Établissement", { couleur: PIERRE, suivi: "0.22em", police: MONO, poids: "400", taille: "11px" }), nom, cartel, hr(k, SOUS), adresse, heures, reseaux], { poids: 4, min: "280px", gap: "18px", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } });
    // 2 · le registre : en-têtes, six « pièces » (cote · intitulé · section). Les cotes sont fictives.
    const PIECES = [["A.1998.04", "Accueil du musée", "/", "Entrée"], ["B.2004.17", "Le journal des collections", "/blog", "Archives"], ["C.2011.02", "Catalogue des œuvres", "/catalogue", "Fonds"], ["D.2015.31", "Boutique du musée", "/boutique", "Éditions"], ["E.2019.08", "Questions des visiteurs", "/faq", "Accueil"], ["F.2023.12", "Écrire au musée", "/contact", "Médiation"]];
    const cote = (t, extra = {}) => texte(k, t, { police: MONO, taille: 12, couleur: PIERRE, lh: 1.2, suivi: "0.04em", extra: { flexBasis: "112px", flexShrink: 0, ...extra } });
    const enTete = k.row([cote("Cote", { textTransform: "uppercase" }), texte(k, "Intitulé", { police: MONO, taille: 12, couleur: S.mute, casse: "uppercase", suivi: "0.04em", extra: { flexGrow: 1 } }), texte(k, "Section", { police: MONO, taille: 12, couleur: S.mute, casse: "uppercase", suivi: "0.04em", extra: { flexBasis: "96px", flexShrink: 0, textAlign: "right" } })], { gap: "20px", alignItems: "baseline", flexWrap: "nowrap", width: "100%", paddingBottom: "12px", borderStyle: "double", borderWidth: "0px", borderBottomWidth: "4px", borderColor: PIERRE });
    enTete.children[2].hideOn = ["mobile"];
    const ligneReg = ([c, l, u, sec]) => {
      const t = texte(k, sec, { police: MONO, taille: 12, couleur: S.mute, suivi: "0.04em", extra: { flexBasis: "96px", flexShrink: 0, textAlign: "right" } });
      t.hideOn = ["mobile"];
      const titreLien = lien(k, l, u, { police: S.head, taille: 26, poids: "400", lh: 1.2, couleur: S.fg, survolCouleur: PIERRE, h: "64px", extra: { flexGrow: 1, flexShrink: 1, minWidth: "0px" } });
      titreLien.styles.mobile = { ...(titreLien.styles.mobile || {}), fontSize: "21px" };
      return k.row([
        cote(c),
        titreLien,
        t,
      ], { gap: "20px", alignItems: "center", flexWrap: "nowrap", width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: SOUS }, undefined, { gap: "14px" });
    };
    const registre = k.col([enTete, ...PIECES.map(ligneReg), texte(k, "Les cotes sont fictives et non officielles : elles ne désignent aucune pièce réelle.", { taille: 12, couleur: S.mute, italique: true, extra: { paddingTop: "14px" } }), lien(k, "Nous écrire ↗", "/contact", { taille: 16, poids: "700", couleur: PIERRE, survolCouleur: S.fg, extra: { marginTop: "18px", alignSelf: "flex-start" } })], { gap: "0px", width: "100%", maxWidth: "760px" });
    const droite = G.colonne(k, [registre], { poids: 8, min: "300px", aligne: "stretch", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } });
    const haut = G.ligne(k, [marque, droite], { gap: "48px 88px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const bas = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [haut, hr(k, SOUS), bas], { colonne: true, gap: "40px", padV: ["104px", "80px", "56px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Inventaire" });
    return [G.racine(k, [bande])];
  },
}, FAM));

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-082 « Sillon et label » — label de disques fictif « Sillon ». Noir bleuté, orange. Le geste : un DISQUE VINYLE dessiné en SVG (sillons concentriques, reflets en croisillon, étiquette orange à l'inscription « SILLON »),
// posé au centre au-dessus de tout. Dessous : « Écoutez-nous partout » en Bagel Fat One, plateformes d'écoute en pastilles (liens vers la page d'accueil de chaque plateforme : à remplacer), lettre d'information à champ souligné.
// Écart au concept : le disque ne tourne PAS (aucune animation possible sans script) ; Bowlby One → Bagel Fat One (rendu propre). Pas de bloc de coordonnées : le lien « Écrire au label » suffit. Hind + Bagel Fat One.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const sillon = identite({
  key: "c082", label: "Noir bleuté et orange", humeur: "dark",
  fond: "#111a1c", texte: "#f3efe6", discret: "#b7c2c0", accent: "#ff8a3d", surface: "#1b2a2d",
  police: "font.hind", titres: "font.bagel-fat-one", rayon: "20px", rayonBouton: "999px", ombre: "none", poids: "400", bordure: "0px", ligne: "#f3efe633",
});
// Disque : sillons en SVG (traits pleins : la liste blanche du widget HTML ne garde ni <text> ni dégradés utilisables) ; l'étiquette orange et son texte sont de VRAIS blocs posés par-dessus.
function sillonsVinyle() {
  const C = 200;
  let s = `<circle cx="${C}" cy="${C}" r="197" fill="#0b1315" stroke="#2f454a" stroke-width="2"/>`;
  for (let r = 74, i = 0; r < 192; r += 2.6, i++) s += `<circle cx="${C}" cy="${C}" r="${r1(r)}" fill="none" stroke="${i % 5 === 0 ? "#3f585e" : "#1b2c30"}" stroke-width="${i % 5 === 0 ? 0.9 : 0.7}" opacity="${i % 3 === 0 ? 0.95 : 0.65}"/>`;
  for (const r of [114, 150, 178]) s += `<circle cx="${C}" cy="${C}" r="${r}" fill="none" stroke="#050909" stroke-width="3" opacity="0.85"/>`;
  const sect = (a0, a1, rr) => { const p = (a) => [C + rr * Math.cos((a * Math.PI) / 180), C + rr * Math.sin((a * Math.PI) / 180)].map(r1); const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${C} ${C}L${x0} ${y0}A${rr} ${rr} 0 0 1 ${x1} ${y1}Z`; };
  s += `<path d="${sect(-66, -30, 196)}" fill="#ffffff" opacity="0.08"/><path d="${sect(-58, -38, 196)}" fill="#ffffff" opacity="0.07"/><path d="${sect(114, 150, 196)}" fill="#ffffff" opacity="0.08"/><path d="${sect(122, 142, 196)}" fill="#ffffff" opacity="0.07"/>`;
  s += `<circle cx="${C}" cy="${C}" r="70" fill="#060b0c"/>`;
  return `<span aria-hidden="true">${svg(400, 400, s)}</span>`;
}
modeles.push(modeleV2({
  id: identifiantV2(82, "sillon-et-label"), concept: "c-082-sillon-et-label", name: "Sillon et label", family: FAM,
  description: "Un label de disques : un vinyle dessiné au centre (sillons, reflets, étiquette orange), « Écoutez-nous partout » en grosses lettres, plateformes d'écoute en pastilles, lettre d'information à champ souligné. Noir bleuté et orange.",
  tags: ["label", "disques", "vinyle", "musique", "plateformes", "orange", "newsletter", "centré"],
  identity: sillon,
  racine: { desktop: { backgroundColor: "#111a1c", gap: "0px" } },
  widgets: ["html", "text", "link", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ORANGE = S.accent, CREME = S.fg;
    // 1 · le disque : sillons (décor SVG) + étiquette orange (blocs réels, texte lisible) centrée
    const sillons = k.W("html", { html: sillonsVinyle() }, { position: "absolute", top: "0px", left: "0px", width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, zIndex: 0 });
    const etiquette = k.col([k.T("<p>SILLON</p>", { fontFamily: S.head, fontSize: "25px", lineHeight: 1, letterSpacing: "0.02em", color: "#111a1c", textAlign: "center" }, undefined, { fontSize: "18px" }), { ...caps(k, "33 tours", { couleur: "#111a1c", taille: "11px", suivi: "0.16em", align: "center" }), hideOn: ["mobile"] }],
      { width: "134px", height: "134px", borderRadius: "50%", backgroundColor: ORANGE, borderStyle: "solid", borderWidth: "3px", borderColor: "#ff7a2a", alignItems: "center", justifyContent: "center", gap: "4px", position: "relative", zIndex: 1, boxSizing: "border-box" }, { width: "118px", height: "118px" }, { width: "88px", height: "88px" });
    const disque = k.col([sillons, etiquette], { position: "relative", width: "400px", height: "400px", maxWidth: "100%", borderRadius: "50%", backgroundColor: "#0b1315", alignItems: "center", justifyContent: "center", overflow: "hidden", marginLeft: "auto", marginRight: "auto", flexShrink: 0 }, { width: "360px", height: "360px" }, { width: "280px", height: "280px" });
    // 2 · l'accroche (Bagel Fat One 150 px testé) et la ligne du label
    const accroche = G.geant("<p>Écoutez-nous<br><span style=\"color:#ff8a3d\">partout</span></p>", { taille: [48, 124], tablette: { taille: [84, 110] }, mobile: { taille: [50, 60] }, lh: 1, suivi: "-0.01em", poids: "400", police: S.head, couleur: CREME, align: "center" })(k, env);
    const sur = caps(k, "Sillon · label indépendant · disques et concerts", { couleur: S.mute, align: "center", suivi: "0.22em" });
    // 3 · plateformes d'écoute en pastilles (adresses d'exemple : page d'accueil de la plateforme, à remplacer)
    const plateformes = G.pilules([["Spotify", "https://open.spotify.com/"], ["Apple Music", "https://music.apple.com/"], ["Bandcamp", "https://bandcamp.com/"], ["Deezer", "https://www.deezer.com/"], ["YouTube Music", "https://music.youtube.com/"]], { gap: "10px", taille: 15, poids: "600", contour: "#ff8a3d", survolFond: ORANGE, survolCouleur: S.onAccent })(k, env, true);
    plateformes.styles.desktop = { ...plateformes.styles.desktop, justifyContent: "center", maxWidth: "720px" };
    const blocPlateformes = k.col([caps(k, "Écouter · adresses d'exemple à remplacer", { couleur: S.mute, align: "center", taille: "11px" }), plateformes], { gap: "14px", alignItems: "center", width: "100%" });
    // 4 · lettre d'information à champ souligné + lien Contact
    const lettre = abo(k, env, { titre: "La lettre du label", intro: "Sorties, concerts, coulisses. Rien d'autre.", bouton: "S'abonner", largeur: "480px", accent: ORANGE, texte: CREME, soulignement: "2px" }, { titre: { color: ORANGE, textAlign: "center" }, intro: { textAlign: "center", color: S.mute }, consent: { textAlign: "center" }, manque: { textAlign: "center" }, bouton: { fontWeight: "800" } });
    const contact = lien(k, "Écrire au label ↗", "/contact", { taille: 15, poids: "700", couleur: CREME, survolCouleur: ORANGE, focus: ORANGE, extra: { alignSelf: "center" } });
    const colLettre = k.col([lettre, contact], { gap: "14px", alignItems: "center", width: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env, true);
    const bande = G.bande(k, [disque, sur, accroche, blocPlateformes, hr(k, "#f3efe622"), colLettre, mentions], { colonne: true, aligne: "center", gap: "30px", padV: ["88px", "72px", "56px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "16px"], fond: S.bg, degrade: { type: "radial", from: "#1d3236", to: "#111a1c", angle: 180, extra: [{ color: "#16252a", at: 38 }] }, innerMobile: { rowGap: "24px" }, nom: "Sillon" });
    return [G.racine(k, [bande])];
  },
}, FAM));

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-083 « Plan du salon » — salon professionnel fictif « Expo Atelier ». Blanc bleuté et orange brique (palette du texte du concept ; les hex du concept donnaient un sombre : on garde un sombre pour le TABLEAU). Le geste :
// le tableau d'informations pratiques, façon tableau de gare : un panneau bleu nuit à quatre cases (accès, stationnement, horaires réels, accessibilité), un pictogramme de ligne par case ; au-dessus, le nom ; dessous,
// trois cartes (exposants, presse, lettre d'information) et des réseaux en carrés de 44 px. Les infos d'accès sont des EXEMPLES à remplacer (signalés) ; horaires et coordonnées = widgets réels. Aucun compte à rebours.
// Onest seule (800 pour les titres, testée à 150 px).
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const salon = identite({
  key: "c083", label: "Blanc bleuté, bleu nuit et brique", humeur: "light",
  fond: "#eef3fa", texte: "#111b2e", discret: "#44506a", accent: "#b8400f", surface: "#ffffff",
  police: "font.onest", titres: "font.onest", rayon: "2px", rayonBouton: "2px", ombre: "none", poids: "800", bordure: "1px", ligne: "#111b2e26",
});
const pictogramme = (type, couleur) => {
  const traits = { metro: `<circle cx="14" cy="14" r="11"/><path d="M8.5 19V9l5.5 6.5L19.5 9v10"/>`, parking: `<rect x="3.5" y="3.5" width="21" height="21" rx="3"/><path d="M11 20.5V8h4.2a3.6 3.6 0 010 7.2H11"/>`, horloge: `<circle cx="14" cy="14" r="11"/><path d="M14 7.5V14l4.5 3"/>`, acces: `<circle cx="14" cy="14" r="11"/><circle cx="14" cy="8.3" r="1.6"/><path d="M8.5 11.2h11M14 11.2v5l-3 4.8M14 16.2l3 4.8"/>` }[type];
  return svg(28, 28, `<g fill="none" stroke="${couleur}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${traits}</g>`);
};
modeles.push(modeleV2({
  id: identifiantV2(83, "plan-du-salon"), concept: "c-083-plan-du-salon", name: "Plan du salon", family: FAM,
  description: "Un salon professionnel : un tableau d'informations pratiques façon tableau de gare (accès, stationnement, horaires réels, accessibilité, un pictogramme par case), trois cartes pour exposants, presse et lettre d'information, réseaux en carrés.",
  tags: ["salon", "professionnel", "infos pratiques", "tableau", "pictogrammes", "bleu nuit", "brique", "accès"],
  identity: salon,
  racine: { desktop: { backgroundColor: "#eef3fa", gap: "0px" } },
  widgets: ["sitetitle", "html", "text", "link", "bizcontact", "bizhours", "emailsubscribe", "social", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, MARINE = "#111b2e", CLAIR = "#f1f4f8", DISCRET = "#b8c2d8", ORANGE = "#ff8a5b", BRIQUE = S.accent, LIGNE = "#c9d3e4";
    // 1 · en-tête : le nom (widget Titre du site) et le lien Contact (appel discret)
    const nom = Moteur.finishNode(S, k.siteTitle({ fontFamily: S.head, fontSize: "fluid:34-72", fontWeight: "800", lineHeight: 1, letterSpacing: "-0.03em", color: MARINE, overflowWrap: "break-word" }));
    const gauche = G.colonne(k, [caps(k, "Salon professionnel · plan et infos pratiques", { couleur: BRIQUE, suivi: "0.18em" }), nom], { poids: 7, min: "280px", gap: "10px", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } });
    const contact = k.LINK("Contacter l'organisation", "/contact", { fontFamily: S.font, fontSize: "15px", fontWeight: "700", color: "#ffffff", backgroundColor: BRIQUE, display: "inline-flex", alignItems: "center", minHeight: "52px", paddingLeft: "28px", paddingRight: "28px", textDecoration: "none", borderRadius: "2px", transitionDuration: MS });
    G.fini(k, contact, { hover: { backgroundColor: MARINE, color: "#ffffff" }, focus: G.focus(MARINE) });
    const entete = G.ligne(k, [gauche, contact], { gap: "20px 40px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    // 2 · le tableau (panneau bleu nuit à quatre cases)
    const picto = (t) => k.W("html", { html: pictogramme(t, ORANGE) }, { width: "28px", height: "28px", display: "block", fontSize: "0px", lineHeight: 1 });
    const ex = (t) => texte(k, t, { taille: 15, couleur: CLAIR, lh: 1.5 });
    const cellule = (type, titre, enfants) => G.colonne(k, [picto(type), caps(k, titre, { couleur: ORANGE, suivi: "0.18em", extra: { marginTop: "6px" } }), ...enfants], { base: "22%", poids: 1, min: "200px", gap: "8px", extra: { paddingLeft: "24px", paddingRight: "16px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: "#f1f4f833" }, tablette: { flexBasis: "46%" }, mobile: { flexBasis: "100%", paddingLeft: "0px", borderLeftWidth: "0px", borderTopWidth: "1px", paddingTop: "18px" } });
    const hh = horaires(k, { taille: 14, couleur: CLAIR, couleurStatut: ORANGE, couleurDiscret: DISCRET, statut: true });
    const cc = coordonnees(k, { taille: 14, couleur: CLAIR, couleurLien: CLAIR, survol: ORANGE, lh: 1.55 });
    const celluleAcces = cellule("metro", "Accès", [ex("Métro : ligne 4, station Halle (exemple)."), texte(k, "Navettes depuis la gare toutes les 20 min (exemple).", { taille: 13, couleur: DISCRET })]);
    const cellulePark = cellule("parking", "Stationnement", [ex("Parking visiteurs, entrée nord (exemple)."), texte(k, "Bornes de recharge sur place (exemple).", { taille: 13, couleur: DISCRET })]);
    const celluleHeures = cellule("horloge", "Horaires", [hh, cc]);
    const celluleAccess = cellule("acces", "Accessibilité", [ex("Halls de plain-pied, ascenseurs, boucle magnétique (exemple)."), texte(k, "Chiens guides acceptés.", { taille: 13, couleur: DISCRET })]);
    celluleAcces.styles.desktop = { ...celluleAcces.styles.desktop, borderLeftWidth: "0px", paddingLeft: "0px" };
    celluleAcces.styles.tablet = { ...(celluleAcces.styles.tablet || {}), paddingLeft: "0px", borderLeftWidth: "0px" };
    celluleHeures.styles.tablet = { ...(celluleHeures.styles.tablet || {}), paddingLeft: "0px", borderLeftWidth: "0px" };
    const tableau = k.col([
      G.ligne(k, [caps(k, "Infos pratiques", { couleur: CLAIR, poids: "800", suivi: "0.22em" }), caps(k, "Textes d'exemple à remplacer par ceux de votre salon", { couleur: DISCRET, suivi: "0.08em", poids: "600", extra: { textTransform: "none" } })], { gap: "6px 24px", aligne: "baseline", justifie: "space-between", largeur: "100%" }),
      k.row([celluleAcces, cellulePark, celluleHeures, celluleAccess], { ...G.gaps("28px 0px"), alignItems: "stretch", flexWrap: "wrap", width: "100%" }),
    ], { backgroundColor: MARINE, color: CLAIR, borderStyle: "solid", borderWidth: "0px", borderTopWidth: "5px", borderColor: BRIQUE, borderRadius: "2px", paddingTop: "30px", paddingBottom: "36px", paddingLeft: "40px", paddingRight: "40px", gap: "28px", width: "100%", boxSizing: "border-box" }, { paddingLeft: "28px", paddingRight: "28px" }, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "24px", paddingBottom: "28px" });
    // 3 · trois cartes : exposants, presse, lettre d'information
    const carteLien = (surtitre, titre, texteCourt, url) => k.col([caps(k, surtitre, { couleur: BRIQUE, suivi: "0.18em" }), lien(k, `${titre} →`, url, { taille: 22, poids: "800", couleur: MARINE, survolCouleur: BRIQUE, lh: 1.2, extra: { alignSelf: "flex-start" } }), texte(k, texteCourt, { taille: 14, couleur: S.mute })], { flexBasis: "0px", flexGrow: 1, minWidth: "240px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "1px", borderColor: LIGNE, borderRadius: "2px", paddingTop: "26px", paddingBottom: "26px", paddingLeft: "26px", paddingRight: "26px", gap: "10px", boxSizing: "border-box" }, { flexBasis: "46%" }, { flexBasis: "100%" });
    const lettre = abo(k, env, { titre: "Lettre du salon", intro: "Les nouveautés du salon, sans bruit.", bouton: "S'abonner", largeur: "100%", accent: BRIQUE, texte: MARINE, soulignement: "2px" }, { titre: { color: BRIQUE, fontWeight: "800" }, intro: { color: S.mute, fontSize: "14px" }, bouton: { borderRadius: "2px", fontWeight: "800" } });
    const carteLettre = k.col([lettre], { flexBasis: "0px", flexGrow: 1, minWidth: "260px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "1px", borderColor: LIGNE, borderRadius: "2px", paddingTop: "26px", paddingBottom: "26px", paddingLeft: "26px", paddingRight: "26px", boxSizing: "border-box" }, { flexBasis: "100%" }, { flexBasis: "100%" });
    const cartes = k.row([carteLien("Exposants", "Devenir exposant", "Réserver un stand, les modalités et le plan des allées.", "/contact"), carteLien("Presse", "Espace presse", "Accréditations et contact de l'équipe presse.", "/contact"), carteLettre], { gap: "20px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    // 4 · réseaux en carrés de 44 px + mentions
    const reseaux = reseauxIcones(k, env, ["instagram", "youtube", "facebook"], { taille: 44, forme: "square", couleur: MARINE, contour: MARINE, survolFond: BRIQUE, survolCouleur: "#ffffff", focus: BRIQUE });
    const liens = G.ligne(k, [["Questions", "/faq"], ["Contact", "/contact"], ["Mon compte", "/connexion"]].map(([l, u]) => lien(k, l, u, { taille: 14, poids: "700", couleur: MARINE, survolCouleur: BRIQUE })), { gap: "0px 28px", aligne: "center" });
    const barre = G.ligne(k, [liens, reseaux], { gap: "14px 32px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true, couleur: S.mute, liens: MARINE })(k, env);
    const bande = G.bande(k, [entete, tableau, cartes, barre, hr(k, LIGNE), mentions], { colonne: true, gap: "36px", padV: ["88px", "72px", "52px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "16px"], fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Plan du salon" });
    bande.styles.desktop.color = MARINE;
    return [G.racine(k, [bande])];
  },
}, FAM));

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-084 « Pellicule et salles » — cinéma d'art et d'essai fictif « Le Studio 9 ». Bleu nuit, or pâle. Le geste : une PELLICULE : « À L'AFFICHE » en League Gothic géant, puis une bande de film (bandes noires à perforations
// claires dessinées en SVG) qui porte quatre photogrammes = quatre séances D'EXEMPLE (titres de films inventés, aucune heure ni date). Horaires d'ouverture et « ouvert maintenant » = widget réel. Dessous : liens, carte de lettre
// d'information, réseaux « ↗ ». Écarts au concept : le ruban ne défile pas (mouvement exclu) ; coupes en diagonale non réalisables : cadres droits. League Gothic + Libre Franklin.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const studio = identite({
  key: "c084", label: "Bleu nuit et or pâle", humeur: "dark",
  fond: "#0c1020", texte: "#f2f0e8", discret: "#bdbfc9", accent: "#e8c468", surface: "#161b30",
  police: "font.libre-franklin", titres: "font.league-gothic", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#e8c46855",
});
function perforations(W, H, trouW, trouH, pas) {
  const haut = (H - trouH) / 2; let d = "";
  for (let x = pas / 2; x < W - trouW; x += pas) d += `M${r1(x + 2)} ${r1(haut)}h${trouW - 4}a2 2 0 012 2v${trouH - 4}a2 2 0 01-2 2h-${trouW - 4}a2 2 0 01-2-2v-${trouH - 4}a2 2 0 012-2z`;
  return svg(W, H, `<rect width="${W}" height="${H}" fill="#04060d"/><path d="${d}" fill="#f2e3b3" opacity="0.92"/>`);
}
modeles.push(modeleV2({
  id: identifiantV2(84, "pellicule-et-salles"), concept: "c-084-pellicule-et-salles", name: "Pellicule et salles", family: FAM,
  description: "Un cinéma d'art et d'essai : « À l'affiche » en lettres géantes, une vraie bande de pellicule perforée qui porte quatre séances d'exemple, horaires d'ouverture avec « ouvert maintenant », carte de lettre d'information et liens.",
  tags: ["cinéma", "pellicule", "séances", "perforations", "bleu nuit", "or", "horaires", "affiche"],
  identity: studio,
  racine: { desktop: { backgroundColor: "#0c1020", gap: "0px" } },
  widgets: ["html", "text", "link", "bizhours", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, OR = S.accent, CREME = S.fg, NUIT = "#04060d";
    // 1 · « À l'AFFICHE » + horaires d'ouverture (widget réel)
    const titre = G.geant("<p>À l'affiche</p>", { taille: [72, 200], tablette: { taille: [130, 170] }, mobile: { taille: [80, 96] }, lh: 0.9, suivi: "0.005em", poids: "400", police: S.head, couleur: CREME, casse: "uppercase" })(k, env);
    const h = horaires(k, { titre: "Ouverture de la caisse", taille: 15, couleur: CREME, couleurStatut: OR, couleurDiscret: S.mute, tailleTitre: "26px", couleurTitre: OR, casseTitre: "uppercase" });
    const colTitre = G.colonne(k, [caps(k, "Cinéma d'art et d'essai · programme d'exemple, à remplacer par vos séances", { couleur: OR, suivi: "0.2em", poids: "600" }), titre], { poids: 8, min: "300px", gap: "26px", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } });
    const colHeures = G.colonne(k, [h], { poids: 4, min: "260px", soi: "flex-end", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } });
    const haut = G.ligne(k, [colTitre, colHeures], { gap: "28px 56px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    const bandeHaut = G.bande(k, [haut], { colonne: true, fond: S.bg, padV: ["80px", "64px", "48px"], padB: ["44px", "36px", "28px"], padH: ["48px", "32px", "16px"], nom: "À l'affiche", innerMobile: { rowGap: "20px" } });
    // 2 · la pellicule : perforations en haut et en bas, quatre photogrammes entre les deux
    const perfo = () => svgHtml(k, perforations(1440, 34, 20, 14, 38), perforations(390, 28, 14, 11, 30), { backgroundColor: NUIT });
    const FILMS = [["Les Heures Bleues", "Salle 1"], ["Un Été à Pierrefeu", "Salle 2"], ["Le Silence des Quais", "Salle 1"], ["Nos Jours Sauvages", "Salle 3"]];
    const photogramme = ([titreFilm, salle], i) => k.col([
      caps(k, `Séance ${i + 1} · ${salle}`, { couleur: OR, suivi: "0.2em", taille: "11px" }),
      lien(k, titreFilm, "/blog", { police: S.head, taille: 38, poids: "400", casse: "uppercase", lh: 1.02, suivi: "0.02em", couleur: CREME, survolCouleur: OR, h: "44px", extra: { alignSelf: "flex-start" } }),
      texte(k, "Horaire à saisir", { taille: 13, couleur: S.mute, italique: true }),
    ], { flexBasis: "0px", flexGrow: 1, minWidth: "200px", gap: "10px", justifyContent: "space-between", minHeight: "190px", paddingTop: "22px", paddingBottom: "20px", paddingLeft: "22px", paddingRight: "22px", boxSizing: "border-box", backgroundColor: S.alt, borderStyle: "solid", borderWidth: "1px", borderColor: "#e8c46866", gradient: { from: "#1b2140", to: "#0f1428", angle: 160 } }, { flexBasis: "44%", minHeight: "170px" }, { flexBasis: "44%", minWidth: "0px", minHeight: "150px", paddingLeft: "14px", paddingRight: "12px", paddingTop: "16px" });
    const cadres = k.row(FILMS.map(photogramme), { gap: "18px", alignItems: "stretch", flexWrap: "wrap", width: "100%", maxWidth: "1280px", marginLeft: "auto", marginRight: "auto", boxSizing: "border-box", paddingLeft: "32px", paddingRight: "32px" }, { paddingLeft: "24px", paddingRight: "24px", gap: "14px" }, { paddingLeft: "12px", paddingRight: "12px", gap: "10px" });
    const milieu = { type: "container", children: [cadres], ...sty({ display: "flex", flexDirection: "column", width: "100%", backgroundColor: NUIT, paddingTop: "20px", paddingBottom: "20px" }, undefined, { paddingTop: "12px", paddingBottom: "12px" }) };
    const pellicule = { type: "container", props: { full: true }, children: [...perfo(), milieu, ...perfo()], ...sty({ display: "flex", flexDirection: "column", width: "100%", gap: "0px", backgroundColor: NUIT }) };
    // 3 · bas : liens, carte de lettre, réseaux, mentions
    const liensNav = G.ligne(k, [["Le programme", "/blog"], ["Billetterie et contact", "/contact"], ["Questions", "/faq"], ["Mon compte", "/connexion"]].map(([l, u]) => lien(k, l, u, { taille: 15, poids: "600", couleur: CREME, survolCouleur: OR })), { gap: "0px 28px", aligne: "center", justifie: "flex-start" });
    const reseaux = G.reseauxTexte(RESEAUX, { taille: 14, couleur: CREME, survol: OR })(k, env);
    const colLiens = G.colonne(k, [caps(k, "Les salles", { couleur: OR, suivi: "0.22em" }), liensNav, reseaux], { poids: 6, min: "300px", gap: "10px", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } });
    const carte = k.col([abo(k, env, { titre: "Lettre d'information", intro: "La programmation du mois, sans spam.", bouton: "S'abonner", largeur: "100%", accent: OR, texte: CREME, soulignement: "1px" }, { titre: { color: OR, fontFamily: S.head, fontSize: "30px", fontWeight: "400", textTransform: "uppercase", letterSpacing: "0.04em" }, bouton: { borderRadius: "0px", fontWeight: "800", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "13px" } })], { backgroundColor: S.alt, borderStyle: "solid", borderWidth: "0px", borderTopWidth: "4px", borderColor: OR, paddingTop: "26px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", boxSizing: "border-box", width: "100%" }, undefined, { paddingLeft: "20px", paddingRight: "20px" });
    const colCarte = G.colonne(k, [carte], { poids: 6, min: "280px", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } });
    const bas = G.ligne(k, [colLiens, colCarte], { gap: "32px 64px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bandeBas = G.bande(k, [bas, hr(k, "#e8c46833"), mentions], { colonne: true, gap: "36px", fond: S.bg, padV: ["64px", "52px", "40px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "16px"], nom: "Salles", innerMobile: { rowGap: "24px" } });
    return [G.racine(k, [bandeHaut, pellicule, bandeBas])];
  },
}, FAM));
// @@MODELES

module.exports = {
  key: "culture-evenementiel", label: "Culture et événementiel", target: 6, built: true,
  description: "Festivals, théâtres, salons, musées et salles : programmation, billetterie, esprit d’affiche.",
  models: modeles,
};
