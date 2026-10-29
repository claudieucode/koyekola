# 12 - Redirections et moniteur 404 (Rank Math)

Date de consultation : 2026-10-29. Mentions : **[officiel]** (page Rank Math/Google), **[observation]**, **[hypothèse]**. Niveaux Gratuit/PRO indiqués seulement si la source le dit.

## 1. Module Redirections

### 1.1 Activation
Module à activer dans Rank Math SEO > Tableau de bord > Modules ; invisible tant que le **mode avancé** n'est pas activé. [officiel : kb/setting-up-redirections]
Niveau du module de base : la page « 410 en masse » ne précise pas le niveau ; les pages « setting-up-redirections » et « how-to-create-a-redirection » marquent explicitement PRO : catégories, filtre par catégorie, activation/désactivation programmées, sources avec paramètres de requête, synchronisation .htaccess, import/export CSV. Le reste est présenté sans mention de niveau (donc présumé disponible hors PRO : **hypothèse**, à confirmer sur free-vs-pro, non lue).

### 1.2 Champs d'une redirection
| Champ | Comportement [officiel] |
|---|---|
| Source(s) | URL complète ou chemin ; Rank Math retire domaine et slashs ; la **page d'accueil ne peut pas être redirigée** ; plusieurs sources vers une destination (chacune avec son type de correspondance) |
| Type de correspondance | Exact, Contains, Start With, End With, Regex |
| Ignore Case | Insensible à la casse ; à n'activer que si les variantes de casse n'ont pas de destinations différentes |
| Destination | Interne/externe, fichiers possibles (PDF...), URL complète recommandée ; absente pour 410/451 |
| Type de redirection | 301, 302, 307 |
| Code de maintenance | 410 (supprimé) ou 451 (indisponible pour raisons légales) ; exclusif du type de redirection |
| Statut | Active/inactive |
| Programmation (PRO) | Activation et désactivation à date donnée |
| Catégorie (PRO) | Classement hiérarchique, filtrage |
| Paramètres de requête (PRO) | Sources avec query string ; paramètres transmis à la destination par défaut, désactivable par filtre |

Sémantique des correspondances : Exact = URL identique ; Contains = fragment n'importe où ; Start With = début du chemin ; End With = fin ; Regex = expression régulière. [officiel : how-to-create-a-redirection]

### 1.3 Regex
- Choix « Regex » dans le type de correspondance. Quantificateurs `*`, `?`, `+` ; groupes capturants `( )` réutilisés en `$1`, `$2`... dans la destination. Cas décrits : AMP vers URL canonique, suppression de dates dans les permaliens, d'un mot ou d'un préfixe de dossier, catégorie vers étiquette, sous-répertoire vers une seule page. Avertissement : une erreur fait soit ne rien matcher, soit trop matcher ; tester avec un testeur externe (Regex101). Les ancres (`^`, `$`) ne sont pas expliquées. [officiel : kb/how-to-use-regex-redirects, solving-redirection-issues]
- Moteur de regex (PCRE ou JS) et délimiteurs : **non documentés** dans les pages lues.

### 1.4 Types, codes et conseils SEO
- Rank Math : 301 permanent, 302/307 temporaires (307 conserve la méthode HTTP), 410 supprimé définitivement (« retire de l'index »), 451 restriction légale. Il affirme qu'un 301 transfère la puissance de classement et pas un 302. [officiel : 301-vs-302-redirect, set-410-status-in-bulk]
- Google : 301/308 = signal fort de canonique ; 302/303/307 = signal faible ; 307 traité comme 302, 308 comme 301 ; jusqu'à 10 sauts suivis ; 404 et 410 traités identiquement ; méthodes serveur préférées aux meta refresh/JS. [officiel Google : 301-redirects, http-network-errors]. Écart de nuance : Google ne parle pas de « transfert de puissance » ; il parle de signal de canonique.
- 308 : non proposé par Rank Math (source : listes de types lues).

### 1.5 Priorité, ordre d'évaluation, chaînes
- **Non documentés** dans les pages lues : ordre d'évaluation entre règles qui se chevauchent, priorité entre types de correspondance, traitement des chaînes. Rank Math invite seulement à tester et à utiliser le débogueur. [officiel : lacune explicite des pages]
- Boucles : l'erreur « may cause infinite loops » apparaît quand source = destination ou cycle A>B>A, ou quand une destination est source d'une autre règle. Rank Math « détecte » à la création, sans expliquer comment ; correction = éditer la règle fautive. Une boucle peut aussi naître en changeant une URL puis en la rétablissant (auto-redirection). [officiel : fix-infinite-loop-error, solving-redirection-issues]

### 1.6 Groupes
Pas de « groupes » au sens moteur (comme certains plugins) ; l'équivalent Rank Math = **catégories** (PRO) pour organiser/filtrer, sans effet sur la priorité d'après les pages lues. [observation]

### 1.7 Réglages (Paramètres généraux > Redirections)
- **Debug Redirections** : intersticiel (~5 s) visible des seuls administrateurs, avec lien « Manage This Redirection » vers la règle responsable. À laisser désactivé hors dépannage.
- **Fallback Behaviour** : si aucune règle/cible ne correspond : 404, accueil ou URL personnalisée.
- **Redirection Type** : type par défaut des nouvelles règles.
- **Auto Post Redirect** : crée un 301 quand le slug d'un article, page, taxonomie ou type de contenu change ; **toujours 301** ; la redirection native de WordPress ne couvre que les articles. Pour un changement massif de permaliens, règles manuelles/regex. [officiel : general-settings, how-to-redirect-posts-after-changing-urls]
- Aussi : redirection des pièces jointes (vers le contenu parent) et des pièces orphelines (vers une URL). [officiel : general-settings > Links]
- Redirection par contenu : onglet Avancé > Redirect (301, 302, 307, 410, 451 + destination) ; apparaît dans le gestionnaire. [officiel : advanced-tab]

### 1.8 Statistiques et actions
Hits (bots et humains comptés), date de création, dernier accès ; actions groupées : activer, désactiver, corbeille. Recherche par terme exact uniquement. [officiel]

### 1.9 Import / export
- Export un clic au format **Apache (.htaccess) ou Nginx** (sauvegarde horodatée). [officiel, niveau non précisé]
- **Synchronisation .htaccess (PRO)** : écrit les redirections dans .htaccess pour plus de rapidité.
- **Export CSV (PRO)** (case « inclure les redirections désactivées ») ; **Import CSV (PRO)** : en-têtes en minuscules, sensibles à la casse : `id`, `source`, `matching` (exact/contains/start/end/regex), `destination`, `type` (301/302/307/410/451, défaut 301), `category`, `status` (active/inactive), `ignore` (vide ou `case`). `source` et `destination` requis pour créer ; `id` renseigné = modification ; destination `DELETE` = suppression ; plusieurs lignes de même destination fusionnées (« Merged ») ; résultats : Created/Merged/Updated/Deleted ; durée de quelques minutes selon taille ; limites de taille/lignes non documentées. [officiel : how-to-manage-redirects-via-csv]
- Import depuis Yoast mentionné (échec traité par mise à jour). [officiel : solving-redirection-issues]
- Dépannage : tables manquantes > Statut et outils > Outils de base de données > « Re-create Missing Database Tables » ; vider les caches.

## 2. Moniteur 404

- Module séparé (Paramètres généraux > 404 Monitor ; journal sous Rank Math SEO > 404 Monitor). Niveau non précisé. [officiel : kb/404-monitor, general-settings]
- **Mode** : *Simple* = URI + date d'accès + compteur de hits ; *Advanced* = en plus URL référente, user-agent (OS/navigateur/version), regroupement des hits par origine ; plus coûteux : à utiliser temporairement.
- **Log Limit** : défaut 100 lignes (limite supprimable sur gros sites). **Exclude Paths** : URL exactes, mots-clés ou RegEx, sans slash initial. **Ignore Query Parameters** : désactivé par défaut. [officiel : general-settings]
- Actions : survol > **Redirect** (visible si le module Redirections est actif ; source préremplie, correspondance Exact, 301 recommandé), **Delete**, actions groupées (Redirect de plusieurs URL vers **une seule** destination, Delete, **Clear Log** irréversible). Écran Options pour le nombre de lignes (défaut 100). [officiel : fix-404-errors]
- Rank Math logue aussi en 404 les pages servies en 410 ; une mise à jour future doit les séparer. [officiel : solving-redirection-issues]
- Suivi des 404 provenant de ChatGPT : page existe (kb/fix-404-errors-from-chatgpt), **non lue**.
- Conseils : corriger la source du lien, rediriger si une page équivalente existe, ignorer le spam ; recouper avec le rapport d'indexation de Search Console. [officiel]

## 3. Dépendance WordPress / pertinence Kolakisa
| Fonction | WP ? | Pertinence |
|---|---|---|
| Règles (exact/contains/start/end/regex, ignore case) | Non en concept | Très élevée : table `redirects` par site + middleware Express |
| 410/451 | Non | Élevée (produits/formations retirés) |
| Auto-redirection au changement de slug | Hooks WP | Très élevée : à déclencher sur renommage de slug (pages, produits, formations) |
| Journal 404 simple/avancé, exclusions, limite | Non | Très élevée, avec rotation et agrégation |
| Redirect depuis le journal, actions groupées | Non | Élevée |
| Import/export CSV, export Apache/Nginx | Non | Moyenne/élevée (CSV) ; Apache/Nginx peu utile |
| Sync .htaccess | Oui | Nulle |
| Catégories, programmation (PRO) | Non | Moyenne |
| Débogueur d'intersticiel | Non | Moyenne : préférer un en-tête de debug admin (**hypothèse**) |
Éléments à définir côté Kolakisa car non documentés par Rank Math : priorité (ex. exact avant regex, puis ordre manuel), détection de chaînes/boucles, plafond de sauts, 308, gestion multi-domaines. [hypothèse]

## Lacunes
- URL 404 : kb/301-redirections/ et kb/404-monitor/ pour détails au-delà de ce qui a été lu (la seconde existe mais est partielle).
- Non lues : kb/trace-url-redirects, kb/redirect-all-amp-pages-to-non-amp-pages, kb/fix-404-errors-from-chatgpt, kb/free-vs-pro (niveaux non confirmés), pages UTM.
- Non documentés : priorité/ordre, moteur regex, limites d'import, traitement des chaînes, 308.

## Sources (consultées le 2026-10-29)
- https://rankmath.com/kb/setting-up-redirections/ - officiel
- https://rankmath.com/kb/how-to-create-a-redirection/ - officiel
- https://rankmath.com/kb/how-to-use-regex-redirects/ - officiel
- https://rankmath.com/kb/solving-redirection-issues-using-rank-math-seo/ - officiel
- https://rankmath.com/kb/fix-infinite-loop-error/ - officiel
- https://rankmath.com/kb/how-to-manage-redirects-via-csv/ - officiel
- https://rankmath.com/kb/set-410-status-in-bulk/ - officiel
- https://rankmath.com/kb/how-to-redirect-posts-after-changing-urls/ - officiel
- https://rankmath.com/kb/301-vs-302-redirect/ - officiel
- https://rankmath.com/kb/404-monitor/ - officiel
- https://rankmath.com/kb/fix-404-errors/ - officiel
- https://rankmath.com/kb/general-settings/ - officiel (partiel)
- https://rankmath.com/kb/advanced-tab/ - officiel
- https://developers.google.com/search/docs/crawling-indexing/301-redirects - officiel Google
- https://developers.google.com/search/docs/crawling-indexing/http-network-errors - officiel Google
