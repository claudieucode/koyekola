// Famille v2 « Artisans et bâtiment » — 5 modèles (ft2-101… à ft2-105…), extension « sites du quotidien » : plombier-chauffagiste, électricien, menuisier-ébéniste, paysagiste-jardinier, peintre-décorateur.
// Pieds de sites STANDARD : appel et devis en évidence, zone d'intervention, horaires (Données de l'entreprise : rien d'inventé), liens rapides, mentions légales, réseaux.
// Marques fictives : aucune coordonnée, aucun chiffre ; les adresses de réseaux sont des exemples (accueil du réseau) à remplacer dans l'éditeur ; les noms de couleurs du nuancier (c-105) sont décoratifs.
// MOUVEMENTS (tous coupés sous « mouvement réduit » par la plateforme : transitions de survol coupées par la frontière de pied, animations du nœud `motion` coupées par landing.css) :
//   · transitions de survol / focus (transform, couleur, fond) ; · `motion` du Page Builder : « pulse » infini (bouton d'appel c-101, point d'état c-102, soleil c-104), « swing » (enseigne c-103), « slide-up » d'entrée échelonnée (c-103) ;
//   · `motion.hover` du Page Builder (lift / float) sur les cartes ; · widget « Défilement continu » (marquee, ruban lent de c-105, pause au survol, immobile en mouvement réduit).
// Limite du moteur contournée : pas de soulignement qui se dessine (background-size limité à cover/contain/auto) ; on utilise le glissement de 4 à 10 px + changement de couleur à la place.
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "artisans-batiment";

// ── Aides LOCALES ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
// Lien de texte fini par le moteur (états, 44 px mobile) puis états propres
function lien(k, label, url, o = {}) {
  const S = k.S;
  const n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, transitionDuration: GK.MOUVEMENT, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, transform: { x: 4 } }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
// Arrondis par coin (la grammaire refuse « 220px 220px 18px 18px ») : haut / bas
const coins = (h, b) => ({ borderTopLeftRadius: h, borderTopRightRadius: h, borderBottomLeftRadius: b, borderBottomRightRadius: b });
// Aplat de couleur (point, soleil, échantillon) : un séparateur épais (un texte vide ne se dessine pas)
const aplat = (k, couleur, { l, h, rayon, tablette, mobile }) => {
  const n = k.divider({ width: l, borderColor: couleur, borderTopWidth: h, borderStyle: "solid", borderRightWidth: "0px", borderBottomWidth: "0px", borderLeftWidth: "0px", marginTop: "0px", marginBottom: "0px", ...(rayon ? { borderRadius: rayon } : {}), flexShrink: 0 });
  if (tablette) n.styles.tablet = tablette;
  if (mobile) n.styles.mobile = mobile;
  return n;
};
// Pose le mouvement du Page Builder sur un nœud (animation d'entrée ou d'attention, survol) ; la plateforme le coupe sous « mouvement réduit »
const anime = (n, motion) => { n.motion = motion; return n; };
const reseauxEx = [["Facebook", "https://www.facebook.com/"], ["Instagram", "https://www.instagram.com/"], ["LinkedIn", "https://www.linkedin.com/"]];
// Bloc « Zone d'intervention » : texte générique (la vraie zone se précise dans l'éditeur)
const zone = (k, o = {}) => k.T(`<p>${o.texte}</p>`, { fontSize: "15px", lineHeight: 1.6, color: o.couleur || k.S.mute, fontFamily: k.S.font, maxWidth: "340px" });
// Numéro et horaires : widgets « Données de l'entreprise » (rien d'inventé ; vides tant que non renseignés)
const telephone = (k, env, o = {}) => { const n = Moteur.item(k, "phone", env); n.styles.desktop = { ...n.styles.desktop, fontSize: o.taille || "26px", fontWeight: "700", fontFamily: o.police || k.S.head, color: o.couleur || k.S.fg }; n.styles.mobile = { fontSize: "22px" }; return n; };
const horaires = (k, env, titre, couleur) => { const n = Moteur.item(k, `hours|${titre}`, env); n.styles.desktop = { ...n.styles.desktop, color: couleur || k.S.mute, fontSize: "14px" }; return n; };

// ── ft2-101 « Goutte et flamme » : plombier-chauffagiste ──────────────────────────────────────────────────────────────────────────────────────
// Idée : un pied de DÉPANNAGE. Bleu marine profond (l'eau), turquoise (l'eau claire) et orange vif (la flamme) pour le seul bouton. Une phrase condensée en capitales « Une fuite ? Un radiateur qui reste froid ? »,
// un bouton orange qui PULSE doucement (1,05 en 2,8 s, une seule chose qui bouge en permanence), le numéro (Données de l'entreprise) ; à droite une carte « Zone et horaires ». En dessous : liens rapides en trois colonnes, réseaux.
// Polices : Barlow Condensed (titres, capitales) et Barlow (texte). Mobile : phrase puis bouton pleine largeur, carte dessous, liens en liste de 44 px.
const eau = identite({
  key: "c101", label: "Marine, turquoise et flamme", humeur: "dark",
  fond: "#0a2540", texte: "#ffffff", discret: "#b9cde3", accent: "#2ad0e0", surface: "#10325a",
  police: "font.barlow", titres: "font.barlow-condensed",
  rayon: "14px", rayonBouton: "10px", ombre: "none", poids: "700", bordure: "1px", ligne: "#2c4d75",
});
const goutteFlamme = modeleV2({
  id: identifiantV2(101, "goutte-et-flamme"), concept: "c-101-goutte-et-flamme",
  name: "Goutte et flamme", family: FAM,
  description: "Pour un plombier-chauffagiste : phrase de dépannage en grandes capitales sur bleu marine, bouton orange qui pulse doucement, numéro et horaires de l'entreprise, carte zone d'intervention, liens rapides et réseaux.",
  tags: ["plombier", "chauffagiste", "dépannage", "bleu marine", "orange", "bouton qui pulse", "artisan"],
  identity: eau,
  racine: racineDe("#0a2540"),
  widgets: ["text", "link", "button", "bizphone", "bizhours", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, FLAMME = "#ff7a1a", FOND = "#0a2540";
    // 1 · la phrase, en capitales condensées ; la seconde ligne en turquoise
    const phrase = G.geant(`<p>Une fuite&nbsp;?<br>Un radiateur<br><span style="color:${S.accent}">qui reste froid&nbsp;?</span></p>`, { taille: [52, 128], tablette: { taille: [80, 108] }, mobile: { taille: [52, 96] }, lh: 0.92, suivi: "-0.01em", poids: "800", police: S.head, couleur: S.fg, casse: "uppercase" })(k, env);
    const etiquette = caps(k, "Plomberie et chauffage", { couleur: S.accent });
    // 2 · le bouton d'appel : orange, il PULSE (attention, infini, 2,8 s) ; texte noir sur orange (AA)
    const bouton = GK.fini(k, k.B("Demander un dépannage", "/contact", "solid", { backgroundColor: FLAMME, color: "#1a0d00", fontFamily: S.head, fontSize: "22px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em", minHeight: "60px", display: "inline-flex", alignItems: "center", paddingLeft: "32px", paddingRight: "32px", borderRadius: "10px", borderStyle: "solid", borderWidth: "0px", transitionDuration: GK.MOUVEMENT }), { hover: { backgroundColor: "#ffffff", color: FOND }, focus: GK.focus("#ffffff") });
    anime(bouton, { entrance: "pulse", duration: 2800, iterations: "infinite", easing: "ease-in-out", trigger: "load" });
    bouton.styles.mobile = { ...(bouton.styles.mobile || {}), width: "100%", justifyContent: "center", fontSize: "20px" };
    const appel = k.col([caps(k, "Ou appelez-nous", { couleur: S.mute }), telephone(k, env, { taille: "30px" })], { gap: "4px", alignItems: "flex-start" });
    const actions = G.ligne(k, [bouton, appel], { gap: "20px 36px", aligne: "center", largeur: "100%" });
    const gauche = G.colonne(k, [etiquette, phrase, actions], { poids: 7, min: "320px", gap: "26px" });
    // 3 · la carte « zone et horaires » : fond surface, filet turquoise en haut ; elle se soulève au survol
    const carte = k.card([caps(k, "Zone d'intervention", { couleur: S.accent }), zone(k, { texte: "Nous intervenons dans votre commune et les villes voisines. Précisez votre secteur dans l'éditeur.", couleur: S.fg }), trait(k, S.line), horaires(k, env, "Horaires", S.fg), k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: false, showEmail: true, showIcons: true, layout: "stack" }, { color: S.fg, fontSize: "14px" })],
      { backgroundColor: S.alt, borderRadius: "14px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", gap: "16px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "4px", borderColor: S.accent, width: "100%", maxWidth: "440px", boxSizing: "border-box" }, undefined, { paddingLeft: "20px", paddingRight: "20px", maxWidth: "100%" });
    anime(carte, { hover: "lift" });
    const droite = G.colonne(k, [carte], { poids: 5, min: "300px", aligne: "flex-end", soi: "flex-end", tablette: { alignItems: "flex-start" } });
    const haut = G.ligne(k, [gauche, droite], { gap: "40px 64px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    // 4 · liens rapides en trois colonnes + réseaux
    const col = (titre, liens) => G.colonne(k, [caps(k, titre, { couleur: S.accent }), ...liens.map(([l, u]) => lien(k, l, u, { taille: 16, h: "44px" }))], { poids: 1, min: "200px", gap: "0px" });
    const liens = G.ligne(k, [
      col("Nos prestations", [["Toutes les prestations", "/catalogue"], ["Demander un devis", "/contact"]]),
      col("Bon à savoir", [["Questions fréquentes", "/faq"], ["Conseils d'entretien", "/blog"]]),
      col("Mon espace", [["Connexion", "/connexion"], ["Inscription", "/inscription"]]),
      G.colonne(k, [caps(k, "Nous suivre", { couleur: S.accent }), G.reseauxTexte(reseauxEx, { taille: 16, couleur: S.fg, survol: S.accent })(k, env)], { poids: 1, min: "200px", gap: "0px" }),
    ], { gap: "24px 40px", aligne: "flex-start", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [haut, trait(k, S.line), liens, mentions], { colonne: true, gap: "48px", max: "1240px", padV: ["96px", "72px", "56px"], padB: ["40px", "36px", "32px"], padH: ["48px", "32px", "20px"], fond: FOND, innerMobile: { rowGap: "32px" }, degrade: { from: "#10325a", to: FOND, angle: 180 }, nom: "Dépannage" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── ft2-102 « Tableau électrique » : électricien ──────────────────────────────────────────────────────────────────────────────────────────────
// Idée : le pied ressemble à un tableau. Bande JAUNE pleine largeur (panne de courant ? contactez-nous, bouton noir, numéro) puis quatre « disjoncteurs » : grandes cases à filet jaune en haut qui s'ALLUMENT (fond jaune, texte noir) et se soulèvent de 4 px au survol et au clavier.
// Un point vert PULSE à côté de « Réponse sur demande » (indicateur d'état, mouvement lent) : un seul mouvement continu. Anthracite #111214, jaune #ffd60a, vert #3ddc84 (point seulement).
// Polices : Space Grotesk (titres) et JetBrains Mono (texte, libellés). Pas de promesse de délai ni de 24 h/24 : le texte reste général.
const tableau = identite({
  key: "c102", label: "Anthracite et jaune électrique", humeur: "dark",
  fond: "#111214", texte: "#f5f5f0", discret: "#b0b3b8", accent: "#ffd60a", surface: "#1b1d20",
  police: "font.jetbrains-mono", titres: "font.space-grotesk",
  rayon: "4px", rayonBouton: "4px", ombre: "none", poids: "700", bordure: "1px", ligne: "#3a3d42",
});
const tableauElectrique = modeleV2({
  id: identifiantV2(102, "tableau-electrique"), concept: "c-102-tableau-electrique",
  name: "Tableau électrique", family: FAM,
  description: "Pour un électricien : bande jaune « panne de courant ? » avec bouton et numéro, puis quatre cases façon disjoncteurs qui s'allument au survol, horaires, zone d'intervention et point d'état qui pulse doucement.",
  tags: ["électricien", "jaune", "noir", "disjoncteurs", "mono", "urgence", "artisan"],
  identity: tableau,
  racine: racineDe("#111214"),
  widgets: ["text", "link", "button", "bizphone", "bizhours", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, NOIR = "#111214", JAUNE = "#ffd60a";
    // 1 · la bande jaune : phrase noire à gauche, bouton noir + numéro à droite
    const phrase = G.geant(`<p>Panne de courant&nbsp;?<br>Prise qui chauffe&nbsp;?</p>`, { taille: [36, 92], tablette: { taille: [56, 76] }, mobile: { taille: [36, 64] }, lh: 1, suivi: "-0.035em", poids: "700", police: S.head, couleur: NOIR })(k, env);
    const sous = k.T("<p>Contactez-nous : nous vous répondons et vous orientons vers la bonne intervention.</p>", { fontSize: "15px", lineHeight: 1.6, color: "#2b2b2b", fontFamily: S.font, maxWidth: "480px" });
    const bouton = GK.fini(k, k.B("Demander un devis", "/contact", "solid", { backgroundColor: NOIR, color: JAUNE, fontFamily: S.head, fontSize: "19px", fontWeight: "700", minHeight: "58px", display: "inline-flex", alignItems: "center", paddingLeft: "30px", paddingRight: "30px", borderRadius: "4px", borderStyle: "solid", borderWidth: "2px", borderColor: NOIR, transitionDuration: GK.MOUVEMENT }), { hover: { backgroundColor: JAUNE, color: NOIR, transform: { y: -3 } }, focus: { outlineStyle: "solid", outlineWidth: "3px", outlineColor: NOIR, outlineOffset: "4px" } });
    bouton.styles.mobile = { ...(bouton.styles.mobile || {}), width: "100%", justifyContent: "center" };
    const tel = telephone(k, env, { taille: "28px", couleur: NOIR });
    const gaucheJ = G.colonne(k, [phrase, sous], { poids: 7, min: "300px", gap: "14px" });
    const droiteJ = G.colonne(k, [bouton, tel], { poids: 4, min: "260px", gap: "14px", soi: "center", aligne: "flex-start" });
    const hautJ = G.ligne(k, [gaucheJ, droiteJ], { gap: "28px 56px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const bandeJaune = G.bande(k, [hautJ], { colonne: true, gap: "0px", max: "1240px", padV: ["64px", "52px", "40px"], padB: ["64px", "52px", "40px"], padH: ["48px", "32px", "20px"], fond: JAUNE, nom: "Panne" });
    // 2 · les disjoncteurs : quatre cases, filet jaune en haut ; au survol / focus : fond jaune, texte noir, soulèvement
    const sur = { backgroundColor: JAUNE, color: NOIR, transform: { y: -4 } };
    const disj = (num, t, u) => {
      const n = lien(k, t, u, { taille: 20, poids: "700", police: S.head, h: "112px", padH: "20px", lh: 1.15, survol: sur, focus: "#ffffff", extra: { display: "flex", width: "100%", alignItems: "flex-end", boxSizing: "border-box", backgroundColor: S.alt, borderStyle: "solid", borderWidth: "1px", borderTopWidth: "0px", borderColor: S.line, borderRadius: "0px", paddingTop: "16px", paddingBottom: "16px" } });
      n.states.focus = { ...sur, outlineStyle: "solid", outlineWidth: "2px", outlineColor: "#ffffff", outlineOffset: "3px" };
      return G.colonne(k, [caps(k, `0${num}`, { couleur: JAUNE, extra: { letterSpacing: "0.2em" } }), trait(k, JAUNE, "4px"), n], { poids: 1, min: "220px", gap: "0px", aligne: "stretch", extra: { rowGap: "0px" } });
    };
    const rangee = G.ligne(k, [disj(1, "Toutes les prestations", "/catalogue"), disj(2, "Questions fréquentes", "/faq"), disj(3, "Conseils de sécurité", "/blog"), disj(4, "Mon espace client", "/connexion")], { gap: "24px 20px", aligne: "stretch", largeur: "100%" });
    // 3 · état + zone + horaires ; point vert qui pulse
    const point = anime(aplat(k, "#3ddc84", { l: "12px", h: "12px", rayon: "50%" }), { entrance: "pulse", duration: 2400, iterations: "infinite", easing: "ease-in-out", trigger: "load" });
    const etat = k.row([point, caps(k, "Réponse sur demande", { couleur: S.fg, extra: { letterSpacing: "0.1em" } })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const info = G.ligne(k, [
      G.colonne(k, [etat, zone(k, { texte: "Zone d'intervention : votre commune et les communes voisines (à préciser dans l'éditeur)." })], { poids: 1, min: "260px", gap: "14px" }),
      G.colonne(k, [horaires(k, env, "Horaires")], { poids: 1, min: "240px" }),
      G.colonne(k, [caps(k, "Nous suivre"), G.reseauxTexte(reseauxEx, { taille: 15, couleur: S.fg, survol: S.accent })(k, env)], { poids: 1, min: "220px", gap: "0px" }),
    ], { gap: "28px 40px", aligne: "flex-start", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bandeNoire = G.bande(k, [rangee, trait(k, S.line), info, mentions], { colonne: true, gap: "40px", max: "1240px", padV: ["64px", "52px", "40px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], fond: NOIR, innerMobile: { rowGap: "28px" }, nom: "Tableau" });
    return [G.racine(k, [bandeJaune, bandeNoire])];
  },
}, FAM);

// ── ft2-103 « Atelier du bois » : menuisier-ébéniste ──────────────────────────────────────────────────────────────────────────────────────────
// Idée : un pied d'atelier. Papier crème et brun noyer. À gauche, un grand panneau noyer (carte) : « Un meuble, un escalier, une cuisine : à votre mesure. », bouton laiton « Parler de votre projet », horaires.
// À droite, des TIROIRS : cinq lignes à filet fin, grand texte serif ; au survol / clavier la ligne glisse de 10 px et passe au brun. Une petite enseigne « Sur rendez-vous » BALANCE une fois en arrivant à l'écran (swing), les lignes arrivent en glissement doux vers le haut, échelonné (80 ms).
// Polices : Fraunces (titres) et Karla (texte). Palette : crème #f4ecdc, noyer #3a2314, brun #8a4b14 (texte sur crème : AA), laiton #d9a441 (bouton sur noyer).
const noyer = identite({
  key: "c103", label: "Crème et noyer", humeur: "light",
  fond: "#f4ecdc", texte: "#2b1a0e", discret: "#5e4630", accent: "#8a4b14", surface: "#e8dcc3",
  police: "font.karla", titres: "font.fraunces",
  rayon: "6px", rayonBouton: "6px", ombre: "none", poids: "600", bordure: "1px", ligne: "#cdbb97",
});
const atelierBois = modeleV2({
  id: identifiantV2(103, "atelier-du-bois"), concept: "c-103-atelier-du-bois",
  name: "Atelier du bois", family: FAM,
  description: "Pour un menuisier-ébéniste : crème et brun noyer, panneau de contact avec bouton laiton, tiroirs de liens qui glissent au survol, petite enseigne qui se balance, horaires et réseaux. Chaleureux, sans fioriture.",
  tags: ["menuisier", "ébéniste", "bois", "crème", "serif", "tiroirs", "atelier", "artisan"],
  identity: noyer,
  racine: racineDe("#f4ecdc"),
  widgets: ["text", "link", "button", "bizphone", "bizhours", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, NOYER = "#3a2314", CREME = "#f4ecdc", LAITON = "#d9a441";
    // 1 · l'enseigne qui se balance (une fois, à l'arrivée à l'écran)
    const enseigne = anime(k.T("<p>Sur rendez-vous</p>", { fontFamily: S.font, fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.14em", color: NOYER, backgroundColor: LAITON, borderRadius: "4px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "14px", paddingRight: "14px", alignSelf: "flex-start" }), { entrance: "swing", duration: 1800, iterations: 1, trigger: "viewport" });
    // 2 · le panneau noyer
    const titre = G.geant(`<p>Un meuble, un escalier, une cuisine&nbsp;: <span style="color:${LAITON}">à votre mesure.</span></p>`, { taille: [32, 52], tablette: { taille: [36, 46] }, mobile: { taille: [30, 40] }, lh: 1.08, suivi: "-0.02em", poids: "600", police: S.head, couleur: CREME })(k, env);
    const bouton = GK.fini(k, k.B("Parler de votre projet", "/contact", "solid", { backgroundColor: LAITON, color: NOYER, fontFamily: S.font, fontSize: "17px", fontWeight: "800", minHeight: "54px", display: "inline-flex", alignItems: "center", paddingLeft: "26px", paddingRight: "26px", borderRadius: "6px", borderStyle: "solid", borderWidth: "0px", transitionDuration: GK.MOUVEMENT }), { hover: { backgroundColor: CREME, color: NOYER, transform: { y: -2 } }, focus: GK.focus(CREME) });
    bouton.styles.mobile = { ...(bouton.styles.mobile || {}), width: "100%", justifyContent: "center" };
    const tel = telephone(k, env, { taille: "24px", couleur: CREME });
    const hor = horaires(k, env, "Horaires de l'atelier", "#e8dcc3");
    const panneau = k.card([enseigne, titre, bouton, tel, trait(k, "#6b4a30"), hor],
      { backgroundColor: NOYER, borderRadius: "10px", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "40px", paddingRight: "40px", gap: "22px", boxSizing: "border-box", width: "100%" }, { paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "28px", paddingBottom: "28px", paddingLeft: "22px", paddingRight: "22px" });
    const gauche = G.colonne(k, [panneau], { poids: 5, min: "320px", aligne: "stretch" });
    // 3 · les tiroirs : filet fin, texte serif 26 px, glissement + brun au survol ; entrée échelonnée
    const tiroir = (t, u, i) => {
      const l = lien(k, t, u, { taille: 26, poids: "500", police: S.head, h: "64px", lh: 1.1, survol: { color: S.accent, transform: { x: 10 } }, focus: S.accent, extra: { display: "flex", width: "100%" } });
      const ligne = k.col([l], { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: S.line, alignItems: "stretch" });
      return anime(ligne, { entrance: "slide-up", duration: 600, delay: 80 * i, trigger: "viewport" });
    };
    const tiroirs = k.col([caps(k, "Parcourir l'atelier", { couleur: S.accent }), tiroir("Nos réalisations", "/catalogue", 0), tiroir("Demander un devis", "/contact", 1), tiroir("Questions fréquentes", "/faq", 2), tiroir("Conseils et entretien du bois", "/blog", 3), tiroir("Mon espace", "/connexion", 4)], { gap: "10px", width: "100%" });
    const bas = k.col([caps(k, "Zone d'intervention", { couleur: S.accent }), zone(k, { texte: "Atelier et pose dans la région : précisez votre zone d'intervention dans l'éditeur.", couleur: S.fg }), G.reseauxTexte(reseauxEx, { taille: 16, couleur: S.fg, survol: S.accent })(k, env)], { gap: "8px", width: "100%", paddingTop: "28px" });
    const droite = G.colonne(k, [tiroirs, bas], { poids: 6, min: "320px", aligne: "stretch", gap: "0px", justifie: "space-between" });
    const haut = G.ligne(k, [gauche, droite], { gap: "40px 72px", aligne: "stretch", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [haut, trait(k, S.line), mentions], { colonne: true, gap: "40px", max: "1240px", padV: ["88px", "64px", "48px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], fond: CREME, innerMobile: { rowGap: "28px" }, nom: "Atelier" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── ft2-104 « Portes du jardin » : paysagiste-jardinier ───────────────────────────────────────────────────────────────────────────────────────
// Idée : trois ARCHES (fenêtres de jardin) alignées en bas comme un horizon : une arche vert forêt avec l'appel (« Un jardin à imaginer ? »), une arche vert tendre avec les liens, une arche jaune paille avec horaires et zone.
// Un petit soleil jaune dans la première arche RESPIRE (pulse lent, 5 s), les arches se soulèvent de 6 px au survol. Fond sauge très clair. Rayon haut de 220 px : l'arche est un rectangle aux deux coins hauts arrondis.
// Polices : Young Serif (titres) et Nunito Sans (texte). Couleurs : forêt #17381f, vert tendre #cfe3b8, paille #f4d35e, sauge #eef4e3. Mobile : les arches s'empilent, rayon réduit.
const jardin = identite({
  key: "c104", label: "Sauge, forêt et paille", humeur: "light",
  fond: "#eef4e3", texte: "#17381f", discret: "#3f5a45", accent: "#2d6a3a", surface: "#cfe3b8",
  police: "font.nunito-sans", titres: "font.young-serif",
  rayon: "20px", rayonBouton: "999px", ombre: "none", poids: "600", bordure: "1px", ligne: "#b7ce9b",
});
const portesJardin = modeleV2({
  id: identifiantV2(104, "portes-du-jardin"), concept: "c-104-portes-du-jardin",
  name: "Portes du jardin", family: FAM,
  description: "Pour un paysagiste-jardinier : trois arches vertes alignées comme un horizon (appel, liens rapides, horaires et zone), petit soleil qui respire, arches qui se soulèvent au survol. Doux, naturel, très lisible.",
  tags: ["paysagiste", "jardinier", "vert", "arches", "soleil", "nature", "serif", "artisan"],
  identity: jardin,
  racine: racineDe("#eef4e3"),
  widgets: ["text", "link", "button", "bizphone", "bizhours", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, FORET = "#17381f", TENDRE = "#cfe3b8", PAILLE = "#f4d35e", CREME = "#f7f3e3";
    const arche = (enfants, fond, haut, o = {}) => anime(k.card(enfants, { backgroundColor: fond, ...coins("220px", "18px"), paddingTop: haut, paddingBottom: "36px", paddingLeft: "36px", paddingRight: "36px", gap: "16px", alignItems: "flex-start", boxSizing: "border-box", width: "100%", ...(o.extra || {}) }, { ...coins("160px", "18px"), paddingLeft: "32px", paddingRight: "32px" }, { ...coins("110px", "16px"), paddingTop: "96px", paddingLeft: "24px", paddingRight: "24px", paddingBottom: "28px" }), { hover: "float" });
    // 1 · arche forêt : soleil, phrase, bouton, numéro
    const soleil = anime(aplat(k, PAILLE, { l: "56px", h: "56px", rayon: "50%" }), { entrance: "pulse", duration: 5000, iterations: "infinite", easing: "ease-in-out", trigger: "load" });
    const phrase = G.geant(`<p>Un jardin<br>à imaginer&nbsp;?</p>`, { taille: [30, 42], tablette: { taille: [30, 40] }, mobile: { taille: [30, 40] }, lh: 1.08, suivi: "-0.015em", poids: "400", police: S.head, couleur: CREME, align: "center" })(k, env);
    const texte = k.T("<p>Parlez-nous de votre terrain : nous venons le voir et vous proposons un devis.</p>", { fontSize: "15px", lineHeight: 1.6, color: "#dcebd0", fontFamily: S.font, textAlign: "center" });
    const bouton = GK.fini(k, k.B("Demander un devis", "/contact", "solid", { backgroundColor: PAILLE, color: FORET, fontFamily: S.font, fontSize: "16px", fontWeight: "800", minHeight: "52px", display: "inline-flex", alignItems: "center", paddingLeft: "28px", paddingRight: "28px", borderRadius: "999px", borderStyle: "solid", borderWidth: "0px", alignSelf: "center", transitionDuration: GK.MOUVEMENT }), { hover: { backgroundColor: CREME, color: FORET, transform: { y: -2 } }, focus: GK.focus(CREME) });
    const tel = telephone(k, env, { taille: "22px", couleur: CREME, police: S.font });
    tel.styles.desktop = { ...tel.styles.desktop, alignSelf: "center", textAlign: "center" };
    const a1 = arche([soleil, phrase, texte, bouton, tel], FORET, "40px", { extra: { alignItems: "center" } });
    const c1 = G.colonne(k, [a1], { poids: 4, min: "290px", aligne: "stretch", soi: "flex-end" });
    // 2 · arche vert tendre : liens rapides
    const lj = (t, u) => lien(k, t, u, { taille: 17, poids: "700", couleur: FORET, h: "44px", survol: { color: "#1c5a2b", transform: { x: 6 } }, focus: FORET });
    const a2 = arche([caps(k, "Liens rapides", { couleur: "#2c4a32" }), lj("Nos réalisations", "/catalogue"), lj("Demander un devis", "/contact"), lj("Questions fréquentes", "/faq"), lj("Conseils de saison", "/blog"), lj("Mon espace", "/connexion")], TENDRE, "88px");
    const c2 = G.colonne(k, [a2], { poids: 4, min: "290px", aligne: "stretch", soi: "flex-end" });
    // 3 · arche paille : zone, horaires, réseaux
    const a3 = arche([caps(k, "Zone d'intervention", { couleur: "#4a3d08" }), zone(k, { texte: "Création et entretien de jardins dans votre commune et alentour (à préciser dans l'éditeur).", couleur: FORET }), trait(k, "#c9a93a"), horaires(k, env, "Horaires", FORET), G.reseauxTexte(reseauxEx, { taille: 15, couleur: FORET, survol: "#1c5a2b" })(k, env)], PAILLE, "64px");
    const c3 = G.colonne(k, [a3], { poids: 4, min: "290px", aligne: "stretch", soi: "flex-end" });
    const arches = G.ligne(k, [c1, c2, c3], { gap: "24px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [arches, mentions], { colonne: true, gap: "40px", max: "1240px", padV: ["88px", "64px", "48px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Arches" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── ft2-105 « Nuancier » : peintre-décorateur ─────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : un NUANCIER de peintre. En haut, un ruban géant de mots (Peinture · Enduits · Papier peint · Décoration) qui défile TRÈS lentement (widget Défilement continu : pause au survol, immobile en mouvement réduit) ;
// dessous, quatre échantillons de couleur (grande pastille de peinture + nom + lien) qui se soulèvent au survol ; à droite de la ligne d'appel, un bouton terracotta « Demander un devis ». Blanc cassé, encre, terracotta.
// Polices : Archivo (titres : testée propre en grand corps ; Bricolage Grotesque écartée car déclarée aussi par le thème par défaut du site de test, ce qui fait échouer le contrôle « police chargée ») et DM Sans (texte). Les noms de couleurs (Terre cuite, Sauge…) sont décoratifs ; les couleurs des échantillons n'ont pas de rôle de texte (aucun texte dessus).
const nuancierId = identite({
  key: "c105", label: "Blanc cassé, encre et terracotta", humeur: "light",
  fond: "#fbf8f3", texte: "#1d1b19", discret: "#57524b", accent: "#b9381f", surface: "#f1ebe1",
  police: "font.dm-sans", titres: "font.archivo",
  rayon: "12px", rayonBouton: "999px", ombre: "none", poids: "700", bordure: "1px", ligne: "#ddd4c5",
});
const nuancier = modeleV2({
  id: identifiantV2(105, "nuancier"), concept: "c-105-nuancier",
  name: "Nuancier", family: FAM,
  description: "Pour un peintre-décorateur : ruban géant de mots qui défile lentement, quatre échantillons de couleur qui se soulèvent au survol pour les liens rapides, bouton de devis terracotta, horaires et réseaux. Frais et lumineux.",
  tags: ["peintre", "décorateur", "nuancier", "couleurs", "ruban lent", "blanc cassé", "terracotta", "artisan"],
  identity: nuancierId,
  racine: racineDe("#fbf8f3"),
  widgets: ["marquee", "text", "link", "button", "bizphone", "bizhours", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, ENCRE = "#1d1b19";
    // 1 · le ruban géant (widget Défilement continu, vitesse lente, pause au survol) sur une bande d'encre (texte clair : le libellé « Pause » du widget reste lisible)
    const MOTS = ["Peinture", "Enduits", "Papier peint", "Décoration", "Rénovation"];
    const ruban = k.W("marquee", { items: MOTS.map((text) => ({ text })), speed: "slow", direction: "left", separator: "/", pauseHover: true, label: "Nos savoir-faire : peinture, enduits, papier peint, décoration, rénovation" }, { color: "#fbf8f3", fontFamily: S.head, fontSize: "fluid:40-96", fontWeight: "800", letterSpacing: "-0.02em", textTransform: "uppercase", width: "100%" });
    const bandeRuban = G.bande(k, [ruban], { colonne: true, gap: "0px", max: "100%", padV: ["28px", "24px", "18px"], padB: ["28px", "24px", "18px"], padH: ["0px", "0px", "0px"], fond: ENCRE, nom: "Ruban" });
    Object.assign(bandeRuban.styles.desktop, { borderStyle: "solid", borderWidth: "0px", overflow: "hidden" });
    // 2 · la ligne d'appel : phrase à gauche, bouton et numéro à droite
    const phrase = G.geant(`<p>Choisissons <span style="color:${S.accent}">votre couleur.</span></p>`, { taille: [34, 64], tablette: { taille: [40, 56] }, mobile: { taille: [34, 46] }, lh: 1.02, suivi: "-0.03em", poids: "800", police: S.head, couleur: ENCRE })(k, env);
    const bouton = GK.fini(k, k.B("Demander un devis", "/contact", "solid", { backgroundColor: S.accent, color: "#ffffff", fontFamily: S.font, fontSize: "17px", fontWeight: "700", minHeight: "56px", display: "inline-flex", alignItems: "center", paddingLeft: "30px", paddingRight: "30px", borderRadius: "999px", borderStyle: "solid", borderWidth: "0px", transitionDuration: GK.MOUVEMENT }), { hover: { backgroundColor: ENCRE, color: "#ffffff", transform: { y: -2 } }, focus: GK.focus(ENCRE) });
    bouton.styles.mobile = { ...(bouton.styles.mobile || {}), width: "100%", justifyContent: "center" };
    const tel = telephone(k, env, { taille: "24px", couleur: ENCRE });
    const appel = G.colonne(k, [bouton, tel], { poids: 4, min: "260px", gap: "12px", soi: "center", aligne: "flex-start" });
    const hautAppel = G.ligne(k, [G.colonne(k, [phrase], { poids: 8, min: "300px" }), appel], { gap: "24px 56px", aligne: "center", justifie: "space-between", largeur: "100%" });
    // 3 · le nuancier : échantillon (pastille de couleur) + nom + lien ; la carte entière se soulève au survol (motion.hover « lift »)
    const echantillon = (couleur, nom, label, url, i) => {
      const pastille = aplat(k, couleur, { l: "100%", h: "120px", tablette: { borderTopWidth: "104px" }, mobile: { borderTopWidth: "84px" } });
      const lib = caps(k, nom, { couleur: S.mute, extra: { letterSpacing: "0.12em" } });
      const l = lien(k, label, url, { taille: 19, poids: "700", police: S.head, h: "44px", survol: { color: S.accent, transform: { x: 4 } }, focus: S.accent });
      const corps = k.col([lib, l], { gap: "2px", paddingTop: "14px", paddingBottom: "12px", paddingLeft: "18px", paddingRight: "18px", alignItems: "flex-start", boxSizing: "border-box", width: "100%" });
      const carte = k.col([pastille, corps], { backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "1px", borderColor: S.line, borderRadius: "12px", gap: "0px", width: "100%", boxSizing: "border-box", alignItems: "stretch" });
      anime(carte, { hover: "lift", duration: 300 });
      return G.colonne(k, [carte], { poids: 1, min: "220px", aligne: "stretch" });
    };
    const echantillons = G.ligne(k, [
      echantillon("#c8553d", "Terre cuite", "Nos réalisations", "/catalogue", 0),
      echantillon("#8fae8b", "Vert sauge", "Conseils déco", "/blog", 1),
      echantillon("#2f4b6e", "Bleu nuit", "Questions fréquentes", "/faq", 2),
      echantillon("#e3b04b", "Ocre", "Mon espace", "/connexion", 3),
    ], { gap: "20px", aligne: "stretch", largeur: "100%" });
    // 4 · pied : horaires, zone, réseaux, mentions
    const infos = G.ligne(k, [
      G.colonne(k, [horaires(k, env, "Horaires")], { poids: 1, min: "240px" }),
      G.colonne(k, [caps(k, "Zone d'intervention", { couleur: S.accent }), zone(k, { texte: "Chantiers chez les particuliers et les professionnels de votre secteur (à préciser dans l'éditeur).", couleur: S.mute })], { poids: 1, min: "260px", gap: "8px" }),
      G.colonne(k, [caps(k, "Nous suivre", { couleur: S.accent }), G.reseauxTexte(reseauxEx, { taille: 16, couleur: S.fg, survol: S.accent })(k, env)], { poids: 1, min: "220px", gap: "0px" }),
    ], { gap: "24px 40px", aligne: "flex-start", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const corps = G.bande(k, [hautAppel, echantillons, trait(k, S.line), infos, mentions], { colonne: true, gap: "44px", max: "1240px", padV: ["72px", "56px", "40px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Nuancier" });
    return [G.racine(k, [bandeRuban, corps])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Artisans et bâtiment", target: 5, built: true,
  description: "Pieds de sites d'artisans et d'entreprises du bâtiment : plombier, électricien, menuisier, paysagiste, peintre. Clairs, rassurants, avec appel et devis en évidence.",
  models: [goutteFlamme, tableauElectrique, atelierBois, portesJardin, nuancier],
};
