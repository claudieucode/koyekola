# Base de connaissances de l'assistant Kolakisa

> DONNÉES DE DÉMONSTRATION. Ce site est un site de démonstration : les formations, les prix et le profil de la formatrice ci-dessous viennent du jeu de données de démo (`src/config/seed.js`). À remplacer par les informations réelles avant une mise en service réelle (voir README.md). Aucune information n'est inventée en dehors de cela : tout ce qui n'est pas écrit ici, l'assistant doit dire qu'il ne le sait pas.

## Ce qu'est Kolakisa
Kolakisa est le site de formations en ligne d'une formatrice : Claire, développeuse full-stack depuis 10 ans, qui partage ce qu'elle apprend sur le code, le design et l'entrepreneuriat en ligne. Ce n'est pas une place de marché : toutes les formations sont celles de Claire. Le principe : toutes les formations vidéo réunies au même endroit, à suivre où que l'on soit, à vie, sur tous les appareils.

## Les formations publiées (site de démonstration)
- Le guide complet de JavaScript moderne : catégorie Développement, niveau intermédiaire, 39,99 €. Des fondamentaux à la programmation asynchrone (promesses, async/await), avec des projets concrets.
- Apprendre Python pour l'analyse de données : catégorie Développement, niveau débutant, 29,99 €. Manipuler, visualiser et interpréter des données avec Python.
- Design d'interfaces avec Figma : catégorie Design, niveau débutant, 24,99 €. Maîtriser Figma pour concevoir des interfaces professionnelles.
- Typographie et mise en page : catégorie Design, niveau débutant, gratuite. Les fondamentaux d'une belle mise en page.
- Lancer son business en ligne : catégorie Business, niveau débutant, 49,99 €. De l'idée au premier client, pas à pas.
- Marketing digital pour débutants : catégorie Marketing, niveau débutant, 22,00 €. Les bases : réseaux sociaux, emailing, référencement.
Une formation « Node.js avancé » est en préparation : elle n'est pas encore disponible.
Les catégories du catalogue sont : Développement, Design, Business et Marketing.

## Suivre une formation
- Le catalogue se trouve à la page « Catalogue » (adresse /catalogue) : recherche, filtres par catégorie, niveau et prix, et tri.
- Chaque fiche de formation montre le programme en chapitres et sous-chapitres, les avis notés des élèves et des aperçus gratuits de certaines leçons.
- Après inscription, l'élève retrouve ses formations dans « Mes cours », avec le suivi de sa progression et un lecteur vidéo.
- Pour créer un compte : page « Inscription » (adresse /inscription). Pour se connecter : page « Connexion ».
- Un compte permet aussi : de confirmer son adresse e-mail, d'exporter ses données personnelles et de supprimer son compte depuis « Mon compte ».

## Certificats et quiz
- Un certificat de réussite est délivré automatiquement quand l'élève a terminé tous les sous-chapitres de la formation, quiz réussis compris. Il est délivré une seule fois par élève et par formation. Chaque certificat peut être vérifié en ligne.
- Les quiz ont un seuil de réussite. Le nombre de tentatives peut être limité par la formatrice, ou illimité selon le quiz.

## Prix, offres et paiement
- Les prix sont affichés en euros. Certaines formations peuvent avoir une offre promotionnelle avec un prix réduit pendant une période donnée : le prix de l'offre s'affiche alors dans le catalogue, sur la fiche et au panier.
- Le paiement par carte passe par Stripe Checkout, une page de paiement hébergée par Stripe : aucune donnée de carte ne passe par Kolakisa.
- Ce site est un site de démonstration : aucun paiement réel n'est traité. Tant que le paiement en ligne n'est pas ouvert, la fiche d'une formation payante affiche « L'achat en ligne ouvre bientôt » avec un lien vers la page de contact. Les formations gratuites peuvent être suivies sans payer.

## Aide, contact et informations pratiques
- Page « Contact » (adresse /contact) : un formulaire pour écrire à l'équipe (nom, adresse e-mail, sujet facultatif, message). Chaque message est lu et reçoit une réponse. Il n'y a pas d'adresse e-mail ni de numéro de téléphone publiés sur le site.
- Page « Questions fréquentes » (adresse /faq) : accès aux formations, paiement, certificats.
- Page « Support » (adresse /support) : ouvrir une demande de support, réservé aux personnes qui ont un compte.
- Page « À propos » (adresse /a-propos) et page « Blog » (adresse /blog).
- Cookies : le site demande l'accord du visiteur avant toute mesure d'audience. Sans accord, rien n'est suivi. Le choix se change à tout moment depuis le lien « Cookies » en bas de page, et la page /cookies détaille ce qui est enregistré.

## Ce que l'assistant ne sait pas (à ne jamais inventer)
Conditions de remboursement, durée exacte d'accès au-delà de « à vie », factures, TVA, adresse postale, adresse e-mail ou téléphone de l'équipe, horaires, données d'un compte personnel, état d'une commande. Pour tout cela : renvoyer vers la page Contact.
