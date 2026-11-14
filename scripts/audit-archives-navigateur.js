#!/usr/bin/env node
// Audit en VRAI Chrome (une seule instance pilotée par CDP) des 100 modèles d'archive, aux trois largeurs (1280 / 820 / 390 px) :
//  · débordement horizontal et éléments hors écran ;
//  · FUITES D'IDENTITÉ : chaque couleur de texte, de fond, de bordure et chaque police réellement calculée dans le modèle doit appartenir à l'identité de la maison du modèle
//    (jamais à la charte de Kolakisa ni à celle du site) ;
//  · zones de clic trop petites (< 24 px) sur mobile.
// Usage : node scripts/audit-archives-navigateur.js [dossier-de-sortie] [--cles=a,b] [--captures=aucune|echantillon|toutes]   (serveur de test démarré puis arrêté)
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("../tests/marketing-helpers");
const { startServer, loginInstructor } = require("../tests/helpers");
const { launch, SKIP } = require("../tests/helpers-chrome-cdp");
const Archive = require("../src/themeBuilder/catalog/archive");
const concepts = require("../src/themeBuilder/catalog/archive-lib/concepts");

const OUT = path.resolve(process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "audit-archives-navigateur");
const ONLY = ((process.argv.find((a) => a.startsWith("--cles=")) || "").split("=")[1] || "").split(",").filter(Boolean);
const CAP = (process.argv.find((a) => a.startsWith("--captures=")) || "--captures=echantillon").split("=")[1];
const SIZES = [["desktop", 1280, 900], ["tablette", 820, 1100], ["mobile", 390, 900]];
const hex2rgb = (h) => `rgb(${[1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(", ")})`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Mesure dans la page : pour chaque élément du modèle, couleurs et polices calculées
const PROBE = () => {
  const roots = [...document.querySelectorAll("[data-kw-own]")];
  const seen = []; const over = [];
  const W = document.documentElement.clientWidth;
  const visit = (el) => {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    if (cs.display === "none" || cs.visibility === "hidden") return;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const tag = el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.split(/\s+/).filter((c) => c && !/^kw-n-/.test(c)).slice(0, 2).join(".") : "");
    if (hasText) seen.push({ tag, kind: "color", v: cs.color }, { tag, kind: "font", v: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim() });
    if (cs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor)) seen.push({ tag, kind: "bg", v: cs.backgroundColor });
    for (const side of ["Top", "Right", "Bottom", "Left"]) if (parseFloat(cs[`border${side}Width`]) > 0 && cs[`border${side}Style`] !== "none") seen.push({ tag, kind: "border", v: cs[`border${side}Color`] });
    if (r.right > W + 1 && r.width > 0) over.push(tag);
    if ((el.tagName === "A" || el.tagName === "BUTTON" || el.tagName === "INPUT") && r.width > 0 && (r.height < 24 || r.width < 24) && W < 500) over.push("petite cible : " + tag);
  };
  for (const root of roots) { visit(root); root.querySelectorAll("*").forEach(visit); }
  return { n: roots.length, seen, over, scroll: document.documentElement.scrollWidth - W };
};

(async () => {
  if (SKIP) { console.log("Chrome indisponible :", SKIP); process.exit(0); }
  fs.mkdirSync(path.join(OUT, "captures"), { recursive: true });
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  let chrome;
  try {
    const boss = await loginInstructor(srv), db = srv.db();
    const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    const site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Audit archives', 'audit-archives', '{}')").run(org).lastInsertRowid);
    for (let i = 0; i < 10 && !chrome; i += 1) { try { chrome = await launch(); } catch (e) { if (i === 9) throw e; await wait(5000); } }
    const cookies = [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base }));
    const keys = concepts.map((c) => c.key).filter((k) => !ONLY.length || ONLY.includes(k));
    const report = []; let done = 0;
    for (const key of keys) {
      const S = Archive.skins.find((s) => s.key === key), c = concepts.find((x) => x.key === key);
      const okColors = new Set([S.bg, S.fg, S.mute, S.alt, S.line, S.accent, S.onAccent, "#ffffff", "#000000", "#111111", S.bg === "#000000" ? "#000000" : S.bg].filter(Boolean).map(hex2rgb));
      // surcouches noires/blanches translucides et fonds de formulaire : tolérés (blanc, noir et leurs variantes translucides)
      const okRgba = (v) => /^rgba\((0, 0, 0|255, 255, 255), /.test(v);
      const okFont = (f) => [S.head, S.font].some((id) => f.toLowerCase().replace(/[^a-z0-9]/g, "").includes(id.replace("font.", "").replace(/[^a-z0-9]/g, ""))) || /^(sans-serif|serif|monospace|system-ui)$/i.test(f);
      const rec = { key, leaks: {}, sizes: {} };
      for (const [name, w, h] of SIZES) {
        const pg = await chrome.newPage({ width: w, height: h, cookies });
        try {
          await pg.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme/api/bibliotheque/archive/${key}/apercu`);
          await wait(250);
          const m = await pg.evaluate(PROBE);
          rec.sizes[name] = { roots: m.n, scroll: m.scroll, hors: [...new Set(m.over)].slice(0, 5) };
          if (name === "desktop") for (const s of m.seen) { const bad = s.kind === "font" ? !okFont(s.v) : !(okColors.has(s.v) || okRgba(s.v)); if (bad) (rec.leaks[`${s.kind} ${s.v} <${s.tag}>`] ||= 0), rec.leaks[`${s.kind} ${s.v} <${s.tag}>`]++; }
          if (CAP === "toutes" || (CAP === "echantillon" && keys.indexOf(key) % 4 === 0)) fs.writeFileSync(path.join(OUT, "captures", `${key}.${name}.png`), await pg.screenshot());
        } catch (e) { rec.sizes[name] = { erreur: String(e.message).slice(0, 120) }; } finally { await pg.close(); }
      }
      report.push(rec); done += 1; if (done % 10 === 0) console.log(`modèles ${done}/${keys.length}`);
    }
    const sizeProblems = report.filter((r) => Object.values(r.sizes).some((s) => s.erreur || s.roots === 0 || s.scroll > 1 || (s.hors && s.hors.some((h) => !/^petite cible/.test(h)))));
    const leakModels = report.filter((r) => Object.keys(r.leaks).length);
    const summary = { modeles: report.length, debordements: sizeProblems.length, modelesAvecFuites: leakModels.length, fuitesTotales: leakModels.reduce((a, r) => a + Object.keys(r.leaks).length, 0) };
    fs.writeFileSync(path.join(OUT, "rapport.json"), JSON.stringify({ summary, sizeProblems, leakModels }, null, 1));
    console.log(JSON.stringify(summary));
    const top = {}; for (const r of leakModels) for (const k of Object.keys(r.leaks)) top[k.replace(/ rgb\([^)]*\)/, " <couleur>")] = (top[k.replace(/ rgb\([^)]*\)/, " <couleur>")] || 0) + 1;
    console.log("fuites les plus fréquentes :", Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 12));
    for (const r of sizeProblems.slice(0, 15)) console.log("PROBLÈME", r.key, JSON.stringify(r.sizes));
  } finally { if (chrome) await chrome.close(); await srv.stop(); }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
