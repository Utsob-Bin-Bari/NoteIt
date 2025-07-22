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

# Commit 14: Total Backend Funtionality with Clear data and Query Request functionality 
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
* Missing Feature: (0nline)
  - Auto Sync from the Query
  - Conflict Resolution

