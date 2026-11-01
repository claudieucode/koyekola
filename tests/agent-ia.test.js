// Assistant IA des visiteurs (ElevenLabs Agents) : présent sur les pages publiques du site principal, absent des espaces privés,
// des pages de connexion/panier/paiement et des sites créés ; aucun script tiers avant le clic ; micro autorisé pour la page seulement ; aucune clé API dans le dépôt.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const agentIa = require("../src/config/agentIa");

const ID = agentIa.DEFAULT_AGENT_ID;
const has = (html) => /data-kb-agent[\s>]/.test(html);

describe("Assistant IA : configuration", () => {
  test("identifiant : agent par défaut, remplaçable, désactivable, jamais une valeur mal formée", () => {
    assert.equal(agentIa.agentId({}), ID);
    assert.equal(agentIa.agentId({ ELEVENLABS_AGENT_ID: "agent_abcdefghij123456" }), "agent_abcdefghij123456");
    assert.equal(agentIa.agentId({ ELEVENLABS_AGENT_ID: "off" }), null);
    assert.equal(agentIa.agentId({ ELEVENLABS_AGENT_ID: "" }), null);
    assert.equal(agentIa.agentId({ ELEVENLABS_AGENT_ID: '"><script>alert(1)</script>' }), null);
  });
  test("jamais sur un site créé ni sur une page privée", () => {
    assert.equal(agentIa.idFor({ path: "/" }, {}), ID);
    assert.equal(agentIa.idFor({ path: "/", kwSite: { id: 3 } }, {}), null);
    for (const p of ["/formateur", "/formateur/cours", "/connexion", "/inscription", "/panier", "/commande/12", "/paiement", "/mon-compte", "/marketing/pages", "/mes-cours", "/apprendre/x/y"]) assert.equal(agentIa.idFor({ path: p }, {}), null, p);
    for (const p of ["/", "/catalogue", "/faq", "/contact", "/a-propos", "/blog", "/cookies", "/categorie/design"]) assert.equal(agentIa.idFor({ path: p }, {}), ID, p);
  });
  test("le script du widget est figé (version exacte + empreinte SRI)", () => {
    assert.match(agentIa.WIDGET_SCRIPT.src, /^https:\/\/unpkg\.com\/@elevenlabs\/convai-widget-embed@\d+\.\d+\.\d+\/dist\/index\.js$/);
    assert.match(agentIa.WIDGET_SCRIPT.integrity, /^sha384-[A-Za-z0-9+/]{64}$/);
  });
  test("aucune clé API ElevenLabs dans les fichiers suivis par Git", () => {
    const root = path.join(__dirname, "..");
    const files = execFileSync("git", ["ls-files", "-z"], { cwd: root }).toString().split("\0").filter(Boolean);
    const bad = [];
    for (const f of files) {
      if (/\.(png|jpe?g|gif|webp|ico|woff2?|pdf|zip|mp4|mp3)$/i.test(f) || !fs.existsSync(path.join(root, f))) continue;
      let t; try { t = fs.readFileSync(path.join(root, f), "utf8"); } catch { continue; }
      if (/\bsk_[a-f0-9]{40,}\b/.test(t)) bad.push(f);
    }
    assert.deepEqual(bad, []);
  });
});

describe("Assistant IA : pages du site", () => {
  let srv, boss;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); });
  after(async () => { if (srv) await srv.stop(); });
  const anon = (p) => fetch(srv.base + p, { redirect: "manual" }).then(async (r) => ({ status: r.status, headers: r.headers, text: await r.text() }));

  test("présent sur les pages publiques : accueil, catalogue, FAQ, contact, à propos, cookies", async () => {
    for (const p of ["/", "/catalogue", "/faq", "/contact", "/a-propos", "/cookies"]) {
      const r = await anon(p);
      assert.equal(r.status, 200, p);
      assert.ok(has(r.text), `widget absent de ${p}`);
      assert.ok(r.text.includes(`data-agent-id="${ID}"`), p);
      assert.ok(r.text.includes("/css/agent-ia.css"), p);
    }
  });
  test("aucun script ni élément tiers avant le clic (vie privée)", async () => {
    const r = await anon("/");
    assert.ok(!/<script[^>]+src="https:\/\/unpkg\.com/.test(r.text), "script unpkg chargé d'emblée");
    assert.ok(!/<elevenlabs-convai/.test(r.text), "widget injecté d'emblée");
    assert.ok(!/elevenlabs\.io/.test(r.text.replace(/<p class="kb-agent-note"[^>]*>.*?<\/p>/s, "")), "requête ElevenLabs d'emblée");
  });
  test("absent des pages de connexion, d'inscription, de panier et des espaces d'administration", async () => {
    for (const p of ["/connexion", "/inscription", "/panier"]) { const r = await anon(p); assert.ok(!has(r.text), `widget présent sur ${p}`); }
    for (const p of ["/formateur", "/formateur/cours/nouveau", "/formateur/gestion"]) {
      const r = await boss.get(p);
      assert.ok(r.status === 200 || r.status === 302 || r.status === 404, p);
      assert.ok(!has(r.text || ""), `widget présent sur ${p}`);
    }
  });
  test("la page déclare l'assistant et le micro n'est autorisé que pour la page elle-même", async () => {
    const c = await anon("/cookies");
    assert.match(c.text, /Assistant IA \(facultatif\)/);
    assert.match(c.text, /unpkg\.com/);
    const r = await anon("/");
    assert.match(r.headers.get("permissions-policy"), /microphone=\(self\)/);
    assert.match(r.headers.get("permissions-policy"), /camera=\(\)/);
  });
});
