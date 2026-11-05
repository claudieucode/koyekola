# Rapport — personnalisation des thèmes

## A. Thèmes audités
Les 70 thèmes installables de `src/marketing/themes/packs/` (liste et état dans `THEME_CUSTOMIZATION_AUDIT.md`).

## B. Thèmes corrigés
Les 70 thèmes : réglage « Animations du thème » (Toutes / Calmes / Aucune) ajouté à chacun par le moteur partagé (`packs/index.js`, `addStandardOptions`), appliqué par `packs/base.css`, validé avant installation. Chaque thème conserve son identité et ses réglages propres (couleurs, choix d'éléments, au moins 3 par thème, tous branchés).
Tests : 4 tests de contrat (`tests/themes-personnalisation-contrat.test.js`) + `tests/themes-packs.test.js` (17/17, serveur réel : installation, options, retour en arrière, isolation par site).

## C. Éléments incomplets (honnêtement)
- **Pas de refonte de chaque composant en réglages fins** : les réglages de 70 thèmes sont des réglages de thème (couleurs, éléments affichés, animations). Le texte, les images, les boutons et les espacements se modifient par le Page Builder, pas par un panneau de thème.
- **Animations pilotées par script** : « Calmes/Aucune » désactive les animations et transitions CSS. Les effets lancés par le `motion.js` propre à un thème (défilement, filtres) restent régis par la préférence « réduire les animations » du visiteur ; le réglage ne les arrête pas.
- **Pas de réglage de durée/intensité/courbe par animation** : elles sont écrites en dur dans le CSS de chaque thème.
- **Pas de panneau par composant avec aperçu en direct** : le réglage s'applique après enregistrement (la fiche du thème recharge l'aperçu).
- **Pas de test de navigateur** du nouveau réglage (le test vérifie le CSS et l'attribut posés sur la page, pas un rendu mesuré).
- Pas de manifeste de composants versionné avec migrations de schéma : les réglages inconnus sont ignorés et les invalides reprennent leur défaut.

## D. Architecture livrée
Moteur partagé existant (schéma d'options → validation → jetons du site → variables CSS/attributs → `style.css` confiné) + contrat appliqué automatiquement (`addStandardOptions`) + règles dans `base.css`.

## E. Tests
`node --test tests/themes-personnalisation-contrat.test.js` : 4 réussis, 0 échec. `node --test tests/themes-packs.test.js` : 17 réussis, 0 échec.

## F. Conformité future
Un nouveau thème échoue aux tests s'il a moins de 3 réglages, un réglage sans lecture dans son CSS/script, un thème animé sans réglage d'animation (ajouté d'office, test de présence), une clé en double ou une erreur de chargement. L'isolation vient du préfixe `body[data-kw-pack]` imposé au chargement.
Règle développeur : un réglage déclaré dans `options` doit être lu par `--pk-<clé>` / `data-pk-<clé>` dans `style.css`.
