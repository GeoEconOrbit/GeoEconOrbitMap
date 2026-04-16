import React from 'react';
import { X, Microchip, Radio, Rocket } from 'lucide-react';
import { LEADERS, FINANCIALS, SEMICONDUCTOR_FABS, NUCLEAR_SITES, SPACE_CENTERS, COUNTRY_RESOURCES } from '../constants';
import { LeaderData } from '../types';

interface CountryDetailPanelProps {
  selectedCountry: string | null;
  countryPanelOpen: boolean;
  setCountryPanelOpen: (open: boolean) => void;
  isUiMinimized: boolean;
}

export const CountryDetailPanel = React.memo(({ 
  selectedCountry, 
  countryPanelOpen, 
  setCountryPanelOpen, 
  isUiMinimized 
}: CountryDetailPanelProps) => {
  if (!selectedCountry) return null;

  let countryData: LeaderData;
  let financial: any;

  if (selectedCountry.startsWith('GENERIC_')) {
    const parts = selectedCountry.split('_');
    countryData = {
      name: parts[1],
      flag: parts[2],
      leader: 'Intelligence Unavailable',
      title: 'Strategic Sector',
      party: 'N/A',
      since: 'N/A',
      gdp: 'N/A',
      strategic_note: 'No detailed intelligence available for this sector.'
    };
  } else {
    countryData = LEADERS[selectedCountry];
    financial = FINANCIALS[selectedCountry];
  }

  if (!countryData) return null;

  return (
    <div className={`absolute top-0 right-0 h-full w-96 bg-luxury-black/95 border-l border-luxury-gold/30 z-[1000] backdrop-blur-2xl transition-all duration-500 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] flex flex-col ${countryPanelOpen && !isUiMinimized ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-8 border-b border-luxury-gold/20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-4xl drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">{countryData.flag}</span>
          <div>
            <h2 className="text-2xl font-light tracking-widest uppercase">{countryData.name}</h2>
            <div className="text-[10px] tracking-[0.3em] text-luxury-gold uppercase opacity-60">Strategic Profile</div>
          </div>
        </div>
        <button onClick={() => setCountryPanelOpen(false)} className="text-luxury-gold hover:rotate-90 transition-transform duration-300">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
        {/* Leader Section */}
        <section>
          <h3 className="text-[10px] tracking-[0.4em] uppercase opacity-40 mb-4">Leadership</h3>
          <div className="bg-luxury-gold/5 border border-luxury-gold/10 p-4">
            <div className="text-xl font-light mb-1">{countryData.leader}</div>
            <div className="text-[10px] text-luxury-gold uppercase tracking-widest mb-3">{countryData.title}</div>
            <div className="grid grid-cols-2 gap-4 text-[10px] tracking-wider">
              <div>
                <div className="opacity-40 uppercase mb-1">Party</div>
                <div>{countryData.party}</div>
              </div>
              <div>
                <div className="opacity-40 uppercase mb-1">Since</div>
                <div>{countryData.since}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Financials Section */}
        <section>
          <h3 className="text-[10px] tracking-[0.4em] uppercase opacity-40 mb-4">Financials</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-luxury-gold/10">
              <div className="text-[9px] opacity-40 uppercase mb-1">GDP</div>
              <div className="text-lg font-light">{countryData.gdp}</div>
            </div>
            <div className="p-4 border border-luxury-gold/10">
              <div className="text-[9px] opacity-40 uppercase mb-1">Debt/GDP</div>
              <div className="text-lg font-light">{countryData.debt_gdp || countryData.debt}</div>
            </div>
          </div>
          {financial && (
            <div className="mt-4 p-4 border border-luxury-gold/10 text-[11px] font-light italic opacity-70">
              {financial.note}
            </div>
          )}
        </section>

        {/* Resources Section */}
        <section>
          <h3 className="text-[10px] tracking-[0.4em] uppercase opacity-40 mb-4">Strategic Assets</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border-b border-luxury-gold/5">
              <span className="text-[11px] opacity-60">Primary Resource</span>
              <span className="text-[11px] text-luxury-gold">{countryData.main_resource || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between p-3 border-b border-luxury-gold/5">
              <span className="text-[11px] opacity-60">Military Budget</span>
              <span className="text-[11px] text-luxury-gold">{countryData.military_budget || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between p-3 border-b border-luxury-gold/5">
              <span className="text-[11px] opacity-60">Nuclear Capable</span>
              <span className="text-[11px]">{countryData.nuclear ? 'YES' : 'NO'}</span>
            </div>
          </div>
        </section>

        {/* Geopolitics Section */}
        <section>
          <h3 className="text-[10px] tracking-[0.4em] uppercase opacity-40 mb-4">Geopolitics</h3>
          <div className="space-y-4">
            <div>
              <div className="text-[9px] opacity-40 uppercase mb-2">Key Allies</div>
              <div className="flex flex-wrap gap-2">
                {countryData.allies && countryData.allies.length > 0 ? countryData.allies.map((a: string) => (
                  <span key={a} className="px-2 py-1 bg-luxury-gold/10 border border-luxury-gold/20 text-[9px] tracking-widest">{a}</span>
                )) : <span className="text-[9px] opacity-20 italic">None identified</span>}
              </div>
            </div>
            <div>
              <div className="text-[9px] opacity-40 uppercase mb-2">Primary Rivals</div>
              <div className="flex flex-wrap gap-2">
                {countryData.rivals && countryData.rivals.length > 0 ? countryData.rivals.map((r: string) => (
                  <span key={r} className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-[9px] tracking-widest text-red-400">{r}</span>
                )) : <span className="text-[9px] opacity-20 italic">None identified</span>}
              </div>
            </div>
          </div>
        </section>

        {/* Infrastructure Section */}
        <section>
          <h3 className="text-[10px] tracking-[0.4em] uppercase opacity-40 mb-4">Infrastructure Nodes</h3>
          <div className="space-y-2">
            {SEMICONDUCTOR_FABS.filter(f => f.co === countryData.name || f.co === selectedCountry).map(f => (
              <div key={f.name} className="p-3 border border-cyan-500/20 bg-cyan-500/5 text-[10px]">
                <div className="text-cyan-400 font-bold mb-1 flex items-center gap-2">
                  <Microchip size={12} /> FAB: {f.name}
                </div>
                <div className="opacity-60">{f.d}</div>
              </div>
            ))}
            {NUCLEAR_SITES.filter(s => s.co === countryData.name || s.co === selectedCountry).map(s => (
              <div key={s.name} className="p-3 border border-yellow-500/20 bg-yellow-500/5 text-[10px]">
                <div className="text-yellow-400 font-bold mb-1 flex items-center gap-2">
                  <Radio size={12} /> NUCLEAR: {s.name}
                </div>
                <div className="opacity-60">{s.d}</div>
              </div>
            ))}
            {SPACE_CENTERS.filter(c => c.co === countryData.name || c.co === selectedCountry).map(c => (
              <div key={c.name} className="p-3 border border-orange-500/20 bg-orange-500/5 text-[10px]">
                <div className="text-orange-400 font-bold mb-1 flex items-center gap-2">
                  <Rocket size={12} /> SPACE: {c.name}
                </div>
                <div className="opacity-60">{c.d}</div>
              </div>
            ))}
            {SEMICONDUCTOR_FABS.filter(f => f.co === countryData.name || f.co === selectedCountry).length === 0 && 
             NUCLEAR_SITES.filter(s => s.co === countryData.name || s.co === selectedCountry).length === 0 &&
             SPACE_CENTERS.filter(c => c.co === countryData.name || c.co === selectedCountry).length === 0 && (
              <div className="text-[10px] opacity-20 italic p-4 text-center border border-luxury-gold/5">
                No strategic infrastructure nodes detected in this sector.
              </div>
            )}
          </div>
        </section>

        <div className="p-4 bg-luxury-gold/5 border border-luxury-gold/10 text-[10px] leading-relaxed opacity-60">
          <span className="text-luxury-gold font-bold uppercase mr-2">Intelligence Note:</span>
          {countryData.strategic_note || 'No additional strategic notes for this sector.'}
        </div>
      </div>
    </div>
  );
});
