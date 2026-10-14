# KOLAKISA CMS — Correction prioritaire de la parité (audit + plan)

Date : 14 octobre 2026 · Base examinée : `4c3656d` (P1a, en production) · Statut : **audit et plan seulement — aucun code modifié, rien poussé, rien déployé, aucune migration.**

Méthode : lecture du code déployé, puis deux sondes exécutées sur la **base d'essai locale** (deux sites Alpha et Beta, un compte équipe, un membre limité au site Alpha). Les sondes sont dans la session (`scratchpad/v9/`), pas dans le dépôt. **Rien n'a été fait en production.**

---

## 0. Ce qui est reconnu d'emblée

- Les deux défauts constatés sur vos captures sont **réels et reproduits en local**.
- Mon rapport P1a annonçait « A1 : 14 groupes + Marketing du site — vérifié ». Cette phrase était exacte pour **les noms de groupes** et trompeuse pour **leur contenu** : je n'ai pas vérifié que les sous-menus étaient les mêmes. Ils ne le sont pas (voir §1). C'était un critère mal formulé, pas seulement une différence esthétique.
- Une partie de l'écart est la conséquence du plan P1 que vous aviez validé (décision 7 : modules « Outils », « Paramètres », « Utilisateurs » repoussés à P1b/P1c). Cette décision est maintenant **remplacée** par votre exigence de parité complète : le périmètre ci-dessous passe avant P1b/P1c.

---

## 1. Défaut A — le menu d'un site n'a pas la structure du CMS principal

### 1.1 Constat chiffré (sonde locale, `cmsNav.js` à `4c3656d`)

| | CMS principal (registre `SECTIONS`) | Site créé (`siteSections`) |
|---|---|---|
| Groupes | 14 | 15 (+ « Marketing du site ») |
| Entrées | **66** | **25** |
| Articles | 9 sous-entrées | 1 « Bientôt » |
| Apparence | 7 | 2 (« Design du site », « En-tête et pied de page », **qui ouvrent la même page `/reglages` avec deux ancres**) |
| Commentaires | 5 | 1 « Bientôt » |
| **Utilisateurs** | 5 (Tous, Inviter, Rôles, Permissions, Invitations) | 1 (« Équipe du site ») |
| SEO | 9 | 1 « Bientôt » |
| Redirections | 3 (Redirections, Liens cassés, Permaliens) | 1 |
| **Outils** | 11 | 1 (« Santé du site ») |
| **Paramètres** | 11 | 1 (« Réglages du site ») |
| Pages | 1 | 2 (+ « Composants », absent du principal) |

### 1.2 Cause démontrée (pas un filtrage, pas un oubli : une seconde définition)

1. **`cmsNav.js:166-205` : `SITE_MODULES` + `SITE_PLAN` sont une seconde définition du menu**, écrite à la main. Le registre `SECTIONS` ne fournit au menu d'un site que **le nom, l'icône et l'ordre des groupes** ; les entrées, leurs libellés (« Équipe du site », « Réglages du site », « Design du site »), leurs adresses et leur état viennent de cette table parallèle. P1a a donc rapproché les *en-têtes*, pas la *structure*.
2. **Un groupe à une seule entrée est aplati.** `buildSiteNav` marque `flat: items.length === 1` (`cmsNav.js:279`) et les deux vues (`cms-nav.ejs:3`, `top.ejs:90`) affichent alors **l'entrée à la place du titre du groupe**. C'est exactement ce que vous voyez : le groupe « Utilisateurs » existe, mais s'affiche « Équipe du site » ; « Outils » s'affiche « Santé du site » ; « Paramètres » s'affiche « Réglages du site ». Ce n'est pas du filtrage : c'est le rendu d'une liste réduite à un élément.
3. **Les sous-entrées manquantes sont absentes par décision de plan, pas par impossibilité.** `SITE_PLAN` ne liste pour `outils` que `["outils"]`, pour `parametres` que `["reglages"]`, pour `utilisateurs` que `["equipe"]` (`cmsNav.js:199-210`). Or la sonde montre que beaucoup de ces écrans **savent déjà travailler pour un site** :
   - **Outils** : 8 des 11 écrans réagissent à `?site=` et prennent le cadre du site (Santé, Importer, Exporter, Diagnostic, Informations système, Maintenance, Caches, Outils de contenu). Non pris en charge : Corbeille, Sauvegardes, Journal.
   - **Paramètres** : 7 des 11 écrans changent selon le site (Général, Lecture, SEO, Confidentialité, Indexation, Emailing, Avancé). Quatre (Commentaires, Médias, Permaliens, Tunnels) **redirigent** quand un site est demandé : pas de réglage propre à un site.
   - **Utilisateurs** : la liste réagit au site ; Inviter / Rôles / Permissions / Invitations ne réagissent pas (identiques pour A et B).
   - **Redirections** : réagit au site ; Liens cassés et Permaliens non.
4. **Les écrans « propres au site » dupliquent des écrans du principal** (`siteSpace.js` : `redirections`, `equipe`, `composants`, `pages` sont des écrans en lecture seule réécrits), au lieu d'ouvrir l'écran existant avec le site fixé. C'est la même cause : un second chemin parallèle.

### 1.3 Ce qui n'est PAS prêt pour un site (ne doit pas être activé sans isolation)

La sonde `?site=A` contre `?site=B` donne des pages **identiques** pour : Articles (9), Médias, Navigation, Apparence (7), Commentaires (5), SEO (9), Liens cassés, Permaliens, Utilisateurs (Inviter, Rôles, Permissions, Invitations), Outils (Corbeille, Sauvegardes, Journal). Ces écrans afficheraient les données du site principal ou de tous les sites : ils restent **indisponibles** (« Bientôt », texte explicite, aucune donnée, aucune action) jusqu'à leur lot d'isolation (B2–B6, P2). Corbeille reste « Bientôt » (décision 8).

---

## 2. Défaut B — des opérations ramènent au CMS principal

### 2.1 Parcours tracé : Mes sites → Ouvrir → Pages → Ajouter → éditeur → Enregistrer → retour

Sonde locale, site Alpha (id 1), Referer = `/sites/1/pages` pour les actions lancées depuis la liste du site :

| # | Étape | Route réelle | Site utilisé | Résultat constaté |
|---|---|---|---|---|
| 1 | Liste des pages du site | `GET /sites/1/pages` | URL | bandeau Alpha, menu du site ✔ |
| 2 | Ajouter (formulaire) | `POST /marketing/pages`, champ caché `site_id=1` | **champ de formulaire envoyé par le navigateur** (`landing.js:98`) | page créée **dans le bon site** (base : `site_id=1`) ✔ ; redirection `302 → /marketing/pages/1` ✘ |
| 3 | Fiche de la page | `GET /marketing/pages/1` | aucun contexte de site | **ni bandeau, ni menu du site** : cadre du CMS principal ✘ |
| 4 | Éditeur (`?retour=pages`) | `GET /marketing/pages/1/editeur` | – | bouton de retour fixe `/marketing/pages` (liste globale) ✘ (`landing.js:347`) |
| 5 | Enregistrer la fiche | `POST /marketing/pages/1` | – | `302 → /marketing/pages/1` (fiche globale) ✘ |
| 6 | Publier | `POST /marketing/pages/1/publier` | – | `302 → /marketing/pages/1` ✘ |
| 7 | Création invalide (nom vide) | `POST /marketing/pages` | – | `302 → /marketing/pages` : liste du principal, le site est perdu ✘ |
| 8 | Création depuis l'éditeur (`creer.json`) | `POST /marketing/pages/creer.json`, `siteId` dans le corps | **corps envoyé par le navigateur** | page créée dans le bon site ✔ ; URL renvoyée `…/editeur?retour=pages` → retour vers la liste globale ✘ |
| 9 | Supprimer / Abandonner le brouillon | `POST …/supprimer`, `…/brouillon/abandonner` | – | `302 → /marketing/pages/1` ✘ |
| 10 | Archiver | `POST …/archiver` | – | `302 → /marketing/pages` (liste globale) ✘ |

**Cause démontrée :** les écrans de pages (`landing.js`) n'ont **aucune notion de site dans leurs adresses** (`/marketing/pages/:id…`). Le site n'existe que dans un champ caché à la création. Toutes les redirections de `attempt` pointent vers des adresses globales ; `kit.keepSite` (P1a) ne corrige que les **listes racines partagées** reconnues par le Referer (`/listes`, `/campagnes`…), pas les pages. Donc :
- **Données** : bien enregistrées dans le bon site (démontré : `site_id=1`). Pas de fuite constatée.
- **Contexte** : perdu dès la création. C'est le défaut que vous observez.

### 2.2 Autres constats liés (démontrés)

- **Le site vient du navigateur à la création** (`site_id` du formulaire, `siteId` du JSON), alors que la règle de l'espace est « le site vient de l'adresse ». Un formulaire sans `site_id` crée une page du **site principal** (démontré, étape 15 : équipe, Referer du site Alpha, `site_id` absent → page à `site_id = NULL`).
- **Accès par identifiant (IDOR) : sain.** Un membre limité au site Alpha reçoit **403** sur la fiche et l'éditeur d'une page du site Beta, **403** s'il tente de créer dans Beta (0 page créée), 403 sans `site_id`. L'équipe peut ouvrir toute page (comportement voulu), mais sans cadre de site.
- **Déjà correct** (preuves §2.1 et tests P1a) : listes d'Emailing (retour dans le cadre via `keepSite`), éditeur de composants (`back` = `/sites/N/reglages#entete`, `landing.js:389`), réglages du site (`/sites/N/reglages` : bandeau + menu, titre « Réglages du site · Alpha »).

### 2.3 Non vérifié (à dire clairement)

- Les liens **internes à l'éditeur visuel** (icône Accueil, « Reprendre mon travail », fil d'Ariane) : ils sont construits par du JavaScript côté navigateur, la sonde HTTP ne les voit pas. À vérifier en Chrome après correction.
- Les écrans en production : aucune connexion de ma part.
- Le comportement mobile des nouveaux écrans : à tester en Chrome (375 px).

---

## 3. Plan correctif (sans reconstruire le CMS)

### Principe d'architecture

> **Une seule définition du menu : le registre `SECTIONS`.** Le menu du principal et celui d'un site sont deux *vues* de ce registre, calculées par une même fonction. La seule chose propre au site est une **table d'aptitude** attachée aux clés du registre (jamais des libellés ni des groupes).

### Lot C1 — Menu : une définition, deux vues (cause A)

**Changements**
1. Dans `cmsNav.js`, remplacer `SITE_MODULES`/`SITE_PLAN` par une table `SITE_ABILITY` **indexée par les clés du registre** : `{ "outils/importer": "scoped", "parametres/lecture": "scoped", "articles/ajouter": "soon:B5", "outils/sauvegardes": "central", … }`. Valeurs : `scoped` (écran existant, site fixé par l'adresse), `readonly` (lecture seule dans un site, ex. Rôles/Permissions, décision 3), `soon:<lot>` (indisponible), `central` (reste dans l'administration centrale, décision 4).
2. Une fonction unique `projectNav(space)` construit le menu **à partir de `SECTIONS`** : mêmes groupes, mêmes entrées, mêmes libellés, même ordre. Pour un site : `href` réécrit en `/sites/N/<chemin du registre>`, état d'après `SITE_ABILITY`. Le principal = identité (URL historiques inchangées).
3. **Supprimer l'aplatissement ambigu** : un groupe garde son titre (« Utilisateurs », « Outils », « Paramètres ») même si certaines sous-entrées sont indisponibles.
4. Retirer les libellés spécifiques (« Équipe du site », « Réglages du site », « Design du site ») : le libellé est celui du registre.
5. Réduire `siteSpace.js` : supprimer les écrans en lecture seule dupliqués (`redirections`, `equipe`) au profit de l'écran existant avec le site fixé (délégation P1a généralisée aux chemins du registre).
6. « Composants » et « Marketing du site » : voir décision D3.

**Fichiers :** `cmsNav.js`, `siteSpace.js`, `views/marketing/partials/top.ejs`, `cms-nav.ejs`, éventuellement `index.js` (ordre de montage).
**Risques :** (a) rendre cliquable un écran non isolé → garde-fou : tout écran sans entrée `scoped`/`readonly` est rendu par un composant « Bientôt » sans donnée ; (b) régression du menu du principal → test d'égalité stricte avec le registre ; (c) permissions : chaque entrée garde la permission de l'écran d'origine.

### Lot C2 — Contexte du site pendant les opérations de pages (cause B)

Approche recommandée (deux règles, sans changer les URL historiques) :
1. **Création : le site vient de l'adresse.** Formulaire et éditeur de nommage postent vers `/sites/N/pages` (nouvelle route) ; le `site_id`/`siteId` du corps est ignoré (écrasé), comme le `?site=` en P1a. Le formulaire du principal reste sur `/marketing/pages`.
2. **Pages existantes : le contexte se déduit de la page (donnée du serveur).** Pour toute route `/marketing/pages/:id…`, si `page.site_id` est non nul, le serveur pose le cadre (bandeau + menu du site, `siteCandidate` vérifié) et calcule les redirections et les retours (`attempt`, `backTo`, `creer.json`, actions groupées) vers `/sites/<page.site_id>/pages…`. Une page du principal garde exactement le comportement actuel.
   - Alternative non retenue : dupliquer toutes les routes de pages sous `/sites/N/pages/:id…` (plus explicite, mais ~35 routes à doubler et à tenir en parité). À trancher en D4.
3. Un helper unique `returnTo(req, fallback)` remplace les chaînes `/marketing/pages…` dans `landing.js` (redirections, erreurs de validation avec reprise, Annuler, Retour, Publier).

**Fichiers :** `landing.js`, `kit.js` (`attempt`), `siteSpace.js`, `views/marketing/page-builder.ejs`, `landing.ejs`, `landing-list.ejs`, éventuellement le JS de l'éditeur (lien Accueil).
**Risques :** contexte déduit d'une page = jamais d'une valeur du client ; une page d'un autre site ouverte par identifiant garde les contrôles existants (403/404) ; le bundle de l'éditeur est partagé avec d'autres sessions → ne toucher qu'à la construction du lien de retour, modification minimale et annoncée.

### Lot C3 — Autres opérations de site (revue exhaustive)

Appliquer le même helper aux écrans qu'un site a déjà « live » : réglages du site (`siteWeb.js`, déjà dans l'URL), éditeur de composants (déjà correct), Emailing (`keepSite` généralisé : création et erreurs de validation, limite connue de P1a), Outils/Paramètres une fois exposés.

### Lot C4 — Exposition progressive (sans isolation douteuse)

Après C1 : exposer en `scoped` les écrans **démontrés** site-aware (Outils ×8, Paramètres ×7, Utilisateurs liste, Redirections), en `readonly` Rôles/Permissions, en `central` Sauvegardes/Informations système… selon décision D2. Le reste reste « Bientôt ». Cela recoupe P1b/P1c : ils sont **absorbés** dans C1/C4 si vous le validez.

---

## 4. Critères d'acceptation

| ID | Critère | Mesure |
|---|---|---|
| P-1 | Même groupes, libellés, ordre | test d'égalité : liste des groupes d'un site = liste du registre, mêmes libellés, même ordre |
| P-2 | Mêmes sous-entrées | pour chaque groupe, mêmes entrées dans le même ordre ; seules différences autorisées : état (`scoped`/`readonly`/`soon`/`central`) |
| P-3 | Aucun groupe aplati en remplaçant son titre | « Utilisateurs », « Outils », « Paramètres » visibles comme titres |
| P-4 | Aucune entrée cliquable vers un écran non isolé | sonde `?site=A` vs `B` : toute entrée cliquable change avec le site |
| P-5 | Création, enregistrement, publication, annulation, erreur de validation, archivage, suppression restent dans `/sites/N/…` | test par étape : `Location` et bandeau |
| P-6 | Données dans le bon site | lecture en base après chaque création (y compris corps falsifié `site_id`) |
| P-7 | Accès croisés | URL/identifiant d'un autre site : 403/404 ; membre limité : seul son site |
| P-8 | Principal intact | 66 entrées, adresses historiques, comportement des pages inchangé |
| P-9 | Chrome bureau + 375 px | parcours Mes sites → Pages → Ajouter → éditeur → Enregistrer → retour, 0 erreur console |
| P-10 | Suite complète | aucune régression ; échecs préexistants (SMS ; canvas) inchangés |
| P-11 | Aucune migration, aucune donnée de production touchée | différence Git |

## 5. Tests à écrire (au-delà du « 200 »)

1. **Parité** (unitaire + intégration) : comparaison structurelle `siteSections(space)` ↔ `SECTIONS` (groupes, entrées, libellés, ordre, clés actives), pour équipe, éditeur, lecteur, membre limité.
2. **États actifs** : chaque entrée ouverte met en évidence la *même* entrée dans les deux menus.
3. **Contexte pendant les opérations** : parcours complet de pages dans un site avec `Location` vérifié à chaque étape (étapes 2 à 10 du §2.1), plus erreur de validation avec reprise et bouton Annuler.
4. **Bon site** : lecture en base ; corps falsifié (`site_id` d'un autre site, absent) ; Referer d'un autre site.
5. **Accès croisés** : adresse ou identifiant d'un autre site ; membre limité ; site archivé (lecture seule).
6. **Principal** : mêmes redirections et mêmes pages qu'avant (régression).
7. **Chrome réel** : bureau et 375 px ; menu complet, état actif, création → éditeur → retour dans le cadre du site ; lien Accueil de l'éditeur (point non vérifié §2.3).
8. **Mutations de contrôle** : retirer la déduction du site par la page, ou remettre le `site_id` du corps, doit faire échouer un test.

## 6. Décisions que je vous demande avant de coder

- **D1 — Sous-entrées indisponibles dans un site :** (a) toutes les sous-entrées du registre sont visibles, celles qui ne sont pas prêtes grisées « Bientôt » avec une phrase (parité visuelle exacte, recommandé) ; (b) une seule entrée « Bientôt » par groupe (décision 2 actuelle, parité partielle).
- **D2 — Sauvegardes, Informations système, Journal d'activité (décision 4) :** (a) visibles dans le menu du site, grisés « Administration centrale » (parité exacte) ; (b) absents du menu du site.
- **D3 — « Composants » et « Marketing du site » :** conserver comme extensions propres au site, ou ranger « Composants » dans « Pages » seulement pour les sites ? (« Marketing du site » reste validé par la décision 1.)
- **D4 — Pages existantes :** contexte déduit de la page (recommandé, peu de code) ou routes doublées sous `/sites/N/pages/:id…` (plus explicite, plus lourd).
- **D5 — P1b/P1c :** les absorber dans C1/C4 (recommandé) ou les garder séparés.

## 7. Non vérifié / limites de cet audit

- Aucune vérification en production (pas de connexion) : tout est issu du code et de la base d'essai locale.
- Liens internes de l'éditeur visuel (JavaScript) : non vérifiés.
- Je n'ai sondé que l'équipe et un membre limité éditeur ; lecteur et sans-accès sont couverts par les tests P1a existants, pas par ces sondes.
- Les 4 écrans de Paramètres qui redirigent (Commentaires, Médias, Permaliens, Tunnels) : cause supposée « aucun réglage propre à un site », non investiguée plus loin.
- Les écrans Articles/Médias/Navigation/Commentaires/SEO/Apparence ne sont pas isolés par site : traités dans B2–B6 et P2, hors de cette correction.
