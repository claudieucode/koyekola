// Mini-pilote de Chrome (protocole CDP, sans Playwright ni Puppeteer) : lance un Chrome sans fenêtre avec un profil neuf, ouvre des onglets,
// exécute du JavaScript dans la page et simule des clics. Réservé aux tests : le groupe de processus Chrome est TOUJOURS arrêté par close().
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const SKIP = !CHROME || typeof WebSocket !== "function" ? "Chrome absent (ou Node sans WebSocket) : parcours navigateur non exécuté sur cette machine" : false;

async function launch() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "kw-chrome-"));
  const child = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=1500,1000", "about:blank"], { stdio: ["ignore", "ignore", "pipe"], detached: true });
  let err = "";
  child.stderr.on("data", (d) => (err += d));
  let wsUrl = null;
  for (let i = 0; i < 160 && !wsUrl; i++) { const m = /DevTools listening on (ws:\/\/\S+)/.exec(err); if (m) wsUrl = m[1]; else await wait(100); }
  if (!wsUrl) { try { process.kill(-child.pid, "SIGKILL"); } catch { /* déjà arrêté */ } throw new Error("Chrome n'a pas démarré : " + err.slice(0, 300)); }
  const ws = new WebSocket(wsUrl);
  await new Promise((ok, ko) => { ws.addEventListener("open", ok); ws.addEventListener("error", ko); });
  let seq = 0; const waiting = new Map(); const listeners = [];
  ws.addEventListener("message", (m) => {
    const x = JSON.parse(m.data);
    if (x.id && waiting.has(x.id)) { const w = waiting.get(x.id); waiting.delete(x.id); x.error ? w.ko(new Error(x.error.message)) : w.ok(x.result); } else listeners.forEach((l) => l(x));
  });
  const send = (method, params = {}, sessionId) => new Promise((ok, ko) => { const id = ++seq; waiting.set(id, { ok, ko }); ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); });

  async function newPage({ width = 1500, height = 1000, cookies = [] } = {}) {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    const cmd = (m, p) => send(m, p, sessionId);
    await cmd("Page.enable"); await cmd("Runtime.enable");
    await cmd("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
    if (cookies.length) await cmd("Network.setCookies", { cookies });
    const errors = [];
    listeners.push((x) => {
      if (x.sessionId !== sessionId) return;
      // Boîte « quitter la page ? » ou alerte : acceptée tout de suite (sinon la page reste bloquée)
      if (x.method === "Page.javascriptDialogOpening") cmd("Page.handleJavaScriptDialog", { accept: true }).catch(() => {});
      if (x.method === "Runtime.exceptionThrown") errors.push((x.params.exceptionDetails.exception && x.params.exceptionDetails.exception.description) || x.params.exceptionDetails.text);
    });
    const page = {
      errors,
      async goto(url) { await cmd("Page.navigate", { url }); for (let i = 0; i < 200; i++) { await wait(100); if (await page.evaluate("document.readyState === 'complete'").catch(() => false)) return; } },
      async evaluate(fn, arg) {
        const expression = typeof fn === "function" ? `(${fn})(${JSON.stringify(arg === undefined ? null : arg)})` : fn;
        const r = await cmd("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
        if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
        return r.result.value;
      },
      async waitFor(fn, what = "condition", timeout = 15000, arg) {
        const end = Date.now() + timeout;
        for (;;) { let v = false; try { v = await page.evaluate(fn, arg); } catch { /* pas encore */ } if (v) return v; if (Date.now() > end) throw new Error("Délai dépassé : " + what); await wait(60); }
      },
      // Clic réel (souris) aux coordonnées de la fenêtre principale
      async mouseClick(x, y) {
        await cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
        await cmd("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
        await cmd("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
      },
      // Émulation d'une préférence du visiteur, ex. [{ name: "prefers-reduced-motion", value: "reduce" }]
      async emulateMedia(features) { await cmd("Emulation.setEmulatedMedia", { features }); },
      async mouseMove(x, y) { await cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }); },
      // Glisser réel (souris) : appui en (x1, y1), déplacement progressif, relâchement en (x2, y2)
      async mouseDrag(x1, y1, x2, y2, steps = 8) {
        await cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x: x1, y: y1 });
        await cmd("Input.dispatchMouseEvent", { type: "mousePressed", x: x1, y: y1, button: "left", buttons: 1, clickCount: 1 });
        for (let i = 1; i <= steps; i++) await cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x: x1 + ((x2 - x1) * i) / steps, y: y1 + ((y2 - y1) * i) / steps, button: "left", buttons: 1 });
        await cmd("Input.dispatchMouseEvent", { type: "mouseReleased", x: x2, y: y2, button: "left", buttons: 0, clickCount: 1 });
      },
      async key(key, mods = 0) {
        const code = key.length === 1 ? "Key" + key.toUpperCase() : key;
        await cmd("Input.dispatchKeyEvent", { type: "keyDown", key, code, modifiers: mods, windowsVirtualKeyCode: key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0 });
        await cmd("Input.dispatchKeyEvent", { type: "keyUp", key, code, modifiers: mods, windowsVirtualKeyCode: key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0 });
      },
      // Touche « réelle » avec texte (Entrée, Espace) : déclenche l'activation native d'un bouton ou d'un lien, contrairement à key() qui n'envoie pas de texte. Ajout seul : key() ne change pas.
      async pressActivation(name) {
        const k = name === "Enter" ? { key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" } : { key: " ", code: "Space", windowsVirtualKeyCode: 32, text: " " };
        await cmd("Input.dispatchKeyEvent", { type: "keyDown", ...k }); await cmd("Input.dispatchKeyEvent", { type: "keyUp", key: k.key, code: k.code, windowsVirtualKeyCode: k.windowsVirtualKeyCode });
      },
      // Capture PNG (Buffer) de la fenêtre, ou d'un rectangle { x, y, width, height } en pixels de la page
      // (avec un rectangle, captureBeyondViewport : une zone plus basse que la fenêtre est capturée en entier)
      async screenshot(clip) { const r = await cmd("Page.captureScreenshot", { format: "png", ...(clip ? { clip: { ...clip, scale: 1 }, captureBeyondViewport: true } : {}) }); return Buffer.from(r.data, "base64"); },
      async close() { await send("Target.closeTarget", { targetId }).catch(() => {}); },
    };
    return page;
  }
  async function close() { try { ws.close(); } catch { /* ok */ } try { process.kill(-child.pid, "SIGKILL"); } catch { /* déjà arrêté */ } await wait(200); try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* ok */ } }
  return { newPage, close };
}

module.exports = { launch, SKIP, wait };
