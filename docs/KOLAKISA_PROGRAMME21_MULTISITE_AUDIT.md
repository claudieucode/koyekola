# Programme 21 — audit multisite

Principe : moteur partagé, données isolées. Vérifié :
- **Le site vient de l'adresse** (ou du plan, relu en base), jamais d'un champ de formulaire ; un accès limité à un site est cantonné à son site (`ctx.siteScope`). Classement des routes dans `routeScopes` (test de couverture).
- **Tables du programme 21** rattachées au site (`site_id`, clé étrangère vers `mk_sites` en cascade pour les tables à la demande ; `mk_ai_plans.site_id`) : plans, générations de pages, directions artistiques, ensembles de contenus, besoins/tâches/historique/métadonnées de médias, états d'assistant.
- **Plusieurs sites simultanés** : `programme21-securite-multisite` (deux sites, objets IA du site B protégés), `ai-media` (médias d'un autre site introuvables, accès limité), `design-generator` / `page-generator` (propositions non lisibles depuis un autre site), `programme21-8-ai-builder-http` (projets de B invisibles pour A), `r7-coherence-moteurs` (modules désactivés = routes fermées).
- **Rôles** : administrateur, éditeur, lecteur, rôle personnalisé minimal, accès limité à un autre site, anonyme : testés (lecture et écriture).
- **Médias** : médiathèque du site (`reach`/`site_id`), médias communs en lecture seule pour un site ; un média d'un autre site ne peut être ni décrit, ni placé, ni lu.
- **Aucun moteur dupliqué par site** : modules partagés, aucune copie.
Limite : les plans IA d'un projet « sans site » (équipe) existent (`site_id` nul) ; ils sont visibles de l'équipe seulement.
