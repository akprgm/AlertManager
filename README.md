# Alert Manager Application

A JavaFX desktop application that allows users to create scheduled alerts with text-to-speech functionality in multiple languages.

## Features

- Create multiple alerts with custom messages
- Schedule alerts at specific times
- Support for multiple languages (English, Spanish, French, German, Italian)
- Text-to-speech functionality
- Start/Stop control for each alert
- Tab-based interface for managing multiple alerts

## Prerequisites

1. Java 17 or higher (OpenJDK recommended)
2. Gradle (included via wrapper)
3. Google Cloud credentials for Text-to-Speech and Translation APIs
4. For building native installers:
   - Windows: WiX Toolset for MSI creation
   - macOS: Xcode Command Line Tools

## Setup

1. Clone the repository
2. Set up Google Cloud credentials:
   - Create a project in Google Cloud Console
   - Enable Text-to-Speech and Cloud Translation APIs
   - Create a service account and download the JSON key file
   - Set the environment variable: `export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"`

3. Build and run the project:
```bash
# On macOS/Linux
./gradlew clean run

# On Windows
gradlew.bat clean run
```

4. Create a native installer (optional):
```bash
# On macOS
./gradlew jpackage   # Creates a .dmg installer

# On Windows
gradlew.bat jpackage  # Creates an MSI installer
```

The installers will be created in the `build/jpackage` directory.

## Usage

1. In the Home tab:
   - Enter an alert name
   - Type your message
   - Select the desired language
   - Set the time for the alert
   - Click "Create New Alert"

2. In the alert tab:
   - Click "Start Alert" to activate the scheduled alert
   - Click "Stop Alert" to deactivate it

The alert will play the translated message at the specified time every day until stopped.
