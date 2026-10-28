# Mission 9.1 — limites et vérifications restantes

1. **Brouillon non copié avec un site** : copier un site copie la version *publiée* de l'en-tête / du pied (mission 9) ; le brouillon éventuel de l'original n'est pas repris (testé : il n'apparaît pas dans la copie). À décider si on veut le reprendre.
2. **Pas d'historique de versions des composants** : « Mettre à jour » incrémente `version`, mais on ne peut pas restaurer une ancienne version (prévu pour une mission future, non ajouté).
3. **Aperçu** : une page du site à la fois (choisie automatiquement, ou `?page=`) ; pas de sélecteur de page dans l'interface de l'éditeur. Il n'y a pas de rechargement automatique quand une nouvelle révision est enregistrée pendant que l'aperçu est ouvert : le bandeau indique la révision affichée, rouvrir l'aperçu charge la dernière (testé côté serveur : avertissement affiché si `rev` est périmée).
4. **Création** : un en-tête créé par « Créer un en-tête » (contenu de départ) ou un pied choisi dans la liste est publié d'emblée (c'est une création, pas une modification) ; seules ses modifications suivantes passent par le brouillon.
5. **Rôle lecteur** : peut ouvrir l'aperçu privé (voir SECURITY).
6. **Accessibilité** : le bouton « Mettre à jour » et le statut sont dans la barre existante ; contraste, navigation clavier du nouveau menu d'abandon et lecteur d'écran réel non testés.
7. **Navigateurs** : Chrome 150 / macOS seulement ; ni Firefox, ni Safari, ni tactile.
8. **Suite complète (~4 840 tests)** : non relancée (voir rapport de tests). Elle doit tourner seule, concurrence 1, sans autre session. Le test de fluidité de la mission 6 reste ouvert pour la mission 10.
9. **Dialogue de confirmation** : un en-tête / pied n'affiche pas la liste des pages touchées avant « Mettre à jour » (contrairement aux composants globaux ordinaires) ; la publication est immédiate au clic, avec message de confirmation après réponse du serveur.
