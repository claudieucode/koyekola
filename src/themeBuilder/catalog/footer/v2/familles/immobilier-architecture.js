// Famille v2 « Immobilier et architecture » — cible 7 modèles (concepts c-060 à c-066 de docs/footer-v2/CONCEPTS_100.md). Voir docs/footer-v2/GUIDE_CONSTRUIRE_UN_MODELE_V2.md.
// `built: true` : les 7 modèles de la cible sont écrits (la liste publique ne change que lorsque les 14 familles sont construites).
// Les modèles s'écrivent avec ../kit-v2 (modeleV2, identite, gestes G.*) et s'insèrent en mode « solo » (indépendants du site). Les aides locales sont DANS ce fichier.
//
// Particularités communes à la famille :
//  · le NOM affiché est le widget « Titre du site » (les marques fictives des concepts ne sont que des exemples) ;
//  · AUCUNE donnée inventée : adresse, téléphone, e-mail, horaires et immatriculations viennent des « Données de l'entreprise » (widgets bizcontact, bizphone, bizhours, bizlegal : invisibles tant qu'ils ne sont pas remplis) ;
//    carte professionnelle, garantie, médiateur… : jamais écrits en dur — le client les saisit dans les immatriculations des Données de l'entreprise (affichées par bizlegal) ;
//  · pas de moteur de recherche de biens inventé : les liens vont vers les pages réelles de la plateforme (/catalogue, /blog, /faq, /contact…) ;
//  · décors = SVG statiques (widget HTML) posés sous le contenu (aucun script, aucun mouvement) ; le contenu garde son propre contraste AA ;
//  · réseaux : adresses d'EXEMPLE (pages d'accueil des réseaux) à remplacer dans l'éditeur.
const { modeleV2, identifiantV2, identite, G, Kit, Moteur, contrastOf } = require("../kit-v2");
const { compact, sty } = require("../../../kit");

const FAM = "immobilier-architecture";

// ── Aides locales ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const survolDe = (S, bg) => (S.accent !== S.fg && contrastOf(S.accent, bg || S.bg) >= 4.5 ? S.accent : null);
// lien de texte : survol souligné (+ couleur d'accent si lisible), focus visible 2 px, cible 44 px sur mobile
const lien = (k, label, url, o = {}) => {
  const S = k.S, c = o.couleur || S.fg;
  const n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: c, textDecoration: "none", textTransform: o.casse, letterSpacing: o.suivi, lineHeight: o.lh || 1.4, display: "inline-flex", alignItems: "center", minHeight: o.h, transitionDuration: G.MOUVEMENT, ...(o.extra || {}) }));
  const sv = o.survol === null ? null : o.survol || survolDe(S, o.fondSurvol);
  return G.fini(k, n, { hover: { color: sv || c, textDecoration: "underline", ...(sv || o.sansDecalage ? {} : { transform: { x: 3 } }) }, focus: G.focus(o.focus || sv || S.accent) });
};
// o.filet : chaque lien occupe toute la largeur, séparé du suivant par un filet fin (annuaire)
const liste = (k, items, o = {}) => k.col(items.map(([l, u]) => lien(k, l, u, o.filet ? { ...o, extra: { width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: k.S.line, ...(o.extra || {}) } } : o)), { gap: o.gap || "4px", alignItems: o.filet ? "stretch" : "flex-start", width: o.filet ? "100%" : undefined });
// petit titre en capitales espacées
const etiquette = (k, txt, o = {}) => k.T(`<p>${txt}</p>`, compact({ fontSize: `${o.taille || 12}px`, lineHeight: 1.3, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, textAlign: o.align }));
// le NOM DU SITE (widget Titre du site) avec lien vers l'accueil
const nomSite = (k, o = {}) => {
  const S = k.S, f = o.police || S.head;
  const n = k.siteTitle(compact({ fontSize: o.taille, fontFamily: f, fontWeight: o.poids || "800", lineHeight: o.lh || 1.05, letterSpacing: o.suivi || "-0.01em", textTransform: o.casse, color: o.couleur || S.fg, textAlign: o.align, width: o.largeur, overflowWrap: "break-word", marginTop: "0px", marginBottom: "0px" }));
  if (o.tablette) n.styles.tablet = { fontSize: o.tablette };
  if (o.mobile) n.styles.mobile = { fontSize: o.mobile };
  const sv = o.survol === null ? null : o.survol || survolDe(S);
  n.parts = { link: { styles: { desktop: compact({ color: o.couleur || S.fg, fontFamily: f, fontWeight: o.poids || "800", textDecoration: "none" }), mobile: { display: "inline-block", minHeight: "44px", paddingTop: "8px", paddingBottom: "8px" } }, states: { hover: sv ? { color: sv, textDecoration: "underline" } : { opacity: 0.75, textDecoration: "underline" }, focus: G.focus(o.focus || S.accent) } } };
  return n;
};
// réseaux en icônes (disques ou carrés) aux couleurs du modèle : parties du widget « Réseaux sociaux »
const reseauxIcones = (k, env, liste, o = {}) => {
  const S = k.S, n = Moteur.item(k, `socials:${liste.join("+")}`, env);
  n.props.size = String(o.taille || 40); n.props.shape = o.forme || "circle";
  Moteur.mergePart(n, "link", { styles: { desktop: compact({ color: o.couleur || S.fg, backgroundColor: o.fond, borderStyle: o.contour ? "solid" : undefined, borderWidth: o.contour ? (o.epaisseur || "1px") : undefined, borderColor: o.contour, transitionDuration: G.MOUVEMENT }) },
    states: { hover: { backgroundColor: o.survolFond || S.accent, color: o.survolCouleur || S.onAccent, borderColor: o.survolFond || S.accent }, focus: G.focus(o.focus || S.accent) } });
  return n;
};
// réseaux en NOMS suivis d'une flèche (adresses d'exemple)
const RESEAUX = [["Instagram", "https://www.instagram.com/"], ["LinkedIn", "https://www.linkedin.com/"], ["Facebook", "https://www.facebook.com/"], ["YouTube", "https://www.youtube.com/"]];
const fleches = (k, liste, o = {}) => k.row(liste.map(([l, u]) => lien(k, `${l} ↗`, u, { taille: o.taille || 15, poids: o.poids || "600", ...(o.lien || {}) })), { rowGap: "0px", columnGap: o.ecart || "22px", alignItems: "center" });
const trait = (k, couleur, e = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: e, marginTop: "0px", marginBottom: "0px" });
const texte = (k, html, o = {}) => k.T(html.startsWith("<") ? html : `<p>${html}</p>`, compact({ fontSize: `${o.taille || 15}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, maxWidth: o.largeur, fontWeight: o.poids, textAlign: o.align, ...(o.extra || {}) }));
// mentions d'immatriculation (SIRET, carte professionnelle…) saisies par le client dans les Données de l'entreprise : jamais écrites ici
const mentions = (k, S, o = {}) => Moteur.finishNode(S, k.W("bizlegal", { title: "", showName: true, showForm: true, showRegistrations: true, showPublisher: false, showHost: false, showPages: false, layout: "inline" }, { color: o.couleur || S.mute, fontSize: "12px", fontFamily: S.font }));

// ── Décors SVG (widget HTML) : un calque posé SOUS le contenu, pleine surface de la bande ──────────────────────────────────────────────────────
const svgDe = (w, h, corps, o = {}) => {
  const s = `<span aria-hidden="true"><svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="${o.ratio || "xMidYMid slice"}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${corps}</svg></span>`;
  if (s.length > 19000) throw new Error(`SVG trop long (${s.length}) pour le widget HTML (20 000 caractères).`);
  return s;
};
// calque(html, masque) : élément HTML absolu, hors flux, sous le contenu
const calque = (html, masque) => ({ type: "html", props: { html }, hideOn: masque, ...sty({ position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%", zIndex: 0, overflow: "hidden", lineHeight: 0.8, fontSize: "0px" }) });
// surFond(bande, { bureau, tablette, mobile }) : la bande devient le repère des calques (relative, rogne ce qui dépasse) ; son contenu passe au-dessus.
// Le widget HTML impose `height: auto` aux dessins SVG (landing.css) : la hauteur d'un calque vient donc du RAPPORT de sa viewBox ; on fournit un dessin par écran, plus haut que la bande (le surplus est rogné par le bas).
function surFond(b, d) {
  b.styles.desktop = { ...b.styles.desktop, position: "relative", overflow: "hidden" };
  const inner = b.children[0];
  inner.styles.desktop = { ...inner.styles.desktop, position: "relative", zIndex: 1 };
  b.children.push(calque(d.bureau, ["tablet", "mobile"]), calque(d.tablette, ["desktop", "mobile"]), calque(d.mobile, ["desktop", "tablet"])); // après le contenu : il reste le premier enfant de la bande (empreinte structurelle)
  return b;
}
// telAvecTitre(k, S, titre, { taille, police, poids, couleur }) : widget Téléphone dont le PRÉFIXE est un petit titre en capitales posé au-dessus du numéro ; il disparaît avec le numéro (jamais d'étiquette seule quand les Données de l'entreprise sont vides)
const telAvecTitre = (k, S, titre, o = {}) => {
  const n = Moteur.finishNode(S, k.W("bizphone", { which: "1", prefix: titre, showLabel: false, showIcon: !!o.icone }, { color: o.couleur || S.fg, fontSize: o.taille || "22px", fontWeight: o.poids || "800", fontFamily: o.police || S.head, lineHeight: 1.1, ...(o.st || {}) }));
  Moteur.mergePart(n, "prefix", { styles: { desktop: { display: "block", width: "100%", fontFamily: S.font, fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.16em", color: o.couleurTitre || S.mute, marginBottom: "6px", lineHeight: 1.3 } } });
  return n;
};
// largeurs(accordeon, ["300px", …]) : le conteneur « accordéon » enveloppe chaque volet dans un bloc qui NE GRANDIT PAS (largeur = celle du contenu) : on fixe donc la largeur de chaque volet par sa largeur minimale
const largeurs = (acc, liste) => { acc.children.forEach((c, i) => { c.styles.desktop = { ...c.styles.desktop, minWidth: liste[i] || liste[liste.length - 1] }; c.styles.tablet = { ...(c.styles.tablet || {}), minWidth: "0px" }; }); return acc; };
// grille d'éléments à nombre de colonnes réglé par écran [bureau, tablette, mobile]
const grille = (enfants, cols, st = {}, t = {}, m = {}) => ({ type: "grid", children: enfants, ...sty(compact({ columns: cols[0], gap: "24px", width: "100%", ...st }), { columns: cols[1], ...t }, { columns: cols[2], ...m }) });

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-060 « Votre agent local » — agence de quartier fictive « Toit & Moi ». L'humain avant le catalogue : une GRANDE CARTE D'AGENT (portrait rond, bulle de message, ligne directe, horaires, bouton « Écrire à votre agent ») occupe la moitié gauche ;
// à droite, deux colonnes de liens. Bleu profond #14284B, menthe #4DD0A5 pour le bouton et les filets. Polices : Manrope 800 (titres) et Source Sans 3 (texte), toutes deux propres en grand corps (testées à 130 px).
// Le portrait est une SILHOUETTE neutre (aucune photo, aucun nom inventé) ; le nom, la ligne directe et les horaires viennent des Données de l'entreprise. La carte professionnelle de l'agent se saisit dans les immatriculations (affichées sous le pied, jamais écrites ici).
// Mobile : la carte passe en tête puis les colonnes deviennent des volets repliables (48 px).
const toit = identite({
  key: "c060", label: "Bleu profond et menthe", humeur: "dark",
  fond: "#14284b", texte: "#ffffff", discret: "#bfcbe0", accent: "#4dd0a5", surface: "#1d3664",
  police: "font.source-sans-3", titres: "font.manrope",
  rayon: "20px", rayonBouton: "14px", ombre: "none", poids: "800", bordure: "0px", ligne: "#ffffff33",
});
const SVG_AGENT = (fond, trait_) => `<svg viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="Portrait de votre agent (silhouette, à remplacer par une photo)" focusable="false"><circle cx="48" cy="48" r="48" fill="${fond}"/><circle cx="48" cy="38" r="15" fill="${trait_}"/><path d="M18 84c2-18 14-28 30-28s28 10 30 28A48 48 0 0 1 48 96a48 48 0 0 1-30-12z" fill="${trait_}"/></svg>`;
const agentLocal = modeleV2({
  id: identifiantV2(60, "votre-agent-local"), concept: "c-060-votre-agent-local",
  name: "Votre agent local", family: FAM,
  description: "L'humain avant le catalogue : une grande carte d'agent de quartier (portrait, bulle de message, ligne directe, horaires, bouton Écrire) occupe la moitié gauche ; deux colonnes de liens à droite. Bleu profond et menthe.",
  tags: ["agence immobilière", "agent de quartier", "carte de profil", "bulle", "bleu", "menthe", "proximité"],
  identity: toit,
  racine: { desktop: { backgroundColor: "#14284b", gap: "0px" } },
  widgets: ["sitetitle", "html", "text", "bizphone", "bizhours", "button", "bizcontact", "social", "bizlegal", "copyright", "link"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · barre du haut : le nom du site à gauche, l'accès « Mon espace » à droite
    const barre = G.ligne(k, [nomSite(k, { taille: "26px", survol: null }), lien(k, "Mon espace ↗", "/connexion", { taille: 15, poids: "700", h: "44px" })], { justifie: "space-between", largeur: "100%", gap: "8px" });
    const bandeHaut = G.bande(k, [barre], { colonne: true, max: "1240px", padV: ["28px", "24px", "20px"], padB: ["24px", "20px", "16px"], padH: ["48px", "32px", "20px"], fond: S.bg, nom: "Votre agent local — barre" });
    // 2 · la carte de l'agent : portrait rond, bulle de message, ligne directe, horaires, bouton
    const portrait = { type: "html", props: { html: SVG_AGENT(S.accent, S.bg) }, ...sty({ width: "96px", height: "96px", minWidth: "96px", flexShrink: 0, lineHeight: 0.8, fontSize: "0px" }, undefined, { width: "80px", height: "80px", minWidth: "80px" }) };
    const identiteAgent = k.col([etiquette(k, "Votre agent de quartier", { couleur: S.accent, suivi: "0.16em" }), k.T("<p>Une seule personne, de la première visite à la remise des clés.</p>", { fontFamily: S.head, fontWeight: "800", fontSize: "fluid:22-30", lineHeight: 1.15, color: S.fg, letterSpacing: "-0.01em", marginTop: "0px" })], { gap: "8px", flexGrow: 1, flexBasis: "0px", minWidth: "180px" });
    const tete = G.ligne(k, [portrait, identiteAgent], { gap: "20px", aligne: "center", largeur: "100%", pas_de_ligne: true });
    const bulle = k.T("<p>Une question sur un bien ou sur votre projet ? Écrivez-moi directement : je vous réponds en personne.</p>", { fontSize: "17px", lineHeight: 1.55, color: S.fg, fontFamily: S.font, backgroundColor: S.bg, borderRadius: "22px", borderBottomLeftRadius: "4px", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "24px", paddingRight: "24px", width: "100%" });
    const ligneDirecte = telAvecTitre(k, S, "Ligne directe", { taille: "26px", icone: true });
    const horaires = k.W("bizhours", { title: "Horaires", showOpenNow: true, groupDays: true, showExceptions: false, showNote: true, closedLabel: "Fermé" }, { color: S.mute, fontSize: "14px", fontFamily: S.font });
    const ecrire = G.fini(k, k.B("Écrire à votre agent", "/contact", "solid", { fontFamily: S.font, fontSize: "17px", fontWeight: "700", minHeight: "56px", paddingLeft: "28px", paddingRight: "28px", alignSelf: "flex-start", transitionDuration: G.MOUVEMENT }), { hover: { backgroundColor: S.fg, color: S.bg, transform: { y: -2 } }, focus: G.focus(S.fg) });
    ecrire.styles.mobile = { ...(ecrire.styles.mobile || {}), width: "100%", alignSelf: "stretch" };
    const carte = G.carte([tete, bulle, ligneDirecte, horaires, ecrire], { fond: S.alt, rayon: "28px", remplissage: "32px", ombre: "none", gap: "22px", poids: 1 })(k);
    carte.styles.desktop = { ...carte.styles.desktop, flexBasis: "0px", flexGrow: 5, minWidth: "320px", alignSelf: "stretch" };
    carte.styles.tablet = { flexBasis: "100%", minWidth: "0px" };
    carte.styles.mobile = { ...(carte.styles.mobile || {}), paddingTop: "24px", paddingBottom: "24px", paddingLeft: "20px", paddingRight: "20px" };
    // 3 · à droite : deux colonnes de liens (volets de 48 px sur mobile) — la 2e porte l'adresse (Données de l'entreprise) et les réseaux en disques de 44 px — puis un grand appel discret
    const adresse = (kk) => kk.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: false, showEmail: true, showIcons: false, layout: "stack" }, { color: S.fg, fontSize: "16px", fontFamily: S.font });
    const ronds = (kk) => reseauxIcones(kk, env, ["instagram", "facebook", "linkedin", "youtube"], { taille: 44, forme: "circle", fond: S.alt, couleur: S.fg });
    const colonnes = Kit.accordeon([
      { title: "Votre projet", w: 1, codes: [(kk) => liste(kk, [["Tous nos biens", "/catalogue"], ["Estimer mon bien", "/contact"], ["Questions fréquentes", "/faq"], ["Actualités du quartier", "/blog"]], { taille: 19, gap: "0px", h: "58px", poids: "700", filet: true })] },
      { title: "Votre agence", w: 1, codes: [adresse, ronds] },
    ], { min: "200px" })(k, env);
    largeurs(colonnes, ["300px", "240px"]);
    colonnes.styles.desktop = { ...colonnes.styles.desktop, columnGap: "48px", rowGap: "28px", gap: undefined };
    const grandLien = lien(k, "Parlons de votre projet →", "/contact", { taille: 30, poids: "800", h: "64px", couleur: S.fg, survol: S.accent, sansDecalage: false, extra: { fontFamily: S.head, fontSize: "fluid:22-34", letterSpacing: "-0.01em", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "3px", borderColor: S.accent, paddingBottom: "6px", alignSelf: "flex-start" } });
    const droite = G.colonne(k, [colonnes, grandLien], { poids: 7, min: "320px", gap: "40px", justifie: "space-between", soi: "stretch", tablette: { flexBasis: "100%" } });
    colonnes.styles.mobile = { ...(colonnes.styles.mobile || {}), width: "100%" };
    const bandeMilieu = G.bande(k, [carte, droite], { gap: "48px 72px", aligne: "stretch", max: "1240px", padV: ["44px", "36px", "28px"], padB: ["44px", "36px", "28px"], padH: ["48px", "32px", "20px"], fond: S.bg, filetHaut: { epaisseur: "1px", couleur: S.line }, innerMobile: { rowGap: "28px" }, nom: "Votre agent local — carte" });
    const bas = G.ligne(k, [mentions(k, S), G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { gap: "10px 32px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    bas.styles.mobile = { ...(bas.styles.mobile || {}), flexDirection: "column", alignItems: "flex-start" };
    const bandeBas = G.bande(k, [bas], { colonne: true, max: "1240px", padV: ["32px", "28px", "24px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], fond: S.bg, filetHaut: { epaisseur: "1px", couleur: S.line }, nom: "Votre agent local — mentions" });
    return [G.racine(k, [bandeHaut, bandeMilieu, bandeBas])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-061 « Programmes neufs » — promoteur fictif « Maison Brique ». Quatre cartes pour quatre entrées (programmes, étapes d'un achat, chantiers, conseiller), posées sur un PLAN D'ÉTAGE dessiné en filigrane (10 %) ;
// le nom du promoteur en Prata, contact en cartes, réseaux « Nom ↗ ». Terre cuite #A4472B, crème #FFF6EE, sable #F2B880. Polices : Prata (titres, élégante et propre à 130 px) et Hanken Grotesk (texte ;
// remplace Figtree du concept, que le guide déconseille : Hanken Grotesk est de même esprit géométrique et propre).
// Les cartes pointent vers des pages RÉELLES (/catalogue, /faq, /blog, /contact) : le client change les libellés et les adresses vers ses programmes dans l'éditeur ; aucun programme ni prix inventé.
// Mobile : cartes en pile, plan simplifié (3 pièces). Survol/focus : la carte se décale de 4 px.
const brique = identite({
  key: "c061", label: "Terre cuite et crème", humeur: "dark",
  fond: "#a4472b", texte: "#fff6ee", discret: "#fbe6d8", accent: "#f5be8e", surface: "#85351f",
  police: "font.hanken-grotesk", titres: "font.prata",
  rayon: "24px", rayonBouton: "14px", ombre: "none", poids: "400", bordure: "0px", ligne: "#fff6ee4d",
});
// plan d'étage (dessin de traits fins crème, 14 % d'opacité) : mur extérieur épais, cloisons avec passages, portes en quarts de cercle, baies vitrées, meubles ; construit en fractions de (w, h) pour tenir à chaque écran
const planEtage = (w, h, colonnes) => {
  const x = (f) => Math.round(w * f), y = (f) => Math.round(h * f), r = Math.round(Math.min(w, h) * 0.065);
  const L = (a, b, c, d) => `M${a} ${b}L${c} ${d}`;
  const porteH = (px, py, sens) => `M${px} ${py}h${sens * r}M${px} ${py}a${r} ${r} 0 0 ${sens > 0 ? 1 : 0} ${sens * r} ${r}`; // porte : battant + arc
  let d = "";
  const cut = colonnes === 2 ? [0.5] : [0.34, 0.66];
  // cloisons verticales (avec un passage de 2 r), horizontales
  for (const f of cut) d += L(x(f), y(0.04), x(f), y(0.30)) + L(x(f), y(0.30) + 2 * r, x(f), y(0.96));
  d += L(x(0.04), y(0.40), x(cut[0]), y(0.40)) + L(x(cut[cut.length - 1]), y(0.62), x(0.96), y(0.62)) + L(x(cut[0]), y(0.80), x(cut[cut.length - 1]), y(0.80));
  const baies = [[0.12, 0.04, 0.26, 0.04], [0.74, 0.04, 0.9, 0.04], [0.40, 0.96, 0.58, 0.96], [0.04, 0.5, 0.04, 0.58]].map(([a, b, c, e]) => L(x(a), y(b), x(c), y(e)) + L(x(a) + (a === c ? 8 : 0), y(b) + (b === e ? 8 : 0), x(c) + (a === c ? 8 : 0), y(e) + (b === e ? 8 : 0))).join("");
  const portes = porteH(x(cut[0]) + 0, y(0.30), 1) + porteH(x(cut[cut.length - 1]), y(0.30), -1);
  const meubles = `<circle cx="${x(0.5)}" cy="${y(0.52)}" r="${r}"/><circle cx="${x(0.5)}" cy="${y(0.52)}" r="${Math.round(r * 0.45)}"/><rect x="${x(0.72)}" y="${y(0.08)}" width="${x(0.18)}" height="${y(0.1)}"/><rect x="${x(0.76)}" y="${y(0.70)}" width="${x(0.14)}" height="${y(0.08)}"/><circle cx="${x(0.18)}" cy="${y(0.72)}" r="${Math.round(r * 0.8)}"/>`;
  return `<g fill="none" stroke="#fff6ee" stroke-linecap="round" stroke-linejoin="round" opacity="0.12"><rect x="${x(0.04)}" y="${y(0.04)}" width="${x(0.92)}" height="${y(0.92)}" stroke-width="4"/><path d="${d}" stroke-width="2.5"/><path d="${baies}" stroke-width="2"/><path d="${portes}" stroke-width="2"/><g stroke-width="2">${meubles}</g></g>`;
};
const programmes = modeleV2({
  id: identifiantV2(61, "programmes-neufs"), concept: "c-061-programmes-neufs",
  name: "Programmes neufs", family: FAM,
  description: "Quatre grandes cartes cliquables (programmes, étapes d'un achat, chantiers, conseiller) sur un plan d'étage dessiné en filigrane. Terre cuite, crème et sable ; titres en Prata, réseaux en noms suivis d'une flèche.",
  tags: ["promoteur", "programmes neufs", "cartes", "plan d'étage", "terre cuite", "crème", "serif"],
  identity: brique,
  racine: { desktop: { backgroundColor: "#a4472b", gap: "0px" } },
  widgets: ["sitetitle", "html", "text", "link", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomSite(k, { taille: "fluid:34-60", poids: "400", suivi: "-0.01em", lh: 1.05, survol: S.accent });
    const accroche = texte(k, "Des adresses neuves, des plans clairs, un interlocuteur du premier rendez-vous à la remise des clés.", { taille: 17, couleur: S.mute, largeur: "420px" });
    const tete = G.ligne(k, [k.col([nom, accroche], { gap: "12px", flexGrow: 1, flexBasis: "0px", minWidth: "260px" }), fleches(k, RESEAUX.slice(0, 3), { taille: 15 })], { gap: "24px 48px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    // quatre cartes : numéro (sable), titre en Prata, phrase, lien-flèche ; toute la carte se décale de 4 px au survol/focus (le lien porte l'état)
    const carteLien = (num, titre, phrase, url, lienTexte) => {
      const l = lien(k, `${lienTexte} →`, url, { taille: 15, poids: "700", couleur: S.accent, survol: S.fg, h: "44px", sansDecalage: false });
      const c = G.carte([k.T(`<p>${num}</p>`, { fontFamily: S.head, fontSize: "15px", color: S.accent, letterSpacing: "0.1em" }), k.T(`<p>${titre}</p>`, { fontFamily: S.head, fontSize: "fluid:22-28", lineHeight: 1.15, color: S.fg }), texte(k, phrase, { taille: 15, couleur: S.mute }), l], { fond: S.alt, rayon: "28px", remplissage: "28px", ombre: "none", gap: "10px" })(k);
      c.styles.desktop = { ...c.styles.desktop, justifyContent: "space-between", minHeight: "260px", borderStyle: "solid", borderWidth: "1px", borderColor: "#fff6ee33", transitionDuration: G.MOUVEMENT };
      c.styles.tablet = { minHeight: "220px" }; c.styles.mobile = { minHeight: "0px", paddingTop: "24px", paddingBottom: "20px", paddingLeft: "22px", paddingRight: "22px" };
      c.states = { hover: { transform: { y: -4 }, borderColor: S.accent }, focus: G.focus(S.accent) };
      return c;
    };
    const cartes = grille([
      carteLien("01", "Nos programmes", "Les résidences en cours de commercialisation.", "/catalogue", "Découvrir"),
      carteLien("02", "Acheter dans le neuf", "Les étapes, de la réservation à la remise des clés.", "/faq", "Lire le guide"),
      carteLien("03", "Suivre les chantiers", "Les nouvelles des programmes en cours de construction.", "/blog", "Voir les actualités"),
      carteLien("04", "Parler à un conseiller", "Une question, un projet, un rendez-vous à prendre.", "/contact", "Nous écrire"),
    ], [4, 2, 1], { gap: "20px" });
    const contact = Moteur.finishNode(S, k.W("bizcontact", { title: "Nous trouver", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "inline" }, { color: S.fg, fontSize: "16px", fontFamily: S.font, width: "100%" }));
    Moteur.mergePart(contact, "title", { styles: { desktop: { fontFamily: S.font, fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.16em", color: S.mute, marginBottom: "10px" } } });
    const bas = G.ligne(k, [mentions(k, S), G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { gap: "10px 32px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    bas.styles.mobile = { ...(bas.styles.mobile || {}), flexDirection: "column", alignItems: "flex-start" };
    const b = G.bande(k, [tete, cartes, trait(k, S.line), contact, bas], { colonne: true, gap: "40px", max: "1240px", padV: ["88px", "72px", "56px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Programmes neufs" });
    return [G.racine(k, [surFond(b, { bureau: svgDe(1440, 1000, planEtage(1440, 1000, 3)), tablette: svgDe(820, 1500, planEtage(820, 1500, 2)), mobile: svgDe(390, 1900, planEtage(390, 1900, 2)) })])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-062 « Cartouche de plan » — cabinet d'architectes fictif « Équerre ». Le pied est un CARTOUCHE de plan d'architecte : 8 cases à filets (projet, n° de plan, échelle, date, adresse, contact, réseaux, pages) sur papier millimétré,
// avec une cote jaune au-dessus. Bleu de plan #0F3D63, traits clairs, jaune de cotation #FFD166. Polices : Roboto Mono (titres de cases, 20 px au plus) et Roboto Condensed (texte), toutes deux propres.
// Les cases « Plan n° » et « Échelle » sont un clin d'œil de décor (texte statique, modifiable) ; « Date » est la date du jour (texte dynamique), le reste vient des Données de l'entreprise. Aucun nom de dessinateur ni numéro inventé.
// Responsive : 4 colonnes (bureau) ; 2 colonnes (tablette et mobile : « Projet » et « Pages » prennent toute la largeur) ; papier millimétré SVG remplacé par une version mobile.
const equerre = identite({
  key: "c062", label: "Bleu de plan et jaune de cotation", humeur: "dark",
  fond: "#0f3d63", texte: "#e8f2fa", discret: "#a9c6df", accent: "#ffd166", surface: "#164b77",
  police: "font.roboto-condensed", titres: "font.roboto-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#e8f2fa66",
});
const papierMillimetre = (w, h, pas) => {
  let fin = "", gros = "";
  for (let x = 0; x <= w; x += pas) (x % (pas * 5) === 0 ? (gros += `M${x} 0V${h}`) : (fin += `M${x} 0V${h}`));
  for (let y = 0; y <= h; y += pas) (y % (pas * 5) === 0 ? (gros += `M0 ${y}H${w}`) : (fin += `M0 ${y}H${w}`));
  return `<path d="${fin}" fill="none" stroke="#e8f2fa" stroke-width="1" opacity="0.09"/><path d="${gros}" fill="none" stroke="#e8f2fa" stroke-width="1.2" opacity="0.2"/>`;
};
const cartouche = modeleV2({
  id: identifiantV2(62, "cartouche-de-plan"), concept: "c-062-cartouche-de-plan",
  name: "Cartouche de plan", family: FAM,
  description: "Le pied dessiné comme le cartouche d'un plan d'architecte : huit cases à filets (projet, plan, échelle, date, adresse, contact, réseaux, pages) sur papier millimétré, avec une cote jaune. Bleu de plan, traits clairs, polices techniques.",
  tags: ["architecte", "cartouche", "plan", "papier millimétré", "bleu de plan", "technique", "monospace", "angles droits"],
  identity: equerre,
  racine: { desktop: { backgroundColor: "#0f3d63", gap: "0px" } },
  widgets: ["sitetitle", "html", "text", "link", "dyntext", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, mono = S.head, A = S.accent;
    // une case du cartouche : petit titre en capitales (12 px) + valeur ; fond plein (le filet vient de l'écart de 1 px de la grille)
    const case_ = (titre, contenu, o = {}) => {
      const c = k.col([k.T(`<p>${titre}</p>`, { fontFamily: mono, fontSize: "12px", fontWeight: "500", letterSpacing: "0.14em", textTransform: "uppercase", color: A, lineHeight: 1.3 }), ...contenu], { gap: "8px", backgroundColor: S.bg, paddingTop: "16px", paddingBottom: "18px", paddingLeft: "18px", paddingRight: "18px", minWidth: "0px", ...(o.desktop || {}) }, o.tablette, o.mobile);
      return c;
    };
    const valeur = (t, o = {}) => k.T(`<p>${t}</p>`, { fontFamily: mono, fontSize: o.taille || "15px", fontWeight: o.poids || "500", color: S.fg, lineHeight: 1.35, overflowWrap: "anywhere", letterSpacing: "0.02em" });
    const date = Moteur.finishNode(S, { type: "dyntext", props: { source: "today", before: "", after: "", fallback: "", tag: "p" }, ...sty({ fontFamily: mono, fontSize: "15px", fontWeight: "500", color: S.fg, letterSpacing: "0.02em" }) });
    const nom = nomSite(k, { taille: "fluid:20-28", poids: "700", police: mono, suivi: "0em", lh: 1.15, survol: A });
    const cb = (props) => Moteur.finishNode(S, k.W("bizcontact", { title: "", showName: false, showAddress: false, showPhone: false, showEmail: false, showIcons: false, layout: "stack", ...props }, { color: S.fg, fontSize: "15px", fontFamily: S.font }));
    const pages = k.row([["Accueil", "/"], ["Catalogue", "/catalogue"], ["Journal", "/blog"], ["Questions", "/faq"], ["Contact", "/contact"], ["Connexion", "/connexion"]].map(([l, u]) => lien(k, l, u, { taille: 15, poids: "500", h: "44px", extra: { fontFamily: S.font, textTransform: "uppercase", letterSpacing: "0.08em" }, survol: A })), { rowGap: "0px", columnGap: "28px", alignItems: "center" });
    const reseaux = k.col(RESEAUX.map(([l, u]) => lien(k, l, u, { taille: 15, h: "30px", survol: A, extra: { letterSpacing: "0.04em" } })), { gap: "0px", alignItems: "flex-start" });
    reseaux.styles.mobile = { gap: "0px" };
    const cases = [
      case_("Projet", [nom], { desktop: { gridColumnSpan: 2 }, tablette: { gridColumnSpan: 2 }, mobile: { gridColumnSpan: 2 } }),
      case_("Plan n°", [valeur("P-01 / 01", { taille: "20px", poids: "700" })]),
      case_("Échelle", [valeur("1 : 50", { taille: "20px", poids: "700" })]),
      case_("Adresse", [cb({ showAddress: true })]),
      case_("Contact", [cb({ showPhone: true, showEmail: true })]),
      case_("Réseaux", [reseaux]),
      case_("Date", [date]),
      case_("Pages", [pages], { desktop: { gridColumnSpan: 4 }, tablette: { gridColumnSpan: 2 }, mobile: { gridColumnSpan: 2 } }),
    ];
    const grilleCartouche = grille(cases, [4, 2, 2], { gap: "1px", backgroundColor: S.line, borderStyle: "solid", borderWidth: "1px", borderColor: S.line });
    // la cote : deux repères verticaux reliés par un trait jaune, avec la mesure au centre
    const repere = () => ({ type: "stack", children: [], ...sty({ width: "2px", height: "18px", minWidth: "2px", backgroundColor: A, flexShrink: 0 }) });
    const trajet = () => ({ type: "stack", children: [], ...sty({ height: "0px", flexGrow: 1, flexBasis: "0px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: A, opacity: 0.85 }) });
    const cote = k.row([repere(), trajet(), k.T("<p>Pied de page · échelle 1 : 50</p>", { fontFamily: mono, fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", color: A, whiteSpace: "nowrap" }), trajet(), repere()], { gap: "14px", alignItems: "center", width: "100%", flexWrap: "nowrap" });
    cote.styles.mobile = { gap: "10px" };
    const bas = G.ligne(k, [G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { gap: "10px 32px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const b = G.bande(k, [cote, grilleCartouche, mentions(k, S), bas], { colonne: true, gap: "24px", max: "1240px", padV: ["56px", "48px", "36px"], padB: ["32px", "28px", "28px"], padH: ["48px", "32px", "16px"], fond: S.bg, innerMobile: { rowGap: "20px" }, nom: "Cartouche de plan" });
    return [G.racine(k, [surFond(b, { bureau: svgDe(1440, 900, papierMillimetre(1440, 900, 24)), tablette: svgDe(820, 1300, papierMillimetre(820, 1300, 24)), mobile: svgDe(390, 1600, papierMillimetre(390, 1600, 24)) })])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-063 « Estimation photo » — agence de prestige fictive « Rive Gauche Immobilier ». Beige sable, brun foncé. UN grand « Estimer mon bien » en DM Serif Display à gauche (bouton carré brun, téléphone en avant) ;
// à droite, un grand panneau « fenêtre ouverte sur la lumière » dessiné en SVG (aplats sable, barreaux bruns, rayons de soleil) à la place de la photo du concept : le client peut y poser sa propre photo
// (Fond du panneau › Image) — le repli aplat/dessin évite tout visuel dépendant d'un fichier. Polices : DM Serif Display (propre, testée à 130 px) et Manrope.
// Le téléphone et l'adresse viennent des Données de l'entreprise (invisibles tant que non remplis) ; aucune carte professionnelle écrite ici (immatriculations de bizlegal).
// Mobile : le panneau passe sous le titre en bandeau de 200 px ; bouton pleine largeur.
const rive = identite({
  key: "c063", label: "Sable et brun foncé", humeur: "light",
  fond: "#eadfcb", texte: "#2a2118", discret: "#5f5040", accent: "#2a2118", surface: "#f6efe0",
  police: "font.manrope", titres: "font.dm-serif-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "1px", ligne: "#2a211866",
});
const fenetre = (w, h) => {
  // mur dégradé · baie cintrée à 3 vantaux et imposte · lumière projetée au sol (parallélogrammes clairs) · plinthe, lames de parquet · plante en pot
  const bois = "#2a2118", by = Math.round(h * 0.07), bh = Math.round(h * 0.56), bw = Math.min(Math.round(w * 0.66), Math.round(bh * 0.8)), bx = Math.round((w - bw) / 2), pw = Math.round(bw / 3), sol = Math.round(h * 0.7), ra = Math.round(bw / 2), ya = by + ra; // ya : naissance de l'arc
  const defs = `<defs><linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6ecd6"/><stop offset="1" stop-color="#e3d3b3"/></linearGradient><linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#f2e3c2"/></linearGradient><linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8c5a0"/><stop offset="1" stop-color="#c9b48a"/></linearGradient></defs>`;
  const mur = `<rect width="${w}" height="${sol}" fill="url(#m)"/><rect y="${sol}" width="${w}" height="${h - sol}" fill="url(#p)"/><rect y="${sol - 10}" width="${w}" height="10" fill="${bois}" opacity="0.12"/>`;
  const lames = `<g stroke="${bois}" stroke-width="1.5" opacity="0.12">${[0.18, 0.36, 0.54, 0.72, 0.9].map((f) => `<path d="M${Math.round(w * 0.5 + (f - 0.5) * w * 0.35)} ${sol}L${Math.round(f * w * 1.5 - w * 0.25)} ${h}"/>`).join("")}<path d="M0 ${Math.round(sol + (h - sol) * 0.4)}H${w}M0 ${Math.round(sol + (h - sol) * 0.75)}H${w}"/></g>`;
  const vitre = `<path d="M${bx} ${by + bh}V${ya}A${ra} ${ra} 0 0 1 ${bx + bw} ${ya}V${by + bh}Z" fill="url(#v)"/>`;
  const cadre = `<g fill="none" stroke="${bois}" stroke-width="9" stroke-linejoin="round"><path d="M${bx} ${by + bh}V${ya}A${ra} ${ra} 0 0 1 ${bx + bw} ${ya}V${by + bh}Z"/><path d="M${bx + pw} ${by + 20}V${by + bh}M${bx + 2 * pw} ${by + 20}V${by + bh}M${bx} ${Math.max(ya, by + Math.round(bh * 0.4))}H${bx + bw}" stroke-width="6"/></g>`;
  const dec = Math.round(Math.min(w * 0.2, (h - sol) * 0.9));
  const lumiere = `<g fill="#fffaf0" opacity="0.55">${[0, 1, 2].map((i) => `<path d="M${bx + i * pw + 14} ${sol}H${bx + (i + 1) * pw - 14}L${bx + (i + 1) * pw - 14 + dec} ${h}H${bx + i * pw + 14 + dec}Z"/>`).join("")}</g>`;
  const px = Math.round(w * 0.88), ph = Math.min(h - sol - 6, 290); // ph : hauteur de la plante
  const u = ph / 290; // la plante tient dans la hauteur du sol visible
  const plante = `<g transform="translate(${px} ${h}) scale(${u.toFixed(3)}) translate(${-px} ${-h})"><path d="M${px - 30} ${h}L${px - 22} ${h - 70}H${px + 22}L${px + 30} ${h}Z" fill="${bois}" opacity="0.8"/><g fill="#3f4a33" opacity="0.8"><path d="M${px} ${h - 70}C${px - 40} ${h - 120} ${px - 60} ${h - 170} ${px - 38} ${h - 230}C${px - 6} ${h - 190} ${px} ${h - 130} ${px} ${h - 70}Z"/><path d="M${px} ${h - 70}C${px + 30} ${h - 130} ${px + 62} ${h - 160} ${px + 52} ${h - 235}C${px + 10} ${h - 200} ${px - 4} ${h - 130} ${px} ${h - 70}Z"/><path d="M${px} ${h - 70}C${px - 8} ${h - 150} ${px + 4} ${h - 210} ${px + 8} ${h - 290}C${px + 24} ${h - 210} ${px + 16} ${h - 140} ${px} ${h - 70}Z"/></g></g>`;
  return `${defs}${mur}${lames}${vitre}${lumiere}${cadre}${plante}`;
};
const estimation = modeleV2({
  id: identifiantV2(63, "estimation-photo"), concept: "c-063-estimation-photo",
  name: "Estimation photo", family: FAM,
  description: "Un immense « Estimer mon bien » en serif DM Serif Display, un bouton carré brun et le téléphone en avant, face à un grand panneau lumineux (fenêtre, rayons de soleil) prêt à recevoir votre photo. Sable et brun foncé, ton prestige.",
  tags: ["prestige", "estimation", "appel à l'action", "serif", "sable", "brun", "panneau photo", "téléphone"],
  identity: rive,
  racine: { desktop: { backgroundColor: "#eadfcb", gap: "0px" } },
  widgets: ["sitetitle", "text", "button", "bizphone", "html", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const marque = nomSite(k, { taille: "26px", poids: "400", suivi: "0em", survol: null });
    const menu = k.row([["Nos biens", "/catalogue"], ["Journal", "/blog"], ["Questions", "/faq"], ["Contact", "/contact"]].map(([l, u]) => lien(k, l, u, { taille: 14, poids: "600", casse: "uppercase", suivi: "0.12em", h: "44px", survol: null, sansDecalage: true, extra: {} })), { rowGap: "0px", columnGap: "28px", alignItems: "center" });
    const barre = G.ligne(k, [marque, menu], { justifie: "space-between", aligne: "center", largeur: "100%", gap: "4px 32px" });
    const phrase = G.geant("<p>Estimer<br>mon bien</p>", { taille: [60, 150], tablette: { taille: [110, 150] }, mobile: { taille: [60, 100] }, lh: 0.95, suivi: "-0.015em", poids: "400", police: S.head, couleur: S.fg })(k, env);
    const sous = texte(k, "Un rendez-vous, une visite, une estimation argumentée de votre appartement ou de votre maison.", { taille: 18, largeur: "460px", lh: 1.6 });
    const bouton = G.fini(k, k.B("Demander une estimation →", "/contact", "solid", { fontFamily: S.font, fontSize: "17px", fontWeight: "700", minHeight: "64px", paddingLeft: "36px", paddingRight: "36px", alignSelf: "flex-start", transitionDuration: G.MOUVEMENT }), { hover: { backgroundColor: S.surface, color: S.fg, borderColor: S.fg }, focus: G.focus(S.fg) });
    bouton.styles.desktop = { ...bouton.styles.desktop, borderStyle: "solid", borderWidth: "2px", borderColor: S.fg };
    bouton.styles.mobile = { ...(bouton.styles.mobile || {}), width: "100%", alignSelf: "stretch" };
    const tel = telAvecTitre(k, S, "Ou appelez-nous", { taille: "32px", poids: "400" });
    const ligneAppel = G.ligne(k, [bouton, tel], { gap: "20px 40px", aligne: "center", largeur: "100%" });
    const gauche = G.colonne(k, [etiquette(k, "Estimation de votre bien", { couleur: S.fg }), phrase, sous, ligneAppel], { poids: 7, min: "320px", gap: "26px", tablette: { flexBasis: "100%" } });
    // panneau lumineux (le client peut le remplacer par sa photo : Fond du panneau › Image)
    const dessin = (w, h, masque) => ({ type: "html", props: { html: svgDe(w, h, fenetre(w, h)) }, hideOn: masque, ...sty({ width: "100%", lineHeight: 0.8, fontSize: "0px" }) });
    const panneau = { type: "container", children: [dessin(560, 680, ["tablet", "mobile"]), dessin(780, 300, ["desktop", "mobile"]), dessin(350, 230, ["desktop", "tablet"])],
      ...sty({ flexBasis: "0px", flexGrow: 5, minWidth: "300px", minHeight: "520px", backgroundColor: "#e2d2b3", overflow: "hidden", alignSelf: "stretch", display: "flex", flexDirection: "column", borderStyle: "solid", borderWidth: "1px", borderColor: S.line }, { flexBasis: "100%", minWidth: "0px", minHeight: "0px", alignSelf: "auto", order: 2 }, { flexBasis: "100%", minWidth: "0px", minHeight: "0px", alignSelf: "auto", order: 2 }) };
    const corps = G.ligne(k, [gauche, panneau], { gap: "40px 72px", aligne: "stretch", justifie: "space-between", largeur: "100%" });
    corps.styles.mobile = { ...(corps.styles.mobile || {}), rowGap: "32px" };
    const pied = G.ligne(k, [fleches(k, RESEAUX.slice(0, 3), { taille: 15 }), G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { gap: "6px 40px", aligne: "center", justifie: "space-between", largeur: "100%" });
    return [G.racine(k, [G.bande(k, [barre, trait(k, S.line), corps, trait(k, S.line), mentions(k, S), pied], { colonne: true, gap: "32px", max: "1240px", padV: ["56px", "48px", "36px"], padB: ["32px", "28px", "28px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "24px" }, nom: "Estimation photo" })])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-064 « Chantier rayures » — entreprise de BTP fictive « Ardoise Construction ». Une BANDE VERTICALE de rayures obliques orange et charbon (ruban de chantier) sépare le numéro de chantier en grand (à gauche, widget Téléphone)
// des colonnes de liens (à droite). Charbon #22252A, orange #FF6A00. Polices : Roboto Slab 800 (numéro, titres ; propre à 130 px) et Chivo (texte). Les rayures ne passent JAMAIS sous un texte (colonne propre de 72 px).
// Le numéro et l'adresse viennent des Données de l'entreprise : rien n'est inventé ; sans numéro, un bouton « Nous contacter » tient la place de l'urgence. Mobile : les rayures deviennent un ruban horizontal de 44 px, numéro d'abord.
const ardoise = identite({
  key: "c064", label: "Charbon et orange chantier", humeur: "dark",
  fond: "#22252a", texte: "#f5f5f2", discret: "#c2c6cc", accent: "#ff6a00", surface: "#2e3238",
  police: "font.chivo", titres: "font.roboto-slab",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "1px", ligne: "#f5f5f259",
});
// rayures obliques à 45° : bandes orange sur charbon, période = 2 × épaisseur (vertical : colonne de largeur w ; horizontal : ruban de hauteur h)
const rayures = (w, h, vertical) => {
  const o = "#ff6a00", c = "#22252a", e = vertical ? Math.round(w * 0.5) : Math.round(h * 0.75), pas = e * 2;
  let s = `<rect width="${w}" height="${h}" fill="${c}"/>`;
  if (vertical) { for (let y = -w; y < h + w; y += pas) s += `<polygon fill="${o}" points="0,${y + w} ${w},${y} ${w},${y + e} 0,${y + w + e}"/>`; }
  else { for (let x = -h; x < w + h; x += pas) s += `<polygon fill="${o}" points="${x},${h} ${x + h},0 ${x + h + e},0 ${x + e},${h}"/>`; }
  return s;
};
const chantier = modeleV2({
  id: identifiantV2(64, "chantier-rayures"), concept: "c-064-chantier-rayures",
  name: "Chantier rayures", family: FAM,
  description: "Un ruban de chantier vertical, rayures obliques orange et charbon, sépare le numéro en très grand (urgence, chantier) des colonnes de liens. Sur mobile, le ruban devient horizontal. Titres en Roboto Slab, ton franc de BTP.",
  tags: ["btp", "chantier", "rayures", "urgence", "numéro en grand", "orange", "charbon", "slab"],
  identity: ardoise,
  racine: { desktop: { backgroundColor: "#22252a", gap: "0px" } },
  widgets: ["sitetitle", "text", "bizphone", "button", "html", "link", "bizcontact", "social", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · à gauche : le numéro de chantier en très grand
    const tel = telAvecTitre(k, S, "Numéro de chantier", { taille: "fluid:34-66", couleur: S.accent, couleurTitre: S.accent, st: { letterSpacing: "-0.02em", whiteSpace: "nowrap" } });
    Moteur.mergePart(tel, "link", { styles: { desktop: { textDecoration: "none", color: S.accent } }, states: { hover: { textDecoration: "underline" }, focus: G.focus(S.fg) } });
    const titre = k.T("<p>Une urgence sur&nbsp;chantier&nbsp;?</p>", { fontFamily: S.head, fontWeight: "800", fontSize: "fluid:26-44", lineHeight: 1.1, color: S.fg, letterSpacing: "-0.01em" });
    const contact = G.fini(k, k.B("Nous contacter", "/contact", "solid", { fontFamily: S.font, fontSize: "16px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", minHeight: "56px", paddingLeft: "28px", paddingRight: "28px", alignSelf: "flex-start", transitionDuration: G.MOUVEMENT }), { hover: { backgroundColor: S.fg, color: S.bg }, focus: G.focus(S.fg) });
    contact.styles.mobile = { ...(contact.styles.mobile || {}), width: "100%", alignSelf: "stretch" };
    const gauche = G.colonne(k, [titre, tel, contact], { poids: 6, min: "300px", gap: "18px", soi: "center" });
    // 2 · le ruban : colonne verticale de 72 px qui s'étire sur toute la hauteur (rien ne passe dessus) ; ruban horizontal de 44 px sur mobile
    const ruban = { type: "container", children: [calque(svgDe(72, 1800, rayures(72, 1800, true)), ["tablet", "mobile"]), calque(svgDe(56, 1800, rayures(56, 1800, true)), ["desktop", "mobile"]), calque(svgDe(390, 40, rayures(390, 40, false)), ["desktop", "tablet"])],
      ...sty({ position: "relative", overflow: "hidden", width: "72px", minWidth: "72px", alignSelf: "stretch", flexShrink: 0, minHeight: "280px" }, { width: "56px", minWidth: "56px" }, { width: "100%", minWidth: "0px", height: "40px", minHeight: "40px", alignSelf: "stretch" }) };
    // 3 · à droite : colonnes de liens (volets sur mobile) + réseaux en carrés
    const carres = (kk) => reseauxIcones(kk, env, ["instagram", "facebook", "linkedin", "youtube"], { taille: 44, forme: "square", fond: S.alt, couleur: S.fg, contour: S.line });
    const adresse = (kk) => kk.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: false, showEmail: true, showIcons: false, layout: "stack" }, { color: S.fg, fontSize: "16px", fontFamily: S.font });
    const colonnes = Kit.accordeon([
      { title: "Nos métiers", w: 1, codes: [(kk) => liste(kk, [["Nos réalisations", "/catalogue"], ["Questions fréquentes", "/faq"], ["Actualités", "/blog"]], { taille: 17, gap: "2px", h: "44px", poids: "700" })] },
      { title: "Nous joindre", w: 1, codes: [adresse, carres] },
    ], { min: "190px" })(k, env);
    largeurs(colonnes, ["210px", "230px"]);
    colonnes.styles.desktop = { ...colonnes.styles.desktop, flexBasis: "0px", flexGrow: 6, minWidth: "300px", alignSelf: "center", width: "auto" };
    colonnes.styles.mobile = { ...(colonnes.styles.mobile || {}), alignSelf: "stretch", width: "100%", minWidth: "0px" };
    const haut = G.ligne(k, [gauche, ruban, colonnes], { gap: "40px 56px", aligne: "stretch", justifie: "space-between", largeur: "100%", pas_de_ligne: false });
    haut.styles.mobile = { ...(haut.styles.mobile || {}), flexDirection: "column", rowGap: "28px", alignItems: "stretch" };
    ruban.styles.mobile.order = -1;
    const marque = nomSite(k, { taille: "24px", poids: "800", casse: "uppercase", suivi: "0.04em", survol: S.accent });
    const bas = G.ligne(k, [marque, G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { gap: "12px 32px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const b = G.bande(k, [haut, trait(k, S.line), mentions(k, S), bas], { colonne: true, gap: "32px", max: "1240px", padV: ["72px", "56px", "28px"], padB: ["32px", "28px", "28px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "24px" }, nom: "Chantier rayures" });
    return [G.racine(k, [b])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-065 « Coliving arche » — coliving fictif « Les Voisins ». Doux et accueillant : tout le contenu (soleil, nom, mot d'accueil, pilules de liens, abonnement en champ-pilule, réseaux en disques) est dans une ARCHE de pierre sauge
// (coins hauts à 50 %, forme CSS pure) posée sur un fond pêche ; la ligne légale est dessous. Sauge #E5EFE2, pêche #FBE3D2, terracotta #B5532F. Polices : Lexend 700 (titres, propre) et Literata (texte).
// Le champ e-mail est honnête : sans formulaire publié, le message « non configuré » remplace le champ (jamais de faux champ). Mobile : l'arche prend toute la largeur ; le soleil est conservé.
const voisins = identite({
  key: "c065", label: "Sauge, pêche et terracotta", humeur: "light",
  fond: "#e5efe2", texte: "#2c3a2e", discret: "#4f6154", accent: "#b5532f", surface: "#fbe3d2",
  police: "font.literata", titres: "font.lexend",
  rayon: "24px", rayonBouton: "999px", ombre: "none", poids: "700", bordure: "0px", ligne: "#2c3a2e4d",
});
const coliving = modeleV2({
  id: identifiantV2(65, "coliving-arche"), concept: "c-065-coliving-arche",
  name: "Coliving arche", family: FAM,
  description: "Tout le contenu est logé dans une arche de pierre sauge, posée sur un fond pêche : soleil en demi-cercle, nom, mot d'accueil, pilules de liens, champ d'abonnement en pilule, réseaux en disques. Doux, rond, accueillant.",
  tags: ["coliving", "arche", "doux", "sauge", "pêche", "pilules", "arrondi", "newsletter"],
  identity: voisins,
  racine: { desktop: { backgroundColor: "#fbe3d2", gap: "0px" } },
  widgets: ["sitetitle", "text", "link", "emailsubscribe", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, peche = S.alt, sauge = S.bg, terre = S.accent;
    // soleil : demi-disque terracotta (forme CSS pure) au sommet de l'arche, avec un second demi-disque pêche à l'intérieur
    const soleil = { type: "container", children: [{ type: "container", children: [], ...sty({ width: "44px", height: "22px", backgroundColor: peche, borderTopLeftRadius: "999px", borderTopRightRadius: "999px", borderBottomLeftRadius: "0px", borderBottomRightRadius: "0px" }) }],
      ...sty({ width: "88px", height: "44px", backgroundColor: terre, borderTopLeftRadius: "999px", borderTopRightRadius: "999px", borderBottomLeftRadius: "0px", borderBottomRightRadius: "0px", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", flexShrink: 0 }) };
    const nom = nomSite(k, { taille: "fluid:34-56", poids: "700", suivi: "-0.02em", lh: 1.05, align: "center", survol: terre });
    const mot = texte(k, "Un chez-soi, et la porte ouverte sur les autres.", { taille: 18, align: "center", largeur: "440px", extra: { marginLeft: "auto", marginRight: "auto" } });
    const pilules = G.pilules([["Nos logements", "/catalogue"], ["Le journal", "/blog"], ["Questions", "/faq"], ["Nous contacter", "/contact"]], { couleur: S.fg, contour: S.line, taille: 15, poids: "600", survolFond: terre, survolCouleur: "#ffffff", gap: "10px" })(k, env, true);
    // abonnement en champ-pilule (bouton sous le champ : limite connue du widget)
    const abo = G.abonnement({ titre: "La lettre du voisinage", intro: "Les nouvelles de la maison, de temps en temps.", bouton: "S'abonner", largeur: "420px", accent: terre, texte: S.fg, soulignement: "0px", rayonChamp: "999px", fondChamp: "#ffffff", rembChamp: "22px", rayonBouton: "999px", tailleChamp: "17px", styleTitre: { fontFamily: S.font, color: S.mute, fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "6px", textAlign: "center" }, survolBouton: S.fg, survolTexte: sauge })(k, env, true);
    abo.parts.input.styles.desktop = { ...abo.parts.input.styles.desktop, borderWidth: "1.5px", borderColor: S.line, borderBottomWidth: "1.5px" };
    abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, textAlign: "center" };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, alignSelf: "center", marginLeft: "auto", marginRight: "auto" }; // bouton centré sous le champ (état « formulaire publié »)
    abo.parts.missing.styles.desktop = { ...abo.parts.missing.styles.desktop, textAlign: "center", color: S.fg };
    const ronds = reseauxIcones(k, env, ["instagram", "facebook", "linkedin", "youtube"], { taille: 44, forme: "circle", fond: peche, couleur: S.fg, survolFond: terre, survolCouleur: "#ffffff" });
    ronds.styles.desktop = { ...(ronds.styles.desktop || {}), justifyContent: "center" };
    const arche = { type: "container", children: [soleil, nom, mot, pilules, abo, ronds],
      ...sty({ backgroundColor: sauge, borderTopLeftRadius: "999px", borderTopRightRadius: "999px", borderBottomLeftRadius: "0px", borderBottomRightRadius: "0px", width: "100%", maxWidth: "860px", marginLeft: "auto", marginRight: "auto", paddingTop: "88px", paddingBottom: "64px", paddingLeft: "40px", paddingRight: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "26px", textAlign: "center" },
        { paddingTop: "72px" }, { paddingTop: "64px", paddingBottom: "48px", paddingLeft: "20px", paddingRight: "20px", gap: "22px" }) };
    const bas = G.ligne(k, [mentions(k, S, { couleur: S.fg }), G.ligneLegale({ taille: 12, sansCookies: true, couleur: S.fg })(k, env)], { gap: "10px 32px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    bas.styles.mobile = { ...(bas.styles.mobile || {}), flexDirection: "column", alignItems: "flex-start" };
    const b = G.bande(k, [arche, bas], { colonne: true, gap: "32px", aligne: "stretch", max: "1240px", padV: ["72px", "56px", "36px"], padB: ["32px", "28px", "28px"], padH: ["32px", "24px", "12px"], fond: peche, innerMobile: { rowGap: "16px" }, nom: "Coliving arche" });
    return [G.racine(k, [b])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-066 « Jardin botanique » — paysagiste fictif « Verdelot ». Vert profond #1F3220, ocre #E0B84F ; un MOTIF DE FOUGÈRES en SVG (feuilles à 7 % d'opacité, aucune image) couvre le fond ; le nom en Spectral, trois colonnes
// (réalisations en cartes-liens aux coins asymétriques, derniers conseils = articles récents du blog, contact et horaires). Polices : Spectral 500 (nom, propre à 130 px) et Jost (texte).
// Les « conseils » sont les VRAIS derniers articles du blog (message explicite quand il n'y en a pas) ; adresse et horaires viennent des Données de l'entreprise. Mobile : colonnes en volets repliables de 48 px, motif conservé.
const verdelot = identite({
  key: "c066", label: "Vert profond et ocre", humeur: "dark",
  fond: "#1f3220", texte: "#eef0df", discret: "#bcc7a8", accent: "#e0b84f", surface: "#2a422b",
  police: "font.jost", titres: "font.spectral",
  rayon: "24px", rayonBouton: "999px", ombre: "none", poids: "500", bordure: "0px", ligne: "#eef0df4d",
});
// une fronde de fougère (tige + folioles), UN SEUL chemin calculé (coordonnées absolues, 1 décimale) ; posée plusieurs fois à des positions, tailles et angles variés
const FRONDE = (() => {
  const r = (n) => Math.round(n * 10) / 10;
  let d = "M0 0Q14 -110 0 -230";
  for (let i = 0; i < 12; i++) {
    const y = -20 - i * 17, x = 5 * Math.sin(i / 3), L = 80 * (1 - i / 16);
    for (const a of [-62, -118]) {
      const t = (a * Math.PI) / 180, ex = x + L * Math.cos(t), ey = y + L * Math.sin(t), nx = -Math.sin(t) * 9, ny = Math.cos(t) * 9, mx = x + (L / 2) * Math.cos(t), my = y + (L / 2) * Math.sin(t);
      d += `M${r(x)} ${r(y)}Q${r(mx + nx)} ${r(my + ny)} ${r(ex)} ${r(ey)}Q${r(mx - nx)} ${r(my - ny)} ${r(x)} ${r(y)}`;
    }
  }
  return `<path d="${d}"/>`;
})();
const fougeres = (liste) => `<g fill="#bcc7a8" opacity="0.075">${liste.map(([x, y, rot, sc]) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})">${FRONDE}</g>`).join("")}</g>`;
const jardin = modeleV2({
  id: identifiantV2(66, "jardin-botanique"), concept: "c-066-jardin-botanique",
  name: "Jardin botanique", family: FAM,
  description: "Un motif de fougères en filigrane couvre un fond vert profond ; le nom en grand serif, puis trois colonnes : réalisations en cartes aux coins asymétriques, derniers conseils du blog, contact et horaires. Vert, ocre, ton paysagiste.",
  tags: ["paysagiste", "jardin", "botanique", "fougères", "vert", "ocre", "cartes", "serif"],
  identity: verdelot,
  racine: { desktop: { backgroundColor: "#1f3220", gap: "0px" } },
  widgets: ["sitetitle", "html", "text", "link", "querylist", "bizcontact", "bizhours", "social", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomSite(k, { taille: "fluid:44-92", poids: "500", suivi: "-0.015em", lh: 1.0, align: "center", survol: S.accent });
    const sous = texte(k, "Jardins, terrasses, toitures végétalisées : de la première esquisse au dernier arrosage.", { taille: 18, align: "center", largeur: "540px", extra: { marginLeft: "auto", marginRight: "auto" } });
    const tete = k.col([etiquette(k, "Paysagiste", { couleur: S.accent, align: "center", suivi: "0.24em" }), nom, sous], { gap: "14px", alignItems: "center", width: "100%" });
    // colonne 1 : cartes-liens aux coins asymétriques (page réelle de destination)
    const carteLien = (titre, url) => {
      const l = lien(k, `${titre}  →`, url, { taille: 17, poids: "600", h: "56px", couleur: S.fg, survol: S.accent, sansDecalage: true, extra: { width: "100%", justifyContent: "space-between", backgroundColor: S.alt, paddingLeft: "20px", paddingRight: "20px", borderTopLeftRadius: "28px", borderBottomRightRadius: "28px", borderTopRightRadius: "6px", borderBottomLeftRadius: "6px", borderStyle: "solid", borderWidth: "1px", borderColor: "#eef0df26", fontFamily: S.head, fontSize: "19px" } });
      l.states = { ...l.states, hover: { color: S.accent, borderColor: S.accent, transform: { x: 4 } }, focus: G.focus(S.accent) };
      return l;
    };
    const realisations = (kk) => kk.col([carteLien("Nos réalisations", "/catalogue"), carteLien("Demander un devis", "/contact"), carteLien("Questions fréquentes", "/faq")], { gap: "10px", width: "100%", alignItems: "stretch" });
    // colonne 2 : derniers conseils = articles du blog
    const conseils = (kk) => {
      const n = kk.W("querylist", { title: "", source: "posts", mode: "recent", count: 4, layout: "list", showImage: false, showDate: true, showMeta: false, showExcerpt: false, showCount: false, empty: "Les conseils du jardinier apparaîtront ici." }, { width: "100%", color: S.mute, fontFamily: S.font, fontSize: "14px" });
      n.parts = {
        item: { styles: { desktop: { borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: S.line, paddingTop: "10px", paddingBottom: "10px" } } },
        link: { styles: { desktop: { fontFamily: S.head, fontSize: "18px", fontWeight: "500", color: S.fg, lineHeight: 1.3, textDecoration: "none" }, mobile: { paddingTop: "10px", paddingBottom: "10px" } }, states: { hover: { color: S.accent, textDecoration: "underline" }, focus: G.focus(S.accent) } },
        date: { styles: { desktop: { fontFamily: S.font, fontSize: "12px", color: S.mute, textTransform: "uppercase", letterSpacing: "0.12em" } } },
      };
      return n;
    };
    // colonne 3 : contact, horaires, réseaux en disques
    const contact = (kk) => kk.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: S.fg, fontSize: "16px", fontFamily: S.font });
    const horaires = (kk) => kk.W("bizhours", { title: "", showOpenNow: true, groupDays: true, showExceptions: false, showNote: true, closedLabel: "Fermé" }, { color: S.mute, fontSize: "14px", fontFamily: S.font });
    const ronds = (kk) => reseauxIcones(kk, env, ["instagram", "facebook", "youtube"], { taille: 44, forme: "circle", fond: S.alt, couleur: S.fg, contour: "#eef0df40" });
    const colonnes = Kit.accordeon([
      { title: "Réalisations", w: 1, codes: [realisations] },
      { title: "Conseils du jardinier", w: 1, codes: [conseils] },
      { title: "Contact", w: 1, codes: [contact, horaires, ronds] },
    ], { min: "250px" })(k, env);
    largeurs(colonnes, ["340px", "340px", "300px"]);
    colonnes.styles.desktop = { ...colonnes.styles.desktop, columnGap: "56px", rowGap: "32px", gap: undefined };
    const bas = G.ligne(k, [mentions(k, S), G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { gap: "10px 32px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    bas.styles.mobile = { ...(bas.styles.mobile || {}), flexDirection: "column", alignItems: "flex-start" };
    const b = G.bande(k, [tete, colonnes, trait(k, S.line), bas], { colonne: true, gap: "56px", max: "1240px", padV: ["96px", "72px", "56px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "32px" }, nom: "Jardin botanique" });
    const gd = [[90, 700, -10, 1.6], [330, 980, 14, 1.8], [600, 760, -24, 1.5], [880, 1020, 8, 1.9], [1160, 720, -16, 1.6], [1380, 1010, 22, 1.7], [200, 380, 30, 1.0], [500, 340, -30, 1.1], [800, 300, 24, 1.0], [1080, 340, -28, 1.1], [1330, 390, 34, 1.0], [700, 1090, -6, 1.4]];
    const gt = [[70, 700, -12, 1.5], [360, 1000, 16, 1.7], [700, 760, -22, 1.5], [760, 1400, 10, 1.8], [160, 1300, -18, 1.6], [420, 380, 30, 1.0], [740, 360, -26, 1.0], [100, 330, 24, 1.0], [520, 1450, -8, 1.3]];
    const pt = [[40, 640, -12, 1.2], [330, 900, 16, 1.4], [120, 1180, -10, 1.3], [360, 420, 30, 0.9], [60, 330, 24, 0.9], [220, 1290, 12, 1.0], [370, 1200, -22, 1.1]];
    return [G.racine(k, [surFond(b, { bureau: svgDe(1440, 1100, fougeres(gd)), tablette: svgDe(820, 1500, fougeres(gt)), mobile: svgDe(390, 1300, fougeres(pt)) })])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Immobilier et architecture", target: 7, built: true,
  description: "Agences, promoteurs et cabinets d’architecture : programmes, estimation, cartouches de plan.",
  models: [agentLocal, programmes, cartouche, estimation, chantier, coliving, jardin],
};
