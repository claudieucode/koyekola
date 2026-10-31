// Programme 22.1 — Lance tout le laboratoire : un lot « vitrines » (12 sites, un serveur) puis une boutique par serveur, puis la fusion et la notation.
//   NODE_PATH=…/KOYEKOLA-blocs-gutenberg/node_modules node scripts/quality-lab-navigateur/run-all.js [--out dossier]
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { SCENARIOS } = require("./scenarios");
const extra = process.argv.slice(2);
const run = (args) => { const r = spawnSync(process.execPath, [path.join(__dirname, args[0]), ...args.slice(1), ...extra], { stdio: "inherit", env: { ...process.env, TEST_START_TIMEOUT_MS: process.env.TEST_START_TIMEOUT_MS || "240000" } }); if (r.status !== 0) process.exit(r.status || 1); };
run(["run.js", "--only", SCENARIOS.filter((s) => !s.shop).map((s) => s.id).join(","), "--part", "vitrines"]);
for (const s of SCENARIOS.filter((x) => x.shop)) run(["run.js", "--only", s.id, "--part", s.id]);
run(["merge.js"]);
