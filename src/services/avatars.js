// KOLAKISA — avatars des commentaires. Choix du réglage « Avatar par défaut » (Paramètres → Commentaires), propre à chaque site.
//  • LOCAUX (aucune donnée ne quitte le serveur) : personne mystère, vide, identicon, initiales, couleur — dessinés en SVG à partir d'une EMPREINTE non réversible (HMAC) ;
//    l'adresse e-mail n'apparaît jamais dans une adresse d'image ni dans une page.
//  • EXTERNES (Gravatar : logo, wavatar, monsterid, rétro, robohash) : uniquement si le site a explicitement accepté d'envoyer l'empreinte (SHA-256) de l'e-mail à gravatar.com.
//    L'image passe par le serveur (/avatar/g/<n° de commentaire>) : le navigateur du visiteur ne contacte jamais Gravatar et ne voit jamais l'empreinte. Le classement maximal
//    (G, PG, R, X) est transmis à Gravatar, seul à connaître la classification d'une image ; les avatars locaux sont tous « G ».
//  • Un compte qui a téléversé sa photo l'affiche (c'est un choix de la personne), sauf si les avatars sont désactivés.
const crypto = require("crypto");
const secret = () => process.env.SESSION_SECRET || "kolakisa-avatars";
const LOCAL = ["mystery", "blank", "identicon", "initials", "color"];
const EXTERNAL = ["gravatar", "wavatar", "monsterid", "retro", "robohash"];
const LABELS = { mystery: "Personne mystère", blank: "Vide", gravatar: "Logo Gravatar", identicon: "Identicon (généré)", wavatar: "Wavatar (généré)", monsterid: "MonsterID (généré)", retro: "Rétro (généré)", robohash: "RoboHash (généré)", initials: "Initiales (généré)", color: "Couleur (générée)" };
const seedOf = (identity) => crypto.createHmac("sha256", secret()).update(String(identity || "").trim().toLowerCase()).digest("hex").slice(0, 24);
const initialsOf = (name) => { const w = String(name || "").trim().split(/\s+/).filter(Boolean); const l = (x) => Array.from(x)[0] || ""; return (w.length > 1 ? l(w[0]) + l(w[w.length - 1]) : Array.from(w[0] || "?").slice(0, 2).join("")).toUpperCase().replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2) || "?"; };
const hue = (seed) => parseInt(seed.slice(0, 4), 16) % 360;

function svg(type, seed, initials = "?", size = 96) {
  const h = hue(seed), bg = `hsl(${h} 48% 42%)`, head = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="${size}" height="${size}" role="img" aria-hidden="true">${inner}</svg>`;
  if (type === "blank") return head("");
  if (type === "color") return head(`<rect width="96" height="96" fill="${bg}"/>`);
  if (type === "initials") return head(`<rect width="96" height="96" fill="${bg}"/><text x="48" y="48" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="${initials.length > 1 ? 38 : 46}" font-weight="600" fill="#fff">${initials.replace(/[<>&"']/g, "")}</text>`);
  if (type === "identicon") { // grille 5×5 symétrique tirée de l'empreinte
    const bits = Buffer.from(seed.padEnd(32, "0"), "hex"); let cells = "";
    for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) if ((bits[y * 3 + x] & 1) === 1) { const px = 8 + x * 16 + 0, mx = 8 + (4 - x) * 16; cells += `<rect x="${px}" y="${8 + y * 16}" width="16" height="16"/>` + (x < 2 ? `<rect x="${mx}" y="${8 + y * 16}" width="16" height="16"/>` : ""); }
    return head(`<rect width="96" height="96" fill="hsl(${h} 30% 94%)"/><g fill="hsl(${h} 55% 40%)">${cells}</g>`);
  }
  return head(`<rect width="96" height="96" fill="#dde3ea"/><circle cx="48" cy="38" r="17" fill="#fff"/><path d="M14 96c2-22 16-34 34-34s32 12 34 34z" fill="#fff"/>`); // mystery
}

// URL de l'avatar d'un commentaire (ligne issue de thread()), ou null : avatars désactivés
function forComment(row, cfg) {
  if (!cfg.show_avatars) return null;
  if (row.avatar_path) return row.avatar_path;
  const email = String(row.user_id ? row.user_email : row.author_email || "").trim().toLowerCase();
  const name = row.name || row.author_name || row.username || "";
  const seed = seedOf(email || `${row.id}:${name}`);
  let type = cfg.avatar_default;
  if (EXTERNAL.includes(type) && (!cfg.avatar_external || !email)) type = "mystery"; // jamais d'envoi externe sans accord ni sans adresse
  if (EXTERNAL.includes(type)) return `/avatar/g/${row.id}.png`;
  return `/avatar/l/${type}/${seed}.svg${type === "initials" ? `?i=${encodeURIComponent(initialsOf(name))}` : ""}`;
}

// Gravatar : image demandée côté serveur (hôte fixe, délai court, taille bornée), gardée 24 h en mémoire (bornée) ; jamais d'erreur visible
const cache = new Map(); const TTL = 24 * 3600 * 1000, MAX_ENTRIES = 300, MAX_BYTES = 80 * 1024;
async function gravatar(email, type, rating) {
  const hash = crypto.createHash("sha256").update(String(email).trim().toLowerCase()).digest("hex");
  const key = `${hash}:${type}:${rating}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit;
  const d = type === "gravatar" ? "" : `&d=${type}`;
  const res = await fetch(`https://www.gravatar.com/avatar/${hash}?s=96&r=${String(rating).toLowerCase()}${d}`, { signal: AbortSignal.timeout(4000), redirect: "error", headers: { "User-Agent": "KOLAKISA-avatar" } });
  const type2 = res.headers.get("content-type") || "";
  if (!res.ok || !/^image\/(png|jpeg|gif|webp)$/.test(type2.split(";")[0])) throw new Error("avatar indisponible");
  const body = Buffer.from(await res.arrayBuffer());
  if (body.length > MAX_BYTES) throw new Error("avatar trop lourd");
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value);
  const entry = { at: Date.now(), type: type2.split(";")[0], body };
  cache.set(key, entry);
  return entry;
}
module.exports = { LOCAL, EXTERNAL, LABELS, seedOf, initialsOf, svg, forComment, gravatar };
