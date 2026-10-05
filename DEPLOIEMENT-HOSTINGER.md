# Mettre KOLAKISA en ligne sur Hostinger

Guide pas à pas, pensé pour quelqu'un qui n'a jamais hébergé un site. Comptez 1 à 2 heures la première fois.

> ## À lire avant tout : le paiement passe par Stripe
> En ligne, **sans clé Stripe, toute commande payante est refusée** (plus aucun paiement fictif). Pour vendre, ajoutez dans les variables d'environnement
> `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET`, et déclarez dans Stripe le webhook `https://VOTRE-SITE/stripe/webhook` (détails dans le README, section « Paiement »).
> **Essayez d'abord avec les clés de test** (`sk_test_…`, carte `4242 4242 4242 4242`) avant de passer aux clés réelles.

---

## Ce qui est déjà prêt dans le code

Vous n'avez rien à faire pour ces points, mais il est utile de savoir qu'ils existent :

- **Vidéos et fichiers protégés** : seuls le formateur, les étudiants ayant acheté la formation, et les « aperçus gratuits » y accèdent. Avant, n'importe qui possédant le lien pouvait les regarder.
- **Sessions conservées** : les connexions et paniers survivent à un redémarrage du site.
- **Anti-piratage de compte** : après 10 mauvais mots de passe, la connexion est bloquée 15 minutes.
- **Formulaires protégés** contre les envois venant d'un autre site.
- **Le site refuse de démarrer en ligne avec un mot de passe de session faible.**
- **Compte formateur créé sans effacer les données** (le script `seed` de démonstration efface tout : ne le lancez **jamais** en ligne).
- **Dossiers de données configurables** (`DATA_DIR`, `UPLOADS_DIR`) et **script de sauvegarde** (`npm run sauvegarde`).
- **Page de contrôle** : `https://votre-site/sante` répond `{"statut":"ok",...}` quand tout fonctionne.
- **Formations vendues protégées** : une formation déjà achetée ne peut plus être supprimée (cela effaçait l'accès des étudiants et l'historique des ventes). Il faut la dépublier.
- **Commande tout-ou-rien** : une panne pendant un achat n'enregistre rien et ne fait plus tomber le site.
- **Brouillons invisibles** : les leçons d'aperçu d'une formation non publiée ne sont plus accessibles.
- **Pages plus rapides** : compression, mise en cache et index de base de données.
- **Tests automatiques** : `npm test` vérifie plus de 880 comportements (accès, achat, sécurité, accessibilité, contenus, référencement, blog, module marketing). À lancer avant chaque mise en ligne.

---

## Étape 0 : choisir la bonne offre Hostinger

KOLAKISA est une application **Node.js**. Sur Hostinger, l'hébergement d'applications Node.js est proposé avec les offres d'hébergement web **Business** et **Cloud** (pas avec les offres d'entrée de gamme), ou sur un **VPS**. Vérifiez sur le site de Hostinger que votre offre indique bien « Node.js » avant de payer.

Le site a besoin de **Node.js 22.12 ou plus** (il utilise le module SQLite intégré). Hostinger propose les versions 18, 20, 22 et 24. **Choisissez la 24.**

---

## Étape 1 : mettre le code sur GitHub

GitHub est un coffre-fort en ligne pour votre code. Hostinger ira y chercher le site, et le mettra à jour automatiquement à chaque modification.

1. Créez un compte sur [github.com](https://github.com) si ce n'est pas fait.
2. Créez un **nouveau dépôt** (« New repository »), nommé `KOLAKISA`, en **Private** (privé). Ne cochez aucune case « Add a README ».
3. Dans le terminal, depuis le dossier du site :

```
cd ~/ClaudeProjects/KOLAKISA
git init
git add .
git status
```

4. **Regardez la liste affichée par `git status`.** Elle ne doit contenir **ni `.env`, ni `data/`, ni `node_modules`**. (Le fichier `.gitignore` est fait pour les exclure ; si l'un d'eux apparaît, arrêtez-vous et demandez de l'aide.)
5. Puis :

```
git commit -m "KOLAKISA : première version"
git branch -M main
git remote add origin https://github.com/VOTRE-NOM/KOLAKISA.git
git push -u origin main
```

> Ce que vous mettez sur GitHub : le code. **Pas** votre base de données ni vos vidéos actuelles. Le site en ligne démarre donc **vide**, et vous recréerez vos formations depuis « Mon espace ».

---

## Étape 2 : créer l'application sur Hostinger

1. Connectez-vous à **hPanel** (le tableau de bord Hostinger).
2. **Sites web** → **Ajouter un site web** → **Déployer une application web** → **Importer un dépôt Git**.
3. Autorisez GitHub, puis choisissez le dépôt `KOLAKISA`.
4. Réglages de build :
   - **Framework** : Express.js (ou « Autre » s'il n'est pas détecté)
   - **Fichier d'entrée** : `server.js`
   - **Gestionnaire de paquets** : npm (détecté tout seul)
   - **Version de Node.js** : **24**
   - **Commande de build** : laissez vide (il n'y en a pas)
5. **Ne cliquez pas encore sur Déployer** : passez d'abord à l'étape 3.

---

## Étape 3 : les variables d'environnement

Ce sont les réglages secrets du site, saisis dans hPanel (jamais dans le code). Ajoutez ceux-ci :

| Variable | Valeur | Pourquoi |
|---|---|---|
| `NODE_ENV` | `production` | Active les protections « en ligne » |
| `SESSION_SECRET` | une longue suite aléatoire (voir ci-dessous) | Signe les connexions. **Secret absolu.** |
| `SITE_URL` | `https://votre-domaine.com` | Adresse publique du site (avec `https://`, sans `/` final). Indispensable aussi au référencement : adresses canoniques, `sitemap.xml`, images de partage |
| `FORMATEUR_EMAIL` | votre email | Crée votre compte au 1er démarrage |
| `FORMATEUR_USERNAME` | votre pseudo affiché | idem |
| `CONTACT_EMAIL` | l'adresse qui doit recevoir les messages du formulaire de contact | Facultatif. Nécessite aussi la configuration SMTP ; sans elle, les messages sont seulement lisibles dans Mon espace → Messages |
| `FORMATEUR_PASSWORD` | un mot de passe solide (**10 caractères minimum**) | idem. **À supprimer juste après.** |
| `ANTHROPIC_API_KEY` | votre clé Anthropic (`sk-ant-…`) | Facultatif. Active l'**Assistant IA** de l'éditeur d'articles (titre, réécriture, correction, résumé, FAQ, méta description, mots-clés, liens internes). Lue seulement par le serveur. Sans elle, l'assistant affiche « Non activé » |

**Générer le `SESSION_SECRET`** : dans le terminal de votre Mac, tapez

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

et copiez la longue suite de lettres et chiffres obtenue.

**À propos du port** : le site écoute sur le port donné par la variable `PORT` (3002 sinon). La documentation de Hostinger ne précise pas comment ce port est attribué. Après le déploiement, ouvrez les **logs** de l'application : vous devez y voir `KOLAKISA disponible sur http://localhost:XXXX`. Si le site ne s'ouvre pas, c'est le premier endroit où regarder.

Cliquez ensuite sur **Déployer**.

---

### Activer l'Assistant IA (facultatif)

1. Sur [console.anthropic.com](https://console.anthropic.com) : **Settings → API Keys → Create Key**, copiez la clé (elle commence par `sk-ant-`). Prévoyez un peu de crédit (Settings → Billing) : chaque demande coûte quelques centimes.
2. Dans hPanel : **Sites web → votre site → Node.js → Variables d'environnement → Ajouter** : nom `ANTHROPIC_API_KEY`, valeur = la clé. **Enregistrer**, puis **redémarrer** l'application (ou relancer un déploiement).
3. Vérification : Mon espace → Blog → ouvrez un article → rail de gauche **IA** : le message « Non activé » a disparu. Cliquez « Résumer » : une proposition s'affiche, l'article n'est modifié que si vous cliquez « Utiliser comme extrait ».
4. Ne collez jamais la clé dans un article, un e-mail, une capture d'écran ou un fichier du projet. Si elle a fuité : supprimez-la dans la console Anthropic et créez-en une nouvelle.

## Étape 4 : vérifier que ça marche

1. Ouvrez `https://votre-domaine.com/sante` : vous devez voir `{"statut":"ok","formations":0}`.
2. Ouvrez la page d'accueil : le site doit s'afficher, en bleu ciel, avec « KOLAKISA ».
3. Connectez-vous avec l'email et le mot de passe saisis dans `FORMATEUR_*`. Vous devez avoir accès à « Mon espace ».
4. **Retournez dans hPanel et SUPPRIMEZ la variable `FORMATEUR_PASSWORD`.** (Enregistrer un changement de variable relance le site, c'est normal.) Votre compte existe désormais en base : le mot de passe n'a plus à traîner dans la configuration.

---

## Étape 5 : LE test à ne pas sauter — vos données survivent-elles ?

C'est le point le plus important, et **Hostinger ne le documente pas clairement** : on ne sait pas si la base de données et les fichiers envoyés (miniatures, vidéos) sont conservés quand le site est redéployé. Le dossier du site est géré par le système de déploiement, et certains fichiers peuvent être écrasés à chaque mise à jour.

**Faites ce test avant de créer votre vrai contenu :**

1. Dans « Mon espace », créez une formation de test avec une miniature (une image quelconque).
2. Provoquez un redéploiement : modifiez une variable sans importance (par exemple ajoutez `TEST=1`) et enregistrez.
3. Une fois le site relancé, vérifiez que **la formation de test et sa miniature sont toujours là**, et que vous êtes toujours capable de vous connecter.

**Si tout est conservé :** parfait, continuez.

**Si la formation ou la miniature a disparu :** n'y mettez pas votre vrai contenu. Deux solutions :

- Demandez au support de Hostinger (chat en direct) : *« Pour une application Node.js déployée depuis GitHub, quel dossier n'est pas effacé lors d'un redéploiement ? J'ai besoin d'y stocker une base SQLite et des fichiers envoyés par les utilisateurs. »* Avec leur réponse, renseignez les variables `DATA_DIR` (pour la base) et `UPLOADS_DIR` (pour les vidéos et images) avec ce chemin, redéployez, puis refaites le test.
- Ou passez sur un **VPS** Hostinger, où vous maîtrisez les dossiers (plus technique).

---

## Sauvegardes

Vous êtes seul responsable de vos données : faites des sauvegardes **avant chaque mise à jour importante** et régulièrement.

- **La base** (comptes, formations, achats, avis) : `npm run sauvegarde` crée une copie datée dans `data/backups/` (14 conservées). Cela suppose un accès terminal (SSH) à l'hébergement. Sans terminal, téléchargez le fichier `data/KOYEKOLA.db` avec le **Gestionnaire de fichiers** de hPanel.
- **Les vidéos et images** (dossier `uploads/`) ne sont **pas** incluses dans `npm run sauvegarde` : téléchargez-les aussi via le Gestionnaire de fichiers.
- Gardez toujours vos vidéos originales sur votre ordinateur.

---

## Vidéos : attention à la taille

Le site accepte des vidéos jusqu'à 300 Mo, mais **rien ne garantit que l'hébergement accepte d'aussi gros envois** (le serveur intermédiaire de Hostinger peut avoir sa propre limite, non documentée). Servir beaucoup de vidéos depuis un hébergement web est aussi lent et coûteux en espace.

Bonne pratique : pour les longues vidéos, utilisez un service de vidéo et collez son lien dans le champ « lien vidéo » d'un sous-chapitre. Le site intègre automatiquement un lecteur pour les liens **YouTube** et **Vimeo** (vérifié par des tests automatiques), et lit directement un lien vers un fichier `.mp4` ou `.webm`. Un lien vers une autre page web s'affiche comme un simple lien « Ouvrir la vidéo ».

> **Correction** : une version antérieure de ce guide annonçait déjà ce fonctionnement, mais il était faux : les liens YouTube ne s'affichaient pas. C'est corrigé depuis l'Étape 0.

Contrepartie : avec YouTube « non répertoriée » ou Vimeo, quelqu'un qui obtient le lien peut regarder la vidéo sans payer. La protection de KOLAKISA ne s'applique qu'aux fichiers hébergés sur le site. Un service vidéo protégé (liens signés) est prévu dans la suite du plan.

---

## Vidéos protégées avec Bunny Stream

Bunny Stream est le service vidéo choisi pour vos formations payantes. Le principe : vous envoyez vos vidéos chez Bunny, vous collez leur **identifiant** dans KOLAKISA, et le site fabrique pour chaque élève autorisé un **lien de lecture temporaire** (6 heures par défaut). Une personne qui n'a pas acheté ne reçoit jamais de lien ; un lien copié cesse de fonctionner après expiration.

**Mise en place** (les intitulés exacts du tableau de bord Bunny peuvent différer de ceux-ci : je n'ai pas pu les vérifier) :
1. Créez un compte sur bunny.net, puis une **bibliothèque vidéo** (Stream). Notez son **numéro**.
2. Dans les réglages de sécurité de cette bibliothèque, activez la protection par jeton des lecteurs intégrés (« Embed View Token Authentication ») et copiez la **clé**.
3. Envoyez une vidéo, puis copiez son **identifiant** (une suite du type `32d140e2-e4f4-4eec-9d53-20371e9be607`).
4. Dans hPanel, ajoutez les variables `BUNNY_LIBRARY_ID` (le numéro) et `BUNNY_TOKEN_KEY` (la clé). Redéployez.
5. Dans « Mon espace », ouvrez un sous-chapitre et collez l'identifiant dans le champ « lien vidéo ». Cela fonctionne aussi pour la vidéo de présentation d'une formation.

**Tester avec une vraie vidéo (à faire une fois)** : le code suit la formule de signature indiquée par la documentation de Bunny (SHA-256 de « clé + identifiant + expiration »), mais **je n'ai pas pu la valider auprès de Bunny lui-même** (pas de compte). Vérifiez donc :
- connecté avec un compte qui a acheté la formation, la vidéo se lit ;
- en navigation privée (sans connexion), la leçon payante est refusée ;
- si la vidéo reste noire ou affiche une erreur d'autorisation, vérifiez la clé et le numéro de bibliothèque avant tout autre réglage, puis dites-le moi : c'est le seul endroit du code non vérifié en conditions réelles.

Sans ces variables, une vidéo Bunny affiche « Bunny Stream n'est pas configuré » au lieu de planter.

---

## Les emails (facultatif)

Après un achat, le site peut envoyer un email de bienvenue. Sans configuration, il ne l'envoie pas (le texte apparaît seulement dans les logs). Pour l'activer, ajoutez les variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` et `SMTP_FROM` (voir `.env.example`), avec par exemple un compte gratuit Brevo.

---

## L'éditeur de texte riche (formulaire de formation)

Les cinq textes d'une formation (description, ce que vous apprendrez, prérequis, public visé, compétences) s'écrivent dans un éditeur de texte riche, sans Markdown. Ce qu'il faut savoir pour la mise en ligne :

- **Le fichier `public/js/course-editor.js` est livré déjà construit** : Hostinger n'a rien à compiler et n'a pas besoin des outils de développement. Il fait environ 400 Ko (127 Ko compressé) et n'est chargé que sur la page de création/modification d'une formation.
- **Si vous modifiez un jour l'éditeur** (fichier `src/editor/course-editor.js`), reconstruisez-le sur votre ordinateur avec `npm run build:editor`, puis envoyez le fichier construit avec le reste (`git add .`).
- **Node.js 22.12 minimum** (la bibliothèque d'assainissement du texte l'exige). Choisissez Node 24 comme indiqué plus haut.
- Le texte saisi est **assaini** à l'enregistrement puis de nouveau à l'affichage : aucun script ni HTML dangereux ne peut passer, même en cas de manipulation de la base.
- **Les anciennes formations** (texte en Markdown) continuent de s'afficher comme avant. Elles s'ouvrent dans l'éditeur après conversion automatique, et ne passent au nouveau format que lorsque vous cliquez sur « Enregistrer ».

---

## La page d'une formation : ce que vous gérez depuis Mon espace

Tout ce qui s'affiche sur la page publique d'une formation vient de vos données et se modifie depuis « Mon espace » :

- **Modifier la formation** : titre, sous-titre (la « promesse » du résumé), description, objectifs, prérequis, public visé, compétences, miniature, niveau, prix et **langue**.
- **Chapitres** : chapitres, sous-chapitres, durées, vidéos et quiz. Le type de chaque sous-chapitre (vidéo, texte ou quiz) est déduit automatiquement.
- **Mon profil** (nouveau) : votre **photo** et votre **biographie**, affichées dans la section « Votre formateur » de chacune de vos formations. Le nombre de formations, d'étudiants et votre note moyenne sont calculés automatiquement.
- **Public visé** (« À qui s'adresse cette formation ? ») : un profil par ligne. **Écrivez le titre en gras, puis sa description** (ex. **Les créateurs de contenu** qui veulent apprendre à réaliser leurs vidéos). Chaque profil s'affiche dans sa propre carte, avec une icône choisie selon son sens. Un texte collé en Markdown (« * **Titre** … ») est lui aussi compris : les astérisques ne s'affichent jamais.
- **Formations similaires** : choisies automatiquement (même catégorie d'abord, puis les plus suivies). Rien à configurer.

Ce qui n'existe pas encore : les **prix promotionnels** (ils seront ajoutés avec le paiement réel, Étape 4) et les formations **à plusieurs formateurs**.

---

## Les photos du diaporama de l'accueil

Le bandeau de la page d'accueil affiche un diaporama de photos de personnes qui étudient (fondu toutes les 6 secondes, avec un bouton pause). Les photos sont dans le dossier `public/img/accueil/` et viennent d'Unsplash (licence libre : usage commercial autorisé, sans obligation de crédit).

- **Pour changer les photos**, remplacez les fichiers de ce dossier ou ajoutez-en, sans toucher au code. Chaque photo existe en deux tailles : `nom-1600.jpg` (ordinateur) et `nom-800.jpg` (téléphone, plus léger). Le nom doit se terminer par `-1600.jpg` ; la version `-800` est facultative.
- **Format conseillé** : JPEG, 1600 px de large, moins de 350 Ko (la version 800 px : moins de 130 Ko). Le texte du bandeau doit rester lisible : un voile bleu nuit est posé sur les photos.
- Sans aucune photo dans le dossier, le bandeau s'affiche simplement en bleu nuit.
- Mettez à jour le site (`git add .` puis `git push`) pour envoyer les nouvelles photos.

---

## Mettre à jour le site plus tard

1. Modifiez le code sur votre ordinateur, testez avec `npm run dev`.
2. `git add .` puis `git commit -m "description"` puis `git push`.
3. Hostinger redéploie automatiquement à chaque `push`. Faites une sauvegarde avant.

---

## En cas de problème

| Symptôme | Cause probable et solution |
|---|---|
| Le site ne s'ouvre pas | Consultez les **logs** de l'application dans hPanel. |
| Log : `SESSION_SECRET est absente ou trop faible` | Ajoutez `SESSION_SECRET` (16 caractères minimum) dans les variables. |
| Log : `No such built-in module: node:sqlite` | La version de Node est trop ancienne. Choisissez **Node 24**. |
| Message « Requête refusée (origine inconnue) » à chaque formulaire | Vérifiez que `SITE_URL` est exactement l'adresse du site, avec `https://`. |
| Je ne peux plus me connecter après « 10 mauvais mots de passe » | Attendez 15 minutes. |
| J'ai perdu le mot de passe formateur | Au terminal : `npm run creer-formateur -- votre@email VotrePseudo NouveauMotDePasse` |
| Les données ont disparu après une mise à jour | Voir **Étape 5** : votre hébergement n'a pas de dossier persistant par défaut. |
| Un fichier « est introuvable » alors qu'il existe | Le serveur Hostinger (Linux) **distingue majuscules et minuscules**, contrairement à votre Mac : `KOYEKOLA.db` et `koyekola.db` sont deux fichiers différents. Le nom de la base est `KOYEKOLA.db` ; dans `DATA_DIR` et `UPLOADS_DIR`, recopiez les chemins **exactement** comme ils sont écrits. |

> **Note sur le nom** : le site s'appelle KOLAKISA (en majuscules) partout, sauf dans `package.json` où le champ `name` reste en minuscules (`koyekola`) : npm n'accepte pas de majuscules dans un nom de paquet.

---

## Avant d'ouvrir au public

- [ ] **Paiement réel** (Stripe) : sinon, ne rien vendre.
- [ ] **Mentions légales, conditions générales de vente, politique de confidentialité** (obligatoires pour vendre en ligne en France ; le pied de page dit encore « projet pédagogique, aucun paiement réel »).
- [ ] Statut pour facturer (auto-entrepreneur ou autre).
- [ ] Test de persistance de l'étape 5 réussi, et une première sauvegarde faite.
- [ ] `FORMATEUR_PASSWORD` supprimée de la configuration.
