# Publication unique — spécification des réglages

Généré à partir du catalogue réel (`services/singlePost.js`) : ce tableau ne peut pas diverger du code. Chemin = clé stockée (site : `settings.singlePost.<chemin>`, principal : `singlePost.<chemin>`).

Types : bool, enum, int, float, text, csv, color, font, order (liste réordonnable avec visibilité), box (4 côtés ; par appareil si indiqué), resp (nombre par appareil : desktop / tablet / mobile, vide = hérité).

## Onglet GÉNÉRAL

### Article · Zone de titre

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `titleArea.enabled` | bool | Zone de titre de l'article | true |  |
| `titleArea.items` | order | Éléments de la zone de titre (glisser pour réordonner) | breadcrumb, categories, title, excerpt, meta, image |  |
| `titleArea.align` | enum | Alignement | "left" | left · center · right |
| `titleArea.excerptWords` | int | Extrait : mots affichés au plus | 40 | 5 → 200 |
| `meta.items` | order | Métadonnées (glisser pour réordonner) | date, author, readtime, updated, comments(masqué), taxonomies(masqué) |  |
| `meta.separator` | enum | Séparateur des métadonnées | "•" | / · - · / · • · none |
| `author.prefix` | text | Auteur : préfixe | "par" | 30 car. |
| `author.avatar` | bool | Auteur : afficher l'avatar | false |  |
| `author.link` | bool | Auteur : lien vers sa page | true |  |
| `date.source` | enum | Date affichée | "published" | published · modified |
| `date.format` | enum | Format de date | "long" | long · short · iso |
| `date.updatedOnlyIfDifferent` | bool | Mise à jour : seulement si modifié un autre jour | true |  |
| `readingTime.enabled` | bool | Temps de lecture | true |  |
| `readingTime.wpm` | int | Vitesse de lecture (mots par minute) | 200 | 100 → 500 |
| `readingTime.label` | text | Texte du temps de lecture ({n} = minutes) | "{n} min de lecture" | 60 car. |
| `readingTime.format` | enum | Format du temps de lecture | "minutes" | minutes · range |

### Mise en page

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `container.layout` | enum | Mise en page du conteneur | "default" | default · full · narrow · wide |
| `container.style` | enum | Style de conteneur | "default" | default · open · boxed |
| `sidebar.layout` | enum | Mise en page de colonne latérale | "default" | default · none · left · right |
| `sidebar.style` | enum | Style de colonne latérale | "default" | default · open · boxed |
| `sidebar.width` | int | Largeur de la colonne latérale | 272 | 200 → 480 px |
| `sidebar.gap` | int | Espace entre contenu et colonne | 32 | 0 → 120 px |
| `sidebar.mobile` | enum | Colonne latérale sur mobile | "after" | after · before · hidden |
| `content.width` | enum | Largeur du contenu | "default" | default · custom |
| `content.widthPx` | int | Largeur personnalisée | 1200 | 480 → 1920 px |
| `imageShadow.enabled` | bool | Ombre portée des images dans le contenu | false |  |

### Image mise en avant

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `featured.size` | enum | Taille | "preset" | preset · original · custom |
| `featured.width` | int | Largeur | 1200 | 100 → 2400 px |
| `featured.height` | int | Hauteur (0 = selon le ratio) | 0 | 0 → 1600 px |
| `featured.ratio` | enum | Ratio | "16/9" | auto · 16/9 · 4/3 · 3/2 · 1/1 · 21/9 |
| `featured.fit` | enum | Ajustement (object-fit) | "cover" | cover · contain |
| `featured.position` | enum | Position (object-position) | "center" | center · top · bottom · left · right |
| `featured.align` | enum | Alignement de l'image | "center" | left · center · right |

### Publications similaires

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `related.enabled` | bool | Publications similaires | true |  |
| `related.title` | text | Titre de la section | "Vous pourriez également aimer" | 100 car. |
| `related.text` | text | Texte d'introduction (facultatif) | "" | 240 car. |
| `related.count` | int | Nombre de publications | 3 | 1 → 12 |
| `related.match` | enum | Correspondance | "both" | both · category · tags |
| `related.excludeCategories` | csv | Catégories exclues (noms, séparés par des virgules) | "" | 200 car. |
| `related.order` | enum | Ordre | "relevance" | relevance · recent · title |
| `related.layout` | enum | Disposition | "grid" | grid · list · masonry |
| `related.columns` | int | Colonnes (ordinateur) | 3 | 1 → 4 |
| `related.gap` | int | Espacement entre cartes | 20 | 0 → 80 px |
| `related.card.image` | bool | Carte : Image | true |  |
| `related.card.category` | bool | Carte : Catégorie | true |  |
| `related.card.title` | bool | Carte : Titre | true |  |
| `related.card.author` | bool | Carte : Auteur | false |  |
| `related.card.date` | bool | Carte : Date | true |  |
| `related.card.excerpt` | bool | Carte : Extrait | true |  |
| `related.card.more` | bool | Carte : Lire la suite | true |  |
| `related.position` | enum | Position | "end" | before-comments · after-comments · end |

### Commentaires

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `comments.enabled` | bool | Commentaires | true |  |
| `comments.showCount` | bool | Afficher le nombre de commentaires | true |  |
| `comments.title` | text | Titre de la section | "Commentaires" | 60 car. |
| `comments.placeholder` | text | Texte du champ de commentaire | "" | 140 car. |
| `comments.submitLabel` | text | Texte du bouton d'envoi | "" | 40 car. |
| `comments.emptyText` | text | Message s'il n'y a aucun commentaire | "" | 140 car. |
| `comments.position` | enum | Position | "after-content" | after-content · before-nav |

### Boîte d'auteur

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `authorBox.enabled` | bool | Boîte d'auteur avec partage social | true |  |
| `authorBox.title` | text | Titre | "À propos de l'auteur" | 60 car. |
| `authorBox.position` | enum | Position | "after-share" | before-content · after-content · after-share · after-nav |
| `authorBox.align` | enum | Alignement | "left" | left · center |
| `authorBox.avatarSize` | int | Taille de l'avatar | 72 | 32 → 160 px |
| `authorBox.bio` | bool | Afficher la biographie | true |  |
| `authorBox.recent` | int | Publications récentes de l'auteur (0 = aucune) | 0 | 0 → 5 |
| `authorBox.social` | bool | Afficher ses profils sociaux (s'il en a renseigné) | true |  |

### Navigation entre publications

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `postNav.enabled` | bool | Navigation entre publications | true |  |
| `postNav.mode` | enum | Ordre de navigation | "chronological" | chronological · category |
| `postNav.position` | enum | Position | "after-author" | after-share · after-author · after-comments |
| `postNav.style` | enum | Style | "cards" | cards · links |
| `postNav.titles` | bool | Afficher les titres | true |  |
| `postNav.images` | bool | Afficher les images | false |  |
| `postNav.align` | enum | Alignement | "spread" | spread · center |

### Chargement automatique des publications précédentes

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `autoload.enabled` | bool | Charger automatiquement l'article précédent en fin de lecture | false |  |
| `autoload.max` | int | Nombre maximal d'articles chargés | 3 | 1 → 10 |
| `autoload.updateUrl` | bool | Mettre à jour l'adresse et le titre de l'onglet | true |  |
| `autoload.loadingText` | text | Texte de chargement | "Chargement de l'article suivant…" | 80 car. |
| `autoload.errorText` | text | Message d'erreur | "Impossible de charger l'article suivant. Réessayez." | 120 car. |
| `autoload.endText` | text | Message en fin de liste | "Vous avez tout lu." | 80 car. |

### Partage social

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `share.enabled` | bool | Partage social | true |  |
| `share.nets.facebook` | bool | Facebook | true |  |
| `share.nets.x` | bool | X | true |  |
| `share.nets.linkedin` | bool | LinkedIn | true |  |
| `share.nets.whatsapp` | bool | WhatsApp | true |  |
| `share.nets.pinterest` | bool | Pinterest | false |  |
| `share.nets.telegram` | bool | Telegram | false |  |
| `share.nets.email` | bool | E-mail | true |  |
| `share.nets.copy` | bool | Copier le lien | true |  |
| `share.before` | bool | Afficher avant le contenu | true |  |
| `share.after` | bool | Afficher après le contenu | true |  |
| `share.floating` | bool | Afficher flottant (ordinateur) | true |  |
| `share.labels` | bool | Afficher les libellés | false |  |
| `share.style` | enum | Style des boutons | "round" | round · square · pill |
| `share.size` | int | Taille des boutons | 36 | 24 → 64 px |
| `share.gap` | int | Espacement des boutons | 8 | 0 → 32 px |
| `share.label` | text | Texte d'invitation | "Partager" | 60 car. |

## Onglet DESIGN

### Espacement de publication

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.spacing.outer` | box | Extérieur (marges) | null | 0…400 · par appareil |
| `design.spacing.inner` | box | À l'intérieur (paddings) | null | 0…400 · par appareil |

### Espacements étendus

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.space.title` | resp | Espacement — Titre | null | 0 → 200 px |
| `design.space.meta` | resp | Espacement — Métadonnées | null | 0 → 200 px |
| `design.space.image` | resp | Espacement — Image principale | null | 0 → 200 px |
| `design.space.blocks` | resp | Espacement — Entre les blocs de contenu | null | 0 → 200 px |
| `design.space.paragraphs` | resp | Espacement — Entre paragraphes | null | 0 → 200 px |
| `design.space.headings` | resp | Espacement — Titres secondaires | null | 0 → 200 px |
| `design.space.images` | resp | Espacement — Images du contenu | null | 0 → 200 px |
| `design.space.quotes` | resp | Espacement — Citations | null | 0 → 200 px |
| `design.space.nav` | resp | Espacement — Navigation | null | 0 → 200 px |
| `design.space.related` | resp | Espacement — Publications similaires | null | 0 → 200 px |
| `design.space.comments` | resp | Espacement — Commentaires | null | 0 → 200 px |
| `design.space.author` | resp | Espacement — Boîte d'auteur | null | 0 → 200 px |

### Typographie — Titre de l'article

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.type.title.font` | font | Police | "" |  |
| `design.type.title.size` | resp | Taille | null | 8 → 96 px |
| `design.type.title.weight` | enum | Graisse | "" | (hérité) · 400 · 500 · 600 · 700 · 800 |
| `design.type.title.lineHeight` | float | Hauteur de ligne | null | 1 → 3 |
| `design.type.title.letterSpacing` | float | Espacement des lettres (px) | null | -3 → 12 |
| `design.type.title.transform` | enum | Casse | "" | (hérité) · none · uppercase · lowercase · capitalize |
| `design.type.title.align` | enum | Alignement | "" | (hérité) · left · center · right · justify |

### Typographie — Sous-titres

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.type.subheadings.font` | font | Police | "" |  |
| `design.type.subheadings.size` | resp | Taille | null | 8 → 96 px |
| `design.type.subheadings.weight` | enum | Graisse | "" | (hérité) · 400 · 500 · 600 · 700 · 800 |
| `design.type.subheadings.lineHeight` | float | Hauteur de ligne | null | 1 → 3 |
| `design.type.subheadings.letterSpacing` | float | Espacement des lettres (px) | null | -3 → 12 |
| `design.type.subheadings.transform` | enum | Casse | "" | (hérité) · none · uppercase · lowercase · capitalize |
| `design.type.subheadings.align` | enum | Alignement | "" | (hérité) · left · center · right · justify |

### Typographie — Contenu

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.type.content.font` | font | Police | "" |  |
| `design.type.content.size` | resp | Taille | null | 8 → 96 px |
| `design.type.content.weight` | enum | Graisse | "" | (hérité) · 400 · 500 · 600 · 700 · 800 |
| `design.type.content.lineHeight` | float | Hauteur de ligne | null | 1 → 3 |
| `design.type.content.letterSpacing` | float | Espacement des lettres (px) | null | -3 → 12 |
| `design.type.content.transform` | enum | Casse | "" | (hérité) · none · uppercase · lowercase · capitalize |

### Typographie — Paragraphes

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.type.paragraphs.font` | font | Police | "" |  |
| `design.type.paragraphs.size` | resp | Taille | null | 8 → 96 px |
| `design.type.paragraphs.weight` | enum | Graisse | "" | (hérité) · 400 · 500 · 600 · 700 · 800 |
| `design.type.paragraphs.lineHeight` | float | Hauteur de ligne | null | 1 → 3 |
| `design.type.paragraphs.letterSpacing` | float | Espacement des lettres (px) | null | -3 → 12 |
| `design.type.paragraphs.transform` | enum | Casse | "" | (hérité) · none · uppercase · lowercase · capitalize |
| `design.type.paragraphs.align` | enum | Alignement | "" | (hérité) · left · center · right · justify |

### Typographie — Citations

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.type.quotes.font` | font | Police | "" |  |
| `design.type.quotes.size` | resp | Taille | null | 8 → 96 px |
| `design.type.quotes.weight` | enum | Graisse | "" | (hérité) · 400 · 500 · 600 · 700 · 800 |
| `design.type.quotes.lineHeight` | float | Hauteur de ligne | null | 1 → 3 |
| `design.type.quotes.letterSpacing` | float | Espacement des lettres (px) | null | -3 → 12 |
| `design.type.quotes.transform` | enum | Casse | "" | (hérité) · none · uppercase · lowercase · capitalize |
| `design.type.quotes.align` | enum | Alignement | "" | (hérité) · left · center · right · justify |

### Typographie — Listes

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.type.lists.font` | font | Police | "" |  |
| `design.type.lists.size` | resp | Taille | null | 8 → 96 px |
| `design.type.lists.weight` | enum | Graisse | "" | (hérité) · 400 · 500 · 600 · 700 · 800 |
| `design.type.lists.lineHeight` | float | Hauteur de ligne | null | 1 → 3 |
| `design.type.lists.letterSpacing` | float | Espacement des lettres (px) | null | -3 → 12 |
| `design.type.lists.transform` | enum | Casse | "" | (hérité) · none · uppercase · lowercase · capitalize |

### Typographie — Liens

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.type.links.font` | font | Police | "" |  |
| `design.type.links.size` | resp | Taille | null | 8 → 96 px |
| `design.type.links.weight` | enum | Graisse | "" | (hérité) · 400 · 500 · 600 · 700 · 800 |
| `design.type.links.lineHeight` | float | Hauteur de ligne | null | 1 → 3 |
| `design.type.links.letterSpacing` | float | Espacement des lettres (px) | null | -3 → 12 |
| `design.type.links.transform` | enum | Casse | "" | (hérité) · none · uppercase · lowercase · capitalize |

### Typographie — Légendes

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.type.captions.font` | font | Police | "" |  |
| `design.type.captions.size` | resp | Taille | null | 8 → 96 px |
| `design.type.captions.weight` | enum | Graisse | "" | (hérité) · 400 · 500 · 600 · 700 · 800 |
| `design.type.captions.lineHeight` | float | Hauteur de ligne | null | 1 → 3 |
| `design.type.captions.letterSpacing` | float | Espacement des lettres (px) | null | -3 → 12 |
| `design.type.captions.transform` | enum | Casse | "" | (hérité) · none · uppercase · lowercase · capitalize |
| `design.type.captions.align` | enum | Alignement | "" | (hérité) · left · center · right · justify |

### Typographie — Métadonnées

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.type.meta.font` | font | Police | "" |  |
| `design.type.meta.size` | resp | Taille | null | 8 → 96 px |
| `design.type.meta.weight` | enum | Graisse | "" | (hérité) · 400 · 500 · 600 · 700 · 800 |
| `design.type.meta.lineHeight` | float | Hauteur de ligne | null | 1 → 3 |
| `design.type.meta.letterSpacing` | float | Espacement des lettres (px) | null | -3 → 12 |
| `design.type.meta.transform` | enum | Casse | "" | (hérité) · none · uppercase · lowercase · capitalize |
| `design.type.meta.align` | enum | Alignement | "" | (hérité) · left · center · right · justify |

### Typographie — Auteur

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.type.author.font` | font | Police | "" |  |
| `design.type.author.size` | resp | Taille | null | 8 → 96 px |
| `design.type.author.weight` | enum | Graisse | "" | (hérité) · 400 · 500 · 600 · 700 · 800 |
| `design.type.author.lineHeight` | float | Hauteur de ligne | null | 1 → 3 |
| `design.type.author.letterSpacing` | float | Espacement des lettres (px) | null | -3 → 12 |
| `design.type.author.transform` | enum | Casse | "" | (hérité) · none · uppercase · lowercase · capitalize |

### Typographie — Temps de lecture

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.type.readtime.font` | font | Police | "" |  |
| `design.type.readtime.size` | resp | Taille | null | 8 → 96 px |
| `design.type.readtime.weight` | enum | Graisse | "" | (hérité) · 400 · 500 · 600 · 700 · 800 |
| `design.type.readtime.lineHeight` | float | Hauteur de ligne | null | 1 → 3 |
| `design.type.readtime.letterSpacing` | float | Espacement des lettres (px) | null | -3 → 12 |
| `design.type.readtime.transform` | enum | Casse | "" | (hérité) · none · uppercase · lowercase · capitalize |

### Typographie — Navigation

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.type.nav.font` | font | Police | "" |  |
| `design.type.nav.size` | resp | Taille | null | 8 → 96 px |
| `design.type.nav.weight` | enum | Graisse | "" | (hérité) · 400 · 500 · 600 · 700 · 800 |
| `design.type.nav.lineHeight` | float | Hauteur de ligne | null | 1 → 3 |
| `design.type.nav.letterSpacing` | float | Espacement des lettres (px) | null | -3 → 12 |
| `design.type.nav.transform` | enum | Casse | "" | (hérité) · none · uppercase · lowercase · capitalize |

### Typographie — Publications similaires

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.type.related.font` | font | Police | "" |  |
| `design.type.related.size` | resp | Taille | null | 8 → 96 px |
| `design.type.related.weight` | enum | Graisse | "" | (hérité) · 400 · 500 · 600 · 700 · 800 |
| `design.type.related.lineHeight` | float | Hauteur de ligne | null | 1 → 3 |
| `design.type.related.letterSpacing` | float | Espacement des lettres (px) | null | -3 → 12 |
| `design.type.related.transform` | enum | Casse | "" | (hérité) · none · uppercase · lowercase · capitalize |

### Typographie — Commentaires

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.type.comments.font` | font | Police | "" |  |
| `design.type.comments.size` | resp | Taille | null | 8 → 96 px |
| `design.type.comments.weight` | enum | Graisse | "" | (hérité) · 400 · 500 · 600 · 700 · 800 |
| `design.type.comments.lineHeight` | float | Hauteur de ligne | null | 1 → 3 |
| `design.type.comments.letterSpacing` | float | Espacement des lettres (px) | null | -3 → 12 |
| `design.type.comments.transform` | enum | Casse | "" | (hérité) · none · uppercase · lowercase · capitalize |
| `design.type.comments.align` | enum | Alignement | "" | (hérité) · left · center · right · justify |

### Couleurs — Zone de titre

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.color.titleArea.bg` | color | Fond | "" |  |
| `design.color.titleArea.text` | color | Texte | "" |  |

### Couleurs — Titre

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.color.title.text` | color | Texte | "" |  |

### Couleurs — Métadonnées

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.color.meta.text` | color | Texte | "" |  |
| `design.color.meta.link` | color | Lien | "" |  |
| `design.color.meta.linkHover` | color | Lien au survol | "" |  |

### Couleurs — Contenu

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.color.content.text` | color | Texte | "" |  |
| `design.color.content.bg` | color | Fond | "" |  |

### Couleurs — Liens

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.color.links.text` | color | Texte | "" |  |
| `design.color.links.hover` | color | Survol | "" |  |
| `design.color.links.focus` | color | Focus | "" |  |
| `design.color.links.active` | color | Actif | "" |  |

### Couleurs — Citations

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.color.quotes.text` | color | Texte | "" |  |
| `design.color.quotes.bg` | color | Fond | "" |  |
| `design.color.quotes.border` | color | Bordure | "" |  |

### Couleurs — Légendes

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.color.captions.text` | color | Texte | "" |  |

### Couleurs — Auteur

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.color.author.text` | color | Texte | "" |  |
| `design.color.author.bg` | color | Fond | "" |  |
| `design.color.author.link` | color | Lien | "" |  |
| `design.color.author.linkHover` | color | Lien au survol | "" |  |

### Couleurs — Navigation

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.color.nav.text` | color | Texte | "" |  |
| `design.color.nav.bg` | color | Fond | "" |  |
| `design.color.nav.hover` | color | Survol | "" |  |
| `design.color.nav.focus` | color | Focus | "" |  |

### Couleurs — Publications similaires

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.color.related.text` | color | Texte | "" |  |
| `design.color.related.bg` | color | Fond | "" |  |
| `design.color.related.link` | color | Lien | "" |  |
| `design.color.related.linkHover` | color | Lien au survol | "" |  |

### Couleurs — Commentaires

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.color.comments.text` | color | Texte | "" |  |
| `design.color.comments.bg` | color | Fond | "" |  |
| `design.color.comments.link` | color | Lien | "" |  |
| `design.color.comments.linkHover` | color | Lien au survol | "" |  |

### Couleurs — Partage social

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.color.share.text` | color | Texte | "" |  |
| `design.color.share.bg` | color | Fond | "" |  |
| `design.color.share.hover` | color | Survol | "" |  |
| `design.color.share.focus` | color | Focus | "" |  |

### Bordures — Conteneur

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.border.container.width` | box | Épaisseur (px) | null | 0…20 |
| `design.border.container.color` | color | Couleur | "" |  |
| `design.border.container.radius` | box | Rayons (haut-gauche, haut-droite, bas-droite, bas-gauche) | null | 0…80 |

### Bordures — Boîte d'auteur

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.border.authorBox.width` | box | Épaisseur (px) | null | 0…20 |
| `design.border.authorBox.color` | color | Couleur | "" |  |
| `design.border.authorBox.radius` | box | Rayons (haut-gauche, haut-droite, bas-droite, bas-gauche) | null | 0…80 |

### Bordures — Publications similaires

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.border.related.width` | box | Épaisseur (px) | null | 0…20 |
| `design.border.related.color` | color | Couleur | "" |  |
| `design.border.related.radius` | box | Rayons (haut-gauche, haut-droite, bas-droite, bas-gauche) | null | 0…80 |

### Bordures — Commentaires

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.border.comments.width` | box | Épaisseur (px) | null | 0…20 |
| `design.border.comments.color` | color | Couleur | "" |  |
| `design.border.comments.radius` | box | Rayons (haut-gauche, haut-droite, bas-droite, bas-gauche) | null | 0…80 |

### Rayons

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.radius.images` | int | Rayon des images du contenu | null | 0 → 60 px |
| `design.radius.buttons` | int | Rayon des boutons (partage, navigation) | null | 0 → 60 px |

### Ombre des images du contenu

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.shadow.images.x` | int | Décalage horizontal | 0 | -60 → 60 px |
| `design.shadow.images.y` | int | Décalage vertical | 8 | -60 → 60 px |
| `design.shadow.images.blur` | int | Flou | 24 | 0 → 120 px |
| `design.shadow.images.spread` | int | Extension | 0 | -40 → 80 px |
| `design.shadow.images.color` | color | Couleur | "#000000" |  |
| `design.shadow.images.opacity` | int | Opacité | 20 | 0 → 100 % |

### Ombre du conteneur

| Chemin | Type | Réglage | Origine | Limites / choix |
|---|---|---|---|---|
| `design.shadow.container.x` | int | Décalage horizontal | 0 | -60 → 60 px |
| `design.shadow.container.y` | int | Décalage vertical | 0 | -60 → 60 px |
| `design.shadow.container.blur` | int | Flou | 0 | 0 → 120 px |
| `design.shadow.container.spread` | int | Extension | 0 | -40 → 80 px |
| `design.shadow.container.color` | color | Couleur | "#000000" |  |
| `design.shadow.container.opacity` | int | Opacité | 0 | 0 → 100 % |


Nombre total de réglages : 263.
