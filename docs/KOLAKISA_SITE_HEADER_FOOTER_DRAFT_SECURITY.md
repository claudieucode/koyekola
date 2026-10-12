# Mission 9.1 — sécurité

| Contrôle | Où | Preuve |
|---|---|---|
| Aperçu privé réservé à l'équipe | `forms.read` (même niveau que l'aperçu des pages), composant résolu dans l'organisation de la session | test serveur : anonyme et compte extérieur → pas de contenu du brouillon (statut 302/401/403/404) ; lecteur de l'équipe → 200 |
| Aucune URL publique de brouillon | l'aperçu est sous `/marketing/…` (connexion obligatoire) ; le public `/p/<slug>` ne lit jamais `draft` | test : le brouillon n'apparaît jamais dans `/p/…` avant « Mettre à jour » |
| Écriture / publication côté serveur | `PUT …/brouillon`, `POST …/mettre-a-jour`, `…/abandonner` : `forms.write` | test : lecteur, compte extérieur et anonyme refusés, rien publié |
| Pas de publication par un autre chemin | `POST /site-web/composants/:id` avec `section` refusé (422) pour en-tête / pied / variante | test |
| Isolation entre sites | l'aperçu ignore une `page` d'un autre site ; `setSiteParts` refuse un composant réservé à un autre site (existant) ; `movePage` retire la variante de l'ancien site (mission 9) | test |
| Identifiants invalides | route `:id(\d+)` ; composant inexistant → 404 | test (`99999999`, `0`, `abc`) |
| Contenu du brouillon | repasse par `normalizeContent` / `componentSection` (mêmes assainissements et validations d'adresses que les pages) | inchangé ; refus d'une 2e section testé (existant) |
| Erreurs | messages métier, sans chemin ni SQL | constaté |
| Écrasements silencieux | révision + 409 sur enregistrement, mise à jour, abandon | tests serveur et Chrome |

## Limites
- Le lecteur (`viewer`) voit l'aperçu des brouillons : comportement identique à l'aperçu des pages, choisi par cohérence ; si les brouillons d'en-tête doivent être réservés aux rédacteurs, il suffit de passer la route à `forms.write`.
- Isolation entre organisations : requêtes filtrées par `organization_id` (relu), pas de test multi-organisations écrit.
- Aucune vérification de contenu hostile propre à cette mission (les validations sont celles du palier 8).
