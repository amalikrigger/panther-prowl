#!/usr/bin/env bash
# Copy the files the game ships with into the Think In Bits website repo.
#
#   tools/export.sh ~/Developer/WebstormProjects/think_in_bits
#
# The game lands in <site>/projects/panther-prowl/. Tests and docs stay here.
# This only copies files: committing and pushing the site is the deploy, and
# it's a separate step you do on purpose.

set -euo pipefail

site="${1:?Usage: tools/export.sh <path to the think_in_bits repo>}"
game="$(cd "$(dirname "$0")/.." && pwd)"
target="$site/projects/panther-prowl"

[ -f "$site/projects.html" ] || { echo "No projects.html in $site. Is that the website repo?" >&2; exit 1; }

# Never ship a broken game: the tests check the mazes and the offline file list.
(cd "$game" && node --test >/dev/null) || { echo "Tests failed. Fix them before exporting." >&2; exit 1; }

mkdir -p "$target"
# --delete removes files you deleted from the game, but only inside $target.
rsync -a --delete --exclude '.DS_Store' \
  "$game/index.html" "$game/sw.js" "$game/manifest.webmanifest" \
  "$game/src" "$game/assets" \
  "$target/"

echo "Exported to $target"
