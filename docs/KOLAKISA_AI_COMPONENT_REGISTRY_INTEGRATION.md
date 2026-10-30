# Intégration du registre des composants

## Principe
`ai/builder/registry.js` **lit** les registres du CMS au lieu de les recopier ; il ne peut donc pas annoncer un composant qui n'existe plus. Une fonctionnalité sans appui réel est `unavailable`.

## Sources lues (au moment de l'appel)
| Registre | Module d'origine | Contenu au 2026-10-30 |
|---|---|---|
| Types de sections | `pages/sections.js` (`TYPES`) | 16 : hero, text, image, list, course, button, quote, form, features, faq, cta, video, testimonials, divider, layout, component |
| Éléments (widgets) | `pages/nodes.js` (`NODE_TYPES`) | 94 (gallery, map, search, account, counter, accordion, tabs, pricelist, cart, addtocart, courselist…) |
| Types de pages | `pages/pageTypes.js` (`typeList`) | inventaire avec `needs` (fonctionnalité manquante) et gabarits couvrants |
| Gabarits | `pages/templates.js` | 23 gabarits réels |
| Sources de requête | `pages/query.js` (`SOURCES`) | posts, courses, pages, authors, categories, tags — **pas de produits ni de biens** |
| Modules | `siteModules.js` | sms, ai, social, scoring, commerce, lms (`ready:false`) ; activation par site lue en base |

## Fonctionnalités métier (état calculé)
Disponibles : formulaire de contact, devis (formulaire configurable), blog, newsletter (inscription), galerie, carte, témoignages (données réelles), FAQ, tarifs, équipe, vidéo, événements, téléchargements.
**Partielles** : recherche (contenu du CMS seulement), catalogue de formations (module Formations non prêt pour les sites secondaires), paiement (formations seulement, Stripe ; pas de produits ni de mobile money), catalogue de biens (fiches manuelles + galerie, sans filtre par prix), espace membre (compte élève seulement), réservation (page de demande, sans calendrier).
**Indisponibles** : boutique de produits, catalogue de produits, site multilingue.

Ces états découlent de `check()` de chaque fonctionnalité et changeront d'eux-mêmes si le code évolue ; les tests n'en figent que quelques-uns (boutique, catalogue de produits, multilingue indisponibles ; formations dépend de `MODULES.lms.ready`).

## Règles d'usage par le planificateur
1. Préférer les composants existants : le prompt ne liste que ceux-ci.
2. Type de section ou élément inconnu → la section est `unavailable` / `partial`, avec le motif ; elle n'est pas supprimée en silence.
3. Fonctionnalité `unavailable` demandée par la personne → alerte `error` bloquant la validation jusqu'à « continuer sans » ou retrait.
4. Module non activé pour le site visé → même traitement (alerte), l'activation reste réservée à l'équipe.
5. Aucune propriété de style ni valeur de design n'est produite à ce palier (21.5).

## Limites
Le registre ne décrit pas les propriétés détaillées de chaque élément (110 propriétés de style) : elles relèvent du Page Generator. Les contraintes de compatibilité entre éléments ne sont pas encore modélisées.
