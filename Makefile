.PHONY: install start andr ios asset-link clean local_build_android_qa local_build_android_prod build build-ios build-android build-qa-ios build-qa-android open-ios open-android

install:
	yarn install
	cd ios && pod install

start:
	npx react-native start --reset-cache

andr:
	yarn android

ios:
	yarn ios

asset-link:
	npx react-native-asset

clean:
	cd android && ./gradlew clean

local_build_android_qa:
	cd android && ./gradlew assembleQa

local_build_android_prod:
	cd android && ./gradlew assembleRelease

build:
	bundle exec fastlane android distribute_staging
	bundle exec fastlane ios distribute_staging

build-ios:
	bundle exec fastlane ios distribute_staging

build-android:
	bundle exec fastlane android distribute_staging

build-qa-ios:
	bundle exec fastlane ios distribute_qa

build-qa-android:
	bundle exec fastlane android distribute_qa

open-ios:
	open ios/HasCart.xcworkspace

open-a:
	open -a "/Applications/Android Studio.app" ./android
