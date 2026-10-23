# KOLAKISA CMS — Paramètres → Confidentialité (mission PARAMETRES-CONFIDENTIALITE-01)

Branche `parametres-confidentialite-01`, issue de `origin/main` (`00feba1`). Référence : « Confidentialité » de WordPress (organisation fonctionnelle seulement). Ce document décrit l'état **réel**.

## 1. Audit initial

| Élément | État avant la mission |
|---|---|
| Réglage `privacy_page` (moteur `services/settings`, groupe `privacy`) | **Opérationnel** : type « page », validé côté serveur (page du bon site, pas à la corbeille), droits, journal ; stocké dans `mk_settings` (principal) ou `mk_sites.settings.general.privacyPageId` (site). Mais **seules les pages publiées** étaient acceptées. |
| Affichage public | **Opérationnel** : lien dans le bandeau de consentement (principal) et dans le pied de page des pages d'un site, uniquement si la page est publiée et non archivée (`locals.js`, `landing.ejs`). |
| Réglage `analytics_retention_days` (groupe `privacy`, principal) | Opérationnel (purge quotidienne) : repris dans l'écran. |
| Écran Confidentialité | Formulaire générique (une liste de champs) : **pas d'onglets, pas de création de page, pas d'état, pas de guide**. |
| Création de page | Aucune depuis ce réglage ; l'utilisateur devait créer la page ailleurs puis la publier avant de pouvoir la choisir. |
| Guide / recommandations par module | **N'existait pas** (aucun mécanisme). |

Éléments **purement visuels** : aucun. Chevauchements : `homepage_page` (Lecture/Général) utilise le même type « page » ; la règle « publiée seulement » reste appliquée à la page d'accueil (le drapeau `allowDraft` ne concerne que `privacy_page`).

## 2. Ce qui a été construit

**Onglet Réglages** (`views/marketing/privacy.ejs`, `public/js/cms-privacy.js`)
- Introduction (aucun avis juridique, aucune garantie de conformité) ;
- **État calculé sur les données réelles** : aucune page · page de politique existante non associée · associée en brouillon · publiée et associée · indisponible (supprimée, à la corbeille, d'un autre site) ;
- **Créer une page** : crée une vraie page du site (`pages.createPage`, `kind='page'`, **brouillon**, indexable comme toute page de site) avec le modèle à compléter ; l'associe automatiquement s'il n'y a pas d'association valide et si la personne peut modifier ce réglage ; **page déjà existante → 409 et lien « Ouvrir et modifier »** ; créer une autre exige une confirmation (nom suivi de « (2) »…), sans remplacer l'association ;
- **Choisir la page** : sélecteur des pages du **site actif** (brouillons étiquetés), « Utiliser cette page » (enregistrement réel, relu du serveur), retrait de l'association sans suppression de la page ;
- **Conservation des visites suivies** (principal) : le réglage existant, avec sa validation (30–1825 jours) ;
- Où apparaît le lien ; Kolakisa ne modifie jamais menus ni pied de page.

**Onglet Guide de politique**
- Introduction (structure de rédaction ; à vérifier et maintenir ; pas de garantie) ;
- Accordéon « Guide de la politique de confidentialité » : 12 points à examiner, avec une étiquette « détecté » quand la fonction existe sur le site ;
- Accordéons **par source**, générés par le registre de modules (§3) : intro, faits détectés, données potentiellement concernées, à vérifier, à documenter, lien vers le réglage. Trois statuts honnêtes : *Détecté dans Kolakisa*, *Recommandation générale*, *Non détecté, à confirmer* (ou *Détection impossible*). Les services externes ne sont **jamais** présentés comme détectés.
- Accordéons : boutons `aria-expanded`, clavier (Entrée / Espace), contenu masqué (`visibility`) quand fermé, animation `grid-template-rows` sans saut ; onglets : flèches / Début / Fin, sans rechargement (adresse `?onglet=guide` mise à jour).

**Modèle de la page** (`services/privacy/index.js → template`) : bandeau + sections texte modifiables (Qui sommes-nous, informations, finalités, formulaires et comptes, cookies et mesure, services externes, conservation, droits, sécurité, contact). Tout ce qui est inconnu est « [À compléter : …] » ; aucun nom, adresse, coordonnée, durée, garantie ni service inventé ; les fonctions détectées ne sont citées que comme points « à confirmer ».

## 3. Architecture extensible du guide

`src/services/privacy/modules/*.js` : un fichier par module, chargé automatiquement. Il exporte `{ id, title, source, order, intro, collects[], verify[], document[], detect(env), link(env) }`. `detect` renvoie `{ status: "detected" | "not_detected" | "general", facts[] }` à partir de **faits vérifiables en base** (jamais supposés) ; une erreur de détection donne « Détection impossible », jamais « rien collecté ». Modules fournis : général, formulaires (`mk_forms` publiés du site), commentaires (`blog_comments`, principal), comptes (inscriptions publiques, principal), médias (médiathèque + pages publiées avec vidéo/contenu intégré), mesure d'audience (principal), emailing (contacts, principal). `register()` permet aussi à un module externe de s'ajouter à l'exécution. Ajouter une recommandation ne modifie ni l'écran ni les routes.

## 4. API et fichiers

- `GET /marketing/site-web/parametres/confidentialite[?site=][&onglet=guide]` — l'écran (principal ou `?site=`, y compris l'espace d'un site).
- `GET|PUT /marketing/site-web/parametres/api/confidentialite[?site=]` — état ; `{ values: { privacy_page?, analytics_retention_days? } }` (tout ou rien, clés étrangères refusées, 403 / 422 / 409).
- `POST …/api/confidentialite/creer[?site=]` — `{ confirm? }` → 201 `{ page, edit, associated, policy, pages }` · 409 `{ exists: [...] }`.
- Code : `src/marketing/web/privacy.js`, `src/services/privacy/`, `views/marketing/privacy.ejs`, `public/js/cms-privacy.js`, CSS `.mk-pv-*`, `settings.js` (aiguillage), `pages/index.js` (`createPage` accepte `sections`), `services/settings` (`allowDraft`).
- **Aucune migration, aucune donnée supprimée** : tout vit dans les colonnes et tables existantes.

## 5. Sécurité et isolation

Le site vient de l'adresse vérifiée (`siteTarget`), jamais du corps ; le moteur refuse une page d'un autre site, inexistante, à la corbeille ou invalide ; droits `settings.read / settings.write / settings.sensitive`, `forms.write` pour créer ; un accès limité à un site ne touche ni Beta ni le principal ; site archivé = lecture seule ; l'écran principal est réservé à l'équipe.

## 6. Registre

| # | Fonctionnalité | Statut | Preuve |
|---|---|---|---|
| C1 | Deux onglets réels (sans rechargement, saisie conservée, sortie protégée, clavier) | Testée · Vérifiée visuellement | route « l'écran » ; navigateur « onglets sans rechargement », « guide… » |
| C2 | État calculé (aucune / brouillon / publiée / indisponible) | Testée · Vérifiée visuellement | route « créer une page », « page supprimée… » ; navigateur |
| C3 | Création d'une vraie page (brouillon, bon site, modèle, dans Pages, éditeur) | Testée · Vérifiée visuellement | route « créer une page » ; navigateur « créer une page » |
| C4 | Pas de doublon silencieux, confirmation | Testée · Vérifiée visuellement | route « pas de doublon » ; navigateur |
| C5 | Sélection / remplacement / retrait, persistance, ancienne page conservée | Testée · Vérifiée visuellement | route « sélectionner… » ; navigateur « associer… » |
| C6 | Lien public dans le pied de page du site / bandeau du principal | Testée | route « sélectionner… », « le site principal » |
| C7 | Page supprimée / corbeille / autre site : état et refus serveur | Testée | route « page supprimée… » |
| C8 | Droits et isolation entre sites | Testée | route « droits et isolation » |
| C9 | Durée de conservation (principal), validation | Testée | route « le site principal » |
| C10 | Guide : accordéons, détection réelle, « non détecté » honnête, extensibilité | Testée · Vérifiée visuellement | route « guide » ; navigateur « guide » |
| C11 | Modèle sans donnée inventée, éditable | Testée | route « le modèle » |
| C12 | Téléphone (390 px), aucune erreur JavaScript | Vérifiée visuellement · Testée | navigateur « téléphone » |

## 7. Limites connues

- Détection **limitée aux faits internes à Kolakisa** : outils d'analyse, pixels et services externes ajoutés à la main ne sont pas détectables (le guide le dit). Commentaires, comptes, mesure d'audience et emailing sont des fonctions de la **plateforme** : « non détectés » pour un site du CMS.
- Le modèle est en français uniquement, sans traduction.
- Le guide ne se traduit pas selon la juridiction du propriétaire et ne remplace pas un avis juridique.
- L'association d'un **brouillon** est permise (la page se rédige avant d'être publiée) ; le lien public n'apparaît qu'à la publication.
- Le lien de confidentialité n'est pas ajouté automatiquement aux menus (choix volontaire, voir Apparence → Menus).
