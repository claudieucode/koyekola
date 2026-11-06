# Publication unique — rapport de tests

## Exécutés et réussis
| Fichier | Tests | Ce qui est vérifié |
|---|---|---|
| `tests/single-post-moteur.test.js` (moteur pur) | 19/19 | valeurs d'origine et stockage compact ; bornes de chaque champ ; refus strict (choix, nombre, couleur, police, élément inconnu) ; titre jamais masqué ; éléments manquants rétablis ; 4 côtés et appareils ; défauts de thème < site ; CSS (espacements, typographie par appareil, couleurs, bordures, ombres) ; ombre limitée aux images du contenu ; aucune balise dans le CSS ; largeur personnalisée ; image proportionnée ; temps de lecture réel (hors code/scripts/légendes/tableaux, vitesse, texte, fourchette, multilingue, vide) ; métadonnées sans séparateur orphelin ; liens de partage réels ; similaires (jamais l'article lu, doublons, pertinence, exclusions, ordre, état vide) ; dates. |
| `tests/single-post-serveur.test.js` (vrai serveur) | 10/10 | page d'origine inchangée sans réglage ; valeurs invalides refusées ; **aperçu** (brouillon visible seulement par la personne, public inchangé) ; **publication** (colonne, conteneur, largeur, ordre des éléments, séparateur, temps de lecture, partage, similaires, navigation, boîte d'auteur) ; stockage **par site** (principal / site A / site B isolés, réglage d'un portée refusé sur l'autre) ; zone de titre désactivée (H1 conservée) ; article sans image ; chargement automatique (configuration, plafond, dernier article) ; navigation dans la catégorie ; réinitialisation (rien de stocké). |
| Non-régression | 100/100 | `blog-comments`, `blog-editorial`, `etape3-blog`, `blog-hub`, `cms-articles` (page d'article, commentaires, partage, en-tête) ; avant : `personnalisateur-complet`, `marketing-migrations-figees` (63/69 → les 6 échecs étaient des classes/liens renommés par erreur et un chemin d'inclusion ; corrigés, voir ci-dessous). |

## Défauts trouvés par ces tests et corrigés
- Commentaires invisibles : l'inclusion `_comment` n'était pas résolue depuis le sous-dossier `sp/`.
- Noms de classes et lien X d'origine (`article-category`, `post-title`, `x.com/intent/post`) modifiés par erreur : restaurés (les réglages s'accrochent désormais sur ces noms).
- Couleur d'ombre : valeur d'origine perdue quand le champ était absent.

## NON exécuté (à dire clairement)
- **Test en navigateur du panneau** (onglets, vignettes, glisser-déposer, champs 4 côtés, valeurs par appareil) : le code est écrit et syntaxiquement valide, **non vérifié visuellement**.
- **Test navigateur du chargement automatique** (défilement réel, historique) : seulement la configuration et le script servis sont testés.
- **Vérification visuelle 1280 / 820 / 390** de la page d'article personnalisée : non faite.
- Mesures de performance, accessibilité automatisée.
- Aperçu pour un **site secondaire** : l'aperçu du Customizer d'un site ne propose pas d'article (les pages d'article d'un site se voient sur son domaine) ; la publication fonctionne.
