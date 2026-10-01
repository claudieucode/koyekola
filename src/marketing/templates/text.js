// HTML d'e-mail → version texte brut (partie « text/plain » du message, et repli des clients sans HTML).
// Liens conservés sous la forme « texte (adresse) », listes en « - », éléments cachés (préheader), styles et scripts ignorés.
const { Parser } = require("htmlparser2");

const BLOCKS_AFTER = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "table", "ul", "ol", "blockquote", "pre"]);

function htmlToText(html) {
  let out = "";
  let hidden = 0; // profondeur d'éléments à ignorer (style, script, title, display:none)
  const skipTags = [];
  const links = [];
  const parser = new Parser(
    {
      onopentag(name, attribs) {
        const invisible = ["style", "script", "title", "head"].includes(name) || String(attribs.style || "").replace(/\s/g, "").includes("display:none");
        skipTags.push(invisible);
        if (invisible) hidden++;
        if (hidden) return;
        if (name === "br") out += "\n";
        else if (name === "hr") out += "\n\n";
        else if (name === "li") out += "- ";
        else if (name === "a") links.push({ href: attribs.href || "", start: out.length });
        else if (name === "img" && attribs.alt) out += `[${attribs.alt}]`;
      },
      ontext(text) {
        if (!hidden) out += text.replace(/\s+/g, " ");
      },
      onclosetag(name) {
        const invisible = skipTags.pop();
        if (invisible) { hidden--; return; }
        if (hidden) return;
        if (name === "a") {
          const link = links.pop();
          const label = out.slice(link.start).trim();
          const target = link.href.replace(/^mailto:/i, "");
          if (target && label !== target && label !== link.href) out += ` (${target})`;
        } else if (name === "li") out += "\n";
        else if (name === "td" || name === "th") out += " ";
        else if (name === "tr") out += "\n";
        else if (BLOCKS_AFTER.has(name)) out += "\n\n";
      },
    },
    { decodeEntities: true },
  );
  parser.write(html);
  parser.end();
  return out
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

module.exports = { htmlToText };
