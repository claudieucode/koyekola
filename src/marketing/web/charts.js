// Graphiques SVG faits main (aucune dépendance) : barres verticales, accessibles (role="img" + aria-label récapitulatif).
// Toutes les valeurs affichées sont échappées ; aucune donnée n'est insérée comme code.
const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const W = 480;
const H = 180;
const TOP = 22; // place pour la valeur au-dessus de la barre
const BOTTOM = 26; // place pour le libellé
const MAX_LABELS = 10; // au-delà, un libellé par barre se chevauche (480px de large, ex. 30 jours) : on espace l'affichage
const num = (n) => Math.round(n * 100) / 100;

// Indices des barres qui reçoivent un libellé : toutes si peu nombreuses, sinon un espacement régulier, le dernier
// point toujours inclus — mais jamais collé à l'avant-dernier (sinon les deux derniers libellés se chevauchent).
function labeledIndices(n, maxLabels = MAX_LABELS) {
  if (n <= maxLabels) return new Set(Array.from({ length: n }, (_, i) => i));
  const stride = Math.ceil(n / maxLabels);
  const set = new Set();
  for (let i = 0; i < n; i += stride) set.add(i);
  const last = n - 1;
  const previous = Math.max(...set);
  if (last - previous < stride) set.delete(previous); // trop proche du dernier point : on le retire plutôt que d'empiler les deux
  set.add(last);
  return set;
}

// items : [{ label, count }] ; renvoie une chaîne <svg>
function barChart(items, { title = "" } = {}) {
  const list = Array.isArray(items) ? items : [];
  const max = Math.max(1, ...list.map((i) => Number(i.count) || 0));
  const plotH = H - TOP - BOTTOM;
  const slot = list.length ? W / list.length : W;
  const barW = Math.max(4, slot * 0.6);
  const summary = list.map((i) => `${i.label} ${Number(i.count) || 0}`).join(", ");
  const dense = list.length > MAX_LABELS; // beaucoup de barres : la valeur au-dessus de chacune se chevaucherait aussi
  const showLabel = labeledIndices(list.length);
  const bars = list
    .map((item, i) => {
      const count = Number(item.count) || 0;
      const h = num((count / max) * plotH);
      const x = num(i * slot + (slot - barW) / 2);
      const y = num(TOP + plotH - h);
      const cx = num(i * slot + slot / 2);
      // Le premier et le dernier libellé grandissent VERS L'INTÉRIEUR (depuis le bord de leur barre) plutôt que d'être
      // centrés : centré, un texte déborderait du viewBox sur les bords et serait rogné (silencieusement, sans erreur).
      const anchor = i === 0 ? { pos: "start", at: x } : i === list.length - 1 ? { pos: "end", at: num(x + barW) } : { pos: "middle", at: cx };
      return (
        // Une barre à zéro reste visible (3px, pas 1px) : à 1px elle se confondait avec le trait de l'axe (même
        // couleur), ce qui donnait l'impression que la semaine manquait plutôt que d'avoir compté zéro.
        `<rect class="mk-bar${count === 0 ? " is-zero" : ""}" x="${x}" y="${count === 0 ? num(TOP + plotH - 3) : y}" width="${num(barW)}" height="${count === 0 ? 3 : h}"></rect>` +
        (count > 0 && !dense ? `<text class="mk-chart-value" x="${anchor.at}" y="${num(y - 5)}" text-anchor="${anchor.pos}">${esc(count)}</text>` : "") +
        (showLabel.has(i) ? `<text class="mk-chart-label" x="${anchor.at}" y="${H - 8}" text-anchor="${anchor.pos}">${esc(item.label)}</text>` : "")
      );
    })
    .join("");
  return (
    `<svg class="mk-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)} : ${esc(summary)}" preserveAspectRatio="xMidYMid meet">` +
    `<line class="mk-chart-axis" x1="0" y1="${TOP + plotH}" x2="${W}" y2="${TOP + plotH}"></line>${bars}</svg>`
  );
}

// Histogramme en colonnes HTML (Analytics) : contrairement au SVG ci-dessus, dont tout — texte compris — rétrécit
// avec la largeur (un viewBox fixe), il s'étire sur toute la largeur disponible et garde un texte à taille réelle sur
// mobile. Une grille de --n colonnes égales ; la hauteur de chaque barre est un pourcentage de la plus haute.
// Valeur exacte en infobulle (title) et écrite au-dessus de chaque colonne non vide ; au-delà de COLS_DENSE colonnes,
// la figure porte is-dense et ces valeurs sont masquées sur petit écran seulement (colonnes trop étroites).
// Libellés espacés : 10 au plus sur grand écran ; ceux marqués is-minor sont masqués sur mobile (4 au plus restent).
const COLS_DENSE = 16;
function columnChart(items, { title = "", unit = "" } = {}) {
  const list = Array.isArray(items) ? items : [];
  const n = list.length;
  const max = Math.max(1, ...list.map((i) => Number(i.count) || 0));
  const summary = list.map((i) => `${i.label} ${Number(i.count) || 0}`).join(", ");
  const wide = labeledIndices(n, 10);
  // Mobile : un sous-ensemble des libellés de grand écran (jamais un libellé en plus, qui chevaucherait les autres)
  const wideList = [...wide].sort((x, y) => x - y);
  const narrow = new Set([...labeledIndices(wideList.length, 4)].map((j) => wideList[j]));
  const cols = list.map((item) => {
    const count = Number(item.count) || 0;
    const pct = num((count / max) * 100);
    return `<div class="mk-col${count === 0 ? " is-zero" : ""}" title="${esc(item.label)} : ${esc(count)}${esc(unit)}">` +
      (count > 0 ? `<span class="mk-col-value">${esc(count)}</span>` : "") +
      `<span class="mk-col-bar" style="height:${pct}%"></span></div>`;
  }).join("");
  const labels = list.map((item, i) => (wide.has(i)
    ? `<span class="mk-col-label${narrow.has(i) ? "" : " is-minor"}">${esc(item.label)}</span>`
    : `<span class="mk-col-label"></span>`)).join("");
  return `<figure class="mk-chart-cols${n > COLS_DENSE ? " is-dense" : ""}" role="img" aria-label="${esc(title)} : ${esc(summary)}" style="--n:${Math.max(1, n)}">` +
    `<div class="mk-cols-plot">${cols}</div><div class="mk-cols-axis" aria-hidden="true">${labels}</div></figure>`;
}

module.exports = { barChart, columnChart };
