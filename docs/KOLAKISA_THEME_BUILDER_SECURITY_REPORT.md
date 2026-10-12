# Mission 9 — Theme Builder : rapport de sécurité

## Ce qui a été vérifié (avec un test M9 qui s'exécute à chaque suite)
| Vérification | Résultat |
|---|---|
| Un **lecteur** (rôle `viewer`) ne peut ni enregistrer, ni diffuser, ni abandonner, ni supprimer un composant (PUT / POST directs, sans passer par l'interface) | refusé, le composant existe toujours |
| Un lecteur ne peut ni affecter ni retirer un modèle de thème (POST direct) | refusé, réglage inchangé |
| Identifiants invalides (`abc`, `-1`, `99999999`, `1;DROP TABLE posts`, type `<script>`, identifiant de modèle `zzzzzzzz`) | refusés sans effet, aucune erreur serveur |
| Une étape de tunnel ne peut pas servir de modèle | refusée |
| Un composant réservé à un site ne peut pas devenir l'en-tête / le pied de page d'un autre site | refusé (existant `site-web-entete` + M9) |
| Une variante d'en-tête d'un site ne s'affiche pas sur une page d'un autre site (déplacement) | corrigé (T5) |
| Un pied de page ne sort pas de son site | M9 |
| Écrasement silencieux entre deux sessions (révision) | corrigé (T1/T2) |
| Une page archivée ne laisse pas de modèle actif orphelin | corrigé (T6) |
| Le 404 d'un modèle reste un vrai 404 | M9 |
| Les erreurs renvoyées sont des messages métier (« Ce composant a été modifié ailleurs… ») sans chemin, requête SQL ni trace | constaté sur les réponses des tests |

## Relu mais non testé par cette mission
- Isolation **entre organisations** : toutes les requêtes des composants, modèles et parties de site filtrent `organization_id` (relu dans `pages/index.js` et `themeTemplates.js`) ; aucun test multi-organisations n'a été écrit ici.
- Assainissement du contenu d'un composant : `componentSection` repasse par `normalizeSection` (mêmes règles que les pages, dont les adresses `linkUrl`) ; les 1 092 charges hostiles du palier 8 couvraient les widgets, pas rejouées ici sur un composant.
- Droits d'édition des widgets à droits spéciaux : `checkWidgetRights` est appelé aux mêmes endroits qu'avant.

## Points d'attention
- Le même réglage `theme.templates` est modifiable depuis deux écrans (Site Web : `forms.write` ; Apparence : `appearance.templates`). Les deux droits sont attribués au rôle « éditeur » (`organizations.js`), donc pas d'écart aujourd'hui ; si ces rôles divergent un jour, un des deux écrans contournera l'autre.
- L'en-tête et le pied de page d'un site sont diffusés dès qu'un éditeur enregistre (L1) : un éditeur malveillant ou distrait publie immédiatement. Ce n'est pas une faille d'autorisation (le droit d'écriture est vérifié), mais un risque de publication non voulue.
- `explain` / `resolution.json` sont en lecture (`forms.read`) et ne renvoient que des noms de pages et conditions que le même rôle voit déjà dans la liste des modèles.
