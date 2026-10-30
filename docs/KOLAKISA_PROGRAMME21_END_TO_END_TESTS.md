# Programme 21 — tests de bout en bout

## Scénario vitrine (réalisé) — `tests/programme21-integration-vitrine.test.js` (8 tests, tous réussis)
Projet : entreprise de construction et rénovation à Kinshasa. **Vrais moteurs** 21.3, 21.8, 21.4, 21.5, 21.6, 21.7 sur base en mémoire (vraies migrations) ; **fournisseurs d'IA simulés**, aucun appel réseau, aucun coût.
| Étape de la mission | Vérifié par |
|---|---|
| 1-3 brief, analyse, questions | `analyzeBrief`, `answerQuestions` (question « photographies ? ») |
| 4-5 plan de 7 pages et validation | `createPlan`, `validatePlan` ; seule la porte `validatedPlan` ouvre la suite |
| 6-7 pages et sections | 7 pages en brouillon ; types ⊂ `sections.TYPES` ; identifiants valides ; `normalizeContent` idempotent ; aucun HTML brut |
| 8 design | 2-3 directions, toutes les paires de contraste ≥ seuil, directions différentes, rien modifié avant application |
| 9 contenus | champs natifs seulement, texte manuel conservé et appliqué tel quel ; le garde anti-invention a refusé « garantir » (affirmation non étayée) |
| 10-11 médias | besoin planifié depuis la structure, image de démonstration marquée « visuel d'attente », chemin natif `/uploads/marketing/<org>/site-<id>/…` dans le bandeau |
| 12-14 aperçu, modification locale, régénération ciblée | une demande n'exécute rien avant acceptation ; régénération d'UNE section : seuls ses champs sont proposés, les autres sections sont strictement inchangées |
| 15-18 sauvegarde, rechargement, historique, restauration | état identique relu par un autre contexte ; 2 publications → 2 versions ; la restauration ne supprime pas les versions postérieures |
| 19-20 validation finale et publication de test | contrôles natifs ; publication par `pages.publish` ; refus sans confirmation et sans droit |
**Non couvert par ce test** : rendu navigateur, DNS/domaine réel, fournisseur d'IA réel, pages publiques HTTP (le smoke test de production vérifie seulement la santé et la connexion).

## Scénario boutique (NON réalisable) — voir `KOLAKISA_PROGRAMME21_PRODUCTION_READINESS.md`
Le CMS n'a ni table de produits, ni variantes, ni stocks, ni livraison, ni taxes ; le panier ne vend que des formations. `programme21-international-migrations` assure que le registre le déclare (`boutique` et `catalogue_produits` indisponibles ; `paiement` partiel). Les étapes 1 à 20 du scénario boutique ne peuvent donc pas être exécutées sans inventer des données, ce qui est interdit (prix, stocks, caractéristiques).

## Tests de communication entre moteurs
Plan → pages (`bridge`), design → pages (`appliedLayout`), pages → médias (`aiMedia.plan` lit les sections), médias → pages (`assign` + `saveDraft`), contenus → pages (`apply`), plan/état → publication (`state`, `publishAll`) : exercés dans le scénario et dans `tests/design-generator`, `ai-media`, `programme21-8-ai-builder-http`.
