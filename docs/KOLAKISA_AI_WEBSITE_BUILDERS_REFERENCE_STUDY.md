# Étude des solutions de référence — constructeurs de sites assistés par IA

## Méthode et niveau de preuve

Trois niveaux, jamais mélangés :
- **[V] Vérifié** : consulté pendant ce palier via recherche web (pages officielles ou éditeur). Une seule recherche par produit, **les pages n'ont pas été ouvertes en entier**.
- **[D] Documenté** : connaissance générale antérieure, non revérifiée ici. À confirmer avant toute décision.
- **[H] Hypothèse**.

Aucune solution n'a été utilisée en compte réel. Aucun comportement n'est donc « vérifié par essai ».

## Synthèse comparative

| Solution | Parcours | Brief | Plan de site | Génération | Édition après | Source |
|---|---|---|---|---|---|---|
| **Wix** (Harmony / Aria) | Bouton « Créer avec l'IA », conversation, puis **brief IA à relire** ; aussi via ChatGPT (`@Wix`) qui présente d'abord un plan de site, créé au clic « Créer le site » ; serveur MCP Wix pour Claude/ChatGPT/Copilot | Oui, récapitulatif relisible | Oui (pages, mise en page, fonctions) | Site complet, éditeur glisser-déposer + assistant Aria | Éditeur complet | [V] pages Wix, via recherche |
| **Elementor AI Site Planner** | Chat de brief ou « Use this brief » ; produit **brief + sitemap + wireframe** pré-remplis | Oui, par chat | Oui, vue Sitemap / Wireframe commutable | Wireframe rempli de contenu IA | Éditeur Elementor | [V] aide officielle Elementor ; gratuit selon FAQ de janvier 2025, **à reconfirmer** |
| **Anthropic structured outputs** (techno, pas un builder) | — | — | — | JSON conforme à un schéma | — | [V] doc officielle : `output_config.format` `json_schema`, `additionalProperties:false` requis |
| WordPress (+ extensions IA), Framer AI, Durable, 10Web, Webflow AI | Non revérifiés | [D] | [D] | [D] | [D] | [D] |

Pour WordPress, Framer, Durable, 10Web, Webflow : ne pas citer de fonctions, prix ni limites avant vérification. Les champs demandés au point 3 (images, erreurs, modèle économique…) sont **volontairement laissés « à vérifier »** plutôt que remplis de mémoire.

## Enseignements retenus (étayés par [V])

1. **Le brief est un objet relisible avant la génération** (Wix, Elementor). → Kolakisa : le brief analysé est montré et corrigeable.
2. **Le plan précède les pages** (sitemap puis wireframe chez Elementor ; plan avant « Créer le site » chez Wix). → deux validations humaines : plan, puis aperçu.
3. **Le résultat est un site éditable avec l'éditeur natif**, pas une maquette. → même conclusion pour Kolakisa.
4. **Les assistants externes passent par une API/MCP** (Wix MCP). → option future : exposer des opérations Kolakisa à un agent, derrière les mêmes permissions.
5. **Le structuré par schéma est un standard** chez le fournisseur retenu (Anthropic) : cohérent avec `aiCore.runJson` déjà en place.

## Écarts assumés
Kolakisa n'imite ni la génération d'images ni le déploiement automatique de domaine. La régénération partielle avec préservation du travail manuel est un point de différenciation à concevoir (non vérifié comme absent ou présent chez les concurrents).

## Sources consultées
- Wix : pages wix.com/blog et wix.com/ai-website-builder (résultats de recherche).
- Elementor : elementor.com/help « What is Elementor's Site Planner? » et FAQ.
- Anthropic : platform.claude.com/docs/en/build-with-claude/structured-outputs (la section « Data retention » existe mais **son texte n'a pas été lu**).
