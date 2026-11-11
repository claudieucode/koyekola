// Famille v2 « Santé et bien-être » — 6 modèles (concepts c-073 à c-078 de docs/footer-v2/CONCEPTS_100.md). Voir docs/footer-v2/GUIDE_CONSTRUIRE_UN_MODELE_V2.md.
// Chaque modèle est INDÉPENDANT du site (mode « solo ») : couleurs (hexadécimal), polices (bibliothèque auto-hébergée) et formes viennent de son identité (identite()).
// Marques FICTIVES (Clinique du Parc, Source Basalte, Dr Lemaire, Pharmacie des Tilleuls, Souffle, Deux Rives). RÈGLES DE LA FAMILLE : aucune allégation médicale, aucune promesse de résultat, aucun avis inventé,
// aucun numéro officiel inventé : « en cas d'urgence, appelez le 15 » est un texte d'EXEMPLE (à adapter au pays) ; les numéros d'écoute et de garde sont à saisir par le client ; pas de faux créneau d'agenda.
// Polices testées à 130 px (accents, « a », « e » ; capture sante-ft1.png) : Italiana, Comfortaa 600, Gelasio 600, M PLUS Rounded 1c 800, Be Vietnam Pro 700, Urbanist 800, Mulish 800, Nunito Sans 800 : PROPRES.
// Limite du kit : pas d'animation CSS dans les nœuds ; le cercle « qui respire » de c-077 est donc STATIQUE (halos concentriques), ce qui évite aussi tout souci de mouvement réduit.
const { sty, compact } = require("../../../kit");
const { modeleV2, identifiantV2, identite, Moteur } = require("../kit-v2");

const FAM = "sante-bienetre";

// ── Aides locales ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const tx = (k, html, st = {}, t, m) => k.T(/^\s*</.test(html) ? html : `<p>${html}</p>`, st, t, m);
const cap = (k, txt, o = {}) => tx(k, txt, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: "0.12em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, textAlign: o.align }));
const lien = (k, G, label, url, o = {}) => G.fini(k, k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || k.S.font, color: o.couleur || k.S.fg, textDecoration: "none", lineHeight: o.lh || 1.4, paddingTop: o.pv, paddingBottom: o.pv, display: "inline-flex", alignItems: "center", transitionDuration: G.MOUVEMENT, ...(o.extra || {}) })), { hover: o.survol || { color: o.survolCouleur || k.S.accent, textDecoration: "underline" }, focus: G.focus(o.focus || k.S.accent) });
const filetH = (k, couleur, e = "1px", st = {}) => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: e, marginTop: "0px", marginBottom: "0px", ...st });
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
const titreWidget = (w, couleur, align) => { Moteur.mergePart(w, "title", { styles: { desktop: { fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.12em", color: couleur, marginBottom: "6px", textAlign: align } } }); return w; };
const rond = (couleur, t, st = {}, enfants = []) => ({ type: "container", children: enfants, ...sty({ width: t, height: t, minWidth: t, borderRadius: "50%", backgroundColor: couleur, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", ...st }) });
function reseaux(k, G, env, liste, o = {}) {
  const S = k.S, n = Moteur.item(k, `socials:${liste.join("+")}`, env);
  n.props.size = "44"; n.props.shape = "circle";
  Moteur.mergePart(n, "link", { styles: { desktop: compact({ color: o.couleur || S.fg, backgroundColor: o.fond, transitionDuration: G.MOUVEMENT }) }, states: { hover: { backgroundColor: o.survolFond || S.accent, color: o.survolCouleur || S.onAccent, transform: { y: -2 } }, focus: G.focus(o.focus || S.accent) } });
  return n;
}
const svgDe = (corps, vb) => `<span aria-hidden="true"><svg viewBox="${vb}" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${corps}</svg></span>`;
const calque = (html, o = {}) => ({ type: "html", props: { html }, ...(o.masque ? { hideOn: o.masque } : {}), ...sty(compact({ position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%", zIndex: 0, overflow: "hidden", lineHeight: 0.8, fontSize: "0px", ...(o.st || {}) })) });

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-073 « Repères de clinique » — « Clinique du Parc » (fictive). Le pied est une signalétique : quatre étages, une couleur et un numéro écrit chacun, une liste de services (EXEMPLES) ; accueil, téléphone et repère d'urgence en tête.
// Vert d'eau #eaf6f5, teal #0a7676, encre #0e2f33. Be Vietnam Pro 700 + Open Sans.
const cliniqueId = identite({
  key: "c073", label: "Vert d'eau et teal", humeur: "light",
  fond: "#eaf6f5", texte: "#0e2f33", discret: "#3f6065", accent: "#0a7676", surface: "#ffffff",
  police: "font.open-sans", titres: "font.be-vietnam-pro", rayon: "16px", rayonBouton: "999px", ombre: "none", poids: "700", bordure: "0px", ligne: "#b5d3d1",
});
const ETAGES = [
  ["0", "Accueil", "#0a7676", "#ffffff", ["Accueil et admissions", "Salle d'attente", "Cafétéria", "Boutique de presse"]],
  ["1", "Consultations", "#2457b5", "#ffffff", ["Cabinets de consultation", "Secrétariat médical", "Prises de rendez-vous", "Accès et ascenseurs"]],
  ["2", "Examens", "#e8a33d", "#0e2f33", ["Imagerie", "Prélèvements", "Rééducation", "Salle de repos"]],
  ["3", "Administration", "#8a3a7a", "#ffffff", ["Facturation", "Dossiers et documents", "Direction", "Ressources humaines"]],
];
const reperes = modeleV2({
  id: identifiantV2(73, "reperes-de-clinique"), concept: "c-073-reperes-de-clinique", name: "Repères de clinique", family: FAM,
  description: "Un pied-signalétique pour clinique : accueil, téléphone et repère d'urgence en tête, puis quatre étages, chacun avec sa couleur, son numéro écrit et sa liste de services d'exemple. Vert d'eau, teal, très lisible.",
  tags: ["clinique", "annuaire", "étages", "signalétique", "teal", "santé"],
  identity: cliniqueId,
  racine: racineDe("#eaf6f5"),
  widgets: ["text", "bizphone", "link", "social", "copyright", "bizlegal", "container"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · accueil : marque, téléphone, repère d'urgence (texte d'exemple)
    const marque = k.row([rond(S.accent, "56px", { borderRadius: "16px" }, [tx(k, "CP", { fontFamily: S.head, fontWeight: "700", fontSize: "20px", color: "#ffffff", lineHeight: 1 })]),
      k.col([tx(k, "Clinique du Parc", { fontFamily: S.head, fontWeight: "700", fontSize: "30px", lineHeight: 1.1, color: S.fg }, { fontSize: "26px" }), tx(k, "Un étage, une couleur, un numéro : trouvez votre chemin.", { fontSize: "14px", lineHeight: 1.5, color: S.mute })], { gap: "4px" })], { gap: "16px", flexWrap: "nowrap", alignItems: "center" });
    const tel = k.col([Moteur.finishNode(S, k.W("bizphone", { which: "1", prefix: "", showLabel: false, showIcon: false }, { color: S.fg, fontFamily: S.head, fontWeight: "700", fontSize: "fluid:24-34", lineHeight: 1.15, whiteSpace: "nowrap" }))], { gap: "4px" });
    const urgence = k.row([rond("#b42318", "36px", {}, [tx(k, "!", { fontFamily: S.head, fontWeight: "700", fontSize: "20px", color: "#ffffff", lineHeight: 1, textAlign: "center" })]),
      k.col([tx(k, "En cas d'urgence, appelez le 15", { fontFamily: S.head, fontWeight: "700", fontSize: "17px", lineHeight: 1.3, color: S.fg }), tx(k, "Numéro d'exemple, à adapter à votre pays.", { fontSize: "13px", lineHeight: 1.4, color: S.mute })], { gap: "2px" })],
      { gap: "14px", flexWrap: "nowrap", alignItems: "center", backgroundColor: "#ffffff", borderRadius: "16px", paddingTop: "16px", paddingBottom: "16px", paddingLeft: "20px", paddingRight: "24px", maxWidth: "420px" });
    const accueil = G.bande(k, [marque, tel, urgence], { fond: S.bg, padV: ["72px", "56px", "40px"], padB: ["40px", "32px", "24px"], padH: ["48px", "32px", "20px"], max: "1280px", aligne: "center", gap: "28px 48px", nom: "Accueil et urgence" });
    // 2 · annuaire des étages (accordéon sur mobile)
    const volets = Moteur.accordionNode(k, env, false, ETAGES.map(([n, nom, , , liste]) => ({ title: `Étage ${n} · ${nom}`, w: 1,
      codes: [() => k.col(liste.map((l, i) => k.row([tx(k, `0${i + 1}`, { fontFamily: S.head, fontSize: "12px", fontWeight: "700", color: S.accent, minWidth: "26px", letterSpacing: "0.08em" }), tx(k, l, { fontSize: "15px", lineHeight: 1.4, color: S.fg })], { gap: "10px", flexWrap: "nowrap", alignItems: "baseline", width: "100%", paddingTop: "9px", paddingBottom: "9px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: S.line })), { gap: "0px", width: "100%" })] })), {}, { min: "270px" });
    volets.children.forEach((c, i) => {
      const [n, , couleur, sur] = ETAGES[i];
      c.children.unshift(k.row([rond(couleur, "44px", {}, [tx(k, n, { fontFamily: S.head, fontWeight: "700", fontSize: "20px", color: sur, lineHeight: 1 })])], { gap: "12px", flexWrap: "nowrap", alignItems: "center" }));
      Object.assign(c.styles.desktop, { backgroundColor: "#ffffff", borderRadius: "16px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "6px", borderColor: couleur, paddingTop: "24px", paddingBottom: "20px", paddingLeft: "24px", paddingRight: "24px", color: S.fg, fontFamily: S.head, gap: "8px" });
      c.styles.mobile = { paddingTop: "12px", paddingLeft: "16px", paddingRight: "16px" };
    });
    Object.assign(volets.styles.desktop, { columnGap: "20px", rowGap: "20px", alignItems: "stretch", width: "100%" });
    const note = tx(k, "Plan d'exemple : les étages et les services se modifient dans l'éditeur.", { fontSize: "13px", color: S.mute, lineHeight: 1.5 });
    const annuaire = G.bande(k, [volets, note], { fond: S.bg, colonne: true, gap: "20px", padV: ["24px", "24px", "16px"], padB: ["56px", "48px", "32px"], padH: ["48px", "32px", "20px"], max: "1280px", nom: "Annuaire des étages" });
    // 3 · légal
    const bas = G.bande(k, [k.row([G.ligneLegale({ taille: 12, sansCookies: true })(k, env), lien(k, G, "Nous écrire →", "/contact", { taille: 14, poids: "700", couleur: S.accent, pv: "8px" }), reseaux(k, G, env, ["facebook", "instagram", "linkedin"], { fond: "#ffffff" })], { rowGap: "16px", columnGap: "28px", alignItems: "center", justifyContent: "space-between", width: "100%" })], { fond: S.bg, colonne: true, padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], max: "1280px", filetHaut: { epaisseur: "1px", couleur: S.line }, nom: "Mentions" });
    return [G.racine(k, [accueil, annuaire, bas])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-074 « Galets de spa » — « Source Basalte » (fictif). À gauche UN mot géant « Respirer » (Italiana, testée propre), à droite trois galets ronds (horaires, adresse, réservation). Sable #e8dccb, brun #6f553c. Italiana + Jost.
const spaId = identite({
  key: "c074", label: "Sable et terre", humeur: "light",
  fond: "#e8dccb", texte: "#3a3027", discret: "#625546", accent: "#6f553c", surface: "#d8c8b1",
  police: "font.jost", titres: "font.italiana", rayon: "28px", rayonBouton: "999px", ombre: "none", poids: "400", bordure: "0px", ligne: "#bfae96",
});
const spa = modeleV2({
  id: identifiantV2(74, "galets-de-spa"), concept: "c-074-galets-de-spa", name: "Galets de spa", family: FAM,
  description: "Un seul mot géant, « Respirer », et trois galets ronds de tailles différentes qui portent les horaires, l'adresse et la réservation. Sable, terre, brun doux ; une carte pour la lettre d'information.",
  tags: ["spa", "bien-être", "galets", "sable", "mot géant", "asymétrique"],
  identity: spaId,
  racine: racineDe("#d8c8b1"),
  widgets: ["text", "bizhours", "bizcontact", "link", "emailsubscribe", "social", "copyright", "bizlegal", "container"],
  compose(k, env, G) {
    const S = k.S, GALET = "#f3eadc", GALET2 = "#cdb99c";
    const marque = tx(k, "Source Basalte", { fontFamily: S.head, fontSize: "26px", color: S.fg, lineHeight: 1.1 });
    const mot = G.geant("<p>Respirer</p>", { taille: [76, 200], lh: 0.95, suivi: "-0.02em", poids: "400", police: S.head, couleur: S.fg })(k, env);
    mot.styles.desktop.overflowWrap = "normal";
    const menu = k.row([["Nous écrire", "/contact"], ["Questions", "/faq"], ["Journal", "/blog"], ["Mon compte", "/connexion"]].map(([l, u]) => lien(k, G, l, u, { taille: 15, pv: "8px" })), { columnGap: "28px", rowGap: "0px", alignItems: "center" });
    const gauche = G.colonne(k, [marque, mot, menu, reseaux(k, G, env, ["instagram", "facebook"], { fond: GALET })], { poids: 7, min: "300px", gap: "28px", justifie: "space-between" });
    // galets : les cercles gardent une taille minimale, la zone de clic du galet de réservation est le cercle ENTIER (le lien lui-même est le cercle)
    const galet = (t, enfants, o = {}) => ({ type: "container", children: enfants, ...sty({ width: t, minHeight: t, borderRadius: "50%", backgroundColor: o.fond || GALET, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "6px", paddingTop: "30px", paddingBottom: "30px", paddingLeft: "24px", paddingRight: "24px", boxSizing: "border-box", alignSelf: o.soi, flexShrink: 0, ...(o.extra || {}) }, { width: o.tt || t, minHeight: o.tt || t }, { width: o.tm || o.tt || t, minHeight: o.tm || o.tt || t, ...(o.mob || {}) }) });
    const heures = k.W("bizhours", { title: "Horaires", showOpenNow: true, groupDays: true, showExceptions: false, showNote: false, closedLabel: "Fermé" }, { color: S.fg, fontSize: "14px", fontFamily: S.font, textAlign: "center", lineHeight: 1.4 });
    const adr = k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: false, showEmail: false, showIcons: false, layout: "stack" }, { color: S.fg, fontSize: "14px", fontFamily: S.font, textAlign: "center", lineHeight: 1.4 });
    adr.props.title = "Adresse"; titreWidget(heures, S.accent, "center"); titreWidget(adr, S.fg, "center");
    const g1 = galet("280px", [Moteur.finishNode(S, heures)], { tt: "260px", tm: "240px", soi: "flex-start", extra: { marginLeft: "0px" } });
    const g2 = galet("230px", [Moteur.finishNode(S, adr)], { fond: GALET2, tt: "230px", tm: "220px", soi: "flex-end", extra: { marginTop: "-40px" }, mob: { marginTop: "-28px" } });
    const resa = G.fini(k, k.LINK("Réserver", "/contact", { fontFamily: S.head, fontSize: "26px", color: "#ffffff", backgroundColor: S.accent, textDecoration: "none", width: "180px", height: "180px", minHeight: "180px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "flex-start", marginLeft: "40px", marginTop: "-32px", transitionDuration: G.MOUVEMENT, boxSizing: "border-box" }), { hover: { backgroundColor: S.fg, transform: { y: -3 }, textDecoration: "none" }, focus: G.focus(S.fg) });
    const droite = G.colonne(k, [g1, g2, resa], { poids: 5, min: "280px", gap: "0px", aligne: "stretch", extra: { alignItems: "stretch" }, mobile: { alignItems: "center" } });
    const haut = G.bande(k, [gauche, droite], { fond: S.bg, padV: ["96px", "72px", "56px"], padB: ["64px", "56px", "40px"], padH: ["48px", "32px", "20px"], max: "1280px", aligne: "stretch", gap: "48px 64px", nom: "Mot et galets" });
    const abo = G.abonnement({ titre: "Lettre du spa", intro: "Quelques nouvelles, de temps en temps, par e-mail.", bouton: "S'abonner", largeur: "460px", soulignement: "2px", fondChamp: "#f3eadc", rayonChamp: "999px", rembChamp: "24px", rayonBouton: "999px" })(k, env);
    const carte = k.card([abo], { backgroundColor: GALET, borderRadius: "28px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "32px", paddingRight: "32px", flexGrow: 1, maxWidth: "560px" }, undefined, { paddingLeft: "20px", paddingRight: "20px", width: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bas = G.bande(k, [k.row([carte, k.col([mentions], { flexGrow: 1, flexBasis: "280px", alignSelf: "flex-end" })], { rowGap: "32px", columnGap: "48px", alignItems: "flex-end", width: "100%", justifyContent: "space-between" })], { fond: S.alt, colonne: true, padV: ["48px", "40px", "36px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], max: "1280px", nom: "Lettre et mentions" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-075 « Rendez-vous bleu » — « Cabinet du Dr Lemaire » (fictif). Le geste unique : une immense bande jaune « Prendre rendez-vous » (le lien est la bande entière) sur teal profond. Pas de faux créneau :
// la pastille « prochain créneau » est volontairement ABSENTE (il faudrait un vrai agenda). Teal #0f5f66, jaune #ffd27a. Urbanist 800 + Inter.
const cabinetId = identite({
  key: "c075", label: "Teal profond et jaune doux", humeur: "dark",
  fond: "#0f5f66", texte: "#ffffff", discret: "#cfeaec", accent: "#ffd27a", surface: "#14747c",
  police: "font.inter", titres: "font.urbanist", rayon: "20px", rayonBouton: "999px", ombre: "none", poids: "800", bordure: "0px", ligne: "#ffffff40",
});
const cabinet = modeleV2({
  id: identifiantV2(75, "rendez-vous-bleu"), concept: "c-075-rendez-vous-bleu", name: "Rendez-vous bleu", family: FAM,
  description: "Une immense bande jaune « Prendre rendez-vous » sur teal profond : le geste unique, cliquable en entier. En dessous, horaires, téléphone et trois liens ; aucun faux créneau d'agenda.",
  tags: ["cabinet médical", "rendez-vous", "bande d'appel", "teal", "jaune", "centré"],
  identity: cabinetId,
  racine: racineDe("#0f5f66"),
  widgets: ["text", "link", "bizhours", "bizphone", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, ENCRE = "#0b3a3f";
    const marque = k.col([tx(k, "Cabinet du Dr Lemaire", { fontFamily: S.head, fontWeight: "800", fontSize: "26px", color: S.fg, textAlign: "center", lineHeight: 1.1 }), cap(k, "Cabinet médical", { align: "center", couleur: S.mute })], { gap: "6px", alignItems: "center", width: "100%" });
    const bande = G.fini(k, k.LINK("Prendre rendez-vous →", "/contact", { fontFamily: S.head, fontWeight: "800", fontSize: "fluid:40-112", lineHeight: 1.02, letterSpacing: "-0.025em", color: ENCRE, backgroundColor: S.accent, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "28px", paddingTop: "40px", paddingBottom: "44px", paddingLeft: "48px", paddingRight: "48px", width: "100%", boxSizing: "border-box", transitionDuration: G.MOUVEMENT, minHeight: "96px" }, { paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "28px", paddingBottom: "32px", paddingLeft: "24px", paddingRight: "24px", borderRadius: "22px" }),
      { hover: { backgroundColor: ENCRE, color: S.accent, textDecoration: "none", transform: { y: -3 } }, focus: G.focus("#ffffff") });
    const aide = tx(k, "Le bouton ouvre la page de contact du cabinet.", { fontSize: "13px", color: S.mute, textAlign: "center", width: "100%" });
    const hh = k.W("bizhours", { title: "Horaires", showOpenNow: true, groupDays: true, showExceptions: false, showNote: true, closedLabel: "Fermé" }, { color: S.fg, fontSize: "15px", fontFamily: S.font }); titreWidget(hh, S.mute);
    const heures = k.col([Moteur.finishNode(S, hh)], { gap: "8px", flexBasis: "0px", flexGrow: 1, minWidth: "240px" });
    const tel = k.col([Moteur.finishNode(S, k.W("bizphone", { which: "1", prefix: "", showLabel: false, showIcon: false }, { color: S.accent, fontFamily: S.head, fontWeight: "800", fontSize: "fluid:26-36", lineHeight: 1.15, whiteSpace: "nowrap" }))], { gap: "8px", flexBasis: "0px", flexGrow: 1, minWidth: "240px" });
    const liens = k.col([cap(k, "Utile"), k.row([["Contact", "/contact"], ["Questions fréquentes", "/faq"], ["Mon espace", "/connexion"]].map(([l, u]) => lien(k, G, l, u, { taille: 15, pv: "8px" })), { columnGap: "24px", rowGap: "0px" })], { gap: "6px", flexBasis: "0px", flexGrow: 1.4, minWidth: "240px" });
    const infos = k.row([heures, tel, liens], { rowGap: "28px", columnGap: "48px", alignItems: "flex-start", width: "100%", paddingTop: "8px" });
    const urgence = tx(k, "En cas d'urgence, appelez le 15 (texte d'exemple, à adapter à votre pays).", { fontSize: "14px", lineHeight: 1.5, color: S.mute, textAlign: "center", width: "100%", paddingTop: "20px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: S.line });
    const mentions = k.row([G.ligneLegale({ taille: 12, sansCookies: true })(k, env), reseaux(k, G, env, ["facebook", "instagram"], { fond: S.alt })], { rowGap: "16px", columnGap: "28px", alignItems: "center", justifyContent: "space-between", width: "100%" });
    const b = G.bande(k, [marque, bande, aide, infos, urgence, mentions], { fond: S.bg, colonne: true, gap: "28px", padV: ["88px", "72px", "56px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "20px"], max: "1280px", nom: "Rendez-vous" });
    return [G.racine(k, [b])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-076 « Croix de garde » — « Pharmacie des Tilleuls » (fictive). Une bande verticale vert sombre porte une grande croix CSS (deux barres) ; à côté : horaires (avec « ouvert maintenant » calculé par le widget d'horaires),
// coordonnées, bloc « garde » SANS numéro (texte d'exemple : le client ajoute le lien officiel) et quatre cartes-liens. Vert #12b76a, noir-vert #06210f. M PLUS Rounded 1c 700 + Noto Sans.
const pharmaId = identite({
  key: "c076", label: "Vert pharmacie", humeur: "light",
  fond: "#12b76a", texte: "#06210f", discret: "#0a3019", accent: "#06210f", surface: "#3ccb85", surEncre: "#ffffff",
  police: "font.noto-sans", titres: "font.m-plus-rounded-1c", rayon: "16px", rayonBouton: "14px", ombre: "none", poids: "700", bordure: "0px", ligne: "#06210f55",
});
const pharmacie = modeleV2({
  id: identifiantV2(76, "croix-de-garde"), concept: "c-076-croix-de-garde", name: "Croix de garde", family: FAM,
  description: "Une bande verticale sombre avec une grande croix de pharmacie dessinée en CSS ; à côté, horaires avec « ouvert maintenant », coordonnées, bloc pharmacie de garde sans numéro inventé et quatre cartes-liens.",
  tags: ["pharmacie", "croix", "bande latérale", "horaires", "vert", "cartes-liens"],
  identity: pharmaId,
  racine: racineDe("#12b76a"),
  widgets: ["text", "bizhours", "bizcontact", "link", "copyright", "bizlegal", "container"],
  compose(k, env, G) {
    const S = k.S, NUIT = "#06210f", CLAIR = "#d8f6e6";
    // 1 · la bande : croix (deux barres) + nom
    const croix = { type: "container", children: [
      { type: "container", children: [], ...sty({ position: "absolute", top: "0px", left: "34px", width: "32px", height: "100px", backgroundColor: "#12b76a", borderRadius: "6px" }) },
      { type: "container", children: [], ...sty({ position: "absolute", top: "34px", left: "0px", width: "100px", height: "32px", backgroundColor: "#12b76a", borderRadius: "6px" }) }], ...sty({ position: "relative", width: "100px", height: "100px", flexShrink: 0 }, undefined, { width: "64px", height: "64px" }) };
    croix.children[0].styles.mobile = { left: "22px", width: "20px", height: "64px" }; croix.children[1].styles.mobile = { top: "22px", width: "64px", height: "20px" };
    const nom = k.col([tx(k, "Pharmacie des Tilleuls", { fontFamily: S.head, fontWeight: "700", fontSize: "28px", lineHeight: 1.1, color: "#ffffff" }, undefined, { fontSize: "24px" }), tx(k, "Pharmacie de quartier", { fontSize: "14px", lineHeight: 1.4, color: CLAIR })], { gap: "6px" });
    const panneau = k.col([croix, nom], { backgroundColor: NUIT, width: "300px", flexShrink: 0, paddingTop: "72px", paddingBottom: "56px", paddingLeft: "40px", paddingRight: "32px", gap: "28px", alignItems: "flex-start", justifyContent: "flex-start" },
      { width: "100%", flexDirection: "row", alignItems: "center", paddingTop: "40px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px", flexShrink: 1 }, { paddingTop: "28px", paddingBottom: "24px", paddingLeft: "20px", paddingRight: "20px", gap: "16px" });
    // 2 · le contenu
    const bloc = (titre, ...c) => k.col([...(titre ? [cap(k, titre, { couleur: NUIT })] : []), ...c], { gap: "8px", flexBasis: "0px", flexGrow: 1, minWidth: "220px" });
    const hh = k.W("bizhours", { title: "Horaires", showOpenNow: true, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: NUIT, fontSize: "15px", fontFamily: S.font, fontWeight: "600" }); titreWidget(hh, NUIT);
    const heures = bloc(null, Moteur.finishNode(S, hh));
    const cc = k.W("bizcontact", { title: "Nous trouver", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: true, layout: "stack" }, { color: NUIT, fontSize: "15px", fontFamily: S.font, fontWeight: "600" }); titreWidget(cc, NUIT);
    const coord = bloc(null, Moteur.finishNode(S, cc));
    const garde = bloc("Pharmacie de garde", tx(k, "Pour connaître la pharmacie de garde, consultez le service officiel de votre région. Le lien peut être ajouté ici.", { fontSize: "15px", lineHeight: 1.5, color: NUIT, fontWeight: "600" }), tx(k, "Texte d'exemple : aucun numéro n'est indiqué.", { fontSize: "13px", color: S.mute }));
    const infos = k.row([garde, heures, coord], { rowGap: "28px", columnGap: "40px", alignItems: "flex-start", width: "100%" });
    const carte = (l, u) => G.fini(k, k.LINK(`${l}  →`, u, { fontFamily: S.head, fontWeight: "700", fontSize: "17px", color: NUIT, backgroundColor: S.alt, borderRadius: "16px", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "22px", paddingRight: "22px", minHeight: "64px", textDecoration: "none", display: "flex", alignItems: "center", boxSizing: "border-box", transitionDuration: G.MOUVEMENT }), { hover: { backgroundColor: NUIT, color: "#ffffff", transform: { y: -2 }, textDecoration: "none" }, focus: G.focus(NUIT) });
    const cartes = { type: "grid", children: [carte("Nous contacter", "/contact"), carte("Questions", "/faq"), carte("Actualités", "/blog"), carte("Mon compte", "/connexion")], ...sty({ columns: 4, gap: "14px", width: "100%" }, { columns: 2 }, { columns: 1, gap: "10px" }) };
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const zone = k.col([infos, cartes, filetH(k, "#06210f55"), mentions], { flexBasis: "0px", flexGrow: 1, minWidth: "0px", gap: "36px", paddingTop: "72px", paddingBottom: "36px", paddingLeft: "56px", paddingRight: "56px" }, { paddingTop: "44px", paddingLeft: "32px", paddingRight: "32px", flexBasis: "100%", flexGrow: 0 }, { paddingTop: "32px", paddingBottom: "28px", paddingLeft: "20px", paddingRight: "20px", gap: "28px" });
    return [G.racine(k, [G.bande(k, [panneau, zone], { aligne: "stretch", gap: "0px", padV: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Croix de garde" })])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-077 « Cercle de souffle » — « Studio Souffle » (fictif). Pile centrée : UN cercle (halos concentriques, STATIQUE : pas d'animation disponible dans les nœuds), trois pilules, une ligne de contact. Vert d'eau #ddeeea. Comfortaa 600 + Nunito Sans.
const souffleId = identite({
  key: "c077", label: "Vert d'eau et menthe", humeur: "light",
  fond: "#ddeeea", texte: "#1d3b38", discret: "#47665f", accent: "#256a61", surface: "#f0f8f5",
  police: "font.nunito-sans", titres: "font.comfortaa", rayon: "24px", rayonBouton: "999px", ombre: "none", poids: "600", bordure: "0px", ligne: "#a9cdc6",
});
const souffle = modeleV2({
  id: identifiantV2(77, "cercle-de-souffle"), concept: "c-077-cercle-de-souffle", name: "Cercle de souffle", family: FAM,
  description: "Presque rien : un grand cercle doux aux halos concentriques, trois pilules, une ligne de contact et le vide autour. Pile centrée, vert d'eau et menthe, pour un studio de yoga ou de méditation.",
  tags: ["yoga", "méditation", "cercle", "centré", "minimal", "vert d'eau"],
  identity: souffleId,
  racine: racineDe("#ddeeea"),
  widgets: ["text", "link", "bizcontact", "social", "copyright", "bizlegal", "container"],
  compose(k, env, G) {
    const S = k.S;
    const disque = (t, tm, couleur, enfants = [], extra = {}) => ({ type: "container", children: enfants, ...sty({ width: t, height: t, borderRadius: "50%", backgroundColor: couleur, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxSizing: "border-box", ...extra }, undefined, { width: tm, height: tm }) });
    const coeur = disque("280px", "200px", "#f0f8f5", [tx(k, "Souffle", { fontFamily: S.head, fontWeight: "600", fontSize: "fluid:34-52", color: S.fg, textAlign: "center", lineHeight: 1.1 }), tx(k, "Prenez un instant.", { fontSize: "15px", color: S.mute, textAlign: "center" })], { flexDirection: "column", gap: "6px" });
    const h3 = disque("400px", "290px", "#c5e2db", [coeur]);
    const h2 = disque("520px", "350px", "#d0e8e2", [h3]);
    const cercle = h2;
    const pil = G.pilules([["Nous écrire", "/contact"], ["Questions", "/faq"], ["Journal", "/blog"]], { fond: "#f0f8f5", contour: S.line, survolFond: S.accent, survolCouleur: "#ffffff", poids: "700", gap: "10px" })(k, env, true);
    const contact = Moteur.finishNode(S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: false, showIcons: false, layout: "inline" }, { color: S.mute, fontSize: "14px", fontFamily: S.font, textAlign: "center", width: "100%", display: "flex", justifyContent: "center" }));
    Moteur.mergePart(contact, "item", { styles: { desktop: { justifyContent: "center" }, mobile: { justifyContent: "center" } } });
    const ligne = k.row([contact, reseaux(k, G, env, ["instagram", "youtube"], { fond: "#f0f8f5" })], { rowGap: "12px", columnGap: "24px", justifyContent: "center", alignItems: "center" });
    const signature = tx(k, "Studio Souffle", { fontFamily: S.head, fontWeight: "700", fontSize: "18px", color: S.accent, textAlign: "center" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env, true);
    const b = G.bande(k, [cercle, pil, ligne, signature, filetH(k, S.line), mentions], { fond: S.bg, colonne: true, gap: "32px", aligne: "center", padV: ["96px", "80px", "56px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "20px"], max: "960px", innerMobile: { rowGap: "28px" }, nom: "Cercle" });
    return [G.racine(k, [b])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-078 « Deux rives » — association « Deux Rives » (fictive). Deux cartes qui se chevauchent de 16 px : teal (message, téléphone) et sable (ressources), avec un bord ondulé SVG. AUCUN numéro d'écoute inventé.
// Teal #134b4b, sable #e9dcc3, ambre #f0b35e. Gelasio 700 + Mulish.
const rivesId = identite({
  key: "c078", label: "Teal et sable", humeur: "dark",
  fond: "#134b4b", texte: "#f7f1e6", discret: "#cfe0da", accent: "#f0b35e", surface: "#1c5c5c",
  police: "font.mulish", titres: "font.gelasio", rayon: "28px", rayonBouton: "999px", ombre: "none", poids: "700", bordure: "0px", ligne: "#f7f1e640",
});
const rives = modeleV2({
  id: identifiantV2(78, "deux-rives"), concept: "c-078-deux-rives", name: "Deux rives", family: FAM,
  description: "Deux cartes aux bords ondulés qui se chevauchent un peu : le message d'écoute et le téléphone à gauche, les ressources à droite. Teal et sable, ton calme ; aucun numéro d'écoute inventé.",
  tags: ["association", "écoute", "cartes empilées", "bord ondulé", "teal", "sable"],
  identity: rivesId,
  racine: racineDe("#0d3636"),
  widgets: ["text", "bizphone", "link", "html", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, SABLE = "#e9dcc3", ENCRE = "#173a3a", FOND = "#0d3636";
    const teal = k.col([
      tx(k, "Deux Rives", { fontFamily: S.head, fontWeight: "700", fontSize: "fluid:36-52", lineHeight: 1.05, color: S.fg }),
      tx(k, "Un espace calme pour parler et être entendu, à votre rythme.", { fontSize: "18px", lineHeight: 1.6, color: S.mute, maxWidth: "420px" }),
      k.col([Moteur.finishNode(S, k.W("bizphone", { which: "1", prefix: "", showLabel: false, showIcon: false }, { color: S.accent, fontFamily: S.font, fontWeight: "800", fontSize: "fluid:28-40", lineHeight: 1.15, whiteSpace: "nowrap" }))], { gap: "6px" }),
      tx(k, "En cas d'urgence ou de danger immédiat, appelez le 15 (texte d'exemple, à adapter à votre pays).", { fontSize: "14px", lineHeight: 1.5, color: S.mute, maxWidth: "420px", paddingTop: "16px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: S.line }),
    ], { backgroundColor: "#134b4b", borderRadius: "28px", paddingTop: "56px", paddingBottom: "72px", paddingLeft: "48px", paddingRight: "72px", gap: "22px", flexBasis: "0px", flexGrow: 6, minWidth: "300px", boxSizing: "border-box", position: "relative", zIndex: 1 },
      { paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "40px", paddingBottom: "40px", paddingLeft: "24px", paddingRight: "24px", borderRadius: "24px" });
    const vV = svgDe(`<path d="M0 0H18C34 40 2 80 18 120S34 200 18 240 2 320 18 360 34 440 18 480 2 560 18 600 34 680 18 720 2 760 18 800H0Z" fill="#134b4b"/>`, "0 0 40 800");
    const vH = svgDe(`<path d="M0 0H800V16C760 34 720 -2 680 16S600 34 560 16 480 -2 440 16 360 34 320 16 240 -2 200 16 120 34 80 16 40 -2 0 16Z" fill="#134b4b"/>`, "0 0 800 40");
    const titreRes = cap(k, "Ressources", { couleur: "#46504a" });
    const liens = k.row([["Questions fréquentes", "/faq"], ["Nous écrire", "/contact"], ["Journal", "/blog"]].map(([l, u]) => lien(k, G, l, u, { taille: 16, poids: "700", couleur: ENCRE, survolCouleur: "#8a4b00", pv: "8px" })), { columnGap: "28px", rowGap: "0px" });
    const ecoute = tx(k, "Les numéros d'écoute et services officiels de votre région s'ajoutent ici. Aucun numéro n'est inventé dans ce modèle.", { fontSize: "15px", lineHeight: 1.55, color: ENCRE, borderStyle: "dashed", borderWidth: "1.5px", borderColor: "#173a3a99", borderRadius: "16px", paddingTop: "14px", paddingBottom: "14px", paddingLeft: "18px", paddingRight: "18px" });
    const sociaux = G.pilules([["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"]], { couleur: ENCRE, contour: "#173a3a", survolFond: ENCRE, survolCouleur: SABLE, gap: "10px" })(k, env);
    const sable = k.col([calque(vV, { masque: ["mobile"], st: { width: "40px", height: "100%", left: "0px" } }), calque(vH, { masque: ["desktop", "tablet"], st: { width: "100%", height: "36px" } }), titreRes, liens, ecoute, sociaux],
      { backgroundColor: SABLE, gap: "20px", alignItems: "flex-start", borderRadius: "28px", paddingTop: "56px", paddingBottom: "56px", paddingLeft: "88px", paddingRight: "48px", flexBasis: "0px", flexGrow: 5, minWidth: "300px", marginLeft: "-16px", boxSizing: "border-box", position: "relative", overflow: "hidden", zIndex: 2, color: ENCRE },
      { paddingLeft: "72px", paddingRight: "32px" }, { marginLeft: "0px", marginTop: "-8px", paddingTop: "64px", paddingBottom: "36px", paddingLeft: "24px", paddingRight: "24px", borderRadius: "24px" });
    const cartes = G.bande(k, [teal, sable], { gap: "0px", fond: FOND, padV: ["72px", "56px", "40px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "20px"], max: "1280px", aligne: "stretch", nom: "Deux cartes" });
    const bas = G.bande(k, [G.ligneLegale({ taille: 12, couleur: "#cfe0da", liens: "#f7f1e6", sansCookies: true })(k, env)], { fond: FOND, padV: ["16px", "16px", "12px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], max: "1280px", nom: "Mentions" });
    return [G.racine(k, [cartes, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Santé et bien-être", target: 6, built: true,
  description: "Cliniques, cabinets, spas et lieux de soin : douceur, repères d’urgence, prise de rendez-vous.",
  models: [reperes, spa, cabinet, pharmacie, souffle, rives],
};
