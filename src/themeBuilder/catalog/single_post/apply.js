// Fixe l'identité PROPRE d'un modèle « Article individuel » sur les éléments dont la couleur ou la police viendrait sinon de la charte du site :
//  · le contenu de l'article (postcontent) : texte, titres, citations et liens ont les polices et couleurs de l'identité du modèle (réglage natif « parties », modifiable dans l'éditeur) ;
//  · les textes sans taille : taille de base fixe (sinon `.lp-site` impose la taille de corps du site) ;
//  · le badge (ton « neutre » + couleurs de l'identité) et la barre de progression de lecture (couleur d'accent de l'identité).
// Une valeur déjà posée par la mise en page n'est jamais écrasée. Aucune valeur n'est un jeton du site.
const part = (o) => ({ styles: { desktop: o } });
function apply(nodes, S) {
  for (const n of nodes) {
    const dk = (n.styles = n.styles || {}).desktop = (n.styles && n.styles.desktop) || {};
    if (n.type === "postcontent") {
      Object.assign(dk, { color: dk.color || S.fg, fontFamily: dk.fontFamily || S.font });
      const parts = n.parts = n.parts || {};
      const set = (k, o) => { if (!parts[k]) parts[k] = part(o); };
      set("h2", { color: S.fg, fontFamily: S.head });
      set("h3", { color: S.fg, fontFamily: S.head });
      set("paragraph", { color: S.fg, fontFamily: S.font });
      set("quote", { color: S.fg, fontFamily: S.head });
      set("link", { color: S.accent, textDecoration: "underline" });
    } else if (n.type === "text") {
      if (!dk.fontSize) dk.fontSize = "16px";
    } else if (n.type === "badge") {
      n.props = { ...(n.props || {}), tone: "neutral" };
      Object.assign(dk, { backgroundColor: dk.backgroundColor || S.accent, color: dk.color || S.onAccent });
    } else if (n.type === "readingprogress") {
      n.parts = n.parts || {};
      if (!n.parts.fill) n.parts.fill = part({ backgroundColor: S.accent });
    }
    if (n.children) apply(n.children, S);
  }
}
module.exports = { apply };
