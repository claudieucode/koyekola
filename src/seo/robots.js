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

function text(req) {
  // Environnement non public (développement, adresse locale) : tout est interdit, aucun plan du site n'est annoncé
  if (!require("../middlewares/siteHost").indexingAllowed(req)) return "User-agent: *\nDisallow: /\n";
  const custom = settings.get("robots_custom") || "";
  const lines = ["User-agent: *", ...PRIVATE.map((p) => `Disallow: ${p}`), ""];
  if (custom) lines.push(custom, "");
  lines.push(`Sitemap: ${absoluteUrl(req, "/sitemap.xml")}`, "");
  return lines.join("\n");
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
function conflicts(req, paths) {
  const rules = text(req).split("\n").filter((l) => !/^sitemap:/i.test(l)).join("\n");
  return paths.filter((p) => !allowed(rules, "Googlebot", p));
}

module.exports = { text, check, parse, allowed, conflicts, PRIVATE };
