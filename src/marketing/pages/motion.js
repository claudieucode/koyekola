// KOLAKISA — Motion Effects Engine : REGISTRE des animations d'entrée / d'attention / de sortie.
// Une animation = une entrée de ce registre (id, libellé, catégorie, type, images-clés CSS, durée et courbe conseillées, comportement
// quand le visiteur a demandé moins de mouvement). Le panneau, la validation du serveur, le CSS de la page publiée et l'aperçu de
// l'éditeur lisent TOUS ce registre : ajouter une animation = ajouter une ligne ici, rien d'autre.
//   kind : "in"   — l'élément est caché jusqu'au déclenchement, puis apparaît (fill backwards)
//          "attn" — l'élément reste visible, l'animation attire l'œil (aucun remplissage)
//          "out"  — l'élément est visible, puis disparaît (fill forwards)
//   reduced : "fade" (apparition en fondu court) ou "none" (aucune animation) pour les visiteurs qui préfèrent moins de mouvement
// Les images-clés sont du CSS écrit ici, jamais construit à partir d'une saisie : rien d'arbitraire n'atteint la page.
// Mouvements sur « transform » seulement (et opacity) : propriétés composées par le navigateur, sans recalcul de mise en page.
"use strict";

const T = (v) => `transform:${v}`;
const none = "transform:none";
const slide = (x, y) => `translate3d(${x},${y},0)`;
// [id, libellé, catégorie, type, images-clés, réduit, durée conseillée (ms), courbe conseillée]
const DEFS = [
  // ---- Classiques (identifiants historiques : les pages déjà enregistrées gardent leur animation) ----
  ["fade", "Fondu", "Classiques", "in", "from{opacity:0}to{opacity:1}", "fade"],
  ["slide-up", "Glisse vers le haut", "Classiques", "in", `from{opacity:0;${T("translateY(28px)")}}to{opacity:1;${none}}`, "fade"],
  ["slide-down", "Glisse vers le bas", "Classiques", "in", `from{opacity:0;${T("translateY(-28px)")}}to{opacity:1;${none}}`, "fade"],
  ["slide-left", "Glisse depuis la droite", "Classiques", "in", `from{opacity:0;${T("translateX(28px)")}}to{opacity:1;${none}}`, "fade"],
  ["slide-right", "Glisse depuis la gauche", "Classiques", "in", `from{opacity:0;${T("translateX(-28px)")}}to{opacity:1;${none}}`, "fade"],
  ["zoom", "Zoom avant", "Classiques", "in", `from{opacity:0;${T("scale(.92)")}}to{opacity:1;${none}}`, "fade"],
  ["bounce", "Rebond", "Classiques", "in", `0%{opacity:0;${T("translateY(40px)")}}60%{opacity:1;${T("translateY(-8px)")}}80%{${T("translateY(3px)")}}100%{opacity:1;${none}}`, "fade"],
  ["rotate", "Rotation", "Classiques", "in", `from{opacity:0;${T("rotate(-12deg) scale(.95)")}}to{opacity:1;${none}}`, "fade"],
  ["reveal", "Dévoilement", "Classiques", "in", "from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}", "fade"],
  ["flip", "Bascule 3D", "Classiques", "in", `from{opacity:0;${T("perspective(600px) rotateX(70deg)")}}to{opacity:1;${none}}`, "fade"],

  // ---- Fading ----
  ["fade-in", "Fade In", "Fading", "in", "from{opacity:0}to{opacity:1}", "fade"],
  ["fade-in-down", "Fade In Down", "Fading", "in", `from{opacity:0;${T(slide("0", "-100%"))}}to{opacity:1;${none}}`, "fade"],
  ["fade-in-left", "Fade In Left", "Fading", "in", `from{opacity:0;${T(slide("-100%", "0"))}}to{opacity:1;${none}}`, "fade"],
  ["fade-in-right", "Fade In Right", "Fading", "in", `from{opacity:0;${T(slide("100%", "0"))}}to{opacity:1;${none}}`, "fade"],
  ["fade-in-up", "Fade In Up", "Fading", "in", `from{opacity:0;${T(slide("0", "100%"))}}to{opacity:1;${none}}`, "fade"],
  ["fade-in-down-left", "Fade In Down Left", "Fading", "in", `from{opacity:0;${T(slide("-100%", "-100%"))}}to{opacity:1;${none}}`, "fade"],
  ["fade-in-down-right", "Fade In Down Right", "Fading", "in", `from{opacity:0;${T(slide("100%", "-100%"))}}to{opacity:1;${none}}`, "fade"],
  ["fade-in-up-left", "Fade In Up Left", "Fading", "in", `from{opacity:0;${T(slide("-100%", "100%"))}}to{opacity:1;${none}}`, "fade"],
  ["fade-in-up-right", "Fade In Up Right", "Fading", "in", `from{opacity:0;${T(slide("100%", "100%"))}}to{opacity:1;${none}}`, "fade"],

  // ---- Zooming ----
  ["zoom-in", "Zoom In", "Zooming", "in", `from{opacity:0;${T("scale3d(.3,.3,.3)")}}50%{opacity:1}to{${none}}`, "fade"],
  ["zoom-in-down", "Zoom In Down", "Zooming", "in", `0%{opacity:0;${T(`scale3d(.1,.1,.1) ${slide("0", "-100%")}`)};animation-timing-function:cubic-bezier(.55,.055,.675,.19)}60%{opacity:1;${T(`scale3d(.475,.475,.475) ${slide("0", "60px")}`)};animation-timing-function:cubic-bezier(.175,.885,.32,1)}100%{${none}}`, "fade"],
  ["zoom-in-left", "Zoom In Left", "Zooming", "in", `0%{opacity:0;${T(`scale3d(.1,.1,.1) ${slide("-100%", "0")}`)};animation-timing-function:cubic-bezier(.55,.055,.675,.19)}60%{opacity:1;${T(`scale3d(.475,.475,.475) ${slide("48px", "0")}`)};animation-timing-function:cubic-bezier(.175,.885,.32,1)}100%{${none}}`, "fade"],
  ["zoom-in-right", "Zoom In Right", "Zooming", "in", `0%{opacity:0;${T(`scale3d(.1,.1,.1) ${slide("100%", "0")}`)};animation-timing-function:cubic-bezier(.55,.055,.675,.19)}60%{opacity:1;${T(`scale3d(.475,.475,.475) ${slide("-48px", "0")}`)};animation-timing-function:cubic-bezier(.175,.885,.32,1)}100%{${none}}`, "fade"],
  ["zoom-in-up", "Zoom In Up", "Zooming", "in", `0%{opacity:0;${T(`scale3d(.1,.1,.1) ${slide("0", "100%")}`)};animation-timing-function:cubic-bezier(.55,.055,.675,.19)}60%{opacity:1;${T(`scale3d(.475,.475,.475) ${slide("0", "-60px")}`)};animation-timing-function:cubic-bezier(.175,.885,.32,1)}100%{${none}}`, "fade"],

  // ---- Bouncing ----
  ["bounce-in", "Bounce In", "Bouncing", "in", `0%{opacity:0;${T("scale3d(.3,.3,.3)")}}20%{${T("scale3d(1.1,1.1,1.1)")}}40%{${T("scale3d(.9,.9,.9)")}}60%{opacity:1;${T("scale3d(1.03,1.03,1.03)")}}80%{${T("scale3d(.97,.97,.97)")}}100%{opacity:1;${none}}`, "fade", 750, "ease-out"],
  ["bounce-in-down", "Bounce In Down", "Bouncing", "in", `0%{opacity:0;${T(`${slide("0", "-100%")} scaleY(3)`)}}60%{opacity:1;${T(`${slide("0", "25px")} scaleY(.9)`)}}75%{${T(`${slide("0", "-10px")} scaleY(.95)`)}}90%{${T(`${slide("0", "5px")} scaleY(.985)`)}}100%{${none}}`, "fade", 900, "ease-out"],
  ["bounce-in-left", "Bounce In Left", "Bouncing", "in", `0%{opacity:0;${T(`${slide("-100%", "0")} scaleX(3)`)}}60%{opacity:1;${T(`${slide("25px", "0")} scaleX(1)`)}}75%{${T(`${slide("-10px", "0")} scaleX(.98)`)}}90%{${T(`${slide("5px", "0")} scaleX(.995)`)}}100%{${none}}`, "fade", 900, "ease-out"],
  ["bounce-in-right", "Bounce In Right", "Bouncing", "in", `0%{opacity:0;${T(`${slide("100%", "0")} scaleX(3)`)}}60%{opacity:1;${T(`${slide("-25px", "0")} scaleX(1)`)}}75%{${T(`${slide("10px", "0")} scaleX(.98)`)}}90%{${T(`${slide("-5px", "0")} scaleX(.995)`)}}100%{${none}}`, "fade", 900, "ease-out"],
  ["bounce-in-up", "Bounce In Up", "Bouncing", "in", `0%{opacity:0;${T(`${slide("0", "100%")} scaleY(5)`)}}60%{opacity:1;${T(`${slide("0", "-20px")} scaleY(.9)`)}}75%{${T(`${slide("0", "10px")} scaleY(.95)`)}}90%{${T(`${slide("0", "-5px")} scaleY(.985)`)}}100%{${none}}`, "fade", 900, "ease-out"],

  // ---- Sliding ----
  ["slide-in-down", "Slide In Down", "Sliding", "in", `from{${T(slide("0", "-100%"))}}to{${none}}`, "fade"],
  ["slide-in-left", "Slide In Left", "Sliding", "in", `from{${T(slide("-100%", "0"))}}to{${none}}`, "fade"],
  ["slide-in-right", "Slide In Right", "Sliding", "in", `from{${T(slide("100%", "0"))}}to{${none}}`, "fade"],
  ["slide-in-up", "Slide In Up", "Sliding", "in", `from{${T(slide("0", "100%"))}}to{${none}}`, "fade"],

  // ---- Rotating ----
  ["rotate-in", "Rotate In", "Rotating", "in", `from{transform-origin:center;opacity:0;${T("rotate(-200deg)")}}to{transform-origin:center;opacity:1;${none}}`, "fade"],
  ["rotate-in-down-left", "Rotate In Down Left", "Rotating", "in", `from{transform-origin:left bottom;opacity:0;${T("rotate(-45deg)")}}to{transform-origin:left bottom;opacity:1;${none}}`, "fade"],
  ["rotate-in-down-right", "Rotate In Down Right", "Rotating", "in", `from{transform-origin:right bottom;opacity:0;${T("rotate(45deg)")}}to{transform-origin:right bottom;opacity:1;${none}}`, "fade"],
  ["rotate-in-up-left", "Rotate In Up Left", "Rotating", "in", `from{transform-origin:left bottom;opacity:0;${T("rotate(45deg)")}}to{transform-origin:left bottom;opacity:1;${none}}`, "fade"],
  ["rotate-in-up-right", "Rotate In Up Right", "Rotating", "in", `from{transform-origin:right bottom;opacity:0;${T("rotate(-90deg)")}}to{transform-origin:right bottom;opacity:1;${none}}`, "fade"],

  // ---- Flipping et retours (en plus) ----
  ["flip-in-x", "Flip In X", "Flipping", "in", `from{opacity:0;${T("perspective(400px) rotateX(90deg)")};animation-timing-function:ease-in}40%{${T("perspective(400px) rotateX(-20deg)")};animation-timing-function:ease-in}60%{opacity:1;${T("perspective(400px) rotateX(10deg)")}}80%{${T("perspective(400px) rotateX(-5deg)")}}to{${T("perspective(400px)")}}`, "fade", 750, "ease-out"],
  ["flip-in-y", "Flip In Y", "Flipping", "in", `from{opacity:0;${T("perspective(400px) rotateY(90deg)")};animation-timing-function:ease-in}40%{${T("perspective(400px) rotateY(-20deg)")};animation-timing-function:ease-in}60%{opacity:1;${T("perspective(400px) rotateY(10deg)")}}80%{${T("perspective(400px) rotateY(-5deg)")}}to{${T("perspective(400px)")}}`, "fade", 750, "ease-out"],
  ["back-in-down", "Back In Down", "Back", "in", `0%{opacity:.7;${T(`${slide("0", "-100%")} scale(.7)`)}}80%{opacity:.7;${T("scale(.7)")}}100%{opacity:1;${none}}`, "fade", 800],
  ["back-in-left", "Back In Left", "Back", "in", `0%{opacity:.7;${T(`${slide("-100%", "0")} scale(.7)`)}}80%{opacity:.7;${T("scale(.7)")}}100%{opacity:1;${none}}`, "fade", 800],
  ["back-in-right", "Back In Right", "Back", "in", `0%{opacity:.7;${T(`${slide("100%", "0")} scale(.7)`)}}80%{opacity:.7;${T("scale(.7)")}}100%{opacity:1;${none}}`, "fade", 800],
  ["back-in-up", "Back In Up", "Back", "in", `0%{opacity:.7;${T(`${slide("0", "100%")} scale(.7)`)}}80%{opacity:.7;${T("scale(.7)")}}100%{opacity:1;${none}}`, "fade", 800],

  // ---- Attention seekers ----
  ["attn-bounce", "Bounce", "Attention Seekers", "attn", `0%,20%,53%,100%{animation-timing-function:cubic-bezier(.215,.61,.355,1);transform-origin:center bottom;${T(slide("0", "0"))}}40%,43%{animation-timing-function:cubic-bezier(.755,.05,.855,.06);${T(`${slide("0", "-30px")} scaleY(1.1)`)}}70%{animation-timing-function:cubic-bezier(.755,.05,.855,.06);${T(`${slide("0", "-15px")} scaleY(1.05)`)}}80%{${T(`${slide("0", "0")} scaleY(.95)`)}}90%{${T(`${slide("0", "-4px")} scaleY(1.02)`)}}`, "none", 1000],
  ["flash", "Flash", "Attention Seekers", "attn", "0%,50%,100%{opacity:1}25%,75%{opacity:0}", "none", 1000],
  ["pulse", "Pulse", "Attention Seekers", "attn", `0%{${T("scale3d(1,1,1)")}}50%{${T("scale3d(1.05,1.05,1.05)")}}100%{${T("scale3d(1,1,1)")}}`, "none", 1000],
  ["rubber-band", "Rubber Band", "Attention Seekers", "attn", `0%{${T("scale3d(1,1,1)")}}30%{${T("scale3d(1.25,.75,1)")}}40%{${T("scale3d(.75,1.25,1)")}}50%{${T("scale3d(1.15,.85,1)")}}65%{${T("scale3d(.95,1.05,1)")}}75%{${T("scale3d(1.05,.95,1)")}}100%{${T("scale3d(1,1,1)")}}`, "none", 1000],
  ["shake", "Shake", "Attention Seekers", "attn", `0%,100%{${T(slide("0", "0"))}}10%,30%,50%,70%,90%{${T(slide("-10px", "0"))}}20%,40%,60%,80%{${T(slide("10px", "0"))}}`, "none", 1000],
  ["head-shake", "Head Shake", "Attention Seekers", "attn", `0%{${T("translateX(0)")}}6.5%{${T("translateX(-6px) rotateY(-9deg)")}}18.5%{${T("translateX(5px) rotateY(7deg)")}}31.5%{${T("translateX(-3px) rotateY(-5deg)")}}43.5%{${T("translateX(2px) rotateY(3deg)")}}50%{${T("translateX(0)")}}`, "none", 1000, "ease-in-out"],
  ["swing", "Swing", "Attention Seekers", "attn", `20%{transform-origin:top center;${T("rotate(15deg)")}}40%{transform-origin:top center;${T("rotate(-10deg)")}}60%{transform-origin:top center;${T("rotate(5deg)")}}80%{transform-origin:top center;${T("rotate(-5deg)")}}100%{transform-origin:top center;${T("rotate(0deg)")}}`, "none", 1000],
  ["tada", "Tada", "Attention Seekers", "attn", `0%{${T("scale3d(1,1,1)")}}10%,20%{${T("scale3d(.9,.9,.9) rotate(-3deg)")}}30%,50%,70%,90%{${T("scale3d(1.1,1.1,1.1) rotate(3deg)")}}40%,60%,80%{${T("scale3d(1.1,1.1,1.1) rotate(-3deg)")}}100%{${T("scale3d(1,1,1)")}}`, "none", 1000],
  ["wobble", "Wobble", "Attention Seekers", "attn", `0%{${none}}15%{${T("translate3d(-25%,0,0) rotate(-5deg)")}}30%{${T("translate3d(20%,0,0) rotate(3deg)")}}45%{${T("translate3d(-15%,0,0) rotate(-3deg)")}}60%{${T("translate3d(10%,0,0) rotate(2deg)")}}75%{${T("translate3d(-5%,0,0) rotate(-1deg)")}}100%{${none}}`, "none", 1000],
  ["jello", "Jello", "Attention Seekers", "attn", `0%,11.1%,100%{${none}}22.2%{${T("skewX(-12.5deg) skewY(-12.5deg)")}}33.3%{${T("skewX(6.25deg) skewY(6.25deg)")}}44.4%{${T("skewX(-3.125deg) skewY(-3.125deg)")}}55.5%{${T("skewX(1.5625deg) skewY(1.5625deg)")}}66.6%{${T("skewX(-.78125deg) skewY(-.78125deg)")}}77.7%{${T("skewX(.390625deg) skewY(.390625deg)")}}88.8%{${T("skewX(-.1953125deg) skewY(-.1953125deg)")}}`, "none", 1000, "ease-in-out"],
  ["heartbeat", "Heartbeat", "Attention Seekers", "attn", `0%{${T("scale(1)")}}14%{${T("scale(1.3)")}}28%{${T("scale(1)")}}42%{${T("scale(1.3)")}}70%{${T("scale(1)")}}`, "none", 1300, "ease-in-out"],

  // ---- Light Speed ----
  ["light-speed-in", "Light Speed In", "Light Speed", "in", `from{opacity:0;${T(`${slide("100%", "0")} skewX(-30deg)`)}}60%{opacity:1;${T("skewX(20deg)")}}80%{${T("skewX(-5deg)")}}to{${none}}`, "fade", 800, "ease-out"],
  ["light-speed-in-right", "Light Speed In Right", "Light Speed", "in", `from{opacity:0;${T(`${slide("100%", "0")} skewX(-30deg)`)}}60%{opacity:1;${T("skewX(20deg)")}}80%{${T("skewX(-5deg)")}}to{${none}}`, "fade", 800, "ease-out"],
  ["light-speed-in-left", "Light Speed In Left", "Light Speed", "in", `from{opacity:0;${T(`${slide("-100%", "0")} skewX(30deg)`)}}60%{opacity:1;${T("skewX(-20deg)")}}80%{${T("skewX(5deg)")}}to{${none}}`, "fade", 800, "ease-out"],
  ["light-speed-out", "Light Speed Out", "Light Speed", "out", `from{opacity:1}to{opacity:0;${T(`${slide("100%", "0")} skewX(30deg)`)}}`, "none", 800, "ease-in"],
  ["light-speed-out-right", "Light Speed Out Right", "Light Speed", "out", `from{opacity:1}to{opacity:0;${T(`${slide("100%", "0")} skewX(30deg)`)}}`, "none", 800, "ease-in"],
  ["light-speed-out-left", "Light Speed Out Left", "Light Speed", "out", `from{opacity:1}to{opacity:0;${T(`${slide("-100%", "0")} skewX(-30deg)`)}}`, "none", 800, "ease-in"],

  // ---- Specials ----
  ["roll-in", "Roll In", "Specials", "in", `from{opacity:0;${T(`${slide("-100%", "0")} rotate(-120deg)`)}}to{opacity:1;${none}}`, "fade", 900],
  ["roll-out", "Roll Out", "Specials", "out", `from{opacity:1}to{opacity:0;${T(`${slide("100%", "0")} rotate(120deg)`)}}`, "none", 900, "ease-in"],
];

const DESCRIPTIONS = { in: "Apparaît avec ce mouvement.", attn: "Attire l'œil sans changer la place de l'élément.", out: "Disparaît avec ce mouvement." };
const CATEGORY_ORDER = ["Classiques", "Fading", "Zooming", "Bouncing", "Sliding", "Rotating", "Flipping", "Back", "Attention Seekers", "Light Speed", "Specials"];

const ANIMATIONS = {};
for (const [id, label, category, kind, frames, reduced, duration, easing] of DEFS) {
  ANIMATIONS[id] = {
    id, label, category, kind, description: DESCRIPTIONS[kind], keyframes: frames, reducedMotionBehavior: reduced,
    defaultDuration: duration || 600, defaultEasing: easing || "smooth",
    // Une animation d'arrivée peut être inversée ; une animation d'attention peut se répéter / alterner ; une sortie reste en place à la fin
    supportedDirections: kind === "in" ? ["normal", "reverse", "alternate", "alternate-reverse"] : ["normal", "reverse", "alternate", "alternate-reverse"],
    fill: kind === "out" ? "forwards" : kind === "attn" ? "none" : "backwards",
  };
}

// Courbes d'accélération : des noms, jamais du CSS libre. « cubic-bezier » personnalisé : 4 nombres bornés, reconstruit à la sortie.
const EASINGS = { smooth: "cubic-bezier(.2, .7, .2, 1)", linear: "linear", ease: "ease", "ease-in": "ease-in", "ease-out": "ease-out", "ease-in-out": "ease-in-out", spring: "cubic-bezier(.34, 1.56, .64, 1)" };
const BEZIER = /^cubic-bezier\(\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*\)$/;
// Renvoie la forme normalisée (nom connu ou « cubic-bezier(a,b,c,d) » à valeurs bornées) ou null
function normalizeEasing(v) {
  const s = String(v ?? "").trim().toLowerCase();
  if (Object.hasOwn(EASINGS, s)) return s;
  const m = BEZIER.exec(s);
  if (!m) return null;
  const n = m.slice(1).map(Number);
  if (n.some((x) => !Number.isFinite(x)) || n[0] < 0 || n[0] > 1 || n[2] < 0 || n[2] > 1 || n[1] < -3 || n[1] > 3 || n[3] < -3 || n[3] > 3) return null;
  return `cubic-bezier(${n.map((x) => Math.round(x * 1000) / 1000).join(", ")})`;
}
const easingCss = (v) => (Object.hasOwn(EASINGS, v) ? EASINGS[v] : v);
const ITERATIONS = [1, 2, 3, "infinite"];
const DIRECTIONS = ["normal", "reverse", "alternate", "alternate-reverse"];
const TRIGGERS = { viewport: "Quand l'élément est visible", load: "Au chargement de la page", click: "Au clic", hover: "Au survol" };

const keyframesOf = (id) => `@keyframes kw-a-${id}{${ANIMATIONS[id].keyframes}}`;
// Seules les animations réellement utilisées par la page sont écrites dans son CSS (page publiée légère)
const keyframesCss = (ids) => [...new Set(ids)].filter((id) => Object.hasOwn(ANIMATIONS, id)).map(keyframesOf).join("");
const allKeyframesCss = () => Object.keys(ANIMATIONS).map(keyframesOf).join("");

// Catalogue envoyé à l'éditeur (sans les images-clés : elles sont dans allKeyframesCss, injecté une fois dans le canevas)
const catalog = () => Object.values(ANIMATIONS)
  .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category))
  .map(({ id, label, category, kind, description, defaultDuration, defaultEasing, reducedMotionBehavior, supportedDirections, fill }) => ({ id, label, category, kind, description, defaultDuration, defaultEasing, reducedMotionBehavior, supportedDirections, fill }));

module.exports = { ANIMATIONS, CATEGORY_ORDER, EASINGS, ITERATIONS, DIRECTIONS, TRIGGERS, normalizeEasing, easingCss, keyframesOf, keyframesCss, allKeyframesCss, catalog };
