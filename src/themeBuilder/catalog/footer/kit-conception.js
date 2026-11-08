// KIT DE CONCEPTION des pieds de page : le système de conception COMMUN que chaque famille utilise (un seul vocabulaire, un seul moteur : ./moteur.js).
// Un modèle est un objet déclaratif (voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md) :
//   { id, name, family, description, tags, structure: { rows: [C|L|T|Z|A(...)] }, identity, responsive, widgets }
// Ce fichier fournit :
//   · les ÉCHELLES (grille 12 colonnes, conteneurs, espacements 4/8/12/16/24/32/48/64/96, typographie, rayons, ombres, filets) ;
//   · les AMBIANCES (jetons de couleur par ambiance, contrastes AA calculés ET vérifiés à la création) ;
//   · les constructeurs de rangées (C L T Z A) et d'éléments en fonction (widget, reseaux, accordeon, menuDeroulant) ;
//   · modele() / identifiantModele() : validation immédiate d'un modèle (erreurs en clair) ;
//   · les états focus / survol cohérents (réexportés du moteur : linkStates, buttonStates, FOCUS).
// RIEN ici ne duplique le moteur : tout est réutilisé de ./moteur.js (extrait de l'ancien catalogue) et ../kit.js.
require("./elements"); // enregistre newsletter, contactform, socials, shopcats, shoplinks, legallinks
const Moteur = require("./moteur");
const { sty } = require("../kit");
const { PRESET } = require("../identities");
const { socialNode, NETWORK_KEYS } = require("./elements");
const { contrastOf, isHex6, rgbOf, hexOf, legible } = Moteur;

// ── Échelles ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Grille à 12 colonnes : le poids d'une colonne d'une rangée C est sa largeur sur 12 (C([[4, …], [2, …], [3, …], [3, …]]) = 4 + 2 + 3 + 3). Les colonnes passent à la ligne sous leur largeur minimale.
const GRILLE = 12;
const CONTENEURS = { etroit: "760px", moyen: "960px", standard: "1180px", large: "1320px" }; // largeur du contenu intérieur d'une bande (la bande, elle, est pleine largeur)
const ESPACEMENT = { 4: "4px", 8: "8px", 12: "12px", 16: "16px", 24: "24px", 32: "32px", 48: "48px", 64: "64px", 96: "96px" };
const espace = (n) => { if (!ESPACEMENT[n]) throw new Error(`Espacement ${n} hors échelle (4, 8, 12, 16, 24, 32, 48, 64, 96).`); return ESPACEMENT[n]; };
// Hauteur verticale d'une rangée : « pad » accepte xs, sm, md, lg, xl (échelle du moteur) ou une valeur de l'échelle d'espacement ("48px")
const RYTHME = { dense: "sm", normal: "md", aere: "lg", affiche: "xl" };
const TEXTE = { legende: "12px", petit: "13px", base: "14px", moyen: "16px", titre3: "20px", titre2: "28px", titre1: "40px", affiche: "64px", geant: "88px" };
const RAYONS = { aucun: "0px", petit: "4px", moyen: "8px", grand: "14px", pilule: "999px" };
const OMBRES = ["none", "sm", "md", "lg"];
const FILETS = ["none", "thin", "accent", "thick", "double"]; // valeurs de l'option « rule » d'une rangée

// 12 colonnes : vérifie que les poids font 12 et renvoie la rangée C. colonnes12(rangée, [[4, …codes], [8, …codes]], options)
function colonnes12(spans, options = {}) {
  const total = spans.reduce((s, c) => s + (typeof c[0] === "number" ? c[0] : 1), 0);
  if (total !== GRILLE) throw new Error(`colonnes12 : les poids font ${total}, il en faut ${GRILLE}.`);
  return Moteur.C(spans, options);
}

// ── Ambiances : couleurs par jetons, contrastes AA calculés ───────────────────────────────────────────────────────────────────────────
const mix = (a, b, t) => { const x = rgbOf(a), y = rgbOf(b); return hexOf(x.map((v, i) => v + (y[i] - v) * t)); };
const meilleurTexte = (fond) => (contrastOf("#ffffff", fond) >= contrastOf("#111111", fond) ? "#ffffff" : "#111111");
// Paires de couleurs qui doivent atteindre 4,5:1 (texte normal, WCAG AA). Renvoie la liste des paires insuffisantes.
function verifierAmbiance(S) {
  const paires = [["texte/fond", S.fg, S.bg], ["texte/fond alterné", S.fg, S.alt], ["texte secondaire/fond", S.mute, S.bg], ["texte secondaire/fond alterné", S.mute, S.alt], ["texte du bouton/accent", S.onAccent, S.accent], ["texte clair/encre", S.onInk, S.ink]];
  return paires.filter(([, a, b]) => isHex6(a) && isHex6(b) && contrastOf(a, b) < 4.5).map(([nom, a, b]) => ({ paire: nom, ratio: Math.round(contrastOf(a, b) * 100) / 100, minimum: 4.5 }));
}
// humeur : light | brand | dark | edit | soft (réglages d'arrondi, relief, filets de l'identité). Seules fond, texte et accent sont à choisir : le reste est calculé.
function ambiance({ key, label, humeur = "light", fond, texte, accent, police, titres, alt, ink }) {
  if (![fond, texte, accent].every(isHex6)) throw new Error(`Ambiance « ${key} » : fond, texte et accent doivent être des couleurs #rrggbb.`);
  if (!PRESET[humeur]) throw new Error(`Ambiance « ${key} » : humeur inconnue « ${humeur} ».`);
  const altC = alt || mix(fond, texte, 0.06), onAccent = meilleurTexte(accent), inkC = ink || (contrastOf(texte, fond) > 7 && contrastOf("#111827", fond) < 3 ? "#111827" : mix(texte, "#000000", 0.55));
  const base = { key: `amb-${key}`, label, bg: fond, fg: texte, mute: mix(texte, fond, 0.35), alt: altC, accent, onAccent, line: mix(texte, fond, 0.82), ink: inkC, onInk: meilleurTexte(inkC) === "#ffffff" ? "#f8fafc" : "#111111", ...PRESET[humeur], font: police, head: titres || police, mood: humeur };
  const S = legible(base);
  const defauts = verifierAmbiance(S);
  if (defauts.length) throw new Error(`Ambiance « ${key} » : contraste AA insuffisant (${defauts.map((d) => `${d.paire} ${d.ratio}`).join(", ")}).`);
  return S;
}
// Ambiances de départ (couleurs FIXES, polices de la bibliothèque locale). Une famille peut en ajouter via ambiance() dans son module : { identity: ambiance({...}) }.
const AMBIANCES = [
  ambiance({ key: "neutre", label: "Neutre clair", humeur: "light", fond: "#ffffff", texte: "#111827", accent: "#2563eb", police: "font.inter", titres: "font.inter" }),
  ambiance({ key: "ivoire", label: "Ivoire chaleureux", humeur: "light", fond: "#fbf7f0", texte: "#2b2118", accent: "#9a3412", police: "font.karla", titres: "font.dm-sans" }),
  ambiance({ key: "ardoise", label: "Ardoise sombre", humeur: "dark", fond: "#111827", texte: "#f1f5f9", accent: "#38bdf8", police: "font.inter", titres: "font.plus-jakarta-sans" }),
  ambiance({ key: "marine", label: "Marine corporate", humeur: "brand", fond: "#0b2545", texte: "#ffffff", accent: "#fbbf24", police: "font.ibm-plex-sans", titres: "font.ibm-plex-sans" }),
  ambiance({ key: "sauge", label: "Sauge apaisante", humeur: "soft", fond: "#f3f8f4", texte: "#1f3a2b", accent: "#2f7d4f", police: "font.nunito-sans", titres: "font.lora" }),
  ambiance({ key: "technologie", label: "Violet technologie", humeur: "light", fond: "#faf9ff", texte: "#1e1b4b", accent: "#6d28d9", police: "font.inter", titres: "font.lexend" }),
  ambiance({ key: "contraste", label: "Noir et citron", humeur: "dark", fond: "#0d0d0d", texte: "#f5f5f0", accent: "#c6ff3d", police: "font.space-grotesk", titres: "font.space-grotesk" }),
  ambiance({ key: "papier", label: "Papier éditorial", humeur: "edit", fond: "#fffdf8", texte: "#1a1a1a", accent: "#b91c1c", police: "font.source-sans-3", titres: "font.libre-baskerville" }),
  ambiance({ key: "poudre", label: "Rose poudré", humeur: "soft", fond: "#fdf2f8", texte: "#4a1d3a", accent: "#be185d", police: "font.quicksand", titres: "font.fredoka" }),
  ambiance({ key: "institution", label: "Bleu institutionnel", humeur: "light", fond: "#f5f8fc", texte: "#0f2a4a", accent: "#1d4ed8", police: "font.source-sans-3", titres: "font.merriweather" }),
  ambiance({ key: "solidaire", label: "Ambre solidaire", humeur: "soft", fond: "#fffbea", texte: "#3b2a08", accent: "#b45309", police: "font.quicksand", titres: "font.quicksand" }),
  ambiance({ key: "luxe", label: "Doré sur noir", humeur: "dark", fond: "#1c1917", texte: "#f5efe3", accent: "#c9a24b", police: "font.lato", titres: "font.cinzel" }),
];
const AMBIANCE_CLES = AMBIANCES.map((a) => a.key.replace(/^amb-/, "")); // clés courtes utilisées dans `identity` : "neutre", "ivoire"…

// ── Éléments en fonction (à glisser dans une rangée à la place d'un code en texte) ────────────────────────────────────────────────────
// widget(type, props, { desktop, tablet, mobile, hideOn, name }) : un widget existant du Page Builder avec ses réglages et ses réglages PAR ÉCRAN (hideOn: ["mobile"] le masque sur mobile).
function widget(type, props = {}, opts = {}) {
  return (k, env, center) => {
    const node = { type, props, ...sty(Object.fromEntries(Object.entries({ color: k.S.fg, ...(center ? { textAlign: "center" } : {}), ...(opts.desktop || {}) }).filter(([, v]) => v !== undefined)), opts.tablet, opts.mobile) };
    if (opts.hideOn) node.hideOn = opts.hideOn;
    if (opts.name) node.name = opts.name;
    return node;
  };
}
// reseaux([{ network, url }], { taille: 24|32|40|48, forme: circle|square|plain, titre }) : réseaux avec leurs adresses ; les 13 réseaux du widget sont permis (NETWORK_KEYS)
function reseaux(items, opts = {}) {
  return (k, env, center) => {
    for (const it of items) if (!NETWORK_KEYS.includes(it.network)) throw new Error(`reseaux : réseau inconnu « ${it.network} ».`);
    const n = k.social(items.map(({ network, url }) => ({ network, url })), { gap: "10px", ...(center ? { justifyContent: "center" } : {}) });
    if (opts.taille) n.props.size = String(opts.taille);
    if (opts.forme) n.props.shape = opts.forme;
    if (opts.titre) n.props.label = opts.titre;
    return n;
  };
}
// accordeon([{ title, codes }], { start: "none"|"all", single }) : volets repliables SEULEMENT sur mobile (≤ 767 px) ; sur ordinateur et tablette, affichage normal. Boutons-titres de 44 px minimum, clavier, aria-expanded.
const accordeon = (panels, opts = {}) => (k, env, center) => Moteur.accordionNode(k, env, center, panels.map((p) => ({ title: p.title, w: p.w || 1, codes: p.codes })), {}, opts);
// menuDeroulant("Liens utiles", ["menu"]) : un seul volet repliable sur mobile (liste de liens d'un pied très dense)
const menuDeroulant = (titre, codes = ["menu"], opts = {}) => accordeon([{ title: titre, codes }], opts);

// Pages de la plateforme vers lesquelles un modèle peut pointer sans risque de lien mort (routes publiques réelles). Toute autre adresse relative est refusée par les tests : utiliser un menu affecté
// (k.menu → emplacement « Pied de page »), un widget de données (bizlegal, shoplinks…) ou une adresse https://.
const LIENS_PLATEFORME = ["/", "/contact", "/cookies", "/faq", "/connexion", "/inscription", "/blog", "/catalogue", "/boutique", "/boutique/panier", "/boutique/compte", "/boutique/souhaits"];

// ── Modèles ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Identifiant stable : ft-<famille>-<nn>-<nom>. Une fois publié, il n'est JAMAIS réutilisé ni supprimé (voir ../footer-aliases.js).
const identifiantModele = (famille, nn, nom) => `ft-${famille}-${String(nn).padStart(2, "0")}-${nom}`;
const ID_RE = /^ft-[a-z0-9]+(?:-[a-z0-9]+)*-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ROW_KEYS = ["cols", "l", "t", "z", "acc"];
function validerRangee(r, where) {
  if (!r || typeof r !== "object" || ROW_KEYS.filter((k) => r[k]).length !== 1) throw new Error(`${where} : une rangée est C(), L(), T(), Z() ou A() (exactement un type).`);
}
// Valide un modèle et le renvoie tel quel ; lève une erreur en français précisant le champ fautif.
function modele(m, familleAttendue) {
  const w = `Modèle « ${m && m.id} »`;
  if (!m || typeof m !== "object") throw new Error("Modèle : objet attendu.");
  if (!ID_RE.test(m.id || "") || m.id.length > 80) throw new Error(`${w} : identifiant invalide (attendu ft-<famille>-<nn>-<nom>, minuscules, chiffres et tirets, 80 caractères au plus : limite de l'adresse de la bibliothèque).`);
  if (familleAttendue && m.family !== familleAttendue) throw new Error(`${w} : family « ${m.family} » ≠ famille du module « ${familleAttendue} ».`);
  if (familleAttendue && !m.id.startsWith(`ft-${familleAttendue}-`)) throw new Error(`${w} : l'identifiant doit commencer par ft-${familleAttendue}-.`);
  if (!m.name || String(m.name).length > 80) throw new Error(`${w} : nom obligatoire (80 caractères au plus).`);
  if (!m.description || String(m.description).length > 280) throw new Error(`${w} : description obligatoire (280 caractères au plus).`);
  if (!Array.isArray(m.tags) || !m.tags.length) throw new Error(`${w} : au moins une étiquette.`);
  if (!m.structure || !Array.isArray(m.structure.rows) || !m.structure.rows.length) throw new Error(`${w} : structure.rows (au moins une rangée).`);
  m.structure.rows.forEach((r, i) => validerRangee(r, `${w}, rangée ${i + 1}`));
  if (!m.identity) throw new Error(`${w} : identity obligatoire (clé d'ambiance ou ambiance({...})).`);
  if (typeof m.identity === "string" ? !AMBIANCE_CLES.includes(m.identity) : !m.identity.key) throw new Error(`${w} : identité inconnue « ${typeof m.identity === "string" ? m.identity : "?"} » (ambiances : ${AMBIANCE_CLES.join(", ")}).`);
  if (m.widgets !== undefined && !Array.isArray(m.widgets)) throw new Error(`${w} : widgets doit être une liste de types de widgets.`);
  return m;
}

module.exports = {
  // échelles
  GRILLE, CONTENEURS, ESPACEMENT, espace, RYTHME, TEXTE, RAYONS, OMBRES, FILETS, colonnes12,
  // ambiances et contrastes
  ambiance, verifierAmbiance, AMBIANCES, AMBIANCE_CLES, contrastOf, mix,
  // rangées
  C: Moteur.C, L: Moteur.L, T: Moteur.T, Z: Moteur.Z, A: Moteur.A, PAD: Moteur.PAD,
  // éléments en fonction
  widget, reseaux, accordeon, menuDeroulant, socialNode, NETWORK_KEYS,
  // états focus / survol / cible tactile (identiques pour tous les modèles)
  FOCUS: Moteur.FOCUS, linkStates: Moteur.linkStates, buttonStates: Moteur.buttonStates, T44: Moteur.T44, mergePart: Moteur.mergePart, finishNode: Moteur.finishNode, tone: Moteur.tone, legible: Moteur.legible,
  // modèles
  modele, identifiantModele, ID_RE, LIENS_PLATEFORME,
};
