# Stabilisation de l'interface — audit et corrections (24/10/2026)

Méthode : explorateur Chrome réel (`scripts/audit-interface.js`, 116 écrans × 4 largeurs 1920/1440/820/390), audit des éditeurs
(`scripts/audit-editeurs.js` : pages, e-mails, scénarios, articles, éditeur du site, personnaliser ; 1920/1440/1100/820 ; géométrie,
décalages de mise en page, stabilité au clic et à l'ouverture de panneaux), sondes ciblées (`audit-sonde.js`, `audit-cls.js`, `audit-captures.js`).

## Défauts reproduits et corrigés
| Priorité | Défaut | Cause racine | Correction |
|---|---|---|---|
| P1 | Sélectionner un bloc fait sauter toute la page de ~355 px (barre d'outils hors écran) en disposition empilée (≤ 1100 px) | `scrollIntoView` sur la ligne de l'arbre fait défiler tous les ancêtres, fenêtre comprise (`page-builder.js`) | `scrollInside()` : défilement natif conservé, autres ancêtres rétablis ; 4 appels corrigés |
| P1 | Barre de l'éditeur de pages : décalage de mise en page 0,82 à 820 px (barre de 2 à 3 lignes) | bouton « Publier » masqué côté serveur puis révélé par le script après chargement | état initial calculé côté serveur comme `updateStatus()` (`page-builder.ejs`) |
| P1 | Rangées de filtres du CMS désalignées sur 19 pages (listes 38 px, boutons 32 px) | deux règles de hauteur indépendantes | une hauteur de commande unique dans les barres d'outils (`kola-stable.css`) |
| P1 | Boutons étirés sur toute la colonne (jusqu'à 1 500 px) : « Choisir dans la médiathèque », « Simuler », etc. | éléments de grille / de flex en colonne | `width: fit-content` à spécificité nulle (`:where`) |
| P1 | Éditeur d'articles à 820 px : barre d'en-tête qui déborde de 106 px | règle `display:none` de l'état d'enregistrement battue en spécificité par une règle plus récente | état réduit au point de couleur jusqu'à 1100 px (`blog-editor.css`) |
| P2 | Décalage de chargement 0,417 (médiathèque, 820 px) | polices appliquées après la première mise en page | préchargement des deux polices de l'interface (`partials/font-preload.ejs`) |
| P2 | Barre d'enregistrement empilée à 820 px (bouton de 750 px) | point de rupture à 820 px au lieu de 640 px | `cms.css` |
| P2 | Onglets Outils coupés net entre 1300 px et la largeur où ils tiennent | fondu de bord retiré avant que les onglets tiennent | retour à la ligne à partir de 1300 px |

Mesures avant/après (116 écrans × 4 largeurs) : hauteurs incohérentes 73 → 0, hors cadre 1 → 0, boutons étirés 61 → 27 (les restes sont des
boutons d'accordéon ou de liste volontairement pleine largeur), décalages de chargement 3 → 0 (hors éditeur de pages : 0,86 → 0,001).

## Restes connus (non corrigés)
- Saut vertical de 2 px de la barre de l'éditeur de pages au chargement (rendu tardif du bloc titre) : `editeur-canvas-containers-navigateur` échoue déjà sur `main`.
- Champs de la barre contextuelle de l'éditeur de pages à 1100 px : libellés tronqués (« Interli », « Espace »).
- Les chevauchements signalés par l'explorateur sur les menus latéraux (contenu défilant sous le pied de menu) sont des faux positifs de la mesure.
- Echecs de tests déjà présents sur `main` (autres sessions) : voir le rapport de session.
