# Inventaire des widgets Single Page : Elementor ↔ Kolakisa

Offre Elementor (gratuit / Pro) : connaissance générale, non revérifiée (D). Kolakisa : registre réel (`NODE_TYPES`) le 2026-11-08. « Utilisé » = présent dans au moins un des 100 modèles actuels.

| Besoin | Widget Elementor | Équivalent Kolakisa | Utilisé aujourd'hui |
|---|---|---|---|
| Titre de page | Page Title (Pro) | `heading` `{{post.title}}` | oui |
| Contenu de la page | Post Content (Pro) | `postcontent` | oui (1 par modèle) |
| Heading, Text, Image, Button, Divider, Spacer | natifs | `heading`, `text`, `image`, `button`, `divider`, `spacer` | oui (spacer non) |
| Galerie | Image Gallery | `gallery` | non |
| Carrousel d'images | Image Carousel | `carousel`, `mediacarousel` | non |
| Vidéo, audio | Video, Audio | `video`, `audio`, `videoplaylist` | non |
| Icône, liste d'icônes | Icon, Icon List | `icon`, `iconlist` | 2 modèles |
| Boîte d'icône / d'image | Icon Box, Image Box | `iconbox`, `imagebox` | iconbox oui |
| Accordéon, onglets, bascule | Accordion, Tabs, Toggle | `accordion`, `tabs`, `toggle` | accordion, tabs oui |
| Témoignages, avis | Testimonial, Reviews | `testimonial`, `testimonialcarousel`, `reviews`, `rating` | testimonial oui |
| Compteurs, progression | Counter, Progress Bar | `counter`, `progress`, `motionnumberticker`, `motionbars`, `motiongauge` | non |
| Tarifs | Price Table, Price List | `pricing`, `pricelist` | pricing oui |
| Appel à l'action, boîte retournable | Call To Action, Flip Box | `cta`, `flipbox` | non |
| Titre animé | Animated Headline | `animatedheading` et variantes `motion…` | non |
| Compte à rebours | Countdown | `countdown` | 2 modèles |
| Carte | Google Maps | `map` | 4 modèles |
| Formulaire | Form (Pro) | `signupform` (formulaire réel du site), `emailsubscribe`, `bizcontact` | signupform conditionnel |
| Connexion | Login (Pro) | `account` | non |
| Réseaux, partage | Social Icons, Share Buttons | `social`, `sharebuttons`, `facebookbutton` | social oui |
| Fenêtre modale / popup | Popup (Pro) | `modal`, `floatingbutton` | non |
| Menu, fil d'Ariane, recherche | Nav Menu, Breadcrumbs, Search Form | `menu`, `cmsmenu`, `breadcrumb`, `search`, `menuanchor`, `sitemap` | menu, breadcrumb oui |
| Table des matières | Table of Contents | `toc` | 6 modèles |
| Chronologie | (tiers) | `timeline`, `motiontimeline`, `motionprocess` | timeline oui |
| Tableau | (Pro/tiers) | `table` | 2 modèles |
| Avant/après, hotspots | (tiers) | `beforeafter`, `hotspot`, `motioncompare` | non |
| Bandeau défilant | (tiers) | `marquee`, `motionlogomarquee` | non |
| Coordonnées entreprise | (Dynamic Tags) | `bizphone`, `bizemail`, `bizhours`, `bizlegal`, `bizfields`… (données de la fiche entreprise du site) | non |
| Profil / équipe | (tiers) | `profilecard` | oui |
| Paiement | WooCommerce / tiers | `stripebutton`, `paypalbutton`, `shopbuy`… (module Commerce requis) | non |
| HTML / code | HTML, Shortcode | `html`, `embed`, `code` (assainis) | non |
| Composants Motion | (tiers) | 45 `motion…` (héros, défilement épinglé, galerie horizontale, etc.) | non |
| Éléments d'article (hors périmètre page) | Post Info, Author Box… | `postmeta`, `authorbox`, `postnav`, `postcomments` | interdits dans les modèles de page (test) |
