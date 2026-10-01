// Jetons signés (HMAC-SHA256) pour les liens de désinscription et de préférences : « corps.signature » en base64url.
// La clé de signature est DÉRIVÉE de ENCRYPTION_KEY (pas de second secret à gérer) et séparée par un libellé :
// elle ne sert jamais à chiffrer. Le type (k) est signé avec le reste : un jeton de désinscription ne peut pas
// être rejoué comme jeton de préférences. Sans « exp », le jeton ne périme pas : un lien de désinscription doit
// fonctionner des années plus tard (obligation légale et de bonne foi).
const crypto = require("crypto");
const { parseKey } = require("./crypto");

const LABEL = "koyekola-marketing-token-v1";
const PART = /^[A-Za-z0-9_-]+$/;

const signingKey = (key) => crypto.createHmac("sha256", parseKey(key)).update(LABEL).digest();
const mac = (body, key) => crypto.createHmac("sha256", signingKey(key)).update(body).digest("base64url");

function signToken(payload, key) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${mac(body, key)}`;
}

function verifyToken(token, key, { kind, now = Date.now() } = {}) {
  const invalid = { ok: false, reason: "invalide" };
  if (typeof token !== "string" || token.length > 1024) return invalid;
  const parts = token.split(".");
  if (parts.length !== 2 || !PART.test(parts[0]) || !PART.test(parts[1])) return invalid;
  const expected = Buffer.from(mac(parts[0], key));
  const given = Buffer.from(parts[1]);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return invalid;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  } catch {
    return invalid;
  }
  if (!payload || typeof payload !== "object" || (kind && payload.k !== kind)) return invalid;
  if (payload.exp !== undefined && !(Number.isFinite(payload.exp) && payload.exp > now)) return { ok: false, reason: "expiré" };
  return { ok: true, payload };
}

module.exports = { signToken, verifyToken };
