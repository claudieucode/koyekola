// Famille v2 « Commerces de proximité » — 5 modèles (ft2-106 à ft2-110), extension « sites du quotidien ».
// Pieds de sites standard de tous les jours : horaires, commande, newsletter, liens utiles, mentions légales. Chaque modèle a son univers (boulangerie, fleuriste, librairie, primeur, boutique en ligne).
// Marques FICTIVES (Le Fournil de Marthe, Atelier Pétale, Librairie Marge, Primeur Les Halles, Petite Maison) : aucune coordonnée ni chiffre inventé. Horaires, adresse et téléphone viennent des Données de
// l'entreprise (widgets), les adresses de réseaux sont des EXEMPLES à remplacer dans l'éditeur, les moyens de paiement du modèle 110 sont des exemples génériques.
// MOUVEMENTS (tous coupés sous « mouvement réduit » : le moteur ne joue ni transformation ni transition, le widget Défilement devient une liste, les animations d'attention sont « none ») :
//   · transitions de survol/focus (160-240 ms) avec glissement, soulèvement ou rotation légère ;
//   · widget Défilement continu (ruban lent) ; · animation d'attention « pulse » en boucle lente sur de petits points (motion.entrance de type attn, déclencheur « au chargement »).
// Pas d'animation d'ENTRÉE (kind « in ») : sous mouvement réduit elle se joue encore en fondu de 300 ms, ce qui casserait la règle « 0 animation ».
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "commerce-proximite";

// ── Aides LOCALES à la famille ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
// Lien de texte fini par le moteur (états, 44 px sur mobile) puis états propres : survol { …styles }, focus (contour 2 px)
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: o.h || "44px", lineHeight: o.lh, letterSpacing: o.suivi, transitionDuration: o.duree || GK.MOUVEMENT, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, transform: { x: 4 } }, focus: GK.focus(o.focus || S.accent) });
}
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, textAlign: o.align }));
// Horaires d'ouverture (Données de l'entreprise) ; « ouvert maintenant » calculé par le widget
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: o.ouvert !== false, groupDays: true, showExceptions: o.exceptions !== false, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: k.S.font, width: "100%", ...(o.extra || {}) }));
// Adresse, téléphone, e-mail (Données de l'entreprise)
const contact = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: o.icones !== false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: k.S.font, ...(o.extra || {}) }));
// Petit point qui pulse lentement (animation d'attention du Page Builder : coupée en mouvement réduit)
function point(k, couleur, o = {}) {
  const n = { type: "container", children: [], ...sty({ width: o.t || "10px", height: o.t || "10px", backgroundColor: couleur, borderRadius: "999px", flexShrink: 0 }) };
  n.motion = { entrance: o.anim || "pulse", duration: o.duree || 2600, delay: o.retard || 0, iterations: "infinite", trigger: "load", easing: "ease-in-out" };
  return n;
}
// Texte d'un bouton plein (accent), survol : soulèvement
const bouton = (k, label, url, o = {}) => {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: "16px", fontWeight: "700", fontFamily: o.police || S.font, color: o.couleur || S.onAccent, backgroundColor: o.fond || S.accent, borderRadius: o.rayon || "999px", minHeight: "52px", display: "inline-flex", alignItems: "center", paddingLeft: "28px", paddingRight: "28px", textDecoration: "none", transitionDuration: 200, borderStyle: o.contour ? "solid" : undefined, borderWidth: o.contour ? "2px" : undefined, borderColor: o.contour }));
  return GK.fini(k, n, { hover: { backgroundColor: o.survolFond || S.fg, color: o.survolCouleur || S.bg, transform: { y: -3 } }, focus: GK.focus(o.focus || S.fg) });
};

// ── c-106 « Le Fournil » — boulangerie-pâtisserie ──────────────────────────────────────────────────────────────────────────────────────────────
// Idée : une ardoise de boulangerie. Brun croûte et or de blé ; un ruban à lettres dorées défile lentement (pain du jour, viennoiseries…), la phrase « Chaud, doré, du matin. » domine, les horaires et l'adresse sont dans une carte.
// Mouvement : ruban (widget Défilement continu, pause au survol), bouton qui se soulève, liens qui glissent de 4 px. Polices : Fraunces (titres, graisse 900 : rendu propre selon le guide §5 bis) et Nunito.
const croute = identite({
  key: "c106", label: "Brun croûte et or de blé", humeur: "dark",
  fond: "#2e1b10", texte: "#fbeed8", discret: "#dcc6a6", accent: "#f2b441", surface: "#3f2618",
  police: "font.nunito", titres: "font.fraunces",
  rayon: "28px", rayonBouton: "999px", ombre: "none", poids: "800", bordure: "1px", ligne: "#7a5638",
});
const fournil = modeleV2({
  id: identifiantV2(106, "fournil-du-matin"), concept: "c-106-fournil-du-matin",
  name: "Fournil du matin", family: FAM,
  description: "Pied de boulangerie-pâtisserie : brun croûte et or de blé, ruban qui défile lentement, grande phrase « Chaud, doré, du matin. », horaires du jour dans une carte et bouton de commande.",
  tags: ["boulangerie", "pâtisserie", "commerce de proximité", "horaires", "ruban", "brun", "or", "commande"],
  identity: croute,
  racine: racineDe("#2e1b10"),
  widgets: ["marquee", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, BRUN = "#2e1b10";
    // 1 · le ruban doré : lettres dorées sur brun très foncé (le libellé « Pause » du widget reste lisible), défilement lent, pause au survol (en mouvement réduit : liste à la ligne)
    const MOTS = ["Pain du jour", "Viennoiseries", "Tartes et gâteaux", "Commandes pour les fêtes", "Cuit chaque matin"];
    const ruban = k.W("marquee", { items: MOTS.map((text) => ({ text })), speed: "slow", direction: "left", separator: "•", pauseHover: true, label: "Les bonnes choses du fournil" }, { color: S.accent, fontFamily: S.head, fontWeight: "800", fontSize: "17px", letterSpacing: "0.1em", textTransform: "uppercase", width: "100%" });
    const bandeRuban = G.bande(k, [ruban], { colonne: true, gap: "0px", max: "100%", padV: ["14px", "14px", "12px"], padH: ["0px", "0px", "12px"], fond: "#1c0f07", nom: "Ruban doré" });
    Object.assign(bandeRuban.styles.desktop, { overflow: "hidden" });
    // 2 · la phrase et la commande (gauche), la carte des horaires (droite)
    const phrase = G.geant(`<p>Chaud,<br><span style="color:${S.accent}">doré,</span><br>du&nbsp;matin.</p>`, { taille: [56, 124], tablette: { taille: [84, 110] }, mobile: { taille: [54, 80] }, lh: 0.96, suivi: "-0.025em", poids: "900", police: S.head })(k, env);
    const intro = G.phrase("Pains, viennoiseries et pâtisseries, cuits chaque jour au fournil. Passez les chercher, ou commandez pour demain.", { taille: 17, largeur: "460px", couleur: S.mute })(k, env);
    const actions = k.row([bouton(k, "Commander pour demain", "/contact"), lien(k, "Voir les produits →", "/boutique", { taille: 16, poids: "700" })], { ...G.gaps("8px 24px"), alignItems: "center" });
    const gauche = G.colonne(k, [caps(k, "Boulangerie · Pâtisserie", { couleur: S.accent }), phrase, intro, actions], { poids: 7, min: "300px", gap: "24px" });
    const carte = G.carte([caps(k, "Horaires", { couleur: S.accent }), horaires(k, { taille: 16 }), trait(k, S.line), caps(k, "Nous trouver", { couleur: S.accent }), contact(k, { taille: 16 })], { fond: S.alt, rayon: "28px", remplissage: "32px", ombre: "none", contour: S.line, gap: "16px", poids: 5 })(k);
    carte.styles.desktop = { ...carte.styles.desktop, flexBasis: "0px", flexShrink: 1, minWidth: "280px", alignSelf: "flex-end" };
    carte.styles.mobile = { paddingTop: "24px", paddingBottom: "24px", paddingLeft: "20px", paddingRight: "20px", flexBasis: "100%" };
    const haut = G.ligne(k, [gauche, carte], { gap: "48px 64px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    // 3 · liens utiles et réseaux (adresses d'exemple), puis mentions
    const utiles = k.row([lien(k, "Boutique", "/boutique"), lien(k, "Questions", "/faq"), lien(k, "Journal", "/blog"), lien(k, "Contact", "/contact")], { ...G.gaps("0px 28px"), alignItems: "center" });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"]], { taille: 15, couleur: S.mute })(k, env);
    const milieu = G.ligne(k, [utiles, reseaux], { gap: "6px 40px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const corps = G.bande(k, [haut, trait(k, S.line), milieu, mentions], { colonne: true, gap: "36px", max: "1280px", padV: ["88px", "64px", "48px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Fournil" });
    return [G.racine(k, [bandeRuban, corps])];
  },
}, FAM);

// ── c-107 « Atelier Pétale » — fleuriste ─────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : une carte de visite de fleuriste, tout au centre. Vert sauge très pâle, rose profond ; trois petits points (pétales) respirent l'un après l'autre ; une carte en ARCHE (haut arrondi) porte l'invitation « Le bouquet de la semaine » (newsletter).
// Mouvement : 3 points qui pulsent en cascade (animation d'attention, boucle lente), liens qui se soulèvent. Polices : Cormorant Garamond (titres) et Karla. Sans formulaire publié, l'abonnement dit honnêtement « non configuré ».
const sauge = identite({
  key: "c107", label: "Sauge pâle et rose profond", humeur: "light",
  fond: "#eef3ea", texte: "#1d3a2a", discret: "#46604f", accent: "#a8325a", surface: "#ffffff",
  police: "font.karla", titres: "font.cormorant-garamond",
  rayon: "24px", rayonBouton: "999px", ombre: "none", poids: "600", bordure: "1px", ligne: "#bccdb6",
});
const atelierPetale = modeleV2({
  id: identifiantV2(107, "atelier-petale"), concept: "c-107-atelier-petale",
  name: "Atelier Pétale", family: FAM,
  description: "Pied de fleuriste, tout centré : sauge pâle et rose profond, titre élégant, carte en arche pour la newsletter « Le bouquet de la semaine », horaires et commande. Trois pétales respirent doucement.",
  tags: ["fleuriste", "fleurs", "centré", "arche", "sauge", "rose", "newsletter", "commerce de proximité"],
  identity: sauge,
  racine: racineDe("#eef3ea"),
  widgets: ["text", "link", "emailsubscribe", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · trois pétales qui pulsent en cascade, libellé, grand titre centré
    const petales = k.row([point(k, S.accent, { t: "12px", retard: 0 }), point(k, "#d98aa4", { t: "12px", retard: 400 }), point(k, "#8fb08d", { t: "12px", retard: 800 })], { gap: "10px", justifyContent: "center", alignItems: "center", paddingBottom: "6px" });
    const titre = G.geant(`<p>Dites-le<br><span style="color:${S.accent}">avec des fleurs.</span></p>`, { taille: [48, 116], tablette: { taille: [72, 100] }, mobile: { taille: [46, 70] }, lh: 1, suivi: "-0.015em", poids: "600", police: S.head })(k, env, true);
    const intro = G.phrase("Bouquets du jour, compositions sur mesure, mariages et deuils. Commandez la veille, nous préparons tout à la main.", { taille: 17, largeur: "520px", couleur: S.mute })(k, env, true);
    const cta = k.row([bouton(k, "Commander un bouquet", "/contact"), lien(k, "Nos créations →", "/boutique", { taille: 16, poids: "700" })], { ...G.gaps("8px 24px"), justifyContent: "center", alignItems: "center" });
    // 2 · la carte en arche : newsletter
    const abo = G.abonnement({ titre: "Le bouquet de la semaine", intro: "Une idée de bouquet et les nouveautés de l'atelier, par e-mail.", bouton: "Je m'abonne", largeur: "380px", soulignement: "2px", styleTitre: { fontFamily: S.head, color: S.fg, fontSize: "30px", fontWeight: "600", lineHeight: 1.1, marginBottom: "6px" } })(k, env, true);
    const arche = k.col([abo], { backgroundColor: S.alt, borderStyle: "solid", borderWidth: "1px", borderColor: S.line, borderTopLeftRadius: "240px", borderTopRightRadius: "240px", borderBottomLeftRadius: "28px", borderBottomRightRadius: "28px", paddingTop: "84px", paddingBottom: "36px", paddingLeft: "36px", paddingRight: "36px", width: "100%", maxWidth: "480px", alignItems: "center", textAlign: "center", marginTop: "8px", boxSizing: "border-box" }, undefined, { borderTopLeftRadius: "170px", borderTopRightRadius: "170px", paddingTop: "64px", paddingLeft: "20px", paddingRight: "20px" });
    const haut = k.col([petales, caps(k, "Fleuriste · Atelier Pétale", { couleur: S.accent, align: "center" }), titre, intro, cta, arche], { gap: "22px", alignItems: "center", width: "100%" });
    // 3 · trois colonnes centrées : horaires, commander, atelier
    const col = (titreC, enfants) => G.colonne(k, [caps(k, titreC, { couleur: S.accent, align: "center" }), ...enfants], { poids: 1, min: "220px", gap: "10px", aligne: "center", extra: { textAlign: "center" } });
    const liensC = k.col([lien(k, "Commander un bouquet", "/contact"), lien(k, "Mariages et deuils", "/contact"), lien(k, "Livraison et retrait", "/faq")], { gap: "2px", alignItems: "center" });
    const trio = G.ligne(k, [col("Horaires", [horaires(k, { taille: 15, extra: { textAlign: "center" } })]), col("Commander", [liensC]), col("L'atelier", [contact(k, { taille: 15, icones: false, extra: { textAlign: "center", alignItems: "center" } })])], { gap: "36px 48px", aligne: "flex-start", justifie: "center", largeur: "100%" });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Pinterest", "https://www.pinterest.com/"], ["Facebook", "https://www.facebook.com/"]], { taille: 15, couleur: S.fg, survol: S.accent })(k, env, true);
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env, true);
    const bande = G.bande(k, [haut, trait(k, S.line), trio, reseaux, mentions], { colonne: true, aligne: "center", gap: "44px", max: "1100px", padV: ["88px", "64px", "48px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "30px" }, nom: "Atelier" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── c-108 « Librairie Marge » — librairie indépendante ────────────────────────────────────────────────────────────────────────────────────────
// Idée : une fiche de catalogue. Papier ivoire, encre noire, rouge reliure. À gauche l'INDEX DES RAYONS : six lignes numérotées séparées de filets, chacune glisse vers la droite et rougit au survol ;
// à droite une phrase de libraire, le bouton « Commander un livre » (il bat doucement, animation d'attention lente) et la lettre du libraire. Polices : Young Serif (titres) et Public Sans.
const papierIvoire = identite({
  key: "c108", label: "Papier ivoire, encre et rouge reliure", humeur: "light",
  fond: "#f6f1e7", texte: "#1b1b1b", discret: "#575146", accent: "#8c1c2b", surface: "#ebe4d3",
  police: "font.public-sans", titres: "font.young-serif",
  rayon: "4px", rayonBouton: "4px", ombre: "none", poids: "600", bordure: "1px", ligne: "#1b1b1b",
});
const librairieMarge = modeleV2({
  id: identifiantV2(108, "librairie-marge"), concept: "c-108-librairie-marge",
  name: "Librairie Marge", family: FAM,
  description: "Pied de librairie indépendante : papier ivoire et rouge reliure, index numéroté des rayons qui glisse au survol, phrase de libraire, bouton « Commander un livre » et lettre du libraire en bas de page.",
  tags: ["librairie", "livres", "index", "ivoire", "rouge", "éditorial", "commande", "newsletter"],
  identity: papierIvoire,
  racine: racineDe("#f6f1e7"),
  widgets: ["text", "link", "emailsubscribe", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ENCRE = "#1b1b1b";
    // 1 · l'index des rayons : numéro + titre + flèche ; filet d'encre au-dessus de chaque ligne ; glissement et rouge au survol
    const RAYONS = [["01", "Romans", "/catalogue"], ["02", "Policiers", "/catalogue"], ["03", "Bandes dessinées", "/catalogue"], ["04", "Jeunesse", "/catalogue"], ["05", "Essais et sciences", "/catalogue"], ["06", "Poches", "/catalogue"]];
    const ligneRayon = ([n, t, u]) => {
      const num = k.T(`<p>${n}</p>`, { fontSize: "13px", fontWeight: "700", letterSpacing: "0.1em", color: S.accent, fontFamily: S.font, minWidth: "30px", lineHeight: 1 });
      const l = lien(k, `${t} →`, u, { taille: 24, poids: "400", police: S.head, h: "60px", lh: 1.1, survol: { color: S.accent, transform: { x: 12 } }, extra: { fontSize: "fluid:21-30", flexGrow: 1 } });
      return k.row([num, l], { gap: "14px", flexWrap: "nowrap", alignItems: "center", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: ENCRE });
    };
    const index = G.colonne(k, [caps(k, "Les rayons", { couleur: S.fg }), k.col(RAYONS.map(ligneRayon), { gap: "0px", width: "100%", alignItems: "stretch" })], { poids: 6, min: "300px", gap: "16px", aligne: "stretch" });
    // 2 · la phrase de libraire, le bouton qui bat doucement, la lettre
    const phrase = G.geant(`<p>Une librairie<br>de quartier,<br><span style="color:${S.accent}">à lire et à bavarder.</span></p>`, { taille: [38, 76], tablette: { taille: [52, 70] }, mobile: { taille: [36, 52] }, lh: 1.05, suivi: "-0.01em", poids: "400", police: S.head })(k, env);
    const cmd = bouton(k, "Commander un livre", "/contact", { rayon: "4px", survolFond: ENCRE, survolCouleur: S.bg });
    cmd.motion = { entrance: "pulse", duration: 2800, iterations: "infinite", trigger: "load", easing: "ease-in-out" };
    const abo = G.abonnement({ titre: "La lettre du libraire", intro: "Coups de cœur et rencontres à venir, une fois de temps en temps.", bouton: "S'inscrire", largeur: "420px", soulignement: "2px", rayonBouton: "4px", styleTitre: { fontFamily: S.head, color: S.fg, fontSize: "22px", fontWeight: "400", marginBottom: "4px" } })(k, env);
    const droite = G.colonne(k, [phrase, k.row([cmd], { gap: "12px" }), abo], { poids: 6, min: "300px", gap: "28px", extra: { borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: ENCRE, paddingLeft: "48px" }, tablette: { paddingLeft: "32px" }, mobile: { borderLeftWidth: "0px", paddingLeft: "0px" } });
    const haut = G.ligne(k, [index, droite], { gap: "48px 0px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    // 3 · bandeau d'infos : horaires, adresse, réseaux
    const bloc = (t, e) => G.colonne(k, [caps(k, t, { couleur: S.fg }), e], { poids: 1, min: "220px", gap: "10px" });
    const reseaux = k.col([lien(k, "Instagram ↗", "https://www.instagram.com/", { survol: { color: S.accent, transform: { x: 4 } } }), lien(k, "Facebook ↗", "https://www.facebook.com/")], { gap: "0px", alignItems: "flex-start" });
    const infos = G.ligne(k, [bloc("Horaires", horaires(k, { taille: 15, exceptions: false })), bloc("La librairie", contact(k, { taille: 15 })), bloc("Nous suivre", reseaux)], { gap: "32px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [haut, trait(k, ENCRE, "2px"), infos, mentions], { colonne: true, gap: "40px", max: "1280px", padV: ["80px", "60px", "44px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Catalogue" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── c-109 « Les Halles du Coin » — épicerie fine / primeur — REFONTE (archétype H : mosaïque asymétrique, une grande case + trois petites) ───────
// Idée : un MARCHÉ en cases. Une GRANDE case vert feuille (« Du frais, tous les jours. », liste des rayons, bouton « Préparer mon panier ») et trois petites cases jaune clair à filet vert : « Ouvert quand ? » (horaires),
// « Venir nous voir » (adresse, téléphone) et « Au rayon » (liens et réseaux). Angles droits ; les cases se soulèvent au survol, un petit carré « respire » près des horaires (animation lente, coupée en mouvement réduit).
// Marque fictive à remplacer ; aucune coordonnée inventée (horaires, adresse et téléphone viennent des Données de l'entreprise). Pas de ruban défilant : la liste des rayons est statique. Polices : Archivo (titres 800) et Mulish.
const marche = identite({
  key: "c109", label: "Jaune citron et vert feuille", humeur: "light",
  fond: "#ffe45e", texte: "#0f3d24", discret: "#34502b", accent: "#0f5a33", surface: "#fff6c6",
  police: "font.mulish", titres: "font.archivo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "2px", ligne: "#0f5a33",
});
const primeur = modeleV2({
  id: identifiantV2(109, "halles-du-coin"), concept: "c-109-halles-du-coin",
  name: "Halles du coin", family: FAM,
  description: "Pied d'épicerie fine ou de primeur en mosaïque : une grande case vert feuille (« Du frais, tous les jours », retrait en magasin) et trois petites cases jaunes (horaires, adresse, liens) qui se soulèvent au survol.",
  tags: ["épicerie", "primeur", "marché", "jaune", "vert", "mosaïque", "retrait en magasin", "commerce de proximité"],
  identity: marche,
  racine: racineDe("#ffe45e"),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, VERT = "#0f5a33", JAUNE = "#ffe45e", CLAIR = "#fff6c6";
    const nomCase = (t, couleur) => k.T(`<p>${t}</p>`, { fontFamily: S.head, fontSize: "24px", fontWeight: "800", lineHeight: 1.1, color: couleur || S.fg, letterSpacing: "-0.01em" });
    // 1 · la GRANDE case : rayons (liste statique), phrase, retrait en magasin, bouton
    const rayons = caps(k, "Fruits et légumes de saison ✦ Fromages ✦ Épicerie fine ✦ Paniers ✦ Producteurs de la région", { couleur: JAUNE });
    const titre = G.geant(`<p>Du frais,<br>tous les jours.</p>`, { taille: [44, 104], tablette: { taille: [72, 92] }, mobile: { taille: [44, 60] }, lh: 0.96, suivi: "-0.03em", poids: "800", police: S.head, couleur: JAUNE })(k, env);
    const intro = G.phrase("Des produits choisis chez des producteurs que nous connaissons. Commandez en ligne, récupérez votre panier au magasin.", { taille: 17, largeur: "440px", couleur: "#f3f7ec" })(k, env);
    const panier = bouton(k, "Préparer mon panier", "/boutique", { fond: JAUNE, couleur: VERT, rayon: "0px", survolFond: "#ffffff", survolCouleur: VERT, focus: JAUNE });
    const grande = k.col([rayons, k.col([titre, intro], { gap: "20px", alignItems: "flex-start" }), panier], { backgroundColor: VERT, gap: "56px", justifyContent: "space-between", alignItems: "flex-start", paddingTop: "40px", paddingBottom: "44px", paddingLeft: "40px", paddingRight: "40px", flexGrow: 5, flexBasis: "0px", minWidth: "340px", boxSizing: "border-box", transitionDuration: 320 }, { paddingLeft: "32px", paddingRight: "32px" }, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "28px", paddingBottom: "32px", gap: "36px", minWidth: "0px", flexBasis: "100%" });
    // 2 · les trois petites cases
    const petite = (enfants, extra, tab, mob) => {
      const n = k.col(enfants, { backgroundColor: CLAIR, borderStyle: "solid", borderWidth: "2px", borderColor: VERT, borderRadius: "0px", paddingTop: "24px", paddingBottom: "26px", paddingLeft: "24px", paddingRight: "24px", gap: "12px", alignItems: "flex-start", boxSizing: "border-box", transitionDuration: 320, flexGrow: 1, flexBasis: "0px", minWidth: "220px", ...(extra || {}) }, tab, { minWidth: "0px", flexBasis: "100%", ...(mob || {}) });
      n.states = { hover: { transform: { y: -6 }, backgroundColor: "#ffffff" } };
      return n;
    };
    const carreSouffle = k.col([], { width: "10px", height: "10px", backgroundColor: VERT, borderRadius: "0px", flexShrink: 0 });
    carreSouffle.motion = { entrance: "pulse", duration: 2800, delay: 0, iterations: "infinite", trigger: "load", easing: "ease-in-out" };
    const enTeteHoraires = k.row([carreSouffle, nomCase("Ouvert quand ?")], { gap: "12px", flexWrap: "nowrap", alignItems: "center" });
    const cH = petite([enTeteHoraires, horaires(k, { taille: 15, exceptions: false, ouvert: false })], { flexBasis: "auto", flexGrow: 0, flexShrink: 0, width: "100%" }, undefined, { flexBasis: "auto" });
    const cA = petite([nomCase("Venir nous voir"), contact(k, { taille: 15 })]);
    const liensCase = [["Boutique", "/boutique"], ["Recettes et conseils", "/blog"], ["Questions", "/faq"], ["Contact", "/contact"], ["Instagram ↗", "https://www.instagram.com/"]].map(([t, u]) => lien(k, t, u, { taille: 15, poids: "700", h: "40px", couleur: S.fg, survol: { color: VERT, transform: { x: 6 } }, focus: VERT }));
    const cL = petite([nomCase("Au rayon"), ...liensCase], { gap: "2px" });
    const petites = k.col([cH, k.row([cA, cL], { gap: "12px", flexWrap: "wrap", alignItems: "stretch", width: "100%", flexGrow: 1 })], { gap: "12px", flexGrow: 6, flexBasis: "0px", minWidth: "340px", alignItems: "stretch" }, undefined, { minWidth: "0px", flexBasis: "100%" });
    const mosaique = G.ligne(k, [grande, petites], { gap: "12px", aligne: "stretch", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true, couleur: S.mute, liens: S.fg })(k, env);
    const corps = G.bande(k, [mosaique, trait(k, VERT, "2px"), mentions], { colonne: true, gap: "32px", max: "1280px", padV: ["56px", "44px", "28px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "24px" }, nom: "Mosaïque" });
    return [G.racine(k, [corps])];
  },
}, FAM);

// ── c-110 « Petite Maison » — petite boutique en ligne ──────────────────────────────────────────────────────────────────────────────────────
// Idée : le pied d'une boutique en ligne simple, net et rassurant. Blanc, encre bleu nuit, bleu cobalt. Une bande de réassurance (paiement, livraison, retours) avec les moyens de paiement en étiquettes, puis quatre colonnes
// (marque + newsletter, boutique, aide, compte). Le petit point vert « commandes ouvertes » pulse doucement. Les moyens de paiement (carte bancaire, PayPal, virement) sont des EXEMPLES génériques à adapter. Polices : Outfit et Inter.
const cobalt = identite({
  key: "c110", label: "Blanc, bleu nuit et cobalt", humeur: "light",
  fond: "#ffffff", texte: "#0f172a", discret: "#475569", accent: "#2447f9", surface: "#f1f4fb",
  police: "font.inter", titres: "font.outfit",
  rayon: "14px", rayonBouton: "10px", ombre: "none", poids: "600", bordure: "1px", ligne: "#d8deec",
});
const petiteMaison = modeleV2({
  id: identifiantV2(110, "petite-maison-boutique"), concept: "c-110-petite-maison-boutique",
  name: "Petite maison boutique", family: FAM,
  description: "Pied de petite boutique en ligne : bande de réassurance (paiement sécurisé, livraison suivie, retours simples), quatre colonnes claires (boutique, aide, compte), newsletter et point vert « commandes ouvertes » qui pulse.",
  tags: ["boutique en ligne", "e-commerce", "paiement", "livraison", "retours", "bleu cobalt", "colonnes", "newsletter"],
  identity: cobalt,
  racine: racineDe("#ffffff"),
  widgets: ["sitetitle", "text", "link", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · bande de réassurance sur fond doux : trois promesses + moyens de paiement en étiquettes
    const promesse = (t, d) => G.colonne(k, [k.T(`<p>${t}</p>`, { fontFamily: S.head, fontSize: "19px", fontWeight: "600", color: S.fg, lineHeight: 1.2 }), k.T(`<p>${d}</p>`, { fontSize: "14px", lineHeight: 1.5, color: S.mute })], { poids: 1, min: "220px", gap: "4px", extra: { borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "3px", borderColor: S.accent, paddingLeft: "16px" } });
    const MOYENS = ["Carte bancaire", "PayPal", "Virement"];
    const puces = k.row(MOYENS.map((m) => k.T(`<p>${m}</p>`, { fontSize: "13px", fontWeight: "600", color: S.fg, backgroundColor: S.bg, borderStyle: "solid", borderWidth: "1px", borderColor: S.line, borderRadius: "999px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "14px", paddingRight: "14px", lineHeight: 1.2 })), { gap: "8px", alignItems: "center" });
    const paiement = G.colonne(k, [caps(k, "Paiement"), puces], { poids: 1, min: "220px", gap: "10px" });
    const rassure = G.ligne(k, [promesse("Paiement sécurisé", "Réglez en ligne, en confiance."), promesse("Livraison suivie", "Suivez votre colis pas à pas."), promesse("Retours simples", "Un souci ? On s'en occupe."), paiement], { gap: "28px 32px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const bandeRassure = G.bande(k, [rassure], { colonne: true, max: "1280px", padV: ["40px", "36px", "32px"], padH: ["48px", "32px", "20px"], fond: S.alt, innerMobile: { rowGap: "22px" }, nom: "Réassurance" });
    // 2 · quatre colonnes : marque + newsletter, boutique, aide, compte
    const statut = k.row([point(k, "#1a7f37", { t: "10px" }), k.T("<p>Commandes ouvertes</p>", { fontSize: "13px", fontWeight: "600", color: S.mute })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const marque = G.colonne(k, [k.siteTitle({ minHeight: "44px", display: "inline-flex", alignItems: "center", fontSize: "28px", fontFamily: S.head, fontWeight: "700", letterSpacing: "-0.01em" }), statut, G.phrase("Une petite boutique, des produits choisis, un service qui répond.", { taille: 15, largeur: "340px" })(k, env),
      G.abonnement({ titre: "Nouveautés par e-mail", intro: "", bouton: "S'inscrire", largeur: "380px", soulignement: "1px", fondChamp: S.alt, rayonChamp: "10px", rembChamp: "14px", rayonBouton: "10px", styleTitre: { fontFamily: S.font, color: S.fg, fontSize: "13px", fontWeight: "700", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "4px" } })(k, env)], { poids: 5, min: "280px", gap: "16px" });
    const liste = (t, items) => G.colonne(k, [caps(k, t, { couleur: S.fg }), k.col(items.map(([l, u]) => lien(k, l, u, { taille: 15, survol: { color: S.accent, transform: { x: 4 } } })), { gap: "0px", alignItems: "flex-start" })], { poids: 2, min: "150px", gap: "10px" });
    const cols = G.ligne(k, [marque, liste("Boutique", [["Nouveautés", "/boutique"], ["Toutes les catégories", "/catalogue"], ["Mon panier", "/boutique/panier"], ["Mes envies", "/boutique/souhaits"]]), liste("Aide", [["Livraison et retours", "/faq"], ["Questions fréquentes", "/faq"], ["Nous contacter", "/contact"]]), liste("Mon compte", [["Me connecter", "/connexion"], ["Créer un compte", "/inscription"], ["Mes commandes", "/boutique/compte"]])], { gap: "40px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    // 3 · réseaux (adresses d'exemple) et mentions
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["Pinterest", "https://www.pinterest.com/"]], { taille: 14, couleur: S.mute, survol: S.accent })(k, env);
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bas = G.ligne(k, [mentions, reseaux], { gap: "8px 32px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const corps = G.bande(k, [cols, trait(k, S.line), bas], { colonne: true, gap: "32px", max: "1280px", padV: ["64px", "52px", "40px"], padB: ["24px", "24px", "20px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "26px" }, nom: "Colonnes" });
    return [G.racine(k, [bandeRassure, corps])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Commerces de proximité", target: 5, built: true,
  description: "Pieds de commerces du quotidien : boulangerie, fleuriste, librairie, épicerie, boutique en ligne simple.",
  models: [fournil, atelierPetale, librairieMarge, primeur, petiteMaison],
};
