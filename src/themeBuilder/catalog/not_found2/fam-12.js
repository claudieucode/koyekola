// Famille 12 — Marketing et conversion (6 modèles). Aucun faux témoignage, aucun faux chiffre, aucun compte à rebours artificiel.
const { skin, MSG, WHY, deco, stage, LK, U, shape, W, draw, posts, recent, shop, courses, subscribe } = require("./h");
const S_CTA = skin("cta", "Pop électrique", { bg: "#4f46e5", fg: "#ffffff", mute: "#e0e7ff", alt: "#4338ca", accent: "#fde047", onAccent: "#1e1b4b", line: "#818cf8", font: "font.inter", head: "font.bricolage-grotesque", weight: "800", btn: "solid" });
const S_NEWS = skin("newsletter", "Lettre papier", { bg: "#fefce8", fg: "#3f3a1c", mute: "#7a7440", alt: "#ffffff", accent: "#3f3a1c", onAccent: "#fefce8", line: "#3f3a1c", font: "font.lora", head: "font.young-serif", weight: "400", btn: "solid" });
const S_OFFRE = skin("offre", "Offre rouge", { bg: "#111111", fg: "#ffffff", mute: "#bdbdbd", alt: "#1c1c1c", accent: "#ff3b30", onAccent: "#ffffff", line: "#ff3b30", font: "font.barlow", head: "font.barlow-condensed", weight: "800", btn: "solid" });
const S_CONTACT = skin("formulaire-contact", "Carte de visite", { bg: "#ecf3f1", fg: "#12332d", mute: "#4d756c", alt: "#ffffff", accent: "#0d9488", onAccent: "#ffffff", line: "#bfd9d3", font: "font.karla", head: "font.karla", weight: "800", btn: "solid", radius: "16px" });
const S_SERV = skin("services", "Services en colonnes", { bg: "#ffffff", fg: "#111827", mute: "#6b7280", alt: "#f9fafb", accent: "#ea580c", onAccent: "#ffffff", line: "#e5e7eb", font: "font.hanken-grotesk", head: "font.fraunces", weight: "800", btn: "solid", radius: "14px" });
const S_RECO = skin("recommandations", "Sélection du moment", { bg: "#fdf2f8", fg: "#500724", mute: "#9d4a73", alt: "#ffffff", accent: "#db2777", onAccent: "#ffffff", line: "#fbcfe8", font: "font.sora", head: "font.sora", weight: "700", btn: "solid", radius: "18px", btnRadius: "999px" });

module.exports = [
  { key: "cta-principal", family: "marketing", skin: S_CTA, name: "CTA principal", tags: ["conversion", "appel à l'action", "fond animé"],
    desc: "Un fond de couleurs qui bouge doucement, un message, et un seul gros bouton qui capte toute l'attention.", decl: { C: 4, N: 6, P: 4, T: 8 },
    build: (k) => [stage(k, [W(k, "motionanimatedbg", { title: MSG, titleTag: "h1", text: WHY + " Reprenons depuis un endroit qui existe.", buttonLabel: "Retour à l'accueil", link: "/", tone: "light", align: "center", minHeight: 440 }, { width: "100%" })], { gap: "0px", paddingTop: "0px", paddingBottom: "0px" })] },

  { key: "newsletter", family: "marketing", skin: S_NEWS, name: "Newsletter", tags: ["conversion", "abonnement", "lettre"],
    desc: "« On vous garde un pli » : le formulaire d'abonnement réel du site est la sortie proposée.", decl: { C: 1, N: 6, P: 5, T: 2 },
    build: (k, env) => [stage(k, [k.card([
      k.L("Lettre ouverte — erreur 404", { textAlign: "center" }), k.H("Cette page est introuvable, mais pas notre prochaine lettre", "1", { fontSize: "36px", textAlign: "center", fontFamily: "font.young-serif", lineHeight: 1.15 }),
      subscribe(k, env, { title: "Recevez-la dans votre boîte", intro: "Une lettre, quand il y a quelque chose à dire.", button: "Je m'abonne" }, { width: "100%" }), U(k, "Non merci, retour à l'accueil", "/", { alignSelf: "center" }),
    ], { backgroundColor: "#ffffff", maxWidth: "620px", width: "100%", marginLeft: "auto", marginRight: "auto", gap: "16px", borderStyle: "solid", borderWidth: "2px", borderColor: "#3f3a1c", paddingTop: "34px", paddingBottom: "34px", paddingLeft: "34px", paddingRight: "34px" })], { gap: "0px" })] },

  { key: "offre-du-moment", family: "marketing", skin: S_OFFRE, name: "Offre du moment", tags: ["conversion", "promotions", "bandeau"],
    desc: "Un bandeau d'offre qui défile et les produits réellement en promotion ; aucun compte à rebours artificiel.", decl: { C: 15, N: 2, P: 2, T: 4 },
    build: (k) => [stage(k, [k.col([
      W(k, "marquee", { items: [{ text: "OFFRES EN COURS" }, { text: "PAGE INTROUVABLE" }, { text: "PROFITEZ-EN" }], speed: "normal", direction: "right", separator: "/" }, { fontFamily: "font.barlow-condensed", fontSize: "30px", color: "#ff3b30", borderTopStyle: "solid", borderTopWidth: "2px", borderBottomStyle: "solid", borderBottomWidth: "2px", borderColor: "#ff3b30" }),
      k.H("Cette page a disparu. Pas ces offres.", "1", { fontSize: "40px", fontFamily: "font.barlow-condensed", textAlign: "center" }),
      W(k, "shopgrid", { count: 3, columns: "3", source: "sale", orderby: "newest" }, { width: "100%" }), k.B("Toutes les offres", "/boutique", "solid", { alignSelf: "center" }),
    ], { gap: "20px", width: "100%" })], { gap: "0px" })] },

  { key: "formulaire-de-contact", family: "marketing", skin: S_CONTACT, name: "Contact", tags: ["conversion", "contact", "carte"],
    desc: "Une carte flottante : message, bouton de contact et liens essentiels pour réamorcer la conversation.", decl: { C: 16, N: 6, P: 5, T: 1 },
    build: (k) => [stage(k, [k.card([
      k.H("Cette page est introuvable", "1", { fontSize: "30px" }), k.T("<p>" + WHY + " Un message suffit : nous retrouverons ce que vous cherchiez.</p>"),
      k.B("Écrire un message", "/contact", "solid", { alignSelf: "stretch", justifyContent: "center" }), k.row([U(k, "Accueil", "/"), U(k, "Blog", "/blog"), U(k, "Catalogue", "/catalogue")], { gap: "20px", justifyContent: "center" }),
    ], { backgroundColor: "#ffffff", maxWidth: "460px", width: "100%", marginLeft: "auto", marginRight: "auto", gap: "16px", boxShadow: "xl" })], { backgroundColor: "#bfd9d3", gap: "0px" })] },

  { key: "services-en-colonnes", family: "marketing", skin: S_SERV, name: "Présentation des services", tags: ["conversion", "services", "formations"],
    desc: "Trois colonnes de services (catalogue, blog, contact) avec leur bénéfice, puis les formations réelles.", decl: { C: 5, N: 2, P: 1, T: 8 },
    build: (k) => [stage(k, [k.col([
      k.row([k.H(MSG, "1", { fontSize: "34px" }), k.L("404")], { justifyContent: "space-between", width: "100%" }),
      k.grid(3, [["Apprendre", "Des formations claires, à votre rythme.", "Catalogue", "/catalogue"], ["Comprendre", "Des articles pour aller plus loin.", "Blog", "/blog"], ["Avancer", "Une équipe qui répond à vos questions.", "Contact", "/contact"]].map(([t, d, l, u]) => k.card([k.H(t, "2", { fontSize: "24px" }), k.T("<p>" + d + "</p>"), k.B(l, u, "outline")], { backgroundColor: "#f9fafb", gap: "12px" })), { gap: "16px", width: "100%" }),
      courses(k, 3),
    ], { gap: "20px", width: "100%" })])] },

  { key: "selection-du-moment", family: "marketing", skin: S_RECO, name: "Sélection du moment", tags: ["conversion", "recommandations", "à la une"],
    desc: "Ni faux avis ni faux chiffres : une sélection éditoriale réelle (articles, formations, produits) présentée en ruban.", decl: { C: 12, N: 6, P: 5, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.H("Cette page est introuvable — voici notre sélection", "1", { fontSize: "34px", textAlign: "center" }),
      { type: "container", props: { mode: "tabs", tabsLook: "pills" }, children: [
        { type: "container", name: "Articles", children: [posts(k, 3)] }, { type: "container", name: "Formations", children: [courses(k, 3)] }, { type: "container", name: "Boutique", children: [shop(k, 3)] },
      ], styles: { desktop: { width: "100%" } } },
      k.B("Retour à l'accueil", "/", "solid", { alignSelf: "center" }),
    ], { gap: "18px", width: "100%" })])] },
];
