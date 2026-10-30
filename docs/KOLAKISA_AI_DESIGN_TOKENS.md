# Jetons générés et protection des personnalisations

## Réglages produits (chemins du personnalisateur natif)
- Couleurs : `tokens.colors.{primary,secondary,accent,background,surface,text,muted,success,warning,error}`, `tokens.link.{color,hoverColor,underline}`, `tokens.border.color`.
- Typographie : `tokens.fonts.{heading,body,button,link}`, `tokens.type.h1…h6.{size,weight}`, `lineHeight` (h1–h3, texte), `caption.size`, `h1/body.letterSpacing`.
- Espacements et formes : `tokens.space.{sm,md,lg,xl}`, `tokens.radius.{sm,md,lg,card,button,field}`, `tokens.border.width`, `tokens.shadow.{card,button}`, `tokens.sizes.{buttonHeight,fieldHeight}`.
- Composants : `tokens.buttons.*` (rayon via radius.button, padding, états normal/survol/actif, focus), `tokens.forms.*`, `tokens.images.radius`.
- Mise en page : `settings.layout.{contentWidth,containerWidth,gutter}`. Responsive : `settings.responsive.{tablet,mobile}.{h1,h2,h3,body,gutter,spaceLg,spaceXl}`.
Ne sont **pas** générés (aucun réglage natif) : couleur dédiée des titres, `xs`/`xxl`, navigation (menus), espacement des lettres des boutons, mode sombre.

## Protection
Un réglage proposé est **protégé** si la personne l'a défini : (a) il est en attente dans son brouillon, ou (b) la valeur publiée n'est ni la valeur par défaut du moteur ni une valeur écrite par un précédent passage du générateur. Un réglage protégé n'est écrit que si la personne coche « Remplacer » (par réglage ou en bloc). Les réglages déjà en attente dans le brouillon sont toujours conservés (fusion).
## Application et annulation
L'application fusionne dans le brouillon (`customizer.saveDraft`, verrou optimiste, droits `appearance.styles`). **Rien n'est publié** : la publication, la planification et les versions restent celles du personnalisateur. L'annulation remet le brouillon à son état d'avant, uniquement si personne ne l'a modifié depuis.
