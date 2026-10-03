// KOLAKISA SEO CORE — lot 5 : intégrations Google (Search Console, Analytics 4, PageSpeed Insights).
// Google est simulé par un faux serveur local qui vérifie réellement la signature du jeton JWT (RS256) avec la clé publique
// du compte de service : le chemin complet (chiffrement de la clé, signature, échange de jeton, requêtes) est exercé.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const crypto = require("node:crypto");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("SEO CORE : intégrations Google", () => {
  let srv, prof, google;
  const calls = [];
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const SA = JSON.stringify({ type: "service_account", client_email: "seo@kolakisa-test.iam.gserviceaccount.com", private_key: privateKey.export({ type: "pkcs8", format: "pem" }) });
  const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };
  const page = () => prof.get("/formateur/seo/integrations").then((r) => r.text);
  const msgOf = (r) => decodeURIComponent(String(r.location || "").split(/[?&](?:msg|err)=/)[1] || "");

  before(async () => {
    google = http.createServer((req, res) => {
      let body = "";
      req.on("data", (d) => (body += d));
      req.on("end", () => {
        calls.push({ url: req.url, auth: req.headers.authorization || "", body });
        const send = (status, data) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(data)); };
        if (req.url === "/token") {
          const assertion = new URLSearchParams(body).get("assertion") || "";
          const [h, p, s] = assertion.split(".");
          const ok = crypto.createVerify("RSA-SHA256").update(`${h}.${p}`).verify(publicKey, Buffer.from(s || "", "base64url"));
          const claims = ok ? JSON.parse(Buffer.from(p, "base64url").toString()) : {};
          return ok && claims.iss === "seo@kolakisa-test.iam.gserviceaccount.com" ? send(200, { access_token: `jeton-${claims.scope.split("/").pop()}`, expires_in: 3600 }) : send(400, { error: "invalid_grant", error_description: "Invalid JWT Signature." });
        }
        if (req.url.startsWith("/gsc/sites/")) {
          if (!req.url.includes(encodeURIComponent("sc-domain:kolakisa.test"))) return send(403, { error: { message: "User does not have sufficient permission for site." } });
          if (req.headers.authorization !== "Bearer jeton-webmasters.readonly") return send(401, { error: { message: "bad token" } });
          const b = JSON.parse(body);
          const previous = b.endDate < new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10);
          const dim = (b.dimensions || [])[0];
          const rows = dim === "page"
            ? previous ? [{ keys: ["/blog/recul"], clicks: 40, impressions: 800, ctr: 0.05, position: 4 }, { keys: ["/blog/monte"], clicks: 2, impressions: 100, ctr: 0.02, position: 12 }]
              : [{ keys: ["/blog/recul"], clicks: 10, impressions: 700, ctr: 0.014, position: 6 }, { keys: ["/blog/monte"], clicks: 30, impressions: 300, ctr: 0.1, position: 5 }]
            : previous ? [{ keys: ["excel"], clicks: 20, impressions: 400, ctr: 0.05, position: 5 }]
              : [{ keys: ["excel"], clicks: 3, impressions: 600, ctr: 0.005, position: 9.4 }, { keys: ["formation tableur"], clicks: 1, impressions: 80, ctr: 0.0125, position: 14 }];
          return send(200, { rows });
        }
        if (req.url === "/ga4/properties/123456789:runReport") {
          if (req.headers.authorization !== "Bearer jeton-analytics.readonly") return send(403, { error: { message: "denied" } });
          const b = JSON.parse(body);
          const dim = b.dimensions && b.dimensions[0].name;
          if (!dim) return send(200, { rows: [{ metricValues: [{ value: "321" }, { value: "456" }, { value: "789" }, { value: "12" }] }] });
          if (dim === "pagePath") return send(200, { rows: [{ dimensionValues: [{ value: "/cours/excel" }], metricValues: [{ value: "150" }, { value: "90" }] }] });
          return send(200, { rows: [{ dimensionValues: [{ value: "Organic Search" }], metricValues: [{ value: "200" }] }] });
        }
        if (req.url.startsWith("/psi")) {
          const u = new URL(req.url, "http://x");
          if (u.searchParams.get("key") === "mauvaise") return send(400, { error: { message: "API key not valid. Please pass a valid API key." } });
          return send(200, {
            loadingExperience: u.searchParams.get("strategy") === "mobile" ? { metrics: { LARGEST_CONTENTFUL_PAINT_MS: { percentile: 2100, category: "FAST" }, CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 5, category: "FAST" } } } : {},
            lighthouseResult: { lighthouseVersion: "12.0.0", categories: { performance: { score: 0.87 } }, audits: {
              "largest-contentful-paint": { numericValue: 2450 }, "cumulative-layout-shift": { numericValue: 0.012 }, "total-blocking-time": { numericValue: 130 },
              "render-blocking-resources": { title: "Éliminer les ressources qui bloquent le rendu", score: 0.4, details: { type: "opportunity", overallSavingsMs: 600 } } } },
          });
        }
        send(404, { error: { message: "inconnu" } });
      });
    });
    await new Promise((r) => google.listen(0, "127.0.0.1", r));
    const g = `http://127.0.0.1:${google.address().port}`;
    srv = await startServer({
      ENCRYPTION_KEY: crypto.randomBytes(32).toString("hex"), SITE_URL: "https://kolakisa.test",
      SEO_GOOGLE_TOKEN_URL: `${g}/token`, SEO_GSC_URL: `${g}/gsc`, SEO_GA4_URL: `${g}/ga4`, SEO_PSI_URL: `${g}/psi`,
    });
    prof = await loginInstructor(srv);
  });
  after(async () => { await srv.stop(); google.close(); });

  test("sans configuration : « Non connecté », aucun chiffre affiché", async () => {
    const html = await page();
    assert.equal((html.match(/Non connecté/g) || []).length, 2);
    assert.match(html, /Disponible sans clé/);
    assert.match(html, /Aucune analyse pour l'instant/);
    assert.doesNotMatch(html, /Utilisateurs actifs|Position moyenne/);
  });

  test("clé invalide refusée avant tout envoi ; propriété refusée par Google → message précis, statut « Erreur »", async () => {
    let r = await prof.post("/formateur/seo/integrations/search_console", { property: "sc-domain:kolakisa.test", service_account: '{"type":"user"}' });
    assert.match(msgOf(r), /pas une clé de compte de service/);
    assert.equal(q("SELECT COUNT(*) n FROM seo_integrations")[0].n, 0);
    r = await prof.post("/formateur/seo/integrations/search_console", { property: "sc-domain:autre.test", service_account: SA });
    assert.match(msgOf(r), /Accès refusé par Search Console : ajoutez l'adresse du compte de service/);
    assert.match(await page(), /Erreur de connexion/);
  });

  test("Search Console : clé chiffrée en base, jeton signé vérifié, totaux et analyses réelles", async () => {
    const r = await prof.post("/formateur/seo/integrations/search_console", { property: "sc-domain:kolakisa.test", service_account: "" });
    assert.match(msgOf(r), /connecté : connexion vérifiée/);
    const stored = q("SELECT secret FROM seo_integrations WHERE name = 'search_console'")[0].secret;
    assert.match(stored, /^v1:/);
    assert.equal(stored.includes("PRIVATE KEY"), false, "la clé n'est jamais stockée en clair");
    const html = await page();
    assert.match(html, /Connecté/);
    assert.match(html, /<span class="seo-score-value">40<\/span><span class="seo-score-label">Clics \(-2\)/);
    assert.match(html, /Pages en progression[\s\S]*\/blog\/monte[\s\S]*\+28/);
    assert.match(html, /Pages en recul[\s\S]*\/blog\/recul[\s\S]*-30/);
    assert.match(html, /faible taux de clic[\s\S]*excel/);
    assert.match(html, /presque en première page[\s\S]*formation tableur/);
    assert.equal(html.includes("PRIVATE KEY"), false, "la clé n'est jamais renvoyée au navigateur");
    // cache : un second affichage ne rappelle pas Google, « Actualiser » oui
    const before = calls.length;
    await page();
    assert.equal(calls.length, before);
    await prof.get("/formateur/seo/integrations?actualiser=1");
    assert.ok(calls.length > before);
  });

  test("Analytics 4 : rapport réel, identifiant invalide refusé", async () => {
    let r = await prof.post("/formateur/seo/integrations/analytics", { property_id: "abc", service_account: SA });
    assert.match(msgOf(r), /Identifiant de propriété GA4 invalide/);
    r = await prof.post("/formateur/seo/integrations/analytics", { property_id: "123456789", service_account: SA });
    assert.match(msgOf(r), /Google Analytics 4 connecté/);
    const html = await page();
    assert.match(html, /321<\/span><span class="seo-score-label">Utilisateurs actifs/);
    assert.match(html, /Organic Search/);
    assert.match(html, /\/cours\/excel/);
  });

  test("PageSpeed : mesures de labo et visiteurs réels enregistrées ; données absentes → « Non disponible » ; clé refusée", async () => {
    await prof.post("/formateur/seo/integrations/pagespeed/analyser", { path: "/", strategy: "mobile" });
    await prof.post("/formateur/seo/integrations/pagespeed/analyser", { path: "/catalogue", strategy: "desktop" });
    assert.ok(calls.some((c) => c.url.includes(encodeURIComponent("https://kolakisa.test/catalogue"))));
    const html = await page();
    assert.match(html, /87 \/ 100/);
    assert.match(html, /2,45 s/);
    assert.match(html, /LCP 2,1 s \(bon\)/);
    assert.match(html, /Non disponible \(pas assez de visites mesurées par Google\)/);
    assert.match(html, /Éliminer les ressources qui bloquent le rendu \(≈ 600 ms\)/);
    await prof.post("/formateur/seo/integrations/pagespeed", { api_key: "mauvaise" });
    const r = await prof.post("/formateur/seo/integrations/pagespeed/analyser", { path: "/", strategy: "mobile" });
    assert.match(msgOf(r), /Clé d'API PageSpeed refusée par Google/);
    assert.match(await page(), /Erreur avec la clé/);
  });

  test("déconnexion, journal des modifications (sans la clé), accès refusé aux élèves", async () => {
    await prof.post("/formateur/seo/integrations/analytics", { action: "deconnecter" });
    assert.equal(q("SELECT COUNT(*) n FROM seo_integrations WHERE name = 'analytics'")[0].n, 0);
    const log = q("SELECT old_value, new_value FROM seo_changes WHERE entity_type = 'integration'");
    assert.ok(log.length >= 3);
    assert.ok(log.every((l) => !String(l.new_value).includes("PRIVATE") && !String(l.new_value).includes("mauvaise")));
    const student = await newStudent(srv);
    const denied = await student.get("/formateur/seo/integrations");
    assert.notEqual(denied.status, 200);
  });
});
