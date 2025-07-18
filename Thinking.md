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

# Commit 3: Make technical decision and Add all necessary Packages.
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

 