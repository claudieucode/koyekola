// Playlist vidéo (comme « Video Playlist » d'Elementor) : un lecteur et la liste des vidéos ; cliquer une vidéo la lit dans le lecteur.
// Seules les vidéos YouTube / Vimeo (adresses reconnues) sont intégrées, jamais une adresse brute. Sans script, chaque titre est un lien vers sa vidéo.
module.exports = {
  type: "videoplaylist", label: "Playlist vidéo", group: "general", icon: "video", version: 1, style: "box", status: "operational",
  description: "Un lecteur et une liste de vidéos YouTube ou Vimeo",
  keywords: "playlist video liste lecteur youtube vimeo serie cours episodes",
  dependencies: ["Le visiteur doit pouvoir charger YouTube ou Vimeo (le lecteur est servi par ces services)"],
  schema: [
    { key: "title", kind: "text", label: "Nom de la playlist (facultatif)", max: 80, default: "Ma playlist" },
    { key: "videos", kind: "items", label: "Vidéos", min: 1, max: 20, default: [{ title: "Première vidéo", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: "" }],
      fields: [
        { key: "title", kind: "text", label: "Titre", max: 100, required: true, default: "Ma vidéo" },
        { key: "url", kind: "link", label: "Adresse YouTube ou Vimeo", required: true, default: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
        { key: "duration", kind: "text", label: "Durée affichée (ex. 4:30, facultatif)", max: 12, default: "" },
      ] },
    { key: "listSide", kind: "select", label: "Place de la liste", options: [["right", "À droite"], ["below", "En dessous"], ["left", "À gauche"]], default: "right" },
  ],
  validate(p, at) {
    const { parseVideoUrl } = require("../../../utils/video");
    p.videos.forEach((v, i) => {
      const r = parseVideoUrl(v.url);
      if (!r || !["youtube", "vimeo"].includes(r.kind)) throw new Error(`${at}, vidéo ${i + 1} : adresse YouTube ou Vimeo attendue.`);
    });
  },
  data(ctx, p) {
    const { parseVideoUrl } = require("../../../utils/video");
    return { videos: p.videos.map((v) => { const r = parseVideoUrl(v.url); return { src: r && r.src ? r.src : "", kind: r ? r.kind : "link" }; }) };
  },
};
