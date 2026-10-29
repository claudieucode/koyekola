// Icônes proposées par le bloc « Icône » (liste fermée : noms du jeu d'icônes du site, src/utils/icons.js). Le serveur ne dessine QUE ces noms.
const CONTENT_ICONS = [
  ["star", "Étoile"], ["heart", "Cœur"], ["heartFilled", "Cœur plein"], ["check", "Coche"], ["checkCircle", "Coche cerclée"], ["info", "Information"], ["alertTriangle", "Attention"], ["alertCircle", "Alerte"],
  ["bell", "Cloche"], ["book", "Livre"], ["graduation", "Diplôme"], ["trophy", "Trophée"], ["briefcase", "Mallette"], ["users", "Équipe"], ["user", "Personne"], ["mail", "Courrier"], ["send", "Envoyer"],
  ["mapPin", "Lieu"], ["globe", "Monde"], ["clock", "Horloge"], ["calendarClock", "Agenda"], ["home", "Maison"], ["lock", "Cadenas"], ["shield", "Bouclier"], ["zap", "Éclair"], ["sparkles", "Étincelles"],
  ["trendingUp", "Progression"], ["barChart", "Graphique"], ["coin", "Pièce"], ["cart", "Panier"], ["tag", "Étiquette"], ["play", "Lecture"], ["video", "Vidéo"], ["download", "Télécharger"], ["upload", "Envoyer un fichier"],
  ["eye", "Œil"], ["search", "Recherche"], ["settings", "Réglages"], ["sliders", "Curseurs"], ["palette", "Palette"], ["sun", "Soleil"], ["moon", "Lune"], ["smartphone", "Téléphone"], ["monitor", "Écran"],
  ["bot", "Assistant"], ["network", "Réseau"], ["layers", "Couches"], ["listChecks", "Liste de contrôle"], ["calculator", "Calculatrice"], ["stickyNote", "Note"], ["printer", "Imprimante"], ["link", "Lien"],
  ["externalLink", "Lien externe"], ["quote", "Guillemets"], ["image", "Image"], ["fileText", "Document"], ["clip", "Trombone"], ["help", "Aide"], ["gitBranch", "Branches"],
];
const ICON_NAMES = CONTENT_ICONS.map(([n]) => n);
module.exports = { CONTENT_ICONS, ICON_NAMES };
