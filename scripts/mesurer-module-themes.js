// Mesure de performance du module Thèmes (côté serveur) : temps de réponse (médiane de plusieurs essais) et poids des pages.
// Usage : node scripts/mesurer-module-themes.js [sortie.json]
const path = require("path"), fs = require("fs"), zlib = require("zlib");
const REPO = path.join(__dirname, "..");
const { startServer, loginInstructor } = require(path.join(REPO, "tests/helpers"));
const { TEST_KEY } = require(path.join(REPO, "tests/marketing-helpers"));
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ...(process.env.WARM ? { THEMES_WARMUP: "on" } : {}) });
  if (process.env.WARM) await new Promise((r) => setTimeout(r, 4000)); // laisse l'échauffement du démarrage se terminer
  const boss = await loginInstructor(srv); const O = { Origin: srv.base };
  const site = Number((await boss.post("/marketing/site-web/sites", { name: "Mesure thèmes" })).location.match(/sites\/(\d+)/)[1]);
  const B = "/marketing/site-web/themes", Q = `?site=${site}`;
  const lib = require(path.join(REPO, "src/marketing/themes/library"));
  const catalog = require(path.join(REPO, "src/marketing/themes/catalog"));
  const keys = catalog.catalog().map((m) => m.key);
  const res = {};
  const time = async (label, fn, n = 7) => {
    const ts = []; let size = 0, status = 0;
    for (let i = 0; i < n; i++) { const t0 = process.hrtime.bigint(); const r = await fn(); ts.push(Number(process.hrtime.bigint() - t0) / 1e6); size = Buffer.byteLength(r.text || ""); status = r.status; }
    res[label] = { ms_mediane: +med(ts).toFixed(1), ms_premier: +ts[0].toFixed(1), octets: size, statut: status };
  };
  const r0 = (n) => Buffer.alloc(0);
  const get = (u) => boss.get(u);
  await time("galerie (page complète)", () => get(B + Q));
  await time("galerie (fragment, 1 catégorie)", () => get(`${B}${Q}&categorie=${lib.CATEGORIES[1].key}&fragment=1`));
  await time("galerie (recherche « sombre », fragment)", () => get(`${B}${Q}&q=sombre&fragment=1`));
  await time("galerie (page 3, fragment)", () => get(`${B}${Q}&page=3&fragment=1`));
  const k1 = keys[0], k2 = keys[1];
  await time("détails d'un thème", () => get(`${B}/${k1}/details${Q}`));
  await time("aperçu (coque)", () => get(`${B}/${k1}/apercu${Q}`));
  await time("aperçu (page de démonstration)", () => get(`${B}/${k1}/demo/${(lib.item ? "" : "")}${Q}`));
  await time("aperçu d'un second thème", () => get(`${B}/${k2}/demo/${Q}`));
  // installation (une fois par thème, médiane sur 5 thèmes)
  const inst = [];
  for (const k of keys.slice(0, 5)) { const t0 = process.hrtime.bigint(); const r = await boss.request(`${B}/installer`, { method: "POST", json: { key: k, site }, headers: O }); inst.push(Number(process.hrtime.bigint() - t0) / 1e6); }
  res["installation d'un thème (médiane de 5)"] = { ms_mediane: +med(inst).toFixed(1), ms_premier: +inst[0].toFixed(1) };
  const act = [];
  for (const k of keys.slice(0, 5)) { const t0 = process.hrtime.bigint(); await boss.request(`${B}/${k}/activer`, { method: "POST", json: { site }, headers: O }); act.push(Number(process.hrtime.bigint() - t0) / 1e6); }
  res["activation d'un thème (médiane de 5)"] = { ms_mediane: +med(act).toFixed(1), ms_premier: +act[0].toFixed(1) };
  await time("personnalisateur (page)", () => get(`/marketing/site-web/personnaliser${Q}`));
  await srv.stop();
  fs.writeFileSync(process.argv[2] || ".mesure-themes.json", JSON.stringify(res, null, 1));
  for (const [k, v] of Object.entries(res)) console.log(k.padEnd(48), JSON.stringify(v));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
