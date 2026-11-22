#!/bin/sh
set -eu

profile="${ANDROID_BUILD_PROFILE:-production}"
artifact_name="${ANDROID_ARTIFACT_NAME:-when-bus-${profile}.aab}"
source_dir="${ANDROID_SOURCE_DIR:-/workspace}"
project_dir="${ANDROID_PROJECT_DIR:-/build/project}"
artifacts_dir="${ANDROID_ARTIFACTS_DIR:-/artifacts}"

case "$profile" in
  production) ;;
  *)
    echo "Unsupported Android EAS local build profile: $profile" >&2
    exit 2
    ;;
esac

rm -rf "$project_dir"
mkdir -p "$project_dir" "$artifacts_dir" /eas-work

rsync -a --delete --no-owner --no-group \
  --exclude 'android/' \
  --exclude 'artifacts/' \
  --exclude 'ios/' \
  --exclude 'node_modules/' \
  "$source_dir/" "$project_dir/"

cd "$project_dir"
git config --global --add safe.directory "$project_dir"
npm ci --no-audit --no-fund

export EAS_LOCAL_BUILD_WORKINGDIR="${EAS_LOCAL_BUILD_WORKINGDIR:-/eas-work/${artifact_name}.work}"
export EAS_LOCAL_BUILD_ARTIFACTS_DIR="${EAS_LOCAL_BUILD_ARTIFACTS_DIR:-$artifacts_dir/eas}"
export EAS_LOCAL_BUILD_SKIP_CLEANUP="${EAS_LOCAL_BUILD_SKIP_CLEANUP:-1}"
export NODE_ENV="${NODE_ENV:-production}"
rm -rf "$EAS_LOCAL_BUILD_WORKINGDIR"
mkdir -p "$EAS_LOCAL_BUILD_WORKINGDIR" "$EAS_LOCAL_BUILD_ARTIFACTS_DIR"

eas build \
  --platform android \
  --local \
  --profile "$profile" \
  --output "$artifacts_dir/$artifact_name" \
  --non-interactive

if [ ! -s "$artifacts_dir/$artifact_name" ]; then
  echo "EAS local build finished but no AAB was written to $artifacts_dir/$artifact_name" >&2
  exit 1
fi
