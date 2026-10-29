# 13 - Analytics, Search Console et suivi de positions (Rank Math)

Date de consultation de toutes les sources : 2026-10-29. Légende des sources : **officiel** = page rankmath.com / developers.google.com ; **observation** = lecture directe d'une page, interprétation limitée ; **hypothèse** = déduction non documentée.

## 1. Périmètre

Le module « Analytics » de Rank Math est optionnel (la page dit qu'il est « complètement optionnel » et n'affecte pas les fonctions SEO). Il se configure dans Rank Math SEO > General Settings > Analytics, puis s'ouvre dans Rank Math SEO > Analytics. (officiel)

## 2. Authentification et permissions Google

Rank Math demande six autorisations OAuth Google (officiel, `kb/analytics/`) :

| Autorisation | Usage déclaré |
|---|---|
| Créer compte/propriété/vue Google Analytics | Pour les sites sans GA |
| Modifier les entités de gestion GA | Google l'associe à update/delete ; Rank Math dit ne pas les utiliser |
| Lire données et rapports GA | Rapports |
| Lire données AdSense | Historique de revenus |
| Données Search Console | Récupération des données et soumission de sitemaps |
| Gérer la liste des sites/domaines | Vérification automatique Search Console (Rank Math dit ne l'utiliser que pour ajouter des sites) |

Refuser une autorisation désactive seulement la fonction associée. Pour changer : déconnecter le compte Google puis réautoriser. Le jeton et les appels API passent par le compte Rank Math connecté (la page ne détaille pas l'architecture : **lacune**).

## 3. Fonctionnalités, niveau, dépendance WordPress, pertinence Kolakisa

| Fonction | Niveau (source) | Dépendance WP | Pertinence Kolakisa |
|---|---|---|---|
| Données Search Console (clics, impressions, CTR, position moyenne, mots-clés) | Gratuit (officiel : « Free : Search Console data only ») | Faible : API Google ; UI et stockage dans WP | Élevée. Faisable via Search Analytics API avec OAuth par site |
| Fréquence de récupération : tous les 3 jours (gratuit) / quotidienne (PRO) | Limites par offre (free-vs-pro, analytics) | Non | Choix de conception libre |
| Conservation des données Google : 90 jours (gratuit), 180 j (PRO), illimité (Business, Agency) | Limite par offre (free-vs-pro) | Non | Kolakisa peut stocker en SQLite sans limite d'offre |
| Données Google Analytics 4 (trafic de recherche, trafic IA, Site Analytics) | PRO (officiel : le gratuit « ne tire aucune donnée GA ») | Faible | Moyenne. Nécessite GA4 Data API et propriété GA4 |
| Suivi de position (Rank Tracker) | PRO (officiel) ; mots-clés suivis : 1 000 PRO / 20 000 Business / 75 000 Agency | Faible | Élevée mais voir section 5 |
| Statut d'indexation (Index Status, URL Inspection) | Onglet activable ; 2 000 URL par planification (gratuit) / 6 000 (PRO) (officiel) | Faible | Élevée via URL Inspection API (quota Google : voir section 6) |
| Onglets : Dashboard, Site Analytics (PRO), SEO Performance, Keywords, Rank Tracker (PRO), Index Status | Officiel | UI WP | Reproductible |
| Pays spécifique, anonymisation IP, JS GA auto-hébergé (rafraîchi toutes les 12 h) | PRO (officiel) ; page free-vs-pro liste aussi « Install Google Analytics Code », « Anonymize IP » parmi les fonctions cœur | Oui pour l'injection de script | Faible à moyenne |
| AdSense (historique de revenus) | Listé sur free-vs-pro ; autorisation décrite dans analytics | Faible | Faible |
| Google Trends, PageSpeed par page, badges de performance par article, Google Index Status | Listés sur free-vs-pro ; détail non lu | Mixte | Moyenne (**lacune** : détail non consulté) |
| Rapports e-mail SEO (30 j gratuit ; 15 ou 30 j PRO ; 7/15/30 j Business et Agency), marque blanche | Free-vs-pro (officiel) | Oui (cron WP, e-mail) | Moyenne : nécessite cron + e-mail transactionnel côté Kolakisa |
| Trafic de recherche IA / « AI Search Traffic Tracker » ; filtre trafic IA | PRO (analytics) ; listé sur free-vs-pro | Faible | Moyenne (dépend de segmentation GA4 ; détail **non lu**) |

Note de fiabilité : la page free-vs-pro perd les icônes coche/croix à la lecture ; l'inclusion par offre n'est donc fiable que là où une page KB le précise ou pour les limites chiffrées (officiel, observation).

## 4. Données fournies par Google ou estimations

- Clics, impressions, CTR et position moyenne proviennent de Search Console, donc de Google (officiel : « Rank Math's Rank Tracking functionality works by using data directly from Google »).
- La position affichée est une **moyenne** agrégée par Google sur de multiples recherches, pas une position instantanée ni un scraping de SERP. La page parle de moyenne sur plusieurs recherches (observation).
- Seuls les mots-clés dans les 100 premières positions sont affichés dans le Rank Tracker (officiel). Un mot-clé sans donnée Search Console n'apparaît pas.
- Rank Math ne fournit pas de positions « en direct » : toute présentation de ce type dans Kolakisa serait une estimation à étiqueter comme telle.
- Les bandes de position (top 3, 4-10, 10-50, 51-100) sont un regroupement de ces moyennes (officiel).

## 5. Détail du Rank Tracker (officiel, `kb/rank-tracker/`)

- Colonnes : impressions, clics, position, variation 30 jours, CTR, historique de position. Clic sur un mot-clé : liste des articles qui le classent.
- Graphique : 6 mots-clés maximum ; période maximale de 6 mois.
- Import automatique des mots-clés principaux (et secondaires en option) des articles, filtrable par type de contenu.
- Supprimer un mot-clé ne supprime pas ses données ; les ré-ajouter les restaure.
- Prérequis : compte Google connecté. Dépannage : désactiver le cache de requêtes si les mots-clés ne s'enregistrent pas.
- Fréquence de rafraîchissement du Rank Tracker : non précisée (**lacune**).

## 6. Quotas Google pertinents pour un clone natif (officiel Google)

Search Console API (`developers.google.com/webmaster-tools/limits`) :
- Search Analytics : 1 200 QPM par site, 1 200 QPM par utilisateur, 30 000 000 QPD et 40 000 QPM par projet.
- URL Inspection : 2 000 QPD et 600 QPM par site ; 10 000 000 QPD et 15 000 QPM par projet.
- Autres ressources : 20 QPS et 200 QPM par utilisateur ; 100 000 000 QPD par projet.
- Quota court terme mesuré par tranches de 10 minutes.

GA4 Data API, propriétés standard (`.../data/v1/quotas`) :
- 200 000 jetons par propriété et par jour ; 40 000 par heure ; 14 000 par projet, propriété et heure.
- 10 requêtes concurrentes par propriété ; 10 erreurs serveur par projet/propriété/heure. Analytics 360 : 2 000 000 / 400 000 / 140 000 / 50 / 50.
- Réinitialisation quotidienne à minuit heure du Pacifique.

Conséquence (hypothèse de conception) : à l'échelle multi-sites, regrouper les appels par site, planifier en différé et mettre en cache en SQLite ; le plafond de 2 000 inspections URL par jour et par site borne l'indexation vérifiable.

## 7. Rétention

- Rank Math : 90 / 180 jours / illimité selon offre (officiel). Les données sont stockées dans la base du site WordPress (hypothèse, non dite).
- Google : la page des limites de l'API ne mentionne pas la rétention de 16 mois de Search Analytics ; non vérifié ici (**lacune**). Un historique local en SQLite est la seule façon de dépasser la fenêtre fournie par Google (hypothèse).

## 8. Pertinence pour Kolakisa

- Natif : OAuth par site, import Search Console quotidien, stockage historique, tableau de bord, suivi de mots-clés basé sur Search Console, inspection d'URL.
- Dépend de services externes : comptes Google, projet Google Cloud et écran de consentement OAuth (vérification Google possible pour les scopes sensibles : hypothèse à valider).
- Risques : quotas, révocation des jetons, confidentialité des tokens par site (multi-site), RGPD (anonymisation IP).

## 9. Sources

| URL | Date | Statut |
|---|---|---|
| https://rankmath.com/kb/analytics/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/rank-tracker/ | 2026-10-29 | officiel |
| https://rankmath.com/free-vs-pro/ | 2026-10-29 | officiel (icônes non lisibles : observation) |
| https://rankmath.com/pricing/ | 2026-10-29 | officiel |
| https://developers.google.com/webmaster-tools/limits | 2026-10-29 | officiel (Google) |
| https://developers.google.com/analytics/devguides/reporting/data/v1/quotas | 2026-10-29 | officiel (Google) |

## 10. Lacunes

- `https://rankmath.com/kb/seo-analytics/` : 404.
- Rétention de 16 mois de Search Console non confirmée ici.
- Fréquence de rafraîchissement du Rank Tracker, architecture du stockage des jetons, détail de Google Trends, PageSpeed par article, AI Search Traffic Tracker : non documentés dans les pages lues.
- Aucune donnée de quotas propre à Rank Math (il n'y en a pas de publiés dans les pages lues).
