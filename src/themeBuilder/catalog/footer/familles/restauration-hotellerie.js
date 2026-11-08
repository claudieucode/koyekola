// Famille « Restauration et hôtellerie » — 6 modèles. Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md.
// Marques de démonstration FICTIVES (bistrot, hôtel, café-boulangerie, table gastronomique, maison d'hôtes, bar). Les liens https://exemple.fr/… sont des liens D'EXEMPLE à remplacer ;
// plats, tarifs, avis et mentions sont des EXEMPLES marqués comme tels ; adresse, téléphone et horaires viennent des Données de l'entreprise (bizhours, bizcontact, bizphone : aucune coordonnée inventée).
const { modele, identifiantModele, ambiance, C, L, T, Z, widget, accordeon } = require("../kit-conception");

const F = "restauration-hotellerie";
const E = "https://exemple.fr";
const ids = (n, s) => identifiantModele(F, n, s);

// ── Aides locales (le kit ne les propose pas) ───────────────────────────────────────────────────────────────────────────────────────
const liens = (list, size = "14px") => (k, env, center) => k.col(list.map((it) => { const [label, url] = it.split(">"); return k.LINK(label, url, { fontSize: size, fontWeight: "500", ...(center ? { textAlign: "center" } : {}) }); }), { gap: "8px", alignItems: center ? "center" : "flex-start" });
const grand = (texte, px = 44, mob = 32, extra = {}) => (k, env, center) => k.H(texte, "2", { fontSize: `${px}px`, lineHeight: 1.08, ...(center ? { textAlign: "center" } : {}), ...extra }, undefined, { fontSize: `${mob}px` });
const para = (texte, extra = {}) => (k, env, center) => k.T(`<p>${texte}</p>`, { color: k.S.mute, fontSize: "14px", ...(center ? { textAlign: "center", marginLeft: "auto", marginRight: "auto" } : {}), ...extra });
const deux = (a, b) => (k, env, center) => k.row([k.B(a[0], a[1]), k.B(b[0], b[1], "outline", b[2] ? { borderColor: k.S.fg, color: k.S.fg } : {})], { gap: "12px", alignItems: "center", ...(center ? { justifyContent: "center" } : {}) });
const avis = (citation, auteur) => (k, env, center) => k.col([
  k.T(`<p>« ${citation} »</p>`, { fontSize: "16px", lineHeight: 1.45, fontStyle: "italic", color: k.S.fg, fontFamily: k.S.head }),
  k.T(`<p>${auteur} (avis d'exemple)</p>`, { fontSize: "12px", color: k.S.mute }),
], { gap: "8px", ...(center ? { alignItems: "center", textAlign: "center" } : {}) });
// Ardoise : lignes « plat ........ prix » (EXEMPLES) comme sur une ardoise de bistrot
const ardoise = (titre, lignes) => (k, env, center) => k.col([
  k.T(`<p><strong>${titre}</strong></p>`, { fontSize: "13px", letterSpacing: "2px", textTransform: "uppercase", color: k.S.accent }),
  ...lignes.map(([plat, prix]) => k.row([k.T(`<p>${plat}</p>`, { fontSize: "16px", fontFamily: k.S.head, color: k.S.fg, flexGrow: 1 }), k.T(`<p>${prix}</p>`, { fontSize: "16px", fontFamily: k.S.head, color: k.S.accent, whiteSpace: "nowrap" })], { gap: "16px", alignItems: "baseline", justifyContent: "space-between", width: "100%", borderBottomStyle: "dashed", borderBottomWidth: "1px", borderColor: k.S.line, paddingBottom: "6px" })),
  k.T("<p><em>Plats et prix d'exemple, à remplacer par votre ardoise.</em></p>", { fontSize: "12px", color: k.S.mute }),
], { gap: "10px", width: "100%" });
// Index numéroté (carte des cocktails) : « 01  Libellé »
const indexNum = (list) => (k, env, center) => k.col(list.map((it, i) => { const [label, url] = it.split(">"); return k.row([
  k.T(`<p>${String(i + 1).padStart(2, "0")}</p>`, { fontSize: "12px", fontWeight: "700", color: k.S.accent, fontFamily: k.S.font, width: "28px" }),
  k.LINK(label, url, { fontSize: "18px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }),
], { gap: "8px", alignItems: "center" }); }), { gap: "4px", alignItems: "flex-start" });
const horaires = (titre = "-", px = 18) => widget("bizhours", { title: titre === "-" ? "" : titre, showOpenNow: true, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { desktop: { fontSize: `${px}px`, lineHeight: 1.5 } });
// Adresse et e-mail seulement (le téléphone est déjà affiché en grand ailleurs)
const adresse = (inline) => widget("bizcontact", { title: "", showName: false, showAddress: true, showPhone: false, showEmail: true, showIcons: true, layout: inline ? "inline" : "stack" }, { desktop: { fontSize: "14px" } });
// Ligne de liens centrée (liens d'exemple)
const ligneLiens = (list) => (k) => k.row(list.map((it) => { const [label, url] = it.split(">"); return k.LINK(label, url, { fontSize: "13px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" }); }), { gap: "0px", columnGap: "28px", rowGap: "4px", justifyContent: "center", flexWrap: "wrap" });
const telGrand = (px = 40, mob = 30) => widget("bizphone", { which: "1", prefix: "", showLabel: false, showIcon: false }, { desktop: { fontSize: `${px}px`, fontWeight: "800", lineHeight: 1.05 }, mobile: { fontSize: `${mob}px` } });

// ── Ambiances propres à la famille (contrastes AA vérifiés à la création) ────────────────────────────────────────────────────────────
const craie = ambiance({ key: "rest-craie-bistrot", label: "Ardoise et craie", humeur: "dark", fond: "#1f2b27", texte: "#f3eee2", accent: "#f2c14e", police: "font.karla", titres: "font.young-serif" });
const taupe = ambiance({ key: "rest-taupe-hotel", label: "Taupe et laiton", humeur: "edit", fond: "#f7f3ec", texte: "#2a2622", accent: "#7d5f2e", police: "font.jost", titres: "font.cormorant-garamond" });
const mie = ambiance({ key: "rest-mie-cafe", label: "Mie chaude et tomate", humeur: "soft", fond: "#fff4e0", texte: "#3a2414", accent: "#e4572e", police: "font.nunito", titres: "font.fredoka" });
const bordeaux = ambiance({ key: "rest-bordeaux-table", label: "Nappe blanche et bordeaux", humeur: "edit", fond: "#fcfbf8", texte: "#1c1417", accent: "#7a1f2e", police: "font.lato", titres: "font.playfair-display" });
const mousse = ambiance({ key: "rest-mousse-gite", label: "Mousse et pierre", humeur: "soft", fond: "#eef2e6", texte: "#2b3a22", accent: "#4f6f2e", police: "font.nunito-sans", titres: "font.young-serif" });
const nuit = ambiance({ key: "rest-nuit-bar", label: "Nuit et néon rose", humeur: "dark", fond: "#140b22", texte: "#f4eaff", accent: "#ff4fa8", police: "font.manrope", titres: "font.syne" });

module.exports = {
  key: "restauration-hotellerie",
  label: "Restauration et hôtellerie",
  description: "Horaires, réservation, carte, adresse, avis, accès.",
  target: 6,
  built: true,
  models: [
    modele({
      id: ids(1, "bistrot-ardoise-du-jour"),
      name: "Bistrot et ardoise du jour",
      family: F,
      description: "Pied chaleureux de bistrot : grand cadre d'ardoise avec plat du jour d'exemple et réservation, horaires d'ouverture, carte, adresse, puis ligne marque, avis et mentions sur les allergènes.",
      tags: ["bistrot", "ardoise", "horaires", "réservation", "carte", "allergènes"],
      identity: craie,
      structure: { rows: [
        C([
          [6, ardoise("Ce soir à l'ardoise", [["Velouté de potimarron", "7 €"], ["Souris d'agneau, purée maison", "19 €"], ["Tarte fine aux poires", "8 €"]]), "cta|Réserver une table|/contact"],
          [3, "head|Horaires d'ouverture", horaires("-", 15)],
          [3, "head|Nous trouver", "contact", "socials:instagram+facebook+website|plain"],
        ], { pad: "xl", frame: true, min: "230px", gap: "32px", rule: "double" }),
        C([
          [4, "logo:40", para("Chez Mado, bistrot de quartier (marque fictive de démonstration). Cuisine de saison, vins de copains.")],
          [2, "head|La carte", liens([`Entrées et plats>${E}/carte`, `Desserts>${E}/desserts`, `Vins>${E}/vins`, `Bons cadeaux>${E}/bons-cadeaux`])],
          [3, "head|Ils en parlent", avis("Une cuisine généreuse, un accueil comme à la maison.", "Camille")],
          [3, "head|Bon à savoir", para("Allergènes : la liste complète des plats est disponible sur demande auprès de l'équipe (mention d'exemple)."), "link|Voir les avis sur TripAdvisor|https://www.tripadvisor.fr/"],
        ], { pad: "md", min: "190px", gap: "32px" }),
        L(["copy"], ["legallinks", "top"], { pad: "sm", rule: "thin", bg: "alt" }),
      ] },
      widgets: ["text", "button", "bizhours", "bizcontact", "social", "sitelogo", "heading", "link", "copyright", "bizlegal", "backtotop"],
    }, F),

    modele({
      id: ids(2, "hotel-sobre-chambres-bons-cadeaux"),
      name: "Hôtel sobre, chambres et bons cadeaux",
      family: F,
      description: "Pied d'hôtel de luxe sobre : marque et coordonnées, quatre volets (accordéon sur mobile) pour chambres, séjours, services et infos pratiques, puis bande lettre d'information et bons cadeaux.",
      tags: ["hôtel", "luxe", "chambres", "accordéon", "newsletter", "bons cadeaux"],
      identity: taupe,
      structure: { rows: [
        C([
          [4, "logo:48", para("Hôtel des Carmes, maison de caractère (marque fictive de démonstration). Quarante-deux chambres, une table, un jardin."), "contact"],
          [2, accordeon([{ title: "Chambres", codes: [liens([`Toutes les chambres>${E}/chambres`, `Suites>${E}/suites`, `Tarifs et conditions>${E}/tarifs`, `Offres du moment>${E}/offres`])] }])],
          [3, accordeon([{ title: "Séjourner", codes: [liens([`Restaurant>${E}/restaurant`, `Spa et bien-être>${E}/spa`, `Séminaires>${E}/seminaires`, `Mariages>${E}/mariages`, `Accès et parking>${E}/acces`])] }])],
          [3, accordeon([{ title: "Arrivée et départ", codes: ["hours|-", liens([`Questions fréquentes>/faq`, `Nous écrire>/contact`])] }])],
        ], { pad: "xl", min: "170px", gap: "40px", rule: "thick" }),
        C([
          [6, "newsletter|Lettre de l'hôtel|Une à deux lettres par saison : événements, offres de séjour, nouvelles du jardin."],
          [3, "head|Offrir un séjour", para("Un bon cadeau valable un an, pour une nuit ou un dîner."), "cta2|Offrir un bon cadeau|/contact"],
          [3, "head|Nous suivre", "socials:instagram+facebook+youtube|plain", "link|Avis sur TripAdvisor|https://www.tripadvisor.fr/"],
        ], { pad: "lg", bg: "alt", min: "230px", gap: "40px" }),
        L(["copy"], ["legallinks"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["sitelogo", "text", "bizcontact", "bizhours", "link", "emailsubscribe", "heading", "button", "social", "copyright", "bizlegal"],
    }, F),

    modele({
      id: ids(3, "cafe-boulangerie-cartes-chaudes"),
      name: "Café-boulangerie en cartes chaudes",
      family: F,
      description: "Pied décontracté de café-boulangerie : bandeau tomate avec pain chaud et commande, trois cartes arrondies (horaires, adresse, à la carte et allergènes) et ligne réseaux avec logo.",
      tags: ["café", "boulangerie", "cartes", "décontracté", "commande"],
      identity: mie,
      structure: { rows: [
        L(["badge|Fournée de 7 h (exemple)", grand("Du pain chaud, des cafés doux.", 40, 28)], ["cta2|Commander pour demain|/contact"], { bg: "accent", pad: "lg", rule: "none" }),
        C([
          [4, "head|Quand passer ?", horaires("-", 15)],
          [4, "head|Où nous trouver ?", "contact", "link|Itinéraire sur la carte|https://www.openstreetmap.org/"],
          [4, "head|À la carte", liens([`Pains et viennoiseries>${E}/boulangerie`, `Boissons chaudes>${E}/boissons`, `Déjeuners sur le pouce>${E}/dejeuners`, `Gâteaux sur commande>${E}/gateaux`]), para("Allergènes : gluten, œufs, lait, fruits à coque présents en atelier (mention d'exemple).", { fontSize: "12px" })],
        ], { pad: "lg", cards: true, min: "250px", gap: "20px", rule: "none" }),
        T(["socials:instagram+facebook+tiktok|sq"], ["logo:44"], ["link|Une idée de cadeau ? Bons d'achat|/contact"], { pad: "md", rule: "none" }),
        L(["copy"], ["legallinks"], { pad: "sm", rule: "thin", bg: "alt" }),
      ] },
      widgets: ["text", "heading", "button", "bizhours", "bizcontact", "link", "social", "sitelogo", "copyright", "bizlegal"],
    }, F),

    modele({
      id: ids(4, "table-gastronomique-centree"),
      name: "Table gastronomique centrée",
      family: F,
      description: "Pied de restaurant gastronomique : pile centrée étroite avec marque, menu du pied, réservation, téléphone, horaires et adresse, filet double et mentions discrètes sur les régimes et allergènes.",
      tags: ["gastronomique", "centré", "réservation", "élégant", "horaires"],
      identity: bordeaux,
      structure: { rows: [
        Z(["logo:56", para("RESTAURANT GASTRONOMIQUE · DEUX SERVICES PAR JOUR (EXEMPLE)", { fontSize: "11px", letterSpacing: "3px" }), ligneLiens([`La carte>${E}/carte`, `Menu dégustation>${E}/menu-degustation`, `Cave>${E}/cave`, `Bons cadeaux>${E}/bons-cadeaux`]), "div", "cta|Réserver une table|/contact", telGrand(32, 26), "hours|-", adresse(true)], { max: "760px", pad: "xl", gap: "20px", rule: "double" }),
        Z(["socials:instagram+facebook|plain", para("Menu dégustation, accords mets et vins et bons cadeaux sur demande. Allergènes et régimes particuliers : prévenez-nous à la réservation.", { fontSize: "12px", maxWidth: "520px" })], { max: "760px", pad: "md", gap: "14px", bg: "alt", rule: "thin" }),
        Z(["copy:c", "legallinks"], { pad: "sm", gap: "8px", rule: "none" }),
      ] },
      widgets: ["sitelogo", "text", "link", "divider", "button", "bizphone", "bizhours", "bizcontact", "social", "copyright", "bizlegal"],
    }, F),

    modele({
      id: ids(5, "maison-hotes-carte-horaires"),
      name: "Maison d'hôtes, avis et volets pratiques",
      family: F,
      description: "Pied de gîte ou maison d'hôtes : grande invitation à séjourner avec boutons, avis d'exemple, puis quatre volets (chambres et tarifs, accueil et horaires, venir, bon à savoir) repliables sur mobile.",
      tags: ["gîte", "maison d'hôtes", "chambres", "tarifs", "accordéon", "avis"],
      identity: mousse,
      structure: { rows: [
        C([
          [7, grand("Une chambre, un feu de cheminée, un petit-déjeuner qui compte.", 38, 28), deux(["Voir les chambres", `${E}/chambres`], ["Écrire à Suzanne", "/contact", true])],
          [5, avis("Un week-end hors du temps, des hôtes aux petits soins.", "Hélène et Marc"), "link|Lire tous les avis sur TripAdvisor|https://www.tripadvisor.fr/"],
        ], { pad: "xl", min: "270px", gap: "48px", bg: "alt", rule: "none" }),
        C([
          [3, accordeon([{ title: "Chambres et tarifs", codes: [liens([`Les cinq chambres>${E}/chambres`, `Tarifs à la nuit>${E}/tarifs`, `Table d'hôtes>${E}/table-d-hotes`, `Bons cadeaux>${E}/bons-cadeaux`])] }])],
          [3, accordeon([{ title: "Accueil et horaires", codes: ["hours|Accueil des voyageurs", para("Arrivée à partir de 16 h, départ avant 11 h (horaires d'exemple).", { fontSize: "13px" })] }])],
          [3, accordeon([{ title: "Venir", codes: ["contact", "link|Itinéraire et parking|https://www.openstreetmap.org/"] }])],
          [3, accordeon([{ title: "Bon à savoir", codes: ["toggle|Animaux acceptés ?|Selon la chambre : précisez-le à la réservation (réponse d'exemple).", "toggle|Allergies et régimes|Prévenez-nous à l'avance pour adapter la table d'hôtes (réponse d'exemple)."] }])],
        ], { pad: "lg", min: "190px", gap: "28px", rule: "thin" }),
        T(["logo:36"], ["socials:facebook+instagram+website|plain"], ["copy"], { pad: "sm", rule: "thin" }),
        Z(["legallinks"], { pad: "xs", rule: "none" }),
      ] },
      widgets: ["heading", "button", "text", "link", "bizhours", "bizcontact", "toggle", "sitelogo", "social", "copyright", "bizlegal"],
    }, F),

    modele({
      id: ids(6, "bar-nocturne-ouvert-ce-soir"),
      name: "Bar nocturne, ouvert ce soir",
      family: F,
      description: "Pied de bar de nuit : énorme « Ouvert ce soir » avec horaires en direct, index numéroté des cocktails, bloc réservation et téléphone, réseaux carrés et message de modération.",
      tags: ["bar", "nocturne", "cocktails", "horaires", "réservation", "néon"],
      identity: nuit,
      structure: { rows: [
        C([
          [6, "badge|Happy hour 18 h à 20 h (exemple)", grand("OUVERT CE SOIR.", 76, 44, { textTransform: "uppercase" }), horaires("-", 20)],
          [3, "head|La carte", indexNum([`Cocktails signature>${E}/cocktails`, `Bières locales>${E}/bieres`, `Planches à partager>${E}/planches`, `Sans alcool>${E}/sans-alcool`]), para("Carte des cocktails de saison, changée chaque mois (exemple).", { fontSize: "13px" }), "link|Bons cadeaux|/contact"],
          [3, "head|Réserver", telGrand(30, 26), "cta|Réserver une table|/contact", adresse(false)],
        ], { pad: "xl", min: "240px", gap: "36px", rule: "accent" }),
        T(["socials:instagram+tiktok+facebook|sq"], [para("L'abus d'alcool est dangereux pour la santé. À consommer avec modération.", { fontSize: "12px" })], ["link|Privatiser le bar|/contact"], { pad: "md", rule: "thin", bg: "alt" }),
        L(["logo:32", "copy"], ["legallinks"], { pad: "sm", rule: "none" }),
      ] },
      widgets: ["text", "heading", "bizhours", "link", "bizphone", "button", "bizcontact", "social", "sitelogo", "copyright", "bizlegal"],
    }, F),
  ],
};
