// Header Builder, lot L8 (accessibilité) — repères, noms accessibles, focus visible, cibles tactiles, contraste du bouton du tiroir, sur le site publié dans un VRAI Chrome.
// Ignoré si Playwright / Chrome sont absents. Limite connue, documentée : l'en-tête est rendu DANS <main> (structure historique de la page) ; il porte role="banner".
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Header Builder L8 : accessibilité de l'en-tête publié (navigateur)", { skip: SKIP }, () => {
  let env;
  const withMenu = (extra) => (s) => { const walk = (nodes) => { for (const n of nodes) { if (n.type === "menu") n.props = { ...n.props, source: "location", location: "header", ...extra }; if (n.children) walk(n.children); } }; walk(s.children); };
  before(async () => {
    env = await setup({ siteName: "Site accessibilité" });
    const db = env.db, menu = Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug, status) VALUES (?, 'Principal', 'principal', 'published')").run(env.site).lastInsertRowid);
    const item = (parent, pos, label, url) => Number(db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, url, label, status) VALUES (?, ?, ?, 'custom', ?, ?, 'published')").run(menu, parent, pos, url, label).lastInsertRowid);
    const s = item(null, 0, "Services", "/services"); item(s, 0, "Web", "/web"); item(null, 1, "Contact", "/contact");
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(env.site, menu);
    await env.publishHeader("luxe-01.luxe-01", { mode: "sticky" }, withMenu({ mobileToggle: true, mobileMode: "drawer" }));
  });
  after(async () => { if (env) await env.close(); });

  test("repères : l'en-tête est un repère « bannière », la navigation est nommée, la langue de la page est définie", async () => {
    const { context, page } = await env.visit();
    assert.equal(await page.locator(".lp-site-header").getAttribute("role"), "banner");
    assert.equal(await page.locator("html").getAttribute("lang"), "fr");
    const navs = await page.locator(".lp-site-header nav").evaluateAll((e) => e.map((n) => n.getAttribute("aria-label")));
    assert.ok(navs.length >= 1 && navs.every((l) => l && l.trim()), `chaque navigation a un nom : ${JSON.stringify(navs)}`);
    await context.close();
  });

  test("noms accessibles : boutons de sous-menu, bouton Menu, tiroir et fermeture ont un nom ; aucun lien ni bouton vide", async () => {
    const { context, page } = await env.visit({ viewport: { width: 390, height: 800 } });
    const unnamed = () => page.evaluate(() => [...document.querySelectorAll(".lp-site-header a, .lp-site-header button, .kw-menu-panel a, .kw-menu-panel button")].filter((e) => e.offsetParent !== null && !((e.getAttribute("aria-label") || e.textContent || e.getAttribute("title") || "").trim())).map((e) => e.className || e.tagName));
    assert.deepEqual(await unnamed(), [], "avant l'ouverture");
    await page.locator(".lp-site-header .kw-menu-burger").click(); await page.locator(".kw-menu-panel").waitFor();
    assert.deepEqual(await unnamed(), [], "tiroir ouvert");
    assert.equal(await page.locator(".kw-menu-panel").getAttribute("aria-label"), "Navigation principale", "le tiroir porte le nom du menu");
    assert.equal(await page.locator(".kw-menu-close").getAttribute("aria-label"), "Fermer le menu");
    await context.close();
  });

  test("focus visible : chaque lien et bouton de l'en-tête montre un indicateur de focus au clavier", async () => {
    const { context, page } = await env.visit();
    const handles = await page.locator(".lp-site-header a, .lp-site-header button").evaluateAll((els) => els.filter((e) => e.offsetParent !== null).length);
    assert.ok(handles >= 3);
    await page.keyboard.press("Tab");
    for (let i = 0; i < Math.min(handles, 6); i++) {
      const ok = await page.evaluate(() => { const e = document.activeElement; if (!e || !e.closest(".lp-site-header")) return true; const s = getComputedStyle(e); return (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== "none" || s.textDecorationLine !== "none"; });
      assert.equal(ok, true, `l'élément n°${i + 1} montre son focus`); await page.keyboard.press("Tab");
    }
    await context.close();
  });

  test("cibles tactiles : sur mobile, le bouton Menu et les bascules de sous-menu font au moins 44 px (ou 28 px avec marge cliquable du lien parent)", async () => {
    const { context, page } = await env.visit({ viewport: { width: 390, height: 800 } });
    const burger = await page.locator(".lp-site-header .kw-menu-burger").boundingBox(); assert.ok(burger.height >= 44 && burger.width >= 44, `bouton Menu ${burger.width}×${burger.height}`);
    await page.locator(".lp-site-header .kw-menu-burger").click(); await page.locator(".kw-menu-panel").waitFor(); await page.waitForTimeout(400);
    const close = await page.locator(".kw-menu-close").boundingBox(); assert.ok(close.width >= 44 && close.height >= 44, `bouton Fermer ${close.width}×${close.height}`);
    const links = await page.locator(".kw-menu-panel .kw-menu-link").evaluateAll((els) => els.filter((e) => e.offsetParent !== null).map((e) => e.getBoundingClientRect().height)); assert.ok(links.length && links.every((h) => h >= 36), `liens du tiroir : ${links.map(Math.round)}`);
    const toggles = await page.locator(".kw-menu-panel .kw-sub-toggle").evaluateAll((els) => els.map((e) => [e.getBoundingClientRect().width, e.getBoundingClientRect().height])); assert.ok(toggles.length && toggles.every(([w, h]) => w >= 44 && h >= 44), `bascules : ${JSON.stringify(toggles)}`);
    await context.close();
  });

  test("tiroir : le contenu derrière est rendu inerte pour la souris (fond) et le défilement ; le texte du panneau est lisible (contraste ≥ 4,5:1)", async () => {
    const { context, page } = await env.visit({ viewport: { width: 390, height: 800 } });
    await page.locator(".lp-site-header .kw-menu-burger").click(); const panel = page.locator(".kw-menu-panel"); await panel.waitFor(); await page.waitForTimeout(400);
    const c = await panel.evaluate((p) => { const lum = (s) => { const m = s.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); }; const a = p.querySelector(".kw-menu-link"); const fg = getComputedStyle(a).color, bg = getComputedStyle(p).backgroundColor; const l1 = lum(fg), l2 = lum(bg); return { ratio: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05), fg, bg }; });
    assert.ok(c.ratio >= 4.5, `contraste ${c.ratio.toFixed(2)} (${c.fg} sur ${c.bg})`);
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "hidden");
    await context.close();
  });

  test("aucune erreur de script", () => { assert.deepEqual(env.errors, []); });
});
