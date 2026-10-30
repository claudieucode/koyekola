// Accueil des projets IA : création d'un projet (brief → analyse → espace de travail). Le brief en cours de saisie est gardé dans ce navigateur (brouillon local) pour survivre à un rechargement.
(() => {
  const SITE0 = new URLSearchParams(location.search).get("site") || (document.querySelector('meta[name="mk-site"]') || {}).content || "";
  const sform = document.getElementById("aibh-shop-form");
  if (sform) sform.addEventListener("submit", async (e) => {
    e.preventDefault();
    const st = document.getElementById("aibh-shop-status"), go = document.getElementById("aibh-shop-go");
    const say = (t, err) => { st.textContent = t; st.className = `aibh-status${err ? " is-error" : ""}`; };
    const brief = sform.querySelector("#aibh-shop-brief").value.trim();
    if (brief.length < 20) return say("Décrivez votre boutique en quelques phrases (20 caractères au moins).", true);
    const mode = (sform.querySelector('input[name="shopsite"]:checked') || {}).value; const payload = { brief };
    if (mode === "new") { payload.newSiteName = (sform.querySelector("#aibh-shop-name").value || "").trim(); if (payload.newSiteName.length < 2) return say("Donnez un nom à la boutique.", true); } else payload.siteId = Number((sform.querySelector("#aibh-shop-site") || {}).value) || undefined;
    go.disabled = true; say("Analyse de votre boutique…");
    try {
      const r = await fetch(`/marketing/ia/studio/boutique/projets${SITE0 ? `?site=${encodeURIComponent(SITE0)}` : ""}`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload), credentials: "same-origin" });
      const j = await r.json().catch(() => ({ ok: false, error: "Réponse illisible du serveur." }));
      if (!r.ok || !j.ok) { go.disabled = false; return say(j.error || "La création a échoué. Votre texte est conservé.", true); }
      location.href = j.url;
    } catch { go.disabled = false; say("Connexion impossible. Votre texte est conservé : réessayez.", true); }
  });
  const form = document.getElementById("aibh-form");
  if (!form) return;
  const brief = form.querySelector("#aibh-brief"), status = document.getElementById("aibh-status"), go = document.getElementById("aibh-go");
  const KEY = "aibh.brief";
  const SITE = new URLSearchParams(location.search).get("site") || (document.querySelector('meta[name="mk-site"]') || {}).content || ""; // accès limité à un site : le site figure dans l'adresse
  try { const saved = localStorage.getItem(KEY); if (saved && !brief.value) { brief.value = saved; status.textContent = "Brouillon retrouvé dans ce navigateur."; } } catch { /* stockage indisponible : sans effet */ }
  brief.addEventListener("input", () => { try { localStorage.setItem(KEY, brief.value); } catch { /* ignoré */ } });
  const say = (t, err) => { status.textContent = t; status.className = `aibh-status${err ? " is-error" : ""}`; };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = brief.value.trim();
    if (text.length < 20) return say("Décrivez votre projet en quelques phrases (20 caractères au moins).", true);
    const mode = (form.querySelector('input[name="site"]:checked') || {}).value;
    const payload = { brief: text };
    if (mode === "new") payload.newSiteName = (form.querySelector("#aibh-name").value || "").trim(); else payload.siteId = Number((form.querySelector("#aibh-site") || {}).value) || undefined;
    if (mode === "new" && payload.newSiteName.length < 2) return say("Donnez un nom au nouveau site.", true);
    go.disabled = true; say("Analyse de votre projet… cela peut prendre une minute.");
    try {
      const r = await fetch(`/marketing/ia/studio/projets${SITE ? `?site=${encodeURIComponent(SITE)}` : ""}`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload), credentials: "same-origin" });
      const j = await r.json().catch(() => ({ ok: false, error: "Réponse illisible du serveur." }));
      if (!r.ok || !j.ok) { go.disabled = false; return say(j.error || "L'analyse a échoué. Votre texte est conservé : vous pouvez réessayer.", true); }
      try { localStorage.removeItem(KEY); } catch { /* ignoré */ }
      location.href = j.url;
    } catch { go.disabled = false; say("Connexion impossible. Votre texte est conservé : vérifiez votre connexion puis réessayez.", true); }
  });
})();
