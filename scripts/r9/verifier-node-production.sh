#!/usr/bin/env bash
# Version RÉELLE de Node.js du PROCESSUS de production (pas celle du terminal SSH) — LECTURE SEULE : lit /proc et exécute « node -v » ; ne modifie rien, ne redémarre rien, n'affiche aucune variable d'environnement.
#   scripts/r9/verifier-node-production.sh <utilisateur@serveur> [-p PORT]
set -euo pipefail
HOST="${1:-}"; shift 2>/dev/null || true; PORT=""; while [ $# -gt 0 ]; do case "$1" in -p) PORT="$2"; shift 2;; *) echo "Option inconnue : $1" >&2; exit 2;; esac; done
[ -n "$HOST" ] || { echo "Usage : $0 <utilisateur@serveur> [-p PORT]" >&2; exit 2; }
SSH=(ssh -o StrictHostKeyChecking=ask); [ -n "$PORT" ] && SSH+=(-p "$PORT")
"${SSH[@]}" "$HOST" 'bash -s' <<'REMOTE'
echo "Utilisateur : $(id -un)"
echo "Node du TERMINAL SSH (ce n'est pas forcément celui de l'application) : $(command -v node 2>/dev/null || echo aucun) $(node -v 2>/dev/null || true)"
echo
echo "--- Processus Node de l'application (lecture de /proc) ---"
found=0
for p in $(pgrep -u "$(id -u)" -f 'node|lsnode|passenger|server\.js' 2>/dev/null); do
  exe=$(readlink "/proc/$p/exe" 2>/dev/null) || continue
  case "$exe" in *node*) ;; *) continue;; esac
  cmd=$(tr '\0' ' ' < "/proc/$p/cmdline" 2>/dev/null | cut -c1-180)
  echo "PID $p · actif depuis $(ps -o etime= -p "$p" 2>/dev/null | tr -d ' ') · binaire : $exe · VERSION : $("$exe" -v 2>/dev/null) · commande : $cmd"
  found=1
done
[ "$found" = 1 ] || echo "Aucun processus Node trouvé pour cet utilisateur (application inactive, ou processus invisibles depuis cette session SSH)."
echo
echo "--- Versions de Node installées (information) ---"
ls -d /opt/alt/alt-nodejs*/root/usr/bin/node "$HOME"/nodevenv/*/*/*/bin/node 2>/dev/null || echo "(aucun chemin connu trouvé)"
REMOTE
