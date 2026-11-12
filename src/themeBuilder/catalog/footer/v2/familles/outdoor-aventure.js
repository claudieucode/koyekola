// Famille v2 « Outdoor et aventure » — 6 modèles (ft2-404 à ft2-409), pieds « inspirés de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Inspirations : captures 34/35 (colonnes à titre souligné, liste d'articles à puce, contact à icônes, logo + phrase + réseaux) et 36 (nom monumental, blocs adresse / contact / liens aux deux bords, barre de mentions).
// IDÉES de composition reprises, jamais la copie : autres couleurs, proportions, contenus et marques fictives ; aucune photo ni logo copié.
// Un archétype différent par modèle : G index en lignes pleine largeur · H mosaïque asymétrique · I frise en étapes · J papier à en-tête · K fenêtre de console · L escalier.
// Marques fictives ; AUCUNE coordonnée, horaire ni chiffre inventé : adresse et téléphone viennent des Données de l'entreprise du site. Rubriques, étapes et articles = exemples à renommer dans l'éditeur.
//
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms (couleur, fond, décalage de 2 à 10 px) ; UNE animation visible par modèle (bouton ou repère qui « respire », ligne qui glisse,
// case qui se remplit) ; pas d'animation d'entrée, pas de défilement continu.
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");

const DOUX = 360; // ms : durée des transitions de survol / focus
const PH = ["48px", "32px", "20px"]; // marges latérales de bande (bureau, tablette, mobile)

// ── Aides LOCALES à la famille (toutes à angles droits) ──────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const texte = (k, html, o = {}) => k.T(html.startsWith("<") ? html : `<p>${html}</p>`, compact({ fontSize: `${o.taille || 16}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, fontWeight: o.poids, maxWidth: o.largeur, textAlign: o.align, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, flexShrink: 0, borderRadius: "0px" });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, compact({ color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align })));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: o.icones === true, layout: "stack" }, compact({ color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align })));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px", extra: o.extra, mobile: o.mobile });
const abonnement = (k, env, o) => {
  const n = GK.abonnement({ rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", ...o })(k, env);
  n.parts.missing.styles.desktop = { ...n.parts.missing.styles.desktop, color: o.texte || k.S.fg };
  return n;
};
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "800", casse: "uppercase", suivi: "0.08em", couleur: o.texte, h: o.h || "54px", padH: "28px", police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
const reseaux = (G, k, env, o) => G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15, poids: "700", ...o })(k, env);
// Liste de liens en colonne (chaque ligne glisse de 4 px au survol)
const listeLiens = (k, liste, o = {}) => liste.map(([t, u]) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "500", couleur: o.couleur, police: o.police, survol: o.survol || { color: k.S.accent, transform: { x: 4 } }, focus: o.focus, h: o.h }));
// Pied pleine largeur sans marges (la composition gère elle-même ses aplats)
const bandePleine = (G, k, enfants, o = {}) => G.bande(k, enfants, { padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", gap: "0px", aligne: "stretch", ...o });

const FAM = "outdoor-aventure";

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-404 « Carnet de sentier » — randonnée (archétype G, index en lignes pleines ; inspiré de la capture 36)
// Idée : six rubriques en lignes pleine largeur (grand libellé en slab Alfa, numéro, filet) qui glissent et ocrent au survol ; sous l'index, une ligne : coordonnées, réseaux, mentions. Vert forêt et ocre.
const carnet = identite({
  key: "c404", label: "Vert forêt et ocre", humeur: "dark",
  fond: "#1b2a20", texte: "#efe9d8", discret: "#b5c2b4", accent: "#e0a53a", surface: "#243628", encre: "#1b2a20", surEncre: "#efe9d8",
  police: "font.cabin", titres: "font.alfa-slab-one",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#efe9d833",
});
const FORET = "#1b2a20", OCRE = "#e0a53a", PARCHEMIN = "#efe9d8";
const carnetDeSentier = modeleV2({
  id: identifiantV2(404, "carnet-de-sentier"), concept: "c-404-carnet-de-sentier",
  name: "Carnet de sentier", family: FAM,
  description: "Pour un site de randonnée : un index de six rubriques en lignes pleine largeur avec grand libellé, numéro et filet, qui glissent au survol, puis coordonnées, réseaux et mentions. Vert forêt et ocre.",
  tags: ["randonnée", "sentiers", "index", "lignes", "sommaire", "vert forêt", "ocre", "angles droits"],
  identity: carnet,
  racine: racineDe(FORET),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const rubriques = [["Itinéraires", "/blog"], ["Matériel", "/catalogue"], ["Conseils de saison", "/blog"], ["Sécurité en montagne", "/catalogue"], ["Carnets de route", "/blog"], ["Contact", "/contact"]];
    const ligneIndex = ([t, u], i) => {
      const num = caps(k, String(i + 1).padStart(2, "0"), { couleur: OCRE, suivi: "0.2em", extra: { minWidth: "34px" } });
      const l = lien(k, t, u, { taille: 52, poids: "400", police: S.head, couleur: PARCHEMIN, h: "84px", survol: { color: OCRE, transform: { x: 12 } }, focus: OCRE, extra: { fontSize: "fluid:28-60", flexGrow: 1, lineHeight: 1.1 } });
      return k.col([k.row([num, l], { gap: "18px", alignItems: "center", flexWrap: "nowrap", width: "100%" }), trait(k, "#efe9d838")], { gap: "0px", width: "100%" });
    };
    const entete = k.row([caps(k, "Carnet de sentier", { couleur: OCRE, suivi: "0.3em" }), caps(k, "Randonnée et grands espaces", { couleur: S.mute, suivi: "0.2em" })], { justifyContent: "space-between", flexWrap: "wrap", gap: "8px 24px", width: "100%" });
    const index = G.bande(k, [entete, trait(k, "#efe9d838"), ...rubriques.map(ligneIndex)], { fond: FORET, colonne: true, gap: "0px", padV: ["64px", "52px", "40px"], padB: ["32px", "28px", "24px"], padH: PH, innerMobile: { rowGap: "0px" }, nom: "Index" });
    const co = k.col([caps(k, "Nous joindre", { couleur: OCRE }), coordonnees(k, { couleur: PARCHEMIN, lien: PARCHEMIN, survol: OCRE, focus: OCRE, taille: 15 })], { gap: "10px", flexGrow: 1, flexBasis: "260px", minWidth: "240px" });
    const rs = k.col([caps(k, "Nous suivre", { couleur: OCRE }), reseaux(G, k, env, { couleur: PARCHEMIN, survol: OCRE, focus: OCRE })], { gap: "6px", flexGrow: 1, flexBasis: "260px", minWidth: "240px" });
    const mentions = G.ligneLegale({ taille: 13, couleur: S.mute, liens: PARCHEMIN, sansCookies: true })(k, env);
    const bas = G.bande(k, [G.ligne(k, [co, rs], { gap: "28px 48px", aligne: "flex-start", largeur: "100%" }), mentions], { fond: FORET, colonne: true, gap: "36px", padV: ["32px", "28px", "24px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Infos" });
    return [G.racine(k, [index, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-405 « Cordée » — alpinisme et matériel (archétype H, mosaïque asymétrique ; inspiré de la capture 36)
// Idée : une grande case marine à gauche (nom, phrase, bouton orange qui respire) et trois petites cases à droite, trois couleurs franches : liens (glace), coordonnées (orange), horaires et réseaux (bleu clair). Mentions sur bande marine.
const cordee = identite({
  key: "c405", label: "Marine, glace et orange sécurité", humeur: "dark",
  fond: "#0d2b45", texte: "#eef5f9", discret: "#b9cfdd", accent: "#ff6a13", surface: "#143a5c", encre: "#0d2b45", surEncre: "#eef5f9",
  police: "font.be-vietnam-pro", titres: "font.saira-condensed",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#eef5f933",
});
const MARINE5 = "#0d2b45", GLACE = "#e8f1f5", BLEU5 = "#bcd8e6", ORANGE5 = "#ff6a13";
const cordeeModele = modeleV2({
  id: identifiantV2(405, "cordee"), concept: "c-405-cordee",
  name: "Cordée", family: FAM,
  description: "Pour une boutique d'alpinisme : une grande case marine avec nom, phrase et bouton, et trois petites cases franches (liens, coordonnées, horaires et réseaux) en mosaïque asymétrique. Marine, glace et orange.",
  tags: ["alpinisme", "montagne", "mosaïque", "cases", "asymétrique", "marine", "orange", "angles droits"],
  identity: cordee,
  racine: racineDe(MARINE5),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = G.geant(`<p>Cordée<br>&amp; compagnie</p>`, { taille: [56, 112], tablette: { taille: [64, 96] }, mobile: { taille: [56, 68] }, lh: 0.95, suivi: "0", poids: "700", police: S.head, couleur: GLACE, casse: "uppercase" })(k, env);
    const phrase = texte(k, "Le matériel et les conseils pour partir en sécurité, de la première sortie à la grande voie.", { taille: 17, couleur: BLEU5, largeur: "380px" });
    const cta = souffle(bouton(k, "Voir le matériel", "/catalogue", { texte: MARINE5, fond: ORANGE5, survol: { backgroundColor: GLACE, borderColor: GLACE, color: MARINE5, transform: { y: -3 } }, focus: GLACE }), 4000);
    const grande = GK.colonne(k, [caps(k, "Alpinisme et escalade", { couleur: ORANGE5, suivi: "0.26em" }), nom, phrase, cta], { poids: 8, min: "300px", gap: "28px", justifie: "space-between", extra: { backgroundColor: MARINE5, paddingTop: "72px", paddingBottom: "64px", paddingLeft: "48px", paddingRight: "40px" }, mobile: { paddingTop: "48px", paddingBottom: "44px", paddingLeft: "20px", paddingRight: "20px" } });
    const petite = (fond, enfants, nomCase) => k.col(enfants, { backgroundColor: fond, paddingTop: "28px", paddingBottom: "26px", paddingLeft: "32px", paddingRight: "28px", gap: "10px", flexGrow: 1, flexBasis: "280px", minWidth: "240px", borderRadius: "0px" });
    const c1 = petite(GLACE, [caps(k, "Rubriques", { couleur: "#8a3a05" }), ...listeLiens(k, [["Boutique", "/boutique"], ["Guides et topos", "/blog"], ["Location", "/catalogue"], ["Questions fréquentes", "/faq"]], { couleur: MARINE5, survol: { color: "#8a3a05", transform: { x: 5 } }, focus: MARINE5, taille: 17, poids: "600" })]);
    const c2 = petite(ORANGE5, [caps(k, "Nous trouver", { couleur: MARINE5 }), coordonnees(k, { couleur: MARINE5, lien: MARINE5, survol: "#ffffff", focus: MARINE5, taille: 15 })]);
    const c3 = petite(BLEU5, [caps(k, "Ouverture", { couleur: MARINE5 }), horaires(k, { couleur: MARINE5, taille: 14 }), reseaux(G, k, env, { couleur: MARINE5, survol: "#8a3a05", focus: MARINE5 })]);
    const haut = k.row([grande, GK.colonne(k, [c1], { poids: 4, min: "300px", gap: "0px", aligne: "stretch" })], { gap: "0px", alignItems: "stretch", width: "100%" });
    const dessous = k.row([c2, c3], { gap: "0px", alignItems: "stretch", width: "100%" });
    const mosaique = bandePleine(G, k, [haut, dessous], { fond: MARINE5, colonne: true, nom: "Mosaïque" });
    const mentions = G.ligneLegale({ taille: 13, couleur: S.mute, liens: GLACE, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: MARINE5, colonne: true, padV: ["24px", "22px", "20px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [mosaique, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-406 « Frise du bivouac » — voyage en autonomie, bivouac (archétype I, frise en étapes à points carrés ; inspiré des captures 34/35)
// Idée : une frise horizontale de quatre étapes (préparer, partir, bivouaquer, rentrer) reliées par un filet, chacune avec son repère carré, son titre-lien et une courte phrase ; dessous, bande rouille : coordonnées, réseaux, mentions. Sable et rouille.
const etapes = identite({
  key: "c406", label: "Sable et rouille", humeur: "light",
  fond: "#f1e3c8", texte: "#33180e", discret: "#6a4a3a", accent: "#a63716", surface: "#e8d6b4", encre: "#7a2410", surEncre: "#fdf3e3",
  police: "font.josefin-sans", titres: "font.yeseva-one",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#33180e33",
});
const SABLE6 = "#f1e3c8", ROUILLE = "#7a2410", BRIQUE6 = "#a63716", ENCRE6 = "#33180e", CRU = "#fdf3e3";
const quatreEtapes = modeleV2({
  id: identifiantV2(406, "frise-du-bivouac"), concept: "c-406-frise-du-bivouac",
  name: "Frise du bivouac", family: FAM,
  description: "Pour un site de voyage en autonomie : une frise de quatre étapes (préparer, partir, bivouaquer, rentrer) reliées par un filet à repères carrés, puis une bande rouille avec coordonnées, réseaux et mentions. Sable et rouille.",
  tags: ["voyage", "bivouac", "frise", "étapes", "chronologie", "sable", "rouille", "angles droits"],
  identity: etapes,
  racine: racineDe(SABLE6),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const titre = G.geant(`<p>Du premier pas<br>au retour.</p>`, { taille: [36, 68], tablette: { taille: [40, 56] }, mobile: { taille: [36, 42] }, lh: 1.05, suivi: "0", poids: "400", police: S.head, couleur: ENCRE6 })(k, env);
    const sous = texte(k, "Quatre étapes pour préparer une sortie en autonomie, sans rien oublier.", { taille: 17, couleur: "#6a4a3a", largeur: "360px" });
    const entete = G.ligne(k, [titre, sous], { gap: "20px 64px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    const repere = (num, dernier) => k.row([num === 1 ? souffle(carre(k, BRIQUE6, "18px"), 2600) : carre(k, BRIQUE6, "18px"), ...(dernier ? [] : [k.divider({ width: "100%", borderColor: BRIQUE6, borderTopWidth: "2px", marginTop: "0px", marginBottom: "0px", flexGrow: 1 })])], { gap: "10px", alignItems: "center", flexWrap: "nowrap", flexGrow: 1, flexBasis: "190px", minWidth: "170px", paddingRight: "20px" });
    const fil = k.row([1, 2, 3, 4].map((n) => repere(n, n === 4)), { gap: "0px", alignItems: "center", flexWrap: "wrap", width: "100%" });
    const etape = (num, nom, url, resume) => k.col([caps(k, `Étape ${num}`, { couleur: BRIQUE6, suivi: "0.22em" }), lien(k, nom, url, { taille: 25, poids: "400", police: S.head, couleur: ENCRE6, survol: { color: BRIQUE6, transform: { x: 5 } }, focus: BRIQUE6, h: "44px" }), texte(k, resume, { taille: 15, couleur: "#6a4a3a", largeur: "240px" })], { gap: "10px", flexGrow: 1, flexBasis: "190px", minWidth: "170px", paddingRight: "20px" });
    const textes = k.row([etape(1, "Préparer", "/faq", "Itinéraire, météo, sacs."), etape(2, "Partir", "/faq", "Transports et premières heures."), etape(3, "Bivouaquer", "/faq", "Choisir et installer son camp."), etape(4, "Rentrer", "/faq", "Bilan, entretien du matériel.")], { gap: "0px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" });
    const frise = k.col([fil, textes], { gap: "18px", width: "100%" });
    const haut = G.bande(k, [entete, frise], { fond: SABLE6, colonne: true, gap: "56px", padV: ["80px", "64px", "44px"], padB: ["64px", "52px", "40px"], padH: PH, innerMobile: { rowGap: "32px" }, nom: "Frise" });
    const co = k.col([caps(k, "Nous joindre", { couleur: "#f2b49f" }), coordonnees(k, { couleur: CRU, lien: CRU, survol: "#f2b49f", focus: "#f2b49f", taille: 15 })], { gap: "10px", flexGrow: 1, flexBasis: "260px", minWidth: "240px" });
    const rs = k.col([caps(k, "Nous suivre", { couleur: "#f2b49f" }), reseaux(G, k, env, { couleur: CRU, survol: "#f2b49f", focus: "#f2b49f" })], { gap: "6px", flexGrow: 1, flexBasis: "260px", minWidth: "240px" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#f1d2c4", liens: CRU, sansCookies: true })(k, env);
    const bas = G.bande(k, [G.ligne(k, [co, rs], { gap: "28px 48px", aligne: "flex-start", largeur: "100%" }), trait(k, "#fdf3e344"), mentions], { fond: ROUILLE, colonne: true, gap: "28px", padV: ["44px", "36px", "32px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Infos" });
    bas.styles.desktop.color = CRU;
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-407 « Bureau des guides » — guides de haute montagne (archétype J, papier à en-tête)
// Idée : un papier crème à filets doubles, tout centré : cartouche du bureau (nom en capitales de Libre Caslon, mention d'activité), coordonnées centrées, liens en ligne centrée séparés par des points carrés, signature. Encre marine.
const bureau = identite({
  key: "c407", label: "Papier crème et encre marine", humeur: "light",
  fond: "#f8f3e4", texte: "#1c2a44", discret: "#4c5870", accent: "#8f1d2c", surface: "#eee6cf", encre: "#1c2a44", surEncre: "#f8f3e4",
  police: "font.crimson-pro", titres: "font.libre-caslon-text",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#1c2a4440",
});
const PAPIER = "#f8f3e4", ENCRE7 = "#1c2a44", GRENAT = "#8f1d2c";
const bureauDesGuides = modeleV2({
  id: identifiantV2(407, "bureau-des-guides"), concept: "c-407-bureau-des-guides",
  name: "Bureau des guides", family: FAM,
  description: "Pour un bureau de guides de haute montagne : un papier à en-tête crème à filets doubles, nom en capitales, mention d'activité, coordonnées et liens en ligne centrés, signature. Encre marine et grenat.",
  tags: ["guides", "haute montagne", "papier à en-tête", "centré", "filets doubles", "crème", "marine", "angles droits"],
  identity: bureau,
  racine: racineDe(PAPIER),
  widgets: ["text", "link", "bizcontact", "bizhours", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const doubles = () => k.col([trait(k, ENCRE7, "3px"), trait(k, ENCRE7, "1px")], { gap: "4px", width: "100%" });
    const nom = G.geant(`<p>Bureau des guides</p>`, { taille: [30, 64], tablette: { taille: [36, 56] }, mobile: { taille: [28, 34] }, lh: 1.1, suivi: "0.16em", poids: "400", police: S.head, couleur: ENCRE7, casse: "uppercase", align: "center" })(k, env);
    const mention = caps(k, "Encadrement en haute montagne", { couleur: GRENAT, suivi: "0.34em", extra: { textAlign: "center" } });
    const haut = k.row([carre(k, GRENAT, "10px"), carre(k, ENCRE7, "10px"), carre(k, GRENAT, "10px")], { gap: "8px", alignItems: "center", justifyContent: "center" });
    const hor = k.col([caps(k, "Horaires", { couleur: S.mute, suivi: "0.2em", extra: { textAlign: "center" } }), horaires(k, { couleur: ENCRE7, taille: 15, align: "center" })], { gap: "10px", alignItems: "center", flexGrow: 1, flexBasis: "240px", minWidth: "220px" });
    const co = k.col([caps(k, "Pour nous écrire", { couleur: S.mute, suivi: "0.2em", extra: { textAlign: "center" } }), coordonnees(k, { couleur: ENCRE7, lien: ENCRE7, survol: GRENAT, focus: GRENAT, taille: 17, align: "center" })], { gap: "10px", alignItems: "center", flexGrow: 1, flexBasis: "240px", minWidth: "220px" });
    const infos = k.row([hor, co], { gap: "24px 48px", alignItems: "flex-start", justifyContent: "center", flexWrap: "wrap", width: "100%" });
    const items = [["Sorties encadrées", "/blog"], ["Formations", "/catalogue"], ["Conditions en montagne", "/blog"], ["Questions fréquentes", "/faq"], ["Contact", "/contact"]];
    const ligneLiens = [];
    items.forEach(([t, u], i) => { if (i) ligneLiens.push(souffleSiPremier(carre(k, GRENAT, "7px"), i === 1)); ligneLiens.push(lien(k, t, u, { taille: 17, poids: "500", couleur: ENCRE7, survol: { color: GRENAT, textDecoration: "underline", transform: { y: -2 } }, focus: GRENAT })); });
    const navigation = k.row(ligneLiens, { gap: "4px 16px", alignItems: "center", justifyContent: "center", flexWrap: "wrap", width: "100%" });
    const res = reseaux(G, k, env, { couleur: ENCRE7, survol: GRENAT, focus: GRENAT, poids: "600" });
    res.styles.desktop = { ...(res.styles.desktop || {}), justifyContent: "center" };
    const mentions = G.ligneLegale({ taille: 14, couleur: S.mute, liens: ENCRE7, sansCookies: true })(k, env, true);
    const bande = G.bande(k, [haut, mention, nom, infos, navigation, res, doubles(), mentions], { fond: PAPIER, colonne: true, gap: "30px", aligne: "center", max: "960px", padV: ["48px", "40px", "32px"], padB: ["24px", "22px", "20px"], padH: PH, nom: "Papier à en-tête" });
    return [G.racine(k, [bande])];
  },
}, FAM);
function souffleSiPremier(n, oui) { return oui ? souffle(n, 3000) : n; }

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-408 « Console de sentier » — application de trail et de GPS (archétype K, fenêtre de console)
// Idée : le pied ressemble à une fenêtre de terminal à bords nets : barre de titre à trois carrés, invites « $ » : rubriques en liste « > », coordonnées, lettre d'information ; un curseur carré clignote doucement. Tout en Martian Mono, bleu nuit et cyan.
const console_ = identite({
  key: "c408", label: "Bleu nuit et cyan", humeur: "dark",
  fond: "#0a1020", texte: "#dbe7f3", discret: "#97a9bf", accent: "#4de3d0", surface: "#111a30", encre: "#0a1020", surEncre: "#dbe7f3",
  police: "font.martian-mono", titres: "font.martian-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#4de3d055",
});
const NUIT = "#0a1020", NUIT2 = "#111a30", CYAN = "#4de3d0", GIVRE = "#dbe7f3", AMBRE = "#f2b84b";
const consoleDeSentier = modeleV2({
  id: identifiantV2(408, "console-de-sentier"), concept: "c-408-console-de-sentier",
  name: "Console de sentier", family: FAM,
  description: "Pour une application de trail et de GPS : le pied est une fenêtre de terminal à bords nets, barre de titre à trois carrés, rubriques en liste, coordonnées et lettre d'information en invites de commande. Bleu nuit et cyan.",
  tags: ["trail", "application", "console", "terminal", "monospace", "fenêtre", "bleu nuit", "cyan", "angles droits"],
  identity: console_,
  racine: racineDe(NUIT),
  widgets: ["text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const mono = { fontFamily: S.font };
    const invite = (cmd) => k.T(`<p><span style="color:${CYAN}">$</span> ${cmd}</p>`, { ...mono, fontSize: "14px", lineHeight: 1.5, color: GIVRE, fontWeight: "600" });
    const titreBarre = k.row([carre(k, "#ff6b6b", "12px"), carre(k, AMBRE, "12px"), souffle(carre(k, CYAN, "12px"), 2400), k.T("<p>sentier — terminal</p>", { ...mono, fontSize: "12px", color: S.mute, marginLeft: "12px" })], { gap: "8px", alignItems: "center", flexWrap: "nowrap", paddingTop: "12px", paddingBottom: "12px", paddingLeft: "16px", paddingRight: "16px", backgroundColor: NUIT2, borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#4de3d055", width: "100%" });
    const rubriques = [["itineraires/", "/blog"], ["cartes-hors-ligne/", "/catalogue"], ["carnet-de-course/", "/blog"], ["aide/", "/faq"], ["contact", "/contact"]];
    const liste = k.col(rubriques.map(([t, u]) => lien(k, `&gt; ${t}`, u, { taille: 15, poids: "500", couleur: GIVRE, police: S.font, survol: { color: CYAN, transform: { x: 6 } }, focus: CYAN, h: "44px" })), { gap: "0px" });
    const colLiens = GK.colonne(k, [invite("ls ./rubriques"), liste], { poids: 1, min: "240px", gap: "10px" });
    const colContact = GK.colonne(k, [invite("cat contact.txt"), coordonnees(k, { couleur: GIVRE, lien: GIVRE, survol: CYAN, focus: CYAN, taille: 14, police: S.font }), invite("open reseaux"), reseaux(G, k, env, { couleur: GIVRE, survol: CYAN, focus: CYAN, taille: 14 })], { poids: 1, min: "240px", gap: "12px" });
    const abo = abonnement(k, env, { titre: "", intro: "Nouveaux itinéraires, une fois par mois.", bouton: "Valider", largeur: "360px", accent: CYAN, texte: GIVRE, policeChamp: S.font, tailleChamp: "15px", styleTitre: { fontSize: "1px", color: GIVRE, height: "0px", marginBottom: "0px" } });
    abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: S.mute, fontSize: "13px", fontFamily: S.font };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: NUIT, fontSize: "13px", fontFamily: S.font };
    abo.parts.button.states = { hover: { backgroundColor: GIVRE, color: NUIT }, focus: GK.focus(GIVRE) };
    const colAbo = GK.colonne(k, [invite("subscribe --mensuel"), abo], { poids: 1, min: "260px", gap: "12px" });
    const corps = G.ligne(k, [colLiens, colContact, colAbo], { gap: "32px 40px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    corps.styles.desktop = { ...corps.styles.desktop, paddingTop: "28px", paddingBottom: "28px", paddingLeft: "24px", paddingRight: "24px" };
    corps.styles.mobile = { ...(corps.styles.mobile || {}), paddingLeft: "16px", paddingRight: "16px" };
    const curseur = k.row([invite("exit"), souffle(carre(k, CYAN, "10px"), 1800)], { gap: "8px", alignItems: "center", paddingTop: "0px", paddingBottom: "18px", paddingLeft: "24px" });
    const fenetre = k.col([titreBarre, corps, curseur], { borderStyle: "solid", borderWidth: "1px", borderColor: "#4de3d055", backgroundColor: NUIT, borderRadius: "0px", gap: "0px", width: "100%" });
    const haut = G.bande(k, [fenetre], { fond: NUIT, colonne: true, padV: ["56px", "44px", "32px"], padB: ["20px", "18px", "16px"], padH: PH, nom: "Fenêtre" });
    const mentions = G.ligneLegale({ taille: 12, couleur: S.mute, liens: GIVRE, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: NUIT, colonne: true, padV: ["8px", "8px", "8px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-409 « Dénivelé » — cyclo-voyage et vélo de montagne (archétype L, pied en escalier)
// Idée : quatre bandes alignées à gauche de largeurs décroissantes (100 %, 72 %, 48 %, 30 %) et de plus en plus sombres, comme des marches : nom et bouton ; liens en ligne ; coordonnées ; réseaux et mentions. Sur mobile, les marches prennent toute la largeur.
const deniv = identite({
  key: "c409", label: "Ambre, cuivre et terre brûlée", humeur: "dark",
  fond: "#1e140d", texte: "#f8efe3", discret: "#d9c3ab", accent: "#f0a050", surface: "#3a2312", encre: "#1e140d", surEncre: "#f8efe3",
  police: "font.oxanium", titres: "font.oxanium",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f8efe344",
});
const TERRE = "#1e140d", AMBRE9 = "#f3b66d", CUIVRE9 = "#d9822b", BRUN9 = "#8f4a1b", CHOC = "#3a2312", CREME9 = "#f8efe3";
const denivele = modeleV2({
  id: identifiantV2(409, "denivele"), concept: "c-409-denivele",
  name: "Dénivelé", family: FAM,
  description: "Pour un site de cyclo-voyage : quatre bandes en escalier alignées à gauche, de largeurs décroissantes et de plus en plus sombres, avec nom et bouton, liens, coordonnées, réseaux et mentions. Ambre, cuivre et terre brûlée.",
  tags: ["vélo", "cyclo-voyage", "escalier", "bandes", "décroissant", "ambre", "cuivre", "angles droits"],
  identity: deniv,
  racine: racineDe(TERRE),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const marche = (enfants, fond, couleur, largeur, pv, o = {}) => k.col(enfants, { width: largeur, backgroundColor: fond, color: couleur, paddingTop: pv[0], paddingBottom: pv[1], paddingLeft: "48px", paddingRight: "40px", gap: o.gap || "20px", alignItems: "flex-start", borderRadius: "0px", boxSizing: "border-box" }, undefined, { width: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "32px", paddingBottom: "32px" });
    const nom = G.geant(`<p>Dénivelé</p>`, { taille: [52, 120], tablette: { taille: [64, 96] }, mobile: { taille: [48, 60] }, lh: 1, suivi: "-0.02em", poids: "800", police: S.head, couleur: TERRE, casse: "uppercase" })(k, env);
    const intro = texte(k, "Itinéraires à vélo, cols et conseils pour voyager léger.", { taille: 17, couleur: "#3a2312", largeur: "380px", poids: "500" });
    const cta = souffle(bouton(k, "Voir les itinéraires", "/blog", { texte: AMBRE9, fond: TERRE, survol: { backgroundColor: CREME9, borderColor: TERRE, color: TERRE, transform: { y: -3 } }, focus: TERRE }), 4200);
    const m1 = marche([k.row([nom, k.col([intro, cta], { gap: "18px", alignItems: "flex-start" })], { gap: "20px 56px", alignItems: "flex-end", flexWrap: "wrap" })], AMBRE9, TERRE, "100%", ["64px", "56px"]);
    const nav = k.row([...listeLiens(k, [["Itinéraires", "/blog"], ["Cols mythiques", "/blog"], ["Bagagerie", "/catalogue"], ["Entretien", "/faq"]], { couleur: TERRE, poids: "700", survol: { color: "#ffffff", transform: { y: -3 } }, focus: TERRE })], { gap: "0px 28px", alignItems: "center", flexWrap: "wrap" });
    const m2 = marche([caps(k, "Rubriques", { couleur: TERRE }), nav], CUIVRE9, TERRE, "72%", ["32px", "28px"], { gap: "6px" });
    const m3 = marche([caps(k, "Nous trouver", { couleur: "#ffe2b8" }), coordonnees(k, { couleur: CREME9, lien: CREME9, survol: AMBRE9, focus: AMBRE9, taille: 15 })], BRUN9, CREME9, "48%", ["32px", "28px"], { gap: "10px" });
    const mentions = G.ligneLegale({ taille: 13, couleur: S.mute, liens: CREME9, sansCookies: true })(k, env, false);
    const m4 = marche([reseaux(G, k, env, { couleur: CREME9, survol: AMBRE9, focus: AMBRE9 }), mentions], CHOC, CREME9, "32%", ["24px", "18px"], { gap: "10px" });
    m4.styles.desktop = { ...m4.styles.desktop, minWidth: "360px" };
    return [G.racine(k, [m1, m2, m3, m4])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Outdoor et aventure", target: 6, built: true,
  description: "Pieds standard, angles droits, animations fluides : randonnée, alpinisme, bivouac, guides de haute montagne, application de trail, cyclo-voyage.",
  models: [carnetDeSentier, cordeeModele, quatreEtapes, bureauDesGuides, consoleDeSentier, denivele],
};
