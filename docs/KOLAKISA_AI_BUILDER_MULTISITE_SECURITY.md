# KOLAKISA — Assistant IA : multisite et sécurité

## Isolation
- Un **projet appartient à un site** (celui du plan, relu en base). Un accès limité à un site (`ctx.siteScope`, posé par le serveur) ne voit **que** les projets de CE site : liste, état, modification, assistant, génération, publication → 403/404 pour tout autre. Le site visé est dans l'adresse (`?site=`), **revérifié** (membre du site, module actif) : viser un autre site ne contourne rien (testé).
- Un accès limité **ne peut pas créer de site** ; il ne peut pas viser un autre site à la création (le serveur impose le sien, testé).
- Les pages, le design, les textes et les médias sont ceux du site du projet ; chaque service re-vérifie le site (`siteOf`) et l'organisation.
- Conversation et copies d'annulation sont rattachées à un plan : accès toujours via le plan filtré. Une proposition d'un autre projet n'est pas acceptable (404).
- Le **module « ia » du site** doit être activé pour un accès limité (403 sinon) ; la route `/ia/studio` hérite de la garde du préfixe `/ia`. Les routes sont déclarées dans `routeScopes.js` (test d'énumération).
- Tables nouvelles (`mk_ai_builder_*`) classées dans l'inventaire des tables (sans colonne de site, rattachées au plan).

## Permissions (côté serveur)
Lecture `forms.read` · écriture `forms.write` · design `appearance.styles` · publication `pages.publish` · autorisation de dépense d'images réelles `settings.write` + équipe (règle du 21.7). Un lecteur sans droit reçoit 403 sur toute route. L'interface masque les boutons non autorisés **mais ne s'y fie pas**.

## Sécurité des données
- Aucune clé dans le navigateur, les réponses, l'état, la base de conversation (testé). Les fournisseurs d'images n'exposent que `usable` et la raison.
- Tout texte venu du serveur ou de l'IA est inséré avec `textContent` ; l'état embarqué dans la page est échappé (`<`, U+2028/2029). Un message hostile (`<img onerror>`, `<script>`) reste inerte (testé dans Chrome).
- L'assistant ne s'exécute pas lui-même : il propose, la personne accepte. Aucun contenu généré n'est exécuté.
- Les opérations destructives (supprimer une page/section) exigent une confirmation et sont annulables ; l'assistant n'en propose jamais.
- `restoreState` n'est pas une opération du catalogue : elle n'est pas joignable par l'API de modification, et son contenu vient d'une copie enregistrée par le serveur.
- Coûts : une génération d'image annonce son estimation (`estimé` / `inconnu`) **avant** envoi et respecte l'autorisation de dépense et les quotas du moteur 21.7.

## Non couvert
Limitation de débit par utilisateur propre à cette interface (celle des moteurs s'applique) · journal d'audit dédié aux actions de l'interface (les moteurs journalisent les leurs) · test de charge.
