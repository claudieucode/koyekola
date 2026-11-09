// ANCIEN catalogue « Pied de page » (avant la refonte par familles métier ; voir ../footer.js) : 100 COMPOSITIONS distinctes (10 familles × 10), pas un croisement mise en page × couleur. Chaque modèle fixe sa propre identité visuelle (20 par identité).
// Une composition = des RANGÉES (bandes pleine largeur) empilées dans UN conteneur ; une rangée est de l'un de ces quatre types :
//   C(colonnes, o)   colonnes Flexbox qui passent à la ligne (largeur minimale, poids relatif en 1er élément du tableau) — le standard du tutoriel Elementor « pied avec conteneurs » ;
//   L(gauche, droite, o)  une ligne à deux zones (« space-between ») ;  T(g, c, d, o)  trois zones, le centre étant vraiment centré ;  Z(éléments, o)  pile centrée.
// Les éléments sont des widgets natifs du Page Builder : logo et titre du site, menus AFFECTÉS (emplacements « Pied de page » et « En-tête » : aucun lien de navigation inventé), listes dynamiques
// (catégories, articles, formations), recherche, compte, mini-panier, formulaire d'inscription RÉEL du site, réseaux, carte, boutons, copyright.
// Chantier F : les modèles lisent les DONNÉES D'ENTREPRISE du site avec les widgets « Pied de page » (coordonnées, téléphone, e-mail, horaires, informations légales, paiements, livraison, retour en haut,
// copyright au nom de l'entreprise) au lieu de textes figés. Ces widgets n'affichent RIEN tant que le site n'a pas renseigné ses données : chaque colonne ou rangée qui en contient garde donc toujours
// un élément permanent (titre, bouton ou lien) pour ne jamais laisser un trou. Aucune donnée d'exemple n'est écrite dans un modèle.
// États au survol et au focus (modèle de données `states` du moteur) et zones cliquables d'au moins 44 px sur mobile : voir finishNode().
// Responsive : aucune position absolue ; les colonnes ont une largeur minimale et passent à la ligne ; les lignes se replient en pile sous 640 px.
// Voir docs/theme-builder/kolakisa-footer-library.md pour la grammaire des rangées et l'ajout d'un modèle.
const { IDENT, IDENT2, MOODS } = require("../identities");

const FAMILIES = [
  { key: "minimal", label: "Minimal et compact" },
  { key: "colonnes", label: "Multi-colonnes" },
  { key: "newsletter", label: "Newsletter et abonnement" },
  { key: "contact", label: "Coordonnées et carte" },
  { key: "reseaux", label: "Réseaux sociaux et légal" },
  { key: "boutique", label: "Boutique et e-commerce" },
  { key: "editorial", label: "Éditorial et magazine" },
  { key: "entreprise", label: "Entreprise et SaaS" },
  { key: "creatif", label: "Créatif et portfolio" },
  { key: "centre", label: "Centré et navigation horizontale" },
];
const SKIN_ORDER = ["clair", "marque", "nuit", "editorial", "doux"];
const { tone, wrap, C, L, T, Z } = require("./moteur"); // moteur partagé (extrait de ce fichier sans changement de comportement)
// ── Définition d'un modèle ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const BAR = L(["copy"], ["legal"], { pad: "sm" });
const BARTOP = L(["copy"], ["legal", "top"], { pad: "sm" }); // barre du bas avec lien « Retour en haut »
const NAV = ["head|Navigation", "menu"], EXP = ["head|Explorer", "hmenu"];
// Colonne de coordonnées : le titre et le lien vers la page de contact restent toujours ; adresse, téléphone et e-mail s'y ajoutent dès que le site les a renseignés
const CONTACT = ["head|Contact", "contact", "link|Nous écrire|/contact"];

const LAYOUTS = [];
const fam = (family, models) => {
  const f = FAMILIES.findIndex((x) => x.key === family);
  models.forEach(([key, label, tags, desc, rows], i) => {
    const skin = SKIN_ORDER[(i + f) % 5];
    LAYOUTS.push({ key, family, skin, label, tags, desc, build: (k, env) => [wrap(k.S, rows, env)] });
  });
};
fam("minimal", [
  ["ligne-copyright-menu", "Une ligne", ["minimaliste", "sobre", "copyright"], "Copyright à gauche, navigation du pied de page à droite, sur une seule ligne.", [L(["copy"], ["menuh"], { pad: "sm" })]],
  ["logo-et-copyright", "Logo et copyright", ["minimaliste", "logo", "copyright"], "Petit logo à gauche, copyright à droite.", [L(["logo:32"], ["copy"], { pad: "sm" })]],
  ["copyright-centre-seul", "Copyright seul, centré", ["minimaliste", "copyright", "centré"], "Uniquement la ligne de copyright, centrée.", [Z(["copy:c"], { pad: "sm" })]],
  ["copyright-et-legal", "Copyright et liens légaux", ["légal", "cookies", "compact"], "Copyright à gauche, liens cookies et contact à droite.", [L(["copy"], ["legal"], { pad: "sm" })]],
  ["logo-menu-reseaux", "Logo, menu et réseaux", ["compact", "réseaux", "navigation"], "Logo et navigation à gauche, icônes de réseaux sans fond à droite, copyright dessous.", [L(["logo:32", "menuh"], ["social:plain"], { pad: "sm" }), L(["copy"], [], { pad: "xs", rule: "thin" })]],
  ["titre-copyright-reseaux", "Titre, copyright et réseaux", ["compact", "titre du site", "réseaux"], "Titre du site et copyright à gauche, réseaux à droite.", [L(["title:18", "copy"], ["social:plain"], { pad: "sm" })]],
  ["menu-puis-copyright", "Menu puis copyright", ["empilé", "centré", "navigation"], "Navigation centrée, copyright centré dessous.", [Z(["menuh"], { pad: "sm", gap: "10px" }), Z(["copy:c"], { pad: "xs" })]],
  ["filet-menu-legal", "Filet, menu et mentions", ["filet", "légal", "navigation"], "Navigation et liens légaux sous un filet fin, copyright en dessous.", [L(["menuh"], ["legal"], { rule: "thin", pad: "sm" }), L(["copy"], [], { pad: "xs" })]],
  ["copyright-et-bouton", "Copyright et bouton de contact", ["bouton", "contact", "compact"], "Copyright à gauche, bouton « Nous contacter » à droite.", [L(["copy"], ["cta2|Nous contacter|/contact"], { pad: "sm" })]],
  ["trois-zones", "Trois zones", ["compact", "navigation", "titre du site"], "Titre à gauche, navigation au centre, copyright à droite.", [T(["title:18"], ["menuh"], ["copy"], { pad: "sm" })]],
]);

fam("colonnes", [
  ["trois-colonnes-marque", "Marque, navigation et contact", ["colonnes", "classique", "contact"], "Grande colonne de marque, navigation, coordonnées ; copyright et liens légaux sous un filet.", [C([[2, "logo", "about"], NAV, CONTACT]), { ...BAR, rule: "thin" }]],
  ["quatre-colonnes-liens", "Quatre colonnes de liens", ["colonnes", "complet", "catégories"], "Marque, navigation du pied, navigation du site et catégories.", [C([[2, "logo", "about"], NAV, EXP, ["head|Catégories", "cats"]]), BAR]],
  ["cinq-colonnes-grand-site", "Cinq colonnes pour un grand site", ["colonnes", "grand site", "articles récents"], "Marque, deux navigations, articles récents et réseaux.", [C([[2, "title:22", "about"], NAV, EXP, ["head|Récents", "recent:3"], ["head|Suivez-nous", "social"]]), BAR]],
  ["deux-colonnes-asymetriques", "Deux colonnes asymétriques", ["asymétrique", "marque", "réseaux"], "Large colonne de marque avec réseaux, étroite colonne de liens.", [C([[3, "logo", "about", "social"], [2, "head|Liens utiles", "menu"]]), L(["copy"], [], { pad: "xs" })]],
  ["trois-navigations", "Trois navigations", ["navigation", "aide", "multi-liens"], "Navigation du pied, navigation du site et liens d'aide en trois colonnes égales.", [C([NAV, EXP, ["head|Aide", "links|FAQ>/faq|Nous contacter>/contact|Cookies>/cookies"]]), Z(["copy:c"], { pad: "sm" })]],
  ["colonnes-et-appel", "Colonnes et appel à l'action", ["conversion", "contact", "bouton"], "Marque, navigation et un encart « Une question ? » avec bouton.", [C([[2, "logo", "about"], NAV, ["head|Une question ?", "text|Dites à vos visiteurs comment vous joindre.", "cta|Nous contacter|/contact"]]), BAR]],
  ["colonnes-centrees", "Colonnes centrées", ["centré", "colonnes", "élégant"], "Trois colonnes dont le contenu est centré.", [C([["logo", "about"], NAV, CONTACT], { center: true }), Z(["copy:c"], { pad: "sm" })]],
  ["quatre-colonnes-sans-marque", "Quatre colonnes sans marque", ["colonnes", "contenus", "dense"], "Navigations, catégories et articles récents ; copyright centré.", [C([NAV, EXP, ["head|Catégories", "cats"], ["head|Récents", "recent:3"]]), Z(["copy:c"], { pad: "sm" })]],
  ["colonnes-et-barre-alternee", "Colonnes et barre alternée", ["barre", "fond alterné", "contact"], "Trois colonnes, puis barre de copyright sur fond alterné.", [C([[2, "logo", "about"], NAV, CONTACT]), L(["copy"], ["legal"], { bg: "alt", pad: "sm" })]],
  ["colonnes-en-cartes", "Colonnes en cartes", ["cartes", "relief", "colonnes"], "Trois cartes : marque, navigation, coordonnées.", [C([["logo", "about"], NAV, CONTACT], { cards: true, pad: "lg" }), Z(["copy:c"], { pad: "sm" })]],
]);

fam("newsletter", [
  ["newsletter-carte-centree", "Abonnement en carte centrée", ["newsletter", "carte", "centré"], "Bloc d'abonnement mis en avant au centre, copyright dessous.", [Z(["news|Recevez nos nouveautés|Une lettre de temps en temps, sans spam.", "copy:c"], { pad: "lg", gap: "26px" })]],
  ["newsletter-et-menus", "Abonnement et deux menus", ["newsletter", "navigation", "complet"], "Grande colonne d'abonnement, navigation du pied et navigation du site.", [C([[2, "news|Restez informé|Décrivez ici ce que recevront vos abonnés."], NAV, EXP]), BARTOP]],
  ["newsletter-bandeau-couleur", "Bandeau d'abonnement coloré", ["bandeau", "newsletter", "accent"], "Bandeau d'abonnement de couleur au-dessus d'un pied compact.", [Z(["news|Ne manquez rien|Inscrivez-vous pour recevoir les prochaines nouvelles."], { bg: "accent", pad: "lg" }), L(["logo:32", "menuh"], ["copy"], { pad: "sm" })]],
  ["newsletter-marque-a-gauche", "Marque et abonnement à gauche", ["asymétrique", "newsletter", "marque"], "Marque, présentation et abonnement dans la grande colonne ; deux fines colonnes de liens.", [C([[3, "logo", "about", "news|Abonnez-vous|Recevez les nouveautés dans votre boîte."], NAV, EXP]), BAR]],
  ["newsletter-et-reseaux", "Abonnement et réseaux", ["newsletter", "réseaux", "horizontal"], "Abonnement à gauche, réseaux à droite, copyright dessous.", [L(["news|Restez informé|Une idée, une actualité, de temps en temps."], ["social"], { pad: "lg" }), Z(["copy:c"], { pad: "xs" })]],
  ["newsletter-titre-geant", "Grand titre d'abonnement", ["affiche", "newsletter", "centré"], "Grand titre d'invitation, formulaire, navigation en ligne.", [Z(["H|Rejoignez la communauté|1", "news|Abonnez-vous|Recevez nos prochaines publications.", "menuh"], { pad: "xl", gap: "24px" }), Z(["copy:c"], { pad: "xs" })]],
  ["newsletter-deux-rangees", "Deux rangées : invitation puis liens", ["newsletter", "deux rangées", "marque"], "Rangée d'invitation (titre et abonnement), rangée de marque, navigation et réseaux.", [C([[1, "H|Restez informé|2"], [1, "news|Recevoir les nouveautés|Moins d'un message par mois."]], { pad: "lg" }), C([[2, "logo", "about"], NAV, ["head|Suivez-nous", "social"]], { bg: "alt" }), Z(["copy:c"], { pad: "sm" })]],
  ["newsletter-compacte", "Abonnement compact", ["compact", "newsletter", "copyright"], "Un abonnement et le copyright, sur une ligne.", [L(["news|S'abonner|Les nouveautés par e-mail."], ["copy"], { pad: "md" })]],
  ["newsletter-reseaux-centres", "Abonnement, réseaux et copyright centrés", ["centré", "newsletter", "réseaux"], "Pile centrée : abonnement, réseaux, copyright.", [Z(["news|Suivez l'actualité|Un e-mail, jamais plus.", "social", "copy:c"], { pad: "lg" })]],
  ["newsletter-blog", "Abonnement, récents et rubriques", ["blog", "newsletter", "articles récents"], "Abonnement, articles récents et catégories du blog.", [C([[2, "news|S'abonner au blog|Chaque nouvel article dans votre boîte."], ["head|Récents", "recent:3"], ["head|Rubriques", "cats"]]), BARTOP]],
]);

fam("contact", [
  ["coordonnees-trois-colonnes", "Coordonnées en trois colonnes", ["contact", "coordonnées", "classique"], "Marque, navigation, coordonnées cliquables et horaires lus dans les Données de l'entreprise.", [C([[2, "logo", "about"], NAV, ["head|Contact", "contact", "hours", "link|Nous écrire|/contact"]]), BARTOP]],
  ["carte-a-droite", "Coordonnées et carte à droite", ["carte", "contact", "adresse"], "Marque, coordonnées et horaires à gauche ; carte à droite.", [C([[2, "logo", "about", "contact", "hours"], [3, "map"]], { pad: "lg" }), BARTOP]],
  ["carte-pleine-largeur", "Carte large sous les colonnes", ["carte", "colonnes", "large"], "Trois colonnes de contact et de liens, puis une carte pleine largeur.", [C([[2, "logo", "about"], NAV, CONTACT]), C([["map:wide"]], { pad: "xs" }), BARTOP]],
  ["coordonnees-bandeau-couleur", "Bandeau de coordonnées coloré", ["bandeau", "contact", "accent"], "Bandeau de couleur : coordonnées en ligne et bouton ; navigation dessous.", [L(["H|Une question ?|3", "contact:inline"], ["cta2|Nous écrire|/contact"], { bg: "accent", pad: "md" }), L(["logo:32", "menuh"], ["copy"], { pad: "sm" })]],
  ["contact-rendez-vous", "Contact et rendez-vous", ["rendez-vous", "contact", "bouton"], "Marque, coordonnées et un bouton « Prendre rendez-vous ».", [C([[2, "logo", "about"], CONTACT, ["head|Un échange ?", "text|Choisissez un créneau qui vous convient.", "cta|Prendre rendez-vous|/contact", "phone"]]), BARTOP]],
  ["horaires-et-carte", "Horaires, carte et navigation", ["horaires", "carte", "commerce local"], "Horaires d'ouverture (avec « ouvert maintenant »), carte et navigation en trois colonnes.", [C([["head|Horaires", "hours|-", "cta2|Nous contacter|/contact"], [2, "head|Nous trouver", "map"], NAV]), Z(["copy:c"], { pad: "sm" })]],
  ["contact-et-reseaux", "Contact, réseaux et liens", ["contact", "réseaux", "présentation"], "Présentation et coordonnées, réseaux, navigation.", [C([[2, "title:22", "about", "contact"], ["head|Suivez-nous", "social"], NAV]), BAR]],
  ["contact-centre", "Coordonnées centrées", ["centré", "contact", "élégant"], "Logo, coordonnées en ligne, bouton et navigation, centrés.", [Z(["logo:44", "contact:inline", "cta|Nous contacter|/contact", "menuh", "copy:c"], { pad: "lg" })]],
  ["carte-a-gauche", "Carte à gauche, contact à droite", ["carte", "contact", "asymétrique"], "Grande carte à gauche, coordonnées, horaires et bouton à droite.", [C([[3, "map"], [2, "head|Nous trouver", "contact", "hours", "cta2|Nous écrire|/contact"]], { pad: "lg" }), BAR]],
  ["contact-compact", "Contact compact", ["compact", "contact", "réseaux"], "Coordonnées en ligne et réseaux, puis copyright.", [L(["link|Nous écrire|/contact", "contact:inline"], ["social:plain"], { pad: "sm" }), L(["copy"], ["legal"], { pad: "xs", rule: "thin" })]],
]);

fam("reseaux", [
  ["reseaux-centres", "Réseaux centrés", ["réseaux", "centré", "invitation"], "Invitation à suivre, grandes icônes de réseaux centrées, copyright.", [Z(["H|Suivez-nous|3", "social:big", "copy:c"], { pad: "lg" })]],
  ["reseaux-logo-menu", "Rangée logo, navigation et réseaux", ["réseaux", "logo", "navigation"], "Logo, navigation et icônes de réseaux sur une rangée ; copyright et légal dessous.", [L(["logo:36", "menuh"], ["social"], { pad: "md" }), BARTOP]],
  ["reseaux-colonne-droite", "Réseaux en colonne de droite", ["réseaux", "colonnes", "marque"], "Marque et navigation à gauche, réseaux et bouton à droite.", [C([[2, "logo", "about"], NAV, ["head|Suivez-nous", "social", "cta2|Nous contacter|/contact"]]), BAR]],
  ["reseaux-bandeau-couleur", "Bandeau de réseaux coloré", ["bandeau", "réseaux", "accent"], "Bandeau de couleur : invitation et réseaux ; navigation et copyright dessous.", [L(["H|Rejoignez-nous|3"], ["social:big"], { bg: "accent", pad: "md" }), L(["menuh"], ["copy"], { pad: "sm" })]],
  ["reseaux-trois-liens-legaux", "Réseaux et trois liens légaux", ["légal", "réseaux", "faq"], "Copyright, liens cookies / contact / FAQ et réseaux sans fond.", [L(["copy", "legal:3"], ["social:plain"], { pad: "sm" })]],
  ["reseaux-pastilles-carrees", "Pastilles carrées", ["réseaux", "carré", "titre du site"], "Titre du site et pastilles carrées de réseaux, navigation dessous.", [L(["title:22"], ["social:sq"], { pad: "md" }), Z(["menuh", "copy:c"], { pad: "sm", gap: "10px" })]],
  ["reseaux-et-abonnement", "Réseaux et abonnement", ["réseaux", "newsletter", "deux colonnes"], "Réseaux à gauche, abonnement à droite, copyright dessous.", [C([["head|Suivez-nous", "social"], [2, "news|Restez informé|Les nouveautés dans votre boîte."]], { pad: "lg" }), Z(["copy:c"], { pad: "xs" })]],
  ["reseaux-titre-geant", "Grand titre et réseaux", ["affiche", "réseaux", "titre du site"], "Nom du site en très grand, réseaux et liens légaux.", [Z(["title:72", "social", "legal"], { pad: "xl", gap: "20px" }), Z(["copy:c"], { pad: "xs" })]],
  ["reseaux-et-coordonnees", "Réseaux et coordonnées", ["réseaux", "contact", "présentation"], "Présentation, coordonnées et réseaux en trois colonnes.", [C([[2, "logo", "about"], CONTACT, ["head|Suivez-nous", "social"]]), BAR]],
  ["reseaux-deux-rangees", "Deux rangées : navigation puis réseaux", ["deux rangées", "réseaux", "légal"], "Navigation et bouton, puis rangée alternée de réseaux, copyright et légal.", [L(["logo:36", "menuh"], ["cta2|Nous contacter|/contact"], { pad: "md" }), T(["copy"], ["social"], ["legal"], { bg: "alt", pad: "sm" })]],
]);

fam("boutique", [
  ["boutique-quatre-colonnes", "Boutique en quatre colonnes", ["boutique", "compte", "panier"], "Marque et moyens de paiement, aide et livraison, espace client avec panier, accès à la boutique.", [C([[2, "logo", "about", "pay"], ["head|Aide", "menu", "deliv"], ["head|Mon espace", "account", "cart"], ["head|Acheter", "links|La boutique>/boutique|Le catalogue>/catalogue"]]), BARTOP]],
  ["boutique-service-client", "Service client et boutique", ["boutique", "service client", "réseaux"], "Marque et réseaux, service client, liens de la boutique.", [C([[2, "logo", "about", "social:plain"], ["head|Service client", "menu", "link|FAQ|/faq", "phone", "email", "deliv"], ["head|Boutique", "links|La boutique>/boutique|Le catalogue>/catalogue|Le blog>/blog"]]), Z(["pay", "copy:c"], { pad: "sm", gap: "12px" })]],
  ["boutique-compte-panier", "Compte et panier en ligne", ["compact", "compte", "panier"], "Logo et navigation, compte et mini-panier ; copyright et légal dessous.", [L(["logo:32", "menuh"], ["account", "cart"], { pad: "md" }), L(["copy", "pay"], ["legal", "top"], { pad: "sm" })]],
  ["boutique-recherche", "Recherche dans le catalogue", ["recherche", "boutique", "aide"], "Grande recherche du catalogue, aide et espace client.", [C([[2, "head|Rechercher", "search:catalogue"], ["head|Aide", "menu", "deliv"], ["head|Mon espace", "account"]]), L(["copy"], ["social:plain"], { pad: "sm" })]],
  ["boutique-offres-newsletter", "Offres par e-mail", ["newsletter", "boutique", "promotions"], "Abonnement aux nouveautés, aide et espace client.", [C([[2, "news|Nos nouveautés|Recevez nos nouveautés et nos offres."], ["head|Boutique", "menu"], ["head|Mon espace", "account", "cart"]]), Z(["pay", "copy:c"], { pad: "sm", gap: "12px" })]],
  ["boutique-bandeau-appel", "Bandeau d'appel vers la boutique", ["bandeau", "bouton", "boutique"], "Bandeau de couleur invitant à visiter la boutique, puis navigation compacte.", [L(["H|Découvrez la boutique|3"], ["cta2|Voir la boutique|/boutique"], { bg: "accent", pad: "md" }), L(["logo:32", "menuh"], ["copy"], { pad: "sm" })]],
  ["boutique-formations", "Formations et espace élève", ["formation", "catalogue", "compte"], "Formations récentes, navigation et espace élève.", [C([[3, "head|Nos formations", "courses:3"], NAV, ["head|Espace élève", "account", "cta|Voir le catalogue|/catalogue"]]), BARTOP]],
  ["boutique-categories-articles", "Catégories et articles", ["blog", "catégories", "boutique"], "Catégories, articles récents, aide et réseaux.", [C([["head|Catégories", "cats"], ["head|Articles", "recent:3"], ["head|Aide", "menu"], ["head|Suivre", "social"]]), Z(["copy:c"], { pad: "sm" })]],
  ["boutique-mini", "Boutique minimale", ["minimaliste", "panier", "compact"], "Logo, navigation et panier sur une ligne, copyright centré.", [L(["logo:32"], ["menuh", "cart"], { pad: "sm" }), Z(["copy:c"], { pad: "xs" })]],
  ["boutique-cartes", "Boutique en cartes", ["cartes", "boutique", "compte"], "Trois cartes : marque, aide et espace client.", [C([["logo", "about", "pay"], ["head|Aide", "menu", "deliv"], ["head|Mon espace", "account", "cart"]], { cards: true, pad: "lg" }), Z(["copy:c"], { pad: "sm" })]],
]);

fam("editorial", [
  ["journal-titre-et-filets", "Titre de journal sous double filet", ["éditorial", "journal", "date"], "Titre centré, rubriques en capitales et date du jour sous double filet.", [Z(["title:34", "menuh:caps", "date"], { rule: "double", pad: "lg", gap: "16px" }), BAR]],
  ["magazine-trois-listes", "Trois listes d'articles", ["magazine", "populaires", "rubriques"], "À la une, les plus lus et rubriques en trois colonnes.", [C([["head|À la une", "recent:3"], ["head|Les plus lus", "popular:3"], ["head|Rubriques", "cats"]]), L(["copy"], ["social:plain", "top"], { pad: "sm" })]],
  ["blog-recherche-et-recents", "Blog, recherche et récents", ["blog", "recherche", "articles récents"], "Présentation avec recherche, articles récents et rubriques.", [C([[2, "title:22", "about", "search:blog"], [2, "head|Articles récents", "recent:4"], ["head|Rubriques", "cats"]]), Z(["copy:c"], { pad: "sm" })]],
  ["editorial-quatre-colonnes", "Quatre colonnes éditoriales", ["éditorial", "filet épais", "date"], "Titre et présentation, deux navigations et rubriques sous un filet épais.", [C([[2, "title:26", "about"], NAV, EXP, ["head|Rubriques", "cats"]], { rule: "thick" }), L(["copy"], ["date", "top"], { pad: "sm" })]],
  ["blog-abonnement-et-rubriques", "Abonnement au blog", ["blog", "newsletter", "rubriques"], "Abonnement au blog, rubriques et articles récents.", [C([[2, "news|S'abonner au blog|Chaque nouvel article dans votre boîte."], ["head|Rubriques", "cats"], ["head|Récents", "recent:3"]]), BARTOP]],
  ["journal-date-et-reseaux", "Date, réseaux et grand titre", ["journal", "date", "réseaux"], "Date et réseaux, grand titre et rubriques, mentions en bas.", [L(["date"], ["social:plain"], { rule: "thin", pad: "sm" }), Z(["title:40", "menuh:caps"], { pad: "md", gap: "14px" }), BARTOP]],
  ["magazine-populaires-et-reseaux", "Populaires, réseaux et à propos", ["magazine", "populaires", "réseaux"], "Grande colonne d'articles populaires, réseaux et présentation.", [C([[3, "head|Articles populaires", "popular:4"], ["head|Suivez-nous", "social"], ["head|À propos", "about"]]), Z(["copy:c"], { pad: "sm" })]],
  ["blog-a-lire", "À lire aussi", ["blog", "lecture", "compact"], "Grande colonne d'articles à lire, navigation étroite.", [C([[3, "head|À lire aussi", "recent:3"], [1, "menu"]]), L(["copy"], ["top"], { pad: "xs" })]],
  ["editorial-colophon", "Colophon centré", ["éditorial", "centré", "colophon"], "Titre, présentation, filet, rubriques en capitales et copyright, centrés.", [Z(["title:28", "about", "div", "menuh:caps", "copy:c"], { rule: "double", pad: "lg", max: "760px" })]],
  ["magazine-archives", "Rubriques, récents, populaires, recherche", ["magazine", "recherche", "dense"], "Quatre colonnes de découverte du contenu.", [C([["head|Rubriques", "cats"], ["head|Récents", "recent:4"], ["head|Populaires", "popular:4"], ["head|Rechercher", "search:blog"]]), Z(["copy:c"], { pad: "sm" })]],
]);

fam("entreprise", [
  ["entreprise-bandeau-appel", "Bandeau d'appel, puis trois colonnes", ["entreprise", "appel à l'action", "contact"], "Bandeau de couleur « Prêt à commencer ? », puis marque, navigation, coordonnées.", [L(["H|Prêt à commencer ?|2"], ["cta2|Nous contacter|/contact"], { bg: "accent", pad: "lg" }), C([[2, "logo", "about"], NAV, CONTACT]), BARTOP]],
  ["saas-produit-ressources", "Produit, ressources, entreprise", ["saas", "colonnes", "réseaux"], "Marque avec réseaux, puis trois colonnes de liens.", [C([[2, "logo", "about", "social:plain"], ["head|Produit", "menu"], ["head|Ressources", "hmenu"], ["head|Entreprise", "links|Contact>/contact|FAQ>/faq"]]), BARTOP]],
  ["saas-essai-gratuit", "Invitation à l'essai", ["saas", "inscription", "conversion"], "Invitation à commencer avec deux boutons, puis marque et navigations.", [L(["H|Prêt à commencer ?|2"], ["cta|Commencer|/inscription", "cta2|Nous contacter|/contact"], { bg: "alt", pad: "lg" }), C([[2, "logo", "about"], NAV, EXP]), L(["copy"], ["legal"], { pad: "sm" })]],
  ["corporate-trois-groupes", "Marque, navigation, contact et bouton", ["corporate", "contact", "bouton"], "Les trois groupes du pied type : marque, navigation, contact avec bouton.", [C([[2, "logo", "about"], NAV, ["head|Contact", "contact", "cta|Nous contacter|/contact"]]), BARTOP]],
  ["corporate-rendez-vous", "Navigation et rendez-vous", ["corporate", "rendez-vous", "compact"], "Logo, navigation et bouton de rendez-vous ; mentions dessous.", [L(["logo:36", "menuh"], ["phone", "cta|Prendre rendez-vous|/contact"], { pad: "md" }), BARTOP]],
  ["saas-compte-et-aide", "Compte, aide et navigation", ["saas", "compte", "connexion"], "Marque, accès au compte (connexion, inscription) et aide.", [C([[2, "logo", "about"], ["head|Compte", "link|Se connecter|/connexion", "link|Créer un compte|/inscription"], ["head|Aide", "menu"]]), Z(["copy:c"], { pad: "sm" })]],
  ["corporate-reseaux-legal", "Entreprise : réseaux et mentions légales", ["corporate", "réseaux", "légal"], "Titre et présentation, navigation, réseaux ; copyright et trois liens légaux.", [C([[2, "title:22", "about"], NAV, ["head|Nous suivre", "social"]]), L(["copy", "legalinfo:inline"], ["legal:3", "top"], { pad: "sm" })]],
  ["saas-newsletter-produit", "Produit et actualités", ["saas", "newsletter", "navigation"], "Marque, navigation et abonnement aux actualités du produit.", [C([[2, "logo", "about"], NAV, [2, "news|Actualités du produit|Les nouveautés par e-mail."]]), BARTOP]],
  ["corporate-sombre-large", "Pied sombre large", ["sombre", "corporate", "large"], "Rangée d'encre : marque, deux navigations, coordonnées ; mentions sur fond alterné.", [C([[2, "logo", "about"], NAV, EXP, CONTACT], { bg: "ink", pad: "lg" }), L(["copy", "legalinfo:inline"], ["legal", "top"], { bg: "alt", pad: "sm" })]],
  ["entreprise-deux-niveaux", "Deux niveaux", ["complet", "deux rangées", "navigation"], "Rangée alternée de navigations, rangée de marque, réseaux et mentions.", [C([NAV, EXP, ["head|Aide", "links|FAQ>/faq|Nous contacter>/contact"]], { bg: "alt", pad: "md" }), T(["logo:32"], ["copy"], ["social:plain"], { pad: "sm" })]],
]);

fam("creatif", [
  ["marque-en-geant", "Grande zone de marque", ["marque", "impact", "grand"], "Nom du site en très grand, navigation et bouton dessous.", [Z(["title:72", "menuh", "cta|Nous contacter|/contact"], { pad: "xl", gap: "24px" }), Z(["copy:c"], { pad: "xs" })]],
  ["cartes-coordonnees", "Trois cartes ombrées", ["cartes", "relief", "contact"], "Marque, liens et coordonnées dans trois cartes à ombre.", [C([["title:22", "about"], ["head|Liens", "menu"], ["head|Écrivez-nous", "contact", "cta|Nous contacter|/contact"]], { cards: true, pad: "lg" }), Z(["copy:c"], { pad: "sm" })]],
  ["asymetrique-invitation", "Invitation asymétrique", ["asymétrique", "invitation", "bouton"], "Logo étroit, grande invitation « Parlons de votre projet » avec bouton ; navigation dessous.", [C([[1, "logo:48"], [3, "H|Parlons de votre projet|2", "cta|Nous contacter|/contact"]], { pad: "lg" }), L(["menuh"], ["copy"], { pad: "sm", rule: "thin" })]],
  ["cadre-contour", "Cadre contour", ["cadre", "contour", "éditorial"], "Marque, navigation et coordonnées dans un cadre fin.", [C([[2, "title:24", "about"], NAV, CONTACT], { frame: true, pad: "lg", max: "1180px" }), Z(["copy:c"], { pad: "sm" })]],
  ["accordeons-mobile", "Rubriques qui se déplient", ["accordéon", "mobile", "compact"], "Logo et deux rubriques repliables (idéal sur téléphone), navigation et copyright.", [C([[1, "logo:40"], [2, "toggle|À propos|Présentez votre activité en quelques lignes : modifiez ce texte.", "toggle|Nous joindre|Indiquez ici comment vos visiteurs peuvent vous contacter."]], { pad: "lg" }), L(["menuh"], ["copy"], { pad: "sm" })]],
  ["portfolio-titre-et-reseaux", "Portfolio : titre et grands réseaux", ["portfolio", "réseaux", "titre du site"], "Titre du site à gauche, grandes icônes de réseaux à droite ; navigation et copyright.", [L(["title:28"], ["social:big"], { pad: "lg" }), L(["menuh"], ["copy"], { pad: "sm", rule: "thin" })]],
  ["invitation-geante-couleur", "Grande invitation colorée", ["affiche", "réseaux", "accent"], "Grand titre « Restons en contact » et réseaux sur fond de couleur ; navigation dessous.", [Z(["H|Restons en contact|1", "social:big"], { bg: "accent", pad: "xl", gap: "24px" }), L(["menuh"], ["copy"], { pad: "sm" })]],
  ["pile-a-gauche", "Pile à gauche", ["empilé", "gauche", "aéré"], "Une seule colonne alignée à gauche : logo, présentation, navigation, copyright.", [C([["logo:44", "about", "menu", "copy"]], { pad: "lg" })]],
  ["annonce-et-liens", "Annonce et liens", ["annonce", "pastille", "bouton"], "Pastille « Nouveau » et message avec bouton, puis marque et navigation.", [L(["badge|Nouveau", "text|Une annonce à mettre en avant : modifiez ce message."], ["cta2|En savoir plus|/blog"], { bg: "alt", pad: "sm" }), C([[2, "logo", "about"], NAV, EXP]), BARTOP]],
  ["double-bande-cartes", "Marque et cartes alternées", ["cartes", "deux rangées", "fond alterné"], "Rangée de marque et de réseaux, rangée alternée de deux cartes.", [L(["logo:40", "about"], ["social"], { pad: "lg" }), C([["head|Navigation", "menu"], CONTACT], { bg: "alt", cards: true, pad: "lg" }), Z(["copy:c"], { pad: "sm" })]],
]);

fam("centre", [
  ["centre-logo-menu-copyright", "Logo, menu et copyright centrés", ["centré", "logo", "navigation"], "Pile centrée : logo, navigation horizontale, copyright.", [Z(["logo:48", "menuh", "copy:c"], { pad: "lg" })]],
  ["centre-reseaux", "Logo, menu et réseaux centrés", ["centré", "réseaux", "élégant"], "Pile centrée : logo, navigation, réseaux, copyright.", [Z(["logo:44", "menuh", "social", "copy:c"], { pad: "lg" })]],
  ["centre-titre-double-filet", "Titre centré sous double filet", ["centré", "éditorial", "filets"], "Titre du site, rubriques en capitales et copyright sous double filet.", [Z(["title:30", "menuh:caps", "copy:c"], { rule: "double", pad: "lg" })]],
  ["centre-abonnement", "Logo, abonnement et navigation centrés", ["centré", "newsletter", "navigation"], "Pile centrée : logo, abonnement, navigation, copyright.", [Z(["logo:40", "news|Restez informé|Les nouveautés dans votre boîte.", "menuh", "copy:c"], { pad: "lg", gap: "22px" })]],
  ["centre-question", "Invitation à nous contacter", ["centré", "bouton", "contact"], "Titre « Une question ? », bouton, navigation, copyright, centrés.", [Z(["H|Une question ?|3", "cta|Nous contacter|/contact", "menuh", "copy:c"], { pad: "lg" })]],
  ["centre-legal", "Navigation et mentions centrées", ["centré", "légal", "sobre"], "Navigation, liens légaux, informations légales de l'entreprise et copyright centrés.", [Z(["menuh", "legal", "legalinfo:inline", "copy:c"], { pad: "md", gap: "12px" })]],
  ["centre-logo-au-milieu", "Logo au centre, menu et réseaux de part et d'autre", ["logo central", "réseaux", "navigation"], "Navigation à gauche, logo au centre, réseaux à droite ; copyright dessous.", [T(["menuh"], ["logo:44"], ["social:plain"], { pad: "md" }), Z(["copy:c"], { pad: "xs" })]],
  ["centre-presentation", "Présentation centrée", ["centré", "présentation", "réseaux"], "Logo, présentation, navigation, réseaux et copyright, centrés.", [Z(["logo:56", "about", "menuh", "social", "copy:c"], { pad: "xl", gap: "20px" })]],
  ["centre-deux-lignes", "Navigation, filet, copyright", ["centré", "filet", "compact"], "Navigation centrée, filet, copyright centré.", [Z(["menuh", "div", "copy:c"], { pad: "md", gap: "14px", max: "760px" })]],
  ["centre-contact", "Coordonnées centrées avec navigation", ["centré", "contact", "navigation"], "Logo, coordonnées en ligne, navigation et copyright, centrés.", [Z(["logo:40", "contact:inline", "menuh", "copy:c"], { pad: "lg" })]],
]);

// Identités : chaque modèle reçoit une palette et des polices FIXES (jamais la charte du site). Les modèles sectoriels reçoivent l'identité de leur métier ; les autres, une palette de l'ambiance de leur ancien thème
// (le suffixe de clé d'origine est conservé dans keySkin : aucun lien existant ne casse).
const SECTOR = {
  "horaires-et-carte": "resto", "contact-rendez-vous": "cabinet", "portfolio-titre-et-reseaux": "portfolio", "marque-en-geant": "agence", "boutique-formations": "ecole",
  "saas-produit-ressources": "saas", "journal-titre-et-filets": "media", "boutique-quatre-colonnes": "mode", "carte-a-droite": "immo", "reseaux-bandeau-couleur": "asso", "centre-presentation": "sante",
};
const seen = {};
for (const l of LAYOUTS) {
  l.keySkin = l.skin;
  const id = SECTOR[l.key] && IDENT.find((x) => x.key === SECTOR[l.key]);
  if (id) { l.skin = id.key; continue; }
  const mood = MOODS[l.skin], pool = IDENT2.filter((x) => x.mood === mood);
  const n = seen[mood] = (seen[mood] || 0) + 1;
  l.skin = pool[(n - 1) % pool.length].key;
}
module.exports = { type: "footer", kind: "component", flat: true, ownSkins: true, families: FAMILIES, layouts: LAYOUTS, skins: [...IDENT2.map(({ mood: _m, ...x }) => x), ...IDENT], SECTOR };
