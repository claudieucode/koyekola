# 17 — Inventaire fonctionnel consolidé

_10 octobre 2026. Aucun pourcentage de complétion n'est annoncé : le périmètre lu d'Elementor est un échantillon (voir README), un pourcentage serait trompeur._

## Décomptes (matrice `18-kolakisa-elementor-gap-analysis.md`)
| Mesure | Nombre | Définition |
|---|---|---|
| Fonctionnalités recensées dans la matrice | **33** | lignes de la matrice (une ligne peut regrouper plusieurs réglages) |
| Applicables à KOLAKISA | **31** | recensées moins 1 « non applicable » (CSS par widget) et 1 couverte par un autre module (Formulaires) |
| Absentes | **2** | lignes 17 (points de rupture personnalisés) et 26 (coller depuis un autre site) |
| Incomplètes | **0** | la galerie (ligne 6) a été complétée |
| Présentes, **vérifiées dans le code seulement** | **19** | « PRÉS » : pas de test de bout en bout dans cette session |
| Testées de bout en bout (cette session ou suites existantes citées) | **10** | « OPÉ » |
| **Ajoutées ou corrigées et validées dans cette mission** | **5** | lignes 1 (résolutions), 2 (fond d'image, photo de témoignage), 5 (visionneuse du widget Image), 6 (galerie), 7 (contour du texte) |
Total : 10 + 19 + 2 + 1 + 1 = 33.

## Ce que ces chiffres ne disent pas
- Elementor compte des dizaines de widgets ; seuls 8 ont été lus en détail (voir 03/04). Les autres ne sont **ni inventoriés ni comparés** ici ; la comparaison de la phase 1 (`ELEMENTOR_FEATURE_INVENTORY.md`) les traite par type de widget.
- « PRÉS » signifie « le code contient la propriété », pas « ça marche partout ».
