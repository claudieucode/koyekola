# Grille de notation de la qualité de génération (22.1)

**Palier 22.1 · 2026-10-30 · Données : `docs/quality-lab/results.json`.**

## 1. Principe
Chaque site est noté sur **100 points** (grille de la mission). Le laboratoire ne peut mesurer qu'une partie de chaque critère ; il distingue donc :
- **mesurable** : points que des mesures objectives (HTML, CSS, base, chronomètre, garde-fous) permettent d'attribuer ;
- **non mesuré** : jugement esthétique, qualité rédactionnelle réelle, pertinence des images, rendu mobile réel, compréhension sémantique par un modèle. Ces points **ne sont jamais accordés**.

Deux notes sont publiées pour chaque site : la **borne basse** (obtenu sur 100, non mesuré = 0) et le **pourcentage du mesurable** (obtenu / mesurable, 64,5 points). Le statut officiel (EXCELLENT ≥ 90, TRÈS BON 80–89, SATISFAISANT 70–79, À AMÉLIORER 50–69, INSUFFISANT < 50) est calculé sur le pourcentage du mesurable **puis plafonné à « À AMÉLIORER »** dès qu'une défaillance critique existe (page illisible, publication refusée sans raison de formulaire, lien cassé, affirmation commerciale ou médicale inventée, parcours d'achat non démontré). Ce plafond est testé (`tests/programme22-1-quality-lab.test.js`).

## 2. Critères, pondérations et formules
| Critère | Pondération | Mesurable | Formule (points) |
|---|---|---|---|
| Compréhension du brief | 10 | 4 | 1 pt par contrôle : pays détecté = attendu ; langue du brief détectée ; garde-fou anti-invention actif (déclassement des faits sans citation) ; aucune fausse contradiction. |
| Architecture | 10 | 10 | 6 × (pages essentielles couvertes / essentielles) + 2 × (1 − pages hors sujet / 2) + 2 si aucun module inadapté (ex. « formation » pour une boutique). Pour les boutiques, panier / commande / fiche produit sont exclus du comptage (moteur de boutique séparé) et traités en défaillance critique. |
| Qualité visuelle | 20 | 12 | 3 × contrastes conformes des 3 directions + 2 si les directions diffèrent (teinte ou polices) + 1,5 si bandeau d'accueil + 2 × min(1, variété des sections de l'accueil / 0,6) + 1,5 × min(1, alternance des fonds / 0,5) + 2 si un seul h1 et hiérarchie des titres correcte. Originalité, harmonie, personnalité : **non mesurés**. |
| Sections | 10 | 10 | 3 (sections natives valides) + 4 × (1 − textes d'exemple / sections) + 3 × part des pages de plus de 40 mots. |
| Contenus | 10 | 4 | 2 si aucune affirmation inventée (statistique, certification, années, promesse médicale) + 2 × (1 − part de blocs d'exemple / 30 %). Qualité rédactionnelle : **non mesurée**. |
| Médias | 10 | 5 | 5 × (1 − images sans alt / images) ; 0 s'il n'y a aucune image. Pertinence et cohérence : **non mesurées**. |
| Responsive | 10 | 5 | 1,5 viewport + 2 pour ≥ 2 règles `@media` + 1 images fluides + 0,5 sans largeur fixe ≥ 600 px. Rendu réel mobile : **non mesuré**. |
| Expérience utilisateur | 10 | 4,5 | 2 × (liens internes valides) + 1,5 appel à l'action sur l'accueil + 1 formulaire sur la page de contact. La présence d'un menu n'est pas notée (le chemin du laboratoire n'exécute pas l'étape « menu » du studio). |
| SEO et accessibilité | 5 | 5 | Moyenne par page : titre 0,5 · description 0,5 · un seul h1 1 · lang 0,5 · canonical 0,5 · images avec alt 0,5 · champs avec label 0,5 · repères main/nav/footer 0,5 · JSON-LD 0,5. **Aucune conformité WCAG n'est affirmée.** |
| Performance technique | 5 | 5 | Temps de réponse médian (< 250 ms : 2) + poids HTML (< 150 Ko : 1,5) + ≤ 8 balises script (1) + ≤ 4 feuilles CSS (0,5). Lighthouse non exécuté. |
| **Total** | **100** | **64,5** | |

## 3. Résultats moyens (15 scénarios)
brief 3,7/4 · architecture 9,2/10 · visuel 9,5/12 · sections 6,0/10 · contenus 2,8/4 · médias 0/5 · responsive 5/5 · UX 3,5/4,5 · SEO-a11y 4,0/5 · performance 5/5 → **48,6/100 (borne basse), 75,4 % du mesurable.**

## 4. Lecture honnête
- Les critères « parfaits » (responsive, performance) ne mesurent que la présence de bonnes pratiques côté serveur. Ils ne disent rien du rendu sur un vrai téléphone.
- Les médias à 0 sont réels : aucun site généré ne contient d'image.
- Les sections à 6/10 sont plafonnées par les textes d'exemple (100 % des sections concernées dans les sites générés sans IA) : conforme à la règle « ne rien inventer », mais non publiable en l'état.
- Le score ne doit pas être comparé à un score Lighthouse ni à une note humaine : c'est un **indicateur de régression** qui permet de mesurer les prochains paliers sur les mêmes 15 briefs.

## 5. Reproduire
`node tests/quality-lab/lab.js` (≈ 3 min, démarrage du serveur ≈ 70 s sur la machine de test ; variable `TEST_START_TIMEOUT_MS=400000`). Le fichier `docs/quality-lab/results.json` est écrasé : comparez-le au fichier archivé du palier précédent via git.
