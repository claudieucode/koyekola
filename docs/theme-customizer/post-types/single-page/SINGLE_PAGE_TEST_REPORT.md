# Page individuelle : rapport de tests (résultats réels)

Machine très chargée : chaque fichier est lancé seul, avec `TEST_START_TIMEOUT_MS=900000`.

## Nouveaux tests
| Fichier | Résultat |
|---|---|
| `tests/personnalisateur-page-individuelle.test.js` (moteur + vraies routes, base réelle) | **17 réussis, 0 échec** |
| `tests/personnalisateur-page-individuelle-navigateur.test.js` (vrai Chrome) | **2 réussis, 0 échec** |

Couverture du premier fichier : validation stricte ; priorité exception > global > défaut ; quatre largeurs et trois styles réellement distincts ; marge interne ≠ marge externe ; valeurs par appareil sous les points de rupture ; largeur personnalisée ignorée tant que « Par défaut » ; un seul H1 ; rubrique présente pour un site, absente du site principal (avec explication) ; 12 + 12 réglages de marges ; aperçu non publié sans écriture ; refus d'une valeur invalide (422) ; publication écrite dans `mk_sites.settings` puis rendu de la page de A **et** B intact ; zone de titre activée / désactivée / page déjà titrée ; colonne latérale vide = aucune colonne, avec widget réel = grille, gauche / droite, tablette (après / avant / masquée), style encadré ; widgets propres à chaque site ; exception par page (écrite après le global, autres pages inchangées, réinitialisation) ; page d'atterrissage non touchée ; page vide.

Couverture Chrome : groupe « Types de publication », onglets Général / Design, vignettes (le clic change la vraie page dans l'aperçu), boutons à choix, largeur personnalisée (champs masqués puis visibles), marges à quatre côtés liées puis déliées, valeurs indépendantes par appareil (le mobile est vide, l'ordinateur intact), rien d'enregistré avant « Publier », publication puis rendu public ; aucun débordement horizontal du panneau ni de la page à 1440, 820 et 390 px.

## Tests existants relancés (non-régression)
| Fichier | Résultat |
|---|---|
| `personnalisateur-complet` | 13 réussis |
| `personnalisateur-etendu` | 8 réussis |
| `site-web-reglages-theme` | 21 réussis (après correction : mon CSS écrivait une règle d'alignement même pour un site vierge) |
| `format-mise-en-page` | 13 réussis |
| `apparence-widgets` | 30 réussis |
| `personnalisateur` | **24 réussis** après mise à jour de la liste des panneaux (un passage intermédiaire a échoué sur « Pas de réponse en 30 s » à cause de la charge de la machine, puis a réussi au passage suivant) |

## Régressions trouvées et corrigées
1. Liste de panneaux attendue dans `personnalisateur.test.js` (mise à jour).
2. Site vierge : règle `text-align:left` émise par défaut (corrigée : rien n'est écrit pour une valeur par défaut globale).

## Non testé / non prouvé
- Pas de test sur un **thème paquet** réel ni sur plusieurs thèmes (la rubrique est dans `ALWAYS`, donc visible, mais l'interaction avec le CSS de chaque paquet n'est pas vérifiée : un paquet qui redéfinit `.lp-main` l'emporte sur le global).
- Pas de test de page très longue ni avec beaucoup de widgets.
- Pas de test d'annulation / rétablissement propre à cette rubrique (le mécanisme du personnalisateur est partagé et testé ailleurs).
- Pas de capture visuelle comparative canvas / site publié ; l'aperçu utilise la vraie page du site.
- Aucune vérification sur le site déployé (la fusion et le redéploiement sont faits par vous).
