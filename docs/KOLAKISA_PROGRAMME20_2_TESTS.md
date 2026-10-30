# Programme 20.2 — Tests (2026-10-29)

Commande : `TEST_START_TIMEOUT_MS=900000 ENCRYPTION_KEY=<64 zéros> node --test --test-concurrency=1 <fichiers>` ; serveurs et bases réels, machine partagée et chargée (charge 9 à 40).

## Nouveau : `tests/programme20-2-site-builder.test.js` — 8 / 8
| Scénario | Résultat |
|---|---|
| Création atomique : panne simulée du journal (déclencheur SQL) → aucun site créé, aucun succès annoncé ; panne levée → création réussie | OK ; **mutation vérifiée** : sans le correctif de `createSite`, le test échoue (site à moitié créé) |
| Double soumission côté serveur (deux POST identiques) : un seul site, second refusé clairement | OK |
| Double soumission côté navigateur : `data-mk-once` sur le formulaire, gestion dans `shell.js`, rétablissement au retour d'historique | OK (contrôle statique, pas de clic réel dans un navigateur) |
| Liste : « En préparation » sans page en ligne, « Publié » avec une page en ligne ; lien Réglages dans le menu | OK |
| Liste : aucun état de publication pour un site archivé | OK |
| Isolation, membre limité au site A face au site B : 6 pages d'administration refusées sans fuite de nom | OK |
| Isolation : 4 écritures vers B refusées, B inchangé et sans domaine | OK |
| Isolation : page de B ouverte/aperçue/écrite par identifiant seul : refusée, brouillon de B vide | OK |

## Régression : 117 fichiers qui utilisent la création ou la liste des sites (127 tests rejoués après tri)
Premier passage : 1 819 tests, 1 808 réussis, 11 échecs. Les fichiers en échec (6 fichiers, 127 tests) ont été rejoués **avec et sans** les modifications :
- **Sans les modifications (état de `main`) : 10 tests en échec**, dans `site-menu-c1*`, `site-menu-p1a-unitaire`, `entrees-fermees-preuves`, `portee-des-routes` (registre de menu : 68/70/75 entrées attendues), `cms-urls` (redirections), `effacer-donnees` (e-mail non envoyé) et `sante-du-site` (« onglet Informations », « modules : activés sur A… »). `sante-du-site` passe pourtant seul (19 / 19) : instabilité à l'enchaînement ou sous charge, non analysée.
- **Avec les modifications : les mêmes 10, plus un seul** : `admin-multisite.test.js` « marketing : aucune route ni fichier de vue du module Marketing n'a été modifié » (et sa suite parente). Ce test exécute `git diff HEAD -- src/marketing/web views/marketing` : il échoue tant que `views/marketing/sites.ejs` n'est pas dans un commit. **Rejoué après le commit : `admin-multisite` et le nouveau test, 34 / 34 réussis.**
- Conclusion : **aucune régression attribuable au Programme 20.2** dans les 117 fichiers examinés ; les 10 échecs ci-dessus préexistent sur `main` et ne sont pas corrigés ici.

## Non exécuté
Suite complète (plus de 700 fichiers), tests navigateur (`*-navigateur.test.js`), vérification d'un domaine réel (DNS et HTTPS), Safari et Firefox.
