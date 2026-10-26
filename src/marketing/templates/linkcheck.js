// Vérification HTTP des liens d'un e-mail (audit : seule la forme des adresses était contrôlée, pas leur réponse).
// Garde-fous : aucune adresse privée ou locale (même contrôle que les webhooks, refait à CHAQUE redirection), connexion épinglée sur l'adresse validée,
// au plus 25 adresses distinctes, 3 redirections, 6 s par adresse, corps jamais lu. Résultat = ÉTAT seulement, jamais le contenu de la page.
// Limite assumée : un site qui refuse les robots (401/403/429) ou une erreur serveur passagère donnent « à vérifier », pas « cassé ».
const { assertPublicHost, pinnedFetch, SsrfError } = require("../webhooks/delivery");

const MAX_URLS = 25;
const MAX_HOPS = 3;
const TIMEOUT_MS = 6000;
const UA = "KOLAKISA-LinkCheck/1";

// Adresses http(s) distinctes d'un message (liens système et ancres exclus)
function collect(links) {
  const seen = new Set();
  for (const l of links || []) {
    const href = l && typeof l.href === "string" ? l.href.trim() : "";
    if (!/^https?:\/\//i.test(href)) continue;
    try { seen.add(new URL(href).toString()); } catch { /* adresse invalide : déjà signalée par l'analyse statique */ }
  }
  return [...seen];
}

async function request(url, method, { lookup, fetchImpl }) {
  const parsed = new URL(url);
  const addresses = await assertPublicHost(parsed.hostname, { lookup });
  const f = fetchImpl || pinnedFetch(addresses);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try { return await f(parsed.toString(), { method, headers: { "User-Agent": UA, Accept: "text/html,*/*;q=0.5" }, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

async function probe(url, opts = {}) {
  let current = url, hops = 0;
  try {
    for (;;) {
      let res = await request(current, "HEAD", opts);
      if ([403, 405, 501].includes(res.status)) res = await request(current, "GET", opts); // certains serveurs refusent HEAD
      if (res.status >= 300 && res.status < 400 && res.location) {
        if (++hops > MAX_HOPS) return { url, state: "warning", status: res.status, message: `Plus de ${MAX_HOPS} redirections successives.` };
        current = new URL(res.location, current).toString();
        if (!/^https?:/i.test(current)) return { url, state: "error", status: res.status, message: "Redirection vers une adresse non web." };
        continue;
      }
      const redirected = current !== url ? { finalUrl: current } : {};
      if (res.status >= 200 && res.status < 300) return { url, state: "ok", status: res.status, message: hops ? `Répond (après ${hops} redirection${hops > 1 ? "s" : ""}).` : "Répond.", ...redirected };
      if (res.status === 404 || res.status === 410) return { url, state: "error", status: res.status, message: "Page introuvable.", ...redirected };
      if ([401, 403, 429].includes(res.status)) return { url, state: "warning", status: res.status, message: "Le site refuse les vérifications automatiques : à ouvrir à la main.", ...redirected };
      if (res.status >= 500) return { url, state: "warning", status: res.status, message: "Le site a répondu par une erreur serveur (peut être passagère).", ...redirected };
      return { url, state: "warning", status: res.status, message: `Réponse inattendue (${res.status}).`, ...redirected };
    }
  } catch (error) {
    if (error instanceof SsrfError) return { url, state: "error", status: 0, message: "Adresse non joignable depuis Internet (privée, locale ou réservée)." };
    if (error && error.name === "AbortError") return { url, state: "warning", status: 0, message: "Le site met trop de temps à répondre." };
    return { url, state: "warning", status: 0, message: "Le site ne répond pas (nom introuvable ou connexion refusée)." };
  }
}

// Vérifie les adresses de la liste, trois à la fois
async function checkLinks(links, opts = {}) {
  const urls = collect(links);
  const limited = urls.slice(0, MAX_URLS);
  const results = [];
  for (let i = 0; i < limited.length; i += 3) results.push(...await Promise.all(limited.slice(i, i + 3).map((u) => probe(u, opts))));
  return { results, checked: limited.length, skipped: Math.max(0, urls.length - limited.length) };
}

module.exports = { MAX_URLS, MAX_HOPS, collect, probe, checkLinks };
