# Planificateur de consignes d'images

**Entrées** : structure réelle des pages (sections), type de site, secteur, ambiance et teinte de la direction artistique appliquée (21.5), format de l'emplacement.
**Emplacements détectés** : bandeau sans image (`hero.image` vide) ; illustrations supplémentaires pour les pages « réalisations / galerie / portfolio / projets / biens » (3) et « accueil » (1), insérées comme sections natives `image`. Rien n'est inventé pour les cartes, témoignages ou formations (pas d'emplacement). Les images de produits/catégories d'une boutique sont signalées **`no_slot`** : aucun composant produit natif.
**Fiche** : `id, key, pageId, pageName, sectionId, widget, slot, mediaType, description, prompt, style, format, ratio, width, height, priority, status, reason`.
**Consigne** : sujet du secteur (immobilier, restaurant, hôtel, boutique, formation, tech, portfolio, association, blog, défaut) + style de l'ambiance + palette (teinte nommée) + composition (espace libre pour le texte sur un bandeau) + contraintes fixes : **sans texte intégré, sans logo, sans personne identifiable, sans marque réelle**. Modifiable (consigne, format) avant génération.
**Cohérence entre pages** : même ambiance et même teinte pour tout le site.
**Texte alternatif** d'une image générée : repris de la demande + « (image générée) » ; jamais de description inventée.
