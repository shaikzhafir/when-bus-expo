#!/bin/sh
set -eu

profile="${1:-production}"
homeserver_root="${HOMESERVER_ROOT:-$HOME/homeserver}"
remote_root="${WHEN_BUS_REMOTE_ROOT:-/srv/when-bus-builder}"
discovery="$homeserver_root/lan-devices/find-rpi.sh"

case "$profile" in
  production) ;;
  *)
    echo "Homeserver builds use EAS local for Android production only." >&2
    echo "Usage: $0 production" >&2
    exit 2
    ;;
esac

if [ ! -x "$discovery" ]; then
  echo "Homeserver discovery helper not found at $discovery" >&2
  exit 2
fi

ip="$($discovery)"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
artifact_name="when-bus-${profile}-${timestamp}.aab"
image="${WHEN_BUS_ANDROID_EAS_IMAGE:-when-bus-eas-android:expo54}"

ssh -o BatchMode=yes root@"$ip" \
  "install -d -m 0755 '$remote_root/source' '$remote_root/artifacts' '$remote_root/cache' '$remote_root/expo-home'; install -d -m 0700 '$remote_root/secrets'"

rsync -a --delete \
  --exclude '.env*' \
  --exclude '.expo/' \
  --exclude 'android/' \
  --exclude 'artifacts/' \
  --exclude 'credentials.json' \
  --exclude 'credentials/' \
  --exclude 'ios/' \
  --exclude 'node_modules/' \
  --exclude 'when-bus-*.json' \
  ./ root@"$ip":"$remote_root/source/"

ssh -o BatchMode=yes root@"$ip" \
  "REMOTE_ROOT='$remote_root' PROFILE='$profile' ARTIFACT_NAME='$artifact_name' IMAGE='$image' sh -s" <<'REMOTE_SCRIPT'
set -eu

source_dir="$REMOTE_ROOT/source"
artifacts_dir="$REMOTE_ROOT/artifacts"
artifact="$artifacts_dir/$ARTIFACT_NAME"
unit="when-bus-eas-local-android-$PROFILE-$(date -u +%Y%m%d%H%M%S)"
env_args=""

install -d -m 0755 \
  "$artifacts_dir" \
  "$REMOTE_ROOT/cache/eas-work" \
  "$REMOTE_ROOT/cache/gradle" \
  "$REMOTE_ROOT/cache/npm" \
  "$REMOTE_ROOT/expo-home"

command -v docker >/dev/null || {
  echo "Docker is required on the homeserver." >&2
  exit 2
}

if [ -r "$REMOTE_ROOT/secrets/expo.env" ]; then
  env_args="--env-file $REMOTE_ROOT/secrets/expo.env"
elif [ ! -s "$REMOTE_ROOT/expo-home/state.json" ]; then
  echo "Homeserver EAS auth is missing." >&2
  echo "Run make login-home, or create $REMOTE_ROOT/secrets/expo.env containing EXPO_TOKEN=..." >&2
  exit 2
fi

docker build -t "$IMAGE" "$source_dir/docker/android-eas"

systemd-run \
  --unit="$unit" \
  --wait \
  --pipe \
  --collect \
  --property=WorkingDirectory="$source_dir" \
  /bin/sh -lc "docker run --rm $env_args \
    --env CI=1 \
    --env ANDROID_BUILD_PROFILE='$PROFILE' \
    --env ANDROID_ARTIFACT_NAME='$ARTIFACT_NAME' \
    --mount type=bind,src='$source_dir',dst=/workspace,readonly \
    --mount type=bind,src='$artifacts_dir',dst=/artifacts \
    --mount type=bind,src='$REMOTE_ROOT/cache/eas-work',dst=/eas-work \
    --mount type=bind,src='$REMOTE_ROOT/cache/gradle',dst=/root/.gradle \
    --mount type=bind,src='$REMOTE_ROOT/cache/npm',dst=/root/.npm \
    --mount type=bind,src='$REMOTE_ROOT/expo-home',dst=/root/.expo \
    '$IMAGE'"

if [ ! -s "$artifact" ]; then
  echo "EAS local build finished but no AAB was written to $artifact" >&2
  exit 1
fi

version_name="$(sed -n 's/.*"version": "\([^"]*\)".*/\1/p' "$source_dir/app.json" | sed -n '1p')"
version_code="$(docker run --rm $env_args \
  --mount type=bind,src="$REMOTE_ROOT/expo-home",dst=/root/.expo \
  --entrypoint eas "$IMAGE" \
  build:version:get --platform android --profile "$PROFILE" --json --non-interactive 2>/dev/null \
  | sed -n 's/.*"versionCode": "\([0-9][0-9]*\)".*/\1/p' \
  | sed -n '1p' || true)"
{
  printf 'VERSION_NAME=%s\n' "$version_name"
  if [ -n "$version_code" ]; then
    printf 'ANDROID_VERSION_CODE=%s\n' "$version_code"
  fi
  printf 'ANDROID_BUILD_PROFILE=%s\n' "$PROFILE"
  printf 'EAS_LOCAL_BUILD=1\n'
  printf 'CREATED_AT=%s\n' "$(date -u +%Y%m%dT%H%M%SZ)"
} > "$artifact.metadata"

(cd "$artifacts_dir" && sha256sum "$ARTIFACT_NAME") | tee "$artifact.sha256"
echo "Android artifact: $artifact"
REMOTE_SCRIPT

echo "Artifacts: root@$ip:$remote_root/artifacts/"
