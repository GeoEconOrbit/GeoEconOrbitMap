import React from 'react';
import { X, TrendingUp, Shield, Zap, Globe } from 'lucide-react';

interface StrategicAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StrategicAnalysis = ({ isOpen, onClose }: StrategicAnalysisProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-luxury-black/90 backdrop-blur-xl p-10">
      <div className="w-full max-w-6xl h-full bg-luxury-black border border-luxury-gold/30 shadow-[0_0_100px_rgba(212,175,55,0.1)] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-luxury-gold/20 flex items-center justify-between bg-luxury-gold/5">
          <div className="flex items-center gap-4">
            <TrendingUp className="text-luxury-gold" />
            <h2 className="text-xl font-light tracking-[0.5em] uppercase">Strategic Analysis Terminal</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-red-500/20 hover:text-red-500 transition-all duration-300 border border-transparent hover:border-red-500/30 group"
            title="Close Terminal"
          >
            <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-3 gap-10 custom-scrollbar">
          {/* Risk Heatmap Simulation */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xs tracking-[0.3em] uppercase opacity-40">Global Risk Distribution</h3>
            <div className="aspect-video bg-luxury-gray/30 border border-luxury-gold/10 relative overflow-hidden p-4">
              <div className="absolute inset-0 opacity-20 bg-[url('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/0/0/0.png')] bg-cover"></div>
              <div className="relative h-full w-full flex items-center justify-center">
                <div className="w-64 h-64 rounded-full bg-red-500/20 blur-3xl animate-pulse"></div>
                <div className="w-48 h-48 rounded-full bg-orange-500/20 blur-3xl animate-pulse delay-700 absolute top-10 left-20"></div>
                <div className="w-32 h-32 rounded-full bg-yellow-500/20 blur-3xl animate-pulse delay-1000 absolute bottom-20 right-40"></div>
                <div className="text-[10px] font-mono text-luxury-gold/60 absolute top-4 left-4">SCANNING_SECTOR_7G...</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border border-luxury-gold/10 bg-luxury-gold/5">
                <div className="text-[8px] opacity-40 uppercase mb-1">Kinetic Probability</div>
                <div className="text-2xl font-light text-red-500">84.2%</div>
              </div>
              <div className="p-4 border border-luxury-gold/10 bg-luxury-gold/5">
                <div className="text-[8px] opacity-40 uppercase mb-1">Market Stability</div>
                <div className="text-2xl font-light text-orange-500">Critical</div>
              </div>
              <div className="p-4 border border-luxury-gold/10 bg-luxury-gold/5">
                <div className="text-[8px] opacity-40 uppercase mb-1">Cyber Exposure</div>
                <div className="text-2xl font-light text-green-500">Nominal</div>
              </div>
            </div>
          </div>

          {/* Statistics & Insights */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs tracking-[0.3em] uppercase opacity-40">Sector Analysis</h3>
              {[
                { label: 'Energy Security', val: 78, color: 'bg-luxury-gold' },
                { label: 'Maritime Trade', val: 45, color: 'bg-red-500' },
                { label: 'Air Superiority', val: 92, color: 'bg-green-500' },
                { label: 'Cyber Resilience', val: 64, color: 'bg-cyan-500' }
              ].map(s => (
                <div key={s.label} className="space-y-1">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest">
                    <span>{s.label}</span>
                    <span>{s.val}%</span>
                  </div>
                  <div className="h-1 bg-luxury-gold/10 w-full">
                    <div className={`h-full ${s.color}`} style={{ width: `${s.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border border-luxury-gold/20 bg-luxury-gold/5 space-y-4">
              <div className="flex items-center gap-2 text-luxury-gold">
                <Shield size={16} />
                <span className="text-[10px] font-bold tracking-widest uppercase">Strategic Recommendation</span>
              </div>
              <p className="text-xs font-light leading-relaxed opacity-70 italic">
                "Current multipolar friction suggests a shift in naval deployment towards the Indo-Pacific. 
                Energy pipelines in Sector 4 remain vulnerable to asymmetric disruption."
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs tracking-[0.3em] uppercase opacity-40">Live Telemetry</h3>
              <div className="font-mono text-[9px] space-y-2 opacity-60">
                <div className="flex justify-between"><span>SATELLITE_LINK</span><span className="text-green-500">ACTIVE</span></div>
                <div className="flex justify-between"><span>ENCRYPTION_KEY</span><span>RSA_4096</span></div>
                <div className="flex justify-between"><span>DATA_LATENCY</span><span>14ms</span></div>
                <div className="flex justify-between"><span>THREAT_DETECTION</span><span className="text-red-500">HIGH</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-luxury-gold/10 bg-luxury-black text-[9px] tracking-[0.5em] text-center opacity-30">
          CONFIDENTIAL // LUXURY INTELLIGENCE PROTOCOL // EYES ONLY
        </div>
      </div>
    </div>
  );
};
