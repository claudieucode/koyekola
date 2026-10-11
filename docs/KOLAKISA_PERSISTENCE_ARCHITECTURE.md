# Architecture de la persistance

```
change() ──► scheduleSave ─► [Non enregistré] + copie locale (localStorage) ─► 1 s ─► save()
                                                                         │ un seul vol à la fois (saving / inflight)
        PUT /brouillon {content, revision} ──► normalizeContent ─► UPDATE … WHERE revision = ? ─► point d'historique
              │ 200 → revision++ ; « Enregistré » si rien de plus récent ; copie locale effacée
              │ 409 → bloqué (le plus récent n'est jamais écrasé), copie locale gardée
              │ 422 → message, élément fautif ; 401 → « Session expirée » + essais ; 5xx / réseau → essais 5…25 s
saveNow() = attend le vol en cours (inflight), puis envoie ce qui est arrivé entre-temps, puis confirme
publication  = saveNow() ─► POST /publier.json (transaction : version + sections publiées + brouillon vidé + révision++)
aperçu / export / retour à la liste = saveNow() ─► (échec : l'aperçu ne s'ouvre pas ; la navigation déclenche l'alerte de fermeture)
```

## Trois états du document
| État | Où | Quand |
|---|---|---|
| **édité** | mémoire de l'éditeur (+ copie locale) | à chaque `change()` |
| **enregistré (brouillon)** | `mk_landing_pages.draft` + `revision` | réponse 200 de `PUT /brouillon` |
| **publié** | `mk_landing_pages.sections` + `mk_page_versions` | `publier.json` ; le brouillon est alors vidé |
Publier ne publie **que** l'état enregistré ; l'éditeur ne lance la publication qu'après confirmation du serveur (et refuse si l'enregistrement a échoué).

## Garanties et leurs limites
* Ordre : une seule requête en vol ; la révision attendue est celle de la **dernière réponse**. Pas de numéro de séquence nécessaire.
* Concurrence : verrou optimiste (`revision`) ; pas de fusion automatique entre onglets : le second est bloqué.
* Idempotence : republier un contenu identique ne crée pas de version.
* Récupération : copie locale (non chiffrée, dans ce navigateur, la dernière modification seulement).

## Dépendances à préserver (missions 9 et 10)
Les modèles de site (en-tête, pied de page…) sont des *composants* avec leur propre cycle (diffusion directe ou brouillon) : ils doivent réutiliser `saveNow()` avant toute action et le même verrou de révision.
