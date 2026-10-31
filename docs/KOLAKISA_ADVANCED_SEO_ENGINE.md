# Moteur SEO avancé

Le moteur SEO de Kolakisa est celui de `src/seo` (voir `KOLAKISA_SEO_AUDIT.md`, `SEO_CORE.md`). **22.6 n'en crée pas un second.** Il ajoute une couche éditoriale qui lit les mêmes champs.

## Réutilisé tel quel
Title, meta description, slug, canonical, robots (`noindex`, `nofollow`…), Open Graph, Twitter Cards, JSON-LD (Organization, WebSite, WebPage, BreadcrumbList, Course, Article, Product, FAQPage…), sitemap, robots.txt, redirections, 404, audit de 41 règles, comparaison d'audits.

## Ajouts
### Intention de recherche (`intent.js`)
Cinq intentions + « indéterminée ». Méthode : indices lexicaux listés (fr, en, es). Un indice qui **ouvre** la requête pèse double. Le résultat porte ses **preuves** (`evidence`) et sa base (`lexical_cues` | `no_cue` | `no_keyword`). Une requête sans indice reste indéterminée. Structure conseillée par intention, exprimée en **sections natives**. Aucune donnée de moteur de recherche.

### Mots-clés (`providers.js`)
Principal, secondaires, questions, entités, variantes. Chaque mot-clé a une provenance (saisi / externe / estimation de l'IA). Aucun volume ni difficulté n'est produit par Kolakisa.

### Analyse on-page contextualisée
Réutilise `contentGen/seo.js` (`checkMeta`, `checkStructure`). Les repères de longueur sont donnés comme tels (« repère courant »), jamais comme règle ; le bourrage est détecté à plus de 3 % pour un texte d'au moins 60 mots.

### Couverture sémantique
**Non implémentée.** Identifier sous-thèmes, entités et questions manquantes demande soit une IA configurée, soit une source de données ; aucune n'est vérifiée. Voir restes.

## Rappel
Un score n'est jamais présenté comme une prévision de classement : l'avertissement est dans chaque résultat et sur l'écran.
