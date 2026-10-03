// KOLAKISA — Mode Fun de l'espace de travail SEO (couche ludique FACULTATIVE, chargée seulement si activée).
// Règles : lit les vraies données via window.KolakisaSEO (copies, lecture seule) ; ne modifie jamais le contenu, la note,
// les réglages ni les données SEO ; seule écriture : sa propre progression (points, badges). Messages rares, fermables,
// jamais pendant la frappe, jamais deux fois le même, aucun son, aucune fenêtre obligatoire. Si ce fichier plante ou
// disparaît, l'éditeur continue de fonctionner normalement.
(() => {
  const B = window.KolakisaSEO;
  if (!B || window.__kolakisaFun) return;
  window.__kolakisaFun = true;
  try { start(); } catch (e) { console.warn("[Mode Fun] désactivé suite à une erreur :", e); }

  function start() {
    let prefs = B.prefs() || {};
    let active = Boolean(prefs.enabled);
    const LIMITS = { professionnel: { cooldown: 300000, max: 3 }, fun: { cooldown: 120000, max: 8 }, chaotique: { cooldown: 45000, max: 15 } };
    const limits = () => LIMITS[prefs.personality] || LIMITS.professionnel;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastToast = 0;
    let shownCount = 0;
    const seen = new Set();
    let lastTyping = 0;
    let prev = null;
    let lastXpAt = 0;
    const tone = (pro, fun, chaos) => (prefs.personality === "chaotique" ? chaos || fun : prefs.personality === "fun" ? fun : pro);

    // ---------- Styles (autonomes) ----------
    const style = document.createElement("style");
    style.textContent = `
      .kfun { position: fixed; left: 92px; bottom: 16px; z-index: 55; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; pointer-events: none; max-width: min(360px, calc(100vw - 32px)); font-family: inherit; }
      .kfun[hidden] { display: none; }
      .kfun > * { pointer-events: auto; }
      .kfun-toast { position: relative; padding: 10px 34px 10px 12px; border-radius: 12px; background: #0b2a40; color: #fff; font-size: 13px; line-height: 1.45; box-shadow: 0 10px 28px rgba(11,42,64,.28); }
      .kfun-toast strong { display: block; margin-bottom: 2px; }
      .kfun-toast small { display: block; opacity: .85; }
      .kfun-toast .kfun-x { position: absolute; top: 4px; right: 6px; width: 24px; height: 24px; border: 0; border-radius: 6px; background: none; color: #fff; font-size: 16px; cursor: pointer; }
      .kfun-toast .kfun-act { margin-top: 6px; padding: 4px 10px; border: 1px solid rgba(255,255,255,.5); border-radius: 999px; background: none; color: #fff; font: inherit; font-size: 12px; cursor: pointer; }
      .kfun-bar { display: flex; gap: 6px; align-items: center; }
      .kfun-boss, .kfun-robot { border: 1px solid rgba(11,42,64,.15); border-radius: 999px; background: #fff; color: #0b2a40; font: inherit; font-size: 12px; font-weight: 600; padding: 5px 10px; cursor: pointer; box-shadow: 0 4px 12px rgba(11,42,64,.12); }
      .kfun-boss.is-hit { animation: kfun-hit .45s; }
      .kfun-boss.is-won { background: #e7f8ee; }
      @keyframes kfun-hit { 20% { transform: translateX(-3px); } 40% { transform: translateX(3px); } 60% { transform: translateX(-2px); } 80% { transform: translateX(2px); } }
      .kfun-card { width: min(420px, calc(100vw - 32px)); max-height: 60vh; overflow: auto; padding: 14px; border-radius: 12px; background: #fff; color: #0b2a40; box-shadow: 0 16px 40px rgba(11,42,64,.25); font-size: 13px; border: 1px solid rgba(11,42,64,.12); }
      .kfun-card h3 { margin: 0 0 8px; font-size: 15px; }
      .kfun-card ul { margin: 0; padding-left: 18px; display: grid; gap: 6px; }
      .kfun-term { background: #0d1117; color: #c9f7c9; font-family: ui-monospace, Menlo, monospace; font-size: 12.5px; }
      .kfun-term pre { margin: 0 0 6px; white-space: pre-wrap; }
      .kfun-term input { width: 100%; border: 0; background: transparent; color: #c9f7c9; font: inherit; outline: none; }
      .kfun-close { float: right; border: 0; background: none; font-size: 18px; cursor: pointer; color: inherit; }
      @media (max-width: 782px) { .kfun { left: 12px; bottom: 12px; } }
    `;
    document.head.append(style);
    const ui = document.createElement("div");
    ui.className = "kfun";
    ui.setAttribute("aria-live", "polite");
    const bar = document.createElement("div");
    bar.className = "kfun-bar";
    ui.append(bar);
    document.body.append(ui);
    const el = (tag, attrs = {}, ...kids) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (v == null) continue; if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else if (k === "class") n.className = v; else n.setAttribute(k, v); } for (const c of kids.flat()) if (c != null) n.append(c.nodeType ? c : document.createTextNode(String(c))); return n; };

    // ---------- Messages (anti-agacement) ----------
    const busy = () => Date.now() - lastTyping < 4000 || document.body.classList.contains("wsp-dragging") || document.querySelector("dialog[open], .wsp-palette, .wp-prepublish:not([hidden])");
    function toast(key, title, text, action, { force = false } = {}) {
      if (!active || !prefs.notifications) return false;
      if (seen.has(key) || shownCount >= limits().max || busy()) return false;
      if (!force && Date.now() - lastToast < limits().cooldown) return false;
      seen.add(key);
      shownCount++;
      lastToast = Date.now();
      const t = el("div", { class: "kfun-toast", role: "status" }, el("strong", {}, title), text ? el("small", {}, text) : null,
        action ? el("button", { type: "button", class: "kfun-act", onclick: () => { t.remove(); try { action.run(); } catch { /* sans effet */ } } }, action.label) : null,
        el("button", { type: "button", class: "kfun-x", "aria-label": "Fermer", onclick: () => t.remove() }, "×"));
      ui.append(t);
      setTimeout(() => t.remove(), 9000);
      return true;
    }

    // ---------- Boss SEO, points, robot (représentation des VRAIS problèmes) ----------
    const boss = el("button", { type: "button", class: "kfun-boss", title: "Boss SEO : nombre réel de points à corriger (ouvre les recommandations)", onclick: () => B.reveal("reco") });
    const robot = el("button", { type: "button", class: "kfun-robot", title: "Assistant robot", "aria-label": "Assistant robot", onclick: robotSays }, "🤖");
    function renderBar(a) {
      bar.replaceChildren(...[prefs.gamification ? boss : null, prefs.robot ? robot : null].filter(Boolean));
      if (!a) { boss.textContent = "👾 Boss SEO · données indisponibles"; return; }
      const n = a.summary.problem + a.summary.improve;
      boss.classList.toggle("is-won", n === 0);
      boss.textContent = n === 0 ? `🏆 Boss SEO vaincu · ${prefs.xp || 0} XP` : `👾 Boss SEO · ${n} point${n > 1 ? "s" : ""} à corriger · ${prefs.xp || 0} XP`;
    }
    function robotSays() {
      const a = prev;
      const text = !a ? "🤖 Je n'ai pas encore de données." : a.summary.problem === 0 && a.summary.improve === 0 ? "🤖 Tout semble correct." : a.summary.problem ? `🤖 Euh… nous devons parler : ${a.summary.problem} problème(s), ${a.summary.improve} point(s) à améliorer.` : `🤖 Presque : ${a.summary.improve} point(s) à améliorer.`;
      const t = el("div", { class: "kfun-toast", role: "status" }, el("strong", {}, text), el("button", { type: "button", class: "kfun-x", "aria-label": "Fermer", onclick: () => t.remove() }, "×"));
      ui.append(t);
      setTimeout(() => t.remove(), 6000);
    }

    // ---------- Badges et points (purement décoratifs) ----------
    const BADGE_LABEL = { "premiere-optimisation": "Première optimisation", "maitre-des-liens": "Maître des liens", "nettoyeur-seo": "Nettoyeur SEO", "chasseur-exploration": "Chasseur d'exploration", "architecte-seo": "Architecte SEO" };
    let progressTimer = null;
    const persist = () => { clearTimeout(progressTimer); progressTimer = setTimeout(async () => { const p = await B.saveProgress({ xp: prefs.xp, badges: prefs.badges }); if (p) prefs = p; }, 1500); };
    function award(id) {
      if (!prefs.gamification || (prefs.badges || []).includes(id)) return;
      prefs.badges = [...(prefs.badges || []), id];
      persist();
      toast(`badge:${id}`, `🏅 Badge débloqué : ${BADGE_LABEL[id]}`, "Purement décoratif : aucun effet sur le SEO.", null, { force: true });
    }
    function addXp(n) {
      if (!prefs.gamification || Date.now() - lastXpAt < 20000) return;
      lastXpAt = Date.now();
      prefs.xp = (prefs.xp || 0) + n;
      persist();
    }

    // ---------- Réactions aux VRAIS événements de l'analyse ----------
    function onAnalysis(a) {
      if (!active || !a) return;
      const before = prev;
      prev = a;
      renderBar(a);
      const total = a.summary.problem + a.summary.improve;
      const stats = a.stats || {};
      if (stats.internalLinks >= 3) award("maitre-des-liens");
      if (a.summary.problem === 0 && a.summary.improve <= 2 && a.words >= 300) award("nettoyeur-seo");
      const hierarchyOk = (a.checks.find((c) => c.id === "hierarchy") || {}).status === "good";
      if (stats.headings && stats.headings.h2 >= 3 && hierarchyOk && !stats.h1InContent) award("architecte-seo");
      if (!before) {
        if (total >= 10 && prefs.humor) toast("fire", tone("Plusieurs points à traiter", "🔥 Service des pompiers SEO", "🔥🚒 ALERTE GÉNÉRALE, LES POMPIERS SEO ARRIVENT"), `${total} points réellement relevés par l'analyse. Pas de panique : on sait où ils sont.`, { label: "Montre-moi", run: () => B.reveal("reco") });
        return;
      }
      const beforeTotal = before.summary.problem + before.summary.improve;
      if (total < beforeTotal) {
        addXp(10);
        award("premiere-optimisation");
        if (prefs.animations && !reduced) { boss.classList.remove("is-hit"); void boss.offsetWidth; boss.classList.add("is-hit"); }
      }
      if (before.summary.problem > 0 && a.summary.problem === 0 && prefs.humor) toast("cured", tone("Plus aucun problème", "✓ Patient hors de danger.", "✓ PATIENT HORS DE DANGER (le docteur danse)"), "L'analyse ne relève plus aucun problème bloquant.");
      if (total === 0 && beforeTotal > 0 && prefs.humor) toast("boss-defeated", "🏆 Boss SEO vaincu", "Plus aucun point à corriger d'après l'analyse.", null, { force: true });
      if (total >= 10 && beforeTotal < 10 && prefs.humor) toast("fire", tone("Plusieurs points à traiter", "🔥 Service des pompiers SEO", "🔥🚒 LES POMPIERS SEO ARRIVENT"), `${total} points relevés. Don't panic : on sait où ils sont.`, { label: "Montre-moi", run: () => B.reveal("reco") });
      // Nouveaux problèmes réels apparus depuis la dernière analyse
      const was = new Set(before.checks.filter((c) => c.status === "problem").map((c) => c.id));
      for (const c of a.checks.filter((x) => x.status === "problem" && !was.has(x.id))) {
        if (!prefs.humor) break;
        if (c.id === "canonical") toast(`police:${c.id}`, tone("Problème d'URL canonique", "🚨 POLICE SEO", "🚨🚓 POLICE SEO, PLUS UN GESTE"), `Veuillez nous suivre. ${c.label}${c.advice ? ` — ${c.advice}` : ""}`, { label: "Voir", run: () => B.reveal("indexing") });
        else toast(`doctor:${c.id}`, tone(`Diagnostic : ${c.label}`, `🩺 Diagnostic SEO : ${c.label.toLowerCase()}`, `🩺 CODE ROUGE : ${c.label.toLowerCase()}`), c.advice || "", { label: "Voir les recommandations", run: () => B.reveal("reco") });
      }
    }

    // ---------- Détective (vraies opportunités du moteur) ----------
    function onOpportunities(d) {
      if (!active || !prefs.humor || !d || !d.items || !d.items.length) return;
      const o = d.items[0];
      toast("detective", "🕵️ SEO Détective", `Suspect : ${o.title}. Indice : ${o.evidence || "—"}. Mobile : ${o.reason || "—"}. Action : ${o.action || "—"} (source : ${o.source}).`, { label: "Ouvrir le dossier", run: () => B.reveal("opportunities") });
    }

    // ---------- Cartes : cimetière des liens cassés, terminal, surprise ----------
    function card(title, ...content) {
      ui.querySelectorAll(".kfun-card").forEach((c) => c.remove());
      const c = el("div", { class: "kfun-card", role: "dialog", "aria-label": title }, el("button", { type: "button", class: "kfun-close", "aria-label": "Fermer", onclick: () => c.remove() }, "×"), el("h3", {}, title), ...content);
      ui.append(c);
      c.querySelector("button").focus();
      return c;
    }
    async function cemetery() {
      const a = await B.read("audit");
      if (!a) return card("⚰️ Cimetière des liens cassés", el("p", {}, "Données indisponibles (article pas encore enregistré)."));
      if (!a.audit) return card("⚰️ Cimetière des liens cassés", el("p", {}, "Aucun audit du site n'a encore été lancé : impossible de savoir. Lancez « Analyser la page en ligne »."));
      const dead = a.issues.filter((i) => i.rule === "broken_internal_link" || i.rule === "broken_external_link");
      card("⚰️ Cimetière des liens cassés", dead.length ? el("ul", {}, ...dead.map((i) => el("li", {}, el("strong", {}, i.title), el("br"), `${i.detail}`, el("br"), el("em", {}, `Action : ${i.recommendation || "corriger ou retirer le lien"}`)))) : el("p", {}, `Le cimetière est vide 🌱 (d'après l'audit du ${a.audit.finishedAt}).`));
    }
    async function surprise() {
      const pool = [];
      const a = prev;
      if (a) {
        pool.push(() => card("🎲 Surprise : statistique réelle", el("p", {}, `${a.words} mots, note interne ${a.score} / 100, ${a.summary.good} contrôles réussis.`)));
        const p = a.checks.filter((c) => c.status !== "good");
        if (p.length) pool.push(() => { const c = p[Math.floor(Math.random() * p.length)]; card("🎲 Surprise : un vrai point à améliorer", el("p", {}, el("strong", {}, c.label)), c.advice ? el("p", {}, c.advice) : null); });
      }
      const o = await B.read("opportunities");
      if (o && o.items && o.items.length) pool.push(() => { const x = o.items[Math.floor(Math.random() * o.items.length)]; card("🎲 Surprise : une vraie opportunité", el("p", {}, el("strong", {}, x.title)), el("p", {}, x.evidence || ""), el("p", {}, `→ ${x.action || ""}`), el("small", {}, `Source : ${x.source}`)); });
      if (!pool.length) return card("🎲 Surprise", el("p", {}, "Rien de réel à montrer pour l'instant… alors voici un easter egg : 🥚"));
      pool[Math.floor(Math.random() * pool.length)]();
    }
    function terminal() {
      const out = el("pre", {}, "Terminal SEO (ludique, aucune commande système). Tapez « help ».\n");
      const input = el("input", { type: "text", "aria-label": "Commande du terminal SEO", autocomplete: "off", spellcheck: "false" });
      const c = card("Terminal SEO", out, el("span", {}, "$ "), input);
      c.classList.add("kfun-term");
      const print = (t) => { out.textContent += `${t}\n`; c.scrollTop = c.scrollHeight; };
      input.addEventListener("keydown", async (e) => {
        if (e.key !== "Enter") return;
        const cmd = input.value.trim();
        input.value = "";
        print(`$ ${cmd}`);
        if (cmd === "help") print("Commandes : seo status · score · sudo fix_seo · blague · clear · exit");
        else if (cmd === "seo status") {
          const site = await B.read("site");
          const opp = await B.read("opportunities");
          const a = prev;
          print(`Note interne : ${a ? `${a.score}/100` : "données indisponibles"}\nPoints à corriger : ${a ? a.summary.problem + a.summary.improve : "données indisponibles"}\nArticles publiés : ${site ? site.publishedPosts : "données indisponibles"}\nLiens cassés (dernier audit) : ${site && site.brokenLinks !== null ? site.brokenLinks : "aucun audit"}\nOpportunités (cet article) : ${opp ? opp.items.length : "données indisponibles"}\nIndexation chez Google : non implémenté`);
        } else if (cmd === "score") print(prev ? `${prev.score}/100 (repère interne)` : "Données indisponibles.");
        else if (cmd.startsWith("sudo")) print("Permission refusée. Bien essayé.");
        else if (cmd === "blague") print(["Pourquoi le robot de Google est-il calme ? Parce qu'il suit les liens.", "Mon H1 est parti chercher du lait. Il n'est jamais revenu.", "Un 404 entre dans un bar. Personne ne le trouve."][Math.floor(Math.random() * 3)]);
        else if (cmd === "clear") out.textContent = "";
        else if (cmd === "exit") c.remove();
        else if (cmd) print(`Commande inconnue : ${cmd}`);
      });
      input.focus();
    }
    // Commandes de la palette (visibles seulement quand le Mode Fun est actif)
    B.registerCommand({ id: "cemetery", label: "⚰️ Cimetière des liens cassés", run: cemetery });
    B.registerCommand({ id: "surprise", label: "🎲 Surprends-moi", run: surprise });
    B.registerCommand({ id: "terminal", label: "Terminal SEO (ludique)", run: () => { if (prefs.eggs) terminal(); else card("Terminal SEO", el("p", {}, "Activez « Easter eggs » dans les réglages du Mode Fun.")); } });
    B.registerCommand({ id: "coffee", label: "☕ Pause café", run: () => card("☕ Pause café", el("p", {}, "Le SEO peut attendre cinq minutes. Votre article aussi.")) });

    // Code Konami : rare, sans aucun effet sur les données
    const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let k = 0;
    document.addEventListener("keydown", (e) => {
      if (!active || !prefs.eggs) return;
      k = e.key === KONAMI[k] ? k + 1 : e.key === KONAMI[0] ? 1 : 0;
      if (k === KONAMI.length) { k = 0; toast("konami", "🎮 Code Konami", "+30 vies… pour vos articles. (Aucun effet sur le SEO.)", null, { force: true }); }
    });

    // ---------- Branchements ----------
    B.on("analysis", onAnalysis);
    B.on("data:opportunities", onOpportunities);
    B.on("typing", () => { lastTyping = Date.now(); ui.querySelectorAll(".kfun-toast").forEach((t) => t.remove()); });
    B.on("action", (x) => { if (active && x && x.type === "analyse-online") award("chasseur-exploration"); });
    B.on("fun:prefs", (p) => { prefs = p || prefs; active = Boolean(prefs.enabled); ui.hidden = !active; if (active) renderBar(prev); });
    B.on("fun:off", () => { active = false; ui.hidden = true; ui.querySelectorAll(".kfun-toast, .kfun-card").forEach((t) => t.remove()); });
    B.on("fun:on", (p) => { prefs = p || prefs; active = true; ui.hidden = false; renderBar(prev); });
    B.read("analysis").then((a) => { if (a) { prev = null; renderBar(null); } });
    renderBar(null);
  }
})();
