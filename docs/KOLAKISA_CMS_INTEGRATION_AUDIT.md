# Intégration au CMS — audit 22.10

*Programme 22.10 — 2026-10-30. Légende : ✅ vérifié par un test ou une mesure exécutés ici · 🟡 vérifié par lecture/tests antérieurs (non rejoué) · ⛔ défaut constaté · ⚪ non évalué.*

| Exigence | Preuve | Statut |
|---|---|---|
| Pages natives modifiables après génération | `gen.apply` appelle `pages.createPage` + `saveDraft` ; la page s'ouvre dans l'éditeur (`page-generator` A) ; aucune table propriétaire de contenu | ✅ |
| Aucun second CMS | les moteurs 21-22 écrivent dans les tables du CMS (pages, sections, SEO, médias) ; tables annexes `mk_ci_*`, `mk_ai_*` = métadonnées | ✅ |
| Publication native | labo : 74 pages publiées via la publication native, lues sur `/p/<slug>` (HTTP 200) | ✅ |
| Duplication / restauration | instantanés 21.9 ; duplication de page du CMS non rejouée ici | 🟡 |
| Menus, domaines, utilisateurs, permissions | menus : étape « menu » du studio non exécutée par le labo ; permissions : voir audit sécurité | 🟡 |
| Thèmes / Design Tokens | direction artistique 21.5 appliquée au site (labo : 19 couleurs primaires distinctes sur 21) | ✅ |
| Articles | Blog Studio existant ; **non branché** sur l'évaluation 22.6 | ⛔ partiel |

**Défaut de contenu natif constaté :** la publication native **ne bloque pas** les textes d'exemple (59/74 pages publiées en contiennent). Le moteur 22.6 les détecte mais n'est pas appelé à la publication.
