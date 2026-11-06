# Extension n°5 — Phase 0 : capacités éditoriales du CMS

Date : 2026-11-05. Méthode : lecture du code (`src/`) ; « à vérifier » = présence d'un fichier sans test de comportement dans cette phase. Aucun thème ne doit simuler une capacité « absente » : il la consomme ou attend le moteur.

| Capacité | État | Preuve / remarque |
|---|---|---|
| Articles, pages | existe | `services/blog.js`, `sitePages.js` |
| Catégories, étiquettes | existe | `services/taxonomy.js` (termes par site) |
| Auteurs avec bio/avatar | existe | bloc `authorbox`, `avatars.js` |
| Éditeur : types de blocs | existe (103) | titres, texte, listes, citation, code, image, galerie, vidéo, audio, embed, tableau, accordéon, onglets, boutons, colonnes, séparateur, alerte, minuteur, carte, FAQ… (`pages/nodes.js`) |
| Image à la une, extrait | existe | `{{post.image}}`, `{{post.excerpt}}` |
| Temps de lecture | à vérifier | bloc `readingprogress` existe ; durée estimée non confirmée |
| Sommaire | existe | bloc `toc` |
| Archives catégorie / étiquette / auteur | existe | modèles Archive (100) |
| Archives par date | **absent** | aucune route (voir doc Archive) |
| Pagination | existe | boucle `numbers/prevnext/both/more/infinite` |
| Recherche interne | existe | bloc `search`, `?q=` |
| Commentaires + modération | existe | `services/comments.js`, `web/comments.js`, bloc `postcomments` |
| Newsletter / formulaires | existe | bloc `signupform`, `web/forms.js`, `campaigns.js`, `mailchimp.js` ; double validation à vérifier |
| Flux RSS | existe | `web/rss.js`, `services/rssFeeds.js` |
| Menus multiples, zones latérales | partiel | `cmsmenu`, `sidebar`, `navigation.js` ; nombre de menus à vérifier |
| Fil d'Ariane | existe | bloc `breadcrumb` + JSON-LD BreadcrumbList |
| Données structurées | **partiel (corrigé après relecture)** | `seo/schema.js` + `routes/blog.js:342` : WebSite+SearchAction, BreadcrumbList, ImageObject, Organization, BlogPosting/Article, Person, FAQPage, HowTo, Course existent pour les articles du blog. Absents : `Recipe`, `Event`, `Review` |
| Open Graph / Twitter Card | à vérifier | `utils/seo.js` |
| Multilinguisme | **absent** | aucune gestion de langues dans le contenu |
| Contenus réservés / membres | partiel | `siteUsers.js`, cours ; contenu d'article réservé non confirmé |
| Types de contenu personnalisés (annuaire, fiches, changelog, presse, avis) | **absent** | registre de types fermé |
| Notes liées / backlinks | à vérifier | `services/postNotes.js` existe, usage inconnu |
| Mode sombre | thème par thème | option de thème |
| Page « lien en bio », compte à rebours | existe | blocs `linkinbio`, `countdown` ; statistiques de clics à vérifier |
| Fiche recette (portions ajustables), calculateurs | **absent** | aucun bloc |

## Capacités manquantes qui bloquent des thèmes
- **Types de contenu personnalisés** (+ champs, filtres, carte) : thèmes 22, 24, 26, 27, 28, 29.
- **Données structurées** `Recipe` (thème 4), `Event` (22), `Review` (28) : absentes ; BlogPosting, FAQPage et Course existent.
- **Archives par date** : thèmes 1, 11 (archives par année) ; **multilingue** : filtre « multilingue ».
- **Bloc recette et calculateur** : thèmes 4 et 9.

## Architecture proposée (séparée des thèmes)
1. **Contenus typés** : table de définitions (nom, champs typés, modèles de page liste/fiche) par site + route publique `/<type>` et `/<type>/<slug>` ; boucle `source:"<type>"` et widgets dynamiques ; condition d'affichage du Theme Builder.
2. **Générateur JSON-LD** dans `seo/schema.js` : Article/BlogPosting, Person, Organization, FAQPage, Recipe, Event, Course, Review (avis réels uniquement), activés par le type de contenu.
3. **Route d'archive par date** (`/blog/2026/11`) branchée sur la condition « date » déjà prévue.
4. **Blocs** `recipe` (portions calculées côté serveur) et `calculator` (formules bornées, sans script libre).
5. Multilingue : hors périmètre de cette extension, à traiter comme un chantier du moteur.

Tant que 1–3 ne sont pas livrés, les 18 thèmes concernés restent « non terminables ».
