# Matrice de parité — personnalisation (31/10/2026)

Statuts : **Conforme** (vérifié par test) · **Partiel** · **Absent** · **Autre écran** (couvert par un module distinct). « Preuve » = test exécuté ou lecture du code.

| Fonction (WordPress / Elementor) | Kolakisa | Statut | Preuve |
|---|---|---|---|
| Identité (titre, slogan, logo, icône) | Réglages du site | Conforme | `personnalisateur.test` |
| Couleurs et typographie globales (Design System) | Jetons + palette nommée | Conforme | `personnalisateur-etendu` |
| Valeurs par défaut par type d'élément (Theme Style) | Jetons boutons, images, champs, titres 1-6 | Conforme | idem |
| Aperçu en direct | Cadre de la vraie page, ~290 ms | Conforme | navigateur |
| Brouillon, publication, planification, partage, versions, annuler | Oui | Conforme | `personnalisateur-complet` |
| Responsive (aperçu et valeurs par appareil) | Oui (titres, texte, marges, espacements) | Conforme | idem |
| Contrôles conditionnels | `showIf` | Partiel | — |
| **Dire la portée d'une modification** | Portée globale annoncée à la sélection et à la publication | **Conforme (22.11)** | `personnalisation-ciblee-navigateur` |
| **Modifier un seul élément depuis la sélection** | Lien vers l'éditeur de pages avec l'élément sélectionné | **Conforme pour les nœuds du Page Builder (22.11)** · Absent pour les autres éléments | idem |
| Modification locale d'un widget | Page Builder : styles par nœud, états, points de rupture | Conforme | `personnalisation-ciblee` + tests Page Builder |
| Isolation locale/global | Une règle locale n'écrit que son sélecteur ; autre site inchangé | Conforme | `personnalisation-ciblee` |
| Classes / styles globaux nommés partagés | `settings.classes` (Page Builder) | Conforme | tests Page Builder |
| Header / footer comme modèles avec conditions | Composants globaux + modèles de thème + exceptions par page | Conforme | `theme-builder-serveur` |
| Brouillon + « Mettre à jour » du header/footer | Oui | Conforme | idem |
| Header : logo, menu, boutons, icônes, recherche | Widgets du Page Builder | Partiel (selon widgets) | non rejoué en 22.11 |
| Header collant | Style `position: sticky` du conteneur | Partiel (pas de réglage dédié) | lecture de `nodes.js` |
| Header : variantes mobile / menu mobile | Variantes d'en-tête, menu responsive du widget | Partiel | non rejoué |
| Plusieurs menus indépendants, imbriqués, emplacements | Écran Navigation | Autre écran | `site-menu-*` (échecs navigateur préexistants) |
| Footer colonnes, menus, réseaux, formulaire, copyright | Composant du Page Builder | Partiel | non rejoué |
| Barre d'annonce, fil d'Ariane, barre latérale | — | Non audité / Absent | — |
| Conditions d'affichage lisibles (« pourquoi ») | Route d'explication des modèles | Conforme | `theme-builder-serveur` (T7) |
| Isolation multi-sites des réglages | Par site, côté serveur | Conforme | tests existants |
| Réinitialiser un réglage | Bouton par réglage | Conforme | `personnalisateur` |
