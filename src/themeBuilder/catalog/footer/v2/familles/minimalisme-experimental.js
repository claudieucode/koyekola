// Famille v2 « Minimalisme et expérimentation » — 5 modèles (concepts c-096 à c-100 de docs/footer-v2/CONCEPTS_100.md).
// Pieds très courts ou très inattendus : une ligne, un point, une inversion, un glitch, une phrase. Ici l'audace vient du PARTI PRIS, jamais de l'illisibilité :
// liens clairs, cibles de 44 px, contrastes AA, mouvement réduit respecté. Chaque modèle a sa propre palette, ses propres polices et ses propres formes (indépendance du site, mode « solo »).
// Marques fictives : aucune coordonnée, aucun chiffre, aucune adresse de réseau réelle (adresses d'exemple à remplacer dans l'éditeur).
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "minimalisme-experimental";

// ── Aides LOCALES à la famille (le kit v2 ne les fournit pas) ──────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
// Lien de texte fini par le moteur (états, 44 px sur mobile) puis états propres : survol { …styles }, focus (contour 2 px)
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: "inline-flex", alignItems: "center", minHeight: o.h, paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, transitionDuration: GK.MOUVEMENT, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
// Petit libellé en capitales espacées
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "600", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
// Année en cours (source « année » du texte dynamique) : « © 2026 » sans raison sociale, pour les pieds d'une seule ligne
const annee = (k, o = {}) => ({ type: "dyntext", props: { source: "year", before: o.avant ?? "© ", after: "", fallback: "", tag: "span" }, ...sty(compact({ color: o.couleur || k.S.mute, fontSize: `${o.taille || 14}px`, fontFamily: o.police || k.S.font, fontWeight: o.poids || "500", letterSpacing: o.suivi, lineHeight: 1.4 })) });

// ── c-096 « Juste une ligne » ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : tout le pied tient en UNE ligne. Un filet d'un pixel, le nom du site en gras serré à gauche, trois liens, l'année à droite. Blanc pur, encre #111, aucune boîte, aucun décor : la retenue est le geste.
// Le lien « Contact » est le seul à rester souligné (appel discret). Police : Inter Tight (titres et texte). Mobile : le nom et l'année sur la première ligne, les liens dessous (3 cibles de 44 px).
const blancPur = identite({
  key: "c096", label: "Blanc pur et encre", humeur: "light",
  fond: "#ffffff", texte: "#111111", discret: "#595959", accent: "#111111", surface: "#f4f4f4",
  police: "font.inter-tight", titres: "font.inter-tight",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#111111",
});

const justeUneLigne = modeleV2({
  id: identifiantV2(96, "juste-une-ligne"), concept: "c-096-juste-une-ligne",
  name: "Juste une ligne", family: FAM,
  description: "Tout le pied tient en une ligne : un filet d'un pixel, le nom du site, trois liens, l'année. Blanc pur, encre noire, aucune boîte. La retenue est le geste ; le lien Contact reste souligné.",
  tags: ["ultra-minimaliste", "une ligne", "blanc", "noir", "filet", "typographie"],
  identity: blancPur,
  racine: racineDe("#ffffff"),
  widgets: ["sitetitle", "link", "dyntext"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · le nom du site (widget Titre du site) : 28 px, gras, serré
    const nom = Moteur.item(k, "title:28", env);
    // cible tactile ≥ 44 px (lien en ligne : le remplissage compte dans la hauteur mesurée)
    nom.parts = { ...(nom.parts || {}), link: { ...((nom.parts || {}).link || {}), styles: { ...(((nom.parts || {}).link || {}).styles || {}), mobile: { display: "inline-block", minHeight: "44px", paddingTop: "10px", paddingBottom: "10px" } } } };
    nom.styles.desktop = { ...nom.styles.desktop, fontWeight: "700", letterSpacing: "-0.035em", lineHeight: 1.15, color: S.fg };
    nom.styles.mobile = { ...(nom.styles.mobile || {}), fontSize: "24px", order: 1 };
    // 2 · trois liens (jamais de lien mort) ; Contact souligné en permanence
    const sur = { color: S.fg, textDecoration: "underline" };
    const liens = k.row([
      lien(k, "Journal", "/blog", { taille: 15, h: "44px", survol: sur, focus: S.fg }),
      lien(k, "Questions", "/faq", { taille: 15, h: "44px", survol: sur, focus: S.fg }),
      lien(k, "Contact", "/contact", { taille: 15, h: "44px", poids: "700", soulign: true, survol: { color: S.fg, textDecoration: "none" }, focus: S.fg }),
    ], { ...GK.gaps("0px 36px"), alignItems: "center", flexWrap: "wrap" }, undefined, { width: "100%", order: 3, columnGap: "28px" });
    // 3 · l'année à droite
    const an = annee(k, { couleur: S.mute, taille: 14, poids: "500" });
    an.styles.mobile = { order: 2 };
    const ligne = k.row([nom, liens, an], { ...GK.gaps("0px 40px"), alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", width: "100%" });
    const bande = G.bande(k, [ligne], { colonne: true, gap: "0px", max: "1280px", padV: ["14px", "14px", "10px"], padB: ["14px", "14px", "8px"], padH: ["48px", "32px", "20px"], fond: S.bg, filetHaut: { epaisseur: "1px", couleur: S.fg }, nom: "Une ligne" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── c-097 « Point final » ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : un POINT monumental comme signature. Noir pur, un disque blanc cassé de 26 vw (440 px au plus) porte un seul mot, « fin. », en serif ; dessous, trois liens minuscules. Étrange, mémorable, silencieux.
// Écart au concept : le point est un disque dessiné (bloc arrondi), pas le caractère « . » de la police (à 200 px un vrai point ferait 26 px). Il porte le mot « fin. » : le pied n'est donc jamais « vide » pour un lecteur d'écran.
// Polices : DM Serif Display (le mot, propre à grande taille) et DM Mono (liens, mentions). Mobile : disque de 58 vw, liens en pile de 44 px.
const noirPur = identite({
  key: "c097", label: "Noir pur et blanc cassé", humeur: "dark",
  fond: "#0a0a0a", texte: "#f2f2f2", discret: "#a8a8a8", accent: "#f2f2f2", surface: "#141414",
  police: "font.dm-mono", titres: "font.dm-serif-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#3a3a3a",
});

const pointFinal = modeleV2({
  id: identifiantV2(97, "point-final"), concept: "c-097-point-final",
  name: "Point final", family: FAM,
  description: "Un point monumental pour signature : un disque blanc cassé sur noir pur, un seul mot en serif (« fin. »), puis trois liens minuscules en capitales. Silencieux, étrange, impossible à oublier.",
  tags: ["noir", "point géant", "minimaliste", "serif", "mono", "signature"],
  identity: noirPur,
  racine: racineDe("#0a0a0a"),
  widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · le point : disque plein, texte centré (le mot « fin. » en DM Serif Display, sombre sur clair)
    const mot = k.T("<p>fin.</p>", { fontFamily: S.head, fontSize: "fluid:44-84", lineHeight: 1, letterSpacing: "-0.02em", color: S.bg, textAlign: "center" });
    const point = k.col([mot], { width: "26vw", minWidth: "220px", maxWidth: "440px", aspectRatio: "1/1", borderRadius: "50%", backgroundColor: S.fg, alignItems: "center", justifyContent: "center", gap: "0px" }, { width: "34vw", minWidth: "240px" }, { width: "58vw", minWidth: "0px" });
    // 2 · trois liens minuscules, centrés ; au survol et au focus le fond et le texte s'inversent
    const inv = { backgroundColor: S.fg, color: S.bg, textDecoration: "none" };
    const un = (t, u) => lien(k, t, u, { taille: 13, poids: "500", casse: "uppercase", suivi: "0.16em", h: "44px", padH: "16px", survol: inv, focus: S.fg });
    const liens = k.row([un("Journal", "/blog"), un("Questions", "/faq"), un("Contact", "/contact")], { ...GK.gaps("0px 12px"), alignItems: "center", justifyContent: "center", flexWrap: "wrap" }, undefined, { flexDirection: "column", rowGap: "0px", width: "100%" });
    liens.children.forEach((c) => { c.styles.mobile = { ...(c.styles.mobile || {}), width: "100%", justifyContent: "center" }; });
    // 3 · mentions centrées
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env, true);
    const bande = G.bande(k, [point, liens, mentions], { colonne: true, aligne: "center", gap: "44px", max: "1100px", padV: ["112px", "88px", "64px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "32px" }, nom: "Point final" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── c-098 « Inversion noir blanc » — REFONTE (archétype C : damier de huit cases égales) ────────────────────────────────────────────────────
// Idée : un DAMIER noir et blanc de huit cases égales, à angles droits, bord à bord. Chaque case est un lien ; au survol ET au focus clavier elle S'INVERSE (le blanc devient noir, le noir devient blanc) en un fondu court.
// Un filet noir de 6 px ouvre le pied ; les mentions sont sur une bande claire dessous. Polices : Archivo (titres) et Archivo Narrow. Pas de logo.
// Écarts au concept : quatre cases par ligne en bureau (damier), deux par ligne en tablette et mobile (le damier devient des rayures verticales, les cases restent des liens de 44 px ou plus) ; le dernier lien est un EXEMPLE de réseau à remplacer.
const negatif = identite({
  key: "c098", label: "Noir sur blanc, négatif", humeur: "light",
  fond: "#f5f5f5", texte: "#0a0a0a", discret: "#404040", accent: "#0a0a0a", surface: "#ffffff",
  police: "font.archivo-narrow", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#0a0a0a",
});

const inversionNoirBlanc = modeleV2({
  id: identifiantV2(98, "inversion-noir-blanc"), concept: "c-098-inversion-noir-blanc",
  name: "Inversion noir blanc", family: FAM,
  description: "Noir et blanc éditorial : un damier de huit cases égales, chacune un lien. Au survol et au clavier, la case s'inverse en fondu (blanc sur noir, noir sur blanc). Un filet noir de 6 px ouvre le pied.",
  tags: ["noir et blanc", "inversion", "damier", "cases égales", "filets", "éditorial"],
  identity: negatif,
  racine: racineDe("#f5f5f5"),
  widgets: ["link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, NOIR = "#0a0a0a", BLANC = "#f5f5f5";
    // une case : lien pleine case, libellé en bas à gauche ; la couleur dépend de la parité (damier) ; survol et focus = inversion
    const CASES = [["Accueil", "/"], ["Journal", "/blog"], ["Catalogue", "/catalogue"], ["Boutique", "/boutique"], ["Questions", "/faq"], ["Contact", "/contact"], ["Connexion", "/connexion"], ["Instagram ↗", "https://www.instagram.com/"]];
    const cases = CASES.map(([t, u], i) => {
      const noire = (Math.floor(i / 4) + (i % 4)) % 2 === 1, fond = noire ? NOIR : BLANC, texte = noire ? BLANC : NOIR;
      const c = lien(k, t, u, {
        taille: 22, poids: "700", h: "176px", padH: "24px", lh: 1.05, suivi: "-0.01em", couleur: texte, police: S.head,
        survol: { backgroundColor: texte, color: fond, textDecoration: "none" }, focus: texte,
        extra: { fontSize: "fluid:22-34", display: "flex", alignItems: "flex-end", justifyContent: "flex-start", backgroundColor: fond, width: "25%", flexGrow: 0, flexShrink: 0, boxSizing: "border-box", textTransform: "uppercase", letterSpacing: "0.02em", paddingBottom: "22px", borderStyle: "solid", borderWidth: "0px", borderRightWidth: "1px", borderBottomWidth: "1px", borderColor: NOIR, transitionDuration: 320 },
      });
      c.states.focus = { backgroundColor: texte, color: fond, outlineStyle: "solid", outlineWidth: "3px", outlineColor: fond, outlineOffset: "-8px" };
      c.styles.tablet = { ...(c.styles.tablet || {}), width: "50%", minHeight: "140px" };
      c.styles.mobile = { ...(c.styles.mobile || {}), width: "50%", minHeight: "112px", paddingLeft: "14px", paddingRight: "10px", paddingBottom: "16px", fontSize: "fluid:17-22" };
      return c;
    });
    const damier = k.row(cases, { gap: "0px", flexWrap: "wrap", alignItems: "stretch", width: "100%" });
    const bandeDamier = G.bande(k, [damier], { colonne: true, gap: "0px", max: "100%", padV: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], fond: BLANC, filetHaut: { epaisseur: "6px", couleur: NOIR }, nom: "Damier" });
    // mentions sur fond clair, sous un filet (la ligne légale de la plateforme prend la couleur de la dernière bande : elle reste lisible)
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [trait(k, NOIR), mentions], { colonne: true, gap: "20px", max: "1280px", padV: ["28px", "24px", "20px"], padB: ["24px", "24px", "20px"], padH: ["48px", "32px", "16px"], fond: S.bg, nom: "Mentions" });
    return [G.racine(k, [bandeDamier, bas])];
  },
}, FAM);

// ── c-099 « Glitch au survol » — REFONTE (archétype F : bandeau d'appel XXL en haut + une seule colonne de liens, étroite, à droite) ──────────
// Idée : studio fictif « Bug ». Aubergine, rose fluo. Un BANDEAU XXL ouvre le pied : la phrase « quelque chose a glissé. » sur deux lignes énormes ; quand on SURVOLE une ligne, elle GLISSE de côté, passe au rose et se double d'un
// contour cyan, puis revient. Dessous, une grande barre rose « Écrire au studio » (le seul appel). En bas, à gauche l'e-mail du site, à droite UNE colonne étroite de liens (pages, puis réseaux). L'effet n'existe qu'au survol, jamais permanent,
// et il est coupé sous « mouvement réduit » ; le texte reste lisible tout le temps. Au toucher, le survol n'existe pas : la phrase reste figée.
// Polices : Major Mono Display (phrase, testée à grande taille) et Manrope (liens, mentions). Couleurs : aubergine #3d0a3d, rose #ff4dff, cyan #3df5ff (effet seulement). Angles droits.
const aubergine = identite({
  key: "c099", label: "Aubergine et rose fluo", humeur: "dark",
  fond: "#3d0a3d", texte: "#ffe6ff", discret: "#e7b5e7", accent: "#ff4dff", surface: "#4e1250",
  police: "font.manrope", titres: "font.major-mono-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#8a3a8a",
});

const glitchSurvol = modeleV2({
  id: identifiantV2(99, "glitch-au-survol"), concept: "c-099-glitch-au-survol",
  name: "Glitch au survol", family: FAM,
  description: "Studio fictif en aubergine et rose fluo : un bandeau XXL avec la phrase géante sur deux lignes. Au survol, chaque ligne glisse de côté et se double d'un contour cyan, comme un défaut d'image. Une seule colonne de liens à droite.",
  tags: ["expérimental", "glitch", "bandeau XXL", "aubergine", "rose", "mono", "créatif"],
  identity: aubergine,
  racine: racineDe("#3d0a3d"),
  widgets: ["text", "link", "bizemail", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, CYAN = "#3df5ff";
    // 1 · le bandeau XXL : deux lignes, chacune un nœud qui réagit seul au survol (glissement + rose + contour cyan)
    const ligneGlitch = (t, decal) => {
      const n = k.T(`<p>${t}</p>`, { fontFamily: S.head, fontSize: "fluid:34-150", lineHeight: 1, letterSpacing: "-0.05em", fontWeight: "400", color: S.fg, alignSelf: "flex-start", maxWidth: "100%", overflowWrap: "break-word", transitionDuration: 240 });
      n.states = { hover: { color: S.accent, textStrokeWidth: "2px", textStrokeColor: CYAN, transform: { x: decal, skewX: -6 } } };
      return n;
    };
    const phrase = k.row([k.col([ligneGlitch("quelque chose", 18), ligneGlitch("a glissé.", -22)], { gap: "4px", alignItems: "flex-start", flexGrow: 1, flexBasis: "0px", minWidth: "0px" })], { gap: "0px", flexWrap: "nowrap", alignItems: "flex-start", width: "100%" });
    // 2 · l'appel XXL : une barre rose pleine largeur ; au survol elle passe au cyan et la flèche glisse
    const appel = lien(k, "Écrire au studio ↗", "/contact", { taille: 26, poids: "800", h: "104px", padH: "28px", couleur: "#3d0a3d", suivi: "0.02em", survol: { backgroundColor: CYAN, color: "#3d0a3d", transform: { x: 6 }, textDecoration: "none" }, focus: CYAN, extra: { fontSize: "fluid:20-46", backgroundColor: S.accent, display: "flex", width: "100%", justifyContent: "space-between", boxSizing: "border-box", transitionDuration: 320, borderRadius: "0px" } });
    const bandeau = G.bande(k, [phrase, appel], { colonne: true, gap: "40px", max: "1280px", padV: ["88px", "64px", "44px"], padB: ["56px", "44px", "32px"], padH: ["48px", "32px", "20px"], fond: S.bg, degrade: { from: "#4e1250", to: "#3d0a3d", angle: 180 }, innerMobile: { rowGap: "28px" }, nom: "Bandeau XXL" });
    // 3 · en bas : l'e-mail du site à gauche, UNE colonne étroite de liens à droite
    const mail = GK.fini(k, k.W("bizemail", { prefix: "", text: "", showIcons: false, showIcon: false }, { color: S.fg, fontFamily: S.font, fontSize: "22px", fontWeight: "700" }));
    const gauche = k.col([caps(k, "Un message, une idée, un bug à signaler ?", { couleur: S.accent }), mail, trait(k, S.line), k.T("<p>Écrivez-nous et dites-nous ce qui a glissé de votre côté.</p>", { fontSize: "14px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, maxWidth: "380px" })], { gap: "14px", alignItems: "flex-start", flexBasis: "0px", flexGrow: 1, minWidth: "260px" }, { flexBasis: "100%" }, { flexBasis: "100%", minWidth: "0px" });
    const ligneLien = (t, u) => lien(k, t, u, { taille: 16, poids: "600", h: "48px", couleur: S.fg, survol: { color: S.accent, transform: { x: 6 }, textDecoration: "none" }, focus: S.accent, extra: { display: "flex", width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: S.line, transitionDuration: 320 } });
    const reseauxLiens = k.row([lien(k, "Instagram ↗", "https://www.instagram.com/", { taille: 15, poids: "600", couleur: S.mute, survol: { color: S.accent }, focus: S.accent }), lien(k, "LinkedIn ↗", "https://www.linkedin.com/", { taille: 15, poids: "600", couleur: S.mute, survol: { color: S.accent }, focus: S.accent })], { ...GK.gaps("0px 24px"), alignItems: "center", flexWrap: "wrap", paddingTop: "10px" });
    const colonneLiens = k.col([ligneLien("Journal", "/blog"), ligneLien("Questions", "/faq"), ligneLien("Contact", "/contact"), reseauxLiens], { gap: "0px", alignItems: "stretch", flexBasis: "280px", flexGrow: 0, flexShrink: 0, maxWidth: "100%" }, { flexBasis: "100%" }, { flexBasis: "100%" });
    const milieu = G.ligne(k, [gauche, colonneLiens], { gap: "36px 72px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bas = G.bande(k, [milieu, trait(k, S.line), mentions], { colonne: true, gap: "36px", max: "1280px", padV: ["16px", "12px", "8px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Liens" });
    return [G.racine(k, [bandeau, bas])];
  },
}, FAM);

// ── c-100 « Pied en phrases » ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : le pied est un PETIT TEXTE à lire. Une colonne étroite, comme une page de livre : six courtes phrases, chacune avec son lien souligné au milieu, numérotées en marge ; à côté, une marge de notes (coordonnées du site, réseaux avec ↗).
// Papier #fffdf5, encre #1f1f1f, bleu de lien #0044cc. Polices : Instrument Serif (les phrases ; la fiche prévoyait Instrument Sans partout, le serif donne le ton « page de livre ») et Instrument Sans (marge, mentions).
// La sixième phrase invite à laisser son adresse : le champ est le widget d'abonnement du site (message « non configuré » honnête tant qu'aucun formulaire n'est publié).
const papier = identite({
  key: "c100", label: "Papier, encre et bleu de lien", humeur: "light",
  fond: "#fffdf5", texte: "#1f1f1f", discret: "#5a5a52", accent: "#0044cc", surface: "#f2efe2",
  police: "font.instrument-sans", titres: "font.instrument-serif",
  rayon: "999px", rayonBouton: "999px", ombre: "none", poids: "500", bordure: "1px", ligne: "#d8d3bf",
});

const piedEnPhrases = modeleV2({
  id: identifiantV2(100, "pied-en-phrases"), concept: "c-100-pied-en-phrases",
  name: "Pied en phrases", family: FAM,
  description: "Un pied rédigé comme une page de livre : six courtes phrases en serif, chacune avec son lien souligné, numérotées en marge, avec une marge de notes à côté. Papier, encre, bleu de lien : le ton remplace la structure.",
  tags: ["rédigé", "éditorial", "papier", "serif", "liens dans le texte", "newsletter"],
  identity: papier,
  racine: racineDe("#fffdf5"),
  widgets: ["text", "link", "emailsubscribe", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · une phrase = numéro de marge + texte serif dont UN groupe de mots est le lien (bleu, souligné). Le lien est dans le paragraphe : coloré et souligné.
    const num = (n) => k.T(`<p>${n}</p>`, { fontFamily: S.font, fontSize: "13px", fontWeight: "600", color: S.accent, lineHeight: 1, paddingTop: "12px", minWidth: "26px", flexShrink: 0 });
    const phrase = (n, avant, mots, url, apres) => k.row([
      num(n),
      k.T(`<p>${avant}<a href="${url}"><span style="color:${S.accent}">${mots}</span></a>${apres}</p>`, { fontFamily: S.head, fontSize: "fluid:25-38", lineHeight: 1.18, color: S.fg, flexGrow: 1, flexBasis: "0px", minWidth: "0px" }),
    ], { gap: "14px", flexWrap: "nowrap", alignItems: "flex-start", width: "100%" });
    // 2 · la sixième phrase : le champ d'abonnement (intro = la phrase, en serif)
    const abo = G.abonnement({ titre: "", intro: "", bouton: "Je m'abonne", largeur: "520px", soulignement: "2px", rayonBouton: "999px", rayonChamp: "0px" })(k, env);
    const dire = k.T("<p>Pour recevoir nos nouvelles, laissez votre adresse.</p>", { fontFamily: S.head, fontSize: "fluid:25-38", lineHeight: 1.18, color: S.fg });
    const sixieme = k.row([num(6), k.col([dire, abo], { gap: "14px", alignItems: "flex-start", flexGrow: 1, flexBasis: "0px", minWidth: "0px" })], { gap: "14px", flexWrap: "nowrap", alignItems: "flex-start", width: "100%" });
    const texte = k.col([
      phrase(1, "Pour nous écrire, ", "c'est ici", "/contact", "."),
      phrase(2, "Pour lire ce que nous publions, ", "c'est là", "/blog", "."),
      phrase(3, "Pour une question, ", "regardez d'abord la FAQ", "/faq", "."),
      phrase(4, "Pour voir ce que nous proposons, ", "ouvrez le catalogue", "/catalogue", "."),
      phrase(5, "Pour retrouver votre compte, ", "c'est par ici", "/connexion", "."),
      sixieme,
    ], { gap: "22px", flexBasis: "0px", flexGrow: 3, minWidth: "320px", maxWidth: "700px" }, undefined, { minWidth: "0px", flexBasis: "100%", gap: "20px" });
    // 3 · la marge de notes : coordonnées du site (Données de l'entreprise : rien d'inventé) et réseaux en noms suivis d'une flèche
    const coord = G.code("contact|")(k, env);
    const reseaux = k.col([["Instagram", "https://www.instagram.com/"], ["LinkedIn", "https://www.linkedin.com/"], ["YouTube", "https://www.youtube.com/"]].map(([l, u]) => GK.lienFleche(l, u, { taille: 16, poids: "500", couleur: S.fg, survol: S.accent })(k, env)), { gap: "0px", alignItems: "flex-start" });
    const marge = k.col([caps(k, "Notes en marge", { couleur: S.mute }), coord, caps(k, "Pour nous suivre", { couleur: S.mute, extra: { marginTop: "10px" } }), reseaux],
      { gap: "10px", alignItems: "flex-start", flexBasis: "0px", flexGrow: 1, minWidth: "240px", paddingLeft: "32px", paddingTop: "10px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: S.line },
      { flexBasis: "100%", borderLeftWidth: "0px", paddingLeft: "0px", borderTopWidth: "1px", paddingTop: "28px" }, { flexBasis: "100%", borderLeftWidth: "0px", paddingLeft: "0px", borderTopWidth: "1px", paddingTop: "24px", minWidth: "0px" });
    const corps = G.ligne(k, [texte, marge], { gap: "56px 64px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [corps, trait(k, S.line), mentions], { colonne: true, gap: "44px", max: "1100px", padV: ["96px", "72px", "52px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "30px" }, nom: "Phrases" });
    return [G.racine(k, [bande])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Minimalisme et expérimentation", target: 5, built: true,
  description: "Pieds très courts ou très inattendus : une ligne, un point, une inversion, un glitch, une phrase.",
  models: [justeUneLigne, pointFinal, inversionNoirBlanc, glitchSurvol, piedEnPhrases],
};
