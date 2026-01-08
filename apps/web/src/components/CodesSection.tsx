import { useState, useEffect } from 'react';
import { ApiResponse, ShiftCode } from '@yascar/types';

export function CodesSection() {
    const [codes, setCodes] = useState<ShiftCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    useEffect(() => {
        const fetchCodes = async () => {
            try {
                const response = await fetch('https://shift.keeganfargher.co.za/shift-codes.json');
                const data: ApiResponse = await response.json();
                setCodes(data.codes);
            } catch (err) {
                console.error('Failed to fetch codes:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCodes();
    }, []);

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const filteredCodes = codes.filter(code => {
        if (filter === 'all') return true;
        // Simple string matching for filtering
        return code.games.some(g => g.toLowerCase().includes(filter.toLowerCase()));
    });

    // Get unique game titles for filter buttons (simplified logic)
    const filters = [
        { id: 'all', label: 'ALL GAMES' },
        { id: 'borderlands 4', label: 'BL4' },
        { id: 'borderlands 3', label: 'BL3' },
        { id: 'wonderlands', label: 'TTW' },
        { id: 'borderlands 2', label: 'BL2' },
        { id: 'pre-sequel', label: 'TPS' },
    ];

    return (
        <section id="latest-codes" className="py-24 bg-bl-black relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-bl-yellow/5 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <div className="inline-block px-3 py-1 bg-bl-yellow/20 border border-bl-yellow/50 mb-4 rounded-sm">
                            <span className="font-display text-xs tracking-widest text-bl-yellow animate-pulse">
                                ● LIVE FEED
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display text-white text-cel">
                            LATEST <span className="text-bl-yellow">SHIFT CODES</span>
                        </h2>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2">
                        {filters.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                className={`px-4 py-2 font-display text-sm tracking-widest border-2 transition-all duration-200 clip-polygon-hexagon
                                    ${filter === f.id
                                        ? 'bg-bl-yellow text-black border-bl-yellow shadow-glow-yellow'
                                        : 'bg-transparent text-bl-gray-light border-bl-gray-dark hover:border-bl-yellow hover:text-white'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Codes Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-4 border-bl-yellow border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCodes.slice(0, 9).map((code) => (
                            <div
                                key={code.code}
                                className="group relative bg-bl-black-card border-3 border-bl-gray-dark hover:border-bl-yellow transition-all duration-300 hover:-translate-y-1 shadow-cel"
                            >
                                {/* Reward Strip */}
                                <div className="absolute top-0 right-0 bg-bl-gray-dark px-3 py-1 z-10 border-b-2 border-l-2 border-black/50">
                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                        {code.reward?.split('keys')[0].trim() || 'Reward'}
                                    </span>
                                </div>

                                <div className="p-6">
                                    {/* Game Badges */}
                                    <div className="flex flex-wrap gap-2 mb-4 pr-16">
                                        {code.games.slice(0, 2).map(g => (
                                            <span key={g} className="text-[10px] uppercase font-bold text-bl-yellow/80 bg-bl-yellow/10 px-2 py-0.5 rounded">
                                                {g.replace('Borderlands', 'BL').replace("Tiny Tina's Wonderlands", 'TTW')}
                                            </span>
                                        ))}
                                        {code.games.length > 2 && (
                                            <span className="text-[10px] uppercase font-bold text-bl-gray-light px-1">
                                                +{code.games.length - 2}
                                            </span>
                                        )}
                                    </div>

                                    {/* Code Display */}
                                    <div className="bg-black/50 border-2 border-bl-gray-dark p-3 mb-4 font-mono text-center text-lg tracking-wider text-white group-hover:text-bl-yellow group-hover:border-bl-yellow/50 transition-colors">
                                        {code.code}
                                    </div>

                                    {/* Copy Button */}
                                    <button
                                        onClick={() => handleCopy(code.code)}
                                        className={`w-full py-2 font-display text-lg tracking-wide border-2 transition-all duration-200 uppercase
                                            ${copiedCode === code.code
                                                ? 'bg-bl-green border-bl-green text-black'
                                                : 'bg-bl-gray hover:bg-white hover:text-black border-transparent text-white'
                                            }`}
                                    >
                                        {copiedCode === code.code ? 'COPIED!' : 'COPY CODE'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-12 text-center">
                    <p className="text-bl-gray-light text-sm mb-4">
                        * Only showing the latest codes. Download the app for the full history and auto-redemption.
                    </p>
                    <a href="#download" className="inline-flex items-center gap-2 text-bl-yellow font-display tracking-widest hover:underline">
                        DOWNLOAD YASCAR FOR AUTO-REDEMPTION →
                    </a>
                </div>
            </div>
        </section>
    );
}
