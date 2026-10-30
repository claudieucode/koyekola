# KOLAKISA — Modèles : importation, annulation, fichiers

Toutes les routes sont sous `/marketing/site-web/templates/` ; le site vient de `?site=<id>` (absent = site principal, équipe seulement). Les droits sont vérifiés **côté serveur** à chaque appel.

## 1. Routes
| Route | Méthode | Droit | Rôle |
|---|---|---|---|
| `/` | GET | `appearance.read` | Écran (embarque la 1re page de résultats) |
| `/catalogue.json` | GET | `appearance.read` | Recherche, filtres, tri, pagination |
| `/detail.json?ref=` | GET | `appearance.read` | Détail, compatibilité, structure, licence |
| `/apercu?ref=&page=` | GET | `appearance.read` | Aperçu réel transitoire (jamais une page publiée) |
| `/secteurs.json` | GET | `appearance.read` | Familles et secteurs |
| `/pages.json` | GET | `forms.write` | Pages du site où insérer une section |
| `/plan` | POST | `forms.write` | Opérations prévues, **sans écrire** |
| `/importer` | POST | `forms.write` (+ droits des options) | Importation |
| `/annuler` | POST | `forms.write` (+ `navigation.delete` si un menu a été créé) | Annulation |
| `/enregistrer` | POST | `forms.write` | Enregistrer une page, des sections ou un composant |
| `/modifier` | POST | `forms.write` (+ `templates.share` pour la visibilité) | Modifier un modèle de page du site |
| `/supprimer` | POST | `forms.write` | Supprimer un modèle (page) ou mettre une composition à la corbeille |
| `/export.json?ref=` | GET | `forms.write` | Télécharger son modèle |
| `/importer-fichier` | POST | `forms.write` | Créer un modèle à partir d'un fichier |
| `/secteurs`, `/secteurs/modifier`, `/secteurs/supprimer` | POST | `templates.categories` (administrateur) | Secteurs personnalisés |

Options d'`/importer` : `ref`, `importKey` (8 à 64 caractères, obligatoire), `name`, `menu`, `styles` (packs), `assign` (modèles de thème), `pageId` + `position` (`start` / `end` / `after` + `after`) (sections), `confirm`. Droits des options : `menu` → `navigation.write`, `styles` → `appearance.styles`, `assign` → `appearance.templates` ; une option sans droit est **refusée avec un message**, jamais ignorée.

## 2. Procédure d'importation (ordre réel)
1. **Jeton** valide ; site actif ; rejeu éventuel (même jeton + même modèle = résultat déjà obtenu, `replay: true`, rien d'écrit ; même jeton + autre modèle = refus).
2. **Options** compatibles avec le type et les droits.
3. **Analyse** (§3) : modèle introuvable / d'un autre site → refus 422 ; **bloquants** → refus 422 avec la liste ; **avertissements** → refus 409 `confirm_required` tant que `confirm: true` n'est pas envoyé.
4. **Plan** : liste des opérations et des conflits de noms résolus (ce que l'écran affiche avant le bouton « Importer »).
5. **Transaction unique** (`SAVEPOINT`) : création des objets, journal `cms_template_imports`. Toute erreur (y compris l'écriture du journal) annule tout.
6. Journal d'audit `template.imported`.

| Type | Objets créés | Jamais fait |
|---|---|---|
| Site complet | N pages en brouillon ; menu (option) affecté à l'en-tête **seulement s'il n'a pas de menu** ; brouillon de styles (option) | Publier, remplacer un menu ou des styles publiés |
| Page | 1 page en brouillon | Publier |
| Section | Sections ajoutées au **brouillon** d'une page (révision vérifiée, 30 sections au plus) | Écraser le contenu, toucher une page publiée |
| Composant | 1 composant standard du site | Le brancher comme en-tête / pied de page |
| Modèle de thème | 1 page en brouillon ; affectation (option, `appearance.templates`) | Affecter sans demande ; remplacer une affectation (conflit refusé, **tout annulé**) |

## 3. Contrôles avant écriture (`templateCatalog.analyze`)
| Contrôle | Niveau |
|---|---|
| Élément absent du registre (`ancien-carrousel`, widget retiré) | Bloquant, élément nommé |
| Contenu que la grammaire actuelle refuse | Bloquant, cause du moteur |
| Élément réservé sans le droit (HTML → `pages.code`) | Bloquant |
| Formulaire cité absent du site de destination | Bloquant |
| Composant cité indisponible dans le site | Bloquant |
| Fichiers de médiathèque d'un autre site | Avertissement (non copiés) |
| Ressources externes (`https://hôte` dans une image, un média, un embed) | Avertissement, hôtes listés |
| Formations affichées mais aucune publiée | Avertissement |
| Formulaire à choisir ; modèle de thème non affecté | Information |

## 4. Conflits (stratégie documentée)
**Aucun remplacement silencieux, nulle part.** Pages : nom libre suivant `Nom`, `Nom (2)`, `Nom (3)`… (unicité dans l'organisation). Composants : idem. Menus : idem par site. Modèles enregistrés : un nom déjà pris est **refusé** (409) sauf `replace: true` explicite (version + 1). Affectation de thème déjà occupée : refus, rien n'est créé. Fichier importé : nom numéroté, `renamed: true`.

## 5. Annulation
`/annuler` retire ce que l'import a créé **à condition que rien n'ait changé** (tout ou rien) : pages en brouillon et non modifiées → corbeille (restaurables) ; sections insérées → retirées si la page est à la même révision ; composant → supprimé s'il n'est utilisé nulle part ; menu → supprimé. Refus (409, rien de changé, cause nommée) si une page a été modifiée / publiée, si le modèle de thème est affecté, ou si l'import est déjà annulé. **Le brouillon de styles n'est pas annulé** (à abandonner dans Styles) — signalé dans la réponse. Un import annulé ne compte plus dans les usages ni dans « déjà importé ».

## 6. Fichiers de modèle
Format `kolakisa-template@1` (forme canonique, comme `kolakisa-page@1` ; la forme `kolakisa-template` + `formatVersion` est aussi lue), `formatVersion` 1 :
```json
{ "format": "kolakisa-template@1", "formatVersion": 1, "exportedAt": "…", "requires": { "widgets": ["heading", "text"] },
  "kind": "page|section|component", "name": "…", "description": "…", "category": "…", "language": "fr", "siteType": "vitrine",
  "sectors": ["restaurant"], "keywords": ["…"], "version": 2, "content": { "sections": [ … ], "theme": {}, "title": "", "description": "", "seo": {} } }
```
Export : ses propres modèles (page, composition, composant), en téléchargement (`Content-Disposition`, `X-Content-Type-Options: nosniff`). Import : corps JSON de 600 Ko au plus (413 au-delà) ; format reconnu (`kolakisa-template@N`, `kolakisa-template` + `formatVersion`, ou l'ancien `kolakisa-page@1`, converti ; version du nom et `formatVersion` doivent concorder) ; version de format supérieure à celle du site refusée avec explication ; 30 sections au plus ; **contenu entièrement revalidé** par la grammaire fermée (scripts, gestionnaires d'événements, HTML libre retirés ou refusés) ; analyse de compatibilité ; secteurs inconnus ignorés ; le résultat est un **modèle** de « Mes modèles » (jamais une page). Non pris en charge : fichiers de sites complets, de modèles de thème (voir REMAINING_ISSUES).

## 7. Réponses d'erreur
`{ ok: false, error, details? }` ; 403 sans droit, 404 modèle ou site introuvable, 409 confirmation requise / conflit / annulation refusée, 413 fichier trop gros, 422 refus de validation, 500 erreur technique (rien d'écrit).
