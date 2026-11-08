// Pied de page — ÉLÉMENTS AJOUTÉS par la refonte, rendus avec les VRAIS gabarits (base en mémoire, vraies migrations) : newsletter honnête (état « non configuré » explicite, éditeur ET public),
// formulaire de contact, catégories de produits et liens de boutique (état explicite sans boutique), liens légaux (jamais de lien mort pour les visiteurs), 13 réseaux, accordéon mobile (balisage et script).
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ejs = require("ejs");
const { freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const nodes = require("../src/marketing/pages/nodes");
const business = require("../src/marketing/pages/business");
const landing = require("../src/marketing/landing");
const forms = require("../src/marketing/forms");
const { icon } = require("../src/utils/icons");

describe("éléments ajoutés des pieds de page (rendu des vrais gabarits, sans serveur)", () => {
  let m, A, S1, S2, seq = 0;
  before(() => { m = freshMarketing(); A = m.ctx(1); S1 = pages.createSite(A, { name: "Un" }).id; S2 = pages.createSite(A, { name: "Deux" }).id; });
  const node = (type, props = {}, extra = {}) => ({ id: `e${String(++seq).padStart(3, "0")}${type}`.slice(0, 20), type, props, ...extra });
  const wrap = (...children) => ({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: {}, children }] }] });
  const show = async (siteId, list, { builder = false, locals = {} } = {}) => {
    const p = pages.createPage(A, { name: `E ${++seq}`, kind: "page", site_id: siteId });
    const saved = pages.saveDraft(A, p.id, wrap(...list), { revision: pages.getPage(A, p.id).revision }).content.sections;
    const vm = landing.viewModel(A, { id: p.id, slug: p.slug, site_id: siteId, sections: saved, title: "t", scope: { now: new Date("2026-11-10T08:00:00Z") } });
    let out = "";
    for (const n of vm.sections[0].children[0].children) out += await ejs.renderFile(path.join(__dirname, "../views/marketing-public/_node.ejs"), { n, isBuilder: builder, href: (u) => u, depth: 0, icon, page: { slug: p.slug }, preview: false, asset: (x) => x, formToken: "jeton", ...locals(n) });
    return out;
  };
  const noLocals = { locals: () => ({}) };

  test("newsletter SANS formulaire : état « non configuré » explicite côté visiteur ET éditeur, aucun faux champ ni faux bouton", async () => {
    const n = node("emailsubscribe", { title: "Restez informé", showWhenMissing: true });
    const pub = await show(S1, [n], noLocals), edit = await show(S1, [n], { builder: true, ...noLocals });
    assert.match(pub, /Inscription par e-mail non configurée/);
    assert.match(pub, /data-kw-state="not-configured"/);
    assert.ok(!/<form|<button|<input|Audience|formulaire d.inscription/i.test(pub), "pas de faux formulaire, pas de jargon pour le visiteur : " + pub);
    assert.match(edit, /Inscription par e-mail non configurée/);
    assert.match(edit, /Audience → Formulaires d’inscription/, "l'éditeur dit où le régler");
    assert.ok(!/<form|<button/i.test(edit));
  });
  test("newsletter : sans le réglage, comportement d'avant conservé (rien en public) ; message personnalisable", async () => {
    assert.equal((await show(S1, [node("emailsubscribe", {})], noLocals)).replace(/\s+/g, ""), "");
    assert.match(await show(S1, [node("emailsubscribe", { showWhenMissing: true, missingText: "Bientôt disponible" })], noLocals), /Bientôt disponible/);
  });
  test("newsletter AVEC formulaire publié du site : vrai formulaire (consentement, protections), succès et erreur visibles", async () => {
    const f = forms.createForm(A, { name: "Lettre", fields: [], consentText: "J'accepte de recevoir la lettre.", siteId: S1 }); forms.setStatus(A, f.id, "published");
    const n = node("emailsubscribe", { title: "Restez informé", button: "S'abonner", showWhenMissing: true });
    const h = await show(S1, [n], noLocals);
    assert.match(h, /name="email"/); assert.match(h, /name="consent"/); assert.match(h, /name="website"/); assert.ok(!/non configurée/.test(h));
    const ok = await show(S1, [n], { locals: (x) => ({ widgetForm: { id: x.id, thanks: "Merci, vous êtes inscrit." } }) });
    assert.match(ok, /role="status"[^>]*>Merci, vous êtes inscrit\./);
    const ko = await show(S1, [n], { locals: (x) => ({ widgetForm: { id: x.id, error: "Adresse e-mail invalide.", values: {} } }) });
    assert.match(ko, /role="alert"[^>]*>Adresse e-mail invalide\./);
    assert.ok(!(await show(S2, [n], noLocals)).includes("name=\"email\""), "le formulaire d'un autre site n'est jamais proposé");
  });
  test("formulaire de contact : tous les champs du formulaire publié du site ; sans formulaire, état explicite", async () => {
    const n = node("emailsubscribe", { title: "Écrivez-nous", button: "Envoyer", fields: "all", showWhenMissing: true });
    assert.match(await show(S2, [n], noLocals), /Formulaire de contact non configuré/);
    const f = forms.createForm(A, { name: "Contact", fields: ["first_name", "phone"], consentText: "J'accepte d'être recontacté.", siteId: S2 }); forms.setStatus(A, f.id, "published");
    const h = await show(S2, [n], noLocals);
    assert.match(h, /name="first_name"/); assert.match(h, /name="phone"/); assert.match(h, /name="consent"/); assert.match(h, /Envoyer/);
  });
  test("publication non bloquée : un pied avec « non configuré » se publie sans formulaire ; sans ce réglage, l'avertissement d'avant reste", () => {
    const sansForm = pages.createSite(A, { name: "Vide" }).id;
    const brouillon = (props) => { const p = pages.createPage(A, { name: `Q ${++seq}`, kind: "page", site_id: sansForm }); pages.saveDraft(A, p.id, wrap(node("emailsubscribe", props)), { revision: pages.getPage(A, p.id).revision }); return p.id; };
    assert.throws(() => pages.publish(A, brouillon({})), /Abonnement par e-mail/, "avant : bloqué");
    assert.doesNotThrow(() => pages.publish(A, brouillon({ showWhenMissing: true })), "avec l'état explicite : pas de blocage");
  });
  test("catégories de produits et liens de boutique : état explicite quand le module Commerce n'est pas actif (jamais de faux contenu)", async () => {
    const cats = await show(S1, [node("shopcategories", {})], noLocals);
    assert.match(cats, /Aucune catégorie de produits pour le moment\./); assert.match(cats, /data-kw-state="shop-off"/);
    assert.ok(!/<a /.test(cats));
    const edit = await show(S1, [node("shopcategories", {})], { builder: true, ...noLocals });
    assert.match(edit, /module Commerce n’est pas activé/);
    const liens = await show(S1, [node("shoplinks", { title: "Service client" })], noLocals);
    assert.match(liens, /La boutique n'est pas encore ouverte\.|La boutique n&#39;est pas encore ouverte\./); assert.ok(!/<a /.test(liens));
  });
  test("catégories de produits et liens de boutique AVEC boutique ouverte : vraies catégories, vrais liens /boutique/…", async () => {
    const S = pages.createSite(A, { name: "Boutique" }).id;
    m.db.prepare("INSERT INTO mk_site_modules (organization_id, site_id, module, enabled) VALUES (1, ?, 'commerce', 1)").run(S);
    m.db.prepare("INSERT INTO mk_shop_settings (organization_id, site_id, enabled) VALUES (1, ?, 1)").run(S);
    const cat = m.db.prepare("INSERT INTO mk_shop_categories (organization_id, site_id, name, slug) VALUES (1, ?, 'Chaussures', 'chaussures')").run(S).lastInsertRowid;
    m.db.prepare("INSERT INTO mk_shop_categories (organization_id, site_id, name, slug) VALUES (1, ?, 'Vide', 'vide')").run(S);
    const pr = m.db.prepare("INSERT INTO mk_shop_products (organization_id, site_id, name, slug, status) VALUES (1, ?, 'Basket', 'basket', 'published')").run(S).lastInsertRowid;
    m.db.prepare("INSERT INTO mk_shop_product_categories (product_id, category_id) VALUES (?, ?)").run(pr, cat);
    const cats = await show(S, [node("shopcategories", { showCount: true })], noLocals);
    assert.match(cats, /href="\/boutique\/categorie\/chaussures">Chaussures<\/a>/); assert.match(cats, /\(1\)/); assert.ok(!cats.includes("Vide"), "catégorie sans produit ignorée");
    const liens = await show(S, [node("shoplinks", {})], noLocals);
    assert.match(liens, /href="\/boutique\/compte">Suivre ma commande/); assert.match(liens, /href="\/boutique\/panier">Panier/);
    assert.ok(!liens.includes("Livraison et retours"), "pas de lien tant que les conditions de vente ne sont pas renseignées");
    business.save(m.db, 1, S, { legalName: "Boutique", legalPages: { terms: "/conditions-de-vente" } });
    assert.match(await show(S, [node("shoplinks", {})], noLocals), /href="\/conditions-de-vente">Livraison et retours/);
  });
  test("liens légaux : seules les pages renseignées sont des liens ; l'éditeur signale les manquantes ; les visiteurs ne voient jamais de lien mort", async () => {
    const S = pages.createSite(A, { name: "Légal" }).id;
    business.save(m.db, 1, S, { legalName: "Légal SARL", legalPages: { notice: "/mentions-legales" } });
    const n = node("bizlegal", { title: "", showName: false, showForm: false, showRegistrations: false, showPublisher: false, showHost: false, showPages: true, layout: "inline", hintMissing: true });
    const pub = await show(S, [n], noLocals);
    assert.match(pub, /href="\/mentions-legales">Mentions légales/); assert.ok(!/confidentialité|Conditions générales/.test(pub), pub);
    const edit = await show(S, [n], { builder: true, ...noLocals });
    assert.match(edit, /Pages légales non renseignées[^<]*Politique de confidentialité, Conditions générales de vente/);
  });
  test("accordéon mobile : balisage de l'option (publié), script avec requête ≤ 767 px, boutons de 44 px, mouvement réduit", async () => {
    const panel = (title) => node("container", {}, { name: title, children: [node("text", { html: "<p>Contenu</p>" })] });
    const acc = node("container", { mode: "accordion", accStart: "none", accMobile: true }, { children: [panel("Produits"), panel("Aide")] });
    const h = await show(S1, [acc], noLocals);
    assert.match(h, /data-kw-nacc[^>]*data-kw-acc-mobile/); assert.match(h, /data-kw-title="Produits"/); assert.match(h, /data-kw-title="Aide"/);
    assert.ok(h.includes("Contenu"), "le contenu est dans la page sans JavaScript");
    const classique = node("container", { mode: "accordion" }, { children: [panel("A")] });
    assert.ok(!/data-kw-acc-mobile/.test(await show(S1, [classique], noLocals)), "accordéon ordinaire inchangé");
    const js = fs.readFileSync(path.join(__dirname, "../public/js/landing.js"), "utf8"), css = fs.readFileSync(path.join(__dirname, "../public/css/landing.css"), "utf8");
    assert.match(js, /matchMedia\("\(max-width: 767px\)"\)/); assert.match(js, /aria-expanded/); assert.match(js, /aria-controls/);
    assert.match(css, /\.kw-nacc\[data-kw-acc-mobile\] > \.kw-nacc-head \{ min-height: 44px; \}/);
    assert.match(css, /prefers-reduced-motion: reduce\) \{ \.kw-nacc-head/);
    assert.ok(nodes.editorSpec().types.some((t) => t.type === "container"));
  });
});
