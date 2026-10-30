# KOLAKISA — Store Planner

`planner.plan(analyse)` propose les pages de la boutique selon le modèle et le pays :
- **Natives** (servies par le moteur, rien à créer) : Boutique (catalogue), Pages de catégories, Fiche produit, Panier et commande.
- **Éditoriales** (créées en **brouillon** par le Page Generator) : Accueil, À propos, Contact, FAQ, Livraison (absente pour une boutique 100 % numérique), Retours et remboursements, Conditions générales de vente, Politique de confidentialité, Mentions légales (pays de l'UE reconnus seulement), Blog (si le module est activé).

## Pages légales
Marquées `legal` et accompagnées de la mention : **« Modèle à compléter et à faire vérifier par un professionnel : il ne constitue ni un avis juridique ni une garantie de conformité. »** Pour un pays hors liste, une note rappelle que ses obligations locales ne sont pas connues de Kolakisa.

## Modifications
Ajouter, renommer, déplacer, changer le menu, retirer une page. **Une page nécessaire** (accueil, contact, livraison, retours, CGV, confidentialité, fiche produit, panier) **ne se retire pas**. Toute modification retire l'acceptation ; « Accepter » est exigé avant « Créer les pages éditoriales ». « Régénérer » recrée un plan (annulable). Les pages sont créées via le Page Generator (aucun écrasement : une page existante est sautée).
## Limites
Les pages produit/catégorie natives ne sont pas personnalisables par ce constructeur ; le sommaire et la navigation des pages natives sont ceux du moteur. Aucun modèle de page « produit » n'est généré (voir REMAINING_ISSUES).
