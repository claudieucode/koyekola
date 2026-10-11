// Palier 25 — génère le plan, les résultats détaillés et la matrice de couverture à partir du fichier de résultats écrit par tests/integration-globale.test.js.
const fs = require("fs"), path = require("path");
const DOCS = path.join(__dirname, "..", "docs", "audit-integration-palier-25");
const data = JSON.parse(fs.readFileSync(path.join(DOCS, "resultats", "resultats-scenarios.json"), "utf8"));
const R = data.results.slice().sort((a, b) => a.id.localeCompare(b.id));
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const PREREQ = {
  "INT-CMS-001": "Site A et B, compte créateur, lecteur d'organisation, membres limités aux sites A et B", "INT-CMS-002": "Page publiée de INT-CMS-001", "INT-CMS-003": "Image PNG synthétique de 10×10 px", "INT-CMS-004": "Page publiée ; aucune apparence publiée au départ", "INT-SEO-005": "Pages publiées indexable / non indexable, brouillon",
  "INT-TUN-006": "Deux pages publiées sur le site A ; membre du site B", "INT-TUN-007": "Tunnel publié de INT-TUN-006", "INT-CON-008": "Formulaire publié avec case de consentement, sans double confirmation", "INT-CON-009": "Compte élève créé par l'inscription ; article publié ; commentaires invités autorisés", "INT-CON-010": "Formulaire de INT-CON-008",
  "INT-AUT-010": "Serveur de test avec worker (MARKETING_WORKER=on), formulaire publié, scénario à une étape « étiquette »", "INT-EML-011": "Serveur avec worker, fournisseur d'envoi par défaut « console », modèle d'e-mail, formulaire, scénario à une étape « e-mail »",
  "INT-COM-012": "Faux serveur Stripe local, formation payante, élève", "INT-COM-013": "Session de paiement de INT-COM-012, secret de webhook de test, worker actif", "INT-COM-017": "Faux Stripe, élève avec panier", "INT-COM-018": "Faux Stripe, élève avec panier",
  "INT-ABT-014": "Page publiée, 12 visiteurs synthétiques consentants, un robot", "INT-ANA-016": "Visiteurs synthétiques (cookie de consentement et identifiant), un visiteur sans consentement, un robot", "INT-CMS-006": "Rôles Éditeur, Auteur, Contributeur, Lecteur, compte hors équipe", "INT-CMS-007": "Page brouillon indexable", "INT-SEC-015": "Pages et tunnel du site A, membre du site B, compte hors équipe",
};
const EXPECTED = (r) => r.criteria.map((c) => c.label).join(" ; ");

let md = `# Plan de test des intégrations (palier 25)\n\n*Généré par \`audit-integration/generer.js\` depuis \`resultats/resultats-scenarios.json\`. ${R.length} scénarios exécutés par \`tests/integration-globale.test.js\` ; les scénarios prévus mais non exécutés sont dans \`05-tests-non-executes-et-simules.md\`.*\n\n**Environnement** : serveur de test jetable lancé par \`tests/helpers.js\` (base temporaire, dossier d'envois temporaire, aucun secret réel, e-mail « console », Stripe = faux serveur local, aucun SMTP). **Aucune donnée de production, aucune action réelle.**\n\n| ID | Parcours | Modules | Mode de preuve | Prérequis et données | Critères d'acceptation (vérifiés un par un) |\n|---|---|---|---|---|---|\n`;
for (const r of R) md += `| ${r.id} | ${esc(r.titre)} | ${esc(r.modules.join(", "))} | ${r.mode === "SIMULE" ? "SIMULÉ (faux fournisseur)" : "RÉEL en test (vraies routes, vraie base de test)"} | ${esc(PREREQ[r.id] || "")} | ${esc(EXPECTED(r))} |\n`;
fs.writeFileSync(path.join(DOCS, "01-plan-de-test.md"), md);

md = `# Résultats détaillés (palier 25)\n\n*Source : \`docs/audit-integration-palier-25/resultats/resultats-scenarios.json\`, écrit par l'exécution réelle de \`tests/integration-globale.test.js\` (${data.generatedAt}). Chaque critère est un contrôle exécuté ; un critère « ÉCHEC REPRODUIT » reproduit un défaut documenté dans \`04-registre-anomalies.md\`.*\n`;
for (const r of R) {
  const ok = r.criteria.filter((c) => c.ok).length, ko = r.criteria.filter((c) => !c.ok).length;
  md += `\n## ${r.id} — ${r.titre}\n\n- **Statut** : **${r.status}**${ko ? ` (${ok} critères réussis, ${ko} en échec reproduit)` : ` (${ok} critères réussis)`}\n- **Modules** : ${r.modules.join(", ")} · **Mode** : ${r.mode === "SIMULE" ? "SIMULÉ" : "RÉEL en test"}\n${r.crash ? `- **Erreur d'exécution** : ${r.crash}\n` : ""}\n| # | Critère | Résultat | Preuve observée | Anomalie |\n|---|---|---|---|---|\n`;
  r.criteria.forEach((c, i) => { md += `| ${i + 1} | ${esc(c.label)} | ${c.ok ? "réussi" : "**ÉCHEC REPRODUIT**"} | ${esc(c.evidence)} | ${c.anomaly || ""} |\n`; });
}
fs.writeFileSync(path.join(DOCS, "02-resultats-detailles.md"), md);

// Matrice de couverture : relations du palier 24 (I01…I27) → scénarios
const MAP = [
  ["I01", "CMS ↔ Page Builder", ["INT-CMS-001", "INT-CMS-002"], "réel"], ["I02", "CMS ↔ Templates / styles globaux", ["INT-CMS-004"], "réel"], ["I03", "CMS ↔ SEO et URL", ["INT-SEO-005", "INT-CMS-007"], "réel"], ["I04", "CMS ↔ Médiathèque", ["INT-CMS-003"], "réel"],
  ["I05", "CMS ↔ Utilisateurs et permissions", ["INT-CMS-001", "INT-CMS-006", "INT-SEC-015"], "réel"], ["I06", "CMS ↔ Tunnel Builder", ["INT-TUN-006", "INT-TUN-007"], "réel"], ["I07", "Contact Core ↔ Emailing", ["INT-EML-011"], "simulé (fournisseur « console »)"], ["I08", "Contact Core / événements ↔ Automatisations", ["INT-AUT-010", "INT-EML-011"], "réel (worker de test)"],
  ["I09", "Tunnel ↔ Commerce", [], "non testé"], ["I10", "Commerce ↔ Contact Core", ["INT-COM-013"], "simulé (faux Stripe) + pont réel"], ["I11", "Commerce ↔ Analytics", ["INT-COM-013"], "simulé (faux Stripe) + lecture réelle"], ["I12", "Emailing ↔ Analytics", [], "non testé"],
  ["I13", "Automatisations ↔ Événements", ["INT-AUT-010"], "réel (worker de test)"], ["I14", "Analytics ↔ Tests A/B", ["INT-ABT-014"], "partiel"], ["I15", "Sites ↔ Isolation des données", ["INT-SEC-015", "INT-TUN-006", "INT-CON-009", "INT-CMS-001"], "réel"], ["I16", "Formulaires ↔ Contact Core ↔ consentement", ["INT-CON-008", "INT-CON-009", "INT-CON-010"], "réel"],
  ["I17", "Stripe ↔ Commerce (webhook)", ["INT-COM-012", "INT-COM-013", "INT-COM-017", "INT-COM-018"], "simulé (faux Stripe)"], ["I18", "Resend / Twilio ↔ webhooks entrants", [], "non testé"], ["I19", "Visiteurs web ↔ Contact Core", ["INT-ANA-016"], "partiel (liaison à un contact non testée ici)"], ["I20", "Page Builder ↔ Tests A/B", ["INT-ABT-014"], "réel"],
  ["I21", "Événements du CMS ↔ Automatisations", [], "non testé"], ["I22", "SEO ↔ Tunnel (noindex d'étape)", [], "non testé ici (suite existante cms-tunnel)"], ["I23", "Paramètres ↔ moteurs consommateurs", ["INT-CON-009"], "partiel"], ["I24", "Historique ↔ Page Builder", ["INT-CMS-002"], "réel"],
  ["I25", "Boutique ↔ Événements (pont) ↔ Contact Core", ["INT-COM-013"], "simulé (faux Stripe) + pont réel"], ["I26", "Contacts ↔ Sites (visibilité)", ["INT-CON-009"], "réel (lecture)"], ["I27", "Commerce ↔ Sites", [], "non testé ici (suite existante cms-commerce-web)"],
];
const byId = Object.fromEntries(R.map((r) => [r.id, r]));
const worst = (ids) => { if (!ids.length) return "NON EXÉCUTÉ"; const st = ids.map((i) => byId[i].status); if (st.some((s) => /ÉCHEC REPRODUIT$/.test(s) && !/PARTIELLEMENT/.test(s))) return "ÉCHEC REPRODUIT"; if (st.some((s) => /PARTIELLEMENT/.test(s))) return "RÉUSSI PARTIELLEMENT"; if (st.every((s) => /SIMULÉ/.test(s))) return "SIMULÉ UNIQUEMENT"; if (st.some((s) => /SIMULÉ/.test(s))) return "RÉUSSI (partie simulée)"; return "RÉUSSI — PREUVES COMPLÈTES"; };
md = `# Matrice de couverture des intégrations (palier 25)\n\n*Les 27 relations de la matrice du palier 24 rapprochées des scénarios exécutés. « Couverture des tests » ≠ « couverture fonctionnelle » : un scénario ne prouve que ses critères.*\n\n| ID | Intégration | Scénario(s) | Mode de preuve | Statut | Limites |\n|---|---|---|---|---|---|\n`;
const counts = {};
for (const [id, name, ids, mode] of MAP) { const st = worst(ids); counts[st] = (counts[st] || 0) + 1; md += `| ${id} | ${name} | ${ids.join(", ") || "—"} | ${mode} | **${st}** | ${/simulé/.test(mode) ? "Prouve le code, pas le fournisseur réel" : mode.startsWith("non testé") ? "Aucun scénario du palier 25 ; voir 05-tests-non-executes" : mode.startsWith("partiel") ? "Critères partiels seulement" : "Environnement de test jetable, pas de production"} |\n`; }
md += `\n## Décompte\n\n${Object.entries(counts).map(([k, v]) => `- ${k} : ${v}`).join("\n")}\n`;
fs.writeFileSync(path.join(DOCS, "03-matrice-couverture-integrations.md"), md);

const tot = R.length, crit = R.reduce((n, r) => n + r.criteria.length, 0), ko = R.reduce((n, r) => n + r.criteria.filter((c) => !c.ok).length, 0);
const stat = {}; for (const r of R) stat[r.status] = (stat[r.status] || 0) + 1;
console.log(JSON.stringify({ scenarios: tot, criteres: crit, criteresEnEchec: ko, statuts: stat, couverture: counts }, null, 1));
