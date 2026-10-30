# Règles de correspondance

| Besoin | Composant(s) natif(s) | Remarques |
|---|---|---|
| hero | `hero` | bouton seulement avec texte ET adresse ; image seulement si fournie |
| intro / text | `text` (+ `image` si fournie) | titre en `##` |
| services / benefits | `features` | 2 à 4 colonnes selon le nombre ; pas d'icônes |
| steps | `list` | |
| pricing | `features` (alternative) | **manquant** : tableau de tarifs |
| gallery | `image` ×n (alternative) | **manquant** : galerie/grille/agrandissement ; sans image : ignorée |
| testimonials | `testimonials` | sans témoignage fourni : texte d'exemple signalé, jamais un faux témoignage |
| faq | `faq` | |
| contact | `text` + `form` (+ `button`) | le formulaire doit être associé à la page avant publication |
| cta | `cta` | sans bouton complet : ignorée |
| video | `video` | sans adresse https : ignorée |
| listing | `course` ×n (formations publiées) sinon `text` (alternative) | **manquant** : produits, biens immobiliers, articles dynamiques |
Types de pages non générés : ceux dont l'inventaire exige une fonctionnalité absente (boutique, catalogue de produits, fiche produit, panier…).
