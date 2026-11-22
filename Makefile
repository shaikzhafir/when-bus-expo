.PHONY: help start pair connect run build-debug lint bump-version keystore keystore-backup doctor \
	build-home list-home fetch-home submit-home release-home prune-home

# React Native app built by android-builder: Metro for JS, the committed
# android/ Gradle project for the binary, the homeserver for signed releases.
ANDROID_HOME_CLI ?= $(HOME)/Projects/Mobile/android-builder/bin/android-home
ANDROID_PAIR_CLI ?= $(HOME)/Projects/Mobile/android-builder/bin/android-pair
# Android Studio's bundled JDK if installed, else Homebrew's openjdk@17.
export JAVA_HOME ?= $(shell for d in "/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
	/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home; do \
	[ -d "$$d" ] && { echo "$$d"; break; }; done)
export ANDROID_HOME ?= $(HOME)/Library/Android/sdk
TRACK ?= internal

help:
	@printf "%s\n" \
		"when-bus (com.zadusz.whenbus): React Native, built by android-builder." \
		"" \
		"  make start            Metro dev server (JS changes hot reload)" \
		"  make run              Build, install and launch a debug build on a device/emulator" \
		"  make pair / connect   Pair or reconnect a phone over Wi-Fi" \
		"  make lint             Expo lint" \
		"" \
		"  make build-home       Signed release AAB on the homeserver" \
		"  make build-home KIND=apk   Signed release APK, for sideloading" \
		"  make list-home        List homeserver artifacts" \
		"  make fetch-home       Download newest AAB to ./artifacts" \
		"  make submit-home      Upload newest AAB to Play (TRACK=internal, draft)" \
		"  make release-home     lint + build-home + submit-home" \
		"  make bump-version [VERSION=x.y.z]   versionCode is automatic" \
		"" \
		"  make keystore-backup  Copy the upload keystore to ~/.android-keystores" \
		"  make doctor           Check homeserver, image, keystore, Play key"

start:
	npx expo start

pair:
	$(ANDROID_PAIR_CLI)

connect:
	$(ANDROID_PAIR_CLI) connect

run:
	npx expo run:android

build-debug:
	cd android && ./gradlew assembleDebug

lint:
	npm run lint

bump-version:
	node scripts/bump-version.js $(VERSION)

keystore:
	$(ANDROID_HOME_CLI) keystore

keystore-backup:
	$(ANDROID_HOME_CLI) keystore-backup

doctor:
	$(ANDROID_HOME_CLI) doctor

build-home:
	$(ANDROID_HOME_CLI) build $(or $(KIND),aab)

list-home:
	@$(ANDROID_HOME_CLI) list

fetch-home:
	$(ANDROID_HOME_CLI) fetch $(or $(KIND),aab)

submit-home:
	$(ANDROID_HOME_CLI) submit $(TRACK)

release-home: lint build-home submit-home

prune-home:
	$(ANDROID_HOME_CLI) prune $(KEEP)
