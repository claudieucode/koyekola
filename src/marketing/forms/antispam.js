// Anti-robot des formulaires publics, en plus du champ piège et de la limite par adresse IP : un jeton signé contient
// l'heure d'affichage du formulaire. Un envoi sans jeton valide, ou moins de 2 secondes après l'affichage (aucun humain
// ne remplit un formulaire aussi vite), est traité comme un robot : réponse « réussie » sans rien enregistrer (on ne
// renseigne jamais un robot sur la raison de son échec). Aucun cookie, aucune donnée personnelle.
const crypto = require("crypto");

const MIN_MS = 2000;
const secret = () => process.env.SESSION_SECRET || process.env.ENCRYPTION_KEY || "kolakisa-formulaires";
const mac = (ts) => crypto.createHmac("sha256", secret()).update(`form-time:${ts}`).digest("base64url").slice(0, 22);

function issue(now = Date.now()) {
  return `${now}.${mac(now)}`;
}

// true = envoi humain plausible
function check(token, now = Date.now()) {
  const m = /^(\d{13})\.([A-Za-z0-9_-]{22})$/.exec(String(token || ""));
  if (!m) return false;
  const ts = Number(m[1]);
  const expected = Buffer.from(mac(ts));
  const given = Buffer.from(m[2]);
  if (!crypto.timingSafeEqual(expected, given)) return false;
  return now - ts >= MIN_MS && ts <= now + 60000;
}

module.exports = { issue, check, MIN_MS };
