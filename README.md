# NoteIt - React Native App

A React Native application built with TypeScript for note-taking functionality.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Yarn** (v1.22.22 or higher) - [Install Guide](https://classic.yarnpkg.com/en/docs/install/)
- **React Native CLI** (v19.0.0 or higher) - [Install Guide](https://reactnative.dev/docs/environment-setup)
- **Java Development Kit (JDK)** (v17 or higher) - [Download](https://adoptium.net/)
- **Android Studio** (for Android development) - [Download](https://developer.android.com/studio)
- **Xcode** (for iOS development, macOS only) - [Download from App Store](https://apps.apple.com/us/app/xcode/id497799835)
- **CocoaPods** (v1.16.2 or higher) - [Install Guide](https://cocoapods.org/)

### Environment Verification

Your current environment setup:
```bash
Node.js: v23.7.0 ✅
Yarn: v1.22.22 ✅
React Native CLI: v19.0.0 ✅
Java: OpenJDK 17.0.14 ✅
Xcode Command Line Tools: v2409 ✅
Ruby: v2.6.10 ✅
CocoaPods: v1.16.2 ✅
```

## 🚀 Project Setup

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd NoteIt

# Install dependencies
yarn install
```

### Step 2: iOS Setup (macOS only)

```bash
# Install Ruby dependencies for CocoaPods
yarn pod-start
```

### Step 3: Android Setup

```bash
# Clean Android build (if needed)
yarn clean-android


## 🏃‍♂️ Running the App

### Start Metro Bundler

First, start the Metro bundler in one terminal:

```bash
yarn start
```

### Run on Android

In a new terminal:

```bash
yarn android
```

### Run on iOS (macOS only)

In a new terminal:

```bash
yarn ios
```

### Open iOS Project in Xcode

```bash
yarn open
```

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `yarn start` | Start Metro bundler |
| `yarn android` | Run app on Android device/emulator |
| `yarn ios` | Run app on iOS simulator |
| `yarn open` | Open iOS project in Xcode |
| `yarn lint` | Run ESLint for code quality |
| `yarn test` | Run Jest tests |
| `yarn clean-android` | Clean Android build |
| `yarn clean-ios` | Clean iOS build and reinstall pods |
| `yarn pod-start` | Install Ruby dependencies and pods |
| `yarn pod-install` | Install CocoaPods dependencies |

## 📱 Project Information

- **React Native Version**: 0.80.1
- **React Version**: 19.1.0
- **TypeScript**: 5.0.4
- **Platforms**: iOS, Android
- **Package Manager**: Yarn

## 🔧 Development

### Making Changes

1. Open `App.tsx` in your preferred editor
2. Make your changes
3. Save the file - the app will automatically reload with Fast Refresh
4. For a full reload:
   - **Android**: Press `R` twice or use Dev Menu (`Ctrl+M` / `Cmd+M`)
   - **iOS**: Press `R` in iOS Simulator

### Project Structure

```
NoteIt/
├── App.tsx                 # Main application component
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── android/               # Android-specific files
├── ios/                   # iOS-specific files
└── __tests__/            # Test files
```

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**: Try clearing cache with `yarn start --reset-cache`
2. **iOS build issues**: Run `yarn clean-ios` to reinstall pods
3. **Android build issues**: Run `yarn clean-android` to clean build
4. **Dependency issues**: Delete `node_modules` and `yarn.lock`, then run `yarn install`

### Environment Setup Issues

If you encounter environment setup issues, refer to the official React Native documentation:
- [Environment Setup Guide](https://reactnative.dev/docs/environment-setup)
- [Troubleshooting](https://reactnative.dev/docs/troubleshooting)

## 📚 Learn More

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Native Blog](https://reactnative.dev/blog)
- [TypeScript with React Native](https://reactnative.dev/docs/typescript)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `yarn test`
5. Run linting: `yarn lint`
6. Submit a pull request

---

**Note**: This project requires Node.js version 18 or higher as specified in the `package.json` engines field.
