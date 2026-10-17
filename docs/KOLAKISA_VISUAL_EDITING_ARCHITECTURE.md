# Architecture de la manipulation visuelle

```
Canevas (iframe, rendu serveur patché)                    Calques (arbre)                Barre d'actions / clavier
  clic / glisser sur l'élément ─┐                              │ clic, glisser-déposer           │ Ctrl+D, Suppr, Alt+↑↓, grip
  poignées .pb-handle-e/s/se    │                              ▼                                  ▼
  (resizeStart) ────────────────┴────────────► `selection` + modèle (document en mémoire) ◄── change(fn, {key,label})
                                                         │ instantané d'historique (une étape par geste)
                                                         ▼
                          overlays recalculés (drawOverlays) · rendu patché · PUT /brouillon (un seul par geste)
```

## Redimensionnement (`resizeStart`)
1. **Début** : mesure de la taille réelle, de la pente (position du bord par pixel de largeur : Flexbox, Grille), du magnétisme.
2. **Pendant** : une mise à jour par image (rAF) du style en ligne de l'élément uniquement ; aucun enregistrement, aucun rendu serveur.
3. **Fin** (`up`) : (a) si une borne min. / max. **déclarée** interdit la taille demandée → rien n'est écrit et un message le dit ; (b) l'unité propre ou héritée de l'élément est conservée (`%`, `rem`, `em`, `vw`, `vh`) sinon pixels ; (c) **une** étape d'historique écrite dans l'écran affiché (`styleSet(device, "normal")`).

## Règles qui garantissent l'intégrité
* La source de vérité est le **modèle** (arbre), jamais l'ordre du DOM. Déposer un nœud sur son descendant est refusé ; un déplacement ne crée ni ne perd de nœud.
* Une duplication passe par `reIdAll` : identifiants neufs pour l'élément et ses enfants, interactions internes redirigées (mission 1) ; classes, références `token:` et valeurs d'écran sont copiées telles quelles (jamais figées).
* Les clics du canevas sont retenus par l'éditeur : liens et boutons n'agissent pas comme chez le visiteur.

## Dépendances à préserver (missions 8, 9, 10)
Le champ `classes` et les références `token:` sont copiés tels quels par la duplication ; les identifiants doivent rester uniques dans l'arbre (un modèle partagé devra recevoir des identifiants neufs à l'insertion) ; un geste ne doit enregistrer qu'une fois.
