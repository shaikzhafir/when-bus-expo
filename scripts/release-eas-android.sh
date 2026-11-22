#!/bin/sh
set -eu

eas="${EAS:-npx --yes eas-cli@latest}"
profile="${EAS_PROFILE:-production}"
platform=android
version="${VERSION:-}"
base_code="${EAS_BASE_CODE:-${CODE:-}}"

homeserver_root="${HOMESERVER_ROOT:-$HOME/homeserver}"
remote_root="${WHEN_BUS_REMOTE_ROOT:-/srv/when-bus-builder}"
discovery="$homeserver_root/lan-devices/find-rpi.sh"

if [ -n "$version" ]; then
  node scripts/bump-version.js "$version"
else
  version="$(node -p "require('./app.json').expo.version")"
  echo "Using current app version: $version"
fi

if [ -z "$base_code" ]; then
  if [ ! -x "$discovery" ]; then
    echo "Homeserver discovery helper not found at $discovery" >&2
    echo "Set EAS_BASE_CODE=<last-used-android-version-code> explicitly to skip homeserver discovery." >&2
    exit 2
  fi

  ip="$("$discovery")"
  latest_metadata="$(ssh -o BatchMode=yes root@"$ip" "find '$remote_root/artifacts' -maxdepth 1 -type f -name 'when-bus-production-*.aab.metadata' -printf '%T@ %p\n' | sort -nr | sed -n '1s/^[^ ]* //p'")"

  if [ -n "$latest_metadata" ]; then
    base_code="$(ssh -o BatchMode=yes root@"$ip" "sed -n 's/^ANDROID_VERSION_CODE=//p' '$latest_metadata' | sed -n '1p'")"
  else
    next_remote_code="$(ssh -o BatchMode=yes root@"$ip" "sed -n 's/^ANDROID_VERSION_CODE=//p' '$remote_root/secrets/android-signing.env' | sed -n '1p'")"
    case "$next_remote_code" in
      *[!0-9]*|'')
        echo "Could not determine homeserver Android version code." >&2
        exit 2
        ;;
    esac
    base_code=$((next_remote_code - 1))
  fi
fi

case "$base_code" in
  *[!0-9]*|'')
    echo "CODE must be a positive integer, got: $base_code" >&2
    exit 2
    ;;
esac

remote_code="$($eas build:version:get --platform "$platform" --profile "$profile" --json --non-interactive 2>/dev/null | sed -n 's/.*"versionCode": "\([0-9][0-9]*\)".*/\1/p' | tail -1 || true)"

case "$remote_code" in
  *[!0-9]*)
    remote_code=""
    ;;
esac

if [ -n "$remote_code" ] && [ "$remote_code" -gt "$base_code" ]; then
  base_code="$remote_code"
fi

next_code=$((base_code + 1))

npm run lint

echo "Setting EAS remote Android versionCode base to $base_code."
echo "With eas.json autoIncrement=true, the EAS cloud build should use versionCode $next_code."

if [ "${EAS_RELEASE_DRY_RUN:-0}" = 1 ]; then
  echo "Dry run: would run build:version:set and EAS cloud build with auto-submit."
  exit 0
fi

export EAS_SET_VERSION_COMMAND="$eas build:version:set --platform $platform --profile $profile"
export EAS_SET_VERSION_CODE="$base_code"
expect <<'EXPECT_SCRIPT'
set timeout -1
spawn {*}$env(SHELL) -lc $env(EAS_SET_VERSION_COMMAND)
expect {
  -re {What version would you like to set\?} {
    send "$env(EAS_SET_VERSION_CODE)\r"
    exp_continue
  }
  eof
}
set status [lindex [wait] 3]
exit $status
EXPECT_SCRIPT

if [ "${EAS_RELEASE_SET_VERSION_ONLY:-0}" = 1 ]; then
  echo "Set-version-only mode: stopping before EAS cloud build."
  exit 0
fi

$eas build \
  --profile "$profile" \
  --platform "$platform" \
  --auto-submit-with-profile "$profile" \
  --wait
