# Homeserver Android builds

The homeserver production build is a thin SSH wrapper around EAS local builds
running inside Docker. From the Mac project directory, `make build-home` syncs
the project to the homeserver, builds the Android EAS image if needed, and runs:

```sh
eas build --platform android --local --profile production --output /artifacts/when-bus-production-<timestamp>.aab --non-interactive
```

The build runs inside the `when-bus-eas-android:expo54` container as a
transient `systemd-run` service. Completed AABs, metadata, and SHA-256 checksum
files are stored in `/srv/when-bus-builder/artifacts`.

## Homeserver prerequisites

The homeserver host needs Docker, SSH, rsync, `systemd-run`, and `sha256sum`.
Node.js, npm, JDK 17, Android SDK Build Tools 36.0.0, Android API 36, CMake
3.22.1, NDK 27.1.12297006, and EAS CLI are installed in the Docker image.

For Expo authentication, `make login-home` first reuses your local Expo CLI
login by copying `~/.expo/state.json` to the homeserver's persisted Docker
Expo home. If local auth is unavailable, it prompts for an Expo access token,
saves it to `/srv/when-bus-builder/secrets/expo.env` with permissions `0600`,
and validates it with `eas whoami` inside the Docker image.

From the Mac project directory:

```sh
make login-home
```

You can also provide it non-interactively:

```sh
EXPO_TOKEN=replace-me make login-home
```

iOS local builds are not part of this workflow because they require macOS and
Xcode.

## Build and submit

Build the production AAB on the homeserver:

```sh
make build-home
```

Build on the homeserver and submit that exact AAB by path:

```sh
make release-home
```

List homeserver production AABs:

```sh
make list-home
```

## Submit a selected build source

Submit the latest finished Android build created with the EAS `production`
build profile:

```sh
make submit-eas
```

Submit the newest production AAB stored on the homeserver:

```sh
make submit-home
```

The EAS command resolves the newest matching build ID and submits with `--id`,
so a newer preview build cannot be selected accidentally. The homeserver
command resolves the current server IP, selects the newest AAB,
copies it into `artifacts/android/`, verifies its SHA-256 checksum, and passes
that exact file to EAS Submit with `--path`.
