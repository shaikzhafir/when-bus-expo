#!/bin/sh
# Emulator smoke test: install an APK, put the GPS somewhere known, and check
# that nearby stops load, follow the rider when they move, and refresh after
# the app comes back from the background.
#
#   scripts/emu-smoke.sh [path/to.apk]   (default: newest artifacts/*.apk)
set -eu

emu="${ANDROID_EMU_CLI:-$HOME/Projects/Mobile/android-builder/bin/android-emu}"
pkg=com.zadusz.whenbus
apk="${1:-$(ls -t artifacts/*.apk 2>/dev/null | head -1)}"
[ -r "$apk" ] || { echo "No APK. Run: make build-home KIND=apk && make fetch-home KIND=apk" >&2; exit 2; }

# MacPherson Stn: two same-named stops on opposite sides of Circuit Link.
A_LAT=1.326277 A_LNG=103.890342 A_STOP=70371
# Paya Lebar, ~1 km south.
B_LAT=1.317842 B_LNG=103.892500 B_STOP=81111

fail=0
check() { # check <label> <pattern>
  if "$emu" ui | grep -qE -- "$2"; then
    echo "  ok    $1"
  else
    echo "  FAIL  $1 (no UI text matching /$2/)"
    "$emu" shot "artifacts/emu-fail-$(date +%H%M%S).png" | sed 's/^/        screenshot: /'
    fail=1
  fi
}
wait_for() { # wait_for <seconds> <pattern>
  i=0
  while [ "$i" -lt "$1" ]; do
    "$emu" ui | grep -qE -- "$2" && return 0
    sleep 2
    i=$((i + 2))
  done
  return 0
}

"$emu" start
echo "Installing $apk"
"$emu" install "$apk" >/dev/null
"$emu" geo "$A_LAT" "$A_LNG" >/dev/null
"$emu" restart "$pkg" >/dev/null
# Google's one-time "Location Accuracy" prompt on a fresh AVD.
sleep 4
"$emu" ui | grep -q "Turn on" && "$emu" tap-text "Turn on" >/dev/null
"$emu" geo "$A_LAT" "$A_LNG" >/dev/null

echo "Cold start at MacPherson"
wait_for 30 "$A_STOP"
check "nearest stop is $A_STOP" "· $A_STOP"
check "stop shows distance + compass direction" "[0-9]+ m (N|NE|E|SE|S|SW|W|NW) ·"
check "buses show a destination" "Bus [0-9A-Z]+ to "
check "location accuracy line" "Location ±[0-9]+ m"

echo "Walk to Paya Lebar (no taps)"
"$emu" geo "$B_LAT" "$B_LNG" >/dev/null
wait_for 30 "$B_STOP"
check "list followed the rider to $B_STOP" "· $B_STOP"

echo "Background, move back, resume"
"$emu" home >/dev/null 2>&1 || "$emu" back >/dev/null
sleep 20
"$emu" geo "$A_LAT" "$A_LNG" >/dev/null
"$emu" launch "$pkg" >/dev/null
wait_for 30 "$A_STOP"
check "resume refreshed to $A_STOP" "· $A_STOP"

"$emu" logs "$pkg" | grep -E "FATAL|ReactNativeJS.*Error" && fail=1
[ "$fail" = 0 ] && echo "PASS" || { echo "FAILED"; exit 1; }
