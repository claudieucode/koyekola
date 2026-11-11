// Famille v2 « Associatif et ONG » — cible 6 modèles (concepts c-085 à c-090 de docs/footer-v2/CONCEPTS_100.md).
// Tant que `built` est false, la famille n'apporte rien à la bibliothèque PUBLIQUE (la liste actuelle reste intacte) ; passer à true UNIQUEMENT quand models.length === target.
// Les modèles s'écrivent avec ../kit-v2 (modeleV2, identite, gestes G.*) et s'insèrent en mode « solo » (indépendants du site).
// Honnêteté de la famille : aucun chiffre d'impact, aucun numéro d'association, aucun compte de dons, aucune photo de personne n'est inventé comme réel.
// Les montants de don, les chiffres du collectif et les initiales d'avatars sont des EXEMPLES, dits comme tels dans le modèle ou ici, et modifiables dans l'éditeur ;
// tous les liens vont vers les pages de la plateforme (ou des adresses d'exemple https:// à remplacer) : jamais de faux paiement, jamais d'urgence ni de rareté.
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { sty, compact } = require("../../../kit");

const FAM = "associatif-ong";

// ── Aides LOCALES à la famille ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Petit libellé en capitales espacées
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
// Texte courant
const texte = (k, html, o = {}) => k.T(html.startsWith("<") ? html : `<p>${html}</p>`, compact({ fontSize: `${o.taille || 15}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, maxWidth: o.largeur, fontWeight: o.poids, textAlign: o.align, ...(o.extra || {}) }), o.tablette, o.mobile);
// Lien de texte fini par le moteur (états, 44 px sur mobile) puis états propres : survol { …styles }, focus (contour 2 px)
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: o.h, paddingLeft: o.padH, paddingRight: o.padH, borderRadius: o.rayon, lineHeight: o.lh, letterSpacing: o.suivi, transitionDuration: GK.MOUVEMENT, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
// Réseaux en icônes (disques de 44 px) aux couleurs du modèle : parties du widget « Réseaux sociaux »
function reseauxIcones(k, env, liste, o = {}) {
  const S = k.S, n = Moteur.item(k, `socials:${liste.join("+")}`, env);
  n.props.size = String(o.taille || 44); n.props.shape = o.forme || "circle";
  Moteur.mergePart(n, "link", { styles: { desktop: compact({ color: o.couleur || S.fg, backgroundColor: o.fond, borderStyle: o.contour ? "solid" : undefined, borderWidth: o.contour ? (o.epaisseur || "1.5px") : undefined, borderColor: o.contour, transitionDuration: GK.MOUVEMENT }) },
    states: { hover: { backgroundColor: o.survolFond || S.accent, color: o.survolCouleur || S.onAccent, borderColor: o.survolFond || S.accent }, focus: GK.focus(o.focus || S.accent) } });
  return n;
}
// Logo du site (widget Logo) avec un état de survol discret
const logo = (k, env, taille, couleur) => { const n = Moteur.item(k, `logo:${taille}`, env); n.states = { hover: { color: couleur || k.S.accent, textDecoration: "underline" } }; Moteur.mergePart(n, "text", { styles: { desktop: { transitionDuration: GK.MOUVEMENT } } }); return n; };
// Coordonnées des Données de l'entreprise AVEC leur titre de colonne (le titre fait partie du widget : sans données, ni titre orphelin ni colonne vide)
const contactTitre = (k, env, titre, o = {}) => {
  const S = k.S, n = Moteur.item(k, `contact|${titre}`, env);
  n.styles.desktop = { ...n.styles.desktop, fontFamily: S.font, fontSize: "15px", color: S.fg };
  Moteur.mergePart(n, "title", { styles: { desktop: { fontFamily: o.police || S.font, fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.16em", color: S.mute, marginBottom: "6px" } } });
  return n;
};
// Trait fin pleine largeur
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
// Décor : conteneur vide posé en absolu, sous le contenu (rien d'interactif, rien d'écrit)
const decor = (st, mob, tab) => ({ type: "container", children: [], ...sty({ position: "absolute", pointerEvents: "none", zIndex: 0, ...st }, tab, mob) });
// surDecors(bande, [décors]) : la bande devient le repère des décors (relative, rogne ce qui dépasse) ; son contenu passe au-dessus ; les décors viennent APRÈS le contenu (la bande garde le même premier enfant)
function surDecors(b, decors) {
  b.styles.desktop = { ...b.styles.desktop, position: "relative" };
  const inner = b.children[0];
  inner.styles.desktop = { ...inner.styles.desktop, position: "relative", zIndex: 1 };
  // les décors vivent dans un calque qui porte seul le « overflow: hidden » (il ne contient aucun texte : la bande, elle, ne rogne rien)
  b.children.push({ type: "container", children: decors, ...sty({ position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%", overflow: "hidden", pointerEvents: "none", zIndex: 0 }) });
  return b;
}
// Widget HTML (dessin SVG décoratif) : le widget impose `height: auto` aux SVG, la hauteur vient donc du rapport de la viewBox
const dessin = (svg, st = {}) => ({ type: "html", props: { html: svg }, ...sty({ width: "100%", display: "block", lineHeight: 0.8, fontSize: "0px", ...st }) });
const svgDe = (w, h, corps) => {
  const s = `<span aria-hidden="true"><svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${corps}</svg></span>`;
  if (s.length > 19000) throw new Error(`SVG trop long (${s.length}) pour le widget HTML (20 000 caractères).`);
  return s;
};

// ── c-085 « Don en un Geste » ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : « Aide Horizon » (ONG fictive). Un grand appel au don occupe la moitié haute du pied : une phrase monumentale « Un don, un geste. », et une carte blanche « Je donne » avec trois montants
// (10 €, 25 €, 50 €, des EXEMPLES à modifier) puis un gros bouton jaune. Un soleil jaune à demi caché derrière la carte et deux anneaux dessinent « l'horizon » du nom. Dessous : trois colonnes, la transparence, le légal.
// Honnêteté : le bouton et les montants sont de simples LIENS (vers la page Contact tant que la vraie page de don n'existe pas : à remplacer dans l'éditeur) ; aucun paiement n'est simulé ; aucun chiffre d'impact.
// Polices : Noto Sans 800 (titres, testée à 150 px, propre) et Noto Serif (texte), auto-hébergées. Bleu franc #0A66C2, jaune #FFD23F.
// Écarts au concept : pas de motif répété (le moteur n'a pas de fond répété) : soleil et anneaux en dessins ; les montants ne portent pas de valeur dans l'adresse (pas de page de don à ce jour).
const horizon = identite({
  key: "c085", label: "Bleu franc et jaune soleil", humeur: "dark",
  fond: "#0a66c2", texte: "#ffffff", discret: "#dcebfa", accent: "#ffd23f", surface: "#0b4f96",
  police: "font.noto-serif", titres: "font.noto-sans",
  rayon: "28px", rayonBouton: "999px", ombre: "none", poids: "800", bordure: "0px", ligne: "#ffffff38",
});

const donEnUnGeste = modeleV2({
  id: identifiantV2(85, "don-en-un-geste"), concept: "c-085-don-en-un-geste",
  name: "Don en un geste", family: FAM,
  description: "Une grande zone d'appel au don : phrase monumentale, carte blanche avec trois montants d'exemple et gros bouton jaune, un soleil à demi caché pour l'horizon. Dessous : colonnes, contact, réseaux et transparence.",
  tags: ["ong", "don", "humanitaire", "bleu", "jaune", "appel à l'action", "montants"],
  identity: horizon,
  racine: { desktop: { backgroundColor: "#0b4f96", gap: "0px" } },
  widgets: ["sitelogo", "text", "link", "button", "bizcontact", "social", "bizlegal", "copyright", "divider", "container"],
  compose(k, env, G) {
    const S = k.S, MARINE = "#0b2f57", DOUX = "#3f5a7a";
    // 1 · la zone d'appel : logo, phrase monumentale, introduction
    const marque = logo(k, env, 34, S.accent);
    const filetJaune = G.filet({ largeur: "56px", epaisseur: "4px" })(k, env);
    const phrase = G.geant(`<p>Un don,<br><span style="color:${S.accent}">un&nbsp;geste.</span></p>`, { taille: [60, 128], tablette: { taille: [96, 120] }, mobile: { taille: [46, 128] }, lh: 0.98, suivi: "-0.03em", poids: "800", police: S.head, couleur: S.fg })(k, env);
    const intro = G.phrase("Choisissez un montant. Chaque geste compte, petit ou grand.", { taille: 19, largeur: "440px", couleur: "#dcebfa" })(k, env);
    const gauche = G.colonne(k, [marque, filetJaune, phrase, intro], { poids: 7, min: "300px", gap: "26px", tablette: { flexBasis: "100%" } });
    // 2 · la carte du don : libellé, trois montants (liens), bouton jaune, une ligne sur la déduction fiscale
    const montant = (m) => lien(k, `${m} €`, "/contact", { taille: 24, poids: "800", police: S.head, couleur: MARINE, h: "64px", survol: { backgroundColor: S.bg, color: "#ffffff", borderColor: S.bg, textDecoration: "none", transform: { y: -2 } }, focus: S.bg,
      extra: { flexGrow: 1, flexBasis: "0px", justifyContent: "center", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "2px", borderColor: "#b9d3ee", borderRadius: "20px" } });
    const montants = k.row(["10", "25", "50"].map(montant), { gap: "12px", flexWrap: "nowrap", width: "100%", alignItems: "stretch" });
    const bouton = GK.fini(k, k.B("Faire un don", "/contact", "solid", { backgroundColor: S.accent, color: MARINE, fontFamily: S.head, fontSize: "19px", fontWeight: "800", borderRadius: "999px", minHeight: "62px", width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transitionDuration: GK.MOUVEMENT }),
      { hover: { backgroundColor: MARINE, color: "#ffffff" }, focus: GK.focus(MARINE) });
    const carte = k.col([caps(k, "Je donne", { couleur: DOUX, police: S.head, suivi: "0.16em" }), montants, bouton, texte(k, "Les conditions de déduction fiscale sont précisées sur la page de don.", { taille: 13, couleur: DOUX, lh: 1.5 })],
      { backgroundColor: "#ffffff", color: MARINE, borderRadius: "32px", paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px", gap: "18px", width: "100%", maxWidth: "460px", alignItems: "stretch", shadow: { x: 0, y: 34, blur: 70, spread: -24, color: "#00000080" } }, { maxWidth: "100%" }, { paddingTop: "24px", paddingBottom: "24px", paddingLeft: "20px", paddingRight: "20px", borderRadius: "28px" });
    const droite = G.colonne(k, [carte], { poids: 5, min: "300px", soi: "center", aligne: "flex-end", tablette: { flexBasis: "100%", alignItems: "stretch" }, mobile: { alignItems: "stretch" } });
    const haut = G.ligne(k, [gauche, droite], { gap: "48px 64px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const bandeAppel = surDecors(G.bande(k, [haut], { colonne: true, gap: "0px", padV: ["96px", "72px", "56px"], padB: ["112px", "88px", "64px"], padH: ["48px", "32px", "20px"], fond: S.bg, nom: "Appel au don" }), [
      decor({ width: "300px", height: "300px", borderRadius: "50%", backgroundColor: S.accent, top: "-110px", right: "4%" }, { display: "none" }),
      decor({ width: "620px", height: "620px", borderRadius: "50%", borderStyle: "solid", borderWidth: "2px", borderColor: "#ffffff30", top: "-250px", right: "-170px" }, { width: "360px", height: "360px", top: "-120px", right: "-150px" }),
      decor({ width: "900px", height: "900px", borderRadius: "50%", borderStyle: "solid", borderWidth: "2px", borderColor: "#ffffff1c", bottom: "-640px", left: "-200px" }, { width: "520px", height: "520px", bottom: "-380px", left: "-160px" }),
    ]);
    // 3 · trois colonnes : agir, s'informer, nous trouver (coordonnées du site + réseaux en disques de 44 px)
    const titreCol = (t) => caps(k, t, { couleur: S.mute, suivi: "0.16em", extra: { marginBottom: "6px" } });
    const liste = (liens) => k.col(liens.map(([l, u]) => lien(k, l, u, { taille: 16, h: "40px" })), { gap: "0px", alignItems: "flex-start" });
    const colAgir = G.colonne(k, [titreCol("Agir"), liste([["Faire un don", "/contact"], ["Devenir bénévole", "/inscription"], ["Soutenir en entreprise", "/contact"]])], { poids: 1, min: "200px", gap: "8px" });
    const colInfo = G.colonne(k, [titreCol("S'informer"), liste([["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Nous écrire", "/contact"]])], { poids: 1, min: "200px", gap: "8px" });
    const contact = contactTitre(k, env, "Nous trouver");
    const reseaux = reseauxIcones(k, env, ["facebook", "instagram", "youtube"], { contour: "#ffffff66", fond: "transparent", couleur: S.fg });
    const colTrouver = G.colonne(k, [contact, titreCol("Nous suivre"), reseaux], { poids: 1, min: "240px", gap: "14px" });
    const colonnes = G.ligne(k, [colAgir, colInfo, colTrouver], { gap: "40px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    // 4 · transparence puis mentions légales
    const transparence = G.ligne(k, [texte(k, "<p><strong>Transparence.</strong> Demandez-nous nos rapports d'activité et nos comptes : nous vous les envoyons.</p>", { taille: 15, couleur: S.fg, largeur: "620px" }), lien(k, "Nous écrire →", "/contact", { taille: 15, poids: "700", couleur: S.accent, h: "44px", survol: { color: S.fg, textDecoration: "underline" }, focus: S.fg })],
      { gap: "8px 32px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bandeBas = G.bande(k, [colonnes, trait(k, S.line), transparence, mentions], { colonne: true, gap: "36px", padV: ["72px", "56px", "48px"], padB: ["40px", "36px", "32px"], padH: ["48px", "32px", "20px"], fond: S.alt, innerMobile: { rowGap: "28px" }, nom: "Colonnes et transparence" });
    return [G.racine(k, [bandeAppel, bandeBas])];
  },
}, FAM);

// ── c-086 « Carte du Quartier » ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : « Rue des Possibles » (association de quartier fictive). Le PLAN du quartier est l'élément principal : un plan dessiné (rues, îlots, parc, rond-point, parcours en pointillés) dans une carte à coins asymétriques,
// avec trois points numérotés CLIQUABLES (cercles de 44 px) ; à droite, la légende des trois lieux (liens), la vraie adresse en texte (widget Contact des Données de l'entreprise). Dessous : tuiles-liens entières et réseaux en pastilles.
// Jaune pâle #FFF0C2, rose brique, blanc. Polices : Fira Sans (titres, 800) et Fira Sans Condensed (texte). Les trois lieux sont des EXEMPLES (noms d'usage courant, sans adresse) renvoyant vers Contact : à remplacer.
// Le plan est un décor dessiné (SVG, couleurs pleines) : il ne prétend pas représenter une vraie ville ; l'adresse réelle reste en texte.
const rue = identite({
  key: "c086", label: "Jaune pâle et rose brique", humeur: "light",
  fond: "#fff0c2", texte: "#2e2a1a", discret: "#5e5638", accent: "#b8374b", surface: "#ffffff",
  police: "font.fira-sans-condensed", titres: "font.fira-sans",
  rayon: "40px", rayonBouton: "999px", ombre: "none", poids: "400", bordure: "2px", ligne: "#2e2a1a33", // police statique : poids 400 pour le logo (la graisse 400 est chargée avec la 800 des titres)
});

// Le plan : viewBox 640 × 420 ; rues dessinées deux fois (liseré puis chaussée), îlots, parc avec mare, rond-point, parcours en pointillés
const planDuQuartier = () => {
  const ilot = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${c}"/>`;
  const rues = ["M-10 150 C 120 138 300 172 650 150", "M-10 312 C 150 290 400 322 650 296", "M200 -10 C 212 120 190 250 205 430", "M432 -10 C 442 110 420 262 436 430"];
  const chaussee = (c, w) => rues.map((d) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`).join("");
  const arbres = [[480, 52], [520, 40], [566, 58], [600, 44], [498, 100], [548, 108], [596, 96]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="#8fc078"/>`).join("");
  return svgDe(640, 420, [
    `<rect width="640" height="420" fill="#fff8de"/>`,
    ilot(18, 18, 160, 112, "#ffe08a"), ilot(226, 18, 180, 112, "#f6c8bf"),
    ilot(18, 172, 160, 118, "#f8d27d"), ilot(226, 176, 180, 100, "#ffe08a"), ilot(462, 176, 160, 100, "#f6c8bf"),
    ilot(18, 336, 160, 70, "#ffe08a"), ilot(226, 338, 180, 68, "#f8d27d"), ilot(462, 334, 160, 72, "#ffe08a"),
    `<path d="M458 40 C 500 14 590 12 626 36 C 640 70 634 118 600 128 C 540 140 488 132 462 118 C 446 90 446 62 458 40 Z" fill="#bfe0a8"/>`, arbres,
    `<ellipse cx="545" cy="78" rx="28" ry="14" fill="#a9d6e8"/>`,
    chaussee("#e6c76f", 30), chaussee("#ffffff", 22),
    `<circle cx="433" cy="302" r="34" fill="#e6c76f"/><circle cx="433" cy="302" r="28" fill="#ffffff"/><circle cx="433" cy="302" r="14" fill="#bfe0a8"/>`,
    `<path d="M112 150 C 170 224 250 262 322 298 S 480 160 540 88" fill="none" stroke="#b8374b" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 11"/>`,
  ].join(""));
};

const carteQuartier = modeleV2({
  id: identifiantV2(86, "carte-du-quartier"), concept: "c-086-carte-du-quartier",
  name: "Carte du quartier", family: FAM,
  description: "Un plan de quartier dessiné (rues, parc, parcours en pointillés) dans une carte à coins asymétriques, avec trois points cliquables et leur légende ; l'adresse reste en texte. Jaune pâle, rose brique, ton convivial.",
  tags: ["association de quartier", "plan", "carte", "jaune pâle", "rose brique", "convivial", "adresse"],
  identity: rue,
  racine: { desktop: { backgroundColor: "#fff0c2", gap: "0px" } },
  widgets: ["sitelogo", "text", "html", "link", "bizcontact", "copyright", "bizlegal", "divider", "container"],
  compose(k, env, G) {
    const S = k.S, FONCE = S.fg;
    // 1 · le plan : carte à coins asymétriques, liseré franc et ombre dure ; trois points numérotés (liens) posés dessus en pourcentages du plan
    const pin = (n, x, y) => {
      const l = k.LINK(String(n), "/contact", { fontSize: "20px", fontWeight: "800", fontFamily: S.head, color: "#ffffff", backgroundColor: S.accent, borderStyle: "solid", borderWidth: "3px", borderColor: "#ffffff", borderRadius: "50%", width: "44px", height: "44px", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", position: "absolute", left: `${(x / 640 * 100).toFixed(2)}%`, top: `${(y / 420 * 100).toFixed(2)}%`, marginLeft: "-22px", marginTop: "-22px", zIndex: 2, transitionDuration: GK.MOUVEMENT, shadow: { x: 0, y: 4, blur: 0, spread: 0, color: "#2e2a1a" } });
      return GK.fini(k, l, { hover: { backgroundColor: FONCE, color: "#ffffff", transform: { y: -4 } }, focus: GK.focus(FONCE) });
    };
    const plan = { type: "container", children: [dessin(planDuQuartier()), pin(1, 112, 150), pin(2, 322, 298), pin(3, 540, 88)],
      ...sty({ position: "relative", width: "100%", overflow: "hidden", display: "block", backgroundColor: "#fff8de", borderStyle: "solid", borderWidth: "2px", borderColor: FONCE, borderTopLeftRadius: "56px", borderBottomRightRadius: "56px", borderTopRightRadius: "14px", borderBottomLeftRadius: "14px", shadow: { x: 8, y: 8, blur: 0, spread: 0, color: S.accent } }, undefined, { borderTopLeftRadius: "36px", borderBottomRightRadius: "36px" }) };
    const gauche = G.colonne(k, [plan], { poids: 7, min: "300px", aligne: "stretch", extra: { paddingRight: "8px", paddingBottom: "8px" }, tablette: { flexBasis: "100%" } });
    // 2 · à droite : logo, phrase d'accueil, légende des trois lieux (liens), adresse en texte
    const marque = logo(k, env, 34);
    const phrase = G.geant("<p>On se retrouve au coin de la rue.</p>", { taille: [34, 54], tablette: { taille: [38, 48] }, lh: 1.04, suivi: "-0.02em", poids: "800", police: S.head, couleur: S.fg })(k, env);
    const lieu = (n, nom) => lien(k, `${n}   ${nom}  →`, "/contact", { taille: 18, poids: "700", police: S.head, h: "56px", padH: "20px", survol: { color: S.accent, transform: { x: 4 }, textDecoration: "none" },
      extra: { width: "100%", justifyContent: "space-between", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "2px", borderColor: FONCE, borderTopLeftRadius: "28px", borderBottomRightRadius: "28px", borderTopRightRadius: "8px", borderBottomLeftRadius: "8px" } });
    const lieux = k.col([lieu(1, "La maison de quartier"), lieu(2, "Le café des voisins"), lieu(3, "Le jardin partagé")], { gap: "10px", width: "100%", alignItems: "stretch" });
    const adresse = G.code("contact")(k, env); adresse.styles.desktop = { ...adresse.styles.desktop, fontFamily: S.font, fontSize: "16px", color: S.fg };
    const droite = G.colonne(k, [marque, phrase, lieux, adresse], { poids: 5, min: "300px", gap: "22px", tablette: { flexBasis: "100%" } });
    const haut = G.ligne(k, [gauche, droite], { gap: "40px 56px", aligne: "center", justifie: "space-between", largeur: "100%" });
    // 3 · tuiles-liens entières (toute la tuile est cliquable) ; au survol et au focus : elle se décale de 4 px
    const tuile = (titre, url) => lien(k, `${titre}  →`, url, { taille: 19, poids: "800", police: S.head, h: "88px", padH: "24px", survol: { backgroundColor: S.accent, color: "#ffffff", borderColor: S.accent, transform: { x: 4 }, textDecoration: "none" },
      extra: { flexGrow: 1, flexBasis: "170px", justifyContent: "space-between", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "2px", borderColor: FONCE, borderTopLeftRadius: "36px", borderBottomRightRadius: "36px", borderTopRightRadius: "10px", borderBottomLeftRadius: "10px" } });
    const tuilesLiens = [tuile("Nous contacter", "/contact"), tuile("Les nouvelles", "/blog"), tuile("Questions", "/faq"), tuile("Nous rejoindre", "/inscription")];
    for (const t of tuilesLiens) t.styles.tablet = { flexBasis: "44%" };
    const tuiles = k.row(tuilesLiens, { gap: "14px", alignItems: "stretch", width: "100%" });
    // 4 · réseaux en pastilles (noms) puis mentions
    const pastilles = G.pilules([["Facebook", "https://www.facebook.com/"], ["Instagram", "https://www.instagram.com/"], ["WhatsApp", "https://www.whatsapp.com/"]], { contour: FONCE, couleur: FONCE, taille: 15, poids: "700", gap: "10px", survolFond: FONCE, survolCouleur: "#ffffff", focus: S.accent })(k, env);
    const suivre = G.ligne(k, [caps(k, "Suivre le quartier", { couleur: S.mute }), pastilles], { gap: "10px 20px", aligne: "center", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [haut, tuiles, trait(k, S.line, "2px"), suivre, mentions], { colonne: true, gap: "40px", padV: ["104px", "80px", "64px"], padB: ["48px", "44px", "36px"], padH: ["48px", "32px", "16px"], fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Plan du quartier" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── c-087 « Contributeurs » ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : « Fabrique » (projet libre fictif). Un méga-pied dense façon papier millimétré : pas de boîtes, des FILETS de 1 px qui découpent cinq colonnes, un trait vert de 6 px au bord haut. En tête, une rangée d'avatars
// ronds qui se chevauchent (initiales EXEMPLE, aucune photo, aucun nombre de contributeurs inventé) et « Merci à celles et ceux qui contribuent ». Colonnes : projet, documentation, communauté, cadre légal, lettre.
// Gris charbon #17191C, vert #3FB950. Polices : Source Code Pro 700 (titres ; testée à 150 px, propre) et Source Sans 3 (texte). Les liens « ↗ » sont des adresses d'EXEMPLE (https://github.com/…) à remplacer.
// Écart au concept : le quadrillage de fond (dégradés répétés) n'existe pas dans le moteur : le papier millimétré est rendu par les filets des colonnes et des lignes.
const fabrique = identite({
  key: "c087", label: "Charbon et vert terminal", humeur: "dark",
  fond: "#17191c", texte: "#e6e8eb", discret: "#a3a9b1", accent: "#3fb950", surface: "#22262b",
  police: "font.source-sans-3", titres: "font.source-code-pro",
  rayon: "0px", rayonBouton: "2px", ombre: "none", poids: "700", bordure: "1px", ligne: "#ffffff24",
});

const contributeurs = modeleV2({
  id: identifiantV2(87, "contributeurs"), concept: "c-087-contributeurs",
  name: "Contributeurs", family: FAM,
  description: "Un méga-pied dense pour un projet libre : rangée d'avatars qui se chevauchent et un merci, cinq colonnes séparées par de simples filets de 1 px, lettre d'information, logo en signature. Charbon, vert, titres en mono.",
  tags: ["open source", "communauté", "méga-pied", "mono", "charbon", "vert", "filets", "dense"],
  identity: fabrique,
  racine: { desktop: { backgroundColor: "#17191c", gap: "0px" } },
  widgets: ["text", "button", "link", "emailsubscribe", "bizlegal", "copyright", "sitelogo", "divider", "container"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · le trait vert de 6 px au bord haut du pied
    const barre = k.col([], { width: "100%", height: "6px", backgroundColor: S.accent });
    // 2 · avatars ronds de 44 px, chevauchés de 8 px : initiales d'EXEMPLE (personnes fictives), couleurs sourdes à texte blanc ≥ 4,5:1
    const avatar = (ini, fond, i) => ({ type: "container", children: [k.T(`<p>${ini}</p>`, { fontFamily: S.head, fontSize: "13px", fontWeight: "700", color: "#ffffff", lineHeight: 1, textAlign: "center" })],
      ...sty({ display: "flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", minWidth: "44px", borderRadius: "50%", backgroundColor: fond, borderStyle: "solid", borderWidth: "2px", borderColor: S.bg, marginLeft: i ? "-8px" : "0px", flexShrink: 0 }) });
    const personnes = [["AL", "#2d6a3a"], ["MB", "#3a4a5a"], ["JP", "#5a3f7a"], ["SK", "#7a5a2d"], ["NR", "#2a5f6b"], ["CD", "#6b2d3f"], ["TV", "#3d3f45"], ["EM", "#2f7a4f"]];
    const avatars = k.row(personnes.map(([i, c], n) => avatar(i, c, n)), { gap: "0px", flexWrap: "nowrap", alignItems: "center" });
    const merci = G.texteFluide("<p>Merci à celles et ceux qui contribuent.</p>", { taille: [22, 32], lh: 1.2, suivi: "-0.01em", poids: "700", police: S.head, couleur: S.fg, largeur: "520px" })(k, env);
    const sous = texte(k, "Code, documentation, traductions, idées : tout compte.", { taille: 15, largeur: "420px" });
    const gauche = G.colonne(k, [avatars, merci, sous], { poids: 7, min: "300px", gap: "18px" });
    const contribuer = GK.fini(k, k.B("Contribuer au projet", "https://github.com/", "solid", { backgroundColor: S.accent, color: S.onAccent, fontFamily: S.head, fontSize: "15px", fontWeight: "700", borderRadius: "2px", minHeight: "48px", paddingLeft: "24px", paddingRight: "24px", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transitionDuration: GK.MOUVEMENT }), { hover: { backgroundColor: S.fg, color: S.bg }, focus: GK.focus(S.fg) });
    const voir = lien(k, "Lire la documentation →", "/faq", { taille: 15, poids: "600", h: "44px", survol: { color: S.accent, textDecoration: "underline" } });
    const droite = G.colonne(k, [contribuer, voir], { poids: 4, min: "260px", gap: "6px", soi: "flex-end", aligne: "flex-start" });
    const haut = G.ligne(k, [gauche, droite], { gap: "28px 56px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    // 3 · cinq colonnes séparées par des filets verticaux (bureau) ; en tablette et mobile, des filets horizontaux (chaque cellule garde son trait haut)
    const titre = (t) => caps(k, t, { couleur: S.mute, police: S.head, suivi: "0.14em", extra: { marginBottom: "4px" } });
    const liste = (liens) => k.col(liens.map(([l, u]) => lien(k, l, u, { taille: 14, h: "36px", poids: "500" })), { gap: "0px", alignItems: "flex-start" });
    const cellule = (i, enfants, o = {}) => G.colonne(k, enfants, { poids: 1, min: "200px", gap: "10px", extra: { borderStyle: "solid", borderWidth: "0px", borderLeftWidth: i ? "1px" : "0px", borderColor: S.line, paddingLeft: i ? "24px" : "0px", ...(o.extra || {}) },
      tablette: { borderLeftWidth: "0px", borderTopWidth: "1px", paddingLeft: "0px", paddingTop: "16px", paddingBottom: "20px", minWidth: "200px" }, mobile: { borderLeftWidth: "0px", borderTopWidth: "1px", paddingLeft: "0px", paddingTop: "16px", paddingBottom: "20px", minWidth: "140px", ...(o.mobile || {}) } });
    const abo = G.abonnement({ titre: "", intro: "Les nouvelles du projet, sans bruit.", bouton: "S'abonner", largeur: "100%", soulignement: "2px", rayonBouton: "2px" })(k, env);
    abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, fontSize: "14px", lineHeight: 1.5 };
    const cadre = Moteur.finishNode(S, k.W("bizlegal", { title: "", showName: false, showForm: false, showRegistrations: false, showPublisher: false, showHost: false, showPages: true, layout: "stack", hintMissing: true }, { color: S.fg, fontSize: "14px", fontFamily: S.font }));
    const colonnes = G.ligne(k, [
      cellule(0, [titre("Projet"), liste([["Accueil", "/"], ["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Contact", "/contact"]])]),
      cellule(1, [titre("Documentation"), liste([["Démarrer", "/faq"], ["Guides et billets", "/blog"], ["Dépôt du code ↗", "https://github.com/"], ["Versions ↗", "https://github.com/"]])]),
      cellule(2, [titre("Communauté"), liste([["Discussions ↗", "https://github.com/"], ["Signaler un problème ↗", "https://github.com/"], ["Mastodon ↗", "https://mastodon.social/"], ["YouTube ↗", "https://www.youtube.com/"]])]),
      cellule(3, [titre("Cadre"), cadre]),
      cellule(4, [titre("Lettre d'information"), abo], { mobile: { flexBasis: "100%" } }),
    ], { gap: "0px 0px", aligne: "stretch", justifie: "space-between", largeur: "100%" });
    // 4 · signature : petit logo, puis les mentions
    const signature = G.ligne(k, [logo(k, env, 26)], { largeur: "100%", justifie: "flex-start" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [haut, { ...trait(k, S.line), hideOn: ["tablet", "mobile"] }, colonnes, trait(k, S.line), signature, mentions], { colonne: true, gap: "28px", padV: ["56px", "48px", "40px"], padB: ["32px", "28px", "28px"], padH: ["40px", "28px", "16px"], fond: S.bg, innerMobile: { rowGap: "20px" }, nom: "Contributeurs" });
    return [G.racine(k, [barre, bande])];
  },
}, FAM);

// ── c-088 « Rapports Ouverts » ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : « Fondation Alma » (fondation fictive). Le pied est un TABLEAU DE DOCUMENTS publics : une carte blanche aux filets fins, des lignes « document · ce qu'on y trouve · consulter », un petit pictogramme de page, et des en-têtes de colonne.
// Aucun document, année ou poids de fichier n'est inventé : chaque ligne est une rubrique qui mène à une vraie page de la plateforme ; la liste « Derniers documents publiés » est un widget (articles réels, message honnête s'il n'y en a pas).
// En tête : une grande phrase en Cardo et le champ e-mail souligné (l'appel). Dessous : fondation, coordonnées, réseaux en noms ↗, derniers documents. Gris-lilas #EFEAF7, violet #5B3A8C. Polices : Cardo (titres) et Lato (texte).
// Mobile : le tableau devient une pile de cartes d'une colonne (en-têtes masqués).
const alma = identite({
  key: "c088", label: "Lilas pâle et violet", humeur: "light",
  fond: "#efeaf7", texte: "#241b3a", discret: "#52476e", accent: "#5b3a8c", surface: "#ffffff",
  police: "font.lato", titres: "font.cardo",
  rayon: "28px", rayonBouton: "999px", ombre: "none", poids: "400", bordure: "1px", ligne: "#241b3a26", // poids 400 : le logo est en Cardo 400, les titres en Cardo 700 (police statique : les deux graisses sont chargées)
});

const rapportsOuverts = modeleV2({
  id: identifiantV2(88, "rapports-ouverts"), concept: "c-088-rapports-ouverts",
  name: "Rapports ouverts", family: FAM,
  description: "Un pied de fondation organisé comme un tableau de documents publics : rubriques, description, accès, filets fins sur carte blanche. Phrase en serif, champ e-mail souligné, derniers articles. Lilas pâle et violet.",
  tags: ["fondation", "transparence", "tableau", "documents", "serif", "lilas", "violet", "newsletter"],
  identity: alma,
  racine: { desktop: { backgroundColor: "#efeaf7", gap: "0px" } },
  widgets: ["sitelogo", "text", "emailsubscribe", "link", "bizcontact", "querylist", "copyright", "bizlegal", "divider", "container"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · en-tête : logo, phrase en Cardo, champ e-mail souligné
    const marque = logo(k, env, 34);
    const phrase = G.geant("<p>Tout ce que nous publions, à portée de clic.</p>", { taille: [38, 68], tablette: { taille: [44, 58] }, lh: 1.04, suivi: "-0.015em", poids: "700", police: S.head, couleur: S.fg, largeur: "720px" })(k, env);
    const gauche = G.colonne(k, [marque, phrase], { poids: 7, min: "300px", gap: "26px" });
    const abo = G.abonnement({ titre: "Les rapports par e-mail", intro: "Une lettre à chaque publication, rien d'autre.", bouton: "Recevoir", largeur: "420px", soulignement: "2px", tailleChamp: "17px" })(k, env);
    const droite = G.colonne(k, [abo], { poids: 4, min: "280px", soi: "flex-end" });
    const entete = G.ligne(k, [gauche, droite], { gap: "36px 64px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    // 2 · le tableau : en-têtes (bureau et tablette), puis cinq lignes ; filets fins entre les lignes
    const ENCRE = S.fg, filetFin = "#241b3a1f";
    const pictogramme = () => k.col([k.col([], { width: "14px", height: "2px", backgroundColor: S.accent }), k.col([], { width: "10px", height: "2px", backgroundColor: S.accent })], { width: "28px", height: "36px", minWidth: "28px", borderStyle: "solid", borderWidth: "2px", borderColor: S.accent, borderRadius: "5px", paddingTop: "10px", paddingLeft: "5px", gap: "4px", flexShrink: 0, alignItems: "flex-start" });
    const colTitre = { flexGrow: 4, flexBasis: "0px", minWidth: "0px" }, colDesc = { flexGrow: 5, flexBasis: "0px", minWidth: "0px" }, colAcces = { flexGrow: 2, flexBasis: "0px", minWidth: "0px" };
    const stCaps = caps(k, "x").styles.desktop;
    const enteteTitre = { ...k.row([k.col([], { width: "28px", minWidth: "28px", height: "1px" }), k.T("<p>Document</p>", stCaps)], { gap: "16px", flexWrap: "nowrap", alignItems: "center", ...colTitre }) };
    const entetes = { ...k.row([enteteTitre, k.T("<p>Ce que vous y trouvez</p>", { ...stCaps, ...colDesc }), k.T("<p>Accès</p>", { ...stCaps, ...colAcces, textAlign: "right" })], { gap: "24px", flexWrap: "nowrap", width: "100%", alignItems: "center", paddingTop: "14px", paddingBottom: "14px", paddingLeft: "32px", paddingRight: "32px", backgroundColor: "#f6f2fb", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: filetFin }), hideOn: ["mobile"] };
    const ligneDoc = (titre, desc, url) => {
      const t = k.T(`<p>${titre}</p>`, { fontFamily: S.head, fontSize: "22px", fontWeight: "700", color: ENCRE, lineHeight: 1.2, flexGrow: 1, flexBasis: "0px", minWidth: "0px" });
      const bloc = k.row([pictogramme(), t], { gap: "16px", flexWrap: "nowrap", alignItems: "center", ...colTitre });
      const d = k.T(`<p>${desc}</p>`, { fontFamily: S.font, fontSize: "15px", color: S.mute, lineHeight: 1.5, ...colDesc });
      const a = lien(k, "Consulter ↗", url, { taille: 15, poids: "700", couleur: S.accent, h: "44px", survol: { color: ENCRE, textDecoration: "underline" }, extra: { ...colAcces, justifyContent: "flex-end" } });
      return k.row([bloc, d, a], { gap: "24px", flexWrap: "nowrap", width: "100%", alignItems: "center", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "32px", paddingRight: "32px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: filetFin },
        { flexWrap: "nowrap", paddingLeft: "24px", paddingRight: "24px", gap: "16px" }, { flexDirection: "column", alignItems: "flex-start", flexWrap: "nowrap", gap: "10px", paddingLeft: "20px", paddingRight: "20px", paddingTop: "22px", paddingBottom: "18px" });
    };
    const lignes = [["Rapports d'activité", "Ce que nous avons fait, année après année.", "/blog"], ["Comptes annuels", "Recettes, dépenses et affectation des fonds.", "/blog"], ["Statuts de la fondation", "Missions, gouvernance et règles de fonctionnement.", "/faq"], ["Cookies et confidentialité", "Comment nous traitons vos données.", "/cookies"], ["Un document manque ?", "Demandez-le-nous : nous répondons par écrit.", "/contact"]].map(([a, b, c]) => ligneDoc(a, b, c));
    // les cellules d'une ligne passent en pile sur mobile : leurs largeurs de colonne ne comptent plus
    for (const l of lignes) for (const c of l.children) { const m = (c.styles.mobile = c.styles.mobile || {}); Object.assign(m, { flexBasis: "auto", flexGrow: 0, width: "100%", minWidth: "0px" }); if (c.type === "link") Object.assign(m, { justifyContent: "flex-start", width: "auto" }); }
    const tableau = k.col([entetes, ...lignes], { gap: "0px", width: "100%", backgroundColor: S.alt, borderRadius: "28px", overflow: "hidden", borderStyle: "solid", borderWidth: "1px", borderColor: filetFin, shadow: { x: 0, y: 24, blur: 50, spread: -30, color: "#241b3a66" } });
    // 3 · quatre colonnes : fondation, coordonnées, réseaux en noms ↗, derniers documents (articles réels)
    const titreCol = (t) => caps(k, t, { couleur: S.mute, suivi: "0.16em", extra: { marginBottom: "4px" } });
    const liste = (liens) => k.col(liens.map(([l, u]) => lien(k, l, u, { taille: 15, h: "40px", survol: { color: S.accent, textDecoration: "underline" } })), { gap: "0px", alignItems: "flex-start" });
    const colFondation = G.colonne(k, [titreCol("La fondation"), liste([["Accueil", "/"], ["Questions fréquentes", "/faq"], ["Nous écrire", "/contact"]])], { poids: 1, min: "200px", gap: "8px" });
    const contact = contactTitre(k, env, "Nous trouver");
    const colContact = G.colonne(k, [contact], { poids: 1, min: "220px", gap: "8px" });
    const reseaux = G.reseauxTexte([["LinkedIn", "https://www.linkedin.com/"], ["YouTube", "https://www.youtube.com/"], ["Facebook", "https://www.facebook.com/"]], { taille: 15, couleur: S.fg, focus: S.accent, survol: S.accent })(k, env);
    reseaux.styles.desktop = { ...reseaux.styles.desktop, flexDirection: "column", alignItems: "flex-start", rowGap: "0px" };
    const colReseaux = G.colonne(k, [titreCol("Nous suivre"), reseaux], { poids: 1, min: "180px", gap: "8px" });
    const recents = k.W("querylist", { title: "", source: "posts", mode: "recent", count: 3, layout: "list", showImage: false, showDate: true, showMeta: false, showExcerpt: false, showCount: false, empty: "Les prochains documents apparaîtront ici." }, { width: "100%", color: S.mute, fontFamily: S.font, fontSize: "14px" });
    recents.parts = {
      item: { styles: { desktop: { borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: filetFin, paddingTop: "10px", paddingBottom: "10px" } } },
      link: { styles: { desktop: { fontFamily: S.head, fontSize: "17px", fontWeight: "700", color: S.fg, lineHeight: 1.3, textDecoration: "none" }, mobile: { paddingTop: "10px", paddingBottom: "10px" } }, states: { hover: { color: S.accent, textDecoration: "underline" }, focus: GK.focus(S.accent) } },
      date: { styles: { desktop: { fontFamily: S.font, fontSize: "12px", color: S.mute, textTransform: "uppercase", letterSpacing: "0.12em" } } },
    };
    const colRecents = G.colonne(k, [titreCol("Derniers documents publiés"), recents], { poids: 2, min: "260px", gap: "8px" });
    const colonnes = G.ligne(k, [colFondation, colContact, colReseaux, colRecents], { gap: "36px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [entete, tableau, colonnes, trait(k, filetFin), mentions], { colonne: true, gap: "48px", padV: ["88px", "72px", "56px"], padB: ["40px", "36px", "32px"], padH: ["48px", "32px", "16px"], fond: S.bg, innerMobile: { rowGap: "36px" }, nom: "Documents publics" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── c-089 « Climat en Chiffres » ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : « Après-Demain » (collectif fictif). Une MOSAÏQUE de tuiles (bento) sur un dégradé turquoise → vert forêt : une grande tuile de chiffre-clé en 176 px, deux petites, une tuile newsletter vert citron,
// une tuile de liens entiers, une tuile réseaux. Les trois chiffres sont des EXEMPLES, marqués « Exemple » sur chaque tuile et dans une note : à remplacer par les chiffres du collectif et leur source (rien n'est présenté comme réel).
// Vert forêt #0B3D2E, citron vert #C5F04A. Polices : Epilogue 800 (titres ; testée à 150 px, propre) et Karla (texte).
// Écarts au concept : pas d'apparition en fondu (aucune animation d'entrée sûre dans le moteur) ; widget Compteur non utilisé (il animerait un chiffre d'exemple comme s'il était mesuré).
const apres = identite({
  key: "c089", label: "Vert forêt et citron vert", humeur: "dark",
  fond: "#0b3d2e", texte: "#f0f7ee", discret: "#bfdccb", accent: "#c5f04a", surface: "#12513e",
  police: "font.karla", titres: "font.epilogue",
  rayon: "20px", rayonBouton: "14px", ombre: "none", poids: "800", bordure: "0px", ligne: "#f0f7ee2e",
});

const climatEnChiffres = modeleV2({
  id: identifiantV2(89, "climat-en-chiffres"), concept: "c-089-climat-en-chiffres",
  name: "Climat en chiffres", family: FAM,
  description: "Une mosaïque de tuiles sur dégradé turquoise et vert forêt : un grand chiffre-clé et deux petits (exemples à remplacer), une tuile lettre d'information vert citron, une tuile de liens, une tuile réseaux.",
  tags: ["climat", "collectif", "bento", "tuiles", "chiffres", "vert forêt", "citron", "newsletter"],
  identity: apres,
  racine: { desktop: { backgroundColor: "#0b3d2e", gap: "0px" } },
  widgets: ["sitelogo", "text", "link", "emailsubscribe", "social", "copyright", "bizlegal", "container"],
  compose(k, env, G) {
    const S = k.S, FORET = "#0b3d2e";
    const tuile = (enfants, o = {}) => G.colonne(k, enfants, { poids: o.poids ?? 1, min: o.min || "0px", base: o.base, gap: o.gap || "14px", aligne: "flex-start", justifie: o.justifie, extra: { backgroundColor: o.fond || S.alt, borderRadius: "24px", paddingTop: o.pad || "28px", paddingBottom: o.pad || "28px", paddingLeft: o.pad || "28px", paddingRight: o.pad || "28px", ...(o.extra || {}) }, tablette: o.tablette, mobile: { paddingTop: "22px", paddingBottom: "22px", paddingLeft: "20px", paddingRight: "20px", ...(o.mobile || {}) } });
    const exemple = () => k.T("<p><strong>Exemple</strong></p>", { fontSize: "11px", lineHeight: 1, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: S.font, color: S.accent, borderStyle: "solid", borderWidth: "1px", borderColor: S.accent, borderRadius: "999px", paddingTop: "6px", paddingBottom: "6px", paddingLeft: "10px", paddingRight: "10px", alignSelf: "flex-start" });
    const legende = (t) => texte(k, t, { taille: 16, couleur: S.fg, largeur: "300px", lh: 1.4 });
    // 1 · barre du haut : logo à gauche, lien d'accès à droite
    const barre = G.ligne(k, [logo(k, env, 34, S.accent), lien(k, "Rejoindre le collectif →", "/inscription", { taille: 15, poids: "700", h: "44px", couleur: S.accent, survol: { color: S.fg, textDecoration: "underline" }, focus: S.fg })], { justifie: "space-between", aligne: "center", largeur: "100%" });
    // 2 · la grande tuile : le chiffre-clé (exemple)
    const grand = G.texteFluide("<p>128</p>", { taille: [88, 176], tablette: { taille: [120, 160] }, mobile: { taille: [80, 96] }, lh: 0.92, suivi: "-0.04em", poids: "800", police: S.head, couleur: S.accent })(k, env);
    const tuileA = tuile([exemple(), grand, legende("hectares rendus à la nature (valeur d'exemple)")], { poids: 5, min: "300px", justifie: "space-between", gap: "20px", extra: { gradient: { from: "#0e6654", to: "#0d5a49", angle: 160 }, minHeight: "360px" }, mobile: { flexBasis: "100%", minHeight: "280px" } });
    // 3 · deux petites tuiles de chiffres
    const petite = (n, t) => tuile([exemple(), G.texteFluide(`<p>${n}</p>`, { taille: [40, 72], mobile: { taille: [44, 52] }, lh: 0.95, suivi: "-0.03em", poids: "800", police: S.head, couleur: S.accent })(k, env), legende(t)], { poids: 1, min: "200px", gap: "20px", mobile: { minWidth: "130px" } });
    const chiffres = G.ligne(k, [petite("3 400", "arbres plantés (exemple)"), petite("52", "ateliers animés (exemple)")], { gap: "16px", aligne: "stretch", largeur: "100%" });
    // 4 · la tuile lettre d'information : fond citron, texte vert forêt ; le widget prend les couleurs de la tuile
    const abo = G.abonnement({ titre: "Lettre du collectif", intro: "Une fois par mois : ce qui avance, ce qui reste à faire.", bouton: "S'abonner", largeur: "100%", accent: FORET, texte: FORET, soulignement: "2px", survolBouton: "#ffffff", survolTexte: FORET, styleTitre: { fontFamily: S.font, color: FORET, fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "6px" } })(k, env);
    abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: "#1c3a2b", fontSize: "16px" };
    abo.parts.consent.styles.desktop = { ...abo.parts.consent.styles.desktop, color: "#1c3a2b" };
    abo.parts.missing.styles.desktop = { ...abo.parts.missing.styles.desktop, color: FORET };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: S.accent, backgroundColor: FORET, borderRadius: "14px" };
    abo.parts.button.states = { hover: { backgroundColor: "#ffffff", color: FORET }, focus: GK.focus(FORET) };
    abo.parts.input.states = { focus: GK.focus(FORET) };
    const tuileNews = tuile([abo], { fond: S.accent, poids: 1, base: "auto", pad: "28px", justifie: "center", extra: { width: "100%", color: FORET } });
    const droite = G.colonne(k, [chiffres, tuileNews], { poids: 7, min: "300px", gap: "16px", aligne: "stretch", mobile: { flexBasis: "100%" } });
    const grille1 = G.ligne(k, [tuileA, droite], { gap: "16px", aligne: "stretch", largeur: "100%" });
    // 5 · tuile de liens (cartes entières) et tuile réseaux
    const carteLien = (t, u) => lien(k, `${t}  →`, u, { taille: 16, poids: "700", h: "56px", padH: "18px", survol: { backgroundColor: S.accent, color: FORET, transform: { x: 4 }, textDecoration: "none" }, focus: S.accent,
      extra: { flexGrow: 1, flexBasis: "120px", justifyContent: "space-between", backgroundColor: FORET, borderRadius: "14px", borderStyle: "solid", borderWidth: "1px", borderColor: "#f0f7ee33" } });
    const tuileLiens = tuile([caps(k, "S'informer et agir", { couleur: S.mute }), k.row([carteLien("Actualités", "/blog"), carteLien("Questions", "/faq"), carteLien("Nous écrire", "/contact"), carteLien("S'engager", "/inscription")], { gap: "10px", alignItems: "stretch", width: "100%" })], { poids: 7, min: "300px", gap: "16px", mobile: { flexBasis: "100%" } });
    const tuileReseaux = tuile([caps(k, "Suivre le collectif", { couleur: S.mute }), reseauxIcones(k, env, ["instagram", "youtube", "linkedin"], { contour: "#f0f7ee66", fond: "transparent", couleur: S.fg })], { poids: 5, min: "240px", gap: "16px", mobile: { flexBasis: "100%" } });
    const grille2 = G.ligne(k, [tuileLiens, tuileReseaux], { gap: "16px", aligne: "stretch", largeur: "100%" });
    const note = texte(k, "Chiffres d'exemple : remplacez-les par les chiffres du collectif et indiquez toujours leur source.", { taille: 13, couleur: S.mute });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [barre, grille1, grille2, note, mentions], { colonne: true, gap: "16px", padV: ["72px", "56px", "48px"], padB: ["40px", "36px", "32px"], padH: ["40px", "28px", "16px"], fond: S.bg, innerMobile: { rowGap: "16px" }, degrade: { from: "#0c5f52", to: FORET, angle: 180 }, nom: "Chiffres du collectif" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ── c-090 « Bénévoles en Cartes » ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : « Main Tendue » (association de bénévoles fictive). Une GRANDE CARTE crème à coins de 40 px, décollée des bords, posée sur un aplat jaune ; trois gros AUTOCOLLANTS-boutons cousus dedans comme des badges
// (« Donner du temps », « Donner », « Nous suivre » : pilules à liseré brun, ombre dure, légèrement penchées de 2 degrés), le logo à droite, les liens en pilules, les coordonnées sur une ligne, les réseaux en pastilles.
// Les mentions restent sur l'aplat, sous la carte. Deux jaunes et du brun #2A2200 (contrastes ≥ 7:1). Polices : Mali 700 (titres ; testée à 150 px, propre) et Lato (texte).
// Écarts au concept : pas de motif répété (rendu par deux grands disques jaunes derrière la carte) ; pas de lettre d'information (le concept n'en prévoit pas dans ses widgets).
const mainTendue = identite({
  key: "c090", label: "Jaune miel et brun", humeur: "light",
  fond: "#ffe08a", texte: "#2a2200", discret: "#4d4000", accent: "#2a2200", surface: "#fff6d6",
  police: "font.lato", titres: "font.mali",
  rayon: "40px", rayonBouton: "999px", ombre: "lg", poids: "400", bordure: "2px", ligne: "#2a220040", // police statique : poids 400 pour le logo (chargé avec le 700 des titres)
});

const beneVolesCartes = modeleV2({
  id: identifiantV2(90, "benevoles-en-cartes"), concept: "c-090-benevoles-en-cartes",
  name: "Bénévoles en cartes", family: FAM,
  description: "Une grande carte crème à coins de 40 px posée sur un aplat jaune, avec trois gros autocollants-boutons (donner du temps, donner, suivre), logo à droite, pilules de liens et coordonnées sur une ligne. Joyeux et lisible.",
  tags: ["bénévolat", "association", "carte", "autocollants", "jaune", "brun", "joyeux", "pilules"],
  identity: mainTendue,
  racine: { desktop: { backgroundColor: "#ffe08a", gap: "0px" } },
  widgets: ["sitelogo", "text", "button", "link", "bizcontact", "copyright", "bizlegal", "container"],
  compose(k, env, G) {
    const S = k.S, CREME = "#fff6d6", MIEL = "#ffc933";
    // 1 · en-tête de la carte : phrase en Mali à gauche, logo à droite
    const etiquette = caps(k, "Association de bénévoles", { couleur: S.mute, police: S.font, suivi: "0.14em" });
    const phrase = G.geant("<p>Ensemble, on fait plus.</p>", { taille: [38, 68], tablette: { taille: [44, 58] }, lh: 1.08, suivi: "-0.01em", poids: "700", police: S.head, couleur: S.fg, largeur: "820px" })(k, env);
    const intro = G.phrase("Une heure de votre temps, un don ou un partage : choisissez votre façon d'aider.", { taille: 18, largeur: "520px", couleur: S.mute, lh: 1.6 })(k, env);
    const gauche = G.colonne(k, [etiquette, phrase, intro], { poids: 8, min: "280px", gap: "16px", tablette: { flexBasis: "100%" } });
    const droite = G.colonne(k, [logo(k, env, 40, "#6b5600")], { poids: 2, min: "120px", aligne: "flex-end", soi: "flex-start", tablette: { flexBasis: "100%", alignItems: "flex-start" }, mobile: { alignItems: "flex-start" } });
    const entete = G.ligne(k, [gauche, droite], { gap: "20px 32px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    // 2 · les trois autocollants : pilules à liseré brun et ombre dure, penchées de quelques degrés ; au survol et au focus ils se soulèvent
    const autocollant = (label, url, fond, couleur, angle) => GK.fini(k, k.B(label, url, "solid", { backgroundColor: fond, color: couleur, fontFamily: S.head, fontSize: "24px", fontWeight: "700", lineHeight: 1.15, borderStyle: "solid", borderWidth: "3px", borderColor: S.fg, borderRadius: "999px", minHeight: "96px", paddingLeft: "28px", paddingRight: "28px", flexGrow: 1, flexBasis: "220px", display: "inline-flex", alignItems: "center", justifyContent: "center", textAlign: "center", textDecoration: "none", transform: { rotate: angle }, transitionDuration: GK.MOUVEMENT, shadow: { x: 6, y: 6, blur: 0, spread: 0, color: S.fg } },
      { flexBasis: "0px", fontSize: "20px", paddingLeft: "16px", paddingRight: "16px" }, { flexBasis: "100%", minHeight: "76px", fontSize: "22px" }), { hover: { transform: { y: -4, rotate: angle }, backgroundColor: S.fg, color: CREME }, focus: GK.focus(S.fg) });
    const stickers = k.row([autocollant("Donner du temps", "/inscription", S.fg, CREME, -2), autocollant("Donner", "/contact", MIEL, S.fg, 2), autocollant("Nous suivre", "/blog", "#ffffff", S.fg, -1)], { ...GK.gaps("22px 24px"), alignItems: "stretch", width: "100%", paddingTop: "8px", paddingBottom: "10px" });
    // 3 · liens en pilules, coordonnées sur une ligne, réseaux en pastilles
    const pilules = G.pilules([["Actualités", "/blog"], ["Questions fréquentes", "/faq"], ["Nous écrire", "/contact"], ["Nous rejoindre", "/inscription"]], { contour: S.fg, couleur: S.fg, taille: 15, poids: "700", gap: "10px", survolFond: S.fg, survolCouleur: CREME, focus: S.fg })(k, env);
    const coord = G.code("contact:inline")(k, env); coord.styles.desktop = { ...coord.styles.desktop, fontFamily: S.font, fontSize: "15px", color: S.fg };
    const reseaux = G.pilules([["Facebook", "https://www.facebook.com/"], ["Instagram", "https://www.instagram.com/"]], { fond: MIEL, contour: S.fg, couleur: S.fg, taille: 14, poids: "700", gap: "10px", survolFond: S.fg, survolCouleur: CREME, focus: S.fg })(k, env);
    const bas = G.ligne(k, [coord, reseaux], { gap: "14px 32px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const contenu = { type: "stack", children: [entete, stickers, trait(k, S.line, "2px"), pilules, bas],
      ...sty({ display: "flex", flexDirection: "column", gap: "32px", backgroundColor: CREME, color: S.fg, borderRadius: "40px", paddingTop: "56px", paddingBottom: "56px", paddingLeft: "56px", paddingRight: "56px", width: "100%", position: "relative", zIndex: 1, shadow: { x: 0, y: 26, blur: 50, spread: -22, color: "#2a220066" }, borderStyle: "solid", borderWidth: "2px", borderColor: "#2a220026" },
        { paddingLeft: "36px", paddingRight: "36px", paddingTop: "44px", paddingBottom: "44px", borderRadius: "36px" }, { paddingLeft: "22px", paddingRight: "22px", paddingTop: "32px", paddingBottom: "32px", borderRadius: "30px", gap: "26px" }) };
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = surDecors(G.bande(k, [contenu, mentions], { colonne: true, gap: "40px", padV: ["96px", "72px", "40px"], padB: ["40px", "36px", "32px"], padH: ["40px", "28px", "12px"], fond: S.bg, innerMobile: { rowGap: "28px" }, nom: "Carte des bénévoles" }), [
      decor({ width: "360px", height: "360px", borderRadius: "50%", backgroundColor: "#ffd35e", top: "-150px", left: "-110px" }, { width: "220px", height: "220px", top: "-90px", left: "-90px" }),
      decor({ width: "300px", height: "300px", borderRadius: "50%", backgroundColor: "#ffd35e", top: "-120px", right: "-60px" }, { width: "180px", height: "180px", top: "-70px", right: "-60px" }),
    ]);
    return [G.racine(k, [bande])];
  },
}, FAM);

module.exports = {
  key: "associatif-ong", label: "Associatif et ONG", target: 6, built: true,
  description: "Associations, ONG et collectifs : don, bénévolat, transparence, impact en chiffres.",
  models: [donEnUnGeste, carteQuartier, contributeurs, rapportsOuverts, climatEnChiffres, beneVolesCartes],
};
