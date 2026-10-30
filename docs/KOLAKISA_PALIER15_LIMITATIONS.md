# Palier 15 — Limites et problèmes restants

**Kolakisa n'est pas déclaré « accessible » ni conforme WCAG** : seules des vérifications automatiques partielles et des parcours ciblés ont été faits.

## Non réalisé
- **Lecteur d'écran** (VoiceOver présent sur la machine) : aucun test. Les annonces (`role="alert"`, `aria-expanded`, noms) sont vérifiées dans le DOM, pas à l'oreille.
- **axe-core / Lighthouse** : non installés, non utilisés ; la sonde maison couvre moins de règles et peut se tromper (4 faux positifs rencontrés et écartés, voir l'audit).
- **Safari et Firefox** pour les contrôles de ce palier : Chrome seul. (Chrome + Firefox au Palier 14 pour le responsive.)
- Navigation clavier de **tous** les composants complexes : couverts par les tests existants (accordéons, onglets, lightbox) et par les 7 nouveaux ; pas de parcours exhaustif de chaque widget × chaque état.
- **Contraste des textes sur image ou dégradé** (10 à 12 par page publique) : non évaluable par la sonde.
- **Zoom du texte seul à 200 %**, interlignage/espacement forcés (WCAG 1.4.12) : non testés.
- **Vidéo/audio** : sous-titres et alternatives textuelles non audités.
- **Ordre de lecture** réel du DOM vs. ordre visuel (sauf éditeur de blocs).

## Problèmes constatés, non corrigés
| Sujet | État | Raison |
|---|---|---|
| Erreurs de formulaire au niveau du formulaire uniquement (pas de `aria-invalid` ni `aria-describedby` par champ ; focus non déplacé vers l'erreur à `/inscription`, `/contact`) | Ouvert | Modifier la validation et son rendu sur chaque formulaire sort de ce palier ; le message est désormais annoncé (`role="alert"`) |
| Éditeur : titres internes des panneaux en `h3` sous le `h1` de la page (« Mise en page »…) | Ouvert | Interface d'outil à repères nommés (`aside` avec `aria-label`) ; un changement de niveau toucherait la mise en page de nombreux panneaux |
| Éditeur : cibles < 24 px (`pb-fav`, `pb-twist`) | Ouvert | Voir Palier 14 (interface de bureau) |
| Le bandeau de consentement ajoute de l'espace au bas des pages tant qu'il est visible | Voulu | Seul moyen pour que le dernier lien reste atteignable |
| `aria-haspopup="true"` du menu Catégories | Conservé | Valeur historique ; l'état est désormais annoncé par `aria-expanded` |

## Environnement de test
Machine partagée avec d'autres sessions de développement (plusieurs suites de tests d'autres projets tournaient en parallèle) : les durées et les dépassements de délai de 30 s sont donc moins fiables ; tout échec est rejoué seul et sur `main` avant d'être attribué.

## À traiter dans un palier ultérieur
Association champ-à-champ des erreurs, test avec VoiceOver/NVDA, audit axe-core en CI, contrastes sur image/dégradé, WCAG 1.4.12.
