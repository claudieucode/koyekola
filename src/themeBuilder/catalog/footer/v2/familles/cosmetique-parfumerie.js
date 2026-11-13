// Famille v2 « Cosmétique et parfumerie » — 6 modèles (ft2-320 à ft2-325), pieds « inspirés de captures » : ANGLES DROITS partout.
// Marques fictives (Essence, Ambre & Sauge, Quatre gestes, Maison Aurèle, Néroli Lab, Rosée) ; aucune coordonnée ni chiffre inventé : horaires, adresse et téléphone viendraient des Données de l'entreprise du site.
// Rubriques (Parfums, Soins…) = intitulés d'EXEMPLE à renommer dans l'éditeur ; adresses de réseaux = exemples.
// Archétypes : 320 G (index en lignes) · 321 H (mosaïque asymétrique) · 322 I (frise en étapes) · 323 J (papier à en-tête) · 324 K (fenêtre / console) · 325 L (gradins).
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; une animation visible par modèle (ligne qui s'indente et se remplit, carré qui respire, curseur qui respire) ; pas d'animation d'entrée.
const { modeleV2, identifiantV2 } = require("../kit-v2");
const A = require("../aides-a04");
const { identite, GK, DOUX, PAD, racineDe, lien, caps, texte, trait, souffle, carre, bloc, mentions, reseaux, abonnement, horaires, coordonnees } = A;
const FAM = "cosmetique-parfumerie";

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-320 « Index des essences » — maison de parfum. Archétype G : sommaire en lignes pleine largeur (grand libellé, flèche, filet), sans cartes (inspiré d'une capture : marque à gauche, grandes listes de liens à droite).
const essence = identite({ key: "i320", label: "Ivoire et vin", humeur: "light", fond: "#f7f1e8", texte: "#2a1a1f", discret: "#6b5560", accent: "#7a1f3d", surface: "#efe6d8", encre: "#f7f1e8", surEncre: "#2a1a1f", police: "font.jost", titres: "font.cormorant-garamond", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#2a1a1f33" });
const essenceMod = modeleV2({
  id: identifiantV2(320, "index-des-essences"), concept: "c-320-index-des-essences", name: "Index des essences", family: FAM,
  description: "Pour une maison de parfum : un sommaire en six grandes lignes pleine largeur (parfums, soins, maquillage, corps, coffrets, conseils), chacune avec flèche et filet, qui s'indente et se remplit de vin au survol. Ivoire et vin.",
  tags: ["parfumerie", "index", "sommaire", "grandes lignes", "ivoire", "vin", "angles droits"],
  identity: essence, racine: racineDe("#f7f1e8"), widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const S = k.S, IV = "#f7f1e8", VIN = "#7a1f3d", INK = "#2a1a1f";
    const tete = G.ligne(k, [k.T("<p>Essence</p>", { fontSize: "30px", fontFamily: S.head, fontWeight: "600", color: INK, lineHeight: 1.1, letterSpacing: "0.02em" }), caps(k, "Maison de parfum — l'index", { couleur: "#6b5560", suivi: "0.22em" })], { gap: "8px 32px", aligne: "baseline", justifie: "space-between", largeur: "100%" });
    const ligneIdx = (t, u, premier) => lien(k, `${t} →`, u, { taille: 40, poids: "500", police: S.head, couleur: INK, bloc: true, h: "88px", survol: { backgroundColor: VIN, color: IV, paddingLeft: "28px" }, focus: INK, extra: { width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderTopWidth: premier ? "1px" : "0px", borderColor: "#2a1a1f55", paddingLeft: "0px", boxSizing: "border-box" } });
    const lignes = k.col([["Parfums", "/boutique"], ["Soins du visage", "/boutique"], ["Maquillage", "/boutique"], ["Corps et bain", "/boutique"], ["Coffrets cadeaux", "/boutique"], ["Conseils et livraison", "/faq"]].map(([t, u], i) => k.row([ligneIdx(t, u, i === 0)], { width: "100%", justifyContent: "space-between", flexGrow: 1.3, flexWrap: "nowrap" })), { gap: "0px", alignItems: "stretch", width: "100%" }, undefined, undefined);
    const entete = G.bande(k, [tete], { fond: IV, colonne: true, padV: ["56px", "44px", "36px"], padB: ["40px", "32px", "24px"], padH: PAD, nom: "Marque" });
    const haut = G.bande(k, [lignes], { fond: IV, colonne: true, padV: ["0px", "0px", "0px"], padB: ["24px", "20px", "16px"], padH: PAD, nom: "Index" });
    const bas = G.bande(k, [reseaux(k, env, { couleur: INK, survol: VIN, focus: VIN }), mentions(k, env, { couleur: "#6b5560", liens: INK })], { fond: IV, gap: "16px 40px", aligne: "center", padV: ["20px", "18px", "16px"], padB: ["24px", "20px", "18px"], padH: PAD, nom: "Mentions" });
    bas.styles.desktop.color = "#6b5560";
    return [G.racine(k, [entete, haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-321 « Mosaïque d'ambre » — cosmétique naturelle. Archétype H : une grande case verte (nom + lettre) et trois cases plus petites de couleurs différentes (contact, horaires, liens et réseaux) ; inspiré d'une capture aux coordonnées + réseaux à gauche.
const ambre = identite({ key: "i321", label: "Vert sapin, sable, sauge et pêche", humeur: "dark", fond: "#1f3b2d", texte: "#f5efe3", discret: "#cfdccf", accent: "#e9c9a0", surface: "#294a39", encre: "#1f3b2d", surEncre: "#f5efe3", police: "font.dm-sans", titres: "font.fraunces", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f5efe33a" });
const ambreMod = modeleV2({
  id: identifiantV2(321, "mosaique-d-ambre"), concept: "c-321-mosaique-d-ambre", name: "Mosaïque d'ambre", family: FAM,
  description: "Pour une marque de cosmétique naturelle : une grande case vert sapin avec le nom et la lettre d'information, et trois cases de couleurs différentes (sable : contact, sauge : horaires, pêche : liens et réseaux). Mosaïque à angles droits.",
  tags: ["cosmétique naturelle", "mosaïque", "cases asymétriques", "contact", "horaires", "lettre", "vert", "angles droits"],
  identity: ambre, racine: racineDe("#1f3b2d"), widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const S = k.S, V = "#1f3b2d", CR = "#f5efe3", AM = "#e9c9a0";
    const pad = (h, v) => ({ boxSizing: "border-box", paddingTop: v, paddingBottom: v, paddingLeft: h, paddingRight: h });
    const nom = k.row([souffle(carre(k, AM, "14px"), 3200), k.T("<p>Ambre &amp; Sauge</p>", { fontSize: "40px", fontFamily: S.head, fontWeight: "600", color: CR, lineHeight: 1.1 })], { gap: "14px", flexWrap: "nowrap" });
    const mot = texte(k, "Soins du visage et du corps à base de plantes, pensés pour une routine simple.", { taille: 16, couleur: "#cfdccf", largeur: "360px" });
    const abo = abonnement(k, env, { titre: "La lettre de l'atelier", intro: "Nouveautés et conseils de saison.", bouton: "Je m'abonne", largeur: "100%", accent: AM, texte: CR, titreC: AM, introC: "#cfdccf", boutonC: V, boutonH: [CR, V] });
    const grande = k.col([k.col([nom, mot], { gap: "16px" }), abo], { flexGrow: 1.1, flexBasis: "380px", minWidth: "280px", minHeight: "440px", backgroundColor: V, justifyContent: "space-between", gap: "40px", alignItems: "stretch", ...pad("48px", "64px") }, pad("32px", "48px"), pad("20px", "40px"));
    const sable = k.col([caps(k, "Nous trouver", { couleur: "#6b3f12" }), coordonnees(k, { couleur: "#2b2218", lien: "#2b2218", survol: "#6b3f12", focus: "#6b3f12" })], { flexGrow: 1, flexBasis: "240px", minWidth: "220px", backgroundColor: "#e9d8c4", gap: "14px", alignItems: "flex-start", ...pad("32px", "36px") }, pad("28px", "32px"), pad("20px", "28px"));
    const sauge = k.col([caps(k, "Horaires", { couleur: "#1f3b2d" }), horaires(k, { couleur: "#1f3b2d" })], { flexGrow: 1, flexBasis: "240px", minWidth: "220px", backgroundColor: "#c9d6b8", gap: "14px", alignItems: "flex-start", ...pad("32px", "36px") }, pad("28px", "32px"), pad("20px", "28px"));
    const lk = [["Visage", "/boutique"], ["Corps", "/boutique"], ["Livraison", "/faq"], ["Contact", "/contact"]].map(([a, u]) => lien(k, a, u, { taille: 18, poids: "700", police: S.head, couleur: "#3a1d10", padH: "0px", survol: { color: "#7a2e0a", transform: { x: 5 } }, focus: "#3a1d10" }));
    const peche = k.col([k.row(lk, { gap: "4px 28px", alignItems: "center", flexWrap: "wrap" }), reseaux(k, env, { couleur: "#3a1d10", survol: "#7a2e0a", focus: "#3a1d10" })], { backgroundColor: "#f3b89c", gap: "10px", alignItems: "flex-start", ...pad("32px", "28px") }, pad("28px", "24px"), pad("20px", "20px"));
    const droite = k.col([k.row([sable, sauge], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%", flexGrow: 1.25 }), peche], { flexGrow: 2, flexBasis: "520px", minWidth: "280px", gap: "0px", alignItems: "stretch" });
    const mosaique = G.bande(k, [k.row([grande, droite], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" })], { fond: V, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Mosaïque" });
    const bas = G.bande(k, [mentions(k, env, { couleur: "#cfdccf", liens: CR })], { fond: V, colonne: true, padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: PAD, nom: "Mentions" });
    bas.styles.desktop.color = "#cfdccf";
    return [G.racine(k, [mosaique, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-322 « Quatre gestes » — soin et beauté. Archétype I : frise horizontale en quatre étapes à points carrés dorés (choisir, essayer, offrir, prendre soin).
const gestes = identite({ key: "i322", label: "Bleu nuit, ivoire et or", humeur: "dark", fond: "#0e1a2b", texte: "#f2ead7", discret: "#c3cbd8", accent: "#e2b857", surface: "#16263d", encre: "#0e1a2b", surEncre: "#f2ead7", police: "font.jost", titres: "font.playfair-display", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#f2ead933" });
const gestesMod = modeleV2({
  id: identifiantV2(322, "quatre-gestes"), concept: "c-322-quatre-gestes", name: "Quatre gestes", family: FAM,
  description: "Pour une marque de soins : une frise horizontale en quatre étapes à points carrés dorés (choisir, essayer, offrir, prendre soin), chaque étape est un lien avec sa phrase, puis réseaux et mentions. Bleu nuit, ivoire et or.",
  tags: ["soin", "beauté", "frise", "étapes", "points carrés", "bleu nuit", "or", "angles droits"],
  identity: gestes, racine: racineDe("#0e1a2b"), widgets: ["text", "link", "copyright", "bizlegal", "divider"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const S = k.S, N = "#0e1a2b", IV = "#f2ead7", OR = "#e2b857";
    const titre = G.geant(`<p>Quatre gestes,<br>un seul soin.</p>`, { taille: [44, 84], tablette: { taille: [56, 72] }, mobile: { taille: [40, 52] }, lh: 1, suivi: "-0.01em", poids: "500", police: S.head, couleur: IV })(k, env);
    const etape = (n, nom, url, phrase, i) => {
      const pt = carre(k, OR, "16px"); if (i === 0) souffle(pt, 3000);
      const ligne = k.row([pt, k.col([], { height: "2px", flexGrow: 1, backgroundColor: OR, borderRadius: "0px", minWidth: "20px" })], { gap: "0px", flexWrap: "nowrap", width: "100%", alignItems: "center" });
      const l = lien(k, nom, url, { taille: 26, poids: "500", police: S.head, couleur: IV, padH: "0px", survol: { color: OR, transform: { x: 6 } }, focus: OR });
      return k.col([ligne, k.col([caps(k, `Étape ${n}`, { couleur: OR, suivi: "0.22em" }), k.col([l, texte(k, phrase, { taille: 15, couleur: "#c3cbd8", largeur: "240px" })], { gap: "6px", flexGrow: 0.8, justifyContent: "space-between" })], { gap: "10px", justifyContent: "space-between", alignItems: "flex-start" })], { flexGrow: 1 + i * 0.15, flexBasis: "220px", minWidth: "200px", gap: "14px", alignItems: "flex-start" });
    };
    const frise = k.row([etape("1", "Choisir", "/blog", "Trouver la routine qui convient à sa peau.", 0), etape("2", "Essayer", "/contact", "Demander un conseil ou un échantillon.", 1), etape("3", "Offrir", "/boutique", "Composer un coffret pour quelqu'un.", 2), etape("4", "Prendre soin", "/faq", "Les gestes et les bons usages, pas à pas.", 3)], { gap: "40px 32px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" });
    const entete = G.bande(k, [titre], { fond: N, colonne: true, padV: ["80px", "64px", "48px"], padB: ["56px", "48px", "36px"], padH: PAD, nom: "Titre" });
    const haut = G.bande(k, [frise], { fond: N, colonne: true, padV: ["0px", "0px", "0px"], padB: ["56px", "48px", "36px"], padH: PAD, nom: "Frise" });
    const bas = G.bande(k, [reseaux(k, env, { couleur: IV, survol: OR, focus: OR }), trait(k, "#f2ead933"), mentions(k, env, { couleur: "#c3cbd8", liens: IV })], { fond: N, colonne: true, gap: "18px", padV: ["8px", "8px", "8px"], padB: ["28px", "24px", "20px"], padH: PAD, nom: "Mentions" });
    bas.styles.desktop.color = "#c3cbd8";
    return [G.racine(k, [entete, haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-323 « Papier de parfumeur » — parfumeur indépendant. Archétype J : papier à en-tête, cartouche centré entre filets doubles, liens en ligne centrée.
const aurele = identite({ key: "i323", label: "Papier blanc cassé, encre bleue et or vieilli", humeur: "light", fond: "#fbfaf6", texte: "#1d2a3a", discret: "#55606e", accent: "#7a5f22", surface: "#f1efe6", encre: "#fbfaf6", surEncre: "#1d2a3a", police: "font.libre-caslon-text", titres: "font.cormorant-sc", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "0px", ligne: "#1d2a3a40" });
const aureleMod = modeleV2({
  id: identifiantV2(323, "papier-de-parfumeur"), concept: "c-323-papier-de-parfumeur", name: "Papier de parfumeur", family: FAM,
  description: "Pour un parfumeur indépendant : un pied en papier à en-tête, filets doubles, nom en petites capitales, coordonnées centrées, liens sur une seule ligne et mentions légales. Blanc cassé, encre bleue et or vieilli.",
  tags: ["parfumeur", "papier à en-tête", "centré", "filets doubles", "serif", "encre", "angles droits"],
  identity: aurele, racine: racineDe("#fbfaf6"), widgets: ["text", "link", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const S = k.S, P = "#fbfaf6", INK = "#1d2a3a", OR = "#7a5f22";
    const doubles = () => k.col([trait(k, INK, "1px"), trait(k, INK, "1px")], { gap: "5px", width: "100%" });
    const nom = k.T("<p>Maison Aurèle</p>", { fontSize: "52px", fontFamily: S.head, fontWeight: "500", color: INK, lineHeight: 1.1, letterSpacing: "0.14em", textAlign: "center" }, undefined, { fontSize: "34px" });
    const sous = caps(k, "Parfumeur indépendant", { couleur: OR, suivi: "0.3em", extra: { textAlign: "center" } });
    const adresse = coordonnees(k, { couleur: INK, lien: INK, survol: OR, focus: OR, taille: 16, police: S.font }); adresse.styles.desktop = { ...adresse.styles.desktop, textAlign: "center", maxWidth: "420px" };
    const liens = k.row([["Parfums", "/boutique"], ["Soins", "/boutique"], ["Coffrets", "/boutique"], ["Livraison", "/faq"], ["Contact", "/contact"]].map(([a, u]) => lien(k, a, u, { taille: 16, poids: "400", couleur: INK, soulign: false, padH: "10px", casse: "uppercase", suivi: "0.14em", survol: { color: OR, transform: { y: -3 } }, focus: OR })), { gap: "0px 14px", alignItems: "center", justifyContent: "center", flexWrap: "wrap" });
    const cartouche = k.col([souffle(carre(k, OR, "10px"), 3200), k.col([nom, sous], { gap: "10px", alignItems: "center", flexGrow: 0.6 }), k.row([adresse], { justifyContent: "center", width: "100%" }), liens], { gap: "20px", alignItems: "center", width: "100%" });
    const haut = G.bande(k, [doubles(), cartouche, doubles(), mentions(k, env, { couleur: "#55606e", liens: INK, centre: true })], { fond: P, colonne: true, gap: "40px", aligne: "center", padV: ["64px", "52px", "40px"], padB: ["28px", "24px", "20px"], padH: PAD, max: "900px", nom: "Papier à en-tête" });
    haut.styles.desktop.color = "#55606e";
    return [G.racine(k, [haut])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-324 « Console du laboratoire » — laboratoire de cosmétique. Archétype K : le pied est une fenêtre (barre de titre à trois carrés, lignes de commande pour les liens, abonnement à droite).
const nerolilab = identite({ key: "i324", label: "Nuit, menthe et blanc", humeur: "dark", fond: "#0b0f14", texte: "#e4fbf3", discret: "#8fb8aa", accent: "#6ff2c2", surface: "#101820", encre: "#0b0f14", surEncre: "#e4fbf3", police: "font.dm-mono", titres: "font.space-grotesk", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#6ff2c240" });
const nerolilabMod = modeleV2({
  id: identifiantV2(324, "console-du-laboratoire"), concept: "c-324-console-du-laboratoire", name: "Console du laboratoire", family: FAM,
  description: "Pour un laboratoire de cosmétique : le pied est une fenêtre à bord menthe, barre de titre à trois carrés, liens en lignes de commande à gauche et formulaire d'abonnement à droite. Nuit, menthe, texte monospace.",
  tags: ["laboratoire", "cosmétique", "console", "fenêtre", "monospace", "menthe", "formulaire", "angles droits"],
  identity: nerolilab, racine: racineDe("#0b0f14"), widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const S = k.S, NUIT = "#0b0f14", FEN = "#101820", ME = "#6ff2c2", TX = "#e4fbf3";
    const barre = k.row([k.T("<p>neroli-lab / formules.txt</p>", { fontSize: "14px", fontWeight: "700", color: NUIT, fontFamily: S.font, lineHeight: 1.3 }), k.row([carre(k, NUIT, "12px"), carre(k, NUIT, "12px"), carre(k, NUIT, "12px")], { gap: "8px", flexWrap: "nowrap" })], { gap: "12px", justifyContent: "space-between", flexWrap: "nowrap", backgroundColor: ME, width: "100%", boxSizing: "border-box", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "16px", paddingRight: "16px" });
    const cmd = (t, u) => lien(k, `› ${t}`, u, { taille: 17, poids: "500", couleur: TX, padH: "0px", survol: { color: ME, transform: { x: 8 } }, focus: ME });
    const curseur = souffle(k.col([], { width: "12px", height: "22px", backgroundColor: ME, borderRadius: "0px" }), 1800);
    const gauche = k.col([k.row([k.T("<p>$ ls rayons/</p>", { fontSize: "15px", color: "#8fb8aa", fontFamily: S.font }), curseur], { gap: "10px", flexWrap: "nowrap" }), ...[["parfums", "/boutique"], ["soins-du-visage", "/boutique"], ["corps", "/boutique"], ["livraison", "/faq"], ["contact", "/contact"]].map(([t, u]) => cmd(t, u))], { flexGrow: 1, flexBasis: "260px", minWidth: "220px", gap: "0px", alignItems: "flex-start" });
    const abo = abonnement(k, env, { titre: "$ recevoir --formule", intro: "Nouvelles formules et conseils d'usage, par e-mail.", bouton: "Envoyer", largeur: "100%", accent: ME, texte: TX, titreC: ME, introC: "#8fb8aa", boutonC: NUIT, boutonH: [TX, NUIT] });
    const droite = k.col([abo], { flexGrow: 1.2, flexBasis: "320px", minWidth: "260px", gap: "12px", alignItems: "stretch" });
    const corps = k.row([gauche, droite], { gap: "32px 56px", alignItems: "flex-start", flexWrap: "wrap", backgroundColor: FEN, width: "100%", boxSizing: "border-box", paddingTop: "36px", paddingBottom: "40px", paddingLeft: "32px", paddingRight: "32px" }, { paddingLeft: "24px", paddingRight: "24px" }, { paddingLeft: "16px", paddingRight: "16px", paddingTop: "28px" });
    const fenetre = k.col([barre, corps], { gap: "0px", width: "100%", alignItems: "stretch", borderStyle: "solid", borderWidth: "2px", borderColor: ME, boxSizing: "border-box" });
    const haut = G.bande(k, [fenetre], { fond: NUIT, colonne: true, padV: ["72px", "56px", "40px"], padB: ["32px", "28px", "24px"], padH: PAD, max: "1080px", nom: "Fenêtre" });
    const bas = G.bande(k, [reseaux(k, env, { couleur: TX, survol: ME, focus: ME }), mentions(k, env, { couleur: "#8fb8aa", liens: TX })], { fond: NUIT, gap: "16px 40px", aligne: "center", padV: ["8px", "8px", "8px"], padB: ["32px", "28px", "24px"], padH: PAD, nom: "Mentions" });
    bas.styles.desktop.color = "#8fb8aa";
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-325 « Gradins de rosée » — marque de soin rosé. Archétype L : pied en escalier, quatre bandes de largeurs décroissantes (100, 80, 60, 40 %) alignées à gauche, de rose clair à rose profond.
const rosee = identite({ key: "i325", label: "Rose poudré dégradé en gradins", humeur: "light", fond: "#fbf3ef", texte: "#2b1512", discret: "#5b3a33", accent: "#7a2b1e", surface: "#f4d9d0", encre: "#fbf3ef", surEncre: "#2b1512", police: "font.libre-franklin", titres: "font.italiana", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#2b151240" });
const roseeMod = modeleV2({
  id: identifiantV2(325, "gradins-de-rosee"), concept: "c-325-gradins-de-rosee", name: "Gradins de rosée", family: FAM,
  description: "Pour une marque de soin : un pied en escalier de quatre bandes alignées à gauche, de plus en plus étroites et de plus en plus rosées : nom et phrase, liens, contact et horaires, puis mentions. Angles droits, tons de rose poudré.",
  tags: ["soin", "rose", "escalier", "bandes décroissantes", "gradins", "contact", "horaires", "angles droits"],
  identity: rosee, racine: racineDe("#fbf3ef"), widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const S = k.S, INK = "#2b1512", BR = "#7a2b1e";
    const marche = (largeur, fond, enfants, vert) => k.col(enfants, { width: largeur, backgroundColor: fond, boxSizing: "border-box", paddingTop: vert, paddingBottom: vert, paddingLeft: "48px", paddingRight: "48px", gap: "20px", alignItems: "flex-start" }, { width: "100%", paddingLeft: "32px", paddingRight: "32px" }, { width: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "32px", paddingBottom: "32px" });
    const nom = G.geant(`<p>Rosée</p>`, { taille: [64, 140], tablette: { taille: [80, 110] }, mobile: { taille: [64, 84] }, lh: 0.95, suivi: "0.01em", poids: "400", police: S.head, couleur: INK })(k, env);
    const mot = texte(k, "Soins du visage et du corps, doux et simples, pour toutes les peaux.", { taille: 17, couleur: "#5b3a33", largeur: "420px" });
    const m1 = marche("100%", "#f4d9d0", [k.row([souffle(carre(k, BR, "14px"), 3200), caps(k, "Maison de soin", { couleur: BR, suivi: "0.26em" })], { gap: "12px", flexWrap: "nowrap" }), k.row([k.col([nom], { flexGrow: 1.6 }), k.col([mot], { flexGrow: 0.7, justifyContent: "flex-end", alignSelf: "flex-end" })], { gap: "24px 56px", justifyContent: "space-between", alignItems: "flex-end", width: "100%" })], "64px");
    const liens = k.row([["Visage", "/boutique"], ["Corps", "/boutique"], ["Coffrets", "/boutique"], ["Livraison", "/faq"], ["Conseils", "/blog"]].map(([a, u]) => lien(k, a, u, { taille: 17, poids: "600", couleur: INK, soulign: true, survol: { color: BR, transform: { y: -3 } }, focus: BR })), { gap: "4px 32px", alignItems: "center", flexWrap: "wrap" });
    const m2 = marche("80%", "#eac0b3", [caps(k, "Parcourir", { couleur: INK }), liens, reseaux(k, env, { couleur: INK, survol: BR, focus: BR })], "40px");
    const m3 = marche("60%", "#dda494", [k.row([bloc(k, "Contact", [coordonnees(k, { couleur: INK, lien: INK, survol: BR, focus: INK })], { couleurTitre: INK, min: "200px" }), bloc(k, "Horaires", [horaires(k, { couleur: INK })], { couleurTitre: INK, min: "200px" })], { gap: "24px 48px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" })], "36px");
    const m4 = marche("40%", "#c98678", [mentions(k, env, { couleur: INK, liens: INK })], "24px");
    const marches = k.col([m1, m2, m3, m4], { gap: "0px", alignItems: "flex-start", width: "100%" });
    const bande = G.bande(k, [marches], { fond: "#fbf3ef", colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Gradins" });
    bande.styles.desktop.color = INK;
    return [G.racine(k, [bande])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Cosmétique et parfumerie", target: 6, built: true,
  description: "Pieds inspirés de captures, angles droits, animations fluides : index en lignes, mosaïque, frise en étapes, papier à en-tête, console, gradins.",
  models: [essenceMod, ambreMod, gestesMod, aureleMod, nerolilabMod, roseeMod],
};
