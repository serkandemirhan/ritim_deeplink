# RitimApp NFC Web Test Domain

This is a minimal Next.js website for testing RitimApp NFC Universal Links and Android App Links on Vercel.

It is not the main mobile app. It only provides:

- A free HTTPS test domain on Vercel
- Android App Links verification file
- iOS Universal Links association file
- Web fallback page for `/t/{tagCode}` NFC URLs

## NFC URL format

```text
https://YOUR-VERCEL-DOMAIN/t/{tagCode}
```

Example:

```text
https://YOUR-VERCEL-DOMAIN/t/NFC_TEST_001
```

## Deploy to Vercel

1. Push this project to GitHub.
2. Import the repository in Vercel.
3. Deploy.
4. Note your deployed domain, for example:

```text
https://ritimapp-nfc-test.vercel.app
```

## Required verification files

After deployment, confirm these URLs return JSON directly:

```text
https://YOUR-VERCEL-DOMAIN/.well-known/assetlinks.json
```

```text
https://YOUR-VERCEL-DOMAIN/.well-known/apple-app-site-association
```

## Android setup

Update:

```text
public/.well-known/assetlinks.json
```

Replace:

```text
REPLACE_WITH_ANDROID_SHA256_CERT_FINGERPRINT
```

with your real Android app signing certificate SHA256 fingerprint.

The package name currently used is:

```text
com.ritimapp.mobile
```

## iOS setup

Update:

```text
public/.well-known/apple-app-site-association
```

Replace:

```text
REPLACE_WITH_APPLE_TEAM_ID.com.ritimapp.mobile
```

with your real Apple Team ID and bundle ID.

Example:

```text
ABCDE12345.com.ritimapp.mobile
```

## Expo config example

Use your real Vercel domain in the config below.

```json
{
  "expo": {
    "scheme": "ritimapp",
    "ios": {
      "bundleIdentifier": "com.ritimapp.mobile",
      "associatedDomains": [
        "applinks:YOUR-VERCEL-DOMAIN"
      ]
    },
    "android": {
      "package": "com.ritimapp.mobile",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "YOUR-VERCEL-DOMAIN",
              "pathPrefix": "/t"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

## NFC card writing

Write this URL to the NFC card as an NDEF URI record:

```text
https://YOUR-VERCEL-DOMAIN/t/NFC_TEST_001
```

The card should not contain user ID, exercise ID, shortcut details, or secret data.

## Test plan

1. Deploy website to Vercel.
2. Confirm these URLs work:
   - `https://YOUR-VERCEL-DOMAIN/.well-known/assetlinks.json`
   - `https://YOUR-VERCEL-DOMAIN/.well-known/apple-app-site-association`
3. Build/install the React Native app using EAS/dev build, not Expo Go.
4. Open:
   - `https://YOUR-VERCEL-DOMAIN/t/NFC_TEST_001`
5. Confirm the app opens and receives `tagCode`.
6. Write the same URL to an NFC tag:
   - `https://YOUR-VERCEL-DOMAIN/t/NFC_TEST_001`
7. Scan NFC tag while online.
8. Confirm RitimApp opens and receives the `tagCode`.
9. Turn off internet after the domain association has already been verified.
10. Scan the same NFC tag again.
11. Confirm RitimApp opens and saves the event locally with `syncStatus = pending`.

## Local development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```
