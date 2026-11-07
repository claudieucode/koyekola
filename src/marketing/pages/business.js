// Données d'entreprise d'UN site (principal = site_id NULL) : raison sociale, slogan, adresse, téléphones, e-mail, horaires d'ouverture,
// informations légales, pages légales, moyens de paiement, livraison et retours, champs personnalisés.
// UNE seule source pour le pied de page : les widgets « Pied de page » (widgets/footer.js) et les étiquettes {{business.…}} (dynamic.js) lisent ici,
// l'écran « Paramètres → Données de l'entreprise » (web/businessSettings.js) écrit ici. Table : mk_business_profile (migration 140), un JSON validé par normalize().
// Sécurité : tout est du TEXTE (jamais de HTML ; l'affichage échappe), les adresses cliquables (tel:, mailto:) sont reconstruites ici à partir de valeurs validées,
// les liens légaux passent par linkUrl, chaque site a sa ligne (organisation + site), et les coordonnées personnelles peuvent être masquées de l'affichage public.
const { bad, line, linkUrl } = require("./sections");

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = { mon: "Lundi", tue: "Mardi", wed: "Mercredi", thu: "Jeudi", fri: "Vendredi", sat: "Samedi", sun: "Dimanche" };
const DAY_SHORT = { mon: "Lun", tue: "Mar", wed: "Mer", thu: "Jeu", fri: "Ven", sat: "Sam", sun: "Dim" };
// Moyens de paiement : liste FERMÉE de libellés génériques (aucune marque inventée, aucun logo de marque)
const PAYMENTS = { card: "Carte bancaire", paypal: "PayPal", transfer: "Virement bancaire", check: "Chèque", cash: "Espèces", cod: "Paiement à la livraison", mobile: "Paiement mobile", instalments: "Paiement en plusieurs fois" };
const MAX = { phones: 3, registrations: 5, custom: 6, ranges: 3, exceptions: 24 };

const EMAIL = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]{1,63}(?:\.[A-Za-z0-9-]{1,63}){1,5}$/;
const text = (v, max) => line(typeof v === "string" ? v : "", max).replace(/[<>]/g, ""); // texte brut : les chevrons n'ont aucun sens ici (l'affichage échappe quand même)
const area = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f<>]/g, "").replace(/[ \t]+/g, " ").trim().slice(0, max) : "");

function emailOf(v, label) {
  const e = text(v, 254);
  if (!e) return "";
  if (e.length > 254 || !EMAIL.test(e)) throw bad(`${label} : adresse e-mail non valide (exemple : contact@mon-site.fr).`);
  return e;
}
function phoneOf(v, label) {
  const t = text(v, 30);
  if (!t) return "";
  const digits = t.replace(/\D/g, "");
  if (!/^\+?[0-9][0-9 .()-]{4,28}$/.test(t) || digits.length < 6 || digits.length > 15) throw bad(`${label} : numéro non valide (6 à 15 chiffres ; exemple : +33 1 23 45 67 89).`);
  return t;
}
// Adresse téléphonique « tel: » reconstruite à partir d'un numéro validé (chiffres, « + » initial)
const telHref = (number) => { const t = String(number || ""); const d = t.replace(/\D/g, ""); return d ? `tel:${t.trim().startsWith("+") ? "+" : ""}${d}` : ""; };
const mailHref = (email) => (EMAIL.test(String(email || "")) ? `mailto:${email}` : "");

// ---- Horaires ----
const toMin = (hhmm) => { const m = /^(\d{2}):(\d{2})$/.exec(hhmm); return m ? Number(m[1]) * 60 + Number(m[2]) : NaN; };
function timeOf(v, label, allow24) {
  const t = String(v ?? "").trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) throw bad(`${label} : heure non valide (format 09:00).`);
  const h = Number(m[1]), mi = Number(m[2]);
  if (allow24 && h === 24 && mi === 0) return "24:00";
  if (h > 23 || mi > 59) throw bad(`${label} : heure non valide (entre 00:00 et 23:59).`);
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}
// Plages d'un jour : « 09:00 → 12:00 », triées, sans chevauchement, 3 au plus ; une plage vide (aucune heure saisie) est ignorée
function rangesOf(raw, label) {
  const list = (Array.isArray(raw) ? raw : []).filter((r) => r && typeof r === "object" && (String(r.open ?? "").trim() || String(r.close ?? "").trim())).slice(0, 12);
  if (list.length > MAX.ranges) throw bad(`${label} : ${MAX.ranges} plages au plus par jour.`);
  const out = list.map((r, i) => {
    if (!String(r.open ?? "").trim() || !String(r.close ?? "").trim()) throw bad(`${label}, plage ${i + 1} : indiquez l'heure d'ouverture ET l'heure de fermeture.`);
    const open = timeOf(r.open, `${label}, plage ${i + 1} (ouverture)`, false), close = timeOf(r.close, `${label}, plage ${i + 1} (fermeture)`, true);
    if (toMin(close) <= toMin(open)) throw bad(`${label}, plage ${i + 1} : la fermeture doit être après l'ouverture (pour une ouverture jusqu'à minuit, indiquez 24:00).`);
    return { open, close };
  }).sort((a, b) => toMin(a.open) - toMin(b.open));
  for (let i = 1; i < out.length; i++) if (toMin(out[i].open) < toMin(out[i - 1].close)) throw bad(`${label} : les plages horaires se chevauchent.`);
  return out;
}
function validDate(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || "").trim());
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]) ? `${m[1]}-${m[2]}-${m[3]}` : null;
}
function hoursOf(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const rd = r.days && typeof r.days === "object" ? r.days : {};
  const days = {};
  for (const d of DAYS) {
    const x = rd[d] && typeof rd[d] === "object" ? rd[d] : {};
    const ranges = x.closed === true ? [] : rangesOf(x.ranges, DAY_LABELS[d]);
    days[d] = { closed: ranges.length === 0, ranges }; // aucune plage = fermé
  }
  const seen = new Set();
  const exceptions = (Array.isArray(r.exceptions) ? r.exceptions : []).filter((x) => x && typeof x === "object" && String(x.date || "").trim()).slice(0, MAX.exceptions + 1).map((x, i) => {
    const date = validDate(x.date);
    if (!date) throw bad(`Exception ${i + 1} : date non valide (format AAAA-MM-JJ, exemple 2026-12-25).`);
    if (seen.has(date)) throw bad(`Exception ${i + 1} : la date ${date} est déjà utilisée.`);
    seen.add(date);
    const ranges = x.closed === true ? [] : rangesOf(x.ranges, `Exception ${date}`);
    return { date, label: text(x.label, 60), closed: ranges.length === 0, ranges };
  });
  if (exceptions.length > MAX.exceptions) throw bad(`${MAX.exceptions} exceptions au plus.`);
  exceptions.sort((a, b) => a.date.localeCompare(b.date));
  return { days, exceptions, note: text(r.note, 160) };
}
const hasHours = (h) => Boolean(h && DAYS.some((d) => h.days[d] && h.days[d].ranges.length));

// Vue de l'ensemble : tout champ non renseigné reste vide
function normalize(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const a = r.address && typeof r.address === "object" ? r.address : {};
  const phones = (Array.isArray(r.phones) ? r.phones : []).filter((x) => x && typeof x === "object" && String(x.number || "").trim());
  if (phones.length > MAX.phones) throw bad(`${MAX.phones} numéros de téléphone au plus.`);
  const lg = r.legal && typeof r.legal === "object" ? r.legal : {};
  const regs = (Array.isArray(lg.registrations) ? lg.registrations : []).filter((x) => x && typeof x === "object" && String(x.value || "").trim());
  if (regs.length > MAX.registrations) throw bad(`${MAX.registrations} numéros d'immatriculation au plus.`);
  const lp = r.legalPages && typeof r.legalPages === "object" ? r.legalPages : {};
  const pay = Array.isArray(r.payments) ? r.payments.filter((k) => Object.hasOwn(PAYMENTS, k)) : [];
  const dl = r.delivery && typeof r.delivery === "object" ? r.delivery : {};
  const custom = (Array.isArray(r.custom) ? r.custom : []).filter((x) => x && typeof x === "object" && String(x.value || "").trim());
  if (custom.length > MAX.custom) throw bad(`${MAX.custom} champs personnalisés au plus.`);
  const hid = r.hidden && typeof r.hidden === "object" ? r.hidden : {};
  const page = (v, label) => { try { return linkUrl(v, label); } catch { throw bad(`${label} : indiquez une page du site (« /mentions-legales ») ou une adresse https://.`); } };
  const noMail = (u, label) => { if (/^(mailto|tel):/i.test(u)) throw bad(`${label} : une page du site ou une adresse https:// est attendue.`); return u; };
  return {
    legalName: text(r.legalName, 150), tagline: text(r.tagline, 200),
    address: { street: text(a.street, 150), postalCode: text(a.postalCode, 12), city: text(a.city, 80), country: text(a.country, 80) },
    phones: phones.map((x, i) => ({ label: text(x.label, 40), number: phoneOf(x.number, `Téléphone ${i + 1}`) })),
    email: emailOf(r.email, "E-mail de contact"),
    hours: hoursOf(r.hours),
    legal: {
      form: text(lg.form, 60), capital: text(lg.capital, 40), publisher: text(lg.publisher, 100), hostName: text(lg.hostName, 100), hostAddress: text(lg.hostAddress, 200),
      registrations: regs.map((x) => ({ label: text(x.label, 40) || "Numéro", value: text(x.value, 60) })),
    },
    legalPages: { notice: noMail(page(lp.notice, "Page des mentions légales"), "Page des mentions légales"), privacy: noMail(page(lp.privacy, "Page de confidentialité"), "Page de confidentialité"), terms: noMail(page(lp.terms, "Page des conditions de vente"), "Page des conditions de vente") },
    payments: Object.keys(PAYMENTS).filter((k) => pay.includes(k)),
    delivery: { text: area(dl.text, 300), returns: area(dl.returns, 300) },
    custom: custom.map((x) => ({ label: text(x.label, 40) || "Information", value: text(x.value, 200) })),
    hidden: { email: hid.email === true, phone: hid.phone === true, address: hid.address === true },
  };
}
const EMPTY = () => normalize({});

// ---- Formulaire HTML (champs à plat) → objet à valider ----
function fromForm(b) {
  const g = (k) => (b[k] === undefined || b[k] === null ? "" : String(b[k]));
  const days = {};
  for (const d of DAYS) days[d] = { closed: b[`h_${d}_closed`] === "1", ranges: [1, 2, 3].map((i) => ({ open: g(`h_${d}_o${i}`), close: g(`h_${d}_c${i}`) })) };
  const exceptions = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ date: g(`x${i}_date`), label: g(`x${i}_label`), closed: b[`x${i}_closed`] === "1", ranges: [1, 2].map((k) => ({ open: g(`x${i}_o${k}`), close: g(`x${i}_c${k}`) })) }));
  return {
    legalName: g("legalName"), tagline: g("tagline"),
    address: { street: g("street"), postalCode: g("postalCode"), city: g("city"), country: g("country") },
    phones: [1, 2, 3].map((i) => ({ label: g(`phone${i}_label`), number: g(`phone${i}_number`) })),
    email: g("email"),
    hours: { days, exceptions, note: g("hoursNote") },
    legal: { form: g("legalForm"), capital: g("capital"), publisher: g("publisher"), hostName: g("hostName"), hostAddress: g("hostAddress"), registrations: [1, 2, 3, 4, 5].map((i) => ({ label: g(`reg${i}_label`), value: g(`reg${i}_value`) })) },
    legalPages: { notice: g("pageNotice"), privacy: g("pagePrivacy"), terms: g("pageTerms") },
    payments: Object.keys(PAYMENTS).filter((k) => b[`pay_${k}`] === "1"),
    delivery: { text: g("deliveryText"), returns: g("returnsText") },
    custom: [1, 2, 3, 4, 5, 6].map((i) => ({ label: g(`custom${i}_label`), value: g(`custom${i}_value`) })),
    hidden: { email: b.hide_email === "1", phone: b.hide_phone === "1", address: b.hide_address === "1" },
  };
}

// Modèle de l'écran : le profil (validé ou saisi) complété jusqu'au nombre de lignes affichées (la saisie refusée est ainsi réaffichée telle quelle)
function formModel(p) {
  const pad = (list, n, make) => { const a = (Array.isArray(list) ? list : []).slice(0, n); while (a.length < n) a.push(make()); return a; };
  const r = p && typeof p === "object" ? p : {};
  const days = {};
  for (const d of DAYS) {
    const x = (r.hours && r.hours.days && r.hours.days[d]) || {};
    const ranges = pad((x.ranges || []).map((q) => ({ open: String(q.open || ""), close: String(q.close || "") })), MAX.ranges, () => ({ open: "", close: "" }));
    days[d] = { closed: x.closed === true || !ranges.some((q) => q.open || q.close), ranges };
  }
  const exceptions = pad(((r.hours && r.hours.exceptions) || []).map((x) => ({ date: String(x.date || ""), label: String(x.label || ""), closed: x.closed === true, ranges: pad((x.ranges || []).map((q) => ({ open: String(q.open || ""), close: String(q.close || "") })), 2, () => ({ open: "", close: "" })) })), 8, () => ({ date: "", label: "", closed: false, ranges: pad([], 2, () => ({ open: "", close: "" })) }));
  const a = r.address || {}, lg = r.legal || {}, lp = r.legalPages || {}, dl = r.delivery || {}, hid = r.hidden || {};
  return {
    legalName: r.legalName || "", tagline: r.tagline || "", address: { street: a.street || "", postalCode: a.postalCode || "", city: a.city || "", country: a.country || "" },
    phones: pad(r.phones, MAX.phones, () => ({ label: "", number: "" })), email: r.email || "", hours: { days, exceptions, note: (r.hours && r.hours.note) || "" },
    legal: { form: lg.form || "", capital: lg.capital || "", publisher: lg.publisher || "", hostName: lg.hostName || "", hostAddress: lg.hostAddress || "", registrations: pad(lg.registrations, MAX.registrations, () => ({ label: "", value: "" })) },
    legalPages: { notice: lp.notice || "", privacy: lp.privacy || "", terms: lp.terms || "" }, payments: Array.isArray(r.payments) ? r.payments : [],
    delivery: { text: dl.text || "", returns: dl.returns || "" }, custom: pad(r.custom, MAX.custom, () => ({ label: "", value: "" })), hidden: { email: hid.email === true, phone: hid.phone === true, address: hid.address === true },
  };
}

// ---- Stockage (isolé par organisation ET par site ; site_id NULL = site principal) ----
function get(db, organizationId, siteId = null) {
  let row = null;
  try { row = db.prepare("SELECT data FROM mk_business_profile WHERE organization_id = ? AND site_id IS ?").get(organizationId, siteId ?? null); } catch { row = null; } // table absente (base ancienne) : profil vide
  if (!row) return EMPTY();
  try { return normalize(JSON.parse(row.data)); } catch { return EMPTY(); } // donnée corrompue : jamais d'erreur à l'affichage
}
function save(db, organizationId, siteId, raw, userId = null) {
  const data = normalize(raw); // lève une erreur claire (invalid_field) AVANT toute écriture
  const json = JSON.stringify(data);
  const found = db.prepare("SELECT id FROM mk_business_profile WHERE organization_id = ? AND site_id IS ?").get(organizationId, siteId ?? null);
  if (found) db.prepare("UPDATE mk_business_profile SET data = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?").run(json, userId, found.id);
  else db.prepare("INSERT INTO mk_business_profile (organization_id, site_id, data, updated_by) VALUES (?, ?, ?, ?)").run(organizationId, siteId ?? null, json, userId);
  return data;
}

// ---- Affichage public ----
// Ce que voit le public : les coordonnées marquées « ne pas afficher » sont retirées ICI (aucune étiquette ni aucun widget ne peut les lire)
function publicView(p) {
  const v = JSON.parse(JSON.stringify(p));
  if (v.hidden.email) v.email = "";
  if (v.hidden.phone) v.phones = [];
  if (v.hidden.address) v.address = { street: "", postalCode: "", city: "", country: "" };
  return v;
}
const addressLine = (a) => [a.street, [a.postalCode, a.city].filter(Boolean).join(" "), a.country].filter(Boolean).join(", ");
const hasAddress = (a) => Boolean(a && (a.street || a.city || a.postalCode || a.country));

const hm = (t) => { const [h, m] = t.split(":"); return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`; };
const rangesText = (rs) => rs.map((r) => `${hm(r.open)}–${hm(r.close)}`).join(" et ");
// Résumé « Lun–Ven : 9h–12h et 14h–18h · Sam : 10h–12h · Dim : fermé » (jours consécutifs identiques regroupés)
function hoursSummary(h) {
  if (!hasHours(h)) return "";
  const sig = (d) => rangesText(h.days[d].ranges) || "fermé";
  const groups = [];
  for (const d of DAYS) {
    const last = groups[groups.length - 1];
    if (last && last.sig === sig(d)) last.to = d; else groups.push({ from: d, to: d, sig: sig(d) });
  }
  return groups.map((g) => `${g.from === g.to ? DAY_SHORT[g.from] : `${DAY_SHORT[g.from]}–${DAY_SHORT[g.to]}`} : ${g.sig}`).join(" · ");
}
// Lignes détaillées pour le widget : un groupe par jours consécutifs identiques
function hoursRows(h) {
  if (!hasHours(h)) return [];
  const rows = [];
  for (const d of DAYS) {
    const sig = rangesText(h.days[d].ranges);
    const last = rows[rows.length - 1];
    if (last && last.sig === sig) last.to = d; else rows.push({ from: d, to: d, sig });
  }
  return rows.map((g) => ({ days: g.from === g.to ? DAY_LABELS[g.from] : `${DAY_LABELS[g.from]} au ${DAY_LABELS[g.to].toLowerCase()}`, closed: !g.sig, text: g.sig, today: false, from: g.from, to: g.to }));
}

// Heure locale du site à l'instant `now` (Date) : { date: "AAAA-MM-JJ", day: "mon"…, minutes } — `tz` est un fuseau IANA reconnu, sinon UTC
function localParts(now, tz) {
  const d = now instanceof Date && !Number.isNaN(now.getTime()) ? now : new Date();
  let parts;
  try { parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz || "UTC", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" }).formatToParts(d); }
  catch { parts = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" }).formatToParts(d); }
  const v = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const day = { Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun" }[v.weekday] || "mon";
  return { date: `${v.year}-${v.month}-${v.day}`, day, minutes: (Number(v.hour) % 24) * 60 + Number(v.minute) };
}
// « Ouvert maintenant » : null si aucun horaire n'est renseigné (le widget n'affiche alors rien), sinon { open, label, today }
// Une exception datée remplace les horaires habituels du jour.
function openNow(h, now, tz) {
  if (!hasHours(h)) return null;
  const t = localParts(now, tz);
  const ex = h.exceptions.find((x) => x.date === t.date);
  const today = ex ? { closed: ex.closed, ranges: ex.ranges } : h.days[t.day];
  const open = today.ranges.some((r) => t.minutes >= toMin(r.open) && t.minutes < toMin(r.close));
  return { open, label: open ? "Ouvert maintenant" : "Fermé actuellement", day: t.day, date: t.date, exception: ex ? ex.label || "Horaires exceptionnels" : "" };
}
// Exceptions à venir (aujourd'hui compris) pour l'affichage
function upcomingExceptions(h, now, tz) {
  const t = localParts(now, tz);
  return h.exceptions.filter((x) => x.date >= t.date).slice(0, 6).map((x) => ({ date: x.date, label: x.label, text: x.closed ? "Fermé" : rangesText(x.ranges) }));
}
const frDate = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso); return m ? `${Number(m[3])}/${m[2]}/${m[1]}` : ""; };

// ---- Contexte d'une page : profil public + fuseau du site ----
function timezoneOf(db, organizationId, siteId) {
  if (!siteId) return "Europe/Paris";
  try {
    const row = db.prepare("SELECT settings FROM mk_sites WHERE id = ? AND organization_id = ?").get(siteId, organizationId);
    const tz = row ? require("./siteSettings").normalizeSettings(JSON.parse(row.settings || "{}")).general.timezone : "";
    return tz || "Europe/Paris";
  } catch { return "Europe/Paris"; }
}
// Données d'entreprise de la page affichée (null = rien : aperçu de démonstration d'un thème, base sans table, erreur)
function forPage(ctx, page) {
  try {
    if (!ctx || !ctx.db || ctx.demoBrand) return null;
    const siteId = page && page.site_id ? page.site_id : null;
    return { siteId, tz: timezoneOf(ctx.db, ctx.organizationId, siteId), profile: publicView(get(ctx.db, ctx.organizationId, siteId)) };
  } catch { return null; }
}
// Copyright automatique : « © 2026 Raison sociale » (nom du site sinon)
const copyrightText = (b, siteName, now) => `© ${(now || new Date()).getFullYear()} ${(b && b.profile.legalName) || siteName || ""}`.trim();

module.exports = {
  DAYS, DAY_LABELS, DAY_SHORT, PAYMENTS, MAX, normalize, fromForm, formModel, get, save, publicView, addressLine, hasAddress, hasHours, hoursSummary, hoursRows, rangesText, openNow, upcomingExceptions, localParts, frDate,
  telHref, mailHref, forPage, copyrightText, timezoneOf, EMPTY,
};
