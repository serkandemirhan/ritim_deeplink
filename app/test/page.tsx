export default function TestPage() {
  const links = [
    '/t/NFC_TEST_001',
    '/t/NFC_TEST_002',
    'ritimapp://t/NFC_TEST_001'
  ];

  return (
    <main className="page">
      <section className="hero">
        <div className="logo"><span className="logo-mark">R</span> RitimApp</div>
        <h1>Test links</h1>
        <p>Use these links to test browser fallback, Universal Links, Android App Links, and NFC tag writing.</p>
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
          <a className="button secondary" href="/">Back home</a>
        </div>
      </section>
    </main>
  );
}
