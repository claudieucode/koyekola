// Chantier C du pied de page : DONNÉES D'ENTREPRISE par site (migration 140), étiquettes {{business.…}}, liens tel:/mailto: autorisés
// (liste blanche stricte) et widgets « Pied de page » (coordonnées, téléphone, e-mail, horaires, informations légales, paiements, livraison,
// champs personnalisés, retour en haut, abonnement par e-mail). Première partie sans serveur (base en mémoire avec les vraies migrations, rendu des
// vrais gabarits), seconde partie de bout en bout (écran d'administration, droits, pied publié avec 20 widgets, isolation entre sites).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const ejs = require("ejs");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const nodes = require("../src/marketing/pages/nodes");
const sections = require("../src/marketing/pages/sections");
const business = require("../src/marketing/pages/business");
const dynamic = require("../src/marketing/pages/dynamic");
const landing = require("../src/marketing/landing");
const forms = require("../src/marketing/forms");
const { icon } = require("../src/utils/icons");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const count = (t, s) => t.split(s).length - 1;
const FOOTER_TYPES = ["bizcontact", "bizphone", "bizemail", "bizhours", "bizlegal", "bizpayments", "bizdelivery", "bizfields", "backtotop", "emailsubscribe"];
const PROFILE = {
  legalName: "Atelier <b>Soleil</b> & Fils", tagline: "Du bon pain depuis 1990",
  address: { street: "12 rue des Lilas", postalCode: "75011", city: "Paris", country: "France" },
  phones: [{ label: "Boutique", number: "+33 1 23 45 67 89" }, { label: "Livraison", number: "01.98.76.54.32" }],
  email: "contact@atelier-soleil.fr",
  hours: {
    days: { mon: { closed: true }, tue: { ranges: [{ open: "09:00", close: "12:30" }, { open: "14:00", close: "18:00" }] }, wed: { ranges: [{ open: "09:00", close: "12:30" }, { open: "14:00", close: "18:00" }] }, thu: { ranges: [{ open: "09:00", close: "12:30" }, { open: "14:00", close: "18:00" }] }, fri: { ranges: [{ open: "09:00", close: "12:30" }, { open: "14:00", close: "18:00" }] }, sat: { ranges: [{ open: "10:00", close: "16:00" }] } },
    exceptions: [{ date: "2026-12-25", label: "Noël", closed: true }, { date: "2026-12-24", label: "Veille de Noël", ranges: [{ open: "08:00", close: "13:00" }] }], note: "Sur rendez-vous le dimanche.",
  },
  legal: { form: "SARL", capital: "10 000 €", publisher: "Jeanne Soleil", hostName: "Hébergeur Exemple", hostAddress: "1 avenue du Serveur, Lyon", registrations: [{ label: "SIRET", value: "123 456 789 00012" }, { label: "TVA", value: "FR12345678901" }] },
  legalPages: { notice: "/mentions-legales", privacy: "/confidentialite", terms: "https://exemple.fr/cgv" },
  payments: ["card", "transfer", "cash", "inconnu"], delivery: { text: "Livraison sous 3 jours ouvrés.", returns: "Retours sous 14 jours." },
  custom: [{ label: "Médiateur", value: "Médiation Exemple" }],
};
const bad = (fn, re) => assert.throws(fn, (e) => e && e.code === "invalid_field" && re.test(e.message), String(re));

describe("liens tel: et mailto: (liste blanche stricte, sans serveur)", () => {
  test("e-mail et téléphone valides sont acceptés ; les séparateurs d'un numéro sont retirés", () => {
    assert.equal(sections.linkUrl("mailto:contact@exemple.fr", "L"), "mailto:contact@exemple.fr");
    assert.equal(sections.linkUrl("tel:+33 1 23 45 67 89", "L"), "tel:+33123456789");
    assert.equal(sections.linkUrl("tel:01.23-45(67)89", "L"), "tel:0123456789");
    assert.equal(sections.linkUrl("/catalogue", "L"), "/catalogue");
    assert.equal(sections.linkUrl("https://exemple.fr/a", "L"), "https://exemple.fr/a");
  });
  test("javascript:, data:, vbscript:, sms:, file:, paramètres et formes tordues sont refusés", () => {
    for (const u of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<script>alert(1)</script>", "vbscript:x", "sms:+33123456789", "file:///etc/passwd", "tel:javascript:alert(1)", "tel:+33abc", "tel:12", "tel:+1234567890123456", "tel:+33 1 23 \"onclick=x",
      "mailto:a@b.fr?subject=x&cc=z@z.fr", "mailto:<script>@b.fr", "mailto:a@b", "mailto:a@b.fr,c@d.fr", "mailto:", "mailto:javascript:alert(1)", " javascript:alert(1)", "//autre.site", "http://exemple.fr"]) {
      assert.throws(() => sections.linkUrl(u, "L"), (e) => e.code === "invalid_field", u);
    }
  });
  test("un bouton et une liste d'icônes du Page Builder acceptent tel: / mailto: et refusent javascript:", () => {
    const { A } = freshMarketing();
    const save = (type, props) => { const p = pages.createPage(A, { name: `L ${Math.random()}`, kind: "page" }); return pages.saveDraft(A, p.id, { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: {}, children: [{ id: "essai0000001", type, props }] }] }] }, { revision: pages.getPage(A, p.id).revision }).content.sections[0].children[0].children[0].props; };
    assert.equal(save("button", { label: "Appeler", url: "tel:+33 1 23 45 67 89", variant: "primary" }).url, "tel:+33123456789");
    assert.equal(save("button", { label: "Écrire", url: "mailto:a@b.fr", variant: "primary" }).url, "mailto:a@b.fr");
    assert.throws(() => save("button", { label: "X", url: "javascript:alert(1)", variant: "primary" }), /adresse/);
  });
});

describe("liens tel: / mailto: dans le texte riche (sans serveur)", () => {
  test("le widget Texte garde les liens tel: et mailto: stricts et neutralise tout le reste", () => {
    const out = nodes.sanitizeRich('<p><a href="tel:+33123456789">a</a> <a href="mailto:a@b.fr">b</a> <a href="javascript:alert(1)">c</a> <a href="tel:+33;x">d</a> <a href="mailto:a@b.fr?subject=x">e</a> <a href="data:text/html,x">f</a></p>');
    assert.match(out, /<a href="tel:\+33123456789">a<\/a>/); assert.match(out, /<a href="mailto:a@b\.fr">b<\/a>/);
    assert.ok(!/javascript:|data:|subject|\+33;x/.test(out), out);
  });
});

describe("données d'entreprise : validation et stockage (sans serveur)", () => {
  test("un profil complet est normalisé ; les chevrons sont retirés du texte ; moyens de paiement inconnus ignorés", () => {
    const p = business.normalize(PROFILE);
    assert.equal(p.legalName, "Atelier bSoleil/b & Fils");
    assert.deepEqual(p.payments, ["card", "transfer", "cash"]);
    assert.equal(p.phones.length, 2);
    assert.equal(p.legalPages.terms, "https://exemple.fr/cgv");
    assert.equal(p.hours.days.mon.closed, true);
    assert.equal(p.hours.days.sun.closed, true, "un jour sans plage est fermé");
    assert.deepEqual(p.hours.exceptions.map((x) => x.date), ["2026-12-24", "2026-12-25"], "exceptions triées par date");
  });
  test("profil vide accepté ; entrées de type inattendu ignorées sans erreur", () => {
    assert.doesNotThrow(() => business.normalize({}));
    assert.doesNotThrow(() => business.normalize(null));
    assert.doesNotThrow(() => business.normalize({ phones: "x", payments: 5, hours: 3, legal: [], custom: {} }));
  });
  test("e-mail, téléphone, horaires, dates et pages légales invalides sont refusés avec un message clair", () => {
    bad(() => business.normalize({ email: "pas un mail" }), /E-mail de contact/);
    bad(() => business.normalize({ email: "a@b.fr\nBcc: x@y.fr" }), /E-mail de contact/);
    bad(() => business.normalize({ phones: [{ number: "abc" }] }), /Téléphone 1/);
    bad(() => business.normalize({ phones: [{ number: "12" }] }), /Téléphone 1/);
    bad(() => business.normalize({ phones: [1, 2, 3, 4].map((i) => ({ number: `+3312345678${i}` })) }), /3 numéros/);
    bad(() => business.normalize({ hours: { days: { mon: { ranges: [{ open: "18:00", close: "09:00" }] } } } }), /après l'ouverture/);
    bad(() => business.normalize({ hours: { days: { mon: { ranges: [{ open: "25:00", close: "26:00" }] } } } }), /heure non valide/);
    bad(() => business.normalize({ hours: { days: { mon: { ranges: [{ open: "09:00", close: "12:00" }, { open: "11:00", close: "14:00" }] } } } }), /chevauchent/);
    bad(() => business.normalize({ hours: { days: { mon: { ranges: [{ open: "08:00", close: "09:00" }, { open: "10:00", close: "11:00" }, { open: "12:00", close: "13:00" }, { open: "14:00", close: "15:00" }] } } } }), /3 plages/);
    bad(() => business.normalize({ hours: { days: { mon: { ranges: [{ open: "09:00", close: "" }] } } } }), /ouverture ET/);
    bad(() => business.normalize({ hours: { exceptions: [{ date: "2026-02-30", closed: true }] } }), /date non valide/);
    bad(() => business.normalize({ hours: { exceptions: [{ date: "2026-12-25", closed: true }, { date: "2026-12-25", closed: true }] } }), /déjà utilisée/);
    bad(() => business.normalize({ legalPages: { privacy: "javascript:alert(1)" } }), /Page de confidentialité/);
    bad(() => business.normalize({ legalPages: { notice: "mailto:a@b.fr" } }), /mentions légales/);
  });
  test("le formulaire d'administration (champs à plat) donne le même résultat que l'objet", () => {
    const f = business.fromForm({ legalName: "Ma Société", email: "a@b.fr", phone1_number: "+33 1 23 45 67 89", h_mon_o1: "09:00", h_mon_c1: "17:00", h_tue_closed: "1", x1_date: "2026-12-25", x1_closed: "1", pay_card: "1", pay_cash: "1", hide_email: "1", custom1_label: "Agrément", custom1_value: "N°7" });
    const p = business.normalize(f);
    assert.equal(p.phones[0].number, "+33 1 23 45 67 89");
    assert.deepEqual(p.hours.days.mon.ranges, [{ open: "09:00", close: "17:00" }]);
    assert.equal(p.hours.days.tue.closed, true);
    assert.equal(p.hours.exceptions[0].closed, true);
    assert.deepEqual(p.payments, ["card", "cash"]);
    assert.equal(p.hidden.email, true);
    assert.deepEqual(p.custom, [{ label: "Agrément", value: "N°7" }]);
  });
  test("stockage : une ligne par site, mise à jour sans doublon, isolation entre sites, organisations et site principal", () => {
    const m = freshMarketing(); const A = m.ctx(1);
    const s1 = pages.createSite(A, { name: "Site un" }).id, s2 = pages.createSite(A, { name: "Site deux" }).id;
    business.save(m.db, 1, s1, { legalName: "Un", email: "un@exemple.fr" });
    business.save(m.db, 1, s1, { legalName: "Un bis", email: "un@exemple.fr" });
    business.save(m.db, 1, null, { legalName: "Principal" });
    assert.equal(m.db.prepare("SELECT COUNT(*) AS n FROM mk_business_profile WHERE organization_id = 1 AND site_id = ?").get(s1).n, 1);
    assert.equal(business.get(m.db, 1, s1).legalName, "Un bis");
    assert.equal(business.get(m.db, 1, s2).legalName, "", "un autre site ne reçoit rien");
    assert.equal(business.get(m.db, 1, s2).email, "");
    assert.equal(business.get(m.db, 1, null).legalName, "Principal");
    assert.equal(business.get(m.db, 2, s1).legalName, "", "une autre organisation ne lit rien");
    assert.throws(() => business.save(m.db, 1, s2, { email: "faux" }), (e) => e.code === "invalid_field");
    assert.equal(business.get(m.db, 1, s2).email, "", "refus = rien d'écrit");
    // donnée corrompue en base : jamais d'erreur à l'affichage
    m.db.prepare("UPDATE mk_business_profile SET data = '{pas du json' WHERE site_id = ?").run(s1);
    assert.equal(business.get(m.db, 1, s1).legalName, "");
  });
  test("coordonnées marquées « ne pas afficher » : absentes de la vue publique", () => {
    const p = business.publicView(business.normalize({ ...PROFILE, hidden: { email: true, phone: true, address: false } }));
    assert.equal(p.email, ""); assert.deepEqual(p.phones, []); assert.equal(p.address.city, "Paris");
  });
});

describe("horaires d'ouverture et « ouvert maintenant » (horloge injectée)", () => {
  const h = business.normalize(PROFILE).hours;
  const at = (iso, tz = "Europe/Paris") => business.openNow(h, new Date(iso), tz);
  test("résumé : jours consécutifs identiques regroupés, jours fermés indiqués", () => {
    assert.equal(business.hoursSummary(h), "Lun : fermé · Mar–Ven : 9h–12h30 et 14h–18h · Sam : 10h–16h · Dim : fermé");
  });
  test("ouvert / fermé selon l'heure du site (hiver Paris = UTC+1), pause du midi, jour fermé, plage de fin de journée", () => {
    assert.equal(at("2026-11-10T08:00:00Z").open, true, "mardi 09:00 à Paris");
    assert.equal(at("2026-11-10T07:59:00Z").open, false, "mardi 08:59 à Paris");
    assert.equal(at("2026-11-10T12:00:00Z").open, false, "mardi 13:00 : pause");
    assert.equal(at("2026-11-10T13:00:00Z").open, true, "mardi 14:00");
    assert.equal(at("2026-11-10T16:59:00Z").open, true, "mardi 17:59");
    assert.equal(at("2026-11-10T17:00:00Z").open, false, "mardi 18:00 pile : fermé");
    assert.equal(at("2026-11-09T10:00:00Z").open, false, "lundi : jour fermé");
    assert.equal(at("2026-11-15T10:00:00Z").open, false, "dimanche : fermé");
    assert.equal(at("2026-11-14T10:00:00Z").open, true, "samedi 11:00");
    assert.equal(at("2026-11-10T09:00:00Z").label, "Ouvert maintenant");
    assert.equal(at("2026-11-10T07:00:00Z").label, "Fermé actuellement");
  });
  test("le fuseau du site compte : le même instant n'est pas ouvert partout", () => {
    const t = "2026-11-10T08:30:00Z";
    assert.equal(at(t, "Europe/Paris").open, true);
    assert.equal(at(t, "America/New_York").open, false, "03:30 à New York");
    assert.equal(at(t, "Pacific/Auckland").open, false, "mercredi 21:30 à Auckland");
    assert.equal(at(t, "Fuseau/Inconnu").open, false, "fuseau inconnu = UTC (pas d'erreur)");
  });
  test("une exception datée remplace les horaires du jour (fermeture, horaires réduits)", () => {
    assert.equal(at("2026-12-25T10:00:00Z").open, false, "25 décembre : fermé (un vendredi normalement ouvert)");
    assert.equal(at("2026-12-25T10:00:00Z").exception, "Noël");
    assert.equal(at("2026-12-24T09:00:00Z").open, true, "24 décembre 10:00 : ouvert 8h-13h");
    assert.equal(at("2026-12-24T14:30:00Z").open, false, "24 décembre 15:30 : fermé (ouvert 14h-18h un jeudi normal)");
  });
  test("minuit : une plage jusqu'à 24:00 couvre 23:59", () => {
    const hh = business.normalize({ hours: { days: { sat: { ranges: [{ open: "00:00", close: "24:00" }] } } } }).hours;
    assert.equal(business.openNow(hh, new Date("2026-11-14T22:59:00Z"), "Europe/Paris").open, true, "samedi 23:59 à Paris");
    assert.equal(business.openNow(hh, new Date("2026-11-14T23:00:00Z"), "Europe/Paris").open, false, "dimanche 00:00");
  });
  test("aucun horaire renseigné : pas d'« ouvert maintenant » (null), jamais de faux « fermé »", () => {
    assert.equal(business.openNow(business.normalize({}).hours, new Date(), "Europe/Paris"), null);
    assert.equal(business.hoursSummary(business.normalize({}).hours), "");
  });
});

describe("étiquettes dynamiques {{business.…}} et {{site.year}} (sans serveur)", () => {
  const profile = business.publicView(business.normalize(PROFILE));
  const scope = { business: { profile, tz: "Europe/Paris" }, site: { name: "Mon site" }, now: new Date("2026-11-10T08:00:00Z") };
  test("chaque étiquette rend la bonne valeur (la casse de la clé est indifférente)", () => {
    const r = (s, sc = scope) => dynamic.resolveString(s, sc);
    assert.equal(r("{{business.phone}}"), "+33 1 23 45 67 89");
    assert.equal(r("{{business.phone2}}"), "01.98.76.54.32");
    assert.equal(r("{{business.email}}"), "contact@atelier-soleil.fr");
    assert.equal(r("{{business.address}}"), "12 rue des Lilas, 75011 Paris, France");
    assert.equal(r("{{business.city}} {{business.postalCode}}"), "Paris 75011");
    assert.equal(r("{{business.tagline}}"), "Du bon pain depuis 1990");
    assert.equal(r("{{site.tagline}}"), "Du bon pain depuis 1990");
    assert.equal(r("{{business.legalName}}"), "Atelier bSoleil/b & Fils");
    assert.equal(r("{{business.hours}}"), "Lun : fermé · Mar–Ven : 9h–12h30 et 14h–18h · Sam : 10h–16h · Dim : fermé");
    assert.equal(r("{{business.open_now}}"), "Ouvert maintenant");
    assert.equal(r("{{business.registration}}"), "SIRET 123 456 789 00012 · TVA FR12345678901");
    assert.equal(r("{{business.publisher}}"), "Jeanne Soleil");
    assert.equal(r("{{business.custom1}}"), "Médiation Exemple");
    assert.equal(r("{{business.phone_url}}"), "tel:+33123456789");
    assert.equal(r("{{business.email_url}}"), "mailto:contact@atelier-soleil.fr");
    assert.equal(r("{{business.privacy_url}}"), "/confidentialite");
  });
  test("copyright automatique : année courante + raison sociale (ou nom du site)", () => {
    assert.equal(dynamic.resolveString("{{site.year}}", scope), "2026");
    assert.equal(dynamic.resolveString("{{site.year}}", { ...scope, now: new Date("2031-01-02T00:00:00Z") }), "2031");
    assert.equal(dynamic.resolveString("{{site.copyright}}", scope), "© 2026 Atelier bSoleil/b & Fils");
    assert.equal(dynamic.resolveString("{{site.copyright}}", { site: { name: "Mon site" }, now: scope.now }), "© 2026 Mon site");
  });
  test("sans donnée : texte vide ou repli, jamais « undefined » ni d'erreur", () => {
    const empty = { business: { profile: business.publicView(business.normalize({})), tz: "Europe/Paris" }, now: scope.now };
    for (const t of ["phone", "email", "address", "hours", "open_now", "legalname", "custom3", "phone_url"]) assert.equal(dynamic.resolveString(`{{business.${t}}}`, empty), "", t);
    assert.equal(dynamic.resolveString("{{business.phone | fallback: Appelez-nous}}", empty), "Appelez-nous");
    assert.equal(dynamic.resolveString("{{business.phone}}", {}), "");
    assert.equal(dynamic.resolveString("{{business.inconnu}}", scope), "");
  });
  test("échappement HTML strict dans un texte riche ; coordonnées masquées absentes", () => {
    const evil = { business: { profile: { ...profile, tagline: '<img src=x onerror="alert(1)"> & "q"', phones: [] }, tz: "UTC" }, now: scope.now };
    const out = dynamic.resolveString("<p>{{business.tagline}}</p>", evil, { html: true });
    assert.ok(!out.includes("<img") && out.includes("&lt;img") && out.includes("&quot;q&quot;") && out.includes("&amp;"), out);
    const hidden = { business: { profile: business.publicView(business.normalize({ ...PROFILE, hidden: { email: true, phone: true } })), tz: "UTC" }, now: scope.now };
    assert.equal(dynamic.resolveString("{{business.email}}|{{business.phone}}", hidden), "|");
  });
  test("dans un champ d'adresse, la valeur résolue est revalidée : tel: et mailto: passent, une valeur piégée est vidée", () => {
    const props = { url: "{{business.phone_url}}", link: "{{business.email_url}}" };
    const ok = dynamic.resolveProps(props, scope, { linkUrl: sections.linkUrl });
    assert.equal(ok.url, "tel:+33123456789"); assert.equal(ok.link, "mailto:contact@atelier-soleil.fr");
    const evil = { business: { profile: { ...profile, legalPages: { ...profile.legalPages, notice: "javascript:alert(1)" } }, tz: "UTC" }, now: scope.now };
    assert.equal(dynamic.resolveProps({ url: "{{business.notice_url}}" }, evil, { linkUrl: sections.linkUrl }).url, "");
  });
  test("catalogue de l'éditeur : groupe « Entreprise » et sources listées", () => {
    const c = dynamic.catalog();
    assert.ok(c.groups.some((g) => g.key === "business" && g.label === "Entreprise"));
    for (const k of ["business.phone", "business.email", "business.address", "business.hours", "business.tagline", "business.legalname", "site.year", "site.copyright"]) assert.ok(c.sources.some((s) => s.key === k), k);
  });
});

// ---- Widgets : rendu des vrais gabarits ----
describe("widgets « Pied de page » : registre, validation et rendu public échappé (sans serveur)", () => {
  let m, A, S1, S2, seq = 0;
  const NOW = new Date("2026-11-10T08:00:00Z"); // mardi 09:00 à Paris
  before(() => {
    m = freshMarketing(); A = m.ctx(1);
    S1 = pages.createSite(A, { name: "Boulangerie" }).id; S2 = pages.createSite(A, { name: "Autre site" }).id;
    business.save(m.db, 1, S1, PROFILE);
    // un second site avec d'AUTRES données (isolation)
    business.save(m.db, 1, S2, { legalName: "Garage Deux", email: "garage@deux.fr", phones: [{ number: "+33 4 00 00 00 00" }] });
  });
  const node = (type, props = {}) => ({ id: `n${String(++seq).padStart(3, "0")}${type}`.slice(0, 20), type, props });
  const wrap = (...children) => ({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: {}, children }] }] });
  const blank = (t) => nodes.editorSpec().types.find((x) => x.type === t).blank.props || {};
  // Enregistre (validation réelle) puis rend chaque élément avec le vrai gabarit _node.ejs ; renvoie le HTML concaténé
  const show = async (siteId, list, { builder = false, now = NOW, ctx = A } = {}) => {
    const p = pages.createPage(ctx, { name: `W ${++seq}`, kind: "page", site_id: siteId });
    const saved = pages.saveDraft(ctx, p.id, wrap(...list), { revision: pages.getPage(ctx, p.id).revision }).content.sections;
    const vm = landing.viewModel(ctx, { id: p.id, slug: p.slug, site_id: siteId, sections: saved, title: "t", scope: { now } });
    let out = "";
    for (const n of vm.sections[0].children[0].children) {
      out += await ejs.renderFile(path.join(__dirname, "../views/marketing-public/_node.ejs"), { n, isBuilder: builder, href: (u) => u, depth: 0, icon, page: { slug: p.slug }, preview: false, asset: (x) => x, formToken: "jeton" });
    }
    return out;
  };

  test("les 10 widgets sont au registre : catégorie « Pied de page », icône, description, mots de recherche, contenu de départ valide", () => {
    const spec = nodes.editorSpec();
    assert.equal(spec.widgetGroups.footer, "Pied de page");
    for (const t of FOOTER_TYPES) {
      const s = spec.types.find((x) => x.type === t);
      assert.ok(s, t);
      assert.equal(s.group, "footer", t); assert.ok(s.icon && s.description && s.description.length <= 160 && s.label, t);
      assert.ok(s.status === "operational" || s.status === "dependency", t);
      assert.doesNotThrow(() => { const p = pages.createPage(A, { name: `B ${t}`, kind: "page" }); pages.saveDraft(A, p.id, wrap(node(t, blank(t))), { revision: pages.getPage(A, p.id).revision }); }, t);
    }
  });
  test("réglages validés côté serveur : valeurs hors liste ramenées au défaut, nombre borné, texte nettoyé", () => {
    const save = (type, props) => { const p = pages.createPage(A, { name: `V ${++seq}`, kind: "page" }); return pages.saveDraft(A, p.id, wrap(node(type, props)), { revision: pages.getPage(A, p.id).revision }).content.sections[0].children[0].children[0].props; };
    assert.equal(save("bizphone", { which: "9" }).which, "1");
    assert.equal(save("backtotop", { mode: "n'importe quoi" }).mode, "fixed");
    assert.equal(save("backtotop", { threshold: 99999 }).threshold, 300, "hors bornes = valeur par défaut");
    assert.equal(save("bizcontact", { title: "<b>Nous\u0000 trouver</b>" }).title.includes("\u0000"), false);
  });
  test("Coordonnées : adresse, téléphone et e-mail cliquables ; HTML des données échappé", async () => {
    const h = await show(S1, [node("bizcontact", { title: "Nous trouver", showName: true })]);
    assert.match(h, /12 rue des Lilas, 75011 Paris, France/);
    assert.match(h, /<a class="kw-biz-link" href="tel:\+33123456789">\+33 1 23 45 67 89<\/a>/);
    assert.match(h, /<a class="kw-biz-link" href="mailto:contact@atelier-soleil\.fr">contact@atelier-soleil\.fr<\/a>/);
    assert.ok(!h.includes("<b>Soleil") && !/<script/i.test(h));
    assert.match(h, /Atelier bSoleil\/b &amp; Fils/);
  });
  test("injection : un contenu piégé dans toutes les données ne produit aucune balise ni attribut actif", async () => {
    const m2 = freshMarketing(); const C = m2.ctx(1); const s = pages.createSite(C, { name: "Piège" }).id;
    const t = '"><script>alert(1)</script><img src=x onerror=alert(1)>';
    business.save(m2.db, 1, s, { legalName: t, tagline: t, address: { street: t, city: t, postalCode: "1", country: t }, hours: { note: t, exceptions: [{ date: "2026-11-10", label: t, closed: true }], days: { tue: { ranges: [{ open: "09:00", close: "18:00" }] } } }, legal: { form: t, publisher: t, hostName: t, registrations: [{ label: t, value: t }] }, delivery: { text: t, returns: t }, custom: [{ label: t, value: t }] });
    const h = await show(s, FOOTER_TYPES.filter((x) => x !== "emailsubscribe" && x !== "backtotop").map((x) => node(x, blank(x))), { ctx: C });
    assert.ok(!/<script/i.test(h), "aucune balise script");
    assert.ok(!/<img/i.test(h), "aucune balise img injectée");
    assert.ok(h.includes("&#34;scriptalert(1)/script"), "chevrons retirés à l'enregistrement, guillemets échappés à l'affichage : le contenu piégé n'est que du texte");
    assert.ok(!/<[^>]*\sonerror\s*=/i.test(h), "aucun attribut actif");
  });
  test("Téléphone et e-mail cliquables : liens reconstruits, choix du numéro, libellé", async () => {
    const h = await show(S1, [node("bizphone", { which: "2", showLabel: true, prefix: "Livraison :" }), node("bizemail", { text: "Écrivez-nous" })]);
    assert.match(h, /href="tel:0198765432">01\.98\.76\.54\.32</);
    assert.match(h, /Livraison :/); assert.match(h, /href="mailto:contact@atelier-soleil\.fr">Écrivez-nous</);
    assert.ok(!h.includes("javascript:"));
  });
  test("Horaires : lignes regroupées, « ouvert maintenant » calculé avec l'horloge fournie, jour courant marqué, exceptions et remarque", async () => {
    const open = await show(S1, [node("bizhours", {})], { now: new Date("2026-11-10T08:00:00Z") });
    assert.match(open, /Ouvert maintenant/); assert.match(open, /kw-biz-status is-open/);
    assert.match(open, /<dt>Mardi au vendredi<\/dt><dd>9h–12h30 et 14h–18h<\/dd>/);
    assert.match(open, /kw-biz-row is-today"><dt>Mardi au vendredi/);
    assert.match(open, /<dt>Lundi<\/dt><dd>Fermé<\/dd>/);
    assert.match(open, /25\/12\/2026/); assert.match(open, /Sur rendez-vous le dimanche\./);
    const closed = await show(S1, [node("bizhours", {})], { now: new Date("2026-11-09T10:00:00Z") });
    assert.match(closed, /Fermé actuellement/); assert.match(closed, /kw-biz-status is-closed/);
    const noStatus = await show(S1, [node("bizhours", { showOpenNow: false, groupDays: false })], { now: new Date("2026-11-10T08:00:00Z") });
    assert.ok(!/Ouvert maintenant/.test(noStatus)); assert.match(noStatus, /<dt>Mercredi<\/dt>/);
  });
  test("Informations légales, moyens de paiement, livraison, champs personnalisés", async () => {
    const h = await show(S1, [node("bizlegal", { showPublisher: true, showHost: true }), node("bizpayments", {}), node("bizdelivery", {}), node("bizfields", {})]);
    assert.match(h, /SIRET : <\/span><span class="kw-biz-text">123 456 789 00012/); assert.match(h, /SARL, capital de 10 000 €/); assert.match(h, /Jeanne Soleil/); assert.match(h, /Hébergeur Exemple, 1 avenue du Serveur, Lyon/);
    assert.match(h, /href="\/mentions-legales">Mentions légales</); assert.match(h, /href="https:\/\/exemple\.fr\/cgv" rel="noopener">Conditions générales de vente</);
    assert.match(h, /Carte bancaire/); assert.match(h, /Virement bancaire/); assert.match(h, /Espèces/); assert.ok(!/Visa|Mastercard|American/i.test(h), "aucune marque inventée");
    assert.match(h, /Livraison sous 3 jours ouvrés\./); assert.match(h, /Retours sous 14 jours\./);
    assert.match(h, /Médiateur : <\/span><span class="kw-biz-text">Médiation Exemple/);
  });
  test("Retour en haut : vrai lien nommé, mode fixé avec seuil et script, mode en ligne sans script ; dans l'éditeur, pas de script", async () => {
    const fixed = await show(S1, [node("backtotop", { threshold: 450, side: "left" })]);
    assert.match(fixed, /is-fixed is-left/); assert.match(fixed, /data-kw-btt="450"/); assert.match(fixed, /<a class="kw-btt-link" href="#" aria-label="Retour en haut">/); assert.match(fixed, /kw-backtotop\.js|kw-backtotop/);
    const inline = await show(S1, [node("backtotop", { mode: "inline", label: "Haut de page" })]);
    assert.match(inline, /is-inline/); assert.ok(!/data-kw-btt/.test(inline)); assert.match(inline, />Haut de page</);
    const ed = await show(S1, [node("backtotop", {})], { builder: true });
    assert.ok(!/<script/.test(ed) && !/data-kw-btt/.test(ed));
  });
  test("le script du bouton respecte le mouvement réduit et le clavier (vrai lien, focus rendu)", () => {
    const js = require("node:fs").readFileSync(path.join(__dirname, "../public/js/kw-backtotop.js"), "utf8");
    assert.match(js, /prefers-reduced-motion: reduce/); assert.match(js, /reduced\.matches \? "auto" : "smooth"/); assert.match(js, /\.focus\(/); assert.match(js, /passive: true/);
    const css = require("node:fs").readFileSync(path.join(__dirname, "../public/css/landing.css"), "utf8");
    assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.kw-backtotop\.is-armed \{ transition: none; \} \}/);
  });
  test("aucune donnée : rendu public VIDE et propre (pas même une enveloppe), message d'aide dans l'éditeur seulement", async () => {
    const m3 = freshMarketing(); const C = m3.ctx(1); const s = pages.createSite(C, { name: "Vide" }).id;
    const list = FOOTER_TYPES.filter((x) => x !== "backtotop" && x !== "emailsubscribe").map((x) => node(x, blank(x)));
    const pub = await show(s, list, { ctx: C });
    assert.equal(pub.replace(/\s+/g, ""), "", `rien d'affiché : ${pub.slice(0, 200)}`);
    const ed = await show(s, list, { ctx: C, builder: true });
    assert.equal(count(ed, "kw-biz-empty"), 8); assert.match(ed, /Données de l’entreprise/);
    assert.ok(!/undefined|null|\[object/.test(pub + ed));
  });
  test("coordonnées masquées dans les réglages : le widget ne les montre pas", async () => {
    const m4 = freshMarketing(); const C = m4.ctx(1); const s = pages.createSite(C, { name: "Discret" }).id;
    business.save(m4.db, 1, s, { email: "prive@exemple.fr", phones: [{ number: "+33 6 11 22 33 44" }], address: { city: "Lyon" }, hidden: { email: true, phone: true } });
    const h = await show(s, [node("bizcontact", {}), node("bizphone", {}), node("bizemail", {})], { ctx: C });
    assert.ok(!h.includes("prive@exemple.fr") && !h.includes("mailto:") && !h.includes("tel:") && !h.includes("33 6 11"));
    assert.match(h, /Lyon/);
  });
  test("isolation : chaque site ne montre QUE ses données", async () => {
    const a = await show(S1, [node("bizcontact", {})]); const b = await show(S2, [node("bizcontact", { showName: true })]);
    assert.match(a, /atelier-soleil\.fr/); assert.ok(!a.includes("garage@deux.fr") && !a.includes("Garage Deux"));
    assert.match(b, /garage@deux\.fr/); assert.match(b, /Garage Deux/); assert.ok(!b.includes("atelier-soleil") && !b.includes("Lilas"));
  });
  test("Abonnement par e-mail : réutilise un formulaire publié DU MÊME SITE (e-mail seul), sans logique propre", async () => {
    const m5 = freshMarketing(); const C = m5.ctx(1);
    const s1 = pages.createSite(C, { name: "Un" }).id, s2 = pages.createSite(C, { name: "Deux" }).id;
    const fOther = forms.createForm(C, { name: "Lettre autre site", fields: [], consentText: "J'accepte la lettre de l'autre site.", siteId: s2 }); forms.setStatus(C, fOther.id, "published");
    // sans formulaire publié sur le site : rien en public, aide dans l'éditeur
    assert.equal((await show(s1, [node("emailsubscribe", {})], { ctx: C })).replace(/\s+/g, ""), "");
    assert.match(await show(s1, [node("emailsubscribe", {})], { ctx: C, builder: true }), /aucun formulaire d’inscription publié/);
    const f = forms.createForm(C, { name: "Lettre", fields: [], consentText: "J'accepte de recevoir la lettre.", siteId: s1 }); forms.setStatus(C, f.id, "published");
    const h = await show(s1, [node("emailsubscribe", { title: "Restez informé", button: "Je m'abonne" })], { ctx: C });
    assert.match(h, /name="email"/); assert.match(h, /name="consent"/); assert.match(h, /name="website"/, "piège à robots du formulaire réel"); assert.match(h, /name="ft" value="jeton"/);
    assert.match(h, /J(?:'|&#39;)accepte de recevoir la lettre\./); assert.match(h, /Je m(?:'|&#39;)abonne/); assert.match(h, /action="\/p\/[^"]+\/inscription"/);
    assert.ok(!h.includes("autre site"), "le formulaire d'un autre site n'est jamais proposé");
    // formulaire d'un autre site demandé par numéro : refusé
    assert.equal((await show(s1, [node("emailsubscribe", { formId: fOther.id })], { ctx: C })).replace(/\s+/g, ""), "");
    // formulaire avec un champ obligatoire en plus de l'e-mail : non proposé automatiquement
    const emailSub = require("../src/marketing/pages/emailSubscribe");
    assert.equal(emailSub.emailOnly({ fieldSettings: { first_name: { required: true } } }), false);
    assert.equal(emailSub.emailOnly({ fieldSettings: {} }), true);
  });
  test("20 widgets dans un document de pied : tous valides, enregistrés et rendus (ou vides) sans erreur ni doublon d'identifiant", async () => {
    const list = []; for (let i = 0; i < 2; i++) for (const t of FOOTER_TYPES) list.push(node(t, blank(t)));
    assert.equal(list.length, 20);
    const h = await show(S1, list);
    for (const t of ["bizcontact", "bizhours", "bizlegal", "bizpayments", "bizdelivery", "bizfields", "bizphone", "bizemail", "backtotop"]) assert.ok(h.includes(`kw-${t}`), t);
    const ids = [...h.matchAll(/kw-n-([a-z0-9]+)/g)].map((x) => x[1]);
    assert.equal(new Set(ids).size, ids.length, "identifiants uniques");
    assert.ok(!/ne peut pas s'afficher/.test(h));
  });
  test("liens : tel: et mailto: des widgets ne sont pas comptés comme clics de la page (comme les ancres)", () => {
    const m6 = freshMarketing(); const C = m6.ctx(1);
    const p = pages.createPage(C, { name: "Clics", kind: "page" });
    const saved = pages.saveDraft(C, p.id, wrap(node("button", { label: "Appeler", url: "tel:+33 1 23 45 67 89", variant: "primary" }), node("button", { label: "Catalogue", url: "/catalogue", variant: "primary" })), { revision: pages.getPage(C, p.id).revision }).content.sections;
    const vm = landing.viewModel(C, { id: p.id, slug: p.slug, site_id: null, sections: saved, title: "t" });
    assert.deepEqual(landing.linksOf(vm).map((l) => l.url), ["/catalogue"]);
  });
});

// ---- Bout en bout : écran d'administration, droits, pied publié avec 20 widgets, isolation ----
describe("données d'entreprise et pied publié (serveur complet)", () => {
  let srv, boss, db, S1, S2, pA, pB;
  const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const SCREEN = (s) => `/marketing/site-web/parametres/entreprise${s ? `?site=${s}` : ""}`;
  const slug = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  const pub = async (id) => (await new Client(srv.base).get(`/p/${slug(id)}`, { headers: UA })).text;
  const mkPage = async (site, name) => {
    const id = Number((await boss.post("/marketing/pages", { name, site_id: site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: "t", sections: [{ id: "sect00000009", type: "layout", children: [{ id: "h0000000001", type: "heading", props: { text: "Page", level: "2" } }] }] } } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    return id;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (n) => Number((await boss.post("/marketing/site-web/sites", { name: n })).location.match(/sites\/(\d+)/)[1]);
    S1 = await mk("Site Un"); S2 = await mk("Site Deux");
    pA = await mkPage(S1, "Accueil"); pB = await mkPage(S2, "Autre");
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("l'écran s'ouvre, refuse une saisie invalide sans rien écrire (422), enregistre une saisie valide, et les données restent propres à chaque site", async () => {
    const g = await boss.get(SCREEN(S1));
    assert.equal(g.status, 200); assert.match(g.text, /Données de l'entreprise/); assert.match(g.text, /name="phone1_number"/);
    const badPost = await boss.post(SCREEN(S1), { site: S1, email: "pas-un-mail", legalName: "X" });
    assert.equal(badPost.status, 422); assert.match(badPost.text, /E-mail de contact/); assert.match(badPost.text, /value="pas-un-mail"/, "la saisie est réaffichée");
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM mk_business_profile").get().n, 0, "rien d'écrit");
    const ok = await boss.post(SCREEN(S1), { site: S1, legalName: "Atelier Soleil", tagline: "Du bon pain", street: "12 rue des Lilas", postalCode: "75011", city: "Paris", country: "France", phone1_number: "+33 1 23 45 67 89", email: "contact@atelier-soleil.fr", h_tue_o1: "00:00", h_tue_c1: "24:00", h_mon_closed: "1", pay_card: "1", pagePrivacy: "/confidentialite", deliveryText: "Sous 3 jours." });
    assert.ok([200, 302, 303].includes(ok.status), String(ok.status));
    const row = db.prepare("SELECT site_id, data FROM mk_business_profile").all();
    assert.equal(row.length, 1); assert.equal(row[0].site_id, S1);
    const g2 = await boss.get(SCREEN(S2));
    assert.ok(!g2.text.includes("Atelier Soleil") && !g2.text.includes("atelier-soleil"), "le site deux ne voit pas les données du site un");
    const g1 = await boss.get(SCREEN(S1));
    assert.match(g1.text, /value="Atelier Soleil"/); assert.match(g1.text, /value="\+33 1 23 45 67 89"/);
  });
  test("droits : une personne non connectée ou sans permission n'accède ni en lecture ni en écriture", async () => {
    const anon = new Client(srv.base);
    const r = await anon.get(SCREEN(S1));
    assert.ok(r.status === 302 || r.status === 401 || r.status === 403, String(r.status));
    assert.ok(!r.text.includes("Atelier Soleil"));
    const w = await anon.post(SCREEN(S1), { site: S1, legalName: "Piraté" });
    assert.ok(w.status !== 200 && w.status !== 422, String(w.status));
    assert.ok(!db.prepare("SELECT data FROM mk_business_profile WHERE site_id = ?").get(S1).data.includes("Piraté"));
    const stu = await newStudent(srv);
    const s = await stu.get(SCREEN(S1));
    assert.ok(s.status === 302 || s.status === 403 || s.status === 404, String(s.status));
    assert.ok(!s.text.includes("Atelier Soleil"));
  });
  test("pied publié avec 20 widgets : un seul pied, coordonnées cliquables du bon site, rien du site voisin", async () => {
    const footer = async (site, name) => JSON.parse((await boss.request(U(site, "/api/modeles"), { method: "POST", json: { type: "footer", name, conditions: {} } })).text).template;
    const kids = []; for (let i = 0; i < 2; i++) for (const t of FOOTER_TYPES) kids.push({ id: `f${String(kids.length).padStart(2, "0")}${t}`.slice(0, 20), type: t, props: {} });
    kids.unshift({ id: "fhead0000001", type: "heading", props: { text: "PIED-ENTREPRISE-UNIQUE", level: "2" } });
    const t1 = await footer(S1, "Pied entreprise");
    const rev = db.prepare("SELECT revision FROM mk_web_components WHERE id = ?").get(t1.sourceId).revision;
    const put = await boss.request(`/marketing/site-web/composants/${t1.sourceId}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: "t", sections: [{ id: `sect${String(t1.id).padStart(7, "0")}`, type: "layout", children: [{ id: "fbox00000001", type: "container", props: {}, children: kids }] }] } } });
    assert.equal(put.status, 200, put.text.slice(0, 300));
    const pb = await boss.request(U(S1, `/api/modeles/${t1.id}/publier`), { method: "POST", json: {} });
    assert.equal(pb.status, 200, pb.text.slice(0, 300));
    const h = await pub(pA);
    assert.equal(count(h, "PIED-ENTREPRISE-UNIQUE"), 1, "le pied est rendu une seule fois");
    assert.equal(count(h, 'class="lp-foot"'), 0, "aucun pied par défaut en plus");
    assert.match(h, /href="tel:\+33123456789"/); assert.match(h, /href="mailto:contact@atelier-soleil\.fr"/); assert.match(h, /12 rue des Lilas, 75011 Paris, France/);
    assert.match(h, /Ouvert maintenant|Fermé actuellement/);
    assert.match(h, /Carte bancaire/); assert.match(h, /href="\/confidentialite"/);
    assert.ok(h.includes("kw-backtotop"));
    const other = await pub(pB);
    assert.ok(!other.includes("PIED-ENTREPRISE-UNIQUE") && !other.includes("atelier-soleil") && !other.includes("tel:+33123456789"), "le site voisin ne reçoit ni le pied ni les données");
  });
});
