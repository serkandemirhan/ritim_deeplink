import AutoOpenApp from './AutoOpenApp';

type TagPageProps = {
  params: Promise<{ tagCode: string }>;
};

export default async function TagPage({ params }: TagPageProps) {
  const { tagCode } = await params;
  const decodedTagCode = decodeURIComponent(tagCode);
  const appSchemeUrl = `ritimapp://t/${encodeURIComponent(decodedTagCode)}`;

  return (
    <main className="page">
      <section className="hero">
        <div className="logo"><span className="logo-mark">R</span> RitimApp</div>
        <p className="status">NFC card detected</p>
        <h1>This NFC card belongs to RitimApp.</h1>
        <p>
          If the mobile app is installed and the domain association is verified,
          this link should open RitimApp automatically. This page is the web fallback.
        </p>
        <AutoOpenApp appSchemeUrl={appSchemeUrl} />

        <div className="grid">
          <div className="card">
            <div className="label">Detected tagCode</div>
            <code className="code">{decodedTagCode}</code>
          </div>
          <div className="card">
            <div className="label">App fallback link</div>
            <code className="code">{appSchemeUrl}</code>
          </div>
        </div>

        <div className="button-row">
          <a className="button" href={appSchemeUrl}>Open in RitimApp</a>
          <a className="button secondary" href="/test">View test links</a>
        </div>
      </section>
    </main>
  );
}
