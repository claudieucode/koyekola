// Famille v2 « Corporate et institutions » — 8 modèles (concepts c-001 à c-008 de docs/footer-v2/CONCEPTS_100.md). Voir docs/footer-v2/GUIDE_CONSTRUIRE_UN_MODELE_V2.md.
// Chaque modèle est INDÉPENDANT du site (mode « solo ») : ses couleurs (hexadécimal), ses polices (bibliothèque auto-hébergée) et ses formes viennent de son identité (identite()).
// Toutes les marques (Bastion, Trois-Vallées, Maréchal & Associés, Ferroval, Maître & Fils, Val-de-Rive, Terrane, Cap Dépannage) sont FICTIVES ; les chiffres, sites et noms d'exemple sont signalés « exemple » et se modifient dans l'éditeur.
// Les aides locales (en tête de fichier) complètent le kit v2 sans le modifier.
// Polices testées à 130 px (accents, « a », « e », « n », « ? ») : Sora 700, Schibsted Grotesk 700/800, Barlow Condensed 700/800, Newsreader 400/500, Cormorant Garamond 500/600, Fraunces 600/700/900, Lexend 600/700, Atkinson Hyperlegible 700, Public Sans 700 : PROPRES (aucune encoche).
const { sty, compact, kit } = require("../../../kit");
const { modeleV2, identifiantV2, identite, Moteur } = require("../kit-v2");

const FAM = "corporate-institutions";

// ── Aides locales ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const tx = (k, html, st = {}, t, m) => k.T(/^\s*</.test(html) ? html : `<p>${html}</p>`, st, t, m);
// petit libellé de colonne en capitales espacées
const cap = (k, txt, o = {}) => tx(k, txt, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "600", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, textAlign: o.align }));
// lien simple : survol (couleur + souligné), contour de focus de 2 px, cible de 44 px sur mobile (finition du moteur)
const lien = (k, G, label, url, o = {}) => G.fini(k, k.LINK(label, url, compact({ fontSize: `${o.taille || 14}px`, fontWeight: o.poids || "500", fontFamily: o.police || k.S.font, color: o.couleur || k.S.fg, textDecoration: "none", lineHeight: o.lh || 1.4, letterSpacing: o.suivi, textTransform: o.casse, paddingTop: o.pv, paddingBottom: o.pv, display: "inline-flex", alignItems: "center", transitionDuration: G.MOUVEMENT, ...(o.extra || {}) })), { hover: { color: o.survol || k.S.accent, textDecoration: "underline" }, focus: G.focus(o.focus || k.S.accent) });
// carré plein (puce)
const carre = (k, t, couleur) => ({ type: "container", children: [], ...sty({ width: t, height: t, minWidth: t, backgroundColor: couleur, flexShrink: 0 }) });
// grille à nombre de colonnes réglé par écran [bureau, tablette, mobile]
const grille = (k, enfants, cols, st = {}, t = {}, m = {}) => ({ type: "grid", children: enfants, ...sty(compact({ columns: cols[0], gap: "24px", width: "100%", ...st }), { columns: cols[1], ...t }, { columns: cols[2], ...m }) });
// filet pleine largeur
const filetH = (k, couleur, e = "1px", st = {}) => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: e, marginTop: "0px", marginBottom: "0px", ...st });
// liste de liens en colonne
const groupeLiens = (k, G, liste, o = {}) => k.col(liste.map(([l, u]) => lien(k, G, l, u, o.lien || {})), { gap: o.gap || "8px", alignItems: "flex-start" }, o.tablette, o.mobile);
// style de la balise <footer> : fond du modèle, aucun écart (pas de bande blanche avant la ligne légale du site)
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-001 « Bastion Ardoise » — conseil fictif « Bastion ». Une BANDE VERTICALE ardoise à gauche empile quatre chiffres-clés (exemples) ; le contenu est à côté.
// Bleu ardoise #12202e, jaune ambré #e3b04b réservé aux chiffres, aux puces et au champ. Sora 700 (marque, chiffres, accroche) + Inter.
const bastionId = identite({
  key: "c001", label: "Ardoise et ambre", humeur: "dark",
  fond: "#12202e", texte: "#f2f5f8", discret: "#aebbc8", accent: "#e3b04b", surface: "#1b3144",
  police: "font.inter", titres: "font.sora", rayon: "2px", rayonBouton: "2px", ombre: "none", poids: "700", bordure: "1px", ligne: "#324a60",
});
const bastion = modeleV2({
  id: identifiantV2(1, "bastion-ardoise"), concept: "c-001-bastion-ardoise", name: "Bastion ardoise", family: FAM,
  description: "Une bande verticale ardoise à gauche empile quatre chiffres-clés d'exemple avec leurs petits carrés ambrés ; à côté, trois colonnes de liens, le contact et un champ e-mail souligné. Sobre, anguleux, très lisible.",
  tags: ["conseil", "chiffres clés", "bande latérale", "ardoise", "ambre", "corporate"],
  identity: bastionId,
  racine: racineDe("#12202e"),
  widgets: ["text", "bizcontact", "emailsubscribe", "social", "copyright", "bizlegal", "grid", "divider", "link"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · la bande latérale : marque, signature, quatre chiffres EXEMPLES (à remplacer par les vrais chiffres du client)
    const marque = tx(k, "BASTION", { fontFamily: S.head, fontWeight: "800", fontSize: "26px", letterSpacing: "0.3em", color: S.fg, lineHeight: 1 });
    const signature = tx(k, "Conseil en stratégie et en organisation", { fontSize: "14px", lineHeight: 1.5, color: S.mute, maxWidth: "230px" }, undefined, { maxWidth: "100%" });
    const cellule = (n, l) => k.col([
      k.row([carre(k, "10px", S.accent), tx(k, n, { fontFamily: S.head, fontSize: "44px", lineHeight: 1, fontWeight: "700", color: S.accent, letterSpacing: "-0.02em" }, { fontSize: "38px" }, { fontSize: "34px" })], { gap: "12px", flexWrap: "nowrap", alignItems: "center" }),
      tx(k, `${l} (exemple)`, { fontSize: "13px", lineHeight: 1.4, color: S.mute, paddingLeft: "20px" }, undefined, { fontSize: "12px", paddingLeft: "0px" }),
    ], { gap: "8px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: S.line, paddingTop: "20px", paddingBottom: "20px" }, { paddingTop: "4px", paddingBottom: "4px", borderTopWidth: "0px" }, { paddingTop: "12px", paddingBottom: "12px" });
    const chiffres = grille(k, [cellule("32", "années de conseil"), cellule("450", "missions menées"), cellule("18", "pays d'intervention"), cellule("96 %", "clients qui reviennent")], [1, 4, 2], { gap: "0px" }, { columnGap: "28px" }, { columnGap: "16px", rowGap: "0px" });
    const panneau = k.col([marque, signature, filetH(k, S.accent, "3px", { width: "40px", marginTop: "8px" }), chiffres],
      { backgroundColor: S.alt, width: "340px", flexShrink: 0, paddingTop: "72px", paddingBottom: "56px", paddingLeft: "44px", paddingRight: "40px", gap: "20px", alignItems: "stretch" },
      { width: "100%", paddingTop: "48px", paddingBottom: "36px", paddingLeft: "32px", paddingRight: "32px", flexShrink: 1 },
      { paddingTop: "40px", paddingBottom: "28px", paddingLeft: "20px", paddingRight: "20px" });
    // 2 · la zone de droite : accroche, trois colonnes de liens, contact + champ e-mail, réseaux carrés, mentions
    const accroche = tx(k, "Parlons de ce qui compte pour votre organisation.", { fontFamily: S.head, fontWeight: "700", fontSize: "fluid:24-36", lineHeight: 1.15, letterSpacing: "-0.015em", color: S.fg, maxWidth: "560px" });
    const col = (t, liste) => k.col([cap(k, t), groupeLiens(k, G, liste, { gap: "6px", mobile: { flexDirection: "row", flexWrap: "wrap", columnGap: "28px", rowGap: "0px" } })], { gap: "14px" }, undefined, { gap: "4px" });
    const colonnes = grille(k, [
      col("Le cabinet", [["Accueil", "/"], ["Actualités", "/blog"], ["Contact", "/contact"]]),
      col("Espace client", [["Se connecter", "/connexion"], ["Créer un compte", "/inscription"], ["Questions fréquentes", "/faq"]]),
      col("Ressources", [["Catalogue", "/catalogue"], ["Boutique", "/boutique"]]),
    ], [3, 3, 1], { columnGap: "40px", rowGap: "8px" }, {}, { rowGap: "28px" });
    const titreCol = { fontFamily: S.font, color: S.mute, fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "14px" };
    const coord = G.code("contact|Nous écrire")(k, env);
    Moteur.mergePart(coord, "title", { styles: { desktop: titreCol } });
    const contact = k.col([coord], { flexBasis: "0px", flexGrow: 1, minWidth: "240px" });
    const abo = G.abonnement({ titre: "Lettre du cabinet", intro: "Nos notes de synthèse, directement par e-mail.", bouton: "S'abonner", largeur: "440px", soulignement: "2px", rayonBouton: "2px", styleTitre: titreCol })(k, env);
    const abonnement = k.col([abo], { flexBasis: "0px", flexGrow: 1.3, minWidth: "280px" });
    const reseaux = k.social([{ network: "linkedin", url: "https://www.linkedin.com/" }, { network: "youtube", url: "https://www.youtube.com/" }, { network: "instagram", url: "https://www.instagram.com/" }], { gap: "8px" });
    reseaux.props.shape = "square"; reseaux.props.size = "48";
    Moteur.finishNode(S, reseaux);
    Moteur.mergePart(reseaux, "link", { styles: { desktop: { backgroundColor: S.alt, borderStyle: "solid", borderWidth: "1px", borderColor: S.line } } });
    const milieu = k.row([abonnement, contact], { rowGap: "32px", columnGap: "56px", alignItems: "flex-start", width: "100%", flexWrap: "wrap" });
    const bas = k.row([reseaux], { width: "100%", justifyContent: "flex-start" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const zone = k.col([accroche, filetH(k, S.line), colonnes, filetH(k, S.line), milieu, bas, filetH(k, S.line), mentions],
      { flexBasis: "0px", flexGrow: 1, minWidth: "0px", maxWidth: "1260px", gap: "36px", paddingTop: "72px", paddingBottom: "44px", paddingLeft: "56px", paddingRight: "56px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: S.line },
      { paddingTop: "44px", paddingLeft: "32px", paddingRight: "32px", borderLeftWidth: "0px", flexBasis: "100%", flexGrow: 0, maxWidth: "100%", gap: "32px" },
      { paddingTop: "36px", paddingBottom: "28px", paddingLeft: "20px", paddingRight: "20px", gap: "28px" });
    return [G.racine(k, [G.bande(k, [panneau, zone], { aligne: "stretch", gap: "0px", padV: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Bastion ardoise" })])];
  },
}, FAM);


// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-002 « Registre Public » — collectivité fictive « Communauté des Trois-Vallées ». Un ANNUAIRE de cinq groupes de liens, toujours lisible, précédé d'un bandeau d'accessibilité.
// Blanc bleuté #f7f9fb, encre #14212d, un seul bleu #0b5cad (liens, filets, focus). Atkinson Hyperlegible (marque, titres) + Public Sans. Pas de sélecteur de langue factice : le bandeau dit ce qui existe.
const registreId = identite({
  key: "c002", label: "Bleu institutionnel", humeur: "light",
  fond: "#f7f9fb", texte: "#14212d", discret: "#46586b", accent: "#0b5cad", surface: "#e4eaf1",
  police: "font.public-sans", titres: "font.atkinson-hyperlegible", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#b4c2d1",
});
const registre = modeleV2({
  id: identifiantV2(2, "registre-public"), concept: "c-002-registre-public", name: "Registre public", family: FAM,
  description: "Le pied d'une collectivité : un bandeau d'accessibilité, puis cinq groupes de liens classés comme un annuaire, les coordonnées et les horaires. Texte encre sur blanc bleuté, un seul bleu, des filets plutôt que des boîtes.",
  tags: ["collectivité", "annuaire", "accessibilité", "institution", "bleu", "plan du site"],
  identity: registreId,
  racine: racineDe("#f7f9fb"),
  widgets: ["text", "link", "querylist", "sitemap", "bizcontact", "bizhours", "copyright", "bizlegal", "backtotop", "divider", "stack"],
  compose(k, env, G) {
    const S = k.S, blanc = "#ffffff";
    // 1 · la barre d'identité : emblème (carré bleu), nom de la collectivité fictive, bandeau d'accessibilité (ce qui existe vraiment : lecture, signalement, langue)
    const embleme = { type: "container", children: [tx(k, "TV", { fontFamily: S.head, fontWeight: "700", fontSize: "20px", letterSpacing: "0.04em", color: S.onAccent, lineHeight: 1 })], ...sty({ width: "56px", height: "56px", minWidth: "56px", backgroundColor: S.accent, display: "flex", alignItems: "center", justifyContent: "center" }) };
    const nom = k.col([tx(k, "Communauté des Trois-Vallées", { fontFamily: S.head, fontWeight: "700", fontSize: "24px", lineHeight: 1.15, color: S.fg }, { fontSize: "22px" }), tx(k, "Services publics intercommunaux", { fontSize: "14px", color: S.mute, lineHeight: 1.4 })], { gap: "4px" });
    const marque = k.row([embleme, nom], { gap: "16px", flexWrap: "nowrap", alignItems: "center" });
    const bloc = (titre, ...contenu) => k.col([cap(k, titre, { taille: "11px" }), ...contenu], { gap: "4px", flexBasis: "0px", flexGrow: 1, minWidth: "200px", paddingTop: "4px", paddingBottom: "4px" });
    const acces = k.row([
      bloc("Confort de lecture", tx(k, "Agrandir le texte : touches Ctrl (ou Cmd) et +", { fontSize: "14px", lineHeight: 1.4, color: S.fg })),
      bloc("Un obstacle à l'accès ?", lien(k, G, "Signaler un problème d'accessibilité", "/contact", { taille: 14, couleur: S.accent, poids: "600" })),
      bloc("Langue du site", tx(k, "Français", { fontSize: "14px", lineHeight: 1.4, color: S.fg })),
    ], { gap: "16px 28px", alignItems: "flex-start", flexGrow: 1, flexBasis: "0px", minWidth: "320px", backgroundColor: blanc, borderStyle: "solid", borderWidth: "1px", borderColor: S.line, paddingTop: "14px", paddingBottom: "14px", paddingLeft: "20px", paddingRight: "20px", maxWidth: "720px" });
    acces.styles.desktop.rowGap = "16px"; acces.styles.desktop.columnGap = "28px"; delete acces.styles.desktop.gap;
    const barre = G.bande(k, [marque, acces], { fond: S.alt, padV: ["28px", "24px", "24px"], padH: ["48px", "32px", "20px"], max: "1280px", aligne: "center", gap: "20px 40px", nom: "Identité et accessibilité" });

    // 2 · l'annuaire : 5 groupes ; sur mobile ils deviennent des volets repliables de 44 px (mécanisme du moteur)
    const L = (liste) => liste.map(([l, u]) => () => lien(k, G, l, u, { taille: 14, pv: "5px", lh: 1.35 }));
    const widget = (type, props, st = {}) => () => k.W(type, props, { color: S.fg, fontSize: "14px", lineHeight: 1.5, ...st });
    const volets = Moteur.accordionNode(k, env, false, [
      { title: "Démarches", w: 1, codes: L([["Contact", "/contact"], ["Questions fréquentes", "/faq"], ["Créer un compte", "/inscription"], ["Se connecter", "/connexion"], ["Gestion des cookies", "/cookies"], ["Accueil du site", "/"]]) },
      { title: "Services", w: 1, codes: L([["Catalogue des services", "/catalogue"], ["Boutique en ligne", "/boutique"], ["Mon panier", "/boutique/panier"], ["Mon espace", "/boutique/compte"], ["Mes favoris", "/boutique/souhaits"]]) },
      { title: "Actualités", w: 1, codes: [...L([["Toutes les actualités", "/blog"]]), widget("querylist", { title: "", source: "posts", mode: "recent", count: 4, layout: "compact", showImage: false, showDate: true, empty: "Les articles apparaîtront ici." })] },
      { title: "Rubriques", w: 1, codes: [widget("querylist", { title: "", source: "categories", mode: "popular", count: 6, layout: "list", showCount: false, empty: "Les rubriques apparaîtront ici." })] },
      { title: "Plan du site", w: 1, codes: [widget("sitemap", { label: "Plan du site", pages: true, articles: false, courses: false, columns: "1", max: 6 })] },
    ], {}, { min: "170px" });
    for (const c of volets.children) { // titre de groupe : filet bleu de 2 px au-dessus (ordinateur et tablette), police Atkinson
      Object.assign(c.styles.desktop, { borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: S.accent, paddingTop: "14px", color: S.fg, fontFamily: S.head, gap: "2px" });
      c.styles.mobile = { borderTopWidth: "0px", paddingTop: "0px" };
    }
    Object.assign(volets.styles.desktop, { columnGap: "32px", rowGap: "32px", alignItems: "flex-start" });
    const annuaire = G.bande(k, [volets], { fond: S.bg, padV: ["56px", "48px", "28px"], padB: ["40px", "36px", "36px"], padH: ["48px", "32px", "20px"], max: "1280px", colonne: true, nom: "Annuaire" });

    // 3 · coordonnées et horaires, puis la ligne légale avec le retour en haut
    const coord = k.col([G.code("contact|Nous joindre")(k, env)], { flexBasis: "0px", flexGrow: 1, minWidth: "260px" });
    const heures = k.col([G.code("hours|Horaires d'accueil")(k, env)], { flexBasis: "0px", flexGrow: 1, minWidth: "260px" });
    for (const w of [coord.children[0], heures.children[0]]) Moteur.mergePart(w, "title", { styles: { desktop: { fontFamily: S.head, fontSize: "18px", fontWeight: "700", color: S.fg, marginBottom: "8px" } } });
    const infos = k.row([coord, heures], { rowGap: "28px", columnGap: "48px", alignItems: "flex-start", width: "100%" });
    const mentions = k.row([G.ligneLegale({ taille: 12, sansCookies: true })(k, env), G.code("top")(k, env)], { rowGap: "12px", columnGap: "28px", alignItems: "center", justifyContent: "space-between", width: "100%" });
    const bas = G.bande(k, [infos, filetH(k, S.line), mentions], { fond: S.bg, colonne: true, gap: "28px", padV: ["16px", "16px", "8px"], padB: ["24px", "24px", "20px"], padH: ["48px", "32px", "20px"], max: "1280px", filetHaut: { epaisseur: "1px", couleur: S.line }, nom: "Contact et mentions" });
    return [G.racine(k, [barre, annuaire, bas])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-003 « Colophon du Cabinet » — « Maréchal & Associés » (fictif). Le pied est rédigé comme la dernière page d'un livre : une phrase de colophon justifiée, des notes en marge (appels en exposant),
// un double filet. Papier #fbf8f2, encre chaude #1e1b16, rouge brique #8a3b2a. Newsreader (texte de colophon) + Work Sans.
const colophonId = identite({
  key: "c003", label: "Papier et rouge brique", humeur: "light",
  fond: "#fbf8f2", texte: "#1e1b16", discret: "#5e574b", accent: "#8a3b2a", surface: "#ede6d8",
  police: "font.work-sans", titres: "font.newsreader", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#c4b9a4", casse: "none", suivi: "0px",
});
const colophon = modeleV2({
  id: identifiantV2(3, "colophon-du-cabinet"), concept: "c-003-colophon-du-cabinet", name: "Colophon du cabinet", family: FAM,
  description: "Le pied se lit comme la dernière page d'un livre : un colophon justifié en grand corps serif, des notes de marge numérotées, le double filet de l'imprimeur. Papier chaud, encre brune, un seul rouge brique pour les renvois.",
  tags: ["cabinet", "colophon", "serif", "papier", "notes de marge", "sobre"],
  identity: colophonId,
  racine: racineDe("#fbf8f2"),
  widgets: ["text", "bizcontact", "link", "copyright", "bizlegal", "divider", "stack"],
  compose(k, env, G) {
    const S = k.S;
    const exp = (n) => `<sup><span style="color:${S.accent}">${n}</span></sup>`;
    // 1 · l'en-tête : nom du cabinet en italique serif, filet double dessous (deux traits de 1 px à 3 px d'écart)
    const nom = tx(k, "Maréchal &amp; Associés", { fontFamily: S.head, fontStyle: "italic", fontWeight: "500", fontSize: "fluid:28-40", lineHeight: 1.1, color: S.fg, letterSpacing: "-0.01em" });
    const sous = cap(k, "Cabinet de conseil en droit et en finance (exemple)", { suivi: "0.16em" });
    const entete = k.row([nom, sous], { rowGap: "6px", columnGap: "32px", alignItems: "baseline", justifyContent: "space-between", width: "100%" });
    const doubleFilet = k.col([filetH(k, S.fg, "1px"), filetH(k, S.fg, "1px")], { gap: "3px", width: "100%" });
    // 2 · les trois zones : associés (marge gauche), colophon (centre, 5/12), notes de marge (droite, 3/12)
    const associes = k.col([cap(k, "Les associés (exemple)", { couleur: S.accent }), k.col(["Hélène Maréchal", "Antoine Villard", "Sophie Aubrac"].map((n) => tx(k, n, { fontFamily: S.head, fontSize: "18px", lineHeight: 1.35, color: S.fg })), { gap: "2px" }),
      cap(k, "Domaines", { couleur: S.accent }), tx(k, "Sociétés · Fiscalité · Transmission", { fontSize: "14px", lineHeight: 1.7, color: S.mute })], { gap: "14px", flexBasis: "0px", flexGrow: 3, minWidth: "220px" });
    const texteColophon = tx(k, `<p>Ce site a été composé en Newsreader et en Work Sans${exp(1)}, mis en pages par le cabinet et publié avec le Theme Builder de Kolakisa. Chaque dossier y est traité comme une page de livre : sobrement, sans bruit, et jusqu'à la dernière ligne${exp(2)}.</p>`,
      { fontFamily: S.head, fontWeight: "400", fontSize: "fluid:20-25", lineHeight: 1.5, color: S.fg, textAlign: "justify", textWrap: "pretty" }, { fontSize: "fluid:21-24" });
    const centre = k.col([cap(k, "Colophon", { couleur: S.accent, suivi: "0.22em" }), filetH(k, S.accent, "2px", { width: "40px" }), texteColophon], { gap: "18px", flexBasis: "0px", flexGrow: 6, minWidth: "300px" });
    const note = (n, t) => k.row([tx(k, `<strong>${n}</strong>`, { color: S.accent, fontSize: "13px", lineHeight: 1.6, fontFamily: S.head, minWidth: "14px" }), tx(k, t, { fontSize: "13px", lineHeight: 1.6, color: S.mute })], { gap: "8px", flexWrap: "nowrap", alignItems: "flex-start" });
    const marge = k.col([cap(k, "En marge"), note("1", "Deux familles de polices libres, hébergées avec le site : rien n'est chargé depuis l'extérieur."), note("2", "Le détail de l'usage de vos données se trouve dans la politique de confidentialité.")],
      { gap: "12px", flexBasis: "0px", flexGrow: 3, minWidth: "220px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: S.line, paddingLeft: "24px" }, { borderLeftWidth: "0px", paddingLeft: "0px", borderTopWidth: "1px", paddingTop: "20px", flexBasis: "100%" }, { borderLeftWidth: "0px", paddingLeft: "0px", borderTopWidth: "1px", paddingTop: "20px" });
    const corps = k.row([associes, centre, marge], { rowGap: "40px", columnGap: "56px", alignItems: "flex-start", width: "100%" });
    // 3 · adresse, trois liens, réseaux « Nom ↗ », mentions
    const adresse = k.col([G.code("contact|Adresse")(k, env)], { flexBasis: "0px", flexGrow: 3, minWidth: "220px" });
    Moteur.mergePart(adresse.children[0], "title", { styles: { desktop: { fontFamily: S.font, fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.14em", color: S.accent, marginBottom: "10px" } } });
    const liens3 = k.col([cap(k, "Pour nous écrire", { couleur: S.accent }), groupeLiens(k, G, [["Contact", "/contact"], ["Questions fréquentes", "/faq"], ["Actualités du cabinet", "/blog"]], { gap: "4px", lien: { taille: 15, lh: 1.5 } })], { gap: "10px", flexBasis: "0px", flexGrow: 5, minWidth: "260px" });
    const reseaux = k.col([cap(k, "Nous suivre", { couleur: S.accent }), k.col([["LinkedIn ↗", "https://www.linkedin.com/"], ["YouTube ↗", "https://www.youtube.com/"]].map(([l, u]) => lien(k, G, l, u, { taille: 15, lh: 1.5 })), { gap: "4px" })], { gap: "10px", flexBasis: "0px", flexGrow: 3, minWidth: "220px" });
    const pied = k.row([adresse, liens3, reseaux], { rowGap: "28px", columnGap: "56px", alignItems: "flex-start", width: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [entete, doubleFilet, corps, doubleFilet, pied, mentions], { colonne: true, gap: "36px", padV: ["88px", "72px", "52px"], padB: ["40px", "36px", "32px"], padH: ["48px", "32px", "20px"], max: "1180px", fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Colophon" });
    return [G.racine(k, [bande])];
  },
}, FAM);


// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-004 « Usine et Plan » — industriel fictif « Ferroval ». Jaune de sécurité et noir, comme un panneau de chantier : une bande noire « Demander un devis » en nom monumental, puis un tableau des sites (exemples)
// numérotés comme les lignes d'un plan, un menu numéroté et les contacts. Barlow Condensed (titres, 800) + Barlow. Pas d'image : filets de 2 px, repères carrés et tableau (le quadrillage millimétré du concept
// demande un fond répété que la grammaire du Page Builder ne permet pas : il est remplacé par les filets et les repères).
const ferrovalId = identite({
  key: "c004", label: "Jaune sécurité et noir", humeur: "light",
  fond: "#ffd21f", texte: "#111111", discret: "#3a3a3a", accent: "#111111", surface: "#ffe680",
  police: "font.barlow", titres: "font.barlow-condensed", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "2px", ligne: "#111111", casse: "none", suivi: "0px",
});
const ferroval = modeleV2({
  id: identifiantV2(4, "usine-et-plan"), concept: "c-004-usine-et-plan", name: "Usine et plan", family: FAM,
  description: "Jaune de sécurité et noir : une bande noire « Demander un devis » en lettres monumentales, puis un tableau de sites d'exemple numérotés comme un plan, un menu numéroté et les contacts. Dense, franc, très lisible.",
  tags: ["industrie", "devis", "tableau", "jaune", "noir", "plan", "B2B"],
  identity: ferrovalId,
  racine: racineDe("#ffe680"),
  widgets: ["text", "button", "grid", "bizcontact", "social", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, NOIR = "#111111", JAUNE = "#ffd21f", PALE = "#ffe680";
    // 1 · LA BANDE NOIRE : nom monumental sur deux lignes (Barlow Condensed 800, jusqu'à 190 px) + bouton jaune
    const Sn = { ...S, bg: NOIR, fg: "#fffbe6", mute: "#dcd7c2", alt: "#1f1f1f", accent: JAUNE, onAccent: NOIR, line: "#ffffff40" };
    const kn = kit(Sn);
    const geant = tx(kn, `<p>DEMANDER<br>UN&nbsp;DEVIS</p>`, { fontFamily: S.head, fontWeight: "800", fontSize: "fluid:72-190", lineHeight: 0.86, letterSpacing: "0px", color: JAUNE, textTransform: "uppercase" }, { fontSize: "fluid:130-190" });
    const etiquette = k => cap(k, "Atelier · Usine · Chantier", { couleur: JAUNE, suivi: "0.24em", police: S.head, poids: "400", taille: "16px" });
    const bouton = kn.B("Écrire à l'atelier", "/contact", "solid", { backgroundColor: JAUNE, color: NOIR, fontFamily: S.head, fontWeight: "800", fontSize: "22px", textTransform: "uppercase", letterSpacing: "0.06em", minHeight: "64px", paddingLeft: "40px", paddingRight: "40px", borderRadius: "0px", borderWidth: "2px", borderStyle: "solid", borderColor: JAUNE });
    Moteur.finishNode(Sn, bouton);
    const consigne = tx(kn, "Décrivez votre pièce ou votre chantier : plans, matière, quantité.", { fontSize: "17px", lineHeight: 1.5, color: Sn.fg, maxWidth: "380px" });
    const droite = kn.col([consigne, bouton], { gap: "22px", alignItems: "flex-start", flexBasis: "0px", flexGrow: 1, minWidth: "260px", maxWidth: "420px", paddingBottom: "8px" }, { flexBasis: "100%", maxWidth: "560px" });
    const gauche = kn.col([etiquette(kn), geant], { gap: "18px", flexBasis: "0px", flexGrow: 3, minWidth: "300px" }, { flexBasis: "100%" });
    const noire = G.bande(k, [gauche, droite], { fond: NOIR, padV: ["72px", "56px", "44px"], padB: ["64px", "52px", "44px"], padH: ["48px", "32px", "20px"], max: "1280px", aligne: "flex-end", gap: "36px 56px", nom: "Devis" });

    // 2 · LE TABLEAU DES SITES (exemples), le menu numéroté, les contacts ; en-têtes « repère de plan » : carré noir + libellé + filet de 2 px
    const entete = (t) => k.col([k.row([carre(k, "12px", S.fg), cap(k, t, { couleur: S.fg, poids: "700", suivi: "0.1em", police: S.head, taille: "17px" })], { gap: "10px", flexWrap: "nowrap", alignItems: "center" }), filetH(k, S.fg, "2px")], { gap: "10px", width: "100%" });
    const ligneSite = (ref, site, spec) => ({ type: "grid", children: [
      tx(k, ref, { fontFamily: S.head, fontWeight: "800", fontSize: "22px", lineHeight: 1, color: JAUNE, backgroundColor: NOIR, paddingTop: "8px", paddingBottom: "7px", textAlign: "center" }),
      tx(k, site, { fontFamily: S.head, fontWeight: "700", fontSize: "24px", lineHeight: 1.1, textTransform: "uppercase", color: S.fg }),
      tx(k, spec, { fontSize: "16px", lineHeight: 1.35, color: S.fg }, undefined, { gridColumnSpan: 2, paddingLeft: "0px" })],
    ...sty({ gridTemplate: "64px 1fr 1.5fr", columnGap: "16px", alignItems: "center", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: S.fg, paddingTop: "14px", paddingBottom: "14px", width: "100%" }, { gridTemplate: "64px 1fr 1.5fr" }, { gridTemplate: "56px 1fr", rowGap: "8px" }) });
    const enTete = { type: "grid", children: [cap(k, "Ligne", { couleur: S.fg, police: S.head, poids: "400", taille: "14px" }), cap(k, "Site", { couleur: S.fg, police: S.head, poids: "400", taille: "14px" }), cap(k, "Spécialité", { couleur: S.fg, police: S.head, poids: "400", taille: "14px" })], hideOn: ["mobile"], ...sty({ gridTemplate: "64px 1fr 1.5fr", columnGap: "16px", width: "100%" }, { gridTemplate: "64px 1fr 1.5fr" }) };
    const tableau = k.col([entete("Nos sites (exemple)"), enTete, ligneSite("L1", "Lyon", "Chaudronnerie et tôlerie fine"), ligneSite("L2", "Metz", "Usinage de précision"), ligneSite("L3", "Nantes", "Maintenance sur site"),
      tx(k, "Sites et spécialités d'exemple : à remplacer par les vôtres.", { fontSize: "13px", lineHeight: 1.4, color: S.mute })], { gap: "12px", gridColumnSpan: 1 }, { gridColumnSpan: 2 });
    const menuLigne = (n, l, u) => k.row([tx(k, n, { fontFamily: S.head, fontWeight: "800", fontSize: "14px", color: S.fg, minWidth: "26px" }), lien(k, G, l, u, { taille: 24, poids: "700", police: S.head, casse: "uppercase", lh: 1.1, pv: "6px", survol: S.fg })], { gap: "8px", flexWrap: "nowrap", alignItems: "center" });
    const menu = k.col([entete("Navigation"), k.col([menuLigne("01", "Accueil", "/"), menuLigne("02", "Actualités", "/blog"), menuLigne("03", "Questions fréquentes", "/faq"), menuLigne("04", "Contact", "/contact"), menuLigne("05", "Espace client", "/connexion")], { gap: "2px" })], { gap: "16px" });
    const reseaux = k.social([{ network: "linkedin", url: "https://www.linkedin.com/" }, { network: "youtube", url: "https://www.youtube.com/" }, { network: "facebook", url: "https://www.facebook.com/" }], { gap: "8px" });
    reseaux.props.shape = "square"; reseaux.props.size = "48";
    Moteur.finishNode(S, reseaux);
    Moteur.mergePart(reseaux, "link", { styles: { desktop: { backgroundColor: NOIR, color: JAUNE, borderRadius: "0px" } }, states: { hover: { backgroundColor: PALE, color: NOIR }, focus: G.focus(NOIR) } });
    const coord = G.code("contact|")(k, env);
    const contacts = k.col([entete("Joindre un site"), coord, reseaux], { gap: "16px" });
    const principale = G.bande(k, [{ type: "grid", children: [tableau, menu, contacts], ...sty({ gridTemplate: "1.9fr 1fr 1.1fr", columnGap: "48px", rowGap: "40px", alignItems: "flex-start", width: "100%" }, { gridTemplate: "1fr 1fr", columnGap: "32px" }, { gridTemplate: "1fr", rowGap: "36px" }) }],
      { fond: S.bg, colonne: true, padV: ["64px", "56px", "44px"], padB: ["56px", "48px", "40px"], padH: ["48px", "32px", "20px"], max: "1280px", nom: "Sites et contacts" });

    // 3 · la bande légale, jaune clair
    const legale = G.bande(k, [G.ligneLegale({ taille: 13, sansCookies: true, liens: S.fg })(k, env)], { fond: PALE, colonne: true, padV: ["22px", "20px", "18px"], padB: ["26px", "24px", "22px"], padH: ["48px", "32px", "20px"], max: "1280px", filetHaut: { epaisseur: "2px", couleur: NOIR }, nom: "Mentions" });
    return [G.racine(k, [noire, principale, legale])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-005 « Chancellerie » — cabinet d'avocats fictif « Maître & Fils ». Un double cadre laiton isole le pied du reste de la page comme un acte encadré ; blason typographique au centre, majuscules espacées,
// mentions réglementaires en bonne place. Bordeaux #2a1215, crème #f3e9dc, laiton #c9a55c. Cormorant Garamond (monogramme, 600) + Lato.
const chancelId = identite({
  key: "c005", label: "Bordeaux, crème et laiton", humeur: "dark",
  fond: "#2a1215", texte: "#f3e9dc", discret: "#c9b79e", accent: "#c9a55c", surface: "#3a1b1f",
  police: "font.lato", titres: "font.cormorant-garamond", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#c9a55c66",
});
const chancellerie = modeleV2({
  id: identifiantV2(5, "chancellerie"), concept: "c-005-chancellerie", name: "Chancellerie", family: FAM,
  description: "Un double cadre laiton entoure tout le pied, comme un acte encadré : un blason typographique « M & F » au centre, un menu en majuscules espacées, l'adresse et les mentions réglementaires. Bordeaux, crème et laiton.",
  tags: ["avocats", "cadre", "laiton", "bordeaux", "serif", "institutionnel", "centré"],
  identity: chancelId,
  racine: racineDe("#2a1215"),
  widgets: ["text", "link", "bizcontact", "bizlegal", "copyright", "divider", "stack"],
  compose(k, env, G) {
    const S = k.S;
    // ornement : deux filets fins de 1 px autour d'un losange (carré pivoté à 45°)
    const losange = { type: "container", children: [], ...sty({ width: "10px", height: "10px", minWidth: "10px", borderStyle: "solid", borderWidth: "1px", borderColor: S.accent, transform: { rotate: 45 } }) };
    const ornement = () => k.row([k.divider({ width: "88px", borderColor: S.accent, borderTopWidth: "1px", marginTop: "0px", marginBottom: "0px" }), losange, k.divider({ width: "88px", borderColor: S.accent, borderTopWidth: "1px", marginTop: "0px", marginBottom: "0px" })], { gap: "18px", flexWrap: "nowrap", justifyContent: "center" });
    const monogramme = tx(k, `<p>M <span style="color:${S.fg}">&amp;</span> F</p>`, { fontFamily: S.head, fontWeight: "600", fontSize: "fluid:84-132", lineHeight: 0.95, letterSpacing: "0.04em", color: S.accent, textAlign: "center" });
    const nom = cap(k, "Maître &amp; Fils", { couleur: S.fg, suivi: "0.42em", taille: "14px", poids: "700", align: "center" });
    const sous = tx(k, "Cabinet d'avocats (exemple)", { fontFamily: S.head, fontStyle: "italic", fontSize: "20px", lineHeight: 1.3, color: S.mute, textAlign: "center" });
    const menu = k.row([["Le cabinet", "/"], ["Actualités", "/blog"], ["Questions", "/faq"], ["Contact", "/contact"], ["Espace client", "/connexion"]].map(([l, u]) => lien(k, G, l, u, { taille: 13, poids: "600", casse: "uppercase", suivi: "0.2em", pv: "6px", survol: S.fg })),
      { rowGap: "2px", columnGap: "36px", justifyContent: "center", alignItems: "center" }, undefined, { columnGap: "26px" });
    // les listes des widgets sont alignées à gauche quand elles passent à la ligne : sur mobile on prend la version « colonne » dont chaque ligne est centrée (version « sur une ligne » masquée sur mobile)
    const centre = (w, cacher) => { Moteur.mergePart(w, "item", { styles: { desktop: { justifyContent: "center", textAlign: "center" } } }); w.hideOn = cacher; w.styles.desktop.textAlign = "center"; return w; };
    const pages = (layout) => Moteur.finishNode(S, k.W("bizlegal", { title: "", showName: false, showForm: false, showRegistrations: false, showPublisher: false, showHost: false, showPages: true, layout, hintMissing: true }, { color: S.fg, fontSize: "12px", fontFamily: S.font }));
    const coord = k.col([centre(G.code("contact:inline|")(k, env, true), ["mobile"]), centre(G.code("contact:stack|")(k, env, true), ["desktop", "tablet"])], { alignItems: "stretch", textAlign: "center", width: "100%", gap: "0px" });
    const reglement = k.col([centre(G.code("legalinfo:inline")(k, env, true), ["mobile"]), centre(G.code("legalinfo:stack")(k, env, true), ["desktop", "tablet"])], { alignItems: "stretch", textAlign: "center", width: "100%", gap: "0px" });
    const copie = k.W("copyright", { owner: "{{business.legalname}}", text: "Tous droits réservés." }, { color: S.mute, fontSize: "12px", fontFamily: S.font, textAlign: "center" });
    const mentions = k.row([copie, centre(pages("inline"), ["mobile"]), centre(pages("stack"), ["desktop", "tablet"])], { rowGap: "12px", columnGap: "28px", alignItems: "center", justifyContent: "center", width: "100%" });
    const cadre = k.col([ornement(), monogramme, nom, sous, ornement(), menu, coord, reglement, mentions],
      { borderStyle: "double", borderWidth: "6px", borderColor: S.accent, paddingTop: "72px", paddingBottom: "48px", paddingLeft: "56px", paddingRight: "56px", gap: "26px", alignItems: "center", textAlign: "center", width: "100%" },
      { paddingTop: "56px", paddingLeft: "36px", paddingRight: "36px" }, { paddingTop: "44px", paddingBottom: "32px", paddingLeft: "18px", paddingRight: "18px", gap: "22px" });
    return [G.racine(k, [G.bande(k, [cadre], { colonne: true, padV: ["64px", "48px", "32px"], padB: ["56px", "44px", "28px"], padH: ["48px", "32px", "16px"], max: "1120px", fond: S.bg, nom: "Cadre" })])];
  },
}, FAM);


// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-006 « Agora en Tuiles » — mairie fictive « Val-de-Rive ». Une mosaïque de sept tuiles blanches à coins de 20 px sur fond bleu pâle, une tuile par besoin : démarches (grande), horaires avec pastille
// « ouvert / fermé » calculée sur l'heure réelle (widget Horaires existant), signalement, actualités, adresse, réseaux, lettre d'information. Grandes cibles tactiles. Lexend (titres) + Atkinson Hyperlegible.
const agoraId = identite({
  key: "c006", label: "Bleu pâle et tuiles blanches", humeur: "light",
  fond: "#eef3fb", texte: "#17233a", discret: "#4a5a75", accent: "#3558d0", surface: "#ffffff", // #3558d0 : le #3d63dd du concept passe à 4,21:1 sur les disques pastel (< 4,5) ; légèrement assombri
  
  police: "font.atkinson-hyperlegible", titres: "font.lexend", rayon: "20px", rayonBouton: "999px", ombre: "none", poids: "600", bordure: "1px", ligne: "#d3ddf0",
});
const agora = modeleV2({
  id: identifiantV2(6, "agora-en-tuiles"), concept: "c-006-agora-en-tuiles", name: "Agora en tuiles", family: FAM,
  description: "Une mosaïque de tuiles blanches aux coins arrondis sur un fond bleu pâle : démarches, horaires avec pastille ouvert ou fermé, signalement, actualités, adresse, réseaux et lettre d'information. Grandes cibles, lisible par tous.",
  tags: ["mairie", "tuiles", "bento", "collectivité", "accessible", "bleu pâle"],
  identity: agoraId,
  racine: racineDe("#eef3fb"),
  widgets: ["text", "link", "icon", "grid", "bizhours", "bizphone", "bizcontact", "querylist", "emailsubscribe", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, BLANC = "#ffffff", PASTEL = "#dfe7fb";
    const pictogramme = (nom) => ({ type: "container", children: [{ type: "icon", props: { name: nom, size: "24", label: "" }, ...sty({ color: S.accent }) }], ...sty({ width: "52px", height: "52px", minWidth: "52px", borderRadius: "999px", backgroundColor: PASTEL, display: "flex", alignItems: "center", justifyContent: "center" }) });
    const titre = (t, o = {}) => tx(k, t, { fontFamily: S.head, fontWeight: "600", fontSize: o.taille || "22px", lineHeight: 1.2, letterSpacing: "-0.01em", color: o.couleur || S.fg }, undefined, o.mobile);
    const tuile = (enfants, st = {}, t, m) => k.col(enfants, { backgroundColor: BLANC, borderRadius: "20px", borderStyle: "solid", borderWidth: "1px", borderColor: S.line, paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", gap: "14px", alignItems: "flex-start", minWidth: "0px", ...st }, t, { paddingTop: "20px", paddingBottom: "20px", paddingLeft: "18px", paddingRight: "18px", ...(m || {}) });
    const lienTuile = (l, u, o = {}) => lien(k, G, l, u, { taille: 16, poids: "600", lh: 1.3, pv: "4px", ...o });
    // 1 · en-tête : nom de la mairie fictive
    const marque = k.row([tx(k, "Val-de-Rive", { fontFamily: S.head, fontWeight: "700", fontSize: "28px", lineHeight: 1.1, color: S.fg, letterSpacing: "-0.02em" }), G.pastille("Mairie", { fond: S.accent, couleur: S.onAccent })(k)], { gap: "14px", alignItems: "center" });
    // 2 · les tuiles
    const rangee = (l, u) => k.row([lienTuile(l, u, { taille: 18, extra: { flexGrow: 1, minHeight: "52px" } }), { type: "icon", props: { name: "arrowRight", size: "24", label: "" }, ...sty({ color: S.accent, flexShrink: 0 }) }],
      { gap: "12px", flexWrap: "nowrap", alignItems: "center", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: S.line });
    const demarches = tuile([pictogramme("fileText"), titre("Vos démarches", { taille: "fluid:24-32" }), k.col([rangee("Contacter la mairie", "/contact"), rangee("Questions fréquentes", "/faq"), rangee("Créer mon compte", "/inscription"), rangee("Accéder à mon espace", "/connexion"), rangee("Lire les actualités", "/blog")], { gap: "0px", width: "100%" }),
      k.col([titre("Besoin d'un coup de main ?", { taille: "18px" }), tx(k, "L'accueil vous accompagne pour toute démarche, en ligne ou sur place.", { fontSize: "15px", lineHeight: 1.45, color: S.mute }), lienTuile("Contacter l'accueil", "/contact", { couleur: S.accent })], { backgroundColor: "#eef3fb", borderRadius: "14px", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "22px", paddingRight: "22px", gap: "8px", width: "100%", marginTop: "auto" })],
      { gridColumnSpan: 2, gridRowSpan: 2, gap: "18px" }, { gridColumnSpan: 2, gridRowSpan: 1 }, { gridColumnSpan: 2, gridRowSpan: 1 });
    const heures = G.code("hours|-")(k, env);
    Moteur.mergePart(heures, "status", { styles: { desktop: { fontFamily: S.font, fontSize: "15px", fontWeight: "700", color: S.fg } } });
    heures.styles.desktop.fontSize = "15px";
    const horaires = tuile([pictogramme("clock"), titre("Horaires de l'accueil"), heures, lienTuile("Une question ? Contactez l'accueil", "/contact", { couleur: S.accent })], { gap: "12px" }, undefined, { gridColumnSpan: 2 });
    const phone = k.W("bizphone", { which: "1", prefix: "", showLabel: false, showIcon: false }, { color: "#ffffff", fontFamily: S.head, fontWeight: "600", fontSize: "22px", lineHeight: 1.2 });
    Moteur.finishNode({ ...S, bg: S.accent, fg: "#ffffff", accent: "#ffffff" }, phone);
    const urgence = tuile([{ type: "container", children: [{ type: "icon", props: { name: "alertTriangle", size: "24", label: "" }, ...sty({ color: "#ffffff" }) }], ...sty({ width: "52px", height: "52px", minWidth: "52px", borderRadius: "999px", backgroundColor: "#ffffff33", display: "flex", alignItems: "center", justifyContent: "center" }) },
      titre("Une urgence ?", { couleur: "#ffffff" }), tx(k, "Écrivez à l'accueil ou appelez-le. Pour une urgence vitale, composez le numéro d'urgence de votre pays.", { fontSize: "15px", lineHeight: 1.45, color: "#ffffff" }), phone,
      lien(k, G, "Écrire à l'accueil", "/contact", { taille: 16, couleur: "#ffffff", survol: "#ffffff", poids: "700", extra: { textDecoration: "underline" } })],
      { backgroundColor: S.accent, borderColor: S.accent, gap: "12px" }, undefined, { gridColumnSpan: 2, order: -1 });
    const actus = G.code("recent:3")(k, env); actus.styles.desktop.fontSize = "15px";
    const actualites = tuile([pictogramme("bell"), titre("À la une", { taille: "22px" }), actus, lienTuile("Toutes les actualités", "/blog", { couleur: S.accent })], { gridColumnSpan: 2 }, undefined, { gridColumnSpan: 2 });
    const adr = G.code("contact:stack|")(k, env); adr.styles.desktop.fontSize = "15px";
    const adresse = tuile([pictogramme("mapPin"), titre("Nous trouver"), adr, lienTuile("Page Contact", "/contact", { couleur: S.accent })], {}, undefined, { gridColumnSpan: 2 });
    const reseaux = k.social([{ network: "facebook", url: "https://www.facebook.com/" }, { network: "instagram", url: "https://www.instagram.com/" }, { network: "youtube", url: "https://www.youtube.com/" }], { gap: "10px" });
    reseaux.props.size = "48"; reseaux.props.shape = "circle";
    Moteur.finishNode(S, reseaux);
    Moteur.mergePart(reseaux, "link", { styles: { desktop: { backgroundColor: PASTEL, color: S.accent } } });
    const suivre = tuile([pictogramme("users"), titre("Nous suivre"), reseaux], {}, undefined, { gridColumnSpan: 2 });
    const abo = G.abonnement({ titre: "", intro: "Les rendez-vous et les décisions de la commune, par e-mail.", bouton: "S'abonner", largeur: "100%", soulignement: "0px", fondChamp: "#eef3fb", rayonChamp: "999px", rayonBouton: "999px", styleTitre: { display: "none" } })(k, env);
    const lettre = tuile([pictogramme("mail"), titre("La lettre de la commune"), abo], { gridColumnSpan: 2 }, undefined, { gridColumnSpan: 2 });
    const mosaique = grille(k, [demarches, horaires, urgence, actualites, adresse, suivre, lettre], [4, 2, 2], { gap: "16px", alignItems: "stretch" }, { gap: "16px" }, { gap: "12px" });
    const bande = G.bande(k, [marque, mosaique, G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { colonne: true, gap: "28px", fond: S.bg, padV: ["72px", "56px", "36px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "16px"], max: "1280px", nom: "Mosaïque" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-007 « Pacte en Deux » — société à mission fictive « Terrane ». Le pied est coupé net en deux moitiés : à gauche l'aplat vert forêt avec la promesse en grand (Fraunces 700), l'adresse e-mail en très grand corps et
// le bouton ambré ; à droite l'aplat crème avec la navigation, la lettre d'information sur une ligne et les réseaux en pastilles. Sur mobile la coupe devient horizontale. Vert #1f4d3a, crème #f6f0e4, ambre #e0a526.
const pacteId = identite({
  key: "c007", label: "Vert forêt, crème et ambre", humeur: "dark",
  fond: "#1f4d3a", texte: "#f6f0e4", discret: "#cfe0d4", accent: "#e8ad2e", surface: "#163a2b", // ambre éclairci (#e0a526 du concept : 4,39:1 sur le vert, < 4,5) pour le texte ambré
  
  police: "font.albert-sans", titres: "font.fraunces", // Albert Sans remplace Figtree du concept (même esprit, sans empattement humaniste) : Figtree est aussi la police du site d'essai des tests, ce qui fausse le test de chargement des polices
   rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#ffffff40",
});
const pacte = modeleV2({
  id: identifiantV2(7, "pacte-en-deux"), concept: "c-007-pacte-en-deux", name: "Pacte en deux", family: FAM,
  description: "Le pied est coupé en deux moitiés nettes : un aplat vert forêt porte la promesse en grand serif, l'adresse e-mail géante et le bouton ambré ; un aplat crème porte la navigation, la lettre d'information et les réseaux.",
  tags: ["société à mission", "RSE", "deux moitiés", "vert", "crème", "serif"],
  identity: pacteId,
  racine: racineDe("#163a2b"),
  widgets: ["text", "button", "bizemail", "link", "emailsubscribe", "copyright", "bizlegal", "stack"],
  compose(k, env, G) {
    const S = k.S, CREME = "#f6f0e4", INK = "#14281d", VERT = "#1f4d3a";
    const Sc = { ...S, bg: CREME, fg: INK, mute: "#44574b", alt: "#ffffff", accent: VERT, onAccent: CREME, line: "#b4c4b8" };
    const kc = kit(Sc);
    // moitié gauche : feuille (SVG de ligne, ornement non décoratif seulement par sa forme), marque, promesse, e-mail géant, bouton
    const feuille = { type: "container", children: [], ...sty({ width: "34px", height: "34px", minWidth: "34px", borderStyle: "solid", borderWidth: "2.5px", borderColor: S.accent, borderTopLeftRadius: "0px", borderTopRightRadius: "34px", borderBottomRightRadius: "0px", borderBottomLeftRadius: "34px" }) }; // feuille de contour : un carré aux coins opposés arrondis
    const marque = k.row([feuille, cap(k, "Terrane", { couleur: S.fg, suivi: "0.3em", poids: "700", taille: "14px" })], { gap: "14px", alignItems: "center", flexWrap: "nowrap" });
    const promesse = tx(k, "Ce que nous bâtissons doit durer plus longtemps que nous.", { fontFamily: S.head, fontWeight: "700", fontSize: "fluid:34-60", lineHeight: 1.08, letterSpacing: "-0.02em", color: S.fg });
    const courriel = G.code("email")(k, env);
    courriel.props.showIcon = false;
    Object.assign(courriel.styles.desktop, { fontFamily: S.head, fontWeight: "600", fontSize: "fluid:19-34", lineHeight: 1.2, color: S.accent });
    Moteur.mergePart(courriel, "link", { styles: { desktop: { color: S.accent, fontFamily: S.head, textDecoration: "underline" } }, states: { hover: { color: S.fg }, focus: G.focus(S.fg) } });
    const bouton = k.B("Prendre contact", "/contact", "solid", { backgroundColor: S.accent, color: S.onAccent, fontWeight: "700", fontSize: "17px", minHeight: "56px", paddingLeft: "36px", paddingRight: "36px", borderRadius: "0px", borderStyle: "solid", borderWidth: "0px" });
    Moteur.finishNode(S, bouton);
    const gauche = k.col([marque, promesse, k.col([cap(k, "Écrivez-nous", { couleur: S.mute }), courriel], { gap: "6px" }), bouton], { gap: "30px", alignItems: "flex-start", maxWidth: "600px", width: "100%" });
    const moitieGauche = { type: "container", children: [gauche], ...sty({ backgroundColor: S.bg, flexBasis: "50%", flexGrow: 1, flexShrink: 1, minWidth: "0px", display: "flex", justifyContent: "flex-end", paddingTop: "104px", paddingBottom: "96px", paddingLeft: "48px", paddingRight: "56px" }, { paddingTop: "80px", paddingBottom: "72px", paddingLeft: "32px", paddingRight: "32px" }, { flexBasis: "100%", justifyContent: "flex-start", paddingTop: "56px", paddingBottom: "56px", paddingLeft: "20px", paddingRight: "20px" }) };
    // moitié droite : deux colonnes de liens, lettre sur une ligne, réseaux en pastilles
    const col = (t, liste) => kc.col([cap(kc, t, { couleur: Sc.mute }), kc.col(liste.map(([l, u]) => lien(kc, G, l, u, { taille: 17, poids: "600", lh: 1.3, pv: "5px", survol: VERT })), { gap: "4px", alignItems: "flex-start" })], { gap: "12px", flexBasis: "0px", flexGrow: 1, minWidth: "130px" });
    const nav = kc.row([col("Notre mission", [["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"]]), col("Nous rejoindre", [["Nous contacter", "/contact"], ["Créer un compte", "/inscription"], ["Se connecter", "/connexion"]])], { columnGap: "32px", rowGap: "24px", alignItems: "flex-start", width: "100%", flexWrap: "wrap" });
    const abo = G.abonnement({ titre: "Lettre de Terrane", intro: "Nos engagements et nos actualités, par e-mail.", bouton: "S'abonner", largeur: "100%", soulignement: "2px", rayonBouton: "0px", accent: VERT, texte: INK, survolBouton: INK, survolTexte: CREME })(kc, env);
    const resauxP = G.pilules([["LinkedIn", "https://www.linkedin.com/"], ["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"]], { contour: VERT, couleur: INK, taille: 14, gap: "8px", survolFond: VERT, survolCouleur: CREME })(kc, env);
    const reseauxBloc = kc.col([cap(kc, "Nous suivre", { couleur: Sc.mute }), resauxP], { gap: "12px" });
    const droite = kc.col([nav, filetH(kc, Sc.line), abo, reseauxBloc], { gap: "32px", alignItems: "stretch", justifyContent: "space-between", maxWidth: "560px", width: "100%" });
    const moitieDroite = { type: "container", children: [droite], ...sty({ backgroundColor: CREME, flexBasis: "50%", flexGrow: 1, flexShrink: 1, minWidth: "0px", display: "flex", justifyContent: "flex-start", paddingTop: "104px", paddingBottom: "96px", paddingLeft: "56px", paddingRight: "48px" }, { paddingTop: "80px", paddingBottom: "72px", paddingLeft: "32px", paddingRight: "32px" }, { flexBasis: "100%", paddingTop: "48px", paddingBottom: "52px", paddingLeft: "20px", paddingRight: "20px" }) };
    const coupe = { type: "container", props: { full: true }, name: "Pacte en deux", children: [moitieGauche, moitieDroite], ...sty({ display: "flex", flexDirection: "row", flexWrap: "wrap", alignItems: "stretch", gap: "0px", width: "100%", backgroundColor: S.bg }) };
    const legale = G.bande(k, [G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { fond: S.alt, colonne: true, padV: ["24px", "22px", "20px"], padB: ["28px", "26px", "24px"], padH: ["48px", "32px", "20px"], max: "1280px", nom: "Mentions" });
    return [G.racine(k, [coupe, legale])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-008 « Cap sur le Téléphone » — PME de dépannage fictive « Cap Dépannage ». Le NUMÉRO est le héros : le téléphone de l'entreprise (widget Téléphone cliquable, lu dans les Données de l'entreprise) en très grand corps,
// avec une grande flèche à côté ; la navigation tient sur une ligne de pilules. Pas de numéro renseigné : le geste se replie sur l'adresse e-mail et sur la flèche « Nous écrire » (jamais de faux numéro).
// Bleu #0d3b66, blanc, orange #faa307. Schibsted Grotesk 800 (testé à 130 px : propre) + Hanken Grotesk.
const capId = identite({
  key: "c008", label: "Bleu franc et orange", humeur: "dark",
  fond: "#0d3b66", texte: "#ffffff", discret: "#b9d0e6", accent: "#faa307", surface: "#175089",
  police: "font.hanken-grotesk", titres: "font.schibsted-grotesk", rayon: "16px", rayonBouton: "999px", ombre: "none", poids: "800", bordure: "0px", ligne: "#ffffff40",
});
const cap8 = modeleV2({
  id: identifiantV2(8, "cap-sur-le-telephone"), concept: "c-008-cap-sur-le-telephone", name: "Cap sur le téléphone", family: FAM,
  description: "Le numéro de téléphone de l'entreprise passe en très grand corps à côté d'une immense flèche orange ; la navigation tient sur une ligne de pilules. Sans numéro renseigné, l'e-mail et la flèche « Nous écrire » prennent le relais.",
  tags: ["dépannage", "téléphone", "flèche", "pilules", "bleu", "orange", "service"],
  identity: capId,
  racine: racineDe("#0d3b66"),
  widgets: ["text", "bizphone", "bizemail", "bizhours", "icon", "link", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · en-tête : marque et pastille « ouvert maintenant » (widget Horaires : état calculé sur l'heure réelle ; rien sans horaires renseignés)
    const marque = tx(k, "Cap Dépannage", { fontFamily: S.head, fontWeight: "800", fontSize: "26px", lineHeight: 1.1, color: S.fg, letterSpacing: "-0.02em" });
    const heures = G.code("hours|-")(k, env);
    Object.assign(heures.props, { showExceptions: false, showNote: false });
    Moteur.mergePart(heures, "row", { styles: { desktop: { display: "none" } } });
    Moteur.mergePart(heures, "status", { styles: { desktop: { fontFamily: S.font, fontSize: "15px", fontWeight: "700", color: S.accent } } });
    const haut = k.row([marque, heures], { rowGap: "12px", columnGap: "24px", alignItems: "center", justifyContent: "space-between", width: "100%" });
    // 2 · LE GESTE : le numéro en très grand corps + grande flèche vers la page Contact
    const invite = cap(k, "Joignez-nous", { couleur: S.accent, suivi: "0.22em", taille: "14px" });
    const tel = k.W("bizphone", { which: "1", prefix: "", showLabel: false, showIcon: false }, { color: S.fg, fontFamily: S.head, fontWeight: "800", fontSize: "fluid:34-128", lineHeight: 0.98, letterSpacing: "-0.035em", whiteSpace: "nowrap" });
    Moteur.finishNode(S, tel);
    Moteur.mergePart(tel, "link", { styles: { desktop: { color: S.fg, fontFamily: S.head, textDecoration: "none" } }, states: { hover: { color: S.accent, textDecoration: "none" }, focus: G.focus(S.accent) } });
    const courriel = G.code("email")(k, env);
    courriel.props.showIcon = false;
    Object.assign(courriel.styles.desktop, { fontFamily: S.head, fontWeight: "700", fontSize: "fluid:18-30", lineHeight: 1.2, color: S.fg });
    const fleche = (taille, cacher) => ({ ...k.row([{ type: "icon", props: { name: "arrowRight", size: String(taille), label: "Nous contacter", link: "/contact" }, ...sty({ transform: { rotate: -45 }, marginBottom: `${Math.round(taille * 0.3)}px`, marginTop: `${Math.round(taille * 0.1)}px` }) }], { color: S.accent, flexWrap: "nowrap", flexShrink: 0, justifyContent: "center", alignItems: "center", width: "auto" }), hideOn: cacher });
    const lienEcrire = lien(k, G, "Nous écrire", "/contact", { taille: 18, poids: "700", couleur: S.accent, survol: S.fg, extra: { textDecoration: "underline" } });
    const secours = k.row([courriel, fleche(48, ["desktop", "tablet"]), lienEcrire], { rowGap: "6px", columnGap: "28px", alignItems: "center", justifyContent: "flex-start" }, undefined, { columnGap: "16px" });
    const gauche = k.col([invite, tel, secours], { gap: "14px", alignItems: "flex-start", flexBasis: "0px", flexGrow: 1, minWidth: "0px" });
    const hero = k.row([gauche, fleche(128, ["mobile"])], { columnGap: "40px", rowGap: "20px", alignItems: "center", justifyContent: "space-between", flexWrap: "nowrap", width: "100%" });
    // 3 · la navigation : une seule ligne de pilules de 44 px
    const pilules = G.pilules([["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Contact", "/contact"], ["Espace client", "/connexion"]], { contour: "#ffffff80", taille: 15, gap: "10px" })(k, env);
    // 4 · mentions et réseaux ronds
    const reseaux = k.social([{ network: "facebook", url: "https://www.facebook.com/" }, { network: "instagram", url: "https://www.instagram.com/" }, { network: "linkedin", url: "https://www.linkedin.com/" }], { gap: "10px" });
    reseaux.props.size = "48"; reseaux.props.shape = "circle";
    Moteur.finishNode(S, reseaux);
    Moteur.mergePart(reseaux, "link", { styles: { desktop: { backgroundColor: S.alt, color: S.fg } } });
    const mentions = k.row([G.ligneLegale({ taille: 12, sansCookies: true })(k, env), reseaux], { rowGap: "16px", columnGap: "28px", alignItems: "center", justifyContent: "space-between", width: "100%" });
    const bande = G.bande(k, [haut, hero, pilules, filetH(k, S.line), mentions], { colonne: true, gap: "44px", fond: S.bg, padV: ["72px", "64px", "44px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "20px"], max: "1280px", innerMobile: { rowGap: "32px" }, nom: "Cap sur le téléphone" });
    return [G.racine(k, [bande])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Corporate et institutions", target: 8, built: true,
  description: "Pieds d’entreprises, d’administrations et d’institutions : sobres, rassurants, très lisibles, avec mentions légales claires.",
  models: [bastion, registre, colophon, ferroval, chancellerie, agora, pacte, cap8],
};
