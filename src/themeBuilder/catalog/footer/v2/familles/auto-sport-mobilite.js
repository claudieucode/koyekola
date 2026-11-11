// Famille v2 « Automobile, sport et mobilité » — 5 modèles (concepts c-091 à c-095 de docs/footer-v2/CONCEPTS_100.md).
// Chaque modèle est INDÉPENDANT du site (solo) : ses couleurs en hexadécimal, ses polices de la bibliothèque, ses jetons --ft-*. Marques FICTIVES (texte modifiable dans l'éditeur).
// Aucune donnée inventée : adresse, téléphone, e-mail et horaires viennent des widgets EXISTANTS (Données de l'entreprise) ; les villes (c-091) et les cours (c-094) sont des textes d'EXEMPLE, signalés comme tels.
// Aucune urgence ni rareté (pas de « places limitées »), aucun résultat sportif.
// Polices d'affichage testées à 150 px (méthode du guide, §5 bis ; « Prêts à lancer ? é ê » regardé sur capture, accents, « a », « e ») : Michroma 400, Staatliches 400, Teko 700, Saira Extra Condensed 700/800,
// Bitter 700 : rendu PROPRE (aucune encoche ni fente). Titillium Web, Roboto Condensed, Barlow Semi Condensed, Saira, Assistant : polices de texte courant (petits corps).
const { modeleV2, identifiantV2, identite, G, Kit, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "auto-sport-mobilite";
const MS = G.MOUVEMENT;

// ── Aides locales ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const partie = (n, cle, styles, etats, mobile) => Moteur.mergePart(n, cle, { styles: { desktop: styles, ...(mobile ? { mobile } : {}) }, ...(etats ? { states: etats } : {}) });
// petit libellé en capitales espacées
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.16em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }), o.tablette, o.mobile);
// texte courant / titre
const texte = (k, html, o = {}) => k.T(/^\s*</.test(html) ? html : `<p>${html}</p>`, compact({ fontSize: o.taille === undefined ? "15px" : (typeof o.taille === "number" ? `${o.taille}px` : o.taille), lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, fontWeight: o.poids, letterSpacing: o.suivi, textTransform: o.casse, textAlign: o.align, maxWidth: o.largeur, ...(o.extra || {}) }), o.tablette, o.mobile);
// lien de texte fini par le moteur (états, 44 px sur mobile) puis états propres : survol, focus (contour 2 px)
function lien(k, label, url, o = {}) {
  const S = k.S;
  const n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: o.h || "32px", paddingLeft: o.padH, paddingRight: o.padH, letterSpacing: o.suivi, textTransform: o.casse, lineHeight: o.lh || 1.3, transitionDuration: MS, ...(o.extra || {}) }));
  return G.fini(k, n, { hover: o.survol || { textDecoration: "underline", color: o.survolCouleur || o.couleur || S.fg }, focus: G.focus(o.focus || o.couleur || S.accent) });
}
const hr = (k, couleur, ep = "1px", style) => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: ep, ...(style ? { borderStyle: style } : {}), marginTop: "0px", marginBottom: "0px" });
// volets : colonnes ÉGALES sur ordinateur (jamais de retour à la ligne), volets repliables sur mobile. panneaux : [titre, liste de [libellé, url] | fonction (k, env) => nœud, poids]
function volets(k, env, panneaux, o = {}) {
  const S = k.S;
  const L = (liste) => liste.map(([l, u]) => () => lien(k, l, u, { taille: o.taille || 15, h: o.h || "36px", lh: 1.35, couleur: o.couleurLien || S.fg, survolCouleur: o.survolLien || S.fg, focus: o.focusLien, ...(o.lien || {}) }));
  const v = Moteur.accordionNode(k, env, false, panneaux.map(([title, liste, w]) => ({ title, w: w || 1, codes: typeof liste === "function" ? [liste] : L(liste) })), {}, { min: "0px", start: "none" });
  for (const c of v.children) { Object.assign(c.styles.desktop, { color: S.fg, fontFamily: o.policeTitre || S.font, gap: "4px", flexBasis: "0px", minWidth: "0px", ...(o.titre || {}) }); if (o.tabletVolet) c.styles.tablet = { ...(c.styles.tablet || {}), ...o.tabletVolet }; if (o.mobileVolet) c.styles.mobile = { ...(c.styles.mobile || {}), ...o.mobileVolet }; }
  Object.assign(v.styles.desktop, { flexWrap: "nowrap", columnGap: o.colGap || "40px", rowGap: o.rowGap || "24px", alignItems: "flex-start", width: "100%", maxWidth: "100%", marginLeft: "0px", marginRight: "0px", ...(o.conteneur || {}) });
  v.styles.tablet = { ...(v.styles.tablet || {}), flexWrap: "wrap", ...(o.conteneurTablette || {}) };
  return v;
}
// colonnesOuVolets : MÊME contenu, deux rendus : colonnes simples (ordinateur et tablette ; largeurs égales, que le moteur d'accordéon ne permet pas : il enveloppe chaque volet dans un bloc de largeur libre)
// et volets repliables (mobile). Renvoie les deux nœuds (chacun masqué sur les autres écrans).
function colonnesOuVolets(k, env, panneaux, o = {}) {
  const S = k.S;
  const corps = (c) => (typeof c === "function" ? [c(k, env)] : c.map(([l, u]) => lien(k, l, u, { taille: o.taille || 15, h: o.h || "36px", lh: 1.35, couleur: o.couleurLien || S.fg, survolCouleur: o.survolLien || S.fg, focus: o.focusLien, ...(o.lien || {}) })));
  const cols = panneaux.map(([titre, c, w], i) => {
    const tete = o.entete ? o.entete(k, titre, i) : k.H(titre, "3", { fontSize: "18px", fontWeight: "700", lineHeight: 1.3, color: S.fg, fontFamily: o.policeTitre || S.font, marginBottom: "8px" });
    return k.col([tete, ...corps(c)], { flexBasis: "0px", flexGrow: w || 1, flexShrink: 1, minWidth: "0px", gap: o.gapCol || "4px", alignItems: "stretch", ...(o.col ? o.col(i) : {}) }, o.colTablette);
  });
  const rangee = k.row(cols, { flexWrap: "nowrap", ...G.gaps(o.gap || "0px 40px"), alignItems: "flex-start", width: "100%", ...(o.rangee || {}) }, { flexWrap: o.tabletWrap ? "wrap" : "nowrap", ...(o.rangeeTablette || {}) });
  const v = volets(k, env, panneaux, o);
  return [{ ...rangee, hideOn: ["mobile"] }, { ...v, hideOn: ["desktop", "tablet"] }];
}
const horaires = (k, o = {}) => {
  const n = k.W("bizhours", { title: o.titre || "", showOpenNow: true, groupDays: true, showExceptions: o.exceptions !== false, showNote: o.note !== false, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, ...(o.extra || {}) });
  return Moteur.finishNode(k.S, n);
};
const coordonnees = (k, o = {}) => {
  const n = k.W("bizcontact", { title: o.titre || "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: o.icones !== false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: o.lh });
  return Moteur.finishNode(k.S, n);
};
// Réseaux en icônes aux couleurs du modèle (carrés ou disques de 44 px)
function reseauxIcones(k, env, liste, o = {}) {
  const S = k.S, n = Moteur.item(k, `socials:${liste.join("+")}`, env);
  n.props.size = String(o.taille || 44); n.props.shape = o.forme || "square";
  Moteur.mergePart(n, "link", { styles: { desktop: compact({ color: o.couleur || S.fg, backgroundColor: o.fond, borderStyle: o.contour ? "solid" : undefined, borderWidth: o.contour ? (o.epaisseur || "1.5px") : undefined, borderColor: o.contour, transitionDuration: MS }) },
    states: { hover: { backgroundColor: o.survolFond || S.accent, color: o.survolCouleur || S.onAccent, borderColor: o.survolFond || S.accent }, focus: G.focus(o.focus || S.accent) } });
  return n;
}
const RESEAUX = ["instagram", "facebook", "youtube"];
const RESEAUX_TXT = [["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["YouTube", "https://www.youtube.com/"]];
// décor SVG (widget HTML sécurisé : formes seulement, aria-hidden). Variantes large / étroite masquées par écran (le CSS impose height:auto aux SVG).
const svgHtml = (k, large, etroit, st) => [
  { ...k.W("html", { html: large }, compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st })), hideOn: ["mobile"] },
  { ...k.W("html", { html: etroit }, compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st })), hideOn: ["desktop", "tablet"] },
];
const svgDe = (w, h, corps, ratio = "xMidYMid slice") => `<span aria-hidden="true"><svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="${ratio}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${corps}</svg></span>`;
// calque SVG qui couvre toute la surface d'un conteneur (derrière le contenu)
const calque = (html, o = {}) => ({ type: "html", props: { html }, ...(o.masque ? { hideOn: o.masque } : {}), ...sty(compact({ position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%", zIndex: 0, overflow: "hidden", lineHeight: 0.8, fontSize: "0px", ...(o.st || {}) })) });
function surFond(b, calques) {
  b.styles.desktop = { ...b.styles.desktop, position: "relative", overflow: "hidden" };
  const inner = b.children[0];
  inner.styles.desktop = { ...inner.styles.desktop, position: "relative", zIndex: 1 };
  b.children.push(...calques); // après le contenu dans le document (décor) ; empilé DERRIÈRE par z-index
  return b;
}
const r1 = (n) => Math.round(n * 10) / 10;

const modeles = [];

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-091 « Concession Contraste » — concession automobile fictive « Axiom Motors ». Noir carbone et rouge signal. Le geste : le NOM « AXIOM » en Michroma (très large), 178 px à 1280, face à des informations minuscules
// (13-15 px) : contraste d'échelle ≥ 12. Au-dessus, un trait rouge de 6 px ; sous le nom, un filet rouge ; puis l'annuaire en quatre colonnes fines (concessions, atelier, horaires réels, siège réel).
// Les villes sont des EXEMPLES (texte, pas des liens : aucune page par concession n'existe) ; aucun prix. Écarts au concept : pas de clip-path (le biseau est remplacé par la coupe nette du trait rouge) ;
// pas de widget « liste d'adresses » : le siège passe par le widget Coordonnées. Rouge plus clair que #E10600 (#ff5448) pour passer AA en petit texte. Michroma (titres) + Titillium Web (texte).
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const carbone = identite({
  key: "c091", label: "Noir carbone et rouge signal", humeur: "dark",
  fond: "#14161a", texte: "#f5f5f5", discret: "#b4b4b8", accent: "#ff5448", surface: "#1e2126",
  police: "font.titillium-web", titres: "font.michroma", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f5f5f52e",
});
modeles.push(modeleV2({
  id: identifiantV2(91, "concession-contraste"), concept: "c-091-concession-contraste", name: "Concession contraste", family: FAM,
  description: "Un nom de marque monumental en lettres très larges face à des informations minuscules : trait rouge signal, annuaire en quatre colonnes fines, horaires et siège de votre fiche entreprise.",
  tags: ["automobile", "concession", "noir", "rouge", "monumental", "annuaire", "contraste d'échelle"],
  identity: carbone,
  racine: { desktop: { backgroundColor: "#14161a", gap: "0px" } },
  widgets: ["text", "link", "bizhours", "bizcontact", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, ROUGE = S.accent;
    // 1 · LE GESTE : AXIOM, Michroma 400, 52 → 200 px (bureau), 120 → 170 (tablette), 52 → 200 (mobile), blanc ; le point rouge termine le mot
    const nom = G.geant(`<p>AXIOM<span style="color:${ROUGE}">.</span></p>`, { taille: [64, 200], tablette: { taille: [120, 170] }, mobile: { taille: [52, 200] }, lh: 0.95, suivi: "0.02em", poids: "400", police: S.head, couleur: S.fg })(k, env);
    const tete = G.ligne(k, [
      caps(k, "Concession automobile", { couleur: S.mute, police: S.head, taille: "11px", suivi: "0.3em" }),
      caps(k, "Marque fictive d’exemple", { couleur: S.mute, taille: "12px" }),
    ], { gap: "8px 32px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const sous = G.ligne(k, [
      caps(k, "Motors", { couleur: ROUGE, police: S.head, taille: "22px", suivi: "0.9em", extra: { paddingLeft: "6px" }, mobile: { fontSize: "16px", letterSpacing: "0.6em" } }),
      reseauxIcones(k, env, RESEAUX, { forme: "square", contour: S.line, couleur: S.fg }),
    ], { gap: "16px 32px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const haut = G.bande(k, [tete, nom, G.filet({ largeur: "100%", epaisseur: "2px", couleur: ROUGE })(k, env), sous], {
      colonne: true, gap: "28px", padV: ["72px", "56px", "44px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "20px"], fond: S.bg, filetHaut: { epaisseur: "6px", couleur: ROUGE },
      degrade: { from: "#22262d", to: "#14161a", angle: 180 }, innerMobile: { rowGap: "20px" }, nom: "Nom monumental",
    });
    // 2 · L'ANNUAIRE : quatre colonnes fines (volets sur mobile) ; titres 18 px (imposés) en Titillium
    const villes = (kk) => kk.col([...["Lille", "Nantes", "Bordeaux", "Marseille"].map((v) => texte(kk, v, { taille: 15, couleur: S.fg, lh: 1.5, extra: { paddingTop: "6px", paddingBottom: "6px" } })), texte(kk, "Villes d’exemple, à remplacer par vos concessions.", { taille: 12, couleur: S.mute, lh: 1.4, extra: { paddingTop: "6px" } })], { gap: "0px" });
    const annuaire = colonnesOuVolets(k, env, [
      ["Concessions", villes, 1],
      ["Atelier et services", [["Prendre rendez-vous", "/contact"], ["Questions fréquentes", "/faq"], ["Mon espace client", "/connexion"], ["Actualités", "/blog"]], 1],
      ["Horaires", (kk) => horaires(kk, { taille: 14, couleur: S.fg, exceptions: false, note: false }), 1],
      ["Siège", (kk) => coordonnees(kk, { taille: 14, lh: 1.5 }), 1],
    ], { policeTitre: S.font, gap: "28px 48px", taille: 14, tabletWrap: true, colTablette: { flexBasis: "44%", flexGrow: 0, flexShrink: 0 }, mobileVolet: { borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: S.line } });
    const corps = G.bande(k, annuaire, { colonne: true, padV: ["48px", "44px", "32px"], padB: ["64px", "52px", "32px"], padH: ["48px", "32px", "20px"], fond: S.bg, nom: "Annuaire" });
    const mentions = G.bande(k, [G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { colonne: true, padV: ["28px", "24px", "20px"], padB: ["12px", "12px", "12px"], padH: ["48px", "32px", "20px"], fond: S.bg, filetHaut: { epaisseur: "1px", couleur: S.line }, nom: "Mentions" });
    return [G.racine(k, [haut, corps, mentions])];
  },
}, FAM));

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-092 « Garage Damier » — garage moto fictif « Cylindre ». Brun rouille et orange. Le geste : un DAMIER de course (SVG, carrés de 32 px, deux rangées) qui sépare la ligne de menu des mentions, comme un drapeau à damier.
// Le nom CYLINDRE en Staatliches (200 px max) est à DROITE (logo à droite), le téléphone en grand corps à gauche (widget Téléphone réel : 40 → 68 px) avec les horaires réels. Menu en cinq cases brutalistes
// (bordure de 3 px, ombre dure orange décalée de 5 px, qui se décale de 4 px au survol). Staatliches (titres) + Roboto Condensed (texte).
// Écarts au concept : le damier est un SVG (le fond répété en conic-gradient n'existe pas) ; sur mobile le menu reste visible en cases (pas de bouton « Menu » : 5 liens seulement) ;
// pas de numéro d'atelier inventé : le grand corps est le nom et le téléphone.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const rouille = identite({
  key: "c092", label: "Brun rouille et orange de course", humeur: "dark",
  fond: "#3b2a22", texte: "#f6ebdd", discret: "#d9c6b2", accent: "#ff6a2e", surface: "#4b372d",
  police: "font.roboto-condensed", titres: "font.staatliches", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "3px", ligne: "#f6ebdd55",
});
const damier = (W, H, c) => {
  const cols = Math.round(W / c), rangs = Math.round(H / c);
  let s = `<rect width="${W}" height="${H}" fill="#f6ebdd"/>`;
  for (let r = 0; r < rangs; r++) for (let i = 0; i < cols; i++) if ((i + r) % 2 === 0) s += `<rect x="${i * c}" y="${r * c}" width="${c}" height="${c}" fill="#140c08"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
};
modeles.push(modeleV2({
  id: identifiantV2(92, "garage-damier"), concept: "c-092-garage-damier", name: "Garage damier", family: FAM,
  description: "Un damier de course sépare le menu des mentions : nom d'atelier géant à droite, téléphone en très grand corps et horaires de votre fiche entreprise à gauche, cases de menu brutalistes à ombre dure.",
  tags: ["garage", "moto", "damier", "brutaliste", "téléphone", "rouille", "orange", "atelier"],
  identity: rouille,
  racine: { desktop: { backgroundColor: "#3b2a22", gap: "0px" } },
  widgets: ["text", "link", "html", "bizphone", "bizhours", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, ORANGE = S.accent, CREME = "#f6ebdd", ENCRE = "#140c08";
    // 1 · LE NOM, à droite : Staatliches 72 → 200 px, aligné à droite sur ordinateur, à gauche sur mobile
    const nom = G.geant("<p>Cylindre</p>", { taille: [72, 200], tablette: { taille: [110, 150] }, mobile: { taille: [76, 200], lh: 0.9 }, lh: 0.88, suivi: "0.01em", poids: "400", police: S.head, couleur: S.fg, align: "right" })(k, env);
    const sigle = caps(k, "Garage moto · Atelier et pièces", { couleur: ORANGE, taille: "13px", extra: { textAlign: "right" } });
    const droite = G.colonne(k, [nom, sigle], { poids: 6, min: "320px", gap: "10px", aligne: "flex-end", mobile: { alignItems: "flex-start", flexBasis: "100%" }, tablette: { flexBasis: "100%", alignItems: "flex-start" } });
    // 2 · LE TÉLÉPHONE, à gauche, en très grand corps (widget réel : n'apparaît pas tant que le téléphone n'est pas renseigné) + horaires
    const tel = k.W("bizphone", { which: "1", prefix: "", showLabel: false, showIcon: false }, { color: S.fg, fontFamily: S.head, fontSize: "fluid:40-68", lineHeight: 1, letterSpacing: "0.02em", fontWeight: "400", textDecoration: "none" });
    Moteur.finishNode(S, tel);
    tel.states = { ...(tel.states || {}), hover: { color: ORANGE, textDecoration: "underline" }, focus: G.focus(ORANGE) };
    const hh = horaires(k, { taille: 14, titre: "", exceptions: false, note: false, couleur: S.mute });
    const gauche = G.colonne(k, [tel, hh], { poids: 5, min: "320px", gap: "10px", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } });
    const haut = k.row([droite, gauche], { ...G.gaps("32px 48px"), alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", flexDirection: "row-reverse", width: "100%" }, { flexDirection: "row" }, { flexDirection: "row" });
    // 3 · MENU : cases brutalistes (bordure 3 px, ombre dure orange qui se décale de 4 px)
    const case_ = (l, u) => {
      const n = k.LINK(l, u, { fontSize: "19px", fontWeight: "700", fontFamily: S.font, textTransform: "uppercase", letterSpacing: "0.06em", color: "#2a1b14", backgroundColor: CREME, borderStyle: "solid", borderWidth: "3px", borderColor: ENCRE, borderRadius: "0px", minHeight: "52px", paddingLeft: "22px", paddingRight: "22px", display: "inline-flex", alignItems: "center", textDecoration: "none", shadow: { x: 5, y: 5, blur: 0, spread: 0, color: ORANGE }, transitionDuration: MS }, undefined, { flexGrow: 1, flexBasis: "40%", justifyContent: "center", fontSize: "17px" });
      return G.fini(k, n, { hover: { transform: { x: 4, y: 4 }, shadow: { x: 1, y: 1, blur: 0, spread: 0, color: ORANGE }, color: "#2a1b14", textDecoration: "none" }, focus: G.focus(CREME) });
    };
    const menu = k.row([case_("Accueil", "/"), case_("Le blog", "/blog"), case_("Questions", "/faq"), case_("Contact", "/contact"), case_("Mon compte", "/connexion")], { ...G.gaps("16px 18px"), alignItems: "center", flexWrap: "wrap" }, undefined, { ...G.gaps("16px 14px") });
    const reseaux = reseauxIcones(k, env, RESEAUX, { forme: "square", fond: CREME, couleur: "#2a1b14", contour: ENCRE, epaisseur: "3px", survolFond: ORANGE, survolCouleur: "#1a0d06" });
    const ligneMenu = G.ligne(k, [menu, reseaux], { gap: "24px 40px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const bandeHaut = G.bande(k, [haut, ligneMenu], { colonne: true, gap: "48px", padV: ["72px", "56px", "40px"], padB: ["56px", "44px", "36px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "32px" }, nom: "Atelier" });
    // 4 · LE DAMIER : bande pleine largeur (SVG décoratif ; variante étroite sur mobile)
    const bandeDamier = G.bande(k, svgHtml(k, damier(1440, 64, 32), damier(390, 52, 26), {}), { padV: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", gap: "0px", fond: CREME, nom: "Damier" });
    const mentions = G.bande(k, [G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { colonne: true, padV: ["28px", "24px", "20px"], padB: ["12px", "12px", "12px"], padH: ["48px", "32px", "20px"], fond: S.bg, nom: "Mentions" });
    return [G.racine(k, [bandeHaut, bandeDamier, mentions])];
  },
}, FAM));

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-093 « Maillot en Biais » — club de football fictif « AS Rivage ». Bleu royal et jaune. Le geste : une DIAGONALE tranche le pied en deux, comme les bandes d'un maillot : à gauche le bleu (nom « RIVAGE » en Teko 700,
// jusqu'à 200 px, coordonnées, réseaux), à droite un panneau jaune de trois grandes cases-liens (billetterie, boutique, fan-club). La diagonale est un polygone SVG (aplat jaune, derrière le contenu) : le contenu de
// droite est posé sur un aplat JAUNE identique, donc le contraste est tenu quelle que soit la largeur. Le tout est une « carte » centrée de 1280 px max sur un fond bleu nuit.
// Sur mobile la diagonale devient une coupe droite : deux moitiés empilées. Teko (titres) + Barlow Semi Condensed (texte). Écarts : pas de clip-path (SVG) ; pas de newsletter (le concept n'en a pas).
// Billetterie et boutique pointent vers les pages de la plateforme (/boutique, /catalogue) : à rediriger vers le vrai site de billetterie dans l'éditeur.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const rivage = identite({
  key: "c093", label: "Bleu royal et jaune de club", humeur: "dark",
  fond: "#0a2a66", texte: "#ffffff", discret: "#c7d6f3", accent: "#ffd100", surface: "#0f3a8c",
  police: "font.barlow-semi-condensed", titres: "font.teko", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#ffffff40",
});
modeles.push(modeleV2({
  id: identifiantV2(93, "maillot-en-biais"), concept: "c-093-maillot-en-biais", name: "Maillot en biais", family: FAM,
  description: "Une diagonale bleu et jaune coupe le pied comme un maillot : nom du club géant à gauche, trois grandes cases (billetterie, boutique, fan-club) sur l'aplat jaune à droite, coordonnées et réseaux.",
  tags: ["football", "club", "sport", "diagonale", "bleu", "jaune", "billetterie", "maillot"],
  identity: rivage,
  racine: { desktop: { backgroundColor: "#071d49", gap: "0px" } },
  widgets: ["text", "link", "html", "bizcontact", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, JAUNE = S.accent, MARINE = "#0a2a66", NUIT = "#071d49";
    // 1 · GAUCHE (bleu) : « AS » jaune, « RIVAGE » blanc très grand, coordonnées réelles, réseaux en disques
    const as = G.geant("<p>AS</p>", { taille: [56, 96], lh: 0.8, suivi: "0.04em", poids: "700", police: S.head, couleur: JAUNE })(k, env);
    const nom = G.geant("<p>RIVAGE</p>", { taille: [96, 200], tablette: { taille: [108, 140] }, mobile: { taille: [100, 200] }, lh: 0.82, suivi: "0.01em", poids: "700", police: S.head, couleur: S.fg })(k, env);
    const club = caps(k, "Club de football · marque fictive", { couleur: S.mute, taille: "13px" });
    const coord = coordonnees(k, { taille: 15, lh: 1.5, couleur: S.fg });
    partie(coord, "icon", { color: JAUNE });
    const rond = reseauxIcones(k, env, RESEAUX, { forme: "circle", contour: JAUNE, epaisseur: "2px", couleur: JAUNE, survolFond: JAUNE, survolCouleur: MARINE });
    const gauche = k.col([k.col([as, nom], { gap: "0px" }), club, k.col([coord, rond], { gap: "20px" })], { gap: "28px", flexGrow: 1, flexBasis: "0px", minWidth: "0px", paddingLeft: "56px", paddingRight: "110px", paddingTop: "64px", paddingBottom: "56px", alignItems: "flex-start", zIndex: 1 },
      { paddingLeft: "32px", paddingRight: "70px", paddingTop: "48px", paddingBottom: "44px" }, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px", paddingBottom: "36px", flexBasis: "auto" });
    // 2 · DROITE (jaune) : trois grandes cases-liens bleu sur jaune ; la case se décale de 4 px au survol
    const case_ = (num, l, u) => {
      const n = k.LINK(`${num}  ${l} →`, u, { fontSize: "34px", fontFamily: S.head, fontWeight: "600", lineHeight: 1, letterSpacing: "0.03em", textTransform: "uppercase", color: JAUNE, backgroundColor: MARINE, minHeight: "76px", display: "flex", alignItems: "center", paddingLeft: "20px", paddingRight: "20px", textDecoration: "none", width: "100%", boxSizing: "border-box", transitionDuration: MS }, undefined, { fontSize: "30px", minHeight: "64px" });
      n.styles.tablet = { ...(n.styles.tablet || {}), fontSize: "27px", minHeight: "68px" };
      return G.fini(k, n, { hover: { transform: { x: 4 }, backgroundColor: "#071d49", color: JAUNE, textDecoration: "none" }, focus: { outlineStyle: "solid", outlineWidth: "3px", outlineColor: MARINE, outlineOffset: "3px" } });
    };
    const pl = (l, u) => lien(k, l, u, { couleur: MARINE, poids: "700", taille: 15, h: "44px", extra: { textDecoration: "underline" }, survolCouleur: MARINE, focus: MARINE });
    const petits = k.row([pl("Contact", "/contact"), pl("Actualités", "/blog"), pl("Questions", "/faq")], { ...G.gaps("0px 24px"), alignItems: "center", flexWrap: "wrap" });
    const droite = k.col([caps(k, "Rejoindre le club", { couleur: MARINE, taille: "13px" }), case_("01", "Billetterie", "/boutique"), case_("02", "Boutique", "/catalogue"), case_("03", "Fan-club", "/inscription"), petits], { gap: "14px", flexBasis: "36%", flexGrow: 0, flexShrink: 0, minWidth: "0px", backgroundColor: JAUNE, color: MARINE, paddingLeft: "40px", paddingRight: "48px", paddingTop: "64px", paddingBottom: "52px", justifyContent: "center", alignItems: "stretch", zIndex: 1 },
      { flexBasis: "38%", paddingLeft: "24px", paddingRight: "24px", paddingTop: "44px", paddingBottom: "36px" }, { flexBasis: "auto", paddingLeft: "20px", paddingRight: "20px", paddingTop: "32px", paddingBottom: "28px" });
    // 3 · LA CARTE : fond bleu, diagonale jaune en calque SVG (tablette et ordinateur) ; sur mobile, deux moitiés empilées (coupe droite)
    const poly = (W, H) => `<polygon points="${r1(W * 0.63)},0 ${W},0 ${W},${H} ${r1(W * 0.585)},${H}" fill="${JAUNE}"/>`;
    const carte = { type: "container", children: [calque(svgDe(1000, 600, poly(1000, 600), "none"), { masque: ["mobile"] }), gauche, droite],
      ...sty({ display: "flex", flexDirection: "row", flexWrap: "nowrap", alignItems: "stretch", gap: "0px", position: "relative", overflow: "hidden", width: "100%", maxWidth: "1280px", marginLeft: "auto", marginRight: "auto", backgroundColor: MARINE }, undefined, { flexDirection: "column" }) };
    const bande = G.bande(k, [carte], { colonne: true, padV: ["48px", "36px", "20px"], padB: ["20px", "16px", "12px"], padH: ["32px", "24px", "16px"], fond: NUIT, nom: "Maillot" });
    const mentions = G.bande(k, [G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { colonne: true, padV: ["20px", "20px", "20px"], padB: ["12px", "12px", "12px"], padH: ["32px", "24px", "16px"], fond: NUIT, nom: "Mentions" });
    return [G.racine(k, [bande, mentions])];
  },
}, FAM));

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-094 « Planning de salle » — salle de sport fictive « Forge ». Rouge brique et jaune. Le geste : le PLANNING DE LA SEMAINE en sept colonnes (lundi → dimanche), trois créneaux par jour ; chaque créneau est un lien vers
// la page Contact et s'inverse (jaune sur brique) au survol. Sur mobile, les jours deviennent sept volets de 48 px. Cours et horaires : EXEMPLES clairement signalés
// (« Exemple de planning… »), modifiables dans l'éditeur ; aucun « places limitées », aucune pastille « ouvert » inventée : les horaires d'ouverture réels sont ceux du widget Horaires (statut calculé).
// Écarts au concept : pas de widget Tableau → colonnes construites avec le mécanisme de volets du moteur ; la « case du jour » surlignée est omise (elle exigerait un script) ; pas de défilement horizontal sur mobile (volets).
// Saira Extra Condensed 800 (titre, 200 px) + Saira (texte).
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const forge = identite({
  key: "c094", label: "Rouge brique et jaune de salle", humeur: "dark",
  fond: "#b71c1c", texte: "#ffffff", discret: "#ffd9d0", accent: "#ffd166", surface: "#8e1313",
  police: "font.saira", titres: "font.saira-extra-condensed", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#ffd9d070",
});
const COURS = {
  Lundi: [["07:00", "Cross training"], ["12:15", "Renforcement"], ["18:30", "Boxe"]],
  Mardi: [["07:00", "Mobilité"], ["12:15", "Cardio"], ["19:00", "Yoga"]],
  Mercredi: [["07:00", "Cross training"], ["12:15", "Gainage"], ["18:30", "Cardio"]],
  Jeudi: [["07:00", "Renforcement"], ["12:15", "Mobilité"], ["19:00", "Boxe"]],
  Vendredi: [["07:00", "Cardio"], ["12:15", "Cross training"], ["18:00", "Stretching"]],
  Samedi: [["09:00", "Cross training"], ["10:30", "Yoga"], ["12:00", "Gainage"]],
  Dimanche: [["10:00", "Mobilité"], ["11:15", "Stretching"]],
};
modeles.push(modeleV2({
  id: identifiantV2(94, "planning-de-salle"), concept: "c-094-planning-de-salle", name: "Planning de salle", family: FAM,
  description: "Le planning de la semaine en sept colonnes sous un nom de salle géant : créneaux cliquables qui s'inversent au survol, jours repliables sur mobile, horaires d'ouverture réels. Cours d'exemple à remplacer.",
  tags: ["salle de sport", "fitness", "planning", "horaires", "tableau", "rouge", "jaune", "cours"],
  identity: forge,
  racine: { desktop: { backgroundColor: "#8e1313", gap: "0px" } },
  widgets: ["text", "link", "bizhours", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, JAUNE = S.accent, BRIQUE = S.bg;
    // 1 · TÊTE : FORGE (Saira Extra Condensed 800, 200 px) et la consigne d'usage du planning
    const nom = G.geant("<p>FORGE</p>", { taille: [96, 200], tablette: { taille: [120, 170] }, mobile: { taille: [120, 200] }, lh: 0.82, suivi: "0.01em", poids: "800", police: S.head, couleur: S.fg })(k, env);
    const intro = k.col([caps(k, "Planning de la semaine", { couleur: JAUNE, taille: "14px" }), texte(k, "Exemple de planning : remplacez ces cours et ces heures par les vôtres dans l’éditeur.", { taille: 14, couleur: S.mute, lh: 1.5, largeur: "320px" })], { gap: "6px", flexGrow: 0, alignItems: "flex-start" });
    const tete = G.ligne(k, [nom, intro], { gap: "20px 48px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    // 2 · LE PLANNING : sept volets = sept colonnes (bureau et tablette) ; chaque créneau est un lien « 07:00 Cross training » (inversion au survol)
    const creneau = (h, c) => (kk) => lien(kk, `${h}  ${c}`, "/contact", { taille: 14, poids: "600", couleur: S.fg, h: "52px", lh: 1.25, focus: JAUNE, survol: { backgroundColor: JAUNE, color: BRIQUE, textDecoration: "none" },
      extra: { width: "100%", boxSizing: "border-box", paddingLeft: "10px", paddingRight: "8px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: S.line } });
    const panneaux = Object.entries(COURS).map(([jour, liste]) => [jour, (kk) => kk.col(liste.map(([h, c]) => creneau(h, c)(kk)), { gap: "0px", width: "100%", alignItems: "stretch" }), 1]);
    const entete = (kk, jour) => kk.T(`<p>${jour}</p>`, { fontFamily: S.head, fontSize: "30px", fontWeight: "700", lineHeight: 1.2, color: S.fg, backgroundColor: "#8e1313", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "10px", paddingRight: "8px" });
    const planning = colonnesOuVolets(k, env, panneaux, { policeTitre: S.head, entete, gap: "0px", gapCol: "0px", h: "52px",
      col: (i) => ({ borderStyle: "solid", borderWidth: "0px", borderLeftWidth: i ? "1px" : "0px", borderColor: S.line, backgroundColor: "#8e1313" }),
      rangee: { borderStyle: "solid", borderWidth: "1px", borderColor: S.line, backgroundColor: "#8e1313" }, mobileVolet: { backgroundColor: "#8e1313" } });
    // 3 · PIED : horaires d'ouverture réels, liens, réseaux en carrés
    const h = horaires(k, { taille: 14, titre: "Ouverture", exceptions: true, note: true, couleur: S.fg });
    partie(h, "title", { fontFamily: S.head, fontSize: "26px", fontWeight: "700", color: JAUNE, marginBottom: "6px", letterSpacing: "0.04em", textTransform: "uppercase" });
    const liens = k.col([caps(k, "Utile", { couleur: JAUNE }), ...[["Contact", "/contact"], ["Questions fréquentes", "/faq"], ["Mon compte", "/connexion"], ["Actualités", "/blog"]].map(([l, u]) => lien(k, l, u, { taille: 15, h: "36px", focus: JAUNE, survolCouleur: JAUNE }))], { gap: "0px", alignItems: "flex-start" });
    const rs = k.col([caps(k, "Suivez-nous", { couleur: JAUNE }), reseauxIcones(k, env, RESEAUX, { forme: "square", contour: JAUNE, couleur: JAUNE, survolFond: JAUNE, survolCouleur: "#8e1313" })], { gap: "10px", alignItems: "flex-start" });
    const bas = G.ligne(k, [G.colonne(k, [h], { poids: 2, min: "260px" }), G.colonne(k, [liens], { poids: 1, min: "200px" }), G.colonne(k, [rs], { poids: 1, min: "200px" })], { gap: "32px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const bande = G.bande(k, [tete, ...planning, bas], { colonne: true, gap: "40px", padV: ["72px", "56px", "40px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "16px"], fond: BRIQUE, degrade: { from: "#b71c1c", to: "#8e1313", angle: 180 }, innerMobile: { rowGap: "28px" }, nom: "Planning" });
    const mentions = G.bande(k, [G.ligneLegale({ taille: 12, sansCookies: true, couleur: "#ffd9d0" })(k, env)], { colonne: true, padV: ["24px", "20px", "20px"], padB: ["12px", "12px", "12px"], padH: ["48px", "32px", "16px"], fond: "#8e1313", filetHaut: { epaisseur: "1px", couleur: S.line }, nom: "Mentions" });
    return [G.racine(k, [bande, mentions])];
  },
}, FAM));

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-095 « Courbes de niveau » — marque outdoor fictive « Sentier Nord ». Vert mousse et ocre. Le geste : des COURBES DE NIVEAU (SVG, comme une carte d'état-major) parcourent tout le fond du pied, avec deux points cotés
// (cercle + triangle ocre, sans chiffre inventé). Le nom en Bitter 700 (jusqu'à 120 px), trois colonnes (Explorer, Aide, Newsletter dans un « galet » aux coins asymétriques), réseaux en noms suivis d'une flèche.
// Courbes générées par code (contours déformés autour de trois sommets) : tracé plein et fin, légèrement plus clair que le fond (les opacités SVG sont supprimées par le nettoyeur : couleurs pleines).
// Écarts au concept : pas d'apparition en fondu (aucun mécanisme d'entrée dans le pied) ; liens vers les pages de la plateforme (boutique, catalogue, actualités). Bitter (titres) + Assistant (texte).
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const mousse = identite({
  key: "c095", label: "Vert mousse et ocre", humeur: "dark",
  fond: "#3a4a33", texte: "#f1efe0", discret: "#d0d5bc", accent: "#ecaa48", surface: "#46583e",
  police: "font.assistant", titres: "font.bitter", rayon: "24px", rayonBouton: "999px", ombre: "none", poids: "700", bordure: "0px", ligne: "#f1efe040",
});
const alea = (graine) => { let a = graine >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
// courbes de niveau : contours fermés déformés (harmoniques) autour de sommets ; chaque cinquième courbe (« maîtresse ») est plus épaisse
function courbes(W, H, sommets) {
  const rnd = alea(95), parts = [];
  for (const [cx, cy, n, pas, deform] of sommets) {
    const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
    for (let i = 1; i <= n; i++) {
      const r0 = i * pas, pts = [];
      for (let a = 0; a < 36; a++) {
        const t = (a / 36) * Math.PI * 2, f = 1 + deform * (0.55 * Math.sin(2 * t + ph[0] + i * 0.11) + 0.3 * Math.sin(3 * t + ph[1] - i * 0.07) + 0.15 * Math.sin(5 * t + ph[2]));
        pts.push(`${Math.round(cx + Math.cos(t) * r0 * f * 1.25)},${Math.round(cy + Math.sin(t) * r0 * f * 0.8)}`);
      }
      const maitresse = i % 5 === 0;
      parts.push(`<polygon points="${pts.join(" ")}" fill="none" stroke="${maitresse ? "#586d4e" : "#4c6044"}" stroke-width="${maitresse ? 2.4 : 1.4}" stroke-linejoin="round"/>`);
    }
  }
  return parts.join("");
}
// point coté : cercle + triangle (ocre), sans texte
const pointCote = (x, y) => `<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="#ecaa48" stroke-width="2.5"/><polygon points="${x},${y - 5} ${x + 5},${y + 4} ${x - 5},${y + 4}" fill="#ecaa48"/>`;
modeles.push(modeleV2({
  id: identifiantV2(95, "courbes-de-niveau"), concept: "c-095-courbes-de-niveau", name: "Courbes de niveau", family: FAM,
  description: "Des courbes de niveau de carte d'état-major courent sur un fond vert mousse : nom de marque en grand, trois colonnes de liens et une newsletter dans un galet aux coins asymétriques, réseaux en noms suivis d'une flèche.",
  tags: ["outdoor", "trail", "randonnée", "courbes de niveau", "topographie", "vert", "ocre", "newsletter"],
  identity: mousse,
  racine: { desktop: { backgroundColor: "#3a4a33", gap: "0px" } },
  widgets: ["text", "link", "html", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, OCRE = S.accent, GALET = "#46583e";
    // 1 · LE FOND : courbes de niveau + deux points cotés (SVG décoratif derrière le contenu)
    const fond = `${pointCote(1180, 250)}${pointCote(1130, 640)}${courbes(1440, 900, [[250, 230, 16, 36, 0.2], [1130, 640, 15, 38, 0.22], [760, 880, 8, 40, 0.18]])}`;
    // 2 · LE NOM, Bitter 700 : 52 → 120 px, ocre pour « Nord »
    const nom = G.geant(`<p>Sentier<span style="color:${OCRE}"> Nord</span></p>`, { taille: [52, 120], tablette: { taille: [80, 100] }, mobile: { taille: [58, 120] }, lh: 1, suivi: "-0.01em", poids: "700", police: S.head, couleur: S.fg })(k, env);
    const tete = k.col([caps(k, "Matériel et sorties trail · marque fictive", { couleur: S.mute, taille: "13px", suivi: "0.12em" }), nom], { gap: "10px", alignItems: "flex-start", width: "100%" });
    // 3 · TROIS COLONNES (volets sur mobile) : Explorer, Aide, Newsletter dans un galet
    const abo = G.abonnement({ titre: "", intro: "Une lettre pour les sorties, le matériel et les nouveautés. Sans spam.", bouton: "S'abonner", largeur: "100%", soulignement: "2px", fondChamp: "#3a4a33", rayonChamp: "999px", rembChamp: "20px", policeChamp: S.font, tailleChamp: "16px" })(k, env);
    abo.parts.title.styles.desktop = { fontFamily: S.head, fontSize: "20px", fontWeight: "700", color: S.fg, marginBottom: "4px", textTransform: "none", letterSpacing: "0em" };
    abo.parts.input.styles.desktop = { ...abo.parts.input.styles.desktop, borderWidth: "1.5px", borderStyle: "solid", borderColor: OCRE, height: "52px" };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, minHeight: "52px" };
    const galet = () => ({ type: "stack", children: [abo], ...sty({ display: "flex", flexDirection: "column", gap: "10px", backgroundColor: GALET, color: S.fg, paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", borderTopLeftRadius: "56px", borderTopRightRadius: "14px", borderBottomRightRadius: "56px", borderBottomLeftRadius: "14px", width: "100%", boxSizing: "border-box" }) });
    const colonnes = volets(k, env, [
      ["Explorer", [["Boutique", "/boutique"], ["Catalogue", "/catalogue"], ["Actualités", "/blog"]], 1],
      ["Aide", [["Questions fréquentes", "/faq"], ["Contact", "/contact"], ["Mon compte", "/connexion"]], 1],
      ["Newsletter", galet, 1.6],
    ], { policeTitre: S.head, colGap: "56px", taille: 16, h: "40px", titre: { fontSize: "18px", fontFamily: S.head }, survolLien: OCRE, mobileVolet: { borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: S.line } });
    const reseaux = G.ligne(k, [caps(k, "Nous suivre", { couleur: S.mute }), k.row(RESEAUX_TXT.map(([l, u]) => lien(k, `${l} ↗`, u, { taille: 15, poids: "600", h: "44px", couleur: S.fg, survol: { color: OCRE, textDecoration: "underline" }, focus: OCRE })), { ...G.gaps("4px 22px"), alignItems: "center" })], { gap: "4px 28px", aligne: "center", justifie: "flex-start", largeur: "100%" });
    const bande = G.bande(k, [tete, colonnes, hr(k, S.line), reseaux, G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { colonne: true, gap: "40px", padV: ["96px", "72px", "56px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Courbes de niveau" });
    surFond(bande, [calque(svgDe(1440, 900, fond, "xMidYMid slice"))]);
    return [G.racine(k, [bande])];
  },
}, FAM));

module.exports = {
  key: "auto-sport-mobilite", label: "Automobile, sport et mobilité", target: 5, built: true,
  description: "Concessions, garages, clubs et salles de sport : énergie, contraste fort, horaires et planning.",
  models: modeles,
};
