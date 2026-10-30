// Programme 22.1 — Laboratoire : boutiques de référence par le constructeur de boutique (21.10, analyse et plan par RÈGLES, sans IA) puis le moteur natif (20.5).
// Produits fictifs fournis par le scénario : le constructeur n'invente ni prix ni stock. Aucun paiement réel : seul le paiement manuel est utilisé.
const pages = require("../../src/marketing/pages");
const project = require("../../src/marketing/ai/shop/project");
const siteModules = require("../../src/marketing/siteModules");
const { time } = require("./generate");

const CATALOGS = {
  boutique: { currency: "EUR", items: [["Vase en grès Aube", "Grès émaillé fait main", "Hauteur 24 cm", "Maison"], ["Bougie Cèdre", "Cire végétale", "Durée environ 40 heures", "Maison"], ["Plaid en lin", "Lin lavé", "130 x 170 cm", "Textile"], ["Miroir rond Soleil", "Cadre en bois", "Diamètre 60 cm", "Maison"], ["Coussin Sable", "Housse déhoussable", "45 x 45 cm", "Textile"], ["Plateau en chêne", "Chêne massif huilé", "40 x 28 cm", "Maison"]] },
  mode: { currency: "EUR", items: [["Chemise Lin Marine", "Lin 100 %", "Coupe droite", "Hauts"], ["Pantalon Droit Sable", "Coton épais", "Taille haute", "Bas"], ["Robe Portefeuille", "Viscose", "Longueur midi", "Robes"], ["Veste Courte Olive", "Coton", "Deux poches", "Vestes"], ["Pull Maille Écru", "Laine mérinos", "Col rond", "Hauts"], ["Jupe Plissée Noire", "Polyester recyclé", "Longueur genou", "Bas"]] },
  informatique: { currency: "EUR", items: [["Clavier mécanique K1", "Disposition AZERTY", "Connexion USB-C", "Claviers"], ["Souris sans fil M2", "Capteur optique", "Autonomie 6 mois", "Souris"], ["Écran 27 pouces QHD", "Dalle IPS", "Port HDMI et DisplayPort", "Écrans"], ["Hub USB-C 7 ports", "HDMI, USB-A, lecteur SD", "Alimentation 100 W", "Accessoires"], ["Casque USB Studio", "Microphone intégré", "Câble 2 m", "Audio"], ["Webcam Full HD", "Autofocus", "Fixation écran", "Accessoires"]] },
};

async function generateShop(A, sc, { host, srv, boss }) {
  const obs = { id: sc.id, shop: true, timings: {}, notes: [] };
  const cat = CATALOGS[sc.id];
  const site = pages.createSite(A, { name: sc.plan.site.name }); const siteId = site.id; obs.siteId = siteId;
  siteModules.setEnabled(A, siteId, "ai", true); siteModules.setEnabled(A, siteId, "commerce", true);
  let r = await time(async () => project.create(A, { brief: sc.brief, siteId })); obs.timings.analyse = r.ms; let v = r.value; const id = v.id;
  obs.analysis = { readiness: v.analysis.readiness, facts: Object.keys(v.analysis.facts), missing: (v.analysis.missing || []).map((m) => m.key), sector: v.analysis.sector && v.analysis.sector.key, warnings: v.analysis.warnings || [] };
  obs.plan = { pages: v.plan.pages.map((p) => `${p.kind}:${p.name}`), categories: (v.structure.categories || []).map((c) => c.name) };
  v = project.edit(A, id, { op: "accept_plan" }, { revision: v.revision }); v = project.edit(A, id, { op: "accept_structure" }, { revision: v.revision });
  r = await time(async () => project.applyStructure(A, id)); obs.timings.structure = r.ms; obs.structure = r.value;
  r = await time(() => project.applyPages(A, id)); obs.timings.pages = r.ms; obs.pagesApplied = { created: r.value.created, keys: Object.keys(r.value.pages || {}) };
  v = project.view(project.load(A, id));
  let i = 0; for (const [name, a, b, c] of cat.items) {
    i += 1; const category = (v.structure.categories.find((x) => x.name.toLowerCase().includes(c.toLowerCase().slice(0, 4))) || {}).name;
    v = project.edit(A, id, { op: "add_product", product: { name, facts: [a, b], category: category || undefined, price: String(19 + i * 11) + ",90", sku: `${sc.id.slice(0, 3).toUpperCase()}-${i}`, stock: 20 } }, { revision: v.revision });
  }
  for (const d of v.products) { try { v = await project.generateProduct(A, id, d.key, {}); } catch (e) { obs.notes.push(`brouillon ${d.name} : ${e.message}`); } }
  obs.productDrafts = v.products.map((p) => ({ name: p.name, source: p.content && p.content.source, missing: (p.missing || []).map((m) => m.key), issues: (p.issues || []).length, desc: String((p.content && p.content.description) || p.description || "").slice(0, 160) }));
  r = await time(async () => project.applyProducts(A, id)); obs.timings.products = r.ms; obs.productsApplied = r.value.results.map((x) => `${x.name}:${x.status}`);
  // Réglages commerciaux par les routes d'administration (comme une personne)
  const P = `/marketing/site-web/sites/${siteId}/boutique`;
  await boss.post(`${P}/livraison/zones`, { name: "France", countries: "FR" });
  const db = srv.db(); const zid = (db.prepare("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?").get(siteId) || {}).id;
  if (zid) await boss.post(`${P}/livraison/zones/${zid}/methodes`, { name: "Colissimo", kind: "flat", cost: "5,90" });
  await boss.post(`${P}/reglages`, { currency: cat.currency.toLowerCase(), default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", manual_instructions: "Virement : coordonnées envoyées par e-mail." });
  db.close();
  try { r = await time(async () => project.publish(A, id, { pages: true, open: true })); obs.timings.publish = r.ms; obs.publish = { products: r.value.products, pages: r.value.pages, refused: r.value.refused, opened: r.value.opened, ready: r.value.validation && r.value.validation.readyToSell, blockers: r.value.validation && r.value.validation.blockers }; }
  catch (e) { obs.publish = { error: e.message }; }
  const list = pages.sitePages(A, siteId); obs.pages = list.map((p) => ({ id: p.id, name: p.name, slug: p.slug, status: p.status }));
  const home = list.find((p) => /accueil/i.test(p.name)); if (home) { try { pages.setHomePage(A, siteId, home.id); obs.homeId = home.id; } catch (e) { obs.notes.push(e.message); } }
  A.db.prepare("INSERT INTO mk_site_domains (organization_id, site_id, host, kind, status, is_canonical, verification_method, verified_at) VALUES (?, ?, ?, 'custom', 'verified', 1, 'test', datetime('now'))").run(A.organizationId, siteId, host);
  obs.host = host;
  return obs;
}

// Parcours d'achat simulé dans Chrome : catalogue → fiche → panier → caisse (paiement manuel) → confirmation. Aucune transaction réelle.
async function journey(browser, base, width) {
  const out = { width, steps: {}, errors: [] };
  const context = await browser.newContext({ viewport: { width, height: 900 } }); context.setDefaultTimeout(12000); const page = await context.newPage();
  page.on("pageerror", (e) => out.errors.push(e.message.slice(0, 120)));
  const step = async (name, fn) => { const t = Date.now(); try { await fn(); out.steps[name] = { ok: true, ms: Date.now() - t }; } catch (e) { out.steps[name] = { ok: false, error: e.message.slice(0, 140) }; throw e; } };
  try {
    await step("catalogue", async () => { await page.goto(`${base}/boutique`); await page.locator(".sh-card").first().waitFor(); });
    await step("fiche", async () => { await page.locator(".sh-card-link").first().click(); await page.locator("[data-sh-add] button[type=submit]").waitFor(); });
    await step("ajout", async () => { await page.locator("[data-sh-add] button[type=submit]").click(); await page.locator("[data-sh-msg]").filter({ hasText: "Ajouté" }).waitFor(); });
    await step("panier", async () => { await page.goto(`${base}/boutique/panier`); await page.locator(".sh-table").waitFor(); });
    await step("caisse", async () => { await page.goto(`${base}/boutique/commande?pays=FR`); await page.locator("form.sh-form").waitFor(); });
    await step("commande", async () => {
      const f = (n, v) => page.fill(`form.sh-form [name="${n}"]`, v).catch(() => {});
      await f("email", "client.test@example.com"); await f("ship_name", "Camille Test"); await f("ship_line1", "1 rue de l'Essai"); await f("ship_postal_code", "75001"); await f("ship_city", "Paris"); await f("ship_phone", "0102030405");
      await page.locator('form.sh-form [name="same_billing"]').check().catch(() => {});
      await page.locator('form.sh-form [name="shipping_method"]').first().check().catch(() => {});
      await page.locator('form.sh-form [name="payment_method"]').first().check().catch(() => {});
      await page.locator("form.sh-form button[type=submit]").last().click(); await page.waitForURL(/confirmation/, { timeout: 15000 });
    });
  } catch (e) { out.failedAt = e.message.split("\n")[0].slice(0, 160); out.failedUrl = page.url(); out.pageText = (await page.locator("main, body").first().innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 300); }
  out.finalUrl = page.url().replace(/\?k=.*/, "?k=…"); await context.close();
  return out;
}

module.exports = { generateShop, journey };
