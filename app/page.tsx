export default function HomePage() {
  const exampleUrl = 'https://YOUR-VERCEL-DOMAIN/t/NFC_TEST_001';

  return (
    <main className="page">
      <section className="hero">
        <div className="logo"><span className="logo-mark">R</span> RitimApp</div>
        <h1>NFC Universal Link test domain</h1>
        <p>
          This website is used to test RitimApp NFC cards, iOS Universal Links,
          Android App Links, and browser fallback behavior.
        </p>

        <div className="grid">
          <div className="card">
            <div className="label">NFC card URL format</div>
            <code className="code">https://YOUR-VERCEL-DOMAIN/t/&#123;tagCode&#125;</code>
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

        <div className="button-row">
          <a className="button" href="/test">Open test links</a>
          <a className="button secondary" href="/.well-known/assetlinks.json">Android assetlinks.json</a>
          <a className="button secondary" href="/.well-known/apple-app-site-association">iOS association</a>
        </div>
      </section>
    </main>
  );
}
