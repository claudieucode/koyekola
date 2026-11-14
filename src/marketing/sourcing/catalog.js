// Catalogue du Sourcing produit (Product Hunter Nakewenze) côté serveur : lecture des données (fichier persistant, sinon instantané livré), calcul du
// verdict GO par pays avec les critères STRICTS de l'application (même formule que src/marketing/sourcing/app.html : analyse()), et fiche PUBLIQUE d'un
// produit pour le widget « Produits GO ». Une fiche publique ne contient jamais le coût, la marge, le ratio, les liens fournisseurs ni les pubs concurrentes.
const fs = require("fs");
const os = require("os");
const path = require("path");

const APP_DIR = __dirname;
const dataDir = () => process.env.NAKEWENZE_DATA_DIR || path.join(os.homedir(), "nakewenze-data");
const files = () => [path.join(dataDir(), "products.json"), path.join(APP_DIR, "products.json")];

// Pays de l'application (mêmes valeurs que COUNTRIES dans app.html)
const COUNTRIES = {
  US: { n: "États-Unis", f: "🇺🇸", cur: "USD", loc: "en-US", vat: 0 },
  CA: { n: "Canada", f: "🇨🇦", cur: "CAD", loc: "en-CA", vat: 0 },
  GB: { n: "Royaume-Uni", f: "🇬🇧", cur: "GBP", loc: "en-GB", vat: 0.2 },
  AU: { n: "Australie", f: "🇦🇺", cur: "AUD", loc: "en-AU", vat: 0.1 },
  FR: { n: "France", f: "🇫🇷", cur: "EUR", loc: "fr-FR", vat: 0.2 },
  BE: { n: "Belgique", f: "🇧🇪", cur: "EUR", loc: "fr-BE", vat: 0.21 },
  CH: { n: "Suisse", f: "🇨🇭", cur: "CHF", loc: "fr-CH", vat: 0.081 },
  DE: { n: "Allemagne", f: "🇩🇪", cur: "EUR", loc: "de-DE", vat: 0.19 },
  NL: { n: "Pays-Bas", f: "🇳🇱", cur: "EUR", loc: "nl-NL", vat: 0.21 },
  ES: { n: "Espagne", f: "🇪🇸", cur: "EUR", loc: "es-ES", vat: 0.21 },
  IT: { n: "Italie", f: "🇮🇹", cur: "EUR", loc: "it-IT", vat: 0.22 },
};
const FX0 = { USD: 1, CAD: 1.42563, GBP: 0.755149, AUD: 1.468309, EUR: 0.903491, CHF: 0.83437 };
// Critères stricts par défaut de l'application (STRICT dans app.html)
const STRICT = { mult: 3, cpa: 65, go: 7, test: 5.5, sat: 4, pmin: 0, pmax: 200, ship: 4, fx: 1.1, strict3: true, noBulky: true, noHealth: true, onlyNow: true, vogue: true };
const STEPS = [["wow", 0.15], ["market", 0.1], ["trend", 0.1], ["amazon", 0.1], ["marge", 0.25], ["meta", 0.15], ["launch", 0.15]];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (x, x0, x1, y0, y1) => y0 + ((clamp(x, x0, x1) - x0) * (y1 - y0)) / (x1 - x0);
const CDN = "https://ae-pic-a1.aliexpress-media.com/kf/";
const FILE = /^[A-Za-z0-9_-]{6,80}\.(?:jpe?g|png|webp|avif)$/;

// Lecture avec cache (date et taille du fichier) : le widget interroge le catalogue à chaque enregistrement et à chaque affichage
let cache = { key: "", data: null };
function load() {
  for (const f of files()) {
    let st;
    try { st = fs.statSync(f); } catch { continue; }
    const key = `${f}:${st.mtimeMs}:${st.size}`;
    if (cache.key === key) return cache.data;
    try {
      const data = JSON.parse(fs.readFileSync(f, "utf8"));
      if (data && Array.isArray(data.products)) { cache = { key, data }; return data; }
    } catch { /* fichier illisible (écriture en cours) : source suivante */ }
  }
  return { products: [] };
}

const metaOf = (p, k) => (p.mk && p.mk[k]) || (k === "US" && p.auto && p.auto.meta) || null;
const inVogue = (p, k) => { const m = metaOf(p, k); return Boolean(m && m.ads >= 3 && m.old30 >= 1); };

// Verdict d'un produit pour un pays, critères stricts (portage fidèle de analyse() : mêmes notes, mêmes poids, mêmes filtres bloquants)
function verdictFor(p, k, fxr) {
  const c0 = COUNTRIES[k], s = STRICT;
  const K = fxr[c0.cur] || FX0[c0.cur] || 1, VAT = c0.vat;
  const fx = (p.cur === "EUR" ? s.fx : 1) * K, shipAdd = p.shipIncl ? 0 : s.ship * K;
  const cost = ((p.cLo * fx + shipAdd) + (p.cHi * fx + shipAdd)) / 2, price = (p.pLo * fx + p.pHi * fx) / 2; // même ordre d'opérations que l'application (un ratio de 3,0 exact reste à 3,0)
  const priceNet = price / (1 + VAT), priceUsd = price / K;
  const fees = price * 0.03 + 0.3 * K, mult = priceNet / cost, gross = priceNet - cost - fees, profit = gross - (gross * s.cpa) / 100;
  const flag = String(p.flag || ""), late = /Trop tard/.test(flag), bundle = /Bundle/.test(flag);
  const marge = mult >= 4 ? lerp(mult, 4, 5, 9, 10) : mult >= 3 ? lerp(mult, 3, 4, 7, 8) : mult >= 2.5 ? lerp(mult, 2.5, 3, 4, 6) : lerp(mult, 1.5, 2.5, 0, 3);
  const trend = ({ nov: 9, q4: 8, dec: 7, all: 6, jan: 3 })[p.season] - (late ? 6 : 0);
  const priceOk = priceUsd >= 25 && priceUsd <= 80 ? 10 : priceUsd >= 20 && priceUsd <= 130 ? 7 : 4;
  const amazon = ({ 1: 6, 2: 7, 3: 6, 4: 4, 5: 2 })[p.sat] * 0.7 + priceOk * 0.3;
  const meta = ({ 1: 6, 2: 8, 3: 6, 4: 4, 5: 2 })[p.sat];
  let launch = 9;
  if (p.bulky) launch -= 3;
  if (p.health) launch -= 2.5;
  if (bundle) launch -= 3;
  if (/retours/.test(flag)) launch -= 2;
  if (/qualité/.test(flag)) launch -= 1.5;
  if (late) launch -= 8;
  if (p.d < 4) launch -= 1;
  launch = clamp(launch, 0, 10);
  const wow = clamp(((p.d * 0.6 + p.p * 0.4) - 1) / 4 * 10, 0, 10);
  const notes = { wow, market: 6, trend, amazon, marge, meta, launch };
  const score = clamp(STEPS.reduce((a, [key, w]) => a + notes[key] * w, 0), 0, 10);
  const blocking = mult < s.mult || profit <= 0 || late;
  let verdict = score >= s.go ? "GO" : score >= s.test ? "TEST" : "NO";
  if (blocking && verdict === "GO") verdict = "TEST";
  if (late || profit <= 0) verdict = "NO";
  const pass = !(priceUsd < s.pmin || priceUsd > s.pmax || (s.vogue && !inVogue(p, k)) || p.sat > s.sat || (s.strict3 && mult < s.mult)
    || (s.noBulky && p.bulky) || (s.noHealth && p.health) || (s.onlyNow && (p.season === "jan" || late)));
  return { go: pass && verdict === "GO", score, price };
}

const valid = (p) => p && typeof p.id === "string" && /^p\d{3,5}$/.test(p.id) && [p.cLo, p.cHi, p.pLo, p.pHi].every(Number.isFinite);

// Pays où chaque produit est GO : { id: ["US", "CA", …] } (calcul mis en cache avec les données)
let goCache = { data: null, map: null };
function goMap() {
  const data = load();
  if (goCache.data === data) return goCache.map;
  const fxr = { ...FX0, ...(data.fx || {}) }, map = {};
  for (const p of data.products) if (valid(p)) map[p.id] = Object.keys(COUNTRIES).filter((k) => verdictFor(p, k, fxr).go);
  goCache = { data, map };
  return map;
}

// Choix proposés dans l'éditeur : les produits GO d'abord (avec les drapeaux des pays où ils le sont), puis les autres (pour qu'un produit sorti
// de la liste GO reste sélectionné sur les pages existantes au lieu d'être effacé en silence).
function productOptions() {
  const data = load(), map = goMap();
  const list = data.products.filter(valid);
  const go = list.filter((p) => map[p.id].length).sort((a, b) => map[b.id].length - map[a.id].length || String(a.name).localeCompare(String(b.name), "fr"));
  const rest = list.filter((p) => !map[p.id].length).sort((a, b) => String(a.name).localeCompare(String(b.name), "fr"));
  return [["", "— Choisir un produit GO —"],
    ...go.map((p) => [p.id, `GO ${map[p.id].map((k) => COUNTRIES[k].f).join("")} · ${String(p.name).slice(0, 70)}`]),
    ...rest.map((p) => [p.id, `Hors GO · ${String(p.name).slice(0, 70)}`])];
}

const money = (v, k, round) => {
  const c = COUNTRIES[k];
  const n = round ? Math.max(0.99, Math.ceil(v) - 0.01) : v;
  return new Intl.NumberFormat(c.loc, { style: "currency", currency: c.cur, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};
const imgs = (p) => {
  const gal = (Array.isArray(p.gal) ? p.gal : []).filter((f) => FILE.test(String(f)));
  const hd = p.ali && typeof p.ali.hd === "string" && /^https:\/\/ae-pic-[a-z0-9-]+\.aliexpress-media\.com\/kf\/[A-Za-z0-9_.-]+$/.test(p.ali.hd) ? p.ali.hd : "";
  const files = gal.length ? gal : [];
  const main = files.length ? `${CDN}${files[0]}_960x960q90.jpg` : hd ? `${hd}_960x960q90.jpg` : "";
  return { main, gallery: files.slice(0, 8).map((f) => ({ src: `${CDN}${f}_960x960q90.jpg`, thumb: `${CDN}${f}_220x220q80.jpg` })) };
};

// Fiche PUBLIQUE d'un produit pour un pays : uniquement ce qui peut s'afficher sur un site (nom, textes de vente, photos, prix de vente conseillé)
function publicProduct(id, k, round = true) {
  const data = load(), p = data.products.find((x) => valid(x) && x.id === id);
  if (!p || !COUNTRIES[k]) return null;
  const fxr = { ...FX0, ...(data.fx || {}) }, v = verdictFor(p, k, fxr), ad = p.ad && typeof p.ad === "object" ? p.ad : {};
  const str = (x, n) => (typeof x === "string" ? x.slice(0, n) : "");
  const im = imgs(p);
  return {
    id: p.id, nameFr: str(p.name, 120), nameEn: str(p.en, 120), category: str(p.cat, 40),
    promise: str(ad.promise, 240), pain: str(ad.pain, 240),
    price: money(v.price, k, round), go: v.go, goCountries: goMap()[p.id] || [], image: im.main, gallery: im.gallery,
  };
}

module.exports = { COUNTRIES, STRICT, load, goMap, productOptions, publicProduct, verdictFor };
