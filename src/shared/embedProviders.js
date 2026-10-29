// Services dont le contenu peut être intégré dans un article (bloc « Contenu embarqué »), en plus de YouTube, Vimeo et Google Maps (src/utils/video.js, blogHtml.js).
// Règle de sécurité (identique pour tous) : l'adresse d'intégration est RECONSTRUITE à partir d'identifiants validés par une expression stricte ; l'adresse
// saisie n'est jamais recopiée. Un seul hôte de lecteur par service, en https. Une adresse qui ne correspond pas reste un simple lien.
// Module pur (aucune dépendance) : utilisé par le serveur (rendu) et par l'éditeur (reconnaissance d'une adresse collée).
//
// Retour : { provider, src, title, height? | ratio?, label } ou null.  height : px fixes ; ratio : "16-9" (cadre proportionnel).
const SANDBOX = "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-forms";
const seg = (p) => p.split("/").filter(Boolean);
const bare = (host) => host.toLowerCase().replace(/^(www|m|mobile)\./, "");
const enc = encodeURIComponent;

const PROVIDERS = [
  { id: "spotify", example: "https://open.spotify.com/track/…", keywords: "musique podcast son", label: "Spotify", hosts: ["open.spotify.com"], match: (u) => {
    const m = u.pathname.match(/^\/(?:intl-[a-z]{2}(?:-[a-z]{2})?\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]{10,30})\/?$/);
    return m ? { src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, height: ["track", "episode"].includes(m[1]) ? 152 : 352, title: "Lecteur Spotify" } : null;
  } },
  { id: "soundcloud", example: "https://soundcloud.com/artiste/titre", keywords: "musique podcast son", label: "SoundCloud", hosts: ["soundcloud.com"], match: (u) => {
    const m = u.pathname.match(/^\/([A-Za-z0-9_-]{2,50})\/((?:sets\/)?[A-Za-z0-9_-]{2,100})\/?$/);
    return m ? { src: `https://w.soundcloud.com/player/?url=${enc(`https://soundcloud.com/${m[1]}/${m[2]}`)}&visual=false&show_comments=false`, height: 166, title: "Lecteur SoundCloud" } : null;
  } },
  { id: "dailymotion", example: "https://www.dailymotion.com/video/…", keywords: "vidéo", label: "Dailymotion", hosts: ["dailymotion.com", "dai.ly"], match: (u, host) => {
    const id = host === "dai.ly" ? (u.pathname.match(/^\/([a-z0-9]{5,12})\/?$/i) || [])[1] : (u.pathname.match(/^\/(?:embed\/)?video\/([a-z0-9]{5,12})\/?$/i) || [])[1];
    return id ? { src: `https://www.dailymotion.com/embed/video/${id}`, ratio: "16-9", title: "Vidéo Dailymotion" } : null;
  } },
  { id: "loom", example: "https://www.loom.com/share/…", keywords: "vidéo écran démonstration", label: "Loom", hosts: ["loom.com"], match: (u) => {
    const m = u.pathname.match(/^\/(?:share|embed)\/([a-f0-9]{32})\/?$/i);
    return m ? { src: `https://www.loom.com/embed/${m[1].toLowerCase()}`, ratio: "16-9", title: "Vidéo Loom" } : null;
  } },
  { id: "ted", example: "https://www.ted.com/talks/…", keywords: "conférence vidéo", label: "TED", hosts: ["ted.com"], match: (u) => {
    const m = u.pathname.match(/^\/talks\/([a-z0-9_]{3,120})\/?$/i);
    return m ? { src: `https://embed.ted.com/talks/${m[1]}`, ratio: "16-9", title: "Conférence TED" } : null;
  } },
  { id: "twitter", example: "https://x.com/compte/status/…", keywords: "tweet publication réseau social x", label: "X (Twitter)", hosts: ["twitter.com", "x.com"], match: (u) => {
    const m = u.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d{5,25})\/?$/);
    return m ? { src: `https://platform.twitter.com/embed/Tweet.html?id=${m[2]}&dnt=true&lang=fr`, height: 520, title: "Publication X", sandbox: true } : null;
  } },
  { id: "instagram", example: "https://www.instagram.com/p/…", keywords: "photo reel réseau social", label: "Instagram", hosts: ["instagram.com"], match: (u) => {
    const m = u.pathname.match(/^\/(?:[A-Za-z0-9._]{1,30}\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]{5,20})\/?$/);
    return m ? { src: `https://www.instagram.com/${m[1] === "reels" ? "reel" : m[1]}/${m[2]}/embed/`, height: 640, title: "Publication Instagram", sandbox: true } : null;
  } },
  { id: "facebook", example: "https://www.facebook.com/page/posts/…", keywords: "publication réseau social", label: "Facebook", hosts: ["facebook.com", "fb.watch"], match: (u, host) => {
    if (host === "fb.watch") return null;
    const m = u.pathname.match(/^\/([A-Za-z0-9.\-_]{1,80})\/(posts|videos)\/([A-Za-z0-9_-]{5,60})\/?$/) || u.pathname.match(/^\/(reel)\/(\d{5,25})\/?$/);
    if (!m) return null;
    const path = m[1] === "reel" ? `/reel/${m[2]}/` : `/${m[1]}/${m[2]}/${m[3]}/`;
    const kind = m[1] === "reel" || m[2] === "videos" ? "video" : "post";
    return { src: `https://www.facebook.com/plugins/${kind}.php?href=${enc(`https://www.facebook.com${path}`)}&show_text=true&width=500`, height: kind === "video" ? 420 : 640, title: "Publication Facebook", sandbox: true };
  } },
  { id: "tiktok", example: "https://www.tiktok.com/@compte/video/…", keywords: "vidéo courte réseau social", label: "TikTok", hosts: ["tiktok.com"], match: (u) => {
    const m = u.pathname.match(/^\/@[A-Za-z0-9._]{1,40}\/video\/(\d{10,25})\/?$/);
    return m ? { src: `https://www.tiktok.com/embed/v2/${m[1]}`, height: 740, title: "Vidéo TikTok", sandbox: true } : null;
  } },
  { id: "pinterest", example: "https://www.pinterest.com/pin/…", keywords: "épingle image réseau social", label: "Pinterest", hosts: ["pinterest.com", "pinterest.fr", "pinterest.ca", "pinterest.co.uk"], match: (u) => {
    const m = u.pathname.match(/^\/pin\/(\d{5,25})\/?$/);
    return m ? { src: `https://assets.pinterest.com/ext/embed.html?id=${m[1]}`, height: 520, title: "Épingle Pinterest", sandbox: true } : null;
  } },
  { id: "reddit", example: "https://www.reddit.com/r/forum/comments/…", keywords: "discussion forum", label: "Reddit", hosts: ["reddit.com", "old.reddit.com"], match: (u) => {
    const m = u.pathname.match(/^\/r\/([A-Za-z0-9_]{2,25})\/comments\/([a-z0-9]{5,10})(?:\/([A-Za-z0-9_]{1,100}))?\/?$/);
    return m ? { src: `https://embed.reddit.com/r/${m[1]}/comments/${m[2]}/${m[3] ? `${m[3]}/` : ""}?embed=true&theme=light`, height: 480, title: "Discussion Reddit", sandbox: true } : null;
  } },
  { id: "imgur", example: "https://imgur.com/a/…", keywords: "image album", label: "Imgur", hosts: ["imgur.com"], match: (u) => {
    const m = u.pathname.match(/^\/(a|gallery)\/([A-Za-z0-9]{5,10})\/?$/) || u.pathname.match(/^\/()([A-Za-z0-9]{5,10})\/?$/);
    if (!m) return null;
    return { src: m[1] ? `https://imgur.com/a/${m[2]}/embed?pub=true` : `https://imgur.com/${m[2]}/embed?pub=true`, height: 520, title: "Album Imgur", sandbox: true };
  } },
  { id: "giphy", example: "https://giphy.com/gifs/…", keywords: "gif animation", label: "Giphy", hosts: ["giphy.com"], match: (u) => {
    const m = u.pathname.match(/^\/(?:gifs|embed)\/(?:[A-Za-z0-9-]*-)?([A-Za-z0-9]{8,24})\/?$/);
    return m ? { src: `https://giphy.com/embed/${m[1]}`, height: 400, title: "Animation Giphy", sandbox: true } : null;
  } },
  { id: "codepen", example: "https://codepen.io/auteur/pen/…", keywords: "code démo", label: "CodePen", hosts: ["codepen.io"], match: (u) => {
    const m = u.pathname.match(/^\/([A-Za-z0-9_-]{1,40})\/(?:pen|full|embed)\/([A-Za-z0-9]{5,12})\/?$/);
    return m ? { src: `https://codepen.io/${m[1]}/embed/${m[2]}?default-tab=result&theme-id=light`, height: 450, title: "Démo CodePen", sandbox: true } : null;
  } },
  { id: "mixcloud", example: "https://www.mixcloud.com/auteur/titre/", keywords: "musique dj mix", label: "Mixcloud", hosts: ["mixcloud.com"], match: (u) => {
    const m = u.pathname.match(/^\/([A-Za-z0-9_-]{2,60})\/([A-Za-z0-9_%.-]{2,120})\/?$/);
    return m ? { src: `https://www.mixcloud.com/widget/iframe/?feed=${enc(`/${m[1]}/${m[2]}/`)}&hide_cover=1&light=1`, height: 120, title: "Lecteur Mixcloud", sandbox: true } : null;
  } },
  { id: "scribd", example: "https://www.scribd.com/document/…", keywords: "document pdf lecture", label: "Scribd", hosts: ["scribd.com"], match: (u) => {
    const m = u.pathname.match(/^\/(?:document|doc|presentation)\/(\d{5,15})(?:\/[A-Za-z0-9_%.-]{1,150})?\/?$/);
    return m ? { src: `https://www.scribd.com/embeds/${m[1]}/content?view_mode=scroll`, height: 600, title: "Document Scribd", sandbox: true } : null;
  } },
  { id: "issuu", example: "https://issuu.com/editeur/docs/…", keywords: "magazine publication pdf", label: "Issuu", hosts: ["issuu.com"], match: (u) => {
    const m = u.pathname.match(/^\/([A-Za-z0-9_.-]{2,60})\/docs\/([A-Za-z0-9_.-]{2,120})\/?$/);
    return m ? { src: `https://e.issuu.com/embed.html?d=${enc(m[2])}&u=${enc(m[1])}`, height: 480, title: "Publication Issuu", sandbox: true } : null;
  } },
  { id: "kickstarter", example: "https://www.kickstarter.com/projects/…/…", keywords: "financement participatif", label: "Kickstarter", hosts: ["kickstarter.com"], match: (u) => {
    const m = u.pathname.match(/^\/projects\/([A-Za-z0-9_-]{1,60})\/([A-Za-z0-9_-]{1,120})\/?$/);
    return m ? { src: `https://www.kickstarter.com/projects/${m[1]}/${m[2]}/widget/video.html`, ratio: "16-9", title: "Projet Kickstarter", sandbox: true } : null;
  } },
  { id: "animoto", example: "https://animoto.com/play/…", keywords: "vidéo diaporama", label: "Animoto", hosts: ["animoto.com"], match: (u) => {
    const m = u.pathname.match(/^\/play\/([A-Za-z0-9]{10,40})\/?$/);
    return m ? { src: `https://animoto.com/play/${m[1]}`, ratio: "16-9", title: "Vidéo Animoto", sandbox: true } : null;
  } },
  { id: "pocketcasts", example: "https://pca.st/…", keywords: "podcast", label: "Pocket Casts", hosts: ["pca.st"], match: (u) => {
    const m = u.pathname.match(/^\/(?:episode\/)?([A-Za-z0-9-]{4,40})\/?$/);
    return m ? { src: `https://pca.st/embed/${m[1]}`, height: 180, title: "Épisode Pocket Casts", sandbox: true } : null;
  } },
  { id: "videopress", example: "https://videopress.com/v/…", keywords: "vidéo", label: "VideoPress", hosts: ["videopress.com", "video.wordpress.com"], match: (u) => {
    const m = u.pathname.match(/^\/(?:v|embed)\/([A-Za-z0-9]{8})\/?$/);
    return m ? { src: `https://video.wordpress.com/embed/${m[1]}`, ratio: "16-9", title: "Vidéo VideoPress", sandbox: true } : null;
  } },
  { id: "wistia", example: "https://marque.wistia.com/medias/…", keywords: "vidéo", label: "Wistia", hosts: ["wistia.com", "wistia.net"], match: (u, host) => {
    const m = u.pathname.match(/^\/(?:medias|embed\/iframe)\/([a-z0-9]{8,12})\/?$/);
    return m && (host === "wistia.com" || host.endsWith(".wistia.com") || host.endsWith(".wistia.net")) ? { src: `https://fast.wistia.net/embed/iframe/${m[1]}`, ratio: "16-9", title: "Vidéo Wistia", sandbox: true } : null;
  } },
  { id: "streamable", example: "https://streamable.com/…", keywords: "vidéo", label: "Streamable", hosts: ["streamable.com"], match: (u) => {
    const m = u.pathname.match(/^\/(?:e\/)?([a-z0-9]{4,10})\/?$/);
    return m ? { src: `https://streamable.com/e/${m[1]}`, ratio: "16-9", title: "Vidéo Streamable", sandbox: true } : null;
  } },
  { id: "applepodcasts", example: "https://podcasts.apple.com/fr/podcast/…/id…", keywords: "podcast", label: "Apple Podcasts", hosts: ["podcasts.apple.com"], match: (u) => {
    const m = u.pathname.match(/^\/([a-z]{2})\/podcast\/([A-Za-z0-9%._-]{1,120})\/(id\d{5,15})\/?$/);
    if (!m) return null;
    const ep = /^\d{5,15}$/.test(u.searchParams.get("i") || "") ? `?i=${u.searchParams.get("i")}` : "";
    return { src: `https://embed.podcasts.apple.com/${m[1]}/podcast/${m[2]}/${m[3]}${ep}`, height: ep ? 175 : 450, title: "Podcast Apple", sandbox: true };
  } },
  { id: "applemusic", example: "https://music.apple.com/fr/album/…/…", keywords: "musique album", label: "Apple Music", hosts: ["music.apple.com"], match: (u) => {
    const m = u.pathname.match(/^\/([a-z]{2})\/(album|playlist|song)\/([A-Za-z0-9%._-]{1,120})\/([A-Za-z0-9.]{5,40})\/?$/);
    if (!m) return null;
    const track = /^\d{5,15}$/.test(u.searchParams.get("i") || "") ? `?i=${u.searchParams.get("i")}` : "";
    return { src: `https://embed.music.apple.com/${m[1]}/${m[2]}/${m[3]}/${m[4]}${track}`, height: track ? 175 : 450, title: "Lecteur Apple Music", sandbox: true };
  } },
  { id: "deezer", example: "https://www.deezer.com/fr/track/…", keywords: "musique", label: "Deezer", hosts: ["deezer.com"], match: (u) => {
    const m = u.pathname.match(/^\/(?:[a-z]{2}\/)?(track|album|playlist|artist|episode|show)\/(\d{3,15})\/?$/);
    return m ? { src: `https://widget.deezer.com/widget/auto/${m[1]}/${m[2]}`, height: m[1] === "track" || m[1] === "episode" ? 150 : 350, title: "Lecteur Deezer", sandbox: true } : null;
  } },
  { id: "googledocs", example: "https://docs.google.com/document/d/e/…/pub", keywords: "document tableur présentation formulaire google docs sheets slides forms", label: "Google Docs, Sheets, Slides, Forms", hosts: ["docs.google.com"], match: (u) => {
    const m = u.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/e\/([A-Za-z0-9_-]{20,120})\/pub\/?$/);
    if (m) return { src: `https://docs.google.com/${m[1]}/d/e/${m[2]}/${m[1] === "presentation" ? "embed?start=false&loop=false" : "pub?embedded=true"}`, height: m[1] === "presentation" ? 480 : 600, title: "Document Google", sandbox: true };
    const f = u.pathname.match(/^\/forms\/d\/e\/([A-Za-z0-9_-]{20,120})\/viewform\/?$/);
    return f ? { src: `https://docs.google.com/forms/d/e/${f[1]}/viewform?embedded=true`, height: 700, title: "Formulaire Google", sandbox: true } : null;
  } },
];

const hostMatches = (p, host) => p.hosts.some((h) => host === h || host.endsWith(`.${h}`));

function embedProviderFor(raw) {
  let url;
  try { url = new URL(String(raw || "").trim()); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return null;
  const host = bare(url.hostname);
  for (const p of PROVIDERS) {
    if (!hostMatches(p, host)) continue;
    const r = p.match(url, host);
    if (r) return { provider: p.id, label: p.label, ...r, ...(r.sandbox ? { sandboxAttr: SANDBOX } : {}) };
  }
  return null;
}

module.exports = { PROVIDERS, SANDBOX, embedProviderFor };
