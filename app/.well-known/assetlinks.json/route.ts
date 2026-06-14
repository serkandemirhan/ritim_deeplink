export const dynamic = 'force-dynamic';

const DEFAULT_ANDROID_PACKAGE = 'com.ritimapp.mobile';
const DEFAULT_ANDROID_FINGERPRINT = 'AA:E3:17:80:4E:F6:21:61:F0:1C:82:96:70:E4:EF:A5:77:62:F8:F2:66:C1:1C:29:AD:8F:3D:17:44:B5:ED:62';

export function GET() {
  const packageName = process.env.NEXT_PUBLIC_ANDROID_PACKAGE_NAME || DEFAULT_ANDROID_PACKAGE;
  const fingerprints = (process.env.NEXT_PUBLIC_ANDROID_SHA256_CERT_FINGERPRINTS || DEFAULT_ANDROID_FINGERPRINT)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return Response.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: packageName,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ], {
    headers: {
      'Cache-Control': 'public, max-age=300',
    },
  });
}
