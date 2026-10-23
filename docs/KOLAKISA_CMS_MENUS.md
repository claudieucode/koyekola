# KOLAKISA CMS — Apparence → Menus (palier MENUS-01)

Branche `apparence-menus-01`, issue de `main` (`0f8ee26`). Référence : l'écran « Apparence → Menus » de WordPress. Ce document décrit l'état **réel**.

## 1. Audit initial

**Un moteur de navigation complet existait déjà** (palier 7). Il n'a donc pas été remplacé : il a été étendu.

| Existant (conservé) | Où |
|---|---|
| Tables `nav_menus`, `nav_items` (hiérarchie, ordre, références `type + object_id`), `nav_locations` ; isolation par `site_id` (NULL = principal) | `src/config/database.js` |
| Service : création, duplication, suppression, éléments, déplacements, liens cassés, emplacements, rendu public (`forLocation`, `forMenu`), registres extensibles `registerLocation` / `registerType` | `src/services/navigation.js` |
| Routes (permissions `navigation.read / write / publish / delete`), « Apparence → Menus » = même écran que « Navigation » | `src/marketing/web/navigation.js`, `cmsNav.js` |
| Rendu public : en-tête, menu mobile, pied de page ; sous-menus au clavier / au toucher | `views/partials/header.ejs`, `footer.ejs`, `nav-menu.ejs`, `public/js/site-nav.js` |

**Écarts constatés par rapport à la demande, et traitement :**

| Écart | Traitement |
|---|---|
| **Fuite d'isolation** : l'en-tête et le pied de page publics d'un domaine de site lisaient les menus du **site principal** (`navMenu()` n'avait pas le site de la requête) | **Corrigé** : `middlewares/locals.js` passe `req.kwSite`. Un site sans menu garde son affichage d'origine |
| Chaque action rechargeait la page ; aucun enregistrement groupé, aucune protection contre la perte de modifications, aucun conflit de version | Nouvel éditeur : structure en mémoire, **un seul enregistrement** tout-ou-rien, version contrôlée (409), indicateur « Modifications non enregistrées », `beforeunload`, Annuler / Rétablir |
| Pas de classes CSS, ni d'attribut `title` par élément | Colonnes `css_class`, `title_attr` (validées), rendues sur le site |
| Liste : ni recherche, ni tri, ni dernière modification, ni aperçu, ni duplication/suppression en ligne | Ajoutés |
| Recherche de ressources limitée à 20 résultats | Pagination (`offset`, `hasMore`, « Charger plus ») |
| Pas de point d'extension pour les modules (boutique…) | `registerSource` (voir §6) |
| Glisser-déposer natif seulement, sans équivalent tactile | Glisser-déposer par pointeur (souris, stylet, tactile) + boutons + Alt + flèches |
| Annonces vocales absentes | Zone `aria-live` : position, niveau, enregistrement |

## 2. Modèle de données

**Aucun fichier de migration.** Les tables `nav_*` sont créées par `src/config/database.js` (pas par les migrations du marketing) : les trois colonnes y sont donc ajoutées au démarrage par des `ALTER TABLE … ADD COLUMN` gardés (additifs, valeur par défaut, sans effet s'ils existent déjà). Un fichier `098_….sql` ferait échouer les bases construites par les seules migrations (« no such table: nav_menus »). Colonnes :

- `nav_menus.revision` (entier, défaut 1) : incrémenté à chaque modification du menu (éditeur, anciennes routes, changement d'emplacement). Un enregistrement fait avec une version périmée est refusé.
- `nav_items.css_class` (texte, défaut `''`) : jusqu'à 5 classes, chacune `[A-Za-z_][A-Za-z0-9_-]{0,39}`.
- `nav_items.title_attr` (texte, défaut `''`) : 120 caractères au plus, échappé à l'affichage.

Annulation : `ALTER TABLE … DROP COLUMN` sur ces trois colonnes. Aucune autre donnée n'en dépend.

Un élément qui vise une ressource garde sa **référence** (`type + object_id`), jamais une copie de l'adresse : si le slug change, le lien suit. Une ressource supprimée, à la corbeille ou non publiée n'est jamais un lien mort sur le site ; elle est signalée dans l'éditeur.

## 3. Routes et API

Préfixe `/marketing/site-web/navigation` (le site est celui de `?site=` / `/sites/<id>/…` vérifié par le serveur, ou celui du menu appelé).

| Route | Droit | Rôle |
|---|---|---|
| `GET /` , `GET /apparence/menus` | `navigation.read` | Liste : `q` (recherche), `sort` = `nom` \| `recent` \| `elements` |
| `GET /menus/:id` | `navigation.read` | Éditeur (JSON `#nm-data` : menu, éléments, types, emplacements, sources, URLs) ; `?apercu=1` ouvre l'aperçu |
| **`POST /menus/:id/enregistrer`** | `navigation.write` | **JSON, tout ou rien** : `{ revision, name?, description?, status?, items: [arbre], locations?: { clé: booléen } }` → `{ ok, revision, name, count, idMap }` ; erreurs : 400 (validation), 403, 404, **409 (version périmée, `conflict: true`)** |
| `GET /menus/:id/apercu` | `navigation.read` | `{ ok, html }` : rendu public du menu **enregistré** (masqués / non publiés exclus) |
| `GET /ressources` | `navigation.read` | `type` = page \| article \| category \| tag, ou `source`, + `q`, `offset` → `{ results, hasMore }` (20 par page, filtré par site) |
| `POST /menus`, `/menus/:id` , `/dupliquer`, `/supprimer`, `/importer`, `/emplacements`, `/elements…`, `/organiser` | voir droits | Routes historiques conservées (formulaires, tests, intégrations) |

Droits : `navigation.read` (voir), `navigation.write` (modifier un menu et ses éléments), `navigation.publish` (**affecter un emplacement**), `navigation.delete` (supprimer un menu). Sans `publish`, une demande qui modifierait un emplacement répond 403 ; l'enregistrement sans toucher aux emplacements reste possible.

**Élément envoyé** : `{ id? | key?, type, object_id? (page/article/category/tag), url? (custom), label, title_attr, css_class, new_tab, rel, visibility, status, children }`. Tout champ inconnu est refusé. Un `id` doit appartenir à CE menu. Le type d'un élément existant ne change pas.

## 4. Validation (serveur, jamais le navigateur)

- Adresses : `/chemin`, `#ancre`, `http(s)://hôte.tld`, `mailto:`, `tel:` uniquement. Refusés : `javascript:`, `data:`, `vbscript:`, `//hôte`, espaces et retours à la ligne, ancre vide, hôte sans point.
- Structure : 3 niveaux au plus, 300 éléments au plus, pas d'élément en double (donc pas de boucle), élément inconnu ou d'un autre menu refusé, ressource d'un autre site refusée.
- `rel` : liste blanche (`nofollow sponsored ugc`) ; `noopener noreferrer` ajoutés automatiquement aux liens externes et aux nouveaux onglets.
- Libellés et titres : texte brut ; échappés à l'affichage (jamais de HTML).
- Tout est validé **avant** la première écriture ; l'écriture est une transaction. Une erreur n'écrit rien et ne consomme pas de version.

## 5. Éditeur

- **Panneau d'ajout** (repliable) : Pages, Articles, Catégories, Étiquettes (recherche côté serveur, « Récentes » par défaut, sélection multiple, « Tout sélectionner », « Charger plus », chargement / erreur avec « Réessayer » / aucun résultat), Accueil, Liens personnalisés (validés), et une section par **source d'extension**.
- **Structure** : poignée de glisser-déposer (avant / après / **dans** = sous-menu ; les dépôts qui dépasseraient 3 niveaux sont refusés), boutons ↑ ↓ → ←, **Alt + flèches** au clavier, volet d'options par élément (libellé, adresse, remplacement de destination, options avancées : `title`, classes, nouvel onglet, masqué, visibilité, `rel`), dupliquer (avec ses sous-éléments), retirer du menu (ne supprime **jamais** le contenu ; les sous-éléments remontent).
- **Réglages** : nom, description, état (publié / brouillon), emplacements.
- **Enregistrement** : « Enregistrer le menu » (aussi Ctrl/Cmd + S), anti double envoi, état « Enregistrement… », « Menu enregistré à HH:MM », erreur serveur ou réseau avec « Réessayer » (le menu n'est **pas** présenté comme enregistré), conflit avec « Recharger la page », protection à la fermeture (`beforeunload` + confirmation sur les liens internes).
- **Annuler / Rétablir** : ajout, retrait, déplacement, duplication (50 niveaux). La saisie dans un champ garde l'annulation du navigateur.
- **Aperçu** : fenêtre qui montre le rendu public de la version enregistrée (et le dit si des modifications ne le sont pas).
- **Responsive** : deux colonnes ≥ 980 px ; une colonne en dessous (panneau d'ajout au-dessus) ; boutons de déplacement de 40 px à 44 px sur téléphone ; aucun défilement horizontal.

## 6. Emplacements et extensions

- **Emplacements** : registre central `LOCATIONS` (`header`, `footer`, `mobile`), extensible par `registerLocation({ key, label, hint })`. **Un emplacement n'est proposé que si le gabarit public le rend** : ces trois-là le sont. Le thème actif n'en ajoute pas (les thèmes de Kolakisa n'ont pas de gabarits propres). Un emplacement retiré du registre disparaît de l'éditeur ; **les menus et leurs éléments sont conservés**. Un menu peut occuper plusieurs emplacements ; affecter un emplacement occupé le remplace ; décocher ne libère que si l'emplacement est occupé par CE menu.
- **Sources d'extensions** : `navigation.registerSource("boutique", { label: "Boutique", available(siteId) { … }, search(q, limit, siteId) { return [{ id, title, url }]; } })`. Les éléments choisis sont ajoutés comme **liens personnalisés** (adresse validée) : désactiver le module ne casse aucun menu et le moteur ne dépend d'aucune extension. Une source indisponible pour un site n'apparaît pas et ne répond pas. Les types natifs (`registerType`) restent limités par la contrainte de la table (`page`, `article`, `category`, `tag`, `home`, `custom`) ; élargir cette liste demande une migration.

## 7. Rendu public

`navMenu(emplacement)` lit **le menu du site de la requête** (domaine d'un site → `req.kwSite`, sinon principal). Sans menu publié affecté, l'affichage d'origine est conservé. Éléments masqués, non publiés, ressource indisponible : absents ; un élément sans lien valide mais avec des enfants visibles devient un titre de groupe. Sortie : `<li class="nav-item … classes">`, `<a title="…">`, bouton de sous-menu `aria-expanded` / `aria-controls`, `aria-current`, `site-nav.js` (Entrée, Espace, Échap, focus, tiroir mobile). **Aucun cache** : le rendu relit la base à chaque requête, donc une modification est visible immédiatement.

Thèmes d'une autre architecture : ils appellent `navMenu("header")` (ou `navigation.forLocation`) et incluent `partials/nav-menu`. Le pied de page affiche les libellés et liens ; il n'applique ni classes ni `title` par élément.

## 8. Isolation multisite

Le site vient de l'adresse vérifiée ou du menu appelé, **jamais du corps de la requête**. Un menu d'un autre site (ou du principal) est introuvable (404) en lecture, enregistrement et aperçu, même avec un identifiant ou un paramètre `site` forgé. Les ressources d'un autre site sont refusées à l'enregistrement et absentes de la recherche. Un emplacement ne reçoit qu'un menu du même site. Le rendu public d'un domaine ne montre que le menu de ce site.

## 9. Tests

```
node --test --test-concurrency=1 tests/apparence-menus.test.js tests/cms-navigation.test.js tests/navigation-par-site.test.js
# Navigateur (Chrome + playwright-core ; ignorés sans) :
node --test --test-concurrency=1 tests/apparence-menus-navigateur.test.js tests/cms-navigation-navigateur.test.js
```

Couverture : voir l'en-tête des fichiers. L'accessibilité clavier, le mobile et le glisser-déposer sont vérifiés dans un vrai Chrome.

## 9 bis. MENUS-02 — « Navigation » n'est plus une entrée du menu latéral

- **Cause du défaut signalé** : MENUS-01 avait ouvert Apparence → Menus mais laissé l'ancienne rubrique « Navigation » dans le registre du menu latéral (`cmsNav.js`) : deux entrées ouvraient le même écran.
- **Fait** : la rubrique `navigation` est retirée du registre ; « Marketing du site » se place maintenant juste avant « Outils ». L'ancienne adresse `/navigation` (principal et `/sites/N/navigation`) continue de s'ouvrir et affiche **Apparence → Menus** comme entrée active (alias `navigation` → `apparence/menus` dans `buildCmsNav` / `buildSiteNav`).
- **Sélecteur de menu** dans l'éditeur (menus DU site seulement) : un changement avec des modifications non enregistrées demande confirmation (refuser = rester sur le menu).
- Tests : `apparence-menus-integration` (API) et `apparence-menus-selecteur-navigateur` (Chrome) ; tests de structure mis à jour (14 rubriques, 66 entrées de registre).
- Un menu latéral qui affiche encore « Navigation » ou « BIENTÔT » sur Templates / Patterns / Styles vient d'un serveur qui n'a pas la dernière version (copie locale non à jour), pas du code actuel.

## 10. Limites connues (non faites, pas simulées)

- Pas d'**ajout automatique des pages de premier niveau** au menu (option de WordPress) : non développée, donc absente de l'écran.

- Pas de **types de contenus personnalisés** ni de taxonomies autres que catégories et étiquettes : le CMS n'en a pas.
- Pas de **menu du compte utilisateur** : le gabarit d'en-tête n'a pas d'emplacement correspondant (ajouter un emplacement avant de brancher un gabarit serait trompeur).
- Pas d'**aperçu en direct** dans le site (le « personnalisateur » existe à part) : l'aperçu montre le menu enregistré.
- **Pas de brouillon de structure** : enregistrer publie (le menu lui-même peut être mis en « Brouillon »). Seul le journal d'audit garde qui a enregistré, quand, et combien d'éléments.
- Le volet d'options est dans la page (pas de fenêtre flottante) ; sur un menu de 300 éléments l'éditeur reconstruit la liste à chaque déplacement (mesuré rapide ; voir le test de performance).
- Une modification des **emplacements** faite ailleurs pendant l'édition est signalée comme conflit de version, jamais écrasée.
