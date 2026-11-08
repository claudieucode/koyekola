// Famille 13 — Interactives (8 modèles). Décision : les interactions sont NATIVES (boîtes retournables, accordéon, onglets, fenêtre, carrousel, effets au pointeur, carte cliquable) — réelles, accessibles
// au clavier, sans script à maintenir. Aucun mini-jeu d'arcade n'est livré : il demanderait un nouveau moteur de script, hors périmètre de cette mission.
const { skin, MSG, WHY, deco, stage, LK, U, shape, W, draw, recent, cats } = require("./h");
const A = require("./art");
const S_FLIP = skin("cartes", "Cartes à jouer", { bg: "#0f3d2e", fg: "#f4fff9", mute: "#a7d7c3", alt: "#14513c", accent: "#ffd166", onAccent: "#0f3d2e", line: "#2f8a68", font: "font.nunito", head: "font.fredoka", weight: "600", btn: "solid", radius: "18px", btnRadius: "999px" });
const S_PORTES = skin("portes", "Couloir", { bg: "#2a1f3d", fg: "#f6f0ff", mute: "#c3b3e0", alt: "#3a2c54", accent: "#f2c14e", onAccent: "#2a1f3d", line: "#6c5a96", font: "font.lato", head: "font.cinzel", weight: "700", btn: "solid" });
const S_TRESOR = skin("tresor", "Carte au trésor", { bg: "#f1e2bf", fg: "#4a3217", mute: "#8a6a3c", alt: "#fbf1d6", accent: "#8c3b1a", onAccent: "#fffaf0", line: "#8a6a3c", font: "font.im-fell-english", head: "font.pirata-one", weight: "400", btn: "solid" });
const S_PARALLAXE = skin("pointeur", "Verre", { bg: "#eaf0ff", fg: "#1a2250", mute: "#5560a0", alt: "#ffffff", accent: "#5b6cff", onAccent: "#ffffff", line: "#cdd6ff", font: "font.manrope", head: "font.manrope", weight: "800", btn: "solid", radius: "20px", btnRadius: "999px" });
const S_AIMANT = skin("aimant", "Aimant", { bg: "#0a0a0a", fg: "#fafafa", mute: "#a3a3a3", alt: "#171717", accent: "#fafafa", onAccent: "#0a0a0a", line: "#262626", font: "font.inter", head: "font.inter-tight", weight: "800", btn: "solid" });
const S_RECIT = skin("recit", "Récit en trois actes", { bg: "#fff6e0", fg: "#3a2a0d", mute: "#8a6f33", alt: "#ffffff", accent: "#d97706", onAccent: "#ffffff", line: "#f3d58b", font: "font.lora", head: "font.dm-serif-display", weight: "400", btn: "solid" });
const S_CARTE = skin("carte-tactile", "Plan", { bg: "#e8f3ee", fg: "#12372a", mute: "#4a7a68", alt: "#ffffff", accent: "#0f766e", onAccent: "#ffffff", line: "#12372a", font: "font.ibm-plex-sans", head: "font.ibm-plex-sans", weight: "700", btn: "solid" });
const S_OUTILS = skin("boite-a-outils", "Établi", { bg: "#f6f1e7", fg: "#2b2a27", mute: "#78736a", alt: "#ffffff", accent: "#c2410c", onAccent: "#ffffff", line: "#2b2a27", font: "font.space-grotesk", head: "font.space-grotesk", weight: "700", btn: "solid" });

const flip = (k, front, back, text, label, url) => W(k, "flipbox", { frontTitle: front, frontText: "Retourner la carte", backTitle: back, backText: text, ctaLabel: label, ctaUrl: url }, { width: "100%", minHeight: "190px" });
module.exports = [
  { key: "cartes-a-retourner", family: "interactives", skin: S_FLIP, name: "Cartes à retourner", tags: ["interactif", "cartes", "jeu"],
    desc: "Trois cartes face cachée : retournez-les pour découvrir la bonne sortie (accueil, blog ou contact).", decl: { C: 5, N: 6, P: 6, T: 8 },
    build: (k) => [stage(k, [k.col([
      k.H("Choisissez une carte pour retrouver votre page", "1", { fontSize: "34px", textAlign: "center" }), k.T("<p>" + MSG + ". Retournez une carte :</p>", { textAlign: "center" }),
      k.grid(3, [flip(k, "Carte 1", "L'accueil", "Le point de départ du site.", "Y aller", "/"), flip(k, "Carte 2", "Le blog", "Nos derniers articles.", "Lire", "/blog"), flip(k, "Carte 3", "Le contact", "Une question ? Écrivez-nous.", "Écrire", "/contact")], { gap: "16px", width: "100%" }),
    ], { gap: "18px", width: "100%" })])] },

  { key: "les-trois-portes", family: "interactives", skin: S_PORTES, name: "Les trois portes", tags: ["interactif", "accordéon", "choix"],
    desc: "Une porte dessinée et trois portes à ouvrir (accordéon exclusif) : chacune cache une destination.", decl: { C: 2, N: 4, P: 2, T: 2 },
    build: (k) => [stage(k, [k.row([
      draw(k, A.porte, { alt: "Une porte", width: 220, stroke: 3, color: "#f2c14e" }, { flexBasis: "26%", flexGrow: 0, minWidth: "170px" }),
      k.col([k.H("Derrière quelle porte est votre page ?", "1", { fontSize: "36px", fontFamily: "font.cinzel", lineHeight: 1.15 }), W(k, "accordion", { items: [{ q: "Porte n° 1", a: "<p>Le couloir de l'accueil : <a href=\"/\">y entrer</a>.</p>" }, { q: "Porte n° 2", a: "<p>La salle de lecture : <a href=\"/blog\">entrer</a>.</p>" }, { q: "Porte n° 3", a: "<p>Le bureau d'accueil : <a href=\"/contact\">frapper</a>.</p>" }], single: true, icon: "plus" }, { width: "100%" })], { flexBasis: "56%", flexGrow: 1, minWidth: "280px", gap: "16px" }),
    ], { alignItems: "center", gap: "36px", width: "100%" })])] },

  { key: "chasse-au-tresor", family: "interactives", skin: S_TRESOR, name: "Chasse au trésor", tags: ["interactif", "indices", "onglets"],
    desc: "Trois indices dans des onglets ; le dernier révèle le trésor : le lien vers l'accueil.", decl: { C: 13, N: 3, P: 7, T: 5 },
    build: (k) => [stage(k, [k.col([
      k.row([deco("4", { fontSize: "12vw", fontFamily: "font.pirata-one", color: "#8c3b1a", lineHeight: 0.9 }), draw(k, A.carte, { alt: "Une carte au trésor", width: 190, stroke: 3, color: "#4a3217" }, { flexBasis: "20%", flexGrow: 0, minWidth: "110px" }), deco("4", { fontSize: "12vw", fontFamily: "font.pirata-one", color: "#8c3b1a", lineHeight: 0.9 })], { gap: "14px", alignItems: "center", justifyContent: "center" }),
      k.H("Page introuvable : suivez la carte", "1", { fontSize: "34px", fontFamily: "font.pirata-one", textAlign: "center" }),
      W(k, "tabs", { items: [{ title: "Indice 1", text: "<p>Le trésor n'est pas ici : cette adresse est vide.</p>" }, { title: "Indice 2", text: "<p>Cherchez du côté du <a href=\"/blog\">blog</a> ou du <a href=\"/catalogue\">catalogue</a>.</p>" }, { title: "Le trésor", text: "<p>Il est tout simplement <a href=\"/\">à l'accueil</a>.</p>" }] }, { width: "100%", maxWidth: "640px", alignSelf: "center" }),
    ], { gap: "16px", width: "100%" })])] },

  { key: "parallaxe", family: "interactives", skin: S_PARALLAXE, name: "Parallaxe", tags: ["interactif", "pointeur", "carte inclinable"],
    desc: "Une carte de verre qui s'incline vers la souris et un 404 en deux couches qui bougent différemment.", decl: { C: 4, N: 1, P: 5, T: 1 },
    build: (k) => [stage(k, [k.col([
      deco("404", { fontSize: "22vw", color: "#cdd6ff", fontWeight: "800", lineHeight: 0.8, textAlign: "center" }),
      k.H(MSG, "1", { fontSize: "30px", textAlign: "center", marginTop: "-6vw" }),
      W(k, "motiontiltcard", { title: "Passez la souris", titleTag: "h2", text: WHY + " La carte vous suit : suivez-la jusqu'à l'accueil.", linkLabel: "Retour à l'accueil", link: "/" }, { maxWidth: "460px", width: "100%", alignSelf: "center" }),
    ], { gap: "0px", width: "100%" })], { gap: "0px" })] },

  { key: "aimant", family: "interactives", skin: S_AIMANT, name: "Aimant", tags: ["interactif", "bouton magnétique", "minimal"],
    desc: "Un énorme bouton magnétique attire le curseur : il n'y a qu'une chose à faire sur cette page.", decl: { C: 1, N: 11, P: 3, T: 1 },
    build: (k) => [stage(k, [k.col([
      deco("404", { fontSize: "16vw", color: "transparent", textStrokeWidth: "2px", textStrokeColor: "#fafafa", fontWeight: "800", lineHeight: 0.85, textAlign: "center" }),
      k.H(MSG, "1", { fontSize: "28px", textAlign: "center" }),
      W(k, "motionmagneticbutton", { label: "Retour à l'accueil", link: "/", size: "lg", align: "center" }, { alignSelf: "center" }),
    ], { gap: "20px", width: "100%" })], { gap: "0px" })] },

  { key: "recit-en-trois-actes", family: "interactives", skin: S_RECIT, name: "Récit en trois actes", tags: ["interactif", "carrousel", "histoire"],
    desc: "Une petite histoire en trois écrans (carrousel) : la page part, on la cherche, on la remplace.", decl: { C: 12, N: 2, P: 5, T: 2 },
    build: (k) => [stage(k, [{ type: "container", props: { mode: "carousel", dots: true, loop: false }, children: [
      { type: "container", name: "Acte 1", children: [k.col([k.L("Acte 1 — 404"), k.H("Il était une fois une page qui n'existe plus", "1", { fontSize: "40px", fontFamily: "font.dm-serif-display", lineHeight: 1.1 }), k.T("<p>" + WHY + "</p>")], { gap: "12px", paddingTop: "30px", paddingBottom: "40px" })] },
      { type: "container", name: "Acte 2", children: [k.col([k.L("Acte 2"), k.H("On la cherche partout", "2", { fontSize: "34px", fontFamily: "font.dm-serif-display" }), k.search("site", { maxWidth: "520px", width: "100%" })], { gap: "12px", paddingTop: "30px", paddingBottom: "40px" })] },
      { type: "container", name: "Acte 3", children: [k.col([k.L("Acte 3"), k.H("Et on la remplace", "2", { fontSize: "34px", fontFamily: "font.dm-serif-display" }), recent(k, "Par ces lectures", 3), k.B("Fin : retour à l'accueil", "/", "solid", { alignSelf: "flex-start" })], { gap: "12px", paddingTop: "30px", paddingBottom: "40px" })] },
    ], styles: { desktop: { width: "100%" } } }], { gap: "0px" })] },

  { key: "carte-tactile", family: "interactives", skin: S_CARTE, name: "Carte tactile", tags: ["interactif", "plan", "illustration"],
    desc: "Le plan d'un site dessiné comme une carte routière ; les lieux sont des boutons qui s'éclairent au survol.", decl: { C: 13, N: 6, P: 7, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.H("Vous n'êtes pas sur la carte", "1", { fontSize: "36px", textAlign: "center" }),
      draw(k, A.carte, { alt: "Plan du site dessiné comme une carte routière", width: 520, stroke: 2.6, color: "#0f766e" }),
      k.row([["Accueil", "/"], ["Blog", "/blog"], ["Catalogue", "/catalogue"], ["Boutique", "/boutique"], ["Contact", "/contact"]].map(([l, u]) => k.B("📍 " + l, u, "outline")), { gap: "10px", justifyContent: "center" }),
    ], { gap: "16px", alignItems: "center", width: "100%" })])] },

  { key: "boite-a-outils", family: "interactives", skin: S_OUTILS, name: "Boîte à outils", tags: ["interactif", "fenêtres", "aide"],
    desc: "Trois outils qui ouvrent chacun une fenêtre : comprendre l'erreur, la signaler, ou repartir.", decl: { C: 5, N: 7, P: 7, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.H(MSG, "1", { fontSize: "38px", textAlign: "center" }),
      k.row([
        W(k, "modal", { buttonLabel: "Comprendre l'erreur 404", variant: "primary", title: "Que signifie une erreur 404 ?", text: "<p>Le serveur fonctionne, mais aucune page ne correspond à l'adresse demandée.</p>", ctaLabel: "Retour à l'accueil", ctaUrl: "/" }),
        W(k, "modal", { buttonLabel: "Signaler le problème", variant: "outline", title: "Signaler un lien cassé", text: "<p>Indiquez-nous l'adresse et la page d'où vous venez.</p>", ctaLabel: "Écrire au support", ctaUrl: "/contact" }),
        W(k, "modal", { buttonLabel: "Repartir ailleurs", variant: "outline", title: "Où aller ?", text: "<p>L'accueil, le blog et le catalogue sont toujours là.</p>", ctaLabel: "Aller au catalogue", ctaUrl: "/catalogue" }),
      ], { gap: "14px", justifyContent: "center" }),
    ], { gap: "22px", width: "100%" })])] },
];
