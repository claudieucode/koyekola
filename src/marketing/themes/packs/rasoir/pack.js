// Rasoir — salon de barbier. Direction artistique : enseigne de barbier à bandes rouge/bleu/blanc qui tournent, cuir brun clouté et papier d'affichage crème,
// titre sur bande, tickets de service perforés qui se détachent, prise de rendez-vous guidée (barbier, prestation, créneau de la semaine) qui renvoie vers le formulaire de contact.
const { sec, esc, nav } = require("../kit");

// ---------- pictogrammes (trait, 64 x 64) ----------
const ICON = {
  coupe: '<circle cx="18" cy="50" r="8"/><circle cx="46" cy="50" r="8"/><path d="M23 44 44 8M41 44 20 8"/>',
  degrade: '<rect x="6" y="22" width="52" height="12" rx="3"/><path d="M12 34v16M20 34v12M28 34v8M36 34v12M44 34v16M52 34v10"/><path d="M10 12h44"/>',
  barbe: '<path d="M10 14c0 22 4 40 22 44 18-4 22-22 22-44-8 8-14 10-22 10S18 22 10 14z"/><path d="M24 36c4 3 12 3 16 0"/>',
  rasoir: '<rect x="4" y="38" width="30" height="10" rx="5"/><path d="M30 38 58 10l-5-5-30 28z"/><circle cx="31" cy="43" r="2.4"/>',
  combo: '<circle cx="32" cy="22" r="14"/><path d="M18 30c0 18 6 28 14 28s14-10 14-28"/><path d="M24 34c5 4 11 4 16 0"/>',
  petit: '<circle cx="32" cy="22" r="12"/><path d="M10 58c2-14 12-20 22-20s20 6 22 20z"/>',
  serviette: '<path d="M20 4c-5 7 5 9 0 17M32 4c-5 7 5 9 0 17M44 4c-5 7 5 9 0 17"/><rect x="8" y="30" width="48" height="24" rx="4"/><path d="M8 40h48"/>',
  blaireau: '<path d="M16 8c10-6 28-6 32 8 2 7-1 13-8 17H24c-7-4-10-10-8-17z"/><rect x="25" y="33" width="14" height="7"/><path d="M27 40h10l-2 20h-6z"/>',
  baume: '<rect x="14" y="26" width="36" height="28" rx="5"/><rect x="18" y="16" width="28" height="10" rx="3"/><path d="M14 40h36"/>',
  cologne: '<rect x="16" y="24" width="32" height="34" rx="6"/><rect x="26" y="10" width="12" height="14"/><path d="M22 12h20M22 40h20"/>',
  peigne: '<rect x="6" y="18" width="52" height="14" rx="3"/><path d="M12 32v18M20 32v18M28 32v18M36 32v18M44 32v18M52 32v18"/>',
};
const ico = (k, cls = "rs-ico") => `<svg class="${cls}" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
const arrow = `<svg class="rs-arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"/></svg>`;

// ---------- enseigne de barbier (div + SVG, bandes animées en CSS) ----------
const cap = (pos) => `<svg class="rs-cap rs-cap--${pos}" viewBox="0 0 140 56" aria-hidden="true">${pos === "t"
  ? '<path d="M70 4c26 0 44 14 46 32H24C26 18 44 4 70 4z" fill="#d6a746"/><path d="M70 4c26 0 44 14 46 32H70z" fill="#a67a25" opacity=".55"/><circle cx="70" cy="6" r="6" fill="#e9c367"/><rect x="18" y="34" width="104" height="18" rx="4" fill="#b98a2e"/><rect x="18" y="34" width="104" height="5" fill="#f1d38a" opacity=".7"/>'
  : '<rect x="18" y="4" width="104" height="18" rx="4" fill="#b98a2e"/><rect x="18" y="4" width="104" height="5" fill="#f1d38a" opacity=".7"/><path d="M24 20h92c-4 20-20 34-46 34S28 40 24 20z" fill="#d6a746"/><path d="M70 20h46c-4 20-20 34-46 34z" fill="#a67a25" opacity=".55"/>'}</svg>`;
const pole = (cls = "") => `<div class="rs-pole ${cls}" aria-hidden="true">${cap("t")}<div class="rs-pole-glass"><div class="rs-pole-stripes"></div></div>${cap("b")}</div>`;

// ---------- portraits des barbiers ----------
const FACE = {
  gaston: `<rect width="200" height="240" fill="#d8bf8f"/><circle cx="100" cy="110" r="84" fill="#ead9b4"/>
    <path d="M6 240c4-48 40-68 94-68s90 20 94 68z" fill="#1f3a6e"/><path d="M78 176l22 30 22-30" fill="#f5ecd6"/><path d="M96 190h8l6 50H90z" fill="#a8281f"/>
    <rect x="82" y="138" width="36" height="42" fill="#c99a74"/><ellipse cx="100" cy="106" rx="43" ry="51" fill="#e2b48e"/><circle cx="57" cy="110" r="9" fill="#d9a67e"/><circle cx="143" cy="110" r="9" fill="#d9a67e"/>
    <path d="M58 98c-4-24 8-40 12-44-18 6-24 26-22 48zM142 98c4-24-8-40-12-44 18 6 24 26 22 48z" fill="#b9b2a4"/>
    <circle cx="84" cy="104" r="12" fill="none" stroke="#2b1a10" stroke-width="3"/><circle cx="116" cy="104" r="12" fill="none" stroke="#2b1a10" stroke-width="3"/><path d="M96 104h8" stroke="#2b1a10" stroke-width="3"/><circle cx="84" cy="105" r="3" fill="#2b1a10"/><circle cx="116" cy="105" r="3" fill="#2b1a10"/>
    <path d="M70 90c6-4 12-4 18 0M112 90c6-4 12-4 18 0" stroke="#8d877c" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M100 108c-3 8-5 12 0 14" stroke="#b98260" stroke-width="3" fill="none"/>
    <path d="M100 130c-10-10-28-10-40-2 8 0 14 4 18 10 6-6 14-8 22-8 8 0 16 2 22 8 4-6 10-10 18-10-12-8-30-8-40 2z" fill="#a9a398"/><path d="M82 148c10 6 26 6 36 0" stroke="#b98260" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  marcel: `<rect width="200" height="240" fill="#c9b48a"/><circle cx="100" cy="110" r="84" fill="#e6d4ab"/>
    <path d="M6 240c4-48 40-68 94-68s90 20 94 68z" fill="#5b3a22"/><path d="M62 176h76l10 64H52z" fill="#3e2517"/><path d="M80 176l20 26 20-26" fill="#f1e6cc"/>
    <rect x="82" y="138" width="36" height="42" fill="#a97650"/><ellipse cx="100" cy="106" rx="43" ry="50" fill="#c98e66"/><circle cx="57" cy="110" r="9" fill="#bd835d"/><circle cx="143" cy="110" r="9" fill="#bd835d"/>
    <path d="M56 86c-2-36 22-52 44-52s46 16 44 52c-10-12-24-18-44-18S66 74 56 86z" fill="#4a2f1c"/><path d="M52 82h96l12 8H44z" fill="#2c1b10"/><path d="M52 84c0-34 22-52 48-52s48 18 48 52z" fill="#3b4c3a"/><path d="M96 34h8" stroke="#2c1b10" stroke-width="3"/>
    <path d="M56 112c0 30 14 52 44 52s44-22 44-52c-6 14-14 22-22 24-8-8-14-10-22-10s-14 2-22 10c-8-2-16-10-22-24z" fill="#2c1b10"/>
    <path d="M78 134c8 6 36 6 44 0" stroke="#a97650" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M82 140c6 6 30 6 36 0" stroke="#2c1b10" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="84" cy="102" r="3.4" fill="#1b110a"/><circle cx="116" cy="102" r="3.4" fill="#1b110a"/><path d="M72 92c6-3 12-3 18 0M110 92c6-3 12-3 18 0" stroke="#2c1b10" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M100 106c-3 7-4 11 0 13" stroke="#8d5d3d" stroke-width="3" fill="none"/>`,
  lucien: `<rect width="200" height="240" fill="#cdb98f"/><circle cx="100" cy="110" r="84" fill="#eadcb9"/>
    <path d="M6 240c4-48 40-68 94-68s90 20 94 68z" fill="#f1e6cc"/><path d="M52 176h18l-4 64H40zM130 176h18l12 64h-26z" fill="#a8281f"/><path d="M84 176l16 18 16-18" fill="#d8c8a0"/><path d="M96 190h8l4 50H92z" fill="#22140c"/>
    <rect x="82" y="138" width="36" height="42" fill="#d4a47e"/><ellipse cx="100" cy="106" rx="43" ry="50" fill="#ecc19d"/><circle cx="57" cy="110" r="9" fill="#e0b18b"/><circle cx="143" cy="110" r="9" fill="#e0b18b"/>
    <path d="M54 94c-8-34 8-62 46-62 32 0 54 14 50 32l-4 34c-2-18-10-26-20-30-22 4-48 4-62 0-6 6-8 16-10 26z" fill="#1b110a"/><path d="M60 58c10-14 30-20 52-16-14 2-26 8-34 18z" fill="#4a3426" opacity=".8"/>
    <path d="M60 126c4 20 18 34 40 34s36-14 40-34c-6 8-12 12-18 12-6-6-14-8-22-8s-16 2-22 8c-6 0-12-4-18-12z" fill="#a37f66" opacity=".45"/>
    <circle cx="85" cy="102" r="3.4" fill="#1b110a"/><circle cx="115" cy="102" r="3.4" fill="#1b110a"/><path d="M73 91c5-3 11-3 16 0M111 91c5-3 11-3 16 0" stroke="#1b110a" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M100 106c-3 7-4 10 0 12" stroke="#c48e6b" stroke-width="3" fill="none"/>
    <path d="M86 136c8 6 20 6 28 0" stroke="#8d5238" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M90 130c6-3 14-3 20 0" stroke="#1b110a" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".8"/>`,
};
const portrait = (k, cls = "rs-face") => `<span class="${cls}"><svg viewBox="0 0 200 240" role="img" aria-label="Portrait dessiné du barbier"><title>Portrait dessiné</title>${FACE[k]}</svg></span>`;

// ---------- objets du comptoir ----------
const ART = {
  chair: `<rect width="240" height="240" fill="#e9d8b0"/><path d="M0 196h240v44H0z" fill="#8a5a35"/><path d="M0 196h240" stroke="#2a1810" stroke-width="4"/>
    <rect x="96" y="150" width="48" height="46" fill="#2b2f36"/><rect x="70" y="190" width="100" height="10" rx="4" fill="#5b5f68"/><rect x="104" y="124" width="32" height="30" fill="#c9cdd4"/>
    <path d="M56 108c0-14 10-22 22-22h84c12 0 22 8 22 22v28c0 8-6 14-14 14H70c-8 0-14-6-14-14z" fill="#7a1f19"/><path d="M78 40h84c10 0 16 8 16 18l-4 54H66L62 58c0-10 6-18 16-18z" fill="#8f2820"/>
    <rect x="94" y="22" width="52" height="24" rx="10" fill="#6b1914"/><path d="M52 112h-14v-26h14zM188 112h14v-26h-14z" fill="#c9cdd4"/><rect x="30" y="84" width="22" height="9" rx="4" fill="#2b2f36"/><rect x="188" y="84" width="22" height="9" rx="4" fill="#2b2f36"/>
    <path d="M70 156h100l10 34H60z" fill="#6b1914"/><circle cx="80" cy="100" r="3" fill="#e9c367"/><circle cx="160" cy="100" r="3" fill="#e9c367"/><circle cx="120" cy="58" r="3" fill="#e9c367"/>`,
  razor: `<rect width="240" height="240" fill="#2a1810"/><circle cx="120" cy="120" r="96" fill="#3e2517"/>
    <path d="M44 154c8-6 30-16 58-26l82-62c8-6 18-4 20 6l-92 74-52 20c-8 2-22-4-16-12z" fill="#e8ecf1"/><path d="M62 150 190 70l8 2-100 78z" fill="#b6bdc8"/>
    <path d="M70 168c18 16 52 30 92 26l-12-10c-30 2-50-4-66-20z" fill="#7a1f19"/><path d="M52 160c-12 12-12 30-4 38 14 8 40 6 70-8-20-6-36-16-52-34z" fill="#1c120b"/><circle cx="72" cy="176" r="4" fill="#e9c367"/>`,
  brush: `<rect width="240" height="240" fill="#d7c294"/><path d="M0 190h240v50H0z" fill="#8a5a35"/><path d="M0 190h240" stroke="#2a1810" stroke-width="4"/>
    <path d="M30 190c0-40 30-60 78-60s78 20 78 60z" fill="#f4efe2"/><path d="M30 190c0-8 2-14 6-20h140c4 6 6 12 6 20z" fill="#cfc7b2"/><path d="M60 138c-10-26 12-48 50-48s56 20 44 46c-18-10-60-10-94 2z" fill="#fff"/><circle cx="90" cy="108" r="12" fill="#fff"/><circle cx="130" cy="102" r="14" fill="#fff"/>
    <path d="M160 120c10-34 32-48 48-44 6 16-8 38-32 52z" fill="#8a5a35"/><path d="M150 64c14-20 36-14 40 2l-30 18z" fill="#cdbb9a"/><path d="M158 74c10-8 26-10 32-4" stroke="#6b4a2f" stroke-width="3" fill="none"/>`,
  scissors: `<rect width="240" height="240" fill="#1f3a6e"/><circle cx="120" cy="120" r="94" fill="#2a4a86"/>
    <circle cx="82" cy="170" r="24" fill="none" stroke="#e8ecf1" stroke-width="12"/><circle cx="158" cy="170" r="24" fill="none" stroke="#e8ecf1" stroke-width="12"/><path d="M92 150 150 40l8 6-52 110zM148 150 90 40l-8 6 52 110z" fill="#b6bdc8"/><circle cx="120" cy="106" r="6" fill="#e9c367"/>
    <rect x="40" y="206" width="160" height="12" rx="5" fill="#f1e6cc"/><path d="M52 206v10M64 206v10M76 206v10M88 206v10M100 206v10M112 206v10M124 206v10M136 206v10M148 206v10M160 206v10M172 206v10M184 206v10" stroke="#a8281f" stroke-width="3"/>`,
  tin: `<rect width="240" height="240" fill="#e0cb9c"/><path d="M0 200h240v40H0z" fill="#8a5a35"/><path d="M0 200h240" stroke="#2a1810" stroke-width="4"/>
    <ellipse cx="120" cy="196" rx="76" ry="14" fill="#00000030"/><path d="M48 112h144v82c0 10-32 16-72 16s-72-6-72-16z" fill="#a8281f"/><ellipse cx="120" cy="112" rx="72" ry="16" fill="#c9cdd4"/><ellipse cx="120" cy="108" rx="62" ry="11" fill="#e8ecf1"/>
    <path d="M48 146h144v26H48z" fill="#f1e6cc"/><path d="M48 146h144" stroke="#1f3a6e" stroke-width="5"/><path d="M48 172h144" stroke="#1f3a6e" stroke-width="5"/><circle cx="120" cy="159" r="9" fill="#a8281f"/>`,
  pole: `<rect width="240" height="240" fill="#2a1810"/><path d="M0 0h240v240H0z" fill="#3e2517"/><circle cx="120" cy="120" r="96" fill="#e9d8b0"/>`,
};
const art = (k, cls = "rs-art") => `<svg class="${cls}" viewBox="0 0 240 240" role="img" aria-label="Illustration"><title>Illustration</title>${ART[k]}</svg>`;

const ITEM = {
  tin: `<ellipse cx="60" cy="100" rx="44" ry="8" fill="#00000030"/><path d="M20 56h80v40c0 6-18 10-40 10S20 102 20 96z" fill="#a8281f"/><ellipse cx="60" cy="56" rx="40" ry="9" fill="#c9cdd4"/><ellipse cx="60" cy="54" rx="34" ry="6" fill="#e8ecf1"/><path d="M20 74h80v14H20z" fill="#f1e6cc"/><path d="M20 74h80M20 88h80" stroke="#1f3a6e" stroke-width="3"/>`,
  oil: `<ellipse cx="60" cy="104" rx="30" ry="6" fill="#00000030"/><rect x="38" y="44" width="44" height="58" rx="10" fill="#6b3d1c"/><rect x="38" y="44" width="44" height="14" rx="6" fill="#8a5a35"/><rect x="48" y="26" width="24" height="20" rx="4" fill="#22140c"/><rect x="54" y="12" width="12" height="16" rx="6" fill="#c9963a"/><rect x="44" y="66" width="32" height="26" rx="3" fill="#f1e6cc"/><path d="M50 74h20M50 80h20M50 86h12" stroke="#a8281f" stroke-width="3"/>`,
  soap: `<ellipse cx="60" cy="100" rx="42" ry="7" fill="#00000030"/><path d="M18 62h84c0 24-18 38-42 38S18 86 18 62z" fill="#1f3a6e"/><ellipse cx="60" cy="62" rx="42" ry="9" fill="#3a5c9c"/><path d="M26 58c-4-16 10-26 22-24 8-10 26-10 32 0 14-2 20 14 14 24-14 8-54 8-68 0z" fill="#fff"/><path d="M40 78h40" stroke="#c9963a" stroke-width="4"/>`,
  brush: `<ellipse cx="60" cy="108" rx="24" ry="5" fill="#00000030"/><path d="M34 46c0-22 14-34 26-34s26 12 26 34c0 6-6 10-10 12H44c-4-2-10-6-10-12z" fill="#e9e1cc"/><path d="M40 50c0-18 8-28 20-28s20 10 20 28z" fill="#fff"/><rect x="44" y="56" width="32" height="8" rx="3" fill="#c9963a"/><path d="M48 64h24l-4 42H52z" fill="#3e2517"/>`,
  after: `<ellipse cx="60" cy="108" rx="28" ry="5" fill="#00000030"/><rect x="34" y="42" width="52" height="64" rx="12" fill="#2e6a8a"/><rect x="34" y="42" width="52" height="64" rx="12" fill="#fff" opacity=".12"/><rect x="48" y="22" width="24" height="22" rx="3" fill="#c9963a"/><rect x="42" y="64" width="36" height="28" rx="3" fill="#f1e6cc"/><path d="M48 72h24M48 80h24" stroke="#1f3a6e" stroke-width="3"/>`,
  comb: `<ellipse cx="60" cy="100" rx="46" ry="6" fill="#00000030"/><rect x="12" y="42" width="96" height="22" rx="6" fill="#22140c"/><path d="M18 64v30M28 64v30M38 64v30M48 64v30M58 64v30M68 64v30M78 64v30M88 64v30M98 64v30" stroke="#22140c" stroke-width="5" stroke-linecap="round"/><path d="M20 50h80" stroke="#c9963a" stroke-width="3"/>`,
};
const item = (k) => `<svg class="rs-item" viewBox="0 0 120 120" aria-hidden="true">${ITEM[k]}</svg>`;

// ---------- données ----------
const SERVICES = [
  ["coupe", "Coupe aux ciseaux", "Coupe sur mesure, lavage, finition au peigne et à la serviette chaude.", 30, 32, "cheveux", "coupe"],
  ["degrade", "Dégradé net", "Dégradé tondeuse et ciseaux, nuque au rasoir, coiffage à la pommade.", 35, 35, "cheveux", "degrade"],
  ["barbe", "Barbe taillée", "Taille, contours au rasoir, huile et baume pour une barbe disciplinée.", 20, 25, "barbe", "barbe"],
  ["rasoir", "Rasage à l'ancienne", "Serviette chaude, blaireau, coupe-chou, baume et cologne : le grand rituel.", 40, 40, "rasage", "rasage"],
  ["combo", "Coupe et barbe", "La formule complète : cheveux, barbe et contours dans le même fauteuil.", 50, 54, "formules", "complet"],
  ["petit", "Petit client", "Coupe pour les moins de douze ans, avec un peu de patience et un bonbon.", 25, 20, "cheveux", "petit"],
];
const BARBERS = [
  ["gaston", "Gaston Rasoir", "Maître barbier", "Troisième génération au fauteuil. Le rasage à l'ancienne, c'est lui, et les moustaches à guidon aussi.", ["Rasage", "Moustaches", "Coupes classiques"], "Mar – Sam", [0, 1, 1, 1, 1, 1], "Trente-deux ans de métier et la même tasse de café depuis le premier jour."],
  ["marcel", "Marcel Ortega", "Barbier de la barbe", "Sculpteur de barbes : tailles franches, contours précis et huiles maison. Toujours coiffé de sa casquette.", ["Barbe", "Rasage", "Formules"], "Mar, Jeu, Ven, Sam", [0, 1, 0, 1, 1, 1], "Il vous dira que la barbe est une affaire de patience, et il aura raison."],
  ["lucien", "Lucien Ferré", "Coiffeur dégradés", "La relève : dégradés, pompadours et coupes d'enfant, avec une main très légère et beaucoup d'humour.", ["Dégradés", "Pompadour", "Enfants"], "Mar – Ven", [0, 1, 1, 1, 1, 0], "Arrivé comme apprenti il y a six ans, il tient aujourd'hui le deuxième fauteuil."],
];
const HOURS = [["Lundi", "Fermé", 1], ["Mardi", "9 h – 19 h", 2], ["Mercredi", "9 h – 19 h", 3], ["Jeudi", "9 h – 19 h", 4], ["Vendredi", "9 h – 19 h", 5], ["Samedi", "8 h 30 – 18 h", 6], ["Dimanche", "Fermé", 0]];
const hoursTable = () => `<table class="rs-hours" data-hours><caption class="rs-sr">Horaires d'ouverture</caption><thead><tr><th scope="col">Jour</th><th scope="col">Horaires</th></tr></thead><tbody>${HOURS.map(([d, h, n]) => `<tr data-d="${n}"><th scope="row">${d}</th><td>${h}</td></tr>`).join("")}</tbody></table>`;

// ---------- en-tête et pied ----------
const header = (c) => `<header class="rs-head pk-bleed"><div class="rs-bar">
  <a class="rs-logo" href="/" aria-label="${esc(c.brand)} — accueil"><span class="rs-mini" aria-hidden="true"><span></span></span><span class="rs-logo-t"><b>Rasoir</b><small>Barbier · depuis 1926</small></span></a>
  <div class="rs-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
  <a class="rs-cta" href="/rendez-vous">Prendre rendez-vous</a>
  <details class="rs-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="rs-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="rs-cta" href="/rendez-vous">Prendre rendez-vous</a></div></details>
  </div><div class="rs-stripe" aria-hidden="true"><div class="rs-stripe-in"></div></div></header>`;

const footer = (c) => `<footer class="rs-foot pk-bleed"><div class="rs-wrap rs-foot-in">
  <div class="rs-foot-brand"><div class="rs-foot-logo">Rasoir</div><p>Barbier, coiffeur pour hommes et rasage à l'ancienne. Un fauteuil, une serviette chaude, un vrai moment.</p><address>12 rue des Tanneurs<br>69002 Lyon<br><a href="mailto:bonjour@rasoir.example">bonjour@rasoir.example</a></address></div>
  <div><h3>Le salon</h3>${nav(c.menu.slice(0, 5), "rs-fl")}</div>
  <div><h3>Infos</h3><a class="rs-fl" href="/rendez-vous">Prendre rendez-vous</a><a class="rs-fl" href="/contact">Contact</a><a class="rs-fl" href="/recherche">Recherche</a></div>
  <div><h3>Horaires</h3><p class="rs-foot-h">Mar – Ven : 9 h – 19 h<br>Samedi : 8 h 30 – 18 h<br>Dimanche et lundi : fermé</p></div></div>
  <div class="rs-stripe rs-stripe--foot" aria-hidden="true"><div class="rs-stripe-in"></div></div>
  <p class="rs-legal">© Rasoir Barbier — site de démonstration. Salon, équipe, tarifs et produits fictifs.</p></footer>`;

const pagehead = (kicker, title, sub) => sec(`<section class="rs-ph pk-bleed rs-s-leather"><div class="rs-wrap rs-ph-in"><div class="rs-ph-pole" aria-hidden="true">${pole("rs-pole--s")}</div><div><p class="rs-kicker rs-kicker--l" data-reveal>${esc(kicker)}</p><div class="rs-ban rs-ban--page" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="rs-ph-sub" data-reveal>${esc(sub)}</p>` : ""}</div></div></section>`);

// ---------- briques ----------
const ticket = ([k, name, desc, dur, price, cat, slug], n) => `<a class="rs-tk rs-tk--${n % 3}" href="/rendez-vous#${slug}" data-reveal><span class="rs-tk-main">${ico(k)}<span class="rs-tk-t"><b>${esc(name)}</b><i>${esc(desc)}</i><em>${dur} min</em></span></span><span class="rs-tk-stub"><small>N° 0${n + 1}</small><b>${price} €</b><u>${arrow}</u></span></a>`;

const rite = [["serviette", "La serviette chaude", "Elle ouvre les pores et ramollit le poil."], ["blaireau", "Le blaireau", "Une mousse épaisse, montée à la main."], ["rasoir", "Le coupe-chou", "Un passage dans le sens du poil, un autre à rebours."], ["baume", "Le baume", "Apaise, hydrate et referme la peau."], ["cologne", "La cologne", "Une touche, sans excès, pour la route."]];
const riteList = () => rite.map(([k, t, d], i) => `<li class="rs-rite-li" data-reveal><span class="rs-badge">${ico(k, "rs-ico rs-ico--l")}<i>${i + 1}</i></span><h3>${t}</h3><p>${d}</p></li>`).join("");

const barberCard = ([k, name, role, bio, tags, days, , quote], full) => `<article class="rs-bc${full ? " rs-bc--full" : ""}" data-reveal>${portrait(k)}<div class="rs-bc-t"><p class="rs-role">${esc(role)}</p><h3>${esc(name)}</h3><p>${esc(full ? bio : bio.split(". ")[0] + ".")}</p>${full ? `<blockquote>${esc(quote)}</blockquote>` : ""}<ul class="rs-tags">${tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>${full ? `<p class="rs-days"><b>Présent :</b> ${esc(days)}</p>` : ""}<a class="rs-more" href="/rendez-vous#${k}">${full ? "Réserver avec " + esc(name.split(" ")[0]) : "Voir son planning"} ${arrow}</a></div></article>`;

const PRODUCTS = [["tin", "Pommade tenue forte", "Finition mate, base cire d'abeille", "pommades", "14 €"], ["oil", "Huile à barbe", "Cèdre et cuir, 30 ml", "barbe", "16 €"], ["soap", "Savon à raser", "En bol, mousse dense, 120 g", "rasage", "18 €"], ["brush", "Blaireau poils fins", "Manche en bois sombre", "rasage", "28 €"], ["after", "Après-rasage", "Sans alcool, 100 ml", "barbe", "15 €"], ["comb", "Peigne en corne", "Fait main, denture fine", "pommades", "12 €"]];
const productCards = (n = 6) => PRODUCTS.slice(0, n).map(([k, name, d, cat, price]) => `<article class="rs-pr" data-cat="${cat}" data-reveal><span class="rs-pr-art">${item(k)}</span><div class="rs-pr-t"><h3>${esc(name)}</h3><p>${esc(d)}</p><span class="rs-price">${price}<small> indicatif</small></span></div></article>`).join("");

// ---------- accueil ----------
const home = (c) => [
  sec(header(c)),
  sec(`<section class="rs-hero pk-bleed rs-s-cream"><div class="rs-wrap rs-hero-in">
    <div class="rs-stage" aria-hidden="true"><div class="rs-stage-in">${pole("rs-pole--xl")}</div>
      <div class="rs-sign"><span class="rs-sign-h"></span><span class="rs-sign-b"><b>Ouvert</b><small>Mar – Sam</small></span></div><div class="rs-oval"><b>1926</b><small>Maison fondée</small></div></div>
    <div class="rs-hero-copy"><p class="rs-kicker" data-reveal>Barbier · Coiffeur pour hommes · Lyon 2e</p>
      <div class="rs-ban" role="heading" aria-level="1"><span data-reveal>Barbe nette,</span><span data-reveal>esprit aiguisé.</span></div>
      <p class="rs-lead" data-reveal>Un fauteuil en cuir, une serviette chaude et trois barbiers qui prennent le temps. Coupe, barbe et rasage à l'ancienne, comme on le fait ici depuis 1926.</p>
      <div class="rs-actions" data-reveal><a class="rs-btn rs-btn--red" href="/rendez-vous">Choisir mon créneau ${arrow}</a><a class="rs-btn rs-btn--line" href="/prestations">Voir les prestations</a></div>
      <ul class="rs-facts" data-reveal><li><b>3</b><span>fauteuils</span></li><li><b>9 h</b><span>première coupe</span></li><li><b>40 min</b><span>rasage complet</span></li></ul></div></div>
    <div class="rs-zig" aria-hidden="true"></div></section>`),
  sec(`<section class="rs-marq pk-bleed" aria-hidden="true"><div class="rs-marq-track">${Array(2).fill(["Coupe", "Barbe", "Rasoir", "Serviette chaude", "Pommade", "Moustache"].map((w) => `<span>${w}</span><i></i>`).join("")).join("")}</div></section>`),
  sec(`<section class="rs-svc pk-bleed rs-s-paper"><div class="rs-wrap"><div class="rs-sechead"><div><p class="rs-kicker" data-reveal>Le ticket du jour</p><h2 class="rs-h2" data-reveal>Choisissez votre service.</h2></div><a class="rs-more" href="/prestations" data-reveal>Toute la carte ${arrow}</a></div>
    <div class="rs-tk-grid">${SERVICES.map(ticket).join("")}</div><p class="rs-fine" data-reveal>Tarifs indicatifs, donnés à titre de démonstration. Un ticket, un clic : le rendez-vous se prépare sur la page dédiée.</p></div></section>`),
  sec(`<section class="rs-rite pk-bleed rs-s-leather"><div class="rs-wrap"><p class="rs-kicker rs-kicker--l" data-reveal>Le grand rituel</p><h2 class="rs-h2 rs-h2--l" data-reveal>Cinq gestes, aucune précipitation.</h2><ol class="rs-rite-ol">${riteList()}</ol>
    <div class="rs-center" data-reveal><a class="rs-btn rs-btn--brass" href="/rendez-vous#rasage">Réserver un rasage ${arrow}</a></div></div></section>`),
  sec(`<section class="rs-team pk-bleed rs-s-cream"><div class="rs-wrap"><div class="rs-sechead"><div><p class="rs-kicker" data-reveal>Derrière les fauteuils</p><h2 class="rs-h2" data-reveal>Trois barbiers, trois styles.</h2></div><a class="rs-more" href="/equipe" data-reveal>Toute l'équipe ${arrow}</a></div>
    <div class="rs-bc-grid">${BARBERS.map((b) => barberCard(b, false)).join("")}</div></div></section>`),
  sec(`<section class="rs-counter pk-bleed rs-s-red"><div class="rs-wrap"><ul class="rs-counter-in"><li data-reveal><b data-count="98">98</b><span>ans d'enseigne</span></li><li data-reveal><b data-count="12000" data-sep="1">12000</b><span>barbes taillées</span></li><li data-reveal><b data-count="3">3</b><span>générations</span></li><li data-reveal><b data-count="5">5</b><span>jours ouverts par semaine</span></li></ul></div></section>`),
  sec(`<section class="rs-shop pk-bleed rs-s-paper"><div class="rs-wrap"><div class="rs-sechead"><div><p class="rs-kicker" data-reveal>Au comptoir</p><h2 class="rs-h2" data-reveal>Ce que nous utilisons, en boutique.</h2></div><a class="rs-more" href="/galerie" data-reveal>Tout le comptoir ${arrow}</a></div>
    <div class="rs-pr-grid rs-pr-grid--4">${productCards(4)}</div></div></section>`),
  sec(`<section class="rs-visit pk-bleed rs-s-cream"><div class="rs-wrap rs-visit-in"><div data-reveal><p class="rs-kicker">Passez la porte</p><h2 class="rs-h2">12 rue des Tanneurs, Lyon 2e.</h2><p class="rs-lead">Avec ou sans rendez-vous, selon l'affluence. Le jour même, appelez ou passez : le fauteuil libre s'allume dans la vitrine.</p><a class="rs-btn rs-btn--red" href="/contact">Nous écrire ${arrow}</a></div><div class="rs-hours-box" data-reveal><h3>Horaires</h3>${hoursTable()}</div></div></section>`),
  sec(`<section class="rs-band pk-bleed"><div class="rs-wrap rs-band-in"><div class="rs-band-t" role="heading" aria-level="2" data-reveal>Votre fauteuil vous attend.</div><a class="rs-btn rs-btn--cream" href="/rendez-vous" data-reveal>Prendre rendez-vous ${arrow}</a></div></section>`),
  sec(footer(c)),
];

// ---------- prestations ----------
const MENU = {
  cheveux: [["Coupe aux ciseaux", "30 min", "32 €"], ["Dégradé net", "35 min", "35 €"], ["Coupe à la tondeuse", "20 min", "24 €"], ["Petit client (moins de 12 ans)", "25 min", "20 €"], ["Shampoing et coiffage", "10 min", "8 €"]],
  barbe: [["Barbe taillée", "20 min", "25 €"], ["Contours au rasoir", "15 min", "15 €"], ["Taille de moustache", "10 min", "10 €"], ["Soin huile et baume", "10 min", "9 €"]],
  rasage: [["Rasage à l'ancienne, serviette chaude", "40 min", "40 €"], ["Rasage de la nuque et des tempes", "15 min", "12 €"], ["Crâne rasé, finition baume", "30 min", "30 €"]],
  formules: [["Coupe et barbe", "50 min", "54 €"], ["Le grand rituel : coupe, rasage, soin", "75 min", "78 €"], ["Père et fils", "50 min", "50 €"]],
};
const menuPanel = (k) => `<ul class="rs-menu" data-panel="${k}"${k === "cheveux" ? "" : " hidden"}>${MENU[k].map(([n, d, p]) => `<li><span class="rs-menu-n">${esc(n)}</span><span class="rs-menu-dots" aria-hidden="true"></span><span class="rs-menu-d">${d}</span><b class="rs-menu-p">${p}</b></li>`).join("")}</ul>`;
const prestations = (c) => [sec(header(c)), pagehead("La carte du salon", "Prestations<br>& tarifs", "Coupe, barbe, rasage : des gestes précis, des prix lisibles. Tarifs indicatifs de démonstration."),
  sec(`<section class="rs-board pk-bleed rs-s-cream"><div class="rs-wrap rs-board-in"><div class="rs-board-side"><h2 class="rs-h2" data-reveal>La carte</h2><div class="rs-tabs rs-tabs--v" role="tablist" aria-label="Catégories de prestations" data-scope><a href="#cheveux" class="is-on" role="tab" aria-selected="true" data-tab="cheveux">${ico("coupe", "rs-ico rs-ico--s")}Cheveux</a><a href="#barbe" role="tab" aria-selected="false" data-tab="barbe">${ico("barbe", "rs-ico rs-ico--s")}Barbe</a><a href="#rasage" role="tab" aria-selected="false" data-tab="rasage">${ico("rasoir", "rs-ico rs-ico--s")}Rasage</a><a href="#formules" role="tab" aria-selected="false" data-tab="formules">${ico("combo", "rs-ico rs-ico--s")}Formules</a></div></div>
    <div class="rs-chalk" data-scope-panels role="tabpanel" aria-live="polite">${["cheveux", "barbe", "rasage", "formules"].map(menuPanel).join("")}<a class="rs-btn rs-btn--brass" href="/rendez-vous">Choisir mon créneau ${arrow}</a></div></div></section>`),
  sec(`<section class="rs-svc rs-svc--b pk-bleed rs-s-paper"><div class="rs-wrap"><h2 class="rs-h2" data-reveal>Nos services, en un ticket.</h2><div class="rs-tk-grid">${SERVICES.map(ticket).join("")}</div></div></section>`),
  sec(`<section class="rs-compare pk-bleed rs-s-cream"><div class="rs-wrap"><p class="rs-kicker" data-reveal>Comparer</p><h2 class="rs-h2" data-reveal>Quelle formule pour vous ?</h2>
    <div class="rs-tablewrap" data-reveal><table class="rs-table"><caption class="rs-sr">Comparatif des formules</caption><thead><tr><th scope="col">Inclus</th><th scope="col">Coupe</th><th scope="col">Coupe et barbe</th><th scope="col">Grand rituel</th></tr></thead><tbody>
    <tr><th scope="row">Coupe aux ciseaux</th><td data-l="Coupe">Oui</td><td data-l="Coupe et barbe">Oui</td><td data-l="Grand rituel">Oui</td></tr>
    <tr><th scope="row">Taille de barbe</th><td data-l="Coupe">–</td><td data-l="Coupe et barbe">Oui</td><td data-l="Grand rituel">Oui</td></tr>
    <tr><th scope="row">Serviette chaude</th><td data-l="Coupe">Oui</td><td data-l="Coupe et barbe">Oui</td><td data-l="Grand rituel">Oui</td></tr>
    <tr><th scope="row">Rasage au coupe-chou</th><td data-l="Coupe">–</td><td data-l="Coupe et barbe">–</td><td data-l="Grand rituel">Oui</td></tr>
    <tr><th scope="row">Durée indicative</th><td data-l="Coupe">30 min</td><td data-l="Coupe et barbe">50 min</td><td data-l="Grand rituel">75 min</td></tr>
    <tr class="rs-table-p"><th scope="row">Tarif indicatif</th><td data-l="Coupe">32 €</td><td data-l="Coupe et barbe">54 €</td><td data-l="Grand rituel">78 €</td></tr></tbody></table></div></div></section>`),
  sec(`<section class="rs-faq pk-bleed rs-s-leather"><div class="rs-wrap rs-faq-in"><h2 class="rs-h2 rs-h2--l" data-reveal>Avant de venir</h2><div>
    <details data-reveal><summary>Faut-il prendre rendez-vous ?</summary><p>C'est conseillé, surtout le samedi. Sans rendez-vous, nous vous prenons dès qu'un fauteuil se libère.</p></details>
    <details data-reveal><summary>Combien de temps prévoir ?</summary><p>Une coupe dure environ trente minutes, le grand rituel soixante-quinze. Les durées sont indicatives.</p></details>
    <details data-reveal><summary>Les tarifs sont-ils définitifs ?</summary><p>Non : ce site est une démonstration et les tarifs sont indicatifs. Le salon confirme le prix à la prise de rendez-vous.</p></details>
    <details data-reveal><summary>Peut-on venir avec un enfant ?</summary><p>Oui, la coupe « petit client » est faite pour eux, jusqu'à douze ans.</p></details></div></div></section>`),
  sec(footer(c))];

// ---------- l'équipe ----------
const equipe = (c) => [sec(header(c)), pagehead("Les gens du salon", "Les barbiers", "Trois fauteuils, trois façons de travailler, une même exigence."),
  sec(`<section class="rs-staff pk-bleed rs-s-cream"><div class="rs-wrap rs-staff-in">${BARBERS.map((b) => barberCard(b, true)).join("")}</div></section>`),
  sec(`<section class="rs-plan pk-bleed rs-s-paper"><div class="rs-wrap"><p class="rs-kicker" data-reveal>Qui est là ?</p><h2 class="rs-h2" data-reveal>Présence de la semaine</h2>
    <div class="rs-tablewrap" data-reveal><table class="rs-table rs-table--plan"><caption class="rs-sr">Jours de présence des barbiers</caption><thead><tr><th scope="col">Barbier</th><th scope="col">Mar</th><th scope="col">Mer</th><th scope="col">Jeu</th><th scope="col">Ven</th><th scope="col">Sam</th></tr></thead><tbody>
    ${BARBERS.map(([k, name, , , , , d]) => `<tr><th scope="row">${esc(name)}</th>${d.slice(1).map((x, i) => `<td data-l="${["Mar", "Mer", "Jeu", "Ven", "Sam"][i]}"><span class="rs-dot ${x ? "is-on" : ""}">${x ? "Présent" : "Repos"}</span></td>`).join("")}</tr>`).join("")}</tbody></table></div></div></section>`),
  sec(`<section class="rs-band pk-bleed"><div class="rs-wrap rs-band-in"><div class="rs-band-t" role="heading" aria-level="2" data-reveal>Un fauteuil, un barbier, votre heure.</div><a class="rs-btn rs-btn--cream" href="/rendez-vous" data-reveal>Choisir mon barbier ${arrow}</a></div></section>`),
  sec(footer(c))];

// ---------- rendez-vous (composant signature) ----------
const SLOTS = ["09:00", "10:00", "11:00", "12:30", "14:00", "15:00", "16:30", "17:30"];
const optBarber = (k, name, role, face) => `<a class="rs-opt rs-opt--b" href="#${k}" role="radio" aria-checked="false" data-bar="${k}">${face}<span class="rs-opt-t"><b>${esc(name)}</b><small>${esc(role)}</small></span></a>`;
const optSvc = ([k, name, , dur, price, , slug]) => `<a class="rs-opt rs-opt--s" href="#${slug}" role="radio" aria-checked="false" data-svc="${slug}" data-dur="${dur}" data-price="${price}" data-name="${esc(name)}">${ico(k, "rs-ico rs-ico--m")}<span class="rs-opt-t"><b>${esc(name)}</b><small>${dur} min · ${price} €</small></span></a>`;
const rendezvous = (c) => [sec(header(c)), pagehead("Prise de rendez-vous", "Réservez<br>votre fauteuil", "Trois choix, un récapitulatif. Démonstration : rien n'est enregistré, la demande s'envoie par le formulaire de contact."),
  sec(`<section class="rs-book pk-bleed rs-s-cream" data-book><div class="rs-wrap rs-book-in"><div class="rs-book-steps">
    <section class="rs-step"><div class="rs-step-h"><span class="rs-step-n">1</span><h2 class="rs-h3">Votre barbier</h2></div>
      <div class="rs-opts" role="radiogroup" aria-label="Choix du barbier" data-group="bar">
        <a class="rs-opt rs-opt--b is-any" href="#any" role="radio" aria-checked="false" data-bar="any"><span class="rs-face rs-face--any"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M32 8v48M8 32h48"/><circle cx="32" cy="32" r="22"/></svg></span><span class="rs-opt-t"><b>Le premier libre</b><small>Peu importe, le plus tôt possible</small></span></a>
        ${BARBERS.map(([k, name, role]) => optBarber(k, name, role, portrait(k, "rs-face rs-face--s"))).join("")}</div></section>
    <section class="rs-step"><div class="rs-step-h"><span class="rs-step-n">2</span><h2 class="rs-h3">La prestation</h2></div>
      <div class="rs-opts rs-opts--svc" role="radiogroup" aria-label="Choix de la prestation" data-group="svc">${SERVICES.map(optSvc).join("")}</div><p class="rs-note" data-note aria-live="polite"></p></section>
    <section class="rs-step"><div class="rs-step-h"><span class="rs-step-n">3</span><h2 class="rs-h3">Le créneau</h2></div>
      <div class="rs-weekbar"><a href="#semaine-prec" class="rs-wk" data-wk="-1" aria-label="Semaine précédente">${arrow}</a><span class="rs-weeklab" data-weeklab aria-live="polite">Cette semaine</span><a href="#semaine-suiv" class="rs-wk rs-wk--n" data-wk="1" aria-label="Semaine suivante">${arrow}</a></div>
      <div class="rs-week" role="radiogroup" aria-label="Créneaux disponibles" data-group="slot">${["Mar", "Mer", "Jeu", "Ven", "Sam"].map((d, i) => `<div class="rs-day" data-day="${i}"><p class="rs-day-h"><b>${d}</b><span data-dnum></span></p><div class="rs-slots">${SLOTS.map((s) => `<a href="#c-${s.replace(":", "h")}" class="rs-slot" role="radio" aria-checked="false" data-slot="${s}">${s}</a>`).join("")}</div></div>`).join("")}</div>
      <p class="rs-legend"><span class="rs-slot rs-slot--demo">09:00</span> libre <span class="rs-slot rs-slot--demo is-full">10:00</span> complet</p></section></div>
    <aside class="rs-recap"><div class="rs-recap-in"><h2 class="rs-h3">Votre ticket</h2><dl class="rs-rc-l" aria-live="polite"><div><dt>Barbier</dt><dd data-r="bar">À choisir</dd></div><div><dt>Prestation</dt><dd data-r="svc">À choisir</dd></div><div><dt>Créneau</dt><dd data-r="slot">À choisir</dd></div><div><dt>Durée</dt><dd data-r="dur">–</dd></div></dl><p class="rs-rc-tot"><span>Tarif indicatif</span><b data-r="price">–</b></p>
      <a class="rs-btn rs-btn--red rs-btn--block" href="/contact" data-send aria-disabled="true">Envoyer ma demande ${arrow}</a><a class="rs-copy" href="#copier" data-copy>Copier le résumé</a><p class="rs-rc-msg" data-msg aria-live="polite">Complétez les trois étapes pour envoyer la demande.</p>
      <p class="rs-fine">Démonstration : aucun rendez-vous n'est enregistré. Collez le résumé dans le formulaire de contact pour que le salon vous réponde.</p></div></aside></div></section>`),
  sec(footer(c))];

// ---------- galerie / comptoir ----------
const WALL = [["chair", "Le fauteuil de Gaston", "salon"], ["razor", "Le coupe-chou de 1952", "outils"], ["brush", "Bol et blaireau", "outils"], ["scissors", "Ciseaux et peigne", "outils"], ["tin", "Pommade maison", "salon"], ["pole", "L'enseigne du salon", "salon"]];
const galerie = (c) => [sec(header(c)), pagehead("Le salon en images", "Galerie<br>& comptoir", "Les murs du salon, les outils de la maison et les produits que nous utilisons."),
  sec(`<section class="rs-wall pk-bleed rs-s-cream"><div class="rs-wrap"><div class="rs-sechead"><h2 class="rs-h2" data-reveal>Les murs du salon</h2><div class="rs-tabs" role="tablist" aria-label="Filtrer la galerie" data-scope><a href="#tout" class="is-on" role="tab" aria-selected="true" data-filter="all">Tout</a><a href="#salon" role="tab" aria-selected="false" data-filter="salon">Salon</a><a href="#outils" role="tab" aria-selected="false" data-filter="outils">Outils</a></div></div>
    <div class="rs-wall-grid" data-filterable>${WALL.map(([k, t, cat], i) => `<figure class="rs-frame rs-frame--${i % 3}" data-cat="${cat}" data-reveal>${k === "pole" ? `<div class="rs-frame-art rs-frame-art--pole">${pole("rs-pole--m")}</div>` : `<div class="rs-frame-art">${art(k)}</div>`}<figcaption>${esc(t)}</figcaption></figure>`).join("")}</div></div></section>`),
  sec(`<section class="rs-shop rs-shop--b pk-bleed rs-s-paper"><div class="rs-wrap"><div class="rs-sechead"><div><p class="rs-kicker" data-reveal>Au comptoir</p><h2 class="rs-h2" data-reveal>Les produits de la maison</h2></div><div class="rs-tabs" role="tablist" aria-label="Filtrer les produits" data-scope><a href="#tous" class="is-on" role="tab" aria-selected="true" data-filter="all">Tous</a><a href="#pommades" role="tab" aria-selected="false" data-filter="pommades">Coiffage</a><a href="#barbe" role="tab" aria-selected="false" data-filter="barbe">Barbe</a><a href="#rasage" role="tab" aria-selected="false" data-filter="rasage">Rasage</a></div></div>
    <div class="rs-pr-grid" data-filterable>${productCards(6)}</div><p class="rs-fine" data-reveal>Produits disponibles en boutique uniquement, prix indicatifs de démonstration. Aucune vente en ligne.</p></div></section>`),
  sec(`<section class="rs-band pk-bleed"><div class="rs-wrap rs-band-in"><div class="rs-band-t" role="heading" aria-level="2" data-reveal>Venez les toucher du doigt.</div><a class="rs-btn rs-btn--cream" href="/contact" data-reveal>Nous contacter ${arrow}</a></div></section>`),
  sec(footer(c))];

// ---------- contact / recherche / 404 ----------
const contact = (c) => [sec(header(c)), pagehead("Parlons-en", "Contact", "Une question, un événement, un cadeau pour un barbu : écrivez-nous."),
  { type: "form", heading: "Écrire au salon", intro: "Indiquez votre demande (ou collez le résumé de votre rendez-vous) : nous vous répondons sous deux jours ouvrés." },
  sec(`<section class="rs-visit rs-visit--c pk-bleed rs-s-cream"><div class="rs-wrap rs-visit-in"><div data-reveal><p class="rs-kicker">Où nous trouver</p><h2 class="rs-h2">12 rue des Tanneurs.</h2><address class="rs-addr">Barbier Rasoir<br>12 rue des Tanneurs, 69002 Lyon<br><a href="mailto:bonjour@rasoir.example">bonjour@rasoir.example</a></address></div><div class="rs-hours-box" data-reveal><h3>Horaires</h3>${hoursTable()}</div></div></section>`),
  { type: "layout", children: [{ type: "map", props: { address: "12 rue des Tanneurs, 69002 Lyon", zoom: 14, height: 360 } }] },
  sec(footer(c))];
const recherche = (c) => [sec(header(c)), pagehead("Rechercher", "Une info ?", "Une prestation, un barbier, un produit du comptoir."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [sec(header(c)), sec(`<section class="rs-404 pk-bleed rs-s-leather"><div class="rs-wrap rs-404-in"><div aria-hidden="true">${pole("rs-pole--m")}</div><div><p class="rs-kicker rs-kicker--l">Coupe ratée</p><div class="rs-ban" role="heading" aria-level="1"><span>Page</span><span>introuvable.</span></div><p class="rs-ph-sub">Cette page n'existe pas ou a changé d'adresse. Retournez au fauteuil, on vous y attend.</p><div class="rs-actions"><a class="rs-btn rs-btn--brass" href="/">Retour à l'accueil ${arrow}</a><a class="rs-btn rs-btn--cream" href="/recherche">Rechercher</a></div></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "rasoir", name: "Rasoir", version: "2.0.0", category: "beaute", tags: ["classique", "audacieux", "chaleureux"], siteType: "Salon de barbier", featured: true,
  concept: "Une enseigne de barbier géante aux bandes qui tournent, du cuir clouté, des tickets de service perforés et une prise de rendez-vous en trois choix.",
  description: "Salon de barbier : cuir brun clouté et papier d'affichage crème, enseigne à bandes rouge, bleu et blanc qui tournent, tickets perforés, carte des tarifs à la craie et prise de rendez-vous guidée.",
  brand: "Barbier Rasoir", modules: ["formulaires", "recherche"],
  dna: { header: "enseigne-de-cuir-a-clous-et-bande-rayee", hero: "poteau-de-barbier-geant-et-titre-sur-bande", grid: "tickets-de-service-perfores-qui-se-detachent", motion: "bandes-qui-tournent-et-enseigne-qui-se-balance", shapes: "clous-de-cuir-coutures-et-bords-perfores", rhythm: "bandes-de-cuir-et-papier-d-affichage-en-alternance", signature: "rendez-vous-barbier-prestation-et-creneau-de-la-semaine" },
  tokens: {
    colors: { primary: "#a8281f", secondary: "#2a1810", accent: "#c9963a", background: "#f1e6cc", surface: "#fbf3df", text: "#22140c", muted: "#5e4636", success: "#2f6b3a", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.alfa-slab-one", body: "font.zilla-slab", button: "font.rye", link: "font.zilla-slab" },
    radius: { sm: 4, md: 6, lg: 10, button: 4, field: 4, card: 6 }, shadow: { card: "4px 4px 0 #2a1810", button: "3px 3px 0 #2a1810" }, border: { width: 3, color: "#2a1810" },
    type: { h1: { size: 80, weight: 400, lineHeight: 1.05, transform: "none" }, h2: { size: 46, weight: 400, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Rouge de l'enseigne", type: "color", default: "#a8281f" },
    { key: "blue", label: "Bleu de l'enseigne", type: "color", default: "#1f3a6e" },
    { key: "spin", label: "Bandes qui tournent", type: "choice", default: "on", choices: [["on", "En mouvement"], ["off", "Immobiles"]] },
    { key: "studs", label: "Clous de cuir", type: "choice", default: "on", choices: [["on", "Visibles"], ["off", "Masqués"]] },
  ],
  menu: [["Accueil", "/"], ["Prestations", "/prestations"], ["Les barbiers", "/equipe"], ["Rendez-vous", "/rendez-vous"], ["Galerie", "/galerie"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "prestations", name: "Prestations", render: prestations }, { key: "equipe", name: "Les barbiers", render: equipe },
    { key: "rendez-vous", name: "Rendez-vous", render: rendezvous }, { key: "galerie", name: "Galerie et comptoir", render: galerie }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
