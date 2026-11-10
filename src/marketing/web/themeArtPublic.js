// Visuels originaux des thèmes (SVG générés, voir themes/library/art.js) : adresse /themes-art/<thème>/<emplacement>.svg. Publics (les pages créées avec un thème les affichent),
// sans donnée de site : le dessin ne dépend que du thème et de l'emplacement. Réponse immuable et mise en cache longue ; un thème ou un emplacement inconnu donne 404.
const express = require("express");
const crypto = require("node:crypto");
const library = require("../themes/library");
const packArtFor = (key, slot) => { try { const idy = require("../../services/packBrand").idOf(key); if (!idy) return null; const tokens = require("../pages/tokens").normalizeTokens({ colors: idy.colors }, { strict: false }); return require("../../services/packArt").render(slot, tokens, idy.art); } catch { return null; } };

const KEY = /^[a-z][a-z0-9-]{1,39}$/;
module.exports = () => {
  const router = express.Router();
  const memo = new Map();
  router.get("/themes-art/:key/:slot.svg", (req, res) => {
    const id = `${req.params.key}/${req.params.slot}`;
    let out = memo.get(id);
    if (!out) {
      // Aperçus de la bibliothèque Archive : illustrations d'exemple générées aux couleurs de la maison du modèle (jamais utilisées par un site publié)
      const demo = /^apercu-(m\d{2})$/.exec(req.params.key), demoN = /-(\d{1,2})$/.exec(req.params.slot);
      const r = demo ? ((svg) => (svg ? { svg } : null))(require("../../themeBuilder/catalog/archive-lib/demoArt").svgFor(demo[1], demoN ? Number(demoN[1]) : 1)) : KEY.test(req.params.key) ? (library.artFor(req.params.key, req.params.slot) || packArtFor(req.params.key, req.params.slot)) : null;
      if (!r) return res.status(404).type("text/plain").send("Introuvable");
      out = { svg: r.svg, etag: `"${crypto.createHash("sha1").update(r.svg).digest("hex").slice(0, 20)}"` };
      if (memo.size > 3000) memo.clear();
      memo.set(id, out);
    }
    if (req.get("if-none-match") === out.etag) return res.status(304).end();
    res.set({ "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=604800", ETag: out.etag, "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox" }).send(out.svg);
  });
  return router;
};
