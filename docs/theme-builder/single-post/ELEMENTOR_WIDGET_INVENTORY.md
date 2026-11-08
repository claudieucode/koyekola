# Inventaire des widgets Single Post : Elementor ↔ Kolakisa

Statut Elementor : **C** confirmé (page lue 2026-11-04), **N** non vérifié. Statut Kolakisa : constaté dans le code le 2026-11-08.

| Widget Elementor | Offre | Statut | Équivalent Kolakisa | Écart principal |
|---|---|---|---|---|
| Post Title | Pro | C | titre `{{post.title}}` | pas de repli ni de lien ni avant/après |
| Post Content | Pro | C | `postcontent` | un seul par modèle (contrôlé par l'audit) |
| Featured Image | Pro | C | image `{{post.image}}` | pas de légende/résolution/lien dédiés, volontairement pas d'image de repli |
| Post Excerpt | Pro | C | `{{post.excerpt}}` | pas de limite de mots |
| Post Info | Pro | C | `postmeta` | pas d'heure, d'ordre libre, d'icônes, d'éléments personnalisés |
| Terms / Categories / Tags | Pro | C (dans Post Info) | `postterms` | — |
| Author Box | Pro | C | `authorbox` | pas d'auteur personnalisé ni choix de disposition |
| Author Name / Image / Description | via balises | D | `{{post.author}}`, `{{post.author_avatar}}`, `{{post.author_bio}}` | — |
| Post Date / Last modified | balises | D | `{{post.date}}`, `{{post.modified}}` | — |
| Post Navigation | Pro | C | `postnav` | pas de flèches/bordures ; « même catégorie » seulement |
| Table of Contents | Pro | C | `toc` | pas d'exclusion, de repli, de conteneur cible |
| Reading Progress | tiers/N | N | `readingprogress` | **natif Kolakisa** |
| Breadcrumbs | Pro | N (options) | `breadcrumb` | niveaux saisis à la main |
| Share Buttons | Pro | N (options) | `sharebuttons` | jusqu'à 9 réseaux, URL construite côté serveur |
| Post Comments | Pro | C | `postcomments` | pas de source « article précis » |
| Posts / Loop Grid (liés) | Pro | C (Query) | `querylist` (related, samecategory, sameauthor, popular, recent, random, archive) | pas de constructeur include/exclude complet |
| Search Form | Pro | N | `search` | — |
| Heading, Text Editor, Image, Button, Divider, Spacer, Icon List, Accordion, Tabs, Video, Gallery, Testimonial, Social Icons, HTML | natif | D | éléments natifs de `nodes.js` (grammaire fermée) | HTML/Shortcode : à vérifier selon la sécurité du Page Builder |
| Form / Newsletter | Pro | N | widget formulaire du Page Builder | à vérifier |
| Reactions / likes | tiers | N | **absent** | — |
| Dynamic Tags (ACF, champs personnalisés) | Pro | N | étiquettes `{{post.*}}` fixes | **pas de champs personnalisés** |
