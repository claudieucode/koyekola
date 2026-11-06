// Avis clients (Reviews) : plusieurs avis réels présentés ensemble — note moyenne calculée, étoiles, auteur, date, source, photo — en grille ou en liste.
// Aucun avis inventé : le contenu de départ est entre crochets, à remplacer par de vrais avis (avec l'accord de leurs auteurs).
module.exports = {
  type: "reviews", label: "Avis clients", group: "general", icon: "star", version: 1, style: "box", status: "operational",
  description: "Plusieurs avis clients : note moyenne, étoiles, auteur, date et source, en grille ou en liste",
  keywords: "avis clients reviews temoignages notes etoiles note moyenne evaluations commentaires trustpilot google grille liste",
  schema: [
    { key: "title", kind: "text", label: "Titre de la section (facultatif)", max: 80, default: "Ils nous font confiance" },
    { key: "layout", kind: "select", label: "Présentation", options: [["grid", "Grille de cartes"], ["list", "Liste"]], default: "grid" },
    { key: "columns", kind: "number", label: "Colonnes (grille, bureau)", min: 1, max: 3, integer: true, default: 3 },
    { key: "showSummary", kind: "bool", label: "Afficher la note moyenne (calculée à partir des notes saisies)", default: true },
    { key: "items", kind: "items", label: "Avis", min: 1, max: 12, default: [
      { name: "[Prénom N.]", role: "[Fonction ou ville]", rating: 5, text: "[Écrivez ici l'avis réel d'un client, avec son accord.]", date: "", source: "", avatar: "" },
      { name: "[Prénom N.]", role: "[Fonction ou ville]", rating: 5, text: "[Un deuxième avis réel.]", date: "", source: "", avatar: "" },
      { name: "[Prénom N.]", role: "[Fonction ou ville]", rating: 4, text: "[Un troisième avis réel.]", date: "", source: "", avatar: "" }],
      fields: [
        { key: "name", kind: "text", label: "Nom de l'auteur", max: 80, required: true, default: "[Prénom N.]" },
        { key: "role", kind: "text", label: "Fonction ou lieu (facultatif)", max: 80, default: "" },
        { key: "rating", kind: "number", label: "Note de 0 à 5 (0 = pas d'étoiles)", min: 0, max: 5, integer: true, default: 5 },
        { key: "text", kind: "textarea", label: "Avis", max: 500, required: true, default: "[Avis réel]" },
        { key: "date", kind: "text", label: "Date (facultative, ex. Octobre 2026)", max: 30, default: "" },
        { key: "source", kind: "text", label: "Source (facultative, ex. Google)", max: 40, default: "" },
        { key: "avatar", kind: "image", label: "Photo (facultative)" },
      ] },
  ],
};
