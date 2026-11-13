// Famille v2 « Gastronomie et épicerie fine » — 6 modèles (ft2-332 à ft2-337), pieds « inspirés de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Pieds d'épiceries fines, fromageries, caves à manger, traiteurs et boutiques de produits du terroir (marques FICTIVES). Compositions inspirées de trois captures de sites réels (colonne de marque + groupe
// de marques en pastilles ; très grands mots légers en liste ; grand titre + carte d'appel + nom monumental rogné), traduites à angles droits, autres couleurs, autre contenu.
// Aucune coordonnée, horaire ni chiffre inventé : adresse, téléphone et horaires viennent des Données de l'entreprise du site. Rayons, produits et étapes = intitulés d'EXEMPLE à renommer dans l'éditeur.
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, décalage 2 à 10 px) ; UNE animation visible par modèle (carré qui respire, case qui se remplit, flèche qui glisse…).
// Pas d'animation d'entrée, pas de défilement continu.
const FAM = "gastronomie-epicerie";
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


// Aides communes : colonne de liens, ligne « pastille hexagonale + lien », réseaux en icônes.
const colLiens = (k, G, titre, liste, o) => G.colonne(k, [caps(k, titre, { couleur: o.titre, suivi: "0.16em", taille: "13px" }), ...liste.map(([t, u]) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "400", couleur: o.couleur, survol: { color: o.survol, transform: { x: 4 } }, focus: o.survol }))], { poids: o.poids2 || 1, min: o.min || "170px", gap: "2px" });
const ligneBadge = (k, glyphe, fond, trait, bord, t, u, o) => k.row([I.widget(k, I.hexBadge(glyphe, fond, trait, bord), { width: "56px", flexShrink: 0 }), lien(k, t, u, { taille: o.taille || 18, poids: "700", couleur: o.couleur, survol: { color: o.survol, transform: { x: 5 } }, focus: o.survol })], { gap: "14px", flexWrap: "nowrap", alignItems: "center" });
const reseauxIco = (k, G, env, liste = "instagram+facebook+youtube") => G.code(`socials:${liste}`)(k, env);

// ═══ ft2-332 « Damier du marché » — épicerie fine (capture 16 : fond nuit à halo, marque dessinée, colonnes, pastilles hexagonales) ═══
const marche = identite({
  key: "c332", label: "Aubergine et tomate", humeur: "dark",
  fond: "#170b14", texte: "#fff4e0", discret: "#e0c7bd", accent: "#ff6a4d", surface: "#2a1220", encre: "#170b14", surEncre: "#fff4e0",
  police: "font.work-sans", titres: "font.archivo-black", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#fff4e033",
});
const damierMarche = modeleV2({
  id: identifiantV2(332, "damier-du-marche"), concept: "c-332-damier-du-marche", name: "Damier du marché", family: FAM,
  description: "Pour une épicerie fine : fond aubergine en dégradé, halo tomate autour d'une tomate dessinée (la marque), réseaux en icônes, rayons en pastilles hexagonales, horaires et coordonnées.",
  tags: ["épicerie fine", "halo lumineux", "marque dessinée", "pastilles hexagonales", "horaires", "aubergine", "tomate", "angles droits"],
  identity: marche, racine: racineDe("#170b14"),
  widgets: ["html", "text", "link", "social", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S, CR = "#fff4e0", TO = "#ff6a4d";
    const logo = I.widget(k, I.logoTomate("#e2402a", CR, "#5da34a"), { maxWidth: "320px" });
    const nom = k.T("<p>Maison du Marché</p>", { fontFamily: S.head, fontSize: "fluid:28-40", lineHeight: 1, color: CR, textTransform: "uppercase" });
    const desc = k.T("<p>Fromages, charcuteries, vins et douceurs, choisis chez des producteurs voisins.</p>", { fontSize: "16px", lineHeight: 1.65, color: "#e0c7bd", fontFamily: S.font, maxWidth: "320px" });
    const marque = k.col([logo, nom, desc, souffle(reseauxIco(k, G, env), 4000)], { flexGrow: 3, flexBasis: "300px", minWidth: "260px", gap: "14px", alignItems: "flex-start" });
    const o = { couleur: CR, survol: TO };
    const rayons = G.colonne(k, [caps(k, "Les rayons", { couleur: TO, suivi: "0.16em", taille: "13px" }), ligneBadge(k, "fromage", "#ff6a4d", "#170b14", "#ff6a4d", "Fromages", "/catalogue", o), ligneBadge(k, "bouteille", "#2a1220", TO, TO, "Vins", "/catalogue", o), ligneBadge(k, "bocal", "#2a1220", TO, TO, "Épicerie sucrée", "/catalogue", o), ligneBadge(k, "tomate", "#2a1220", TO, TO, "Fruits et légumes", "/catalogue", o)], { poids: 2, min: "250px", gap: "12px" });
    const trouver = G.colonne(k, [caps(k, "Nous trouver", { couleur: TO, suivi: "0.16em", taille: "13px" }), coordonnees(k, { couleur: CR, lien: CR, survol: TO, focus: TO, taille: 14 }), caps(k, "Ouverture", { couleur: TO, suivi: "0.16em", taille: "13px" }), horaires(k, { couleur: CR, taille: 14 })], { poids: 2, min: "230px", gap: "10px" });
    const haut = G.bande(k, [marque, rayons, trouver], { fond: "#170b14", degrade: { from: "#5a1a2e", to: "#12070e", angle: 160 }, gap: "36px 44px", aligne: "flex-start", padV: ["72px", "56px", "44px"], padB: ["44px", "36px", "28px"], padH: PH, nom: "Marque, rayons et infos" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#e0c7bd", liens: CR, sansCookies: true })(k, env);
    const bas = G.bande(k, [k.row([lien(k, "Coffrets cadeaux", "/catalogue", { taille: 15, couleur: CR, survol: { color: TO }, focus: TO }), lien(k, "Livraison", "/faq", { taille: 15, couleur: CR, survol: { color: TO }, focus: TO }), lien(k, "Contact", "/contact", { taille: 15, couleur: CR, survol: { color: TO }, focus: TO })], { gap: "4px 28px" }), mentions], { fond: "#12070e", colonne: true, gap: "10px", padV: ["24px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: PH, filetHaut: { epaisseur: "1px", couleur: "#fff4e033" }, nom: "Liens et mentions" });
    bas.styles.desktop.color = CR;
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══ ft2-333 « Deux assiettes » — traiteur (capture 18 : carte d'appel avec livret incliné, titre, contacts, mot monumental rogné) ═══
const assiettes = identite({
  key: "c333", label: "Olive profond et safran", humeur: "dark",
  fond: "#243019", texte: "#f8f1df", discret: "#cdd7b8", accent: "#e8b33a", surface: "#2f3d23", encre: "#243019", surEncre: "#f8f1df",
  police: "font.public-sans", titres: "font.fraunces", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f8f1df66",
});
const deuxAssiettes = modeleV2({
  id: identifiantV2(333, "deux-assiettes"), concept: "c-333-deux-assiettes", name: "Deux assiettes", family: FAM,
  description: "Pour un traiteur : carte d'appel « menu du mois » avec un livret dessiné incliné à gauche, grande phrase, coordonnées et horaires à droite, et le mot TABLE monumental rogné en vert olive clair.",
  tags: ["traiteur", "carte d'appel", "livret incliné", "mot monumental", "olive", "safran", "horaires", "angles droits"],
  identity: assiettes, racine: racineDe("#243019"),
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "social", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S, CR = "#f8f1df", SA = "#e8b33a";
    const txt = k.T("<p>Le menu du mois, en PDF.</p>", { fontFamily: S.head, fontSize: "fluid:24-32", lineHeight: 1.15, color: CR });
    const bt = souffle(bouton(k, "Voir le menu", "/catalogue", { texte: "#243019", fond: "#ffffff", bord: "#ffffff", taille: 15, survol: { backgroundColor: SA, borderColor: SA, transform: { y: -3 } }, focus: SA }), 4200);
    const carte = k.row([I.widget(k, I.livretMenu({ fond: "#f8f1df", bord: "#8a6a1c", accent: "#243019", clair: "#e8b33a", angle: -6 }), { width: "200px", flexShrink: 0, marginTop: "-44px", marginBottom: "-10px", marginLeft: "32px" }), k.col([txt, lien(k, "Demander un devis  →", "/contact", { taille: 15, couleur: CR, survol: { color: SA }, focus: SA })], { flexGrow: 2, flexBasis: "240px", gap: "10px", alignItems: "flex-start", paddingTop: "28px", paddingBottom: "28px" }), k.col([bt], { paddingRight: "32px" })], { backgroundColor: "#33432a", width: "100%", gap: "24px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", boxSizing: "border-box", borderRadius: "0px" });
    carte.states = { hover: { transform: { y: -4 } } };
    const phrase = G.geant("<p>À table,<br><em>ensemble.</em></p>", { taille: [48, 88], tablette: { taille: [56, 76] }, mobile: { taille: [44, 56] }, lh: 1, suivi: "-0.02em", poids: "500", police: S.head, couleur: CR })(k, env);
    const intro = k.T("<p>Buffets, repas d'équipe, mariages : un traiteur de produits frais, cuisinés la veille.</p>", { fontSize: "16px", lineHeight: 1.6, color: "#cdd7b8", fontFamily: S.font, maxWidth: "420px" });
    const con = Moteur.finishNode(S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: true, layout: "stack" }, { color: CR, fontSize: "15px", fontFamily: S.font, lineHeight: 1.7, width: "100%" }));
    const milieu = k.col([phrase, intro, con, reseauxIco(k, G, env, "instagram+facebook")], { flexGrow: 3, flexBasis: "340px", minWidth: "280px", gap: "20px", alignItems: "flex-start" });
    const hor = k.col([caps(k, "Horaires", { couleur: SA, suivi: "0.16em", taille: "13px" }), horaires(k, { couleur: CR, taille: 14 }), caps(k, "Nos formules", { couleur: SA, suivi: "0.16em", taille: "13px" }), ...[["Buffets froids", "/catalogue"], ["Plateaux repas", "/catalogue"], ["Cocktails", "/catalogue"], ["Repas assis", "/catalogue"]].map(([t, u]) => lien(k, t, u, { taille: 16, couleur: CR, survol: { color: SA, transform: { x: 4 } }, focus: SA }))], { flexGrow: 1, flexBasis: "200px", minWidth: "180px", gap: "6px", alignItems: "flex-start" });
    const haut = G.bande(k, [milieu, hor], { fond: "#243019", gap: "40px 48px", aligne: "flex-start", padV: ["72px", "56px", "40px"], padB: ["40px", "36px", "28px"], padH: PH, nom: "Carte, phrase et horaires" });
    const bandeCarte = G.bande(k, [carte], { fond: "#243019", colonne: true, padV: ["24px", "20px", "20px"], padB: ["24px", "20px", "20px"], padH: PH, nom: "Carte d'appel" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#cdd7b8", liens: CR, sansCookies: true })(k, env);
    const filet = G.bande(k, [mentions], { fond: "#243019", colonne: true, gap: "0px", padV: ["20px", "18px", "16px"], padB: ["24px", "20px", "18px"], padH: PH, filetHaut: { epaisseur: "1px", couleur: "#f8f1df66" }, nom: "Mentions" });
    filet.styles.desktop.color = CR;
    const mot = G.bande(k, [I.widget(k, I.motMonument("TABLE", "#9aad76", 0.74, 1.3))], { fond: "#243019", colonne: true, padV: ["16px", "12px", "12px"], padB: ["0px", "0px", "0px"], padH: PH, max: "100%", nom: "Mot monumental" });
    return [G.racine(k, [haut, bandeCarte, filet, mot])];
  },
}, FAM);

// ═══ ft2-334 « Panier XXL » — produits du terroir (capture 18 : titre, liens, grande carte moutarde avec livret incliné, mot monumental) ═══
const panier = identite({
  key: "c334", label: "Brun café et moutarde", humeur: "dark",
  fond: "#241811", texte: "#fbefd8", discret: "#d8c3a4", accent: "#f2b705", surface: "#33231a", encre: "#241811", surEncre: "#fbefd8",
  police: "font.karla", titres: "font.anton", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#fbefd833",
});
const panierXXL = modeleV2({
  id: identifiantV2(334, "panier-xxl"), concept: "c-334-panier-xxl", name: "Panier XXL", family: FAM,
  description: "Pour une boutique de produits du terroir : grand titre en capitales, deux colonnes de liens, grande carte moutarde avec un catalogue dessiné incliné (bocaux et fruits) et le mot GRANGE monumental rogné.",
  tags: ["terroir", "boutique en ligne", "carte d'appel", "catalogue incliné", "mot monumental", "moutarde", "brun café", "angles droits"],
  identity: panier, racine: racineDe("#241811"),
  widgets: ["html", "text", "link", "social", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S, MO = "#f2b705", LA = "#fbefd8", CA = "#241811";
    const phrase = G.geant("<p>Un panier du terroir<br>chez vous.</p>", { taille: [40, 96], tablette: { taille: [52, 80] }, mobile: { taille: [36, 48] }, lh: 1, suivi: "0.005em", poids: "400", police: S.head, couleur: LA, extra: { textTransform: "uppercase" } })(k, env);
    const mot = k.T("<p>Confitures, miels, huiles et conserves de producteurs voisins, expédiés dans un colis soigné.</p>", { fontSize: "16px", lineHeight: 1.6, color: "#d8c3a4", fontFamily: S.font, maxWidth: "400px" });
    const gauche = k.col([caps(k, "Ferme de la Grange", { couleur: MO, suivi: "0.3em" }), phrase, mot, reseauxIco(k, G, env, "instagram+facebook+youtube")], { flexGrow: 3, flexBasis: "420px", minWidth: "280px", gap: "20px", alignItems: "flex-start" });
    const liste = k.col([...[["Confitures et miels", "/catalogue"], ["Huiles et vinaigres", "/catalogue"], ["Conserves", "/catalogue"], ["Coffrets", "/catalogue"], ["Livraison", "/faq"], ["Nous contacter", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 17, poids: "700", couleur: LA, bloc: true, h: "48px", survol: { color: MO, transform: { x: 6 } }, focus: MO, extra: { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#fbefd833" } }))], { flexGrow: 1, flexBasis: "260px", minWidth: "240px", maxWidth: "340px", gap: "0px", alignItems: "stretch" });
    const haut = G.bande(k, [gauche, liste], { fond: CA, gap: "40px 64px", aligne: "flex-start", padV: ["40px", "36px", "28px"], padB: ["56px", "44px", "32px"], padH: PH, nom: "Titre et liens" });
    const txt = k.T("<p>Le catalogue de saison, à feuilleter.</p>", { fontFamily: S.head, fontSize: "fluid:26-44", lineHeight: 1.1, color: CA, textTransform: "uppercase" });
    const gros = souffle(bouton(k, "Composer mon panier", "/boutique/panier", { texte: MO, fond: CA, bord: CA, taille: 17, h: "64px", survol: { backgroundColor: "#ffffff", borderColor: CA, color: CA, transform: { y: -4 } }, focus: CA, extra: { paddingLeft: "36px", paddingRight: "36px" } }), 4600);
    const carte = k.row([k.col([txt, gros], { flexGrow: 3, flexBasis: "320px", gap: "20px", alignItems: "flex-start", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "40px" }), I.widget(k, I.livretCatalogue({ fond: "#5a3a22", bord: "#150d08", accent: MO, clair: "#fbefd8", angle: 5 }), { width: "250px", flexShrink: 0, marginTop: "-56px", marginBottom: "-14px", marginRight: "40px" })], { backgroundColor: MO, width: "100%", gap: "8px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", boxSizing: "border-box", borderRadius: "0px" });
    carte.states = { hover: { transform: { y: -4 } } };
    const milieu = G.bande(k, [carte], { fond: CA, colonne: true, padV: ["96px", "80px", "72px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Carte d'appel" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#d8c3a4", liens: LA, sansCookies: true })(k, env);
    const filet = G.bande(k, [mentions], { fond: CA, colonne: true, gap: "0px", padV: ["20px", "18px", "16px"], padB: ["20px", "18px", "16px"], padH: PH, filetHaut: { epaisseur: "1px", couleur: "#fbefd833" }, nom: "Mentions" });
    filet.styles.desktop.color = LA;
    const monu = G.bande(k, [I.widget(k, I.motMonument("GRANGE", "#c99b06", 0.72, 1.35))], { fond: CA, colonne: true, padV: ["16px", "12px", "12px"], padB: ["0px", "0px", "0px"], padH: PH, max: "100%", nom: "Mot monumental" });
    return [G.racine(k, [milieu, haut, filet, monu])];
  },
}, FAM);

// ═══ ft2-335 « Sommaire gourmand » — cave à manger (capture 17 : noir pur, très grands mots légers, grande marque rognée, ici un verre sous halo orange) ═══
const sommaire = identite({
  key: "c335", label: "Noir encre et orange", humeur: "dark",
  fond: "#0a0a0a", texte: "#f5efe4", discret: "#b6aea0", accent: "#ff7a2f", surface: "#1a1a1a", encre: "#0a0a0a", surEncre: "#f5efe4",
  police: "font.instrument-sans", titres: "font.instrument-serif", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "0px", ligne: "#f5efe433",
});
const sommaireGourmand = modeleV2({
  id: identifiantV2(335, "sommaire-gourmand"), concept: "c-335-sommaire-gourmand", name: "Sommaire gourmand", family: FAM,
  description: "Pour une cave à manger : noir pur, cinq très grands mots fins avec flèche à gauche, à droite un grand verre à pied dessiné sous un halo orange et rogné par le bas, puis trois colonnes d'infos.",
  tags: ["cave à manger", "grands mots", "verre dessiné", "halo orange", "noir", "angles droits"],
  identity: sommaire, racine: racineDe("#0a0a0a"),
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S, EC = "#f5efe4", OR = "#ff7a2f";
    const l = (t, u) => ligneIndex(k, t, u, { taille: 0, police: S.head, couleur: EC, survolCouleur: OR, focus: OR, filet: "#f5efe426", h: "100px", extra: { fontSize: "fluid:38-80" } });
    const lignes = k.col([caps(k, "Ce qui est à la carte", { couleur: OR, suivi: "0.24em" }), l("Fromages affinés", "/catalogue"), l("Charcuteries", "/catalogue"), l("Vins nature", "/catalogue"), l("Planches et assiettes", "/catalogue"), l("Privatiser la cave", "/contact")], { gap: "0px", alignItems: "stretch", flexGrow: 3, flexBasis: "420px", minWidth: "280px" });
    souffle(lignes.children[1], 6000);
    const verre = k.col([I.widget(k, I.marqueVerre(OR, "#4a2a18", "#0a0a0a"), { width: "100%", maxWidth: "380px" })], { flexGrow: 1, flexBasis: "260px", minWidth: "220px", alignSelf: "stretch", justifyContent: "flex-end", alignItems: "center" });
    const haut = G.bande(k, [lignes, verre], { fond: "#0a0a0a", gap: "24px 48px", aligne: "stretch", padV: ["80px", "60px", "44px"], padB: ["0px", "0px", "0px"], padH: PH, nom: "Sommaire et verre" });
    const bloc = (t, w) => k.col([caps(k, t, { couleur: OR, taille: "13px" }), w], { flexGrow: 1, flexBasis: "240px", gap: "10px", alignItems: "flex-start" });
    const rs = reseauxT(G, k, env, { couleur: EC, survol: OR, focus: OR, taille: 15 });
    const info = k.row([bloc("Nous trouver", coordonnees(k, { couleur: EC, lien: EC, survol: OR, focus: OR, taille: 14 })), bloc("Ouverture", horaires(k, { couleur: EC, taille: 14 })), bloc("Nous suivre", rs)], { gap: "28px 56px", alignItems: "flex-start", width: "100%" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#b6aea0", liens: EC, sansCookies: true })(k, env);
    const bas = G.bande(k, [info, mentions], { fond: "#0a0a0a", colonne: true, gap: "28px", padV: ["40px", "32px", "28px"], padB: ["24px", "20px", "18px"], padH: PH, filetHaut: { epaisseur: "1px", couleur: "#f5efe426" }, nom: "Infos" });
    bas.styles.desktop.color = EC;
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══ ft2-336 « Du champ à la table » — producteur-boutique (capture 16 : nuit à halo, titre, pastilles hexagonales, ici bande de collines ondulées) ═══
const frise = identite({
  key: "c336", label: "Forêt profond et or vert", humeur: "dark",
  fond: "#0f2418", texte: "#eef3dc", discret: "#b8c8a6", accent: "#d7e36a", surface: "#173626", encre: "#0f2418", surEncre: "#eef3dc",
  police: "font.dm-sans", titres: "font.young-serif", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#eef3dc33",
});
const champTable = modeleV2({
  id: identifiantV2(336, "du-champ-a-la-table"), concept: "c-336-du-champ-a-la-table", name: "Du champ à la table", family: FAM,
  description: "Pour un producteur-boutique : fond vert forêt en dégradé, grand titre, quatre étapes en pastilles hexagonales (producteurs, atelier, boutique, table) et une large bande de collines à sillons ondulés avec grange et arbres.",
  tags: ["producteur", "boutique", "pastilles hexagonales", "collines ondulées", "paysage dessiné", "vert forêt", "angles droits"],
  identity: frise, racine: racineDe("#0f2418"),
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S, CL = "#eef3dc", LI = "#d7e36a";
    const titre = G.geant("<p>Du champ<br>à la table.</p>", { taille: [40, 88], tablette: { taille: [52, 72] }, mobile: { taille: [38, 48] }, lh: 1.02, suivi: "-0.01em", poids: "400", police: S.head, couleur: CL })(k, env);
    const intro = k.T("<p>Légumes, fromages et pains de la ferme, vendus à la boutique de l'exploitation.</p>", { fontSize: "16px", lineHeight: 1.65, color: "#b8c8a6", fontFamily: S.font, maxWidth: "360px" });
    const gauche = k.col([titre, intro], { flexGrow: 3, flexBasis: "360px", minWidth: "280px", gap: "18px", alignItems: "flex-start" });
    const etape = (g, fond, trait, t, u) => k.col([I.widget(k, I.hexBadge(g, fond, trait, LI), { width: "72px" }), lien(k, t, u, { taille: 20, poids: "400", police: S.head, couleur: CL, survol: { color: LI, transform: { y: -3 } }, focus: LI })], { flexGrow: 1, flexBasis: "130px", minWidth: "110px", gap: "6px", alignItems: "flex-start" });
    const etapes = k.row([etape("epi", LI, "#0f2418", "Producteurs", "/blog"), etape("feuille", "#173626", LI, "Atelier", "/catalogue"), etape("bocal", "#173626", LI, "Boutique", "/boutique"), etape("fromage", "#173626", LI, "Votre table", "/catalogue")], { gap: "20px 24px", alignItems: "flex-start", flexGrow: 4, flexBasis: "480px", minWidth: "280px" });
    souffle(etapes.children[0], 3600);
    const haut = G.bande(k, [gauche, etapes], { fond: "#0f2418", degrade: { from: "#1f5133", to: "#0a1a11", angle: 175 }, gap: "36px 56px", aligne: "flex-start", padV: ["80px", "60px", "44px"], padB: ["44px", "36px", "28px"], padH: PH, nom: "Titre et étapes" });
    const paysage = G.bande(k, [I.widget(k, I.collinesSillons("#0f2418", "#5f9a52", "#3f7a48", "#0f2418", "#1f5133", "#d7e36a"))], { fond: "#1f5133", colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Collines" });
    const bloc = (t, w) => k.col([caps(k, t, { couleur: LI, taille: "13px" }), w], { flexGrow: 1, flexBasis: "260px", gap: "8px", alignItems: "flex-start" });
    const info = k.row([bloc("La boutique", coordonnees(k, { couleur: CL, lien: CL, survol: LI, focus: LI, taille: 14 })), bloc("Horaires", horaires(k, { couleur: CL, taille: 14 })), bloc("Liens", k.col([["Producteurs", "/blog"], ["Boutique", "/boutique"], ["Contact", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 15, couleur: CL, survol: { color: LI }, focus: LI })), { gap: "0px", alignItems: "flex-start" }))], { gap: "20px 56px", alignItems: "flex-start", width: "100%" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#b8c8a6", liens: CL, sansCookies: true })(k, env);
    const bas = G.bande(k, [info, mentions], { fond: "#0f2418", colonne: true, gap: "28px", padV: ["40px", "32px", "28px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Infos" });
    bas.styles.desktop.color = CL;
    return [G.racine(k, [haut, paysage, bas])];
  },
}, FAM);

// ═══ ft2-337 « Escalier de cave » — vins et spiritueux (capture 17 : noir, colonnes, immense marque géométrique rognée : voûtes et casier) ═══
const escalier = identite({
  key: "c337", label: "Noir et grenat", humeur: "dark",
  fond: "#0c0709", texte: "#f6ead9", discret: "#cdb4a5", accent: "#e0a35a", surface: "#1d0c12", encre: "#0c0709", surEncre: "#f6ead9",
  police: "font.hanken-grotesk", titres: "font.bodoni-moda", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f6ead933",
});
const escalierCave = modeleV2({
  id: identifiantV2(337, "escalier-de-cave"), concept: "c-337-escalier-de-cave", name: "Escalier de cave", family: FAM,
  description: "Pour un caviste : noir profond, nom en grand, trois colonnes (vins, spiritueux, lettre d'information) et une immense marque de voûtes concentriques avec casier de bouteilles, en grenat et sable, rognée par le bas.",
  tags: ["caviste", "vins", "voûtes", "casier de bouteilles", "marque géométrique", "noir", "grenat", "lettre d'information", "angles droits"],
  identity: escalier, racine: racineDe("#0c0709"),
  widgets: ["html", "text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = sk(k0);
    const S = k.S, CR = "#f6ead9", SA = "#d9b88f", GR = "#c4455a";
    const nom = k.T("<p>Cave des<br>Trois Marches</p>", { fontFamily: S.head, fontSize: "fluid:40-80", lineHeight: 1, fontWeight: "600", color: CR });
    const abo = abonnement(k, env, { titre: "La lettre de la cave", intro: "Arrivages, dégustations, accords du mois.", bouton: "Je m'abonne", largeur: "420px", accent: SA, texte: CR });
    abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: "#e6d3c3" };
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: SA };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: "#0c0709" };
    abo.parts.button.states = { hover: { backgroundColor: "#ffffff", color: "#0c0709" }, focus: GK.focus("#ffffff") };
    const gauche = nom;
    const colAbo = k.col([abo], { flexGrow: 3, flexBasis: "360px", minWidth: "280px", alignItems: "flex-start" });
    const c1 = colLiens(k, G, "Vins", [["Bordeaux", "/catalogue"], ["Bourgogne", "/catalogue"], ["Loire", "/catalogue"], ["Champagnes", "/catalogue"]], { titre: SA, couleur: CR, survol: SA });
    const c2 = colLiens(k, G, "La cave", [["Spiritueux", "/catalogue"], ["Accords", "/catalogue"], ["Dégustations", "/catalogue"], ["Contact", "/contact"]], { titre: SA, couleur: CR, survol: SA });
    const haut = G.bande(k, [gauche, c1, c2, colAbo], { fond: "#0c0709", gap: "40px 48px", aligne: "flex-start", padV: ["88px", "68px", "48px"], padB: ["56px", "44px", "32px"], padH: PH, nom: "Nom, lettre et colonnes" });
    const marque = G.bande(k, [I.widget(k, I.marqueVoute("#4a1623", SA, "#0c0709"), { maxWidth: "820px", marginLeft: "auto", marginRight: "auto" })], { fond: "#0c0709", colonne: true, aligne: "center", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: PH, nom: "Voûtes" });
    souffle(marque.children[0].children[0], 6000);
    const mentions = G.ligneLegale({ taille: 13, couleur: "#cdb4a5", liens: CR, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: "#1d0c12", colonne: true, gap: "0px", padV: ["26px", "22px", "20px"], padB: ["24px", "20px", "18px"], padH: PH, filetHaut: { epaisseur: "2px", couleur: SA }, nom: "Mentions" });
    bas.styles.desktop.color = CR;
    return [G.racine(k, [haut, marque, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Gastronomie et épicerie fine", target: 6, built: true,
  description: "Pieds inspirés de captures, angles droits, animations fluides : épicerie fine, traiteur, produits du terroir, cave à manger, producteur-boutique, caviste.",
  models: [damierMarche, deuxAssiettes, panierXXL, sommaireGourmand, champTable, escalierCave],
};
