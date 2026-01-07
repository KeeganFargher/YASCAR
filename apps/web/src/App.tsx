import './App.css';

function App() {
  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <nav className="nav">
            <a href="/" className="logo">
              <span className="logo-icon">🔑</span>
              <span className="logo-text">YASCAR</span>
            </a>
            <div className="nav-links">
              <a href="#features">Features</a>
              <a href="#games">Games</a>
              <a href="#download" className="btn btn-primary">Download</a>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="hero">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">
                Never Miss a <span className="highlight">Shift Code</span> Again
              </h1>
              <p className="hero-description">
                YASCAR automatically finds and redeems SHiFT codes for your Borderlands games.
                Golden Keys delivered straight to your account while you sleep.
              </p>
              <div className="hero-actions">
                <a href="#download" className="btn btn-primary btn-lg">
                  Download for Free
                </a>
                <a href="#features" className="btn btn-secondary btn-lg">
                  Learn More
                </a>
              </div>
            </div>
            <div className="hero-visual">
              <div className="key-icon">🔑</div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="features">
          <div className="container">
            <h2 className="section-title">Why YASCAR?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3>Automatic Redemption</h3>
                <p>Set it and forget it. YASCAR redeems codes as soon as they're discovered.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔍</div>
                <h3>Multi-Source Scraping</h3>
                <p>We monitor Twitter, Reddit, and gaming sites so you don't have to.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎮</div>
                <h3>All Borderlands Games</h3>
                <p>Support for BL1 GOTY, BL2, TPS, BL3, and Tiny Tina's Wonderlands.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h3>Secure & Private</h3>
                <p>Your credentials are stored locally and encrypted. We never see your password.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Games */}
        <section id="games" className="games">
          <div className="container">
            <h2 className="section-title">Supported Games</h2>
            <div className="games-grid">
              {['Borderlands GOTY', 'Borderlands 2', 'Borderlands: TPS', 'Borderlands 3', "Tiny Tina's Wonderlands"].map((game) => (
                <div key={game} className="game-card">
                  <div className="game-name">{game}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Download */}
        <section id="download" className="download">
          <div className="container">
            <h2 className="section-title">Get Started</h2>
            <p className="download-description">
              Download YASCAR for your platform and start collecting Golden Keys today.
            </p>
            <div className="download-buttons">
              <a href="#" className="btn btn-primary btn-lg">
                Windows
              </a>
              <a href="#" className="btn btn-secondary btn-lg">
                macOS
              </a>
              <a href="#" className="btn btn-secondary btn-lg">
                Linux
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>© 2026 YASCAR. Not affiliated with Gearbox Software or 2K Games.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
