# KOLAKISA — Styles enregistrés : audit

## Ce que le code contenait réellement
Il n'existait **aucun bouton « Enregistrer comme style »**. La seule fonction proche était le bloc « Classes globales du site » (onglet Avancé → « CSS, classes et attributs ») : « Créer une classe depuis cet élément » et « Mettre à jour la classe ». Une classe globale est stockée dans les réglages du site (`mk_sites.settings.classes`), validée par `nodes.normalizeClassDefs`, rendue par `nodes.classCss` (`.lp-site :where(.nom)`, spécificité faible : le style propre de l'élément l'emporte). C'est le système de styles réutilisables existant : il a été **réutilisé**, pas doublé.

| Capacité | État avant |
|---|---|
| Stockage / rendu / mise à jour partout / suppression | présent et fonctionnel |
| Application à un autre élément (case à cocher), annulation | présent et fonctionnel |
| Choix des propriétés enregistrées | **absent** : `ownStyles` copiait *tous* les styles et états de l'élément (y compris placement dans le parent, position, z-index, visibilité…) |
| Choix des écrans / états | **absent** |
| « Mettre à jour la classe » | **défectueux** : fusion silencieuse de tout l'élément dans la classe partagée, sans confirmation du contenu |
| Compatibilité entre types de widgets | **absente** (aucun avertissement) |
| Origine du style (type source, catégories, date) | **absente** |
| Catégories de propriétés | **absentes** (seulement les groupes de l'inspecteur, propres à l'affichage) |
| Portées | une seule : le site (aucune portée globale entre sites ni « personnelle » n'existe : non inventée) |

## Cause réelle
L'enregistrement n'avait pas de notion de « sélection » : tout ou rien, sans lecture de la nature des propriétés. Une propriété structurelle (ex. `alignSelf`, `gridColumnSpan`, `position`) était copiée dans un style censé être visuel, et il était impossible de n'enregistrer que les couleurs.

## Correction
- `src/marketing/pages/stylePresets.js` (nouveau, petit) : 7 catégories réelles (couleurs et arrière-plans ; dimensions et espacements ; typographie ; bordures et contours ; ombres et flou d'arrière-plan ; transformations et transitions ; opacité, filtres et masques) définies par clés de `STYLE_PROPS`/`COMPOSED` (aucune liste parallèle de propriétés : un test vérifie que toute clé existe et qu'une clé n'a qu'une catégorie). Hors catégories, volontairement : mise en page, placement dans le parent, position, z-index, visibilité, curseur, événements, débordement, image de fond (contenu), animations d'entrée/défilement/souris (propriétés du nœud, pas des styles).
- `nodes.normalizeClassDefs` conserve et valide `meta { source, categories, updated }`.
- Éditeur : dialogue « Enregistrer comme style » (catégories repliables avec propriétés individuelles = sélection personnalisée, Tout sélectionner / désélectionner avec case indéterminée, écrans et états, résumé, nom, remplacement explicite avec avertissement, option « appliquer à cet élément »). L'application retire de l'élément *seulement* les réglages enregistrés. L'opération est une étape d'annulation/rétablissement.
- Application à un autre type : avertissement du nombre de réglages sans effet sur ce type.
