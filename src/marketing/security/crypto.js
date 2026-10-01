// Chiffrement des secrets (clé d'API du fournisseur d'envoi, secret de webhook…) : AES-256-GCM.
// Chaque secret est lié à un « contexte » (organisation + nom du réglage) : copier un secret chiffré d'une ligne
// à une autre (ou d'une organisation à une autre) le rend illisible. La clé vient de ENCRYPTION_KEY, jamais du code.
const crypto = require("crypto");

const HELP = "Générez-la avec : node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"";

// 64 caractères hexadécimaux, ou 32 octets encodés en base64 (44 caractères)
function parseKey(value) {
  const text = typeof value === "string" ? value.trim() : "";
  if (/^[0-9a-fA-F]{64}$/.test(text)) return Buffer.from(text, "hex");
  if (/^[A-Za-z0-9+/]{43}=$/.test(text)) {
    const bytes = Buffer.from(text, "base64");
    if (bytes.length === 32) return bytes;
  }
  throw new Error(`ENCRYPTION_KEY absente ou invalide : 32 octets attendus (64 caractères hexadécimaux, ou 44 caractères en base64). ${HELP}`);
}

const keyOf = (key) => (Buffer.isBuffer(key) ? key : parseKey(key));

function encryptSecret(plain, key, context = "") {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyOf(key), iv);
  cipher.setAAD(Buffer.from(String(context)));
  const encrypted = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), encrypted.toString("base64")].join(":");
}

function decryptSecret(token, key, context = "") {
  const parts = String(token).split(":");
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("Secret chiffré invalide (format inconnu).");
  const decipher = crypto.createDecipheriv("aes-256-gcm", keyOf(key), Buffer.from(parts[1], "base64"));
  decipher.setAAD(Buffer.from(String(context)));
  decipher.setAuthTag(Buffer.from(parts[2], "base64"));
  try {
    return Buffer.concat([decipher.update(Buffer.from(parts[3], "base64")), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("Secret illisible : mauvaise clé, mauvais contexte ou contenu modifié.");
  }
}

module.exports = { parseKey, encryptSecret, decryptSecret };
