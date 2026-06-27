.PHONY: help lint eas-login eas-prod-android eas-build-status playstore-first-release playstore-submit

EAS := npx eas-cli@latest

help:
	@printf "%s\n" \
		"when-bus release targets:" \
		"" \
		"  make lint                         Run Expo lint" \
		"  make eas-login                    Log in to Expo/EAS" \
		"  make eas-prod-android             Build Android production AAB with EAS" \
		"  make eas-build-status BUILD_ID=id  Check an EAS build status" \
		"  make playstore-first-release       Print first Play Store upload checklist" \
		"  make playstore-submit             Submit latest Android production build to Play Store" \
		"" \
		"Notes:" \
		"  - First Google Play upload must be manual in Play Console." \
		"  - Future Play Store releases can use make playstore-submit." \
		"  - Android package: com.zadusz.whenbus"

lint:
	npm run lint

eas-login:
	$(EAS) login

eas-prod-android: lint
	$(EAS) build --profile production --platform android

eas-build-status:
	@test -n "$(BUILD_ID)" || (echo "Usage: make eas-build-status BUILD_ID=<eas-build-id>"; exit 1)
	$(EAS) build:view $(BUILD_ID)

playstore-first-release:
	@printf "%s\n" \
		"First Google Play release checklist:" \
		"" \
		"1. Run: make eas-prod-android" \
		"2. Wait for the EAS Android production build to finish." \
		"3. Download the .aab from the EAS build page." \
		"4. Open Google Play Console: https://play.google.com/console" \
		"5. Create/select the app with package com.zadusz.whenbus." \
		"6. Complete store listing, privacy/data safety, content rating, and target audience." \
		"7. Create an internal testing release and upload the .aab manually." \
		"8. After the first manual upload, use: make playstore-submit"

playstore-submit:
	$(EAS) submit --profile production --platform android
