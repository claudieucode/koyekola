# KOLAKISA CMS — Moteur d'A/B testing (palier 22)

Le moteur d'A/B des pages (phase 12) a été **étendu**, pas remplacé : une seule table d'expériences (`mk_page_tests`), un seul journal d'expositions (`mk_page_test_events`). Aucun second système d'événements, de visiteurs, de sessions, d'analytics ni de conversions.

## Qui possède quoi
| Sujet | Propriétaire |
|---|---|
| Expériences, versions, répartition, affectation, exposition, objectif, statut, verdict, décision | Moteur d'A/B (`src/marketing/pages/abtests.js`, statistiques dans `abstats.js`) |
| Visites, sessions, pages vues, consentement, identité visiteur | Suivi des visiteurs (`visitors`, cookie `kw_vid` après accord) |
| Contacts et identité | Contact Core (le moteur lit seulement `mk_web_visitors.contact_id`) |
| Commandes, paiements, remboursements | Boutique (`orders`, `order_refunds`) : **lus, jamais recopiés ni recalculés** |
| Lecture centrale des chiffres | Analytics (le tableau de bord affiche une section « Tests A/B » en lecture seule) |
| Contenu des versions | Pages CMS + éditeur : la version B est une **copie de page** éditée dans l'éditeur existant (aucun second éditeur) |

## Modèle
Migration `067_experiences_ab.sql` (additive) ajoute à `mk_page_tests` : `site_id`, `description`, `goal_key` (objectif « achat »), `confidence` (90/95/99, défaut 95), `attribution_days` (1–30, défaut 7), `min_views`, `archived_at`, `ended_reason` ; et à `mk_page_test_events` : `consent`.
- **Statuts** : `draft` (brouillon) → `running` (en cours) ⇄ `stopped` (en pause) → `completed` (terminé). L'archivage (`archived_at`) est un drapeau : un test archivé ne peut plus rien faire tant qu'il n'est pas restauré. Les transitions incohérentes sont refusées (`TRANSITIONS`).
- **Versions** : A = la page publiée ; B = copie de page (`variant_page_id`), figée au démarrage (`variant_b`). Aucun contenu dupliqué dans l'expérience au-delà de cette figeage.
- **Répartition** : B reçoit `traffic_b` % (10 à 90), A le reste : le total vaut toujours 100 %. 50/50, 70/30, 90/10, 20/80… sont possibles.

## Limites assumées
- **Deux versions seulement (A et B).** Les colonnes `variant IN ('a','b')` de la migration 040 sont figées ; C et D demanderaient une reconstruction de table. L'architecture (clé de hachage par test) s'étend, la table non.
- **Pas de programmation** (« scheduled ») ni de montée en charge progressive (ramp-up) : non nécessaires à ce stade.
- **Pas de test sur le revenu** : le chiffre d'affaires est décrit (net, par visiteur, panier moyen), pas « prouvé » statistiquement (distribution asymétrique).
- **Pas d'expérimentation par composant** (titre, bouton…) : l'unité testée est la page ou l'étape de tunnel.
- **E-mail** : l'A/B d'e-mails existe déjà (campagnes) et reste séparé ; non fusionné ici.
- **Éditeur** : le lien « Créer un test A/B » est sur l'écran de la page et sur chaque étape de tunnel, pas dans la barre de l'éditeur.
- **Segments** (nouveaux visiteurs, clients…) : non implémentés ; aucun nouveau système de segmentation n'a été créé.

## Affectation (assignment)
La version vient d'une **empreinte** (SHA-256 de `identifiant du test : identifiant du visiteur`), jamais de `Math.random()`.
- Visiteur ayant **accepté le suivi** (cookies `kw_consent=1` + `kw_vid`) : la clé est son identifiant `kw_vid`. Sa **première exposition est mémorisée** : il garde la même version pendant tout le test, même si la répartition est ensuite modifiée (changement interdit pendant que le test tourne, autorisé en pause pour les nouveaux visiteurs).
- Visiteur **sans accord** : seule l'empreinte anonyme du jour (adresse IP + navigateur + jour, hachée, jamais conservée, sans cookie) existe. La version tient pour la journée. **Limite** : la même personne revenue un autre jour est recomptée comme un nouveau visiteur (écart indiqué dans l'écran des résultats).
- L'identité anonyme réutilise le suivi existant ; aucun identifiant spécifique à l'A/B n'est créé. Le lien visiteur → contact reste celui du Contact Core (`mk_web_visitors.contact_id`).

## Exposition
Définition : **la page a réellement été rendue (réponse HTTP 200) pour un visiteur humain**. Ne comptent pas : robots, absence de navigateur, retour sur la page après son propre formulaire, erreurs de rendu, aperçus de l'administration, test en pause. Une exposition par visiteur et par test. Elle est enregistrée dans `mk_page_test_events` (type `view`) ; ce n'est pas un événement du bus (volume).

## Objectifs et conversions
- `signup` : inscription par le formulaire de la page ; `click` : clic sur un bouton/lien de la page ; `purchase` : commande payée (lue dans la boutique).
- Conversions `signup`/`click` : enregistrées seulement pour un visiteur déjà exposé, **une fois**, avec la version qu'il a vue, et seulement **dans la fenêtre d'attribution** (7 jours par défaut ; 7 jours couvre un cycle hebdomadaire ; réglable de 1 à 30).
- **Taux de conversion = conversions ÷ visiteurs exposés à la version.** Le dénominateur est le même pour A et B.
- **Achat** : population = personnes suivies (accord) ; une personne est son **contact** si elle est reliée, sinon son identifiant de cookie. Une commande payée (> 0) compte pour la version de la **première** exposition de la personne si elle tombe dans la fenêtre après cette exposition. Une personne vue dans les deux versions (deux appareils) est exclue des deux côtés et comptée à part (« ambiguous »). Les achats d'un contact ne sont **jamais** attribués à toutes ses expériences : seulement à celle où il a été exposé, dans la fenêtre.
- Chiffre d'affaires = commandes payées − remboursements (`order_refunds`), puis par visiteur suivi, par acheteur, panier moyen. Un achat sans visite suivie reliée à un contact n'est attribué à personne (jamais deviné).

## Méthode statistique
Comparaison de **deux proportions**, test du Z bilatéral à variance commune (`abstats.js`).
- H0 : même taux de conversion. On rejette H0 si la valeur p < α = 1 − confiance (90 % → 0,10 ; **95 % par défaut → 0,05, convention usuelle** ; 99 % → 0,01). Le niveau est réellement utilisé dans le calcul (testé : un même écart peut être significatif à 95 % et pas à 99 %).
- Intervalle de confiance de l'écart (Wald) au même niveau, écart relatif.
- Hypothèses : visiteurs indépendants, une observation par visiteur, test à horizon fixe.
- **Approximation normale valable** seulement avec ≥ 5 conversions et ≥ 5 non-conversions par version (sinon « données insuffisantes »).
- **Taille d'échantillon** : minimum configurable (100 visiteurs par version par défaut, ≥ 20 conversions au total) ; l'écran estime aussi la taille nécessaire pour détecter +20 % relatifs au taux de départ (puissance 80 %).
- **Contrôle de répartition (SRM)** : khi-deux sur la répartition observée contre celle réglée ; p < 0,001 = anomalie bloquante (robots, cache, redirection).
- **Limite connue** : regarder les résultats plusieurs fois avant la taille prévue augmente le risque de faux positif. Le moteur le compense en exigeant 7 jours d'observation avant de déclarer un gagnant, mais ne remplace pas une méthode séquentielle.

## États du verdict
`Données insuffisantes` (avec le meneur observé, « ça ne prouve rien») → `Non concluant` (assez de données, p ≥ α) → `Significatif, pas encore de gagnant` (p < α mais < 7 jours ou anomalie de mesure) → `Gagnant` (p < α, données suffisantes, ≥ 7 jours, aucune anomalie bloquante). Un test en pause ou terminé garde son dernier verdict. Jamais « gagnant » sur la seule base de B > A. Garder A ou appliquer B reste une décision humaine (appliquer B sans gagnant demande une confirmation) ; B appliquée est copiée dans le **brouillon** de la page.

## Anomalies et qualité des données
Alertes (jamais de correction silencieuse) : aucune exposition, une version sans visiteur, répartition observée ≠ réglée, conversions > expositions, page hors ligne pendant le test, changement de site, aucune inscription mesurée malgré les visites, aucun visiteur suivi pour un test d'achat, personnes vues dans les deux versions, part de visiteurs sans accord.

## Validation avant démarrage (`validateStart`)
Bloque : page non publiée/archivée, version B supprimée ou dans un autre site, site du test ≠ site de la page, autre test en cours sur la page, version B identique à A ou invalide (même contrôle que la publication), boutique absente pour l'objectif « achat ». Avertit : page sans formulaire pour l'objectif inscription ; limites d'attribution des achats.

## Cache, URL, SEO
- La page publique `/p/<slug>` est servie avec `Cache-Control: no-store` (déjà le cas) : ni le navigateur, ni un CDN, ni un cache serveur ne peuvent servir la mauvaise version. Il n'y a pas de génération statique de ces pages. Test : deux visiteurs, même adresse, deux contenus.
- **URL** : aucune URL propre à l'A/B. La version est servie à l'adresse de la page testée (URL Resolver inchangé). La copie B n'est ni publiée (donc 404 sur `/p/<son-slug>`) ni indexable (`indexable = 0`) ni dans le plan du site : **une seule adresse indexable, pas de contenu dupliqué**. Les balises canonique / robots / plan du site sont celles de la page testée.
- La copie B est exclue des listes de pages tant que le test existe et ne peut être publiée seule.
- **Aperçu / QA** : les boutons d'aperçu des versions A et B utilisent l'aperçu sécurisé existant de l'administration (connexion et droits requis) ; ils n'enregistrent aucune exposition. Une adresse `?variant=b` publique **ne force rien** (la version ne dépend que du visiteur) : aucun risque de contaminer les statistiques.

## Confidentialité
Sans accord, aucune donnée personnelle ni identifiant persistant (empreinte quotidienne hachée, déjà utilisée par les statistiques de pages). Avec accord, l'identifiant `kw_vid` existant. Le refus du bandeau est respecté (`kw_consent=0` = traitement « sans accord »). Les achats ne sont attribuables qu'aux visiteurs ayant accepté le suivi.

## Permissions et sécurité
- Lecture : `forms.read` ; création/démarrage/pause/fin/archivage/suppression : `forms.write` (droits des pages). Aucun droit nouveau.
- **Multisite** : un test porte le `site_id` de sa page, sa version B est dans le même site. Un accès limité à un site (`siteScope`) ne voit, ne lit, ne démarre ni ne crée de test d'un autre site (404 côté moteur, 403 côté route via `siteOfRequest`). La liste d'un site s'ouvre avec `?site=`.
- Toutes les valeurs du formulaire sont revalidées côté serveur (répartition, confiance, fenêtre, version retenue) ; échappement systématique (EJS) ; requêtes paramétrées ; recherche avec caractères joker neutralisés. Le gagnant n'est jamais lu depuis le navigateur sans validation (`a`/`b` seulement).
- **Suppression non destructive** : seul un brouillon sans aucune donnée se supprime ; sinon, terminer puis archiver (restaurable). Une page testée (A ou B) ne part pas à la corbeille ni n'est supprimée tant que le test n'est pas terminé.
- **Historique** : le journal d'audit existant (`page_test.created/updated/started/paused/resumed/completed/archived/restored/deleted`).

## Tunnel
Une étape de tunnel référence une page CMS : tester la page de l'étape (« Tester en A/B » sur l'étape) remplace son contenu pour une partie des visiteurs sans toucher à l'enchaînement du tunnel. Le détail du test affiche l'étape et le tunnel. Achats et chiffre d'affaires par version : lus dans la boutique avec la règle ci-dessus (population de personnes suivies).

## Analytics
Le tableau de bord Analytics central affiche une section « Tests A/B » (en cours, en pause, terminés sur la période, taux par version et statut statistique) : lecture seule des résultats du moteur d'A/B, qui reste propriétaire du verdict.

## Événements pour l'automatisation
Non émis dans ce palier (risque de volume et de bruit pour les scénarios) : `experiment.started`, `experiment.exposure`, `experiment.conversion`, `experiment.completed` sont **préparés** par le journal d'audit et le journal d'expositions mais pas publiés sur le bus.

## Tests
`tests/cms-abtest.test.js` (statistiques, validations, statuts, affectation collante, fenêtre d'attribution, achats, anomalies, isolation, performance), `tests/cms-abtest-web.test.js` (bout en bout avec vrai serveur, cache, SEO, rôles, IDOR, XSS, tunnel), `tests/cms-abtest-navigateur.test.js` (Chrome : écrans, mobile, clavier, console), plus les tests existants des tests A/B (`site-web-tests-ab`, `marketing-tests-ab*`) mis à jour.
