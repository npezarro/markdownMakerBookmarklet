#!/usr/bin/env bash
# Build script for PageCapture combined bookmarklet
# Requires: terser (npm i -g terser)
set -euo pipefail

SRC="combined-clipper.src.js"
MIN="combined-clipper.min.js"
OUT="combined-clipper.bookmarklet.txt"

TERSER="$(command -v terser 2>/dev/null || echo "./node_modules/.bin/terser")"
if [ ! -x "$TERSER" ]; then
  echo "Error: terser not found. Install with: npm install terser"
  exit 1
fi

echo "Minifying ${SRC}..."
"$TERSER" "$SRC" \
  --compress passes=2 \
  --mangle \
  --output "$MIN"

MIN_SIZE=$(wc -c < "$MIN")
echo "Minified size: ${MIN_SIZE} bytes"

echo "Encoding as bookmarklet..."
# URL-encode the minified JS and wrap as javascript: URI
ENCODED=$(python3 -c "
import urllib.parse, sys
with open('${MIN}', 'r') as f:
    code = f.read().strip()
print('javascript:' + urllib.parse.quote(code, safe=\"=&!*'(),-._~:;/?@+\$#[]\"))
")

echo "$ENCODED" > "$OUT"
OUT_SIZE=$(wc -c < "$OUT")
echo "Bookmarklet size: ${OUT_SIZE} bytes"

if [ "$OUT_SIZE" -gt 10000 ]; then
  echo "WARNING: Bookmarklet exceeds 10KB (${OUT_SIZE} bytes). May hit browser URI limits."
else
  echo "OK: Under 10KB limit."
fi

echo ""
echo "Files:"
echo "  Source:      ${SRC}"
echo "  Minified:   ${MIN}"
echo "  Bookmarklet: ${OUT}"
