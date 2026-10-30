// Accès au DESIGN du site = brouillon du personnalisateur natif (services/customizer). Le personnalisateur utilise la base de l'application : l'accès passe par ce port, remplaçable dans les tests unitaires.
let override = null;
const port = () => override || {
  state: (ctx, siteId, can) => { const st = require("../services/customizer").state(ctx, siteId, { can }); return { changes: st.changes || {}, values: st.values || {}, rev: st.draft ? st.draft.rev : 0 }; },
  saveDraft: (ctx, siteId, changes, can) => { const r = require("../services/customizer").saveDraft(ctx, siteId, changes, ctx.userId ?? null, { can }); return { rev: r.rev }; },
};
module.exports = { port, setForTests: (p) => { override = p; } };
