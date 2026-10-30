# Content Quality Validator

## Principe
Chaque constat a une **gravité** (`critical`, `important`, `improve`, `suggestion`) et un indicateur **`certain`** : vrai pour ce qui est mesuré (longueur, donnée inventée, mot interdit, mot doublé), faux pour ce qui est probable (langue, style, répétition d'attaque, ton). `summary` renvoie des **comptes** par gravité et certain/probable : **aucune note de qualité** (elle ne serait pas une mesure objective).

## Contrôles par champ (`validate.checkField`)
vide · dépassement de longueur (critique) · espace réservé restant (important) · donnée inventée retirée (critique, *résolue*) · affirmation non étayée (critique) · mot doublé · espaces multiples · typographie française (espace avant `; : ! ?`, suggestion) · ponctuation répétée · mots en majuscules · langue apparente différente (probable) · mots à éviter (voix) · tutoiement/vouvoiement (probable) · phrase trop longue (probable) · titre ou bouton trop long (suggestion).
## Contrôles d'ensemble (`checkSet`)
phrase identique dans deux champs (important, certain) · trois textes commençant par les mêmes mots · mot sur-utilisé (≥ 6 occurrences et > 5 % du texte) · cohérence SEO de la page (voir SEO).

## Effets
- **Critique non résolu** → l'ensemble ne peut pas être *accepté*, et le champ concerné n'est pas appliqué.
- Critique *résolu* (donnée remplacée par un espace réservé) → ne bloque plus ; l'espace réservé reste signalé (*important*) jusqu'à remplacement.
- Un texte écrit ou modifié par une personne n'est pas soumis à la garde des faits (elle est sa source) mais reste soumis aux contrôles de forme.

## Limites
**Pas de correcteur orthographique ni grammatical** : seules les fautes mécaniques sont détectées. La cohérence sémantique avec les informations fournies n'est vérifiée que par la garde (chiffres, contacts, affirmations). La pertinence et le ton restent à juger par une personne.
