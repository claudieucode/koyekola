# Domaines des sites — registre, routage, vérification (TITAN XXXII)

## 1. Diagnostic (preuves)

**Le routage par domaine existait déjà** (palier 12 : `src/middlewares/siteHost.js`, `src/services/urls.js`) : l'hôte est résolu avant le contenu, un hôte inconnu reçoit 421, le domaine d'un site ne sert jamais le contenu du site principal, un site archivé ne retombe pas sur le principal. Ce n'est donc **pas** le routage qui empêchait un site d'avoir sa propre adresse. Les causes, prouvées par le code, par les tests existants (`tests/domaines-sites-independants.test.js`, écarts 1 à 4) et par le DNS de production :

| # | Cause | Preuve | Nature |
|---|---|---|---|
| 1 | **Pas de registre** : le « domaine » d'un site était une URL texte (`mk_sites.settings → seo.publicUrl`), active dès l'enregistrement | `loadSites` lisait ce JSON ; aucune table, aucune colonne | code / données |
| 2 | **Aucune vérification de propriété** : n'importe quel `https://…` servait le site | écart 1 | code |
| 3 | **Un seul domaine par site**, pas de domaine principal / secondaire, pas de `www`, pas d'adresse fournie par Kolakisa | écart 2 | code |
| 4 | L'hôte de la plateforme ou un hôte local pouvait être saisi sans erreur | écart 3 | code |
| 5 | **Formulaires** : le formulaire du site B répondait sur le domaine du site A | écart 4 | code / isolation |
| 6 | **Aucune adresse automatique possible** : `kolakisa.com` est chez Hostinger (NS `dns-parking.com`), **aucun enregistrement générique** : `zz-test-9f3k.kolakisa.com` ne se résout pas | `dig` du 2026-10-28 | **infrastructure** |
| 7 | **Un domaine personnalisé n'est servi que si l'hébergeur le connaît** : le trafic passe par le CDN Hostinger (`www.kolakisa.com.cdn.hstgr.net`), qui délivre lui-même le HTTPS ; l'application ne peut ni créer un certificat ni rattacher un domaine à l'hébergement | DNS / architecture | **infrastructure** |

Conclusion : un site pouvait déjà avoir **un** domaine, mais sans preuve de propriété, sans alias, sans adresse de repli, et rien dans l'application ne pouvait rendre un domaine réellement joignable en HTTPS. Les points 6 et 7 ne se corrigent pas dans le code (voir §6).

## 2. Modèle de données (migration 113)

Table `mk_site_domains` : `host` normalisé, `site_id`, `kind` (`platform` | `custom`), `status` (`pending` | `verified` | `disabled`), `is_canonical`, `verification_token`, `verification_method`, `dns_status`, `tls_status`, dates et dernière erreur de contrôle.

- Index unique sur `host` **où `status = 'verified'`** : un hôte vérifié n'appartient qu'à un site. Plusieurs sites peuvent réclamer le même hôte « en attente » (réclamer ne bloque personne) ; seul celui qui prouve la propriété l'obtient.
- Index unique : un seul domaine canonique vérifié par site.
- **Reprise de l'existant** (`siteDomains.backfillLegacy`, au démarrage, idempotente) : tout domaine déjà saisi devient `verified / legacy` : aucun site existant ne perd son adresse. En cas de doublon, le premier servi (comme avant) garde le domaine.
- `settings.seo.publicUrl` n'est plus une source : c'est le **miroir** du domaine canonique vérifié (les lecteurs historiques — sitemap, canonical, JSON-LD — continuent de le lire).

## 3. Fonctionnement

`Requête → normalisation de l'hôte (casse, port, point final, IDN) → registre (domaine vérifié d'un site actif) → vérification du statut → route → page du site`.

- Hôte inconnu : 421 (jamais le site principal). `/sante` répond sur tout hôte.
- Domaine d'un site archivé ou supprimé : 404 (jamais le principal).
- **Alias → principal** : un domaine secondaire vérifié (www, adresse de plateforme) redirige en 301 vers le domaine principal, chemin et requête conservés.
- Domaine personnalisé : saisie → `pending` + jeton → l'utilisateur publie `TXT _kolakisa-verify.<domaine> = <jeton>` → « Vérifier » → propriété prouvée → `verified`. Le jumeau `www.` d'un domaine déjà vérifié du même site est vérifié d'office (même zone).
- États séparés et honnêtes : **propriété** (TXT), **DNS** (le domaine pointe-t-il vers la plateforme ? adresses configurées `DOMAIN_DNS_A` / `DOMAIN_DNS_CNAME`, sinon celles mesurées de l'hôte principal), **HTTPS** (poignée de main TLS réelle). « Opérationnel » exige les trois.
- Adresse de plateforme `<nom>.<PLATFORM_DOMAIN>` : créée **seulement si `PLATFORM_DOMAIN` est configuré** ; sinon l'écran l'indique et ne l'invente pas. Libellé : site (slug) normalisé, 3–40 caractères, noms réservés évités (`www`, `admin`, `api`, `mail`…), collisions suffixées `-2`, jamais de punycode.
- Validation : IP, hôtes locaux, hôte de la plateforme, domaine de plateforme et noms invalides refusés.

## 4. Administration

Écran **Mes sites → Domaines** (`/marketing/site-web/sites/<id>/domaines`) : liste, état, DNS, HTTPS, instructions DNS avec le jeton réel, ajout, vérification, « Rendre principal », retrait, adresse de plateforme. Garde : permission `sites.domains` (administrateur) **et** appartenance du site vérifiée par le serveur (une personne limitée à un site ne gère que ce site ; le site principal n'a pas de domaine de site). L'ancien champ « Adresse publique » des réglages SEO passe par le même registre.

## 5. Sécurité et isolation

- Aucun `site_id` du navigateur ne fait foi : chaque opération recharge le domaine **pour ce site et cette organisation** (`requireOwn`).
- Sessions : cookies sans attribut `domain` (propres à chaque hôte) : un sous-domaine de plateforme ne partage pas la session du site maître.
- Formulaires et pop-ups : sur le domaine d'un site, seuls les formulaires de CE site répondent (corrige l'écart 4).
- Mode test « auto » (tests seulement) : détecté par `NODE_ENV=test` ou `NODE_TEST_CONTEXT`, jamais en production ; `KOLAKISA_DOMAIN_VERIFY=strict` force le mode production dans les tests.
- **Risque connu, non modifié** : `trust proxy = 1` (server.js) fait lire `X-Forwarded-Host` par Express, et `sameOriginOnly` (security.js) l'accepte. Si le CDN ne réécrit pas cet en-tête, un client peut choisir quel site **public** s'affiche (contenu déjà public, aucune autorisation contournée). À vérifier avec l'hébergeur avant de durcir : un changement à l'aveugle risquerait de casser les formulaires en production.

## 6. DNS et HTTPS : ce qu'il faut réellement faire (rien n'a été modifié en production)

**Aucun DNS, aucun certificat ni réglage d'hébergement n'a été modifié** : ce sont des actions externes à l'application, qui exigent les accès du compte d'hébergement et une décision.

1. **Domaines personnalisés des clients** : le client crée `TXT _kolakisa-verify.<domaine>` (jeton affiché) et fait pointer son domaine vers l'hébergement (A/CNAME affichés). Ensuite **le domaine doit être rattaché à l'hébergement chez Hostinger** (domaine parqué / alias) pour que le CDN le route et délivre son certificat. Sans cette étape, l'écran affiche « HTTPS non actif » et ne prétend jamais que le site est en ligne. *Capacité manquante : le rattachement automatique d'un domaine client à l'hébergement (API Hostinger) n'est pas branché.*
2. **Sous-domaines de plateforme** : il faut (a) un domaine dédié, (b) un enregistrement DNS générique `*.<domaine>` vers l'hébergement, (c) un certificat qui couvre `*.<domaine>` (un wildcard DNS ne suffit pas à fournir le HTTPS), (d) la variable `PLATFORM_DOMAIN=<domaine>`. Dans l'état actuel : pas de wildcard sur `kolakisa.com`, donc l'adresse automatique reste « indisponible » (le code est prêt et testé, il s'active par configuration).
3. Recommandation : domaine dédié (ex. un second domaine réservé aux sites), pas un sous-domaine de `kolakisa.com`, pour isoler cookies et réputation du site maître.

## 7. URL internes : audit

Le rendu public d'un site utilise déjà `req.seoBase` / `site.base` (canonical, Open Graph, sitemap, robots.txt, JSON-LD) : ils prennent le **domaine principal du registre**. Les ~74 usages de `SITE_URL` restants sont des liens d'**administration et d'e-mails de la plateforme** (désinscription, formulaires copiés, webhooks, réseaux sociaux, SMS) : ils visent légitimement l'application centrale et n'ont pas été remplacés. Non traité : les liens d'e-mails envoyés « au nom » d'un site pointent encore vers l'hôte principal.

## 8. Tests

`tests/domaines-registre.test.js` (scénarios A à I : service avec DNS/HTTPS injectés, puis vrai serveur en mode strict avec faux DNS par fichier `KOLAKISA_TEST_DNS_FILE`, actif en `NODE_ENV=test` seulement) ; les tests existants `domaines-*`, `isolation-*`, `cms-urls`, `cms-seo`, `seo-par-site-*`, `contenus-par-site-b2`, `permaliens`, `site-builder-vierge`, `r9-site-maitre-migration`, `formulaires-contacts-par-site`, `pages-formulaires-sms-par-site` servent de contrôle de régression (scénario J).
