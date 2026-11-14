// Étape propre à une extension de test : note son passage dans une table du site (preuve que l'étape s'exécute DANS la transaction d'activation).
module.exports = {
  onEnable(ctx, siteId) { ctx.db.prepare("INSERT INTO mk_extension_settings (site_id, organization_id, extension, key, value) VALUES (?, ?, 'demo_ok', 'initialise', '1') ON CONFLICT (site_id, extension, key) DO UPDATE SET value = '1'").run(siteId, ctx.organizationId); },
  onDisable() {},
};
