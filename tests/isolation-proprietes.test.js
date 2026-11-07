// ISOLATION DES PROPRIÉTÉS du Page Builder : une modification faite sur UN élément n'affecte QUE cet élément (pas ses frères, pas ses parents),
// à tous les niveaux d'imbrication, par écran (ordinateur / mobile), par état (survol), dans l'historique, après enregistrement + rechargement
// et après duplication. Voir docs/page-builder/ISOLATION_PROPRIETES_AUDIT.md.
//
// Niveaux de preuve :
//  - rendu serveur : le CSS publié ne contient que des sélecteurs `.kw-n-<id>` du ou des éléments modifiés ;
//  - vrai Chrome (style calculé par getComputedStyle sur CHAQUE élément de la page publiée, comparé à la même page sans réglage) ;
//  - vrai éditeur (page-builder.js) piloté par de vrais clics dans Chrome pour l'historique, l'enregistrement/rechargement et la duplication.
// Le pilote Chrome est tests/helpers-chrome-cdp.js (aucune dépendance) ; sans Chrome, les parties navigateur sont ignorées avec un message.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const cdp = require("./helpers-chrome-cdp");
const nodes = require("../src/marketing/pages/nodes");

const SKIP = cdp.SKIP;
const wait = cdp.wait;
const ID = (s) => String(s).padEnd(12, "0");
const kid = (id, type, props, extra) => ({ id: ID(id), type, props: props || {}, children: [], ...(extra || {}) });

// Une arborescence à 3 niveaux : chaque niveau contient image, 2 titres, texte, 2 boutons, une « carte » (conteneur) et le niveau suivant.
const LEVELS = [1, 2, 3];
const KINDS = ["img", "hd1", "hd2", "txt", "btn", "bt2", "card"];
const nid = (kind, level) => ID(`${kind}${level}`);
function level(n, styles) {
  const st = (id) => (styles[id] ? { styles: styles[id].styles, ...(styles[id].states ? { states: styles[id].states } : {}) } : {});
  const mk = (kind, type, props, extra) => ({ id: nid(kind, n), type, props, children: [], ...st(nid(kind, n)), ...(extra || {}) });
  return {
    id: ID(`cont${n}`), type: "container", props: {}, ...st(ID(`cont${n}`)),
    children: [
      mk("img", "image", { src: "https://example.com/a.jpg", alt: "Photo" }), mk("hd1", "heading", { text: "Titre un", level: 2 }), mk("hd2", "heading", { text: "Titre deux", level: 2 }),
      mk("txt", "text", { html: "<p>Paragraphe</p>" }), mk("btn", "button", { label: "Un", url: "https://kolakisa.com/" }), mk("bt2", "button", { label: "Deux", url: "https://kolakisa.com/" }),
      mk("card", "container", {}, { children: [kid(`ct${n}h`, "heading", { text: "Titre carte", level: 3 }), kid(`ct${n}t`, "text", { html: "<p>Texte carte</p>" })] }),
      ...(n < LEVELS.length ? [level(n + 1, styles)] : []),
    ],
  };
}
const pageOf = (styles) => ({ sections: [{ id: ID("sect1"), type: "layout", children: [level(1, styles)] }] });
const desk = (st) => ({ styles: { desktop: st } });

describe("isolation des propriétés (modèle + CSS serveur, sans navigateur)", () => {
  test("le CSS publié d'un réglage ne cite que l'élément modifié (flou, opacité, police, bordure, survol, mobile) à 3 niveaux", () => {
    for (const L of LEVELS) {
      const styles = {
        [nid("img", L)]: desk({ filter: { blur: 8 } }), [nid("btn", L)]: { styles: { desktop: { opacity: 0.4 } }, states: { hover: { backgroundColor: "#ff0000" } } },
        [nid("hd1", L)]: desk({ fontFamily: "serif" }), [nid("card", L)]: desk({ borderStyle: "solid", borderWidth: "3px", borderColor: "#112233", borderRadius: "12px" }),
        [nid("txt", L)]: { styles: { mobile: { width: "200px" } } },
      };
      const css = nodes.pageCss(pageOf(styles).sections);
      const targets = new Set(Object.keys(styles));
      const used = [...css.matchAll(/kw-n-([a-z0-9]+)/g)].map((m) => m[1]);
      assert.ok(used.length > 0);
      for (const u of used) assert.ok(targets.has(u), `le réglage touche aussi ${u}`);
      for (const rule of css.split("}")) if (rule.includes("{") && !/kw-n-/.test(rule.slice(0, rule.indexOf("{"))) && !/^\s*@media/.test(rule)) assert.fail(`règle sans identifiant d'élément : ${rule}`);
      assert.match(css, new RegExp(`\\.kw-n-${nid("img", L)}\\{filter:blur\\(8px\\)\\}`));
    }
  });
  test("deux éléments qui ont le même réglage gardent chacun leur propre règle ; une valeur perso ne modifie pas l'objet partagé", () => {
    const shared = { desktop: { filter: { blur: 4 } } };
    const secs = pageOf({ [nid("img", 1)]: { styles: shared }, [nid("img", 2)]: { styles: JSON.parse(JSON.stringify(shared)) } }).sections;
    const css = nodes.pageCss(secs);
    assert.match(css, new RegExp(`\\.kw-n-${nid("img", 1)}\\{filter:blur\\(4px\\)\\}`));
    assert.match(css, new RegExp(`\\.kw-n-${nid("img", 2)}\\{filter:blur\\(4px\\)\\}`));
    assert.equal((css.match(/blur\(4px\)/g) || []).length, 2);
  });
});

// ------------------------------------------------------------------------------------------------------------------------------------------
describe("isolation des propriétés (vrai Chrome, page publiée)", { skip: SKIP }, () => {
  let srv, boss, ch, cookies, counter = 0;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    ch = await cdp.launch();
    cookies = [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base }));
  });
  after(async () => { if (ch) await ch.close(); if (srv) await srv.stop(); });

  async function publish(content) {
    const id = Number((await boss.post("/marketing/pages", { name: "Iso " + ++counter })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 300));
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    return `${srv.base}/p/${srv.db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug}`;
  }
  // Style calculé de CHAQUE élément de la page (sauf les propriétés qui dépendent seulement de la place disponible)
  const SNAP = `(() => {
    const skip = /^(width|height|inline-size|block-size|perspective-origin|transform-origin|min-|max-|block-size|inline-size)/;
    const out = {};
    for (const e of document.querySelectorAll(".kw-node, .kw-container, .kw-layout")) {
      const m = /kw-n-([a-z0-9]+)/.exec(e.className); if (!m) continue;
      const c = getComputedStyle(e), o = {};
      for (const p of c) if (!skip.test(p)) o[p] = c.getPropertyValue(p);
      o.__w = c.width; o.__parent = (() => { let q = e.parentElement; while (q && !/kw-n-/.test(q.className)) q = q.parentElement; const mm = q && /kw-n-([a-z0-9]+)/.exec(q.className); return mm ? mm[1] : ""; })();
      out[m[1]] = o;
    }
    return out;
  })()`;
  async function snap(url, { width = 1400, hover = null } = {}) {
    const page = await ch.newPage({ width, height: 1000, cookies });
    try {
      await page.goto(url);
      await wait(150);
      if (hover) {
        const r = await page.evaluate((cls) => { const e = document.querySelector("." + cls); e.scrollIntoView({ block: "center" }); const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }, `kw-n-${hover}`);
        await page.mouseMove(r.x, r.y); await wait(500);
      }
      return await page.evaluate(SNAP);
    } finally { await page.close(); }
  }
  const descendants = (map, id) => Object.keys(map).filter((k) => { let p = map[k].__parent; while (p) { if (p === id) return true; p = map[p] && map[p].__parent; } return false; });
  // Compare deux instantanés : seuls les éléments CIBLES (et leurs descendants, qui héritent légitimement) peuvent différer
  function leaks(before, after, targets) {
    const allowed = new Set(targets.flatMap((t) => [t, ...descendants(after, t)]));
    const bad = [];
    for (const id of Object.keys(before)) {
      if (allowed.has(id) || !after[id]) continue;
      for (const p of Object.keys(before[id])) if (p !== "__w" && before[id][p] !== after[id][p]) bad.push(`${id} : ${p} « ${before[id][p]} » → « ${after[id][p]} »`);
    }
    return bad;
  }
  async function check(styles, targets, expectations, opts) {
    const base = await snap(await publish(pageOf({})), opts);
    const mod = await snap(await publish(pageOf(styles)), opts);
    assert.deepEqual(leaks(base, mod, targets), [], "un réglage a touché un autre élément");
    for (const [id, prop, value] of expectations) {
      assert.ok(mod[id], `élément ${id} absent`);
      assert.equal(prop === "__w" ? mod[id].__w : mod[id][prop], value, `${id} : ${prop}`);
    }
    return { base, mod };
  }

  for (const L of LEVELS) {
    test(`(1) flou d'une image parmi 5 éléments, niveau d'imbrication ${L} : seuls l'image et ses descendants sont floutés`, async () => {
      const { mod } = await check({ [nid("img", L)]: desk({ filter: { blur: 8 } }) }, [nid("img", L)], [[nid("img", L), "filter", "blur(8px)"]]);
      for (const id of Object.keys(mod)) if (id !== nid("img", L)) assert.equal(mod[id].filter, "none", `${id} ne doit pas être flou`);
    });
    test(`(2) opacité d'un bouton, niveau ${L} : l'autre bouton, le titre et le conteneur gardent leur opacité`, async () => {
      const { mod } = await check({ [nid("btn", L)]: desk({ opacity: 0.4 }) }, [nid("btn", L)], [[nid("btn", L), "opacity", "0.4"]]);
      for (const id of [nid("bt2", L), nid("hd1", L), ID(`cont${L}`), nid("img", L)]) assert.equal(mod[id].opacity, "1", id);
    });
    test(`(3) police d'un titre, niveau ${L} : ni l'autre titre, ni le paragraphe, ni les titres des autres niveaux ne changent`, async () => {
      const { base, mod } = await check({ [nid("hd1", L)]: desk({ fontFamily: "serif" }) }, [nid("hd1", L)], []);
      assert.notEqual(mod[nid("hd1", L)]["font-family"], base[nid("hd1", L)]["font-family"], "le titre choisi a bien changé de police");
      assert.equal(mod[nid("hd2", L)]["font-family"], base[nid("hd2", L)]["font-family"]);
      assert.equal(mod[nid("txt", L)]["font-family"], base[nid("txt", L)]["font-family"]);
    });
    test(`(4) bordure d'une carte, niveau ${L} : la carte seule a la bordure et le rayon (ni ses frères, ni son parent)`, async () => {
      const { mod } = await check({ [nid("card", L)]: desk({ borderStyle: "solid", borderWidth: "3px", borderColor: "#112233", borderRadius: "12px" }) }, [nid("card", L)],
        [[nid("card", L), "border-top-width", "3px"], [nid("card", L), "border-top-style", "solid"], [nid("card", L), "border-top-left-radius", "12px"]]);
      assert.equal(mod[ID(`cont${L}`)]["border-top-width"], "0px");
      assert.equal(mod[nid("bt2", L)]["border-top-style"], mod[nid("btn", L)]["border-top-style"]);
    });
    test(`(5) effet au survol d'un bouton, niveau ${L} : au passage de la souris, SEUL ce bouton change`, async () => {
      const styles = { [nid("btn", L)]: { styles: {}, states: { hover: { backgroundColor: "#ff0000", opacity: 0.5 } } } };
      const url = await publish(pageOf(styles));
      const rest = await snap(url);
      const over = await snap(url, { hover: nid("btn", L) });
      assert.equal(over[nid("btn", L)]["background-color"], "rgb(255, 0, 0)");
      assert.equal(over[nid("btn", L)].opacity, "0.5");
      assert.deepEqual(leaks(rest, over, [nid("btn", L)]), []);
      assert.notEqual(rest[nid("btn", L)]["background-color"], "rgb(255, 0, 0)", "sans survol, le bouton garde son fond");
    });
    test(`(6) largeur d'un texte en MOBILE, niveau ${L} : seul ce texte rétrécit, rien ne change sur ordinateur`, async () => {
      const styles = { [nid("txt", L)]: { styles: { mobile: { width: "200px" } } } };
      const mobile = await check(styles, [nid("txt", L)], [[nid("txt", L), "__w", "200px"]], { width: 390 });
      assert.notEqual(mobile.base[nid("txt", L)].__w, "200px");
      for (const id of [nid("hd1", L), nid("btn", L), nid("img", L)]) assert.equal(mobile.mod[id].__w, mobile.base[id].__w, `largeur de ${id} inchangée`);
      const desktop = await check(styles, [], [], { width: 1400 });
      assert.equal(desktop.mod[nid("txt", L)].__w, desktop.base[nid("txt", L)].__w, "ordinateur inchangé");
    });
  }

  test("(7) tous les réglages posés ENSEMBLE sur des éléments de niveaux différents : chacun garde son effet, aucun autre élément ne bouge", async () => {
    const styles = {
      [nid("img", 3)]: desk({ filter: { blur: 6, grayscale: 40 } }), [nid("btn", 2)]: desk({ opacity: 0.3 }), [nid("hd1", 1)]: desk({ fontFamily: "mono" }),
      [nid("card", 2)]: desk({ borderStyle: "dashed", borderWidth: "2px", borderColor: "#445566" }), [nid("img", 1)]: desk({ filter: { sepia: 100 } }),
    };
    const { mod } = await check(styles, Object.keys(styles), [[nid("img", 3), "filter", "blur(6px) grayscale(0.4)"], [nid("btn", 2), "opacity", "0.3"], [nid("card", 2), "border-top-style", "dashed"], [nid("img", 1), "filter", "sepia(1)"]]);
    assert.equal(mod[nid("img", 2)].filter, "none");
    assert.equal(mod[nid("btn", 1)].opacity, "1");
  });

  test("propriétés STRUCTURELLES : flex-direction, gap et padding d'un conteneur règlent la disposition de ses enfants (et pas ceux du voisin)", async () => {
    const styles = { [ID("cont2")]: desk({ display: "flex", flexDirection: "row", flexWrap: "nowrap", columnGap: "40px", paddingLeft: "30px", paddingTop: "20px" }) };
    const url = await publish(pageOf(styles));
    const page = await ch.newPage({ width: 1400, height: 1000, cookies });
    try {
      await page.goto(url);
      const r = await page.evaluate((ids) => {
        const rect = (id) => { const b = document.querySelector(".kw-n-" + id).getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
        const c = getComputedStyle(document.querySelector(".kw-n-" + ids.c2));
        return { dir: c.flexDirection, gap: c.columnGap, pl: c.paddingLeft, c2: rect(ids.c2), a: rect(ids.a), b: rect(ids.b), c1dir: getComputedStyle(document.querySelector(".kw-n-" + ids.c1)).flexDirection, c3dir: getComputedStyle(document.querySelector(".kw-n-" + ids.c3)).flexDirection, c3a: rect(ids.c3a), c3b: rect(ids.c3b) };
      }, { c1: ID("cont1"), c2: ID("cont2"), c3: ID("cont3"), a: nid("img", 2), b: nid("hd1", 2), c3a: nid("img", 3), c3b: nid("hd1", 3) });
      assert.equal(r.dir, "row");
      assert.equal(r.gap, "40px");
      assert.equal(r.pl, "30px");
      assert.ok(Math.abs(r.a.x - (r.c2.x + 30)) < 1.5, "padding gauche appliqué au premier enfant");
      assert.ok(Math.abs(r.b.x - (r.a.x + r.a.w + 40)) < 1.5, "deux enfants côte à côte, séparés par l'écart de 40 px");
      assert.ok(Math.abs(r.b.y - r.a.y) < 1.5, "même ligne");
      assert.equal(r.c1dir, "column", "le conteneur parent garde sa colonne");
      assert.equal(r.c3dir, "column", "le conteneur imbriqué garde sa colonne");
      assert.ok(r.c3b.y > r.c3a.y, "enfants du niveau 3 toujours empilés");
    } finally { await page.close(); }
  });

  test("héritage VOLONTAIRE : un conteneur transmet sa police ; une valeur perso sur un widget l'emporte sans toucher son frère", async () => {
    const styles = { [ID("cont2")]: desk({ fontFamily: "mono", fontSize: "21px" }), [nid("txt", 2)]: desk({ fontFamily: "serif" }) };
    const base = await snap(await publish(pageOf({})));
    const mod = await snap(await publish(pageOf(styles)));
    assert.equal(mod[ID("cont2")]["font-family"], mod[nid("card", 2)]["font-family"], "la carte (sans valeur perso) hérite de la police du conteneur");
    assert.equal(mod[ID("ct2t")]["font-size"], "21px", "le texte de la carte (sans valeur perso) hérite de la taille du conteneur");
    assert.notEqual(mod[nid("txt", 2)]["font-family"], mod[ID("cont2")]["font-family"], "le texte avec valeur perso garde la sienne");
    assert.equal(mod[ID("cont1")]["font-family"], base[ID("cont1")]["font-family"], "le conteneur parent n'est pas touché");
    assert.equal(mod[nid("txt", 3)]["font-family"], mod[ID("cont2")]["font-family"], "le niveau 3 est DANS le conteneur 2 : il hérite aussi (héritage voulu)");
    assert.equal(mod[nid("txt", 1)]["font-family"], base[nid("txt", 1)]["font-family"]);
  });

  test("widgets composés (parties) : le style d'une partie d'un widget ne touche pas le même widget copié à côté", async () => {
    const mk = (id, parts) => ({ id: ID(id), type: "iconbox", props: { icon: "star", title: "Boîte", text: "Texte" }, children: [], ...(parts ? { parts } : {}) });
    const def = nodes.NODE_TYPES.iconbox;
    assert.ok(def, "widget iconbox présent");
    const partsLib = require("../src/marketing/pages/parts");
    const keys = Object.keys(partsLib.PARTS.iconbox || {});
    if (!keys.length) return; // pas de parties sur ce widget : rien à vérifier
    const key = keys[0];
    const content = { sections: [{ id: ID("sect1"), type: "layout", children: [{ id: ID("cont1"), type: "container", props: {}, children: [mk("ib1", { [key]: { styles: { desktop: { opacity: 0.35 } } } }), mk("ib2")] }] }] };
    const css = nodes.pageCss(content.sections);
    assert.match(css, new RegExp(`\\.kw-node\\.kw-n-${ID("ib1")} `), "règle de partie visant le premier widget");
    assert.doesNotMatch(css, new RegExp(`kw-n-${ID("ib2")}`), "le second widget n'a aucune règle");
    const snapParts = await snap(await publish(content));
    assert.equal(snapParts[ID("ib2")].opacity, "1");
  });
});

// ------------------------------------------------------------------------------------------------------------------------------------------
describe("isolation des propriétés (vrai éditeur piloté dans Chrome)", { skip: SKIP }, () => {
  let srv, boss, ch, page, id;
  const draftSections = () => JSON.parse((srv.db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft) || "{}").sections;
  const flat = (list, out = []) => { for (const x of list || []) { out.push(x); flat(x.children, out); } return out; };
  const stylesOf = () => Object.fromEntries(flat(draftSections()).map((n) => [n.id, n.styles || {}]));
  const canvas = (ids) => page.evaluate((list) => { const d = document.querySelector("[data-pb-frame]").contentDocument; return Object.fromEntries(list.map((n) => { const e = d.querySelector(`[data-node-id="${n}"]`); const c = e && getComputedStyle(e); return [n, e ? { filter: c.filter, color: c.color } : null]; })); }, ids);
  const open = async () => { await page.goto(`${srv.base}/marketing/pages/${id}/editeur`); await page.waitFor(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, "canevas", 60000); await wait(900); };
  const savedWhen = async (check, what) => { const end = Date.now() + 15000; for (;;) { let ok = false; try { ok = check(); } catch { /* pas encore */ } if (ok) return; if (Date.now() > end) throw new Error("Pas enregistré : " + what); await wait(150); } };
  async function pick(nodeId) {
    const r = await page.evaluate((n) => { const f = document.querySelector("[data-pb-frame]"); const fr = f.getBoundingClientRect(); const e = f.contentDocument.querySelector(`[data-node-id="${n}"]`); e.scrollIntoView({ block: "center" }); const b = e.getBoundingClientRect(); return { x: fr.x + b.x + Math.min(b.width / 2, 40), y: fr.y + b.y + b.height / 2 }; }, nodeId);
    await page.mouseClick(r.x, r.y); await wait(400);
    const sel = await page.evaluate(() => [...document.querySelectorAll("[data-pb-layers] .pb-row-item.is-selected")].map((e) => e.parentElement.dataset.id));
    assert.deepEqual(sel, [nodeId], "le clic sur l'élément sélectionne CET élément seulement");
    await page.evaluate(() => { const b = [...document.querySelectorAll(".pb-right button")].find((x) => /^Style$/.test(x.textContent.trim())); if (b) b.click(); }); await wait(300);
  }
  const setNum = async (prop, v) => { await page.evaluate(([p, val]) => { const d = document.querySelector(`.pb-inspector details.pb-acc:has([data-prop="${p}"])`); if (d) d.open = true; const i = document.querySelector(`.pb-inspector [data-prop="${p}"] input`); i.focus(); i.value = val; i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true })); }, [prop, String(v)]); await wait(1300); };
  async function setColor(key, hex) {
    await page.evaluate((k) => { const b = document.querySelector(`[data-pb-inspector] [data-color-key='${k}']`); const d = b.closest("details"); if (d) d.open = true; b.scrollIntoView(); b.click(); }, key); await wait(300);
    await page.evaluate((hx) => { const i = document.querySelector(".pb-cpop-hex"); i.focus(); i.value = hx; i.dispatchEvent(new Event("change", { bubbles: true })); }, hex); await wait(300);
    await page.key("Escape"); await wait(1300);
  }
  const press = async (sel) => { await page.evaluate((s) => document.querySelector(s).click(), sel); await wait(1100); };
  const IDS = { img: nid("img", 1), hd: nid("hd1", 1), txt: nid("txt", 1), btn: nid("btn", 1), cont: ID("cont1") };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    ch = await cdp.launch();
    id = Number((await boss.post("/marketing/pages", { name: "Iso éditeur" })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const content = { sections: [{ id: ID("sect1"), type: "layout", children: [{ id: IDS.cont, type: "container", props: {}, children: [
      kid(IDS.img, "image", { src: "https://example.com/a.jpg", alt: "Photo" }), kid(IDS.hd, "heading", { text: "Titre", level: 2 }), kid(IDS.txt, "text", { html: "<p>Paragraphe</p>" }), kid(IDS.btn, "button", { label: "Bouton", url: "https://kolakisa.com/" }),
    ] }] }] };
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } })).status, 200);
    page = await ch.newPage({ width: 1700, height: 1000, cookies: [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })) });
    await open();
  });
  after(async () => { if (ch) await ch.close(); if (srv) await srv.stop(); });

  test("(1) éditeur réel : sélectionner l'image et lui mettre un flou de 8 ne floute QUE l'image (canevas + brouillon enregistré)", async () => {
    await pick(IDS.img); await setNum("filter-blur", 8);
    const c = await canvas(Object.values(IDS));
    assert.equal(c[IDS.img].filter, "blur(8px)");
    for (const k of ["hd", "txt", "btn", "cont"]) assert.equal(c[IDS[k]].filter, "none", `${k} ne doit pas être flou`);
    await savedWhen(() => stylesOf()[IDS.img].desktop && stylesOf()[IDS.img].desktop.filter && stylesOf()[IDS.img].desktop.filter.blur === 8, "flou de l'image");
    const s = stylesOf();
    for (const k of ["hd", "txt", "btn", "cont"]) assert.deepEqual(s[IDS[k]], {}, `${k} : aucun style enregistré`);
  });

  test("(8) historique : 3 modifications sur 3 éléments = 3 étapes d'annulation indépendantes, annuler/rétablir ne touche que l'élément concerné", async () => {
    await pick(IDS.hd); await setColor("color", "#ff0000");
    await pick(IDS.txt); await setColor("color", "#00aa00");
    await pick(IDS.btn); await setNum("filter-blur", 5);
    const col = () => page.evaluate((ids) => { const d = document.querySelector("[data-pb-frame]").contentDocument; return ids.map((n) => { const c = getComputedStyle(d.querySelector(`[data-node-id="${n}"]`)); return c.color + "|" + c.filter; }); }, [IDS.hd, IDS.txt, IDS.btn, IDS.img]);
    const full = await col();
    assert.equal(full[0], "rgb(255, 0, 0)|none"); assert.equal(full[1], "rgb(0, 170, 0)|none"); assert.match(full[2], /\|blur\(5px\)$/); assert.match(full[3], /\|blur\(8px\)$/);
    await press("[data-pb-undo]"); // annule le flou du bouton SEUL
    let now = await col();
    assert.match(now[2], /\|none$/); assert.equal(now[0].split("|")[0], "rgb(255, 0, 0)"); assert.equal(now[1].split("|")[0], "rgb(0, 170, 0)");
    await press("[data-pb-undo]"); // annule la couleur du texte SEUL
    now = await col();
    assert.equal(now[0].split("|")[0], "rgb(255, 0, 0)", "le titre garde sa couleur quand on annule celle du texte");
    assert.notEqual(now[1].split("|")[0], "rgb(0, 170, 0)");
    await press("[data-pb-undo]"); // annule la couleur du titre
    now = await col();
    assert.notEqual(now[0].split("|")[0], "rgb(255, 0, 0)");
    assert.match(now[3], /blur\(8px\)$/, "le flou de l'image (modification plus ancienne) reste");
    await press("[data-pb-redo]"); await press("[data-pb-redo]"); await press("[data-pb-redo]");
    assert.deepEqual(await col(), full, "rétablir x3 redonne exactement l'état d'avant");
  });

  test("(9) enregistrement puis rechargement : chaque élément retrouve ses propres réglages, et seulement eux", async () => {
    await savedWhen(() => { const s = stylesOf(); return s[IDS.btn].desktop && s[IDS.btn].desktop.filter && s[IDS.hd].desktop && s[IDS.hd].desktop.color && s[IDS.txt].desktop && s[IDS.txt].desktop.color; }, "3 réglages");
    const saved = stylesOf();
    assert.deepEqual(Object.keys(saved[IDS.btn].desktop), ["filter"]);
    assert.deepEqual(Object.keys(saved[IDS.hd].desktop), ["color"]);
    assert.deepEqual(Object.keys(saved[IDS.txt].desktop), ["color"]);
    assert.deepEqual(saved[IDS.cont], {});
    await open();
    const c = await canvas(Object.values(IDS));
    assert.equal(c[IDS.img].filter, "blur(8px)"); assert.equal(c[IDS.btn].filter, "blur(5px)");
    assert.equal(c[IDS.hd].color, "rgb(255, 0, 0)"); assert.equal(c[IDS.txt].color, "rgb(0, 170, 0)");
    assert.equal(c[IDS.hd].filter, "none"); assert.equal(c[IDS.txt].filter, "none"); assert.equal(c[IDS.cont].filter, "none");
    assert.deepEqual(stylesOf(), saved, "le rechargement ne réécrit rien");
  });

  test("(10) duplication d'un widget personnalisé : nouvel identifiant, mêmes propriétés au départ, puis copie indépendante", async () => {
    await pick(IDS.img);
    await page.evaluate(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "d", ctrlKey: true, bubbles: true }))); await wait(1500);
    await savedWhen(() => flat(draftSections()).filter((n) => n.type === "image").length === 2, "copie enregistrée");
    const images = flat(draftSections()).filter((n) => n.type === "image");
    const [orig, copy] = [images.find((n) => n.id === IDS.img), images.find((n) => n.id !== IDS.img)];
    assert.ok(copy.id && copy.id !== orig.id, "identifiant nouveau");
    assert.match(copy.id, /^[a-z0-9]{12}$/);
    assert.deepEqual(copy.styles, orig.styles, "mêmes propriétés au départ");
    assert.deepEqual(copy.props, orig.props);
    assert.equal(new Set(flat(draftSections()).map((n) => n.id)).size, flat(draftSections()).length, "aucun identifiant en double");
    // La copie est sélectionnée : on change SON flou
    const sel = await page.evaluate(() => [...document.querySelectorAll("[data-pb-layers] .pb-row-item.is-selected")].map((e) => e.parentElement.dataset.id));
    assert.deepEqual(sel, [copy.id]);
    await page.evaluate(() => { const b = [...document.querySelectorAll(".pb-right button")].find((x) => /^Style$/.test(x.textContent.trim())); if (b) b.click(); }); await wait(300);
    await setNum("filter-blur", 3);
    await savedWhen(() => { const n = flat(draftSections()).find((x) => x.id === copy.id); return n.styles.desktop.filter.blur === 3; }, "flou de la copie");
    const after = flat(draftSections());
    assert.equal(after.find((n) => n.id === IDS.img).styles.desktop.filter.blur, 8, "l'original garde son flou");
    assert.equal(after.find((n) => n.id === copy.id).styles.desktop.filter.blur, 3);
    const c = await canvas([IDS.img, copy.id]);
    assert.equal(c[IDS.img].filter, "blur(8px)"); assert.equal(c[copy.id].filter, "blur(3px)");
  });
});
