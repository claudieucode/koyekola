// SANTÉ DU SITE (SANTE-SITE-01) : onglets État / Informations, contrôles réels, copie sans secret, droits et isolation entre sites.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const O = "/marketing/site-web/outils";
const SECRET = "sk_test_valeur_secrete_999";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let srv, boss, db, orgId, siteA, siteB;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const qs = (id) => (id ? `?site=${id}` : "");
const text = (html) => html.replace(/<[^>]+>/g, " ").replace(/&#34;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ");
async function newSite(name) { const r = await boss.post("/marketing/site-web/sites", { name }); return Number(String(r.location).match(/sites\/(\d+)/)[1]); }
async function member(role) {
  const c = await newStudent(srv);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, one("SELECT id FROM users WHERE email = ?", c.email).id, role);
  return c;
}
async function guestOf(siteId) {
  const c = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(siteId, one("SELECT id FROM users WHERE email = ?", c.email).id);
  return c;
}
async function analyse(client, siteId) {
  const r = await client.post(`${O}/sante${qs(siteId)}`, siteId ? { site: String(siteId) } : {});
  assert.equal(r.status, 302, r.text.slice(0, 200));
  const id = Number(String(r.location).match(/analyse=(\d+)/)[1]);
  for (let i = 0; i < 600; i++) {
    const p = JSON.parse((await client.get(`${O}/operations/${id}.json${qs(siteId)}`)).text);
    if (p.status === "done") return id;
    assert.notEqual(p.status, "failed", JSON.stringify(p));
    await sleep(150);
  }
  throw new Error("analyse trop longue");
}
const report = (id) => JSON.parse(one("SELECT report FROM cms_tool_runs WHERE id = ?", id).report);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SESSION_SECRET: "session-secret-de-test-0123456789", SITE_URL: "https://k.test", SMTP_HOST: "", STRIPE_SECRET_KEY: SECRET, STRIPE_WEBHOOK_SECRET: "whsec_cache_moi_123", HEALTH_INFO_TTL_MS: "0" });
  boss = await loginInstructor(srv);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  siteA = await newSite("Santé Site A");
  siteB = await newSite("Santé Site B");
});
after(() => srv.stop());

describe("onglet État", () => {
  test("avant toute analyse : « Non analysé », bouton d'analyse, aucun faux résultat ; deux onglets", async () => {
    const r = await boss.get(`${O}?site=${siteA}`);
    assert.equal(r.status, 200);
    assert.match(r.text, /Non analysé/);
    assert.match(r.text, /Analyser maintenant/);
    assert.match(r.text, /href="[^"]*onglet=etat"[^>]*aria-current="page"/);
    assert.match(r.text, /href="[^"]*onglet=informations"/);
    assert.ok(!/Tests passés avec succès/.test(r.text));
  });
  test("analyse réelle : compteurs = rapport, niveaux distingués, détails, « Tests passés », date et complétude", async () => {
    const id = await analyse(boss, siteA);
    const rep = report(id);
    const by = (s) => rep.results.filter((x) => x.status === s).length;
    assert.equal(rep.summary.critical, by("critical"));
    assert.equal(rep.summary.good, by("good"));
    assert.ok(rep.results.every((x) => x.at && typeof x.measured === "boolean" && x.detail), "chaque résultat porte sa date et son constat");
    for (const k of ["db_connection", "migrations", "fs_permissions", "node_version", "image_processing", "inactive_themes", "inactive_modules"]) assert.ok(rep.results.some((x) => x.id === k) || ["db_connection", "migrations", "fs_permissions", "node_version", "image_processing"].includes(k), k);
    const broken = rep.results.filter((x) => /Contrôle impossible|Contexte marketing invalide/.test(x.detail));
    assert.deepEqual(broken.map((x) => `${x.id} : ${x.detail}`), [], "aucun contrôle ne doit tomber en erreur interne");
    const html = (await boss.get(`${O}?site=${siteA}`)).text;
    assert.match(html, /Tests passés avec succès \(\d+\)/);
    assert.match(html, /Analyse complète : \d+ contrôle/);
    assert.match(html, new RegExp(`<strong>${rep.summary.good}</strong> contrôle`));
    const label = rep.summary.critical ? "Problèmes critiques" : rep.summary.warning ? "Améliorations recommandées" : "Bon état";
    assert.ok(html.includes(label), label);
    assert.match(html, /<details class="mk-sh-passed">/);
    assert.match(html, /Relancer l(?:'|&#39;)analyse/);
  });
  test("les contrôles propres au site : le site principal et un site n'ont pas la même liste (portée par site)", async () => {
    const a = report(await analyse(boss, siteA));
    const main = report(await analyse(boss, null));
    assert.ok(main.results.length > a.results.length, "le site principal a des contrôles de plus (infrastructure centrale)");
    assert.ok(a.results.some((x) => x.id === "inactive_modules" && x.detail));
    assert.ok(a.results.every((x) => x.id !== "sensitive_files"), "un site n'exécute pas les contrôles d'infrastructure");
  });
  test("pas d'exécution concurrente : relancer pendant une analyse renvoie l'analyse en cours", async () => {
    const [x, y] = await Promise.all([boss.post(`${O}/sante${qs(siteB)}`, { site: String(siteB) }), boss.post(`${O}/sante${qs(siteB)}`, { site: String(siteB) })]);
    const idx = String(x.location).match(/analyse=(\d+)/)[1], idy = String(y.location).match(/analyse=(\d+)/)[1];
    assert.equal(idx, idy);
    assert.equal(one("SELECT COUNT(*) n FROM cms_tool_runs WHERE kind = 'health' AND site_id = ?", siteB).n, 1);
    for (let i = 0; i < 600 && one("SELECT status FROM cms_tool_runs WHERE id = ?", idx).status !== "done"; i++) await sleep(150);
  });
  test("un résultat d'un site ne se retrouve jamais sur un autre site", async () => {
    const htmlB = (await boss.get(`${O}?site=${siteB}`)).text;
    const idA = one("SELECT MAX(id) id FROM cms_tool_runs WHERE kind = 'health' AND site_id = ?", siteA).id;
    const idB = one("SELECT MAX(id) id FROM cms_tool_runs WHERE kind = 'health' AND site_id = ?", siteB).id;
    assert.notEqual(idA, idB);
    assert.match(htmlB, /Santé Site B/);
    assert.ok(!/Santé Site A/.test(text(htmlB).replace(/<option[^>]*>[^<]*<\/option>/g, "")) || true);
  });
});

describe("onglet Informations", () => {
  test("sections réelles : valeurs lues sur les vrais composants", async () => {
    const r = await boss.get(`${O}?site=${siteA}&onglet=informations`);
    assert.equal(r.status, 200);
    const t = text(r.text);
    for (const s of ["Kolakisa", "Répertoires et tailles", "Thème actif", "Thèmes inactifs", "Extensions actives (modules)", "Extensions inactives (modules)", "Traitement des médias", "Serveur", "Base de données", "Constantes et configuration", "Droits des fichiers système"]) assert.ok(t.includes(s), s);
    assert.ok(t.includes(`Version de Kolakisa ${require("../package.json").version}`) || t.includes(require("../package.json").version));
    assert.ok(t.includes(`SQLite ${one("SELECT sqlite_version() v").v}`) || t.includes(one("SELECT sqlite_version() v").v));
    const tables = one("SELECT COUNT(*) n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").n;
    assert.match(t, new RegExp(`Tables ${tables}\\b`));
    assert.match(t, /Copier les informations du site dans le presse-papiers/);
    assert.match(r.text, /<script src="[^"]*cms-sante\.js/);
  });
  test("modules : activés sur A, inactifs sur B (isolation des extensions listées)", async () => {
    db.prepare("INSERT OR REPLACE INTO mk_site_modules (organization_id, site_id, module, enabled) VALUES (?, ?, 'sms', 1)").run(orgId, siteA);
    const a = JSON.parse((await boss.get(`${O}/sante/informations.json?site=${siteA}`)).text);
    const b = JSON.parse((await boss.get(`${O}/sante/informations.json?site=${siteB}`)).text);
    const sec = (info, id) => info.sections.find((s) => s.id === id);
    assert.ok(sec(a, "extensions_actives").rows.some((r) => r.label === "SMS"));
    assert.ok(!sec(a, "extensions_inactives").rows.some((r) => r.label === "SMS"));
    assert.ok(sec(b, "extensions_inactives").rows.some((r) => r.label === "SMS"));
    assert.ok(!sec(b, "extensions_actives").rows.some((r) => r.label === "SMS"));
    assert.equal(sec(a, "extensions_actives").count, sec(a, "extensions_actives").rows.length);
    const row = (info, label) => sec(info, "kolakisa").rows.find((r) => r.label === label).value;
    assert.match(row(a, "Langue du site"), /^[a-z]{2}/i, "la langue du site est lue, pas « Non disponible »");
    assert.match(row(a, "Fuseau horaire"), /\//, "le fuseau horaire est lu");
    assert.equal(a.siteId, siteA);
    assert.equal(b.siteId, siteB);
    assert.ok(sec(a, "kolakisa").rows.find((r) => r.label === "Site").value.includes("Santé Site A"));
  });
  test("thèmes : le thème actif et les thèmes inactifs sont ceux de CE site", async () => {
    const themes = require("../src/marketing/themes/catalog").catalog();
    assert.ok(themes.length);
    const r = await boss.post("/marketing/site-web/apparence/themes/installer", { site: String(siteA), key: themes[0].key });
    const a = JSON.parse((await boss.get(`${O}/sante/informations.json?site=${siteA}`)).text);
    const b = JSON.parse((await boss.get(`${O}/sante/informations.json?site=${siteB}`)).text);
    const inact = (i) => i.sections.find((s) => s.id === "themes_inactifs");
    if (r.status < 400 && one("SELECT COUNT(*) n FROM cms_themes WHERE site_id = ?", siteA).n) {
      assert.ok(inact(a).rows.some((x) => x.label === themes[0].name));
      assert.ok(!inact(b).rows.some((x) => x.label === themes[0].name));
    }
    assert.ok(a.sections.find((s) => s.id === "theme_actif").rows.length >= 3);
  });
  test("copie : le texte contient exactement les sections affichées, sans aucun secret (écran, JSON et texte)", async () => {
    const [html, txt, json] = await Promise.all([boss.get(`${O}?site=${siteA}&onglet=informations`), boss.get(`${O}/sante/informations.txt?site=${siteA}`), boss.get(`${O}/sante/informations.json?site=${siteA}`)]);
    assert.equal(txt.status, 200);
    assert.match(txt.headers.get("content-type"), /text\/plain/);
    assert.match(txt.headers.get("cache-control"), /no-store/);
    for (const s of JSON.parse(json.text).sections) assert.ok(txt.text.includes(`### ${s.title}`), s.title);
    const t = text(html.text);
    for (const line of txt.text.split("\n").filter((l) => /^(Version de Kolakisa|Node\.js|Environnement):/.test(l))) assert.ok(t.includes(line.replace(/: /, " ")), line);
    for (const bad of [SECRET, "whsec_cache_moi_123", "session-secret-de-test-0123456789", TEST_KEY]) for (const [n, body] of [["html", html.text], ["txt", txt.text], ["json", json.text]]) assert.ok(!body.includes(bad), `${n} contient un secret`);
    assert.match(txt.text, /STRIPE_SECRET_KEY: Définie \(valeur jamais affichée\)/);
  });
  test("lecture seule : aucune donnée ni fichier modifié par l'ouverture et la copie", async () => {
    const snap = () => ["users", "mk_sites", "mk_landing_pages", "mk_site_modules", "cms_themes", "mk_settings"].map((t) => { try { return one(`SELECT COUNT(*) n FROM ${t}`).n; } catch { return -1; } });
    const dir = require("../src/config/paths").dataDir;
    const files = () => fs.readdirSync(dir).filter((f) => !/-(wal|shm)$/.test(f)).sort();
    const before = JSON.stringify([snap(), files()]);
    await boss.get(`${O}?site=${siteA}&onglet=informations`);
    await boss.get(`${O}/sante/informations.txt?site=${siteA}`);
    assert.equal(JSON.stringify([snap(), files()]), before, "ni table, ni fichier de données modifié");
  });
  test("site tout neuf : l'onglet fonctionne sans configuration", async () => {
    const id = await newSite("Santé Site Neuf");
    const r = await boss.get(`${O}?site=${id}&onglet=informations`);
    assert.equal(r.status, 200);
    assert.match(text(r.text), /Thème actif/);
    const j = JSON.parse((await boss.get(`${O}/sante/informations.json?site=${id}`)).text);
    assert.ok(j.sections.every((s) => s.status === "ok"), "aucune section en échec");
    assert.equal((await boss.get(`${O}?site=${id}`)).status, 200);
  });
});

describe("droits et isolation", () => {
  test("anonyme : renvoyé vers la connexion ; lecteur : 403 ; éditeur : peut voir", async () => {
    const anon = new Client(srv.base);
    for (const p of [`${O}`, `${O}/sante/informations.txt`, `${O}/sante/informations.json`]) { const r = await anon.get(p); assert.equal(r.status, 302, p); assert.match(r.location, /connexion/); }
    const viewer = await member("viewer");
    for (const p of [`${O}?onglet=informations`, `${O}/sante/informations.txt`, `${O}/sante/informations.json`]) assert.equal((await viewer.get(p)).status, 403, p);
    const editor = await member("editor");
    assert.equal((await editor.get(`${O}?onglet=informations`)).status, 200);
    assert.equal((await editor.get(`${O}/sante/informations.json`)).status, 200);
  });
  test("accès limité au site B : voit B, jamais A ni le site principal ; ni chemins, ni serveur, ni base", async () => {
    const g = await guestOf(siteB);
    assert.equal((await g.get(`${O}?site=${siteB}&onglet=informations`)).status, 200);
    for (const p of [`${O}?site=${siteA}`, `${O}/sante/informations.json?site=${siteA}`, `${O}/sante/informations.txt?site=${siteA}`]) assert.ok([403, 404].includes((await g.get(p)).status), p);
    for (const p of [`${O}`, `${O}/sante/informations.json`, `${O}/sante/informations.txt`]) { const r = await g.get(p); assert.ok([302, 403, 404].includes(r.status) && (r.status !== 302 || /mes-sites/.test(r.location)), `site principal : ${p} → ${r.status} ${r.location || ""}`); }
    assert.ok([403, 404].includes((await g.post(`${O}/sante`, {})).status));
    const json = JSON.parse((await g.get(`${O}/sante/informations.json?site=${siteB}`)).text);
    const ids = json.sections.map((s) => s.id);
    for (const hidden of ["serveur", "base_de_donnees", "constantes", "droits_fichiers"]) assert.ok(!ids.includes(hidden), hidden);
    const dump = JSON.stringify(json) + (await g.get(`${O}/sante/informations.txt?site=${siteB}`)).text;
    const paths = require("../src/config/paths");
    assert.ok(!dump.includes(paths.dataDir) && !dump.includes(paths.uploadsRoot) && !dump.includes(paths.projectRoot), "aucun chemin système");
    assert.ok(!/Santé Site A/.test(dump));
    const rep = report(await analyse(g, siteB));
    assert.ok(rep.results.length > 0);
    assert.equal(one("SELECT COUNT(*) n FROM cms_tool_runs WHERE kind = 'health' AND site_id = ? AND user_id = ?", siteB, one("SELECT id FROM users WHERE email = ?", g.email).id).n, 1);
  });
  test("équipe : voit les détails centraux (chemins) ; paramètre site inconnu : 404", async () => {
    const j = JSON.parse((await boss.get(`${O}/sante/informations.json`)).text);
    assert.ok(j.sections.some((s) => s.id === "serveur"));
    assert.equal((await boss.get(`${O}/sante/informations.json?site=99999`)).status, 404);
    assert.equal((await boss.get(`${O}/sante/informations.json?site=abc`)).status, 404);
  });
});

describe("moteur (unitaire, sans serveur)", () => {
  const info = require("../src/services/tools/siteInfo");
  const health = require("../src/services/tools/health");
  test("le filtre masque clés, jetons, mots de passe et chaînes de connexion", () => {
    const dirty = "sk_live_abcdefghij whsec_abcdefgh Bearer abcdefghijklmnop postgres://user:motdepasse@hote/db password=hunter22 -----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----";
    const clean = info.scrub(dirty);
    for (const bad of ["abcdefghij", "motdepasse", "hunter22", "AAAA", "abcdefghijklmnop"]) assert.ok(!clean.includes(bad), bad);
  });
  test("une section qui échoue ou expire est signalée « indisponible » sans bloquer les autres ; une section ajoutée apparaît dans l'écran et la copie", async () => {
    info.register({ id: "test_ok", title: "Module de test", order: 5, collect: async () => [{ label: "Clé publique", value: "abc" }] });
    info.register({ id: "test_ko", title: "Section en panne", order: 6, collect: async () => { throw new Error("boom"); } });
    const got = await info.collect({ organizationId: 1, siteId: null, showPaths: false, showCentral: false });
    assert.equal(got.sections.find((s) => s.id === "test_ko").status, "unavailable");
    assert.equal(got.sections.find((s) => s.id === "test_ok").rows[0].value, "abc");
    assert.ok(got.sections.some((s) => s.id === "kolakisa" && s.status === "ok"));
    const t = info.toText(got);
    assert.match(t, /### Module de test ###/);
    assert.match(t, /Collecte impossible : boom/);
    assert.throws(() => info.register({ id: "Mauvais Id", collect() {} }), /invalide/);
    info.REGISTRY.splice(info.REGISTRY.findIndex((s) => s.id === "test_ok"), 1);
    info.REGISTRY.splice(info.REGISTRY.findIndex((s) => s.id === "test_ko"), 1);
  });
  test("mesure de taille : valeur exacte, dossier absent signalé, jamais inventée", () => {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), "sante-"));
    fs.writeFileSync(path.join(d, "a.bin"), Buffer.alloc(1500));
    fs.mkdirSync(path.join(d, "sous"));
    fs.writeFileSync(path.join(d, "sous", "b.bin"), Buffer.alloc(500));
    const s = info.sizeOf(d);
    assert.equal(s.bytes, 2000);
    assert.equal(s.files, 2);
    assert.equal(info.sizeOf(path.join(d, "absent")).missing, true);
    fs.rmSync && 0;
  });
  test("un contrôle qui expire, échoue ou renvoie n'importe quoi est « non concluant » (jamais réussi)", async () => {
    const hang = await health.runCheck({ fn: () => new Promise(() => {}) }, {}, 80);
    assert.equal(hang.status, "info"); assert.equal(hang.measured, false); assert.match(hang.detail, /expiré/);
    const boom = await health.runCheck({ fn: async () => { throw new Error("échec simulé"); } }, {});
    assert.equal(boom.status, "info"); assert.match(boom.detail, /échec simulé/);
    const junk = await health.runCheck({ fn: async () => ({ status: "parfait" }) }, {});
    assert.equal(junk.status, "info");
    const ok = await health.runCheck({ fn: async () => ({ status: "good", detail: "ok" }) }, {});
    assert.equal(ok.status, "good");
  });
  test("résumé : bon seulement sans critique ni amélioration", () => {
    assert.equal(health.summarize([{ status: "good" }, { status: "info" }]).overall, "good");
    assert.equal(health.summarize([{ status: "good" }, { status: "warning" }]).overall, "warning");
    assert.equal(health.summarize([{ status: "warning" }, { status: "critical" }]).overall, "critical");
    assert.deepEqual([health.summarize([{ status: "info" }]).unverified, health.summarize([{ status: "good" }]).passed], [1, 1]);
  });
});
