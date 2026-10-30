// SEO local : horaires d'ouverture, coordonnées géographiques et établissements supplémentaires, saisis par le site (aucune valeur déduite ni inventée).
//   Horaires : une ligne par plage, « Lun-Ven 09:00-18:00 », « Sam 10:00-13:00 », « Lun,Mer,Ven 14:00-18:00 » (jours : lun, mar, mer, jeu, ven, sam, dim).
//   Établissements : une ligne par lieu, « Nom | Rue | Code postal | Ville | Pays | Téléphone | Horaires » (Horaires facultatif : plages séparées par « ; »).
const DAYS = { lun: "Monday", mar: "Tuesday", mer: "Wednesday", jeu: "Thursday", ven: "Friday", sam: "Saturday", dim: "Sunday" };
const ORDER = Object.keys(DAYS);
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const PHONE = /^\+?[0-9 ().-]{6,30}$/;
const MAX_LOCATIONS = 10;

const norm = (t) => String(t || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").slice(0, 3);

// « Lun-Ven » → [lun…ven] ; « Lun,Mer » → [lun, mer] ; « Sam » → [sam]. null si invalide.
function parseDays(token) {
  const out = [];
  for (const part of String(token).split(",")) {
    const range = part.split("-");
    if (range.length > 2) return null;
    const a = ORDER.indexOf(norm(range[0]));
    if (a < 0) return null;
    if (range.length === 1) { out.push(ORDER[a]); continue; }
    const b = ORDER.indexOf(norm(range[1]));
    if (b < 0 || b < a) return null;
    for (let i = a; i <= b; i++) out.push(ORDER[i]);
  }
  return [...new Set(out)];
}

// Texte → { specs: [{ dayOfWeek, opens, closes }], errors } ; « Fermé » n'est pas une plage : un jour sans ligne est simplement fermé
function parseHours(text, sep = /\r?\n/) {
  const specs = [];
  const errors = [];
  for (const raw of String(text || "").split(sep)) {
    const line = raw.trim();
    if (!line) continue;
    const m = /^(\S+)\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/.exec(line);
    const days = m && parseDays(m[1]);
    if (!m || !days || !TIME.test(m[2]) || !TIME.test(m[3]) || m[2] >= m[3]) { errors.push(`Horaires : « ${line.slice(0, 40)} » n'est pas valide (exemple : Lun-Ven 09:00-18:00, l'ouverture avant la fermeture).`); continue; }
    specs.push({ "@type": "OpeningHoursSpecification", dayOfWeek: days.map((d) => DAYS[d]), opens: m[2], closes: m[3] });
  }
  if (specs.length > 14) errors.push("Horaires : 14 plages au plus.");
  return { specs, errors };
}

// Coordonnées : latitude -90..90, longitude -180..180 (décimales avec point ou virgule) ; les deux ou aucune
function parseGeo(lat, lng) {
  const num = (v) => { const t = String(v ?? "").trim().replace(",", "."); return t === "" ? null : (/^-?\d{1,3}(\.\d{1,8})?$/.test(t) ? Number(t) : NaN); };
  const la = num(lat);
  const lo = num(lng);
  if (la === null && lo === null) return { geo: null, errors: [] };
  if (la === null || lo === null || Number.isNaN(la) || Number.isNaN(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) return { geo: null, errors: ["Coordonnées : latitude (−90 à 90) et longitude (−180 à 180) sont toutes deux nécessaires."] };
  return { geo: { "@type": "GeoCoordinates", latitude: la, longitude: lo }, errors: [] };
}

function parseLocations(text) {
  const locations = [];
  const errors = [];
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const c = line.split("|").map((x) => x.trim());
    const [name, street, postal, city, country, phone, hours] = c;
    const bad = (why) => errors.push(`Établissement « ${(name || line).slice(0, 30)} » : ${why}`);
    if (c.length < 4 || c.length > 7) { bad("7 champs au plus séparés par « | » : Nom | Rue | Code postal | Ville | Pays | Téléphone | Horaires."); continue; }
    if (!name || !street || !city) { bad("le nom, la rue et la ville sont obligatoires."); continue; }
    if (country && !/^[A-Za-z]{2}$/.test(country)) { bad("le pays est un code à 2 lettres (FR, BE…)."); continue; }
    if (phone && !PHONE.test(phone)) { bad("téléphone invalide."); continue; }
    const h = hours ? parseHours(hours, /;/) : { specs: [], errors: [] };
    if (h.errors.length) { bad(h.errors[0]); continue; }
    locations.push({ name: name.slice(0, 80), street: street.slice(0, 120), postal: (postal || "").slice(0, 12), city: city.slice(0, 80), country: (country || "").toUpperCase(), phone: phone || "", specs: h.specs });
  }
  if (locations.length > MAX_LOCATIONS) errors.push(`${MAX_LOCATIONS} établissements au plus.`);
  return { locations: locations.slice(0, MAX_LOCATIONS), errors };
}

// Nœuds JSON-LD des établissements supplémentaires, rattachés à l'organisation par parentOrganization
function locationNodes(text, { base, orgId }) {
  return parseLocations(text).locations.map((l, i) => {
    const node = { "@type": "LocalBusiness", "@id": `${base}/#location-${i + 1}`, name: l.name, parentOrganization: { "@id": orgId }, address: { "@type": "PostalAddress", streetAddress: l.street, addressLocality: l.city } };
    if (l.postal) node.address.postalCode = l.postal;
    if (l.country) node.address.addressCountry = l.country;
    if (l.phone) node.telephone = l.phone;
    if (l.specs.length) node.openingHoursSpecification = l.specs;
    return node;
  });
}

module.exports = { parseHours, parseGeo, parseLocations, locationNodes, parseDays, MAX_LOCATIONS };
