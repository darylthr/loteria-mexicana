#!/usr/bin/env bash
set -e
SRC="$HOME/Descargas/Cartas"
DST="/home/daryl/Documentos/Projects/loteria/public/cards"
mkdir -p "$DST"

copy_card() {
  local card_id=$1
  local file_prefix=$2
  local file
  file=$(find "$SRC" -maxdepth 1 \( -name "${file_prefix} *" -o -name "${file_prefix}-*" \) 2>/dev/null | head -1)
  if [ -n "$file" ]; then
    cp "$file" "$DST/$(printf '%02d' "$card_id").jpg"
    echo "  card $card_id ← $(basename "$file")"
  else
    echo "  WARNING: no file found for card $card_id (prefix $file_prefix)"
  fi
}

echo "Copying cards 1–42 (file number = card ID)..."
for id in $(seq 1 42); do
  copy_card "$id" "$id"
done

echo "Copying cards 43–53 (file number = card ID + 1, skipping campana at 43)..."
for id in $(seq 43 53); do
  copy_card "$id" $((id + 1))
done

echo "Card 54 (El Catrin): copying from card 4's image..."
cp "$DST/04.jpg" "$DST/54.jpg"
echo "  card 54 ← 04.jpg (El Catrin reuses El Catrín image)"

echo "Done. $(ls "$DST" | wc -l) files in $DST"
