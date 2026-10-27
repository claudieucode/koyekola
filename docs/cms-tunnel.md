# CMS KOLAKISA — CMS ↔ Tunnel (palier 18)

## Audit de départ
Le Tunnel Engine existait (`src/marketing/funnels/`, migration 039) et respectait déjà la règle centrale : **une étape est une référence** (`mk_funnel_steps.page_id` → `mk_landing_pages`), jamais une copie.
Existant : types d'étapes (atterrissage, capture, page du site, vente, produit, webinaire, téléchargement, remerciement, formation, personnalisée), création d'une page d'étape avec le modèle du type (nature « étape »), association d'une page existante, retrait d'une étape sans effacer la page,
étape suivante (`/etape-suivante`, et après une inscription), « une page = un seul tunnel actif », publication groupée, duplication (copies), archivage, statistiques mesurées, événements `funnel.step_reached` / `funnel.completed`,
déclencheurs d'automatisation, éditeur visuel unique (`/marketing/pages/:id/editeur`), rendu par le moteur de pages commun (`/p/<adresse>`).
**Décision : aucun second système.** Le palier 18 comble les manques réels de la connexion CMS ↔ Tunnel.

## Ce que le palier ajoute
| Manque constaté | Réponse |
|---|---|
| Tunnels sans **site** : une page d'un site pouvait servir un tunnel d'un autre | `mk_funnels.site_id` (migration 064) ; **le serveur refuse** une page d'un autre site (ajout, remplacement, `page_id` injecté) ; accès limité à un site = ses tunnels seulement (403 ailleurs) ; une page déjà liée à un autre site (anciennes données) est signalée et jamais servie |
| Pas de **remplacement / détachement** d'une page d'étape | `replaceStepPage`, `detachStepPage` (l'étape reste, la page CMS n'est jamais supprimée) |
| « Créer avec KOLAKISA CMS » seulement à l'ajout d'une étape | `createStepPage` pour une étape sans page : nouvelle page CMS (brouillon, même site), puis l'éditeur existant ; tout ou rien |
| Suppression silencieuse d'une page utilisée | Mise à la corbeille et suppression définitive **refusées** tant qu'un tunnel actif utilise la page (message listant tunnels et étapes), sauf détachement explicite ; actions groupées incluses |
| Page non identifiable comme « utilisée » | Liste des pages : « utilisée dans le tunnel … » ; fiche de page : liste des tunnels ; case « Détacher des tunnels » |
| Réglages de contexte absents | `mk_funnel_steps.settings` : **noindex** (par défaut pour remerciement et téléchargement), **pied de page masqué**, **objectif de conversion** — propres à l'étape, jamais écrits dans la page ; appliqués au rendu public, à la balise robots et au plan du site |
| Bouton vers une étape précise | `/etape/<identifiant>` : seulement une étape du **même** tunnel, atteignable ; sinon retour sur la page (jamais d'adresse inventée) ; proposé dans le sélecteur de lien de l'éditeur |
| Duplication toujours en copie | Choix : copier les pages (nouveaux brouillons) ou étapes **sans page** à associer ; la copie garde le site |
| Droits partagés avec les formulaires | `funnels.read` / `funnels.write` (migration : les rôles personnalisés gardent leurs droits) ; modifier une page reste `forms.write`, la mettre en ligne `pages.publish` : on gère un tunnel sans pouvoir éditer ses pages (bouton désactivé et expliqué) et inversement |
| Événements sans objet ni site | `funnel.step_reached` / `funnel.completed` portent l'étape ou le tunnel (objet) et le site dans le journal du Contact Core |
| Références cassées invisibles | Contrôle de Santé du site « Étapes de tunnels » (page absente, archivée, hors ligne, d'un autre site) |

## Correspondance avec la demande
| Demande | Réalité |
|---|---|
| Funnel / Step avec `page_id`, `site_id`, `settings`, position, type | `mk_funnels` (+ `site_id`), `mk_funnel_steps` (+ `settings`, `page_id`, `position`, `type`) |
| URL via le résolveur central | les pages gardent leur adresse `/p/<adresse>` servie par le moteur de pages commun ; l'étape n'a **pas** d'adresse propre (pas de « route de tunnel » distincte) |
| Canonical / noindex | noindex d'étape → balise robots + exclusion du plan du site ; la canonical reste celle de la page |
| Rendu de l'étape | le rendu CMS existant, avec les réglages de contexte de l'étape |
| Preview | aperçu de la page (bouton « Prévisualiser » de chaque étape, sans compter de visite) ; pas d'aperçu de navigation du tunnel entier |
| Page Builder | inchangé (moteur) ; seul ajout : l'étape précise dans le sélecteur de lien |
| Variables `{{funnel.*}}`, produit, prix | **non implémentées** (pas de moteur de variables de page ; aucune donnée produit inventée) |
| Checkout, upsell, downsell, paiement | **fournis (jalon paiement)** : étapes `order` / `upsell` / `downsell`, voir « Étapes de paiement » ci-dessous |
| Événements funnel.entered, step.viewed, … | existants sous les noms `funnel.step_reached` / `funnel.completed` (visiteurs identifiés ayant accepté la mesure) ; `checkout.*`, `purchase.completed` non émis par le tunnel |
| Automatisations | déclencheurs `funnel.step_reached` / `funnel.completed` (palier 17), sans changement |

## Limites réelles
- Une page ne peut appartenir qu'à **un seul tunnel actif** (règle voulue : « étape suivante » sans ambiguïté) ; elle peut figurer dans des tunnels archivés. Réutiliser les mêmes pages dans deux tunnels actifs est refusé.
- Pas de route de tunnel distincte (`/f/...`) : l'adresse publique d'une étape est celle de sa page.
- Pas d'en-tête à masquer sur ces pages (elles n'ont qu'un pied de page) ; pas de choix de modèle d'apparence par étape.
- Pas de variables de tunnel dans les pages, pas d'aperçu de navigation du tunnel complet. Les étapes de paiement existent désormais (voir ci-dessous).
- Le nom d'un tunnel reste unique par organisation.

## Étapes de paiement (bon de commande, order bump, upsell, downsell)

- Types d'étape `order`, `upsell`, `downsell` : chacun désigne **une formation publiée** (pas de page CMS ; présentez l'offre sur la page de vente qui précède). Adresse : `/tunnel/offre/<étape>` (`src/routes/tunnelOffers.js`, vue `views/tunnel-offer.ejs`).
- Paiement : Stripe Checkout existant (`services/payments.js`). Montants calculés par le serveur ; la session porte `checkout_sessions.funnel_step_id`. La commande et l'inscription ne sont créées qu'après confirmation de Stripe (webhook signé ou relecture), jamais au simple retour du navigateur. Sans `STRIPE_SECRET_KEY`, l'offre s'affiche mais ne peut pas être payée (rien n'est simulé).
- Reprise du parcours : `/commande/retour/:ref` envoie vers l'étape suivante atteignable ; une offre complémentaire **payée** saute l'offre de repli, un **refus** y mène. Étape finale absente : confirmation de commande.
- Code promo : champ facultatif sur la page d'offre, vérifié côté serveur (mêmes codes que la boutique).
- Order bump : réglage de l'étape « bon de commande » (`bumpCourseId`, `bumpLabel`), case à cocher, ajoutée au même paiement ; jamais la formation principale elle-même.
- Une étape d'un tunnel archivé, inconnue ou qui n'est pas une offre répond 404. Compte requis (redirection vers la connexion puis retour).
- Limites : pas de paiement en un clic pour l'upsell (la carte est redemandée), une seule devise (EUR), Stripe uniquement.
- Tests : `tests/tunnel-paiement.test.js` (faux Stripe local, webhooks signés).
