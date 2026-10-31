# Tests de génération de bout en bout — 22.10

Laboratoire : `tests/quality-lab/` (22.1) **étendu à 21 scénarios** (6 ajoutés : agence digitale, cabinet juridique, produits numériques, voyage, événementiel, consultant). Lancement : `npm run quality:lab` ; résultats complets : `docs/quality-lab/results.json`. Vrai serveur, vraie base, vraies migrations, **aucun fournisseur d'IA**, aucun coût, aucune donnée de production.

## Chaîne exercée (par scénario)
brief → pays/langue (règles) → plan (catalogue 20.6) → direction artistique (21.5) → génération des pages (21.4) → application en brouillon → publication native → lecture de `/p/<slug>` → analyse statique du HTML/CSS.
Étapes de la liste demandée **non exercées** par le labo : analyse du brief par un modèle, médias (aucun), adaptation responsive mesurée, rechargement dans l'éditeur, modification dans l'éditeur (navigateur), contrôle SEO 22.6.

## Résultats (21 scénarios, code `35603ee2` + correctif Q3)
| Mesure | Valeur |
|---|---|
| Scénarios exécutés sans erreur serveur | 21 / 21 |
| Pages générées / publiées lisibles / non publiables d'origine | 100 / 74 (HTTP 200) / 26 |
| Note moyenne, borne basse (non mesuré = 0) | **48,4 / 100** ; 75,1 % du mesurable |
| Scénarios plafonnés par défaillance critique | 4 : boutique, mode, informatique, produits numériques |
| Structures d'accueil distinctes | **1 sur 21** (`hero>text>features>testimonials`) |
| Couleurs primaires distinctes | 19 sur 21 |
| Pages avec image / méta description / texte d'exemple entre crochets | 0 / 0 / 59 sur 74 |

Notes par scénario (borne basse /64,5 mesurable) : consultant 78,0 % · photographie 77,7 % · agence 77,4 % · éducation 77,2 % · entreprise 77,1 % · institutionnel 77,1 % · immobilier 76,7 % · services 76,9 % · juridique 76,9 % · blog 75,7 % · santé 75,5 % · tech 75,0 % · restaurant 74,9 % · construction 74,7 % · portfolio 74,4 % · boutique 72,9 % · mode 72,7 % · informatique 72,7 % · événementiel 71,6 % · numérique 71,2 % · voyage 70,4 %.

## « Un test n'est pas réussi parce qu'une page a été créée »
Écarts brief ↔ résultat des 6 nouveaux scénarios :
- **Voyage** : la page « Chambres » attendue est typée `services` (type « chambres » absent du Page Generator) ; la page `services` est signalée comme peu pertinente.
- **Événementiel** : « Inscription » et « Merci » sont typées `autre` ; aucune page Programme / Intervenants alors que le brief les demande.
- **Juridique** : deux pages « Contact » (doublon) ; sensible : aucune promesse de résultat générée (contrôle d'affirmations non sourcées OK).
- **Produits numériques** : catalogue de **formations** à la place d'une boutique de produits téléchargeables.
- **Agence, consultant** : structures cohérentes avec le brief.
