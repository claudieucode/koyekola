# Kolakisa SEO — intégrations externes (état réel)

Aucune intégration n'est affichée comme connectée sans authentification et vérification réussies (`src/seo/integrations.js`). Sans configuration : « Non connecté » avec les étapes à suivre. Les clés sont chiffrées côté serveur (AES-256-GCM), jamais envoyées au navigateur ni stockées dans le code.

| Fournisseur | Utilité | État | Prérequis | Remarques |
|---|---|---|---|---|
| Google PageSpeed Insights | Mesure de performance | Branché, vérifié contre un faux serveur (tests) ; **non vérifié avec une vraie clé dans cette mission** | Clé API Google | Quotas du fournisseur |
| Google Search Console | Requêtes, clics, impressions, positions moyennes (données réelles Google) | Branché côté central ; **pas par site** | Compte de service ou OAuth, propriété vérifiée | Modèle d'autorisations par site à décider |
| Google Analytics 4 (Data API) | Trafic | Idem | Propriété GA4 + autorisation | Idem |
| Suivi de positions | Rang par mot-clé | **Absent** | Fournisseur autorisé (contrat, quota) | Aucun scraping des moteurs |
| Mots-clés (volumes) | Idées de mots-clés | **Absent** | Fournisseur payant | — |
| Fournisseurs IA | Génération de méta, alt | **Absent** | Clé, politique de confidentialité | Interface interchangeable, validation humaine obligatoire |
| Validation de schéma | Contrôle des données structurées | Contrôle **interne** (syntaxe et champs obligatoires) ; pas d'appel à un validateur externe | — | Ne garantit aucun résultat enrichi |

Détail des API, quotas et authentifications : voir `rank-math-reference/13-analytics-rank-tracking.md` et les documentations Google citées.
