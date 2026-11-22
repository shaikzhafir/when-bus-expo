.PHONY: help lint bump-version login login-home status first-release release-home release-eas build-eas build-home submit-eas submit-home list-home eas-version docker-android-image eas-login eas-prod-android eas-build-status playstore-first-release playstore-submit submit-eas-latest submit-homeserver-latest homeserver-builds homeserver-android-production

EAS := npx --yes eas-cli@latest

help:
	@printf "%s\n" \
		"when-bus release commands:" \
		"" \
		"  make release-home     Build and submit from the homeserver" \
		"  make release-eas      Build and submit via EAS cloud" \
		"  make build-eas        Build production AAB with EAS" \
		"  make build-home       Build production AAB on the homeserver" \
		"  make list-home        List homeserver production AABs" \
		"  make submit-eas       Submit latest EAS production build by ID" \
		"  make submit-home      Submit latest homeserver AAB by path" \
		"" \
		"Useful helpers:" \
		"  make lint             Run Expo lint" \
		"  make bump-version     Increment app patch version" \
		"  make login            Log in to Expo/EAS" \
		"  make login-home       Save an Expo token for homeserver Docker" \
		"  make eas-version      Show EAS remote Android versionCode" \
		"  make status BUILD_ID=id  Check an EAS build status" \
		"  make first-release    Print first Play Store upload checklist" \
		"  make docker-android-image  Build the local Android EAS image" \
		"" \
		"Pattern: make <action>-<source>, where source is eas or home." \
		"  - Android package: com.zadusz.whenbus"

lint:
	npm run lint

bump-version:
	node scripts/bump-version.js $(VERSION)

build-home: bump-version lint
	./scripts/homeserver-android-build.sh production

docker-android-image:
	docker build -t when-bus-eas-android:expo54 docker/android-eas

release-home: build-home submit-home

list-home:
	@./scripts/list-homeserver-builds.sh

eas-version:
	$(EAS) build:version:get --platform android --profile production

login:
	$(EAS) login

login-home:
	./scripts/homeserver-eas-login.sh

build-eas: bump-version lint
	$(EAS) build --profile production --platform android

release-eas:
	@EAS="$(EAS)" VERSION="$(VERSION)" EAS_BASE_CODE="$(EAS_BASE_CODE)" ./scripts/release-eas-android.sh

status:
	@test -n "$(BUILD_ID)" || (echo "Usage: make status BUILD_ID=<eas-build-id>"; exit 1)
	$(EAS) build:view $(BUILD_ID)

first-release:
	@printf "%s\n" \
		"First Google Play release checklist:" \
		"" \
		"1. Run: make build-eas" \
		"2. Wait for the EAS Android production build to finish." \
		"3. Download the .aab from the EAS build page." \
		"4. Open Google Play Console: https://play.google.com/console" \
		"5. Create/select the app with package com.zadusz.whenbus." \
		"6. Complete store listing, privacy/data safety, content rating, and target audience." \
		"7. Create an internal testing release and upload the .aab manually." \
		"8. Afterwards, use make submit-eas or make submit-home."

submit-eas:
	./scripts/submit-android.sh eas

submit-home:
	@printf "%s\n" \
		"Warning: submit-home uploads an AAB by file path." \
		"Expo's Submissions page will not show Version/Build for homeserver path uploads." \
		"Check Google Play Console or the AAB metadata printed below for release details." \
		""
	./scripts/submit-android.sh homeserver

eas-login: login
eas-prod-android: build-eas
eas-build-status: status
playstore-first-release: first-release
playstore-submit: submit-eas
submit-eas-latest: submit-eas
submit-homeserver-latest: submit-home
homeserver-builds: list-home
homeserver-android-production: build-home
