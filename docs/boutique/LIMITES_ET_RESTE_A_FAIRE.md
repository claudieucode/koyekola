# Limites assumées et reste à faire

## Non vérifié avec de vrais comptes externes
Stripe aux clés du site, PayPal et Flutterwave (Mobile Money) sont testés contre de faux serveurs reproduisant leurs API : un essai en mode test par le propriétaire du site est nécessaire avant ouverture au public. Les e-mails partent par la file d'envoi : sans SMTP configuré ils restent « ignorés » (jamais « envoyés » à tort). Les abonnements utilisent encore les clés Stripe du serveur.

## Fonctions non réalisées
Cartes cadeaux et crédit magasin, programme de fidélité, cumul de plusieurs promotions, remises par paliers/« 2 achetés = 1 offert », produits groupés/« downloadable » (le type « numérique » couvre les fichiers), marketplace multi-vendeurs, PDF généré côté serveur (impression navigateur), sélecteur de médiathèque dans la fiche produit (URL d'image), import CSV de produits, taxes automatiques par service tiers, transporteurs en temps réel, avis avec photos, API : écriture des remboursements/paiements (volontairement refusée), tests de charge au-delà d'un seul processus.

## Dette connue hors boutique
Voir TESTS.md (échecs préexistants : pieds de page, widgets-parts, seo-audit…).
