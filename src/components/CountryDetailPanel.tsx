import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    <AnimatePresence>
      {countryPanelOpen && !isUiMinimized && (
        <motion.div 
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute top-4 right-4 bottom-4 w-[420px] glass-panel-strong rounded-2xl z-[1000] flex flex-col"
        >
      {/* Header */}
      <div className="p-6 border-b border-geo-border/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-geo-accent/10 border border-geo-accent/20 flex items-center justify-center text-3xl">
            {countryData.flag}
          </div>
          <div>
            <h2 className="text-xl font-bold font-display tracking-wide">{countryData.name}</h2>
            <div className="text-[10px] tracking-[0.15em] text-geo-accent uppercase font-medium mt-0.5">Strategic Profile</div>
          </div>
        </div>
        <button onClick={() => setCountryPanelOpen(false)} className="p-2 rounded-xl hover:bg-geo-danger/10 text-geo-text-muted hover:text-geo-danger transition-all duration-300">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {/* Leader Section */}
        <section>
          <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-geo-text-muted mb-3">Leadership</h3>
          <div className="p-4 rounded-xl bg-geo-accent/5 border border-geo-accent/10">
            <div className="text-lg font-semibold mb-0.5">{countryData.leader}</div>
            <div className="text-[11px] text-geo-accent font-medium uppercase tracking-wider mb-3">{countryData.title}</div>
            <div className="grid grid-cols-2 gap-4 text-[11px]">
              <div>
                <div className="text-geo-text-muted text-[9px] uppercase mb-0.5">Party</div>
                <div className="font-medium">{countryData.party}</div>
              </div>
              <div>
                <div className="text-geo-text-muted text-[9px] uppercase mb-0.5">Since</div>
                <div className="font-medium">{countryData.since}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Financials */}
        <section>
          <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-geo-text-muted mb-3">Economics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-geo-border bg-geo-surface/50">
              <div className="text-[9px] text-geo-text-muted uppercase mb-1">GDP</div>
              <div className="text-lg font-bold text-gradient">{countryData.gdp}</div>
            </div>
            <div className="p-4 rounded-xl border border-geo-border bg-geo-surface/50">
              <div className="text-[9px] text-geo-text-muted uppercase mb-1">Debt/GDP</div>
              <div className="text-lg font-bold">{countryData.debt_gdp || countryData.debt || 'N/A'}</div>
            </div>
          </div>
          {financial && (
            <div className="mt-3 p-3 rounded-xl border border-geo-border text-[11px] text-geo-text-dim italic">
              {financial.note}
            </div>
          )}
        </section>

        {/* Strategic Assets */}
        <section>
          <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-geo-text-muted mb-3">Strategic Assets</h3>
          <div className="space-y-2">
            {[
              { label: 'Primary Resource', value: countryData.main_resource || 'Unknown' },
              { label: 'Military Budget', value: countryData.military_budget || 'Unknown' },
              { label: 'Nuclear Capable', value: countryData.nuclear ? 'YES' : 'NO' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border border-geo-border/50 bg-geo-surface/30">
                <span className="text-[11px] text-geo-text-dim">{item.label}</span>
                <span className={`text-[11px] font-semibold ${item.value === 'YES' ? 'text-geo-danger' : item.value === 'NO' ? 'text-geo-success' : 'text-geo-accent'}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Geopolitics */}
        <section>
          <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-geo-text-muted mb-3">Geopolitics</h3>
          <div className="space-y-4">
            <div>
              <div className="text-[9px] text-geo-text-muted uppercase mb-2">Key Allies</div>
              <div className="flex flex-wrap gap-2">
                {countryData.allies && countryData.allies.length > 0 ? countryData.allies.map((a: string) => (
                  <span key={a} className="px-3 py-1.5 bg-geo-accent/10 border border-geo-accent/20 rounded-lg text-[10px] font-medium text-geo-accent">{a}</span>
                )) : <span className="text-[10px] text-geo-text-muted italic">None identified</span>}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-geo-text-muted uppercase mb-2">Primary Rivals</div>
              <div className="flex flex-wrap gap-2">
                {countryData.rivals && countryData.rivals.length > 0 ? countryData.rivals.map((r: string) => (
                  <span key={r} className="px-3 py-1.5 bg-geo-danger/10 border border-geo-danger/20 rounded-lg text-[10px] font-medium text-geo-danger">{r}</span>
                )) : <span className="text-[10px] text-geo-text-muted italic">None identified</span>}
              </div>
            </div>
          </div>
        </section>

        {/* Infrastructure Nodes */}
        <section>
          <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-geo-text-muted mb-3">Infrastructure Nodes</h3>
          <div className="space-y-2">
            {SEMICONDUCTOR_FABS.filter(f => f.co === countryData.name || f.co === selectedCountry).map(f => (
              <div key={f.name} className="p-3 rounded-xl border border-geo-cyan/20 bg-geo-cyan/5">
                <div className="text-geo-cyan font-bold text-[11px] mb-1 flex items-center gap-2">
                  <Microchip size={12} /> FAB: {f.name}
                </div>
                <div className="text-[10px] text-geo-text-dim">{f.d}</div>
              </div>
            ))}
            {NUCLEAR_SITES.filter(s => s.co === countryData.name || s.co === selectedCountry).map(s => (
              <div key={s.name} className="p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                <div className="text-yellow-400 font-bold text-[11px] mb-1 flex items-center gap-2">
                  <Radio size={12} /> NUCLEAR: {s.name}
                </div>
                <div className="text-[10px] text-geo-text-dim">{s.d}</div>
              </div>
            ))}
            {SPACE_CENTERS.filter(c => c.co === countryData.name || c.co === selectedCountry).map(c => (
              <div key={c.name} className="p-3 rounded-xl border border-orange-500/20 bg-orange-500/5">
                <div className="text-orange-400 font-bold text-[11px] mb-1 flex items-center gap-2">
                  <Rocket size={12} /> SPACE: {c.name}
                </div>
                <div className="text-[10px] text-geo-text-dim">{c.d}</div>
              </div>
            ))}
            {SEMICONDUCTOR_FABS.filter(f => f.co === countryData.name || f.co === selectedCountry).length === 0 && 
             NUCLEAR_SITES.filter(s => s.co === countryData.name || s.co === selectedCountry).length === 0 &&
             SPACE_CENTERS.filter(c => c.co === countryData.name || c.co === selectedCountry).length === 0 && (
              <div className="text-[11px] text-geo-text-muted italic p-4 text-center rounded-xl border border-geo-border/50">
                No strategic infrastructure nodes detected.
              </div>
            )}
          </div>
        </section>

        {/* Strategic Note */}
        <div className="p-4 rounded-xl bg-geo-accent/5 border border-geo-accent/10 text-[11px] leading-relaxed text-geo-text-dim">
          <span className="text-geo-accent font-bold uppercase mr-2">Intel Note:</span>
          {countryData.strategic_note || 'No additional strategic notes.'}
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
  );
});
