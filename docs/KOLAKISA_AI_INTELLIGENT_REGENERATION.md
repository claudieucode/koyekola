# Régénération intelligente — vue d'ensemble

```
demande (français) → analyse → contexte (identifiants) → dépendances → périmètre MINIMAL → impact → proposition (aperçu avant/après, rien d'écrit)
   → [confirmation si impact élevé] → contrôles (droits, protections, conflits, révision) → snapshots « avant » → écriture du BROUILLON → snapshots « après » → journal → annulation / restauration possibles
```

## Règles
1. **Périmètre minimal** : propriété < champ < section < page < design ; toute extension est expliquée (`plan.why`, `plan.escalation`) et exige confirmation. Une demande locale n'exécute jamais une modification globale : un composant ou une ressource partagés déclenchent une confirmation explicite.
2. **Pas de moteur parallèle** : textes → Content Generator (`reviseValue`, `generatePage`, `apply`) ; images → AI Media ; design → personnalisateur natif (brouillon) ; styles et sections → normaliseurs natifs via `pages.saveDraft` (une valeur invalide est refusée, rien n'est écrit).
3. **Une proposition ne modifie rien.** L'application revérifie tout (droits de la route, appartenance au site, protections, empreintes de conflit, révision de la page).
4. **Jamais publié** : tout va dans les brouillons.
5. **Clarification plutôt qu'arbitraire** : page, section ou valeur ambiguë → questions avec candidats ; aucune opération enregistrée.
6. **Honnêteté** : ce qui n'a pas d'action sûre (taille du titre d'une section native, adaptation mobile, restyle d'une page entière) est dit « non pris en charge » avec la raison.

## Exécuteurs
| Exécuteur | Périmètre | Appel IA | Écrit |
|---|---|---|---|
| `style_section` | un attribut de style natif (fond, espacement, alignement, largeur) | non | style de la section |
| `style_node` | taille de texte d'un élément d'une section libre | non | `styles.desktop.fontSize` |
| `text_field` | un seul texte | 1 (`reviseValue`) | ce champ |
| `text_section` | les textes d'une section | 1 (`generatePage` ciblé) | via `contentGen.apply` |
| `text_page` | les textes d'une page (confirmation requise) | 1 | via `contentGen.apply` |
| `design_token` | une couleur du design (confirmation requise) | non | brouillon du personnalisateur |
| `image` | génération d'UNE image (démo) | non (AI Media) | rien tant que l'image n'est pas associée |
| `add_section` | une section native ajoutée à une position | non | insertion |
