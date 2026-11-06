// Accès au DESIGN du site = brouillon des styles du site (services/siteStyles). Le moteur de styles utilise la base de l'application : l'accès passe par ce port, remplaçable dans les tests unitaires.
let override = null;
const port = () => override || {
  state: (ctx, siteId, can) => { const st = require("../services/siteStyles").state(ctx, siteId, { can }); return { changes: st.changes || {}, values: st.values || {}, rev: st.draft ? st.draft.rev : 0 }; },
  saveDraft: (ctx, siteId, changes, can) => { const r = require("../services/siteStyles").saveDraft(ctx, siteId, changes, ctx.userId ?? null, { can }); return { rev: r.rev }; },
};
module.exports = { port, setForTests: (p) => { override = p; } };
