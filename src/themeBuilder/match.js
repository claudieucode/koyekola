// Évaluation d'une condition sur un CONTEXTE de page (programme 23.1). Le contexte est construit par l'appelant (le rendu public) :
//   { siteId, view, id, authorId, parents: [ids de la page parente, puis ancêtres], categories: [noms], categoryAncestors: [noms des catégories parentes], tags: [noms],
//     archive: { kind: blog|category|tag|author|date|search|shop, name, ancestors: [noms], authorId } }
//   view ∈ front | page | post | archive | search | not_found | product | product_archive. Les noms sont comparés sans casse.
const C = require("./conditions");

const low = (a) => (a || []).map((x) => String(x).toLowerCase());
const inter = (wanted, have) => { const h = new Set(low(have)); return low(wanted).some((x) => h.has(x)); };
const idIn = (list, v) => v !== null && v !== undefined && list.includes(Number(v));
const SINGLE = new Set(["front", "page", "post", "product"]);

// PRÉCISION statique d'une condition (plus grand = plus spécifique). Sert à la priorité ET à la détection de conflits.
function scoreOf(c) {
  const extra = (n) => n * 0.1; // départage deux conditions de même famille : plus de critères = plus précis
  switch (c.kind) {
    case "site": return 10;
    case "singular": return 20;
    case "front_page": return 90;
    case "not_found": return 50;
    case "search": return 40;
    case "child_of": return c.direct ? 80 : 70;
    case "author": return c.ids ? 60 : 25;
    case "custom": return (C.customDef(c.id) || { score: 50 }).score;
    case "shop": return 22;
    case "account": return 65;
    case "shop_page": return 55;
    case "visitor": return c.roles ? 18 : 15;
    case "archive": case "product_archive": {
      if (!c.sub || c.sub === "all") return c.names ? 55 : 20;
      return (c.names ? 60 : 40) + extra(c.child ? 1 : 0);
    }
    default: { // page, post, product
      const n = ["ids", "category", "childCategory", "tag", "author"].filter((k) => c[k]).length;
      if (c.ids) return 100 + extra(n);
      if (n) return 60 + extra(n);
      return c.kind === "course" ? 35 : 30;
    }
  }
}
function matches(c, ctx) {
  const v = ctx.view, a = ctx.archive || {};
  switch (c.kind) {
    case "site": return true;
    case "front_page": return v === "front";
    case "singular": return SINGLE.has(v);
    case "not_found": return v === "not_found";
    case "search": return v === "search" || a.kind === "search";
    case "shop": return v === "product_archive" || v === "product" || v === "shop_page" || v === "cart" || v === "checkout" || v === "order_received" || v === "account";
    case "account": return v === "account";
    case "shop_page": return v === "shop_page" || v === "cart" || v === "checkout" || v === "order_received";
    case "visitor": {
      const vis = ctx.visitor; if (!vis) return false; // visiteur inconnu : jamais supposé
      if ((c.state === "in") !== Boolean(vis.loggedIn)) return false;
      return !c.roles || (vis.loggedIn && inter(c.roles, [vis.role]));
    }
    case "course": {
      if (v !== "course") return false;
      if (c.ids && !idIn(c.ids, ctx.id)) return false;
      return !c.category || inter(c.category, ctx.categories);
    }
    case "custom": { const d = C.customDef(c.id); try { return Boolean(d && d.check(ctx, c.args || {})); } catch { return false; } }
    case "child_of": {
      if (v !== "page" && v !== "post") return false;
      const p = ctx.parents || [];
      return c.direct ? p[0] === c.parent : p.includes(c.parent);
    }
    case "author": return (SINGLE.has(v) || v === "archive") && (!c.ids || idIn(c.ids, v === "archive" ? a.authorId : ctx.authorId));
    case "page": case "post": case "product": {
      const views = c.kind === "page" ? ["front", "page"] : [c.kind];
      if (!views.includes(v)) return false;
      if (c.ids && !idIn(c.ids, ctx.id)) return false;
      if (c.author && !idIn(c.author, ctx.authorId)) return false;
      if (c.category && !inter(c.category, ctx.categories)) return false;
      if (c.childCategory && !inter(c.childCategory, ctx.categoryAncestors)) return false;
      if (c.tag && !inter(c.tag, ctx.tags)) return false;
      return true;
    }
    case "archive": case "product_archive": {
      const isProd = c.kind === "product_archive";
      if (isProd ? v !== "product_archive" : v !== "archive" && !(c.sub === "search" && v === "search")) return false;
      if (!c.sub || c.sub === "all") return !c.names || (c.names && inter(c.names, [a.name]));
      if (c.sub === "search") return v === "search" || a.kind === "search";
      if (a.kind !== c.sub) return false;
      if (!c.names) return true;
      return inter(c.names, [a.name]) || (c.child && inter(c.names, a.ancestors));
    }
    default: return false;
  }
}
module.exports = { scoreOf, matches };
