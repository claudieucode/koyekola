# KOLAKISA — Validation avant publication

`validation.validate` lit le **catalogue et la configuration réels**. Niveaux : **error** (bloquant) · **warning** · **missing** (information manquante) · **ok** · info.

| Contrôle | Bloquant quand |
|---|---|
| Module Commerce | non activé |
| Produits | aucun produit |
| Variantes | produit variable sans aucune variante |
| Paiement | aucun moyen **utilisable** (carte non configurée, rien d'activé) |
| Livraison | produits physiques sans zone, ou zone sans méthode |
| Taxes | activées sans règle |
| Parcours d'achat | paiement, livraison ou produit publié manquant |
| Avertissements | pages obligatoires non créées, politiques à relire, prix nul, images/descriptions manquantes, stock non géré, devise non testée, paiement manuel |
| Information | version mobile (non vérifiable automatiquement), boutique ouverte ou non |

**« Prête à vendre »** = aucune erreur **et** au moins un produit publié. Le parcours d'achat est déclaré prêt d'après la **configuration** : **aucune commande d'essai n'est passée** (aucun paiement réel pendant les tests ni par le constructeur).

## Publication guidée (`project.publish`)
1. Contrôles bloquants hors produits : s'il en reste, **rien n'est modifié** (422).
2. Publie les produits en brouillon qui passent : prix > 0, description non vide et sans « [à compléter] » ; les autres sont refusés avec la raison.
3. Publie les pages éditoriales créées (droit `pages.publish`).
4. **Ouvre la boutique seulement si demandé**, si la personne a le droit « paiements » et s'il ne reste aucune erreur. Un refus est listé, jamais silencieux.
