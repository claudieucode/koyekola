# Programme 21 — tests de bout en bout

## Scénario vitrine — `tests/programme21-integration-vitrine.test.js` (8 tests, tous réussis)
Projet : entreprise de construction et rénovation à Kinshasa. **Vrais moteurs** 21.3, 21.8, 21.4, 21.5, 21.6, 21.7 sur base en mémoire (vraies migrations) ; **fournisseurs d'IA simulés**, aucun appel réseau, aucun coût.
| Étape de la mission | Vérifié par |
|---|---|
| 1-3 brief, analyse, questions | `analyzeBrief`, `answerQuestions` |
| 4-5 plan de 7 pages et validation | `createPlan`, `validatePlan` ; seule la porte `validatedPlan` ouvre la suite |
| 6-7 pages et sections | 7 pages en brouillon ; types ⊂ `sections.TYPES` ; identifiants valides ; `normalizeContent` idempotent ; aucun HTML brut |
| 8 design | 2-3 directions, toutes les paires de contraste ≥ seuil, directions différentes, rien modifié avant application |
| 9 contenus | champs natifs seulement, texte manuel appliqué tel quel ; le garde anti-invention a refusé « garantir » (affirmation non étayée) |
| 10-11 médias | besoin planifié depuis la structure, image de démonstration marquée « visuel d'attente », chemin natif dans le bandeau |
| 12-14 aperçu, modification locale, régénération ciblée | une demande n'exécute rien avant acceptation ; régénération d'UNE section : seuls ses champs sont proposés, les autres sections strictement inchangées |
| 15-18 sauvegarde, rechargement, historique, restauration | état relu identique ; 2 publications → 2 versions ; la restauration ne supprime pas les versions postérieures |
| 19-20 validation finale, publication de test | contrôles natifs ; `pages.publish` ; refus sans confirmation et sans droit |
Régénération pilotée par une demande en langage naturel (21.9) : `programme21-9-regeneration` (28) et `-http` (6) — analyse, contexte, impact, portée, protection des éléments manuels, snapshots, restauration, conflits.
**Non couvert** : rendu navigateur, DNS/domaine réel, fournisseur d'IA réel, pages publiques HTTP du site généré.

## Scénario boutique de matériel informatique — couvert par les tests du moteur et du constructeur (IA simulée, aucun paiement)
Le brief de test de 21.10 est « TechKin, ordinateurs portables, écrans et claviers à Kinshasa, livraison en RDC, prix en dollars ».
| Étape de la mission | Test (exécuté, réussi) |
|---|---|
| 1-3 brief commercial, modèle économique, marché | `programme21-10-ecommerce-builder` : faits avec preuve, hypothèses distinguées, modèles pris en charge selon le moteur réel |
| 4-5 plan de boutique, catégories | idem : catégories sans doublon, création dans le catalogue natif idempotente, réutilisation d'une catégorie existante |
| 6-8 catalogue, fiches produits, variantes | brouillons de produits (prix saisi exigé, jamais publiés d'office), variantes créées **sans SKU ni stock inventés** |
| 9 images | association d'images **existantes** de la médiathèque (génération d'images de produits : non implémentée) |
| 10 SEO e-commerce | gabarit SEO du produit sans fait inventé |
| 11 design commercial | Design Generator via le constructeur (brouillon du personnalisateur) |
| 12-13 pages et paramètres | pages éditoriales natives ; configuration paiement/livraison/taxes **saisie**, tarif ou taux absent refusé |
| 14-17 aperçu catalogue, panier, checkout, livraison | moteur 20.5 (`programme20-5-boutique-serveur`) : recherche/tri/filtre, panier recalculé côté serveur, prix du navigateur ignoré, commande « en attente » ; **validation du parcours d'achat d'après la configuration, sans commande d'essai** |
| 18 paiements simulés | faux Stripe : montant serveur, webhook signé, montant falsifié refusé, rejeu sans effet, remboursement, paiement manuel confirmé par une personne autorisée |
| 19 validation avant publication | « prête à vendre » = aucune erreur bloquante ET au moins un produit publié ; publication refusée si le paiement n'est pas utilisable (rien n'est publié) |
| 20 sauvegarde et restauration | annuler/rétablir des brouillons du projet de boutique ; **pas de restauration d'un produit déjà créé** (21.9 ne couvre pas le catalogue) |
Aucun prix, stock ni caractéristique n'a été inventé ; aucun paiement réel ; **Stripe n'a jamais été appelé en réel**.
**Non vérifié** : navigateur (`programme21-10-ecommerce-builder-navigateur` et `programme20-5-boutique-navigateur` : 0 test exécuté, Chrome absent), fournisseur de paiement réel, livraison et taxes sur un cas réel.
