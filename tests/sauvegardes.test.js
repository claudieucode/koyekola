// Sauvegardes (audit B3) : copie automatique quotidienne de la base, copie à la demande, téléchargement de la base
// et des fichiers envoyés (archive .tar) pour en garder une copie hors du serveur. Réservé au formateur.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { tarHeader } = require("../src/services/backups");

const B = "/formateur/gestion/sauvegardes";
const raw = (srv, client, url) => fetch(srv.base + url, { headers: { cookie: [...client.cookies].map(([k, v]) => `${k}=${v}`).join("; ") } });

// Lecture d'une archive tar : [{ name, content }]
function untar(buf) {
  const out = [];
  for (let at = 0; at + 512 <= buf.length;) {
    const h = buf.subarray(at, at + 512);
    if (h.every((b) => b === 0)) break;
    const str = (o, l) => h.subarray(o, o + l).toString("utf8").replace(/\0.*$/s, "");
    const size = parseInt(str(124, 12), 8);
    const prefix = str(345, 155);
    out.push({ name: (prefix ? prefix + "/" : "") + str(0, 100), content: buf.subarray(at + 512, at + 512 + size) });
    at += 512 + Math.ceil(size / 512) * 512;
  }
  return out;
}

describe("sauvegardes", () => {
  let srv, prof;
  before(async () => { srv = await startServer({ SAUVEGARDE_AUTO: "1", SAUVEGARDE_DELAI_MS: "300" }); prof = await loginInstructor(srv); });
  after(() => srv.stop());

  test("copie automatique faite peu après le démarrage, listée et téléchargeable (vraie base SQLite)", async () => {
    const dir = path.join(srv.dir, "data", "backups");
    for (let i = 0; i < 50 && !(fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f.startsWith("KOYEKOLA-auto-"))); i++) await new Promise((r) => setTimeout(r, 100));
    const name = fs.readdirSync(dir).find((f) => f.startsWith("KOYEKOLA-auto-"));
    assert.ok(name, "copie automatique créée");
    const page = (await prof.get(B)).text;
    assert.match(page, /<h1>Sauvegardes<\/h1>/);
    assert.match(page, /Automatique/);
    assert.doesNotMatch(page, /Invalid Date/);
    assert.match(page, /<td data-label="Date">\d{1,2} [a-zéû.]+ \d{4}/);
    assert.match(page, /Gardez une copie hors du serveur/);
    const r = await raw(srv, prof, `${B}/${name}`);
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-disposition"), /attachment/);
    const body = Buffer.from(await r.arrayBuffer());
    assert.equal(body.subarray(0, 15).toString(), "SQLite format 3");
  });

  test("« Sauvegarder maintenant » : nouvelle copie manuelle, message de confirmation", async () => {
    const r = await prof.post(B, {});
    assert.equal(r.location, B);
    const page = (await prof.get(B)).text;
    assert.match(page, /Sauvegarde « KOYEKOLA-[0-9-]+\.db » créée/);
    assert.match(page, /Manuelle/);
  });

  test("seuls les fichiers du dossier des sauvegardes sont téléchargeables", async () => {
    for (const bad of ["..%2FKOYEKOLA.db", "KOYEKOLA.db", "inexistant.db", "x.txt", "%2E%2E%2F%2E%2E%2Fserver.js"]) {
      assert.equal((await raw(srv, prof, `${B}/${bad}`)).status, 404, bad);
    }
  });

  test("archive des fichiers envoyés : chaque fichier, avec son contenu exact", async () => {
    const up = path.join(srv.dir, "uploads");
    fs.mkdirSync(path.join(up, "blog", "sous-dossier-au-nom-tres-long-".repeat(3)), { recursive: true });
    fs.writeFileSync(path.join(up, "blog", "image.png"), Buffer.from([1, 2, 3, 4, 5]));
    const long = path.join("blog", "sous-dossier-au-nom-tres-long-".repeat(3), "fichier-au-nom-assez-long-pour-depasser-cent-caracteres.txt");
    fs.writeFileSync(path.join(up, long), "contenu".repeat(200));
    fs.writeFileSync(path.join(up, "blog", "vide.txt"), "");
    assert.match((await prof.get(B)).text, /Télécharger tous les fichiers/);
    const r = await raw(srv, prof, `${B}/fichiers.tar`);
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("content-type"), "application/x-tar");
    const files = untar(Buffer.from(await r.arrayBuffer()));
    const byName = Object.fromEntries(files.map((f) => [f.name, f.content]));
    assert.deepEqual([...byName["uploads/blog/image.png"]], [1, 2, 3, 4, 5]);
    assert.equal(byName[`uploads/${long.split(path.sep).join("/")}`].toString(), "contenu".repeat(200));
    assert.equal(byName["uploads/blog/vide.txt"].length, 0);
  });

  test("en-tête tar : somme de contrôle valide (lisible par les outils standard)", () => {
    const h = tarHeader("uploads/a.txt", 3, Date.now());
    const stored = parseInt(h.subarray(148, 154).toString(), 8);
    const copy = Buffer.from(h);
    copy.fill(" ", 148, 156);
    assert.equal(stored, copy.reduce((n, b) => n + b, 0));
  });

  test("réservé au formateur : un élève ou un visiteur n'accède ni à la page ni aux fichiers", async () => {
    const s = await newStudent(srv);
    for (const url of [B, `${B}/fichiers.tar`]) {
      assert.notEqual((await s.get(url)).status, 200, url);
      assert.notEqual((await fetch(srv.base + url, { redirect: "manual" })).status, 200, url);
    }
  });

  test("navigation du Centre de gestion : rubrique « Sauvegardes »", async () => {
    assert.match((await prof.get("/formateur/gestion")).text, /href="\/formateur\/gestion\/sauvegardes"/);
  });
});
