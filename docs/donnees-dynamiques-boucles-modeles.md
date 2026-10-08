# Données dynamiques, boucles, classes globales, modèles de thème (éditeur de pages)

Fonctions ajoutées le 8 octobre 2026. Tout est natif à KOLAKISA, validé côté serveur, enregistré dans le document, rendu à
l'identique dans le canevas, l'aperçu et la page publiée, et couvert par des tests (voir `ELEMENTOR_IMPLEMENTATION_TEST_REPORT.md`).

## 1. Étiquettes dynamiques
- Écriture : `{{post.title}}`, `{{course.price}}`, `{{user.first_name | fallback: ami}}`. Bouton **{ }** à côté des champs
  (titre, texte du bouton, adresses, image dynamique, texte de remplacement…) pour insérer une donnée sans la taper.
- Sources : article (`post.title|excerpt|url|image|date|author|category|reading_time`), formation (`course.*`, aussi `product.*` :
  `title|subtitle|description|price|url|image|category|instructor`), visiteur (`user.first_name|logged_in|cart_count`),
  `page.title`, `site.name|url`, `date.today|year`, adresse (`query.q`, `query.categorie`).
- Filtres : `fallback: texte` (si vide), `upper`, `lower`, `capitalize`, `truncate: 40`, `prefix: "texte "`, `suffix: " texte"`.
- **Sécurité** : une étiquette ne produit jamais de HTML (la valeur est échappée). Dans une adresse ou une image, la valeur
  résolue est revalidée (https://, page du site, médiathèque) ; sinon le champ reste vide. Pas d'étiquette dans les styles CSS
  (fond d'image) : refusé. Une étiquette inconnue ou qui échoue donne une valeur vide (jamais une erreur).
- Écriture directe dans la page : refusée sur un contenu dynamique (elle effacerait l'étiquette) ; on modifie dans le panneau.
- Extension : `registerDynamicSource("groupe.nom", { label, kind, resolve(scope) })` (`src/marketing/pages/dynamic.js`).

## 2. Boucles
Grille › « Répéter pour chaque article ou formation (boucle) ». Les éléments de la grille sont le **modèle** d'un résultat ;
la page en montre un par résultat. Réglages : source (articles / formations), nombre (1–24), ordre, catégorie, pagination
(`?lp-<id>=2`), filtrage par l'adresse (`?q=` recherche, `?categorie=`), message sans résultat. Le filtre par catégorie est un
élément (Filtre par catégorie). Seuls les contenus publiés apparaissent. Les liens comptés gardent le bon résultat d'une page à l'autre.

## 3. Classes globales
Avancé › CSS, classes et attributs › **Classes globales du site** : créer une classe depuis les réglages propres d'un élément,
l'appliquer (case à cocher) à d'autres éléments, « Mettre à jour la classe » (tous les éléments suivent), supprimer.
Stockées dans les réglages du site (`settings.classes`, 40 au plus). Le style propre d'un élément l'emporte sur la classe.

## 4. Modèles de thème
Site Web › **Modèles de thème** : une page publiée devient le modèle de l'**article du blog**, de la **liste du blog** (accueil
et catégories) ou de la **page introuvable (404)**. Conditions : catégorie, public (connectés, clients, abonnés, étiquette…).
Le plus précis gagne. Élément « Contenu de l'article » pour le texte. Le sommaire, l'auteur, la navigation, les commentaires
et le référencement (données structurées, canonique) du blog sont conservés. Sans modèle **en ligne**, ou si le rendu échoue,
l'affichage d'origine reste. Affectations : réglage `theme.templates` de l'organisation (aucune migration).

## 5. Conditions d'affichage ajoutées
Panier non vide / vide, formateur connecté, paramètre d'adresse (`campagne=printemps`). Extension : `registerCondition`.

## Limites assumées
Pas de modèle de fiche formation, de résultats de recherche ni de pages auteur / étiquette distinctes ; pas de carrousel de
boucle ; pas de champs personnalisés ni de variables libres ; pas de JavaScript libre (sécurité) ; `registerControl` et
`registerExtension` non construits.
