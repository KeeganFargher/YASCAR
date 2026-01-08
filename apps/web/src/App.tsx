import { CodesSection } from './components/CodesSection';
import appIcon from './assets/icon.png';

function App() {
  return (
    <div className="min-h-screen bg-bl-black relative overflow-hidden">
      {/* CRT and noise overlays */}
      <div className="crt-overlay" />
      <div className="noise-overlay" />

      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-bl-yellow/5 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-bl-orange/5 rounded-full blur-3xl animate-float delay-300" />
        <div className="absolute -bottom-20 right-1/4 w-64 h-64 bg-bl-purple/5 rounded-full blur-3xl animate-float delay-500" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-bl-black-hud backdrop-blur-sm border-b border-bl-gray-dark/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex justify-between items-center">
            <a href="/" className="flex items-center gap-3 group">
              <img
                src={appIcon}
                alt="YASCAR Logo"
                className="w-10 h-10 object-cover rounded-md border border-bl-gray-dark shadow-lg group-hover:shadow-glow-yellow transition-all duration-300"
              />
              <div className="flex flex-col">
                <span className="font-display text-2xl tracking-widest text-white leading-none group-hover:text-bl-yellow transition-colors">
                  YASCAR
                </span>
                <span className="text-[10px] text-bl-gray-light uppercase tracking-wider leading-none hidden md:block">
                  Shift Code Auto Redeemer
                </span>
              </div>
            </a>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="font-display text-sm tracking-wider text-bl-gray-light hover:text-bl-yellow transition-colors">
                FEATURES
              </a>
              <a href="#latest-codes" className="font-display text-sm tracking-wider text-bl-gray-light hover:text-bl-yellow transition-colors">
                CODES
              </a>
              <a href="#games" className="font-display text-sm tracking-wider text-bl-gray-light hover:text-bl-yellow transition-colors">
                GAMES
              </a>
              <a href="#download" className="btn-bl-primary text-sm px-5 py-2">
                DOWNLOAD
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="min-h-screen flex items-center justify-center relative pt-20">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left column - Text */}
              <div className="animate-in fade-in slide-in-from-bottom">
                <div className="inline-block px-4 py-1 bg-bl-yellow/10 border border-bl-yellow/30 mb-6">
                  <span className="font-display text-sm tracking-widest text-bl-yellow">
                    // ECHO-NET TRANSMISSION
                  </span>
                </div>
                <h1 className="text-5xl md:text-7xl font-display text-white mb-6 leading-tight text-cel">
                  NEVER MISS A{' '}
                  <span className="text-bl-yellow">SHIFT CODE</span>{' '}
                  AGAIN
                </h1>
                <p className="text-lg text-bl-gray-light mb-8 max-w-xl leading-relaxed">
                  YASCAR automatically scrapes and redeems SHiFT codes for your Borderlands games.
                  Golden Keys delivered straight to your account while you sleep.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="#download" className="btn-bl-legendary text-lg px-8 py-4">
                    DOWNLOAD NOW
                  </a>
                  <a href="#features" className="btn-bl-secondary text-lg px-8 py-4">
                    LEARN MORE
                  </a>
                </div>
                <div className="mt-8 flex items-center gap-6 text-sm text-bl-gray-light">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-bl-green rounded-full animate-pulse" />
                    <span>Free Forever</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-bl-green rounded-full animate-pulse" />
                    <span>Open Source</span>
                  </div>
                </div>
              </div>

              {/* Right column - Visual */}
              <div className="relative animate-in fade-in delay-200">
                <div className="relative z-10">
                  {/* Floating key visual */}
                  <div className="w-64 h-64 md:w-80 md:h-80 mx-auto relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-bl-yellow via-bl-orange to-bl-legendary rounded-full blur-3xl opacity-30 animate-pulse-glow" />
                    <div className="absolute inset-4 bg-bl-black-card border-3 border-bl-yellow/50 rounded-full flex items-center justify-center shadow-glow-legendary animate-float">
                      <svg className="w-32 h-32 text-bl-yellow animate-spin-slow" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-bl-yellow/30" />
                <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-bl-yellow/30" />
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-bl-gray-light rounded-full flex justify-center">
              <div className="w-1 h-3 bg-bl-yellow rounded-full mt-2" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-display text-white mb-4 text-cel">
                WHY <span className="text-bl-yellow">YASCAR</span>?
              </h2>
              <p className="text-bl-gray-light max-w-2xl mx-auto">
                Stop hunting for codes across Twitter, Reddit, and forums. Let the machine do the work.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: '⚡',
                  title: 'AUTO REDEMPTION',
                  description: 'Set it and forget it. YASCAR redeems codes as soon as they are discovered.',
                  color: 'bl-yellow',
                },
                {
                  icon: '🔍',
                  title: 'MULTI-SOURCE',
                  description: 'We monitor Twitter, Reddit, and gaming sites so you don\'t have to.',
                  color: 'bl-orange',
                },
                {
                  icon: '🎮',
                  title: 'ALL GAMES',
                  description: 'Support for BL1 GOTY, BL2, TPS, BL3, Wonderlands, and BL4.',
                  color: 'bl-purple',
                },
                {
                  icon: '🔒',
                  title: 'SECURE',
                  description: 'Your credentials are stored locally and encrypted. We never see your password.',
                  color: 'bl-blue',
                },
              ].map((feature, index) => (
                <div
                  key={feature.title}
                  className={`card-bl-asymmetric group hover:border-${feature.color} transition-colors`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`text-4xl mb-4 group-hover:animate-glitch`}>
                    {feature.icon}
                  </div>
                  <h3 className={`font-display text-xl text-${feature.color} mb-2`}>
                    {feature.title}
                  </h3>
                  <p className="text-bl-gray-light text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Latest Codes Section */}
        <CodesSection />

        {/* Games Section */}
        <section id="games" className="py-32 bg-bl-black-light relative">
          <div className="absolute inset-0 bg-gradient-to-b from-bl-black via-transparent to-bl-black pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-display text-white mb-4 text-cel">
                SUPPORTED <span className="text-bl-yellow">GAMES</span>
              </h2>
              <p className="text-bl-gray-light max-w-2xl mx-auto">
                Every Borderlands title with SHiFT code support. Choose your favorites.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { name: 'Borderlands GOTY', short: 'BL1' },
                { name: 'Borderlands 2', short: 'BL2' },
                { name: 'Borderlands: TPS', short: 'TPS' },
                { name: 'Borderlands 3', short: 'BL3' },
                { name: "Tiny Tina's Wonderlands", short: 'TTW' },
                { name: 'Borderlands 4', short: 'BL4' },
              ].map((game) => (
                <div
                  key={game.short}
                  className="group relative bg-bl-black-card border-2 border-bl-gray-dark p-6 text-center hover:border-bl-yellow transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="font-display text-3xl text-bl-yellow mb-2 group-hover:text-glow">
                    {game.short}
                  </div>
                  <div className="text-xs text-bl-gray-light uppercase tracking-wider">
                    {game.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Download Section */}
        <section id="download" className="py-32 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <svg className="w-[800px] h-[800px] animate-spin-slow" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
            </svg>
          </div>

          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-display text-white mb-6 text-cel">
              GET <span className="text-bl-yellow">STARTED</span>
            </h2>
            <p className="text-xl text-bl-gray-light mb-12 max-w-2xl mx-auto">
              Download YASCAR for your platform and start collecting Golden Keys today.
              It's free, open source, and takes less than a minute to set up.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <a
                href="https://github.com/KeeganFargher/YASCAR/releases/latest/download/YASCAR_0.1.0_x64-setup.exe"
                className="btn-bl-legendary text-xl px-10 py-5 flex items-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 5.5L1.5 17.5H5.5L7 5.5H3ZM8.5 5.5L7 17.5H11L12.5 5.5H8.5ZM14 5.5L12.5 17.5H16.5L18 5.5H14ZM19.5 5.5L18 17.5H22L23.5 5.5H19.5Z" />
                </svg>
                WINDOWS
              </a>
              <a
                href="https://github.com/KeeganFargher/YASCAR/releases/latest/download/YASCAR_0.1.0_x64.dmg"
                className="btn-bl-secondary text-xl px-10 py-5 flex items-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                </svg>
                MACOS
              </a>
              <a
                href="https://github.com/KeeganFargher/YASCAR/releases/latest/download/YASCAR_0.1.0_amd64.AppImage"
                className="btn-bl-secondary text-xl px-10 py-5 flex items-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02 0-.038-.002-.059v.003l-.001.026c0 .038-.002.076-.004.114v-.001c-.022.251-.092.503-.227.737-.134.234-.313.425-.535.57a1.53 1.53 0 01-.607.16 1.47 1.47 0 01-.664-.16 1.6 1.6 0 01-.497-.395 1.86 1.86 0 01-.346-.527 1.716 1.716 0 01-.138-.666c.001-.2.024-.398.071-.59a1.64 1.64 0 01.2-.472 1.4 1.4 0 01.353-.399c.136-.105.29-.2.457-.274a1.24 1.24 0 01.456-.09c.053 0 .107.002.16.007h.005l-.001-.001zm5.087 4.122c.16 0 .315.065.506.265.168.165.265.398.391.666.126.265.183.601.221.959.037.356.063.737.063 1.14v.004l-.004 1.18c-.027.404-.09.74-.175 1.112-.08.351-.175.665-.367.897-.194.23-.433.337-.707.337-.274 0-.506-.106-.727-.306-.219-.2-.388-.467-.547-.798a4.694 4.694 0 01-.337-1.048 5.39 5.39 0 01-.132-1.253c0-.398.027-.798.068-1.191.041-.393.107-.733.212-1.012.105-.286.227-.531.399-.711.17-.184.352-.24.566-.24h.05v-.001zm-10.37.044h.001c.213 0 .396.082.58.266a1.4 1.4 0 01.397.664c.097.265.158.591.201.94.043.35.075.727.075 1.14v.004l-.003 1.12c-.024.402-.09.737-.175 1.11-.08.35-.175.665-.367.897-.195.23-.434.337-.707.337-.275 0-.507-.107-.728-.307-.22-.2-.388-.467-.547-.798-.16-.332-.269-.698-.337-1.048a5.39 5.39 0 01-.132-1.253c0-.398.027-.798.068-1.19.041-.394.107-.733.212-1.012.105-.287.227-.532.4-.712.17-.184.351-.24.565-.24h.05v.001zm2.846 1.067c.211-.001.397.082.584.266.166.166.265.399.391.665.125.265.183.602.22.959.04.356.065.738.065 1.14v.004l-.004 1.18c-.027.403-.09.738-.175 1.11-.08.351-.175.665-.366.897-.195.23-.434.337-.708.337-.274 0-.506-.107-.727-.306-.22-.2-.389-.467-.547-.798a4.595 4.595 0 01-.338-1.048 5.39 5.39 0 01-.132-1.253c0-.399.028-.798.068-1.191.041-.393.107-.733.212-1.012.106-.286.227-.531.4-.711.17-.184.352-.24.566-.24h.05v.001h.001z" />
                </svg>
                LINUX
              </a>
            </div>

            <p className="text-sm text-bl-gray">
              Version 0.1.0 · Requires Windows 10+, macOS 12+, or Ubuntu 22.04+
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-bl-gray-dark">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-bl-yellow flex items-center justify-center border-2 border-black text-black font-display text-sm">
                Y
              </div>
              <span className="font-display text-lg tracking-widest text-white">
                YASCAR
              </span>
            </div>
            <p className="text-sm text-bl-gray-light text-center">
              © 2026 YASCAR. Not affiliated with Gearbox Software or 2K Games.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-bl-gray-light hover:text-bl-yellow transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
