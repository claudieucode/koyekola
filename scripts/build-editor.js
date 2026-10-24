// Construit les éditeurs de texte riche à partir de src/editor/ :
//   - public/js/course-editor.js (formations) ← src/editor/course-editor.js
//   - public/js/blog-editor.js (articles du blog) ← src/editor/blog-editor.js
//   - public/js/theme-code-editor.js (Apparence → Éditeur de fichiers des thèmes, CodeMirror 6) ← src/editor/theme-code-editor.js
//   - public/js/seo-fun.js (Mode Fun facultatif de l'espace de travail SEO) ← src/editor/seo-fun.js
// À relancer après toute modification de la source : npm run build:editor
// Les fichiers construits sont livrés avec le projet : l'hébergeur n'a rien à compiler.
const path = require("path");
const esbuild = require("esbuild");

const root = path.join(__dirname, "..");
const build = (name) =>
  esbuild.build({
    entryPoints: [path.join(root, "src", "editor", `${name}.js`)],
    outfile: path.join(root, "public", "js", `${name}.js`),
    bundle: true,
    minify: true,
    format: "iife",
    target: ["es2020"],
    legalComments: "none",
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "info",
  });

Promise.all([build("course-editor"), build("blog-editor"), build("seo-fun"), build("theme-code-editor")]).catch(() => process.exit(1));
