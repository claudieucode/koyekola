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

// ── c-098 « Inversion noir blanc » ───────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : un pied en noir et blanc, quatre colonnes séparées par des filets. Chaque lien est une barre pleine largeur qui s'INVERSE (blanc sur noir) au survol ET au focus clavier, instantanément (aucune animation).
// Un filet noir de 6 px ouvre le pied. Polices : Archivo (titres) et Archivo Narrow (liens). Pas de logo (le nom ne figure que dans les mentions).
// Écarts au concept : l'inversion se fait par barre de lien (inverser une colonne entière rendrait ses liens illisibles : la couleur d'un lien ne suit pas celle de son parent) ; sur mobile les colonnes deviennent des
// volets (accordéon de 48 px, filets noirs) ; sur grand écran elles restent dépliées (les volets ne servent qu'au toucher).
const negatif = identite({
  key: "c098", label: "Noir sur blanc, négatif", humeur: "light",
  fond: "#f5f5f5", texte: "#0a0a0a", discret: "#404040", accent: "#0a0a0a", surface: "#ffffff",
  police: "font.archivo-narrow", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#0a0a0a",
});

const inversionNoirBlanc = modeleV2({
  id: identifiantV2(98, "inversion-noir-blanc"), concept: "c-098-inversion-noir-blanc",
  name: "Inversion noir blanc", family: FAM,
  description: "Noir et blanc éditorial : quatre colonnes séparées par des filets, chaque lien est une barre qui s'inverse (blanc sur noir) au survol et au clavier, sans animation. Un filet noir de 6 px ouvre le pied.",
  tags: ["noir et blanc", "inversion", "colonnes", "filets", "éditorial", "accordéon mobile"],
  identity: negatif,
  racine: racineDe("#f5f5f5"),
  widgets: ["link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, NOIR = "#0a0a0a", BLANC = "#f5f5f5";
    // 1 · une « barre » de lien : pleine largeur, 52 px, filet noir au-dessus ; survol et focus = inversion franche
    const inv = { backgroundColor: NOIR, color: BLANC, textDecoration: "none" };
    const barre = (t, u, premiere) => {
      const b = lien(k, t, u, { taille: 21, poids: "600", h: "52px", padH: "12px", lh: 1.1, suivi: "-0.005em", survol: inv, focus: BLANC, extra: { display: "flex", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: NOIR, boxSizing: "border-box" } });
      b.states.focus = { ...inv, outlineStyle: "solid", outlineWidth: "3px", outlineColor: BLANC, outlineOffset: "-6px" };
      if (premiere) b.styles.mobile = { ...(b.styles.mobile || {}), borderTopWidth: "0px" }; // le bouton du volet porte déjà un filet
      return b;
    };
    const liste = (liens) => (kk) => kk.col(liens.map(([l, u], i) => barre(l, u, i === 0)), { gap: "0px", width: "100%", alignItems: "stretch" });
    const panneaux = [
      { title: "Naviguer", codes: [liste([["Accueil", "/"], ["Journal", "/blog"], ["Catalogue", "/catalogue"], ["Boutique", "/boutique"]])] },
      { title: "Aide", codes: [liste([["Questions", "/faq"], ["Contact", "/contact"], ["Cookies", "/cookies"]])] },
      { title: "Compte", codes: [liste([["Connexion", "/connexion"], ["Inscription", "/inscription"], ["Panier", "/boutique/panier"]])] },
      { title: "Réseaux", codes: [liste([["Instagram", "https://www.instagram.com/"], ["LinkedIn", "https://www.linkedin.com/"], ["YouTube", "https://www.youtube.com/"]])] },
    ];
    const colonnes = Moteur.accordionNode(k, env, false, panneaux, { alignItems: "flex-start", width: "100%", maxWidth: "1280px", marginLeft: "auto", marginRight: "auto", color: S.fg, fontFamily: S.head, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "16px", rowGap: "28px", columnGap: "40px" }, { min: "150px" });
    delete colonnes.styles.desktop.gap;
    colonnes.children.forEach((c) => { c.styles.desktop = { ...c.styles.desktop, gap: "0px" }; c.styles.mobile = { minWidth: "0px" }; });
    // 2 · mentions sur fond clair, sous un filet noir de 6 px (la ligne légale de la plateforme prend la couleur de la dernière bande : elle doit rester lisible)
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bande = G.bande(k, [colonnes, trait(k, NOIR), mentions], { colonne: true, gap: "36px", max: "1280px", padV: ["56px", "48px", "28px"], padB: ["24px", "24px", "20px"], padH: ["48px", "32px", "16px"], fond: S.bg, filetHaut: { epaisseur: "6px", couleur: NOIR }, innerMobile: { rowGap: "24px" }, nom: "Colonnes" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── c-099 « Glitch au survol » ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : studio fictif « Bug ». Aubergine, rose fluo. La phrase géante « quelque chose a glissé. » est écrite sur trois lignes ; quand on SURVOLE une ligne, elle GLISSE de côté, passe au rose et se double d'un contour cyan,
// puis revient. L'effet n'existe qu'au survol (jamais permanent), il est coupé sous « mouvement réduit » (les transformations ne se jouent pas) ; le texte reste lisible tout le temps.
// Écart au concept : pas de clip-path ni de bruit en CSS dans la grammaire : le « défaut d'image » est un glissement de ligne + un contour cyan (états de survol du texte). Au toucher, le survol n'existe pas : la phrase reste figée.
// Polices : Major Mono Display (phrase, testée à 150 px) et Manrope (liens, mentions). Couleurs : aubergine #3d0a3d, rose #ff4dff, cyan #3df5ff (effet seulement).
const aubergine = identite({
  key: "c099", label: "Aubergine et rose fluo", humeur: "dark",
  fond: "#3d0a3d", texte: "#ffe6ff", discret: "#e7b5e7", accent: "#ff4dff", surface: "#4e1250",
  police: "font.manrope", titres: "font.major-mono-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#8a3a8a",
});

const glitchSurvol = modeleV2({
  id: identifiantV2(99, "glitch-au-survol"), concept: "c-099-glitch-au-survol",
  name: "Glitch au survol", family: FAM,
  description: "Studio fictif en aubergine et rose fluo : une phrase géante écrite en trois lignes. Au survol, chaque ligne glisse de côté et se double d'un contour cyan, comme un défaut d'image. Jamais permanent.",
  tags: ["expérimental", "glitch", "phrase géante", "aubergine", "rose", "mono", "créatif"],
  identity: aubergine,
  racine: racineDe("#3d0a3d"),
  widgets: ["text", "link", "bizemail", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, CYAN = "#3df5ff";
    // 1 · la phrase : trois lignes, chacune un nœud qui réagit seul au survol (glissement + rose + contour cyan)
    const ligneGlitch = (t, decal) => {
      const n = k.T(`<p>${t}</p>`, { fontFamily: S.head, fontSize: "fluid:44-140", lineHeight: 0.98, letterSpacing: "-0.04em", fontWeight: "400", color: S.fg, alignSelf: "flex-start", maxWidth: "100%", transitionDuration: 90 });
      n.states = { hover: { color: S.accent, textStrokeWidth: "2px", textStrokeColor: CYAN, transform: { x: decal, skewX: -6 } } };
      return n;
    };
    const phrase = k.col([ligneGlitch("quelque", 18), ligneGlitch("chose a", -22), ligneGlitch("glissé.", 12)], { gap: "6px", alignItems: "flex-start", flexBasis: "0px", flexGrow: 7, minWidth: "300px", paddingLeft: "24px" }, undefined, { paddingLeft: "10px", minWidth: "0px", flexBasis: "100%" });
    // 2 · la colonne de droite : libellé, e-mail du site (Données de l'entreprise), trois liens, réseaux en noms
    const mail = GK.fini(k, k.W("bizemail", { prefix: "", text: "", showIcon: false }, { color: S.fg, fontFamily: S.font, fontSize: "20px", fontWeight: "700" }));
    const sou = { color: S.accent, textDecoration: "underline" };
    const un = (t, u) => lien(k, t, u, { taille: 16, poids: "600", h: "44px", survol: sou, focus: S.accent });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["LinkedIn", "https://www.linkedin.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15, couleur: S.mute, survol: S.accent })(k, env);
    const droite = k.col([caps(k, "Écrire au studio", { couleur: S.accent }), mail, k.row([un("Journal", "/blog"), un("Questions", "/faq"), un("Contact", "/contact")], { ...GK.gaps("0px 28px"), alignItems: "center", flexWrap: "wrap" }), trait(k, S.line), reseaux],
      { gap: "14px", alignItems: "flex-start", flexBasis: "0px", flexGrow: 4, minWidth: "260px", paddingLeft: "32px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: S.line, alignSelf: "flex-end" },
      { flexBasis: "100%", borderLeftWidth: "0px", paddingLeft: "10px" }, { flexBasis: "100%", borderLeftWidth: "0px", paddingLeft: "10px", minWidth: "0px" });
    const haut = G.ligne(k, [phrase, droite], { gap: "48px 56px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [haut, trait(k, S.line), mentions], { colonne: true, gap: "40px", max: "1280px", padV: ["96px", "72px", "56px"], padB: ["40px", "36px", "32px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "32px" }, degrade: { from: "#4e1250", to: "#3d0a3d", angle: 180 }, nom: "Phrase glitch" });
    return [G.racine(k, [bande])];
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
