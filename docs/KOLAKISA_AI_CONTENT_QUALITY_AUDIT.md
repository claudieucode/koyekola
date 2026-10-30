# Audit de la qualité des contenus (22.1)

**Palier 22.1 · 2026-10-30 · Données : `docs/quality-lab/results.json`.**

## Ce qui est mesuré et ce qui ne l'est pas
Le laboratoire n'appelle aucune IA : les contenus rendus sont ceux que le **Page Generator écrit sans modèle** (titres tirés du plan, textes d'exemple signalés). La qualité rédactionnelle d'un texte produit par un modèle (clarté, fluidité, ton, adaptation au public, exactitude) est **NON MESURÉE** dans ce palier. Elle exige un fournisseur configuré et une relecture humaine.

## Mesures réelles
| Mesure | Résultat |
|---|---|
| Statistiques, certifications, années d'expérience, promesses médicales dans les 53 pages rendues | **0** (le moteur n'invente rien sans IA) |
| Pages publiées contenant des espaces réservés `[ … ]` | 44 / 53 |
| Pages contenant le faux témoignage « Remplacez par le témoignage réel d'un client » | 21 / 53 |
| Pages sans aucun espace réservé | 3 / 53 |
| Mots rendus (scénario entreprise) | 469 mots sur 4 pages, dont 23 blocs d'exemple |

## Garde-fous du Content Generator (modèle simulé, mesure réelle du serveur)
On a fait « écrire » au modèle 12 textes dangereux, puis 6 textes légitimes, et on a mesuré ce que `validate.checkField` signale en critique :
- **Détection : 12 / 12** — statistique (95 %), années d'expérience, nombre de chantiers, certification ISO, « numéro 1 », promesse de guérison, téléphone, e-mail, témoignage signé, prix, garantie à 100 %, année de fondation inventés.
- **Faux positifs : 0 / 6** sur des phrases ordinaires.
- **Répétitions** : une phrase identique reprise dans deux champs est signalée (`repeated_sentence`).
Limites connues du validateur (son propre en-tête) : pas de correcteur orthographique hors ligne ; seules les fautes mécaniques sont détectées ; la relecture humaine reste nécessaire.

## Contenus de santé
Le scénario « Santé » (cabinet de kinésithérapie) ne produit aucune promesse médicale (0 affirmation détectée) ; la détection de « guérison garantie » et similaires est vérifiée par le test des garde-fous. Aucune recommandation médicale n'est générée.

## Constats
- **C1 (P1)** Les textes d'exemple sont publiables (Q2) : un visiteur peut voir « Remplacez par le témoignage réel… ». Le Content Generator classe pourtant le champ « placeholder » en *important*. La publication ne l'applique pas.
- **C2 (P1)** Aucune meta description (Q3) : le SEO textuel est une étape distincte, non déclenchée par la génération de pages.
- **C3 (P2)** Multilingue : pour les deux briefs « en anglais » (technologie, éducation), les titres et h1 des pages générées sont **en français** (« Accueil », « Services », « Formations », « Enseignants »), car le Page Generator reprend les noms français du catalogue et que le laboratoire ne lui transmet pas de langue. La traduction relève du Content Generator (non exécuté sans IA). Le comportement d'un vrai parcours en anglais reste à mesurer.
- **C4 (P3)** Faux témoignage d'exemple : mieux vaut ne rien afficher qu'un texte qui ressemble à un avis (risque de confusion avec un avis réel).

## Recommandations (voir la feuille de route)
Bloquer ou avertir à la publication tant que des espaces réservés subsistent ; générer la meta description au moment de la génération des pages ; enchaîner automatiquement le Content Generator ; évaluer le rédactionnel avec un fournisseur réel sur les 15 briefs, relecture humaine à l'appui (grille : clarté, ton, répétition, exactitude).
