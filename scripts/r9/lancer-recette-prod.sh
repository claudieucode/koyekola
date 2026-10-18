#!/usr/bin/env bash
# R9-5 — lanceur SSH « v2 » du diagnostic / de la copie de la base de production, sans rien installer sur le serveur et SANS modifier la branche r8-recette-outil :
# l'outil lui-même (recette-r8-preparer.js) est lu dans cette branche par « git show » et envoyé par le tube ssh. Corrige le lanceur d'origine : (1) la sortie d'erreur du serveur est conservée (l'ancien lanceur ne
# gardait que la sortie standard, donc un échec de Node passait inaperçu), (2) un Node 22 ou plus récent est CHERCHÉ sur le serveur (chemins Hostinger / nvm / nodevenv) au lieu de supposer qu'il est dans le PATH,
# (3) un rapport complet est enregistré dans ~/RECETTE-R8-<date>/ sur le Mac (dossier privé ; rien n'est supprimé).
#   scripts/r9/lancer-recette-prod.sh diagnostic <utilisateur@serveur> [-p PORT] [--source CHEMIN_SERVEUR] [--simuler]
#   scripts/r9/lancer-recette-prod.sh assistant  <utilisateur@serveur> [-p PORT] [--source CHEMIN_SERVEUR] [--simuler]   (diagnostic, puis VOUS tapez OUI pour créer la copie, la télécharger et la vérifier)
# diagnostic = aucune écriture (serveur ou Mac, hors le rapport local). La base vivante n'est ouverte qu'en LECTURE SEULE. Aucune migration, aucune recette, aucune suppression.
set -euo pipefail
MODE="${1:-}"; HOST="${2:-}"; shift 2 || true
PORT=""; SOURCE='$HOME/koyekola-data/KOYEKOLA.db'; DRY=0
while [ $# -gt 0 ]; do case "$1" in -p) PORT="$2"; shift 2;; --source) SOURCE="$2"; shift 2;; --simuler) DRY=1; shift;; *) echo "Option inconnue : $1" >&2; exit 2;; esac; done
case "$MODE" in diagnostic|assistant) ;; *) echo "Usage : $0 <diagnostic|assistant> <utilisateur@serveur> [-p PORT] [--source CHEMIN] [--simuler]" >&2; exit 2;; esac
[ -n "$HOST" ] || { echo "Indiquez la connexion SSH (utilisateur@serveur)." >&2; exit 2; }
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../.." && pwd)"
TOOL="$(mktemp "${TMPDIR:-/tmp}/preparer-XXXXXX")"; git -C "$REPO" show r8-recette-outil:scripts/recette-r8-preparer.js > "$TOOL" || { echo "Outil introuvable dans la branche r8-recette-outil." >&2; exit 2; }
STAMP="$(date +%Y%m%d-%H%M%S)-$$"; LOCAL_DIR="$HOME/RECETTE-R8-$STAMP"; REMOTE_DIR="\$HOME/RECETTE-R8-$STAMP"
mkdir -m 700 "$LOCAL_DIR"; REPORT="$LOCAL_DIR/diagnostic.txt"
CTL="$(mktemp -d "${TMPDIR:-/tmp}/ssh-recette.XXXXXX")"
SSH=(ssh -o ControlMaster=auto -o "ControlPath=$CTL/c" -o ControlPersist=120 -o ServerAliveInterval=15 -o StrictHostKeyChecking=ask); [ -n "$PORT" ] && SSH+=(-p "$PORT")
# Commande distante : cherche un Node >= 22 puis lui envoie l'outil (stdin) ; messages d'erreur explicites et code de sortie propre
remote() { cat <<EOS
bash -lc 'for c in "\$(command -v node 2>/dev/null)" /opt/alt/alt-nodejs24/root/usr/bin/node /opt/alt/alt-nodejs22/root/usr/bin/node \$HOME/nodevenv/*/*/*/bin/node \$HOME/.nvm/versions/node/*/bin/node /usr/local/bin/node; do [ -n "\$c" ] && [ -x "\$c" ] || continue; v=\$("\$c" -p "process.versions.node.split(\".\")[0]" 2>/dev/null); seen="\$seen \$c(v\$v)"; if [ "\${v:-0}" -ge 22 ]; then echo "Node utilisé sur le serveur : \$c (v\$v)"; exec "\$c" - $1; fi; done; echo "ERREUR : aucun Node 22 ou plus récent trouvé sur le serveur. Trouvés :\$seen" >&2; exit 3'
EOS
}
run() { if [ "$DRY" = 1 ]; then echo "[simulation] $*"; else "$@"; fi; }
echo "=== Diagnostic en lecture seule sur le serveur (rapport : $REPORT) ==="
set +e
{ run "${SSH[@]}" "$HOST" "$(remote "diagnostic --source \"$SOURCE\"")" < "$TOOL" 2>&1; echo "CODE_SORTIE=$?"; } | sed 's/\x1b\[[0-9;]*m//g' | tee "$REPORT"
set -e
if [ "$DRY" = 1 ]; then echo "[simulation] fin"; exit 0; fi
grep -q "CODE_SORTIE=0" "$REPORT" || { echo; echo "ARRÊT : le diagnostic n'a pas abouti (voir ci-dessus / $REPORT). Rien n'a été modifié." >&2; exit 1; }
grep -q "DIAGNOSTIC" "$REPORT" || { echo "ARRÊT : aucun compte rendu de diagnostic reçu (seulement le message d'accueil du serveur)." >&2; exit 1; }
[ "$MODE" = "diagnostic" ] && { echo; echo "Diagnostic terminé : rien n'a été écrit sur le serveur. Rapport : $REPORT"; exit 0; }
echo; echo "L'étape suivante CRÉE une copie de la base dans ~/RECETTE-R8-$STAMP sur le serveur (base vivante en lecture seule), puis la télécharge sur ce Mac."
read -r -p "Tapez OUI (en majuscules) pour autoriser la création de cette copie, ou Entrée pour arrêter : " REPONSE </dev/tty
[ "$REPONSE" = "OUI" ] || { echo "Arrêt : aucune copie créée."; exit 0; }
set +e; { "${SSH[@]}" "$HOST" "$(remote "copie --source \"$SOURCE\" --dest \"$REMOTE_DIR\" --confirmer-copie")" < "$TOOL" 2>&1; echo "CODE_SORTIE=$?"; } | sed 's/\x1b\[[0-9;]*m//g' | tee "$LOCAL_DIR/copie.txt"; set -e
grep -q "CODE_SORTIE=0" "$LOCAL_DIR/copie.txt" || { echo "ARRÊT : la copie n'a pas abouti (voir $LOCAL_DIR/copie.txt)." >&2; exit 1; }
"${SSH[@]}" "$HOST" "cat \"$REMOTE_DIR/RAPPORT-copie.json\"" > "$LOCAL_DIR/RAPPORT-copie.json"; "${SSH[@]}" "$HOST" "cat \"$REMOTE_DIR/copie-A.db\"" > "$LOCAL_DIR/copie-A.db"
EXPECTED="$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).sha256)' "$LOCAL_DIR/RAPPORT-copie.json")"; ACTUAL="$(shasum -a 256 "$LOCAL_DIR/copie-A.db" | cut -d' ' -f1)"
[ "$EXPECTED" = "$ACTUAL" ] || { echo "ARRÊT : empreinte différente après téléchargement ($ACTUAL ≠ $EXPECTED). Rien n'est utilisable." >&2; exit 1; }
cp "$LOCAL_DIR/copie-A.db" "$LOCAL_DIR/copie-B.db"; echo "Empreinte sha256 identique au serveur : $ACTUAL"
node "$TOOL" verifier "$LOCAL_DIR/copie-A.db"
echo; echo "TERMINÉ : copie vérifiée dans $LOCAL_DIR. La recette R8/R9 n'est PAS lancée : elle attend votre autorisation distincte."
