// Header Builder, lot L2 — responsive PAR ÉLÉMENT sur le site publié, dans un VRAI Chrome : ordre par appareil, direction, visibilité par appareil,
// indépendance des valeurs (un réglage mobile ne change jamais le bureau), points de rupture du site. Ces capacités existent dans le moteur de styles :
// ce test prouve qu'elles fonctionnent pour un EN-TÊTE publié.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Header Builder L2 : responsive par élément (navigateur)", { skip: SKIP }, () => {
  let env, ids;
  // Trouve, dans l'en-tête du catalogue, un groupe de trois enfants au moins et leur donne des ids connus
  const mark = (s) => {
    let found = null;
    const walk = (nodes) => { for (const n of nodes) { if (Array.isArray(n.children) && n.children.length >= 2 && n.children.every((c) => c.id) && (!found || n.children.length > found.children.length)) found = n; if (n.children) walk(n.children); } };
    walk(s.children);
    assert.ok(found, "groupe d'au moins deux éléments trouvé dans l'en-tête du catalogue");
    ids = found.children.slice(0, 3).map((c) => c.id); // 2 ou 3 éléments
    return found;
  };
  const x = (page, id) => page.evaluate((i) => { const e = document.querySelector(`.lp-site-header .kw-n-${i}`); if (!e) return null; const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, shown: getComputedStyle(e).display !== "none" && r.width > 0 }; }, id);

  before(async () => { env = await setup({ siteName: "Site responsive" }); });
  after(async () => { if (env) await env.close(); });

  test("ordre par appareil : A B C sur ordinateur, C B A sur mobile ; le bureau n'est pas touché par le réglage mobile", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, (s) => {
      const g = mark(s);
      g.styles = { ...(g.styles || {}), desktop: { ...((g.styles || {}).desktop || {}), display: "flex", flexDirection: "row" } };
      const k = Math.min(3, g.children.length); g.children.slice(0, k).forEach((c, i) => { c.styles = { ...(c.styles || {}), mobile: { ...((c.styles || {}).mobile || {}), order: String(k - i) } }; });
    });
    const d = await env.visit(); const dx = await Promise.all(ids.map((i) => x(d.page, i)));
    assert.ok(dx.every(Boolean), "éléments présents"); assert.ok(dx.every((v, i) => i === 0 || dx[i - 1].left < v.left), `bureau : ordre naturel (${dx.map((v) => Math.round(v.left))})`);
    await d.context.close();
    const m = await env.visit({ viewport: { width: 390, height: 800 } }); const mx = await Promise.all(ids.map((i) => x(m.page, i)));
    // Mobile : ordre inversé (la rangée peut passer à la ligne : on compare la position de lecture, ligne puis colonne)
    const pos = (v) => v.top * 10000 + v.left; assert.ok(mx.every((v, i) => i === 0 || pos(mx[i]) < pos(mx[i - 1])), `mobile : ordre inversé (${mx.map((v) => [Math.round(v.left), Math.round(v.top)])})`);
    await m.context.close();
  });

  test("visibilité par appareil : un élément masqué sur mobile reste visible sur ordinateur et tablette", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, (s) => { const g = mark(s); g.children[g.children.length - 1].hideOn = ["mobile"]; ids = [g.children[g.children.length - 1].id]; });
    const shown = async (viewport) => { const v = await env.visit({ viewport }); const r = await x(v.page, ids[0]); await v.context.close(); return r && r.shown; };
    assert.equal(await shown({ width: 1280, height: 800 }), true, "ordinateur : visible");
    assert.equal(await shown({ width: 900, height: 800 }), true, "tablette : visible");
    assert.equal(await shown({ width: 390, height: 800 }), false, "mobile : masqué");
  });

  test("direction par appareil : ligne sur ordinateur, colonne sur mobile (les éléments s'empilent)", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, (s) => {
      const g = mark(s);
      g.styles = { ...(g.styles || {}), desktop: { ...((g.styles || {}).desktop || {}), display: "flex", flexDirection: "row" }, mobile: { flexDirection: "column" } };
    });
    const d = await env.visit(); const dx = await Promise.all(ids.map((i) => x(d.page, i))); assert.ok(Math.abs(dx[0].top - dx[1].top) < 40, "ordinateur : même ligne"); await d.context.close();
    const m = await env.visit({ viewport: { width: 390, height: 800 } }); const mx = await Promise.all(ids.map((i) => x(m.page, i)));
    assert.ok(mx.every((v, i) => i === 0 || v.top > mx[i - 1].top + 5), `mobile : empilés (${mx.map((v) => Math.round(v.top))})`); await m.context.close();
  });

  test("points de rupture du site : tablette ≤ 1279 px réglé par le site → un style tablette s'applique à 1100 px (et pas à 1300 px)", async () => {
    const base = (() => { try { return JSON.parse(env.db.prepare("SELECT settings FROM mk_sites WHERE id = ?").get(env.site).settings || "{}"); } catch { return {}; } })();
    env.db.prepare("UPDATE mk_sites SET settings = ? WHERE id = ?").run(JSON.stringify({ ...base, layout: { ...(base.layout || {}), breakpoints: { tablet: 1279, mobile: 600, wide: 1920 } } }), env.site);
    let groupId = null;
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, (s) => { const g = mark(s); groupId = g.id; g.styles = { ...(g.styles || {}), tablet: { display: "none" } }; });
    const hiddenAt = async (w) => { const v = await env.visit({ viewport: { width: w, height: 800 } }); const r = await v.page.evaluate((i) => getComputedStyle(document.querySelector(`.lp-site-header .kw-n-${i}`)).display, groupId); await v.context.close(); return r === "none"; };
    assert.equal(await hiddenAt(1100), true, "1100 px : tablette (réglée à ≤ 1279)");
    assert.equal(await hiddenAt(1300), false, "1300 px : ordinateur");
  });

  test("aucune erreur de script", () => { assert.deepEqual(env.errors, []); });
});
