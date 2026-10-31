// Optimisation appliquée au HTML servi (programme 22.9) : l'image principale visible immédiatement ne doit pas être différée.
// Règle : première <img> du <main>, hors <header>/<nav>/<footer>, hors petites images déclarées (logo, avatar, icône, largeur ≤ 120) → on retire loading="lazy" et on ajoute fetchpriority="high".
// Aucune autre image n'est modifiée. Sans <main> ou sans candidat, le HTML est renvoyé tel quel.
const TOKEN = /<(\/?)(header|nav|footer|main)\b[^>]*>|<img\b[^>]*>/gi;
function prioritizeLcp(html) {
  const s = String(html);
  const start = s.search(/<main\b/i);
  if (start < 0) return { html: s, changed: false };
  TOKEN.lastIndex = start;
  let skip = 0, m;
  while ((m = TOKEN.exec(s))) {
    const tag = m[0];
    if (m[2]) { if (m[2].toLowerCase() !== "main") skip = Math.max(0, skip + (m[1] ? -1 : 1)); continue; }
    if (skip > 0) continue;
    const w = /\swidth\s*=\s*["']?(\d+)/i.exec(tag);
    if (/\sclass\s*=\s*["'][^"']*(logo|avatar|icon)/i.test(tag) || (w && Number(w[1]) <= 120)) continue;
    let next = tag.replace(/\sloading\s*=\s*(["'])lazy\1/i, "");
    if (!/\sfetchpriority\s*=/i.test(next)) next = next.replace(/\s*\/?>$/, (end) => ` fetchpriority="high"${end.trim() === "/>" ? " />" : ">"}`);
    if (next === tag) return { html: s, changed: false };
    return { html: s.slice(0, m.index) + next + s.slice(m.index + tag.length), changed: true, before: tag.slice(0, 200), after: next.slice(0, 200) };
  }
  return { html: s, changed: false };
}
module.exports = { prioritizeLcp };
