// Modèles de la bibliothèque (en-têtes et pieds de page) dans le VRAI éditeur : on change la couleur et la police d'un bouton, lien, titre, texte, logo, compte, recherche
// avec le panneau « Style », comme un utilisateur ; le canevas puis le site publié doivent changer. Voir scripts/audit-editeur-modeles.js.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs"), os = require("os"), path = require("path");
const { spawnSync } = require("child_process");
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
let pw = true; try { require("playwright-core"); } catch { pw = false; }
test("réglages de police et de couleur d'un modèle : canevas et site publié", { skip: !pw || !CHROME ? "Playwright ou Chrome absent" : false, timeout: 1200000 }, () => {
  const out = path.join(os.tmpdir(), `audit-editeur-${process.pid}.json`);
  const r = spawnSync(process.execPath, [path.join(__dirname, "../scripts/audit-editeur-modeles.js"), out], { env: { ...process.env, STEP: "28", KINDS: "button,link,heading,text,copyright,account,search,sitelogo" }, encoding: "utf8", timeout: 1100000 });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const rows = JSON.parse(fs.readFileSync(out, "utf8")); fs.unlinkSync(out);
  assert.ok(rows.length >= 8, `trop peu d'éléments mesurés : ${rows.length}`);
  assert.deepEqual(rows.filter((o) => o.err), []);
  const bad = rows.filter((o) => /^KO|^ui/.test(o.police || "") || (o.kind !== "sitelogo" && o.kind !== "search" && /^KO|^ui/.test(o.couleur || "")) || (!["sitelogo", "search"].includes(o.kind) && /^(KO|absent)/.test(o.public || "")));
  assert.deepEqual(bad.map((o) => `${o.type}/${o.key}/${o.kind}: couleur=${o.couleur} police=${o.police} public=${o.public}`), []);
});
