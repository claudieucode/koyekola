# Palier 16 — Limites et points ouverts

## Honnêteté sur le périmètre
Le palier est **partiellement couvert** : audit, références avant, un défaut corrigé, aucun gain de vitesse mesuré. Il n'est pas déclaré entièrement validé.

## Non réalisé
- **Mesures « après »** comparatives : sans objet pour la seule correction (mémoire, pas vitesse).
- **Cycles ouverture / fermeture répétés pour la mémoire du navigateur** : non relancés aujourd'hui ; le dernier relevé disponible date de l'audit du 2026-10-10 (écouteurs et nœuds stables, tas ≈ +1 Ko par cycle, cause non identifiée).
- **Scénarios d'erreur réseau, réseau lent, session expirée, double clic dans l'éditeur** : non rejoués aujourd'hui ; la lecture du code montre leur prise en charge (401 / 403 / 409 / 422, reprise à délai croissant) mais ce n'est pas une preuve par test navigateur.
- **Pages de 300 widgets** : la limite du produit est de 400 éléments ; le banc existant mesure 100 et 400, c'est un test de charge.
- **Safari, Firefox, 120 Hz, processeur ralenti** : non testés.
- **Profil du serveur (`PUT /brouillon`), analyse SEO synchrone, rendu serveur de la frappe** : inchangés, toujours ouverts.

## Limites de mesure
Machine unique et partagée (charge 4 à 13 pendant les relevés), une seule exécution par banc, pointes d'images longues non attribuables. Les écarts de queue du plan de site et du flux ne sont pas expliqués.

## Pré-existant sur `main`, non traité ici
`site-espace.test.js` / `controles-contrat.test.js` (« dernière migration = 109 »), `refonte-design` et `etape0-design` (couleurs et ombres dans `style.css`).
