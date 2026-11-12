// Famille v2 « Événements et réceptions » — 5 modèles (ft2-236 à ft2-240), extension « carrée 2 » : angles droits, diversité stricte (5 archétypes : J, I, G, K, A).
// Contenus d'exemple modifiables dans l'éditeur ; aucune coordonnée, aucun chiffre, aucune immatriculation inventés. Mouvement : transitions de 360 ms, carrés de statut qui respirent, survols qui glissent ou se soulèvent (coupés en « mouvement réduit »).
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

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
// rangée de lien + flèche, à fond qui s'éclaircit au survol (liste à filets)
const surFond = (k, texte, url, o) => lien(k, texte, url, o);
const bandeMentions = (k, env, G, o) => {
  const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: o.texte, liens: o.liens })(k, env);
  const b = G.bande(k, [mentions], { fond: o.fond, colonne: true, padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: ["48px", "32px", "20px"], nom: "Mentions", filetHaut: o.filet });
  b.styles.desktop.color = o.liens;
  return b;
};
// recherche : widget « Recherche » à angles droits, habillé pour un fond précis
const recherche = (k, o) => {
  const f = { outlineStyle: "solid", outlineWidth: "3px", outlineColor: o.focus, outlineOffset: "2px" };
  const n = k.W("search", { target: "site", placeholder: o.ph, button: o.bouton || "Rechercher" }, { width: "100%", maxWidth: o.max || "520px", fontFamily: k.S.font, borderRadius: "0px" });
  n.parts = {
    field: { styles: { desktop: { fontFamily: k.S.font, fontSize: "17px", color: o.texte, backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.contour, borderRadius: "0px", minHeight: "52px", paddingLeft: "16px", paddingRight: "16px" }, mobile: { minHeight: "52px" } }, states: { focus: f } },
    button: { styles: { desktop: { fontFamily: k.S.font, fontSize: "16px", fontWeight: "700", color: o.surBouton, backgroundColor: o.fondBouton, borderStyle: "solid", borderWidth: "0px", borderRadius: "0px", minHeight: "52px", paddingLeft: "22px", paddingRight: "22px", transitionDuration: DOUX }, mobile: { minHeight: "52px" } }, states: { hover: { backgroundColor: o.survol, color: o.surSurvol }, focus: f } },
  };
  return n;
};
const PAD = ["48px", "32px", "20px"];
const btn = (k, t, u, c) => lien(k, t, u, { taille: 16, poids: "700", couleur: c.texte, h: c.h || "52px", padH: "28px", survol: { backgroundColor: c.survol, color: c.surSurvol, transform: { y: -3 } }, focus: c.focus, extra: { backgroundColor: c.fond, justifyContent: "center", borderStyle: "solid", borderWidth: "2px", borderColor: c.contour || c.fond, alignSelf: c.soi || "flex-start" } });
const txt = (k, t, o = {}) => k.T(`<p>${t}</p>`, compact({ fontSize: `${o.taille || 16}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, maxWidth: o.max, textAlign: o.align, fontWeight: o.poids, fontStyle: o.style }));
const FAM = "evenements-receptions";

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-236 « Faire-part » — organisateur de mariages. ARCHÉTYPE J (papier à en-tête) : cartouche centré à double filet, liens en ligne centrée, un seul widget (contact).
// Idée : le pied est un FAIRE-PART : un cadre à double filet sur papier greige, le nom en capitales fines, trois liens en ligne, les coordonnées centrées. Au survol le papier devient blanc, un petit carré (cœur du faire-part) respire.
// Polices : Marcellus (titres, graisse 400) et Hanken Grotesk. Pas de lettre d'information, pas d'horaires : sobriété voulue.
const faire = identite({
  key: "c236", label: "Greige, vieux rose et prune", humeur: "light",
  fond: "#efeae7", texte: "#3b2f35", discret: "#5e4c55", accent: "#8a4a66", surface: "#fbf9f8", encre: "#3b2f35",
  police: "font.hanken-grotesk", titres: "font.marcellus",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#3b2f3544",
});
const GREIGE = "#efeae7", PRUNE = "#4a2a3b", ROSE = "#8a4a66", ROSEP = "#e8c3d2";
const fairePart = modeleV2({
  id: identifiantV2(236, "faire-part"), concept: "c-236-faire-part",
  name: "Faire-part", family: FAM,
  description: "Pour un organisateur de mariages : un cadre à double filet sur papier greige, nom en capitales fines, trois liens centrés (prestations, galerie en texte, devis) et les coordonnées. Une bande prune pour les mentions. Élégant, angles droits.",
  tags: ["mariage", "organisateur", "faire-part", "double filet", "centré", "greige", "vieux rose", "angles droits"],
  identity: faire,
  racine: racineDe(PRUNE),
  widgets: ["sitetitle", "text", "link", "bizcontact", "divider", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 44, "#3b2f35", { fontWeight: "400", textTransform: "uppercase", letterSpacing: "0.12em", textAlign: "center" });
    const coeur = k.row([carre(k, ROSE, "8px"), souffle(carre(k, ROSE, "12px"), 3400), carre(k, ROSE, "8px")], { gap: "12px", alignItems: "center", justifyContent: "center" });
    const liensL = [["Nos prestations", "/contact"], ["Galerie en mots", "/blog"], ["Demander un devis", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: "#3b2f35", survol: { color: ROSE, transform: { y: -2 } }, focus: ROSE }));
    const ligneL = k.row(liensL, { rowGap: "4px", columnGap: "36px", justifyContent: "center", alignItems: "center" });
    const galerie = txt(k, "Cérémonie laïque · vin d'honneur · décoration florale · coordination du jour J", { taille: 15, align: "center", max: "520px", style: "italic" });
    const phrase = txt(k, "Chaque mariage s'écrit à deux. Nous tenons le stylo avec vous, jusqu'à la dernière danse.", { taille: 17, align: "center", max: "460px" });
    const contact = coordonnees(k, { taille: 15, lien: "#3b2f35", survol: ROSE, focus: ROSE });
    contact.styles.desktop = { ...contact.styles.desktop, textAlign: "center" };
    const interieur = k.col([caps(k, "Mariages · Cérémonies · Réceptions", { couleur: ROSE, suivi: "0.22em", extra: { textAlign: "center" } }), nom, coeur, phrase, ligneL, galerie, trait(k, "#3b2f3555"), contact], { alignItems: "center", gap: "20px", paddingTop: "56px", paddingBottom: "48px", paddingLeft: "40px", paddingRight: "40px", borderStyle: "solid", borderWidth: "1px", borderColor: "#3b2f35", borderRadius: "0px", backgroundColor: GREIGE, transitionDuration: DOUX, width: "100%", maxWidth: "820px" }, undefined, { paddingLeft: "18px", paddingRight: "18px", paddingTop: "40px", paddingBottom: "32px" });
    interieur.states = { hover: { backgroundColor: "#fbf9f8" } };
    const cadre = k.col([interieur], { padding: "10px", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "10px", paddingRight: "10px", borderStyle: "solid", borderWidth: "1px", borderColor: "#3b2f35", borderRadius: "0px", alignItems: "center", width: "100%", maxWidth: "860px" }, undefined, { paddingLeft: "6px", paddingRight: "6px", paddingTop: "6px", paddingBottom: "6px" });
    const haut = G.bande(k, [cadre], { fond: GREIGE, colonne: true, aligne: "center", padV: ["88px", "64px", "40px"], padB: ["88px", "64px", "40px"], padH: PAD, nom: "Faire-part" });
    const bas = bandeMentions(k, env, G, { fond: PRUNE, texte: "#f0dde6", liens: "#ffffff" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-237 « Déroulé de soirée » — salle de réception. ARCHÉTYPE I (frise horizontale à points carrés).
// Idée : une FRISE de cinq moments d'une soirée (accueil, cocktail, dîner, piste, fin de soirée), reliés par un trait et des points carrés argent ; les heures sont un EXEMPLE de déroulé à adapter.
// Au survol un moment se soulève. En tête, la phrase en serif et un bouton « Visiter la salle » avec les coordonnées. Polices : DM Serif Display (400) et Onest. Pas de lettre ni d'horaires.
const paon = identite({
  key: "c237", label: "Bleu paon et argent", humeur: "dark",
  fond: "#08323f", texte: "#eaf2f4", discret: "#a9c3ca", accent: "#d3dde1", surface: "#0b3d4d", encre: "#08323f", surEncre: "#eaf2f4",
  police: "font.onest", titres: "font.dm-serif-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#d3dde144",
});
const PAON = "#08323f", PAON2 = "#0b3d4d", PAON3 = "#041d25", ARGENT = "#d3dde1", GLACE = "#eaf2f4";
const deroule = modeleV2({
  id: identifiantV2(237, "deroule-de-soiree"), concept: "c-237-deroule-de-soiree",
  name: "Déroulé de soirée", family: FAM,
  description: "Pour une salle de réception : une phrase en serif, un bouton de visite et les coordonnées, puis une frise horizontale de cinq moments de la soirée reliés par des points carrés argent. Bleu paon profond, angles droits.",
  tags: ["salle de réception", "frise", "déroulé", "soirée", "bleu paon", "argent", "visite", "angles droits"],
  identity: paon,
  racine: racineDe(PAON3),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Du premier verre<br>à la dernière danse.</p>`, { taille: [40, 88], tablette: { taille: [48, 72] }, mobile: { taille: [38, 52] }, lh: 1.04, suivi: "-0.01em", poids: "400", police: S.head, couleur: GLACE })(k, env);
    const gauche = G.colonne(k, [phrase], { poids: 7, min: "320px", gap: "24px" });
    const tete = G.bande(k, [gauche], { fond: PAON, colonne: true, gap: "24px", padV: ["88px", "64px", "48px"], padB: ["40px", "32px", "28px"], padH: PAD, nom: "Soirée" });
    const MOMENTS = [["18 h 30", "Accueil", "Un verre de bienvenue dans le hall."], ["19 h 30", "Cocktail", "Les invités se retrouvent en terrasse."], ["21 h", "Dîner", "Tables dressées, service attentif."], ["23 h", "Piste", "La salle se transforme en dancefloor."], ["2 h", "Fin de soirée", "Le dernier slow, le retour en douceur."]];
    const etape = ([h, t], i) => {
      const c = k.col([carre(k, ARGENT, "16px"), caps(k, h, { couleur: ARGENT, suivi: "0.16em" }), lien(k, t, "/contact", { taille: 26, poids: "400", police: S.head, couleur: GLACE, survol: { color: "#ffffff", transform: { x: 4 } }, focus: "#ffffff", lh: 1.1 })], { flexGrow: 1, flexBasis: "0px", minWidth: "170px", gap: "12px", transitionDuration: DOUX, paddingRight: "16px", paddingTop: "0px", marginTop: "-9px" }, undefined, { minWidth: "100%" });
      c.states = { hover: { transform: { y: -5 } } };
      return c;
    };
    const frise = G.bande(k, [k.row(MOMENTS.map(etape), { rowGap: "32px", columnGap: "0px", alignItems: "flex-start", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderColor: "#d3dde188", borderRadius: "0px", paddingTop: "0px" }, undefined, { borderTopWidth: "0px", borderLeftWidth: "3px", paddingLeft: "0px" })], { fond: PAON2, colonne: true, gap: "40px", padV: ["64px", "52px", "44px"], padB: ["72px", "56px", "44px"], padH: PAD, nom: "Frise", innerMobile: { rowGap: "28px" } });
    const visite = k.row([btn(k, "Visiter la salle", "/contact", { texte: PAON, fond: ARGENT, survol: "#ffffff", surSurvol: PAON, focus: "#ffffff", contour: ARGENT, soi: "center" }), coordonnees(k, { taille: 15, couleur: GLACE, lien: "#ffffff", survol: ARGENT, focus: "#ffffff" })], { rowGap: "20px", columnGap: "48px", alignItems: "center", width: "100%" });
    const bas = G.bande(k, [visite, G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#b9d0d6", liens: "#ffffff" })(k, env)], { fond: PAON3, colonne: true, gap: "24px", padV: ["40px", "36px", "32px"], padB: ["22px", "20px", "18px"], padH: PAD, nom: "Visite" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [tete, frise, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-238 « La carte du traiteur » — traiteur événementiel. ARCHÉTYPE G (index en lignes pleine largeur, grand libellé, flèche, filet, sans cartes).
// Idée : le pied se lit comme une CARTE de restaurant : cinq grandes lignes (cocktails, repas assis, buffets, brunchs, plateaux) séparées par des filets grenat ; au survol la ligne s'éclaircit, son libellé glisse et la flèche suit.
// Dessous, bande grenat : lettre d'information et coordonnées. Polices : Literata (titres) et Commissioner. Pas d'horaires.
const pistache = identite({
  key: "c238", label: "Pistache et grenat", humeur: "light",
  fond: "#e9eed6", texte: "#2a1a1d", discret: "#533a40", accent: "#7a1630", surface: "#f7f9ec", encre: "#2a1a1d",
  police: "font.commissioner", titres: "font.literata",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#2a1a1d44",
});
const PISTACHE = "#e9eed6", PISTACHE2 = "#f7f9ec", GRENAT = "#7a1630", ENCRE8 = "#2a1a1d", CREME8 = "#f4f6e4";
const carteTraiteur = modeleV2({
  id: identifiantV2(238, "la-carte-du-traiteur"), concept: "c-238-la-carte-du-traiteur",
  name: "La carte du traiteur", family: FAM,
  description: "Pour un traiteur événementiel : cinq grandes lignes pleine largeur comme une carte de restaurant (cocktails, repas assis, buffets, brunchs, plateaux), filets grenat et flèches qui glissent, puis une bande grenat avec lettre et coordonnées.",
  tags: ["traiteur", "carte", "index", "lignes pleine largeur", "pistache", "grenat", "devis", "angles droits"],
  identity: pistache,
  racine: racineDe(GRENAT),
  widgets: ["sitetitle", "text", "link", "emailsubscribe", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 30, ENCRE8, { fontWeight: "600" });
    const entete = k.row([k.col([caps(k, "Traiteur événementiel", { couleur: GRENAT, suivi: "0.2em" }), nom], { gap: "8px" }), coordonnees(k, { taille: 15, couleur: ENCRE8, lien: ENCRE8, survol: GRENAT, focus: GRENAT })], { justifyContent: "space-between", alignItems: "flex-end", gap: "20px", width: "100%" });
    const LIGNES = [["Cocktails dînatoires", "Pièces salées, pièces sucrées, animations à la minute"], ["Repas assis", "Entrée, plat, dessert, service à l'assiette"], ["Buffets", "Froids, chauds, thématiques"], ["Brunchs d'entreprise", "Matin et midi, jusqu'à la pause café"], ["Plateaux et corbeilles", "Réunions et petites occasions"]];
    const ligneCarte = ([t], i) => {
      const l = lien(k, `${t}   →`, "/contact", { taille: 38, poids: "600", police: S.head, couleur: ENCRE8, survol: { color: GRENAT, transform: { x: 10 }, backgroundColor: PISTACHE2 }, focus: GRENAT, h: "76px", lh: 1.1, extra: { width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: i === 0 ? "3px" : "1px", borderBottomWidth: i === LIGNES.length - 1 ? "3px" : "0px", borderColor: GRENAT, borderRadius: "0px", paddingRight: "12px" } });
      return l;
    };
    const index = k.col(LIGNES.map(ligneCarte), { gap: "0px", width: "100%" });
    const haut = G.bande(k, [entete, index], { fond: PISTACHE, colonne: true, gap: "40px", padV: ["72px", "56px", "40px"], padB: ["72px", "56px", "40px"], padH: PAD, nom: "Carte" });
    const abo = lettre(k, env, G, { titre: "Les idées de saison", intro: "Menus du moment et conseils de réception, par courriel.", bouton: "S'abonner", largeur: "420px", accent: CREME8, surBouton: GRENAT, texte: CREME8, couleurTitre: "#ffffff", fond: GRENAT, survolBouton: "#ffffff", survolTexte: GRENAT, focus: "#ffffff" });
    const bas = G.bande(k, [abo, G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#f0d6dc", liens: "#ffffff" })(k, env)], { fond: GRENAT, colonne: true, gap: "32px", padV: ["56px", "48px", "40px"], padB: ["24px", "22px", "20px"], padH: PAD, nom: "Lettre" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-239 « Régie son » — DJ et sonorisation. ARCHÉTYPE K (fenêtre / console : le pied est un bloc d'interface).
// Idée : une FENÊTRE de console à cadre turquoise : barre de titre (nom du site, trois voyants carrés), quatre canaux (mariages, soirées, entreprises, sonorisation) avec curseur de niveau, égaliseur de neuf barres qui « respirent » à des rythmes différents, champ de lettre intégré.
// Polices : Big Shoulders (titres) et Familjen Grotesk. Fond bordeaux-noir. Pas d'horaires ni de bloc de contact : un lien « devis » suffit.
const regie = identite({
  key: "c239", label: "Bordeaux noir et turquoise néon", humeur: "dark",
  fond: "#160a10", texte: "#f6eef1", discret: "#c3a9b4", accent: "#19e3c8", surface: "#241118", encre: "#160a10", surEncre: "#f6eef1",
  police: "font.familjen-grotesk", titres: "font.big-shoulders",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "2px", ligne: "#19e3c866",
});
const NUITB = "#160a10", NUITB2 = "#241118", NEON = "#19e3c8", ROSEB = "#f6eef1";
const regieSon = modeleV2({
  id: identifiantV2(239, "regie-son"), concept: "c-239-regie-son",
  name: "Régie son", family: FAM,
  description: "Pour un DJ ou une société de sonorisation : le pied est une fenêtre de console à cadre turquoise, avec barre de titre, quatre canaux à curseur de niveau, un égaliseur dont les barres respirent et un champ de lettre intégré. Sombre et franc.",
  tags: ["DJ", "sonorisation", "console", "fenêtre", "égaliseur", "turquoise", "bordeaux noir", "angles droits"],
  identity: regie,
  racine: racineDe(NUITB),
  widgets: ["sitetitle", "text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 20, NUITB, { fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.06em" });
    const voyants = k.row([souffle(carre(k, NUITB, "10px"), 2600), carre(k, NUITB, "10px"), carre(k, NUITB, "10px")], { gap: "8px", alignItems: "center", flexWrap: "nowrap" });
    const titre = k.row([nom, caps(k, "Console", { couleur: NUITB, suivi: "0.2em" }), voyants], { justifyContent: "space-between", alignItems: "center", flexWrap: "nowrap", gap: "16px", width: "100%", backgroundColor: NEON, paddingTop: "6px", paddingBottom: "6px", paddingLeft: "20px", paddingRight: "20px", borderRadius: "0px" });
    const CANAUX = [["Mariages", 0.8], ["Soirées privées", 0.6], ["Entreprises", 0.45], ["Sonorisation", 0.9]];
    const canal = ([t, niv], i) => {
      const lab = caps(k, `CH ${i + 1}`, { couleur: NEON, suivi: "0.18em", extra: { minWidth: "44px" } });
      const l = lien(k, t, "/contact", { taille: 22, poids: "700", police: S.head, couleur: ROSEB, casse: "uppercase", suivi: "0.04em", survol: { color: NEON, transform: { x: 6 } }, focus: NEON, extra: { minWidth: "170px" } });
      const piste = k.col([], { width: `${Math.round(niv * 130)}px`, height: "8px", flexShrink: 1, marginLeft: "auto", backgroundColor: NEON, borderRadius: "0px" });
      const r = k.row([lab, l, piste], { flexWrap: "nowrap", alignItems: "center", gap: "16px", width: "100%", paddingLeft: "0px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#19e3c844", borderRadius: "0px", transitionDuration: DOUX }, undefined, { gap: "10px" });
      r.states = { hover: { paddingLeft: "12px", backgroundColor: "#2e1621" } };
      return r;
    };
    const canaux = k.col(CANAUX.map(canal), { gap: "0px", flexGrow: 6, flexBasis: "0px", minWidth: "320px" });
    const barres = k.row([34, 70, 52, 96, 62, 84, 44, 76, 38].map((h, i) => souffle(k.col([], { width: "14px", height: `${h}px`, backgroundColor: i % 3 === 0 ? NEON : "#19e3c8aa", borderRadius: "0px", flexShrink: 0 }), 1800 + i * 330)), { gap: "8px", alignItems: "flex-end", flexWrap: "nowrap", height: "110px" });
    const phrase = G.geant(`<p>Le son<br>qui fait danser.</p>`, { taille: [36, 64], mobile: { taille: [36, 48] }, lh: 0.98, suivi: "0.01em", poids: "800", police: S.head, couleur: ROSEB, extra: { textTransform: "uppercase" } })(k, env);
    const droite = G.colonne(k, [phrase, barres, btn(k, "Demander un devis", "/contact", { texte: NUITB, fond: NEON, survol: ROSEB, surSurvol: NUITB, focus: ROSEB })], { poids: 5, min: "260px", gap: "20px" });
    const corps = k.row([canaux, droite], { rowGap: "32px", columnGap: "56px", alignItems: "center", width: "100%", paddingTop: "36px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px" }, undefined, { paddingLeft: "16px", paddingRight: "16px" });
    const abo = lettre(k, env, G, { titre: "Dates libres", intro: "Recevez les créneaux et les nouveautés de la régie.", bouton: "Je m'abonne", largeur: "520px", accent: NEON, surBouton: NUITB, texte: ROSEB, couleurTitre: NEON, fond: NUITB2, survolBouton: ROSEB, survolTexte: NUITB, focus: NEON });
    const pied = k.col([abo], { width: "100%", backgroundColor: NUITB2, paddingTop: "24px", paddingBottom: "24px", paddingLeft: "28px", paddingRight: "28px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: NEON, borderRadius: "0px" }, undefined, { paddingLeft: "16px", paddingRight: "16px" });
    const fenetre = k.col([titre, corps, pied], { width: "100%", gap: "0px", borderStyle: "solid", borderWidth: "2px", borderColor: NEON, borderRadius: "0px", backgroundColor: NUITB });
    const haut = G.bande(k, [fenetre], { fond: NUITB, colonne: true, max: "1120px", padV: ["72px", "56px", "36px"], padB: ["40px", "32px", "28px"], padH: PAD, nom: "Console" });
    const bas = bandeMentions(k, env, G, { fond: NUITB, texte: "#d6bfca", liens: "#ffffff" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-240 « Cahier des charges » — séminaires d'entreprise. ARCHÉTYPE A (colonne latérale pleine hauteur).
// Idée : une BARRE VERTICALE olive pleine hauteur à gauche (nom, phrase, bouton prune, coordonnées) et, à droite sur brume, une FICHE TECHNIQUE : un tableau à cinq rangées (lieux, restauration, animation, hébergement, horaires de l'équipe) dont les libellés sont des cellules olive.
// Au survol la rangée s'éclaircit. Polices : Schibsted Grotesk (titres) et Public Sans. Pas de lettre d'information.
const brume = identite({
  key: "c240", label: "Brume, olive et prune", humeur: "light",
  fond: "#f1f2ee", texte: "#1f2412", discret: "#4d5238", accent: "#7a2f5e", surface: "#ffffff", encre: "#1f2412",
  police: "font.public-sans", titres: "font.schibsted-grotesk",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#4a522255",
});
const BRUME = "#f1f2ee", OLIVE = "#4a5222", PRUNE2 = "#7a2f5e", ENCRE10 = "#1f2412", OLIVEC = "#dfe3cf";
const cahier = modeleV2({
  id: identifiantV2(240, "cahier-des-charges"), concept: "c-240-cahier-des-charges",
  name: "Cahier des charges", family: FAM,
  description: "Pour l'organisation de séminaires d'entreprise : une barre olive pleine hauteur à gauche (nom, bouton de devis, coordonnées) et, sur brume, une fiche technique en tableau (lieux, restauration, animation, hébergement, horaires). Net et rigoureux.",
  tags: ["séminaire", "entreprise", "barre latérale", "tableau", "fiche technique", "olive", "prune", "angles droits"],
  identity: brume,
  racine: racineDe(BRUME),
  widgets: ["sitetitle", "text", "link", "bizcontact", "bizhours", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 32, "#ffffff", { fontWeight: "700" });
    const lateral = k.col([caps(k, "Séminaires", { couleur: "#e7c6d9", suivi: "0.22em" }), nom, txt(k, "Un lieu, un programme, une équipe : tout se prépare avec un seul interlocuteur.", { taille: 16, couleur: "#ecefdc", max: "280px" }), btn(k, "Demander un devis", "/contact", { texte: "#ffffff", fond: PRUNE2, survol: "#ffffff", surSurvol: ENCRE10, focus: "#ffffff", contour: "#ffffff" }), trait(k, "#ffffff44"), caps(k, "Coordonnées", { couleur: "#e7c6d9" }), coordonnees(k, { taille: 15, couleur: "#f1f3e4", lien: "#ffffff", survol: "#e7c6d9", focus: "#ffffff" })], { flexGrow: 0, flexShrink: 1, flexBasis: "340px", minWidth: "300px", gap: "18px", backgroundColor: OLIVE, paddingTop: "64px", paddingBottom: "64px", paddingLeft: "40px", paddingRight: "36px", borderRadius: "0px", alignItems: "flex-start" }, undefined, { flexBasis: "100%", minWidth: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "44px", paddingBottom: "44px" });
    const RANGEES = [["Lieux", [["Salles plénières", "/contact"], ["Salles de commission", "/contact"], ["Espaces extérieurs", "/contact"]]], ["Restauration", [["Pause café", "/contact"], ["Déjeuner d'équipe", "/contact"], ["Cocktail de clôture", "/contact"]]], ["Animation", [["Team building", "/blog"], ["Soirée de gala", "/blog"], ["Intervenants", "/blog"]]], ["Hébergement", [["Chambres", "/contact"], ["Navettes", "/contact"], ["Plan d'accès", "/contact"]]]];
    const rangee = ([lib, ls], i) => {
      const cel = k.col([caps(k, lib, { couleur: ENCRE10, suivi: "0.16em", extra: {} })], { flexBasis: "190px", flexShrink: 0, flexGrow: 0, minWidth: "190px", backgroundColor: OLIVEC, paddingTop: "18px", paddingBottom: "18px", paddingLeft: "18px", paddingRight: "18px", justifyContent: "center", borderRadius: "0px", alignSelf: "stretch" }, undefined, { minWidth: "100%", flexBasis: "100%", paddingTop: "10px", paddingBottom: "10px" });
      const liensR = k.row(ls.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: ENCRE10, survol: { color: PRUNE2, transform: { y: -2 } }, focus: PRUNE2 })), { rowGap: "0px", columnGap: "28px", alignItems: "center", paddingLeft: "20px", paddingRight: "12px", paddingTop: "6px", paddingBottom: "6px", flexGrow: 1, flexBasis: "0px", minWidth: "240px" }, undefined, { paddingLeft: "0px", minWidth: "100%" });
      const r = k.row([cel, liensR], { gap: "0px", alignItems: "stretch", width: "100%", flexWrap: "wrap", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#4a522266", borderRadius: "0px", transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: "#ffffff" } };
      return r;
    };
    const celH = k.col([souffle(carre(k, PRUNE2, "10px"), 3200), caps(k, "Équipe", { couleur: ENCRE10, suivi: "0.16em" })], { flexBasis: "190px", flexShrink: 0, flexGrow: 0, minWidth: "190px", backgroundColor: OLIVEC, paddingTop: "18px", paddingBottom: "18px", paddingLeft: "18px", paddingRight: "18px", gap: "10px", borderRadius: "0px", alignSelf: "stretch" }, undefined, { minWidth: "100%", flexBasis: "100%" });
    const rangeeH = k.row([celH, k.col([horaires(k, { taille: 15, couleur: ENCRE10 })], { flexGrow: 1, flexBasis: "0px", minWidth: "240px", paddingTop: "14px", paddingBottom: "14px", paddingLeft: "20px", paddingRight: "12px" }, undefined, { paddingLeft: "0px", minWidth: "100%" })], { gap: "0px", alignItems: "stretch", width: "100%", borderRadius: "0px" });
    const tableau = k.col([...RANGEES.map(rangee), rangeeH], { width: "100%", gap: "0px", borderStyle: "solid", borderWidth: "2px", borderColor: OLIVE, borderRadius: "0px", backgroundColor: BRUME });
    const titre = G.geant(`<p>Cahier des charges.</p>`, { taille: [34, 56], mobile: { taille: [32, 40] }, lh: 1.05, suivi: "-0.015em", poids: "700", police: S.head, couleur: ENCRE10 })(k, env);
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: S.mute, liens: ENCRE10 })(k, env);
    const principal = k.col([caps(k, "Fiche technique d'exemple", { couleur: PRUNE2, suivi: "0.2em" }), titre, tableau, mentions], { flexGrow: 1, flexBasis: "0px", minWidth: "320px", gap: "24px", paddingTop: "64px", paddingBottom: "32px", paddingLeft: "56px", paddingRight: "48px", backgroundColor: BRUME, borderRadius: "0px", justifyContent: "space-between" }, undefined, { minWidth: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px" });
    const bande = G.bande(k, [lateral, principal], { fond: BRUME, gap: "0px", aligne: "stretch", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Cahier" });
    return [G.racine(k, [bande])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Événements et réceptions", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits : faire-part centré, frise de soirée, carte du traiteur, console de DJ, fiche technique de séminaire.",
  models: [fairePart, deroule, carteTraiteur, regieSon, cahier],
};
