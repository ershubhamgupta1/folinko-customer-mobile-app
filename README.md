Steps to create APK

🔹 Step 1: Install EAS CLI

  npm install -g eas-cli

🔹 Step 2: Login to Expo
  eas login

🔹 Step 3: Initialize EAS in your project

  Go to your project folder:

  cd your-project

🔹 Step 4: Configure build

  eas build:configure


🔹 Step 5: Update eas.json for APK

  By default it builds .aab (Play Store format).
  To generate APK, modify like this:

  {
    "build": {
      "preview": {
        "android": {
          "buildType": "apk"
        }
      },
      "production": {
        "android": {
          "buildType": "apk"
        }
      }
    }
  }

🔹 Step 6: Run Build
  eas build -p android --profile preview

🔹 Step 7: Download APK

  After build completes, Expo gives a download link
  Download APK and share/install anywhere