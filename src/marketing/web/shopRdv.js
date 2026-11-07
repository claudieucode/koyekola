// Prise de rendez-vous : pages publiques (/boutique/rendez-vous) et écrans d'administration de la boutique d'un site.
// Branché par UNE ligne dans shopPublic.js (hérite du garde « module Commerce + boutique ouverte ») et UNE ligne dans shopAdmin.js (hérite des droits et du site vérifié).
const { MarketingError } = require("../errors");
const { flashOk } = require("./kit");
const appts = require("../shop/appointments");
const notify = require("../shop/notify");
const catalog = require("../shop/catalog");

const DAYS = ["", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const frDate = (d) => { const [y, m, j] = String(d).slice(0, 10).split("-").map(Number); return `${DAYS[appts.isoWeekday(String(d).slice(0, 10))]} ${j} ${MONTHS[m - 1]} ${y}`; };
const STATUS = { pending: "À confirmer", confirmed: "Confirmé", cancelled: "Annulé" };

function mountPublic({ router, BASE, render, present, limiter, wantsJson }) {
  const PATH = `${BASE}/rendez-vous`;
  const origin = (req) => `${req.protocol}://${req.get("host")}`;
  const cancelUrl = (req, a) => `${origin(req)}${PATH}/annuler/${a.id}?k=${appts.token(a)}`;
  const common = (req) => {
    const { s } = req.shop;
    const settings = appts.getSettings(s);
    const types = appts.listTypes(s, { activeOnly: true });
    let product = null;
    const slug = String(req.query.produit || (req.body && req.body.produit) || "").slice(0, 160);
    if (slug) product = catalog.publicProduct(s, slug);
    return { settings, types, product, frDate, productSlug: product ? product.slug : "" };
  };
  const unavailable = (req, res, c) => render(req, res, "rendez-vous", { title: "Rendez-vous", step: "unavailable", ...c, error: null, values: {} }, 404);

  router.get(PATH, (req, res) => {
    const { s } = req.shop;
    const c = common(req);
    if (!c.settings.enabled || !c.types.length) return unavailable(req, res, c);
    const type = c.types.find((t) => String(t.id) === String(req.query.type || ""));
    let step = "types"; let days = []; let slots = []; let date = "";
    if (type) {
      date = String(req.query.date || "");
      if (appts.validDate(date)) { slots = appts.slotsFor(s, type, date); step = "slots"; }
      if (step !== "slots") { days = appts.availableDays(s, type); step = "dates"; }
    }
    render(req, res, "rendez-vous", { title: "Prendre rendez-vous", step, ...c, type, days, slots, date, error: null, values: {} });
  });
  router.get(`${PATH}/creneaux.json`, (req, res) => {
    const { s } = req.shop;
    const settings = appts.getSettings(s);
    const type = settings.enabled ? appts.getType(s, req.query.type) : null;
    if (!type || !type.active) return res.status(404).json({ error: "Type de rendez-vous introuvable." });
    const date = String(req.query.date || "");
    if (!appts.validDate(date)) return res.status(422).json({ error: "Date invalide." });
    res.json({ date, duration_min: type.duration_min, slots: appts.slotsFor(s, type, date).map((x) => x.time) });
  });
  router.post(PATH, (req, res) => {
    const { s, settings: shopSettings } = req.shop;
    const c = common(req);
    if (!c.settings.enabled || !c.types.length) return unavailable(req, res, c);
    const b = req.body || {};
    const type = c.types.find((t) => String(t.id) === String(b.type_id || ""));
    const redo = (error, status) => render(req, res, "rendez-vous", { title: "Prendre rendez-vous", step: type ? "slots" : "types", ...c, type, days: [], slots: type && appts.validDate(String(b.date || "")) ? appts.slotsFor(s, type, String(b.date)) : [], date: String(b.date || ""), error, values: b }, status);
    const key = `rdv|${req.ip}|${s.siteId}`;
    if (limiter.isLimited(key)) return redo("Trop de tentatives. Réessayez dans quelques minutes.", 429);
    if (String(b.website || "")) return redo("Demande refusée.", 422); // champ-piège : un visiteur réel ne le remplit pas
    try {
      const a = appts.book(s, { type_id: b.type_id, date: b.date, time: b.time, name: b.name, email: b.email, phone: b.phone, note: b.note, product_id: c.product ? c.product.id : null });
      const shopName = present(req).shop.name;
      limiter.hit(key); // seules les réservations réussies (donc les e-mails envoyés) comptent
      notify.notifyAppointment(s, a, "customer_created", { shopName, cancelUrl: cancelUrl(req, a) });
      if (shopSettings.notify_email) notify.notifyAppointment(s, a, "admin_created", { to: shopSettings.notify_email, shopName });
      render(req, res, "rendez-vous", { title: "Rendez-vous enregistré", step: "done", ...c, type, appointment: a, cancelLink: cancelUrl(req, a), error: null, values: {} });
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      redo(error.message, error.code === "conflict" ? 409 : error.code === "not_found" ? 404 : 422);
    }
  });
  const cancelPage = (req, res, extra = {}, status = 200) => {
    const { s } = req.shop;
    const a = appts.get(s, req.params.id);
    if (!a || !appts.tokenOk(a, req.query.k)) return res.status(404).render("error", { message: "Ce lien d'annulation n'est pas valide." });
    render(req, res, "rendez-vous", { title: "Annuler mon rendez-vous", step: "cancel", ...common(req), appointment: a, k: String(req.query.k), error: null, done: false, ...extra }, status);
  };
  router.get(`${PATH}/annuler/:id(\\d+)`, (req, res) => cancelPage(req, res));
  router.post(`${PATH}/annuler/:id(\\d+)`, (req, res) => {
    const { s, settings: shopSettings } = req.shop;
    try {
      const r = appts.cancelByCustomer(s, req.params.id, req.query.k);
      if (!r.already && shopSettings.notify_email) notify.notifyAppointment(s, r.appointment, "admin_cancelled", { to: shopSettings.notify_email, shopName: present(req).shop.name });
      if (wantsJson(req)) return res.json({ ok: true });
      render(req, res, "rendez-vous", { title: "Rendez-vous annulé", step: "cancel", ...common(req), appointment: r.appointment, k: String(req.query.k), error: null, done: true });
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      res.status(404).render("error", { message: error.message });
    }
  });
}

function mountAdmin({ route, render, audit }) {
  const back = (req) => `${req.shopSpace.base}/boutique/rendez-vous`;
  const names = (req) => ({ shopName: (req.shopSpace && req.shopSpace.name) || "" });
  route("get", "/rendez-vous", "shop.read", (req, res, s) => {
    const list = appts.adminList(s, { status: req.query.statut, scope: req.query.periode === "passes" ? "past" : "upcoming", page: req.query.page });
    render(req, res, "rendez-vous", "Boutique — rendez-vous", "boutique/rendez-vous", { list, frDate, STATUS, tz: appts.getSettings(s).timezone });
  });
  route("get", "/rendez-vous/reglages", "shop.read", (req, res, s) => {
    render(req, res, "rendez-vous-reglages", "Boutique — réglages des rendez-vous", "boutique/rendez-vous", { apptSettings: appts.getSettings(s), types: appts.listTypes(s), rules: appts.listRules(s), exceptions: appts.listExceptions(s), DAYS, frDate });
  });
  const after = (req, res, msg, to) => { flashOk(req, msg); res.redirect(to || `${back(req)}/reglages`); };
  route("post", "/rendez-vous/reglages", "shop.write", (req, res, s) => { appts.saveSettings(s, { ...req.body, enabled: req.body.enabled ? "1" : "0", auto_confirm: req.body.auto_confirm ? "1" : "0" }); audit(req, s, "shop_appt.settings", "shop_appt_settings", s.siteId ?? 0); after(req, res, "Réglages enregistrés."); }, { write: true });
  route("post", "/rendez-vous/types", "shop.write", (req, res, s) => { const id = appts.saveType(s, req.body); audit(req, s, "shop_appt.type_saved", "shop_appt_type", id); after(req, res, "Type de rendez-vous enregistré."); }, { write: true });
  route("post", "/rendez-vous/types/:tid(\\d+)/supprimer", "shop.write", (req, res, s) => { const r = appts.removeType(s, req.params.tid); audit(req, s, "shop_appt.type_removed", "shop_appt_type", req.params.tid); after(req, res, r === "deleted" ? "Type supprimé." : "Ce type a déjà des rendez-vous : il est désactivé (l'historique reste lisible)."); }, { write: true });
  route("post", "/rendez-vous/disponibilites", "shop.write", (req, res, s) => { appts.addRule(s, req.body); audit(req, s, "shop_appt.rule_added", "shop_appt_rule", ""); after(req, res, "Disponibilité ajoutée."); }, { write: true });
  route("post", "/rendez-vous/disponibilites/:rid(\\d+)/supprimer", "shop.write", (req, res, s) => { appts.removeRule(s, req.params.rid); after(req, res, "Disponibilité retirée."); }, { write: true });
  route("post", "/rendez-vous/exceptions", "shop.write", (req, res, s) => { appts.addException(s, req.body); after(req, res, "Exception ajoutée."); }, { write: true });
  route("post", "/rendez-vous/exceptions/:eid(\\d+)/supprimer", "shop.write", (req, res, s) => { appts.removeException(s, req.params.eid); after(req, res, "Exception retirée."); }, { write: true });
  const notice = (req, s, a, event) => notify.notifyAppointment(s, a, event, { ...names(req), cancelUrl: `${req.protocol}://${req.get("host")}/boutique/rendez-vous/annuler/${a.id}?k=${appts.token(a)}`, bookingUrl: `${req.protocol}://${req.get("host")}/boutique/rendez-vous` });
  route("post", "/rendez-vous/:aid(\\d+)/statut", "shop.write", (req, res, s) => {
    const before = appts.get(s, req.params.aid);
    const a = appts.setStatus(s, req.params.aid, req.body.statut);
    audit(req, s, "shop_appt.status", "shop_appointment", a.id, { status: a.status });
    if (before && before.status !== a.status) notice(req, s, a, a.status === "confirmed" ? "customer_confirmed" : "customer_cancelled");
    after(req, res, a.status === "confirmed" ? "Rendez-vous confirmé ; le client est prévenu par e-mail." : "Rendez-vous annulé ; le client est prévenu par e-mail.", back(req));
  }, { write: true });
  route("post", "/rendez-vous/:aid(\\d+)/reporter", "shop.write", (req, res, s) => {
    const a = appts.reschedule(s, req.params.aid, String(req.body.date || ""), String(req.body.time || ""));
    audit(req, s, "shop_appt.rescheduled", "shop_appointment", a.id, { start_at: a.start_at });
    notice(req, s, a, "customer_rescheduled");
    after(req, res, "Rendez-vous reporté ; le client est prévenu par e-mail.", back(req));
  }, { write: true });
}

module.exports = { mountPublic, mountAdmin };
