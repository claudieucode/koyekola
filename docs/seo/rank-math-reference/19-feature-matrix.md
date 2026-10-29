# 19 - Matrice des fonctionnalités Rank Math

Date de consultation : 2026-10-29. Base : https://rankmath.com/free-vs-pro/ et https://rankmath.com/pricing/ (officiel), complétées par les pages KB citées dans 13 à 18.

## Avertissements de lecture

1. **Niveau** : la page free-vs-pro a été lue sous forme de texte ; les coches/croix ne sont pas lisibles et chaque fonction apparaît dans toutes les listes d'offres. Le niveau n'est donc indiqué que si une page KB ou une limite chiffrée le confirme. « Listé » = présent sur free-vs-pro sans niveau confirmé.
2. Offres : Free ; PRO 8,99 EUR/mois au renouvellement (5,59 en promotion), 1 000 mots-clés suivis, sites personnels illimités ; Business 27,99 (17,59), 20 000 mots-clés, 200 sites ; Agency 64,99 (38,59), 75 000 mots-clés, 750 sites clients ; « Rank Math + WP Rocket » 13,99 (9,99). Prix HT, annuels, page mise à jour le 3 juin 2026 (pricing, lue sur 100 000 de 130 138 caractères).
3. Limites par offre : récupération des données Google 3 jours (Free) / quotidienne ; conservation 90 j / 180 j / illimitée ; rapports e-mail 30 j / 15 ou 30 j / 7, 15 ou 30 j.
4. « Faisabilité » et « difficulté » sont des **hypothèses** de conception pour Kolakisa (Node/Express, SQLite, multi-sites). Difficulté : F faible, M moyenne, E élevée.
5. « WP » : dépendance WordPress (Forte / Moyenne / Faible).

## A. SEO de base et on-page

| Fonction | Niveau | WP | Service externe | Faisabilité Kolakisa | Diff. | Risques | Critère de validation |
|---|---|---|---|---|---|---|---|
| Assistant d'installation, réglages pré-sélectionnés, mode simple/avancé | Listé (cœur) | Moyenne | Non | Native | F | Dérive de réglages par site | Onboarding crée des défauts par site |
| Titre SEO, méta description, variables, séparateur | Cœur | Moyenne | Non | Native | F | Variables mal résolues | Rendu <head> conforme à un jeu de tests |
| Mot-clé principal, mots-clés illimités, analyse de contenu (30+ tests) | Cœur ; mots-clés multiples listés | Moyenne | Non | Native (règles) | M | Faux positifs, scores trompeurs | Scores reproductibles sur corpus |
| Aperçu Google, aperçu social | Cœur | Moyenne | Non | Native | F | Écart avec rendu réel | Comparaison visuelle |
| Méta robots, robots avancés, canonical auto, catégorie principale | Cœur | Moyenne | Non | Native | F | Noindex accidentel | Tests de non-régression par type de page |
| Open Graph / Twitter Cards, image par défaut, overlay | Cœur ; filigranes = PRO (titles-and-meta) | Moyenne | Non | Native | F | Images mal dimensionnées | Validation par débogueurs de partage |
| Édition en masse titres/descriptions, Quick Edit, filtres avancés | Cœur ; options avancées listées | Forte (écrans WP) | Non | Native | M | Écrasements massifs | Aperçu + annulation |
| Import/export de mots-clés, CSV de méta SEO | PRO (import-export) | Moyenne | Non | Native | M | Format et encodage | Aller-retour sans perte |
| Pillar content, suggestions de mots-clés Google | Listé | Moyenne | Google (suggestions) | Partielle | M | API non officielle (non vérifiée) | Source documentée |
| Analyse de l'intention de recherche | Listé | Faible | Probable (non documenté) | Hypothèse | E | Non documenté | Spécification propre |

## B. Schema et données structurées

| Fonction | Niveau | WP | Externe | Faisabilité | Diff. | Risques | Validation |
|---|---|---|---|---|---|---|---|
| Schema de base (Article, Product, FAQ, HowTo, etc.), 193 types LocalBusiness | Cœur (liste ; 18 types prédéfinis cités) | Moyenne | Non | Native (JSON-LD) | M | Marquage invalide | Test des résultats enrichis Google |
| Types supplémentaires (6), 840+ types, schema personnalisé, import de schema, plusieurs schemas, générateur avancé | Listés ; offres non lisibles | Moyenne | Non | Partielle | E | Maintenance du catalogue | Validation schema.org |
| Détection auto de vidéo, remplissage via YouTube | Listé ; clé API YouTube facultative | Moyenne | YouTube API | Partielle | M | Quotas | Cache des métadonnées |
| FAQ depuis widgets Elementor/Divi, bbPress Q&A | Listé | Forte | Non | Non pertinent | - | - | - |
| Breadcrumb schema | Cœur | Moyenne | Non | Native | F | Doublon thème | Un seul BreadcrumbList |
| Speakable, Dataset, Fact Check, Podcast, Carousel, Mentions & About | Listés | Moyenne | Non | Au besoin | M | Peu d'usage | Selon cas d'usage |
| Validation avec Google | Listé | Faible | Google (outil externe) | Lien externe | F | Dépendance outil | - |

## C. Sitemaps et indexation

| Fonction | Niveau | WP | Externe | Faisabilité | Diff. | Risques | Validation |
|---|---|---|---|---|---|---|---|
| Sitemap XML index, images, exclusions, 200 liens/sitemap conseillés | Cœur ; images ACF PRO | Moyenne | Non | Native | F | Cache | Search Console accepte l'index |
| Sitemap actualités | PRO (news-sitemap) | Moyenne | Google News | Native | M | Politique Google | Sitemap valide |
| Sitemap vidéo | PRO (configure-sitemaps) | Moyenne | YouTube optionnel | Partielle | M | Quotas | Validité |
| Sitemap local (KML) | PRO | Moyenne | Google | Si Local SEO | M | - | - |
| Instant Indexing (IndexNow) | Gratuit (instant-indexing) | Moyenne | IndexNow | Native | F | Soumissions abusives | Réponse 200/202 |
| Statut d'indexation / URL Inspection | Cœur avec plafonds 2 000 / 6 000 URL (analytics) | Faible | Search Console API | Native | M | 2 000 inspections/jour/site (Google) | Rapport cohérent |
| Redirections (301, 302, 307, 410, 451, regex, auto), débogage, CSV | Cœur ; CSV, sync .htaccess listés PRO | .htaccess : forte | Non | Native | M | Boucles | Détection de boucles |
| 404 Monitor simple/avancé, export du journal | Listé | Faible | Non | Native | F | Volume du journal | Rotation et plafond |

## D. Analytics et suivi

| Fonction | Niveau | WP | Externe | Faisabilité | Diff. | Risques | Validation |
|---|---|---|---|---|---|---|---|
| Intégration Search Console | Gratuit | Faible | Google OAuth/API | Native | M | Quotas, jetons | Données concordant avec Search Console |
| Données GA4, trafic de recherche, Site Analytics, trafic IA | PRO | Faible | GA4 Data API | Partielle | E | 200 000 jetons/jour/propriété | Quotas respectés |
| Rank Tracker (1 000 / 20 000 / 75 000 mots-clés) | PRO | Faible | Données Search Console (positions moyennes) | Native | M | Pas de positions live | Libellé « moyenne Google » |
| Meilleurs/pires mots-clés et articles, historique | Listé | Faible | Google | Native | M | - | - |
| Rapports e-mail (marque blanche) | Listé ; fréquence selon offre | Moyenne | E-mail | Partielle | M | Délivrabilité | Envoi planifié |
| Pays spécifique, anonymisation IP, JS GA auto-hébergé | PRO (analytics) | Moyenne | GA | Partielle | M | RGPD | Revue juridique |
| AdSense, Google Trends, PageSpeed par article | Listés ; détail non lu | Faible | Google | Hypothèse | E | Non documenté | - |
| AI Visibility (ChatGPT/Gemini) | Abonnement Rank Math AI ; plateformes selon offre | Faible | Service Rank Math + LLM | Hors périmètre court terme | E | Données non Google, source non dite | Méthode propre |

## E. Audit et liens

| Fonction | Niveau | WP | Externe | Faisabilité | Diff. | Risques | Validation |
|---|---|---|---|---|---|---|---|
| SEO Analyzer (Basic, Advanced, Performance, Security) | Gratuit ; impression PRO | Moyenne | Serveur Rank Math fetch | Native | M | Seuils arbitraires | Jeu de pages témoin |
| Competitor Analyzer, comparaison | PRO | Faible | Fetch tiers | Partielle | M | Légalité du crawl | robots.txt respecté |
| Link Counter, rapport de liens, cassés, orphelines | Listé ; audit complet PRO | Moyenne | Non | Native | M | Charge du crawl | Zéro faux orphelin |
| AI Link Genius (Keyword Maps, bulk, rollback) | PRO | Moyenne | LLM facultatif | Native | M | Édition de contenu | Rollback prouvé |
| Suggestions de liens, Related Posts | Limites mensuelles Rank Math AI | Moyenne | Rank Math AI | Native (FTS) | M | Pertinence | Revue éditoriale |

## F. Contenu IA et MCP

| Fonction | Niveau | WP | Externe | Faisabilité | Diff. | Risques | Validation |
|---|---|---|---|---|---|---|---|
| Content AI (écriture, idées, Command Center, meta, alt) | Abonnement ; essai Starter/Creator/Expert ; gratuit 1 à 5 usages | Forte (éditeur) | LLM Rank Math | Native avec fournisseur LLM | E | Coût, qualité, confidentialité | Quotas par fonction |
| RankBot, recherche de mots-clés, long-form | Mêmes limites | Moyenne | LLM | Partielle | E | - | - |
| MCP tools | Gratuit ; certains outils PRO / IA | Moyenne | Client MCP | Native | M | Écritures sur site réel | Jeton limité + journal |

## G. Modules divers

| Fonction | Niveau | WP | Externe | Faisabilité | Diff. | Risques | Validation |
|---|---|---|---|---|---|---|---|
| Breadcrumbs | Cœur ; widget Elementor PRO | Moyenne | Non | Native | F | Doublons | JSON-LD unique |
| Liens sortants (nofollow, nouvel onglet, affiliés PRO) | Cœur ; préfixe PRO | Faible | Non | Native | F | Attributs erronés | Tests HTML |
| RSS (avant/après contenu) | Cœur ; retrait média PRO | Moyenne | Non | Native | F | - | - |
| Archives d'auteurs, dates, recherche (noindex) | Cœur | Forte | Non | Selon CMS | F | - | - |
| Images SEO (alt/title auto, légendes PRO, remplacements PRO) | Mixte | Moyenne | Non | Native | M | Alt génériques | Contrôle manuel |
| llms.txt, robots.txt, .htaccess | Listés gratuits | .htaccess forte | Non | llms.txt et robots.txt natifs | F | Mauvaise exposition | Tests par site |
| Headless (REST getHead) | Aucun plan nommé | Forte | Non | Native (modèle d'API) | F | Fuite de brouillons | Auth/publié seulement |
| Podcast | PRO | Moyenne | Plateformes | Au besoin | M | - | - |
| Local SEO (multi-lieux), WooCommerce, EDD | Listés PRO / cœur | Forte | Non | Hors périmètre | - | - | - |
| Intégrations Elementor, Divi | Listées | Forte | Non | Non pertinent | - | - | - |

## H. Administration

| Fonction | Niveau | WP | Externe | Faisabilité | Diff. | Risques | Validation |
|---|---|---|---|---|---|---|---|
| Role Manager (16 capacités) | Cœur | Forte | Non | Native | M | Contournement par URL | Test d'accès par route |
| Import/export, sauvegarde un clic, importeurs Yoast/AIOSEO/SEOPress | Cœur ; CSV PRO | Moyenne | Non | Native | M | Écrasement | Sauvegarde auto |
| Multisite, clients (200 / 750), White-label | Listés ; détail non lu | Forte | Non | Native (site_id) | M | Fuite inter-sites | Isolation testée |
| Mises à jour auto, version control, support 24/7 | Listés | Forte | Rank Math | Non pertinent | - | - | - |

## Sources

| URL | Date | Statut |
|---|---|---|
| https://rankmath.com/free-vs-pro/ | 2026-10-29 | officiel (icônes illisibles) |
| https://rankmath.com/pricing/ | 2026-10-29 | officiel (partiel) |
| Pages KB citées dans les documents 13 à 18 | 2026-10-29 | officiel |
| Colonnes faisabilité / difficulté / risques / validation | - | hypothèse |

## Lacunes

- Niveau exact par offre de la plupart des fonctions listées sur free-vs-pro (icônes non lisibles).
- Fin de la page pricing non lue ; prix d'abonnement Rank Math AI séparé non confirmé.
- Fonctions listées mais non détaillées : Google Trends, AdSense, PageSpeed par article, Local SEO, WooCommerce, EDD, Client Management, intention de recherche.
