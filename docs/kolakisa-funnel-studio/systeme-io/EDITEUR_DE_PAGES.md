# Éditeur de pages

Préfixe `H` = https://help.systeme.io/article/

## 1. Accès et structure

- Accès : Sites > Sales funnels > cliquer le tunnel > **Edit page**. Source : H325-how-to-access-to-the-editor-of-a-page.
- Éditeur glisser-déposer sans code (https://systeme.io/features). Structure en **Section** > **Row/Column** > **éléments** ; nombre de sections libre ; démarrage depuis un modèle ou une page vierge. Source : H168-create-a-custom-page-how-systeme-io-editor-works.
- Réglages de section : Background color, Inner background color, image de fond (Upload) et mode d'affichage. Réglages d'élément : Typography, Color, taille, position ; icône Reset par réglage (H168).
- Aucune sauvegarde automatique de l'éditeur pour l'ancienne version : « Once the changes are saved, the old version of the page cannot be restored » (H306, H172, H292). Pas d'historique de versions documenté. À VÉRIFIER (annuler/rétablir, brouillon).
- Autosave : seul le chemin d'URL et le nom de page sont enregistrés automatiquement hors éditeur (H322).

## 2. Éléments documentés (libellés)

| Élément | Détails | Source |
|---|---|---|
| Section, Column | structure | H168 |
| Text | article « add and edit text » non lu | H342 (non lu) |
| Image | onglets Upload / Your images ; case « Optimize uploaded images » ; bouton Insert ; menu « Action when image clicked » > Open URL + champ Link. Alt text, dimensions, formats, poids max : non documentés (À VÉRIFIER) | H341-how-to-add-an-image-on-a-page |
| Button | 5 actions (Submit form, Show popup, Open URL, Next step URL, Download file) | H170-how-to-set-up-a-button |
| Form input | menu « Input type » ; personnalisation typographie, couleurs, bordures, alignement, placeholder | H1662-how-to-add-a-form-input |
| Form | conteneur de champs/cases/bouton ; onglets Elements, Design, Actions | H1662 |
| Survey | questions, réponses, tags | H1398-how-to-use-the-survey-element |
| Order bump, Coupon, Two-step order form, Order Summary, Physical product, Offer price | éléments de vente | voir UPSELLS_ET_DOWNSELLS.md, PRODUITS_ET_PAIEMENTS.md |
| Raw HTML | « Edit code » ; indisponible sur les pages Info ; invisible en Preview | H306-is-it-possible-to-insert-html-css-or-js-code |
| Vidéo, carrousel, ancre, PDF, fichier téléchargeable, Contact us | articles listés non lus (624, 1399, 258, 360, 340, 1580) | https://help.systeme.io/category/167-editor |
| Countdown timer | cité en marketing, non détaillé (À VÉRIFIER) | https://systeme.io/features |

La liste complète des éléments de la barre latérale gauche : À VÉRIFIER (compte gratuit).

## 3. Popups

Source : H409-how-to-add-a-popup-to-a-page.
- Accès : bouton **Popups** (haut gauche) > icône **+** > **Edit popup settings**.
- Options : **Show close button** ; **Open the popup automatically** ; délai d'ouverture en secondes ; **Open on exit intent**.
- Enregistrer des données : bouton du popup avec « Action when button clicked » = « Submit form ».
- Déclenchement par bouton : action « Show popup » + champ « Popup » (H1602).
- Limites (nombre, fréquence, mobile) : non documentées. À VÉRIFIER.

## 4. Blocs réutilisables (Master block)

Source : H509-how-to-create-a-master-block. Section (ou Row) > icône disquette > titre > case « Do you want to create a master block? » > Create. Toute modification (ou suppression) se répercute sur toutes les pages qui l'utilisent. Blocs non maîtres (enregistrés comme simples modèles de bloc) : le même flux enregistre un bloc ; différence exacte À VÉRIFIER.

## 5. Réglages de page

- **Settings** (panneau gauche) : section **Search Engine Optimization (SEO)** avec 6 champs : Title (onglet navigateur + partage), Description, Keywords (séparés par des virgules), Author, Social media image (upload), Hide from search engines (case). Les pages sont masquées par défaut des moteurs ; décocher pour indexer. Google s'appuie sur sitemap.xml ; après désactivation puis réactivation, demande d'indexation manuelle dans Google Search Console. Source : H510-what-is-the-search-engine-optimisation-seo-part-for. Pas de limite de caractères documentée.
- Section **Tracking** : **Header** (balise head) et **Footer** (DOM) par page ; zone « Tracking code » globale dans Settings > Sales Funnels. Balises interdites : head, html, body, footer (ouvrantes/fermantes). Source : H306.
- Favicon : H150 non lu. Titre de page : H350 non lu.

## 6. Insertion de code personnalisé

Source : H306. Trois voies : Tracking par page, Tracking code global, élément Raw HTML. iframe vidéo sans `<div>` autour. Raw HTML non disponible sur pages Info. Pas d'exécution en Preview.

## 7. Relations avec les autres modules

- Formulaires : voir FORMULAIRES_ET_CONTACTS.md ; erreur « At least one email input is required on this page » si bouton Submit form sans champ Email (H623-what-does-it-mean-when-the-error-at-least-one-email-input-is-required-on-this-pags-is-displayed-on-one-of-your-pages).
- Règles d'automatisation : accessibles depuis la page (Automation rules). H280.
- API/MCP : le contenu d'une page est enregistré en remplacement complet (aucune modification partielle) ; schémas JSON de page récupérables (H2323-how-to-create-a-public-api-key-on-systeme-io, H11408). Format exact : À VÉRIFIER.

## 8. Limites connues

- Aucune limite chiffrée documentée sur sections/éléments (H168).
- Responsive : voir RESPONSIVE_ET_ACCESSIBILITE.md.
