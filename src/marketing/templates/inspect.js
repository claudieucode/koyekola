// Analyse du HTML réellement produit (aperçu de l'éditeur) : liens, taille, balises de fusion, préheader.
// Tout est calculé à partir du rendu du moteur commun (le même que pour le test et l'envoi), jamais d'estimation.
const { Parser } = require("htmlparser2");
const { SAMPLE_URLS } = require("./context");
const { HEAVY_BYTES } = require("./lint");

// Gmail tronque l'affichage d'un message au-delà d'environ 102 Ko de HTML (limite propre à Gmail)
const GMAIL_CLIP_BYTES = 102 * 1024;
const PLACEHOLDER_HOSTS = /(^|\.)(exemple\.(fr|com|org)|example\.(com|org|net)|exemple\.invalid|test\.invalid)$/i;

// Liens : chaque <a> du message, classé ok / avertissement / erreur, avec la raison
function analyzeLinks(html) {
  const links = [];
  const system = new Set(Object.values(SAMPLE_URLS));
  let current = null;
  const parser = new Parser({
    onopentag(name, attrs) { if (name === "a") current = { href: Object.hasOwn(attrs, "href") ? attrs.href : null, text: "" }; },
    ontext(t) { if (current) current.text += t; },
    onclosetag(name) { if (name === "a" && current) { links.push(current); current = null; } },
  }, { decodeEntities: true });
  parser.write(String(html || "")); parser.end();
  return links.map((l) => {
    const text = l.text.replace(/\s+/g, " ").trim().slice(0, 80) || "(sans texte)";
    const href = l.href == null ? null : l.href.trim();
    const out = (status, reason) => ({ href, text, status, reason });
    if (href === null) return out("error", "Lien sans adresse (href absent).");
    if (href === "") return out("error", "Adresse vide.");
    if (system.has(href)) return out("ok", "Lien système (remplacé à l'envoi par l'adresse personnelle du destinataire).");
    if (/^(javascript|data|vbscript):/i.test(href)) return out("error", "Adresse dangereuse (bloquée par les messageries).");
    if (href.startsWith("#")) return out("warning", "Ancre interne : ne fonctionne pas dans la plupart des messageries.");
    if (/^mailto:/i.test(href)) return /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+/i.test(href) ? out("ok", "Adresse e-mail.") : out("error", "Adresse e-mail invalide.");
    if (/^tel:/i.test(href)) return /^tel:\+?[\d\s().-]{4,}$/i.test(href) ? out("ok", "Numéro de téléphone.") : out("error", "Numéro de téléphone invalide.");
    let url;
    try { url = new URL(href); } catch { return out("error", "Adresse invalide (format incorrect)."); }
    if (url.protocol === "http:") return /^(localhost|127\.0\.0\.1)$/.test(url.hostname) ? out("warning", "Adresse locale (développement) : invisible pour les destinataires.") : out("warning", "Adresse non sécurisée (http) : préférez https.");
    if (url.protocol !== "https:") return out("error", `Protocole non pris en charge (${url.protocol}).`);
    if (!url.hostname.includes(".")) return out("error", "Nom de domaine invalide.");
    if (PLACEHOLDER_HOSTS.test(url.hostname)) return out("warning", "Adresse d'exemple à remplacer par la vraie destination.");
    return out("ok", "Adresse sécurisée.");
  });
}

function sizeInfo(html) {
  const bytes = Buffer.byteLength(String(html || ""), "utf8");
  // Seuils : au-delà de HEAVY_BYTES (avertissement déjà utilisé par la vérification), proche de la coupure de Gmail
  const level = bytes >= HEAVY_BYTES ? "high" : bytes >= HEAVY_BYTES / 2 ? "moderate" : "low";
  return { bytes, kb: Math.round((bytes / 1024) * 10) / 10, limitKb: GMAIL_CLIP_BYTES / 1024, level };
}

// Valeur d'une balise de fusion dans les données utilisées pour l'aperçu (exemple ou vrai contact)
function valueAt(data, path) {
  let v = data;
  for (const k of path.split(".")) { if (v == null || typeof v !== "object" || !Object.hasOwn(v, k)) return undefined; v = v[k]; }
  return v;
}
// Liens personnels du destinataire (désinscription, préférences, version web) : ajoutés par le système à l'envoi
const SYSTEM_TAGS = ["unsubscribe_url", "preferences_url", "view_url"];
function mergeTags(variables, data) {
  return (variables || []).slice().sort().map((path) => {
    if (SYSTEM_TAGS.includes(path)) return { path, value: "Lien personnel ajouté à l'envoi", empty: false, system: true };
    const v = valueAt(data, path);
    const value = v == null || v === "" ? "" : String(v);
    return { path, value: value.slice(0, 200), empty: value === "" };
  });
}

// Préheader réellement affiché : texte du bloc caché en tête du message (sans le remplissage invisible)
function preheaderOf(html) {
  const m = /<body[^>]*>\s*<div style="display:none;[^"]*">([\s\S]*?)(?:&zwnj;&nbsp;)+<\/div>/.exec(String(html || ""));
  if (!m) return "";
  let text = "";
  const p = new Parser({ ontext(t) { text += t; } }, { decodeEntities: true });
  p.write(m[1]); p.end();
  return text.replace(/\s+/g, " ").trim();
}

module.exports = { analyzeLinks, sizeInfo, mergeTags, preheaderOf, GMAIL_CLIP_BYTES };
