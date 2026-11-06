# Publication unique — architecture

```
services/singlePost.js        ← UNE description de tous les réglages (type, bornes, valeur d'origine) + validation + CSS + aides de rendu
   ├─ marketing/pages/siteSettings.js  (site)      normalizeSettings → settings.singlePost (compact : null si inchangé)
   ├─ services/appearance.js           (principal) normalizeConfig   → singlePost
   ├─ services/customizer.js           panneau « Types de publication › Publication unique » (généré depuis le catalogue, sans copie)
   │     └─ public/js/customizer.js + customizer.css : onglets, groupes, vignettes, liste réordonnable, 4 côtés, valeurs par appareil
   ├─ routes/blog.js    singlePostFor(req) → réglages résolus (+ brouillon en aperçu) ; données réelles (temps de lecture, dates, similaires, voisins)
   ├─ views/blog/show.ejs + views/blog/sp/_{header,share,authorbox,nav,related,comments}.ejs
   └─ public/css/single-post.css (structure) + <style data-sp-style> (valeurs) ; public/js/single-post-autoload.js
```
## Données et isolation
- Aucun réglage n'est lu depuis le navigateur : le site vient de l'hôte vérifié (`req.kwSite`) ou de la session du Customizer.
- Un identifiant de réglage de site (`settings.singlePost.*`) est refusé sur le principal et inversement (portée du catalogue).
- Aperçu : copie de travail **par session et par site**, superposée en mémoire ; rien n'est enregistré ni mis en cache (`no-store`, `noindex`).
- Publication : transaction unique (brouillon → configuration), version historisée (`cms_customizer_versions`), restauration possible.

## Pas de moteur parallèle
Le Customizer, le brouillon, la publication, l'aperçu, les commentaires, la taxonomie, la médiathèque, les polices et les couleurs du site sont **réutilisés**. Un seul rendu pour tous les thèmes ; un thème fournit seulement des valeurs par défaut.
