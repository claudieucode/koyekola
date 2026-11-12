// Famille v2 « Industrie et logistique » — 5 modèles (ft2-131 à ft2-135), extension « carrée » : ANGLES DROITS partout (aucun border-radius), esprit technique et très professionnel.
// Usine, entrepôt, transport de marchandises, sous-traitance industrielle : plan d'atelier à cartouche, quai à bandes de sécurité sobres, pupitre de contrôle, chaîne logistique en cinq étapes, béton et rouge sécurité.
// Contenu utile et réel (coordonnées et horaires des « Données de l'entreprise », liens de la plateforme, lettre d'information, mentions légales) ; marques fictives ; AUCUNE coordonnée, AUCUN chiffre,
// AUCUN délai ni certificat inventé (les étapes et rubriques sont des EXEMPLES à renommer dans l'éditeur). Adresses de réseaux : exemples.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, filets qui s'épaississent, décalage de 2 à 8 px, carte qui se soulève) et au moins une animation visible
// par modèle : voyant carré qui « respire », bouton qui s'inverse, étape dont le trait se colore. Limites du moteur : pas d'animation d'ENTRÉE, pas de défilement continu.
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "industrie-logistique";
const DOUX = 360; // ms : transitions de survol / focus

// ── Aides LOCALES (toutes à angles droits) ───────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, transform: { x: 4 } }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
// petit carré plein (statut, repère) : jamais rond
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, borderRadius: "0px", flexShrink: 0 });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: o.icones === true, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px", extra: o.extra, mobile: o.mobile });
// Lettre d'information : habille toutes les parties du widget pour un fond précis (angles droits)
function lettre(k, env, G, o) {
  const abo = G.abonnement({ titre: o.titre, intro: o.intro, bouton: o.bouton || "S'abonner", largeur: o.largeur || "380px", accent: o.accent, texte: o.texte, rayonBouton: "0px", rayonChamp: "0px", soulignement: o.soulignement || "2px", survolBouton: o.survolBouton, survolTexte: o.survolTexte, fondChamp: o.fondChamp, rembChamp: o.rembChamp })(k, env);
  const P = abo.parts;
  P.title.styles.desktop = { ...P.title.styles.desktop, color: o.couleurTitre || o.texte, lineHeight: 1.4 };
  P.intro.styles.desktop = { ...P.intro.styles.desktop, color: o.texte };
  P.consent.styles.desktop = { ...P.consent.styles.desktop, color: o.texte };
  P.missing.styles.desktop = { ...P.missing.styles.desktop, color: o.texte };
  P.button.styles.desktop = { ...P.button.styles.desktop, color: o.surBouton, backgroundColor: o.accent, borderRadius: "0px", transitionDuration: DOUX };
  P.button.states = { hover: { backgroundColor: o.survolBouton || o.texte, color: o.survolTexte || o.fond, transform: { y: -2 } }, focus: GK.focus(o.focus || o.texte) };
  return abo;
}
const nomDuSite = (k, env, taille, couleur, extra = {}) => {
  const S = k.S, nom = Moteur.item(k, `title:${taille}`, env);
  nom.styles.desktop = { ...nom.styles.desktop, color: couleur, fontFamily: S.head, fontWeight: "700", letterSpacing: "-0.01em", lineHeight: 1.1, ...extra };
  nom.parts = { ...(nom.parts || {}), link: { ...((nom.parts || {}).link || {}), styles: { desktop: { color: couleur, textDecoration: "none" }, mobile: { display: "inline-block", minHeight: "44px", paddingTop: "10px", paddingBottom: "10px" } } } };
  return nom;
};

// Bande de petits carrés alternés (jaune / anthracite) : repère de sécurité sobre, statique, bords nets
const bandeSecurite = (k, c1, c2, n = 28, h = "12px") => k.row(Array.from({ length: n }, (_, i) => k.col([], { flexGrow: 1, flexBasis: "0px", minWidth: "0px", height: h, backgroundColor: i % 2 ? c2 : c1, borderRadius: "0px" })), { gap: "0px", flexWrap: "nowrap", width: "100%" });

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-131 « Plan d'atelier » — usine, atelier de fabrication, sous-traitance industrielle
// Idée : un PLAN DE FABRICATION. Fond bleu de plan, cadre à filet clair, nom du site en police à chasse fixe, légende numérotée des repères (liens), et en bas à droite le CARTOUCHE du plan : trois cases à contour
// (Pièce, Révision, Feuille) comme sur un dessin technique. Voyant carré qui « respire » devant « Site en ligne ». Contact et horaires dans la bande du dessous. Les valeurs du cartouche sont décoratives (aucun numéro de plan réel).
// Polices : IBM Plex Mono (titres, repères) et IBM Plex Sans. Mobile : légende sous le nom, cartouche pleine largeur.
const plan = identite({
  key: "c131", label: "Bleu de plan et cyan clair", humeur: "dark",
  fond: "#0a2540", texte: "#eaf3ff", discret: "#a9c4e6", accent: "#7fd4ff", surface: "#0e3157", encre: "#0a2540", surEncre: "#eaf3ff",
  police: "font.ibm-plex-sans", titres: "font.ibm-plex-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#7fd4ff55",
});
const BLEU = "#0a2540", BLEU2 = "#08203a", CYAN = "#7fd4ff", CLAIR = "#eaf3ff";

const planAtelier = modeleV2({
  id: identifiantV2(131, "plan-d-atelier"), concept: "c-131-plan-d-atelier",
  name: "Plan d'atelier", family: FAM,
  description: "Pour une usine ou un atelier de fabrication : fond bleu de plan, cadre à filet clair, nom en chasse fixe, légende de repères numérotés et cartouche à trois cases comme sur un dessin technique. Contact et horaires dessous.",
  tags: ["usine", "atelier", "plan technique", "cartouche", "bleu de plan", "chasse fixe", "angles droits"],
  identity: plan,
  racine: racineDe(BLEU2),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · le cadre du plan : nom + phrase à gauche, légende numérotée à droite, cartouche en bas à droite
    const pt = souffle(carre(k, CYAN, "10px"), 3000);
    const statut = k.row([pt, caps(k, "Site en ligne", { couleur: CYAN, police: S.head, suivi: "0.18em" })], { gap: "10px", alignItems: "center" });
    const nom = nomDuSite(k, env, 34, CLAIR, { fontFamily: S.head, fontWeight: "600" });
    const mot = k.T("<p>Fabrication, assemblage, contrôle : décrivez votre pièce ou votre besoin, nous étudions votre demande.</p>", { fontSize: "16px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, maxWidth: "420px" });
    const devis = lien(k, "Envoyer un plan ou un besoin", "/contact", { taille: 15, poids: "600", couleur: BLEU, h: "52px", padH: "26px", survol: { backgroundColor: CLAIR, color: BLEU, transform: { x: 6 } }, focus: CLAIR, extra: { backgroundColor: CYAN, justifyContent: "center", alignSelf: "flex-start" } });
    const gauche = G.colonne(k, [statut, nom, mot, devis], { poids: 6, min: "300px", gap: "18px" });
    const REP = [["01", "Accueil", "/"], ["02", "Actualités", "/blog"], ["03", "Questions fréquentes", "/faq"], ["04", "Nous contacter", "/contact"], ["05", "Espace client", "/connexion"]];
    const repere = ([num, t, u]) => {
      const l = lien(k, t, u, { taille: 17, poids: "500", couleur: CLAIR, survol: { color: CYAN, transform: { x: 8 } }, focus: CYAN, h: "44px", extra: { flexGrow: 1 } });
      return k.row([caps(k, num, { couleur: CYAN, police: S.head, suivi: "0.12em", extra: { minWidth: "28px" } }), l], { flexWrap: "nowrap", alignItems: "center", gap: "12px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#7fd4ff44", borderRadius: "0px" });
    };
    const legende = G.colonne(k, [caps(k, "Légende des repères", { couleur: CYAN, police: S.head, suivi: "0.18em", extra: { marginBottom: "10px" } }), ...REP.map(repere)], { poids: 5, min: "290px", gap: "0px" });
    const hautCadre = G.ligne(k, [gauche, legende], { gap: "36px 64px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const case3 = (cle, val, dernier) => k.col([caps(k, cle, { couleur: CYAN, police: S.head, taille: "11px", suivi: "0.16em" }), k.T(`<p>${val}</p>`, { fontFamily: S.head, fontSize: "15px", fontWeight: "600", color: CLAIR })], { flexGrow: 1, flexBasis: "0px", minWidth: "120px", gap: "4px", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "14px", paddingRight: "14px", borderStyle: "solid", borderWidth: "0px", borderRightWidth: dernier ? "0px" : "1px", borderColor: CYAN, borderRadius: "0px" });
    const cartoucheCases = k.row([case3("Pièce", "Pied de page"), case3("Révision", "A"), case3("Feuille", "1 / 1", true)], { gap: "0px", flexWrap: "wrap", maxWidth: "520px", width: "100%", borderStyle: "solid", borderWidth: "1px", borderColor: CYAN, borderRadius: "0px", alignSelf: "flex-end" }, undefined, { maxWidth: "100%", alignSelf: "stretch" });
    const cadre = k.col([hautCadre, cartoucheCases], { gap: "48px", width: "100%", borderStyle: "solid", borderWidth: "1px", borderColor: "#7fd4ffaa", borderRadius: "0px", paddingTop: "44px", paddingBottom: "28px", paddingLeft: "44px", paddingRight: "44px", backgroundColor: BLEU }, { paddingLeft: "28px", paddingRight: "28px" }, { paddingTop: "28px", paddingBottom: "20px", paddingLeft: "18px", paddingRight: "18px", gap: "32px" });
    const bandePlan = G.bande(k, [cadre], { fond: BLEU2, colonne: true, padV: ["64px", "48px", "32px"], padB: ["24px", "24px", "20px"], padH: ["48px", "32px", "16px"], nom: "Plan" });
    // 2 · contact, horaires, lettre, mentions
    const colContact = bloc(k, "Coordonnées", [coordonnees(k, { taille: 15, lien: CLAIR, survol: CYAN, focus: CYAN })], { couleurTitre: CYAN, police: S.head, suiviTitre: "0.18em" });
    const colHor = bloc(k, "Horaires", [horaires(k, { taille: 15 })], { couleurTitre: CYAN, police: S.head, suiviTitre: "0.18em", min: "230px" });
    const abo = lettre(k, env, G, { titre: "Lettre technique", intro: "Nouveautés de l'atelier, par courriel.", bouton: "S'abonner", largeur: "360px", accent: CYAN, surBouton: BLEU, texte: CLAIR, couleurTitre: CYAN, fond: BLEU2, survolBouton: CLAIR, survolTexte: BLEU, focus: CYAN });
    const colLettre = G.colonne(k, [abo], { poids: 1.4, min: "260px" });
    const grille = G.ligne(k, [colContact, colHor, colLettre], { gap: "36px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, trait(k, S.line), mentions], { fond: BLEU2, colonne: true, gap: "36px", padV: ["40px", "36px", "28px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Contact" });
    return [G.racine(k, [bandePlan, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-132 « Quai de chargement » — transporteur, entrepôt, prestataire logistique
// Idée : un QUAI. Noir profond, bande de carrés jaune et anthracite (repère de sécurité sobre, sans diagonales), phrase géante « Chargé. Expédié. » en capitales condensées dont le second mot est jaune,
// bouton carré jaune qui s'inverse au survol ; quatre rubriques de services (Stockage, Transport, Préparation, Retours : exemples à renommer) puis contact, horaires (voyant carré qui « respire »), lettre.
// Polices : Oswald (titres, capitales) et Public Sans. Mobile : phrase réduite, rubriques en pile.
const quai = identite({
  key: "c132", label: "Noir quai et jaune sécurité", humeur: "dark",
  fond: "#111214", texte: "#f5f5f2", discret: "#b9bbbf", accent: "#ffc400", surface: "#1b1d20", encre: "#111214", surEncre: "#f5f5f2",
  police: "font.public-sans", titres: "font.oswald",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#f5f5f23d",
});
const QNOIR = "#111214", QJAUNE = "#ffc400", QGRIS = "#2a2c30";

const quaiChargement = modeleV2({
  id: identifiantV2(132, "quai-de-chargement"), concept: "c-132-quai-de-chargement",
  name: "Quai de chargement", family: FAM,
  description: "Pour un transporteur ou un entrepôt : noir profond, bande de carrés jaune et anthracite, phrase géante en capitales condensées, quatre rubriques de services, contact et horaires avec voyant qui respire, lettre d'information.",
  tags: ["logistique", "transport", "entrepôt", "noir et jaune", "capitales condensées", "bande de sécurité", "angles droits"],
  identity: quai,
  racine: racineDe(QNOIR),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · bande de sécurité + phrase géante + bouton
    const haute = bandeSecurite(k, QJAUNE, QGRIS, 32, "14px");
    const bandeHaute = G.bande(k, [haute], { fond: QNOIR, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Repère" });
    const phrase = G.geant(`<p>Chargé.<br><span style="color:${QJAUNE}">Expédié.</span></p>`, { taille: [72, 176], tablette: { taille: [112, 150] }, mobile: { taille: [72, 112] }, lh: 1.08, suivi: "-0.005em", poids: "700", police: S.head, couleur: S.fg, extra: { textTransform: "uppercase" } })(k, env);
    const intro = k.T("<p>Stockage, transport, préparation de commandes : parlez-nous de vos flux, nous cherchons la solution qui convient.</p>", { fontSize: "17px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, maxWidth: "400px" });
    const bouton = lien(k, "Demander un devis", "/contact", { taille: 16, poids: "700", casse: "uppercase", suivi: "0.1em", couleur: QNOIR, h: "56px", padH: "32px", survol: { backgroundColor: "#ffffff", color: QNOIR, transform: { x: 8 } }, focus: "#ffffff", extra: { backgroundColor: QJAUNE, justifyContent: "center", alignSelf: "flex-start" } });
    const gauche = G.colonne(k, [phrase], { poids: 7, min: "300px" });
    const droite = G.colonne(k, [intro, bouton], { poids: 4, min: "280px", gap: "24px", soi: "flex-end" });
    const accroche = G.bande(k, [gauche, droite], { fond: QNOIR, gap: "40px 64px", aligne: "flex-end", padV: ["80px", "64px", "44px"], padB: ["64px", "52px", "40px"], padH: ["48px", "32px", "20px"], nom: "Accroche" });
    // 2 · quatre rubriques de services (cases à filet jaune à gauche)
    const rub = (num, t, u) => {
      const l = lien(k, t, u, { taille: 24, poids: "700", police: S.head, casse: "uppercase", suivi: "0.02em", couleur: S.fg, survol: { color: QJAUNE }, focus: QJAUNE });
      const c = k.col([caps(k, num, { couleur: QJAUNE, suivi: "0.2em" }), l], { flexGrow: 1, flexBasis: "0px", minWidth: "200px", gap: "6px", paddingTop: "20px", paddingBottom: "18px", paddingLeft: "22px", paddingRight: "16px", backgroundColor: "#1b1d20", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "6px", borderColor: QJAUNE, borderRadius: "0px", transitionDuration: DOUX }, undefined, { minWidth: "100%" });
      c.states = { hover: { backgroundColor: "#24272b", borderLeftWidth: "16px", transform: { x: 0 } } };
      return c;
    };
    const rubriques = G.ligne(k, [rub("01", "Stockage", "/contact"), rub("02", "Transport", "/contact"), rub("03", "Préparation", "/faq"), rub("04", "Retours", "/faq")], { gap: "12px", aligne: "stretch", largeur: "100%" });
    const bandeRub = G.bande(k, [rubriques], { fond: QNOIR, colonne: true, padV: ["0px", "0px", "0px"], padB: ["64px", "52px", "40px"], padH: ["48px", "32px", "20px"], nom: "Services" });
    // 3 · contact, horaires, lettre, mentions
    const colContact = bloc(k, "Coordonnées", [coordonnees(k, { taille: 15, lien: S.fg, survol: QJAUNE, focus: QJAUNE })], { couleurTitre: QJAUNE });
    const pt = souffle(carre(k, QJAUNE, "10px"), 2800);
    const colHor = G.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: QJAUNE })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15 })], { poids: 1, min: "220px", gap: "12px" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Nouveautés du service, par courriel.", bouton: "S'abonner", largeur: "360px", accent: QJAUNE, surBouton: QNOIR, texte: S.fg, couleurTitre: QJAUNE, fond: QNOIR, survolBouton: "#ffffff", survolTexte: QNOIR, focus: QJAUNE });
    const colLettre = G.colonne(k, [abo], { poids: 1.4, min: "260px" });
    const grille = G.ligne(k, [colContact, colHor, colLettre], { gap: "36px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, trait(k, S.line), mentions], { fond: "#17191c", colonne: true, gap: "36px", padV: ["56px", "48px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Contact" });
    return [G.racine(k, [bandeHaute, accroche, bandeRub, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-133 « Pupitre de contrôle » — usine automatisée, site de production, centre de tri
// Idée : un PUPITRE. Charbon et vert signal ; un bandeau d'état en haut (voyant carré vert qui « respire », « Site en ligne », nom du site), puis trois MODULES à filet fin, chacun coiffé d'un bandeau d'en-tête
// (MODULE 01 · CONTACT, 02 · HORAIRES, 03 · LIENS) et un quatrième pour la lettre ; au survol un module s'éclaircit et son filet haut vert s'épaissit. Aucune mesure ni voyant réel : le voyant est décoratif.
// Polices : JetBrains Mono (libellés, titres) et Inter Tight. Mobile : modules en pile.
const pupitre = identite({
  key: "c133", label: "Charbon et vert signal", humeur: "dark",
  fond: "#14181c", texte: "#e8edf0", discret: "#9fb0ba", accent: "#4ade80", surface: "#1c2227", encre: "#14181c", surEncre: "#e8edf0",
  police: "font.inter-tight", titres: "font.jetbrains-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#e8edf033",
});
const CHARBON = "#14181c", MODULE = "#1c2227", VERT = "#4ade80", LIGNE = "#3a444c";

const pupitreControle = modeleV2({
  id: identifiantV2(133, "pupitre-de-controle"), concept: "c-133-pupitre-de-controle",
  name: "Pupitre de contrôle", family: FAM,
  description: "Pour un site de production ou un centre de tri : bandeau d'état avec voyant vert qui respire, trois modules à en-tête (contact, horaires, liens) et un quatrième pour la lettre. Charbon et vert signal, chasse fixe, angles droits.",
  tags: ["usine", "production", "pupitre", "modules", "charbon", "vert signal", "chasse fixe", "angles droits"],
  identity: pupitre,
  racine: racineDe(CHARBON),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · bandeau d'état : voyant carré, état, nom du site, bouton de contact
    const pt = souffle(carre(k, VERT, "12px"), 2600);
    const etat = k.row([pt, caps(k, "Site en ligne", { couleur: VERT, police: S.head, suivi: "0.18em" })], { gap: "10px", alignItems: "center" });
    const nom = nomDuSite(k, env, 30, S.fg, { fontFamily: S.head, fontWeight: "700" });
    const gauche = G.colonne(k, [etat, nom], { poids: 6, min: "260px", gap: "10px" });
    const bouton = lien(k, "Ouvrir une demande", "/contact", { taille: 15, poids: "700", couleur: CHARBON, h: "52px", padH: "26px", survol: { backgroundColor: "#ffffff", color: CHARBON, transform: { y: -3 } }, focus: "#ffffff", extra: { backgroundColor: VERT, justifyContent: "center", alignSelf: "flex-end" } });
    const droite = G.colonne(k, [bouton], { poids: 4, min: "240px", soi: "center", aligne: "flex-end", mobile: { alignItems: "flex-start" } });
    const tete = G.bande(k, [gauche, droite], { fond: CHARBON, gap: "28px 48px", aligne: "center", padV: ["64px", "52px", "40px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], nom: "État" });
    // 2 · modules
    const module = (num, titre, enfants) => {
      const entete = k.row([caps(k, `Module ${num}`, { couleur: VERT, police: S.head, suivi: "0.16em" }), caps(k, titre, { couleur: S.fg, police: S.head, suivi: "0.16em" })], { gap: "12px", alignItems: "center", flexWrap: "wrap", width: "100%", paddingTop: "12px", paddingBottom: "12px", paddingLeft: "20px", paddingRight: "20px", backgroundColor: "#242c33", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: LIGNE, borderRadius: "0px" });
      const corps = k.col(enfants, { gap: "10px", width: "100%", paddingTop: "22px", paddingBottom: "24px", paddingLeft: "20px", paddingRight: "20px", borderRadius: "0px" });
      const barre = k.col([], { width: "100%", height: "4px", backgroundColor: VERT, borderRadius: "0px", flexShrink: 0 });
      const c = k.col([barre, entete, corps], { flexGrow: 1, flexBasis: "0px", minWidth: "250px", gap: "0px", backgroundColor: MODULE, borderStyle: "solid", borderWidth: "1px", borderColor: LIGNE, borderRadius: "0px", transitionDuration: DOUX }, undefined, { minWidth: "100%" });
      c.states = { hover: { backgroundColor: "#222a31", borderColor: VERT, transform: { y: -4 } } };
      return c;
    };
    const rapide = [["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Espace client", "/connexion"]];
    const liensM = k.col(rapide.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", survol: { color: VERT, transform: { x: 6 } }, focus: VERT })), { gap: "0px" });
    const abo = lettre(k, env, G, { titre: "Bulletin", intro: "Les nouvelles du site, par courriel.", bouton: "S'abonner", largeur: "100%", accent: VERT, surBouton: CHARBON, texte: S.fg, couleurTitre: VERT, fond: MODULE, survolBouton: "#ffffff", survolTexte: CHARBON, focus: VERT });
    const modules = G.ligne(k, [
      module("01", "Contact", [coordonnees(k, { taille: 15, lien: S.fg, survol: VERT, focus: VERT })]),
      module("02", "Horaires", [horaires(k, { taille: 15 })]),
      module("03", "Liens", [liensM]),
      module("04", "Bulletin", [abo]),
    ], { gap: "12px", aligne: "stretch", largeur: "100%" });
    const bandeModules = G.bande(k, [modules], { fond: CHARBON, colonne: true, padV: ["8px", "8px", "4px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "20px"], nom: "Modules" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: CHARBON, colonne: true, padV: ["24px", "22px", "18px"], padB: ["24px", "22px", "18px"], padH: ["48px", "32px", "20px"], filetHaut: { epaisseur: "1px", couleur: LIGNE }, nom: "Mentions" });
    return [G.racine(k, [tete, bandeModules, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-134 « Chaîne logistique » — transporteur, commissionnaire, plateforme de distribution
// Idée : la CHAÎNE en cinq étapes (Commande, Préparation, Expédition, Transport, Livraison), tracée comme une ligne de plan : chaque étape est un bloc à trait supérieur épais bleu pétrole qui devient orange au survol,
// numéroté, avec un lien et une phrase d'exemple (aucun délai ni chiffre). Dessous, bande blanche : contact, horaires, lettre, mentions. Étapes = rubriques d'EXEMPLE à renommer.
// Polices : Barlow Semi Condensed (titres) et Barlow. Mobile : étapes en pile, trait à gauche.
const chaine = identite({
  key: "c134", label: "Gris clair, bleu pétrole et orange", humeur: "light",
  fond: "#f1f3f4", texte: "#0b2e3f", discret: "#4a5c66", accent: "#c2410c", surface: "#ffffff", encre: "#0b2e3f",
  police: "font.barlow", titres: "font.barlow-semi-condensed",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#0b2e3f33",
});
const GRIS = "#f1f3f4", PETROLE = "#0b4f6c", MARINE2 = "#0b2e3f", ORANGE = "#c2410c";

const chaineLogistique = modeleV2({
  id: identifiantV2(134, "chaine-logistique"), concept: "c-134-chaine-logistique",
  name: "Chaîne logistique", family: FAM,
  description: "Pour un transporteur ou une plateforme de distribution : cinq étapes (commande, préparation, expédition, transport, livraison) tracées comme un plan, au trait épais qui vire à l'orange au survol, puis contact, horaires, lettre et mentions.",
  tags: ["logistique", "transport", "étapes", "chaîne", "bleu pétrole", "orange", "frise", "angles droits"],
  identity: chaine,
  racine: racineDe(MARINE2),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · titre + cinq étapes
    const titre = G.geant(`<p>De la commande<br>à la livraison.</p>`, { taille: [40, 88], tablette: { taille: [60, 80] }, mobile: { taille: [40, 52] }, lh: 1.02, suivi: "-0.01em", poids: "700", police: S.head, couleur: MARINE2 })(k, env);
    const sous = k.T("<p>Cinq étapes, un seul interlocuteur. Choisissez celle qui vous concerne ou écrivez-nous.</p>", { fontSize: "17px", lineHeight: 1.6, color: S.mute, fontFamily: S.font, maxWidth: "380px" });
    const bouton = lien(k, "Suivre ou demander", "/contact", { taille: 16, poids: "700", couleur: "#ffffff", h: "52px", padH: "26px", survol: { backgroundColor: ORANGE, color: "#ffffff", transform: { y: -3 } }, focus: ORANGE, extra: { backgroundColor: MARINE2, justifyContent: "center", alignSelf: "flex-start" } });
    const gaucheT = G.colonne(k, [caps(k, "Notre chaîne", { couleur: ORANGE, suivi: "0.22em" }), titre], { poids: 7, min: "300px", gap: "16px" });
    const droiteT = G.colonne(k, [sous, bouton], { poids: 4, min: "280px", gap: "20px", soi: "flex-end" });
    const entete = G.bande(k, [gaucheT, droiteT], { fond: GRIS, gap: "32px 64px", aligne: "flex-end", padV: ["88px", "68px", "48px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "20px"], nom: "Titre" });
    const etape = (num, t, texte, url) => {
      const l = lien(k, t, url, { taille: 24, poids: "700", police: S.head, couleur: MARINE2, survol: { color: ORANGE }, focus: ORANGE });
      const c = k.col([caps(k, num, { couleur: PETROLE, suivi: "0.2em" }), l, k.T(`<p>${texte}</p>`, { fontSize: "15px", lineHeight: 1.5, color: S.mute, fontFamily: S.font })], { flexGrow: 1, flexBasis: "0px", minWidth: "180px", gap: "6px", paddingTop: "18px", paddingBottom: "22px", paddingLeft: "0px", paddingRight: "16px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "8px", borderColor: PETROLE, borderRadius: "0px", transitionDuration: DOUX }, undefined, { minWidth: "100%", borderTopWidth: "0px", borderLeftWidth: "8px", paddingLeft: "18px", paddingTop: "8px", paddingBottom: "12px" });
      c.states = { hover: { borderColor: ORANGE, transform: { y: -6 } } };
      return c;
    };
    const etapes = G.ligne(k, [
      etape("01", "Commande", "Dites-nous ce qu'il faut déplacer.", "/contact"),
      etape("02", "Préparation", "Votre marchandise est prête à partir.", "/faq"),
      etape("03", "Expédition", "Le départ est organisé avec vous.", "/faq"),
      etape("04", "Transport", "Le parcours est suivi pas à pas.", "/blog"),
      etape("05", "Livraison", "La remise est confirmée.", "/contact"),
    ], { gap: "16px", aligne: "stretch", largeur: "100%" });
    const bandeEtapes = G.bande(k, [etapes], { fond: GRIS, colonne: true, padV: ["16px", "16px", "8px"], padB: ["72px", "56px", "40px"], padH: ["48px", "32px", "20px"], nom: "Étapes" });
    // 2 · bande blanche : contact, horaires, lettre, mentions
    const colContact = bloc(k, "Coordonnées", [coordonnees(k, { taille: 15, lien: MARINE2, survol: ORANGE, focus: ORANGE })], { couleurTitre: PETROLE });
    const pt = souffle(carre(k, ORANGE, "10px"), 3000);
    const colHor = G.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: PETROLE })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15 })], { poids: 1, min: "220px", gap: "12px" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Les nouvelles du transport, par courriel.", bouton: "S'abonner", largeur: "360px", accent: ORANGE, surBouton: "#ffffff", texte: MARINE2, couleurTitre: PETROLE, fond: "#ffffff", survolBouton: MARINE2, survolTexte: "#ffffff", focus: MARINE2 });
    const colLettre = G.colonne(k, [abo], { poids: 1.4, min: "260px" });
    const grille = G.ligne(k, [colContact, colHor, colLettre], { gap: "36px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [grille, trait(k, S.line), mentions], { fond: "#ffffff", colonne: true, gap: "36px", padV: ["56px", "48px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, filetHaut: { epaisseur: "4px", couleur: MARINE2 }, nom: "Contact" });
    return [G.racine(k, [entete, bandeEtapes, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-135 « Béton et sécurité » — entrepôt, stockage industriel, manutention
// Idée : un MUR DE BÉTON à COLONNE LATÉRALE (archétype A). À gauche une barre noire pleine hauteur de 340 px : nom du site, coordonnées, horaires (voyant carré qui « respire »), lettre d'information.
// À droite la zone béton : mot d'ordre monumental en Anton « STOCKER. TRANSPORTER. LIVRER. », quatre rubriques en grandes capitales coiffées d'une barre noire de 8 px qui vire au rouge au survol, puis la ligne légale. Rubriques = EXEMPLES.
// Polices : Anton (géant, propre en grand corps) et Work Sans. Mobile : la barre passe au-dessus, mot d'ordre à 56 px.
const beton = identite({
  key: "c135", label: "Béton, noir et rouge sécurité", humeur: "light",
  fond: "#d8d8d2", texte: "#141414", discret: "#3d3d38", accent: "#b3121d", surface: "#e8e8e3", encre: "#141414",
  police: "font.work-sans", titres: "font.anton",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "2px", ligne: "#14141440",
});
const BETON = "#d8d8d2", BNOIR = "#141414", ROUGE = "#b3121d", ROUGE2 = "#ff8a8a";

const betonSecurite = modeleV2({
  id: identifiantV2(135, "beton-et-securite"), concept: "c-135-beton-et-securite",
  name: "Béton et sécurité", family: FAM,
  description: "Pour un entrepôt ou une société de manutention : une barre noire latérale pleine hauteur (nom, coordonnées, horaires, lettre) et, sur fond béton, un mot d'ordre monumental en capitales avec quatre rubriques à barre noire qui vire au rouge.",
  tags: ["entrepôt", "manutention", "béton", "rouge sécurité", "colonne latérale", "capitales géantes", "angles droits"],
  identity: beton,
  racine: racineDe(BETON),
  widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const CLAIR = "#f2f2ee";
    // Barre latérale noire (pleine hauteur)
    const nom = nomDuSite(k, env, 30, "#ffffff", { fontWeight: "400", textTransform: "uppercase", letterSpacing: "0.03em" });
    const colContact = bloc(k, "Coordonnées", [coordonnees(k, { taille: 15, couleur: CLAIR, lien: "#ffffff", survol: ROUGE2, focus: "#ffffff" })], { couleurTitre: ROUGE2 });
    const pt = souffle(carre(k, ROUGE2, "10px"), 3000);
    const colHor = G.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: ROUGE2 })], { gap: "10px", alignItems: "center" }), horaires(k, { taille: 15, couleur: CLAIR })], { poids: 0, min: "0px", gap: "12px", aligne: "stretch" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Les nouvelles du site, par courriel.", bouton: "S'abonner", largeur: "100%", accent: "#ffffff", surBouton: BNOIR, texte: CLAIR, couleurTitre: ROUGE2, fond: BNOIR, survolBouton: ROUGE2, survolTexte: BNOIR, focus: "#ffffff" });
    const barre = k.col([caps(k, "Entrepôt", { couleur: ROUGE2, suivi: "0.22em" }), nom, trait(k, "#ffffff40"), colContact, colHor, trait(k, "#ffffff40"), abo],
      { flexGrow: 0, flexShrink: 0, flexBasis: "340px", minWidth: "300px", gap: "22px", backgroundColor: BNOIR, boxSizing: "border-box", borderRadius: "0px", paddingTop: "64px", paddingBottom: "48px", paddingLeft: "40px", paddingRight: "40px" },
      { flexBasis: "300px", paddingLeft: "32px", paddingRight: "32px" },
      { flexBasis: "100%", flexShrink: 1, flexGrow: 1, minWidth: "0px", paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px", paddingBottom: "36px" });
    // Zone béton : mot d'ordre, rubriques, mentions
    const mot = G.geant(`<p>Stocker.<br>Transporter.<br><span style="color:${ROUGE}">Livrer.</span></p>`, { taille: [56, 112], tablette: { taille: [64, 88] }, mobile: { taille: [56, 80] }, lh: 0.98, suivi: "0.005em", poids: "400", police: S.head, couleur: BNOIR, extra: { textTransform: "uppercase" } })(k, env);
    const rub = (t, u) => lien(k, t, u, { taille: 26, poids: "400", police: S.head, casse: "uppercase", suivi: "0.03em", couleur: BNOIR, h: "72px", bloc: true, survol: { color: ROUGE, borderColor: ROUGE }, focus: ROUGE, extra: { flexGrow: 1, flexBasis: "0px", minWidth: "150px", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "8px", borderColor: BNOIR, paddingTop: "10px" } });
    const rubriques = G.ligne(k, [rub("Stockage", "/contact"), rub("Transport", "/contact"), rub("Livraison", "/faq"), rub("Manutention", "/faq")], { gap: "16px 20px", aligne: "stretch", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const zone = k.col([caps(k, "Entrepôt et manutention", { couleur: ROUGE, suivi: "0.22em" }), mot, rubriques, trait(k, BNOIR, "2px"), mentions],
      { flexGrow: 1, flexBasis: "0px", minWidth: "460px", gap: "36px", boxSizing: "border-box", paddingTop: "72px", paddingBottom: "28px", paddingLeft: "56px", paddingRight: "56px", justifyContent: "space-between" },
      { paddingLeft: "40px", paddingRight: "40px", paddingTop: "56px" },
      { minWidth: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px", paddingBottom: "20px", gap: "28px" });
    const mur = G.bande(k, [barre, zone], { fond: BETON, max: "100%", gap: "0px", aligne: "stretch", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Mur" });
    return [G.racine(k, [mur])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Industrie et logistique", target: 5, built: true,
  description: "Pieds d'industrie et de logistique à angles droits : plan d'atelier à cartouche, quai à bande de sécurité, pupitre de contrôle, chaîne en cinq étapes, béton et rouge sécurité.",
  models: [planAtelier, quaiChargement, pupitreControle, chaineLogistique, betonSecurite],
};
