// Bunny Stream : vidéos protégées par lien signé à durée limitée.
//
// Le formateur envoie ses vidéos sur Bunny Stream et colle leur identifiant dans KOLAKISA. Le site fabrique,
// pour chaque affichage autorisé, une adresse de lecture valable quelques heures. Sans ce jeton, la
// vidéo est illisible : quelqu'un qui copie l'adresse de la page ne peut pas la revoir plus tard.
//
// Algorithme (documentation Bunny « Embed view token authentication ») :
//   jeton = SHA256_HEX( clé_secrète + identifiant_vidéo + expiration_en_secondes_unix )
//   adresse = https://iframe.mediadelivery.net/embed/{bibliothèque}/{vidéo}?token={jeton}&expires={expiration}
//
// Configuration (variables d'environnement, jamais dans le code) :
//   BUNNY_LIBRARY_ID : numéro de la bibliothèque vidéo
//   BUNNY_TOKEN_KEY  : clé de « Embed View Token Authentication » de cette bibliothèque (à garder secrète)
//   BUNNY_TOKEN_TTL_HOURS : durée de validité des liens (6 par défaut)
const crypto = require("crypto");

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isBunnyId(value) {
  return typeof value === "string" && GUID.test(value);
}

function bunnyToken(key, videoId, expires) {
  return crypto.createHash("sha256").update(`${key}${videoId}${expires}`).digest("hex");
}

function bunnyEmbedUrl({ libraryId, videoId, key, ttlSeconds = 6 * 3600, now = Math.floor(Date.now() / 1000) }) {
  const expires = now + ttlSeconds;
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${bunnyToken(key, videoId, expires)}&expires=${expires}`;
}

function isBunnyConfigured(env = process.env) {
  return Boolean(env.BUNNY_LIBRARY_ID && /^\d{1,12}$/.test(env.BUNNY_LIBRARY_ID) && env.BUNNY_TOKEN_KEY);
}

// Adresse signée pour l'identifiant donné, ou null si Bunny n'est pas configuré / identifiant invalide.
// À n'appeler QUE pour un visiteur autorisé à voir la vidéo.
function signedBunnyUrl(videoId, env = process.env) {
  if (!isBunnyId(videoId) || !isBunnyConfigured(env)) return null;
  const hours = Number(env.BUNNY_TOKEN_TTL_HOURS) > 0 ? Number(env.BUNNY_TOKEN_TTL_HOURS) : 6;
  return bunnyEmbedUrl({ libraryId: env.BUNNY_LIBRARY_ID, videoId: videoId.toLowerCase(), key: env.BUNNY_TOKEN_KEY, ttlSeconds: Math.round(hours * 3600) });
}

module.exports = { isBunnyId, bunnyToken, bunnyEmbedUrl, isBunnyConfigured, signedBunnyUrl };
