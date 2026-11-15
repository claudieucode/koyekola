// Aides d'affichage du gestionnaire de fichiers (adresses, tailles, libellés) : une seule source pour la page complète et pour le fragment (navigation fluide).
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const TYPE_NAMES = { image: "Image", video: "Vidéo", audio: "Audio", pdf: "PDF", document: "Document", lottie: "Lottie" };

function helpers({ spaceBase, f, section, sortDefault = "recent" }) {
  // Adresse de la médiathèque avec EXACTEMENT les paramètres donnés (aucun filtre hérité) : liens de la barre latérale
  const url = (o = {}) => {
    const p = new URLSearchParams();
    Object.entries(o).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "" && v !== false) p.set(k, v === true ? "1" : String(v)); });
    const q = p.toString();
    return spaceBase + (q ? `?${q}` : "");
  };
  // Adresse de la page actuelle avec quelques paramètres changés (tri, page, filtres) ; les autres filtres sont conservés
  const keep = (over = {}) => {
    const cur = { section, type: f.type, corbeille: f.trashed ? "1" : "", q: f.q, tri: f.sort === sortDefault ? "" : f.sort, periode: f.period, mois: f.month, portee: f.portee, recents: f.recents ? "1" : "", ...f.raw };
    return url({ ...cur, ...over });
  };
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const small = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1).replace(".", ",") + " Mo" : n >= 1024 ? Math.round(n / 1024) + " Ko" : n + " o");
  const label = (m) => TYPE_NAMES[m.type] || "Fichier";
  const ext = (m) => { const e = String(m.path).split(".").pop().toUpperCase(); return e.length <= 5 ? e : label(m).toUpperCase(); };
  const fdate = (v) => (v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—");
  const monthName = (m) => MONTHS[Number(m.slice(5, 7)) - 1] + " " + m.slice(0, 4);
  const dims = (m) => (m.width ? `${m.width} × ${m.height} px` : "—");
  // Valeurs de colonnes : uniquement des informations connues du serveur (jamais de valeur inventée)
  const format = (m) => { const sub = String(m.mime || "").split("/")[1] || ""; const n = sub.replace(/^x-/, "").split(/[+;]/)[0]; return n ? (n === "jpeg" ? "JPEG" : n === "svg" ? "SVG" : n.length <= 6 ? n.toUpperCase() : ext(m)) : ext(m); };
  const mpx = (m) => (m.width && m.height ? ((m.width * m.height) / 1e6 >= 0.1 ? ((m.width * m.height) / 1e6).toFixed(1).replace(".", ",") + " Mpx" : Math.round(m.width * m.height / 1000) + " kpx") : "—");
  const status = (m) => (m.deletedAt ? "En corbeille" : m.lastUsedAt ? "Utilisé" : "Prêt");
  return { url, keep, esc, format, mpx, status, small, label, ext, fdate, monthName, dims, TYPE_NAMES };
}
module.exports = { helpers };
