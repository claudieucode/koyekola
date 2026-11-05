// Laboratoire — institut de recherche fictif (Institut Mérel). Direction artistique : carnet de laboratoire / planche scientifique.
// Papier millimétré blanc cassé, encre noir-bleu, un seul signal (cyan électrique), repères et cotes visibles, numérotation « Fig. n »,
// graphiques SVG tracés à l'apparition avec réticule de lecture au survol, tableaux techniques, publications filtrables.
const { sec, esc } = require("../kit");

/* ---------- outils de dessin ---------- */
const r = (n) => Math.round(n * 10) / 10;
const fmt = (n) => String(r(n)).replace(".", ",");
const W = 600, H = 300, PX = 24, PT = 20, PB = 20, IH = H - PT - PB;
const smooth = (p) => {
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    d += `C${r(p1[0] + (p2[0] - p0[0]) / 6)} ${r(p1[1] + (p2[1] - p0[1]) / 6)} ${r(p2[0] - (p3[0] - p1[0]) / 6)} ${r(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]} ${p2[1]}`;
  }
  return d;
};
let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// Graphique interactif : courbes (line), histogramme (bars) ou nuage de points (scatter). Les valeurs sont lues par motion.js (data-s1…) pour le réticule et l'infobulle.
function chart(o) {
  const kind = o.kind || "line", min = o.min ?? 0, max = o.max, n = (o.xs || []).length;
  const Y = (v) => r(PT + IH - ((v - min) / (max - min)) * IH);
  const X = kind === "scatter" ? (v) => r(PX + ((v - o.xmin) / (o.xmax - o.xmin)) * (W - 2 * PX)) : (i) => r(PX + (n === 1 ? 0 : (i * (W - 2 * PX)) / (n - 1)));
  let g = "";
  for (let k = 0; k < 5; k++) g += `<line class="lb-gh" x1="0" y1="${r(PT + (k * IH) / 4)}" x2="${W}" y2="${r(PT + (k * IH) / 4)}"/>`;
  const xsN = kind === "scatter" ? 5 : n;
  for (let i = 0; i < xsN; i++) { const x = kind === "scatter" ? r(PX + (i * (W - 2 * PX)) / 4) : X(i); g += `<line class="lb-gv" x1="${x}" y1="${PT}" x2="${x}" y2="${H - PB}"/>`; }
  let ticks = ""; for (let x = 0; x <= W; x += 12) ticks += `M${x} ${H - PB}v${x % 60 === 0 ? 9 : 5}`;
  g += `<line class="lb-ax" x1="0" y1="${H - PB}" x2="${W}" y2="${H - PB}"/><path class="lb-tk lb-cote" d="${ticks}"/>`;
  let body = "", data = "", dots = "";
  (o.series || []).forEach((s, si) => {
    const cls = si === 0 ? "lb-c1" : "lb-c2";
    let pts;
    if (kind === "scatter") {
      pts = s.pts.map(([a, b]) => [X(a), Y(b)]);
      body += pts.map(([x, y]) => `<circle class="lb-sp" cx="${x}" cy="${y}" r="4.2"/>`).join("");
      if (o.line) body += `<line class="lb-c2 lb-draw" x1="${X(o.line[0][0])}" y1="${Y(o.line[0][1])}" x2="${X(o.line[1][0])}" y2="${Y(o.line[1][1])}"/>`;
      data += ` data-s${si + 1}="${esc(s.name)}~${s.pts.map(([a, b], i) => `Éch. ${i + 1} · x = ${fmt(a)}|${fmt(b)}|${pts[i][0]}|${pts[i][1]}`).join(";")}"`;
    } else {
      pts = s.vals.map((v, i) => [X(i), Y(v)]);
      if (kind === "bars") {
        const bw = Math.min(64, ((W - 2 * PX) / (n - 1)) * 0.58);
        body += pts.map(([x, y]) => `<rect class="lb-bar lb-draw" x="${r(x - bw / 2)}" y="${y}" width="${r(bw)}" height="${r(H - PB - y)}"/>`).join("");
      } else {
        if (si === 0 && o.area) body += `<path class="lb-area" d="${smooth(pts)}L${pts[pts.length - 1][0]} ${H - PB}L${pts[0][0]} ${H - PB}Z"/>`;
        body += `<path class="${cls}${si === 0 ? " lb-draw" : " lb-dash lb-fade"}" d="${smooth(pts)}"/>`;
        if (si === 0) body += pts.map(([x, y]) => `<circle class="lb-pt" cx="${x}" cy="${y}" r="3.2"/>`).join("");
      }
      data += ` data-s${si + 1}="${esc(s.name)}~${s.vals.map((v, i) => `${esc((o.xl || o.xs)[i])}|${fmt(v)}|${pts[i][0]}|${pts[i][1]}`).join(";")}"`;
    }
    dots += `<circle class="lb-dot lb-dot${si + 1}" r="5" cx="0" cy="0"/>`;
  });
  const ret = `<g class="lb-ret" aria-hidden="true"><line class="lb-rv" x1="0" y1="${PT}" x2="0" y2="${H - PB}"/><line class="lb-rh" x1="0" y1="0" x2="${W}" y2="0"/>${dots}</g>`;
  const yl = [0, 1, 2, 3, 4].map((k) => `<span>${fmt(min + ((max - min) * (4 - k)) / 4)}</span>`).join("");
  const xl = (o.xs || []).map((x) => `<span>${esc(x)}</span>`).join("");
  const alt = o.alt || o.title;
  return `<figure class="lb-fig${o.dark ? " lb-fig--dark" : ""}" data-draw>
  <div class="lb-fig-h"><b>Fig. ${o.n}</b><span>${esc(o.title)}</span><i class="lb-cote">${esc(o.tag || "")}</i></div>
  <div class="lb-chart" data-unit="${esc(o.unit || "")}" data-k="${kind === "scatter" ? "xy" : "x"}"${data}>
    <svg class="lb-plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(alt)}"><title>${esc(alt)}</title><g class="lb-g">${g}</g>${body}${ret}</svg>
    <div class="lb-yl" aria-hidden="true">${yl}</div><div class="lb-tip" aria-live="off"></div></div>
  <div class="lb-xl" aria-hidden="true">${xl}</div>
  <figcaption>${o.cap ? `<b>Fig. ${o.n}</b> — ${esc(o.cap)}` : ""}<small>${esc(o.unitLabel || "")}${o.src ? ` · ${esc(o.src)}` : ""} · Survolez ou utilisez les flèches du clavier pour lire une valeur.</small></figcaption></figure>`;
}

/* ---------- planches et schémas ---------- */
const frame = (inner, cls = "") => `<svg class="lb-sch ${cls}" viewBox="0 0 320 220" aria-hidden="true"><rect class="lb-sbg" x="0" y="0" width="320" height="220"/><g class="lb-sgrid"><path d="M0 44h320M0 88h320M0 132h320M0 176h320M64 0v220M128 0v220M192 0v220M256 0v220"/></g>${inner}<path class="lb-sm" d="M8 18V8h10M302 8h10v10M312 202v10h-10M18 212H8v-10"/></svg>`;
const arrow = (x1, y1, x2, y2) => `<line class="lb-ar" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><circle class="lb-sig" cx="${x2}" cy="${y2}" r="3.5"/>`;
const SCH = {
  cell: () => frame(`<ellipse class="lb-ln lb-draw lb-sigfill" cx="160" cy="112" rx="112" ry="78"/><ellipse class="lb-ln" cx="150" cy="106" rx="38" ry="34"/><circle class="lb-solid" cx="146" cy="104" r="11"/>
    <ellipse class="lb-ln" cx="228" cy="132" rx="20" ry="9" transform="rotate(-24 228 132)"/><ellipse class="lb-ln" cx="92" cy="140" rx="18" ry="8" transform="rotate(30 92 140)"/><ellipse class="lb-ln" cx="206" cy="68" rx="16" ry="7" transform="rotate(18 206 68)"/>
    <path class="lb-ln" d="M214 106c10 6 16 4 22 12M100 82c-10 4-14 12-12 22M170 160c6 6 16 8 26 4"/><circle class="lb-solid" cx="110" cy="64" r="3"/><circle class="lb-solid" cx="188" cy="152" r="3"/><circle class="lb-solid" cx="248" cy="96" r="3"/><circle class="lb-solid" cx="72" cy="112" r="3"/>
    ${arrow(146, 104, 262, 36)}<path class="lb-ln" d="M262 36h40"/>${arrow(228, 132, 276, 176)}<path class="lb-ln" d="M276 176h26"/><path class="lb-ln lb-cote" d="M48 200h112M48 194v12M160 194v12"/>`),
  orbit: () => frame(`<ellipse class="lb-ln lb-dash" cx="160" cy="110" rx="140" ry="70" transform="rotate(-18 160 110)"/><ellipse class="lb-ln lb-dash" cx="160" cy="110" rx="96" ry="46" transform="rotate(-18 160 110)"/><ellipse class="lb-ln lb-draw" cx="160" cy="110" rx="56" ry="26" transform="rotate(-18 160 110)"/>
    <circle class="lb-sig" cx="160" cy="110" r="14"/><circle class="lb-solid" cx="214" cy="94" r="5"/><circle class="lb-solid" cx="84" cy="146" r="7"/><circle class="lb-ln" cx="262" cy="64" r="9"/><path class="lb-ln" d="M40 190c60-4 120-40 170-84"/><circle class="lb-solid" cx="210" cy="106" r="2.5"/>
    <path class="lb-ln lb-cote" d="M160 110 262 64M160 196v14M120 203h80"/>${arrow(84, 146, 40, 190)}`),
  net: () => {
    const N = [[50, 60], [110, 40], [170, 70], [236, 44], [280, 96], [214, 130], [150, 118], [92, 112], [56, 160], [120, 176], [196, 182], [262, 168], [160, 28], [100, 84]];
    const E = [[0, 1], [1, 2], [2, 3], [3, 4], [2, 6], [6, 5], [5, 4], [6, 7], [7, 0], [7, 8], [8, 9], [9, 6], [9, 10], [10, 5], [10, 11], [11, 4], [1, 12], [12, 3], [13, 7], [13, 1], [13, 2]];
    return frame(E.map(([a, b]) => `<line class="lb-ln" x1="${N[a][0]}" y1="${N[a][1]}" x2="${N[b][0]}" y2="${N[b][1]}"/>`).join("") + `<path class="lb-ln lb-draw lb-sigline" d="M50 60 110 40 170 70 150 118 196 182 262 168"/>` + N.map(([x, y], i) => `<circle class="${[2, 6, 10].includes(i) ? "lb-sig" : "lb-node"}" cx="${x}" cy="${y}" r="${[2, 6, 10].includes(i) ? 9 : 6}"/>`).join(""));
  },
  spec: () => frame(`<path class="lb-ln" d="M20 170H300"/><path class="lb-ln lb-draw lb-sigline" d="M20 164c20-2 30 0 44-4s22-14 32-8 14 4 24-6 14-76 26-84 18 60 28 76 18 6 30 2 14-24 24-34 12-6 22 2 18 12 28 10 18-8 30-6 12 4 18 4"/>
    <path class="lb-ln lb-dash" d="M138 22V170M214 22V170"/><rect class="lb-band" x="138" y="22" width="76" height="148"/><path class="lb-ln lb-cote" d="M138 190h76M138 184v12M214 184v12"/>${arrow(146, 70, 96, 40)}<path class="lb-ln" d="M96 40H40"/>`),
};
const PLATE = {
  a: () => frame(`<rect class="lb-ln" x="40" y="120" width="130" height="64"/><path class="lb-ln" d="M170 138h60v28h-60"/><rect class="lb-solid" x="230" y="132" width="40" height="40"/><path class="lb-ln lb-draw lb-sigline" d="M40 152H12M120 120V60M120 60l-22-14M120 60l22-14"/><path class="lb-ln" d="M98 46h44l-8-26H106z"/><circle class="lb-sig" cx="120" cy="100" r="6"/><path class="lb-ln lb-dash" d="M120 106v14"/><rect class="lb-ln" x="76" y="132" width="88" height="14"/>`),
  b: () => frame(`<rect class="lb-solid" x="18" y="100" width="50" height="36"/><path class="lb-ln lb-draw lb-sigline" d="M68 118H134"/><polygon class="lb-ln lb-sigfill" points="134,86 178,118 134,150"/><path class="lb-ln" d="M178 118 250 56M178 118 258 90M178 118 262 124M178 118 250 160M178 118 238 192"/><rect class="lb-ln" x="258" y="40" width="30" height="170"/><circle class="lb-sig" cx="273" cy="90" r="5"/>`),
  c: () => frame(`<path class="lb-ln" d="M50 24h220M70 66h180M92 108h136M114 148h92M136 184h48"/><path class="lb-ln" d="M110 24v42M210 24v42M120 66v42M200 66v42M130 108v40M190 108v40M146 148v36M174 148v36"/><circle class="lb-ln" cx="160" cy="203" r="10"/><circle class="lb-sig" cx="160" cy="203" r="5"/><path class="lb-ln lb-cote" d="M284 24v180M278 24h12M278 204h12"/><path class="lb-ln lb-draw lb-sigline" d="M20 24h30M20 204h116"/>`),
  d: () => frame([0, 1, 2, 3].map((i) => `<rect class="lb-ln${i === 1 ? " lb-sigfill" : ""}" x="${28 + i * 66}" y="40" width="54" height="130"/>${[0, 1, 2, 3, 4].map((k) => `<path class="lb-ln" d="M${36 + i * 66} ${58 + k * 22}h38"/><circle class="${(i + k) % 4 === 0 ? "lb-sig" : "lb-node"}" cx="${86 + i * 66 - 4}" cy="${58 + k * 22}" r="2.6"/>`).join("")}`).join("") + `<path class="lb-ln lb-draw lb-sigline" d="M55 170v24h210v-24"/>`),
};
const AREAS = { bio: ["Biophysique", "c"], astro: ["Astrophysique", "t"], res: ["Réseaux & données", "s"], spec: ["Matériaux", "d"] };
const dom = (k) => `<span class="lb-dm"><i class="lb-dm-${AREAS[k][1]}"></i>${AREAS[k][0]}</span>`;

/* portraits stylisés du trombinoscope */
const portrait = (i) => {
  const bg = ["lb-p-sig", "lb-p-ink", "lb-p-pap"][i % 3], hair = [
    `<path class="lb-solid" d="M38 54c0-22 12-32 24-32s24 10 24 32c-6-10-14-14-24-14s-18 4-24 14z"/>`,
    `<path class="lb-solid" d="M34 62c-4-30 10-42 28-42s34 12 26 44c-2-16-10-24-26-24S38 46 34 62z"/>`,
    `<path class="lb-solid" d="M38 50c4-18 14-24 24-24s20 6 24 24c-8-8-16-10-24-10s-16 2-24 10z"/>`,
    `<path class="lb-solid" d="M36 56c-2-24 8-36 26-36 16 0 28 12 24 36-2-12-8-18-12-20-10 4-26 4-38 20z"/>`,
  ][i % 4];
  const glasses = i % 3 !== 1 ? `<path class="lb-ln2" d="M44 60h14M66 60h14M58 60h8"/><rect class="lb-ln2" x="42" y="54" width="18" height="12"/><rect class="lb-ln2" x="64" y="54" width="18" height="12"/>` : "";
  return `<svg class="lb-por ${bg}" viewBox="0 0 124 144" aria-hidden="true"><rect class="lb-pbg" width="124" height="144"/><path class="lb-pg" d="M0 36h124M0 72h124M0 108h124M31 0v144M62 0v144M93 0v144"/>
  <path class="lb-body" d="M8 144c0-34 20-48 54-48s54 14 54 48z"/><path class="lb-neck" d="M52 82h20v18l-10 8-10-8z"/><ellipse class="lb-head" cx="62" cy="58" rx="${22 + (i % 2) * 2}" ry="26"/>${hair}${glasses}
  <path class="lb-ln2" d="M52 76q10 6 20 0"/><path class="lb-cross" d="M62 4v10M62 130v10M4 72h10M110 72h10"/></svg>`;
};

/* ---------- gabarits communs ---------- */
const MARK = `<svg class="lb-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 25V8l9 12 9-12v17" fill="none" stroke="currentColor" stroke-width="2.4"/><circle class="lb-sigfill" cx="16" cy="20" r="3"/></svg>`;
const ARW = `<svg class="lb-arw" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>`;
const LENS = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="m15 15 6 6" stroke="currentColor" stroke-width="2.4"/></svg>`;
const tabs = (menu) => menu.map(({ label, url }, i) => `<a href="${esc(url)}"><i>${String(i + 1).padStart(2, "0")}</i><span>${esc(label)}</span></a>`).join("");

const header = (c) => `<header class="lb-head pk-bleed">
  <div class="lb-meta lb-cote"><span>45.7640° N · 4.8357° E</span><span>Réf. IMR/2026-11</span><span>v2.0 · rév. 04.11.2026</span><span class="lb-live"><u></u>Instruments en ligne</span></div>
  <div class="lb-bar"><a class="lb-logo" href="/" aria-label="${esc(c.brand)} — accueil">${MARK}<span><b>Institut Mérel</b><small>Recherche fondamentale</small></span></a>
    <div class="lb-tabs" role="navigation" aria-label="Navigation principale">${tabs(c.menu)}</div>
    <a class="lb-find" href="/recherche" aria-label="Rechercher sur le site">${LENS}</a>
    <details class="lb-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="lb-drawer" role="navigation" aria-label="Menu mobile">${tabs(c.menu)}<a class="lb-btn" href="/recherche">Rechercher sur le site</a></div></details>
  </div></header>`;

const footer = (c) => `<footer class="lb-foot pk-bleed"><div class="lb-wrap">
  <div class="lb-foot-top"><div class="lb-foot-mark">${MARK}<span>Institut Mérel</span></div><p class="lb-foot-lead">Comprendre en mesurant. Publier ce qui est vérifié, ouvrir ce qui peut l'être.</p></div>
  <div class="lb-foot-grid"><div><h2 class="lb-fh">Adresse</h2><p>8 allée Rosalind-Hervé<br>69000 Lyon<br><a href="mailto:contact@institut-merel.example">contact@institut-merel.example</a></p></div>
  <div><h2 class="lb-fh">Institut</h2><a class="lb-fl" href="/axes">Axes de recherche</a><a class="lb-fl" href="/equipe">Équipes</a><a class="lb-fl" href="/instruments">Instruments</a></div>
  <div><h2 class="lb-fh">Ressources</h2><a class="lb-fl" href="/publications">Publications</a><a class="lb-fl" href="/donnees">Données ouvertes</a><a class="lb-fl" href="/recherche">Recherche</a></div>
  <div><h2 class="lb-fh">Contact</h2><a class="lb-fl" href="/contact">Écrire à l'institut</a><a class="lb-fl" href="/contact">Presse</a><a class="lb-fl" href="/contact">Candidatures</a></div></div>
  <p class="lb-legal">© Institut Mérel — site de démonstration. Équipes, publications, mesures et jeux de données sont fictifs. <span class="lb-cote">45.7640° N · 4.8357° E · échelle 1 : 1</span></p></div></footer>`;

const deco = (k) => `<svg class="lb-deco lb-cote" viewBox="0 0 200 200" aria-hidden="true"><circle class="lb-ln" cx="100" cy="100" r="90"/><circle class="lb-ln" cx="100" cy="100" r="60"/><circle class="lb-ln" cx="100" cy="100" r="30"/><path class="lb-ln" d="M100 0v200M0 100h200"/><path class="lb-ln lb-draw lb-sigline" d="${["M10 140c30-70 50 30 80-30s60 20 100-40", "M10 120c40 40 60-60 90-20s60 40 90-30", "M10 100c30-40 40 50 80 10s70-60 100-10", "M10 150c50-20 40-80 90-60s60 40 90-10", "M10 90c40 10 50 60 90 30s50-60 90-20", "M10 130c40-10 50-50 90-30s60 50 90-10"][k % 6]}"/><circle class="lb-sig" cx="100" cy="100" r="5"/></svg>`;
const pagehead = (no, kicker, title, sub, k = 0) => sec(`<section class="lb-ph pk-bleed"><div class="lb-wrap lb-ph-in"><div class="lb-ph-copy"><p class="lb-kicker" data-reveal><i></i>§ ${no} · ${esc(kicker)}</p><div class="lb-title" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="lb-sub" data-reveal>${esc(sub)}</p>` : ""}</div>${deco(k)}</div></section>`);
const sh = (no, title, more) => `<header class="lb-sh"><span class="lb-no">§ ${no}</span><h2 data-reveal>${title}</h2>${more ? `<a class="lb-more" href="${more[1]}">${more[0]} ${ARW}</a>` : ""}</header>`;
const cite = (a, y, t, j, ref) => `<details class="lb-cite"><summary>Citer cet article</summary><div class="lb-cite-b"><p class="lb-cite-t">${esc(a)} (${y}). ${esc(t)}. ${esc(j)}. Réf. ${ref}.</p><a class="lb-copy" href="#copier" data-copy>Copier la référence</a></div></details>`;

/* ---------- données de démonstration ---------- */
const PUBS = [
  ["IMR-2026-003", 2026, "bio", "Dynamique de l'actine corticale lors de la division asymétrique", "Roche A., Benali L.", "Revue de biophysique cellulaire, 41(2), 88–104"],
  ["IMR-2026-007", 2026, "spec", "Conductivité thermique de films de nitrure mesurée à 20 mK", "Ferreira T., Carpentier Y.", "Matériaux et basses températures, 18(1), 12–27"],
  ["IMR-2026-011", 2026, "res", "Inférence de réseaux de régulation à partir de séries clairsemées", "Dufour N., Marchand I.", "Journal de l'analyse de données, 9(3), 201–219"],
  ["IMR-2025-004", 2025, "astro", "Résonances orbitales dans un disque de débris jeune", "Haddad K., Lemaire H.", "Annales d'astrophysique, 62(4), 455–471"],
  ["IMR-2025-009", 2025, "bio", "Segmentation de cellules en microscopie à feuillet de lumière", "Benali L., Dufour N.", "Imagerie du vivant, 27(2), 66–80"],
  ["IMR-2025-014", 2025, "spec", "Pics Raman anormaux dans des hétérostructures bidimensionnelles", "Ferreira T., Haddad K.", "Spectroscopie appliquée, 33(6), 301–314"],
  ["IMR-2025-018", 2025, "res", "Détection de communautés dans des graphes dynamiques de grande taille", "Marchand I., Lemaire H.", "Journal de l'analyse de données, 8(2), 90–112"],
  ["IMR-2024-002", 2024, "astro", "Rotation d'astéroïdes : catalogue de 2 400 courbes de lumière", "Haddad K., Roche A.", "Annales d'astrophysique, 61(1), 14–33"],
  ["IMR-2024-010", 2024, "bio", "Gradients de calcium et propagation d'ondes dans un épithélium", "Roche A., Dufour N.", "Revue de biophysique cellulaire, 39(5), 310–329"],
  ["IMR-2024-015", 2024, "spec", "Excitons ultrarapides dans des pérovskites hybrides", "Ferreira T., Carpentier Y.", "Spectroscopie appliquée, 31(3), 150–166"],
  ["IMR-2023-005", 2023, "res", "Compression à perte contrôlée pour séries d'instruments", "Marchand I., Carpentier Y.", "Journal de l'analyse de données, 7(4), 233–250"],
  ["IMR-2023-012", 2023, "astro", "Masse d'exoplanètes par vitesses radiales corrigées", "Lemaire H., Haddad K.", "Annales d'astrophysique, 60(3), 211–228"],
  ["IMR-2022-006", 2022, "bio", "Forces intracellulaires mesurées par pinces optiques", "Benali L., Roche A.", "Revue de biophysique cellulaire, 36(2), 71–85"],
];
const YEARS = [2026, 2025, 2024, 2023, 2022];
const pubRow = ([ref, y, d, t, a, j]) => `<article class="lb-pub" data-item data-year="${y}" data-dom="${d}"><div class="lb-pub-ref"><b>${y}</b><span>${ref}</span></div>
  <div class="lb-pub-main"><h3>${esc(t)}</h3><p class="lb-au">${esc(a)}</p><p class="lb-jr">${esc(j)}</p>${cite(a, y, t, j, ref)}</div><div class="lb-pub-tag">${dom(d)}</div></article>`;

const members = [
  ["Amélie Roche", "Directrice de l'institut", "bio", "IMR-0101"], ["Karim Haddad", "Responsable de l'axe astrophysique", "astro", "IMR-0114"], ["Inès Marchand", "Cheffe d'équipe réseaux", "res", "IMR-0127"], ["Tomás Ferreira", "Chercheur, spectroscopie", "spec", "IMR-0133"],
  ["Léa Benali", "Chargée de recherche", "bio", "IMR-0148"], ["Yanis Carpentier", "Ingénieur instrumentation", "spec", "IMR-0152"], ["Noémie Dufour", "Data scientist", "res", "IMR-0166"], ["Hugo Lemaire", "Doctorant, mécanique céleste", "astro", "IMR-0179"],
];
const person = ([n, role, d, id], i) => `<article class="lb-person" data-item data-team="${d}" data-reveal>${portrait(i)}<div class="lb-pid"><span class="lb-cote">${id}</span><h3>${esc(n)}</h3><p>${esc(role)}</p>${dom(d)}</div></article>`;

const INSTR = [
  ["LSM-1", "Microscope à feuillet de lumière", "Biophysique", "0,3 µm", "488–640 nm", "ok", "Y. Carpentier"], ["RAM-2", "Spectromètre Raman confocal", "Matériaux", "0,5 cm⁻¹", "200–3 500 cm⁻¹", "res", "T. Ferreira"],
  ["CRY-3", "Cryostat à dilution", "Matériaux", "10 mK", "10 mK–4 K", "ok", "T. Ferreira"], ["TEL-4", "Télescope robotisé de 0,8 m", "Astrophysique", "0,9″", "380–950 nm", "ok", "K. Haddad"],
  ["HPC-5", "Grappe de calcul", "Données", "1,2 Pflops", "8 192 cœurs", "ok", "N. Dufour"], ["OPT-6", "Pinces optiques", "Biophysique", "0,1 pN", "0,1–200 pN", "mnt", "L. Benali"],
  ["SPE-7", "Spectrographe à échelle", "Astrophysique", "R = 80 000", "420–900 nm", "res", "H. Lemaire"], ["XRD-8", "Diffractomètre à rayons X", "Matériaux", "0,002°", "5–150°", "ok", "Y. Carpentier"],
];
const STATUS = { ok: "Disponible", res: "Réservé", mnt: "En maintenance" };

const spec = (cap, rows) => `<table class="lb-spec"><caption>${esc(cap)}</caption><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table>`;

const time = () => `<ol class="lb-time">${[
  ["2024 · T1", "Cahier des charges", "Objectifs de mesure et financement validés.", "done"], ["2024 · T4", "Banc d'essai", "Trois instruments alignés sur un même étalon.", "done"], ["2025 · T3", "Première campagne", "412 séries de mesures acquises.", "done"],
  ["2026 · T4", "Fusion des données", "Recalage multi-instruments en cours.", "now"], ["2027 · T2", "Ouverture v1", "Premier jeu de données public.", "next"], ["2028 · T1", "Bilan", "Publication finale et archivage.", "next"],
].map(([d, t, x, s]) => `<li class="is-${s}" data-reveal><span class="lb-tm" aria-hidden="true"></span><time>${d}</time><h3>${t}</h3><p>${x}</p><em>${s === "done" ? "Terminé" : s === "now" ? "En cours" : "À venir"}</em></li>`).join("")}</ol>`;

/* ---------- pages ---------- */
const heroChart = chart({ n: 1, title: "Intensité de fluorescence, échantillon 07", tag: "n = 9 · pas 5 min", dark: true, kind: "line", xs: ["0", "5", "10", "15", "20", "25", "30", "35", "40"], xl: ["t = 0 min", "t = 5 min", "t = 10 min", "t = 15 min", "t = 20 min", "t = 25 min", "t = 30 min", "t = 35 min", "t = 40 min"], min: 0, max: 60, unit: "u.a.", area: true,
  series: [{ name: "Signal mesuré", vals: [4, 7, 15, 34, 52, 41, 28, 17, 12] }, { name: "Modèle", vals: [3, 8, 17, 31, 49, 43, 27, 18, 11] }], cap: "Pic d'intensité à t = 20 min ; l'écart entre mesure et modèle reste inférieur à 4 %.", unitLabel: "Unités arbitraires (u.a.) selon le temps en minutes", src: "données de démonstration", alt: "Courbes d'intensité de fluorescence en fonction du temps : signal mesuré et modèle, pic à 20 minutes" });

const scatterPts = (() => { const p = []; for (let i = 0; i < 26; i++) { const x = 0.4 + (i * 9.2) / 25 + (rnd() - 0.5) * 0.5; p.push([r(x), r(Math.max(2, 8 + 5.2 * x + (rnd() - 0.5) * 17))]); } return p; })();
const scatterChart = chart({ n: 2, title: "Réponse en fonction de la dose", tag: "n = 26 échantillons", kind: "scatter", xmin: 0, xmax: 10, xs: ["0", "2,5", "5", "7,5", "10"], min: 0, max: 70, unit: "u.a.", series: [{ name: "Réponse", pts: scatterPts }], line: [[0, 8], [10, 60]], cap: "Réponse quasi linéaire jusqu'à 10 unités de dose (droite de régression en trait fin).", unitLabel: "Réponse (u.a.) selon la dose (u.)", src: "données de démonstration", alt: "Nuage de 26 points montrant une réponse croissante avec la dose, avec droite de régression" });

const home = (c) => [
  sec(header(c)),
  sec(`<section class="lb-hero pk-bleed"><div class="lb-hero-in">
    <div class="lb-hero-copy"><p class="lb-kicker" data-reveal><i></i>Institut de recherche · fondé en 1987</p>
      <div class="lb-h1" role="heading" aria-level="1" data-reveal>Mesurer ce qui échappe encore à <mark>l'œil nu</mark>.</div>
      <p class="lb-lead" data-reveal>Quatre axes, vingt-trois instruments et un principe : chaque résultat est publié avec ses données. Biophysique, astrophysique, réseaux et matériaux sous un même toit.</p>
      <div class="lb-actions" data-reveal><a class="lb-btn" href="/publications">Lire les publications ${ARW}</a><a class="lb-btn lb-btn--line" href="/donnees">Jeux de données ouverts</a></div></div>
    <div class="lb-hero-fig" data-reveal>${heroChart}<p class="lb-xy lb-cote" aria-hidden="true">X 0.000 · Y 0.000</p></div>
    <ul class="lb-keys" aria-label="Chiffres clés">${[["138", "chercheurs et ingénieurs", "138"], ["412", "publications évaluées", "412"], ["23", "instruments partagés", "23"], ["64", "jeux de données ouverts", "64"]].map(([v, l]) => `<li data-reveal><b data-count="${v}">${v}</b><span>${l}</span></li>`).join("")}</ul>
  </div></section>`),
  sec(`<section class="lb-sec pk-bleed"><div class="lb-wrap">${sh("01", "Quatre axes de recherche", ["Tous les axes", "/axes"])}
    <div class="lb-axes">${[["A", "Biophysique cellulaire", "Forces, ondes et transport à l'échelle de la cellule vivante.", "cell", "/axes", "bio"], ["B", "Astrophysique et orbites", "Dynamique de petits corps, disques et exoplanètes.", "orbit", "/axes", "astro"], ["C", "Réseaux et données", "Graphes, inférence et compression des séries d'instruments.", "net", "/axes", "res"], ["D", "Matériaux et spectroscopie", "Mesures à très basse température et réponses optiques.", "spec", "/axes", "spec"]].map(([l, t, x, k, u]) => `<a class="lb-axcard" href="${u}" data-reveal>${SCH[k]()}<span class="lb-axl">Axe ${l}</span><h3>${t}</h3><p>${x}</p><span class="lb-go">Explorer ${ARW}</span></a>`).join("")}</div></div></section>`),
  sec(`<section class="lb-sec lb-sec--tint pk-bleed" data-scope><div class="lb-wrap">${sh("02", "Dernières publications", ["Toutes les publications", "/publications"])}
    <div class="lb-publist">${PUBS.slice(0, 3).map(pubRow).join("")}</div></div></section>`),
  sec(`<section class="lb-sec pk-bleed"><div class="lb-wrap lb-split"><div class="lb-split-t"><span class="lb-no" data-reveal>§ 03</span><h2 data-reveal>Figure du mois</h2><p data-reveal>Une relation dose-réponse mesurée sur vingt-six échantillons indépendants. Passez le curseur sur les points : le réticule lit la valeur exacte, comme sur la paillasse.</p>
      <ul class="lb-facts" data-reveal><li><b>R² = 0,94</b><span>qualité de l'ajustement linéaire</span></li><li><b>± 3,1 u.a.</b><span>incertitude moyenne par point</span></li></ul>
      <div data-reveal>${cite("Roche A., Benali L.", 2026, "Dynamique de l'actine corticale lors de la division asymétrique", "Revue de biophysique cellulaire, 41(2), 88–104", "IMR-2026-003")}</div></div>
    <div data-reveal>${scatterChart}</div></div></section>`),
  sec(`<section class="lb-sec lb-sec--dark pk-bleed"><div class="lb-wrap">${sh("04", "Plateformes et instruments", ["Tous les instruments", "/instruments"])}
    <ul class="lb-irows">${INSTR.slice(0, 4).map(([id, n, d, res, plage, st]) => `<li data-reveal><b class="lb-iid">${id}</b><span class="lb-in">${n}</span><span class="lb-ir"><em>Résolution</em>${res}</span><span class="lb-ir"><em>Plage</em>${plage}</span><span class="lb-st lb-st--${st}">${STATUS[st]}</span></li>`).join("")}</ul></div></section>`),
  sec(`<section class="lb-sec pk-bleed"><div class="lb-wrap">${sh("05", "Projet MÉRIDIEN, 2024–2028")}<p class="lb-intro" data-reveal>Cartographier un même objet avec trois instruments à la fois, puis ouvrir l'ensemble des mesures au public.</p>${time()}</div></section>`),
  sec(`<section class="lb-cta pk-bleed"><div class="lb-wrap lb-cta-in"><h2 data-reveal>Les données appartiennent à ceux qui les vérifient.</h2><div data-reveal><p>Soixante-quatre jeux de données décrits, versionnés et prêts à citer.</p><a class="lb-btn" href="/donnees">Explorer les données ${ARW}</a></div></div></section>`),
  sec(footer(c)),
];

const AX = [
  ["A", "Biophysique cellulaire", "cell", "Comment une cellule décide-t-elle de se diviser, de bouger, de se déformer ? Nous mesurons des forces de quelques piconewtons et suivons des ondes de calcium en temps réel.", [["Équipes", "2"], ["Projets", "7"], ["Chercheurs", "31"]], ["LSM-1", "OPT-6"], "bio"],
  ["B", "Astrophysique et orbites", "orbit", "Petits corps, disques de débris et exoplanètes : nous reconstruisons des trajectoires à partir de milliers de courbes de lumière et de vitesses radiales.", [["Équipes", "2"], ["Projets", "5"], ["Chercheurs", "27"]], ["TEL-4", "SPE-7"], "astro"],
  ["C", "Réseaux et données", "net", "Inférer des interactions à partir de séries clairsemées, détecter des communautés, compresser sans fausser : la statistique au service de l'instrument.", [["Équipes", "1"], ["Projets", "6"], ["Chercheurs", "24"]], ["HPC-5"], "res"],
  ["D", "Matériaux et spectroscopie", "spec", "À 10 millikelvins, la matière révèle des comportements invisibles à température ambiante. Raman, rayons X et cryogénie se répondent.", [["Équipes", "2"], ["Projets", "8"], ["Chercheurs", "35"]], ["RAM-2", "CRY-3", "XRD-8"], "spec"],
];
const axes = (c) => [
  sec(header(c)), pagehead("02", "Axes de recherche", "Quatre questions,<br>un même <mark>protocole</mark>.", "Chaque axe publie ses méthodes, ses incertitudes et ses données.", 1),
  sec(`<section class="lb-sec pk-bleed"><div class="lb-wrap">${AX.map(([l, t, k, x, st, ins, d], i) => `<article class="lb-axis${i % 2 ? " lb-axis--r" : ""}"><figure class="lb-plate" data-reveal data-draw><div class="lb-fig-h"><b>Fig. ${i + 1}</b><span>Schéma de l'axe ${l}</span><i class="lb-cote">éch. 1 : 1</i></div>${SCH[k]()}<figcaption><b>Fig. ${i + 1}</b> — ${t} : schéma de principe annoté.</figcaption></figure>
      <div class="lb-axis-t"><span class="lb-axl" data-reveal>Axe ${l}</span><h2 data-reveal>${t}</h2><p data-reveal>${x}</p>
      <ul class="lb-facts lb-facts--3" data-reveal>${st.map(([a, b]) => `<li><b>${b}</b><span>${a}</span></li>`).join("")}</ul>
      <p class="lb-ins" data-reveal><em>Instruments</em>${ins.map((s) => `<a href="/instruments">${s}</a>`).join("")}</p><a class="lb-more" href="/publications" data-reveal>Publications de l'axe ${ARW}</a></div></article>`).join("")}</div></section>`),
  sec(`<section class="lb-sec lb-sec--tint pk-bleed"><div class="lb-wrap">${sh("03", "Projet MÉRIDIEN, 2024–2028")}${time()}</div></section>`),
  sec(`<section class="lb-sec pk-bleed"><div class="lb-wrap">${sh("04", "Les axes en chiffres")}
    <table class="lb-tbl lb-tbl--axes" data-reveal><caption class="lb-sr">Tableau comparatif des quatre axes de recherche</caption><thead><tr><th>Axe</th><th>Équipes</th><th>Projets actifs</th><th>Chercheurs</th><th>Publications 2025</th></tr></thead><tbody>${AX.map(([l, t, , , st], i) => `<tr><td data-label="Axe"><b>${l}</b> ${t}</td><td data-label="Équipes">${st[0][1]}</td><td data-label="Projets actifs">${st[1][1]}</td><td data-label="Chercheurs">${st[2][1]}</td><td data-label="Publications 2025">${[41, 36, 52, 47][i]}</td></tr>`).join("")}</tbody></table></div></section>`),
  sec(footer(c)),
];

const barChart = chart({ n: 3, title: "Publications évaluées par année", tag: "sélection de démonstration", kind: "bars", xs: YEARS.slice().reverse().map((y) => "’" + String(y).slice(2)), xl: YEARS.slice().reverse().map(String), min: 0, max: 5, unit: "articles", series: [{ name: "Articles", vals: YEARS.slice().reverse().map((y) => PUBS.filter((p) => p[1] === y).length) }], cap: "Nombre d'articles de la sélection ci-dessous, par année de parution.", unitLabel: "Articles par année", src: "sélection de démonstration", alt: "Histogramme du nombre d'articles par année, de 2022 à 2026" });
const publications = (c) => [
  sec(header(c)), pagehead("03", "Publications", "Ce que nous avons<br><mark>établi</mark>.", "Une sélection de treize articles évalués par les pairs, filtrable par année et par domaine.", 2),
  sec(`<section class="lb-sec pk-bleed" data-scope><div class="lb-wrap lb-pubs">
    <aside class="lb-side"><div class="lb-filters" data-filters aria-label="Filtres"><p class="lb-fl-t">Année</p><div class="lb-chips"><a href="#toutes" data-fk="year" data-fv="all" class="is-on" role="button" aria-pressed="true">Toutes</a>${YEARS.map((y) => `<a href="#a${y}" data-fk="year" data-fv="${y}" role="button" aria-pressed="false">${y}</a>`).join("")}</div>
      <p class="lb-fl-t">Domaine</p><div class="lb-chips"><a href="#tous" data-fk="dom" data-fv="all" class="is-on" role="button" aria-pressed="true">Tous</a>${Object.entries(AREAS).map(([k, [n, s]]) => `<a href="#d-${k}" data-fk="dom" data-fv="${k}" role="button" aria-pressed="false"><i class="lb-dm-${s}"></i>${n}</a>`).join("")}</div></div>
      <div class="lb-side-fig" data-reveal>${barChart}</div></aside>
    <div class="lb-pubcol"><p class="lb-count" aria-live="polite">${PUBS.length} résultats</p><div class="lb-publist">${PUBS.map(pubRow).join("")}</div><p class="lb-empty" data-empty hidden>Aucune publication ne correspond à ces filtres. Choisissez « Toutes » ou « Tous ».</p></div></div></section>`),
  sec(footer(c)),
];

const equipe = (c) => [
  sec(header(c)), pagehead("04", "Équipes", "Les personnes<br>derrière les <mark>mesures</mark>.", "Chercheuses, ingénieurs et doctorants (fictifs) répartis en quatre équipes.", 3),
  sec(`<section class="lb-sec pk-bleed" data-scope><div class="lb-wrap"><div class="lb-filters lb-filters--row" data-filters aria-label="Filtrer par équipe"><p class="lb-fl-t">Équipe</p><div class="lb-chips"><a href="#toutes" data-fk="team" data-fv="all" class="is-on" role="button" aria-pressed="true">Toutes</a>${Object.entries(AREAS).map(([k, [n, s]]) => `<a href="#e-${k}" data-fk="team" data-fv="${k}" role="button" aria-pressed="false"><i class="lb-dm-${s}"></i>${n}</a>`).join("")}</div></div>
    <p class="lb-count" aria-live="polite">${members.length} personnes</p><div class="lb-team">${members.map(person).join("")}</div></div></section>`),
  sec(`<section class="lb-sec lb-sec--dark pk-bleed"><div class="lb-wrap lb-split"><div class="lb-split-t"><span class="lb-no">§ 02</span><h2 data-reveal>Rejoindre l'institut</h2><p data-reveal>Thèses, postdoctorats et stages d'ingénieur sont ouverts toute l'année. Joignez un court résumé de votre projet et vos disponibilités.</p><a class="lb-btn" href="/contact" data-reveal>Candidater ${ARW}</a></div>
    <ul class="lb-facts lb-facts--v" data-reveal><li><b>18</b><span>doctorants accueillis</span></li><li><b>9</b><span>nationalités représentées</span></li><li><b>4</b><span>équipes, un seul laboratoire commun</span></li></ul></div></section>`),
  sec(footer(c)),
];

const PLATES = [["a", "LSM-1", "Microscope à feuillet de lumière", ["Nappe laser d'épaisseur 3 µm", "Objectif de détection ×20", "Caméra scientifique"], [["Résolution latérale", "0,3 µm"], ["Longueurs d'onde", "488 · 561 · 640 nm"], ["Champ de vue", "1,3 × 1,3 mm"], ["Cadence maximale", "120 images/s"]]],
  ["b", "RAM-2", "Spectromètre Raman confocal", ["Source laser à 532 nm", "Réseau de dispersion", "Détecteur refroidi"], [["Résolution spectrale", "0,5 cm⁻¹"], ["Plage", "200–3 500 cm⁻¹"], ["Puissance sur échantillon", "0,1–20 mW"], ["Temps d'intégration", "10 ms – 60 s"]]],
  ["c", "CRY-3", "Cryostat à dilution", ["Étages à 50 K, 4 K, 1 K", "Chambre à mélange", "Échantillon à 10 mK"], [["Température minimale", "10 mK"], ["Puissance de refroidissement", "400 µW à 100 mK"], ["Temps de descente", "≈ 30 h"], ["Accès optique", "4 fenêtres"]]],
  ["d", "HPC-5", "Grappe de calcul", ["Quatre baies de calcul", "Stockage partagé", "Réseau 100 Gb/s"], [["Puissance crête", "1,2 Pflops"], ["Cœurs", "8 192"], ["Mémoire", "48 To"], ["Stockage", "3,2 Po"]]]];
const instruments = (c) => [
  sec(header(c)), pagehead("05", "Plateformes", "Vingt-trois instruments,<br>une <mark>réservation</mark>.", "Les plateformes sont partagées entre équipes et ouvertes aux partenaires académiques.", 4),
  sec(`<section class="lb-sec pk-bleed"><div class="lb-wrap">${sh("01", "Planches techniques")}<div class="lb-plates">${PLATES.map(([k, id, n, leg, rows], i) => `<article class="lb-iplate" data-reveal><figure class="lb-plate" data-draw><div class="lb-fig-h"><b>Fig. ${i + 1}</b><span>${id}</span><i class="lb-cote">schéma de principe</i></div>${PLATE[k]()}<figcaption><b>Fig. ${i + 1}</b> — ${n}. ${leg.join(" · ")}.</figcaption></figure>${spec(`Caractéristiques de ${id}`, rows)}</article>`).join("")}</div></div></section>`),
  sec(`<section class="lb-sec lb-sec--tint pk-bleed"><div class="lb-wrap">${sh("02", "Catalogue des instruments")}
    <table class="lb-tbl" data-reveal><caption class="lb-sr">Instruments de l'institut, résolution, plage et disponibilité</caption><thead><tr><th>Code</th><th>Instrument</th><th>Domaine</th><th>Résolution</th><th>Plage</th><th>État</th><th>Responsable</th></tr></thead><tbody>${INSTR.map(([id, n, d, res, plage, st, who]) => `<tr><td data-label="Code"><b>${id}</b></td><td data-label="Instrument">${n}</td><td data-label="Domaine">${d}</td><td data-label="Résolution">${res}</td><td data-label="Plage">${plage}</td><td data-label="État"><span class="lb-st lb-st--${st}">${STATUS[st]}</span></td><td data-label="Responsable">${who}</td></tr>`).join("")}</tbody></table>
    <p class="lb-note"><sup>1</sup> Réservation par le formulaire de contact : démonstration, aucun créneau réel n'est géré par ce site.</p></div></section>`),
  sec(footer(c)),
];

const DATASETS = [["MER-ORB-01", "Courbes de lumière d'astéroïdes", "Astrophysique", "HDF5", "14 Go", "v2.1"], ["MER-BIO-03", "Séries de calcium en épithélium", "Biophysique", "CSV + TIFF", "92 Go", "v1.4"], ["MER-RES-02", "Graphes dynamiques annotés", "Réseaux", "Parquet", "6 Go", "v1.0"], ["MER-SPE-05", "Spectres Raman d'hétérostructures", "Matériaux", "CSV", "1,8 Go", "v3.0"], ["MER-CRY-04", "Journaux de température du cryostat", "Matériaux", "CSV", "420 Mo", "v1.2"], ["MER-TEL-06", "Vitesses radiales calibrées", "Astrophysique", "FITS", "3,5 Go", "v1.1"]];
const histo = chart({ n: 1, title: "Taille des jeux de données publiés", tag: "64 jeux · classes de 2 Go", kind: "bars", xs: ["2", "4", "6", "8", "10", "12", "14", "16"], xl: ["0–2 Go", "2–4 Go", "4–6 Go", "6–8 Go", "8–10 Go", "10–12 Go", "12–14 Go", "14–16 Go"], min: 0, max: 40, unit: "jeux", series: [{ name: "Jeux de données", vals: [38, 12, 6, 3, 2, 1, 1, 1] }], cap: "Plus de la moitié des jeux publiés pèsent moins de 2 Go.", unitLabel: "Nombre de jeux selon la taille (Go)", src: "démonstration", alt: "Histogramme de la taille des jeux de données : 38 jeux de moins de 2 gigaoctets, puis une décroissance" });
const donnees = (c) => [
  sec(header(c)), pagehead("06", "Données ouvertes", "Des données que l'on peut<br><mark>refaire tourner</mark>.", "Chaque jeu est décrit, versionné et accompagné de ses incertitudes.", 5),
  sec(`<section class="lb-sec pk-bleed"><div class="lb-wrap"><ul class="lb-keys lb-keys--wide">${[["64", "jeux de données"], ["212", "Go publiés (démonstration)"], ["3", "licences ouvertes"], ["100", "% décrits par un protocole"]].map(([v, l]) => `<li data-reveal><b data-count="${v}">${v}</b><span>${l}</span></li>`).join("")}</ul>
    <div class="lb-split lb-split--top"><div data-reveal>${histo}</div><div class="lb-split-t"><span class="lb-no">§ 01</span><h2 data-reveal>Comment citer un jeu</h2><p data-reveal>Citez la version exacte utilisée : le numéro de version change dès qu'une mesure est corrigée.</p>${cite("Institut Mérel", 2026, "Courbes de lumière d'astéroïdes, version 2.1 (MER-ORB-01)", "Jeu de données de démonstration", "MER-ORB-01")}</div></div></div></section>`),
  sec(`<section class="lb-sec lb-sec--tint pk-bleed"><div class="lb-wrap">${sh("02", "Catalogue")}
    <table class="lb-tbl lb-tbl--data" data-reveal><caption class="lb-sr">Jeux de données ouverts</caption><thead><tr><th>Identifiant</th><th>Jeu de données</th><th>Domaine</th><th>Format</th><th>Taille</th><th>Version</th><th>Accès</th></tr></thead><tbody>${DATASETS.map(([id, n, d, f, s, v]) => `<tr><td data-label="Identifiant"><b>${id}</b></td><td data-label="Jeu de données">${n}</td><td data-label="Domaine">${d}</td><td data-label="Format">${f}</td><td data-label="Taille">${s}</td><td data-label="Version">${v}</td><td data-label="Accès"><a href="/contact">Demander</a></td></tr>`).join("")}</tbody></table></div></section>`),
  sec(`<section class="lb-sec pk-bleed"><div class="lb-wrap lb-faq"><div class="lb-faq-t"><span class="lb-no" data-reveal>§ 03</span><h2 data-reveal>Questions fréquentes</h2><p data-reveal>Besoin d'un format particulier ? Écrivez-nous.</p></div><div>
    <details data-reveal><summary>Comment obtenir un jeu de données ?</summary><p>Dans cette démonstration, aucune donnée n'est téléchargeable : l'accès se demande via le formulaire de contact en indiquant l'identifiant du jeu.</p></details>
    <details data-reveal><summary>Quelles licences s'appliquent ?</summary><p>Les jeux ouverts sont diffusés sous licence ouverte avec attribution ; les conditions précises sont indiquées dans chaque fiche.</p></details>
    <details data-reveal><summary>Les incertitudes sont-elles fournies ?</summary><p>Oui : chaque série porte son incertitude de mesure et la description de l'étalonnage de l'instrument.</p></details>
    <details data-reveal><summary>Que se passe-t-il quand une mesure est corrigée ?</summary><p>Une nouvelle version est publiée ; les anciennes restent consultables afin que les résultats déjà publiés puissent être reproduits.</p></details>
    <details data-reveal><summary>Comment signaler une anomalie ?</summary><p>Écrivez au responsable du jeu via la page de contact en précisant l'identifiant et la version.</p></details></div></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)), pagehead("07", "Contact", "Écrire à<br>l'<mark>institut</mark>.", "Collaboration, accès aux données, réservation d'un instrument ou candidature.", 0),
  sec(`<section class="lb-sec pk-bleed"><div class="lb-wrap"><ul class="lb-cards">${[["Adresse", "8 allée Rosalind-Hervé<br>69000 Lyon"], ["Courriel", `<a href="mailto:contact@institut-merel.example">contact@institut-merel.example</a>`], ["Coordonnées", "45.7640° N<br>4.8357° E"], ["Horaires", "Lundi – vendredi<br>8 h 30 – 18 h 00"]].map(([t, x], i) => `<li data-reveal><span class="lb-cote">0${i + 1}</span><h2 class="lb-ct">${t}</h2><p>${x}</p></li>`).join("")}</ul></div></section>`),
  { type: "form", heading: "Envoyer un message", intro: "Précisez l'objet de votre demande : nous répondons sous cinq jours ouvrés." },
  { type: "layout", children: [{ type: "map", props: { address: "8 allée Rosalind-Hervé, 69000 Lyon", zoom: 14, height: 360 } }] },
  sec(footer(c)),
];

const recherche = (c) => [sec(header(c)), pagehead("08", "Recherche", "Retrouver<br>une <mark>référence</mark>.", "Une publication, un instrument, un jeu de données.", 3), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];

const introuvable = (c) => [sec(header(c)), sec(`<section class="lb-404 pk-bleed"><div class="lb-wrap"><p class="lb-kicker"><i></i>Erreur 404 · valeur hors plage</p><div class="lb-big" role="heading" aria-level="1">404</div>
  <svg class="lb-flat" viewBox="0 0 600 120" aria-hidden="true"><path class="lb-gh" d="M0 20h600M0 60h600M0 100h600"/><path class="lb-ln lb-draw lb-sigline" d="M0 90c60 0 80-60 150-60s70 40 130 40 60-50 110-50 60 20 100 20 40-10 110-10"/><path class="lb-ln lb-dash" d="M410 0v120"/><circle class="lb-sig" cx="410" cy="40" r="6"/></svg>
  <p class="lb-sub">Cette page n'existe pas ou a changé d'adresse : la mesure est sortie du domaine de définition.</p><a class="lb-btn" href="/">Retour à l'accueil ${ARW}</a></div></section>`), sec(footer(c))];

module.exports = {
  key: "labo", name: "Laboratoire", version: "2.0.0", category: "science", tags: ["technique", "experimental", "editorial"], siteType: "Institut de recherche et laboratoire scientifique", featured: true,
  concept: "Un carnet de laboratoire : papier millimétré, encre noir-bleu et un seul signal cyan, avec des planches annotées, des courbes qui se tracent et un réticule qui lit chaque valeur.",
  description: "Institut de recherche : grille de repérage et cotes visibles, graphiques SVG interactifs tracés à l'apparition, publications filtrables par année et domaine, trombinoscope, fiches d'instruments et jeux de données ouverts.",
  brand: "Institut Mérel", modules: ["formulaires", "recherche"],
  dna: { header: "barre-coordonnees-technique", hero: "grille-donnees-visualisation", grid: "publications-et-instruments", motion: "trace-de-courbes-et-curseur", shapes: "filets-et-reperes-techniques", rhythm: "dense-donnees", signature: "graphiques-interactifs-a-reticule" },
  tokens: {
    colors: { primary: "#00c2e0", secondary: "#0b1628", accent: "#ffd400", background: "#f4f2ea", surface: "#fbfaf5", text: "#0b1628", muted: "#4a5a70", success: "#13734a", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.space-grotesk", body: "font.ibm-plex-mono", button: "font.jetbrains-mono", link: "font.ibm-plex-mono" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1.5, color: "#0b1628" },
    type: { h1: { size: 80, weight: 600, lineHeight: 1, transform: "none" }, h2: { size: 40, weight: 600, lineHeight: 1.05, transform: "none" } },
  },
  options: [
    { key: "signal", label: "Couleur de signal", type: "color", default: "#00c2e0" },
    { key: "density", label: "Densité de la grille", type: "choice", default: "normal", choices: [["fine", "Fine (12 px)"], ["normal", "Normale (24 px)"], ["large", "Large (48 px)"]] },
    { key: "cotes", label: "Cotes et coordonnées", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
    { key: "datafont", label: "Police du texte et des données", type: "choice", default: "mono", choices: [["mono", "Chasse fixe"], ["sans", "Sans empattement"]] },
    { key: "trace", label: "Animations de tracé", type: "choice", default: "on", choices: [["on", "Activées"], ["off", "Désactivées"]] },
  ],
  menu: [["Accueil", "/"], ["Axes", "/axes"], ["Publications", "/publications"], ["Équipes", "/equipe"], ["Instruments", "/instruments"], ["Données", "/donnees"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "axes", name: "Axes de recherche", render: axes }, { key: "publications", name: "Publications", render: publications }, { key: "equipe", name: "Équipes", render: equipe },
    { key: "instruments", name: "Plateformes et instruments", render: instruments }, { key: "donnees", name: "Données ouvertes", render: donnees }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
