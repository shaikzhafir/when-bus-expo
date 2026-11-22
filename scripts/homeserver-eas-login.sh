#!/bin/sh
set -eu

homeserver_root="${HOMESERVER_ROOT:-$HOME/homeserver}"
remote_root="${WHEN_BUS_REMOTE_ROOT:-/srv/when-bus-builder}"
discovery="$homeserver_root/lan-devices/find-rpi.sh"
image="${WHEN_BUS_ANDROID_EAS_IMAGE:-when-bus-eas-android:expo54}"

if [ ! -x "$discovery" ]; then
  echo "Homeserver discovery helper not found at $discovery" >&2
  exit 2
fi

ip="$($discovery)"

ssh -o BatchMode=yes root@"$ip" \
  "install -d -m 0755 '$remote_root/source/docker' '$remote_root/expo-home'; install -d -m 0700 '$remote_root/secrets'"

rsync -a --delete docker/android-eas/ root@"$ip":"$remote_root/source/docker/android-eas/"

ssh -o BatchMode=yes root@"$ip" \
  "command -v docker >/dev/null || { echo 'Docker is required on the homeserver.' >&2; exit 2; }; docker build -t '$image' '$remote_root/source/docker/android-eas'"

token="${EXPO_TOKEN:-}"
local_expo_state="${EXPO_HOME:-$HOME/.expo}/state.json"

if [ -z "$token" ] && npx --yes eas-cli@latest whoami --non-interactive >/dev/null 2>&1 && [ -r "$local_expo_state" ]; then
  rsync -a "$local_expo_state" root@"$ip":"$remote_root/expo-home/state.json"
  ssh -o BatchMode=yes root@"$ip" "chmod 600 '$remote_root/expo-home/state.json'"
  ssh -o BatchMode=yes root@"$ip" \
    "docker run --rm --mount type=bind,src='$remote_root/expo-home',dst=/root/.expo --entrypoint eas '$image' whoami --non-interactive"
  echo "Homeserver Expo auth copied from local Expo state to root@$ip:$remote_root/expo-home/state.json"
  exit 0
fi

if [ -z "$token" ] && [ -t 0 ]; then
  printf '%s\n' \
    "Create an Expo access token, then paste it here." \
    "Token page: https://expo.dev/accounts/[account]/settings/access-tokens" \
    ""
  printf 'EXPO_TOKEN: '
  stty -echo
  IFS= read -r token
  stty echo
  printf '\n'
fi

if [ -z "$token" ]; then
  echo "No local Expo auth state was usable. Set EXPO_TOKEN or run this script from an interactive terminal." >&2
  exit 2
fi

printf 'EXPO_TOKEN=%s\n' "$token" | ssh -o BatchMode=yes root@"$ip" \
  "umask 077; cat > '$remote_root/secrets/expo.env'"

ssh -o BatchMode=yes root@"$ip" \
  "docker run --rm --env-file '$remote_root/secrets/expo.env' --entrypoint eas '$image' whoami"

echo "Homeserver Expo token saved to root@$ip:$remote_root/secrets/expo.env"
