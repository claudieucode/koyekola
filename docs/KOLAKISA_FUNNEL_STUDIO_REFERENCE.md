# Funnel Studio — référence systeme.io et correction (TITAN XXIX)

## 1. Ce qui était incorrect dans l'implémentation précédente (phases 1 et 2)

| Écart | Pourquoi c'était faux |
|---|---|
| La page « Tunnels » était un **tableau de bord générique** : bandeau « Funnel Studio », cinq cartes d'indicateurs, colonne « Activité récente » et « Dans le studio » | systeme.io n'ouvre pas les tunnels sur un tableau de bord de chiffres : on arrive sur la **liste de gestion** des tunnels, avec « Create » et un menu « ⋯ » par tunnel |
| Création par un bouton scindé + menu de types inactifs | systeme.io ouvre une **fenêtre** (nom, domaine, devise, quatre types) |
| Aucune structure d'espace de tunnel : la page d'un tunnel était une pile de panneaux | systeme.io a un **écran de tunnel** avec un menu de gauche (« Add step »), des réglages (« Funnel settings ») et des onglets |
| Gros bouton « Créer » de la barre latérale : dégradé, reflet, ombre, 44 px | trop imposant ; remplacé (§5) |

Conservé : tout le moteur réel (`src/marketing/funnels/*`, routes `web/funnels.js`, formulaires d'étapes, publication, A/B par étape, automatisations, rapports 30/90 jours), la coque Marketing et sa navigation (l'entrée « Tunnels » y était déjà), les composants `mk-*`.

## 2. Références consultées (accessibles sans connexion)

Je n'ai **pas** accès à l'interface connectée de systeme.io. Sources : la capture fournie (tableau de bord) et les pages publiques :

- https://systeme.io/features — fonctions annoncées : tunnels d'inscription, de vente et de webinaire à partir de modèles ; éditeur glisser-déposer ; test A/B ; order bumps, upsells en un clic, comptes à rebours. Ne décrit ni les réglages ni les statistiques d'un tunnel.
- https://help.systeme.io/article/147-how-to-create-a-funnel — création.
- https://help.systeme.io/article/345-how-to-change-the-domain-name-of-a-funnel — liste, menu « ⋯ », « Funnel settings ».
- https://help.systeme.io/article/626-how-to-deactivate-a-funnel-and-configure-the-inactive-page — « Deactivate » depuis la liste.
- https://help.systeme.io/article/325-how-to-access-to-the-editor-of-a-page — bouton « Edit page » sur l'écran du tunnel.
- https://help.systeme.io/article/287-how-to-create-a-sales-page — « Add step » dans le menu de gauche, champ « Type », choix d'un modèle (« Select »), « Save ».
- https://help.systeme.io/article/218-how-to-create-a-split-test — onglet « A/B test » d'un tunnel.

## 3. Structure observée (texte officiel) ≠ hypothèse

**Observé (documenté) :**
1. Navigation : onglet « Sites » → « Sales funnels » (la barre du haut de la capture : Tableau de bord, CRM, Sites, Courriels, SMS, Automatisations, Ressources, Évents).
2. Liste : une ligne par tunnel, menu « ⋯ » avec au moins « Settings » et « Deactivate » ; bouton « Create ».
3. « Create » ouvre une fenêtre : « Name », « Domain », « Currency » et quatre types : « Build an Audience » (opt-in + remerciement), « Sell » (bon de commande + remerciement), « Custom » (vide, « + Add step »), « Run an evergreen webinar » (3 pages, offre limitée).
4. Écran d'un tunnel : menu de gauche avec « Add step » ; « Funnel settings » (domaine, « Save ») ; onglet « A/B test » ; bouton « Edit page » ; réglage « Deadline » sur les étapes bon de commande et page de vente.
5. Ajout d'étape : champ « Type » (« Sales page »…), choix d'un modèle ou départ vierge, « Save ».

**Non vérifié (aucune source accessible) :** disposition exacte de la liste et de l'écran d'un tunnel, onglet « Statistiques » d'un tunnel, liste complète des types d'étapes, colonnes de la liste. Pour ces points, la disposition de Kolakisa est une **hypothèse raisonnée** (colonnes de chiffres, onglets), pas une copie.

## 4. Correspondance Kolakisa

| systeme.io (observé) | Kolakisa |
|---|---|
| Sites → Sales funnels | Marketing → Tunnels (`/marketing/tunnels`, navigation existante inchangée) |
| Liste + « Create » | Liste de gestion (`fs-table`) + « Créer » discret |
| Fenêtre Name / Domain / Currency | Fenêtre : Nom, Site (le « domaine » de Kolakisa). La devise n'existe pas dans le modèle : non reprise |
| Quatre types | Constituer une audience (`aimant`), Vendre (`vente-commande`, exige une formation publiée), Personnalisé (vide), Webinaire (`webinaire`) ; les six autres modèles réels sous « Autres modèles de départ » |
| Menu « ⋯ » (Settings, Deactivate) | Ouvrir, Réglages du tunnel, Dupliquer, Archiver (= désactiver : pages hors ligne, rien d'effacé), Restaurer ; « Partager » visible mais inactif |
| Écran du tunnel, menu de gauche « Add step » | `fs-ws` : fil d'Ariane vers la liste, onglets Étapes / Statistiques / Automatisations / Paramètres, menu de gauche « Parcours » + « Ajouter une étape » |
| « Funnel settings » | onglet Paramètres (formulaire existant) |
| Onglet « A/B test » | existe déjà **par étape** (« Tester en A/B ») ; pas d'onglet global : non inventé |
| « Edit page » | « Modifier la page dans KOLAKISA CMS » (éditeur existant, réutilisé) |

## 5. Bouton « Créer » (barre latérale)

Variantes comparées dans la vraie barre latérale (captures `actuel`, A, B, C) :
- **Actuel** : dégradé bleu ciel, reflet, ombre, 44 px — trop imposant.
- **A — teinte douce** : fond azur à 14 %, bordure fine, texte clair, « + » azur, 36 px, sans ombre. **Retenue** : identifiable comme action principale sans dominer la barre.
- B — contour seul : trop effacé (l'action principale se confond avec le menu).
- C — plein azur plat : encore trop voyant.
Hover : fond à 22 % (couleurs seulement) ; focus clavier visible (anneau azur) ; aucune animation permanente ; le bouton ne bouge pas, menu ouvert ou fermé. Le bouton « Créer » de la page Tunnels reprend le même langage (teinte azur, 36 px). Fichiers : `public/css/kola-brand.css` (barre latérale), `public/css/funnel-studio.css`.

## 6. Interactions encore décoratives

« Partager » (menu « ⋯ »). Pas d'onglet « Statistiques » global enrichi, pas de devise, pas de « Deadline » (existe dans systeme.io, absent du modèle). Aucune donnée fictive, aucun message de succès simulé.

## 7. Limites de la comparaison

Aucune page connectée de systeme.io n'a pu être inspectée : la fidélité est structurelle (navigation, hiérarchie, types, actions confirmés par la documentation), pas pixel à pixel. Les points non confirmés sont listés au §3.
