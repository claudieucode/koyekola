const { startServer, loginInstructor } = require("../helpers");
(async () => {
  const srv = await startServer({ SITE_URL: "https://k.test", SMTP_HOST: "" });
  try { await loginInstructor(srv); console.log("LOGIN OK"); } catch (e) { console.log("ECHEC", e.message); console.log(String(srv.logs()).split("\n").filter((l) => /KOLAKISA|Error|at .*koyekola\/src/.test(l)).slice(0, 12).join("\n")); }
  finally { await srv.stop(); }
})();
