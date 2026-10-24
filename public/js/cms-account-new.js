/* KOLAKISA CMS → Ajouter un compte : interactions. Le serveur reste l'unique juge (validation, droits, unicité, création) ; ce script ajoute le générateur de mot de passe
   (crypto.getRandomValues : aléa cryptographique du navigateur), l'affichage / masquage, le repère de robustesse (indicatif), la validation à la saisie et le verrou de
   double soumission. Sans lui, le formulaire fonctionne (envoi classique, validation serveur). Le mot de passe n'est jamais stocké ni envoyé ailleurs qu'au serveur. */
(function () {
  "use strict";
  var form = document.querySelector("[data-ac-form]");
  if (!form) return;
  var $ = function (s) { return form.querySelector(s); };
  var pw = $("[data-ac-password]"), toggle = $("[data-ac-toggle]"), gen = $("[data-ac-generate]");
  var bar = $("[data-ac-bar]"), label = $("[data-ac-label]"), meter = $("[data-ac-meter]");
  var notify = $("[data-ac-notify]"), hint = $("[data-ac-pwhint]"), status = $("[data-ac-status]"), submit = $("[data-ac-submit]");
  var role = $("#ac-role"), site = $("[data-ac-site]");
  var MIN = Number(form.getAttribute("data-ac-min")) || 8, MAX = Number(form.getAttribute("data-ac-max")) || 200;
  var busy = false, touched = {};

  /* ---- Mot de passe : générer, afficher / masquer, repère de robustesse ---- */
  var SETS = ["abcdefghijkmnopqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "!@#$%^&*()-_=+[]{}:,.?"];
  function randInt(n) { var a = new Uint32Array(1), lim = Math.floor(4294967296 / n) * n; do { crypto.getRandomValues(a); } while (a[0] >= lim); return a[0] % n; } // sans biais
  function generate(len) {
    len = len || 24;
    var all = SETS.join(""), out = SETS.map(function (s) { return s.charAt(randInt(s.length)); });
    while (out.length < len) out.push(all.charAt(randInt(all.length)));
    for (var i = out.length - 1; i > 0; i--) { var j = randInt(i + 1), t = out[i]; out[i] = out[j]; out[j] = t; }
    return out.join("");
  }
  function strength(p) {
    if (!p) return { score: 0, label: "Saisissez ou générez un mot de passe." };
    var pool = 0; if (/[a-z]/.test(p)) pool += 26; if (/[A-Z]/.test(p)) pool += 26; if (/\d/.test(p)) pool += 10; if (/[^A-Za-z0-9]/.test(p)) pool += 32;
    var distinct = new Set(p.split("")).size, bits = Math.log2(Math.max(2, pool)) * Math.min(p.length, distinct * 2);
    var score = p.length < MIN ? 1 : bits >= 90 ? 4 : bits >= 60 ? 3 : bits >= 40 ? 2 : 1;
    return { score: score, label: ["", "Faible", "Moyenne", "Forte", "Très forte"][score] + (p.length < MIN ? " — trop court" : "") };
  }
  function paintMeter() {
    var s = strength(pw.value);
    bar.className = "ac-meter-bar is-" + s.score; bar.style.width = (s.score * 25) + "%"; label.textContent = s.label;
    meter.setAttribute("data-score", String(s.score));
  }
  if (gen) { gen.hidden = false; gen.addEventListener("click", function () { pw.value = generate(24); pw.type = "text"; setToggle(true); paintMeter(); changed(); pw.focus(); }); }
  function setToggle(shown) { toggle.setAttribute("aria-pressed", shown ? "true" : "false"); toggle.querySelector("span").textContent = shown ? "Masquer" : "Afficher"; }
  toggle.addEventListener("click", function () { var show = pw.type === "password"; pw.type = show ? "text" : "password"; setToggle(show); });
  // Le mot de passe affiché est remasqué dès que la page est quittée (retour arrière, onglet restauré)
  window.addEventListener("pagehide", function () { pw.type = "password"; });

  /* ---- Validation à la saisie (le serveur revalide tout) ---- */
  var EMAIL = /^[^\s@<>"']{1,64}@[^\s@<>"']+\.[^\s@<>"']{2,}$/, USER = /^[\p{L}\p{N}](?:[\p{L}\p{N} ._'-]*[\p{L}\p{N}])?$/u;
  function err(name, msg) {
    var el = form.querySelector('[data-ac-err="' + name + '"]'), input = form.elements[name];
    if (el) el.textContent = msg || "";
    if (input) { if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid"); }
  }
  function validate(showAll) {
    var u = form.elements.username.value.trim(), e = form.elements.email.value.trim(), w = form.elements.website.value.trim(), p = pw.value, ok = true;
    var m = {};
    if (!u) m.username = "L'identifiant est obligatoire."; else if (u.length < 3 || u.length > 30) m.username = "L'identifiant doit contenir entre 3 et 30 caractères."; else if (!USER.test(u) || /  /.test(u)) m.username = "Lettres, chiffres, espace simple, point, tiret, tiret bas et apostrophe seulement.";
    if (!e) m.email = "L'adresse e-mail est obligatoire."; else if (!EMAIL.test(e)) m.email = "Cette adresse e-mail n'est pas valide (exemple : prenom@exemple.fr).";
    if (w) { try { var url = new URL(w); if (!/^https?:$/.test(url.protocol) || !/\./.test(url.hostname)) throw 0; } catch (x) { m.website = "Indiquez une adresse complète en http:// ou https://."; } }
    if (p) { if (p.length < MIN) m.password = "Le mot de passe doit contenir au moins " + MIN + " caractères."; else if (p.length > MAX) m.password = "Le mot de passe est trop long."; }
    else if (!notify.checked) m.password = "Saisissez un mot de passe ou générez-en un (ou cochez l'envoi d'un e-mail).";
    ["username", "email", "website", "password"].forEach(function (k) { if (m[k]) ok = false; err(k, (showAll || touched[k]) ? m[k] : ""); });
    return ok;
  }
  function refresh() {
    var ok = validate(false);
    hint.textContent = notify.checked ? "Facultatif : laissez vide, la personne choisira son mot de passe grâce au lien reçu par e-mail. Au moins " + MIN + " caractères si vous en saisissez un." : "Au moins " + MIN + " caractères. Le repère de robustesse est indicatif : seule la longueur minimale est exigée.";
    if (site) site.disabled = !role.value;
    if (!busy) status.textContent = "";
    return ok;
  }
  function changed() { paintMeter(); refresh(); }
  ["username", "email", "website"].forEach(function (k) { var el = form.elements[k]; el.addEventListener("input", changed); el.addEventListener("blur", function () { touched[k] = true; changed(); }); });
  pw.addEventListener("input", function () { touched.password = true; changed(); });
  pw.addEventListener("blur", function () { touched.password = true; changed(); });
  notify.addEventListener("change", changed); role.addEventListener("change", changed);

  /* ---- Envoi : une seule soumission, état de chargement ---- */
  form.addEventListener("submit", function (e) {
    if (busy) { e.preventDefault(); return; }
    if (!validate(true)) { e.preventDefault(); var bad = form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); status.textContent = "Corrigez les champs signalés."; status.className = "pl-status is-bad"; return; }
    busy = true; form.setAttribute("aria-busy", "true");
    if (submit) { submit.disabled = true; submit.querySelector(".ac-label-btn").textContent = "Création du compte…"; }
    status.textContent = "Création du compte en cours…"; status.className = "pl-status is-busy";
  });
  // Page restaurée depuis l'historique après un envoi : le formulaire redevient utilisable, le mot de passe est effacé
  window.addEventListener("pageshow", function (ev) { if (ev.persisted) { busy = false; form.removeAttribute("aria-busy"); pw.value = ""; pw.type = "password"; setToggle(false); if (submit) { submit.disabled = false; submit.querySelector(".ac-label-btn").textContent = "Ajouter un compte"; } paintMeter(); } });
  paintMeter(); refresh();
})();
