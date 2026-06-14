import { getCurrentEnvironment, getDeeplinkDomain, getNfcUrl } from '../_lib/environment';

export default async function TestLinksPage() {
  const environment = await getCurrentEnvironment();
  const domain = getDeeplinkDomain(environment);
  const exampleUrl = getNfcUrl('NFC_TEST_001', environment);
  const links = [
    getNfcUrl('NFC_TEST_001', environment),
    getNfcUrl('NFC_TEST_002', environment),
    'ritimapp://t/NFC_TEST_001',
  ];

  return (
    <main className="page">
      <section className="hero">
        <div className="logo"><span className="logo-mark">R</span> RitimApp</div>
        <p className="status">{environment.toUpperCase()} test tools</p>
        <h1>NFC Universal Link test domain</h1>
        <p>
          This page is used to test RitimApp NFC cards, iOS Universal Links,
          Android App Links, and browser fallback behavior. It is not the public production homepage.
        </p>

        <div className="grid">
          <div className="card">
            <div className="label">NFC card URL format</div>
            <code className="code">https://{domain}/t/&#123;tagCode&#125;</code>
          </div>
          <div className="card">
            <div className="label">Example test URL</div>
            <code className="code">{exampleUrl}</code>
          </div>
          <div className="card">
            <div className="label">Custom scheme fallback</div>
            <code className="code">ritimapp://t/NFC_TEST_001</code>
          </div>
        </div>

        <div className="grid">
          {links.map((link) => (
            <div className="card" key={link}>
              <div className="label">Test link</div>
              <code className="code">{link}</code>
              <div className="button-row">
                <a className="button" href={link}>Open</a>
              </div>
            </div>
          ))}
        </div>

        <div className="button-row">
          <a className="button secondary" href="/.well-known/assetlinks.json">Android assetlinks.json</a>
          <a className="button secondary" href="/.well-known/apple-app-site-association">iOS association</a>
          <a className="button secondary" href="/">Back home</a>
        </div>
      </section>
    </main>
  );
}
