// Moustache — clinique vétérinaire (démonstration). Direction artistique : carnet de santé illustré. Animaux dessinés au trait et en aplats (chien, chat, lapin, oiseau),
// vert sauge, orange abricot, crème et brun doux ; barre en pastille avec bouton urgence ; prise de rendez-vous guidée en cinq étapes et fiches conseils filtrables.
const { sec, form, esc, nav } = require("../kit");

const INK = "#4a3426", SAGE = "#4f6f4c", SAGE_D = "#35503a", SAGE_L = "#e1ead8", SAGE_M = "#b7cbaa", APR = "#f29a4a", APR_L = "#fde3c6", CREAM = "#fbf4e6", PINK = "#f4a9a0";
const S = `stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;

// ---------- Animaux dessinés (boîte 200 × 210, aplats + trait brun) ----------
const AN = {
  chien: (fur = "#e0a766", ear = "#9a6035") => `<path d="M44 210c0-46 25-64 56-64s56 18 56 64z" fill="${SAGE_M}" ${S}/><path d="M66 150q34 14 68 0l-34 40z" fill="${APR}" ${S}/>
    <path d="M52 60C26 64 18 120 42 140c15-6 23-36 21-76z" fill="${ear}" ${S}/><path d="M148 60c26 4 34 60 10 80-15-6-23-36-21-76z" fill="${ear}" ${S}/>
    <ellipse cx="100" cy="98" rx="50" ry="48" fill="${fur}" ${S}/><path d="M122 52c20 6 32 24 28 46-14-4-27-18-28-46z" fill="${ear}" opacity=".55"/>
    <ellipse cx="100" cy="119" rx="27" ry="21" fill="#fbeed6" ${S}/><ellipse cx="100" cy="107" rx="10" ry="7" fill="${INK}"/>
    <path d="M100 114v9M100 123q-9 9-18 2M100 123q9 9 18 2" fill="none" ${S}/><path d="M91 130q9 18 18 0z" fill="${PINK}" ${S}/>
    <g class="mo-eyes"><circle cx="78" cy="88" r="6" fill="${INK}"/><circle cx="122" cy="88" r="6" fill="${INK}"/><circle cx="80" cy="86" r="2" fill="#fff"/><circle cx="124" cy="86" r="2" fill="#fff"/></g>
    <path d="M68 74q9-6 18-1M114 73q9-5 18 1" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  chat: (fur = "#f0a35e", dark = "#c9763a") => `<path d="M48 210c0-44 24-60 52-60s52 16 52 60z" fill="${fur}" ${S}/><path d="M72 152q28 14 56 0" fill="none" stroke="${SAGE}" stroke-width="9" stroke-linecap="round"/><circle cx="100" cy="168" r="7" fill="${APR_L}" ${S}/>
    <path d="M50 82 44 24l46 28z" fill="${fur}" ${S}/><path d="M150 82l6-58-46 28z" fill="${fur}" ${S}/><path d="M56 70 54 42l22 14z" fill="${PINK}"/><path d="M144 70l2-28-22 14z" fill="${PINK}"/>
    <ellipse cx="100" cy="102" rx="55" ry="46" fill="${fur}" ${S}/><path d="M100 58v15M85 60l3 13M115 60l-3 13M48 100h12M52 114h10M152 100h-12M148 114h-10" fill="none" stroke="${dark}" stroke-width="3.4" stroke-linecap="round"/>
    <ellipse cx="78" cy="124" rx="19" ry="13" fill="#fff" opacity=".55"/><ellipse cx="122" cy="124" rx="19" ry="13" fill="#fff" opacity=".55"/>
    <g class="mo-eyes"><ellipse cx="78" cy="98" rx="9" ry="10" fill="#e9d36a" ${S}/><ellipse cx="122" cy="98" rx="9" ry="10" fill="#e9d36a" ${S}/><ellipse cx="78" cy="98" rx="2.6" ry="7" fill="${INK}"/><ellipse cx="122" cy="98" rx="2.6" ry="7" fill="${INK}"/></g>
    <path d="M93 111h14l-7 8z" fill="${PINK}" ${S}/><path d="M100 119v5M100 124q-7 7-14 2M100 124q7 7 14 2" fill="none" ${S}/><path d="M60 118 28 112M60 124 30 130M140 118l32-6M140 124l30 6" fill="none" stroke="${INK}" stroke-width="2"/>`,
  lapin: (fur = "#f6efe2") => `<path d="M46 210c0-44 24-62 54-62s54 18 54 62z" fill="${APR_L}" ${S}/><path d="M72 152q28 14 56 0" fill="none" stroke="${APR}" stroke-width="9" stroke-linecap="round"/>
    <ellipse cx="74" cy="50" rx="17" ry="46" transform="rotate(-8 74 50)" fill="${fur}" ${S}/><ellipse cx="74" cy="54" rx="8" ry="32" transform="rotate(-8 74 54)" fill="${PINK}"/>
    <path d="M118 80c-6-30-2-62 14-76 14 6 24 40 14 78z" fill="${fur}" ${S}/><path d="M128 70c-3-24 0-44 6-54 6 8 10 30 6 56z" fill="${PINK}"/>
    <ellipse cx="100" cy="112" rx="47" ry="40" fill="${fur}" ${S}/><ellipse cx="78" cy="128" rx="14" ry="10" fill="#fff" opacity=".7"/><ellipse cx="122" cy="128" rx="14" ry="10" fill="#fff" opacity=".7"/>
    <g class="mo-eyes"><circle cx="78" cy="104" r="6" fill="${INK}"/><circle cx="122" cy="104" r="6" fill="${INK}"/><circle cx="80" cy="102" r="2" fill="#fff"/><circle cx="124" cy="102" r="2" fill="#fff"/></g>
    <path d="M94 118h12l-6 7z" fill="${PINK}" ${S}/><path d="M100 125v5M100 130q-7 6-14 1M100 130q7 6 14 1" fill="none" ${S}/><rect x="95" y="131" width="10" height="9" rx="2" fill="#fff" ${S}/>`,
  oiseau: (fur = "#f6c453") => `<path d="M6 178C58 166 142 188 194 172" fill="none" stroke="#8a5a36" stroke-width="9" stroke-linecap="round"/><path d="M150 176l22-18M70 172 52 158" fill="none" stroke="${SAGE}" stroke-width="5" stroke-linecap="round"/><ellipse cx="164" cy="156" rx="12" ry="6" transform="rotate(-30 164 156)" fill="${SAGE_M}" ${S}/>
    <path d="M136 140 190 156l-54 8z" fill="${SAGE}" ${S}/><ellipse cx="100" cy="124" rx="46" ry="42" fill="${fur}" ${S}/><circle cx="104" cy="84" r="32" fill="${fur}" ${S}/>
    <path d="M96 54q-2-14 10-18-2 10 4 16z" fill="${APR}" ${S}/><ellipse cx="102" cy="132" rx="26" ry="26" fill="#fff6d2" opacity=".9"/>
    <path d="M70 114c26-8 46 6 42 30-22 8-46-6-42-30z" fill="${SAGE_M}" ${S}/><path d="M80 124q14-4 24 4" fill="none" stroke="${INK}" stroke-width="2"/>
    <path d="M132 86l24 8-24 10z" fill="${APR}" ${S}/><g class="mo-eyes"><circle cx="118" cy="80" r="5.5" fill="${INK}"/><circle cx="120" cy="78" r="1.8" fill="#fff"/></g>
    <path d="M92 164v12M112 164v12" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`,
};
const animal = (k, cls = "", box = "0 0 200 210", fur, ear) => `<svg class="mo-an ${cls}" viewBox="${box}" aria-hidden="true">${AN[k](fur, ear)}</svg>`;
const head = (k) => animal(k, "mo-hd", k === "oiseau" ? "10 30 180 160" : "20 20 160 150");

const scallop = (cx, cy, R, r, n, fill) => { let o = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${fill}"/>`; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; o += `<circle cx="${(cx + Math.cos(a) * R).toFixed(1)}" cy="${(cy + Math.sin(a) * R).toFixed(1)}" r="${r}" fill="${fill}"/>`; } return o; };
const badge = (k, bg = SAGE_L) => `<svg class="mo-badge" viewBox="0 0 260 260" aria-hidden="true">${scallop(130, 130, 92, 28, 12, bg)}<g transform="translate(40,34) scale(.9)">${AN[k]()}</g></svg>`;
const paw = `<svg class="mo-pawi" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="16.5" rx="5.5" ry="4.6" fill="currentColor"/><circle cx="5.2" cy="11" r="2.3" fill="currentColor"/><circle cx="9.4" cy="6.6" r="2.4" fill="currentColor"/><circle cx="14.6" cy="6.6" r="2.4" fill="currentColor"/><circle cx="18.8" cy="11" r="2.3" fill="currentColor"/></svg>`;
const mustache = `<svg class="mo-must" viewBox="0 0 40 20" aria-hidden="true"><path d="M20 8C16 3 9 1 3 8c1 5 6 8 11 6 3-1 4-3 6-3s3 2 6 3c5 2 10-1 11-6C31 1 24 3 20 8z" fill="currentColor"/></svg>`;
const arrow = `<svg class="mo-arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const phone = `<svg class="mo-arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;

const person = (skin, hair, coat, style = 0) => `<svg class="mo-avatar" viewBox="0 0 120 120" aria-hidden="true"><path d="M14 120c0-26 20-40 46-40s46 14 46 40z" fill="${coat}" ${S}/><path d="M48 82l12 16 12-16" fill="#fff" ${S}/><rect x="52" y="66" width="16" height="18" rx="6" fill="${skin}" ${S}/>
  ${style === 1 ? `<path d="M30 56c-2-30 16-42 30-42s32 12 30 42c0 14-6 26-8 30-3-18-8-30-22-30S41 68 38 86c-4-8-8-18-8-30z" fill="${hair}" ${S}/>` : ""}<ellipse cx="60" cy="52" rx="23" ry="26" fill="${skin}" ${S}/>
  ${style === 0 ? `<path d="M36 50c-2-22 12-32 24-32s28 8 24 32c-6-10-14-14-24-14S42 40 36 50z" fill="${hair}" ${S}/>` : style === 1 ? `<path d="M38 46c8-2 18-10 22-16 6 8 14 14 22 16-2-18-12-28-22-28S40 28 38 46z" fill="${hair}" ${S}/>` : `<path d="M37 48c-3-20 10-32 23-32s26 12 23 32c-4-8-10-12-23-12S41 40 37 48z" fill="${hair}" ${S}/><circle cx="60" cy="14" r="9" fill="${hair}" ${S}/>`}
  <circle cx="51" cy="54" r="2.8" fill="${INK}"/><circle cx="69" cy="54" r="2.8" fill="${INK}"/><path d="M52 66q8 7 16 0" fill="none" ${S}/><circle cx="44" cy="62" r="4" fill="${PINK}" opacity=".6"/><circle cx="76" cy="62" r="4" fill="${PINK}" opacity=".6"/></svg>`;

// Pictogrammes de services (24 × 24, trait)
const IC = {
  consult: `<path d="M6 3v6a4 4 0 0 0 8 0V3M10 13v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>`,
  vacc: `<path d="m18 3 3 3M16 5l3 3M14 7l3 3L8 19l-4 1 1-4zM11 10l3 3"/>`,
  puce: `<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>`,
  dent: `<path d="M7 4c-3 0-4 3-3 6s1 10 3 10 1-5 5-5 3 5 5 5 2-7 3-10-1-6-4-6c-2 0-3 1-4 1S9 4 7 4z"/>`,
  chir: `<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"/>`,
  imag: `<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M6 11h3l2-4 2 8 2-4h3M9 21h6"/>`,
  nac: `<path d="M8 12c-3-1-3-8-1-9 2 1 3 4 3 7M16 12c3-1 3-8 1-9-2 1-3 4-3 7"/><ellipse cx="12" cy="16" rx="6" ry="5"/>`,
  nutri: `<path d="M3 12h18a9 9 0 0 1-18 0zM8 8c0-2 2-2 2-4M13 8c0-2 2-2 2-4"/>`,
};
const icon = (k) => `<svg class="mo-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;

// ---------- Contenus de démonstration ----------
const TEL = "09 00 00 00 00";
const SERVICES = [
  ["consult", "Consultations", "Examen complet, bilan annuel, suivi de croissance : le temps d'écouter et d'expliquer.", "Chiens, chats, lapins, oiseaux"],
  ["vacc", "Vaccination et prévention", "Un calendrier clair pour les vaccins, vermifuges et antiparasitaires.", "Chiens, chats, lapins"],
  ["puce", "Identification", "Pose de puce électronique et mise à jour des fichiers pour retrouver plus vite votre compagnon.", "Chiens, chats"],
  ["dent", "Dentisterie", "Contrôle des dents, détartrage et conseils de brossage adaptés à chaque animal.", "Chiens, chats, lapins"],
  ["chir", "Chirurgie", "Stérilisations et chirurgie de convenance dans un bloc calme, avec un suivi après l'opération.", "Chiens, chats, lapins"],
  ["imag", "Analyses et imagerie", "Radiographie, échographie et analyses sur place pour des réponses plus rapides.", "Tous nos patients"],
  ["nac", "Lapins et oiseaux", "Consultations dédiées aux nouveaux animaux de compagnie, avec une vétérinaire formée.", "Lapins, oiseaux"],
  ["nutri", "Nutrition et seniors", "Bilans nutritionnels, suivi du poids et accompagnement des animaux plus âgés.", "Chiens, chats, lapins"],
];
const CONSEILS = [
  ["Préparer la première visite d'un chiot", "chien", "prevention", "Prévention", "Carnet, questions, friandises : une première visite sereine, pour lui comme pour vous.", "4 min"],
  ["Un chaton arrive à la maison : l'essentiel", "chat", "prevention", "Prévention", "Coin repos, litière, jeux : les bases à installer avant le grand jour.", "5 min"],
  ["Gamelle et rythme des repas : ce qui compte", "chien chat", "alimentation", "Alimentation", "Quantités, horaires, changement de croquettes : avancer en douceur.", "4 min"],
  ["Le foin, base du quotidien d'un lapin", "lapin", "alimentation", "Alimentation", "Pourquoi le foin est au cœur de la journée d'un lapin, et comment bien le proposer.", "3 min"],
  ["Brosser les dents de son chien, pas à pas", "chien", "dents", "Dents", "Une routine courte, des récompenses et un peu de patience.", "5 min"],
  ["Ronrons, oreilles, queue : lire son chat", "chat", "comportement", "Comportement", "Quelques signaux simples pour mieux comprendre ce que votre chat exprime.", "4 min"],
  ["Un coin sûr pour votre oiseau", "oiseau", "comportement", "Comportement", "Emplacement de la cage, perchoirs et moments hors cage : un décor apaisant.", "4 min"],
  ["Voyager avec son animal : préparer les papiers", "chien chat", "voyages", "Voyages", "Documents, trajet, pauses : une liste pour partir l'esprit tranquille.", "6 min"],
  ["Chaleur d'été : garder son compagnon au frais", "chien chat lapin", "voyages", "Voyages", "Ombre, eau fraîche, horaires de sortie : des gestes simples pour les jours chauds.", "3 min"],
  ["Les premiers jours d'un lapin à la maison", "lapin", "comportement", "Comportement", "Lui laisser du temps, un abri et un espace calme pour prendre ses repères.", "5 min"],
  ["Accompagner un animal âgé au quotidien", "chien chat", "prevention", "Prévention", "Confort, régularité et visites de suivi : l'âge se vit mieux entouré.", "5 min"],
  ["Choisir les jouets : sécurité et plaisir", "chien chat oiseau", "comportement", "Comportement", "Matières, tailles, usure : ce qu'on regarde avant d'offrir un nouveau jouet.", "3 min"],
];
const SPECIES = [["chien", "Chiens"], ["chat", "Chats"], ["lapin", "Lapins"], ["oiseau", "Oiseaux"]];
const TOPICS = [["alimentation", "Alimentation"], ["prevention", "Prévention"], ["comportement", "Comportement"], ["dents", "Dents"], ["voyages", "Voyages"]];
const firstSp = (s) => s.split(" ")[0];
const conseilCard = ([t, sp, tp, tpl, x, min]) => `<article class="mo-tip" data-sp="${sp}" data-tp="${tp}"><span class="mo-tip-pic">${head(firstSp(sp))}</span><div><p class="mo-tag">${tpl} · ${min}</p><h3 class="mo-h3"><a href="/conseil">${esc(t)}</a></h3><p>${esc(x)}</p></div></article>`;

const HOURS = [["Lundi", "8 h 30 – 12 h · 14 h – 19 h"], ["Mardi", "8 h 30 – 12 h · 14 h – 19 h"], ["Mercredi", "8 h 30 – 12 h · 14 h – 19 h"], ["Jeudi", "8 h 30 – 12 h · 14 h – 19 h"], ["Vendredi", "8 h 30 – 12 h · 14 h – 19 h"], ["Samedi", "9 h – 13 h"], ["Dimanche", "Fermé · urgences au " + TEL]];

// ---------- Structure commune ----------
const header = (c) => `<header class="mo-head pk-bleed"><div class="mo-pill">
  <a class="mo-logo" href="/" aria-label="${esc(c.brand)} — accueil">${mustache}<span><b>Moustache</b><small>Clinique vétérinaire</small></span></a>
  <div class="mo-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div>
  <a class="mo-urg" href="/urgences">${phone}<span>Urgence</span></a>
  <details class="mo-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="mo-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="mo-urg mo-urg--block" href="/urgences">${phone}<span>Urgence : que faire ?</span></a></div></details>
</div></header>`;

const footer = (c) => `<footer class="mo-foot pk-bleed"><div class="mo-wrap mo-foot-in">
  <div class="mo-foot-brand"><a class="mo-logo mo-logo--l" href="/">${mustache}<span><b>Moustache</b><small>Clinique vétérinaire</small></span></a><p>Soins attentifs pour chiens, chats, lapins et oiseaux, dans une clinique calme et chaleureuse.</p><p class="mo-foot-urg">Urgence, 24 h / 24 : <b>${TEL}</b> <small>(numéro fictif)</small></p></div>
  <div><p class="mo-fh">La clinique</p>${nav(c.menu.slice(0, 5), "mo-fl")}</div>
  <div><p class="mo-fh">Pratique</p><a class="mo-fl" href="/rendez-vous">Prendre rendez-vous</a><a class="mo-fl" href="/urgences">Urgences</a><a class="mo-fl" href="/acces">Accès et horaires</a><a class="mo-fl" href="/contact">Contact</a><a class="mo-fl" href="/recherche">Recherche</a></div>
  <div><p class="mo-fh">Adresse</p><address>12 rue du Verger<br>44000 Nantes<br><small>Adresse fictive</small></address></div></div>
  <p class="mo-legal">Clinique Moustache — site de démonstration. Établissement, équipe, tarifs et numéros fictifs. Les fiches conseils sont des exemples de contenu et ne remplacent pas l'avis d'un vétérinaire.</p></footer>`;

const wrapH = (inner) => sec(inner);
const pagehead = (kicker, title, sub, kind, bg) => sec(`<section class="mo-ph pk-bleed"><div class="mo-wrap mo-ph-in"><div><p class="mo-kicker" data-reveal>${esc(kicker)}</p><div class="mo-h1" role="heading" aria-level="1" data-reveal>${title}</div><p class="mo-lead" data-reveal>${esc(sub)}</p></div><div class="mo-ph-art" data-reveal aria-hidden="true">${badge(kind, bg)}</div></div></section>`);

const serviceCards = () => SERVICES.map(([k, t, x, who], i) => `<article class="mo-svc mo-svc--${i % 4}" data-reveal><span class="mo-svc-ic">${icon(k)}</span><h3 class="mo-h3">${esc(t)}</h3><p>${esc(x)}</p><p class="mo-who">${esc(who)}</p></article>`).join("");

// ---------- Composant signature : prise de rendez-vous guidée ----------
const MOTIFS = [
  ["Visite de contrôle", "chien chat lapin oiseau", 30, "Bilan général de santé"],
  ["Vaccination", "chien chat lapin", 20, "Rappel ou première injection"],
  ["Première visite (jeune animal)", "chien chat lapin oiseau", 40, "Faire connaissance, poser vos questions"],
  ["Identification par puce", "chien chat", 15, "Pose et enregistrement"],
  ["Contrôle des dents", "chien chat lapin", 30, "Examen et conseils de brossage"],
  ["Bilan senior", "chien chat lapin", 45, "Suivi des animaux plus âgés"],
  ["Conseil alimentation", "chien chat lapin oiseau", 20, "Choisir ou ajuster ses repas"],
  ["Soins des griffes et du bec", "lapin oiseau", 20, "Entretien en douceur"],
];
const booking = () => `<section class="mo-book pk-bleed mo-scal" data-book><div class="mo-wrap mo-book-in">
  <div class="mo-book-intro"><p class="mo-kicker" data-reveal>Rendez-vous guidé · démonstration</p><h2 class="mo-h2" data-reveal>Préparez votre visite en cinq étapes.</h2>
    <p class="mo-lead" data-reveal>Choisissez l'animal, le motif et un créneau. Vous obtenez un récapitulatif à envoyer par le formulaire de contact : <strong>aucune réservation n'est enregistrée ici</strong>, l'équipe vous confirme ensuite.</p>
    <p class="mo-note" data-reveal>${paw} <span>Votre animal va mal ? Ne passez pas par ce guide : <a href="/urgences">consultez la page urgences</a>.</span></p>
    <div class="mo-book-art" aria-hidden="true">${animal("chien", "", "0 0 200 210")}${animal("chat", "", "0 0 200 210", "#b9b3a6", "#8c8576")}</div></div>
  <div class="mo-card mo-flow" data-reveal>
    <ol class="mo-steps" aria-label="Étapes du rendez-vous">${["Animal", "Motif", "Créneau", "Contact", "Récapitulatif"].map((s, i) => `<li data-s="${i + 1}"><span>${i + 1}</span><em>${s}</em></li>`).join("")}</ol>
    <p class="mo-sr" aria-live="polite" data-live></p>
    <div class="mo-panel" data-panel="1"><p class="mo-q">Qui accompagnez-vous ?</p><div class="mo-opts mo-opts--4" role="radiogroup" aria-label="Espèce">${[["chien", "Chien"], ["chat", "Chat"], ["lapin", "Lapin"], ["oiseau", "Oiseau"]].map(([k, l]) => `<a class="mo-opt" href="#espece-${k}" role="radio" aria-checked="false" data-pick="espece" data-v="${l}" data-k="${k}">${head(k)}<b>${l}</b></a>`).join("")}</div></div>
    <div class="mo-panel" data-panel="2" hidden><p class="mo-q">Quel est le motif de la visite ?</p><div class="mo-opts mo-opts--list" role="radiogroup" aria-label="Motif">${MOTIFS.map(([l, sp, d, x]) => `<a class="mo-opt mo-opt--row" href="#motif" role="radio" aria-checked="false" data-pick="motif" data-v="${l}" data-sp="${sp}" data-d="${d}"><b>${l}</b><span>${x}</span><i>${d} min</i></a>`).join("")}</div></div>
    <div class="mo-panel" data-panel="3" hidden><p class="mo-q">Quel jour vous convient ?</p><p class="mo-hint" data-hint></p><div class="mo-days" role="radiogroup" aria-label="Jour" data-days></div><div class="mo-slots" data-slots aria-live="polite"></div></div>
    <div class="mo-panel" data-panel="4" hidden><p class="mo-q">Deux précisions pour l'équipe</p>
      <p class="mo-sub">Première visite chez nous ?</p><div class="mo-opts mo-opts--2" role="radiogroup" aria-label="Première visite">${["Oui", "Non"].map((l) => `<a class="mo-opt mo-opt--chip" href="#premiere" role="radio" aria-checked="false" data-pick="premiere" data-v="${l}">${l}</a>`).join("")}</div>
      <p class="mo-sub">Comment souhaitez-vous être recontacté ?</p><div class="mo-opts mo-opts--3" role="radiogroup" aria-label="Contact">${["Par téléphone", "Par e-mail", "Peu importe"].map((l) => `<a class="mo-opt mo-opt--chip" href="#recontact" role="radio" aria-checked="false" data-pick="contact" data-v="${l}">${l}</a>`).join("")}</div>
      <p class="mo-hint">Votre nom et vos coordonnées seront saisis dans le formulaire de contact, à l'étape suivante.</p><a class="mo-btn" href="#suite" data-next aria-disabled="true">Voir le récapitulatif ${arrow}</a></div>
    <div class="mo-panel" data-panel="5" hidden><p class="mo-q">Votre demande est prête.</p><dl class="mo-recap" data-recap></dl>
      <p class="mo-hint">Démonstration : rien n'a été envoyé. Copiez ce résumé, puis collez-le dans le message du formulaire de contact.</p>
      <div class="mo-actions"><a class="mo-btn" href="/contact">Envoyer via le formulaire ${arrow}</a><a class="mo-btn mo-btn--line" href="#copier" data-copy>Copier le résumé</a><a class="mo-link" href="#recommencer" data-restart>Recommencer</a></div></div>
    <div class="mo-flow-nav"><a class="mo-link" href="#retour" data-back hidden>← Étape précédente</a></div>
  </div></div></section>`;

// ---------- Pages ----------
const hero = () => `<section class="mo-hero pk-bleed"><div class="mo-wrap mo-hero-in">
  <div class="mo-hero-copy"><p class="mo-kicker" data-reveal>${paw} Clinique vétérinaire de quartier · démonstration</p>
    <div class="mo-h1 mo-h1--xl" role="heading" aria-level="1" data-reveal>Des soins attentifs pour ceux qui vous <em>font sourire.</em></div>
    <p class="mo-lead" data-reveal>Chiens, chats, lapins et oiseaux : une équipe qui prend le temps d'expliquer, de rassurer et de soigner, dans une clinique pensée pour les petits stressés comme pour leurs humains.</p>
    <div class="mo-cta" data-reveal><a class="mo-btn mo-btn--lg" href="/rendez-vous">Prendre rendez-vous ${arrow}</a><a class="mo-btn mo-btn--line mo-btn--lg" href="/services">Nos services</a></div>
    <ul class="mo-facts" data-reveal><li>${icon("consult")}<span>Salle d'attente <b>chats</b> et <b>chiens</b> séparées</span></li><li>${icon("imag")}<span>Imagerie et analyses <b>sur place</b></span></li></ul></div>
  <div class="mo-portrait" data-reveal><svg viewBox="0 0 520 520" aria-hidden="true" class="mo-port-svg">${scallop(260, 258, 205, 52, 14, SAGE_L)}<circle cx="260" cy="258" r="196" fill="#f1f4e6"/><path d="M92 120q40-40 80-20M380 90q30-20 60 6" fill="none" stroke="${SAGE_M}" stroke-width="6" stroke-linecap="round"/>
    <g transform="translate(24,226)">${AN.lapin()}</g><g transform="translate(298,226)">${AN.chat()}</g><g transform="translate(112,134) scale(1.45)">${AN.chien()}</g><g transform="translate(212,118) scale(.5)">${AN.oiseau().replace(/<path d="M6 178[^>]*\/>|<path d="M150 176[^>]*\/>|<ellipse cx="164"[^>]*\/>/g, "")}</g>
    <ellipse cx="260" cy="468" rx="236" ry="52" fill="${SAGE}"/><path d="M110 436q8-18 16 0M410 440q8-18 16 0M300 424q6-14 12 0" fill="none" stroke="${SAGE_D}" stroke-width="5" stroke-linecap="round"/></svg>
    <p class="mo-bubble mo-bubble--h" data-open><span class="mo-dot"></span><span data-open-t><b>Ouvert du lundi au samedi</b><br>8 h 30 – 19 h en semaine</span></p>
    <a class="mo-bubble mo-bubble--u" href="/urgences"><span><b>Urgence ?</b><br>Appelez le ${TEL}<small>numéro fictif</small></span></a></div></div></section>`;

const home = (c) => [
  wrapH(header(c)),
  sec(hero()),
  sec(`<section class="mo-strip pk-bleed"><div class="mo-wrap"><ul class="mo-strip-in">
    <li data-reveal><b>Sans stress</b><span>Créneaux plus longs pour les premières visites</span></li><li data-reveal><b>Clair</b><span>Chaque soin expliqué avant d'être réalisé</span></li><li data-reveal><b>Proche</b><span>Un rappel personnalisé pour les vaccins</span></li><li data-reveal><b>Disponible</b><span>Orientation vers l'urgence 24 h / 24</span></li></ul></div></section>`),
  sec(`<section class="mo-sec pk-bleed"><div class="mo-wrap"><div class="mo-sechead"><div><p class="mo-kicker" data-reveal>Nos services</p><h2 class="mo-h2" data-reveal>De la première visite aux années de sagesse.</h2></div><a class="mo-more" href="/services" data-reveal>Tous les services ${arrow}</a></div><div class="mo-svcgrid">${serviceCards()}</div></div></section>`),
  sec(booking()),
  sec(`<section class="mo-sec pk-bleed"><div class="mo-wrap"><div class="mo-sechead"><div><p class="mo-kicker" data-reveal>Fiches conseils</p><h2 class="mo-h2" data-reveal>Des réponses simples, pour chaque compagnon.</h2></div><a class="mo-more" href="/conseils" data-reveal>Filtrer par espèce ${arrow}</a></div><div class="mo-tips mo-tips--3" data-reveal>${[0, 3, 5].map((i) => conseilCard(CONSEILS[i])).join("")}</div></div></section>`),
  sec(`<section class="mo-team-t pk-bleed mo-scal"><div class="mo-wrap mo-team-in"><div><p class="mo-kicker" data-reveal>L'équipe</p><h2 class="mo-h2" data-reveal>Six personnes, un même souci du détail.</h2><p class="mo-lead" data-reveal>Vétérinaires, auxiliaires et accueil travaillent ensemble pour que chaque visite se passe en douceur.</p><a class="mo-btn mo-btn--line" href="/equipe" data-reveal>Rencontrer l'équipe</a></div>
    <div class="mo-faces" data-reveal aria-hidden="true">${person("#f2c9a6", "#5a3a28", "#fff")}${person("#d79b72", "#2c1d16", "#fff", 1)}${person("#f6d3b4", "#b5732f", "#fff", 2)}${person("#a8714f", "#1f1612", "#fff")}</div></div></section>`),
  sec(`<section class="mo-final pk-bleed"><div class="mo-wrap mo-final-in"><div><h2 class="mo-h2" data-reveal>Un doute, une urgence ?</h2><p class="mo-lead" data-reveal>Pas d'attente inutile : la page urgences vous dit quoi faire et qui appeler.</p></div><a class="mo-btn mo-btn--dark mo-btn--lg" href="/urgences" data-reveal>${phone} Voir les urgences</a></div></section>`),
  sec(footer(c)),
];

const services = (c) => [wrapH(header(c)), pagehead("Nos services", "Tout ce qu'il faut,<br>au même endroit.", "Huit grands domaines de soins, pour chaque espèce et chaque âge.", "chat"),
  sec(`<section class="mo-sec pk-bleed"><div class="mo-wrap"><div class="mo-svcgrid mo-svcgrid--2">${SERVICES.map(([k, t, x, who], i) => `<article class="mo-svc mo-svc--${i % 4} mo-svc--wide" data-reveal><span class="mo-svc-ic">${icon(k)}</span><div><h3 class="mo-h3">${esc(t)}</h3><p>${esc(x)}</p><p class="mo-who">${esc(who)}</p></div></article>`).join("")}</div></div></section>`),
  sec(`<section class="mo-sec mo-sec--sage pk-bleed mo-scal"><div class="mo-wrap"><div class="mo-sechead"><div><p class="mo-kicker">Qui vient pour quoi ?</p><h2 class="mo-h2">Les soins selon l'espèce.</h2></div></div>
    <table class="mo-table" data-reveal><caption class="mo-sr">Soins proposés selon l'espèce</caption><thead><tr><th scope="col">Soin</th><th scope="col">Chien</th><th scope="col">Chat</th><th scope="col">Lapin</th><th scope="col">Oiseau</th></tr></thead><tbody>
    ${[["Consultation", 1, 1, 1, 1], ["Vaccination", 1, 1, 1, 0], ["Identification par puce", 1, 1, 0, 0], ["Dentisterie", 1, 1, 1, 0], ["Chirurgie", 1, 1, 1, 0], ["Radiographie et échographie", 1, 1, 1, 1], ["Soins du bec et des griffes", 0, 0, 1, 1]].map(([n, ...v]) => `<tr><th scope="row">${n}</th>${["Chien", "Chat", "Lapin", "Oiseau"].map((s, i) => `<td data-l="${s}">${v[i] ? `<span class="mo-yes" aria-label="Oui">●</span>` : `<span class="mo-no" aria-label="Non">–</span>`}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`),
  sec(`<section class="mo-sec pk-bleed"><div class="mo-wrap mo-faq"><div><p class="mo-kicker">Bon à savoir</p><h2 class="mo-h2">Questions fréquentes</h2></div><div>
    <details data-reveal><summary>Faut-il un rendez-vous pour chaque visite ?</summary><p>Oui, pour réserver un temps suffisant à votre animal. Seules les urgences passent avant. Démonstration : modalités fictives.</p></details>
    <details data-reveal><summary>Mon animal est stressé, que prévoir ?</summary><p>Prévenez-nous : nous proposons un créneau plus calme, une salle d'attente séparée et le temps de s'habituer.</p></details>
    <details data-reveal><summary>Peut-on venir avec plusieurs animaux ?</summary><p>Bien sûr. Indiquez-le au moment de la demande pour que nous prévoyions la durée adaptée.</p></details></div></div></section>`),
  sec(footer(c))];

const TEAM = [
  ["Dr Camille Aubertin", "Vétérinaire, directrice", "Médecine générale, chiens et chats", ["#f2c9a6", "#5a3a28", "#fff", 0]],
  ["Dr Malik Ferrand", "Vétérinaire", "Chirurgie et imagerie", ["#a8714f", "#1f1612", "#fff", 0]],
  ["Dr Inès Rocher", "Vétérinaire NAC", "Lapins et oiseaux", ["#f6d3b4", "#b5732f", "#fff", 2]],
  ["Sofia Lambert", "Auxiliaire vétérinaire", "Soins et hospitalisation", ["#d79b72", "#2c1d16", SAGE_M, 1]],
  ["Hugo Delmas", "Auxiliaire vétérinaire", "Bloc opératoire et analyses", ["#f2c9a6", "#8c5a2b", SAGE_M, 0]],
  ["Nora Petit", "Accueil et conseils", "Rendez-vous et suivi des vaccins", ["#e8b48c", "#3a2418", APR_L, 2]],
];
const equipe = (c) => [wrapH(header(c)), pagehead("L'équipe", "Des visages<br>qui rassurent.", "Équipe fictive, imaginée pour cette démonstration.", "lapin"),
  sec(`<section class="mo-sec pk-bleed"><div class="mo-wrap"><div class="mo-polas">${TEAM.map(([n, r, sp, p], i) => `<article class="mo-pola mo-pola--${i % 3}" data-reveal><div class="mo-pola-pic">${person(...p)}</div><h3 class="mo-h3">${esc(n)}</h3><p class="mo-role">${esc(r)}</p><p>${esc(sp)}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="mo-sec mo-sec--sage pk-bleed mo-scal"><div class="mo-wrap"><div class="mo-sechead"><div><p class="mo-kicker">Les résidents</p><h2 class="mo-h2">Ils veillent sur la salle d'attente.</h2></div></div><div class="mo-resid">
    <article class="mo-card mo-res" data-reveal>${animal("chat", "", "0 0 200 210")}<div><h3 class="mo-h3">Biscotte</h3><p>Chatte de la clinique, spécialiste des câlins aux patients inquiets. Personnage imaginaire.</p></div></article>
    <article class="mo-card mo-res" data-reveal>${animal("chien", "", "0 0 200 210", "#d9b98a", "#8a6a45")}<div><h3 class="mo-h3">Praline</h3><p>Chienne de l'équipe, présente le mercredi. Elle accueille tout le monde sans exception. Personnage imaginaire.</p></div></article></div></div></section>`),
  sec(`<section class="mo-sec pk-bleed"><div class="mo-wrap mo-vals"><div data-reveal><span class="mo-num">1</span><h3 class="mo-h3">Écouter d'abord</h3><p>Chaque consultation commence par vos observations : vous connaissez votre compagnon mieux que quiconque.</p></div><div data-reveal><span class="mo-num">2</span><h3 class="mo-h3">Expliquer clairement</h3><p>Pas de jargon : nous décrivons les options, les soins et ce qui suit.</p></div><div data-reveal><span class="mo-num">3</span><h3 class="mo-h3">Soigner en douceur</h3><p>Gestes calmes, friandises et pauses : la peur n'est pas une fatalité.</p></div></div></section>`),
  sec(footer(c))];

const urgences = (c) => [wrapH(header(c)), pagehead("Urgences", "Que faire quand<br>ça ne peut pas attendre ?", "Page de démonstration : aucun conseil médical réel. En situation réelle, appelez immédiatement un vétérinaire.", "chien", APR_L),
  sec(`<section class="mo-urgbox pk-bleed"><div class="mo-wrap mo-urg-in"><div class="mo-call" data-reveal><p class="mo-kicker mo-kicker--d">Urgence 24 h / 24 · numéro fictif</p><a class="mo-tel" href="/contact">${TEL}</a><p>Dans un vrai site, ce numéro serait cliquable pour appeler directement. En démonstration, il est fictif.</p></div>
    <ol class="mo-todo">${[["Restez calme et appelez", "Décrivez l'animal, ce qui s'est passé et depuis quand. On vous guide."], ["Sécurisez l'animal", "Un endroit calme, au chaud, sans le forcer. Évitez de lui donner à manger ou à boire sans avis."], ["Partez avec le nécessaire", "Carnet de santé, boîte de transport ou laisse, et si possible l'emballage de ce qu'il a avalé."]].map(([t, x], i) => `<li data-reveal><span class="mo-num">${i + 1}</span><div><h2 class="mo-h4">${t}</h2><p>${x}</p></div></li>`).join("")}</ol></div></section>`),
  sec(`<section class="mo-sec pk-bleed"><div class="mo-wrap"><div class="mo-sechead"><div><p class="mo-kicker">Exemples de situations</p><h2 class="mo-h2">Appeler sans attendre si…</h2></div></div><p class="mo-lead mo-lead--s">Liste indicative de démonstration. Le moindre doute justifie un appel.</p>
    <div class="mo-alerts">${[["Difficultés à respirer", "Respiration bruyante, bouche ouverte chez le chat, gencives pâles."], ["Accident ou chute", "Choc, boiterie soudaine, plaie qui saigne."], ["Ingestion suspecte", "Plante, produit ménager, médicament ou aliment inhabituel."], ["Abattement soudain", "Animal qui ne réagit plus comme d'habitude, ne se lève plus."], ["Ventre gonflé", "Ventre tendu, tentatives de vomir sans y parvenir."], ["Convulsions", "Mouvements incontrôlés, perte de connaissance."]].map(([t, x], i) => `<article class="mo-alert" data-reveal><span class="mo-alert-i">${i + 1}</span><h3 class="mo-h3">${t}</h3><p>${x}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="mo-sec mo-sec--sage pk-bleed mo-scal"><div class="mo-wrap mo-split"><div><p class="mo-kicker">Hors des heures d'ouverture</p><h2 class="mo-h2">Un relais de garde.</h2><p class="mo-lead">Le soir, la nuit et le dimanche, la clinique oriente vers un service de garde fictif.</p></div>
    <div class="mo-card"><dl class="mo-dl"><dt>Clinique Moustache</dt><dd>Lun–Ven 8 h 30–19 h · Sam 9 h–13 h</dd><dt>Service de garde (fictif)</dt><dd>${TEL}<br>Tous les soirs, nuits et dimanches</dd><dt>En savoir plus</dt><dd><a href="/acces">Accès et horaires</a> · <a href="/contact">Nous écrire</a></dd></dl></div></div></section>`),
  sec(footer(c))];

const conseils = (c) => [wrapH(header(c)), pagehead("Fiches conseils", "Mieux comprendre<br>son compagnon.", "Filtrez par espèce ou par sujet. Contenus de démonstration, sans valeur de conseil médical.", "oiseau"),
  sec(`<section class="mo-sec pk-bleed"><div class="mo-wrap" data-filters>
    <div class="mo-toolbar" data-reveal><div class="mo-fgroup" role="group" aria-label="Espèce"><span class="mo-flabel">Espèce</span><a class="mo-chip is-on" href="#sp-tous" data-f="sp" data-v="tous">Toutes</a>${SPECIES.map(([k, l]) => `<a class="mo-chip" href="#sp-${k}" data-f="sp" data-v="${k}">${l}</a>`).join("")}</div>
      <div class="mo-fgroup" role="group" aria-label="Sujet"><span class="mo-flabel">Sujet</span><a class="mo-chip is-on" href="#tp-tous" data-f="tp" data-v="tous">Tous</a>${TOPICS.map(([k, l]) => `<a class="mo-chip" href="#tp-${k}" data-f="tp" data-v="${k}">${l}</a>`).join("")}</div></div>
    <p class="mo-count" aria-live="polite"><b data-n>${CONSEILS.length}</b> <span data-nl>fiches</span></p>
    <div class="mo-tips" data-tips>${CONSEILS.slice(0, 6).map(conseilCard).join("")}</div></div></section>`),
  sec(`<section class="mo-sec mo-sec--cont pk-bleed"><div class="mo-wrap"><div class="mo-tips" data-tips>${CONSEILS.slice(6).map(conseilCard).join("")}</div>
    <div class="mo-empty" data-empty hidden>${animal("lapin", "", "0 0 200 210")}<p class="mo-h3">Aucune fiche pour cette combinaison.</p><a class="mo-btn mo-btn--line" href="#reset" data-reset>Tout afficher</a></div></div></section>`),
  sec(footer(c))];

const conseil = (c) => [wrapH(header(c)), pagehead("Fiche conseil · chiens · prévention", "Préparer la première visite<br>d'un chiot.", "Fiche de démonstration, lecture : 4 minutes. Elle ne remplace pas l'avis d'un vétérinaire.", "chien"),
  sec(`<section class="mo-sec pk-bleed"><div class="mo-wrap mo-art"><aside class="mo-toc" aria-label="Sommaire"><p class="mo-fh">Dans cette fiche</p><a href="#avant">Avant la visite</a><a href="#pendant">Pendant la visite</a><a href="#apres">Après la visite</a></aside>
    <article class="mo-prose"><p class="mo-lead">Une première visite réussie donne le ton pour toutes les suivantes. Quelques préparatifs simples suffisent.</p>
    <h2 class="mo-h2 mo-h2--m" data-anchor="avant">Avant la visite</h2><p>Rassemblez les papiers fournis à l'adoption et notez vos questions : repas, sommeil, jeux, sorties. Habituez doucement votre chiot à son panier de transport, quelques jours avant, avec une couverture qui sent la maison.</p>
    <ul class="mo-checks"><li>Carnet de santé ou documents d'adoption</li><li>Friandises qu'il aime déjà</li><li>Une couverture familière</li><li>Vos questions, écrites à l'avance</li></ul>
    <h2 class="mo-h2 mo-h2--m" data-anchor="pendant">Pendant la visite</h2><p>Laissez-lui le temps d'explorer la pièce. L'équipe s'adapte à son rythme : pesée, écoute, échanges sur son quotidien. N'hésitez pas à demander ce que vous ne comprenez pas.</p>
    <blockquote class="mo-quote"><p>Un bon rendez-vous, c'est un chiot qui repart avec un souvenir agréable.</p></blockquote>
    <h2 class="mo-h2 mo-h2--m" data-anchor="apres">Après la visite</h2><p>Offrez-lui du calme et du repos. Notez les consignes données et le prochain rendez-vous, puis gardez le carnet à portée de main.</p>
    <div class="mo-disc"><b>Démonstration.</b> Cette fiche illustre le format des conseils de la clinique. Pour toute question sur la santé de votre animal, contactez un vétérinaire.</div>
    <div class="mo-cta"><a class="mo-btn" href="/rendez-vous">Prendre rendez-vous ${arrow}</a><a class="mo-btn mo-btn--line" href="/conseils">Toutes les fiches</a></div></article></div></section>`),
  sec(`<section class="mo-sec mo-sec--sage pk-bleed mo-scal"><div class="mo-wrap"><div class="mo-sechead"><div><h2 class="mo-h2">À lire aussi</h2></div></div><div class="mo-tips mo-tips--3">${[1, 2, 4].map((i) => conseilCard(CONSEILS[i])).join("")}</div></div></section>`),
  sec(footer(c))];

const PRICES = [
  ["Consultation générale", "38 à 55 €", "Durée : 30 minutes"], ["Consultation de suivi", "25 à 35 €", "Contrôle après un soin"], ["Consultation lapins et oiseaux", "45 à 60 €", "Avec la vétérinaire NAC"],
  ["Vaccination (acte + vaccin)", "55 à 85 €", "Selon le protocole"], ["Identification par puce", "60 à 80 €", "Enregistrement inclus"], ["Détartrage sous anesthésie", "180 à 340 €", "Selon l'état des dents"],
  ["Stérilisation d'une chatte", "110 à 260 €", "Soins de suite inclus"], ["Bilan senior", "120 à 210 €", "Analyses incluses"], ["Radiographie", "70 à 130 €", "Selon le nombre de clichés"],
];
const tarifs = (c) => [wrapH(header(c)), pagehead("Tarifs indicatifs", "Comprendre<br>ce que l'on paie.", "Fourchettes fictives, données pour expliquer la logique des tarifs. Ce n'est ni un devis ni un engagement.", "chat", APR_L),
  sec(`<section class="mo-sec pk-bleed"><div class="mo-wrap mo-prices-in"><ul class="mo-prices" aria-label="Tarifs indicatifs de démonstration">${PRICES.map(([n, p, x]) => `<li data-reveal><span class="mo-pn"><b>${n}</b><small>${x}</small></span><span class="mo-dots" aria-hidden="true"></span><span class="mo-pv">${p}</span></li>`).join("")}</ul>
    <aside class="mo-card mo-pnote" data-reveal><h2 class="mo-h4">Pourquoi une fourchette ?</h2><p>Chaque animal est unique. Le prix final dépend de sa taille, de son état et du matériel nécessaire. L'équipe vous donne toujours un devis avant un acte important.</p><a class="mo-btn" href="/contact">Demander un devis</a></aside></div></section>`),
  sec(`<section class="mo-sec mo-sec--sage pk-bleed mo-scal"><div class="mo-wrap"><div class="mo-sechead"><div><p class="mo-kicker">Ce qui fait varier le prix</p><h2 class="mo-h2">Quatre facteurs.</h2></div></div><div class="mo-factors">${[["Le poids", "Les doses de médicaments, d'anesthésiques et le matériel suivent la taille de l'animal."], ["L'anesthésie", "Elle demande surveillance, matériel et personnel dédié, ce qui représente une part du tarif."], ["Les examens associés", "Une analyse ou une radiographie avant un acte sécurise le soin, mais s'ajoute au prix."], ["L'horaire", "Hors des heures d'ouverture, une majoration couvre la mobilisation de l'équipe de garde."]].map(([t, x], i) => `<article class="mo-factor" data-reveal><span class="mo-num">${i + 1}</span><h3 class="mo-h3">${t}</h3><p>${x}</p></article>`).join("")}</div></div></section>`),
  sec(`<section class="mo-sec pk-bleed"><div class="mo-wrap mo-faq"><div><p class="mo-kicker">Bon à savoir</p><h2 class="mo-h2">Vos questions sur les tarifs</h2></div><div>
    <details data-reveal><summary>Recevrai-je un devis ?</summary><p>Pour tout acte important, un devis écrit est remis avant les soins, avec le détail des postes. Démonstration : fonctionnement fictif.</p></details>
    <details data-reveal><summary>Peut-on étaler un paiement ?</summary><p>Cette démonstration n'enregistre aucun paiement. Posez la question à l'équipe via le formulaire de contact.</p></details>
    <details data-reveal><summary>Les urgences coûtent-elles plus cher ?</summary><p>En dehors des horaires, une majoration indicative de 40 à 80 € peut s'appliquer. Elle est annoncée par téléphone.</p></details></div></div></section>`),
  sec(footer(c))];

const acces = (c) => [wrapH(header(c)), pagehead("Accès et horaires", "Venir nous<br>voir.", "12 rue du Verger, 44000 Nantes — adresse fictive pour cette démonstration.", "lapin"),
  sec(`<section class="mo-sec pk-bleed"><div class="mo-wrap mo-split mo-split--top"><div class="mo-card" data-reveal><h2 class="mo-h4">Horaires d'ouverture</h2><table class="mo-hours"><caption class="mo-sr">Horaires de la clinique</caption><tbody>${HOURS.map(([d, h], i) => `<tr data-day="${(i + 1) % 7}"><th scope="row">${d}</th><td>${h}</td></tr>`).join("")}</tbody></table><p class="mo-hint" data-open-line>Urgence hors horaires : ${TEL} (numéro fictif).</p></div>
    <div class="mo-access" data-reveal>${[["Tramway et bus", "Ligne 1, arrêt Verger, à deux minutes à pied."], ["En voiture", "Parking gratuit de huit places devant la clinique."], ["Accessibilité", "Entrée de plain-pied, salle d'attente spacieuse."], ["Avec votre animal", "Chats en panier, chiens en laisse : deux salles d'attente séparées."]].map(([t, x]) => `<div class="mo-acc"><span class="mo-svc-ic">${paw}</span><div><h3 class="mo-h3">${t}</h3><p>${x}</p></div></div>`).join("")}</div></div></section>`),
  { type: "layout", children: [{ type: "map", props: { address: "12 rue du Verger, 44000 Nantes", zoom: 14, height: 360 } }] },
  sec(`<section class="mo-sec pk-bleed"><div class="mo-wrap mo-final-in mo-final-in--flat"><div><h2 class="mo-h2">Prêt à venir ?</h2><p class="mo-lead">Préparez votre visite en quelques clics.</p></div><a class="mo-btn mo-btn--lg" href="/rendez-vous">Prendre rendez-vous ${arrow}</a></div></section>`),
  sec(footer(c))];

const rdv = (c) => [wrapH(header(c)), pagehead("Rendez-vous", "Réserver<br>sans se tromper.", "Un guide en cinq étapes pour préparer votre demande. Démonstration : rien n'est réservé automatiquement.", "chien"), sec(booking()),
  sec(`<section class="mo-sec pk-bleed"><div class="mo-wrap"><div class="mo-sechead"><div><p class="mo-kicker">À apporter</p><h2 class="mo-h2">Le jour de la visite.</h2></div></div><div class="mo-vals">${[["Le carnet de santé", "Vaccins, traitements précédents, documents d'adoption."], ["Un moyen de transport", "Panier fermé pour les chats, lapins et oiseaux, laisse courte pour les chiens."], ["Vos questions", "Notez-les à l'avance : on pense toujours à l'essentiel une fois sur place."]].map(([t, x], i) => `<div data-reveal><span class="mo-num">${i + 1}</span><h3 class="mo-h3">${t}</h3><p>${x}</p></div>`).join("")}</div></div></section>`),
  sec(footer(c))];

const contact = (c) => [wrapH(header(c)), pagehead("Contact", "Écrivez-nous.", "Question, demande de rendez-vous ou de devis : l'équipe répond sous deux jours ouvrés. Pour une urgence, appelez.", "chat"),
  { type: "form", heading: "Votre message", intro: "Indiquez l'espèce, le motif et vos disponibilités. Vous pouvez coller le récapitulatif du guide de rendez-vous." }, sec(footer(c))];
const recherche = (c) => [wrapH(header(c)), pagehead("Recherche", "Que cherchez-vous ?", "Un soin, une fiche conseil, un horaire.", "oiseau"), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher sur le site…" } }] }, sec(footer(c))];
const introuvable = (c) => [wrapH(header(c)), sec(`<section class="mo-404 pk-bleed"><div class="mo-wrap mo-404-in">${animal("chien", "mo-404-an", "0 0 200 210")}<div><p class="mo-kicker">Page introuvable</p><div class="mo-h1" role="heading" aria-level="1">Oups, on a flairé<br>sans rien trouver.</div><p class="mo-lead">Cette page n'existe pas ou a changé d'adresse.</p><div class="mo-cta"><a class="mo-btn mo-btn--lg" href="/">Retour à l'accueil</a><a class="mo-btn mo-btn--line mo-btn--lg" href="/recherche">Rechercher</a></div></div></div></section>`), sec(footer(c))];

module.exports = {
  key: "moustache", name: "Moustache", version: "2.0.0", category: "sante", tags: ["chaleureux", "naturel", "ludique"], siteType: "Clinique vétérinaire", featured: true,
  concept: "Un carnet de santé illustré : animaux dessinés au trait, pastille de navigation avec bouton urgence, rendez-vous guidé en cinq étapes et fiches conseils filtrables par espèce.",
  description: "Clinique vétérinaire de démonstration : sauge, abricot et crème, portraits d'animaux dessinés avec bulles d'infos, services en cartes, équipe, urgences, fiches conseils filtrables, tarifs expliqués et prise de rendez-vous guidée.",
  brand: "Clinique vétérinaire Moustache", modules: ["formulaires", "recherche", "cartes"],
  dna: { header: "pastille-flottante-et-bouton-urgence-abricot", hero: "portrait-d-animaux-dessines-et-bulles-d-infos", grid: "cartes-de-services-a-pictogramme-et-polaroids-d-equipe", motion: "animaux-qui-clignent-et-bulles-qui-flottent", shapes: "festons-empreintes-de-pattes-et-bulles", rhythm: "alterne-creme-sauge-par-bandes-festonnees", signature: "rendez-vous-guide-en-cinq-etapes-et-fiches-conseils-par-espece" },
  tokens: {
    colors: { primary: "#4f6f4c", secondary: "#4a3426", accent: "#f29a4a", background: "#fbf4e6", surface: "#fffaf0", text: "#4a3426", muted: "#6a5646", success: "#2f6b4f", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.gabarito", body: "font.nunito", button: "font.gabarito", link: "font.nunito" },
    radius: { sm: 10, md: 18, lg: 30, button: 999, field: 14, card: 26 }, shadow: { card: "0 10px 30px rgba(74,52,38,.1)", button: "0 5px 0 rgba(74,52,38,.18)" }, border: { width: 2, color: "#e6d9c0" },
    type: { h1: { size: 68, weight: 800, lineHeight: 1.05, transform: "none" }, h2: { size: 42, weight: 700, lineHeight: 1.1, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Orange abricot", type: "color", default: "#f29a4a" },
    { key: "sage", label: "Vert sauge", type: "color", default: "#4f6f4c" },
    { key: "festons", label: "Bords des bandes", type: "choice", default: "on", choices: [["on", "Festonnés"], ["off", "Droits"]] },
    { key: "bulles", label: "Bulles d'infos du hero", type: "choice", default: "on", choices: [["on", "Affichées"], ["off", "Masquées"]] },
    { key: "texte", label: "Taille du texte", type: "choice", default: "normal", choices: [["normal", "Normale"], ["grand", "Confortable"]] },
  ],
  menu: [["Accueil", "/"], ["Services", "/services"], ["Équipe", "/equipe"], ["Conseils", "/conseils"], ["Tarifs", "/tarifs"], ["Accès", "/acces"], ["Rendez-vous", "/rendez-vous"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "services", name: "Services", render: services }, { key: "equipe", name: "Équipe", render: equipe },
    { key: "urgences", name: "Urgences", render: urgences }, { key: "conseils", name: "Conseils", render: conseils }, { key: "conseil", name: "Fiche conseil", render: conseil },
    { key: "tarifs", name: "Tarifs indicatifs", render: tarifs }, { key: "acces", name: "Accès et horaires", render: acces }, { key: "rendez-vous", name: "Rendez-vous", render: rdv },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
