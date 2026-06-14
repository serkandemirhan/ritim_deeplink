export const dynamic = 'force-dynamic';

const DEFAULT_APP_ID = 'TEAMID.com.ritimapp.mobile';

export function GET() {
  const appId = process.env.NEXT_PUBLIC_IOS_APP_ID || DEFAULT_APP_ID;
  const payload = {
    applinks: {
      apps: [],
      details: [
        {
          appID: appId,
          paths: ['/t/*'],
          components: [
            {
              '/': '/t/*',
              comment: 'RitimApp NFC tag deep links',
            },
          ],
        },
      ],
    },
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
