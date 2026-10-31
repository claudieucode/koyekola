// Tableau de bord de performance (programme 22.9) : /site-web/sites/:id/performance + API JSON. Le site vient de l'ADRESSE (revérifié par le service), jamais du corps.
// Droits : forms.read (voir, analyser, comparer) · forms.write (régler l'optimisation). L'analyse lit une page publiée DU SITE par requête locale (jamais d'adresse fournie par l'utilisateur).
const express = require("express");
const http = require("node:http");
const zlib = require("node:zlib");
const P = require("../../perfEngine");
const R = require("../../regen");
const { need } = require("./kit");
const { MarketingError } = require("../errors");

const STATUS = { not_found: 404, forbidden: 403, module_disabled: 403, invalid_field: 422 };
// Requête locale vers ce serveur : même hôte que la requête d'administration (pour le routage par domaine), jamais une cible choisie par l'utilisateur
function loopback(req) {
  return (pathname) => new Promise((resolve, reject) => {
    const t0 = process.hrtime.bigint(); let ttfb = null;
    const r = http.request({ host: "127.0.0.1", port: req.socket.localPort, path: pathname, method: "GET", timeout: 15000, headers: { host: req.headers.host || "localhost", "accept-encoding": "gzip", "x-forwarded-proto": "https", "user-agent": "Kolakisa-PerfAnalyzer/22.9" } }, (res) => {
      ttfb = Number(process.hrtime.bigint() - t0) / 1e6;
      const chunks = []; res.on("data", (c) => chunks.push(c));
      res.on("end", () => { let buf = Buffer.concat(chunks); try { if (/gzip/.test(res.headers["content-encoding"] || "")) buf = zlib.gunzipSync(buf); } catch (e) { return reject(e); } resolve({ status: res.statusCode, html: buf.toString("utf8"), headers: res.headers, ttfbMs: Math.round(ttfb) }); });
    });
    r.on("timeout", () => r.destroy(new Error("délai dépassé"))); r.on("error", reject); r.end();
  });
}
module.exports = () => {
  const router = express.Router();
  const B = "/site-web/sites/:id(\\d+)/performance", A = `${B}/api`;
  const sid = (req) => Number(req.params.id), body = (req) => (req.body && typeof req.body === "object" ? req.body : {});
  const run = (fn) => (req, res, next) => Promise.resolve().then(() => fn(req.mk.ctx, sid(req), req)).then((d) => res.set("Cache-Control", "no-store").json({ ok: true, ...d })).catch((e) => {
    if (e instanceof MarketingError || (e && e.code && STATUS[e.code])) return res.status(STATUS[e.code] || 400).set("Cache-Control", "no-store").json({ ok: false, error: e.message, code: e.code });
    if (e && /délai|ECONN/.test(String(e.message))) return res.status(502).set("Cache-Control", "no-store").json({ ok: false, error: "La page n'a pas répondu à temps.", code: "unreachable" });
    next(e);
  });
  router.get(B, need("forms.read"), (req, res, next) => {
    try { const site = R.ctxLib.siteGuard(req.mk.ctx, sid(req)); res.set("Cache-Control", "no-store").render("marketing/site-performance", { title: "Performance", active: "sites", marketingShell: true, siteId: site.id, siteName: site.name, base: `/marketing/site-web/sites/${site.id}/performance`, siteBase: `/marketing/site-web/sites/${site.id}`, perms: { write: req.mk.can("forms.write") } }); }
    catch (e) { if (e instanceof MarketingError) return res.status(e.code === "not_found" ? 404 : 422).render("error", { message: e.message }); next(e); }
  });
  router.get(`${A}/vue`, need("forms.read"), run((ctx, id) => ({ overview: P.overview(ctx, id), settings: P.settings(ctx, id), log: P.log(ctx, id) })));
  router.get(`${A}/pages/:pid(\\d+)/historique`, need("forms.read"), run((ctx, id, req) => ({ history: P.history(ctx, id, Number(req.params.pid)) })));
  router.post(`${A}/pages/:pid(\\d+)/analyser`, need("forms.read"), run(async (ctx, id, req) => P.analyzePage(ctx, id, Number(req.params.pid), loopback(req), { host: String(req.headers.host || "").split(":")[0] })));
  router.get(`${A}/rapports/:rid(\\d+)`, need("forms.read"), run((ctx, id, req) => ({ report: P.get(ctx, id, Number(req.params.rid)) })));
  router.post(`${A}/comparer`, need("forms.read"), run((ctx, id, req) => { const b = body(req); return { comparison: P.compareReports(ctx, id, Number(b.before), Number(b.after), b.thresholds) }; }));
  router.post(`${A}/options`, need("forms.write"), run((ctx, id, req) => { const b = body(req); return { settings: P.setOption(ctx, id, String(b.option || ""), b.value) }; }));
  return router;
};
