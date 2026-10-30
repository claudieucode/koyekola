# Programme 20.7 — validation fonctionnelle

| Fonctionnalité | Origine | État réel | Test | Résultat | Priorité | Statut |
|---|---|---|---|---|---|---|
| Création / liste / archivage / restauration de site | 20.1-20.2 | Disponible | programme20-7-integration, site-espace | 6/6 | — | VALIDÉ |
| Duplication, suppression, droits par site | 20.2 | Disponible | admin-multisite, palier 18 | passent | — | VALIDÉ |
| Domaines d'un site | 20.2 | Disponible (propriété DNS/HTTPS non vérifiés) | domaines-sites-independants | non rejoué | P2 | VALIDÉ AVEC RÉSERVES |
| Éditeur visuel, sauvegarde, historique | 20.1 | Disponible | ~175 fichiers *-navigateur | non rejoués ici | — | NON TESTABLE (dans cette passe) |
| Theme Builder (conditions, priorité, repli) | 20.3 | Partiel (réglage d'organisation) | programme20-7-integration, theme-builder-serveur | repli et brouillon vérifiés | P2 | VALIDÉ AVEC RÉSERVES |
| Theme Builder propre à chaque site | 20.3 | **Absent** | — | — | P2 (décision d'architecture) | NON DISPONIBLE |
| Template Library : packs, gabarits, Mes modèles, import idempotent/atomique | 20.4 | Disponible | apparence-templates | passe | — | VALIDÉ |
| Licences / droits des modèles | 20.4 | Non géré (modèles intégrés, pas de marché externe) | — | — | P3 | NON DISPONIBLE |
| Catalogue produits : variantes, stock, promotions | 20.5 | Absent (formations seulement) | — | — | P2 | NON DISPONIBLE |
| Livraison, fiscalité, multi-pays | 20.5 | Absent | — | — | P2 | NON DISPONIBLE |
| Panier / commande / Stripe (prix côté serveur, webhook signé idempotent) | 20.5 | Disponible pour les formations | commerce-par-site, paiement-stripe, programme20-7-integration | passent | — | VALIDÉ (formations uniquement ; fournisseur réel non testé) |
| Boutique par site | 20.5 | Volontairement fermée aux domaines de site | commerce-par-site | passe | P2 | NON DISPONIBLE |
| Assistant de création guidée | 20.6 | Disponible (siteWizard) | site-wizard | passe | — | VALIDÉ |
| Créateur de site par IA | 21.8 | Disponible (version poussée par une autre session) | programme21-8-ai-builder-http/navigateur | 24/24 | voir ses réserves | VALIDÉ AVEC RÉSERVES |
| Scénarios A à I de bout en bout dans un navigateur | 20.7 | Non déroulés en entier dans cette passe | — | — | — | NON TESTABLE |
