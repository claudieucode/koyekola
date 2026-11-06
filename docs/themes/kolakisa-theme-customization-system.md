# Système de personnalisation par thème — Kolakisa

Chaque thème de la bibliothèque a **son propre personnalisateur** : on ouvre l'aperçu, on clique sur **« Personnaliser le site »**, on règle dans un panneau, l'aperçu change en direct, puis on enregistre un brouillon ou on publie. Le panneau ne montre que les réglages qui agissent réellement sur le thème actif.

> Nombre de thèmes : la bibliothèque active compte aujourd'hui **74 thèmes** (paquets autonomes). Les 360 thèmes de l'ancienne bibliothèque sont archivés (`themes/_ancienne-bibliotheque`, non chargés) ; les sites qui en utilisent un gardent leur apparence. Le système lit la bibliothèque telle qu'elle est : tout thème ajouté plus tard est couvert dès qu'il est mesuré (voir « Ajouter un thème »).

## Architecture

| Pièce | Rôle |
|---|---|
| `src/marketing/themes/customization/controls.js` | Catalogue des réglages génériques **par composant** (en-tête, navigation, mise en page, typographie, boutons, cartes et images, pied de page) : sélecteurs, propriété mesurée, règle CSS, bornes. |
| `src/marketing/themes/customization/effective.json` | **Inventaire mesuré** : pour chaque thème, les réglages génériques qui agissent (avec leur valeur d'origine mesurée) et les réglages du moteur qui agissent (`static`). |
| `src/marketing/themes/customization/index.js` | Manifeste d'un thème (`manifestOf`), validation, CSS des réglages choisis (`cssFor`), inventaire. |
| `src/services/customizer.js` | Personnalisateur (brouillon, aperçu, publication, versions, par site) : ajoute les réglages du thème actif, masque ceux sans effet, gère le changement de thème. |
| `src/services/themes.js` | Activation de thème : range et restaure les réglages par site et par thème (`cms_theme_settings`, migration 129). |
| `src/marketing/themes/packs/index.js` | Rendu public : `headHtml` ajoute le CSS des réglages choisis (`<style id="kw-pack-cz">`). |
| `public/js/customizer.js` | Écran : applique en direct variables, attributs et règles du thème dans l'aperçu. |
| `scripts/mesurer-personnalisation-themes.js`, `scripts/mesurer-personnalisation-moteur.js` | Mesures dans Chrome (réglages génériques ; réglages du moteur). |

## Le manifeste d'un thème

`manifestOf(clé)` renvoie :

```
{ key, name, version, schema, measured, staticControls: [ids du moteur], defaults: { clé: valeur },
  panels: [ { id, label, hint, controls: [ { id, optKey, source: "theme" | "generic", kind, label, default, options|min,max,step,unit } ] } ] }
```

Trois sources de réglages :

1. **Réglages déclarés par le thème** (`options` de son `pack.js` : couleurs signature, bulles, jauge…) → panneau « Spécifique au thème ». Ils pilotent les variables `--pk-*` et les attributs `data-pk-*` du thème.
2. **Réglages génériques par composant** (`controls.js`) → panneaux En-tête, Navigation, Mise en page, Typographie, Boutons, Cartes et images, Pied de page. Ils n'apparaissent **que** si la mesure a vu le réglage agir sur ce thème.
3. **Réglages du moteur** (couleurs, polices, tailles, arrondis, boutons, images, formulaires, arrière-plan du personnalisateur) : proposés seulement s'ils agissent sur ce thème (`static`). Identité (nom, slogan, logo, favicon), menus, composants d'en-tête et de pied, CSS additionnel sont toujours proposés.

### Types de contrôles

`color` (code hexadécimal), `number` (borné, avec unité), `select` (choix fermé), `toggle` (interrupteur), plus les contrôles d'identité du moteur (texte, image de la médiathèque, menus).

### Valeurs par défaut

Elles sont **mesurées** sur le thème d'origine (couleur calculée, taille calculée…). **Tant qu'un réglage n'est pas choisi, aucune règle n'est ajoutée** : le rendu est identique, octet pour octet, au design d'origine. Une valeur d'origine hors des bornes (arrondi « pilule » de 999 px) s'affiche ramenée aux bornes, sans changer le rendu tant qu'on n'y touche pas.

### Dépendances et contraintes

- Chaque valeur est validée côté serveur (hexadécimal, nombre borné, choix fermé) avant d'atteindre une feuille de style : aucune valeur libre n'est jamais injectée.
- Un réglage d'un autre thème, inconnu, ou hors bornes est refusé (HTTP 422).
- Responsive : les largeurs, marges, espacements et tailles s'appliquent à toutes les largeurs ; les contrôles « tablette / mobile » du moteur restent dans leurs panneaux.

## Aperçu, brouillon, publication

- Les réglages choisis sont enregistrés avec le site, dans `tokens.pack.options` (clés `z-…` pour les génériques) : **même brouillon, mêmes versions, même planification, même publication** que tout le personnalisateur.
- Aperçu en direct : le serveur recalcule le CSS (`/personnaliser/rendu`), l'écran l'applique sans recharger (variables du thème, attributs `data-pk-*`, règles `#kw-pack-cz`).
- Un brouillon n'apparaît **jamais** sur le site public ; la publication est atomique (transaction) ; annuler / rétablir, réinitialiser un réglage (retour à sa valeur d'origine) et l'avertissement de sortie avec changements non enregistrés sont ceux du personnalisateur.

## Isolation

- Par **site** : brouillons, versions et réglages vivent avec le site ; un autre site (même thème) n'est pas touché.
- Par **thème** : les réglages d'un thème ne s'appliquent qu'à ce thème (CSS confiné à `body[data-kw-pack="<clé>"]`).
- Par **personne** : droits `appearance.read` / `appearance.styles` / `appearance.publish` vérifiés côté serveur.
- **Changer de thème** (réglage « Thème » du personnalisateur ou bouton « Activer ») range les réglages du thème quitté (`cms_theme_settings`) et les **restaure** au retour si la version majeure du thème est compatible. Contenus, médias, menus, formulaires et pages ne sont pas touchés.

## Le bouton « Personnaliser le site »

Dans l'aperçu d'un thème (Apparence → Thèmes → Aperçu), le bouton ouvre `/marketing/site-web/personnaliser?site=<site>&theme=<clé>` :

- thème **déjà actif** : le personnalisateur s'ouvre sur le site ;
- thème **non actif** : ce thème est *essayé dans le brouillon* (réglage « Thème »), l'aperçu montre le site avec ce thème, les réglages proposés sont ceux de ce thème ; rien n'est publié avant « Publier ».

## Tests

- `tests/personnalisation-themes.test.js` : manifeste valide pour chaque thème, réglages mesurés et propres à chaque thème, CSS confiné et validé, écran, aperçu, brouillon, publication, isolation entre sites, restauration au retour d'un thème, bouton.
- `tests/personnalisation-themes-navigateur.test.js` (Chrome) : pour chaque thème, le panneau propose ses réglages et un réglage choisi change réellement l'élément visé dans l'aperçu, sans débordement ; parcours du bouton.
- Mesures : `node scripts/mesurer-personnalisation-themes.js` et `node scripts/mesurer-personnalisation-moteur.js` (variables `THEMES=clé1,clé2`).

## Ajouter un thème et ses réglages

1. Créer le paquet (`themes/packs/<clé>/pack.js`, `style.css`) ; déclarer ses réglages propres dans `options` (couleur, choix, plage) et les lire dans son CSS avec `var(--pk-<clé>)` ou `[data-pk-<clé>="valeur"]`.
2. Lancer `THEMES=<clé> node scripts/mesurer-personnalisation-themes.js` puis `THEMES=<clé> node scripts/mesurer-personnalisation-moteur.js` : l'inventaire `effective.json` est mis à jour.
3. Lancer `node --test tests/personnalisation-themes.test.js` : le manifeste du nouveau thème est contrôlé.
4. Pour ajouter un **réglage générique** à tous les thèmes : une ligne dans `controls.js` (sélecteur, propriété, règle CSS, bornes), puis relancer la mesure.

## Limites

- Les réglages génériques ciblent les éléments HTML standards et les noms de classes courants (`btn`, `button`, `card`) : un thème qui structure autrement n'en reçoit simplement pas (jamais d'option sans effet).
- Les réglages « au survol » sont appliqués avec `!important` et proposés dès que le thème contient l'élément ; l'état au survol n'est pas mesuré pixel par pixel.
- Le choix de la **police** passe par les réglages du moteur (`tokens.fonts.*`), proposés quand le thème les utilise.
- Aperçu d'un thème non actif : il montre les pages du site avec ce thème (pas les pages de démonstration du thème).

## Inventaire des réglages de chaque thème

Voir [`kolakisa-theme-customization-inventory.md`](kolakisa-theme-customization-inventory.md) (généré par `node scripts/inventaire-personnalisation-themes.js`).
