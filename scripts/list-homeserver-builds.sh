#!/bin/sh
set -eu

homeserver_root="${HOMESERVER_ROOT:-$HOME/homeserver}"
remote_root="${WHEN_BUS_REMOTE_ROOT:-/srv/when-bus-builder}"
discovery="$homeserver_root/lan-devices/find-rpi.sh"

if [ ! -x "$discovery" ]; then
  echo "Homeserver discovery helper not found at $discovery" >&2
  exit 2
fi

ip="$("$discovery")"

ssh -o BatchMode=yes root@"$ip" "REMOTE_ROOT='$remote_root' sh -s" <<'REMOTE_SCRIPT'
set -eu

artifacts="$REMOTE_ROOT/artifacts"

if [ ! -d "$artifacts" ]; then
  echo "No artifacts directory exists at $artifacts" >&2
  exit 2
fi

printf '%-16s  %-8s  %-7s  %-11s  %s\n' "Created" "Version" "Code" "Size" "Artifact"

find "$artifacts" -maxdepth 1 -type f -name 'when-bus-production-*.aab' \
  -printf '%T@ %TY-%Tm-%Td %TH:%TM %s %f\n' \
  | sort -nr \
  | while read -r _ date time size name; do
      version="-"
      code="-"
      metadata="$artifacts/$name.metadata"

      if [ -r "$metadata" ]; then
        version="$(sed -n 's/^VERSION_NAME=//p' "$metadata" | sed -n '1p')"
        code="$(sed -n 's/^ANDROID_VERSION_CODE=//p' "$metadata" | sed -n '1p')"
        version="${version:-"-"}"
        code="${code:-"-"}"
      fi

      printf '%-16s  %-8s  %-7s  %10s  %s\n' "$date $time" "$version" "$code" "$size" "$name"
    done
REMOTE_SCRIPT
