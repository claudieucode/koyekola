// robots.txt : règles du site (espaces privés toujours interdits) + règles supplémentaires saisies dans les Réglages.
// Vérification de la syntaxe à l'enregistrement, et détection des conflits : une adresse du plan du site que robots.txt
// interdit à Google (selon la règle de Google : la règle la plus longue l'emporte, « Allow » gagne à égalité).
const settings = require("./settings");
const { absoluteUrl } = require("../utils/seo");

const PRIVATE = ["/formateur", "/mes-cours", "/panier", "/commande", "/apprendre", "/certificat", "/favoris", "/connexion", "/inscription", "/uploads/videos", "/uploads/resources", "/marketing", "/u/", "/preferences/", "/t/", "/webhooks/"];
const DIRECTIVES = { "user-agent": "User-agent", allow: "Allow", disallow: "Disallow", "crawl-delay": "Crawl-delay" };

// Analyse le texte : groupes { agents: [], rules: [{ type, path }] } + problèmes
function parse(text) {
  const groups = [];
  const problems = [];
  let current = null;
  let lastWasAgent = false;
  String(text || "").split("\n").forEach((raw, i) => {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) return;
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) { problems.push({ level: "error", message: `Ligne ${i + 1} : « ${line.slice(0, 40)} » n'est pas une règle (format attendu : Directive: valeur).` }); return; }
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === "sitemap") { problems.push({ level: "error", message: `Ligne ${i + 1} : la ligne Sitemap est ajoutée automatiquement, ne la saisissez pas.` }); return; }
    if (!DIRECTIVES[key]) { problems.push({ level: "error", message: `Ligne ${i + 1} : directive « ${m[1]} » inconnue (User-agent, Allow, Disallow, Crawl-delay).` }); return; }
    if (key === "user-agent") {
      if (!value) { problems.push({ level: "error", message: `Ligne ${i + 1} : User-agent sans nom de robot.` }); return; }
      if (!current || !lastWasAgent) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(value);
      lastWasAgent = true;
      return;
    }
    lastWasAgent = false;
    if (!current) { problems.push({ level: "error", message: `Ligne ${i + 1} : « ${m[1]} » doit suivre une ligne User-agent.` }); return; }
    if (key === "crawl-delay") { if (!/^\d{1,3}(\.\d+)?$/.test(value)) problems.push({ level: "error", message: `Ligne ${i + 1} : Crawl-delay attend un nombre de secondes.` }); else { current.rules.push({ type: "crawl-delay", path: value }); problems.push({ level: "info", message: "Crawl-delay est ignoré par Google (respecté par d'autres robots)." }); } return; }
    if (value && !value.startsWith("/") && !value.startsWith("*")) { problems.push({ level: "error", message: `Ligne ${i + 1} : un chemin doit commencer par / (ou *).` }); return; }
    current.rules.push({ type: key, path: value });
  });
  return { groups, problems };
}

// Problèmes des règles supplémentaires (erreurs bloquantes + avertissements)
function check(custom) {
  const { groups, problems } = parse(custom);
  for (const g of groups) {
    if (g.agents.includes("*") && g.rules.some((r) => r.type === "disallow" && r.path === "/")) problems.push({ level: "warning", message: "« User-agent: * » + « Disallow: / » interdit TOUT le site à tous les moteurs de recherche." });
    if (g.agents.some((a) => /^googlebot$/i.test(a)) && g.rules.some((r) => r.type === "disallow" && r.path === "/")) problems.push({ level: "warning", message: "Google est interdit sur tout le site." });
  }
  return problems;
}

// opts.siteId : fichier d'UN site (aperçu de l'administration, site vérifié par l'appelant) ; opts.preview : ignore la politique d'hôte (développement / adresse locale)
// pour montrer le fichier tel qu'il serait servi sur le domaine public ; opts.base : adresse publique du site (sinon celle de la requête)
function text(req, opts = {}) {
  // Environnement non public (développement, adresse locale) : tout est interdit, aucun plan du site n'est annoncé
  if (!opts.preview && !require("../middlewares/siteHost").indexingAllowed(req)) return "User-agent: *\nDisallow: /\n";
  const custom = (Number.isInteger(opts.siteId) ? settings.allFor(opts.siteId) : settings.forRequest(req)).robots_custom || ""; // R8 lot 6 : les règles supplémentaires du domaine d'un site sont les SIENNES (vides par défaut), jamais celles du site principal
  const lines = ["User-agent: *", ...PRIVATE.map((p) => `Disallow: ${p}`), ""];
  if (custom) lines.push(custom, "");
  lines.push(`Sitemap: ${opts.base ? `${opts.base.replace(/\/+$/, "")}/sitemap.xml` : absoluteUrl(req, "/sitemap.xml")}`, "");
  return lines.join("\n");
}

// Avertissements sur des règles saisies (en plus de check) : blocage large, ressources nécessaires au rendu, contradictions Allow/Disallow
function warnings(custom) {
  const { groups } = parse(custom);
  const out = [];
  const RENDER = ["/uploads", "/css", "/js", "/img", "/fonts", "/assets", "/static"];
  for (const g of groups) {
    const all = g.agents.includes("*") || g.agents.some((a) => /^(googlebot|bingbot)$/i.test(a));
    for (const r of g.rules) {
      if (r.type !== "disallow" || !r.path) continue;
      if (all && RENDER.some((x) => r.path === x || r.path === `${x}/` || r.path.startsWith(`${x}/`) || (r.path.startsWith("/*") && /\.(css|js)\b/.test(r.path)))) out.push({ level: "warning", message: `« Disallow: ${r.path} » peut empêcher Google de charger des fichiers nécessaires à l'affichage des pages (styles, scripts, images).` });
      if (all && r.path !== "/" && (r.path === "/*" || r.path === "/p" || r.path === "/p/" || r.path === "/blog" || r.path === "/blog/")) out.push({ level: "warning", message: `« Disallow: ${r.path} » bloque un grand nombre de pages publiques de ce site.` });
    }
    const allows = g.rules.filter((r) => r.type === "allow" && r.path);
    for (const r of g.rules) if (r.type === "disallow" && r.path && allows.some((a) => a.path === r.path)) out.push({ level: "warning", message: `Règles contradictoires : « Allow: ${r.path} » et « Disallow: ${r.path} » (Google applique Allow).` });
  }
  out.push({ level: "info", message: "robots.txt n'est pas un moyen de rendre une page privée : une page bloquée peut quand même être connue des moteurs. Protégez un contenu privé par une connexion." });
  return out;
}

// Règle Google : la règle la plus spécifique (longue) l'emporte ; à égalité, Allow
function toRegex(path) {
  const anchored = path.endsWith("$");
  const body = (anchored ? path.slice(0, -1) : path).replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
}
function allowed(rulesText, agent, path) {
  const { groups } = parse(rulesText);
  const own = groups.filter((g) => g.agents.some((a) => a.toLowerCase() === agent.toLowerCase()));
  const chosen = own.length ? own : groups.filter((g) => g.agents.includes("*"));
  let best = null;
  for (const g of chosen) for (const r of g.rules) {
    if ((r.type !== "allow" && r.type !== "disallow") || !r.path) continue;
    if (!toRegex(r.path).test(path)) continue;
    if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.type === "allow")) best = r;
  }
  return !best || best.type === "allow";
}

// Adresses du plan du site interdites à Googlebot par robots.txt
function conflicts(req, paths, opts = {}) {
  const rules = text(req, opts).split("\n").filter((l) => !/^sitemap:/i.test(l)).join("\n");
  return paths.filter((p) => !allowed(rules, "Googlebot", p));
}

module.exports = { text, check, warnings, parse, allowed, conflicts, PRIVATE };
