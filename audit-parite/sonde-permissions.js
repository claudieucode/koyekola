// Sonde d'audit palier 23 — matrice de permissions sur TOUTES les routes d'administration (serveur de test jetable, aucune donnée de production).
// Chaque route est appelée par 6 profils ; on relève ce que le serveur répond (le serveur, pas la visibilité des boutons).
const fs = require("fs");
const { TEST_KEY } = require("../tests/marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("../tests/helpers");
const routes = JSON.parse(fs.readFileSync(process.env.TMPDIR + "/routes.json", "utf8"))
  .filter((r) => r.f.startsWith("src/marketing/web/") && r.m !== "use" && r.m !== "all" && r.p.startsWith("/") && !r.p.includes("${") && !/^\/(:key|preferences|groupes\/.*)?$/.test(r.p) && !/(public|tracking|visitorsPublic|formsPublic|smsPublic|socialPublic|surveysPublic|webhooks|rss)\.js$/.test(r.f));
const fill = (p) => p.replace(/:(\w+)\(([^)]*)\)/g, (_, n, re) => (/\|/.test(re) ? re.split("|")[0] : "1")).replace(/:type/g, "page").replace(/:key/g, "viewer").replace(/:(\w+)/g, "1");
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db();
  const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
  await boss.post("/marketing/pages", { name: "Page Audit", template: "vente" });
  await boss.post("/marketing/site-web/articles", { title: "Article Audit" });
  const persona = async (role) => { const c = await newStudent(srv); if (role) db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), ?)").run(orgId, c.email, role); return c; };
  const who = { anon: new Client(srv.base), eleve: await persona(null), viewer: await persona("viewer"), contributor: await persona("contributor"), author: await persona("author"), editor: await persona("editor") };
  const out = [];
  const classify = (r) => (r.status === 302 && /\/connexion/.test(r.location || "")) ? "LOGIN" : String(r.status) + (r.status === 302 ? ">" + (r.location || "").replace(/\?.*/, "").slice(0, 40) : "");
  for (const r of routes) {
    const path = "/marketing" + fill(r.p);
    const row = { m: r.m.toUpperCase(), p: r.p, f: r.f.replace("src/marketing/web/", "") };
    for (const [k, c] of Object.entries(who)) {
      try {
        const res = r.m === "get" ? await c.get(path) : await c.request(path, { method: r.m.toUpperCase(), form: r.m === "put" ? undefined : {}, json: r.m === "put" ? {} : undefined, headers: { Origin: srv.base } });
        row[k] = classify(res);
      } catch (e) { row[k] = "ERR " + String(e.message).slice(0, 30); }
    }
    out.push(row);
  }
  fs.writeFileSync(process.env.TMPDIR + "/matrice.json", JSON.stringify(out, null, 1));
  const L = srv.log(); fs.writeFileSync(process.env.TMPDIR + "/matrice-serveur.log", L.slice(-6000));
  db.close(); await srv.stop(); console.log("routes", out.length);
})().catch((e) => { console.error("ERR", e); process.exit(1); });
