# KOLAKISA — Sécurité et isolation (boutique IA)

## Isolation (testée, dont par mutation)
Un projet appartient à un site ; `load` filtre par organisation et, pour un accès limité (`ctx.siteScope`), par site. Un membre du site A ne voit ni n'agit sur le projet du site B (liste, état, modification, assistant, application, publication → 403/404), même en visant l'autre site dans l'adresse. Le site d'un projet est celui de la base, jamais celui d'une requête. Le catalogue d'un site n'apparaît pas dans un autre (le moteur filtre par `site_id`). Un accès limité ne peut pas créer de site, et le serveur lui impose le sien.

## Permissions (côté serveur)
`forms.read` lire · `forms.write` brouillons · `shop.write` créer catégories/produits, publier, images · `shop.payments` configuration commerciale et ouverture de la boutique · `appearance.styles` design · `pages.publish` pages. Modules « ia » et « commerce » exigés pour un accès limité. Les boutons masqués ne sont pas un contrôle.

## Secrets et paiements
- **Aucune clé de paiement** ne transite par le constructeur, les consignes IA, les réponses ou la base ; elles sont des variables du serveur. La carte n'est activable que si le serveur est configuré.
- Aucune donnée de carte n'est jamais traitée ici ; aucun système de paiement parallèle ; aucun paiement pendant les tests.
- L'analyse du brief est **à règles** : le texte n'est envoyé à aucun fournisseur. L'IA n'intervient (facultatif) que pour rédiger la fiche produit, avec les faits fournis, et sa sortie est filtrée.

## Contenu non fiable
Tout texte affiché est inséré par `textContent` ; l'état embarqué est échappé. Les sorties de l'IA sont des données : jamais exécutées, bornées, filtrées.

## Non couvert
Limitation de débit propre au constructeur ; journal d'audit dédié (le moteur journalise ses opérations) ; test de charge.
