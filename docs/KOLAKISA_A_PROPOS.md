# Page « À propos » (`/a-propos`)

## Audit (avant la refonte)
- Route : `GET /a-propos` (`src/routes/pages.js`), vue `views/pages/about.ejs`. Contenu : **Markdown** stocké dans `site_pages` (slug `a-propos`), modifiable par le formateur via `/formateur/pages/a-propos` ; sans contenu, un texte par défaut. Un modèle de thème « Page du site » (région `static_page`) peut remplacer le texte (conservé).
- Page du **site public principal** (une seule ligne `site_pages`, pas de contenu par site du Page Builder : ces sites ont leurs propres pages).
- Défauts : texte par défaut générique (trois lignes), titre « À propos » seul, aucun rythme visuel, éditeur = un champ texte sans aide, contenu tronqué en silence à 20 000 caractères.
- SEO déjà géré par le module central (`seo/pages.js`, JSON-LD `AboutPage`, canonique, description). Conservé.
- Faits documentés dans le dépôt : formations vidéo en chapitres/sous-chapitres, quiz (seuil, tentatives), ressources à télécharger, progression enregistrée, certificat à numéro vérifiable, accès sur ordinateur/tablette/mobile. **Aucune** histoire, date, mission, vision, valeurs, chronologie, identité de fondateur, photo ni témoignage n'est documenté ; le pied de page précise « projet pédagogique, aucun paiement réel n'est traité » : le texte par défaut ne parle donc ni d'achat ni de paiement.

## Décisions
- Le contenu reste **la source unique** (Markdown, `site_pages`) : aucune table, API ni migration. `src/services/aboutPage.js` le découpe : `# Titre` → titre, premier paragraphe → introduction, `## Partie` → section.
- Mise en page : bandeau bleu nuit (tokens existants du site public) avec titre et introduction, puis sections éditoriales (titre à gauche, texte à droite ≥ 900 px ; les listes « **Titre.** texte » deviennent une grille de points), une carte du créateur **seulement si une biographie existe**, un bloc de contact final. Un seul lien de catalogue (chiffre réel, calculé en base) dans l'ouverture, contact/FAQ en fin : pas d'appels à l'action concurrents. Aucune image : le dépôt ne contient aucun visuel d'équipe ou de produit autorisé pour cette page, et rien n'est simulé.
- Mouvement : une seule montée douce du bandeau, supprimée si l'utilisateur demande moins de mouvement (`prefers-reduced-motion`, `data-kb-motion` off/lite).
- Éditeur : boutons d'ajout de titres (histoire, mission, valeurs : **titre seulement**, le texte reste à écrire), compteurs, retour au texte par défaut, avertissement avant de quitter avec des modifications non enregistrées, erreur explicite si le texte dépasse 20 000 caractères (rien n'est tronqué ni enregistré).
- Sécurité : rendu Markdown sûr par construction (HTML saisi neutralisé, liens `javascript:` refusés), titres échappés par la vue, écriture réservée au formateur côté serveur.

## Informations à fournir pour compléter la page (non inventées)
Origine du projet et problème de départ ; date et étapes réelles ; qui est derrière KOLAKISA (nom, biographie : à saisir dans le profil du créateur) ; mission et vision en vos mots ; valeurs avec ce qu'elles changent concrètement ; éventuelles photographies ou captures autorisées ; témoignages réels avec accord des personnes ; état réel du paiement en ligne (le pied de page parle encore de projet pédagogique).

## Tests
`tests/a-propos.test.js` (10 : découpage, texte par défaut sans date/chiffre/témoignage, sécurité, liens existants, SEO, éditeur, persistance, retour au défaut) ; `tests/a-propos-navigateur.test.js` (6 : 9 largeurs 320 à 1920 px avec contenu par défaut puis contenu à mots interminables, contraste, focus clavier, mouvement réduit, éditeur) ; `tests/etape3-pages.test.js` mis à jour (nouveau titre, sections `h2`).
