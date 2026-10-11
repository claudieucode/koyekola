# Analyse des lacunes (par impact)

| P | Lacune | Impact | Décision |
|---|---|---|---|
| **P1** | Couleurs du système ignorées sur les pages hors site | Réglage visible sans effet | **Corrigé** (D2) |
| **P1** | Couleur personnalisée supprimable alors que classes / boutons / liens / champs / fond la référencent | Éléments invisibles ou sans couleur à l'échelle du site | **Corrigé** (D1) |
| P2 | Pas de typographies globales nommées (style de texte réutilisable appliqué à un élément) — Elementor : « Global Fonts » | Parité Elementor : répétition de réglages de texte | Écart connu. Les classes globales couvrent le besoin de façon partielle ; à concevoir avec la mission 6 (typographie) |
| P2 | Pas de couleur globale hors site ni de couleurs du site utilisables sur plusieurs sites | Un site = un design system | Écart connu, voulu |
| P2 | Aucun inventaire des porteurs d'une classe, ni garde de suppression de classe | Dette invisible (classes orphelines) | Non traité ; à ajouter avec les modèles (mission 9) |
| P2 | Le compteur d'usage des couleurs ignore les réglages du site | L'écran peut afficher « 0 utilisation » pour une couleur protégée à la suppression | Non traité (le message de refus est précis) |
| P3 | Pas d'aperçu local immédiat d'un changement de jeton | Délai du rendu serveur | Non traité |
| P3 | Collision d'identifiants `.kw-n-<id>` entre un modèle partagé et une page | Risque mission 9 | Documenté |
| — | Suite complète non validée ; test numérique intermittent | Fiabilité | Voir rapport de tests |
