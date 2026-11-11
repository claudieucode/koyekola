// Famille v2 « E-commerce, mode et luxe » — 9 modèles (concepts c-024 à c-032 de docs/footer-v2/CONCEPTS_100.md).
// Chaque modèle est INDÉPENDANT du site (solo) : ses couleurs en hexadécimal, ses polices de la bibliothèque, ses jetons --ft-*. Marques FICTIVES (texte modifiable dans l'éditeur).
// Aucune donnée inventée : coordonnées, horaires, livraison, paiements, catégories et liens de boutique viennent de widgets EXISTANTS (Données de l'entreprise, module Commerce), avec leur état vide explicite.
// Polices d'affichage testées à 150 px (méthode du guide, §5 bis) : Cormorant Garamond 300/500/700, Young Serif, Anton, Quicksand 700, Fredoka 600, Red Hat Display 800/900, Instrument Serif, Zilla Slab 700, Jost, Marcellus : rendu PROPRE (aucune encoche ni fente).
const { modeleV2, identifiantV2, identite, G, Kit, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "ecommerce-mode-luxe";
const MS = G.MOUVEMENT;

// ── Aides locales ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// lien simple de pied : souligné au survol/focus, contour de focus visible, 44 px sur mobile (finition du moteur)
function lien(k, label, url, o = {}) {
  const S = k.S;
  const n = k.LINK(label, url, compact({ fontSize: `${o.taille || 14}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "30px", letterSpacing: o.suivi, textTransform: o.casse, transitionDuration: MS, lineHeight: 1.3 }));
  return G.fini(k, n, { hover: { textDecoration: "underline", color: o.survol || o.couleur || S.fg }, focus: G.focus(o.focus || o.couleur || S.fg) });
}
const listeLiens = (k, liste, o = {}) => k.col(liste.map(([l, u]) => lien(k, l, u, o)), { gap: o.gap || "2px", alignItems: o.centre ? "center" : "flex-start" });
const petit = (k, texte, o = {}) => G.libelle(texte, o)(k);
// accordéon mobile (volets repliables seulement ≤ 767 px ; titres de colonnes ailleurs) ; chaque volet reçoit des fonctions (k, env, center) → nœud
const accordeon = (k, env, panels, opts) => Moteur.item(k, Kit.accordeon(panels, opts || {}), env);
// même accordéon, posé directement dans une rangée (sans colonne autour : le Page Builder limite l'imbrication à 8 niveaux)
const accordeonFlex = (k, env, panels, flex, min) => { const n = accordeon(k, env, panels, { start: "none", min }); n.styles.desktop = { ...n.styles.desktop, width: "auto", ...flex }; return n; };
// accordéon dont les volets font des colonnes ÉGALES sur ordinateur (jamais de retour à la ligne), 2 par ligne sur tablette ; sur mobile : volets repliables (mécanisme du moteur)
const accordeonEgal = (k, env, panels, flex = {}) => {
  const n = accordeon(k, env, panels, { start: "none", min: "0px" });
  n.styles.desktop = { ...n.styles.desktop, flexWrap: "nowrap", alignItems: "flex-start", ...flex };
  n.styles.tablet = { ...(n.styles.tablet || {}), flexWrap: "wrap" };
  for (const v of n.children || []) { v.styles.desktop = { ...v.styles.desktop, flexBasis: "0px", flexGrow: 1, minWidth: "0px" }; v.styles.tablet = { ...(v.styles.tablet || {}), flexBasis: "46%", flexGrow: 0 }; }
  return n;
};
// widget e-mail habillé puis recoloré pour un fond local (carte sombre…) : patch = { titre, intro, champ, bouton, consent, manque } (styles desktop) et patchM (mobile)
function abo(k, env, o = {}, patch = {}, patchM = {}) {
  const n = G.abonnement(o)(k, env);
  const map = { titre: "title", intro: "intro", champ: "input", bouton: "button", consent: "consent", manque: "missing" };
  for (const [kk, pp] of Object.entries(map)) {
    if (patch[kk]) n.parts[pp].styles.desktop = { ...n.parts[pp].styles.desktop, ...patch[kk] };
    if (patchM[kk]) n.parts[pp].styles.mobile = { ...(n.parts[pp].styles.mobile || {}), ...patchM[kk] };
  }
  if (patch.etatBouton) n.parts.button.states = { ...n.parts.button.states, ...patch.etatBouton };
  if (patch.etatChamp) n.parts.input.states = { ...n.parts.input.states, ...patch.etatChamp };
  return n;
}
// grande marque coupée en bas par le bord de la bande (tailles différentes selon l'écran)
function nomCoupe(k, texte, o) {
  const S = k.S, ht = `${(0.82 * o.visible).toFixed(2)}em`;
  const t = { type: "heading", props: { text: texte, level: "3", tag: "p" }, ...sty(compact({ fontSize: `fluid:${o.taille[0]}-${o.taille[1]}`, lineHeight: 0.82, letterSpacing: o.suivi || "-0.03em", fontFamily: o.police || S.head, fontWeight: o.poids || "500", color: o.couleur, textTransform: o.casse, height: ht, overflow: "hidden", overflowWrap: "break-word", textAlign: o.align, width: "100%", margin: undefined })) };
  // un second enfant vide : le pied masque toute carte réduite à un seul titre (règle « colonne réduite à son titre » de landing.css)
  return { type: "container", children: [t, { type: "container", children: [], ...sty({ height: "0px", width: "100%" }) }], ...sty({ width: "100%", display: "flex", flexDirection: "column" }) };
}
// widgets de données sans titre parasite (Livraison et retours, Paiement, Téléphone) : posés puis finis par le moteur
const wdg = (k, env, type, props, style) => Moteur.item(k, (k2) => k2.W(type, props, style), env);
const livraison = (k, env, o = {}) => wdg(k, env, "bizdelivery", { title: "", showDelivery: true, showReturns: true, showIcon: false }, { color: o.couleur || k.S.mute, fontSize: "14px" });
const paiement = (k, env, o = {}) => wdg(k, env, "bizpayments", { title: o.titre === undefined ? "Paiement accepté" : o.titre, look: "pills", showIcon: false }, { color: o.couleur || k.S.fg, fontSize: "13px" });
const hr = (k, couleur, ep = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: ep, marginTop: "0px", marginBottom: "0px" });

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-024 « Maison Ivoire » — maroquinerie fictive « Aubrac Paris ». Le vide est le luxe : trois colonnes minuscules (liens, lettre, contact) puis le NOM monumental, très pâle, rogné par le bas.
// Ivoire #f7f3ec, encre #221e19, un seul laiton (filets et détails). Cormorant Garamond (titres) + Jost (texte). Le nom pâle est décoratif (couleur à transparence, hors texte de lecture).
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const ivoire = identite({
  key: "c024", label: "Ivoire, encre et laiton", humeur: "light",
  fond: "#f7f3ec", texte: "#221e19", discret: "#6a6055", accent: "#8f6d3d", surface: "#efe8db",
  police: "font.jost", titres: "font.cormorant-garamond", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#9c7a4a80",
});
const maisonIvoire = modeleV2({
  id: identifiantV2(24, "maison-ivoire"), concept: "c-024-maison-ivoire", name: "Maison Ivoire", family: FAM,
  description: "Maroquinerie de luxe : ivoire, encre et un seul filet de laiton. Trois colonnes minuscules (liens, lettre soulignée, contact) puis le nom de la maison, géant, très pâle, rogné par le bas. L'abondance de vide fait le luxe.",
  tags: ["luxe", "maroquinerie", "nom monumental", "ivoire", "laiton", "serif", "aéré"],
  identity: ivoire,
  racine: { desktop: { backgroundColor: "#f7f3ec", gap: "0px" } },
  widgets: ["text", "emailsubscribe", "bizcontact", "copyright", "bizlegal", "link", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const L = (t, u) => [t, u];
    const panels = [
      { title: "La maison", w: 1, codes: [(k2) => listeLiens(k2, [L("Boutique", "/boutique"), L("Catalogue", "/catalogue"), L("Journal", "/blog")], { couleur: S.fg })] },
      { title: "Service client", w: 1, codes: [(k2) => listeLiens(k2, [L("Suivre ma commande", "/boutique/compte"), L("Questions fréquentes", "/faq"), L("Nous écrire", "/contact")], { couleur: S.fg })] },
      { title: "Compte", w: 1, codes: [(k2) => listeLiens(k2, [L("Se connecter", "/connexion"), L("Liste d'envies", "/boutique/souhaits"), L("Panier", "/boutique/panier")], { couleur: S.fg })] },
    ];
    const liens = accordeonFlex(k, env, panels, { flexBasis: "0px", flexGrow: 5, minWidth: "300px" }, "110px");
    for (const v of liens.children || []) v.styles.desktop = { ...v.styles.desktop, fontFamily: S.head, color: S.fg }; // titres de volets en Cormorant (les liens gardent Jost)
    const lettre = G.colonne(k, [
      petit(k, "La lettre de la maison"),
      abo(k, env, { titre: "", intro: "Quelques lignes, rarement, sur les nouvelles pièces de la maison.", bouton: "S'inscrire", largeur: "380px", soulignement: "1px", accent: S.accent, texte: S.fg, tailleChamp: "17px", survolBouton: S.accent, survolTexte: S.bg },
        { bouton: { backgroundColor: "transparent", color: S.fg, borderWidth: "0px", paddingLeft: "0px", fontSize: "12px", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: "600", minHeight: "44px", textDecoration: "underline" }, etatBouton: { hover: { backgroundColor: "transparent", color: S.accent } } }),
    ], { poids: 4, min: "260px", gap: "16px" });
    const contact = G.colonne(k, [
      petit(k, "Contact"), G.code("contact:inline")(k, env), G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Pinterest", "https://www.pinterest.com/"]], { taille: 14, poids: "500", survol: S.accent })(k, env),
    ], { poids: 3, min: "220px", gap: "10px" });
    const haut = G.ligne(k, [liens, lettre, contact], { gap: "56px 64px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const legal = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const b1 = G.bande(k, [haut, hr(k, S.line), legal], { colonne: true, gap: "56px", padV: ["120px", "88px", "64px"], padB: ["40px", "32px", "28px"], padH: ["56px", "40px", "20px"], fond: S.bg, innerMobile: { rowGap: "40px" }, nom: "Maison Ivoire" });
    const nom = nomCoupe(k, "Aubrac Paris", { taille: [60, 200], visible: 0.95, couleur: "#9c7a4a30", poids: "400", suivi: "-0.02em" });
    const b2 = G.bande(k, [nom], { colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["56px", "40px", "20px"], fond: S.bg });
    return [G.racine(k, [b1, b2])];
  },
}, FAM);

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-025 « Marché du Terroir » — épicerie en ligne fictive « Terroirs & Co ». Une grande carte crème aux coins de 36 px, décollée des bords, posée sur un aplat vert pomme ; les mentions restent sur le vert.
// Young Serif (titre) + Karla (texte). Texte sombre sur le vert uniquement (AA). Étiquette ronde STATIQUE (le concept la voulait rotative : aucun mouvement décoratif ajouté).
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const pomme = identite({
  key: "c025", label: "Vert pomme et crème", humeur: "light",
  fond: "#8dbf3f", texte: "#22301a", discret: "#2f4a1f", accent: "#2f4a1f", surface: "#f6efdd",
  police: "font.karla", titres: "font.young-serif", rayon: "36px", rayonBouton: "999px", ombre: "none", poids: "400", bordure: "0px", ligne: "#2f4a1f55",
});
const marcheTerroir = modeleV2({
  id: identifiantV2(25, "marche-du-terroir"), concept: "c-025-marche-du-terroir", name: "Marché du Terroir", family: FAM,
  description: "Épicerie en ligne : une grande carte crème aux coins arrondis, décollée des bords sur un aplat vert pomme. La lettre d'information tient sa propre carte vert sombre ; catégories, horaires et livraison viennent de vos données.",
  tags: ["épicerie", "alimentaire", "carte arrondie", "vert pomme", "crème", "serif", "newsletter"],
  identity: pomme,
  racine: { desktop: { backgroundColor: "#8dbf3f", gap: "0px" } },
  widgets: ["text", "emailsubscribe", "shopcategories", "shoplinks", "bizhours", "bizdelivery", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, CREME = "#f6efdd", VERT = "#2f4a1f", ENCRE = "#22301a";
    const marque = k.col([
      k.T("<p>Terroirs &amp; Co</p>", { fontFamily: S.head, fontSize: "fluid:30-44", lineHeight: 1.05, color: ENCRE }),
      k.T("<p>Épicerie en ligne : produits choisis, commandés chez vous.</p>", { fontFamily: S.font, fontSize: "15px", color: VERT, maxWidth: "340px", lineHeight: 1.5 }),
    ], { gap: "8px" });
    const sticker = k.col([k.T("<p><strong>Bon<br>appétit</strong></p>", { fontFamily: S.head, fontSize: "15px", lineHeight: 1.1, textAlign: "center", color: CREME, textTransform: "uppercase", letterSpacing: "0.06em" })],
      { width: "104px", height: "104px", borderRadius: "999px", backgroundColor: VERT, alignItems: "center", justifyContent: "center", transform: { rotate: -10 }, flexShrink: 0 }, undefined, { width: "80px", height: "80px" });
    const entete = G.ligne(k, [marque, sticker], { gap: "20px", aligne: "center", justifie: "space-between", largeur: "100%", pas_de_ligne: true });
    // carte newsletter dédiée : vert tendre sur la crème, texte sombre (l'astérisque « obligatoire » du formulaire reste lisible)
    const TENDRE = "#cfe59a";
    const carteNews = k.col([
      k.T("<p>La lettre du marché</p>", { fontFamily: S.head, fontSize: "26px", lineHeight: 1.15, color: ENCRE }),
      abo(k, env, { titre: "", intro: "Les nouveaux produits et nos idées de saison, sans spam.", bouton: "S'abonner", largeur: "100%", soulignement: "0px", fondChamp: "#ffffff", rembChamp: "16px", rayonChamp: "999px", accent: VERT, texte: ENCRE, tailleChamp: "16px", survolBouton: ENCRE, survolTexte: CREME },
        { champ: { height: "52px" }, bouton: { fontWeight: "700", color: CREME } }),
    ], { backgroundColor: TENDRE, borderRadius: "24px", paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px", gap: "14px", flexGrow: 3, flexBasis: "0px", minWidth: "280px", color: ENCRE }, undefined, { paddingTop: "24px", paddingBottom: "24px", paddingLeft: "20px", paddingRight: "20px" });
    const rayons = G.colonne(k, [petit(k, "Nos rayons", { couleur: VERT }), G.code("shopcats:6")(k, env)], { poids: 2, min: "170px", gap: "12px" });
    const service = G.colonne(k, [petit(k, "Service client", { couleur: VERT }), G.code("shoplinks")(k, env)], { poids: 2, min: "170px", gap: "12px" });
    const pratique = G.colonne(k, [petit(k, "Infos pratiques", { couleur: VERT }), G.code("hours|-")(k, env), livraison(k, env, { couleur: VERT }), listeLiens(k, [["Questions fréquentes", "/faq"], ["Nous contacter", "/contact"]], { couleur: ENCRE })], { poids: 2, min: "200px", gap: "12px" });
    const milieu = G.ligne(k, [carteNews, rayons, service, pratique], { gap: "40px 36px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const reseaux = G.pilules([["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["Pinterest", "https://www.pinterest.com/"]], { contour: VERT, couleur: ENCRE, survolFond: VERT, survolCouleur: CREME, gap: "10px", poids: "600" })(k, env);
    const bas = G.ligne(k, [petit(k, "Retrouvez-nous", { couleur: VERT }), reseaux], { gap: "12px 20px", aligne: "center", justifie: "flex-start", largeur: "100%" });
    const carte = k.col([entete, hr(k, "#2f4a1f33"), milieu, hr(k, "#2f4a1f33"), bas], { backgroundColor: CREME, color: ENCRE, borderRadius: "36px", paddingTop: "56px", paddingBottom: "48px", paddingLeft: "56px", paddingRight: "56px", gap: "36px", width: "100%", maxWidth: "1280px", marginLeft: "auto", marginRight: "auto" },
      { paddingTop: "40px", paddingBottom: "36px", paddingLeft: "32px", paddingRight: "32px" }, { borderRadius: "24px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "18px", paddingRight: "18px", gap: "28px" });
    const legal = G.ligneLegale({ taille: 12, sansCookies: true, couleur: VERT, liens: ENCRE })(k, env);
    const bande = G.bande(k, [carte, legal], { colonne: true, gap: "28px", padV: ["24px", "24px", "12px"], padB: ["24px", "20px", "16px"], padH: ["24px", "24px", "12px"], fond: S.bg, max: "1328px", nom: "Marché du Terroir" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-026 « Drop Sneakers » — boutique de baskets fictive « Pointure ». Noir, blanc, citron. Un RUBAN citron incliné de -2° (widget Défilement continu : pause au survol, immobile si « réduire les animations »)
// n'annonce que des services vrais (suivi, panier, souhaits, service client) : aucune rareté ni compte à rebours. Anton (titres) + Archivo.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const noirCitron = identite({
  key: "c026", label: "Noir, blanc et citron", humeur: "dark",
  fond: "#0d0d0d", texte: "#ffffff", discret: "#b8b8b8", accent: "#d4ff2a", surface: "#1a1a1a",
  police: "font.archivo", titres: "font.anton", rayon: "20px", rayonBouton: "999px", ombre: "none", poids: "400", bordure: "0px", ligne: "#ffffff33",
});
const dropSneakers = modeleV2({
  id: identifiantV2(26, "drop-sneakers"), concept: "c-026-drop-sneakers", name: "Drop Sneakers", family: FAM,
  description: "Streetwear : un ruban citron incliné défile (et s'arrête si le visiteur le demande) avec des services vrais, puis le logo en majuscules condensées, le menu en ligne, une bande de lettre pleine largeur, des étiquettes de réseaux et les paiements.",
  tags: ["streetwear", "baskets", "ruban incliné", "noir", "citron", "majuscules", "pilules"],
  identity: noirCitron,
  racine: { desktop: { backgroundColor: "#0d0d0d", gap: "0px" } },
  widgets: ["text", "link", "emailsubscribe", "bizpayments", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    // ruban STATIQUE incliné de -2° (le défilement du concept est abandonné : aucun mouvement, aucun mot hors écran, rien ne se coupe) ; les 5 services sont de vrais liens de la boutique
    const ruban = k.T(`<p>${["Suivi de commande", "Panier", "Liste de souhaits", "Service client", "Livraison et retours"].join(" &nbsp;✦&nbsp; ")}</p>`,
      { width: "108%", marginLeft: "-4%", backgroundColor: S.accent, color: "#0d0d0d", fontFamily: S.head, fontSize: "fluid:15-26", textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1.25, textAlign: "center", textWrap: "balance", paddingTop: "16px", paddingBottom: "16px", paddingLeft: "6%", paddingRight: "6%", transform: { rotate: -2 }, overflowWrap: "break-word" });
    const bandeRuban = { type: "container", props: { full: true }, children: [ruban], ...sty({ overflowX: "clip", overflowY: "clip", backgroundColor: S.bg, display: "flex", flexDirection: "column", paddingTop: "44px", paddingBottom: "36px" }, { paddingTop: "32px", paddingBottom: "28px" }, { paddingTop: "24px", paddingBottom: "20px" }) };
    const logo = G.geant("<p>POINTURE</p>", { taille: [64, 150], lh: 0.95, suivi: "0.02em", poids: "400", police: S.head, couleur: S.fg, align: "center" })(k, env, true);
    const menu = G.ligne(k, [["Boutique", "/boutique"], ["Catalogue", "/catalogue"], ["Journal", "/blog"], ["Aide", "/faq"], ["Contact", "/contact"]].map(([l, u]) => lien(k, l, u, { taille: 15, poids: "600", casse: "uppercase", suivi: "0.12em", survol: S.accent, focus: S.accent })), { gap: "4px 36px", justifie: "center", largeur: "100%" });
    const b1 = G.bande(k, [logo, menu], { colonne: true, gap: "28px", aligne: "center", padV: ["24px", "20px", "12px"], padB: ["56px", "48px", "40px"], padH: ["48px", "32px", "20px"], fond: S.bg });
    // bande lettre pleine largeur (surface)
    const invit = G.colonne(k, [
      k.T("<p>Reste dans le coup</p>", { fontFamily: S.head, fontSize: "fluid:34-64", lineHeight: 1, textTransform: "uppercase", color: S.fg }),
      k.T("<p>Les nouveautés de la boutique dans ta boîte mail. Tu te désabonnes quand tu veux.</p>", { fontSize: "15px", color: S.mute, maxWidth: "420px", lineHeight: 1.5 }),
    ], { poids: 5, min: "300px", gap: "10px" });
    const champ = G.colonne(k, [abo(k, env, { titre: "", intro: "", bouton: "Je m'abonne", largeur: "560px", soulignement: "2px", fondChamp: "#0d0d0d", rembChamp: "24px", rayonChamp: "999px", accent: S.accent, texte: S.fg, tailleChamp: "16px", survolBouton: "#ffffff", survolTexte: "#0d0d0d" },
      { champ: { borderWidth: "2px", borderColor: "#ffffff55", borderStyle: "solid" }, etatChamp: { focus: { outlineStyle: "solid", outlineWidth: "2px", outlineColor: S.accent, outlineOffset: "3px", borderColor: S.accent } }, bouton: { fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.06em" } })], { poids: 6, min: "300px", aligne: "flex-start" });
    const b2 = G.bande(k, [G.ligne(k, [invit, champ], { gap: "32px 56px", aligne: "center", justifie: "space-between", largeur: "100%" })], { colonne: true, padV: ["56px", "48px", "40px"], padH: ["48px", "32px", "20px"], fond: S.alt });
    // réseaux en étiquettes, paiements, mentions
    const etiq = G.pilules([["Instagram", "https://www.instagram.com/"], ["TikTok", "https://www.tiktok.com/"], ["YouTube", "https://www.youtube.com/"], ["X", "https://x.com/"]], { contour: "#ffffff66", gap: "10px", poids: "600", survolFond: S.accent, survolCouleur: "#0d0d0d" })(k, env);
    const ligne3 = G.ligne(k, [etiq, paiement(k, env)], { gap: "24px 40px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const b3 = G.bande(k, [ligne3, hr(k, S.line), G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { colonne: true, gap: "28px", padV: ["56px", "48px", "40px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], fond: S.bg });
    return [G.racine(k, [bandeRuban, b1, b2, b3])];
  },
}, FAM);

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-027 « Concept Store Pastel » — concept store fictif « Petit Nuage ». Rose poudré, prune doux, framboise. Des pastilles de couleurs différentes (comme des bonbons) servent de navigation ; quatre colonnes ;
// lettre dans un champ en pilule ; réseaux en disques. Quicksand (titres) + Fredoka (texte). Texte foncé sur TOUTES les pastilles (AA).
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const nuage = identite({
  key: "c027", label: "Rose poudré et framboise", humeur: "light",
  fond: "#fbeff0", texte: "#3a2230", discret: "#6b4a5c", accent: "#b8336a", surface: "#ffffff",
  police: "font.fredoka", titres: "font.quicksand", rayon: "28px", rayonBouton: "999px", ombre: "none", poids: "700", bordure: "0px", ligne: "#3a223033",
});
const conceptStorePastel = modeleV2({
  id: identifiantV2(27, "concept-store-pastel"), concept: "c-027-concept-store-pastel", name: "Concept Store Pastel", family: FAM,
  description: "Concept store tout doux : des pastilles de couleurs différentes comme des bonbons pour naviguer, quatre colonnes (rayons, service, livraison, adresse) sur une carte blanche, une lettre en champ pilule et des réseaux en disques.",
  tags: ["concept store", "pastel", "pastilles", "rose", "arrondi", "newsletter", "quatre colonnes"],
  identity: nuage,
  racine: { desktop: { backgroundColor: "#fbeff0", gap: "0px" } },
  widgets: ["text", "link", "emailsubscribe", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, ENCRE = S.fg;
    const point = (c) => k.col([], { width: "12px", height: "12px", borderRadius: "999px", backgroundColor: c, flexShrink: 0 });
    const confettis = k.row(["#ffc6dc", "#cdeedd", "#e3d6ff", "#fff0b8", "#cfe6ff"].map(point), { gap: "8px", justifyContent: "center", alignItems: "center" });
    const logo = G.geant("<p>Petit Nuage</p>", { taille: [48, 92], lh: 1, suivi: "-0.02em", poids: "700", police: S.head, couleur: S.fg, align: "center" })(k, env, true);
    const mot = k.T("<p>Maison, papeterie, beauté et petits plaisirs.</p>", { fontSize: "17px", color: S.mute, textAlign: "center", maxWidth: "460px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 });
    const bonbon = (l, u, fond) => G.pilule(l, u, { fond, couleur: ENCRE, contour: null, taille: 15, poids: "600", survolFond: S.accent, survolCouleur: "#ffffff" })(k);
    const pastilles = k.row([bonbon("Boutique", "/boutique", "#ffc6dc"), bonbon("Catalogue", "/catalogue", "#cdeedd"), bonbon("Journal", "/blog", "#e3d6ff"), bonbon("Liste d'envies", "/boutique/souhaits", "#fff0b8"), bonbon("Mon compte", "/connexion", "#cfe6ff"), bonbon("Aide", "/faq", "#ffd6c0")], { gap: "12px", justifyContent: "center", flexWrap: "wrap" });
    const b1 = G.bande(k, [confettis, logo, mot, pastilles], { colonne: true, gap: "22px", aligne: "stretch", padV: ["96px", "72px", "56px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "16px"], fond: S.bg, nom: "Petit Nuage" });
    // quatre colonnes sur une carte blanche
    const panels = [
      { title: "Nos rayons", w: 1, codes: [(k2, e2) => Moteur.item(k2, "shopcats:6", e2)] },
      { title: "Service client", w: 1, codes: [(k2, e2) => Moteur.item(k2, "shoplinks", e2)] },
      { title: "Livraison", w: 1, codes: [(k2, e2) => livraison(k2, e2)] },
      { title: "Venir nous voir", w: 1, codes: [(k2, e2) => Moteur.item(k2, "contact", e2)] },
    ];
    const carte = k.col([accordeonEgal(k, env, panels)], { backgroundColor: S.alt, borderRadius: "32px", paddingTop: "48px", paddingBottom: "48px", paddingLeft: "48px", paddingRight: "48px", width: "100%" }, { paddingLeft: "32px", paddingRight: "32px", paddingTop: "36px", paddingBottom: "36px" }, { borderRadius: "24px", paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px" });
    const b2 = G.bande(k, [carte], { colonne: true, padV: ["0px", "0px", "0px"], padB: ["48px", "40px", "32px"], padH: ["48px", "32px", "16px"], fond: S.bg });
    // lettre en pilule + réseaux en disques + légal
    const lettre = G.colonne(k, [
      k.T("<p>Un petit nuage dans votre boîte mail</p>", { fontFamily: S.head, fontSize: "fluid:22-30", lineHeight: 1.2, fontWeight: "700", color: S.fg }),
      abo(k, env, { titre: "", intro: "Les nouveautés et les coups de cœur du magasin.", bouton: "Je m'abonne", largeur: "520px", soulignement: "0px", fondChamp: "#ffffff", rembChamp: "22px", rayonChamp: "999px", accent: S.accent, texte: S.fg, tailleChamp: "16px", survolBouton: S.fg, survolTexte: "#ffffff" },
        { champ: { borderWidth: "2px", borderColor: "#e0568a", borderStyle: "solid" }, bouton: { fontWeight: "700" }, etatChamp: { focus: { outlineStyle: "solid", outlineWidth: "3px", outlineColor: S.accent, outlineOffset: "3px" } } }),
    ], { poids: 6, min: "300px", gap: "14px" });
    const disques = G.colonne(k, [petit(k, "Suivez-nous"), G.code("socials:instagram+pinterest+tiktok+facebook")(k, env)], { poids: 3, min: "240px", gap: "10px" });
    const haut = G.ligne(k, [lettre, disques], { gap: "32px 56px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    const b3 = G.bande(k, [haut, hr(k, S.line, "2px"), G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { colonne: true, gap: "32px", padV: ["16px", "16px", "8px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "20px"], fond: S.bg });
    return [G.racine(k, [b1, b2, b3])];
  },
}, FAM);

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-028 « Frise de Confiance » — boutique d'électronique fictive « Voltage ». Avant les catégories, le pied raconte la promesse de service en 4 étapes reliées par un fil rouge de 3 px (Commande, Expédition, Livraison, Retour).
// Aucun délai inventé : chaque étape renvoie aux vraies conditions de la boutique (widget Livraison et retours, liens de la boutique). Red Hat Display (titres) + Public Sans. Angles droits, bi-aplat blanc / gris clair.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const voltage = identite({
  key: "c028", label: "Blanc, bleu nuit et rouge", humeur: "light",
  fond: "#ffffff", texte: "#0f172a", discret: "#475569", accent: "#e11d48", surface: "#f1f5f9", surEncre: "#ffffff",
  police: "font.public-sans", titres: "font.red-hat-display", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "800", bordure: "1px", ligne: "#0f172a26",
});
const friseConfiance = modeleV2({
  id: identifiantV2(28, "frise-de-confiance"), concept: "c-028-frise-de-confiance", name: "Frise de Confiance", family: FAM,
  description: "Électronique : avant les catégories, une frise en 4 étapes reliées par un fil rouge (commande, expédition, livraison, retour) renvoie vers vos vrais délais. Puis téléphone en grand, rayons, service client, paiements. Angles droits.",
  tags: ["électronique", "frise", "réassurance", "service client", "rouge", "bleu nuit", "angles droits"],
  identity: voltage,
  racine: { desktop: { backgroundColor: "#ffffff", gap: "0px" } },
  widgets: ["text", "link", "bizdelivery", "bizphone", "shopcategories", "shoplinks", "bizpayments", "social", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, NUIT = S.fg, ROUGE = "#be123c", FIL = S.accent; // rouge de texte plus profond (AA sur le gris clair) ; le fil garde le rouge vif
    const etapes = [
      ["01", "Commande", "Vous validez votre panier ; suivez-la à tout moment depuis votre espace client.", "/boutique/compte", "Suivre ma commande"],
      ["02", "Expédition", "Le délai de préparation est indiqué dans les conditions de livraison de la boutique.", "/boutique", "Voir la boutique"],
      ["03", "Livraison", "Modes et délais de livraison : voir le bloc « Livraison et retours » ci-dessus.", "/faq", "Questions fréquentes"],
      ["04", "Retour", "Un souci avec un produit ? Les conditions de retour sont détaillées par la boutique.", "/contact", "Nous contacter"],
    ];
    const etape = ([num, titre, texte, url, lib], i) => {
      const dernier = i === etapes.length - 1;
      const pastille = k.col([k.T(`<p><strong>${num}</strong></p>`, { fontFamily: S.head, fontSize: "16px", color: "#ffffff", textAlign: "center", letterSpacing: "0.04em" })], { width: "48px", height: "48px", backgroundColor: NUIT, alignItems: "center", justifyContent: "center", flexShrink: 0 });
      const fil = dernier ? null : k.divider({ width: "100%", borderColor: FIL, borderTopWidth: "3px", marginTop: "0px", marginBottom: "0px", flexGrow: 1 });
      const tete = { ...k.row([pastille, ...(fil ? [fil] : [])], { gap: "0px", alignItems: "center", flexWrap: "nowrap", width: "100%" }), hideOn: ["mobile"] };
      const numMobile = k.T(`<p><strong>${num}</strong></p>`, { fontFamily: S.head, fontSize: "13px", color: ROUGE, letterSpacing: "0.12em", display: "none" }, undefined, { display: "block" });
      return k.col([tete, numMobile, k.T(`<p>${titre}</p>`, { fontFamily: S.head, fontSize: "22px", fontWeight: "800", color: NUIT, lineHeight: 1.1 }),
        k.T(`<p>${texte}</p>`, { fontSize: "14px", color: S.mute, lineHeight: 1.55, maxWidth: "250px", minHeight: "88px" }, undefined, { minHeight: "0px" }), lien(k, `${lib} →`, url, { taille: 14, poids: "700", couleur: ROUGE, focus: ROUGE })],
      { gap: "14px", flexGrow: 1, flexBasis: "0px", minWidth: "200px", paddingRight: "28px", alignItems: "flex-start" }, { flexBasis: "40%", paddingRight: "20px" },
      { flexBasis: "100%", paddingRight: "0px", paddingLeft: "24px", paddingBottom: "28px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "3px", borderColor: FIL, gap: "8px" });
    };
    const frise = k.row(etapes.map(etape), { rowGap: "36px", columnGap: "0px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" }, undefined, { rowGap: "0px" });
    const titreFrise = G.ligne(k, [k.T("<p>Notre promesse de service</p>", { fontFamily: S.head, fontSize: "fluid:26-40", fontWeight: "800", color: NUIT, lineHeight: 1.1 }), livraison(k, env)], { gap: "16px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const b1 = G.bande(k, [titreFrise, frise], { colonne: true, gap: "44px", padV: ["80px", "64px", "48px"], padB: ["72px", "56px", "40px"], padH: ["48px", "32px", "20px"], fond: S.alt, nom: "Frise de confiance" });
    // aide + rayons
    const logo = k.T("<p>Voltage</p>", { fontFamily: S.head, fontSize: "32px", fontWeight: "900", color: NUIT, letterSpacing: "-0.02em", lineHeight: 1 });
    const tel = k.col([petit(k, "Une question ?"), wdg(k, env, "bizphone", { which: "1", prefix: "", showLabel: false, showIcon: false }, { color: NUIT, fontSize: "30px", fontWeight: "800", fontFamily: S.head }), lien(k, "Écrivez-nous →", "/contact", { taille: 15, poids: "700", couleur: ROUGE })], { gap: "8px" });
    const aide = G.colonne(k, [logo, tel, G.code("socials:youtube+facebook+instagram|sq")(k, env)], { poids: 4, min: "260px", gap: "22px", tablette: { flexBasis: "100%" } });
    const panels = [
      { title: "Nos rayons", w: 1, codes: [(k2, e2) => Moteur.item(k2, "shopcats:8", e2)] },
      { title: "Service client", w: 1, codes: [(k2, e2) => Moteur.item(k2, "shoplinks", e2)] },
      { title: "Informations", w: 1, codes: [(k2) => listeLiens(k2, [["Questions fréquentes", "/faq"], ["Nous contacter", "/contact"], ["Se connecter", "/connexion"]], { couleur: NUIT })] },
    ];
    const cols = accordeonEgal(k, env, panels, { flexBasis: "0px", flexGrow: 8, minWidth: "320px" });
    cols.styles.tablet = { ...(cols.styles.tablet || {}), flexBasis: "100%" };
    const haut = G.ligne(k, [aide, cols], { gap: "40px 72px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const pay = G.ligne(k, [paiement(k, env), G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { gap: "20px 40px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const b2 = G.bande(k, [haut, hr(k, S.line), pay], { colonne: true, gap: "40px", padV: ["72px", "56px", "40px"], padB: ["32px", "28px", "24px"], padH: ["48px", "32px", "20px"], fond: S.bg });
    return [G.racine(k, [b1, b2])];
  },
}, FAM);

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-029 « Botanique Bio » — cosmétique bio fictif « Herba ». Vert mousse, crème, doré. Le concept prévoit une photo de feuillage voilée : sans photo fournie, REPLI en dégradé vert avec formes organiques (galets, arches)
// asymétriques. Une carte de lettre centrale (coins différents par angle) puis menu en ligne, réseaux en disques, mentions. Cormorant Garamond + Mulish.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const mousse = identite({
  key: "c029", label: "Vert mousse, crème et doré", humeur: "dark",
  fond: "#2b3a2a", texte: "#f3eedf", discret: "#cfc8b0", accent: "#d9b26f", surface: "#3c4e3a",
  police: "font.mulish", titres: "font.cormorant-garamond", rayon: "28px", rayonBouton: "999px", ombre: "none", poids: "500", bordure: "1px", ligne: "#d9b26f66",
});
const botaniqueBio = modeleV2({
  id: identifiantV2(29, "botanique-bio"), concept: "c-029-botanique-bio", name: "Botanique Bio", family: FAM,
  description: "Cosmétique bio : fond vert mousse en dégradé avec galets et arches organiques (repli prévu quand le client n'a pas de photo), grande carte de lettre centrale aux coins asymétriques, menu en ligne, réseaux en disques.",
  tags: ["cosmétique", "bio", "vert mousse", "doré", "organique", "centré", "newsletter"],
  identity: mousse,
  racine: { desktop: { backgroundColor: "#243124", gap: "0px" } },
  widgets: ["text", "emailsubscribe", "link", "social", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, OR = S.accent;
    const forme = (st) => k.col([], { position: "absolute", pointerEvents: "none", backgroundColor: "#3c4e3a", opacity: 0.55, ...st });
    const decor = [
      forme({ width: "420px", height: "420px", top: "-140px", left: "-120px", borderTopLeftRadius: "260px", borderTopRightRadius: "40px", borderBottomRightRadius: "260px", borderBottomLeftRadius: "40px" }),
      forme({ width: "300px", height: "420px", bottom: "-120px", right: "-60px", borderTopLeftRadius: "200px", borderTopRightRadius: "200px", borderBottomRightRadius: "0px", borderBottomLeftRadius: "0px", backgroundColor: "#34452f" }),
    ];
    const logo = G.geant("<p>Herba</p>", { taille: [64, 120], lh: 1, suivi: "0.02em", poids: "500", police: S.head, couleur: S.fg, align: "center" })(k, env, true);
    const sous = k.T("<p>Soins végétaux · cosmétique bio</p>", { fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase", color: OR, textAlign: "center", fontWeight: "600" });
    const filet = G.filet({ largeur: "48px", epaisseur: "1px", couleur: OR })(k, env, true);
    const carte = k.col([
      petit(k, "La lettre d'Herba", { couleur: OR, suivi: "0.22em" }),
      k.T("<p>Rituels de saison, nouveautés et conseils d'utilisation</p>", { fontFamily: S.head, fontSize: "fluid:28-44", lineHeight: 1.12, color: S.fg, textAlign: "center", fontWeight: "500" }),
      abo(k, env, { titre: "", intro: "Une lettre douce, quelques fois par an.", bouton: "S'abonner", largeur: "460px", soulignement: "0px", fondChamp: "#2b3a2a", rembChamp: "22px", rayonChamp: "999px", accent: OR, texte: S.fg, tailleChamp: "16px", survolBouton: S.fg, survolTexte: S.bg },
        { intro: { textAlign: "center" }, manque: { textAlign: "center" }, champ: { borderWidth: "1px", borderColor: "#d9b26f99", borderStyle: "solid" }, bouton: { fontWeight: "700" } }),
    ], { backgroundColor: "#3c4e3a", borderStyle: "solid", borderWidth: "1px", borderColor: "#d9b26f55", borderTopLeftRadius: "120px", borderTopRightRadius: "28px", borderBottomRightRadius: "120px", borderBottomLeftRadius: "28px", paddingTop: "64px", paddingBottom: "64px", paddingLeft: "56px", paddingRight: "56px", alignItems: "center", gap: "20px", width: "100%", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" },
      { paddingLeft: "40px", paddingRight: "40px" }, { borderTopLeftRadius: "64px", borderBottomRightRadius: "64px", paddingTop: "44px", paddingBottom: "44px", paddingLeft: "20px", paddingRight: "20px" });
    const menu = G.ligne(k, [["Boutique", "/boutique"], ["Catalogue", "/catalogue"], ["Journal", "/blog"], ["Questions", "/faq"], ["Contact", "/contact"]].map(([l, u]) => lien(k, l, u, { taille: 15, poids: "600", survol: OR, focus: OR })), { gap: "0px 36px", justifie: "center", largeur: "100%" });
    const reseaux = G.code("socials:instagram+pinterest+youtube|plain")(k, env, true);
    const entete = k.col([logo, sous, filet], { gap: "14px", alignItems: "center", width: "100%" });
    const legal = G.ligneLegale({ taille: 12, sansCookies: true })(k, env, true);
    const bande = G.bande(k, [entete, carte, menu, reseaux, hr(k, S.line), legal], { colonne: true, gap: "40px", aligne: "center", padV: ["120px", "96px", "72px"], padB: ["40px", "32px", "28px"], padH: ["48px", "32px", "16px"], fond: "transparent", nom: "Botanique Bio", innerMobile: { rowGap: "32px" } });
    // formes organiques derrière le contenu (décor, sans texte) : conteneur relatif qui les porte
    const dessus = { type: "container", children: [bande], ...sty({ position: "relative", zIndex: 1, display: "flex", flexDirection: "column" }) };
    const scene = { type: "container", props: { full: true }, children: [...decor, dessus], ...sty({ position: "relative", overflowX: "clip", overflowY: "clip", zIndex: 0, display: "flex", flexDirection: "column", backgroundColor: "#243124", gradient: { from: "#34452f", to: "#243124", angle: 180 } }) };
    return [G.racine(k, [scene])];
  },
}, FAM);

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-030 « Horlogerie en Bandeau » — horloger fictif « Verdan ». Noir, blanc de nacre, acier bleuté. Une bande latérale de 96 px porte le NOM à la verticale (comme une signature gravée sur un bracelet) ; trois colonnes très aérées à droite.
// Sur mobile, la bande passe à l'horizontale au-dessus. Cormorant Garamond (nom) + Manrope. Le nom est du texte pivoté de -90° (le moteur n'a pas de writing-mode) ; l'ordre de lecture reste normal.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const verdan = identite({
  key: "c030", label: "Noir, nacre et acier", humeur: "dark",
  fond: "#0c0c0d", texte: "#f1eee6", discret: "#a9a59c", accent: "#b8c2cc", surface: "#18181a",
  police: "font.manrope", titres: "font.cormorant-garamond", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "1px", ligne: "#b8c2cc59",
});
const horlogerieBandeau = modeleV2({
  id: identifiantV2(30, "horlogerie-bandeau"), concept: "c-030-horlogerie-bandeau", name: "Horlogerie en Bandeau", family: FAM,
  description: "Haute horlogerie : une bande latérale étroite porte le nom de la maison à la verticale, comme une signature gravée. À droite, trois colonnes très aérées (trois liens, contact, réseaux) et des filets d'acier. Sur mobile, la bande passe en haut.",
  tags: ["horlogerie", "luxe", "bande latérale", "nom vertical", "noir", "acier", "aéré"],
  identity: verdan,
  racine: { desktop: { backgroundColor: "#0c0c0d", gap: "0px" } },
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ACIER = S.accent;
    const nom = k.T("<p>V E R D A N</p>", { fontFamily: S.head, fontSize: "36px", fontWeight: "500", color: S.fg, letterSpacing: "0.34em", whiteSpace: "nowrap", position: "absolute", top: "50%", left: "50%", transform: { x: "-50%", y: "-50%", rotate: -90 }, lineHeight: 1 },
      undefined, { position: "relative", top: "0px", left: "0px", transform: { x: "0px", y: "0px" }, fontSize: "24px", letterSpacing: "0.3em" });
    const bandeau = { type: "container", children: [nom], ...sty({ position: "relative", width: "96px", flexBasis: "96px", flexGrow: 0, flexShrink: 0, minHeight: "460px", borderStyle: "solid", borderWidth: "0px", borderRightWidth: "1px", borderColor: "#b8c2cc59", display: "block" },
      { width: "96px" }, { width: "100%", flexBasis: "100%", minHeight: "76px", borderRightWidth: "0px", borderBottomWidth: "1px", display: "flex", alignItems: "center", justifyContent: "center" }) };
    const c1 = G.colonne(k, [petit(k, "Maison", { couleur: ACIER, suivi: "0.22em" }), ...[["Boutique", "/boutique"], ["Journal", "/blog"], ["Contact", "/contact"]].map(([l, u]) => lien(k, l, u, { taille: 16, poids: "400", survol: ACIER }))], { poids: 1, min: "200px", gap: "8px" });
    const c2 = G.colonne(k, [petit(k, "Rendez-vous", { couleur: ACIER, suivi: "0.22em" }), G.code("contact:stack")(k, env), lien(k, "Prendre rendez-vous", "/contact", { taille: 16, poids: "400", survol: ACIER })], { poids: 1.3, min: "240px", gap: "14px" });
    const c3 = G.colonne(k, [petit(k, "Suivre", { couleur: ACIER, suivi: "0.22em" }), G.lienFleche("Instagram", "https://www.instagram.com/", { taille: 16, poids: "400", survol: ACIER })(k, env), G.lienFleche("YouTube", "https://www.youtube.com/", { taille: 16, poids: "400", survol: ACIER })(k, env)], { poids: 1, min: "200px", gap: "8px" });
    const cols = G.ligne(k, [c1, c2, c3], { gap: "64px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const legal = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const phrase = G.geant("<p>Prenez<br>le temps.</p>", { taille: [40, 76], lh: 1, suivi: "-0.01em", poids: "400", police: S.head, couleur: S.fg })(k, env);
    const contenu = k.col([phrase, cols, k.col([hr(k, S.line), legal], { gap: "28px", width: "100%" })], { flexGrow: 1, flexBasis: "0px", minWidth: "0px", justifyContent: "space-between", gap: "72px", paddingTop: "104px", paddingBottom: "56px", paddingLeft: "72px", paddingRight: "56px" },
      { paddingLeft: "48px", paddingRight: "32px", paddingTop: "88px" }, { flexBasis: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "48px", paddingBottom: "32px", gap: "56px" });
    const rang = k.row([bandeau, contenu], { gap: "0px", alignItems: "stretch", flexWrap: "nowrap", width: "100%", maxWidth: "1280px", marginLeft: "auto", marginRight: "auto" }, undefined, { flexWrap: "wrap" });
    const bande = G.bande(k, [rang], { colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], fond: S.bg, max: "1280px", nom: "Horlogerie en Bandeau" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-031 « Grand Club Lettre » — marque de thé fictive « Feuille du Dimanche ». La lettre est la vraie action : le champ e-mail est le héros, pleine largeur, sans cadre, avec une ligne de base épaisse de 4 px.
// Consentement toujours visible sous le champ (texte du formulaire publié). Instrument Serif (titre) + Inter. Pêche #f2d8c9 et brun profond.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const dimanche = identite({
  key: "c031", label: "Pêche et brun profond", humeur: "light",
  fond: "#f2d8c9", texte: "#2a1710", discret: "#5b3a2b", accent: "#2a1710", surface: "#fff4ec",
  police: "font.inter", titres: "font.instrument-serif", rayon: "0px", rayonBouton: "999px", ombre: "none", poids: "400", bordure: "0px", ligne: "#2a171040",
});
const grandClubLettre = modeleV2({
  id: identifiantV2(31, "grand-club-lettre"), concept: "c-031-grand-club-lettre", name: "Grand Club Lettre", family: FAM,
  description: "Marque de thé : la lettre d'information est la vraie action. Une invitation en grande typographie serif, puis un champ e-mail géant pleine largeur, sans cadre, posé sur une ligne de base épaisse ; consentement clair dessous, trois liens et mentions.",
  tags: ["thé", "lettre d'information", "champ géant", "pêche", "serif", "formulaire", "minimal"],
  identity: dimanche,
  racine: { desktop: { backgroundColor: "#f2d8c9", gap: "0px" } },
  widgets: ["text", "emailsubscribe", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const marque = k.T("<p>Feuille du Dimanche</p>", { fontFamily: S.head, fontSize: "26px", color: S.fg, lineHeight: 1 });
    const invitation = G.geant("<p>La lettre<br>du dimanche.</p>", { taille: [60, 168], tablette: { taille: [96, 130] }, mobile: { taille: [54, 58] }, lh: 0.92, suivi: "-0.025em", poids: "400", police: S.head, couleur: S.fg })(k, env);
    const note = k.col([petit(k, "Une fois par semaine"), k.T("<p>Une infusion à découvrir, une histoire de feuille, une recette lente. Rien d'autre.</p>", { fontSize: "16px", lineHeight: 1.6, color: S.mute, maxWidth: "340px" })], { gap: "12px", flexBasis: "0px", flexGrow: 1, minWidth: "260px", maxWidth: "360px" });
    const haut = G.ligne(k, [G.colonne(k, [invitation], { poids: 3, min: "300px" }), note], { gap: "40px 64px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    const champ = abo(k, env, { titre: "", intro: "", bouton: "Je m'inscris", largeur: "100%", soulignement: "4px", accent: S.fg, texte: S.fg, tailleChamp: "40px", policeChamp: S.head, survolBouton: "#ffffff", survolTexte: S.fg },
      { champ: { height: "88px", fontFamily: S.head }, bouton: { fontSize: "16px", minHeight: "64px", paddingLeft: "36px", paddingRight: "36px" }, consent: { color: S.fg, fontSize: "14px" }, manque: { fontSize: "18px", color: S.fg } },
      { champ: { height: "68px", fontSize: "26px" }, bouton: { minHeight: "56px", width: "100%" } });
    const pied = G.ligne(k, [G.ligne(k, [lien(k, "Boutique", "/boutique", { taille: 15, poids: "600" }), lien(k, "Journal", "/blog", { taille: 15, poids: "600" }), lien(k, "Contact", "/contact", { taille: 15, poids: "600" })], { gap: "4px 32px" }),
      G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Pinterest", "https://www.pinterest.com/"]], { taille: 15, poids: "600", survol: S.mute })(k, env)], { gap: "16px 48px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const bande = G.bande(k, [marque, haut, champ, hr(k, S.line), pied, G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { colonne: true, gap: "48px", padV: ["96px", "72px", "56px"], padB: ["40px", "32px", "28px"], padH: ["56px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "36px" }, nom: "Grand Club Lettre" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// c-032 « Brocante Annuaire » — marketplace d'occasion fictive « Revenant ». Papier kraft, brun, rouge tampon. Un tampon rond (widget Texte sur un tracé, en cercle) à côté du nom, la lettre soulignée,
// puis un ANNUAIRE dense de six cartes de liens (rayons réels de la boutique, achats, compte, aide, livraison, paiement). Zilla Slab + Karla. Le tampon est figé (le concept le voulait rotatif).
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const kraft = identite({
  key: "c032", label: "Kraft, brun et rouge tampon", humeur: "light",
  fond: "#ebdfc9", texte: "#2b2218", discret: "#5a4b37", accent: "#b3412e", surface: "#f6eedd",
  police: "font.karla", titres: "font.zilla-slab", rayon: "14px", rayonBouton: "6px", ombre: "none", poids: "700", bordure: "1px", ligne: "#2b221833",
});
const brocanteAnnuaire = modeleV2({
  id: identifiantV2(32, "brocante-annuaire"), concept: "c-032-brocante-annuaire", name: "Brocante Annuaire", family: FAM,
  description: "Seconde main : papier kraft, brun et rouge tampon. Un tampon rond de texte en cercle près du nom, la lettre soulignée, puis un annuaire dense de six cartes de liens (rayons, achats, compte, aide, livraison, paiement).",
  tags: ["seconde main", "brocante", "annuaire", "kraft", "tampon", "rouge", "dense"],
  identity: kraft,
  racine: { desktop: { backgroundColor: "#ebdfc9", gap: "0px" } },
  widgets: ["text", "textpath", "emailsubscribe", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, ROUGE = S.accent;
    // tampon : cercle de texte (widget Texte sur un tracé : cercle de 280 unités dans un cadre de 600 × 200 → à 210 px de large, échelle 0,35 : anneau de ≈ 100 px) + filet circulaire intérieur
    const tampon = { type: "textpath", props: { text: "SECONDE VIE · SECONDE MAIN · ", shape: "circle", fontSize: 44, weight: "700", color: ROUGE, showPath: false }, ...sty({ position: "absolute", left: "0px", top: "0px", width: "210px" }) };
    const rond = k.col([], { position: "absolute", left: "63px", top: "14px", width: "84px", height: "84px", borderRadius: "999px", borderStyle: "solid", borderWidth: "2px", borderColor: ROUGE, boxSizing: undefined });
    const sceau = { type: "container", children: [tampon, rond], ...sty({ position: "relative", width: "210px", height: "112px", flexShrink: 0 }, undefined, { width: "210px" }) };
    const nom = k.col([k.T("<p>Revenant</p>", { fontFamily: S.head, fontSize: "fluid:44-84", fontWeight: "700", lineHeight: 1, color: S.fg, letterSpacing: "-0.01em" }), k.T("<p>Le marché de l'occasion : ça circule, ça dure.</p>", { fontSize: "18px", fontFamily: S.head, fontWeight: "400", color: S.mute, lineHeight: 1.5 })], { gap: "10px", flexGrow: 1, minWidth: "240px" });
    const marque = G.ligne(k, [sceau, nom], { gap: "24px 28px", aligne: "center", justifie: "flex-start" });
    marque.styles.desktop = { ...marque.styles.desktop, flexBasis: "0px", flexGrow: 6, minWidth: "320px" };
    const lettre = G.colonne(k, [abo(k, env, { titre: "Lettre du dépôt-vente", intro: "Les arrivages de la semaine, une fois par semaine.", bouton: "S'inscrire", largeur: "420px", soulignement: "2px", accent: ROUGE, texte: S.fg, tailleChamp: "16px", survolBouton: S.fg, survolTexte: S.bg, styleTitre: { fontFamily: S.head, color: S.fg, fontSize: "20px", fontWeight: "700", marginBottom: "4px" } },
      { bouton: { borderRadius: "6px", fontWeight: "700" } })], { poids: 5, min: "300px" });
    const haut = G.ligne(k, [marque, lettre], { gap: "40px 64px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const b1 = G.bande(k, [haut], { colonne: true, padV: ["64px", "56px", "40px"], padB: ["40px", "32px", "28px"], padH: ["40px", "28px", "16px"], fond: S.bg, nom: "Brocante Annuaire" });
    // annuaire : six cartes
    const carte = (titre, enfants) => k.col([k.T(`<p>${titre}</p>`, { fontFamily: S.head, fontSize: "18px", fontWeight: "700", color: S.fg, lineHeight: 1.2, borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: ROUGE, paddingBottom: "8px", width: "100%" }), ...enfants],
      { backgroundColor: S.alt, borderStyle: "solid", borderWidth: "1px", borderColor: "#2b221833", borderRadius: "14px", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "18px", paddingRight: "18px", gap: "12px", alignItems: "flex-start" });
    const L = (arr) => listeLiens(k, arr, { couleur: S.fg, taille: 14, survol: ROUGE, gap: "0px" });
    const cartes = [
      carte("Rayons", [G.code("shopcats:10")(k, env)]),
      carte("Acheter", [L([["Boutique", "/boutique"], ["Catalogue", "/catalogue"], ["Panier", "/boutique/panier"], ["Liste d'envies", "/boutique/souhaits"]])]),
      carte("Mon compte", [L([["Se connecter", "/connexion"], ["Créer un compte", "/inscription"], ["Suivre ma commande", "/boutique/compte"]])]),
      carte("Aide", [L([["Questions fréquentes", "/faq"], ["Nous contacter", "/contact"], ["Journal", "/blog"]])]),
      carte("Livraison", [livraison(k, env)]),
      carte("Paiement", [paiement(k, env, { titre: "" }), G.code("socials:instagram+pinterest|plain")(k, env)]),
    ];
    const grille = { type: "grid", children: cartes, ...sty({ columns: 6, gap: "14px", width: "100%" }, { columns: 3 }, { columns: 2 }) };
    const legal = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const b2 = G.bande(k, [grille, legal], { colonne: true, gap: "32px", padV: ["16px", "16px", "8px"], padB: ["32px", "28px", "24px"], padH: ["40px", "28px", "16px"], fond: S.bg, innerMobile: { rowGap: "28px" } });
    return [G.racine(k, [b1, b2])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "E-commerce, mode et luxe", target: 9, built: true,
  description: "Boutiques, maisons de mode et de luxe : élégance, réassurance, catalogue et service client.",
  models: [maisonIvoire, marcheTerroir, dropSneakers, conceptStorePastel, friseConfiance, botaniqueBio, horlogerieBandeau, grandClubLettre, brocanteAnnuaire],
};
