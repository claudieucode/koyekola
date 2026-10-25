# Instructions permanentes du projet KOLAKISA

## Interface et design
Toute intervention sur l'interface (CSS, vues EJS, composants, éditeurs, illustrations, textes d'interface) respecte `docs/KOLAKISA_DESIGN_CHARTE.md` :
identité marine, sens fixe des teintes, typographie, échelle d'espacement, dimensions des composants, infobulles, animation, responsive, accessibilité.
- Ne jamais écrire `#fff` ou `#000` en dur pour une surface ou un texte : utiliser les jetons (`--surface`, `--text`, `--kb-*`, `--k-accent-solid`). Le mode sombre se vérifie séparément.
- Corriger les composants partagés à la source (`public/css/kola-brand.css`, `kola-stable.css`) plutôt que d'empiler des correctifs locaux.
- Avant de livrer une modification visuelle : `scripts/audit-interface.js`, `scripts/audit-qualite.js`, `scripts/audit-editeurs.js` si un éditeur est touché, puis les tests `tests/*navigateur*` concernés.
- Suivi par écran : `docs/KOLAKISA_DESIGN_INVENTAIRE.md`. Historique des paliers : `docs/KOLAKISA_ADMIN_DESIGN_SYSTEM.md`.
