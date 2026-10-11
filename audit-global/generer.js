// Palier 24 — génère les matrices et registres à partir de donnees.js. Aucun score global n'est calculé : seulement des décomptes par statut.
const fs = require("fs"), path = require("path");
const D = require("./donnees.js");
const OUT = path.join(__dirname, "..", "docs", "audit-global-palier-24"); fs.mkdirSync(OUT, { recursive: true });
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const count = (rows, key) => rows.reduce((m, r) => ((m[r[key]] = (m[r[key]] || 0) + 1), m), {});
const csv = (cols, rows) => [cols.join(";"), ...rows.map((r) => cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(";"))].join("\n");

let md = `# Matrice de santé des modules (palier 24)\n\n*Générée par \`audit-global/generer.js\` depuis \`audit-global/donnees.js\` : ${D.modules.length} modules. Aucun pourcentage global n'est calculé (voir \`00-RAPPORT-FINAL.md\`, §« score »).*\n\n**État du code** : présent · partiel · absent · inconnu. **Fonctionnement** : validé · partiel · défaillant · non vérifié. **Environnement de la preuve** : TEST = serveur de test jetable ; SUITE = suite automatisée relancée ; PROD-LS = production en lecture seule ; CODE = lecture du code seulement. « Validé » signifie validé **dans l'environnement indiqué**, jamais « en production ».\n\n| ID | Module | Fonctionnalité attendue | Code | Fonctionnement | Preuve | Env. | Risque | Prio | Dépendances | Action future | Critère de validation |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
for (const m of D.modules) md += `| ${m.id} | ${esc(m.nom)} | ${esc(m.attendu)} | ${m.code} | **${m.fonct}** | ${esc(m.preuve)} | ${m.env} | ${esc(m.risque)} | ${m.prio} | ${esc(m.dep)} | ${esc(m.action)} | ${esc(m.critere)} |\n`;
md += `\n## Décompte par fonctionnement\n\n${Object.entries(count(D.modules, "fonct")).map(([k, v]) => `- ${k} : ${v}`).join("\n")}\n`;
fs.writeFileSync(path.join(OUT, "01-matrice-sante-modules.md"), md);
fs.writeFileSync(path.join(OUT, "01-matrice-sante-modules.csv"), csv(["id", "nom", "attendu", "code", "fonct", "preuve", "env", "risque", "prio", "dep", "action", "critere"], D.modules));

md = `# Matrice d'intégration (palier 24)\n\n*${D.integrations.length} relations. Une relation n'est « validée » que si le flux complet est prouvé ; naviguer d'un écran à l'autre ne suffit pas.*\n\n**Statuts** : VALIDÉE PAR PREUVE · PARTIELLEMENT VÉRIFIÉE · PRÉSENTE MAIS NON VALIDÉE · CASSÉE OU INCOHÉRENTE · ABSENTE · NON APPLICABLE · NON VÉRIFIABLE DANS CET AUDIT.\n\n| ID | Source | Destinataire | Contrat d'échange réel | Données et identifiants | Déclencheur | Persistance | Permissions / sites | Erreurs et reprise | Preuves | Statut |\n|---|---|---|---|---|---|---|---|---|---|---|\n`;
for (const i of D.integrations) md += `| ${i.id} | ${esc(i.src)} | ${esc(i.dst)} | ${esc(i.contrat)} | ${esc(i.donnees)} | ${esc(i.declencheur)} | ${esc(i.persistance)} | ${esc(i.perm)} | ${esc(i.erreurs)} | ${esc(i.preuve)} | **${i.statut}** |\n`;
md += `\n## Décompte par statut\n\n${Object.entries(count(D.integrations, "statut")).map(([k, v]) => `- ${k} : ${v}`).join("\n")}\n\n**Lecture honnête** : « VALIDÉE PAR PREUVE » signifie réussie dans les suites automatisées ou les sondes sur des serveurs de test jetables. Aucune relation n'a été validée par un flux réel de production (e-mail, SMS, paiement) : voir G-01, G-02 et le palier 25.\n`;
fs.writeFileSync(path.join(OUT, "02-matrice-integration.md"), md);
fs.writeFileSync(path.join(OUT, "02-matrice-integration.csv"), csv(["id", "src", "dst", "contrat", "donnees", "declencheur", "persistance", "perm", "erreurs", "preuve", "statut"], D.integrations));

md = `# Registre des anomalies P0 à P3 (palier 24)\n\n*${D.anomalies.length} anomalies consolidées et dédupliquées (références au palier 23 : AN-xx). **Aucune P0 confirmée.** Une cause n'est dite « confirmée » que si je l'ai vérifiée dans le code ou par une mesure ; sinon c'est une « hypothèse ».*\n\nRépartition : ${Object.entries(count(D.anomalies, "grav")).sort().map(([k, v]) => `${k} = ${v}`).join(" · ")}.\n`;
for (const a of D.anomalies) md += `\n## ${a.id} — ${a.grav} — ${a.titre}\n\n- **Module** : ${a.mod}\n- **Résultat attendu** : ${a.attendu}\n- **Constaté / limite de vérification** : ${a.constate}\n- **Preuves** : ${a.preuve}\n- **Fichiers concernés** : ${a.fichiers}\n- **Modules affectés** : ${a.deps}\n- **Risque de régression d'une correction** : ${a.regression}\n- **Priorité recommandée / palier** : ${a.palier}\n- **Tests de confirmation** : ${a.tests}\n- **Conditions préalables** : ${a.prealables}\n- **Cause** : ${a.cause}\n`;
fs.writeFileSync(path.join(OUT, "03-registre-anomalies.md"), md);
fs.writeFileSync(path.join(OUT, "03-registre-anomalies.csv"), csv(["id", "grav", "mod", "titre", "attendu", "constate", "preuve", "fichiers", "deps", "regression", "palier", "tests", "prealables", "cause"], D.anomalies));

md = `# Registre des fausses fonctionnalités potentielles (palier 24)\n\n*Une fonctionnalité n'est pas « fausse » parce qu'elle n'a pas pu être vérifiée : le niveau de certitude est indiqué pour chaque ligne.*\n\n| ID | Élément | Comportement attendu | Comportement constaté ou limite de vérification | Preuves | Certitude | Risque pour l'utilisateur |\n|---|---|---|---|---|---|---|\n`;
for (const f of D.faux) md += `| ${f.id} | ${esc(f.element)} | ${esc(f.attendu)} | ${esc(f.constate)} | ${esc(f.preuve)} | ${esc(f.certitude)} | ${esc(f.risque)} |\n`;
fs.writeFileSync(path.join(OUT, "04-fausses-fonctionnalites.md"), md);
console.log(JSON.stringify({ modules: count(D.modules, "fonct"), integrations: count(D.integrations, "statut"), anomalies: count(D.anomalies, "grav"), faux: D.faux.length }, null, 1));
