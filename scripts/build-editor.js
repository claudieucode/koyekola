// Construit public/js/course-editor.js (éditeur de texte riche) à partir de src/editor/course-editor.js.
// À relancer après toute modification de la source : npm run build:editor
// Le fichier construit est livré avec le projet : l'hébergeur n'a rien à compiler.
const path = require("path");
const esbuild = require("esbuild");

const root = path.join(__dirname, "..");
esbuild
  .build({
    entryPoints: [path.join(root, "src", "editor", "course-editor.js")],
    outfile: path.join(root, "public", "js", "course-editor.js"),
    bundle: true,
    minify: true,
    format: "iife",
    target: ["es2020"],
    legalComments: "none",
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "info",
  })
  .catch(() => process.exit(1));
