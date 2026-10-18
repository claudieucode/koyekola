// R9-5 — lanceur SSH v2 (scripts/r9/lancer-recette-prod.sh) : un faux « ssh » local joue le rôle du serveur (aucune connexion réseau, aucune base réelle). Vérifie la recherche de Node, la conservation des erreurs
// (défaut constaté : l'ancien lanceur n'enregistrait que la sortie standard), le rapport local, la lecture seule, l'arrêt sur échec.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");

const L = path.join(__dirname, "..", "scripts", "r9", "lancer-recette-prod.sh");
describe("lanceur SSH v2 (faux serveur local)", () => {
  let dir, home, srvHome, bin, live, writer;
  const listing = (d) => fs.readdirSync(d).sort().join(",");
  const run = (args, env = {}) => spawnSync("bash", [L, ...args], { encoding: "utf8", env: { PATH: `${bin}:${path.dirname(process.execPath)}:/usr/bin:/bin`, HOME: home, FAKE_SERVER_HOME: srvHome, TMPDIR: dir, ...env } });
  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "r9-lanceur-")); assert.deepEqual(fs.readdirSync(dir), []);
    home = path.join(dir, "home"); srvHome = path.join(dir, "serveur-home"); bin = path.join(dir, "bin"); fs.mkdirSync(home); fs.mkdirSync(srvHome); fs.mkdirSync(bin); fs.mkdirSync(path.join(srvHome, "koyekola-data"));
    // faux ssh : exécute localement la DERNIÈRE argument (la commande distante), entrée standard transmise ; FAKE_FAIL simule un serveur dont Node est introuvable
    fs.writeFileSync(path.join(bin, "ssh"), `#!/bin/bash\nif [ -n "$FAKE_FAIL" ]; then echo "bash: node: command not found" >&2; exit 127; fi\nfor last; do :; done\nexec env HOME="$FAKE_SERVER_HOME" bash -c "$last"\n`, { mode: 0o755 });
    live = path.join(srvHome, "koyekola-data", "KOYEKOLA.db");
    writer = new DatabaseSync(live); writer.exec("PRAGMA journal_mode = WAL; CREATE TABLE users (id INTEGER PRIMARY KEY, n); CREATE TABLE schema_migrations (scope TEXT, version TEXT, name TEXT, checksum TEXT); INSERT INTO schema_migrations VALUES ('marketing', '089', 'x', 'y')");
    for (let i = 0; i < 30; i++) writer.prepare("INSERT INTO users (n) VALUES (?)").run(`u${i}`);
  });
  test("diagnostic : un Node ≥ 22 est trouvé, le compte rendu est enregistré avec son code de sortie ; rien n'est écrit dans le dossier de la base", () => {
    const before = listing(path.join(srvHome, "koyekola-data")); const r = run(["diagnostic", "me@serveur", "-p", "65002"]);
    assert.equal(r.status, 0, r.stdout + r.stderr); assert.match(r.stdout, /Node utilisé sur le serveur : .*node \(v\d+\)/); assert.match(r.stdout, /DIAGNOSTIC \(lecture seule/); assert.match(r.stdout, /migrations marketing : 1 appliquées, dernière « 089 »/);
    const rep = fs.readdirSync(home).find((x) => x.startsWith("RECETTE-R8-")); const txt = fs.readFileSync(path.join(home, rep, "diagnostic.txt"), "utf8"); assert.match(txt, /CODE_SORTIE=0/); assert.match(txt, /DIAGNOSTIC/);
    assert.equal(fs.statSync(path.join(home, rep)).mode & 0o777, 0o700); assert.equal(listing(path.join(srvHome, "koyekola-data")), before, "aucun fichier créé à côté de la base vivante");
  });
  test("échec côté serveur (Node introuvable) : l'erreur est CONSERVÉE dans le rapport et le lanceur s'arrête avec un code ≠ 0", () => {
    const r = run(["diagnostic", "me@serveur"], { FAKE_FAIL: "1" }); assert.notEqual(r.status, 0);
    assert.match(r.stdout + r.stderr, /node: command not found/); assert.match(r.stdout + r.stderr, /le diagnostic n'a pas abouti/);
    const reps = fs.readdirSync(home).filter((x) => x.startsWith("RECETTE-R8-")); const last = fs.readFileSync(path.join(home, reps.sort().pop(), "diagnostic.txt"), "utf8"); assert.match(last, /node: command not found/); assert.match(last, /CODE_SORTIE=127/);
  });
  test("simulation et garde-fous : aucune commande n'est exécutée en simulation ; mode inconnu refusé ; le lanceur ne supprime rien et ne modifie pas la branche r8-recette-outil", () => {
    const s = run(["assistant", "me@serveur", "--simuler"]); assert.equal(s.status, 0, s.stderr); assert.match(s.stdout, /\[simulation\]/); assert.doesNotMatch(s.stdout, /DIAGNOSTIC \(lecture/);
    assert.notEqual(run(["detruire", "me@serveur"]).status, 0);
    const code = fs.readFileSync(L, "utf8"); assert.doesNotMatch(code, /\brm\b|rmdir|unlink|--delete/); assert.match(code, /git -C "\$REPO" show r8-recette-outil:scripts\/recette-r8-preparer\.js/); assert.doesNotMatch(code, /git (checkout|commit|push|merge|branch -[dD])/);
  });

  test("mode sauvegarde : refusé sans confirmation ; avec elle, base cohérente + archive de uploads/ téléchargées, comptes et empreintes contrôlés, manifeste « non prouvée restaurable » ; la base vivante et uploads/ ne sont pas modifiés", () => {
    const up = path.join(srvHome, "koyekola-data", "uploads"); fs.mkdirSync(path.join(up, "videos"), { recursive: true }); for (const f of ["a.png", "b.txt", "videos/c.mp4"]) fs.writeFileSync(path.join(up, f), `contenu ${f}`);
    const refus = run(["sauvegarde", "me@serveur", "--migration-attendue", "089", "--sans-essai-restauration"]); assert.notEqual(refus.status, 0); assert.match(refus.stderr, /--confirmer-sauvegarde/);
    const liveBefore = fs.statSync(live).size, upBefore = fs.readdirSync(up).sort().join(",");
    const wrongMig = run(["sauvegarde", "me@serveur", "--confirmer-sauvegarde", "--sans-essai-restauration"]); assert.notEqual(wrongMig.status, 0); assert.match(wrongMig.stderr, /n'est plus à la migration 071/); assert.ok(!fs.readdirSync(srvHome).some((x) => x.startsWith("RECETTE-R8-")), "rien créé sur le serveur si la précondition échoue");
    const r = run(["sauvegarde", "me@serveur", "--confirmer-sauvegarde", "--migration-attendue", "089", "--sans-essai-restauration"]); assert.equal(r.status, 0, r.stdout + r.stderr); assert.match(r.stdout, /Empreinte sha256 identique au serveur/); assert.match(r.stdout, /uploads : uploads\.tgz sha256 [0-9a-f]{64} · 3 fichier\(s\)/);
    const dirs = fs.readdirSync(home).filter((x) => x.startsWith("RECETTE-R8-")).sort(); const saved = dirs.map((d) => path.join(home, d)).find((d) => fs.existsSync(path.join(d, "MANIFESTE.txt")));
    assert.ok(saved, "dossier de sauvegarde local"); for (const f of ["copie-A.db", "RAPPORT-copie.json", "uploads.tgz", "MANIFESTE.txt"]) assert.ok(fs.existsSync(path.join(saved, f)), f);
    assert.match(fs.readFileSync(path.join(saved, "MANIFESTE.txt"), "utf8"), /NON PROUVÉE RESTAURABLE/); assert.equal(fs.readdirSync(up).sort().join(","), upBefore); assert.equal(fs.statSync(live).size, liveBefore);
    // essai de restauration : refus (sans changer la sauvegarde) si l'empreinte est altérée ou si des fichiers manquent
    const ER = path.join(__dirname, "..", "scripts", "r9", "essai-restauration.js"); const NM = process.env.NODE_PATH || path.join(__dirname, "..", "node_modules");
    const empty = path.join(dir, "dossier-vide"); fs.mkdirSync(empty); assert.notEqual(spawnSync(process.execPath, [ER, empty, "--node-modules", NM], { encoding: "utf8" }).status, 0);
    fs.appendFileSync(path.join(saved, "copie-A.db"), "x"); const bad = spawnSync(process.execPath, [ER, saved, "--code", "HEAD", "--node-modules", NM], { encoding: "utf8" }); assert.notEqual(bad.status, 0); assert.match(bad.stdout, /empreinte/);
    assert.ok(!fs.existsSync(path.join(saved, "RESTAURATION-REUSSIE.txt")), "jamais de succès affiché sur une sauvegarde altérée");
    const code = fs.readFileSync(ER, "utf8"); assert.doesNotMatch(code, /rmSync|unlinkSync|rmdirSync|\bssh\b/);
  });
});
