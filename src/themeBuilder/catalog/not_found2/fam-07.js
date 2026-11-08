// Famille 7 — SaaS et logiciel (7 modèles) : interface produit, documentation, assistance, navigation latérale, palette de commande, état vide en onglets, journal.
const { skin, MSG, WHY, deco, stage, LK, U, shape, W, draw, recent, cats, popular } = require("./h");
const A = require("./art");
const S_PROD = skin("produit", "Interface claire", { bg: "#f4f5f7", fg: "#172b4d", mute: "#6b778c", alt: "#ffffff", accent: "#0c66e4", onAccent: "#ffffff", line: "#dfe1e6", font: "font.inter", head: "font.inter", weight: "700", btn: "solid", radius: "10px" });
const S_DOC = skin("documentation", "Docs bleu nuit", { bg: "#06283d", fg: "#e6f6ff", mute: "#8bbfd9", alt: "#0a3a57", accent: "#38bdf8", onAccent: "#06283d", line: "#155e85", font: "font.jetbrains-mono", head: "font.jetbrains-mono", weight: "700", btn: "solid", radius: "6px" });
const S_ASSIST = skin("assistance", "Centre d'aide", { bg: "#f0fdf4", fg: "#052e16", mute: "#3f6b4f", alt: "#ffffff", accent: "#16a34a", onAccent: "#ffffff", line: "#bbf7d0", font: "font.nunito", head: "font.nunito", weight: "800", btn: "solid", radius: "16px" });
const S_NAV = skin("navigation-produit", "Barre latérale", { bg: "#ffffff", fg: "#111827", mute: "#6b7280", alt: "#111827", accent: "#4f46e5", onAccent: "#ffffff", line: "#e5e7eb", font: "font.manrope", head: "font.manrope", weight: "700", btn: "solid", radius: "8px" });
const S_CMD = skin("palette", "Palette de commande", { bg: "#1f2937", fg: "#f9fafb", mute: "#9ca3af", alt: "#111827", accent: "#a78bfa", onAccent: "#111827", line: "#374151", font: "font.geist", head: "font.geist", weight: "600", btn: "solid", radius: "14px" });
const S_ONGLETS = skin("onglets", "Tableau de bord", { bg: "#eef2ff", fg: "#1e1b4b", mute: "#6366a8", alt: "#ffffff", accent: "#4338ca", onAccent: "#ffffff", line: "#c7d2fe", font: "font.plus-jakarta-sans", head: "font.plus-jakarta-sans", weight: "800", btn: "solid", radius: "12px" });
const S_JOURNAL = skin("journal", "Journal de versions", { bg: "#fffdf7", fg: "#2a2418", mute: "#7a6f55", alt: "#ffffff", accent: "#b45309", onAccent: "#ffffff", line: "#e7dcc0", font: "font.ibm-plex-sans", head: "font.ibm-plex-serif", weight: "600", btn: "solid" });

module.exports = [
  { key: "interface-produit", family: "saas", skin: S_PROD, name: "Interface produit", tags: ["logiciel", "tableau de bord", "fenêtre d'application"],
    desc: "L'écran d'une application : barre latérale de navigation, barre du haut et zone centrale « page introuvable ».", decl: { C: 8, N: 2, P: 1, T: 1 },
    build: (k) => [stage(k, [k.row([
      k.col([k.L("Navigation"), k.menu("header", {}, true), U(k, "Accueil", "/")], { flexBasis: "22%", flexGrow: 0, minWidth: "200px", backgroundColor: "#ffffff", gap: "12px", borderStyle: "solid", borderWidth: "1px", borderColor: "#dfe1e6", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "18px", paddingRight: "18px" }),
      k.card([k.row([k.L("Accueil / Page demandée"), k.L("404", { color: "#0c66e4" })], { gap: "8px" }), k.H(MSG, "1", { fontSize: "30px" }), k.T("<p>" + WHY + "</p>"), k.row([k.B("Retour au tableau de bord", "/", "solid"), k.B("Contacter le support", "/contact", "outline")], { gap: "10px" })], { flexBasis: "70%", flexGrow: 1, minWidth: "280px", gap: "14px", backgroundColor: "#ffffff" }),
    ], { alignItems: "flex-start", gap: "20px", width: "100%" })])] },

  { key: "documentation", family: "saas", skin: S_DOC, name: "Documentation", tags: ["logiciel", "documentation", "recherche"],
    desc: "Comme une page de documentation : recherche en vedette, rubriques populaires et questions fréquentes.", decl: { C: 18, N: 10, P: 9, T: 3 },
    build: (k) => [stage(k, [k.col([
      k.L("// ERROR 404 — NOT_FOUND", { fontFamily: "font.jetbrains-mono", color: "#38bdf8" }), k.H("Nous n'avons pas trouvé cette page de la documentation", "1", { fontSize: "36px", lineHeight: 1.15 }),
      k.search("site", { maxWidth: "640px", width: "100%" }),
      k.row([cats(k, "Rubriques", { title: "Rubriques" }), popular(k, "Les plus consultées", 4)], { alignItems: "flex-start", gap: "28px", width: "100%" }),
      k.W("accordion", { items: [{ q: "Le lien que j'ai suivi est-il cassé ?", a: "<p>Peut-être : signalez-le-nous depuis la page de contact.</p>" }, { q: "Où retrouver l'accueil ?", a: "<p>Le lien « Accueil » du menu vous y ramène.</p>" }], single: true }, { width: "100%", maxWidth: "640px" }),
    ], { gap: "18px", width: "100%" })])] },

  { key: "assistance", family: "saas", skin: S_ASSIST, name: "Assistance", tags: ["logiciel", "aide", "cartes"],
    desc: "Un centre d'aide : quatre cartes (contact, blog, catalogue, accueil) pour retrouver son chemin ou parler à quelqu'un.", decl: { C: 5, N: 6, P: 5, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.H("Besoin d'un coup de main ?", "1", { fontSize: "42px", textAlign: "center" }), k.T("<p>" + MSG + ". Voici où aller.</p>", { textAlign: "center" }),
      k.grid(4, [["Écrire au support", "Une question, un lien cassé : on vous répond.", "Contact", "/contact"], ["Lire le blog", "Guides et nouveautés.", "Blog", "/blog"], ["Parcourir le catalogue", "Toutes nos formations.", "Catalogue", "/catalogue"], ["Revenir à l'accueil", "Repartir du début.", "Accueil", "/"]].map(([t, d, l, u]) => k.card([k.H(t, "3", { fontSize: "18px" }), k.T("<p>" + d + "</p>", { color: "#3f6b4f", fontSize: "15px" }), U(k, l, u)], { backgroundColor: "#ffffff", minHeight: "150px" })), { gap: "14px", width: "100%" }),
    ], { gap: "20px", width: "100%" })])] },

  { key: "navigation-produit", family: "saas", skin: S_NAV, name: "Navigation produit", tags: ["logiciel", "barre latérale", "plan"],
    desc: "Une barre latérale noire avec le menu du site ; la page active du menu est « inconnue » et le contenu explique pourquoi.", decl: { C: 3, N: 3, P: 3, T: 1 },
    build: (k) => [stage(k, [k.row([
      k.col([k.L("MENU", { color: "#9ca3af" }), k.menu("header", { color: "#f9fafb" }, true)], { flexBasis: "24%", flexGrow: 0, minWidth: "210px", backgroundColor: "#111827", gap: "14px", paddingTop: "26px", paddingBottom: "26px", paddingLeft: "22px", paddingRight: "22px" }),
      k.col([k.row([deco("4", { fontSize: "7vw", color: "#4f46e5", lineHeight: 0.9 }), shape("6vw", "6vw", "#e5e7eb", { borderRadius: "50%", minWidth: "50px", minHeight: "50px" }), deco("4", { fontSize: "7vw", color: "#4f46e5", lineHeight: 0.9 })], { gap: "8px", alignItems: "center", flexWrap: "nowrap" }), k.H(MSG, "1", { fontSize: "32px" }), k.T("<p>Cette entrée du menu ne mène nulle part. " + WHY + "</p>"), k.B("Ouvrir l'accueil", "/", "solid")], { flexBasis: "66%", flexGrow: 1, minWidth: "260px", gap: "16px", paddingTop: "10px", paddingLeft: "30px" }),
    ], { alignItems: "stretch", gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "1px", borderColor: "#e5e7eb" })], { gap: "0px" })] },

  { key: "palette-de-commande", family: "saas", skin: S_CMD, name: "Palette de commande", tags: ["logiciel", "recherche", "overlay"],
    desc: "Une palette de commande façon Ctrl+K posée sur un fond assombri : un champ de recherche et des destinations.", decl: { C: 16, N: 2, P: 2, T: 1 },
    build: (k) => [stage(k, [k.card([
      k.L("Aucun résultat pour cette adresse — erreur 404"), k.search("site", { width: "100%" }), k.H(MSG, "1", { fontSize: "22px" }),
      k.col([["Aller à l'accueil", "/"], ["Ouvrir le blog", "/blog"], ["Parcourir le catalogue", "/catalogue"], ["Écrire au support", "/contact"]].map(([l, u]) => k.row([k.L("↵", { color: "#a78bfa" }), LK(k, l, u, { color: "#f9fafb" })], { gap: "12px", paddingTop: "10px", paddingBottom: "10px", borderTopStyle: "solid", borderTopWidth: "1px", borderColor: "#374151", flexWrap: "nowrap" })), { gap: "0px", width: "100%" }),
    ], { backgroundColor: "#1f2937", maxWidth: "620px", width: "100%", marginLeft: "auto", marginRight: "auto", gap: "14px", borderStyle: "solid", borderWidth: "1px", borderColor: "#374151", boxShadow: "xl" })], { backgroundColor: "#0b0f19", gap: "0px" })] },

  { key: "tableau-de-bord-vide", family: "saas", skin: S_ONGLETS, name: "Tableau de bord vide", tags: ["logiciel", "onglets", "état vide"],
    desc: "Un tableau de bord à onglets (Adresse, Que s'est-il passé ?, Que faire ?) qui explique la 404 sans inventer le moindre chiffre.", decl: { C: 19, N: 6, P: 3, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.H(MSG, "1", { fontSize: "34px" }),
      { type: "container", props: { mode: "tabs", tabsLook: "pills", tabsStart: 1 }, children: [
        { type: "container", name: "Adresse", children: [k.card([k.L("Pages trouvées pour cette adresse"), deco("0", { fontSize: "56px", fontWeight: "800", color: "#4338ca" })], { backgroundColor: "#ffffff" })] },
        { type: "container", name: "Que s'est-il passé ?", children: [k.card([k.T("<p>" + WHY + " Si un lien du site vous a conduit ici, signalez-le.</p>")], { backgroundColor: "#ffffff" })] },
        { type: "container", name: "Que faire ?", children: [k.card([k.row([k.B("Accueil", "/", "solid"), k.B("Contact", "/contact", "outline")], { gap: "10px" })], { backgroundColor: "#ffffff" })] },
      ], styles: { desktop: { width: "100%" } } },
    ], { gap: "16px", width: "100%" })])] },

  { key: "journal-des-versions", family: "saas", skin: S_JOURNAL, name: "Journal des versions", tags: ["logiciel", "chronologie", "journal"],
    desc: "Un journal de versions : « la page demandée n'a pas été trouvée » raconté en étapes, puis les derniers articles.", decl: { C: 11, N: 2, P: 7, T: 8 },
    build: (k) => [stage(k, [k.row([
      k.col([k.L("Journal — 404"), k.H(MSG, "1", { fontSize: "34px", fontFamily: "font.ibm-plex-serif" }),
        W(k, "timeline", { items: [{ date: "Étape 1", title: "Adresse demandée", text: "<p>Votre navigateur a demandé une page.</p>" }, { date: "Étape 2", title: "Aucune page ne correspond", text: "<p>" + WHY + "</p>" }, { date: "Étape 3", title: "Reprendre sa route", text: "<p>Accueil, recherche ou contact : tout est à portée.</p>" }] }, { width: "100%" }),
        k.B("Retour à l'accueil", "/", "solid")], { flexBasis: "52%", flexGrow: 1, minWidth: "280px", gap: "16px" }),
      k.col([recent(k, "Dernières publications", 5)], { flexBasis: "36%", flexGrow: 1, minWidth: "260px", gap: "10px" }),
    ], { alignItems: "flex-start", gap: "40px", width: "100%" })])] },
];
