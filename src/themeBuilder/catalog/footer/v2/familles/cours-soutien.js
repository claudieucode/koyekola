// Famille v2 « Cours et soutien scolaire » — 5 modèles (ft2-231 à ft2-235), extension « carrée 2 » : ANGLES DROITS partout (aucun border-radius non nul), sites standard très professionnels.
// Pieds de cours : soutien scolaire, cours de langues, cours de musique, auto-formation en ligne, préparation aux concours. Niveaux, essai gratuit (en texte, sur la page contact), planning (widget « Données de l'entreprise »).
// Marques fictives ; AUCUNE date, coordonnée, tarif ni chiffre inventé. Niveaux, langues, instruments et concours sont des intitulés d'EXEMPLE à renommer dans l'éditeur.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») :
//   · transitions longues et douces de 360 ms (couleur, fond, décalage de 2 à 8 px, retrait qui grandit) ;
//   · UNE animation visible par modèle : carré de statut qui « respire », rangée qui se remplit, case qui s'inverse, voyant du lecteur qui pulse, repère qui se coche.
//   Limites du moteur : pas d'animation d'ENTRÉE, pas de défilement continu (voir BRIEF_CARRE.md).
const FAM = "cours-soutien";
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");

const DOUX = 360; // ms : transitions de survol / focus

// ── Aides LOCALES (toutes à angles droits) ───────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, transform: { x: 4 } }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const para = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: `${o.taille || 16}px`, lineHeight: o.lh || 1.55, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, maxWidth: o.max, textAlign: o.align, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, borderRadius: "0px", flexShrink: 0 });
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
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px", extra: o.extra, mobile: o.mobile });
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
const liensStd = (k, couleur, survol, liste, o = {}) => (liste || [["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Nous contacter", "/contact"], ["Espace client", "/connexion"]]).map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur, survol: { color: survol, transform: { x: 6 } }, focus: survol, ...o }));

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-231 « Cahier de textes » — soutien scolaire   [archétype G : index en lignes pleine largeur, grand libellé, flèche, filet]
// Idée : un SOMMAIRE de cahier. Cinq lignes pleine largeur (Primaire, Collège, Lycée, Supérieur, Essai gratuit) en très grand serif, chacune avec une flèche et un filet bleu ; une marge rouge de cahier court à gauche.
// Au survol la ligne se teinte, le mot vire au rouge et la flèche glisse. Dessous, une seule ligne : adresse et mentions. Ni cartes, ni colonnes. « Essai gratuit » renvoie à la page contact (texte seulement).
// Polices : Young Serif (grand) et Mulish. Mobile : lignes plus petites, flèche à droite conservée.
const cahier = identite({
  key: "c231", label: "Papier ligné, marine et rouge marge", humeur: "light",
  fond: "#f8fbff", texte: "#16325c", discret: "#445a7a", accent: "#d01846", surface: "#ffffff", encre: "#16325c",
  police: "font.mulish", titres: "font.young-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#16325c44",
});
const PAPIER = "#f8fbff", MAR = "#16325c", MARGE = "#d01846";

const cahierDeTextes = modeleV2({
  id: identifiantV2(231, "cahier-de-textes"), concept: "c-231-cahier-de-textes",
  name: "Cahier de textes", family: FAM,
  description: "Pour du soutien scolaire : un sommaire de cahier en cinq lignes pleine largeur (primaire, collège, lycée, supérieur, essai gratuit), très grand serif, flèche qui glisse, marge rouge à gauche, puis une ligne d'adresse et de mentions.",
  tags: ["soutien scolaire", "sommaire", "index", "niveaux", "essai gratuit", "marine", "rouge", "serif", "angles droits"],
  identity: cahier,
  racine: racineDe(PAPIER),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const ligneIdx = (num, titre, note, url, essai) => {
      const t = lien(k, titre, url, { taille: 52, poids: "400", police: S.head, couleur: essai ? MARGE : MAR, survol: { color: MARGE }, focus: MARGE, h: "76px", lh: 1, extra: { flexGrow: 1 } });
      t.styles.desktop.fontSize = "fluid:30-56";
      const fl = k.T("<p>→</p>", { fontSize: "32px", color: MARGE, fontFamily: S.font, lineHeight: 1, fontWeight: "700", transitionDuration: DOUX });
      fl.states = { hover: { transform: { x: 10 } } };
      const r = k.row([caps(k, num, { couleur: MARGE, suivi: "0.16em", extra: { minWidth: "32px" } }), t, k.T(`<p>${note}</p>`, { fontSize: "15px", color: S.mute, fontFamily: S.font, lineHeight: 1.4 }, undefined, { display: "none" }), fl], { flexWrap: "nowrap", alignItems: "center", gap: "20px", width: "100%", paddingLeft: "28px", paddingRight: "20px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#16325c55", borderRadius: "0px", backgroundColor: PAPIER, transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: "#eaf2fc", paddingLeft: "44px" } };
      return r;
    };
    const liste = k.col([ligneIdx("01", "Primaire", "Du CP au CM2", "/faq"), ligneIdx("02", "Collège", "De la 6e à la 3e", "/faq"), ligneIdx("03", "Lycée", "Seconde, première, terminale", "/faq"), ligneIdx("04", "Supérieur", "Études et méthodes", "/blog"), ligneIdx("05", "Essai gratuit", "Demandez-le par la page contact", "/contact", true)], { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderColor: MAR });
    const cadreListe = k.col([liste], { width: "100%", gap: "0px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "3px", borderColor: MARGE, borderRadius: "0px" });
    const entete = k.row([caps(k, "Cahier de soutien", { couleur: MARGE, suivi: "0.24em" }), para(k, "Choisissez un niveau pour trouver le bon cours.", { taille: 17, couleur: MAR })], { rowGap: "6px", columnGap: "24px", alignItems: "baseline", width: "100%" });
    const haut = G.bande(k, [entete, cadreListe], { fond: PAPIER, colonne: true, gap: "28px", padV: ["72px", "56px", "40px"], padB: ["40px", "32px", "24px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "20px" }, nom: "Sommaire" });
    const adresse = G.colonne(k, [coordonnees(k, { taille: 15, lien: MAR, survol: MARGE, focus: MARGE })], { poids: 1, min: "260px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [adresse, G.colonne(k, [mentions], { poids: 2, min: "300px", soi: "flex-end" })], { fond: PAPIER, gap: "20px 40px", aligne: "flex-end", padV: ["16px", "16px", "8px"], padB: ["36px", "28px", "24px"], padH: ["48px", "32px", "20px"], nom: "Adresse" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-232 « Damier des langues » — cours de langues   [archétype C : grille de cases égales, chaque case est un lien ou une information]
// Idée : un DAMIER de huit cases égales sans espace : six langues (EN, ES, DE, IT, FR, ZH) dont le code est géant, une case « Planning » (horaires) et une case « Adresse ». Les cases alternent papier, bleu et rouge ;
// au survol une case de langue s'inverse et son code glisse. Dessous une fine barre marine pour les mentions. Pas de lettre. Langues d'exemple, à renommer.
// Polices : Syne (codes géants, 800) et DM Sans. Mobile : deux cases par ligne puis une par ligne.
const langues = identite({
  key: "c232", label: "Papier, bleu drapeau et rouge", humeur: "light",
  fond: "#f3efe2", texte: "#10203a", discret: "#42506a", accent: "#c4202f", surface: "#ffffff", encre: "#10203a",
  police: "font.dm-sans", titres: "font.syne",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#10203a44",
});
const PAP = "#f3efe2", BLEU = "#1d4e89", ROUGE = "#c4202f", ENCRE2 = "#10203a";

const damierLangues = modeleV2({
  id: identifiantV2(232, "damier-des-langues"), concept: "c-232-damier-des-langues",
  name: "Damier des langues", family: FAM,
  description: "Pour des cours de langues : un damier de huit cases égales, six langues aux codes géants (EN, ES, DE, IT, FR, ZH) qui s'inversent au survol, une case planning et une case adresse. Papier, bleu et rouge, sans espace entre les cases.",
  tags: ["cours de langues", "damier", "grille de cases", "codes géants", "planning", "bleu", "rouge", "angles droits"],
  identity: langues,
  racine: racineDe(ENCRE2),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const base = { flexGrow: 1, flexBasis: "25%", minWidth: "200px", minHeight: "230px", boxSizing: "border-box", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "26px", paddingRight: "26px", gap: "10px", justifyContent: "space-between", borderStyle: "solid", borderWidth: "0px", borderRightWidth: "1px", borderBottomWidth: "1px", borderColor: "#10203a55", borderRadius: "0px", transitionDuration: DOUX };
    const caseLangue = (code, nom, fond, encre, hoverFond, hoverEncre, url) => {
      const a = lien(k, code, url, { taille: 76, poids: "800", police: S.head, couleur: encre, survol: { color: hoverEncre, transform: { x: 8 } }, focus: hoverEncre, h: "84px", lh: 1, suivi: "-0.02em" });
      a.styles.desktop.fontSize = "fluid:52-84";
      const c = k.col([caps(k, "Cours de", { couleur: encre, suivi: "0.2em" }), a, k.row([para(k, nom, { taille: 17, couleur: encre, extra: { fontWeight: "700" } }), k.T("<p>→</p>", { fontSize: "22px", fontWeight: "800", color: encre, lineHeight: 1 })], { justifyContent: "space-between", flexWrap: "nowrap", width: "100%", gap: "8px" }), trait(k, encre, "2px")], { ...base, backgroundColor: fond }, undefined, { minWidth: "50%", flexBasis: "50%", minHeight: "190px", paddingLeft: "16px", paddingRight: "12px" });
      c.states = { hover: { backgroundColor: hoverFond } };
      return c;
    };
    const pt = souffle(carre(k, ROUGE, "10px"), 3200);
    const caseInfo = (titre, enfants, fond, couleurTitre, statut) => k.col([k.row([...(statut ? [statut] : []), caps(k, titre, { couleur: couleurTitre, suivi: "0.2em" })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" }), ...enfants], { ...base, backgroundColor: fond, justifyContent: "flex-start", gap: "14px" }, undefined, { minWidth: "100%", flexBasis: "100%", minHeight: "0px", paddingLeft: "20px" });
    const cases = G.ligne(k, [
      caseLangue("EN", "Anglais", PAP, ENCRE2, BLEU, "#ffffff", "/faq"),
      caseLangue("ES", "Espagnol", BLEU, "#ffffff", ROUGE, "#ffffff", "/faq"),
      caseLangue("DE", "Allemand", PAP, ENCRE2, ROUGE, "#ffffff", "/faq"),
      caseLangue("IT", "Italien", ROUGE, "#ffffff", ENCRE2, "#ffffff", "/faq"),
      caseLangue("FR", "Français langue étrangère", BLEU, "#ffffff", PAP, ENCRE2, "/faq"),
      caseLangue("ZH", "Chinois", PAP, ENCRE2, ENCRE2, "#ffffff", "/blog"),
      caseInfo("Planning des cours", [horaires(k, { taille: 15, couleur: ENCRE2 })], "#ffffff", ROUGE, pt),
      caseInfo("Adresse", [coordonnees(k, { taille: 15, lien: ENCRE2, couleur: ENCRE2, survol: ROUGE, focus: ROUGE }), lien(k, "Demander un essai gratuit →", "/contact", { taille: 15, poids: "800", couleur: BLEU, soulign: true, survol: { color: ROUGE, transform: { x: 6 } }, focus: ROUGE })], "#ffffff", ROUGE),
    ], { gap: "0px", aligne: "stretch", largeur: "100%" });
    const haut = G.bande(k, [cases], { fond: PAP, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Damier" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d8dde8", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [mentions], { fond: ENCRE2, colonne: true, padV: ["24px", "22px", "18px"], padB: ["24px", "22px", "18px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-233 « Lecteur de cours » — cours de musique   [archétype K : fenêtre / console, le pied est un bloc d'interface]
// Idée : le pied est un LECTEUR AUDIO. Une fenêtre à contour laiton centrée : barre de titre avec trois carrés et « planning.cours », une playlist de cinq instruments (Piano, Guitare, Violon, Chant, Batterie) en lignes qui s'allument
// au survol, le planning (horaires) en pied de fenêtre et trois touches carrées (◀ Cours, ▶ Essai, Tarifs ▶) ; le voyant rouge de la barre de titre pulse. Instruments d'exemple. Mentions sous la fenêtre.
// Polices : Fraunces (titres) et Karla. Mobile : fenêtre pleine largeur, touches en pile.
const aubergine = identite({
  key: "c233", label: "Aubergine et laiton", humeur: "dark",
  fond: "#190f1f", texte: "#f6ecf5", discret: "#cdb9cc", accent: "#f4b942", surface: "#2a1a33", encre: "#190f1f", surEncre: "#f6ecf5",
  police: "font.karla", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "2px", ligne: "#f6ecf540",
});
const AUB = "#190f1f", AUB2 = "#2a1a33", AUB3 = "#3a2446", LAITON = "#f4b942", ROSE = "#f6ecf5";

const lecteurCours = modeleV2({
  id: identifiantV2(233, "lecteur-de-cours"), concept: "c-233-lecteur-de-cours",
  name: "Lecteur de cours", family: FAM,
  description: "Pour des cours de musique : le pied en fenêtre de lecteur audio à contour laiton, barre de titre à voyant qui pulse, playlist de cinq instruments qui s'allument au survol, planning en pied de fenêtre et trois touches carrées. Aubergine et laiton.",
  tags: ["cours de musique", "lecteur", "fenêtre", "playlist", "planning", "aubergine", "laiton", "angles droits"],
  identity: aubergine,
  racine: racineDe(AUB),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const voyant = souffle(carre(k, "#ff5a5f", "12px"), 2600);
    const barreTitre = k.row([voyant, carre(k, LAITON, "12px"), carre(k, ROSE, "12px"), k.T("<p>planning.cours</p>", { fontSize: "14px", fontFamily: S.font, letterSpacing: "0.08em", color: AUB, fontWeight: "700", lineHeight: 1 })], { flexWrap: "nowrap", gap: "10px", alignItems: "center", width: "100%", paddingTop: "12px", paddingBottom: "12px", paddingLeft: "16px", paddingRight: "16px", backgroundColor: LAITON, borderRadius: "0px" });
    const piste = (num, nom, url) => {
      const a = lien(k, nom, url, { taille: 26, poids: "500", police: S.head, couleur: ROSE, survol: { color: AUB }, focus: ROSE, h: "52px", extra: { flexGrow: 1 } });
      const r = k.row([caps(k, num, { couleur: LAITON, suivi: "0.12em", extra: { minWidth: "28px" } }), a, caps(k, "Écouter ▶", { couleur: LAITON })], { flexWrap: "nowrap", alignItems: "center", gap: "16px", width: "100%", paddingLeft: "20px", paddingRight: "20px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#f6ecf533", borderRadius: "0px", backgroundColor: AUB2, transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: LAITON, paddingLeft: "34px" } };
      return r;
    };
    const liste = k.col([piste("01", "Piano", "/faq"), piste("02", "Guitare", "/faq"), piste("03", "Violon", "/faq"), piste("04", "Chant", "/faq"), piste("05", "Batterie", "/faq")], { gap: "0px", width: "100%" });
    const touche = (t, u, plein) => lien(k, t, u, { taille: 15, poids: "800", casse: "uppercase", suivi: "0.08em", couleur: plein ? AUB : LAITON, h: "48px", padH: "20px", survol: plein ? { backgroundColor: ROSE, transform: { y: -2 } } : { backgroundColor: LAITON, color: AUB, transform: { y: -2 } }, focus: ROSE, extra: { backgroundColor: plein ? LAITON : undefined, borderStyle: "solid", borderWidth: "2px", borderColor: LAITON, justifyContent: "center", flexGrow: 1 } });
    const touches = k.row([touche("◀ Cours", "/faq", false), touche("▶ Essai gratuit", "/contact", true), touche("Tarifs ▶", "/contact", false)], { gap: "8px", width: "100%" });
    const piedFenetre = k.row([G.colonne(k, [caps(k, "Planning", { couleur: LAITON }), horaires(k, { taille: 15, couleur: ROSE })], { poids: 1, min: "240px", gap: "10px" }), G.colonne(k, [caps(k, "Adresse", { couleur: LAITON }), coordonnees(k, { taille: 15, lien: ROSE, survol: LAITON, focus: LAITON })], { poids: 1, min: "240px", gap: "10px" })], { rowGap: "24px", columnGap: "40px", alignItems: "flex-start", width: "100%", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "20px", paddingRight: "20px", backgroundColor: AUB2, borderRadius: "0px" });
    const corps = k.col([liste, piedFenetre, k.col([touches], { width: "100%", paddingTop: "16px", paddingBottom: "16px", paddingLeft: "16px", paddingRight: "16px", backgroundColor: AUB3, borderRadius: "0px" })], { gap: "0px", width: "100%" });
    const fenetre = k.col([barreTitre, corps], { gap: "0px", width: "100%", maxWidth: "820px", marginLeft: "auto", marginRight: "auto", borderStyle: "solid", borderWidth: "2px", borderColor: LAITON, borderRadius: "0px" });
    const haut = G.bande(k, [fenetre], { fond: AUB, colonne: true, padV: ["80px", "60px", "36px"], padB: ["36px", "28px", "24px"], padH: ["48px", "32px", "20px"], nom: "Fenêtre" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d9c7d8", liens: ROSE })(k, env);
    const bas = G.bande(k, [mentions], { fond: AUB, colonne: true, padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    bas.styles.desktop.color = ROSE;
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-234 « Commencez maintenant » — auto-formation en ligne   [archétype F : bandeau d'appel XXL en haut + liens en une colonne étroite à droite]
// Idée : un BANDEAU XXL « Apprenez à votre rythme. » en Inter Tight 800 avec un énorme bouton rose (le carré « respire »), et à droite UNE colonne étroite de liens séparés par des filets (Catalogue, Mon espace, Certificats, Aide,
// Contact) qui se décalent au survol. Sous le bandeau, la lettre sur une seule ligne et les mentions. Pas d'horaires ni d'adresse : tout se passe en ligne. Polices : Inter Tight et Space Mono (libellés).
// Mobile : bandeau puis colonne de liens pleine largeur.
const ardoise = identite({
  key: "c234", label: "Ardoise nuit et rose vif", humeur: "dark",
  fond: "#121a2b", texte: "#e5e9f2", discret: "#aab4c8", accent: "#fb7185", surface: "#1a2438", encre: "#121a2b", surEncre: "#e5e9f2",
  police: "font.space-mono", titres: "font.inter-tight",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "1px", ligne: "#e5e9f23d",
});
const ARD = "#121a2b", ARD2 = "#0b111e", ROSEV = "#fb7185", GLACE2 = "#e5e9f2";

const commencezMaintenant = modeleV2({
  id: identifiantV2(234, "commencez-maintenant"), concept: "c-234-commencez-maintenant",
  name: "Commencez maintenant", family: FAM,
  description: "Pour une auto-formation en ligne : un bandeau XXL « Apprenez à votre rythme » avec un énorme bouton rose, une colonne étroite de liens à droite (catalogue, mon espace, certificats, aide), la lettre en une ligne. Ardoise nuit et rose vif.",
  tags: ["formation en ligne", "e-learning", "bandeau d'appel", "colonne de liens", "ardoise", "rose", "mono", "angles droits"],
  identity: ardoise,
  racine: racineDe(ARD2),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Apprenez<br>à votre <span style="color:${ROSEV}">rythme.</span></p>`, { taille: [52, 132], tablette: { taille: [76, 112] }, mobile: { taille: [48, 68] }, lh: 0.95, suivi: "-0.035em", poids: "800", police: S.head, couleur: GLACE2 })(k, env);
    const gros = souffle(lien(k, "Commencer un cours", "/connexion", { taille: 20, poids: "700", couleur: ARD, h: "76px", padH: "40px", survol: { backgroundColor: GLACE2, transform: { x: 8 } }, focus: GLACE2, extra: { backgroundColor: ROSEV, justifyContent: "center", alignSelf: "flex-start", columnGap: "14px", fontFamily: S.font } }), 3600);
    const cta = G.colonne(k, [caps(k, "Auto-formation en ligne", { couleur: ROSEV, suivi: "0.24em" }), phrase, para(k, "Des cours disponibles à toute heure, un espace personnel, des attestations à la clé.", { taille: 16, couleur: "#c4cce0", max: "460px" }), gros], { poids: 8, min: "320px", gap: "26px" });
    const lienCol = (t, u) => {
      const a = lien(k, t, u, { taille: 17, poids: "700", couleur: GLACE2, bloc: true, h: "56px", survol: { color: ARD }, focus: ROSEV, extra: { width: "100%", paddingLeft: "0px", justifyContent: "space-between", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#e5e9f255" } });
      a.states = { ...(a.states || {}), hover: { color: ARD, backgroundColor: ROSEV, paddingLeft: "14px" } };
      return a;
    };
    const colonne = G.colonne(k, [caps(k, "Menu", { couleur: ROSEV }), k.col([lienCol("Catalogue", "/blog"), lienCol("Mon espace", "/connexion"), lienCol("Certificats", "/faq"), lienCol("Aide", "/faq"), lienCol("Contact", "/contact")], { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: GLACE2 })], { poids: 3, min: "240px", gap: "14px", soi: "stretch" });
    colonne.children[1].styles.desktop.width = "100%";
    const haut = G.bande(k, [cta, colonne], { fond: ARD, gap: "48px 72px", aligne: "flex-start", padV: ["96px", "72px", "48px"], padB: ["88px", "64px", "44px"], padH: ["48px", "32px", "20px"], nom: "Appel" });
    const abo = lettre(k, env, G, { titre: "Nouveaux cours", intro: "Un courriel quand un cours est publié.", bouton: "S'abonner", largeur: "460px", accent: ROSEV, surBouton: ARD, texte: GLACE2, couleurTitre: ROSEV, fond: ARD2, survolBouton: GLACE2, survolTexte: ARD, focus: ROSEV });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#b8c2d6", liens: GLACE2 })(k, env);
    const bas = G.bande(k, [abo, mentions], { fond: ARD2, gap: "24px 48px", aligne: "flex-end", padV: ["44px", "36px", "32px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], nom: "Lettre" });
    bas.styles.desktop.color = GLACE2;
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-235 « Barre de prépa » — préparation aux concours   [archétype D : ligne unique type barre de navigation inversée, compacte]
// Idée : tout tient sur DEUX LIGNES très compactes. Ligne 1 : le nom de la prépa en slab serif, quatre concours d'exemple en cases à cocher carrées (Administration, Écoles, Santé et social, Enseignement) qui se cochent
// au survol, et le bouton « Essai gratuit ». Ligne 2 : adresse en une ligne, liens et mentions. Gris acier, noir et orange brûlé. Pas de lettre, pas d'horaires. Polices : Zilla Slab et Source Sans 3.
// Mobile : les deux lignes se replient en pile.
const acier = identite({
  key: "c235", label: "Gris acier, noir et orange brûlé", humeur: "light",
  fond: "#d9dde3", texte: "#0d1b2a", discret: "#3a4757", accent: "#a63a00", surface: "#ffffff", encre: "#0d1b2a",
  police: "font.source-sans-3", titres: "font.zilla-slab",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "2px", ligne: "#0d1b2a44",
});
const ACIER = "#d9dde3", NOIR3 = "#0d1b2a", ORANGE = "#a63a00", ORANGEV = "#ff6a1a";

const barrePrepa = modeleV2({
  id: identifiantV2(235, "barre-de-prepa"), concept: "c-235-barre-de-prepa",
  name: "Barre de prépa", family: FAM,
  description: "Pour une préparation aux concours : un pied compact en deux lignes, le nom en slab serif, quatre concours en cases à cocher carrées qui se cochent au survol, un bouton d'essai gratuit, puis adresse, liens et mentions. Gris acier et orange.",
  tags: ["préparation aux concours", "prépa", "barre compacte", "cases à cocher", "gris acier", "orange", "slab", "angles droits"],
  identity: acier,
  racine: racineDe(NOIR3),
  widgets: ["sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 28, NOIR3, { fontWeight: "700" });
    const coche = (t, u) => {
      const boite = k.col([k.T("<p>✓</p>", { fontSize: "14px", fontWeight: "800", color: NOIR3, lineHeight: 1, textAlign: "center" }, undefined, undefined)], { width: "22px", height: "22px", alignItems: "center", justifyContent: "center", borderStyle: "solid", borderWidth: "2px", borderColor: NOIR3, backgroundColor: "#ffffff", borderRadius: "0px", flexShrink: 0, transitionDuration: DOUX });
      boite.states = { hover: { backgroundColor: ORANGEV, borderColor: ORANGEV } };
      const a = lien(k, t, u, { taille: 16, poids: "700", couleur: NOIR3, survol: { color: ORANGE }, focus: ORANGE });
      const c = k.row([boite, a], { flexWrap: "nowrap", alignItems: "center", gap: "10px" });
      return c;
    };
    const concours = k.row([coche("Administration", "/faq"), coche("Écoles", "/faq"), coche("Santé et social", "/faq"), coche("Enseignement", "/faq")], { rowGap: "6px", columnGap: "26px", alignItems: "center" });
    const btn = souffle(lien(k, "Essai gratuit", "/contact", { taille: 16, poids: "800", casse: "uppercase", suivi: "0.08em", couleur: "#ffffff", h: "48px", padH: "24px", survol: { backgroundColor: ORANGE, transform: { y: -2 } }, focus: ORANGE, extra: { backgroundColor: NOIR3, justifyContent: "center", columnGap: "10px" } }), 3800);
    const ligne1 = G.bande(k, [nom, concours, btn], { fond: ACIER, gap: "16px 40px", aligne: "center", padV: ["28px", "24px", "24px"], padB: ["28px", "24px", "24px"], padH: ["48px", "32px", "20px"], nom: "Barre" });
    const adresse = coordonnees(k, { taille: 14, lien: "#ffffff", survol: ORANGEV, focus: ORANGEV, couleur: "#e8ecf2" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c8d0dc", liens: "#ffffff" })(k, env);
    const ligne2 = G.bande(k, [G.colonne(k, [adresse], { poids: 1, min: "260px" }), G.colonne(k, [mentions], { poids: 2, min: "300px", soi: "flex-end" })], { fond: NOIR3, gap: "16px 40px", aligne: "flex-end", padV: ["22px", "20px", "20px"], padB: ["22px", "20px", "20px"], padH: ["48px", "32px", "20px"], filetHaut: { epaisseur: "4px", couleur: ORANGEV }, nom: "Adresse" });
    ligne2.styles.desktop.color = "#ffffff";
    return [G.racine(k, [ligne1, ligne2])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Cours et soutien scolaire", target: 5, built: true,
  description: "Pieds de cours standard et très professionnels, à angles droits : sommaire de cahier, damier de langues, lecteur de cours, bandeau d'auto-formation, barre de prépa.",
  models: [cahierDeTextes, damierLangues, lecteurCours, commencezMaintenant, barrePrepa],
};
