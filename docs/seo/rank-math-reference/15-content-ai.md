# 15 - Content AI / Rank Math AI et outils MCP

Date de consultation : 2026-10-29. Statuts : officiel / observation / hypothèse.

## 1. Marque et périmètre (officiel, `kb/rank-math-ai-rebranding/`)

« Rank Math AI » est une marque ombrelle regroupant :
- **Content AI** : recherche, création, optimisation de contenu, génération de métadonnées.
- **AI Link Genius** : opportunités de liens internes et gestion des liens (voir 16).
- **AI Visibility** : suivi de la présence d'une marque dans la recherche IA (ChatGPT, Gemini).

La page décrit un changement « principalement de nom et de marque ». Les offres Content AI Starter/Creator/Expert deviennent Rank Math AI Starter/Creator/Expert, sans changement de structure ni de prix. Content AI reste utilisable seul. Aucune date d'effet.

À séparer : ce sont des produits Rank Math ; les produits d'autres éditeurs (ChatGPT, Gemini, Claude, GitHub Copilot) ne sont que des cibles de suivi ou des clients MCP.

## 2. Fonctions Content AI réellement documentées

| Fonction | Détail (officiel) | WP |
|---|---|---|
| Éditeur / meta box | Disponible dans le tableau de bord Content AI et dans la meta box de l'éditeur ; fonctionne avec Elementor et Divi | Oui |
| Command Center | Barre d'outils de l'éditeur de blocs (icône ou `//`) : Run as Command, Write More, Improve, Summarize, Write Analogy, Fix Grammar, Generate Link (suggère des liens internes). Bloc Gutenberg uniquement, pas l'éditeur classique ; exige les modules Content AI et Link Genius | Oui |
| Idées d'articles (Blog Post Idea) | Entrées : niche, audience, ton, 22 styles, langue ; 1 à 20 idées | Non en soi |
| Autres outils nommés dans les limites | Keyword Research, Fix SEO Tests, texte alt d'image par IA, contenu long en 1 clic, suggestions de liens, opportunités de liens, articles associés, SEO Meta, RankBot (chatbot), etc. | Variable |
| Détail des fonctions Write/Research/Bulk | **Non documenté dans les pages lues** (la page `kb/content-ai/` ne couvre que Blog Post Idea) | - |

Niveau d'offre : Content AI est un abonnement distinct. Offre gratuite : « un à cinq usages gratuits » par fonction et par mois (officiel). Les offres PRO/Business/Agency incluent un essai gratuit respectivement Starter/Creator/Expert (pricing) ; l'offre « Rank Math + WP Rocket » a un essai de 15 jours (Starter).

## 3. Crédits et tarification

- **Les crédits ont été remplacés** par des **limites mensuelles par fonction** (`kb/content-ai-credits-migration/`). Chaque exécution réussie compte pour un usage de cette fonction ; les échecs ne comptent pas ; rien ne se reporte au mois suivant.
- Limites mensuelles publiées :

| Fonction | Starter | Creator | Expert |
|---|---|---|---|
| Keyword Research | 10 | 30 | 100 |
| Fix SEO Tests | 500 | 1 000 | illimité |
| Alt text d'image par IA | 50 | 100 | 500 |
| Contenu long en 1 clic | 15 | 60 | illimité |
| Suggestions de liens | 100 | 500 | 1 000 |
| Opportunités de liens | 50 | 200 | 1 000 |
| Articles associés | 50 | 200 | 1 000 |
| Autres outils (SEO Meta, RankBot, idées…) | 100 | 500 | illimité |

- Réinitialisation à date fixe mensuelle (date visible dans General Settings > Content AI) ; versions requises : Rank Math SEO 1.0.269+, PRO 3.0.112+.
- Consulter l'usage : Rank Math SEO > Content AI > Usage, outils, RankBot, meta box.
- Prix : la page pricing (dernière mise à jour affichée 3 juin 2026) donne les offres Rank Math PRO 8,99 EUR/mois au renouvellement (sale 5,59), Business 27,99 (sale 17,59), Agency 64,99 (sale 38,59), HT, facturation annuelle. Elle **ne liste pas** les limites de crédits ; le prix d'abonnement Rank Math AI séparé n'est pas donné dans les pages lues (**lacune**).

## 4. AI Visibility (officiel, `kb/track-ai-visibility/`)

- Mesure : mentions de marque, citations, sentiment, position dans les réponses, part de voix face aux concurrents ; score AI Visibility calculé (rang, citations, mentions, sentiment).
- Plateformes : ChatGPT ou Gemini (Starter/Creator : une seule ; Expert : les deux). Google AI Overviews évoqué en introduction sans sélecteur.
- Fréquence : hebdomadaire ou mensuelle (Starter/Creator) ; quotidienne, hebdomadaire ou mensuelle (Expert). Pays optionnel ; 30+ langues.
- Source des réponses IA et nature (échantillons vs estimations) : **non dites**. À traiter comme des échantillons de requêtes simulées, pas comme des données fournies par Google (hypothèse).

## 5. Confidentialité

La page de démarrage Content AI ne précise ni les données envoyées ni les modèles ni les langues supportées (officiel : absence). Le fonctionnement exige de connecter le site à un compte Rank Math (service externe). Aucune politique de rétention n'est documentée dans les pages lues (**lacune** ; à vérifier dans la politique de confidentialité Rank Math, non consultée).

## 6. MCP tools (officiel, `kb/mcp-tools/`, `kb/setup-rank-math-mcp/`)

- Principe : commandes « prêtes pour IA » exposées à un assistant compatible MCP (via l'adaptateur MCP WordPress selon la page des outils).
- Catégories :
  - Configuration : lecture des réglages, état système, robots.txt, llms.txt ; écriture de l'identité du site, réglages globaux, accueil, liens, statut des modules, sitemap, préférences (mises à jour auto), types de contenu, breadcrumbs.
  - Tâches SEO : audit, correction (sous-ensemble), analyse de contenu, schema d'un article, méta SEO, scores, liens d'un article, redirections, rapport de liens.
  - Search Console : meilleurs mots-clés.
  - AI Visibility : aperçu, insights de marque, requêtes de marque, création de marque (exige Content AI/Rank Math AI).
- Niveaux : fonctionne avec le plugin gratuit ; audit concurrent et audit de liens complet (cassés, chaînes de redirection, suivi, statut HTTP) = PRO ; schema : types gratuits seulement en gratuit.
- Authentification : nom d'utilisateur WordPress + **mot de passe d'application** révocable ; Node.js requis côté client desktop ; une connexion par site, plusieurs assistants possibles par site. Rôles/capacités exigés : non décrits. Pas de section sécurité dans la KB principale ; certains outils modifient le site en direct.
- Pertinence Kolakisa : un serveur MCP propre (outils de lecture SEO, audit, écriture contrôlée) est faisable en Node ; conserver des jetons par site à portée limitée, journal d'audit et confirmation avant écriture (hypothèse de conception).

## 7. Pertinence pour Kolakisa

- Dépend d'un fournisseur LLM externe : coût par appel, quotas par site/offre, limites mensuelles par fonction sur le modèle de Rank Math, échecs non facturés.
- Les fonctions « Fix SEO Tests » et « Generate Link » sont couplées à l'analyse et aux liens : faisables si l'audit de Kolakisa produit des correctifs structurés.
- Ne pas copier prompts ou algorithmes propriétaires : aucun n'est publié ici.

## 8. Sources

| URL | Date | Statut |
|---|---|---|
| https://rankmath.com/kb/rank-math-ai-rebranding/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/content-ai-credits-migration/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/check-content-ai-usage/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/content-ai-setup/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/content-ai/ | 2026-10-29 | officiel (ne couvre que Blog Post Idea) |
| https://rankmath.com/kb/content-ai-command-center/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/track-ai-visibility/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/mcp-tools/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/setup-rank-math-mcp/ | 2026-10-29 | officiel |
| https://rankmath.com/pricing/ | 2026-10-29 | officiel (partiellement lu : 100 000 caractères sur 130 138) |

## 9. Lacunes

- Politique de confidentialité, modèles utilisés, langues, tarif propre de Rank Math AI : non documentés dans les pages lues.
- Fonctions Write, Research, Bulk, RankBot : seulement citées, non détaillées.
- Fin de la page pricing (30 138 caractères) non lue.
- Limites d'AI Visibility en nombre de marques : non précisées.
