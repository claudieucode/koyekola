// Identité propre d'un concept « Article individuel » v3 : palette [fond, encre, accent, surface] et deux polices de la bibliothèque locale → identité complète à valeurs FIXES
// (jamais un jeton du site). Le contraste est vérifié au chargement : un concept illisible fait échouer le catalogue (et l'audit), pas le visiteur.
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (a) => `#${a.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
const lum = (h) => { const [r, g, b] = hex(h).map((v) => v / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t)); // t = 0 → a, 1 → b

// Polices à graisse unique : pas de gras artificiel
const SINGLE = new Set(["anton", "bebas-neue", "abril-fatface", "rozha-one", "staatliches", "limelight", "yeseva-one", "gloock", "dm-serif-display", "instrument-serif", "young-serif", "special-elite", "teko", "cinzel"]);
// Forme (arrondis, bordures, relief, casse) selon la direction artistique : pas une palette seulement
const FORM = [
  [/luxe|joaill|horlog|maroquin|prestige/i, { radius: "0px", btnRadius: "0px", shadow: "none", caps: "none", track: "1px", bw: "1px", pad: "20px", gap: "32px", btn: "outline", rule: "single" }],
  [/magazine|journal|presse|institution|acad|univers|scient|encyclop|revue|dépêche|rapport/i, { radius: "0px", btnRadius: "2px", shadow: "none", caps: "none", track: "0px", bw: "1px", pad: "18px", gap: "28px", btn: "solid", rule: "single" }],
  [/exp[ée]riment|fanzine|imprim|collage|affiche/i, { radius: "0px", btnRadius: "0px", shadow: "none", caps: "uppercase", track: "1px", bw: "3px", pad: "16px", gap: "28px", btn: "solid", rule: "double" }],
  [/techno|logiciel|code|open source|saas|benchmark/i, { radius: "8px", btnRadius: "6px", shadow: "none", caps: "none", track: "0px", bw: "1px", pad: "16px", gap: "24px", btn: "solid", rule: "single" }],
  [/bien-être|yoga|jeunesse|junior|enfant|éducatif|communaut|association|gastronom|cuisine/i, { radius: "20px", btnRadius: "999px", shadow: "md", caps: "none", track: "0px", bw: "0px", pad: "22px", gap: "22px", btn: "solid", rule: "none" }],
  [/sport|automobile|photograph|cin[ée]ma|musical|divertissement/i, { radius: "2px", btnRadius: "2px", shadow: "lg", caps: "none", track: "0px", bw: "2px", pad: "16px", gap: "24px", btn: "solid", rule: "single" }],
];
const DEFAULT_FORM = { radius: "10px", btnRadius: "8px", shadow: "none", caps: "none", track: "0px", bw: "1px", pad: "18px", gap: "26px", btn: "solid", rule: "single" };

function skinOf(c) {
  const [bg, fg, , alt] = c.palette, [head, text] = c.fonts;
  // texte secondaire : l'encre éclaircie vers le fond jusqu'à un contraste de 4,5 (au plus 55 %)
  let mute = fg; for (let t = 0.3; t <= 0.55; t += 0.05) { mute = mix(fg, bg, t); if (ratio(mute, bg) >= 4.5) break; }
  // accent : ajusté vers l'encre, par petits pas, jusqu'à être lisible sur le fond (3 : 1) et à porter un texte (4,5 : 1) ; l'accent final est celui qui est publié dans la fiche du concept
  const pickOn = (a) => (ratio("#ffffff", a) >= ratio("#111111", a) ? "#ffffff" : "#111111");
  let accent = c.palette[2];
  for (let t = 0; t <= 0.8; t += 0.04) { const a = mix(c.palette[2], fg, t); if ((ratio(a, bg) >= 3.05 || a.toLowerCase() === fg.toLowerCase()) && ratio(pickOn(a), a) >= 4.55) { accent = a; break; } }
  const onAccent = pickOn(accent);
  const form = (FORM.find(([re]) => re.test(`${c.dir} ${c.sector}`)) || [0, DEFAULT_FORM])[1];
  const S = { key: c.id.toLowerCase(), label: c.name, bg, fg, mute, alt, accent, onAccent, line: mix(fg, bg, 0.82), ink: fg, onInk: bg, ...form,
    weight: SINGLE.has(head) ? "400" : "700", font: `font.${text}`, head: `font.${head}`, mood: "own" };
  const bad = [];
  if (ratio(fg, bg) < 4.5) bad.push(`texte/fond ${ratio(fg, bg).toFixed(2)}`);
  if (ratio(mute, bg) < 4.4) bad.push(`texte secondaire/fond ${ratio(mute, bg).toFixed(2)}`);
  if (ratio(accent, bg) < 3 && accent.toLowerCase() !== fg.toLowerCase()) bad.push(`accent/fond ${ratio(accent, bg).toFixed(2)}`);
  if (ratio(onAccent, accent) < 4.5) bad.push(`texte d'accent ${ratio(onAccent, accent).toFixed(2)}`);
  if (ratio(fg, alt) < 4.5) bad.push(`texte/surface ${ratio(fg, alt).toFixed(2)}`);
  if (bad.length) throw new Error(`Article individuel v3 — concept ${c.id} « ${c.name} » illisible : ${bad.join(", ")}`);
  return S;
}
module.exports = { skinOf, ratio, mix, lum };
