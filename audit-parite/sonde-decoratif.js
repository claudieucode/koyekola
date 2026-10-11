// Sonde d'audit palier 23 — recherche de boutons / liens sans action et de mentions « bientôt » sur les écrans du CMS. Serveur de test jetable.
const { TEST_KEY } = require("../tests/marketing-helpers");
const { startServer, loginInstructor } = require("../tests/helpers");
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const M = "/marketing";
  await boss.post(`${M}/pages`, { name: "Page Audit", template: "vente" });
  const paths = ["/site-web", "/pages", "/pages/1", "/site-web/articles", "/site-web/articles/categories", "/site-web/articles/etiquettes", "/site-web/mediatheque", "/site-web/commentaires", "/site-web/navigation", "/site-web/apparence", "/site-web/apparence/styles", "/site-web/apparence/entete", "/site-web/apparence/pied-de-page", "/site-web/apparence/templates", "/site-web/apparence/patterns", "/site-web/utilisateurs", "/site-web/utilisateurs/roles", "/site-web/utilisateurs/permissions", "/site-web/utilisateurs/invitations", "/site-web/corbeille", "/site-web/redirections", "/site-web/liens-casses", "/site-web/permaliens", "/site-web/outils", "/site-web/outils/exporter", "/site-web/outils/importer", "/site-web/outils/diagnostic", "/site-web/outils/systeme", "/site-web/outils/maintenance", "/site-web/outils/cache", "/site-web/outils/contenu", "/site-web/outils/sauvegardes", "/site-web/outils/logs", "/site-web/parametres", "/site-web/parametres/reading", "/site-web/parametres/lecture", "/site-web/parametres/commentaires", "/site-web/parametres/medias", "/site-web/parametres/permaliens", "/site-web/parametres/seo", "/site-web/parametres/confidentialite", "/site-web/parametres/indexation", "/site-web/parametres/avance", "/site-web/sites", "/site-web/mes-sites"];
  const flag = /bient[ôo]t|à venir|prochainement|non disponible|indisponible|en construction|coming soon|lorem|todo/i;
  for (const p of paths) {
    const r = await boss.get(M + p); const t = r.text;
    const hashLinks = (t.match(/<a [^>]*href="#"[^>]*>/g) || []).length; const disabled = (t.match(/<(button|input)[^>]*\sdisabled[\s>]/g) || []).length;
    const soon = [...t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").matchAll(new RegExp(flag, "gi"))].map((m) => m[0]);
    console.log(String(r.status).padEnd(4), p.padEnd(40), `href#=${hashLinks} disabled=${disabled}`, soon.length ? "MENTIONS: " + [...new Set(soon)].join(",") : "", r.status !== 200 ? (r.location || "") : "");
  }
  await srv.stop();
})().catch((e) => { console.error("ERR", e); process.exit(1); });
