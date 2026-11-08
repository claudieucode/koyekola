# Pieds de page : export, import, duplication, partage (chantier G, 7 novembre 2026)

Code : `src/themeBuilder/footerPortable.js` (nouveau), `src/themeBuilder/portable.js` (aiguillage, ancien format conservé), routes dans `src/marketing/web/themeBuilder.js`, écran `public/js/theme-builder.js` + `views/marketing/theme-builder.ejs`. Tests : `tests/footer-import-export.test.js`. Aucune migration.

## 1. Écran
* Menu « ⋯ » d'un pied : **Exporter (JSON)** (sans conditions), **Exporter avec les conditions**, **Dupliquer**.
* Barre du haut : **Exporter les pieds** (tous les pieds du site en une archive) et **Importer** (un fichier, un pied ou une archive).
* À l'import d'un fichier de pied, une boîte de confirmation montre AVANT : nombre de pieds, nombre d'éléments, avertissements. Rien n'est créé tant que l'on ne confirme pas.

## 2. Routes (droits existants)
| Route | Droit | Rôle |
|---|---|---|
| `GET …/api/modeles/:id/export.json[?conditions=1]` | lecture | un pied (autres types : format historique inchangé) |
| `GET …/api/modeles/export-lot.json[?ids=1,2][&conditions=1]` | lecture | archive (sans `ids` : tous les pieds non archivés, 50 au plus) |
| `POST …/api/importer-apercu` `{payload}` | écriture | aperçu, AUCUNE écriture |
| `POST …/api/importer` `{payload}` | écriture | import en brouillon (réponse : `template`, `templates`, `warnings`) |
| `POST …/api/modeles/:id/dupliquer` | écriture | duplication dans le même site |

## 3. Format du fichier
Un pied : `kolakisa-footer-template@1`
```json
{
  "format": "kolakisa-footer-template@1",
  "formatVersion": 1,
  "exportedAt": "2026-11-07T10:00:00.000Z",
  "generator": "Kolakisa Footer Builder",
  "template": { "type": "footer", "name": "Pied principal", "conditions": { "include": [], "exclude": [] } },
  "document": { "kind": "component", "section": { "type": "layout", "children": [ "…widgets, styles, responsive, états…" ] } },
  "media": [ { "url": "/uploads/marketing/1/site-2/logo.png", "origin": "mediatheque" }, { "url": "https://cdn.exemple.fr/x.png", "origin": "externe" } ],
  "summary": { "elements": 7, "types": { "heading": 1, "button": 2 } },
  "notes": [ "Les conditions d'affichage ne sont pas incluses : …" ]
}
```
* `template.conditions` est ABSENT par défaut ; présent seulement avec l'option « avec les conditions » (numéros d'articles, pages, auteurs, parents retirés, signalé dans `notes`).
* `document.section` = la copie de travail (brouillon) telle que l'éditeur la montre ; styles, responsive, états et réglages de chaque widget font partie de la section.
* Archive : `kolakisa-footer-bundle@1` = `{ format, formatVersion, exportedAt, generator, count, templates: [ <fichiers de pied> ] }`.
* Ancien format `kolakisa-theme-template@1` d'un pied : toujours importable.
* Jamais exportés : numéro/nom du site ou de l'organisation, utilisateurs, données d'entreprise (adresse, horaires…), numéros de formulaires (retirés, à reconfigurer). Les étiquettes `{{business.city}}`, `{{site.year}}`… restent telles quelles et se rempliront avec les données du site d'arrivée.
* Médias : seulement des **références** listées dans `media`. Aucun fichier n'est embarqué (option « inclure les médias » non offerte : voir limites).

## 4. Import : ce qui est vérifié
1. Taille ≤ 2 Mo ; JSON valide ; objet ; version (seule la 1 est lue, sinon « Version N non prise en charge… »).
2. Format reconnu (pied, archive, ancien format de pied) ; archive ≤ 50 pieds, chacun du bon format.
3. Chaque élément est re-validé par les normaliseurs natifs de l'éditeur : un **widget inconnu** ou invalide est **retiré** avec un avertissement ; les liens suivent les règles de l'éditeur (`tel:` et `mailto:` autorisés, `javascript:`, `data:`, `vbscript:`, `file:` supprimés) ; le HTML passe par le nettoyeur natif ; `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>` sont retirés des textes.
4. Limites : 1 500 éléments, 24 niveaux d'imbrication (sinon refus).
5. Images de la médiathèque d'une AUTRE organisation : vidées (avertissement) ; d'un autre site de la même organisation : conservées avec avertissement.
6. Identifiants de tous les éléments **régénérés** (les interactions « au clic, afficher… » suivent les nouveaux identifiants).
7. Conditions éventuelles revalidées pour un pied ; sinon aucune.
8. Résultat : pied en **brouillon**, jamais publié ; nom en conflit → « Copie de … » (puis « (2) »). Une archive est importée en bloc : si un pied est refusé, rien n'est créé. Le pied appartient au site courant (le site vient de l'adresse, jamais du fichier).

## 5. Duplication et copie vers un autre site
* **Dupliquer** (même site) : copie de la copie de travail, en brouillon, nom « Copie de … », **sans les conditions** (évite un conflit de publication ; on les redéfinit). Les autres types gardent le comportement historique.
* **Vers un autre site de l'organisation** : uniquement par export puis import explicites ; aucun partage automatique.
* **Modèle réutilisable** : le pied est déjà un composant enregistré du site, mais il n'existe pas de « bibliothèque personnelle » de pieds à ce jour ; la réutilisation passe par duplication / export-import. Limite documentée, rien d'ajouté.

## 6. Limites connues
* Pas de `.zip` ni d'import de médias : les images restent des adresses ; une image du site d'origine doit être renvoyée dans la médiathèque d'arrivée.
* Un widget d'abonnement e-mail avec formulaire précis ou un formulaire d'inscription perd son numéro de formulaire (ou est retiré) : à reconfigurer.
* Les réglages du site (menus, identité, données d'entreprise) ne voyagent pas.
* Les droits spéciaux par widget (ex. HTML avancé) sont revérifiés à la création : un import peut être refusé en entier si l'utilisateur n'y a pas droit.
* L'aperçu avant import est une boîte de confirmation texte (pas de rendu visuel). Aucune vérification dans un navigateur réel n'a été faite pour l'écran (JS contrôlé seulement par `node --check`).
