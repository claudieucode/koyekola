// Famille v2 « Cosmétique et parfumerie » — 6 modèles (ft2-320 à ft2-325), pieds « inspirés de captures » REFAITS avec de vraies illustrations vectorielles : ANGLES DROITS partout.
// Marques fictives (Essence, Ambre & Sauge, Quatre gestes, Maison Aurèle, Néroli Lab, Rosée) ; aucune coordonnée ni chiffre inventé : horaires, adresse et téléphone viendraient des Données de l'entreprise du site.
// Rubriques (Parfums, Soins…) = intitulés d'EXEMPLE à renommer dans l'éditeur ; adresses de réseaux = exemples.
// Partis pris : 320 et 323 = nom monumental dessiné (capture « static ») · 321 et 324 = appel centré, curseurs flottants, rangée de pictos, pied de colonnes (capture « WorkScale ») · 322 et 325 = grande scène illustrée en bas + mascotte (capture « BOTSnDOTS »).
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; une animation visible par modèle (bouton ou carré qui respire) ; pas d'animation d'entrée.
const { modeleV2, identifiantV2 } = require("../kit-v2");
const A = require("../aides-a04");
const IB = require("../aides-illus-a04b");
const I_ = require("../aides-illus-a04");
const { identite, PAD, racineDe, lien, caps, texte, trait, souffle, carre, bouton, bloc, mentions, reseaux, coordonnees } = A;
const FAM = "cosmetique-parfumerie";
const liensCol = (k, l, o) => l.map(([a, u]) => lien(k, a, u, { taille: 17, poids: "500", couleur: o.c, survol: { color: o.s, transform: { x: 4 } }, focus: o.s }));

// flacons de parfum (320) : halo doré, grand flacon, deux petits
const flacons = (W, H) => I_.halo(180, 175, 150, "#e6c675", 6, 0.08)
  + `<rect x="130" y="130" width="120" height="190" fill="#b8913c"/><rect x="150" y="130" width="80" height="190" fill="#d9b85c"/><rect x="170" y="130" width="40" height="190" fill="#f0d68a"/><rect x="152" y="196" width="76" height="74" fill="#f7f1e8"/><rect x="162" y="214" width="56" height="3" fill="#4a0f25"/><rect x="162" y="228" width="56" height="2" fill="#4a0f25"/><rect x="162" y="244" width="30" height="3" fill="#4a0f25"/><rect x="170" y="100" width="40" height="30" fill="#f7f1e8"/><rect x="156" y="58" width="68" height="42" fill="#e6c675"/><rect x="156" y="58" width="68" height="6" fill="#fff3c9"/>`
  + `<rect x="40" y="210" width="62" height="110" fill="none" stroke="#f7f1e8" stroke-width="3"/><rect x="48" y="250" width="46" height="62" fill="#e6c675" opacity="0.7"/><rect x="58" y="186" width="26" height="24" fill="#f7f1e8"/>`
  + `<circle cx="296" cy="268" r="46" fill="none" stroke="#f7f1e8" stroke-width="3"/><path d="M250,268 a46,46 0 0 0 92,0 Z" fill="#e6c675" opacity="0.8"/><rect x="286" y="212" width="20" height="10" fill="#f7f1e8"/><rect x="278" y="198" width="36" height="14" fill="#e6c675"/><rect x="20" y="320" width="320" height="3" fill="#f7f1e8"/>`
  + `<circle cx="262" cy="150" r="5" fill="#e6c675"/><circle cx="284" cy="120" r="3.5" fill="#e6c675" opacity="0.7"/><circle cx="108" cy="150" r="4" fill="#e6c675" opacity="0.7"/>`;
// alambic gravé dans un médaillon (323)
function alambic(W, H) {
  const I = "#1d2a3a", O = "#7a5f22"; let s = `<circle cx="210" cy="150" r="146" fill="none" stroke="${I}" stroke-width="1.5"/><circle cx="210" cy="150" r="138" fill="none" stroke="${I}" stroke-width="1.5"/>`;
  s += `<circle cx="150" cy="190" r="62" fill="none" stroke="${I}" stroke-width="3"/><path d="M96,196 a62,62 0 0 0 108,0 Z" fill="${O}" opacity="0.55"/>`;
  for (let i = 0; i < 8; i++) s += `<line x1="${112 + i * 11}" y1="${200 + (i % 3) * 8}" x2="${124 + i * 11}" y2="${222 + (i % 3) * 6}" stroke="${I}" stroke-width="1"/>`;
  s += `<rect x="138" y="118" width="24" height="14" fill="none" stroke="${I}" stroke-width="3"/><path d="M134,118 Q150,70 166,118 Z" fill="none" stroke="${I}" stroke-width="3"/><path d="M150,86 C190,56 240,52 292,92" stroke="${I}" stroke-width="3" fill="none"/>`;
  for (let i = 0; i < 5; i++) s += `<path d="M${230 + i * 12},${60 + i * 8} l8,22" stroke="${I}" stroke-width="2" fill="none"/>`;
  s += `<path d="M292,92 L292,148" stroke="${I}" stroke-width="3"/><rect x="262" y="148" width="60" height="64" fill="none" stroke="${I}" stroke-width="3"/><rect x="262" y="180" width="60" height="32" fill="${O}" opacity="0.6"/><circle cx="292" cy="224" r="3.5" fill="${O}"/><circle cx="292" cy="238" r="2.5" fill="${O}"/>`;
  return s + `<rect x="96" y="250" width="108" height="10" fill="${I}"/><rect x="86" y="260" width="128" height="6" fill="none" stroke="${I}" stroke-width="2"/>`;
}

// ── ft2-320 « Index des essences » — capture 14 : nom « essence » dessiné en ivoire sur vin profond, sur toute la largeur, puis flacons dessinés et index de liens.
const essence = identite({ key: "i320", label: "Vin profond, ivoire et or", humeur: "dark", fond: "#4a0f25", texte: "#f7f1e8", discret: "#e8d3d6", accent: "#e6c675", surface: "#5c1830", encre: "#4a0f25", surEncre: "#f7f1e8", police: "font.jost", titres: "font.cormorant-garamond", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#f7f1e84d" });
const essenceMod = modeleV2({
  id: identifiantV2(320, "index-des-essences"), concept: "c-320-index-des-essences", name: "Index des essences", family: FAM,
  description: "Pour une maison de parfum : le nom « essence » dessiné en lettres ivoire géantes sur vin profond, puis des flacons dessinés dans un halo doré et un index de liens (parfums, soins, maison) avec les coordonnées. Vin, ivoire et or.",
  tags: ["parfumerie", "nom monumental", "illustration", "flacons", "vin", "ivoire", "or", "angles droits"],
  identity: essence, racine: racineDe("#4a0f25"), widgets: ["text", "link", "html", "bizcontact", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = A.fixe(k0); const IV = "#f7f1e8", OR = "#e6c675", D = "#e8d3d6", V = "#4a0f25";
    const tete = G.bande(k, [souffle(carre(k, OR, "12px"), 3200), caps(k, "Maison de parfum — l'index", { couleur: OR, suivi: "0.22em" }), lien(k, "Écrire à la maison →", "/contact", { taille: 16, poids: "600", couleur: IV, soulign: true, survol: { color: OR }, focus: OR })], { fond: V, gap: "12px 20px", aligne: "center", justifie: "flex-start", padV: ["40px", "32px", "28px"], padB: ["12px", "12px", "8px"], padH: PAD, nom: "Marque" });
    const mono = IB.bandeMot(k, G, { texte: "essence", couleur: IV, fond: V, marge: 60, sw: 26, ecart: 22, deco: () => `<path d="M520,-40 L502,-4 A18,18 0 1 0 538,-4 Z" fill="${OR}"/>` });
    const col = (t, l) => bloc(k, t, liensCol(k, l, { c: IV, s: OR }), { couleurTitre: OR, gap: "0px", min: "150px" });
    const fl = k.col(I_.dessin(k, [360, 340, flacons]), { flexGrow: 0.7, flexBasis: "280px", maxWidth: "360px", minWidth: "220px" });
    const liens = k.row([col("Parfums", [["Pour elle", "/boutique"], ["Pour lui", "/boutique"], ["Mixtes", "/boutique"]]), col("Soins", [["Visage", "/boutique"], ["Corps et bain", "/boutique"], ["Coffrets", "/boutique"]]), col("Maison", [["Conseils", "/faq"], ["Livraison", "/faq"], ["Contact", "/contact"]]), bloc(k, "Nous trouver", [coordonnees(k, { couleur: D, lien: IV, survol: OR, focus: OR })], { couleurTitre: OR, min: "200px", poids: 1.4 })], { gap: "28px 40px", alignItems: "flex-start", flexWrap: "wrap", flexGrow: 3, flexBasis: "520px" });
    const corps = G.bande(k, [fl, liens], { fond: V, gap: "32px 56px", aligne: "center", padV: ["32px", "28px", "20px"], padB: ["40px", "32px", "28px"], padH: PAD, nom: "Flacons et index" });
    const bas = G.bande(k, [reseaux(k, env, { couleur: IV, survol: OR, focus: OR }), mentions(k, env, { couleur: D, liens: IV })], { fond: V, gap: "16px 40px", aligne: "center", padV: ["16px", "14px", "12px"], padB: ["28px", "24px", "20px"], padH: PAD, filetHaut: { epaisseur: "1px", couleur: "#f7f1e84d" }, nom: "Mentions" });
    bas.styles.desktop.color = D;
    return [G.racine(k, [tete, mono, corps, bas])];
  },
}, FAM);

// ── ft2-321 « Mosaïque d'ambre » — capture 13 : appel centré sur crème, curseurs d'ingrédients, rangée de cinq pictos de plantes, pied vert à colonnes et coordonnées.
const ambre = identite({ key: "i321", label: "Crème, vert sapin et ambre", humeur: "light", fond: "#f5efe3", texte: "#1f3b2d", discret: "#445a4b", accent: "#1f3b2d", surface: "#e9d8c4", encre: "#f5efe3", surEncre: "#1f3b2d", police: "font.dm-sans", titres: "font.fraunces", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#1f3b2d33" });
const ambreMod = modeleV2({
  id: identifiantV2(321, "mosaique-d-ambre"), concept: "c-321-mosaique-d-ambre", name: "Mosaïque d'ambre", family: FAM,
  description: "Pour une marque de cosmétique naturelle : un appel centré sur crème, des étiquettes de curseurs flottantes, une rangée de cinq plantes et gouttes dessinées, puis un pied vert à quatre colonnes avec coordonnées et pastilles de réseaux.",
  tags: ["cosmétique naturelle", "appel centré", "curseurs", "plantes dessinées", "crème", "vert", "angles droits"],
  identity: ambre, racine: racineDe("#f5efe3"), widgets: ["text", "link", "html", "bizcontact", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const bandes = IB.heros(k, env, G, { v: 3, cv: 2, fond: "#f5efe3", fondRangee: "#e9d8c4", fondPied: "#f5efe3", encre: "#1f3b2d", discret: "#445a4b", accent: "#1f3b2d", accent2: "#8a5a1c", survol: "#8a5a1c", surTexte: "#ffffff", titreCol: "#8a5a1c", filet: "#1f3b2d33", emblemeForme: "feuille",
      curseurs: ["#1f3b2d", "#c98a3a", "#6f8f68", "#b8573a", "#6b3f12"], pictos: I_.ingredients, traitRangee: "#1f3b2d", accentRangee: "#c98a3a", poidsTitre: "600", suivi: "-0.01em", ordre: "chrp", contactCol: true,
      titre: "<p>Des soins simples,<br>cueillis avec soin.</p>", sous: "Visage et corps, à base de plantes. Une routine courte, des gestes doux, des conseils par écrit.", b1: ["Voir les soins", "/boutique", "#1f3b2d", "#f5efe3"], b2: ["Demander conseil", "/contact", "#f5efe3"], marqueNom: "Ambre &amp; Sauge",
      phrase: "Soins du visage et du corps à base de plantes.", cols: [["Visage", [["Nettoyants", "/boutique"], ["Sérums", "/boutique"], ["Crèmes", "/boutique"]]], ["Corps", [["Huiles", "/boutique"], ["Baumes", "/boutique"]]], ["Aide", [["Livraison", "/faq"], ["Retours", "/faq"], ["Conseils", "/blog"]]]] });
    return [G.racine(k, bandes)];
  },
}, FAM);

// ── ft2-322 « Quatre gestes » — capture 15 : marque et phrase à gauche, petite goutte-mascotte, colonnes à titres or, grande scène d'îles flottantes de nuit.
const gestes = identite({ key: "i322", label: "Bleu nuit, ivoire et or", humeur: "dark", fond: "#0e1a2b", texte: "#f2ead7", discret: "#c3cbd8", accent: "#e2b857", surface: "#16263d", encre: "#0e1a2b", surEncre: "#f2ead7", police: "font.jost", titres: "font.playfair-display", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#f2ead933" });
const gestesMod = modeleV2({
  id: identifiantV2(322, "quatre-gestes"), concept: "c-322-quatre-gestes", name: "Quatre gestes", family: FAM,
  description: "Pour une marque de soins : la marque, sa phrase et les pastilles de réseaux à gauche, une goutte qui salue, quatre colonnes de liens aux titres or, et en bas une grande scène dessinée d'îles flottantes de nuit, cascades, tours et arbres d'or.",
  tags: ["soin", "beauté", "scène illustrée", "îles flottantes", "mascotte", "bleu nuit", "or", "angles droits"],
  identity: gestes, racine: racineDe("#0e1a2b"), widgets: ["text", "link", "html", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const bandes = IB.paysage(k, env, G, { v: 3, cv: 2, fond: "#0e1a2b", encre: "#f2ead7", discret: "#c3cbd8", accent: "#e2b857", accent2: "#e2b857", titreCol: "#e2b857", filet: "#f2ead933", emblemeForme: "soleil", marqueNom: "Quatre gestes",
      phrase: "Un soin en quatre gestes : choisir, essayer, offrir, prendre soin.", cols: [["Choisir", [["Conseils", "/blog"], ["Soins", "/boutique"]]], ["Essayer", [["Demander un échantillon", "/contact"], ["Questions", "/faq"]]], ["Offrir", [["Coffrets", "/boutique"], ["Cartes cadeaux", "/boutique"]]], ["Prendre soin", [["Les bons gestes", "/faq"], ["Livraison", "/faq"], ["Contact", "/contact"]]]],
      scene: I_.ilesNuit, mascotte: I_.gouttePilote });
    return [G.racine(k, bandes)];
  },
}, FAM);

// ── ft2-323 « Papier de parfumeur » — capture 14 : papier à en-tête, alambic gravé en médaillon, NOM « aurèle » dessiné en encre sur toute la largeur, coordonnées et liens centrés.
const aurele = identite({ key: "i323", label: "Papier blanc cassé, encre bleue et or vieilli", humeur: "light", fond: "#fbfaf6", texte: "#1d2a3a", discret: "#4d5967", accent: "#7a5f22", surface: "#f1efe6", encre: "#fbfaf6", surEncre: "#1d2a3a", police: "font.libre-caslon-text", titres: "font.cormorant-sc", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "0px", ligne: "#1d2a3a40" });
const aureleMod = modeleV2({
  id: identifiantV2(323, "papier-de-parfumeur"), concept: "c-323-papier-de-parfumeur", name: "Papier de parfumeur", family: FAM,
  description: "Pour un parfumeur indépendant : un alambic gravé dans un médaillon à double filet, le nom « aurèle » dessiné en lettres d'encre sur toute la largeur avec son accent doré, puis coordonnées, liens et mentions centrés sur papier blanc cassé.",
  tags: ["parfumeur", "nom monumental", "alambic", "papier à en-tête", "centré", "encre", "or", "angles droits"],
  identity: aurele, racine: racineDe("#fbfaf6"), widgets: ["text", "link", "html", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k0, env, G) {
    const k = A.fixe(k0); const P = "#fbfaf6", INK = "#1d2a3a", OR = "#7a5f22", D = "#4d5967";
    const medaillon = G.bande(k, [k.col(I_.dessin(k, [420, 300, alambic], null, { width: "100%" }), { width: "300px", maxWidth: "100%", alignSelf: "center" }), souffle(carre(k, OR, "10px"), 3200), caps(k, "Maison", { couleur: OR, suivi: "0.4em", extra: { textAlign: "center" } })], { fond: P, colonne: true, gap: "14px", aligne: "center", padV: ["56px", "44px", "32px"], padB: ["8px", "8px", "4px"], padH: PAD, nom: "Médaillon" });
    const mono = IB.bandeMot(k, G, { texte: "aurele", couleur: INK, fond: P, marge: 50, sw: 22, ecart: 24, deco: () => `<path d="M366,-30 L398,4" stroke="${OR}" stroke-width="14" fill="none"/>` });
    const liens = k.row([["Parfums", "/boutique"], ["Soins", "/boutique"], ["Coffrets", "/boutique"], ["Livraison", "/faq"], ["Contact", "/contact"]].map(([a, u]) => lien(k, a, u, { taille: 16, poids: "400", couleur: INK, padH: "10px", casse: "uppercase", suivi: "0.14em", survol: { color: OR, transform: { y: -3 } }, focus: OR })), { gap: "0px 14px", alignItems: "center", justifyContent: "center", flexWrap: "wrap" });
    const adresse = coordonnees(k, { couleur: INK, lien: INK, survol: OR, focus: OR, taille: 16 }); adresse.styles.desktop = { ...adresse.styles.desktop, textAlign: "center", maxWidth: "420px" };
    const pied = G.bande(k, [caps(k, "Parfumeur indépendant", { couleur: OR, suivi: "0.3em", extra: { textAlign: "center" } }), k.row([adresse], { justifyContent: "center", width: "100%" }), liens, trait(k, "#1d2a3a55"), mentions(k, env, { couleur: D, liens: INK, centre: true })], { fond: P, colonne: true, gap: "20px", aligne: "center", padV: ["8px", "8px", "8px"], padB: ["36px", "28px", "24px"], padH: PAD, max: "900px", nom: "Coordonnées et liens" });
    pied.styles.desktop.color = D;
    return [G.racine(k, [medaillon, mono, pied])];
  },
}, FAM);

// ── ft2-324 « Console du laboratoire » — capture 13 : rangée de molécules en tête, appel centré, curseurs flottants, pied sombre à colonnes.
const nerolilab = identite({ key: "i324", label: "Nuit, menthe et blanc", humeur: "dark", fond: "#0b0f14", texte: "#e4fbf3", discret: "#8fb8aa", accent: "#6ff2c2", surface: "#101820", encre: "#0b0f14", surEncre: "#e4fbf3", police: "font.dm-mono", titres: "font.space-grotesk", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#6ff2c240" });
const nerolilabMod = modeleV2({
  id: identifiantV2(324, "console-du-laboratoire"), concept: "c-324-console-du-laboratoire", name: "Console du laboratoire", family: FAM,
  description: "Pour un laboratoire de cosmétique : une rangée de cinq pictogrammes de laboratoire (molécule, fiole, atome, flacon, courbe) en tête, un appel centré, des étiquettes de curseurs flottantes, puis un pied sombre à quatre colonnes. Nuit, menthe, texte monospace.",
  tags: ["laboratoire", "cosmétique", "appel centré", "curseurs", "molécules dessinées", "nuit", "menthe", "angles droits"],
  identity: nerolilab, racine: racineDe("#0b0f14"), widgets: ["text", "link", "html", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const bandes = IB.heros(k, env, G, { v: 4, cv: 4, fond: "#0b0f14", fondRangee: "#101820", fondPied: "#0b0f14", encre: "#e4fbf3", discret: "#8fb8aa", accent: "#6ff2c2", accent2: "#6ff2c2", survol: "#e4fbf3", surTexte: "#0b0f14", titreCol: "#6ff2c2", filet: "#6ff2c240", emblemeForme: "fiole",
      curseurs: ["#6ff2c2", "#f2c96f", "#7aa2ff", "#ff8fb1", "#c9a6ff"], pictos: I_.molecules, traitRangee: "#8fb8aa", accentRangee: "#6ff2c2", poidsTitre: "600", suivi: "-0.03em", ordre: "rhcp",
      titre: "<p>Des formules claires,<br>testées au labo.</p>", sous: "Chaque soin a sa formule, ses ingrédients et son mode d'emploi. Posez vos questions, nous répondons par écrit.", b1: ["Voir les formules", "/boutique", "#6ff2c2", "#0b0f14"], b2: ["Poser une question", "/faq", "#0b0f14"], marqueNom: "Néroli Lab",
      phrase: "Laboratoire de cosmétique : formules lisibles et gestes simples.", cols: [["Formules", [["Visage", "/boutique"], ["Corps", "/boutique"], ["Parfums", "/boutique"]]], ["Ingrédients", [["Liste complète", "/faq"], ["Conseils", "/blog"]]], ["Aide", [["Livraison", "/faq"], ["Retours", "/faq"], ["Contact", "/contact"]]], ["Marque", [["Questions", "/faq"], ["Journal", "/blog"]]]] });
    return [G.racine(k, bandes)];
  },
}, FAM);

// ── ft2-325 « Gradins de rosée » — capture 15 : coordonnées et marque, goutte-mascotte, colonnes, scène de rizières en gradins roses et de gouttes de rosée.
const rosee = identite({ key: "i325", label: "Rose poudré, rosée et brique", humeur: "light", fond: "#fbf3ef", texte: "#2b1512", discret: "#5b3a33", accent: "#7a2b1e", surface: "#f4d9d0", encre: "#fbf3ef", surEncre: "#2b1512", police: "font.libre-franklin", titres: "font.italiana", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#2b151240" });
const roseeMod = modeleV2({
  id: identifiantV2(325, "gradins-de-rosee"), concept: "c-325-gradins-de-rosee", name: "Gradins de rosée", family: FAM,
  description: "Pour une marque de soin : la marque, ses coordonnées et ses pastilles à gauche, une goutte souriante, quatre colonnes de liens, et en bas une grande scène dessinée de gradins roses plantés de pousses, avec des gouttes de rosée et leurs ondes.",
  tags: ["soin", "rose", "scène illustrée", "gradins", "rosée", "mascotte", "contact", "angles droits"],
  identity: rosee, racine: racineDe("#fbf3ef"), widgets: ["text", "link", "html", "bizcontact", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const bandes = IB.paysage(k, env, G, { v: 4, cv: 1, fond: "#fbf3ef", encre: "#2b1512", discret: "#5b3a33", accent: "#7a2b1e", accent2: "#7a2b1e", titreCol: "#7a2b1e", filet: "#2b151240", emblemeForme: "goutte", marqueNom: "Rosée", contact: true,
      phrase: "Soins du visage et du corps, doux et simples, pour toutes les peaux.", cols: [["Visage", [["Nettoyants", "/boutique"], ["Soins", "/boutique"]]], ["Corps", [["Huiles", "/boutique"], ["Coffrets", "/boutique"]]], ["Conseils", [["Journal", "/blog"], ["Questions", "/faq"]]], ["Aide", [["Livraison", "/faq"], ["Retours", "/faq"], ["Contact", "/contact"]]]],
      scene: I_.gradinsRosee, mascotte: I_.gouttePoudree });
    return [G.racine(k, bandes)];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Cosmétique et parfumerie", target: 6, built: true,
  description: "Pieds inspirés de captures, angles droits, vraies illustrations vectorielles : nom monumental dessiné, appel centré avec curseurs et pictos, scènes illustrées avec mascotte.",
  models: [essenceMod, ambreMod, gestesMod, aureleMod, nerolilabMod, roseeMod],
};
