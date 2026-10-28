# Soft Surface — surfaces douces à la place des contours

Feuille unique : `public/css/kola-soft.css`, chargée **en dernier** dans :
- l'administration, le CMS et Marketing (`views/marketing/partials/top.ejs`, après `kola-brand.css`) ;
- Mon espace, le site public et l'espace élève (`views/partials/header.ejs`).

Elle ne remplace aucun jeton existant : elle s'appuie sur la surface (`--mk-surface`, `--dash-card`, `--surface`) et le texte (`--mk-text`, `--dash-text`, `--text`) du contexte, donc sur le thème clair/sombre de l'administration et sur les thèmes de Mon espace. Aucune couleur écrite en dur.

## 1. Jetons (centralisés, section 1 de la feuille)

| Jeton | Rôle | Calcul |
|---|---|---|
| `--soft-base` / `--soft-ink` | surface et texte du contexte | `--mk-surface`/`--mk-text`, `--dash-card`/`--dash-text`, sinon `--surface`/`--text` |
| `--soft-field` | champ au repos | texte 4,5 % dans la surface |
| `--soft-field-hover` | survol | texte 7 % |
| `--soft-field-focus` | focus (le champ « s'éclaire ») | la surface elle-même |
| `--soft-field-off` | désactivé | texte 3 % |
| `--soft-field-err` | erreur (nuance) | `--danger` 6 % |
| `--soft-edge`, `--soft-edge-hover` | filet de champ | texte 12 % / 20 % |
| `--soft-panel` | surface secondaire (groupe dans une carte, en-tête de tableau) | texte 2,5 % |
| `--soft-sep` | séparateur fin | texte 8 % |
| `--soft-card-edge`, `--soft-shadow` | filet et ombre de carte | texte 7 % ; deux ombres très légères |
| `--soft-ring`, `--soft-ring-err` | anneau de focus / d'erreur | accent 22 % / danger 20 % |
| `--soft-r` | rayon des champs | 10 px |

## 2. Composants adaptés
- **Champs** : texte, e-mail, mot de passe, nombre, date/heure/mois/semaine, URL, téléphone, recherche, zone de texte, liste déroulante, couleur, bouton « Parcourir » des fichiers.
- **États** : repos = fond teinté + filet très discret ; survol = fond un cran plus soutenu ; focus = fond de surface + filet d'accent + anneau 3 px ; désactivé = fond atténué + texte atténué + curseur interdit ; erreur = nuance de fond + filet `--danger` + anneau rouge au focus. Les filets gardent leur épaisseur (1 px) : aucun décalage de mise en page au survol/focus.
- **Cartes et panneaux** (Marketing/CMS) : filet à 7 %, ombre légère ; groupes de champs déjà dans une carte (`fieldset`, `.mk-us-group`…) : fond `--soft-panel`, plus de second cadre.
- **Tableaux** : séparateurs horizontaux à 8 %, en-tête teinté, ligne survolée en `--soft-field`.
- **Boutons** : secondaires (`.btn-outline`, `.btn-secondary`) = fond teinté + filet minimal ; destructif = fond teinté (plein rouge au survol) ; **principal, ghost et « Créer » inchangés**.
- **Menus** : surface du contexte, filet quasi invisible, ombre existante ; survol en `--soft-field-hover`. Dialogues : filet discret, pied de dialogue teinté.

## 3. Modules couverts
Administration/CMS, gestion des sites, paramètres de site, SEO, Marketing, emailing, Funnel Studio, médias, tableaux de bord, Mon espace (formateur), site public et espace élève — par héritage des gabarits communs.

## 4. Exceptions (bordures conservées volontairement)
- **Zones de dépôt et états vides** : pointillé conservé (affordance « déposer ici »), rendu plus discret.
- **Boutons secondaires** : filet minimal conservé (ils doivent rester repérables en dehors d'un champ).
- **Champs désactivés / lecture seule en erreur** : filet rouge conservé (ne jamais rendre une erreur imperceptible).
- **Éditeurs plein écran** (éditeur de pages `page-builder`, éditeur d'articles `blog-form`) et leurs panneaux : composants spécialisés avec leurs propres jetons ; ils ne chargent pas `kola-soft.css` (limite documentée, à traiter dans un chantier dédié avec leurs thèmes).
- **Contraste non textuel (WCAG 1.4.11)** : le filet de champ n'est plus à 3:1 ; le champ est identifié par son fond (≈ 1,1:1) et, surtout, par l'indicateur de focus (filet d'accent + anneau, ≥ 3:1). Choix assumé par la mission ; si un audit d'accessibilité l'exige, relever `--soft-edge` (ex. 35 %) dans la section 1 suffit, sans toucher aux composants.

## 5. Retour arrière
Retirer les deux lignes `kola-soft.css` des gabarits (`top.ejs`, `header.ejs`) : l'apparence précédente revient intégralement (aucun autre fichier modifié).
