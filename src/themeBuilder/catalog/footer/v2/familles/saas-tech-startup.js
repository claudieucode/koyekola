// Famille v2 « SaaS, tech et startup » — cible 9 modèles (concepts c-015 à c-023 de docs/footer-v2/CONCEPTS_100.md).
// Tant que `built` est false, la famille n'apporte rien à la bibliothèque PUBLIQUE (la liste actuelle reste intacte) ; passer à true UNIQUEMENT quand models.length === target.
// Les modèles s'écrivent avec ../kit-v2 (modeleV2, identite, gestes G.*) et s'insèrent en mode « solo » (indépendants du site).
// Modèle de référence de toute la bibliothèque v2 : ft2-017-phrase-de-lancement (annoté dans docs/footer-v2/GUIDE_CONSTRUIRE_UN_MODELE_V2.md).
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "saas-tech-startup";

// ── Aides LOCALES à la famille (le kit v2 ne les fournit pas) ──────────────────────────────────────────────────────────────────────────────────
// Petit libellé en capitales espacées
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "600", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }), o.tablette, o.mobile);
// Lien de texte fini par le moteur (états, 44 px sur mobile) puis états propres : survol { …styles }, focus (contour 2 px)
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: o.h, paddingLeft: o.padH, paddingRight: o.padH, borderRadius: o.rayon, lineHeight: o.lh, letterSpacing: o.suivi, transitionDuration: GK.MOUVEMENT, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
// Réseaux en icônes (disques ou carrés de 44 px) aux couleurs du modèle : parties du widget « Réseaux sociaux »
function reseauxIcones(k, env, liste, o = {}) {
  const S = k.S, n = Moteur.item(k, `socials:${liste.join("+")}`, env);
  n.props.size = String(o.taille || 44); n.props.shape = o.forme || "circle";
  Moteur.mergePart(n, "link", { styles: { desktop: compact({ color: o.couleur || S.fg, backgroundColor: o.fond, borderStyle: o.contour ? "solid" : undefined, borderWidth: o.contour ? (o.epaisseur || "1px") : undefined, borderColor: o.contour, transitionDuration: GK.MOUVEMENT }) },
    states: { hover: { backgroundColor: o.survolFond || S.accent, color: o.survolCouleur || S.onAccent, borderColor: o.survolFond || S.accent }, focus: GK.focus(o.focus || S.accent) } });
  return n;
}
// Logo du site (widget Logo) avec un état de survol : la couleur d'accent apparaît au survol et au focus
const logo = (k, env, taille, couleur) => { const n = Moteur.item(k, `logo:${taille}`, env); n.states = { hover: { color: couleur || k.S.accent, textDecoration: "underline" } }; Moteur.mergePart(n, "text", { styles: { desktop: { transitionDuration: GK.MOUVEMENT } } }); return n; };
// Trait fin pleine largeur
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });

// ── c-017 « Phrase de Lancement » ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : une PHRASE MONUMENTALE (« Prêts à lancer ? ») remplace le bloc de liens ; le champ e-mail se glisse juste à côté, souligné de citron ; les liens utiles tiennent en pilules,
// les réseaux sont des noms suivis d'une flèche ↗, les mentions légales en 12 px. Violet électrique #4B2BFF, blanc, citron #CAFF3D. Polices : Sora 800 (titre ; remplace Unbounded du concept, défectueux en gras) et Inter (texte), auto-hébergées.
// Contraste d'échelle : 180 px (phrase) contre 12 px (mentions). Aucun logo, aucune coordonnée (elles restent derrière le lien Contact), aucune donnée inventée.
const orbito = identite({
  key: "c017", label: "Violet électrique et citron", humeur: "dark",
  fond: "#4b2bff", texte: "#ffffff", discret: "#d6d0ff", accent: "#caff3d", surface: "#6347ff",
  police: "font.inter", titres: "font.sora", // Sora et non Unbounded : voir « Polices d'affichage » du guide (Unbounded a des encoches parasites dès 500 de graisse)
  rayon: "20px", rayonBouton: "999px", ombre: "none", poids: "700", bordure: "0px", ligne: "#ffffff40",
});

const phraseLancement = modeleV2({
  id: identifiantV2(17, "phrase-de-lancement"), concept: "c-017-phrase-de-lancement",
  name: "Phrase de lancement", family: FAM,
  description: "Une phrase monumentale en violet électrique remplace le bloc de liens : « Prêts à lancer ? ». Le champ e-mail souligné de citron se glisse à côté, les liens sont des pilules, les réseaux des noms suivis d'une flèche.",
  tags: ["startup", "phrase géante", "newsletter", "pilules", "violet", "citron", "typographie"],
  identity: orbito,
  racine: { desktop: { backgroundColor: "#4b2bff", gap: "0px" } }, // le pied lui-même : même fond que le bas du dégradé, pas d'écart blanc avant la ligne légale du site
  widgets: ["text", "emailsubscribe", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · la phrase : Sora 800, 64 → 180 px selon l'écran, interligne 0,95 ; le dernier mot et le point d'interrogation en citron
    const phrase = G.geant(`<p>Prêts&nbsp;à<br><span style="color:${S.accent}">lancer&nbsp;?</span></p>`, { taille: [64, 180], tablette: { taille: [110, 150] }, mobile: { taille: [64, 180] }, lh: 0.95, suivi: "-0.035em", poids: "800", police: S.head, couleur: S.fg })(k, env);
    const filetCitron = G.filet({ largeur: "56px", epaisseur: "4px" })(k, env);
    // 2 · la newsletter : titre-libellé + introduction + champ souligné + bouton pilule (ou message « non configuré » en pointillés)
    const abo = G.abonnement({ titre: "Newsletter", intro: "Recevez les nouveautés et les annonces de lancement.", bouton: "S'abonner", largeur: "440px" })(k, env);
    // tablette (768–1023 px) : la phrase prend toute la ligne (plus grande), le champ passe dessous derrière un filet horizontal ; mobile : empilés sans filet
    const gauche = G.colonne(k, [filetCitron, phrase], { poids: 8, min: "300px", gap: "28px", aligne: "flex-start", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "0px" } });
    // à droite : un filet vertical fin sépare la phrase du champ (disparaît quand les deux zones s'empilent sur mobile)
    const droite = G.colonne(k, [abo], { poids: 4, min: "280px", gap: "14px", aligne: "flex-start", soi: "flex-end", extra: { borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: S.line, paddingLeft: "32px", paddingTop: "8px", paddingBottom: "8px" }, tablette: { flexBasis: "100%", borderLeftWidth: "0px", paddingLeft: "0px", borderTopWidth: "1px", paddingTop: "32px" }, mobile: { flexBasis: "0px", borderTopWidth: "0px", paddingTop: "8px" } });
    const haut = G.ligne(k, [gauche, droite], { gap: "48px 64px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    // 3 · le filet fin, puis les liens utiles en pilules à gauche et les réseaux en noms ↗ à droite
    const filet = k.divider({ width: "100%", borderColor: S.line, borderTopWidth: "1px", marginTop: "0px", marginBottom: "0px" });
    const pilules = G.pilules([["Blog", "/blog"], ["FAQ", "/faq"], ["Contact", "/contact"], ["Connexion", "/connexion"]], { contour: "#ffffff66", gap: "10px" })(k, env);
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["LinkedIn", "https://www.linkedin.com/"], ["X", "https://x.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15 })(k, env);
    const milieu = G.ligne(k, [pilules, reseaux], { gap: "20px 48px", aligne: "center", justifie: "space-between", largeur: "100%" });
    // 4 · les mentions : copyright automatique (année + raison sociale) et liens légaux, 12 px
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [haut, filet, milieu, mentions], {
      colonne: true, gap: "44px", max: "1280px", padV: ["112px", "88px", "64px"], padB: ["56px", "48px", "40px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "32px" },
      degrade: { from: "#6347ff", to: "#4b2bff", angle: 200 }, nom: "Phrase de lancement",
    });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── c-015 « Palette de commandes » ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : le pied ressemble à la palette de commandes d'un outil de développeur. Au centre, une fenêtre sombre : le champ de recherche du site (widget Recherche réel, suggestions comprises) puis trois lignes de liens
// rangées par rubrique, séparées par des points ; un filet lumineux violet pâle borde le haut. Noir presque pur #08090A, violet #7C8CFF réservé au filet et au focus. Polices : Geist (titres, logo) et Geist Mono (texte).
// Écarts au concept : le raccourci « ⌘K » n'est PAS dessiné (il aurait l'air fonctionnel), le sélecteur de langue (widget inexistant) est omis ; les liens sont les pages réelles de la plateforme.
const relay = identite({
  key: "c015", label: "Noir presque pur et violet pâle", humeur: "dark",
  fond: "#08090a", texte: "#edeef0", discret: "#9a9fa8", accent: "#7c8cff", surface: "#14161a",
  police: "font.geist-mono", titres: "font.geist",
  rayon: "20px", rayonBouton: "12px", ombre: "none", poids: "600", bordure: "1px", ligne: "#ffffff1f",
});

const paletteCommandes = modeleV2({
  id: identifiantV2(15, "palette-de-commandes"), concept: "c-015-palette-de-commandes",
  name: "Palette de commandes", family: FAM,
  description: "Un pied qui invite d'abord à chercher : une fenêtre sombre façon palette de commandes avec le vrai champ de recherche du site, puis trois lignes de liens denses. Noir presque pur, filet lumineux violet pâle.",
  tags: ["développeurs", "recherche", "sombre", "dense", "mono", "palette de commandes"],
  identity: relay,
  racine: { desktop: { backgroundColor: "#08090a", gap: "0px" } },
  widgets: ["sitelogo", "search", "link", "text", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ligneHalo = "#232637";
    // 1 · le filet lumineux de 1 px au bord haut : dégradé horizontal transparent → violet pâle → transparent
    const halo = k.col([], { width: "100%", height: "1px", gradient: { from: "#08090a", to: "#08090a", angle: 90, extra: [{ color: S.accent, at: 50 }] } });
    // 2 · barre d'en-tête : logo à gauche, accès à droite
    const barre = G.ligne(k, [logo(k, env, 30), lien(k, "Connexion →", "/connexion", { taille: 14, poids: "600", h: "44px" })], { justifie: "space-between", aligne: "center", largeur: "100%" });
    // 3 · le champ de recherche (widget réel) : grand champ sombre, contour violet pâle au focus
    const champ = k.W("search", { target: "site", placeholder: "Rechercher dans le site…", button: "Rechercher" }, { width: "100%" });
    champ.parts = {
      field: { styles: { desktop: { fontFamily: S.font, fontSize: "17px", color: S.fg, backgroundColor: "#0b0c0f", borderStyle: "solid", borderWidth: "1px", borderColor: "#ffffff26", borderRadius: "14px", height: "58px", paddingLeft: "20px" }, mobile: { height: "48px" } }, states: { focus: { borderColor: S.accent, outlineStyle: "solid", outlineWidth: "2px", outlineColor: S.accent, outlineOffset: "2px" } } },
      button: { styles: { desktop: { fontFamily: S.font, fontSize: "14px", fontWeight: "600", color: S.onAccent, backgroundColor: S.accent, borderRadius: "14px", height: "58px", paddingLeft: "26px", paddingRight: "26px" }, mobile: { height: "48px", width: "100%" } }, states: { hover: { backgroundColor: S.fg, color: S.bg }, focus: GK.focus(S.fg) } },
    };
    // 4 · trois lignes de liens : intitulé en capitales à gauche, liens à droite séparés par des points (les points disparaissent sur mobile)
    const point = () => ({ ...k.T("<p>·</p>", { color: S.mute, fontSize: "18px", lineHeight: 1, paddingLeft: "2px", paddingRight: "2px" }), hideOn: ["mobile"] });
    const groupe = (titre, liens) => {
      const items = [];
      liens.forEach(([l, u], i) => { if (i) items.push(point()); items.push(lien(k, l, u, { taille: 15, h: "40px", padH: "12px", rayon: "10px", survol: { backgroundColor: "#1f232b", color: S.fg, textDecoration: "none" }, focus: S.accent })); });
      return k.row([caps(k, titre, { extra: { width: "128px", flexShrink: 0 } }), k.row(items, { gap: "0px", alignItems: "center", flexGrow: 1, flexBasis: "0px", minWidth: "0px", marginLeft: "-12px" }, undefined, { marginLeft: "-12px" })],
        { ...GK.gaps("6px 24px"), alignItems: "center", width: "100%", paddingTop: "10px", paddingBottom: "10px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#ffffff17" }, undefined, { alignItems: "flex-start", flexDirection: "column", gap: "2px" });
    };
    const palette = k.col([champ, k.col([groupe("Produit", [["Catalogue", "/catalogue"], ["Boutique", "/boutique"], ["Inscription", "/inscription"]]), groupe("Ressources", [["Blog", "/blog"], ["FAQ", "/faq"], ["Cookies", "/cookies"]]), groupe("Société", [["Accueil", "/"], ["Contact", "/contact"], ["Connexion", "/connexion"]])], { gap: "0px", width: "100%" })], {
      backgroundColor: S.alt, borderRadius: "22px", borderStyle: "solid", borderWidth: "1px", borderColor: "#ffffff1f", paddingTop: "18px", paddingBottom: "8px", paddingLeft: "18px", paddingRight: "18px", gap: "18px", width: "100%", maxWidth: "960px", marginLeft: "auto", marginRight: "auto",
      shadow: { x: 0, y: 40, blur: 90, spread: -30, color: "#000000e6" },
    }, { paddingLeft: "16px", paddingRight: "16px" }, { paddingTop: "14px", paddingLeft: "12px", paddingRight: "12px", borderRadius: "18px" });
    // 5 · pied de la page : réseaux en texte à gauche, mentions à droite
    const reseaux = G.reseauxTexte([["GitHub", "https://github.com/"], ["X", "https://x.com/"], ["LinkedIn", "https://www.linkedin.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 14, couleur: S.mute })(k, env);
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [barre, palette, k.col([trait(k, "#ffffff17"), G.ligne(k, [reseaux], { justifie: "flex-start", largeur: "100%" }), mentions], { gap: "6px", width: "100%", maxWidth: "960px", marginLeft: "auto", marginRight: "auto" })],
      { colonne: true, gap: "40px", max: "1080px", padV: ["40px", "40px", "32px"], padB: ["32px", "28px", "28px"], padH: ["32px", "28px", "16px"], fond: S.bg, innerMobile: { rowGap: "28px" }, degrade: { type: "radial", from: "#10132a", to: "#08090a", angle: 0, toAt: 72 }, nom: "Palette de commandes" });
    return [G.racine(k, [halo, bande])];
  },
}, FAM);

// ── c-016 « Onglets documentation » ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : un pied bas et court pour une documentation très riche. Une fenêtre à angles droits (barre de titre « portail / pied-de-page »), trois ONGLETS (conteneur en mode onglets : clavier, flèches, un seul panneau visible),
// chaque panneau est une liste de liens sur deux colonnes ; l'onglet actif est souligné d'ambre, le survol d'un lien inverse fond et texte. Gris charbon chaud #1A1B1E, ambre #F2A93B. Polices : IBM Plex Mono (onglets, titre) et IBM Plex Sans (liens).
// Écarts au concept : onglets nommés Produit / Ressources / Société (aucune page « Développeurs » réelle) ; le curseur ▌ n'est pas dessiné (glyphe absent de la police).
const portail = identite({
  key: "c016", label: "Charbon chaud et ambre", humeur: "dark",
  fond: "#1a1b1e", texte: "#e8e6e1", discret: "#a7a39b", accent: "#f2a93b", surface: "#26272b",
  police: "font.ibm-plex-sans", titres: "font.ibm-plex-mono",
  rayon: "2px", rayonBouton: "2px", ombre: "none", poids: "600", bordure: "1px", ligne: "#3b3d42",
});

const ongletsDoc = modeleV2({
  id: identifiantV2(16, "onglets-documentation"), concept: "c-016-onglets-documentation",
  name: "Onglets documentation", family: FAM,
  description: "Un pied bas et court pour une documentation riche : une fenêtre à angles droits avec trois onglets qui n'affichent qu'une liste de liens à la fois. Gris charbon chaud, ambre pour l'onglet actif, titres en mono.",
  tags: ["documentation", "onglets", "mono", "angles droits", "charbon", "ambre", "compact"],
  identity: portail,
  racine: { desktop: { backgroundColor: "#1a1b1e", gap: "0px" } },
  widgets: ["sitelogo", "link", "text", "copyright", "bizlegal", "container"],
  compose(k, env, G) {
    const S = k.S, mono = S.head;
    // 1 · les liens d'un panneau : flèche d'ambre + lien ; au survol, fond et texte s'inversent
    const entree = (label, url) => lien(k, `› ${label}`, url, { taille: 15, h: "44px", padH: "12px", extra: { width: "100%" }, survol: { backgroundColor: S.fg, color: S.bg, textDecoration: "none" }, focus: S.accent });
    const colonneLiens = (liste) => k.col(liste.map(([l, u]) => entree(l, u)), { gap: "0px", flexBasis: "0px", flexGrow: 1, minWidth: "220px" });
    const panneau = (nom, a, b) => ({ type: "container", name: nom, children: [colonneLiens(a), colonneLiens(b)], ...sty({ display: "flex", flexDirection: "row", flexWrap: "wrap", ...GK.gaps("0px 40px"), alignItems: "flex-start", width: "100%" }) });
    const onglets = { type: "container", props: { mode: "tabs", tabsLook: "line", tabsStart: 1 }, children: [
      panneau("Produit", [["Catalogue", "/catalogue"], ["Boutique", "/boutique"]], [["Inscription", "/inscription"], ["Connexion", "/connexion"]]),
      panneau("Ressources", [["Blog", "/blog"], ["Questions fréquentes", "/faq"]], [["Contact", "/contact"], ["Cookies", "/cookies"]]),
      panneau("Société", [["Accueil", "/"], ["Contact", "/contact"]], [["Connexion", "/connexion"], ["Inscription", "/inscription"]]),
    ], ...sty({ display: "flex", flexDirection: "column", gap: "0px", color: S.fg, fontFamily: mono, fontSize: "15px", lineHeight: 1.75, fontWeight: "600", width: "100%" }) };
    // 2 · la fenêtre : barre de titre (trois carrés, chemin en mono) puis les onglets
    const carre = (c) => k.col([], { width: "10px", height: "10px", backgroundColor: c, flexShrink: 0 });
    const titre = k.row([k.row([carre(S.accent), carre("#55575c"), carre("#55575c")], { gap: "6px", flexWrap: "nowrap" }), k.T("<p>portail / pied-de-page</p>", { fontFamily: mono, fontSize: "13px", color: S.mute, lineHeight: 1.2 })], { gap: "16px", alignItems: "center", flexWrap: "nowrap", width: "100%", backgroundColor: S.alt, paddingTop: "14px", paddingBottom: "14px", paddingLeft: "20px", paddingRight: "20px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: S.line });
    Object.assign(onglets.styles.desktop, { paddingTop: "10px", paddingBottom: "22px", paddingLeft: "20px", paddingRight: "20px" }); onglets.styles.mobile = { paddingLeft: "10px", paddingRight: "10px" };
    const fenetre = k.col([titre, onglets], { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "1px", borderColor: S.line, backgroundColor: S.bg });
    // 3 · ligne du bas : logo, réseaux en texte, mentions
    const haut = G.ligne(k, [logo(k, env, 30), G.reseauxTexte([["GitHub", "https://github.com/"], ["X", "https://x.com/"], ["LinkedIn", "https://www.linkedin.com/"]], { taille: 14, couleur: S.mute })(k, env)], { justifie: "space-between", aligne: "center", largeur: "100%", gap: "8px 32px" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [haut, fenetre, mentions], { colonne: true, gap: "28px", max: "1080px", padV: ["64px", "56px", "40px"], padB: ["32px", "28px", "28px"], padH: ["40px", "28px", "16px"], fond: S.bg, innerMobile: { rowGap: "24px" }, nom: "Onglets documentation" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── c-018 « Aurore IA » ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : un produit d'IA sans image ni canvas : deux taches de lumière violette et cyan (dégradés radiaux floutés) derrière une grande CARTE DE VERRE DÉPOLI (flou d'arrière-plan, filet blanc à 14 %) qui porte la marque,
// une phrase, le champ e-mail en pilule, les liens en pilules sombres et les réseaux en disques de 44 px. Fond nuit #0B0B1E, violet #8F7BFF. Polices : Space Grotesk (titres) et DM Sans (texte ; Figtree du concept remplacée : même esprit, et Figtree entre en conflit avec la police du site de test).
// Écarts au concept : pas de menu « Menu » replié sur mobile (les pilules passent simplement à la ligne : plus simple et accessible) ; l'apparition en fondu n'est pas posée (pas d'animation d'entrée sûre dans le moteur).
const lumen = identite({
  key: "c018", label: "Nuit, violet et cyan", humeur: "dark",
  fond: "#0b0b1e", texte: "#f4f4ff", discret: "#b4b4d6", accent: "#8f7bff", surface: "#1a1a38",
  police: "font.dm-sans", titres: "font.space-grotesk",
  rayon: "32px", rayonBouton: "999px", ombre: "none", poids: "600", bordure: "1px", ligne: "#ffffff24",
});

const aurore = modeleV2({
  id: identifiantV2(18, "aurore-ia"), concept: "c-018-aurore-ia",
  name: "Aurore IA", family: FAM,
  description: "Deux taches de lumière violette et cyan, sans image, derrière une grande carte de verre dépoli : marque, phrase, champ e-mail en pilule, liens en pilules sombres et réseaux en disques. Fond nuit.",
  tags: ["intelligence artificielle", "verre dépoli", "aurore", "dégradé", "pilules", "nuit", "violet"],
  identity: lumen,
  racine: { desktop: { backgroundColor: "#0b0b1e", gap: "0px" } },
  widgets: ["sitelogo", "text", "emailsubscribe", "link", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · les taches de lumière : conteneurs vides à fond radial flouté, posés en absolu derrière la carte
    const tache = (st, mob) => ({ type: "container", children: [], ...sty({ position: "absolute", borderRadius: "50%", pointerEvents: "none", zIndex: 0, filter: { blur: 36 }, ...st }, undefined, mob) });
    const violette = tache({ width: "560px", height: "560px", top: "-120px", left: "6%", gradient: { type: "radial", from: "#7a5cffd9", to: "#7a5cff00", angle: 0, toAt: 70 } }, { width: "320px", height: "320px", top: "-60px", left: "-60px" });
    const cyan = tache({ width: "520px", height: "520px", bottom: "-60px", right: "4%", gradient: { type: "radial", from: "#18c8e08c", to: "#18c8e000", angle: 0, toAt: 70 } }, { width: "280px", height: "280px", bottom: "-20px", right: "-120px" });
    // 2 · la carte : marque + phrase à gauche, newsletter à droite
    const marque = logo(k, env, 34);
    const phraseCarte = G.texteFluide("<p>Des réponses claires, à la vitesse de la pensée.</p>", { taille: [26, 42], tablette: { taille: [30, 38] }, lh: 1.12, suivi: "-0.02em", poids: "600", police: S.head, couleur: S.fg, largeur: "560px" })(k, env);
    const gauche = G.colonne(k, [marque, phraseCarte], { poids: 6, min: "280px", gap: "22px" });
    const abo = G.abonnement({ titre: "Newsletter", intro: "Les nouveautés du produit, une fois par mois.", bouton: "S'abonner", largeur: "460px", soulignement: "0px", fondChamp: "#ffffff12", rayonChamp: "999px", rembChamp: "22px", tailleChamp: "16px" })(k, env);
    abo.parts.input.styles.desktop = { ...abo.parts.input.styles.desktop, borderWidth: "1px", borderColor: "#ffffff2e", borderBottomWidth: "1px" };
    const droite = G.colonne(k, [abo], { poids: 5, min: "280px", gap: "12px", soi: "flex-end" });
    const haut = G.ligne(k, [gauche, droite], { gap: "36px 56px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    // 3 · pilules sombres + disques de réseaux
    const pilules = G.pilules([["Catalogue", "/catalogue"], ["Blog", "/blog"], ["FAQ", "/faq"], ["Contact", "/contact"], ["Connexion", "/connexion"]], { fond: "#ffffff0f", contour: "#ffffff29", survolFond: S.accent, gap: "10px" })(k, env);
    const ronds = reseauxIcones(k, env, ["linkedin", "x", "youtube", "instagram"], { taille: 44, forme: "circle", fond: "#ffffff12", contour: "#ffffff29" });
    const bas = G.ligne(k, [pilules, ronds], { gap: "20px 32px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const carte = k.col([haut, trait(k, "#ffffff1f"), bas], {
      backgroundColor: "#ffffff0d", borderStyle: "solid", borderWidth: "1px", borderColor: "#ffffff24", borderRadius: "32px", gap: "36px", width: "100%", paddingTop: "52px", paddingBottom: "44px", paddingLeft: "52px", paddingRight: "52px",
      backdrop: { blur: 24, saturate: 140 }, zIndex: 1, position: "relative",
    }, { paddingTop: "40px", paddingLeft: "36px", paddingRight: "36px", paddingBottom: "36px" }, { paddingTop: "28px", paddingBottom: "24px", paddingLeft: "20px", paddingRight: "20px", borderRadius: "24px", gap: "28px" });
    const mentions = k.col([G.ligneLegale({ taille: 12, sansCookies: true, couleur: "#dcdcf5" })(k, env)], { width: "100%", position: "relative", zIndex: 1 });
    const bande = G.bande(k, [carte, mentions], { colonne: true, gap: "28px", max: "1180px", padV: ["96px", "72px", "56px"], padB: ["40px", "36px", "32px"], padH: ["40px", "28px", "16px"], fond: S.bg, innerMobile: { rowGap: "24px" }, nom: "Aurore IA" });
    const calque = { type: "container", children: [violette, cyan], ...sty({ position: "absolute", top: "0px", left: "0px", right: "0px", bottom: "0px", overflow: "hidden", pointerEvents: "none", zIndex: 0 }) };
    Object.assign(bande.styles.desktop, { position: "relative" });
    const inner = bande.children[0]; Object.assign(inner.styles.desktop, { position: "relative", zIndex: 1 });
    bande.children.unshift(calque);
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── c-019 « Statut Nuage » ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : le pied d'un hébergeur dit d'abord si tout va bien : une PASTILLE DE STATUT (point vert + libellé, jamais la couleur seule) et le bouton d'essai en tête, un gros filet de 2 px, puis cinq colonnes à intitulés en capitales
// séparées par de fins filets, sans boîte. Sur mobile les colonnes deviennent des volets de 48 px. Blanc bleuté #F4F7FB, bleu franc #0A6ED1. Polices : Albert Sans (marque, titres ; remplace Figtree du concept) et Hanken Grotesk (texte).
// HONNÊTETÉ : il n'existe aucune source de statut réelle : la pastille est une illustration STATIQUE marquée « exemple » (à remplacer par votre vrai état de service, ou à supprimer). Sélecteur de langue omis (widget inexistant).
const altocloud = identite({
  key: "c019", label: "Blanc bleuté et bleu franc", humeur: "light",
  fond: "#f4f7fb", texte: "#0f1b2d", discret: "#4c5b70", accent: "#0a6ed1", surface: "#e1e9f3",
  police: "font.hanken-grotesk", titres: "font.albert-sans",
  rayon: "0px", rayonBouton: "6px", ombre: "none", poids: "700", bordure: "1px", ligne: "#c6d2e3",
});

const statutNuage = modeleV2({
  id: identifiantV2(19, "statut-nuage"), concept: "c-019-statut-nuage",
  name: "Statut nuage", family: FAM,
  description: "Le pied d'un hébergeur : pastille de statut et bouton d'essai en tête, gros filet, puis cinq colonnes à intitulés en capitales séparées par de fins filets. Repliées en volets sur mobile. Blanc bleuté, bleu franc.",
  tags: ["cloud", "hébergement", "statut", "colonnes", "filets", "clair", "bleu", "dense"],
  identity: altocloud,
  racine: { desktop: { backgroundColor: "#f4f7fb", gap: "0px" } },
  widgets: ["sitelogo", "button", "link", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, vert = "#16854a";
    // 1 · pastille de statut (exemple) : point + libellé + mot « exemple »
    const point = k.col([], { width: "10px", height: "10px", borderRadius: "50%", backgroundColor: vert, flexShrink: 0 });
    const pastille = k.row([point, k.T("<p>Tous les systèmes fonctionnent</p>", { fontFamily: S.font, fontSize: "14px", fontWeight: "600", color: S.fg, lineHeight: 1.3 }), k.T("<p>exemple</p>", { fontFamily: S.font, fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: S.mute, lineHeight: 1.3, borderStyle: "solid", borderWidth: "1px", borderColor: S.line, paddingTop: "2px", paddingBottom: "2px", paddingLeft: "7px", paddingRight: "7px" })],
      { gap: "10px", alignItems: "center", flexWrap: "nowrap", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "1px", borderColor: S.line, borderRadius: "999px", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "16px", paddingRight: "16px" }, undefined, { flexWrap: "wrap" });
    const essai = GK.fini(k, k.B("Essai gratuit", "/inscription", "solid", { fontFamily: S.font, fontSize: "15px", fontWeight: "700", minHeight: "48px", display: "inline-flex", alignItems: "center", paddingLeft: "24px", paddingRight: "24px" }));
    const acces = lien(k, "Se connecter", "/connexion", { taille: 15, poids: "600", h: "48px", extra: { textDecoration: "underline", textUnderlineOffset: "4px" } });
    const tete = G.ligne(k, [k.row([logo(k, env, 34), pastille], { ...GK.gaps("20px 28px"), alignItems: "center" }), k.row([acces, essai], { ...GK.gaps("8px 18px"), alignItems: "center" })], { justifie: "space-between", aligne: "center", largeur: "100%", gap: "16px 32px" });
    // 2 · cinq colonnes (volets sur mobile). Les titres de volet sont posés par le conteneur ; chaque liste est faite de liens maison.
    const liste = (liens) => (kk) => kk.col(liens.map(([l, u]) => lien(kk, l, u, { taille: 15, h: "36px", survol: { color: S.accent, textDecoration: "underline" } })), { gap: "0px", alignItems: "flex-start" });
    const colonnes = Moteur.accordionNode(k, env, false, [
      { title: "Produit", codes: [liste([["Catalogue", "/catalogue"], ["Boutique", "/boutique"], ["Inscription", "/inscription"]])] },
      { title: "Ressources", codes: [liste([["Blog", "/blog"], ["FAQ", "/faq"], ["Cookies", "/cookies"]])] },
      { title: "Société", codes: [liste([["Accueil", "/"], ["Contact", "/contact"], ["Connexion", "/connexion"]])] },
      { title: "Coordonnées", w: 1.2, codes: ["contact"] },
      { title: "Réseaux", codes: [(kk, ee, c) => kk.col([["LinkedIn", "https://www.linkedin.com/"], ["X", "https://x.com/"], ["YouTube", "https://www.youtube.com/"], ["GitHub", "https://github.com/"]].map(([l, u]) => lien(kk, `${l} ↗`, u, { taille: 15, h: "36px", survol: { color: S.accent, textDecoration: "underline" } })), { gap: "0px", alignItems: "flex-start" })] },
    ], { alignItems: "flex-start", maxWidth: "1280px", width: "100%", gap: "28px" }, { min: "170px" });
    colonnes.styles.desktop = { ...colonnes.styles.desktop, color: S.fg, fontFamily: S.head, fontWeight: "700", fontSize: "13px", ...GK.gaps("24px 32px") }; delete colonnes.styles.desktop.gap;
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [tete, trait(k, S.fg, "2px"), colonnes, trait(k, S.line), mentions], { colonne: true, gap: "32px", max: "1180px", padV: ["56px", "48px", "36px"], padB: ["28px", "28px", "24px"], padH: ["40px", "28px", "16px"], fond: S.bg, innerMobile: { rowGap: "24px" }, nom: "Statut nuage", filetHaut: { epaisseur: "6px", couleur: S.accent } });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── c-020 « Appli diptyque » ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : le pied d'une application mobile coupé en DEUX PANNEAUX très arrondis, de fonds différents. À gauche, un dégradé lavande, une phrase, deux boutons de téléchargement et un téléphone dessiné en SVG (bloc HTML sécurisé,
// aucune image) qui sort du bas du panneau, rogné par son bord. À droite, un panneau blanc : marque, liens en pilules, champ e-mail en pilule et réseaux en disques. Lavande #EAF1FF, indigo #4A59EE, encre #172036.
// Polices : Plus Jakarta Sans (titres) et Nunito Sans (texte). L'écran du téléphone ne porte aucun texte ni montant (rien d'inventé).
// À remplacer par le client : les deux boutons pointent vers l'accueil des magasins (App Store, Google Play) ; badges officiels = images du client.
const pocket = identite({
  key: "c020", label: "Lavande, indigo et blanc", humeur: "soft",
  fond: "#eaf1ff", texte: "#172036", discret: "#4a5876", accent: "#4a59ee", surface: "#ffffff",
  police: "font.nunito-sans", titres: "font.plus-jakarta-sans",
  rayon: "32px", rayonBouton: "999px", ombre: "none", poids: "800", bordure: "0px", ligne: "#d3ddf5",
});
const SVG_TELEPHONE = `<svg viewBox="0 0 320 350" width="100%" role="img" aria-label="Illustration d'un téléphone" focusable="false">`
  + `<polygon points="28,120 33,134 47,139 33,144 28,158 23,144 9,139 23,134" fill="#ffffff" opacity="0.9"/><polygon points="292,70 295,79 304,82 295,85 292,94 289,85 280,82 289,79" fill="#ffffff" opacity="0.8"/><polygon points="276,246 280,258 292,262 280,266 276,278 272,266 260,262 272,258" fill="#ffffff" opacity="0.7"/>`
  + `<g transform="translate(50 0)"><rect x="0" y="12" width="220" height="470" rx="38" fill="#172036"/><rect x="10" y="22" width="200" height="450" rx="30" fill="#f4f7ff"/><rect x="82" y="32" width="56" height="14" rx="7" fill="#172036"/>`
  + `<rect x="26" y="66" width="168" height="104" rx="20" fill="#4a59ee"/><rect x="42" y="84" width="54" height="8" rx="4" fill="#ffffff" opacity="0.6"/><rect x="42" y="102" width="96" height="18" rx="9" fill="#ffffff"/><rect x="42" y="136" width="36" height="14" rx="7" fill="#ffffff" opacity="0.35"/><rect x="84" y="136" width="36" height="14" rx="7" fill="#ffffff" opacity="0.35"/>`
  + `<rect x="30" y="196" width="22" height="42" rx="8" fill="#c9d3ff"/><rect x="62" y="176" width="22" height="62" rx="8" fill="#c9d3ff"/><rect x="94" y="206" width="22" height="32" rx="8" fill="#c9d3ff"/><rect x="126" y="184" width="22" height="54" rx="8" fill="#4a59ee"/><rect x="158" y="190" width="22" height="48" rx="8" fill="#c9d3ff"/>`
  + `<circle cx="44" cy="272" r="14" fill="#e3eaff"/><rect x="68" y="262" width="80" height="8" rx="4" fill="#172036" opacity="0.8"/><rect x="68" y="278" width="52" height="7" rx="3.5" fill="#172036" opacity="0.3"/><rect x="152" y="266" width="34" height="10" rx="5" fill="#4a59ee" opacity="0.8"/>`
  + `<circle cx="44" cy="322" r="14" fill="#e3eaff"/><rect x="68" y="312" width="70" height="8" rx="4" fill="#172036" opacity="0.8"/><rect x="68" y="328" width="44" height="7" rx="3.5" fill="#172036" opacity="0.3"/><rect x="152" y="316" width="34" height="10" rx="5" fill="#172036" opacity="0.25"/>`
  + `<circle cx="44" cy="372" r="14" fill="#e3eaff"/><rect x="68" y="362" width="88" height="8" rx="4" fill="#172036" opacity="0.8"/><rect x="68" y="378" width="58" height="7" rx="3.5" fill="#172036" opacity="0.3"/><rect x="152" y="366" width="34" height="10" rx="5" fill="#172036" opacity="0.25"/></g></svg>`;

const appliDiptyque = modeleV2({
  id: identifiantV2(20, "appli-diptyque"), concept: "c-020-appli-diptyque",
  name: "Appli diptyque", family: FAM,
  description: "Le pied d'une application mobile en deux panneaux très arrondis : à gauche un dégradé lavande avec un téléphone dessiné en SVG et les boutons de téléchargement, à droite un panneau blanc (liens en pilules, e-mail, réseaux).",
  tags: ["application mobile", "diptyque", "pastel", "lavande", "téléphone", "pilules", "arrondi"],
  identity: pocket,
  racine: { desktop: { backgroundColor: "#eaf1ff", gap: "0px" } },
  widgets: ["sitelogo", "text", "html", "button", "link", "emailsubscribe", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, encre = "#172036";
    // 1 · le téléphone : bloc HTML sécurisé (SVG), rogné par le bas d'une fenêtre à hauteur fixe
    const tel = { type: "html", props: { html: SVG_TELEPHONE }, ...sty({ width: "100%", maxWidth: "320px", marginTop: "10px", marginLeft: "auto", marginRight: "auto", lineHeight: 0.8 }, undefined, { maxWidth: "250px" }) };
    // 2 · boutons de téléchargement (adresses d'exemple : accueil des magasins)
    const magasin = (label, url) => { const n = k.B(label, url, "solid", { backgroundColor: encre, color: "#ffffff", borderRadius: "999px", fontFamily: S.font, fontSize: "14px", fontWeight: "700", minHeight: "48px", display: "inline-flex", alignItems: "center", paddingLeft: "22px", paddingRight: "22px", transitionDuration: GK.MOUVEMENT }); return GK.fini(k, n, { hover: { backgroundColor: S.accent, color: "#ffffff", transform: { y: -3 } }, focus: GK.focus(S.accent) }); };
    const boutons = k.row([magasin("App Store", "https://apps.apple.com/"), magasin("Google Play", "https://play.google.com/store")], { gap: "10px", alignItems: "center" });
    const gauche = k.col([
      G.texteFluide("<p>Votre application, au creux de la main.</p>", { taille: [28, 40], lh: 1.08, suivi: "-0.025em", poids: "800", police: S.head, couleur: encre, largeur: "420px" })(k, env),
      boutons, tel,
    ], { gap: "22px", flexBasis: "0px", flexGrow: 1, minWidth: "300px", paddingTop: "48px", paddingLeft: "44px", paddingRight: "44px", paddingBottom: "0px", borderRadius: "40px", alignItems: "flex-start", gradient: { from: "#d4ddff", to: "#b6c3ff", angle: 160 } }, { paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "32px", paddingLeft: "22px", paddingRight: "22px", borderRadius: "30px", gap: "18px", flexBasis: "100%", minWidth: "0px" });
    // 3 · le panneau blanc : marque, liens en pilules, e-mail en pilule, réseaux en disques
    const pilules = G.pilules([["Catalogue", "/catalogue"], ["Blog", "/blog"], ["FAQ", "/faq"], ["Contact", "/contact"], ["Connexion", "/connexion"]], { fond: "#eef2ff", contour: null, couleur: encre, survolFond: S.accent, survolCouleur: "#ffffff", gap: "10px" })(k, env);
    const abo = G.abonnement({ titre: "Newsletter", intro: "Astuces et nouveautés de l'application, sans bruit.", bouton: "S'abonner", largeur: "460px", soulignement: "0px", fondChamp: "#f3f6ff", rayonChamp: "999px", rembChamp: "22px", tailleChamp: "16px", styleTitre: { fontFamily: S.head, color: encre, fontSize: "15px", fontWeight: "800", marginBottom: "4px" } })(k, env);
    abo.parts.input.styles.desktop = { ...abo.parts.input.styles.desktop, borderWidth: "1.5px", borderBottomWidth: "1.5px", borderColor: "#c3cff0" };
    const ronds = reseauxIcones(k, env, ["instagram", "linkedin", "x", "youtube"], { taille: 44, forme: "circle", fond: "#eef2ff", couleur: encre });
    const droite = k.col([logo(k, env, 34), k.col([caps(k, "Explorer"), pilules], { gap: "14px" }), abo, ronds], {
      gap: "28px", flexBasis: "0px", flexGrow: 1, minWidth: "300px", backgroundColor: "#ffffff", borderRadius: "40px", paddingTop: "48px", paddingBottom: "48px", paddingLeft: "44px", paddingRight: "44px", alignItems: "flex-start", justifyContent: "space-between",
      shadow: { x: 0, y: 24, blur: 48, spread: -28, color: "#3a46d655" },
    }, { paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "32px", paddingBottom: "32px", paddingLeft: "22px", paddingRight: "22px", borderRadius: "30px", gap: "24px", flexBasis: "100%", minWidth: "0px" });
    const panneaux = G.ligne(k, [gauche, droite], { gap: "20px 20px", aligne: "stretch", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [panneaux, mentions], { colonne: true, gap: "28px", max: "1200px", padV: ["56px", "48px", "28px"], padB: ["28px", "28px", "24px"], padH: ["32px", "24px", "12px"], fond: S.bg, innerMobile: { rowGap: "24px" }, nom: "Appli diptyque" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── c-021 « Terminal Vigie » ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : un vieux terminal ambre sur noir brun. En tête, un RUBAN de messages qui défile lentement (widget Défilement continu : pause au survol, au focus et en mouvement réduit) ; dessous, une « session » : l'invite, puis TROIS liens
// numérotés en grand (Share Tech Mono), un bouton de contact à angles droits et les coordonnées de l'entreprise. Noir brun #0E0A04, ambre #FFB44A. Polices : Share Tech Mono (titres, liens) et IBM Plex Mono (texte).
// Écarts au concept : pas de lignes de balayage (un seul dégradé possible par fond : on garde une lueur ambre diffuse) ni de curseur clignotant ; sur mobile le ruban est remplacé par une ligne fixe (comme demandé).
const vigie = identite({
  key: "c021", label: "Noir brun et ambre", humeur: "dark",
  fond: "#0e0a04", texte: "#ffb44a", discret: "#d9a25e", accent: "#ffb44a", surface: "#1b1409",
  police: "font.ibm-plex-mono", titres: "font.share-tech-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#ffb44a47",
});

const terminalVigie = modeleV2({
  id: identifiantV2(21, "terminal-vigie"), concept: "c-021-terminal-vigie",
  name: "Terminal vigie", family: FAM,
  description: "Un vieux terminal ambre sur noir brun : un ruban de messages qui défile lentement (il s'arrête au survol et en mouvement réduit), une session avec trois liens numérotés en grand, un bouton de contact et les coordonnées.",
  tags: ["cybersécurité", "terminal", "mono", "ambre", "ruban défilant", "noir", "angles droits"],
  identity: vigie,
  racine: { desktop: { backgroundColor: "#0e0a04", gap: "0px" } },
  widgets: ["marquee", "sitelogo", "text", "link", "button", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, mono = S.head, MESSAGES = ["Journal des événements", "Liste des services", "Mentions légales", "Contact", "Questions fréquentes", "Connexion"];
    // 1 · le ruban : widget Défilement continu (lent), bordé de filets ; sur mobile : une ligne fixe
    const ruban = k.W("marquee", { items: MESSAGES.map((text) => ({ text })), speed: "slow", direction: "left", separator: "//", pauseHover: true, label: "Journal des événements" }, { color: S.fg, fontFamily: mono, fontSize: "15px", letterSpacing: "0.12em", textTransform: "uppercase", width: "100%" });
    ruban.hideOn = ["mobile"];
    const fixe = { ...k.T(`<p>${MESSAGES.join(" // ")}</p>`, { fontFamily: mono, fontSize: "13px", letterSpacing: "0.1em", textTransform: "uppercase", color: S.fg, lineHeight: 1.6, textAlign: "center", width: "100%" }), hideOn: ["desktop", "tablet"] };
    const bandeRuban = G.bande(k, [ruban, fixe], { colonne: true, gap: "0px", max: "100%", padV: ["14px", "14px", "12px"], padB: ["14px", "14px", "12px"], padH: ["0px", "0px", "16px"], fond: S.alt, nom: "Ruban" });
    Object.assign(bandeRuban.styles.desktop, { borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderBottomWidth: "1px", borderColor: S.line });
    // 2 · la session : invite puis trois liens numérotés
    const invite = (texte) => k.T(`<p>${texte}</p>`, { fontFamily: S.font, fontSize: "13px", color: S.mute, lineHeight: 1.5, letterSpacing: "0.04em" });
    const ligneLien = (n, label, url) => k.row([k.T(`<p>[${n}]</p>`, { fontFamily: mono, fontSize: "14px", color: S.mute, lineHeight: 1, letterSpacing: "0.08em", whiteSpace: "nowrap", flexShrink: 0 }),
      lien(k, label.toUpperCase(), url, { taille: 30, extra: { fontSize: "fluid:21-34" }, poids: "400", police: mono, suivi: "0.04em", h: "52px", survol: { color: S.bg, backgroundColor: S.fg, textDecoration: "none" }, padH: "10px", focus: S.fg })], { gap: "12px", alignItems: "center", flexWrap: "nowrap", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: S.line, paddingTop: "4px", paddingBottom: "4px" });
    const session = k.col([invite("visiteur@pied:~$ ls services/"), k.col([ligneLien("01", "Catalogue", "/catalogue"), ligneLien("02", "Questions fréquentes", "/faq"), ligneLien("03", "Contact", "/contact")], { gap: "0px", width: "100%" }), invite("visiteur@pied:~$ _")], { gap: "16px", flexBasis: "0px", flexGrow: 7, minWidth: "300px", alignItems: "flex-start" }, { flexBasis: "100%" }, { minWidth: "0px" });
    // 3 · colonne de droite : marque, bouton de contact, coordonnées (Données de l'entreprise), réseaux en texte
    const contact = GK.fini(k, k.B("Nous écrire", "/contact", "solid", { fontFamily: mono, fontSize: "16px", letterSpacing: "0.1em", textTransform: "uppercase", minHeight: "52px", display: "inline-flex", alignItems: "center", paddingLeft: "26px", paddingRight: "26px" }), { hover: { backgroundColor: "#0e0a04", color: S.fg, borderStyle: "solid", borderWidth: "1px", borderColor: S.fg }, focus: GK.focus(S.fg) });
    const coord = Moteur.item(k, "contact", env);
    const reseaux = G.reseauxTexte([["GitHub", "https://github.com/"], ["X", "https://x.com/"], ["LinkedIn", "https://www.linkedin.com/"]], { taille: 14, couleur: S.fg, police: S.font })(k, env);
    const droite = k.col([logo(k, env, 30), contact, coord, reseaux], { gap: "20px", flexBasis: "0px", flexGrow: 5, minWidth: "260px", alignItems: "flex-start", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: S.line, paddingLeft: "36px" }, { flexBasis: "100%", borderLeftWidth: "0px", paddingLeft: "0px", borderTopWidth: "1px", paddingTop: "28px" }, { minWidth: "0px" });
    const corps = G.ligne(k, [session, droite], { gap: "36px 56px", aligne: "flex-start", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [corps, mentions], { colonne: true, gap: "48px", max: "1180px", padV: ["72px", "56px", "44px"], padB: ["32px", "28px", "28px"], padH: ["40px", "28px", "16px"], fond: S.bg, innerMobile: { rowGap: "32px" }, degrade: { type: "radial", from: "#241a09", to: "#0e0a04", angle: 0, toAt: 80 }, nom: "Session" });
    return [G.racine(k, [bandeRuban, bande])];
  },
}, FAM);

// ── c-022 « Atelier Sticker » ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : un outil no-code ludique mais lisible. Sur un jaune franc, une grande phrase en Bagel Fat One (le dernier mot en violet) puis TROIS AUTOCOLLANTS : bordure noire de 3 px, ombre dure décalée de 6 px, légèrement inclinés
// (Produit, Aide, Rester informé avec le champ e-mail) ; au survol l'autocollant se redresse et se décale. Marque à droite, réseaux en carrés. Jaune #FFE14D, noir #14110B, violet #6C3BFF. Polices : Bagel Fat One (titres, testée propre à 120 px) et Rubik.
// Écarts au concept : pas de motif de fond (un seul fond possible par bloc) ; inclinaisons ±2° coupées sur mobile (empilé à plat) ; bande légale noire.
const brique = identite({
  key: "c022", label: "Jaune franc, noir et violet", humeur: "light",
  fond: "#ffe14d", texte: "#14110b", discret: "#3b3520", accent: "#6c3bff", surface: "#ffffff",
  police: "font.rubik", titres: "font.bagel-fat-one",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "3px", ligne: "#14110b",
});

const atelierSticker = modeleV2({
  id: identifiantV2(22, "atelier-sticker"), concept: "c-022-atelier-sticker",
  name: "Atelier sticker", family: FAM,
  description: "Un outil no-code ludique : jaune franc, noir et violet. Trois autocollants à bordure noire de 3 px et ombre dure, légèrement inclinés (Produit, Aide, e-mail) qui se redressent au survol, sous une grande phrase en lettres rondes.",
  tags: ["no-code", "autocollants", "ombre dure", "jaune", "brutaliste", "ludique", "contrasté"],
  identity: brique,
  racine: { desktop: { backgroundColor: "#14110b", gap: "0px" } },
  widgets: ["sitelogo", "text", "link", "emailsubscribe", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, noir = "#14110b", blanc = "#ffffff";
    const ombre = (d) => ({ x: d, y: d, blur: 0, spread: 0, color: noir });
    // 1 · l'autocollant : fond plein, bordure 3 px, ombre dure, inclinaison ; survol : il se redresse et se décale ; mobile : à plat
    const sticker = (enfants, o) => {
      const n = k.col(enfants, { backgroundColor: o.fond, color: o.couleur, borderStyle: "solid", borderWidth: "3px", borderColor: noir, paddingTop: "28px", paddingBottom: "30px", paddingLeft: "28px", paddingRight: "28px", gap: "10px", flexBasis: "0px", flexGrow: 1, minWidth: "230px", alignItems: "flex-start", shadow: ombre(6), transform: { rotate: o.rot }, transitionDuration: GK.MOUVEMENT },
        { paddingLeft: "22px", paddingRight: "22px" }, { transform: { x: "0px" }, flexBasis: "100%", minWidth: "0px", paddingLeft: "22px", paddingRight: "22px" });
      n.states = { hover: { transform: { x: "-4px", y: "-4px" }, shadow: ombre(10) } };
      return n;
    };
    const titreCarte = (t, c) => k.T(`<p>${t}</p>`, { fontFamily: S.head, fontSize: "30px", lineHeight: 1.05, color: c, fontWeight: "400", marginBottom: "6px" });
    const liensCarte = (liste, c, survol) => k.col(liste.map(([l, u]) => lien(k, l, u, { taille: 17, poids: "600", couleur: c, h: "40px", survol: { color: survol, textDecoration: "underline" }, focus: c })), { gap: "8px", alignItems: "flex-start" });
    const carteProduit = sticker([titreCarte("Produit", blanc), liensCarte([["Catalogue", "/catalogue"], ["Boutique", "/boutique"], ["Inscription", "/inscription"]], blanc, "#ffe14d")], { fond: S.accent, couleur: blanc, rot: -2 });
    const carteAide = sticker([titreCarte("Aide", noir), liensCarte([["FAQ", "/faq"], ["Blog", "/blog"], ["Contact", "/contact"]], noir, S.accent)], { fond: blanc, couleur: noir, rot: 1.5 });
    const abo = G.abonnement({ titre: "", intro: "Une lettre courte, quand il y a du nouveau.", bouton: "S'abonner", largeur: "100%", soulignement: "3px", accent: noir, rayonBouton: "0px", survolBouton: S.accent, survolTexte: blanc })(k, env);
    abo.parts.input.styles.desktop = { ...abo.parts.input.styles.desktop, borderWidth: "3px", borderColor: noir, borderBottomWidth: "3px", paddingLeft: "12px", height: "52px", fontSize: "16px" };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: blanc, backgroundColor: S.accent, borderRadius: "0px", borderWidth: "3px", borderStyle: "solid", borderColor: noir, minHeight: "52px" };
    abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, display: "none" };
    const carteMail = sticker([titreCarte("Rester informé", noir), abo], { fond: "#fff3a6", couleur: noir, rot: -1 });
    const reseaux = reseauxIcones(k, env, ["instagram", "linkedin", "x", "youtube"], { taille: 44, forme: "square", fond: blanc, couleur: noir, contour: noir, epaisseur: "3px", survolFond: S.accent, survolCouleur: blanc });
    // 2 · la grande phrase et la marque à droite
    const phrase = G.geant(`<p>Assemblez. Lancez.<br><span style="color:${S.accent}">Recommencez.</span></p>`, { taille: [38, 84], tablette: { taille: [48, 72] }, lh: 1.02, suivi: "-0.01em", poids: "400", police: S.head, couleur: noir })(k, env);
    const tete = G.ligne(k, [k.col([phrase], { flexBasis: "0px", flexGrow: 4, minWidth: "280px" }), k.col([logo(k, env, 44), reseaux], { alignItems: "flex-end", gap: "18px", flexShrink: 0 }, undefined, { alignItems: "flex-start" })], { justifie: "space-between", aligne: "flex-start", largeur: "100%", gap: "24px 40px" });
    const cartes = G.ligne(k, [carteProduit, carteAide, carteMail], { gap: "40px 32px", aligne: "stretch", largeur: "100%" });
    const haut = G.bande(k, [tete, cartes], { colonne: true, gap: "56px", max: "1180px", padV: ["88px", "64px", "44px"], padB: ["72px", "56px", "40px"], padH: ["40px", "28px", "16px"], fond: S.bg, innerMobile: { rowGap: "36px" }, nom: "Autocollants" });
    // 3 · bande légale noire
    const sombre = { fond: noir, fg: "#ffe14d", mute: "#f1dc7a" };
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true, couleur: sombre.mute, liens: sombre.fg })(k, env);
    const bas = G.bande(k, [mentions], { colonne: true, max: "1180px", padV: ["24px", "24px", "20px"], padB: ["24px", "24px", "20px"], padH: ["40px", "28px", "16px"], fond: noir, nom: "Mentions" });
    Object.assign(bas.styles.desktop, { color: sombre.fg });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ── c-023 « Laboratoire Données » ───────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : un seul orange brûlé en toutes nuances et un contraste d'échelle extrême. À gauche, un « 01 » ÉNORME (26 % de la largeur de l'écran), crème à 18 %, rogné par le bord ; à droite, une liste verticale de grandes lignes
// (une rubrique par ligne, filet fin entre elles) puis de minuscules coordonnées et réseaux de 13 px. Orange #9A3412, crème #FFF7ED. Polices : Familjen Grotesk (titres, chiffre ; testée propre à 120 px) et Inter.
// Écarts au concept : pas de quadrillage « papier millimétré » (un seul dégradé de fond possible) ; le chiffre est un décor (aria-hidden) dans un bloc HTML sécurisé ; liste de 5 rubriques réelles de la plateforme.
const trame = identite({
  key: "c023", label: "Orange brûlé et crème", humeur: "brand",
  fond: "#9a3412", texte: "#fff7ed", discret: "#fed7aa", accent: "#ffedd5", surface: "#b4440f",
  police: "font.inter", titres: "font.familjen-grotesk",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#fff7ed59",
});

const laboratoireDonnees = modeleV2({
  id: identifiantV2(23, "laboratoire-donnees"), concept: "c-023-laboratoire-donnees",
  name: "Laboratoire données", family: FAM,
  description: "Un seul orange brûlé et un contraste d'échelle extrême : un énorme « 01 » crème, rogné par le bord, face à une liste de grandes lignes et à de minuscules coordonnées de 13 px. Pour un outil d'analyse de données.",
  tags: ["analytique", "chiffre géant", "orange", "monochrome", "contraste d'échelle", "asymétrique", "liste géante"],
  identity: trame,
  racine: { desktop: { backgroundColor: "#872c0d", gap: "0px" } },
  widgets: ["html", "sitelogo", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · le chiffre géant : décor (aria-hidden), 26 vw, crème à 18 %, rogné par sa colonne
    const chiffre = { type: "html", props: { html: '<div aria-hidden="true">01</div>' }, ...sty({ fontFamily: S.head, fontWeight: "700", fontSize: "27vw", lineHeight: 0.8, letterSpacing: "-0.06em", color: S.accent, opacity: 0.18, marginLeft: "-2vw", marginTop: "2vw", whiteSpace: "nowrap" }, { fontSize: "30vw" }, { fontSize: "44vw", marginLeft: "-3vw" }) };
    const gauche = k.col([chiffre], { flexBasis: "36%", flexGrow: 0, flexShrink: 0, minWidth: "0px", overflow: "hidden", justifyContent: "flex-start", alignSelf: "stretch" }, { flexBasis: "100%", height: "30vw" }, { flexBasis: "100%", height: "40vw" });
    // 2 · la liste géante : numéro minuscule + rubrique en grand, un filet entre chaque ligne
    const ligneGrande = (n, label, url) => k.row([k.T(`<p>${n}</p>`, { fontFamily: S.font, fontSize: "13px", fontWeight: "600", letterSpacing: "0.1em", color: S.mute, lineHeight: 1, minWidth: "28px" }),
      lien(k, label, url, { taille: 56, poids: "600", police: S.head, suivi: "-0.02em", lh: 1.05, extra: { fontSize: "fluid:30-68" }, survol: { color: S.accent, transform: { x: 6 }, textDecoration: "none" }, focus: S.accent })],
      { gap: "16px", alignItems: "baseline", flexWrap: "nowrap", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: S.line, paddingTop: "10px", paddingBottom: "10px" });
    const liste = k.col([ligneGrande("01", "Catalogue", "/catalogue"), ligneGrande("02", "Blog", "/blog"), ligneGrande("03", "Questions fréquentes", "/faq"), ligneGrande("04", "Inscription", "/inscription"), ligneGrande("05", "Contact", "/contact")], { gap: "0px", width: "100%" });
    const coord = Moteur.item(k, "contact", env); coord.styles.desktop = { ...coord.styles.desktop, fontSize: "13px" };
    const reseaux = [["LinkedIn", "https://www.linkedin.com/"], ["X", "https://x.com/"], ["YouTube", "https://www.youtube.com/"]].map(([l, u]) => lien(k, `${l} ↗`, u, { taille: 13, poids: "500", h: "30px", survol: { color: S.accent, textDecoration: "underline" } }));
    const infos = G.ligne(k, [k.col([caps(k, "Coordonnées"), coord], { gap: "8px", flexBasis: "0px", flexGrow: 1, minWidth: "220px" }), k.col([caps(k, "Réseaux"), ...reseaux], { gap: "0px", flexBasis: "0px", flexGrow: 1, minWidth: "220px", alignItems: "flex-start" })], { gap: "20px 32px", aligne: "flex-start", largeur: "100%" });
    const droite = k.col([logo(k, env, 30), liste, infos], { gap: "36px", flexBasis: "0px", flexGrow: 1, minWidth: "300px", alignItems: "flex-start", paddingRight: "40px" }, { paddingLeft: "28px", paddingRight: "28px", minWidth: "0px" }, { paddingLeft: "16px", paddingRight: "16px" });
    const corps = k.row([gauche, droite], { alignItems: "flex-start", gap: "0px", flexWrap: "wrap", width: "100%" });
    const mentions = k.col([G.ligneLegale({ taille: 12, sansCookies: true })(k, env)], { width: "100%", paddingLeft: "40px", paddingRight: "40px" }, { paddingLeft: "28px", paddingRight: "28px" }, { paddingLeft: "16px", paddingRight: "16px" });
    const bande = G.bande(k, [corps, mentions], { colonne: true, gap: "40px", max: "100%", padV: ["80px", "56px", "32px"], padB: ["32px", "28px", "28px"], padH: ["0px", "0px", "0px"], fond: S.bg, innerMobile: { rowGap: "28px" }, degrade: { from: "#9a3412", to: "#872c0d", angle: 165 }, nom: "Laboratoire" });
    return [G.racine(k, [bande])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "SaaS, tech et startup", target: 9, built: true,
  description: "Logiciels, produits numériques et jeunes entreprises : gestes forts, grande typographie, appels à l'action nets.",
  models: [paletteCommandes, ongletsDoc, aurore, statutNuage, appliDiptyque, terminalVigie, atelierSticker, laboratoireDonnees, phraseLancement],
};
