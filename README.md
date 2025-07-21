# NoteIt - React Native App

A React Native application built with TypeScript for note-taking functionality with **offline-first capabilities**, SQLite database storage, and automated conflict resolution.

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
- **Database**: SQLite with offline-first sync capabilities

## 📦 Core Dependencies

### Navigation & UI Framework
- **@react-navigation/native** (v7.1.14) - Core navigation library
- **@react-navigation/stack** (v7.4.2) - Stack navigator for screen transitions
- **react-native-screens** (v4.13.1) - Native navigation primitives with performance optimization
- **react-native-safe-area-context** (v5.5.2) - Safe area handling
- **react-native-gesture-handler** (v2.27.1) - Native gesture handling
- **@react-native-masked-view/masked-view** (v0.3.2) - UI masking for transitions

### State Management & Data Flow
- **@reduxjs/toolkit** (v2.8.2) - Modern Redux with simplified setup and best practices
- **react-redux** (v9.2.0) - React bindings for Redux state management
- **Centralized Store Configuration** - Complete Redux store setup with actions and reducers
- **Authentication State Management** - User session and login state handled through Redux
- **Offline-First Architecture** - Local SQLite as primary source of truth with Redux for UI state
- **Auto-Login Implementation** - Automatic session restoration from local storage on app startup

### Performance & UI Components
- **@shopify/flash-list** (v1.8.3) - High-performance list component
- **react-native-svg** (v15.12.0) - SVG support for custom icons
- **Custom UI Components** - Reusable TextInput and Button components with theme support

### Network & API Communication
- **axios** (v1.10.0) - HTTP client for API requests with interceptors
- **@react-native-community/netinfo** (v11.4.1) - Network connectivity monitoring with real-time status
- **Automatic 401 Handling** - Session expiry detection with auto-redirect to login
- **Network Status Indicators** - Visual WiFi icons showing online/offline status in headers

### Local Storage & Database
- **react-native-sqlite-storage** (v6.0.1) - SQLite database with offline-first capabilities
- **Complete Database Schema** - User sessions, notes, sharing, bookmarks, and sync queue management
- **Automatic Sync Queue** - Handles offline operations and syncs when online
- **Conflict Resolution** - Built-in conflict detection and resolution mechanisms

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
│   │       ├── Auth/             # Authentication request/response types
│   │       ├── Notes/            # Note-related API types
│   │       ├── Bookmarks/        # Bookmark operation types
│   │       └── Theme/            # Theme-related type definitions
│   │
│   ├── application/              # Application logic layer (middle)
│   │   ├── store/                # Redux store configuration
│   │   ├── services/             # Business logic and use cases
│   │   │   └── auth/             # Authentication services (login, signup, validation)
│   │   ├── context/              # React context providers (theme management)
│   │   │   └── AppContext.tsx    # Application-wide context (theme state)
│   │   └── utils/                # Application-level utilities
│   │
│   ├── infrastructure/           # External concerns layer
│   │   ├── storage/              # Database and local storage
│   │   │   ├── DatabaseSchema.ts # Complete SQLite schema with sync tracking
│   │   │   └── DatabaseInit.ts   # Database initialization and management
│   │   ├── api/                  # HTTP client and API communication
│   │   │   ├── config/           # API configuration (base URL, timeout)
│   │   │   ├── endpoints/        # API endpoint URL definitions
│   │   │   ├── requests/         # API calling functions
│   │   │   ├── hooks/            # API utility hooks (useApi)
│   │   │   └── interceptor/      # Request/response interceptors
│   │   ├── validation/           # Infrastructure-level validation
│   │   └── utils/                # Infrastructure utilities
│   │       └── NetworkService.ts # Network connectivity management
│   │
│   └── presentation/             # UI layer (outermost)
│       ├── screens/              # Screen components
│       │   ├── LoginScreen.tsx   # User authentication screen with validation
│       │   ├── SignUpScreen.tsx  # User registration screen with validation
│       │   ├── HomeScreen.tsx    # Main notes list screen
│       │   └── NoteScreen.tsx    # Individual note editing screen
│       ├── components/           # Reusable UI components
│       │   ├── CustomTextInput.tsx # Theme-aware text input with password visibility
│       │   ├── CustomButton.tsx  # Configurable button component
│       │   └── icons/            # Custom SVG icon components
│       │       ├── EyeIcon.tsx   # Password visibility (show)
│       │       ├── EyeOffIcon.tsx # Password visibility (hide)
│       │       ├── SunIcon.tsx   # Light mode theme indicator
│       │       ├── MoonIcon.tsx  # Dark mode theme indicator
│       │       ├── WiFiOnlineIcon.tsx # Network connected status
│       │       ├── WiFiOfflineIcon.tsx # Network disconnected status
│       │       └── index.ts      # Centralized icon exports
│       ├── navigation/           # Navigation configuration
│       │   ├── stacks/           # Stack navigator setup
│       │   │   └── StackNavigator.tsx # Main navigation stack
│       │   └── types/            # Navigation type definitions
│       │       └── StackNavigator.ts  # TypeScript navigation types
│       ├── hooks/                # Custom React hooks
│       │   ├── useLogin.ts       # Login form state and validation hook
│       │   ├── useSignup.ts      # Signup form state and validation hook
│       │   └── useNetworkStatus.ts # Network connectivity status hook
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
- **API Types**: Complete TypeScript definitions for all API requests and responses

#### **2. Application Layer** (`src/application/`)
- **Purpose**: Orchestrates business logic and manages application state
- **Dependencies**: Domain layer only
- **Folders**: store, services, context, utils
- **Redux Store**: Complete store configuration with actions, reducers, and state management
- **Authentication Services**: Login, signup, and session management business logic
- **Data Flow Architecture**: Local SQLite as source of truth, Redux for UI state management
- **Auto-Login Logic**: Session restoration and automatic authentication on app startup

#### **3. Infrastructure Layer** (`src/infrastructure/`)
- **Purpose**: Handles external concerns (databases, APIs, file systems)
- **Dependencies**: Domain and Application layers
- **Folders**: storage, api, validation, utils
- **Database**: Complete SQLite implementation with offline-first sync capabilities
- **API Architecture**: Organized HTTP client with interceptors, config, and request handlers

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
- **✅ Offline-First**: Complete offline functionality with automatic sync

## 🎨 UI Components & Authentication

### **Custom UI Components**
- **CustomTextInput**: Theme-aware text input with password visibility toggle
- **CustomButton**: Configurable button with theme support and loading states
- **SVG Icon System**: Complete set of custom React Native SVG icons
  - **Eye Icons**: Password visibility indicators (EyeIcon, EyeOffIcon)
  - **Theme Icons**: Sun and Moon icons for light/dark mode switching
  - **Network Icons**: WiFi status indicators (WiFiOnlineIcon, WiFiOfflineIcon)
  - **Theme-Aware Colors**: All icons adapt to current theme with proper contrast

### **Authentication Features**
- **Complete Login Flow** - Full authentication implementation with backend integration
- **Redux Integration** - User authentication state managed through Redux store
- **Local Storage Persistence** - User session stored in SQLite for offline access
- **Auto-Login Capability** - Automatic login on app startup if valid session exists
- **Form Validation** - Real-time email and password validation with field-specific errors
- **Password Security** - Secure text entry with SVG eye icon visibility toggle
- **Error Handling** - User-friendly error messages and loading states
- **Session Management** - Token-based authentication with automatic session restoration
- **Network Status** - Real-time connectivity indicators with blue/grey color coding
- **Theme Toggle** - Sun/Moon SVG icons for instant light/dark mode switching
- **Visual Feedback** - All icons provide immediate visual status feedback
- **Layered Architecture** - Separation of UI, business logic, and data layers

### **Screen Components**
- **LoginScreen**: Clean authentication with email/password
- **SignUpScreen**: Registration with password confirmation
- **Responsive Design**: ScrollView containers for all screen sizes
- **Keyboard Handling**: Proper KeyboardAvoidingView implementation

## 💾 Database Features

### **Offline-First Architecture**
- **Complete Offline Functionality** - All CRUD operations work without internet
- **Automatic Sync Queue** - Operations are queued and synced when online
- **Authentication Storage** - User sessions and tokens stored locally in SQLite
- **Session Persistence** - Login state maintained across app restarts
- **Conflict Resolution** - Built-in conflict detection and resolution
- **Data Persistence** - SQLite database with proper schema design

### **Database Tables**
- **User Session** - Current user authentication tokens and session data
- **Notes** - Main notes with sharing and bookmark support
- **Users** - Cached user data for sharing functionality
- **Sync Queue** - Pending operations for online synchronization
- **App Settings** - Application configuration and sync metadata

### **Sync Capabilities**
- **Smart Sync** - Only syncs changed data
- **Session Restoration** - Automatic login state recovery on app startup
- **Conflict Handling** - Automatic conflict detection with user resolution options
- **Retry Logic** - Failed sync operations are automatically retried
- **Performance Optimized** - Indexed database with efficient queries

## 🌐 API & Network Features

### **HTTP Client Architecture**
- **Centralized Configuration**: Base URL and timeout settings in config
- **Organized Structure**: Separated endpoints, requests, and interceptors
- **Type-Safe Requests**: TypeScript interfaces for all API calls

### **Authentication & Session Management**
- **Automatic 401 Detection**: Interceptor catches expired sessions
- **User-Friendly Alerts**: "Login session expires. To Sync data please login again."
- **Seamless Redirect**: Auto-navigation to login screen on session expiry
- **Bearer Token Support**: Automatic token handling in request headers

### **Request/Response Handling**
- **Error Interceptors**: Global error handling for consistent UX
- **Request Configuration**: Flexible parameter and header management
- **Response Processing**: Standardized data extraction and error handling

### **Network Status Management**
- **Real-Time Monitoring**: Live network connectivity detection using @react-native-community/netinfo
- **Visual Indicators**: Custom SVG WiFi icons showing connection status
- **Color-Coded Status**: Blue icons when connected, grey when offline
- **Universal Coverage**: Network status visible on all screens (Login, SignUp, Home, Note)
- **Automatic Updates**: Instant icon changes when network state changes
- **Layered Architecture**: NetworkService in infrastructure, useNetworkStatus hook in presentation
- **No Manual Refresh**: Detects WiFi, cellular, airplane mode changes automatically

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
  - **Features**: Real-time validation, SVG eye icon password toggle, blue/grey network status, sun/moon theme toggle

- **SignUpScreen**: User registration with account creation
  - **Header**: Hidden for clean, full-screen experience
  - **Navigation**: Routes to Home screen on successful registration
  - **Features**: Form validation, dual password visibility toggles, network status indicator, theme switching

#### **Main App Screens**
- **HomeScreen**: Main dashboard displaying user's notes
  - **Header**: Visible with navigation title, network status, and theme toggle
  - **Navigation**: Routes to Note screen for editing
  - **Features**: Notes list, search functionality, add new note, offline support

- **NoteScreen**: Individual note editing and viewing
  - **Header**: Visible with back navigation, network status, and theme toggle
  - **Navigation**: Routes back to Home screen
  - **Features**: Rich text editing, save functionality, conflict resolution, offline editing

### **Navigation Features**

- **TypeScript Support**: Fully typed navigation parameters
- **Performance Optimization**: Native screen rendering with `enableScreens()` for improved performance
- **Smart Headers**: Custom header styling with integrated status indicators
- **Dual Icon System**: Network status (left) + theme toggle (right) in all headers
- **Theme Integration**: Headers automatically adapt to light/dark themes
- **Real-Time Updates**: Header icons update instantly with network/theme changes
- **Gesture Navigation**: Swipe-to-go-back functionality
- **Safe Area Handling**: Proper layout on devices with notches
- **Screen Transitions**: Smooth animations between screens

### **Styling & Theming**

#### **Theme System**
- **Dynamic Theming**: Built-in light and dark mode support with instant switching
- **Visual Theme Toggle**: Custom Sun/Moon SVG icons for intuitive theme switching
- **Context-Based**: Theme state managed through React Context
- **Color Management**: Centralized color definitions in `Colors.tsx` with theme variants
- **Smart Icon Colors**: 
  - Network status: Blue (connected) / Grey (offline)
  - Theme icons: Primary color for brand consistency
  - UI icons: Adaptive grey tones for subtle appearance
- **Universal Availability**: Theme toggle accessible on every screen
- **Responsive Headers**: Navigation headers adapt to current theme

#### **Styling Architecture**
- **GlobalStyles**: Centralized styling definitions with theme functions
- **Custom Components**: Theme-aware UI components with consistent styling
- **SVG Icon System**: Scalable vector graphics for crisp display at any size
- **Color Variants**: Primary, secondary, border, background, text, icon, and network colors
- **Visual Hierarchy**: Different icon sizes for importance (network: 20px, theme: 24px)
- **Responsive Design**: Flexible layouts that work across all screen sizes

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

### SQLite Database Issues

6. **SQLite iOS issues**: 
   - Run `cd ios && pod install && cd ..` to ensure proper linking
   - Check that SQLite pod is properly added to Podfile
7. **SQLite Android issues**: 
   - SQLite should work automatically via autolinking
   - Clean and rebuild if database operations fail
8. **Database initialization errors**: 
   - Check device storage space
   - Verify database permissions
   - Check console logs for specific SQLite errors
9. **Sync conflicts**: 
   - App handles conflicts automatically
   - Check network connectivity for sync issues
10. **Configuration warnings**: 
    - SQLite configuration warnings are cosmetic only
    - Functionality remains unaffected

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
- [SQLite Storage](https://github.com/andpor/react-native-sqlite-storage)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the layered architecture
4. Run tests: `yarn test`
5. Run linting: `yarn lint`
6. Submit a pull request

---

**Note**: This project requires Node.js version 18 or higher as specified in the `package.json` engines field.
