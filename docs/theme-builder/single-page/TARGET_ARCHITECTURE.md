# Architecture cible Page individuelle — dont l'indépendance graphique

**Aucun nouveau moteur de rendu ni de widgets.** On réutilise : catalogue en code, kit, grammaire fermée, `render.js`, conditions, Page Builder, bibliothèque de polices locale. Cause du problème : voir `STYLE_INHERITANCE_AND_OVERRIDES.md` (99 modèles sur 100 écrits en jetons du site).

## 1. Décision n° 1 — cadre ou page complète (inchangée)
Recommandé : **cadre riche** autour du `postcontent` (ouverture, bandes, colonnes latérales, conclusion propres à chaque usage), pour ne pas doubler la bibliothèque de pages complètes du Page Builder. Alternative B (page complète dans le modèle) rejetée : doublon et écrasement du contenu de la page.

## 2. Décision n° 2 — comment porter une identité propre
| Option | Principe | Avantages | Limites |
|---|---|---|---|
| **A. Valeurs fixes (modèle des en-têtes/pieds de page)** | Chaque modèle écrit ses couleurs en hexadécimal et ses polices en `font.<id>` ; aucune dépendance au site | Déjà éprouvé en production sur 200 modèles ; aucun changement de moteur ; indépendance totale garantie | Pas de bascule « suivre le site » automatique |
| **B. Jetons de modèle (recommandée)** | Le modèle porte une **identité** (palette, polices, rayons, boutons) dans son document ; les éléments référencent des jetons *du modèle* (`tpl:…`) résolus par des variables CSS posées sur la racine du modèle : valeurs fixes en mode **indépendant**, `var(--kw-…)` du site en mode **hérité** | Une seule bascule change tout le modèle sans réécrire les éléments ; le retour au mode indépendant restitue exactement les valeurs ; édition d'identité en un endroit | Demande d'étendre la validation des couleurs/polices (`nodes.js`), l'éditeur de couleurs et l'export/import ; chantier plus lourd |
| C. Conversion à la demande | Boutons « adopter l'identité du site » / « restaurer l'identité du modèle » qui **réécrivent** les valeurs des éléments (hex ↔ jetons) à partir d'une table d'association stockée avec le modèle | Aucun nouveau type de valeur ; implémentable côté serveur | Réécriture massive du document ; risque de perte si l'utilisateur a modifié des valeurs entre-temps |
Recommandation : **A pour les 100 modèles de la bibliothèque** (indépendance dès l'insertion, sans risque), **B comme évolution** pour la bascule volontaire ; **C** seulement en secours. Le choix B/C est une décision à valider avant l'étape 4.

## 3. Structure de l'identité d'un modèle (option B)
```
document.identity = {
  mode: "own" | "site",              // indépendant ou hérité
  own:  { colors: {bg, ink, mute, alt, accent, onAccent, line}, fonts: {heading: "font.x", body: "font.y"},
          radius, buttonRadius, shadow, spacing, buttonStyle },
  map:  { bg: "background", ink: "text", accent: "primary", ... }   // correspondance vers les jetons du site pour le mode « site »
}
```
Racine du modèle : `--tpl-bg`, `--tpl-ink`… définies d'après `mode`. Valeurs posées directement sur un élément par l'utilisateur : toujours prioritaires et jamais touchées par la bascule.

## 4. Priorité des styles (documentée, testée)
1. Valeur de l'utilisateur sur l'élément → 2. identité du modèle (mode indépendant) → 3. jetons du site (mode hérité ou valeur vide) → 4. défauts du moteur.
Pas de `!important`. Les feuilles de thème (packs) passent dans une **couche CSS inférieure** (`@layer`), le CSS des éléments dans une couche supérieure ; le CSS de l'administration n'est jamais chargé dans le rendu public. Pour le mode indépendant, la racine du modèle déclare ses propres valeurs de base de texte (police, taille, interligne) afin de ne pas hériter de `.lp-site`.

## 5. Polices et ressources
Bibliothèque locale uniquement (1 775 polices libres, servies par le site, aucun service tiers) ; `fontFacesFor` ne charge que les polices utilisées ; maximum 2 polices par modèle ; poids limités à ceux utilisés ; préchargement des deux premières ; valeurs de repli système. Aucune police propriétaire ni image de place de marché.

## 6. Insertion, sauvegarde, export
« Utiliser » copie le document **avec son identité** ; rechargement, aperçu, publication, export et import la conservent (elle est dans le document). La migration des 100 anciens modèles ne les touche pas : ce sont des copies indépendantes dans les sites ; le catalogue seul change.

## 7. Autres décisions
* Construction de chaque modèle : un fichier de mise en page par concept, jamais d'assemblage de pièces communes.
* Champs personnalisés de page : non créés (aucun stockage aujourd'hui) tant que vous ne le demandez pas.
* Outils de contrôle à créer : `scripts/audit-page-individuelle.js` (100 exacts, similarité ≤ 0,70, **0 jeton du site en mode indépendant**, polices bibliothèque uniquement), test du scénario bleu marine / beige et noir.
