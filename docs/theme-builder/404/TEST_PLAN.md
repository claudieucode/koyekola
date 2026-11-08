# Plan de tests — Page 404

Principe : **un test = un fait vérifié dans l'application réelle** (serveur de test + navigateur). Rien n'est déclaré « fonctionnel » sans exécution. Outils existants : `node --test`, Playwright/Chrome, serveur de test à deux sites (voir `tests/theme-builder-404-bibliotheque.test.js`).

## 1. Bibliothèque
- Exactement 100 modèles ; identifiants `404-001`…`404-100` uniques ; clés conformes à `[a-z0-9.-]{3,80}` ; noms uniques.
- Famille, description, vignette et métadonnées présentes pour chacun ; répartition par famille conforme au plan.
- **Diversité** (voir §2).
- Aucun lien factice : les liens internes pointent vers des pages standard ou des chemins du site ; aucun produit/article inventé.

## 2. Diversité (portes automatiques)
Sur les **documents construits** (pas seulement le plan) :
1. signature d'arbre (types, imbrication, grilles, nombre de colonnes, présence de média/animation/jeu) pour chaque modèle ;
2. distance par paires ; échec si une paire est sous le seuil (seuils du plan : ≥ 5 axes/8 et ≥ 3 structurels/6 sur les axes mesurables ; seuil de signature d'arbre fixé sur le premier groupe) ;
3. répartition : aucune composition au-delà de ~15 % des modèles ; au moins 12 compositions de premier niveau distinctes ;
4. rapport de la matrice (voisin le plus proche par modèle) généré et conservé.

## 3. Fonctionnement
Insertion (« Utiliser »), modification de chaque type d'élément, duplication, suppression, enregistrement, rechargement, aperçu, publication, remplacement par un autre modèle (aucun résidu), recherche (pages, articles, produits si boutique active, cours si LMS actif, résultats vides), boutons, liens, formulaires (réception réelle), recommandations dynamiques (avec et sans données), jeux (clavier, pointeur, fin de partie).

## 4. HTTP et SEO
- URL inexistante : **404** sur site principal et sur un domaine de site, pour **chacun des 100 modèles publiés** (échantillon complet en tests longs).
- URL existante : 200 normal ; page brouillon : 404 ; article/produit supprimé : 404 ; ancienne adresse : 301 ; redirection gérée : 301/302/410 ; URL mal formée : jamais 500.
- Aucun 200 contenant le texte du modèle 404 ; aucune redirection automatique vers l'accueil.
- `noindex` (balise et en-tête) ; sitemap sans URL inconnue ni page-modèle ; canonical (à vérifier, aujourd'hui non confirmé).
- Statut conservé quand le modèle échoue à s'afficher (repli sur l'erreur neutre, toujours 404).

## 5. Responsive et visuel
1440, 1280, 1024, 820, 390 (et 320) : pas de défilement horizontal, pas de texte coupé, pas de chevauchement, images non déformées, boutons ≥ 44 px au tactile ; **comparaison vignette ↔ aperçu ↔ éditeur ↔ publié** par modèle ; rapport visuel JSON + captures.

## 6. Accessibilité et performance
Un seul `h1` ; contrastes ; navigation clavier ; jeux jouables au clavier ; `prefers-reduced-motion` coupe les animations et les jeux animés ; poids de page et absence de ressource externe ; pas d'animation sur une propriété de mise en page (charte du projet).

## 7. Multi-sites
Deux sites : 404 de A jamais servie sur B ; affectations, conditions, médias et réglages indépendants ; permissions (publier = droit existant) ; remplacement sur A sans effet sur B.

## 8. Non-régression
Header, footer, single page, single post, archive, search results, e-commerce, Theme Builder, éditeur de pages ; tests existants de `tests/header-*`, `tests/footer-*`, `tests/isolation-*` avant tout envoi (consigne du dépôt).

## 9. Baseline connue (2026-11-08)
Sur `main` : 77 tests de référence, 75 réussis, **2 échecs préexistants** (voir KOLAKISA_EXISTING_ARCHITECTURE.md §6). Le premier est à corriger à l'étape 1 ; le second concerne l'en-tête (hors périmètre, à signaler).
