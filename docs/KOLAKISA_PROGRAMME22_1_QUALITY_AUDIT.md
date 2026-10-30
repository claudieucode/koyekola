# Programme 22.1 — Audit de qualité des sites générés

**Palier 22.1 · 2026-10-30 · Résultats de référence : `docs/quality-lab/results.json` (relançable : `node tests/quality-lab/lab.js`).**

## 1. Ce qui a réellement été exécuté
Un laboratoire (`tests/quality-lab/`) lance un **vrai serveur** Kolakisa (vraie base, vraies migrations) et exécute, pour **15 scénarios de référence** : création du site → direction artistique (21.5) → plan du parcours guidé (catalogue 20.6, recettes du Page Generator) → génération des pages (21.4) → application → publication native → lecture de la page publique sur `/p/<slug>` → analyse statique du HTML et du CSS. 72 pages générées, 53 publiées et lues, 5 lectures chronométrées par page.

**Aucun fournisseur d'IA n'a été appelé** (aucun coût). Le laboratoire mesure donc le **socle déterministe** de Kolakisa : ce que le produit fabrique quand l'IA n'écrit rien. Tout ce qui dépend d'un modèle (compréhension réelle d'un brief, plan sémantique, rédaction, images) est **déclaré non mesuré**, jamais compté comme réussi.

## 2. Résultats globaux
| Mesure | Valeur |
|---|---|
| Note moyenne, borne basse (non mesuré = 0), sur 100 | **48,6 / 100 → INSUFFISANT** |
| Note moyenne sur les points mesurables (64,5 pts sur 100) | **75,4 % → SATISFAISANT** |
| Scénarios plafonnés par une défaillance critique | 3 (boutiques) → À AMÉLIORER |
| Pages publiées sans erreur | 53 / 53 lisibles (HTTP 200) |
| Pages non publiables d'origine | 19 / 72 (Contact et Rendez-vous : formulaire à associer) |

Les deux lectures sont données volontairement : la seconde est flatteuse (elle ignore ce qu'on ne sait pas mesurer), la première est pessimiste. **La vérité est entre les deux ; aucune des deux n'est un jugement sur la qualité d'un site rédigé par IA.**

## 3. Notes par scénario
| Scénario | /100 (borne basse) | % du mesurable | Statut | Défaillance critique |
|---|---|---|---|---|
| Entreprise | 49,7 | 77,1 | SATISFAISANT | — |
| Immobilier | 49,5 | 76,7 | SATISFAISANT | — |
| Construction | 48,2 | 74,7 | SATISFAISANT | — |
| Technologique | 48,4 | 75,0 | SATISFAISANT | — |
| Photographie | 50,1 | 77,7 | SATISFAISANT | — |
| Portfolio | 48,0 | 74,4 | SATISFAISANT | — |
| Institutionnel | 49,7 | 77,1 | SATISFAISANT | — |
| Restaurant | 48,3 | 74,9 | SATISFAISANT | — |
| Blog professionnel | 48,8 | 75,7 | SATISFAISANT | — |
| Boutique e-commerce | 47,0 | 72,9 | **À AMÉLIORER (plafonné)** | parcours d'achat non démontré ; boutique « indisponible » côté planificateur |
| Boutique de mode | 46,9 | 72,7 | **À AMÉLIORER (plafonné)** | idem |
| Boutique informatique | 46,9 | 72,7 | **À AMÉLIORER (plafonné)** | idem |
| Services | 49,6 | 76,9 | SATISFAISANT | — |
| Éducatif | 49,8 | 77,2 | SATISFAISANT | — |
| Santé (contenu contrôlé) | 48,7 | 75,5 | SATISFAISANT | — |

Moyennes par critère (obtenu / mesurable / pondération) : brief 3,7/4/10 · architecture 9,2/10/10 · visuel 9,5/12/20 · sections 6/10/10 · contenus 2,8/4/10 · médias **0**/5/10 · responsive 5/5/10 · UX 3,5/4,5/10 · SEO-accessibilité 4/5/5 · performance 5/5/5. Détail des formules : `KOLAKISA_AI_GENERATION_QUALITY_SCORE.md`.

## 4. Constats classés (P0 à P3)
| Réf. | P | Constat (preuve) | Cause racine | Moteur |
|---|---|---|---|---|
| Q1 | P1 | **Les 15 accueils ont la même structure** : hero > texte > cartes > témoignages (15/15). | Recette d'accueil fixe `RECIPES.accueil` + règles du mapper, indépendantes du secteur. | Page Generator / Site Planner (chemin sans IA) |
| Q2 | P1 | **Textes d'exemple publiables** : 44/53 pages publiées contiennent des `[espaces réservés]`, 21/53 le texte « Remplacez par le témoignage réel… ». Seules 3 pages sont propres. | Le générateur pose des exemples signalés (voulu) mais la publication native ne les bloque pas. | Page Generator + publication |
| Q3 | P1 | **Aucune meta description renseignée** sur 53/53 pages publiées (balise absente ou vide). | Le Page Generator n'écrit pas le SEO ; le Content Generator le fait dans une étape séparée. | Page Generator / Content Generator |
| Q4 | P1 | **Aucune image** sur 53/53 pages (hero sans image). | Le Media Generator est une étape à part ; sans fournisseur réel, seuls des visuels d'attente existent. | Media Generator |
| Q5 | P1 | **Boutiques : le « Catalogue » est un catalogue de formations** (type `formation`), sans fiche produit, panier ni commande dans le parcours guidé. | `TYPE_OF.catalogue = formation` et catégorie « boutique » antérieure au moteur 20.5 ; le registre du planificateur déclare la boutique indisponible. | Catalogue de l'assistant, Page Generator, registre du Site Planner |
| Q6 | P1 | **Contact / Rendez-vous non publiables d'origine** (19/72 pages, 15 sites sur 15) : « La section d'inscription a besoin d'un formulaire ». | Le mapper refuse volontairement de choisir un formulaire ; aucune étape guidée ne l'associe. | Component Mapper + parcours |
| Q7 | P2 | **Trois directions = une seule teinte** (écart de teinte 0 à 3° entre les 3 propositions d'un brief) ; **11 sites sur 15 en bleu ≈ 215°** ; 4 familles de teintes au total. | `design.proposals` varie luminosité, saturation et polices, pas la teinte ; teinte par défaut bleue sans couleur citée. | Design Generator |
| Q8 | P2 | **Appliquer une génération sur un 2e site échoue sans choix manuel** : 0 page créée, message « existe déjà… », car des pages homonymes existent dans d'autres sites ; avec « nouvelle page », les noms deviennent « Accueil (5) ». | `existingFor` compare les noms sur toute l'organisation. | Page Generator |
| Q9 | P2 | **Brief Analyzer : une valeur inventée est conservée** (« Tokyo », « aérospatiale ») en « déduite », confiance 0,8, et le brief reste « prêt ». Un brief de 28 caractères est accepté. | Le serveur déclasse mais n'écarte pas les valeurs sans preuve. | Brief Analyzer |
| Q10 | P2 | **Architectures répétitives** : construction, services et santé ont exactement les mêmes pages ; « Prendre rendez-vous » et « Contact » sont deux pages de même type et même contenu ; la construction n'a pas de page Réalisations. | Catalogue de catégories trop grossier (une catégorie « services » pour trois secteurs). | Catalogue de l'assistant |
| Q11 | P3 | Texte alternatif des images : suffixe « (image générée) » ; alt du bandeau « Illustration d'ambiance » (générique). | `altFor`. | Media Generator |
| Q12 | P3 | Formats d'image : 3 ratios (1:1, 3:2, 2:3), aucun 16:9 pour les bandeaux. | `RATIOS` du fournisseur. | Media Generator |

Aucun constat P0 (aucune faille de sécurité, perte de données ni erreur serveur n'a été observée par le laboratoire).

## 5. Ce qui fonctionne bien (mesuré)
- **Garde-fous du Content Generator** : 12 affirmations inventées sur 12 détectées (statistiques, années d'expérience, certifications, classement, téléphone, e-mail, témoignage, prix, garantie, promesse médicale), 0 faux positif sur 6 textes légitimes.
- **Contrastes** des directions artistiques : 100 % conformes (45 directions).
- **Structure HTML** : un seul `h1` par page (53/53), canonical (53/53), JSON-LD valide (53/53), `viewport`, 36 règles `@media`, images fluides.
- **Rendu natif** : les pages passent par le moteur de sections natif ; aucune erreur HTTP, aucun lien interne cassé.
- **Performance locale** : temps de réponse médian 10 ms, maximum 131 ms ; HTML 6,5 Ko ; génération d'un site 12 à 49 ms, application 27 ms (médiane), publication 34 ms (médiane).

## 6. Limites de cet audit
Pas de navigateur (Chrome absent) : aucune capture, aucun test mobile réel, pas de Lighthouse, pas de navigation clavier. Pas d'IA réelle : qualité rédactionnelle, pertinence des images, compréhension sémantique non mesurées. Le chemin « studio IA » (21.8) n'a pas été rejoué dans ce laboratoire (il exige un fournisseur) ; ses étapes sont couvertes par les tests du programme 21. Benchmark concurrent : voir `KOLAKISA_PROGRAMME22_ROADMAP.md` (non testé).
