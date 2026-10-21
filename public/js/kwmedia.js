// KOLAKISA Médias — noyau partagé (page « Médias » du CMS, sélecteur MediaPicker, éditeur de pages) : appels à l'API de la
// médiathèque, envoi d'un fichier avec progression, formats d'affichage, copie d'adresse. Une seule source : aucune
// logique de médiathèque n'est recopiée ailleurs.
(function () {
  var BASE = "/marketing/site-web/mediatheque";
  var TYPE_LABELS = { image: "Image", video: "Vidéo", audio: "Audio", pdf: "PDF", document: "Document" };

  // MEDIA-01 : chaque site a SA médiathèque. Le site de la page (ou de l'éditeur) accompagne CHAQUE appel ; le serveur le vérifie contre les droits de la personne
  // (il n'est jamais cru sur parole) : sans lui, un accès limité à un site est refusé et l'équipe tomberait dans la médiathèque commune.
  function site() {
    var m = document.querySelector('meta[name="mk-media-site"]');
    var v = m && m.getAttribute("content");
    if (!v) { var f = document.getElementById("be-form"); v = f && f.getAttribute("data-site"); }
    if (!v) { var q = /[?&]site=(\d{1,12})(?:&|$)/.exec(window.location.search); v = q && q[1]; }
    return /^\d{1,12}$/.test(String(v || "")) ? String(v) : "";
  }
  function withSite(url) { var s = site(); return s && !/[?&]site=/.test(url) ? url + (url.indexOf("?") >= 0 ? "&" : "?") + "site=" + s : url; }

  // Réponse JSON ou erreur lisible (jamais de « réussite » sur une réponse en échec)
  function parse(res) {
    return res.text().then(function (text) {
      var data = null;
      try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
      if (!res.ok) {
        var message = (data && data.error && data.error.message) ||
          (res.status === 403 ? "Vous n'avez pas la permission d'effectuer cette action." : res.status === 401 ? "Votre session a expiré : reconnectez-vous." : res.status >= 500 ? "Erreur du serveur : réessayez dans un instant." : "Requête refusée (" + res.status + ").");
        var err = new Error(message); err.status = res.status; throw err;
      }
      return data;
    });
  }
  function request(method, url, body) {
    var opts = { method: method, credentials: "same-origin", headers: { Accept: "application/json" } };
    if (body !== undefined) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
    return fetch(withSite(url), opts).then(parse, function () { throw new Error("Connexion impossible : vérifiez votre réseau, puis réessayez."); });
  }
  function query(params) {
    var q = [];
    Object.keys(params || {}).forEach(function (k) { if (params[k] !== undefined && params[k] !== null && params[k] !== "" && params[k] !== false) q.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k] === true ? "1" : params[k])); });
    return q.length ? "?" + q.join("&") : "";
  }

  // Envoi d'UN fichier (multipart) avec progression ; retourne { promise, abort }
  function upload(file, opts) {
    opts = opts || {};
    var xhr = new XMLHttpRequest();
    var promise = new Promise(function (resolve, reject) {
      var fd = new FormData(); fd.append("file", file, file.name);
      if (opts.alt) fd.append("alt", opts.alt);
      xhr.open("POST", withSite(BASE + "/televerser"));
      xhr.setRequestHeader("Accept", "application/json");
      xhr.withCredentials = true;
      xhr.upload.onprogress = function (e) { if (e.lengthComputable && opts.onProgress) opts.onProgress(e.loaded / e.total); };
      xhr.onload = function () {
        var data = null; try { data = JSON.parse(xhr.responseText); } catch (e) { data = null; }
        if (xhr.status >= 200 && xhr.status < 300 && data && data.media) return resolve(data.media);
        var err = new Error((data && data.error && data.error.message) || (xhr.status === 403 ? "Vous n'avez pas la permission d'envoyer des fichiers." : xhr.status === 413 ? "Le fichier dépasse la taille maximale autorisée." : xhr.status >= 500 ? "Erreur du serveur : réessayez dans un instant." : "Envoi refusé (" + xhr.status + ")."));
        err.status = xhr.status; reject(err);
      };
      xhr.onerror = function () { var err = new Error("Connexion interrompue : le fichier n'a pas été enregistré. Réessayez."); err.network = true; reject(err); };
      xhr.onabort = function () { var err = new Error("Envoi annulé."); err.aborted = true; reject(err); };
      xhr.send(fd);
    });
    return { promise: promise, abort: function () { xhr.abort(); } };
  }

  function fmtSize(n) { n = Number(n) || 0; return n >= 1048576 ? (n / 1048576).toFixed(1).replace(".", ",") + " Mo" : n >= 1024 ? Math.round(n / 1024) + " Ko" : n + " o"; }
  function fmtDate(v) { if (!v) return "—"; var p = String(v).slice(0, 10).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : String(v); }
  // Libellé court affiché sur la vignette d'un fichier qui n'est pas une image (extension déduite du type réel)
  function badge(m) { var ext = String(m.path || "").split(".").pop().toUpperCase(); return ext.length <= 5 ? ext : (TYPE_LABELS[m.type] || "FICHIER").toUpperCase(); }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        var ok = document.execCommand("copy"); document.body.removeChild(ta);
        ok ? resolve() : reject(new Error("copie impossible"));
      } catch (e) { reject(e); }
    });
  }
  function absolute(path) { return window.location.origin + path; }
  function toast(text, type) { if (window.mkToast) window.mkToast(text, type); }

  window.KWMedia = {
    BASE: BASE, TYPE_LABELS: TYPE_LABELS, site: site, withSite: withSite,
    list: function (params) { return request("GET", BASE + "/liste.json" + query(params)); },
    detail: function (id) { return request("GET", BASE + "/" + id + ".json"); },
    update: function (id, fields) { return request("POST", BASE + "/" + id, fields).then(function (r) { return r.media; }); },
    trash: function (id) { return request("POST", BASE + "/" + id + "/corbeille", {}).then(function (r) { return r.media; }); },
    restore: function (id) { return request("POST", BASE + "/" + id + "/restaurer", {}).then(function (r) { return r.media; }); },
    purge: function (id) { return request("POST", BASE + "/" + id + "/supprimer", {}); },
    bulk: function (action, ids) { return request("POST", BASE + "/actions", { action: action, ids: ids }); },
    upload: upload, fmtSize: fmtSize, fmtDate: fmtDate, badge: badge, copy: copy, absolute: absolute, toast: toast,
  };
})();
