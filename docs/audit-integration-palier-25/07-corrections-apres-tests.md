# Corrections faites après les tests d'intégration (palier 25, suite)

À ta demande (« fais ce qui reste, logique et juste »), j'ai corrigé les deux anomalies **découvertes** par les tests, qui n'exigeaient aucun changement de droits. Chaque correction est petite, bornée et couverte par un scénario.

| Anomalie | Changement | Fichiers | Preuve |
|---|---|---|---|
| **A25-02** (P2) — l'avertissement « console » disparaissait après l'activation d'un scénario d'e-mail | L'écran d'un scénario **actif** affiche de nouveau « Fournisseur « console » : rien ne sera réellement envoyé… Les e-mails de ce scénario sont enregistrés comme « envoyés » sans quitter le serveur » tant que le fournisseur est « console » | `src/marketing/web/automations.js`, `views/marketing/automation.ejs` | INT-EML-011 : critère « APRÈS l'activation… » réussi |
| **A25-03** (P3) — un lot de mesure sans date client rejoué était compté deux fois | Sans date plausible, l'heure de l'événement est arrondie à la **minute** : un lot rejoué dans la même minute reste dédupliqué. Le vrai script du site (qui envoie la date de chaque événement) n'est pas concerné | `src/marketing/visitors/index.js` | INT-ANA-016 : critère « sans date client… » réussi ; `cms-analytics`, `cms-analytics-web`, `analytics-coherence` verts |

**Non corrigé** : **G-03** (articles multi-auteurs) — le système de permissions de l'outil a refusé quatre fois que j'applique le correctif ; il est prêt et validé (290 tests en copie jetable). Commande à taper pour l'appliquer : `! cd ~/ClaudeProjects/KOYEKOLA-audit23 && git apply -p1 audit-parite/patch-articles-multi-auteurs.diff`. Les autres éléments (comptes de test, état de production, décisions D1 à D10) dépendent de toi.
