#!/bin/bash
# Re-vendor Pit Bike Rally into the lucid-winds portal with VERSION-STAMPED
# URLs. Hostinger ignores no-cache headers (modules observed cached 4h-7d),
# which served players frozen mixed-version builds — so every deploy gets a
# fresh src-<hash>/ dir and ?v=<hash> on css/json/img fetches. Old URLs simply
# stop being referenced; no cache purge needed.
set -euo pipefail
SRC=/tmp/claude-1000/-workspaces-lucid-winds/5799e815-cf72-4e32-97b5-2d7c23882cd0/scratchpad/skywolf-pitbike-rally
DST=/workspaces/lucid-winds/satellites/pitbike-rally
HASH=$(git -C "$SRC" rev-parse --short HEAD)

rm -rf "$DST"
mkdir -p "$DST"/{src-$HASH,css,data/tracks,assets/art/bike,assets/art/ui,assets/terrain,assets/bg}

cp "$SRC"/index.html "$DST"/
cp "$SRC"/css/game.css "$DST"/css/
cp "$SRC"/src/*.js "$DST"/src-$HASH/
cp "$SRC"/data/*.json "$DST"/data/
cp "$SRC"/data/tracks/*.json "$DST"/data/tracks/
cp "$SRC"/assets/atlas.bin "$SRC"/assets/atlas.json "$SRC"/assets/favicon.png "$DST"/assets/

cp "$SRC"/assets/art/bike/bike_ride_f01.png \
   "$SRC"/assets/art/bike/bikeview_ride_a.png \
   "$SRC"/assets/art/bike/bikeview_downed.png \
   "$SRC"/assets/art/bike/bikeview_victory_f01.png "$DST"/assets/art/bike/
for n in engine exhaust carb forks tire sprocket frame brakes nitro armor; do
  cp "$SRC"/assets/art/ui/ui_part_$n.png "$DST"/assets/art/ui/
done
cp "$SRC"/assets/art/ui/ui_medal_gold.png "$SRC"/assets/art/ui/ui_medal_silver.png \
   "$SRC"/assets/art/ui/ui_medal_bronze.png "$SRC"/assets/art/ui/ui_logo_lockup.png \
   "$DST"/assets/art/ui/
for n in terrain_dirt_loam terrain_mud_a terrain_sand ground_meadow \
         ground_desert ground_prairie ground_canyon ground_stadium \
         ground_swamp ground_ridge ground_storm; do
  cp "$SRC"/assets/terrain/$n.jpg "$DST"/assets/terrain/
done
cp "$SRC"/assets/bg/bg_menu.jpg "$SRC"/assets/bg/bg_garage.jpg "$SRC"/assets/bg/bg_podium.jpg "$DST"/assets/bg/

# stamp the deploy hash into every referencing URL
sed -i "s|src=\"src/main.js\"|src=\"src-$HASH/main.js?v=$HASH\"|" "$DST"/index.html
sed -i "s|href=\"css/game.css\"|href=\"css/game.css?v=$HASH\"|" "$DST"/index.html
sed -i "s|src=\"assets/art/ui/ui_logo_lockup.png\"|src=\"assets/art/ui/ui_logo_lockup.png?v=$HASH\"|" "$DST"/index.html
sed -i "s|src=\"assets/art/bike/bike_ride_f01.png\"|src=\"assets/art/bike/bike_ride_f01.png?v=$HASH\"|" "$DST"/index.html
sed -i "s|src=\"assets/art/bike/bikeview_ride_a.png\"|src=\"assets/art/bike/bikeview_ride_a.png?v=$HASH\"|" "$DST"/index.html
sed -i "s|src=\"assets/art/bike/bikeview_victory_f01.png\"|src=\"assets/art/bike/bikeview_victory_f01.png?v=$HASH\"|" "$DST"/index.html
sed -i "s|ART_V = '[^']*'|ART_V = '$HASH'|" "$DST"/src-$HASH/sprites.js
sed -i "s|?v=20260704[a-z]*)|?v=$HASH)|g" "$DST"/css/game.css

grep -c "$HASH" "$DST"/index.html "$DST"/src-$HASH/sprites.js "$DST"/css/game.css

# headers are belt-and-suspenders only now (the host ignores them anyway)
cat > "$DST"/.htaccess << 'EOF'
# Best-effort revalidation; real cache safety comes from version-stamped URLs
# (src-<hash>/ + ?v=<hash>) because this host ignores these headers at will.
<FilesMatch "\.(js|json|css|html)$">
  Header set Cache-Control "no-cache, must-revalidate"
</FilesMatch>
EOF

du -sh "$DST"
find "$DST" -type f | wc -l
echo "deploy hash: $HASH"
