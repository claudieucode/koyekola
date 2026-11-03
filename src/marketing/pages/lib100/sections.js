// Programme 100 : sections supplémentaires. Sections libres natives (layout > container > éléments du registre nodes.js).
// Aucun faux chiffre, prix, nom, adresse ni témoignage : tout texte entre crochets est à remplacer. Aucune image : les visuels sont des emplacements.
const SOON = "2026-12-31T23:00:00Z"; // date de départ du compte à rebours : à régler dans l'éditeur

const entries = (kit) => {
  const { H, T, B, I, card, section, cols, grid, listCourses } = kit;
  const P = (t) => T(`<p>${t}</p>`);
  const ph = (name, minHeight = "280px", extra = {}) => ({ type: "container", name, children: [], styles: { desktop: { minHeight, borderRadius: "16px", backgroundColor: "token:surface", ...extra }, mobile: { minHeight: "200px" } } });
  const row = (children, extra = {}) => ({ type: "group", children, styles: { desktop: { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "12px", alignItems: "center", ...extra } } });
  const col = (children, extra = {}) => ({ type: "stack", children, styles: { desktop: { gap: "16px", ...extra } } });
  const ctr = (label, extra = {}) => ({ type: "counter", props: { value: 0, label, ...extra } });
  const badge = (text, tone = "primary") => ({ type: "badge", props: { text, tone } });
  const list = (items, ordered = false) => ({ type: "list", props: { items, ordered } });
  const ilist = (items, extra = {}) => ({ type: "iconlist", props: { items: items.map((x) => (typeof x === "string" ? { text: x, icon: "check" } : { text: x[0], icon: x[1] })), ...extra } });
  const split = (a, b, extra = {}) => ({ type: "grid", children: [a, b], styles: { desktop: extra.gridTemplate ? { gap: "48px", alignItems: "center", ...extra } : { columns: 2, gap: "48px", alignItems: "center", ...extra }, tablet: { columns: 1 }, mobile: { columns: 1, gap: "24px" } } });
  const mid = { textAlign: "center" };
  const qs = (a, b) => ({ q: a, a: b });
  const faqItems = (n, p = "") => Array.from({ length: n }, (_, i) => qs(`[Question ${p}${i + 1} ?]`, "[Réponse claire et vérifiable.]"));
  const onPrimary = { backgroundColor: "token:primary", borderRadius: "16px", maxWidth: "1100px" };
  const iconbox = (icon, title, extra = {}) => ({ type: "iconbox", props: { icon, title, text: "[Ce que cela change concrètement.]", titleLevel: "3", position: "top", size: "48", ...extra } });
  const testi = (extra = {}) => ({ type: "testimonial", props: { text: "[Témoignage réel, reproduit avec l'accord de la personne.]", name: "[Prénom N.]", role: "[Fonction]", ...extra } });
  const E = [];
  const add = (key, category, label, build) => E.push({ key, category, label, build });

  // ---------- En-tête ----------
  add("hero-asymetrique", "En-tête", "Bandeau asymétrique texte + image", () => [section([cols(2, (i) => (i === 0 ? [
    badge("[Nouveauté ou repère]"), H("[Le résultat que vous promettez]", "1", { fontSize: "36px" }), P("[Une phrase qui dit pour qui, et ce qui change pour eux.]"), row([B("[Action principale]"), B("[Action secondaire]", "/contact", "outline")])] : [ph("Emplacement de l'image", "360px")]))], { paddingTop: "96px", paddingBottom: "96px" })]);
  add("hero-plein-ecran", "En-tête", "Bandeau plein écran avec titre animé", () => [section([
    { type: "animatedheading", props: { before: "[Votre promesse :", words: ["[premier mot]", "[deuxième mot]", "[troisième mot]"], after: "]", level: "1", effect: "fade" }, styles: { desktop: { textAlign: "center", fontSize: "56px", color: "token:on-primary" }, mobile: { fontSize: "36px" } } },
    P("[Une phrase qui dit ce que la personne trouve ici.]"), B("[Commencer]", "/catalogue", "outline")], { minHeight: "560px", justifyContent: "center", alignItems: "center", textAlign: "center", gradient: { from: "token:primary", to: "token:secondary", angle: 160 } })]);
  add("hero-reassurance", "En-tête", "Bandeau avec bande de réassurance", () => [section([
    H("[Le résultat que vous promettez]", "1", { ...mid, fontSize: "48px" }), P("[Une phrase qui dit pour qui, et ce qui change pour eux.]"), row([B("[Action principale]")], { justifyContent: "center" }),
    { type: "divider", props: {} }, grid(4, [["shield", "[Garantie]"], ["clock", "[Livraison ou accès]"], ["lock", "[Paiement sécurisé]"], ["heart", "[Support humain]"]].map((x) => row([I(x[0]), T(`<p>${x[1]}</p>`)], { justifyContent: "center", flexWrap: "nowrap" })))], { alignItems: "center", paddingTop: "96px" })]);
  add("hero-invitation", "En-tête", "Bandeau avec carte d'inscription", () => [section([split(
    col([H("[Le titre qui donne envie de s'inscrire]", "1", { fontSize: "44px" }), P("[Ce que la personne reçoit en s'inscrivant.]"), ilist(["[Bénéfice 1]", "[Bénéfice 2]", "[Bénéfice 3]"])]),
    card([badge("[Places ou durée limitées]", "warning"), H("[Je m'inscris]", "3"), P("[Ce qui se passe après l'inscription.]"), B("[S'inscrire]", "/contact"), T("<p>[Mention de confidentialité ou de désinscription.]</p>", { fontSize: "14px", color: "token:muted" })], { boxShadow: "lg", gap: "16px" }))])]);
  add("hero-compte-a-rebours", "En-tête", "Bandeau avec compte à rebours", () => [section([
    badge("[Lancement]", "warning"), H("[Ce qui arrive bientôt]", "1", { ...mid, fontSize: "48px" }), P("[Ce que la personne gagne à être là dès le début.]"),
    { type: "countdown", props: { until: SOON, endText: "[C'est parti !]" } }, B("[Je suis prévenu]", "/contact")], { alignItems: "center", textAlign: "center", paddingTop: "96px", paddingBottom: "96px" })]);
  add("hero-onglets", "En-tête", "Bandeau avec onglets d'audiences", () => [section([
    H("[Une offre, plusieurs besoins]", "1", { ...mid, fontSize: "44px" }), P("[Choisissez votre profil pour voir ce qui vous concerne.]"),
    { type: "tabs", props: { items: [{ title: "[Profil A]", text: "[Ce que nous proposons à ce profil, et le premier pas à faire.]" }, { title: "[Profil B]", text: "[Ce que nous proposons à ce profil, et le premier pas à faire.]" }, { title: "[Profil C]", text: "[Ce que nous proposons à ce profil, et le premier pas à faire.]" }] } }], { alignItems: "center", maxWidth: "960px" })]);
  add("hero-video", "En-tête", "Bandeau avec vidéo de présentation", () => [section([cols(2, (i) => (i === 0 ? [ph("Emplacement de la vidéo de présentation", "320px")] : [H("[Voyez comment cela fonctionne]", "1", { fontSize: "32px" }), P("[Un résumé de la vidéo et de ce qu'elle apporte.]"), row([B("[Je commence]"), { type: "link", props: { label: "[Lire la transcription]", url: "/contact" } }])]))])]);
  add("hero-inverse-chiffres", "En-tête", "Bandeau inversé avec chiffres", () => [section([split(
    ph("Emplacement de l'image", "340px"),
    col([H("[Le titre principal]", "1", { fontSize: "44px" }), P("[Ce que vous faites, pour qui.]"), grid(2, [ctr("[ce que mesure ce chiffre]"), ctr("[ce que mesure ce chiffre]")]), B("[En savoir plus]")]))])]);
  add("hero-diaporama", "En-tête", "Bandeau diaporama", () => [{ type: "layout", children: [{ type: "container", children: [{ type: "slides", props: { label: "Diaporama d'accueil", slides: [{ title: "[Titre de la première diapositive]", text: "[Phrase d'appui.]" }, { title: "[Titre de la deuxième diapositive]", text: "[Phrase d'appui.]" }] } }, row([B("[Découvrir]", "/catalogue")], { justifyContent: "center" })], styles: { desktop: { paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px", gap: "24px" } } }] }]);
  add("hero-annonce", "En-tête", "Bandeau avec annonce et recherche", () => [section([
    { type: "alert", props: { tone: "info", title: "[Annonce]", text: "[Information importante du moment.]" } },
    H("[Que cherchez-vous ?]", "1", { fontSize: "48px" }), P("[Une phrase pour guider vers le bon contenu.]"), { type: "search", props: {} }, row([badge("[Thème 1]", "neutral"), badge("[Thème 2]", "neutral"), badge("[Thème 3]", "neutral")])], { maxWidth: "820px", paddingTop: "80px" })]);

  // ---------- Contenu ----------
  add("avantages-iconbox", "Contenu", "Avantages en boîtes d'icône", () => [section([H("[Ce que vous gagnez]", "2", mid), grid(3, [iconbox("zap", "[Avantage 1]"), iconbox("shield", "[Avantage 2]"), iconbox("heart", "[Avantage 3]")])])]);
  add("avantages-iconbox-cote", "Contenu", "Avantages icône à gauche (2 x 2)", () => [section([col([H("[Pourquoi nous]", "2"), P("[Une phrase d'introduction.]"), grid(2, ["star", "users", "clock", "globe"].map((ic, i) => iconbox(ic, `[Avantage ${i + 1}]`, { position: "left", size: "32" })))])])]);
  add("avantages-flipbox", "Contenu", "Cartes retournables (3)", () => [section([H("[Passez la souris pour découvrir]", "2", mid), grid(3, [1, 2, 3].map((n) => ({ type: "flipbox", props: { icon: "star", frontTitle: `[Thème ${n}]`, frontText: "[Accroche courte.]", backTitle: `[Détail ${n}]`, backText: "[Explication plus complète.]", ctaLabel: "[En savoir plus]", ctaUrl: "/contact", height: 280 } })))])]);
  add("avantages-puces-2col", "Contenu", "Liste à puces en deux colonnes", () => [section([H("[Tout ce qui est inclus]", "2"), P("[Une phrase d'introduction.]"), cols(2, (i) => [ilist(i === 0 ? ["[Inclus 1]", "[Inclus 2]", "[Inclus 3]", "[Inclus 4]"] : ["[Inclus 5]", "[Inclus 6]", "[Inclus 7]", "[Inclus 8]"], { divider: true })])])]);
  add("alternance-media", "Contenu", "Alternance texte et média", () => [section([
    split(ph("Emplacement de l'image", "260px"), col([H("[Premier point fort]", "3"), P("[Explication du premier point.]"), { type: "link", props: { label: "[En savoir plus]", url: "/contact" } }])),
    split(col([H("[Deuxième point fort]", "3"), P("[Explication du deuxième point.]"), { type: "link", props: { label: "[En savoir plus]", url: "/contact" } }]), ph("Emplacement de l'image", "260px")),
    split(ph("Emplacement de l'image", "260px"), col([H("[Troisième point fort]", "3"), P("[Explication du troisième point.]"), { type: "link", props: { label: "[En savoir plus]", url: "/contact" } }]))], { gap: "56px" })]);
  add("parcours-vertical", "Contenu", "Parcours (chronologie verticale + titre)", () => [section([cols(2, (i) => (i === 0
    ? [H("[Notre parcours]", "2"), P("[Une phrase qui résume l'histoire.]"), B("[Nous contacter]", "/contact", "outline")]
    : [{ type: "timeline", props: { items: [{ date: "[Date]", title: "[Étape marquante 1]", text: "[Ce qui s'est passé.]" }, { date: "[Date]", title: "[Étape marquante 2]", text: "[Ce qui s'est passé.]" }, { date: "[Date]", title: "[Étape marquante 3]", text: "[Ce qui s'est passé.]" }, { date: "[Date]", title: "[Étape marquante 4]", text: "[Ce qui s'est passé.]" }] } }]))])]);
  add("onglets-verticaux", "Contenu", "Fonctionnalités en onglets verticaux", () => [section([H("[Explorez par thème]", "2", mid), { type: "tabs", props: { vertical: true, items: [{ title: "[Thème 1]", icon: "star", text: "[Description détaillée du thème 1.]" }, { title: "[Thème 2]", icon: "users", text: "[Description détaillée du thème 2.]" }, { title: "[Thème 3]", icon: "shield", text: "[Description détaillée du thème 3.]" }] } }])]);
  add("accordeon-a-cote", "Contenu", "Texte et accordéon côte à côte", () => [section([split(col([badge("[Rubrique]", "neutral"), H("[Ce qu'il faut savoir]", "2"), P("[Introduction qui situe les questions.]"), B("[Poser une question]", "/contact", "outline")]), { type: "accordion", props: { items: faqItems(4) } }, { alignItems: "start" })])]);
  add("details-depliables", "Contenu", "Détails dépliables empilés", () => [section([H("[Les détails, à la demande]", "2"), ...[1, 2, 3].map((n) => ({ type: "toggle", props: { title: `[Sujet ${n}]`, text: "[Contenu qui se déplie.]", open: n === 1 } }))], { maxWidth: "820px" })]);
  add("competences-barres", "Contenu", "Compétences en barres de progression", () => [section([split(col([H("[Nos domaines d'expertise]", "2"), P("[Pourquoi ces domaines comptent.]")]), col(["[Domaine 1]", "[Domaine 2]", "[Domaine 3]", "[Domaine 4]"].map((l) => ({ type: "progress", props: { label: l, value: 0, showValue: false } }))))])]);
  add("texte-depliable", "Contenu", "Texte long avec « lire la suite »", () => [section([H("[À propos]", "2"), { type: "readmore", props: { intro: "[Le début du texte, toujours visible.]", more: "[La suite du texte.]\n\n[Un second paragraphe.]" } }], { maxWidth: "720px" })]);
  add("liste-de-controle", "Contenu", "Liste de contrôle dans une carte", () => [section([split(col([H("[Avant de vous lancer]", "2"), P("[Pourquoi cette liste vous fera gagner du temps.]")]), card([H("[Votre liste]", "3"), ilist(["[Point 1]", "[Point 2]", "[Point 3]", "[Point 4]"], { divider: true }), B("[Télécharger ou commencer]", "/contact")], { boxShadow: "md" }))])]);

  // ---------- Preuve ----------
  add("temoignages-carrousel", "Preuve", "Carrousel de témoignages", () => [section([H("[Ce qu'ils en disent]", "2", mid), { type: "testimonialcarousel", props: { label: "Témoignages", items: [1, 2, 3].map(() => ({ quote: "[Témoignage réel, reproduit avec l'accord de la personne.]", name: "[Prénom N.]", role: "[Fonction]", stars: 5 })) } }], { maxWidth: "860px", alignItems: "center" })]);
  add("mur-de-citations", "Preuve", "Mur de citations (3 colonnes)", () => [section([H("[Ils en parlent]", "2", mid), cols(3, (i) => [testi(), testi({ name: "[Prénom N.]" }), ...(i === 1 ? [testi()] : [])])])]);
  add("compteurs-4", "Preuve", "Compteurs animés (4)", () => [section([grid(4, [1, 2, 3, 4].map(() => ctr("[ce que mesure ce chiffre, et sa source]", { duration: 1800 })))], { backgroundColor: "token:surface" })]);
  add("logos-defilants", "Preuve", "Bande de logos défilante", () => [section([T("<p>[Ils nous font confiance]</p>", { ...mid, color: "token:muted" }), { type: "marquee", props: { items: [1, 2, 3, 4, 5, 6].map((n) => ({ text: `[Partenaire ${n}]` })), speed: "slow", separator: "•", label: "Partenaires" } }], { paddingTop: "40px", paddingBottom: "40px" })]);
  add("notes-et-avis", "Preuve", "Note moyenne et avis", () => [section([cols(2, (i) => (i === 0
    ? [H("[Note moyenne]", "3"), { type: "rating", props: { value: 5, scale: "5", title: "[Note réelle]", showValue: true } }, P("[Nombre d'avis réel et source des avis.]")]
    : [testi({ rating: 5 }), testi({ rating: 5 })]))])]);
  add("etudes-de-cas", "Preuve", "Études de cas (2 cartes)", () => [section([H("[Études de cas]", "2"), grid(2, [1, 2].map((n) => card([badge(`[Secteur ${n}]`, "neutral"), H(`[Titre de l'étude ${n}]`, "3"), P("[Problème rencontré, solution apportée, résultat vérifiable.]"), row([ctr("[résultat mesuré]"), ctr("[autre résultat]")]), { type: "link", props: { label: "[Lire l'étude]", url: "/blog" } }])))])]);
  add("equipe-profils", "Preuve", "Équipe en cartes profil (4)", () => [section([H("[L'équipe]", "2", mid), grid(4, [1, 2, 3, 4].map((n) => ({ type: "profilecard", props: { name: `[Prénom Nom ${n}]`, role: "[Rôle]", bio: "[Parcours en une phrase.]", align: "center" } })))])]);
  add("temoignage-vedette", "Preuve", "Témoignage vedette et logos", () => [section([split(testi({ rating: 5 }), col([T("<p>[Ils nous font confiance]</p>", { color: "token:muted" }), grid(2, [1, 2, 3, 4].map((n) => ph(`Emplacement du logo ${n}`, "72px")))]))])]);
  add("chiffres-et-texte", "Preuve", "Texte et chiffres 2 x 2", () => [section([split(col([H("[Notre impact]", "2"), P("[Ce que ces chiffres racontent.]"), B("[En savoir plus]", "/contact", "outline")]), grid(2, [1, 2, 3, 4].map(() => card([ctr("[ce que mesure ce chiffre]")]))))])]);
  add("mentions-presse", "Preuve", "Mentions presse et citation", () => [section([T("<p>[Ils parlent de nous]</p>", { ...mid, color: "token:muted" }), row(["[Média 1]", "[Média 2]", "[Média 3]", "[Média 4]"].map((m) => H(m, "4", { color: "token:muted" })), { justifyContent: "center", gap: "40px" }), { type: "divider", props: {} }, { type: "quote", props: { text: "[Extrait réel d'un article ou d'un avis, avec l'accord de la source.]", author: "[Média, date]" } }], { maxWidth: "860px", alignItems: "center" })]);

  // ---------- Vente ----------
  add("tarifs-natifs", "Vente", "Tarifs (3 offres natives)", () => [section([H("[Choisissez votre formule]", "2", mid), grid(3, ["[Essentiel]", "[Complet]", "[Accompagné]"].map((t, i) => ({ type: "pricing", props: { title: t, price: "[prix réel]", period: "[période]", description: "[À qui s'adresse cette offre.]", features: ["[Inclus 1]", "[Inclus 2]", "[Inclus 3]"], ctaLabel: "[Choisir]", ctaUrl: "/catalogue", badge: i === 1 ? "[Recommandé]" : "", highlight: i === 1 } })))])]);
  add("tarifs-duo-texte", "Vente", "Deux offres avec argumentaire", () => [section([col([H("[Une formule pour chaque besoin]", "2"), P("[Comment choisir entre les deux offres.]"), ilist(["[Garantie ou engagement]", "[Facilité de paiement]"]), grid(2, [0, 1].map((i) => ({ type: "pricing", props: { title: i ? "[Complet]" : "[Essentiel]", price: "[prix réel]", features: ["[Inclus 1]", "[Inclus 2]"], ctaLabel: "[Choisir]", ctaUrl: "/catalogue", highlight: i === 1 } })))])])]);
  add("comparatif-avant-apres", "Vente", "Comparatif avec / sans", () => [section([H("[Avec ou sans nous]", "2", mid), cols(2, (i) => [card([badge(i ? "[Avec nous]" : "[Sans nous]", i ? "success" : "error"), ilist(i ? ["[Bénéfice 1]", "[Bénéfice 2]", "[Bénéfice 3]"] : ["[Problème 1]", "[Problème 2]", "[Problème 3]"], { divider: true })], i ? { borderWidth: "2px", borderStyle: "solid", borderColor: "token:success" } : {})])])]);
  add("garantie", "Vente", "Garantie et engagements", () => [section([cols(2, (i) => (i === 0
    ? [I("shield"), H("[Notre garantie]", "2"), P("[Conditions réelles de la garantie : durée, modalités.]")]
    : [{ type: "alert", props: { tone: "success", title: "[Satisfait ou remboursé ?]", text: "[Reprenez ici l'engagement exact, sans le dénaturer.]" } }, ilist(["[Engagement 1]", "[Engagement 2]", "[Engagement 3]"])]))])]);
  add("liste-de-prix-2col", "Vente", "Liste de prix en deux colonnes", () => [section([H("[Nos tarifs]", "2", mid), cols(2, (i) => [H(i ? "[Rubrique B]" : "[Rubrique A]", "3"), { type: "pricelist", props: { items: [1, 2, 3].map((n) => ({ title: `[Prestation ${n}]`, price: "[Prix réel]", text: "[Ce qui est inclus.]" })) } }])])]);
  add("offre-limitee", "Vente", "Offre limitée avec compte à rebours", () => [section([badge("[Offre limitée]", "warning"), H("[Profitez de l'offre avant la fin]", "2", mid), { type: "countdown", props: { until: SOON, endText: "[Offre terminée]" } }, { type: "pricing", props: { title: "[Nom de l'offre]", price: "[prix réel]", period: "[période]", features: ["[Inclus 1]", "[Inclus 2]"], ctaLabel: "[J'en profite]", ctaUrl: "/catalogue", highlight: true } }], { alignItems: "center", maxWidth: "560px", textAlign: "center" })]);
  add("tableau-plans", "Vente", "Tableau de plans détaillé", () => [section([H("[Comparez en détail]", "2"), { type: "table", props: { header: true, rows: [["", "[Plan A]", "[Plan B]", "[Plan C]"], ["[Fonction 1]", "[oui / non]", "[oui / non]", "[oui / non]"], ["[Fonction 2]", "[oui / non]", "[oui / non]", "[oui / non]"], ["[Fonction 3]", "[valeur]", "[valeur]", "[valeur]"], ["[Prix]", "[prix réel]", "[prix réel]", "[prix réel]"]] } }, row([B("[Choisir A]", "/catalogue", "outline"), B("[Choisir B]"), B("[Choisir C]", "/catalogue", "outline")], { justifyContent: "flex-end" })])]);
  add("pack-offre-cta", "Vente", "Offre en carte à image", () => [section([{ type: "cta", props: { skin: "classic", position: "left", title: "[Le pack à ne pas manquer]", text: "[Ce que contient le pack et à qui il s'adresse.]", buttonLabel: "[Découvrir le pack]", link: "/catalogue", ribbon: "[Nouveau]", align: "left" } }], { maxWidth: "960px" })]);

  // ---------- Appel à l'action ----------
  add("cta-bandeau-ligne", "Appel à l'action", "Bandeau d'action sur une ligne", () => [section([row([col([H("[Prêt à passer à l'action ?]", "2", { color: "token:on-primary" }), T("<p>[Rappelez le bénéfice principal.]</p>", { color: "token:on-primary" })]), B("[Je commence]", "/catalogue", "outline")], { justifyContent: "space-between", gap: "24px" })], { ...onPrimary, paddingLeft: "48px", paddingRight: "48px" })]);
  add("cta-carte-couverture", "Appel à l'action", "Appel à l'action sur couverture", () => [section([badge("[Dernière chance]", "warning"), { type: "cta", props: { skin: "cover", title: "[Votre invitation à agir]", text: "[Une phrase qui rassure et motive.]", buttonLabel: "[Passer à l'action]", link: "/contact", align: "center" } }, row([{ type: "link", props: { label: "[Voir les conditions]", url: "/contact" } }], { justifyContent: "center" })], { alignItems: "center" })]);
  add("cta-deux-choix", "Appel à l'action", "Deux chemins au choix", () => [section([H("[Par où commencer ?]", "2", mid), cols(2, (i) => [card([I(i ? "mail" : "play"), H(i ? "[Je veux en parler]" : "[Je veux essayer]", "3"), P("[Ce qui se passe quand on choisit ce chemin.]"), B(i ? "[Nous écrire]" : "[Essayer]", i ? "/contact" : "/catalogue", i ? "outline" : "primary")], { alignItems: "flex-start" })])])]);
  add("cta-lettre-info", "Appel à l'action", "Invitation à la lettre d'information", () => [section([I("mail"), H("[Recevez nos conseils]", "2", mid), P("[Fréquence et contenu de chaque envoi.]"), B("[Je m'abonne]", "/contact"), T("<p>[Désinscription possible à tout moment.]</p>", { fontSize: "14px", color: "token:muted" })], { alignItems: "center", textAlign: "center", backgroundColor: "token:surface", maxWidth: "720px", borderRadius: "16px" })]);
  add("cta-annonce", "Appel à l'action", "Annonce courte avec bouton", () => [section([{ type: "alert", props: { tone: "info", title: "[Information]", text: "[Message court et utile pour le visiteur.]" } }, row([B("[Voir les détails]", "/contact", "outline")], { justifyContent: "center" })], { paddingTop: "24px", paddingBottom: "24px", maxWidth: "900px" })]);
  add("cta-contact-direct", "Appel à l'action", "Contact direct en ligne", () => [section([H("[Une question ? Parlons-en]", "2", mid), ilist([["[Téléphone]", "smartphone"], ["[Adresse e-mail]", "mail"], ["[Horaires de réponse]", "clock"]], { inline: true }), row([B("[Prendre contact]", "/contact")], { justifyContent: "center" })], { alignItems: "center", textAlign: "center" })]);

  // ---------- FAQ ----------
  add("faq-deux-colonnes", "FAQ", "Questions fréquentes sur deux colonnes", () => [section([H("[Questions fréquentes]", "2", mid), cols(2, (i) => [{ type: "accordion", props: { items: faqItems(3, i ? "B" : "A") } }])])]);
  add("faq-par-categories", "FAQ", "Questions par catégories (onglets)", () => [section([H("[Vos questions]", "2"), P("[Choisissez la rubrique qui correspond à votre demande.]"), { type: "tabs", props: { items: [{ title: "[Catégorie 1]", text: "[Questions et réponses de la première catégorie.]" }, { title: "[Catégorie 2]", text: "[Questions et réponses de la deuxième catégorie.]" }, { title: "[Catégorie 3]", text: "[Questions et réponses de la troisième catégorie.]" }] } }, { type: "alert", props: { tone: "info", text: "[Vous ne trouvez pas votre réponse ? Écrivez-nous.]" } }], { maxWidth: "860px" })]);
  add("faq-aide-laterale", "FAQ", "Questions avec carte d'aide", () => [section([cols(2, (i) => (i === 0
    ? [H("[Besoin d'aide ?]", "2"), card([I("help"), H("[Contactez-nous]", "3"), ilist([["[Délai de réponse]", "clock"], ["[Canal de contact]", "mail"]]), B("[Écrire]", "/contact")])]
    : [{ type: "accordion", props: { items: faqItems(5), faqSchema: true } }]))])]);
  add("faq-sujets-depliables", "FAQ", "Questions rapides (bascules)", () => [section([H("[En bref]", "2", mid), ...faqItems(4).map((x, i) => ({ type: "toggle", props: { title: x.q, text: x.a, open: i === 0 } })), { type: "alert", props: { tone: "info", text: "[Vous ne trouvez pas votre réponse ? Écrivez-nous.]" } }], { maxWidth: "760px" })]);

  // ---------- Contact ----------
  add("contact-carte-et-coordonnees", "Contact", "Carte et coordonnées", () => [section([split(col([H("[Nous rendre visite]", "2"), ilist([["[Adresse complète]", "mapPin"], ["[Téléphone]", "smartphone"], ["[Adresse e-mail]", "mail"]]), B("[Nous écrire]", "/contact")]), { type: "map", props: { address: "[Adresse complète]", zoom: 14, height: 360 } })])]);
  add("contact-trois-cartes", "Contact", "Trois moyens de nous joindre", () => [section([H("[Nous contacter]", "2", mid), grid(3, [["mapPin", "[Adresse]"], ["smartphone", "[Téléphone]"], ["mail", "[E-mail]"]].map((x) => card([iconbox(x[0], x[1], { size: "32", position: "left" }), { type: "divider", props: {} }, { type: "link", props: { label: "[Nous écrire]", url: "/contact" } }])))])]);
  add("horaires-et-carte", "Contact", "Horaires par jour et carte", () => [section([split(col([H("[Horaires]", "2"), ...["[Jour 1]", "[Jour 2]", "[Jour 3]"].map((d) => row([T(`<p>${d}</p>`), T("<p>[Horaires réels]</p>")], { justifyContent: "space-between", flexWrap: "nowrap" })), { type: "alert", props: { tone: "warning", text: "[Fermetures exceptionnelles, à préciser.]" } }]), { type: "map", props: { address: "[Adresse complète]", height: 320 } })])]);
  add("prise-de-rendez-vous", "Contact", "Prise de rendez-vous en étapes", () => [section([H("[Prendre rendez-vous]", "2", mid), grid(3, [1, 2, 3].map((n) => card([badge(`[Étape ${n}]`, "neutral"), P("[Ce que la personne fait ou reçoit à cette étape.]")]))), row([B("[Choisir un créneau]", "/contact")], { justifyContent: "center" })])]);
  add("contact-par-service", "Contact", "Contacts par service", () => [section([H("[Le bon interlocuteur]", "2"), grid(2, [1, 2].map((n) => card([badge(`[Service ${n}]`), P("[Pour quelles demandes contacter ce service.]"), ilist([["[Adresse e-mail]", "mail"], ["[Téléphone]", "smartphone"]]), { type: "link", props: { label: "[Écrire à ce service]", url: "/contact" } }])))])]);
  add("contact-bandeau-couleur", "Contact", "Bandeau de contact sur fond de couleur", () => [section([cols(2, (i) => (i === 0
    ? [H("[Restons en contact]", "2", { color: "token:on-primary" }), T("<p>[Délai de réponse et canal préféré.]</p>", { color: "token:on-primary" })]
    : [ilist([["[Téléphone]", "smartphone"], ["[Adresse e-mail]", "mail"], ["[Adresse]", "mapPin"]], { iconColor: "token:on-primary" }), B("[Nous écrire]", "/contact", "outline")]))], { ...onPrimary, paddingLeft: "48px", paddingRight: "48px" })]);

  // ---------- Blog, boutique, formations ----------
  add("blog-liste", "Blog", "Articles récents en liste", () => [section([H("[Derniers articles]", "2"), { type: "posts", props: { count: 5, layout: "list" } }, row([B("[Tous les articles]", "/blog", "outline")])], { maxWidth: "860px" })]);
  add("blog-et-lettre", "Blog", "Articles et invitation à la lettre", () => [section([cols(2, (i) => (i === 0
    ? [H("[À lire en ce moment]", "2"), { type: "posts", props: { count: 4, layout: "grid" } }]
    : [card([H("[Ne manquez rien]", "3"), P("[Ce que contient la lettre.]"), B("[Je m'abonne]", "/contact")], { backgroundColor: "token:surface" })]))])]);
  add("boutique-nouveautes", "Boutique", "Nouveautés de la boutique", () => [section([row([H("[Nouveautés]", "2"), B("[Tout voir]", "/boutique", "outline")], { justifyContent: "space-between" }), { type: "shopgrid", props: { source: "newest", count: 4, columns: "4", orderby: "newest" } }])]);
  add("boutique-offre-flash", "Boutique", "Vente flash avec compte à rebours", () => [section([badge("[Vente flash]", "warning"), H("[Les promotions se terminent bientôt]", "2", mid), { type: "countdown", props: { until: SOON, endText: "[Vente terminée]" } }, { type: "shopgrid", props: { source: "sale", count: 3, columns: "3", orderby: "newest" } }], { alignItems: "center" })]);
  add("catalogue-et-texte", "Formations", "Catalogue en direct avec présentation", () => [section([cols(2, (i) => (i === 0
    ? [H("[Nos formations]", "2"), P("[À qui s'adressent-elles et que permettent-elles ?]"), B("[Voir le catalogue]", "/catalogue")]
    : [{ type: "courselist", props: { count: 4, sort: "recent" } }]))])]);
  E.push({ key: "formation-vedette", category: "Formations", label: "Formation à la une avec argumentaire", requires: "courses", build: (ctx) => [section([cols(2, (i) => (i === 0
    ? [badge("[À la une]"), H("[Pourquoi suivre cette formation]", "2"), ilist(["[Bénéfice 1]", "[Bénéfice 2]", "[Bénéfice 3]"])]
    : listCourses(ctx).slice(0, 1).map((c) => ({ type: "course", props: { courseId: c.id, cta: "Découvrir" } }))))])] });
  return E;
};

const M = (sectors, siteType, keywords) => ({ sectors, siteType, keywords, since: "2026-11-03" });
const meta = {
  "hero-asymetrique": M([], "", ["accueil", "bandeau", "image"]), "hero-plein-ecran": M([], "", ["accueil", "plein écran", "titre animé"]),
  "hero-reassurance": M(["boutique-en-ligne", "catalogue-produits"], "boutique", ["réassurance", "garanties", "accueil"]), "hero-invitation": M(["evenementiel", "coaching-sportif", "formation-en-ligne"], "", ["inscription", "invitation", "accueil"]),
  "hero-compte-a-rebours": M(["evenementiel", "produits-numeriques"], "", ["lancement", "compte à rebours", "événement"]), "hero-onglets": M(["corporate", "services-professionnels"], "vitrine", ["profils", "onglets", "accueil"]),
  "hero-video": M(["video", "agence-digitale", "formation-en-ligne"], "", ["vidéo", "présentation", "accueil"]), "hero-inverse-chiffres": M(["corporate", "finance"], "vitrine", ["chiffres", "accueil", "inversé"]),
  "hero-diaporama": M(["tourisme", "hotel", "restaurant"], "vitrine", ["diaporama", "slider", "accueil"]), "hero-annonce": M(["actualites", "portail-editorial", "universite"], "", ["annonce", "recherche", "accueil"]),
  "avantages-iconbox": M([], "", ["avantages", "icônes", "bénéfices"]), "avantages-iconbox-cote": M([], "", ["avantages", "icônes", "grille"]),
  "avantages-flipbox": M(["agence-digitale", "marketing"], "", ["cartes retournables", "survol", "services"]), "avantages-puces-2col": M([], "", ["liste", "inclus", "puces"]),
  "alternance-media": M(["architecture", "construction", "portfolio-creatif"], "vitrine", ["alternance", "texte", "image"]), "parcours-vertical": M(["association", "fondation", "corporate"], "", ["histoire", "parcours", "chronologie"]),
  "onglets-verticaux": M(["conseil", "services-professionnels"], "", ["onglets", "fonctionnalités", "thèmes"]), "accordeon-a-cote": M([], "", ["accordéon", "questions", "texte"]),
  "details-depliables": M([], "", ["bascule", "détails", "déplier"]), "competences-barres": M(["conseil", "portfolio-creatif", "graphisme"], "", ["compétences", "progression", "expertise"]),
  "texte-depliable": M(["association", "ong", "fondation"], "", ["à propos", "lire la suite", "texte long"]), "liste-de-controle": M(["coaching-sportif", "conseil", "immobilier"], "", ["liste de contrôle", "checklist", "préparation"]),
  "temoignages-carrousel": M([], "", ["témoignages", "carrousel", "avis"]), "mur-de-citations": M([], "", ["citations", "avis", "mur"]),
  "compteurs-4": M([], "", ["compteurs", "chiffres clés", "impact"]), "logos-defilants": M(["corporate", "agence-digitale"], "", ["logos", "partenaires", "défilement"]),
  "notes-et-avis": M(["restaurant", "hotel", "boutique-en-ligne"], "", ["note", "étoiles", "avis"]), "etudes-de-cas": M(["conseil", "agence-digitale", "marketing"], "", ["études de cas", "résultats", "références"]),
  "equipe-profils": M(["corporate", "cabinet", "clinique"], "", ["équipe", "profils", "cartes"]), "temoignage-vedette": M([], "", ["témoignage", "logos", "preuve"]),
  "chiffres-et-texte": M(["ong", "fondation", "association"], "", ["impact", "chiffres", "texte"]), "mentions-presse": M(["corporate", "communication"], "", ["presse", "médias", "citation"]),
  "tarifs-natifs": M([], "", ["tarifs", "offres", "abonnement"]), "tarifs-duo-texte": M(["services-professionnels", "formation-en-ligne"], "", ["tarifs", "deux offres", "argumentaire"]),
  "comparatif-avant-apres": M([], "", ["comparatif", "avec sans", "avantages"]), "garantie": M(["boutique-en-ligne", "assurance", "services-professionnels"], "", ["garantie", "engagements", "remboursement"]),
  "liste-de-prix-2col": M(["beaute", "bien-etre", "restaurant"], "", ["prix", "tarifs", "prestations"]), "offre-limitee": M([], "", ["offre limitée", "compte à rebours", "urgence"]),
  "tableau-plans": M(["produits-numeriques", "agence-digitale"], "", ["plans", "comparer", "tableau"]), "pack-offre-cta": M([], "", ["pack", "offre", "promotion"]),
  "cta-bandeau-ligne": M([], "", ["appel à l'action", "bandeau", "bouton"]), "cta-carte-couverture": M([], "", ["appel à l'action", "couverture", "invitation"]),
  "cta-deux-choix": M([], "", ["appel à l'action", "choix", "parcours"]), "cta-lettre-info": M(["blog", "magazine", "association"], "blog", ["lettre", "abonnement", "newsletter"]),
  "cta-annonce": M([], "", ["annonce", "information", "bandeau"]), "cta-contact-direct": M([], "vitrine", ["contact", "téléphone", "e-mail"]),
  "faq-deux-colonnes": M([], "", ["faq", "questions", "colonnes"]), "faq-par-categories": M([], "", ["faq", "catégories", "onglets"]),
  "faq-aide-laterale": M([], "", ["faq", "aide", "support"]), "faq-sujets-depliables": M([], "", ["faq", "questions rapides", "bascules"]),
  "contact-carte-et-coordonnees": M([], "vitrine", ["contact", "carte", "adresse"]), "contact-trois-cartes": M([], "vitrine", ["contact", "coordonnées", "cartes"]),
  "horaires-et-carte": M(["restaurant", "cafe", "clinique", "cabinet"], "vitrine", ["horaires", "carte", "ouverture"]), "prise-de-rendez-vous": M(["cabinet", "clinique", "bien-etre", "coaching-sportif"], "vitrine", ["rendez-vous", "réservation", "étapes"]),
  "contact-par-service": M(["corporate", "universite", "organisation-professionnelle"], "vitrine", ["contact", "services", "interlocuteurs"]), "contact-bandeau-couleur": M([], "vitrine", ["contact", "bandeau", "coordonnées"]),
  "blog-liste": M(["blog", "magazine", "actualites"], "blog", ["articles", "blog", "liste"]), "blog-et-lettre": M(["blog", "magazine", "portail-editorial"], "blog", ["articles", "lettre", "abonnement"]),
  "boutique-nouveautes": M(["boutique-en-ligne", "mode", "electronique", "maison-decoration"], "boutique", ["nouveautés", "produits", "boutique"]), "boutique-offre-flash": M(["boutique-en-ligne", "mode", "beaute"], "boutique", ["vente flash", "promotions", "compte à rebours"]),
  "catalogue-et-texte": M(["ecole", "centre-formation", "lms", "formation-en-ligne"], "formation", ["catalogue", "formations", "présentation"]), "formation-vedette": M(["ecole", "centre-formation", "lms", "formation-en-ligne", "cours-particuliers"], "formation", ["formation", "à la une", "argumentaire"]),
};
module.exports = { meta, entries };
