// Motion Studio, lot « t » : Compteur animé (Number Ticker). Va d'une valeur de départ à une valeur d'arrivée avec décimales, préfixe, suffixe, séparateur de
// milliers et de décimales, libellé, courbe d'accélération et tous les déclencheurs. Distinct du widget « Compteur » existant (entier simple, durée seule).
// La valeur FINALE est écrite dans la page (lisible sans JavaScript et par les lecteurs d'écran) ; chiffres à largeur fixe, la place est réservée.
// Exécution : public/js/motion-studio/text-fx.js (effet « ticker »). Mise en forme partagée serveur / navigateur : formatNumber.
const FX = require("../../../../public/js/motion-studio/text-fx.js");
module.exports = {
  type: "motionnumberticker", template: "motion-number-ticker", label: "Compteur animé", group: "advanced", icon: "barChart", version: 1, style: "text", status: "operational",
  description: "Un nombre qui défile jusqu'à sa valeur : décimales, préfixe, suffixe, séparateurs",
  keywords: "compteur nombre ticker number counter statistique chiffre cle pourcentage prix decimales separateur milliers incrementation",
  schema: [
    { key: "from", kind: "number", label: "Valeur de départ", min: -1000000000, max: 1000000000, default: 0 },
    { key: "to", kind: "number", label: "Valeur d'arrivée", min: -1000000000, max: 1000000000, default: 1250 },
    { key: "decimals", kind: "number", label: "Décimales (0 à 4)", min: 0, max: 4, integer: true, default: 0 },
    { key: "prefix", kind: "text", label: "Préfixe (ex. € ou +)", max: 8, default: "" },
    { key: "suffix", kind: "text", label: "Suffixe (ex. % ou +)", max: 12, default: "+" },
    { key: "gap", kind: "bool", label: "Espace insécable avant le suffixe (ex. 12 %)", default: false },
    { key: "thousands", kind: "select", label: "Séparateur des milliers", options: [["space", "Espace (1 250)"], ["comma", "Virgule (1,250)"], ["dot", "Point (1.250)"], ["apos", "Apostrophe (1’250)"], ["none", "Aucun (1250)"]], default: "space" },
    { key: "decimal", kind: "select", label: "Séparateur des décimales", options: [["comma", "Virgule (1,5)"], ["dot", "Point (1.5)"]], default: "comma" },
    { key: "label", kind: "text", label: "Libellé sous le nombre (facultatif)", max: 80, default: "clients accompagnés" },
  ],
  validate(p, where) {
    if (p.thousands === "comma" && p.decimal === "comma") throw new Error(`${where} : le séparateur des milliers et celui des décimales doivent être différents.`);
    if (p.thousands === "dot" && p.decimal === "dot") throw new Error(`${where} : le séparateur des milliers et celui des décimales doivent être différents.`);
  },
  data(ctx, p) {
    const fmt = { decimals: p.decimals, thousands: p.thousands, decimal: p.decimal, prefix: p.prefix, suffix: p.suffix && p.gap ? "\u00a0" + p.suffix : p.suffix };
    return { text: FX.formatNumber(p.to, fmt), opts: { from: p.from, to: p.to, ...fmt } };
  },
  motion: {
    module: "text-fx",
    defaults: { trigger: "viewport", duration: 2000, delay: 0, easing: "ease-out" },
    controls: ["trigger", "duration", "delay", "easing", "repeat", "scrub"],
  },
};
