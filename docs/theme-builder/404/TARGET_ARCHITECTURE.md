# Architecture cible — nouvelle bibliothèque « Page 404 »

> Proposition, rien n'est implémenté. Principe directeur : **réutiliser le moteur existant** (catalogue en code, « Utiliser » = copie, résolution par conditions, rendu par `renderRegion`), ne créer aucun moteur concurrent.

## 1. Structure du catalogue
- Remplacer la combinaison « 20 archétypes × 5 traitements » (`not_found.js`) par **100 définitions indépendantes**, une par concept, regroupées par famille dans des fichiers (`catalog/not_found/<famille>.js`) et assemblées par un index qui garde la même interface : `entries()` → `{key, name, desc, tags, family, build}`.
- **Clé** : `<famille>-<nom>` conforme à l'expression existante `[a-z0-9.-]{3,80}` ; identifiant lisible `404-001`…`404-100` stocké comme métadonnée.
- Métadonnées par modèle : famille, concept, vecteur de diversité (8 axes du plan), fonctionnalités (recherche, jeu, boutique…), modules requis (blog, boutique, LMS), compatibilité mouvement réduit.
- `list()` : ajouter le **filtre par famille** et le **tri** (nom, famille) ; garder recherche texte, identité, mise en page.

## 2. Rendu
- Aucun changement du moteur de rendu : le modèle reste une page-modèle rendue par `renderRegion` dans le gestionnaire final. Le statut 404 reste posé par le routage, jamais par le modèle.
- **Médias** : widgets existants `image`, `video`, `lottie`, `motion*`. Illustrations = **SVG vectoriels écrits pour Kolakisa** (pas de ressources externes). Photos/vidéos = emplacements remplaçables avec repli sans image (voir risque R6).
- **Jeux** : petit script autonome (aucune dépendance, clavier + pointeur, `prefers-reduced-motion` respecté, aucun appel réseau, aucune donnée collectée) injecté via le widget `html`/`embed`, sans contourner la politique de sécurité du site.
- **Dynamique** : `posts`, `querylist`, `courselist`, `shopgrid`, `search` ; si le module n'est pas actif ou vide → message propre ou bloc masqué, jamais de contenu inventé.

## 3. Données, conditions, multi-sites (inchangés)
- « Utiliser » crée une **copie indépendante** (page-modèle + modèle brouillon) ; remplacer le catalogue ne modifie aucune 404 déjà utilisée.
- Conditions d'affichage, priorité (score, récent, id), exclusions, isolation par `req.kwSite` : **inchangées**.

## 4. Décision d'architecture à valider : cohérence de la 404 sur toutes les erreurs de contenu
Aujourd'hui seul le gestionnaire final utilise le modèle. Les 404 émises par les routes (article, produit, brouillon, boutique fermée…) rendent l'erreur simple. Deux options :
- **A (recommandée)** : router ces cas vers le même rendu de modèle en gardant le **statut 404** et les en-têtes noindex. Un seul point de vérité ; résultat cohérent pour les visiteurs ; risque : toucher à `blog.js`, `shopPublic.js`, `landingPublic.js` (fichiers partagés sensibles).
- **B** : ne rien changer au routage, documenter la limite. Aucun risque, mais deux designs de 404 selon l'adresse.
Cette décision **n'est pas prise ici** ; elle doit être validée avant la phase 6 de la feuille de route.

## 5. Outils de contrôle de la diversité
- Script de **signature de composition** (arbre de types, imbrication, grilles) sur les modèles construits ; comparaison par paires avec les seuils du plan (≥ 5 axes sur 8, ≥ 3 structurels sur 6 pour les axes décrits ; pour les signatures réelles : distance d'arbre minimale à définir au premier groupe) ; échec du test si une paire est trop proche.
- Rapport visuel par modèle (captures à 1440 / 1024 / 820 / 390 px) comparant **vignette, aperçu, éditeur et rendu publié**.

## 6. Ce qui n'est pas touché
En-tête, pied de page, page individuelle, article, archive, résultats de recherche, e-commerce, éditeur de pages (hors besoins signalés), autres catégories du Theme Builder.
