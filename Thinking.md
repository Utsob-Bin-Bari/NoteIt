# Commit 1: Initial commit with configuration
* React Native Latest Stable version: "0.80.1"
  Reason: As per requirement.
* Chose Bare Workflow for more flexibility.
  Reason: Although Expo can reduce development time, But Expo has size and performance overhead and features comes months later at expo. Real Application need every bit of advantage to shine. 
* Keep Typescript enabled. 
  Reason: As per requirement and collaborating on typescript is much easier. It creates less error on runtime and save development time when code base got bigger.
* Move to Yarn for Package Management.
  Reason: Personal Preferance. 

# Commit 2: Script Updated, New Arch Enabled, Update Git Ignore & README.md
* Git ignore updated.
  Reason: It won't change the build file again and again by my device configuration on each push. Collaborators can build once and run almost every version of git code without building again.
* New Architecture & Hermes Engine Enabled.
  Reason: Faster build and faster run. Who don't want the best performance on their application!
* Script Updated.
  Reason: Make my life easier by running command faster without remembering it.
* README.md Updated with project setup instructions & Environment configuration.
  Reason: As per requirement and best practices.

# Commit 3: Make technical decision and Add all necessary Packages
* Reason: With base model Apple Macbook M1 it's time consuming to build application again and agian
  with each dependency. So deciding which packages are required at early stage and install all at once is better.

## Navigation & UI Framework
* **@react-navigation/native (v7.1.14)**: Foundation for all navigation functionality in the app.
* **@react-navigation/stack (v7.4.2)**: We don't need bottom tab or drawer for this simple application.
  Stack navigator for screen transitions and navigation hierarchy.
* **react-native-screens (v4.13.1)**: Optimizes screen rendering using native UIViewController and 
  Fragment components.
* **react-native-safe-area-context (v5.5.2)**: Safe area handling for devices with notches and home 
  indicators. 
* **react-native-gesture-handler (v2.27.1)**: Native gesture handling for swipe-to-go-back and touch
  interactions. Use Case: Enables intuitive navigation gestures and smooth touch responses.
* **@react-native-masked-view/masked-view (v0.3.2)**: UI masking for smooth screen transitions. Use 
  Provides seamless header and screen animations during navigation.

## State Management & Data Flow
* **@reduxjs/toolkit (v2.8.2)**: Modern Redux with simplified setup and best practices
* **react-redux (v9.2.0)**: React bindings for Redux state management

## Performance & UI Components
* **@shopify/flash-list (v1.8.3)**: High-performance list component optimized for large datasets.
* **react-native-svg (v15.12.0)**: SVG support for custom icons and graphics. It allows me to use any
  svg I like from the web.

## Network & API Communication
* **axios (v1.10.0)**: HTTP client for API requests with interceptors and error handling. 
* **@react-native-community/netinfo (v11.4.1)**: Network connectivity monitoring and status detection. 

## Local Storage & Data Persistence
* **react-native-sqlite-storage (v6.0.1)**: Direct SQLite database access for local data storage.
  Cause data need to stay in structure which is really hard to established without async storage. WatermelonDB might have make think easy but I like challenges.

## Conflict Resolution & Data Synchronization
* **diff-match-patch (v1.0.5)**: Google's algorithm for text comparison and merging. Resolving
  conflicts when multiple users edit the same note by intelligently merging text changes. Implementation: When syncing notes, compares original text with local changes and server changes to create a merged version that preserves both users' additions while handling conflicts gracefully. 

# Commmit 4: Select Architecture and set Cursor Rules
* Layered (Clean) Architecture will be followed. It will help us to write cleaner code, keep the 
  seperation of concern and maintainability of my codebase.
* Cursor Rules are implemented to generate better output from my Prompt and maintain my preference and 
  coding styles.
* Add project structure to the README.md file 

# Commit 5: Create simple page, Implement Navigation
* All Pages are created with simple text.
* Stack Navigator has been used to navigate between them.

# Commit 6: Create App Context to implement Dark and Light Theme
* It's a really simple state to manage so I will use useContext here. 
* I can integrated it in Redux store also. But let's have some fun.

# Commit 7: Fix some design and Enable Screens
* enableScreens() implemented which I forgot to implemented during navigation implementation.
* Removed the back text from ios. 
* Added border bottom for dark-light consitancy.

# Commit 8: Create Database & Implement TypeSafety of Api Calls
* Generalised Database is created using the API documentation and primary concept of keeping the local database identical to the backend database. It is initated with AI and will be updated manually on each functionality implementation.
* Types are added to include typesafety to our api calls. 
* DatabaseUsageGuide.md is created to help understand and implement CURD operation on local database.


# Commit 9: All Api Conifuration & Error Handling 
* All api request is implemnted properly with type safety.
* Interceptor is used if Access Token expires it will take to login page.
* Config.js is added to keep the base url and default settings like timeout.

# Commit 10: Authentication Page Design
* Make Sign Up Page with visibility toggle and custom component.
* Make Log In Page with visibility toggle and custom component.
* Keep dark-light mode consistant. 

# Commit 11: Create and Implement Custom Dark-Light Icons and Network Availble Icons
* Create Dark-Light icons using react-native-svgs.
* Create Network On-Off icons usering react-native-svgs.
* Implement @react-native-community/netinfo to check netword connectivity.

# Commit 12: Configure Redux store and Implement Login functionality 
* Create Action, Reducer and store with redux.
* Provide it to whole application.
* Make decision about how the whole architecture will work. On normal mode local store will be the source of truth and backend will replicate local store. On recovery it will be opposite. UI will be fetch from redux.
* Add Login Functionality with including storing user info in local store and auto Login.

# Commit 13: Implement Complete Data Recovery System
* Create RecoveryService following layered architecture with functional service pattern.
* Implement comprehensive recovery detection for database corruption, uninstall/reinstall scenarios.
* Add complete data recovery covering all backend data types:
  - User's own notes via fetchAllNotes()
  - Notes shared with user via getUserSharedNotes() 
  - Notes user bookmarked via fetchAllBookmarkedNotes()
  - User profile data via getUserData()
* Create useRecovery hook for recovery state management with progress tracking.
* Build RecoveryScreen component with visual progress indicators and detailed recovery results.
* Integrate recovery detection into app initialization flow.
* Support graceful recovery with user choice (restore or skip).
* Maintain offline-first architecture where SQLite remains source of truth post-recovery.

# Commit 14: Total Backend Funtionality with Clear data and Query Management functionality 
* Everthing is storing locally through backend 
* Process: User Action -> Change Local SQLite Store -> Update the Redux (UI) -> Query the operation (With local_id)
* All functionality required is added 
  - Authenticaion
  - Notes CURD Operation
  - Share Notes 
  - Search Notes by title
  - Bookmarks
  - View Shared Notes
  - View with whom notes are shared
* Optimistic Design for good user experiece is implemented
* Clear SQLite store is implemented. (Extra featuer)
* Query Management is added. (Extra feature)

# Commit 15: Conflict Resolution, Security & Enhanced UX Implementation
* Complete conflict resolution system implemented using diff-match-patch for intelligent note merging.
* Multi-layer ownership validation system to secure note operations.
* Comprehensive keyboard behavior improvements across all input components.
* Enhanced user experience with tap-to-dismiss functionality and keyboard avoidance.

## Conflict Resolution & Data Synchronization
* **diff-match-patch Integration**: Intelligent 3-way merge algorithm for handling simultaneous note edits.
  - Last write wins strategy for conflict resolution with user notification
  - Server-side conflict detection when internet available and note has server_id
  - Automatic merging of non-conflicting changes while preserving user intent
* **Real-time Conflict Handling**: Applied to both direct updates and back button update operations.
  - Conflict resolution in noteEditorService.updateNoteWithRedux()
  - User feedback via alerts when conflicts are resolved
  - Graceful fallback when conflict resolution fails
* **Network-Aware Operation**: Only triggers when online with server_id present, maintaining offline-first architecture.

## Security & Ownership Validation System
* **Multi-Layer Protection**: 3-tier validation system for note deletion security.
  - UI Component Level: Pre-delete ownership validation with user alerts
  - React Hook Level: Secondary validation in useAllNotes with structured error responses  
  - Service Level: Final validation in deleteNote service before database operations
* **Domain Layer Validation**: Created noteOwnershipValidator.ts following layered architecture.
  - validateNoteOwnership() for direct note object validation
  - validateNoteOwnershipById() for ID-based validation with note searching
  - Supports both server IDs and local IDs for comprehensive coverage
* **User Experience**: Clear "Only owner can delete the note" alerts prevent unauthorized actions.
  - No breaking of existing functionality for legitimate operations
  - Seamless experience for note owners with normal delete flow

## Enhanced Keyboard & Input Management
* **ShareInput Component**: Complete keyboard avoidance and dismissal system.
  - KeyboardAvoidingView with platform-specific behavior (iOS: padding, Android: height)
  - TouchableWithoutFeedback for tap-anywhere-to-dismiss functionality
  - Custom keyboard offset optimization for share input context
* **NoteScreen Enhancement**: Tap-to-dismiss keyboard while maintaining editing capabilities.
  - Enhanced existing KeyboardAvoidingView with TouchableWithoutFeedback wrapper
  - Accessible={false} to prevent accessibility interference
  - Seamless integration with title and content TextInputs
* **SearchInput & HomeScreen**: Global keyboard dismissal for search functionality.
  - onSubmitEditing keyboard dismissal on return/search key press
  - HomeScreen TouchableWithoutFeedback for global search keyboard management
  - blurOnSubmit optimization for better search experience
* **FlashList Optimizations**: Added keyboardShouldPersistTaps="handled" to both AllNotesComponent and AllBookmarksComponent.
  - Allows interaction with notes/bookmarks while keyboard is visible
  - Smooth scrolling and interaction during share input usage

## Architecture & Performance Improvements
* **Layered Architecture Compliance**: All new features follow established Clean Architecture patterns.
  - Validators in domain layer, services in application layer, UI in presentation layer
  - Functional service patterns maintained (no classes in service layer)
  - Proper separation of concerns with single responsibility principle
* **Type Safety & Error Handling**: Full TypeScript implementation with comprehensive error handling.
  - Robust ID handling supporting both server IDs and local IDs
  - Memory-safe React callback dependencies and cleanup
  - Platform-specific optimizations for iOS and Android
* **User Experience Focus**: Non-intrusive conflict resolution with clear user feedback.
  - Optimistic UI updates maintained while adding security layers
  - Performance-conscious implementation with minimal re-renders
  - Accessibility considerations maintained throughout

## Technical Implementation Details
* **Conflict Resolution Flow**: User Save → Check Network & Server ID → Fetch Server Version → 3-way Merge → Apply Changes → Update SQLite → Redux Update → UI Refresh
* **Security Validation Flow**: User Delete → UI Ownership Check → Hook Validation → Service Validation → Database Operation → Redux Update
* **Keyboard Management**: Platform-aware keyboard handling with TouchableWithoutFeedback and KeyboardAvoidingView integration
* **Cross-Platform Consistency**: iOS and Android optimized behaviors while maintaining unified codebase

# Commit 16: Minor Design change
* Enable dark theme on sync log

# Commit 17: apk and screen recording is added. 
* apk file is added.
* screen recording is added.
* Ipa file is creating problem due to node dependency so couldn't extract at that moment.