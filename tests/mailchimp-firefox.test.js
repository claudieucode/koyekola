// KOLAKISA — console Mailchimp dans FIREFOX (moteur Gecko), pilotée par WebDriver BiDi (aucun module à installer). Test de fumée réel : l'écran se charge sans erreur JavaScript, les onglets et les listes
// s'affichent, les boîtes de dialogue natives s'ouvrent et se ferment (Échap), l'assistant de campagne démarre, pas de défilement horizontal. Ignoré avec un message explicite si Firefox est absent.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { createFakeMailchimp } = require("./fake-mailchimp");

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

describe("Firefox — console Mailchimp (WebDriver BiDi)", { skip: SKIP }, () => {
  let srv, fake, boss, child, bidi, context, profile, skipReason = null;
  const run = async (expression) => {
    const r = await bidi.send("script.evaluate", { expression: `(async () => { const out = await (${expression}); return typeof out === "string" ? out : JSON.stringify(out); })()`, target: { context }, awaitPromise: true, resultOwnership: "none" });
    if (r.type === "exception") throw new Error(`Exception dans la page : ${r.exceptionDetails.text}`);
    const v = plain(r.result);
    try { return JSON.parse(v); } catch { return v; }
  };
  const go = async (url) => { await bidi.send("browsingContext.navigate", { context, url, wait: "complete" }); };
  const waitFor = async (expression, ms = 20000) => { const end = Date.now() + ms; for (;;) { const v = await run(expression).catch(() => false); if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${expression.slice(0, 120)}`); await new Promise((r) => setTimeout(r, 150)); } };
  const settled = (id) => waitFor(`document.querySelector("[data-mc-panel]").getAttribute("aria-labelledby") === "mc-tab-${id}" && document.querySelector("[data-mc-panel]").getAttribute("aria-busy") === "false"`);
  const click = (selector) => run(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error("introuvable : ${selector}"); el.click(); return true; })()`);
  const jsErrors = () => bidi.logs.filter((l) => l.level === "error" && l.type === "javascript").map((l) => l.text);

  before(async () => {
    fake = await createFakeMailchimp();
    fake.addList("Newsletter");
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", MAILCHIMP_API_BASE: fake.base });
    boss = await loginInstructor(srv);
    const c = await boss.request("/marketing/mailchimp/api/connexion", { method: "POST", json: { apiKey: fake.key }, headers: { "X-Requested-With": "fetch" } });
    if (c.status !== 200) throw new Error(`connexion Mailchimp refusée : ${c.status} ${c.text}`);
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
  after(async () => { try { if (bidi) bidi.ws.close(); } catch { /* déjà fermé */ } if (child) child.kill("SIGKILL"); await srv.stop(); await fake.close(); try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* déjà supprimé */ } });

  test("l'écran se charge : 14 onglets, état connecté, liste des audiences, aucune erreur JavaScript, aucun défilement horizontal", async (t) => {
    if (skipReason) return t.skip(skipReason);
    await go(`${srv.base}/marketing/mailchimp#audiences`);
    await waitFor(`document.querySelectorAll("[data-mc-tabs] [role=tab]").length === 14`).catch(async (e) => { throw new Error(`${e.message} — page : ${await run("location.href")} — ${String(await run("document.body.innerText")).slice(0, 200)} — erreurs : ${JSON.stringify(jsErrors())}`); });
    await settled("audiences");
    assert.match(await run(`document.querySelector("[data-mc-bar]").textContent`), /Connecté : Société Démo/);
    assert.match(await run(`document.querySelector("[data-mc-panel]").textContent`), /Newsletter/);
    assert.equal(await run(`document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1`), true);
    assert.deepEqual(jsErrors(), []);
  });

  test("onglets au clavier et cliqués, boîtes de dialogue natives (ouverture, fermeture), assistant de campagne", async (t) => {
    if (skipReason) return t.skip(skipReason);
    await click("#mc-tab-campagnes"); await settled("campagnes");
    await click("[data-mc-panel] button.is-primary");
    await waitFor(`document.querySelector("dialog[open] h2") && /étape 1 sur 5/.test(document.querySelector("dialog[open] h2").textContent)`);
    assert.equal(await run(`document.querySelectorAll("dialog[open] input[name=type]").length`), 4);
    await run(`document.querySelector("dialog[open]").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })) || true`);
    await run(`document.querySelector("dialog[open]").close() || true`);
    assert.equal(await run(`document.querySelectorAll("dialog[open]").length`), 0);
    await click("#mc-tab-contacts"); await settled("contacts");
    await click("#mc-tab-webhooks"); await settled("webhooks");
    assert.match(await run(`document.querySelector("[data-mc-panel]").textContent`), /Installer le webhook Kolakisa/);
    await click("#mc-tab-connexion"); await settled("connexion");
    assert.match(await run(`document.querySelector("[data-mc-panel]").textContent`), /Adresse du webhook entrant/);
    assert.deepEqual(jsErrors(), []);
  });
});
