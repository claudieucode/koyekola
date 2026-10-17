# Écarts identifiés — état final (10 octobre 2026)

Source : `docs/elementor-reference/18-…` (46 lignes) et `19-widget-mapping.md` (correspondance widget par widget).

## Corrigés dans cette mission (testés)
**Dernière passe (ajouté)** : popups (après N clics, pages vues minimum, provenance), note privée par élément, export / import des classes globales, carte insérée dans les boucles, `/sante` vérifie `sharp`.

**Images** : résolutions (7 widgets + fond d'image + photo de témoignage), visionneuse du widget Image. **Galerie** : trois dispositions, 1 à 12 colonnes, ratio, légende au survol, filtres. **Texte** : contour, lettrine, colonnes, sens d'écriture, balise du titre p / div / span. **Nouveaux widgets** : Appel à l'action, Playlist vidéo, Bouton flottant, **Lien intelligent** (e-mail, appel, SMS, WhatsApp, Messenger, Skype, Viber, Waze, agenda Google / Outlook / Yahoo), **Contenu Facebook** (publication, vidéo, fil de page), **Plan du site**. **Widgets complétés** : compteur, compte à rebours (minuteur par visiteur, action à la fin, unités), liste d'icônes, partage et réseaux, vidéo (début / fin), diaporama (Ken Burns), témoignage (place de la photo), points d'intérêt (infobulle au survol), code (numéros, lignes surlignées, copier), suivi de lecture circulaire. **Conteneurs** : séparateur de forme, diaporama de fond, vidéo de fond (début / fin, secours, une fois), conteneur en **accordéon**, dégradé radial / positions / couleurs intermédiaires, découpe du fond (texte), bordures double / gravée / ridge / inset / outset, formes de masque. **Effets** : 12 animations de survol, inversion, **filtres d'arrière-plan**. **Position** : décalage d'ancre. **Popups** : ouverture automatique (chargement, défilement, sortie, inactivité), fréquence, fermeture automatique, verrou, carte du coin et barre du bas non bloquantes. **Page** : magnétisme de défilement. **Affichage** : jours et heures, groupes de conditions ET / OU. **Interface** : « Coller depuis un autre site ou navigateur ». **Responsive** : écran supplémentaire « Grand écran » (seuil réglable, hérite de l'ordinateur, masquage, aperçu 1920 px). **Images** : paliers 768, 1536 et 2048 ajoutés (liste Elementor / WordPress).

## Erreurs de ma première analyse, corrigées
Points de rupture modifiables, CSS personnalisé par élément, copier-coller entre sites, icônes d'onglets : tout existait déjà et avait été donné pour absent ou exclu.

## Non faits (décision ou raison documentée)
| Écart | Raison |
|---|---|
| Autres écrans supplémentaires (portable, tablette / mobile paysage) | Le mécanisme existe maintenant (écran « Grand écran » : héritage, aperçu, masquage, seuil réglable) ; les autres écrans n'ont pas été ajoutés (non demandés en priorité) |
| Facebook : Commentaires | Exige un identifiant d'application Facebook et un script externe |
| PayPal (dons, abonnements), boutons Stripe | Les paiements passent par le module Commerce (une seule source pour ventes et comptabilité) |
| SVG, shortcodes, icônes personnalisées (zip de polices) | Refusés pour la sécurité (script, code, polices non contrôlées) |
| Conditions propres aux modèles d'article (catégorie, auteur, date d'inscription) | Modèle d'audience différent (contacts, abonnés, clients, élèves) |
| Logical properties (début / fin) | Sens d'écriture ajouté (`direction`) ; marges et alignements restent physiques |
