// Le Verger — coworking et tiers-lieu. Direction artistique : plan d'architecte joyeux. Vert pomme, bois clair, noir encre et touches de corail ;
// plan isométrique de l'espace dessiné en SVG, mobilier en aplats, étiquettes de communauté, pastilles collantes, simulateur de réservation (démonstration) et plan interactif.
const { sec, form, esc, nav } = require("../kit");

const AP = "#9bd13d", APD = "#4f8a1c", COR = "#ff6b57", INK = "#17181a", WOOD = "#ecd3a3", WOODD = "#c99a5b", CREAM = "#fbf3e2";

/* ---------- moteur isométrique (dessin du plan) ---------- */
const OX = 280, OY = 62, SX = 26, SY = 15, VW = 680, VH = 450;
const P = (x, y, z = 0) => [+((x - y) * SX + OX).toFixed(1), +((x + y) * SY - z + OY).toFixed(1)];
const pts = (a) => a.map((p) => p.join(",")).join(" ");
const shade = (hex, f) => {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (f < 1) { r *= f; g *= f; b *= f; } else { r += (255 - r) * (f - 1); g += (255 - g) * (f - 1); b += (255 - b) * (f - 1); }
  return "#" + [r, g, b].map((v) => Math.round(Math.min(255, v)).toString(16).padStart(2, "0")).join("");
};
const floor = (x, y, w, d, c, z = 0) => `<polygon points="${pts([P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)])}" fill="${c}"/>`;
const box = (x, y, w, d, h, c, z = 0, op = 1) => `<g${op < 1 ? ` opacity="${op}"` : ""}><polygon points="${pts([P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x, y + d, z)])}" fill="${shade(c, 0.82)}"/><polygon points="${pts([P(x + w, y, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x + w, y, z)])}" fill="${shade(c, 0.66)}"/><polygon points="${pts([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)])}" fill="${c}"/></g>`;
const round = (x, y, r, h, c, z = 0) => { const [cx, cy] = P(x, y, z + h), rx = +(r * SX * 1.414).toFixed(1), ry = +(r * SY * 1.414).toFixed(1); return `<ellipse cx="${cx}" cy="${cy + h}" rx="${rx}" ry="${ry}" fill="${shade(c, 0.7)}"/><rect x="${+(cx - rx).toFixed(1)}" y="${cy}" width="${+(rx * 2).toFixed(1)}" height="${h}" fill="${shade(c, 0.78)}"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c}"/>`; };
const plant = (x, y, s = 1) => { const [cx, cy] = P(x, y, 8); return box(x - 0.28, y - 0.28, 0.56, 0.56, 8, COR) + `<circle cx="${cx}" cy="${+(cy - 8 * s).toFixed(1)}" r="${+(11 * s).toFixed(1)}" fill="${APD}"/><circle cx="${+(cx - 7 * s).toFixed(1)}" cy="${+(cy - 15 * s).toFixed(1)}" r="${+(8 * s).toFixed(1)}" fill="${AP}"/><circle cx="${+(cx + 7 * s).toFixed(1)}" cy="${+(cy - 18 * s).toFixed(1)}" r="${+(7 * s).toFixed(1)}" fill="${shade(AP, 1.25)}"/>`; };
const win = (axis, a, b, z1, z2) => `<polygon points="${pts(axis === "y" ? [P(a, 0, z1), P(b, 0, z1), P(b, 0, z2), P(a, 0, z2)] : [P(0, a, z1), P(0, b, z1), P(0, b, z2), P(0, a, z2)])}" fill="#d6edf2"/>`;
const desk = (x, y, c = WOOD) => box(x, y, 2.2, 1, 9, c) + box(x + 0.7, y + 0.15, 0.8, 0.5, 1.6, INK, 9) + box(x + 0.7, y + 1.35, 0.8, 0.8, 5, COR);
const deskAp = (x, y) => box(x, y, 2.2, 1, 9, WOOD) + box(x + 0.7, y + 0.15, 0.8, 0.5, 1.6, INK, 9) + box(x + 0.7, y + 1.35, 0.8, 0.8, 5, AP);

// Le plan complet. Chaque zone est un groupe « g » portant data-zone : survol et clic gérés par motion.js.
const plan = (cls = "") => {
  const zones = {
    open: floor(0, 0, 7.6, 5.4, "#dff0b0") + deskAp(0.7, 0.8) + deskAp(3.7, 0.8) + desk(0.7, 3.2) + desk(3.7, 3.2) + box(6.2, 1.4, 0.9, 2.2, 7, COR) + box(6.2, 1.4, 0.9, 2.2, 3, CREAM, 7) + plant(7, 0.6, 0.9),
    cafe: floor(0, 6, 4.6, 4, "#fff0c4") + box(0.4, 6.4, 3.6, 0.9, 12, INK) + box(0.4, 6.4, 3.6, 0.9, 1.4, AP, 12) + round(1, 8.4, 0.3, 6, COR) + round(2.2, 8.4, 0.3, 6, COR) + round(2.4, 9.1, 0.8, 8, WOOD) + plant(0.7, 9.4, 1.1),
    prive: floor(8, 0, 6, 4, "#f1dcb6") + box(8, 0, 0.25, 4, 22, WOODD) + box(10.9, 0, 0.2, 2.6, 12, "#ffffff", 0, 0.5) + desk(8.7, 0.8) + desk(11.4, 0.8, WOOD) + box(8.4, 2.9, 1.4, 0.5, 7, AP) + box(13.2, 0.1, 0.6, 1.8, 20, WOODD) + box(8, 3.75, 6, 0.25, 8, "#ffffff", 0, 0.45),
    cabine: floor(5.1, 6, 2.4, 2.4, "#3b3e44") + box(5.1, 6, 0.15, 2.4, 20, INK) + box(5.1, 6, 2.4, 0.15, 20, INK) + box(5.8, 6.4, 1.2, 0.7, 7, WOOD) + box(5.1, 8.35, 2.4, 0.15, 7, "#ffffff", 0, 0.5) + box(6.2, 7.4, 0.6, 0.6, 4, AP),
    reunion: floor(8, 5, 6, 5, "#ffd0c7") + box(8, 5, 0.25, 5, 24, WOODD) + box(10, 5.05, 2.8, 0.15, 14, INK, 7) + box(9.6, 6.5, 3.8, 2, 9, CREAM) + [0, 1, 2].map((i) => box(9.9 + i * 1.3, 8.7, 0.8, 0.8, 5, i === 1 ? AP : COR)).join("") + [0, 1, 2].map((i) => box(9.9 + i * 1.3, 5.6, 0.8, 0.8, 5, i === 1 ? COR : AP)).join("") + plant(13.4, 9.3, 1),
  };
  const order = ["open", "cafe", "prive", "cabine", "reunion"];
  const shell = box(-0.4, -0.4, 14.8, 10.8, 6, WOODD, -6) + floor(-0.4, -0.4, 14.8, 10.8, WOOD) + box(-0.4, -0.4, 14.8, 0.4, 36, CREAM) + box(-0.4, 0, 0.4, 10.4, 36, shade(CREAM, 0.93)) +
    win("y", 1.5, 3.5, 14, 30) + win("y", 5, 7, 14, 30) + win("y", 9.4, 11.6, 14, 30) + win("x", 1.8, 3.8, 14, 30) + win("x", 6, 8, 14, 30);
  return `<svg class="tl-plan-svg ${cls}" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Plan isométrique du Verger : open space, bureaux privés, salle de réunion, café et cabine d'appel"><title>Plan du Verger</title><g class="tl-shell">${shell}</g>${order.map((k) => `<g class="tl-z tl-z--${k}" data-zone="${k}">${zones[k]}</g>`).join("")}</svg>`;
};
const pin = (zone, x, y, z, label, cls = "") => { const [px, py] = P(x, y, z); return `<a class="tl-pin ${cls}" href="#zone-${zone}" data-zone="${zone}" data-px="${(px / VW * 100).toFixed(1)}" data-py="${(py / VH * 100).toFixed(1)}">${esc(label)}</a>`; };
const tag = (label, x, y, z, cls = "") => { const [px, py] = P(x, y, z); return `<span class="tl-float ${cls}" data-px="${(px / VW * 100).toFixed(1)}" data-py="${(py / VH * 100).toFixed(1)}" aria-hidden="true">${esc(label)}</span>`; };

/* ---------- petites illustrations de mobilier en aplats (64 × 64) ---------- */
const ICO = {
  desk: `<rect x="6" y="26" width="52" height="7" rx="3" fill="${WOODD}"/><rect x="10" y="33" width="5" height="19" fill="${INK}"/><rect x="49" y="33" width="5" height="19" fill="${INK}"/><rect x="22" y="12" width="20" height="14" rx="3" fill="${INK}"/><rect x="25" y="15" width="14" height="8" rx="1.5" fill="${AP}"/>`,
  chair: `<path d="M20 8h18a4 4 0 0 1 4 4v18H16V12a4 4 0 0 1 4-4z" fill="${COR}"/><rect x="14" y="32" width="30" height="8" rx="4" fill="${INK}"/><rect x="27" y="40" width="4" height="12" fill="${INK}"/><rect x="16" y="52" width="26" height="4" rx="2" fill="${INK}"/>`,
  lamp: `<path d="M18 30 26 10h12l8 20z" fill="${AP}"/><rect x="30" y="30" width="4" height="22" fill="${INK}"/><ellipse cx="32" cy="54" rx="12" ry="4" fill="${INK}"/><circle cx="48" cy="14" r="5" fill="${COR}"/>`,
  mug: `<rect x="12" y="20" width="30" height="30" rx="7" fill="${COR}"/><path d="M42 26h5a7 7 0 0 1 0 14h-5" fill="none" stroke="${COR}" stroke-width="5"/><rect x="12" y="20" width="30" height="7" rx="3.5" fill="${shade(COR, 0.8)}"/><path d="M22 8c-3 4 3 5 0 9M31 8c-3 4 3 5 0 9" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
  shelf: `<rect x="10" y="8" width="44" height="48" rx="3" fill="${WOODD}"/><rect x="14" y="12" width="36" height="18" fill="${CREAM}"/><rect x="14" y="34" width="36" height="18" fill="${CREAM}"/><rect x="17" y="16" width="5" height="14" fill="${COR}"/><rect x="24" y="19" width="5" height="11" fill="${AP}"/><rect x="31" y="15" width="5" height="15" fill="${INK}"/><circle cx="43" cy="44" r="6" fill="${APD}"/><rect x="17" y="44" width="14" height="8" fill="${AP}"/>`,
  plant: `<path d="M22 38h20l-3 18H25z" fill="${COR}"/><path d="M32 38C20 36 14 24 18 12c10 2 14 12 14 26z" fill="${APD}"/><path d="M32 38c12-2 18-14 14-26-10 2-14 12-14 26z" fill="${AP}"/><path d="M32 38c-3-10-1-20 0-28 3 8 4 18 0 28z" fill="${shade(AP, 1.2)}"/>`,
};
const ico = (k) => `<svg class="tl-ico" viewBox="0 0 64 64" aria-hidden="true">${ICO[k]}</svg>`;
const apple = `<svg class="tl-apple" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 14c-5-5-16-3-16 10 0 11 7 20 11 20 2 0 3-1 5-1s3 1 5 1c4 0 11-9 11-20 0-13-11-15-16-10z" fill="${AP}"/><path d="M24 14c1-5 3-8 7-10" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M27 9c3-4 8-4 11-2-1 4-6 6-11 2z" fill="${COR}"/></svg>`;
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const star = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.4 7.6H22l-6.2 4.6 2.4 7.8L12 17.4 5.8 22l2.4-7.8L2 9.6h7.6z" fill="currentColor"/></svg>`;

/* ---------- données de démonstration ---------- */
const SPACES = [
  { k: "open", name: "Open space et postes flex", cat: "poste", cap: "24 postes", free: "9 postes libres aujourd'hui", pct: 37, days: [2, 2, 1, 2, 1], rate: "18 € / jour", tags: ["Fibre 1 Gb/s", "Prises à chaque poste", "Lumière naturelle"], txt: "Le cœur du Verger : de longues tables en bois, des plantes partout et un fond sonore juste assez vivant. On s'installe où l'on veut, on range en partant." , ico: "desk" },
  { k: "fixe", name: "Postes fixes", cat: "poste", cap: "10 postes", free: "2 postes libres", pct: 80, days: [0, 0, 1, 0, 1], rate: "20 € / jour", tags: ["Casier personnel", "Écran fourni", "Accès 7 j/7"], txt: "Votre place, vos affaires, votre plante. Idéal quand on vient trois jours ou plus par semaine et qu'on aime retrouver son coin.", ico: "lamp" },
  { k: "prive", name: "Bureaux privés", cat: "prive", cap: "6 bureaux de 2 à 6 personnes", free: "1 bureau libre dès janvier", pct: 83, days: [0, 0, 0, 0, 0], rate: "62 € / jour", tags: ["Cloisons vitrées", "Clé personnelle", "Adresse postale"], txt: "Une porte qui ferme, une vue sur l'open space. Pour les petites équipes qui veulent de la discrétion sans quitter la communauté.", ico: "shelf" },
  { k: "reunion", name: "Salle Tilleul", cat: "salle", cap: "12 personnes", free: "Libre demain après-midi", pct: 45, days: [2, 1, 2, 2, 1], rate: "90 € / jour", tags: ["Écran 4K", "Tableau blanc", "Thé à volonté"], txt: "Une grande table ronde, un écran et des chaises coralines. Réunions, ateliers, séminaires d'équipe ou repas de fin de projet.", ico: "chair" },
  { k: "cabine", name: "Cabines d'appel", cat: "salle", cap: "3 cabines, 1 personne", free: "2 cabines libres", pct: 33, days: [2, 2, 2, 1, 2], rate: "12 € / jour", tags: ["Isolation phonique", "Éclairage doux", "Sur le pouce"], txt: "Pour l'appel qui ne peut pas attendre ou la visio qui demande du silence. Aucune réservation compliquée : on y entre quand la lumière est verte.", ico: "mug" },
  { k: "cafe", name: "Café et cuisine commune", cat: "commun", cap: "Accès inclus pour les membres", free: "Toujours ouvert aux membres", pct: 0, days: [2, 2, 2, 2, 2], rate: "Inclus", tags: ["Café et thé", "Frigo partagé", "Déjeuner du jeudi"], txt: "Le vrai centre de gravité : la grande table, le comptoir et le fameux déjeuner partagé du jeudi, où l'on goûte, on discute et parfois on collabore.", ico: "plant" },
];
const AV = ["Libre", "Presque complet", "Complet"];
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven"];
const strip = (d) => `<span class="tl-week" role="img" aria-label="Disponibilité de lundi à vendredi : ${d.map((v, i) => `${DAYS[i]} ${AV[v === 2 ? 0 : v === 1 ? 1 : 2].toLowerCase()}`).join(", ")}">${d.map((v, i) => `<i class="tl-d${v === 2 ? "0" : v === 1 ? "1" : "2"}"><b>${DAYS[i][0]}</b></i>`).join("")}</span>`;
const spaceRow = (s) => `<li class="tl-srow" data-cat="${s.cat}" data-reveal><div class="tl-srow-ico">${ico(s.ico)}</div><div class="tl-srow-main"><h3>${esc(s.name)}</h3><p>${esc(s.txt)}</p><ul class="tl-tags">${s.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div><div class="tl-srow-meta"><b class="tl-cap">${esc(s.cap)}</b>${strip(s.days)}<span class="tl-free">${esc(s.free)}</span><span class="tl-meter" aria-hidden="true"><i class="tl-meter-i tl-w${Math.round(s.pct / 10)}"></i></span></div><div class="tl-srow-go"><span class="tl-rate">${esc(s.rate)}</span><a class="tl-btn tl-btn--ink tl-btn--sm" href="/tarifs">Estimer</a></div></li>`;

const MEMBERS = [
  ["Camille", "Graphiste et illustratrice", "design", "Je dessine des marques et des plans de quartier. Spécialiste du café filtre.", "#design"],
  ["Idriss", "Développeur web indépendant", "tech", "Sites accessibles pour les assos du coin. Répond aux questions sur le wifi.", "#tech"],
  ["Salomé", "Céramiste", "artisanat", "Atelier dans l'arrière-cour, tasses et carreaux. Cuit les cookies du vendredi.", "#artisanat"],
  ["Mehdi", "Traducteur", "ecriture", "Anglais, espagnol, arabe. Relit vos mails importants le mardi matin.", "#écriture"],
  ["Inès", "Coach en organisation", "gestion", "Aide les petites équipes à y voir clair dans leurs journées.", "#gestion"],
  ["Paul", "Menuisier", "artisanat", "Fabrique des meubles sur mesure, dont la moitié des tables du Verger.", "#artisanat"],
  ["Lucie", "Journaliste pigiste", "ecriture", "Reportages sur les villes qui changent. Anime l'atelier d'écriture du mois.", "#écriture"],
  ["Yanis", "Vidéaste", "image", "Films courts pour associations. Prête volontiers son trépied.", "#image"],
  ["Zoé", "Comptable de TPE", "gestion", "Rend la compta lisible. Tient la permanence « factures » du jeudi.", "#gestion"],
];
const AVC = [AP, COR, WOOD, "#ffd9a0", AP, COR];
const memberCard = (m, i) => `<article class="tl-mem" data-cat="${m[2]}" data-reveal><span class="tl-av tl-av--${i % 6}" data-i="${m[0][0]}" aria-hidden="true"></span><div><h3>${m[0]}</h3><p class="tl-role">${m[1]}</p><p>${m[3]}</p><span class="tl-label">${m[4]}</span></div></article>`;

const EVENTS = [
  ["2026-11-12", "Jeu.", "12", "nov.", "18 h 30", "Facturer sans stress", "atelier", "Un atelier pratique pour freelances : devis, factures et relances, avec une comptable du Verger.", "Gratuit pour les membres"],
  ["2026-11-17", "Mar.", "17", "nov.", "8 h 30", "Petit-déjeuner des nouveaux", "rencontre", "On accueille les arrivants autour de viennoiseries et on fait le tour des bonnes adresses.", "Ouvert à tous"],
  ["2026-11-21", "Sam.", "21", "nov.", "10 h 00", "Repair café : réparer plutôt que jeter", "atelier", "Apportez votre grille-pain fatigué, nos bricoleurs bénévoles regardent ensemble ce qui peut être sauvé.", "Entrée libre"],
  ["2026-11-26", "Jeu.", "26", "nov.", "14 h 00", "Premiers pas avec les outils sans code", "formation", "Trois heures pour construire un petit site ou un formulaire sans écrire une ligne de code.", "Places limitées"],
  ["2026-12-03", "Jeu.", "3", "déc.", "19 h 00", "Soirée jeux de société et soupe", "soiree", "Soupe maison, jeux sortis du placard et défis amicaux entre les bureaux privés.", "Entrée libre"],
  ["2026-12-10", "Jeu.", "10", "déc.", "18 h 00", "Démo des projets de l'automne", "rencontre", "Cinq membres présentent en dix minutes ce qu'ils ont construit. Questions, critiques, applaudissements.", "Ouvert à tous"],
  ["2027-01-16", "Sam.", "16", "janv.", "10 h 00", "Photo de produit avec son téléphone", "atelier", "Lumière, fond, cadrage : on photographie ses créations avec ce qu'on a dans la poche.", "Matériel prêté"],
  ["2027-01-21", "Jeu.", "21", "janv.", "18 h 30", "Vœux et galette du Verger", "soiree", "La traditionnelle galette de début d'année, avec la remise des fèves en céramique de Salomé.", "Entrée libre"],
];
const EVL = { atelier: "Atelier", rencontre: "Rencontre", soiree: "Soirée", formation: "Formation" };
const eventRow = (e) => `<li class="tl-ev" data-cat="${e[6]}" data-reveal><time class="tl-date" datetime="${e[0]}"><small>${e[1]}</small><b>${e[2]}</b><span>${e[3]}</span></time><div class="tl-ev-b"><span class="tl-label tl-label--${e[6]}">${EVL[e[6]]}</span><h3>${esc(e[5])}</h3><p>${esc(e[7])}</p></div><div class="tl-ev-m"><span>${e[4]}</span><span>${esc(e[8])}</span><a class="tl-link" href="/contact">Demander une place ${arrow}</a></div></li>`;
const eventMini = (e) => `<li class="tl-evm" data-reveal><time class="tl-date tl-date--s" datetime="${e[0]}"><b>${e[2]}</b><span>${e[3]}</span></time><div><span class="tl-label tl-label--${e[6]}">${EVL[e[6]]}</span><h3>${esc(e[5])}</h3><p>${e[4]} · ${esc(e[8])}</p></div></li>`;

const filters = (items, cur = "all", total = "") => `<div class="tl-filters" role="group" aria-label="Filtrer" data-filters>${items.map(([k, l]) => `<a href="#f-${k}" role="button" aria-pressed="${k === cur}" data-filter="${k}" class="tl-pill${k === cur ? " is-on" : ""}">${esc(l)}</a>`).join("")}</div>${total ? `<p class="tl-count" data-fcount aria-live="polite">${total}</p>` : ""}`;

/* ---------- en-tête et pied ---------- */
const header = (c) => `<header class="tl-head pk-bleed"><div class="tl-bar">
  <a class="tl-logo" href="/" aria-label="${esc(c.brand)} — accueil">${apple}<span>Le Verger<small>coworking et tiers-lieu</small></span></a>
  <div class="tl-pills" role="navigation" aria-label="Navigation principale">${nav(c.menu.slice(0, -1), "tl-nv")}</div>
  <a class="tl-btn tl-btn--coral tl-hcta" href="/contact">Passer nous voir</a>
  <details class="tl-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="tl-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu, "tl-dl")}<a class="tl-btn tl-btn--coral tl-btn--lg" href="/contact">Passer nous voir</a></div></details>
</div></header>`;

const footer = (c) => `<footer class="tl-foot pk-bleed"><div class="tl-wrap"><div class="tl-foot-top"><div class="tl-foot-brand">${apple}<p class="tl-foot-lead">Un endroit pour travailler, se croiser et fabriquer ensemble.</p><address>12 rue du Pommier<br>69007 Lyon<br><a href="mailto:bonjour@leverger.example">bonjour@leverger.example</a></address></div>
  <div><h2 class="tl-fh">Le lieu</h2>${nav(c.menu.slice(1, 4), "tl-fl")}</div><div><h2 class="tl-fh">Vie du Verger</h2><a class="tl-fl" href="/evenements">Événements</a><a class="tl-fl" href="/a-propos">À propos</a><a class="tl-fl" href="/faq">FAQ</a></div><div><h2 class="tl-fh">Écrire</h2><a class="tl-fl" href="/contact">Contact</a><a class="tl-fl" href="/recherche">Recherche</a><p class="tl-open">Ouvert du lundi au samedi,<br>8 h à 20 h</p></div></div>
  <p class="tl-legal">© Le Verger — site de démonstration. Lieu, membres, événements et tarifs fictifs : aucune réservation n'est enregistrée.</p></div></footer>`;

const pagehead = (kicker, title, sub, art = "") => sec(`<section class="tl-ph pk-bleed"><div class="tl-wrap tl-ph-in"><div><p class="tl-kicker" data-reveal>${esc(kicker)}</p><div class="tl-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="tl-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div>${art ? `<div class="tl-ph-art" aria-hidden="true">${art}</div>` : ""}</div></section>`);

/* ---------- simulateur de réservation (démonstration) ---------- */
const simulator = () => `<section class="tl-sim pk-bleed"><div class="tl-wrap tl-sim-in" data-sim>
  <div class="tl-sim-ctl">
    <div class="tl-step"><h3 class="tl-step-t"><b>1</b> Quel espace ?</h3><div class="tl-opts" role="radiogroup" aria-label="Type d'espace" data-sim-type>
      <a href="#t-flex" role="radio" aria-checked="true" data-v="Poste flex" data-r="18" data-cap="8" data-mode="pp">Poste flex<small>18 € / jour / pers.</small></a>
      <a href="#t-fixe" role="radio" aria-checked="false" data-v="Poste fixe" data-r="20" data-cap="6" data-mode="pp">Poste fixe<small>20 € / jour / pers.</small></a>
      <a href="#t-prive" role="radio" aria-checked="false" data-v="Bureau privé" data-r="62" data-cap="6" data-mode="room" data-extra="10" data-from="4">Bureau privé<small>62 € / jour, jusqu'à 4</small></a>
      <a href="#t-salle" role="radio" aria-checked="false" data-v="Salle Tilleul" data-r="90" data-cap="12" data-mode="room" data-extra="0" data-from="12">Salle Tilleul<small>90 € / jour, 12 max.</small></a>
      <a href="#t-cabine" role="radio" aria-checked="false" data-v="Cabine d'appel" data-r="12" data-cap="1" data-mode="room" data-extra="0" data-from="1">Cabine d'appel<small>12 € / jour</small></a></div></div>
    <div class="tl-step"><h3 class="tl-step-t"><b>2</b> Quels jours ?</h3><div class="tl-days" role="group" aria-label="Jours de présence" data-sim-days>
      ${DAYS.map((d, i) => `<a href="#j-${d.toLowerCase()}" role="checkbox" aria-checked="${[1, 2, 3].includes(i)}" data-v="${d}">${d}</a>`).join("")}</div></div>
    <div class="tl-step"><h3 class="tl-step-t"><b>3</b> Combien de personnes ?</h3><div class="tl-stepper" data-sim-people><a href="#moins" role="button" aria-label="Retirer une personne">−</a><span class="tl-n" aria-live="polite">1</span><a href="#plus" role="button" aria-label="Ajouter une personne">+</a><small data-cap-note>8 personnes au maximum</small></div></div>
    <div class="tl-step"><h3 class="tl-step-t"><b>4</b> Pour combien de temps ?</h3><div class="tl-opts tl-opts--3" role="radiogroup" aria-label="Durée" data-sim-dur>
      <a href="#d-1" role="radio" aria-checked="true" data-v="1 semaine" data-w="1" data-off="0">1 semaine<small>tarif plein</small></a>
      <a href="#d-4" role="radio" aria-checked="false" data-v="1 mois (4 semaines)" data-w="4" data-off="10">1 mois<small>10 % de remise</small></a>
      <a href="#d-13" role="radio" aria-checked="false" data-v="3 mois (13 semaines)" data-w="13" data-off="18">3 mois<small>18 % de remise</small></a></div></div>
  </div>
  <aside class="tl-sim-out" aria-label="Récapitulatif de la simulation"><p class="tl-out-k">Estimation de démonstration</p><p class="tl-out-n"><span data-out-total>—</span><small> € HT</small></p><p class="tl-out-sub" data-out-sub aria-live="polite"></p>
    <ul class="tl-recap"><li><span>Espace</span><b data-r-type></b></li><li><span>Jours</span><b data-r-days></b></li><li><span>Personnes</span><b data-r-people></b></li><li><span>Durée</span><b data-r-dur></b></li></ul>
    <a class="tl-btn tl-btn--coral tl-btn--block" href="/contact" data-sim-go>Envoyer ce récapitulatif ${arrow}</a><a class="tl-link tl-link--c" href="#copier" data-sim-copy>Copier le récapitulatif</a>
    <p class="tl-fine" data-sim-msg role="status"></p><p class="tl-fine">Tarifs fictifs. Aucune réservation n'est enregistrée : le récapitulatif est repris dans le formulaire de contact.</p></aside>
</div></section>`;

/* ---------- plan interactif ---------- */
const ZONES = [
  ["open", "Open space", "Lumière du sud, 24 postes sur de longues tables en bois. On s'installe où l'on veut.", "24 postes · 9 libres", "À partir de 18 € / jour"],
  ["cafe", "Café et cuisine", "Le comptoir, la grande table, la machine à café qui a vu des choses. Déjeuner partagé le jeudi.", "Toute la communauté", "Inclus pour les membres"],
  ["prive", "Bureaux privés", "Six bureaux vitrés de 2 à 6 personnes, avec clé personnelle et étagères sur mesure.", "6 bureaux · 1 libre", "À partir de 62 € / jour"],
  ["cabine", "Cabine d'appel", "Un cube acoustique pour la visio ou l'appel confidentiel. Trois cabines, une lumière verte quand elles sont libres.", "3 cabines · 2 libres", "12 € / jour"],
  ["reunion", "Salle Tilleul", "La grande salle ronde avec écran, tableau blanc et chaises coralines. Douze personnes à l'aise.", "12 personnes", "90 € / jour"],
];
const interactivePlan = () => `<section class="tl-planbox pk-bleed"><div class="tl-wrap tl-planbox-in" data-plan>
  <div class="tl-plan-stage"><div class="tl-plan-fig">${plan("tl-plan-big")}${ZONES.map((z) => pin(z[0], ...({ open: [3.8, 2.7, 12], cafe: [2.2, 8, 14], prive: [11, 2, 22], cabine: [6.3, 7.2, 22], reunion: [11.2, 7.5, 12] })[z[0]], z[1])).join("")}</div>
    <p class="tl-plan-hint">Survolez ou touchez une zone du plan, ou choisissez-la dans la liste.</p></div>
  <div class="tl-plan-side"><div role="group" aria-label="Zones du plan" class="tl-zlist">${ZONES.map((z, i) => `<a href="#zone-${z[0]}" data-zone="${z[0]}" role="button" aria-pressed="${i === 0}" class="tl-zbtn${i === 0 ? " is-on" : ""}"><span class="tl-zdot tl-zdot--${z[0]}" aria-hidden="true"></span>${z[1]}</a>`).join("")}</div>
    <div class="tl-zdetail" aria-live="polite">${ZONES.map((z, i) => `<article class="tl-zd" data-zone-detail="${z[0]}"${i ? " hidden" : ""}><h3>${z[1]}</h3><p>${z[2]}</p><ul class="tl-tags"><li>${z[3]}</li><li>${z[4]}</li></ul><a class="tl-link" href="/tarifs">Estimer une réservation ${arrow}</a></article>`).join("")}</div></div>
</div></section>`;

/* ---------- pages ---------- */
const home = (c) => [
  sec(header(c)),
  sec(`<section class="tl-hero pk-bleed"><div class="tl-wrap tl-hero-in">
    <div class="tl-hero-copy"><p class="tl-kicker" data-reveal>Coworking et tiers-lieu · Lyon 7e</p>
      <div class="tl-h1 tl-h1--xl" role="heading" aria-level="1" data-reveal>Travaillez <mark class="tl-mark">ensemble</mark>, chacun à son rythme.</div>
      <p class="tl-lead" data-reveal>Des postes en open space, des bureaux privés, une salle de réunion, un café où l'on se croise et une communauté qui s'entraide. Venez essayer une journée.</p>
      <div class="tl-actions" data-reveal><a class="tl-btn tl-btn--coral tl-btn--lg" href="/espaces">Découvrir les espaces ${arrow}</a><a class="tl-btn tl-btn--line tl-btn--lg" href="/tarifs">Estimer ma journée</a></div>
      <ul class="tl-facts" data-reveal><li><b data-count="6">6</b> espaces</li><li><b data-count="120">120</b> membres</li><li><b data-count="7">7</b> jours sur 7 pour les postes fixes</li></ul></div>
    <div class="tl-hero-plan" data-reveal aria-hidden="true">${plan("tl-plan-hero")}${tag("Café offert aux nouveaux", 1.5, 6.2, 32, "tl-float--coral")}${tag("9 postes libres", 3.8, 2.7, 40, "tl-float--apple")}${tag("Salle Tilleul", 11, 7.5, 34, "tl-float--ink")}${tag("#design  #tech  #artisanat", 10.5, 1.8, 46, "tl-float--wood")}</div>
  </div></section>`),
  sec(`<section class="tl-strip pk-bleed" aria-label="Communautés présentes"><div class="tl-wrap"><ul class="tl-chips"><li class="tl-label">#design</li><li class="tl-label tl-label--b">#tech</li><li class="tl-label tl-label--c">#artisanat</li><li class="tl-label">#écriture</li><li class="tl-label tl-label--c">#image</li><li class="tl-label tl-label--b">#gestion</li><li class="tl-label">#association</li><li class="tl-label tl-label--c">#cuisine</li></ul></div></section>`),
  sec(`<section class="tl-spaces pk-bleed"><div class="tl-wrap"><div class="tl-sechead"><div><p class="tl-kicker" data-reveal>Les espaces</p><h2 class="tl-h2" data-reveal>Choisissez votre place.</h2></div><a class="tl-link" href="/espaces" data-reveal>Tous les espaces ${arrow}</a></div>
    <ul class="tl-slist">${SPACES.slice(0, 3).map(spaceRow).join("")}</ul><p class="tl-note" data-reveal>Disponibilités données à titre d'exemple pour cette démonstration.</p></div></section>`),
  sec(`<section class="tl-dark pk-bleed"><div class="tl-wrap tl-dark-in"><div data-reveal><p class="tl-kicker tl-kicker--ap">Tiers-lieu</p><h2 class="tl-h2 tl-h2--w">Ni tout à fait bureau, ni tout à fait maison.</h2><p class="tl-lead tl-lead--w">Un tiers-lieu, c'est un endroit où l'on travaille, mais aussi où l'on apprend, répare, mange et rencontre. Au Verger, la cuisine est aussi importante que la fibre.</p><a class="tl-btn tl-btn--ap" href="/a-propos">Notre histoire ${arrow}</a></div>
    <ul class="tl-vals">${[["plant", "Cultiver", "Des projets, des plantes et des idées, sans pression de rendement."], ["mug", "Partager", "Le café, les outils, les contacts. La générosité est contagieuse."], ["lamp", "Éclairer", "Des ateliers ouverts au quartier, pour apprendre les uns des autres."]].map(([i, t, x]) => `<li data-reveal>${ico(i)}<h3>${t}</h3><p>${x}</p></li>`).join("")}</ul></div></section>`),
  sec(`<section class="tl-people pk-bleed"><div class="tl-wrap"><div class="tl-sechead"><div><p class="tl-kicker" data-reveal>Communauté</p><h2 class="tl-h2" data-reveal>Des voisins de bureau<br>qui s'entraident.</h2></div><a class="tl-link" href="/communaute" data-reveal>Rencontrer les membres ${arrow}</a></div>
    <div class="tl-mgrid">${MEMBERS.slice(0, 3).map(memberCard).join("")}</div><p class="tl-note">Profils fictifs, créés pour la démonstration.</p></div></section>`),
  sec(`<section class="tl-agenda pk-bleed"><div class="tl-wrap tl-agenda-in"><div data-reveal><p class="tl-kicker">Événements</p><h2 class="tl-h2">Cette fin d'année au Verger.</h2><p class="tl-muted">Ateliers, rencontres et soirées, souvent gratuits pour les membres, parfois ouverts à tout le quartier.</p><a class="tl-btn tl-btn--ink" href="/evenements">Tout l'agenda ${arrow}</a></div>
    <ul class="tl-evmini">${EVENTS.slice(0, 3).map(eventMini).join("")}</ul></div></section>`),
  sec(`<section class="tl-cta pk-bleed"><div class="tl-wrap tl-cta-in" data-reveal><div><h2 class="tl-h2">Faites un essai<br>d'une journée.</h2><p class="tl-lead">Calculez le coût d'une présence en quelques clics, puis écrivez-nous : on vous accueille avec un café.</p></div><div class="tl-actions"><a class="tl-btn tl-btn--ink tl-btn--lg" href="/tarifs">Simuler une réservation ${arrow}</a><a class="tl-btn tl-btn--line tl-btn--lg" href="/contact">Nous écrire</a></div></div></section>`),
  sec(footer(c)),
];

const espaces = (c) => [
  sec(header(c)),
  pagehead("Les espaces", "Six endroits,<br>une seule maison.", "Explorez le plan, repérez ce qui est libre cette semaine et estimez votre place.", `<svg class="tl-ph-svg" viewBox="0 0 120 90"><rect x="6" y="8" width="108" height="74" rx="14" fill="${AP}"/><rect x="16" y="18" width="46" height="30" rx="6" fill="${CREAM}"/><rect x="68" y="18" width="36" height="30" rx="6" fill="${COR}"/><rect x="16" y="54" width="26" height="18" rx="6" fill="${INK}"/><rect x="48" y="54" width="56" height="18" rx="6" fill="${WOOD}"/></svg>`),
  sec(interactivePlan()),
  sec(`<section class="tl-spaces pk-bleed" data-fscope><div class="tl-wrap"><div class="tl-sechead"><div><p class="tl-kicker" data-reveal>Disponibilités de la semaine</p><h2 class="tl-h2" data-reveal>La liste complète.</h2></div></div>
    ${filters([["all", "Tous"], ["poste", "Postes"], ["prive", "Bureaux"], ["salle", "Salles"], ["commun", "Espaces communs"]], "all", "6 espaces")}
    <ul class="tl-slist" data-fitems>${SPACES.map(spaceRow).join("")}</ul><p class="tl-note">Disponibilités données à titre d'exemple. Légende : <i class="tl-key tl-d0"></i> libre <i class="tl-key tl-d1"></i> presque complet <i class="tl-key tl-d2"></i> complet.</p></div></section>`),
  sec(`<section class="tl-incl pk-bleed"><div class="tl-wrap"><h2 class="tl-h2" data-reveal>Compris pour tout le monde.</h2><ul class="tl-inclgrid">${[["Fibre 1 Gb/s et wifi sécurisé", "lamp"], ["Café, thé et eau plate ou pétillante", "mug"], ["Imprimante et scanner partagés", "shelf"], ["Casiers et vestiaire à vélos", "chair"], ["Plantes arrosées par les membres", "plant"], ["Cuisine équipée et frigo commun", "desk"]].map(([t, i]) => `<li data-reveal>${ico(i)}<span>${t}</span></li>`).join("")}</ul></div></section>`),
  sec(footer(c)),
];

const PLANS = [
  ["Journée", "18", "€ / jour", ["Poste flex en open space", "Café et thé à volonté", "Aucun engagement"], "Pour essayer ou venir de temps en temps.", false],
  ["Carnet de 10 jours", "150", "€", ["Utilisable pendant 3 mois", "Partageable avec un collègue", "Salle Tilleul à tarif membre"], "Le choix des télétravailleurs hybrides.", true],
  ["Poste fixe", "349", "€ / mois", ["Votre bureau, votre casier", "Accès 7 jours sur 7", "Écran et lampe fournis"], "Pour s'installer vraiment.", false],
  ["Bureau privé", "890", "€ / mois", ["Pour 2 à 4 personnes", "Clé personnelle, adresse postale", "Salle Tilleul : 4 heures offertes"], "Pour les petites équipes.", false],
];
const tarifs = (c) => [
  sec(header(c)),
  pagehead("Tarifs", "Des prix simples,<br>sans lettre minuscule.", "Quatre formules, un simulateur pour compter précisément. Tous les prix sont des tarifs de démonstration.", `<svg class="tl-ph-svg" viewBox="0 0 120 90"><circle cx="60" cy="45" r="38" fill="${COR}"/><circle cx="60" cy="45" r="26" fill="${CREAM}"/><path d="M52 52c2 5 14 5 14-2 0-8-16-4-16-12 0-6 11-8 15-2" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/></svg>`),
  sec(`<section class="tl-plans pk-bleed"><div class="tl-wrap tl-plans-in">${PLANS.map(([n, p, u, l, t, hot]) => `<article class="tl-ticket${hot ? " is-hot" : ""}" data-reveal>${hot ? `<span class="tl-flag">${star} Le plus choisi</span>` : ""}<h3>${n}</h3><p class="tl-tprice"><b>${p}</b> ${u}</p><p class="tl-tdesc">${t}</p><ul>${l.map((x) => `<li>${x}</li>`).join("")}</ul><a class="tl-btn ${hot ? "tl-btn--coral" : "tl-btn--ink"} tl-btn--block" href="/contact">En parler avec nous</a></article>`).join("")}</div></section>`),
  sec(`<section class="tl-simhead pk-bleed"><div class="tl-wrap"><p class="tl-kicker" data-reveal>Simulateur</p><h2 class="tl-h2" data-reveal>Calculez votre réservation.</h2><p class="tl-muted" data-reveal>Quatre choix, une estimation immédiate. Rien n'est enregistré : à la fin, le récapitulatif part vers le formulaire de contact.</p></div></section>`),
  sec(simulator()),
  sec(`<section class="tl-cmp pk-bleed"><div class="tl-wrap"><h2 class="tl-h2" data-reveal>Comparer d'un coup d'œil.</h2><div class="tl-tablewrap" data-reveal><table class="tl-table"><caption class="tl-sr">Comparaison des formules</caption><thead><tr><th scope="col">Inclus</th><th scope="col">Journée</th><th scope="col">Carnet</th><th scope="col">Poste fixe</th><th scope="col">Bureau privé</th></tr></thead><tbody>
    ${[["Open space", "Oui", "Oui", "Oui", "Non"], ["Casier personnel", "Non", "Non", "Oui", "Oui"], ["Accès 7 jours sur 7", "Non", "Non", "Oui", "Oui"], ["Salle de réunion", "Au tarif plein", "Tarif membre", "Tarif membre", "4 h offertes"], ["Adresse postale", "Non", "Non", "En option", "Oui"]].map((r) => `<tr><th scope="row">${r[0]}</th>${r.slice(1).map((v, i) => `<td data-l="${["Journée", "Carnet", "Poste fixe", "Bureau privé"][i]}">${v}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div></section>`),
  sec(footer(c)),
];

const communaute = (c) => [
  sec(header(c)),
  pagehead("Communauté", "Une centaine de voisins,<br>mille idées de travers.", "Indépendants, petites équipes, associations et artisans. Chacun arrive avec un métier, repart avec un contact.", `<svg class="tl-ph-svg" viewBox="0 0 120 90"><circle cx="34" cy="38" r="20" fill="${AP}"/><circle cx="76" cy="30" r="16" fill="${COR}"/><circle cx="84" cy="62" r="22" fill="${WOOD}"/><circle cx="40" cy="68" r="12" fill="${INK}"/></svg>`),
  sec(`<section class="tl-people pk-bleed" data-fscope><div class="tl-wrap">${filters([["all", "Tous"], ["design", "#design"], ["tech", "#tech"], ["artisanat", "#artisanat"], ["ecriture", "#écriture"], ["image", "#image"], ["gestion", "#gestion"]], "all", "9 membres")}
    <div class="tl-mgrid tl-mgrid--wide" data-fitems>${MEMBERS.map(memberCard).join("")}</div><p class="tl-note">Profils fictifs, créés pour la démonstration.</p></div></section>`),
  sec(`<section class="tl-rituals pk-bleed"><div class="tl-wrap"><h2 class="tl-h2" data-reveal>Une semaine au Verger.</h2><ol class="tl-week7">${[["Lundi", "Café-lecture", "9 h, on partage ce qu'on a lu"], ["Mardi", "Relecture", "Mehdi relit vos textes"], ["Mercredi", "Silence", "Matinée sans réunion ni appel"], ["Jeudi", "Déjeuner partagé", "12 h 30, chacun apporte un plat"], ["Vendredi", "Apéro de fin", "17 h 30, jus de pomme maison"]].map(([d, t, x], i) => `<li class="tl-ritual tl-ritual--${i % 3}" data-reveal><small>${d}</small><h3>${t}</h3><p>${x}</p></li>`).join("")}</ol></div></section>`),
  sec(`<section class="tl-charte pk-bleed"><div class="tl-wrap tl-charte-in"><h2 class="tl-h2" data-reveal>Notre petite charte.</h2><ul>${["On dit bonjour, même quand on a une deadline.", "On range ce qu'on sort, on lave sa tasse.", "On demande de l'aide, on en propose aussi.", "On garde le silence près des cabines, on rit autour du café.", "On accueille les nouveaux comme on voudrait l'avoir été."].map((t, i) => `<li data-reveal><b>${i + 1}</b>${t}</li>`).join("")}</ul></div></section>`),
  sec(footer(c)),
];

const evenements = (c) => [
  sec(header(c)),
  pagehead("Événements", "Apprendre, réparer,<br>trinquer.", "Ateliers, rencontres et soirées. Pour demander une place, le formulaire de contact suffit : aucune inscription n'est enregistrée ici.", `<svg class="tl-ph-svg" viewBox="0 0 120 90"><rect x="12" y="14" width="96" height="64" rx="12" fill="${CREAM}" stroke="${INK}" stroke-width="4"/><rect x="12" y="14" width="96" height="20" rx="10" fill="${COR}"/><circle cx="34" cy="52" r="6" fill="${AP}"/><circle cx="60" cy="52" r="6" fill="${INK}"/><circle cx="86" cy="52" r="6" fill="${AP}"/><circle cx="34" cy="68" r="6" fill="${INK}"/></svg>`),
  sec(`<section class="tl-events pk-bleed" data-fscope><div class="tl-wrap">${filters([["all", "Tous"], ["atelier", "Ateliers"], ["rencontre", "Rencontres"], ["soiree", "Soirées"], ["formation", "Formations"]], "all", "8 événements")}
    <ol class="tl-evlist" data-fitems>${EVENTS.map(eventRow).join("")}</ol><p class="tl-empty" data-fempty hidden>Rien de ce type pour le moment. Revenez bientôt !</p></div></section>`),
  sec(`<section class="tl-cta pk-bleed"><div class="tl-wrap tl-cta-in" data-reveal><div><h2 class="tl-h2">Une idée d'atelier ?</h2><p class="tl-lead">Le Verger prête sa salle et son café aux membres qui veulent transmettre. Dites-nous ce que vous aimeriez animer.</p></div><div class="tl-actions"><a class="tl-btn tl-btn--ink tl-btn--lg" href="/contact">Proposer un atelier ${arrow}</a></div></div></section>`),
  sec(footer(c)),
];

const apropos = (c) => [
  sec(header(c)),
  pagehead("À propos", "Né d'une table<br>et de quatre chaises.", "Le Verger a commencé dans l'arrière-boutique d'un menuisier. Il occupe aujourd'hui un ancien atelier de couture.", `<svg class="tl-ph-svg" viewBox="0 0 120 90"><rect x="8" y="46" width="104" height="30" rx="8" fill="${WOODD}"/><path d="M20 46V20h30v26" fill="${AP}"/><path d="M60 46V28h40v18" fill="${COR}"/><rect x="26" y="26" width="18" height="12" fill="${CREAM}"/></svg>`),
  sec(`<section class="tl-story pk-bleed"><div class="tl-wrap"><ol class="tl-tline">${[["2019", "La première table", "Paul, menuisier, prête sa table à un graphiste et à une traductrice. Quatre chaises, un thermos de café."], ["2021", "Le déménagement", "Le groupe passe à vingt personnes et reprend l'ancien atelier de couture de la rue du Pommier."], ["2023", "Le café devient central", "On abat une cloison pour agrandir la cuisine. Le déjeuner du jeudi est né."], ["2026", "Ouvert au quartier", "Ateliers publics, repair café et accueil des associations : le Verger s'ouvre à ses voisins."]].map(([y, t, x], i) => `<li class="tl-tl-${i % 2}" data-reveal><b class="tl-year">${y}</b><div><h3>${t}</h3><p>${x}</p></div></li>`).join("")}</ol></div></section>`),
  sec(`<section class="tl-dark pk-bleed"><div class="tl-wrap"><h2 class="tl-h2 tl-h2--w" data-reveal>En chiffres.</h2><ul class="tl-bignums">${[["120", "membres actifs", ""], ["6", "espaces à vivre", ""], ["48", "événements par an", ""], ["7", "jours sur 7 pour les postes fixes", ""]].map(([n, l]) => `<li data-reveal><b data-count="${n}">${n}</b><span>${l}</span></li>`).join("")}</ul></div></section>`),
  sec(`<section class="tl-team pk-bleed"><div class="tl-wrap"><h2 class="tl-h2" data-reveal>L'équipe d'accueil.</h2><div class="tl-mgrid">${[["Nora", "Directrice du lieu", "design", "Sourit en premier, répond aux mails en dernier.", "#accueil"], ["Théo", "Régisseur", "artisanat", "Répare tout, arrose tout, connaît le code du wifi.", "#technique"], ["Mina", "Animatrice de communauté", "gestion", "Organise les événements et la tombola des fèves.", "#animation"]].map(memberCard).join("")}</div><p class="tl-note">Personnes fictives, pour la démonstration.</p></div></section>`),
  sec(`<section class="tl-visit pk-bleed"><div class="tl-wrap tl-visit-in"><div data-reveal><p class="tl-kicker">Nous trouver</p><h2 class="tl-h2">12 rue du Pommier.</h2><address>12 rue du Pommier<br>69007 Lyon<br>Lundi au samedi, 8 h à 20 h</address><ul class="tl-acc"><li>Métro : à 6 minutes à pied</li><li>Garage à vélos couvert</li><li>Entrée de plain-pied, ascenseur, toilettes adaptées</li></ul><a class="tl-btn tl-btn--coral" href="/contact">Prévenir de votre visite ${arrow}</a></div>
    <svg class="tl-map" viewBox="0 0 360 260" role="img" aria-label="Plan dessiné du quartier : la rue du Pommier, le parc et l'arrêt de métro"><title>Plan du quartier</title><rect width="360" height="260" rx="22" fill="${CREAM}"/><rect x="20" y="20" width="110" height="80" rx="16" fill="${AP}"/><circle cx="55" cy="55" r="14" fill="${APD}"/><circle cx="92" cy="68" r="10" fill="${shade(AP, 1.25)}"/><path d="M0 150h360M0 214h360M176 0v260M268 0v260" stroke="#fff" stroke-width="16"/><path d="M0 150h360M0 214h360M176 0v260M268 0v260" stroke="${WOOD}" stroke-width="2"/><rect x="192" y="164" width="60" height="38" rx="8" fill="${COR}"/><rect x="200" y="172" width="12" height="12" fill="${CREAM}"/><rect x="222" y="172" width="12" height="12" fill="${CREAM}"/><circle cx="64" cy="182" r="20" fill="${INK}"/><path d="M54 182h20M64 172v20" stroke="${AP}" stroke-width="5" stroke-linecap="round"/><rect x="284" y="26" width="56" height="36" rx="8" fill="${WOODD}"/><rect x="284" y="226" width="56" height="22" rx="8" fill="${WOOD}"/></svg></div></section>`),
  sec(footer(c)),
];

const FAQS = [
  ["lieu", "Faut-il être membre pour venir ?", "Non : vous pouvez réserver une journée ou venir à un événement ouvert. Pour les postes fixes et bureaux privés, il faut une formule mensuelle."],
  ["lieu", "À quelle heure ouvre le Verger ?", "Du lundi au samedi, de 8 h à 20 h. Les postes fixes et bureaux privés peuvent être utilisés tous les jours, y compris le dimanche."],
  ["tarifs", "Les prix affichés sont-ils réels ?", "Non. Ce site est une démonstration : tarifs, disponibilités et membres sont fictifs, et le simulateur ne fait aucune réservation."],
  ["tarifs", "Comment fonctionne la remise sur la durée ?", "Le simulateur applique 10 % pour un mois et 18 % pour trois mois sur le prix des jours choisis. C'est une estimation indicative."],
  ["pratique", "Peut-on venir avec son chien ?", "Les chiens calmes et propres sont acceptés en bureau privé. Dans l'open space, nous demandons l'accord des voisins de table."],
  ["pratique", "Y a-t-il de quoi manger sur place ?", "La cuisine commune est équipée. Le jeudi, un déjeuner partagé réunit celles et ceux qui veulent apporter un plat."],
  ["pratique", "Le lieu est-il accessible ?", "Entrée de plain-pied, ascenseur, toilettes adaptées et cabines suffisamment larges pour un fauteuil."],
  ["lieu", "Comment réserver la salle Tilleul ?", "Dans cette démonstration, aucun système de réservation n'existe. Utilisez le simulateur puis le formulaire de contact pour envoyer votre demande."],
];
const faq = (c) => [
  sec(header(c)),
  pagehead("Questions fréquentes", "On vous répond<br>avant que vous ne demandiez.", "", `<svg class="tl-ph-svg" viewBox="0 0 120 90"><rect x="10" y="12" width="70" height="44" rx="14" fill="${AP}"/><path d="M26 56l-6 14 20-14z" fill="${AP}"/><rect x="42" y="36" width="68" height="42" rx="14" fill="${COR}"/><path d="M94 78l8 10-2-10z" fill="${COR}"/></svg>`),
  sec(`<section class="tl-faq pk-bleed" data-fscope><div class="tl-wrap tl-faq-in"><aside class="tl-faq-side">${filters([["all", "Toutes"], ["lieu", "Le lieu"], ["tarifs", "Tarifs"], ["pratique", "Au quotidien"]], "all", "8 questions")}<div class="tl-faq-help"><h3>Une autre question ?</h3><p>Écrivez-nous, on répond sous deux jours ouvrés.</p><a class="tl-btn tl-btn--coral tl-btn--block" href="/contact">Nous écrire</a></div></aside>
    <div class="tl-faq-list" data-fitems>${FAQS.map(([k, q, a]) => `<details class="tl-q" data-cat="${k}" data-reveal><summary>${q}</summary><p>${a}</p></details>`).join("")}</div></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)),
  pagehead("Contact", "Passez nous voir,<br>ou écrivez-nous.", "Une visite, une question, une proposition d'atelier ? Le formulaire arrive directement à l'équipe du Verger."),
  { type: "form", heading: "Écrire au Verger", intro: "Dites-nous qui vous êtes et ce que vous cherchez. Si vous venez du simulateur, votre récapitulatif est repris dans le message." },
  sec(footer(c)),
];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une info ?", "Un espace, un événement, un membre."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="tl-ph tl-404 pk-bleed"><div class="tl-wrap tl-ph-in"><div><p class="tl-kicker">Cette chaise est vide</p><div class="tl-h1 tl-h1--xl" role="heading" aria-level="1">404</div><p class="tl-ph-sub">La page cherchée n'existe pas ou a déménagé.</p><div class="tl-actions"><a class="tl-btn tl-btn--coral tl-btn--lg" href="/">Retour à l'accueil</a><a class="tl-btn tl-btn--line tl-btn--lg" href="/espaces">Voir les espaces</a></div></div><div class="tl-ph-art" aria-hidden="true">${ico("chair")}</div></div></section>`), sec(footer(c))];

module.exports = {
  key: "tiers", name: "Le Verger", version: "2.0.0", category: "services", tags: ["chaleureux", "ludique", "moderne"], siteType: "Coworking et tiers-lieu", featured: true,
  concept: "Un plan d'architecte joyeux : l'espace dessiné en isométrique, du mobilier en aplats, des étiquettes de communauté, un simulateur de réservation et un plan à explorer.",
  description: "Coworking et tiers-lieu convivial : vert pomme, bois clair, noir encre et corail. Plan isométrique de l'espace, pastilles collantes, espaces avec disponibilités, simulateur de réservation, plan interactif, événements filtrables.",
  brand: "Le Verger — coworking et tiers-lieu", modules: ["formulaires", "recherche"],
  dna: { header: "pastilles-arrondies-collantes", hero: "plan-isometrique-de-l-espace-dessine", grid: "liste-riche-avec-disponibilites", motion: "mobilier-qui-se-pose-et-etiquettes-flottantes", shapes: "aplats-de-mobilier-et-etiquettes-de-communaute", rhythm: "bandes-arrondies-courtes-en-alternance", signature: "tarifs-simulateur-de-reservation-et-plan-interactif" },
  tokens: {
    colors: { primary: "#9bd13d", secondary: "#17181a", accent: "#ff6b57", background: "#f3e6cc", surface: "#fffaf0", text: "#17181a", muted: "#58533f", success: "#2f7d1f", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.gabarito", body: "font.onest", button: "font.gabarito", link: "font.onest" },
    radius: { sm: 10, md: 16, lg: 28, button: 999, field: 14, card: 24 }, shadow: { card: "0 6px 0 rgba(23,24,26,.9)", button: "0 3px 0 rgba(23,24,26,.9)" }, border: { width: 2, color: "#17181a" },
    type: { h1: { size: 72, weight: 800, lineHeight: 1, transform: "none" }, h2: { size: 44, weight: 800, lineHeight: 1.05, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Vert pomme", type: "color", default: "#9bd13d" },
    { key: "coral", label: "Touche de corail", type: "color", default: "#ff6b57" },
    { key: "bois", label: "Fond bois clair", type: "color", default: "#f3e6cc" },
    { key: "float", label: "Étiquettes flottantes", type: "choice", default: "on", choices: [["on", "Elles flottent"], ["off", "Immobiles"]] },
  ],
  menu: [["Accueil", "/"], ["Espaces", "/espaces"], ["Tarifs", "/tarifs"], ["Communauté", "/communaute"], ["Événements", "/evenements"], ["À propos", "/a-propos"], ["FAQ", "/faq"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "espaces", name: "Espaces", render: espaces }, { key: "tarifs", name: "Tarifs", render: tarifs },
    { key: "communaute", name: "Communauté", render: communaute }, { key: "evenements", name: "Événements", render: evenements }, { key: "a-propos", name: "À propos", render: apropos },
    { key: "faq", name: "FAQ", render: faq }, { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
