# Programme 21 — état des fournisseurs d'IA

**Aucun fournisseur n'a été appelé en conditions réelles pendant le programme 21** (aucune clé disponible, aucune dépense autorisée). « Testé » signifie : contre un fournisseur simulé ou un faux serveur local.
| Fournisseur | Usage | Code | État réel | Coûts | Restrictions connues |
|---|---|---|---|---|---|
| Anthropic | texte (brief, plan, contenus, design en option) | `services/aiCore.js` (SDK) via `ai.call` ; adaptateur dans `src/ai` | **utilisé par le code en service**, jamais vérifié ici faute de clé | non suivi en coût (plafond de requêtes par jour et par organisation) | clé du centre de connecteurs ou `ANTHROPIC_API_KEY` |
| OpenAI (texte) | AI Core | `src/ai/adapters/openai.js` | écrit, testé simulé, non branché | estimé via le registre (tarif à vérifier) | — |
| Gemini, Mistral (texte) | AI Core | adaptateurs | idem | idem | — |
| OpenAI Images | médias | `aiMedia/providers.js` (réseau des connecteurs) | **écrit d'après la documentation publique, testé contre un faux serveur, jamais appelé en réel : NON VÉRIFIÉ** | tarif inconnu (« estimation impossible »), coût réel jamais renvoyé | exige IA activée pour le site, fournisseur autorisé dans l'AI Core, clé, et **autorisation de dépense** de l'organisation |
| Démonstration | médias | `aiMedia/providers.js` | local, déterministe, sans IA | 0 | visuels d'attente marqués comme tels |
| Google Imagen, Stability, Flux | médias | — | **NON INTÉGRÉS** (listés comme tels dans l'écran) | — | — |
Pays pris en charge, quotas et conditions d'utilisation de chaque fournisseur : **non vérifiés** ; l'application ne suppose aucune disponibilité par pays (voir audit international).

## Comportements testés (simulés)
Fournisseur indisponible, clé invalide (401), quota dépassé (429/crédit), délai dépassé, réponse invalide (JSON illisible, vide, Base64 invalide), refus de politique (400), génération interrompue (annulation), nouvelle tentative contrôlée (3 au plus), quota de l'AI Core avant l'appel (aucun appel au-delà), tarif non vérifié + limite de coût = refus. Changement de fournisseur : choix explicite par la personne (pas de bascule automatique des images).
## Coûts
Estimations distinguées des coûts réels : le coût réel est toujours « inconnu » (aucun fournisseur ne le renvoie par l'API de génération).
