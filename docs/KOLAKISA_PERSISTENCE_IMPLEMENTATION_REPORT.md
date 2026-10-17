# Rapport d'implémentation — mission 7

## Code de production (2 fichiers)
| Fichier | Modification | Défaut |
|---|---|---|
| `public/js/page-builder.js` | `inflight` : suivi de la requête d'enregistrement en cours ; `saveNow()` l'attend (puis envoie ce qui est arrivé entre-temps) ; la publication et l'aperçu passent par `saveNow()` ; l'aperçu ne s'ouvre pas si l'enregistrement a échoué ; message dédié à la session expirée (401) | D1, D2, D3 |
| `src/marketing/pages/index.js` | `publish` : pas de nouvelle version si le contenu est identique à la dernière | D4 |

## Tests
| Fichier | Contenu |
|---|---|
| `tests/persistance-navigateur.test.js` (8, Chrome, réseau contrôlé) | publication pendant un vol ; erreur 500 et reprise ; session expirée ; rechargement + copie locale ; ordre des enregistrements ; annulation pendant un enregistrement ; deux onglets ; aperçu avec échec |
| `tests/persistance-serveur.test.js` (5, vrai serveur) | révision périmée et simultanéité ; versions sans doublon ; restauration ; refus de validation sans effet ; aller-retour |

Sans correctif : 4 tests navigateur échouent (publication, erreur, session, aperçu) ; le test de publication côté serveur échoue.

## Non modifié
Contrat de l'API (`revision`, 409, 422), format des documents, normalisation, historique d'annulation, versions, restauration.
