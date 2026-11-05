// Manuel — documentation d'un projet open source (développeur). Direction artistique : page de doc imprimée à l'écran. Fond blanc, monospace pour les titres,
// vert forêt unique ; sommaire latéral fixe et repliable, contenu au centre, « sur cette page » à droite (construit et suivi par le JS), recherche instantanée,
// blocs de code copiables, onglets npm / yarn / pnpm, journal des versions filtrable. Projet fictif : « Bornier ».
const { sec, esc } = require("../kit");

// ---------- code : colorisation minimale (classes c, k, s, n, o) ----------
const KW = "const|let|var|export|import|from|default|return|async|await|function|new|true|false|null|type|interface";
const RE_JS = new RegExp("(//[^\\n]*)|(&quot;(?:(?!&quot;)[^\\n])*&quot;|'[^'\\n]*'|`[^`]*`)|\\b(" + KW + ")\\b|\\b(\\d+(?:\\.\\d+)?)\\b", "g");
function hl(src, lang) {
  const t = esc(src);
  if (lang === "sh") return t.split("\n").map((l) => (/^\s*#/.test(l) ? `<span class="c">${l}</span>` : l.startsWith("$ ") ? `<span class="mn-cmd">${l.slice(2).replace(/(\s)(--?[a-z][\w-]*)/g, '$1<span class="o">$2</span>')}</span>` : l)).join("\n");
  if (lang === "out") return t.split("\n").map((l) => (/^\s*✓/.test(l) ? `<span class="k">${l}</span>` : /^\s*!/.test(l) ? `<span class="s">${l}</span>` : l)).join("\n");
  return t.replace(RE_JS, (m, c, s, k, n) => (c ? `<span class="c">${c}</span>` : s ? `<span class="s">${s}</span>` : k ? `<span class="k">${k}</span>` : `<span class="n">${n}</span>`));
}
const code = (file, lang, src, extra = "") => `<figure class="mn-code ${extra}" data-code><figcaption class="mn-bar"><span class="mn-file">${esc(file)}</span></figcaption><pre class="mn-pre"><code>${hl(src.trim(), lang)}</code></pre></figure>`;
// Bloc à onglets : tabs = [[étiquette, langage, source], …] ; sync = groupe d'onglets synchronisés dans la page
const tabbed = (label, tabs, sync, file) => `<figure class="mn-code" data-code${sync ? ` data-sync="${sync}"` : ""}><figcaption class="mn-bar">${file ? `<span class="mn-file">${esc(file)}</span>` : ""}<div class="mn-tabs" role="tablist" aria-label="${esc(label)}">${tabs.map(([n], i) => `<a href="#${esc(n.toLowerCase())}" role="tab" data-tab="${esc(n.toLowerCase())}" aria-selected="${i ? "false" : "true"}"${i ? "" : ' class="is-on"'}>${esc(n)}</a>`).join("")}</div></figcaption>${tabs.map(([n, lang, src], i) => `<pre class="mn-pre${i ? " mn-off" : ""}" data-panel="${esc(n.toLowerCase())}"><code>${hl(src.trim(), lang)}</code></pre>`).join("")}</figure>`;
const pm = (npm, yarn, pnpm, file) => tabbed("Gestionnaire de paquets", [["npm", "sh", "$ " + npm], ["yarn", "sh", "$ " + yarn], ["pnpm", "sh", "$ " + pnpm]], "pm", file);

// ---------- éléments de page ----------
const S = (slug, title, body, cls = "") => `<section class="mn-sec ${cls}" data-sec><h2 class="mn-h2" data-anchor="${slug}">${title}<a class="mn-hash" href="#${slug}" aria-label="Lien vers la section ${esc(title.replace(/<[^>]+>/g, ""))}">#</a></h2>${body}</section>`;
const note = (kind, title, body) => `<aside class="mn-note mn-note--${kind}" role="note"><p class="mn-note-t">${esc(title)}</p><p>${body}</p></aside>`;
const arrowR = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const mark = `<svg class="mn-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="7" fill="currentColor"/><path d="M11 9 6.5 16 11 23M21 9l4.5 7L21 23" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="16" r="2.4" fill="#fff"/></svg>`;
const ICON = {
  rocket: `<path d="M5 19c1-4 3-6 6-8m-4 9c-2 0-3-1-3-3m3-9 9-4 4 4-4 9-5-5zM14 6l4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  book: `<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
  braces: `<path d="M9 4C6 4 7 8 5 10c-1 1-1 1 0 2 2 2 1 6 4 6M15 4c3 0 2 4 4 6 1 1 1 1 0 2-2 2-1 6-4 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  list: `<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
};
const icon = (k) => `<svg class="mn-ico" viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;

const TREE = [
  ["Démarrer", [["Introduction", "/"], ["Démarrage rapide", "/demarrage"]]],
  ["Utiliser", [["Guide d'utilisation", "/guide"], ["Référence API", "/api"]]],
  ["Projet", [["Journal des versions", "/changelog"], ["Contribuer et contact", "/contact"], ["Rechercher", "/recherche"]]],
];
const tree = () => TREE.map(([g, items]) => `<details class="mn-grp" open><summary>${esc(g)}</summary><ul>${items.map(([l, u]) => `<li><a href="${u}">${esc(l)}</a></li>`).join("")}</ul></details>`).join("");

const chrome = () => sec(`<header class="mn-chrome pk-bleed">
  <aside class="mn-side" aria-label="Sommaire de la documentation">
    <a class="mn-brand" href="/" aria-label="Bornier, accueil de la documentation">${mark}<b>bornier</b><small>v2.4.0</small></a>
    <div class="mn-tree" role="navigation" aria-label="Sommaire">${tree()}</div>
    <p class="mn-side-foot">Licence MIT · documentation de démonstration</p>
  </aside>
  <div class="mn-top">
    <details class="mn-mob"><summary aria-label="Ouvrir ou fermer le sommaire"><span class="mn-burger" aria-hidden="true"></span><span class="mn-mob-l">Menu</span></summary>
      <div class="mn-mob-panel" role="navigation" aria-label="Sommaire mobile">${tree()}<p class="mn-side-foot">Licence MIT · documentation de démonstration</p></div></details>
    <a class="mn-brand mn-brand--top" href="/" aria-label="Bornier, accueil">${mark}<b>bornier</b></a>
    <div class="mn-search" data-search><a class="mn-search-fb" href="/recherche">Rechercher dans la documentation</a></div>
    <a class="mn-top-link" href="/contact">Contribuer</a>
  </div>
  <aside class="mn-toc" aria-label="Sur cette page"><p class="mn-toc-t">Sur cette page</p><ul data-toc></ul></aside>
</header>`);

const footer = (c) => sec(`<footer class="mn-foot pk-bleed"><div class="mn-w mn-foot-in"><p class="mn-foot-l"><b>bornier</b> · documentation de démonstration. Projet, versions et exemples fictifs ; aucune bibliothèque réelle n'est décrite ici.</p>
  <div class="mn-foot-links" role="navigation" aria-label="Pied de page">${c.menu.map((m) => `<a href="${esc(m.url)}">${esc(m.label)}</a>`).join("")}<a href="/recherche">Rechercher</a></div></div></footer>`);

const pagehead = (crumb, title, sub, meta) => sec(`<section class="mn-ph pk-bleed"><div class="mn-w"><div class="mn-crumb" role="navigation" aria-label="Fil d'Ariane"><a href="/">docs</a><i>/</i><span>${esc(crumb)}</span></div>
  <div class="mn-title" role="heading" aria-level="1" data-reveal>${title}</div><p class="mn-lead" data-reveal>${esc(sub)}</p>${meta ? `<p class="mn-meta" data-reveal>${meta.map((m) => `<span>${esc(m)}</span>`).join("")}</p>` : ""}</div></section>`);

const pager = (prev, next) => `<div class="mn-pager">${prev ? `<a class="mn-pg mn-pg--p" href="${prev[1]}"><small>Précédent</small><b>${esc(prev[0])}</b></a>` : "<span></span>"}${next ? `<a class="mn-pg mn-pg--n" href="${next[1]}"><small>Suivant</small><b>${esc(next[0])}</b></a>` : ""}</div>`;
const wrap = (inner, cls = "") => sec(`<div class="mn-w mn-article ${cls} pk-bleed">${inner}</div>`);

// ---------- ACCUEIL ----------
const home = (c) => [
  chrome(),
  sec(`<section class="mn-hero pk-bleed"><div class="mn-hero-in">
    <div class="mn-hero-copy"><p class="mn-badges" data-reveal><span class="mn-badge mn-badge--ok">stable</span><span class="mn-badge">v2.4.0</span><span class="mn-badge">licence MIT</span></p>
      <div class="mn-h1" role="heading" aria-level="1" data-reveal>Compilez vos modules, sans configuration à rallonge.</div>
      <p class="mn-lead" data-reveal>Bornier est un compilateur de modules open source pour vos bibliothèques et vos sites. Un fichier de configuration de douze lignes, des sorties propres, une documentation que l'on lit vraiment.</p>
      <div class="mn-actions" data-reveal><a class="mn-btn" href="/demarrage">Démarrage rapide ${arrowR}</a><a class="mn-btn mn-btn--ghost" href="/api">Référence API</a></div>
      <div class="mn-install" data-reveal><p class="mn-label">Installation</p>${pm("npm install --save-dev @bornier/cli", "yarn add --dev @bornier/cli", "pnpm add --save-dev @bornier/cli")}</div>
      <p class="mn-hint" data-reveal>Astuce : appuyez sur <kbd>/</kbd> pour chercher dans toute la documentation.</p></div>
    <div class="mn-hero-term" data-reveal>${code("terminal · exemple de sortie", "out", `  bornier build
  entrée        src/index.js
  résolution    214 modules
✓ transformé    214 modules
✓ regroupé      3 fichiers
✓ terminé       dist/ · 84 Ko · 1,2 s`, "mn-code--term")}
      <ul class="mn-chips" aria-label="Sorties produites"><li>dist/app.js</li><li>dist/vendor.js</li><li>dist/app.css</li></ul></div></div></section>`),
  sec(`<section class="mn-stats pk-bleed"><dl class="mn-stats-in"><div data-reveal><dt>Configuration requise</dt><dd><b data-count="0">0</b></dd></div><div data-reveal><dt>Formats de sortie</dt><dd><b data-count="3">3</b></dd></div><div data-reveal><dt>Plugins officiels</dt><dd><b data-count="12">12</b></dd></div><div data-reveal><dt>Lignes de config d'exemple</dt><dd><b data-count="12">12</b></dd></div></dl></section>`),
  wrap(`${S("parcourir", "Parcourir la documentation", `<p class="mn-p">Quatre entrées, selon ce que vous cherchez. Chaque page se lit seule et renvoie vers la suivante.</p>
    <div class="mn-cards">
      <a class="mn-card" href="/demarrage" data-reveal><span class="mn-path">docs/demarrage</span>${icon("rocket")}<h3>Démarrage rapide</h3><p>Installer, initialiser et lancer une première compilation en cinq minutes.</p><span class="mn-more">Commencer ${arrowR}</span></a>
      <a class="mn-card" href="/guide" data-reveal><span class="mn-path">docs/guide</span>${icon("book")}<h3>Guide d'utilisation</h3><p>Comprendre la résolution des modules, les formats de sortie, les plugins et le cache.</p><span class="mn-more">Lire le guide ${arrowR}</span></a>
      <a class="mn-card" href="/api" data-reveal><span class="mn-path">docs/api</span>${icon("braces")}<h3>Référence API</h3><p>Fonctions, options et hooks, avec leurs types, leurs valeurs par défaut et des exemples.</p><span class="mn-more">Ouvrir la référence ${arrowR}</span></a>
      <a class="mn-card" href="/changelog" data-reveal><span class="mn-path">docs/changelog</span>${icon("list")}<h3>Journal des versions</h3><p>Ajouts, correctifs et changements incompatibles, version par version.</p><span class="mn-more">Voir les versions ${arrowR}</span></a>
    </div>`)}
  ${S("configuration", "Une configuration lisible", `<p class="mn-p">Le fichier <code>bornier.config.js</code> décrit l'entrée, la sortie et les plugins. Tout le reste a une valeur par défaut raisonnable.</p>
    ${tabbed("Langage de l'exemple", [["JavaScript", "js", `import { defineConfig } from "@bornier/cli";

export default defineConfig({
  entry: "src/index.js",
  outDir: "dist",
  format: ["esm", "cjs"],
  sourcemap: true,
  plugins: [],
});`], ["TypeScript", "js", `import { defineConfig } from "@bornier/cli";
import type { Config } from "@bornier/cli";

const config: Config = {
  entry: "src/index.ts",
  outDir: "dist",
  format: ["esm", "cjs"],
  sourcemap: true,
};

export default defineConfig(config);`]], "lang", "bornier.config")}
    <p class="mn-p">Les options sont détaillées dans la <a href="/api">référence API</a>.</p>`)}
  ${S("fonctionnement", "Comment ça marche", `<div class="mn-flow" data-reveal><div class="mn-flow-col"><p class="mn-label">Entrée</p><ul><li>src/index.js</li></ul></div>
    <svg class="mn-flow-ar" viewBox="0 0 48 24" aria-hidden="true"><path d="M2 12h40m-8-8 8 8-8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div class="mn-flow-col"><p class="mn-label">Graphe de modules</p><ul><li>utils/dates.js</li><li>ui/bouton.js</li><li>ui/modale.js</li></ul></div>
    <svg class="mn-flow-ar" viewBox="0 0 48 24" aria-hidden="true"><path d="M2 12h40m-8-8 8 8-8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div class="mn-flow-col"><p class="mn-label">Sorties</p><ul><li>dist/app.js</li><li>dist/vendor.js</li><li>dist/app.css</li></ul></div></div>
    <p class="mn-p">Bornier lit votre point d'entrée, construit le graphe des modules importés, applique les transformations puis regroupe le résultat. Le détail de chaque étape est dans le <a href="/guide#concepts">guide</a>.</p>`)}
  ${S("principes", "Ce que le projet défend", `<dl class="mn-feat">
    <div data-reveal><dt><span>01</span>Peu de réglages</dt><dd>Un projet standard se compile sans aucune option. On ajoute de la configuration seulement quand on en a besoin.</dd></div>
    <div data-reveal><dt><span>02</span>Sorties lisibles</dt><dd>Les fichiers produits restent compréhensibles et accompagnés de cartes sources pour le débogage.</dd></div>
    <div data-reveal><dt><span>03</span>Erreurs expliquées</dt><dd>Chaque message d'erreur indique le fichier, la ligne et une piste de correction.</dd></div>
    <div data-reveal><dt><span>04</span>Plugins simples</dt><dd>Un plugin est une fonction qui reçoit un hook : pas de cérémonie, pas de classe à hériter.</dd></div>
    <div data-reveal><dt><span>05</span>Cache fiable</dt><dd>Le cache disque ne recompile que les modules modifiés et s'invalide tout seul quand la configuration change.</dd></div>
    <div data-reveal><dt><span>06</span>Documentation vivante</dt><dd>Chaque version publiée met à jour la documentation et le journal des changements.</dd></div></dl>`)}
  ${S("versions", "Dernières versions", `<ul class="mn-rels">
    <li data-reveal><a href="/changelog"><b>2.4.0</b><time>12 octobre 2026</time><span>Cache partagé entre les branches et nouvelle option <code>sourcemap</code>.</span></a></li>
    <li data-reveal><a href="/changelog"><b>2.3.1</b><time>29 septembre 2026</time><span>Correction de la résolution des chemins sous Windows.</span></a></li>
    <li data-reveal><a href="/changelog"><b>2.3.0</b><time>3 septembre 2026</time><span>Hook <code>onBuildEnd</code> et sortie <code>iife</code>.</span></a></li></ul>
    <p class="mn-p"><a class="mn-link" href="/changelog">Tout le journal des versions ${arrowR}</a></p>`)}
  ${S("contribuer", "Contribuer", `<div class="mn-cta" data-reveal><p class="mn-p">Une faute dans la documentation, un exemple qui manque, un bogue reproductible : tout est bienvenu. Le plus simple est de nous écrire avec le contexte, la version utilisée et les étapes pour reproduire.</p><a class="mn-btn" href="/contact">Nous écrire ${arrowR}</a></div>`)}`),
  footer(c),
];

// ---------- DÉMARRAGE RAPIDE ----------
const demarrage = (c) => [
  chrome(),
  pagehead("démarrage", "Démarrage rapide", "De zéro à une première compilation en cinq étapes. Comptez cinq minutes.", ["Lecture : 5 min", "Testé avec la version 2.4", "Niveau : débutant"]),
  wrap(`${S("prerequis", "Prérequis", `<p class="mn-p">Bornier fonctionne sur les trois grands systèmes. Vérifiez ces versions avant de commencer.</p>
    <table class="mn-tbl"><caption class="mn-sr">Versions minimales requises</caption><thead><tr><th>Outil</th><th>Version minimale</th><th>Pour vérifier</th></tr></thead><tbody>
    <tr><td data-label="Outil"><code>node</code></td><td data-label="Version minimale">18.0</td><td data-label="Pour vérifier"><code>node --version</code></td></tr>
    <tr><td data-label="Outil">Gestionnaire de paquets</td><td data-label="Version minimale">npm 9, yarn 1.22 ou pnpm 8</td><td data-label="Pour vérifier"><code>npm --version</code></td></tr>
    <tr><td data-label="Outil">Système</td><td data-label="Version minimale">macOS, Linux ou Windows 10</td><td data-label="Pour vérifier">–</td></tr></tbody></table>`)}
  ${S("installation", "Installation", `<p class="mn-p">Ajoutez Bornier à votre projet comme dépendance de développement. Choisissez votre gestionnaire : le choix est retenu sur toutes les pages de la documentation.</p>
    ${pm("npm install --save-dev @bornier/cli", "yarn add --dev @bornier/cli", "pnpm add --save-dev @bornier/cli")}
    ${note("astuce", "Astuce", "Pour un essai rapide sans rien installer, lancez <code>npx @bornier/cli init</code> dans un dossier vide.")}`)}
  ${S("initialisation", "Initialisation", `<p class="mn-p">La commande <code>init</code> crée un fichier de configuration et un dossier <code>src</code> avec un module d'exemple.</p>
    ${pm("npx bornier init", "yarn bornier init", "pnpm exec bornier init")}
    ${code("sortie attendue", "out", `✓ bornier.config.js créé
✓ src/index.js créé
✓ scripts ajoutés à package.json`)}
    <p class="mn-p">Le fichier généré ressemble à ceci. Vous pouvez le garder tel quel pour la suite.</p>
    ${code("bornier.config.js", "js", `import { defineConfig } from "@bornier/cli";

export default defineConfig({
  entry: "src/index.js",
  outDir: "dist",
});`)}`)}
  ${S("premiere-compilation", "Première compilation", `<p class="mn-p">Lancez la compilation. Le dossier <code>dist</code> est créé à la racine du projet.</p>
    ${pm("npx bornier build", "yarn bornier build", "pnpm exec bornier build")}
    ${code("sortie attendue", "out", `✓ transformé    1 module
✓ regroupé      1 fichier
✓ terminé       dist/ · 2 Ko · 0,2 s`)}
    ${note("info", "À savoir", "Le dossier <code>dist</code> est recréé à chaque compilation. Ne placez aucun fichier à la main dedans.")}`)}
  ${S("mode-developpement", "Mode développement", `<p class="mn-p">Pour recompiler automatiquement à chaque enregistrement, utilisez le mode surveillance. Seuls les modules modifiés sont retraités.</p>
    ${pm("npx bornier watch", "yarn bornier watch", "pnpm exec bornier watch")}
    <p class="mn-p">Vous pouvez aussi déclarer des scripts dans votre <code>package.json</code>.</p>
    ${code("package.json", "js", `{
  "scripts": {
    "build": "bornier build",
    "dev": "bornier watch"
  }
}`)}`)}
  ${S("depannage", "Dépannage", `<div class="mn-faq">
    <details><summary>« Cannot find module » au lancement</summary><p>Vérifiez que l'installation s'est terminée sans erreur, puis relancez la commande depuis la racine du projet, là où se trouve <code>package.json</code>.</p></details>
    <details><summary>Le dossier dist reste vide</summary><p>La valeur de <code>entry</code> ne pointe vers aucun fichier. Corrigez le chemin dans <code>bornier.config.js</code> et relancez la compilation.</p></details>
    <details><summary>Le mode surveillance ne détecte pas mes changements</summary><p>Sur certains disques réseau, les événements de fichiers ne sont pas transmis. Ajoutez l'option <code>polling: true</code> à la configuration.</p></details></div>
    ${pager(["Introduction", "/"], ["Guide d'utilisation", "/guide"])}`)}`),
  footer(c),
];

// ---------- RÉFÉRENCE API ----------
const param = (n, t, d, x) => `<tr><td data-label="Nom"><code>${n}</code></td><td data-label="Type"><code>${t}</code></td><td data-label="Défaut">${d}</td><td data-label="Description">${x}</td></tr>`;
const ptable = (rows, cap) => `<table class="mn-tbl"><caption class="mn-sr">${esc(cap)}</caption><thead><tr><th>Nom</th><th>Type</th><th>Défaut</th><th>Description</th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
const api = (c) => [
  chrome(),
  pagehead("api", "Référence API", "Toutes les fonctions, options et hooks de Bornier 2.4, avec leurs types et des exemples.", ["Version 2.4.0", "Types TypeScript inclus"]),
  sec(`<div class="mn-w mn-bar2 pk-bleed"><p class="mn-label">Filtrer par type</p><div class="mn-chipbar" role="group" aria-label="Filtrer la référence par type"><a href="#tout" class="is-on" data-filter="all" aria-pressed="true">Tout</a><a href="#fonctions" data-filter="fonction" aria-pressed="false">Fonctions</a><a href="#options" data-filter="option" aria-pressed="false">Options</a><a href="#hooks" data-filter="hook" aria-pressed="false">Hooks</a></div></div>`),
  wrap(`<article class="mn-sec mn-api" data-sec data-kind="fonction"><h2 class="mn-h2" data-anchor="build"><span class="mn-k">fonction</span>build(options)<a class="mn-hash" href="#build" aria-label="Lien vers build">#</a></h2>
    <p class="mn-p">Compile le projet une fois et écrit le résultat dans <code>outDir</code>. Renvoie une promesse résolue avec le rapport de compilation.</p>
    ${ptable([param("options", "Config", "{}", "Configuration, fusionnée avec <code>bornier.config.js</code>."), param("options.cwd", "string", "<code>process.cwd()</code>", "Dossier racine du projet.")], "Paramètres de build")}
    ${code("exemple.js", "js", `import { build } from "@bornier/cli";

const rapport = await build({ entry: "src/index.js" });
console.log(rapport.fichiers.length, "fichiers écrits");`)}</article>
    <article class="mn-sec mn-api" data-sec data-kind="fonction"><h2 class="mn-h2" data-anchor="watch"><span class="mn-k">fonction</span>watch(options)<a class="mn-hash" href="#watch" aria-label="Lien vers watch">#</a></h2>
    <p class="mn-p">Compile puis surveille les fichiers. Renvoie un objet avec une méthode <code>close()</code> pour arrêter la surveillance.</p>
    ${ptable([param("options", "Config", "{}", "Mêmes options que <code>build</code>."), param("options.polling", "boolean", "<code>false</code>", "Surveille par interrogation régulière (disques réseau).")], "Paramètres de watch")}
    ${note("attention", "Attention", "Pensez à appeler <code>close()</code> dans vos tests, sinon le processus ne se termine pas.")}</article>
    <article class="mn-sec mn-api" data-sec data-kind="fonction"><h2 class="mn-h2" data-anchor="define-config"><span class="mn-k">fonction</span>defineConfig(config)<a class="mn-hash" href="#define-config" aria-label="Lien vers defineConfig">#</a></h2>
    <p class="mn-p">Renvoie sa configuration inchangée. Elle sert uniquement à obtenir l'autocomplétion et la vérification des types dans l'éditeur.</p>
    ${code("bornier.config.js", "js", `import { defineConfig } from "@bornier/cli";

export default defineConfig({ entry: "src/index.js" });`)}</article>
    <article class="mn-sec mn-api" data-sec data-kind="option"><h2 class="mn-h2" data-anchor="option-entry"><span class="mn-k">option</span>entry<a class="mn-hash" href="#option-entry" aria-label="Lien vers entry">#</a></h2>
    <p class="mn-p">Point d'entrée du graphe de modules. Accepte un chemin, une liste de chemins ou un objet nom → chemin.</p>
    ${ptable([param("entry", "string | string[] | Record&lt;string, string&gt;", "<code>\"src/index.js\"</code>", "Un chemin par fichier produit.")], "Option entry")}</article>
    <article class="mn-sec mn-api" data-sec data-kind="option"><h2 class="mn-h2" data-anchor="option-out-dir"><span class="mn-k">option</span>outDir<a class="mn-hash" href="#option-out-dir" aria-label="Lien vers outDir">#</a></h2>
    <p class="mn-p">Dossier de sortie, recréé à chaque compilation.</p>
    ${ptable([param("outDir", "string", "<code>\"dist\"</code>", "Chemin relatif à <code>cwd</code>.")], "Option outDir")}</article>
    <article class="mn-sec mn-api" data-sec data-kind="option"><h2 class="mn-h2" data-anchor="option-format"><span class="mn-k">option</span>format<a class="mn-hash" href="#option-format" aria-label="Lien vers format">#</a></h2>
    <p class="mn-p">Formats de sortie à produire. Voir le <a href="/guide#formats">comparatif des formats</a>.</p>
    ${ptable([param("format", "(\"esm\" | \"cjs\" | \"iife\")[]", "<code>[\"esm\"]</code>", "Un fichier par format demandé.")], "Option format")}</article>
    <article class="mn-sec mn-api" data-sec data-kind="hook"><h2 class="mn-h2" data-anchor="hook-transform"><span class="mn-k">hook</span>transform(code, chemin)<a class="mn-hash" href="#hook-transform" aria-label="Lien vers transform">#</a></h2>
    <p class="mn-p">Appelé pour chaque module avant le regroupement. Renvoie le nouveau code ou <code>null</code> pour ne rien changer.</p>
    ${code("plugin-majuscules.js", "js", `export default function plugin() {
  return {
    name: "exemple",
    transform(code, chemin) {
      if (!chemin.endsWith(".txt")) return null;
      return "export default " + JSON.stringify(code);
    },
  };
}`)}</article>
    <article class="mn-sec mn-api" data-sec data-kind="hook"><h2 class="mn-h2" data-anchor="hook-build-end"><span class="mn-k">hook</span>onBuildEnd(rapport)<a class="mn-hash" href="#hook-build-end" aria-label="Lien vers onBuildEnd">#</a></h2>
    <p class="mn-p">Appelé une fois que tous les fichiers sont écrits. Utile pour envoyer un rapport ou lancer un contrôle de taille.</p>
    ${ptable([param("rapport.fichiers", "Fichier[]", "–", "Nom et taille de chaque sortie."), param("rapport.duree", "number", "–", "Durée en millisecondes.")], "Paramètres de onBuildEnd")}
    ${pager(["Guide d'utilisation", "/guide"], ["Journal des versions", "/changelog"])}</article>`),
  footer(c),
];

// ---------- GUIDE ----------
const guide = (c) => [
  chrome(),
  pagehead("guide", "Guide d'utilisation", "Les notions à connaître pour travailler sereinement avec Bornier, de la résolution des modules au cache.", ["Lecture : 12 min", "Niveau : intermédiaire"]),
  wrap(`${S("concepts", "Les étapes d'une compilation", `<p class="mn-p">Une compilation suit toujours le même parcours. Comprendre ces cinq étapes aide à situer un problème.</p>
    <ol class="mn-pipe" data-reveal><li><b>1</b><span>Entrée</span><small>lecture de <code>entry</code></small></li><li><b>2</b><span>Résolution</span><small>chemins et dépendances</small></li><li><b>3</b><span>Transformation</span><small>hook <code>transform</code></small></li><li><b>4</b><span>Regroupement</span><small>fusion des modules</small></li><li><b>5</b><span>Sortie</span><small>écriture dans <code>outDir</code></small></li></ol>
    ${note("info", "À savoir", "Les étapes 2 et 3 sont mises en cache : une seconde compilation ne retraite que les fichiers modifiés.")}`)}
  ${S("resolution", "Résolution des modules", `<p class="mn-p">Quand un module en importe un autre, Bornier cherche le fichier dans cet ordre :</p>
    <ol class="mn-ol"><li>le chemin exact, s'il commence par <code>./</code> ou <code>../</code> ;</li><li>le même chemin avec les extensions <code>.js</code>, <code>.mjs</code> puis <code>.json</code> ;</li><li>le dossier <code>node_modules</code> le plus proche, en lisant le champ <code>exports</code> du paquet.</li></ol>
    ${code("src/index.js", "js", `import { formater } from "./utils/dates"; // ./utils/dates.js
import json from "./donnees.json";         // chargé tel quel
import { ref } from "un-paquet";           // node_modules/un-paquet`)}
    <blockquote class="mn-quote"><p>Si deux fichiers portent le même nom avec des extensions différentes, le premier de la liste ci-dessus l'emporte.</p></blockquote>`)}
  ${S("formats", "Formats de sortie", `<p class="mn-p">Le choix du format dépend de la manière dont votre code sera chargé.</p>
    <table class="mn-tbl"><caption class="mn-sr">Comparatif des formats de sortie</caption><thead><tr><th>Format</th><th>Chargement</th><th>À choisir pour</th></tr></thead><tbody>
    <tr><td data-label="Format"><code>esm</code></td><td data-label="Chargement"><code>import</code> natif</td><td data-label="À choisir pour">Bibliothèques modernes et sites ; permet l'élagage du code inutile.</td></tr>
    <tr><td data-label="Format"><code>cjs</code></td><td data-label="Chargement"><code>require()</code></td><td data-label="À choisir pour">Outils Node.js plus anciens et tests.</td></tr>
    <tr><td data-label="Format"><code>iife</code></td><td data-label="Chargement">Balise <code>&lt;script&gt;</code></td><td data-label="À choisir pour">Pages simples sans outil de build côté lecteur.</td></tr></tbody></table>
    ${code("bornier.config.js", "js", `export default defineConfig({
  entry: "src/index.js",
  format: ["esm", "cjs", "iife"],
});`)}`)}
  ${S("plugins", "Plugins", `<p class="mn-p">Un plugin est une fonction qui renvoie un objet de hooks. Déclarez-le dans la liste <code>plugins</code> : l'ordre est celui de l'exécution.</p>
    ${code("bornier.config.js", "js", `import texte from "./plugin-texte.js";

export default defineConfig({
  entry: "src/index.js",
  plugins: [texte()],
});`)}
    ${note("attention", "Attention", "Un plugin qui modifie le même module qu'un autre peut produire un résultat dépendant de l'ordre. Gardez la liste courte et testez après chaque ajout.")}`)}
  ${S("cache", "Cache", `<p class="mn-p">Le cache est stocké dans <code>node_modules/.cache/bornier</code>. Il est invalidé quand la version de Bornier, la configuration ou le contenu d'un fichier change.</p>
    ${pm("npx bornier build --no-cache", "yarn bornier build --no-cache", "pnpm exec bornier build --no-cache")}
    <p class="mn-p">L'option <code>--no-cache</code> force une compilation complète ; utile pour diagnostiquer un résultat étrange.</p>`)}
  ${S("bonnes-pratiques", "Bonnes pratiques et questions fréquentes", `<div class="mn-faq">
    <details><summary>Faut-il versionner le dossier dist ?</summary><p>En général non : ajoutez-le à <code>.gitignore</code> et laissez votre intégration continue le produire.</p></details>
    <details><summary>Peut-on utiliser plusieurs points d'entrée ?</summary><p>Oui, passez un objet à <code>entry</code>. Chaque clé donne un fichier de sortie du même nom.</p></details>
    <details><summary>Comment réduire la taille des sorties ?</summary><p>Préférez le format <code>esm</code>, importez uniquement ce dont vous avez besoin et vérifiez le rapport avec le hook <code>onBuildEnd</code>.</p></details></div>
    ${pager(["Démarrage rapide", "/demarrage"], ["Référence API", "/api"])}`)}`),
  footer(c),
];

// ---------- JOURNAL DES VERSIONS ----------
const li = (k, t) => `<li data-kind="${k}"><span class="mn-tag mn-tag--${k}">${{ ajout: "ajout", correctif: "correctif", rupture: "rupture" }[k]}</span><span>${t}</span></li>`;
const rel = (v, date, label, items) => `<article class="mn-sec mn-rel" data-sec><h2 class="mn-h2" data-anchor="v${v.replace(/\./g, "-")}">${v}<time class="mn-date">${date}</time>${label ? `<span class="mn-badge mn-badge--ok">${label}</span>` : ""}<a class="mn-hash" href="#v${v.replace(/\./g, "-")}" aria-label="Lien vers la version ${v}">#</a></h2><ul class="mn-chg">${items.map(([k, t]) => li(k, t)).join("")}</ul></article>`;
const changelog = (c) => [
  chrome(),
  pagehead("changelog", "Journal des versions", "Toutes les évolutions de Bornier, de la plus récente à la plus ancienne. Les versions suivent la gestion sémantique.", ["Dernière version : 2.4.0"]),
  sec(`<div class="mn-w mn-bar2 pk-bleed"><p class="mn-label">Afficher</p><div class="mn-chipbar" role="group" aria-label="Filtrer le journal par type de changement"><a href="#tout" class="is-on" data-filter="all" aria-pressed="true">Tout</a><a href="#ajouts" data-filter="ajout" aria-pressed="false">Ajouts</a><a href="#correctifs" data-filter="correctif" aria-pressed="false">Correctifs</a><a href="#ruptures" data-filter="rupture" aria-pressed="false">Changements incompatibles</a></div></div>`),
  wrap(`${rel("2.4.0", "12 octobre 2026", "dernière", [["ajout", "Cache partagé entre les branches d'un même dépôt."], ["ajout", "Nouvelle option <code>sourcemap</code> pour produire des cartes sources."], ["correctif", "Le mode <code>watch</code> ne se bloque plus après un renommage de dossier."]])}
  ${rel("2.3.1", "29 septembre 2026", "", [["correctif", "Résolution des chemins corrigée sous Windows (séparateurs mixtes)."], ["correctif", "Message d'erreur plus clair quand <code>entry</code> est introuvable."]])}
  ${rel("2.3.0", "3 septembre 2026", "", [["ajout", "Hook <code>onBuildEnd</code> avec le rapport de compilation."], ["ajout", "Format de sortie <code>iife</code>."], ["correctif", "Les JSON volumineux ne ralentissent plus la résolution."]])}
  ${rel("2.2.0", "18 juin 2026", "", [["ajout", "Option <code>polling</code> pour la surveillance sur disque réseau."], ["correctif", "Cache invalidé correctement quand un plugin est retiré."]])}
  ${rel("2.1.0", "2 avril 2026", "", [["ajout", "Commande <code>init</code> pour créer un projet de départ."], ["correctif", "Types TypeScript de <code>defineConfig</code> complétés."]])}
  ${rel("2.0.0", "10 février 2026", "majeure", [["rupture", "Node.js 18 devient la version minimale."], ["rupture", "L'option <code>output</code> est renommée <code>outDir</code>."], ["rupture", "Le format par défaut passe de <code>cjs</code> à <code>esm</code>."], ["ajout", "Nouveau moteur de cache sur disque."]])}
  ${note("info", "Migrer vers la 2.0", "Renommez <code>output</code> en <code>outDir</code> dans votre configuration et ajoutez <code>format: [\"cjs\"]</code> si vous aviez besoin de l'ancien comportement.")}`),
  footer(c),
];

// ---------- CONTACT / RECHERCHE / 404 ----------
const contact = (c) => [chrome(), pagehead("contact", "Contribuer et contact", "Une question, un bogue, une idée : écrivez-nous avec le plus de contexte possible.", ["Réponse sous quelques jours"]),
  sec(`<section class="mn-ways pk-bleed"><div class="mn-w"><div class="mn-ways-in">
    <div class="mn-way" data-reveal><span class="mn-path">signaler</span><h2 class="mn-h3">Signaler un bogue</h2><p>Indiquez la version de Bornier, de Node.js et votre système, puis les étapes pour reproduire le problème.</p></div>
    <div class="mn-way" data-reveal><span class="mn-path">proposer</span><h2 class="mn-h3">Proposer une idée</h2><p>Décrivez le besoin avant la solution : cela aide à trouver la plus simple.</p></div>
    <div class="mn-way" data-reveal><span class="mn-path">documenter</span><h2 class="mn-h3">Améliorer la documentation</h2><p>Une phrase peu claire, un exemple manquant : signalez la page concernée.</p></div></div></div></section>`),
  { type: "form", heading: "Écrire à l'équipe", intro: "Ce formulaire nous parvient directement. Merci d'indiquer la version de Bornier concernée." }, footer(c)];
const recherche = (c) => [chrome(), pagehead("recherche", "Rechercher", "Tapez un mot de la documentation : une option, une commande, un message d'erreur.", ["Astuce : touche / depuis n'importe quelle page"]),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher dans la documentation…" } }] },
  sec(`<section class="mn-sugg pk-bleed"><div class="mn-w"><p class="mn-label">Recherches fréquentes</p><ul class="mn-chips"><li><a href="/demarrage">installation</a></li><li><a href="/api">outDir</a></li><li><a href="/guide">formats de sortie</a></li><li><a href="/guide">cache</a></li><li><a href="/changelog">migration 2.0</a></li></ul></div></section>`), footer(c)];
const introuvable = (c) => [chrome(), sec(`<section class="mn-404 pk-bleed"><div class="mn-w"><p class="mn-crumb"><span>erreur</span></p><div class="mn-title" role="heading" aria-level="1">404 · page introuvable</div>
  ${code("terminal", "out", `! Error: cannot resolve "./cette-page"
    importée depuis la documentation
    aucune page ne porte ce nom`, "mn-code--term")}
  <p class="mn-lead">Cette page n'existe pas ou a changé d'adresse. Voici où continuer :</p>
  <ul class="mn-chips"><li><a href="/">Introduction</a></li><li><a href="/demarrage">Démarrage rapide</a></li><li><a href="/api">Référence API</a></li><li><a href="/recherche">Rechercher</a></li></ul></div></section>`), footer(c)];

module.exports = {
  key: "manuel", name: "Manuel", version: "2.0.0", category: "tech", tags: ["technique", "minimaliste", "moderne"], siteType: "Documentation développeur et projet open source", featured: true,
  concept: "Une page de documentation lisible avant tout : sommaire latéral fixe, contenu au centre, « sur cette page » à droite, recherche instantanée et blocs de code copiables.",
  description: "Documentation d'un projet open source : fond blanc, titres monospace, vert forêt, sommaire repliable, recherche instantanée qui filtre et surligne, onglets npm / yarn / pnpm, code copiable, journal des versions filtrable.",
  brand: "Bornier", modules: ["formulaires", "recherche"],
  dna: { header: "lateral-gauche-fixe-a-sommaire-repliable", hero: "page-de-doc-avec-installation-par-onglets-et-terminal", grid: "documentation-trois-colonnes-arbre-contenu-sommaire", motion: "sommaire-qui-suit-le-defilement-et-filtre-instantane", shapes: "filets-fins-blocs-de-code-et-pastilles-de-syntaxe", rhythm: "reference-technique-sections-ancrees", signature: "documentation-avec-recherche-instantanee-et-code-copiable" },
  tokens: {
    colors: { primary: "#14724a", secondary: "#15201b", accent: "#0d5538", background: "#ffffff", surface: "#f6f8f7", text: "#15201b", muted: "#55625b", success: "#14724a", warning: "#8a5a00", error: "#b42318" },
    fonts: { heading: "font.geist-mono", body: "font.red-hat-text", button: "font.geist-mono", link: "font.red-hat-text" },
    radius: { sm: 4, md: 6, lg: 8, button: 6, field: 6, card: 8 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#dde5e0" },
    type: { h1: { size: 44, weight: 700, lineHeight: 1.1 }, h2: { size: 26, weight: 600, lineHeight: 1.25 } },
  },
  options: [
    { key: "accent", label: "Couleur d'accent", type: "color", default: "#14724a" },
    { key: "code", label: "Thème des blocs de code", type: "choice", default: "dark", choices: [["dark", "Sombre"], ["light", "Clair"]] },
    { key: "density", label: "Densité de lecture", type: "choice", default: "normal", choices: [["normal", "Confortable"], ["compact", "Compacte"]] },
    { key: "side", label: "Largeur du sommaire (px)", type: "range", default: 272, min: 240, max: 320, step: 8 },
    { key: "hash", label: "Liens # sur les titres", type: "choice", default: "on", choices: [["on", "Affichés"], ["off", "Masqués"]] },
  ],
  menu: [["Accueil", "/"], ["Démarrage rapide", "/demarrage"], ["Référence API", "/api"], ["Guide", "/guide"], ["Journal des versions", "/changelog"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "demarrage", name: "Démarrage rapide", render: demarrage }, { key: "api", name: "Référence API", render: api },
    { key: "guide", name: "Guide", render: guide }, { key: "changelog", name: "Journal des versions", render: changelog }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
