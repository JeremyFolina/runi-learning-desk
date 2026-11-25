#!/bin/bash
# Read-only call to the Reichman Moodle API with the saved app key.
# usage: moodle.sh <wsfunction> [name=value ...]
# Prints the JSON reply. The key is read from ~/.runi-desk/moodle-token and never printed.
# The Moodle address (it changes every academic year) is in ~/.runi-desk/moodle-base.
set -euo pipefail
DIR="$HOME/.runi-desk"
KEYFILE="$DIR/moodle-token"
BASE="$(cat "$DIR/moodle-base" 2>/dev/null || echo "https://moodle.runi.ac.il/2027")"
[ -s "$KEYFILE" ] || { echo '{"errorcode":"nokey"}'; exit 0; }
fn="${1:?wsfunction}"; shift
case "$fn" in
  *_get_*|*_get|core_webservice_get_site_info|*_search_*|*_view_*) ;;
  *) echo '{"errorcode":"readonly_only"}'; exit 0 ;;
esac
args=()
for a in "$@"; do args+=(--data-urlencode "$a"); done
printf 'wstoken=%s' "$(tr -d '\n' < "$KEYFILE")" | curl -sS --max-time 90 \
  "$BASE/webservice/rest/server.php" \
  -d moodlewsrestformat=json -d "wsfunction=$fn" --data @- "${args[@]+"${args[@]}"}"
