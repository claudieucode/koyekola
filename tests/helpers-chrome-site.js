// Mini-pilote de Chrome sans dépendance (Playwright absent sur cette machine) : Chrome headless + protocole DevTools via le WebSocket natif de Node.
// Profil NEUF à chaque lancement ; à l'arrêt, tout le groupe de processus de Chrome est tué.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p)) || null;
const AVAILABLE = Boolean(CHROME) && typeof WebSocket === "function";

async function launch() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kw-chrome-"));
  const child = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${dir}`, "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--disable-extensions", "--hide-scrollbars", "about:blank"], { detached: true, stdio: "ignore" });
  let wsUrl = null;
  for (let i = 0; i < 100 && !wsUrl; i++) {
    await new Promise((r) => setTimeout(r, 100));
    try { const [port, p] = fs.readFileSync(path.join(dir, "DevToolsActivePort"), "utf8").trim().split("\n"); wsUrl = `ws://127.0.0.1:${port}${p}`; } catch { /* pas encore prêt */ }
  }
  if (!wsUrl) { try { process.kill(-child.pid, "SIGKILL"); } catch { /* déjà arrêté */ } throw new Error("Chrome n'a pas démarré"); }
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("connexion DevTools impossible")); });
  let id = 0; const waiting = new Map(), listeners = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && waiting.has(m.id)) { const { res, rej } = waiting.get(m.id); waiting.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
    else if (m.method) listeners.forEach((l) => l(m));
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const n = ++id; waiting.set(n, { res, rej }); ws.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) })); });

  const newPage = async ({ width = 1280, height = 900 } = {}) => {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    const cmd = (m, p) => send(m, p, sessionId);
    await cmd("Page.enable"); await cmd("Runtime.enable");
    await cmd("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
    const pageErrors = [];
    listeners.push((m) => { if (m.sessionId === sessionId && m.method === "Runtime.exceptionThrown") pageErrors.push(m.params.exceptionDetails.exception ? m.params.exceptionDetails.exception.description : m.params.exceptionDetails.text); });
    const evaluate = async (fn, arg) => {
      const expr = `(${fn.toString()})(${arg === undefined ? "" : JSON.stringify(arg)})`;
      const r = await cmd("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(`évaluation en échec : ${r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text}`);
      return r.result.value;
    };
    return {
      pageErrors,
      async goto(url) {
        const loaded = new Promise((res) => { const l = (m) => { if (m.sessionId === sessionId && m.method === "Page.loadEventFired") { listeners.splice(listeners.indexOf(l), 1); res(); } }; listeners.push(l); });
        const nav = await cmd("Page.navigate", { url }); if (nav.errorText) throw new Error(`navigation : ${nav.errorText}`);
        await loaded; await new Promise((r) => setTimeout(r, 300)); // laisse les scripts d'initialisation s'exécuter
      },
      evaluate,
      click: (sel) => evaluate((s) => { const e = document.querySelector(s); if (!e) throw new Error(`introuvable : ${s}`); e.click(); }, sel),
      attr: (sel, name) => evaluate(([s, n]) => { const e = document.querySelector(s); return e ? e.getAttribute(n) : null; }, [sel, name]),
      async close() { try { await send("Target.closeTarget", { targetId }); } catch { /* déjà fermé */ } },
    };
  };
  const close = async () => { try { ws.close(); } catch { /* ignoré */ } try { process.kill(-child.pid, "SIGKILL"); } catch { /* déjà arrêté */ } };
  return { newPage, close };
}

module.exports = { AVAILABLE, CHROME, launch };
