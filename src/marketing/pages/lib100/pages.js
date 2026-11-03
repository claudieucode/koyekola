// Programme 100 : pages supplémentaires (58). Réservoir cohérent : 12 secteurs (4 à 5 pages propres chacun) + 7 pages génériques.
// Toutes les pages sont faites de sections libres natives (éléments du moteur) mélangées à quelques sections « legacy » (formulaire, texte).
// Aucun faux chiffre, prix, nom, adresse, téléphone, e-mail ni témoignage : tout texte entre crochets est à remplacer.
const NEW = "2026-11-03";
const meta = {};
const SEC = {
  hotel: ["hotel", "tourisme"], sante: ["clinique", "cabinet", "bien-etre"], coaching: ["coaching-sportif", "bien-etre", "conseil"], musique: ["ecole", "cours-particuliers", "centre-formation"],
  archi: ["architecture", "construction"], droit: ["juridique", "cabinet", "conseil"], ferme: ["catalogue-produits", "boutique-en-ligne", "restaurant"], mariage: ["evenementiel"],
  sport: ["fitness", "coaching-sportif", "bien-etre"], saas: ["produits-numeriques", "marketing", "corporate"], btp: ["construction", "architecture", "maison-decoration"], tourisme: ["tourisme", "hotel", "evenementiel"],
};

const entries = (kit) => {
  const { form, text, helpers } = kit;
  const { H, T, B, I, card, section, cols, grid } = helpers;

  // ---------- Petites briques ----------
  const badge = (t, tone = "primary") => ({ type: "badge", props: { text: t, tone } });
  const stack = (children, extra = {}) => ({ type: "stack", children, styles: { desktop: { gap: "16px", ...extra } } });
  const row = (children, extra = {}) => ({ type: "group", children, styles: { desktop: { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "12px", ...extra } } });
  const ph = (name, h = "280px", extra = {}) => ({ type: "container", name, children: [], styles: { desktop: { minHeight: h, backgroundColor: "token:surface", borderRadius: "12px", ...extra } } });
  const G = (tpl, kids, extra = {}) => ({ type: "grid", children: kids, styles: { desktop: { gridTemplate: tpl, gap: "32px", alignItems: "center", ...extra }, tablet: { columns: 1 }, mobile: { columns: 1 } } });
  const P = (s, extra) => T(`<p>${s}</p>`, extra);
  const muted = { color: "token:muted" };
  const btns = (list, extra = {}) => row(list.map(([l, u, v]) => B(l, u || "/contact", v || "primary")), extra);
  const iconlist = (items, extra = {}) => ({ type: "iconlist", props: { items: items.map(([t, i]) => ({ text: t, icon: i || "check" })), ...extra } });
  const head = (title, intro, o = {}) => {
    const al = o.align || "left", ta = { textAlign: al };
    return stack([...(o.kicker ? [badge(o.kicker)] : []), H(title, o.level || "2", ta), ...(intro ? [P(intro, { ...ta, ...muted, maxWidth: "720px" })] : [])], { gap: "12px", alignItems: al === "center" ? "center" : "flex-start" });
  };

  // ---------- En-têtes de page ----------
  const heroAsym = (o) => section([G(o.tpl || "7fr 5fr", [
    stack([badge(o.kicker), H(o.title, "1", { fontSize: "48px", lineHeight: "1.1" }), P(o.sub, { fontSize: "20px", ...muted, maxWidth: "560px" }), btns(o.btns), ...(o.note ? [P(o.note, { fontSize: "14px", ...muted })] : [])], { gap: "20px" }),
    o.side || ph(o.visual || "Emplacement de l'image", "380px"),
  ], o.gridExtra)], { paddingTop: "96px", paddingBottom: "80px" });
  const heroCenter = (o) => section([stack([...(o.kicker ? [badge(o.kicker)] : []), H(o.title, "1", { fontSize: "52px", textAlign: "center", lineHeight: "1.1" }), P(o.sub, { fontSize: "20px", textAlign: "center", maxWidth: "680px", ...muted }), btns(o.btns, { justifyContent: "center" }),
    ...(o.pills ? [row(o.pills.map((p) => badge(p, "neutral")), { justifyContent: "center", gap: "8px" })] : []), ...(o.trust ? [iconlist(o.trust, { inline: true })] : [])], { alignItems: "center", gap: "20px" })], { paddingTop: "96px", paddingBottom: "72px", alignItems: "center" });
  const heroBand = (o) => ({ type: "layout", children: [{ type: "container", children: [G(o.tpl || "3fr 2fr", [
    stack([H(o.title, "1", { color: "token:on-primary", fontSize: "44px" }), P(o.sub, { color: "token:on-primary", fontSize: "18px" }), btns(o.btns)], { gap: "20px" }), o.side,
  ], { alignItems: "stretch" })], styles: { desktop: { paddingTop: "80px", paddingBottom: "80px", paddingLeft: "40px", paddingRight: "40px", gradient: { from: "token:primary", to: "token:secondary", angle: 135 }, borderRadius: "16px", maxWidth: "1100px" }, mobile: { paddingTop: "48px", paddingBottom: "48px", paddingLeft: "20px", paddingRight: "20px" } } }] });
  const heroMini = (o) => section([{ type: "breadcrumb", props: { items: [{ label: "Accueil", url: "/" }, { label: o.crumb }] } }, H(o.title, "1", { fontSize: "36px", overflowWrap: "anywhere" }), P(o.sub, { fontSize: "18px", maxWidth: "720px", ...muted })], { paddingTop: "56px", paddingBottom: "32px", gap: "16px" });

  // ---------- Bandes et compositions ----------
  const trustBar = (items) => section([iconlist(items, { inline: true, divider: true })], { paddingTop: "24px", paddingBottom: "24px", backgroundColor: "token:surface", alignItems: "center" });
  const alertBar = (tone, title, body) => section([{ type: "alert", props: { tone, title, text: body } }], { paddingTop: "24px", paddingBottom: "24px", maxWidth: "900px" });
  const pillRow = (title, pills) => section([H(title, "3", { textAlign: "center" }), row(pills.map((p) => badge(p, "neutral")), { justifyContent: "center", gap: "8px" })], { paddingTop: "40px", paddingBottom: "40px", alignItems: "center" });
  const iconGrid = (title, intro, items, o = {}) => section([head(title, intro, { align: o.align, kicker: o.kicker }), grid(Math.min(o.n || items.length, 2), items.map(([ic, t, x]) => {
    const box = { type: "iconbox", props: { icon: ic, title: t, text: x, position: "top", size: o.size || "32" } };
    return o.plain ? box : card([box]);
  }))]);
  const tabsSec = (title, intro, items, vertical = false) => section([head(title, intro), { type: "tabs", props: { vertical, items: items.map(([t, x, ic]) => ({ title: t, text: x, ...(ic ? { icon: ic } : {}) })) } }], { maxWidth: "980px" });
  const timelineSec = (title, intro, items, side = false) => {
    const tl = { type: "timeline", props: { items: items.map(([d, t, x]) => ({ date: d, title: t, text: x })) } };
    return side ? section([G("1fr 2fr", [head(title, intro), tl], { alignItems: "start" })]) : section([head(title, intro), tl], { maxWidth: "820px" });
  };
  const pricingSec = (title, intro, plans, o = {}) => section([head(title, intro, { align: "center" }), grid(plans.length, plans.map(([name, price, period, desc, feats, hl]) =>
    ({ type: "pricing", props: { title: name, price, period, description: desc, features: feats, ctaLabel: o.cta || "Choisir", ctaUrl: o.url || "/contact", badge: hl ? "[Recommandé]" : "", highlight: Boolean(hl) } })))]);
  const priceListSec = (title, intro, items, note) => section([G("1fr 2fr", [stack([head(title, intro), ...(note ? [{ type: "alert", props: { tone: "info", text: note } }] : [])]),
    { type: "pricelist", props: { items: items.map(([t, p, x]) => ({ title: t, price: p, text: x })) } }], { alignItems: "start" })]);
  const tableSec = (title, intro, rows, o = {}) => section([head(title, intro, { align: o.align }), { type: "table", props: { header: true, striped: o.striped !== false, rows } }], { maxWidth: o.maxWidth || "900px" });
  const quoteSec = (txt, author, o = {}) => section([...(o.stars ? [{ type: "rating", props: { value: 5, scale: 5 } }] : []), { type: "quote", props: { text: txt, author } }], { maxWidth: "820px", alignItems: "center", paddingTop: o.pad || "64px", paddingBottom: o.pad || "64px" });
  const testiSec = (title, n) => section([head(title, "", { align: "center" }), grid(n, Array.from({ length: n }, (_, i) => ({ type: "testimonial", props: { text: "[Témoignage réel, reproduit avec l'accord de la personne.]", name: `[Prénom N. ${i + 1}]`, role: "[Fonction ou situation]", rating: 0 } })))]);
  const faqSec = (title, items, mode = "one") => {
    const acc = (list) => ({ type: "accordion", props: { items: list.map(([q, a]) => ({ q, a })), faqSchema: true } });
    if (mode === "two") { const h = Math.ceil(items.length / 2); return section([head(title, ""), cols(2, (i) => [acc(i === 0 ? items.slice(0, h) : items.slice(h))])]); }
    if (mode === "side") return section([G("1fr 2fr", [head(title, "[Une phrase pour rassurer, et où poser une autre question.]"), acc(items)], { alignItems: "start" })]);
    return section([head(title, ""), acc(items)], { maxWidth: "820px" });
  };
  const mediaText = (title, body, o = {}) => {
    const copy = stack([...(o.kicker ? [badge(o.kicker, "neutral")] : []), H(title, "2"), P(body, muted), ...(o.items ? [iconlist(o.items)] : []), ...(o.btn ? [B(o.btn[0], o.btn[1] || "/contact", "outline")] : [])], { gap: "16px" });
    const pic = ph(o.visual || "Emplacement de l'image", o.h || "340px");
    return section([G(o.rev ? "5fr 7fr" : "7fr 5fr", o.rev ? [pic, copy] : [copy, pic])]);
  };
  const mosaic = (title, labels, spans, o = {}) => section([...(title ? [head(title, o.intro || "", { align: o.align })] : []), {
    type: "grid", children: labels.map((l, i) => ({ type: "stack", children: [ph(`Emplacement du visuel : ${l}`, i % 3 === 0 ? "300px" : "220px"), ...(o.captions === false ? [] : [P(l, { fontSize: "14px", ...muted })])], styles: { desktop: { gap: "8px", gridColumnSpan: spans[i % spans.length] } } })),
    styles: { desktop: { columns: o.cols || 4, gap: "16px", alignItems: o.align2 || "stretch" }, tablet: { columns: 2 }, mobile: { columns: 1 } } }]);
  const teamSec = (title, intro, n, o = {}) => section([head(title, intro, { align: o.align }), grid(n, Array.from({ length: n }, (_, i) => card([ph("Emplacement du portrait", o.h || "200px"), H(`[Prénom Nom ${i + 1}]`, "3"), badge(o.role || "[Rôle]", "primary"), P("[Parcours en une phrase, vérifiable.]", muted)])))]);
  const ctaBand = (title, body, label, url = "/contact", second) => section([H(title, "2", { color: "token:on-primary", textAlign: "center" }), P(body, { color: "token:on-primary", textAlign: "center", maxWidth: "620px" }),
    row([B(label, url, "outline"), ...(second ? [B(second[0], second[1] || "/contact", "outline")] : [])], { justifyContent: "center" })], { backgroundColor: "token:primary", alignItems: "center", borderRadius: "16px", maxWidth: "1000px" });
  const stepsGrid = (title, intro, steps, o = {}) => section([head(title, intro, { align: o.align || "center" }), grid(Math.min(steps.length, 2), steps.map(([t, x], i) => o.flat
    ? stack([H(`${i + 1}`, "2", { fontSize: "40px", color: "token:primary" }), H(t, "3"), P(x, muted)])
    : card([badge(`[Étape ${i + 1}]`, "neutral"), H(t, "3"), P(x, muted)])))]);
  const hoursSec = (title, rows, note) => section([head(title, note, { align: "center" }), { type: "table", props: { header: true, rows: [["Jour", "Horaires"], ...rows.map((r) => [r, "[Horaires réels]"])] } }], { maxWidth: "640px", alignItems: "stretch" });
  const contactSplit = (title, items, side) => section([G("1fr 1fr", [stack([H(title, "2"), iconlist(items)]), card(side)], { alignItems: "stretch" })]);
  const flipRow = (title, items, o = {}) => section([head(title, o.intro || "", { align: o.align }), grid(items.length, items.map(([ic, t, back]) => ({ type: "flipbox", props: { icon: ic, frontTitle: t, frontText: "[Survolez pour en savoir plus.]", backTitle: t, backText: back, effect: o.effect || "flip", height: 260 } })))]);
  const toggleList = (title, items) => section([head(title, ""), stack(items.map(([t, x]) => ({ type: "toggle", props: { title: t, text: x } })), { gap: "8px" })], { maxWidth: "820px" });
  const compareCols = (title, a, b) => section([head(title, "", { align: "center" }), grid(2, [
    card([badge(a[0], "success"), iconlist(a[1].map((t) => [t, "checkCircle"]))], { borderWidth: "2px", borderStyle: "solid", borderColor: "token:primary" }),
    card([badge(b[0], "neutral"), iconlist(b[1].map((t) => [t, "minus"]))])])]);
  const bullets = (title, left, right) => section([H(title, "2"), cols(2, (i) => [{ type: "list", props: { items: i === 0 ? left : right, ordered: false } }])]);
  const noteRail = (title, body) => section([cols(2, (i) => (i === 0 ? [H(title, "2")] : [P(body, muted), B("Nous écrire", "/contact", "outline")]))]);
  const formSec = (heading, intro) => [form(heading, intro)];
  const inviteForm = (title, intro, formHeading, formIntro) => [section([head(title, intro, { align: "center" })], { paddingBottom: "8px", alignItems: "center" }), form(formHeading, formIntro)];
  const kitText = (md) => text(md);
  const cats = {
    hotel: "Hôtellerie", sante: "Cabinet médical", coaching: "Coaching", musique: "Musique et danse", archi: "Architecture", droit: "Cabinet juridique", ferme: "Producteur local", mariage: "Mariage et événements",
    sport: "Salle de sport", saas: "SaaS B2B", btp: "Artisan et BTP", tourisme: "Tourisme",
  };
  const E = [];
  const page = (key, category, name, description, build, sectors, siteType, keywords) => { E.push({ key, category, name, description, build }); meta[key] = { sectors, siteType, keywords, since: NEW }; };

  // =============== HÔTEL ===============
  page("hotel-accueil", cats.hotel, "Hôtel — accueil", "Hero asymétrique, bandeau de services, chambres, avis, mosaïque photo et appel à réserver.", () => [
    heroAsym({ kicker: "[Hôtel · Ville]", title: "[Votre séjour commence ici]", sub: "[Ce qui rend l'hôtel unique : lieu, ambiance, accueil.]", btns: [["Réserver une chambre", "/contact"], ["Découvrir les chambres", "/contact", "outline"]], visual: "Emplacement de la photo de l'hôtel" }),
    trustBar([["Petit-déjeuner [inclus ou en option]", "sun"], ["Wi-Fi gratuit", "globe"], ["Accueil [horaires]", "clock"], ["Animaux [acceptés ou non]", "heart"]]),
    iconGrid("Une maison, trois façons d'en profiter", "", [["home", "Les chambres", "[Types de chambres et ce qui les distingue.]"], ["book", "Le restaurant", "[Cuisine, produits, horaires.]"], ["sparkles", "Le bien-être", "[Spa, piscine, massages : à préciser.]"]], { pos: "left", n: 3, size: "48" }),
    quoteSec("[Avis réel d'un client, reproduit avec son accord.]", "[Prénom N., ville]", { stars: true }),
    mosaic("En images", ["Façade", "Chambre", "Salle du petit-déjeuner", "Jardin", "Détail de décoration", "Vue"], [2, 1, 1, 1, 1, 2], { align: "center" }),
    ctaBand("Réservez en direct", "[Avantage de la réservation directe : à renseigner.]", "Voir les disponibilités", "/contact")], SEC.hotel, "vitrine", ["hôtel", "séjour", "chambres", "accueil"]);
  page("hotel-chambres", cats.hotel, "Hôtel — chambres", "Catégories de chambres en onglets verticaux, tableau comparatif des équipements et visite détaillée.", () => [
    heroMini({ crumb: "Chambres", title: "Nos chambres", sub: "[Une phrase sur le confort et le calme.]" }),
    tabsSec("Choisissez votre chambre", "", [["Chambre classique", "[Surface, lit, vue, capacité. Photo à ajouter.]", "home"], ["Chambre supérieure", "[Ce qui change : espace, balcon, salle de bain.]", "star"], ["Suite", "[Salon séparé, équipements, capacité.]", "sparkles"], ["Chambre familiale", "[Couchages, communication entre pièces.]", "users"]], true),
    tableSec("Équipements comparés", "", [["", "Classique", "Supérieure", "Suite"], ["Literie", "[type]", "[type]", "[type]"], ["Salle de bain", "[douche / bain]", "[douche / bain]", "[bain + douche]"], ["Climatisation", "[oui / non]", "[oui / non]", "[oui / non]"], ["Balcon ou terrasse", "[oui / non]", "[oui / non]", "[oui / non]"], ["Tarif à partir de", "[prix réel]", "[prix réel]", "[prix réel]"]], { align: "center" }),
    mediaText("Un lit pensé pour bien dormir", "[Décrivez la literie, l'isolation, le linge. Restez factuel.]", { rev: true, items: [["Literie [marque ou type]", "check"], ["Linge [fibre, entretien]", "check"], ["Isolation phonique [description]", "check"]], visual: "Emplacement de la photo de la chambre" }),
    ctaBand("Une préférence particulière ?", "[Chambre calme, étage, lit bébé : dites-le-nous.]", "Nous écrire", "/contact")], SEC.hotel, "vitrine", ["chambres", "suite", "équipements", "tarifs"]);
  page("hotel-services", cats.hotel, "Hôtel — services et prestations", "Boîtes retournables, journée type en chronologie et services à la carte avec prix.", () => [
    heroCenter({ kicker: "Services", title: "Tout pour un séjour sans souci", sub: "[Ce qui est inclus et ce qui est proposé en supplément.]", btns: [["Réserver", "/contact"]] }),
    flipRow("Les petits plus", [["sun", "Petit-déjeuner", "[Horaires, buffet ou en chambre, produits locaux.]"], ["globe", "Conciergerie", "[Billets, taxis, recommandations.]"], ["heart", "Bien-être", "[Soins, horaires, réservation.]"], ["briefcase", "Séminaires", "[Salles, capacités, équipements.]"]], { align: "center" }),
    timelineSec("Une journée à l'hôtel", "", [["[Matin]", "Petit-déjeuner", "[Ce qui est servi, où, jusqu'à quelle heure.]"], ["[Midi]", "Déjeuner ou balade", "[Idées de sorties proches.]"], ["[Après-midi]", "Détente", "[Spa, piscine, salon.]"], ["[Soir]", "Dîner", "[Restaurant ou adresses partenaires.]"]], true),
    priceListSec("Services à la carte", "[Tarifs TTC à renseigner.]", [["Petit-déjeuner", "[prix]", "[Buffet ou plateau.]"], ["Parking", "[prix]", "[Couvert ou non, par nuit.]"], ["Lit bébé", "[prix]", "[Sur demande.]"], ["Départ tardif", "[prix]", "[Selon disponibilités.]"]], "[Services inclus selon la chambre : à préciser.]"),
    alertBar("info", "Besoin d'un service particulier ?", "[Dites-le-nous avant votre arrivée : nous ferons le possible.]")], SEC.hotel, "vitrine", ["services", "petit-déjeuner", "conciergerie", "séminaire"]);
  page("hotel-reservation", cats.hotel, "Hôtel — demande de réservation", "Étapes de réservation, formulaire de demande, conditions d'annulation et questions.", () => [
    heroMini({ crumb: "Réserver", title: "Réservez votre séjour", sub: "[Réponse sous X heures ouvrées : délai réel.]" }),
    stepsGrid("Comment ça marche", "", [["Vous demandez", "Dates, nombre de personnes, type de chambre."], ["Nous confirmons", "[Délai réel de réponse.]"], ["Vous séjournez", "[Modalités d'arrivée.]"]], { flat: true, align: "left" }),
    ...formSec("Demande de réservation", "Dates, chambre souhaitée et vos coordonnées."),
    alertBar("warning", "Conditions d'annulation", "[Délai et conditions réels d'annulation et de modification.]"),
    faqSec("Avant de réserver", [["À quelle heure arriver ?", "[Horaires d'arrivée et de départ réels.]"], ["Les animaux sont-ils acceptés ?", "[Conditions réelles.]"], ["Comment payer ?", "[Moyens de paiement acceptés.]"]], "side")], SEC.hotel, "vitrine", ["réservation", "dates", "annulation"]);
  page("hotel-acces", cats.hotel, "Hôtel — accès et contact", "Coordonnées, horaires de réception, moyens d'accès et alentours.", () => [
    heroMini({ crumb: "Accès", title: "Nous trouver", sub: "[Quartier, repères, distance de la gare ou du centre.]" }),
    contactSplit("Coordonnées", [["[Adresse complète]", "mapPin"], ["[Téléphone]", "smartphone"], ["[Adresse e-mail]", "mail"], ["[Horaires de la réception]", "clock"]], [H("Arrivée et départ", "3"), P("[Heure d'arrivée, heure de départ, arrivée tardive.]", muted), badge("[Réception ouverte : horaires]", "success")]),
    iconGrid("Comment venir", "", [["globe", "En train", "[Gare, durée, correspondances.]"], ["home", "En voiture", "[Itinéraire, parking, tarifs.]"], ["send", "En avion", "[Aéroport, navette.]"], ["heart", "À pied ou à vélo", "[Abri vélos, accès.]"]], { pos: "left", n: 2, plain: true }),
    hoursSec("Horaires des services", ["Réception", "Restaurant", "Spa"], "[Précisez les jours de fermeture.]"),
    ctaBand("Une question avant votre venue ?", "[Délai de réponse réel.]", "Nous écrire", "/contact")], SEC.hotel, "vitrine", ["accès", "plan", "contact", "réception"]);

  // =============== CABINET MÉDICAL / CLINIQUE ===============
  page("sante-accueil", cats.sante, "Cabinet médical — accueil", "Bandeau en dégradé avec carte de prise de rendez-vous, rassurances, soins, équipe et urgence.", () => [
    heroBand({ title: "[Votre santé, avec attention]", sub: "[Spécialité, quartier et approche du cabinet.]", btns: [["Prendre rendez-vous", "/contact", "outline"]], side: card([H("Pour nous joindre", "3"), iconlist([["[Téléphone]", "smartphone"], ["[Horaires]", "clock"], ["[Adresse]", "mapPin"]])]) }),
    trustBar([["Consultations sur rendez-vous", "calendarClock"], ["Carte Vitale acceptée [à confirmer]", "shield"], ["Accès [adapté]", "heart"]]),
    iconGrid("Nos consultations", "", [["heart", "[Consultation 1]", "[Pour qui, durée.]"], ["activity", "[Consultation 2]", "[Pour qui, durée.]"], ["shield", "[Prévention]", "[Bilans, vaccins.]"], ["users", "[Suivi]", "[Enfants, adultes, seniors.]"], ["fileText", "[Certificats]", "[Documents délivrés.]"], ["clock", "[Urgences du jour]", "[Conditions.]"]], { n: 3, pos: "left", align: "center", size: "32" }),
    teamSec("Les praticiens", "", 2, { role: "[Spécialité]" }),
    alertBar("error", "En cas d'urgence", "[Numéro d'urgence à appeler : à renseigner.]")], SEC.sante, "vitrine", ["médecin", "cabinet", "consultation", "santé"]);
  page("sante-soins", cats.sante, "Cabinet médical — soins et actes", "Liste des soins en accordéon latéral, honoraires et déroulé d'une consultation.", () => [
    heroMini({ crumb: "Soins", title: "Soins et consultations", sub: "[Ce que nous prenons en charge, et ce qui relève d'un autre spécialiste.]" }),
    faqSec("Nos soins", [["[Soin 1]", "[Indication, déroulé, durée.]"], ["[Soin 2]", "[Indication, déroulé, durée.]"], ["[Soin 3]", "[Indication, déroulé, durée.]"], ["[Soin 4]", "[Indication, déroulé, durée.]"]], "side"),
    tableSec("Honoraires", "[Tarifs conventionnés ou libres : à préciser.]", [["Acte", "Durée", "Tarif"], ["[Consultation]", "[durée]", "[tarif réel]"], ["[Bilan]", "[durée]", "[tarif réel]"], ["[Acte technique]", "[durée]", "[tarif réel]"]], { align: "center", maxWidth: "760px" }),
    mediaText("Déroulé d'une consultation", "[Accueil, examen, explications, ordonnance : décrivez les étapes.]", { items: [["Accueil et dossier", "check"], ["Examen", "check"], ["Conseils et suivi", "check"]], h: "300px" }),
    ctaBand("Besoin d'une consultation ?", "[Délai habituel de rendez-vous : à préciser.]", "Prendre rendez-vous", "/contact")], SEC.sante, "vitrine", ["soins", "actes", "honoraires", "consultation"]);
  page("sante-equipe", cats.sante, "Cabinet médical — l'équipe soignante", "Présentation des praticiens, parcours en chronologie et philosophie de soin.", () => [
    heroCenter({ title: "Une équipe à votre écoute", sub: "[Ce qui guide notre façon de soigner.]", btns: [["Prendre rendez-vous", "/contact"]] }),
    teamSec("Praticiens et personnel", "", 4, { role: "[Fonction]", h: "160px", align: "center" }),
    timelineSec("Parcours et formations", "[Diplômes et expériences vérifiables.]", [["[Année]", "[Diplôme ou formation]", "[Établissement.]"], ["[Année]", "[Expérience clinique]", "[Lieu, durée.]"], ["[Année]", "[Installation au cabinet]", "[Contexte.]"]], true),
    quoteSec("[Un mot du praticien sur sa façon de soigner.]", "[Prénom Nom, fonction]")], SEC.sante, "vitrine", ["équipe", "praticiens", "soignants"]);
  page("sante-rdv", cats.sante, "Cabinet médical — prise de rendez-vous", "Mode d'emploi, avertissement d'urgence, formulaire de demande et horaires d'ouverture.", () => [
    heroMini({ crumb: "Rendez-vous", title: "Prendre rendez-vous", sub: "[Comment nous joindre et délai de réponse.]" }),
    alertBar("warning", "Ce formulaire n'est pas pour les urgences", "[Numéro d'urgence ou conduite à tenir : à renseigner.]"),
    stepsGrid("En trois temps", "", [["Votre demande", "Motif et disponibilités."], ["Notre réponse", "[Délai réel.]"], ["La consultation", "Pensez à votre carte vitale et vos documents."]], { align: "left" }),
    ...formSec("Demande de rendez-vous", "Ne décrivez pas de détails médicaux : réservez-les à la consultation."),
    hoursSec("Horaires du cabinet", ["Lundi – Vendredi", "Samedi"], "[Jours de fermeture à préciser.]")], SEC.sante, "vitrine", ["rendez-vous", "demande", "horaires"]);
  page("sante-infos-patients", cats.sante, "Cabinet médical — informations aux patients", "Onglets pratiques, questions dépliantes et coordonnées.", () => [
    heroMini({ crumb: "Patients", title: "Informations pratiques", sub: "[Ce qu'il faut savoir avant de venir.]" }),
    tabsSec("Avant votre venue", "", [["Documents à apporter", "[Carte vitale, ordonnance, examens antérieurs.]", "fileText"], ["Remboursements", "[Conditions de prise en charge réelles.]", "coin"], ["Annulation", "[Délai de prévenance réel.]", "calendarClock"], ["Confidentialité", "[Traitement du dossier médical.]", "lock"]]),
    toggleList("Vos questions", [["Puis-je venir sans rendez-vous ?", "[Réponse réelle.]"], ["Comment obtenir mon dossier ?", "[Démarche réelle.]"], ["Faites-vous des visites à domicile ?", "[Réponse réelle.]"]]),
    contactSplit("Nous joindre", [["[Téléphone]", "smartphone"], ["[Adresse e-mail]", "mail"], ["[Adresse]", "mapPin"]], [H("Accès", "3"), P("[Transports, parking, accès pour les personnes à mobilité réduite.]", muted)])], SEC.sante, "vitrine", ["patients", "pratique", "remboursement"]);

  // =============== COACHING ===============
  page("coaching-accueil", cats.coaching, "Coaching — accueil", "Promesse, comparatif avant/après, accompagnement, témoignages et appel à réserver.", () => [
    heroAsym({ kicker: "[Coach certifié(e) · Spécialité]", title: "[Retrouvez de la clarté et avancez]", sub: "[Pour qui, quel changement, en combien de temps.]", btns: [["Réserver un appel découverte", "/contact"]], side: card([H("Ce que vous obtenez", "3"), iconlist([["[Résultat 1]", "checkCircle"], ["[Résultat 2]", "checkCircle"], ["[Résultat 3]", "checkCircle"]])]), tpl: "3fr 2fr", gridExtra: { alignItems: "stretch" } }),
    compareCols("Avant / après", ["Après l'accompagnement", ["[Changement 1]", "[Changement 2]", "[Changement 3]"]], ["Aujourd'hui", ["[Situation 1]", "[Situation 2]", "[Situation 3]"]]),
    iconGrid("Comment je vous accompagne", "", [["messageSquare", "Séances individuelles", "[Format et durée.]"], ["listChecks", "Plan d'action", "[Objectifs concrets.]"], ["heart", "Suivi entre les séances", "[Moyen de contact.]"]], { n: 3, plain: true, align: "center" }),
    testiSec("Ils ont avancé", 2),
    ctaBand("Parlons de votre objectif", "[Appel offert ou non : à préciser.]", "Réserver un appel", "/contact")], SEC.coaching, "vitrine", ["coach", "accompagnement", "objectifs"]);
  page("coaching-methode", cats.coaching, "Coaching — ma méthode", "Méthode en chronologie latérale, principes, texte et visuel, résultats attendus.", () => [
    heroMini({ crumb: "Méthode", title: "Une méthode en [x] étapes", sub: "[Ce qui la distingue d'un accompagnement classique.]" }),
    timelineSec("Le parcours", "[Durée totale et rythme des séances.]", [["[Semaine 1]", "Clarifier", "[Bilan et objectif.]"], ["[Semaines 2–4]", "Construire", "[Plan d'action.]"], ["[Semaines 5–8]", "Agir", "[Mise en pratique.]"], ["[Semaine 9]", "Consolider", "[Bilan final.]"]], true),
    mediaText("Mes principes", "[Valeurs et cadre éthique : confidentialité, bienveillance, exigence.]", { rev: true, kicker: "Éthique" }),
    iconGrid("Ce que vous emportez", "", [["book", "Des outils", "[Exercices, fiches.]"], ["trendingUp", "Des résultats", "[Mesurables, à définir ensemble.]"], ["users", "Un soutien", "[Suivi après le parcours.]"], ["shield", "Un cadre", "[Confidentialité.]"]], { n: 4, pos: "top", plain: true }),
    ctaBand("Commencer par un échange", "[Durée et gratuité de l'appel.]", "Réserver l'appel", "/contact")], SEC.coaching, "vitrine", ["méthode", "parcours", "séances"]);
  page("coaching-offres", cats.coaching, "Coaching — formules et tarifs", "Trois formules, tableau comparatif, questions sur deux colonnes.", () => [
    heroCenter({ title: "Choisissez votre accompagnement", sub: "[Chaque formule se termine par un bilan.]", btns: [["Poser une question", "/contact", "outline"]] }),
    pricingSec("Les formules", "", [["Séance unique", "[prix réel]", "la séance", "[Pour faire le point.]", ["[Durée]", "[Compte rendu]"]], ["Parcours", "[prix réel]", "le parcours", "[Pour un changement durable.]", ["[Séances]", "[Suivi]", "[Outils]"], true], ["Intensif", "[prix réel]", "le programme", "[Pour un objectif précis.]", ["[Séances]", "[Suivi quotidien]", "[Bilan]"]]]),
    tableSec("Comparatif des formules", "", [["", "Unique", "Parcours", "Intensif"], ["Séances", "[x]", "[x]", "[x]"], ["Suivi entre séances", "[non]", "[oui]", "[oui]"], ["Outils", "[non]", "[oui]", "[oui]"]], { align: "center" }),
    faqSec("Questions sur les formules", [["Comment payer ?", "[Moyens et échéancier réels.]"], ["Puis-je changer de formule ?", "[Conditions.]"], ["Séances en visio ?", "[Outils et fuseaux.]"], ["Et si ça ne convient pas ?", "[Engagement réel.]"]], "two")], SEC.coaching, "vitrine", ["tarifs", "formules", "accompagnement"]);
  page("coaching-decouverte", cats.coaching, "Coaching — appel découverte", "Bandeau, listes en deux colonnes, formulaire de demande et questions courtes.", () => [
    heroBand({ title: "Un appel pour y voir clair", sub: "[Durée, gratuité, sans engagement : à préciser.]", btns: [["Réserver mon créneau", "/contact", "outline"]], side: card([badge("[Gratuit ou tarif]", "success"), H("[Durée] minutes", "3"), P("[Par téléphone ou visio.]", muted)]), tpl: "2fr 1fr" }),
    bullets("Pendant l'appel", ["Nous faisons le point sur votre situation", "Nous définissons votre objectif", "Je vous dis honnêtement si je peux vous aider"], ["Vous posez toutes vos questions", "Vous repartez avec une première piste", "Aucune obligation de continuer"]),
    ...inviteForm("Choisissez votre moment", "[Créneaux et fuseau horaire.]", "Réserver l'appel", "Nous vous confirmons le créneau par e-mail."),
    faqSec("Avant l'appel", [["Dois-je préparer quelque chose ?", "[Réponse réelle.]"], ["Que se passe-t-il ensuite ?", "[Réponse réelle.]"]])], SEC.coaching, "vitrine", ["appel", "découverte", "réservation"]);

  // =============== ÉCOLE DE MUSIQUE ET DE DANSE ===============
  page("musique-accueil", cats.musique, "École de musique et de danse — accueil", "Accroche centrée avec disciplines, enseignements, mosaïque des cours, avis et inscription.", () => [
    heroCenter({ kicker: "[École · Ville]", title: "[Apprendre, jouer, danser ensemble]", sub: "[Public accueilli : enfants, adultes, tous niveaux.]", btns: [["S'inscrire", "/contact"], ["Découvrir les cours", "/contact", "outline"]], pills: ["[Piano]", "[Guitare]", "[Chant]", "[Danse]", "[Éveil]"] }),
    iconGrid("Pour chaque envie", "", [["play", "Instruments", "[Liste et niveaux.]"], ["heart", "Danse", "[Styles proposés.]"], ["users", "Pratiques collectives", "[Orchestre, chorale, troupe.]"], ["sparkles", "Éveil", "[Dès quel âge.]"]], { n: 4, pos: "top" }),
    mosaic("La vie de l'école", ["Cours de groupe", "Concert de fin d'année", "Studio de danse", "Salle de musique"], [1, 1, 1, 1], { align: "center" }),
    testiSec("Ils nous le disent", 3),
    ctaBand("Un cours d'essai ?", "[Conditions du cours d'essai.]", "Réserver un essai", "/contact")], SEC.musique, "vitrine", ["école de musique", "danse", "cours", "inscription"]);
  page("musique-cours", cats.musique, "École de musique et de danse — nos cours", "Disciplines en onglets verticaux, planning hebdomadaire en tableau, texte et visuel.", () => [
    heroMini({ crumb: "Cours", title: "Nos cours", sub: "[Formats individuels et collectifs, tous niveaux.]" }),
    tabsSec("Les disciplines", "", [["Piano", "[Âge, niveau, durée du cours.]", "play"], ["Guitare", "[Âge, niveau, durée du cours.]", "play"], ["Chant", "[Âge, niveau, durée du cours.]", "messageSquare"], ["Danse", "[Styles, âge, tenue.]", "heart"]], true),
    tableSec("Planning de la semaine", "[Horaires indicatifs, mis à jour chaque rentrée.]", [["Jour", "Discipline", "Niveau", "Horaire"], ["[Lundi]", "[Discipline]", "[Niveau]", "[Horaire]"], ["[Mercredi]", "[Discipline]", "[Niveau]", "[Horaire]"], ["[Samedi]", "[Discipline]", "[Niveau]", "[Horaire]"]], { align: "center" }),
    mediaText("Les salles", "[Salles insonorisées, pianos, miroirs, vestiaires : décrivez le lieu.]", { rev: true, h: "300px" }),
    noteRail("Un doute sur le niveau ?", "[Proposez une rencontre avec un professeur pour orienter.]")], SEC.musique, "vitrine", ["cours", "planning", "disciplines"]);
  page("musique-tarifs", cats.musique, "École de musique et de danse — tarifs", "Liste de prix, formules famille, annonce des réductions et appel à l'action.", () => [
    heroMini({ crumb: "Tarifs", title: "Tarifs de l'année", sub: "[Année scolaire et modalités de paiement.]" }),
    priceListSec("Cours", "[Tarifs annuels ou trimestriels.]", [["Cours individuel", "[prix]", "[Durée.]"], ["Cours collectif", "[prix]", "[Durée.]"], ["Éveil", "[prix]", "[Âge.]"], ["Danse", "[prix]", "[Durée.]"], ["Adhésion annuelle", "[prix]", "[Ce qu'elle comprend.]"]], "[Possibilité de paiement échelonné : à confirmer.]"),
    pricingSec("Formules famille", "", [["Duo", "[prix réel]", "par an", "[Deux inscrits.]", ["[Remise]", "[Cours]"]], ["Famille", "[prix réel]", "par an", "[Trois inscrits ou plus.]", ["[Remise]", "[Cours]"], true]]),
    alertBar("success", "Réductions", "[Tarif réduit, aides, cartes locales : à préciser.]"),
    ctaBand("Prêt à vous inscrire ?", "[Date limite d'inscription.]", "Inscrire un élève", "/contact")], SEC.musique, "vitrine", ["tarifs", "adhésion", "famille"]);
  page("musique-inscription", cats.musique, "École de musique et de danse — inscription", "Accroche asymétrique, étapes à plat, formulaire et questions latérales.", () => [
    heroAsym({ kicker: "Inscriptions", title: "Rejoignez-nous à la rentrée", sub: "[Dates d'ouverture et places disponibles.]", btns: [["Remplir le formulaire", "/contact"]], side: card([H("Pièces à fournir", "3"), iconlist([["[Pièce 1]", "fileText"], ["[Pièce 2]", "fileText"], ["[Pièce 3]", "fileText"]])]), tpl: "3fr 2fr" }),
    stepsGrid("Inscription en quatre étapes", "", [["Choisir", "Discipline et créneau."], ["Demander", "Formulaire en ligne."], ["Confirmer", "[Réponse de l'école.]"], ["Régler", "[Modalités.]"]], { flat: true }),
    ...formSec("Demande d'inscription", "Élève, discipline, niveau, disponibilités."),
    faqSec("Questions d'inscription", [["Peut-on s'inscrire en cours d'année ?", "[Réponse réelle.]"], ["Faut-il un instrument ?", "[Réponse réelle.]"], ["Comment se déroule le premier cours ?", "[Réponse réelle.]"]], "side")], SEC.musique, "vitrine", ["inscription", "rentrée", "formulaire"]);

  // =============== ARCHITECTE ===============
  page("archi-accueil", cats.archi, "Architecte — accueil", "Couverture en dégradé, mosaïque de réalisations, démarche, citation et appel.", () => [
    heroBand({ title: "[Concevoir des lieux qui vous ressemblent]", sub: "[Agence · ville · types de projets.]", btns: [["Voir les projets", "/contact", "outline"]], side: ph("Emplacement de la photo d'un projet", "260px", { backgroundColor: "token:surface" }), tpl: "1fr 1fr" }),
    mosaic("Projets récents", ["Maison individuelle", "Rénovation", "Bureaux", "Extension", "Logements"], [2, 1, 1, 2, 1], { cols: 4 }),
    mediaText("Notre démarche", "[Écoute, esquisse, dessin, suivi de chantier : décrivez comment vous travaillez.]", { kicker: "Démarche", items: [["Écoute du besoin", "check"], ["Conception", "check"], ["Suivi de chantier", "check"]] }),
    quoteSec("[Citation d'un maître d'ouvrage, avec son accord.]", "[Prénom N., projet]"),
    ctaBand("Parlons de votre projet", "[Premier rendez-vous : conditions.]", "Prendre contact", "/contact")], SEC.archi, "vitrine", ["architecte", "projets", "agence"]);
  page("archi-projets", cats.archi, "Architecte — réalisations", "Filtres par type, mosaïque asymétrique de six projets et fiche de projet.", () => [
    heroMini({ crumb: "Projets", title: "Réalisations", sub: "[Surface, lieu et année pour chaque projet.]" }),
    pillRow("Filtrer par type", ["[Maisons]", "[Rénovations]", "[Tertiaire]", "[Public]", "[Intérieur]"]),
    mosaic("", ["[Projet 1]", "[Projet 2]", "[Projet 3]", "[Projet 4]", "[Projet 5]", "[Projet 6]"], [1, 2, 1, 2, 1, 1], { cols: 4, captions: true, align2: "start" }),
    section([G("1fr 2fr", [ph("Emplacement du plan ou de la coupe", "260px"), stack([badge("[Projet à la une]"), H("[Nom du projet]", "2"), P("[Programme, contraintes, solution, matériaux.]", muted), iconlist([["[Lieu]", "mapPin"], ["[Année]", "calendarClock"], ["[Surface]", "layout"]], { inline: true })])])]),
    ctaBand("Un projet en tête ?", "[Types de missions acceptées.]", "Discutons-en", "/contact")], SEC.archi, "vitrine", ["réalisations", "portfolio", "projets"]);
  page("archi-processus", cats.archi, "Architecte — déroulé d'une mission", "Chronologie de la mission, questions en bascule et visuel d'accompagnement.", () => [
    heroCenter({ title: "De l'idée au chantier", sub: "[Les phases d'une mission et ce que vous validez à chaque fois.]", btns: [["Démarrer un projet", "/contact"]] }),
    timelineSec("Les phases", "", [["[Phase 1]", "Faisabilité", "[Programme, budget, règles d'urbanisme.]"], ["[Phase 2]", "Esquisse", "[Premières propositions.]"], ["[Phase 3]", "Avant-projet", "[Plans, matériaux, estimation.]"], ["[Phase 4]", "Permis", "[Dossier et dépôt.]"], ["[Phase 5]", "Consultation", "[Choix des entreprises.]"], ["[Phase 6]", "Chantier", "[Suivi et réception.]"]]),
    toggleList("Ce qu'il faut savoir", [["Comment sont fixés les honoraires ?", "[Mode de calcul réel.]"], ["Quels délais prévoir ?", "[Délais indicatifs.]"], ["Intervenez-vous sur de petits projets ?", "[Réponse réelle.]"]]),
    mediaText("Un suivi documenté", "[Comptes rendus, calendrier, tableau de bord.]", { rev: true, visual: "Emplacement de l'image du suivi", h: "260px" })], SEC.archi, "vitrine", ["mission", "phases", "permis", "chantier"]);
  page("archi-devis", cats.archi, "Architecte — demande de rendez-vous", "En-tête sobre, éléments à préparer, formulaire et questions fréquentes.", () => [
    heroMini({ crumb: "Contact", title: "Parlons de votre projet", sub: "[Réponse sous X jours ouvrés.]" }),
    iconGrid("À préparer pour le premier échange", "", [["home", "Le terrain ou le bien", "[Adresse, surface, photos.]"], ["coin", "Le budget", "[Fourchette envisagée.]"], ["calendarClock", "Le calendrier", "[Échéance souhaitée.]"]], { n: 3, pos: "left", plain: true, size: "32" }),
    ...formSec("Décrivez votre projet", "Nature du projet, lieu, budget indicatif."),
    faqSec("Questions courantes", [["Le premier rendez-vous est-il gratuit ?", "[Réponse réelle.]"], ["Où intervenez-vous ?", "[Zone réelle.]"]])], SEC.archi, "vitrine", ["contact", "devis", "projet"]);

  // =============== JURIDIQUE ===============
  page("juridique-accueil", cats.droit, "Cabinet d'avocats — accueil", "Hero asymétrique, bandeau de déontologie, domaines, citation et prise de rendez-vous.", () => [
    heroAsym({ kicker: "[Cabinet · Barreau · Ville]", title: "[Vous défendre, vous conseiller]", sub: "[Domaines d'intervention et façon de travailler.]", btns: [["Prendre rendez-vous", "/contact"]], note: "[Premier échange : conditions.]", visual: "Emplacement de la photo du cabinet", tpl: "6fr 5fr" }),
    trustBar([["Secret professionnel", "lock"], ["Honoraires annoncés", "coin"], ["Réponse sous [délai]", "clock"]]),
    iconGrid("Domaines d'intervention", "", [["briefcase", "[Droit des affaires]", "[Missions.]"], ["home", "[Droit immobilier]", "[Missions.]"], ["users", "[Droit de la famille]", "[Missions.]"], ["shield", "[Droit pénal]", "[Missions.]"], ["fileText", "[Droit du travail]", "[Missions.]"], ["globe", "[Autres domaines]", "[Missions.]"]], { n: 3, pos: "top", size: "32" }),
    quoteSec("[Retour d'un client, avec son accord et dans le respect de la déontologie.]", "[Initiales, domaine]"),
    ctaBand("Exposez votre situation", "[Confidentialité garantie.]", "Prendre rendez-vous", "/contact")], SEC.droit, "vitrine", ["avocat", "cabinet", "droit", "conseil juridique"]);
  page("juridique-domaines", cats.droit, "Cabinet d'avocats — domaines de compétence", "Domaines détaillés en accordéon latéral, comparatif de missions et coordonnées.", () => [
    heroMini({ crumb: "Domaines", title: "Nos domaines de compétence", sub: "[Pour chaque domaine : situations traitées et type d'intervention.]" }),
    faqSec("Domaines", [["[Droit 1]", "[Situations, procédures, résultats attendus.]"], ["[Droit 2]", "[Situations, procédures, résultats attendus.]"], ["[Droit 3]", "[Situations, procédures, résultats attendus.]"], ["[Droit 4]", "[Situations, procédures, résultats attendus.]"], ["[Droit 5]", "[Situations, procédures, résultats attendus.]"]], "side"),
    compareCols("Conseil ou contentieux ?", ["Conseil", ["[Consultation]", "[Rédaction d'actes]", "[Négociation]"]], ["Contentieux", ["[Procédure]", "[Représentation]", "[Plaidoirie]"]]),
    contactSplit("Une question de droit ?", [["[Téléphone]", "smartphone"], ["[Adresse e-mail]", "mail"], ["[Adresse du cabinet]", "mapPin"]], [H("Rendez-vous", "3"), P("[Sur rendez-vous, au cabinet ou à distance.]", muted), B("Demander un rendez-vous", "/contact")])], SEC.droit, "vitrine", ["domaines", "compétences", "droit"]);
  page("juridique-honoraires", cats.droit, "Cabinet d'avocats — honoraires", "Transparence tarifaire : barème, forfait contre temps passé, aide juridictionnelle.", () => [
    heroCenter({ kicker: "Transparence", title: "Des honoraires annoncés dès le départ", sub: "[Convention d'honoraires écrite avant toute mission.]", btns: [["Demander une estimation", "/contact"]] }),
    priceListSec("Barème indicatif", "[Tarifs HT ou TTC : à préciser.]", [["Première consultation", "[prix]", "[Durée.]"], ["Rédaction d'acte", "[prix]", "[Selon complexité.]"], ["Taux horaire", "[prix]", "[Pour les missions au temps passé.]"], ["Procédure", "[prix]", "[Forfait selon la procédure.]"]], "[Les montants définitifs sont fixés dans la convention.]"),
    compareCols("Forfait ou temps passé", ["Forfait", ["[Budget connu d'avance]", "[Périmètre précis]", "[Idéal pour les actes]"]], ["Temps passé", ["[Facturé à l'heure]", "[Souple]", "[Idéal pour le contentieux]"]]),
    alertBar("info", "Aide juridictionnelle", "[Conditions de prise en charge : à renseigner.]"),
    faqSec("Questions sur les frais", [["Y a-t-il des frais en plus ?", "[Réponse réelle.]"], ["Comment payer ?", "[Moyens réels.]"], ["Puis-je obtenir une provision ?", "[Réponse réelle.]"], ["Quel est le délai de facturation ?", "[Réponse réelle.]"]], "two")], SEC.droit, "vitrine", ["honoraires", "tarifs", "convention"]);
  page("juridique-rdv", cats.droit, "Cabinet d'avocats — prise de rendez-vous", "Étapes, rappel de confidentialité, formulaire et horaires d'accueil.", () => [
    heroMini({ crumb: "Rendez-vous", title: "Demander un rendez-vous", sub: "[Cabinet ou visioconférence.]" }),
    stepsGrid("Comment se passe le premier rendez-vous", "", [["Vous exposez", "Votre situation en quelques lignes."], ["Nous analysons", "[Documents utiles.]"], ["Nous proposons", "Stratégie et honoraires."]], { flat: true, align: "left" }),
    alertBar("info", "Confidentialité", "Vos informations sont couvertes par le secret professionnel."),
    ...formSec("Votre demande", "Domaine, urgence et coordonnées."),
    hoursSec("Accueil du cabinet", ["Lundi – Vendredi", "Samedi"], "[Rendez-vous uniquement.]")], SEC.droit, "vitrine", ["rendez-vous", "consultation", "formulaire"]);

  // =============== PRODUCTEUR LOCAL ===============
  page("ferme-accueil", cats.ferme, "Producteur local — accueil", "Histoire de la ferme, produits, mosaïque de la saison, vente directe et visite.", () => [
    heroAsym({ kicker: "[Ferme · Commune]", title: "[Du champ à votre assiette]", sub: "[Ce que vous cultivez ou élevez, et vos méthodes.]", btns: [["Voir les produits", "/contact"], ["Commander un panier", "/contact", "outline"]], visual: "Emplacement de la photo de la ferme", tpl: "1fr 1fr" }),
    iconGrid("Nos engagements", "", [["heart", "Respect du vivant", "[Pratiques réelles : labels éventuels.]"], ["mapPin", "Circuit court", "[Distance, vente directe.]"], ["sun", "Produits de saison", "[Calendrier.]"], ["users", "Savoir-faire", "[Transmission.]"]], { n: 4, pos: "top", plain: true }),
    mosaic("La saison en images", ["Récolte", "Atelier", "Marché", "Paysage"], [1, 2, 1, 1], { cols: 4 }),
    mediaText("Notre histoire", "[Qui, depuis quand, pourquoi : racontez en peu de mots.]", { rev: true, btn: ["Lire l'histoire", "/contact"] }),
    ctaBand("Où nous trouver", "[Marchés, boutique à la ferme, points de retrait.]", "Voir les points de vente", "/contact")], SEC.ferme, "vitrine", ["ferme", "producteur", "circuit court", "vente directe"]);
  page("ferme-produits", cats.ferme, "Producteur local — nos produits", "Produits par saison en onglets, liste de prix, comparatif des modes de vente.", () => [
    heroMini({ crumb: "Produits", title: "Nos produits", sub: "[Disponibilités selon la saison.]" }),
    tabsSec("Selon la saison", "", [["Printemps", "[Produits disponibles.]", "sun"], ["Été", "[Produits disponibles.]", "sun"], ["Automne", "[Produits disponibles.]", "heart"], ["Hiver", "[Produits disponibles.]", "moon"]]),
    priceListSec("Tarifs", "[Prix TTC, à renseigner.]", [["[Produit 1]", "[prix / unité]", "[Conditionnement.]"], ["[Produit 2]", "[prix / unité]", "[Conditionnement.]"], ["[Produit 3]", "[prix / unité]", "[Conditionnement.]"], ["[Produit 4]", "[prix / unité]", "[Conditionnement.]"]], "[Prix indicatifs, selon la récolte.]"),
    tableSec("Où acheter", "", [["Mode", "Où", "Quand"], ["Ferme", "[Adresse]", "[Jours]"], ["Marché", "[Marché]", "[Jours]"], ["Panier", "[Retrait]", "[Jours]"]], { align: "center", maxWidth: "760px" })], SEC.ferme, "vitrine", ["produits", "saison", "tarifs"]);
  page("ferme-paniers", cats.ferme, "Producteur local — paniers et abonnements", "Trois formules de panier, fonctionnement en étapes à plat et questions sur deux colonnes.", () => [
    heroCenter({ title: "Un panier frais, chaque semaine", sub: "[Composition, retrait ou livraison.]", btns: [["S'abonner", "/contact"]], trust: [["Sans engagement [à confirmer]", "check"], ["Retrait [lieux]", "mapPin"]] }),
    pricingSec("Les paniers", "", [["Petit", "[prix réel]", "par semaine", "[Pour une ou deux personnes.]", ["[Composition]", "[Fréquence]"]], ["Familial", "[prix réel]", "par semaine", "[Pour quatre personnes.]", ["[Composition]", "[Fréquence]", "[Recettes]"], true], ["Gourmand", "[prix réel]", "par semaine", "[Avec produits transformés.]", ["[Composition]", "[Fréquence]"]]]),
    stepsGrid("Comment ça marche", "", [["Choisissez", "Votre panier."], ["Planifiez", "[Jour de retrait.]"], ["Profitez", "[Contenu de saison.]"]], { flat: true }),
    faqSec("Questions sur les paniers", [["Puis-je suspendre ?", "[Réponse réelle.]"], ["Que contient un panier ?", "[Réponse réelle.]"], ["Comment payer ?", "[Réponse réelle.]"], ["Livrez-vous ?", "[Réponse réelle.]"]], "two")], SEC.ferme, "vitrine", ["panier", "abonnement", "AMAP"]);
  page("ferme-visite", cats.ferme, "Producteur local — visites et ateliers", "Programme d'une visite en chronologie, horaires, contact et réservation en formulaire.", () => [
    heroBand({ title: "Visitez la ferme", sub: "[Visites, ateliers, groupes scolaires.]", btns: [["Réserver une visite", "/contact", "outline"]], side: card([badge("[Public concerné]", "success"), H("[Durée]", "3"), P("[Nombre de personnes, âge conseillé.]", muted)]), tpl: "3fr 2fr" }),
    timelineSec("Déroulé d'une visite", "", [["[Accueil]", "Présentation", "[Ce que l'on voit.]"], ["[Parcours]", "Visite", "[Animaux, cultures.]"], ["[Atelier]", "Atelier", "[Activité proposée.]"], ["[Dégustation]", "Dégustation", "[Produits servis.]"]]),
    contactSplit("Informations pratiques", [["[Adresse]", "mapPin"], ["[Tenue conseillée]", "info"], ["[Accessibilité]", "heart"]], [H("Horaires", "3"), P("[Jours et horaires de visite.]", muted)]),
    ...inviteForm("Réserver", "[Groupes : nous contacter.]", "Demande de visite", "Date, nombre de personnes, âge des participants.")], SEC.ferme, "vitrine", ["visite", "atelier", "ferme"]);

  // =============== MARIAGE ET ÉVÉNEMENTIEL ===============
  page("mariage-accueil", cats.mariage, "Mariage et événements — accueil", "Hero centré avec types d'événements, savoir-faire en mosaïque, déroulé et avis.", () => [
    heroCenter({ kicker: "[Organisation · Région]", title: "[Un jour parfait, sans stress]", sub: "[Mariages, anniversaires, événements d'entreprise.]", btns: [["Demander un devis", "/contact"], ["Voir nos réalisations", "/contact", "outline"]], pills: ["[Mariage]", "[Anniversaire]", "[Séminaire]", "[Baptême]"] }),
    iconGrid("Ce que nous faisons pour vous", "", [["calendarClock", "Coordination", "[Jour J et préparation.]"], ["palette", "Décoration", "[Scénographie.]"], ["users", "Prestataires", "[Réseau de partenaires.]"], ["listChecks", "Planning", "[Rétroplanning.]"]], { n: 4, pos: "left", align: "center", size: "32" }),
    mosaic("Instants choisis", ["Cérémonie", "Décor de table", "Salle", "Extérieur", "Détail floral", "Réception"], [1, 2, 1, 1, 1, 2], { align: "center" }),
    quoteSec("[Retour d'un couple, avec son accord.]", "[Prénoms, date]", { stars: true }),
    ctaBand("Racontez-nous votre projet", "[Date, lieu, nombre d'invités.]", "Demander un devis", "/contact")], SEC.mariage, "vitrine", ["mariage", "événement", "organisation"]);
  page("mariage-formules", cats.mariage, "Mariage et événements — formules", "Formules de prestation, tableau détaillé et extras avec prix.", () => [
    heroMini({ crumb: "Formules", title: "Nos formules", sub: "[De la coordination du jour J à l'organisation complète.]" }),
    pricingSec("Choisissez votre niveau d'accompagnement", "", [["Jour J", "[prix réel]", "à partir de", "[Coordination le jour même.]", ["[Prestation 1]", "[Prestation 2]"]], ["Partielle", "[prix réel]", "à partir de", "[Préparation + jour J.]", ["[Prestation 1]", "[Prestation 2]", "[Prestation 3]"], true], ["Complète", "[prix réel]", "à partir de", "[De A à Z.]", ["[Prestation 1]", "[Prestation 2]", "[Prestation 3]", "[Prestation 4]"]]]),
    tableSec("Détail des formules", "", [["Prestation", "Jour J", "Partielle", "Complète"], ["Rendez-vous de préparation", "[x]", "[x]", "[x]"], ["Recherche des prestataires", "[non]", "[oui]", "[oui]"], ["Décoration", "[non]", "[option]", "[oui]"], ["Coordination le jour J", "[oui]", "[oui]", "[oui]"]], { align: "center", maxWidth: "980px" }),
    priceListSec("Extras", "", [["Décoration florale", "[prix]", "[Description.]"], ["Photobooth", "[prix]", "[Description.]"], ["Bar à cocktails", "[prix]", "[Description.]"]], "[Tarifs HT ou TTC : à préciser.]")], SEC.mariage, "vitrine", ["formules", "tarifs", "prestations"]);
  page("mariage-realisations", cats.mariage, "Mariage et événements — réalisations", "Galerie asymétrique, histoires de couples et appel à nous suivre.", () => [
    heroCenter({ title: "Nos plus belles réceptions", sub: "[Quelques événements récents, avec l'accord des personnes.]", btns: [["Nous contacter", "/contact"]] }),
    mosaic("", ["[Événement 1]", "[Événement 2]", "[Événement 3]", "[Événement 4]", "[Événement 5]", "[Événement 6]", "[Événement 7]", "[Événement 8]"], [2, 1, 1, 1, 1, 2, 1, 1], { cols: 4, captions: false }),
    section([head("Leur histoire", "", { align: "center" }), cols(3, (i) => [{ type: "quote", props: { text: "[Retour réel, avec l'accord des mariés.]", author: `[Prénoms ${i + 1}]` } }])]),
    ctaBand("Imaginons le vôtre", "[Prise de contact.]", "Nous écrire", "/contact")], SEC.mariage, "vitrine", ["galerie", "réalisations", "photos"]);
  page("mariage-devis", cats.mariage, "Mariage et événements — demande de devis", "Chronologie de l'organisation, formulaire détaillé et réassurance.", () => [
    heroMini({ crumb: "Devis", title: "Demander un devis", sub: "[Réponse sous X jours ouvrés.]" }),
    timelineSec("Comment nous travaillons", "", [["[Premier échange]", "Écoute", "[Appel ou rendez-vous.]"], ["[Proposition]", "Devis détaillé", "[Prestations et budget.]"], ["[Préparation]", "Organisation", "[Suivi.]"], ["[Jour J]", "Coordination", "[Équipe sur place.]"]], true),
    ...formSec("Parlez-nous de votre événement", "Type, date, lieu, nombre d'invités, budget."),
    trustBar([["Devis gratuit [à confirmer]", "check"], ["Réponse sous [délai]", "clock"], ["Sans engagement", "shield"]])], SEC.mariage, "vitrine", ["devis", "formulaire", "événement"]);

  // =============== SALLE DE SPORT ===============
  page("sport-accueil", cats.sport, "Salle de sport — accueil", "Accroche asymétrique avec essai, atouts, espaces, planning résumé et abonnements.", () => [
    heroAsym({ kicker: "[Salle · Ville]", title: "[Bougez à votre rythme]", sub: "[Public, ambiance, équipements.]", btns: [["Séance d'essai", "/contact"], ["Voir les abonnements", "/contact", "outline"]], side: card([badge("[Ouvert : horaires]", "success"), H("Séance d'essai", "3"), P("[Conditions de l'essai.]", muted), B("Réserver", "/contact")]), tpl: "3fr 2fr", gridExtra: { alignItems: "stretch" } }),
    trustBar([["Matériel récent", "zap"], ["Coachs diplômés", "trophy"], ["Cours collectifs", "users"], ["Vestiaires", "home"]]),
    iconGrid("Nos espaces", "", [["activity", "Musculation", "[Équipements.]"], ["heart", "Cardio", "[Équipements.]"], ["users", "Cours collectifs", "[Studio.]"], ["sparkles", "Détente", "[Sauna ou étirements.]"]], { n: 4, plain: true, pos: "top", align: "center" }),
    testiSec("Ils s'entraînent ici", 3),
    ctaBand("Essayez avant de choisir", "[Séance offerte ou tarif.]", "Réserver mon essai", "/contact")], SEC.sport, "vitrine", ["salle de sport", "fitness", "abonnement"]);
  page("sport-cours", cats.sport, "Salle de sport — cours et planning", "Cours en onglets, planning de la semaine, niveaux et conseils.", () => [
    heroMini({ crumb: "Cours", title: "Cours collectifs", sub: "[Tous niveaux, sur réservation ou en accès libre.]" }),
    tabsSec("Les cours", "", [["Cardio", "[Intensité, durée, matériel.]", "activity"], ["Renforcement", "[Intensité, durée, matériel.]", "zap"], ["Souplesse", "[Intensité, durée, matériel.]", "heart"], ["Combat", "[Intensité, durée, matériel.]", "shield"]]),
    tableSec("Planning", "[Mis à jour chaque semaine.]", [["", "Lundi", "Mercredi", "Vendredi", "Samedi"], ["[Matin]", "[cours]", "[cours]", "[cours]", "[cours]"], ["[Midi]", "[cours]", "[cours]", "[cours]", "[cours]"], ["[Soir]", "[cours]", "[cours]", "[cours]", "[cours]"]], { align: "center", maxWidth: "980px" }),
    mediaText("Débutant ou confirmé ?", "[Comment les cours s'adaptent au niveau.]", { rev: true, items: [["Échauffement guidé", "check"], ["Variantes de difficulté", "check"], ["Coach présent", "check"]] })], SEC.sport, "vitrine", ["cours collectifs", "planning", "horaires"]);
  page("sport-abonnements", cats.sport, "Salle de sport — abonnements", "Formules, comparatif d'accès et conditions en bascules.", () => [
    heroCenter({ title: "Un abonnement à votre mesure", sub: "[Sans engagement ou engagement : à préciser.]", btns: [["Nous poser une question", "/contact", "outline"]] }),
    pricingSec("Formules", "", [["Accès libre", "[prix réel]", "par mois", "[Salle en accès libre.]", ["[Horaires]", "[Vestiaires]"]], ["Salle + cours", "[prix réel]", "par mois", "[Tous les cours collectifs.]", ["[Horaires]", "[Cours]", "[Bilan]"], true], ["Coaching", "[prix réel]", "par mois", "[Suivi personnalisé.]", ["[Séances]", "[Programme]"]]]),
    compareCols("Engagement ou sans engagement", ["Sans engagement", ["[Résiliable à tout moment]", "[Tarif mensuel plus élevé]"]], ["Avec engagement", ["[Durée]", "[Tarif réduit]"]]),
    toggleList("Conditions", [["Frais d'inscription", "[Montant et ce qu'il comprend.]"], ["Résiliation", "[Préavis réel.]"], ["Suspension", "[Conditions.]"]])], SEC.sport, "vitrine", ["abonnements", "tarifs", "engagement"]);
  page("sport-essai", cats.sport, "Salle de sport — séance d'essai", "Bandeau d'invitation, déroulé de l'essai, formulaire et FAQ latérale.", () => [
    heroBand({ title: "Votre séance d'essai", sub: "[Offerte ou tarif : à préciser.]", btns: [["Réserver", "/contact", "outline"]], side: card([H("Pendant l'essai", "3"), iconlist([["Visite de la salle", "check"], ["Séance avec un coach", "check"], ["Bilan de forme", "check"]])]), tpl: "1fr 1fr" }),
    stepsGrid("En trois étapes", "", [["Réservez", "Choisissez un créneau."], ["Venez", "[Tenue, documents.]"], ["Décidez", "Sans obligation."]], { align: "left" }),
    ...formSec("Réserver mon essai", "Vos coordonnées et votre objectif."),
    faqSec("Avant de venir", [["Que dois-je apporter ?", "[Réponse réelle.]"], ["Faut-il un certificat médical ?", "[Réponse réelle.]"], ["Puis-je venir accompagné(e) ?", "[Réponse réelle.]"]], "side")], SEC.sport, "vitrine", ["essai", "séance gratuite", "réservation"]);

  // =============== SAAS B2B ===============
  page("saasb2b-accueil", cats.saas, "SaaS B2B — accueil", "Hero produit, logos, bénéfices, cas d'usage en onglets, preuve et démonstration.", () => [
    heroAsym({ kicker: "[Logiciel · Catégorie]", title: "[Le résultat promis à vos équipes]", sub: "[Pour qui, quel problème, quelle différence.]", btns: [["Demander une démo", "/contact"], ["Voir les tarifs", "/contact", "outline"]], visual: "Emplacement de la capture d'écran du produit", tpl: "5fr 6fr" }),
    section([H("[Ils nous font confiance]", "3", { textAlign: "center" }), grid(5, [1, 2, 3, 4, 5].map((n) => ph(`Emplacement du logo ${n}`, "56px")))], { paddingTop: "32px", paddingBottom: "32px" }),
    iconGrid("Pourquoi les équipes l'adoptent", "", [["zap", "Rapide à déployer", "[Délai réel de mise en route.]"], ["shield", "Sécurisé", "[Garanties réelles.]"], ["plug", "Connecté", "[Intégrations.]"]], { n: 3 }),
    tabsSec("Par équipe", "", [["Direction", "[Valeur et indicateurs.]", "barChart"], ["Opérations", "[Gain de temps concret.]", "settings"], ["Finance", "[Contrôle et conformité.]", "coin"]]),
    quoteSec("[Témoignage client réel, avec accord.]", "[Prénom N., fonction, société]", { stars: true }),
    ctaBand("Voyez-le en action", "[Démo de [x] minutes, sans engagement.]", "Demander une démo", "/contact", ["Essayer gratuitement", "/contact"])], SEC.saas, "vitrine", ["logiciel", "SaaS", "B2B", "démo"]);
  page("saasb2b-fonctionnalites", cats.saas, "SaaS B2B — fonctionnalités", "Fonctionnalités en onglets verticaux, mosaïque bento, comparatif avec l'existant.", () => [
    heroMini({ crumb: "Fonctionnalités", title: "Tout ce qu'il faut, au même endroit", sub: "[Une phrase sur l'ensemble de la plateforme.]" }),
    tabsSec("Les modules", "", [["Suivi", "[Ce que fait le module, pour qui.]", "activity"], ["Automatisations", "[Ce que fait le module, pour qui.]", "bot"], ["Rapports", "[Ce que fait le module, pour qui.]", "barChart"], ["Collaboration", "[Ce que fait le module, pour qui.]", "users"]], true),
    section([cols(2, (i) => (i === 0 ? [card([H("[Fonctionnalité phare]", "2"), P("[Explication détaillée et cas d'usage.]", muted), ph("Emplacement de la capture d'écran", "200px")], { minHeight: "360px" })] : [card([H("[Fonctionnalité 2]", "3"), P("[Texte court.]", muted)]), card([H("[Fonctionnalité 3]", "3"), P("[Texte court.]", muted)]), card([H("[Fonctionnalité 4]", "3"), P("[Texte court.]", muted)])]))]),
    tableSec("Avant / avec la plateforme", "", [["Tâche", "Avant", "Avec"], ["[Tâche 1]", "[Manuel]", "[Automatisé]"], ["[Tâche 2]", "[Dispersé]", "[Centralisé]"], ["[Tâche 3]", "[Lent]", "[Rapide]"]], { align: "center" }),
    ctaBand("Testez avec vos données", "[Période d'essai : à préciser.]", "Essayer", "/contact")], SEC.saas, "vitrine", ["fonctionnalités", "modules", "produit"]);
  page("saasb2b-tarifs", cats.saas, "SaaS B2B — tarifs", "Trois offres dont une mise en avant, comparatif par fonctionnalité et FAQ commerciale.", () => [
    heroMini({ crumb: "Tarifs", title: "Des tarifs qui suivent votre croissance", sub: "[Facturation mensuelle ou annuelle : à préciser.]" }),
    trustBar([["Sans frais d'installation [à confirmer]", "check"], ["Facturation [mensuelle ou annuelle]", "calendarClock"], ["Support inclus", "help"]]),
    pricingSec("Formules", "", [["Équipe", "[prix réel]", "par utilisateur / mois", "[Pour démarrer.]", ["[Fonction 1]", "[Fonction 2]", "[Support standard]"]], ["Entreprise", "[prix réel]", "par utilisateur / mois", "[Pour les équipes en croissance.]", ["[Fonction 1]", "[Fonction 2]", "[Intégrations]", "[Support prioritaire]"], true], ["Sur mesure", "[Sur devis]", "", "[Pour les grandes organisations.]", ["[Déploiement dédié]", "[SSO]", "[Engagement de service]"]]]),
    tableSec("Comparer en détail", "", [["Fonction", "Équipe", "Entreprise", "Sur mesure"], ["[Utilisateurs]", "[x]", "[x]", "[illimité]"], ["[Intégrations]", "[non]", "[oui]", "[oui]"], ["[Support]", "[e-mail]", "[prioritaire]", "[dédié]"], ["[Sécurité avancée]", "[non]", "[option]", "[oui]"]], { align: "center", maxWidth: "980px" }),
    faqSec("Questions sur la facturation", [["Puis-je changer d'offre ?", "[Réponse réelle.]"], ["Y a-t-il un essai gratuit ?", "[Réponse réelle.]"], ["Comment résilier ?", "[Réponse réelle.]"], ["Facturez-vous la TVA ?", "[Réponse réelle.]"]], "side")], SEC.saas, "vitrine", ["tarifs", "abonnement", "formules"]);
  page("saasb2b-securite", cats.saas, "SaaS B2B — sécurité et conformité", "Engagements de sécurité en bascules, chronologie de réponse aux incidents et documents.", () => [
    heroMini({ crumb: "Sécurité", title: "Sécurité et conformité", sub: "[Ce que nous protégeons et comment.]" }),
    iconGrid("Nos engagements", "", [["lock", "Chiffrement", "[Au repos et en transit : à préciser.]"], ["shield", "Accès", "[Rôles, authentification.]"], ["history", "Sauvegardes", "[Fréquence, durée de conservation.]"], ["globe", "Hébergement", "[Localisation réelle.]"]], { n: 2, pos: "left", size: "48" }),
    timelineSec("En cas d'incident", "", [["[Détection]", "Alerte", "[Surveillance.]"], ["[Analyse]", "Qualification", "[Équipe.]"], ["[Information]", "Prévenir les clients", "[Délai réel.]"], ["[Correction]", "Retour à la normale", "[Compte rendu.]"]], true),
    toggleList("Documents disponibles", [["Politique de sécurité", "[Lien ou demande.]"], ["Accord de traitement des données", "[Disponibilité.]"], ["Rapports d'audit", "[Disponibilité.]"]]),
    contactSplit("Une question sécurité ?", [["[Adresse e-mail du responsable]", "mail"], ["[Délai de réponse]", "clock"]], [H("Questionnaire de conformité", "3"), P("[Comment demander nos réponses types.]", muted), B("Nous écrire", "/contact", "outline")])], SEC.saas, "vitrine", ["sécurité", "RGPD", "conformité"]);
  page("saasb2b-demo", cats.saas, "SaaS B2B — demande de démonstration", "Bandeau, programme de la démo, formulaire pro et rappel de ce qui suit.", () => [
    heroBand({ title: "Voyez la plateforme sur vos cas d'usage", sub: "[Durée, format, interlocuteur.]", btns: [["Choisir un créneau", "/contact", "outline"]], side: card([H("Ce que vous verrez", "3"), iconlist([["[Parcours 1]", "checkCircle"], ["[Parcours 2]", "checkCircle"], ["[Parcours 3]", "checkCircle"]])]), tpl: "3fr 2fr" }),
    stepsGrid("Après votre demande", "", [["Prise de contact", "[Délai réel.]"], ["Démo personnalisée", "[Durée.]"], ["Essai ou devis", "[Selon votre besoin.]"]], { align: "center" }),
    ...formSec("Demander une démo", "Société, fonction, taille de l'équipe et besoin."),
    quoteSec("[Retour d'un client sur sa mise en route.]", "[Prénom N., société]", { pad: "48px" })], SEC.saas, "vitrine", ["démo", "contact commercial", "essai"]);

  // =============== ARTISAN / BTP ===============
  page("btp-accueil", cats.btp, "Artisan et BTP — accueil", "Accroche asymétrique, bandeau de garanties, métiers, réalisations et demande de devis.", () => [
    heroAsym({ kicker: "[Entreprise · Zone d'intervention]", title: "[Des travaux bien faits, dans les délais]", sub: "[Métiers, types de chantiers et engagements.]", btns: [["Demander un devis", "/contact"], ["Voir nos chantiers", "/contact", "outline"]], visual: "Emplacement de la photo d'un chantier", tpl: "6fr 5fr" }),
    trustBar([["Devis gratuit [à confirmer]", "check"], ["Garantie décennale", "shield"], ["Artisans qualifiés", "trophy"], ["Intervention sous [délai]", "clock"]]),
    iconGrid("Nos métiers", "", [["home", "[Maçonnerie]", "[Prestations.]"], ["settings", "[Plomberie]", "[Prestations.]"], ["zap", "[Électricité]", "[Prestations.]"], ["palette", "[Peinture]", "[Prestations.]"]], { n: 4, pos: "top", plain: true, align: "center" }),
    mosaic("Chantiers récents", ["Rénovation", "Extension", "Salle de bain"], [2, 1, 1], { cols: 4 }),
    ctaBand("Un projet de travaux ?", "[Déplacement et devis : conditions.]", "Demander un devis", "/contact")], SEC.btp, "vitrine", ["artisan", "travaux", "bâtiment", "devis"]);
  page("btp-services", cats.btp, "Artisan et BTP — prestations", "Prestations en onglets, tarifs indicatifs et zone d'intervention.", () => [
    heroMini({ crumb: "Prestations", title: "Nos prestations", sub: "[Particuliers, professionnels, copropriétés.]" }),
    tabsSec("Par type de travaux", "", [["Gros œuvre", "[Interventions, délais.]", "home"], ["Second œuvre", "[Interventions, délais.]", "settings"], ["Finitions", "[Interventions, délais.]", "palette"], ["Dépannage", "[Intervention rapide.]", "zap"]], true),
    priceListSec("Tarifs indicatifs", "[Prix HT ou TTC à préciser.]", [["Déplacement", "[prix]", "[Zone.]"], ["Heure de main-d'œuvre", "[prix]", "[Qualification.]"], ["Forfait dépannage", "[prix]", "[Ce qu'il comprend.]"]], "[Le devis fait foi.]"),
    mediaText("Zone d'intervention", "[Communes et rayon d'action.]", { rev: true, h: "260px", items: [["[Commune 1]", "mapPin"], ["[Commune 2]", "mapPin"]] }),
    alertBar("info", "Urgence", "[Numéro de dépannage et horaires.]")], SEC.btp, "vitrine", ["prestations", "métiers", "tarifs"]);
  page("btp-realisations", cats.btp, "Artisan et BTP — réalisations", "Galerie avant/après, déroulé d'un chantier et témoignages de clients.", () => [
    heroCenter({ title: "Nos chantiers", sub: "[Avant, pendant, après.]", btns: [["Demander un devis", "/contact"]] }),
    mosaic("Avant / après", ["Avant : cuisine", "Après : cuisine", "Avant : façade", "Après : façade"], [1, 1, 1, 1], { cols: 2, align: "center" }),
    timelineSec("Un chantier de A à Z", "", [["[Visite]", "Relevé", "[Mesures.]"], ["[Devis]", "Chiffrage", "[Détail.]"], ["[Travaux]", "Exécution", "[Planning.]"], ["[Réception]", "Livraison", "[Contrôle.]"]]),
    testiSec("Ils nous ont fait confiance", 2)], SEC.btp, "vitrine", ["chantiers", "avant après", "galerie"]);
  page("btp-devis", cats.btp, "Artisan et BTP — demande de devis", "Garanties, ce qu'il faut préparer, formulaire détaillé et FAQ.", () => [
    heroMini({ crumb: "Devis", title: "Demander un devis gratuit", sub: "[Réponse sous X jours.]" }),
    bullets("Pour un devis précis", ["Nature des travaux", "Adresse du chantier", "Photos si possible"], ["Calendrier souhaité", "Budget envisagé", "Accès au site"]),
    ...formSec("Votre projet", "Coordonnées et description des travaux."),
    trustBar([["Assurance décennale", "shield"], ["Devis détaillé", "fileText"], ["Sans engagement", "check"]]),
    faqSec("Questions courantes", [["Le devis est-il gratuit ?", "[Réponse réelle.]"], ["Quand puis-je commencer ?", "[Délais réels.]"], ["Comment payer ?", "[Échéancier.]"]], "side")], SEC.btp, "vitrine", ["devis", "chantier", "formulaire"]);

  // =============== TOURISME ===============
  page("tourisme-accueil", cats.tourisme, "Tourisme — accueil", "Hero centré avec envies, séjours phares, saison, avis et appel à réserver.", () => [
    heroCenter({ kicker: "[Destination · Région]", title: "[Vivez la région autrement]", sub: "[Types d'expériences, saisons, public.]", btns: [["Voir les séjours", "/contact"], ["Nous contacter", "/contact", "outline"]], pills: ["[Nature]", "[Culture]", "[Gastronomie]", "[Famille]"] }),
    iconGrid("Nos envies", "", [["sun", "[Séjours]", "[Durée, public.]"], ["mapPin", "[Circuits]", "[Itinéraires.]"], ["heart", "[Escapades]", "[Week-ends.]"], ["users", "[Groupes]", "[Sur mesure.]"]], { n: 2, pos: "left", size: "48" }),
    mosaic("Lieux à découvrir", ["Paysage", "Village", "Table locale", "Activité", "Patrimoine"], [2, 1, 1, 1, 1], { align: "center" }),
    quoteSec("[Retour d'un voyageur, avec son accord.]", "[Prénom N., séjour]", { stars: true }),
    ctaBand("Où partez-vous ?", "[Conseil personnalisé.]", "Préparer mon séjour", "/contact")], SEC.tourisme, "vitrine", ["tourisme", "séjours", "destination"]);
  page("tourisme-sejours", cats.tourisme, "Tourisme — séjours et circuits", "Séjours en onglets, tableau de comparaison et formules d'hébergement.", () => [
    heroMini({ crumb: "Séjours", title: "Nos séjours", sub: "[Durée, saison, niveau.]" }),
    tabsSec("Choisissez votre formule", "", [["Week-end", "[Programme et durée.]", "calendarClock"], ["Semaine", "[Programme et durée.]", "sun"], ["Itinérant", "[Programme et durée.]", "mapPin"], ["Sur mesure", "[Programme et durée.]", "sparkles"]]),
    tableSec("Comparatif", "", [["", "Week-end", "Semaine", "Itinérant"], ["Durée", "[x]", "[x]", "[x]"], ["Hébergement", "[type]", "[type]", "[type]"], ["Repas", "[inclus ?]", "[inclus ?]", "[inclus ?]"], ["À partir de", "[prix]", "[prix]", "[prix]"]], { align: "center" }),
    flipRow("Les incontournables", [["mapPin", "[Lieu 1]", "[Pourquoi y aller.]"], ["heart", "[Lieu 2]", "[Pourquoi y aller.]"], ["sun", "[Lieu 3]", "[Pourquoi y aller.]"]], { effect: "fade" })], SEC.tourisme, "vitrine", ["séjours", "circuits", "voyage"]);
  page("tourisme-itineraire", cats.tourisme, "Tourisme — itinéraire jour par jour", "Programme détaillé en chronologie, informations pratiques et ce qui est inclus.", () => [
    heroBand({ title: "[Nom de l'itinéraire]", sub: "[Durée · niveau · saison.]", btns: [["Réserver ce séjour", "/contact", "outline"]], side: card([H("Inclus", "3"), iconlist([["[Hébergement]", "checkCircle"], ["[Repas]", "checkCircle"], ["[Guide]", "checkCircle"]])]), tpl: "3fr 2fr" }),
    timelineSec("Jour par jour", "", [["[Jour 1]", "[Arrivée]", "[Programme.]"], ["[Jour 2]", "[Découverte]", "[Programme.]"], ["[Jour 3]", "[Activité]", "[Programme.]"], ["[Jour 4]", "[Terroir]", "[Programme.]"], ["[Jour 5]", "[Départ]", "[Programme.]"]]),
    compareCols("Inclus et non inclus", ["Inclus", ["[Prestation 1]", "[Prestation 2]"]], ["Non inclus", ["[Transport jusqu'au départ]", "[Assurances]"]]),
    toggleList("Informations pratiques", [["Quand partir ?", "[Saisons conseillées.]"], ["Quel équipement ?", "[Liste.]"], ["Accessibilité ?", "[Niveau physique requis.]"]])], SEC.tourisme, "vitrine", ["itinéraire", "programme", "circuit"]);
  page("tourisme-reservation", cats.tourisme, "Tourisme — réservation", "Étapes, formulaire de demande, conditions de vente et questions.", () => [
    heroMini({ crumb: "Réserver", title: "Réserver votre séjour", sub: "[Disponibilités confirmées sous X jours.]" }),
    stepsGrid("Votre réservation", "", [["Demande", "Dates et participants."], ["Confirmation", "[Délai réel.]"], ["Acompte", "[Montant et date.]"], ["Départ", "[Documents remis.]"]], { flat: true, align: "left" }),
    ...formSec("Demande de réservation", "Séjour, dates, nombre de voyageurs."),
    alertBar("warning", "Conditions de vente", "[Annulation, assurance, modification : à renseigner.]"),
    faqSec("Avant de partir", [["Faut-il une assurance ?", "[Réponse réelle.]"], ["Puis-je venir avec des enfants ?", "[Réponse réelle.]"], ["Que faire en cas de météo difficile ?", "[Réponse réelle.]"]], "two")], SEC.tourisme, "vitrine", ["réservation", "demande", "conditions"]);

  // =============== PAGES GÉNÉRIQUES ===============
  page("apropos-recit", "À propos", "À propos — notre histoire", "Récit en chronologie, valeurs, citation du fondateur et appel à nous rencontrer.", () => [
    section([G("5fr 7fr", [ph("Emplacement de la photo d'équipe", "360px"), stack([badge("Notre histoire"), H("[Pourquoi nous existons]", "1", { fontSize: "44px" }), P("[Racontez l'origine du projet : le déclic, le premier client, ce qui a changé depuis.]", { fontSize: "18px", ...muted })])])], { paddingTop: "80px" }),
    timelineSec("Les grandes étapes", "", [["[Année]", "[Création]", "[Contexte.]"], ["[Année]", "[Premier jalon]", "[Ce qui a changé.]"], ["[Année]", "[Nouveau départ]", "[Ce qui nous a fait évoluer.]"], ["[Aujourd'hui]", "[Ce que nous faisons]", "[Notre cap.]"]], true),
    iconGrid("Ce qui nous guide", "", [["heart", "[Valeur 1]", "[Ce que cela change.]"], ["shield", "[Valeur 2]", "[Ce que cela change.]"], ["users", "[Valeur 3]", "[Ce que cela change.]"]], { n: 3, plain: true, pos: "top", align: "center" }),
    quoteSec("[Citation du fondateur sur la mission.]", "[Prénom Nom, fonction]"),
    ctaBand("Rencontrons-nous", "[Invitation à nous contacter.]", "Nous écrire", "/contact")], [], "", ["histoire", "récit", "valeurs", "à propos"]);
  page("equipe", "Équipe", "Équipe — qui sommes-nous", "Fiches de l'équipe sur grille de quatre, culture d'entreprise et offres d'emploi.", () => [
    heroCenter({ title: "L'équipe", sub: "[Quelques mots sur la façon de travailler ensemble.]", btns: [["Rejoindre l'équipe", "/contact", "outline"]] }),
    teamSec("Les personnes", "", 4, { role: "[Fonction]", h: "180px" }),
    section([G("1fr 1fr", [stack([H("[Notre façon de travailler]", "2"), P("[Rituels, valeurs, ce que l'on attend d'un nouveau membre.]", muted), iconlist([["[Pratique 1]", "check"], ["[Pratique 2]", "check"], ["[Pratique 3]", "check"]])]), ph("Emplacement de la photo de l'équipe au travail", "300px")])]),
    ctaBand("Nous recrutons", "[Postes ouverts ou candidature spontanée.]", "Voir les offres", "/contact")], [], "", ["équipe", "collaborateurs", "recrutement"]);
  page("galerie", "Galerie", "Galerie — images et projets", "Mosaïque de neuf visuels, filtres par thème et appel à l'action.", () => [
    heroMini({ crumb: "Galerie", title: "Galerie", sub: "[Ce que l'on voit ici : lieux, projets, moments.]" }),
    pillRow("Thèmes", ["[Thème 1]", "[Thème 2]", "[Thème 3]", "[Thème 4]"]),
    mosaic("", ["[Légende 1]", "[Légende 2]", "[Légende 3]", "[Légende 4]", "[Légende 5]", "[Légende 6]", "[Légende 7]", "[Légende 8]", "[Légende 9]"], [1, 2, 1, 1, 1, 2, 2, 1, 1], { cols: 4 }),
    ctaBand("Un projet en commun ?", "[Prise de contact.]", "Nous écrire", "/contact")], [], "", ["galerie", "photos", "mosaïque"]);
  page("faq-complete", "Aide", "FAQ — centre d'aide complet", "Questions classées par thème en onglets, accordéon libre et contact humain.", () => [
    heroCenter({ title: "Comment pouvons-nous vous aider ?", sub: "[Les réponses aux questions les plus fréquentes.]", btns: [["Contacter le support", "/contact", "outline"]] }),
    tabsSec("Par thème", "", [["Commande", "[Questions et réponses sur la commande.]", "cart"], ["Paiement", "[Questions et réponses sur le paiement.]", "coin"], ["Livraison", "[Questions et réponses sur la livraison.]", "send"], ["Compte", "[Questions et réponses sur le compte.]", "user"]], true),
    faqSec("Les plus fréquentes", [["[Question 1 ?]", "[Réponse claire.]"], ["[Question 2 ?]", "[Réponse claire.]"], ["[Question 3 ?]", "[Réponse claire.]"], ["[Question 4 ?]", "[Réponse claire.]"], ["[Question 5 ?]", "[Réponse claire.]"], ["[Question 6 ?]", "[Réponse claire.]"]], "two"),
    alertBar("info", "Vous n'avez pas trouvé ?", "[Moyen de contact et délai de réponse.]")], [], "", ["questions", "aide", "support", "faq"]);
  page("confidentialite", "Légal", "Politique de confidentialité", "Squelette de politique de confidentialité à compléter : données, finalités, droits, contact.", () => [
    heroMini({ crumb: "Confidentialité", title: "Politique de confidentialité", sub: "[Dernière mise à jour : date.]" }),
    alertBar("warning", "Modèle à compléter", "Ce texte est un point de départ : faites-le relire et adaptez-le à votre situation réelle avant publication."),
    kitText("## Qui est responsable de vos données ?\n\n[Nom de l'organisation, forme juridique, adresse, contact du responsable.]\n\n## Quelles données collectons-nous ?\n\n- [Données d'identité et de contact]\n- [Données de navigation]\n- [Autres données : à préciser]\n\n## Pourquoi et sur quelle base ?\n\n[Finalité 1 et base légale. Finalité 2 et base légale.]"),
    kitText("## Combien de temps les conservons-nous ?\n\n[Durées de conservation par catégorie de données.]\n\n## Avec qui les partageons-nous ?\n\n[Prestataires et destinataires.]\n\n## Vos droits\n\nAccès, rectification, effacement, opposition, limitation, portabilité : [comment les exercer].\n\n## Cookies\n\n[Cookies utilisés et gestion du consentement.]"),
    contactSplit("Exercer vos droits", [["[Adresse e-mail dédiée]", "mail"], ["[Adresse postale]", "mapPin"]], [H("Délai de réponse", "3"), P("[Délai légal et modalités.]", muted)])], [], "", ["RGPD", "données personnelles", "cookies", "légal"]);
  page("merci-confirmation", "Remerciement", "Remerciement — confirmation et prochaines étapes", "Confirmation, prochaines étapes en chronologie, actions utiles et partage.", () => [
    section([stack([badge("C'est envoyé", "success"), H("Merci, c'est bien reçu", "1", { fontSize: "48px", textAlign: "center" }), P("[Ce qui se passe maintenant et sous quel délai.]", { textAlign: "center", ...muted, maxWidth: "560px" })], { alignItems: "center" })], { paddingTop: "96px", paddingBottom: "32px", alignItems: "center" }),
    timelineSec("Et maintenant ?", "", [["[Maintenant]", "Confirmation", "[Un e-mail vous est envoyé.]"], ["[Sous X jours]", "Réponse", "[Un interlocuteur vous contacte.]"], ["[Ensuite]", "Suite", "[Prochaine étape.]"]]),
    section([head("En attendant", "", { align: "center" }), grid(3, [["book", "Lire nos conseils", "/blog"], ["help", "Consulter la FAQ", "/contact"], ["home", "Retour à l'accueil", "/"]].map(([ic, t, u]) => card([I(ic), H(t, "3"), B("Ouvrir", u, "outline")])))]),
    section([{ type: "sharebuttons", props: { networks: ["facebook", "linkedin", "whatsapp"], label: "Partager avec un proche" } }], { alignItems: "center", paddingTop: "24px" })], [], "", ["merci", "confirmation", "prochaines étapes"]);
  page("mentions-legales", "Légal", "Mentions légales", "Éditeur, hébergeur, propriété intellectuelle et responsabilité, à compléter.", () => [
    heroMini({ crumb: "Mentions légales", title: "Mentions légales", sub: "[Dernière mise à jour : date.]" }),
    section([G("1fr 2fr", [stack([H("Sommaire", "3"), { type: "toc", props: { title: "Sur cette page", depth: "3" } }]), stack([kitText("## Éditeur du site\n\n[Dénomination, forme juridique, capital, adresse, numéro d'immatriculation, directeur de la publication.]\n\n## Hébergeur\n\n[Nom, adresse et contact de l'hébergeur.]"), kitText("## Propriété intellectuelle\n\n[Qui détient les contenus et conditions de réutilisation.]\n\n## Responsabilité\n\n[Limites de responsabilité et liens externes.]\n\n## Contact\n\n[Moyen de contact.]")])], { alignItems: "start" })]),
    alertBar("warning", "Modèle à compléter", "Remplacez chaque crochet par vos informations réelles et faites relire le texte."),
    contactSplit("Une question sur ce site ?", [["[Adresse e-mail de contact]", "mail"], ["[Adresse postale]", "mapPin"]], [H("Délai de réponse", "3"), P("[Délai réel.]", muted)])], [], "", ["mentions légales", "éditeur", "hébergeur", "légal"]);

  return E;
};

// Le classement (meta) est lu au chargement par libraryMeta : on le remplit en parcourant les entrées avec les seuls aides de patterns (les `build` ne sont pas appelés).
entries({ helpers: require("../patterns").helpers });
module.exports = { meta, entries };
