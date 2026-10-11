# Score de parité — méthode, résultats, incertitudes (palier 23)

*Calculé par `audit-parite/generer.js` sur 182 capacités (4 « non applicables » exclues).*

## Méthode

1. **Une capacité = une ligne** de la matrice (`01-matrice-parite.md`). Chaque statut est fondé sur une preuve citée (suite automatisée relancée, sonde d'audit, ou lecture du code).
2. **Pondération par catégorie** : essentielle ×3 · sécurité/données ×3 · avancée ×2 · administration ×2. Les capacités « propres à KOLAKISA » (E) ne comptent pas dans la parité WordPress ; elles ont leur propre note d'intégration. Les « non applicables » sont exclues du calcul, avec leur raison.
3. **Points par statut** — trois lectures, pour montrer l'incertitude au lieu de la cacher :

| Statut | Strict | Central | Optimiste |
|---|---|---|---|
| COMPLÈTE ET VALIDÉE | 1 | 1 | 1 |
| PARTIELLE | 0 | 0.5 | 0.75 |
| PRÉSENTE MAIS NON VALIDÉE | 0 | 0.5 | 1 |
| DOUBLON | 0 | 0.5 | 1 |
| BUGUÉE | 0 | 0.25 | 0.5 |
| DÉCORATIVE / NON FONCTIONNELLE | 0 | 0 | 0.25 |
| ABSENTE | 0 | 0 | 0 |

   - **Strict** : seul ce qui est validé compte (une fonction « présente mais non validée » vaut 0).
   - **Central** : valeur de référence pour décider.
   - **Optimiste** : si tout ce qui n'est pas validé s'avérait bon.
4. **Une fonctionnalité non testée n'est jamais comptée comme validée** (statut NV, ou test « D »).
5. **Les scores ne sont pas des pourcentages de « qualité » du produit** : ils mesurent, parmi les capacités retenues, la part livrée et prouvée, selon une liste de capacités que j'ai choisie. Une autre liste donnerait un autre chiffre. Les nombres ci-dessous valent pour **cette liste**.

## Répartition des statuts (182 capacités)

| Statut | Nombre |
|---|---|
| COMPLÈTE ET VALIDÉE | 119 |
| PARTIELLE | 23 |
| PRÉSENTE MAIS NON VALIDÉE | 6 |
| DÉCORATIVE / NON FONCTIONNELLE | 2 |
| BUGUÉE | 0 |
| ABSENTE | 24 |
| DOUBLON | 4 |
| NON APPLICABLE | 4 |

## Résultats par dimension

| Dimension | Capacités | Strict | Central | Optimiste |
|---|---|---|---|---|
| Parité fonctionnelle (catégories A, B, C hors sécurité/UX/performance) | 125 | 73 % | **80 %** | 85 % |
| Sécurité et gestion des données (catégorie D + domaine Sécurité) | 30 | 67 % | **77 %** | 83 % |
| Fiabilité opérationnelle (persistance, historique, import/export, sauvegardes) | 16 | 66 % | **74 %** | 80 % |
| Expérience utilisateur et accessibilité | 9 | 56 % | **67 %** | 81 % |
| Performance | 4 | 25 % | **50 %** | 63 % |
| Intégration entre modules KOLAKISA (hors comparaison WordPress) | 10 | 80 % | **90 %** | 98 % |

**Couverture des tests** : 141 capacités sur 178 (79 %) s'appuient sur au moins un test automatisé ou une sonde d'audit. Parmi les capacités classées « validées », 99 % ont un test automatisé ou une sonde derrière elles (les autres : voir la colonne Test = D, qui ne donne jamais « validée »).

## Par domaine (parité fonctionnelle, lecture centrale)

| Domaine | Capacités | V | P/NV | A/D/B/DB | Central |
|---|---|---|---|---|---|
| Pages | 20 | 16 | 2 | 2 | 88 % |
| Page Builder | 16 | 11 | 3 | 2 | 83 % |
| Articles | 19 | 13 | 1 | 5 | 75 % |
| Taxonomies | 8 | 6 | 1 | 1 | 86 % |
| Médiathèque | 10 | 7 | 0 | 3 | 75 % |
| Commentaires | 9 | 5 | 0 | 4 | 63 % |
| Navigation | 7 | 5 | 1 | 1 | 89 % |
| Apparence | 7 | 4 | 2 | 1 | 79 % |
| Utilisateurs | 9 | 7 | 0 | 2 | 77 % |
| Révisions | 5 | 3 | 0 | 2 | 67 % |
| SEO | 8 | 7 | 1 | 0 | 95 % |
| URL | 6 | 5 | 1 | 0 | 94 % |
| Outils | 8 | 4 | 3 | 1 | 68 % |
| Paramètres | 8 | 5 | 2 | 1 | 81 % |
| Sécurité | 12 | 7 | 5 | 0 | 79 % |
| UX | 9 | 5 | 2 | 2 | 67 % |
| Performance | 4 | 1 | 2 | 1 | 50 % |
| API et extensibilité | 3 | 0 | 2 | 1 | 33 % |

## Incertitudes et limites

- La **liste de capacités est un choix** : j'ai retenu ce qui existe dans le périmètre CMS annoncé et ce qu'un CMS professionnel attend. Toute capacité oubliée n'est pas comptée.
- 6 capacités sont « présentes mais non validées » : leur valeur réelle est inconnue (c'est ce qui sépare le strict de l'optimiste).
- Les tests Chrome ont été relancés **fichier par fichier** (68 fichiers sur 94) ; 26 fichiers n'ont pas été relancés dans cet audit. Les suites automatisées citées sont celles de la branche principale au moment de l'audit.
- Les mesures de performance viennent d'une machine de développement chargée avec une base de test : elles donnent un ordre de grandeur, pas une garantie de production.
- Le comportement de la **production** n'a été sondé qu'en lecture (en-têtes, robots.txt, sitemap). Aucune donnée de production n'a été modifiée.
- **Indépendance limitée** : la plupart des capacités « validées » s'appuient sur les suites de tests écrites pendant les paliers précédents, par la même équipe (moi compris). Je les ai relancées et recoupées par mes propres sondes (permissions, SEO publié, scénarios, navigateur), mais ce n'est pas un audit externe : un test qui oublierait un cas l'oublie aussi ici.
- Le score n'est pas comparable à un score WordPress : WordPress a des milliers d'extensions ; la comparaison porte sur les capacités du cœur et sur celles qu'un site professionnel attend.
