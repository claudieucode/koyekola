# Corrections faites après les tests d'intégration (palier 25, suite)

À ta demande (« fais ce qui reste, logique et juste »), j'ai corrigé les deux anomalies **découvertes** par les tests, qui n'exigeaient aucun changement de droits. Chaque correction est bornée et couverte par un scénario ou un test.

| Anomalie | Changement | Fichiers | Preuve |
|---|---|---|---|
| **A25-02** (P2) — l'avertissement « console » disparaissait après l'activation d'un scénario d'e-mail | L'écran d'un scénario **actif** affiche de nouveau « Fournisseur « console » : rien ne sera réellement envoyé… Les e-mails de ce scénario sont enregistrés comme « envoyés » sans quitter le serveur » tant que le fournisseur est « console » | `src/marketing/web/automations.js`, `views/marketing/automation.ejs` | INT-EML-011 : critère « APRÈS l'activation… » réussi |
| **A25-03** (P3) — un lot de mesure sans date client rejoué était compté deux fois | Sans date plausible, l'heure de l'événement est arrondie à la **minute** : un lot rejoué dans la même minute reste dédupliqué. Le vrai script du site (qui envoie la date de chaque événement) n'est pas concerné | `src/marketing/visitors/index.js` | INT-ANA-016 : critère « sans date client… » réussi ; `cms-analytics`, `cms-analytics-web`, `analytics-coherence` verts |

**G-03 (P1) — corrigée ensuite**, avec ton accord explicite : le correctif validé en copie jetable a été appliqué (6 fichiers : `src/routes/pages.js`, `src/routes/blog.js`, `src/marketing/web/articles.js`, `views/marketing/articles.ejs`, `tests/cms-articles.test.js`, `tests/cms-articles-multi-auteurs.test.js`). Les rôles Éditeur, Auteur et Contributeur écrivent selon leurs droits ; l'auteur est forcé à la personne connectée ; publier reste un droit séparé ; un article en ligne n'est pas modifiable sans ce droit ; le reste de l'espace du blog (SEO, IA, apparence, bibliothèque) reste réservé au créateur. Preuves : INT-CMS-006 (5 critères), `tests/cms-articles-multi-auteurs.test.js` (5), suites voisines (333 tests verts), matrice de permissions sans écart. Cela change la description de l'anomalie du palier 24.

Les autres éléments (comptes de test, état de production, décisions D1 à D10) dépendent de toi.
