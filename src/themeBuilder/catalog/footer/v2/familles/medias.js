// Famille v2 « Médias et éditorial » — cible 8 modèles (concepts c-033 à c-040 de docs/footer-v2/CONCEPTS_100.md). Voir docs/footer-v2/GUIDE_CONSTRUIRE_UN_MODELE_V2.md.
// `built: true` : les 8 modèles de la cible sont écrits (la liste publique ne change que lorsque les 14 familles sont construites).
// Les modèles s'écrivent avec ../kit-v2 (modeleV2, identite, gestes G.*) et s'insèrent en mode « solo » (indépendants du site). Les aides locales (liens, listes dynamiques…) sont DANS ce fichier.
//
// Particularités communes à la famille :
//  · le NOM affiché en grand est le widget « Titre du site » (le modèle sert n'importe quel média ; la marque fictive du concept n'est qu'un exemple) ;
//  · « articles récents / catégories » = widget « Liste dynamique » (querylist) avec un message explicite quand il n'y a rien à afficher ;
//  · les rubriques sont les catégories du site (jamais de rubrique inventée avec un lien mort) ; les autres liens vont vers les pages de la plateforme (/blog, /faq, /contact…).
const { modeleV2, identifiantV2, identite, G, Kit, Moteur, contrastOf } = require("../kit-v2");
const { compact, sty } = require("../../../kit");

const FAM = "medias";

// ── Aides locales ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// couleur de survol : l'accent s'il est lisible sur le fond ET différent du texte, sinon rien (le lien glisse alors de 3 px)
const survolDe = (S, bg) => (S.accent !== S.fg && contrastOf(S.accent, bg || S.bg) >= 4.5 ? S.accent : null);
// lien(k, "Blog", "/blog", { taille, poids, casse, suivi, couleur, survol, police, soulignement }) : lien de texte, survol souligné, focus visible 2 px ; cible 44 px sur mobile (G.fini)
const lien = (k, label, url, o = {}) => {
  const S = k.S, c = o.couleur || S.fg;
  const n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: c, textDecoration: o.soulignement ? "underline" : "none", textTransform: o.casse, letterSpacing: o.suivi, lineHeight: o.lh || 1.4, display: o.filet ? "flex" : "inline-flex", alignItems: "center", transitionDuration: G.MOUVEMENT, ...(o.filet ? { borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: S.line, paddingTop: "7px", paddingBottom: "7px", width: "100%" } : {}) }));
  const sv = o.survol || survolDe(S, o.fondSurvol);
  return G.fini(k, n, { hover: { color: sv || c, textDecoration: "underline", ...(sv || o.filet ? {} : { transform: { x: 3 } }) }, focus: G.focus(o.focus || o.survol || S.accent) });
};
// liste(k, [[label, url]…], opts) : colonne de liens
const liste = (k, items, o = {}) => k.col(items.map(([l, u]) => lien(k, l, u, o)), { gap: o.gap || "6px", alignItems: o.filet ? "stretch" : "flex-start", width: o.filet ? "100%" : undefined });
// etiquette(k, "Rubriques", { couleur, taille, suivi }) : petit titre en capitales espacées
const etiquette = (k, txt, o = {}) => k.T(`<p>${txt}</p>`, compact({ fontSize: `${o.taille || 12}px`, lineHeight: 1.3, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.16em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, textAlign: o.align }));
// requete(k, props, opts) : widget « Liste dynamique » (articles récents, catégories…) habillé ; le message « vide » est explicite
function requete(k, props, o = {}) {
  const S = k.S, c = o.couleur || S.fg, f = o.police || S.font, mute = o.mute || S.mute;
  const n = k.W("querylist", { title: "", source: "posts", mode: "recent", count: 4, layout: "list", showImage: false, showDate: true, showMeta: false, showExcerpt: false, showCount: false, empty: "Les articles apparaîtront ici.", ...props },
    { width: "100%", color: mute, fontFamily: f, fontSize: `${o.taille || 14}px` });
  n.parts = {
    item: { styles: { desktop: compact({ borderStyle: o.filets ? "solid" : undefined, borderWidth: o.filets ? "0px" : undefined, borderBottomWidth: o.filets, borderColor: o.filets ? (o.couleurFilet || S.line) : undefined, paddingTop: o.pad || "8px", paddingBottom: o.pad || "8px", ...(o.item || {}) }) } },
    link: { styles: { desktop: { fontFamily: o.policeLien || f, fontSize: `${o.tailleLien || o.taille || 15}px`, fontWeight: o.poidsLien || "600", color: c, lineHeight: o.lh || 1.35, textDecoration: "none" }, mobile: { paddingTop: "10px", paddingBottom: "10px" } }, states: { hover: { color: o.survol || survolDe(S) || c, textDecoration: "underline" }, focus: G.focus(o.focus || S.accent) } },
    date: { styles: { desktop: { fontFamily: f, fontSize: "12px", color: mute, textTransform: "uppercase", letterSpacing: "0.1em" } } },
    count: { styles: { desktop: { fontFamily: f, fontSize: "12px", color: mute } } },
    ...(o.parts || {}),
  };
  return n;
}
// filets(k, "haut" | "bas") : triple filet de presse (épais, fin, fin ; inversé en bas)
const filets = (k, ordre, couleur) => {
  const f = (e) => k.divider({ width: "100%", borderColor: couleur || k.S.fg, borderTopWidth: `${e}px`, marginTop: "0px", marginBottom: "0px" });
  return k.col(ordre === "bas" ? [f(1), f(1), f(4)] : [f(4), f(1), f(1)], { gap: "3px", width: "100%", alignItems: "stretch" });
};
// nomGeant(k, { taille, tablette, mobile, police, poids, suivi, lh, casse, couleur, align }) : le NOM DU SITE (widget Titre du site) en grand, avec lien vers l'accueil
const nomGeant = (k, o = {}) => {
  const S = k.S;
  const n = k.siteTitle(compact({ fontSize: o.taille, fontFamily: o.police || S.head, fontWeight: o.poids || "800", lineHeight: o.lh || 0.95, letterSpacing: o.suivi || "-0.02em", textTransform: o.casse, color: o.couleur || S.fg, textAlign: o.align, width: o.largeur || "100%", overflowWrap: "break-word", marginTop: "0px", marginBottom: "0px" }));
  if (o.tablette) n.styles.tablet = { fontSize: o.tablette };
  if (o.mobile) n.styles.mobile = { fontSize: o.mobile };
  const sv = survolDe(S);
  n.parts = { link: { styles: { desktop: compact({ color: o.couleur || S.fg, fontFamily: o.police || S.head, fontWeight: o.poids || "800", textDecoration: "none" }), mobile: { display: "inline-block", minHeight: "44px", paddingTop: "12px", paddingBottom: "12px" } }, states: { hover: sv ? { color: sv, textDecoration: "underline" } : { opacity: 0.7, textDecoration: "underline" }, focus: G.focus(o.focus || S.accent) } } };
  return n;
};
// adresses d'EXEMPLE (pages d'accueil des réseaux) : à remplacer dans l'éditeur
// titre du widget d'abonnement, aligné sur les petits titres du modèle (même corps, même interligne)
const titreAbo = (S, o = {}) => ({ fontFamily: S.font, color: o.couleur || S.mute, fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.16em", lineHeight: 1.3, marginBottom: "14px" });
const RESEAUX = [["Instagram", "https://www.instagram.com/"], ["LinkedIn", "https://www.linkedin.com/"], ["X", "https://x.com/"], ["YouTube", "https://www.youtube.com/"]];

// ── c-033 « Journal Triple Filet » ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : la une d'un quotidien papier — le nom du journal est centré entre deux triples filets (épais, fin, fin), quatre colonnes d'annuaire (rubriques, derniers articles, le journal, suivre) et la lettre du matin en champ souligné.
// Papier chaud #FAF8F3, noir encre, rouge d'édition #B3261E. Polices : Playfair Display 900 (testé propre, voir guide) et Source Serif 4. Mobile : les colonnes deviennent des volets de 48 px (accordéon) ; le champ reste visible.
const gazette = identite({
  key: "c033", label: "Papier chaud et rouge d'édition", humeur: "light",
  fond: "#faf8f3", texte: "#141414", discret: "#55524b", accent: "#b3261e", surface: "#ece8dd",
  police: "font.source-serif-4", titres: "font.playfair-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "900", bordure: "1px", ligne: "#14141459",
});
const journalTripleFilet = modeleV2({
  id: identifiantV2(33, "journal-triple-filet"), concept: "c-033-journal-triple-filet",
  name: "Journal triple filet", family: FAM,
  description: "La une d'un quotidien : le nom du journal centré entre deux triples filets, quatre colonnes d'annuaire (rubriques, derniers articles, le journal, suivre) et la lettre du matin en champ souligné. Papier chaud, noir encre, rouge d'édition.",
  tags: ["journal", "presse", "quotidien", "triple filet", "annuaire", "papier", "serif", "rouge"],
  identity: gazette,
  racine: { desktop: { backgroundColor: "#faf8f3", gap: "0px" } },
  widgets: ["sitetitle", "querylist", "emailsubscribe", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · la ligne de date et la une : nom du site centré, Playfair 900, entre deux triples filets
    const date = Moteur.item(k, "date", env);
    date.styles.desktop = { ...date.styles.desktop, fontFamily: S.font, color: S.mute, fontSize: "12px", letterSpacing: "0.18em" };
    const dateligne = G.ligne(k, [etiquette(k, "Édition du jour"), date], { justifie: "space-between", largeur: "100%", gap: "8px" });
    const nom = nomGeant(k, { taille: "fluid:44-112", poids: "900", suivi: "-0.02em", lh: 1, align: "center", mobile: "fluid:44-72" });
    const une = k.col([dateligne, filets(k, "haut"), k.col([nom], { paddingTop: "10px", paddingBottom: "14px", width: "100%", alignItems: "center" }), filets(k, "bas")], { gap: "10px", width: "100%", alignItems: "stretch" });
    // 2 · l'annuaire : volets sur mobile, colonnes dès la tablette
    const colonnes = Kit.accordeon([
      { title: "Rubriques", w: 1, codes: [(kk) => requete(kk, { source: "categories", mode: "popular", count: 8, layout: "list", showCount: true, empty: "Les rubriques apparaîtront ici." }, { filets: "1px", tailleLien: 15, pad: "7px" })] },
      { title: "Derniers articles", w: 1, codes: [(kk) => requete(kk, { source: "posts", mode: "recent", count: 4, layout: "list", showDate: true }, { filets: "1px", tailleLien: 15, pad: "8px" })] },
      { title: "Le journal", w: 1, codes: [(kk) => liste(kk, [["Tous les articles", "/blog"], ["Questions fréquentes", "/faq"], ["Nous écrire", "/contact"], ["Se connecter", "/connexion"], ["Créer un compte", "/inscription"]], { taille: 15, gap: "0px", filet: true })] },
      { title: "Suivre", w: 1, codes: [(kk) => liste(kk, RESEAUX, { taille: 15, gap: "0px", filet: true })] },
    ], { min: "250px" })(k, env);
    Object.assign(colonnes.styles.desktop, { marginLeft: "-2px", marginRight: "-2px", width: "auto", maxWidth: "100%" }); colonnes.styles.mobile = { ...(colonnes.styles.mobile || {}), marginLeft: "0px", marginRight: "0px" }; // les volets ont 2 px de marge propre : on réaligne le texte sur les filets
    // 3 · la lettre du matin : champ souligné rouge, bouton carré ; puis la ligne légale
    const lettre = G.abonnement({ titre: "La lettre du matin", intro: "L'essentiel de la veille, chaque matin dans votre boîte.", bouton: "S'abonner", largeur: "520px", soulignement: "2px", rayonBouton: "0px", styleTitre: titreAbo(S) })(k, env);
    const bas = G.ligne(k, [lettre, G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { gap: "28px 56px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    const filet = k.divider({ width: "100%", borderColor: S.line, borderTopWidth: "1px", marginTop: "0px", marginBottom: "0px" });
    return [G.racine(k, [G.bande(k, [une, colonnes, filet, bas], { colonne: true, gap: "44px", max: "1240px", padV: ["72px", "56px", "40px"], padB: ["40px", "36px", "32px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Journal triple filet" })])];
  },
}, FAM);


// ── c-034 « Mode en Capitales » ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : le NOM du magazine est l'unique décor — en capitales didone monumentales, blanc sur noir, collé au bas du pied. Au-dessus, tout est minuscule : index en 12 px espacés, abonnement à simple filet, réseaux « Nom ↗ ».
// Noir #000 / blanc. Polices : Bodoni Moda 700 (didone propre à grand corps : testé, voir guide ; remplace Playfair Display du concept pour des empattements plus fins) et Inter.
// Limite : la taille du nom est fluide mais fixe (56 → 200 px) car on ne connaît pas la longueur du nom du site : un nom très court est moins « pleine largeur » que dans le concept, un nom de plus de 8 lettres passe à la ligne mot par mot (réglable dans l'éditeur).
const noirBlanc = identite({
  key: "c034", label: "Noir et blanc pur", humeur: "dark",
  fond: "#000000", texte: "#ffffff", discret: "#bdbdbd", accent: "#ffffff", surface: "#111111",
  police: "font.inter", titres: "font.bodoni-moda",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#ffffff4d",
});
const modeCapitales = modeleV2({
  id: identifiantV2(34, "mode-en-capitales"), concept: "c-034-mode-en-capitales",
  name: "Mode en capitales", family: FAM,
  description: "Le nom du magazine en capitales didone monumentales, blanc sur noir, occupe le bas du pied. Au-dessus, tout est minuscule : index en capitales espacées, abonnement à simple filet, réseaux suivis d'une flèche.",
  tags: ["magazine", "mode", "noir et blanc", "nom monumental", "didone", "capitales", "minimal", "contraste d'échelle"],
  identity: noirBlanc,
  racine: { desktop: { backgroundColor: "#000000", gap: "0px" } },
  widgets: ["sitetitle", "emailsubscribe", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, mini = { taille: 12, casse: "uppercase", suivi: "0.18em", poids: "600", survol: S.fg };
    const index = G.colonne(k, [etiquette(k, "Index"), k.row([["Blog", "/blog"], ["FAQ", "/faq"], ["Contact", "/contact"], ["Connexion", "/connexion"]].map(([l, u]) => lien(k, l, u, mini)), { ...G.gaps("4px 28px") })], { poids: 5, min: "260px", gap: "14px" });
    const abo = G.colonne(k, [G.abonnement({ titre: "Abonnement", intro: "Un message par numéro, jamais davantage.", bouton: "S'abonner", largeur: "380px", soulignement: "1px", rayonBouton: "0px", tailleChamp: "16px", styleTitre: titreAbo(S) })(k, env)], { poids: 5, min: "260px" });
    const suivre = G.colonne(k, [etiquette(k, "Suivre"), k.row(RESEAUX.map(([l, u]) => lien(k, `${l} ↗`, u, mini)), { ...G.gaps("4px 24px") })], { poids: 4, min: "200px", gap: "14px" });
    const haut = G.ligne(k, [index, abo, suivre], { gap: "40px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const filet = k.divider({ width: "100%", borderColor: S.line, borderTopWidth: "1px", marginTop: "0px", marginBottom: "0px" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bandeHaut = G.bande(k, [haut, filet, mentions], { colonne: true, gap: "36px", max: "1360px", padV: ["72px", "56px", "48px"], padB: ["56px", "48px", "40px"], padH: ["40px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Mode en capitales — index" });
    // le nom : pleine largeur, fluide 56 → 200 px (mobile 72 → 120), capitales, interligne 0,84 pour coller les lettres au bas de la bande
    const nom = nomGeant(k, { taille: "fluid:56-200", mobile: "fluid:56-110", police: S.head, poids: "700", suivi: "-0.025em", lh: 0.84, casse: "uppercase", couleur: S.fg });
    const bandeNom = G.bande(k, [nom], { colonne: true, max: "1360px", padV: ["8px", "8px", "8px"], padB: ["32px", "28px", "24px"], padH: ["40px", "32px", "20px"], fond: S.bg, nom: "Mode en capitales — nom" });
    return [G.racine(k, [bandeHaut, bandeNom])];
  },
}, FAM);

// ── c-035 « Carnet de Marges » ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : une page de carnet — colonne de lecture étroite (≈ 600 px) avec sa ligne de marge rouille, un mot d'au revoir en Lora, l'abonnement en une ligne, trois liens, et dans la marge de droite une note en italique ;
// la signature du blog (le nom du site) est en écriture manuscrite Caveat (jamais pour de l'information). Beige #F1E8D6, encre brune, rouille #9A4F1D. La note de marge est un EXEMPLE (marquée comme tel).
const carnet = identite({
  key: "c035", label: "Papier beige, encre brune, rouille", humeur: "light",
  fond: "#f1e8d6", texte: "#2b241b", discret: "#64584a", accent: "#9a4f1d", surface: "#e6dac1",
  police: "font.karla", titres: "font.lora",
  rayon: "0px", rayonBouton: "4px", ombre: "none", poids: "600", bordure: "1px", ligne: "#2b241b40",
});
const carnetDeMarges = modeleV2({
  id: identifiantV2(35, "carnet-de-marges"), concept: "c-035-carnet-de-marges",
  name: "Carnet de marges", family: FAM,
  description: "Une page de carnet : colonne de lecture étroite bordée d'une ligne de marge rouille, mot d'au revoir en Lora, abonnement en une ligne, trois liens, une note en italique dans la marge et le nom du blog signé à la main.",
  tags: ["blog personnel", "carnet", "papier", "marge", "citation", "manuscrit", "chaleureux", "serif"],
  identity: carnet,
  racine: { desktop: { backgroundColor: "#eee3cd", gap: "0px" } },
  widgets: ["sitetitle", "emailsubscribe", "link", "text", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const surtitre = etiquette(k, "Fin de page", { couleur: S.accent, suivi: "0.2em" });
    const phrase = G.texteFluide("<p>Merci d'avoir lu jusqu'ici.<br>À très vite, au prochain billet.</p>", { taille: [28, 44], tablette: { taille: [34, 42] }, mobile: { taille: [28, 36] }, lh: 1.15, poids: "500", suivi: "-0.01em", police: S.head })(k, env);
    const intro = G.phrase("Un billet de temps en temps, sans bruit. Laissez votre adresse pour ne pas le manquer.", { taille: 17, largeur: "470px", couleur: S.mute })(k, env);
    const abo = G.abonnement({ titre: "", intro: "", bouton: "Me prévenir", largeur: "520px", soulignement: "2px", rayonBouton: "4px", fondChamp: S.alt, rembChamp: "14px", rayonChamp: "4px", tailleChamp: "16px" })(k, env);
    const trois = k.row([lien(k, "Tous les billets", "/blog", { taille: 16, soulignement: true, poids: "600", survol: S.accent }), lien(k, "Questions", "/faq", { taille: 16, soulignement: true, poids: "600", survol: S.accent }), lien(k, "Écrire", "/contact", { taille: 16, soulignement: true, poids: "600", survol: S.accent })], { ...G.gaps("6px 28px") });
    const reseaux = G.reseauxTexte(RESEAUX, { taille: 15, poids: "500", survol: S.accent, couleur: S.mute })(k, env);
    const signature = nomGeant(k, { taille: "fluid:36-52", police: "font.caveat", poids: "700", suivi: "0px", lh: 1.1, couleur: S.accent });
    const gauche = G.colonne(k, [surtitre, phrase, intro, abo, trois, reseaux, signature], { poids: 7, min: "300px", gap: "26px", extra: { maxWidth: "640px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "2px", borderColor: `${S.accent}99`, paddingLeft: "36px" }, mobile: { borderLeftWidth: "0px", paddingLeft: "0px" } });
    // la marge : une note en italique, un petit trait rouille au-dessus, mention honnête « exemple »
    const note = k.T("<p>« Écrire, c'est garder une porte ouverte. »</p>", { fontFamily: S.head, fontStyle: "italic", fontSize: "fluid:21-28", lineHeight: 1.3, color: S.fg });
    const marge = G.colonne(k, [G.filet({ largeur: "40px", epaisseur: "3px" })(k, env), note, etiquette(k, "Note de marge · exemple à remplacer", { taille: 11, suivi: "0.12em" })], { poids: 3, min: "220px", gap: "16px", soi: "flex-start", extra: { maxWidth: "300px", paddingTop: "72px" }, tablette: { flexBasis: "100%", maxWidth: "640px", paddingTop: "0px" }, mobile: { flexBasis: "100%", paddingTop: "0px" } });
    const corps = G.ligne(k, [gauche, marge], { gap: "48px 72px", aligne: "flex-start", justifie: "flex-start", largeur: "100%" });
    const filet = k.divider({ width: "100%", borderColor: S.line, borderTopWidth: "1px", marginTop: "0px", marginBottom: "0px" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    return [G.racine(k, [G.bande(k, [corps, filet, mentions], { colonne: true, gap: "56px", max: "1120px", padV: ["112px", "88px", "64px"], padB: ["40px", "36px", "32px"], padH: ["48px", "32px", "20px"], fond: S.bg, degrade: { from: "#f1e8d6", to: "#eee3cd", angle: 180 }, innerMobile: { rowGap: "40px" }, nom: "Carnet de marges" })])];
  },
}, FAM);

// ── c-036 « Revue Sommaire » ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : la navigation est le SOMMAIRE d'une revue — numéro (chiffre d'accent), titre, filet pointillé, mention à droite ; à côté, les derniers numéros (liste dynamique) et l'abonnement dans une carte à double bordure.
// Brun sombre #2C1B18, papier #F1E5D8, orange pâle #E8A87C. Polices : Libre Caslon Text (titre « Sommaire » en 400, testé à grand corps) et Hanken Grotesk. Les pointillés sont décoratifs (aucun texte).
const revueId = identite({
  key: "c036", label: "Brun sombre, papier et orange pâle", humeur: "dark",
  fond: "#2c1b18", texte: "#f1e5d8", discret: "#cdb9a6", accent: "#e8a87c", surface: "#3b2622",
  police: "font.hanken-grotesk", titres: "font.libre-caslon-text",
  rayon: "2px", rayonBouton: "2px", ombre: "none", poids: "700", bordure: "1px", ligne: "#f1e5d84d",
});
// une ligne de sommaire : « 01  Titre ········· mention »
const ligneSommaire = (k, num, label, url, mention) => {
  const S = k.S;
  const pointilles = { type: "container", children: [], ...sty({ flexGrow: 1, flexShrink: 1, flexBasis: "0px", minWidth: "16px", height: "0px", borderStyle: "dotted", borderWidth: "0px", borderBottomWidth: "2px", borderColor: `${S.fg}8c` }) };
  const n = k.T(`<p>${num}</p>`, { fontFamily: S.head, fontSize: "16px", color: S.accent, minWidth: "30px", lineHeight: 1.3 });
  const m = { ...k.T(`<p>${mention}</p>`, { fontFamily: S.font, fontSize: "12px", color: S.mute, textTransform: "uppercase", letterSpacing: "0.14em", lineHeight: 1.3, whiteSpace: "nowrap" }), hideOn: ["mobile"] };
  const l = lien(k, label, url, { taille: 26, poids: "400", police: S.head, survol: S.accent, lh: 1.25 }); l.styles.mobile = { ...(l.styles.mobile || {}), fontSize: "22px" };
  return k.row([n, l, pointilles, m], { gap: "12px", alignItems: "baseline", flexWrap: "nowrap", width: "100%" });
};
const revueSommaire = modeleV2({
  id: identifiantV2(36, "revue-sommaire"), concept: "c-036-revue-sommaire",
  name: "Revue sommaire", family: FAM,
  description: "La navigation devient le sommaire d'une revue : numéros d'accent, titres en Caslon, filets pointillés, mentions à droite. À côté, les derniers numéros et l'abonnement dans une carte à double bordure. Brun sombre, papier, orange pâle.",
  tags: ["revue", "sommaire", "longue lecture", "pointillés", "caslon", "brun", "carte d'abonnement", "éditorial"],
  identity: revueId,
  racine: { desktop: { backgroundColor: "#2c1b18", gap: "0px" } },
  widgets: ["sitetitle", "querylist", "emailsubscribe", "link", "text", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const marque = nomGeant(k, { taille: "20px", police: S.head, poids: "400", suivi: "0.04em", lh: 1.2, couleur: S.accent });
    const titre = G.texteFluide("<p>Sommaire</p>", { taille: [52, 108], tablette: { taille: [64, 96] }, mobile: { taille: [52, 76] }, lh: 1, suivi: "-0.01em", poids: "400", police: S.head, couleur: S.fg })(k, env);
    const lignes = k.col([
      ligneSommaire(k, "01", "Les articles", "/blog", "Lire"), ligneSommaire(k, "02", "Questions fréquentes", "/faq", "FAQ"), ligneSommaire(k, "03", "Nous écrire", "/contact", "Contact"),
      ligneSommaire(k, "04", "Votre compte", "/connexion", "Connexion"), ligneSommaire(k, "05", "Nous rejoindre", "/inscription", "Inscription"),
    ], { gap: "4px", width: "100%", alignItems: "stretch" });
    const sommaire = G.colonne(k, [marque, titre, lignes], { poids: 6, min: "320px", gap: "28px", aligne: "stretch" });
    const numeros = G.colonne(k, [etiquette(k, "Derniers numéros", { couleur: S.accent }), requete(k, { source: "posts", mode: "recent", count: 4, layout: "list", showDate: true, empty: "Les derniers numéros apparaîtront ici." }, { filets: "1px", tailleLien: 16, pad: "9px", policeLien: S.head, poidsLien: "400", survol: S.accent, lh: 1.3 })], { poids: 3, min: "240px", gap: "14px", aligne: "stretch" });
    const aboCarte = k.card([G.abonnement({ titre: "Abonnement", intro: "Chaque nouveau numéro, dans votre boîte aux lettres électronique.", bouton: "S'abonner", largeur: "100%", soulignement: "2px", rayonBouton: "2px", styleTitre: titreAbo(S, { couleur: S.accent }) })(k, env)], { backgroundColor: S.alt, borderStyle: "double", borderWidth: "6px", borderColor: S.accent, borderRadius: "2px", paddingTop: "28px", paddingBottom: "32px", paddingLeft: "28px", paddingRight: "28px", gap: "12px", boxShadow: undefined });
    const carte = G.colonne(k, [aboCarte], { poids: 3, min: "260px", aligne: "stretch", soi: "flex-start", extra: { paddingTop: "6px" } });
    const haut = G.ligne(k, [sommaire, numeros, carte], { gap: "56px 64px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const filet = k.divider({ width: "100%", borderColor: S.line, borderTopWidth: "1px", marginTop: "0px", marginBottom: "0px" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    return [G.racine(k, [G.bande(k, [haut, filet, mentions], { colonne: true, gap: "56px", max: "1240px", padV: ["104px", "80px", "56px"], padB: ["40px", "36px", "32px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "36px" }, nom: "Revue sommaire" })])];
  },
}, FAM);

// ── c-037 « Barres de Son » ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : une onde sonore en barres noires sur corail (décor STATIQUE : aucune animation, donc rien à couper en « mouvement réduit »), les cinq derniers épisodes en cartes (liste dynamique), les plateformes d'écoute en pastilles.
// Corail #FF4F3A, noir profond, rose clair #FFB3A6. Polices : Syne 800 (propre à grand corps, testé) et Albert Sans. Les adresses des plateformes sont des EXEMPLES (pages d'accueil) à remplacer.
const onde = identite({
  key: "c037", label: "Corail vif et noir profond", humeur: "light",
  fond: "#ff4f3a", texte: "#140806", discret: "#3b1510", accent: "#140806", surface: "#ffb3a6",
  police: "font.albert-sans", titres: "font.syne",
  rayon: "20px", rayonBouton: "999px", ombre: "none", poids: "800", bordure: "2px", ligne: "#140806",
});
const barre = (k, h, couleur, mobile) => ({ type: "container", children: [], ...(mobile ? { hideOn: ["mobile"] } : {}), ...sty({ width: "5px", height: `${h}px`, backgroundColor: couleur, borderRadius: "3px", flexShrink: 0 }) });
const barresSon = modeleV2({
  id: identifiantV2(37, "barres-de-son"), concept: "c-037-barres-de-son",
  name: "Barres de son", family: FAM,
  description: "Une onde sonore en barres noires sur corail vif, les derniers épisodes en cartes à bordure noire, les plateformes d'écoute en pastilles. Pour un podcast ou une radio : franc, rythmé, sans animation.",
  tags: ["podcast", "radio", "onde sonore", "corail", "épisodes", "pastilles", "plateformes d'écoute", "Syne"],
  identity: onde,
  racine: { desktop: { backgroundColor: "#ff4f3a", gap: "0px" } },
  widgets: ["sitetitle", "querylist", "link", "container", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomGeant(k, { taille: "fluid:36-76", mobile: "fluid:38-52", police: S.head, poids: "800", suivi: "-0.03em", lh: 1 });
    const gauche = G.colonne(k, [etiquette(k, "Le podcast", { couleur: S.fg }), nom], { poids: 7, min: "300px", gap: "14px", aligne: "stretch" });
    const pastilles = G.pilules([["Apple Podcasts", "https://podcasts.apple.com/"], ["Spotify", "https://open.spotify.com/"], ["Deezer", "https://www.deezer.com/"], ["YouTube", "https://www.youtube.com/"]], { contour: S.fg, gap: "10px", poids: "700", taille: 15 })(k, env);
    const droite = G.colonne(k, [etiquette(k, "Écouter sur", { couleur: S.fg }), pastilles], { poids: 5, min: "280px", gap: "14px", soi: "flex-end" });
    const entete = G.ligne(k, [gauche, droite], { gap: "36px 56px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    // l'onde : 64 barres (32 sur mobile), hauteurs en vagues ; décor sans texte
    const hauteurs = Array.from({ length: 64 }, (_, i) => Math.round(8 + 64 * Math.abs(Math.sin(i * 0.29 + 0.6) * Math.cos(i * 0.093 + 1.2)) + (i % 6 === 0 ? 10 : 0)));
    const barres = k.row(hauteurs.map((h, i) => barre(k, h, i % 9 === 4 ? S.alt : S.fg, i % 2 === 1)), { gap: "0px", flexWrap: "nowrap", justifyContent: "space-between", alignItems: "center", width: "100%", minHeight: "84px", overflow: "hidden" });
    const episodes = k.col([etiquette(k, "Derniers épisodes", { couleur: S.fg }), requete(k, { source: "posts", mode: "recent", count: 5, layout: "cards", showDate: true, empty: "Les épisodes apparaîtront ici." }, { couleur: S.fg, mute: S.mute, tailleLien: 15, poidsLien: "800", policeLien: S.head, lh: 1.25, survol: S.fg, pad: "0px", item: { backgroundColor: S.alt, borderStyle: "solid", borderWidth: "2px", borderColor: S.fg, borderRadius: "20px", paddingTop: "18px", paddingBottom: "18px", paddingLeft: "18px", paddingRight: "18px" } })], { gap: "16px", width: "100%", alignItems: "stretch" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true, couleur: S.mute, liens: S.fg })(k, env);
    return [G.racine(k, [G.bande(k, [entete, barres, episodes, mentions], { colonne: true, gap: "44px", max: "1240px", padV: ["88px", "72px", "56px"], padB: ["40px", "36px", "32px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "32px" }, nom: "Barres de son" })])];
  },
}, FAM);

// ── c-038 « Presse Régionale » ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : le quotidien régional — en-tête Oswald sous un filet rouge, quatre colonnes serrées (rubriques, à la une, services, nous joindre), puis une LARGE BANDE ROUGE d'abonnement qui coupe le pied en deux, puis la ligne légale sur gris.
// Blanc, noir, rouge franc #C8102E. Polices : Oswald (capitales, jamais au-delà de 64 px) et Source Sans 3. Sur mobile, la bande rouge monte en tête du pied et les colonnes deviennent des volets. Aucun prix affiché (le tarif est à saisir par le client dans le texte de la bande).
const regionale = identite({
  key: "c038", label: "Blanc, noir et rouge franc", humeur: "light",
  fond: "#ffffff", texte: "#171717", discret: "#505050", accent: "#c8102e", surface: "#f2f2f2",
  police: "font.source-sans-3", titres: "font.oswald",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#17171759",
});
const presseRegionale = modeleV2({
  id: identifiantV2(38, "presse-regionale"), concept: "c-038-presse-regionale",
  name: "Presse régionale", family: FAM,
  description: "Le quotidien régional : en-tête en capitales, quatre colonnes serrées (rubriques, à la une, services, contact) puis une large bande rouge d'abonnement qui coupe le pied en deux. Blanc, noir, rouge franc.",
  tags: ["presse régionale", "quotidien", "bande rouge", "abonnement", "colonnes", "Oswald", "blanc", "rouge"],
  identity: regionale,
  racine: { desktop: { backgroundColor: "#f2f2f2", gap: "0px" } },
  widgets: ["sitetitle", "querylist", "emailsubscribe", "bizcontact", "social", "link", "text", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, rouge = S.accent, blanc = "#ffffff";
    // 1 · en-tête et quatre colonnes
    const date = Moteur.item(k, "date", env);
    date.styles.desktop = { ...date.styles.desktop, fontFamily: S.font, color: S.mute, fontSize: "12px", letterSpacing: "0.16em" };
    const nom = nomGeant(k, { taille: "fluid:34-60", poids: "700", police: S.head, suivi: "0.02em", lh: 1.05, casse: "uppercase", couleur: S.fg, largeur: "auto" });
    const entete = G.ligne(k, [nom, date], { justifie: "space-between", aligne: "flex-end", largeur: "100%", gap: "8px 24px" });
    const filet2 = k.divider({ width: "100%", borderColor: S.fg, borderTopWidth: "2px", marginTop: "0px", marginBottom: "0px" });
    const colonnes = Kit.accordeon([
      { title: "Rubriques", w: 1, codes: [(kk) => requete(kk, { source: "categories", mode: "popular", count: 8, layout: "list", showCount: true, empty: "Les rubriques apparaîtront ici." }, { filets: "1px", tailleLien: 15, pad: "6px", poidsLien: "600" })] },
      { title: "À la une", w: 1, codes: [(kk) => requete(kk, { source: "posts", mode: "recent", count: 4, layout: "list", showDate: true }, { filets: "1px", tailleLien: 15, pad: "8px", poidsLien: "600" })] },
      { title: "Services", w: 1, codes: [(kk) => liste(kk, [["Contact", "/contact"], ["Questions fréquentes", "/faq"], ["Se connecter", "/connexion"], ["Créer un compte", "/inscription"]], { taille: 15, gap: "0px", filet: true })] },
      { title: "Nous joindre", w: 1, codes: ["contact", "social:sq"] },
    ], { min: "250px" })(k, env);
    Object.assign(colonnes.styles.desktop, { marginLeft: "-2px", marginRight: "-2px", width: "auto", maxWidth: "100%" }); colonnes.styles.mobile = { ...(colonnes.styles.mobile || {}), marginLeft: "0px", marginRight: "0px" };
    const bandeHaut = G.bande(k, [entete, filet2, colonnes], { colonne: true, gap: "24px", max: "1240px", padV: ["56px", "48px", "40px"], padB: ["56px", "48px", "40px"], padH: ["48px", "32px", "20px"], fond: S.bg, filetHaut: { epaisseur: "6px", couleur: rouge }, innerMobile: { rowGap: "20px" }, nom: "Presse régionale — colonnes" });
    // 2 · la bande rouge d'abonnement (pleine largeur) : titre à gauche, champ blanc à droite ; sur mobile elle passe en tête
    const titreBande = G.texteFluide("<p>Le journal du matin,<br>où que vous soyez.</p>", { taille: [30, 52], mobile: { taille: [30, 36] }, lh: 1.08, suivi: "0.01em", poids: "600", police: S.head, couleur: blanc, casse: "uppercase" })(k, env);
    const sousTitre = G.phrase("Abonnez-vous : tous les articles et la lettre quotidienne.", { taille: 16, couleur: blanc, largeur: "460px" })(k, env);
    // le champ est posé sur une CARTE BLANCHE (le libellé « Adresse e-mail » du widget prend la couleur du modèle : illisible sur le rouge)
    const abo = k.card([G.abonnement({ titre: "Lettre quotidienne", intro: "Chaque matin, l'essentiel.", bouton: "S'abonner", largeur: "100%", soulignement: "2px", rayonBouton: "0px", styleTitre: titreAbo(S, { couleur: rouge }), tailleChamp: "17px" })(k, env)], { backgroundColor: blanc, borderRadius: "0px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", boxShadow: undefined, borderWidth: "0px", width: "100%", maxWidth: "480px" });
    const gBande = G.colonne(k, [titreBande, sousTitre], { poids: 6, min: "300px", gap: "14px" });
    const dBande = G.colonne(k, [abo], { poids: 5, min: "300px", soi: "center" });
    const bandeRouge = G.bande(k, [G.ligne(k, [gBande, dBande], { gap: "32px 64px", aligne: "center", justifie: "space-between", largeur: "100%" })], { colonne: true, max: "1240px", padV: ["64px", "56px", "48px"], padB: ["64px", "56px", "48px"], padH: ["48px", "32px", "20px"], fond: rouge, nom: "Presse régionale — bande rouge" });
    bandeRouge.styles.mobile = { ...bandeRouge.styles.mobile, order: -1 };
    // 3 · la ligne légale sur gris clair
    const bandeBas = G.bande(k, [G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { colonne: true, max: "1240px", padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], fond: S.alt, nom: "Presse régionale — mentions" });
    return [G.racine(k, [bandeHaut, bandeRouge, bandeBas])];
  },
}, FAM);

// ── c-039 « Reportage Légendé » ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : le pied est une planche-contact — un grand CADRE PHOTO (la photo se choisit dans l'éditeur : image d'arrière-plan ; voile noir déjà posé, repli en dégradé sans photo) avec sa légende en capitales et son trait jaune d'alerte ; à côté, le nom, trois liens et l'abonnement.
// Noir #0A0A0A, blanc, jaune #FFD60A. Polices : Archivo 800 et Archivo Narrow. Aucune photo n'est livrée ; la légende est un EXEMPLE marqué comme tel. Sur mobile, la légende passe SOUS la photo.
const reportage = identite({
  key: "c039", label: "Noir, blanc et jaune d'alerte", humeur: "dark",
  fond: "#0a0a0a", texte: "#f5f5f5", discret: "#c6c6c6", accent: "#ffd60a", surface: "#171717",
  police: "font.archivo-narrow", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "1px", ligne: "#f5f5f54d",
});
const reportageLegende = modeleV2({
  id: identifiantV2(39, "reportage-legende"), concept: "c-039-reportage-legende",
  name: "Reportage légendé", family: FAM,
  description: "Une planche-contact : un grand cadre photo voilé de noir (à remplir dans l'éditeur) avec sa légende en capitales et son trait jaune, face au nom, à trois liens et à l'abonnement. Noir, blanc, jaune d'alerte.",
  tags: ["photojournalisme", "agence photo", "légende", "cadre photo", "noir", "jaune", "reportage", "planche-contact"],
  identity: reportage,
  racine: { desktop: { backgroundColor: "#0a0a0a", gap: "0px" } },
  widgets: ["sitetitle", "emailsubscribe", "link", "text", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const bordPellicule = k.T("<p>PLANCHE 01 &nbsp;·&nbsp; 24A &nbsp;·&nbsp; 25</p>", { fontFamily: S.font, fontSize: "12px", letterSpacing: "0.24em", color: S.accent, lineHeight: 1.3, fontWeight: "600" });
    const legende = (cache) => {
      const kids = [G.filet({ largeur: "44px", epaisseur: "4px" })(k, env), etiquette(k, "Légende · exemple à remplacer", { couleur: S.accent, taille: 11, suivi: "0.2em" }),
        G.texteFluide("<p>Le quai à l'aube, avant l'arrivée des chalutiers.</p>", { taille: [22, 34], lh: 1.15, poids: "700", police: S.head, couleur: S.fg, largeur: "560px", suivi: "-0.01em" })(k, env),
        etiquette(k, "Photo : Prénom Nom · Lieu · Date", { couleur: S.mute, taille: 12, suivi: "0.14em", poids: "600" })];
      return { ...k.col(kids, { gap: "12px", alignItems: "flex-start" }), ...(cache ? { hideOn: cache } : {}) };
    };
    const cadre = { type: "container", children: [bordPellicule, legende(["mobile"])], ...sty({ display: "flex", flexDirection: "column", justifyContent: "space-between", flexBasis: "0px", flexGrow: 7, minWidth: "300px", minHeight: "480px", paddingTop: "28px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px", gradient: { from: "#4a4a4a", to: "#050505", type: "radial", angle: 180 }, overlay: { color: "#0a0a0a99" }, borderStyle: "solid", borderWidth: "1px", borderColor: S.line, gap: "32px" }, { minHeight: "380px" }, { minHeight: "220px", paddingLeft: "20px", paddingRight: "20px", paddingTop: "20px", paddingBottom: "20px", flexBasis: "100%" }) };
    const sousCadre = legende(["desktop", "tablet"]);
    const nom = nomGeant(k, { taille: "fluid:30-44", poids: "800", police: S.head, suivi: "0.02em", lh: 1.05, casse: "uppercase", couleur: S.fg });
    const intro = G.phrase("Reportages, portraits et récits en images.", { taille: 18, largeur: "380px", couleur: S.mute })(k, env);
    const trois = k.col([["Les reportages", "/blog"], ["Questions", "/faq"], ["Nous contacter", "/contact"]].map(([l, u]) => lien(k, `${l} ↗`, u, { taille: 22, poids: "700", police: S.head, survol: S.accent, lh: 1.2 })), { gap: "2px" });
    const abo = G.abonnement({ titre: "Le fil de l'agence", intro: "", bouton: "OK", largeur: "420px", soulignement: "2px", rayonBouton: "0px", tailleChamp: "17px", styleTitre: titreAbo(S) })(k, env);
    const reseaux = k.row(RESEAUX.map(([l, u]) => lien(k, l, u, { taille: 14, casse: "uppercase", suivi: "0.12em", poids: "600", survol: S.accent, couleur: S.mute })), { ...G.gaps("2px 22px") });
    const droite = G.colonne(k, [k.col([nom, intro], { gap: "16px", alignItems: "stretch" }), trois, k.col([abo, reseaux], { gap: "24px", alignItems: "stretch" })], { poids: 4, min: "280px", gap: "32px", aligne: "stretch", justifie: "space-between" });
    const haut = G.ligne(k, [cadre, droite], { gap: "40px 64px", aligne: "stretch", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bandeHaut = G.bande(k, [haut, sousCadre], { colonne: true, gap: "28px", max: "1240px", padV: ["96px", "72px", "48px"], padB: ["64px", "48px", "36px"], padH: ["48px", "32px", "20px"], fond: S.bg, nom: "Reportage légendé" });
    const bandeBas = G.bande(k, [mentions], { colonne: true, max: "1240px", padV: ["24px", "24px", "20px"], padB: ["24px", "24px", "20px"], padH: ["48px", "32px", "20px"], fond: S.bg, filetHaut: { epaisseur: "1px", couleur: S.line }, nom: "Reportage légendé — mentions" });
    return [G.racine(k, [bandeHaut, bandeBas])];
  },
}, FAM);

// ── c-040 « Rubriques Géantes » ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : le pied EST une table des matières — six lignes monumentales noir sur blanc, séparées par des filets de 2 px, chacune avec sa flèche ↗ ; au survol (ou au focus) la ligne s'inverse (blanc sur noir) et glisse de 16 px. Aucune autre décoration.
// Noir et blanc brut. Police : Archivo 800 (variable, propre à grand corps ; remplace Archivo Black du concept, dont la barre du « e » a une fente : voir guide). Les six lignes mènent aux pages de la plateforme (jamais de lien mort).
const brut = identite({
  key: "c040", label: "Noir et blanc brut", humeur: "light",
  fond: "#ffffff", texte: "#000000", discret: "#3d3d3d", accent: "#000000", surface: "#f2f2f2",
  police: "font.archivo", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "2px", ligne: "#000000",
});
const rubriquesGeantes = modeleV2({
  id: identifiantV2(40, "rubriques-geantes"), concept: "c-040-rubriques-geantes",
  name: "Rubriques géantes", family: FAM,
  description: "Six rubriques en très grand, noir sur blanc, séparées par des filets de 2 px et suivies d'une flèche : le pied est une table des matières. Au survol, la ligne s'inverse. Aucune autre décoration.",
  tags: ["média indépendant", "navigation géante", "noir et blanc", "table des matières", "flèches", "brutaliste", "contraste d'échelle"],
  identity: brut,
  racine: { desktop: { backgroundColor: "#ffffff", gap: "0px" } },
  widgets: ["link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const rang = (label, url, derniere) => {
      const n = k.LINK(`${label} ↗`, url, compact({ fontSize: "fluid:44-128", fontWeight: "800", fontFamily: S.head, color: S.fg, lineHeight: 1, letterSpacing: "-0.035em", wordSpacing: "0.1em", textDecoration: "none", display: "block", width: "100%", paddingTop: "12px", paddingBottom: "18px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderBottomWidth: derniere ? "2px" : "0px", borderColor: S.fg, transitionDuration: G.MOUVEMENT }));
      n.styles.tablet = { fontSize: "fluid:56-104" }; n.styles.mobile = { fontSize: "fluid:44-60", paddingTop: "10px", paddingBottom: "14px" };
      return G.fini(k, n, { hover: { backgroundColor: S.fg, color: S.bg, transform: { x: 16 }, textDecoration: "none" }, focus: { outlineStyle: "solid", outlineWidth: "4px", outlineColor: S.fg, outlineOffset: "-8px" } });
    };
    const liste6 = k.col([["Les articles", "/blog"], ["Questions", "/faq"], ["Contact", "/contact"], ["Connexion", "/connexion"], ["Rejoindre", "/inscription"], ["Accueil", "/"]].map(([l, u], i, a) => rang(l, u, i === a.length - 1)), { gap: "0px", width: "100%", alignItems: "stretch" });
    const reseaux = G.reseauxTexte(RESEAUX, { taille: 15, poids: "700", survol: S.fg })(k, env);
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bas = G.ligne(k, [reseaux, mentions], { gap: "20px 48px", aligne: "center", justifie: "space-between", largeur: "100%" });
    return [G.racine(k, [G.bande(k, [liste6, bas], { colonne: true, gap: "32px", max: "1360px", padV: ["72px", "56px", "40px"], padB: ["32px", "28px", "24px"], padH: ["40px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "24px" }, nom: "Rubriques géantes" })])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Médias et éditorial", target: 8, built: true,
  description: "Journaux, revues, blogs et radios : filets, rubriques, grilles éditoriales et typographie de presse.",
  models: [journalTripleFilet, modeCapitales, carnetDeMarges, revueSommaire, barresSon, presseRegionale, reportageLegende, rubriquesGeantes],
};
