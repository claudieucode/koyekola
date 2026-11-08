// Famille « E-commerce » — 8 modèles de pieds de boutique en ligne (voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md).
// Chaque modèle a sa propre structure ET sa propre ambiance (couleurs, polices, formes) : méga-pied de grande enseigne, maison de luxe sobre, place de marché, boutique de niche chaleureuse,
// pied « confiance » (paiement, livraison, service client), pied mobile-first, grande newsletter, service client en deux volets.
// Les catégories (shopcats), liens de boutique (shoplinks), paiements (pay), livraison (deliv), coordonnées et pages légales sont LUS dans le site : aucune coordonnée inventée.
// Les phrases d'engagement sont des textes d'exemple sans chiffre ni promesse précise : à adapter par la boutique.
const { modele, identifiantModele, C, L, T, Z, A, ambiance, accordeon } = require("../kit-conception");

const F = "ecommerce";
const id = (n, slug) => identifiantModele(F, n, slug);
// Lien simple : lien("Libellé", "/page") → code d'élément
const lien = (libelle, url) => `link|${libelle}|${url}`;
// Deux boutons côte à côte (plein + contour) : petit élément local, le kit n'en propose pas
const boutons = (a, b) => (k) => k.row([k.B(a[0], a[1]), k.B(b[0], b[1], "outline")], { gap: "12px" });

// ── Ambiances propres à la famille (fond, texte, accent choisis ; le reste est calculé et contrôlé AA) ──────────────────────────────────
const enseigne = ambiance({ key: "ec-enseigne", label: "Enseigne rouge et marine", humeur: "light", fond: "#ffffff", texte: "#14213d", accent: "#c1121f", police: "font.inter", titres: "font.plus-jakarta-sans", ink: "#14213d" });
const maison = ambiance({ key: "ec-maison", label: "Maison sobre", humeur: "edit", fond: "#f7f4ef", texte: "#1d1a16", accent: "#6b4f2a", police: "font.jost", titres: "font.cormorant-garamond" });
const place = ambiance({ key: "ec-place", label: "Place de marché", humeur: "light", fond: "#f4f6f8", texte: "#1f2933", accent: "#0b5cad", police: "font.public-sans", titres: "font.public-sans", ink: "#102a43" });
const atelier = ambiance({ key: "ec-atelier", label: "Atelier chaleureux", humeur: "soft", fond: "#fbf1e4", texte: "#3d2314", accent: "#b4451f", police: "font.nunito", titres: "font.fraunces" });
const confiance = ambiance({ key: "ec-confiance", label: "Confiance vert profond", humeur: "light", fond: "#f2f9f6", texte: "#0f2e26", accent: "#0f766e", police: "font.red-hat-text", titres: "font.red-hat-display", ink: "#0b2a23" });
const mobile = ambiance({ key: "ec-mobile", label: "Nuit et cyan", humeur: "dark", fond: "#12151c", texte: "#f2f5f9", accent: "#22d3ee", police: "font.manrope", titres: "font.sora" });
const club = ambiance({ key: "ec-club", label: "Club violet et soleil", humeur: "brand", fond: "#4c1d95", texte: "#ffffff", accent: "#fde047", police: "font.bricolage-grotesque", titres: "font.bricolage-grotesque", ink: "#2e1065" });
const aide = ambiance({ key: "ec-aide", label: "Béton et orange", humeur: "light", fond: "#e9edf1", texte: "#0b1b2b", accent: "#b3360a", police: "font.barlow", titres: "font.barlow-condensed", ink: "#0b1b2b" });

const models = [
  // 01 ─ Grande enseigne : bandeau d'engagements, marque + 4 volets (accordéon mobile), bande sombre newsletter / paiements, mentions
  modele({
    id: id(1, "mega-enseigne"),
    name: "Méga-pied de grande enseigne",
    family: F,
    description: "Bandeau d'engagements, grande zone de marque et quatre volets denses (catégories, service client, compte, informations) repliables sur mobile, puis bande sombre avec newsletter, paiements et réseaux.",
    tags: ["boutique", "grande enseigne", "catégories", "accordéon mobile", "newsletter", "paiement"],
    identity: enseigne,
    structure: { rows: [
      C([[3, "head|Paiement sécurisé", "text|Réglez avec le moyen de paiement de votre choix."], [3, "head|Livraison suivie", "text|Suivez votre colis de la préparation à la porte."], [3, "head|Retours simplifiés", "text|Un changement d'avis ? Retournez votre achat facilement."], [3, "head|Service client", "text|Une équipe à votre écoute pour vous conseiller."]],
        { bg: "alt", pad: "md", rule: "none", min: "220px", mobile: { gap: "12px" } }),
      C([[3, "logo:48", "about|Votre boutique en ligne : des produits sélectionnés, une livraison soignée et un service client disponible.", "socials:facebook+instagram+youtube+tiktok"],
        [9, accordeon([
          { title: "Catégories", codes: ["shopcats:8", lien("Tous les produits", "/boutique")] },
          { title: "Service client", codes: [lien("Questions fréquentes", "/faq"), lien("Nous contacter", "/contact"), "shoplinks"] },
          { title: "Mon compte", codes: [lien("Connexion", "/connexion"), lien("Créer un compte", "/inscription"), lien("Mon panier", "/boutique/panier"), lien("Mes souhaits", "/boutique/souhaits")] },
          { title: "Informations", codes: ["menu", "legallinks:stack"] },
        ], { min: "120px", gap: "28px" })]],
        { pad: "xl", min: "260px", tablet: { gap: "32px" }, mobile: { gap: "28px" } }),
      C([[6, "newsletter|Les bons plans en avant-première|Nouveautés et offres de la boutique, directement dans votre boîte mail."], [6, "text|Un règlement sécurisé à chaque étape de la commande.", "pay|Moyens de paiement acceptés"]], { bg: "ink", pad: "lg", rule: "none", min: "280px", mobile: { gap: "24px" } }),
      L(["copy"], ["top"], { bg: "ink", pad: "sm", rule: "thin" }),
    ] },
    widgets: ["sitelogo", "shopcategories", "shoplinks", "link", "emailsubscribe", "bizpayments", "social", "bizlegal", "menu", "copyright", "backtotop"],
  }, F),

  // 02 ─ Maison de luxe : trois zones d'en-tête, newsletter centrée étroite, quatre colonnes aérées, ligne basse en trois zones
  modele({
    id: id(2, "maison-luxe-sobre"),
    name: "Maison de luxe sobre",
    family: F,
    description: "Pied discret et très aéré : menu en capitales, logo central, lettre d'information centrée, quatre colonnes fines (boutique, clientèle, espace et paiements, contact) et ligne basse. Serif élégant, angles droits.",
    tags: ["luxe", "sobre", "newsletter", "capitales", "contact", "paiement"],
    identity: maison,
    structure: { rows: [
      T(["menuh:caps"], ["logo:56"], ["socials:instagram+pinterest+youtube|plain"], { pad: "lg", rule: "none", mobile: { gap: "20px" } }),
      Z(["H|La lettre de la maison|2", "newsletter|Recevez nos nouvelles pièces|Une lettre rare, sans bruit : nouveautés et coulisses de la maison."], { bg: "alt", pad: "xl", max: "760px", gap: "20px", rule: "none" }),
      C([[3, "head|La boutique", "shopcats:5", lien("Tout voir", "/boutique")], [3, "head|Clientèle", lien("Questions fréquentes", "/faq"), lien("Nous contacter", "/contact"), "shoplinks"], [3, "head|Mon espace", lien("Connexion", "/connexion"), lien("Mon panier", "/boutique/panier"), lien("Mes souhaits", "/boutique/souhaits"), "pay|Paiement accepté"], [3, "head|Boutique et contact", "contact", "hours|-"]],
        { pad: "xl", rule: "thin", min: "200px", tablet: { gap: "40px" }, mobile: { gap: "28px" } }),
      L(["copy"], ["legallinks"], { pad: "sm", rule: "thin", mobile: { gap: "16px" } }),
    ] },
    widgets: ["menu", "sitelogo", "social", "emailsubscribe", "shopcategories", "shoplinks", "bizcontact", "bizhours", "bizpayments", "bizlegal", "copyright"],
  }, F),

  // 03 ─ Place de marché : appel vendeur, six colonnes denses avec recherche, bande basse sombre
  modele({
    id: id(3, "place-de-marche"),
    name: "Pied de place de marché",
    family: F,
    description: "Pour une marketplace : bandeau d'appel aux vendeurs, six colonnes denses (acheter, vendre, aide, compte, découvrir, recherche et réseaux) et barre basse avec paiements et mentions.",
    tags: ["marketplace", "vendeurs", "recherche", "dense", "catégories"],
    identity: place,
    structure: { rows: [
      L(["text|Vous vendez des produits ? Rejoignez la place de marché : votre vitrine en quelques minutes (texte d'exemple)."], ["cta|Devenir vendeur|/inscription"], { bg: "accent", pad: "sm", rule: "none", mobile: { gap: "12px" } }),
      C([[2, "head|Acheter", "shopcats:7"], [2, "head|Vendre", lien("Devenir vendeur", "/inscription"), lien("Espace vendeur", "/connexion"), lien("Aide aux vendeurs", "/faq")],
        [2, "head|Aide", lien("Questions fréquentes", "/faq"), lien("Nous contacter", "/contact"), "shoplinks"], [2, "head|Mon compte", lien("Connexion", "/connexion"), lien("Créer un compte", "/inscription"), lien("Mon panier", "/boutique/panier"), lien("Mes souhaits", "/boutique/souhaits")],
        [2, "head|Découvrir", lien("Le blog", "/blog"), lien("Le catalogue", "/catalogue"), "menu"], [2, "head|Rechercher", "search:catalogue", "socials:facebook+instagram+youtube+x|sq", "pay|Paiement accepté"]],
        { pad: "lg", rule: "none", min: "150px", tablet: { gap: "28px" }, mobile: { gap: "24px" } }),
      L(["copy"], ["legallinks"], { bg: "ink", pad: "sm", rule: "none", mobile: { gap: "16px" } }),
    ] },
    widgets: ["bizlegal", "shopcategories", "shoplinks", "link", "button", "search", "social", "menu", "bizpayments", "copyright"],
  }, F),

  // 04 ─ Boutique de niche : trois cartes arrondies (histoire, adresse, lettre), menu + paiements, ligne basse
  modele({
    id: id(4, "boutique-de-niche"),
    name: "Boutique de niche chaleureuse",
    family: F,
    description: "Trois grandes cartes arrondies sur fond crème : l'histoire de la boutique et ses réseaux, l'adresse et les horaires, la lettre d'information. Dessous, menu et retour en haut, puis mentions. Ton artisan.",
    tags: ["artisan", "niche", "cartes", "horaires", "newsletter"],
    identity: atelier,
    structure: { rows: [
      C([[4, "logo:48", "text|Une petite boutique, des produits choisis avec soin et préparés à la main. Merci de votre confiance.", "socials:instagram+pinterest+facebook", "pay|Paiement accepté"], [4, "head|Passez nous voir", "contact", "hours"], [4, "newsletter|La lettre de l'atelier|Nouveautés, coulisses et petites attentions, une fois de temps en temps.", "deliv|Livraison et retours"]],
        { cards: true, pad: "xl", rule: "none", min: "260px", tablet: { gap: "20px" }, mobile: { gap: "16px" } }),
      L(["menuh"], ["top"], { pad: "md", rule: "none", mobile: { gap: "16px" } }),
      L(["copy"], ["legallinks"], { bg: "alt", pad: "sm", rule: "none", mobile: { gap: "12px" } }),
    ] },
    widgets: ["sitelogo", "text", "social", "bizcontact", "bizhours", "emailsubscribe", "menu", "link", "bizpayments", "bizlegal", "backtotop", "copyright"],
  }, F),

  // 05 ─ Confiance : trois cartes paiement / livraison / service client, puis ligne marque-menu-réseaux, puis mentions
  modele({
    id: id(5, "confiance-paiement-livraison"),
    name: "Pied confiance : paiement et livraison",
    family: F,
    description: "Rassure avant tout : trois cartes en tête (moyens de paiement, livraison et retours, service client avec téléphone, e-mail et bouton), puis une ligne logo-menu-réseaux et les mentions sur fond foncé.",
    tags: ["confiance", "paiement", "livraison", "retours", "service client"],
    identity: confiance,
    structure: { rows: [
      C([[4, "head|Paiement sécurisé", "pay|Moyens de paiement acceptés", "text|Vos règlements restent protégés à chaque étape de la commande."], [4, "head|Livraison et retours", "deliv|Nos conditions", "text|Suivez l'avancée de votre colis depuis votre espace."], [4, "head|Service client", "phone", "email", "cta|Nous contacter|/contact"]],
        { cards: true, pad: "xl", rule: "none", min: "260px", tablet: { gap: "20px" }, mobile: { gap: "16px" } }),
      T(["logo:40"], ["menuh"], ["socials:facebook+instagram+whatsapp|sq"], { bg: "ink", pad: "md", rule: "none", mobile: { gap: "20px" } }),
      L(["copy"], ["legallinks"], { bg: "ink", pad: "sm", rule: "thin", mobile: { gap: "12px" } }),
    ] },
    widgets: ["bizpayments", "bizdelivery", "bizphone", "bizemail", "button", "sitelogo", "menu", "social", "bizlegal", "copyright"],
  }, F),

  // 06 ─ Mobile-first : recherche + suivi de commande, trois volets accordéon, pile centrée avec réseaux, paiements et mentions repliables
  modele({
    id: id(6, "mobile-first"),
    name: "Pied boutique pensé pour le mobile",
    family: F,
    description: "Nuit et cyan : recherche et suivi de commande en haut, trois volets qui se replient sur mobile (catégories, aide, compte), puis pile centrée avec réseaux, paiements, mentions et retour en haut.",
    tags: ["mobile", "accordéon", "recherche", "suivi de commande", "sombre"],
    identity: mobile,
    structure: { rows: [
      C([[6, "H|Une question sur votre commande ?|2", "text|Suivez votre colis ou retrouvez vos achats en un geste.", "cta|Mon compte et mes commandes|/boutique/compte"], [6, "head|Chercher un produit", "search:catalogue", "shoplinks"]],
        { pad: "lg", rule: "none", min: "280px", mobile: { gap: "24px" } }),
      A([["Catégories", "shopcats:6", lien("Tous les produits", "/boutique")], ["Aide et livraison", lien("Questions fréquentes", "/faq"), lien("Nous contacter", "/contact"), "deliv|Livraison et retours"], ["Mon espace", lien("Connexion", "/connexion"), lien("Mon panier", "/boutique/panier"), lien("Mes souhaits", "/boutique/souhaits")]],
        { bg: "alt", pad: "lg", rule: "none", min: "200px", mobile: { gap: "4px" } }),
      Z(["socials:instagram+tiktok+youtube|big", "pay|Paiement accepté", "legallinks", "copy:c", "top"], { pad: "lg", gap: "20px", rule: "none" }),
    ] },
    widgets: ["heading", "text", "button", "search", "shoplinks", "shopcategories", "link", "bizdelivery", "social", "bizpayments", "bizlegal", "copyright", "backtotop"],
  }, F),

  // 07 ─ Club : énorme bande newsletter sur accent, quatre colonnes, ligne basse
  modele({
    id: id(7, "club-newsletter"),
    name: "Grande newsletter du club",
    family: F,
    description: "Une immense bande jaune pour inviter au club (titre géant et inscription par e-mail), puis marque et réseaux en grand, trois colonnes de liens et mentions sur violet profond. Ton jeune et vif.",
    tags: ["newsletter", "club", "réseaux", "jeune", "invitation"],
    identity: club,
    structure: { rows: [
      C([[7, "H|Rejoignez le club|1", "text|Invitations, nouveautés et petites surprises : inscrivez-vous, c'est gratuit (texte d'exemple)."], [5, "newsletter|Votre adresse e-mail|Vous pouvez vous désinscrire à tout moment."]],
        { bg: "accent", pad: "xl", rule: "none", min: "280px", tablet: { gap: "28px" }, mobile: { gap: "24px" } }),
      C([[4, "logo:48", "about|Une boutique en ligne qui aime les belles choses et les clients heureux.", "socials:instagram+tiktok+youtube+pinterest|big"], [2, "head|Boutique", "shopcats:6"], [2, "head|Aide", lien("Questions fréquentes", "/faq"), lien("Nous contacter", "/contact"), "shoplinks"], [2, "head|Compte", lien("Connexion", "/connexion"), lien("Créer un compte", "/inscription"), lien("Mon panier", "/boutique/panier")]],
        { pad: "xl", rule: "none", min: "160px", tablet: { gap: "32px" }, mobile: { gap: "28px" } }),
      L(["copy"], ["legallinks"], { pad: "sm", rule: "thin", mobile: { gap: "12px" } }),
    ] },
    widgets: ["heading", "text", "emailsubscribe", "sitelogo", "social", "shopcategories", "shoplinks", "link", "bizlegal", "copyright"],
  }, F),

  // 08 ─ Service client : grand volet d'aide à gauche, trois colonnes à droite, filet épais, pile centrée basse
  modele({
    id: id(8, "service-client-en-deux-volets"),
    name: "Service client en deux volets",
    family: F,
    description: "À gauche, un grand volet d'aide (titre, boutons contact et FAQ, téléphone, e-mail, horaires) ; à droite, catégories, liens utiles et suivi de commande avec paiements. Filet épais et pile centrée en bas. Typo condensée.",
    tags: ["service client", "aide", "contact", "asymétrique", "livraison"],
    identity: aide,
    structure: { rows: [
      C([[5, "H|Besoin d'aide ?|2", "text|Une question sur un produit, une livraison ou un retour ? Écrivez-nous ou consultez les réponses.", boutons(["Nous contacter", "/contact"], ["Questions fréquentes", "/faq"]), "phone", "email"],
        [2, "head|Boutique", "shopcats:6", lien("Tous les produits", "/boutique")], [2, "head|Liens utiles", lien("Mon panier", "/boutique/panier"), lien("Mes souhaits", "/boutique/souhaits"), lien("Mon compte", "/boutique/compte")], [3, "head|Commande et paiement", "shoplinks", "pay|Paiement accepté", "hours"]],
        { pad: "xl", rule: "thick", min: "170px", tablet: { gap: "36px" }, mobile: { gap: "28px" } }),
      Z(["legallinks", "copy:c"], { bg: "alt", pad: "md", gap: "10px", rule: "none" }),
    ] },
    widgets: ["heading", "text", "button", "bizphone", "bizemail", "bizhours", "shopcategories", "link", "shoplinks", "bizpayments", "bizlegal", "copyright"],
  }, F),
];

module.exports = {
  key: "ecommerce",
  label: "E-commerce",
  description: "Boutiques : catégories de produits, service client, suivi de commande, moyens de paiement, livraison et retours, newsletter avec offre.",
  target: 8,
  built: true,
  models,
};
