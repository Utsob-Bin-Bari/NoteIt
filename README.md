# NoteIt - React Native App

A React Native application built with TypeScript for note-taking functionality with offline-first capabilities and conflict resolution.

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

# Or manually:
cd ios
bundle install
bundle exec pod install
cd ..
```

### Step 3: Android Setup

```bash
# Clean Android build (if needed)
yarn clean-android

# Or manually:
cd android
./gradlew clean
cd ..
```

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
- **Architecture**: Clean Architecture with Layered Design

## 📦 Core Dependencies

### Navigation & UI Framework
- **@react-navigation/native** (v7.1.14) - Core navigation library
- **@react-navigation/stack** (v7.4.2) - Stack navigator for screen transitions
- **react-native-screens** (v4.13.1) - Native navigation primitives
- **react-native-safe-area-context** (v5.5.2) - Safe area handling
- **react-native-gesture-handler** (v2.27.1) - Native gesture handling
- **@react-native-masked-view/masked-view** (v0.3.2) - UI masking for transitions

### State Management & Data Flow
- **@reduxjs/toolkit** (v2.8.2) - Modern Redux with simplified setup
- **react-redux** (v9.2.0) - React bindings for Redux

### Performance & UI Components
- **@shopify/flash-list** (v1.8.3) - High-performance list component
- **react-native-svg** (v15.12.0) - SVG support for custom icons

### Network & API Communication
- **axios** (v1.10.0) - HTTP client for API requests
- **@react-native-community/netinfo** (v11.4.1) - Network connectivity monitoring

### Local Storage & Data Persistence
- **react-native-sqlite-storage** (v6.0.1) - Direct SQLite database access

### Conflict Resolution & Data Synchronization
- **diff-match-patch** (v1.0.5) - Google's algorithm for text comparison and merging

## 🏗️ Project Architecture

This project follows **Clean Architecture** principles with a layered design for maintainability, testability, and scalability.

### Current Folder Structure

```
NoteIt/
├── src/                          # Source code directory
│   ├── domain/                   # Business logic layer (innermost)
│   │   ├── entities/             # Core business entities and domain objects
│   │   ├── validators/           # Domain-specific validation rules
│   │   ├── data/                 # Domain data models and interfaces
│   │   └── types/                # TypeScript type definitions
│   │       └── Theme.ts          # Theme-related type definitions
│   │
│   ├── application/              # Application logic layer (middle)
│   │   ├── store/                # Redux store configuration
│   │   ├── services/             # Business logic and use cases
│   │   ├── context/              # React context providers (theme management)
│   │   │   └── AppContext.tsx    # Application-wide context (theme state)
│   │   └── utils/                # Application-level utilities
│   │
│   ├── infrastructure/           # External concerns layer
│   │   ├── storage/              # Database and local storage
│   │   ├── api/                  # HTTP client and API communication
│   │   ├── validation/           # Infrastructure-level validation
│   │   └── utils/                # Infrastructure utilities
│   │
│   └── presentation/             # UI layer (outermost)
│       ├── screens/              # Screen components
│       │   ├── LoginScreen.tsx   # User authentication screen
│       │   ├── SignUpScreen.tsx  # User registration screen
│       │   ├── HomeScreen.tsx    # Main notes list screen
│       │   └── NoteScreen.tsx    # Individual note editing screen
│       ├── components/           # Reusable UI components
│       ├── navigation/           # Navigation configuration
│       │   ├── stacks/           # Stack navigator setup
│       │   │   └── StackNavigator.tsx # Main navigation stack
│       │   └── types/            # Navigation type definitions
│       │       └── StackNavigator.ts  # TypeScript navigation types
│       ├── hooks/                # Custom React hooks
│       ├── styles/               # Styling and theming
│       │   ├── GlobalStyles.ts   # Global application styles
│       │   └── CustomHeaderStyle.ts # Navigation header styling
│       ├── utils/                # Presentation utilities
│       └── constants/            # UI constants
│           └── Colors.tsx        # Color definitions for theming
│
├── android/                      # Android-specific files
├── ios/                          # iOS-specific files
├── __tests__/                    # Test files
├── App.tsx                       # Main application component
├── index.js                      # Application entry point
└── package.json                  # Dependencies and scripts
```

### Architecture Principles

#### **1. Domain Layer** (`src/domain/`)
- **Purpose**: Contains business logic, entities, and core domain rules
- **Dependencies**: No external dependencies
- **Folders**: entities, validators, data, types

#### **2. Application Layer** (`src/application/`)
- **Purpose**: Orchestrates business logic and manages application state
- **Dependencies**: Domain layer only
- **Folders**: store, services, context, utils

#### **3. Infrastructure Layer** (`src/infrastructure/`)
- **Purpose**: Handles external concerns (databases, APIs, file systems)
- **Dependencies**: Domain and Application layers
- **Folders**: storage, api, validation, utils

#### **4. Presentation Layer** (`src/presentation/`)
- **Purpose**: User interface and user interaction
- **Dependencies**: Application layer only
- **Folders**: screens, components, navigation, hooks, styles, utils, constants

### Benefits of This Architecture

- **✅ Separation of Concerns**: Each layer has a specific responsibility
- **✅ Testability**: Each layer can be tested independently
- **✅ Maintainability**: Clear boundaries make code easier to maintain
- **✅ Scalability**: Easy to add new features without affecting existing code
- **✅ Dependency Rule**: Inner layers don't depend on outer layers

## 🧭 Navigation & Screen Architecture

### **Navigation Flow**

The app uses a **Stack Navigator** with the following screen flow:

```
Login Screen (No Header) → Home Screen → Note Screen
     ↓
SignUp Screen (No Header)
```

### **Screen Details**

#### **Authentication Screens**
- **LoginScreen**: User login with email/password authentication
  - **Header**: Hidden for clean, full-screen experience
  - **Navigation**: Routes to Home screen on successful login
  - **Features**: Form validation, error handling, "Sign Up" link

- **SignUpScreen**: User registration with account creation
  - **Header**: Hidden for clean, full-screen experience
  - **Navigation**: Routes to Home screen on successful registration
  - **Features**: Form validation, password confirmation, "Login" link

#### **Main App Screens**
- **HomeScreen**: Main dashboard displaying user's notes
  - **Header**: Visible with navigation title
  - **Navigation**: Routes to Note screen for editing
  - **Features**: Notes list, search functionality, add new note

- **NoteScreen**: Individual note editing and viewing
  - **Header**: Visible with back navigation
  - **Navigation**: Routes back to Home screen
  - **Features**: Rich text editing, save functionality, conflict resolution

### **Navigation Features**

- **TypeScript Support**: Fully typed navigation parameters
- **Header Management**: Custom header styling with theme support
- **Theme Integration**: Headers automatically adapt to light/dark themes
- **Gesture Navigation**: Swipe-to-go-back functionality
- **Safe Area Handling**: Proper layout on devices with notches
- **Screen Transitions**: Smooth animations between screens

### **Styling & Theming**

#### **Theme System**
- **Dynamic Theming**: Built-in light and dark mode support
- **Context-Based**: Theme state managed through React Context
- **Color Management**: Centralized color definitions in `Colors.tsx`
- **Responsive Headers**: Navigation headers adapt to current theme

#### **Styling Architecture**
- **GlobalStyles**: Centralized styling definitions in `GlobalStyles.ts`
- **Custom Headers**: Specialized header styling in `CustomHeaderStyle.ts`
- **Theme-Aware Colors**: All colors support both light and dark variants
- **Consistent Design**: Unified styling approach across all screens

## 🔧 Development

### Making Changes

1. Open `App.tsx` in your preferred editor
2. Make your changes
3. Save the file - the app will automatically reload with Fast Refresh
4. For a full reload:
   - **Android**: Press `R` twice or use Dev Menu (`Ctrl+M` / `Cmd+M`)
   - **iOS**: Press `R` in iOS Simulator

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**: Try clearing cache with `yarn start --reset-cache`
2. **iOS build issues**: Run `yarn clean-ios` to reinstall pods
3. **Android build issues**: Run `yarn clean-android` to clean build
4. **Dependency issues**: Delete `node_modules` and `yarn.lock`, then run `yarn install`
5. **Navigation issues**: Ensure `react-native-gesture-handler` is imported at the top of your entry file
6. **SQLite issues**: Verify native linking with `yarn pod-install` for iOS

### Environment Setup Issues

If you encounter environment setup issues, refer to the official React Native documentation:
- [Environment Setup Guide](https://reactnative.dev/docs/environment-setup)
- [Troubleshooting](https://reactnative.dev/docs/troubleshooting)

## 📚 Learn More

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Redux Toolkit](https://redux-toolkit.js.org/introduction/getting-started)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [React Native SVG](https://github.com/react-native-svg/react-native-svg)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the layered architecture
4. Run tests: `yarn test`
5. Run linting: `yarn lint`
6. Submit a pull request

---

**Note**: This project requires Node.js version 18 or higher as specified in the `package.json` engines field.
