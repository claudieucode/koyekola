// Éditeur de pages — MÉDIATHÈQUE (vrai Chrome) : texte toujours lisible (clair, sombre, couleurs d'accent), grille aux vignettes non déformées,
// sélection claire, panneau de détails hiérarchisé (noms et adresses longs contenus), texte alternatif enregistré, utilisation affichée,
// suppression confirmée et protégée, import, tri, états vides, retour de l'image au widget demandeur, tailles de 375 à 1920 px sans débordement.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const zlib = require("zlib");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// PNG valide w×h (RVB uni), fabriqué sans dépendance
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
const png = (w, h, [r, g, b]) => {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => [r, g, b]).flat())]);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(Buffer.concat(Array.from({ length: h }, () => row)))), chunk("IEND", Buffer.alloc(0))]);
};

describe("médiathèque de l'éditeur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, pageId, medias;
  const upload = async (name, w, h, color, alt) => {
    const fd = new FormData(); fd.append("file", new Blob([png(w, h, color)], { type: "image/png" }), name); if (alt) fd.append("alt", alt);
    const r = await boss.request("/marketing/site-web/medias", { method: "POST", multipart: fd });
    assert.equal(r.status, 201, r.text); return JSON.parse(r.text).media;
  };
  const open = async (viewport = { width: 1440, height: 900 }) => {
    const ctx = await browser.newContext({ viewport });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.children.length > 0; }, null, { timeout: 30000 });
    await wait(400);
    return { ctx, page, errors };
  };
  const openLibrary = async (page) => { await page.locator('[data-pb-tools] [aria-label="Médiathèque"]').click(); await page.waitForFunction(() => document.querySelector("[data-pb-media]").open && document.querySelectorAll(".pb-media-item").length > 0, null, { timeout: 15000 }); await wait(300); };
  const isOpen = (page) => page.evaluate(() => document.querySelector("[data-pb-media]").open);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    pageId = Number((await boss.post("/marketing/pages", { name: "Médiathèque" })).location.match(/(\d+)$/)[1]);
    const longName = "Bienvenue-dans-la-communaute-des-createurs-de-formation-en-ligne-version-finale-2026.png";
    medias = {
      used: await upload("zebre-utilise.png", 400, 200, [30, 120, 200], "Un zèbre bleu"),
      long: await upload(longName, 1774, 887, [200, 80, 40]),
      plain: await upload("alpha.png", 300, 300, [20, 160, 90]),
    };
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const content = { sections: [{ id: "sect0000001", type: "layout", children: [{ id: "imgnode00001", type: "image", props: { src: medias.used.path, alt: "Un zèbre bleu" } }] }] };
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } })).status, 200);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("contraste : titres, libellés, valeurs, champs, boutons ≥ 4,5:1 en clair, en sombre et avec des couleurs d'accent (la cause d'avant : fond fixe clair + texte aux jetons sombres)", async () => {
    const { ctx, page, errors } = await open();
    await openLibrary(page);
    await page.locator(".pb-media-item", { hasText: "zebre-utilise" }).click(); await wait(300);
    const audit = () => page.evaluate(() => {
      const parse = (c) => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 }; };
      const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const bgOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a > 0) stack.push(c); if (c.a >= 1) break; } let base = stack.pop() || { r: 255, g: 255, b: 255, a: 1 }; while (stack.length) { const t = stack.pop(); base = { r: t.r * t.a + base.r * (1 - t.a), g: t.g * t.a + base.g * (1 - t.a), b: t.b * t.a + base.b * (1 - t.a), a: 1 }; } return base; };
      const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
      const d = document.querySelector("[data-pb-media]");
      const sel = [".pb-media-titles h2", ".pb-media-titles p", ".pb-media-row dt", ".pb-media-row dd", ".pb-media-row code", ".pb-media-meta h3", ".pb-media-meta label", ".pb-media-meta input", ".pb-media-help", ".pb-media-name", ".pb-media-status", ".pb-drop", ".pb-media-usage", ".pb-media-usage a", ".pb-media-search input", ".pb-media-toolbar select", ".pb-upload span", ".pb-media-actions .btn-primary", ".pb-media-del"];
      const out = {};
      sel.forEach((s) => { const e = d.querySelector(s); if (!e) { out[s] = "absent"; return; } const fg = parse(getComputedStyle(e).color); out[s] = Math.round(ratio({ ...fg }, bgOf(e)) * 10) / 10; });
      return out;
    });
    const check = (what, r) => { for (const [s, v] of Object.entries(r)) { if (v === "absent") continue; assert.ok(v >= 4.5, `${what} : ${s} contraste ${v}`); } return r; };
    for (const palette of ["light", "dark"]) {
      await page.evaluate((p) => document.querySelector(".pb-body").setAttribute("data-palette", p), palette); await wait(250);
      const r = check(palette, await audit());
      assert.ok(r[".pb-media-row dt"] !== "absent" && r[".pb-media-row dd"] !== "absent" && r[".pb-media-usage"] !== "absent", "libellés, valeurs et utilisation présents");
    }
    for (const accent of ["#2563eb", "#7c3aed", "#16a34a", "#f59e0b"]) {
      await page.evaluate((a) => { const t = window.KWTheme.derive({ accent: a }).tokens; Object.keys(t).forEach((k) => document.querySelector(".pb-body").style.setProperty(k, t[k])); }, accent); await wait(300);
      check(`accent ${accent}`, await audit());
    }
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test("ouverture : focus dans la recherche, en-tête, vignettes 4:3 non déformées, nom long et adresse contenus, sélection visible, copie de l'adresse, Échap / X, focus rendu", async () => {
    const { ctx, page } = await open();
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: srv.base });
    await openLibrary(page);
    assert.equal(await page.evaluate(() => document.activeElement.id), "pb-media-q");
    const g = await page.evaluate(() => { const r = (e) => e.getBoundingClientRect(); const d = document.querySelector("[data-pb-media]"); return { head: d.querySelector(".pb-media-titles h2").textContent, sub: d.querySelector(".pb-media-titles p").textContent, items: [...d.querySelectorAll(".pb-media-thumb")].map((t) => [r(t).width / r(t).height, getComputedStyle(t.querySelector("img")).objectFit]), emptyDetail: d.querySelector(".pb-media-nosel") && d.querySelector(".pb-media-nosel").textContent, w: r(d).width, h: r(d).height }; });
    assert.equal(g.head, "Médiathèque"); assert.ok(g.items.length >= 3 && g.items.every(([ratio, fit]) => Math.abs(ratio - 4 / 3) < 0.02 && fit === "cover"), JSON.stringify(g.items));
    assert.match(g.emptyDetail, /Sélectionnez une image/);
    assert.ok(await page.locator(".pb-media-flag").first().isVisible(), "badge « Alt manquant »");
    await page.locator(".pb-media-item", { hasText: "Bienvenue-dans" }).click(); await wait(250);
    const sel = await page.evaluate(() => { const d = document.querySelector("[data-pb-media]"), r = (e) => e.getBoundingClientRect(); const it = d.querySelector(".pb-media-item.is-chosen"); const nameEl = d.querySelector(".pb-media-row .pb-media-ell"), code = d.querySelector(".pb-media-row code"); const det = d.querySelector(".pb-media-detail"); return { pressed: it.getAttribute("aria-pressed"), check: getComputedStyle(it.querySelector(".pb-media-check")).display, outline: getComputedStyle(it.querySelector(".pb-media-thumb")).boxShadow, nameTrunc: nameEl.scrollWidth > nameEl.clientWidth, nameTitle: nameEl.closest("dd").title, code: code.textContent, codeIn: r(code).right <= r(det).right, overflowX: det.scrollWidth > det.clientWidth, dims: [...d.querySelectorAll(".pb-media-row dd")].map((x) => x.textContent) }; });
    assert.equal(sel.pressed, "true"); assert.equal(sel.check, "flex"); assert.notEqual(sel.outline, "none");
    assert.ok(sel.nameTrunc && /Bienvenue-dans-la-communaute/.test(sel.nameTitle), "nom long tronqué avec info-bulle complète");
    assert.ok(/…/.test(sel.code) && sel.codeIn && !sel.overflowX, "adresse raccourcie, jamais hors du panneau");
    assert.ok(sel.dims.some((x) => /1774 × 887 px/.test(x)) && sel.dims.some((x) => /Ko|Mo/.test(x)) && sel.dims.some((x) => x === "image/png"));
    await page.locator(".pb-media-copy").click(); await wait(300);
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /\/uploads\/.+\.png$/);
    assert.ok(/Adresse copiée/.test(await page.evaluate(() => document.querySelector("[data-pb-toast]").textContent)));
    await page.keyboard.press("Escape"); await wait(80);
    assert.ok(!(await isOpen(page)), "Échap ferme");
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute("aria-label")), "Médiathèque", "focus rendu au bouton qui l'a ouverte");
    await openLibrary(page);
    await page.locator('[data-pb-media] [data-pb-close]').click(); await wait(80);
    assert.ok(!(await isOpen(page)), "le X ferme");
    await ctx.close();
  });

  test("recherche, tri, état « aucune image », sélection au clavier ; import par le bouton ; image renvoyée au widget demandeur (double-clic)", async () => {
    const { ctx, page } = await open();
    await openLibrary(page);
    const names = () => page.evaluate(() => [...document.querySelectorAll(".pb-media-name")].map((e) => e.textContent));
    await page.fill("#pb-media-q", "alpha"); await page.waitForFunction(() => document.querySelectorAll(".pb-media-item").length === 1);
    assert.deepEqual(await names(), ["alpha.png"]);
    await page.fill("#pb-media-q", "zzzzintrouvable"); await page.waitForFunction(() => !document.querySelector("[data-pb-media-empty]").hidden);
    assert.match(await page.locator("[data-pb-media-empty]").textContent(), /Aucune image trouvée[\s\S]*autre terme/);
    await page.fill("#pb-media-q", ""); await page.waitForFunction(() => document.querySelectorAll(".pb-media-item").length >= 3);
    await page.selectOption("#pb-media-sort", "az"); const az = await names();
    assert.deepEqual(az, az.slice().sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base", numeric: true })));
    await page.selectOption("#pb-media-sort", "za"); assert.deepEqual(await names(), az.slice().reverse());
    // clavier : Tab jusqu'à une vignette, Entrée la sélectionne
    await page.locator(".pb-media-item").first().focus(); await page.keyboard.press("Enter"); await wait(150);
    assert.equal(await page.locator(".pb-media-item.is-chosen").count(), 1);
    // import
    await page.setInputFiles("[data-pb-upload]", { name: "nouvelle-image.png", mimeType: "image/png", buffer: png(120, 90, [150, 20, 150]) });
    await page.waitForFunction(() => [...document.querySelectorAll(".pb-media-name")].some((e) => e.textContent === "nouvelle-image.png"), null, { timeout: 15000 });
    assert.match(await page.locator(".pb-media-item.is-chosen .pb-media-name").textContent(), /nouvelle-image/);
    await page.keyboard.press("Escape");
    // retour de l'image au demandeur
    const got = page.evaluate(() => new Promise((resolve) => window.KWEditor.pickImage(resolve)));
    await page.waitForFunction(() => document.querySelector("[data-pb-media]").open && document.querySelectorAll(".pb-media-item").length > 0);
    await page.locator(".pb-media-item", { hasText: "alpha.png" }).dblclick();
    const m = await got;
    assert.ok(m && /\/uploads\/.+\.png$/.test(m.path || m.src || m), JSON.stringify(m));
    assert.ok(!(await isOpen(page)));
    await ctx.close();
  });

  test("texte alternatif : Enregistrer → Enregistrement… → Enregistré, valeur en base, badge retiré ; suppression : image utilisée protégée, image libre supprimée après confirmation", async () => {
    const { ctx, page } = await open();
    await openLibrary(page);
    await page.locator(".pb-media-item", { hasText: "alpha.png" }).click(); await wait(300);
    const save = page.locator(".pb-media-actions .btn-primary");
    assert.equal(await save.isDisabled(), true, "rien à enregistrer tant que rien n'a changé");
    await page.locator(".pb-media-meta input").nth(1).fill("Un carré vert"); assert.equal(await save.isDisabled(), false);
    await save.click();
    await page.waitForFunction(() => /Enregistré/.test((document.querySelector(".pb-media-actions .btn-primary") || {}).textContent || ""), null, { timeout: 8000 });
    assert.equal(srv.db().prepare("SELECT alt FROM mk_media WHERE id = ?").get(medias.plain.id).alt, "Un carré vert");
    assert.equal(await page.locator(".pb-media-item", { hasText: "alpha.png" }).locator(".pb-media-flag").count(), 0, "plus de badge d'alerte");
    // image utilisée : liste des contenus, suppression refusée dans l'interface
    await page.locator(".pb-media-item", { hasText: "zebre-utilise" }).click();
    await page.waitForSelector(".pb-media-usage a"); assert.match(await page.locator(".pb-media-usage").textContent(), /Utilisée dans 1 contenu[\s\S]*Médiathèque/);
    await page.locator(".pb-media-del").click();
    assert.equal(await page.locator(".pb-media-del.is-solid").isDisabled(), true);
    assert.match(await page.locator(".pb-media-confirm").textContent(), /actuellement utilisée/);
    await page.locator(".pb-media-confirm .btn-outline").click(); await wait(150);
    // image libre : confirmation puis suppression
    await page.locator(".pb-media-item", { hasText: "nouvelle-image" }).click().catch(() => {});
    await page.locator(".pb-media-item", { hasText: "alpha.png" }).click(); await wait(300);
    await page.locator(".pb-media-del").click();
    assert.match(await page.locator(".pb-media-confirm").textContent(), /Supprimer cette image \?[\s\S]*ne peut pas être annulée/);
    await page.locator(".pb-media-del.is-solid").click();
    await page.waitForFunction(() => ![...document.querySelectorAll(".pb-media-name")].some((e) => e.textContent === "alpha.png"), null, { timeout: 8000 });
    assert.equal(srv.db().prepare("SELECT COUNT(*) AS n FROM mk_media WHERE id = ?").get(medias.plain.id).n, 0);
    assert.equal(srv.db().prepare("SELECT COUNT(*) AS n FROM mk_media WHERE id = ?").get(medias.used.id).n, 1, "l'image utilisée est intacte");
    await ctx.close();
  });

  test("tailles 1920 → 375 px : pas de débordement horizontal, une seule zone de défilement par volet, X et Importer accessibles", async () => {
    for (const vp of [[1920, 1080], [1440, 900], [1280, 720], [1024, 768], [768, 1024], [480, 800], [375, 700]]) {
      const { ctx, page } = await open({ width: vp[0], height: vp[1] });
      await openLibrary(page);
      await page.locator(".pb-media-item").first().click(); await wait(200);
      const m = await page.evaluate(() => { const d = document.querySelector("[data-pb-media]"), r = d.getBoundingClientRect(), q = (s) => d.querySelector(s), b = (s) => q(s).getBoundingClientRect(); const inside = (s) => { const x = b(s); return x.left >= r.left - 0.5 && x.right <= r.right + 0.5 && x.top >= r.top - 0.5 && x.bottom <= r.bottom + 0.5; }; const scrollers = [...d.querySelectorAll("*")].filter((e) => { const o = getComputedStyle(e).overflowY; return (o === "auto" || o === "scroll") && e.scrollHeight > e.clientHeight + 1; }).map((e) => e.className); return { fits: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, xIn: inside("[data-pb-close]"), upIn: inside(".pb-upload"), searchIn: inside(".pb-media-search"), over: [d, q(".pb-media-left"), q(".pb-media-detail")].some((e) => e.scrollWidth > e.clientWidth + 1), scrollers, imgOk: [...d.querySelectorAll(".pb-media-thumb img")].every((i) => i.naturalWidth > 0), dialogScrolls: d.scrollHeight > d.clientHeight + 1 }; });
      assert.ok(m.fits && m.xIn && m.upIn && m.searchIn && !m.over && m.imgOk && !m.dialogScrolls, `${vp.join("×")} : ${JSON.stringify(m)}`);
      assert.ok(m.scrollers.every((c) => /pb-media-left|pb-media-detail/.test(c)), `${vp.join("×")} : défilements ${m.scrollers}`);
      await ctx.close();
    }
  });
});
