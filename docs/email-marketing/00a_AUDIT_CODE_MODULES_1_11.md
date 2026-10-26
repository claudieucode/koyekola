# Audit de code (lecture seule) : modules e-mailing 1 à 11

Date : 26 octobre 2026. Branche `feat/email-marketing`. Audit factuel par lecture du code (les documents `EMAIL_MARKETING_*.md` n'ont pas été pris comme source). Les tests cités ont été exécutés sur cette machine (voir section « Exécution des tests »). Aucun fichier du dépôt n'a été modifié en dehors de ce rapport ; deux scripts de reproduction jetables ont été écrits hors dépôt (dossier temporaire de session) pour confirmer les bugs B1 et B2.

Légende des états :
- **V** = Fonctionnelle et vérifiée (au moins un test qui la couvre, exécuté et vert)
- **I** = Fonctionnelle insuffisamment testée (code réel, couverture absente, indirecte, ou seulement en navigateur ignoré sans Chrome)
- **P** = Partielle (une partie du périmètre attendu manque)
- **UI** = Interface sans logique
- **NI** = Non implémentée
- **BE** = Bloquée par une dépendance externe

Les chemins sont relatifs à `src/marketing/` sauf mention contraire. `public/js/...` est à la racine du dépôt.

---

## 1. Contacts et audiences

| Fonction | État | Preuves (code) | Preuves (tests) |
|---|---|---|---|
| Création / modification / suppression, e-mail normalisé, statut jamais modifiable hors conformité | V | `audience/contacts.js:60` (upsert), `:101` (update, `immutable_field`), `:120` (delete) | `marketing-audience.test.js` : « le statut fourni à la création est IGNORÉ », « modification : champs modifiables seulement » |
| Import CSV : aperçu, mappage, analyse à blanc, exécution par tranches reprenables, rejets conservés | V | `import/service.js:123` (preview), `:194` (processRows), `:319` (analyze), `:339`/`:359`/`:373` (start/resume/slice) ; parseur RFC 4180, BOM, `;`, Windows-1252 : `import/csv.js:9-84` | `marketing-import.test.js` (« l'import se fait par tranches ; interrompu entre deux tranches, il reprend sans doublon ni perte », « analyse à blanc : rien n'est écrit »), `marketing-import-csv.test.js` |
| Doublons dans le fichier / avec l'existant | V | `import/service.js:222-228` (doublon dans le fichier, détecté même sur une autre tranche via `firstIndex`), modes `fill`/`skip`/`overwrite` (`:165-190`) | « un doublon dans le fichier est détecté même s'il tombe dans une autre tranche » |
| Consentement à l'import | V | `import/service.js:176-182` (message `:180`) (case cochée + preuve de 10 caractères), ne réabonne jamais un désinscrit ni une adresse supprimée ; par défaut `unknown` | « abonne les nouveaux contacts avec une preuve ; ne réabonne JAMAIS un désinscrit ni une adresse supprimée » |
| Détection de doublons dans la base | P | `contactcore/index.js:208` : critères « même téléphone normalisé » (fort) et « même nom + entreprise » (possible) uniquement ; pas de rapprochement flou ; l'e-mail exact est déjà unique | `cms-contacts-core.test.js` « détection de doublons : même numéro = fort, même nom + entreprise = possible » |
| Fusion de contacts | V avec bug (B1) | `contactcore/index.js:240` (aperçu), `:263-296` (fusion transactionnelle, alias, journal `mk_contact_merges` avec instantané) ; pas de « défusion » (l'instantané n'est pas exploité) | `cms-contacts-core.test.js` « fusion » (4 tests), `cms-contacts-web.test.js` « doublon par numéro → aperçu → confirmation obligatoire → fusion » |
| Consentement : preuve, IP tronquée, historique, retrait | V | `compliance/consent.js:50` (recordConsent), `:76` (unsubscribe global/liste), `:113` (isSendable), `:144` ; SQL en masse identique `compliance/sendable.js:5` | `marketing-conformite.test.js` (29 tests), « INVARIANT : le calcul en masse donne exactement les contacts que isSendable accepte » (`marketing-campaigns.test.js`) |
| Liste de suppression, rebonds durs, plaintes | V | `compliance/suppression.js:11`, `sending/webhooks.js:12-44` | `marketing-conformite.test.js` « liste de suppression » (8 tests) |
| Archivage / état de la fiche | V avec écart (B2) | `contactcore/index.js:195` (`active`/`inactive`/`archived`), `compliance/sendable.js:7` (une fiche non active n'est jamais joignable) ; route `web/contactCore.js:54` (droit `contacts.archive`) | `cms-contacts-core.test.js` « une fiche archivée, inactive ou fusionnée n'est jamais joignable », `cms-contacts-web.test.js` « archivage : l'éditeur archive, la fiche sort de la liste par défaut... » |
| Export CSV | V avec bug (B3) | `audience/export.js:23` (lots de 1000, BOM, audit), `web/admin.js:114` (droit `contacts.export`) ; 12 colonnes fixes, sans propriétés personnalisées ni consentement/preuve | `marketing-r2-contacts-data.test.js` (export), `cms-contacts-web.test.js` « contacts : jamais coché d'office, réservé aux droits export... » |
| Listes, étiquettes, actions groupées | V | `audience/lists.js`, `audience/tags.js`, `audience/bulk.js:20` ; « être dans une liste NE donne AUCUN consentement » | `marketing-audience.test.js` (listes, étiquettes), `marketing-r2-contacts-web.test.js` (« tout ou rien ») |
| Propriétés personnalisées typées | V | `audience/properties.js` | `marketing-audience.test.js` « propriétés personnalisées » ; `cms-contacts-core.test.js` « champs personnalisés étendus » |
| Isolation par organisation et par site | V | `contactcore/siteAccess.js`, requêtes bornées par `organization_id` | tests « isolation entre organisations » (audience, import, segments) ; `cms-contacts-web.test.js` « une personne limitée au site A ne voit que ses contacts » |
| Report des désabonnements par liste, refus de catégorie, accord SMS lors d'une fusion | NI (bug B1) | `contactcore/index.js:277-293` ne copie que étiquettes, listes, propriétés, notes, événements, visites | aucun test |
| Réactivation d'une fiche archivée par un nouveau consentement | NI (bug B2) | `contactcore/index.js` (`identify`) ne touche jamais `record_status` | aucun test |
| Rebonds mous (compteur de répétitions) | NI | `sending/webhooks.js:37` : seul le rebond permanent supprime ; le rebond temporaire est seulement enregistré | — |

## 2. Segmentation

| Fonction | État | Preuves | Tests |
|---|---|---|---|
| Moteur de règles ET / OU / NON, imbrication, profondeur et nombre bornés, SQL paramétré | V | `segments/engine.js:123` (compilateur), `:322` (`compile`), `segments/index.js:17` (`build`) | `marketing-segments.test.js` (« ET, OU, NON et imbrications », « injection SQL : noms de champs jamais concaténés », « profondeur et nombre de règles limités ») |
| Moteur partagé campagnes / automatisations | **V : un seul moteur** | Campagnes : `sending/audience.js:17-22` (`segments.selectSql`) ; automatisations : `automations/actions/logic.js:42` (condition `segment`) et `:92` (route) via `segments.matches` (`segments/index.js:49`) | `marketing-segments.test.js` « appartenance d'un contact précis (pour les automatisations) », `marketing-campaigns.test.js` « cible « segment » : même règle, jamais plus large que la conformité » |
| Champs : contact, dates, étiquettes, listes, propriétés, activité (35 événements), dépenses, score | V | `segments/catalog.js` (`fieldCatalog`) | `marketing-r3-segments-data.test.js` (activité, montants), `marketing-segments-catalog.test.js` « INVARIANT : chaque combinaison proposée est acceptée » |
| Segments enregistrés (CRUD, duplication, usages, vue d'ensemble) | V | `segments/index.js:63-135` | `marketing-r3-segments-data.test.js`, `marketing-segments.test.js` |
| Segment dynamique (évalué à chaque lancement) | V | aucune liste figée ; la campagne matérialise ses destinataires au lancement (`sending/dispatch.js:88`) | `marketing-campaigns.test.js` |
| Éditeur visuel de segments (interface) | I | `public/js/marketing-segments.js`, `views/marketing/segment-form.ejs` | `marketing-r3-segments-web.test.js` |
| Segment comme déclencheur d'automatisation (entrée / sortie de segment) | NI | `automations/catalog.js` : 43 déclencheurs, aucun « entre dans le segment » | — |
| Segments prédictifs | NI | aucun code | — |

## 3. Campagnes

| Fonction | État | Preuves | Tests |
|---|---|---|---|
| Cycle de vie : brouillon → programmée → en cours → envoyée ; pause, reprise, annulation ; échec | V | `sending/dispatch.js:56` (`startCampaign`), `:203` (`dispatchBatch`), `:283-307` (pause/reprise/annulation), `:124` (finalize) | `marketing-campaigns.test.js` « pause, reprise, annulation », « modèle devenu invalide après le lancement : campagne en échec » |
| Programmation d'un envoi | V (réserve fuseau, B5) | `dispatch.js:63` (futur, moins d'un an), `:105` (tâche à `runAt`) | « programmation : le travail est planifié à l'heure demandée » |
| Heure locale du contact / meilleure heure | V | `sending/sendtime.js` (fuseau du contact → compte → pays à fuseau unique → défaut organisation), `dispatch.js:95-101` | `marketing-heure-envoi.test.js` (10 tests : heure d'été, ordre des sources, refus si heure passée) |
| Fuseau de la programmation à heure fixe | P | `web/campaigns.js:50-56` : heure lue en UTC (champ caché fourni par JavaScript) et affichée « (UTC) » (`views/marketing/campaign.ejs:361`) | `marketing-interface-4.test.js` |
| Contenu figé, destinataires matérialisés, aucun doublon au rejeu | V | `dispatch.js:69-110`, `:239-243` (réservation `queued → sending`) ; envoi interrompu jamais rejoué (`:227`) | « modifier le modèle après le lancement ne change pas ce qui est envoyé », « envoi interrompu ... JAMAIS renvoyé automatiquement », « idempotence : rappeler l'envoi ne renvoie rien » |
| Conformité revérifiée à chaque message | V | `dispatch.js:142` | « CONFORMITÉ À CHAQUE MESSAGE », « désinscription de LA LISTE ciblée entre-temps » |
| Débit, plafond quotidien, reprises (3 essais), erreurs fournisseur | V | `dispatch.js:113-122`, `:178-199` | « débit par minute », « plafond quotidien », « échec temporaire », « adresse refusée par le serveur », « limitation par le fournisseur », « configuration refusée » |
| Pré-vérification avant envoi | V | `sending/preflight.js:18-71` : modèle prêt, fournisseur, expéditeur, domaine, SITE_URL en https, clé de jetons, audience joignable, A/B ; avertissements (adresse postale, worker) | `marketing-campaigns.test.js` (« prêt », « erreurs bloquantes », « avertissements ») |
| Assistant en 7 étapes | V | `sending/wizard.js:11-35` | `marketing-r4-campagnes-data.test.js` (7 tests d'étapes) |
| E-mail de test | V | `templates/testSend.js:21-44` : destinataire limité aux membres de l'équipe, objet `[TEST]`, liens factices ; 10 tests/heure (`web/campaigns.js:64`), route `:320` | `marketing-templates-test-send.test.js` (9 tests) |
| Objet de campagne distinct du modèle | P | l'objet vient du modèle (`dispatch.js:39`) ; seuls les tests A/B surchargent l'objet | — |
| Replanification d'une campagne déjà programmée | P | seulement pause, reprise ou annulation (`dispatch.js:283-307`) ; seul un brouillon est modifiable (`sending/campaigns.js:76`) | — |
| Suivi clics / ouvertures, désinscription en un clic (en-têtes) | V | `sending/builder.js:50`, `sending/tracking.js` | `marketing-tracking.test.js`, `marketing-public.test.js` |
| Envoi réel (SMTP / Resend), délivrabilité, boîte de réception | BE | `sending/providers/smtp.js`, `resend.js` ; vérification DNS réelle `domains/index.js` (SPF, DKIM, DMARC) | fournisseur simulé uniquement |
| Renvoi aux non-ouvreurs, campagne récurrente | NI | aucun code | — |

## 4. Éditeur visuel d'e-mail

| Fonction | État | Preuves | Tests |
|---|---|---|---|
| Blocs (16 types rendus) | V | `templates/blocks.js:37` (`TYPES` : titre, texte riche, image, bouton, séparateur, espace, colonnes, citation, liste, réseaux sociaux, vidéo, formation, lien, coupon, articles, sondage) ; 60 blocs max (`:689`) | `marketing-templates-blocks.test.js` (37 verts sur 38, voir exécution), `marketing-r5-blocs.test.js`, `marketing-builder-pro.test.js` |
| Palette de 31 entrées (16 blocs + 15 ensembles prêts) | V | `templates/catalog.js` | `marketing-bibliotheque-blocs.test.js` |
| Blocs enregistrés réutilisables | I | migration `060_blocs_enregistres.sql`, routes `web/templates.js:208-211` | couverture partielle (`marketing-bibliotheque-blocs.test.js`) |
| Annuler / rétablir | I | client seulement : pile de 100 états en mémoire, Ctrl+Z, fusion des frappes (`public/js/marketing-editor.js:100-144`) ; perdue au rechargement | `marketing-r5-editeur.test.js` (présence des boutons) ; comportement réel testé dans `marketing-editeur-canvas-stable-navigateur.test.js`, ignoré sans Playwright/Chrome |
| Enregistrement automatique | V | client : 2,5 s après modification (`marketing-editor.js:1990`), alerte à la fermeture (`:2030`) ; serveur : `templates/index.js:128-165` | `marketing-medias.test.js` (lignes 138-153 : autosave, rétention, écrasement refusé) |
| Versions, restauration, verrou optimiste | V | `templates/index.js:12` (20 versions), `:160` (conflit), restauration = nouvelle version | `marketing-r5-bibliotheque.test.js`, `marketing-medias.test.js` |
| Édition mobile | V (rendu réel hors test) | `templates/blocks.js:162-200` (réglages mobiles par bloc), colonnes empilées / inversées, masquage mobile/ordinateur ; canevas « Mobile » 375 px (`marketing-editor.js:757-775`) | `marketing-builder-pro.test.js` (« non empilées... inversées », « masqué sur mobile ») |
| Version texte brut | P | générée automatiquement depuis le HTML (`templates/text.js:7`, `blocks.js:800`) ; pas d'édition ni de surcharge manuelle | `marketing-r5-blocs.test.js`, `marketing-templates-blocks.test.js` |
| Lint de délivrabilité | V | `templates/lint.js:20-39` : objet vide/long/majuscules/exclamations, préheader, variable sans repli, image seule, poids (> 90 Ko), adresse postale, contraste du bouton, > 30 liens, images manquantes | `marketing-r5-bibliotheque.test.js`, `marketing-r5-blocs.test.js` |
| Accessibilité | P | texte alternatif obligatoire ou case « décorative » (`blocks.js:347-348`), contraste du bouton ; aucune vérification de hiérarchie des titres, d'intitulés de liens, du contraste du texte courant | idem |
| Vérification des liens | P | adresses validées (https, mailto, liens système) à l'enregistrement (`blocks.js:209-230`) ; aucun contrôle HTTP de joignabilité (la page `broken-links` concerne le site) | — |
| Aperçu (avec contact réel), plein écran | I | `web/templates.js:128`, `:165` ; `public/js/mk/preview.js` | `marketing-apercu-v2.test.js`, tests navigateur |
| Glisser-déposer, sélection, inspecteur | I | `public/js/mk/*.js` | surtout tests navigateur |

## 5. Bibliothèque de templates

| Élément | Constat |
|---|---|
| Nombre réel de modèles de départ e-mail | **15** (`templates/starters.js` : blank, welcome, welcome_course, newsletter, newsletter_editorial, course, course_launch, promo, webinar, reengage, feedback, order_confirmation, enrollment_confirmation, lesson_done, course_done) |
| Répartition | Général 1, Bienvenue 2, Lettre d'information 2, Formation 2, Promotion 1, Événement 1, Relance 2, Transactionnel 4 (8 catégories, `templates/categories.js`) |
| Contenu fonctionnel | 66 blocs : texte 18, titre 15, bouton 14, liste 5, citation 4, séparateur 3, réseaux sociaux 3, vidéo 2, colonnes 2 ; aucun bloc formation, coupon, articles ou sondage dans les modèles |
| Autres contenus e-mail | 85 parcours d'automatisation utilisables sur 99 (14 affichés « non disponibles » avec leur raison), 122 e-mails (`automations/journeys.js`, `automations/library/*.js`). Le chiffre « 160 thèmes » du dossier mémoire concerne les thèmes de site, pas des e-mails |
| État | **V** : `marketing-r5-bibliotheque.test.js` (« au moins douze modèles ... », « chaque modèle est valide, prêt à l'envoi, sans erreur ni conseil de délivrabilité évitable », « aucun modèle ne contient d'adresse réelle ») ; `marketing-r5-editeur.test.js` (« chaque modèle de départ peut être créé par l'interface ») |
| Écarts | bibliothèque modeste ; pas de modèles sectoriels ; pas d'import de HTML externe côté e-mail (l'import `web/templatesLibrary.js:46` concerne les modèles de page du site) ; « enregistrer comme modèle » (`templates/saved.js`) : I |

## 6. Personnalisation

| Fonction | État | Preuves | Tests |
|---|---|---|---|
| Moteur à grammaire fermée (variables, filtres, conditions) | V | `templates/engine.js` : `{{ chemin \| filtre }}`, `{% if / elif / else / endif %}`, `and`/`or`/`not`, `==`, `!=`, `contains` ; liste blanche des chemins à la compilation (`checkPath`), propriétés propres seulement (`lookup`), bornes de taille et de profondeur | `marketing-templates-engine.test.js` (30 tests, verts) |
| Repli (valeur par défaut) | V | filtre `default:"ami"` ; variable vide ⇒ chaîne vide (jamais `undefined`) ; lint `variable_no_default` (`lint.js:28`) | « variable absente, vide ou d'un autre type : chaîne vide » |
| Contenu conditionnel | V | blocs affichables sous condition (`compileCondition`) ; préréglage « Contenu selon le pays » (`catalog.js`) ; profondeur max 5 | `marketing-templates-engine.test.js`, `marketing-builder-pro.test.js` |
| Échappement selon le contexte (HTML, texte, en-tête) | V | `engine.js` (`escapeHtml`, `stripControls`) ; valeur jamais réinterprétée comme gabarit | `marketing-templates-blocks.test.js` « fuzz : aucune valeur hostile ... » |
| Propriétés personnalisées et variables d'événement | V | `templates/context.js`, `automations/engine.js:25-33` | `marketing-automations.test.js` « l'événement de déclenchement alimente les variables du modèle » |
| Filtres | P | 9 filtres (`default, upper, lower, capitalize, title, trim, truncate, number, date`) ; pas de devise, de date relative | — |
| Contenu dynamique (boucle, recommandations) | NI | pas de `for` dans le moteur ; le bloc « Articles » ne se remplit que pour une campagne RSS | — |

## 7. Tests A/B

| Fonction | État | Preuves | Tests |
|---|---|---|---|
| A/B e-mail : 2 ou 3 versions (objet et/ou contenu), part testée 10-50 %, délai 60 min à 7 jours, critère clics / ouvertures / revenus / manuel | V | `sending/abtest.js:50-84`, `:112-130` (tirage Fisher-Yates cryptographique, reste tenu en attente), `:136-143` (décision programmée), `:176-199` (gagnant, libération du reste) | `marketing-tests-ab.test.js` (20 tests) ; `marketing-tests-ab-web.test.js` (10 tests) |
| Garde-fous (suivi nécessaire, cible assez grande, modèle existant, versions identiques) | V | `abtest.js:93-109`, `:71-72` | « critère « ouvertures » sans suivi ... : bloqué », « cible trop petite ... » |
| Choix du gagnant | P | `abtest.js:168-173` : meilleur taux brut, départage par l'autre taux puis par A ; aucun test de significativité, aucun effectif minimal (jusqu'à 2 destinataires par version, `MIN_PER_VARIANT`, `:22`) ; ouvertures indicatives | « égalité parfaite : départage par l'autre taux, puis la version A » |
| A/B sur pages (landing / site) | V, plus rigoureux | `pages/abtests.js`, `pages/abstats.js` (deux proportions, intervalle, 100 vues, 20 conversions, 7 jours, contrôle de répartition) | `cms-abtest.test.js` (31 tests) |
| A/B d'automatisation | P | action `split` = tirage aléatoire de chemin (`automations/actions/logic.js`), sans mesure ni gagnant | `marketing-automations.test.js` « split (tirage aléatoire) » |
| A/B sur l'heure d'envoi ou l'expéditeur | NI | A/B refusé avec heure locale/optimisée (`dispatch.js:61`) | `marketing-heure-envoi.test.js` « test A/B : refusé » |

## 8. Automatisations

| Fonction | État | Preuves | Tests |
|---|---|---|---|
| Déclencheurs (43 événements, jusqu'à 3 par scénario, filtres) | V | `automations/catalog.js` ; entrée `automations/engine.js:44-80` | `marketing-automations.test.js` « plusieurs déclencheurs (jusqu'à 3) », « filtre sur une métadonnée » ; `cms-automation-engine.test.js` « déclencheur sur une valeur » |
| Déclencheur calendaire (date, anniversaire, récurrent) | NI | aucun déclencheur « à telle date » ; parcours « Anniversaire » affiché « non disponible » (`automations/journeys.js:238-242`) ; contournement partiel : `wait_until` sur un champ date (`actions/time.js`) | — |
| Actions (22 types : e-mail, SMS, notifier l'équipe, attentes ×3, condition, split, route, champ, étiquettes, listes, score, note, copier, date, calcul, démarrer/arrêter un parcours, webhook, fin) | V | `automations/actions/*.js`, toutes `available` | `marketing-registre-actions.test.js`, `marketing-actions-*.test.js` (non rejoués) |
| Branches / conditions / routes | V | `actions/logic.js:11-60` (segment, e-mail ouvert, e-mail cliqué) ; sauts vers l'avant seulement, reconvergence ; garde de 100 étapes (`engine.js:123`) | `marketing-automations-branching.test.js` (12), `marketing-automations-graph.test.js` (16) |
| Délais et attentes (durée, heure, jour, date, champ date, heures ouvrables, attente d'événement avec délai maximal) | V | `actions/time.js` (fuseau réel du contact, changement d'heure, jamais d'attente illimitée) ; réveil par date en base, aucun processus qui dort | `marketing-automations.test.js` « e-mail → attente d'1 jour → e-mail... reprise après attente », « attendre jusqu'à un événement » |
| Idempotence | V (réserve B4) | un contact n'entre qu'une fois (`UNIQUE (automation_id, contact_id)`, `migrations/009_pont_automatisations.sql:53`, `INSERT OR IGNORE` `engine.js:71`) ; un message par (étape, contact) (`actions/send.js:44-46`) | `cms-automation-engine.test.js` « un même événement distribué deux fois, puis rejoué, ne crée qu'un passage et n'envoie qu'un e-mail » |
| Ré-entrée d'un contact | NI (choix de conception) | une seule entrée par scénario (`journeys.js:311`) ; impossible de relancer deux fois un panier abandonné | « un nouvel événement du même type pour le même contact ne le fait pas entrer une seconde fois » |
| Reprise après arrêt | V | état en base (`step_index`, `wake_at`, `attempts`), bail du worker (`queue/worker.js`), reprise `service.js:321` | `marketing-file-evenements.test.js`, `marketing-automations.test.js` « reprise après attente » |
| Retries | V | e-mail 3 essais (`actions/send.js:75-80`) ; webhook 6 essais (`actions/integrations.js`) ; notification équipe (`notify.js`) | `cms-automation-engine.test.js` « panne temporaire du fournisseur : réessai espacé avec compteur ; au-delà du maximum, échec visible » |
| Versions | V | activation = version figée (`service.js:287-302`, `mk_automation_versions`) ; passages en cours gardent leurs étapes ; modification interdite en actif | `cms-automation-engine.test.js` « publier = version figée » |
| Objectif atteint (sortie automatique) | V | `engine.js:55-61` | partiel dans `marketing-automations*.test.js` |
| Simulation à blanc, historique, trace | V | `dryrun.js:63`, `history.js`, `trace.js` | `cms-automation-engine.test.js` « annonce ce qui serait fait pour un contact réel... n'écrit RIEN » |
| Bibliothèque de parcours (99, dont 85 utilisables) | I | `automations/journeys.js`, `library/*.js` | `marketing-parcours-bibliotheque.test.js`, `marketing-parcours-bout-en-bout.test.js` |
| Protection contre les boucles | V | les actions n'émettent aucun événement (`engine.js:105`) | « pas de boucle : les actions d'un scénario n'émettent aucun événement » |
| SMS en scénario | BE | opérateur SMS requis (`actions/send.js:96-135`) | fournisseur simulé |

## 9. Formulaires

| Fonction | État | Preuves | Tests |
|---|---|---|---|
| Création, champs, logique conditionnelle et obligatoires recalculés côté serveur, propriétés, étiquettes, liste, redirection sûre | V | `forms/index.js:120`, `:251-353` ; `forms/fields.js` | `marketing-forms-data.test.js` (20), `marketing-forms-suite.test.js` (12) |
| Consentement : case obligatoire revérifiée côté serveur, preuve (texte + IP tronquée) | V | `web/formsPublic.js:107`, `forms/index.js:341` | `marketing-forms-public.test.js` « soumission sans cocher la case : refusée (revérifié côté serveur) » |
| Double opt-in | V | `forms/index.js:325-338` (jeton de 32 octets haché, expiration, usage unique `:437-455`), e-mail `utils/mailer.js:134`, `web/formsPublic.js:122-127` | `emails.test.js` (22 verts : « confirmation : consentement prouvé (mention double opt-in), usage unique », « newsletter en double confirmation : ... bouton obligatoire »). Les tests `marketing-forms-*` le désactivent (activé par défaut à la création) |
| Anti-spam | P | champ piège + jeton de temps signé (≥ 2 s) `forms/antispam.js` ; 5 soumissions/heure/IP, limiteur en mémoire (`formsPublic.js:17`) ; signature du fichier joint ; pas de CAPTCHA | `marketing-forms-public.test.js` « champ piège rempli : faux succès silencieux », « plafond : 5 soumissions par heure et par IP » |
| Désinscription par jeton signé (GET sans effet, POST, un clic RFC 8058) | V | `web/public.js:55-77`, `compliance/consent.js:144` | `marketing-public.test.js` (16 tests) |
| Page de préférences | P | `web/public.js:88-115` : catégories, désinscription globale, réabonnement par la personne ; pas de fréquence, pas de modification des données, abonnements par liste non exposés | `marketing-public.test.js` « GET : catégories cochées », « un désinscrit peut se réabonner LUI-MÊME » |
| Pop-up (déclencheurs, fréquence) | I | `forms/index.js` (`POPUP_TRIGGERS`) | `marketing-popups-*.test.js` (non rejoués) |
| Accord SMS distinct | I | `forms/index.js:388` | `marketing-sms.test.js` (non rejoué) |

## 10. Landing pages

| Fonction | État | Preuves | Tests |
|---|---|---|---|
| Création, sections à grammaire fermée, publication, hors ligne, suppression | V | `landing/index.js:77-189` ; sections partagées avec le site (`pages/sections.js`) | `marketing-pages-atterrissage.test.js` (8 tests) |
| Inscription via un formulaire publié (consentement, double confirmation, liste, étiquettes) | V | `web/landingPublic.js:131`, publication refusée si le formulaire n'est pas publié (`landing/index.js:133-160`) | « publication refusée tant que le formulaire n'est pas publié », « inscription : consentement exigé ; contact abonné, dans la liste, avec les étiquettes » |
| Statistiques (visiteurs uniques/jour, robots exclus, clics, inscriptions) | V | `landing/index.js:471-490` | « visites : un visiteur compté une fois par jour, robots exclus » |
| Versions, programmation de publication, comparaison, archivage | I | `web/landing.js:255`, `:521-598` ; migration `069_pages_programmees.sql` | `cms-pages.test.js`, `cms-revisions.test.js` (non rejoués) |
| Éditeur visuel de pages | I | `public/js/page-builder*.js`, `web/landing.js:427` | tests navigateur |
| A/B de pages | V | voir §7 | `cms-abtest.test.js` |
| Domaine personnalisé par page | NI | pages servies sous `/p/<adresse>` (`web/landingPublic.js:80`) ; `domains/index.js` concerne le domaine d'expédition | — |
| Génération assistée (IA) | BE | `web/landing.js:416`, `ai/studio.js` : dépend d'une clé fournisseur IA | `marketing-ia-redaction.test.js` (simulé) |

---

## Bugs réels confirmés (avec scénario)

**B1. Fusion de contacts : les désabonnements par liste et les refus de catégorie de la fiche absorbée sont perdus (conformité).** Gravité élevée.
- Scénario (reproduit par script, résultat observé) : le contact X est abonné, membre de la liste « Newsletter », désinscrit de cette liste (`unsubscribe(scope:"list")`) et refuse la catégorie « promos » ; le contact Y est abonné. `mergeContacts(master=Y, source=X)`. Résultat : Y devient membre de la liste (copie des appartenances, `contactcore/index.js:287`), `isSendable(Y, {listId})` renvoie `ok: true` et `isSendable(Y, {category:"promos"})` renvoie `ok: true`. La personne reçoit à nouveau des messages dont elle s'était désabonnée.
- Cause : `mergeContacts` (`contactcore/index.js:263-296`) ne reporte ni `mk_unsubscribes` (portée liste), ni `mk_contact_preferences`, ni l'accord SMS ; seul le statut global est rendu plus restrictif (`RESTRICTIVE`, `:229`).
- Test existant : `cms-contacts-core.test.js` « le consentement du maître ne devient jamais plus permissif » ne couvre que le statut global.

**B2. Une fiche archivée (ou inactive) qui se réinscrit par formulaire est « abonnée » mais jamais joignable, sans signal.**
- Scénario (reproduit) : contact abonné, archivé (`setRecordStatus`), soumet à nouveau un formulaire publié. Réponse : succès, `status = subscribed`, `record_status = archived`. `isSendable` renvoie `inactive_record` : la personne n'est jamais contactée alors qu'elle vient de redonner son consentement (preuve enregistrée). Le résumé d'audience d'une campagne range ce contact sous `category_opted_out` (le `ELSE` de `sending/audience.js:54`), motif faux ; une raison « fiche non active » manque.
- Cause : `identify` ne réactive jamais `record_status` ; `audienceSummary` n'a pas de branche pour `record_status`.

**B3. L'export CSV altère les numéros de téléphone internationaux.** Gravité moyenne.
- Scénario (reproduit) : `toCsv([["a@b.c","+243812345678","-5"]])` produit `a@b.c,'+243812345678,'-5`. Tout numéro commençant par `+` (format international E.164) est exporté avec une apostrophe en tête ; un réimport l'enregistre tel quel.
- Cause : la neutralisation anti-injection de formules s'applique à toute cellule commençant par `= + - @` (`import/csv.js:90`), y compris les colonnes de numéros.

**B4. Étape e-mail d'un scénario : doublon possible si le processus s'arrête entre l'envoi et l'écriture du statut.** Gravité faible à moyenne (fenêtre étroite).
- `automations/actions/send.js:44-46` : le message reste `pending` pendant l'appel au fournisseur, puis passe `sent`. Si le travail meurt entre les deux, la reprise (bail expiré) retrouve `pending` et renvoie. Les campagnes évitent ce cas par l'état `sending` et la règle « jamais rejoué » (`dispatch.js:227`) ; les SMS de scénario ont cette protection (`send.js:105-112`), pas les e-mails.

**B5. Programmation d'une campagne : saisie et affichage en UTC.** Gravité faible (ergonomie). La saisie est convertie en UTC par le navigateur mais la page n'affiche que l'UTC (`views/marketing/campaign.ejs:361`) ; le fuseau par défaut de l'organisation ne s'applique qu'aux envois « heure locale / meilleure heure ».

## Écarts priorisés

Priorité 1 (conformité et intégrité des données)
1. B1 : reporter à la fusion les désabonnements par liste, refus de catégories et accords SMS (retenir le plus restrictif), avec test de non-régression.
2. B2 : décider du comportement d'une réinscription sur fiche archivée (réactiver ou prévenir) et corriger le motif d'exclusion « fiche non active » dans `audienceSummary`.
3. B3 : corriger la neutralisation de formule pour ne pas casser les numéros `+...` ; ajouter un test d'aller-retour export/import.
4. B4 : appliquer aux e-mails de scénario le schéma des campagnes (état `sending`, « interrompu : jamais rejoué »).

Priorité 2 (fonctions attendues d'un outil d'e-mailing)
5. A/B e-mail : effectif minimal et test de significativité avant de désigner un gagnant automatique (réutiliser `pages/abstats.js`).
6. Automatisations : pas de ré-entrée (paniers abandonnés, achats répétés), pas de déclencheur calendaire, pas d'entrée/sortie de segment.
7. Programmation : fuseau d'affichage et de saisie de l'organisation, replanification d'une campagne programmée, objet de campagne distinct du modèle.
8. Page de préférences : abonnements par liste, fréquence, mise à jour des données de la personne.
9. Rebonds mous : compteur de répétitions avant suppression.
10. Éditeur : version texte brut éditable, lint d'accessibilité complet (titres, intitulés de liens, contraste du texte), contrôle HTTP des liens, historique d'annulation persistant.
11. Export contacts : propriétés personnalisées, état et date de consentement.

Priorité 3 (tests et robustesse)
12. Annuler/rétablir, glisser-déposer et inspecteur ne sont vérifiés que par des tests Playwright ignorés sans Chrome.
13. Ajouter un test de formulaire avec double opt-in activé dans `marketing-forms-*` (activé par défaut en production, désactivé dans ces fichiers).
14. Anti-spam : pas de CAPTCHA ; limiteur en mémoire, non partagé entre processus ni conservé au redémarrage.
15. Bibliothèque : 15 modèles, sans modèles sectoriels, aucun n'utilise les blocs formation / coupon / articles / sondage.
16. Moteur de gabarits : pas de boucle ni de recommandation de produits.
17. Test fragile : `marketing-templates-blocks.test.js` « 5 000 rendus d'un modèle compilé : rapide » (seuil absolu 3 s) échoue sur cette machine (5,8 s en exécution isolée) : seuil dépendant du matériel.

Dépendances externes (BE) : délivrabilité réelle SMTP / Resend, authentification DNS du domaine d'expédition, webhooks de rebond / plainte du fournisseur, opérateur SMS, fournisseur IA ; tous testés avec des simulations.

## Exécution des tests

Commande : `NODE_PATH=/Users/imac/ClaudeProjects/KOYEKOLA-deploy/node_modules TEST_START_TIMEOUT_MS=600000 node --test tests/<fichier>.test.js`, par petits groupes (jusqu'à 5 fichiers en parallèle sur une machine lente). Résultats (tests / réussis) :

| Fichier | Tests | Réussis |
|---|---|---|
| `marketing-audience.test.js` | 25 | 25 |
| `marketing-import-csv.test.js` | 17 | 17 |
| `marketing-import.test.js` | 30 | 30 |
| `marketing-r2-contacts-data.test.js` | 43 | 43 |
| `cms-contacts-core.test.js` | 24 | 24 |
| `marketing-segments.test.js` | 32 | 32 |
| `marketing-r3-segments-data.test.js` | 26 | 26 |
| `marketing-campaigns.test.js` | 35 | 35 |
| `marketing-r4-campagnes-data.test.js` | 22 | 22 |
| `marketing-heure-envoi.test.js` | 10 | 10 |
| `marketing-templates-test-send.test.js` | 9 | 9 |
| `cms-email-engine.test.js` | 12 | 12 |
| `marketing-email-jetons.test.js` | 13 | 13 |
| `marketing-segments-catalog.test.js` | 5 | 5 |
| `marketing-r5-bibliotheque.test.js` | 21 | 21 |
| `marketing-r5-blocs.test.js` | 35 | 35 |
| `marketing-r5-editeur.test.js` | 41 | 41 |
| `marketing-templates-blocks.test.js` | 38 | 37 (1 échec : seuil de performance) |
| `marketing-templates-engine.test.js` | 30 | 30 |
| `marketing-templates-service.test.js` | 27 | 27 |
| `marketing-builder-pro.test.js` | 15 | 15 |
| `marketing-bibliotheque-blocs.test.js` | 23 | 23 |
| `marketing-tests-ab.test.js` | 20 | 20 |
| `marketing-automations.test.js` | 41 | 41 |
| `marketing-automations-branching.test.js` | 12 | 12 |
| `marketing-automations-graph.test.js` | 16 | 16 |
| `cms-automation-engine.test.js` | 22 | 22 |
| `marketing-parcours.test.js` | 11 | 11 |
| `marketing-parcours-bibliotheque.test.js` | 39 | 39 |
| `marketing-parcours-bout-en-bout.test.js` | 1 | 1 |
| `marketing-registre-actions.test.js` | 10 | 10 |
| `marketing-forms-data.test.js` | 20 | 20 |
| `marketing-forms-public.test.js` | 8 | 8 |
| `marketing-forms-suite.test.js` | 12 | 12 |
| `marketing-pages-atterrissage.test.js` | 8 | 8 |
| `marketing-public.test.js` | 16 | 16 |
| `marketing-tracking.test.js` | 27 | 27 |
| `marketing-worker-humain.test.js` | 6 | 6 |
| `emails.test.js` | 22 | 22 |
| `marketing-conformite.test.js` | 29 | 29 |
| `marketing-tests-ab-web.test.js` | 10 | 10 |
| `marketing-r4-campagnes-web.test.js` | 38 | 38 |
| `cms-abtest.test.js` | 31 | 31 |
| `cms-contacts-web.test.js` | 21 | 21 |
| `marketing-r3-segments-web.test.js` | 30 | 30 |
| `marketing-r2-contacts-web.test.js` | 41 | 41 |
| **Total (46 fichiers)** | **1024** | **1023** |

Seul échec : `marketing-templates-blocks.test.js` « 5 000 rendus d'un modèle compilé : rapide » (assertion de durée < 3 s ; 4,7 s en parallèle, 5,8 s en exécution isolée sur cette machine). Les 37 autres tests du fichier passent. Les tests Playwright (`*-navigateur.test.js`) n'ont pas été lancés. Non rejoués dans cet audit : `marketing-actions-*`, `marketing-popups-*`, `marketing-sms*`, `marketing-file-evenements`, `cms-pages`, `cms-revisions`.
