#!/bin/bash
set -euo pipefail

# DeepSeek free-chat workflow: generate a compact text representation of a Next.js repo.
# Usage:
#   chmod +x generate-context.sh
#   ./generate-context.sh
#
# Output:
#   deepseek-context/project-context.txt

ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="$ROOT/deepseek-context"
OUT_FILE="$OUT_DIR/project-context.txt"

mkdir -p "$OUT_DIR"
: > "$OUT_FILE"

echo "===== PROJECT CONTEXT =====" >> "$OUT_FILE"
echo "Generated: $(date)" >> "$OUT_FILE"
echo "" >> "$OUT_FILE"

echo "===== PROJECT TREE =====" >> "$OUT_FILE"
if command -v tree >/dev/null 2>&1; then
  tree -a -I 'node_modules|.next|.git|deepseek-context' "$ROOT" >> "$OUT_FILE"
else
  find "$ROOT" \
    -not -path "$ROOT/.git*" \
    -not -path "$ROOT/node_modules*" \
    -not -path "$ROOT/.next*" \
    -not -path "$ROOT/deepseek-context*" \
    -print | sed "s#^$ROOT/##" | sort >> "$OUT_FILE"
fi
echo "" >> "$OUT_FILE"

echo "===== CONFIG / METADATA FILES =====" >> "$OUT_FILE"

append_file() {
  local file="$1"
  local rel="${file#$ROOT/}"

  # Never include secrets.
  case "$rel" in
    .env|.env.*|*/.env|*/.env.*)
      return
      ;;
  esac

  echo "" >> "$OUT_FILE"
  echo "===== FILE: $rel =====" >> "$OUT_FILE"
  cat "$file" >> "$OUT_FILE"
  echo "" >> "$OUT_FILE"
}

# High-value project metadata.
for f in \
  "$ROOT/package.json" \
  "$ROOT/tsconfig.json" \
  "$ROOT/next.config.js" \
  "$ROOT/next.config.mjs" \
  "$ROOT/next.config.ts" \
  "$ROOT/eslint.config.mjs" \
  "$ROOT/eslint.config.js" \
  "$ROOT/.eslintrc.json" \
  "$ROOT/.gitignore" \
  "$ROOT/README.md"
do
  [ -f "$f" ] && append_file "$f"
done

echo "" >> "$OUT_FILE"
echo "===== SOURCE FILES =====" >> "$OUT_FILE"

# Include source/config text files that are useful to DeepSeek.
# Exclude generated/vendor/secret/binary-heavy paths.
find "$ROOT" -type f \
  \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \
     -o -name '*.json' -o -name '*.css' -o -name '*.scss' \
     -o -name '*.md' -o -name '*.mjs' -o -name '*.cjs' \
     -o -name '*.sql' -o -name '*.graphql' \) \
  -not -path "$ROOT/node_modules/*" \
  -not -path "$ROOT/.next/*" \
  -not -path "$ROOT/.git/*" \
  -not -path "$ROOT/deepseek-context/*" \
  -not -path "$ROOT/coverage/*" \
  -not -path "$ROOT/dist/*" \
  -not -path "$ROOT/build/*" \
  -not -name '.env' \
  -not -name '.env.*' \
  -print0 | sort -z | while IFS= read -r -d '' f; do
    append_file "$f"
  done

SIZE=$(wc -c < "$OUT_FILE" | tr -d ' ')
echo "" >> "$OUT_FILE"
echo "===== END PROJECT CONTEXT =====" >> "$OUT_FILE"
echo "Bytes: $SIZE" >> "$OUT_FILE"

echo
echo "Created:"
echo "  $OUT_FILE"
echo
echo "Size: $SIZE bytes"
echo
echo "IMPORTANT: Review the file before uploading it to DeepSeek."
echo "Do NOT upload API keys, passwords, tokens, or .env files."
