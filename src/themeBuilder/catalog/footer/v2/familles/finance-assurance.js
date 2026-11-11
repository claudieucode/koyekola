// Famille v2 « Finance et assurance » — 6 modèles (concepts c-009 à c-014 de docs/footer-v2/CONCEPTS_100.md). Voir docs/footer-v2/GUIDE_CONSTRUIRE_UN_MODELE_V2.md.
// Chaque modèle est INDÉPENDANT du site (mode « solo ») : ses couleurs (hexadécimal), ses polices (bibliothèque auto-hébergée) et ses formes viennent de son identité (identite()).
// Toutes les marques (Nocto, Clairmont, Delorme Patrimoine, Ledgr, La Rive, Chiffre & Lettre) sont FICTIVES. RÈGLE DE LA FAMILLE : aucun numéro officiel (agrément, immatriculation, garantie, taux, médiateur…) n'est écrit :
// les blocs de mentions réglementaires sont des textes d'EXEMPLE marqués « exemple » + le widget « Données de l'entreprise » (informations légales saisies par le client). Aucun conseil financier ou juridique, aucun compte à rebours.
// Polices testées à 110 px (accents, « a », « e », « n », « ? » ; capture finass-ft1.png) : Red Hat Display 800/900, Nunito 800, Outfit 600/800, Bodoni Moda 600, Zilla Slab 700, Fraunces 700, JetBrains Mono, Homemade Apple (signature, décorative) : PROPRES.
const { sty, compact } = require("../../../kit");
const { modeleV2, identifiantV2, identite, Moteur } = require("../kit-v2");

const FAM = "finance-assurance";

// ── Aides LOCALES à la famille (le kit v2 ne les modifie pas) ───────────────────────────────────────────────────────────────────────────────
const tx = (k, html, st = {}, t, m) => k.T(/^\s*</.test(html) ? html : `<p>${html}</p>`, st, t, m);
// petit libellé en capitales espacées
const cap = (k, txt, o = {}) => tx(k, txt, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "600", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, textAlign: o.align }));
// lien simple fini par le moteur (états, 44 px sur mobile) puis états propres ; o.survol = états de survol complets, o.sansDecalage
const lien = (k, G, label, url, o = {}) => {
  const S = k.S;
  const n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: "none", lineHeight: o.lh || 1.4, letterSpacing: o.suivi, textTransform: o.casse, paddingTop: o.pv, paddingBottom: o.pv, display: "inline-flex", alignItems: "center", transitionDuration: G.MOUVEMENT, ...(o.extra || {}) }));
  return G.fini(k, n, { hover: o.survol || { color: o.survolCouleur || S.accent, textDecoration: "underline", ...(o.sansDecalage ? {} : { transform: { x: 4 } }) }, focus: G.focus(o.focus || S.accent) });
};
const filetH = (k, couleur, e = "1px", st = {}) => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: e, marginTop: "0px", marginBottom: "0px", ...st });
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
// réseaux en icônes rondes (ou carrées) aux couleurs du modèle
function reseauxIcones(k, G, env, liste, o = {}) {
  const S = k.S, n = Moteur.item(k, `socials:${liste.join("+")}`, env);
  n.props.size = String(o.taille || 44); n.props.shape = o.forme || "circle";
  Moteur.mergePart(n, "link", { styles: { desktop: compact({ color: o.couleur || S.fg, backgroundColor: o.fond, borderStyle: o.contour ? "solid" : undefined, borderWidth: o.contour ? "1px" : undefined, borderColor: o.contour, transitionDuration: G.MOUVEMENT }) },
    states: { hover: { backgroundColor: o.survolFond || S.accent, color: o.survolCouleur || S.onAccent, borderColor: o.survolFond || S.accent, transform: { y: -2 } }, focus: G.focus(o.focus || S.accent) } });
  return n;
}
// Décors SVG (widget HTML) posés SOUS le contenu, sur toute la surface de la bande
const svgDe = (w, h, corps, o = {}) => `<span aria-hidden="true"><svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="${o.ratio || "xMidYMid slice"}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${corps}</svg></span>`;
const calque = (html, o = {}) => ({ type: "html", props: { html }, ...(o.masque ? { hideOn: o.masque } : {}), ...sty(compact({ position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%", zIndex: 0, overflow: "hidden", lineHeight: 0.8, fontSize: "0px", ...(o.st || {}) })) });
function surFond(b, calques) {
  b.styles.desktop = { ...b.styles.desktop, position: "relative", overflow: "hidden" };
  const inner = b.children[0];
  inner.styles.desktop = { ...inner.styles.desktop, position: "relative", zIndex: 1 };
  b.children.unshift(...calques);
  return b;
}
// titre d'un widget (contact, horaires, légal) au style du modèle
const titreWidget = (w, st) => { Moteur.mergePart(w, "title", { styles: { desktop: st } }); return w; };
// panneau de volets : colonnes de liens (titres 18 px gras imposés par le moteur) qui se replient en accordéon sur mobile
function volets(k, G, env, panneaux, o = {}) {
  const S = k.S;
  const L = (liste) => liste.map(([l, u]) => () => lien(k, G, l, u, { taille: o.taille || 15, pv: "5px", lh: 1.35, ...(o.lien || {}) }));
  const v = Moteur.accordionNode(k, env, false, panneaux.map(([title, liste, w]) => ({ title, w: w || 1, codes: typeof liste === "function" ? [liste] : L(liste) })), {}, { min: o.min || "200px" });
  for (const c of v.children) { Object.assign(c.styles.desktop, { color: S.fg, fontFamily: o.policeTitre || S.head, gap: "4px", ...(o.titre || {}) }); if (o.mobileVolet) c.styles.mobile = { ...(c.styles.mobile || {}), ...o.mobileVolet }; }
  Object.assign(v.styles.desktop, { columnGap: o.colGap || "40px", rowGap: o.rowGap || "32px", alignItems: "flex-start", width: "100%", maxWidth: "100%", marginLeft: "0px", marginRight: "0px" });
  return v;
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-009 « Banque Nocturne » — banque en ligne fictive « Nocto ». Le NOM « nocto » en minuscules corail, monumental (34 vw), flotte dans une lueur douce au bas du pied ; au-dessus, quatre colonnes de liens (volets sur mobile)
// et un bloc de mentions réglementaires D'EXEMPLE (le client saisit le vrai agrément : aucun numéro n'est écrit). Bleu nuit #0A1128, corail #FF6B57, Red Hat Display 900 (nom) + DM Sans. Pas de sélecteur de langue :
// le widget demandé par le concept n'existe pas, il est omis (voir le rapport).
const noctoId = identite({
  key: "c009", label: "Bleu nuit et corail", humeur: "dark",
  fond: "#0a1128", texte: "#f2f4fa", discret: "#aeb6d0", accent: "#ff6b57", surface: "#141e40",
  police: "font.dm-sans", titres: "font.red-hat-display", rayon: "16px", rayonBouton: "999px", ombre: "none", poids: "800", bordure: "1px", ligne: "#f2f4fa26",
});
const nocto = modeleV2({
  id: identifiantV2(9, "banque-nocturne"), concept: "c-009-banque-nocturne", name: "Banque nocturne", family: FAM,
  description: "Un nom monumental en minuscules corail flotte dans une lueur douce, sur bleu nuit. Au-dessus : quatre colonnes de liens et un bloc de mentions réglementaires d'exemple, à remplir par le client. Aucun faux agrément.",
  tags: ["banque", "nom monumental", "lueur", "bleu nuit", "corail", "mentions réglementaires", "accordéon"],
  identity: noctoId,
  racine: racineDe("#0a1128"),
  widgets: ["text", "link", "bizlegal", "copyright", "social", "html", "heading", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · les quatre colonnes de liens (pages réelles de la plateforme) ; sur mobile : volets de 48 px
    const colonnes = volets(k, G, env, [
      ["Comptes", [["Ouvrir un compte", "/inscription"], ["Se connecter", "/connexion"], ["Mon espace", "/boutique/compte"]]],
      ["Cartes", [["Nos offres", "/catalogue"], ["Boutique", "/boutique"], ["Mes favoris", "/boutique/souhaits"]]],
      ["Aide", [["Questions fréquentes", "/faq"], ["Nous contacter", "/contact"], ["Gestion des cookies", "/cookies"]]],
      ["Société", [["Accueil", "/"], ["Actualités", "/blog"], ["Nous écrire", "/contact"]]],
    ], { min: "240px", colGap: "32px", titre: { fontSize: "18px", fontWeight: "800" } });
    // 2 · le bloc de mentions réglementaires : texte d'EXEMPLE + informations légales saisies dans les Données de l'entreprise
    const legal = k.W("bizlegal", { title: "", showName: true, showForm: true, showRegistrations: true, showPublisher: false, showHost: false, showPages: false, layout: "stack", hintMissing: true }, { color: S.fg, fontSize: "13px", fontFamily: S.font });
    const mentions = k.card([
      cap(k, "Mentions réglementaires", { couleur: S.accent }),
      tx(k, "Exemple à remplacer : Nocto est une marque fictive. Indiquez ici votre statut, votre autorité de contrôle et la garantie des dépôts qui s'appliquent à votre établissement.", { fontSize: "14px", lineHeight: 1.6, color: S.mute, maxWidth: "620px" }),
      legal,
    ], { backgroundColor: S.alt, borderRadius: "16px", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "28px", paddingRight: "28px", gap: "10px", boxShadow: undefined, borderStyle: "solid", borderWidth: "1px", borderColor: S.line, width: "100%" });
    const haut = G.bande(k, [colonnes, mentions], { colonne: true, gap: "48px", max: "1280px", padV: ["104px", "80px", "64px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Liens et mentions" });
    // 3 · le nom monumental dans sa lueur : la lueur s'éteint avant les bords de la bande
    const nom = { type: "heading", props: { text: "nocto", level: "2", tag: "p" }, styles: { desktop: { fontSize: "34vw", lineHeight: 0.92, letterSpacing: "-0.045em", fontFamily: S.head, fontWeight: "900", color: S.accent, textAlign: "center", width: "100%", marginTop: "0px", marginBottom: "0px", whiteSpace: "nowrap" } } };
    // le moteur de nettoyage du SVG retire les dégradés (<radialGradient>) : la lueur est faite de 16 ellipses concentriques de couleurs pleines (bleu nuit vers un corail très sombre), sans bande visible
    const lueur = Array.from({ length: 16 }, (_, i) => { const t = 1 - i / 16, m = Math.pow(1 - t, 2), c = [10, 17, 40].map((v, x) => Math.round(v + ([88, 46, 58][x] - v) * m)); return `<ellipse cx="720" cy="300" rx="${Math.round(720 * t)}" ry="${Math.round(300 * t)}" fill="#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}"/>`; }).join("");
    const contact = lien(k, G, "Nous contacter ↗", "/contact", { taille: 15, poids: "700", couleur: S.accent, survolCouleur: S.fg });
    const reseaux = reseauxIcones(k, G, env, ["instagram", "linkedin", "youtube"], { fond: S.alt, couleur: S.fg, contour: S.line });
    const appel = G.ligne(k, [contact, reseaux], { gap: "14px 32px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const bas = k.col([appel, G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { gap: "14px", width: "100%" });
    const nomBande = G.bande(k, [nom, filetH(k, S.line), bas], { colonne: true, gap: "24px", max: "100%", padV: ["24px", "20px", "16px"], padB: ["36px", "32px", "28px"], padH: ["32px", "24px", "16px"], fond: S.bg, innerMobile: { rowGap: "20px" }, nom: "Nom et mentions" });
    surFond(nomBande, [calque(svgDe(1440, 600, lueur, { ratio: "none" }), { st: { height: "78%" } })]);
    return [G.racine(k, [haut, nomBande])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-010 « Assurance Claire » — assureur fictif « Clairmont ». Fond bleu très pâle, teal ; trois colonnes (produits, sinistres, à propos) ; une PASTILLE ronde « En cas de sinistre » de 154 px, inclinée de −6°, cernée d'un pointillé,
// se détache en haut à droite comme un autocollant (pleine largeur, droite, en tête sur mobile). Le numéro d'urgence vient du widget Téléphone (Données de l'entreprise) : rien d'inventé. Outfit 800 + Nunito Sans.
const clairmontId = identite({
  key: "c010", label: "Bleu pâle et teal", humeur: "light",
  fond: "#f1f7fa", texte: "#10303f", discret: "#3f5f6e", accent: "#00756a", surface: "#ddebf1",
  police: "font.nunito-sans", titres: "font.outfit", rayon: "20px", rayonBouton: "999px", ombre: "none", poids: "800", bordure: "0px", ligne: "#10303f33",
});
const clairmont = modeleV2({
  id: identifiantV2(10, "assurance-claire"), concept: "c-010-assurance-claire", name: "Assurance claire", family: FAM,
  description: "Fond bleu très pâle, liens en pilules et trois colonnes claires ; une pastille ronde « En cas de sinistre » inclinée, cernée de pointillés, se détache en haut à droite comme un autocollant. Teal rassurant, numéro lu dans les données.",
  tags: ["assurance", "pastille", "autocollant", "sinistre", "bleu pâle", "teal", "pilules", "numéro d'urgence"],
  identity: clairmontId,
  racine: racineDe("#ddebf1"),
  widgets: ["sitelogo", "text", "link", "bizphone", "bizlegal", "copyright"],
  compose(k, env, G) {
    const S = k.S, BLANC = "#ffffff";
    // 1 · la pastille : disque teal incliné, pointillé blanc, libellé + numéro (widget Téléphone) + lien « Déclarer en ligne »
    const pastille = (mobile) => {
      const tel = k.W("bizphone", { which: "1", prefix: "", showLabel: false, showIcon: false }, { color: BLANC, fontSize: "16px", fontFamily: S.head, fontWeight: "800", textAlign: "center", whiteSpace: "nowrap" });
      Moteur.finishNode(S, tel);
      Moteur.mergePart(tel, "link", { styles: { desktop: { color: BLANC, fontFamily: S.head, fontWeight: "800", fontSize: "16px", textDecoration: "none", justifyContent: "center" } }, states: { hover: { textDecoration: "underline" }, focus: G.focus(BLANC) } });
      const label = tx(k, "En cas<br>de sinistre", { fontFamily: S.head, fontWeight: "800", fontSize: "16px", lineHeight: 1.15, textTransform: "uppercase", letterSpacing: "0.05em", color: BLANC, textAlign: "center" });
      const declarer = lien(k, G, "Déclarer en ligne", "/contact", { taille: 13, poids: "700", couleur: BLANC, survolCouleur: BLANC, sansDecalage: true, extra: { textDecoration: "underline", justifyContent: "center", alignSelf: "center", width: "100%" }, focus: BLANC });
      const anneau = k.col([label, tel, declarer], { width: "164px", height: "164px", borderRadius: "999px", borderStyle: "dashed", borderWidth: "2px", borderColor: "#ffffffb3", alignItems: "center", justifyContent: "center", gap: "12px" },
        undefined, { width: "100%", height: "auto", borderRadius: "24px", paddingTop: "18px", paddingBottom: "16px", gap: "12px" });
      const out = k.col([anneau], { width: "186px", height: "186px", borderRadius: "999px", backgroundColor: S.accent, alignItems: "center", justifyContent: "center", ...(mobile ? {} : { transform: { rotate: -6 } }), flexShrink: 0 },
        undefined, { width: "100%", height: "auto", borderRadius: "32px", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "10px", paddingRight: "10px" });
      return { ...out, hideOn: mobile ? ["desktop", "tablet"] : ["mobile"] };
    };
    // 2 · la tête : logo, accroche, réseaux en pastilles-texte ; la pastille à droite (ordinateur, tablette) ou en tête (mobile)
    const logo = Moteur.item(k, "logo:48", env);
    const accroche = tx(k, "Une assurance qui se lit comme elle se vit : simplement.", { fontFamily: S.head, fontWeight: "700", fontSize: "fluid:24-36", lineHeight: 1.15, letterSpacing: "-0.01em", color: S.fg, maxWidth: "520px" });
    const reseaux = G.pilules([["Instagram", "https://www.instagram.com/"], ["LinkedIn", "https://www.linkedin.com/"], ["YouTube", "https://www.youtube.com/"]], { couleur: S.fg, contour: "#10303f55", survolFond: S.accent, survolCouleur: S.onAccent, gap: "8px", taille: 14 })(k, env);
    const marque = k.col([logo, accroche, reseaux], { gap: "20px", flexBasis: "0px", flexGrow: 1, minWidth: "280px", alignItems: "flex-start" });
    const tete = G.bande(k, [pastille(true), marque, pastille(false)], { aligne: "flex-start", gap: "28px 56px", max: "1280px", padV: ["88px", "64px", "48px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "24px", flexDirection: "column", alignItems: "stretch" }, nom: "Marque et pastille" });
    // 3 · trois colonnes titrées (liens en pilules au survol) — volets sur mobile
    const pilL = { pv: "7px", extra: { paddingLeft: "14px", paddingRight: "14px", marginLeft: "-14px", borderRadius: "999px", minHeight: "44px" }, survol: { backgroundColor: S.alt, color: S.fg, textDecoration: "none", transform: { x: 4 } } };
    const colonnes = volets(k, G, env, [
      ["Produits", [["Nos offres", "/catalogue"], ["Boutique en ligne", "/boutique"], ["Mes favoris", "/boutique/souhaits"]]],
      ["Sinistres", [["Déclarer un sinistre", "/contact"], ["Suivre mon dossier", "/connexion"], ["Questions fréquentes", "/faq"]]],
      ["À propos", [["Accueil", "/"], ["Actualités", "/blog"], ["Nous contacter", "/contact"]]],
    ], { min: "230px", colGap: "40px", taille: 16, lien: pilL, titre: { fontSize: "18px", fontWeight: "800", paddingTop: "14px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderColor: S.accent }, mobileVolet: { borderTopWidth: "0px", paddingTop: "0px" } });
    const milieu = G.bande(k, [colonnes], { colonne: true, max: "1280px", padV: ["24px", "24px", "8px"], padB: ["72px", "56px", "40px"], padH: ["48px", "32px", "20px"], fond: S.bg, nom: "Colonnes" });
    // 4 · mentions de l'assureur : bande surface, texte d'EXEMPLE + Données de l'entreprise + ligne légale
    const legal = k.W("bizlegal", { title: "", showName: true, showForm: true, showRegistrations: true, showPublisher: false, showHost: false, showPages: false, layout: "stack", hintMissing: true }, { color: S.fg, fontSize: "13px", fontFamily: S.font });
    const mention = k.col([cap(k, "Mentions de l'assureur"), tx(k, "Exemple à remplacer : Clairmont est une marque fictive. Indiquez ici votre raison sociale, votre immatriculation et l'autorité qui contrôle votre activité d'assurance.", { fontSize: "13px", lineHeight: 1.6, color: S.mute, maxWidth: "640px" }), legal], { gap: "8px", flexBasis: "0px", flexGrow: 1, minWidth: "280px" });
    const bas = G.bande(k, [mention, G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { colonne: true, gap: "24px", max: "1280px", padV: ["40px", "36px", "32px"], padB: ["24px", "24px", "20px"], padH: ["48px", "32px", "20px"], fond: S.alt, nom: "Mentions", innerMobile: { rowGap: "20px" } });
    return [G.racine(k, [tete, milieu, bas])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-011 « Gestion Privée » — cabinet fictif « Delorme Patrimoine ». Beige sable, encre brune, AUCUN bouton. Une SIGNATURE en script (Homemade Apple, décorative : le nom est aussi écrit en toutes lettres en dessous) remplace le logo
// au-dessus d'un monogramme à filet ; pile centrée : trois liens, une ligne d'adresse, mentions. La confiance par l'écrit. Bodoni Moda + Jost (+ script pour la signature seule). Avertissement générique d'EXEMPLE ; aucun conseil.
const delormeId = identite({
  key: "c011", label: "Sable et encre brune", humeur: "light",
  fond: "#efe7d8", texte: "#24201a", discret: "#665c4c", accent: "#7a5c2e", surface: "#e3d8c2",
  police: "font.jost", titres: "font.bodoni-moda", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#7a5c2e66",
});
const delorme = modeleV2({
  id: identifiantV2(11, "gestion-privee"), concept: "c-011-gestion-privee", name: "Gestion privée", family: FAM,
  description: "Une signature manuscrite sous un monogramme à filet remplace le logo ; trois liens, une ligne d'adresse et des mentions sobres, centrés sur sable. Aucun bouton, aucune boîte : la confiance par l'écrit, en Bodoni et en Jost.",
  tags: ["gestion de patrimoine", "signature", "script", "sable", "centré", "sans bouton", "bodoni", "filets"],
  identity: delormeId,
  racine: racineDe("#efe7d8"),
  widgets: ["text", "link", "bizcontact", "bizphone", "bizemail", "bizlegal", "copyright", "heading", "container", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · le monogramme : cercle à filet fin, deux lettres en Bodoni (décor) ; la signature en script, puis le nom en capitales espacées (le vrai nom, lisible)
    const monogramme = k.col([tx(k, "DP", { fontFamily: S.head, fontWeight: "500", fontSize: "20px", letterSpacing: "0.12em", color: S.accent, lineHeight: 1, textAlign: "center", marginLeft: "0.12em" })],
      { width: "60px", height: "60px", borderRadius: "999px", borderStyle: "solid", borderWidth: "1px", borderColor: S.accent, alignItems: "center", justifyContent: "center", alignSelf: "center" });
    const signature = { type: "heading", props: { text: "Delorme", level: "2", tag: "p" }, styles: { desktop: { fontFamily: "font.homemade-apple", fontWeight: "400", fontSize: "fluid:52-92", lineHeight: 1.25, color: S.fg, textAlign: "center", letterSpacing: "0em", width: "100%", marginTop: "0px", marginBottom: "0px", overflowWrap: "break-word" } } };
    const nom = tx(k, "Delorme Patrimoine · gestion privée", { fontFamily: S.font, fontSize: "13px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.3em", color: S.mute, textAlign: "center", lineHeight: 1.6, marginLeft: "0.3em" }, undefined, { letterSpacing: "0.2em" });
    const marque = k.col([monogramme, signature, nom], { gap: "10px", alignItems: "center", width: "100%" });
    // 2 · le filet double (deux traits de 1 px, 4 px d'écart)
    const filetDouble = (largeur) => ({ type: "container", children: [], ...sty({ width: largeur, height: "5px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderBottomWidth: "1px", borderColor: S.accent, alignSelf: "center" }) });
    // 3 · trois liens, soulignés au survol (aucun bouton)
    const l3 = [["Le cabinet", "/"], ["Nous écrire", "/contact"], ["Actualités", "/blog"]].map(([l, u]) => lien(k, G, l, u, { taille: 15, casse: "uppercase", suivi: "0.16em", poids: "500", sansDecalage: true, survol: { color: S.accent, textDecoration: "underline" }, extra: { paddingLeft: "6px", paddingRight: "6px", minHeight: "44px" } }));
    const liens = k.row(l3, { columnGap: "28px", rowGap: "0px", justifyContent: "center", alignItems: "center", width: "100%" }, undefined, { columnGap: "12px" });
    // 4 · la ligne d'adresse (Données de l'entreprise : rien tant qu'elle n'est pas renseignée)
    const mini = { color: S.mute, fontSize: "15px", fontFamily: S.font, textAlign: "center" };
    const adresse = k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: false, showEmail: false, showIcons: false, layout: "inline" }, mini);
    const tel = Moteur.finishNode(S, k.W("bizphone", { which: "1", prefix: "", showLabel: false, showIcon: false }, mini));
    const mail = Moteur.finishNode(S, k.W("bizemail", { prefix: "", text: "", showIcon: false }, mini));
    const adresseCentree = k.row([adresse, tel, mail], { rowGap: "0px", columnGap: "28px", justifyContent: "center", alignItems: "center", width: "100%" });
    // 5 · les mentions : avertissement générique d'EXEMPLE + ligne légale centrée
    const avert = tx(k, "Exemple de mention à adapter : tout placement comporte un risque de perte en capital. Ce site ne constitue pas un conseil personnalisé.", { fontSize: "13px", lineHeight: 1.7, color: S.mute, textAlign: "center", maxWidth: "560px", marginLeft: "auto", marginRight: "auto" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env, true);
    const bande = G.bande(k, [marque, filetDouble("96px"), liens, adresseCentree, filetH(k, S.line, "1px", { width: "64px", alignSelf: "center" }), avert, mentions], { colonne: true, aligne: "center", gap: "30px", max: "760px", padV: ["120px", "96px", "72px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "24px" }, nom: "Signature" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-012 « Fintech Tableau » — néobanque fictive « Ledgr ». Noir verdâtre #0B0F0C, vert menthe #3DFFA0, tout en mono (JetBrains Mono pour les titres, IBM Plex Sans pour le texte courant), papier millimétré en filigrane, angles droits.
// Le geste : une BARRE D'ÉTAT façon terminal (point, état, ligne de commande, version). HONNÊTETÉ : aucun widget de statut réel n'existe ; la barre est un texte d'EXEMPLE marqué « exemple » (modifiable dans l'éditeur,
// à relier à la vraie page de statut), le point est fixe (pas de faux « en direct »), la commande est un vrai lien vers Contact.
const ledgrId = identite({
  key: "c012", label: "Noir verdâtre et menthe", humeur: "dark",
  fond: "#0b0f0c", texte: "#e6f2e8", discret: "#93a89a", accent: "#3dffa0", surface: "#131a15",
  police: "font.ibm-plex-sans", titres: "font.jetbrains-mono", rayon: "2px", rayonBouton: "2px", ombre: "none", poids: "700", bordure: "1px", ligne: "#3dffa02e",
});
const grilleMm = (w, h, pas) => { let d = ""; for (let x = pas; x < w; x += pas) d += `M${x} 0V${h}`; for (let y = pas; y < h; y += pas) d += `M0 ${y}H${w}`; return `<path d="${d}" fill="none" stroke="#12261b" stroke-width="1"/>`; };
const ledgr = modeleV2({
  id: identifiantV2(12, "fintech-tableau"), concept: "c-012-fintech-tableau", name: "Fintech tableau", family: FAM,
  description: "Un pied de tableau de bord : quatre colonnes de liens en mono sur papier millimétré noir et menthe, puis une barre d'état façon terminal (état d'exemple, ligne de commande, version). Angles droits, filets de 1 px, aucun faux direct.",
  tags: ["fintech", "mono", "barre d'état", "terminal", "tableau de bord", "menthe", "grille", "angles droits"],
  identity: ledgrId,
  racine: racineDe("#0b0f0c"),
  widgets: ["sitelogo", "link", "text", "bizlegal", "copyright", "html", "container", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · les quatre colonnes : trois listes de liens réels + « suivre » (réseaux en noms) ; volets sur mobile
    const suivre = (kk) => kk.col([["LinkedIn", "https://www.linkedin.com/"], ["YouTube", "https://www.youtube.com/"], ["X", "https://x.com/"]].map(([l, u]) => lien(kk, G, `${l} ↗`, u, { taille: 14, pv: "5px", lh: 1.35, casse: "none", suivi: "0em" })), { gap: "4px", alignItems: "flex-start" });
    const colonnes = volets(k, G, env, [
      ["// produit", [["Ouvrir un compte", "/inscription"], ["Se connecter", "/connexion"], ["Mon espace", "/boutique/compte"]]],
      ["// ressources", [["Catalogue", "/catalogue"], ["Questions fréquentes", "/faq"], ["Actualités", "/blog"]]],
      ["// société", [["Accueil", "/"], ["Nous contacter", "/contact"], ["Gestion des cookies", "/cookies"]]],
      ["// suivre", suivre],
    ], { min: "190px", colGap: "32px", taille: 14, policeTitre: S.head, lien: { casse: "none", suivi: "0em" }, titre: { fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.12em", color: S.accent } });
    const logo = Moteur.item(k, "logo:30", env);
    const intro = tx(k, "Néobanque fictive. Marque d'exemple : remplacez ces liens par les vôtres.", { fontSize: "14px", lineHeight: 1.5, color: S.mute, maxWidth: "460px", fontFamily: S.head }, undefined, { fontSize: "13px" });
    const entete = G.ligne(k, [logo, intro], { gap: "10px 32px", aligne: "center", justifie: "flex-start", largeur: "100%" });
    // 2 · la barre d'état : point fixe + état d'EXEMPLE ; commande ; version d'exemple
    const point = { type: "container", children: [], ...sty({ width: "10px", height: "10px", minWidth: "10px", borderRadius: "999px", backgroundColor: S.accent, flexShrink: 0 }) };
    const etat = k.row([point, tx(k, "tous les services opérationnels", { fontFamily: S.head, fontWeight: "700", fontSize: "fluid:15-22", color: S.fg, lineHeight: 1.3 }), tx(k, "[exemple]", { fontFamily: S.head, fontSize: "12px", color: S.mute, lineHeight: 1.3 })], { gap: "12px", alignItems: "center", flexWrap: "wrap" });
    const commande = lien(k, G, "$ ledgr contact_", "/contact", { taille: 14, poids: "700", police: S.head, couleur: S.accent, survolCouleur: S.fg, sansDecalage: true });
    const version = tx(k, "v4.12.0 · exemple", { fontFamily: S.head, fontSize: "12px", color: S.mute, lineHeight: 1.3 });
    const barre = k.row([etat, k.row([commande, version], { rowGap: "10px", columnGap: "28px", alignItems: "center" })],
      { rowGap: "10px", columnGap: "36px", alignItems: "center", justifyContent: "space-between", width: "100%", backgroundColor: S.alt, borderStyle: "solid", borderWidth: "1px", borderColor: S.line, borderRadius: "2px", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "20px", paddingRight: "20px" },
      undefined, { flexDirection: "column", alignItems: "flex-start", paddingLeft: "14px", paddingRight: "14px", paddingTop: "10px", paddingBottom: "6px" });
    // 3 · mentions : ligne légale
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const b = G.bande(k, [entete, filetH(k, S.line), colonnes, barre, mentions], { colonne: true, gap: "40px", max: "1280px", padV: ["64px", "52px", "40px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "16px"], fond: S.bg, innerMobile: { rowGap: "24px" }, nom: "Tableau" });
    surFond(b, [calque(svgDe(1440, 720, grilleMm(1440, 720, 32), { ratio: "xMinYMin slice" }), { masque: ["tablet", "mobile"] }), calque(svgDe(820, 1100, grilleMm(820, 1100, 28), { ratio: "xMinYMin slice" }), { masque: ["desktop", "mobile"] }), calque(svgDe(390, 1200, grilleMm(390, 1200, 26), { ratio: "xMinYMin slice" }), { masque: ["desktop", "tablet"] })]);
    return [G.racine(k, [b])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-013 « Mutuelle en Cartes » — mutuelle coopérative fictive « La Rive ». Vert profond, crème, ocre pour le liseré actif. UN ÉVENTAIL DE TROIS CARTES en escalier (−4°, 0°, +4°, coins 28/28/28/6) : « Adhérer » (crème, au premier plan),
// « Être remboursé » et « Nous trouver » ; tout le contenu reste visible et lisible (jamais caché par une autre carte), accessible au clavier. Sur mobile : cartes empilées, droites. Nunito 800 (titres) + Fraunces (texte).
const riveId = identite({
  key: "c013", label: "Vert profond, crème et ocre", humeur: "dark",
  fond: "#17443b", texte: "#f3efe6", discret: "#cfe3d8", accent: "#f2b04b", surface: "#225a4f",
  police: "font.fraunces", titres: "font.nunito", rayon: "28px", rayonBouton: "999px", ombre: "none", poids: "800", bordure: "0px", ligne: "#f3efe633",
});
const rive = modeleV2({
  id: identifiantV2(13, "mutuelle-en-cartes"), concept: "c-013-mutuelle-en-cartes", name: "Mutuelle en cartes", family: FAM,
  description: "Trois cartes posées en escalier comme un jeu, légèrement inclinées, aux coins asymétriques : Adhérer (crème, au premier plan), Être remboursé, Nous trouver. Vert profond, crème, ocre. Tout est lisible, rien n'est caché ; droites sur mobile.",
  tags: ["mutuelle", "cartes", "éventail", "vert profond", "crème", "ocre", "coins asymétriques", "organique"],
  identity: riveId,
  racine: racineDe("#17443b"),
  widgets: ["sitelogo", "text", "button", "link", "bizcontact", "bizhours", "social", "bizlegal", "copyright", "container", "divider"],
  compose(k, env, G) {
    const S = k.S, CREME = "#f3efe6", VERT = "#17443b";
    const coins = { borderTopLeftRadius: "28px", borderTopRightRadius: "28px", borderBottomLeftRadius: "28px", borderBottomRightRadius: "6px" };
    const carte = (enfants, o) => k.col(enfants, { ...coins, backgroundColor: o.fond, color: o.texte, paddingTop: "32px", paddingBottom: "34px", paddingLeft: "30px", paddingRight: "30px", gap: "22px", flexBasis: "0px", flexGrow: o.poids, minWidth: "260px", alignItems: "flex-start", transform: { rotate: o.rot }, marginTop: o.decalage, marginBottom: o.bas, boxShadow: "lg", borderStyle: "solid", borderWidth: "0px", borderTopWidth: o.liser ? "6px" : "0px", borderColor: S.accent },
      { marginBottom: "0px", transform: { rotate: o.rot / 2 }, flexBasis: o.tab || "100%", flexGrow: o.tab ? 1 : o.poids, marginTop: o.tabHaut || "0px" }, { marginTop: "0px", marginBottom: "0px", transform: { x: "1px" }, minWidth: "0px", flexBasis: "auto", flexGrow: 1, width: "100%", paddingTop: "26px", paddingBottom: "28px", paddingLeft: "22px", paddingRight: "22px" });
    const titre = (t, c) => tx(k, t, { fontFamily: S.head, fontWeight: "800", fontSize: "fluid:26-34", lineHeight: 1.1, color: c, letterSpacing: "-0.01em" });
    const corps = (t, c) => tx(k, t, { fontSize: "16px", lineHeight: 1.6, color: c });
    // carte 1 : Adhérer — crème, au premier plan, bouton ocre (le seul bouton du pied)
    const bouton = k.B("Adhérer en ligne", "/inscription", "solid", { backgroundColor: S.accent, color: S.onAccent, borderRadius: "999px", fontWeight: "800", fontFamily: S.head, minHeight: "52px", paddingLeft: "28px", paddingRight: "28px", fontSize: "16px", borderWidth: "0px" });
    G.fini(k, bouton, { hover: { backgroundColor: VERT, color: CREME, transform: { y: -2 } }, focus: G.focus(VERT) });
    const c1 = carte([cap(k, "Rejoignez-nous", { couleur: "#6b4700" }), titre("Adhérer", VERT), corps("La Rive est une mutuelle coopérative : on y entre en quelques minutes, on y reste entre adhérents.", VERT), bouton], { fond: CREME, texte: VERT, poids: 1.1, rot: -4, decalage: "0px", bas: "64px", liser: true });
    // carte 2 : Être remboursé — liens réels (espace adhérent, questions fréquentes)
    const l2 = (l, u) => lien(k, G, l, u, { taille: 16, poids: "700", couleur: S.fg, pv: "6px", survol: { color: S.accent, textDecoration: "underline", transform: { x: 4 } } });
    const c3 = carte([cap(k, "Au quotidien", { couleur: S.mute }), titre("Être remboursé", S.fg), corps("Suivez vos remboursements depuis votre espace adhérent.", S.mute), k.col([l2("Mon espace adhérent  →", "/connexion"), l2("Questions fréquentes  →", "/faq")], { gap: "12px" })], { fond: S.alt, texte: S.fg, poids: 1, rot: 4, decalage: "0px", bas: "0px", tab: "44%", tabHaut: "28px" });
    // carte 3 : Nous trouver — coordonnées et horaires lus dans les Données de l'entreprise
    const contact = k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: S.fg, fontSize: "16px", fontFamily: S.font });
    const horaires = k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: false, showNote: true, closedLabel: "Fermé" }, { color: S.mute, fontSize: "14px", fontFamily: S.font });
    const c2 = carte([cap(k, "Près de chez vous", { couleur: S.mute }), titre("Nous trouver", S.fg), contact, horaires, l2("Écrire à la mutuelle  →", "/contact")], { fond: S.alt, texte: S.fg, poids: 1.1, rot: 0, decalage: "0px", bas: "34px", tab: "44%" });
    const eventail = G.ligne(k, [c1, c2, c3], { gap: "28px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    eventail.styles.desktop = { ...eventail.styles.desktop, flexWrap: "wrap", alignItems: "flex-end", paddingBottom: "0px" };
    eventail.styles.mobile = { ...(eventail.styles.mobile || {}), rowGap: "18px", alignItems: "stretch" };
    const haut = G.bande(k, [eventail], { colonne: true, max: "1200px", padV: ["112px", "88px", "56px"], padB: ["24px", "24px", "20px"], padH: ["48px", "32px", "16px"], fond: S.bg, nom: "Cartes" });
    // pied : logo, quelques liens, réseaux ronds, mentions
    const logo = Moteur.item(k, "logo:44", env);
    const menu = k.row([["Accueil", "/"], ["Actualités", "/blog"], ["Contact", "/contact"]].map(([l, u]) => lien(k, G, l, u, { taille: 16, poids: "700", sansDecalage: true, extra: { minHeight: "44px", paddingLeft: "10px", paddingRight: "10px" } })), { rowGap: "4px", columnGap: "14px", alignItems: "center" });
    const reseaux = reseauxIcones(k, G, env, ["facebook", "instagram", "youtube"], { fond: S.alt, couleur: S.fg });
    const ligne1 = G.ligne(k, [logo, menu, reseaux], { gap: "16px 32px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const bas = G.bande(k, [filetH(k, S.line), ligne1, G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { colonne: true, gap: "20px", max: "1200px", padV: ["24px", "24px", "16px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "16px"], fond: S.bg, nom: "Mentions" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-014 « Index du Comptable » — cabinet comptable fictif « Chiffre & Lettre ». Papier crème, vert sapin. Les liens forment un INDEX façon GRAND LIVRE : en-tête « N° · Rubrique · Folio » sous un filet double, huit lignes numérotées 01 à 08
// (chiffres tabulaires en slab), reliées à leur page par un pointillé ; le folio rappelle l'adresse réelle de la page. Zilla Slab 700 + Source Sans 3. Index toujours visible sur mobile (c'est le geste du pied : le replier le cacherait).
const comptableId = identite({
  key: "c014", label: "Papier crème et vert sapin", humeur: "light",
  fond: "#f9f7f1", texte: "#1c2420", discret: "#56605a", accent: "#1f6f5c", surface: "#e8e6da",
  police: "font.source-sans-3", titres: "font.zilla-slab", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#1f6f5c55",
});
const ligneIndex = (k, G, num, label, url, folio) => {
  const S = k.S;
  const pointilles = { type: "container", children: [], ...sty({ flexGrow: 1, flexShrink: 1, flexBasis: "0px", minWidth: "14px", height: "0px", borderStyle: "dotted", borderWidth: "0px", borderBottomWidth: "2px", borderColor: "#1f6f5c88", alignSelf: "center", marginTop: "12px" }) };
  const n = tx(k, num, { fontFamily: S.head, fontWeight: "700", fontSize: "17px", color: S.accent, minWidth: "34px", lineHeight: 1.3, fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" });
  const f = tx(k, folio, { fontFamily: S.font, fontSize: "13px", color: S.mute, lineHeight: 1.3, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" });
  const l = lien(k, G, label, url, { taille: 18, poids: "600", survol: { color: S.accent, textDecoration: "underline", transform: { x: 4 } }, lh: 1.25 });
  return k.row([n, l, pointilles, f], { gap: "10px", alignItems: "center", flexWrap: "nowrap", width: "100%", paddingTop: "3px", paddingBottom: "3px" });
};
const enteteIndex = (k) => {
  const S = k.S, c = (t, min) => cap(k, t, { taille: "11px", couleur: S.accent });
  const n = c("N°"); n.styles.desktop.minWidth = "34px";
  return k.row([n, c("Rubrique"), c("Folio")], { gap: "10px", justifyContent: "space-between", alignItems: "baseline", flexWrap: "nowrap", width: "100%", borderStyle: "double", borderWidth: "0px", borderBottomWidth: "4px", borderColor: S.accent, paddingBottom: "8px", marginBottom: "6px" });
};
const comptable = modeleV2({
  id: identifiantV2(14, "index-du-comptable"), concept: "c-014-index-du-comptable", name: "Index du comptable", family: FAM,
  description: "Les liens forment un index de grand livre : huit lignes numérotées en chiffres tabulaires, reliées à leur page par un pointillé, sous un filet double. À gauche, le logo, une phrase et l'adresse. Papier crème, vert sapin, slab sobre.",
  tags: ["expert-comptable", "index numéroté", "grand livre", "pointillés", "crème", "vert sapin", "slab", "filets"],
  identity: comptableId,
  racine: racineDe("#e8e6da"),
  widgets: ["sitelogo", "text", "link", "bizcontact", "bizhours", "bizlegal", "copyright", "container", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · à gauche : logo, phrase d'accroche
    const logo = Moteur.item(k, "logo:48", env);
    const phrase = tx(k, "La rigueur du chiffre, la clarté de la lettre.", { fontFamily: S.head, fontWeight: "700", fontSize: "fluid:24-34", lineHeight: 1.18, letterSpacing: "-0.005em", color: S.fg, maxWidth: "380px" });
    const note = tx(k, "Cabinet fictif : chaque ligne de l'index mène à une vraie page du site.", { fontSize: "14px", lineHeight: 1.6, color: S.mute, maxWidth: "340px" });
    const gauche = G.colonne(k, [logo, filetH(k, S.accent, "3px", { width: "48px" }), phrase, note], { poids: 4, min: "280px", gap: "20px" });
    // 2 · à droite : l'index — en-tête sous filet double, deux colonnes de quatre lignes (une seule sur mobile)
    const colonneIndex = (lignes, sansEntete) => k.col([sansEntete ? { ...enteteIndex(k), hideOn: ["mobile"] } : enteteIndex(k), ...lignes.map(([n, l, u]) => ligneIndex(k, G, n, l, u, u))], { gap: "4px", flexBasis: "0px", flexGrow: 1, minWidth: "260px", alignItems: "stretch" });
    const A = colonneIndex([["01", "Accueil", "/"], ["02", "Actualités", "/blog"], ["03", "Catalogue", "/catalogue"], ["04", "Boutique", "/boutique"]]);
    const B = colonneIndex([["05", "Questions fréquentes", "/faq"], ["06", "Nous contacter", "/contact"], ["07", "Se connecter", "/connexion"], ["08", "Créer un compte", "/inscription"]], true);
    const index = G.ligne(k, [A, B], { gap: "20px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const droite = G.colonne(k, [index], { poids: 8, min: "300px", aligne: "stretch" });
    const haut = G.bande(k, [gauche, droite], { aligne: "flex-start", gap: "40px 72px", max: "1240px", padV: ["88px", "64px", "48px"], padB: ["64px", "48px", "40px"], padH: ["48px", "32px", "20px"], fond: S.bg, nom: "Logo et index" });
    // 3 · adresse et horaires (Données de l'entreprise : rien tant qu'elles ne sont pas renseignées), puis la ligne légale
    const tCol = { fontFamily: S.head, fontSize: "20px", fontWeight: "700", color: S.fg, marginBottom: "6px" };
    const coord = titreWidget(G.code("contact|Nous trouver")(k, env), tCol);
    const heures = titreWidget(G.code("hours|Horaires d'accueil")(k, env), tCol);
    const infos = G.ligne(k, [k.col([coord], { flexBasis: "0px", flexGrow: 1, minWidth: "260px" }), k.col([heures], { flexBasis: "0px", flexGrow: 1, minWidth: "260px" })], { gap: "24px 48px", aligne: "flex-start", largeur: "100%" });
    const bas = G.bande(k, [infos, filetH(k, S.line), G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { colonne: true, gap: "28px", max: "1240px", padV: ["48px", "40px", "32px"], padB: ["28px", "28px", "24px"], padH: ["48px", "32px", "20px"], fond: S.alt, filetHaut: { epaisseur: "1px", couleur: S.line }, nom: "Adresse et mentions", innerMobile: { rowGap: "22px" } });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

module.exports = {
  key: "finance-assurance", label: "Finance et assurance", target: 6, built: true,
  description: "Banques, assurances, gestion privée et fintech : confiance, clarté des chiffres et des engagements, sobriété graphique.",
  models: [nocto, clairmont, delorme, ledgr, rive, comptable],
};
