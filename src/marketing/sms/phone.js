// Numéros de téléphone pour les SMS : tout numéro est ramené au format international E.164 (« +243812345678 »),
// le seul que comprennent les fournisseurs. Pas de dépendance externe : une table des pays visés par KOLAKISA
// (Afrique centrale et de l'Ouest, Maghreb, Europe francophone) ; ailleurs, un numéro saisi en « +… » reste accepté
// s'il respecte la norme (8 à 15 chiffres), mais un numéro national sans indicatif exige un pays connu.
//
// trunk : le « 0 » qu'on compose devant un numéro national et qu'on retire à l'international (France : 06… → +336…).
// Au Congo-Brazzaville, au Cameroun, en Côte d'Ivoire… il n'y en a pas : le 0 fait partie du numéro (+242 06…).
// tz : fuseau utilisé pour les heures de silence (la RD Congo en a deux : on retient Kinshasa, le plus peuplé).
const COUNTRIES = {
  CD: { label: "RD Congo", dial: "243", lengths: [9], trunk: "0", tz: "Africa/Kinshasa" },
  CG: { label: "Congo-Brazzaville", dial: "242", lengths: [9], trunk: "", tz: "Africa/Brazzaville" },
  FR: { label: "France", dial: "33", lengths: [9], trunk: "0", tz: "Europe/Paris" },
  BE: { label: "Belgique", dial: "32", lengths: [8, 9], trunk: "0", tz: "Europe/Brussels" },
  CH: { label: "Suisse", dial: "41", lengths: [9], trunk: "0", tz: "Europe/Zurich" },
  LU: { label: "Luxembourg", dial: "352", lengths: [], trunk: "", tz: "Europe/Luxembourg" },
  DE: { label: "Allemagne", dial: "49", lengths: [], trunk: "0", tz: "Europe/Berlin" },
  GB: { label: "Royaume-Uni", dial: "44", lengths: [10], trunk: "0", tz: "Europe/London" },
  ES: { label: "Espagne", dial: "34", lengths: [9], trunk: "", tz: "Europe/Madrid" },
  PT: { label: "Portugal", dial: "351", lengths: [9], trunk: "", tz: "Europe/Lisbon" },
  AO: { label: "Angola", dial: "244", lengths: [9], trunk: "", tz: "Africa/Luanda" },
  CM: { label: "Cameroun", dial: "237", lengths: [9], trunk: "", tz: "Africa/Douala" },
  GA: { label: "Gabon", dial: "241", lengths: [], trunk: "", tz: "Africa/Libreville" },
  CF: { label: "Centrafrique", dial: "236", lengths: [8], trunk: "", tz: "Africa/Bangui" },
  TD: { label: "Tchad", dial: "235", lengths: [8], trunk: "", tz: "Africa/Ndjamena" },
  RW: { label: "Rwanda", dial: "250", lengths: [9], trunk: "0", tz: "Africa/Kigali" },
  BI: { label: "Burundi", dial: "257", lengths: [8], trunk: "", tz: "Africa/Bujumbura" },
  CI: { label: "Côte d'Ivoire", dial: "225", lengths: [10], trunk: "", tz: "Africa/Abidjan" },
  SN: { label: "Sénégal", dial: "221", lengths: [9], trunk: "", tz: "Africa/Dakar" },
  ML: { label: "Mali", dial: "223", lengths: [8], trunk: "", tz: "Africa/Bamako" },
  BF: { label: "Burkina Faso", dial: "226", lengths: [8], trunk: "", tz: "Africa/Ouagadougou" },
  GN: { label: "Guinée", dial: "224", lengths: [9], trunk: "", tz: "Africa/Conakry" },
  BJ: { label: "Bénin", dial: "229", lengths: [8, 10], trunk: "", tz: "Africa/Porto-Novo" },
  TG: { label: "Togo", dial: "228", lengths: [8], trunk: "", tz: "Africa/Lome" },
  MA: { label: "Maroc", dial: "212", lengths: [9], trunk: "0", tz: "Africa/Casablanca" },
  DZ: { label: "Algérie", dial: "213", lengths: [9], trunk: "0", tz: "Africa/Algiers" },
  TN: { label: "Tunisie", dial: "216", lengths: [8], trunk: "", tz: "Africa/Tunis" },
  CA: { label: "Canada", dial: "1", lengths: [10], trunk: "", tz: "America/Toronto" },
};

const byDial = new Map(Object.entries(COUNTRIES).map(([code, c]) => [c.dial, code]));
const E164 = /^\+[1-9]\d{7,14}$/;
const isCountry = (code) => typeof code === "string" && Object.hasOwn(COUNTRIES, code);

// Indicatif le plus long qui correspond (3, puis 2, puis 1 chiffre) → code pays, ou null
function countryOfDigits(digits) {
  for (const n of [3, 2, 1]) {
    const code = byDial.get(digits.slice(0, n));
    if (code) return code;
  }
  return null;
}

function fits(code, nsn) {
  const { lengths } = COUNTRIES[code];
  return lengths.length === 0 ? nsn.length >= 4 && nsn.length <= 13 : lengths.includes(nsn.length);
}

// Numéro saisi (« 081 234 5678 », « +243 81 234 56 78 », « 00242 06 123 4567 »…) + pays par défaut
// → { ok: true, e164, country } ou { ok: false, reason }
function normalizePhone(raw, { defaultCountry } = {}) {
  if (typeof raw !== "string") return { ok: false, reason: "Numéro manquant." };
  const text = raw.trim();
  if (!text) return { ok: false, reason: "Numéro manquant." };
  if (text.length > 40 || !/^[+\d\s().\-/]+$/.test(text)) return { ok: false, reason: "Le numéro ne doit contenir que des chiffres (et éventuellement « + » au début)." };
  if (text.indexOf("+") > 0) return { ok: false, reason: "Le « + » ne peut figurer qu'au début du numéro." };
  let digits = text.replace(/\D/g, "");
  const international = text.startsWith("+") || digits.startsWith("00");
  if (international) {
    if (digits.startsWith("00")) digits = digits.slice(2);
    const code = countryOfDigits(digits);
    if (!code) {
      const e164 = `+${digits}`;
      return E164.test(e164) ? { ok: true, e164, country: "" } : { ok: false, reason: "Numéro international invalide (8 à 15 chiffres après le « + »)." };
    }
    let nsn = digits.slice(COUNTRIES[code].dial.length);
    // « +33 06 12… » : le 0 national saisi par erreur après l'indicatif est retiré
    if (COUNTRIES[code].trunk && nsn.startsWith(COUNTRIES[code].trunk) && !fits(code, nsn) && fits(code, nsn.slice(1))) nsn = nsn.slice(1);
    if (!fits(code, nsn)) return { ok: false, reason: `Numéro invalide pour ${COUNTRIES[code].label} (vérifiez le nombre de chiffres).` };
    return { ok: true, e164: `+${COUNTRIES[code].dial}${nsn}`, country: code };
  }
  if (!isCountry(defaultCountry)) return { ok: false, reason: "Indiquez le numéro au format international (par exemple +243 81 234 5678)." };
  const c = COUNTRIES[defaultCountry];
  let nsn = digits;
  if (c.trunk && nsn.startsWith(c.trunk) && fits(defaultCountry, nsn.slice(1))) nsn = nsn.slice(1);
  if (!fits(defaultCountry, nsn)) return { ok: false, reason: `Numéro invalide pour ${c.label} (vérifiez le nombre de chiffres, ou ajoutez l'indicatif +…).` };
  return { ok: true, e164: `+${c.dial}${nsn}`, country: defaultCountry };
}

// Pays d'un numéro déjà au format E.164 (« » si hors table)
const countryOfE164 = (e164) => (E164.test(String(e164)) ? countryOfDigits(String(e164).slice(1)) || "" : "");

// Affichage lisible et partiellement masqué (« +243 •••• 5678 ») : pour les listes et les journaux, jamais le numéro entier
function maskPhone(e164) {
  if (!E164.test(String(e164))) return "";
  const code = countryOfE164(e164);
  const dial = code ? COUNTRIES[code].dial : String(e164).slice(1, 3);
  return `+${dial} •••• ${String(e164).slice(-4)}`;
}

const countryOptions = () => Object.entries(COUNTRIES).map(([code, c]) => ({ code, label: `${c.label} (+${c.dial})` }));

module.exports = { COUNTRIES, E164, isCountry, normalizePhone, countryOfE164, maskPhone, countryOptions };
