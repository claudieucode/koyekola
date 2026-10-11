# Audit du modèle de données

## Forme enregistrée
`mk_landing_pages.draft` / `.sections` (JSON) : `{ title, description, seo, theme, sections: [ { id, type:"layout", children:[ node… ] } | section prête ] }`. Un `node` : `{ id, type, props, styles{desktop,tablet,mobile,wide}, states, parts, name, note, hidden, locked, anchor, css, classes, attrs, hideOn, audience, schedule, motion, interactions, startHidden, children }`.

## Invariants vérifiés (tests)
| Invariant | Où | Résultat |
|---|---|---|
| Identifiants uniques (éléments **et** sections) | `normalizeSections` + `noyau-integrite` | deux identiques → 422 |
| Hiérarchie : enfants seulement dans les conteneurs, ordre conservé, profondeur ≤ 8, ≤ 400 éléments, ≤ 30 sections | `normalizeNode` ; côté éditeur maintenant aussi avant ajout (D5) | conforme |
| Pas de cycle ni de parent orphelin | structure en arbre JSON (impossible) | conforme |
| Normaliser deux fois = normaliser une fois | `noyau-integrite` sur les types instanciables sans contexte | conforme |
| Aucun réglage du modèle vierge perdu | idem | conforme |
| Réenregistrer le brouillon relu ne change rien | `noyau-integrite` | conforme |
| Références `interactions[].target` valides | **n'existait pas** | ajouté (D1, D2) : copie redirigée, suppression nettoyée, serveur écarte les cibles absentes avec avertissement `interaction_target` |

## Données inconnues
Le serveur applique une **liste blanche** : une propriété inconnue d'un élément est écartée (testé). C'est un choix de sécurité (aucune valeur libre dans les pages publiées) et non un oubli ; l'exigence « ne pas supprimer les données inconnues » est donc respectée dans la limite de ce choix : voir `KOLAKISA_CORE_LIMITATIONS.md` (L1).

## Redondances relevées (non modifiées)
`section` et `layout` : une section prête peut porter le nom d'un élément (`SECTION_MARK`, WeakSet côté client). Complexe mais cohérent ; le remplacer serait une refonte.
