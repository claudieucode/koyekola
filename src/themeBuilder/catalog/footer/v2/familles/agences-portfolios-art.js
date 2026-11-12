// Famille v2 « Agences, portfolios et art » — cible 11 modèles (concepts c-041 à c-051 de docs/footer-v2/CONCEPTS_100.md).
// Tant que `built` est false, la famille n’apporte rien à la bibliothèque PUBLIQUE (la liste actuelle reste intacte) ; passer à true UNIQUEMENT quand models.length === target.
// Les modèles s’écrivent avec ../kit-v2 (modeleV2, identite, gestes G.*) et s’insèrent en mode « solo » (indépendants du site).
// Aides LOCALES à ce fichier (le kit partagé n’est pas modifié) : lien(), texte(), point(), courriel()… construites avec les briques du kit.
// Aucune image, aucun script : les illustrations sont des SVG simples (widget HTML sécurisé), les couleurs sont en hexadécimal, les polices viennent de la bibliothèque auto-hébergée.
const { modeleV2, identifiantV2, identite, G, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");

const FAM = "agences-portfolios-art";

// ── Aides locales ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const px = (t, d) => (t === undefined ? d : typeof t === "number" ? `${t}px` : t);
// lien : un lien fini par le moteur (cibles de 44 px sur mobile) puis états de survol/focus propres au modèle. o : taille, poids, police, couleur, survol { … }, focus (couleur), st (styles en plus), suivi, casse, glisse
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: px(o.taille, "14px"), fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: "none", display: "inline-flex", alignItems: "center", letterSpacing: o.suivi, textTransform: o.casse, lineHeight: o.lh, transitionDuration: G.MOUVEMENT, ...(o.st || {}) }), o.tablette, o.mobile);
  return G.fini(k, n, { hover: { textDecoration: "underline", transform: { x: o.glisse === undefined ? 4 : o.glisse }, ...(o.survol || {}) }, focus: G.focus(o.focus || S.fg) });
}
// texte : un paragraphe (k.T) avec taille, couleur et police du modèle
const texte = (k, html, o = {}, tablette, mobile) => k.T(html.startsWith("<") ? html : `<p>${html}</p>`, compact({ fontSize: px(o.taille, "14px"), lineHeight: o.lh ?? 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, fontWeight: o.poids, letterSpacing: o.suivi, textTransform: o.casse, textAlign: o.align, maxWidth: o.largeur, ...(o.st || {}) }), tablette, mobile);
// point : pastille ronde pleine (conteneur vide)
const point = (couleur, d = 10, extra = {}) => ({ type: "container", children: [], styles: { desktop: compact({ width: `${d}px`, height: `${d}px`, borderRadius: "999px", backgroundColor: couleur, flexShrink: 0, ...extra }) } });
// filet plein : trait horizontal pleine largeur
const filetPlein = (k, couleur, ep = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: ep, marginTop: "0px", marginBottom: "0px" });
// mise en forme d'une partie de widget
const partie = (n, cle, desktop, etats, mobile) => { Moteur.mergePart(n, cle, { styles: { desktop, ...(mobile ? { mobile } : {}) }, ...(etats ? { states: etats } : {}) }); return n; };
// e-mail de l'entreprise (widget existant) habillé ; rien n'est affiché tant que l'e-mail n'est pas renseigné dans les Données de l'entreprise
function courriel(k, o = {}) {
  const S = k.S, base = compact({ fontSize: px(o.taille, "16px"), fontFamily: o.police || S.font, fontWeight: o.poids || "600", lineHeight: o.lh || 1.1, letterSpacing: o.suivi, overflowWrap: "anywhere" });
  const n = k.W("bizemail", { prefix: o.prefixe || "", text: "", showIcon: false }, { color: o.couleur || S.fg, ...base, ...(o.st || {}) }, o.tablette, o.mobile);
  Moteur.finishNode(S, n);
  // o.tailles = [bureau, tablette, mobile] en px : la partie « lien » n'accepte pas la taille fluide (le test de contraste lit des px)
  const [tb, tt, tm] = o.tailles || [], taillePart = tb ? { fontSize: `${tb}px` } : {};
  partie(n, "link", { ...base, ...taillePart, color: o.couleur || S.fg, textDecoration: o.souligne ? "underline" : "none" }, { hover: { color: o.survol || S.accent, textDecoration: "underline" }, focus: G.focus(o.focus || S.fg) }, tm ? { fontSize: `${tm}px` } : undefined);
  if (tt) Moteur.mergePart(n, "link", { styles: { tablet: { fontSize: `${tt}px` } } });
  if (o.prefixe) partie(n, "prefix", { ...base, color: o.couleurPrefixe || S.mute, fontWeight: "400" });
  return n;
}
// réseaux
const RESEAUX = [["Instagram", "https://www.instagram.com/"], ["LinkedIn", "https://www.linkedin.com/"], ["Vimeo", "https://vimeo.com/"], ["Behance", "https://www.behance.net/"], ["YouTube", "https://www.youtube.com/"]];
const reseauxPlats = (k, liste, o = {}) => G.ligne(k, liste.map(([l, u]) => lien(k, `${l}${o.fleche === false ? "" : " ↗"}`, u, { taille: o.taille || 14, poids: o.poids || "600", couleur: o.couleur, police: o.police, survol: o.survol, focus: o.focus, suivi: o.suivi, casse: o.casse })), { gap: o.gap || "0px 24px", aligne: "center" });
// mentions : copyright automatique + pages légales renseignées (« Cookies » reste dans la ligne légale de la plateforme) ; liens alignés sur la ligne de base du copyright
const mentions = (taille = 12, o = {}) => (k, env) => {
  const S = k.S, t = `${taille}px`;
  const copy = k.W("copyright", { owner: "{{business.legalname}}", text: "Tous droits réservés." }, { color: o.couleur || S.mute, fontSize: t, fontFamily: S.font });
  const lg = k.W("bizlegal", { title: "", showName: false, showForm: false, showRegistrations: false, showPublisher: false, showHost: false, showPages: true, layout: "inline", hintMissing: true }, { color: o.liens || S.fg, fontSize: t, fontFamily: S.font, marginTop: "-4px" }, { marginTop: "0px" }, { marginTop: "0px" });
  Moteur.finishNode(S, lg);
  return k.row([copy, lg], { ...G.gaps("10px 28px"), alignItems: "center", justifyContent: o.centre ? "center" : "space-between", width: "100%" }, undefined, { rowGap: "14px" });
};
// colonne qui passe sous les autres : tablette (≤ 1023) pleine ligne, mobile revient à la largeur minimale
const bloc = (k, enfants, o = {}) => G.colonne(k, enfants, { min: "0px", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" }, ...o });

// ── c-041 « Bonjour Écrit » — REFONTE (archétype E : deux demi-pages bord à bord) ────────────────────────────────────────────────────────────
// Idée : « Dites bonjour. » en lettres géantes (lien vers Contact) remplace tout bloc de contact. Le pied est coupé en DEUX DEMI-PAGES de couleurs opposées : à gauche, sable et noir chaud, le message ; à droite, noir chaud,
// les actions (l'adresse e-mail de l'entreprise en très grand, vermillon, soulignée, puis les liens et les réseaux). Une fine bande sable porte les mentions. Plus Jakarta Sans 800 + Inter. Angles droits.
// Honnêteté : l'adresse e-mail vient des Données de l'entreprise (rien d'inventé) ; sans elle, « Dites bonjour. » reste le seul appel et mène à la page Contact.
const bonsoir = identite({
  key: "c041", label: "Beige sable, noir chaud, vermillon", humeur: "light",
  fond: "#efe5d3", texte: "#150a06", discret: "#4a3a30", accent: "#c4301a", surface: "#f8f0e0",
  police: "font.inter", titres: "font.plus-jakarta-sans", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "1px", ligne: "#150a0640",
});
const bonjourEcrit = modeleV2({
  id: identifiantV2(41, "bonjour-ecrit"), concept: "c-041-bonjour-ecrit",
  name: "Bonjour écrit", family: FAM,
  description: "Une agence qui ne dit qu'une chose : « Dites bonjour. » en lettres géantes sur sable. Le pied est coupé en deux demi-pages bord à bord ; à droite, sur noir chaud, son adresse e-mail en très grand, vermillon.",
  tags: ["agence", "phrase géante", "e-mail géant", "deux demi-pages", "beige", "vermillon", "typographie"],
  identity: bonsoir,
  racine: { desktop: { backgroundColor: "#efe5d3", gap: "0px" } },
  widgets: ["sitetitle", "link", "bizemail", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, SABLE = "#efe5d3", NUIT = "#150a06", VERM = "#ff6a45";
    // ── demi-page de gauche : le message ──
    const marque = G.code("title:22")(k, env);
    const consigne = G.libelle("Un projet ? Une idée ? Un café ?", { couleur: S.mute, poids: "600" })(k);
    const bonjour = lien(k, "Dites bonjour.", "/contact", { taille: "fluid:44-124", poids: "800", police: S.head, suivi: "-0.035em", lh: 0.92, couleur: NUIT, glisse: 10, survol: { color: S.accent, textDecoration: "none" }, focus: S.accent, st: { display: "block" } });
    const traitVerm = filetPlein(k, S.accent, "8px"); traitVerm.styles.desktop.width = "96px";
    const gauche = G.colonne(k, [G.colonne(k, [marque, consigne], { gap: "14px", min: "0px" }), G.colonne(k, [traitVerm, bonjour], { gap: "28px", min: "0px", aligne: "stretch" })], {
      poids: 1, min: "420px", aligne: "stretch", justifie: "space-between", gap: "64px",
      extra: { backgroundColor: SABLE, paddingTop: "72px", paddingBottom: "64px", paddingLeft: "48px", paddingRight: "48px", boxSizing: "border-box", minHeight: "540px" },
      tablette: { paddingLeft: "32px", paddingRight: "32px", paddingTop: "56px", paddingBottom: "48px", minHeight: "0px" }, mobile: { paddingLeft: "20px", paddingRight: "20px", paddingTop: "44px", paddingBottom: "40px", minHeight: "0px", minWidth: "0px" },
    });
    // ── demi-page de droite : les actions ──
    const mail = courriel(k, { taille: "fluid:24-58", tailles: [58, 44, 26], poids: "800", police: S.head, couleur: VERM, souligne: true, suivi: "-0.02em", survol: SABLE, focus: VERM });
    const ou = G.libelle("Ou écrivez-nous", { couleur: "#d9cbb5", poids: "600" })(k);
    const liens = k.col([["Blog", "/blog"], ["FAQ", "/faq"], ["Contact", "/contact"], ["Connexion", "/connexion"]].map(([l, u]) => lien(k, l, u, { taille: 18, poids: "700", couleur: SABLE, survol: { color: VERM, transform: { x: 8 } }, focus: VERM, st: { display: "flex", minHeight: "48px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#efe5d333" } })), { gap: "0px", alignItems: "stretch", width: "100%" });
    const reseaux = reseauxPlats(k, RESEAUX.slice(0, 3), { couleur: SABLE, survol: { color: VERM }, focus: VERM });
    const droite = G.colonne(k, [ou, mail, liens, reseaux], {
      poids: 1, min: "420px", aligne: "stretch", justifie: "flex-end", gap: "28px",
      extra: { backgroundColor: NUIT, paddingTop: "72px", paddingBottom: "64px", paddingLeft: "48px", paddingRight: "48px", boxSizing: "border-box", minHeight: "540px" },
      tablette: { paddingLeft: "32px", paddingRight: "32px", paddingTop: "56px", paddingBottom: "48px", minHeight: "0px" }, mobile: { paddingLeft: "20px", paddingRight: "20px", paddingTop: "44px", paddingBottom: "40px", minHeight: "0px", minWidth: "0px" },
    });
    const moities = G.bande(k, [gauche, droite], { fond: SABLE, max: "100%", padV: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], gap: "0px", aligne: "stretch", nom: "Deux demi-pages" });
    const mentionsBande = G.bande(k, [filetPlein(k, S.line), mentions(12)(k, env)], { colonne: true, gap: "20px", max: "1280px", padV: ["28px", "24px", "20px"], padB: ["24px", "24px", "20px"], padH: ["48px", "32px", "20px"], fond: SABLE, nom: "Mentions" });
    return [G.racine(k, [moities, mentionsBande])];
  },
}, FAM);

// ── c-042 « Nom Rogné Rouge » ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : le nom du studio (« Lueur », marque fictive à remplacer) est si grand qu'il remplit les 8/12 de la page et que le bas des lettres est rogné par le bord du pied ; à côté, une colonne étroite et minuscule
// (coordonnées, 3 liens, réseaux). Deux couleurs seulement : crème et bleu cobalt ; des filets de 1 px, aucune boîte. Police : Archivo 800 (propre au test) à la place de Dela Gothic One (fentes dans les « e »).
const lueurId = identite({
  key: "c042", label: "Crème et bleu cobalt", humeur: "light",
  fond: "#ece6d6", texte: "#1b34e0", discret: "#3d4fd1", accent: "#1b34e0", surface: "#ddd5c0",
  police: "font.inter", titres: "font.archivo", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "1px", ligne: "#1b34e0",
});
const nomRogneRouge = modeleV2({
  id: identifiantV2(42, "nom-rogne-rouge"), concept: "c-042-nom-rogne-rouge",
  name: "Nom rogné cobalt", family: FAM,
  description: "Le nom du studio en lettres monumentales, rogné par le bord du pied, sur crème et bleu cobalt. Une colonne étroite et minuscule porte les coordonnées, trois liens et les réseaux. Deux couleurs, des filets, aucune boîte.",
  tags: ["studio", "nom monumental", "rogné", "crème", "cobalt", "bicolore", "asymétrique"],
  identity: lueurId,
  racine: { desktop: { backgroundColor: "#ece6d6", gap: "0px" } },
  widgets: ["text", "bizcontact", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · la grille d'information : 4 cases séparées par des filets verticaux (la grille de 12 colonnes se devine), tout en 13-15 px
    const contact = k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: S.fg, fontSize: "14px", lineHeight: 1.55, fontFamily: S.font });
    Moteur.finishNode(S, contact);
    const liens = G.colonne(k, ["Contact|/contact", "Blog|/blog", "FAQ|/faq"].map((x) => { const [l, u] = x.split("|"); return lien(k, l, u, { taille: 15, poids: "700", survol: { color: S.fg } }); }), { gap: "0px", min: "0px" });
    const case_ = (enfants, o = {}) => G.colonne(k, enfants, { poids: 1, min: "200px", gap: "14px", aligne: "stretch", base: "0px",
      extra: { borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: S.line, paddingLeft: "1.4vw", ...(o.extra || {}) },
      tablette: { flexBasis: "40%", ...(o.tablette || {}) }, mobile: { flexBasis: "100%", borderLeftWidth: "0px", paddingLeft: "0px", borderTopWidth: "1px", paddingTop: "16px", ...(o.mobile || {}) } });
    const infos = G.ligne(k, [
      case_([G.libelle("Studio", { couleur: S.fg })(k), texte(k, "Branding, identité visuelle et édition pour des marques qui ont quelque chose à dire.", { taille: 14, couleur: S.fg, largeur: "280px" })], { mobile: { borderTopWidth: "0px", paddingTop: "0px" } }),
      case_([G.libelle("Écrire", { couleur: S.fg })(k), lien(k, "Nous écrire ↗", "/contact", { taille: 15, poids: "700", survol: { color: S.fg } }), contact]),
      case_([G.libelle("Explorer", { couleur: S.fg })(k), liens], { mobile: { flexBasis: "44%" } }),
      case_([G.libelle("Suivre", { couleur: S.fg })(k), G.colonne(k, RESEAUX.slice(0, 3).map(([l, u]) => lien(k, `${l} ↗`, u, { taille: 15, poids: "700", survol: { color: S.fg } })), { gap: "0px", min: "0px" })], { mobile: { flexBasis: "44%", borderTopWidth: "1px", paddingTop: "16px" } }),
    ], { gap: "24px 0px", aligne: "stretch", justifie: "space-between", largeur: "100%" }, undefined, { gap: "20px 4%" });
    // 2 · le nom : 29 vw (la largeur de la page), lettres serrées ; la boîte du texte elle-même est coupée à 56 % de la hauteur d'une lettre : le bas des lettres est rogné
    const nom = { type: "heading", props: { text: "Lueur", level: "2", tag: "p" }, styles: { desktop: { fontSize: "31.5vw", lineHeight: 0.8, letterSpacing: "-0.055em", fontFamily: S.head, fontWeight: "800", color: S.fg, height: "0.66em", overflow: "hidden", whiteSpace: "nowrap", marginLeft: "-0.03em", marginTop: "0px", marginBottom: "0px" } } };
    const bande = G.bande(k, [filetPlein(k, S.line), infos, mentions(12)(k, env), nom], { colonne: true, gap: "36px", max: "100%", padV: ["56px", "48px", "36px"], padB: ["0px", "0px", "0px"], padH: ["4vw", "5vw", "20px"], fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Nom rogné" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── c-043 « Nom et Heure » ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : une ligne de commande de développeur : statut du moment (« Ouvert maintenant » calculé par la plateforme sur les horaires saisis), disponibilité, e-mail, nom à droite — en mono, anthracite et orange ;
// dessous, une seconde ligne minuscule (liens séparés par des points, réseaux en texte). Martian Mono + DM Sans.
// LIMITE ASSUMÉE : pas d'horloge à la seconde (cela demande un script, interdit dans un pied) ; le statut est celui du widget « Horaires » (calculé à l'affichage). Sans horaires saisis, la cellule n'apparaît pas.
const horloge = identite({
  key: "c043", label: "Anthracite et orange", humeur: "dark",
  fond: "#161616", texte: "#f2f0ea", discret: "#a9a7a0", accent: "#ff7a2f", surface: "#222222",
  police: "font.dm-sans", titres: "font.martian-mono", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f2f0ea33",
});
const nomEtHeure = modeleV2({
  id: identifiantV2(43, "nom-et-heure"), concept: "c-043-nom-et-heure",
  name: "Ligne de commande", family: FAM,
  description: "Un pied d'une seule ligne pour portfolio de développeur : statut du moment, disponibilité, e-mail et nom, en police mono sur anthracite, avec une pastille orange. Dessous, des liens minuscules séparés par des points.",
  tags: ["portfolio", "développeur", "ligne unique", "mono", "anthracite", "orange", "statut"],
  identity: horloge,
  racine: { desktop: { backgroundColor: "#161616", gap: "0px" } },
  widgets: ["sitetitle", "bizhours", "text", "bizemail", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, mono = S.head;
    const vide = (n) => n;
    // cellule 1 · statut du moment (widget Horaires : seul l'état « Ouvert maintenant » est gardé, les lignes des jours sont masquées)
    const statut = k.W("bizhours", { title: "En ce moment", showOpenNow: true, groupDays: true, showExceptions: false, showNote: false, closedLabel: "Fermé" }, { color: S.fg, fontSize: "14px", fontFamily: mono, flexGrow: 0, flexShrink: 0 }, undefined, { width: "42%" });
    Moteur.finishNode(S, statut);
    partie(statut, "title", { fontFamily: mono, fontSize: "11px", fontWeight: "500", color: S.mute, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "4px" });
    partie(statut, "status", { fontFamily: mono, fontSize: "15px", fontWeight: "600", color: S.accent });
    partie(statut, "row", { display: "none" });
    // cellule 2 · disponibilité (texte à modifier) précédée de la pastille orange
    const dispo = G.colonne(k, [G.libelle("Disponibilité", { police: mono, poids: "500" })(k), k.row([point(S.accent, 9), texte(k, "Ouverts aux projets", { taille: 15, couleur: S.fg, police: mono, poids: "600", lh: 1.2 })], { gap: "9px", alignItems: "center", flexWrap: "nowrap" })], { gap: "4px", min: "0px", poids: 0, base: "auto", mobile: { flexBasis: "50%" } });
    // cellule 3 · e-mail de l'entreprise (widget existant ; invisible tant qu'il n'est pas renseigné)
    // e-mail de l'entreprise : le mot « Écrire » est le préfixe du widget (il disparaît avec l'adresse quand elle n'est pas renseignée)
    const mail = courriel(k, { prefixe: "Écrire › ", couleurPrefixe: S.mute, taille: 15, poids: "600", police: mono, couleur: S.fg, survol: S.accent, focus: S.accent, lh: 1.2 });
    const mailCell = G.colonne(k, [mail], { gap: "4px", min: "0px", poids: 0, base: "auto", mobile: { flexBasis: "100%" } });
    const marque = G.colonne(k, [G.libelle("Portfolio", { police: mono, poids: "500" })(k), G.code("title:16")(k, env)], { gap: "0px", min: "0px", poids: 0, base: "auto", soi: "flex-end", aligne: "flex-end", tablette: { alignSelf: "flex-start", alignItems: "flex-start" }, mobile: { alignSelf: "flex-start", alignItems: "flex-start", flexBasis: "100%" } });
    const ligneUne = k.row([statut, dispo, mailCell, { type: "spacer", props: { size: "16" }, styles: { desktop: { flexGrow: 1, flexShrink: 1, height: "0px" }, tablet: { display: "none" } } }, marque], { ...G.gaps("20px 56px"), alignItems: "center", justifyContent: "flex-start", width: "100%", flexWrap: "wrap" }, G.gaps("20px 32px"), G.gaps("18px 24px"));
    const cadre = { type: "container", children: [ligneUne], styles: { desktop: { borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderBottomWidth: "1px", borderColor: S.line, paddingTop: "22px", paddingBottom: "22px", width: "100%" }, mobile: { paddingTop: "20px", paddingBottom: "20px" } } };
    // seconde ligne minuscule : liens séparés par des points, réseaux en texte, mentions
    const points = (liste) => liste.flatMap((l, i) => (i ? [texte(k, "·", { taille: 14, couleur: S.mute, st: { paddingLeft: "10px", paddingRight: "10px" } }), l] : [l]));
    const liens = G.ligne(k, points([["Blog", "/blog"], ["FAQ", "/faq"], ["Contact", "/contact"]].map(([l, u]) => lien(k, l, u, { taille: 13, police: mono, poids: "500" }))), { gap: "0px", aligne: "center" }, { gap: "0px" });
    const reseaux = G.ligne(k, points(RESEAUX.slice(0, 3).map(([l, u]) => lien(k, l, u, { taille: 13, police: mono, poids: "500", couleur: S.mute, survol: { color: S.accent } }))), { gap: "0px", aligne: "center" });
    const basse = G.ligne(k, [liens, reseaux], { gap: "0px 40px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const bande = G.bande(k, [cadre, basse, mentions(12, { couleur: S.mute })(k, env)], { colonne: true, gap: "14px", max: "1280px", padV: ["28px", "24px", "24px"], padB: ["20px", "20px", "16px"], padH: ["48px", "32px", "20px"], fond: S.bg, nom: "Ligne de commande" });
    void vide;
    return [G.racine(k, [bande])];
  },
}, FAM);


// ── Aides pour les modèles suivants ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// grille : grille CSS ; cols / rows = [bureau, tablette, mobile] (gabarits « 1fr 1fr », « 220px auto »…)
const grille = (enfants, o = {}) => ({ type: "grid", children: enfants, styles: {
  desktop: compact({ display: "grid", gridTemplate: o.cols[0], gridRowsTemplate: o.rows && o.rows[0], ...G.gaps(o.gap || "12px"), width: o.largeur || "100%", ...(o.st || {}) }),
  tablet: compact({ gridTemplate: o.cols[1], gridRowsTemplate: o.rows && o.rows[1], ...(o.tab || {}) }),
  mobile: compact({ gridTemplate: o.cols[2], gridRowsTemplate: o.rows && o.rows[2], ...(o.mob || {}) }),
} });
// générateur pseudo-aléatoire à graine (mulberry32) : les illustrations sont identiques à chaque démarrage
const alea = (graine) => { let a = graine >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const r1 = (n) => Math.round(n * 10) / 10;
// un SVG décoratif dans le widget HTML sécurisé (formes seulement : jamais de script ni de style), aria-hidden
// (le CSS de la plateforme impose height:auto aux SVG : la hauteur suit la largeur ; une variante étroite pour le mobile)
const svgHtml = (k, large, etroit, st) => [
  { ...k.W("html", { html: large }, compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st })), hideOn: ["mobile"] },
  { ...k.W("html", { html: etroit }, compact({ width: "100%", display: "block", fontSize: "0px", lineHeight: 0.8, ...st })), hideOn: ["desktop", "tablet"] },
];

// ── c-044 « Planche contact » ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : six cases numérotées 01 à 06, comme une planche contact développée : chaque case est un VRAI lien (Accueil, Journal, Catalogue, Boutique, Aide, Contact) qui s'inverse au survol ; à côté, une colonne étroite
// (nom, coordonnées, réseaux). Noir et blanc ; numéros en mono (IBM Plex Mono), texte en Hanken Grotesk. Les images d'une série ne sont pas nécessaires : les cases sont des aplats de gris, prêtes à devenir des liens vers des séries.
const noirBlanc = identite({
  key: "c044", label: "Noir et blanc, planche contact", humeur: "dark",
  fond: "#101010", texte: "#f0f0f0", discret: "#b0b0b0", accent: "#e5e5e5", surface: "#1c1c1c",
  police: "font.hanken-grotesk", titres: "font.ibm-plex-mono", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f0f0f066",
});
const plancheContact = modeleV2({
  id: identifiantV2(44, "planche-contact"), concept: "c-044-planche-contact",
  name: "Planche contact", family: FAM,
  description: "Six cases numérotées de 01 à 06 façon planche contact : chaque case est un lien qui s'inverse au survol. Une colonne étroite porte le nom, les coordonnées et les réseaux. Noir, blanc et numéros en mono.",
  tags: ["photographe", "planche contact", "noir et blanc", "mono", "cases", "portfolio"],
  identity: noirBlanc,
  racine: { desktop: { backgroundColor: "#101010", gap: "0px" } },
  widgets: ["sitetitle", "grid", "link", "text", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, mono = S.head;
    const VUES = [["01", "Accueil", "/"], ["02", "Journal", "/blog"], ["03", "Catalogue", "/catalogue"], ["04", "Boutique", "/boutique"], ["05", "Aide", "/faq"], ["06", "Contact", "/contact"]];
    // chaque case : aplat de gris avec un léger dégradé (une « photo » sombre à vignette), inversé en gris clair au survol
    const DEGRADES = [["#34343a", "#171718", 150], ["#2c2c2c", "#151515", 200], ["#3a3a3a", "#1a1a1c", 120], ["#262628", "#111111", 170], ["#333333", "#161616", 210], ["#2e2e32", "#141414", 135]];
    const cases = VUES.map(([n, l, u], i) => {
      const a = G.fini(k, k.LINK(`${n}  ${l}`, u, { fontFamily: mono, fontSize: "13px", fontWeight: "400", letterSpacing: "0.1em", textTransform: "uppercase", color: S.fg, backgroundColor: DEGRADES[i][1], gradient: { from: DEGRADES[i][0], to: DEGRADES[i][1], angle: DEGRADES[i][2] }, borderStyle: "solid", borderWidth: "1px", borderColor: "#f0f0f066", display: "flex", alignItems: "flex-end", justifyContent: "flex-start", paddingTop: "14px", paddingBottom: "14px", paddingLeft: "14px", paddingRight: "14px", aspectRatio: "3/2", textDecoration: "none", transitionDuration: G.MOUVEMENT }), { hover: { backgroundColor: S.fg, gradient: { from: S.fg, to: "#d4d4d4", angle: 160 }, color: S.bg, textDecoration: "none" }, focus: G.focus(S.fg) });
      return a;
    });
    const planche = grille(cases, { cols: ["1fr 1fr 1fr", "1fr 1fr 1fr", "1fr 1fr"], gap: "6px", mob: { rowGap: "6px" } });
    const legende = G.ligne(k, [G.libelle("Planche n° 01", { police: mono, poids: "400", couleur: S.fg })(k), G.libelle("6 vues", { police: mono, poids: "400" })(k)], { justifie: "space-between", largeur: "100%", gap: "8px" });
    const gauche = G.colonne(k, [legende, planche], { poids: 8, min: "300px", gap: "12px", aligne: "stretch", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } });
    const marque = Moteur.finishNode(S, k.siteTitle({ fontFamily: S.font, fontSize: "30px", fontWeight: "700", letterSpacing: "-0.02em", lineHeight: 1.1 }));
    const contact = k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: S.fg, fontSize: "14px", lineHeight: 1.55, fontFamily: S.font });
    Moteur.finishNode(S, contact);
    const droite = G.colonne(k, [marque, texte(k, "Photographe indépendant·e. Séries, commandes et tirages d'art.", { taille: 15, largeur: "300px" }), contact, reseauxPlats(k, RESEAUX.slice(0, 2).concat([RESEAUX[3]]), { gap: "0px 20px", taille: 14 })], {
      poids: 4, min: "240px", gap: "18px", aligne: "flex-start", soi: "stretch", extra: { borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: S.line, paddingLeft: "32px" },
      tablette: { flexBasis: "100%", borderLeftWidth: "0px", paddingLeft: "0px", borderTopWidth: "1px", paddingTop: "28px" }, mobile: { flexBasis: "100%", borderLeftWidth: "0px", paddingLeft: "0px", borderTopWidth: "1px", paddingTop: "24px" } });
    const corps = G.ligne(k, [gauche, droite], { gap: "36px 48px", aligne: "stretch", justifie: "space-between", largeur: "100%" });
    const bande = G.bande(k, [corps, filetPlein(k, S.line), mentions(12)(k, env)], { colonne: true, gap: "32px", max: "1280px", padV: ["88px", "64px", "48px"], padB: ["40px", "36px", "32px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "24px" }, nom: "Planche contact" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── c-045 « Cartel de musée » ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : trois petits cartels blancs à filet fin, comme les étiquettes d'un musée, posés sur un passe-partout blanc encadré d'un trait noir sur gris de mur : adresse, horaires, parcours. Un petit rond rouge
// annonce le vernissage (texte à modifier : « à annoncer »). Libre Franklin (texte) et Libre Baskerville (titres de cartel, en italique). Les coordonnées et horaires viennent des Données de l'entreprise.
const murGalerie = identite({
  key: "c045", label: "Gris de mur et rouge vernissage", humeur: "light",
  fond: "#f4f4f2", texte: "#1a1a1a", discret: "#666666", accent: "#c0392b", surface: "#ffffff",
  police: "font.libre-franklin", titres: "font.libre-baskerville", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#1a1a1a",
});
const cartelMusee = modeleV2({
  id: identifiantV2(45, "cartel-de-musee"), concept: "c-045-cartel-de-musee",
  name: "Cartel de musée", family: FAM,
  description: "Trois cartels façon musée, à filet fin, sur un passe-partout blanc encadré de noir et un gris de mur : adresse, horaires et parcours. Un petit rond rouge annonce le vernissage. Libre Baskerville en italique.",
  tags: ["galerie", "musée", "cartel", "passe-partout", "gris", "rouge", "serif"],
  identity: murGalerie,
  racine: { desktop: { backgroundColor: "#f4f4f2", gap: "0px" } },
  widgets: ["sitetitle", "text", "bizcontact", "bizhours", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, serif = S.head;
    const marque = Moteur.finishNode(S, k.siteTitle({ fontFamily: serif, fontSize: "34px", fontWeight: "700", lineHeight: 1.1, letterSpacing: "-0.01em" }));
    const vernissage = k.row([point(S.accent, 10), texte(k, "Vernissage : à annoncer", { taille: 13, couleur: S.fg, poids: "600" })], { gap: "9px", alignItems: "center", flexWrap: "nowrap" });
    const entete = G.ligne(k, [marque, vernissage], { gap: "14px 32px", aligne: "center", justifie: "space-between", largeur: "100%" });
    // un cartel : numéro + titre en italique + filet + contenu
    const cartel = (num, titre, contenu, o = {}) => G.colonne(k, [
      texte(k, `N° ${num}`, { taille: 12, couleur: S.mute, casse: "uppercase", suivi: "0.14em", poids: "600" }),
      texte(k, titre, { taille: 24, couleur: S.fg, police: serif, lh: 1.15, st: { fontStyle: "italic", fontWeight: "400" } }),
      k.divider({ width: "40px", borderColor: S.fg, borderTopWidth: "1px", marginTop: "2px", marginBottom: "2px" }),
      ...contenu,
    ], { poids: 1, min: "250px", gap: "12px", aligne: "stretch", extra: { backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "1px", borderColor: S.fg, paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px", ...(o.extra || {}) },
      tablette: { flexBasis: o.pleine ? "100%" : "44%" }, mobile: { flexBasis: "100%" } });
    const contact = k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: S.fg, fontSize: "14px", lineHeight: 1.55, fontFamily: S.font });
    Moteur.finishNode(S, contact);
    const heures = k.W("bizhours", { title: "", showOpenNow: true, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: S.fg, fontSize: "14px", fontFamily: S.font });
    Moteur.finishNode(S, heures);
    partie(heures, "status", { color: S.fg, fontWeight: "700", fontFamily: S.font });
    // lien de cartel : ligne pleine largeur, s'inverse au survol
    const ligneLien = (l, u) => lien(k, l, u, { taille: 14, poids: "600", st: { paddingTop: "9px", paddingBottom: "9px", paddingLeft: "10px", paddingRight: "10px", marginLeft: "-10px", marginRight: "-10px", alignSelf: "stretch", justifyContent: "space-between", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#1a1a1a33" }, glisse: 0, survol: { backgroundColor: S.fg, color: "#ffffff", textDecoration: "none" } });
    const c1 = cartel("1", "Nous trouver", [texte(k, "Une visite, une question, un achat ? Écrivez-nous.", { taille: 14, couleur: S.mute }), contact, ligneLien("Nous écrire", "/contact")]);
    const c2 = cartel("2", "Horaires", [texte(k, "Les jours et heures d'ouverture.", { taille: 14, couleur: S.mute }), heures, ligneLien("Questions fréquentes", "/faq")]);
    const c3 = cartel("3", "Parcours", [ligneLien("Journal", "/blog"), ligneLien("Catalogue", "/catalogue"), ligneLien("Boutique", "/boutique"), ligneLien("Mon compte", "/connexion")], { pleine: true });
    const rangee = G.ligne(k, [c1, c2, c3], { gap: "20px", aligne: "stretch", largeur: "100%" });
    // passe-partout : cadre noir de 1,5 px, 28 px de blanc, puis le cartel
    const passe = { type: "container", children: [rangee], styles: { desktop: { borderStyle: "solid", borderWidth: "1px", borderColor: S.fg, paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", width: "100%" }, mobile: { paddingTop: "14px", paddingBottom: "14px", paddingLeft: "14px", paddingRight: "14px" } } };
    const bande = G.bande(k, [entete, passe, reseauxPlats(k, RESEAUX.slice(0, 2), { taille: 13 }), filetPlein(k, "#1a1a1a33"), mentions(12)(k, env)], { colonne: true, gap: "28px", max: "1280px", padV: ["80px", "64px", "44px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "16px"], fond: S.bg, innerMobile: { rowGap: "20px" }, nom: "Cartel de musée" });
    return [G.racine(k, [bande])];
  },
}, FAM);


// ── c-046 « Néon en Mouvement » ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : le nom du studio en lettres VIDES au contour rose (comme un tube de néon éteint, contour allumé), sur un violet nuit coupé en diagonale ; dessous, des liens géants en capitales et une barre rose qui rayonne.
// Michroma (statique, large, rendu propre : Unbounded du concept est défectueux en gras) + Space Grotesk. LIMITE ASSUMÉE : le contour est fixe (le tracé animé du concept demande des widgets Motion Studio, non essentiels) : aucun mouvement, donc rien à couper sous « mouvement réduit ».
const nuitNeon = identite({
  key: "c046", label: "Violet nuit et rose néon", humeur: "dark",
  fond: "#0a0612", texte: "#ffffff", discret: "#c9c0dd", accent: "#ff2e93", surface: "#150c24",
  police: "font.space-grotesk", titres: "font.michroma", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "2px", ligne: "#ff2e9366",
});
const neonMouvement = modeleV2({
  id: identifiantV2(46, "neon-en-mouvement"), concept: "c-046-neon-en-mouvement",
  name: "Néon contour", family: FAM,
  description: "Le nom du studio en lettres creuses au contour rose néon sur violet nuit coupé en diagonale. Dessous : des liens géants en capitales, une barre rose qui rayonne, l'e-mail et les réseaux en liste.",
  tags: ["motion design", "néon", "contour", "violet", "rose", "diagonale", "capitales"],
  identity: nuitNeon,
  racine: { desktop: { backgroundColor: "#150c24", gap: "0px" } },
  widgets: ["heading", "link", "bizemail", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    // le nom : lettres au remplissage violet (contraste ≥ 3:1 exigé par le test) et contour rose de 2 px
    const nom = { type: "heading", props: { text: "HALO", level: "2", tag: "p" }, styles: { desktop: { fontSize: "268px", lineHeight: 1, letterSpacing: "0em", fontFamily: S.head, fontWeight: "400", color: "#6f4ec4", textStrokeWidth: "4px", textStrokeColor: S.accent, marginTop: "0px", marginBottom: "0px", whiteSpace: "nowrap" }, tablet: { fontSize: "21vw", textStrokeWidth: "3px" }, mobile: { fontSize: "21vw", textStrokeWidth: "2px" } } };
    const tube = { type: "container", children: [], styles: { desktop: { width: "100%", height: "4px", backgroundColor: S.accent, shadow: { x: 0, y: 0, blur: 22, spread: 2, color: "#ff2e93" } } } };
    const GEANTS = [["Journal", "/blog"], ["Catalogue", "/catalogue"], ["Questions", "/faq"], ["Contact", "/contact"]];
    const liste = G.colonne(k, GEANTS.map(([l, u]) => lien(k, `${l} →`, u, { taille: "fluid:30-60", poids: "700", casse: "uppercase", suivi: "0.01em", lh: 1.12, glisse: 12, survol: { color: S.accent, textDecoration: "none" }, focus: S.accent })), { poids: 7, min: "280px", gap: "2px", aligne: "flex-start", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } });
    const cote = G.colonne(k, [
      courriel(k, { prefixe: "Écrire · ", couleurPrefixe: S.mute, taille: "20px", poids: "700", couleur: S.fg, survol: S.accent, focus: S.accent, souligne: true }),
      G.libelle("Suivre", { couleur: S.accent, })(k), reseauxPlats(k, RESEAUX.slice(1, 5), { fleche: false, taille: 15, gap: "0px 22px", casse: "uppercase", suivi: "0.08em", survol: { color: S.accent } }),
    ], { poids: 5, min: "260px", gap: "14px", aligne: "flex-start", soi: "flex-end", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } });
    const corps = G.ligne(k, [liste, cote], { gap: "32px 48px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    const bande = G.bande(k, [nom, tube, corps, mentions(12)(k, env)], {
      colonne: true, gap: "40px", max: "1280px", padV: ["72px", "56px", "44px"], padB: ["40px", "36px", "32px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Néon contour",
      degrade: { from: "#0a0612", to: "#150c24", angle: 172, extra: [{ color: "#0a0612", at: 58 }, { color: "#150c24", at: 58 }] },
    });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── c-047 « Gouache et Feuilles » ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : un jardin de feuilles et de fleurs « à la gouache » dessiné en SVG (formes simples, deux plans, aucune image lourde) borde le haut du pied ; dessous, au centre : le nom en Gloock, une signature à la main
// (Reenie Beanie), trois liens, les coordonnées sur une ligne et des réseaux en pastilles rondes. Crème rosé, rose brique, brun. L'illustration est un décor : aria-hidden, sans rôle d'information.
function jardin(W = 1440, H = 250) {
  // le SVG s'adapte à la largeur (le CSS de la page impose height:auto) : une variante large (bureau, tablette) et une variante étroite (mobile) ; le feuillage PEND du bord haut du pied
  const R = alea(4107), ent = (n) => Math.round(n), k1 = W / 1440, kx = k1, ky = H / 250, ech = Math.max(0.58, Math.min(1, k1 * 1.05));
  const feuille = (x, y, ang, L) => { const a = (ang * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a), w = L * 0.32, tx = x + L * c, ty = y + L * sn, m = L * 0.5; return `M${ent(x)} ${ent(y)}Q${ent(x + m * c - w * sn)} ${ent(y + m * sn + w * c)} ${ent(tx)} ${ent(ty)}Q${ent(x + m * c + w * sn)} ${ent(y + m * sn - w * c)} ${ent(x)} ${ent(y)}Z`; };
  const pt = (c, t) => { const u = 1 - t; return [u * u * u * c[0][0] + 3 * u * u * t * c[1][0] + 3 * u * t * t * c[2][0] + t * t * t * c[3][0], u * u * u * c[0][1] + 3 * u * u * t * c[1][1] + 3 * u * t * t * c[2][1] + t * t * t * c[3][1]]; };
  const echelle = (c) => c.map(([x, y]) => [x * kx, y * ky]);
  const miroir = (c) => c.map(([x, y]) => [W - x, y]);
  const groupes = new Map(); // couleur → sous-chemins (un seul <path> par couleur : SVG léger)
  const ajoute = (couleur, d) => groupes.set(couleur, (groupes.get(couleur) || "") + d);
  const fond = ["#a9bb97", "#93a883", "#7f9a73"], devant = ["#5f8059", "#4d704b", "#6c8b61", "#3f6143"];
  const tige = (c, n, palette, taille) => {
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), [x, y] = pt(c, t), [x2, y2] = pt(c, Math.min(1, t + 0.02)), ang = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
      for (const cote of [-1, 1]) if (R() < 0.9) ajoute(palette[Math.floor(R() * palette.length)], feuille(x, y, ang + cote * (32 + R() * 42), taille * ech * (0.65 + R() * 0.7) * (1 - 0.4 * t)));
    }
  };
  const stems = [[[-40, H + 20], [130, H - 30], [150, 80], [330, 36]], [[-30, H + 10], [220, H + 10], [260, H - 70], [520, H - 60]], [[-20, H + 20], [60, 140], [40, 60], [120, 10]]].map((c) => (W < 600 ? c.map(([x, y]) => [x * 1.6, y]) : c));
  const dedans = (c) => echelle(c.map(([x, y]) => [x, H === 250 ? y : (y / 250) * H]).map(([x, y]) => [x * (1440 / 1440), y]));
  stems.forEach((c0, i) => {
    const c = c0.map(([x, y]) => [x * kx, (y / 250) * H]);
    const n = W < 600 ? 9 : 14;
    tige(c, n, fond, 78); tige(miroir(c), n, fond, 78);
    if (i < 2) { const d = c.map(([x, y]) => [x + 40 * kx, y + 18 * ky]); tige(d, W < 600 ? 7 : 11, devant, 60); tige(miroir(d), W < 600 ? 7 : 11, devant, 60); }
  });
  void dedans;
  for (let i = 0; i < (W < 600 ? 8 : 20); i++) ajoute(devant[Math.floor(R() * devant.length)], feuille((380 + R() * 680) * kx, H + 4 - R() * 22 * ky, -100 + R() * 40, (40 + R() * 40) * ech));
  let corps = "";
  for (const [couleur, d] of groupes) corps += `<path fill="${couleur}" d="${d}"/>`;
  const petales = ["#c04a4a", "#e08a8a", "#f1b48c", "#e9c46a"];
  [[330, 36, 17, 0], [520, H - 60, 14, 1], [120, 10, 15, 2], [250, 120, 12, 3], [190, 175, 11, 0]].forEach(([x0, y0, e0, j]) => {
    const x = (W < 600 ? x0 * 1.6 : x0) * kx, y = (y0 / 250) * H, e = e0 * ech;
    for (const [xx, jj] of [[x, j], [W - x, j + 1]]) {
      let g = `<g transform="translate(${ent(xx)} ${ent(y)})"><g fill="${petales[jj % 4]}">`;
      for (let i = 0; i < 6; i++) { const an = (i * Math.PI) / 3; g += `<circle cx="${ent(Math.cos(an) * e * 1.1)}" cy="${ent(Math.sin(an) * e * 1.1)}" r="${ent(e * 0.95)}"/>`; }
      corps += `${g}</g><circle r="${ent(e * 0.7)}" fill="#f4d58d"/></g>`;
    }
  });
  const svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0 ${H}) scale(1 -1)">${corps}</g></svg>`;
  if (svg.length > 19000) throw new Error(`jardin : SVG trop long (${svg.length}) pour le widget HTML (20 000 caractères).`);
  return svg;
}
const gouacheId = identite({
  key: "c047", label: "Crème rosé, brique et brun", humeur: "soft",
  fond: "#fdf1e4", texte: "#3b2a2a", discret: "#6b5050", accent: "#c04a4a", surface: "#f7dfc8",
  police: "font.nunito", titres: "font.gloock", rayon: "999px", rayonBouton: "999px", ombre: "none", poids: "700", bordure: "1px", ligne: "#3b2a2a33",
});
const gouacheFeuilles = modeleV2({
  id: identifiantV2(47, "gouache-et-feuilles"), concept: "c-047-gouache-et-feuilles",
  name: "Gouache et feuilles", family: FAM,
  description: "Un jardin de feuilles et de fleurs à la gouache, dessiné en SVG, borde le haut du pied. Dessous : le nom en Gloock, une signature manuscrite, trois liens, les coordonnées sur une ligne et des réseaux en pastilles rondes.",
  tags: ["illustratrice", "gouache", "feuilles", "SVG", "crème rosé", "brique", "manuscrit"],
  identity: gouacheId,
  racine: { desktop: { backgroundColor: "#fdf1e4", gap: "0px" } },
  widgets: ["html", "sitetitle", "text", "link", "bizcontact", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, main = "font.reenie-beanie";
    const dessin = svgHtml(k, jardin(1440, 250), jardin(390, 170), { backgroundColor: S.bg });
    const signature = texte(k, "avec amour, à la gouache", { taille: 44, couleur: S.accent, police: main, lh: 1, align: "center", st: { fontWeight: "400" } }, { fontSize: "40px" }, { fontSize: "36px" });
    const nom = Moteur.finishNode(S, k.siteTitle({ fontFamily: S.head, fontSize: "46px", fontWeight: "400", lineHeight: 1.1, textAlign: "center", letterSpacing: "-0.01em" }, undefined, { fontSize: "38px" }));
    const liens = G.ligne(k, [["Contact", "/contact"], ["Journal", "/blog"], ["FAQ", "/faq"]].map(([l, u]) => lien(k, l, u, { taille: 16, poids: "700", survol: { color: "#a33f3f" }, glisse: 0 })), { gap: "0px 36px", aligne: "center", justifie: "center" });
    const contact = k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "inline" }, { color: S.mute, fontSize: "14px", fontFamily: S.font, textAlign: "center", justifyContent: "center" });
    Moteur.finishNode(S, contact);
    const reseaux = G.code("socials:instagram+pinterest+youtube")(k, env, true);
    const centre = G.colonne(k, [signature, nom, liens, contact, reseaux], { gap: "16px", aligne: "center", poids: 1, min: "0px", soi: "center", extra: { width: "100%", maxWidth: "640px", textAlign: "center" } });
    const haut = G.bande(k, [centre], { colonne: true, aligne: "center", gap: "0px", max: "720px", padV: ["44px", "36px", "32px"], padB: ["24px", "20px", "20px"], padH: ["48px", "32px", "20px"], fond: S.bg, nom: "Contenu" });
    const bas = G.bande(k, [mentions(12, { centre: true })(k, env)], { colonne: true, aligne: "center", gap: "0px", max: "900px", padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], fond: S.bg, nom: "Mentions" });
    return [G.racine(k, [...dessin, haut, bas])];
  },
}, FAM);

// ── c-048 « Grille Brutale » ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : un tableau HTML assumé : 11 cases à bordures noires de 3 px, chacune est un lien (ou un bloc de coordonnées) et s'inverse au survol ; ombre dure décalée sans flou ; vert acide, noir, un rouge alerte.
// Space Mono (propre : statique, sans effet de gras) + Work Sans. Le texte reste NOIR sur vert acide (le concept l'exige : #000 sur #C8FF00 = 17:1). Sur mobile : 2 colonnes.
const acide = identite({
  key: "c048", label: "Vert acide, noir et rouge alerte", humeur: "light",
  fond: "#c8ff00", texte: "#000000", discret: "#2b2b2b", accent: "#ff2d00", surface: "#ffffff",
  police: "font.work-sans", titres: "font.space-mono", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "3px", ligne: "#000000",
});
const grilleBrutale = modeleV2({
  id: identifiantV2(48, "grille-brutale"), concept: "c-048-grille-brutale",
  name: "Grille brutale", family: FAM,
  description: "Un tableau assumé : onze cases à bordure noire de 3 px, chacune est un lien ou un bloc de coordonnées qui s'inverse au survol, avec une ombre dure décalée. Vert acide, noir et un rouge alerte, en Space Mono.",
  tags: ["collectif", "brutaliste", "grille", "vert acide", "noir", "mono", "bordures"],
  identity: acide,
  racine: { desktop: { backgroundColor: "#c8ff00", gap: "0px" } },
  widgets: ["sitetitle", "grid", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, mono = S.head;
    const NOIR = "#000000", ROUGE = "#ff2d00";
    const cellule = (l, u, fond, o = {}) => lien(k, l, u, { taille: 16, poids: "700", police: mono, casse: "uppercase", suivi: "0.02em", couleur: o.couleur || NOIR, glisse: 0,
      survol: { backgroundColor: fond === NOIR ? S.bg : NOIR, color: fond === NOIR ? NOIR : S.bg, textDecoration: "none" }, focus: o.focus || (fond === NOIR ? S.bg : NOIR),
      st: { backgroundColor: fond, borderStyle: "solid", borderWidth: "0px", borderRightWidth: "3px", borderBottomWidth: "3px", borderColor: NOIR, paddingTop: "18px", paddingBottom: "18px", paddingLeft: "18px", paddingRight: "18px", minHeight: "100px", alignItems: "flex-end", alignSelf: "stretch", ...(o.st || {}) } });
    const contact = k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: NOIR, fontSize: "14px", lineHeight: 1.5, fontFamily: mono, fontWeight: "400" });
    Moteur.finishNode(S, contact);
    // case « écrire » : toujours un lien vers Contact ; les coordonnées de l'entreprise s'y ajoutent quand elles sont renseignées
    const caseContact = { type: "stack", children: [lien(k, "Nous écrire ↗", "/contact", { taille: 16, poids: "700", police: mono, casse: "uppercase", couleur: NOIR, glisse: 0, survol: { backgroundColor: NOIR, color: "#ffffff", textDecoration: "none" } }), contact], styles: { desktop: { display: "flex", flexDirection: "column", gap: "8px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "0px", borderRightWidth: "3px", borderBottomWidth: "3px", borderColor: NOIR, paddingTop: "14px", paddingBottom: "14px", paddingLeft: "18px", paddingRight: "18px", gridColumnSpan: 2, alignSelf: "stretch", justifyContent: "flex-end", minHeight: "100px" }, mobile: { gridColumnSpan: 2 } } };
    const A = S.bg, B = "#ffffff";
    const cases = [
      cellule("Accueil ↗", "/", B), cellule("Journal ↗", "/blog", A), cellule("Catalogue ↗", "/catalogue", A), cellule("Boutique ↗", "/boutique", NOIR, { couleur: A }),
      cellule("FAQ ↗", "/faq", A), cellule("Contact ↗", "/contact", ROUGE), cellule("Connexion ↗", "/connexion", B), cellule("Inscription ↗", "/inscription", A),
      cellule("Instagram ↗", "https://www.instagram.com/", A), cellule("YouTube ↗", "https://www.youtube.com/", B), caseContact,
    ];
    const tableau = { ...grille(cases, { cols: ["1fr 1fr 1fr 1fr", "1fr 1fr 1fr 1fr", "1fr 1fr"], gap: "0px", st: { borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderLeftWidth: "3px", borderColor: NOIR, backgroundColor: A, shadow: { x: 10, y: 10, blur: 0, spread: 0, color: "#000000" } }, mob: { shadow: { x: 6, y: 6, blur: 0, spread: 0, color: "#000000" } } }) };
    const marque = Moteur.finishNode(S, k.siteTitle({ fontFamily: mono, fontSize: "28px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "-0.02em", color: NOIR }));
    const etiquette = texte(k, "COLLECTIF D'ART · TABLEAU DES LIENS", { taille: 12, couleur: NOIR, police: mono, poids: "400", st: { borderStyle: "solid", borderWidth: "3px", borderColor: NOIR, paddingTop: "6px", paddingBottom: "6px", paddingLeft: "10px", paddingRight: "10px", backgroundColor: "#ffffff" } });
    const entete = G.ligne(k, [marque, etiquette], { gap: "12px 24px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const bande = G.bande(k, [entete, tableau, mentions(12, { couleur: NOIR, liens: NOIR })(k, env)], { colonne: true, gap: "36px", max: "1280px", padV: ["72px", "56px", "44px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "26px" }, nom: "Grille brutale" });
    return [G.racine(k, [bande])];
  },
}, FAM);


// ── c-049 « Index des Projets » ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : la liste EST le décor : six lignes numérotées 01 à 06, en grand, séparées par un filet fin, qui glissent de 4 px au survol (Accueil, Journal, Catalogue, Boutique, Aide, Contact : de vrais liens) ; à droite, les trois
// derniers projets publiés (widget « Liste dynamique », message d'état vide si rien n'est publié) puis l'e-mail et les réseaux. Gris pierre et encre, une seule famille : Hind.
const encrePierre = identite({
  key: "c049", label: "Encre noire et gris pierre", humeur: "dark",
  fond: "#1a1a1a", texte: "#f2f1ed", discret: "#b9b6ad", accent: "#f2f1ed", surface: "#262626",
  police: "font.hind", titres: "font.hind", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#f2f1ed40",
});
const indexProjets = modeleV2({
  id: identifiantV2(49, "index-des-projets"), concept: "c-049-index-des-projets",
  name: "Index des projets", family: FAM,
  description: "Un index numéroté de 01 à 06 en grand, séparé par des filets fins et qui glisse au survol, comme la liste de projets d'un directeur artistique. À droite : les derniers articles publiés, l'e-mail et les réseaux.",
  tags: ["directeur artistique", "index", "liste numérotée", "gris pierre", "encre", "filets", "projets"],
  identity: encrePierre,
  racine: { desktop: { backgroundColor: "#1a1a1a", gap: "0px" } },
  widgets: ["text", "link", "querylist", "bizemail", "backtotop", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const INDEX = [["01", "Accueil", "/", "Page"], ["02", "Journal", "/blog", "Articles"], ["03", "Catalogue", "/catalogue", "Offres"], ["04", "Boutique", "/boutique", "Achats"], ["05", "Aide", "/faq", "Questions"], ["06", "Contact", "/contact", "Écrire"]];
    const lignes = INDEX.map(([n, l, u, c]) => ({ type: "container", children: [
      texte(k, n, { taille: 13, couleur: S.mute, st: { minWidth: "34px", fontVariantNumeric: undefined } }),
      lien(k, l, u, { taille: "fluid:30-56", poids: "500", lh: 1.15, suivi: "-0.015em", glisse: 4, st: { flexGrow: 1, minHeight: "44px" } }),
      texte(k, c, { taille: 13, couleur: S.mute, st: { textAlign: "right" } }),
    ], styles: { desktop: { display: "flex", flexDirection: "row", alignItems: "center", gap: "16px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: S.line, paddingTop: "6px", paddingBottom: "6px", width: "100%" } } }));
    const index = G.colonne(k, [G.libelle("Index", { couleur: S.fg })(k), ...lignes], { poids: 7, min: "300px", gap: "4px", aligne: "stretch", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } });
    const derniers = k.W("querylist", { title: "", source: "posts", mode: "recent", count: 3, layout: "compact", showImage: false, showDate: true, showExcerpt: false, showMeta: false, showCount: false, empty: "Aucun projet publié pour l'instant." }, { color: S.fg, fontSize: "16px", fontFamily: S.font, lineHeight: 1.5 });
    Moteur.finishNode(S, derniers);
    const mail = courriel(k, { prefixe: "Écrire · ", couleurPrefixe: S.mute, taille: "20px", poids: "500", couleur: S.fg, souligne: true, survol: S.fg });
    const haut = G.colonne(k, [G.libelle("Derniers projets", { couleur: S.fg })(k), derniers, k.divider({ width: "100%", borderColor: S.line, borderTopWidth: "1px", marginTop: "6px", marginBottom: "6px" }), mail, reseauxPlats(k, RESEAUX.slice(0, 3), { taille: 15, poids: "500", gap: "0px 22px" })], { gap: "14px", min: "0px", poids: 0, base: "auto", soi: "stretch", aligne: "stretch" });
    const droite = G.colonne(k, [haut, G.code("top")(k, env)], {
      poids: 4, min: "260px", gap: "24px", aligne: "flex-start", soi: "stretch", justifie: "space-between", extra: { borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: S.line, paddingLeft: "40px" },
      tablette: { flexBasis: "100%", borderLeftWidth: "0px", paddingLeft: "0px" }, mobile: { flexBasis: "100%", borderLeftWidth: "0px", paddingLeft: "0px" } });
    const corps = G.ligne(k, [index, droite], { gap: "48px 56px", aligne: "stretch", justifie: "space-between", largeur: "100%" });
    const bande = G.bande(k, [corps, mentions(12)(k, env)], { colonne: true, gap: "56px", max: "1280px", padV: ["96px", "72px", "56px"], padB: ["40px", "36px", "32px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "32px" }, nom: "Index des projets" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── c-050 « Grain de Pellicule » ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : un photogramme : une bande « image » (fuite de lumière ambrée, poussières et rayures dessinées en SVG, perforations de pellicule en haut et en bas) sur un dégradé du noir au bordeaux ; dessous, le nom en Syne, une ligne
// de liens, l'e-mail et les réseaux « ↗ ». Le grain n'est pas un bruit SVG animé (filtres interdits dans le widget HTML) mais des points et rayures vectoriels fixes : pas de mouvement, rien à désactiver en économie d'énergie.
function photogramme(W = 1440, H = 230, BAR = 30) {
  const R = alea(5011), ent = (n) => Math.round(n), mobile = W < 600, trouW = mobile ? 12 : 18, trouH = mobile ? 8 : 12, pas = mobile ? 26 : 36, haut = (BAR - trouH) / 2;
  let s = `<defs><radialGradient id="fuite" cx="0.82" cy="0.35" r="0.55"><stop offset="0" stop-color="#f2a65a" stop-opacity="0.55"/><stop offset="0.5" stop-color="#b8431f" stop-opacity="0.22"/><stop offset="1" stop-color="#140608" stop-opacity="0"/></radialGradient><linearGradient id="cadre" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2c0d14"/><stop offset="1" stop-color="#140608"/></linearGradient></defs>`;
  s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#cadre)"/><rect x="0" y="0" width="${W}" height="${H}" fill="url(#fuite)"/>`;
  // poussières : trois groupes d'opacité (le fichier reste léger) ; rayures : fines lignes verticales
  for (const [op, n, rmax] of [[0.1, 90, 1.4], [0.2, 60, 1.6], [0.34, 30, 1.9]]) { s += `<g fill="#f4ede8" opacity="${op}">`; for (let i = 0; i < Math.round(n * (mobile ? 0.35 : 1)); i++) s += `<circle cx="${ent(R() * W)}" cy="${ent(BAR + R() * (H - 2 * BAR))}" r="${r1(0.6 + R() * rmax)}"/>`; s += "</g>"; }
  s += `<g stroke="#f4ede8" stroke-width="0.8" opacity="0.14">`;
  for (let i = 0; i < (mobile ? 4 : 11); i++) { const x = ent(R() * W); s += `<line x1="${x}" y1="${BAR}" x2="${x + ent(R() * 6 - 3)}" y2="${H - BAR}"/>`; }
  s += "</g>";
  s += `<rect x="0" y="0" width="${W}" height="${BAR}" fill="#000000"/><rect x="0" y="${H - BAR}" width="${W}" height="${BAR}" fill="#000000"/>`;
  let trous = ""; for (let x = pas / 2; x < W; x += pas) trous += `M${ent(x)} ${ent(haut)}h${trouW}v${trouH}h-${trouW}zM${ent(x)} ${ent(H - BAR + haut)}h${trouW}v${trouH}h-${trouW}z`;
  s += `<path d="${trous}" fill="#f4ede8" stroke="#f4ede8" stroke-width="3" stroke-linejoin="round" opacity="0.92"/>`;
  const svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
  if (svg.length > 19000) throw new Error(`photogramme : SVG trop long (${svg.length}).`);
  return svg;
}
const cinemaId = identite({
  key: "c050", label: "Noir bordeaux et ambre", humeur: "dark",
  fond: "#140608", texte: "#f4ede8", discret: "#c9b8b3", accent: "#f2a65a", surface: "#24090e",
  police: "font.manrope", titres: "font.syne", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#f4ede833",
});
const grainPellicule = modeleV2({
  id: identifiantV2(50, "grain-de-pellicule"), concept: "c-050-grain-de-pellicule",
  name: "Grain de pellicule", family: FAM,
  description: "Un photogramme de cinéma : fuite de lumière ambrée, poussières, rayures et perforations dessinées en SVG sur un dégradé du noir au bordeaux. Dessous : le nom en Syne, une ligne de liens, l'e-mail et les réseaux.",
  tags: ["vidéaste", "cinéma", "pellicule", "bordeaux", "ambre", "grain", "photogramme"],
  identity: cinemaId,
  racine: { desktop: { backgroundColor: "#140608", gap: "0px" } },
  widgets: ["html", "sitetitle", "link", "bizemail", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const cadre = svgHtml(k, photogramme(1440, 230, 30), photogramme(390, 130, 20), { backgroundColor: "#140608" });
    const nom = Moteur.finishNode(S, k.siteTitle({ fontFamily: S.head, fontSize: "fluid:38-88", fontWeight: "700", lineHeight: 1, letterSpacing: "-0.035em", color: S.fg }));
    const accroche = texte(k, "Images en mouvement, lumière naturelle et salles obscures.", { taille: 17, couleur: S.mute, largeur: "420px" });
    const gauche = G.colonne(k, [G.libelle("Réalisation", { couleur: S.accent })(k), nom, accroche], { poids: 7, min: "280px", gap: "14px", aligne: "flex-start", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } });
    const mail = courriel(k, { prefixe: "Écrire · ", couleurPrefixe: S.mute, taille: "22px", poids: "600", couleur: S.accent, souligne: true, survol: S.fg, focus: S.accent });
    const droite = G.colonne(k, [mail, reseauxPlats(k, RESEAUX.slice(0, 3).concat([RESEAUX[4]]), { taille: 15, poids: "600", gap: "0px 22px" })], { poids: 5, min: "260px", gap: "10px", aligne: "flex-start", soi: "flex-end", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "100%" } });
    const haut = G.ligne(k, [gauche, droite], { gap: "32px 48px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    const liens = G.ligne(k, [["Journal", "/blog"], ["Catalogue", "/catalogue"], ["Questions", "/faq"], ["Contact", "/contact"]].map(([l, u]) => lien(k, l, u, { taille: 14, poids: "600", casse: "uppercase", suivi: "0.1em", glisse: 0, survol: { color: S.accent } })), { gap: "0px 32px", aligne: "center" });
    const bande = G.bande(k, [haut, filetPlein(k, S.line), liens, mentions(12)(k, env)], { colonne: true, gap: "28px", max: "1280px", padV: ["64px", "48px", "40px"], padB: ["36px", "32px", "28px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "22px" }, nom: "Grain de pellicule", degrade: { from: "#24090e", to: "#140608", angle: 180 } });
    return [G.racine(k, [...cadre, bande])];
  },
}, FAM);

// ── c-051 « Spécimen Typographique » ────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : une planche de spécimen de fonderie : de grandes tuiles « Aa », « 123 », « & », « ¶ » et « @ » en Instrument Serif, chacune est un lien (Journal, Catalogue, Contact, Aide, Écrire) qui s'inverse en bleu électrique
// au survol ; la grande tuile « Aa » occupe deux cases (composition bento). Dessous : nom, coordonnées, réseaux en liste de texte. Blanc cassé, encre, bleu électrique ; Instrument Serif + Inter.
const specimenId = identite({
  key: "c051", label: "Blanc cassé et bleu électrique", humeur: "light",
  fond: "#faf9f6", texte: "#111111", discret: "#5b5b57", accent: "#3b3bff", surface: "#edece6",
  police: "font.inter", titres: "font.instrument-serif", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#11111133",
});
const specimenTypo = modeleV2({
  id: identifiantV2(51, "specimen-typographique"), concept: "c-051-specimen-typographique",
  name: "Spécimen typographique", family: FAM,
  description: "Une planche de spécimen de fonderie en bento : de grandes tuiles Aa, 123, &, ¶ et @ en Instrument Serif, chacune est un lien qui s'inverse en bleu électrique. Dessous : le nom, les coordonnées et les réseaux en liste.",
  tags: ["fonderie", "spécimen", "bento", "tuiles", "serif", "bleu électrique", "typographie"],
  identity: specimenId,
  racine: { desktop: { backgroundColor: "#faf9f6", gap: "0px" } },
  widgets: ["grid", "link", "sitetitle", "bizcontact", "text", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, BLEU = S.accent;
    // une tuile : lien géant (glyphe) ; légende dessous
    const tuile = (glyphe, legende, u, o = {}) => ({ type: "stack", children: [
      lien(k, glyphe, u, { taille: o.taille || "fluid:80-168", poids: "400", police: S.head, lh: 1, suivi: "-0.02em", glisse: 0, couleur: o.couleur || S.fg, survol: { backgroundColor: BLEU, color: "#ffffff", textDecoration: "none" }, focus: BLEU,
        st: { backgroundColor: o.fond || S.alt, borderStyle: "solid", borderWidth: "1px", borderColor: S.fg, justifyContent: "center", alignSelf: "stretch", flexGrow: 1, minHeight: o.hauteur || "190px", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "10px", paddingRight: "10px" } }),
      texte(k, legende, { taille: 12, couleur: S.mute, casse: "uppercase", suivi: "0.12em", poids: "600" }),
    ], styles: { desktop: { display: "flex", flexDirection: "column", gap: "10px", ...(o.span ? { gridColumnSpan: 2, gridRowSpan: 2 } : {}) }, mobile: { gridColumnSpan: o.large ? 2 : 1, gridRowSpan: 1 } } });
    const tuiles = [
      tuile("Aa", "Journal · /blog", "/blog", { span: true, taille: "fluid:120-200", hauteur: "420px" }),
      tuile("123", "Catalogue", "/catalogue"), tuile("&", "Contact", "/contact"), tuile("¶", "Questions", "/faq"), tuile("@", "Écrire", "/contact", { fond: BLEU, couleur: "#ffffff", large: true }),
    ];
    tuiles[0].children[1] = texte(k, "Journal", { taille: 12, couleur: S.mute, casse: "uppercase", suivi: "0.12em", poids: "600" });
    const bento = grille(tuiles, { cols: ["1fr 1fr 1fr 1fr", "1fr 1fr 1fr 1fr", "1fr 1fr"], gap: "16px", st: { gridAutoRows: "auto" } });
    const marque = Moteur.finishNode(S, k.siteTitle({ fontFamily: S.head, fontSize: "40px", fontWeight: "400", lineHeight: 1.05, letterSpacing: "-0.01em" }));
    const contact = k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: S.fg, fontSize: "14px", lineHeight: 1.55, fontFamily: S.font });
    Moteur.finishNode(S, contact);
    const liste = reseauxPlats(k, RESEAUX.slice(0, 3), { taille: 14, fleche: false, poids: "500", gap: "0px 22px", survol: { color: BLEU } });
    const bas = G.ligne(k, [
      G.colonne(k, [marque, texte(k, "Caractères pour l'édition, l'identité et l'écran.", { taille: 15, largeur: "320px" })], { poids: 5, min: "240px", gap: "8px", aligne: "flex-start" }),
      G.colonne(k, [G.libelle("Écrire", { couleur: S.fg })(k), lien(k, "Nous écrire", "/contact", { taille: 15, poids: "600", survol: { color: BLEU } }), contact], { poids: 4, min: "220px", gap: "10px", aligne: "flex-start" }),
      G.colonne(k, [G.libelle("Suivre", { couleur: S.fg })(k), liste], { poids: 3, min: "200px", gap: "10px", aligne: "flex-start" }),
    ], { gap: "28px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const bande = G.bande(k, [bento, filetPlein(k, S.line), bas, mentions(12)(k, env)], { colonne: true, gap: "40px", max: "1280px", padV: ["96px", "72px", "52px"], padB: ["40px", "36px", "32px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Spécimen" });
    return [G.racine(k, [bande])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Agences, portfolios et art", target: 11, built: true,
  description: "Studios, agences, artistes et galeries : noms monumentaux, mises en page d’affiche, esprit d’exposition.",
  models: [bonjourEcrit, nomRogneRouge, nomEtHeure, plancheContact, cartelMusee, neonMouvement, gouacheFeuilles, grilleBrutale, indexProjets, grainPellicule, specimenTypo],
};
