const appJson = require('./app.json');

const deeplinkHost = process.env.EXPO_PUBLIC_DEEPLINK_DOMAIN || 'dev.getritim.com';

module.exports = {
  ...appJson.expo,
  ios: {
    ...appJson.expo.ios,
    associatedDomains: [`applinks:${deeplinkHost}`],
  },
  android: {
    ...appJson.expo.android,
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: deeplinkHost,
            pathPrefix: '/t',
          },
          {
            scheme: 'https',
            host: deeplinkHost,
            pathPrefix: '/auth/callback',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  extra: {
    ...appJson.expo.extra,
    environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
    appUrl: process.env.EXPO_PUBLIC_APP_URL || `https://${deeplinkHost}`,
    deeplinkDomain: deeplinkHost,
  },
};
