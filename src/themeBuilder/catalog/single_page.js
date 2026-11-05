// Catalogue « Page individuelle » : 100 modèles de PAGES (à propos, contact, services, équipe, aide, tarifs, preuves, carrières, juridique, campagnes), 10 familles × 10 compositions.
// Chaque modèle est une composition à lui (ouverture + corps + conclusion) et non une variante de couleur : le test `theme-builder-page-individuelle-100` exige 100 signatures de structure différentes.
// Le titre {{post.title}} et le contenu (postcontent) de la page sont toujours présents. Les textes d'exemple sont des CONSIGNES entre crochets à remplacer : aucun chiffre, prix, témoignage,
// adresse, nom ou lien inventé. Les éléments sont ceux, natifs, du Page Builder (flex / grille, points de rupture tablette et mobile du kit) : aucun positionnement absolu.
const L = (key, label, tags, desc, skin, build) => ({ key, label, tags, desc, skin, build });
const TITLE = "{{post.title}}";
const p = (t) => `<p>${t}</p>`;
const SOC = [{ network: "facebook", url: "https://www.facebook.com/" }, { network: "linkedin", url: "https://www.linkedin.com/" }];
const NARROW = (max) => ({ maxWidth: max, marginLeft: "auto", marginRight: "auto", width: "100%" });

// ───────────────────────── Ouvertures (10 compositions du haut de page) ─────────────────────────
// o = { eyebrow, lede, cta: [label, url] } ; chaque ouverture contient le titre de la page.
const HEROES = [
  // 0 · bandeau centré sur fond d'accent
  (k, o) => [k.band([k.inner([k.col([k.L(o.eyebrow, { color: k.S.onAccent }), k.H(TITLE, "1", { fontSize: "50px", textAlign: "center", color: k.S.onAccent }), k.T(p(o.lede), { textAlign: "center", fontSize: "19px", color: k.S.onAccent }), k.row([k.B(o.cta[0], o.cta[1], "outline", { backgroundColor: k.S.onAccent, color: k.S.accent, borderColor: k.S.onAccent })], { justifyContent: "center" })], { alignItems: "center", maxWidth: "720px" })], { justifyContent: "center" })], { backgroundColor: k.S.accent, color: k.S.onAccent, paddingTop: "88px", paddingBottom: "88px" }, null, null, "Ouverture")],
  // 1 · deux colonnes : texte à gauche, image mise en avant à droite
  (k, o) => [k.section([k.grid(2, [k.col([k.L(o.eyebrow), k.H(TITLE, "1", { fontSize: "46px" }), k.T(p(o.lede), { fontSize: "18px", color: k.S.mute }), k.row([k.B(o.cta[0], o.cta[1])])], { gap: "18px" }), k.img("post.image", { maxHeight: "420px" })], { gridTemplate: "1fr 1fr", alignItems: "center" })], NARROW("1120px"))],
  // 2 · sobre, aligné à gauche, filet sous le titre
  (k, o) => [k.section([k.L(o.eyebrow), k.H(TITLE, "1", { fontSize: "42px" }), k.divider(), k.T(p(o.lede), { fontSize: "18px", color: k.S.mute })], NARROW("860px"))],
  // 3 · bandeau gris avec fil d'Ariane
  (k, o) => [k.band([k.inner([k.col([k.W("breadcrumb", { items: [{ label: "Accueil", url: "/" }, { label: o.eyebrow }], separator: "slash" }), k.H(TITLE, "1", { fontSize: "40px" }), k.T(p(o.lede), { color: k.S.mute })], { gap: "12px", width: "100%" })], { justifyContent: "flex-start" })], { backgroundColor: k.S.alt, paddingTop: "56px", paddingBottom: "56px" }, null, null, "Ouverture")],
  // 4 · carte centrée
  (k, o) => [k.section([k.card([k.W("badge", { text: o.eyebrow, tone: "neutral" }), k.H(TITLE, "1", { textAlign: "center", fontSize: "40px" }), k.divider(), k.T(p(o.lede), { textAlign: "center", color: k.S.mute }), k.row([k.B(o.cta[0], o.cta[1])], { justifyContent: "center" })], { paddingTop: "48px", paddingBottom: "48px", paddingLeft: "40px", paddingRight: "40px", gap: "16px", alignItems: "center" })], NARROW("780px"))],
  // 5 · éditorial : très grand titre, filet, chapô en deux temps
  (k, o) => [k.section([k.L(o.eyebrow), k.H(TITLE, "1", { fontSize: "64px", lineHeight: 1.05 }), k.divider(), k.grid(2, [k.T(p(o.lede), { fontSize: "20px" }), k.row([k.B(o.cta[0], o.cta[1], "outline")], { justifyContent: "flex-end" })], { gridTemplate: "2fr 1fr", alignItems: "center" })], NARROW("1100px"))],
  // 6 · menu de la section à gauche, titre et chapô à droite
  (k, o) => [k.section([k.grid(2, [k.card([k.L("Dans cette section"), k.menu("header", { fontSize: "15px" }, true)]), k.col([k.H(TITLE, "1", { fontSize: "40px" }), k.T(p(o.lede), { color: k.S.mute, fontSize: "18px" })], { gap: "14px" })], { gridTemplate: "1fr 3fr", alignItems: "start" })], NARROW("1120px"))],
  // 7 · titre et bouton sur une même ligne
  (k, o) => [k.section([k.row([k.col([k.L(o.eyebrow), k.H(TITLE, "1", { fontSize: "40px" })], { gap: "6px" }), k.B(o.cta[0], o.cta[1])], { justifyContent: "space-between", alignItems: "flex-end" }), k.T(p(o.lede), { color: k.S.mute, fontSize: "18px" })], NARROW("1040px"))],
  // 8 · visuel pleine largeur puis titre centré
  (k, o) => [k.img("post.image", { maxHeight: "380px", borderRadius: "0px" }), k.section([k.L(o.eyebrow, { textAlign: "center" }), k.H(TITLE, "1", { textAlign: "center", fontSize: "44px" }), k.T(p(o.lede), { textAlign: "center", color: k.S.mute, fontSize: "18px" })], NARROW("760px"))],
  // 9 · bandeau sombre : pastille, titre et deux boutons
  (k, o) => [k.band([k.inner([k.col([k.W("badge", { text: o.eyebrow, tone: "primary" }), k.H(TITLE, "1", { fontSize: "48px", color: "#f1f5f9", textAlign: "center" }), k.T(p(o.lede), { color: "#cbd5e1", textAlign: "center" }), k.row([k.B(o.cta[0], o.cta[1], "solid", { backgroundColor: "#f1f5f9", color: "#0b1220" }), k.B("Nous écrire", "/contact", "outline", { color: "#f1f5f9", borderColor: "#f1f5f9" })], { justifyContent: "center" })], { alignItems: "center", maxWidth: "720px" })], { justifyContent: "center" })], { backgroundColor: "#0b1220", color: "#f1f5f9", paddingTop: "92px", paddingBottom: "92px" }, null, null, "Ouverture")],
];

// ───────────────────────── Conclusions (6 compositions) ─────────────────────────
const TAILS = [
  (k, t) => [k.band([k.inner([k.col([k.H(t.title, "2", { color: k.S.onAccent, textAlign: "center" }), k.T(p(t.text), { color: k.S.onAccent, textAlign: "center" }), k.row([k.B(t.cta[0], t.cta[1], "outline", { backgroundColor: k.S.onAccent, color: k.S.accent, borderColor: k.S.onAccent })], { justifyContent: "center" })], { alignItems: "center", width: "100%" })], { justifyContent: "center" })], { backgroundColor: k.S.accent, color: k.S.onAccent, paddingTop: "64px", paddingBottom: "64px" }, null, null, "Appel à l'action")],
  (k, t) => [k.section([k.card([k.row([k.col([k.H(t.title, "3"), k.T(p(t.text), { color: k.S.mute })], { gap: "6px", flexGrow: 1 }), k.B(t.cta[0], t.cta[1])], { justifyContent: "space-between", alignItems: "center", gap: "24px" })], { paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px" })], NARROW("1040px"))],
  (k, t, env) => [k.section([k.grid(2, [k.col([k.H(t.title, "2"), k.T(p(t.text), { color: k.S.mute })], { gap: "10px" }), env && env.formId ? k.W("signupform", { formId: env.formId, heading: "Restons en contact", intro: "Laissez votre adresse pour être prévenu.", button: "Envoyer" }, { width: "100%" }) : k.card([k.T(p("Aucun formulaire n'existe encore sur ce site : créez-en un dans Formulaires, puis remplacez cette carte."), { color: k.S.mute }), k.B(t.cta[0], t.cta[1])])], { gridTemplate: "1fr 1fr", alignItems: "center" })], NARROW("1040px"))],
  (k, t) => [k.section([k.divider(), k.row([k.T(p(t.text), { fontWeight: "600" }), k.social(SOC)], { justifyContent: "space-between", gap: "16px" })], NARROW("1040px"))],
  (k, t) => [k.band([k.inner([k.col([k.H(t.title, "2", { textAlign: "center" }), k.row([k.B(t.cta[0], t.cta[1]), k.B("Nous écrire", "/contact", "outline")], { justifyContent: "center" })], { alignItems: "center", width: "100%" })], { justifyContent: "center" })], { backgroundColor: k.S.alt, paddingTop: "56px", paddingBottom: "56px" }, null, null, "Conclusion")],
  () => [],
];

// ───────────────────────── Corps de page (blocs réutilisables) ─────────────────────────
const content = (k, st = {}, tab, mob) => k.W("postcontent", {}, st, tab, mob);
const box = (k, icon, title, text) => k.W("iconbox", { icon, title, text: p(text), titleLevel: "3", position: "top", size: "32" });
const boxes = (k, n, rows) => k.grid(n, rows.map(([i, t, x]) => box(k, i, t, x)));
const cards = (k, n, rows) => k.grid(n, rows.map(([i, t, x]) => k.card([box(k, i, t, x)])));
const steps = (k, rows) => k.W("timeline", { items: rows.map(([d, t, x]) => ({ date: d, title: t, text: p(x) })) });
const faq = (k, n = 4) => k.W("accordion", { items: Array.from({ length: n }, (_, i) => ({ q: `[Question ${i + 1} : écrivez-la comme votre public la formule]`, a: "[Rédigez la réponse : elle doit venir de vous, pas de ce modèle.]" })) });
const tabs = (k, titles) => k.W("tabs", { items: titles.map((t) => ({ title: t, text: p("[Décrivez ce point en deux ou trois phrases.]") })) });
const person = (k, role) => k.W("profilecard", { name: "[Nom et prénom]", role, bio: "[Deux phrases de présentation, rédigées avec la personne.]", align: "center" });
const plan = (k, name, hl) => k.W("pricing", { title: name, price: "[Prix à renseigner]", period: "[période]", description: "[À qui s'adresse cette offre]", features: ["[Avantage 1]", "[Avantage 2]", "[Avantage 3]"], ctaLabel: "Choisir", ctaUrl: "/contact", highlight: !!hl });
const quote = (k) => k.W("testimonial", { text: "[Citation réelle d'une personne, publiée avec son accord.]", name: "[Nom de la personne]", role: "[Fonction, organisation]" });
const note = (k, tone, title, text) => k.W("alert", { tone, title, text });
const toc = (k) => k.W("toc", { title: "Sur cette page", depth: "3", numbered: true });
const contactCard = (k, title) => k.card([k.H(title, "3"), k.T(p("[Indiquez vos horaires et la manière de vous joindre.]"), { color: k.S.mute }), k.B("Écrire un message", "/contact"), k.row([k.social(SOC)])]);
const map = (k) => k.W("map", { address: "[Adresse ou lieu à renseigner]", zoom: 14, height: 320, title: "Plan d'accès" });
const sect = (k, kids, max = "1100px") => k.section(kids, NARROW(max));
const head = (k, t, sub) => [k.H(t, "2"), ...(sub ? [k.T(p(sub), { color: k.S.mute })] : [])];
const form = (k, env, heading, intro, button) => (env && env.formId ? k.W("signupform", { formId: env.formId, heading, intro, button }, { width: "100%" }) : contactCard(k, heading));

// Un corps = fonction (k, env) → liste d'éléments de page. 5 compositions par famille.
const BODIES = {
  apropos: [
    (k) => [sect(k, [content(k), ...head(k, "Nos valeurs"), boxes(k, 3, [["heart", "[Valeur 1]", "[Ce que cela change concrètement pour vous.]"], ["shield", "[Valeur 2]", "[Ce que cela change concrètement pour vous.]"], ["star", "[Valeur 3]", "[Ce que cela change concrètement pour vous.]"]])])],
    (k) => [sect(k, [k.grid(2, [content(k), k.img("post.image", { maxHeight: "460px" })], { gridTemplate: "3fr 2fr", alignItems: "start" })]), sect(k, [...head(k, "Notre parcours"), steps(k, [["[Année]", "[Étape 1]", "[Ce qui s'est passé.]"], ["[Année]", "[Étape 2]", "[Ce qui s'est passé.]"], ["[Année]", "[Étape 3]", "[Ce qui s'est passé.]"]])], "820px")],
    (k) => [sect(k, [content(k)], "820px"), sect(k, [k.grid(2, [k.card([k.H("Notre mission", "3"), k.T(p("[Une phrase qui dit pourquoi vous existez.]"), { color: k.S.mute })]), k.card([k.H("Notre vision", "3"), k.T(p("[Une phrase qui dit où vous allez.]"), { color: k.S.mute })])])])],
    (k) => [sect(k, [content(k)], "820px"), sect(k, [quote(k)], "820px")],
    (k) => [sect(k, [k.grid(2, [k.col([...head(k, "Qui sommes-nous ?"), content(k)]), tabs(k, ["Mission", "Histoire", "Engagements"])], { gridTemplate: "1fr 1fr", alignItems: "start" })])],
  ],
  contact: [
    (k) => [sect(k, [k.grid(2, [content(k), contactCard(k, "Nous joindre")], { gridTemplate: "3fr 2fr", alignItems: "start" })])],
    (k, env) => [sect(k, [k.grid(2, [form(k, env, "Écrivez-nous", "Nous répondons dès que possible.", "Envoyer"), content(k)], { gridTemplate: "1fr 1fr", alignItems: "start" })])],
    (k) => [sect(k, [content(k), map(k)]), sect(k, [k.grid(3, [box(k, "mail", "Par e-mail", "[Votre adresse de contact.]"), box(k, "clock", "Horaires", "[Vos horaires d'ouverture.]"), box(k, "mapPin", "Sur place", "[Votre adresse.]")])])],
    (k) => [sect(k, [content(k)], "820px"), sect(k, [k.grid(3, [box(k, "messageSquare", "Une question", "[Réponse sous combien de temps.]"), box(k, "calendarClock", "Un rendez-vous", "[Comment le prendre.]"), box(k, "help", "Une aide", "[Où trouver les réponses.]")])]), sect(k, [faq(k, 3)], "820px")],
    (k) => [sect(k, [k.grid(2, [k.col([content(k), k.social(SOC)]), k.col([map(k), contactCard(k, "Nous rendre visite")])], { gridTemplate: "1fr 1fr", alignItems: "start" })])],
  ],
  services: [
    (k) => [sect(k, [content(k), ...head(k, "Nos services"), cards(k, 3, [["layers", "[Service 1]", "[Ce qu'il comprend.]"], ["zap", "[Service 2]", "[Ce qu'il comprend.]"], ["shield", "[Service 3]", "[Ce qu'il comprend.]"]])])],
    (k) => [sect(k, [content(k)], "820px"), sect(k, [...head(k, "Comment nous travaillons"), steps(k, [["1", "[Découverte]", "[Ce que nous faisons.]"], ["2", "[Mise en œuvre]", "[Ce que nous faisons.]"], ["3", "[Suivi]", "[Ce que nous faisons.]"]])], "820px")],
    (k) => [sect(k, [k.grid(2, [content(k), k.card([k.H("Ce qui est inclus", "3"), k.W("iconlist", { items: ["[Inclus 1]", "[Inclus 2]", "[Inclus 3]"].map((text) => ({ text, icon: "check" })) }), k.B("Demander un devis", "/contact")])], { gridTemplate: "3fr 2fr", alignItems: "start" })])],
    (k) => [sect(k, [content(k), tabs(k, ["[Service A]", "[Service B]", "[Service C]"])], "900px")],
    (k) => [sect(k, [...head(k, "Nos domaines", "[Une phrase pour situer vos domaines d'intervention.]"), boxes(k, 4, [["layers", "[Domaine 1]", "[En une ligne.]"], ["users", "[Domaine 2]", "[En une ligne.]"], ["trendingUp", "[Domaine 3]", "[En une ligne.]"], ["settings", "[Domaine 4]", "[En une ligne.]"]])]), sect(k, [content(k)], "820px")],
  ],
  equipe: [
    (k) => [sect(k, [content(k), k.grid(3, [person(k, "[Fonction]"), person(k, "[Fonction]"), person(k, "[Fonction]")])])],
    (k) => [sect(k, [content(k)], "820px"), sect(k, [k.grid(4, [person(k, "[Fonction]"), person(k, "[Fonction]"), person(k, "[Fonction]"), person(k, "[Fonction]")])])],
    (k) => [sect(k, [content(k), k.W("querylist", { title: "Nos auteurs", source: "authors", mode: "popular", count: 6, layout: "cards", showExcerpt: true })], "1000px")],
    (k) => [sect(k, [k.grid(2, [k.col([...head(k, "Une équipe, des métiers"), content(k)]), k.grid(2, [person(k, "[Fonction]"), person(k, "[Fonction]")])], { gridTemplate: "1fr 1fr", alignItems: "start" })])],
    (k) => [sect(k, [content(k), ...head(k, "Notre manière de travailler"), boxes(k, 3, [["users", "[Principe 1]", "[En une ligne.]"], ["messageSquare", "[Principe 2]", "[En une ligne.]"], ["checkCircle", "[Principe 3]", "[En une ligne.]"]])]), sect(k, [k.grid(3, [person(k, "[Fonction]"), person(k, "[Fonction]"), person(k, "[Fonction]")])])],
  ],
  aide: [
    (k) => [sect(k, [content(k), ...head(k, "Questions fréquentes"), faq(k, 5)], "820px")],
    (k) => [sect(k, [k.grid(2, [k.card([k.L("Rubriques"), k.menu("header", { fontSize: "15px" }, true)]), k.col([content(k), faq(k, 4)])], { gridTemplate: "1fr 3fr", alignItems: "start" })])],
    (k) => [sect(k, [content(k), tabs(k, ["[Rubrique 1]", "[Rubrique 2]", "[Rubrique 3]"])], "900px"), sect(k, [faq(k, 3)], "820px")],
    (k) => [sect(k, [toc(k), content(k)], "800px"), sect(k, [note(k, "info", "Besoin d'aide ?", "[Dites comment vous joindre si la réponse n'est pas ici.]")], "800px")],
    (k) => [sect(k, [boxes(k, 3, [["book", "[Guide 1]", "[Ce qu'on y trouve.]"], ["video", "[Guide 2]", "[Ce qu'on y trouve.]"], ["help", "[Guide 3]", "[Ce qu'on y trouve.]"]]), content(k), faq(k, 4)], "960px")],
  ],
  tarifs: [
    (k) => [sect(k, [content(k), k.grid(3, [plan(k, "[Offre 1]"), plan(k, "[Offre 2]", true), plan(k, "[Offre 3]")])])],
    (k) => [sect(k, [content(k)], "820px"), sect(k, [k.grid(2, [plan(k, "[Offre mensuelle]"), plan(k, "[Offre annuelle]", true)])], "900px"), sect(k, [faq(k, 3)], "820px")],
    (k) => [sect(k, [content(k), k.W("table", { header: true, rows: [["[Fonction]", "[Offre 1]", "[Offre 2]", "[Offre 3]"], ["[Ligne 1]", "[ ]", "[ ]", "[ ]"], ["[Ligne 2]", "[ ]", "[ ]", "[ ]"], ["[Ligne 3]", "[ ]", "[ ]", "[ ]"]] })], "1000px")],
    (k) => [sect(k, [k.grid(2, [content(k), k.col([plan(k, "[Offre principale]", true), note(k, "info", "À savoir", "[Conditions, taxes, engagement : à préciser.]")])], { gridTemplate: "3fr 2fr", alignItems: "start" })])],
    (k) => [sect(k, [content(k), tabs(k, ["[Particuliers]", "[Équipes]", "[Organisations]"])], "900px"), sect(k, [k.grid(3, [plan(k, "[Offre 1]"), plan(k, "[Offre 2]", true), plan(k, "[Offre 3]")])])],
  ],
  preuves: [
    (k) => [sect(k, [content(k), k.grid(3, [quote(k), quote(k), quote(k)])])],
    (k) => [sect(k, [content(k)], "820px"), sect(k, [k.grid(2, [quote(k), quote(k)])], "960px")],
    (k) => [sect(k, [content(k), ...head(k, "Réalisations"), cards(k, 3, [["layout", "[Projet 1]", "[Contexte et résultat.]"], ["layout", "[Projet 2]", "[Contexte et résultat.]"], ["layout", "[Projet 3]", "[Contexte et résultat.]"]])])],
    (k) => [sect(k, [k.grid(2, [content(k), k.col([quote(k), quote(k)])], { gridTemplate: "3fr 2fr", alignItems: "start" })])],
    (k) => [sect(k, [content(k), tabs(k, ["[Projet A]", "[Projet B]", "[Projet C]"])], "900px"), sect(k, [quote(k)], "820px")],
  ],
  carrieres: [
    (k) => [sect(k, [content(k), ...head(k, "Pourquoi nous rejoindre"), boxes(k, 3, [["heart", "[Atout 1]", "[En une ligne.]"], ["trendingUp", "[Atout 2]", "[En une ligne.]"], ["users", "[Atout 3]", "[En une ligne.]"]])])],
    (k) => [sect(k, [content(k)], "820px"), sect(k, [...head(k, "Notre processus de recrutement"), steps(k, [["1", "[Candidature]", "[Ce qui se passe.]"], ["2", "[Entretien]", "[Ce qui se passe.]"], ["3", "[Décision]", "[Ce qui se passe.]"]])], "820px")],
    (k) => [sect(k, [k.grid(2, [content(k), k.card([k.H("Postuler", "3"), k.T(p("[Comment envoyer une candidature.]"), { color: k.S.mute }), k.B("Candidater", "/contact")])], { gridTemplate: "3fr 2fr", alignItems: "start" })])],
    (k) => [sect(k, [content(k), ...head(k, "Offres ouvertes"), faq(k, 4)], "860px")],
    (k) => [sect(k, [...head(k, "Notre culture"), cards(k, 2, [["users", "[Principe 1]", "[Comment il se vit au quotidien.]"], ["sparkles", "[Principe 2]", "[Comment il se vit au quotidien.]"]]), content(k)], "960px")],
  ],
  juridique: [
    (k) => [sect(k, [content(k)], "760px")],
    (k) => [sect(k, [k.grid(2, [k.card([toc(k)]), content(k)], { gridTemplate: "1fr 3fr", alignItems: "start" })])],
    (k) => [sect(k, [note(k, "info", "Dernière mise à jour", "[Date à renseigner par vous.]"), toc(k), content(k)], "800px")],
    (k) => [sect(k, [content(k, { columnCount: 2, columnGap: "40px" }, { columnCount: 1 }, { columnCount: 1 })])],
    (k) => [sect(k, [content(k), k.divider(), note(k, "warning", "Contact pour vos droits", "[Indiquez ici l'adresse à laquelle exercer vos droits.]")], "780px")],
  ],
  campagne: [
    (k) => [sect(k, [content(k), cards(k, 3, [["zap", "[Bénéfice 1]", "[En une ligne.]"], ["shield", "[Bénéfice 2]", "[En une ligne.]"], ["trendingUp", "[Bénéfice 3]", "[En une ligne.]"]])])],
    (k) => [sect(k, [k.grid(2, [content(k), k.col([k.W("countdown", { until: "2099-01-01T09:00:00Z" }), note(k, "info", "Date à confirmer", "[Remplacez la date du compte à rebours.]")])], { gridTemplate: "3fr 2fr", alignItems: "start" })])],
    (k) => [sect(k, [content(k)], "820px"), sect(k, [...head(k, "Programme"), steps(k, [["[Heure]", "[Temps 1]", "[Contenu.]"], ["[Heure]", "[Temps 2]", "[Contenu.]"], ["[Heure]", "[Temps 3]", "[Contenu.]"]])], "820px")],
    (k, env) => [sect(k, [k.grid(2, [content(k), form(k, env, "Je m'inscris", "Renseignez vos coordonnées.", "M'inscrire")], { gridTemplate: "1fr 1fr", alignItems: "start" })])],
    (k) => [sect(k, [k.card([box(k, "checkCircle", "[Titre de confirmation]", "[Ce qui se passe ensuite.]"), content(k), k.row([k.B("Retour à l'accueil", "/", "outline")])], { alignItems: "center", paddingTop: "48px", paddingBottom: "48px" })], "720px")],
  ],
};

// ───────────────────────── Les 100 modèles ─────────────────────────
// 10 familles × 10 modèles. Chaque modèle fixe son nom, son ouverture (0-9, une permutation par famille), son corps (0-4), sa conclusion (0-5) et son identité visuelle.
const SKINS_ORDER = ["clair", "doux", "editorial", "marque", "nuit"];
const FAMILIES = [
  { id: "apropos", tag: "à propos", eyebrow: "À propos", cta: ["Nous contacter", "/contact"], tail: { title: "Parlons de votre projet", text: "[Invitez à prendre contact.]", cta: ["Nous contacter", "/contact"] },
    names: ["À propos classique", "Notre histoire", "Entreprise : mission et vision", "Association : qui nous sommes", "Présentation d'entreprise", "Notre manifeste", "Une équipe, une vocation", "Nos valeurs", "Notre engagement", "Présentation institutionnelle"] },
  { id: "contact", tag: "contact", eyebrow: "Contact", cta: ["Écrire un message", "/contact"], tail: { title: "Une autre question ?", text: "[Dites où vous trouver.]", cta: ["Nous écrire", "/contact"] },
    names: ["Contact et coordonnées", "Formulaire de contact", "Contact avec plan d'accès", "Contact avec trois canaux", "Nous rendre visite", "Contact minimaliste", "Contact en bandeau", "Prendre rendez-vous", "Contact et FAQ", "Contact en carte"] },
  { id: "services", tag: "services", eyebrow: "Services", cta: ["Demander un devis", "/contact"], tail: { title: "Un besoin précis ?", text: "[Invitez à demander un devis.]", cta: ["Demander un devis", "/contact"] },
    names: ["Services en trois colonnes", "Services et méthode", "Service détaillé avec devis", "Services par onglets", "Domaines d'intervention", "Offre de services en bandeau", "Présentation d'un service SaaS", "Service et processus", "Catalogue de prestations", "Service unique mis en avant"] },
  { id: "equipe", tag: "équipe", eyebrow: "L'équipe", cta: ["Nous rejoindre", "/contact"], tail: { title: "Rejoignez l'équipe", text: "[Dites quels profils vous cherchez.]", cta: ["Nous rejoindre", "/contact"] },
    names: ["Équipe en trois portraits", "Équipe en quatre colonnes", "Équipe et auteurs du site", "Équipe et métiers", "Équipe et manière de travailler", "Équipe dirigeante", "Équipe pédagogique", "Les membres de l'association", "Équipe en deux temps", "Équipe en bandeau"] },
  { id: "aide", tag: "aide", eyebrow: "Aide", cta: ["Nous écrire", "/contact"], tail: { title: "Vous ne trouvez pas ?", text: "[Dites comment obtenir de l'aide.]", cta: ["Nous écrire", "/contact"] },
    names: ["FAQ simple", "FAQ avec rubriques", "FAQ par onglets", "Centre d'aide avec sommaire", "Centre d'aide en guides", "FAQ du produit", "FAQ de l'association", "FAQ pratique", "FAQ en carte", "FAQ éditoriale"] },
  { id: "tarifs", tag: "tarifs", eyebrow: "Tarifs", cta: ["Choisir une offre", "/contact"], tail: { title: "Une question sur les offres ?", text: "[Précisez les conditions.]", cta: ["Nous contacter", "/contact"] },
    names: ["Trois offres", "Offre mensuelle ou annuelle", "Comparatif des offres", "Offre principale mise en avant", "Tarifs par profil", "Tarifs en bandeau", "Tarifs SaaS", "Tarifs de l'association", "Tarifs détaillés", "Tarifs minimalistes"] },
  { id: "preuves", tag: "preuves", eyebrow: "Références", cta: ["Nous contacter", "/contact"], tail: { title: "Rejoignez-les", text: "[Invitez à passer à l'action.]", cta: ["Nous contacter", "/contact"] },
    names: ["Témoignages en trois citations", "Témoignages et références", "Portfolio de réalisations", "Témoignages avec présentation", "Études de cas par onglets", "Réalisations en bandeau", "Avis clients", "Références institutionnelles", "Portfolio minimal", "Preuves sociales"] },
  { id: "carrieres", tag: "carrières", eyebrow: "Carrières", cta: ["Candidater", "/contact"], tail: { title: "Aucune offre ne vous correspond ?", text: "[Invitez aux candidatures spontanées.]", cta: ["Candidater", "/contact"] },
    names: ["Carrières et atouts", "Processus de recrutement", "Postuler en carte", "Offres ouvertes", "Notre culture", "Rejoindre l'association", "Stages et alternance", "Bénévolat", "Carrières en bandeau", "Recrutement sobre"] },
  { id: "juridique", tag: "juridique", eyebrow: "Informations légales", cta: ["Nous contacter", "/contact"], tail: { title: "Une question sur vos données ?", text: "[Indiquez le contact dédié.]", cta: ["Nous contacter", "/contact"] },
    names: ["Politique de confidentialité", "Conditions d'utilisation avec sommaire", "Mentions légales datées", "Conditions générales en colonnes", "Politique de cookies", "Mentions légales sobres", "Charte d'utilisation", "Politique de remboursement", "Conditions de service", "Informations légales en bandeau"] },
  { id: "campagne", tag: "campagne", eyebrow: "À venir", cta: ["Je m'inscris", "/contact"], tail: { title: "Ne manquez pas le lancement", text: "[Invitez à s'inscrire.]", cta: ["Je m'inscris", "/contact"] },
    names: ["Lancement de produit", "Événement avec compte à rebours", "Événement et programme", "Page d'inscription", "Page de confirmation", "Lancement en bandeau", "Webinaire", "Campagne de soutien", "Annonce d'ouverture", "Page de remerciement"] },
];
// Une permutation de 0-9 par famille : deux modèles d'une même famille n'ont jamais la même ouverture.
const OPEN = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 3, 5, 0, 8, 2, 9, 4, 6, 7], [2, 5, 7, 4, 9, 1, 0, 3, 8, 6], [3, 0, 8, 6, 2, 9, 4, 1, 7, 5], [4, 6, 1, 7, 3, 0, 9, 2, 5, 8],
  [5, 9, 3, 8, 6, 4, 1, 0, 2, 7], [6, 2, 9, 1, 7, 8, 3, 5, 0, 4], [7, 4, 0, 5, 1, 6, 2, 9, 3, 8], [8, 7, 6, 9, 5, 3, 0, 4, 1, 2], [9, 8, 4, 2, 0, 7, 5, 6, 3, 1],
];

const layouts = [];
FAMILIES.forEach((fam, fi) => fam.names.forEach((label, vi) => {
  const open = OPEN[fi][vi], body = (vi + (vi >= 5 ? 1 : 0)) % 5, tail = (vi + fi * 2) % 6;
  layouts.push(L(`${fam.id}-${String(vi + 1).padStart(2, "0")}`, label, [fam.tag, label.toLowerCase()], `${label}.`, SKINS_ORDER[(fi + vi) % 5], (k, env) => [
    ...HEROES[open](k, { eyebrow: fam.eyebrow, lede: "[Une phrase qui annonce le sujet de la page — à remplacer par vos mots.]", cta: fam.cta }),
    ...BODIES[fam.id][body](k, env),
    ...TAILS[tail](k, fam.tail, env),
  ]));
}));

// Catalogue à entrées propres : chaque modèle porte sa composition ET son identité (pas de croisement mises en page × identités)
const entries = () => layouts.map((l) => ({ key: `${l.key}.${l.skin}`, layoutKey: l.key, layoutId: l.key, skinKey: l.skin, name: l.label, layoutLabel: l.label, desc: l.desc, tags: [...l.tags, l.skin], build: l.build }));

module.exports = { type: "single_page", kind: "page", layouts, entries };
