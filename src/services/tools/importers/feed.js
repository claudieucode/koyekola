// Importateur « Flux » : RSS 2.0 ou Atom (fichier envoyé, ou adresse récupérée par le serveur avec les garde-fous anti-SSRF du module RSS) → articles.
// Aucun article n'est créé sans analyse, aperçu et confirmation explicite. Le contenu HTML est assaini par le moteur d'import.
const { parseDocument } = require("htmlparser2");
const DomUtils = require("domutils");
const { fail } = require("./xml");
const { plain } = require("./html");

const MAX_ITEMS = 500;
const slugOf = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const text = (n) => (n ? DomUtils.textContent(n) : "");
const child = (parent, names) => { for (const n of names) { const el = (parent.children || []).find((c) => c.type === "tag" && c.name === n); if (el) return el; } return null; };
const date = (v) => { const t = Date.parse(String(v || "").trim()); return Number.isFinite(t) && t > Date.parse("1990-01-01") && t < Date.now() + 366 * 864e5 ? new Date(t).toISOString() : null; };
const httpUrl = (v) => { try { const u = new URL(String(v || "").trim()); return ["http:", "https:"].includes(u.protocol) ? u.href : ""; } catch { return ""; } };

function convert(input) {
  const xml = Buffer.isBuffer(input) ? input.toString("utf8") : String(input ?? "");
  if (!xml.trim()) throw fail("Le fichier est vide.");
  if (Buffer.byteLength(xml) > 10 * 1024 * 1024) throw fail("Flux trop volumineux (10 Mo au plus).");
  if (/<!ENTITY/i.test(xml) || /<!DOCTYPE[^>]*\b(SYSTEM|PUBLIC)\b/i.test(xml) || /<!DOCTYPE[^>]*\[/i.test(xml)) throw fail("Fichier refusé : il déclare des entités ou des ressources externes (DOCTYPE).");
  // Même contrôle de bonne forme que les autres importateurs
  require("./xml").parseXml(xml, { maxBytes: 10 * 1024 * 1024 });
  const doc = parseDocument(xml, { xmlMode: true, decodeEntities: true });
  const rssItems = DomUtils.getElementsByTagName("item", doc, true);
  const entries = rssItems.length ? [] : DomUtils.getElementsByTagName("entry", doc, true);
  const channel = DomUtils.getElementsByTagName("channel", doc, true, 1)[0] || DomUtils.getElementsByTagName("feed", doc, true, 1)[0];
  if (!channel || (!rssItems.length && !entries.length && !DomUtils.getElementsByTagName("item", doc, true, 1).length)) {
    if (!channel) throw fail("Ce n'est pas un flux RSS ou Atom (aucun élément « channel » ni « feed »).");
  }
  const list = (rssItems.length ? rssItems : entries).slice(0, MAX_ITEMS + 1);
  if (list.length > MAX_ITEMS) throw fail(`Trop d'articles dans le flux (${MAX_ITEMS} au plus).`);
  const articles = [], taxonomies = [], tagBy = new Map();
  let n = 0, t = 0, imageCount = 0;
  const tag = (name) => { const nm = String(name).trim().slice(0, 60); const key = slugOf(nm); if (!key) return null; if (!tagBy.has(key)) { const ref = `t${++t}`; tagBy.set(key, ref); taxonomies.push({ ref, taxonomy: "tag", name: nm, slug: key, description: "", parentRef: null, sourceKey: `tag:${key}` }); } return tagBy.get(key); };
  for (const it of list) {
    const isAtom = !rssItems.length;
    const title = plain(text(child(it, ["title"])), 150) || "Sans titre";
    let link = "";
    if (isAtom) { const links = (it.children || []).filter((c) => c.type === "tag" && c.name === "link"); const alt = links.find((l) => !l.attribs.rel || l.attribs.rel === "alternate") || links[0]; link = httpUrl(alt && alt.attribs.href); }
    else link = httpUrl(text(child(it, ["link"])));
    const guid = (text(child(it, isAtom ? ["id"] : ["guid"])).trim() || link || `${title}|${text(child(it, ["pubDate", "published", "updated"]))}`).slice(0, 300);
    const html = text(child(it, ["content:encoded", "content", "description", "summary"])) || "";
    const excerptSrc = text(child(it, ["description", "summary"]));
    const cats = [...(it.children || []).filter((c) => c.type === "tag" && c.name === "category")].map((c) => (isAtom ? c.attribs.term || c.attribs.label : DomUtils.textContent(c)) || "").filter(Boolean);
    const tagRefs = [...new Set(cats.map(tag).filter(Boolean))].slice(0, 10);
    const enclosure = (it.children || []).find((c) => c.type === "tag" && c.name === "enclosure" && /^image\//.test(c.attribs.type || ""));
    if (enclosure) imageCount++;
    articles.push({ ref: `a${++n}`, title, slug: slugOf(title) || `article-${n}`, content: html, content_format: "html", excerpt: plain(excerptSrc, 500), date: date(text(child(it, ["pubDate", "published", "updated", "dc:date"]))), tagRefs, categoryRefs: [], status: "publish", sourceKey: `item:${guid}`, sourceUrl: link,
      authorKey: plain(text(child(it, isAtom ? ["author"] : ["dc:creator", "author"])), 80) || "", comments_enabled: 1 });
  }
  const titleNode = child(channel, ["title"]);
  const unsupported = [
    ...(imageCount ? [{ label: "Images jointes aux articles (pièces jointes non téléchargées)", count: imageCount }] : []),
    { label: "Les commentaires et les pages ne font pas partie d'un flux RSS", count: 0, hidden: true },
  ].filter((x) => !x.hidden);
  return {
    data: { format: "kolakisa-site@1", external: true, source: { platform: "feed", siteName: plain(text(titleNode), 120), url: httpUrl(text(child(channel, ["link"]))) || httpUrl((channel.children || []).filter((c) => c.name === "link").map((l) => l.attribs && l.attribs.href)[0]), version: rssItems.length ? "RSS 2.0" : "Atom" },
      resources: { taxonomies, articles }, extras: { authors: [...new Set(articles.map((a) => a.authorKey).filter(Boolean))].map((k) => ({ key: k, name: k })), unsupported } },
    warnings: articles.length ? [] : ["Le flux ne contient aucun article."],
  };
}

module.exports = { convert, MAX_ITEMS };
