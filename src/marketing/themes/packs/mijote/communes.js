// Pages communes du thème « mijote » : mentions légales, confidentialité et page « blocs » (titres, listes, citations, images, tableaux, code, boutons, colonnes, encadrés). Contenus de démonstration.
const { sec, esc } = require("../kit");
const P = "mj";
const BRAND = "Mijote", ED = "l'association Mijote Carnets de cuisine (démonstration)", VILLE = "Lyon", MAIL = "bonjour@mijote.example";

const legalHead = (title, lead) => `<section class="${P}-ph pk-bleed"><div class="${P}-wrap"><p class="${P}-eyebrow">Informations légales</p><div class="${P}-h1" role="heading" aria-level="1">${esc(title)}</div><p class="${P}-lead">${esc(lead)}</p></div></section>`;

const mentions = () => legalHead("Mentions légales", "Ce site est une démonstration : les informations ci-dessous sont fictives et à remplacer par celles de votre structure.") + `<section class="${P}-legal pk-bleed"><div class="${P}-wrap ${P}-prose">
<h2>Éditeur du site</h2><p>Le site « ${BRAND} » est édité par ${ED}, dont le siège est situé à ${VILLE}. Directeur de la publication : une personne fictive, joignable à l'adresse <a href="mailto:${MAIL}">${MAIL}</a>.</p>
<h2>Hébergement</h2><p>Le site est hébergé par un prestataire d'hébergement professionnel dont les coordonnées sont à indiquer ici (nom, adresse, téléphone). Les données sont stockées dans l'Union européenne.</p>
<h2>Propriété intellectuelle</h2><p>Les textes, illustrations et éléments graphiques de cette démonstration sont fictifs et créés pour le thème. Toute reprise d'un contenu réel de votre site nécessite l'accord écrit de son auteur, sauf courte citation accompagnée de sa source.</p>
<h2>Responsabilité</h2><p>L'éditeur s'efforce de fournir des informations exactes et à jour, sans pouvoir garantir leur exhaustivité. Les liens vers des sites tiers n'engagent pas sa responsabilité.</p>
<h2>Crédits</h2><p>Conception du thème : équipe Kolakisa. Polices : bibliothèque de polices libres du CMS, servies depuis le site lui-même.</p>
<h2>Contact</h2><p>Pour toute question juridique, écrivez-nous via la <a href="/contact">page de contact</a>.</p></div></section>`;

const confidentialite = () => legalHead("Politique de confidentialité", "Quelles données sont collectées, pourquoi, combien de temps, et comment exercer vos droits : le texte type d'un site sobre.") + `<section class="${P}-legal pk-bleed"><div class="${P}-wrap ${P}-prose">
<h2>Données collectées</h2><p>Le site ne collecte que les informations que vous saisissez dans le formulaire de <a href="/contact">contact</a> (nom, adresse e-mail, message) et des statistiques de fréquentation anonymisées, sans suivi publicitaire.</p>
<h3>Finalités</h3><ul><li>Répondre à votre message ;</li><li>Mesurer l'audience de façon agrégée pour améliorer les contenus ;</li><li>Respecter nos obligations légales.</li></ul>
<h3>Durée de conservation</h3><p>Les messages sont conservés douze mois au plus après le dernier échange, puis supprimés. Les statistiques sont conservées vingt-cinq mois sous forme agrégée.</p>
<h2>Cookies</h2><p>Le thème n'utilise aucun cookie publicitaire. Seuls des témoins techniques indispensables au fonctionnement du site peuvent être déposés ; ils ne nécessitent pas de consentement.</p>
<h2>Vos droits</h2><p>Vous pouvez demander l'accès, la rectification, l'effacement ou la portabilité de vos données, et vous opposer à leur traitement, en écrivant à <a href="mailto:${MAIL}">${MAIL}</a>. En cas de désaccord, vous pouvez saisir la CNIL.</p>
<h2>Sous-traitants</h2><p>L'hébergeur du site et l'outil d'envoi des e-mails agissent comme sous-traitants, dans l'Union européenne, et ne peuvent utiliser vos données que sur nos instructions.</p>
<h2>Mise à jour</h2><p>Cette politique est révisée lorsque le site évolue. Dernière mise à jour : <time datetime="2026-11-05">5 novembre 2026</time>.</p></div></section>`;

const demoSvg = `<svg viewBox="0 0 320 180" role="img" aria-label="Illustration de démonstration : paysage stylisé"><rect width="320" height="180" class="${P}-s1"/><circle cx="240" cy="54" r="26" class="${P}-s2"/><path d="M0 150 90 70 160 130 220 90 320 160V180H0z" class="${P}-s3"/></svg>`;

const blocs = () => legalHead("Blocs et éléments de contenu", "Tous les éléments que l'éditeur du CMS peut produire, vus dans ce thème : titres, listes, citations, images, tableaux, code, boutons, colonnes et encadrés.") + `<section class="${P}-legal ${P}-blocs pk-bleed"><div class="${P}-wrap ${P}-prose">
<p class="${P}-h1 ${P}-sample">Titre de niveau 1 (modèle de style)</p>
<h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
<p>Un paragraphe courant avec un <a href="/contact">lien</a>, du <strong>gras</strong>, de l'<em>italique</em>, un <mark>passage surligné</mark>, du <code>code en ligne</code> et une abréviation comme <abbr title="Organisation non gouvernementale">ONG</abbr>. Le texte courant reste lisible : au moins seize pixels sur mobile, soixante à quatre-vingts caractères par ligne sur grand écran.</p>
<h2>Listes</h2><ul><li>Une liste à puces</li><li>Avec un deuxième élément<ul><li>et un sous-élément</li></ul></li><li>Et un troisième</li></ul><ol><li>Une liste numérotée</li><li>Dans l'ordre</li><li>Jusqu'au bout</li></ol>
<h2>Citation</h2><blockquote><p>Une bonne mise en page est celle qu'on ne remarque pas : elle laisse la place à ce qui est dit.</p><cite>Citation de démonstration</cite></blockquote>
<h2>Image et légende</h2><figure class="${P}-fig">${demoSvg}<figcaption>Légende : une illustration vectorielle, légère et nette à toutes les tailles.</figcaption></figure>
<h2>Tableau</h2><div class="${P}-scroll" role="region" aria-label="Tableau défilant"><table><caption>Exemple de tableau à défilement horizontal sur mobile</caption><thead><tr><th scope="col">Élément</th><th scope="col">Sur mobile</th><th scope="col">Sur grand écran</th><th scope="col">Remarque</th></tr></thead><tbody><tr><td>Texte courant</td><td>16 px</td><td>17 à 19 px</td><td>Lisible sans zoom</td></tr><tr><td>Ligne de texte</td><td>pleine largeur</td><td>60 à 80 caractères</td><td>Confort de lecture</td></tr><tr><td>Zone de toucher</td><td>44 px</td><td>40 px</td><td>Doigt ou souris</td></tr></tbody></table></div>
<h2>Code</h2><pre><code>.carte { display: grid; gap: 1rem; }
@media (min-width: 48rem) { .carte { grid-template-columns: 1fr 1fr; } }</code></pre>
<h2>Boutons</h2><p class="${P}-btns"><a class="${P}-btn" href="/contact">Bouton principal</a><a class="${P}-btn ${P}-btn--alt" href="/recherche">Bouton secondaire</a><a class="${P}-btn ${P}-btn--line" href="/">Bouton discret</a></p>
<h2>Colonnes</h2><div class="${P}-cols"><div><h3>Première colonne</h3><p>Le texte se répartit sur deux colonnes à partir de la tablette, puis se range en une seule sur mobile.</p></div><div><h3>Seconde colonne</h3><p>Chaque colonne garde une longueur de ligne confortable et un espacement régulier.</p></div></div>
<h2>Encadrés</h2><aside class="${P}-note"><strong>À savoir.</strong> Un encadré d'information, pour une précision utile qui ne doit pas se perdre dans le texte.</aside><aside class="${P}-note ${P}-note--warn"><strong>Attention.</strong> Un encadré d'avertissement, plus appuyé, pour ce qui ne doit pas être manqué.</aside>
<h2>Séparateur</h2><hr><p>Fin de la démonstration.</p></div></section>`;

module.exports = { mentions: () => [sec(mentions())], confidentialite: () => [sec(confidentialite())], blocs: () => [sec(blocs())], legalHead };
