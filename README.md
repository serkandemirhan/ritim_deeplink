# RitimApp Web

Next.js web surface for RitimApp.

It serves:

- Public production landing page
- NFC web fallback route `/t/{tagCode}`
- Universal Links / Android App Links files
- Platform and sports center console routes
- Development test tools under `/test-links`

## Environments

RitimApp uses three web environments, but currently only two Supabase projects because the Supabase free plan does not allow a separate staging project.

| Environment | Branch | Domain | Vercel environment | Supabase project | Purpose |
| --- | --- | --- | --- | --- | --- |
| Development | `develop` | `dev.getritim.com` | Development | `ritim-dev` | Active development, Codex changes, NFC tests, test users, test sports centers, test cards |
| Staging | `staging` | `staging.getritim.com` | Staging / Preview validation | `ritim-dev` | Release validation, demo flow testing, app link/universal link validation |
| Production | `main` | `getritim.com`, `www.getritim.com` | Production | `ritim-prod` | Real users, real NFC cards, real sports centers, real subscriptions/payments |

Feature branches should merge into `develop` first. Production deploys come from `main`.

Production homepage is customer-facing. Developer/test links are available at `/test-links` and must not be promoted as public homepage content.

## Supabase Strategy

Current project mapping:

- `ritim-dev` is shared by development and staging.
- `ritim-prod` is only for production.
- There is no separate staging Supabase project right now.

Critical rules:

- Do not create, reference, or require a separate staging Supabase project right now.
- Never use production Supabase keys in development or staging.
- Never use development Supabase keys in production.
- Never commit real Supabase keys or real `.env` files.
- All Supabase configuration must come from environment variables.

A separate staging Supabase project may be added later if the Supabase plan is upgraded or pilot customers require stricter separation.

## Required Environment Variables

Required for every environment:

```text
NEXT_PUBLIC_ENVIRONMENT=production|staging|development
NEXT_PUBLIC_APP_URL=https://getritim.com
NEXT_PUBLIC_DEEPLINK_DOMAIN=getritim.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The console also supports environment-specific Supabase variable aliases. Prefer these in Vercel when one project serves multiple branches:

```text
NEXT_PUBLIC_SUPABASE_URL_DEV=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY_DEV=your-dev-service-role-key

NEXT_PUBLIC_SUPABASE_URL_STAGING=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY_STAGING=your-staging-service-role-key

NEXT_PUBLIC_SUPABASE_URL_PROD=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY_PROD=your-prod-service-role-key
```

Console protection in production:

```text
CONSOLE_BASIC_AUTH_USER=admin
CONSOLE_BASIC_AUTH_PASSWORD=change-me
```

Native app association:

```text
NEXT_PUBLIC_ANDROID_PACKAGE_NAME=com.ritimapp.mobile
NEXT_PUBLIC_ANDROID_SHA256_CERT_FINGERPRINTS=AA:...
NEXT_PUBLIC_IOS_APP_ID=TEAMID.com.ritimapp.mobile
```

See `.env.example`. Do not commit real `.env` files.

## Vercel Variable Mapping

Development:

```text
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_APP_URL=https://dev.getritim.com
NEXT_PUBLIC_DEEPLINK_DOMAIN=dev.getritim.com
NEXT_PUBLIC_SUPABASE_URL_DEV=<ritim-dev-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV=<ritim-dev-anon-key>
SUPABASE_SERVICE_ROLE_KEY_DEV=<ritim-dev-service-role-key>
```

Staging:

```text
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_APP_URL=https://staging.getritim.com
NEXT_PUBLIC_DEEPLINK_DOMAIN=staging.getritim.com
NEXT_PUBLIC_SUPABASE_URL_STAGING=<ritim-staging-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING=<ritim-staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY_STAGING=<ritim-staging-service-role-key>
```

Production:

```text
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_URL=https://getritim.com
NEXT_PUBLIC_DEEPLINK_DOMAIN=getritim.com
NEXT_PUBLIC_SUPABASE_URL_PROD=<ritim-prod-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD=<ritim-prod-anon-key>
SUPABASE_SERVICE_ROLE_KEY_PROD=<ritim-prod-service-role-key>
```

## NFC URL Format

NFC links must be generated from `NEXT_PUBLIC_DEEPLINK_DOMAIN`.

```text
https://{domain}/t/{tagCode}
```

Examples:

```text
https://dev.getritim.com/t/NFC_TEST_001
https://staging.getritim.com/t/NFC_TEST_001
https://getritim.com/t/NFC_REAL_001
```

Production NFC tags must never be written with dev or staging domains.

The NFC card should contain only the public tag URL. It should not contain user ID, exercise ID, shortcut details, or secret data.

## Verification Files

Keep these routes working in all environments:

```text
/.well-known/assetlinks.json
/.well-known/apple-app-site-association
/t/[tagCode]
```

Confirm these return JSON:

```text
https://getritim.com/.well-known/assetlinks.json
https://getritim.com/.well-known/apple-app-site-association
```

The same paths are available on dev and staging domains. If Apple or Android association values differ by environment, configure them with environment variables:

```text
NEXT_PUBLIC_ANDROID_PACKAGE_NAME
NEXT_PUBLIC_ANDROID_SHA256_CERT_FINGERPRINTS
NEXT_PUBLIC_IOS_APP_ID
```

## Console Routes

These routes remain available:

```text
/console
/console/platform
/console/sports-center
/sports-center-console
```

In production, console routes are protected by authentication. They must not be promoted as public homepage content.

## Non-Production Badge

- `NEXT_PUBLIC_ENVIRONMENT=development` shows a small `DEV` badge.
- `NEXT_PUBLIC_ENVIRONMENT=staging` shows a small `STAGING` badge.
- Production shows no badge.

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Test NFC/universal links:

```text
http://localhost:3000/test-links
```
