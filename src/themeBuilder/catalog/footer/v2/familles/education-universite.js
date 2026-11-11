// Famille v2 « Éducation et université » — 6 modèles (concepts c-067 à c-072 de docs/footer-v2/CONCEPTS_100.md). Voir docs/footer-v2/GUIDE_CONSTRUIRE_UN_MODELE_V2.md.
// Chaque modèle est INDÉPENDANT du site (mode « solo ») : ses couleurs (hexadécimal), ses polices (bibliothèque auto-hébergée) et ses formes viennent de son identité (identite()).
// Toutes les marques (Université du Val-de-Rive, Ligne 42, Les Petits Chênes, Cap Compétences, Fonds Lemaire, Savoirs) sont FICTIVES ; horaires, étapes, cotes et libellés sont des EXEMPLES signalés, modifiables dans l'éditeur.
// Polices testées à 110 px (accents, « a », « e », « n », « ? ») : JetBrains Mono 700, Andika 700, Source Serif 4 600, Vollkorn 700, Poppins 600/700, Work Sans 700 : PROPRES. Figtree (corps du concept 068) remplacée par Geist (conflit avec la police du site de test).
// Les aides locales (en tête de fichier) complètent le kit v2 sans le modifier.
const { sty, compact } = require("../../../kit");
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");

const FAM = "education-universite";

// ── Aides locales ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const tx = (k, html, st = {}, t, m) => k.T(/^\s*</.test(html) ? html : `<p>${html}</p>`, st, t, m);
// petit libellé en capitales espacées
const cap = (k, txt, o = {}) => tx(k, txt, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "600", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, textAlign: o.align }));
// lien fini par le moteur (états, 44 px mobile) puis états propres
const lien = (k, label, url, o = {}) => GK.fini(k, k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || k.S.font, color: o.couleur || k.S.fg, textDecoration: "none", lineHeight: o.lh || 1.4, letterSpacing: o.suivi, display: "inline-flex", alignItems: "center", minHeight: o.h, paddingLeft: o.padH, paddingRight: o.padH, borderRadius: o.rayon, transitionDuration: GK.MOUVEMENT, ...(o.extra || {}) })), { hover: o.survol || { color: k.S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || k.S.accent) });
const trait = (k, couleur, e = "1px", st = {}) => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: e, marginTop: "0px", marginBottom: "0px", ...st });
const grille = (enfants, cols, st = {}, t = {}, m = {}) => ({ type: "grid", children: enfants, ...sty(compact({ columns: cols[0], gap: "24px", width: "100%", ...st }), { columns: cols[1], ...t }, { columns: cols[2], ...m }) });
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
// réseaux en icônes (disques ou carrés de 44 px) : parties du widget « Réseaux sociaux »
function reseauxIcones(k, env, liste, o = {}) {
  const S = k.S, n = Moteur.item(k, `socials:${liste.join("+")}`, env);
  n.props.size = String(o.taille || 44); n.props.shape = o.forme || "circle";
  Moteur.mergePart(n, "link", { styles: { desktop: compact({ color: o.couleur || S.fg, backgroundColor: o.fond, borderStyle: o.contour ? "solid" : undefined, borderWidth: o.contour ? (o.epaisseur || "1px") : undefined, borderColor: o.contour, transitionDuration: GK.MOUVEMENT }) },
    states: { hover: { backgroundColor: o.survolFond || S.accent, color: o.survolCouleur || S.onAccent, borderColor: o.survolFond || S.accent }, focus: GK.focus(o.focus || S.accent) } });
  return n;
}
// titre d'un widget (contact, horaires) au style du modèle
const titreWidget = (w, st) => { Moteur.mergePart(w, "title", { styles: { desktop: st } }); return w; };

// ── Décors SVG (widget HTML) : un calque posé SOUS le contenu, sur toute la surface de la bande ────────────────────────────────────────────────
// Le widget HTML impose `height: auto` aux SVG : la hauteur d'un calque vient du RAPPORT de sa viewBox ; un dessin par écran, plus haut que la bande (le surplus est rogné).
const svgDe = (w, h, corps) => {
  const s = `<span aria-hidden="true"><svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMinYMin slice" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${corps}</svg></span>`;
  if (s.length > 19000) throw new Error(`SVG trop long (${s.length}) pour le widget HTML (20 000 caractères).`);
  return s;
};
const calque = (html, masque) => ({ type: "html", props: { html }, hideOn: masque, ...sty({ position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%", zIndex: 0, overflow: "hidden", lineHeight: 0.8, fontSize: "0px" }) });
function surFond(b, d) {
  b.styles.desktop = { ...b.styles.desktop, position: "relative", overflow: "hidden" };
  const inner = b.children[0];
  inner.styles.desktop = { ...inner.styles.desktop, position: "relative", zIndex: 1 };
  b.children.push(calque(d.bureau, ["tablet", "mobile"]), calque(d.tablette, ["desktop", "mobile"]), calque(d.mobile, ["desktop", "tablet"]));
  return b;
}
// arrondi par coin « haut-gauche haut-droit bas-droit bas-gauche » (la grammaire refuse la valeur à quatre nombres dans borderRadius)
const coins = (v) => { const [a, b, c, d] = v.split(" "); return { borderTopLeftRadius: a, borderTopRightRadius: b, borderBottomRightRadius: c, borderBottomLeftRadius: d }; };
const fmt = (n) => Math.round(n * 10) / 10;

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-067 « Campus Blason » — « Université du Val-de-Rive » (fictive). Un BLASON dessiné en SVG (tour, livre ouvert, laurier) précède quatre onglets (Formations, Recherche, Vie de campus, International) :
// un seul panneau de liens est visible à la fois, dans un cadre à double filet d'or (passe-partout). Bordeaux #5b1b2b, or #f0c36a, texture de rayures très fines. Merriweather (titre) + Open Sans.
// Mobile : les quatre onglets deviennent quatre accordéons (variante masquée sur grand écran, comme le demande la fiche). Les libellés des liens sont des EXEMPLES reliés aux pages de la plateforme : à renommer et relier dans l'éditeur.
// Écarts : pas de sélecteur de langue (widget inexistant, rien de décoratif présenté comme fonctionnel) ; pas de bandeau d'alerte (texte à saisir par l'établissement, ajoutable dans l'éditeur).
const valRive = identite({
  key: "c067", label: "Bordeaux et or", humeur: "dark",
  fond: "#5b1b2b", texte: "#ffffff", discret: "#ebcdd3", accent: "#f0c36a", surface: "#6f2438",
  police: "font.open-sans", titres: "font.merriweather", rayon: "0px", rayonBouton: "2px", ombre: "none", poids: "700", bordure: "1px", ligne: "#f0c36a59",
});
const blasonSvg = (or, fond) => {
  const feuilles = (cote) => { let s = ""; for (let i = 0; i < 7; i++) { const x = 25 + 6 * Math.sin((i / 6) * Math.PI * 0.85), y = 78 - i * 6.4, a = -28 + i * 9; const X = cote < 0 ? x : 96 - x, A = cote < 0 ? a : -a; s += `<ellipse cx="${fmt(X)}" cy="${fmt(y)}" rx="2.8" ry="6" transform="rotate(${A} ${fmt(X)} ${fmt(y)})" fill="${or}"/>`; } return s; };
  return `<svg viewBox="0 0 96 112" width="88" role="img" aria-label="Blason de l'université (dessin d'exemple : tour, livre ouvert, laurier, à remplacer par celui de l'établissement)" focusable="false" xmlns="http://www.w3.org/2000/svg">`
    + `<path d="M6 6h84v52c0 28-24 44-42 52C30 102 6 86 6 58z" fill="${fond}" stroke="${or}" stroke-width="3"/>`
    + `<path d="M12 12h72v46c0 23-19 37-36 44-17-7-36-21-36-44z" fill="none" stroke="${or}" stroke-width="1" opacity="0.55"/>`
    + feuilles(-1) + feuilles(1)
    + `<path d="M38 44V28h4v5h4v-5h4v5h4v-5h4v16z" fill="${or}"/><rect x="38" y="42" width="20" height="26" fill="${or}"/><path d="M44 68V57a4 4 0 0 1 8 0v11z" fill="${fond}"/>`
    + `<path d="M26 76c8-4 15-4 22 2 7-6 14-6 22-2v12c-8-4-15-4-22 2-7-6-14-6-22-2z" fill="${or}"/><path d="M48 78v12" stroke="${fond}" stroke-width="2"/>`
    + `</svg>`;
};
const rayures = (w, h, couleur) => { let d = ""; for (let x = -h; x < w; x += 14) d += `M${x} ${h}L${x + h} 0`; return `<path d="${d}" stroke="${couleur}" stroke-width="1" opacity="0.07" fill="none"/>`; };
const campusBlason = modeleV2({
  id: identifiantV2(67, "campus-blason"), concept: "c-067-campus-blason", name: "Campus blason", family: FAM,
  description: "Un blason dessiné en SVG (tour, livre, laurier) puis quatre onglets : un seul panneau de liens à la fois, dans un cadre à double filet d'or. Bordeaux, or, rayures très fines ; sur mobile, les onglets deviennent des accordéons.",
  tags: ["université", "blason", "onglets", "bordeaux", "or", "académique", "accordéon mobile"],
  identity: valRive,
  racine: racineDe("#5b1b2b"),
  widgets: ["text", "html", "link", "container", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, OR = S.accent;
    // 1 · la barre du haut : blason (SVG) + nom de l'université fictive ; à droite, les deux liens d'aide (le lien Contact joue l'appel discret)
    const blason = { type: "html", props: { html: blasonSvg(OR, S.alt) }, ...sty({ width: "88px", minWidth: "88px", flexShrink: 0, lineHeight: 0.8, fontSize: "0px" }, undefined, { width: "72px", minWidth: "72px" }) };
    const nom = k.col([cap(k, "Établissement d'exemple", { couleur: OR, suivi: "0.2em" }),
      tx(k, "Université du Val-\u2060de-\u2060Rive", { fontFamily: S.head, fontWeight: "700", fontSize: "fluid:26-42", lineHeight: 1.12, color: S.fg, letterSpacing: "-0.005em" }),
      tx(k, "Formation, recherche et vie de campus", { fontSize: "15px", lineHeight: 1.5, color: S.mute })], { gap: "6px", flexBasis: "0px", flexGrow: 1, minWidth: "0px" });
    const marque = k.row([blason, nom], { gap: "22px", flexWrap: "nowrap", alignItems: "center", flexBasis: "0px", flexGrow: 3, minWidth: "280px" }, undefined, { gap: "16px" });
    const aide = k.row([GK.lienFleche("Contact", "/contact", { taille: 15, couleur: S.fg, survol: OR })(k, env), GK.lienFleche("Questions fréquentes", "/faq", { taille: 15, couleur: S.fg, survol: OR })(k, env)], { ...GK.gaps("6px 28px"), justifyContent: "flex-end", alignItems: "center" }, { justifyContent: "flex-start" }, { justifyContent: "flex-start" });
    const haut = k.row([marque, aide], { rowGap: "16px", columnGap: "40px", alignItems: "center", justifyContent: "space-between", width: "100%" });
    // 2 · les quatre panneaux de liens (3 colonnes) : mêmes contenus pour les onglets (grand écran) et les accordéons (mobile)
    const rubrique = (titre, liste) => k.col([cap(k, titre, { couleur: OR }), ...liste.map(([l, u]) => lien(k, l, u, { taille: 15, h: "40px", survol: { color: OR, textDecoration: "underline" } }))], { gap: "2px", flexBasis: "0px", flexGrow: 1, minWidth: "190px" }, undefined, { minWidth: "100%", gap: "0px" });
    const panneau = (nomP, cols) => ({ type: "container", name: nomP, children: cols.map(([t, l]) => rubrique(t, l)), ...sty({ display: "flex", flexDirection: "row", flexWrap: "wrap", ...GK.gaps("20px 48px"), alignItems: "flex-start", width: "100%" }, undefined, { rowGap: "16px" }) });
    const contenus = () => [
      panneau("Formations", [["Se former", [["Catalogue des formations", "/catalogue"], ["Boutique de l'université", "/boutique"]]], ["Candidater", [["Créer mon compte", "/inscription"], ["Questions fréquentes", "/faq"]]], ["Étudier ici", [["Espace étudiant", "/connexion"], ["Mon panier", "/boutique/panier"]]]]),
      panneau("Recherche", [["Publications", [["Actualités de la recherche", "/blog"], ["Catalogue des ressources", "/catalogue"]]], ["Collaborer", [["Nous contacter", "/contact"], ["Questions fréquentes", "/faq"]]], ["Espace chercheur", [["Se connecter", "/connexion"], ["Créer un compte", "/inscription"]]]]),
      panneau("Vie de campus", [["Au quotidien", [["Actualités du campus", "/blog"], ["Questions fréquentes", "/faq"]]], ["Services", [["Boutique", "/boutique"], ["Mes favoris", "/boutique/souhaits"]]], ["Nous trouver", [["Contact", "/contact"], ["Accueil du site", "/"]]]]),
      panneau("International", [["Venir étudier", [["Catalogue des formations", "/catalogue"], ["Créer mon compte", "/inscription"]]], ["Partir", [["Actualités", "/blog"], ["Questions fréquentes", "/faq"]]], ["Contact", [["Écrire à l'université", "/contact"], ["Espace étudiant", "/connexion"]]]]),
    ];
    const ongletsNode = { type: "container", props: { mode: "tabs", tabsLook: "line", tabsStart: 1 }, hideOn: ["mobile"], children: contenus(), ...sty({ display: "flex", flexDirection: "column", gap: "0px", color: S.fg, fontFamily: S.font, fontSize: "15px", lineHeight: 1.5, fontWeight: "600", width: "100%" }) };
    const accordeonNode = { type: "container", props: { mode: "accordion", accStart: "none", accSingle: true }, hideOn: ["desktop", "tablet"], children: contenus(), ...sty({ display: "flex", flexDirection: "column", gap: "0px", color: S.fg, fontFamily: S.font, fontSize: "16px", lineHeight: 1.5, fontWeight: "600", width: "100%" }) };
    const cadre = k.col([ongletsNode, accordeonNode], { width: "100%", backgroundColor: S.alt, borderStyle: "double", borderWidth: "6px", borderColor: OR, paddingTop: "28px", paddingBottom: "26px", paddingLeft: "36px", paddingRight: "36px", gap: "0px" }, { paddingLeft: "28px", paddingRight: "28px" }, { paddingTop: "10px", paddingBottom: "10px", paddingLeft: "18px", paddingRight: "18px", borderWidth: "4px" });
    // 3 · adresse (Données de l'entreprise, rien d'inventé) et réseaux en liste de noms
    const adresse = k.col([titreWidget(G.code("contact|Nous trouver")(k, env), { fontFamily: S.font, fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.14em", color: OR, marginBottom: "8px" })], { flexBasis: "0px", flexGrow: 2, minWidth: "240px" });
    const reseaux = k.col([cap(k, "Suivre l'université", { couleur: OR }), GK.reseauxTexte([["Facebook", "https://www.facebook.com/"], ["LinkedIn", "https://www.linkedin.com/"], ["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 14, couleur: S.fg, survol: OR })(k, env)], { gap: "4px", flexBasis: "0px", flexGrow: 3, minWidth: "260px" });
    const bas = k.row([reseaux, adresse], { rowGap: "28px", columnGap: "56px", alignItems: "flex-start", width: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const b = G.bande(k, [haut, cadre, bas, trait(k, S.line), mentions], { colonne: true, gap: "34px", padV: ["64px", "52px", "40px"], padB: ["28px", "28px", "24px"], padH: ["48px", "32px", "16px"], max: "1180px", fond: S.bg, innerMobile: { rowGap: "26px" }, nom: "Campus blason" });
    return [G.racine(k, [surFond(b, { bureau: svgDe(1440, 760, rayures(1440, 760, OR)), tablette: svgDe(820, 1000, rayures(820, 1000, OR)), mobile: svgDe(390, 1200, rayures(390, 1200, OR)) })])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-068 « École de Code » — école fictive « Ligne 42 ». La PRÉ-INSCRIPTION est une ligne de commande : une fenêtre de terminal, « $ candidater » en grand (JetBrains Mono 700, jusqu'à 96 px), l'adresse e-mail saisie sur la ligne
// du dessous et un bouton « Entrée ». Bleu nuit #101418, cyan #5ce1e6, quadrillage fin en SVG. Colonnes de liens à titres mono, logo en signature, réseaux en carrés de 44 px.
// Écarts : Geist remplace Figtree (corps) ; les coupes en diagonale (clip-path) n'existent pas dans la grammaire : angles droits et filets ; curseur « bloc » fixe (jamais animé).
// Accessibilité : le champ garde son étiquette et ses messages (widget e-mail du moteur) ; sans formulaire publié, le widget dit « non configuré » dans le style du terminal.
const ligne42 = identite({
  key: "c068", label: "Bleu nuit et cyan", humeur: "dark",
  fond: "#101418", texte: "#e9f1f5", discret: "#a9bcc7", accent: "#5ce1e6", surface: "#1a2128",
  police: "font.geist", titres: "font.jetbrains-mono", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#34444f",
});
const grilleFine = (w, h, couleur) => { let d = ""; for (let x = 0; x <= w; x += 32) d += `M${x} 0V${h}`; for (let y = 0; y <= h; y += 32) d += `M0 ${y}H${w}`; return `<path d="${d}" stroke="${couleur}" stroke-width="1" opacity="0.07" fill="none"/>`; };
const ecoleCode = modeleV2({
  id: identifiantV2(68, "ecole-de-code"), concept: "c-068-ecole-de-code", name: "École de code", family: FAM,
  description: "La pré-inscription se fait en ligne de commande : une fenêtre de terminal, « $ candidater » en grand, le champ e-mail sur la ligne du dessous et un bouton Entrée. Bleu nuit, cyan, quadrillage fin, polices mono.",
  tags: ["école de programmation", "terminal", "formulaire", "mono", "bleu nuit", "cyan", "pré-inscription"],
  identity: ligne42,
  racine: racineDe("#101418"),
  widgets: ["text", "html", "emailsubscribe", "link", "social", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, CY = S.accent, MONO = S.head;
    // 1 · la fenêtre : barre de titre (trois carrés, titre mono) puis le corps (commande géante + champ)
    const carre = (c) => k.col([], { width: "10px", height: "10px", backgroundColor: c, flexShrink: 0 });
    const barre = k.row([k.row([carre(CY), carre("#3b4a55"), carre("#3b4a55")], { gap: "6px", flexWrap: "nowrap" }), tx(k, "ligne42 ~ pré-inscription", { fontFamily: MONO, fontSize: "13px", color: S.mute, lineHeight: 1.2, fontWeight: "500" })], { gap: "16px", alignItems: "center", flexWrap: "nowrap", width: "100%", backgroundColor: "#141b21", paddingTop: "14px", paddingBottom: "14px", paddingLeft: "20px", paddingRight: "20px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: S.line });
    const commentaire = tx(k, "# Étape suivante : la candidature", { fontFamily: MONO, fontSize: "14px", lineHeight: 1.4, color: S.mute, fontWeight: "500" });
    const commande = tx(k, `<p><span style="color:${CY}">$</span>&nbsp;candidater&nbsp;<span style="background-color:${CY}">&nbsp;</span></p>`, { fontFamily: MONO, fontWeight: "700", fontSize: "fluid:40-104", lineHeight: 1.05, letterSpacing: "-0.04em", color: S.fg }, { fontSize: "fluid:70-96" }, { fontSize: "33px", letterSpacing: "-0.03em" });
    const option = tx(k, `<p><span style="color:${CY}">--email</span>&nbsp;vous@exemple.fr</p>`, { fontFamily: MONO, fontWeight: "500", fontSize: "fluid:18-30", lineHeight: 1.3, color: S.fg, overflowWrap: "anywhere" });
    const abo = G.abonnement({ titre: "", intro: "", bouton: "Entrée", largeur: "100%", accent: CY, manque: "# Pré-inscription non configurée : publiez un formulaire d'inscription pour l'activer." })(k, env);
    Object.assign(abo.parts.input.styles.desktop, { fontFamily: MONO, fontSize: "18px", fontWeight: "500", color: CY, backgroundColor: "#0b0f12", borderWidth: "1px", borderBottomWidth: "1px", borderColor: S.line, paddingLeft: "16px", borderRadius: "0px" });
    abo.parts.input.states = { focus: { outlineStyle: "solid", outlineWidth: "2px", outlineColor: CY, outlineOffset: "2px" } };
    Object.assign(abo.parts.button.styles.desktop, { fontFamily: MONO, fontSize: "16px", fontWeight: "700", borderRadius: "0px", letterSpacing: "0.04em", textTransform: "uppercase" });
    abo.parts.button.states = { hover: { backgroundColor: S.fg, color: S.bg }, focus: GK.focus(S.fg) };
    Object.assign(abo.parts.missing.styles.desktop, { fontFamily: MONO, fontSize: "14px", fontStyle: "normal", color: S.mute });
    const corps = k.col([commentaire, commande, option, abo], { gap: "18px", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "40px", paddingRight: "40px", width: "100%" }, { paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "26px", paddingBottom: "28px", paddingLeft: "18px", paddingRight: "18px", gap: "14px" });
    const fenetre = k.col([barre, corps], { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "1px", borderColor: S.line, backgroundColor: S.alt });
    // 2 · trois colonnes de liens à titres mono
    const col = (t, liste) => k.col([cap(k, t, { police: MONO, couleur: CY, suivi: "0.12em" }), ...liste.map(([l, u]) => lien(k, l, u, { taille: 15, h: "40px", padH: "10px", extra: { marginLeft: "-10px" }, survol: { backgroundColor: S.fg, color: S.bg, textDecoration: "none" }, focus: CY }))], { gap: "4px", flexBasis: "0px", flexGrow: 1, minWidth: "200px" });
    const colonnes = grille([
      col("// l'école", [["Accueil", "/"], ["Actualités", "/blog"], ["Contact", "/contact"]]),
      col("// candidater", [["Créer mon compte", "/inscription"], ["Se connecter", "/connexion"], ["Questions fréquentes", "/faq"]]),
      col("// ressources", [["Catalogue", "/catalogue"], ["Boutique", "/boutique"], ["Cookies", "/cookies"]]),
    ], [3, 2, 1], { columnGap: "40px", rowGap: "24px" }, { rowGap: "20px" }, { rowGap: "18px" });
    // 3 · signature (nom en mono), réseaux en carrés de 44 px, mentions
    const signature = tx(k, `<p><span style="color:${CY}">&gt;</span>&nbsp;ligne_42</p>`, { fontFamily: MONO, fontWeight: "700", fontSize: "22px", lineHeight: 1, color: S.fg, letterSpacing: "0.02em" });
    const reseaux = reseauxIcones(k, env, ["x", "linkedin", "youtube"], { taille: 44, forme: "square", fond: S.alt, contour: S.line, couleur: S.fg, survolFond: CY, survolCouleur: S.bg, focus: CY });
    const signe = k.row([signature, reseaux], { rowGap: "20px", columnGap: "32px", alignItems: "center", justifyContent: "space-between", width: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const b = G.bande(k, [fenetre, colonnes, trait(k, S.line), signe, mentions], { colonne: true, gap: "44px", padV: ["80px", "64px", "44px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "16px"], max: "1180px", fond: S.bg, innerMobile: { rowGap: "30px" }, nom: "École de code" });
    return [G.racine(k, [surFond(b, { bureau: svgDe(1440, 1000, grilleFine(1440, 1000, CY)), tablette: svgDe(820, 1300, grilleFine(820, 1300, CY)), mobile: svgDe(390, 1500, grilleFine(390, 1500, CY)) })])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-069 « Journée d'École » — école fictive « Les Petits Chênes ». Couleurs de craie sur fond crème, formes rondes. Une FRISE de la journée (accueil, classe, cantine, sortie) en quatre bulles pastel reliées par une ligne pointillée ;
// un petit soleil en SVG (fixe) à côté du nom. Les HEURES sont des EXEMPLES (dits dans une note) : l'école met les siennes. Andika (titres, 700) + Mulish. Texte sombre uniquement sur les bulles.
// Mobile : la frise devient verticale, le long d'une ligne pointillée à gauche. Pas de newsletter. Écarts : le soleil ne bouge pas (aucune animation sûre dans le moteur) ; pas d'apparition en fondu.
const petitsChenes = identite({
  key: "c069", label: "Crème et couleurs de craie", humeur: "light",
  fond: "#fff2cc", texte: "#2b2250", discret: "#55497e", accent: "#f45b69", surface: "#ffffff",
  police: "font.mulish", titres: "font.andika", rayon: "28px", rayonBouton: "999px", ombre: "none", poids: "700", bordure: "0px", ligne: "#2b225040",
});
const soleilSvg = (c, c2) => { let r = ""; for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, x1 = 36 + 21 * Math.cos(a), y1 = 36 + 21 * Math.sin(a), x2 = 36 + 31 * Math.cos(a), y2 = 36 + 31 * Math.sin(a); r += `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}"/>`; } return `<svg viewBox="0 0 72 72" width="64" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><g stroke="${c2}" stroke-width="5" stroke-linecap="round">${r}</g><circle cx="36" cy="36" r="15" fill="${c}"/><circle cx="31" cy="34" r="2" fill="#2b2250"/><circle cx="41" cy="34" r="2" fill="#2b2250"/><path d="M30 41q6 5 12 0" fill="none" stroke="#2b2250" stroke-width="2" stroke-linecap="round"/></svg>`; };
const pointsDeco = (w, h, couleur) => { let d = ""; for (let y = 24, j = 0; y < h; y += 44, j++) for (let x = (j % 2) * 22 + 20; x < w; x += 44) d += `M${x} ${y}h0`; return `<path d="${d}" stroke="${couleur}" stroke-width="5" stroke-linecap="round" opacity="0.13" fill="none"/>`; };
const journeeEcole = modeleV2({
  id: identifiantV2(69, "journee-d-ecole"), concept: "c-069-journee-d-ecole", name: "Journée d'école", family: FAM,
  description: "Une frise de la journée d'école en quatre bulles pastel reliées par un fil pointillé, un petit soleil, trois pilules pour les parents. Crème, couleurs de craie, formes rondes ; verticale sur mobile. Les heures sont des exemples.",
  tags: ["école primaire", "frise", "journée type", "parents", "crème", "pastel", "formes rondes"],
  identity: petitsChenes,
  racine: racineDe("#fff2cc"),
  widgets: ["text", "html", "link", "bizcontact", "social", "copyright", "bizlegal", "container"],
  compose(k, env, G) {
    const S = k.S, ENCRE = S.fg, CORAIL = S.accent;
    // 1 · en-tête : soleil + nom de l'école fictive, centrés (pile centrée, logo en tête)
    const soleil = { type: "html", props: { html: soleilSvg("#ffc93c", "#ffb020") }, ...sty({ width: "64px", minWidth: "64px", lineHeight: 0.8, fontSize: "0px" }, undefined, { width: "52px", minWidth: "52px" }) };
    const nom = tx(k, "Les Petits Chênes", { fontFamily: S.head, fontWeight: "700", fontSize: "fluid:34-68", lineHeight: 1.08, color: ENCRE, letterSpacing: "-0.01em", textAlign: "center" }, undefined, { flexGrow: 0, flexShrink: 1 });
    const tete = k.col([k.row([soleil, nom], { gap: "18px", justifyContent: "center", flexWrap: "nowrap", alignItems: "center" }, undefined, { gap: "12px" }), cap(k, "Une journée à l'école", { couleur: S.mute, suivi: "0.2em", align: "center" })], { gap: "10px", alignItems: "stretch", width: "100%" });
    // 2 · la frise : quatre bulles (heures d'EXEMPLE), fil pointillé entre elles (grand écran), ligne pointillée à gauche (mobile)
    const bulles = [["8 h 30", "Accueil", "On se retrouve, on range son sac.", "#ffd3d9", "60px 60px 60px 16px"], ["9 h 00", "En classe", "Lecture, jeux de nombres, découvertes.", "#cdeedd", "60px 16px 60px 60px"], ["12 h 00", "Cantine", "Le repas, puis un temps de jeu dehors.", "#cfe6f8", "16px 60px 60px 60px"], ["16 h 30", "Sortie", "On range, on se dit à demain.", "#ddd3f7", "60px 60px 16px 60px"]];
    const bulle = ([h, t, d, fond, rayon]) => k.col([
      tx(k, h, { fontFamily: S.head, fontWeight: "700", fontSize: "38px", lineHeight: 1, color: ENCRE }, undefined, { fontSize: "32px" }),
      tx(k, t, { fontFamily: S.head, fontWeight: "700", fontSize: "21px", lineHeight: 1.2, color: ENCRE }),
      tx(k, d, { fontSize: "16px", lineHeight: 1.5, color: ENCRE }),
    ], { backgroundColor: fond, ...coins(rayon), paddingTop: "32px", paddingBottom: "32px", paddingLeft: "30px", paddingRight: "28px", gap: "8px", flexBasis: "0px", flexGrow: 1, minWidth: "190px", alignItems: "flex-start" },
    { flexBasis: "44%", flexGrow: 0, minWidth: "0px", paddingTop: "28px", paddingBottom: "28px" }, { flexBasis: "auto", flexGrow: 0, width: "100%", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "22px", paddingRight: "20px" });
    const fil = () => ({ type: "container", hideOn: ["tablet", "mobile"], children: [], ...sty({ width: "34px", minWidth: "34px", flexShrink: 0, borderStyle: "dotted", borderWidth: "0px", borderTopWidth: "4px", borderColor: CORAIL, alignSelf: "center" }) });
    const enfantsFrise = []; bulles.forEach((b, i) => { if (i) enfantsFrise.push(fil()); enfantsFrise.push(bulle(b)); });
    const frise = k.row(enfantsFrise, { flexWrap: "nowrap", alignItems: "stretch", justifyContent: "space-between", width: "100%", gap: "6px" },
      { flexWrap: "wrap", justifyContent: "center", rowGap: "20px", columnGap: "20px" },
      { flexDirection: "column", flexWrap: "nowrap", alignItems: "stretch", rowGap: "18px", columnGap: "0px", borderStyle: "dotted", borderWidth: "0px", borderLeftWidth: "4px", borderColor: CORAIL, paddingLeft: "20px" });
    const note = tx(k, "Horaires d'exemple : l'école remplace ici ses propres heures.", { fontSize: "13px", lineHeight: 1.4, color: S.mute, textAlign: "center" });
    // 3 · les trois pilules pour les parents, les coordonnées sur une ligne, les réseaux en disques de 44 px
    const pilulesParents = GK.pilules([["Inscrire mon enfant", "/contact"], ["Cantine et garderie", "/faq"], ["Contact", "/contact"]], { taille: 16, poids: "700", fond: "#ffffff", contour: ENCRE, survolFond: ENCRE, survolCouleur: S.bg, focus: ENCRE, gap: "12px" })(k, env, true);
    const lignes = k.col([G.code("contact:inline|")(k, env, true)], { alignItems: "center", width: "100%" });
    const reseaux = reseauxIcones(k, env, ["facebook", "instagram", "youtube"], { taille: 44, forme: "circle", fond: "#ffffff", couleur: ENCRE, survolFond: ENCRE, survolCouleur: S.bg, focus: ENCRE });
    const reseauxC = k.row([reseaux], { justifyContent: "center", width: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env, true);
    mentions.children[1].styles.desktop.textAlign = "center"; // liens légaux centrés comme le copyright (pile centrée)
    const b = G.bande(k, [tete, frise, note, pilulesParents, lignes, reseauxC, trait(k, S.line), mentions], { colonne: true, gap: "34px", aligne: "stretch", padV: ["104px", "80px", "60px"], padB: ["40px", "36px", "32px"], padH: ["48px", "32px", "16px"], max: "1180px", fond: S.bg, innerMobile: { rowGap: "26px" }, nom: "Journée d'école" });
    return [G.racine(k, [surFond(b, { bureau: svgDe(1440, 820, pointsDeco(1440, 820, CORAIL)), tablette: svgDe(820, 1300, pointsDeco(820, 1300, CORAIL)), mobile: svgDe(390, 1700, pointsDeco(390, 1700, CORAIL)) })])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-070 « Parcours Formation » — organisme fictif « Cap Compétences ». Trois ÉTAPES en grands chiffres reliées par des chevrons (Candidater, Financer, Démarrer) précèdent une grille sobre : filets de 1 à 6 px, aucune boîte, angles droits.
// Blanc-vert #f3f6f4, vert profond #096d43 (le #0b7a4b du concept descendait à 4,38:1 sur le vert pâle). Work Sans (titres, 800) + Source Serif 4 (texte). Contenu des étapes = EXEMPLE (réel, à saisir par le client) ; les mentions de certification se saisissent dans les Données de l'entreprise
// (immobilisations affichées sous le pied par le widget, jamais écrites ici). Mobile : étapes verticales (chevrons vers le bas), rubriques de liens en accordéon.
const capCompetences = identite({
  key: "c070", label: "Blanc-vert et vert profond", humeur: "light",
  fond: "#f3f6f4", texte: "#15281f", discret: "#475a50", accent: "#096d43", surface: "#e1eae4",
  police: "font.source-serif-4", titres: "font.work-sans", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#15281f40",
});
const chevron = (c, bas) => bas
  ? `<svg viewBox="0 0 56 28" width="40" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M6 5l22 17L50 5" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  : `<svg viewBox="0 0 28 56" width="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M5 6l17 22L5 50" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const parcours = modeleV2({
  id: identifiantV2(70, "parcours-formation"), concept: "c-070-parcours-formation", name: "Parcours formation", family: FAM,
  description: "Trois étapes en grands chiffres (Candidater, Financer, Démarrer) reliées par des chevrons, puis une grille de liens sobre, le contact, un bouton d'appel et la lettre. Blanc-vert, vert profond, filets fins, aucune boîte.",
  tags: ["formation professionnelle", "étapes", "parcours", "vert", "filets", "serif", "accordéon mobile"],
  identity: capCompetences,
  racine: racineDe("#f3f6f4"),
  widgets: ["text", "html", "button", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider", "container"],
  compose(k, env, G) {
    const S = k.S, V = S.accent, WS = S.head;
    // 1 · LE PARCOURS : bande vert très pâle ; trois étapes (filet vert de 6 px, chiffre géant Work Sans 800, titre, phrase) et deux chevrons
    const etape = (n, t, d) => k.col([
      tx(k, n, { fontFamily: WS, fontWeight: "800", fontSize: "fluid:84-132", lineHeight: 0.9, color: V, letterSpacing: "-0.04em" }),
      tx(k, t, { fontFamily: WS, fontWeight: "800", fontSize: "fluid:24-32", lineHeight: 1.1, color: S.fg, letterSpacing: "-0.01em" }),
      tx(k, d, { fontSize: "17px", lineHeight: 1.55, color: S.mute, maxWidth: "290px" }),
    ], { gap: "10px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "6px", borderColor: V, paddingTop: "20px", flexBasis: "0px", flexGrow: 1, minWidth: "0px", alignItems: "flex-start" }, undefined, { flexBasis: "auto", width: "100%", paddingTop: "14px", gap: "6px" });
    const chev = (bas) => ({ type: "html", props: { html: chevron(V, bas) }, hideOn: bas ? ["desktop", "tablet"] : ["mobile"], ...sty({ width: bas ? "40px" : "24px", minWidth: bas ? "40px" : "24px", lineHeight: 0.8, fontSize: "0px", alignSelf: bas ? "flex-start" : "center", flexShrink: 0, marginTop: bas ? "0px" : "40px" }) });
    const etapes = k.row([etape("1", "Candidater", "Déposez votre dossier en ligne et dites-nous ce que vous cherchez."), chev(false), chev(true), etape("2", "Financer", "Voyez avec nous les modes de financement possibles pour votre situation."), chev(false), chev(true), etape("3", "Démarrer", "Rejoignez la prochaine session et commencez à vous former.")],
      { flexWrap: "nowrap", alignItems: "stretch", justifyContent: "space-between", gap: "28px", width: "100%" }, { gap: "20px" }, { flexDirection: "column", alignItems: "stretch", gap: "16px", flexWrap: "nowrap" });
    const entete = k.col([cap(k, "Votre parcours (étapes d'exemple)", { couleur: V, suivi: "0.2em" }), tx(k, "De la candidature à la rentrée, trois étapes", { fontFamily: WS, fontWeight: "700", fontSize: "fluid:22-34", lineHeight: 1.2, color: S.fg, maxWidth: "900px" })], { gap: "10px" });
    const a = G.bande(k, [entete, etapes], { colonne: true, gap: "44px", fond: S.alt, padV: ["88px", "68px", "48px"], padH: ["48px", "32px", "16px"], max: "1180px", innerMobile: { rowGap: "26px" }, nom: "Parcours" });
    // 2 · LA GRILLE : organisme + bouton d'appel + adresse | deux rubriques de liens (accordéon sur mobile) | lettre
    const marque = k.col([tx(k, "Cap Compétences", { fontFamily: WS, fontWeight: "800", fontSize: "30px", lineHeight: 1.1, color: S.fg, letterSpacing: "-0.02em" }),
      tx(k, "Organisme de formation professionnelle", { fontSize: "16px", lineHeight: 1.5, color: S.mute }),
      k.B("Candidater", "/contact", "solid", { fontFamily: WS, fontWeight: "700", fontSize: "16px", minHeight: "52px", paddingLeft: "28px", paddingRight: "28px", borderRadius: "0px", marginTop: "6px" }),
      titreWidget(G.code("contact|")(k, env), { display: "none" })], { gap: "12px", flexBasis: "0px", flexGrow: 2, minWidth: "260px" });
    Moteur.finishNode(S, marque);
    const L = (liste) => liste.map(([l, u]) => () => lien(k, l, u, { taille: 16, h: "40px", survol: { color: V, textDecoration: "underline" } }));
    const rubriques = Moteur.accordionNode(k, env, false, [
      { title: "L'organisme", w: 1, codes: L([["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Contact", "/contact"]]) },
      { title: "Se former", w: 1, codes: L([["Catalogue", "/catalogue"], ["Créer mon compte", "/inscription"], ["Se connecter", "/connexion"], ["Boutique", "/boutique"]]) },
    ], {}, { min: "150px" });
    Object.assign(rubriques.styles.desktop, { columnGap: "36px", alignItems: "flex-start", width: "100%", maxWidth: "100%", marginLeft: "0px", marginRight: "0px", flexBasis: "0px", flexGrow: 2, minWidth: "260px" });
    for (const c of rubriques.children) Object.assign(c.styles.desktop, { fontFamily: WS, color: S.fg, gap: "2px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: S.fg, paddingTop: "14px" });
    for (const c of rubriques.children) c.styles.mobile = { ...(c.styles.mobile || {}), borderTopWidth: "0px", paddingTop: "0px" };
    const abo = G.abonnement({ titre: "Lettre de l'organisme", intro: "Les prochaines sessions et les actualités, par e-mail.", bouton: "S'abonner", largeur: "380px", accent: V, rayonBouton: "0px", soulignement: "2px", styleTitre: { fontFamily: WS, fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.14em", color: S.fg, marginBottom: "6px" } })(k, env);
    const lettre = k.col([abo], { flexBasis: "0px", flexGrow: 2, minWidth: "260px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: S.fg, paddingTop: "14px" });
    const grid = k.row([marque, rubriques, lettre], { rowGap: "40px", columnGap: "56px", alignItems: "flex-start", width: "100%" });
    const reseaux = GK.reseauxTexte([["LinkedIn", "https://www.linkedin.com/"], ["YouTube", "https://www.youtube.com/"], ["Facebook", "https://www.facebook.com/"]], { taille: 15, couleur: S.fg, survol: V })(k, env);
    const certif = Moteur.finishNode(S, k.W("bizlegal", { title: "", showName: true, showForm: true, showRegistrations: true, showPublisher: false, showHost: false, showPages: false, layout: "inline" }, { color: S.mute, fontSize: "13px", fontFamily: S.font }));
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const b = G.bande(k, [grid, reseaux, trait(k, S.fg, "1px"), certif, mentions], { colonne: true, gap: "34px", fond: S.bg, padV: ["72px", "56px", "40px"], padB: ["28px", "28px", "24px"], padH: ["48px", "32px", "16px"], max: "1180px", innerMobile: { rowGap: "24px" }, nom: "Grille" });
    return [G.racine(k, [a, b])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-071 « Cotes de Bibliothèque » — bibliothèque universitaire fictive « Fonds Lemaire ». Les liens sont des ÉTIQUETTES DE DOS DE LIVRE : une cote (000, 100…) en grand Newsreader, un trait pointillé, le libellé. Papier #efe6d2, brun, brique #7a2e22,
// cadre à double filet (passe-partout), lignes de registre très fines en fond. Les cotes sont DÉCORATIVES (une légende le dit) ; les horaires viennent du widget Horaires (état « ouvert » calculé, vide tant que rien n'est saisi).
// Newsreader (titres, 700 ; remplace Vollkorn : ses chiffres bas de casse faisaient lire « 100 » comme « I00 ») + Work Sans. Mobile : étiquettes en deux colonnes de cibles égales. Écart : pas de widget « ouvert-fermé » à part : le widget Horaires fait déjà « ouvert maintenant ».
const fondsLemaire = identite({
  key: "c071", label: "Papier, brun et brique", humeur: "light",
  fond: "#efe6d2", texte: "#2a2218", discret: "#5c4f3c", accent: "#7a2e22", surface: "#e3d6b8",
  police: "font.work-sans", titres: "font.newsreader", rayon: "4px", rayonBouton: "4px", ombre: "none", poids: "700", bordure: "2px", ligne: "#2a221866",
});
const registre = (w, h, couleur) => { let d = ""; for (let y = 34; y < h; y += 34) d += `M0 ${y}H${w}`; return `<path d="${d}" stroke="${couleur}" stroke-width="1" opacity="0.07" fill="none"/>`; };
const cotes = modeleV2({
  id: identifiantV2(71, "cotes-de-bibliotheque"), concept: "c-071-cotes-de-bibliotheque", name: "Cotes de bibliothèque", family: FAM,
  description: "Les liens deviennent des étiquettes de dos de livre : une cote en grand (000, 100…), un trait pointillé, le libellé. Papier, brun et brique, cadre à double filet, horaires d'ouverture en direct. Les cotes sont décoratives.",
  tags: ["bibliothèque", "cotes", "étiquettes", "papier", "brique", "serif", "horaires en direct"],
  identity: fondsLemaire,
  racine: racineDe("#efe6d2"),
  widgets: ["text", "link", "grid", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, B = S.accent, ENCRE = S.fg, PAPIER = "#f8f2e3";
    // 1 · l'en-tête centré : nom du fonds en grand serif, double filet dessous
    const nom = tx(k, "Fonds Lemaire", { fontFamily: S.head, fontWeight: "700", fontSize: "fluid:44-104", lineHeight: 1, letterSpacing: "-0.02em", color: ENCRE, textAlign: "center" });
    const sous = cap(k, "Bibliothèque universitaire (exemple)", { couleur: B, suivi: "0.24em", align: "center" });
    const doubleFilet = k.col([trait(k, ENCRE, "1px"), trait(k, ENCRE, "1px")], { gap: "3px", width: "100%" });
    const tete = k.col([sous, nom], { gap: "14px", alignItems: "stretch", width: "100%" });
    // 2 · l'index de cotes : huit étiquettes (cote décorative + lien) dans un cadre à double filet
    const etiquette = (cote, label, url) => k.col([
      tx(k, cote, { fontFamily: S.head, fontWeight: "700", fontSize: "fluid:40-56", lineHeight: 1, color: B, letterSpacing: "-0.01em" }),
      trait(k, ENCRE, "1px", { borderStyle: "dashed", opacity: 0.5 }),
      lien(k, label, url, { taille: 16, poids: "600", h: "44px", extra: { width: "100%" }, survol: { color: PAPIER, backgroundColor: B, textDecoration: "none" }, focus: B, rayon: "3px", padH: "6px" }),
    ], { backgroundColor: PAPIER, borderStyle: "dashed", borderWidth: "1.5px", borderColor: ENCRE, borderRadius: "10px", paddingTop: "18px", paddingBottom: "12px", paddingLeft: "16px", paddingRight: "16px", gap: "8px" }, undefined, { paddingLeft: "12px", paddingRight: "10px", paddingTop: "14px" });
    const index = grille([etiquette("000", "Accueil du fonds", "/"), etiquette("100", "Catalogue", "/catalogue"), etiquette("200", "Actualités", "/blog"), etiquette("300", "Aide aux lecteurs", "/faq"), etiquette("400", "Mon compte", "/connexion"), etiquette("500", "Inscription", "/inscription"), etiquette("600", "Boutique", "/boutique"), etiquette("700", "Nous écrire", "/contact")],
      [4, 4, 2], { gap: "18px" }, { gap: "16px" }, { gap: "12px" });
    const legende = tx(k, "Les cotes sont un décor : elles ne correspondent à aucun classement réel.", { fontSize: "13px", lineHeight: 1.4, color: S.mute, textAlign: "center" });
    const cadre = k.col([index, legende], { width: "100%", borderStyle: "double", borderWidth: "6px", borderColor: ENCRE, backgroundColor: S.alt, paddingTop: "30px", paddingBottom: "22px", paddingLeft: "30px", paddingRight: "30px", gap: "20px" }, { paddingLeft: "24px", paddingRight: "24px" }, { paddingTop: "16px", paddingBottom: "16px", paddingLeft: "12px", paddingRight: "12px", borderWidth: "4px" });
    // 3 · horaires (en direct), adresse, réseaux en liste de noms
    const heures = k.col([titreWidget(G.code("hours|Horaires d'ouverture")(k, env), { fontFamily: S.head, fontSize: "22px", fontWeight: "700", color: ENCRE, marginBottom: "6px" })], { flexBasis: "0px", flexGrow: 3, minWidth: "260px" });
    const adresse = k.col([titreWidget(G.code("contact|Adresse")(k, env), { fontFamily: S.head, fontSize: "22px", fontWeight: "700", color: ENCRE, marginBottom: "6px" })], { flexBasis: "0px", flexGrow: 3, minWidth: "240px" });
    const reseaux = k.col([tx(k, "Nous suivre", { fontFamily: S.head, fontSize: "22px", fontWeight: "700", color: ENCRE, lineHeight: 1.2 }), GK.reseauxTexte([["Facebook", "https://www.facebook.com/"], ["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15, couleur: ENCRE, survol: B })(k, env)], { gap: "6px", flexBasis: "0px", flexGrow: 3, minWidth: "240px" });
    const infos = k.row([heures, adresse, reseaux], { rowGap: "28px", columnGap: "48px", alignItems: "flex-start", width: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const b = G.bande(k, [tete, doubleFilet, cadre, infos, trait(k, ENCRE, "1px"), mentions], { colonne: true, gap: "36px", padV: ["72px", "56px", "44px"], padB: ["28px", "28px", "24px"], padH: ["48px", "32px", "16px"], max: "1180px", fond: S.bg, innerMobile: { rowGap: "26px" }, nom: "Cotes de bibliothèque" });
    return [G.racine(k, [surFond(b, { bureau: svgDe(1440, 1100, registre(1440, 1100, B)), tablette: svgDe(820, 1500, registre(820, 1500, B)), mobile: svgDe(390, 1900, registre(390, 1900, B)) })])];
  },
}, FAM);

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-072 « Cours Ouverts » — plateforme fictive « Savoirs ». Violet profond vers indigo, jaune de soleil. QUATRE ACCORDÉONS, même sur grand écran : tous ouverts, repliables, à fin chevron (bouton + aria-expanded du moteur).
// Le premier contient le widget Formations (état vide explicite tant que le catalogue est vide). Champ e-mail en pilule. Poppins (titres, 700) + Lato. Un seul jeu de volets, ouverts partout (la fiche les voulait fermés sur mobile : un second jeu masqué aurait doublé les liens).
// Écarts : le chevron est le signe + / − du moteur (pas d'animation de 200 ms) ; contraste calculé au point le plus clair du dégradé.
const savoirs = identite({
  key: "c072", label: "Violet profond et jaune soleil", humeur: "dark",
  fond: "#2d1e7a", texte: "#ffffff", discret: "#d6d0f5", accent: "#ffc857", surface: "#3d2c96",
  police: "font.lato", titres: "font.poppins", rayon: "18px", rayonBouton: "999px", ombre: "none", poids: "700", bordure: "0px", ligne: "#ffffff30",
});
const soleilPoint = (c) => `<svg viewBox="0 0 40 40" width="40" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="11" fill="${c}"/><circle cx="20" cy="20" r="18" fill="none" stroke="${c}" stroke-width="2" opacity="0.5"/></svg>`;
const coursOuverts = modeleV2({
  id: identifiantV2(72, "cours-ouverts"), concept: "c-072-cours-ouverts", name: "Cours ouverts", family: FAM,
  description: "Quatre accordéons ouverts même sur grand écran et repliables d'un clic, avec le widget Formations dans le premier ; champ e-mail en pilule. Dégradé violet vers indigo, jaune soleil.",
  tags: ["e-learning", "accordéons", "cours", "violet", "jaune", "arrondi", "dégradé"],
  identity: savoirs,
  racine: racineDe("#2d1e7a"),
  widgets: ["text", "html", "container", "courselist", "link", "emailsubscribe", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, J = S.accent, PP = S.head;
    // 1 · en-tête : soleil + nom de la plateforme, phrase ; champ e-mail en pilule à droite
    const soleil = { type: "html", props: { html: soleilPoint(J) }, ...sty({ width: "40px", minWidth: "40px", lineHeight: 0.8, fontSize: "0px" }) };
    const nom = tx(k, "Savoirs", { fontFamily: PP, fontWeight: "700", fontSize: "fluid:44-76", lineHeight: 1, color: S.fg, letterSpacing: "-0.03em" });
    const marque = k.col([k.row([soleil, nom], { gap: "14px", flexWrap: "nowrap", alignItems: "center" }), tx(k, "Des cours ouverts à toutes et à tous, à suivre à votre rythme.", { fontSize: "17px", lineHeight: 1.55, color: S.mute, maxWidth: "400px" })], { gap: "14px", flexBasis: "0px", flexGrow: 1, minWidth: "280px" });
    const abo = G.abonnement({ titre: "Nouveaux cours par e-mail", intro: "Recevez les nouveautés de la plateforme.", bouton: "S'abonner", largeur: "460px", accent: J, soulignement: "0px", rayonChamp: "999px", rembChamp: "22px", fondChamp: "#ffffff1f", rayonBouton: "999px", styleTitre: { fontFamily: PP, color: S.fg, fontSize: "17px", fontWeight: "600", textTransform: "none", letterSpacing: "0px", marginBottom: "4px" } })(k, env);
    Object.assign(abo.parts.input.styles.desktop, { borderWidth: "1.5px", borderBottomWidth: "1.5px", borderColor: "#ffffff66", fontSize: "16px" });
    const droite = k.col([abo], { flexBasis: "0px", flexGrow: 1, minWidth: "280px", alignItems: "flex-start", paddingLeft: "22px" }, { paddingLeft: "0px" }, { alignItems: "stretch", paddingLeft: "0px" });
    const haut = k.row([marque, droite], { rowGap: "28px", columnGap: "20px", alignItems: "flex-end", justifyContent: "space-between", width: "100%" });
    // 2 · quatre accordéons : chacun est un conteneur « accordéon » à UN volet (titre = nom du volet, ouvert au départ) 
    const entree = (l, u) => lien(k, l, u, { taille: 16, h: "40px", survol: { color: J, textDecoration: "underline" } });
    const cours = () => k.W("courselist", { count: 3, sort: "recent", showPrice: false, cta: "Découvrir", empty: "Les cours apparaîtront ici dès qu'ils seront publiés." }, { width: "100%", color: S.fg });
    const volet = (titre, enfants) => ({ type: "container", props: { mode: "accordion", accStart: "all", accSingle: false }, children: [{ type: "container", name: titre, children: enfants, ...sty({ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start", paddingBottom: "6px", fontFamily: S.font, fontWeight: "500", fontSize: "16px" }) }],
      ...sty({ display: "flex", flexDirection: "column", gap: "0px", color: S.fg, fontFamily: PP, fontSize: "17px", fontWeight: "600", backgroundColor: S.alt, borderRadius: "18px", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "22px", paddingRight: "22px", width: "100%", minWidth: "0px" }) });
    const volets = grille([
      volet("Apprendre", [cours(), entree("Tout le catalogue", "/catalogue")]),
      volet("Communauté", [entree("Actualités", "/blog"), entree("Questions fréquentes", "/faq"), entree("Contact", "/contact")]),
      volet("Mon espace", [entree("Se connecter", "/connexion"), entree("Créer un compte", "/inscription"), entree("Mes favoris", "/boutique/souhaits")]),
      volet("Boutique", [entree("Boutique", "/boutique"), entree("Mon panier", "/boutique/panier"), entree("Mon compte", "/boutique/compte")]),
    ], [4, 2, 1], { gap: "20px", alignItems: "start" }, { gap: "18px" }, { gap: "14px" });
    // 3 · réseaux en disques de 44 px, mentions
    const reseaux = reseauxIcones(k, env, ["youtube", "instagram", "linkedin"], { taille: 44, forme: "circle", contour: "#ffffff66", couleur: S.fg, survolFond: J, survolCouleur: S.onAccent, focus: J });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bas = k.row([reseaux, mentions], { rowGap: "20px", columnGap: "40px", alignItems: "center", justifyContent: "space-between", width: "100%" }, undefined, { flexDirection: "column", alignItems: "flex-start" });
    const b = G.bande(k, [haut, volets, trait(k, S.line), bas], { colonne: true, gap: "44px", padV: ["96px", "72px", "52px"], padB: ["40px", "36px", "32px"], padH: ["48px", "32px", "16px"], max: "1180px", fond: S.bg, innerMobile: { rowGap: "28px" }, degrade: { from: "#3f2fa0", to: "#2d1e7a", angle: 180 }, nom: "Cours ouverts" });
    return [G.racine(k, [b])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Éducation et université", target: 6, built: true,
  description: "Écoles, universités, formations et bibliothèques : parcours, calendrier, accès rapide aux services.",
  models: [campusBlason, ecoleCode, journeeEcole, parcours, cotes, coursOuverts],
};
