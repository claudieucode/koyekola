# Theme Builder — validation des propriétés (matrice)

Mesure : vrai Chrome, styles calculés (`getComputedStyle`), test `tests/theme-builder-proprietes-rendu.test.js` (6/6 réussis ; 0/6 avant correction). Le parcours est identique pour chaque catégorie : réglage → canevas (rendu du brouillon) → enregistrement → rechargement (relecture du brouillon) → publication → site public sur domaine réel → un second site n'est pas affecté. Les mêmes valeurs sont vérifiées à chaque étape.

| Catégorie | Propriété testée | Canvas | Sauvegarde | Rechargement | Site publié | Résultat |
|---|---|---|---|---|---|---|
| En-tête | Titre : couleur, police, taille, espacement des lettres, taille tablette | OK | OK | OK | OK | Validé |
| En-tête | Texte : couleur, taille, interligne | OK | OK | OK | OK | Validé |
| En-tête | Lien : police, couleur | OK | OK | OK | OK | Validé |
| En-tête | Bouton : police, couleur, fond, arrondi | OK | OK | OK | OK | Validé |
| En-tête | Conteneur : fond, marge interne | OK | OK | OK | OK | Validé |
| En-tête | Élément imbriqué : couleur, police | OK | OK | OK | OK | Validé |
| En-tête | Masqué sur mobile | OK | OK | OK | OK | Validé |
| Pied de page | Titre : couleur, police, taille, espacement des lettres, taille tablette | OK | OK | OK | OK | Validé |
| Pied de page | Texte : couleur, taille, interligne | OK | OK | OK | OK | Validé |
| Pied de page | Lien : police, couleur | OK | OK | OK | OK | Validé |
| Pied de page | Bouton : police, couleur, fond, arrondi | OK | OK | OK | OK | Validé |
| Pied de page | Conteneur : fond, marge interne | OK | OK | OK | OK | Validé |
| Pied de page | Élément imbriqué : couleur, police | OK | OK | OK | OK | Validé |
| Pied de page | Masqué sur mobile | OK | OK | OK | OK | Validé |
| Article seul | Titre : couleur, police, taille, espacement des lettres, taille tablette | OK | OK | OK | OK | Validé |
| Article seul | Texte : couleur, taille, interligne | OK | OK | OK | OK | Validé |
| Article seul | Lien : police, couleur | OK | OK | OK | OK | Validé |
| Article seul | Bouton : police, couleur, fond, arrondi | OK | OK | OK | OK | Validé |
| Article seul | Conteneur : fond, marge interne | OK | OK | OK | OK | Validé |
| Article seul | Élément imbriqué : couleur, police | OK | OK | OK | OK | Validé |
| Article seul | Masqué sur mobile | OK | OK | OK | OK | Validé |
| Archive | Titre : couleur, police, taille, espacement des lettres, taille tablette | OK | OK | OK | OK | Validé |
| Archive | Texte : couleur, taille, interligne | OK | OK | OK | OK | Validé |
| Archive | Lien : police, couleur | OK | OK | OK | OK | Validé |
| Archive | Bouton : police, couleur, fond, arrondi | OK | OK | OK | OK | Validé |
| Archive | Conteneur : fond, marge interne | OK | OK | OK | OK | Validé |
| Archive | Élément imbriqué : couleur, police | OK | OK | OK | OK | Validé |
| Archive | Masqué sur mobile | OK | OK | OK | OK | Validé |
| Résultats de recherche | Titre : couleur, police, taille, espacement des lettres, taille tablette | OK | OK | OK | OK | Validé |
| Résultats de recherche | Texte : couleur, taille, interligne | OK | OK | OK | OK | Validé |
| Résultats de recherche | Lien : police, couleur | OK | OK | OK | OK | Validé |
| Résultats de recherche | Bouton : police, couleur, fond, arrondi | OK | OK | OK | OK | Validé |
| Résultats de recherche | Conteneur : fond, marge interne | OK | OK | OK | OK | Validé |
| Résultats de recherche | Élément imbriqué : couleur, police | OK | OK | OK | OK | Validé |
| Résultats de recherche | Masqué sur mobile | OK | OK | OK | OK | Validé |
| 404 | Titre : couleur, police, taille, espacement des lettres, taille tablette | OK | OK | OK | OK | Validé |
| 404 | Texte : couleur, taille, interligne | OK | OK | OK | OK | Validé |
| 404 | Lien : police, couleur | OK | OK | OK | OK | Validé |
| 404 | Bouton : police, couleur, fond, arrondi | OK | OK | OK | OK | Validé |
| 404 | Conteneur : fond, marge interne | OK | OK | OK | OK | Validé |
| 404 | Élément imbriqué : couleur, police | OK | OK | OK | OK | Validé |
| 404 | Masqué sur mobile | OK | OK | OK | OK | Validé |

## Catégories non couvertes par le test de bout en bout

| Catégorie | Statut |
|---|---|
| Page seule (single_page) | Même moteur de rendu que l'article ; **non mesuré séparément** dans ce test |
| Fiche produit / Archive produits | Même moteur ; **non mesurés** (nécessitent la boutique) |
| Barre latérale, Personnalisé | Même moteur ; **non mesurés** |

## Audit par type d'élément (`scripts/audit-proprietes.js`)

7 propriétés de texte (couleur, police, taille, graisse, espacement des lettres, interligne, casse) réglées sur chaque type d'élément et mesurées sur chaque texte visible. Résultats détaillés dans le rapport de fonctionnalité.

Cas connus, voulus : le bouton interne du widget Recherche garde sa couleur et sa graisse (réglables via sa partie « bouton »).
