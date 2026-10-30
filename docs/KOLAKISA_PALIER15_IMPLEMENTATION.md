# Palier 15 — Implémentation

Principe : corriger à la source (la vue, la règle CSS ou le script qui produit le défaut), réutiliser les composants existants, ne rien ajouter qui ne soit pas nécessaire. Aucune dépendance, aucune migration.

| Défaut | Correction | Fichiers |
|---|---|---|
| A1 titres | Pied de page : `h4` → `h2` (3 titres, dont celui avec lien) ; états vides : `h3` → `h2` (catalogue, FAQ publique et d'administration, mes formations ×2, formations du formateur). CSS : `.footer-col h2` et `.empty-state :is(h2, h3)` reprennent exactement les valeurs de l'ancien rendu, avec `font-weight: 700` explicite (le `h2` global est à 800) | `views/partials/footer.ejs`, `views/catalogue.ejs`, `views/pages/faq.ejs`, `views/my-courses.ejs`, `views/instructor/faq-admin.ejs`, `views/instructor/courses.ejs`, `public/css/style.css`, `public/css/kola-v3.css` |
| A2 repères | `aria-label` sur `.dash-nav` : libellé du module, ou « Mon espace » | `views/partials/dash-open.ejs` |
| A3 erreurs | `role="alert"` sur les 6 messages d'erreur serveur qui n'en avaient pas | `views/login.ejs`, `register.ejs`, `forgot-password.ejs`, `reset-password.ejs`, `marketing-public/form.ejs`, `instructor/course-form.ejs` |
| A4 bandeau | Deux gestes dans `visitor.js` : (1) `reserveBanner()` — `padding-bottom` de `<body>` = hauteur du bandeau + 32 px tant qu'il est affiché (le dernier lien du pied de page peut remonter), retiré au choix, recalculé au redimensionnement ; (2) au `focusin`, si l'élément focalisé chevauche le bandeau, la page défile (`behavior: "instant"`) pour le placer au-dessus. Une première version utilisait `scroll-padding-bottom` : **abandonnée**, elle décalait le centrage de `scrollIntoView` et faisait échouer `moteur-mouvement-chrome` (3/3 sur la branche, 0/3 sur `main`) | `public/js/visitor.js` |
| A5 lien d'évitement | `z-index: var(--z-modal)` (200) au focus, au-dessus de la barre d'administration (110). Le test d'échelle « aucun z-index ≥ 500 » est respecté | `public/css/style.css` |
| A6 contraste | `.dash-chip[aria-current="page"] .dash-chip-count { opacity: 1 }` | `public/css/dashboard.css` |
| A7 menu Catégories | Échap referme (au focus **et** au survol seul), le focus reste sur le bouton, `aria-expanded` synchronisé (ouvert, fermé, survol, focus) ; rouvre après être sorti. Au-dessus de 920 px seulement (dans le tiroir mobile la liste est toujours dépliée) | `public/js/main.js`, `public/css/style.css` |

## Test existant adapté
`tests/refonte-design-v3.test.js` figeait `<h3>Aucune question pour le moment</h3>` ; il attend `<h2>` (même texte, même structure `empty-state`). C'est la seule modification d'une assertion existante : le niveau de titre est précisément le défaut corrigé.

## Outils et tests ajoutés
- `scripts/a11y/audit-accessibilite.js` : sonde mesurée (voir l'audit).
- `tests/palier15-accessibilite-navigateur.test.js` : 7 tests. **7 échouent sans les correctifs, 7 réussissent avec** (exécutés sur une copie jetable de l'arbre d'origine).

## Tentatives écartées
`scroll-padding-bottom` pour le bandeau de consentement : écartée (régression détectée par un test existant, voir A4).

Une règle CSS pour le focus du bouton calendrier des champs date a été écrite puis **retirée** : Chrome dessine déjà la bague (capture avant/après identique).

## Non modifié, volontairement
Palette, typographie, raccourcis clavier, composants de l'éditeur (les titres internes des panneaux restent en h3 : voir limites), règles de validation.
