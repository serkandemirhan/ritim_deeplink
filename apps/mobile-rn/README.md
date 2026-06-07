# Ritim Mobile RN

This is the first phase of the Ritim mobile app, focused on Android-first development using Expo.

## Getting Started

1. Install dependencies from the repo root:
   ```bash
   yarn install
   ```
2. Run the Android-first Expo app:
   ```bash
   yarn android
   ```

## Android-focused features

- Mock NFC registration flow for tag assignment
- Local habit tracking state with completion toggles
- Daily progress summary and quick complete action
- Android-style UI polish for the first mobile phase

## Notes

- The current app is a prototype shell, not a production NFC integration.
- Use `Register NFC` to simulate adding a new tag and assigning it to a habit.
- Tap any habit card to toggle its completion state.
