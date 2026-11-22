#!/bin/sh
set -eu

source="${1:-}"
submit_profile="${EAS_SUBMIT_PROFILE:-production}"

run_submit() {
  if [ "${EAS_SUBMIT_DRY_RUN:-0}" = 1 ]; then
    printf 'Would run:'
    printf ' %s' "$@"
    printf '\n'
    return
  fi

  "$@"
}

case "$source" in
  eas)
    build_json="$(mktemp)"
    trap 'rm -f "$build_json"' EXIT
    npx --yes eas-cli@latest build:list \
      --platform android \
      --build-profile production \
      --status finished \
      --limit 1 \
      --json \
      --non-interactive > "$build_json"
    build_id="$(jq -r '.[0].id // empty' "$build_json")"
    rm -f "$build_json"
    trap - EXIT

    if [ -z "$build_id" ]; then
      echo "No finished Android EAS build exists for the production profile." >&2
      exit 2
    fi

    echo "Selected EAS production build: $build_id"
    run_submit npx --yes eas-cli@latest submit \
      --profile "$submit_profile" \
      --platform android \
      --id "$build_id"
    ;;
  homeserver)
    homeserver_root="${HOMESERVER_ROOT:-$HOME/homeserver}"
    remote_root="${WHEN_BUS_REMOTE_ROOT:-/srv/when-bus-builder}"
    discovery="$homeserver_root/lan-devices/find-rpi.sh"
    local_artifacts="${ANDROID_ARTIFACTS_DIR:-$PWD/artifacts/android}"

    if [ ! -x "$discovery" ]; then
      echo "Homeserver discovery helper not found at $discovery" >&2
      exit 2
    fi

    ip="$($discovery)"
    latest="$(ssh -o BatchMode=yes root@"$ip" \
      "find '$remote_root/artifacts' -maxdepth 1 -type f -name 'when-bus-production-*.aab' -printf '%T@ %f\\n' | sort -nr | sed -n '1s/^[^ ]* //p'")"

    case "$latest" in
      when-bus-production-*.aab) ;;
      '')
        echo "No production AAB exists in $remote_root/artifacts on the homeserver." >&2
        exit 2
        ;;
      *)
        echo "Homeserver returned an invalid artifact name: $latest" >&2
        exit 2
        ;;
    esac

    mkdir -p "$local_artifacts"
    rsync -a root@"$ip":"$remote_root/artifacts/$latest" "$local_artifacts/"
    rsync -a root@"$ip":"$remote_root/artifacts/$latest.sha256" "$local_artifacts/"
    if ssh -o BatchMode=yes root@"$ip" "test -r '$remote_root/artifacts/$latest.metadata'"; then
      rsync -a root@"$ip":"$remote_root/artifacts/$latest.metadata" "$local_artifacts/"
    fi
    (cd "$local_artifacts" && sha256sum -c "$latest.sha256")

    artifact="$local_artifacts/$latest"
    echo "Selected homeserver artifact: $artifact"
    if [ -r "$artifact.metadata" ]; then
      version_name="$(sed -n 's/^VERSION_NAME=//p' "$artifact.metadata" | sed -n '1p')"
      version_code="$(sed -n 's/^ANDROID_VERSION_CODE=//p' "$artifact.metadata" | sed -n '1p')"
      echo "Homeserver AAB metadata: versionName=${version_name:-unknown}, versionCode=${version_code:-unknown}"
    fi
    run_submit npx --yes eas-cli@latest submit \
      --profile "$submit_profile" \
      --platform android \
      --path "$artifact"
    ;;
  *)
    echo "Usage: $0 eas|homeserver" >&2
    exit 2
    ;;
esac
