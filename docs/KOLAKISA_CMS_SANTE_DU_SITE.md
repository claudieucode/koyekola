# KOLAKISA CMS — Santé du site (mission SANTE-SITE-01)

Branche `sante-du-site-01`, issue de `origin/main`. Référence : « Santé du site » de WordPress (Outils → Santé du site, onglets **État** et **Informations**). Ce document décrit l'état **réel**.

## 1. Audit initial

| Élément | Avant la mission |
|---|---|
| Moteur de contrôles | **Existant** : `src/services/tools/health.js` (≈ 40 contrôles réels : sondes HTTP sur le serveur lui-même, base, fichiers, SEO, médias, configuration), exécuté par `runner.js`, résultats dans `cms_tool_runs` (par organisation et par site). Réutilisé, pas dupliqué. |
| Écran | `views/marketing/tools-health.ejs` : liste par catégories, sans onglets, sans « Tests passés », sans détails dépliables. |
| Informations techniques | `services/tools/system.js` (« Informations système », écran central) : relevé court, sans thèmes, extensions, médias, droits ni copie. Conservé tel quel (il reste dans l'administration centrale). |
| Thèmes par site | `services/themes.js` (`installed`, `get`, `activeKey`) — réutilisé. |
| Extensions | Les « extensions » de Kolakisa sont les **modules par site** (`src/marketing/siteModules.js`, table `mk_site_modules`). Il n'existe pas de système d'extensions tierces. |
| Médias | `marketing/media/variants.js` (sharp, essai réel `selfTest`) et `media.uploadConfig()` — réutilisés. |
| Droits | `tools.view` (voir), `tools.health` (lancer l'analyse) ; accès limité à un site = `req.mk.siteOnly`. |

## 2. Ce qui a été ajouté

- **Écran à deux onglets** (`/marketing/site-web/outils?site=<id>&onglet=etat|informations`, URL partageable, état conservé).
- **État** : indicateur global (Non analysé / Bon état / Améliorations recommandées / Problèmes critiques), compteurs (critiques, améliorations, réussis, non concluants), date de la dernière analyse, complétude (« Analyse complète : N contrôles » ou « partielle : N sur M »), sections **problèmes critiques**, **améliorations recommandées**, **non concluants**, et « **Tests passés avec succès** » repliable. Chaque résultat se déplie : gravité, catégorie, constat, conséquences, comment résoudre, date de vérification, bouton d'action **seulement** quand une vraie destination existe.
- **Moteur** (`health.js`) : délai maximal par contrôle (20 s, `HEALTH_CHECK_TIMEOUT_MS`), `runCheck` (échec, expiration ou résultat inexploitable ⇒ « non concluant », jamais « réussi »), horodatage et indicateur `measured` par résultat, **une seule analyse à la fois par site** (relancer renvoie l'analyse en cours), résumé enrichi (`improvements`, `passed`, `unverified`).
- **Nouveaux contrôles réels** : connexion à la base, migrations appliquées vs livrées, droits d'écriture des dossiers de données (lecture seule, sans modifier les droits), version de Node.js, traitement des images (essai réel WebP), thèmes installés mais inactifs (propres au site), modules activés sans effet (propres au site).
- **Informations** : `src/services/tools/siteInfo.js` — registre de sections (`register`) ; un module peut en ajouter sans toucher à l'écran ni à la copie. Sections : Kolakisa, Répertoires et tailles, Thème actif, Thèmes inactifs, Extensions actives (modules), Extensions inactives (modules), Traitement des médias, Serveur, Base de données, Constantes et configuration, Droits des fichiers système.
- **Copie** : `GET …/sante/informations.txt` (texte structuré construit depuis les **mêmes données** que l'écran et le JSON), bouton « Copier les informations du site dans le presse-papiers », confirmation, repli sélectionnable si le navigateur refuse, copie d'une valeur seule par ligne.
- Fichiers : `src/services/tools/siteInfo.js`, `src/services/tools/health.js`, `src/marketing/web/tools.js`, `views/marketing/tools-health.ejs`, `views/marketing/partials/bottom.ejs`, `public/js/cms-sante.js`, `public/css/cms.css` (`.mk-sh-*`), `tests/sante-du-site.test.js`. **Aucune migration.**

## 3. Règles de classement (explicites)

- **Critique** : un contrôle dont le constat concret établit un risque grave (base inaccessible, migrations manquantes, écriture impossible, accueil ou pages publiées inaccessibles, secrets absents, fichiers sensibles exposés, etc.).
- **Amélioration recommandée** : constat réel mais non bloquant (sauvegarde ancienne, thème inutilisé, en-têtes absents, SEO incomplet…).
- **Réussi** : vérification effectuée et conforme.
- **Non concluant** : information, configuration absente volontairement ou contrôle impossible / expiré. Il ne compte **ni** comme réussi **ni** comme problème.
- **Indicateur global** : critique s'il y a au moins un critique ; sinon « améliorations recommandées » s'il y a au moins une amélioration ; sinon « bon état ». Aucun score arbitraire.

## 4. Isolation et sécurité

- Routes protégées (`tools.view`, `tools.health`) ; anonyme ⇒ connexion ; lecteur ⇒ 403.
- Un compte limité à un site : voit **son** site seulement (le site principal, un autre site ⇒ 403/404), jamais les sections d'infrastructure centrale (Serveur, Base de données, Constantes, Droits) ni les chemins système.
- Résultats des analyses isolés par organisation et par site (`cms_tool_runs`) ; le cache des informations (15 s) est clé par organisation, site et niveau d'accès.
- Un **filtre unique** (`scrub`/`redact`) s'applique à toutes les valeurs : valeurs des variables sensibles, `sk_…`, `whsec_…`, `Bearer …`, chaînes de connexion, mots de passe, clés privées. Les variables sensibles sont indiquées « Définie (valeur jamais affichée) ». Aucune requête sortante, aucune écriture.
- Tailles de dossiers : bornées (40 000 entrées, 1,2 s) et mises en cache 10 min ; « au moins X » si la mesure est partielle ; « Non disponible » si impossible.

## 5. Limites réelles (non simulées)

- **Extensions avancées** et **extensions indispensables** (notions WordPress) : Kolakisa n'a pas ce mécanisme (pas d'extensions tierces, pas de « must-use »). Aucune fausse section n'est affichée ; le registre permettrait de les ajouter si ce mécanisme apparaît.
- Les « extensions » listées sont les modules par site. Compatibilité / mise à jour disponible : non applicable (intégrés au code).
- Thème parent : n'existe pas ; mises à jour automatiques des thèmes : n'existent pas.
- Connexions sortantes : non testées (volontairement, pour ne rien émettre depuis cet écran).
- Tâches planifiées : l'état de l'exécuteur de travaux est indiqué ; leur bon déroulement est contrôlé par « Traitement en arrière-plan ».
- Cache des pages : les pages publiques sont servies sans cache (`no-store`) ; aucun contrôle « cache absent » n'est donc émis.
- Le temps de réponse est mesuré depuis le serveur lui-même (sans réseau ni navigateur).
- L'écran « Informations système » existant reste en place (administration centrale) ; il n'a pas été supprimé.
