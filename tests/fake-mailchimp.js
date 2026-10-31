// Faux serveur Mailchimp (API Marketing v3 + Mandrill) pour les tests : mêmes statuts, mêmes formes d'erreur (RFC 7807 : type/title/status/detail/errors) et mêmes règles que le vrai
// service pour ce que Kolakisa utilise (clé et centre de données, pagination count/offset, empreinte MD5 des membres, état de conformité, lots, webhooks, campagnes, rapports).
// Tout ce qui n'est pas simulé finement répond 200 {} : les tests de contrat vérifient alors la méthode, le chemin, les paramètres et le corps reçus.
// Ce n'est PAS Mailchimp : un test qui passe ici ne prouve pas la conformité avec le service réel.
const http = require("node:http");
const crypto = require("node:crypto");

const md5 = (s) => crypto.createHash("md5").update(String(s).trim().toLowerCase()).digest("hex");

async function createFakeMailchimp({ key = "0123456789abcdef0123456789abcdef-us21", mandrillKey = "md-test-key-1234567890" } = {}) {
  const state = { lists: new Map(), members: new Map(), campaigns: new Map(), webhooks: new Map(), reports: new Map(), templates: new Map(), coll: {}, seq: 1 };
  const requests = [];
  const faults = [];
  let inflight = 0, maxInflight = 0, delayMs = 0;
  const json = (res, status, body, headers = {}) => { const text = body === undefined ? "" : JSON.stringify(body); res.writeHead(status, { "Content-Type": "application/json", ...headers }); res.end(status === 204 ? "" : text); };
  const problem = (res, status, title, detail, errors) => json(res, status, { type: "https://mailchimp.com/developer/marketing/docs/errors/", title, status, detail, instance: "fake-" + crypto.randomBytes(4).toString("hex"), ...(errors ? { errors } : {}) });
  const page = (items, key2, q) => { const count = Math.min(Number(q.get("count")) || 10, 1000), offset = Number(q.get("offset")) || 0; return { [key2]: items.slice(offset, offset + count), total_items: items.length }; };
  const newId = () => crypto.randomBytes(5).toString("hex");
  const mkList = (name = "Liste") => { const id = newId(); const l = { id, name, stats: { member_count: 0, unsubscribe_count: 0, cleaned_count: 0, open_rate: 0.4, click_rate: 0.05 }, double_optin: false }; state.lists.set(id, l); state.members.set(id, new Map()); return l; };
  const recount = (id) => { const l = state.lists.get(id); const ms = [...state.members.get(id).values()]; l.stats.member_count = ms.filter((m) => m.status === "subscribed").length; l.stats.unsubscribe_count = ms.filter((m) => m.status === "unsubscribed").length; l.stats.cleaned_count = ms.filter((m) => m.status === "cleaned").length; };

  function upsertMember(listId, body) {
    const map = state.members.get(listId);
    const email = String(body.email_address || "").toLowerCase();
    const hash = md5(email);
    const cur = map.get(hash);
    if (!cur) {
      const status = body.status || body.status_if_new || "subscribed";
      const m = { id: hash, email_address: email, status, merge_fields: body.merge_fields || {}, tags: (body.tags || []).map((t, i) => ({ id: i + 1, name: String(t) })), last_changed: new Date().toISOString(), timestamp_opt: new Date().toISOString() };
      map.set(hash, m); recount(listId); return { member: m, created: true };
    }
    if (body.status && body.status !== cur.status) {
      if (body.status === "subscribed" && ["unsubscribed", "cleaned"].includes(cur.status)) return { error: "compliance" };
      cur.status = body.status;
    }
    if (body.merge_fields) cur.merge_fields = { ...cur.merge_fields, ...body.merge_fields };
    cur.last_changed = new Date().toISOString();
    recount(listId);
    return { member: cur, created: false };
  }

  const notFound = (res) => problem(res, 404, "Resource Not Found", "The requested resource could not be found.");
  const handler = async (req, res) => {
    inflight++; maxInflight = Math.max(maxInflight, inflight);
    try {
      const chunks = []; for await (const c of req) chunks.push(c);
      const raw = Buffer.concat(chunks).toString("utf8");
      let body = {}; try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
      const url = new URL(req.url, "http://x");
      const q = url.searchParams;
      const auth = String(req.headers.authorization || "");
      const record = { method: req.method, path: url.pathname.replace(/^\/3\.0/, ""), query: Object.fromEntries(q), body, raw, auth, at: Date.now() };
      requests.push(record);
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      const fault = faults.length ? faults.shift() : null;
      if (fault) return json(res, fault.status, fault.body || { title: "Fault", status: fault.status, detail: "Erreur simulée" }, fault.headers || {});

      if (url.pathname.startsWith("/api/1.0/")) { // --- Mandrill ---
        if (body.key !== mandrillKey) return json(res, 500, { status: "error", code: -1, name: "Invalid_Key", message: "Invalid API key" });
        const op = url.pathname.replace("/api/1.0/", "").replace(/\.json$/, "");
        if (op === "users/ping2") return json(res, 200, { PING: "PONG!" });
        if (op === "users/info") return json(res, 200, { username: "demo", reputation: 90, hourly_quota: 250, stats: { today: { sent: 3 } } });
        if (op === "messages/send") return json(res, 200, (body.message.to || []).map((t) => ({ email: t.email, status: "sent", _id: newId(), reject_reason: null })));
        if (op === "messages/send-template") { if (body.template_name === "inconnu") return json(res, 500, { status: "error", code: 5, name: "Unknown_Template", message: "No such template" }); return json(res, 200, (body.message.to || []).map((t) => ({ email: t.email, status: "queued", _id: newId() }))); }
        if (op === "messages/search") return json(res, 200, [{ ts: 1, _id: "m1", sender: "a@b.fr", subject: "Reçu", email: "c@d.fr", state: "sent", opens: 1, clicks: 0 }]);
        if (op === "templates/render") return json(res, 200, { html: `<p>Bonjour ${((body.merge_vars || [])[0] || {}).content || ""}</p>` });
        if (op === "rejects/add") return json(res, 500, { status: "error", code: 10, name: "PaymentRequired", message: "No credits" });
        return json(res, 200, []);
      }

      const m = /^Basic (.+)$/.exec(auth); // --- Marketing v3 ---
      const pass = m ? Buffer.from(m[1], "base64").toString().split(":").slice(1).join(":") : "";
      if (pass !== key) return problem(res, 401, "API Key Invalid", "Your API key may be invalid, or you've attempted to access the wrong datacenter.");
      const p = record.path;
      let x;
      if (p === "/ping") return json(res, 200, { health_status: "Everything's Chimpy!" });
      if (p === "/" && req.method === "GET") return json(res, 200, { account_id: "acc123", account_name: "Société Démo", email: "admin@demo.fr", first_name: "Ana", last_name: "Démo", role: "owner", pro_enabled: true, total_subscribers: [...state.lists.values()].reduce((n, l) => n + l.stats.member_count, 0), _links: [] });
      if (p === "/lists" && req.method === "GET") return json(res, 200, page([...state.lists.values()], "lists", q));
      if (p === "/lists" && req.method === "POST") { if (!body.name) return problem(res, 400, "Invalid Resource", "The resource submitted could not be validated.", [{ field: "name", message: "This value should not be blank." }]); const l = mkList(body.name); Object.assign(l, { contact: body.contact, permission_reminder: body.permission_reminder }); return json(res, 200, l); }
      if ((x = /^\/lists\/([0-9a-f]{10})$/.exec(p))) {
        const l = state.lists.get(x[1]);
        if (!l) return notFound(res);
        if (req.method === "GET") return json(res, 200, l);
        if (req.method === "PATCH") { Object.assign(l, body); return json(res, 200, l); }
        if (req.method === "DELETE") { state.lists.delete(x[1]); state.members.delete(x[1]); return json(res, 204); }
        if (req.method === "POST") { // lot d'abonnés
          const out = { new_members: [], updated_members: [], errors: [], total_created: 0, total_updated: 0, error_count: 0 };
          for (const mem of body.members || []) {
            if (!mem.email_address || !/^[^@\s]+@[^@\s]+$/.test(mem.email_address)) { out.errors.push({ email_address: mem.email_address, error: "Invalid email address", error_code: "ERROR_CONTACT_STATE" }); out.error_count++; continue; }
            const exists = state.members.get(x[1]).has(md5(mem.email_address));
            if (exists && !body.update_existing) { out.errors.push({ email_address: mem.email_address, error: "already a list member", error_code: "ERROR_GENERIC" }); out.error_count++; continue; }
            const r = upsertMember(x[1], mem);
            if (r.error) { out.errors.push({ email_address: mem.email_address, error: "Member In Compliance State", error_code: "ERROR_CONTACT_STATE" }); out.error_count++; continue; }
            if (r.created) { out.total_created++; out.new_members.push(r.member); } else { out.total_updated++; out.updated_members.push(r.member); }
          }
          return json(res, 200, out);
        }
      }
      if ((x = /^\/lists\/([0-9a-f]{10})\/members$/.exec(p))) {
        const map = state.members.get(x[1]); if (!map) return notFound(res);
        if (req.method === "GET") {
          let items = [...map.values()];
          if (q.get("status")) items = items.filter((i) => i.status === q.get("status"));
          if (q.get("since_last_changed")) items = items.filter((i) => Date.parse(i.last_changed) > Date.parse(q.get("since_last_changed")));
          if (q.get("sort_field") === "last_changed") items = [...items].sort((a, b) => (Date.parse(a.last_changed) - Date.parse(b.last_changed)) * (q.get("sort_dir") === "DESC" ? -1 : 1));
          return json(res, 200, page(items, "members", q));
        }
        if (req.method === "POST") {
          if (map.has(md5(body.email_address || ""))) return problem(res, 400, "Member Exists", `${body.email_address} is already a list member. Use PUT to insert or update list members.`);
          return json(res, 200, upsertMember(x[1], body).member);
        }
      }
      if ((x = /^\/lists\/([0-9a-f]{10})\/members\/([0-9a-f]{32})$/.exec(p))) {
        const map = state.members.get(x[1]); const cur = map && map.get(x[2]);
        if (!map) return notFound(res);
        if (req.method === "GET") return cur ? json(res, 200, cur) : notFound(res);
        if (req.method === "PUT" || req.method === "PATCH") {
          if (!cur && req.method === "PATCH") return notFound(res);
          const r = upsertMember(x[1], { ...body, email_address: body.email_address || (cur && cur.email_address) });
          if (r.error) return problem(res, 400, "Forbidden Request", `${body.email_address || cur.email_address} is in a compliance state due to unsubscribe, bounce, or compliance review and cannot be subscribed.`);
          return json(res, 200, r.member);
        }
        if (req.method === "DELETE") { if (cur) { cur.status = "archived"; recount(x[1]); } return json(res, 204); }
      }
      if ((x = /^\/lists\/([0-9a-f]{10})\/webhooks$/.exec(p))) {
        if (req.method === "GET") return json(res, 200, { webhooks: [...state.webhooks.values()].filter((w) => w.list_id === x[1]), total_items: state.webhooks.size });
        if (req.method === "POST") { const w = { id: newId(), list_id: x[1], ...body }; state.webhooks.set(w.id, w); return json(res, 200, w); }
      }
      if ((x = /^\/lists\/([0-9a-f]{10})\/webhooks\/([a-z0-9]+)$/.exec(p))) {
        const w = state.webhooks.get(x[2]); if (!w) return notFound(res);
        if (req.method === "PATCH") { Object.assign(w, body); return json(res, 200, w); }
        if (req.method === "DELETE") { state.webhooks.delete(x[2]); return json(res, 204); }
        return json(res, 200, w);
      }
      if (p === "/campaigns" && req.method === "GET") return json(res, 200, page([...state.campaigns.values()], "campaigns", q));
      if (p === "/campaigns" && req.method === "POST") { const c = { id: newId(), type: body.type, status: "save", recipients: body.recipients || {}, settings: body.settings || {}, emails_sent: 0 }; state.campaigns.set(c.id, c); return json(res, 200, c); }
      if ((x = /^\/campaigns\/([a-z0-9]+)$/.exec(p))) { const c = state.campaigns.get(x[1]); if (!c) return notFound(res); if (req.method === "GET") return json(res, 200, c); if (req.method === "PATCH") { Object.assign(c, body); return json(res, 200, c); } if (req.method === "DELETE") { state.campaigns.delete(x[1]); return json(res, 204); } }
      if ((x = /^\/campaigns\/([a-z0-9]+)\/actions\/send$/.exec(p))) { const c = state.campaigns.get(x[1]); if (!c) return notFound(res); c.status = "sent"; c.send_time = new Date().toISOString(); return json(res, 204); }
      if (p === "/reports" && req.method === "GET") { if (q.get("sort_field")) return problem(res, 400, "Invalid Resource", "The resource submitted could not be validated.", [{ field: "sort_field", message: "Unknown parameter" }]); return json(res, 200, page([...state.reports.values()], "reports", q)); }
      if ((x = /^\/reports\/([a-z0-9]+)$/.exec(p))) { const r = state.reports.get(x[1]); return r ? json(res, 200, r) : notFound(res); }
      if (p === "/templates" && req.method === "POST") { const t = { id: state.seq++, type: "user", active: true, ...body }; state.templates.set(t.id, t); return json(res, 200, t); }
      if (p === "/templates" && req.method === "GET") return json(res, 200, page([...state.templates.values()], "templates", q));
      if ((x = /^\/lists\/([0-9a-f]{10})\/segments\/(\d+)\/members$/.exec(p))) {
        const seg = (state.coll[`/lists/${x[1]}/segments`] || []).find((g) => String(g.id) === x[2]);
        if (!seg) return notFound(res);
        const all = [...(state.members.get(x[1]) || new Map()).values()];
        let items;
        if (seg.static_segment) items = all.filter((m) => seg.static_segment.includes(m.email_address));
        else { const c = ((seg.options || {}).conditions || [])[0]; items = c ? all.filter((m) => (m.merge_fields || {})[c.field] === c.value) : all; }
        return json(res, 200, page(items, "members", q));
      }
      if ((x = /^\/lists\/([0-9a-f]{10})\/segments$/.exec(p))) {
        if (!state.lists.has(x[1])) return notFound(res);
        const segs = (state.coll[p] = state.coll[p] || []);
        if (req.method === "POST") { const seg = { id: 1000 + segs.length, type: body.static_segment ? "static" : "saved", member_count: 0, ...body }; segs.push(seg); return json(res, 200, seg); }
        return json(res, 200, { segments: q.get("type") ? segs.filter((g) => g.type === q.get("type")) : segs, total_items: segs.length });
      }
      if ((x = /^\/lists\/([0-9a-f]{10})\/members\/([0-9a-f]{32})\/actions\/delete-permanent$/.exec(p))) {
        const map = state.members.get(x[1]); if (!map || !map.has(x[2])) return notFound(res);
        map.delete(x[2]); recount(x[1]); return json(res, 204);
      }
      if ((x = /^\/campaigns\/([a-z0-9]+)\/send-checklist$/.exec(p))) {
        const c = state.campaigns.get(x[1]); if (!c) return notFound(res);
        return c.notReady ? json(res, 200, { is_ready: false, items: [{ type: "error", id: 1, heading: "Contenu", details: "Le contenu est vide." }] }) : json(res, 200, { is_ready: true, items: [{ type: "success", id: 1, heading: "Liste", details: "" }] });
      }
      if ((x = /^\/lists\/([0-9a-f]{10})\/members\/([0-9a-f]{32})\/tags$/.exec(p))) {
        const cur = state.members.get(x[1]) && state.members.get(x[1]).get(x[2]);
        if (!cur) return notFound(res);
        if (req.method === "POST") {
          for (const t of body.tags || []) {
            cur.tags = (cur.tags || []).filter((e) => e.name !== t.name);
            if (t.status === "active") cur.tags.push({ id: cur.tags.length + 1, name: t.name });
          }
          return json(res, 204);
        }
        return json(res, 200, { tags: cur.tags || [], total_items: (cur.tags || []).length });
      }
      if ((x = /^\/lists\/([0-9a-f]{10})\/merge-fields$/.exec(p))) {
        if (!state.lists.has(x[1])) return notFound(res);
        const l = state.lists.get(x[1]);
        l.merge_fields = l.merge_fields || [{ merge_id: 0, tag: "EMAIL", name: "Email Address", type: "email", required: true }, { merge_id: 1, tag: "FNAME", name: "First Name", type: "text", required: false }, { merge_id: 2, tag: "LNAME", name: "Last Name", type: "text", required: false }];
        if (req.method === "POST") { const f = { merge_id: l.merge_fields.length, tag: body.tag || String(body.name).toUpperCase().slice(0, 10), ...body }; l.merge_fields.push(f); return json(res, 200, f); }
        return json(res, 200, { merge_fields: l.merge_fields, total_items: l.merge_fields.length });
      }
      // Collections génériques (automatisations, boutiques et leurs produits / commandes / clients, pages de destination, domaines, applications) : liste, création, lecture, modification, suppression
      const COLL = { automations: "automations", stores: "stores", products: "products", orders: "orders", customers: "customers", "landing-pages": "landing_pages", "verified-domains": "domains", "authorized-apps": "apps", variants: "variants" };
      const cm = /^((?:\/ecommerce\/stores(?:\/[^/]+\/(?:products(?:\/[^/]+\/variants)?|orders|customers))?)|\/automations|\/landing-pages|\/verified-domains|\/authorized-apps)(?:\/([^/]+))?$/.exec(p);
      if (cm) {
        const base = cm[1], id = cm[2], key = COLL[base.split("/").pop()];
        const list = (state.coll[base] = state.coll[base] || []);
        if (!id) {
          if (req.method === "GET") return json(res, 200, page(list, key, q));
          if (req.method === "POST") { const item = { id: body.id || newId(), ...body }; if (base === "/verified-domains") { item.domain = String(body.verification_email || "").split("@")[1]; item.verified = false; } list.push(item); return json(res, 200, item); }
        } else {
          const at = list.findIndex((i) => String(i.id) === id || i.domain === id);
          if (at < 0) return notFound(res);
          if (req.method === "GET") return json(res, 200, list[at]);
          if (req.method === "PATCH" || req.method === "PUT") { Object.assign(list[at], body); return json(res, 200, list[at]); }
          if (req.method === "DELETE") { list.splice(at, 1); return json(res, 204); }
        }
      }
      if ((x = /^\/automations\/([^/]+)\/emails$/.exec(p))) return json(res, 200, { emails: [{ id: "em1", settings: { title: "Bienvenue", subject_line: "Bienvenue chez nous" }, status: "paused", delay: { amount: 0, type: "now", direction: "after", action: "signup" }, emails_sent: 12, report_summary: { open_rate: 0.5, click_rate: 0.1 } }], total_items: 1 });
      if ((x = /^\/verified-domains\/([^/]+)\/actions\/verify$/.exec(p))) { const d = (state.coll["/verified-domains"] || []).find((i) => i.domain === x[1]); if (!d) return notFound(res); if (body.code !== "123456") return problem(res, 400, "Invalid Resource", "Code invalide", [{ field: "code", message: "Wrong code" }]); d.verified = true; return json(res, 200, d); }
      if (p === "/verified-domains") return json(res, 200, { domains: [{ domain: "exemple.fr", verified: true }], total_items: 1 });
      if (p === "/automations") return json(res, 200, { automations: [], total_items: 0 });
      const actionOrDelete = req.method === "DELETE" || /\/actions\//.test(p); // repli : l'opération existe dans le catalogue mais n'est pas simulée finement
      return actionOrDelete ? json(res, 204) : json(res, 200, {});
    } finally { inflight--; }
  };

  const server = http.createServer((req, res) => { handler(req, res).catch((e) => { try { res.writeHead(500); res.end(String(e.message)); } catch { /* connexion fermée */ } }); });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  return {
    key, mandrillKey, state, requests, port, url: `http://127.0.0.1:${port}`, base: `http://127.0.0.1:${port}/3.0`, mandrillBase: `http://127.0.0.1:${port}/api/1.0`,
    get maxInflight() { return maxInflight; },
    setDelay: (ms) => { delayMs = ms; },
    failNext: (status, { times = 1, body, headers } = {}) => { for (let i = 0; i < times; i++) faults.push({ status, body, headers }); },
    addList: (name) => mkList(name),
    addMember: (listId, email, status = "subscribed", merge = {}, tags = []) => upsertMember(listId, { email_address: email, status, merge_fields: merge, tags }).member,
    addCampaign: (c) => { const o = { id: newId(), type: "regular", status: "sent", settings: { title: "Campagne", subject_line: "Objet" }, recipients: {}, emails_sent: 100, send_time: new Date().toISOString(), ...c }; state.campaigns.set(o.id, o); return o; },
    setReport: (id, r) => state.reports.set(id, r),
    reset: () => { requests.length = 0; faults.length = 0; maxInflight = 0; },
    close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(r); }),
    md5,
  };
}
module.exports = { createFakeMailchimp, md5 };
