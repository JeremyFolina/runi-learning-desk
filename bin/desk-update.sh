#!/bin/bash
# שולחן הלמידה: checks for and downloads a newer version from the project's GitHub repository.
#   desk-update.sh check   -> installed=<v> latest=<v> update=yes|no
#   desk-update.sh fetch   -> prints the folder of the downloaded new version
# Reads the repository ("owner/name") from ~/.runi-desk/repo and the installed version from ~/.runi-desk/version.
set -euo pipefail
HOME_DIR="$HOME/.runi-desk"
REPO=$(tr -d ' \n' < "$HOME_DIR/repo" 2>/dev/null || true)
[[ "$REPO" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || { echo "error=no-repo"; exit 1; }
CUR=$(tr -d ' \n' < "$HOME_DIR/version" 2>/dev/null || echo 0.0.0)

newer() { # true if $1 > $2
  [ "$1" != "$2" ] && [ "$(printf '%s\n%s\n' "$1" "$2" | sort -t. -k1,1n -k2,2n -k3,3n | tail -1)" = "$1" ]
}

case "${1:-}" in
  check)
    LATEST=$(curl -fsS --max-time 20 "https://raw.githubusercontent.com/$REPO/main/VERSION" | tr -d ' \n') || { echo "error=network"; exit 1; }
    [[ "$LATEST" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "error=bad-version"; exit 1; }
    if newer "$LATEST" "$CUR"; then U=yes; else U=no; fi
    echo "installed=$CUR latest=$LATEST update=$U"
    ;;
  fetch)
    OUT="$HOME_DIR/update/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$OUT"
    curl -fsSL --max-time 120 "https://codeload.github.com/$REPO/tar.gz/refs/heads/main" -o "$OUT/src.tgz"
    tar -xzf "$OUT/src.tgz" -C "$OUT" --strip-components 1
    rm -f "$OUT/src.tgz"
    [ -f "$OUT/SKILL.md" ] && [ -f "$OUT/VERSION" ] && [ -d "$OUT/site" ] || { echo "error=bad-package"; exit 1; }
    echo "$OUT"
    ;;
  *) echo "usage: desk-update.sh check|fetch"; exit 2 ;;
esac
