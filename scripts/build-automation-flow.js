// Construit public/js/automation-flow.js (éditeur visuel des scénarios d'automatisation, canevas Drawflow)
// à partir de src/editor/automation-flow.js. À relancer après toute modification de la source :
// npm run build:automation-flow
// Le fichier construit est livré avec le projet : l'hébergeur n'a rien à compiler.
const path = require("path");
const esbuild = require("esbuild");

const root = path.join(__dirname, "..");
esbuild
  .build({
    entryPoints: [path.join(root, "src", "editor", "automation-flow.js")],
    outfile: path.join(root, "public", "js", "automation-flow.js"),
    bundle: true,
    minify: true,
    format: "iife",
    target: ["es2020"],
    legalComments: "none",
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "info",
  })
  .catch(() => process.exit(1));
