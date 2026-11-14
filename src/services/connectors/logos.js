// Correspondance unique fournisseur → logo officiel (fichiers SVG locaux dans public/img/providers/).
// Ajouter un fournisseur = déposer son SVG officiel dans ce dossier et ajouter une ligne ici ; sans entrée, l'écran affiche une pastille discrète avec l'initiale (jamais un faux logo).
// Provenance : Anthropic, Mistral AI, OpenAI = simple-icons (CC0), couleur de marque appliquée ; Google = « G » multicolore officiel.
const LOGOS = Object.freeze({
  anthropic: "/img/providers/anthropic.svg",
  "google-ai": "/img/providers/google.svg",
  mistral: "/img/providers/mistral.svg",
  openai: "/img/providers/openai.svg",
});
module.exports = { logoOf: (id) => LOGOS[id] || null, LOGOS };
