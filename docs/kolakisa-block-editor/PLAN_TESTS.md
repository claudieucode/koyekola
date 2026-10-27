# Plan de tests — éditeur de blocs d'articles

## Principes
- Un test par capacité importante, écrit **avant** le correctif quand c'est un défaut : le test doit échouer sur l'ancien code (vérifié pour D3, D5, D10, D11 par retour temporaire à l'ancienne version).
- Aucune fonction n'est déclarée COMPLET sur la seule inspection du code (règle de la mission) : voir la colonne « Preuve » de `MATRICE_PARITE.md`.
- Les parcours d'interface tournent dans un **vrai Chrome** (Playwright, `playwright-core` + Google Chrome) ; sans Chrome ils sont ignorés **avec un message explicite** (jamais de succès silencieux).
- Aucune assertion d'un test existant n'a été affaiblie ; trois tests périmés ont été alignés (corbeille puis suppression définitive).

## Fichiers de tests de cette mission

| Fichier | Type | Ce qu'il prouve |
|---|---|---|
| `tests/editeur-blocs-p0-integrite.test.js` | serveur | D1/D4 (source), D2 (refus 413), D3 (conflit précis, autosave, restauration), D10 (restauration re-sanitisée), D11 (éléments retirés signalés), D12 (promotion unique avec révision) |
| `tests/editeur-blocs-navigateur.test.js` | Chrome | D1 (frappe pendant l'envoi), D4 (article créé dans le site), D5 (une seule création) |
| `tests/editeur-blocs-p1-navigateur.test.js` | Chrome | grouper/dégrouper (annulables), blocs verrouillés, transformer, copier/coller les styles, ancre et classes, aller-retour de 17 types de blocs éditeur ↔ serveur, Préformaté (Entrée), sélection multiple, raccourcis, annuler/rétablir désactivés, palette, vue en liste (Maj+clic, glisser-déposer), glisser depuis l'outil d'insertion, sans distraction, verrou imbriqué, 13 modèles, aperçu par appareil, notes |
| `tests/editeur-blocs-nouveaux-blocs.test.js` | serveur | Préformaté, Vers, Lire la suite (extrait automatique), Fichier (formats sûrs, refus des exécutables, téléversement), Couverture, Média et texte, légende de tableau, variantes, lecteurs Spotify/SoundCloud/Dailymotion/Loom/TED (et imitations refusées), sous-titres WebVTT, lettrine, teinte, liste décroissante, visibilité par appareil |
| `tests/editeur-blocs-supports.test.js` | serveur | ancre HTML et classes `kb-x-*` : validation, unicité, rendu public |
| `tests/editeur-blocs-registre.test.js` | serveur | registre ↔ nœuds de l'éditeur ↔ sanitisation ; diagnostic des blocs |
| `tests/editeur-blocs-reutilisables-sites.test.js` | serveur | blocs réutilisables par site (D7), historique, suppression sans réécriture muette (D6) |
| `tests/editeur-blocs-notes.test.js` | serveur | notes : fils, validations, résolution, isolation par site, suppression, jamais publiées, débit |
| `tests/editeur-blocs-limites.test.js` | serveur | D13 : limite des brouillons, dimensions d'image réelles, sitemap |
| `tests/editeur-blocs-a11y-perf-navigateur.test.js` | Chrome | accessibilité (noms, libellés, identifiants, onglets) sur 19 écrans ; clavier ; performance sur 800 blocs |

### Fichiers ajoutés par le chantier « parité complète »

| Fichier | Type | Ce qu'il prouve |
|---|---|---|
| `tests/editeur-blocs-styles-communs.test.js` | serveur + Chrome | réglages communs : valeurs fermées, couleurs piégées refusées, variables CSS, règle CSS pour chaque valeur, panneau Bloc, copier/coller des styles |
| `tests/editeur-blocs-reglages-blocs.test.js` | serveur + Chrome + site | style de liste, citation, pied de tableau, lightbox (dialogue, Échap, flèches), audio/vidéo/fichier/couverture/groupe/colonnes/espaceur, aller-retour de 13 réglages, rendu réel dans l'éditeur |
| `tests/editeur-blocs-integrations.test.js` | serveur + Chrome | 27 services : adresse reconstruite, imitations refusées, `sandbox`, collage d'une adresse |
| `tests/editeur-blocs-widgets.test.js` | serveur | 11 widgets (échappement, calendrier, flux), notes de bas de page, pages multiples, HTML signé (falsifications), **isolation entre 3 sites** (articles, catégories, pages, commentaires), `?date=`, aperçu RSS réservé au créateur |
| `tests/editeur-blocs-flux-rss.test.js` | serveur (base isolée) | anti-SSRF (20 adresses refusées), adresses de flux, lecture RSS/Atom, cache sans attente réseau, échec mémorisé |
| `tests/editeur-blocs-widgets-navigateur.test.js` | Chrome | inserteur, réglages d'un widget, notes de bas de page (ajout, numéro, modification au clic), HTML personnalisé (aperçu isolé, aller-retour exact), enregistrement réel |
| `tests/editeur-blocs-editeur-gutenberg.test.js` | Chrome | transformations, verrous partiels, lasso, fil d'Ariane, vue en liste repliable, modifier en HTML, zoom, `[[`, insécable, backtick, aperçu au survol, guide, copier/couper/coller, recherche/remplacement, plan, recadrage + rotation |
| `tests/editeur-blocs-mentions.test.js` | serveur + Chrome | mentions : seules les personnes lisant l'article, aucun e-mail exposé, saisie assistée |
| `tests/editeur-blocs-pages.test.js` | serveur + Chrome | page « À propos » en blocs : jamais un article, accès créateur seul, versions, retour au texte simple |
| `tests/editeur-blocs-nouveaux-blocs-2.test.js` | serveur + Chrome + site | LaTeX → MathML (saisies piégées), Icône, Liste de lecture, Accordéon exclusif, Onglets (sections, clavier), Fil d'Ariane ; insertion, réglages, aller-retour, site public |
| `tests/editeur-blocs-firefox.test.js` | Firefox 153 (BiDi) | chargement sans erreur JS, aller-retour des réglages, frappe/annulation, zoom, lightbox publique |
| `tests/editeur-blocs-a11y-perf-navigateur.test.js` (étendu) | Chrome | 0 défaut d'accessibilité sur les écrans ajoutés |

## Exécution
```
ENCRYPTION_KEY=$(printf '0%.0s' $(seq 64)) TEST_START_TIMEOUT_MS=180000 \
node --test --test-concurrency=1 tests/editeur-blocs-*.test.js
```
Suite « éditeur » élargie (fichiers du blog, des articles, des révisions, des blocs réutilisables) : voir `JOURNAL_IMPLEMENTATION.md`. Suite complète du dépôt : `npm test` (même clé factice).
Reconstruire le bundle après toute modification de `src/editor/` : `npm run build:editor` (nécessite `npm ci`, CodeMirror compris).

## Ce qui n'est pas couvert (dit clairement)
- Lecteur d'écran réel (NVDA, VoiceOver) : non testé ; seules des règles ARIA précises sont vérifiées automatiquement.
- Safari : non testé. Firefox : test de fumée seulement (le reste de la suite navigateur n'y est pas rejoué).
- Charge multi-utilisateurs réelle sur les notes : seule la limite de débit est testée.
- Bloc réutilisable modifié depuis l'article d'un site pour un bloc partagé : refus côté serveur testé, message côté éditeur non testé.
