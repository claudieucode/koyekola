# Instructions permanentes du projet KOLAKISA

## Interface et design
Toute intervention sur l'interface (CSS, vues EJS, composants, éditeurs, illustrations, textes d'interface) respecte `docs/KOLAKISA_DESIGN_CHARTE.md` :
identité marine, sens fixe des teintes, typographie, échelle d'espacement, dimensions des composants, infobulles, animation, responsive, accessibilité.
- Ne jamais écrire `#fff` ou `#000` en dur pour une surface ou un texte : utiliser les jetons (`--surface`, `--text`, `--kb-*`, `--k-accent-solid`). Le mode sombre se vérifie séparément.
- Corriger les composants partagés à la source (`public/css/kola-brand.css`, `kola-stable.css`) plutôt que d'empiler des correctifs locaux.
- Avant de livrer une modification visuelle : `scripts/audit-interface.js`, `scripts/audit-qualite.js`, `scripts/audit-editeurs.js` si un éditeur est touché, puis les tests `tests/*navigateur*` concernés.
- Mouvement (animations, transitions, glisser-déposer, adaptation aux appareils) : `docs/KOLAKISA_MOTION.md` — durées 120 / 180 / 260 ms, une seule courbe, jamais de propriété de mise en page animée, trois niveaux `html[data-kb-motion]` (`public/js/kb-motion.js`).
- Responsivité (administration et sites créés, deux périmètres distincts) : `docs/KOLAKISA_RESPONSIVE.md` — disposition selon la largeur du contenu, `pointer: coarse` pour le tactile (cibles 44 px, champs 16 px), matrice 320 → 1920 px, `scripts/audit-responsive.js`.
- Navigation principale illustrée (rail / dock, barre rapide mobile) : `docs/KOLAKISA_DOCK_NAVIGATION.md` — une rubrique de `dashboard.NAV` = une icône dans `src/utils/dockIcons.js` ; ne jamais ajouter de route ou de permission dans le rail pour des raisons visuelles.
- Suivi par écran : `docs/KOLAKISA_DESIGN_INVENTAIRE.md`. Historique des paliers : `docs/KOLAKISA_ADMIN_DESIGN_SYSTEM.md`.
