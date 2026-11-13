// Famille v2 « Bijouterie et horlogerie » — 6 modèles (ft2-326 à ft2-331), pieds « inspirés de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Pieds de joailliers, bijoutiers et horlogers (marques FICTIVES). Compositions inspirées de trois captures de sites réels (colonne de marque + description + réseaux ; liste de grands mots légers ;
// grand titre + carte d'appel + nom monumental rogné), traduites à angles droits, autres couleurs, autre contenu. Aucune coordonnée, horaire ni chiffre inventé : adresse, téléphone et horaires viennent des
// Données de l'entreprise du site (sans données, les widgets restent sobres). Collections, ateliers et services sont des intitulés d'EXEMPLE à renommer dans l'éditeur ; adresses de réseaux = exemples.
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, décalage 2 à 10 px) ; UNE animation visible par modèle (carré qui respire, case qui se remplit, flèche qui glisse…).
// Pas d'animation d'entrée, pas de défilement continu.
const FAM = "bijouterie-horlogerie";
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");
const I = require("../aides-illus-a05");
const DOUX = 360; // ms : durée des transitions de survol / focus
// ── Aides LOCALES à la famille (toutes à angles droits) ──
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, flexShrink: 0, borderRadius: "0px" });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const abonnement = (k, env, o) => {
  const n = GK.abonnement({ rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", ...o })(k, env);
  n.parts.missing.styles.desktop = { ...n.parts.missing.styles.desktop, color: o.texte || k.S.fg };
  return n;
};
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "800", casse: "uppercase", suivi: "0.08em", couleur: o.texte, h: o.h || "54px", padH: "28px", police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
// deux valeurs de « gap » interdites sur k.row / k.col : converties en rowGap + columnGap
const gapOk = (st) => { if (st && typeof st.gap === "string" && /\s/.test(st.gap.trim())) { const { gap, ...r } = st; return { ...r, ...GK.gaps(gap) }; } return st; };
const sk = (k) => ({ ...k, row: (c, st, t, m) => k.row(c, gapOk(st), t, m), col: (c, st, t, m) => k.col(c, gapOk(st), t, m) });
const PH = ["48px", "32px", "20px"];
const reseauxT = (G, k, env, o) => G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15, poids: "700", ...o })(k, env);
// ligne d'index : grand libellé, flèche, filet bas ; la ligne glisse au survol
const ligneIndex = (k, label, url, o) => lien(k, `${label}  →`, url, { taille: o.taille, poids: o.poids || "400", police: o.police, couleur: o.couleur, h: o.h || "88px", bloc: true, lh: 1, suivi: o.suivi, casse: o.casse, survol: { color: o.survolCouleur, transform: { x: 10 }, ...(o.survolFond ? { backgroundColor: o.survolFond } : {}) }, focus: o.focus, extra: { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: o.filet, justifyContent: "space-between", ...(o.extra || {}) } });


// Aides communes aux six pieds : colonne de liens, ligne « pastille hexagonale + lien », mot monumental dessiné.
const colLiens = (k, G, titre, liste, o) => G.colonne(k, [caps(k, titre, { couleur: o.titre, suivi: "0.16em", taille: "13px" }), ...liste.map(([t, u]) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "400", couleur: o.couleur, survol: { color: o.survol, transform: { x: 4 } }, focus: o.survol }))], { poids: o.poids2 || 1, min: o.min || "170px", gap: "2px", base: o.base });
const ligneBadge = (k, glyphe, fond, trait, bord, t, u, o) => k.row([I.widget(k, I.hexBadge(glyphe, fond, trait, bord), { width: "56px", flexShrink: 0 }), lien(k, t, u, { taille: o.taille || 18, poids: "600", couleur: o.couleur, survol: { color: o.survol, transform: { x: 5 } }, focus: o.survol, police: o.police })], { gap: "14px", flexWrap: "nowrap", alignItems: "center" });
const reseauxIco = (k, G, env, liste = "instagram+facebook+youtube") => G.code(`socials:${liste}`)(k, env);

// ═══ ft2-326 « Flanc de la maison » — joaillerie (capture 16 : fond nuit à halo, grande marque dessinée, colonnes, pastilles hexagonales) ═══
// Un fond bleu nuit en dégradé, un halo champagne derrière un brillant dessiné (la marque), la description et les réseaux sous la marque ; trois colonnes : collections, la maison, « Nos ateliers » en pastilles hexagonales.
const maison = identite({
  key: "c326", label: "Bleu nuit et champagne", humeur: "dark",
  fond: "#0b1030", texte: "#f4ecdc", discret: "#b8bdd6", accent: "#e3c98f", surface: "#151b4a", encre: "#0b1030", surEncre: "#f4ecdc",
  police: "font.jost", titres: "font.cormorant-garamond", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#f4ecdc33",
});
const flancMaison = modeleV2({
  id: identifiantV2(326, "flanc-de-la-maison"), concept: "c-326-flanc-de-la-maison", name: "Flanc de la maison", family: FAM,
  description: "Pour une joaillerie : fond bleu nuit en dégradé, halo champagne derrière un brillant dessiné (la marque), description et réseaux en icônes, trois colonnes dont les ateliers en pastilles hexagonales.",
  tags: ["joaillerie", "bijouterie", "halo lumineux", "marque dessinée", "pastilles hexagonales", "bleu nuit", "champagne", "angles droits"],
  identity: maison, racine: racineDe("#0b1030"),
  widgets: ["html", "text", "link", "social", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S, CH = "#e3c98f", IV = "#f4ecdc";
    const logo = I.widget(k, I.logoBrillant(CH, IV), { maxWidth: "320px" });
    const nom = k.T("<p>Maison Aurèle</p>", { fontFamily: S.head, fontSize: "fluid:30-42", lineHeight: 1, fontWeight: "500", color: IV });
    const desc = k.T("<p>Joaillerie de création : alliances, solitaires et pièces uniques, dessinées et montées à l'atelier.</p>", { fontSize: "16px", lineHeight: 1.65, color: "#b8bdd6", fontFamily: S.font, maxWidth: "340px" });
    const marque = k.col([logo, nom, desc, souffle(reseauxIco(k, G, env), 4200)], { flexGrow: 3, flexBasis: "300px", minWidth: "260px", gap: "14px", alignItems: "flex-start" });
    const c1 = colLiens(k, G, "Collections", [["Alliances", "/catalogue"], ["Solitaires", "/catalogue"], ["Colliers", "/catalogue"], ["Bracelets", "/catalogue"], ["Sur mesure", "/contact"]], { titre: CH, couleur: IV, survol: CH });
    const c2 = colLiens(k, G, "La maison", [["Notre atelier", "/catalogue"], ["Entretien et réparation", "/faq"], ["Guide des tailles", "/faq"], ["Questions fréquentes", "/faq"], ["Contact", "/contact"]], { titre: CH, couleur: IV, survol: CH });
    const o = { couleur: IV, survol: CH };
    const ateliers = G.colonne(k, [caps(k, "Nos ateliers", { couleur: CH, suivi: "0.16em", taille: "13px" }), ligneBadge(k, "gemme", "#e3c98f", "#0b1030", "#e3c98f", "Haute joaillerie", "/catalogue", o), ligneBadge(k, "bague", "#1d2766", CH, CH, "Alliances", "/catalogue", o), ligneBadge(k, "cadran", "#1d2766", CH, CH, "Montres", "/catalogue", o)], { poids: 2, min: "230px", gap: "16px" });
    const haut = G.bande(k, [marque, c1, c2, ateliers], { fond: "#0b1030", degrade: { from: "#1c2575", to: "#080b22", angle: 150 }, gap: "36px 40px", aligne: "flex-start", padV: ["72px", "56px", "44px"], padB: ["48px", "40px", "32px"], padH: PH, nom: "Marque et colonnes" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#b8bdd6", liens: IV, sansCookies: true })(k, env, true);
    const bas = G.bande(k, [mentions], { fond: "#080b22", colonne: true, aligne: "center", gap: "0px", padV: ["26px", "22px", "20px"], padB: ["22px", "20px", "18px"], padH: PH, filetHaut: { epaisseur: "1px", couleur: "#f4ecdc33" }, nom: "Mentions" });
    bas.styles.desktop.color = IV;
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══ ft2-327 « Lettres d'or » — haute joaillerie (capture 17 : noir pur, très grands mots fins, grande marque géométrique rognée) ═══
const lettres = identite({
  key: "c327", label: "Noir et or rose", humeur: "dark",
  fond: "#09090a", texte: "#f6e7dc", discret: "#b9a39a", accent: "#e2b39a", surface: "#161214", encre: "#09090a", surEncre: "#f6e7dc",
  police: "font.tenor-sans", titres: "font.italiana", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "0px", ligne: "#f6e7dc33",
});
const lettresDOr = modeleV2({
  id: identifiantV2(327, "lettres-d-or"), concept: "c-327-lettres-d-or", name: "Lettres d'or", family: FAM,
  description: "Pour une maison de haute joaillerie : noir pur, quatre collections en très grands mots fins, trois colonnes de liens et une immense marque géométrique en or rose pâle, rognée par le bas de la page.",
  tags: ["haute joaillerie", "grands mots", "marque géométrique", "noir", "or rose", "minimal", "angles droits"],
  identity: lettres, racine: racineDe("#09090a"),
  widgets: ["html", "text", "link", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S, OR = "#e2b39a", PEAU = "#f6e7dc";
    const mot = (t) => ligneIndex(k, t, "/catalogue", { taille: 0, police: S.head, couleur: PEAU, survolCouleur: OR, focus: OR, filet: "#f6e7dc26", h: "92px", extra: { fontSize: "fluid:40-84" } });
    const mots = k.col([caps(k, "Collections", { couleur: PEAU, suivi: "0.2em", taille: "13px" }), mot("Alliances"), mot("Solitaires"), mot("Parures"), mot("Haute joaillerie")], { gap: "0px", alignItems: "flex-start", width: "100%" });
    const marque = I.widget(k, I.marqueDeco("#4a3236", "#2e1f22"), { width: "100%", maxWidth: "560px", marginTop: "24px" });
    const gauche = k.col([mots], { flexGrow: 3, flexBasis: "420px", minWidth: "280px", gap: "28px", alignItems: "flex-start" });
    const c1 = colLiens(k, G, "La maison", [["Notre atelier", "/catalogue"], ["Rendez-vous", "/contact"], ["Sur mesure", "/contact"], ["Entretien", "/faq"], ["Contact", "/contact"]], { titre: PEAU, couleur: "#d9c3b8", survol: OR, taille: 16 });
    const c2 = colLiens(k, G, "Aide", [["Guide des tailles", "/faq"], ["Livraison", "/faq"], ["Certificats", "/faq"], ["Questions", "/faq"], ["Espace client", "/connexion"]], { titre: PEAU, couleur: "#d9c3b8", survol: OR, taille: 16 });
    const rs = G.colonne(k, [caps(k, "Nous suivre", { couleur: PEAU, suivi: "0.16em", taille: "13px" }), ...["Instagram|https://www.instagram.com/", "Facebook|https://www.facebook.com/", "Pinterest|https://www.pinterest.com/"].map((x) => { const [t, u] = x.split("|"); return lien(k, `${t}  ↗`, u, { taille: 22, poids: "400", police: S.head, couleur: PEAU, h: "56px", survol: { color: OR, transform: { x: 6 } }, focus: OR }); })], { poids: 1, min: "200px", gap: "0px" });
    const haut = G.bande(k, [gauche, c1, c2, rs], { fond: "#09090a", gap: "40px 48px", aligne: "flex-start", padV: ["88px", "64px", "48px"], padB: ["0px", "0px", "0px"], padH: PH, nom: "Mots et colonnes" });
    const bandeMarque = G.bande(k, [k.col([marque], { width: "100%", maxWidth: "620px", alignItems: "flex-start" })], { fond: "#09090a", colonne: true, aligne: "flex-start", padV: ["40px", "32px", "24px"], padB: ["0px", "0px", "0px"], padH: PH, nom: "Marque rognée" });
    souffle(bandeMarque.children[0].children[0], 6000);
    const mentions = G.ligneLegale({ taille: 13, couleur: "#b9a39a", liens: PEAU, sansCookies: true })(k, env);
    const bas = G.bande(k, [k.row([caps(k, "Maison Aurèle", { couleur: OR, suivi: "0.24em", taille: "13px" }), reseauxT(G, k, env, { couleur: PEAU, survol: OR, focus: OR, taille: 14 })], { justifyContent: "space-between", gap: "8px 28px", width: "100%" }), mentions], { fond: "#09090a", colonne: true, gap: "14px", padV: ["28px", "24px", "20px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = PEAU;
    return [G.racine(k, [haut, bandeMarque, bas])];
  },
}, FAM);

// ═══ ft2-328 « Mosaïque d'atelier » — bijoutier créateur (capture 18 : titre, contacts, carte d'appel avec livret incliné, mot monumental rogné) ═══
const mosaique = identite({
  key: "c328", label: "Marine profond et ivoire", humeur: "dark",
  fond: "#0f1b33", texte: "#f6f1e7", discret: "#b3bfd6", accent: "#d9b36a", surface: "#182848", encre: "#0f1b33", surEncre: "#f6f1e7",
  police: "font.instrument-sans", titres: "font.libre-caslon-display", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#f6f1e780",
});
const mosaiqueAtelier = modeleV2({
  id: identifiantV2(328, "mosaique-d-atelier"), concept: "c-328-mosaique-d-atelier", name: "Mosaïque d'atelier", family: FAM,
  description: "Pour un bijoutier créateur : grand titre et coordonnées à gauche, colonne de liens, carte d'appel marine avec un livret « guide des pierres » dessiné et incliné, puis le mot ATELIER monumental rogné en bas.",
  tags: ["bijoutier créateur", "carte d'appel", "livret incliné", "mot monumental", "marine", "ivoire", "horaires", "angles droits"],
  identity: mosaique, racine: racineDe("#0f1b33"),
  widgets: ["html", "text", "link", "bizcontact", "social", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S, IVO = "#f6f1e7", OR = "#d9b36a";
    const titre = G.geant("<p>Des bijoux faits<br>pour durer.</p>", { taille: [38, 68], tablette: { taille: [44, 60] }, mobile: { taille: [34, 44] }, lh: 1.05, suivi: "-0.01em", poids: "400", police: S.head, couleur: IVO })(k, env);
    const con = Moteur.finishNode(S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: true, layout: "stack" }, { color: IVO, fontSize: "15px", fontFamily: S.font, lineHeight: 1.7, width: "100%" }));
    const gauche = k.col([titre, con, reseauxIco(k, G, env, "instagram+facebook")], { flexGrow: 3, flexBasis: "340px", minWidth: "280px", gap: "22px", alignItems: "flex-start" });
    const nav = k.col(["Collections|/catalogue", "Sur mesure|/contact", "Entretien|/faq", "Livraison|/faq", "Questions|/faq", "Contact|/contact"].map((x) => { const [t, u] = x.split("|"); return lien(k, t, u, { taille: 16, poids: "600", couleur: IVO, survol: { color: OR, transform: { x: 4 } }, focus: OR }); }), { flexGrow: 1, flexBasis: "170px", minWidth: "150px", gap: "2px", alignItems: "flex-start" });
    const txt = k.T("<p>Recevez le guide des pierres de l'atelier.</p>", { fontFamily: S.head, fontSize: "fluid:24-32", lineHeight: 1.2, color: IVO, textAlign: "center" });
    const bt = souffle(bouton(k, "Lire le guide", "/faq", { texte: "#0f1b33", fond: "#ffffff", bord: "#ffffff", taille: 15, survol: { backgroundColor: OR, borderColor: OR, transform: { y: -3 } }, focus: OR }), 4400);
    const carte = k.row([k.col([txt, bt, lien(k, "Poser une question  →", "/contact", { taille: 15, couleur: IVO, survol: { color: OR }, focus: OR })], { flexGrow: 1, flexBasis: "200px", gap: "14px", alignItems: "center", paddingTop: "34px", paddingBottom: "34px", paddingLeft: "28px" }), I.widget(k, I.livretGuide({ fond: "#f3ead3", bord: "#8d6f2f", accent: "#0f1b33", clair: "#d9b36a", angle: 6 }), { width: "210px", flexShrink: 0, marginTop: "-46px", marginBottom: "-12px" })], { backgroundColor: "#1b2c52", flexGrow: 3, flexBasis: "420px", minWidth: "300px", gap: "8px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", paddingRight: "16px", boxSizing: "border-box", borderRadius: "0px" });
    carte.states = { hover: { transform: { y: -4 } } };
    const haut = G.bande(k, [gauche, carte], { fond: "#0f1b33", gap: "40px 48px", aligne: "flex-start", padV: ["88px", "68px", "52px"], padB: ["40px", "36px", "28px"], padH: PH, nom: "Titre, liens et carte" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#b3bfd6", liens: IVO, sansCookies: true })(k, env);
    const navH = k.row(["Collections|/catalogue", "Sur mesure|/contact", "Entretien|/faq", "Livraison|/faq", "Contact|/contact"].map((x) => { const [t, u] = x.split("|"); return lien(k, t, u, { taille: 15, poids: "600", couleur: IVO, padH: "4px", survol: { color: OR, transform: { y: -2 } }, focus: OR }); }), { gap: "4px 28px" });
    const filet = G.bande(k, [navH, mentions], { fond: "#0f1b33", colonne: true, gap: "10px", padV: ["20px", "18px", "16px"], padB: ["24px", "20px", "18px"], padH: PH, filetHaut: { epaisseur: "1px", couleur: "#f6f1e74d" }, nom: "Liens et mentions" });
    filet.styles.desktop.color = IVO;
    const mot = G.bande(k, [I.widget(k, I.motMonument("ATELIER", "#1d3157", 0.74, 1.3))], { fond: "#0f1b33", colonne: true, padV: ["16px", "12px", "12px"], padB: ["0px", "0px", "0px"], padH: PH, max: "100%", nom: "Mot monumental" });
    return [G.racine(k, [haut, filet, mot])];
  },
}, FAM);

// ═══ ft2-329 « Papier du joaillier » — bijouterie de tradition (capture 17 en version claire : mots géants, colonnes, marque rognée à droite) ═══
const papier = identite({
  key: "c329", label: "Ivoire, encre et prune", humeur: "light",
  fond: "#f5efe3", texte: "#241b14", discret: "#5f5244", accent: "#7a2a3c", surface: "#ebe2d0", encre: "#241b14", surEncre: "#f5efe3",
  police: "font.spectral", titres: "font.cormorant", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#241b1433",
});
const papierJoaillier = modeleV2({
  id: identifiantV2(329, "papier-du-joaillier"), concept: "c-329-papier-du-joaillier", name: "Papier du joaillier", family: FAM,
  description: "Pour une bijouterie de tradition : ivoire, quatre grands mots fins en deux colonnes, adresse et liens en colonnes et un immense demi-sceau de laurier et de poinçon ton sur ton qui monte du bas, à droite.",
  tags: ["bijouterie", "tradition", "demi-sceau", "laurier", "grands mots", "ivoire", "prune", "angles droits"],
  identity: papier, racine: racineDe("#f5efe3"),
  widgets: ["html", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S, ENC = "#241b14", PR = "#7a2a3c";
    const mot = (t, u) => lien(k, t, u, { taille: 50, poids: "500", police: S.head, couleur: ENC, h: "84px", lh: 1, survol: { color: PR, transform: { x: 10 } }, focus: PR, extra: { fontSize: "fluid:38-80", flexGrow: 1, flexBasis: "280px" } });
    const mots = k.col([caps(k, "Joaillerie Verlaine", { couleur: PR, suivi: "0.24em", taille: "13px" }), k.row([mot("Bijoux", "/catalogue"), mot("Alliances", "/catalogue"), mot("Montres", "/catalogue"), mot("Expertise", "/catalogue")], { gap: "0px 32px", width: "100%", alignItems: "stretch" })], { gap: "12px", width: "100%", alignItems: "flex-start" });
    const adr = G.colonne(k, [caps(k, "La boutique", { couleur: PR, suivi: "0.16em", taille: "13px" }), coordonnees(k, { couleur: ENC, lien: ENC, survol: PR, focus: PR })], { poids: 2, min: "240px", gap: "10px" });
    const c1 = colLiens(k, G, "Maison", [["Bijoux anciens", "/catalogue"], ["Alliances", "/catalogue"], ["Montres de collection", "/catalogue"], ["Contact", "/contact"]], { titre: PR, couleur: ENC, survol: PR });
    const c2 = colLiens(k, G, "Informations", [["Expertise", "/faq"], ["Livraison", "/faq"], ["Questions", "/faq"], ["Espace client", "/connexion"]], { titre: PR, couleur: ENC, survol: PR });
    const rs = reseauxT(G, k, env, { couleur: PR, survol: ENC, focus: PR, taille: 15 });
    const gauche = k.col([k.row([adr, c1, c2], { gap: "28px 36px", alignItems: "flex-start", width: "100%" }), rs], { flexGrow: 3, flexBasis: "420px", minWidth: "280px", gap: "26px", alignItems: "flex-start", paddingBottom: "32px" });
    const marque = I.widget(k, I.marqueLaurier("#e6dccb", "#d8caaf"), { width: "100%" });
    const droite = k.col([marque], { flexGrow: 2, flexBasis: "340px", minWidth: "260px", justifyContent: "flex-end", alignSelf: "flex-end" });
    const haut = G.bande(k, [mots, k.row([gauche, droite], { gap: "24px 40px", alignItems: "flex-end", width: "100%" })], { fond: "#f5efe3", colonne: true, gap: "40px", padV: ["80px", "60px", "44px"], padB: ["0px", "0px", "0px"], padH: PH, nom: "Mots, adresse et sceau" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#5f5244", liens: ENC, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: "#ebe2d0", colonne: true, gap: "0px", padV: ["24px", "20px", "18px"], padB: ["24px", "20px", "18px"], padH: PH, filetHaut: { epaisseur: "2px", couleur: "#241b14" }, nom: "Mentions" });
    souffle(haut.children[0].children[1], 6000);
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══ ft2-330 « Barre de cadran » — horlogerie (capture 16 : nuit à halo, logo dessiné, colonnes, pastilles hexagonales, bande basse) ═══
const cadran = identite({
  key: "c330", label: "Indigo nuit et turquoise", humeur: "dark",
  fond: "#0a0f2a", texte: "#e7eef6", discret: "#a5b3cc", accent: "#4fd1c0", surface: "#141b4a", encre: "#0a0f2a", surEncre: "#e7eef6",
  police: "font.ibm-plex-sans", titres: "font.barlow-condensed", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#e7eef633",
});
const barreCadran = modeleV2({
  id: identifiantV2(330, "barre-de-cadran"), concept: "c-330-barre-de-cadran", name: "Barre de cadran", family: FAM,
  description: "Pour un horloger : fond indigo en dégradé, halo turquoise autour d'un cadran dessiné (la marque), réseaux en icônes, deux colonnes de liens et trois pastilles hexagonales (révision, achat, atelier), bouton d'entretien.",
  tags: ["horlogerie", "horloger", "halo lumineux", "cadran dessiné", "pastilles hexagonales", "indigo", "turquoise", "angles droits"],
  identity: cadran, racine: racineDe("#0a0f2a"),
  widgets: ["html", "text", "link", "social", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S, TQ = "#4fd1c0", GL = "#e7eef6";
    const logo = I.widget(k, I.logoCadran(TQ, GL, "#0a0f2a"), { maxWidth: "340px" });
    const nom = k.T("<p>Atelier Cadran</p>", { fontFamily: S.head, fontSize: "36px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.1em", color: GL, lineHeight: 1 });
    const desc = k.T("<p>Montres neuves et anciennes, révision et restauration de mouvements mécaniques.</p>", { fontSize: "16px", lineHeight: 1.65, color: "#a5b3cc", fontFamily: S.font, maxWidth: "320px" });
    const gauche = k.col([logo, nom, desc], { flexGrow: 2, flexBasis: "300px", minWidth: "260px", gap: "12px", alignItems: "flex-start" });
    const o = { couleur: GL, survol: TQ, police: S.font };
    const badges = k.col([caps(k, "Services de l'atelier", { couleur: TQ, suivi: "0.18em", taille: "13px" }), ligneBadge(k, "rouage", TQ, "#0a0f2a", TQ, "Révision", "/catalogue", o), ligneBadge(k, "cadran", "#141b4a", TQ, TQ, "Montres anciennes", "/catalogue", o), ligneBadge(k, "gemme", "#141b4a", TQ, TQ, "Sertissage", "/catalogue", o)], { flexGrow: 2, flexBasis: "260px", minWidth: "240px", gap: "14px", alignItems: "flex-start" });
    const c1 = colLiens(k, G, "Atelier", [["Montres", "/catalogue"], ["Révision", "/catalogue"], ["Pièces anciennes", "/catalogue"], ["Contact", "/contact"]], { titre: TQ, couleur: GL, survol: TQ });
    const b = souffle(bouton(k, "Demander un entretien", "/contact", { texte: "#0a0f2a", fond: TQ, bord: TQ, taille: 14, h: "50px", survol: { backgroundColor: GL, borderColor: GL, transform: { y: -3 } }, focus: GL }), 3600);
    const droite = k.col([k.row([c1, badges], { gap: "28px 36px", alignItems: "flex-start", width: "100%" }), b], { flexGrow: 5, flexBasis: "480px", minWidth: "280px", gap: "28px", alignItems: "flex-start" });
    const haut = G.bande(k, [gauche, droite], { fond: "#0a0f2a", degrade: { from: "#1a1f6e", to: "#070a1d", angle: 200 }, gap: "36px 48px", aligne: "center", padV: ["64px", "52px", "40px"], padB: ["36px", "32px", "28px"], padH: PH, nom: "Marque et services" });
    const ligne2 = G.bande(k, [k.row([caps(k, "Horlogerie de précision", { couleur: TQ, suivi: "0.24em" }), reseauxIco(k, G, env, "instagram+youtube+facebook")], { justifyContent: "space-between", alignItems: "center", gap: "12px 32px", width: "100%" }), G.ligneLegale({ taille: 13, couleur: "#a5b3cc", liens: GL, sansCookies: true })(k, env)], { fond: "#070a1d", colonne: true, gap: "16px", padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: PH, filetHaut: { epaisseur: "1px", couleur: "#e7eef633" }, nom: "Réseaux et mentions" });
    ligne2.styles.desktop.color = GL;
    return [G.racine(k, [haut, ligne2])];
  },
}, FAM);

// ═══ ft2-331 « Fiche de calibre » — horlogerie d'art (capture 18 : sombre mat, carte d'appel + livret incliné + mot monumental rogné) ═══
const fiche = identite({
  key: "c331", label: "Vert sapin et sauge", humeur: "dark",
  fond: "#14221a", texte: "#eef3e6", discret: "#b4c4b0", accent: "#b9c98f", surface: "#1d3025", encre: "#14221a", surEncre: "#eef3e6",
  police: "font.ibm-plex-sans", titres: "font.ibm-plex-mono", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#eef3e640",
});
const ficheCalibre = modeleV2({
  id: identifiantV2(331, "fiche-de-calibre"), concept: "c-331-fiche-de-calibre", name: "Fiche de calibre", family: FAM,
  description: "Pour une horlogerie d'art : vert sapin mat, adresse et horaires à gauche, colonne de liens, grande carte « fiche de calibre » avec un livret technique incliné, et le mot CALIBRE monumental rogné en sauge.",
  tags: ["horlogerie d'art", "carte d'appel", "livret incliné", "mot monumental", "mono", "vert sapin", "sauge", "horaires", "angles droits"],
  identity: fiche, racine: racineDe("#14221a"),
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S, SG = "#b9c98f", CL = "#eef3e6";
    const titre = k.T("<p>Manufacture<br>Lorient</p>", { fontFamily: S.head, fontSize: "fluid:34-60", lineHeight: 1.05, fontWeight: "500", color: CL });
    const adr = coordonnees(k, { couleur: CL, lien: CL, survol: SG, focus: SG, taille: 15 });
    const hor = k.col([caps(k, "Horaires de l'atelier", { couleur: SG, police: S.head, suivi: "0.1em" }), horaires(k, { couleur: CL, taille: 14 })], { gap: "8px", alignItems: "flex-start", width: "100%" });
    const gauche = k.col([titre, adr, hor], { flexGrow: 3, flexBasis: "320px", minWidth: "260px", gap: "22px", alignItems: "flex-start" });
    const cmd = (t, u) => lien(k, `> ${t}`, u, { taille: 16, police: S.head, couleur: CL, h: "44px", survol: { color: "#14221a", backgroundColor: SG, transform: { x: 6 } }, focus: SG, padH: "6px" });
    const nav = k.col([caps(k, "Commandes", { couleur: SG, police: S.head, suivi: "0.1em" }), cmd("montres", "/catalogue"), cmd("calibres", "/catalogue"), cmd("révision", "/catalogue"), cmd("manufacture", "/catalogue"), cmd("contact", "/contact")], { flexGrow: 1, flexBasis: "190px", minWidth: "170px", gap: "2px", alignItems: "flex-start" });
    const txt = k.T("<p>Une fiche de calibre à télécharger, schémas et cotes.</p>", { fontFamily: S.head, fontSize: "fluid:18-24", lineHeight: 1.35, color: CL });
    const bt = souffle(bouton(k, "Télécharger la fiche", "/faq", { texte: "#14221a", fond: "#ffffff", bord: "#ffffff", taille: 14, police: S.head, survol: { backgroundColor: SG, borderColor: SG, transform: { y: -3 } }, focus: SG }), 4200);
    const carte = k.col([k.row([k.col([txt, bt], { flexGrow: 1, flexBasis: "190px", gap: "16px", alignItems: "flex-start", paddingTop: "32px", paddingBottom: "32px", paddingLeft: "28px" }), I.widget(k, I.livretCalibre({ fond: "#e8eddb", bord: "#5b6d4c", accent: "#1f3a2a", clair: "#8aa070", angle: -5 }), { width: "200px", flexShrink: 0, marginTop: "-44px", marginBottom: "-10px", marginRight: "12px" })], { gap: "8px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", width: "100%" })], { backgroundColor: "#22392b", flexGrow: 3, flexBasis: "400px", minWidth: "280px", boxSizing: "border-box", borderRadius: "0px" });
    carte.states = { hover: { transform: { y: -4 } } };
    const haut = G.bande(k, [gauche, nav, carte], { fond: "#14221a", gap: "40px 44px", aligne: "flex-start", padV: ["88px", "68px", "52px"], padB: ["36px", "32px", "28px"], padH: PH, nom: "Adresse, commandes et carte" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#b4c4b0", liens: CL, sansCookies: true })(k, env);
    const filet = G.bande(k, [mentions], { fond: "#14221a", colonne: true, gap: "0px", padV: ["20px", "18px", "16px"], padB: ["22px", "20px", "18px"], padH: PH, filetHaut: { epaisseur: "1px", couleur: "#eef3e659" }, nom: "Mentions" });
    filet.styles.desktop.color = CL;
    const mot = G.bande(k, [I.widget(k, I.motMonument("CALIBRE", "#a2b277", 0.7, 1.15))], { fond: "#14221a", colonne: true, padV: ["16px", "12px", "12px"], padB: ["0px", "0px", "0px"], padH: PH, max: "100%", nom: "Mot monumental" });
    return [G.racine(k, [haut, filet, mot])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Bijouterie et horlogerie", target: 6, built: true,
  description: "Pieds inspirés de captures, angles droits, animations fluides : joaillerie, haute joaillerie, bijoutier créateur, bijouterie de tradition, horloger, horlogerie d'art.",
  models: [flancMaison, lettresDOr, mosaiqueAtelier, papierJoaillier, barreCadran, ficheCalibre],
};
