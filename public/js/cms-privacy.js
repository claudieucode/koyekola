// KOLAKISA CMS → Paramètres → Confidentialité. Données = JSON #pv-data posé par le serveur. Rien n'est annoncé comme réussi avant la réponse du serveur ;
// une valeur refusée reste affichée (jamais réinitialisée) ; la page créée est une vraie page du CMS (POST …/confidentialite/creer).
(function () {
  var root = document.querySelector("[data-pv-root]");
  if (!root) return;
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
  var boot = JSON.parse(document.getElementById("pv-data").textContent);
  var flash = $("[data-pv-flash]");
  var select = $("[data-pv-select]"), useBtn = $("[data-pv-use]"), hint = $("[data-pv-select-hint]");
  var createBtn = $("[data-pv-create]"), exists = $("[data-pv-exists]"), existsList = $("[data-pv-exists-list]");
  var retention = $("[data-pv-retention]"), retentionBtn = $("[data-pv-retention-save]");
  var busy = false, savedSelect = select ? select.value : "";

  function say(text, kind) { flash.hidden = !text; flash.textContent = text || ""; flash.className = "mk-pv-flash" + (kind ? " is-" + kind : ""); }
  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function api(method, path, body) {
    return fetch(boot.api.replace("confidentialite", "confidentialite" + path), { method: method, credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (b) { return { status: r.status, body: b }; }); });
  }
  function errText(res) { var b = res.body || {}; return (b.errors && b.errors.join(" ")) || b.error || "Une erreur est survenue. Vos valeurs sont conservées : réessayez."; }

  // ---------- Modifications non enregistrées ----------
  function dirty() { return (select && !select.disabled && select.value !== savedSelect) || (retention && !retention.disabled && retention.value !== retention.getAttribute("data-pv-saved")); }
  function sync() {
    if (useBtn) useBtn.disabled = busy || !(select && !select.disabled && select.value !== savedSelect);
    if (retentionBtn) retentionBtn.disabled = busy || !(retention && !retention.disabled && retention.value !== retention.getAttribute("data-pv-saved"));
    if (createBtn) createBtn.disabled = busy || !boot.canCreate;
    if (hint) hint.textContent = select && select.value !== savedSelect ? "Modification non enregistrée : cliquez sur « Utiliser cette page »." : "La sélection actuelle est enregistrée.";
  }
  window.addEventListener("beforeunload", function (e) { if (dirty()) { e.preventDefault(); e.returnValue = ""; } });

  // ---------- Onglets (sans rechargement, sans perdre la saisie) ----------
  var tabs = $$("[data-pv-tab]");
  function show(name, push) {
    tabs.forEach(function (t) { var on = t.getAttribute("data-pv-tab") === name; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; });
    $$("[data-pv-panel]").forEach(function (p) { p.hidden = p.getAttribute("data-pv-panel") !== name; });
    if (push) { try { var u = new URL(location.href); u.searchParams.set("onglet", name); history.replaceState(null, "", u); } catch (e) { /* adresse inchangée */ } }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function (e) { e.preventDefault(); show(t.getAttribute("data-pv-tab"), true); });
    t.addEventListener("keydown", function (e) {
      var k = e.key, n = k === "ArrowRight" ? i + 1 : k === "ArrowLeft" ? i - 1 : k === "Home" ? 0 : k === "End" ? tabs.length - 1 : null;
      if (n === null) return; e.preventDefault(); var to = tabs[(n + tabs.length) % tabs.length]; to.focus(); show(to.getAttribute("data-pv-tab"), true);
    });
  });
  $$("[data-pv-goto]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); show(a.getAttribute("data-pv-goto"), true); window.scrollTo({ top: 0 }); }); });

  // ---------- Accordéons ----------
  $$("[data-pv-acc-btn]").forEach(function (b) {
    b.addEventListener("click", function () { var open = b.getAttribute("aria-expanded") === "true"; b.setAttribute("aria-expanded", String(!open)); b.closest("[data-pv-acc]").classList.toggle("is-open", !open); });
  });

  // ---------- État affiché (relu du serveur après chaque action) ----------
  var CLS = { none: "is-none", draft_available: "is-warn", draft: "is-warn", published: "is-ok", unavailable: "is-bad" };
  function paint(b) {
    var p = b.policy; if (!p) return;
    var box = $("[data-pv-state]"); box.className = "mk-pv-state " + (CLS[p.state] || "is-none");
    $("[data-pv-state-label]").textContent = p.label; $("[data-pv-state-detail]").textContent = p.detail;
    var links = $("[data-pv-state-links]");
    links.innerHTML = p.page ? '<a href="' + esc(p.page.edit) + '">Modifier</a> · <a href="' + esc(p.page.preview) + '" target="_blank" rel="noopener">Prévisualiser</a>' + (p.page.publicUrl ? ' · <a href="' + esc(p.page.publicUrl) + '" target="_blank" rel="noopener">Voir en ligne</a>' : "") : "";
    if (select) {
      var cur = p.id ? String(p.id) : "";
      select.innerHTML = '<option value="">— Aucune page —</option>' + (p.id && !(b.pages || []).some(function (x) { return x.id === p.id; }) ? '<option value="' + p.id + '">Page n° ' + p.id + " (indisponible)</option>" : "") +
        (b.pages || []).map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + (x.published ? "" : " (brouillon)") + "</option>"; }).join("");
      select.value = cur; savedSelect = select.value;
    }
    sync();
  }

  // ---------- Créer une page ----------
  function create(confirm) {
    if (busy) return; busy = true; sync(); say("Création de la page…", "info"); exists.hidden = true;
    api("POST", "/creer", confirm ? { confirm: true } : {}).then(function (res) {
      busy = false;
      if (res.status === 201 && res.body.ok) {
        paint(res.body); sync();
        say("Page créée" + (res.body.associated ? " et associée à la politique de confidentialité" : "") + ". Complétez-la dans l'éditeur : ", "ok");
        var a = document.createElement("a"); a.href = res.body.edit; a.textContent = "ouvrir la page"; flash.appendChild(a);
        return;
      }
      sync();
      if (res.status === 409 && res.body.exists) {
        say("");
        existsList.innerHTML = res.body.exists.map(function (e) { return "<li><strong>" + esc(e.name) + "</strong> (" + (e.status === "published" ? "publiée" : "brouillon") + ') — <a href="' + esc(e.edit) + '">Ouvrir et modifier</a></li>'; }).join("");
        exists.hidden = false; return;
      }
      say(errText(res), "error");
    }).catch(function () { busy = false; sync(); say("Le serveur ne répond pas. Aucune page n'a été créée : réessayez.", "error"); });
  }
  if (createBtn) createBtn.addEventListener("click", function () { create(false); });
  var anyway = $("[data-pv-create-anyway]"); if (anyway) anyway.addEventListener("click", function () { create(true); });
  var cancel = $("[data-pv-exists-cancel]"); if (cancel) cancel.addEventListener("click", function () { exists.hidden = true; });

  // ---------- Enregistrer (association, conservation) ----------
  function save(values, done) {
    if (busy) return; busy = true; sync(); say("Enregistrement…", "info");
    api("PUT", "", { values: values }).then(function (res) {
      busy = false;
      if (res.status === 200 && res.body.ok) { paint(res.body); if (res.body.retention && retention) { retention.value = res.body.retention.value; retention.setAttribute("data-pv-saved", String(res.body.retention.value)); } sync(); say(done, "ok"); return; }
      sync(); say(errText(res), "error");
    }).catch(function () { busy = false; sync(); say("Le serveur ne répond pas. Rien n'a été enregistré : vos valeurs sont conservées, réessayez.", "error"); });
  }
  if (useBtn) useBtn.addEventListener("click", function () { save({ privacy_page: select.value }, select.value ? "Page de politique de confidentialité enregistrée." : "Association retirée : la page elle-même n'est pas supprimée."); });
  if (retentionBtn) retentionBtn.addEventListener("click", function () { save({ analytics_retention_days: retention.value }, "Durée de conservation enregistrée."); });
  if (select) select.addEventListener("change", sync);
  if (retention) retention.addEventListener("input", sync);
  sync();
})();
