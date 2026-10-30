// KOLAKISA — PROGRAMME 20.4 dans FIREFOX (moteur Gecko), piloté par le protocole standard WebDriver BiDi : aucun module à installer.
// Test de fumée réel de la bibliothèque de modèles : chargement sans erreur JavaScript, cartes et vignettes, recherche côté serveur, « Afficher plus », détail et aperçu, fenêtre d'importation avec opérations prévues,
// Échap, absence de défilement horizontal. Ignoré avec un message explicite si Firefox n'est pas installé ou ne démarre pas (jamais un succès silencieux).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const FIREFOX = process.env.FIREFOX_PATH || ["/Applications/Firefox.app/Contents/MacOS/firefox", "/usr/bin/firefox", "/usr/lib/firefox/firefox"].find((p) => fs.existsSync(p));
const SKIP = !FIREFOX || typeof WebSocket !== "function" ? "Firefox absent (ou Node sans WebSocket) : parcours Firefox non exécuté sur cette machine" : false;

const freePort = () => new Promise((resolve) => { const s = net.createServer().listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => resolve(port)); }); });

class Bidi {
  constructor(ws) { this.ws = ws; this.id = 0; this.waiting = new Map(); this.logs = []; ws.addEventListener("message", (m) => this.onMessage(JSON.parse(m.data))); }
  onMessage(msg) {
    if (msg.type === "event" && msg.method === "log.entryAdded") this.logs.push(msg.params);
    const w = this.waiting.get(msg.id);
    if (!w) return;
    this.waiting.delete(msg.id);
    if (msg.type === "success") w.resolve(msg.result); else w.reject(new Error(`${msg.error} : ${msg.message}`));
  }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { this.waiting.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); }); }
}
const plain = (rv) => { // valeur distante BiDi → valeur JavaScript
  if (!rv) return undefined;
  switch (rv.type) {
    case "string": case "number": case "boolean": return rv.value;
    case "null": case "undefined": return null;
    case "array": return (rv.value || []).map(plain);
    case "object": return Object.fromEntries((rv.value || []).map(([k, v]) => [typeof k === "string" ? k : k.value, plain(v)]));
    default: return rv.value;
  }
};

describe("Firefox — bibliothèque de modèles (WebDriver BiDi)", { skip: SKIP }, () => {
  let srv, boss, child, bidi, context, profile, skipReason = null, A;
  const TP = "/marketing/site-web/templates";
  const run = async (expression) => {
    const r = await bidi.send("script.evaluate", { expression: `(async () => { const out = await (${expression}); return typeof out === "string" ? out : JSON.stringify(out); })()`, target: { context }, awaitPromise: true });
    if (r.type === "exception") throw new Error(`Exception dans la page : ${r.exceptionDetails.text}`);
    const v = plain(r.result);
    try { return JSON.parse(v); } catch { return v; }
  };
  const go = async (url) => { await bidi.send("browsingContext.navigate", { context, url, wait: "complete" }); };
  const waitFor = async (expression, ms = 20000) => { const end = Date.now() + ms; for (;;) { const v = await run(expression).catch(() => false); if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${expression.slice(0, 120)}`); await new Promise((r) => setTimeout(r, 150)); } };
  const idle = () => waitFor(`document.querySelector("[data-tp-grid]").getAttribute("aria-busy") === "false"`);
  const jsErrors = () => bidi.logs.filter((l) => l.level === "error" && l.type === "javascript").map((l) => l.text);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const db = srv.db(); const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Alpha', 'alpha', '{}')").run(orgId).lastInsertRowid); db.close();
    const port = await freePort();
    profile = fs.mkdtempSync(path.join(os.tmpdir(), "kb-firefox-"));
    child = spawn(FIREFOX, ["--headless", "--no-remote", `--remote-debugging-port=${port}`, "--profile", profile, "about:blank"], { stdio: "ignore" });
    let ws = null;
    for (let i = 0; i < 80 && !ws; i++) {
      await new Promise((r) => setTimeout(r, 250));
      ws = await new Promise((resolve) => { const w = new WebSocket(`ws://127.0.0.1:${port}/session`); w.addEventListener("open", () => resolve(w)); w.addEventListener("error", () => resolve(null)); });
    }
    if (!ws) { skipReason = "Firefox n'a pas ouvert son interface WebDriver BiDi"; return; }
    bidi = new Bidi(ws);
    await bidi.send("session.new", { capabilities: { alwaysMatch: {} } });
    await bidi.send("session.subscribe", { events: ["log.entryAdded"] });
    context = (await bidi.send("browsingContext.getTree", {})).contexts[0].context;
    await go(`${srv.base}/connexion`);
    for (const [name, value] of boss.cookies) await bidi.send("storage.setCookie", { cookie: { name, value: { type: "string", value }, domain: "localhost", path: "/", httpOnly: true, sameSite: "lax" }, partition: { type: "context", context } });
  });
  after(async () => { try { if (bidi) bidi.ws.close(); } catch { /* déjà fermé */ } if (child) child.kill("SIGKILL"); await srv.stop(); try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* ignoré */ } });

  test("la bibliothèque se charge dans Firefox : onglets, 12 cartes, vignettes vivantes, aucune erreur JavaScript, aucun défilement horizontal", async (t) => {
    if (skipReason) return t.skip(skipReason);
    await go(`${srv.base}${TP}?site=${A}`); await waitFor(`!document.querySelector("[data-tp-main]").hidden`); await idle();
    const info = await run(`({ ua: navigator.userAgent, tabs: document.querySelectorAll("[data-tp-source]").length, cards: document.querySelectorAll(".mk-pt-card").length, over: document.documentElement.scrollWidth - window.innerWidth })`);
    assert.match(info.ua, /Firefox\/1\d\d/); assert.equal(info.tabs, 7); assert.equal(info.cards, 12); assert.ok(info.over <= 1, `défilement horizontal : ${info.over}`);
    await waitFor(`(() => { const f = document.querySelector(".mk-pt-thumb iframe"); try { return f.contentDocument && /lp-main/.test(f.contentDocument.body.innerHTML); } catch { return false; } })()`);
    assert.deepEqual(jsErrors(), []);
  });

  test("recherche côté serveur, onglet Pages et « Afficher plus » dans Firefox", async (t) => {
    if (skipReason) return t.skip(skipReason);
    await go(`${srv.base}${TP}?site=${A}`); await waitFor(`!document.querySelector("[data-tp-main]").hidden`); await idle();
    await run(`(() => { const i = document.querySelector("[data-tp-search]"); i.value = "restaurant"; i.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
    await waitFor(`document.querySelector("[data-tp-grid]").getAttribute("aria-busy") === "false" && [...document.querySelectorAll(".mk-pt-card h3")].some((h) => h.textContent === "Restaurant") && document.querySelectorAll(".mk-pt-card").length === 1`);
    await run(`(() => { const i = document.querySelector("[data-tp-search]"); i.value = ""; i.dispatchEvent(new Event("input", { bubbles: true })); document.querySelector('[data-tp-source="page"]').click(); return true; })()`);
    await new Promise((r) => setTimeout(r, 600)); // la saisie vidée déclenche une recherche différée (250 ms) : on la laisse aboutir avant de poursuivre
    await waitFor(`document.querySelector('[data-tp-source="page"]').getAttribute("aria-selected") === "true" && document.querySelectorAll(".mk-pt-card").length === 12 && document.querySelector("[data-tp-grid]").getAttribute("aria-busy") === "false"`);
    await run(`document.querySelector("[data-tp-more]").click()`); await waitFor(`document.querySelectorAll(".mk-pt-card").length === 24`);
    assert.deepEqual(jsErrors(), []);
  });

  test("détail, aperçu et fenêtre d'importation (opérations prévues) dans Firefox ; Échap ferme la fenêtre", async (t) => {
    if (skipReason) return t.skip(skipReason);
    await go(`${srv.base}${TP}?site=${A}`); await waitFor(`!document.querySelector("[data-tp-main]").hidden`); await idle();
    await run(`document.querySelector('.mk-pt-card button[aria-label="Détails de Restaurant"]').click()`);
    await waitFor(`document.querySelector("[data-tp-dlg-detail]").open && /Compatible/.test(document.querySelector("[data-tp-det-body]").innerText)`);
    await run(`document.querySelector("[data-tp-dlg-detail]").close()`);
    await run(`document.querySelector('.mk-pt-card button[aria-label="Aperçu de Restaurant"]').click()`);
    await waitFor(`document.querySelector("[data-tp-dlg-preview]").open && document.querySelectorAll("[data-tp-prev-tabs] button").length === 4`);
    await run(`document.querySelector("[data-tp-dlg-preview]").close()`);
    await run(`document.querySelector('.mk-pt-card button[aria-label="Utiliser ce modèle : Restaurant"]').click()`);
    await waitFor(`document.querySelector("[data-tp-dlg-import]").open && document.querySelectorAll("[data-tp-imp-ops] li").length >= 4 && !document.querySelector("[data-tp-imp-ok]").disabled`);
    const ops = await run(`document.querySelector("[data-tp-imp-ops]").innerText`); assert.match(ops, /Créer la page « Accueil » en brouillon/);
    await bidi.send("input.performActions", { context, actions: [{ type: "key", id: "kb", actions: [{ type: "keyDown", value: "\uE00C" }, { type: "keyUp", value: "\uE00C" }] }] });
    await waitFor(`!document.querySelector("[data-tp-dlg-import]").open`);
    assert.deepEqual(jsErrors(), []);
  });
});
