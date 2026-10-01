// Réglages du module marketing, par organisation. Les secrets sont chiffrés (voir security/crypto.js).
const { encryptSecret, decryptSecret } = require("./security/crypto");

const KEY_PATTERN = /^[a-z][a-z0-9_.]{0,63}$/;
const MAX_VALUE = 8192;
const MASK = "••••••••";

function assertOrganization(id) {
  if (!Number.isInteger(id) || id < 1) throw new Error("Identifiant d'organisation invalide.");
}
function assertKey(key) {
  if (typeof key !== "string" || !KEY_PATTERN.test(key)) throw new Error("Nom de réglage invalide (minuscules, chiffres, « _ » et « . » ; 64 caractères au plus).");
}

function createSettings(db, { encryptionKey } = {}) {
  const context = (organizationId, key) => `${organizationId}:${key}`;
  return {
    set(organizationId, key, value, { secret = false } = {}) {
      assertOrganization(organizationId);
      assertKey(key);
      const text = String(value);
      if (text.length > MAX_VALUE) throw new Error(`Valeur trop longue (${MAX_VALUE} caractères au plus).`);
      const stored = secret ? encryptSecret(text, encryptionKey, context(organizationId, key)) : text;
      db.prepare(
        `INSERT INTO mk_settings (organization_id, key, value, is_secret) VALUES (?, ?, ?, ?)
         ON CONFLICT (organization_id, key) DO UPDATE SET value = excluded.value, is_secret = excluded.is_secret, updated_at = datetime('now')`
      ).run(organizationId, key, stored, secret ? 1 : 0);
    },
    // Renvoie la valeur en clair (usage interne du serveur uniquement : ne jamais l'afficher ni la journaliser)
    get(organizationId, key, fallback = null) {
      assertOrganization(organizationId);
      assertKey(key);
      const row = db.prepare("SELECT value, is_secret FROM mk_settings WHERE organization_id = ? AND key = ?").get(organizationId, key);
      if (!row) return fallback;
      return row.is_secret ? decryptSecret(row.value, encryptionKey, context(organizationId, key)) : row.value;
    },
    // Pour l'affichage : les secrets sont masqués
    list(organizationId) {
      assertOrganization(organizationId);
      return db
        .prepare("SELECT key, value, is_secret, updated_at FROM mk_settings WHERE organization_id = ? ORDER BY key")
        .all(organizationId)
        .map((r) => ({ key: r.key, value: r.is_secret ? MASK : r.value, secret: r.is_secret === 1, updated_at: r.updated_at }));
    },
    remove(organizationId, key) {
      assertOrganization(organizationId);
      assertKey(key);
      return db.prepare("DELETE FROM mk_settings WHERE organization_id = ? AND key = ?").run(organizationId, key).changes > 0;
    },
  };
}

module.exports = { createSettings };
