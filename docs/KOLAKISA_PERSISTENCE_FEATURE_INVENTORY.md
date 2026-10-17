# Inventaire de la persistance

| Fonction | Statut | Preuve |
|---|---|---|
| Enregistrement automatique (1 s après la dernière modification, un seul vol à la fois) | Opérationnel | `persistance-navigateur` |
| Indicateur d'état : non enregistré / en cours / enregistré / erreur / conflit / droits / session | Opérationnel (**session expirée** ajoutée) | idem |
| « Tout est enregistré » affiché pendant une requête en vol | **Corrigé** (attend la confirmation) | idem |
| Ordre des enregistrements, la dernière modification l'emporte | Opérationnel | idem |
| Erreur serveur : jamais présentée comme enregistrée ; reprise automatique (5–25 s) | Opérationnel | idem |
| Session expirée : message explicite + reprise | Opérationnel (**corrigé**) | idem |
| Conflit entre onglets : blocage, message, rien d'écrasé, copie locale gardée | Opérationnel | idem, `persistance-serveur` |
| Alerte de fermeture + copie locale reprise au retour | Opérationnel | idem |
| Annuler / rétablir pendant un enregistrement | Opérationnel | idem |
| Publier pendant un enregistrement | Opérationnel (**corrigé**, grave) | idem |
| Aperçu / export avec enregistrement impossible | Opérationnel (**corrigé**) | idem |
| Publication transactionnelle (version + page + brouillon vidé) | Opérationnel | `persistance-serveur` |
| Versions publiées (liste, comparer, aperçu, restaurer), bornées à 100 | Opérationnel | `persistance-serveur` |
| Republication sans changement : pas de version en double | Opérationnel (**corrigé**) | idem |
| Restauration : copie dans le brouillon, page en ligne intacte, ancien brouillon gardé | Opérationnel | idem |
| Historique commun des brouillons (points d'historique) | Opérationnel (interface d'historique non re-testée ici) | `persistance-serveur` (compteur) |
| Aller-retour sans perte (classes, `token:`, écrans) | Opérationnel | idem |
| Brouillon local hors ligne durable (IndexedDB, plusieurs états) | **Absent** (une seule copie, `localStorage`) | limite |
| Fusion de modifications concurrentes | **Absente** (verrou optimiste seulement) | limite |
| Enregistrement à la fermeture (sendBeacon) | **Absent** (alerte + copie locale seulement) | limite |
| Publication programmée, test A/B, composants globaux | Hors périmètre (tests préexistants) | — |
| Sécurité de la copie locale (données de la page dans `localStorage`) | Limité : non chiffrée, ce navigateur seulement | limite |
