# Palier 21 — Analytics central

## Principe
Une **couche de lecture unique**. Elle ne possède aucune donnée métier et **ne stocke aucun événement** : elle lit ce que les moteurs existants enregistrent déjà, avec leurs règles d'idempotence, de consentement et de site.

| Mesure | Source de vérité lue |
|---|---|
| Trafic (visiteurs, sessions, pages vues, événements, sources, appareils) | `mk_web_events` / `mk_web_visitors` (visiteurs ayant **accepté** la mesure) |
| Parcours, formulaires, tunnels, abandons, contacts | journal `mk_events` (immuable, idempotent) |
| Revenu, commandes, remboursements, produits | `orders`, `order_items`, `order_refunds` (la boutique reste propriétaire) |
| E-mails | `mk_message_events` (Email Engine) |
| Scénarios | `mk_automation_runs` (agrégés, pas dupliqués) |
| Contacts | `mk_contacts` (le Contact Core reste propriétaire de l'identité) |

Code : `src/marketing/analytics/` (`engine.js` requêtes et tableau de bord, `period.js` périodes/fuseau/variations, `attribution.js`), route `/marketing/analytics/global`, vue `views/marketing/analytics-global.ejs`.

## A. Audit (avant code)
- **Existait** : suivi des visiteurs consenti (`visitor.js` sur toutes les pages publiques), journal d'événements, analyse e-mail (Analytics + rapports comparatifs + revenus par e-mail), tunnels, commandes, Stripe.
- **Doublon identifié, conservé** : `mk_landing_events` (statistiques propres aux pages d'atterrissage, empreinte quotidienne) alimente l'analyse d'une page et les tests A/B ; le tableau de bord central n'y touche pas.
- **Défaut trouvé et corrigé** : la conservation « 13 mois » des visites était annoncée mais **jamais appliquée** (`visitors.purge` n'était appelée nulle part). Elle est désormais exécutée une fois par jour par la tâche récurrente du pont, durée réglable (Paramètres → Confidentialité, 395 jours par défaut).
- **Manquait** : site sur les événements de visite, déduplication des visites, périodes avec fuseau et comparaison, attribution, conversions définissables, tableau de bord unique, export.

## B. Ajouts (migration 066)
`mk_web_events.site_id` (rempli à l'enregistrement depuis la page du Site Web), index UNIQUE de déduplication (les doublons existants sont fusionnés), `mk_conversions` (conversions personnalisées). Aucune table d'agrégation : le tableau de bord se calcule en ~1 s sur 100 000 visites + 20 000 événements (mesuré, test de volume) — aucune optimisation prématurée.

## C. Taxonomie d'événements (noms réels, aucun inventé)
- Contenu : `page_view`, `session_start` (visites) — articles = pages `/blog/…`.
- Engagement : `button_click`, `form_view`, `form_submit`, `download`… (visites) ; `form.submitted` (journal).
- Tunnel : `funnel.entered`, `funnel.step_reached`, `funnel.step.completed`, `funnel.completed`, `funnel.abandoned`, `funnel.cta.clicked`.
- Boutique : `lms.cart_added`, `lms.checkout_started`, `cart.abandoned`, `checkout.abandoned`, `purchase.completed`, `payment.failed`, `refund.completed`, `order.refunded`, `order.partially_refunded`.
- E-mail : `sent`, `delivered`, `opened`, `clicked`, `bounced`, `complained`, `unsubscribed`.
- Scénarios : passages démarrés / terminés / sortis / en erreur.
- Contact : `contact.created`, `contact.lifecycle_changed`, `contact.subscribed`.
Non fournis (l'objet n'existe pas) : upsell, downsell, étapes de paiement dans le tunnel, abonnements, temps d'engagement.

## D. Définitions des indicateurs
- **Visiteur** = navigateur ayant accepté la mesure ; **session** = une visite ; **page vue** = `page_view` ; **événement** = toute ligne de visite. Ce sont quatre compteurs distincts.
- **Revenu brut** = somme des commandes dont le paiement est confirmé (une commande n'existe qu'après paiement). **Remboursements** = montants annoncés par Stripe, comptés à la **date du remboursement**. **Revenu net** = brut − remboursements. **Remises** = remises accordées. **Panier moyen** = brut / commandes payantes. Taxes et livraison : non gérées par la boutique → non affichées.
- **Nouveau client** = première commande dans la période ; **récurrent** = avait déjà commandé.
- **Taux de conversion d'un tunnel** = terminés / entrées (contacts connus et suivis). **Taux d'étape** = contacts de l'étape / entrées (et / étape précédente).
- **Conversions** : un compteur par type (formulaire, inscription, abonnement, tunnel terminé, achat) + conversions personnalisées ; jamais additionnées.
- **E-mails** : taux sur les envoyés ; ouvertures **indicatives** (Apple Mail), robots exclus.
- **Variation** : relative (%) pour les nombres et montants ; en **points** pour les taux ; précédente à zéro → « nouveau » ; pas de donnée → rien d'affiché.

## E. Attribution
Deux modèles : **dernier contact** (par défaut) et **premier contact**, sur les visites suivies et reliées au contact dans les 30 jours avant l'achat. Provenance = classification existante (`funnels/events.js#classify`). Achat sans visite connue = « Non attribué ». Linéaire / position / décroissance : non implémentés (pas justifiables avec ces données).

## F. Confidentialité, permissions, sites
- Aucune mesure sans accord (inchangé) ; aucune IP, aucun texte saisi ; identifiant technique non identifiant. Mesure limitée aux visiteurs consentants : les chiffres de trafic sont un minimum.
- Droit `analytics.read` (existant). Conversions personnalisées : droit `automations.write` (mêmes événements que les déclencheurs).
- Portée de site imposée par le serveur (`siteScope`) ; les commandes (sans site) ne sont jamais montrées à une portée de site. Le niveau « plateforme » n'existe pas dans cette installation (une organisation) : « Tous les sites » est la vue la plus large.
- Export : CSV (`/marketing/analytics/global/export`), mêmes droits, mêmes filtres, formules neutralisées. Le module Outils exporte des contenus, pas des rapports : aucun second système d'export.

## G. Limites
Pas de temps réel (calcul à l'ouverture, délai du pont ~30 s) ; pas de géographie ni de navigateur/OS (non collectés, volontairement) ; pas de temps passé ; commandes sans site ; visiteurs sans accord non comptés ; attribution simple.
