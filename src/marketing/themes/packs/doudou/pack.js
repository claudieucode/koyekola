// Doudou — crèche et école maternelle. Direction artistique : un livre d'images animé. Jaune beurre, bleu ciel, rose et vert menthe ; nuages, soleil souriant, ballons,
// nounours, blocs et arc-en-ciel dessinés en SVG ; coins très arrondis ; navigation en bulles ; journée type en frise cliquable ; pré-inscription guidée (rien n'est enregistré).
const { sec, form, esc, nav } = require("../kit");

/* ---------- dessins SVG (aucun id : le filtre de sécurité les supprime, donc des aplats uniquement) ---------- */
const cloud = (cls = "", fill = "#fff") => `<svg class="dd-cloud ${cls}" viewBox="0 0 120 70" aria-hidden="true"><path d="M30 64C12 64 4 52 8 40c3-9 12-13 21-10 3-14 17-23 32-19 10 3 16 10 18 18 13-5 28 3 28 17 0 10-6 18-16 18z" fill="${fill}"/></svg>`;
const sun = (cls = "") => `<svg class="dd-sun ${cls}" viewBox="0 0 120 120" aria-hidden="true"><g class="dd-rays" stroke="#ffb627" stroke-width="7" stroke-linecap="round">${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => `<line x1="60" y1="7" x2="60" y2="19" transform="rotate(${a} 60 60)"/>`).join("")}</g><circle cx="60" cy="60" r="31" fill="#ffd23f"/><circle cx="50" cy="56" r="3.6" fill="#6b4a1e"/><circle cx="70" cy="56" r="3.6" fill="#6b4a1e"/><path d="M49 67q11 10 22 0" fill="none" stroke="#6b4a1e" stroke-width="3.6" stroke-linecap="round"/><circle cx="42" cy="66" r="5" fill="#ff9ebb" opacity=".75"/><circle cx="78" cy="66" r="5" fill="#ff9ebb" opacity=".75"/></svg>`;
const balloon = (col, cls = "") => `<svg class="dd-balloon ${cls}" viewBox="0 0 60 130" aria-hidden="true"><path d="M30 4C14 4 4 18 4 33c0 18 14 34 26 38 12-4 26-20 26-38C56 18 46 4 30 4z" fill="${col}"/><path d="M16 22c2-6 7-10 12-11" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".6"/><path d="M26 71h8l-4 7z" fill="${col}"/><path d="M30 78c-8 12 8 20 0 30s6 14 0 20" fill="none" stroke="#4a3768" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const bearG = (fur = "#e0a56b", belly = "#f7d9b3", scarf = "#e8487f") => `<ellipse cx="65" cy="112" rx="34" ry="26" fill="${fur}"/><ellipse cx="65" cy="114" rx="20" ry="17" fill="${belly}"/><circle cx="27" cy="104" r="11" fill="${fur}"/><circle cx="103" cy="104" r="11" fill="${fur}"/><circle cx="38" cy="30" r="16" fill="${fur}"/><circle cx="38" cy="30" r="8" fill="${belly}"/><circle cx="92" cy="30" r="16" fill="${fur}"/><circle cx="92" cy="30" r="8" fill="${belly}"/><circle cx="65" cy="58" r="38" fill="${fur}"/><ellipse cx="65" cy="71" rx="17" ry="13" fill="${belly}"/><circle cx="51" cy="54" r="4.5" fill="#4a3768"/><circle cx="79" cy="54" r="4.5" fill="#4a3768"/><circle cx="52.5" cy="52.5" r="1.4" fill="#fff"/><circle cx="80.5" cy="52.5" r="1.4" fill="#fff"/><ellipse cx="65" cy="65" rx="6.5" ry="4.6" fill="#4a3768"/><path d="M65 69.5v5M57 76q8 6 16 0" fill="none" stroke="#4a3768" stroke-width="2.6" stroke-linecap="round"/><circle cx="42" cy="68" r="6" fill="#ff9ebb" opacity=".6"/><circle cx="88" cy="68" r="6" fill="#ff9ebb" opacity=".6"/><path d="M44 92q21 12 42 0l3 9q-24 13-48 0z" fill="${scarf}"/>`;
const bear = (cls = "", a, b, c) => `<svg class="dd-bear ${cls}" viewBox="0 0 130 140" aria-hidden="true">${bearG(a, b, c)}</svg>`;
const blocksG = () => `<rect x="6" y="72" width="54" height="54" rx="12" fill="#8fd3f4"/><circle cx="33" cy="99" r="12" fill="#fff" opacity=".85"/><rect x="66" y="72" width="54" height="54" rx="12" fill="#ff9ebb"/><path d="M93 84l12 28H81z" fill="#fff" opacity=".85"/><g transform="rotate(-7 63 44)"><rect x="35" y="14" width="54" height="54" rx="12" fill="#ffd95a"/><path d="M62 26l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#fff" opacity=".9"/></g>`;
const blocks = (cls = "") => `<svg class="dd-blocks ${cls}" viewBox="0 0 126 130" aria-hidden="true">${blocksG()}</svg>`;
const rainbow = (cls = "") => `<svg class="dd-rainbow ${cls}" viewBox="0 0 200 110" aria-hidden="true" fill="none" stroke-width="12">${[["#ff7b8a", 90], ["#ffab5e", 78], ["#ffd95a", 66], ["#7fdcae", 54], ["#8fd3f4", 42], ["#c3a8f0", 30]].map(([c, r]) => `<path d="M${100 - r} 106A${r} ${r} 0 0 1 ${100 + r} 106" stroke="${c}"/>`).join("")}</svg>`;
const star = (cls = "", fill = "#ffd95a") => `<svg class="dd-star ${cls}" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3l5 11 12 1.5-9 8 2.7 12L20 29.5 9.300 35.500 12 23.500l-9-8L15 14z" fill="${fill}"/></svg>`;
const heart = (fill = "#e8487f") => `<path d="M0 -4C-6 -14 -20 -8 -14 4 -10 11 -2 16 0 20 2 16 10 11 14 4 20 -8 6 -14 0 -4z" fill="${fill}"/>`;

// Petites bêtes pour l'équipe (portraits illustrés : aucune photo)
const critter = (kind) => {
  const K = {
    renard: { c: "#ff9f5a", ears: `<path d="M20 44 24 12l22 18zM100 44 96 12 74 30z" fill="#ff9f5a"/><path d="M26 36 28 20l12 10zM94 36 92 20 80 30z" fill="#ffd9b8"/>`, extra: `<path d="M60 96c-26 0-40-22-44-36 14 8 28 8 44 8s30 0 44-8c-4 14-18 36-44 36z" fill="#fff"/>`, bg: "#fff3c4" },
    lapin: { c: "#f4eaf5", ears: `<rect x="30" y="-4" width="20" height="56" rx="10" fill="#f4eaf5"/><rect x="70" y="-4" width="20" height="56" rx="10" fill="#f4eaf5"/><rect x="35" y="6" width="10" height="38" rx="5" fill="#ff9ebb"/><rect x="75" y="6" width="10" height="38" rx="5" fill="#ff9ebb"/>`, extra: "", bg: "#ffe3ec" },
    herisson: { c: "#e0b98f", ears: `<path d="M12 62C10 26 34 8 60 8s50 18 48 54c-12-10-26-12-48-12S24 52 12 62z" fill="#8a6a55"/><path d="M14 40l-8-6M22 24l-6-8M40 12l-2-9M60 8V0M80 12l2-9M98 24l6-8M106 40l8-6" stroke="#8a6a55" stroke-width="5" stroke-linecap="round"/>`, extra: "", bg: "#d9f6e5" },
    chouette: { c: "#b79bf0", ears: `<path d="M18 52 14 14l28 16zM102 52 106 14 78 30z" fill="#b79bf0"/>`, extra: `<circle cx="42" cy="58" r="17" fill="#fff"/><circle cx="78" cy="58" r="17" fill="#fff"/>`, bg: "#e9defc" },
    grenouille: { c: "#7fdcae", ears: `<circle cx="34" cy="38" r="19" fill="#7fdcae"/><circle cx="86" cy="38" r="19" fill="#7fdcae"/>`, extra: `<circle cx="34" cy="38" r="12" fill="#fff"/><circle cx="86" cy="38" r="12" fill="#fff"/>`, bg: "#d9f0fc" },
    chat: { c: "#9aa7c7", ears: `<path d="M20 54 22 12l26 20zM100 54 98 12 72 32z" fill="#9aa7c7"/><path d="M27 40 28 24l12 9zM93 40 92 24 80 33z" fill="#ff9ebb"/>`, extra: "", bg: "#ffe9c9" },
  }[kind] || {};
  const eyes = kind === "chouette" ? `<circle cx="42" cy="58" r="7" fill="#4a3768"/><circle cx="78" cy="58" r="7" fill="#4a3768"/><circle cx="44" cy="56" r="2.2" fill="#fff"/><circle cx="80" cy="56" r="2.2" fill="#fff"/><path d="M54 66h12l-6 10z" fill="#ffab5e"/>` : kind === "grenouille" ? `<circle cx="34" cy="38" r="6" fill="#4a3768"/><circle cx="86" cy="38" r="6" fill="#4a3768"/><path d="M40 72q20 16 40 0" fill="none" stroke="#4a3768" stroke-width="3.4" stroke-linecap="round"/>` : `<circle cx="46" cy="64" r="5.5" fill="#4a3768"/><circle cx="74" cy="64" r="5.5" fill="#4a3768"/><circle cx="47.600" cy="62.400" r="1.800" fill="#fff"/><circle cx="75.600" cy="62.400" r="1.800" fill="#fff"/><ellipse cx="60" cy="74" rx="5.500" ry="4" fill="#4a3768"/><path d="M60 78v4M53 84q7 5 14 0" fill="none" stroke="#4a3768" stroke-width="2.600" stroke-linecap="round"/>`;
  return `<svg class="dd-critter" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="60" fill="${K.bg}"/>${K.ears}<ellipse cx="60" cy="68" rx="40" ry="34" fill="${K.c}"/>${K.extra}${eyes}<circle cx="34" cy="76" r="6" fill="#ff9ebb" opacity=".55"/><circle cx="86" cy="76" r="6" fill="#ff9ebb" opacity=".55"/></svg>`;
};

/* ---------- la journée type : 8 moments ---------- */
const DAY = [
  { t: "7h30", at: 450, n: "Accueil", title: "Accueil tout en douceur", span: "7h30 – 9h00", tone: "butter", d: "Un câlin, un bisou, un rituel : chaque enfant est salué par son prénom. Les transmissions se font à voix basse avec les parents, puis l'enfant choisit son premier jeu.", small: "Le doudou et la tétine ont leur panier. On prend le temps de se séparer, sans se presser.", big: "Dessin libre, coin lecture et petits jeux calmes pendant que les amis arrivent.", tip: "Un petit rituel de départ, toujours le même (un bisou, un signe à la fenêtre), rassure beaucoup." },
  { t: "9h00", at: 540, n: "Jeux", title: "Jeux d'éveil et de motricité", span: "9h00 – 10h15", tone: "sky", d: "Tapis, tunnels, blocs à empiler, parcours en mousse : le corps apprend en s'amusant, à son rythme, sous le regard d'une professionnelle.", small: "Ramper, se hisser, attraper : des jeux au sol pour découvrir son corps.", big: "Parcours de motricité, jeux de construction et jeux d'imitation (la dînette, le docteur).", tip: "Laissez l'enfant explorer sans le placer dans une position qu'il n'a pas trouvée seul." },
  { t: "10h15", at: 615, n: "Atelier", title: "Atelier créatif", span: "10h15 – 11h15", tone: "pink", d: "Peinture aux doigts, pâte à modeler, collages de feuilles : on mélange les couleurs, on salit un peu, on est très fier de ses œuvres.", small: "Matières à toucher : semoule, eau, tissus doux, gros pinceaux.", big: "Peinture, découpage, graphisme et premiers pas vers l'écriture, en petit groupe.", tip: "Accrochez le dessin du jour sur le frigo et demandez « raconte-moi », plutôt que « qu'est-ce que c'est ? »." },
  { t: "11h30", at: 690, n: "Repas", title: "Le repas", span: "11h30 – 12h30", tone: "mint", d: "Un repas préparé sur place, dans le calme. Les enfants goûtent de tout, se servent un peu seuls et découvrent les saveurs sans jamais être forcés.", small: "Biberons ou purées selon l'âge, puis petits morceaux ; on mange sur les genoux ou à table basse.", big: "Les enfants se servent, versent l'eau et débarrassent leur assiette : des gestes d'autonomie.", tip: "Regardez la page « Menus » pour en parler à table le soir : « as-tu goûté les lentilles ? »." },
  { t: "12h30", at: 750, n: "Sieste", title: "Sieste et repos", span: "12h30 – 15h00", tone: "lilac", d: "Lumière tamisée, musique douce, lits à hauteur d'enfant. Chacun dort selon son besoin ; ceux qui ne dorment pas se reposent avec un livre.", small: "Chaque bébé a son lit, son sac de couchage et son rythme, respecté.", big: "Sieste pour les petits de maternelle, temps calme et histoires pour les plus grands.", tip: "Une sieste trop tardive repousse l'endormissement du soir : n'hésitez pas à nous en parler." },
  { t: "15h00", at: 900, n: "Goûter", title: "Réveil et goûter", span: "15h00 – 16h00", tone: "orange", d: "On se réveille doucement, on remet ses chaussures, puis on goûte : un fruit, du pain, un laitage. Parfois un gâteau fait par les enfants.", small: "Réveil échelonné, change et petit câlin avant le goûter.", big: "Les enfants aident à mettre la table et choisissent leur fruit.", tip: "Un goûter léger laisse de l'appétit pour le dîner ; les goûters d'anniversaire sont à prévoir avec nous." },
  { t: "16h00", at: 960, n: "Dehors", title: "Jardin et histoires", span: "16h00 – 17h30", tone: "sky", d: "Dans le jardin, on court, on creuse, on arrose les fleurs. Quand il pleut, on enfile les bottes ! Puis une histoire pour terminer la journée.", small: "Promenade en poussette, bac à sable et jeux d'eau à la belle saison.", big: "Jeux de ballon, vélos sans pédales, jardinage et petites expériences en plein air.", tip: "Prévoyez des vêtements qu'on peut salir et des bottes qui restent à la crèche." },
  { t: "17h30", at: 1050, n: "Départ", title: "Les retrouvailles", span: "17h30 – 18h30", tone: "pink", d: "Les parents arrivent : on raconte la journée, on montre le dessin, on fait un dernier câlin au nounours. Chaque enfant part avec un mot sur sa journée.", small: "Un petit carnet de liaison résume repas, sieste et changes.", big: "L'enfant raconte lui-même sa journée à l'aide d'images affichées au mur.", tip: "Laissez-nous quelques minutes de transmission : c'est le moment pour partager une inquiétude." },
];

const glyph = (i) => [
  `<circle cx="12" cy="13" r="5" fill="#fff"/><path d="M3 19h18" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M12 2v3M4 7l2 2M20 7l-2 2" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>`,
  `<rect x="3" y="12" width="8" height="8" rx="2" fill="#fff"/><rect x="13" y="12" width="8" height="8" rx="2" fill="#fff"/><rect x="8" y="3" width="8" height="8" rx="2" fill="#fff"/>`,
  `<path d="M12 3C6 3 2 7 2 12c0 4 3 6 6 5 2-1 3 1 3 3 0 1 1 2 3 1 5-1 8-5 8-9 0-5-4-9-10-9z" fill="#fff"/><circle cx="8" cy="9" r="1.6" fill="#e8487f"/><circle cx="13" cy="7" r="1.6" fill="#2c7fc0"/><circle cx="17" cy="11" r="1.6" fill="#237a54"/>`,
  `<path d="M3 11h18a9 9 0 0 1-18 0z" fill="#fff"/><path d="M8 7c0-2 2-2 2-4M13 7c0-2 2-2 2-4" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  `<path d="M20 14.500A8.500 8.500 0 0 1 9.500 4 8.500 8.500 0 1 0 20 14.500z" fill="#fff"/>`,
  `<circle cx="12" cy="12" r="9" fill="#fff"/><circle cx="8.500" cy="9.500" r="1.500" fill="#a0623c"/><circle cx="14.500" cy="8.500" r="1.500" fill="#a0623c"/><circle cx="12" cy="14.500" r="1.500" fill="#a0623c"/><circle cx="16" cy="14" r="1.300" fill="#a0623c"/>`,
  `<circle cx="12" cy="8" r="6" fill="#fff"/><rect x="11" y="13" width="2.400" height="8" fill="#fff"/><path d="M5 21h14" stroke="#fff" stroke-width="2.400" stroke-linecap="round"/>`,
  `<path d="M3 12 12 4l9 8h-3v8H6v-8z" fill="#fff"/><path d="M12 17.500c-3-2-3-4.500-1.300-4.500.8 0 1.300.5 1.300 1 0-.5.500-1 1.300-1 1.700 0 1.700 2.500-1.300 4.500z" fill="#e8487f"/>`,
][i];

const scene = (i) => [
  `<circle cx="196" cy="44" r="22" fill="#ffd23f"/><path d="M0 150v-40c40-24 80-18 120-6s80 6 120-4v50z" fill="#7fdcae"/><g transform="translate(78 32) scale(.78)">${bearG()}</g><rect x="14" y="62" width="44" height="64" rx="22" fill="#ff9ebb"/><circle cx="48" cy="96" r="3.500" fill="#fff"/>`,
  `<g transform="translate(26 20) scale(.95)">${blocksG()}</g><circle cx="176" cy="104" r="26" fill="#e8487f"/><path d="M152 98q24 14 48 0M158 120q18-10 36 0" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M0 138h240v12H0z" fill="#fff" opacity=".6"/>`,
  `<rect x="20" y="22" width="96" height="104" rx="12" fill="#fff"/><g transform="translate(26 46) scale(.45)">${rainbow().replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g><path d="M30 118h76" stroke="#8fd3f4" stroke-width="6" stroke-linecap="round"/><ellipse cx="170" cy="88" rx="52" ry="40" fill="#f2c28b"/><circle cx="144" cy="76" r="9" fill="#e8487f"/><circle cx="168" cy="64" r="9" fill="#2c7fc0"/><circle cx="194" cy="76" r="9" fill="#ffd23f"/><circle cx="190" cy="102" r="9" fill="#237a54"/><ellipse cx="160" cy="104" rx="10" ry="7" fill="#fff6cf"/><path d="M110 30l40 36" stroke="#a0623c" stroke-width="7" stroke-linecap="round"/>`,
  `<circle cx="120" cy="82" r="62" fill="#fff"/><circle cx="120" cy="82" r="46" fill="none" stroke="#bdeccf" stroke-width="6"/><circle cx="104" cy="74" r="8" fill="#7fdcae"/><circle cx="122" cy="68" r="8" fill="#7fdcae"/><circle cx="114" cy="90" r="8" fill="#7fdcae"/><rect x="132" y="82" width="34" height="14" rx="7" fill="#ffab5e"/><path d="M26 128c10-26 16-44 22-60M20 70h22" stroke="#c0c6d4" stroke-width="7" stroke-linecap="round" fill="none"/><ellipse cx="38" cy="58" rx="12" ry="9" fill="#c0c6d4"/>`,
  `<path d="M198 24a22 22 0 1 0 14 38 18 18 0 0 1-14-38z" fill="#fff6cf"/><g transform="translate(150 20) scale(.5)"><path d="M20 3l5 11 12 1.500-9 8 2.700 12L20 29.500 9.300 35.500 12 23.500l-9-8L15 14z" fill="#ffd95a"/></g><g transform="translate(38 32) scale(.9) rotate(-8 65 90)">${bearG("#e0a56b", "#f7d9b3", "#c3a8f0")}</g><path d="M30 112q45-24 90-8t92-4v50H30z" fill="#a98ce6"/><circle cx="70" cy="128" r="4" fill="#fff" opacity=".7"/><circle cx="130" cy="124" r="4" fill="#fff" opacity=".7"/><circle cx="188" cy="130" r="4" fill="#fff" opacity=".7"/>`,
  `<circle cx="96" cy="88" r="52" fill="#d9964f"/><circle cx="78" cy="70" r="8" fill="#6b3b1e"/><circle cx="108" cy="62" r="8" fill="#6b3b1e"/><circle cx="120" cy="96" r="8" fill="#6b3b1e"/><circle cx="82" cy="104" r="8" fill="#6b3b1e"/><circle cx="104" cy="116" r="6" fill="#6b3b1e"/><path d="M160 54h50l-6 76q-19 8-38 0z" fill="#fff"/><path d="M164 78h42l-2 28q-19 8-38 0z" fill="#e6f4fc"/><path d="M196 54l10-26" stroke="#e8487f" stroke-width="6" stroke-linecap="round"/>`,
  `<circle cx="52" cy="38" r="20" fill="#ffd23f"/><path d="M0 150v-30q60-26 120-10t120-6v46z" fill="#7fdcae"/><rect x="164" y="76" width="12" height="52" fill="#a0623c"/><circle cx="170" cy="62" r="30" fill="#4fb98a"/><circle cx="150" cy="78" r="18" fill="#4fb98a"/><circle cx="192" cy="78" r="18" fill="#4fb98a"/><g transform="translate(96 14) rotate(14 20 30)"><path d="M20 0 40 24 20 56 0 24z" fill="#ff9ebb"/><path d="M20 0v56M0 24h40" stroke="#fff" stroke-width="2.500"/></g><path d="M112 70c-8 20 10 26 0 44" stroke="#4a3768" stroke-width="2" fill="none"/>`,
  `<path d="M0 150v-26h240v26z" fill="#7fdcae"/><g transform="translate(132 28)"><path d="M0 52 46 8l46 44h-8v58H8V52z" fill="#fff"/><rect x="34" y="70" width="24" height="40" rx="12" fill="#ff9ebb"/><path d="M0 52 46 8l46 44z" fill="#e8487f" opacity=".9"/></g><g transform="translate(18 26) scale(.85)">${bearG()}<rect x="4" y="94" width="26" height="40" rx="12" fill="#8fd3f4"/></g><g transform="translate(116 36) scale(.7)">${heart()}</g>`,
][i];

const dayFrise = () => DAY.map((m, i) => `<a href="#moment-${i + 1}" class="dd-fb dd-t-${m.tone}${i === 0 ? " is-on" : ""}" role="tab" aria-selected="${i === 0}" data-at="${m.at}"><i class="dd-fico"><svg viewBox="0 0 24 24" aria-hidden="true">${glyph(i)}</svg></i><b>${m.t}</b><span>${m.n}</span></a>`).join("");
const dayPanels = () => DAY.map((m) => `<article class="dd-dp dd-t-${m.tone}" role="tabpanel" data-dd-panel><div class="dd-dp-art"><svg viewBox="0 0 240 150" aria-hidden="true">${scene(DAY.indexOf(m))}</svg></div>
  <div class="dd-dp-body"><p class="dd-time">${m.span}</p><h3 class="dd-h3">${esc(m.title)}</h3><p>${esc(m.d)}</p>
  <div class="dd-dp-cols"><div><h4>Chez les petits</h4><p>${esc(m.small)}</p></div><div><h4>Chez les grands</h4><p>${esc(m.big)}</p></div></div>
  <p class="dd-tip"><strong>À la maison</strong> ${esc(m.tip)}</p></div></article>`).join("");
const wavy = `<svg class="dd-fpath" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 20C60 0 100 40 160 20s100 20 160 0 100 20 160 0 100 20 160 0 100 20 160 0 100 20 160 0" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>`;
const dayComp = (lead) => `<section class="dd-sec dd-s-sky dd-day pk-bleed" data-dd-tabs data-dd-day><div class="dd-wrap">
  <div class="dd-head2"><p class="dd-kicker" data-reveal>Une journée type</p><h2 class="dd-h2" data-reveal>De l'accueil au dernier câlin</h2><p class="dd-lead" data-reveal>${esc(lead || "Touchez une bulle pour découvrir ce qui se passe à chaque moment, chez les petits comme chez les grands.")}</p></div>
  <div class="dd-frisewrap" data-reveal>${wavy}<div class="dd-frise" role="tablist" aria-label="Les huit moments de la journée">${dayFrise()}</div></div>
  <div class="dd-dtools"><a class="dd-chip" href="#maintenant">Que fait-on en ce moment ?</a><a class="dd-chip" href="#visite" role="button" aria-pressed="false" data-play>Parcourir la journée</a></div>
  <p class="dd-live" role="status"></p>
  <div class="dd-panels">${dayPanels()}</div></div></section>`;

/* ---------- pré-inscription guidée ---------- */
const opt = (kind, v, extra = "") => `<a class="dd-opt" href="#choix" role="${kind}" aria-${kind === "radio" ? "checked" : "checked"}="false" data-v="${esc(v)}"${extra}>${esc(v)}</a>`;
const grp = (key, type, label, req, values, hint) => `<div class="dd-g" data-key="${key}" data-type="${type}" data-req="${req ? 1 : 0}" data-label="${esc(label)}"><p class="dd-q">${esc(label)}${req ? ' <small>(obligatoire)</small>' : ' <small>(facultatif)</small>'}</p>${hint ? `<p class="dd-hint">${esc(hint)}</p>` : ""}<div class="dd-opts" role="${type === "radio" ? "radiogroup" : "group"}" aria-label="${esc(label)}">${values.map((v) => opt(type === "radio" ? "radio" : "checkbox", v, v.startsWith("Aucun") ? ' data-none="1"' : "")).join("")}</div><p class="dd-err" role="alert" hidden></p></div>`;
const wizard = () => `<section class="dd-sec dd-s-butter dd-pre pk-bleed" data-dd-wiz><div class="dd-wrap dd-pre-in">
  <div class="dd-pre-intro"><p class="dd-kicker" data-reveal>Pré-inscription guidée</p><h2 class="dd-h2" data-reveal>Préparons votre demande ensemble</h2><p class="dd-lead" data-reveal>Cinq petites étapes pour nous dire qui est votre enfant et ce dont votre famille a besoin. C'est une démonstration : <strong>rien n'est enregistré ni envoyé</strong> par cet outil. À la fin, vous obtenez un récapitulatif à copier dans le formulaire de contact.</p>${bear("dd-pre-bear")}</div>
  <div class="dd-card dd-wizcard" data-reveal><ol class="dd-steps" aria-label="Étapes de la pré-inscription"><li>Enfant</li><li>Besoins</li><li>Jours</li><li>Famille</li><li>Récap</li></ol>
  <div class="dd-step" data-step="0"><h3 class="dd-h3" data-focus>1. Votre enfant</h3>${grp("age", "radio", "Quel âge a votre enfant ?", true, ["3 à 12 mois", "1 à 2 ans", "2 à 3 ans", "3 à 6 ans (maternelle)"])}${grp("rentree", "radio", "Pour quelle rentrée ?", true, ["Dès que possible", "Janvier 2027", "Avril 2027", "Septembre 2027"])}</div>
  <div class="dd-step" data-step="1" hidden><h3 class="dd-h3" data-focus>2. Ses besoins</h3>${grp("besoins", "check", "Y a-t-il des besoins particuliers ?", false, ["Allergie ou régime alimentaire", "Adaptation très progressive", "Handicap ou accompagnement spécifique", "Sieste longue", "Une autre langue à la maison", "Aucun besoin particulier"], "Plusieurs réponses possibles. Nous en parlerons de vive voix, sans rien noter ici.")}</div>
  <div class="dd-step" data-step="2" hidden><h3 class="dd-h3" data-focus>3. Les jours d'accueil</h3>${grp("jours", "check", "Quels jours souhaitez-vous ?", true, ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"])}${grp("formule", "radio", "Quelle durée de journée ?", true, ["Journée complète", "Matinée avec repas", "Après-midi avec repas", "Quelques heures par semaine"])}</div>
  <div class="dd-step" data-step="3" hidden><h3 class="dd-h3" data-focus>4. Votre famille</h3>${grp("foyer", "radio", "Combien d'enfants dans le foyer ?", true, ["1 enfant", "2 enfants", "3 enfants ou plus"])}${grp("contact", "radio", "Comment préférez-vous être recontacté·e ?", true, ["Par courriel", "Par téléphone", "Par une visite de découverte"])}</div>
  <div class="dd-step" data-step="4" hidden><h3 class="dd-h3" data-focus>5. Votre récapitulatif</h3><p class="dd-recap-lead">Voici votre demande. Copiez-la, puis collez-la dans le formulaire de contact : l'équipe vous répondra.</p><dl class="dd-recap" data-recap></dl><p class="dd-demo">Démonstration : ce récapitulatif n'est ni enregistré ni transmis tant que vous ne l'envoyez pas vous-même par le formulaire.</p><div class="dd-acts"><a class="dd-btn" href="#copier">Copier le récapitulatif</a><a class="dd-btn dd-btn--sun" href="/contact">Aller au formulaire de contact</a><a class="dd-btn dd-btn--ghost" href="#recommencer">Recommencer</a></div><p class="dd-live" role="status" data-copied></p></div>
  <div class="dd-wnav"><a class="dd-btn dd-btn--ghost" href="#retour" data-prev hidden>Retour</a><a class="dd-btn" href="#continuer" data-next>Continuer</a></div></div></div></section>`;

/* ---------- gabarits communs ---------- */
const header = (c) => `<header class="dd-head pk-bleed"><div class="dd-bar"><a class="dd-logo" href="/" aria-label="${esc(c.brand)} — accueil">${bear("dd-logo-bear")}<span><b>Les Petits Doudous</b><small>Crèche &amp; école maternelle</small></span></a>
  <div class="dd-nav" role="navigation" aria-label="Navigation principale">${c.menu.map(({ label, url }, i) => `<a class="dd-bub dd-bub${i % 6}" href="${esc(url)}">${esc(label)}</a>`).join("")}</div>
  <details class="dd-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="dd-drawer" role="navigation" aria-label="Menu mobile">${c.menu.map(({ label, url }, i) => `<a class="dd-bub dd-bub${i % 6}" href="${esc(url)}">${esc(label)}</a>`).join("")}</div></details></div></header>`;

const footer = (c) => `<footer class="dd-foot pk-bleed"><div class="dd-foot-sky" aria-hidden="true">${cloud("dd-fc1")}${cloud("dd-fc2")}${rainbow("dd-foot-rb")}</div><div class="dd-wrap"><div class="dd-foot-grid">
  <div><p class="dd-foot-lead">Ici, on grandit en jouant.</p><address>12 rue des Coquelicots<br>00000 Ville-Exemple<br>Du lundi au vendredi, 7h30 – 18h30</address></div>
  <div><h2 class="dd-fh">La maison</h2>${nav(c.menu.slice(1, 5), "dd-fl")}</div>
  <div><h2 class="dd-fh">Au quotidien</h2>${nav(c.menu.slice(5, 7), "dd-fl")}<a class="dd-fl" href="/recherche">Rechercher</a></div>
  <div><h2 class="dd-fh">Nous écrire</h2><a class="dd-fl" href="/contact">Formulaire de contact</a><a class="dd-fl" href="/tarifs">Pré-inscription guidée</a></div></div>
  <p class="dd-legal">© Les Petits Doudous — site de démonstration. Structure, équipe, tarifs et menus fictifs ; aucune photo d'enfant ; aucune donnée collectée par ce thème.</p></div></footer>`;

const pagehead = (kicker, title, sub, art) => sec(`<section class="dd-ph pk-bleed"><div class="dd-skyfx" aria-hidden="true">${cloud("dd-c1")}${cloud("dd-c2")}${star("dd-st1")}${star("dd-st2", "#fff")}</div><div class="dd-wrap dd-ph-in"><div><p class="dd-kicker" data-reveal>${esc(kicker)}</p><div class="dd-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="dd-lead" data-reveal>${esc(sub)}</p>` : ""}</div><div class="dd-ph-art" aria-hidden="true">${art || ""}</div></div></section>`);

const sechead = (kicker, title, lead) => `<div class="dd-head2"><p class="dd-kicker" data-reveal>${esc(kicker)}</p><h2 class="dd-h2" data-reveal>${title}</h2>${lead ? `<p class="dd-lead" data-reveal>${esc(lead)}</p>` : ""}</div>`;

/* ---------- accueil ---------- */
const home = (c) => [
  sec(header(c)),
  sec(`<section class="dd-hero pk-bleed"><div class="dd-wrap dd-hero-in">
    <div class="dd-hero-copy"><p class="dd-kicker" data-reveal>Crèche &amp; école maternelle · démonstration</p>
      <div class="dd-h1 dd-h1--hero" role="heading" aria-level="1" data-reveal>Un nid douillet pour <span class="dd-hl">grandir</span> en jouant</div>
      <p class="dd-lead" data-reveal>De 3 mois à 6 ans, les enfants découvrent le monde dans une maison pleine de couleurs, de comptines et de câlins. Des professionnelles attentives, un jardin, des repas faits sur place.</p>
      <div class="dd-actions" data-reveal><a class="dd-btn dd-btn--lg" href="/journee">Découvrir la journée</a><a class="dd-btn dd-btn--sun dd-btn--lg" href="/tarifs">Pré-inscription guidée</a></div>
      <ul class="dd-pills" data-reveal><li>3 mois – 6 ans</li><li>7h30 – 18h30</li><li>Repas sur place</li></ul></div>
    <div class="dd-scene" role="img" aria-label="Paysage illustré : un soleil souriant, des nuages, un arc-en-ciel, des ballons, un nounours et des blocs sur une colline.">
      ${rainbow("dd-s-rb")}${sun("dd-s-sun")}${cloud("dd-s-c1")}${cloud("dd-s-c2")}${cloud("dd-s-c3", "#fff6cf")}
      <svg class="dd-s-hills" viewBox="0 0 560 160" preserveAspectRatio="none" aria-hidden="true"><path d="M0 70C120 20 220 40 320 70S480 90 560 50V160H0z" fill="#8fe0b3"/><path d="M0 110C140 70 260 100 380 118S520 110 560 96V160H0z" fill="#5fcb97"/></svg>
      ${balloon("#e8487f", "dd-s-b1")}${balloon("#ffd95a", "dd-s-b2")}${balloon("#8fd3f4", "dd-s-b3")}${bear("dd-s-bear")}${blocks("dd-s-blocks")}${star("dd-s-st1")}${star("dd-s-st2", "#fff")}</div></div></section>`),
  sec(`<section class="dd-sec dd-s-cream dd-nums pk-bleed"><ul class="dd-wrap dd-nums-in">
    <li class="dd-bubble dd-n1" data-reveal><b data-count="36">36</b><span>places en crèche</span></li><li class="dd-bubble dd-n2" data-reveal><b data-count="2">2</b><span>classes de maternelle</span></li><li class="dd-bubble dd-n3" data-reveal><b data-count="11">11</b><span>professionnelles de la petite enfance</span></li><li class="dd-bubble dd-n4" data-reveal><b data-count="1" data-suffix=" jardin">1 jardin</b><span>pour courir et creuser</span></li></ul></section>`),
  sec(dayComp()),
  sec(`<section class="dd-sec dd-s-pink dd-vals pk-bleed"><div class="dd-wrap">${sechead("Ce qui compte pour nous", "Quatre promesses pour les petits")}
    <div class="dd-vals-in"><article class="dd-val dd-v1" data-reveal><span class="dd-vico">${bear("dd-vb")}</span><h3 class="dd-h3">Bienveillance</h3><p>Chaque émotion est accueillie : on console, on explique, on reste à côté.</p></article>
    <article class="dd-val dd-v2" data-reveal><span class="dd-vico">${blocks("dd-vb")}</span><h3 class="dd-h3">Jeu libre</h3><p>Jouer est la meilleure façon d'apprendre. Les adultes proposent, l'enfant choisit.</p></article>
    <article class="dd-val dd-v3" data-reveal><span class="dd-vico">${sun("dd-vb")}</span><h3 class="dd-h3">Dehors</h3><p>Une sortie au jardin chaque jour, même quand il pleut un peu.</p></article>
    <article class="dd-val dd-v4" data-reveal><span class="dd-vico">${balloon("#e8487f", "dd-vb dd-vb--b")}</span><h3 class="dd-h3">Familles partenaires</h3><p>Des transmissions chaque jour et des temps de rencontre toute l'année.</p></article></div></div></section>`),
  sec(`<section class="dd-sec dd-s-mint dd-houses pk-bleed"><div class="dd-wrap">${sechead("Deux maisons, un même jardin", "La crèche et la maternelle")}
    <div class="dd-houses-in"><article class="dd-house dd-h-a" data-reveal><div class="dd-roof" aria-hidden="true"></div><h3 class="dd-h3">La crèche</h3><p class="dd-age">3 mois – 3 ans</p><p>Trois groupes d'âge, des repères stables et une référente pour chaque enfant. Rythme de sieste et de repas respecté.</p><a class="dd-more" href="/projet">Notre projet</a></article>
    <article class="dd-house dd-h-b" data-reveal><div class="dd-roof" aria-hidden="true"></div><h3 class="dd-h3">L'école maternelle</h3><p class="dd-age">3 – 6 ans</p><p>Deux classes à petits effectifs : langage, graphisme, nombres et vivre ensemble, dans la continuité de la crèche.</p><a class="dd-more" href="/journee">La journée type</a></article></div></div></section>`),
  sec(`<section class="dd-sec dd-s-cream dd-newsh pk-bleed"><div class="dd-wrap">${sechead("Dans la vie de la maison", "Les nouvelles du moment")}
    <div class="dd-newsh-in"><a class="dd-ncard" href="/actualites" data-reveal><span class="dd-tag">Vie de la crèche</span><h3 class="dd-h3">La fête des couleurs arrive</h3><p>Des ateliers de peinture pour toute la maison, en novembre.</p></a>
    <a class="dd-ncard" href="/actualites" data-reveal><span class="dd-tag">Sorties</span><h3 class="dd-h3">Promenade à la ferme</h3><p>Les grands rendent visite aux poules et aux lapins.</p></a>
    <a class="dd-ncard" href="/actualites" data-reveal><span class="dd-tag">Parents</span><h3 class="dd-h3">Café des familles</h3><p>Un samedi matin pour se rencontrer autour d'un thé.</p></a></div></div></section>`),
  sec(`<section class="dd-sec dd-s-sky dd-cta pk-bleed">${cloud("dd-cta-c1")}${cloud("dd-cta-c2")}<div class="dd-wrap dd-cta-in"><div data-reveal>${bear("dd-cta-bear")}</div><div data-reveal><h2 class="dd-h2">Envie de nous rendre visite ?</h2><p class="dd-lead">Préparez votre pré-inscription en quelques clics, puis écrivez-nous : nous organiserons une visite de la maison.</p><div class="dd-actions"><a class="dd-btn dd-btn--lg" href="/tarifs">Commencer la pré-inscription</a><a class="dd-btn dd-btn--ghost dd-btn--lg" href="/contact">Nous écrire</a></div></div></div></section>`),
  sec(footer(c)),
];

/* ---------- notre projet ---------- */
const projet = (c) => [
  sec(header(c)),
  pagehead("Notre projet", "Grandir <span class=\"dd-hl\">ensemble</span>, à son rythme", "Une pédagogie du jeu, du dehors et de la confiance, pour les enfants comme pour leurs parents.", rainbow("dd-ph-rb") + bear("dd-ph-bear")),
  sec(`<section class="dd-sec dd-s-cream dd-tower pk-bleed"><div class="dd-wrap">${sechead("Nos cinq repères", "Une tour de blocs, un bloc par principe")}
    <ol class="dd-tower-in">
    <li class="dd-blk dd-bk1" data-reveal><span class="dd-bk-n">1</span><div><h3 class="dd-h3">Chaque enfant est unique</h3><p>Nous observons avant d'agir : ses envies, ses peurs, son tempo. Un projet d'accueil individuel est écrit avec la famille.</p></div></li>
    <li class="dd-blk dd-bk2" data-reveal><span class="dd-bk-n">2</span><div><h3 class="dd-h3">Le jeu est un travail d'enfant</h3><p>Construire, verser, cacher, imiter : en jouant librement, il apprend à parler, compter, se concentrer.</p></div></li>
    <li class="dd-blk dd-bk3" data-reveal><span class="dd-bk-n">3</span><div><h3 class="dd-h3">Le dehors fait du bien</h3><p>Jardin, potager, flaques : bouger au grand air donne de l'énergie et de l'appétit.</p></div></li>
    <li class="dd-blk dd-bk4" data-reveal><span class="dd-bk-n">4</span><div><h3 class="dd-h3">Les émotions ont leur place</h3><p>Colère, joie, tristesse : on met des mots et des images sur ce qu'on ressent, avec des albums et des marionnettes.</p></div></li>
    <li class="dd-blk dd-bk5" data-reveal><span class="dd-bk-n">5</span><div><h3 class="dd-h3">Les parents sont nos partenaires</h3><p>Transmissions quotidiennes, rencontres, ateliers parents-enfants : on se parle simplement.</p></div></li></ol></div></section>`),
  sec(`<section class="dd-sec dd-s-butter dd-pedago pk-bleed"><div class="dd-wrap dd-split">
    <div>${sechead("Dans la pratique", "Comment ça se passe dans les salles")}<dl class="dd-dl" data-reveal><dt>Des petits groupes</dt><dd>Jamais plus de huit enfants autour d'une adulte pour les activités.</dd><dt>Des coins de jeu permanents</dt><dd>Dînette, construction, livres, voitures : l'enfant sait où trouver ce qu'il aime.</dd><dt>Des rituels rassurants</dt><dd>Une comptine pour dire bonjour, une autre pour ranger, une histoire pour finir.</dd><dt>Des professionnelles formées</dt><dd>Éducatrices de jeunes enfants, auxiliaires de puériculture et enseignantes, avec des formations régulières.</dd></dl></div>
    <div class="dd-pedago-art" data-reveal aria-hidden="true">${cloud("dd-pa-c")}${blocks("dd-pa-b")}${bear("dd-pa-bear")}${balloon("#ff9ebb", "dd-pa-bl")}</div></div></section>`),
  sec(`<section class="dd-sec dd-s-mint dd-seasons pk-bleed"><div class="dd-wrap">${sechead("Un an chez les doudous", "Quatre saisons, quatre grands thèmes")}
    <ul class="dd-seasons-in"><li class="dd-se dd-se1" data-reveal><b>Automne</b><span>Feuilles, châtaignes, couleurs</span></li><li class="dd-se dd-se2" data-reveal><b>Hiver</b><span>Contes, lumières et soupes</span></li><li class="dd-se dd-se3" data-reveal><b>Printemps</b><span>Graines, œufs, papillons</span></li><li class="dd-se dd-se4" data-reveal><b>Été</b><span>Eau, sable, fêtes de fin d'année</span></li></ul></div></section>`),
  sec(`<section class="dd-sec dd-s-pink dd-charter pk-bleed"><div class="dd-wrap dd-charter-in"><blockquote class="dd-charter-q" data-reveal>Notre engagement : que chaque enfant reparte le soir avec le sourire, et chaque parent avec l'esprit tranquille.<footer>Extrait de la charte de la maison — texte de démonstration</footer></blockquote><div data-reveal><a class="dd-btn dd-btn--lg" href="/equipe">Rencontrer l'équipe</a></div></div></section>`),
  sec(footer(c)),
];

/* ---------- la journée ---------- */
const WEEK = [["Lundi", "Motricité", "Parcours en mousse et jeux de ballon", "Comptines du lundi"], ["Mardi", "Musique", "Instruments, danses et chansons", "Atelier percussions"], ["Mercredi", "Nature", "Jardinage et promenade", "Atelier cuisine"], ["Jeudi", "Langage", "Albums, marionnettes et théâtre d'ombres", "Petits groupes de conversation"], ["Vendredi", "Création", "Peinture, collage, pâte à modeler", "Exposition des œuvres"]];
const journee = (c) => [
  sec(header(c)),
  pagehead("La journée", "Une journée <span class=\"dd-hl\">type</span>", "Huit moments, un fil conducteur : de la sécurité, du plaisir et du temps pour chacun.", sun("dd-ph-sun") + balloon("#8fd3f4", "dd-ph-bl")),
  sec(dayComp("Choisissez un moment dans la frise, ou laissez-vous guider : la visite défile toute seule.")),
  sec(`<section class="dd-sec dd-s-cream dd-week pk-bleed"><div class="dd-wrap">${sechead("Une semaine type", "Chaque jour a sa couleur")}
    <table class="dd-table" data-reveal><caption class="dd-sr">Thème de chaque jour de la semaine</caption><thead><tr><th>Jour</th><th>Thème</th><th>Le matin</th><th>L'après-midi</th></tr></thead><tbody>${WEEK.map(([d, t, a, p], i) => `<tr class="dd-wk${i}"><td data-l="Jour"><b>${d}</b></td><td data-l="Thème"><span class="dd-tg">${t}</span></td><td data-l="Le matin">${a}</td><td data-l="L'après-midi">${p}</td></tr>`).join("")}</tbody></table>
    <p class="dd-note" data-reveal>Programme indicatif de démonstration : il varie selon les saisons, l'âge des enfants et leurs envies.</p></div></section>`),
  sec(`<section class="dd-sec dd-s-butter dd-rit pk-bleed"><div class="dd-wrap">${sechead("Les petits rituels", "Ce qui rythme chaque journée")}
    <div class="dd-rit-in"><article class="dd-bubble dd-r1" data-reveal><h3 class="dd-h3">La comptine du bonjour</h3><p>Chaque matin, on chante les prénoms ensemble.</p></article><article class="dd-bubble dd-r2" data-reveal><h3 class="dd-h3">Le cahier de vie</h3><p>Dessins, mots et photos de choses (jamais d'enfants) pour raconter la semaine.</p></article><article class="dd-bubble dd-r3" data-reveal><h3 class="dd-h3">La chanson du rangement</h3><p>Ranger devient un jeu quand on le fait en musique.</p></article></div>
    <div class="dd-faq" data-reveal><details><summary>Mon enfant a un doudou : peut-il l'emporter partout ?</summary><p>Oui, bien sûr. Le doudou a sa place dans le sac et son propre lit pour la sieste.</p></details><details><summary>Comment se passe l'adaptation ?</summary><p>Quelques jours de présence progressive, avec un parent d'abord, puis seul quelques heures, avant la journée complète.</p></details><details><summary>Que prévoir dans le sac ?</summary><p>Des vêtements de rechange, un chapeau, des chaussons et le doudou. Le reste est fourni.</p></details></div></div></section>`),
  sec(footer(c)),
];

/* ---------- équipe ---------- */
const TEAM = [
  ["Capucine", "Directrice", "renard", "J'aime voir un enfant réussir seul ce qu'il croyait impossible."], ["Mathilde", "Éducatrice de jeunes enfants", "lapin", "Les histoires avec des marionnettes, c'est ma spécialité."],
  ["Bastien", "Auxiliaire de puériculture", "herisson", "Je prépare les siestes : lumière douce et chanson tranquille."], ["Inès", "Enseignante de maternelle", "chouette", "Je guette le moment où une lettre prend du sens."],
  ["Noor", "Aide-éducatrice", "chat", "Je rends les coins de jeu aussi beaux que possible."], ["Zoé", "Psychomotricienne (intervenante)", "grenouille", "Sauter, ramper, rouler : le corps apprend en jouant."],
];
const equipe = (c) => [
  sec(header(c)),
  pagehead("L'équipe", "Des adultes qui <span class=\"dd-hl\">sourient</span>", "Une équipe fictive, présentée ici par de petits personnages : aucune photo, juste de la bonne humeur.", critter("renard").replace("dd-critter", "dd-critter dd-ph-cr")),
  sec(`<section class="dd-sec dd-s-cream dd-team pk-bleed"><div class="dd-wrap"><div class="dd-team-in">${TEAM.map(([n, r, k, q], i) => `<article class="dd-person dd-p${i % 3}" data-reveal>${critter(k)}<h2 class="dd-h3">${n}</h2><p class="dd-role">${r}</p><p class="dd-quote">« ${q} »</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="dd-sec dd-s-sky dd-values2 pk-bleed"><div class="dd-wrap dd-split">${`<div>${sechead("Ce qui nous réunit", "Une équipe qui apprend toujours")}<ul class="dd-checks" data-reveal><li>Des temps de réunion chaque semaine pour parler de chaque enfant</li><li>Des formations régulières : gestes de premiers secours, langage, bienveillance</li><li>Une psychologue et un médecin référent qui interviennent à la demande</li><li>Une cuisinière qui prépare les repas sur place</li></ul></div>`}
    <div class="dd-ratio" data-reveal><h3 class="dd-h3">Un adulte pour combien d'enfants ?</h3><p class="dd-ratio-n">1 pour <b>5</b> chez les bébés</p><p class="dd-ratio-n">1 pour <b>8</b> chez les marcheurs</p><p class="dd-ratio-n">1 pour <b>12</b> en maternelle</p><p class="dd-note">Valeurs de démonstration : les taux réels dépendent de la réglementation et de l'agrément.</p></div></div></section>`),
  sec(`<section class="dd-sec dd-s-pink dd-join pk-bleed"><div class="dd-wrap dd-cta-in"><div data-reveal>${critter("lapin").replace("dd-critter", "dd-critter dd-cta-cr")}</div><div data-reveal><h2 class="dd-h2">Vous aimez les petits ?</h2><p class="dd-lead">Nous cherchons régulièrement des remplaçantes et des stagiaires. Écrivez-nous quelques lignes sur votre parcours.</p><a class="dd-btn dd-btn--lg" href="/contact">Proposer sa candidature</a></div></div></section>`),
  sec(footer(c)),
];

/* ---------- tarifs & admission ---------- */
const tarifs = (c) => [
  sec(header(c)),
  pagehead("Tarifs & admission", "Comprendre <span class=\"dd-hl\">simplement</span>", "Comment on entre à la crèche, comment le tarif se calcule, et ce qu'il faut préparer. Explications générales : aucun prix n'est engagé ici.", balloon("#ffd95a", "dd-ph-bl") + blocks("dd-ph-blocks")),
  sec(`<section class="dd-sec dd-s-cream dd-path pk-bleed"><div class="dd-wrap">${sechead("L'admission en quatre étapes", "Le chemin jusqu'à la première journée")}
    <ol class="dd-path-in"><li class="dd-pt dd-pt1" data-reveal><span class="dd-pt-n">1</span><h3 class="dd-h3">Je prends contact</h3><p>Via le formulaire de contact ou la pré-inscription guidée ci-dessous.</p></li><li class="dd-pt dd-pt2" data-reveal><span class="dd-pt-n">2</span><h3 class="dd-h3">Je visite la maison</h3><p>La directrice vous reçoit, vous montre les salles, répond à vos questions.</p></li><li class="dd-pt dd-pt3" data-reveal><span class="dd-pt-n">3</span><h3 class="dd-h3">La commission décide</h3><p>Les places sont attribuées selon des critères connus des familles.</p></li><li class="dd-pt dd-pt4" data-reveal><span class="dd-pt-n">4</span><h3 class="dd-h3">Je prépare l'adaptation</h3><p>Quelques jours de présence progressive avant la journée complète.</p></li></ol></div></section>`),
  sec(`<section class="dd-sec dd-s-mint dd-bareme pk-bleed"><div class="dd-wrap dd-split"><div>${sechead("Comment le tarif se calcule", "Un tarif lié aux revenus de la famille")}
    <p class="dd-lead" data-reveal>Dans la plupart des structures d'accueil de jeunes enfants, le tarif horaire dépend des revenus du foyer et du nombre d'enfants à charge. Plus la famille est grande, plus le taux est doux.</p>
    <p class="dd-lead" data-reveal>Le tarif précis de la maison vous est donné lors de la visite, sur présentation de vos justificatifs. Le tableau ci-contre n'est qu'une illustration.</p></div>
    <table class="dd-table dd-table--s" data-reveal><caption>Exemple illustratif du « taux d'effort » (démonstration)</caption><thead><tr><th>Enfants à charge</th><th>Taux horaire (exemple)</th></tr></thead><tbody><tr><td data-l="Enfants à charge"><b>1 enfant</b></td><td data-l="Taux horaire">0,06 % des revenus mensuels</td></tr><tr><td data-l="Enfants à charge"><b>2 enfants</b></td><td data-l="Taux horaire">0,05 %</td></tr><tr><td data-l="Enfants à charge"><b>3 enfants</b></td><td data-l="Taux horaire">0,04 %</td></tr><tr><td data-l="Enfants à charge"><b>4 enfants et plus</b></td><td data-l="Taux horaire">0,03 %</td></tr></tbody></table></div></section>`),
  sec(`<section class="dd-sec dd-s-pink dd-docs pk-bleed"><div class="dd-wrap">${sechead("À préparer", "Les papiers utiles, sans stress")}
    <div class="dd-faq dd-faq--w">
    <details data-reveal><summary>Quels documents pour le dossier ?</summary><p>En général : une pièce d'identité des parents, un justificatif de domicile, l'avis d'imposition ou les ressources du foyer, le carnet de santé de l'enfant avec les vaccins à jour.</p></details>
    <details data-reveal><summary>Peut-on demander une place avant la naissance ?</summary><p>Oui : vous pouvez nous écrire pendant la grossesse, nous notons votre demande et vous recontactons.</p></details>
    <details data-reveal><summary>L'accueil est-il possible à temps partiel ?</summary><p>Oui, selon les places disponibles : quelques jours par semaine, ou seulement certaines demi-journées.</p></details>
    <details data-reveal><summary>Et pour un enfant en situation de handicap ?</summary><p>Nous accueillons chaque enfant ; parlons-en ensemble avant la visite pour préparer l'accueil.</p></details></div></div></section>`),
  sec(wizard()),
  sec(footer(c)),
];

/* ---------- menus ---------- */
const MENUS = [
  ["Lundi", "Carottes râpées à l'orange", "Blanquette de poisson blanc et riz", "Yaourt nature", "Compote de pommes", "Pain et fromage blanc", ["Poisson"]],
  ["Mardi", "Velouté de potiron", "Lentilles corail, lait de coco et carottes", "Petit-suisse", "Poire", "Biscuit à la farine complète et lait", ["Végétarien"]],
  ["Mercredi", "Bâtonnets de concombre", "Poulet rôti et semoule", "Yaourt à la vanille", "Banane", "Pain, beurre et confiture", ["Volaille"]],
  ["Jeudi", "Betteraves tièdes", "Gratin de pâtes et courgettes", "Fromage frais", "Kiwi", "Compote et petit sablé", ["Végétarien"]],
  ["Vendredi", "Salade de riz aux petits pois", "Colin et purée de patate douce", "Fromage blanc", "Salade de fruits", "Gâteau au yaourt fait maison", ["Poisson"]],
];
const COURSES = ["Entrée", "Plat", "Laitage", "Dessert"];
const menus = (c) => [
  sec(header(c)),
  pagehead("Menus de la semaine", "À <span class=\"dd-hl\">table</span> !", "Des repas préparés sur place, avec des produits de saison. Menu d'exemple de démonstration.", `<svg class="dd-plate" viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="82" r="72" fill="#fff"/><circle cx="80" cy="82" r="54" fill="none" stroke="#bdeccf" stroke-width="8"/><circle cx="62" cy="72" r="10" fill="#7fdcae"/><circle cx="86" cy="64" r="10" fill="#7fdcae"/><circle cx="76" cy="92" r="10" fill="#7fdcae"/><rect x="92" y="82" width="38" height="16" rx="8" fill="#ffab5e"/></svg>`),
  sec(`<section class="dd-sec dd-s-cream dd-menu pk-bleed" data-dd-tabs><div class="dd-wrap">
    <div class="dd-menu-tabs" role="tablist" aria-label="Jours de la semaine">${MENUS.map((m, i) => `<a href="#jour-${i + 1}" class="dd-fb dd-mt dd-t-${["butter", "sky", "pink", "mint", "orange"][i]}${i === 0 ? " is-on" : ""}" role="tab" aria-selected="${i === 0}"><b>${m[0]}</b></a>`).join("")}</div>
    ${MENUS.map((m, i) => `<article class="dd-card dd-mp dd-t-${["butter", "sky", "pink", "mint", "orange"][i]}" role="tabpanel" data-dd-panel><h2 class="dd-h3">Menu du ${m[0].toLowerCase()}</h2><ul class="dd-courses">${COURSES.map((cn, k) => `<li><small>${cn}</small><span>${esc(m[k + 1])}</span></li>`).join("")}</ul><p class="dd-gouter"><strong>Goûter</strong> ${esc(m[5])}</p><p class="dd-tags">${m[6].map((t) => `<span class="dd-tg">${t}</span>`).join("")}</p></article>`).join("")}</div></section>`),
  sec(`<section class="dd-sec dd-s-mint dd-menu-notes pk-bleed"><div class="dd-wrap">${sechead("Bon à savoir", "Dans l'assiette des petits")}
    <div class="dd-rit-in"><article class="dd-bubble dd-r1" data-reveal><h3 class="dd-h3">De saison, de près</h3><p>Fruits et légumes de saison, achetés auprès de producteurs voisins quand c'est possible.</p></article><article class="dd-bubble dd-r2" data-reveal><h3 class="dd-h3">Allergies</h3><p>Dites-nous tout avant la rentrée : un protocole précis est mis en place avec la cuisine.</p></article><article class="dd-bubble dd-r3" data-reveal><h3 class="dd-h3">Sans porc, végétarien</h3><p>Un repas de remplacement est toujours prévu, sans que l'enfant se sente différent.</p></article></div></div></section>`),
  sec(footer(c)),
];

/* ---------- actualités ---------- */
const NEWS = [
  ["La fête des couleurs arrive", "Vie de la crèche", "12 novembre 2026", "Toute la maison se prépare à peindre : tabliers, gros pinceaux et mélanges surprises.", "#ffd95a"],
  ["Promenade à la ferme", "Sorties", "5 novembre 2026", "Les grands ont rendu visite aux poules, aux lapins et au poney.", "#7fdcae"],
  ["Café des familles", "Parents", "28 octobre 2026", "Un samedi matin pour se rencontrer autour d'un thé et partager des astuces de parents.", "#ff9ebb"],
  ["Nouveaux jeux au jardin", "Vie de la crèche", "20 octobre 2026", "Un bac à sable agrandi, une cabane en osier et un coin de potager.", "#8fd3f4"],
  ["Spectacle de marionnettes", "Parents", "14 octobre 2026", "Les enfants ont joué leur histoire préférée devant les familles invitées.", "#c3a8f0"],
  ["Sortie à la bibliothèque", "Sorties", "2 octobre 2026", "Un grand tapis, des albums et une conteuse bienveillante.", "#ffab5e"],
];
const coverArt = (i, bg) => `<svg viewBox="0 0 200 110" aria-hidden="true"><rect width="200" height="110" fill="${bg}"/>${[`<circle cx="150" cy="30" r="16" fill="#fff" opacity=".8"/><path d="M20 90q40-40 80 0t80 0" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/>`, `<path d="M0 90q50-30 100-6t100-10v36H0z" fill="#fff" opacity=".6"/><circle cx="60" cy="48" r="16" fill="#fff"/><circle cx="148" cy="40" r="10" fill="#fff"/>`, `<circle cx="70" cy="55" r="30" fill="#fff" opacity=".85"/><circle cx="120" cy="55" r="30" fill="#fff" opacity=".6"/>`][i % 3]}</svg>`;
const actualites = (c) => [
  sec(header(c)),
  pagehead("Actualités", "Les <span class=\"dd-hl\">nouvelles</span> de la maison", "Sorties, fêtes et rendez-vous avec les familles. Contenu de démonstration.", cloud("dd-ph-cl") + star("dd-ph-star")),
  sec(`<section class="dd-sec dd-s-cream dd-news pk-bleed" data-dd-filter><div class="dd-wrap dd-news-layout"><div>
    <div class="dd-filters" role="group" aria-label="Filtrer les actualités">${["Tout", "Vie de la crèche", "Sorties", "Parents"].map((f, i) => `<a class="dd-chip${i === 0 ? " is-on" : ""}" href="#filtre" role="button" aria-pressed="${i === 0}" data-f="${f}">${f}</a>`).join("")}</div>
    <p class="dd-live" role="status" data-count-out></p>
    <div class="dd-news-grid">${NEWS.map(([t, cat, d, x, bg], i) => `<article class="dd-art dd-art${i % 3}" data-cat="${cat}"><div class="dd-cover">${coverArt(i, bg)}</div><div class="dd-art-b"><p class="dd-meta"><span class="dd-tag">${cat}</span> <time>${d}</time></p><h2 class="dd-h3">${t}</h2><p>${x}</p></div></article>`).join("")}</div></div>
    <aside class="dd-agenda" aria-label="Agenda"><h2 class="dd-h3">À venir</h2><ul><li><b>16 nov.</b><span>Fête des couleurs</span></li><li><b>5 déc.</b><span>Réunion des familles</span></li><li><b>19 déc.</b><span>Goûter de Noël</span></li><li><b>23 janv.</b><span>Portes ouvertes</span></li></ul><p class="dd-note">Dates fictives de démonstration.</p></aside></div></section>`),
  sec(footer(c)),
];

/* ---------- contact, recherche, 404 ---------- */
const contact = (c) => [
  sec(header(c)),
  pagehead("Contact", "Dites-nous <span class=\"dd-hl\">bonjour</span>", "Une question, une visite, une pré-inscription : écrivez-nous, nous répondons sous deux jours ouvrés.", bear("dd-ph-bear") + balloon("#ff9ebb", "dd-ph-bl")),
  sec(`<section class="dd-sec dd-s-cream dd-info pk-bleed"><ul class="dd-wrap dd-info-in"><li class="dd-bubble dd-r1" data-reveal><b>Adresse</b><span>12 rue des Coquelicots<br>00000 Ville-Exemple</span></li><li class="dd-bubble dd-r2" data-reveal><b>Horaires</b><span>Lundi – vendredi<br>7h30 – 18h30</span></li><li class="dd-bubble dd-r3" data-reveal><b>Visite</b><span>Sur rendez-vous, en dehors des temps de sieste</span></li></ul></section>`),
  { type: "form", heading: "Écrire à la maison", intro: "Dites-nous qui vous êtes et ce que vous cherchez. Vous pouvez coller ici le récapitulatif de la pré-inscription guidée." },
  sec(footer(c)),
];
const recherche = (c) => [
  sec(header(c)),
  pagehead("Rechercher", "Une <span class=\"dd-hl\">question</span> ?", "Un menu, une activité, une actualité : tapez un mot.", cloud("dd-ph-cl") + sun("dd-ph-sun")),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] },
  sec(footer(c)),
];
const introuvable = (c) => [
  sec(header(c)),
  sec(`<section class="dd-404 pk-bleed"><div class="dd-skyfx" aria-hidden="true">${cloud("dd-c1")}${cloud("dd-c2")}</div><div class="dd-wrap dd-404-in"><div class="dd-404-art" aria-hidden="true">${balloon("#e8487f", "dd-404-bl")}${bear("dd-404-bear")}</div><div><p class="dd-kicker">Oups, le ballon s'est envolé</p><div class="dd-h1" role="heading" aria-level="1">404</div><p class="dd-lead">Cette page n'existe pas ou a changé d'adresse. Retournons jouer à l'accueil !</p><a class="dd-btn dd-btn--lg" href="/">Retour à l'accueil</a></div></div></section>`),
  sec(footer(c)),
];

module.exports = {
  key: "doudou", name: "Doudou", version: "2.0.0", category: "education", tags: ["ludique", "chaleureux", "moderne"], siteType: "Crèche et école maternelle", featured: true,
  concept: "Un livre d'images animé : paysage enfantin avec soleil, nuages et ballons, navigation en bulles, journée type cliquable et pré-inscription guidée.",
  description: "Crèche et école maternelle : jaune beurre, bleu ciel, rose et menthe, nuages, nounours et blocs dessinés, frise de la journée cliquable, menus à onglets, équipe en petits personnages, pré-inscription guidée sans enregistrement.",
  brand: "Les Petits Doudous", modules: ["formulaires", "recherche"],
  dna: { header: "barre-de-bulles-pastel-rebondissantes", hero: "paysage-enfantin-anime-soleil-nuages-et-ballons", grid: "frise-horaire-en-bulles-et-maisons-arrondies", motion: "nuages-qui-derivent-et-rebonds-doux", shapes: "nuages-nounours-blocs-et-coins-tres-arrondis", rhythm: "vagues-pastel-alternees-et-respirations-courtes", signature: "journee-type-cliquable-et-pre-inscription-guidee" },
  tokens: {
    colors: { primary: "#cf3068", secondary: "#1f6fae", accent: "#ffd95a", background: "#fff6cf", surface: "#ffffff", text: "#3a2b55", muted: "#6a5a85", success: "#237a54", warning: "#8a5a00", error: "#c0243c" },
    fonts: { heading: "font.baloo-2", body: "font.quicksand", button: "font.baloo-2", link: "font.quicksand" },
    radius: { sm: 14, md: 22, lg: 36, button: 999, field: 20, card: 32 }, shadow: { card: "0 10px 0 rgba(58,43,85,.08)", button: "0 5px 0 rgba(58,43,85,.18)" }, border: { width: 0, color: "#ffffff" },
    type: { h1: { size: 64, weight: 800, lineHeight: 1.02 }, h2: { size: 42, weight: 700, lineHeight: 1.1 } },
  },
  options: [
    { key: "rose", label: "Couleur des boutons", type: "color", default: "#cf3068" },
    { key: "beurre", label: "Fond jaune beurre", type: "color", default: "#fff6cf" },
    { key: "ciel", label: "Bleu ciel des bandeaux", type: "color", default: "#d6f0fd" },
    { key: "nuages", label: "Nuages animés", type: "choice", default: "on", choices: [["on", "Oui"], ["off", "Non"]] },
    { key: "bulles", label: "Forme des bulles du menu", type: "choice", default: "round", choices: [["round", "Rondes"], ["soft", "Un peu moins rondes"]] },
  ],
  menu: [["Accueil", "/"], ["Notre projet", "/projet"], ["La journée", "/journee"], ["L'équipe", "/equipe"], ["Tarifs", "/tarifs"], ["Menus", "/menus"], ["Actualités", "/actualites"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "projet", name: "Notre projet", render: projet }, { key: "journee", name: "La journée", render: journee },
    { key: "equipe", name: "L'équipe", render: equipe }, { key: "tarifs", name: "Tarifs & admission", render: tarifs }, { key: "menus", name: "Menus de la semaine", render: menus },
    { key: "actualites", name: "Actualités", render: actualites }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
