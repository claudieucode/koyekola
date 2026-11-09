#!/usr/bin/env node
// MESURE EN VRAI CHROME des modèles du catalogue « Pied de page » (pilote CDP de tests/helpers-chrome-cdp.js : ni Playwright ni Puppeteer).
// Pour chaque modèle, à 390 / 820 / 1280 / 1440 / 1920 px, AVEC et SANS données d'entreprise (deux sites de contrôle), l'aperçu réel du catalogue est ouvert et mesuré :
//   débordement horizontal · chevauchements · éléments hors écran · texte coupé · erreurs JavaScript · bande pleine largeur (fond de bord à bord) · cibles tactiles < 44 px (mobile : liens et boutons) · contraste AA texte/fond (< 4,5).
// Usage :
//   node scripts/audit-pieds-cdp.js [--famille=minimalistes,corporate] [--id=ft-corporate-01-x,ft-…] [--largeurs=390,820,1280,1440,1920] [--donnees=avec,sans]
//                                   [--captures=/dossier] [--sortie=/fichier.json] [--max=40]
// Sortie : un résumé JSON sur la sortie standard (et dans --sortie) : { mesures, avecDefaut, parCategorie, defauts: [...] }. Code de sortie 0 = aucun défaut, 1 = défauts, 2 = Chrome absent.
// Prérequis : Chrome (CHROME_PATH sinon emplacements usuels). Disque lent : TEST_START_TIMEOUT_MS=900000. Le groupe de processus Chrome est toujours arrêté en fin de script.
const path = require("path"), fs = require("fs");
const REPO = path.join(__dirname, "..");
const arg = (name, def) => { const a = process.argv.find((x) => x.startsWith(`--${name}=`)); return a ? a.slice(name.length + 3) : def; };
const list = (v) => (v ? String(v).split(",").map((x) => x.trim()).filter(Boolean) : null);
const FAMILLES = list(arg("famille")), IDS = list(arg("id")), LARGEURS = (list(arg("largeurs")) || ["390", "820", "1280", "1440", "1920"]).map(Number);
const DONNEES = list(arg("donnees")) || ["avec", "sans"], CAPTURES = arg("captures"), SORTIE = arg("sortie"), MAX = Number(arg("max", 60));

const Chrome = require(path.join(REPO, "tests/helpers-chrome-cdp"));
if (Chrome.SKIP) { console.error(Chrome.SKIP); process.exit(2); }
const { startServer, loginInstructor } = require(path.join(REPO, "tests/helpers"));
const { TEST_KEY } = require(path.join(REPO, "tests/marketing-helpers"));
const Catalog = require(path.join(REPO, "src/themeBuilder/catalog"));

// Mesure exécutée DANS la page (fonction sérialisée). Retourne uniquement des données simples.
function mesurerDansLaPage(mobile) {
  const root = document.querySelector(".kw-theme-part") || document.querySelector("footer") || document.body;
  if (!root) return { absent: true };
  const vis = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 1 && r.height > 1 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0" && !(el.closest("details:not([open])") && el.tagName !== "SUMMARY" && !el.closest("summary")); };
  const SEL = "a,button,img,input,p,span,h1,h2,h3,svg,iframe,textarea,select";
  const feuilles = [...root.querySelectorAll(SEL)].filter((el) => vis(el) && !(el.parentElement && el.parentElement.closest(SEL) && root.contains(el.parentElement.closest(SEL))));
  const rects = feuilles.map((el) => { const r = el.getBoundingClientRect(); return { t: el.tagName, x: r.left, y: r.top, w: r.width, h: r.height, txt: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 24) }; });
  const chevauchements = [];
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j], ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (ox > 3 && oy > 3) chevauchements.push(`${a.t}"${a.txt}"×${b.t}"${b.txt}"`);
  }
  const horsEcran = rects.filter((r) => r.x < -1 || r.x + r.w > innerWidth + 1).map((r) => `${r.t}"${r.txt}"`);
  // texte coupé : un bloc dont le contenu dépasse sa boîte alors que le débordement est masqué
  const coupes = [];
  for (const el of root.querySelectorAll("*")) {
    if (!vis(el)) continue;
    const cs = getComputedStyle(el);
    if ((cs.overflow === "hidden" || cs.overflowX === "hidden") && el.scrollWidth > el.clientWidth + 2 && (el.textContent || "").trim()) coupes.push(`${el.tagName}"${(el.textContent || "").trim().slice(0, 20)}"`);
    if (cs.textOverflow === "ellipsis" && el.scrollWidth > el.clientWidth + 2) coupes.push(`${el.tagName}…"${(el.textContent || "").trim().slice(0, 20)}"`);
  }
  // cibles tactiles (mobile) : liens et boutons visibles de moins de 44 px (les liens en ligne dans un paragraphe sont exemptés)
  const petites = [];
  if (mobile) for (const el of root.querySelectorAll("a[href],button,input[type=submit],summary,[role=button]")) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect(), enLigne = getComputedStyle(el).display === "inline" && el.closest("p,li") && !el.closest("nav");
    // un lien avec du texte n'a pas de largeur minimale (un mot court est étroit) : seule sa HAUTEUR compte ; un bouton ou une icône sans texte doit faire 44 × 44
    const texte = (el.textContent || "").trim().length > 0 && el.tagName === "A", trop = texte ? r.height < 43.5 : (r.height < 43.5 || r.width < 43.5);
    if (!enLigne && trop) petites.push(`${el.tagName}"${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 18)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
  }
  const lire = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(",").map(parseFloat); return { r, g, b, a }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const fondDe = (el) => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const c = lire(getComputedStyle(e).backgroundColor); if (c && c.a > 0.85) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
  const contraste = [];
  for (const el of root.querySelectorAll("a,button,p,span,h1,h2,h3,label,li")) {
    if (!vis(el) || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const fg = lire(getComputedStyle(el).color); if (!fg) continue;
    const L1 = lum(fg), L2 = lum(fondDe(el)), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const taille = parseFloat(getComputedStyle(el).fontSize), gras = parseInt(getComputedStyle(el).fontWeight, 10) >= 700, grand = taille >= 24 || (taille >= 18.66 && gras);
    if (ratio < (grand ? 3 : 4.5)) contraste.push(`${(el.textContent || "").trim().slice(0, 18)} ${ratio.toFixed(2)}`);
  }
  // bande pleine largeur : la bande racine couvre toute la largeur de la fenêtre (à la barre de défilement près) et son contenu intérieur est centré
  const rb = root.getBoundingClientRect(), pleine = Math.abs(rb.left) <= 1 && rb.width >= document.documentElement.clientWidth - 1;
  const gauche = rects.length ? Math.min(...rects.map((r) => r.x)) : 0, droite = rects.length ? Math.max(...rects.map((r) => r.x + r.w)) : 0;
  // volets d'accordéon mobile : chaque volet ouvert doit montrer du contenu visible (hors son titre) ; un volet réduit à son titre n'a pas de bouton (masqué)
  const voletsVides = []; let nVolets = 0;
  if (mobile) for (const b of root.querySelectorAll(".kw-nacc-head")) {
    nVolets++; if (b.getAttribute("aria-expanded") !== "true") b.click();
    const p = document.getElementById(b.getAttribute("aria-controls"));
    const contenu = p ? [...p.querySelectorAll("a,img,svg,input,button,p,span,li,summary")].filter((e) => !e.classList.contains("kw-heading") && !e.closest(".kw-heading") && vis(e)).length : 0;
    if (!contenu) voletsVides.push((b.textContent || "").trim().slice(0, 24));
  }
  return { voletsVides, nVolets, debordement: document.documentElement.scrollWidth - document.documentElement.clientWidth, chevauchements: chevauchements.slice(0, 6), horsEcran: horsEcran.slice(0, 6), coupes: coupes.slice(0, 4), cibles: petites.slice(0, 8), contraste: contraste.slice(0, 6),
    bandePleine: pleine, hauteur: Math.round(rb.height), haut: Math.round(rb.top), marges: [Math.round(gauche), Math.round(innerWidth - droite)], elements: rects.length };
}

(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const idDe = (loc) => Number(String(loc).match(/sites\/(\d+)/)[1]);
  const sites = {};
  const business = require(path.join(REPO, "src/marketing/pages/business"));
  for (const d of DONNEES) {
    sites[d] = idDe((await boss.post("/marketing/site-web/sites", { name: `Mesure pieds ${d} données` })).location);
    if (d === "avec") {
      const db = srv.db(), org = db.prepare("SELECT organization_id AS o FROM mk_sites WHERE id = ?").get(sites[d]).o;
      business.save(db, org, sites[d], {
        legalName: "Atelier Soleil SARL", tagline: "Du bon pain depuis 1990", address: { street: "12 rue des Lilas", postalCode: "75011", city: "Paris", country: "France" },
        phones: [{ label: "Boutique", number: "+33 1 23 45 67 89" }], email: "contact@atelier-soleil.fr",
        hours: { days: { tue: { ranges: [{ open: "09:00", close: "18:00" }] }, wed: { ranges: [{ open: "09:00", close: "18:00" }] } }, exceptions: [], note: "Sur rendez-vous le dimanche." },
        legal: { form: "SARL", capital: "10 000 €", publisher: "Jeanne Soleil", registrations: [{ label: "SIRET", value: "123 456 789 00012" }] },
        legalPages: { notice: "/mentions-legales", privacy: "/confidentialite", terms: "/conditions-de-vente" }, payments: ["card", "transfer", "cash"], delivery: { text: "Livraison sous 3 jours ouvrés.", returns: "Retours sous 14 jours." },
      });
    }
  }
  const entrees = Catalog.entries("footer").filter((e) => (!IDS || IDS.includes(e.key)) && (!FAMILLES || FAMILLES.includes(e.layoutKey)));
  if (CAPTURES) fs.mkdirSync(CAPTURES, { recursive: true });
  let chrome = null; for (let i = 0; i < 6 && !chrome; i++) { try { chrome = await Chrome.launch(); } catch (e) { console.error("Chrome : nouvel essai (" + String(e.message).slice(0, 80) + ")"); await Chrome.wait(4000); } } if (!chrome) throw new Error("Chrome n'a pas démarré après 6 essais");
  const mesures = [];
  try {
    const cookies = [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base }));
    for (const d of DONNEES) for (const w of LARGEURS) {
      const pg = await chrome.newPage({ width: w, height: 900, cookies });
      for (const e of entrees) {
        const r = { id: e.key, famille: e.layoutKey, largeur: w, donnees: d };
        try {
          const erreursAvant = pg.errors.length;
          await pg.goto(`${srv.base}/marketing/site-web/sites/${sites[d]}/constructeur-de-theme/api/bibliotheque/footer/${e.key}/apercu`);
          await Chrome.wait(350);
          await pg.evaluate("document.fonts ? document.fonts.ready.then(() => true) : true").catch(() => {});
          Object.assign(r, await pg.evaluate(mesurerDansLaPage, w <= 480));
          r.erreursJs = pg.errors.slice(erreursAvant, erreursAvant + 3);
          if (CAPTURES) fs.writeFileSync(path.join(CAPTURES, `${e.key}.${d}.${w}.png`), await pg.screenshot({ x: 0, y: Math.max(0, (r.haut || 0) - 6), width: w, height: Math.min(1600, Math.max(80, (r.hauteur || 80) + 12)) }));
        } catch (err) { r.erreur = String(err.message).slice(0, 160); }
        mesures.push(r);
      }
      await pg.close();
    }
  } finally { await chrome.close(); await srv.stop(); }
  const defaut = (r) => {
    const c = [];
    if (r.erreur) c.push("erreur"); if (r.absent) c.push("absent");
    if (r.debordement > 1) c.push("debordement"); if (r.chevauchements && r.chevauchements.length) c.push("chevauchement"); if (r.horsEcran && r.horsEcran.length) c.push("hors-ecran");
    if (r.coupes && r.coupes.length) c.push("texte-coupe"); if (r.erreursJs && r.erreursJs.length) c.push("erreur-js"); if (r.bandePleine === false) c.push("bande-non-pleine");
    if (r.cibles && r.cibles.length) c.push("cible-tactile"); if (r.contraste && r.contraste.length) c.push("contraste"); if (r.hauteur !== undefined && r.hauteur < 20) c.push("hauteur-nulle"); if (r.voletsVides && r.voletsVides.length) c.push("volet-vide");
    return c;
  };
  const defauts = mesures.map((r) => ({ ...r, defauts: defaut(r) })).filter((r) => r.defauts.length);
  const parCategorie = {}; for (const r of defauts) for (const c of r.defauts) parCategorie[c] = (parCategorie[c] || 0) + 1;
  const resume = { mesures: mesures.length, modeles: entrees.length, largeurs: LARGEURS, donnees: DONNEES, avecDefaut: defauts.length, parCategorie, defauts: defauts.slice(0, MAX) };
  if (SORTIE) fs.writeFileSync(SORTIE, JSON.stringify({ ...resume, defauts, toutes: mesures }, null, 1));
  console.log(JSON.stringify(resume, null, 1));
  process.exit(defauts.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
