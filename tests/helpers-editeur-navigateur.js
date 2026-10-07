// Banc d'essai partagé : l'éditeur RÉEL (vrai serveur + vrai public/js/page-builder.js) chargé dans un navigateur simulé (jsdom) et piloté
// par des clics comme ceux d'une personne. jsdom ne calcule aucune mise en page et ne charge pas les cadres srcdoc : le HTML du canevas
// est écrit dans le cadre par le banc d'essai. Ce n'est pas un vrai navigateur (pas de capture d'écran).
// jsdom est facultatif : sans lui, les tests qui s'en servent sont ignorés avec un message (npm install --no-save jsdom).
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let JSDOM = null;
try { ({ JSDOM } = require("jsdom")); } catch { /* absent */ }
const SKIP = JSDOM ? false : "TEST NON EXÉCUTABLE — jsdom n'est pas installé (npm install --no-save jsdom)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 8000, label = "condition") {
  const end = Date.now() + ms;
  for (;;) {
    let v; try { v = await fn(); } catch { v = false; }
    if (v) return v;
    if (Date.now() > end) throw new Error(`Délai dépassé : ${label}`);
    await sleep(80);
  }
}

// Démarre un vrai serveur et renvoie les outils : newPage(content), openEditor(id), serverNode(pageId, nodeId), publish(pageId), stop()
async function setup() {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const db = srv.db();
  const cookie = [...boss.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  const errors = [], editors = [];

  const bootOf = async (id) => JSON.parse((await boss.get(`/marketing/pages/${id}/editeur`)).text.match(/<script type="application\/json" id="pb-boot">([\s\S]*?)<\/script>/)[1]);
  const find = (nodes, id) => { for (const n of nodes || []) { if (n.id === id) return n; const f = find(n.children, id); if (f) return f; } return null; };
  const serverNode = async (pageId, id) => find((await bootOf(pageId)).content.sections.flatMap((s) => s.children || []), id);
  async function newPage(name, content) {
    const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content } })).status, 200);
    return id;
  }
  async function publish(pageId) {
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} })).status, 200);
    return (await boss.get(`/p/${db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug}`)).text;
  }

  async function openEditor(pageId) {
    const html = (await boss.get(`/marketing/pages/${pageId}/editeur`)).text;
    const dom = new JSDOM(html, {
      url: `${srv.base}/marketing/pages/${pageId}/editeur`, runScripts: "dangerously", resources: "usable", pretendToBeVisual: true,
      beforeParse(w) {
        w.fetch = (u, o = {}) => fetch(new URL(u, srv.base), { ...o, headers: { ...(o.headers || {}), cookie }, redirect: "manual" });
        w.Element.prototype.scrollIntoView = function () {};
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
        w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
        w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
        w.addEventListener("error", (e) => errors.push(`script : ${e.message || e.error}`));
        const logError = w.console.error; w.console.error = (...a) => { const t = a.join(" "); if (!/Not implemented/.test(t)) errors.push(`console : ${t.slice(0, 200)}`); logError.apply(w.console, a); };
      },
    });
    const win = dom.window, doc = win.document;
    const frame = doc.querySelector("[data-pb-frame]");
    let last = "";
    const syncFrame = () => { const h = frame.getAttribute("srcdoc"); if (h && h !== last) { last = h; const fd = frame.contentDocument; fd.open(); fd.write(h); fd.close(); frame.dispatchEvent(new win.Event("load")); } };
    new win.MutationObserver(syncFrame).observe(frame, { attributes: true, attributeFilter: ["srcdoc"] });
    syncFrame();
    await until(() => frame.contentDocument.querySelector("[data-node-id]"), 10000, "canevas affiché");

    const ed = {
      win, doc, frame, pageId,
      get insp() { return doc.querySelector("[data-pb-inspector]"); },
      click(el) { assert.ok(el, "élément à cliquer introuvable"); el.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true })); },
      selectLayer(id) { ed.click(doc.querySelector(`li.pb-node[data-id="${id}"] > .pb-row-item`)); },
      selectCanvas(id) { ed.click(frame.contentDocument.querySelector(`[data-node-id="${id}"]`)); },
      canvasNode: (id) => frame.contentDocument.querySelector(`[data-node-id="${id}"]`),
      tabs: () => [...ed.insp.querySelectorAll("[role=tab]")].map((t) => t.textContent),
      tab(name) { ed.click([...ed.insp.querySelectorAll("[role=tab]")].find((t) => t.textContent === name)); },
      currentTab: () => (([...ed.insp.querySelectorAll("[role=tab]")].find((t) => t.getAttribute("aria-selected") === "true")) || {}).textContent,
      labels: () => [...ed.insp.querySelectorAll("label")].map((l) => l.textContent.trim()),
      ctl(label, exact = false) {
        const l = [...ed.insp.querySelectorAll("label")].find((x) => (exact ? x.textContent.trim() === label : x.textContent.trim().startsWith(label)));
        assert.ok(l, `champ « ${label} » introuvable (champs : ${ed.labels().join(" ; ")})`);
        return (l.htmlFor && doc.getElementById(l.htmlFor)) || l.querySelector("input,select,textarea");
      },
      prop(name) { const c = ed.insp.querySelector(`[data-prop="${name}"]`); assert.ok(c, `réglage « ${name} » introuvable`); return c.matches("input,select") ? c : c.querySelector("select,input.pb-len-num,input"); },
      set(el, value) {
        if (el.type === "checkbox") el.checked = Boolean(value); else el.value = value;
        el.dispatchEvent(new win.Event("input", { bubbles: true })); el.dispatchEvent(new win.Event("change", { bubbles: true }));
      },
      sectionTitles: () => [...ed.insp.querySelectorAll("summary .pb-acc-title")].map((t) => t.textContent),
      section(title) { const d = [...ed.insp.querySelectorAll("details")].find((x) => ((x.querySelector("summary .pb-acc-title") || {}).textContent) === title); assert.ok(d, `section « ${title} » introuvable (sections : ${ed.sectionTitles().join(" | ")})`); d.open = true; return d; },
      button(text) { const b = [...ed.insp.querySelectorAll("button")].find((x) => (x.textContent || x.getAttribute("aria-label") || "").trim() === text); assert.ok(b, `bouton « ${text} » introuvable`); return b; },
      device(label) { ed.click([...ed.insp.querySelectorAll("button, [role=radio]")].find((x) => (x.getAttribute("aria-label") || x.title || x.textContent).trim() === label)); },
      undo() { ed.click(doc.querySelector("[data-pb-undo]")); },
      redo() { ed.click(doc.querySelector("[data-pb-redo]")); },
      emptyState: () => /Aucun élément sélectionné/.test((ed.insp.querySelector("h2") || {}).textContent || ""),
    };
    editors.push(ed);
    return ed;
  }

  return {
    srv, boss, db, errors, until, sleep, newPage, openEditor, serverNode, bootOf, publish,
    async stop() { editors.forEach((e) => { try { e.win.close(); } catch { /* déjà fermé */ } }); db.close(); await srv.stop(); },
  };
}

module.exports = { setup, SKIP, until, sleep };
