// KOLAKISA — l'éditeur d'articles et les pages publiques dans FIREFOX (moteur Gecko), piloté par le protocole standard WebDriver BiDi : aucun module à installer.
// Test de fumée réel : chargement sans erreur JavaScript, aller-retour des blocs, frappe et annulation au clavier, réglages CSS (zoom, :is(), aspect-ratio), lightbox du site public.
// Ignoré avec un message explicite si Firefox n'est pas installé ou ne démarre pas (jamais un succès silencieux).
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

describe("Firefox — éditeur et pages publiques (WebDriver BiDi)", { skip: SKIP }, () => {
  let srv, boss, child, bidi, context, profile, skipReason = null;
  const run = async (expression) => {
    const r = await bidi.send("script.evaluate", { expression: `(async () => { const out = await (${expression}); return typeof out === "string" ? out : JSON.stringify(out); })()`, target: { context }, awaitPromise: true, resultOwnership: "none" });
    if (r.type === "exception") throw new Error(`Exception dans la page : ${r.exceptionDetails.text}`);
    const v = plain(r.result);
    try { return JSON.parse(v); } catch { return v; }
  };
  const go = async (url) => { await bidi.send("browsingContext.navigate", { context, url, wait: "complete" }); };
  const waitFor = async (expression, ms = 15000) => { const end = Date.now() + ms; for (;;) { const v = await run(expression).catch(() => false); if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${expression}`); await new Promise((r) => setTimeout(r, 150)); } };
  const keys = (text) => bidi.send("input.performActions", { context, actions: [{ type: "key", id: "kb", actions: [...text].flatMap((c) => [{ type: "keyDown", value: c }, { type: "keyUp", value: c }]) }] });
  const chord = (mod, key) => bidi.send("input.performActions", { context, actions: [{ type: "key", id: "kb", actions: [{ type: "keyDown", value: mod }, { type: "keyDown", value: key }, { type: "keyUp", value: key }, { type: "keyUp", value: mod }] }] });
  const CTRL = "", META = "";

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
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

  const editorReady = async () => { await go(`${srv.base}/formateur/blog/nouveau`); await waitFor(`!!(document.querySelector(".ProseMirror") && document.querySelector(".ProseMirror").editor)`); };
  const jsErrors = () => bidi.logs.filter((l) => l.level === "error" && l.type === "javascript").map((l) => l.text);

  test("l'éditeur se charge dans Firefox sans erreur JavaScript, avec le moteur de rendu attendu", async (t) => {
    if (skipReason) return t.skip(skipReason);
    await editorReady();
    const info = await run(`({ ua: navigator.userAgent, blocks: document.querySelectorAll("[data-blog-editor]").length })`);
    assert.match(info.ua, /Firefox\/1\d\d/);
    assert.equal(info.blocks, 1);
    assert.deepEqual(jsErrors(), []);
  });

  test("les blocs et leurs réglages font l'aller-retour dans Firefox (styles, listes, colonnes libres, HTML signé encodé, notes de bas de page)", async (t) => {
    if (skipReason) return t.skip(skipReason);
    await editorReady();
    const CODE = Buffer.from("<p>été</p>").toString("base64url");
    const html = `<p data-fw="bold" data-lh="airy" data-color="#112233">Réglé</p><ol data-ltype="lower-roman"><li><p>a</p></li></ol><div class="kb-columns" data-layout="custom"><div class="kb-column" data-basis="30"><p>a</p></div><div class="kb-column"><p>b</p></div></div><div class="kb-spacer" data-size="m" data-px="75"></div><div class="kb-html" data-code="${CODE}"></div><p>Texte<sup class="kb-fn" data-note="Ma note">1</sup></p><blockquote data-cite="Auteur"><p>q</p></blockquote>`;
    const out = await run(`(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setContent(${JSON.stringify(html)}); return ed.getHTML(); })()`);
    for (const re of [/data-fw="bold"/, /data-lh="airy"/, /data-color="#112233"/, /data-ltype="lower-roman"/, /data-basis="30"/, /data-px="75"/, new RegExp(`data-code="${CODE}"`), /data-note="Ma note"/, /data-cite="Auteur"/]) assert.match(out, re);
    const css = await run(`(() => { const q = (s) => getComputedStyle(document.querySelector(".ProseMirror " + s)); return { fw: q("p").fontWeight, list: q("ol").listStyleType, spacer: q(".kb-ed-spacer").height }; })()`);
    assert.deepEqual(css, { fw: "700", list: "lower-roman", spacer: "75px" });
    assert.deepEqual(jsErrors(), []);
  });

  test("clavier réel dans Firefox : frappe, annulation, zoom arrière (Ctrl+Maj+0), CSS moderne (zoom, :is, aspect-ratio)", async (t) => {
    if (skipReason) return t.skip(skipReason);
    await editorReady();
    await run(`(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setContent("<p></p>"); ed.view.focus(); return true; })()`);
    await waitFor(`document.activeElement === document.querySelector(".ProseMirror")`);
    await keys("Bonjour");
    assert.equal(await run(`document.querySelector(".ProseMirror").editor.getText()`), "Bonjour");
    await chord(process.platform === "darwin" ? META : CTRL, "z");
    assert.equal(await run(`document.querySelector(".ProseMirror").editor.getText()`), "", "Ctrl/Cmd+Z annule la frappe");
    // zoom arrière par la commande de l'éditeur (le raccourci passe par le même code)
    await run(`(() => { document.querySelector(".ProseMirror").editor.view.focus(); document.querySelector("[data-blog-editor]").classList.add("is-zoom-out"); return true; })()`);
    assert.equal(Number(await run(`getComputedStyle(document.querySelector(".wp-content")).zoom`)), 0.55);
    const modern = await run(`({ is: CSS.supports("selector(:is(a, b))"), aspect: CSS.supports("aspect-ratio: 16 / 9"), zoom: CSS.supports("zoom: .5"), clip: CSS.supports("clip-path: inset(0)") })`);
    assert.deepEqual(modern, { is: true, aspect: true, zoom: true, clip: true });
    assert.deepEqual(jsErrors(), []);
  });

  test("site public dans Firefox : l'image s'agrandit (boîte de dialogue), Échap la ferme, le sommaire et les notes de bas de page s'affichent", async (t) => {
    if (skipReason) return t.skip(skipReason);
    const fd = new FormData();
    const content = '<div class="kb-toc" data-depth="2"></div><h2>Partie</h2><p>Texte<sup class="kb-fn" data-note="Une note">1</sup></p><figure class="kb-image" data-lightbox="true"><img src="/uploads/thumbnails/a.png" alt="Premier"><figcaption>Légende un</figcaption></figure>';
    for (const [k, v] of Object.entries({ content_format: "html", title: "Article Firefox", content, status: "published" })) fd.append(k, v);
    const saved = JSON.parse((await boss.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } })).text);
    await go(`${srv.base}/blog/${saved.slug}`);
    await waitFor(`!!document.querySelector(".kb-lightbox-trigger")`);
    assert.equal(await run(`document.querySelectorAll(".kb-footnotes li").length`), 1);
    assert.equal(await run(`document.querySelectorAll(".kb-toc li").length`), 1);
    await run(`(() => { document.querySelector(".kb-lightbox-trigger").click(); return true; })()`);
    await waitFor(`(() => { const d = document.querySelector(".kb-lightbox"); return d && !d.hidden; })()`);
    assert.match(await run(`document.querySelector(".kb-lightbox figcaption").textContent`), /Légende un/);
    await bidi.send("input.performActions", { context, actions: [{ type: "key", id: "kb", actions: [{ type: "keyDown", value: "" }, { type: "keyUp", value: "" }] }] });
    await waitFor(`document.querySelector(".kb-lightbox").hidden === true`);
    assert.equal(await run(`document.activeElement.className`), "kb-lightbox-trigger", "le focus revient au bouton");
    assert.deepEqual(jsErrors(), []);
  });
});
