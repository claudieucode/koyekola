// Contrôle visuel des 100 pieds AVEC et SANS données d'entreprise, dans un vrai Chrome, à 390 / 820 / 1280 px (chantier F).
// Chaque modèle est utilisé (copie du site) dans deux sites : « vide » (aucune donnée d'entreprise) et « plein » (données complètes) ; on ouvre l'aperçu de la copie et on mesure :
//   - débordement horizontal (scrollWidth > largeur de la fenêtre) ;
//   - éléments hors de l'écran, chevauchements de textes ;
//   - sur mobile (390 px) : hauteur des zones cliquables des liens du pied (cible ≥ 44 px) ;
//   - « trous » : colonne ou rangée visible de hauteur nulle entre deux contenus ; hauteur totale du pied ;
//   - taille de la barre du bas (copyright) : texte visible, jamais coupé.
// Usage : NODE_PATH=<dossier node_modules contenant playwright-core> node scripts/audit-pieds-donnees.js <dossier de sortie> [clé,famille,…]
// Prérequis : playwright-core et Chrome (CHROME_PATH). Sortie : report.json + synthese.txt (+ captures de quelques modèles).
const path = require("path"), fs = require("fs");
const REPO = path.join(__dirname, "..");
const { startServer, loginInstructor } = require(path.join(REPO, "tests/helpers"));
let chromium; try { ({ chromium } = require("playwright-core")); } catch { console.error("playwright-core absent : NODE_PATH=…/node_modules"); process.exit(2); }
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const Catalog = require(path.join(REPO, "src/themeBuilder/catalog"));
const business = require(path.join(REPO, "src/marketing/pages/business"));
const { TEST_KEY } = require(path.join(REPO, "tests/marketing-helpers"));

const OUT = process.argv[2] || path.join(require("os").tmpdir(), "audit-pieds-donnees");
const ONLY = process.argv[3] ? process.argv[3].split(",") : null;
const VPS = [["ordinateur", 1280, 800], ["tablette", 820, 900], ["mobile", 390, 800]];
const PROFILE = {
  legalName: "Atelier Soleil", address: { street: "12 rue des Lilas", postalCode: "75011", city: "Paris", country: "France" },
  phones: [{ label: "Boutique", number: "+33 1 23 45 67 89" }], email: "contact@atelier-soleil.fr",
  hours: { days: { tue: { ranges: [{ open: "09:00", close: "18:00" }] }, wed: { ranges: [{ open: "09:00", close: "18:00" }] }, thu: { ranges: [{ open: "09:00", close: "18:00" }] } }, exceptions: [], note: "Fermé le week-end." },
  legal: { form: "SARL", capital: "10 000 €", registrations: [{ label: "SIRET", value: "123 456 789 00012" }] },
  legalPages: { notice: "/mentions-legales", privacy: "/confidentialite", terms: "/cgv" },
  payments: ["card", "transfer", "paypal"], delivery: { text: "Livraison sous 3 jours ouvrés.", returns: "Retours sous 14 jours." },
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv), db = srv.db();
  const mkSite = async (name) => { const id = Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]); const pr = await boss.post("/marketing/pages", { name: `Accueil ${name}`, site_id: id, kind: "page" }); if (!pr.location) throw new Error("page d'accueil non créée pour " + name); return id; };
  const sites = { vide: await mkSite("Site vide"), plein: await mkSite("Site plein") };
  const org = db.prepare("SELECT id FROM mk_organizations").get().id;
  business.save(db, org, sites.plein, PROFILE);
  const entries = Catalog.entries("footer").filter((e) => !ONLY || ONLY.includes(e.layoutId) || ONLY.includes(e.layoutKey) || ONLY.includes(e.key));
  const comps = {};
  for (const [mode, site] of Object.entries(sites)) {
    for (const e of entries) {
      const r = await boss.request(`/marketing/site-web/sites/${site}/constructeur-de-theme/api/bibliotheque/utiliser`, { method: "POST", json: { type: "footer", key: e.key }, headers: { Origin: srv.base } });
      comps[`${mode}:${e.key}`] = JSON.parse(r.text).template.sourceId;
    }
  }
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const report = [];
  for (const [vname, w, h] of VPS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    await ctx.addCookies([...boss.cookies].map(([n, v]) => ({ name: n, value: v, url: srv.base })));
    const pg = await ctx.newPage(); const errors = []; pg.on("pageerror", (x) => errors.push(x.message));
    for (const mode of Object.keys(sites)) for (const e of entries) {
      const r = { key: e.key, mode, vp: vname };
      try {
        await pg.goto(`${srv.base}/marketing/site-web/composants/${comps[`${mode}:${e.key}`]}/apercu`, { waitUntil: "load" });
        await pg.waitForTimeout(250); await pg.evaluate(() => document.fonts.ready).catch(() => {});
        Object.assign(r, await pg.evaluate(({ mobile, expect }) => {
          const root = document.querySelector("footer[data-kw-footer]") || document.querySelector(".kw-theme-footer") || document.querySelector("main") || document.body;
          const vis = (el) => { const b = el.getBoundingClientRect(), cs = getComputedStyle(el); return b.width > 1 && b.height > 1 && cs.visibility !== "hidden" && cs.display !== "none" && !(el.closest("details:not([open])") && !el.closest("summary")); };
          const rb = root.getBoundingClientRect();
          const links = [...root.querySelectorAll("a[href], button")].filter(vis);
          const small = mobile ? links.filter((a) => { const b = a.getBoundingClientRect(); return b.height < 43.5 && !a.closest(".kw-map"); }).map((a) => `${(a.textContent || a.getAttribute("aria-label") || "").trim().slice(0, 20)} ${Math.round(a.getBoundingClientRect().height)}px`) : [];
          const rects = [...root.querySelectorAll("a,button,img,input,p,span,h1,h2,h3,svg")].filter((el) => vis(el) && !(el.parentElement && el.parentElement.closest("a,button,p,span,h1,h2,h3")));
          const out = rects.filter((el) => { const b = el.getBoundingClientRect(); return b.left < -1 || b.right > innerWidth + 1; }).map((el) => (el.textContent || el.tagName).trim().slice(0, 18));
          // colonnes ou zones visibles dont la hauteur est nulle alors qu'elles sont voisines de contenu = trous
          const holes = [...root.querySelectorAll(".kw-stack, .kw-group")].filter((el) => { const b = el.getBoundingClientRect(); return b.height < 1 && b.width > 40 && el.parentElement && el.parentElement.children.length > 1; }).length;
          const copy = root.querySelector(".kw-copyright"); const cb = copy ? copy.getBoundingClientRect() : null;
          return { scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, height: Math.round(rb.height), small: small.slice(0, 5), nbSmall: small.length, outside: out.slice(0, 4), holes,  copyOk: !!cb && cb.width > 20 && cb.right <= innerWidth + 1 && cb.left >= -1 && (copy.textContent || "").includes(expect) };
        }, { mobile: vname === "mobile", expect: mode === "plein" ? "Atelier Soleil" : "Site vide" }));
        if (["ligne-copyright-menu.clair", "coordonnees-trois-colonnes.editorial", "boutique-quatre-colonnes.editorial", "corporate-sombre-large.editorial"].includes(e.key) || (r.nbSmall || 0) > 0 && report.filter((x) => x.shot).length < 6) { await pg.screenshot({ path: path.join(OUT, `${e.key}.${mode}.${vname}.png`), fullPage: true }); r.shot = true; }
      } catch (err) { r.error = String(err.message).slice(0, 160); }
      report.push(r);
    }
    if (errors.length) report.push({ vp: vname, pageErrors: errors.slice(0, 5) });
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 1));
  const rows = report.filter((r) => r.key);
  const bad = rows.filter((r) => r.error || r.scrollW - r.clientW > 1 || (r.outside && r.outside.length) || (r.nbSmall || 0) > 0 || r.copyOk === false);
  const lines = [`Pieds contrôlés : ${new Set(rows.map((r) => r.key)).size} modèles × ${Object.keys(sites).length} sites (sans / avec données) × ${VPS.length} largeurs = ${rows.length} mesures`,
    `Débordement horizontal : ${rows.filter((r) => r.scrollW - r.clientW > 1).length} · éléments hors écran : ${rows.filter((r) => r.outside && r.outside.length).length} · copyright coupé : ${rows.filter((r) => r.copyOk === false).length} · cibles < 44 px (mobile) : ${rows.filter((r) => r.nbSmall > 0).length} · erreurs : ${rows.filter((r) => r.error).length} · colonnes vides (trous) : ${rows.filter((r) => r.holes > 0).length}`,
    `Mesures avec défaut : ${bad.length}`];
  for (const r of bad.slice(0, 80)) lines.push(`- ${r.key} [${r.mode} ${r.vp}] ${r.error || ""} ${r.scrollW - r.clientW > 1 ? `débordement ${r.scrollW - r.clientW}px ` : ""}${r.outside && r.outside.length ? `hors écran ${r.outside.join("|")} ` : ""}${r.nbSmall ? `petites cibles ${r.small.join("|")} ` : ""}${r.copyOk === false ? "copyright coupé" : ""}`);
  fs.writeFileSync(path.join(OUT, "synthese.txt"), lines.join("\n"));
  console.log(lines.join("\n"));
  await srv.stop();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
