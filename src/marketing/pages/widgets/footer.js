// Widgets « Pied de page » : lisent les DONNÉES D'ENTREPRISE du site (Paramètres → Données de l'entreprise, src/marketing/pages/business.js) à l'affichage.
// Coordonnées, téléphone et e-mail cliquables, horaires (« ouvert maintenant » calculé côté serveur dans le fuseau du site), informations légales,
// moyens de paiement, livraison et retours, champs personnalisés, retour en haut, abonnement par e-mail (réutilise un formulaire d'inscription réel).
// Règles communes : texte seulement (les gabarits échappent tout), aucune donnée = rien d'affiché sur la page publiée (un message d'aide dans l'éditeur),
// jamais d'erreur bloquante (data() est protégée par le moteur), données isolées par site (le site vient de la page affichée).
const biz = () => require("../business");
const bool = (key, label, def) => ({ key, kind: "bool", label, default: def });
const title = (def = "") => ({ key: "title", kind: "text", label: "Titre (facultatif)", max: 80, default: def });

// Données d'entreprise de la page (scope déjà calculé par le moteur, sinon recalculé) ; horloge = scope.now (injectable dans les tests)
const dataOf = (ctx, env) => {
  const b = (env && env.scope && env.scope.business) || biz().forPage(ctx, env && env.page);
  return { b, now: (env && env.scope && env.scope.now) || new Date() };
};

module.exports = [
  {
    type: "bizcontact", label: "Coordonnées", group: "footer", icon: "mapPin", version: 1, style: "text", status: "operational",
    description: "Adresse, téléphone et e-mail de l'entreprise, lus dans les Données de l'entreprise",
    keywords: "coordonnees adresse telephone email contact entreprise localisation pied de page appeler ecrire",
    schema: [
      title(), bool("showName", "Afficher la raison sociale", false), bool("showAddress", "Afficher l'adresse", true), bool("showPhone", "Afficher le téléphone", true), bool("showEmail", "Afficher l'e-mail", true),
      bool("showIcons", "Afficher des icônes", true),
      { key: "layout", kind: "select", label: "Disposition", options: [["stack", "Les unes sous les autres"], ["inline", "Sur une ligne"]], default: "stack" },
    ],
    data(ctx, p, env) {
      const { b } = dataOf(ctx, env);
      if (!b) return { empty: true };
      const pr = b.profile, bz = biz();
      const d = {
        name: p.showName ? pr.legalName : "",
        address: p.showAddress && bz.hasAddress(pr.address) ? bz.addressLine(pr.address) : "",
        phone: p.showPhone && pr.phones[0] ? { label: pr.phones[0].number, href: bz.telHref(pr.phones[0].number) } : null,
        email: p.showEmail && pr.email ? { label: pr.email, href: bz.mailHref(pr.email) } : null,
      };
      d.empty = !d.name && !d.address && !d.phone && !d.email;
      return d;
    },
  },
  {
    type: "bizphone", label: "Téléphone cliquable", group: "footer", icon: "smartphone", version: 1, style: "text", status: "operational",
    description: "Un numéro de téléphone cliquable (appel direct sur mobile), lu dans les Données de l'entreprise",
    keywords: "telephone appeler appel numero tel mobile contact cliquable",
    schema: [
      { key: "which", kind: "select", label: "Numéro à afficher", options: [["1", "Premier numéro"], ["2", "Deuxième numéro"], ["3", "Troisième numéro"]], default: "1" },
      { key: "prefix", kind: "text", label: "Texte avant le numéro (facultatif)", max: 60, default: "" },
      bool("showLabel", "Afficher le libellé du numéro (ex. « Service client »)", false), bool("showIcon", "Afficher une icône", true),
    ],
    data(ctx, p, env) {
      const { b } = dataOf(ctx, env);
      const ph = b && b.profile.phones[Number(p.which) - 1];
      return ph ? { number: ph.number, label: ph.label, href: biz().telHref(ph.number) } : { empty: true };
    },
  },
  {
    type: "bizemail", label: "E-mail cliquable", group: "footer", icon: "mail", version: 1, style: "text", status: "operational",
    description: "L'adresse e-mail de contact, cliquable, lue dans les Données de l'entreprise",
    keywords: "email e-mail mail courriel ecrire contact adresse cliquable mailto",
    schema: [
      { key: "prefix", kind: "text", label: "Texte avant l'adresse (facultatif)", max: 60, default: "" },
      { key: "text", kind: "text", label: "Texte du lien (vide = l'adresse e-mail elle-même)", max: 80, default: "" },
      bool("showIcon", "Afficher une icône", true),
    ],
    data(ctx, p, env) {
      const { b } = dataOf(ctx, env);
      return b && b.profile.email ? { email: b.profile.email, href: biz().mailHref(b.profile.email) } : { empty: true };
    },
  },
  {
    type: "bizhours", label: "Horaires d'ouverture", group: "footer", icon: "clock", version: 1, style: "text", status: "operational",
    description: "Les horaires de la semaine, avec « ouvert maintenant » calculé selon l'heure du site",
    keywords: "horaires ouverture fermeture heures jours semaine ouvert ferme maintenant",
    schema: [
      title("Horaires d'ouverture"), bool("showOpenNow", "Afficher « Ouvert maintenant » / « Fermé actuellement »", true), bool("groupDays", "Regrouper les jours identiques (Lundi au vendredi)", true),
      bool("showExceptions", "Afficher les fermetures et jours spéciaux à venir", true), bool("showNote", "Afficher la remarque sur les horaires", true),
      { key: "closedLabel", kind: "text", label: "Mot pour un jour fermé", max: 30, default: "Fermé" },
    ],
    data(ctx, p, env) {
      const { b, now } = dataOf(ctx, env);
      const bz = biz();
      if (!b || !bz.hasHours(b.profile.hours)) return { empty: true };
      const h = b.profile.hours;
      const rows = p.groupDays ? bz.hoursRows(h) : bz.DAYS.map((d) => ({ days: bz.DAY_LABELS[d], closed: !h.days[d].ranges.length, text: bz.rangesText(h.days[d].ranges), from: d, to: d }));
      const status = bz.openNow(h, now, b.tz);
      const at = status ? bz.DAYS.indexOf(status.day) : -1;
      rows.forEach((r) => { r.today = at >= 0 && bz.DAYS.indexOf(r.from) <= at && at <= bz.DAYS.indexOf(r.to); });
      return { rows, status: p.showOpenNow ? status : null, today: status ? status.day : "", exceptions: p.showExceptions ? bz.upcomingExceptions(h, now, b.tz).map((x) => ({ ...x, date: bz.frDate(x.date) })) : [], note: p.showNote ? h.note : "" };
    },
  },
  {
    type: "bizlegal", label: "Informations légales", group: "footer", icon: "shield", version: 1, style: "text", status: "operational",
    description: "Raison sociale, immatriculations, directeur de publication, hébergeur et pages légales",
    keywords: "mentions legales informations legales siret rcs tva forme juridique directeur publication hebergeur cgv confidentialite societe",
    schema: [
      title(), bool("showName", "Raison sociale", true), bool("showForm", "Forme juridique et capital", true), bool("showRegistrations", "Numéros d'immatriculation (SIRET, RCS, TVA…)", true),
      bool("showPublisher", "Directeur de la publication", false), bool("showHost", "Hébergeur", false), bool("showPages", "Liens vers les pages légales (mentions, confidentialité, CGV)", true),
      { key: "layout", kind: "select", label: "Disposition", options: [["stack", "Les unes sous les autres"], ["inline", "Sur une ligne"]], default: "stack" },
    ],
    data(ctx, p, env) {
      const { b } = dataOf(ctx, env);
      if (!b) return { empty: true };
      const l = b.profile.legal, pg = b.profile.legalPages;
      const lines = [];
      if (p.showName && b.profile.legalName) lines.push({ text: b.profile.legalName });
      if (p.showForm && (l.form || l.capital)) lines.push({ text: [l.form, l.capital ? `capital de ${l.capital}` : ""].filter(Boolean).join(", ") });
      if (p.showRegistrations) for (const r of l.registrations) lines.push({ label: r.label, text: r.value });
      if (p.showPublisher && l.publisher) lines.push({ label: "Directeur de la publication", text: l.publisher });
      if (p.showHost && (l.hostName || l.hostAddress)) lines.push({ label: "Hébergeur", text: [l.hostName, l.hostAddress].filter(Boolean).join(", ") });
      const links = p.showPages ? [["Mentions légales", pg.notice], ["Politique de confidentialité", pg.privacy], ["Conditions générales de vente", pg.terms]].filter((x) => x[1]).map(([label, url]) => ({ label, url })) : [];
      return { lines, links, empty: !lines.length && !links.length };
    },
  },
  {
    type: "bizpayments", label: "Moyens de paiement", group: "footer", icon: "coin", version: 1, style: "text", status: "operational",
    description: "Les moyens de paiement acceptés (carte, virement, espèces…), sobres et sans logo de marque",
    keywords: "paiement paiements carte bancaire virement cheque especes paypal moyens de paiement securise reassurance",
    schema: [
      title("Paiement accepté"), { key: "look", kind: "select", label: "Présentation", options: [["pills", "Étiquettes"], ["plain", "Texte simple"]], default: "pills" }, bool("showIcon", "Afficher une icône avant chaque moyen", true),
    ],
    data(ctx, p, env) {
      const { b } = dataOf(ctx, env);
      const bz = biz();
      const items = b ? b.profile.payments.map((k) => ({ key: k, label: bz.PAYMENTS[k] })) : [];
      return items.length ? { items } : { empty: true };
    },
  },
  {
    type: "bizdelivery", label: "Livraison et retours", group: "footer", icon: "send", version: 1, style: "text", status: "operational",
    description: "Le texte de livraison et de retours saisi dans les Données de l'entreprise",
    keywords: "livraison expedition retours retour delai frais port reassurance colis",
    schema: [title("Livraison et retours"), bool("showDelivery", "Afficher la livraison", true), bool("showReturns", "Afficher les retours", true), bool("showIcon", "Afficher une icône", true)],
    data(ctx, p, env) {
      const { b } = dataOf(ctx, env);
      const dl = b ? b.profile.delivery : { text: "", returns: "" };
      const d = { delivery: p.showDelivery ? dl.text : "", returns: p.showReturns ? dl.returns : "" };
      d.empty = !d.delivery && !d.returns;
      return d;
    },
  },
  {
    type: "bizfields", label: "Champs personnalisés", group: "footer", icon: "list", version: 1, style: "text", status: "operational",
    description: "Vos informations personnalisées (jusqu'à 6) saisies dans les Données de l'entreprise",
    keywords: "champs personnalises informations supplementaires libelle valeur donnees entreprise",
    schema: [title(), bool("showLabels", "Afficher le nom de chaque information", true)],
    data(ctx, p, env) {
      const { b } = dataOf(ctx, env);
      const items = b ? b.profile.custom.filter((x) => x.value) : [];
      return items.length ? { items } : { empty: true };
    },
  },
  {
    type: "backtotop", label: "Retour en haut", group: "footer", icon: "arrowUp", version: 1, style: "box", status: "operational",
    description: "Un bouton qui remonte en haut de la page, fixe ou en ligne, visible après un défilement",
    keywords: "retour en haut remonter haut de page scroll top fleche bouton defilement",
    schema: [
      { key: "mode", kind: "select", label: "Mode", options: [["fixed", "Bouton fixé dans un coin de l'écran"], ["inline", "Lien dans le pied de page"]], default: "fixed" },
      { key: "side", kind: "select", label: "Coin (mode fixé)", options: [["right", "En bas à droite"], ["left", "En bas à gauche"]], default: "right" },
      { key: "label", kind: "text", label: "Texte du bouton (lu par les lecteurs d'écran)", max: 40, required: true, default: "Retour en haut" },
      bool("showLabel", "Afficher le texte à côté de la flèche", false),
      { key: "threshold", kind: "number", label: "Apparaît après un défilement de (pixels, mode fixé)", min: 0, max: 5000, integer: true, default: 300 },
    ],
  },
  {
    type: "emailsubscribe", label: "Abonnement par e-mail", group: "footer", icon: "send", version: 1, style: "text", status: "dependency",
    dependencies: ["Un formulaire d'inscription publié (Audience → Formulaires d'inscription) dont seule l'adresse e-mail est obligatoire"],
    description: "Un champ e-mail et un bouton, branchés sur un formulaire d'inscription existant",
    keywords: "newsletter abonnement abonner email inscription lettre info champ courriel pied de page",
    schema: [
      title("Restez informé"), { key: "intro", kind: "text", label: "Phrase d'introduction (facultative)", max: 200, default: "" },
      { key: "button", kind: "text", label: "Texte du bouton", max: 40, required: true, default: "S'abonner" },
      { key: "formId", kind: "number", label: "Numéro du formulaire (0 = choisir automatiquement un formulaire publié de ce site)", min: 0, max: 999999999, integer: true, default: 0 },
    ],
    data(ctx, p, env) {
      const form = require("../emailSubscribe").formFor(ctx, env && env.page, p);
      return { form: form ? { id: form.id, name: form.name, consentText: form.consentText, thankYouText: form.thankYouText, fields: [], fieldSettings: {}, fileField: null, smsConsentText: "" } : null };
    },
  },
];
