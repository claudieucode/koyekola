# FAQ — audit et refonte

## État initial
Table `faqs` (questions générales `course_id` vide, ou propres à une formation), page publique `/faq` (liste plate en accordéon natif `<details>`, données structurées FAQPage), questions d'une formation sur sa fiche, administration `/formateur/faq` et `/formateur/cours/:id/faq` limitée à **ajouter** et **supprimer**.
Défauts : pas de modification, d'ordre, de brouillon, de catégories ni de recherche ; erreur de saisie = page d'erreur et saisie perdue ; **la suppression ne vérifiait pas le propriétaire** (un formateur pouvait supprimer une question de la formation d'un autre) ; confirmation par `onsubmit` en ligne et styles en ligne.
Ce qui n'existe pas : rattachement à un site (la FAQ appartient à la plateforme de formation et à ses formations ; les FAQ du CMS marketing sont des blocs d'accordéon de pages, un autre mécanisme, non touché).

## Changements
- **Données** : 2 colonnes ajoutées (`category` vide par défaut, `published` à 1 par défaut) : tout l'existant reste publié et sans catégorie ; aucune migration destructive (ajout au démarrage, comme les autres colonnes).
- **Service** `src/services/faqs.js` : validation par champ, création, modification, publication, déplacement transactionnel, suppression, périmètre (`canManage`). Les lectures publiques ne renvoient que les questions **publiées** (page, fiche formation, données structurées).
- **Administration** : modifier, publier/dépublier, monter/descendre, catégorie (suggestions), erreurs par champ avec saisie conservée, confirmation de suppression, messages lus une fois, lien « voir sur le site ». Questions d'une formation : modifiables seulement par son formateur (404 sinon, sans révéler l'existence).
- **Page publique** : introduction, recherche (à partir de 6 questions) sans accents ni casse, catégories avec compteurs, « tout déplier / replier », lien direct vers chaque question (`#faq-n`, ouvre la question), état aucun résultat avec réinitialisation, annonce du nombre de résultats, lien vers le support. Tout est dans la page (aucune requête) ; sans JavaScript, c'est l'accordéon natif complet. L'état se garde dans l'adresse (`?q=`, `?cat=`).
- **Mouvement** : apparition de 180 ms de la réponse ouverte (opacité/translation), désactivée avec « réduire les animations ».

## Sécurité et SEO
Contenu neutralisé (question, catégorie, réponse Markdown sans script ni `javascript:`) testé en public et en administration. Données structurées = uniquement les questions publiées et visibles. Titre, description et fil d'Ariane inchangés.

## Limites
Pas de rattachement par site ; pas de prévisualisation d'un brouillon (le lien ouvre la page publique, où il n'apparaît pas) ; réponses en Markdown (pas d'éditeur riche) ; ordre par boutons (pas de glisser-déposer) ; catégories uniquement pour les questions générales.
