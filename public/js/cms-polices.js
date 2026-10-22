// KOLAKISA CMS → Apparence → Polices : recherche et filtres instantanés, texte de démonstration, téléversement par glisser-déposer avec progression réelle,
// confirmations, anti double envoi. Tout fonctionne aussi sans ce script (formulaires et pagination côté serveur) : il n'ajoute que le confort.
(function () {
  "use strict";
  var root = document.querySelector("[data-pf-root]");
  if (!root) return;
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } },
  };

  // ----- Texte de démonstration et taille (mémorisés dans ce navigateur) -----
  var DEFAULT_SAMPLE = "Portez ce vieux whisky au juge blond qui fume";
  var sampleInput = root.querySelector("[data-pf-sample-input]");
  var sizeInput = root.querySelector("[data-pf-size]"), sizeOut = root.querySelector("[data-pf-size-out]");
  function applySample() {
    var text = (sampleInput && sampleInput.value.trim()) || DEFAULT_SAMPLE;
    root.querySelectorAll("[data-pf-sample]").forEach(function (el) { el.textContent = text; });
  }
  if (sampleInput) {
    if (!sampleInput.value) sampleInput.value = store.get("kolaPfSample") || "";
    sampleInput.addEventListener("input", function () { store.set("kolaPfSample", sampleInput.value); applySample(); });
    applySample();
  }
  function applySize(px) {
    root.style.setProperty("--pf-size", px + "px");
    if (sizeOut) sizeOut.textContent = px + " px";
    if (sizeInput) sizeInput.setAttribute("aria-valuetext", px + " pixels");
  }
  if (sizeInput) {
    var saved = parseInt(store.get("kolaPfSize") || "", 10);
    if (saved >= 14 && saved <= 56) sizeInput.value = String(saved);
    applySize(sizeInput.value);
    sizeInput.addEventListener("input", function () { store.set("kolaPfSize", sizeInput.value); applySize(sizeInput.value); });
  }

  // ----- Recherche et filtres instantanés : le même écran est demandé au serveur, seule la zone de résultats est remplacée -----
  var filter = root.querySelector("form[data-pf-filter]"), results = root.querySelector("[data-pf-results]");
  if (filter && results && window.fetch && window.DOMParser) {
    var timer = null, controller = null;
    var urlOf = function () {
      var p = new URLSearchParams(new FormData(filter)); // champs vides retirés : adresse propre
      Array.from(p.keys()).forEach(function (k) { if (p.get(k) === "") p.delete(k); });
      var qs = p.toString();
      return filter.getAttribute("action") + (qs ? "?" + qs : "");
    };
    var load = function (url, push) {
      if (controller) controller.abort();
      controller = typeof AbortController === "function" ? new AbortController() : null;
      results.setAttribute("aria-busy", "true");
      fetch(url, { credentials: "same-origin", headers: { Accept: "text/html" }, signal: controller ? controller.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error("http"); return r.text(); })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, "text/html");
          var fresh = doc.querySelector("[data-pf-results]");
          if (!fresh) throw new Error("format");
          results.innerHTML = fresh.innerHTML;
          if (push) window.history.replaceState(null, "", url);
          applySample();
          var reset = filter.querySelector("[data-pf-reset]");
          if (reset) { var data = new FormData(filter), any = false; data.forEach(function (v, k) { if (v && k !== "site" && k !== "vue" && !(k === "tri" && v === "nom")) any = true; }); reset.hidden = !any; }
        })
        .catch(function (e) { if (e && e.name === "AbortError") return; window.location.href = url; })
        .then(function () { results.setAttribute("aria-busy", "false"); });
    };
    filter.addEventListener("submit", function (e) { e.preventDefault(); load(urlOf(), true); });
    filter.addEventListener("input", function (e) { if (e.target.matches("[data-pf-search]")) { clearTimeout(timer); timer = setTimeout(function () { load(urlOf(), true); }, 220); } });
    filter.addEventListener("change", function (e) { if (!e.target.matches("[data-pf-search]")) load(urlOf(), true); });
    results.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest(".pf-pager a");
      if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); load(a.getAttribute("href"), true); }
    });
  }

  // ----- Confirmation puis anti double envoi des actions -----
  root.addEventListener("submit", function (e) {
    var f = e.target.closest && e.target.closest("form[data-pf-form]");
    if (!f) return;
    var b = e.submitter || f.querySelector("button[type=submit]");
    var msg = b && b.getAttribute("data-confirm");
    if (msg && !window.confirm(msg)) { e.preventDefault(); return; }
    if (f.getAttribute("data-busy-now") === "1") { e.preventDefault(); return; }
    f.setAttribute("data-busy-now", "1");
    if (b) setTimeout(function () { b.disabled = true; b.setAttribute("aria-busy", "true"); }, 0);
  });
  // Menus d'actions : fermés par Échap ou par un clic à côté
  document.addEventListener("click", function (e) { root.querySelectorAll("details.pf-menu[open]").forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute("open"); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") root.querySelectorAll("details.pf-menu[open]").forEach(function (d) { d.removeAttribute("open"); var s = d.querySelector("summary"); if (s) s.focus(); }); });

  // ----- Choix des variantes -----
  root.querySelectorAll("[data-pf-all]").forEach(function (b) {
    b.addEventListener("click", function () { var on = b.getAttribute("data-pf-all") === "on"; root.querySelectorAll("[data-pf-variant]:not(:disabled)").forEach(function (c) { c.checked = on; }); syncInstall(); });
  });
  var install = root.querySelector("[data-pf-install]");
  var boxes = root.querySelectorAll("[data-pf-variant]");
  function syncInstall() {
    if (!install) return;
    var n = 0; boxes.forEach(function (c) { if (c.checked) n++; });
    install.disabled = n === 0; install.title = n === 0 ? "Cochez au moins une variante" : "";
  }
  boxes.forEach(function (c) { c.addEventListener("change", syncInstall); });
  syncInstall();

  // ----- Téléversement -----
  var form = root.querySelector("form[data-pf-upload]");
  if (!form) return;
  var input = form.querySelector("[data-pf-input]"), drop = form.querySelector("[data-pf-drop]"), queue = form.querySelector("[data-pf-queue]"), list = form.querySelector("[data-pf-list]");
  var qcount = form.querySelector("[data-pf-qcount]"), submit = form.querySelector("[data-pf-submit]"), submitT = form.querySelector("[data-pf-submit-t]");
  var progress = form.querySelector("[data-pf-progress]"), fill = form.querySelector("[data-pf-fill]"), ptxt = form.querySelector("[data-pf-ptxt]"), live = form.querySelector("[data-pf-live]");
  var maxBytes = Number(form.getAttribute("data-max-bytes")) || 5242880, maxFiles = Number(form.getAttribute("data-max-files")) || 12;
  var EXT = /\.(woff2|woff|ttf|otf)$/i;
  var files = []; // { file, error, state, message }
  var busy = false;
  var say = function (t) { if (live) live.textContent = t; };
  var size = function (n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + " Mo" : Math.max(1, Math.round(n / 1024)) + " Ko"; };
  var key = function (f) { return f.name + "|" + f.size + "|" + f.lastModified; };

  function add(fileList) {
    Array.prototype.forEach.call(fileList, function (f) {
      if (files.some(function (x) { return key(x.file) === key(f); })) return;
      var error = "";
      if (!EXT.test(f.name)) error = "Extension non prise en charge (WOFF2, WOFF, TTF, OTF).";
      else if (f.size === 0) error = "Fichier vide.";
      else if (f.size > maxBytes) error = "Trop volumineux (maximum " + Math.round(maxBytes / 1048576) + " Mo).";
      files.push({ file: f, error: error, state: error ? "err" : "wait", message: error });
    });
    render();
  }
  function render() {
    list.innerHTML = "";
    files.forEach(function (x, i) {
      var li = document.createElement("li"); li.className = "pf-q" + (x.error ? " is-bad" : "");
      var ext = document.createElement("span"); ext.className = "pf-q-ext"; ext.textContent = (x.file.name.split(".").pop() || "").toUpperCase().slice(0, 5);
      var name = document.createElement("span"); name.className = "pf-q-name"; name.textContent = x.file.name;
      var sub = document.createElement("span"); sub.className = "pf-q-sub"; sub.textContent = size(x.file.size) + (x.message ? " · " + x.message : ""); name.appendChild(sub);
      var st = document.createElement("span"); st.className = "pf-q-state pf-q-state--" + x.state;
      st.textContent = x.state === "ok" ? "Importé" : x.state === "err" ? "Refusé" : x.state === "up" ? "Envoi…" : "Prêt";
      var drop_ = document.createElement("button"); drop_.type = "button"; drop_.className = "btn btn-ghost btn-sm"; drop_.textContent = "Retirer"; drop_.setAttribute("aria-label", "Retirer " + x.file.name); drop_.disabled = busy;
      drop_.addEventListener("click", function () { files.splice(i, 1); render(); say(x.file.name + " retiré."); });
      li.appendChild(ext); li.appendChild(name); li.appendChild(st); li.appendChild(drop_); list.appendChild(li);
    });
    queue.hidden = files.length === 0;
    var ready = files.filter(function (x) { return x.state === "wait"; }).length;
    if (qcount) qcount.textContent = "(" + files.length + ")";
    submit.disabled = busy || ready === 0;
    if (submitT) submitT.textContent = ready ? "Importer " + ready + " fichier" + (ready > 1 ? "s" : "") : "Importer";
  }

  input.addEventListener("change", function () { add(input.files); input.value = ""; });
  ["dragenter", "dragover"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add("is-over"); }); });
  ["dragleave", "drop"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove("is-over"); }); });
  drop.addEventListener("drop", function (e) { if (e.dataTransfer && e.dataTransfer.files) add(e.dataTransfer.files); });
  var clear = form.querySelector("[data-pf-clear]");
  if (clear) clear.addEventListener("click", function () { if (!busy) { files = []; render(); } });

  form.addEventListener("submit", function (e) {
    if (!window.FormData || !window.XMLHttpRequest) return; // sans ces API : envoi classique du formulaire
    e.preventDefault();
    if (busy) return;
    var ready = files.filter(function (x) { return x.state === "wait"; });
    if (!ready.length) return;
    if (ready.length > maxFiles) { say("Maximum " + maxFiles + " fichiers par envoi."); window.alert("Maximum " + maxFiles + " fichiers par envoi : retirez-en quelques-uns."); return; }
    var fd = new FormData();
    var site = form.querySelector("input[name=site]"); if (site) fd.append("site", site.value);
    fd.append("categorie", form.querySelector("[name=categorie]").value);
    fd.append("famille", form.querySelector("[name=famille]").value);
    ready.forEach(function (x) { fd.append("polices", x.file, x.file.name); x.state = "up"; x.message = ""; });
    busy = true; render(); progress.hidden = false; fill.style.width = "0"; ptxt.textContent = "Envoi…";
    var xhr = new XMLHttpRequest();
    xhr.open("POST", form.getAttribute("data-endpoint"));
    xhr.setRequestHeader("Accept", "application/json");
    xhr.upload.onprogress = function (ev) { if (ev.lengthComputable) { var p = Math.round((ev.loaded / ev.total) * 100); fill.style.width = p + "%"; ptxt.textContent = p < 100 ? "Envoi… " + p + " %" : "Vérification sur le serveur…"; } };
    var finish = function (data, status) {
      busy = false; progress.hidden = true;
      var byName = {}; ((data && data.results) || []).forEach(function (r) { byName[r.name] = r; });
      var ok = 0;
      ready.forEach(function (x) {
        var r = byName[x.file.name];
        if (r && r.ok) { x.state = "ok"; x.message = "Famille « " + r.family + " » · graisse " + r.weight + (r.style === "italic" ? " italique" : ""); ok++; }
        else { x.state = "err"; x.error = "x"; x.message = (r && r.error) || (data && data.error) || (status ? "Erreur " + status : "Envoi impossible : vérifiez votre connexion."); }
      });
      render();
      var failed = ready.length - ok;
      say(ok + " fichier" + (ok > 1 ? "s" : "") + " importé" + (ok > 1 ? "s" : "") + (failed ? ", " + failed + " refusé" + (failed > 1 ? "s" : "") : "") + ".");
      if (ok) {
        var help = form.querySelector("[data-pf-help]");
        if (help) { help.textContent = ""; var a = document.createElement("a"); a.href = form.getAttribute("data-library"); a.textContent = "Voir la bibliothèque"; help.appendChild(document.createTextNode(ok + " fichier" + (ok > 1 ? "s" : "") + " importé" + (ok > 1 ? "s" : "") + ". ")); help.appendChild(a); }
        // Les fichiers importés quittent la liste d'attente après un court instant ; les refusés restent, avec leur raison
        setTimeout(function () { files = files.filter(function (x) { return x.state !== "ok"; }); render(); }, 1600);
      }
    };
    xhr.onload = function () { var data = null; try { data = JSON.parse(xhr.responseText); } catch (err) { data = null; } finish(data, xhr.status); };
    xhr.onerror = function () { finish(null, 0); };
    xhr.send(fd);
  });
  render();
})();
