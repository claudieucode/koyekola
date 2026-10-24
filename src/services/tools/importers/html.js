// Petits outils HTML des importateurs : nettoyage du contenu WordPress (commentaires de blocs, paragraphes automatiques) et conversion en Markdown pour les pages.
const { parseDocument } = require("htmlparser2");
const DomUtils = require("domutils");

// Contenu WordPress « classique » : sauts de ligne doubles = paragraphes (wpautop simplifié) ; contenu de blocs : on retire seulement les commentaires <!-- wp:… -->
function wpContent(html) {
  let s = String(html ?? "").replace(/\r\n/g, "\n");
  const blocks = (s.match(/<!--\s*wp:[a-z0-9/-]+/gi) || []).length;
  const custom = [...new Set((s.match(/<!--\s*wp:([a-z0-9-]+\/[a-z0-9-]+)/gi) || []).map((m) => m.replace(/<!--\s*wp:/i, "")))];
  s = s.replace(/<!--\s*\/?wp:[\s\S]*?-->/g, "").replace(/<!--more[\s\S]*?-->/g, "");
  if (!/<(p|div|h[1-6]|ul|ol|table|blockquote|figure)\b/i.test(s)) {
    s = s.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("\n");
  }
  const shortcodes = [...new Set((s.match(/\[[a-z][a-z0-9_-]{1,30}(?=[\s\]])[^\]]*\]/gi) || []).map((m) => /^\[([a-z0-9_-]+)/i.exec(m)[1]))];
  return { html: s.trim(), blocks, customBlocks: custom, shortcodes };
}

function toMarkdown(html) {
  const doc = parseDocument(String(html ?? ""), { decodeEntities: true });
  const esc = (t) => t.replace(/([\\`*_{}\[\]])/g, "\\$1");
  const walk = (nodes, ctx = {}) => nodes.map((n) => {
    if (n.type === "text") return ctx.pre ? n.data : esc(n.data.replace(/\s+/g, " "));
    if (n.type !== "tag") return "";
    const inner = () => walk(n.children || [], ctx);
    switch (n.name) {
      case "script": case "style": case "iframe": case "form": case "object": case "embed": return "";
      case "br": return "  \n";
      case "p": case "div": case "section": case "figure": case "figcaption": return `\n\n${inner().trim()}\n\n`;
      case "h1": case "h2": case "h3": case "h4": case "h5": case "h6": return `\n\n${"#".repeat(Math.min(6, Number(n.name[1])))} ${inner().trim()}\n\n`;
      case "strong": case "b": return `**${inner().trim()}**`;
      case "em": case "i": return `*${inner().trim()}*`;
      case "a": { const href = String(n.attribs.href || ""); return /^(https?:\/\/|\/|mailto:|#)/i.test(href) ? `[${inner().trim() || href}](${href})` : inner(); }
      case "img": { const src = String(n.attribs.src || ""); return /^(https?:\/\/|\/)/i.test(src) ? `![${esc(String(n.attribs.alt || ""))}](${src})` : ""; }
      case "ul": return `\n\n${(n.children || []).filter((c) => c.name === "li").map((li) => `- ${walk(li.children || [], ctx).trim()}`).join("\n")}\n\n`;
      case "ol": return `\n\n${(n.children || []).filter((c) => c.name === "li").map((li, i) => `${i + 1}. ${walk(li.children || [], ctx).trim()}`).join("\n")}\n\n`;
      case "blockquote": return `\n\n${inner().trim().split("\n").map((l) => `> ${l}`).join("\n")}\n\n`;
      case "code": return `\`${DomUtils.textContent(n)}\``;
      case "pre": return `\n\n\`\`\`\n${DomUtils.textContent(n)}\n\`\`\`\n\n`;
      case "hr": return "\n\n---\n\n";
      default: return inner();
    }
  }).join("");
  return walk(doc.children).replace(/\n{3,}/g, "\n\n").trim();
}
const plain = (html, max = 300) => { const d = parseDocument(String(html ?? ""), { decodeEntities: true }); for (const el of DomUtils.findAll((e) => ["script", "style"].includes(e.name), d.children)) DomUtils.removeElement(el); return DomUtils.textContent(d).replace(/\s+/g, " ").trim().slice(0, max); };

module.exports = { wpContent, toMarkdown, plain };
