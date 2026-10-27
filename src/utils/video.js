// Analyse d'un lien vidéo saisi par le formateur et décide comment l'afficher.
// Sécurité : on n'intègre (iframe) QUE des domaines connus (liste blanche) et on reconstruit
// l'adresse d'intégration nous-mêmes à partir d'un identifiant validé : jamais l'URL brute.
//
// Renvoie null si le lien est inutilisable, sinon { kind, src, url } :
//   youtube | vimeo → src = adresse du lecteur intégré (iframe)
//   bunny           → videoId = identifiant Bunny Stream (lien signé fabriqué à l'affichage)
//   file            → src = fichier vidéo direct (balise <video>)
//   link            → src = simple lien à ouvrir (page web quelconque, non intégrée)

const { isBunnyId } = require("./bunny");

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"]);
const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);
const VIDEO_FILE = /\.(mp4|webm|ogg|ogv|mov|m4v)$/i;

function youtubeId(url) {
  const host = url.hostname.toLowerCase();
  let id = null;
  if (host === "youtu.be") {
    id = url.pathname.slice(1).split("/")[0];
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else id = (url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/) || [])[1];
  }
  return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
}

// Vimeo : identifiant numérique, et éventuellement un « hash » pour les vidéos non répertoriées
function vimeoInfo(url) {
  if (!VIMEO_HOSTS.has(url.hostname.toLowerCase())) return null;
  const match = url.hostname.toLowerCase() === "player.vimeo.com"
    ? url.pathname.match(/^\/video\/(\d+)/)
    : url.pathname.match(/^\/(\d+)(?:\/([A-Za-z0-9]{6,20}))?\/?$/);
  if (!match) return null;
  const hash = match[2] || url.searchParams.get("h");
  return { id: match[1], hash: hash && /^[A-Za-z0-9]{6,20}$/.test(hash) ? hash : null };
}

function parseVideoUrl(raw) {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const trimmed = raw.trim();

  // Vidéo Bunny Stream : l'identifiant seul (ou précédé de « bunny: »). On ne stocke que l'identifiant ;
  // le lien de lecture signé est fabriqué à chaque affichage autorisé (src/utils/bunny.js).
  const bunnyCandidate = trimmed.replace(/^bunny:/i, "");
  if (isBunnyId(bunnyCandidate)) return { kind: "bunny", videoId: bunnyCandidate.toLowerCase(), url: bunnyCandidate.toLowerCase() };

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const yt = youtubeId(url);
  if (yt) return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${yt}?rel=0`, url: trimmed };

  const vimeo = vimeoInfo(url);
  if (vimeo) {
    return { kind: "vimeo", src: `https://player.vimeo.com/video/${vimeo.id}${vimeo.hash ? `?h=${vimeo.hash}` : ""}`, url: trimmed };
  }

  if (VIDEO_FILE.test(url.pathname)) return { kind: "file", src: url.href, url: trimmed };
  return { kind: "link", src: url.href, url: trimmed };
}

// Autres lecteurs intégrables (bloc « Contenu embarqué ») : même règle de sécurité que ci-dessus, l'adresse d'intégration est RECONSTRUITE
// à partir d'identifiants validés, jamais copiée. Renvoie { provider, src, height?, ratio? } ou null.
const SPOTIFY_PATH = /^\/(?:intl-[a-z]{2}(?:-[a-z]{2})?\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]{10,30})\/?$/;
function embedProvider(raw) {
  let url;
  try { url = new URL(String(raw || "").trim()); } catch { return null; }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "open.spotify.com") {
    const m = url.pathname.match(SPOTIFY_PATH);
    return m ? { provider: "spotify", src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, height: ["track", "episode"].includes(m[1]) ? 152 : 352, title: "Lecteur Spotify" } : null;
  }
  if (host === "soundcloud.com") {
    const m = url.pathname.match(/^\/([A-Za-z0-9_-]{2,50})\/((?:sets\/)?[A-Za-z0-9_-]{2,100})\/?$/);
    return m ? { provider: "soundcloud", src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(`https://soundcloud.com/${m[1]}/${m[2]}`)}&visual=false&show_comments=false`, height: 166, title: "Lecteur SoundCloud" } : null;
  }
  if (host === "dailymotion.com" || host === "dai.ly") {
    const id = host === "dai.ly" ? (url.pathname.match(/^\/([a-z0-9]{5,12})\/?$/i) || [])[1] : (url.pathname.match(/^\/(?:embed\/)?video\/([a-z0-9]{5,12})\/?$/i) || [])[1];
    return id ? { provider: "dailymotion", src: `https://www.dailymotion.com/embed/video/${id}`, ratio: "16-9", title: "Vidéo Dailymotion" } : null;
  }
  if (host === "loom.com") {
    const m = url.pathname.match(/^\/(?:share|embed)\/([a-f0-9]{32})\/?$/i);
    return m ? { provider: "loom", src: `https://www.loom.com/embed/${m[1].toLowerCase()}`, ratio: "16-9", title: "Vidéo Loom" } : null;
  }
  if (host === "ted.com") {
    const m = url.pathname.match(/^\/talks\/([a-z0-9_]{3,120})\/?$/i);
    return m ? { provider: "ted", src: `https://embed.ted.com/talks/${m[1]}`, ratio: "16-9", title: "Conférence TED" } : null;
  }
  return null;
}

module.exports = { parseVideoUrl, embedProvider };
