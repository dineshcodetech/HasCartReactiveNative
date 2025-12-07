# HasCart - React Native Customer App

A React Native mobile application for customers with 3 tabs: Home, Products, and Profile.

## Features

- 🏠 **Home Screen**: Welcome page with featured categories and quick actions
- 🛍️ **Products Screen**: Browse all products with search functionality
- 👤 **Profile Screen**: User profile management and settings

## Prerequisites

Before running the app, ensure you have:

- Node.js installed (v14 or higher)
- React Native CLI: `npm install -g react-native-cli`

### For Android:
- Android Studio installed
- Android SDK and build tools
- USB debugging enabled on your Android device
- ADB (Android Debug Bridge) working

### For iOS (macOS only):
- Xcode installed
- CocoaPods installed: `sudo gem install cocoapods`
- iOS development certificate and provisioning profile

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Running on Android Device

#### Enable USB Debugging:
1. Go to Settings > About Phone
2. Tap "Build Number" 7 times to enable Developer Options
3. Go to Developer Options and enable "USB Debugging"
4. Connect your Android device via USB
5. Allow USB debugging when prompted on your device

#### Check Device Connection:
```bash
adb devices
```
You should see your device listed.

#### Run the App:
```bash
# Start Metro bundler in one terminal
npm start

# In another terminal, run the app
npx react-native run-android
```

The app will install and launch on your device automatically!

### 3. Running on iOS Device (macOS only)

#### Install iOS Dependencies:
```bash
cd ios
pod install
cd ..
```

#### Configure in Xcode:
1. Open `ios/hascartreactivenative.xcworkspace` in Xcode
2. Select your physical iOS device from the device dropdown
3. Go to Signing & Capabilities
4. Select your development team
5. Connect your iOS device via USB
6. Trust the computer on your iOS device when prompted

#### Run the App:
```bash
# Start Metro bundler in one terminal
npm start

# In another terminal, run the app
npx react-native run-ios --device
```

## Development Tips

### Hot Reload
- Shake your device to open the developer menu
- Enable "Fast Refresh" for instant updates

### Debugging
- Shake device and select "Debug" to open Chrome DevTools
- Or use `npx react-native log-android` (for Android) to see logs

### Common Issues

#### Android: "Unable to load script"
```bash
# Clear cache and restart
npx react-native start --reset-cache
```

#### Android: Port already in use
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9
```

#### iOS: Build fails
```bash
cd ios
pod deintegrate
pod install
cd ..
```

#### Device not detected
```bash
# For Android
adb kill-server
adb start-server
adb devices

# For iOS
- Unplug and replug your device
- Trust the computer again
```

## Project Structure

```
HasCartReactiveNative/
├── src/
│   └── screens/
│       ├── HomeScreen.js       # Home tab with categories
│       ├── ProductsScreen.js   # Products listing
│       └── ProfileScreen.js    # User profile & settings
├── App.js                      # Main app with navigation
├── index.js                    # App entry point
├── package.json                # Dependencies
└── babel.config.js            # Babel configuration
```

## App Screens

### 1. Home Screen
- Welcome banner
- Featured categories (Electronics, Fashion, Home, Sports)
- Quick action buttons

### 2. Products Screen
- Search bar for filtering products
- Product cards with image, name, price, and category
- Add to cart functionality

### 3. Profile Screen
- User information display
- Account management options
- Preferences and settings
- Support and help options

## Next Steps

This is the initial version with:
✅ Tab navigation setup
✅ Three main screens
✅ Beautiful UI with modern design
✅ Ready for physical device testing

You can now add:
- Backend API integration
- State management (Redux/Context)
- Shopping cart functionality
- User authentication
- Product details page
- Order management
- Payment integration

## Troubleshooting

If you face any issues:

1. **Clean and rebuild**:
```bash
# Clear all caches
rm -rf node_modules
npm install
npx react-native start --reset-cache
```

2. **For Android build issues**:
```bash
cd android
./gradlew clean
cd ..
```

3. **Check React Native doctor**:
```bash
npx react-native doctor
```

## Support

For more help:
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Navigation Docs](https://reactnavigation.org/docs/getting-started)
- [Running on Device Guide](https://reactnative.dev/docs/running-on-device)

---

**Note**: This app is built without Expo to avoid limitations and give you full control over native modules and builds.

