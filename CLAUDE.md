# Instructions permanentes du projet KOLAKISA

## Interface et design
Toute intervention sur l'interface (CSS, vues EJS, composants, éditeurs, illustrations, textes d'interface) respecte `docs/KOLAKISA_DESIGN_CHARTE.md` :
identité marine, sens fixe des teintes, typographie, échelle d'espacement, dimensions des composants, infobulles, animation, responsive, accessibilité.
- Ne jamais écrire `#fff` ou `#000` en dur pour une surface ou un texte : utiliser les jetons (`--surface`, `--text`, `--kb-*`, `--k-accent-solid`). Le mode sombre se vérifie séparément.
- Corriger les composants partagés à la source (`public/css/kola-brand.css`, `kola-stable.css`) plutôt que d'empiler des correctifs locaux.
- Avant de livrer une modification visuelle : `scripts/audit-interface.js`, `scripts/audit-qualite.js`, `scripts/audit-editeurs.js` si un éditeur est touché, puis les tests `tests/*navigateur*` concernés.
- Mouvement (animations, transitions, glisser-déposer, adaptation aux appareils) : `docs/KOLAKISA_MOTION.md` — durées 120 / 180 / 260 ms, une seule courbe, jamais de propriété de mise en page animée, trois niveaux `html[data-kb-motion]` (`public/js/kb-motion.js`).
- Responsivité (administration et sites créés, deux périmètres distincts) : `docs/KOLAKISA_RESPONSIVE.md` — disposition selon la largeur du contenu, `pointer: coarse` pour le tactile (cibles 44 px, champs 16 px), matrice 320 → 1920 px, `scripts/audit-responsive.js`.
- Navigation principale (rail / barre en bas, barre rapide mobile) : `docs/KOLAKISA_DOCK_NAVIGATION.md` — icônes d'origine du CMS, barre en bas par défaut sur grand écran ; ne jamais ajouter de route ou de permission dans le rail pour des raisons visuelles.
- Suivi par écran : `docs/KOLAKISA_DESIGN_INVENTAIRE.md`. Historique des paliers : `docs/KOLAKISA_ADMIN_DESIGN_SYSTEM.md`.

## Travail en parallèle (plusieurs sessions sur le même dépôt)
Plusieurs sessions modifient ce dépôt en même temps ; une fusion a déjà fait perdre à l'une le travail de l'autre (états d'en-tête, enveloppe de l'en-tête, condition « visiteur »).
- Fichiers partagés sensibles : `src/marketing/pages/nodes.js` (états, `pageCss`), `views/marketing-public/_sections.ejs` (enveloppe des parties du site), `src/themeBuilder/conditions.js` / `match.js` / `resolve.js`, `public/js/page-builder.js`, `public/css/landing.css`. Les modifier une session à la fois ; avant de pousser : `git fetch`, rebaser sur `origin/main`, relire le diff de ces fichiers.
- Après une fusion de `main`, relancer au minimum `tests/header-*.test.js`, `tests/footer-*.test.js` et `tests/isolation-*.test.js` avant de pousser : un envoi sur `main` met `kolakisa.com` à jour automatiquement (déploiement Git de Hostinger).
- Une condition, un état ou un réglage d'en-tête / de pied de page n'a qu'UNE écriture dans les données : en ajouter une seconde pour la même chose crée un conflit silencieux (cas de `visitor` : `state` + `roles`, l'ancien `who` est converti à la lecture).
