# Palier 19 — Orchestration Tunnel ↔ Contact Core ↔ Automation ↔ Email

Principe : **le tunnel produit des événements ; le Contact Core les conserve ; l'Automation Engine décide ; l'Email Engine exécute.** Rien n'est appelé en direct, tout passe par le bus d'événements existant (`mk_events`, file `mk_jobs`).

## Audit (ce qui existait)
Bus d'événements + journal immuable, Contact Core, scénarios (déclencheurs, conditions, attentes, versions, simulation), Email Engine (consentement, désinscription, suivi), suivi des visiteurs avec consentement (`kw_consent`), tunnels (étapes, pages, réglages). **Manquait** : événements « abandon » et « achat », continuité anonyme → connu datée du vrai moment, provenance du parcours, objectif d'un scénario, contexte tunnel dans les e-mails, diagnostic d'un événement.

## Catalogue d'événements (tous réellement mesurables)
| Événement | Quand | Idempotence |
|---|---|---|
| `funnel.entered` | première étape atteinte | contact + tunnel |
| `funnel.step_reached` | étape vue | contact + étape + visite |
| `funnel.step.completed` | étape suivante atteinte, ou formulaire envoyé | contact + étape |
| `funnel.completed` | dernière étape atteinte | contact + tunnel |
| `funnel.cta.clicked` | bouton cliqué (contact connu et consenti) | fenêtre de 10 s par bouton |
| `funnel.abandoned` | aucune activité depuis N h (24 h par défaut) | contact + tunnel |
| `checkout.abandoned` | commande ouverte sans achat depuis N h (1 h) | par ouverture |
| `purchase.completed` | commande LMS réelle (source de vérité) | commande |

Structure : contact, `funnelId`, `stepId`, objet (`funnel` / `funnel_step` / `order`), site, source, métadonnées filtrées (jamais de secret, de carte ou de mot de passe).

## Décisions
- **Pas d'upsell, downsell, paiement dans le tunnel** : ces étapes n'existent pas ; aucun événement fictif n'est proposé.
- **Abandon** : dérivé d'événements réels + délai réglable (Paramètres → Tunnels), jamais immédiat. Détection toutes les 5 min via la tâche `bridge.sync` existante, ou à la demande (Événements → « Détecter les abandons maintenant »).
- **Continuité anonyme → connu** : à l'identification, les passages passés (≤ 30 jours, visiteur ayant accepté la mesure) sont rejoués avec leur date d'origine ; mêmes clés d'idempotence que le direct → aucun doublon. Aucun second système d'identité.
- **Provenance** : première visite connue (UTM/référent déjà enregistrés), classée paid / email / social / campaign / organic / referral / direct. Achat rattaché au dernier tunnel touché (30 j) — attribution indicative.
- **Consentement** : inchangé et jamais contourné ; un e-mail marketing sans accord prouvé ou à un désinscrit ne part pas.
- **Objectif d'un scénario** : événement (ex. `purchase.completed`) qui termine les passages en cours du contact ; journalisé (« objectif atteint »). Migration `065` (`goal_event`).
- **E-mails** : variables `{{event.funnel_name}}`, `{{event.funnel_step}}` ; les événements `email.opened/clicked…` d'un e-mail de scénario portent `automationId`, `funnelId`, `funnelStepId`.
- **Multi-site** : un scénario d'un site n'entre que pour les contacts de ce site ; le diagnostic et le panneau contact respectent la portée de site.

## Interface
Page du scénario (source du déclencheur, objectif) · page tunnel (scénarios liés et moment) · fiche contact (panneau Tunnels) · Événements (diagnostic `/marketing/evenements/:id`, détection des abandons) · Paramètres → Tunnels.

## Limites connues
Pas d'événements checkout/upsell dans le tunnel lui-même ; attribution « dernier contact » seulement ; l'abandon dépend du délai choisi et de la fréquence de la tâche (5 min) ; un visiteur n'ayant pas accepté la mesure n'est pas rattaché à son parcours passé.
