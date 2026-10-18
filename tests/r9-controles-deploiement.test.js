// R9 — contrôles avant/après déploiement (scripts/r9/controles-deploiement.js) : GET seulement, sortie jamais écrasée, écarts détectés. Serveur HTTP local factice (aucun site réel).
const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");

const S = path.join(__dirname, "..", "scripts", "r9", "controles-deploiement.js");
describe("contrôles de déploiement", () => {
  let server, base, dir, methods = [], titre = "Accueil", sante = '{"statut":"ok"}';
  const run = (...a) => new Promise((resolve) => { const c = spawn(process.execPath, [S, ...a]); let o = "", e = ""; c.stdout.on("data", (d) => (o += d)); c.stderr.on("data", (d) => (e += d)); c.on("close", (status) => resolve({ status, stdout: o, stderr: e })); });   // asynchrone : le serveur factice vit dans ce processus
  before(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "r9-ctrl-")); assert.deepEqual(fs.readdirSync(dir), []);
    server = http.createServer((req, res) => { methods.push(req.method); if (req.url === "/sante") { res.end(sante); return; } if (req.url === "/robots.txt") { res.setHeader("content-type", "text/plain"); res.end("User-agent: *\nSitemap: http://x/sitemap.xml\n"); return; }
      if (req.url === "/sitemap.xml") { res.setHeader("content-type", "application/xml"); res.end("<urlset><url><loc>http://x/</loc></url></urlset>"); return; } if (req.url === "/") { res.setHeader("content-type", "text/html"); res.end(`<html><head><title>${titre}</title><link rel="canonical" href="http://x/"></head></html>`); return; }
      res.statusCode = 404; res.end("non"); });
    await new Promise((r) => server.listen(0, "127.0.0.1", r)); base = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => new Promise((r) => server.close(r)));
  test("capture puis comparaison : aucune différence ; GET uniquement ; la capture n'est jamais écrasée", async () => {
    const f = path.join(dir, "avant.json"); const c = await run("capturer", base, f, "--path", "/", "--path", "/robots.txt", "--path", "/sitemap.xml", "--path", "/absente"); assert.equal(c.status, 0, c.stderr + c.stdout);
    assert.equal((await run("capturer", base, f)).status, 2, "refus d'écraser"); const r = await run("comparer", base, f, "--path", "/", "--path", "/robots.txt", "--path", "/sitemap.xml", "--path", "/absente"); assert.equal(r.status, 0, r.stdout); assert.match(r.stdout, /Aucune différence sur 4 adresse/);
    assert.ok(methods.every((m) => m === "GET"), `méthodes : ${[...new Set(methods)]}`);
  });
  test("un changement de titre ou un /sante non « ok » fait échouer la comparaison", async () => {
    const f = path.join(dir, "avant2.json"); await run("capturer", base, f, "--path", "/"); titre = "Autre titre"; const d = await run("comparer", base, f, "--path", "/"); assert.equal(d.status, 1); assert.match(d.stdout, /DIFFÉRENCE/); titre = "Accueil";
    sante = '{"statut":"degrade"}'; const s = await run("comparer", base, f, "--path", "/"); assert.equal(s.status, 1); assert.match(s.stdout, /PROBLÈME/); sante = '{"statut":"ok"}';
  });
  test("code : aucune méthode d'écriture", () => { const c = fs.readFileSync(S, "utf8"); assert.doesNotMatch(c, /method: "(POST|PUT|DELETE|PATCH)"|rmSync|unlinkSync/); });
});
