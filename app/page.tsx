import { getCurrentEnvironment, getPublicAppUrl } from './_lib/environment';

export default async function HomePage() {
  const environment = await getCurrentEnvironment();
  const appUrl = getPublicAppUrl(environment);

  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <a className="console-brand" href="/">
          <span className="logo-mark">R</span>
          <span>Ritim</span>
        </a>
        <div className="landing-nav-links">
          <a href="#personal">Kisisel Ritimler</a>
          <a href="#sports-centers">Spor Merkezleri</a>
          <a href="/console/platform">Console</a>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">Dokun. Kaydet. Gelis.</p>
          <h1>NFC ile aliskanlik, fitness ve wellness takibi.</h1>
          <p>
            RitimApp, NFC kartlari ve stickerlariyla spor, okuma, nefes, su ve
            gunluk rutinleri tek dokunusla kaydeden mobil ritim takip platformudur.
          </p>
          <div className="button-row">
            <a className="button" href={`${appUrl}/download`}>Download App</a>
            <a className="button secondary" href={`${appUrl}/demo`}>Request Sports Center Demo</a>
          </div>
        </div>

        <div className="phone-preview" aria-label="RitimApp preview">
          <div className="phone-top">
            <span>Bugun</span>
            <strong>NFC Hazir</strong>
          </div>
          <div className="rhythm-card highlighted">
            <span>Kitap Okuma</span>
            <strong>+20 sayfa ekstra</strong>
            <small>Hedefi gectin</small>
          </div>
          <div className="scan-orb">NFC</div>
          <div className="rhythm-card">
            <span>Squat</span>
            <strong>4 set x 20 tekrar</strong>
            <small>Planli ritim</small>
          </div>
        </div>
      </section>

      <section className="landing-section" id="personal">
        <p className="eyebrow">Kisisel kullanim</p>
        <h2>Her ritim bir karta baglanir.</h2>
        <div className="feature-grid">
          <article className="feature-card">
            <h3>Fitness</h3>
            <p>Squat, sinav, kosu ve esneme gibi hareketleri NFC ile hizli kaydet.</p>
          </article>
          <article className="feature-card">
            <h3>Wellness</h3>
            <p>Su, nefes, meditasyon, uyku ve kahve gibi gunluk aliskanliklari takip et.</p>
          </article>
          <article className="feature-card">
            <h3>Learning</h3>
            <p>Kitap okuma ve ogrenme hedeflerini planli ritimlere donustur.</p>
          </article>
        </div>
      </section>

      <section className="landing-section split" id="sports-centers">
        <div>
          <p className="eyebrow">Spor merkezi operasyonlari</p>
          <h2>Salonlar icin NFC tabanli aktivite altyapisi.</h2>
          <p>
            Spor merkezleri uyelere kart veya sticker atayabilir, egzersizleri
            yonetebilir ve gercek kullanim verisini tek panelden izleyebilir.
          </p>
        </div>
        <div className="sports-panel">
          <span>Sports Center Console</span>
          <strong>Uyeler, kartlar, planlar ve aktiviteler</strong>
          <p>Platform console ve sports center console public homepage’den ayrildi.</p>
        </div>
      </section>
    </main>
  );
}
