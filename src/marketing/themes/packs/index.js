// Paquets de thèmes (Apparence → Thèmes) : chaque thème est un dossier AUTONOME — son CSS, son script d'animation facultatif, ses jetons, ses options et ses pages.
//   packs/<clé>/pack.js    fiche : identité, jetons, options de personnalisation, pages de démonstration (fonctions qui produisent des sections du Page Builder)
//   packs/<clé>/style.css  feuille de styles du thème, ENTIÈREMENT confinée à  body[data-kw-pack="<clé>"]  (aucune fuite vers un autre thème, aucun style du CMS)
//   packs/<clé>/motion.js  animations facultatives (une petite fonction, aucune dépendance), chargées uniquement quand ce thème est actif
// Le CMS ne fournit que les données et les blocs ; il n'impose aucune couleur, police ni composant au site public (landing.css est la seule base, neutre, et le thème la surcharge).
// Un thème n'est jamais exécuté côté serveur au-delà de sa fiche : le CSS et le JS sont servis comme fichiers statiques par /theme-packs/<clé>/.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const KEY = /^[a-z][a-z0-9-]{1,39}$/;
const OPT_VALUE = /^[#a-z0-9 .%,()-]{0,40}$/i;
const HEX = /^#[0-9a-f]{6}$/i;
const DIR = process.env.KOLAKISA_THEME_PACKS_DIR ? path.resolve(process.env.KOLAKISA_THEME_PACKS_DIR) : __dirname;

let cache = null;
const BASE = (() => { try { return fs.readFileSync(path.join(__dirname, "base.css"), "utf8"); } catch { return ""; } })();
const readOpt = (file) => { try { return fs.readFileSync(file, "utf8"); } catch { return ""; } };

function load() {
  if (cache) return cache;
  const packs = new Map(), problems = [];
  for (const entry of fs.readdirSync(DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || !KEY.test(entry.name)) continue;
    const dir = path.join(DIR, entry.name);
    try {
      const spec = require(path.join(dir, "pack.js"));
      if (spec.key !== entry.name) throw new Error("la clé doit être le nom du dossier");
      const css = readOpt(path.join(dir, "style.css")), js = readOpt(path.join(dir, "motion.js"));
      if (!css.trim()) throw new Error("style.css manquant ou vide");
      // Isolation par construction : toute règle du thème est préfixée par body[data-kw-pack="<clé>"] au chargement ; html, :root, @import et les noms d'animation non préfixés sont refusés
      // Frontière de pied : la feuille SERVIE du thème ne peut jamais atteindre un pied indépendant (exclusion à spécificité 0)
      const scoped = scopeCss(BASE + "\n" + css, spec.key);
      const served = require("../../pages/footerFrontier").excludeFooter(scoped); // feuille réellement servie (css = feuille confinée du thème, telle qu'écrite : c'est elle qu'on audite)
      const version = String(spec.version || "1.0.0");
      const hash = crypto.createHash("sha1").update(served).update(js).digest("hex").slice(0, 10);
      addStandardOptions(spec, css, js);
      packs.set(spec.key, { spec, css: scoped, served, js, hash, version });
    } catch (e) { problems.push({ key: entry.name, message: String(e.message).slice(0, 300) }); }
  }
  cache = { packs, problems };
  return cache;
}
// Contrat de personnalisation (moteur partagé) : tout thème qui anime quelque chose (CSS animé, transitions ou script) reçoit le réglage « Animations », branché sur base.css
// (data-pk-motion = on | calm | off). Un thème qui déclare déjà une option « motion » garde la sienne. Idempotent.
const ANIMATES = (css, js) => Boolean(js) || /@keyframes|animation\s*:|animation-name|transition\s*:/.test(css);
const MOTION_OPTION = Object.freeze({ key: "motion", label: "Animations du thème", type: "choice", default: "on", choices: [["on", "Toutes les animations"], ["calm", "Calmes : sans mouvement continu, transitions conservées"], ["off", "Aucune animation"]] });
function addStandardOptions(spec, css, js) {
  if (!ANIMATES(css, js)) return;
  spec.options = spec.options || [];
  if (!spec.options.some((o) => o.key === "motion")) spec.options.push({ ...MOTION_OPTION, choices: MOTION_OPTION.choices.map((c) => [...c]) });
}
const reload = () => { cache = null; return load(); };

// Préfixe chaque sélecteur par la portée du thème. « body » ou « & » désignent la portée elle-même. Lève une erreur sur html, :root, @import, @charset et sur les @keyframes / @font-face
// dont le nom n'est pas préfixé par la clé du thème (ces noms sont globaux dans la page : sans préfixe, deux thèmes pourraient se heurter).
function scopeCss(css, key) {
  const scope = `body[data-kw-pack="${key}"]`;
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const short = key.split("-")[0];
  const blockEnd = (from) => { let depth = 1, j = from; while (j < src.length && depth) { if (src[j] === "{") depth++; else if (src[j] === "}") depth--; j++; } if (depth) throw new Error("style.css : accolade non fermée"); return j; };
  const scopeSel = (sel) => {
    const s = sel.trim();
    if (!s) return "";
    if (/^(html|:root)\b/i.test(s) || /(^|[\s>+~,(])(html|:root)\b/i.test(s)) throw new Error(`style.css : sélecteur « ${s.slice(0, 40)} » interdit (html et :root appartiennent à la page)`);
    if (s === "body" || s === "&" || s === ":scope") return scope;
    if (/^(body|&|:scope)(?=[.:\[ >+~])/.test(s)) return scope + s.replace(/^(body|&|:scope)/, "");
    return `${scope} ${s}`;
  };
  const walk = (start, end) => {
    let i = start, out = "";
    while (i < end) {
      const open = src.indexOf("{", i);
      if (open < 0 || open >= end) { if (src.slice(i, end).trim()) throw new Error("style.css : texte hors règle"); break; }
      const head = src.slice(i, open).trim();
      const close = blockEnd(open + 1);
      if (head.startsWith("@")) {
        const kind = head.split(/[\s(]/)[0].toLowerCase();
        if (kind === "@media" || kind === "@supports" || kind === "@container") out += `${head}{${walk(open + 1, close - 1)}}`;
        else if (kind === "@keyframes") { const name = head.split(/\s+/)[1] || ""; if (!name.startsWith(`${short}-`)) throw new Error(`style.css : l'animation « ${name} » doit commencer par « ${short}- »`); out += `${head}{${src.slice(open + 1, close - 1)}}`; }
        else if (kind === "@font-face") { const fam = /font-family\s*:\s*["']?([^;"']+)/i.exec(src.slice(open, close)); if (!fam || !fam[1].trim().startsWith(`${short}-`)) throw new Error(`style.css : la famille @font-face doit commencer par « ${short}- »`); out += `${head}{${src.slice(open + 1, close - 1)}}`; }
        else throw new Error(`style.css : la règle ${kind} n'est pas admise`);
      } else {
        out += `${head.split(",").map(scopeSel).filter(Boolean).join(",")}{${src.slice(open + 1, close - 1)}}`;
      }
      i = close;
    }
    return out;
  };
  return walk(0, src.length);
}

const has = (key) => load().packs.has(String(key));
const get = (key) => load().packs.get(String(key)) || null;
const all = () => [...load().packs.values()].map((p) => p.spec);
const problems = () => load().problems;

// Options de personnalisation : valeurs validées par le schéma du thème (couleur, choix dans une liste, nombre borné) ; une valeur invalide reprend la valeur par défaut
function resolveOptions(spec, given = {}) {
  const out = {};
  for (const o of spec.options || []) {
    const raw = typeof given[o.key] === "string" ? given[o.key] : "";
    let v = o.default;
    if (o.type === "color" && HEX.test(raw)) v = raw.toLowerCase();
    else if (o.type === "choice" && (o.choices || []).some(([val]) => val === raw)) v = raw;
    else if (o.type === "range") { const n = Number(raw); if (Number.isFinite(n) && n >= o.min && n <= o.max) v = String(n); }
    if (OPT_VALUE.test(String(v))) out[o.key] = String(v);
  }
  return out;
}

// Balises du <head> et de <body> d'un site dont le thème actif est un paquet : { link, script, attr, vars } (chaînes HTML déjà sûres : clé validée, options validées par le schéma)
function headHtml(pack) {
  const empty = { link: "", script: "", attr: "", vars: "", cz: "" };
  if (!pack || !pack.key) return empty;
  const p = get(pack.key);
  if (!p) return empty;
  const opts = resolveOptions(p.spec, pack.options);
  const vars = Object.entries(opts).map(([k, v]) => `--pk-${k}:${v}`).join(";");
  const base = `/theme-packs/${p.spec.key}`;
  const extras = Object.entries(opts).filter(([, v]) => /^[a-z0-9-]+$/.test(v)).map(([k, v]) => ` data-pk-${k}="${v}"`).join("");
  return {
    link: `<link rel="stylesheet" href="${base}/style.css?v=${p.hash}" id="kw-pack-css">`,
    script: p.js ? `<script src="${base}/motion.js?v=${p.hash}" defer></script>` : "",
    attr: ` data-kw-pack="${p.spec.key}"${extras}`,
    vars: vars ? `${vars};` : "",
  };
}

module.exports = { load, reload, has, get, all, problems, resolveOptions, headHtml, scopeCss, KEY };
