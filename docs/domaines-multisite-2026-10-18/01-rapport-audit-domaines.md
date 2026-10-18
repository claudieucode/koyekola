# Domaines indépendants et publication multisite — rapport d'audit ciblé (2026-10-18)

Périmètre : routage public par domaine, association domaine ↔ site, publication. Aucun code applicatif modifié, aucune migration lancée, aucun push, `.env` et base de production intacts.
Preuves : `tests/domaines-sites-independants.test.js` (11 tests) + 114 tests existants relus (domaines-inconnus, cms-urls, contenus-par-site-b2, isolation-des-sites-caches, seo-par-site-*, commerce-par-site) : **125/125 passent**.

## 1. Ce qui existe déjà (ne pas refaire)

| Fonction | Où | Preuve |
|---|---|---|
| Un site a un domaine : `mk_sites.settings.seo.publicUrl` (https obligatoire) | `pages/siteSettings.js:143`, `services/urls.js:69-92` | tests |
| Résolution hôte → site (`req.kwSite`), cache 5 s, invalidé à l'enregistrement | `middlewares/siteHost.js` (`attachSite`), `urls.siteForHost` | domaines-inconnus |
| Hôte inconnu → **421** (ni principal, ni site), consigné dans le journal | `siteHost.js` `siteIsolation` | domaines-inconnus ; ici : `inconnu.test`, `www.a.test`, `a.test.evil.test` |
| Hôte principal = `SITE_URL` (+ `www.` redirigé, + `HOTES_AUTORISES`, hôtes locaux) | `hostPolicy` | domaines-inconnus |
| Accueil du site (`home_page_id`) servi à `/`, pages à `/<adresse>` ; une page d'un autre site ou du principal → 404 ; brouillons privés | `siteRouting`, `urls.resolve` | ici : tests 1-2 |
| Blog/catalogue/panier du principal absents du domaine d'un site ; blog propre au site si articles rattachés | `MAIN_SITE_ONLY`, `siteHasBlog` | ici + R6 |
| robots.txt, sitemap, canonical, JSON-LD, 404 suivies, redirections : propres au domaine | `req.seoBase`, `seo/*` | ici : test 4 |
| Un domaine ↔ un seul site (refus du doublon, site actif) ; domaine restauré/copié sans collision | `pages/index.js:553,638,656` | ici : test 5 |
| Changement de domaine sans déplacer de contenu ; ancien domaine libéré (→ 421) | idem | ici : test 5 |
| Site archivé/supprimé : son domaine ne sert rien et ne retombe pas sur le principal | `urls.isRetiredHost` | ici : test 6 |
| Administration séparée : `/marketing` sur un domaine de site redirige vers la connexion (cookies liés à l'hôte, aucune session partagée) | sessions par hôte | ici : test 11 |

Conclusion : le **routage** par domaine est réel et bien testé. Ce qui manque, c'est tout le **cycle de vie** du domaine (déclaration, preuve, état, HTTPS, variantes).

## 2. Ce qui est incomplet ou absent (écarts démontrés)

| # | Écart | Preuve | Gravité |
|---|---|---|---|
| E1 | **Aucune vérification de propriété ni de DNS** : toute adresse https saisie est active immédiatement ; aucun état (non configuré / en attente / vérifié / HTTPS actif / erreur). Aucune table de domaines (seule `mk_sending_domains`, pour l'e-mail). | test « ÉCART 1 » | Élevée (un administrateur de site peut « réserver » un domaine qui n'est pas à lui et en priver un autre ; aucun retour d'erreur compréhensible) |
| E2 | **Un seul domaine par site** : pas de domaine principal désigné parmi plusieurs, pas de variante `www.` (→ 421), pas de redirection variante → domaine principal, pas de sous-domaine provisoire propre au site | test « ÉCART 2 » | Moyenne |
| E3 | **Domaines réservés acceptés sans erreur** (`https://k.test`, `https://localhost` : 200). Sans effet (le principal prime) mais silencieux | test « ÉCART 3 » | Faible |
| E4 | **Formulaires non liés à l'hôte** : `/f/<formulaire du site B>` répond 200 sur le domaine du site A (idem `POST /p/<page B>/inscription` : le routage par hôte ne filtre que les lectures). Le contenu servi n'est pas une fuite de données privées mais l'inscription peut être déposée « via » un autre domaine | test « ÉCART 4 » | Moyenne |
| E5 | **HTTPS / DNS** : rien dans l'application (normal : le TLS est terminé par l'hébergeur). Aucune instruction DNS affichée, aucun contrôle, aucun message « DNS/HTTPS pas prêt » | absence de code | Élevée pour l'usage |
| E6 | **Pages de site lisibles sur l'hôte principal** par `/p/<adresse>` (comportement historique documenté, non modifié) | test 1 (NOTE) | À décider |
| E7 | **Médias** `/uploads/...` : exemptés de contrôle d'hôte (`ALWAYS_OK`) ; une URL de média est servie sur n'importe quel hôte connu. Pas de fuite de liste, mais pas d'isolation par domaine **non démontrée** (non testé ici) | lecture du code | À vérifier |
| E8 | Le TLS et l'arrivée du trafic sur l'application dépendent de l'hébergeur (Hostinger : domaine « parqué »/alias du site Node) — jamais déclenché par Kolakisa | API hébergeur : `hosting_domains_create-website-parked` | — |

## 3. Corrections proposées (par ordre de valeur)

1. **Table `mk_site_domains`** (brouillon : `02-brouillon-migration-domaines.sql`, **non appliqué**, non placé dans `src/marketing/migrations/`) : une ligne par domaine, `host` UNIQUE sur toute la plateforme, `site_id`, type `provisional|custom`, `is_primary`, `status` (`pending|verified|https_active|error|disabled`), jeton de vérification, dates et dernière erreur. Reprise des `publicUrl` existants en `https_active` marqués « hérités » (aucun site actuel ne casse). `urls.loadSites` lit la table (repli sur `publicUrl` pendant la transition).
2. **Vérification de propriété** : enregistrement TXT `_kolakisa.<domaine>` = jeton, ou CNAME/A vers la cible de la plateforme ; contrôle serveur (`dns.promises`) ; le site n'est servi sur ce domaine qu'à partir de `verified`, jamais avant. Un domaine `pending` n'est pas réservé au-delà d'un délai (libération automatique).
3. **État HTTPS** : sonde `https://<domaine>/sante` (jeton de site dans l'en-tête de réponse) → `https_active` ; messages d'erreur distincts (DNS absent, DNS vers un autre serveur, certificat non émis, site différent).
4. **Écran « Domaines » du site** (Réglages du site) : liste, domaine principal, instructions DNS adaptées (sous-domaine : CNAME ; domaine nu : A/ALIAS), bouton « Vérifier maintenant », variantes `www` ↔ principal (301).
5. **Formulaires/inscriptions** : refuser `/f/<slug>` et `POST /p/<slug>/inscription` quand le formulaire/la page n'appartient pas au site du domaine (même règle que les pages).
6. **Domaines réservés** : refuser l'hôte principal, `HOTES_AUTORISES`, hôtes locaux, IP, et le domaine de la plateforme.
7. **Sous-domaine provisoire** (`<slug>.<domaine de la plateforme>`) : exige un DNS **joker** (`*.`) chez l'hébergeur — à confirmer côté Hostinger avant tout code (l'API ne crée les sous-domaines qu'un par un).

## 4. Migrations à préparer
Une seule : table `mk_site_domains` (brouillon fourni) + reprise des domaines existants. Elle suit la procédure R8/R9 (essai sur copie de production, sauvegarde `AVANT-MIGRATION`, aucune application sans autorisation distincte).

## 5. Tests exécutés
`domaines-sites-independants` 11/11 (présents : bon site par domaine, aucune fuite A/B/principal, brouillons privés, 421, robots/sitemap, doublon refusé, changement de domaine, site archivé ; écarts E1-E4 documentés ; admin séparée). Existants : 114/114.
**Non couverts (à écrire avec le lot)** : états DNS/HTTPS (le code n'existe pas), médias par hôte (E7), POST d'inscription cross-domaine.

## 6. Pour qu'un premier site soit réellement accessible sur son domaine (avec l'existant)
1. Disposer du domaine (ex. `exemple.com`) ; choisir l'adresse (`https://exemple.com`).
2. Chez l'hébergeur (Hostinger) : ajouter le domaine comme **domaine parqué / alias** du site Node `kolakisa.com` (hPanel ou API `hosting_domains_create-website-parked`), puis pointer le DNS du domaine comme indiqué (A/CNAME) ; attendre l'émission du certificat HTTPS.
3. Dans Kolakisa : Réglages du site → Référencement → **Adresse publique** = `https://exemple.com` (le site doit être actif, avoir une page d'accueil publiée et ce domaine ne doit pas être pris).
4. Vérifier : `https://exemple.com/` affiche l'accueil du site ; `https://exemple.com/robots.txt` cite uniquement ce domaine ; un autre domaine pointant vers l'application répond 421.
Limites actuelles : aucune aide DNS dans l'application, aucun contrôle de propriété, une seule adresse par site, pas de `www`.
Hypothèse non vérifiée : que l'hébergeur transmette l'en-tête `Host` du domaine parqué à l'application (le journal 421 existant — `[KOLAKISA] Hôte refusé…` — permettra de le constater au premier essai).
