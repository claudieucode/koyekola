// Lyrique — orchestre et chœur. Direction artistique : salle d'opéra à la tombée de la nuit. Bleu-nuit très profond, or champagne, portique à colonnes cannelées et lustre qui s'allume,
// programme de soirée en liste verticale à droite, colonnes lyriques, saison filtrable avec fiche-programme, plan de salle avec choix de catégories de places et récapitulatif vers le contact.
const { sec, esc, nav } = require("../kit");

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const LYRE = `<svg class="ly-lyre" viewBox="0 0 48 56" aria-hidden="true"><path d="M10 6c-6 14-4 30 6 38 4 3 12 3 16 0 10-8 12-24 6-38" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M10 6c4 6 5 14 3 22M38 6c-4 6-5 14-3 22" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".7"/><path d="M8 6h32" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M18 8v38M24 8v40M30 8v38" stroke="currentColor" stroke-width="1.1"/><path d="M14 46h20M18 52h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;

// ---------- Données de démonstration : la saison ----------
const MONTHS = [["nov", "Nov."], ["dec", "Déc."], ["jan", "Janv."], ["fev", "Févr."], ["mar", "Mars"], ["avr", "Avr."], ["mai", "Mai"], ["juin", "Juin"]];
const FORMS = [["symph", "Symphonique"], ["choeur", "Chœur"], ["chambre", "Musique de chambre"], ["recital", "Récital"]];
const CONCERTS = [
  { id: "c1", d: "Sam. 21 nov. 2026", day: "21", mon: "NOV", m: "nov", h: "20 h", f: "symph", t: "Soir de Beethoven", lead: "Direction Hélène Marchetti · piano Tomas Verelst", ent: 1,
    w: [["Beethoven", "Ouverture d'Egmont", 9], ["Beethoven", "Concerto pour piano n° 4", 34], ["Beethoven", "Symphonie n° 7", 38]],
    note: "Une soirée construite comme un crescendo : l'ouverture dramatique, le dialogue intime du piano et de l'orchestre, puis la danse effrénée de la Septième." },
  { id: "c2", d: "Dim. 13 déc. 2026", day: "13", mon: "DÉC", m: "dec", h: "17 h", f: "choeur", t: "Messe de l'Avent", lead: "Direction Anselme Ferrand · chœur de la Lyre", ent: 1,
    w: [["Fauré", "Cantique de Jean Racine", 6], ["Poulenc", "Quatre motets pour un temps de Noël", 10], ["Bach", "Magnificat BWV 243", 30]],
    note: "Le chœur seul d'abord, a cappella, puis rejoint par l'orchestre baroque pour le Magnificat. Un concert de lumière, dans la salle laissée à demi éclairée." },
  { id: "c3", d: "Ven. 15 janv. 2027", day: "15", mon: "JAN", m: "jan", h: "20 h", f: "chambre", t: "Quatuors à la bougie", lead: "Quatuor Amaryllis", ent: 1,
    w: [["Haydn", "Quatuor op. 76 n° 3, « L'Empereur »", 25], ["Ravel", "Quatuor en fa majeur", 30]],
    note: "Deux quatuors à cordes en regard : l'équilibre classique de Haydn et le chatoiement de Ravel, dans la lumière des bougies de la scène." },
  { id: "c4", d: "Sam. 13 févr. 2027", day: "13", mon: "FÉV", m: "fev", h: "20 h", f: "symph", t: "Nuits russes", lead: "Direction Hélène Marchetti · piano Lidia Orlov", ent: 1,
    w: [["Glinka", "Rouslan et Lioudmila, ouverture", 5], ["Rachmaninov", "Concerto pour piano n° 2", 35], ["Tchaïkovski", "Symphonie n° 5", 46]],
    note: "Le grand romantisme russe : des mélodies qui chantent à pleine voix, un piano virtuose et une symphonie qui avance vers la lumière." },
  { id: "c5", d: "Dim. 14 mars 2027", day: "14", mon: "MARS", m: "mar", h: "17 h", f: "recital", t: "Voix de soprano", lead: "Inès Valcourt, soprano · au piano Marc Delorme", ent: 1,
    w: [["Schubert", "Lieder choisis", 24], ["R. Strauss", "Vier letzte Lieder", 22], ["Duparc", "Mélodies", 14]],
    note: "Un récital pour une voix et un piano : de la confidence de Schubert à l'ample envol de Strauss, en passant par la poésie de Duparc." },
  { id: "c6", d: "Sam. 10 avr. 2027", day: "10", mon: "AVR", m: "avr", h: "20 h", f: "choeur", t: "Requiem de Fauré", lead: "Direction Anselme Ferrand · orchestre et chœur", ent: 1,
    w: [["Debussy", "Prélude à l'après-midi d'un faune", 10], ["Fauré", "Requiem op. 48", 38]],
    note: "Un prélude de flûte et de harpe, puis le Requiem le plus doux du répertoire : une consolation plus qu'une plainte, portée par l'orgue et le chœur." },
  { id: "c7", d: "Sam. 15 mai 2027", day: "15", mon: "MAI", m: "mai", h: "20 h", f: "symph", t: "Printemps français", lead: "Direction Hélène Marchetti · piano Camille Roy", ent: 1,
    w: [["Debussy", "La Mer", 24], ["Ravel", "Concerto pour piano en sol", 22], ["Ravel", "Ma mère l'Oye, suite", 28]],
    note: "Trois couleurs d'orchestre : la mer en mouvement, un concerto de jazz et de tendresse, et la suite de contes pour finir en douceur." },
  { id: "c8", d: "Sam. 12 juin 2027", day: "12", mon: "JUIN", m: "juin", h: "20 h 30", f: "symph", t: "La Neuvième", lead: "Direction Hélène Marchetti · orchestre et chœur · quatre solistes", ent: 0,
    w: [["Beethoven", "Symphonie n° 9, « Ode à la joie »", 70]],
    note: "Le concert de clôture de la saison : une seule œuvre, quatre mouvements, et l'Hymne à la joie chanté par tout le chœur réuni." },
];
const fLabel = (k) => (FORMS.find((x) => x[0] === k) || [])[1] || "";
const total = (c) => c.w.reduce((s, x) => s + x[2], 0);

// ---------- En-tête : barre + programme latéral à droite ----------
const header = (c) => {
  const items = c.menu.map(({ label, url }, i) => `<a href="${esc(url)}"><i>${ROMAN[i]}</i><span>${esc(label)}</span></a>`).join("");
  return `<header class="ly-head pk-bleed">
  <div class="ly-bar"><a class="ly-logo" href="/" aria-label="${esc(c.brand)} — accueil">${LYRE}<span class="ly-logo-t"><b>Orchestre &amp; Chœur</b><i>de la Lyre</i></span></a>
    <p class="ly-season">Saison 2026 — 2027</p>
    <details class="ly-burger"><summary><span class="ly-bars" aria-hidden="true"></span>Programme</summary><div class="ly-drawer" role="navigation" aria-label="Programme, menu mobile"><p class="ly-prog-t">Programme de la soirée</p>${items}<a class="ly-btn" href="/salle">Choisir mes places</a></div></details></div>
  <div class="ly-rail" role="navigation" aria-label="Programme">
    <p class="ly-prog-t">Programme<br>de la soirée</p>
    <div class="ly-prog">${items}</div>
    <a class="ly-next" href="/concert"><small>Prochain concert</small><b>Soir de Beethoven</b><span>Sam. 21 nov. · 20 h</span></a>
    <a class="ly-find" href="/recherche">Rechercher</a>
  </div></header>`;
};
const footer = (c) => `<footer class="ly-foot pk-bleed"><div class="ly-wrap ly-foot-g">
  <div><div class="ly-logo ly-logo--f">${LYRE}<span class="ly-logo-t"><b>Orchestre &amp; Chœur</b><i>de la Lyre</i></span></div><p>Palais des Lumières · 8 place de l'Opéra<br>Billetterie : mardi au samedi, 11 h – 18 h</p></div>
  <div><h2 class="ly-fh">Programme</h2>${nav(c.menu.slice(0, 3), "ly-fl")}</div>
  <div><h2 class="ly-fh">La maison</h2>${nav(c.menu.slice(3), "ly-fl")}<a class="ly-fl" href="/recherche">Recherche</a></div></div>
  <p class="ly-legal">© Orchestre &amp; Chœur de la Lyre — site de démonstration. Concerts, artistes et tarifs fictifs ; aucune réservation n'est enregistrée.</p></footer>`;

const orn = `<svg class="ly-orn" viewBox="0 0 220 14" aria-hidden="true"><path d="M0 7h86M134 7h86" stroke="currentColor" stroke-width="1"/><path d="M110 1l6 6-6 6-6-6z" fill="currentColor"/><circle cx="94" cy="7" r="2" fill="currentColor"/><circle cx="126" cy="7" r="2" fill="currentColor"/></svg>`;
const colSide = (side) => `<svg class="ly-pcol ly-pcol--${side}" viewBox="0 0 60 200" aria-hidden="true"><rect x="2" y="0" width="56" height="9" fill="currentColor" opacity=".9"/><rect x="8" y="9" width="44" height="7" fill="currentColor" opacity=".6"/><circle cx="12" cy="24" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="48" cy="24" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M14 34h32v156H14z" fill="currentColor" opacity=".12"/><path d="M20 34v156M26 34v156M32 34v156M38 34v156M44 34v156" stroke="currentColor" stroke-width="1.2" opacity=".7"/><rect x="8" y="190" width="44" height="6" fill="currentColor" opacity=".7"/><rect x="2" y="195" width="56" height="5" fill="currentColor"/></svg>`;
const pagehead = (kicker, title, sub) => sec(`<section class="ly-ph pk-bleed">${colSide("l")}${colSide("r")}<div class="ly-ph-in"><p class="ly-kicker" data-reveal>${esc(kicker)}</p><div class="ly-h1" role="heading" aria-level="1" data-reveal>${title}</div>${orn}${sub ? `<p class="ly-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div></section>`);

// ---------- Hero : portique, lustre, faisceaux ----------
function heroArt() {
  const out = [];
  // moulures et entablement
  let dd = ""; for (let x = 40; x < 1170; x += 18) dd += `M${x} 46v9`; const dent = `<path d="${dd}" stroke="#e0c58a" stroke-width="9" opacity=".5"/>`;
  let trig = ""; for (let x = 60; x < 1150; x += 54) trig += `<path d="M${x} 74v26M${x + 8} 74v26M${x + 16} 74v26" stroke="#e0c58a" stroke-width="2" opacity=".35"/>`;
  const column = (x) => {
    let fl = ""; for (let i = 1; i < 8; i++) fl += `<path d="M${x + i * 12.5} 168V560" stroke="#e0c58a" stroke-width="1.2" opacity="${i % 2 ? ".38" : ".22"}"/>`;
    return `<g><rect x="${x - 14}" y="134" width="128" height="14" fill="#16204a" stroke="#e0c58a" stroke-width="1.2"/><rect x="${x - 4}" y="148" width="108" height="8" fill="#0d1535" stroke="#e0c58a" stroke-width=".8"/><circle cx="${x + 6}" cy="166" r="13" fill="none" stroke="#e0c58a" stroke-width="2"/><circle cx="${x + 94}" cy="166" r="13" fill="none" stroke="#e0c58a" stroke-width="2"/><circle cx="${x + 6}" cy="166" r="5" fill="#e0c58a" opacity=".7"/><circle cx="${x + 94}" cy="166" r="5" fill="#e0c58a" opacity=".7"/><rect x="${x}" y="168" width="100" height="392" fill="#101947"/><rect x="${x + 26}" y="168" width="48" height="392" fill="#1a2760"/><rect x="${x + 38}" y="168" width="22" height="392" fill="#25347c" opacity=".8"/>${fl}<rect x="${x - 6}" y="560" width="112" height="12" fill="#16204a" stroke="#e0c58a" stroke-width="1"/><rect x="${x - 14}" y="572" width="128" height="18" fill="#0d1535" stroke="#e0c58a" stroke-width="1.2"/></g>`;
  };
  const glow = (x, y, r) => `<g class="ly-gl"><circle cx="${x}" cy="${y}" r="${r}" fill="#ffe9a8" opacity=".09"/><circle cx="${x}" cy="${y}" r="${(r * 0.62).toFixed(0)}" fill="#ffe9a8" opacity=".16"/><circle cx="${x}" cy="${y}" r="${(r * 0.3).toFixed(0)}" fill="#fff3c4" opacity=".4"/></g>`;
  // lustre
  const flames = [], arms = [], crystals = [];
  const tiers = [[250, [-92, 92]], [322, [-176, -88, 88, 176]], [394, [-262, -176, -88, 88, 176, 262]]];
  tiers.forEach(([y, dxs], ti) => {
    dxs.forEach((dx) => {
      const ex = 600 + dx, ey = y + 34;
      arms.push(`<path d="M600 ${y}C${600 + dx * 0.35} ${y + 6} ${600 + dx * 0.9} ${y + 6} ${ex} ${ey}" fill="none" stroke="#e0c58a" stroke-width="3" stroke-linecap="round"/><path d="M${ex - 9} ${ey}h18l-4 10h-10z" fill="#e0c58a"/><rect x="${ex - 3}" y="${ey - 16}" width="6" height="16" fill="#f5ecd2"/>`);
      flames.push(`${glow(ex, ey - 24, ti === 2 ? 30 : 24)}<path class="ly-fl" d="M${ex} ${ey - 36}c5 7 6 12 0 17-6-5-5-10 0-17z" fill="#fff3c4"/>`);
      crystals.push(`<path d="M${ex - 3} ${ey + 22}l3 -5 3 5-3 12z" fill="#cfe0ff" opacity=".75"/>`);
    });
  });
  let drops = ""; for (let i = -6; i <= 6; i++) { const x = 600 + i * 44, yy = 432 + Math.abs(i) * 5; drops += `<path d="M${x} ${yy - 12}v10" stroke="#e0c58a" stroke-width="1" opacity=".6"/><path d="M${x - 4} ${yy}l4 -3 4 3-4 14z" fill="#d8e6ff" opacity=".85"/>`; }
  const stem = `<path d="M600 120v66M584 186h32l-6 16h-20z" stroke="#e0c58a" stroke-width="2.4" fill="#16204a"/><path d="M600 202c-26 16-26 34-14 50 10 14 10 26 0 42 8 6 20 6 28 0-10-16-10-28 0-42 12-16 12-34-14-50z" fill="#1c2858" stroke="#e0c58a" stroke-width="2"/><path d="M586 296c-10 24-16 52-6 84h40c10-32 4-60-6-84z" fill="#16204a" stroke="#e0c58a" stroke-width="1.8"/><circle cx="600" cy="392" r="9" fill="#e0c58a"/><path d="M600 400v18" stroke="#e0c58a" stroke-width="2.4"/><path d="M592 418l8 26 8-26z" fill="#d8e6ff"/>`;
  const topFlame = `${glow(600, 168, 26)}<path class="ly-fl" d="M600 154c5 7 6 12 0 17-6-5-5-10 0-17z" fill="#fff3c4"/>`;
  // faisceaux
  const bm = (cls, d1, d2) => `<g class="ly-beam ${cls}"><path d="${d1}"/><path d="${d2}"/></g>`;
  const beams = `<g class="ly-beams">${bm("ly-b1", "M560 300H640L860 640H340z", "M580 300H620L720 640H480z")}${bm("ly-b2", "M520 330L580 310 250 640H60z", "M545 325L575 315 200 640H110z")}${bm("ly-b3", "M680 310L740 330 1140 640H950z", "M625 315L655 325 1090 640H1000z")}${bm("ly-b4", "M590 300H610L700 640H500z", "M596 300H604L640 640H560z")}</g>`;
  let persp = ""; for (let x = -600; x <= 1800; x += 150) persp += `<path d="M${(600 + (x - 600) * 0.692).toFixed(0)} 560L${x} 640" stroke="#e0c58a" stroke-width="1" opacity=".13"/>`;
  let motes = ""; [[470, 420], [640, 380], [720, 500], [540, 540], [610, 470], [780, 430], [420, 520], [660, 560]].forEach(([x, y], i) => { motes += `<circle class="ly-mote ly-m${i % 4}" cx="${x}" cy="${y}" r="${1.6 + (i % 3) * 0.6}" fill="#fff3c4"/>`; });
  out.push(`<svg class="ly-hero-svg" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMin slice" role="img" aria-label="Portique de la salle de concert : deux colonnes cannelées, un lustre allumé et des faisceaux de lumière"><title>Portique et lustre de la salle</title>
<rect width="1200" height="640" fill="#050816"/><ellipse cx="600" cy="330" rx="620" ry="360" fill="#0a1130"/><ellipse cx="600" cy="320" rx="470" ry="290" fill="#101a48"/><ellipse cx="600" cy="300" rx="320" ry="200" fill="#16225a" opacity=".8"/><ellipse cx="600" cy="290" rx="170" ry="120" fill="#1d2d70" opacity=".7"/>
<path d="M210 600V300A390 270 0 0 1 990 300V600" fill="#060a1f" stroke="#e0c58a" stroke-width="2" opacity=".95"/><path d="M236 600V304A364 246 0 0 1 964 304V600" fill="none" stroke="#e0c58a" stroke-width="1" opacity=".5"/><path d="M262 600V308A338 224 0 0 1 938 308V600" fill="none" stroke="#e0c58a" stroke-width=".8" opacity=".3"/>
<ellipse cx="600" cy="604" rx="420" ry="40" fill="#e0c58a" opacity=".07"/><ellipse cx="600" cy="604" rx="260" ry="26" fill="#e0c58a" opacity=".1"/>${persp}${beams}
<rect x="14" y="36" width="1172" height="24" fill="#10193e" stroke="#e0c58a" stroke-width="1.4"/>${dent}<rect x="24" y="60" width="1152" height="14" fill="#0d1535" stroke="#e0c58a" stroke-width="1"/><rect x="24" y="74" width="1152" height="32" fill="#0a112d"/>${trig}<rect x="24" y="106" width="1152" height="10" fill="#16204a" stroke="#e0c58a" stroke-width="1"/><rect x="14" y="116" width="1172" height="8" fill="#0d1535" stroke="#e0c58a" stroke-width="1"/>
${column(52)}${column(1048)}
<g class="ly-chand">${stem}${arms.join("")}${crystals.join("")}${drops}${topFlame}${flames.join("")}</g>${motes}</svg>`);
  return out.join("");
}

// ---------- Fiches de concerts ----------
const capital = `<svg class="ly-cap" viewBox="0 0 120 34" aria-hidden="true"><rect x="2" y="0" width="116" height="9" fill="currentColor"/><rect x="10" y="9" width="100" height="6" fill="currentColor" opacity=".55"/><circle cx="18" cy="23" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="102" cy="23" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="23" r="3" fill="currentColor"/><circle cx="102" cy="23" r="3" fill="currentColor"/><path d="M26 18h68v10H26z" fill="currentColor" opacity=".25"/></svg>`;
const baseS = `<svg class="ly-cap ly-cap--b" viewBox="0 0 120 22" aria-hidden="true"><rect x="12" y="0" width="96" height="5" fill="currentColor" opacity=".55"/><rect x="6" y="5" width="108" height="7" fill="currentColor" opacity=".8"/><rect x="0" y="12" width="120" height="10" fill="currentColor"/></svg>`;
const colCard = (k) => `<article class="ly-col" data-reveal>${capital}<div class="ly-col-b"><p class="ly-date"><b>${k.day}</b><span>${k.mon}</span></p><p class="ly-tag">${esc(fLabel(k.f))}</p><h3>${esc(k.t)}</h3><p class="ly-lead">${esc(k.lead)}</p><p class="ly-comp">${[...new Set(k.w.map((x) => x[0]))].join(" · ")}</p><a class="ly-lnk" href="/concert#${k.id}">Voir le programme<span aria-hidden="true"> →</span></a></div>${baseS}</article>`;
const rowCard = (k) => `<article class="ly-row" data-m="${k.m}" data-f="${k.f}"><div class="ly-row-d"><b>${k.day}</b><span>${k.mon}</span><small>${esc(k.h)}</small></div><div class="ly-row-m"><p class="ly-tag">${esc(fLabel(k.f))}</p><h3>${esc(k.t)}</h3><p class="ly-lead">${esc(k.lead)}</p><p class="ly-comp">${[...new Set(k.w.map((x) => x[0]))].join(" · ")} · env. ${total(k) + (k.ent ? 20 : 0)} min</p></div><div class="ly-row-a"><a class="ly-lnk" href="/concert#${k.id}">Programme<span aria-hidden="true"> →</span></a><a class="ly-lnk ly-lnk--s" href="/salle#${k.id}">Choisir mes places<span aria-hidden="true"> →</span></a></div></article>`;

function panel(k) {
  const tot = total(k); let x = 0; const segs = k.w.map((w, i) => { const wd = (w[2] / tot) * 100; const s = `<rect class="ly-seg ly-seg${i % 3}" x="${x.toFixed(2)}" y="0" width="${Math.max(wd - 0.8, 0.4).toFixed(2)}" height="8"/>`; x += wd; return s; }).join("");
  const rows = k.w.map((w, i) => `<tr><td>${esc(w[0])}</td><td>${esc(w[1])}</td><td>${w[2]} min</td></tr>${k.ent && i === k.ent - 1 && i < k.w.length - 1 ? `<tr class="ly-ent"><td colspan="3">Entracte · 20 minutes</td></tr>` : ""}`).join("");
  return `<article class="ly-sheet" data-panel="${k.id}"><div class="ly-sheet-in"><p class="ly-kicker">${esc(k.d)} · ${esc(k.h)} · Palais des Lumières</p><h2 class="ly-sheet-t">${esc(k.t)}</h2><p class="ly-tag">${esc(fLabel(k.f))}</p><p class="ly-lead">${esc(k.lead)}</p>
  <table class="ly-tbl"><caption class="ly-sr">Programme des œuvres : ${esc(k.t)}</caption><thead><tr><th scope="col">Compositeur</th><th scope="col">Œuvre</th><th scope="col">Durée</th></tr></thead><tbody>${rows}</tbody></table>
  <svg class="ly-bar8" viewBox="0 0 100 8" preserveAspectRatio="none" role="img" aria-label="Durée relative des œuvres, ${tot} minutes de musique"><title>Durée relative des œuvres</title>${segs}</svg><p class="ly-small">Durée de la musique : ${tot} min${k.ent ? ", plus un entracte de 20 min" : ", sans entracte"}.</p>
  <p class="ly-note">${esc(k.note)}</p><div class="ly-acts"><a class="ly-btn" href="/salle#${k.id}">Choisir mes places</a><a class="ly-btn ly-btn--ghost" href="/saison">Retour à la saison</a></div></div></article>`;
}

// ---------- Plan de salle ----------
function hallPlan() {
  const CX = 450, P = (r, a) => [CX + r * Math.sin((a * Math.PI) / 180), r * Math.cos((a * Math.PI) / 180)];
  const f = (n) => n.toFixed(1);
  const arc = (r, a) => { const [x1, y1] = P(r, -a), [x2, y2] = P(r, a); return `M${f(x1)} ${f(y1)}A${r} ${r} 0 0 0 ${f(x2)} ${f(y2)}`; };
  const sector = (r1, r2, a) => { const [ax, ay] = P(r2, -a), [bx, by] = P(r2, a), [cx, cy] = P(r1, a), [dx, dy] = P(r1, -a); return `M${f(ax)} ${f(ay)}A${r2} ${r2} 0 0 0 ${f(bx)} ${f(by)}L${f(cx)} ${f(cy)}A${r1} ${r1} 0 0 1 ${f(dx)} ${f(dy)}Z`; };
  const zone = (id, r1, r2, a, step) => { let rows = ""; for (let r = r1 + step / 2; r < r2; r += step) rows += `<path class="ly-seatrow" d="${arc(r, a - 3)}"/>`; return `<g class="ly-zone" data-zone="${id}"><path class="ly-zfill" d="${sector(r1, r2, a)}"/>${rows}</g>`; };
  let loges = ""; for (let i = 0; i < 6; i++) for (const sg of [-1, 1]) { const a = 52 + i * 6, [x, y] = P(402, sg * a); loges += `<rect class="ly-loge" x="${f(x - 11)}" y="${f(y - 9)}" width="22" height="18" rx="2" transform="rotate(${f(-sg * a)} ${f(x)} ${f(y)})"/>`; }
  return `<svg class="ly-plan" viewBox="0 0 900 450" role="img" aria-label="Plan de la salle vue de dessus : scène en haut, fosse, fauteuils d'orchestre, trois niveaux de balcons et loges latérales"><title>Plan de la salle</title>
<path class="ly-stage" d="${sector(0, 92, 74)}"/><path class="ly-pit" d="${sector(96, 128, 56)}"/>
${zone("or", 150, 252, 50, 13)}${zone("b1", 270, 300, 62, 10)}${zone("b2", 316, 346, 70, 10)}${zone("b3", 362, 388, 76, 12)}
<g class="ly-zone" data-zone="lg">${loges}</g></svg>`;
}
const CATS = [
  ["lg", "Loges latérales", "Loges de côté, vue plongeante sur l'orchestre", 76, "Cat. 1"],
  ["or", "Fauteuils d'orchestre", "Au plus près de la scène, son direct", 58, "Cat. 2"],
  ["b1", "Premier balcon", "Vue d'ensemble et équilibre sonore idéal", 44, "Cat. 3"],
  ["b2", "Deuxième balcon", "Belle acoustique, vue surplombante", 29, "Cat. 4"],
  ["b3", "Dernier balcon", "Tarif découverte, placement libre", 18, "Cat. 5"],
];
const planner = () => `<section class="ly-pl pk-bleed" data-planner><div class="ly-wrap ly-pl-g">
<div class="ly-pl-map" data-reveal><div class="ly-pl-frame">${hallPlan()}<span class="ly-lab ly-lab--stage">Scène</span><span class="ly-lab ly-lab--pit">Fosse</span></div>
<ul class="ly-legend" aria-label="Légende du plan">${CATS.map((c, i) => `<li data-zone-l="${c[0]}"><span class="ly-sw ly-sw${i}"></span>${c[1]}</li>`).join("")}</ul>
<p class="ly-small">Plan simplifié, vue de dessus : les balcons sont dépliés autour de la salle. Cliquez sur une zone pour ajouter une place.</p></div>
<div class="ly-pl-side"><h2 class="ly-h2" data-reveal>Composer ma soirée</h2>
<p class="ly-step"><b>1</b> Choisir le concert</p><div class="ly-chips" role="group" aria-label="Choix du concert">${CONCERTS.map((k) => `<a class="ly-chip" href="#${k.id}" data-pc="${k.id}" data-d="${esc(k.d)} · ${esc(k.h)}" data-t="${esc(k.t)}">${k.day} ${k.mon}<small>${esc(k.t)}</small></a>`).join("")}</div>
<p class="ly-step"><b>2</b> Choisir les places</p><ul class="ly-cats">${CATS.map((c) => `<li class="ly-cat" data-cat="${c[0]}" data-price="${c[3]}" data-name="${esc(c[1])}"><div class="ly-cat-i"><b>${esc(c[1])}</b><span>${esc(c[2])}</span></div><p class="ly-cat-p">${c[3]} €<small>tarif de démo</small></p><div class="ly-stepper"><a href="#moins" data-step="-1" aria-label="Retirer une place : ${esc(c[1])}">−</a><span class="ly-qty">0</span><a href="#plus" data-step="1" aria-label="Ajouter une place : ${esc(c[1])}">+</a></div></li>`).join("")}</ul>
<p class="ly-step"><b>3</b> Récapitulatif</p><div class="ly-recap" role="status" aria-live="polite"><p class="ly-recap-c" data-rc>Aucun concert choisi.</p><ul class="ly-recap-l" data-rl></ul><p class="ly-recap-t">Total indicatif <b data-rt>0 €</b></p><p class="ly-small" data-rm>Maximum 8 places par demande. Ce récapitulatif n'est pas une réservation : il est transmis par le formulaire de contact.</p></div>
<div class="ly-acts"><a class="ly-btn" href="/contact" data-send>Envoyer ma demande au contact</a><a class="ly-btn ly-btn--ghost" href="#copier" data-copy>Copier le récapitulatif</a></div></div></div></section>`;

// ---------- Accueil ----------
const home = (c) => [sec(header(c)),
  sec(`<section class="ly-hero pk-bleed"><div class="ly-hero-art">${heroArt()}</div><div class="ly-hero-tx"><p class="ly-kicker" data-reveal>Saison 2026 — 2027 · Palais des Lumières</p><div class="ly-h1 ly-h1--hero" role="heading" aria-level="1" data-reveal>L'Orchestre &amp; Chœur de la Lyre</div><p class="ly-hero-sub" data-reveal>Huit soirées de musique dans une salle à l'italienne : symphonies, chœur, quatuors et grandes voix.</p><div class="ly-acts ly-acts--c" data-reveal><a class="ly-btn" href="/saison">Découvrir la saison</a><a class="ly-btn ly-btn--ghost" href="/salle">Plan de la salle</a></div></div></section>`),
  sec(`<section class="ly-act ly-act--a pk-bleed"><div class="ly-wrap"><div class="ly-actno" data-reveal><span>Acte I</span>${orn}</div><div class="ly-intro"><h2 class="ly-h2" data-reveal>Une salle, quatre-vingt-quatre musiciens, un chœur de cent dix voix</h2><p data-reveal>Depuis plus d'un siècle, la Lyre donne ses concerts sous le lustre du Palais des Lumières. Cette saison, huit rendez-vous suivent un fil : la lumière, de la clarté du Requiem de Fauré à l'éclat de la Neuvième de Beethoven.</p></div>
  <dl class="ly-stats" data-reveal><div><dt>Musiciens</dt><dd><span data-count="84">84</span></dd></div><div><dt>Choristes</dt><dd><span data-count="110">110</span></dd></div><div><dt>Concerts par an</dt><dd><span data-count="62">62</span></dd></div><div><dt>Places dans la salle</dt><dd><span data-count="1180">1 180</span></dd></div></dl></div></section>`),
  sec(`<section class="ly-act ly-act--b pk-bleed"><div class="ly-wrap"><div class="ly-actno" data-reveal><span>Acte II</span>${orn}</div><div class="ly-head2"><h2 class="ly-h2" data-reveal>Les prochaines soirées</h2><a class="ly-lnk" href="/saison" data-reveal>Toute la saison<span aria-hidden="true"> →</span></a></div>
  <div class="ly-cols">${CONCERTS.slice(0, 3).map(colCard).join("")}</div></div></section>`),
  sec(`<section class="ly-ent-b pk-bleed"><div class="ly-wrap ly-ent-g"><svg class="ly-staff" viewBox="0 0 400 120" aria-hidden="true"><path d="M0 30h400M0 45h400M0 60h400M0 75h400M0 90h400" stroke="currentColor" stroke-width="1" opacity=".5"/><path d="M40 8v100M120 8v100M200 8v100M280 8v100M360 8v100" stroke="currentColor" stroke-width="1.2" opacity=".35"/><ellipse cx="80" cy="82" rx="9" ry="6.5" fill="currentColor" transform="rotate(-20 80 82)"/><path d="M88 80V34" stroke="currentColor" stroke-width="2"/><ellipse cx="160" cy="60" rx="9" ry="6.5" fill="currentColor" transform="rotate(-20 160 60)"/><path d="M168 58V16" stroke="currentColor" stroke-width="2"/><ellipse cx="240" cy="45" rx="9" ry="6.5" fill="currentColor" transform="rotate(-20 240 45)"/><path d="M232 47v44" stroke="currentColor" stroke-width="2"/><ellipse cx="320" cy="75" rx="9" ry="6.5" fill="none" stroke="currentColor" stroke-width="2.2" transform="rotate(-20 320 75)"/><path d="M328 73V30" stroke="currentColor" stroke-width="2"/></svg>
  <div><p class="ly-kicker" data-reveal>Entracte</p><blockquote class="ly-quote" data-reveal>« Un concert commence avant la première note : quand les lumières de la salle baissent et que le silence prend toute la place. »</blockquote><p class="ly-by" data-reveal>Hélène Marchetti, directrice musicale (propos de démonstration)</p></div></div></section>`),
  sec(`<section class="ly-act ly-act--c pk-bleed"><div class="ly-wrap"><div class="ly-actno" data-reveal><span>Acte III</span>${orn}</div>
  <div class="ly-duo"><div class="ly-duo-c" data-reveal><h2 class="ly-h2">L'orchestre et le chœur</h2><p>Cordes, bois, cuivres et percussions d'un côté, quatre voix de l'autre : deux ensembles qui travaillent ensemble toute l'année, et se retrouvent pour les grandes pages du répertoire.</p><a class="ly-lnk" href="/orchestre">Les pupitres et l'équipe<span aria-hidden="true"> →</span></a></div>
  <div class="ly-duo-c" data-reveal><h2 class="ly-h2">La salle</h2><p>Mille cent quatre-vingts places réparties entre l'orchestre, trois balcons et douze loges. Choisissez votre catégorie sur le plan et envoyez votre demande à la billetterie.</p><a class="ly-lnk" href="/salle">Voir le plan de salle<span aria-hidden="true"> →</span></a></div></div></div></section>`),
  sec(`<section class="ly-cta pk-bleed"><div class="ly-wrap"><p class="ly-kicker" data-reveal>Rideau dans quelques jours</p><h2 class="ly-h2 ly-h2--c" data-reveal>Le premier concert est le 21 novembre</h2><p class="ly-cta-p" data-reveal>Soir de Beethoven : l'ouverture d'Egmont, le Quatrième concerto et la Septième symphonie.</p><div class="ly-acts ly-acts--c" data-reveal><a class="ly-btn" href="/concert">Voir le programme</a><a class="ly-btn ly-btn--ghost" href="/contact">Contacter la billetterie</a></div></div></section>`),
  sec(footer(c))];

// ---------- Saison ----------
const saison = (c) => [sec(header(c)), pagehead("Saison 2026 — 2027", "Les concerts", "Huit soirées, de novembre à juin. Filtrez par mois ou par formation."),
  sec(`<section class="ly-season-s pk-bleed" data-season><div class="ly-wrap ly-ss-g"><div class="ly-filters" data-reveal><p class="ly-fh2">Mois</p><div class="ly-chips ly-chips--s" role="group" aria-label="Filtrer par mois"><a class="ly-chip is-on" href="#tous" data-fg="m" data-fv="all">Tous</a>${MONTHS.map(([k, l]) => `<a class="ly-chip" href="#m-${k}" data-fg="m" data-fv="${k}">${l}</a>`).join("")}</div>
  <p class="ly-fh2">Formation</p><div class="ly-chips ly-chips--s" role="group" aria-label="Filtrer par formation"><a class="ly-chip is-on" href="#toutes" data-fg="f" data-fv="all">Toutes</a>${FORMS.map(([k, l]) => `<a class="ly-chip" href="#f-${k}" data-fg="f" data-fv="${k}">${l}</a>`).join("")}</div>
  <p class="ly-count" role="status" aria-live="polite" data-count-out>8 concerts</p></div>
  <div class="ly-rows">${CONCERTS.map(rowCard).join("")}<p class="ly-none" data-none>Aucun concert ne correspond à ces filtres. <a href="#tous" data-reset>Réinitialiser</a></p></div></div></section>`),
  sec(footer(c))];

// ---------- Fiche concert ----------
const concert = (c) => [sec(header(c)), pagehead("Fiche concert", "Le programme de la soirée", "Choisissez un concert pour lire son programme, ses œuvres et sa durée."),
  sec(`<section class="ly-fiche pk-bleed" data-tabs data-hash="1"><div class="ly-wrap ly-fi-g"><div class="ly-tabs" role="group" aria-label="Choisir un concert">${CONCERTS.map((k, i) => `<a class="ly-tab${i ? "" : " is-on"}" href="#${k.id}" data-tab="${k.id}"><b>${k.day} ${k.mon}</b><span>${esc(k.t)}</span></a>`).join("")}</div>
  <div class="ly-panels">${CONCERTS.map(panel).join("")}</div></div></section>`),
  sec(footer(c))];

// ---------- Orchestre et chœur ----------
function orchSvg() {
  const CX = 300, P = (r, a) => [CX + r * Math.sin((a * Math.PI) / 180), 20 + r * Math.cos((a * Math.PI) / 180)], f = (n) => n.toFixed(1);
  const arc = (r, a) => { const [x1, y1] = P(r, -a), [x2, y2] = P(r, a); return `M${f(x1)} ${f(y1)}A${r} ${r} 0 0 0 ${f(x2)} ${f(y2)}`; };
  const fam = (id, r1, r2, a, step) => { let rows = ""; for (let r = r1; r <= r2; r += step) rows += `<path class="ly-seatrow" d="${arc(r, a)}"/>`; return `<g class="ly-fam" data-fam="${id}">${rows}</g>`; };
  return `<svg class="ly-orch" viewBox="0 0 600 330" role="img" aria-label="Disposition de l'orchestre vue de dessus : chef au centre, cordes devant, bois, cuivres et percussions derrière, chœur sur les gradins du fond"><title>Disposition de l'orchestre</title>
<path d="M60 24c0 110 80 290 240 290S540 134 540 24" fill="none" stroke="#e0c58a" stroke-width="1.2" opacity=".45"/>
${fam("choeur", 262, 292, 54, 10)}${fam("perc", 232, 242, 40, 10)}${fam("cuivres", 196, 216, 44, 10)}${fam("bois", 160, 180, 48, 10)}${fam("cordes", 70, 140, 66, 14)}
<circle cx="300" cy="46" r="9" fill="#e0c58a"/><path d="M300 55v-2" stroke="#e0c58a"/></svg>`;
}
const FAMS = [
  ["cordes", "Cordes", 54, "Violons, altos, violoncelles et contrebasses forment le cœur de l'orchestre, au plus près du chef.", "Premiers et seconds violons · altos · violoncelles · contrebasses · harpe"],
  ["bois", "Bois", 10, "Flûtes, hautbois, clarinettes et bassons : les couleurs de l'orchestre, par paires.", "Flûtes · hautbois · clarinettes · bassons"],
  ["cuivres", "Cuivres", 12, "Cors, trompettes, trombones et tuba apportent l'éclat et la puissance.", "Cors · trompettes · trombones · tuba"],
  ["perc", "Percussions", 8, "Timbales, caisse claire, grosse caisse, cymbales : le rythme et les accents.", "Timbales · caisse claire · grosse caisse · cymbales · xylophone"],
  ["choeur", "Chœur", 110, "Quatre voix, sur les gradins du fond lors des grandes œuvres avec orchestre.", "Sopranos · altos · ténors · basses"],
];
const orchestre = (c) => [sec(header(c)), pagehead("Les artistes", "L'orchestre et le chœur", "Quatre-vingt-quatre musiciens, cent dix choristes, une équipe artistique."),
  sec(`<section class="ly-orchs pk-bleed" data-tabs data-fam="1"><div class="ly-wrap ly-or-g"><div class="ly-or-map" data-reveal>${orchSvg()}<p class="ly-small">Disposition de l'orchestre, vue de dessus. Choisissez un pupitre.</p></div>
  <div class="ly-or-side"><div class="ly-tabs ly-tabs--v" role="group" aria-label="Choisir un pupitre">${FAMS.map((x, i) => `<a class="ly-tab${i ? "" : " is-on"}" href="#${x[0]}" data-tab="${x[0]}"><b>${x[1]}</b><span>${x[2]} ${x[0] === "choeur" ? "choristes" : "musiciens"}</span></a>`).join("")}</div>
  <div class="ly-panels">${FAMS.map((x) => `<article class="ly-fp" data-panel="${x[0]}"><h2 class="ly-h2">${x[1]}</h2><p class="ly-big"><span data-count="${x[2]}">${x[2]}</span> ${x[0] === "choeur" ? "choristes" : "musiciens"}</p><p>${x[3]}</p><p class="ly-small">${x[4]}</p></article>`).join("")}</div></div></div></section>`),
  sec(`<section class="ly-team pk-bleed"><div class="ly-wrap"><div class="ly-actno" data-reveal><span>Distribution</span>${orn}</div><h2 class="ly-h2" data-reveal>L'équipe artistique</h2>
  <dl class="ly-credits" data-reveal>${[["Directrice musicale", "Hélène Marchetti"], ["Chef de chœur", "Anselme Ferrand"], ["Violon solo", "Théo Garnier"], ["Alto solo", "Mathilde Brunel"], ["Violoncelle solo", "Pablo Reyes"], ["Flûte solo", "Aurélie Sauvage"], ["Cor solo", "Étienne Marchal"], ["Timbalier solo", "Louis Verdier"], ["Pianiste du chœur", "Marc Delorme"], ["Régie générale", "Nadia Kerlau"]].map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join("")}</dl></div></section>`),
  sec(`<section class="ly-voices pk-bleed"><div class="ly-wrap ly-vo-g"><div data-reveal><h2 class="ly-h2">Le chœur, quatre voix</h2><p>Le chœur de la Lyre réunit des chanteurs amateurs et professionnels. Il prépare chaque programme pendant douze semaines de répétitions, le mardi soir.</p><p>Les auditions de rentrée sont présentées à titre d'exemple dans cette démonstration : pour en savoir plus, écrivez-nous.</p><a class="ly-lnk" href="/contact">Écrire au chœur<span aria-hidden="true"> →</span></a></div>
  <svg class="ly-vbars" viewBox="0 0 320 180" role="img" aria-label="Répartition du chœur : sopranos 32, altos 28, ténors 22, basses 28"><title>Répartition des voix</title>${[["Sopranos", 32], ["Altos", 28], ["Ténors", 22], ["Basses", 28]].map(([n, v], i) => `<rect x="${20 + i * 76}" y="${160 - v * 4.4}" width="56" height="${v * 4.4}" class="ly-vb ly-vb${i}"/><path d="M${20 + i * 76} 160h56" stroke="#e0c58a" stroke-width="1.5"/>`).join("")}</svg>
  <ul class="ly-vlist" data-reveal><li><b>32</b> sopranos</li><li><b>28</b> altos</li><li><b>22</b> ténors</li><li><b>28</b> basses</li></ul></div></section>`),
  sec(footer(c))];

// ---------- Salle ----------
const salle = (c) => [sec(header(c)), pagehead("Le Palais des Lumières", "La salle et le plan", "Choisissez votre catégorie sur le plan : le récapitulatif part ensuite vers le formulaire de contact."), sec(planner()),
  sec(`<section class="ly-info pk-bleed"><div class="ly-wrap"><div class="ly-actno" data-reveal><span>Venir au concert</span>${orn}</div><div class="ly-info-g">
  <article data-reveal><h3>Accès</h3><p>Tramway, arrêt « Opéra », à deux minutes à pied. Parking public place de la Comédie, à cinq minutes.</p></article>
  <article data-reveal><h3>Accessibilité</h3><p>Places pour fauteuil roulant à l'orchestre, ascenseur vers les balcons, boucle magnétique : prévenez la billetterie.</p></article>
  <article data-reveal><h3>Ouverture des portes</h3><p>Une heure avant le concert. Le placement se fait jusqu'à dix minutes avant le début ; ensuite, selon l'œuvre en cours.</p></article>
  <article data-reveal><h3>Vestiaire et bar</h3><p>Vestiaire gratuit. Le foyer propose boissons et petites collations avant le concert et à l'entracte.</p></article></div></div></section>`),
  sec(footer(c))];

// ---------- Contact, recherche, introuvable ----------
const contact = (c) => [sec(header(c)), pagehead("Billetterie et renseignements", "Contact", "Une demande de places, une question, un projet : écrivez-nous."),
  sec(`<section class="ly-ct pk-bleed"><div class="ly-wrap ly-ct-g"><div class="ly-recapbox" data-recapbox data-reveal><p class="ly-kicker">Votre demande de places</p><p data-recap-empty>Vous n'avez pas encore choisi de places. <a href="/salle">Composer ma soirée sur le plan</a>.</p><div data-recap-full hidden><p class="ly-recap-c" data-rc2></p><ul class="ly-recap-l" data-rl2></ul><p class="ly-recap-t">Total indicatif <b data-rt2></b></p><p class="ly-small">Recopiez ce récapitulatif dans votre message (il est aussi prérempli si le champ le permet).</p></div></div>
  <address class="ly-addr" data-reveal><b>Palais des Lumières</b><br>8 place de l'Opéra<br>Billetterie : mardi au samedi, 11 h – 18 h<br><a href="mailto:billetterie@lyre.example">billetterie@lyre.example</a><br><small>Adresse et coordonnées fictives, pour la démonstration.</small></address></div></section>`),
  { type: "form", heading: "Écrire à la billetterie", intro: "Indiquez le concert, le nombre de places et la catégorie souhaitée : nous vous répondons sous deux jours ouvrés." }, sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une œuvre, un artiste ?", "Concerts, compositeurs, solistes, informations pratiques."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher un concert, un compositeur…" } }] },
  sec(`<section class="ly-sugg pk-bleed"><div class="ly-wrap"><p class="ly-kicker">Pour commencer</p><div class="ly-chips"><a class="ly-chip" href="/saison">La saison</a><a class="ly-chip" href="/concert">Fiches concerts</a><a class="ly-chip" href="/orchestre">Orchestre et chœur</a><a class="ly-chip" href="/salle">Plan de salle</a></div></div></section>`), sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="ly-404 pk-bleed"><svg class="ly-404-s" viewBox="0 0 200 120" aria-hidden="true"><path d="M20 118V50a80 70 0 0 1 160 0v68" fill="none" stroke="currentColor" stroke-width="2"/><path d="M40 118V54a60 52 0 0 1 120 0v64" fill="none" stroke="currentColor" stroke-width="1" opacity=".5"/><path d="M100 4v30" stroke="currentColor" stroke-width="2"/><circle cx="100" cy="42" r="6" fill="currentColor" opacity=".35"/></svg><p class="ly-kicker">Salle éteinte</p><div class="ly-h1" role="heading" aria-level="1">Page introuvable</div>${orn}<p class="ly-ph-sub">Cette page n'existe pas ou a changé d'adresse. Revenons au hall.</p><div class="ly-acts ly-acts--c"><a class="ly-btn" href="/">Retour à l'accueil</a><a class="ly-btn ly-btn--ghost" href="/saison">Voir la saison</a></div></section>`), sec(footer(c))];

module.exports = {
  key: "lyrique", name: "Lyrique", version: "2.0.0", category: "evenement", tags: ["sombre", "luxe", "classique"], siteType: "Orchestre, chœur et opéra", featured: true,
  concept: "Une salle d'opéra à la tombée de la nuit : portique à colonnes, lustre qui s'allume, programme de soirée en liste à droite, saison filtrable et plan de salle.",
  description: "Orchestre et opéra : bleu-nuit profond et or champagne, portique et lustre dessinés, faisceaux de lumière, programme latéral, saison filtrable avec fiches-programmes, plan de salle avec choix des catégories de places.",
  brand: "Orchestre & Chœur de la Lyre", modules: ["formulaires", "recherche"],
  dna: { header: "programme-de-soiree-en-liste-verticale-laterale-droite", hero: "portique-a-colonnes-lustre-qui-s-allume-et-faisceaux", grid: "colonnes-lyriques-a-chapiteau-et-saison-en-rangees", motion: "lustre-qui-s-allume-faisceaux-respirants-et-poussieres-de-lumiere", shapes: "colonnes-cannelees-arcs-de-proscenium-lyre-et-filets-or", rhythm: "actes-en-chiffres-romains-et-entractes-de-partition", signature: "saison-filtrable-fiche-programme-et-plan-de-salle-par-categories" },
  tokens: {
    colors: { primary: "#e0c58a", secondary: "#0a1130", accent: "#f1e3b8", background: "#060a1e", surface: "#0d1535", text: "#f1ead8", muted: "#a9afc6", success: "#7fd1a0", warning: "#e0b25a", error: "#ff8f8f" },
    fonts: { heading: "font.marcellus", body: "font.proza-libre", button: "font.marcellus", link: "font.proza-libre" },
    radius: { sm: 0, md: 2, lg: 2, button: 0, field: 2, card: 0 }, shadow: { card: "0 20px 50px rgba(0,0,0,.5)", button: "none" }, border: { width: 1, color: "#e0c58a" },
    type: { h1: { size: 64, weight: 400, lineHeight: 1.08, transform: "uppercase" }, h2: { size: 34, weight: 400, lineHeight: 1.15, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Or du décor", type: "color", default: "#e0c58a" },
    { key: "nuit", label: "Bleu de la nuit", type: "color", default: "#060a1e" },
    { key: "faisceaux", label: "Faisceaux de lumière", type: "choice", default: "on", choices: [["on", "Visibles"], ["off", "Masqués"]] },
    { key: "rail", label: "Programme à droite", type: "choice", default: "fixed", choices: [["fixed", "Fixé à l'écran"], ["flow", "Défile avec la page"]] },
    { key: "ornement", label: "Ornements dorés", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Discrets"]] },
  ],
  menu: [["Accueil", "/"], ["Saison", "/saison"], ["Fiche concert", "/concert"], ["Orchestre et chœur", "/orchestre"], ["La salle", "/salle"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "saison", name: "Saison", render: saison }, { key: "concert", name: "Fiche concert", render: concert },
    { key: "orchestre", name: "Orchestre et chœur", render: orchestre }, { key: "salle", name: "La salle", render: salle }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
