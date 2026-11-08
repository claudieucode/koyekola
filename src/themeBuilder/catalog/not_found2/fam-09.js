// Famille 9 — Entreprises et institutions (7 modèles) : corporate sobre, corporate premium, institutionnel, cabinet, services financiers, agence, organisation.
const { skin, MSG, WHY, deco, stage, LK, U, shape, W, draw, posts, recent, navRow } = require("./h");
const A = require("./art");
const S_SOBRE = skin("corporate-sobre", "Corporate gris", { bg: "#f3f4f6", fg: "#1f2937", mute: "#6b7280", alt: "#ffffff", accent: "#374151", onAccent: "#ffffff", line: "#d1d5db", font: "font.open-sans", head: "font.open-sans", weight: "700", btn: "solid" });
const S_PREMIUM = skin("corporate-premium", "Marine et or", { bg: "#0b1f3a", fg: "#f5efe0", mute: "#b8c1d4", alt: "#12305a", accent: "#c9a24b", onAccent: "#0b1f3a", line: "#c9a24b", font: "font.raleway", head: "font.cormorant-garamond", weight: "600", btn: "outline" });
const S_INSTIT = skin("institutionnel", "Bleu institutionnel", { bg: "#ffffff", fg: "#0f172a", mute: "#475569", alt: "#eff6ff", accent: "#1d4ed8", onAccent: "#ffffff", line: "#1d4ed8", font: "font.source-sans-3", head: "font.source-serif-4", weight: "700", btn: "solid" });
const S_CABINET = skin("cabinet", "Cabinet", { bg: "#f7f3ec", fg: "#2a2a2a", mute: "#6a655a", alt: "#ffffff", accent: "#7a5c2e", onAccent: "#ffffff", line: "#d9cfba", font: "font.lora", head: "font.libre-baskerville", weight: "700", btn: "solid" });
const S_FIN = skin("finance", "Finance rassurante", { bg: "#eef7f4", fg: "#0b3b32", mute: "#3f7167", alt: "#ffffff", accent: "#0f766e", onAccent: "#ffffff", line: "#b7e0d7", font: "font.noto-sans", head: "font.noto-serif", weight: "700", btn: "solid", radius: "10px" });
const S_AGENCE = skin("agence", "Agence vive", { bg: "#111111", fg: "#ffffff", mute: "#b3b3b3", alt: "#1c1c1c", accent: "#c6ff00", onAccent: "#111111", line: "#333333", font: "font.space-grotesk", head: "font.space-grotesk", weight: "700", btn: "solid" });
const S_ORG = skin("organisation", "Organisation internationale", { bg: "#f4f8fb", fg: "#0a2540", mute: "#4a6a86", alt: "#ffffff", accent: "#0369a1", onAccent: "#ffffff", line: "#c5d9e8", font: "font.noto-sans", head: "font.noto-sans", weight: "700", btn: "solid" });

module.exports = [
  { key: "corporate-sobre", family: "entreprises", skin: S_SOBRE, name: "Corporate sobre", tags: ["entreprise", "plan du site", "sobre"],
    desc: "Message formel puis plan du site en quatre colonnes de liens, comme sur un site d'entreprise.", decl: { C: 6, N: 2, P: 3, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.L("Erreur 404"), k.H(MSG, "1", { fontSize: "34px" }), k.T("<p>" + WHY + " Veuillez utiliser le plan du site ci-dessous.</p>", { maxWidth: "620px" }),
      k.grid(4, [["Société", [["Accueil", "/"], ["Blog", "/blog"]]], ["Offre", [["Catalogue", "/catalogue"], ["Boutique", "/boutique"]]], ["Espace client", [["Mon compte", "/compte"]]], ["Aide", [["Contact", "/contact"]]]].map(([t, ls]) => k.col([k.H(t, "3", { fontSize: "16px" }), ...ls.map(([l, u]) => U(k, l, u))], { gap: "8px" })), { gap: "24px", width: "100%", borderTopStyle: "solid", borderTopWidth: "1px", borderColor: "#d1d5db", paddingTop: "22px" }),
    ], { gap: "16px", width: "100%" })])] },

  { key: "corporate-premium", family: "entreprises", skin: S_PREMIUM, name: "Corporate premium", tags: ["entreprise", "premium", "marine et or"],
    desc: "Fond marine, filet doré et typographie fine : un message rassurant et deux façons de joindre l'entreprise.", decl: { C: 3, N: 2, P: 8, T: 8 },
    build: (k) => [stage(k, [k.row([
      k.col([shape("64px", "2px", "#c9a24b"), k.L("Erreur 404", { color: "#c9a24b" }), k.H("Cette page n'est plus disponible", "1", { fontSize: "46px", fontFamily: "font.cormorant-garamond", lineHeight: 1.1 }), k.T("<p>" + WHY + " Notre équipe se tient à votre disposition.</p>", { color: "#b8c1d4" }), k.row([k.B("Retour à l'accueil", "/", "outline"), k.B("Nous contacter", "/contact", "outline", { borderColor: "#f5efe0", color: "#f5efe0" })], { gap: "14px" })], { flexBasis: "60%", flexGrow: 1, minWidth: "280px", gap: "16px" }),
      draw(k, A.ancre, { alt: "Une ancre", width: 160, stroke: 2, color: "#c9a24b" }, { flexBasis: "20%", flexGrow: 0, minWidth: "120px" }),
    ], { alignItems: "center", gap: "40px", width: "100%" })])] },

  { key: "institutionnel", family: "entreprises", skin: S_INSTIT, name: "Institutionnel", tags: ["institution", "rubriques", "bandeau officiel"],
    desc: "Un bandeau officiel, le message, puis trois rubriques par public (visiteurs, clients, partenaires).", decl: { C: 15, N: 6, P: 1, T: 8 },
    build: (k) => [stage(k, [k.col([
      k.row([k.L("SERVICE EN LIGNE", { color: "#ffffff", backgroundColor: "#1d4ed8", paddingLeft: "10px", paddingRight: "10px", paddingTop: "4px", paddingBottom: "4px" }), k.L("Erreur 404 — page introuvable")], { gap: "14px" }),
      k.H("La page demandée n'existe pas ou n'existe plus", "1", { fontSize: "34px", fontFamily: "font.source-serif-4" }),
      k.grid(3, [["Visiteurs", "Découvrir nos contenus", "/blog"], ["Clients", "Accéder à votre espace", "/compte"], ["Partenaires", "Nous écrire", "/contact"]].map(([t, d, u]) => k.card([k.H(t, "3", { fontSize: "18px" }), k.T("<p>" + d + "</p>"), U(k, "Accéder", u)], { backgroundColor: "#eff6ff", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "4px", borderColor: "#1d4ed8" })), { gap: "16px", width: "100%" }),
    ], { gap: "18px", width: "100%" })])] },

  { key: "cabinet", family: "entreprises", skin: S_CABINET, name: "Cabinet", tags: ["cabinet", "rendez-vous", "contact"],
    desc: "Un cabinet professionnel : message courtois, prise de contact directe et coordonnées du site.", decl: { C: 2, N: 6, P: 7, T: 2 },
    build: (k) => [stage(k, [k.row([
      k.col([k.L("Cabinet — erreur 404"), k.H("Nous ne trouvons pas cette page", "1", { fontSize: "42px", fontFamily: "font.libre-baskerville", lineHeight: 1.15 }), k.T("<p>" + WHY + "</p>")], { flexBasis: "46%", flexGrow: 1, minWidth: "260px", gap: "14px" }),
      k.card([k.H("Besoin d'être guidé ?", "2", { fontSize: "22px" }), k.T("<p>Prenez contact : nous vous répondons dans les meilleurs délais.</p>"), k.B("Prendre contact", "/contact", "solid"), U(k, "Revenir à l'accueil", "/")], { flexBasis: "40%", flexGrow: 1, minWidth: "260px", backgroundColor: "#ffffff", gap: "14px", borderStyle: "solid", borderWidth: "1px", borderColor: "#d9cfba" }),
    ], { alignItems: "stretch", gap: "36px", width: "100%" })])] },

  { key: "services-financiers", family: "entreprises", skin: S_FIN, name: "Services financiers", tags: ["finance", "compte", "rassurant"],
    desc: "Un ton posé et rassurant : « aucune opération n'est perdue », accès direct à l'espace client et à l'assistance.", decl: { C: 1, N: 6, P: 5, T: 8 },
    build: (k) => [stage(k, [k.card([
      k.L("Erreur 404 — sans conséquence pour vos données", { textAlign: "center" }), k.H("Cette page n'est pas disponible", "1", { fontSize: "34px", textAlign: "center", fontFamily: "font.noto-serif" }),
      k.T("<p>" + WHY + " Vos informations et votre espace client ne sont pas concernés.</p>", { textAlign: "center" }), k.account({ justifyContent: "center" }),
      k.row([k.B("Mon espace client", "/compte", "solid"), k.B("Contacter l'assistance", "/contact", "outline")], { gap: "12px", justifyContent: "center" }),
    ], { backgroundColor: "#ffffff", maxWidth: "680px", width: "100%", marginLeft: "auto", marginRight: "auto", gap: "16px", alignItems: "stretch", paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px" })], { gap: "0px" })] },

  { key: "agence", family: "entreprises", skin: S_AGENCE, name: "Agence", tags: ["agence", "études de cas", "contact"],
    desc: "Une agence assume le raté : message franc, derniers articles comme études de cas et mail direct.", decl: { C: 5, N: 1, P: 6, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.row([deco("404", { fontSize: "13vw", color: "#c6ff00", fontWeight: "700", lineHeight: 0.85, letterSpacing: "-0.04em" }), k.col([k.H("On a perdu cette page. On ne perd jamais un projet.", "1", { fontSize: "30px", lineHeight: 1.15 }), k.B("Parlons-en", "/contact", "solid")], { flexBasis: "44%", flexGrow: 1, minWidth: "240px", gap: "14px" })], { alignItems: "center", gap: "32px", width: "100%" }),
      k.L("Nos derniers projets"), posts(k, 3),
    ], { gap: "20px", width: "100%" })])] },

  { key: "organisation-internationale", family: "entreprises", skin: S_ORG, name: "Organisation internationale", tags: ["organisation", "rubriques", "accordéon"],
    desc: "Une organisation : le message et un accordéon de rubriques (À propos, Publications, Contact) qui ouvrent chacune vers une page.", decl: { C: 18, N: 2, P: 1, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.L("Erreur 404"), k.H(MSG, "1", { fontSize: "36px" }),
      W(k, "accordion", { items: [{ q: "Qui sommes-nous ?", a: "<p>Retrouvez notre présentation sur la page d'accueil du site.</p>" }, { q: "Où lire nos publications ?", a: "<p>Toutes nos publications sont dans le blog.</p>" }, { q: "Comment nous joindre ?", a: "<p>Utilisez la page de contact : nous répondons à chaque message.</p>" }], single: true, openFirst: true }, { width: "100%", maxWidth: "760px" }),
      navRow(k, { marginTop: "6px" }),
    ], { gap: "16px", width: "100%" })])] },
];
