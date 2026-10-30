# KOLAKISA — Modèles : versions, éléments, dépendances, compatibilité

## 1. Versions
| Notion | Où | Valeur | Rôle |
|---|---|---|---|
| Version du **format** de modèle | `FORMAT_VERSION` (`templateCatalog.js`), colonne `mk_page_templates.format_version`, champ `formatVersion` des fichiers | **1** | Savoir lire un modèle écrit plus tôt ; refuser un modèle écrit plus tard |
| Version du **contenu** d'un modèle | `mk_page_templates.version`, champ `version` des fichiers | 1, puis +1 à chaque remplacement explicite | Historique simple des mises à jour |
| Grammaire des sections | `pages/sections.js`, `pages/nodes.js` | Celle du produit | Source unique : un modèle est valide s'il passe `normalizeSections` aujourd'hui |

Les 99 modèles officiels sont du code livré : ils évoluent avec le produit (la suite de tests les revalide à chaque exécution, donc une évolution du moteur qui les casserait ferait échouer les tests avant livraison).

## 2. Migrations de format
`MIGRATIONS` (`templateStore.js`) : une fonction par version `N → N+1`. Aucune n'est nécessaire à ce jour (format 1). Déjà géré : l'ancien format `kolakisa-page@1` (export de page) est converti en `kolakisa-template` v1 à l'import. Une version **supérieure** à celle du site est refusée avec un message qui demande de mettre Kolakisa à jour ; une version inférieure sans migration enregistrée est refusée (« aucune migration disponible »), jamais devinée.

## 3. Éléments (widgets) : détection et règles
L'analyse (`templateCatalog.analyze`) parcourt les sections et leurs `children`, compte chaque élément et le compare au registre `NODE_TYPES` / `sections.TYPES` **du site qui importe** :

| Cas | Résultat | Solution proposée à l'écran |
|---|---|---|
| Élément connu et autorisé | Compté dans « Éléments utilisés » du détail | — |
| Élément **inconnu** (retiré, jamais installé) | **Bloquant**, élément nommé, import refusé, modèle d'origine intact, rien supprimé | Remplacer l'élément dans l'éditeur du site d'origine, ou installer l'extension qui le fournit |
| Élément connu mais **réservé** (HTML → `pages.code`) | Bloquant pour les personnes sans le droit ; autorisé avec | Demander un administrateur |
| Contenu qu'une règle actuelle de la grammaire refuse (champ ajouté, valeur retirée) | Bloquant avec le message du moteur | Corriger le contenu à la source |
| Contenu nettoyé par la sécurité (scripts, gestionnaires d'événements) | Retiré à l'enregistrement du modèle ; un bloc devenu vide est refusé | — |

Le statut apparaît **avant** l'import : badge « À vérifier » / « Incompatible » sur la carte, détail complet, filtre « Compatibilité ». « Annuler l'importation » = fermer la fenêtre (rien n'est écrit avant le bouton) ; après coup : « Annuler cet import » (voir IMPORT_EXPORT §5).

## 4. Dépendances
| Dépendance | Détection | Effet |
|---|---|---|
| Formulaire d'inscription | Section `form` / élément `signupform` sans `formId` → information « choisissez un formulaire avant publication » ; avec `formId` → doit exister **dans le site de destination** | Bloquant sinon |
| Composant synchronisé (`componentId`) | Doit exister et être utilisable dans le site | Bloquant sinon |
| Formations (`course`, `courselist`) | Au moins une formation publiée | Avertissement + confirmation sinon |
| Blog (`posts`, `querylist`, `postcontent`…) | Information « fonctionnalités utilisées : blog » | — |
| Médias de la médiathèque (`/uploads/…`) | Modèle venant d'un autre site | Avertissement (les fichiers ne sont **pas copiés**) |
| Ressources externes (`https://…` en image, média, embed) | Hôtes listés | Avertissement + confirmation |
| Droits | `lockedWidgetChanges` + droits des options | Refus avec message |

## 5. Compatibilité avec les documents existants
Un modèle importé est converti en objets natifs avec **de nouveaux identifiants de section** et revalidé ; aucune page existante n'est modifiée, sauf l'ajout de sections au brouillon d'une page choisie (révision vérifiée, refus si le brouillon a changé entre-temps). Les modèles enregistrés avant 20.4 (sans métadonnées) sont lus avec des valeurs par défaut (version 1, format 1, langue `fr`, sans secteur).

## 6. Limites connues
Les modèles de thème supposent le moteur de blog (articles, archives) ; les affectations sont **par organisation** (limite D2 du Programme 20.3). Aucun modèle e-commerce (produit physique, panier de produits) : le moteur de vente est celui des formations. Aucune détection de compatibilité entre **versions de widget** (les widgets du registre n'ont pas de version propre exposée) : la compatibilité est vérifiée par la grammaire actuelle, pas par comparaison de versions.
