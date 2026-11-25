#!/bin/bash
# Download a Moodle file (a fileurl from the API) to a local path, using the saved app key.
# usage: moodle-file.sh <fileurl> <outpath>
set -euo pipefail
DIR="$HOME/.runi-desk"
KEYFILE="$DIR/moodle-token"
BASE="$(cat "$DIR/moodle-base" 2>/dev/null || echo "https://moodle.runi.ac.il/2027")"
url="${1:?fileurl}"; out="${2:?outpath}"
case "$url" in "$BASE"/*) ;; *) echo "only Moodle file urls" >&2; exit 1 ;; esac
sep='?'; case "$url" in *\?*) sep='&' ;; esac
printf 'url = "%s%stoken=%s"\n' "$url" "$sep" "$(tr -d '\n' < "$KEYFILE")" | curl -sS --max-time 120 -K - -o "$out"
echo "saved $(wc -c < "$out") bytes to $out"
