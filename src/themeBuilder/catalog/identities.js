// Identités PROPRES partagées par les en-têtes et les pieds de page : couleurs en valeurs fixes et polices de la bibliothèque locale, jamais la charte du site ni celle de l'administration.
// Identités PROPRES aux modèles sectoriels : couleurs en valeurs fixes et polices de la bibliothèque locale (Apparence → Polices), indépendantes de la charte du site comme de l'administration.
const IDENT = [
  { key: "resto", label: "Restaurant chaleureux", bg: "#fbf6ee", fg: "#2b1a12", mute: "#7b6350", alt: "#f0e4d0", accent: "#8c2f1b", onAccent: "#fff8ef", line: "#e2d2b8", radius: "4px", btnRadius: "2px", shadow: "none", font: "font.lato", head: "font.playfair-display", weight: "700", caps: "none", track: "0px", bw: "1px", pad: "16px", gap: "24px", btn: "solid", rule: "single" },
  { key: "ecole", label: "École lumineuse", bg: "#ffffff", fg: "#0f3d3a", mute: "#4b6b68", alt: "#e6f4f1", accent: "#f59e0b", onAccent: "#1f1300", line: "#cfe6e2", radius: "14px", btnRadius: "999px", shadow: "none", font: "font.nunito", head: "font.nunito", weight: "800", caps: "none", track: "0px", bw: "1px", pad: "16px", gap: "24px", btn: "solid", rule: "single" },
  { key: "agence", label: "Agence contrastée", bg: "#0d0d0d", fg: "#f5f5f0", mute: "#a3a3a3", alt: "#1c1c1c", accent: "#c6ff3d", onAccent: "#0d0d0d", line: "#2e2e2e", radius: "0px", btnRadius: "0px", shadow: "none", font: "font.space-grotesk", head: "font.space-grotesk", weight: "700", caps: "uppercase", track: "1px", bw: "2px", pad: "18px", gap: "28px", btn: "solid", rule: "thick" },
  { key: "cabinet", label: "Cabinet sobre", bg: "#f4f7f5", fg: "#1c2b27", mute: "#52665f", alt: "#e3ece8", accent: "#2f6f5e", onAccent: "#ffffff", line: "#cfdcd6", radius: "6px", btnRadius: "6px", shadow: "none", font: "font.source-sans-3", head: "font.lora", weight: "600", caps: "none", track: "0px", bw: "1px", pad: "16px", gap: "24px", btn: "solid", rule: "single" },
  { key: "portfolio", label: "Portfolio éditorial", bg: "#f6f4ef", fg: "#111111", mute: "#5f5b54", alt: "#ebe7de", accent: "#111111", onAccent: "#f6f4ef", line: "#d8d3c7", radius: "0px", btnRadius: "0px", shadow: "none", font: "font.dm-sans", head: "font.instrument-serif", weight: "400", caps: "none", track: "0px", bw: "1px", pad: "20px", gap: "32px", btn: "outline", rule: "none" },
  { key: "saas", label: "SaaS violet", bg: "#ffffff", fg: "#0f172a", mute: "#475569", alt: "#f1f0fe", accent: "#6d28d9", onAccent: "#ffffff", line: "#e5e3f7", radius: "10px", btnRadius: "10px", shadow: "none", font: "font.inter", head: "font.plus-jakarta-sans", weight: "700", caps: "none", track: "0px", bw: "1px", pad: "16px", gap: "24px", btn: "solid", rule: "single" },
  { key: "media", label: "Média classique", bg: "#fffdf8", fg: "#1a1a1a", mute: "#5a5a55", alt: "#f3efe4", accent: "#c8102e", onAccent: "#ffffff", line: "#1a1a1a", radius: "0px", btnRadius: "0px", shadow: "none", font: "font.source-sans-3", head: "font.libre-baskerville", weight: "700", caps: "uppercase", track: "1.4px", bw: "2px", pad: "16px", gap: "28px", btn: "solid", rule: "double" },
  { key: "mode", label: "Mode et boutique", bg: "#fdf2f0", fg: "#3a1f26", mute: "#7d5560", alt: "#f6dcd8", accent: "#3a1f26", onAccent: "#fdf2f0", line: "#ecc9c3", radius: "0px", btnRadius: "0px", shadow: "none", font: "font.jost", head: "font.cormorant-garamond", weight: "600", caps: "none", track: "0.4px", bw: "1px", pad: "18px", gap: "28px", btn: "solid", rule: "single" },
  { key: "hotel", label: "Hôtel de luxe", bg: "#1c1917", fg: "#f5efe3", mute: "#c9bfa9", alt: "#292524", accent: "#c9a24b", onAccent: "#1c1917", line: "#44403c", radius: "0px", btnRadius: "0px", shadow: "none", font: "font.lato", head: "font.cinzel", weight: "600", caps: "uppercase", track: "2px", bw: "1px", pad: "18px", gap: "32px", btn: "outline", rule: "none" },
  { key: "asso", label: "Association engagée", bg: "#fffbea", fg: "#3b2a08", mute: "#7a5c1c", alt: "#fdefc0", accent: "#c2410c", onAccent: "#ffffff", line: "#f0dc96", radius: "12px", btnRadius: "999px", shadow: "none", font: "font.quicksand", head: "font.quicksand", weight: "700", caps: "none", track: "0px", bw: "1px", pad: "16px", gap: "24px", btn: "solid", rule: "single" },
  { key: "immo", label: "Immobilier net", bg: "#ffffff", fg: "#1b2430", mute: "#52606f", alt: "#eaf4f7", accent: "#0e7490", onAccent: "#ffffff", line: "#d6e4ea", radius: "8px", btnRadius: "8px", shadow: "none", font: "font.manrope", head: "font.manrope", weight: "800", caps: "none", track: "0px", bw: "1px", pad: "16px", gap: "24px", btn: "solid", rule: "single" },
  { key: "sante", label: "Bien-être doux", bg: "#f2f7f1", fg: "#25402f", mute: "#5b7564", alt: "#e1eddf", accent: "#3f7a4c", onAccent: "#ffffff", line: "#cfe0cc", radius: "28px", btnRadius: "999px", shadow: "md", font: "font.nunito-sans", head: "font.lora", weight: "600", caps: "none", track: "0px", bw: "0px", pad: "18px", gap: "22px", btn: "solid", rule: "none" },
];


// Identités des 88 autres modèles : 22 palettes à couleurs FIXES (jamais la charte du site), regroupées par ambiance (claire, couleur, sombre, éditoriale, douce). Un modèle reçoit l'une des identités de l'ambiance
// de son ancienne identité (son suffixe de clé est conservé : aucun lien existant ne casse) ; la répartition est déterministe (voir MOODS). `ink` / `onInk` : rangée « encre » de l'identité.
const PRESET = {
  light: { radius: "10px", btnRadius: "8px", shadow: "none", weight: "700", caps: "none", track: "0px", bw: "1px", pad: "16px", gap: "24px", btn: "solid", rule: "single" },
  brand: { radius: "14px", btnRadius: "999px", shadow: "md", weight: "800", caps: "none", track: "0px", bw: "0px", pad: "18px", gap: "28px", btn: "solid", rule: "none" },
  dark: { radius: "12px", btnRadius: "10px", shadow: "lg", weight: "700", caps: "none", track: "0px", bw: "1px", pad: "16px", gap: "24px", btn: "outline", rule: "single" },
  edit: { radius: "0px", btnRadius: "0px", shadow: "none", weight: "700", caps: "uppercase", track: "1.5px", bw: "2px", pad: "20px", gap: "32px", btn: "solid", rule: "double" },
  soft: { radius: "28px", btnRadius: "999px", shadow: "md", weight: "600", caps: "none", track: "0px", bw: "0px", pad: "24px", gap: "20px", btn: "solid", rule: "none" },
};
// [clé, libellé, ambiance, fond, texte, texte secondaire, fond alterné, accent, texte d'accent, filet, police du texte, police des titres, encre]
const D = ([key, label, mood, bg, fg, mute, alt, accent, onAccent, line, font, head, ink]) => ({ key, label, bg, fg, mute, alt, accent, onAccent, line, ink: ink || "#111827", onInk: "#f8fafc", ...PRESET[mood], font, head, mood });
const IDENT2 = [
  D(["lumiere", "Lumière", "light", "#ffffff", "#0f172a", "#475569", "#f1f5f9", "#0f766e", "#ffffff", "#e2e8f0", "font.work-sans", "font.outfit"]),
  D(["terracotta", "Terre cuite", "light", "#fffaf5", "#3a2318", "#7a5a48", "#f6e9dc", "#b45309", "#ffffff", "#ead9c6", "font.karla", "font.dm-sans"]),
  D(["sauge", "Sauge", "light", "#f7faf7", "#1f3a2b", "#547060", "#e8f1ea", "#15803d", "#ffffff", "#d4e4d8", "font.mulish", "font.montserrat"]),
  D(["corail", "Corail", "light", "#fffbfa", "#3b1d1a", "#85504a", "#fdeeea", "#be123c", "#ffffff", "#f6d8d3", "font.poppins", "font.poppins"]),
  D(["grisindigo", "Gris indigo", "light", "#f8fafc", "#1e1b4b", "#4c4a80", "#ebeafc", "#4338ca", "#ffffff", "#dcdcf2", "font.ibm-plex-sans", "font.lexend"]),
  D(["cobalt", "Cobalt", "brand", "#1d4ed8", "#ffffff", "#e0e7ff", "#1e40af", "#fde047", "#1c1917", "#ffffff55", "font.rubik", "font.rubik"]),
  D(["emeraude", "Émeraude", "brand", "#047857", "#ffffff", "#d1fae5", "#065f46", "#fcd34d", "#1c1917", "#ffffff55", "font.figtree", "font.bricolage-grotesque"]),
  D(["prune", "Prune", "brand", "#6b21a8", "#ffffff", "#f3e8ff", "#581c87", "#f9a8d4", "#3b0764", "#ffffff55", "font.dm-sans", "font.inter-tight"]),
  D(["brique", "Brique", "brand", "#9a3412", "#ffffff", "#ffedd5", "#7c2d12", "#fed7aa", "#431407", "#ffffff55", "font.barlow", "font.barlow-condensed"]),
  D(["minuit", "Minuit violet", "dark", "#0f0b1e", "#f3f0ff", "#a79fd0", "#1a1433", "#a78bfa", "#1e1b4b", "#2c2552", "font.inter-tight", "font.lexend"]),
  D(["graphite", "Graphite et lime", "dark", "#18181b", "#fafafa", "#a1a1aa", "#27272a", "#a3e635", "#18181b", "#3f3f46", "font.archivo", "font.archivo"]),
  D(["foret", "Forêt de nuit", "dark", "#0c1f17", "#ecfdf5", "#86b5a0", "#14352a", "#34d399", "#052e1c", "#1f4a3a", "font.karla", "font.eb-garamond"]),
  D(["bordeaux", "Bordeaux de nuit", "dark", "#1f0d12", "#fdf2f4", "#c9959f", "#33141c", "#fb7185", "#2a0a12", "#4a1f2b", "font.pt-sans", "font.merriweather"]),
  D(["journal", "Journal", "edit", "#fffdf8", "#1a1a1a", "#5a5a55", "#f3efe4", "#1a1a1a", "#fffdf8", "#1a1a1a", "font.source-sans-3", "font.eb-garamond"]),
  D(["revue", "Revue verte", "edit", "#f4f1e8", "#1b3a2a", "#4f6a5a", "#e6e1d1", "#1b3a2a", "#f4f1e8", "#1b3a2a", "font.lora", "font.merriweather"]),
  D(["gazette", "Gazette", "edit", "#ffffff", "#111111", "#555555", "#f2f2f2", "#b91c1c", "#ffffff", "#111111", "font.pt-sans", "font.pt-serif"]),
  D(["atlas", "Atlas", "edit", "#f3ebdd", "#3d2b1f", "#6b5444", "#e8dcc7", "#3d2b1f", "#f3ebdd", "#3d2b1f", "font.noto-serif", "font.roboto-slab"]),
  D(["manuscrit", "Manuscrit", "edit", "#fbfaf7", "#22223b", "#4a4e69", "#efede6", "#22223b", "#fbfaf7", "#22223b", "font.source-sans-3", "font.libre-baskerville"]),
  D(["rose", "Rose poudré", "soft", "#fdf2f8", "#4a1d3a", "#8a5a77", "#fbe0ef", "#be185d", "#ffffff", "#f6cde3", "font.quicksand", "font.fredoka"]),
  D(["menthe", "Menthe", "soft", "#effaf5", "#134e3a", "#3f7a63", "#d9f2e7", "#0f766e", "#ffffff", "#c2e6d6", "font.nunito-sans", "font.comfortaa"]),
  D(["ciel", "Ciel", "soft", "#eff6ff", "#172554", "#475a85", "#dbeafe", "#1d4ed8", "#ffffff", "#c7dcfb", "font.mulish", "font.lexend"]),
  D(["lavande", "Lavande", "soft", "#f5f3ff", "#2e1065", "#5b4a8a", "#e9e4ff", "#6d28d9", "#ffffff", "#d8d0f7", "font.dm-sans", "font.bricolage-grotesque"]),
];
// Ambiance de chaque ancienne identité du site → identités qui la remplacent (répartition à tour de rôle, dans l'ordre du catalogue)
const MOODS = { clair: "light", marque: "brand", nuit: "dark", editorial: "edit", doux: "soft" };

module.exports = { IDENT, IDENT2, MOODS, PRESET, D };
